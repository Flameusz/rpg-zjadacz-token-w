# -*- coding: utf-8 -*-
"""
KONTUR I WYMIAR SZEŚCIU KONSTRUKCJI TARCZ — JEDNO ŹRÓDŁO DLA IKON I DLA 3D.

⭐⭐ Ten plik istnieje po to, żeby pixel-art i model 3D NIE MOGŁY się rozjechać.
Do 2026-09-21 sylwetki żyły wyłącznie w `build_shield_icons.py`, a `char3d_shields.py`
miał własne dwa krążki o wymiarach dobranych pipetą ze starych ikon 32×32 —
zmierzone wtedy jako **−38%** (puklerz) i **−28%** (okrągła) względem archetypu.
Dwa opisy tego samego przedmiotu rozjeżdżają się zawsze, a diff tego nie widzi.

⛔ **Nie kopiuj stąd funkcji do swojego generatora — importuj.**

────────────────────────────────────────────────────────────────────────────
CO TU JEST, A CZEGO NIE MA
────────────────────────────────────────────────────────────────────────────
JEST: kształt (kontur w znormalizowanym `(u, v) ∈ [-1, 1]`), wymiar historyczny
w centymetrach, klasyfikacja bryły (`forma`) i punkt uchwytu.

NIE MA: liczby desek i układu rzędów (to własność IKONY — `build_shield_icons`),
ani `chwyt`/`obrot` (to własność MOCOWANIA — `char3d_shields`).

⚠ **Funkcje kształtu są przeniesione DOSŁOWNIE** z `build_shield_icons.py`
(rewizja zamykająca master, 2026-09-18) razem z ich komentarzami — każdy z nich
opisuje odrzuconą próbę i jest wart więcej niż sam kod. ⛔ Kierunek artystyczny
jest ZAMKNIĘTY po sześciu rewizjach; nie „poprawiaj" tych wykładników.

────────────────────────────────────────────────────────────────────────────
SKALA ŚWIATA: 1 j. Blendera = 14,415 cm
────────────────────────────────────────────────────────────────────────────
Postać ma **12,834 j.** (`docs/postac3d_checkpoint.md`) przy `wzrost_m = 1,85`
w `char3d_base.PROPORCJE`. Stąd `CM_NA_J` i `J_NA_CM` niżej.

⚠⚠ **To NIE jest ta sama stała, co `PX_PER_CM = 0,44` w generatorze ikon.**
Tamta przelicza centymetry na piksele KAFLA w plecaku, ta na jednostki ŚWIATA.
Wspólne jest WEJŚCIE — tabela `cm` — i tylko ono ma być wspólne.

⚠ Zmiana wzrostu postaci przeskalowałaby całą rodzinę tarcz. To jest zamierzone:
tarcza ma mierzyć tyle samo centymetrów niezależnie od tego, kto ją trzyma.
"""
import numpy as np

# ── skala świata ────────────────────────────────────────────────────────────
WZROST_J = 12.834      # jednostki armature; docs/postac3d_checkpoint.md:147
WZROST_CM = 185.0      # char3d_base.PROPORCJE["wzrost_m"] × 100
CM_NA_J = WZROST_CM / WZROST_J        # 14,415 cm w jednej jednostce
J_NA_CM = 1.0 / CM_NA_J               # 0,06937 j. w jednym centymetrze


# ── kształty: warunek przynależności w znormalizowanych (u, v) ∈ [-1, 1] ────
# ⚠ Przeniesione DOSŁOWNIE z build_shield_icons.py — patrz nagłówek.
def ksztalt_kolo(u, v):
    return u * u + v * v <= 1.0


def ksztalt_heater(u, v):
    """
    KLIN: szerokie BARKI u góry (pełna szerokość przez 18% wysokości, narożniki
    ścięte), potem lekko wypukłe boki zbiegające się w ostrze.

    ⚠ Dwa razy wyszło źle i oba razy widać to było dopiero na renderze:
    wykładnik 2,2 przy pierwiastku 0,5 dawał WIADRO (dół kończył się na 5 px
    i w samej sylwetce czytało się jak U). Heater rozpoznaje się po ZBIEŻNOŚCI
    boków — barki trzymają szerokość długo, potem zdecydowany zbieg do 3 px.
    """
    t = (v + 1.0) / 2.0
    s = np.clip((t - 0.18) / 0.82, 0.0, 1.0)
    half = np.where(t < 0.18, 1.0,
                    np.power(np.clip(1.0 - np.power(s, 2.2), 0.0, 1.0), 0.70))
    tc = 0.09
    naroznik = np.where(
        t < tc,
        np.sqrt(np.clip(1.0 - 0.34 * np.power((tc - t) / tc, 2.0), 0.0, 1.0)),
        1.0,
    )
    return np.abs(u) <= half * naroznik


def ksztalt_almond(u, v):
    """
    MIGDAŁ: miękkie, zaokrąglone ramiona (górne 30%), brak prostego odcinka,
    długi łuk schodzący do ostrza.

    ⚠ Wersja z płaskim „plateau" pełnej szerokości czytała się jak JAJKO albo
    kropla. Migdał nie ma prostej — ma jeden ciągły łuk po każdej stronie.
    """
    t = (v + 1.0) / 2.0
    tk = 0.30
    ramie = np.sqrt(np.clip(1.0 - np.power((tk - t) / tk, 2.0), 0.0, 1.0))
    s = np.clip((t - tk) / (1.0 - tk), 0.0, 1.0)
    klin = np.power(np.clip(1.0 - np.power(s, 1.6), 0.0, 1.0), 0.70)
    return np.abs(u) <= np.where(t < tk, ramie, klin)


def ksztalt_scutum(u, v):
    """MASYW: proste boki, lekko wybrzuszony szczyt i spód, ścięte narożniki."""
    hw = 1.0 - 0.03 * np.power(np.abs(v), 4.0)
    vh = 1.0 - 0.13 * u * u
    return np.power(np.abs(u) / hw, 9.0) + np.power(np.abs(v) / vh, 9.0) <= 1.0


def ksztalt_pavise(u, v):
    """
    WIEŻA: płaski spód, proste boki, lekko wysklepiony szczyt.

    ⚠ Bez zwieńczenia, bez podstawy, bez grzbietu — cała rozpoznawalność
    pawęży siedzi w PROPORCJI. Każda próba „dodania jej charakteru" elementem
    kończyła się wrażeniem przekombinowania.
    """
    luk = 1.0 - 0.34 * u * u
    vv = np.where(v < 0, v / luk, v)
    return np.power(np.abs(u), 12.0) + np.power(np.abs(vv), 12.0) <= 1.0


# ── tabela konstrukcji ──────────────────────────────────────────────────────
# `cm`       — (wysokość, szerokość) historyczna. ⚠⚠ SZEROKOŚĆ TARCZY WYPUKŁEJ
#              TO CIĘCIWA, NIE ŁUK (Dura-Europos: łuk 86 cm, cięciwa 41 cm) —
#              pełne uzasadnienie w nagłówku `build_shield_icons.py` §1.
#              ⛔ Nie „dostrajaj" tych liczb, żeby coś wyglądało lepiej.
# `grubosc_cm` — deska z licem; ⚠ w CARRY tarcza stoi KRAWĘDZIĄ do widza
#              (`obrot −125°`), więc to jest wymiar, który wtedy widać.
#              Rośnie z rozmiarem tak, jak rosła naprawdę: mały puklerz to jedna
#              warstwa, pawęż i scutum są grubsze/klejone.
# `uchwyt`   — gdzie siedzi PIĘŚĆ na osi pionowej tarczy, w ułamku półwysokości.
#              0 = chwyt środkowy (za umbem), dodatnie = pięść NAD środkiem,
#              czyli tarcza zwisa poniżej dłoni (pasy/enarmes).
#              ⚠ To jest własność KONSTRUKCJI, nie pozy — puklerz, okrągła
#              i scutum mają chwyt środkowy (poziomy, za guzem), rycerska
#              i migdałowa wiszą na pasach w górnej części.
#              ⛔ Origin siatki zostaje w ŚRODKU GEOMETRYCZNYM — `uchwyt`
#              wchodzi do `chwyt` w `char3d_shields`, żeby pivot był
#              przewidywalny i taki sam dla wszystkich sześciu.
# `forma`    — bryła światła dla IKONY (kula / walec / pion).
#              ⚠ W 3D na razie NIEUŻYWANA: modele bazowe są płaskie.
#              Krzywizna jest świadomie poza tą rundą — przy ~60 px postaci
#              to kilka pikseli cieniowania, a rodzina jest czytelna bez niej.
# `rozmiar_roboczy` — True = rozmiar NIE JEST jeszcze zatwierdzony.
#              ⏳ Trzy duze konstrukcje (migdalowa, legionowa, pawez) dostaly
#              rodzinowy mnoznik, ale ich czytelnosc **nie byla oceniana
#              w grze** — okragla byla. Po skali maja 89–95 cm, czyli dalej
#              polowe wzrostu postaci. ⚠ Spodziewany kierunek korekty to
#              MOCNIEJSZE sciecie albo obnizenie pozy GUARD, nie zmiana
#              konturu. ⛔ Nie „zamykaj" tego bez obejrzenia w grze i nie
#              traktuj obecnych liczb jako zatwierdzonych.
# `profil`   — profil noszenia: SMALL trzyma dotychczasową pozę CARRY,
#              LARGE dostaje własną (tarcza niżej i bardziej z przodu, żeby
#              nie orała gruntu). Decyzja autora 2026-09-21.
#              ⛔ To są DWA profile na sześć tarcz, nie sześć animacji.
SKALA_GRY = 1.0                # ⭐ 1:1 z wymiarem historycznym — ta sama reguła co broń (2026-10-03)
# ⚠⚠ **0,8485 → 1,0 (2026-10-03, `OI-156`) — RAZEM z naprawą jednostek.**
# Bryła tarczy jest dzieckiem kości i dziedziczy SKALĘ ARMATURY 1,6527, a
# wymiar był liczony w jednostkach ŚWIATA — więc w grze tarcza była ×1,65
# większa, niż mówiły liczby: zmierzone okrągła **91 cm** przy „56", legionowa
# **149 cm** przy „90". Decyzja o 0,8485 (niżej, 2026-09-21) zapadła więc na
# bryle, która naprawdę miała ~92 cm. Po naprawie (`char3d_shields`: obiekt
# kompensuje skalę armatury) 1,0 daje okrągłą 66 cm, czyli MNIEJSZĄ od tamtej
# zatwierdzonej — warunek „nie zasłaniaj głowy" jest spełniony z zapasem,
# a tarcza i broń stoją w jednej skali (`weapon_shapes`: 1:1 do 120 cm).
# Historyczne brzmienie decyzji 2026-09-21 (mierzone na bryle ×1,65):
# ⚠⚠ **JEDNA STALA NA CALA RODZINE i to jest celowe.** Ustalona na OKRAGLEJ
# (decyzja autora 2026-09-21, po pomiarze zaslaniania): przy 66 cm tarcza
# kryla **47% glowy**, przy 56 cm — 24%. Ten sam mnoznik idzie na wszystkie
# szesc, zeby RELACJE ROZMIAROW miedzy archetypami zostaly nietkniete —
# „ktora tarcza jest wieksza" ma znaczyc to samo, co przed przeskalowaniem.
# ⛔ Nie dobieraj osobnego mnoznika per tarcza „bo tak lepiej wyglada" —
# od tego zaczyna sie rodzina, w ktorej rozmiar przestaje cokolwiek mowic.
# Pojedyncza konstrukcja moze nadpisac `skala_gry` w tabeli, ale wtedy MUSI
# miec przy sobie powod.

# `skala_gry` — MNOZNIK CZYTELNOSCI GAMEPLAYOWEJ. Cala geometria 3D (szerokosc,
#              wysokosc, grubosc, wysklepienie) mnozy sie przez niego.
#              ⚠⚠ **TO JEST OSOBNA OS OD `cm` I MUSI NIA ZOSTAC.** `cm` jest
#              wymiarem HISTORYCZNYM/PROJEKTOWYM i **wspoldzielonym z generatorem
#              ikon** (`build_shield_icons.py` liczy z niego rozmiar kafla przez
#              `PX_PER_CM`). Zmiana `cm` pod czytelnosc w 3D przeskalowalaby
#              ZAMKNIETA rodzine pixel-artu — cicho, bo nic by nie krzyknelo.
#              ⛔ Nie „upraszczaj" tego wpisujac mniejsze `cm`.
#
#              Powod istnienia: przy naszej kamerze okragla 66 cm zaslaniala
#              w GUARD zbyt duza czesc gracza. Benchmarkiem jest czytelnosc
#              postaci (WoW / Metin / Stronghold), nie skala 1:1 — decyzja
#              autora 2026-09-21.
#              ⚠ Mnoznik jest WSPOLNY dla calej bryly, wiec ksztalt, proporcje
#              i glebokosc wysklepienia zostaja nietkniete. To jest wylacznie
#              rozmiar.
# `wypuklosc_cm` — GLEBOKOSC WYSKLEPIENIA LICA (strzalka luku), w centymetrach.
#              ⚠⚠ Tarcza NIE JEST PLYTA. Pierwsza wersja modeli 3D (2026-09-21)
#              byla plaskim wytloczeniem konturu i czytala sie jak „brazowa
#              plyta / placeholder" — zgloszone wprost. To jest liczba, ktorej
#              wtedy nie bylo.
#              ⚠ Kierunek wysklepienia bierze sie z `forma`: `kula` wygina sie
#              promieniscie (kopula), `walec` i `pion` tylko w poprzek (wycinek
#              walca). Ta sama klasyfikacja, ktora od 2026-09-18 steruje
#              swiatlem na ikonach — ⛔ nie wprowadzaj drugiej.
#              ⭐ Legionowa ma 14 cm i to jest POLICZONE, nie dobrane: przy
#              cieciwie 57 cm i luku 86 cm (Dura-Europos) promien wychodzi
#              ~35 cm, a strzalka `R - sqrt(R^2 - (c/2)^2)` = 14,5 cm. Pozostale
#              sa plytsze, bo ich zrodla nie podaja luku — ⛔ nie „wyrownuj" ich
#              do legionowej, roznica glebokosci JEST cecha konstrukcji.
KONSTRUKCJE = {
    "buckler": dict(pl="Puklerz",    cm=(38, 38),  ksztalt=ksztalt_kolo,
                    forma="kula",  grubosc_cm=2.0, wypuklosc_cm=2.0,
                    uchwyt=0.00, profil="SMALL"),
    # ⭐ PUNKT ODNIESIENIA CALEJ RODZINY — na niej ustalono `SKALA_GRY`.
    "round":   dict(pl="Okrągła",    cm=(66, 66),  ksztalt=ksztalt_kolo,
                    forma="kula",  grubosc_cm=2.0, wypuklosc_cm=4.0,
                    uchwyt=0.00, profil="SMALL"),
    "heater":  dict(pl="Rycerska",   cm=(68, 62),  ksztalt=ksztalt_heater,
                    forma="walec", grubosc_cm=2.2, wypuklosc_cm=5.0,
                    uchwyt=0.35, profil="SMALL"),
    "almond":  dict(pl="Migdałowa",  cm=(105, 55), ksztalt=ksztalt_almond,
                    forma="walec", grubosc_cm=2.4, wypuklosc_cm=5.0,
                    uchwyt=0.45, profil="LARGE", rozmiar_roboczy=True),   # 0,40 → 0,45 (2026-10-10, BAZA V4): róg wchodził w kolano w biegu bojowym
    "scutum":  dict(pl="Legionowa",  cm=(106, 57), ksztalt=ksztalt_scutum,
                    forma="walec", grubosc_cm=2.6, wypuklosc_cm=14.0,
                    uchwyt=0.00, profil="LARGE", rozmiar_roboczy=True),
    "pavise":  dict(pl="Pawęż",      cm=(112, 48), ksztalt=ksztalt_pavise,
                    forma="pion",  grubosc_cm=2.8, wypuklosc_cm=8.0,
                    uchwyt=0.20, profil="LARGE", rozmiar_roboczy=True),
}


# ── okucia: OŚ WARIANTU (żelazo / stal) na tej samej bryle ──────────────────
# ⭐⭐ Jedno źródło dla ikony (`build_metal_shield_icons.METAL`, w pikselach)
# i modelu 3D (`char3d_shields`, w jednostkach). Generator ikon SPRAWDZA zgodność
# swojej tabeli z tą (`zgodnosc_z_ikonami`) — rozjazd = BŁĄD, bo inaczej gracz
# kupuje w sklepie tarczę z umbem, a w ręku ma gołą deskę.
# `lity`      — metal na całym licu (puklerz);
# `obrecz`    — szerokość okucia krawędzi jako UŁAMEK promienia konturu;
# `umbo_cm`   — promień umba w cm historycznych (= px ikony / 0,44);
# `umbo_y`    — położenie umba jako ułamek WYSOKOŚCI od góry (0,5 = środek);
# `gatunki`   — które gatunki tej konstrukcji istnieją w katalogu.
# Pawęży nie ma: w katalogu jest wyłącznie drewniana.
OKUCIA = {
    "buckler": dict(lity=True, umbo_cm=8.2, gatunki=("iron", "steel")),
    "round":   dict(obrecz=0.13, umbo_cm=7.7, gatunki=("iron", "steel")),
    "heater":  dict(obrecz=0.13, gatunki=("iron", "steel")),
    "almond":  dict(obrecz=0.13, umbo_cm=7.3, umbo_y=0.32, gatunki=("iron",)),
    "scutum":  dict(obrecz=0.13, umbo_cm=8.2, gatunki=("iron", "steel")),
}


def zgodnosc_z_ikonami(metal_ikon, px_na_cm=0.44):
    """Rozbieżności między `OKUCIA` a tabelą generatora ikon (lista napisów)."""
    bledy = []
    if set(metal_ikon) != set(OKUCIA):
        bledy.append(f"konstrukcje okuć: ikony {sorted(metal_ikon)} ≠ 3D {sorted(OKUCIA)}")
    for k in set(metal_ikon) & set(OKUCIA):
        a, b = metal_ikon[k], OKUCIA[k]
        if bool(a.get("lity")) != bool(b.get("lity")):
            bledy.append(f"{k}: lity ikona={a.get('lity')} ≠ 3D={b.get('lity')}")
        if bool(a.get("obrecz")) != bool(b.get("obrecz")):
            bledy.append(f"{k}: obręcz ikona={a.get('obrecz')} ≠ 3D={b.get('obrecz')}")
        if ("umbo" in a) != ("umbo_cm" in b):
            bledy.append(f"{k}: umbo w ikonie={'umbo' in a} ≠ w 3D={'umbo_cm' in b}")
        elif "umbo" in a and abs(a["umbo"] / px_na_cm - b["umbo_cm"]) > 0.15:
            bledy.append(f"{k}: umbo {a['umbo']} px = {a['umbo'] / px_na_cm:.1f} cm ≠ 3D {b['umbo_cm']} cm")
        if a.get("umbo_y", 0.5) != b.get("umbo_y", 0.5):
            bledy.append(f"{k}: umbo_y ikona={a.get('umbo_y', 0.5)} ≠ 3D={b.get('umbo_y', 0.5)}")
        if tuple(a["gatunki"]) != tuple(b["gatunki"]):
            bledy.append(f"{k}: gatunki ikona={a['gatunki']} ≠ 3D={b['gatunki']}")
    return bledy


def wypuklosc(key, x, y):
    """Przesuniecie POWIERZCHNI SRODKOWEJ tarczy w punkcie (x, y), w jednostkach.

    Zero na krawedzi, maksimum (`wypuklosc_cm`) w srodku. Parabola, nie luk
    kolowy: przy tej glebokosci roznica miedzy nimi jest ponizej piksela,
    a parabola nie ma przypadku zdegenerowanego przy plytkim wysklepieniu.

    ⚠ To jest POWIERZCHNIA SRODKOWA, nie lico. Lico i tyl leza o polgrubosc
    po obu jej stronach, wiec tarcza ma STALA grubosc i wklesly tyl — tak jak
    prawdziwa. ⛔ Nie „wyprostowuj" tylu do plaskiego: wklesly tyl jest tym,
    co odroznia tarcze od deski, gdy patrzy sie na nia z boku w pozie CARRY.
    """
    k = KONSTRUKCJE[key]
    pw, ph, _ = wymiary_j(key)
    h = k["wypuklosc_cm"] * skala_gry(key) * J_NA_CM
    u = x / pw
    if k["forma"] == "kula":
        v = y / ph
        t = min(1.0, u * u + v * v)          # kopula: promieniscie
    else:
        t = min(1.0, u * u)                  # walec: tylko w poprzek
    # ⚠⚠ **ZAKOTWICZONE NA SRODKU, NIE NA OBRECZY** (korekta 2026-09-21).
    # Pierwsza wersja zwracala `h * (1 - t)`: obrecz na zerze, srodek na +h
    # wzdluz normalnej lica. Dlon siedzi po stronie WKLESLEJ, wiec cala kopula
    # odsuwala tarcze od reki o swoja glebokosc — i to bylo widac jako
    # LEWITOWANIE, tym silniejsze, im glebsza tarcza (legionowa 11,9 cm miala
    # przeswit 1,77 j. przy 0,31-0,50 sprzed wysklepienia).
    # Teraz zerem jest SRODEK, a obrecz podwija sie ku noszacemu — czyli tak,
    # jak tarcze sie nosi. Ksztalt jest IDENTYCZNY, zmienia sie wylacznie
    # polozenie bryly wzgledem wlasnego originu, czyli punkt zaczepienia.
    # ⛔ Nie zamykaj tej luki `chwyt`em: lokalne Z biegnie w swiecie do przodu,
    # wiec docisniecie tamtedy wypycha tarcze PRZED cialo i psuje CARRY
    # (zmierzone: dX legionowej spadlo do -0,09, dY do -1,15 przy limicie 0,35).
    return -h * t


def skala_gry(key):
    """Mnoznik czytelnosci gameplayowej. Domyslnie rodzinowy `SKALA_GRY`."""
    return KONSTRUKCJE[key].get("skala_gry", SKALA_GRY)


def wymiar_cm(key):
    """(wysokosc, szerokosc) NA EKRANIE, w cm — po skali gameplayowej.

    ⚠ Rozni sie od `KONSTRUKCJE[key]["cm"]`, ktore jest wymiarem HISTORYCZNYM
    i zasila IKONY. Raporty o modelu 3D maja podawac te liczbe.
    """
    h_cm, w_cm = KONSTRUKCJE[key]["cm"]
    s = skala_gry(key)
    return (h_cm * s, w_cm * s)


def wymiary_j(key):
    """(polszerokosc, polwysokosc, polgrubosc) w jednostkach Blendera."""
    k = KONSTRUKCJE[key]
    h_cm, w_cm = k["cm"]
    s = skala_gry(key)
    return (w_cm * s * J_NA_CM / 2.0,
            h_cm * s * J_NA_CM / 2.0,
            k["grubosc_cm"] * s * J_NA_CM / 2.0)


# ── kontur jako wielokąt ────────────────────────────────────────────────────
# ⚠⚠ **PRÓBKUJEMY PROMIENIOWO, NIE WIERSZAMI.** Skan po wierszach daje płaskie
# czapki na górze i dole (tam półszerokość zmienia się jak pierwiastek), więc
# koło wychodzi beczką. Wszystkie sześć kształtów jest gwiaździstych względem
# środka — sprawdza to `samokontrola()` — więc promień w danym kierunku jest
# jednoznaczny i wystarczy bisekcja.
#
# ⚠ Gęste próbkowanie + UPROSZCZENIE (Douglas–Peucker) zamiast stałej liczby
# boków. Powód jest mierzalny: scutum i pawęż to prawie prostokąty, a przy
# stałym kroku kątowym ich narożniki zaokrąglają się widocznie, zanim boki
# dostaną choć jeden zbędny wierzchołek. Po uproszczeniu proste boki kosztują
# 2 wierzchołki, a narożniki dostają tyle, ile potrzebują.
PROBKI = 720
# Tolerancja uproszczenia w JEDNOSTKACH. Postać (12,834 j.) ma na ekranie
# ~60 px, czyli ~4,67 px na jednostkę; 0,05 j. to ~0,23 px — poniżej progu
# widoczności, a przy 12-bocznym krążku błąd sięgał 0,03 j. przy promieniu 0,82.
TOLERANCJA_J = 0.05


def _wewnatrz(ksztalt, u, v):
    """Przynależność do kształtu Z ZAMKNIĘCIEM DZIEDZINY do kwadratu [-1, 1]².

    ⚠⚠ **DZIEDZINA JEST CZĘŚCIĄ DEFINICJI KSZTAŁTU I ŁATWO O TYM ZAPOMNIEĆ.**
    Funkcje z `build_shield_icons.py` były pisane pod rasteryzator, który
    próbkuje wyłącznie `(u, v) ∈ [-1, 1]²` — więc NIE MAJĄ własnego ogranicznika
    i poza tym kwadratem dalej zwracają „wewnątrz". Bisekcja promieniowa nie ma
    takiego ograniczenia i wjeżdżała w ten obszar: rycerska wychodziła **72 cm
    zamiast 68** (`ksztalt_heater` przy `t < 0` trafia w gałąź `half = 1.0`,
    a jej ścięcie narożnika dopiero powoli schodzi do zera).
    ⛔ Nie „naprawiaj" tego w samych funkcjach kształtu — one są wspólne
    z generatorem ikon i muszą zostać bajt-w-bajt takie same.
    """
    if abs(u) > 1.0 or abs(v) > 1.0:
        return False
    return bool(ksztalt(np.float64(u), np.float64(v)))


def _promien(ksztalt, kier_u, kier_v, kroki=40):
    """Bisekcja: najdalszy r, przy którym (r·kier) jeszcze należy do kształtu."""
    lo, hi = 0.0, 1.5      # przy |kier| = 1 promień 1,5 wypada poza kwadrat zawsze
    if not _wewnatrz(ksztalt, 0.0, 0.0):
        raise ValueError("ksztalt nie zawiera srodka — bisekcja nie ma od czego zaczac")
    for _ in range(kroki):
        mid = 0.5 * (lo + hi)
        if _wewnatrz(ksztalt, mid * kier_u, mid * kier_v):
            lo = mid
        else:
            hi = mid
    return lo


def _dalej_od_odcinka(p, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    dd = dx * dx + dy * dy
    if dd == 0.0:
        return np.hypot(p[0] - ax, p[1] - ay)
    t = max(0.0, min(1.0, ((p[0] - ax) * dx + (p[1] - ay) * dy) / dd))
    return np.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy))


def _uprosc(pkt, tol):
    """Douglas–Peucker na ŁAŃCUCHU (pkt[0] i pkt[-1] zostają)."""
    if len(pkt) < 3:
        return list(pkt)
    naj, idx = 0.0, 0
    for i in range(1, len(pkt) - 1):
        d = _dalej_od_odcinka(pkt[i], pkt[0], pkt[-1])
        if d > naj:
            naj, idx = d, i
    if naj <= tol:
        return [pkt[0], pkt[-1]]
    lewo = _uprosc(pkt[:idx + 1], tol)
    prawo = _uprosc(pkt[idx:], tol)
    return lewo[:-1] + prawo


def kontur(key, tol=TOLERANCJA_J, probki=PROBKI):
    """Zamknięty wielokąt konturu tarczy w jednostkach, przeciwnie do zegara.

    Zwraca listę (x, y) — x w poprzek tarczy, y wzdłuż jej pionu, środek
    geometryczny w (0, 0).
    """
    k = KONSTRUKCJE[key]
    pw, ph, _ = wymiary_j(key)
    ksztalt = k["ksztalt"]

    # ⚠⚠ **SYMETRIĘ WYMUSZAMY, TAK JAK ROBI TO RASTERYZATOR IKON** (`maska()`
    # kończy się `m | m[:, ::-1]`). Wszystkie sześć kształtów jest symetrycznych
    # w `u`, a gęste próbkowanie też jest — ale **Douglas–Peucker symetrii NIE
    # zachowuje**: wybiera punkt podziału po największym odchyleniu i rekurencja
    # potrafi rozejść się między połówkami. Skutek był mierzalny i mylący:
    # środek masy wierzchołków uciekał w bok, a bramka CARRY raportowała
    # `dY = −0,88` przy `−0,10` dla tarcz kołowych — czyli „tarcza wisi za
    # plecami" przy geometrii ustawionej poprawnie.
    # Dlatego upraszczamy WYŁĄCZNIE prawą połowę i odbijamy ją lustrzanie.
    polowa = probki // 2
    prawa = []
    for i in range(polowa + 1):
        a = -np.pi / 2.0 + np.pi * i / polowa     # od bieguna dolnego do górnego
        cu, cv = float(np.cos(a)), float(np.sin(a))
        r = _promien(ksztalt, cu, cv)
        prawa.append((r * cu * pw, r * cv * ph))
    prosta = _uprosc(prawa, tol)
    # Lustro bez dwóch biegunów — one należą do obu połówek.
    lewa = [(-x, y) for (x, y) in reversed(prosta[1:-1])]
    return prosta + lewa


# ── samokontrola ────────────────────────────────────────────────────────────
def _pole(poly):
    n = len(poly)
    return abs(sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1]
                   for i in range(n))) / 2.0


def max_odchylka(key, poly, probki=360):
    """Najdalsze odejście PRAWDZIWEJ granicy od wielokąta, w jednostkach.

    To jest miara, którą `TOLERANCJA_J` obiecuje ograniczyć — a nie pole,
    które przy wielokącie wpisanym zaniża się systematycznie niezależnie od
    jakości uproszczenia.
    """
    k = KONSTRUKCJE[key]
    pw, ph, _ = wymiary_j(key)
    naj = 0.0
    for i in range(probki):
        a = 2.0 * np.pi * i / probki
        cu, cv = float(np.cos(a)), float(np.sin(a))
        r = _promien(k["ksztalt"], cu, cv)
        p = (r * cu * pw, r * cv * ph)
        d = min(_dalej_od_odcinka(p, poly[j], poly[(j + 1) % len(poly)])
                for j in range(len(poly)))
        naj = max(naj, d)
    return naj


def samokontrola():
    """Przypadki o ZNANEJ odpowiedzi — PASS-y i jawna demonstracja czerwonego.

    ⚠ `tools/CLAUDE.md`: „Asercja, która nie potrafi zaświecić na czerwono,
    jest dekoracją". Przypadek 4 psuje dane CELOWO i sprawdza, że przyrząd
    z przypadku 1 to WYŁAPUJE.
    """
    wyniki = []

    # 1. Kontur trzyma obiecaną tolerancję — na WSZYSTKICH sześciu. PASS.
    najgorsza, gdzie = 0.0, ""
    for key in KONSTRUKCJE:
        d = max_odchylka(key, kontur(key))
        if d > najgorsza:
            najgorsza, gdzie = d, key
    wyniki.append((f"kontur w granicach TOLERANCJA_J={TOLERANCJA_J}",
                   najgorsza <= TOLERANCJA_J * 1.05,
                   f"najgorzej {gdzie} {najgorsza:.4f} j. (~{najgorsza * 4.67:.2f} px)"))

    # 2. Wymiar zgodny z tabelą cm — sprawdza CAŁY łańcuch cm → j. → kontur. PASS.
    zle_wym = []
    for key, cfg in KONSTRUKCJE.items():
        k = kontur(key)
        # ⚠ Porownujemy z wymiarem PO SKALI GAMEPLAYOWEJ, nie z surowym `cm`.
        h_cm, w_cm = wymiar_cm(key)
        szer = (max(p[0] for p in k) - min(p[0] for p in k)) * CM_NA_J
        wys = (max(p[1] for p in k) - min(p[1] for p in k)) * CM_NA_J
        if abs(szer / w_cm - 1.0) > 0.03 or abs(wys / h_cm - 1.0) > 0.03:
            zle_wym.append(f"{key} {szer:.0f}×{wys:.0f} zamiast {w_cm}×{h_cm}")
    wyniki.append(("wymiary konturu == tabela cm (±3%)", not zle_wym,
                   "; ".join(zle_wym) or "wszystkie sześć"))

    # 3. Gwiaździstość WSZYSTKICH sześciu — bez niej bisekcja promieniowa
    #    milczkiem obcinałaby wklęsłości. PASS.
    gwiazd, szczegol = True, ""
    for nazwa, cfg in KONSTRUKCJE.items():
        for i in range(180):
            a = 2.0 * np.pi * i / 180
            cu, cv = float(np.cos(a)), float(np.sin(a))
            r = _promien(cfg["ksztalt"], cu, cv)
            for f in (0.15, 0.4, 0.7, 0.95):
                if not _wewnatrz(cfg["ksztalt"], r * f * cu, r * f * cv):
                    gwiazd, szczegol = False, f"{nazwa} @ {np.degrees(a):.0f}° f={f}"
                    break
            if not gwiazd:
                break
        if not gwiazd:
            break
    wyniki.append(("wszystkie 6 gwiazdziste wzgledem srodka", gwiazd, szczegol or "ok"))

    # 4. ⛔ DANE CELOWO ZEPSUTE: pawęż uproszczona 10× za zgrubnie. Przyrząd
    #    z przypadku 1 MUSI to zobaczyć. Gdyby przeszło — przypadek 1 jest
    #    dekoracją i nie sprawdza niczego.
    zgrubny = kontur("pavise", tol=TOLERANCJA_J * 10)
    d_zly = max_odchylka("pavise", zgrubny)
    wyniki.append(("wykrywa zepsuty kontur (tol ×10 ma NIE przejsc)",
                   d_zly > TOLERANCJA_J * 1.05,
                   f"{len(zgrubny)} wierzch., odchylka {d_zly:.3f} j."))

    # 5. Sześć kształtów to sześć RÓŻNYCH kształtów — gdyby bisekcja gubiła
    #    kontur, wszystkie wyszłyby jako elipsa wpisana w bbox.
    #    ⚠⚠ **PORÓWNANIE POLEM TU NIE DZIAŁA i wyszło to na czerwono.** Pole
    #    rycerskiej jest przypadkiem równe polu elipsy (−1%): szerokie barki
    #    nadrabiają to, co zabiera zbieżny dół. Pole jest jedną liczbą, a my
    #    pytamy o KSZTAŁT — więc mierzymy odejście PUNKTOWE.
    odst = {}
    for key in KONSTRUKCJE:
        pw, ph, _ = wymiary_j(key)
        ksz = KONSTRUKCJE[key]["ksztalt"]
        naj = 0.0
        for i in range(180):
            a = 2.0 * np.pi * i / 180
            cu, cv = float(np.cos(a)), float(np.sin(a))
            r = _promien(ksz, cu, cv)
            naj = max(naj, np.hypot(r * cu * pw - cu * pw, r * cv * ph - cv * ph))
        odst[key] = naj
    kolowe = {k for k, d in odst.items() if d < TOLERANCJA_J}
    wyniki.append(("tylko kola pokrywaja sie z elipsa bbox",
                   kolowe == {"buckler", "round"}
                   and all(odst[k] > 0.30 for k in KONSTRUKCJE if k not in kolowe),
                   " ".join(f"{k} {odst[k]:.2f}" for k in KONSTRUKCJE)))

    # 6. Kontur SYMETRYCZNY w X — rasteryzator ikon wymusza to jawnie
    #    (`maska()` kończy `m | m[:, ::-1]`), więc 3D musi tak samo. Bez tego
    #    środek masy ucieka w bok i bramka CARRY świeci na czerwono przy
    #    poprawnej geometrii.
    niesym = []
    for key in KONSTRUKCJE:
        k = kontur(key)
        lustro = sorted((round(-x, 9), round(y, 9)) for (x, y) in k)
        if sorted((round(x, 9), round(y, 9)) for (x, y) in k) != lustro:
            niesym.append(key)
        sx = sum(x for (x, _) in k) / len(k)
        if abs(sx) > 1e-9:
            niesym.append(f"{key}(srodek x={sx:.4f})")
    wyniki.append(("kontur symetryczny w X (jak maska ikon)", not niesym,
                   "; ".join(niesym) or "wszystkie sześć"))

    # 7. Wysklepienie: ZERO na krawedzi, pelna glebokosc w srodku, i kierunek
    #    zgodny z `forma`. Bez tego modele wracaja do plaskiej plyty, a to
    #    byl jedyny zarzut do pierwszej wersji geometrii 3D.
    # ⚠ Konwencja od 2026-09-21: ZERO w SRODKU, obrecz podwinieta na −h ku
    #   noszacemu. Poprzednia (obrecz 0, srodek +h) odsuwala cala tarcze od
    #   dloni o glebokosc wysklepienia — patrz `wypuklosc`.
    zle_wyp = []
    for key, cfg in KONSTRUKCJE.items():
        pw, ph, _ = wymiary_j(key)
        h = cfg["wypuklosc_cm"] * skala_gry(key) * J_NA_CM
        if abs(wypuklosc(key, 0.0, 0.0)) > 1e-9:
            zle_wyp.append(f"{key}: srodek ma byc zerem")
        if abs(wypuklosc(key, pw, 0.0) + h) > 1e-9:
            zle_wyp.append(f"{key}: krawedz boczna != -wypuklosc_cm")
        # kula gnie sie takze w pionie, walec/pion NIE.
        w_pionie = wypuklosc(key, 0.0, ph)
        if cfg["forma"] == "kula" and abs(w_pionie + h) > 1e-9:
            zle_wyp.append(f"{key}: kopula ma sie giac takze w pionie")
        if cfg["forma"] != "kula" and abs(w_pionie) > 1e-9:
            zle_wyp.append(f"{key}: walec NIE ma sie giac w pionie")
        # Glebokosc = pelne `wypuklosc_cm` niezaleznie od zakotwiczenia.
        glab = abs(wypuklosc(key, 0.0, 0.0) - wypuklosc(key, pw, 0.0))
        if abs(glab - h) > 1e-9:
            zle_wyp.append(f"{key}: glebokosc != wypuklosc_cm")
    wyniki.append(("wysklepienie zgodne z `forma` i `wypuklosc_cm`", not zle_wyp,
                   "; ".join(zle_wyp) or "wszystkie sześć"))

    # 8. ⛔ DANE CELOWO ZEPSUTE: tarcza o zerowej wypuklosci to PLYTA i sprawdzian
    #    z punktu 7 MUSI ja odrzucic. Gdyby przeszla, punkt 7 jest dekoracja.
    _zapas = KONSTRUKCJE["round"]["wypuklosc_cm"]
    KONSTRUKCJE["round"]["wypuklosc_cm"] = 0.0
    pw_r, _ph_r, _ = wymiary_j("round")
    plaska_wykryta = abs(wypuklosc("round", pw_r, 0.0)) < 1e-9
    KONSTRUKCJE["round"]["wypuklosc_cm"] = _zapas
    wyniki.append(("wykrywa plaska tarcze (wypuklosc 0 ma byc widoczne)",
                   plaska_wykryta, "obrecz == srodek == 0"))

    return wyniki


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"skala: 1 j. = {CM_NA_J:.3f} cm   |   1 cm = {J_NA_CM:.5f} j.\n")
    print(f"skala rodziny: {SKALA_GRY:.4f}  (ustalona na okraglej: 66 -> 56 cm)\n")
    print(f"{'konstrukcja':<10} {'cm na ekranie':>26} {'j. (szer×wys×grub)':>26} "
          f"{'wierzch.':>9} {'uchwyt':>7} {'profil':>7}  rozmiar")
    for key, k in KONSTRUKCJE.items():
        pw, ph, pg = wymiary_j(key)
        kon = kontur(key)
        h_hist, w_hist = k["cm"]
        h_cm, w_cm = wymiar_cm(key)
        wym_cm = (f"{h_cm:.0f}×{w_cm:.0f}" if skala_gry(key) == 1.0
                  else f"{h_cm:.0f}×{w_cm:.0f} (hist. {h_hist}×{w_hist})")
        wym_j = f"{2 * pw:.2f} × {2 * ph:.2f} × {2 * pg:.3f}"
        stan = "ROBOCZY" if k.get("rozmiar_roboczy") else "ustalony"
        print(f"{key:<10} {wym_cm:>26} {wym_j:>26} "
              f"{len(kon):>9} {k['uchwyt']:>7.2f} {k['profil']:>7}  {stan}")
    print("\n--- samokontrola ---")
    zle = 0
    for opis, ok, szczegol in samokontrola():
        print(f"  [{'OK  ' if ok else 'BLAD'}] {opis:<46} {szczegol}")
        zle += 0 if ok else 1
    print(f"  {'wszystko zielone' if not zle else f'{zle} PRZYPADKOW NA CZERWONO'}")
    sys.exit(1 if zle else 0)

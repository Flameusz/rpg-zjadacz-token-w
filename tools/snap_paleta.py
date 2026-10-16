"""
Sprowadza gotowy rekwizyt (PNG z alfa) do wspolnej palety swiata.

Uruchom:  python tools/snap_paleta.py                 (raport, NIC nie zapisuje)
          python tools/snap_paleta.py --zapisz         (pisze <nazwa>_paleta.png)
          python tools/snap_paleta.py --podglad KAT    (dodatkowo powiekszone podglady)
          python tools/snap_paleta.py --tylko ognisko  (jeden wpis zamiast wszystkich)

── PO CO TO ISTNIEJE ─────────────────────────────────────────────────────
`docs/paleta.json` jest wspolna rampa calego swiata. Rekwizyt wygenerowany
poza nia (Gemini, edytor) ma setki kolorow z antyaliasingu i **nie siada
obok reszty wsi** — `studnia_zlozona.png` ma 16 kolorow, nowa `studnia.png`
miala 456. Ten skrypt robi dokladnie jedna rzecz: snapuje kazdy nieprzezroczysty
piksel do najblizszego koloru z RESTRYKCYJNIE dobranego zbioru ramp.

── DLACZEGO OSOBNY SKRYPT, A NIE `build_<cos>.py` NA KAZDY REKWIZYT ──────
`build_lawka.py`/`build_barrel.py`/`build_studnia.py` robia wiecej niz
kolor: licza bounding-box, zdejmuja zielone tlo flood-fillem, skladaja
kafle, doklejaja wiersze do `Buildings.png`. Te dwa pliki nie potrzebuja
niczego z tej listy — maja juz czysta binarna alfe i wlasciwy rozmiar —
wiec jedyne, co im zostaje, to przemapowanie kolorow. Dwa niemal identyczne
skrypty byly by gorsze niz jedna tabela.

── DLACZEGO ZBIOR RAMP JEST RESTRYKCYJNY, A NIE „cala paleta" ────────────
To jest cala trudnosc tego zadania i lekcja juz raz oplacona przy portrecie
Doroty (`build_dorota.py`): przy snapowaniu do najblizszego sasiada **cala
kategoria koloru potrafi zniknac**, bo najblizszy sasiad lezy w obcej rampie.
Konkretnie tutaj:

- **ogien vs `piasek`.** Rampa `piasek` konczy sie na #f9ecad — jasnej,
  ciepłej zolci, ktora w RGB lezy blizej jasnego plomienia niz cokolwiek
  z `akcent_cieply`. Gdyby `piasek` byl w zbiorze, rdzen ognia zmapowalby
  sie na piasek i plomien przestalby byc plomieniem. Dlatego przy ognisku
  `piasek` NIE wchodzi, a jedyny wyjatek to jeden jawnie dopisany kolor
  (`#f9ecad`) na sam rdzen — swiadomy wyjatek, nie otwarcie calej rampy.
- **kontur vs `neutralne`.** `neutralne` ma na koncu #e6e4e0 (prawie biel),
  ktora rownie chetnie ukradlaby jasne piksele ognia. Bierzemy z tej rampy
  tylko ciemny koniec, tak jak robi to juz `studnia_zlozona.png`.

Raport nizej wypisuje, ile pikseli trafilo do ktorej rampy, i **krzyczy, gdy
ktoras dostala zero** — to znaczy albo ze byla niepotrzebna, albo (gorzej)
ze jej material zostal wchloniety przez sasiednia rampe.
"""

import argparse
import json
import os
from collections import Counter

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


# Ile pierwszych kolorow rampy brac (None = cala). Uzywane tam, gdzie jasny
# koniec rampy kradlby piksele innemu materialowi — patrz naglowek.
def rampa(nazwa, ile=None):
    v = PALETA[nazwa]
    return [(nazwa, h) for h in (v[:ile] if ile else v)]


# Prostokat (x0, y0, x1, y1) wlacznie, w ktorym wolno uzywac rampy ognia.
#
# ── DLACZEGO W OGOLE MASKA, SKORO CALA RESZTA IDZIE PO KOLORZE ───────────
# Bo tu kolor NIE WYSTARCZA i to zostalo zmierzone, nie zgadniete.
# Rozjasnione ogniem piksele drewnianych slupkow (#b17d49, #b27c4d, #b6804b
# na x=4 i x=28) leza w RGB blizej `akcent_cieply` #cc7448 (dystans 765) niz
# najblizszego drewna #ac976c (1022) — wiec globalny najblizszy-sasiad
# zamienial slupki w plomien i stelaz wygladal, jakby sie palil.
#
# Sprawdzone i ODRZUCONE: prog nasycenia. Zakresy zachodza na siebie
# bezkolizyjnie tylko na papierze — drewno siega S=0.70, a prawdziwe piksele
# ognia schodza do S=0.35, wiec zaden prog nie tnie tego czysto. Tak samo
# G-B: prawdziwy plomien #c67440 ma 52, a slupek #b6804b ma 53.
#
# I to jest poprawna diagnoza, a nie brak pomyslu: **rozjasnione ogniem
# drewno naprawde JEST pomaranczowe**. Te dwa materialy nie roznia sie
# kolorem, roznia sie tym, czym sa — a jedyne, co o tym mowi, to polozenie.
# Prostokat obejmuje wszystkie 103 piksele plomienia (zmierzony zasieg
# x10-22, y11-21) z jednym kaflem zapasu i nie obejmuje ani jednego piksela
# slupka.
MASKA_OGNIA = {
    "ognisko.png": (9, 10, 23, 21),
}

# Nazwa wyjsciowa tam, gdzie domyslne `<nazwa>_paleta.png` bylo by mylace.
#
# Studnie sa dwie i OBIE zostaja w grze (duza 64x64 na placu wsi, mala 32x32
# do pozniejszego uzycia), wiec nazwa pliku musi mowic KTORA to jest, a nie
# skad pochodzi — `studnia_zlozona` obok `studnia_paleta` nie odpowiada na
# zadne pytanie, ktore ktos bedzie mial za miesiac.
# ⚠ Wartosci zawieraja KATALOG, bo assety sa poukladane tematycznie
# (`public/assets/obiekty/` itd.). Wynik snapowania musi ladowac tam, skad
# gra go czyta — inaczej skrypt po cichu zapisze do korzenia, a gra dalej
# bedzie widziala stara wersje.
WYJSCIE = {
    "studnia.png": "props/studnia_mala.png",
    "porabane-drewno.png": "drewno_porabane.png",
    "worek.png": "worek.png",
    "worek-z-ziarnem.png": "worek_ziarno.png",
}

# Rekwizyty, ktorych wynik `<nazwa>_paleta.png` trafia do `obiekty/`, bo gra
# czyta je stamtad. Reszta (drewno_porabane, worek*, suszona-skora_paleta)
# to polprodukty albo rzeczy jeszcze niewpiete i zostaja w korzeniu.
_DOMYSLNE_WYJSCIE = {
    n: "props/" + n.replace(".png", "_paleta.png")
    for n in ("ognisko.png", "strach.png", "studnia-gpt.png",
              "pniak_z_siekiera.png", "grzyby.png", "brzeg_stawu.png",
              "lilia_wodna.png", "ul00.png", "ul01.png", "ul02.png")
}

# Zrodlo poza `public/assets/` wprost (referencje z `tem/`, jeszcze nie
# wpiete jako wlasciwy asset). Domyslnie brak wpisu = plik lezy juz w
# ASSETS, jak dotychczas.
ZRODLO = {
    "porabane-drewno.png": os.path.join(ASSETS, "tem", "a1", "porąbane-drewno.png"),
    "worek.png": os.path.join(ASSETS, "tem", "a1", "worek.png"),
    "worek-z-ziarnem.png": os.path.join(ASSETS, "tem", "a1", "worek-z-ziarnem.png"),
}

# nazwa pliku -> (zbior docelowy, opis do raportu)
#
# Kazdy wpis to lista (rampa, hex). Rampa sluzy tylko raportowi; snapowanie
# patrzy wylacznie na kolory.
CELE = {
    # Studnia: dokladnie te same trzy rampy, ktorych uzywa juz zlozona studnia
    # na placu (`studnia_zlozona.png` — zmierzone, nie zgadniete), zeby nowy
    # kafel siadal obok starego bez roznicy w tonie.
    "studnia.png": rampa("kamien") + rampa("drewno") + rampa("neutralne", 3),
    # Ognisko: drewno + kora na polana, `akcent_cieply` na plomien (to jest
    # dokladnie ta rampa, po co ona w palecie jest), `kamien` na zeliwny
    # kociolek, `listowie` na to, co w nim bulgocze, ciemne `neutralne` na
    # kontur. Plus JEDEN jawny wyjatek na rdzen ognia — patrz naglowek.
    "ognisko.png": (
        rampa("akcent_cieply")
        + [("wyjatek", "#f9ecad")]
        + rampa("drewno")
        + rampa("kora")
        + rampa("kamien", 4)
        + rampa("listowie")
        + rampa("neutralne", 3)
    ),
    # Porabane drewno (public/assets/tem/a1/): zmierzone 7 kolorow trafiaja
    # najblizej `kora` (ciemny kontur/szczeliny), `drewno` (srodek pieńków),
    # `ziemia` (jasniejsze przekroje) i jasny koniec `piasek` (bielone
    # przekroje kloców) — te cztery, zadna inna rampa nie byla najblizsza
    # zadnemu zmierzonemu kolorowi.
    "porabane-drewno.png": (
        rampa("kora") + rampa("drewno") + rampa("ziemia") + rampa("piasek")
    ),
    # Worek (plotno): wszystkie 6 kolorow siedzi w `piasek`/`ziemia` (plotno)
    # + `kora` (ciemny fald/kontur) — dokladnie jak zmierzono, bez ogniowej
    # pulapki z ognisko.png (tu nic obok nie plonie).
    "worek.png": rampa("piasek") + rampa("ziemia") + rampa("kora"),
    # Worek z ziarnem: to samo plotno, ale ziarno (#d4b22b/#e3c654) lezy
    # DALEKO od kazdej rampy (dystans 1261-4609 do najblizszego istniejacego
    # koloru) — paleta swiata nie ma nasyconej zloto-zoltej rampy. Zamiast
    # przepychac ziarno przez najblizszego sasiada (wyszloby pomaranczowe,
    # `akcent_cieply`, i przestalo czytac sie jako zboze), dwa jawne
    # wyjatki — ten sam trik co rdzen ognia w ognisko.png.
    "worek-z-ziarnem.png": (
        rampa("piasek") + rampa("ziemia") + rampa("kora")
        + [("wyjatek_ziarno", "#d4b22b"), ("wyjatek_ziarno", "#e3c654")]
    ),
    # Suszona skora (od ChatGPT, docelowo obiekt kolo chaty myśliwego —
    # patrz CLAUDE.md/rozmowa): 52 zmierzone kolory, zdominowane przez
    # ciemne czerwienie/brazy skory (np. #25090e, #602b2b, #813d35) i
    # cieplejsze brazy stelaza z galezi (#9d5733, #af683a, #fbc884 na
    # rozjasnieniu). `akcent_cieply` konczy sie dokladnie w tym samym
    # ciemno-czerwono-do-ciepla-zlota zakresie co zmierzone kolory skory;
    # `drewno`/`kora` biora galezie stelaza; ciemny koniec `neutralne`
    # bierze kontur (zmierzony #000000, 143px).
    "suszona-skora.png": (
        rampa("akcent_cieply") + rampa("drewno") + rampa("kora") + rampa("neutralne", 2)
    ),
    # Studnia-gpt (od ChatGPT, kandydat na zamiennik studnia_zlozona.png —
    # ma strzechę, ktora pasuje do "cala wies jest kryta strzecha" lepiej
    # niz goly kamienny cembrowiny obecny model): 87 kolorow. Zmierzone:
    # cieply zloto-pomaranczowy dach (#fbc951, #d59633, #c0802c, #a1642a) =
    # akcent_cieply; brazowe słupy/belka (#88492a, #4f2d22, #804428) =
    # drewno+kora; szaro-niebieskie cienie pod okapem (#100d19, #313045,
    # #4c4554) NIE sa akcent_chlodny (za mało nasycone — to cień, nie
    # fiolet) — biora ciemny/środkowy neutralne; jasny kamienny cembrowin
    # (#83716d, #bea08d, #b89a89) = kamien.
    "studnia-gpt.png": (
        rampa("akcent_cieply") + rampa("drewno") + rampa("kora")
        + rampa("kamien") + rampa("neutralne", 4)
    ),
    # Strach na wroble (od ChatGPT, do postawienia na polach): 78 kolorow.
    # Zmierzone: zloto-slomiane wypelnienie (#fbcb48, #d08f30, #e6ac37,
    # #f4be3f) = akcent_cieply; brazowy worek-glowa/dlonie i drewniany
    # krzyz (#94694e, #976c50, #57291c, #8e644b, #985225) = piasek (plotno
    # worka) + drewno/kora (krzyz); bardzo ciemny czerwono-brazowy kontur
    # (#1a050b, #16030b, #1e080d) = neutralne, ciemny koniec.
    "strach.png": (
        rampa("akcent_cieply") + rampa("piasek") + rampa("drewno")
        + rampa("kora") + rampa("neutralne", 3)
    ),
    # Cztery rekwizyty wyciete z public/assets/temp/nature_assets.png (pakiet
    # referencyjny, kasowany po przejeciu) — kazdy juz izolowany (connected-
    # component + reczne przycinanie sasiadow) zanim trafil tutaj jako osobny
    # plik zrodlowy.
    #
    # Pniak z siekiera: 9 kolorow, dominujace brazy sloi drewna
    # (#5a3714, #6b441b, #4c2b10, #7b5122) = drewno; jasny przekrój pnia i
    # ostrze siekiery (#c2c187, #d2d196) najblizej jasnego konca `piasek`
    # (#d5c08b/#f9ecad). ⚠ `kora` bylo w zbiorze i raport zglosil ZERO
    # pikseli — cala ciemna czesc wchlonelo `drewno`, wiec zostalo usuniete
    # zamiast zostawione "na wszelki wypadek" (dokladnie po to ten raport
    # krzyczy, patrz naglowek).
    "pniak_z_siekiera.png": rampa("drewno") + rampa("piasek"),
    # Grzyby: 28 kolorow, cieply pomaranczowo-brazowy kapelusz. Zmierzone
    # najblizsze rampy per kolor: #cc7f3f/#c07139/#be6e38 -> akcent_cieply
    # #cc7448, #dfab65/#e1b16a/#dda661 -> akcent_cieply #efac69,
    # #e5bc7a -> piasek #d5c08b. Samo `akcent_cieply` scisnelo caly sprite
    # do DWOCH kolorow (28->2), co przy 14x19px czyta sie plasko —
    # `piasek` daje najjasniejszemu refleksowi wlasny stopien.
    # `kora` sprawdzone i odrzucone: raport dal mu zero pikseli.
    "grzyby.png": rampa("akcent_cieply") + rampa("piasek"),
    # Brzeg stawu: 26 kolorow — piaskowo-oliwkowy wierzch (#c2c187,
    # #b7b57d, #8b8555) = piasek, turkusowa woda (#4fab8e, #4ba78b,
    # #26d9cb) = woda, mimo ze paleta nie ma prawdziwej rampy turkusowej
    # (najblizszy sasiad, nie idealne dopasowanie — ale `woda` to jedyna
    # rampa opisujaca ten material).
    # ⚠ `kamien` i `neutralne` byly w zbiorze i raport dal OBU zero pikseli
    # — wierzch okazal sie czysto piaskowy, nie kamienny, mimo ze na oko
    # wyglada jak glaz. Usuniete, nie zostawione.
    "brzeg_stawu.png": rampa("piasek") + rampa("woda"),
    # Lilia wodna: 10 kolorow. Lisc (#6fdb42, #80de52, #2eab27) siada
    # czysto na `trawa`.
    #
    # ⚠ Kwiat wymagal JAWNYCH WYJATKOW, i to jest dokladnie ta pulapka,
    # o ktorej mowi naglowek tego pliku. Pierwsza wersja dala kwiatowi
    # `akcent_cieply` (jedyna czerwonawa rampa w palecie) i **rozowo-koralowy
    # kwiat wyszedl POMARANCZOWY** — przestal czytac sie jak lilia, zaczal
    # jak nagietek. `akcent_chlodny` sprawdzone i odrzucone: to fiolety
    # (#996baa/#be86c7), jeszcze dalej od korala niz pomarancz.
    # Paleta swiata po prostu nie ma rampy rozowej, wiec — tak samo jak
    # ziarno w `worek-z-ziarnem.png` — kwiat dostaje dwa jawne kolory
    # zamiast byc przepchniety przez najblizszego sasiada.
    "lilia_wodna.png": (
        rampa("trawa")
        + [("wyjatek_kwiat", "#cc2f41"), ("wyjatek_kwiat", "#de4951"),
           ("wyjatek_kwiat", "#f06260"), ("wyjatek_kwiat", "#f0c5b3")]
    ),
    # Ule (kłody bartne), trzy warianty od autora — docelowo pasieka Doroty
    # Zielarki, `wioska_plan.md` B12 (6 kłód). 43-48 kolorow kazdy. Zmierzone:
    # kloda i strzecha to ten sam rdzawo-brazowy zakres co studnia-gpt.png
    # (kora/drewno/ziemia na drewno kłody, akcent_cieply na strzeche —
    # ta sama rodzina materiałow, wiec ten sam zestaw ramp bez zgadywania od
    # nowa), ciemny kontur = neutralne. **Pszczoly (kilka px kazdy plik,
    # #f9d204/#fbee0a i podobne, czyste nasycone zolto) sa PIERWSZYM realnym
    # uzyciem `akcent_zlocisty` poza gruszka** — dystans 60-70 (rampa nie
    # siega tak czystego zoltego jak zrodlo), ale przy 2-8 pikselach na plik
    # to nie jest wyjatek wart jawnego koloru, tak jak ziarno w worku bylo.
    "ul00.png": (
        rampa("kora") + rampa("drewno") + rampa("ziemia")
        + rampa("akcent_cieply") + rampa("akcent_zlocisty") + rampa("neutralne", 3)
    ),
    "ul01.png": (
        rampa("kora") + rampa("drewno") + rampa("ziemia")
        + rampa("akcent_cieply") + rampa("akcent_zlocisty") + rampa("neutralne", 3)
    ),
    "ul02.png": (
        rampa("kora") + rampa("drewno") + rampa("ziemia")
        + rampa("akcent_cieply") + rampa("akcent_zlocisty") + rampa("neutralne", 3)
    ),
}

# ── Kamienie (docs/art-review/kamienie/, 2026-08-30) ──────────────────────
#
# 23 z 41 wyizolowanych z `kamienie-snapped.png` (juz raz przepuszczonych
# przez Snapper przed przekazaniem — sheet miesci sie w 64 kolorach na CALY
# arkusz). To drugie snapowanie sprawdza cos innego: czy te kolory siada
# obok RESTRYKCYJNEGO zbioru ramp swiata, tego samego, ktorego uzywa reszta
# rekwizytow — nie czy sheet jest "czysty" sam w sobie.
#
# Zmierzone na 5 reprezentantach (jeden na klase) przed dopisaniem tego
# wpisu, viz. `docs/dziennik.md`:
# - `kamien` (chlodny szaro-niebieski) dostaje ZERO pikseli w kazdym pliku —
#   sprawdzone, ze to nie blad doboru zbioru: najciemniejszy/najbardziej
#   "szary" piksel zrodla i tak ma spread R/G/B >15, wiec kamienie sa
#   cieplejsze niz ta rampa z zalozenia. Ciepla mapa skala->ziemia/kora
#   siada spojnie obok istniejacej sciezki/podloza (potwierdzone renderem) —
#   `kamien` zostaje w zbiorze na wypadek przyszlego chlodniejszego
#   materialu, ale u kamieni realnie nie wygrywa nic.
# - Mech (9 unikalnych kolorow w calym zbiorze, ciemna zdesaturowana
#   oliwka) BEZ wlasnej rampy ladowal sie w `ziemia`/`kora`/`akcent_zlocisty`
#   i wychodzil zolto-brazowy — ten sam blad, przed ktorym ostrzega naglowek
#   tego pliku ("cala kategoria potrafi zniknac"). Naprawione dopisaniem
#   rampy `mech` do `docs/paleta.json` (5 stopni, zmierzone wprost z tych
#   kamieni — kilka wartosci to dokladne kopie zrodlowych pikseli).
# - `listowie`/`korona`/`trawa` (prawdziwa zielen) i `akcent_zlocisty" wciaz
#   dostaja zero pikseli PO naprawie — `mech` przejal dokladnie to, co
#   powinien, nic wiecej.
_KAMIENIE_RAMPA = (
    rampa("kamien") + rampa("ziemia") + rampa("piasek")
    + rampa("kora") + rampa("drewno") + rampa("mech")
    + rampa("listowie") + rampa("korona") + rampa("trawa")
    + rampa("akcent_zlocisty") + rampa("neutralne")
)
_KAMIENIE_ROSTER = [
    # drobne (4)
    "stone_drobny_01.png", "stone_drobny_02.png", "stone_drobny_04.png", "stone_drobny_06.png",
    # male (6)
    "stone_maly_02.png", "stone_maly_04.png", "stone_maly_05.png",
    "stone_maly_08.png", "stone_maly_12.png", "stone_maly_15.png",
    # srednie (6)
    "stone_sredni_01.png", "stone_sredni_02.png", "stone_sredni_06.png",
    "stone_sredni_07.png", "stone_sredni_09.png", "stone_sredni_11.png",
    # duze (4)
    "stone_duzy_01.png", "stone_duzy_02.png", "stone_duzy_05.png", "stone_duzy_06.png",
    # glazy (3) -- wszystkie trzy istniejace, zaden nie odrzucony
    "stone_glaz_01.png", "stone_glaz_02.png", "stone_glaz_03.png",
]
for _nazwa in _KAMIENIE_ROSTER:
    CELE[_nazwa] = _KAMIENIE_RAMPA
    ZRODLO[_nazwa] = os.path.join(DOCS, "art-review", "kamienie", _nazwa)
    WYJSCIE[_nazwa] = "props/" + _nazwa

# ── SPRAWDZONE I ODRZUCONE: ikony przedmiotow (chleb, 2026-08-14) ────────
#
# `bread.png` przeszedl przez ten skrypt i wynik byl GORSZY od oryginalu:
# `ziemia` wchlonela 10600 z 13800 pikseli i zlocisty bochenek wyszedl
# blotnisty, czytal sie jak ziemniak. Ale prawdziwy wniosek jest szerszy niz
# jedno zle dopasowanie ramp:
#
# ⚠ **Ta paleta obowiazuje REKWIZYTY STOJACE NA MAPIE, nie ikony w UI.**
# Zmierzone: `items.png` — arkusz, z ktorego pochodzi 19 z 20 ikon w grze —
# ma sredni wazony dystans **31,4** do najblizszego koloru palety, a **48%
# jego pikseli lezy dalej niz 30**. Chleb przed snapem mial ~33, czyli
# dokladnie ten sam rzad. Snapowanie chleba zrobiloby z niego JEDYNA ikone
# zgodna z paleta, lezaca w plecaku obok dziewietnastu niezgodnych — czyli
# pogorszyloby spojnosc, ktora ta paleta ma zapewniac.
#
# Regula: rekwizyt, ktory stoi obok trawy i budynkow, idzie przez snap.
# Ikona, ktora lezy w panelu obok innych ikon, ma pasowac do `items.png`.
# Nie dodawaj tu ikon przedmiotow.


def _snap_zbior(px, cel):
    """Najblizszy kolor z `cel` dla kazdego wiersza `px` (RGB euclid, tak samo
    jak `build_lawka.py`). Zwraca (kolory, indeksy)."""
    target = np.array([hx(h) for _, h in cel], dtype=int)
    d = ((px[:, None, :] - target[None, :, :]) ** 2).sum(axis=2)
    idx = np.argmin(d, axis=1)
    return target[idx], idx


def przetworz(nazwa):
    src = ZRODLO.get(nazwa, os.path.join(ASSETS, nazwa))
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    rgb, alpha = arr[..., :3], arr[..., 3]
    cel = CELE[nazwa]
    OGIEN = {"akcent_cieply", "wyjatek"}

    # Poza maska ognia (jesli jest) rampa plomienia w ogole nie jest
    # kandydatem — patrz komentarz nad MASKA_OGNIA.
    box = MASKA_OGNIA.get(nazwa)
    cel_bez = [c for c in cel if c[0] not in OGIEN] if box else cel

    h, w = alpha.shape
    w_ogniu = np.zeros((h, w), bool)
    if box:
        x0, y0, x1, y1 = box
        w_ogniu[y0:y1 + 1, x0:x1 + 1] = True

    przed = len({tuple(c) for c in rgb[alpha > 0]})
    kolor = rgb.copy()
    trafienia = Counter()

    for maska, zbior in ((w_ogniu, cel), (~w_ogniu, cel_bez)):
        m = (alpha > 0) & maska
        if not m.any():
            continue
        nowe, idx = _snap_zbior(rgb[m].astype(int), zbior)
        kolor[m] = nowe
        trafienia.update(zbior[i][0] for i in idx)

    po = len({tuple(c) for c in kolor[alpha > 0]})
    wynik = np.dstack([kolor, alpha])
    return wynik, przed, po, trafienia, cel


def raport(nazwa, przed, po, trafienia, cel):
    print("== %s" % nazwa)
    print("   kolorow: %d -> %d" % (przed, po))
    uzyte = set()
    for r, n in trafienia.most_common():
        print("   %-14s %5d px" % (r, n))
        uzyte.add(r)
    puste = sorted({r for r, _ in cel} - uzyte)
    if puste:
        print("   ⚠ RAMPY BEZ ANI JEDNEGO PIKSELA: %s" % ", ".join(puste))
        print("     (albo zbedne w zbiorze, albo ich material wchlonela sasiednia rampa)")
    else:
        print("   kazda rampa ze zbioru dostala piksele — OK")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="KATALOG")
    ap.add_argument("--tylko", metavar="NAZWA")
    a = ap.parse_args()

    for nazwa in CELE:
        if a.tylko and a.tylko not in nazwa:
            continue
        wynik, przed, po, trafienia, cel = przetworz(nazwa)
        raport(nazwa, przed, po, trafienia, cel)

        if a.podglad:
            os.makedirs(a.podglad, exist_ok=True)
            im = Image.fromarray(wynik, "RGBA")
            n = 12
            tlo = Image.new("RGBA", im.size, (255, 0, 255, 255))
            tlo.alpha_composite(im)
            tlo.resize((im.width * n, im.height * n), Image.NEAREST).save(
                os.path.join(a.podglad, "po_" + nazwa)
            )
            src = Image.open(ZRODLO.get(nazwa, os.path.join(ASSETS, nazwa))).convert("RGBA")
            tlo2 = Image.new("RGBA", src.size, (255, 0, 255, 255))
            tlo2.alpha_composite(src)
            tlo2.resize((src.width * n, src.height * n), Image.NEAREST).save(
                os.path.join(a.podglad, "przed_" + nazwa)
            )

        if a.zapisz:
            out = os.path.join(ASSETS, WYJSCIE.get(nazwa, _DOMYSLNE_WYJSCIE.get(nazwa, nazwa.replace(".png", "_paleta.png"))))
            Image.fromarray(wynik, "RGBA").save(out)
            print("   zapisano -> %s" % os.path.basename(out))
        else:
            print("   (nic nie zapisano — dodaj --zapisz)")
        print()


if __name__ == "__main__":
    main()

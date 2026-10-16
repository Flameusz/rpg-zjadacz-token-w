"""
Wspolny kontrakt dla przejscia miedzy mapami (dzis: las <-> wioska).

Oba generatory pisza swoj wlasny plik .tmj i zaden nie importuje drugiego —
`build_wioska.py` importuje `build_mapa.py` (po kafle_domu, Warstwa, drzewa),
ale nie odwrotnie, bo to zrobiloby cykl. Wspolrzedne bramy MUSZA sie jednak
zgadzac miedzy obiema mapami: brama w lesie mowi grasowi, gdzie wyladuje
w wiosce, i na odwrot. Trzymanie tych liczb w DWA razy, po jednej kopii
w kazdym skrypcie, jest dokladnie tym bledem, ktory kilka razy juz kosztowal
czas przy kaflach dachu — kopie sie rozjezdzaja przy pierwszej zmianie ukladu
jednej z map. Ten plik jest wiec trzecia, neutralna strona: bez zaleznosci,
czytany przez oba generatory.

Wspolrzedne sa w KAFLACH, nie w pikselach — kazda mapa mnozy je przez swoj
wlasny T (dzis ten sam, 32, ale nie ma powodu tego zakladac na sztywno).
"""

T = 32

# UWAGA: bramy stoja na STYKU dwoch kafli drogi, nie w srodku jednego.
#
# Droga ma 2 kafle (64 px) szerokosci, a PORTAL.triggerRadius to 34 px, czyli
# 68 px srednicy. Punkt w srodku kafla (tx*T + T//2) zostawial 16 px drogi po
# jednej stronie poza zasiegiem — dalo sie przejsc skrajem obok bramy i nic sie
# nie dzialo. Dopoki brama byla niewidoczna, byl to drobiazg; od momentu, w
# ktorym rysujemy na niej ikone wejscia, jest to widoczny blad: gracz widzi
# brame, wchodzi w nia i nic. Dlatego `piksele_brama()` nizej liczy X jako
# tx*T (lewa krawedz kafla = os drogi miedzy tx-1 i tx), a nie srodek kafla.
#
# Jesli droga kiedys bedzie miala nieparzysta liczbe kafli, ta konwencja
# przestaje pasowac i trzeba ja zmienic TUTAJ, a nie w jednej z map.

# Brama w polnocnym skraju lasu (mapa 160x60, resize 100->160 z 2026-08-28 —
# nietkniete tu, bo lezy na krawedzi Y, ktorej rozszerzenie na wschod nie
# rusza). Polozona na osi grzbietu drogi
# (kregoslup(1) w build_mapa.py wychodzi ~40) — droga MUSI byc przedluzona
# do tego wiersza w ksztalt_swiata(), inaczej brama wisi w polu bez dojscia.
# Droga zajmuje kafle 40-41, wiec os to krawedz kafla 41.
#
# ⚠ PRZESUNIETE 2026-10-04: rozstaw lasu x1,5 (160x60 -> 240x90). Droga przy
# bramie ma teraz 4 kafle (60-63), os to krawedz kafla 62 — szerokosc nadal
# PARZYSTA, wiec konwencja z gory pliku obowiazuje bez zmian. Bylo tx=41.
BRAMA_LAS = dict(tx=62, ty=1)

# Gdzie ladujemy gracza wchodzacego z wioski DO lasu — kawalek w GLAB lasu od
# bramy (ten sam kregoslup, kilka wierszy dalej), zeby wejscie nie stalo
# dokladnie w promieniu wyzwalania bramy wioski i nie odbilo gracza od razu
# z powrotem. Patrz PORTAL.triggerRadius w src/config/GameConfig.ts (28 px);
# 96 px odstepu to spory zapas.
# ⚠ 2026-10-04: x1,5 razem z brama (bylo tx=41, ty=4). Zakodowane jako
# spawnX/spawnY (2000, 208) na obiekcie `portal` w village-zagaje.tmj.
WEJSCIE_DO_LASU = dict(tx=62, ty=6)

# Brama w poludniowym skraju wioski (mapa 100x100) — dokladnie tam, gdzie
# droga z lasu wchodzi na plac. Droga zajmuje kafle 50-51, os to krawedz 51.
BRAMA_WIOSKI = dict(tx=51, ty=98)

# Gdzie ladujemy gracza wchodzacego z lasu DO wioski — kawalek w GLAB wioski
# od jej bramy, z tego samego powodu co WEJSCIE_DO_LASU.
WEJSCIE_DO_WIOSKI = dict(tx=50, ty=93)


# ── brama wschodnia: las <-> gestwina ──────────────────────────────────────
#
# UWAGA, INNA OS NIZ POWYZSZE. Brama las<->wioska stoi na krawedzi POZIOMEJ
# mapy, wiec przejscie idzie w pionie, szerokosc przejscia mierzy sie w X
# i to X ma lezec na styku kafli. Tutaj jest dokladnie odwrotnie: brama stoi
# na krawedzi PIONOWEJ (wschodni skraj lasu), przejscie idzie w poziomie,
# a szerokosc mierzy sie w Y. Uzycie tu `piksele_brama()` zostawiloby
# 16 px przejscia poza zasiegiem wyzwalania — ten sam blad, ktory ten plik
# opisuje wyzej, tylko obrocony o 90 stopni. Stad `piksele_brama_pozioma()`.
#
# Brama NIE stoi na drodze i to jest tresc, nie niedoróbka: `docs/swiat.md`
# mowi, ze do gestwiny nie prowadzi zadna droga — trafia sie tam, gdy sie
# "poszlo dalej, niz trzeba bylo". Zamiast drogi jest PRZESMYK w scianie
# drzew (`pole_gestosci` stawia na obwodzie mapy pas gestwiny), przecinany
# recznie w forrest.tmj. Ikone wejscia rysuje silnik z samego obiektu
# `portal` (`PORTAL.marker`), wiec przejscie jest widoczne bez ani jednego
# nowego kafla.
#
# tx = SZEROKOSC-2, nie SZEROKOSC-1: kafel skrajny dotyka granicy swiata, wiec
# gracz nie moze stanac w jego srodku — polowa jego ciala bylaby poza mapa.
# Jeden kafel do wewnatrz daje bramie pelne 68 px srednicy po obu stronach.
#
# ⚠ PRZESUNIETE 2026-08-28: resize lasu 100x60 -> 160x60 (wylacznie na
# wschod, x0-99 nietkniete — Z-3). Bylo tx=98 przy szerokosci 100; ta sama
# regula przy szerokosci 160 daje tx=158. Zastosowane w forrest.tmj (obie
# kopie), NIE zastosowane w thicket-gestwina.tmj (BRAMA_GESTWINY nizej lezy
# na mapie Gestwiny, niezalezna od szerokosci lasu).
#
# ⚠ PRZESUNIETE PONOWNIE 2026-10-04: rozstaw lasu x1,5 — szerokosc 240, ta sama
# regula „krawedz minus jeden kafel" daje tx=238; ty=46 -> 69.
BRAMA_LAS_WSCHOD = dict(tx=238, ty=69)

# Gdzie ladujemy gracza wchodzacego z gestwiny DO lasu — kilka kafli na zachod
# od bramy lasu, z tego samego powodu co przy wiosce (zeby nie wpasc od razu
# w promien wyzwalania i nie zostac odbitym z powrotem).
#
# ⚠ PRZESUNIETE 2026-08-28, razem z BRAMA_LAS_WSCHOD. Odstep od bramy
# (98-95=3 kafle) zachowany: 158-3=155. Ta wartosc jest zakodowana jako
# `spawnX`/`spawnY` na obiekcie `portal` w thicket-gestwina.tmj (portal
# STOI na mapie Gestwiny, ladowanie na mapie lasu), nie jako osobny obiekt
# tutaj — patrz PROJECT_CHECKPOINT_RESIZE160.md.
# ⚠ 2026-10-04: x1,5 (odstep 3 kafle od bramy zachowany). spawnX/spawnY
# (7536, 2192) na obiekcie `portal` w thicket-gestwina.tmj.
WEJSCIE_DO_LASU_ZE_WSCHODU = dict(tx=235, ty=68)

# Brama na ZACHODNIM skraju gestwiny (mapa 64x64) — druga strona tego samego
# przesmyku.
BRAMA_GESTWINY = dict(tx=1, ty=32)

# Gdzie ladujemy gracza wchodzacego z lasu DO gestwiny.
WEJSCIE_DO_GESTWINY = dict(tx=4, ty=31)


def piksele(punkt):
    """(tx, ty) w kaflach -> (x, y) w pikselach, srodek kafla.

    Dla PUNKTOW LADOWANIA. Bramy licz przez `piksele_brama()`.
    """
    return punkt["tx"] * T + T // 2, punkt["ty"] * T + T // 2


def piksele_brama(punkt):
    """Brama PIONOWA (przejscie idzie w gore/dol): X na STYKU kafli, Y w srodku.

    Patrz komentarz na gorze pliku — to jest cala roznica miedzy brama, ktora
    lapie cala szerokosc drogi, a taka, ktora ma dziure przy jednej krawedzi.
    """
    return punkt["tx"] * T, punkt["ty"] * T + T // 2


def piksele_brama_pozioma(punkt):
    """Brama POZIOMA (przejscie idzie w lewo/prawo): X w srodku kafla, Y na STYKU.

    Ta sama regula co wyzej, obrocona o 90 stopni — szerokosc przejscia lezy
    teraz na osi Y, wiec to Y musi trafic na styk dwoch kafli. Osobna funkcja,
    a nie flaga, bo pomylka jest CICHA: brama dziala, tylko przy jednej
    krawedzi przejscia ma 16 px martwej strefy i gracz raz na jakis czas
    "przechodzi obok" bramy, ktora widzi.
    """
    return punkt["tx"] * T + T // 2, punkt["ty"] * T

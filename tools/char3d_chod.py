"""Chód Z BRONIĄ W RĘKU — osobny klip, nie wariant zwykłego chodu.

Moduł BLENDEROWY, importowany przez skrypty podglądu i eksportu.
⚠ **NIE ZAPISUJE char.blend** — akcje powstają w pamięci sesji.

── Po co osobny klip ─────────────────────────────────────────────────────────
⚠ **Bo zwykły chód macha OBIEMA rękami, a w jednej jest broń.** Zmierzone na
oryginalnym cyklu z `char.blend`: przy marszu miecz schodzi **2,18 j. pod linię
stóp**, włócznia 3,43, topór bojowy 1,89. Ostrze zamiata grunt przy każdym
kroku. W bezruchu żadna z tych broni nie ma problemu, więc sprawdzanie samej
postawy dawało fałszywe „w normie".

Rozwiązanie jest to samo co przy chwycie oburęcznym: ręka niosąca broń dostaje
POZĘ, a nie zamach. Nogi i wolna ręka chodzą dalej z oryginalnego cyklu, więc
marsz nie traci życia.

── Jak to zbudowane ──────────────────────────────────────────────────────────
Nie da się „nadpisać jednego kanału" w akcji, którą się właśnie odtwarza:
`frame_set` czyta pozy z akcji AKTYWNEJ, a klucze wstawia się do tej samej.
Dlatego najpierw ODCZYTUJEMY całą pozę oryginalnego chodu do pamięci, potem
podpinamy nową akcję i zapisujemy pozę z podmienioną ręką.
"""
import math

import bpy
from mathutils import Euler, Matrix, Quaternion, Vector

import char3d_attack
import char3d_walk
import char3d_weapons

NAZWA = "Walk_Armed"
NAZWA_2H = "Walk_Armed_2H"

# ⚠ Układ klatek jest WŁASNOŚCIĄ `char3d_walk`, nie tego pliku — czytamy go
# stamtąd, żeby nie dało się przestawić cyklu w jednym miejscu i zapomnieć
# o drugim. Dziś: 0-3 cykl, 4 domknięcie pętli, 5 poza bezruchu.
#
# ⚠ **Klatka bezruchu MUSI tu być.** Warianty z bronią i tarczą nadpisują
# dłonie własnymi pozami niesienia; gdyby lista obejmowała tylko pętlę, postać
# stojąca z mieczem wracałaby do pozy z cyklu gołych rąk — czyli machałaby
# bronią w bezruchu.
KLATKI = list(char3d_walk.KLATKI)

# Gdzie trzyma się broń w marszu.
#
# ⚠ **To NIE jest gotowość do ciosu i była to pierwsza, błędna wersja.**
# Gotowość ma rękę wysuniętą przed ciało (world y = −0,58 wobec spoczynkowego
# +0,45), bo tak zaczyna się zamach. W marszu czyta się to jako niesienie broni
# na wyciągniętej ręce — zgłoszone wprost: „dziwnie to wygląda". Marsz chce ręki
# OPUSZCZONEJ przy biodrze, czyli pozycji spoczynkowej ramienia.
#
# Ceną jest brak ciągłości chód → cios (ręka musi przejechać do gotowości), ale
# to załatwia przenikanie klipów w `Character3D`, a wyciągniętej ręki nie
# załatwia nic.
# ⚠ z −6,74 → −6,44 (2026-10-10, BAZA V5): dłuższe ramię (`rozpietosc` 1,10)
#   opuszczało dłoń, a bastard w chwycie 1H schodził w chodzie 0,35 j. pod stopy.
NIESIENIE_1H = (-1.79, 0.45, -6.44)
NIESIENIE_2H = char3d_attack.POZY_2H[0][1]
# ⚠ W BIEGU dłoń z bronią jednoręczną idzie wyżej i do przodu (2026-10-03):
# tułów jest pochylony, więc przy pozie z chodu przedramię ustawiało długie
# ostrza bardziej pionowo i szabla/miecz długi/rapier schodziły 0,5–0,9 j.
# pod grunt w fazie lotu (bramka broni).
NIESIENIE_1H_BIEG = (-1.79, -0.25, -6.05)

# ── NIESIENIE BRONI DRZEWCOWEJ poza walką (2026-10-03) ─────────────────────
# ⚠⚠ Zgłoszone wprost: „chodzenie z włócznią nie powinno polegać na trzymaniu
# jej na ramieniu jak bazooka". `Walk_Armed_2H` trzyma OBIE dłonie przy
# piersi, a drzewce leży ukośnie przy barku — dla topora i młota to naturalne
# (noszone na ramieniu), dla piki koniec sterczał za głową. Jednorącz
# (`Walk_Armed`, z tarczą) było to samo: drzewce ukośnie za barkiem.
# Broń drzewcową w marszu nosi się PIONOWO przy boku, w jednej dłoni, grotem
# w górę — jak straż. Lewa ręka zostaje wolna (albo z tarczą).
# ⛔ To jest poza CARRY: w walce gra wraca do gotowości oburęcznej.
#
# Dłoń: przy boku, trochę wyżej i bardziej z przodu niż `NIESIENIE_1H`
# (przedramię lekko zgięte — trzyma drzewce, a nie wisi z nim).
NIESIENIE_DRZEWCE = (-1.85, -0.35, -6.10)
# Kierunek drzewca (od tylca ku grotowi) w świecie: pion, pochylony do przodu
# (−Y) i odrobinę na zewnątrz (−X, prawa strona), żeby tylec nie wchodził
# w stopę, a grot nie stał za głową.
OS_DRZEWCA_NIESIENIE = (-0.10, -0.30, 0.95)
NAZWA_DRZEWCE = "Walk_Armed_Pole"

# ⚠ Tarcza w lewej dloni: zgloszone wprost (2026-09-20) - przenika przez udo
# w marszu I w bezruchu, bo lewa dlon dotad ZAWSZE machala pelnym cyklem
# chodu (`char3d_shields.py` mowil o tym wprost w naglowku: "lekarstwem jest
# POZA NIESIENIA dla lewej dloni... dokladnie ta sama technika co dla
# prawej" - nigdy nie zrobione).
#
# ⚠⚠ PIERWSZA WERSJA uzyla lustra `NIESIENIE_1H` (dlon przy biodrze, reka
# opuszczona) - poprawne dla MIECZA (spoczywa wzdluz nogi), ale dla TARCZY
# zgloszone wprost jako "trzyma jak za rekojesc miecza" - tarcza dyndajaca
# przy nodze zamiast noszona NA PRZEDRAMIENIU. Ostatecznie autor przeciol
# to inaczej: DWIE POZY, nie jedna - opuszczona jest OK poza walka (patrz
# `NIESIENIE_TARCZA_SPOCZYNEK` nizej), problem byl tylko z tym, ze to byla
# JEDYNA poza, nawet w trakcie starcia.
#
# ⚠⚠⚠ DRUGA WERSJA (pozyczona poza "gotowosc" z `POZY[0]`, potem reka w przod
# i w gore liczona wprost) podniosla dlon, ale ZGLOSZONE PONOWNIE: tarcza
# "jak taca do pizzy" - plaska, pozioma zamiast pionowej, i to NIEJEDNOLICIE
# miedzy klatkami cyklu. Dwie osobne przyczyny, obie znalezione pomiarem:
# (1) unoszenie dloni W GORE I W PRZOD naturalnie SUPINUJE nadgarstek (fizyka
# reki, nie blad) - lico tarczy (dotad ~pionowe, `normal.z=0,01`) przechylalo
# sie do ~0,4-0,55 w Z, czyli mocno w strone poziomu; (2) `_dopasuj` liczy
# jakobian wzgledem OBECNEJ konfiguracji reszty ramienia, a ta byla RÓZNA na
# kazdej klatce cyklu chodu (dziedziczona z oryginalnego wymachu) - stad
# rozny wynik zbieznosci na roznych klatkach dla tego samego celu.
# Naprawa (1): CALY lancuch lewego ramienia (bark/lokiec/cel lokcia) resetowany
# do JEDNEJ stalej referencji (poza klatki 0) PRZED wywolaniem `_dopasuj` -
# ten sam trik co `ORIG_LOC` w `char3d_walk_lean.py` dla identycznego problemu
# po stronie chodu. Naprawa (2): `obrot` tarczy (patrz `char3d_shields.py`)
# dostal kompensujacy skret -40st. w X - dokladnie to, do czego sluzy
# rzemyk/pasek naramienny na PRAWDZIWEJ tarczy: trzyma lico stabilnie mimo
# obrotu przedramienia, wiec kompensacja siedzi we WLASCIWYM miejscu
# (przedmiot), nie w pozie.
#
# ⚠⚠⚠ CZWARTA ITERACJA (2026-09-20) - autor zaproponowal DWIE POZY zamiast
# jednego kompromisu: opuszczona "wzdluz boku" poza walka, wysunieta W WALCE
# (ten sam pomysl co postawa bojowa w WoW). Ta stala to teraz poza WALKI;
# `NIESIENIE_TARCZA_SPOCZYNEK` nizej to poza SPOCZYNKU (mirror `NIESIENIE_1H`,
# jak w pierwszej probie) - obie klatki uzywaja WSPOLNEGO `obrot` tarczy
# (jeden fizyczny przedmiot, jedno mocowanie), wiec przy zmianie ktorejkolwiek
# stalej ZMIERZ OBIE, nie tylko te, ktora zmieniasz - `obrot` dobrany pod
# WALKI moze przechylac SPOCZYNEK inaczej niz oczekujesz.
#
# ⚠ `obrot` tarczy ZOSTAJE NIETKNIETY (kompensacja -40st. dla WALKI cofnieta
# - psula SPOCZYNEK bardziej niz brak kompensacji, a proba przeniesienia
# korekty na obrot KONTROLKI IK nie dziala wcale - zmierzone wprost, kontrolka
# `HandIK_L.005` NIE ma wplywu na obrot efektora, tylko na jego POZYCJE).
# WALKA dostaje wiec zamiast tego NAJLAGODNIEJSZY z przetestowanych celow
# (mniejszy `abs(y)`/wyzszy `z`), ktory dalej wyraznie unosi/wysuwa tarcze,
# ale trzyma przechylenie lica na ~0,34-0,35 w Z zamiast ~0,55-0,57.
# ⚠⚠ **PODNIESIONA W A6.3 (2026-09-21): (1,6; −0,5; −5,6) → (1,3; −2,0; −4,4).**
# Stara wartosc trzymala tarcze na wysokosci PASA. Po dolozeniu `LICO_TARCZY_WALKA`
# lico i tak celuje w przod, wiec kontrast CARRY↔GUARD juz byl — ale tarcza
# zaslaniala brzuch, nie tors. Nowa poza kryje KLATKE (srodek 2,4 j. nad
# biodrem zamiast 1,2), a glowa, prawa reka i miecz zostaja czytelne.
# ⛔ Odrzucone „przez cialo" (0,8; −2,2; −4,2): tarcza wchodzila na tulow
# i glowe, czyli kupowala osloniecie kosztem sylwetki.
# ⚠ BAZA V4 (2026-10-10): −2,0 → −2,3 (Y, do przodu). Przy dłuższych nogach
#   kolano w biegu bojowym sięgało dolnego rogu tarczy rycerskiej (bramka tarcz:
#   1,06 j. w ciele, limit 0,9; migdałowa 0,93). Garda wysunięta o 0,6 j.
#   (podniesienie pogarszało: długa tarcza wchodziła w tułów).
# ⚠ BAZA V4.5 (hybryda): −2,3 → −2,5 — grubsze przedramię i większa dłoń
#   dały pawęż 0,93 / puklerz 0,92 przy limicie 0,9.
NIESIENIE_TARCZA_WALKA = (1.3, -2.5, -4.4)
# ⚠⚠⚠ PIATA ITERACJA (2026-09-20) - poprzednia wersja (2,2 / 0,1 / -6,6)
# naprawila przenikanie ODSUWAJAC CALA REKE od ciala - ale to NIE jest jak
# nosi sie tarcze. Referencja podeslana wprost (grafika wikinga z tarcza):
# UCHWYT/LOKIEC blisko tulowia (przy biodrze), a sama TARCZA z BOKU ciala,
# nie wystawiona daleko na wyciagnietej rece. Naprawa: dlon WRACA blisko
# ciala (mirror `NIESIENIE_1H`, jak w pierwszej probie), a przenikanie
# usuwa sie inaczej - patrz `chwyt` w `char3d_shields.py` (odleglosc DYSKU
# od dloni, nie dloni od ciala). To jest wlasciwosc PRZEDMIOTU (dziala
# spojnie we wszystkich pozach, w przeciwienstwie do `obrot` - patrz
# nauczka wyzej), wiec nie powinno psuc WALKI przy okazji.
NIESIENIE_TARCZA_SPOCZYNEK = (1.79, 0.45, -6.74)

# UWAGA UWAGA: **DRUGI PROFIL NIESIENIA — dla tarcz LARGE** (decyzja autora
# 2026-09-21). Powstal, bo po przejsciu na prawdziwe wymiary konstrukcji trzy
# najwieksze tarcze ORZA GRUNT w pozie wyzej:
#     almond (105 cm)  zejscie +2,43 j. PONIZEJ linii stop
#     pavise (112 cm)  zejscie +1,98
#     scutum (106 cm)  zejscie +0,17  (na styk, jeszcze w tolerancji)
# To nie jest blad modelu, tylko fizyka: tarcza siegajaca od ziemi po brode
# nie wisi przy boku na opuszczonej rece.
#
# KTORA tarcza dostaje ktory profil mowi `shield_shapes.KONSTRUKCJE[...]["profil"]`.
# STOP: to sa DWA profile na szesc tarcz, nie szesc animacji.
#
# UWAGA UWAGA UWAGA: **CENA TEJ POZY TO PRZECHYL TARCZY I JEST NIEUSUWALNA
# SAMA POZA.** Tarcza jest sztywno przypieta wzdluz przedramienia, wiec
# podniesienie dloni OBRACA ja razem z przedramieniem. Zmierzone odchylenie
# dlugiej osi od pionu (`char3d_przymiar_carry_duza.py`):
#     z = -6,74 (poza SMALL)   25 st.  <- ale grunt na czerwono
#     z = -6,40                36 st.
#     z = -6,10                45 st.
#     **z = -5,80              52 st.** <- wybrane: najmniejszy przechyl,
#                                          przy ktorym GRUNT jest czysty
#     z = -5,60                75 st.
# Os X praktycznie nie wplywa na przechyl (48-52 st. dla x od 1,79 do 3,00),
# wiec zostaje na 2,20 — tam przeswit przedramienia jest najwiekszy.
# STOP: nie szukaj tu wartosci bez przechylu. Zeby dostac pionowa tarcze przy
# podniesionej rece, trzeba by ODPIAC jej dluga os od przedramienia, a to jest
# zmiana MOCOWANIA i dotyka takze GUARD — patrz raport z 2026-09-21.
NIESIENIE_TARCZA_SPOCZYNEK_DUZA = (2.20, 0.45, -5.80)

# ⚠⚠ **SKRET NADGARSTKA W POZIE WALKI (A6.3, 2026-09-21).** Stopnie, obrot
# wokol WLASNEJ osi kosci lewej dloni.
#
# Po co: do A6.3 poza GUARD byla pozycyjnie inna od CARRY (dlon wyzej i przed
# cialem), ale **LICO TARCZY zostawalo takie samo** - zmierzone |n·bok| = 1,00
# w OBU pozach. Czyli tarcza byla tylko PODNIESIONA, dalej krawedzia do
# przodu. Kontrast CARRY↔GUARD byl wiec wylacznie w wysokosci, a nie w tym,
# co tarcza robi.
#
# ⛔ **Nie da sie tego zrobic `obrot`em tarczy** - to wlasnosc PRZEDMIOTU,
# wspolna dla obu poz; zmiana zepsulaby CARRY, ktore autor wlasnie zamknal.
# ⛔ **Nie da sie kontrolka IK** - wiez czyta z niej wylacznie POZYCJE
# (`use_rotation=False`, zmierzone).
# ⭐ Da sie KOSCIA DLONI: `Bone.002_L.003` jest POZA lancuchem IK
# (`chain_count=3` obejmuje .002/.004/.001), wiec jej obrot jest wolny.
# To jest skret nadgarstka - dokladnie to, co robi czlowiek stawiajac tarcze.
# ⛔ **SAM SKRET NIE WYSTARCZA — sprawdzone pomiarem i odrzucone.** Obrot
# wokol wlasnej osi kosci zamiata normalna po STOZKU wokol osi ramienia, a
# ramie wisi pionowo, wiec lico dochodzilo najwyzej do |n·przod| = 0,54 i
# reszta szla W GORE (stara wada „taca do pizzy"). Zostawione jako 0.
SKRET_NADGARSTKA_WALKA = 0.0

# ⭐ **W POZIE WALKI LICO TARCZY CELUJE W ZAGROZENIE.** Kierunek w swiecie;
# postac patrzy w −Y, wiec (0,−1,0) znaczy „przodem do tego, z czym walczy".
#
# ⚠ To jest ROZWIAZANIE, nie kat dobrany na oko: `_ustaw_lico_tarczy` liczy
# obrot kosci dloni iteracyjnie („policz, ZMIERZ, skoryguj" — ta sama metoda,
# co `char3d_attack._dopasuj`), bo poza dloni zalezy od calego lancucha IK.
# ⛔ Nie da sie tego zrobic `obrot`em tarczy: to wlasnosc PRZEDMIOTU, wspolna
# dla CARRY i GUARD, a CARRY jest zamkniete (`obrot = −125°`).
LICO_TARCZY_WALKA = (0.374607, -0.927184, 0.0)

# ⚠⚠ **KANT +25 STOPNI — LICO NIE PATRZY PROSTO PRZED SIEBIE I TO JEST
# CELOWE** (decyzja autora 2026-09-22, na renderze z `char3d_przymiar_garda.py`).
#
# Powod: po spionowaniu dlugiej osi garda przestala lezec poziomo, ale zaczela
# czytac sie jak PIONOWA SCIANA. Przyczyne nazwala jedna liczba —
# `|n . przod| = 1,000` na wszystkich szesciu, czyli lico DOKLADNIE prostopadle
# do widoku, matematycznie idealny billboard. Kant daje bryle trzeci wymiar,
# pokazuje kawalek krawedzi i odslania reke, ktora przy 0 stopni znikala
# calkowicie za tarcza.
#
# Zmierzone warianty (zaslona ciala / glowy, pawez — najtrudniejszy przypadek):
#     0     |n|=1,000   51,0% / 40,9%   <- billboard, odrzucone
#   −20     |n|=0,940   51,4% / 43,5%
#   −35     |n|=0,819   47,1% / 40,9%
#   −50     |n|=0,643   43,3% / 35,9%
#   +25     |n|=0,906   44,5% / 27,1%   <- wybrane przez autora na renderze
#   **+22   |n|=0,927** <- WPISANE: najwiekszy kant, ktory nie wpycha tarczy
#                          w tors (patrz nizej). Wizualnie nie do odroznienia.
#
# ⚠ **ZNAK JEST ODWROTNY DO HISTORYCZNEGO I AUTOR WYBRAL GO SWIADOMIE.**
# Reka z tarcza jest po stronie +X, wiec MINUS wysuwa krawedz zewnetrzna do
# przodu — to jest klasyczna garda, cios zsuwa sie na zewnatrz. Przymiar
# rekomendowal −35. Autor obejrzal oba i uznal **+25 za wygladajace
# realniej**; dodatkowo daje najlepsza czytelnosc glowy z calej piatki
# (27% zamiast 41%). ⛔ Nie „poprawiaj" tego z powrotem na minus powolujac
# sie na historycznosc — to jest rozstrzygniete na renderze, a render wygrywa.
#
# ⚠⚠ **DLACZEGO +22, A NIE +25.** Otwarcie lica na zewnatrz wsuwa WEWNETRZNA
# krawedz tarczy w tors — przy +25 okragla wchodzila **0,97 j.** przy progu
# 0,90 (2 wierzcholki ze 114, klatki 0 i 4; przy kancie 0 bylo zero).
# ⚠ Zaleznosc NIE jest monotoniczna i to jest pulapka: mniejszy kant nie
# znaczy bezpieczniejszy, bo krawedzie roznych ksztaltow wchodza w cialo pod
# roznymi katami. Zmierzone najglebsze wejscie po WSZYSTKICH szesciu:
#     +25 -> 0,97 (okragla)  PRZEKRACZA
#     +22 -> 0,86 (pawez)    czysto   <- wybrane
#     +20 -> 0,86 (pawez)    czysto
#     +18 -> 0,86 (pawez)    czysto
#     +15 -> 0,98 (rycerska) PRZEKRACZA
#     +10 -> 0,89 (migdalowa)
# ⛔ Nie podnos progu `GLEBOKOSC_ABSURDALNA`, zeby zmiescic +25 — prog jest
# kalibrowany na czym innym, a 3 stopnie nie sa nic warte na ekranie.
#
# ⛔ Nie da sie tego zrobic `obrot`em tarczy: to wlasnosc PRZEDMIOTU, wspolna
# dla CARRY i GUARD, a CARRY jest zamkniete.

# ⭐⭐ **W POZIE WALKI DLUGA OS TARCZY STOI PIONOWO.** Kierunek w swiecie dla
# LOKALNEGO +Y tarczy, czyli dla jej wlasnego "dolu" (u rycerskiej to ostrze,
# patrz `shield_shapes.ksztalt_heater`: barki siedza przy v = -1, ostrze przy
# v = +1). Stad (0, 0, -1) — swiatowe "w dol".
#
# ⚠⚠ **PO CO TO ISTNIEJE.** `_ustaw_lico_tarczy` ustawia tylko NORMALNA lica
# i zostawia jeden stopien swobody: obrot tarczy we WLASNEJ plaszczyznie.
# Dopoki modele byly dwa i oba OKRAGLE, ten stopien swobody nie znaczyl nic —
# kolo wyglada tak samo pod kazdym katem. Przy szesciu konstrukcjach zaczal
# znaczyc wszystko: w GUARD przedramie lezy poziomo w poprzek klatki, a tarcza
# jest do niego sztywno przypieta, wiec rycerska, migdalowa, legionowa i pawez
# staly POZIOMO — zmierzone **87 stopni od pionu** na wszystkich czterech.
# Bramka tego nie widziala, bo sprawdzala wylacznie kierunek LICA.
#
# ⛔ **Nie da sie tego zrobic `obrot`em tarczy.** To wlasnosc PRZEDMIOTU,
# wspolna dla CARRY i GUARD, a przedramie obraca sie miedzy tymi pozami o ~90
# stopni — kazda wartosc dobra dla jednej pozy psuje druga. CARRY jest
# zamkniete (`obrot = -125`), wiec korekta nalezy do POZY.
#
# ⭐ Obrot idzie wokol NORMALNEJ LICA, i to jest cala sztuczka: taki obrot
# **nie rusza kierunku lica ani polozenia tarczy**, tylko obraca ja w jej
# wlasnej plaszczyznie. Dla kola jest wizualnie zerowy, wiec JEDNA poza
# obsluguje wszystkie szesc konstrukcji — bez osobnych animacji per archetyp.
PION_TARCZY_WALKA = (0.0, 0.0, -1.0)


def _normalna_lica_w_kosci():
    """Normalna lica tarczy w przestrzeni KOSCI DLONI.

    ⚠ Liczona z `char3d_shields.TARCZE[...]["obrot"]`, nie z obiektu — poza
    musi dac sie zbudowac takze wtedy, gdy zadna tarcza nie jest w scenie
    (tak wola ja eksport). Dysk powstaje w plaszczyznie XY obiektu
    (`char3d_shields._bryla_tarczy`), wiec jego normalna w obiekcie to +Z.

    ⚠ **Obie tarcze musza miec ten sam `obrot`** — inaczej jedna poza nie
    obsluzy obu. Dzis maja (−125°); gdy przestana, ta funkcja krzyknie.
    """
    import char3d_shields
    obroty = {tuple(cfg["obrot"]) for cfg in char3d_shields.TARCZE.values()}
    if len(obroty) != 1:
        raise RuntimeError(
            f"tarcze maja ROZNE katy noszenia {obroty} — jedna poza WALKI nie "
            f"ustawi lica obu. Rozdziel poze albo wyrownaj `obrot`.")
    obrot = next(iter(obroty))
    return Euler([math.radians(v) for v in obrot], "XYZ").to_matrix() @ Vector((0.0, 0.0, 1.0))


def _os_dluga_w_kosci():
    """Dluga os tarczy (jej wlasny "dol") w przestrzeni KOSCI DLONI.

    Siatka powstaje w plaszczyznie XY obiektu (`char3d_shields._bryla_tarczy`),
    a pion tarczy to lokalne +Y — ten sam uklad, z ktorego `_normalna_lica_w_kosci`
    bierze +Z. Liczone z `obrot`, nie z obiektu, bo poza musi dac sie zbudowac
    takze wtedy, gdy zadnej tarczy nie ma w scenie (tak wola ja eksport).
    """
    import char3d_shields
    obroty = {tuple(cfg["obrot"]) for cfg in char3d_shields.TARCZE.values()}
    if len(obroty) != 1:
        raise RuntimeError(
            f"tarcze maja ROZNE katy noszenia {obroty} — jedna poza WALKI nie "
            f"ustawi pionu wszystkich. Rozdziel poze albo wyrownaj `obrot`.")
    obrot = next(iter(obroty))
    return Euler([math.radians(v) for v in obrot], "XYZ").to_matrix() @ Vector((0.0, 1.0, 0.0))


def _ustaw_pion_tarczy(arm, pb_dlon, cel_swiat, iteracje=12):
    """Obraca KOSC DLONI WOKOL NORMALNEJ LICA, az dluga os trafi w `cel_swiat`.

    ⚠ **Wolane PO `_ustaw_lico_tarczy` i tylko wtedy.** Tamto ustawia normalna
    lica; to domyka pozostaly stopien swobody. Obrot wokol wlasnej normalnej
    z definicji NIE RUSZA tej normalnej, wiec kolejnosc jest bezpieczna
    i `lico_przod` zostaje nietkniete.

    ⚠ Iteracyjnie, jak `_ustaw_lico_tarczy` i `char3d_attack._dopasuj`: poza
    dloni zalezy od calego lancucha IK, wiec „policz, ZMIERZ, skoryguj" jest
    tansze i pewniejsze niz wzor z zalozeniem o przestrzeni skladania
    kwaternionow.

    Zwraca koncowy blad w stopniach.
    """
    cel = Vector(cel_swiat).normalized()
    y_kosc = _os_dluga_w_kosci()
    n_kosc = _normalna_lica_w_kosci()
    najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), 9e9
    for _ in range(iteracje):
        bpy.context.view_layer.update()
        m = arm.matrix_world.to_3x3() @ pb_dlon.matrix.to_3x3()
        os_obrotu = (m @ n_kosc).normalized()      # normalna lica, w SWIECIE
        teraz = (m @ y_kosc).normalized()
        # ⚠ Mierzymy kat W PLASZCZYZNIE LICA, nie w przestrzeni: skladowa
        # wzdluz normalnej jest nieosiagalna tym obrotem, wiec wliczanie jej
        # do bledu kazaloby iteracji gonic cel, ktorego nie da sie dosiegnac.
        t_rzut = teraz - os_obrotu * teraz.dot(os_obrotu)
        c_rzut = cel - os_obrotu * cel.dot(os_obrotu)
        if t_rzut.length < 1e-6 or c_rzut.length < 1e-6:
            break                                   # os rownolegla do normalnej
        t_rzut.normalize()
        c_rzut.normalize()
        kat = math.atan2(t_rzut.cross(c_rzut).dot(os_obrotu), t_rzut.dot(c_rzut))
        blad = abs(kat)
        if blad < najlepszy_blad:
            najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), blad
        if blad < math.radians(1.0):
            break
        os_lok = m.inverted() @ os_obrotu
        pb_dlon.rotation_quaternion = (
            pb_dlon.rotation_quaternion @ Quaternion(os_lok, kat)).normalized()
    pb_dlon.rotation_quaternion = najlepszy
    bpy.context.view_layer.update()
    return math.degrees(najlepszy_blad)


def _ustaw_lico_tarczy(arm, pb_dlon, cel_swiat, iteracje=12):
    """Obraca KOSC DLONI tak, zeby lico tarczy celowalo w `cel_swiat`.

    ⚠ **Iteracyjnie, bo poza dloni zalezy od calego lancucha IK** — ta sama
    metoda, ktora `char3d_attack._dopasuj` stosuje do pozycji. Proba policzenia
    tego jednym wzorem wymagalaby zalozenia o przestrzeni, w ktorej Blender
    sklada `rotation_quaternion` z macierza spoczynku; pomiar jest tanszy
    i nie da sie pomylic.
    """
    cel = Vector(cel_swiat).normalized()
    n_kosc = _normalna_lica_w_kosci()
    najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), 9e9
    for _ in range(iteracje):
        bpy.context.view_layer.update()
        m = arm.matrix_world.to_3x3() @ pb_dlon.matrix.to_3x3()
        teraz = (m @ n_kosc).normalized()
        blad = teraz.angle(cel)
        if blad < najlepszy_blad:
            najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), blad
        if blad < math.radians(1.0):
            break
        # Poprawka w przestrzeni SWIATA, przeniesiona na os lokalna kosci.
        q = teraz.rotation_difference(cel)
        os_sw, kat = q.to_axis_angle()
        os_lok = m.inverted() @ os_sw
        pb_dlon.rotation_quaternion = (
            pb_dlon.rotation_quaternion @ Quaternion(os_lok, kat)).normalized()
    pb_dlon.rotation_quaternion = najlepszy
    bpy.context.view_layer.update()
    return math.degrees(najlepszy_blad)


def _os_broni_w_kosci():
    """Oś broni dwuręcznej (tylec → grot) i kierunek OSTRZA w kości dłoni.

    Liczone z `KAT_2H` i skrętu ostrza (`char3d_weapons.OSTRZE_DRZEWCOWEJ`:
    gdzie w obiekcie leży ostrze `+x` przedmiotu), nie z obiektu — poza musi
    się dać zbudować bez broni w scenie (tak woła ją eksport).
    ⚠ Stała, nie wpisany wektor: od 2026-10-12 ostrze broni NIEdrzewcowej
    leży na −Z, a drzewcowej na +Z — literał rozjechałby się z siatką bez
    śladu w raporcie.
    """
    obr = Matrix.Rotation(math.radians(char3d_weapons.KAT_2H), 3, "X")
    return obr @ Vector((0.0, 1.0, 0.0)), obr @ Vector(char3d_weapons.OSTRZE_DRZEWCOWEJ)


def _ustaw_drzewce(arm, pb_dlon, cel_os, iteracje=12):
    """Obraca KOŚĆ PRAWEJ DŁONI, aż oś broni trafi w `cel_os`, a ostrze
    (halabarda, glewia, grot płaski) patrzy w przód postaci.

    ⚠ Iteracyjnie, jak `_ustaw_lico_tarczy`: poza dłoni zależy od całego
    łańcucha IK, więc „policz, ZMIERZ, skoryguj". Kość dłoni jest POZA
    łańcuchem (`chain_count=3`), więc obrót nie rusza jej pozycji.
    Zwraca końcowy błąd osi w stopniach.
    """
    cel = Vector(cel_os).normalized()
    os_k, ostrze_k = _os_broni_w_kosci()
    najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), 9e9
    for _ in range(iteracje):
        bpy.context.view_layer.update()
        m = arm.matrix_world.to_3x3() @ pb_dlon.matrix.to_3x3()
        teraz = (m @ os_k).normalized()
        blad = teraz.angle(cel)
        if blad < najlepszy_blad:
            najlepszy, najlepszy_blad = pb_dlon.rotation_quaternion.copy(), blad
        if blad < math.radians(0.5):
            break
        os_sw, kat = teraz.rotation_difference(cel).to_axis_angle()
        pb_dlon.rotation_quaternion = (
            pb_dlon.rotation_quaternion @ Quaternion(m.inverted() @ os_sw, kat)).normalized()
    pb_dlon.rotation_quaternion = najlepszy
    bpy.context.view_layer.update()
    # Skręt wokół drzewca: ostrze do przodu (−Y świata), rzut na płaszczyznę
    # prostopadłą do osi — ten obrót z definicji nie rusza osi.
    m = arm.matrix_world.to_3x3() @ pb_dlon.matrix.to_3x3()
    os_sw = (m @ os_k).normalized()
    przod = Vector((0.0, -1.0, 0.0))
    t_ = (m @ ostrze_k); t_ -= os_sw * t_.dot(os_sw)
    c_ = przod - os_sw * przod.dot(os_sw)
    if t_.length > 1e-6 and c_.length > 1e-6:
        t_.normalize(); c_.normalize()
        kat = math.atan2(t_.cross(c_).dot(os_sw), t_.dot(c_))
        pb_dlon.rotation_quaternion = (
            pb_dlon.rotation_quaternion @ Quaternion(m.inverted() @ os_sw, kat)).normalized()
        bpy.context.view_layer.update()
    return math.degrees(najlepszy_blad)


def _zczytaj_poze(arm, akcja):
    """Pozy wszystkich kości oryginalnego chodu, klatka po klatce."""
    poprzednia = arm.animation_data.action
    arm.animation_data.action = akcja
    scn = bpy.context.scene
    zapis = {}
    for f in KLATKI:
        scn.frame_set(f)
        zapis[f] = {
            pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(),
                      pb.rotation_euler.copy(), pb.scale.copy())
            for pb in arm.pose.bones
        }
    arm.animation_data.action = poprzednia
    return zapis


def _nazwa_akcji(oburacz, bron, tarcza, walka, duza=False, drzewce=False):
    """Nazwa klipu.

    UWAGA: przyrostek `_Large` dostaje WYLACZNIE CARRY. GUARD zostaje JEDEN
    dla wszystkich szesciu konstrukcji — tam tarcza jest wystawiona przed
    siebie i duza nie ma gdzie zawadzic (zmierzone: zejscie -4,0 do -4,8 j.
    nad stopami dla kazdej z szesciu).
    """
    if drzewce:
        if walka:
            # GOTOWOŚĆ bojowa drzewcowej: drzewce opuszczone do przodu.
            return NAZWA_DRZEWCE + ("_Shielded" if tarcza else "") + "_Combat"
        # CARRY broni drzewcowej: jednorącz pionowo, z tarczą albo bez.
        return NAZWA_DRZEWCE + ("_Shielded" + ("_Large" if duza else "") if tarcza else "")
    if oburacz:
        return NAZWA_2H  # tarcza niemozliwa razem z chwytem oburecznym
    if walka:
        duza = False     # GUARD jest wspolny — patrz docstring
    przyrostek = "_Large" if (tarcza and duza) else ""
    if bron and tarcza:
        return ("Walk_Armed_Shielded_Combat" if walka
                else "Walk_Armed_Shielded" + przyrostek)
    if tarcza:
        return "Walk_Shielded_Combat" if walka else "Walk_Shielded" + przyrostek
    return NAZWA


def zbuduj_chod_uzbrojony(arm=None, oburacz=False, bron=True, tarcza=False,
                          walka=False, duza=False, drzewce=False, zrodlo="Walk"):
    """Tworzy (albo nadpisuje) klip chodu z bronią i/lub tarczą i zwraca akcję.

    `bron` (domyslnie True) - czy PRAWA dlon dostaje poze niesienia (bron nie
    macha w marszu). `tarcza` - to samo dla LEWEJ dloni (tarcza nie macha i
    nie przenika przez udo). Niezalezne flagi - `bron=False, tarcza=True`
    daje gola prawa reke + niesiona tarcze.

    `walka` (tylko z `tarcza=True`) - wybiera KTORA poza tarczy: postawa
    bojowa (`NIESIENIE_TARCZA_WALKA`, wysunieta przed siebie) albo spoczynek
    (`NIESIENIE_TARCZA_SPOCZYNEK`, opuszczona wzdluz ciala). Zgloszone wprost
    jako pomysl "jak w WoW" - postac przyjmuje postawe bojowa dopiero W
    WALCE, nie caly czas.

    `duza` (tylko z `tarcza=True`, ignorowane przy `walka=True`) - profil
    niesienia LARGE dla tarcz, ktore w pozie SPOCZYNEK oralyby grunt
    (migdalowa, legionowa, pawez). Patrz `NIESIENIE_TARCZA_SPOCZYNEK_DUZA`.

    `drzewce` - CARRY broni drzewcowej (`NIESIENIE_DRZEWCE`): prawa dlon
    trzyma drzewce PIONOWO przy boku, lewa wolna albo z tarcza.
    `zrodlo` (2026-10-03) - cykl NÓG i wolnej ręki: "Walk" albo "Run"
    (`char3d_run`). Wariant z biegu nazywa się jak z chodu, z "Run" w miejscu
    "Walk" — ręce z bronią/tarczą dostają TE SAME pozy niesienia.
    `drzewce` + `walka` (2026-10-03) - GOTOWOSC drzewcowej: drzewce opuszczone
    do przodu jak klatka 0 pchniecia (`char3d_thrust`); bez tarczy oburacz
    (lewa na drzewcu), z tarcza jednoracz (tarcza w pozie WALKI).
    """
    if drzewce and oburacz:
        raise ValueError("drzewce wybiera chwyt sam (walka bez tarczy = oburącz) — bez `oburacz`")
    arm = arm or bpy.data.objects["Armature"]
    # ⚠ Bez tego pozy chodu przychodzą z obiektem obróconym o −90° (turntable
    # zapisany w akcji `Walk`), a nowy klip nie ma czym tego cofnąć.
    char3d_attack.zdejmij_obrot_turntable(arm)
    chod = bpy.data.actions[zrodlo]
    zapis = _zczytaj_poze(arm, chod)

    nazwa = _nazwa_akcji(oburacz, bron, tarcza, walka, duza, drzewce)
    if zrodlo != "Walk":
        nazwa = nazwa.replace("Walk", zrodlo, 1)
    stara = bpy.data.actions.get(nazwa)
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new(nazwa)
    akcja.use_fake_user = True
    arm.animation_data.action = akcja

    hr = arm.pose.bones["HandIK_R.005"]
    hl = arm.pose.bones["HandIK_L.005"]
    scn = bpy.context.scene

    for f in KLATKI:
        scn.frame_set(f)
        for pb in arm.pose.bones:
            loc, quat, eul, skala = zapis[f][pb.name]
            pb.location = loc
            pb.rotation_quaternion = quat
            pb.rotation_euler = eul
            pb.scale = skala

        # Ręka z bronią przestaje machać — dostaje pozę niesienia.
        #
        # ⚠ `NIESIENIE_*` to wspolrzedne ABSOLUTNE zmierzone na rigu sprzed
        # przebudowy bazy. Na rigu o innych proporcjach trzeba je przeniesc
        # tak samo jak pozy ciosu, inaczej dlon jedzie do dawnej wysokosci
        # biodra — a przy dluzszych nogach to juz polowa uda i bron ORZE ZIEMIE.
        # Tak wlasnie miecz schodzil 0,67 j. pod stopy przy poprawnej pozie.
        bark_w, skala = char3d_attack._przelicznik(arm)
        if oburacz:
            # Druga dłoń ląduje na drzewcu, dokładnie jak w ciosie oburęcznym:
            # gdy chwyt wypada poza zasiegiem lewego ramienia, bron podchodzi
            # do lewego barku, zamiast zostawiac dlon w powietrzu.
            niesienie = char3d_attack._przenies(NIESIENIE_2H, bark_w, skala, prawa=True)
            bark_l = arm.matrix_world @ arm.data.bones["Bone.002_L.001"].head_local
            zasieg_l = ((arm.matrix_world
                         @ arm.data.bones["Bone.002_L.003"].head_local) - bark_l).length
            cel_prawa = Vector(niesienie)
            cel = None
            for _ in range(5):
                char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R,
                                       tuple(cel_prawa), True, ulamek_zasiegu=0.90)
                bpy.context.view_layer.update()
                dg = bpy.context.evaluated_depsgraph_get()
                ev = arm.evaluated_get(dg)
                chwyt = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_R].tail
                os_w = char3d_attack._os_drzewca(ev, char3d_weapons.KAT_2H)
                cel = chwyt - os_w * char3d_weapons.ODLEGLOSC_CHWYTU_2H
                nadmiar = (cel - bark_l).length - zasieg_l * 0.97
                if nadmiar <= 0.0:
                    break
                cel_prawa += (bark_l - cel_prawa).normalized() * nadmiar
            char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, tuple(cel), False)
        else:
            if bron and drzewce and walka:
                # ⚠ Import leniwy: `char3d_thrust` importuje ten moduł.
                import char3d_thrust
                _k, cel_p, os_p, _s, _p = (char3d_thrust.POZY_1H if tarcza
                                            else char3d_thrust.POZY_2H)[0]
                cel_p = char3d_attack._przenies(cel_p, bark_w, skala, prawa=True)
                pb_r = arm.pose.bones[char3d_attack.DLON_R]
                char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, cel_p, True,
                                       ulamek_zasiegu=0.90)
                pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
                bpy.context.view_layer.update()
                _ustaw_drzewce(arm, pb_r, os_p)
                if not tarcza:
                    # lewa na drzewcu, za prawą — jak w pchnięciu
                    dg = bpy.context.evaluated_depsgraph_get()
                    ev = arm.evaluated_get(dg)
                    chwyt = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_R].tail
                    os_w = char3d_attack._os_drzewca(ev, char3d_weapons.KAT_2H)
                    cel_l = chwyt - os_w * char3d_weapons.ODLEGLOSC_CHWYTU_2H
                    char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, tuple(cel_l), False)
            elif bron and drzewce:
                niesienie = char3d_attack._przenies(NIESIENIE_DRZEWCE, bark_w, skala, prawa=True)
                char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, niesienie, True)
                pb_r = arm.pose.bones[char3d_attack.DLON_R]
                pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
                bpy.context.view_layer.update()
                _ustaw_drzewce(arm, pb_r, OS_DRZEWCA_NIESIENIE)
            elif bron:
                niesienie = char3d_attack._przenies(
                    NIESIENIE_1H_BIEG if zrodlo == "Run" else NIESIENIE_1H, bark_w, skala, prawa=True)
                char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, niesienie, True)
            if tarcza:
                # ⚠⚠ Zgloszone wprost jako "raz tarcza plaska jak taca do
                # pizzy, raz normalna" - ROZNE wyniki na roznych klatkach dla
                # TEGO SAMEGO celu. Przyczyna: `_dopasuj` sam liczy swoj
                # poczatkowy strzal (`_local_z_swiata`), wiec NIE dziedziczy
                # poprzedniej lokacji kontrolki - ale JAKOBIAN mierzy
                # wrazliwosc efektora na kontrolke PRZY OBECNEJ konfiguracji
                # reszty ramienia (bark/lokiec), a ta rozni sie klatka od
                # klatki (kazda klatka ma inna, oryginalna poze wymachu z
                # cyklu chodu). Rozny jakobian -> rozny zbiegniety wynik,
                # mimo identycznego celu. Naprawa: PRZED dopasowaniem
                # resetujemy caly lancuch lewego ramienia (i cel lokcia) do
                # jednej, STALEJ referencji (poza z klatki 0), zeby jakobian
                # byl ten sam na kazdej klatce - dokladnie jak `ORIG_LOC` w
                # `char3d_walk_lean.py` dla tego samego rodzaju problemu.
                for nazwa_kosci in ("Bone.002_L", "Bone.002_L.001",
                                    "Bone.002_L.002", "Bone.002_L.004",
                                    "Elbow_L.007"):
                    pb_ref = arm.pose.bones.get(nazwa_kosci)
                    if pb_ref is None:
                        continue
                    loc0, quat0, eul0, skala0 = zapis[0][nazwa_kosci]
                    pb_ref.location = loc0
                    pb_ref.rotation_quaternion = quat0
                    pb_ref.rotation_euler = eul0
                    pb_ref.scale = skala0
                bpy.context.view_layer.update()
                # Tarcza dostaje jedna z dwoch poz, niezaleznie od tego, czy
                # prawa dlon niesie bron, czy chodzi swobodnie: bojowa
                # (wysunieta) albo spoczynkowa (opuszczona wzdluz ciala) -
                # patrz komentarz przy stalych `NIESIENIE_TARCZA_*` wyzej.
                if walka:
                    cel_tarczy = NIESIENIE_TARCZA_WALKA
                elif duza:
                    cel_tarczy = NIESIENIE_TARCZA_SPOCZYNEK_DUZA
                else:
                    cel_tarczy = NIESIENIE_TARCZA_SPOCZYNEK
                niesienie_l = char3d_attack._przenies(cel_tarczy, bark_w, skala, prawa=False)
                char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, niesienie_l, False)
                # ⚠ USTAWIENIE LICA - tylko w pozie WALKI. Patrz stale wyzej.
                # Idzie PO `_dopasuj`, bo tamto rozwiazuje lancuch IK, a kosc
                # dloni jest POZA nim (`chain_count=3`), wiec jej obrot jest
                # wolny i nie rusza pozycji dloni.
                pb_dlon = arm.pose.bones[char3d_attack.DLON_L]
                pb_dlon.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
                bpy.context.view_layer.update()
                if walka:
                    _ustaw_lico_tarczy(arm, pb_dlon, LICO_TARCZY_WALKA)
                    # ⚠ KOLEJNOSC JEST OBOWIAZKOWA: najpierw lico, potem pion.
                    # Pionowanie obraca kosc WOKOL normalnej lica, wiec nie
                    # rusza tego, co ustawil krok pierwszy. Odwrotna kolejnosc
                    # skasowalaby pion bez sladu w raporcie.
                    _ustaw_pion_tarczy(arm, pb_dlon, PION_TARCZY_WALKA)

        for pb in arm.pose.bones:
            pb.keyframe_insert(data_path="location", frame=f, group=pb.name)
            if pb.rotation_mode == "QUATERNION":
                pb.keyframe_insert(data_path="rotation_quaternion", frame=f, group=pb.name)
            else:
                pb.keyframe_insert(data_path="rotation_euler", frame=f, group=pb.name)

    # ⚠⚠ ZERUJ obrót kości prawej dłoni (noszenie drzewcowe go ustawia) —
    # klipy bez kluczy na tej kości czytałyby inaczej OSTATNI obrót stąd.
    arm.pose.bones[char3d_attack.DLON_R].rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
    bpy.context.view_layer.update()
    print(f"[chod] akcja '{nazwa}': {len(KLATKI)} klatek"
          f"{' (chwyt oburęczny)' if oburacz else ''}")
    return akcja

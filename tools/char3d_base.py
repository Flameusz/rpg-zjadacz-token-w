"""MASTER HUMANOID BASE - parametryczna lalka humanoidalna dla char.blend.

    from char3d_base import zbuduj; zbuduj()

Przebudowuje GEOMETRIE i POZE SPOCZYNKOWA rigu, zachowujac wszystko, na czym
wisi reszta pipeline'u. To nie jest "nowy model" - to ten sam plik o poprawnych
proporcjach.

== Co ten modul CELOWO zostawia bez zmian ==

Kazda z tych rzeczy ma poza soba kod, ktory zaswiecilby na czerwono dopiero
w grze:

1. NAZWY KOSCI (`Bone`, `Bone.002_R.003`, ...). Mapa kosc->strefa koloru zyje
   w `char3d_zones.BONE_ZONE`, pancerz wycina sie po tych samych nazwach
   (`char3d_armor`), a bron i tarcza wisza na `Bone.002_R.003` /
   `Bone.002_L.003`. Zmiana nazwy = cicha awaria w trzech miejscach naraz.
2. NAZWY OBIEKTOW `Cube.001` (cialo) i `Cube` (glowa) - pobierane wprost.
3. SKALA OBIEKTU `Armature` = 1,6527. Bron i tarcze maja rozmiary wpisane
   w przestrzeni LOKALNEJ, wiec kazda zmiana tej skali przeskalowalaby caly
   ekwipunek naraz (patrz public/assets/README.md).
4. DLUGOSC KOSCI DLONI (0,68 j.) i polozenie NADGARSTKA. Przedmiot siada na
   OGONIE kosci dloni, wiec przesuniecie go przenosi kazda bron w grze.
5. POZA SPOCZYNKOWA = T-POZA dla rak, nogi w dol. Akcja `Walk` trzyma obroty
   WZGLEDEM spoczynku; zmiana konwencji obrocilaby cala animacje.
6. ROLL kosci - z tego samego powodu co wyzej (lokalne osie obrotu).

== Dlaczego w ogole ==

Zmierzone na modelu sprzed przebudowy (2026-09-19):

    glow w sylwetce      3,29   (dorosly czlowiek ~7,5; chibi ~3)
    szerokosc glowy      87% szerokosci ciala
    proporcje glowy      W/H = 1,00 - dokladnie kula
    dlugosc nogi         37% wzrostu (dorosly ~47%)
    dlonie               brak - ramie konczy sie stozkiem
    szyja                brak - glowa siedzi na barkach
    twarz                brak

Figura o 3,3 glowach wyrenderowana na te sama wysokosc co siedmioglowy NPC
czyta sie jako DZIECKO, nawet gdy obie maja tyle samo pikseli. Dlatego
"gracz wyglada na za malego" nie jest problemem skali sceny - jest problemem
proporcji i naprawia sie TUTAJ, bez ruszania skali swiata.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# --- Proporcje -------------------------------------------------------------
# Wszystko jako ULAMEK WZROSTU. Tak opisuje czlowieka antropometria i tak tez
# najlatwiej zrobic z tej bazy innego humanoida: zmieniasz `glow` i kilka
# szerokosci, a nie dwiescie wspolrzednych.
#
# ⚠ `glow` = ile razy wysokosc glowy miesci sie we wzroscie. 7,5 to pomiar
# doroslego czlowieka, 6,5 to STYLIZACJA (glowa o ~15% wieksza od realnej),
# ponizej 5 zaczyna sie chibi. Trzymamy 6,5, bo przy 60 px postaci glowa ma
# wtedy ~9 px - dosc, zeby zmiescic oczy i linie wlosow.
# ⭐⭐ BAZA V5 (2026-10-10, autor: „przenieś styl mieszkańców na bazę"):
# styl `czytelny` (dopiski 23–25 `postac3d_checkpoint`) WPISANY w bazę — gracz
# i mieszkańcy mają z definicji tę samą bryłę: głowa ~3,9 uniesiona o 0,046,
# grubsze kończyny, większe dłonie i stopy, szerszy bark, rozpiętość ×1,17.
# Wartości sprzed V5 = `char3d_variants.STYL["bazowy"]` (ujemne delty).
PROPORCJE = {
    "wzrost_m": 1.85,          # metry - do raportu i przelicznika
    # ⚠ OPISOWE, celowo nic nie steruje. Nie "podpinaj" tego - gabaryt postaci
    # wynika z wymiarow, nie z deklarowanej masy, a udawana zaleznosc byla by
    # kolejnym polem, ktore trzeba pamietac, zeby zaktualizowac.
    "masa_kg": 75.0,           # referencja gabarytu, nie symulacja fizyczna

    # ⚠⚠ `glow` NIE jest liczba z antropometrii i nie wolno jej tam szukac.
    # Jest DOBRANA DO SWIATA GRY. Zmierzone na pixel-artowych NPC-ach
    # (`peasant`, `hanna`, `miller`, `hunter`, `sulislaw`, `elder`, `father`):
    #
    #     glow w sylwetce          3,0 - 3,9   (srednia ~3,5)
    #     szerokosc sylwetki / H   0,47 - 0,55
    #     szerokosc glowy / barki  0,64 - 0,71
    #
    # Postac o 6,34 glowach i glowie na 33% szerokosci barkow zostala przy tych
    # sasiadach ODRZUCONA jako "manekin z glowa jak pinezka" - i sluszne, bo
    # wygladala jak z innej gry. 7,5 (dorosly czlowiek) jest tu jeszcze gorsze.
    # 4,6 to kompromis: wyraznie dorosly mezczyzna, ale czytelny obok NPC-a.
    # V3.3g: 4,6 -> 4,4 (glowa minimalnie wieksza wzgledem calej sylwetki,
    # W:H glowy w `glowa_szerokosc` NIETKNIETE, wiec ksztalt sie nie zmienia,
    # tylko skala) - patrz docs/postac3d_checkpoint.md "V3.3g".
    # V3.5: dopisek 18 (2026-09-20) ZAMKNAL to pytanie przy STARYM celu
    # (jeden spojny model, portret gracza) - autor obejrzal zrzuty i uznal
    # 4,4 za niewadliwe. Dzisiejsza zmiana celu (czytelnosc na telefonie,
    # baza pod inne postacie, bezposrednie porownanie z Patryczkiem: "nogi za
    # dlugie, glowa za krotka") to NOWY, konkretny argument wizualny - dokladnie
    # warunek, ktory dopisek 18 sam postawil do ponownego otwarcia. 4,4 -> 3,9
    # (dolna granica already-udokumentowanego celu z pomiaru NPC-ow wyzej, nie
    # nowa, wymyslona liczba). Tylko SKALA glowy (W:H w `glowa_szerokosc`
    # NIETKNIETE) - zero ryzyka dla szkieletu/animacji, w przeciwienstwie do
    # `biodro`/`kolano` (dlugosc nog), ktore siedza w `_uklad()` i wiaza sie z
    # juz wytrenowana animacja Walk.
    # ⭐ 3,9 → 3,45 (2026-10-03, decyzja autora po pomiarze A/B): w renderze gry
    # model miał 4,42 głowy wobec 3,0–3,9 u NPC-ów — „głowa jak pinezka" wracała.
    "glow": 3.9,

    # --- pionowe punkty orientacyjne (ulamek wzrostu, 0 = podeszwa) ---
    # ⚠ Wieksza glowa musi skads wziac miejsce i bierze je z TULOWIA, nie z nog.
    # Krotkie nogi byly jedna z wad pierwszej wersji, wiec biodro zostaje na
    # ~47% wzrostu; skraca sie odcinek biodro-obojczyk. Tak wlasnie wygladaja
    # krepe sylwetki NPC-ow.
    "kostka": 0.041,
    # V3.3i: 0,255 -> 0,230. Udo (biodro-kolano) i lydka (kolano-kostka) byly
    # niemal ROWNE (0,215 vs 0,213) - stad "bocianie nogi": noga bez
    # wyraznie WIEKSZEGO czlonu u gory. Kolano NIZEJ przenosi ~0,025 wzrostu
    # z lydki do uda (teraz 0,240 vs 0,188), bez zmiany calkowitej dlugosci
    # nogi (biodro-kostka nietkniete, wiec wzrost zostaje ~12,8) - patrz
    # docs/postac3d_checkpoint.md "V3.3i" pkt. Nogi.
    # V3.5: druga polowa poprawki "nogi za dlugie" (pierwsza to `glow` wyzej).
    # ⚠⚠ TO JEST KOSC, nie kosmetyka - `_uklad()` czyta te trzy wartosci
    # wprost jako pozycje `Bone_L.001` (biodro) i `Bone_L.002`(kolano_gora)/
    # kolano_dol), a te dlugosci wiaza sie z juz wytrenowana animacja "Walk"
    # (IK celuje w punkty w swiecie dobrane pod DZISIEJSZA dlugosc kosci).
    # Ryzyko: stopa niedokladnie trafiajaca w ziemie, kolano zginajace sie
    # inaczej niz przedtem. Zaakceptowane wprost przez autora ("sprobujmy")
    # po zobaczeniu, ze sama wieksza glowa nie wystarczyla (bezposrednie
    # porownanie z Patryczkiem, noga dalej wyraznie dluzsza). Biodro obnizone
    # o 0,020 (0,470->0,450, noga krotsza o ~0,26 j.), krocze o TA SAMA
    # odleglosc od biodra co przedtem (0,030), kolano PROPORCJONALNIE (ten sam
    # stosunek udo:noga co przed zmiana, 0,561), zeby noga byla krotsza jako
    # CALOSC, a nie miala jednego segmentu nienaturalnie sciety. Talia i
    # wszystko powyzej NIETKNIETE - skrocona noga oddaje wysokosc torsowi.
    "kolano": 0.242,
    # A4: ⚠ WARTOSC ZMIENIONA 0,420 -> 0,400, bo dotad NIC jej nie czytalo,
    # a 0,400 to FAKTYCZNA wysokosc, na ktorej tulow sie zamyka (najnizszy
    # pierscien `tulow`). Nowa liczba nie rusza modelu - opisuje to, co juz
    # bylo. Dzis steruje najnizszym pierscieniem tulowia i czapka pod nim.
    "krocze": 0.435,
    "biodro": 0.478,           # staw biodrowy - SKROCONE z ~47% (V3.5)
    "talia": 0.583,
    "klatka": 0.678,
    "bark": 0.750,             # staw barkowy
    "obojczyk": 0.767,         # gora tulowia
    "czaszka": 0.808,          # podstawa czaszki (gora szyi)

    # --- szerokosci (POLOWA, bo mesh jest polowkowy + Mirror) ---
    # ⚠ To jest druga polowa odrzucenia: "kobieco waskie barki". Staw barkowy
    # poszedl 0,085 -> 0,120, a naramiennik zgrubial 0,034 -> 0,055, wiec obrys
    # barkow urosl z 0,25 do ~0,35 wzrostu. Talia zostaje szczupla - chodzi
    # o KLIN barki-talia, a nie o wiecej masy wszedzie.
    # V3.3g: 0,130 -> 0,138 - szersze USTAWIENIE obreczy barkowej (pozycja
    # stawu), nie objetosc naramiennika (ta zostaje z V3.3f/V3.3d). Torsowe
    # pierscienie barku (0,702/0,738/0,752 w `tulow`) dostaly odpowiadajacy,
    # maly wzrost szerokosci, zeby nie zostawic "stopnia" miedzy szerszym
    # barkiem a wezszym torsem.
    # V3.5: zmiana CELU - nie realizm, tylko czytelnosc na telefonie. Autor
    # porownal gracza z Kowalem (pixel-art NPC, ~1,1x wzrostu gracza) i uznal
    # naszego "anorektykiem" - dlonie/przedramiona/barki nie ukladaja sie w
    # czytelna, "miesista" sylwetke, ktora ma byc BAZA pod przyszle warianty
    # (inni NPC). Jawna zgoda: "wysokosc klatki starej mozesz ..." (60px
    # Character.png juz nie wiaze), poszerzenie i dodatkowe px WYSOKOSCI
    # (patrz PLAYER.scale w GameConfig.ts) - dozwolone. Ten krok: +7% na
    # rozstawie i obrysie barku, z odpowiadajacym male poszerzeniem tych
    # samych trzech pierscieni torsu co w V3.3g (ta sama technika).
    # ⚠ 0,148 → 0,155 (2026-10-03, wariant B po pomiarze: szerokość/wzrost
    # 0,42 wobec 0,47–0,55 u NPC-ów).
    "bark_polrozstaw": 0.163,     # STAW barkowy - stad wychodzi kosc ramienia
    # ⚠ OPISOWE, na razie nic nie steruje. Obrys naramiennika powstaje dzis
    # z `bark_polrozstaw` + `ramie_promien` (pierscienie `ramie` w `_cialo`),
    # a nie z tej liczby. Zmierzone: obrys siega u(0,204), nie u(0,195).
    # ⛔ Nie "podpinaj" tego przy okazji - zrobienie z niego sterownika znaczy
    # wyprowadzenie promienia naramiennika z roznicy dwoch parametrow, czyli
    # ZMIANE PROJEKTU tabeli `ramie`, a nie przepiecie literalu.
    "bark_polszerokosc": 0.195,   # obrys naramiennika - OPISOWE, patrz wyzej

    # --- A4 (2026-09-20): OSIE TYPU CIALA ---------------------------------
    # ⭐⭐ To sa pokretla, ktorymi robi sie WARIANT postaci (inna waga,
    # muskulatura, sylwetka zenska) bez dotykania tabel pierscieni.
    # ⚠⚠ Do 2026-09-20 KAZDA z tych liczb byla MARTWA: tabele `tulow` i `noga`
    # w `_cialo()` mialy wartosci wpisane wprost, wiec zmiana ktorejkolwiek
    # z nich NIE ROBILA NIC. Objaw byl podstepny: "poszerzam klatke i nic sie
    # nie dzieje". A4 podpiecha je jako KOTWICE grup pierscieni.
    # ⚠ WARTOSCI ZOSTALY PRZELICZONE na faktyczne wymiary modelu (pierscien
    # kotwiczacy ma dzis mnoznik 1,000), wiec liczby ponizej ROZNIA sie od
    # poprzednich - ale model jest bit w bit ten sam. Stare liczby opisywaly
    # stan sprzed kilkunastu rund rzezbienia i po prostu klamaly.
    # ⚠ Kazdy pierscien w tabeli jest UlAMKIEM swojej kotwicy, wiec zmiana
    # kotwicy skaluje CALA GRUPE zachowujac wyrzezbiony ksztalt. Tak ma byc:
    # "szersza klatka" ma znaczyc szersza klatka razem z przejsciami, a nie
    # jeden pierscien wystajacy z sylwetki.
    "klatka_polszer": 0.158,      # kotwica: pierscien z(0,655) — 0,133 → 0,145 (B, 2026-10-03)
    "klatka_glebokosc": 0.080,
    "talia_polszer": 0.100,       # kotwica: pierscien z(0,560) — 0,099 → 0,106 (B, 2026-10-03)
    "talia_glebokosc": 0.065,
    # ⚠ 0,081 → 0,112 (2026-10-03): biodro obejmuje udo — patrz `_cialo` (tulow).
    "biodro_polszer": 0.110,      # kotwica: pierscien z(0,470)
    "biodro_glebokosc": 0.065,
    "szyja_promien": 0.053,       # kotwica: pierscien z(0,822); steruje calym zwezeniem bark->szyja

    # --- konczyna gorna ---
    # Rozpietosc ramion nadal == wzrost; przy szerszym barku znaczy to krotsza
    # kosc ramienia, co jest zgodne z krepa sylwetka. Dlon ladujaca w polowie
    # uda to najtanszy test poprawnosci.
    # V3.3n: dlugosc przedramienia zwiekszona KOSZTEM ramienia (suma i cala
    # rozpietosc ramion NIETKNIETE, bo obie sa liczone z tego samego `dl` -
    # patrz `_uklad`) - zglosozone wprost.
    # ⭐ `rozpietosc` (2026-10-10): rozpiętość ramion jako WIELOKROTNOŚĆ wzrostu.
    #   To JEDYNA dźwignia długości ręki — `ramie`/`przedramie`/`dlon` niżej są
    #   tylko PROPORCJAMI PODZIAŁU (normalizowane przez sumę), więc podniesienie
    #   ich wszystkich nie zmienia NIC. Przy kotwicy „rozpiętość = wzrost"
    #   szersze barki dają KRÓTSZĄ rękę: u mieszkańca w stylu `czytelny`
    #   palce kończyły się na 0,506 wzrostu — NAD kroczem, na biodrze (zmierzone).
    #   Baza (gracz) zostaje na 1,0: bramki broni i tarcz bit w bit bez zmian.
    # 1,10 (nie 1,17 jak mieszkańcy — styl `czytelny` dokłada +0,07): gracz NOSI
    # broń; przy 1,17 dłoń opadała o ~0,7 j. i czubki broni 1H wchodziły w grunt
    # (bramka broni: bastard 1H +0,66 pod stopami). Palce nadal na udzie (0,363).
    "rozpietosc": 1.10,
    "ramie": 0.1425,           # bark -> lokiec
    "przedramie": 0.1590,      # lokiec -> nadgarstek
    "dlon": 0.0845,            # nadgarstek -> czubek palcow
    # V3.5: promienie ramienia/lokcia/nadgarstka +11-12% jednym wspolnym
    # krokiem - caly ciag mnoznikow w tabeli `ramie` (0,90x .. 1,38x r_ram)
    # jest wzgledny wobec tych bazowych wartosci, wiec kontrast biceps/lokiec/
    # przedramie wypracowany w V3.3d-V3.3l zostaje TAKI SAM, tylko cala reka
    # grubsza. Zgloszone wprost po porownaniu z Kowalem - "przedramiona i
    # dlonie" mialy byc glownym adresatem tej rundy.
    "ramie_promien": 0.065,      # 0,058 → 0,0615 (B, 2026-10-03)
    "lokiec_promien": 0.046,
    # V3.3m: nadgarstek i dlon lekko pogrubione (zglosozone wprost - wieksza,
    # wyrazniejsza bryla dloni czyta sie jako dlon, nie jako palce).
    # V3.5: kolejny krok w te sama strone, wiekszy (+12-14%) - patrz komentarz
    # wyzej.
    "nadgarstek_promien": 0.033,
    "dlon_szerokosc": 0.118,
    "dlon_grubosc": 0.066,

    # ⚠⚠ WSTEPNE ZGIECIE LOKCIA (A1, 2026-09-20). Bez tego lancuch IK reki jest
    # w spoczynku IDEALNIE PROSTY - bark, lokiec, ogniwo i nadgarstek leza na
    # TYM SAMYM Y i Z - a wtedy solver LEGACY nie ma zadnej przeslanki, w ktora
    # strone zgiac staw, i NIE ZGINA GO WCALE.
    # Zmierzone na rigu sprzed tej zmiany: kat lokcia = 180,0 st. na KAZDEJ
    # klatce KAZDEGO klipu, niezaleznie od tego, gdzie postawi sie cel IK
    # (testowane do 60% zasiegu - dlon i tak ladowala na 100%). Reka byla
    # sztywnym patykiem obracanym w barku.
    # ⚠ NOGA tego problemu nigdy nie miala, bo ma wbudowane wstepne zgiecie:
    # biodro y=+0,15, kolano y=-0,05, kostka y=+0,25, czyli kolano wysuniete
    # 0,25 j. przy nodze 5,25 j. = 4,8%. Ta liczba daje lokciowi TE SAMA
    # proporcje: 0,012 x 12,80 = 0,154 j. przy ramieniu 3,40 j. = 4,5%.
    # ⚠ KIERUNEK: +Y to TYL (PRZOD = -1), wiec lokiec ucieka do tylu, a
    # przedramie moze isc do przodu - dokladnie jak u czlowieka.
    # ⚠ Osobliwosc peka juz przy 0,010; wieksze wartosci NIE daja wiekszego
    # zakresu zgiecia, za to mocniej obracaja dlon w pozie niesienia (0,012 ->
    # 4,0 st., 0,023 -> 8,0 st.), czyli mocniej przestrajaja `obrot`/`chwyt`
    # calego ekwipunku. Dlatego bierzemy NAJMNIEJSZA wartosc, ktora dziala
    # z zapasem, a nie najwieksza, ktora "na pewno" zadziala.
    "lokiec_wysun": 0.012,

    # --- konczyna dolna ---
    # A4: te cztery byly martwe tak samo jak wymiary tulowia - patrz komentarz
    # przy `klatka_polszer`. Wartosci przeliczone na faktyczne promienie
    # kotwic; model bez zmian.
    "udo_promien": 0.078,         # kotwica: SZCZYT UDA z(0,383), pod kroczem — 0,068 → 0,072 (B)
    # ⚠ Kolano 0,038 → 0,049, łydka 0,058 → 0,054 (2026-10-03): skok kolano →
    # łydka czytał się na gołej nodze jak CHOLEWA BUTA (dawniej krył ją kolor
    # `boots`; od bazy w bieliźnie widać ją wprost).
    "kolano_promien": 0.049,      # kotwica: KOLANO gora (0,043 → 0,049: przewężenie −30% czytało się jak brzeg buta)
    "lydka_promien": 0.058,       # kotwica: LYDKA gorna z(0,192)
    "kostka_promien": 0.029,      # kotwica: KOSTKA
    # V3.3g: 0,068 -> 0,075 - szerszy rozstaw nog, PRZY OKAZJI daje wiecej
    # przestrzeni miedzy udami pod miednica (embed w torsie ma zapas - patrz
    # docs/postac3d_checkpoint.md "V3.3g" pkt. Krok/Nogi).
    # V3.3i: 0,075 -> 0,082 - stabilniejsza, szersza PODSTAWA (rozstaw osi
    # nog), nie promien nogi - to inna dzwignia niz udo_promien/lydka_promien
    # powyzej, wiec nie koliduje z zakazem "nie zwiekszaj promienia".
    # V3.3t: 0,082 -> 0,088 - postawa jeszcze bardziej "osadzona", zglosozone
    # wprost w porownaniu z Mysliwym (referencyjny NPC).
    # V3.3u: COFNIETE z powrotem do 0,082 - szerszy rozstaw odsunal uda od
    # tulowia i rozjechal dopiero co dostrojony styk biodro/udo/krocze
    # (dopisek 9/10) - nogi zaczely czytac sie jako chudsze, a zwezenie
    # bioder i wciecie krocza "zniklo" (bo odleglosc do tulowia urosla, nie
    # dlatego, ze same promienie sie zmienily). Zglosozone wprost.
    "noga_polrozstaw": 0.082,
    "stopa_dlugosc": 0.176,    # V3.3g: 0,150 -> 0,160
    # V3.3i: 0,070 -> 0,088 - stopa z przodu byla wyraznie mniejsza niz u
    # referencji (WoW/Myśliwy), zgloszone wprost. Dlugosc (stopa_dlugosc)
    # NIETKNIETA - to jest tylko szerokosc, glowny wymiar czytelny z przodu.
    "stopa_szerokosc": 0.1,

    # --- glowa (ulamki WYSOKOSCI GLOWY, nie wzrostu) ---
    # ⚠ Czaszka ma byc WYZSZA niz szeroka, zeby nie wrocic do kuli pierwszej
    # wersji (tam W/H = 1,00 co do setnej). V3.3b: 0,72 -> 0,79 (W/H 0,80).
    # V3.3c: jeszcze jeden maly krok, 0,79 -> 0,84 (cel W/H ~0,83-0,85).
    # WYSOKOSC glowy NIETKNIETA obiema iteracjami - patrz
    # docs/postac3d_checkpoint.md "V3.3c".
    # ⭐⭐ SZYJA (2026-10-03, autor: „brak szyi, głowa zatopiona w karku —
    # goryl"). Głowa stała czubkiem na `WYSOKOSC`, więc przy `glow` 3,45 broda
    # wypadała na 0,710 wzrostu — PONIŻEJ góry tułowia (`obojczyk` 0,745):
    # szyi nie było wcale, a większa głowa (V3.6) wbiła się jeszcze głębiej.
    # Uniesienie (ułamek WZROSTU) podnosi głowę, jej kość i górę szyi; figura
    # rośnie o tyle samo, a silnik i tak dociąga ją do wysokości sprite'a, więc
    # na ekranie wychodzi to jako krótszy tułów pod tą samą głową.
    # ⚠ Ciało poniżej barków i cały rig ramion/nóg NIETKNIĘTE — broń, tarcze
    # i cele animacji siedzą tam, gdzie były.
    "glowa_uniesienie": 0.046,     # A/B 0 / 0,055 / 0,080 / 0,100 (render): 0,09 = szyja widoczna w skali gry, krępa
    "glowa_szerokosc": 0.84,
    "glowa_glebokosc": 0.88,
    "glowa_linia_wlosow": 0.655,
    "glowa_linia_oczu": 0.50,
    "glowa_linia_ust": 0.21,
    "glowa_nos": 0.33,
    "ucho_wysokosc": 0.50,     # srodek ucha na linii oczu, jak u ludzi
    # ⭐ CIAŁO KOBIECE (2026-10-09, pilot NPC: Mama) — wysunięcie piersi do
    # przodu, ułamek wzrostu. 0 = baza męska BEZ ZMIAN (gracz). Drugi typ ciała
    # to ten sam szkielet + kotwice siatki (`tools/npc3d.py` PRESETY) — kości
    # nie ruszamy, bo od nich zależą animacje i cały ekwipunek.
    "biust": 0.0,
    # ⭐ (2026-10-09, dopracowanie pilota NPC) — oba 0 = gracz bez zmian.
    # `kaptury`: spadek mięśni karku do barku (szersza podstawa szyi, niższy
    #   pierścień nad stawem) zamiast kanciastego „pudełka" barku.
    # `kciuk`: odstający kciuk na dłoni — dłoń przestaje być rękawicą.
    "kaptury": 0.35,
    "kciuk": 1.0,
}

# Postac patrzy w -Y (tak liczy strefe wlosow `char3d_zones`, tak tez wychodzi
# +Z po eksporcie `export_yup`). LEWA strona to +X: polowka mesha lezy na +X,
# a Mirror dorabia prawa.
PRZOD = -1.0

# Wysokosc calej figury w jednostkach swiata.
# ⚠ NIE jest dowolna: bron i tarcze maja rozmiary skalibrowane wzgledem ciala
# ~12,8-13,0 j. (README: "wysokosc ciala 12,96 j."). Trzymanie tej liczby
# sprawia, ze caly ekwipunek zostaje na swoim miejscu mimo przebudowy proporcji.
WYSOKOSC = 12.80
PODLOGA = -11.30

# Strefy koloru dokladane przez glowe. ⚠ Dopisywane na KONCU `char3d_zones.ZONES`,
# zeby nie przesunac indeksow istniejacych materialow.
ZONY_TWARZY = ("eyes", "mouth")


def _lerp(a, b, t):
    return a + (b - a) * t


def _profil(tabela, t):
    """Interpolacja liniowa po tabeli [(t, wartosc), ...] posortowanej po t."""
    if t <= tabela[0][0]:
        return tabela[0][1]
    if t >= tabela[-1][0]:
        return tabela[-1][1]
    for i in range(len(tabela) - 1):
        t0, v0 = tabela[i]
        t1, v1 = tabela[i + 1]
        if t0 <= t <= t1:
            return _lerp(v0, v1, (t - t0) / (t1 - t0))
    return tabela[-1][1]


class Budowniczy:
    """Zbiera wierzcholki i wielokaty w przestrzeni SWIATA razem z wagami kosci.

    Wagi przypisujemy PIERSCIENIOWI, nie wierzcholkowi z osobna: kazdy pierscien
    powstaje na znanym odcinku kosci, wiec wiadomo, do czego nalezy. To jest
    powod, dla ktorego nie uzywamy wag automatycznych (`ARMATURE_AUTO`) - heat
    weighting na przenikajacych sie rurach potrafi nie znalezc rozwiazania,
    a wtedy skinning wychodzi losowy i widac to dopiero w ruchu.
    """

    def __init__(self):
        self.verts = []
        self.faces = []
        self.wagi = []

    def ring(self, centrum, osie, promienie, n, polowka=False):
        """Pierscien wierzcholkow. `osie` = (wektor_a, wektor_b) w plaszczyznie.

        polowka=True: luk od +b przez +a do -b (czyli x>=0 dla tulowia),
        z koncami DOKLADNIE w plaszczyznie symetrii - Mirror je sklei.
        """
        a, b = osie
        ra, rb = promienie
        idx = []
        for i in range(n):
            kat = math.pi * i / (n - 1) if polowka else 2.0 * math.pi * i / n
            p = centrum + a * (ra * math.sin(kat)) + b * (rb * math.cos(kat))
            if polowka and i in (0, n - 1):
                p = Vector((0.0, p.y, p.z))      # dokladnie na osi symetrii
            idx.append(len(self.verts))
            self.verts.append(p)
            self.wagi.append({})
        return idx

    def waga(self, indeksy, wagi):
        for i in indeksy:
            for k, v in wagi.items():
                self.wagi[i][k] = self.wagi[i].get(k, 0.0) + v

    def most(self, r0, r1, zamknij=True):
        n = len(r0)
        zakres = range(n) if zamknij else range(n - 1)
        for i in zakres:
            j = (i + 1) % n
            self.faces.append((r0[i], r0[j], r1[j], r1[i]))

    def czapka(self, ring, centrum, odwroc=False):
        c = len(self.verts)
        self.verts.append(centrum)
        self.wagi.append(dict(self.wagi[ring[0]]))
        n = len(ring)
        for i in range(n):
            j = (i + 1) % n
            self.faces.append((ring[j], ring[i], c) if odwroc else (ring[i], ring[j], c))


def _rura(b, sciezka, n, polowka=False, osie=None):
    """Loft: sciezka = [(centrum, ra, rb, wagi)], pierscienie prostopadle do biegu."""
    ringi = []
    for k, (centrum, ra, rb, wagi) in enumerate(sciezka):
        if osie is not None:
            a, bax = osie
        else:
            if k == 0:
                kier = (sciezka[1][0] - centrum).normalized()
            elif k == len(sciezka) - 1:
                kier = (centrum - sciezka[k - 1][0]).normalized()
            else:
                kier = (sciezka[k + 1][0] - sciezka[k - 1][0]).normalized()
            pom = Vector((1, 0, 0)) if abs(kier.x) < 0.9 else Vector((0, 0, 1))
            a = kier.cross(pom).normalized()
            bax = a.cross(kier).normalized()
        r = b.ring(centrum, (a, bax), (ra, rb), n, polowka=polowka)
        b.waga(r, wagi)
        ringi.append(r)
    for i in range(len(ringi) - 1):
        b.most(ringi[i], ringi[i + 1], zamknij=not polowka)
    return ringi


# --- Szkielet --------------------------------------------------------------

def _uklad(P):
    """Poza spoczynkowa rigu w przestrzeni SWIATA: nazwa -> (glowa, ogon).

    ⚠ Nazwy sa NIENARUSZALNE (patrz naglowek modulu). Ta funkcja tylko
    przesuwa te same kosci tam, gdzie powinny byc u doroslego czlowieka.
    """
    H, Z0 = WYSOKOSC, PODLOGA
    def z(f):
        return Z0 + f * H
    def u(f):
        return f * H

    # --- konczyna gorna ---------------------------------------------------
    # Kotwica: ROZPIETOSC RAMION == WZROST. To najtanszy test "czy rece nie sa
    # za krotkie" i jedyny, ktory nie wymaga patrzenia na render.
    bark_x = u(P["bark_polrozstaw"])
    palec_x = H / 2.0 * P["rozpietosc"]    # czubek palcow -> rozpietosc = H × `rozpietosc`
    dl = palec_x - bark_x
    suma = P["ramie"] + P["przedramie"] + P["dlon"]
    ramie = dl * P["ramie"] / suma
    przedramie = dl * P["przedramie"] / suma

    z_bark = z(P["bark"])
    lokiec_x = bark_x + ramie
    LINK = 0.30                            # krotka kosc lokciowa (byla 0,414)
    nadgarstek_x = lokiec_x + przedramie
    # ⚠ 0,68 to dlugosc kosci dloni ZE STAREGO rigu i zostaje niezmieniona -
    # bron siada na jej OGONIE, wiec kazda inna liczba przenosi caly ekwipunek.
    DLON_KOSC = 0.68

    # --- konczyna dolna ---------------------------------------------------
    noga_x = u(P["noga_polrozstaw"])
    z_biodro = z(P["biodro"])
    z_kolano = z(P["kolano"])
    z_kostka = z(P["kostka"])
    kolano_gora = z_kolano + 0.25
    kolano_dol = z_kolano - 0.25

    Y_KREG = 0.15          # os kregoslupa lekko z tylu srodka tulowia
    # V3.3e: 0,10 -> 0,03. Staw barkowy (i caly lancuch ramienia, ktory w
    # T-pozie biegnie na STALEJ wysokosci Y_BARK) siedzial blizej linii
    # kregoslupa (0,15) niz srodka tulowia (0,0), co przy opuszczonej rece
    # czytalo sie jako cofniety bark / wypieta klatka / sciagniete lopatki.
    # Blizej 0 = bardziej neutralna, "spokojna" postawa - patrz
    # docs/postac3d_checkpoint.md "V3.3e" pkt. Bark.
    Y_BARK = 0.03
    # ⚠⚠ A1: staw lokciowy wysuniety DO TYLU wzgledem linii bark-nadgarstek.
    # To jedyna rzecz, ktora pozwala solverowi IK w ogole zgiac te reke -
    # pelne uzasadnienie i pomiary przy `lokiec_wysun` w PROPORCJE.
    # ⛔ Bark i NADGARSTEK zostaja na `Y_BARK`: nadgarstek niesie kosc dloni,
    # a na jej OGONIE siada cala bron i kazda tarcza. Przesuniecie go przenosi
    # caly ekwipunek w grze.
    y_lokiec = Y_BARK + u(P["lokiec_wysun"])
    y_ogniwo = Y_BARK + u(P["lokiec_wysun"]) * 0.8   # luk z powrotem, nie zalamanie
    Y_KOSTKA = 0.25

    L = {
        "Bone.005":        ((0.0, Y_KREG, Z0), (0.0, Y_KREG, Z0 + u(0.12))),
        "Bone":            ((0.0, Y_KREG, z_biodro), (0.0, Y_KREG, z(P["talia"]))),
        "Bone.001":        ((0.0, Y_KREG, z(P["talia"])), (0.0, Y_KREG, z(P["klatka"]))),
        "Bone.002":        ((0.0, Y_KREG, z(P["klatka"])), (0.0, Y_KREG, z(P["obojczyk"]))),
        "Bone.003":        ((0.0, Y_KREG, z(P["obojczyk"])), (0.0, 0.05, z(P["czaszka"] + P["glowa_uniesienie"]))),
        "Bone.004":        ((0.0, 0.05, z(P["czaszka"] + P["glowa_uniesienie"])),
                            (0.0, 0.0, z(0.995 + P["glowa_uniesienie"]))),
        # obojczyk: ze srodka tulowia w bok i lekko w dol, do stawu barkowego
        "Bone.002_L":      ((0.0, Y_BARK, z(P["obojczyk"])), (bark_x, Y_BARK, z_bark)),
        "Bone.002_L.001":  ((bark_x, Y_BARK, z_bark), (lokiec_x, y_lokiec, z_bark)),
        "Bone.002_L.004":  ((lokiec_x, y_lokiec, z_bark), (lokiec_x + LINK, y_ogniwo, z_bark)),
        "Bone.002_L.002":  ((lokiec_x + LINK, y_ogniwo, z_bark), (nadgarstek_x, Y_BARK, z_bark)),
        "Bone.002_L.003":  ((nadgarstek_x, Y_BARK, z_bark), (nadgarstek_x + DLON_KOSC, Y_BARK, z_bark)),
        # pomocnicza kosc piersiowa - istniala w starym rigu i siedzi w `TORS`
        # po stronie pancerza, wiec zostaje razem z nazwa.
        "Bone.002_L.006":  ((u(0.045), 0.60, z(P["klatka"])), (u(0.045), -0.20, z(P["klatka"]))),
        "Bone_L.001":      ((noga_x, Y_KREG, z_biodro), (noga_x, -0.05, kolano_gora)),
        "Bone_L.002":      ((noga_x, -0.05, kolano_gora), (noga_x, -0.02, kolano_dol)),
        "Bone_L.003":      ((noga_x, -0.02, kolano_dol), (noga_x * 0.92, Y_KOSTKA, z_kostka)),
        "Bone_L.004":      ((noga_x * 0.92, Y_KOSTKA, z_kostka),
                            (noga_x * 0.92, Y_KOSTKA - u(P["stopa_dlugosc"]) * 0.78, z_kostka - 0.22)),
    }

    # --- kontrolki IK ------------------------------------------------------
    # ⚠ Glowa kosci celu MUSI pokrywac sie z ogonem lancucha (nadgarstek /
    # kostka), inaczej sam spoczynek jest juz "ciagniety" i cala animacja
    # startuje z przesunietej pozy.
    # ⚠⚠ `None` zamiast ogona = ZACHOWAJ ORYGINALNY KIERUNEK I DLUGOSC kosci.
    # Pozycja kosci w pozie (`pose.bone.location`) jest wyrazona w LOKALNYCH
    # OSIACH SPOCZYNKU, wiec obrocenie kontrolki obraca cala wkluczowana
    # animacje. Zbudowanie `FootIK` ogonem w -Y zamiast +Y (czyli obrot o 180
    # stopni) wywrocilo w pierwszym podejsciu biodra i nogi, a `HandIK`
    # wyrzucilo reke pionowo w gore. Obie usterki byly widoczne WYLACZNIE na
    # renderze - raport proporcji byl caly czas zielony.
    L["HandIK_L.005"] = ((nadgarstek_x, Y_BARK, z_bark), None)
    L["Elbow_L.007"] = ((lokiec_x, Y_BARK + 2.70, z_bark), None)
    L["FootIK_L.006"] = ((noga_x * 0.92, Y_KOSTKA, z_kostka), None)
    L["PoleKnee_L.005"] = ((noga_x, -1.95, kolano_gora), None)
    L["Bone.005"] = ((0.0, Y_KREG, Z0), None)

    # --- lustro na prawa strone -------------------------------------------
    # Prawa strona rigu istnieje NAPRAWDE (Mirror dotyczy tylko mesha), wiec
    # kazda kosc `_L` ma blizniaka `_R` o odbitym X.
    for nazwa in [n for n in list(L) if "_L" in n]:
        h, t = L[nazwa]
        L[nazwa.replace("_L", "_R")] = (
            (-h[0], h[1], h[2]),
            None if t is None else (-t[0], t[1], t[2]),
        )
    return L


def _przebuduj_rig(arm, P, report=True):
    """Przesuwa poze spoczynkowa. Nazwy, hierarchia, roll i wiezy zostaja."""
    L = _uklad(P)
    inv = arm.matrix_world.inverted()

    poprzednie = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones}
    brakujace = [n for n in L if n not in arm.data.bones]
    nadmiarowe = [b.name for b in arm.data.bones if b.name not in L]
    if brakujace:
        raise RuntimeError(
            f"rig nie ma kosci {brakujace} - uklad w `_uklad()` rozjechal sie "
            f"z plikiem. NIE dopisuj kosci tutaj, dopoki nie sprawdzisz "
            f"char3d_zones.BONE_ZONE i char3d_armor.")

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.data.edit_bones

    role = {b.name: b.roll for b in eb}
    polaczone = {b.name: b.use_connect for b in eb}
    for b in eb:
        b.use_connect = False              # inaczej glowa "przykleja sie" do rodzica
    for nazwa, (h, t) in L.items():
        b = eb[nazwa]
        stary_kier = (b.tail - b.head)
        stara_dl = stary_kier.length
        b.head = inv @ Vector(h)
        if t is None:
            # kontrolka IK / korzen: przesuwamy TYLKO glowe, zeby lokalne osie
            # (a z nimi kazdy wkluczowany ruch) zostaly bit w bit te same.
            b.tail = b.head + stary_kier.normalized() * stara_dl
        else:
            b.tail = inv @ Vector(t)
        b.roll = role[nazwa]               # ⚠ lokalne osie = osie animacji
    for nazwa, stan in polaczone.items():
        eb[nazwa].use_connect = stan
    bpy.ops.object.mode_set(mode="OBJECT")

    if report:
        print(f"[rig] przestawiono {len(L)} kosci; {len(nadmiarowe)} nietknietych: {nadmiarowe}")
        for n in ("Bone.002_R.003", "Bone.002_L.003"):
            b = arm.data.bones[n]
            hw = arm.matrix_world @ b.head_local
            tw = arm.matrix_world @ b.tail_local
            stare = poprzednie[n]
            sh = arm.matrix_world @ stare[0]
            print(f"[rig] {n}: nadgarstek {sh.x:+.2f} -> {hw.x:+.2f} j. "
                  f"(dlugosc {(tw - hw).length:.3f} j.)")
    return L


# --- Cialo -----------------------------------------------------------------

OS_XY = (Vector((1, 0, 0)), Vector((0, 1, 0)))     # pierscien poziomy (tulow, nogi)
OS_YZ = (Vector((0, 1, 0)), Vector((0, 0, 1)))     # pierscien pionowy w poprzek X (ramie)
OS_XZ = (Vector((1, 0, 0)), Vector((0, 0, 1)))     # pierscien w poprzek Y (stopa)


def _czapka(b, ring, centrum, zamknij, odwroc=False):
    """Zamyka pierscien wachlarzem. `zamknij=False` dla polowek - inaczej
    powstaje zerowy wielokat przez plaszczyzne symetrii."""
    c = len(b.verts)
    b.verts.append(centrum)
    b.wagi.append(dict(b.wagi[ring[0]]))
    n = len(ring)
    zakres = range(n) if zamknij else range(n - 1)
    for i in zakres:
        j = (i + 1) % n
        b.faces.append((ring[j], ring[i], c) if odwroc else (ring[i], ring[j], c))


def _zszyj_krocze(b, tulow, udo, z_krocza):
    """Zszywa POŁÓWKOWY dolny pierścień tułowia z pełnym pierścieniem uda.

    Tułów (połówka, n): od środka PLECÓW (x=0, +Y) przez bok do środka
    BRZUCHA (x=0, −Y). Udo (pełny, 8): 0 tył, 2 zewnątrz, 4 przód, 6 środek.
    Zewnętrzny łuk uda 7→0→1→2→3→4→5 (od wewnętrznego tyłu do wewnętrznego
    przodu, w TĘ SAMĄ stronę co tułów) zszywamy „zamkiem” z tułowiem,
    a dziurę między wewnętrzną stroną uda a płaszczyzną symetrii domykają
    dwa czworokąty z wierzchołkiem KROCZA na x=0 — lustro zespoli go
    z drugą nogą. Nawinięcie jak w `Budowniczy.most` (r0 = niższy pierścień).
    """
    luk = [udo[i] for i in (7, 0, 1, 2, 3, 4, 5)]
    n_t, n_u = len(tulow), len(luk)
    i = j = 0
    while i < n_u - 1 or j < n_t - 1:
        # idziemy tym pierścieniem, który jest „w tyle" proporcjonalnie
        if j < n_t - 1 and (i >= n_u - 1 or (j + 1) / (n_t - 1) <= (i + 1) / (n_u - 1)):
            b.faces.append((luk[i], tulow[j + 1], tulow[j]))
            j += 1
        else:
            b.faces.append((luk[i], luk[i + 1], tulow[j]))
            i += 1
    yc = (b.verts[tulow[0]].y + b.verts[tulow[-1]].y) / 2.0
    c = len(b.verts)
    b.verts.append(Vector((0.0, yc, z_krocza)))
    b.wagi.append({"Bone": 1.0})
    b.faces.append((c, udo[6], udo[7], tulow[0]))
    b.faces.append((tulow[-1], udo[5], udo[6], c))


def _cialo(P, L):
    """Buduje POLOWKE ciala (x >= 0) w przestrzeni swiata. Mirror dorobi reszte."""
    H, Z0 = WYSOKOSC, PODLOGA

    def z(f):
        return Z0 + f * H

    def u(fr):
        return fr * H

    b = Budowniczy()
    N_TUL = 13      # polowka pierscienia tulowia
    N_KON = 8       # pelny pierscien konczyny

    # --- TULOW + SZYJA ----------------------------------------------------
    # Gorny pierscien tulowia jest WASKI (czworoboczny), a szerokosc barkow
    # robi dopiero naramiennik z rury ramienia. Odwrotnie - szeroki pierscien
    # tulowia + cienkie ramie - daje "wieszak na ubrania": plaska poteczka,
    # z ktorej rece wystaja jak patyki.
    # V3.1: biodro/talia lekko zwezone (mniej "klocka"), klatka pelniejsza,
    # a przejscie bark->szyja rozlozone na WIECEJ pierscieni (bylo 4 punkty
    # miedzy 0,738 a 0,822, jest 5), zeby zniknal gwaltowny "stopien" tuz pod
    # glowa - patrz docs/postac3d_checkpoint.md "V3.1" pkt. Szyja.
    # V3.2: TYLKO biodro (0,425-0,515) splaszczone - byl wyrazny "wybrzusz"
    # (0,104 -> 0,109 -> 0,099), ktory z klatka+talia V3.1 czytal sie jako
    # kobiecy flare. Zamieniony na plaskie plateau + lagodny spadek do talii,
    # BEZ poszerzania (wszystkie wartosci <= V3.1) - patrz
    # docs/postac3d_checkpoint.md "V3.2" pkt. Miednica. Klatka/talia/szyja
    # ponizej sa Z V3.1, NIETKNIETE.
    # V3.3a: dolozony pierscien 0,415 lagodzi zamkniecie miednicy (bylo:
    # pojedynczy ostry stozek z 0,425 prosto do wierzcholka 0,408) - razem z
    # glebszym osadzeniem szczytu uda (patrz sekcja NOGA) ma zlikwidowac
    # widoczna "szczeline" biodro-udo, ktora byla obecna nawet w T-pozie.
    # ZADNA szerokosc 0,425 w gore NIE zmieniona.
    # V3.3c: posladek dostaje wlasna objetosc - dotad kazdy pierscien tulowia
    # byl WYSRODKOWANY (przod = tyl), wiec "plecy" i "brzuch" na tej samej
    # wysokosci byly lustrzane. TULOW_Y_OFFSET przesuwa SRODEK pierscienia do
    # tylu (+Y = tyl, patrz PRZOD=-1) tylko w trzech pierscieniach biodra,
    # razem z lekko wieksza glebokoscia - efekt jest KIERUNKOWY: tyl rosnie
    # wyraznie, przod prawie wcale (patrz wyliczenie w komentarzu przy
    # TULOW_Y_OFFSET). Talia (0,560) i reszta ponizej/powyzej NIETKNIETE.
    # V3.3h: krocze/miednica - dotad tors "konczyl sie" ostro (wierzcholek na
    # 0,408) tuz nad udem, co czytalo sie jako plytkie, pionowo waskie ciecie
    # miedzy nogami. Punkt 0,415 przesuniety nizej (0,400) i lekko pelniejszy,
    # a wierzcholek zamykajacy (byl 0,408) - patrz ponizej. ZADNA SZEROKOSC
    # biodra (0,425/0,470/0,515) NIE zmieniona - to jest wydluzenie POKRYCIA
    # tulowia nad udem, nie przebudowa miednicy. Noga (sekcja NOGA) dostala
    # analogiczne przesuniecie gniazda w dol o ta sama wartosc, wiec udo
    # "chowa sie" pod tulowiem na wiekszym odcinku - stad optycznie krotsze
    # nogi i wyzsza/pelniejsza miednica, BEZ zmiany zadnej kosci (`_uklad`
    # nietkniety, zero ryzyka dla IK/chwytu broni) - patrz
    # docs/postac3d_checkpoint.md "V3.3h" pkt. Krocze/Nogi.
    # V3.3o: najszersza czesc biodra ZNIZONA - byla plateau na 0,425/0,470
    # (0,101/0,101), teraz szczyt siedzi nizej na 0,400 (0,078->0,098), a
    # 0,425/0,470 opadaja od niego zamiast trzymac plaskie maksimum - zglosozone
    # wprost jako "mniejsza wydatnosc na boki wyzej". Talia (0,560) i reszta
    # powyzej NIETKNIETE.
    # V3.3p: obwod biodra o kolejny maly krok w dol (0,098/0,096/0,092 ->
    # 0,093/0,091/0,088) - kontynuacja V3.3o, zglosozone wprost.
    # V3.4a: audyt zamkniety w dopisku 18/19 wrocil z KOREKTA miednicy - "za
    # wydatne biodra widziane od przodu". Sam pierscien tulowia byl juz
    # WEZSZY od szczytu uda (patrz komentarz nad `noga` nizej) - glowny winowajca
    # bylo SZCZYT UDA wystajace daleko na boki, a nie ten pierscien. Mimo to
    # miednica dostaje wlasny, maly krok w dol (-7 do -8%, JEDNOSTAJNIE na
    # wszystkich czterech pierscieniach - ksztalt/krzywa NIETKNIETA, tylko
    # skala), zeby "boczny obrys miednicy" mial swoj udzial w poprawie, nie
    # tylko udo. Glebokosc (d) NIETKNIETA - to os przod-tyl, nie "szerokosc
    # od przodu". Talia (0,560) i wszystko powyzej dalej NIETKNIETE.
    # A4 (2026-09-20): kolumny `w` i `d` sa teraz UlAMKAMI KOTWICY swojej grupy
    # (`biodro_*`, `talia_*`, `klatka_*`, `szyja_promien` w PROPORCJE), a nie
    # liczbami wpisanymi wprost. Mnoznik 1,000 wskazuje pierscien kotwiczacy.
    # ⚠ Ksztalt krzywej siedzi w MNOZNIKACH i jest dorobkiem kilkunastu rund
    # rzezbienia - zmieniajac WARIANT postaci rusza sie kotwice w PROPORCJE,
    # nie te liczby.
    bio_w, bio_d = P["biodro_polszer"], P["biodro_glebokosc"]
    tal_w, tal_d = P["talia_polszer"], P["talia_glebokosc"]
    kla_w, kla_d = P["klatka_polszer"], P["klatka_glebokosc"]
    szy = P["szyja_promien"]
    # ⭐⭐ BIODRO OBEJMUJE UDO (2026-10-03, „nogi wyglądają jak doklejone").
    # Do tej daty dolny pierścień tułowia miał połowę szerokości 0,086 wzrostu,
    # a szczyt uda sięgał 0,150: UDA były szersze od bioder i wystawały z nich
    # bokiem, a noga była OSOBNĄ rurą wsuniętą w miednicę (dwie przenikające
    # się bryły, twarde załamanie na styku). Wcześniejsze skargi „biodra za
    # wydatne" (V3.3o–V3.4a) dotyczyły w rzeczywistości szczytu uda.
    # Dziś dolny pierścień tułowia jest WYPROWADZONY z położenia i grubości
    # uda (`noga_polrozstaw` + `udo_promien`), a tułów i nogi to JEDNA siatka
    # zszyta w kroku (`_zszyj_krocze`).
    biodro_dol = P["noga_polrozstaw"] + P["udo_promien"] * 0.92
    tulow = [
        (P["krocze"], biodro_dol, bio_d * 1.050000, {"Bone": 1.0}),
        (0.425, biodro_dol * 0.950000, bio_d * 1.020000, {"Bone": 1.0}),
        (0.470, bio_w * 1.000000, bio_d * 1.000000, {"Bone": 1.0}),
        (0.515, (bio_w + tal_w) * 0.5, tal_d * 0.969231, {"Bone": 0.7, "Bone.001": 0.3}),
        # V3.3e: talia 0,092->0,099 (+7,6%), TYLKO ten jeden pierscien -
        # klatka (0,655/0,702) i biodro powyzej/ponizej NIETKNIETE. Kontrast
        # klatka/talia spada z 1,45x na 1,34x, co lagodzi za ostre przejscie
        # bez zmiany masy klatki i bez brzucha - patrz
        # docs/postac3d_checkpoint.md "V3.3e" pkt. Tors.
        (0.560, tal_w * 1.000000, tal_d * 1.000000, {"Bone.001": 1.0}),
        (0.610, kla_w * 0.842105, kla_d * 0.862500, {"Bone.001": 0.5, "Bone.002": 0.5}),
        (0.655, kla_w * 1.000000, kla_d * 1.000000, {"Bone.002": 0.8, "Bone.002_L.006": 0.2}),
        # V3.3g: 0,702/0,738/0,752 lekko poszerzone (+3,5 do 6%), zeby torsowy
        # "koniec barku" nadazal za szerszym stawem barkowym (bark_polrozstaw
        # 0,130->0,138) - inaczej szerszy naramiennik wystawalby poza wezszy
        # tors jako widoczny stopien. Klatka (0,655) NIETKNIETA.
        # V3.5: +6-7% szerokosci na tych trzech pierscieniach, ta sama
        # technika co V3.3g - dopasowanie do szerszego stawu barkowego
        # (bark_polrozstaw 0,138->0,148), zeby nie zostawic "stopnia" miedzy
        # szerszym barkiem a wezszym torsem. Glebokosc NIETKNIETA.
        (0.702, kla_w * 1.150376, kla_d * 1.050000, {"Bone.002": 0.85, "Bone.002_L.006": 0.15}),
        (0.738, kla_w * 1.112782 * (1 - 0.10 * P.get("kaptury", 0.0)), kla_d * 0.975000, {"Bone.002": 1.0}),
        (0.752, kla_w * 0.894737 * (1 + 0.06 * P.get("kaptury", 0.0)), kla_d * 0.850000, {"Bone.002": 1.0}),
        # Zwezenie bark -> szyja: JEDNA kotwica (`szyja_promien`) na cztery
        # pierscienie, zeby grubsza szyja niosla ze soba swoje przejscie.
        (0.768, szy * 1.591837 * (1 + 0.32 * P.get("kaptury", 0.0)), szy * 1.204082 * (1 + 0.10 * P.get("kaptury", 0.0)),
         {"Bone.002": 0.45, "Bone.003": 0.55}),
        (0.785, szy * 1.183673 * (1 + 0.14 * P.get("kaptury", 0.0)), szy * 1.061224, {"Bone.003": 1.0}),
        # ⭐ Szyja rośnie razem z `glowa_uniesienie`: przejście z karku (0,785)
        # zostaje, wyżej równa kolumna aż pod żuchwę.
        (0.802 + P["glowa_uniesienie"] * 0.45, szy * 1.020408, szy * 0.979592, {"Bone.003": 1.0}),
        (0.822 + P["glowa_uniesienie"], szy * 1.000000, szy * 0.959184, {"Bone.003": 1.0}),
    ]
    # V3.3c: przesuniecie w Y liczone tak, zeby PRZOD zostal ~nietkniety, a
    # TYL wyraznie urosl (offset = d_nowe - d_stare, wiec przod = offset - d
    # ~= -d_stare). Zmierzone na 0,470 (szczyt posladka): przod -0.742 j. ->
    # -0.717 j. (prawie bez zmian), tyl +0.742 j. -> +1.024 j. (+38%).
    # V3.4b: zgloszone wprost jako "za wypukle od tylu, jak pupa" (zaznaczone
    # czerwona linia na renderze od tylu, biegnaca po zewnetrznym obrysie
    # uda - wybrzuszenie, potem zakret do kolana zamiast plynnego zwezenia).
    # Pchniecie do tylu zmniejszone o ~40% na wszystkich trzech pierscieniach -
    # sam SPOSOB (tylko trzy pierscienie biodra, przod prawie bez zmian) z
    # V3.3c NIETKNIETY, zmniejszona tylko amplituda. Patrz tez SZCZYT UDA w
    # `noga` nizej - to DRUGA polowa tej samej poprawki.
    TULOW_Y_OFFSET = {0.425: 0.004, 0.470: 0.007, 0.515: 0.005}
    sciezka = [(Vector((0.0, u(TULOW_Y_OFFSET.get(f, 0.0)), z(f))), u(w), u(d), wg)
               for f, w, d, wg in tulow]
    ringi = _rura(b, sciezka, N_TUL, polowka=True, osie=OS_XY)
    # ⭐ Biust (`biust` > 0): przód pierścieni klatki wypchnięty do przodu,
    # garb gaussowski w połowie szerokości klatki. Waga pierścienia daje
    # łagodny start pod obojczykiem i zejście ku talii.
    if P.get("biust", 0.0) > 0.0:
        wagi_biustu = {5: 0.30, 6: 1.0, 7: 0.70, 8: 0.15}
        for k, wk in wagi_biustu.items():
            if k >= len(ringi):
                continue
            c, w_r, d_r, _wg = sciezka[k]
            for i in ringi[k]:
                p = b.verts[i]
                przod = max(0.0, -(p.y - c.y) / max(d_r, 1e-6))
                xn = abs(p.x) / max(w_r, 1e-6)
                garb = math.exp(-((xn - 0.48) / 0.30) ** 2) * przod ** 1.5
                b.verts[i] = Vector((p.x, p.y + PRZOD * u(P["biust"]) * wk * garb, p.z))
    # ⚠ Krocze NIE ma już czapki — dolny pierścień zszywa się z udem
    # (`_zszyj_krocze` niżej, po zbudowaniu nogi).
    tulow_dol = ringi[0]
    _czapka(b, ringi[-1], Vector((0.0, 0.0, z(0.832 + P["glowa_uniesienie"]))), zamknij=False)

    # --- RAMIE + DLON (T-poza, wzdluz +X) ---------------------------------
    bark_x = L["Bone.002_L.001"][0][0]
    lokiec_x = L["Bone.002_L.001"][1][0]
    nadg_x = L["Bone.002_L.002"][1][0]
    palec_x = H / 2.0 * P["rozpietosc"]     # ta sama kotwica co w `_uklad`
    zb = L["Bone.002_L.001"][0][2]
    yb = L["Bone.002_L.001"][0][1]
    link_x = L["Bone.002_L.004"][1][0]

    r_ram = u(P["ramie_promien"])
    r_lok = u(P["lokiec_promien"])
    r_nad = u(P["nadgarstek_promien"])
    KO, K1, K4 = "Bone.002_L", "Bone.002_L.001", "Bone.002_L.004"
    K2, K3 = "Bone.002_L.002", "Bone.002_L.003"
    # V3.1: bark->ramie lagodniej (wyzszy promien u nasady, mniej "wciecia"
    # zaraz przy tulowiu), dolozony osobny bicepsowy brzusiec zamiast liniowego
    # zwezenia do lokcia, a lokiec jest WYRAZNIE WEZSZY od sasiadow (czytelny
    # staw), zeby cale ramie przestalo byc jednolita rura - patrz
    # docs/postac3d_checkpoint.md "V3.1" pkt. Ramiona. Przedramie mialo dotad
    # najgrubszy punkt tuz PRZED nadgarstkiem (anatomicznie odwrotnie) -
    # przesuniety blizej lokcia (miesien zginacz), zwezenie do nadgarstka.
    # V3.2: mocniejszy kontrast miedzy segmentami (bylo za mало roznicy miedzy
    # bicepsem a lokciem, i miedzy lokciem a przedramieniem) - lokiec WEZSZY,
    # przedramie PELNIEJSZE tuz za lokciem, taper do nadgarstka lagodniejszy.
    # Rozstaw segmentow (bark/biceps/lokiec/przedramie/nadgarstek) z V3.1
    # zostaje - to jest tylko wzmocnienie kontrastu promieni.
    # V3.3a: dwie NIEZALEZNE korekty w tej samej liscie, obie topologiczne/
    # lokalne, zadna nie rusza masy calego ramienia (biceps/przedramie/
    # nadgarstek ponizej NIETKNIETE):
    # 1) gniazdo barku - V3.3a wypelnilo pache PODNOSZAC promien do 1,05-1,10x
    #    (wyzej niz sam naramiennik), co usunelo czarna szczeline, ale zrobilo
    #    z tego miejsca WLASNA, wyrazna bryle - dokladnie "kula doklejona do
    #    torsu", ktora V3.3b ma zdjac. V3.3b: promienie WROCILY do umiarkowanych
    #    (<=1,00x, mniejsze niz sam naramiennik), a integracje z torsem daje
    #    GLEBOKOSC osadzenia (bark_x-0,058/-0,022 -> -0,095/-0,050/-0,015,
    #    trzy punkty zamiast dwoch) - wiecej bryly SCHOWANEJ w torsie, a nie
    #    wiecej promienia NA ZEWNATRZ. Ciag jest teraz MONOTONICZNY (rosnie od
    #    gniazda do naramiennika), zadnego lokalnego wybrzuszenia po drodze -
    #    patrz docs/postac3d_checkpoint.md "V3.3b" pkt. Bark.
    # 2) dolozony jeden pierscien podporowy MIEDZY lokciem a "link" (byla to
    #    najciasniej upakowana para w calym ramieniu, 0,3-0,4 j. bez zadnego
    #    punktu posredniego) - Subsurf przy tak rzadkiej geometrii wgniata
    #    wazki lokiec w ciemny pierscien pod zgieciem. Punkt czysto
    #    podporowy: promien = srednia sasiadow, waga w 100% na kosci "link"
    #    (K4), bo geometrycznie lezy calkowicie w jej obrebie.
    # V3.3d: V3.3a-V3.3c naprawily deformacje i integracje z torsem, ale sama
    # SEKWENCJA PROMIENI dalej czytala sie jako segment+segment+segment -
    # naramiennik byl LOKALNYM SZCZYTEM (0,98->1,00->0,96, czyli "kulka"),
    # lokiec LOKALNYM DOLKIEM tuz obok LOKALNEGO SZCZYTU przedramienia
    # (0,86 -> 0,95 -> 1,05 - "kolanko" + "drugi walec"). Naprawa NIE rusza
    # skrajnych promieni (bark, nadgarstek), zmienia tylko KSZTALT KRZYWEJ
    # miedzy nimi na jeden lagodny, prawie monotoniczny spadek:
    # - naramiennik obnizony (1,00->0,97) i podchodzony trzema pierscieniami
    #   zamiast dwoch, wiec rosnie, nie "wyskakuje",
    # - miedzy bicepsem a lokciem dolozony pierscien (0,55 lerp), krok w dol
    #   jest teraz w czterech malych ratach, nie w dwoch duzych,
    # - PROMIEN LOKCIA PODNIESIONY (0,86->0,87) i PROMIEN "LINK" OBNIZONY
    #   (1,05->0,89) tak, zeby lokiec/podpora/poczatek przedramienia byly
    #   niemal ROWNE (0,87/0,89/0,89) - pierscien podporowy z V3.3a zostaje
    #   (potrzebny do deformacji), ale przestaje byc widoczny jako odrebny
    #   staw, bo nic wokol niego juz nie skacze,
    # - przedramie schodzi do nadgarstka w trzech krokach zamiast dwoch.
    # Efekt sprawdzany jako CIAG LICZB, nie tylko oko: 0,53/0,60/0,64/0,65 (bark)
    # / 0,63/0,58/0,52 (ramie) / 0,49/0,50/0,50 (lokiec+podpora+link) / 0,45/0,40/0,38 j.
    # (przedramie) - jeden szczyt (bark), potem STALY spadek co do kierunku.
    # V3.3f: BARK - z "jajka" (gladki, przyspieszajacy wzrost 0,80->0,97,
    # czyli +21% na czterech pierscieniach) na "wanne" (plaski, PRAWIE STALY
    # przekroj 0,90->0,97, czyli +8%). Naramiennik (ostatni pierscien, JEDYNY
    # naprawde widoczny na zewnatrz) zostaje na tej samej wartosci co V3.3d
    # (0,97/0,96) - to NIE jest wiekszy bark, to plytszy, szerszy luk PRZED
    # nim. Trzy pierwsze pierscienie siedza gleboko w torsie (embed z V3.3b),
    # wiec ich wzrost i tak jest w wiekszosci schowany - efekt jest w tym, ze
    # KRZYWA miedzy nimi przestaje przyspieszac.
    ramie = [
        (bark_x - u(0.095), r_ram * 0.90, r_ram * 0.91, {KO: 0.85, K1: 0.15}),   # gleboko w torsie
        (bark_x - u(0.050), r_ram * 0.93, r_ram * 0.93, {KO: 0.60, K1: 0.40}),   # plynne narastanie
        (bark_x - u(0.015), r_ram * 0.95, r_ram * 0.95, {KO: 0.35, K1: 0.65}),   # przejscie do naramiennika
        (bark_x + u(0.010), r_ram * 0.97, r_ram * 0.96, {KO: 0.15, K1: 0.85}),   # naramiennik - NIETKNIETY (V3.3d)
        # V3.3k: kontrast miesien/staw WYRAZNIE zwiekszony - zgloszone
        # rysunkiem odniesienia (czerwony obrys: biceps i przedramie WYRAZNIE
        # szersze niz sasiadujace stawy). Biceps podniesiony ponad naramiennik
        # (byl 0,87, plytszy niz bark), lokiec wyraznie wezszy (0,87 -> 0,68),
        # brzusiec przedramienia WYZSZY (1,17 -> 1,38) - patrz
        # docs/postac3d_checkpoint.md "V3.3k" pkt. Konczyny.
        (_lerp(bark_x, lokiec_x, 0.30), r_ram * 0.98, r_ram * 0.97, {K1: 1.0}),  # plynne zejscie z barku
        (_lerp(bark_x, lokiec_x, 0.55), r_ram * 1.02, r_ram * 1.00, {K1: 1.0}),  # biceps - wyrazny brzusiec
        (_lerp(bark_x, lokiec_x, 0.80), r_ram * 0.82, r_ram * 0.84, {K1: 1.0}),  # dojscie do lokcia
        # V3.3m: lokiec byl RAZEM najwezszy i najbardziej wysuniety na
        # zewnatrz (szczyt diamentu) - te dwie rzeczy w tym samym miejscu
        # wycinaly w sylwetce wneke na tyle glęboka, ze pod pewnym katem
        # (zrzut z gry) przeswiecalo przez nia tlo. Promien podniesiony z
        # powrotem (0,68/0,72 -> 0,78/0,82) - pozycja (diament) NIETKNIETA,
        # zamyka sie tylko sam mostek - patrz docs/postac3d_checkpoint.md "V3.3m".
        (lokiec_x, r_lok * 0.78, r_lok * 0.82, {K1: 0.5, K4: 0.5}),              # lokiec - waski, ale bez dziury
        (_lerp(lokiec_x, link_x, 0.5), r_lok * 0.83, r_lok * 0.85, {K4: 1.0}),   # podpora - narastanie
        (link_x, r_lok * 0.89, r_lok * 0.90, {K4: 0.5, K2: 0.5}),                # przedramie - bez skoku w gore
        # V3.3l: dodany pierscien posredni (0,55) - skok 1,38 -> 1,06 na
        # jednym kroku (V3.3k) czytal sie z boku jako oderwana "bryla" zamiast
        # miesnia. Trzy kroki zamiast dwoch lagodza sylwetke profilu, szczyt
        # (0,35) NIETKNIETY - patrz docs/postac3d_checkpoint.md "V3.3l".
        (_lerp(link_x, nadg_x, 0.35), r_nad * 1.38, r_nad * 1.34, {K2: 1.0}),
        (_lerp(link_x, nadg_x, 0.55), r_nad * 1.20, r_nad * 1.18, {K2: 1.0}),
        (_lerp(link_x, nadg_x, 0.78), r_nad * 1.04, r_nad * 1.06, {K2: 1.0}),
        (nadg_x, r_nad, r_nad * 1.02, {K2: 0.45, K3: 0.55}),
    ]
    # V3.3f: PRZEDRAMIE „do srodka" - czysto SIATKOWE przesuniecie pierscieni,
    # zero zmian w kosciach/wagach/animacji (obie kosci ramienia maja w
    # akcji "Walk" TOZSAMOSCIOWA rotacje na kazdej klatce - sprawdzone wprost
    # we fcurve - wiec ksztalt siatki przechodzi przez chod/idle NIETKNIETY).
    # V3.3g: rozszerzone na CALE ramie w ksztalt „)" - bark->lokiec dostaje
    # NIEWIELKIE wychylenie NA ZEWNATRZ (szczyt dokladnie przy lokciu), a
    # lokiec->nadgarstek zostaje TA SAMA pula do srodka co w V3.3f. Lokiec
    # (t=0 w obu galeziach) jest wiec NAJBARDZIEJ WYSUNIETYM punktem konczyny,
    # a jego promien (z V3.3d/f) pozostaje NIETKNIETY - luk wynika WYLACZNIE
    # z polozenia pierscieni, nie z ich wielkosci.
    naramiennik_x = bark_x + u(0.010)

    # V3.3j: luk WYRAZNIE pogleniony - poprzednia amplituda (0,014/0,006 do
    # lokcia, 0,022/0,018 od lokcia) dawala przesuniecie mniejsze niz promien
    # samego ramienia, wiec "diament" gubil sie w grubosci konczyny i czytal
    # sie jako prosta reka. Zgloszone wprost z rysunkiem odniesienia: lokiec
    # ma byc WYRAZNIE dalej od tulowia niz bark i nadgarstek, a nadgarstek ma
    # wracac blisko biodra - patrz docs/postac3d_checkpoint.md "V3.3j".
    # V3.3k: odcinek lokiec->nadgarstek WRACAL ZA MOCNO do srodka/do tylu
    # (dy -0,020 -> -0,044, dz +0,060 -> -0,010) - zglosozone wprost jako
    # "trzyma sie za tylek". Przedramie ma isc bardziej PROSTO W DOL, nie
    # zakrzywiac sie w strone posladka - dy i dz przy nadgarstku splaszczone
    # (dy do -0,010, dz do +0,020 - zostaje PRZED osia barku, nie za nia).
    # Lokiec (t=0 w drugiej galezi) NIETKNIETY - diament u gory zostaje.
    # V3.3l: `dy` (wypchniecie W PRZOD, widoczne wylacznie w profilu) zdjete
    # niemal do zera - przy powiekszonych promieniach przedramienia (V3.3k)
    # dawalo z boku wrazenie oderwanej "bryly" zamiast miesnia. Diament w
    # widoku frontowym (`dz`) i pozycja lokcia (`dx`) NIETKNIETE.
    # V3.3s: dopisek 12 dawal PRZEPROST w profilu - lokiec (dy -0,016) byl
    # NAJBARDZIEJ cofnietym punktem calej reki, a nadgarstek (dy +0,006) juz
    # do przodu, wiec ciag bark(0)->lokiec(-0,016)->nadgarstek(+0,006) byl
    # zygzakiem (do tylu, potem NAD punkt startowy do przodu) - staw wygladal,
    # jakby zginal sie w zla strone. Naprawa: lokiec bliski neutralnego (nie
    # najglebszy punkt), cale przejscie plynne w JEDNA strone (lekko do tylu,
    # potem stopniowo coraz mniej do tylu - NIGDY nie przekracza zera w strone
    # przodu). Diament (`dz`) zmniejszony (0,060 -> 0,046 przy lokciu) -
    # zglosozone wprost jako "lokcie za daleko od ciala" z przodu.
    # V3.3t: diament dalej zlagodzony (0,046 -> 0,036 przy lokciu) - w
    # porownaniu z Mysliwym (referencyjny NPC) reka gracza czytala sie jako
    # zbyt mocno rozstawiona wzgledem prostszego, bardziej naturalnego zwisu.
    # V3.3v: diament w mesh-u ZDJETY prawie do zera - odsuniecie reki od
    # tulowia przejmuje teraz PRAWDZIWE przesuniecie kontrolki IK
    # (`dodaj_rozchylenie_ramion`, dopisek 17), nie iluzja w siatce. Zostaje
    # tylko lekki, subtelny luk (rzedu 1/3 poprzedniej amplitudy) - czysto pod
    # czytelnosc miesnia, nie pod udawanie zgiecia.
    def _luk_ramienia(x):
        if x <= lokiec_x:
            t = max(0.0, min(1.0, (x - naramiennik_x) / (lokiec_x - naramiennik_x)))
            return (u(0.016) * t, -u(0.003) * t, u(0.016) * t)   # bark -> lokiec: na zewnatrz
        t = max(0.0, min(1.0, (x - lokiec_x) / (nadg_x - lokiec_x)))
        return (u(0.016) * (1 - t) + u(0.012) * t,
                -u(0.003) * (1 - t) - u(0.001) * t,
                u(0.016) * (1 - t) + u(0.010) * t)

    sciezka = []
    for x, ra, rb, wg in ramie:
        dx, dy, dz = _luk_ramienia(x)
        sciezka.append((Vector((x + dx, yb + dy, zb + dz)), ra, rb, wg))
    ringi = _rura(b, sciezka, N_KON, osie=OS_YZ)
    _czapka(b, ringi[0], Vector((bark_x - u(0.110), yb, zb)), zamknij=True, odwroc=True)

    # Dlon: splaszczona kostka, palce zaznaczone WYLACZNIE zwezeniem.
    # Przy 60 px postaci dlon ma ~3 px, wiec osobne palce to geometria,
    # ktorej kamera gry nie zobaczy nigdy. Liczy sie tylko, ze rekaw KONCZY
    # sie czyms szerszym niz przedramie - to jedyne, co czyta sie jako reka.
    dw = u(P["dlon_szerokosc"]) / 2.0
    dg = u(P["dlon_grubosc"]) / 2.0
    # ⚠⚠ DLON MUSI BYC WYRAZNIE SZERSZA OD NADGARSTKA, inaczej cale ramie
    # czyta sie jako STOZEK zakonczony czubkiem i postac wyglada, jakby nie
    # miala rak. W poprzednim podejsciu promien nadgarstka (0,435 j.) byl
    # WIEKSZY od polszerokosci dloni (0,346 j.) - czyli dlon byla fizycznie
    # wezsza od przedramienia i nie mialo prawa zadzialac. Widac to wylacznie
    # na renderze; zaden pomiar proporcji tego nie zglasza.
    dlon = [
        (nadg_x - u(0.004), r_nad * 0.96, r_nad * 1.02, {K3: 1.0}),
        (_lerp(nadg_x, palec_x, 0.26), dw * 0.96, dg * 1.06, {K3: 1.0}),
        (_lerp(nadg_x, palec_x, 0.74), dw, dg, {K3: 1.0}),
        (palec_x, dw * 0.66, dg * 0.78, {K3: 1.0}),
    ]
    # Dlon jedzie SZTYWNO z nadgarstkiem - ta sama (pelna, t=1) pula co koniec
    # przedramienia, zeby nie bylo szwu miedzy przedramieniem a dlonia.
    dx_d, dy_d, dz_d = _luk_ramienia(nadg_x)
    sciezka = [(Vector((x + dx_d, yb + dy_d, zb + dz_d)), ra, rb, wg) for x, ra, rb, wg in dlon]
    ringi = _rura(b, sciezka, N_KON, osie=OS_YZ)
    _czapka(b, ringi[-1], Vector((palec_x + u(0.006) + dx_d, yb + dy_d, zb + dz_d)), zamknij=True)

    # ⭐ KCIUK (`kciuk` > 0): krótka bryła od nasady dłoni, do PRZODU (−Y)
    #   i ku palcom. Przy ~5 px dłoni na ekranie to on robi „dłoń", a nie
    #   rękawicę — widać to na referencjach low-poly.
    if P.get("kciuk", 0.0) > 0.0:
        k = P["kciuk"]
        x0 = _lerp(nadg_x, palec_x, 0.18)
        x1 = _lerp(nadg_x, palec_x, 0.62)
        kc = [
            (Vector((x0 + dx_d, yb + dy_d + PRZOD * dg * 0.55, zb + dz_d - dw * 0.15)), dg * 0.55 * k, dg * 0.50 * k, {K3: 1.0}),
            (Vector((_lerp(x0, x1, 0.55) + dx_d, yb + dy_d + PRZOD * dg * 1.35, zb + dz_d - dw * 0.10)), dg * 0.45 * k, dg * 0.42 * k, {K3: 1.0}),
            (Vector((x1 + dx_d, yb + dy_d + PRZOD * dg * 1.75, zb + dz_d - dw * 0.05)), dg * 0.32 * k, dg * 0.30 * k, {K3: 1.0}),
        ]
        rk = _rura(b, kc, 6)
        _czapka(b, rk[0], kc[0][0] - Vector((u(0.004), 0, 0)), zamknij=True, odwroc=True)
        _czapka(b, rk[-1], kc[-1][0] + Vector((u(0.006), PRZOD * u(0.004), 0)), zamknij=True)

    # --- NOGA -------------------------------------------------------------
    noga_x = L["Bone_L.001"][0][0]
    z_biodro = L["Bone_L.001"][0][2]
    kol_g = L["Bone_L.001"][1][2]
    kol_d = L["Bone_L.002"][1][2]
    kostka = Vector(L["Bone_L.003"][1])
    U1, U2, U3, U4 = "Bone_L.001", "Bone_L.002", "Bone_L.003", "Bone_L.004"

    def xl(t):
        return _lerp(noga_x, kostka.x, t)

    # ⚠ Gorny pierscien uda jest WASKI i siedzi GLEBOKO w misce miednicy.
    # Pierwsza wersja zaczynala udo pelna szerokoscia POWYZEJ dolnego
    # pierscienia tulowia i domykala je czapka - a taka czapka, szersza od
    # miednicy na tej wysokosci, wychodzila bokiem jako plaska POLKA przez
    # cale biodro. W raporcie proporcji nie bylo po niej ani sladu.
    # V3.1: udo (szczegolnie gorna czesc) dostaje wiecej masy, lydka tylko
    # subtelnie - biodrowe "gniazdo" (pierwszy punkt) zostaje NIETKNIETE, bo to
    # ono trzyma miednice waska (patrz komentarz nad tabela) - patrz
    # docs/postac3d_checkpoint.md "V3.1" pkt. Uda/Lydki.
    # V3.2: V3.1 dobil do gornej granicy - GORNY przekroj uda (0,455/0,420)
    # lekko zmniejszony (-5%), reszta uda (xl(0.28) w dol) NIETKNIETA. Lydka:
    # troche wiecej masy blizej kolana (kol_d) + szczyt przesuniety blizej
    # kolana + lagodniejszy zwezenie do kostki - patrz
    # docs/postac3d_checkpoint.md "V3.2" pkt. Uda/Lydki.
    # V3.3: PRZEPROJEKTOWANY ROZKLAD MASY nogi (nie kalibracja anatomiczna -
    # celowo stylizowane pod czytelnosc w grze). Problem V3.2: udo trzymalo
    # pelna szerokosc zbyt dlugo (xl(0.28) byl prawie rowny szczytowi), a
    # szczyt lydki (0,071) byl niemal rowny szczytowi uda (0,072) - z daleka
    # dwa rowne walce zamiast jednego wyraznego stopnia UDO > LYDKA > KOSTKA.
    # Naprawa: szczyt uda nizszy (-12%), zwezenie zaczyna sie od razu za
    # szczytem (dwa nowe punkty), lydka WYRAZNIE mniejsza od uda (nie "drugi
    # baleron"), a kostka wyraznie smuklejsza od lydki (nie "patyczek") -
    # patrz docs/postac3d_checkpoint.md "V3.3".
    # V3.3a: dolozony jeden pierscien podporowy tuz nad kostka (xl(0.94)).
    # Odcinek xl(0.88)->kostka mial najbardziej stromy spadek promienia w
    # calej nodze (0,033 -> 0,028) bez zadnego punktu posredniego - pod
    # zgieciem kolana Subsurf wgniatal to w ciemna smuge tuz nad stopa.
    # Zaden promien szczytowy (udo/lydka/kostka) NIE zmieniony.
    # V3.3a: gniazdo biodrowe przesuniete WYZEJ (0,492 -> 0,508 j. wysokosci),
    # czyli glebiej w torsie - PROMIEN zostaje identyczny (0,034), zmienia sie
    # tylko polozenie. Cel: koniec uda ma siedziec dobrze wewnatrz szerszej
    # czesci miednicy (ringi 0,470/0,515 tulowia), a nie tuz przy jej waskim,
    # ostro zamknietym dnie - to tam widac bylo szczeline. Patrz tez nowy
    # pierscien 0,415 w tulowiu.
    # V3.3c: umiarkowany dodatek masy (+3,5 do +6%) TYLKO na szczycie uda i
    # gornej lydce - dolna polowa nogi (xl(0.76) w dol), kolano i kostka
    # NIETKNIETE, zeby nie cofnac dobrych przejsc z V3.3/V3.3a.
    # V3.3g: kolejny maly dodatek masy (+3 do +5%) na szczycie uda i gornej
    # lydce - biodrowe gniazdo, kolano i kostka znowu NIETKNIETE. Reszta
    # "obecnosci" nogi w tej iteracji ma wynikac z POZY (szerszy rozstaw,
    # ugiete kolano), nie z samych promieni - patrz komentarz przy pozie
    # ewaluacyjnej w dokumentacji.
    # V3.3h: gniazdo i pierwszy pierscien uda przesuniete jeszcze nizej
    # (0,508->0,493 i 0,460->0,446, PROMIENIE nietkniete) - razem z nizszym
    # zamknieciem tulowia (0,415->0,400, apex 0,408->0,393) wiecej uda chowa
    # sie POD tulowiem. Efekt: optycznie krotsza, pelniej "okryta" noga i
    # wyzsza miednica, bez zadnej zmiany kosci (`_uklad` nietkniety).
    # V3.3k: kontrast miesien/staw zwiekszony na CALEJ nodze, tak samo jak na
    # ramieniu - zgloszone tym samym rysunkiem odniesienia. Szczyt uda i
    # lydki podniesiony, kolano wyraznie zwezone (0,045/0,044 -> 0,038/0,037) -
    # patrz docs/postac3d_checkpoint.md "V3.3k" pkt. Konczyny.
    # V3.3o: gorna czesc uda WEZSZA w styku z biodrem (0,065/0,063 -> 0,058/
    # 0,056 - krancowa odleglosc udo/biodro) i cale udo pochylone bardziej DO
    # SRODKA (xl(0.22)->xl(0.32), xl(0.38)->xl(0.48) - te same wysokosci,
    # wieksze "t" ciagnie punkt blizej kostki, czyli bardziej do osi ciala) -
    # zglosozone wprost. SZCZYT UDA (masa/definicja miesnia) NIETKNIETY.
    # V3.3p: skok kolano->lydka (0,037x -> 0,068x na jednym kroku, V3.3k) czytal
    # sie jako "gumiak do kolan" - sztywna, cylindryczna cholewka zamiast
    # lydki. Naprawa metoda z V3.3d (arm "segment+segment+segment"): rozbity
    # na WIECEJ malych krokow zamiast jednego skoku, szczyt lydki obnizony i
    # przesuniety dalej od kolana (wiecej miejsca na narastanie) - sprawdzany
    # jako CIAG LICZB: 0,037/0,048/0,058/0,052/0,044/0,033/0,030/0,028 - jeden
    # szczyt, potem staly spadek. Gorna czesc uda jeszcze wezsza w styku z
    # biodrem (0,058->0,052) i mocniej pochylona do srodka (xl(0.32)->xl(0.38),
    # xl(0.48)->xl(0.55)) - zglosozone wprost, kontynuacja V3.3o.
    # V3.4a: korekta miednicy/ud PO zamknieciu geometrii (dopisek 18/19) -
    # zglosozone wprost jako "biodra za wydatne od przodu, pupa widoczna od
    # przodu". Diagnoza: SZCZYT UDA siedzi na noga_x=1,05 j. i wystawal
    # promieniem 0,078 (=1,00 j.) na boki, czyli siegal do X=2,05 j. od osi
    # ciala - NIEMAL DWA RAZY dalej niz sam pierscien tulowia na tej
    # wysokosci (0,088 = 1,13 j. przed ta poprawka). To SZCZYT UDA, nie
    # tulow, byl glownym zrodlem "wydatnosci" - stad glowna zmiana jest tu,
    # nie w miednicy (patrz `tulow` wyzej, tam tylko mala, jednostajna
    # poprawka). Promien SZCZYTU UDA obniony (0,078->0,068, X siega teraz do
    # ~1,92 j. - o 6% mniej), a szczyt przesuniety NIZEJ (z(0,427)->z(0,420)),
    # zeby najpelniejsza czesc uda byla bardziej "w dol", nie tuz pod stawem
    # biodrowym. Styk z biodrem (gorne udo) rowniez lekko wezszy (0,052->0,048)
    # dla gladszego przejscia tulow->miednica->udo. Kolano w dol (xl(0.50) i
    # nizej) NIETKNIETE.
    # V3.4b: V3.4a zwiekszyl GLEBOKOSC szczytu (0,075->0,080) i dolozyl mase
    # pierscieniowi ZARAZ ZA szczytem (0,065->0,068, prawie rowno ze
    # szczytem = "plateau"), zeby skompensowac wezszy front - ale to razem z
    # `TULOW_Y_OFFSET` (pchniecie posladka do tylu) zloszylo sie autorowi
    # jako "za wypukle od tylu, jak pupa" (zaznaczone czerwona linia na
    # renderze: wybrzuszenie, potem zakret do kolana zamiast plynnego
    # zwezenia). Naprawa: glebokosc szczytu COFNIETA w dol (0,080->0,074,
    # blisko oryginalnej 0,075 sprzed V3.4a - szerokosc 0,068 NIETKNIETA, to
    # dobry wynik z frontu), a "plateau" ZDJETE - pierscien zaraz za szczytem
    # jest teraz WYRAZNIE wezszy i plytszy od szczytu (nie prawie rowny), wiec
    # zwezenie zaczyna sie OD RAZU po szczycie, jednym plynnym spadkiem, a nie
    # po dwoch pierscieniach o tej samej masie.
    # V3.4c: zgloszone wprost ze zrzutu z gry (game_px) - miedzy nogawkami
    # widac tlo od okolicy kolana w dol, noga czyta sie jak sztywna rura
    # "doklejona" pod biodrem, nie jak organiczna czesc sylwetki. Autor
    # doprecyzowal: chodzilo o ~2 PIKSELE wystajace po bokach (poprawka
    # zarysu), nie o zlanie nog w jedna bryle. `noga_x` (KOSC, `noga_polrozstaw`)
    # ZOSTAJE NIETKNIETY - to ta sama dzwignia, ktora w V3.3t/V3.3u przy
    # poszerzeniu zepsula dopiero co dostrojony styk biodro/udo/krocze; drugi
    # raz tego ryzyka (stabilnosc chodu/IK) nie otwieramy. Zamiast tego:
    # CZYSTO KOSMETYCZNE wsuniecie siatki w strone X=0, tym samym trikiem co
    # `_luk_ramienia` dla reki - male przy samym biodrze, SZCZYT w okolicy
    # kolana/lydki, WRACA DOKLADNIE DO ZERA przy kostce (ciaglosc ze `stopa`,
    # ktora zaczyna sie wprost od `kostka.x`). Kolano/lydka RADII NIETKNIETE.
    # ⚠⚠ PIERWSZA PROBA (ten sam ksztalt krzywej) uzyla `u(0,02-0,10)` myslac
    # o tych liczbach jako o JEDNOSTKACH SWIATA - a `u()` mnozy przez WZROST
    # (12,8), wiec `u(0,10)` to 1,28 j., nie 0,10 j. Efekt: nogi ZLALY SIE W
    # JEDNA BRYLE (zgloszone wprost - "złamałeś mu nogi" / "złączyłeś nogi w
    # jedną"). Naprawiono POPRAWNA SKALA: cel ~2 px wystajace na boki, przy
    # skali ~0,10 j./px z zoomu 5x to ~0,1-0,15 j. NA SZCZYCIE (nie na noge -
    # na CALKOWITA redukcje szczeliny obu nog razem), wiec pojedyncza noga
    # dostaje offset o rzad wielkosci mniejszy niz w pierwszej probie.
    # A4 (2026-09-20): promienie sa teraz UlAMKAMI KOTWIC (`udo_promien`,
    # `kolano_promien`, `lydka_promien`, `kostka_promien`), tak samo jak
    # w tabeli `tulow` - patrz komentarz tam. Mnoznik 1,000 = pierscien
    # kotwiczacy. ⚠ Wysokosci (z) i wsuniecie w X zostaja literalami: to nie
    # sa osie typu ciala, tylko wyrzezbiony przebieg nogi.
    udo, kol = P["udo_promien"], P["kolano_promien"]
    lyd, kos = P["lydka_promien"], P["kostka_promien"]
    # ⭐ Noga zaczyna się POD kroczem (2026-10-03): trzy pierścienie, które
    # siedziały W miednicy (gniazdo 0,493, górne udo 0,446, szczyt 0,420),
    # i czapka gniazda usunięte — udo wychodzi z bioder jedną powierzchnią.
    # Szczyt uda przechodzi na pierwszy pierścień pod kroczem.
    noga = [
        # ⚠ Waga PÓŁ NA PÓŁ z miednicą: trójkąty zszycia mają wtedy dominującą
        # kość miednicy (prosta granica strefy bielizny, zamiast zygzaka
        # z naprzemiennych trójkątów) i staw biodrowy zgina się łagodniej.
        (Vector((xl(0.38) - u(0.007), 0.04, z(0.383))), u(udo * 1.000000), u(udo * 1.000000), {"Bone": 0.5, U1: 0.5}),  # SZCZYT UDA pod kroczem
        (Vector((xl(0.42) - u(0.008), 0.02, z(0.352))), u(udo * 0.980000), u(udo * 0.960000), {U1: 1.0}),  # udo pełne pod szortem
        (Vector((xl(0.45) - u(0.009), -0.01, z(0.322))), u(udo * 0.860000), u(udo * 0.830000), {U1: 1.0}),  # dojscie do kolana - wsuniete
        (Vector((xl(0.50) - u(0.010), -0.04, kol_g)), u(kol * 1.000000), u(kol * 1.026316), {U1: 0.55, U2: 0.45}),  # KOLANO gora - szczyt wsuniecia
        (Vector((xl(0.58) - u(0.010), -0.03, kol_d)), u(kol * 0.973684), u(kol * 1.000000), {U2: 0.5, U3: 0.5}),  # KOLANO dol - szczyt wsuniecia
        (Vector((xl(0.63) - u(0.009), 0.02, z(0.240))), u(lyd * 0.920000), u(lyd * 0.930000), {U3: 1.0}),  # narastanie do lydki - wsuniete
        (Vector((xl(0.68) - u(0.008), 0.06, z(0.192))), u(lyd * 1.000000), u(lyd * 1.017241), {U3: 1.0}),  # LYDKA gorna - wsuniete
        (Vector((xl(0.74) - u(0.006), 0.10, z(0.160))), u(lyd * 0.862069), u(lyd * 0.896552), {U3: 1.0}),  # lydka zwezanie - wsuniete
        (Vector((xl(0.80) - u(0.0045), 0.13, z(0.128))), u(lyd * 0.706897), u(lyd * 0.741379), {U3: 1.0}),  # lydka dalej - wsuniete
        (Vector((xl(0.88) - u(0.0025), 0.17, z(0.093))), u(kos * 1.178571), u(kos * 1.250000), {U3: 1.0}),  # taper - lekko wsuniete
        (Vector((xl(0.94) - u(0.001), 0.21, z(0.065))), u(kos * 1.071429), u(kos * 1.142857), {U3: 1.0}),  # pierscien podporowy - prawie bez zmian
        (Vector((kostka.x, kostka.y, kostka.z)), u(kos * 1.000000), u(kos * 1.071429), {U3: 0.55, U4: 0.45}),  # KOSTKA - BEZ przesuniecia, ciaglosc ze stopa
    ]
    ringi = _rura(b, noga, N_KON, osie=OS_XY)
    _zszyj_krocze(b, tulow_dol, ringi[0], z(P["krocze"] - 0.010))

    # --- STOPA (pierscienie w poprzek Y, spod zawsze na podlodze) ---------
    dl = u(P["stopa_dlugosc"])
    sz = u(P["stopa_szerokosc"]) / 2.0
    pieta_y = kostka.y + dl * 0.30
    palce_y = kostka.y - dl * 0.70
    # V3.5: grubosc (rz - dosl. polowa wysokosci ringu NAD podloga, patrz
    # `sciezka` nizej) podniesiona na pietcie/palcach - zglosozone wprost ze
    # zrzutu z boku: "stopy z boku sa jak kreski". Diagnoza: pierscien przy
    # kostce (0,46) jest juz solidny, ale chowa sie pod cholewka spodni/buta,
    # a WIDOCZNA z profilu czesc stopy (pieta z tylu, czubek z przodu) miala
    # NAJCIENSZE wartosci w calej tabeli (0,17/0,11) - stad plaska "kreska"
    # zamiast buta. Szerokosc (rx = `sz`-oparte) NIETKNIETA - to inna os
    # (przod-tyl w widoku z przodu/tylu), nie ta, ktora sprawia problem.
    stopa = [
        (pieta_y, sz * 0.78, 0.23, {U4: 1.0}),
        (kostka.y, sz * 0.94, 0.46, {U3: 0.35, U4: 0.65}),
        (_lerp(kostka.y, palce_y, 0.45), sz, 0.32, {U4: 1.0}),
        (_lerp(kostka.y, palce_y, 0.85), sz * 0.92, 0.21, {U4: 1.0}),
        (palce_y, sz * 0.66, 0.14, {U4: 1.0}),
    ]
    # V3.3l: stopa skrecona NA ZEWNATRZ (czubek dalej od osi ciala niz pieta),
    # zgloszone wprost - "stopy bardziej na zewnatrz niz do wewnatrz". Czysto
    # mesh: pieta zostaje na kostka.x, czubek dostaje odchylenie w X rosnace
    # od pieciy do czubka - stopa NIE jest dluzej rownolegla do osi Y.
    def _skret_stopy(y):
        t = max(0.0, min(1.0, (pieta_y - y) / (pieta_y - palce_y)))
        return u(0.028) * t
    sciezka = [(Vector((kostka.x + _skret_stopy(y), y, Z0 + rz)), rx, rz, wg)
               for y, rx, rz, wg in stopa]
    ringi = _rura(b, sciezka, N_KON, osie=OS_XZ)
    _czapka(b, ringi[0], Vector((kostka.x, pieta_y + 0.10, Z0 + 0.17)), zamknij=True, odwroc=True)
    _czapka(b, ringi[-1], Vector((kostka.x + _skret_stopy(palce_y - 0.06), palce_y - 0.06, Z0 + 0.11)),
            zamknij=True)
    return b


# --- Glowa -----------------------------------------------------------------
#
# Twarz robi KONTRAST, nie geometria. Przy 60 px postaci glowa ma ~9 px,
# wiec nos modelowany na 200 wielokatach jest niewidoczny, a dwa ciemne
# wielokaty w miejscu oczu widac. Geometria odpowiada tu wylacznie za
# SYLWETKE (szczeka, potylica, nos z profilu) i za cieniowanie.
ZONY_GLOWY = ("skin", "hair", "eyes", "mouth")

# (t, szerokosc, glebokosc, przesuniecie_Y) - t=0 broda, t=1 czubek czaszki.
#
# ⚠ Profil robi SZCZEKE, a szczeka robi "dorosly mezczyzna". Pierwsza wersja
# zwezala sie od oczu do brody gladkim stozkiem i dlatego dol twarzy czytal sie
# jak zaokraglony spiczasty podbrodek lalki. Teraz miedzy t=0,06 a t=0,30 jest
# prawie PIONOWA sciana (0,62 -> 0,80), czyli kanciasta zuchwa.
PROFIL_GLOWY = [
    # V3.1: szczeka/czolo/potylica - patrz docs/postac3d_checkpoint.md "V3.1".
    # Szerokosc (2. kolumna) TYLKO rosnie wzgledem V3 - front ma zostac ten sam.
    # Glebokosc (3. kolumna) jest w gornej polowie ZMNIEJSZONA (splaszczone
    # czolo zamiast kuli), a przesuniecie Y (4. kolumna) w okolicy t=0,80-0,91
    # jest DODATNIE (do tylu), co daje potylice zamiast symetrycznego stozka.
    (0.00, 0.46, 0.53, -0.07),
    (0.06, 0.66, 0.72, -0.06),
    (0.16, 0.75, 0.84, -0.04),
    (0.30, 0.83, 0.88, -0.02),
    (0.44, 0.93, 0.90, 0.01),
    (0.56, 0.99, 0.88, 0.03),
    (0.68, 1.00, 0.90, 0.04),
    (0.80, 0.95, 0.95, 0.05),
    (0.91, 0.75, 0.78, 0.03),
    (1.00, 0.34, 0.34, 0.00),
]


def _glowa(P):
    """Polowka glowy (x >= 0) w przestrzeni swiata + strefa na kazdy wielokat.

    ⚠ Czytelnosc twarzy w grze robia CZTERY rzeczy i zadna z nich nie jest
    mikrodetalem: wielkosc glowy, ksztalt czaszki (szczeka + potylica),
    KONTRAST plamek oczu i wlosy z wlasna objetoscia. Przy 60 px postaci glowa
    ma ~13 px, wiec nos modelowany na 200 wielokatach jest niewidoczny, a dwa
    ciemne wielokaty w miejscu oczu widac natychmiast.
    """
    H = WYSOKOSC
    wys = H / P["glow"]
    broda = PODLOGA + H * (1.0 + P["glowa_uniesienie"]) - wys
    pw = wys * P["glowa_szerokosc"] / 2.0
    pg = wys * P["glowa_glebokosc"] / 2.0

    N = 17          # wierzcholki na polpierscieniu
    M = 17          # rzedy od brody do czubka
    b = Budowniczy()
    ringi = []
    meta = []       # (t, kat) na wierzcholek - potrzebne do stref, nosa i uszu
    for j in range(M):
        t = j / (M - 1)
        fw = _profil([(a, x) for a, x, _, _ in PROFIL_GLOWY], t)
        fg = _profil([(a, y) for a, _, y, _ in PROFIL_GLOWY], t)
        fy = _profil([(a, y) for a, _, _, y in PROFIL_GLOWY], t)
        c = Vector((0.0, fy * pg, broda + t * wys))
        r = b.ring(c, OS_XY, (pw * fw, pg * fg), N, polowka=True)
        b.waga(r, {"Bone.004": 1.0})
        ringi.append(r)
        for i in range(N):
            meta.append((t, math.pi * i / (N - 1)))
    for i in range(len(ringi) - 1):
        b.most(ringi[i], ringi[i + 1], zamknij=False)
    _czapka(b, ringi[0], Vector((0.0, -0.06 * pg, broda - wys * 0.015)), zamknij=False, odwroc=True)
    meta.append((0.0, math.pi / 2))
    _czapka(b, ringi[-1], Vector((0.0, 0.0, broda + wys * 1.005)), zamknij=False)
    meta.append((1.0, math.pi / 2))

    linia = P["glowa_linia_wlosow"]
    t_oczu = P["glowa_linia_oczu"]
    t_ust = P["glowa_linia_ust"]

    # --- nos: wypchniecie kilku wierzcholkow do PRZODU (-Y) ---------------
    # V3.3a: glowa na tym etapie jest DAWCA BRYLY, nie nosnikiem twarzy -
    # amplituda nosa zmniejszona ~4x (0,095 -> 0,025), zeby zostal tylko
    # sladowy pagorek, nie rysowany element twarzy. Reszta profilu (szczeka,
    # czolo, potylica z V3.1) NIETKNIETA.
    t_nos = P["glowa_nos"]
    amp = wys * 0.025
    for i, (t, kat) in enumerate(meta):
        dt = abs(t - t_nos)
        dk = abs(kat - math.pi)                 # 0 = dokladnie przod
        if dt < 0.15 and dk < 0.40:
            k = math.cos(dt / 0.15 * math.pi / 2) * math.cos(dk / 0.40 * math.pi / 2)
            b.verts[i].y += PRZOD * amp * k * k

    # --- brew: daszek nad oczami, zeby oczodol zlapal cien ----------------
    for i, (t, kat) in enumerate(meta):
        dt = abs(t - (t_oczu + 0.08))
        dk = abs(kat - math.pi)
        if dt < 0.07 and dk < 1.05:
            b.verts[i].y += PRZOD * wys * 0.028 * math.cos(dt / 0.07 * math.pi / 2)

    # --- WLOSY MAJA OBJETOSC, nie sa malowane na czaszce ------------------
    # ⚠ Sama zmiana koloru nad linia wlosow czyta sie jak lysina w czapce.
    # Czupryna dostaje wiec wlasna grubosc: wierzcholki powyzej linii ida
    # promieniowo na zewnatrz, a sama linia tworzy wtedy widoczny prog.
    for i, (t, kat) in enumerate(meta):
        if t >= linia - 0.03:
            k = min(1.0, (t - (linia - 0.03)) / 0.14)
            p = b.verts[i]
            b.verts[i] = Vector((p.x * (1.0 + 0.10 * k), p.y * 1.0 + 0.0, p.z))
            b.verts[i].y = p.y * (1.0 + 0.06 * k)
            b.verts[i].z = p.z + wys * 0.012 * k

    # --- strefy koloru na wielokatach -------------------------------------
    strefy = []
    for f in b.faces:
        tt = sum(meta[v][0] for v in f) / len(f)
        kk = sum(meta[v][1] for v in f) / len(f)
        if tt >= linia or (kk <= 1.30 and tt >= 0.42):
            zona = "hair"                                  # czupryna + potylica
        elif abs(tt - t_oczu) < 0.085 and abs(kk - (math.pi - 0.58)) < 0.215:
            # ⚠ Plamka oka musi zostawic PRZERWE na nasade nosa, ale byc DUZA.
            # Przy 13 px glowy oko ponizej ~2 px przestaje istniec.
            zona = "eyes"
        elif abs(tt - t_ust) < 0.045 and abs(kk - math.pi) < 0.40:
            zona = "mouth"
        else:
            zona = "skin"
        strefy.append(ZONY_GLOWY.index(zona))

    # --- USZY (osobna bryla, dolaczana po strefach) ------------------------
    # Autor poprosil o uszy wprost. Z kamery gry to dwa piksele, ale to one
    # zdejmuja z glowy wrazenie "gladkie jajo" i ustawiaja jej SZEROKOSC.
    t_ucha = P["ucho_wysokosc"]
    z_ucha = broda + t_ucha * wys
    fw = _profil([(a, x) for a, x, _, _ in PROFIL_GLOWY], t_ucha)
    fy = _profil([(a, y) for a, _, _, y in PROFIL_GLOWY], t_ucha)
    x_ucha = pw * fw * 0.94
    ucho = [
        (x_ucha - wys * 0.015, wys * 0.050, wys * 0.080, {"Bone.004": 1.0}),
        (x_ucha + wys * 0.022, wys * 0.058, wys * 0.095, {"Bone.004": 1.0}),
        (x_ucha + wys * 0.042, wys * 0.040, wys * 0.065, {"Bone.004": 1.0}),
    ]
    sciezka = [(Vector((x, fy * pg + wys * 0.045, z_ucha)), ra, rb, wg)
               for x, ra, rb, wg in ucho]
    przed = len(b.faces)
    r_ucha = _rura(b, sciezka, 7, osie=OS_YZ)
    _czapka(b, r_ucha[0], Vector((x_ucha - wys * 0.035, fy * pg + wys * 0.045, z_ucha)),
            zamknij=True, odwroc=True)
    _czapka(b, r_ucha[-1], Vector((x_ucha + wys * 0.056, fy * pg + wys * 0.045, z_ucha)),
            zamknij=True)
    strefy += [ZONY_GLOWY.index("skin")] * (len(b.faces) - przed)
    return b, strefy

# --- Wpiecie w plik --------------------------------------------------------

def _wgraj_mesh(ob, b, strefy=None):
    """Podmienia geometrie ISTNIEJACEGO obiektu, zostawiajac modyfikatory,
    rodzica i materialy. Wierzcholki przychodza w przestrzeni SWIATA."""
    inv = ob.matrix_world.inverted()
    me = ob.data
    bm = bmesh.new()
    dodane = [bm.verts.new(inv @ v) for v in b.verts]
    bm.verts.index_update()
    zrobione = []
    for f in b.faces:
        try:
            face = bm.faces.new([dodane[i] for i in f])
            zrobione.append(face)
        except ValueError:
            zrobione.append(None)          # wielokat zdublowany - pomijamy
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.update()
    for p in me.polygons:
        p.use_smooth = True

    # --- grupy wierzcholkow = nazwy kosci --------------------------------
    for g in list(ob.vertex_groups):
        ob.vertex_groups.remove(g)
    grupy = {}
    for i, w in enumerate(b.wagi):
        for nazwa, waga in w.items():
            if waga <= 0.0:
                continue
            g = grupy.get(nazwa)
            if g is None:
                g = grupy[nazwa] = ob.vertex_groups.new(name=nazwa)
            g.add([i], waga, "REPLACE")

    # ⚠⚠ PUSTE GRUPY DLA PRAWEJ STRONY - bez nich polowa ciala jest sterowana
    # LEWYMI koscmi. Modyfikator Mirror przerzuca wagi, zamieniajac `_L` na
    # `_R` W NAZWIE, ale trafia tylko do grupy, ktora JUZ ISTNIEJE na siatce.
    # Gdy jej nie ma, odbity wierzcholek zostaje przy grupie lewej i jedzie za
    # lewa reka. Objaw jest mylacy: kosci w pozie stoja idealnie (sprawdzone
    # pomiarem), a mimo to w renderze jedna reka wystrzeliwuje pionowo w gore.
    # Stary mesh mial 26 grup wlasnie dlatego - obie strony, mimo ze polowkowy.
    for nazwa in list(grupy):
        if "_L" in nazwa:
            lustro = nazwa.replace("_L", "_R")
            if lustro not in ob.vertex_groups:
                ob.vertex_groups.new(name=lustro)

    # --- strefy twarzy jako atrybut na wielokacie ------------------------
    if strefy is not None:
        if "zona" in me.attributes:
            me.attributes.remove(me.attributes["zona"])
        attr = me.attributes.new(name="zona", type="INT", domain="FACE")
        realne = [s for s, f in zip(strefy, zrobione) if f is not None]
        for i, v in enumerate(realne[: len(me.polygons)]):
            attr.data[i].value = v
    return len(me.vertices), len(me.polygons), sorted(grupy)


# ⭐ PROPORCJE W PIONIE (2026-10-09, referencje low-poly: „ich sylwetki są
# lepsze"). Wysokości pierścieni tułowia i nóg są w `_cialo` LITERAŁAMI
# (dorobek kilkunastu rund rzeźbienia), więc zmiana kotwic `krocze`/`talia`
# przesuwała KOŚCI, ale nie siatkę. Zamiast przepisywać każdy literał:
# siatka powstaje na dzisiejszych wysokościach, a potem jest PRZESUWANA
# w pionie odcinkami między parami kotwic (stara → nowa). Rig idzie wprost
# z nowych proporcji. Przy domyślnych kotwicach ta droga się NIE uruchamia —
# gracz zostaje bit w bit taki sam.
KOTWICE_PIONU = ("kostka", "kolano", "krocze", "biodro", "talia", "klatka", "bark", "obojczyk")
# ⭐⭐ BAZA V4.5 (2026-10-10): HYBRYDA. V4 (~5,8 głowy, proporcje z referencji)
# przegrała ze starą bazą w wielkości z TELEFONU: hełm mały, twarz znika pod
# nim przy kamerze 40°, sylwetka długa i wąska. Gry mobilne przesadzają głowę,
# barki i dłonie dla czytelności — stąd ~4,8 głowy, nogi i anatomia z V4.
# ⭐⭐ BAZA V4 (2026-10-10, decyzja autora: proporcje DOROSŁE dla wszystkich).
# Literały wysokości w `_cialo` są wyrzeźbione pod kotwice V3.7 — te kotwice
# są tu ZAMROŻONE jako źródło przesuwania siatki. `PROPORCJE` niosą dziś
# wartości V4 (~5,8 głowy, krok 0,465), więc baza ZAWSZE idzie drogą
# `_przesun_pion`. ⛔ Nie zmieniaj tych liczb: to opis literałów, nie postaci.
ZRODLO_PIONU = {"kostka": 0.042, "kolano": 0.221, "krocze": 0.400, "biodro": 0.450, "talia": 0.560, "klatka": 0.655, "bark": 0.725, "obojczyk": 0.745, "czaszka": 0.815, "glowa_uniesienie": 0.090}


def _pion_zmieniony(P):
    return any(abs(P[k] - ZRODLO_PIONU[k]) > 1e-9 for k in KOTWICE_PIONU + ("czaszka", "glowa_uniesienie"))


def _przesun_pion(b, P):
    """Odcinkowo-liniowe przemapowanie z (ułamek wzrostu): stare kotwice → nowe.
    Szyja (od obojczyka do czubka szyi) idzie za `czaszka` + `glowa_uniesienie`."""
    H, Z0 = WYSOKOSC, PODLOGA
    stare = [0.0] + [ZRODLO_PIONU[k] for k in KOTWICE_PIONU] + [ZRODLO_PIONU["czaszka"] + ZRODLO_PIONU["glowa_uniesienie"]]
    nowe = [0.0] + [P[k] for k in KOTWICE_PIONU] + [P["czaszka"] + P["glowa_uniesienie"]]

    def mapuj(f):
        if f >= stare[-1]:
            return f + (nowe[-1] - stare[-1])
        for i in range(len(stare) - 1):
            if stare[i] <= f <= stare[i + 1]:
                t = (f - stare[i]) / max(1e-9, stare[i + 1] - stare[i])
                return nowe[i] + (nowe[i + 1] - nowe[i]) * t
        return f
    for i, v in enumerate(b.verts):
        f = (v.z - Z0) / H
        b.verts[i] = Vector((v.x, v.y, Z0 + mapuj(f) * H))


def zbuduj(params=None, report=True):
    """Przebudowuje rig i geometrie w AKTUALNIE OTWARTYM char.blend.

    Nic nie zapisuje - zapis nalezy do `tools/build_char3d_base.py --zapisz`.
    """
    P = dict(PROPORCJE)
    if params:
        P.update(params)

    arm = bpy.data.objects["Armature"]
    cialo = bpy.data.objects["Cube.001"]
    glowa = bpy.data.objects["Cube"]

    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

    skala = tuple(round(v, 4) for v in arm.scale)
    L = _przebuduj_rig(arm, P, report=report)

    # Cialo: obiekt zostaje ten sam, wiec Mirror/Subsurf/Armature/Solidify,
    # rodzic i materialy przezywaja podmiane.
    if _pion_zmieniony(P):
        # siatka na dzisiejszych wysokościach (promienie z P), potem przesunięta
        P_siatki = dict(P)
        for k in KOTWICE_PIONU + ("czaszka", "glowa_uniesienie"):
            P_siatki[k] = ZRODLO_PIONU[k]
        b = _cialo(P_siatki, _uklad(P_siatki))
        _przesun_pion(b, P)
    else:
        b = _cialo(P, L)
    nv, nf, grupy = _wgraj_mesh(cialo, b)

    # Glowa wisi na KOSCI, a jej macierz swiata zalezy od POZY. Zeby zbudowac
    # geometrie w spoczynku, przelaczamy armature na REST - inaczej model
    # powstalby w pozie z biezacej klatki i "odskoczyl" po przewinieciu.
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    glowa.parent = arm
    glowa.parent_type = "BONE"
    glowa.parent_bone = "Bone.004"
    glowa.matrix_parent_inverse = Matrix.Identity(4)
    glowa.location = (0.0, 0.0, 0.0)
    glowa.rotation_euler = (0.0, 0.0, 0.0)
    glowa.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()
    gb, strefy = _glowa(P)
    gv, gf, _ = _wgraj_mesh(glowa, gb, strefy=strefy)
    arm.data.pose_position = tryb
    bpy.context.view_layer.update()

    # Subsurf 2 na gestszej siatce to ~4x wiecej wierzcholkow bez zysku
    # widocznego na 60 px. Schodzimy do 1 i to jest decyzja o KOSZCIE renderu
    # w locie, nie o jakosci w Blenderze.
    for o in (cialo, glowa):
        for md in o.modifiers:
            if md.type == "SUBSURF":
                md.levels = 1
                md.render_levels = 1

    if report:
        wys = WYSOKOSC
        hw = wys / P["glow"]
        print(f"[baza] cialo: {nv} wierzcholkow, {nf} wielokatow, {len(grupy)} grup")
        print(f"[baza] glowa: {gv} wierzcholkow, {gf} wielokatow")
        print(f"[baza] skala obiektu Armature: {skala} (NIETKNIETA)")
        print(f"[baza] wzrost {wys:.2f} j. = {P['wzrost_m']:.2f} m "
              f"-> 1 m = {wys / P['wzrost_m']:.3f} j.")
        print(f"[baza] glowa {hw:.2f} j. = {P['glow']:.2f} glow w sylwetce")
        # Kosc glowy dostaje wagi na OBIEKCIE GLOWY, nie na ciele - liczymy
        # obie listy razem, inaczej raport krzyczy na poprawny stan (a raport,
        # ktory krzyczy na poprawny stan, uczy czytac sie po lebkach).
        wszystkie = set(grupy) | {g.name for g in glowa.vertex_groups}
        brak = [n for n in BONE_ZONE_WYMAGANE if n not in wszystkie]
        if brak:
            print(f"[UWAGA] kosci bez ani jednego wierzcholka: {brak}")
    return P


# Kosci, ktore MUSZA dostac wagi - inaczej strefa koloru albo element pancerza
# wychodzi pusty. Lista jest tu, a nie w char3d_zones, bo to generator ciala
# decyduje, co dostaje wierzcholki.
BONE_ZONE_WYMAGANE = (
    "Bone", "Bone.001", "Bone.002", "Bone.003", "Bone.004",
    "Bone.002_L", "Bone.002_L.001", "Bone.002_L.002", "Bone.002_L.003",
    "Bone_L.001", "Bone_L.003", "Bone_L.004",
)


def zmierz(report=True):
    """Audyt proporcji na ZEWALUOWANEJ geometrii (po Mirror i Subsurf).

    Liczby, nie wrazenia - to jest ta sama miara, ktora wykazala 3,29 glowy
    w modelu sprzed przebudowy, wiec porownanie stary/nowy jest uczciwe.
    """
    dg = bpy.context.evaluated_depsgraph_get()
    wynik = {}
    for nazwa in ("Cube.001", "Cube"):
        o = bpy.data.objects[nazwa]
        stan = [(m, m.show_viewport) for m in o.modifiers]
        for m in o.modifiers:
            if m.type == "SOLIDIFY":
                m.show_viewport = False
        dg = bpy.context.evaluated_depsgraph_get()
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        pts = [o.matrix_world @ v.co for v in me.vertices]
        oe.to_mesh_clear()
        for m, s in stan:
            m.show_viewport = s
        xs = [p.x for p in pts]
        ys = [p.y for p in pts]
        zs = [p.z for p in pts]
        wynik[nazwa] = (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs), len(pts))

    hx0, hx1, hy0, hy1, hz0, hz1, hn = wynik["Cube"]
    bx0, bx1, by0, by1, bz0, bz1, bn = wynik["Cube.001"]
    gora = max(hz1, bz1)
    dol = min(hz0, bz0)
    H = gora - dol
    gw = hz1 - hz0
    out = {
        "wzrost_j": H,
        "glow": H / gw,
        "glowa_wys": gw,
        "glowa_szer": hx1 - hx0,
        "glowa_gleb": hy1 - hy0,
        "glowa_W_do_H": (hx1 - hx0) / gw,
        "glowa_do_barkow": (hx1 - hx0) / (bx1 - bx0),
        "ciało_szer": bx1 - bx0,
        "wierzcholki": hn + bn,
    }
    if report:
        print(f"[audyt] wzrost {H:.3f} j.  glow w sylwetce: {out['glow']:.2f}")
        print(f"[audyt] glowa {out['glowa_szer']:.2f} x {out['glowa_gleb']:.2f} x {gw:.2f} j.  "
              f"W/H={out['glowa_W_do_H']:.2f}")
        print(f"[audyt] glowa/rozpietosc ciala: {out['glowa_do_barkow'] * 100:.0f}%  "
              f"wierzcholki: {out['wierzcholki']}")
    return out

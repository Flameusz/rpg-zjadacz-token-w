---
typ: HISTORIA
domena: assets
tytul: Geometria dachów L/T/U — analiza kompletności
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-19
---

# Geometria modularnych dachów L/T/U — analiza kompletności

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/assets.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status: analiza, nie implementacja.** Zgodnie z briefem — brak nowej
> grafiki, brak zmian w kodzie, brak nowych kafli. Cel: ustalić, gdzie
> topologia footprintów Rectangle/L/T/U jest dziś pokryta przez
> `tools/build_budynki.py` + referencje w `public/assets/tem/`, a gdzie nie —
> i **udowodnić to na geometrii, nie na liczbie sprite'ów**.
>
> Grunt pod każde twierdzenie poniżej: przeczytany kod (`_dach_plaski`,
> `_dach_szczytowy`, `zloz_zlozony`, `kafel_dolina`, `_sciany`, `zamek`),
> zmierzone referencje (`thatched-roof.png`, `roofs.png`) i trzy obrazy
> dostarczone przez autora — architektoniczny rzut T z góry, fotorealistyczny
> render 3D dachu T z góry, i gotowy tileset dachu L z góry z realnym
> valleyem. Te trzy ostatnie są tu **rozstrzygające** — to pierwsze referencje
> w tej sesji pokazujące topologię z lotu ptaka, a nie z przodu.
>
> **Siostrzany dokument: `docs/proporcje_domow.md`** — ten plik odpowiada na
> „jakich KLAS kafli brakuje" (połacie, narożniki, valleye); tamten na „ile
> kratek wysokości ma parter/piętro/poddasze" — w tym wysokość postaci jako
> punkt odniesienia, koncepcja „pseudostrychu" (dach głębszy niż minimum =
> płaski sufit w środku, nie tylko skos) i historia błędnego założenia
> o wspólnym fundamencie dwóch brył, którą warto przeczytać przed kolejną
> próbą złożenia L/T/U.

---

## 1. Cel (potwierdzenie)

Minimalny zestaw klas geometrii 32×32, z których da się złożyć dach nad
footprintem Rectangle / L / T / U (z rotacją), zanim zajmiemy się stylem.
Proces: `FOOTPRINT → TOPOLOGIA DACHU → POŁACIE/KALENICE/NAROŻNIKI/VALLEYS →
MODULARNE TILE'E`.

## 2. Footprinty — przyjęte bez reinterpretacji

```
L                    T                         U
OOOOOO               OOOOOOOOOO                OOOOOOOOOOO
OOOOOO               OOOOOOOOOO                OOOOOOOOOOO
OOO                     OOO                     OOO     OOO
OOO                     OOO                     OOO     OOO
```

## 3. Orientacja — jedno zastrzeżenie techniczne

Zgoda co do zasady: rotacja nie zmienia topologii, jeden zestaw klas ma
obsłużyć wszystkie orientacje. **Ale w naszym pipeline'ie rotacja NIE jest
darmowa**, i to trzeba nazwać teraz, nie po fakcie:

- Kafle w tym projekcie mają **wpieczony kierunek światła i fazę fali kursów
  strzechy liczoną z pozycji globalnej** (`docs/ART_DIRECTION.md`,
  `_dach_szczytowy`'s "thatch field liczony z GLOBALNEJ pozycji"). To nie są
  neutralne tekstury obracane w locie przez silnik — obrócenie sprite'a
  o 90° w Phaserze (`setAngle`) obróci też kierunek światła, który wtedy
  przestanie się zgadzać z resztą świata (wszystkie inne assety mają jeden,
  wspólny, zmierzony kierunek — `ART_DIRECTION.md` §1.3).
- Więc "jeden element po rotacji obsługuje kilka przypadków" jest prawdziwe
  na poziomie **projektowania geometrii kafla** (nie trzeba osobno myśleć
  o L-w-prawo i L-w-lewo), ale nieprawdziwe na poziomie **plików PNG** —
  każda orientacja, która naprawdę stoi na mapie, potrzebuje własnego
  renderu z poprawnym światłem, tak jak dziś `_dach_szczytowy` dla lewej
  i prawej połaci już generuje DWA osobne warianty (`polac_l`/`polac_p`),
  nie jeden obrócony. To nie zwiększa liczby KLAS, zwiększa liczbę
  wygenerowanych WARIANTÓW na klasę — do policzenia w kroku stylu, nie teraz.

## 4. Rozróżnienie — przyjęte

Oceniam nie „ile mamy kafli dachowych", tylko „czy da się złożyć kompletny
dach nad każdym footprintem". Dowód niżej idzie od footprintu do kafla, nie
odwrotnie.

## 5–7. Analiza: footprint → topologia → wymagana geometria

### 5.0 Co dziś istnieje w kodzie (fakty, nie oceny)

| funkcja | co robi | klasy które produkuje |
|---|---|---|
| `_dach_plaski(szer, głęb)` | płaski dach kalenicowy, BEZ żadnego domknięcia na krótkich bokach | `kalenica`/`polac`/`polac2`/`okap` × kolumna lewa/środek/prawa |
| `_dach_szczytowy(szer)` | dach `/\`, z prawdziwą ścianą szczytową | `szczyt`/`skos` (krawędź szczytu), `polac_l`/`polac_p` (połacie), `kalenica` (w tym warianty „zawiniętego końca" w kolumnie skrajnej), `okap`, `naroznik_okapu`/`naroznik_kalenicy` (nakładki, bo pas rysowany po przekątnej wylewa się poza własny kafel), `podokap` (cień okapu) |
| `_dach_przybudowki(szer, głęb)` | wariant `_dach_plaski` z jednym rzędem podmienionym na `przybud_styk` (styk ze ścianą zamiast własnej kalenicy) | jak `_dach_plaski` + `przybud_styk`. **Zdefiniowana, ale wywoływana przez ZERO wpisów `WZORY`/`BUDYNKI_NA_MAPIE`** — nieprzetestowana w złożeniu. |
| `zloz_zlozony(kafle, opis)` | „L/T/U" w NAZWIE — patrz 5.1 dlaczego to nie jest to samo pytanie | `kafel_dolina` (4 kafle: `szczyt`+`skos` × 2 strony) |
| `_sciany(szer, wys, ...)` | **jeden prostokątny pas ściany**, `for r in range(wys): for c in range(szer)` | `sciana`/`fundament`/`sciana_gora` (lub `deski_*`), narożnik przez indeks kolumny 0/2 (`zamek`) |

### 5.1 ⚠ Kluczowe zastrzeżenie: `zloz_zlozony` nie odpowiada na to pytanie

To jest najważniejsze ustalenie tej analizy i musi paść na samym początku,
bo inaczej reszta dokumentu byłaby zbudowana na złym fundamencie.

**`_sciany` nigdy nie rysuje niczego poza prostym prostokątem.** Nie ma w niej
pojęcia narożnika wklęsłego, narożnika wypukłego innego niż dwa skrajne końce
pasa, ani ściany skręcającej pod kątem. `zloz_zlozony` wywołuje `_sciany`
**raz, dla całej szerokości korpusu** — „skrzydło" nie dostaje własnych ścian
w nowym miejscu, tylko podnosi punkt startowy ściany W TYCH SAMYCH kolumnach
korpusu (`szczyt_od`). Innymi słowy: **footprint (rzut ścian na ziemię)
w `zloz_zlozony` ZAWSZE jest jednym prostokątem** — zmienia się wyłącznie
wysokość dachu nad częścią tego prostokąta, nigdy sam obrys budynku.

To jest fundamentalnie inne zadanie niż footprinty z sekcji 2, gdzie L/T/U
to naprawdę różne obrysy ścian (skrzydło fizycznie wystaje w bok, tworzy
nową podłogę). **Nazwa „L/T/U" w naszym kodzie odnosi się do SYLWETKI DACHU
nad jednym prostokątem, nie do TOPOLOGII RZUTU.** To nie jest błąd w kodzie —
to zrobiono świadomie i działa dobrze do tego, do czego było pomyślane
(zróżnicowanie sylwetki dachu chaty, patrz `chalupa_T` w podglądzie). Ale
odpowiada na inne pytanie niż to zadane w tym briefie.

**Konsekwencja: na dziś nie mamy ŻADNEJ geometrii ścian dla prawdziwego
footprintu L/T/U** — zanim w ogóle dojdzie do dachu, brakuje samego
narożnika ściany (wypukłego inaczej niż koniec pasa, i wklęsłego w ogóle).
To jest odrębny brak od brakującego valleya dachowego, i oba muszą zostać
rozwiązane, nie tylko drugi.

### 5.2 `kafel_dolina` — co faktycznie robi, sprawdzone w kodzie

Dokumentacja funkcji (`build_budynki.py:540`) mówi to wprost, i to jest
zgodne z tym, co złapałem na renderze wcześniej w tej sesji:

- Kafel dolina istnieje **tylko dla JEDNEGO rzędu na kolumnę** — górnej
  krawędzi pasa skrzydła (`_dach_szczytowy` daje „dokladnie JEDEN kafel na
  gornej krawedzi pasa"). Wszystko PONIŻEJ tej krawędzi — cała reszta
  ukośnej połaci skrzydła schodząca w dół do okapu — nie ma żadnego
  odpowiednika doliny. **To jest dokładnie ta dziura, którą złapałem na
  zbliżeniu w tej sesji**: klin trawy między dachem korpusu a wznoszącą się
  połacią skrzydła, bo poza tym jednym rzędem nic tej połaci z niczym
  nie łączy.
- Tło kafla jest **wpieczonym, konkretnym kaflem korpusu** (`kalenica`/1) —
  funkcja wprost rzuca wyjątkiem, jeśli komórka pod spodem to coś innego.
  To nie jest ogólny valley (dwie niezależne połacie o potencjalnie równej
  wysokości spotykające się na przekątnej) — to punktowa łata na JEDEN,
  z góry znany przypadek: wyższe skrzydło zasłaniające k krótszy, płaski
  dach korpusu w tej samej komórce siatki 2D.
- Autor funkcji sam pisze: „cztery kafle... obsluguja L, T oraz U tak samo,
  bo we wszystkich trzech ksztaltach styk jest ten sam" — co jest prawdą
  **w modelu `zloz_zlozony`** (jedna sylwetka nad jednym prostokątem), ale
  nie w modelu z sekcji 2 (prawdziwe, niezależne bryły dachu spotykające się
  na obrysie).

**Wniosek: `kafel_dolina` nie jest valleyem w sensie tego briefu.** Jest
łatą maskującą jeden konkretny artefakt nakładania się dwóch sylwetek w tej
samej komórce 2D. Prawdziwy valley (dwie niezależne połacie, ciągła
tekstura, przekątna na całej długości styku) nie istnieje w kodzie wcale.

### 5.3 Co pokazują trzy nowe referencje (rzut z góry)

Te trzy obrazy są pierwszymi w tej sesji faktycznie pokazującymi to pytanie
z właściwej perspektywy (z góry, nie z przodu):

**Rzut architektoniczny T** (kreska) — kanoniczna notacja: główna bryła
pozioma, skrzydło pionowe wychodzące ze ŚRODKA jej dolnej krawędzi, dach
skrzydła kopertowy (przekątne z rogów zbiegające się do linii kalenicy) —
potwierdza dokładnie topologię z sekcji 2, nie inną.

**Render 3D dachu T** — to jest najbardziej rozstrzygający obraz. Widać na
nim wprost:
- główna bryła: **dach czterospadowy (hip)** — kalenica pozioma na środku,
  dwie połacie boczne (hip end) na końcach, dwie połacie czołowe (przód/tył);
- skrzydło: **osobny, własny dach kopertowy** (pełny hip/piramida, bo
  skrzydło jest wąskie) — NIE przedłużenie kalenicy głównej bryły;
- **dwa valleye, symetrycznie po obu stronach skrzydła** — każdy biegnie
  od bliskiego rogu skrzydła ukośnie w górę, do punktu na połaci głównej
  bryły. Kalenica skrzydła NIE dochodzi do kalenicy głównej bryły — obie
  kalenice zostają niezależne, valley łączy tylko połacie.
- To rozstrzyga ważne pytanie: **nie potrzebujemy klasy „skrzyżowanie
  kalenic"** (4-kierunkowy węzeł, jakby dwie kalenice się przecinały) —
  potrzebujemy tylko klasy „valley łączący połać skrzydła z połacią głównej
  bryły", i to jest prostsze niż mogłoby się wydawać z samej nazwy „T".

**Tileset L z góry** (gotowy, modularny) — pokazuje dokładnie to, czego
`kafel_dolina` nie robi: **jedna ciągła przekątna od naroża wewnętrznego,
na całej długości styku obu skrzydeł**, tekstura zmienia kierunek biegu
w sposób ciągły, bez szwu, bez luki, bez wpieczonego tła jednego konkretnego
kafla. Widać też prawidłowe narożniki ZEWNĘTRZNE (rogi obu ramion, osobna
faktura narożna). To jest wzorzec tego, co trzeba zbudować — geometrycznie,
nie stylistycznie (kamień/gont, nie nasza słoma).

## 8. Tabela

| Footprint | Połacie | Kalenice | Narożniki zewn. | Narożniki wewn. / valleys | Junctions | Brakujące elementy |
|---|---|---|---|---|---|---|
| **Rectangle** | ✅ `polac`(płaski) / `polac_l`+`polac_p`(szczytowy) | ✅ prosta + zawinięty koniec | ✅ `zamek` + `naroznik_okapu`/`naroznik_kalenicy` | — (nie dotyczy) | — | brak (hip i saltbox to STYL, nie brak topologii) |
| **L** | ✅ (każde ramię = Rectangle) | ✅ (każde ramię = Rectangle) | ✅ (5 rogów, wszystkie wypukłe = Rectangle) | ❌ **1 valley, ogólny, brak** | ❌ **ściana wklęsła, brak w `_sciany`** | ściana narożnika wklęsłego; valley ogólny (dwie niezależne połacie, cała długość styku) |
| **T** | ✅ (każde ramię = Rectangle) | ✅ (każde ramię, niezależne — patrz 5.3) | ✅ (6 rogów wypukłych) | ❌ **2 valleye (lustrzane), brak** | ✅ potwierdzone: BEZ skrzyżowania kalenic (5.3) | jak L, ×2 (lustrzane), zero nowej klasy ponad L |
| **U** | ✅ | ✅ | ✅ | ❌ **2 valleye** (nie 4 — patrz 8.1) | otwarta przestrzeń między ramionami: decyzja projektowa, nie brak geometrii | jak L, ×2 (ta sama para co T) |

### 8.1 U ma dokładnie tyle samo nowych valleyów co T, nie więcej

Warto to policzyć precyzyjnie, bo intuicja „U ma dwa ramiona więc dwa razy
tyle problemów co L" jest zwodnicza. W podanym footprincie U każde ramię
jest **zlicowane z zewnętrzną krawędzią głównej bryły po jednej stronie**
(lewe ramię: kolumny 0-2, korpus zaczyna się od kolumny 0 — brak naroża po
tej stronie, ściana biegnie prosto) i ma **jedno** naroże wklęsłe po stronie
wewnętrznej (od strony wnęki). To znaczy: **U = dwa razy ten sam problem co
pojedyncze naroże L, w lustrzanym odbiciu** — nie cztery osobne valleye.
Dokładnie ta sama para kafli (lewy/prawy), której potrzebuje T, rozwiązuje
też U — użyta dwukrotnie zamiast raz.

**Przestrzeń między ramionami U to decyzja projektowa, nie luka
geometryczna** — brief słusznie każe to sprawdzić, a odpowiedź jest: jeśli
oba ramiona mają zwyczajne okapy skierowane w głąb wnęki, to jest to zwykłe
otwarte niebo między dwoma bryłami i nic nowego nie trzeba rysować (okap
istnieje). Most/zadaszony łącznik nad wnęką byłby osobną, świadomą decyzją
(jak `wiata` — osobna bryła), nie czymś wymuszonym przez sam footprint U.

## 9. Co już mamy / czego brakuje

### Co już mamy (wystarczające)
- Kompletna geometria **Rectangle** w dwóch archetypach (płaski, szczytowy):
  połać, kalenica prosta i z zawiniętym końcem, okap, narożnik zewnętrzny
  ściany i dachu, cień okapu. Zweryfikowane testami [7]–[11] w
  `build_budynki.py`, nie tylko odczytem kodu.
- Ściana jako pas o dowolnej długości i wysokości, z otwartym frontem na
  słupach (`otwarty=`) — ale zawsze prostokątna.
- Wzorzec (nie gotowy kod) na to, jak wygląda **poprawny valley** — z
  referencji L z góry: ciągła tekstura przez przekątną, zmiana kierunku
  bez szwu.
- Wzorzec na dach czterospadowy per ramię (z `thatched-roof.png`): czapa,
  połacie boczne, odcinek prosty, słupki narożne różnej wysokości.

### Czego brakuje (minimalne klasy geometrii)
1. **Ściana — narożnik wklęsły (270°).** `_sciany` nie ma dziś pojęcia
   ściany skręcającej. Bez tego L/T/U nie mają nawet podłogi, nie mówiąc
   o dachu.
2. **Dach — valley ogólny, para (lewy/prawy), niezależny od tego, co jest
   za nim.** W przeciwieństwie do `kafel_dolina`: bez wpieczonego tła
   konkretnego kafla, pokrywający CAŁĄ długość styku dwóch połaci (nie
   jeden rząd), używalny między dwiema połaciami o potencjalnie różnej
   wysokości/szerokości ramienia.
3. **(Opcjonalnie, do potwierdzenia dopiero przy T) Kalenica ramienia
   kończąca się WEWNĄTRZ valleya**, zamiast zawiniętym końcem jak przy
   wolnostojącym Rectangle — bo koniec kalenicy skrzydła w T/L nie styka
   się z powietrzem, tylko z valleyem. Może to być ten sam kafel co
   zawinięty koniec (do sprawdzenia przy realnym złożeniu), może osobny —
   nie rozstrzygam tego tutaj, to pytanie stylu/konstrukcji, nie topologii.

To są **trzy klasy**, nie dziesiątki wariantów — p. 9 w briefie: L używa
klasy 1 (×1) + klasy 2 (×1, jedna orientacja); T używa klasy 1 (×2,
lustrzane) + klasy 2 (×2, lustrzane); U używa dokładnie tego samego
kompletu co T. Rotacja (§3) nie mnoży klas, tylko warianty renderu w ramach
tych trzech.

## 10. Minimalny system (role, nie pliki)

| klasa | rola | ile orientacji potrzeba realnie |
|---|---|---|
| `sciana_naroznik_wklesly` | ściana skręca o 90° do wewnątrz | 4 (obrót), ale to JEDNA geometria narysowana raz + 3 obroty pliku |
| `dach_valley_L` / `dach_valley_P` | dwie połacie spotykają się na przekątnej, ciągła tekstura, dowolna długość styku | już parzyste (lewa/prawa), reszta orientacji = obrót całego złożonego budynku, nie osobny kafel |
| `dach_kalenica_w_valleyu` (do potwierdzenia) | koniec kalenicy ramienia, gdy nie kończy się w powietrzu | jak wyżej |

Nie proponuję tu wariantów artystycznych (materiał, paleta) — to jest
zgodnie z §10 briefu następny krok, po zatwierdzeniu tej analizy.

## 11. Geometria vs styl — potwierdzenie

Zgoda z briefem: żadna z trzech referencji (rzut z góry, render 3D, tileset
L) nie jest do wklejenia — inna rozdzielczość, inna paleta, inna technika
cieniowania (fotorealistyczne gonty vs nasza płaska słoma). Wchłaniamy
WYŁĄCZNIE topologię (gdzie biegnie przekątna, jak długi jest styk, gdzie są
narożniki), rysujemy od zera w 32×32, naszej palecie, naszym kierunku
światła, zgodnie z `Buildings.png`.

## 12. Najważniejszy test — werdykt per footprint

- **Rectangle: TAK.** Kompletne dziś, dwoma niezależnymi, przetestowanymi
  archetypami. Klasy: patrz 5.0 wiersze 1–2.
- **L: NIE.** Brak w dwóch miejscach jednocześnie: (a) `_sciany` nie umie
  narysować ściany skręcającej — dokładne miejsce: `_sciany`,
  `build_budynki.py:2202`, pętla `for r/for c` nie zna pojęcia narożnika
  poza dwoma końcami prostego pasa; (b) `kafel_dolina` nie jest ogólnym
  valleyem (5.2) — dokładne miejsce problemu zmierzone na renderze w tej
  sesji: klin tła między dachem korpusu a wznoszącą się połacią skrzydła,
  bo dolina pokrywa tylko jeden rząd na kolumnę. Proponowany minimalny brak:
  klasy 1–2 z sekcji 10.
- **T: NIE**, z tego samego powodu co L, plus potwierdzone (5.3, dzięki
  referencji 3D): **nie** potrzeba osobnej klasy „skrzyżowanie kalenic" —
  dwa niezależne valleye (klasa 2, użyta dwukrotnie, lustrzanie) wystarczają.
- **U: NIE**, z tego samego powodu co T, i **nie** wymaga żadnej klasy
  ponad to, czego wymaga T (8.1) — plus jedna decyzja projektowa (nie
  brak geometrii): czy przestrzeń między ramionami zostaje otwarta (zero
  nowej geometrii) czy dostaje zadaszony łącznik (świadomie osobna bryła).

---

## Werdykt końcowy

**Obecny zestaw referencji NIE jest kompletny geometrycznie dla L/T/U** —
jest kompletny dla Rectangle. Brakująca lista jest jednak **krótka i
policzalna, nie „dziesiątki kafli"**:

1. ściana — narożnik wklęsły (jedna geometria, obracana),
2. dach — ogólny valley, para lewa/prawa (jedna geometria per strona,
   reszta orientacji przez obrót),
3. do potwierdzenia dopiero na realnym złożeniu: wariant zakończenia
   kalenicy w valleyu.

Trzy referencje z góry (rzut architektoniczny, render 3D, tileset L)
dają wystarczający wzorzec KONSTRUKCJI (gdzie biegnie przekątna, jak
wygląda ciągłość tekstury, że kalenice ramion zostają niezależne — bez
skrzyżowania) do zaprojektowania tych trzech klas w naszym stylu. Żadna
z nich nie jest źródłem pikseli — są źródłem geometrii, zgodnie z §10.

Nic z tego nie zostało narysowane, zakodowane ani dodane do żadnego arkusza
w tej analizie.

# Checkpoint — terrain pass A1–A10, ground layer (2026-08-28)

> ⚠ **Dokument obejmuje DWA przebiegi tego samego kroku: pierwotny (§1–2.4)
> i korektę A6–A10 (§2.5), zrobioną tego samego dnia po przeglądzie renderu
> przez autora.** Tabela w §2.2 jest z PIERWSZEGO przebiegu — aktualne
> liczby dla A6–A10 są w §2.5. A1–A5+A5b nie zmieniły się między
> przebiegami (dowód w §2.5).

**Ten plik opisuje wyłącznie to, co FAKTYCZNIE wykonano i zweryfikowano.**
Poprzedni stan: `PROJECT_CHECKPOINT_RESIZE160.md` (resize 100×60→160×60,
brama, minimapa — zamknięte). Ten checkpoint dokłada **wyłącznie warstwę
`ground`** dla całej mapy 160×60, zgodnie z zatwierdzonym układem A1–A10.

**Zakres: WYŁĄCZNIE warstwa `ground`.** Zero drzew, zero dekoracji, zero
obiektów, zero nowych spawnów. Zweryfikowane mechanicznie (§2.1) — diff
wobec poprzedniego commita zmienia dokładnie jedną z 12 warstw kafli.

---

## 1. Metoda

Skrypt jednorazowy (Python + numpy, w scratchpadzie sesji, nie w `tools/` —
reguła `tools/CLAUDE.md`). Trzy warstwy, w tej kolejności:

1. **Pole gęstości trawy** — ciągła funkcja 0..1 na kafel, licząca się jako
   ważona (RBF, wagi podniesione do potęgi 2,2 dla ostrości) suma 15 kotwic
   strefowych (jedna do trzech na obszar, promień ~7–19 kafli). To jest ta
   sama lekcja co `build_mapa.py`'s `pole_gestosci` („suma gaussów, nie
   sinusoid") zastosowana do BAZOWEGO poziomu strefy, nie do addytywnego
   szumu drzew. ⚠ **Pierwsza wersja (promienie 13–19, bez podbicia wag)
   rozmywała wszystko do środka skali — A5b nie było widać.** Poprawka:
   mniejsze promienie (efektywnie połowa szerokości strefy) + podniesienie
   wag do potęgi, dopiero to dało czytelny kontrast.
2. **Szum organiczny** — suma 24 losowych gaussów, amplituda ±0,13.
3. **Jawne nadpisania lokalne**: twarde obejście Myśliwego (promień 6,2
   kafla, spadek na 2 kaflach — jedyna naprawdę twarda krawędź na mapie,
   zgodnie ze specyfikacją A3), pięć polan pod istniejącymi królikami
   (promień 3–4 kafle, głębokie cięcie -0,50), dwie polany przy trakcie w
   A2, otwarcie progu przy bramie (x155–159, rampa do 0,15).

Wynik kwantyzowany do 6 poziomów trawy (`TRAWA` 0–5) z niewielkim
ditheringiem (±0,035) przed kwantyzacją — bez tego gładkie pole daje brzydkie
pierścienie konturowe przy progach kwantyzacji.

**Osobne pole prawdopodobieństwa** steruje akcentami `ziemia`/`kamień`,
klastrowane przez kilka ziaren-plam na strefę (nigdy jednolity rozrzut —
reguła z `tools/CLAUDE.md` o kaflu-glitchu w środku pola). `ziemia` = ślad
człowieka/wilgoć (A1, A6, A8, A10); `kamień` = naturalna skała, bez
konotacji ludzkiej (A5b, A7, A9, A10).

⚠ **Iteracja była konieczna i zweryfikowana renderem na każdym kroku** —
pierwsza wersja miała dwa realne błędy, oba złapane na obrazku, nie w
liczbach:
- Kontrast między strefami był za słaby (opisane wyżej).
- **Pięć polan w A5 zlewało się w jeden korytarz** — trzy najbliższe sobie
  króliki (28,37/33,33/35,40, wzajemne odległości 6–8 kafli) przy promieniu
  5 i niskim tle A5 (0,30) dawały jedną wydłużoną jasną plamę przez pół
  strefy. Naprawione podniesieniem tła A5 (0,30→0,50/0,52→0,58) i
  zawężeniem promienia polan (5→3–4 z płytszą strefą płaską), co dało
  cztery/pięć wyraźnie oddzielonych plam zamiast jednego korytarza —
  dokładnie reguła „polana → prześwit → polana" z polecenia.

## 2. Walidacja

### 2.1 Techniczna

| sprawdzenie | wynik |
|---|---|
| Zmieniona dokładnie jedna warstwa (`ground`) z 12 | ✅ |
| Warstwy obiektów (`objects`/`rosliny`/`kamienie`) | bajt w bajt identyczne z poprzednim commitem |
| Obie kopie `forrest.tmj` w sync | ✅ deep-equal modulo ścieżka PNG |
| Gidy w palecie (1–8, 11–12) | ✅ zero spoza palety |
| Liczba komórek | 9600 (160×60) |
| Kolizja (suma komórek solid) | **1673 — niezmieniona** (warstwa `ground` nigdy nie niesie kolizji w tym tilesecie) |
| `npx tsc --noEmit` / `npm run build` | czyste (krok nie dotyka kodu) |
| `movement_weryfikacja.mjs` / `combat_regresja.mjs` | czyste (niezwiązane, uruchomione dla pewności) |

### 2.2 Gęstość per strefa (średni poziom trawy 0–5, na żywych danych)

| strefa | średni poziom | ziemia | kamień | komentarz |
|---|---|---|---|---|
| A1 | 0,49 | 53 | 0 | najniższa na mapie — zgodnie ze specyfikacją |
| A2 | 2,09 | 0 | 0 | |
| A3 | 1,17 | 0 | 0 | zaniżone przez twarde obejście (0,04) w środku próbki |
| A5 | 2,69 | 38 | 0 | z pięcioma wyraźnymi polanami wewnątrz |
| A5b | **4,02** | 0 | 15 | **najwyższa** — anomalia, zero ziemi (zero śladu człowieka) |
| A6 | 2,30 | 65 | 0 | ziemia skupiona przy obu dzikach (babrzysko) |
| A7 | 2,72 | 1 | 5 | |
| A8 | 3,30 | 92 | 0 | druga najwyższa, ale Z ziemią — odróżnia ją od A5b |
| A9 | 2,42 | 0 | 41 | kamień, nie ziemia — natura, nie ludzie |
| A10 | 1,55 | 127 | 29 | najsilniejszy akcent na mapie — cała tożsamość w teksturze |

**A5b vs A8 (§8 ryzyko z `forest_rebuild_scope.md`)**: różnią się i
poziomem (4,02 vs 3,30), i składem akcentu (A5b tylko kamień, A8 tylko
ziemia) — dwie niezależne przyczyny tej samej „szorstkości", nie ta sama
tekstura powielona.

### 2.3 Wizualna (render z prawdziwych kafli, nie schemat)

Trzy renderowane obrazy przejrzane i wysłane do przeglądu: pełna mapa (1x,
5120×1920), zachód x0–90 (3x), wschód x70–160 (3x).

**Co działa:**
- Obejście Myśliwego czytelne jako okrąg jasnej trawy z twardą krawędzią.
- Cztery/pięć osobnych polan w A5, rozdzielonych widocznym gąszczem —
  „polana → prześwit → polana" potwierdzone na obrazku, nie tylko w liczbach.
- A5b wyraźnie ciemniejsze niż otoczenie i niż A8; A8 ma widoczne plamy
  ziemi, których A5b nie ma.
- A9→A10 pokazuje rosnące zagęszczenie akcentu (kamień → kamień+ziemia)
  bez wyglądania jak jednolity prostokąt.
- Próg przy bramie (x155–159) czytelnie się otwiera.

**Co NIE działa jeszcze — i dlaczego to jest oczekiwane, nie błąd:**
- ⚠⚠ **Drzewa w x0–99 są ze starej, nieustrukturyzowanej generacji i NIE
  zostały tknięte w tym kroku** (zgodnie z poleceniem). Skutek widoczny na
  renderze: część polan w A5 częściowo przykrywają drzewa, które tam stały
  od początku (sprawdzone przed pisaniem: 24–37% komórek w promieniu 5 od
  każdego królika ma dziś pień). **To nie jest błąd tego kroku — to jest
  dokładnie ta rzecz, o której ostrzega ta sesja: geometria terenu jest
  gotowa, drzewa czekają na następny etap.** Priorytet dla etapu drzew:
  przerzedzić/usunąć pnie wewnątrz pięciu obrysów polan i wewnątrz obrysu
  obejścia Myśliwego.
- **x100–159 nie ma żadnych drzew** (zgodnie z poleceniem), więc struktura
  gęstości tam czyta się WYŁĄCZNIE przez odcień trawy i akcent
  ziemia/kamień — słabszy sygnał niż w lesie z drzewami. To jest naturalna
  konsekwencja kolejności „teren najpierw", nie wada tego kroku.
- **A6 nie ma jeszcze rozlewisk/kałuż** (`las_faza1b_final.md`/scope: „woda
  blob-47, małe plamy 4–20 kafli"). Świadomie pominięte: każdy nowy kafel
  wody na tej mapie automatycznie dostaje pełną kolizję (Step 1B nadał
  `solid: true` całemu blob-47 wody na poziomie tilesetu, nie per-instancja)
  — dorzucenie kałuż impulsywnie w ramach tego przebiegu oznaczałoby
  projektowanie nowych przeszkód bez tej samej ostrożności, jaką dostał
  bród w Step 2. Odłożone do osobnej, świadomej decyzji.

### 2.4 Sztuczne tunele / niezamierzone puste obszary

Sprawdzone wizualnie i przez rozkład gęstości per strefa (§2.2): brak strefy
o odstającej, płaskiej wartości sugerującej dziurę; korytarz z pierwszej
iteracji A5 (§1) był jedynym znalezionym i został naprawiony przed zapisem
do plików. Duża otwarta przestrzeń x100–159 jest **zamierzona** — to jeszcze
niezalesione nowe kolumny, nie luka.

### 2.5 Korekta A6–A10 (ten sam dzień, po przeglądzie renderu)

Autor ocenił kierunek A1–A5 jako dobry („nie przebudowywać") i zlecił
dopracowanie WYŁĄCZNIE A6–A10. Wykonane jako drugi przebieg tego samego
skryptu z rozszerzeniami, **z jawnym zamrożeniem** pięciu rectów
(A1/A2/A3/A5/A5b) — po przeliczeniu pola na nowo, ich komórki są
**nadpisywane z powrotem** wartościami z poprzedniego commita, więc
poprawka w A6–A10 nie może po cichu poruszyć niczego na zachodzie.
**Dowiedzione diffem, nie założone**: 0 różniących się komórek w każdym z
pięciu zamrożonych rectów (3320 komórek razem), podczas gdy A6/A7/A8/A9/A10
zmieniły odpowiednio 208/450/475/167/509 komórek.

**Co dokładnie się zmieniło, per strefa:**

| strefa | zmiana |
|---|---|
| **A6** | podniesiony poziom bazowy (0,46→0,54); DRUGI, ostrzejszy przebieg szumu lokalnego (amplituda ±0,24, maskowany wyłącznie do A6) dla „bardziej nierównej struktury"; cztery **bezwodne wilgotne zagłębienia** (spadek gęstości + wymuszona ziemia, bez kafli wody — patrz uzasadnienie w §2.3 niżej) zamiast dwóch dużych plam ziemi, osiem mniejszych „kieszeni" zamiast czterech |
| **A7** | gradient zachód→wschód pogłębiony (było 0,50→0,66, jest 0,40→0,74) i zwężony promień kotwic, żeby zmiana działa się WEWNĄTRZ pasma, nie na jego krawędziach |
| **A8** | drugi przebieg szumu (±0,22, maskowany do A8) dla „nierówna i brudna" zamiast gładkiego gradientu; dwie dodatkowe małe, twarde polany („zarośnięte składnice") kontrastujące z gęstszym młodnikiem wokół |
| **A9** | przeprojektowane z rozrzuconych kropek na **pas skalny** wzdłuż y10–15 (strefa najbliżej rzeki) — daje strukturę północ-południe, nie tylko wschód-zachód |
| **A10** | przeprojektowane z płaskiego pasma akcentu na **jeden dominujący punkt źródłowy** (148,28) z promieniującą wilgocią + dwa mniejsze wysięki, i **spadkiem gęstości trawy w samym rdzeniu** (podmokła ziemia nie niesie tyle trawy), zamiast jednorodnej gęstości. Obrzeża (blisko bramy, blisko północnej/południowej krawędzi A10) świadomie suchsze — mniejsze prawdopodobieństwo akcentu |

⚠ **A6 „rozlewiska" są nadal BEZ kafli wody**, zgodnie z decyzją z §2.3 —
autor prosił o „małe rozlewiska, wilgotne kieszenie" **samym podłożem**
(dosłowne sformułowanie polecenia), co czyta się jako potwierdzenie tamtej
decyzji, nie jej cofnięcie. Zaimplementowane jako gęste, ciemne, wilgotne
zagłębienia z ziemią — sygnał wizualny bez nowej kolizji.

**Zmierzone po korekcie:**

| strefa | średni poziom (było → jest) | ziemia (było→jest) | kamień (było→jest) |
|---|---|---|---|
| A6 | 2,30 → 2,20 | 65 → 77 | 0 → 0 |
| A7 | 2,72 → 2,62 | 1 → 2 | 5 → 5 |
| A8 | 3,30 → 3,40 | 92 → 100 | 0 → 0 |
| A9 | 2,42 → 2,40 | 0 → 46 | 41 → 21 |
| A10 | 1,55 → **1,35** | 127 → **164** | 29 → **0** |

⚠ **A10 straciło swój kamień** — silne pole ziemi wokół punktu źródłowego
(promień 7,5, prawdopodobieństwo 0,55) dominuje nad słabszymi klastrami
kamienia w tym samym sąsiedztwie (`add_cluster` bierze wyższe z dwóch
prawdopodobieństw). Sprawdzone na renderze: efekt wizualny jest dalej dobry
(spójny mokry rdzeń), ale to jest drobna rozbieżność wobec pierwotnego
zamiaru „ziemia + kamień" i zostaje zapisana, nie ukryta. Do poprawki przy
okazji, nie osobna sesja.

Trzy dedykowane zbliżenia z prawdziwych kafli (A6 x48–84, A8 x108–144, A10
x138–160 cała wysokość) wyrenderowane i wysłane do przeglądu razem z pełną
mapą.

---

## 3. Otwarte punkty dla kolejnego etapu (drzewa)

| # | co | gdzie |
|---|---|---|
| 1 | Przerzedzić drzewa wewnątrz pięciu obrysów polan A5 i obrysu obejścia A3 | pierwszy priorytet — dziś tam stoją stare pnie |
| 2 | Zasadzić drzewa w x100–159 zgodnie z gęstością `ground` już policzoną w tym kroku | A9/A10 |
| 3 | Rozlewiska/kałuże w A6 — świadoma decyzja o nowej kolizji wody, osobno od sadzenia drzew | A6 |
| 4 | Gatunki: dąb/brzoza młode w A1, brzoza/buk w A2, świerk/grab w A5b (już tam, zostawić), olcha/świerk w A6 (bez dębu/buku), świerk rosnący ku wschodowi w A7/A8/A9, `*_maly` przewaga w A8 | per specyfikacja `forest_rebuild_scope.md` §4 |

**Nie ruszone w tym kroku, celowo**: standard prześwitu (`las_faza1b_final.md`
§10), populacja (Z-9, `docs/dziennik.md` 2026-08-28 (3)), żaden spawn.

---

## 4. Jak wznowić

1. `git log --oneline -3 && git status --short`.
2. Ten plik + `PROJECT_CHECKPOINT_RESIZE160.md` dają pełny stan techniczny.
3. `npx tsc --noEmit && npm run build` — oba muszą przejść czysto.
4. Następny krok: **drzewa A1–A10**, zaczynając od punktu 1 w §3 (polany
   A5 i obejście A3 dziś nadal mają stare pnie).

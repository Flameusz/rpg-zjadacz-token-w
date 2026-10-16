---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — performance NIE jest domeną
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Perf.ts, src/core/RenderCuller.ts]
otwarte: [OI-73, OI-74]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `performance`

> **Wynik: `performance` NIE JEST DOMENĄ. To PRZEKRÓJ.**
>
> ⛔ **`docs/systemy/performance.md` świadomie NIE POWSTAŁ.** Ten plik jest
> całym produktem misji: zapisuje rozstrzygnięcie, rozdziela reguły do ich
> prawdziwych właścicieli i zostawia dwie pozycje otwarte.

---

## 1. Rozstrzygnięcie — pięć pytań, pięć odpowiedzi z kodu

| # | pytanie | odpowiedź | dowód |
|---|---|---|---|
| **1** | Czy istnieje **własny stan**? | ⛔ **NIE** | Miernik trzyma okno czasów klatek — ale **znika z buildu produkcyjnego** i nie zapisuje się nigdzie |
| **2** | Czy istnieją **własne reguły gameplayowe**? | ⛔ **NIE** | ⚠ **Zero** reguł należących wyłącznie tutaj; każda znaleziona ma właściciela gdzie indziej (§2) |
| **3** | Czy ma **producenta i konsumenta**? | ⛔ **NIE** | Producentem jest pętla klatkowa, konsumentem **człowiek czytający raport w konsoli** — ⚠⚠ **jedyne wywołanie miernika w całym `src/` to podpięcie uchwytu deweloperskiego** |
| **4** | Czy istnieje **kod realizujący te reguły**? | ⚙ **TAK — ale nie jego** | Każdy kawałek *(culling, warstwa Y-sortowana, malowanie przy zmianie, przepustnica, trasowanie)* ma **temat innej domeny** |
| **5** | Czy tylko **mierzy i obserwuje**? | ✅ **TAK** | Nagłówek narzędzia mówi to wprost: „pomiar klatek — **narzędzie deweloperskie, nie mechanika**" |

⭐ **Test rozstrzygający: czy zmierzona wydajność WRACA do gry?**
⛔ **Nie wraca ani w jednym miejscu.** Zmierzone: **zero** zachowań zależnych
od liczby klatek, **zero** poolingu, **zero** poziomów szczegółowości, **zero**
adaptacji jakości, **zero** limitów populacji. ⚙ Wszystkie optymalizacje w tej
grze są **stałe i wybrane z góry**, nie sterowane pomiarem.

⚠ **Nazwa narzędzia nie jest dowodem istnienia domeny.** Plik o nazwie
„benchmark" *(990 linii)* mierzy **balans walki**, nie klatki — i jest
przymiarem `combat`/`weapons`.

---

## 2. Gdzie naprawdę mieszkają te reguły

**Dziesięć reguł motywowanych wydajnością, żadna bez właściciela:**

| reguła | właściciel | stan |
|---|---|---|
| maluj kolor/obrys **tylko przy zmianie stanu** | `ui` | ✅ **N-223**, zapisana |
| **klucz deduplikacji opisuje wszystko, co pętla rysuje** | `ui` | ✅ **N-223**, zapisana |
| zysk siedzi w stanie **bezczynnym**, nie w kwantyzacji | `ui` | ✅ `ui` §7 |
| kwantyzuj w pikselach **urządzenia**, nie logicznych | `ui` | ✅ `ui` §7 |
| przepustnica retriggeru **per kubełek znaczenia** | `audio` | ✅ **N-170** |
| ⛔ **nie licz trasy co klatkę** *(zmierzone: 120/120 klatek)* | `movement` | ✅ zapisana **z przymiarem** |
| łata filtrowania tekstu przy **każdym** przerysowaniu | `presentation` | ✅ `presentation` §5 |
| **sufit gęstości pikseli** *(żeby telefon QHD nie rysował 4 mln px/klatkę)* | `presentation` | ⚠ **nieopisany wprost** — mieści się w „arytmetyce skali", ale nie ma własnego zdania |
| culling: **tylko `.visible`**, tylko treść statyczna i nieinteraktywna | `world` | ⏳ **depozyt** — domena bez `STAN`-u |
| warstwa Y-sortowana: **tylko byty wymagające porównania co klatkę** | `world` | ⏳ **depozyt** — j.w. |

⚙ **Dwie reguły należą do NARZĘDZIA, nie do gry** — i tu jest ich dom:

| reguła narzędzia | treść |
|---|---|
| **percentyle i licznik zacięć zamiast średniego FPS** | ⚠ trzy różne przyczyny ścinania wyglądają tak samo, a średnia **ukrywa zacięcia**: 58 FPS przy dwudziestu klatkach po 40 ms czyta się jako „jest dobrze" |
| **nakładka miernika jest elementem DOM, nie obiektem silnika** | ⭐ **miernik ma nie dokładać pracy, której szuka** |

---

## 3. Depozyty — co było źle przypisane

| depozyt | werdykt |
|---|---|
| **percentyle zamiast średniego FPS** | ✅ **prawdziwy** — ⚠ ale to **reguła narzędzia deweloperskiego**, nie reguła gry. Przypisanie do domeny systemowej było błędem kategorii |
| **licznik zacięć** | ✅ j.w. |
| **culling** | ✅ istnieje — ⛔ **nie jest adaptacyjny**: margines to **stała strojona ręcznie**, nie odpowiedź na pomiar. Właściciel: `world` |
| **warstwa Y-sortowana „przeliczana co klatkę"** | ⚠⚠ **sformułowanie było mylące i odwracało sens.** Warstwa istnieje po to, żeby **jak najmniej** rzeczy było sortowanych co klatkę — jest **ograniczeniem** pracy, nie jej źródłem. Właściciel: `world` |
| **koszt klatki przy malowaniu interfejsu (N-223)** | ✅ **prawdziwy i już zapisany** — `ui`. ⛔ Nie miał tu czego szukać |
| **zysk w stanie bezczynnym** | ✅ j.w., `ui` §7 |
| **wpływ kwantyzacji** | ✅ j.w., `ui` §7 |
| **limity/targety mobilne** | ⛔ **NIE ISTNIEJĄ** — patrz `OI-73` |
| **jakakolwiek reguła wydajności wpływająca na gameplay** | ⛔ **ZERO** — i to jest najważniejsza odpowiedź tej misji |

---

## 4. Pomiary

| pomiar | wynik |
|---|---|
| wywołania miernika w całym `src/` | **1** *(podpięcie uchwytu deweloperskiego)* |
| miernik w buildzie produkcyjnym | ⛔ **usuwany** |
| zachowania zależne od zmierzonej wydajności | **0** |
| pooling / poziomy szczegółowości / adaptacja jakości | **0** / **0** / **0** |
| limity populacji bytów | **0** |
| ⛔ **zadeklarowane cele wydajnościowe** *(FPS, budżet, klasa urządzenia)* | **0** |
| reguły motywowane wydajnością | **10**, wszystkie z właścicielem |
| — zapisane już w `STAN`-ach | **6** |
| — depozyty dla domen bez `STAN`-u | **2** *(`world`)* |
| — reguły **narzędzia** | **2** |
| narzędzia pomiarowe | **1** *(klatki)* + **1** o mylącej nazwie *(mierzy balans)* |
| culling: co dotyka | ⚙ **wyłącznie `.visible`** — nigdy aktywności, głębi, przynależności ani kolizji |

**Co z tego wynika:**

1. ⭐ **Wszystkie optymalizacje tej gry są STAŁE, nie sterowane.** Nie ma
   pętli zwrotnej „mierz → zmień zachowanie", więc nie ma czego opisywać jako
   mechaniki: **nie ma stanu, nie ma niezmiennika, nie ma decyzji podejmowanej
   w czasie gry**.
2. ⚠ **Optymalizacja jest tu WŁAŚCIWOŚCIĄ REGUŁY INNEJ DOMENY**, nie osobnym
   systemem. „Nie licz trasy co klatkę" jest regułą ruchu; „maluj przy zmianie
   stanu" — regułą interfejsu. ⛔ Wyjęcie ich do wspólnego dokumentu
   **oderwałoby je od kodu, którego dotyczą**, czyli od jedynego miejsca,
   w którym ktoś je przeczyta na czas.
3. ⚠⚠ **Nie ma celu, więc nie ma czego naruszyć.** Żadna z dziesięciu reguł nie
   da się dziś ocenić jako „wystarczająca" albo „za mała", bo **nie istnieje
   liczba, wobec której miałaby być oceniana** (`OI-73`).

---

## 5. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | pomiar wyłącznie deweloperski · optymalizacje stałe, rozdzielone po domenach · culling wąski i nieadaptacyjny · zero sprzężenia pomiar → zachowanie |
| **INTENDED** | ⚠ **etap „optymalizacja mobilna"** żyje w planie prac jako zakres robót, nie jako mechanika — ⚙ i to jest właściwe miejsce dla planu, nie `STAN` |
| **HISTORICAL** | trasowanie liczone **co klatkę** *(zmierzone 120/120, naprawione)* · trzy widżety przemalowujące napisy bezwarunkowo · pierwszy próg kwantyzacji liczony w jednostkach logicznych zamiast w pikselach urządzenia |

---

## 6. Los niezmienników

⚙ **Ta misja nie tworzy ani jednego nowego niezmiennika** — i to jest wynik,
nie zaniedbanie. Wszystkie znalezione reguły **już należą** do innych domen
(§2), a trzy z nich mają przymiary w tamtych domenach.

| co | los |
|---|---|
| dziesięć reguł motywowanych wydajnością | ➡ **ZOSTAJĄ** u swoich właścicieli; **żadna nie jest sierotą** |
| dwie reguły pomiaru | ➡ **ZOSTAJĄ** przy narzędziu *(`proces`)* |
| sufit gęstości pikseli | ⚠ **należy do `presentation`**, dziś bez własnego zdania — do dopisania przy najbliższej okazji, ⛔ **nie w tej misji** |
| status `performance` na liście domen | ⛔ **OTWARTY** → `OI-74` |
| cele wydajnościowe | ⛔ **OTWARTE** → `OI-73` |

---

## 7. Nowe OI

| id | rzecz |
|---|---|
| **OI-73** | ⚠⚠ **Projekt nie ma ANI JEDNEGO zadeklarowanego celu wydajnościowego.** Zero docelowych klatek, zero budżetu klatki, zero klasy urządzenia odniesienia — mimo że docelową platformą jest telefon, a narzędzie pomiarowe **istnieje i podaje percentyle**. ⚙ Skutek jest podwójny: **żadnej optymalizacji nie da się uznać za wystarczającą**, a **żadnej regresji za naruszenie** — bo nie ma liczby, wobec której się je ocenia. ⚠ Miernik odpowiada „ile jest", nikt nie powiedział „ile ma być". ⛔ **Decyzja AUTORA**: jedna liczba i urządzenie odniesienia; ⛔ przymiaru nie budowałem. |
| **OI-74** | ⚠ **`performance` stoi na kanonicznej liście domen, a nie dostanie `STAN`-u.** Ta ekstrakcja pokazała, że jest **przekrojem**: bez stanu, bez własnych reguł, bez konsumenta w grze. ⚙ Lista domen **zmienia się wyłącznie decyzją z dowodami** *(kontrakt §4, precedens: `effects` jako 27. domena)*, więc **nie usuwam ani nie przepisuję jej sam**. ⛔ **Decyzja AUTORA**: zdjąć pozycję z listy, zostawić ją jako **świadomie pustą** z odsyłaczem do tego pliku, czy wprowadzić trzeci status („przekrój") obok domeny. ⚠ Do czasu decyzji **licznik „X z 27" jest mylący** — 27 pozycji, ale nie 27 możliwych `STAN`-ów. |

---

## 8. Czego NIE udało się zweryfikować

1. ⛔ **Rzeczywistej wydajności na telefonie.** Miernik jest deweloperski
   i wymaga **uruchomionej gry na urządzeniu**; ta misja czytała kod. ⚙ Wszystko
   powyżej mówi, **jakie reguły istnieją**, a nie **czy gra chodzi płynnie**.

2. ⛔ **Czy dziesięć reguł faktycznie coś daje.** Każda ma uzasadnienie,
   trzy mają zmierzoną historię *(trasowanie co klatkę, trzy przemalowania
   bezwarunkowe, próg kwantyzacji)* — ⚠ ale **żadna nie ma pomiaru „przed
   i po" w liczbach, które przetrwałyby do dziś**.

3. ⚠ **Czy brak adaptacji jest decyzją, czy stanem zastanym.** Zero poolingu,
   zero poziomów szczegółowości, zero reakcji na pomiar — ⛔ **nigdzie nie
   znalazłem zdania, że tak ma być**. Milczenie o nieistnieniu; ⚙ przy zerowym
   celu wydajnościowym (`OI-73`) nie ma jak rozstrzygnąć, czy to brak potrzeby,
   czy brak uwagi.

---

## 9. Czego procedura tu NIE złapała

1. ⭐⭐ **DOMENA MOŻE NIE ISTNIEĆ, MIMO ŻE MA NAZWĘ, NARZĘDZIE I KOD.**
   `performance` ma pozycję na liście domen, **własny plik pomiarowy**,
   **drugi plik z „benchmark" w nazwie** i kilkanaście miejsc w kodzie, które
   ktoś napisał dla wydajności. ⛔ A mimo to nie ma **stanu, konsumenta ani
   niezmiennika** — bo pomiar **nigdy nie wraca do gry**. ⭐ Krok do procedury:
   **pytaj, czy zmierzona wartość WRACA do systemu; jeśli nie, mierzysz
   narzędziem, a nie opisujesz mechaniki.**

2. ⚠⚠ **NAZWA NARZĘDZIA JEST NAJTAŃSZYM FAŁSZYWYM DOWODEM.** Plik „benchmark"
   mierzy **balans**, a nie klatki — 990 linii, które ekstrakcja szukająca
   wydajności po nazwach zaliczyłaby jako dowód istnienia domeny. ⚙ Ta sama
   klasa co „pomiar po nazwie mechanizmu liczy komentarze jako kod" z `ui`.

3. ⚠ **DEPOZYT POTRAFI ODWRÓCIĆ SENS REGUŁY.** „Warstwa Y-sortowana
   przeliczana co klatkę" brzmi jak **koszt**; w kodzie ta warstwa jest
   **ograniczeniem kosztu** — istnieje po to, żeby sortować **jak najmniej**.
   ⛔ Zapisałem ją tak w checkpoincie sam, streszczając cudzy komentarz.

4. ⚠⚠ **BRAK CELU JEST NIEWIDOCZNY, DOPÓKI NIE ZAPYTA SIĘ O NIEGO WPROST**
   (`OI-73`). Projekt ma narzędzie odpowiadające „ile jest" i ani jednego
   zdania „ile ma być" — ⛔ a bez tej drugiej liczby pierwsza nie jest
   pomiarem, tylko odczytem.

⚙ **Co zadziałało:** postawienie **jednego pytania rozstrzygającego**
*(czy pomiar wraca do gry)* zamiast inwentaryzowania optymalizacji, oraz
przypisanie każdej znalezionej reguły do **właściciela**, zanim padło pytanie
„czy zrobić `STAN`". ⭐ **Odpowiedź „wszystkie mają właścicieli" JEST dowodem,
że domena jest pusta.**

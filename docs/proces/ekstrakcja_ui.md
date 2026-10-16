---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena ui
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/ui/PanelBase.ts, src/ui/ControlLayout.ts]
otwarte: [OI-67, OI-68, OI-69]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `ui`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/ui.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — granica `ui` / `presentation` / `input`

### 1.1 Test, który rozstrzyga

⭐ **Pytanie „co jest interfejsem" rozbija się o to, że wszystko trzy widać.**
Rozstrzyga dopiero **czas życia**:

| | `ui` | `presentation` | `input` |
|---|---|---|---|
| **żyje** | tyle, ile trwa **stan** | tyle, ile trwa **zdarzenie** | tyle, ile trwa **dotknięcie** |
| **odpowiada na** | pytanie | ogłoszenie | intencję |
| **przestrzeń** | interfejsu | zwykle świata | ekranu |

⚠⚠ **Zmierzone: katalog `src/ui/` NIE jest tą domeną.** 28 plików, z czego
**jeden — czwarty co do wielkości, 626 linii — rysuje w przestrzeni ŚWIATA
i jest budowany przez scenę gry**, a nie przez nakładkę. ⛔ Podział plików
powstał, **zanim istniało pojęcie domeny**; jest historią, nie granicą.

⚠ **Jeden przypadek graniczny zostawiony świadomie:** powierzchnia, która
**trwa** razem ze stanem *(czyli `ui` wg pierwszego testu)*, ale **nie niesie
nic do odczytania** *(czyli `presentation` wg drugiego)*. ⛔ Nie rozstrzygam —
należy do ekstrakcji `presentation`, i tam jest zapisana jako depozyt.

### 1.2 Właściciele reguł — sprawdzone kodem

| reguła | faktyczny właściciel |
|---|---|
| modalność, pauza, oprawa panelu | **`ui`** |
| afordancje: zaznaczanie, karta, przyciski akcji | **`ui`** |
| koszt klatki przy malowaniu | **`ui`** |
| **rozstrzyganie sporu o dotknięcie** | ⛔ `input` *(silnik + hit-testy)* |
| **próg dotykowy jako WYMÓG** | ⛔ `input` — ⚠ ale **spełnia go tylko klaster bojowy** (`U-2`) |
| **czy akcja jest dozwolona** | ⛔ domena mechaniki, nigdy widżet |
| dźwięk potwierdzenia i cisza odmowy | ⛔ `audio` |

### 1.3 Plan cięcia

| | treść |
|---|---|
| **bierze** | kontrakt z rozgrywką · skala jako kamera · oprawa i modalność panelu · czasowniki i afordancje · zasięg progu dotykowego · geometria klastra · koszt klatki · pierwszy przemalunek i przewijanie |
| **oddaje** | reakcje na zdarzenie → `presentation` · arbitraż dotyku i próg jako wymóg → `input` · dozwolenie akcji → mechanika · dźwięk → `audio` |
| **NIE opisze** | żadnego panelu, ekranu, przycisku ani komunikatu · ergonomii od nowa · arytmetyki skali i filtrowania tekstu |

⭐ **Czternasta domena z rzędu z planem cięcia**, pod limitem (18,1 KB) — ⚠ przy
katalogu **13 190 linii**, największym, jaki ta seria opisywała.

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | kontrakt bez sięgania do sceny · skala jako kamera · siedem paneli na wspólnej oprawie · tapnięcie zaznacza · odmowa widoczna i nazwana · trzy pierścienie klastra · malowanie przy zmianie stanu · pierwszy przemalunek stron |
| **INTENDED** | ⚠ **podniesienie przycisków paneli i wierszy karty do progu dotykowego** — nazwane w kodzie jako **osobna zmiana**, wymagająca przeprojektowania karty, nie zmiany liczby (`OI-67`) |
| **HISTORICAL** | podwójne tapnięcie i 300 ms opóźnienia, które istniało tylko po to, by się z nim nie bić · przycisk zamknięcia w prawym GÓRNYM rogu *(2,8 mm, poza zasięgiem kciuka)* · kolumna kontrolek zamiast łuku · geometria rogu eksportowana z widżetu, który sam był jej klientem |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **U-1** | `src/ui/` to katalog domeny interfejsu | ⛔ **28 plików, jeden z nich (626 l.) rysuje w przestrzeni ŚWIATA i jest budowany przez scenę gry.** 15 widżetów buduje nakładka, 5 paneli buduje rozmowa, reszta to pomocnicy | ⚠⚠ wysoka — ⭐ **katalog jest historią, nie granicą**; plik należy do `presentation` |
| **U-2** | **depozyt `N-150`: „pole dotykowe ≥ próg"** | ⚙ **reguła prawdziwa, zasięg inny niż sugerowało brzmienie.** Asercja obejmuje **4 pierścienie + przycisk ataku = 5 kontrolek**. Zmierzone poza nią: **13 przycisków paneli o wysokości 20–40 j.** i wiersze akcji karty **40 j.** — wszystkie **poniżej progu 68 j.** | ⛔ wysoka → `OI-67`. ⚙ Kod **nazywa to długiem wprost**, z powodem: podniesienie wymaga przeprojektowania karty |
| **U-3** | pauza należy do modala | ⚙ prawda o **intencji**, nie o mechanizmie: pauza to **dwa niezależne wywołania** wstrzymania/wznowienia, **bez zliczania**, a stan otwarcia trzyma **osiem osobnych flag** | ⛔ wysoka — potwierdza `OI-52` od strony interfejsu → `OI-68` |
| **U-4** | „interfejs nie sięga do sceny gry" | ✅ **zero wyjątków — policzone.** Ani jednego wyszukania sceny w całym katalogu; 25 zdarzeń w jedną stronę, 10 w drugą | ⚙ **zgodne** — ⭐ rzadki przypadek: reguła katalogowa dotrzymana w stu procentach |
| **U-5** | „odmowa widoczna z powodem" | ✅ realna — ⚙ ale ma **DWA kształty**: trwały wyszarzony przycisk (**5** miejsc) i ulotny komunikat (**21**). ⛔ Nic nie mówi, kiedy który | ⚠ średnia → `OI-69` |
| **U-6** | odmowa działa tak samo w każdym kanale | ⛔ **nie — i to jest spójne.** Oko dostaje **powód**, ucho **ciszę** *(`audio`)*, a niedostępne pytanie jest **ukryte** *(`quests`)*. Trzy przeciwne reguły z jednej zasady „nie kłam graczowi" | ⚙ **nie rozjazd** — ⭐ pierwsze zestawienie trzech kanałów obok siebie |
| **U-7** | flaga przeciągania bez czytelników | ✅ **potwierdzone: 1 zapis, 0 odczytów** — dokładnie tak, jak mówi instrukcja katalogu | ⚙ **zgodne** — komentarz prawdziwy, ostrzeżenie zasadne |
| **U-8** | geometria interfejsu jest sprawdzana | ⚙ **klastra — tak, paneli — nie.** Sześć paneli dzieli jedną szerokość, najwyższy zajmuje **530 z ok. 580 j.**; „czy się mieści" jest **ostrzeżeniem w konsoli buildu deweloperskiego** | ⚠ średnia → `OI-68` |
| **U-9** | pierwszy pomiar interaktywności widżetów | ⛔ **fałszywy** — zaliczył widżet, którego komentarz brzmi *„deliberately NOT interactive"*. Pomiar liczył **wystąpienia słowa**, nie wykonywany kod | ⚙ **błąd pomiaru, nie kodu** — patrz §7.1 |

⚠ **Profil domeny: jeden rozjazd katalog ↔ domena, jeden zasięg reguły węższy
od jej brzmienia, jeden brak właściciela i jeden brak przymiaru.**
⚙ **Zero fałszywych komentarzy** — czwarta domena z rzędu.

---

## 4. Pomiary

**Metoda:** klasyfikacja plików po **wykonywanym kodzie** *(z pominięciem
komentarzy — patrz `U-9`)*; wymiary przycisków odczytane z wywołań; kontrakt
zdarzeń policzony po nazwach zdarzeń, nie po wywołaniach.

| pomiar | wynik |
|---|---|
| pliki w katalogu interfejsu | **28** · **13 190** linii |
| największy · drugi | **4 205** · **1 929** linii |
| przyjmujące wejście · bierne | **20** · **8** |
| budowane przez nakładkę | **15** |
| ⛔ budowane przez **scenę gry** | **1** *(przestrzeń świata → `presentation`)* |
| panele na wspólnej oprawie | **7** *(5 z nich buduje rozmowa)* |
| ⛔ wyszukania sceny gry w całym katalogu | **0** |
| zdarzenia stanu, na które interfejs reaguje | **25** |
| zdarzenia żądań, które emituje | **10** |
| niezależne flagi otwarcia | **8** |
| ⛔ wywołania pauzy/wznowienia · zliczanie | **2** · **brak** |
| kontrolki objęte asercją progu dotykowego | **5** |
| ⛔ przyciski paneli **poniżej** progu | **13** *(wysokości 20–40 j. przy progu 68)* |
| odmowa: trwały przycisk · ulotny komunikat | **5** · **21** |
| przymiary tej domeny | **2** *(geometria klastra, pierwszy przemalunek)* |

**Co z tego wynika:**

1. ⚠⚠ **Reguła progu dotykowego obowiązuje 5 kontrolek, a nie interfejs.**
   ⭐ Wszystko, co ma asercję, jest **nad** progiem; wszystko, co jej nie ma,
   jest **pod** nim. To nie jest zbieg okoliczności — to jest opis tego, co
   przymiar naprawdę utrzymuje.
2. ⭐ **Kontrakt z rozgrywką jest wąski i dotrzymany w stu procentach**:
   35 zdarzeń w obie strony, **zero** obejść. ⚙ Najlepiej przestrzegana reguła
   tej domeny — i **jedyna, której nie musi pilnować żaden przymiar**, bo jej
   złamanie wymagałoby świadomego importu.
3. ⚠ **Modalność ma osiem właścicieli, czyli żadnego.** Osiem niezależnych flag
   i dwa niezliczane wywołania pauzy to **dokładnie ta struktura**, przy której
   zamknięcie jednego panelu wznawia świat pod drugim.

⛔ **Nie oceniam, czy 28 plików i 13 190 linii to dużo** — to jest opis, nie
werdykt.

---

## 5. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **„odmowa widoczna z powodem"** | ✅ realna — ⚙ i **bogatsza, niż mówił depozyt**: dwa kształty, 5 i 21 miejsc, bez reguły wyboru (`U-5`) |
| **świadome różnice wobec `audio` i `quests`** | ✅ potwierdzone i **zestawione po raz pierwszy**: powód dla oka, cisza dla ucha, ukrycie dla wiedzy. ⭐ Każda z osobna wygląda na wyjątek; razem są jedną zasadą |
| **próg dotykowy jako wymóg `input` (`N-150`)** | ⚙ **reguła prawdziwa, ale jej ZASIĘG był domniemany.** Zmierzony: 5 kontrolek objętych, 13 przycisków paneli poza. ⛔ Depozyt przyjęty **z poprawką**, nie odrzucony |
| **pauza i modalność (`OI-52`)** | ✅ potwierdzone od strony interfejsu i **doprecyzowane liczbą**: osiem flag, dwa wywołania, zero zliczania (`U-3`) |
| **wzorzec „tapnięcie zaznacza"** | ✅ potwierdzony w obu panelach — ⚙ z regułą, której depozyt nie niósł: **zaznaczanie i rysowanie karty to dwie różne czynności**, bo licznik ilości musi przemalować kartę **bez zmiany zaznaczenia** |

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| interfejs nie sięga do sceny gry | 🆕 **N-213** — ⭐ zero wyjątków, policzone |
| widżet nie rozstrzyga, czy akcja jest dozwolona | 🆕 **N-214** |
| skala jako kamera; kotwice wirtualne | 🆕 **N-215** |
| panel interaktywny na całej powierzchni | 🆕 **N-216** |
| widok podrzędny nie pauzuje sam | 🆕 **N-217** |
| tapnięcie zaznacza, przycisk wykonuje | 🆕 **N-218** — ⚙ **depozyt potwierdzony i rozszerzony** |
| karta ma jeden adres, reguła ma dwie połowy | 🆕 **N-219** |
| odmowa widoczna i nazwana | 🆕 **N-220** (U-5, U-6) |
| pole dotykowe ≥ próg i ≥ grafika | 🆕 **N-221** — ⚠ **z jawnie zapisanym zasięgiem** (U-2) |
| widżet pyta o slot; kąt należy do slotu | 🆕 **N-222** |
| maluj przy zmianie stanu; klucz opisuje wszystko | 🆕 **N-223** |
| każda strona malowana przy budowie | 🆕 **N-224** — ⚙ jedyny niezmiennik tej domeny z **własnym przymiarem** |
| maska przycina rysowanie, nie wejście | 🆕 **N-225** |
| arbitraż dotknięcia | ➡ **ZOSTAJE** w `input` (N-151, N-152) |
| dźwięk potwierdzenia i cisza odmowy | ➡ **ZOSTAJE** w `audio` (N-172) |
| arytmetyka skali, rozdzielczość i filtrowanie tekstu | ➡ **ZOSTAJE** dla `presentation` |
| klasyfikacja powierzchni granicznej | ⛔ **OTWARTA** — depozyt dla `presentation` |
| zasięg progu dotykowego | ⛔ **OTWARTY** → `OI-67` |
| właściciel modalności i geometria paneli | ⛔ **OTWARTE** → `OI-52`, `OI-68` |
| który kształt odmowy kiedy | ⛔ **OTWARTY** → `OI-69` |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **POMIAR PO NAZWIE MECHANIZMU LICZY KOMENTARZE JAKO KOD** (U-9).
   Pierwsza klasyfikacja widżetów zaliczyła do interaktywnych ten, którego
   komentarz brzmi *„deliberately NOT interactive"* — bo szukała **słowa**,
   a nie wywołania. ⭐ To jest lustrzane odbicie reguły „nie ufaj komentarzom":
   tu komentarz był **prawdziwy**, a zawiódł **pomiar**. Krok do procedury:
   **klasyfikując pliki, odsiej komentarze, zanim policzysz cokolwiek.**

2. ⚠⚠ **REGUŁA BYWA PRAWDZIWA, A JEJ ZASIĘG — DOMNIEMANY** (U-2). Depozyt
   „pole dotykowe ≥ próg" jest poprawny; nieprawdziwe było milczące założenie,
   że dotyczy **interfejsu**. Dotyczy **pięciu kontrolek**. ⚙ Ta sama klasa co
   gwarancja rosteru dźwięków: zdanie prawdziwe **czyta się szerzej, niż
   obowiązuje**. ⭐ Krok: **przy każdym depozycie w formie reguły policz, ile
   bytów naprawdę obejmuje**.

3. ⚠⚠ **KATALOG JEST HISTORIĄ, NIE GRANICĄ** (U-1). Podział plików powstał,
   zanim istniało pojęcie domeny — więc 626 linii rysujących w świecie leży
   w katalogu interfejsu i **nic tego nie zgłasza**, bo dla kompilatora nie ma
   różnicy. ⛔ Ekstrakcja idąca po katalogach opisałaby ten plik jako `ui`.

4. ⚠ **TRZY PRZECIWNE REGUŁY SĄ SPÓJNE DOPIERO WIDZIANE RAZEM** (U-6). „Odmowa
   widoczna z powodem", „wyszarzone milczy" i „niedostępne pytanie jest ukryte"
   każda z osobna wygląda na wyjątek od pozostałych. ⭐ Dopiero zestawione
   pokazują **jedną zasadę i trzy kanały**: powód dla oka, cisza dla ucha,
   ukrycie dla wiedzy.

⚙ **Co zadziałało:** rozstrzygnięcie granicy **czasem życia** zamiast
widocznością *(to ono wyrzuciło jeden plik z domeny)*, policzenie **wymiarów
przycisków** zamiast zaufania regule, oraz sprawdzenie kontraktu **liczbą
obejść** — zero jest wynikiem mocniejszym niż jakikolwiek opis.

---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena inventory
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Inventory.ts, src/core/Equipment.ts]
otwarte: [OI-58, OI-59, OI-60]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `inventory`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/inventory.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | dwa pojemniki i granica między nimi · pojemność wyliczana z toreb · odmowa zmniejszenia i zakaz auto-reorganizacji · reguła stosu · trzy wyniki przenoszenia · kolejność przy zakładaniu · **dwie polityki pełnego plecaka** · co waży · odtworzenie stanu |
| **oddaje** | czym przedmiot **jest** → `items` · co **robi** obciążenie → `stamina` (OI-17), `movement` (OI-48) · ceny → `economy` · kształt zapisu → `save` · siatka i gesty → `ui`, `input` |
| **NIE opisze** | żadnego przedmiotu, torby ani slotu z osobna · cen · czy 16 slotów i sufit to dobre liczby |

⚠ **Granica z `items` sprawdzona, nie założona.** Test brzmiał: **ile
właściwości przedmiotu ta domena musi znać, żeby działać?** Odpowiedź z kodu —
**cztery**: typ *(czy się stakuje)*, jakość i trwałość *(czy wolno łączyć)* oraz
pojemność torby. ⭐ Wszystko inne — waga jako liczba, wymagania, obrona, jakość
jako mnożnik — jest **przekazywane dalej, nie czytane**. Tyle wystarczy, żeby
`STAN` nie powtórzył ani jednej reguły z `items`.

⚠ **Druga granica, mniej oczywista: „co waży" należy tu, „co waga robi" nie.**
Ta domena podaje sumę i klasę; ⛔ pytanie, czego klasa dotyka, jest **otwarte od
`stamina`** (OI-17) i nie wolno go rozstrzygnąć przy okazji.

⭐ **Dwunasta domena z rzędu z planem cięcia**, pod limitem bez rundy skracania
(17,0 KB).

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | 10 slotów lalki + 4 sloty toreb · baza 16 + torby · odmowa zamiast reorganizacji · stos po jakości · dwie polityki pełnego plecaka · waży wyłącznie założone · unia kształtów zapisanego slotu |
| **INTENDED** | ⛔ **nic w tej domenie** — ⚠ ale trzy pozycje z listy „czego świadomie NIE MA" **zostały już zbudowane** i nadal tam stoją (`OI-60`) |
| **HISTORICAL** | plecak o stałej pojemności 16 · slot jako sama nazwa przedmiotu *(dziś czytany wyłącznie ze starych zapisów)* · przedmiot startowy w plecaku *(dziś daje go zadanie)* |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **P-1** | pełny plecak jest obsłużony | ⛔ **w przypadku POŚREDNIM nie jest**: gdy mieści się część stosu z ziemi, wchodzi tyle, ile wejdzie, a **całe znalezisko jest kasowane**. Ścieżki „wszystko wchodzi" i „nic nie wchodzi" są poprawne | ⛔⛔ najwyższa → `OI-58` |
| **P-2** | „sufit, którego podnoszenie pojemności **nigdy nie przekroczy**" | ⛔ **funkcja podnosząca pojemność tej liczby NIE ZNA.** Jedynym czytelnikiem jest **panel**, który buduje tyle kafli. Sufit trzyma się **arytmetyką zawartości**: cztery sloty × największa torba + baza dają dokładnie tę liczbę | ⛔ wysoka → `OI-59`. ⭐ Reguła zapisana jako **liczba**, pilnowana przez **zbieg okoliczności danych** |
| **P-3** | lista „czego świadomie NIE MA" | ⛔ **trzy z dziesięciu pozycji ZBUDOWANE**: sloty na torby, waga i obciążenie, wysiłek. ⚠ Przy wadze nieaktualne jest też **uzasadnienie** („dotyka prędkości gracza") — nie dotyka (OI-48) | ⛔ wysoka → `OI-60`. ⚠ **Lista barierek starzeje się w najgorszą stronę** |
| **P-4** | komentarz przy gotowaniu: „sprawdź miejsce **ZANIM** zużyjesz surowiec" | ⚙ **kod robi coś innego i też poprawnego**: zużywa, próbuje dodać, a przy niepowodzeniu **cofa**. Wynik jest ten sam *(nic nie ginie)*, mechanizm inny niż nazwany | ⚠ średnia — ⭐ **komentarz kłamiący o MECHANIZMIE, nie o wyniku**: test wyniku go nie złapie |
| **P-5** | niezmiennik: „plecak, dodatkowe plecaki **i skrzynia** nie ważą" | ⛔ **skrzyni nie ma** — słowo istnieje w kodzie wyłącznie jako identyfikator tematu rozmowy | ⚠ niska — reguła **legislująca dla niezbudowanego**; czyta się jako dowód, że skrzynia istnieje |
| **P-6** | komentarz: obciążenie dotyka „**DOKŁADNIE DWÓCH** rzeczy" | ⚙ mnożnik obciążenia ma **trzech** czytelników: koszt uniku, koszt sprintu i premię do szansy uniku przy klasie lekkiej | ⛔ **NIE ROZSTRZYGAM — to jest `OI-17`**, otwarte od `stamina`. Odnotowane wyłącznie jako potwierdzenie pomiaru |
| **P-7** | **milczenie** — nigdzie nie opisano, że polityki pełnego plecaka są **DWIE** | zobowiązanie *(nagroda, zakup)* sprawdza z góry i odmawia w całości; znalezisko *(łup, zbieractwo)* przyjmuje częściowo | ⚠ średnia — ⚙ podział jest **konsekwentny i sensowny**, po prostu nienazwany |
| **P-8** | **milczenie** — nigdzie nie opisano, że pytania o miejsce są **DWA** | „czy zmieści się N **tego**" dolicza istniejące stosy; „ile jest **pustych**" odpowiada na „czy zmieszczą się dwie **różne** rzeczy". ⛔ Dwa pytania pierwszego rodzaju liczą ten sam slot dwa razy | ⚠ średnia — opisane w kodzie, **nieobecne w dokumentacji** |
| **P-9** | dokument cytuje nazwę sumy wag | ⚙ nazwa w dokumencie **nie istnieje w kodzie** *(suma nazywa się inaczej)*; reguła, którą opisuje, jest prawdziwa | ⚠ niska — nazwa, nie treść |

⚠ **Profil domeny: jedna realna dziura zachowania, jeden sufit bez strażnika,
jedna nieaktualna lista barierek i cztery milczenia.** ⚙ Zero sprzeczności
między kodem a żywym `STAN`-em sąsiedniej domeny.

---

## 4. Pomiary

**Metoda:** zliczenie wprost ze źródeł — listy slotów, roster toreb, wszystkie
miejsca dotykające plecaka; polityki policzone po **konsumentach**, nie po
nazwach funkcji.

| pomiar | wynik |
|---|---|
| sloty lalki | **10** |
| sloty toreb | **4** *(poza listą lalki)* |
| pojemność bazowa | **16** |
| roster toreb | **4** — pojemności **2 · 4 · 6 · 8** |
| deklarowany sufit | **48** = 16 + 4 × 8 — ⚙ **dokładnie**, bez zapasu |
| ⛔ czytelnicy sufitu w **modelu** | **0** |
| czytelnicy sufitu w **interfejsie** | **1** *(liczba budowanych kafli)* |
| typy przedmiotu, które **nie** stakują się | **4 z 7** *(broń, pancerz, amulet, torba)* |
| pliki konsumujące plecak | **19** |
| polityki pełnego plecaka | **2** — ⚙ „sprawdź z góry" w **4** miejscach, „przyjmij ile wejdzie" w **3** |
| ścieżki, w których pełny plecak **coś kasuje** | **1** → `P-1` |
| przymiary dotykające tego stanu | **1** *(arytmetyka cofnięcia w sklepie)* |
| ⛔ przymiary reguł **pojemności i toreb** | **0** |

**Co z tego wynika:**

1. ⚠⚠ **Sufit jest prawdziwy przez ZBIEG OKOLICZNOŚCI, nie przez regułę.**
   Cztery sloty razy największa torba plus baza dają **dokładnie** deklarowaną
   liczbę — ⛔ jedna torba o pojemności większej niż największa istniejąca
   przesuwa granicę, nie zapalając niczego.
2. ⭐ **Podział polityk pełnego plecaka jest konsekwentny w siedmiu miejscach
   na siedem** i pokrywa się z jedną linią: **czy po drugiej stronie stoi
   zobowiązanie**. Wyjątkiem nie jest żadne z nich — wyjątkiem jest `P-1`,
   które **nie jest inną polityką, tylko luką w tej samej**.
3. ⚠ **Najlepiej opisana część tej domeny nie ma ani jednego przymiaru.**
   Odmowa zdjęcia torby, zakaz reorganizacji i trzy wyniki przenoszenia są
   udokumentowane w kodzie w szczegółach — i **nic ich nie sprawdza**.

⛔ **Nie oceniam, czy 16 slotów i cztery torby to dobre liczby** — ceny toreb są
jawnie szkicem. To jest opis, nie werdykt.

---

## 5. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **`N-13`: slot istnieje dopiero wraz z przedmiotem** | ✅ **zostaje w `items`** — to reguła o **modelu danych przedmiotu**, nie o pojemniku. ⚙ W `STAN` wyłącznie jako odesłanie w checkliście; ⛔ nie kopiowana |
| **torby i pojemność** | ✅ potwierdzone co do liczb — ⚠ z **niezapowiedzianym znaleziskiem**: sufit nie jest egzekwowany (`P-2`) |
| **zachowanie przy pełnym plecaku** | ✅ realne i **bogatsze niż depozyt**: nie jedna reguła, tylko **dwie polityki** (`P-7`) — ⛔ plus jedna luka (`P-1`) |
| **unia kształtów przedmiotu w zapisie** | ✅ potwierdzona: sama nazwa **albo** pełny egzemplarz; pierwsza odtwarza się jako sztuka zwykła i nienaruszona. ⭐ To jest miejsce, w którym obietnica **„nic, co gracz już ma, nie staje się gorsze"** faktycznie się wykonuje — depozyt z `save` **odebrany** |
| **`OI-48`: obciążenie mnoży koszty, nie prędkość** | ⚙ **przyjęty i NIEROZSTRZYGANY.** Ta domena odpowiada wyłącznie za **sumę i klasę**; czego klasa dotyka, zostaje otwarte (`OI-17`, `OI-48`) — ⚠ pomiar potwierdza **trzech** czytelników mnożnika (`P-6`) |
| **próg przeciągnięcia i jego właściciel** | ⚙ **zostaje w `input`** (`OI-54`). ⚠ Sprawdzone: to jest reguła **wejścia**, nie pojemnika — plecak nie wie, jakim gestem przyszła prośba o przeniesienie |
| **zależności `save` / `items` / `stamina` / `movement` / `economy`** | ✅ wszystkie pięć realne i opisane w §0.1 `STAN`-u; ⛔ żadna nie wciągnęła do tej domeny cudzej reguły |

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| założone nie jest w plecaku; lalka to warstwa | 🆕 **N-174** |
| sloty toreb poza listą lalki | 🆕 **N-175** — ⚙ depozyt z `inventory_scroll_ux.md` §3/§9, potwierdzony i **uzasadniony na nowo** |
| slot adresuje egzemplarz; szybki slot trzyma nazwę | 🆕 **N-176** |
| pojemność wyliczana, nigdy przypisywana | 🆕 **N-177** |
| zero auto-reorganizacji | 🆕 **N-178** — ⭐ **przyczyna, dla której odmowa w ogóle istnieje** |
| odmowa mówi, ile brakuje | 🆕 **N-179** |
| stos wymaga tej samej jakości i braku trwałości | 🆕 **N-180** |
| zdjęte wraca tym samym egzemplarzem | 🆕 **N-181** |
| wymagania przed wyjęciem z plecaka | 🆕 **N-182** |
| zobowiązanie z góry, znalezisko częściowo | 🆕 **N-183** (P-7) |
| pojemność przy wczytaniu tylko rośnie | 🆕 **N-184** |
| akcję wolno odmówić, stanu nie wolno skasować | 🆕 **N-185** — ⚠ **depozyt z `save`**, potwierdzony na drugim mechanizmie *(tolerancja pełnego plecaka przy dwuręczności)* |
| slot dopiero wraz z przedmiotem (`N-13`) | ➡ **ZOSTAJE** w `items` |
| waga jako liczba, wymagania, jakość, trwałość | ➡ **ZOSTAJĄ** w `items` |
| co robi klasa obciążenia | ⛔ **OTWARTE** w `stamina` (`OI-17`) i `movement` (`OI-48`) — nierozstrzygane |
| sufit pojemności | ⛔ **OTWARTY** → `OI-59` |
| co się dzieje z resztą znaleziska | ⛔ **OTWARTE** → `OI-58` |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **DZIURA MIEŚCIŁA SIĘ MIĘDZY DWOMA POPRAWNYMI PRZYPADKAMI BRZEGOWYMI**
   (P-1). „Wszystko wchodzi" działa, „nic nie wchodzi" działa i **ma nawet
   własny komentarz**. Procedura sprawdzająca warunki brzegowe po kolei znajduje
   dwa poprawne i uznaje sprawę za zamkniętą. ⛔ Trzeba było **policzyć trzeci
   przypadek**, którego nikt nie nazwał: *część wchodzi*. ⭐ Krok do procedury:
   **przy każdej odmowie zapytaj, czy istnieje stan POŁOWICZNY** — i sprawdź go
   osobno, bo nie jest średnią dwóch pozostałych.

2. ⚠⚠ **LICZBA MOŻE BYĆ PRAWDZIWA I NIEPILNOWANA — a wtedy pilnuje jej
   ZAWARTOŚĆ** (P-2). Sufit zgadza się co do jedności, więc każdy test wypada
   zielono; trzyma go arytmetyka rosteru toreb, a nie żadna reguła. ⚙ Nowy
   wariant znanej lekcji: dotąd „reguła zapisana jako liczba umiera po cichu"
   znaczyła **liczba się rozjeżdża**; tutaj **liczba się zgadza i to jest
   przypadek**.

3. ⚠⚠ **LISTA BARIEREK STARZEJE SIĘ W NAJGORSZĄ STRONĘ** (P-3). „Czego
   świadomie NIE MA" czyta się po to, żeby **nie proponować rzeczy
   odrzuconych** — więc jej nieaktualność nie powoduje błędu, tylko
   **powstrzymuje przed czymś, co już stoi**. ⛔ Trzy z dziesięciu pozycji
   bronią dziś pokojów, które są zbudowane. ⚠ Zwykły przegląd tego nie łapie,
   bo taka lista **wygląda na ponadczasową**.

4. ⚠ **KOMENTARZ KŁAMIĄCY O MECHANIZMIE JEST GORSZY OD KŁAMIĄCEGO O WYNIKU**
   (P-4). „Sprawdź, zanim zużyjesz" opisuje strategię, której nie ma; kod
   **zużywa i cofa**, a wynik jest identyczny. ⛔ Żaden test wyniku tego nie
   zgłosi, a następna sesja skopiuje **nieistniejący wzorzec** do miejsca, gdzie
   cofnięcie nie będzie możliwe.

5. ⚠ **Reguła potrafi legislować dla rzeczy niezbudowanej** (P-5).
   Niezmiennik wagi wymienia **skrzynię**, której w grze nie ma. ⚙ Nieszkodliwe
   dla mechaniki, mylące dla czytelnika: wyliczenie trzech rzeczy czyta się jako
   dowód, że wszystkie trzy istnieją.

⚙ **Co zadziałało:** pytanie **„ile właściwości przedmiotu ta domena musi
znać"** jako test granicy z `items` (odpowiedź „cztery" rozstrzygnęła cały plan
cięcia), zliczenie polityk **po konsumentach** zamiast po nazwach funkcji, oraz
sprawdzenie **trzeciego** przypadku tam, gdzie kod nazwał dwa.

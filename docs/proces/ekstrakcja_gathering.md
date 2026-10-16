---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena gathering
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Gathering.ts, src/world/NodeSpawner.ts]
otwarte: [OI-61, OI-62, OI-63]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `gathering`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/gathering.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | stanowisko ≠ roślina · reguła „więcej stanowisk niż roślin" · dwa mechanizmy odrostu · zakładka po tożsamości · brak zapisu = pełno · kolejność zebrania · odkrycie gatunku · **czego zbieranie nie wymaga i nie robi** · komplet gatunku |
| **oddaje** | gdzie stoją stanowiska → `world` · jakie gatunki istnieją i ile są warte → `items`, `economy` · przyjęcie przedmiotu → `inventory` · wywołanie interakcji → `input` · cel „zbierz N" i wiedza o roślinie → `quests` |
| **NIE opisze** | żadnego zioła, stanowiska ani receptury · gdzie wolno postawić punkt · czy udział zajętych stanowisk i czasy odrostu są dobre |

⚠ **Granica sprawdzona, nie założona.** Test: **ile ta domena musi wiedzieć
o gatunku?** Odpowiedź z kodu — **dwie liczby**: czas odrostu i długość listy
stanowisk. ⭐ Nazwa gatunku jest dla niej **nieprzezroczystym ciągiem znaków**,
więc ten sam mechanizm obsłuży stos drewna bez jednej zmiany. To rozstrzygnęło
cały plan cięcia: wszystko, co wymagałoby znajomości **gatunku**, wypadło poza
domenę.

⚠ **Druga granica, przeciwna do oczekiwanej:** `progression` i `effects` miały
tu coś dostać. ⛔ **Nie dostały nic** — i to jest ustalenie, nie luka w opisie
(§3, `G-3`).

⭐ **Trzynasta domena z rzędu z planem cięcia**, pod limitem i **poniżej progu
ostrzeżenia** (15,7 KB) — pierwszy raz w serii.

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | pula stanowisk z udziałem zajętych · jeden zegar na gatunek · arytmetyka odrostu przy wejściu · zakładka po tożsamości · zegar ścienny · odkrycie gatunku · zero bramek rozwoju |
| **INTENDED** | ⚠ **generowanie flory i zadania „znajdź zioło z wilgotnego miejsca"** — zapowiedziane wprost przy rosterze jako powód, dla którego opisy siedlisk są precyzyjne. ⛔ Zero kodu |
| **HISTORICAL** | zakładka jako sama **liczba** *(przez którą nietknięta roślina „teleportowała się" po przejściu portalem)* · roster pięciu gatunków przed domknięciem na jedenastu |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **G-1** | roster gatunków został **domknięty na jedenastu** | ⛔ **domknięty w JEDNYM z czterech miejsc.** Zmierzone na żywej konfiguracji: gatunków **11**, wpisów przedmiotu **5**, duszków **11**, stanowisk na mapach **128**. Sześć gatunków **rośnie, świeci i jest poprawnie nazwanych przez przycisk**, a ich zebranie sięga po nieistniejący wpis przedmiotu — odtworzone: `TypeError` | ⛔⛔ najwyższa → `OI-61`. ⚙ **To jest brakująca ZAWARTOŚĆ, nie wada systemu** |
| **G-2** | zakładka odrostu opisuje stan mapy | ⛔ **opisuje stan z chwili OSTATNIEGO WYJŚCIA.** Zebranie jej nie aktualizuje — jedynym miejscem zapisu jest zatrzymanie sesji gatunku przy rozbiórce sceny. Wyjście z gry bez zmiany mapy zostawia w zapisie **poprzednią** listę stanowisk | ⚠⚠ wysoka → `OI-62` |
| **G-3** | **depozyt tej misji: „Zielarstwo jako bramka z `progression`"** | ⛔ **umiejętność o tej nazwie NIE ISTNIEJE.** Jedenaście umiejętności w grze, żadna tak się nie nazywa; ognisko wymaga **pieczenia**. Jedyne wystąpienie słowa w `src/` to **komentarz z przykładem podpisu**, którego gra nigdy nie pokaże | ⛔ wysoka — ⚠⚠ **depozyt był fałszywy i pochodził ode mnie**: zacytowałem ten komentarz przy ekstrakcji `input`. Patrz §7.3 |
| **G-4** | każdy gatunek ma własny **rozrzut** czasu odrostu | ⛔ **zero czytelników.** Pole jest zadeklarowane dla wszystkich jedenastu *(wartości 20–45 s)*; realny rozrzut to **stała 0–1000 ms doklejona do interwału sprawdzania**, wspólna dla wszystkich gatunków | ⚠ średnia — ⭐ **jedenaście różnych liczb obiecujących mechanikę per gatunek, której nie ma** |
| **G-5** | **milczenie o nieistnieniu** — nigdzie nie zapisano, czego zbieranie **nie** wymaga | brak umiejętności, progu poziomu, atrybutu, narzędzia, szansy niepowodzenia, plonu większego niż jeden i **jakiegokolwiek efektu czasowego** *(mimo pokrzywy w rosterze)* | ⚠ średnia — ⚙ wypisane wprost w `STAN` §5, bo **brak mechaniki nie zostawia śladu w kodzie** |
| **G-6** | odkrycie gatunku coś odblokowuje | ⚙ **dla pięciu z jedenastu.** Dla pozostałych sześciu zapisuje się do zapisu flagę, której **nikt nie czyta** | ⚠ niska — ta sama przyczyna co `G-1` |
| **G-7** | zbieractwo jest na mapach | ⚙ **jedna z trzech map nie ma ANI JEDNEGO stanowiska**. To legalny stan *(mapa bez zbieractwa)*, ale nigdzie nieodnotowany | ⚙ **nie rozjazd** — odnotowane, bo wygląda na przeoczenie, a jest po prostu niezapełnioną mapą |
| **G-8** | komentarze w tej domenie | ✅ **wszystkie prawdziwe co do joty** — łącznie z tym, który opisuje **własną historię** (zakładka jako liczba i „teleportująca się" roślina) i z tym, który tłumaczy, dlaczego roślina nie ma ciała fizycznego | ⚙ **zgodne** — druga domena w serii bez ani jednego fałszywego komentarza |
| **G-9** | siedlisko decyduje, gdzie wolno postawić stanowisko | ⚙ prawda jako **reguła dla autora** — ⛔ **nic jej nie sprawdza**: 128 stanowisk, zero porównań z opisem siedliska | ⚠ niska → `OI-63` |

⚠ **Profil domeny: jeden brak zawartości o skutku wykonawczym, jedna dziura
w zapisie, jeden fałszywy depozyt i cztery milczenia.** ⚙ **Zero rozjazdów
kod ↔ komentarz** — cały mechanizm jest opisany dokładnie tak, jak działa.

---

## 4. Pomiary

**Metoda:** roster i stałe odczytane z **uruchomionej konfiguracji**
*(`esbuild` → import w Node)*, stanowiska policzone **z plików map**, pułapy
przeliczone **tą samą arytmetyką co kod**.

| pomiar | wynik |
|---|---|
| gatunki w rosterze | **11** |
| ⛔ **z wpisem przedmiotu** | **5** |
| z duszkiem | **11** |
| stanowiska łącznie | **128** |
| — las | **72** *(10 gatunków; bez rumianku)* |
| — wioska | **56** *(5 gatunków, wyłącznie pierwotna piątka)* |
| — trzecia mapa | ⚙ **0** |
| roślin stojących naraz — las | **25** |
| roślin stojących naraz — wioska | **17** |
| udział zajętych stanowisk | **0,3** |
| czasy odrostu | **60–150 s** *(najszybszy chwast, najwolniejsze zioło z głębi lasu)* |
| ⛔ **czytelnicy pola „rozrzut"** | **0** |
| gatunki z konsumentem odkrycia | **5 z 11** |
| gatunki z celem zadania | **5 z 11** |
| zasięg zbierania vs rozmowy | **38 : 48** |
| ⛔ **przymiary tej domeny** | **0** |

**Co z tego wynika:**

1. ⚠⚠ **Sześć gatunków to dziś 30 stanowisk, które prowadzą do błędu.** ⚙ Nie
   są martwe — **rosną i zapraszają**, bo do wyrośnięcia wystarczy duszek
   i czas odrostu, a jedno i drugie mają.
2. ⭐ **Reguła „więcej stanowisk niż roślin" jest zrealizowana w praktyce, nie
   tylko w stałej**: 128 punktów daje 42 rośliny naraz, czyli **co trzeci
   punkt**. Autor map faktycznie postawił kilkukrotnie więcej, niż chce widzieć.
3. ⚠ **Roster rósł w trzech miejscach z czterech.** Sześć gatunków dodanych
   jednego dnia dostało definicje, duszki i stanowiska — ⛔ i **żadnego
   sygnału** o braku czwartego elementu, bo brak wpisu **nie jest błędem, tylko
   brakiem**.

⛔ **Nie oceniam, czy 0,3 i czasy odrostu są dobre** — to jest opis, nie
werdykt; ⚠ **nigdy nie były mierzone ręką**.

---

## 5. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **odrastanie jako wyjątek zapisywanego stanu świata** | ✅ potwierdzony — ⭐ i **uzasadniony na nowo**: to nie jest wyjątek „bo tak", tylko **krótka lista liczb czytana raz przy wejściu**. Kryterium z `save` („wolno, bo to krótka lista czytana raz") sprawdza się co do joty |
| **zbieractwo jako rodzina interakcji kontekstowej** | ✅ potwierdzony — ⚙ z uzupełnieniem: zbierana jest roślina **WSKAZANA**, nigdy najbliższa, i to jest reguła tej domeny, nie `input` |
| **polityka „przyjmij, ile wejdzie" z `inventory`** | ⚙ **doprecyzowany: tutaj obowiązuje ODMOWA, nie przyjęcie częściowe.** Zebranie daje **jedną sztukę**, więc „ile wejdzie" degeneruje się do „wejdzie albo nie" — a wtedy roślina **zostaje na stanowisku**. ⭐ To jest ta sama polityka w wyrodzonym przypadku, nie inna reguła |
| **Zielarstwo jako bramka z `progression`** | ⛔ **ODRZUCONY — takiej umiejętności nie ma** (`G-3`). ⚠ Zbieranie **nie ma żadnej bramki rozwoju**; ustalenie weszło do `STAN` §5 jako treść, nie jako brak |

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| stanowisko to uprawnienie, roślina byt chwilowy | 🆕 **N-186** |
| więcej stanowisk niż roślin | 🆕 **N-187** — ⭐ potwierdzone pomiarem (co trzeci punkt) |
| mapy bez gracza się nie symuluje | 🆕 **N-188** |
| zakładka po tożsamości, nie liczbie | 🆕 **N-189** — ⚙ powstała z realnego zgłoszenia z gry |
| losowy tylko nowy odrost | 🆕 **N-190** |
| brak zapisu = pełno | 🆕 **N-191** |
| zegar ścienny | 🆕 **N-192** |
| jeden zegar na gatunek | 🆕 **N-193** |
| stanowisko zwalniane przed animacją | 🆕 **N-194** — ⚙ ta sama reguła co przy śmierci przeciwnika |
| pełny plecak odmawia, roślina zostaje | 🆕 **N-195** — ⚠ **depozyt z `inventory` doprecyzowany** |
| odkrycie jednorazowe, z pola | 🆕 **N-196** |
| zero bramek rozwoju i skutków czasowych | 🆕 **N-197** (G-3, G-5) |
| gdzie wolno postawić stanowisko | ➡ **ZOSTAJE** dla `world` i autora map; tu tylko **wymóg zgodności** bez przymiaru |
| czasy odrostu i ceny gatunków | ➡ **ZOSTAJĄ** jako dane (`items`, `economy`) |
| komplet gatunku | ⛔ **OTWARTY** → `OI-61`, `OI-63` |
| zakładka przy zebraniu | ⛔ **OTWARTA** → `OI-62` |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **RZUTOWANIE TYPU WYŁĄCZA KOMPILATOR DOKŁADNIE TAM, GDZIE STYKAJĄ SIĘ
   DWIE DOMENY.** Identyfikator gatunku jest rzutowany na identyfikator
   przedmiotu jednym słowem — i to jedno słowo sprawia, że rozjazd **11 do 5**
   nie zapala ani kompilatora, ani żadnej bramki. ⭐ Krok do procedury: **każde
   rzutowanie identyfikatora z jednej domeny na identyfikator drugiej jest
   miejscem, w którym trzeba policzyć OBIE listy.**

2. ⚠⚠ **BRAK NIE JEST BŁĘDEM, WIĘC NIE ZOSTAWIA ŚLADU.** Sześć gatunków dodano
   jednego dnia w trzech miejscach z czterech; wszystkie trzy są udokumentowane
   *(roster, siedliska, katalog duszków)*, a czwarte nie zgłosiło się nigdzie,
   **bo nieobecny wpis nie generuje niczego**. ⛔ Jedynym sposobem znalezienia
   tego było **policzenie dwóch list obok siebie** — czynność, do której nic nie
   zachęca, dopóki się nie wie, że warto.

3. ⚠⚠ **DEPOZYT NIE JEST BEZPIECZNIEJSZY OD ŹRÓDŁA, Z KTÓREGO POWSTAŁ.**
   Depozyt „Zielarstwo jako bramka" **napisałem sam**, przy ekstrakcji `input`,
   cytując **przykład podpisu z komentarza**. ⛔ Przepisanie zdania do
   checkpointu nadało mu pozór ustalenia, choć nie było sprawdzone ani razu.
   ⭐ Wniosek jest ogólny: **reguła „nie ufaj komentarzom" obowiązuje także
   wtedy, gdy komentarz przenoszę ja** — i dlatego depozyt trzeba weryfikować
   w kodzie **odbiorcy**, a nie przyjmować jako ustalenie nadawcy.

4. ⚠ **LICZBA PER GATUNEK BEZ CZYTELNIKA OBIECUJE MECHANIKĘ** (G-4). Jedenaście
   różnych wartości rozrzutu wygląda jak strojenie per roślina; realny rozrzut
   jest jeden, wspólny i stały. ⚙ Nieszkodliwe dla gry, mylące przy każdej
   próbie strojenia — i **niewidoczne**, dopóki nie zapyta się o czytelników,
   a nie o wartości.

⚙ **Co zadziałało:** uruchomienie **żywej konfiguracji** zamiast czytania jej
wzrokiem *(to ono odtworzyło błąd)*, policzenie stanowisk **z plików map**
zamiast wierzenia opisom, i przeliczenie pułapów **tą samą arytmetyką co kod**
zamiast szacowania z udziału.

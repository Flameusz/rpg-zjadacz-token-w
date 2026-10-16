---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena assets
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Assets.ts, src/world/TreeStampManifest.ts]
otwarte: [OI-78, OI-79, OI-80]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `assets`

> **Po co ten plik.** Materiał dowodowy; treść poszła do
> `docs/systemy/assets.md`. ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — `assets` JEST domeną

⚙ **Sprawdzone tym samym testem, który wykluczył `performance`: czy ma stan,
właściciela i konsumenta.**

| pytanie | odpowiedź |
|---|---|
| **własny stan?** | ✅ **rejestr brakujących tekstur** — runtime, czyszczony i wypełniany przy każdym starcie, czytany przy budowie sceny |
| **własne reguły?** | ✅ trzy stopnie degradacji · „brakujący z istnienia, nie ze zdarzenia" · rozmiar klatki z rzeczywistych wymiarów · nazwany wpis zamiast współrzędnych |
| **producent → konsument?** | ✅ producent: narzędzia wytwórcze + loader; konsument: **wszystko, co rysuje** |
| **czy tylko obserwuje?** | ⛔ **nie** — **decyduje**, czy mapa w ogóle się zbuduje |

⭐ **Rozstrzygające: `assets` potrafi ZATRZYMAĆ budowę świata.** Brak arkusza
terenu **odmawia zbudowania mapy** — to nie jest obserwacja, to jest władza nad
przebiegiem gry.

### 1.1 Granica `world` ↔ `assets` — potwierdzona

⭐ **Reguła wyjściowa się broni: MAPA mówi CO i GDZIE, ASSET mówi CZYM.**
⚙ Dowód: **jeden arkusz obsługuje wiele map**, a **mapa działa z zastępnikiem**.

⚠⚠ **Własność kluczy — odpowiedź na pytanie misji** *(bez rozwiązywania
`OI-76`)*:

| klucz | właściciel | uzasadnienie z kodu |
|---|---|---|
| nazwa **obiektu** w mapie | **`world`** | tabele tłumaczeń stoją w warstwie świata |
| nazwa **tilesetu** w mapie | **`world`** | tabela wiążąca ją z kluczem tekstury stoi tam samo |
| **klucz tekstury** | **`assets`** | nadawany w rejestrze materiału, tłumaczony przez silnik |

⛔ **`assets` nie zawiera ANI JEDNEGO odwołania do mapy.** ⭐ Dlatego `OI-76`
jest otwarciem `world`, a nie tej domeny — a jego bliźniak po stronie tilesetu
zostaje tutaj jako `OI-78`.

---

## 2. Trzy depozyty z `world`

| depozyt | wynik |
|---|---|
| **warstwa drzew jako instancje** | ⚙ **rozdzielona na trzy części, każda u innego właściciela**: arkusz stempli → `assets`; **manifest** *(rozmiar komórki, kolumny, podział na pień i koronę)* → `assets`, bo powstaje razem z arkuszem; **renderowanie i sortowanie** → `world`. ⭐ Manifest jest **umową** i to jedyne miejsce, gdzie te domeny naprawdę się stykają |
| **odczyt warstw kafli / tilesetów** | ⚙ **należy do `world`** — to on wiąże nazwę tilesetu z kluczem tekstury, przyjmuje **dwie pisownie** *(edytor nazywa tileset po pliku)* i pomija nieznany z ostrzeżeniem. ⚠ `assets` dostarcza wyłącznie arkusz — **i jeden z nich jest nienegocjowalny** |
| **podwójna tabela nazw (`OI-76`)** | ✅ **własność rozstrzygnięta** *(§1.1)*, ⛔ **problem nierozwiązany zgodnie z misją**. ⚠ Znalazłem **bliźniaka**: nazwa tilesetu jest kluczem z dokładnie tą samą cechą — pomyłka daje **mapę wyglądającą na niedokończoną**, nie błąd (`OI-78`) |

---

## 3. Rozjazdy i decyzje

| # | twierdzenie | kod | waga · status |
|---|---|---|---|
| **A-1** | „brakujący plik po prostu degraduje" | ⛔ **nieprawda jako reguła OGÓLNA — są TRZY stopnie**: zastępnik, ciche pominięcie i **odmowa zbudowania mapy**. Zdanie krąży po komentarzach w formie jednostopniowej | ⚠⚠ wysoka — ⭐ **wyjątek jest policzony**: zastępnik ma inne wymiary, więc każdy indeks kafla wskazywałby śmieci |
| **A-2** | „brakujący" wykrywa się ze zdarzenia loadera | ⛔ **nie — z ISTNIENIA tekstury**, świadomie: zdarzenia potrafią przyjść **po** zbudowaniu sceny | ⚙ **decyzja zastana**, poprawna i zapisana |
| **A-3** | wycinek z arkusza jest bezpieczny | ⛔ **nie ma właściciela**: przeżył przebudowę arkusza i zaczął wskazywać inny fragment — **bez błędu i bez śladu** | ⛔ wysoka → `OI-80`. ⚠ Reguła istnieje **tylko w opisie materiału** |
| **A-4** | reguły materiału są w kodzie | ⚙ **część istnieje WYŁĄCZNIE w opisie**: układ katalogów, nazwy po angielsku, obowiązek załatania narzędzi po przeniesieniu pliku, zasady wyglądu | ⚙ **nie rozjazd** — ⭐ ale trzeba je **oznaczyć jako produkcyjne**, nie mechaniczne |
| **A-5** | ostrzeżenie silnika o rozmiarze arkusza | ⚙ **znane, policzone i zaakceptowane** — szerokość niepodzielna przez kafel, geometria mimo to poprawna | ⚙ **zgodne** — ostrzeżenie, nie błąd |
| **A-6** | **milczenie** — nigdzie nie zapisano, że **klucz bytu treściowego jest WYPROWADZANY** | przedmiot, zdolność i gatunek robią klucz z własnego identyfikatora | ⚠ średnia — ⭐ **z tego wynika, że nowy przedmiot nie potrzebuje wpisu w rejestrze grafik** |
| **A-7** | **milczenie** — nigdzie nie zapisano, że **manifest jest umową** | plik generowany niosący podział komórki, który **decyduje o porządku rysowania** | ⚠ średnia |

**Decyzje zastane** *(odczytane, nie moje)*: wykrywanie braku przez stan
zamiast zdarzenia · brak zastępnika dla gotowych kompozycji · nienegocjowalność
arkusza terenu · dopisywanie na końcu w narzędziach · dwie pisownie nazwy
tilesetu jako łata na zachowanie edytora.

---

## 4. Pomiary

| pomiar | wynik |
|---|---|
| wpisy rejestru materiału | **184** |
| — z kluczem tekstury | **166** |
| — wskazujące plik | **91** *(reszta: tekstury wytwarzane w locie i geometria cięcia)* |
| narzędzia wytwórcze | **62** |
| pliki **generowane** w `src/` | **1** *(manifest stempli)* |
| stopnie degradacji | **3** |
| ⛔ arkusze nienegocjowalne | **1** |
| odwołania do map w `assets` | ⛔ **0** |
| przymiary tej domeny | ⛔ **0** |
| rozmiar opisu materiału | **2 309** linii |

⭐ **Wniosek: to jest domena WYTWARZANA, nie rysowana.** Sześćdziesiąt dwa
narzędzia wobec dziewięćdziesięciu jeden plików oznacza, że **materiał jest
w większości wynikiem programu** — i stąd biorą się dwie reguły, których nie
miałby projekt z ręcznie malowanymi plikami: *wycinek bez właściciela* i *zakaz
ręcznej edycji pliku generowanego*.

---

## 5. Los niezmienników

| niezmiennik | los |
|---|---|
| odwołanie kluczem, nie ścieżką | 🆕 **N-249** |
| klucz wyprowadzany z identyfikatora | 🆕 **N-250** (A-6) |
| „brakujący" z istnienia tekstury | 🆕 **N-251** (A-2) |
| rozmiar klatki z rzeczywistych wymiarów | 🆕 **N-252** |
| trzy stopnie degradacji, stopień per byt | 🆕 **N-253** (A-1) |
| arkusz terenu nienegocjowalny | 🆕 **N-254** |
| nazwany wpis zamiast współrzędnych | 🆕 **N-255** (A-3) — ⛔ bez egzekutora |
| plik generowany nieedytowalny ręcznie | 🆕 **N-256** |
| manifest jako umowa; podział niesie porządek | 🆕 **N-257** (A-7) |
| `assets` nie zna map | 🆕 **N-258** |
| wiązanie nazwy mapy z kluczem | ➡ **ZOSTAJE** w `world` |
| rysowanie i sortowanie drzew | ➡ **ZOSTAJE** w `world` |
| zasady wyglądu | ➡ **ZOSTAJĄ** w kierunku artystycznym |
| reguły produkcji i nazewnictwa | ➡ **ZOSTAJĄ** w opisie materiału — ⚠ **oznaczone jako produkcyjne** |
| kompletność materiału · nazwa tilesetu · cięcie po współrzędnych | ⛔ **OTWARTE** → `OI-79`, `OI-78`, `OI-80` |

---

## 6. Czego procedura tu NIE złapała

1. ⚠⚠ **REGUŁA JEDNOSTOPNIOWA UKRYŁA MECHANIZM TRÓJSTOPNIOWY** (A-1).
   „Brakujący plik po prostu degraduje" powtarza się w komentarzach i w routerze
   projektu — i jest **prawdziwe w dwóch przypadkach na trzy**. ⛔ Trzeci
   *(odmowa zbudowania mapy)* jest **odwrotnością** tego zdania, a mimo to
   mieszka pod tym samym hasłem. ⭐ Krok do procedury: **przy każdej regule
   „zawsze X" policz PRZYPADKI, nie potwierdzenia.**

2. ⚠⚠ **REGUŁA ISTNIEJĄCA TYLKO W OPISIE JEST NIEODRÓŻNIALNA OD MECHANIKI —
   dopóki nie zapyta się o egzekutora** (A-3, A-4). Zakaz cięcia po
   współrzędnych brzmi jak reguła kodu, jest zdaniem w opisie materiału,
   a jego złamanie **już raz zaszło i nic tego nie zgłosiło**. ⚙ Rozdział
   *runtime / produkcja / dane / historia* trzeba **narzucić z zewnątrz** —
   sam tekst go nie ujawnia.

3. ⚠ **DOMENA WYTWARZANA MA REGUŁY, KTÓRYCH DOMENA RYSOWANA NIE MA.**
   Sześćdziesiąt dwa narzędzia zmieniają charakter pytań: nie „czy plik
   istnieje", tylko **„czy to, co wskazuję, nadal jest tym samym po
   regeneracji"**. ⛔ Ekstrakcja szukająca wyłącznie ładowania przegapiłaby obie
   reguły z §4.

4. ⚙ **Czego nie zweryfikowałem** *(kontekst na wyczerpaniu)*: pełnej treści
   opisu materiału **2 309 linii** — czytałem nagłówek i pułapki, nie całość;
   ⛔ nie sprawdzałem, **które z 91 ścieżek faktycznie istnieją na dysku** *(to
   jest dokładnie `OI-79`)*; ⛔ nie czytałem narzędzi wytwórczych poza tym, co
   deklaruje manifest.

⚙ **Co zadziałało:** ten sam test domeny co przy `performance` *(stan,
właściciel, konsument)* — tu dał odpowiedź **przeciwną**, i to na jednym
zdaniu: ⭐ **`assets` potrafi zatrzymać budowę świata, `performance` nie potrafi
niczego.**

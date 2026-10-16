---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena quests
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Quests.ts, src/core/Dialogue.ts]
otwarte: [OI-64, OI-65, OI-66]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `quests`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/quests.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — granica `quests` / `dialogue` / `world`

### 1.1 Kto co przechowuje — sprawdzone kodem

| pytanie | odpowiedź z kodu |
|---|---|
| stan zadania | `Quests` — status, etap, liczniki, zabójstwa, uzupełnienia |
| stan rozmowy | `Dialogue` — **jeden zbiór** zadanych pytań |
| warunki przejścia zadania | `Quests` |
| warunki odblokowania tematu | `Dialogue`, czytając `Quests` i `Gathering` |
| tekst tematów i powitań | **dane przy NPC-u**, nie w żadnym z singletonów |
| logika etapów | `Quests` |
| globalny zbiór zadanych pytań | `Dialogue` |
| gdzie NPC stoi | `world` *(punkt w mapie)* |

### 1.2 Rozstrzygnięcie

⭐ **Pytanie „czy `dialogue` jest częścią `quests`" okazało się źle
postawione** — obie odpowiedzi dają się obronić z kodu. Użyteczne pytanie
brzmi: **co rozciąłby rozdział?**

⚙ **Odpowiedź: JEDEN REKORD DANYCH.** `NpcDef` niesie naraz zadania, tematy,
powitania i rolę trenera. Rozdział domen przeciąłby **obiekt danych**, a nie
dwa systemy — i to jest argument rozstrzygający, a nie „są ze sobą powiązane".

⚠ **Zależność jest jednokierunkowa i to działa PRZECIW połączeniu**, nie za
nim: `Dialogue` importuje `Quests`, `Quests` nie importuje `Dialogue` ani razu.
⚙ Cel „porozmawiaj" zalicza **interfejs rozmowy**, nie warstwa pytań.

⛔ **Wynik: JEDNA domena — zgodnie z kontraktem, który już dziś mówi „zadania,
dialogi, NPC".** ⚠ Dowody za ewentualnym przyszłym rozdziałem są realne
i zebrane w `OI-64`; ⛔ **decyzji nie podejmuję** — lista domen rozszerza się
wyłącznie decyzją autora z dowodami.

⚠ **`world` nie dostaje nic poza miejscem.** Zmierzone: **zero** celów zadania
odwołuje się do mapy albo lokacji.

### 1.3 Plan cięcia

| | treść |
|---|---|
| **bierze** | dwie rodziny celów · etapy · przejścia „wszystko albo nic" · osłony przedmiotu z zadania · globalny zbiór pytań i trzy bramki · jedna wskazówka „co dalej" |
| **oddaje** | miejsce NPC-a → `world` · pojemność → `inventory` · XP i złoto → `progression`, `economy` · odkrycie gatunku → `gathering` · okno rozmowy → `ui` |
| **NIE opisze** | żadnego zadania, NPC-a, tematu, etapu ani nagrody · kolejności fabularnej · ilości zawartości |

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | trzy statusy · dwie rodziny celów · etapy liniowe z automatycznym przejściem · „wszystko albo nic" · dwie osłony przedmiotu + jedno uzupełnienie · globalny zbiór pytań z trzema bramkami · jedna wskazówka |
| **INTENDED** | ⚠ **oddawanie u kogoś innego niż dawca** — mechanika, routing i wymagany parametr istnieją, **zero zadań tego używa** (`Q-5`) · ⚠ łańcuchy społeczne, pod które powstały etapy: dziś **jedno** zadanie na dwa etapy (`Q-6`) |
| **HISTORICAL** | zadanie jako płaska lista celów *(dziś opakowana w jeden domyślny etap)* · przedmiot startowy w plecaku zamiast wręczany przez zadanie · oddanie pilnowane wyłącznie tym, że panel listuje zadania po dawcy |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **Q-1** | `dialogue` to część `quests`, bo „zadania i rozmowy są powiązane" | ⚙ **wniosek trafny, uzasadnienie nie.** Rozstrzyga **wspólny rekord NPC-a**, a nie powiązanie mechanik; zależność mechanik jest **jednokierunkowa** i sama w sobie przemawiałaby za rozdziałem | ⚙ **nie rozjazd, doprecyzowanie** → `OI-64` |
| **Q-2** | router projektu: „**14 zadań u dziewięciu dawców** · **68 tematów** rozmów" | ⛔ zmierzone: **15 zadań**, **10 dawców**, **73 tematy** | ⚠ średnia — ⚠⚠ **to jest plik ładowany W CAŁOŚCI co sesję**, więc jego liczby czyta każdy agent, zanim cokolwiek sprawdzi. ⛔ Nienaprawione: poza zakresem tej misji |
| **Q-3** | **milczenie** — nigdzie w `docs/` nie opisano, że cele dzielą się na **dwie rodziny** | podział *(wyprowadzany / zatrzaskiwany)* żyje wyłącznie w komentarzu kodu, a decyduje o **odwracalności postępu** i o tym, że zabicie elity przed zadaniem go nie domyka | ⚠⚠ wysoka — najważniejsza reguła tej domeny **nie miała dokumentu** |
| **Q-4** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **żaden cel nie odwołuje się do miejsca** | zmierzone: 21 celów, cztery rodzaje, **zero** wskazujących mapę albo lokację; najbliższym jest „porozmawiaj" | ⚠ średnia — brak celu „idź tam" **wygląda na przeoczenie**, a jest granicą wobec `world` |
| **Q-5** | oddawanie u kogoś innego niż dawca „istnieje" | ⚙ **istnieje w mechanice, nie w treści**: parametr wymagany przez kompilator, routing rozdziela „u kogo wziąć" od „u kogo oddać", marker to czyta — a **0 z 15** zadań ustawia to pole | ⚙ **nie rozjazd** — ⭐ **głębia przed zawartością jest przyjętym kosztem projektu, nie dryfem**; odnotowane, bo znaczy, że **reguła nigdy nie została wykonana** |
| **Q-6** | etapy są mechanizmem zadań | ⚙ **1 z 15** zadań ma etapy *(dwa)*. Maszyneria — indeks etapu, zbiór wydanych nagród, **dwa osobne pola zapisu**, strażnik re-entrancji — obsługuje **jedno zadanie** | ⚙ j.w., ta sama klasa co `Q-5` |
| **Q-7** | treść zadań i rozmów jest spójna | ✅ **jest — i to zmierzone**: zero wiszących odwołań w **56 bramkach** *(45 łańcuchowych, 6 zadaniowych, 5 gatunkowych)*, wszystkie **73 tematy** i **15 zadań** osiągalne, zero celów wskazujących nieistniejący byt | ⛔ **ale nic tego nie sprawdza** → `OI-65`. ⚠ Awaria jest cicha: literówka ukrywa temat **na zawsze** |
| **Q-8** | „porozmawiaj" znaczy rozmowę | ⚙ zalicza się przy **otwarciu okna**; wystarczy otworzyć i zamknąć | ⚠ niska → `OI-66` — poprawne dla dzisiejszej treści, **nigdzie nie zapisane jako decyzja** |
| **Q-9** | strażnik re-entrancji | ✅ istnieje i jest opisany — ⭐ **znaleziony na żywo, nie w przeglądzie**, a zgłoszenie brzmiało **„żółte tło przy wręczaniu"** | ⚙ **zgodne** — patrz §7.3 |

⚠ **Profil domeny: jedno milczenie o najważniejszej regule, jedno o
nieistnieniu, jeden rozjazd liczbowy w routerze i dwa przypadki „mechanika
gotowa, treść pusta".** ⚙ **Zero sprzeczności kod ↔ komentarz** — trzecia
domena z rzędu.

---

## 4. Pomiary

**Metoda:** roster i wszystkie odwołania policzone skryptem na **uruchomionej
konfiguracji**; osiągalność zadań i tematów rozwiązana jako **domknięcie
przechodnie** bramek, nie oceniona wzrokiem.

| pomiar | wynik |
|---|---|
| zadania | **15** |
| dawcy | **10** |
| celów łącznie | **21** — zbierz **10** · porozmawiaj **5** · ubij **4** · załóż **2** |
| ⛔ celów wskazujących **miejsce** | **0** |
| zadania z warunkiem wstępnym *(inne zadanie)* | **11 z 15** |
| zadania z warunkiem *(umiejętność)* | **2** |
| zadania z etapami | **1** *(2 etapy)* |
| zadania z wręczanym zestawem | **2** *(+1 nagroda etapu)* |
| ⛔ zadania z **własnym miejscem oddania** | **0** |
| nagrody | XP **15** · złoto **10** · przedmiot **5** · pustych **0** |
| NPC | **19** — z tematami **19**, z zadaniami **10**, trenerów **2** |
| tematy rozmów | **73** |
| bramki tematów | łańcuchowe **45** · zadaniowe **6** · gatunkowe **5** |
| najgłębszy łańcuch rozmowy | **6 ogniw** |
| ⛔ **wiszące odwołania** *(łącznie, wszystkie rodzaje)* | **0** |
| tematy i zadania **nieosiągalne** | **0** |
| pola zapisu tej domeny | **7** *(6 zadaniowych + zbiór pytań)* |
| pliki czytające stan zadań | **16** |
| przymiary tej domeny | **1** *(wskazówka „co dalej")* |

**Co z tego wynika:**

1. ⭐ **Zawartość jest w pełni spójna i w pełni nieweryfikowana.** 56 bramek
   utrzymywanych ręką, zero błędów — ⚠ i **zero mechanizmów, które by to
   utrzymały** przy następnym dopisaniu.
2. ⚠ **Rozmowa jest większą częścią tej domeny niż zadania**: 73 tematy wobec
   21 celów. ⚙ Jednocześnie ma **jedno pole stanu**, a zadania sześć — czyli
   objętość zawartości i objętość mechaniki idą tu **w przeciwne strony**.
3. ⚙ **Struktura zadań jest silnie liniowa**: 11 z 15 ma warunek wstępny,
   a najgłębszy łańcuch rozmowy ma 6 ogniw. ⭐ To potwierdza pomiarem decyzję
   „etapy są listą, nie grafem".

⛔ **Nie oceniam, czy 15 zadań i 73 tematy to dużo** — to jest ilość zawartości,
nie mechanika.

---

## 5. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **cel „zbierz N" z `gathering`** | ✅ realny — ⚙ i **wyprowadzany**: postęp czytany na żywo z plecaka, więc sprzedaż ziół **cofa** cel. Ta rodzina celów okazała się treścią, której nie miał żaden dokument (`Q-3`) |
| **odkrycie gatunku jako warunek rozmowy** | ✅ potwierdzony co do joty — ⭐ **jedyna bramka opisująca coś zrobionego w ŚWIECIE**, nie powiedzianego; 5 tematów |
| **nagroda sprawdza miejsce z góry i odmawia w całości** (`inventory` N-183) | ✅ potwierdzony i **szerszy, niż mówił depozyt**: ta sama reguła obowiązuje **nagrodę etapu**, a tam ma dodatkowy kształt — krok **czeka** („spełniony, jeszcze nie wypłacony") i ponawia próbę przy zwolnieniu miejsca, zamiast po prostu odmówić |
| **przedmiot z zadania uzupełniany przez dawcę** | ✅ realny — ⚙ z dwoma sprostowaniami: to jest **trzecia** warstwa ochrony, nie pierwsza *(przed nią stoją zakaz sprzedaży i rezerwacja pod cel)*, i liczy również **to, co gracz ma na sobie** |
| **etapy zadań** | ✅ realne — ⚠ z pomiarem, którego depozyt nie niósł: **1 z 15** zadań (`Q-6`) |
| **globalny zbiór zadanych pytań** | ✅ potwierdzony; ⚙ globalność jest **mechanizmem, nie oszczędnością** — pozwala wiedzy wędrować między postaciami |
| **zależności `progression`/`economy`** | ✅ jednokierunkowe: zadanie **wypłaca** XP i złoto, nic stamtąd nie czyta |
| **`save`** | ✅ **siedem pól**, wszystkie opcjonalne poza statusem — zgodnie z regułą addytywną (`save`) |
| **`inventory`** | ✅ trzy różne punkty styku: wręczenie, oddanie, **zakaz sprzedaży** |
| **`gathering`** | ✅ w obie strony: cel „zbierz" czyta plecak, bramka tematu czyta odkrycie |
| **`dialogue`** | ⚙ **jedna domena** — uzasadnienie w §1.2, dowody za rozdziałem w `OI-64` |
| **`world`** | ⚠ **niemal pusty styk**: wyłącznie miejsce, w którym NPC stoi. ⭐ W drugą stronę jest ciekawiej — **stan zadań decyduje, czy elita w ogóle się pojawi** |

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| dwie rodziny celów | 🆕 **N-198** (Q-3) |
| zatrzask tylko przy aktywnym zadaniu | 🆕 **N-199** |
| etapy listą, nie grafem | 🆕 **N-200** |
| etap po identyfikatorze | 🆕 **N-201** |
| „nagroda etapu wydana" jako osobny fakt | 🆕 **N-202** |
| strażnik re-entrancji | 🆕 **N-203** (Q-9) |
| wszystko albo nic | 🆕 **N-204** — ⚙ **depozyt z `inventory` (N-183) potwierdzony i rozszerzony** |
| nic wręczanego nie przepada | 🆕 **N-205** |
| warunek wstępny bramkuje wzięcie | 🆕 **N-206** |
| oddanie u właściwej osoby | 🆕 **N-207** — ⚠ zero zadań to ćwiczy (Q-5) |
| niesprzedawalność + jedno uzupełnienie | 🆕 **N-208** |
| globalny zbiór pytań | 🆕 **N-209** |
| ukrywanie zamiast wyszarzania | 🆕 **N-210** — ⚙ **świadoma odwrotność reguły `ui`** dla przycisków |
| jedna wskazówka, jeden odczyt | 🆕 **N-211** |
| czasownik i nazwa rozdzielone | 🆕 **N-212** — ⚙ jedyny niezmiennik tej domeny z **własnym przymiarem** |
| co znaczy „porozmawiaj" | ⛔ **OTWARTE** → `OI-66` |
| spójność odwołań w treści | ⛔ **OTWARTA** → `OI-65` |
| wydzielenie warstwy rozmowy | ⛔ **OTWARTE** → `OI-64` |
| kolejność zadań w fabule | ➡ **ZOSTAJE** decyzją autora w danych |
| ile XP i złota jest warte zadanie | ➡ **ZOSTAJE** w `progression`, `economy` |

---

## 7. Czego procedura tu NIE złapała

1. ⭐ **PYTANIE O GRANICĘ MOŻNA POSTAWIĆ TAK, ŻE ODPOWIEDŹ JEST BEZUŻYTECZNA.**
   „Czy `dialogue` jest częścią `quests`?" ma dwie obronne odpowiedzi i kod nie
   rozstrzyga żadnej. ⚠ Pytanie, które rozstrzyga, brzmi: **co dokładnie
   rozciąłby rozdział?** — a odpowiedzią okazał się **jeden rekord danych**,
   a nie żadna mechanika. ⭐ Krok do procedury: **przy każdej granicy pytaj
   o KOSZT ROZCIĘCIA, nie o pokrewieństwo tematów.**

2. ⚠⚠ **REGUŁA BYWA KOMPLETNA W MECHANICE I PUSTA W TREŚCI** (Q-5, Q-6).
   Oddawanie u innej osoby jest wymuszane przez kompilator, rozdzielone
   w routingu i czytane przez marker — i **żadne zadanie tego nie używa**.
   ⚙ To **nie jest dryf** (projekt świadomie buduje głębię przed zawartością
   i ta decyzja jest zamknięta), ⚠ ale znaczy coś, czego przymiar nie odróżnia:
   **reguła nigdy nie została WYKONANA**. „Zielone" i „nigdy nie uruchomione"
   wyglądają identycznie.

3. ⚠⚠ **ZGŁOSZENIE Z GRY OPISUJE OBJAW O DWIE WARSTWY DALEJ OD PRZYCZYNY**
   (Q-9). Rekurencyjne wręczanie nagrody etapu — wywołane tym, że dodanie
   przedmiotu emituje zdarzenie, które wraca do trwającego przeliczenia —
   zostało zgłoszone jako **„żółte tło przy wręczaniu"**, czyli jako błąd
   koloru. ⭐ Zgłoszenie z rozgrywki jest **kierunkiem, nie diagnozą**;
   ⛔ szukanie go w warstwie, w której gracz je zobaczył, nie znalazłoby nic.

4. ⚠⚠ **LICZBY W PLIKU ŁADOWANYM CO SESJĘ STARZEJĄ SIĘ NAJCISZEJ** (Q-2).
   Router podaje 14 zadań u 9 dawców i 68 tematów; jest ich **15, 10 i 73**.
   ⛔ Nikt tego nie sprawdza, a to **jedyny plik, który każda sesja czyta
   w całości, zanim spojrzy na kod** — więc jego liczby są pierwszym, co agent
   przyjmuje za prawdę.

⚙ **Co zadziałało:** przestawienie pytania o granicę z „czy są powiązane" na
„co rozciąłby rozdział", oraz **rozwiązanie osiągalności skryptem** zamiast
oceny wzrokiem — to ono zamieniło „wygląda spójnie" w **„zero wiszących
odwołań z 56 bramek, wszystko osiągalne"**, czyli w zdanie, które da się
sfalsyfikować.

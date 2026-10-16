---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena world
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/world/TiledMap.ts, src/core/RenderCuller.ts]
otwarte: [OI-75, OI-76, OI-77]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `world`

> **Po co ten plik.** Materiał dowodowy; treść poszła do
> `docs/systemy/world.md`. ⛔ **Nie jest źródłem stanu gry.**
>
> ⚠ **Misja prowadzona przy 12% kontekstu** — zakres świadomie zawężony do
> Kroku 0 i wymienionych depozytów; czego nie zweryfikowałem, stoi w §6.

---

## 1. Krok 0 — granica `world` ↔ `assets`

⭐ **Test rozstrzygający: co się stanie, gdy tego zabraknie?**

| brakuje | skutek | domena |
|---|---|---|
| pliku graficznego | ⚙ **gra działa**, podstawia się obrazek zastępczy | `assets` |
| punktu na mapie | ⛔ **byt nie istnieje** | **`world`** |

⚙ **Mapa mówi CO i GDZIE; arkusz mówi CZYM to narysować.** Asymetria jest
pełna: ta sama grafika obsługuje wiele map, ta sama mapa działa z zastępczym
obrazkiem — ⛔ **w drugą stronę żadne z tych zdań nie jest prawdziwe**.

⚠ **Realny szew biegnie przez NAZWĘ i jest podwójny**: nazwa obiektu w edytorze
to klucz tłumaczony przez tabele `world`; nazwa pliku graficznego to **osobny**
klucz po stronie `assets`. ⚙ **Nic ich nie wiąże** — i po stronie `world` nic
nie sprawdza, czy klucz istnieje (`OI-76`).

| | treść |
|---|---|
| **bierze** | odczyt mapy i budowa sceny · punkt jako uprawnienie · przejezdność z jednego przebiegu · przejścia · co przeżywa · widoczność i porządek rysowania |
| **oddaje** | materiał → `assets` · wektor ruchu → `movement` · zachowanie i HP → `creatures` · odrastanie → `gathering` · treść zadań → `quests` |
| **NIE opisze** | żadnej konkretnej mapy · czy mapy są dobrze zaprojektowane |

---

## 2. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **odczyt mapy / stan świata** | ✅ **jedna mapa naraz**, przejście = przebudowa sceny; stan świata to **migawka** (tożsamość mapy, pozycja gracza, pozycje mieszkańców) |
| **przejezdność i siatka nawigacji** | ✅ — ⭐ i z regułą, której depozyt nie niósł: **siatka i przeszkody powstają z JEDNEGO przebiegu**, bo dwa odczyty tej samej mapy rozjechałyby się cicho. ⚠ Komentarz o niej **nieaktualny** (`OI-75`) |
| **spawn i pozycje NPC** | ✅ — ⚙ pozycje zapisywane **raz na budowę sceny** *(mieszkańcy się nie ruszają)*, w odróżnieniu od pozycji gracza |
| **stanowiska zbieractwa i ich rozmieszczenie** | ✅ **rozmieszczenie należy tutaj**, odrastanie do `gathering` — granica potwierdzona z obu stron |
| **zadanie → spawn elity** | ✅ potwierdzony: punkt elity jest **pomijany**, gdy zadanie ją zamknęło. ⭐ Najczystszy dowód reguły **„punkt to uprawnienie, nie byt"** |
| **culling** | ✅ — ⚙ **nie jest adaptacyjny** *(stały margines)*, dotyka **wyłącznie widoczności**, obejmuje tylko treść statyczną i nieinteraktywną, obrys liczony **raz** |
| **porządek rysowania (Y-sort)** | ⚠ **depozyt odwracał sens** *(sprostowane w `performance`)*: warstwa jest **OGRANICZENIEM** pracy co klatkę, nie jej źródłem |
| **wyjątki stanu świata w zapisie** | ✅ **dwa**, obie krótkie listy czytane raz przy wejściu — kryterium z `save` sprawdza się co do joty |
| **przejścia między mapami** | ✅ — ⭐ z ustaleniem: **punkt przybycia autoruje mapa ŹRÓDŁOWA**, a jedno przejście domyka trzy mechanizmy w trzech domenach *(przeniesienie stanu, zapis, zakładka odrastania)* |

---

## 3. Rozjazdy

| # | twierdzenie | kod | waga · status |
|---|---|---|---|
| **W-1** | komentarz: siatka nawigacji „dziś BUDOWANA, jeszcze nie CZYTANA" | ⛔ **jest czytana** — trafia do kontekstu ruchu i stamtąd do szukania drogi *(cztery miejsca)*. ⚙ Reguła obok *(mapa awaryjna zostawia ją pustą)* obowiązuje dalej | ⚠ średnia → `OI-75` |
| **W-2** | nazwa obiektu mapy jest kluczem | ⛔ **kluczem, którego nikt nie sprawdza** — nazwa spoza tabeli jest **po cichu ignorowana** | ⚠⚠ wysoka → `OI-76` |
| **W-3** | świat ma kolizję terenu | ⚙ **jedna mapa z trzech**; pozostałe są w pełni przechodnie | ⚠ średnia → `OI-77` — **stan zawartości, nie wada** |
| **W-4** | **milczenie** — nigdzie nie zapisano, że **punkt to uprawnienie, nie byt** | stanowisko bywa puste *(`gathering`)*, punkt elity bywa pomijany *(`quests`)* | ⚠⚠ wysoka — ⭐ **najważniejsza reguła domeny, bez dokumentu** |
| **W-5** | **milczenie** — nigdzie nie zapisano, że **domyślnie ze świata nie przeżywa NIC** | dwa wyjątki, obie krótkie listy | ⚠ średnia — bez tego zdania każdy wyjątek wygląda na regułę |

⚙ **Zero sprzeczności poza `W-1`** — szósta domena z rzędu bez fałszywej reguły.

---

## 4. Pomiary

| pomiar | wynik |
|---|---|
| pliki warstwy świata | **9** · **2 213** linii |
| rodzaje punktów, które mapa autoruje | **11** |
| mapy z kolizją terenu | **1 z 3** |
| tabele tłumaczące nazwy obiektów | **4** *(mieszkańcy, zioła, zwierzęta, drobna fauna)* |
| ⛔ sprawdzenia nieznanej nazwy obiektu | **0** |
| wyjątki stanu świata przeżywające wyjście | **2** |
| co dotyka culling | ⚙ **wyłącznie widoczność** |
| przymiary tej domeny | **1** *(geometria widoczności — czysta, uruchamiana w Node)* |

⭐ **Wniosek: mapa nie ma władzy nad zawartością, tylko nad miejscem.** Trzy
niezależne domeny mogą **odmówić** postawienia bytu w autorowanym punkcie —
i wszystkie trzy z tego korzystają.

---

## 5. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | jedna mapa naraz · 11 rodzajów punktów · przejezdność z jednego przebiegu · dwa wyjątki stanu · culling wąski i nieadaptacyjny |
| **INTENDED** | ⚠ kolizja terenu na pozostałych mapach — **nierozstrzygnięta** (`OI-77`) · ⚠ „standard prześwitu" świadomie **nierozstrzygnięty, ale nieblokujący** *(zapisane w dokumencie lasu)* |
| **HISTORICAL** | przebudowa lasu i nawigacji jako **zamknięty etap** · trasowanie liczone co klatkę *(naprawione)* · geometria widoczności rozstrzygana macierzą kamery zamiast porównaniem prostokątów |

---

## 6. Czego NIE zweryfikowałem

⚠ **Misja przy 12% kontekstu — zakres zawężony świadomie.** Nie sprawdzałem:

1. ⛔ **Warstwy drzew jako instancji** *(4 pliki, ok. 570 linii)* — model
   instancji, manifesty stempli i prototyp porządku Z. ⚙ Wiem, że istnieje
   i że las jest na niego zmigrowany; **nie czytałem reguł**.
2. ⛔ **Szczegółów odczytu warstw kafli** — kolejność, warstwy nakładkowe,
   tilesety. To jest szew z `assets` i **należy do jego ekstrakcji**.
3. ⛔ **Zawartości map** — co gdzie stoi, poza policzonymi wcześniej
   stanowiskami zbieractwa.

⚙ **Żadna z tych trzech rzeczy nie podważa Kroku 0 ani niezmienników** —
wszystkie dotyczą **materiału i zawartości**, nie reguł miejsca.

---

## 7. Czego procedura tu NIE złapała

1. ⭐ **NAJWAŻNIEJSZA REGUŁA DOMENY BYWA TĄ, KTÓREJ NIKT NIE NAPISAŁ** (W-4).
   „Punkt to uprawnienie, nie byt" nie stoi nigdzie — a bez niej **trzy inne
   domeny wyglądają, jakby łamały mapę**: puste stanowisko, brakująca elita
   i nieodrodzony przeciwnik czytają się jako błędy, dopóki nie wie się, że
   mapa **udziela prawa**, a nie stawia bytu.

2. ⚠⚠ **KLUCZ BEZ WERYFIKACJI JEST NAJCICHSZĄ AWARIĄ W CAŁEJ SERII** (W-2).
   Literówka w nazwie obiektu **nie daje błędu, ostrzeżenia ani śladu** —
   autor mapy dowiaduje się o niej tylko przez to, że czegoś nie ma w grze.
   ⚙ Trzeci raz ta sama klasa *(niekompletny gatunek zioła, wiszące odwołania
   zadań, tutaj)*, za każdym razem po innej stronie.

3. ⚠ **DEPOZYT PRZENIESIONY PRZEZ DWIE DOMENY MOŻE DOTRZEĆ ODWRÓCONY.**
   „Warstwa Y-sortowana przeliczana co klatkę" trafiła tu przez checkpoint jako
   **koszt**; jest **ograniczeniem kosztu**. ⚙ Sprostowane w `performance`,
   potwierdzone tutaj.

⚙ **Co zadziałało:** test granicy przez pytanie **„co się stanie, gdy tego
zabraknie"** — dał odpowiedź w jednym kroku i bez czytania `assets`.

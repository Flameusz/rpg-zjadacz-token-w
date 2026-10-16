---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena save
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Save.ts]
otwarte: [OI-50, OI-51]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `save`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/save.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | cztery sloty i rozdział autozapis ↔ ręczny · wersja i co chroni · **reguła addytywna** (obie połowy) · unia kształtów i normalizacja · kolejność odtwarzania · wyciszenie i bramki autozapisu · co świadomie nie jest zapisywane |
| **oddaje** | znaczenie każdego pola → domena właściciela · migawka i odtworzenie jednego systemu → ten system · ekran wyboru zapisu → `ui` |
| **NIE opisze** | co znaczy którekolwiek pole · **czy** coś powinno być zapisywane (to decyzja domeny) · ile slotów powinno być |

⚠ **Granica sprawdzona, nie założona:** ten system **nie wie, czym jest poziom
ani ranga** — woła migawkę u właściciela i oddaje ją z powrotem. Cała jego
wiedza to **kształt i jego trwałość w czasie**.

⭐ **Dziewiąta domena z rzędu pod limitem bez rundy skracania** (10,0 KB).

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | cztery sloty, wersja `3`, reguła addytywna, unia kształtów przedmiotu, normalizacja, wyciszenie, bramka „scena istniała", dwa wyjątki stanu świata |
| **INTENDED** | ⚠ **odwrócenie polityki wobec niezgodnych zapisów przed premierą** — zapisane jako świadomie odłożone (`OI-51`) |
| **HISTORICAL** | pojedynczy zapis sprzed slotów (dziś **jest** autozapisem) · atrybut wycofany, czytany wyłącznie ze starych zapisów · przedmiot noszony jako sam identyfikator |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **S-1** | `architektura.md`: „**Bump `SAVE_VERSION` when the save shape changes**" | ostatnie podbicie nastąpiło przy **NIEZMIENIONYM kształcie** — zmieniło się **znaczenie** zapisanych liczb progresji | ⛔ wysoka — reguła w tym brzmieniu jest **niepełna** i przepuściłaby dokładnie ten przypadek, dla którego wersję podbito. ⚠ Dokument jest **znany jako martwy** (RED FLAG 3), więc rozjazd nie jest nowy — ale **ta konkretna reguła** nie była dotąd nigdzie sprostowana |
| **S-2** | **milczenie** — nigdzie nie opisano, że reguła addytywna ma **DWIE połowy**: pole opcjonalne **i** domyślna znacząca „stan sprzed mechaniki" | pięć dokumentów cytuje pierwszą połowę, żaden drugiej | ⛔ wysoka — sama opcjonalność bez właściwej domyślnej **wczytuje postać do stanu, którego nigdy nie miała** |
| **S-3** | **milczenie** — nigdzie nie opisano, że **kształt pola też bywa unią**, nie tylko jego obecność | przedmiot noszony: sam identyfikator **albo** pełna kopia; obie postacie się wczytują | ⚠ średnia — to jest **drugi mechanizm** tej samej polityki, nieopisany |
| **S-4** | **milczenie** — nigdzie nie opisano, że **kolejność odtwarzania bywa treścią** | pula wyliczana z atrybutu musi zostać przeliczona **przed** przywróceniem wartości bieżącej | ⚠ średnia — cichy błąd: bieżąca wartość przycięta do starej puli |
| **S-5** | audyt fundamentów: „**sześć systemów** weszło bez skasowania ani jednej postaci" | dziś **osiemnaście pól opcjonalnych** wobec sześciu wymaganych | ⚙ **nie sprzeczność, inna jednostka** (systemy vs pola) i inna data — ale ⚠ **pomiar bez jednostki starzeje się cicho**, ta sama lekcja co przy `economy` |
| **S-6** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **odblokowania umiejętności nie są trzymane wcale** | wynikają z poziomu i nauki | ⚠ niska — brak pola **wygląda** jak przeoczenie |
| **S-7** | **brak przymiaru** — nic nie sprawdza najważniejszej reguły domeny | zero asercji | ⛔⛔ najwyższa → `OI-50` |

⚠ **Profil domeny: jedna nieaktualna reguła w martwym dokumencie i pięć
milczeń.** ⚙ Zero sprzeczności między kodem a żywą dokumentacją.

---

## 4. Pomiar kształtu zapisu

**Metoda:** zliczenie pól interfejsu zapisu z podziałem na wymagane
i opcjonalne, wprost ze źródła.

| grupa | liczba | co to jest |
|---|---|---|
| **wymagane** | **6** | ⚙ **dokładnie pierwotny zestaw** wersji `3` |
| **opcjonalne** | **18** | ⚙ **wszystko, co doszło od tamtej pory** |

**Co z tego wynika:**

1. ⭐ **Reguła addytywna nie jest deklaracją — jest zmierzonym kształtem
   zapisu.** Trzy pola na cztery są opcjonalne, a linia podziału **dokładnie
   pokrywa się z granicą wersji**.
2. ⚠ **Ani jedno pole dodane po wersji `3` nie podbiło wersji.** Jedyne podbicie
   dotyczyło **zmiany znaczenia**, nie dodania pola — czyli reguła i wyjątek od
   niej są rozłączne, a nie sporne.
3. ⚠ Wśród pól opcjonalnych są **cztery** dołożone przez jedną domenę
   (biegłość), w tym jedno, którego **nie da się odtworzyć z pozostałych** —
   i to jest jedyne uzasadnienie, jakiego wymaga nowe pole.

⛔ **Nie oceniam, czy 18 : 6 to dobry stosunek.** To jest opis, nie werdykt.

---

## 5. Depozyt z `items` — weryfikacja

**Pytanie misji:** czy reguła „nowe pole opcjonalne, bez podbijania wersji"
jest realna i kto ją konsumuje.

| sprawdzenie | wynik |
|---|---|
| czy reguła jest w kodzie | ✅ — **18 pól** dodanych dokładnie tak |
| czy loader ma domyślną dla każdego | ✅ — sprawdzone po kolei; każda znaczy „stan sprzed mechaniki" |
| czy któreś podbicie wersji ją złamało | ⛔ **nie** — jedyne podbicie dotyczyło znaczenia, nie dodania pola |
| ilu konsumentów cytuje regułę | **co najmniej pięć** dokumentów w czterech domenach |
| czy któryś konsument opisuje ją **niepełnie** | ⚠ **tak** — wszyscy cytują pierwszą połowę (opcjonalność), **żaden drugiej** (domyślna) → `S-2` |
| czy istnieje asercja | ⛔ **nie** → `OI-50` |

⚙ **Depozyt odebrany i uzupełniony:** `STAN` §3 opisuje **obie połowy** oraz
trzeci mechanizm tej samej polityki (unia kształtów, `S-3`), którego reguła
w brzmieniu z `items` w ogóle nie obejmowała.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| „nowe pole opcjonalne, bez podbijania wersji" | ✅ **N-136** — depozyt z `items`, **odebrany i UZUPEŁNIONY** o drugą połowę (S-2) |
| wersja chroni znaczenie, nie tylko kształt | 🆕 **N-137** (S-1) |
| odrzucenie zamiast migracji, ale z parsowaniem | 🆕 **N-138** |
| autozapis nigdy nie pisze do slotu ręcznego | 🆕 **N-139** |
| niezmienny klucz autozapisu | 🆕 **N-140** |
| normalizacja przy odczycie; upadek jednego slotu | 🆕 **N-141** |
| kolejność odtwarzania bywa treścią | 🆕 **N-142** (S-4) |
| wyciszenie autozapisu przy wczytywaniu | 🆕 **N-143** |
| wąski wyzwalacz autozapisu | 🆕 **N-144** — ⚠ **depozyt z `abilities` i `proficiency`**, gdzie obie domeny opisały ten sam wzorzec u siebie |
| stan chwili nie przeżywa zapisu | 🆕 **N-145** — ⚠ współdzielony z `abilities` (cooldowny) i `effects` |
| unia kształtów pola | ✅ opisana w `STAN` §3 jako część N-136 (S-3) |
| „nic, co gracz już ma, nie staje się gorsze" | ➡ **ZOSTAJE** w `items` (jakość wykonania); tu jako skutek normalizacji |
| co znaczy które pole | ➡ **ZOSTAJE** w domenie właściciela — bez wyjątku |
| dwa wyjątki stanu świata (elita, zbieractwo) | ➡ **ZOSTAJĄ** w `creatures` i `gathering`; tu tylko **kryterium**, dlaczego im wolno |
| polityka wobec premiery | ⛔ **OTWARTA** → `OI-51`, nierozstrzygana |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Reguła cytowana pięć razy może być cytowana NIEPEŁNIE za każdym
   razem** (S-2). Wszystkie cztery domeny, które ją stosowały, zapisały
   **opcjonalność** i żadna nie zapisała **wymogu właściwej domyślnej** — bo
   każda pisała o **swoim** polu, gdzie domyślna była oczywista. ⛔ Ekstrakcja
   domeny właściciela jest jedynym miejscem, w którym widać, że **wszyscy
   pominęli tę samą połowę**.

2. ⚠⚠ **Najlepiej przestrzegana reguła projektu nie ma ani jednej asercji**
   (`OI-50`). ⚙ Paradoks jest pozorny: **właśnie dlatego, że jest przestrzegana**,
   nigdy nie zabolała — a reguła, która nie zabolała, nie doczekała się
   strażnika. ⚠ Skutek jest odroczony: pierwsze złamanie **skasuje realny
   postęp** i dowie się o tym gracz, nie autor.

3. ⚠ **Rozjazd w martwym dokumencie nadal jest rozjazdem** (S-1).
   `architektura.md` jest oznaczony jako nieaktualny **jako całość**, ale ta
   konkretna reguła („podbij, gdy zmienia się kształt") jest **cytowalna
   i brzmi poprawnie** — a przepuściłaby dokładnie ten przypadek, dla którego
   wersję ostatnio podbito. ⛔ **Baner na dokumencie nie unieważnia zdań, które
   brzmią samodzielnie.**

4. ⚠ **Milczenie o nieistnieniu, szósty raz** (S-6). Tu w najłagodniejszej
   postaci: brak pola dla odblokowań **wygląda** jak przeoczenie, a jest
   konsekwencją tego, że dane są **wyprowadzalne**. ⚙ Kryterium, które z tego
   wynika, weszło do checklisty: **„czy da się to odtworzyć z czegoś innego"**.

⚙ **Co zadziałało:** krok 0, przeczytanie całego pliku zapisu (662 linie —
mieści się w jednej sesji), oraz **policzenie kształtu zamiast uwierzenia
w regułę** — to jedno zliczenie zamieniło deklarację w dowód.

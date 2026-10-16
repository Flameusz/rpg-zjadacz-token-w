---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena creatures
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs, tools/action_runner_weryfikacja.mjs]
otwarte: [OI-33, OI-35, OI-47]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `creatures`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/creatures.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | kontrakt gatunku (pola **wymagane bez derywacji**) · jeden rejestr · baza sterowana konfigiem + hooki · agresja i zerwanie pościgu · akcja z fazami i cooldown od rozstrzygnięcia · **priorytet ciała** · dwa ciała · śmierć, nagroda, odrodzenie · fauna bez walki |
| **oddaje** | rozstrzyganie ciosu i kształty → `combat` · `m(P)` i funkcja nauczyciela → `proficiency` · krzywa ochrony → `armor` · księgowość efektów → `effects` · krzywa XP → `progression` · ceny → `economy` · solvery, ścieżki, prędkości → `movement` |
| **NIE opisze** | statystyk ani zachowań żadnego gatunku · balansu · ilu ma nosić ochronę (poza regułą „wyjątek") |

**SYSTEM vs CONTENT:** SYSTEM = kontrakt pól, maszyna akcji, reguły agresji
i odrodzenia, priorytet ciała. CONTENT = **cały roster**: wytrzymałość,
obrażenia, biegłość, nagrody, łup, prędkości, telegrafy.
⛔ **Zero dokumentów per stworzenie.**

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | wszystko w `STAN`: kontrakt czterech pól, rejestr, dwa stany AI, zerwanie pościgu brakiem trasy, runner, priorytet ciała, odrodzenie |
| **INTENDED** | ⚠ `combat_v2_ocena.md` §7.2 (kęs w łuku zamiast dystansu — narzędzie istnieje, decyzja nie zapadła) · §7.4 (domknięcie dwóch ścieżek do autorytetu serwera) |
| **HISTORICAL** | sześć kopii maszyny stanów sprzed runnera · mapa siedmiu ścieżek obrażeń sprzed migracji · zapisany playtest współpracy przeciwników |

---

## 3. Rozjazdy

| # | rzecz | stan |
|---|---|---|
| **C-1** | **milczenie** — nigdzie nie opisano **priorytetu ciała** (impuls > ogłuszenie > AI) jako reguły | ⛔ wysoka — odwrotna kolejność kasowałaby odrzut, czyli tożsamość rodziny obuchowej. Reguła żyła w jednym komentarzu |
| **C-2** | **milczenie** — nigdzie nie opisano, że **cztery pola konfiguracji są wymagane BEZ DERYWACJI** jako **jedna reguła**; komentarze opisują każde osobno | ⚠ średnia — opisane po raz pierwszy jako klasa (`STAN` §1.1) |
| **C-3** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **stworzenie nie ma paska efektów** i że **trzeciego kanału prezentacji nie ma** | ⚠ średnia |
| **C-4** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **zerowe opóźnienie odrodzenia jest DEKLARACJĄ** („nigdy nie wraca"), a nie brakiem wartości | ⚠ średnia |
| **C-5** | `combat_v2_ocena.md` §7.2 — „wilk wciąż trafia zawsze" | ⚙ **potwierdzone jako nadal aktualne** przy ekstrakcji `combat`; tutaj ustalono **właściciela** → `OI-35` (§5) |
| **C-6** | `combat_v2_ocena.md` §7.3/§7.4 — dwie ścieżki na fizyce silnika | ⚙ **potwierdzone**; ⚠ tutaj dodane: **wyłączenie kontaktu jest realnym osłabieniem gatunku**, nie porządkami → `OI-33` |
| **C-7** | rejestr gatunków zastąpił **dwa równoległe `switch`e**, które **nie zgadzały się** — jeden nie znał manekina i po cichu zwracał konfigurację królika | ⚙ **naprawione przed ekstrakcją**; przeniesione jako niezmiennik `N-112` z zachowanym powodem |
| **C-8** | **brak infrastruktury** — żaden skrypt nie produkuje zestawienia rosteru | ⛔ wysoka → `OI-47`; ⚠ **skutek już zmierzony w innych domenach**: rachunek kanałów obrażeń w komentarzu konfiguracji rozjechał się z rosterem, a sufity nauki trzeba było liczyć od zera |

⚠ **Profil domeny: zero sprzeczności o regułach, same milczenia i potwierdzenia.**
Dwa z milczeń (C-3, C-4) to **milczenie o nieistnieniu** — czwarty raz w serii.

---

## 4. Rejestr decyzji z mocą

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **nowy gatunek = konfiguracja + hook**, nigdy skopiowana AI | KOD | **ACTIVE** |
| D-2 | **jeden rejestr** typ → (konfiguracja, konstruktor) | KOD, audyt 09-03 (D7) | **ACTIVE** |
| D-3 | **biegłość wymagana, bez derywacji**; ⛔ nie jest miarą groźności | `bieglosc_checkpoint.md` §16 | **ACTIVE** |
| D-4 | **rola dydaktyczna nie jest bramką** na naukę | tamże §14b | **ACTIVE** |
| D-5 | **typ obrażeń kontaktu wymagany**, `null` = świadomie | `typy_obrazen.md` §11.4 | **ACTIVE** |
| D-6 | **ślad stopy wymagany** — kompilator pyta o pomiar | KOD | **ACTIVE** |
| D-7 | **hurtbox ≠ ciało fizyczne** | KOD, `BodySpec` | **ACTIVE** |
| D-8 | **runner zamiast sześciu kopii maszyny stanów** | `combat_v2_audyt.md` §5.3 | **ACTIVE** |
| D-9 | **cooldown akcji od ROZSTRZYGNIĘCIA** | KOD | **ACTIVE** |
| D-10 | **zerowa zapowiedź jest decyzją**, nie brakiem | KOD | **ACTIVE** |
| D-11 | **priorytet ciała: impuls > ogłuszenie > AI** | KOD | **ACTIVE** (C-1) |
| D-12 | **brak trasy kończy pościg**; ⛔ nie timeout | KOD, 2026-09-05 | **ACTIVE** |
| D-13 | **weto zobowiązanej akcji** obowiązuje oba warunki wyjścia | KOD | **ACTIVE** |
| D-14 | **opancerzony wróg jest wyjątkiem** | `typy_obrazen.md` §5 | **ACTIVE** — depozyt z `armor`, odebrany |
| D-15 | **pancerz stworzenia bez jakości i zużycia** | tamże §6 | **ACTIVE** |
| D-16 | **kontakt bywa kanałem GŁÓWNYM** — zmierzone | tamże §11.2 | **ACTIVE** |
| D-17 | **wrogowie nigdy nie krytykują** | audyt 09-03 | ⚠ **ACTIVE, asymetria zaakceptowana** (`OI-30`) |
| D-18 | **księgowość zabójstwa w jednym miejscu**, wołana też przez efekt | KOD | **ACTIVE** — depozyt z `combat`/`effects` |
| D-19 | **zero odrodzenia = nigdy**; nagroda jednorazowego przeciwnika **niebramkowana** | KOD, `LOOT` | **ACTIVE** |
| D-20 | **fauna bez walki bez kontraktu bojowego**, osobne klasy | KOD | **ACTIVE** |
| D-21 | **pająki zachowują kanał kontaktowy** — wyłączenie byłoby osłabieniem | `combat_v2_ocena.md` §7.3 | **ACTIVE** → `OI-33` |

---

## 5. OI-35 — ustalenie właściciela

**Pytanie misji:** czyją regułą dokumentacyjną jest „kęs testowany samym
dystansem, bez łuku".

**Ustalenie — granica przebiega tak:**

| co | właściciel |
|---|---|
| **jakie kształty i predykaty trafienia istnieją** (łuk, okrąg, zasięg, konwencja krawędzi) | `combat` |
| **którego z nich używa atak danego gatunku** | ⚙ **`creatures`** |

⚙ **`OI-35` należy do `creatures`** i tam został opisany. Uzasadnienie:
naprawa użyłaby **istniejącego** kształtu z `combat` (ten sam wzorzec, który
stosuje już inny gatunek), więc `combat` niczego nowego nie dostarcza — zmienia
się **zachowanie gatunku**, czyli to, co ta domena opisuje.

⚠ **Podział jest realny, nie formalny:** gdyby brakowało kształtu, pozycja
byłaby wspólna i wymagałaby najpierw pracy w `combat`. ⛔ **Mechaniki nie
ruszono**; `STAN` opisuje stan dzisiejszy.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| nowy gatunek = konfiguracja + hook | 🆕 **N-111** |
| jeden rejestr gatunków | 🆕 **N-112** — z zachowanym powodem (C-7) |
| cztery pola bez derywacji | 🆕 **N-113** — po raz pierwszy jako **jedna klasa** (C-2) |
| biegłość nie jest miarą groźności; dwie role | ✅ **N-114** — depozyt z `proficiency`, **odebrany** |
| rola dydaktyczna nie jest bramką | ✅ **N-115** — depozyt z `proficiency` |
| hurtbox ≠ ciało fizyczne | ✅ **N-116** — ⚠ **współdzielony z `movement`** (`N-132`): tam jako reguła deklarowania ciała, tu jako kontrakt gatunku |
| brak trasy kończy pościg | 🆕 **N-117** |
| cooldown od rozstrzygnięcia | 🆕 **N-118** |
| priorytet ciała | 🆕 **N-119** (C-1) |
| opancerzony wróg jest wyjątkiem | ✅ **N-120** — depozyt z `armor`, **odebrany** |
| księgowość zabójstwa w jednym miejscu | ✅ **N-121** — depozyt z `combat`/`effects` |
| zero odrodzenia = nigdy | 🆕 **N-122** (C-4) |
| fauna bez walki bez kontraktu | 🆕 **N-123** |
| XP jako własność gatunku | ➡ **ZOSTAJE** w `progression` (`N-95`); tu wymienione jako wejście |
| łup jako jedyny odnawialny towar | ➡ **ZOSTAJE** w `economy` (`N-103`) |
| typ obrażeń na wariancie / kanale | ➡ **ZOSTAJE** w `weapons` / `armor` |
| `m(P)` i funkcja nauczyciela | ➡ **ZOSTAJE** w `proficiency` |
| ogłuszenie jako prymityw | ➡ **ZOSTAJE** poza warstwą efektów — `OI-27`, nierozstrzygane |
| kształty trafienia | ➡ **ZOSTAJE** w `combat`; ⚙ **wybór kształtu** wraca tutaj (§5) |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Reguły tej domeny są rozproszone po SIEDMIU podklasach i jednym pliku
   bazowym** — i to jest jedyny powód, dla którego C-1 i C-2 były milczeniami.
   Każda reguła jest opisana **przy swoim polu**, poprawnie; brakowało zdania,
   które mówi, że **cztery pola tworzą jedną klasę** i że **trzy stany ciała
   mają jawny priorytet**. ⛔ Widać to dopiero po przeczytaniu bazy w całości.

2. ⚠ **Milczenie o nieistnieniu, czwarty raz** (C-3, C-4). Tutaj dotyczyło
   **braku trzeciego kanału prezentacji** i **zera jako deklaracji**. ⚠ Drugi
   przypadek jest szczególnie zdradliwy: zero **wygląda** jak brak wartości,
   więc czytelnik nie ma nawet sygnału, że coś przemilczano.

3. ⚙ **Trzy pozycje z rundy oceny zweryfikowały się jako nadal aktualne**
   (C-5, C-6) — drugi raz z rzędu ten sam dokument wypada dobrze. ⚠ Ale
   ekstrakcja **dodała do nich coś, czego nie miały**: nazwanie właściciela
   (`OI-35`) i wagę skutku (`OI-33` — osłabienie gatunku, nie porządki).

4. ⛔ **Brak generatora rosteru kosztował już realnie, dwa razy** — raz jako
   rozjechany rachunek kanałów obrażeń w komentarzu konfiguracji (`armor`),
   raz jako sufity nauki liczone od zera (`proficiency`). ⚠ **Ta ekstrakcja
   jest trzecim razem** i też liczyła ręcznie. Generatora nie zbudowano
   (polecenie misji) — `OI-47`.

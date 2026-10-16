# CHECKPOINT — porządkowanie dokumentacji (2026-09-05, aktualizacja 2026-09-07)

> ⛔ **HISTORIA (2026-10-11).** Zapis porządków z 2026-09-05…09-08. Reguły, które
> z nich zostały, są w `docs/DOC_CONTRACT.md`; retrospektywa systemu z 2026-10-11
> i jej zmiany — `docs/dziennik.md` 2026-10-11 (22). Nic stąd nie jest stanem.

> **Dla kogo ten plik.** Dla agenta, który wchodzi do projektu **nie znając
> rozmowy, w której to powstało**. Mówi: co zrobiliśmy, jakie reguły
> obowiązują, gdzie jesteśmy i czego nie wolno ruszać.
>
> ⚠ **Leży w korzeniu repo, tak jak `PROJECT_CHECKPOINT_*.md`, i jest POZA
> kontraktem dokumentacji** (kontrakt rządzi katalogiem `docs/`). Nie ma
> nagłówka maszynowego świadomie.
>
> ⛔ **Nie jest planem gry.** Punkt wejścia dla prac nad grą: `docs/current.md`
> (od 2026-10-11; w dniu zapisu był nim `docs/konfiguracje_broni_checkpoint.md`). Ten plik dotyczy wyłącznie
> porządkowania dokumentacji.

---

## CURRENT PHASE

```
ODCHUDZENIE DOKUMENTACJI WALKI: ⭐⭐ ZAKOŃCZONE (2026-09-07)
27 dokumentów USUNIĘTYCH (~1,1 MB) · osiem domen walki = 8 STAN + 8 rejestrów
⛔ ZERO archiwizacji — historia jest w gicie i tylko tam
✅ doc_check: 0 BŁĘDÓW (na starcie tej sesji było 22)

ETAP 4/5 — KLASYFIKACJA CAŁEGO KATALOGU: ⭐⭐ ZAKOŃCZONA (2026-09-07)
136 dokumentów w docs/ · KAŻDY z nagłówkiem maszynowym · zero plików bez roli
25 STAN · 5 KANON · 6 DECYZJA · 59 HISTORIA · 2 GENEROWANE · 39 OPERACYJNE
⛔ ZERO przeniesionych plików, ZERO usuniętych — decyzja 2026-09-07
⚠ Przymiar był ŚLEPY na Windowsie (CRLF) — naprawione, sabotaż 17/17

ETAP 3 — CANON EXTRACTION: ⭐⭐ ZAKOŃCZONA (2026-09-06)
25 STAN-ów systemów · zero systemów bez dokumentu · zero dokumentów bez systemu  ⚠ lista urosła o `effects` (decyzja autora)
⛔ `performance` = PRZEKRÓJ, NIE domena — STAN nie powstanie (OI-74)
⚠ Realnie zostały TRZY STAN-y: world, assets, architecture  (`proces` z natury nosi OPERACYJNE)
⛔ NIE MA JUŻ DOMENY SYSTEMOWEJ BEZ DOKUMENTU. Dalej: wyłącznie decyzje autora (44 OI).
```

---

## COMPLETED

| # | etap | wynik |
|---|---|---|
| 31 | **Odchudzenie dokumentacji walki** | ⭐⭐ **2026-09-07.** 27 dokumentów ośmiu domen walki **USUNIĘTYCH**, nie zarchiwizowanych. Wiedza nośna wyciągnięta do **trzech decyzji**, `odlozone.md` §2 i `pomysly.md`; sekcje o powodach w ośmiu `STAN`-ach przepisane na rejestry ekstrakcji. **236 odwołań przepiętych w 55 plikach**, w tym w komentarzach `src/`. `macierz_walki.md` usunięty — generator jest od teraz przymiarem do konsoli; `ekwipunek_przedmioty.md` odświeżony (`OI-7` nie odtwarza się) |
| 30 | **Etap 4/5 — klasyfikacja katalogu** | ⭐⭐ **ZAMKNIĘCIE MIGRACJI (2026-09-07).** 70 zaległych dokumentów dostało nagłówek maszynowy **w miejscu**; 41 dostało baner „STAN tej domeny mieszka gdzie indziej"; indeks przepisany na router (104 KB → 19 KB, pełne opisy do `docs/archiwum/`). ⚠⚠ Znalezisko: `doc_check` **nie widział na tej maszynie ani jednego nagłówka** (CRLF) — reguły §N/§K/§Z/§R były martwe od powstania |
| 1 | **Audyt dokumentacji** | 88 plików w `docs/`, 15 konfliktów, 5 dziedzin bez źródła prawdy. Diagnoza: dokumentacja rośnie **chronologicznie**, a czytana jest **dziedzinowo** |
| 2 | **Etap 0 — kontrakt** | `docs/DOC_CONTRACT.md`: sześć typów dokumentu, nagłówek maszynowy, 26 domen, osie I/D/V, limity rozmiaru, reguły linkowania |
| 3 | **Etap 1 — księgowość** | 10 plików poprawionych: liczniki w indeksie, status Mastery w trzech miejscach, krytyk ze Zręczności, jedno źródło „co dalej", banery na trzech plikach z rozjazdami. **Zero zmian mechaniki** |
| 4 | **Etap 2 — przymiar** | `tools/doc_check.mjs` — osiem reguł, sabotaż 15/15. Pierwszy przebieg: 55 błędów → po naprawie pięciu klas fałszywych alarmów **21 prawdziwych** |
| 5 | **OI-4 / OI-6 rozstrzygnięte** | `docs/` dostaje podkatalogi, eksport robi `tools/doc_export.mjs`; `src/*/CLAUDE.md` poza kontraktem, ale pod przymiarem |
| 6 | **Pilot: `items`** | `docs/systemy/items.md` · 9 rozjazdów w **najlepiej utrzymanym** dokumencie projektu |
| 7 | **`attributes`** | `docs/systemy/attributes.md` · 7 rozjazdów · **rejestr 17 decyzji z MOCĄ** — 7 już nie obowiązywało, żadna nie była tak oznaczona |
| 8 | **`stamina`** | `docs/systemy/stamina.md` · 5 konfliktów, **2 świadomie nierozstrzygnięte** · rejestr 18 decyzji |
| 29 | **`architecture`** | ⭐⭐ **OSTATNIA.** `docs/systemy/architecture.md` — mapa całości: 5 warstw po **odpowiedzialności**, 18 właścicieli stanu, 4 kanały granic, **19 granic zweryfikowanych kodem** · ⚠⚠ **zapis jest jedynym modułem piszącym w cudzy stan** · ⭐ **czysty rdzeń (7/10) to warunek istnienia wszystkich przymiarów** · `OI-81`: stary opis architektury MARTWY |
| 28 | **`assets`** | `docs/systemy/assets.md` · ⭐ **domena, bo potrafi ZATRZYMAĆ budowę świata** (arkusz terenu) · granica z `world` potwierdzona, **własność kluczy rozstrzygnięta** (obiekt i tileset → `world`, tekstura → `assets`) · ⚠⚠ **degradacja ma TRZY stopnie, nie jeden** · ⚠ `OI-80`: reguła bez egzekutora, złamana już raz |
| 27 | **`world`** | `docs/systemy/world.md` · granica z `assets` rozstrzygnięta pytaniem **„co się stanie, gdy tego zabraknie"** · ⭐ **punkt to UPRAWNIENIE, nie byt** — reguła, której nikt nie napisał, a od której zależą trzy inne domeny · ⚠ `OI-76`: nazwa obiektu mapy to **klucz, którego nikt nie sprawdza** · ⚠ misja przy 12% kontekstu, §6 wylicza czego nie zweryfikowano |
| 26 | **`performance`** | ⛔ **NIE DOMENA — PRZEKRÓJ.** `docs/proces/ekstrakcja_performance.md`; `STAN` **świadomie nie powstał**. Dowód: **pomiar nigdy nie wraca do gry** (0 zachowań zależnych od klatek, 0 poolingu, 0 adaptacji, 0 limitów populacji) · **10 reguł wydajnościowych ma właścicieli gdzie indziej**, 2 należą do narzędzia · ⚠⚠ `OI-73`: **zero zadeklarowanych celów wydajnościowych** |
| 25 | **`presentation`** | `docs/systemy/presentation.md` · granica **potwierdzona i mocniejsza, niż zakładano**: jest warunkiem istnienia warstwy i **ma egzekutora** (regresja walki) · 9 rozjazdów · **6 zastanych decyzji** · ⚠⚠ depozyt **„hit-stop" ODRZUCONY** (to stan gry) · ⚠ `OI-72`: barwa jako jedyny nośnik, odbiór niesprawdzony |
| 24 | **`ui`** | `docs/systemy/ui.md` · granica rozstrzygnięta **czasem życia**, nie widocznością — wyrzuciła z domeny plik rysujący w świecie · 9 rozjazdów · ⭐ **kontrakt z rozgrywką dotrzymany w 100%** (zero wyszukań sceny gry) · ⚠⚠ `OI-67`: **próg dotykowy obowiązuje 5 kontrolek, nie interfejs** |
| 23 | **`quests`** | `docs/systemy/quests.md` — **zadania + rozmowy + NPC w jednej domenie**; przesądził **wspólny rekord NPC-a**, nie pokrewieństwo mechanik · 9 rozjazdów · ⭐ osiągalność 73 tematów i 15 zadań rozwiązana skryptem: **zero wiszących odwołań z 56 bramek** · ⚠ `OI-64` (czy wydzielić rozmowę), `OI-65` (spójność treści bez przymiaru) |
| 22 | **`gathering`** | `docs/systemy/gathering.md` · 9 rozjazdów · ⛔⛔ `OI-61`: **6 z 11 gatunków nie ma wpisu przedmiotu — zebranie rzuca błędem**, a mają 30 stanowisk i pełne duszki · ⚠ `OI-62`: zakładka odrostu pisana tylko przy wyjściu z mapy · ⚠⚠ **depozyt „Zielarstwo" okazał się fałszywy — pochodził z komentarza, przeniesiony przeze mnie** |
| 21 | **`inventory`** | `docs/systemy/inventory.md` · 9 rozjazdów · ⚠⚠ `OI-58`: **częściowe podniesienie z ziemi kasuje resztę** — dziura między dwoma poprawnymi przypadkami brzegowymi · ⚠ `OI-59`: sufit pojemności trzyma **arytmetyka zawartości**, nie reguła · ⚠ `OI-60`: **trzy pozycje z listy „czego świadomie NIE MA" zostały zbudowane** |
| 20 | **`audio`** | `docs/systemy/audio.md` · 9 znalezisk · ⚙ **osobna domena — przesądził cykl życia dłuższy niż scena**, nie temat · ⚠⚠ `OI-55`: **21 kluczy, 19 plików** — rozjazd kod ↔ DYSK, niewidoczny dla procedury czytającej kod · ⭐ ograniczenie NARZĘDZIA ukształtowało API runtime'u |
| 19 | **`input`** | `docs/systemy/input.md` · 9 znalezisk · ⚠⚠ **dwa twierdzenia FAŁSZYWE w instrukcjach przy kodzie** · ⭐ pomiar właścicieli **per klawisz**: 3 dzielone, 2 z bramką, **1 bez** · ⚠ `OI-52`: **klawiatura nie ma ogniska wejścia** · ⚠ pierwsza domena serii wymagająca rundy skracania |
| 18 | **`save`** | `docs/systemy/save.md` · 7 znalezisk · ⭐ **pomiar kształtu zapisu: 18 pól opcjonalnych : 6 wymaganych**, linia podziału pokrywa się z granicą wersji · ⚠⚠ `OI-50`: najlepiej przestrzegana reguła projektu **nie ma ani jednej asercji** |
| 17 | **`creatures`** + **`movement`** | `docs/systemy/creatures.md` + `docs/systemy/movement.md` · **dwie osobne domeny** · 15 znalezisk łącznie, **zero sprzeczności** — same milczenia i potwierdzenia · ⚙ **właściciel `OI-35` ustalony** · ⚠ korekta ustalenia poprzedniej ekstrakcji (`OI-48`) |
| 16 | **`progression` + `economy`** | `docs/systemy/progression.md` + `docs/systemy/economy.md` · ⚙ **DWA `STAN`-y** — rozdział rozstrzygnął **brak kursu wymiany między walutami** · 8 rozjazdów · 18 decyzji · **cztery pomiary policzone od zera** (`OI-43`, `OI-44`, `OI-46`) |
| 15 | **`weapons`** | `docs/systemy/weapons.md` · 8 rozjazdów · 24 decyzje · ⚠⚠ **`OI-40`: niezmiennik progu zasięgu przestał zachodzić** — zmierzone, ⛔ **nierozstrzygnięte** · największy odbiorca depozytów w serii |
| 14 | **`abilities`** | `docs/systemy/abilities.md` · 8 znalezisk · 28 decyzji · ⚙ **ZERO sprzeczności kod ↔ dokumentacja** — najlepiej udokumentowana domena serii · ⚠ `OI-38`: brak warstwy danych |
| 13 | **`effects`** | `docs/systemy/effects.md` · **27. domena** (`docs/decyzje/2026-09-06-effects-jako-domena.md`) · 8 rozjazdów · 20 decyzji · ⚠⚠ **pierwsza domena BEZ dokumentu źródłowego** — reguły żyły wyłącznie w komentarzach kodu |
| 12 | **`combat`** | `docs/systemy/combat.md` · 10 rozjazdów · rejestr 30 decyzji · ⭐ **jedna sesja zamiast dwóch** dzięki planowi cięcia przed pisaniem · odebrała **pięć depozytów** od wcześniejszych domen |
| 11 | **`proficiency`** | `docs/systemy/proficiency.md` · 8 rozjazdów · rejestr 30 decyzji · ⚠⚠ **OI-28: trzy z czterech rang Mastery są NIEOSIĄGALNE** przy dzisiejszej zawartości (policzone) · pierwszy przypadek, w którym **kłamał komentarz w kodzie, a dokumentacja miała rację** |
| 10 | **`shields`** | `docs/systemy/shields.md` · 12 rozjazdów · rejestr 28 decyzji · **OI-9 rozstrzygnięte** · ⚠ cztery rozjazdy to decyzje unieważnione przez **INNE domeny** |
| 9 | **`armor`** | `docs/systemy/armor.md` · **14 rozjazdów** · rejestr 23 decyzji · **OI-8 rozstrzygnięte pomiarem** · pierwsze rozjazdy znalezione w **komentarzach KODU** i w **asercji narzędzia** |

---

## DOCUMENTATION CONTRACT

📄 **`docs/DOC_CONTRACT.md`** — czytaj w całości przed pisaniem czegokolwiek.
Streszczenie, nie zamiennik:

**Sześć typów dokumentu:**

| typ | odpowiada na | kotwiczony w |
|---|---|---|
| `STAN` | jak działa **dziś** mechanika | **kodzie** |
| `KANON` | jak wygląda świat i reguły produkcji materiału | decyzji autora |
| `DECYZJA` | **dlaczego** tak | — |
| `HISTORIA` | jak i kiedy do tego doszliśmy | — |
| `GENEROWANE` | jakie są aktualne liczby | skrypcie z `tools/` |
| `OPERACYJNE` | co robimy dalej / jak coś zrobić | — |

> ⚠ **Reguła nadrzędna: tylko `STAN` opisuje dzisiejszą mechanikę gry.**
> Jeśli mechanika zaczyna być opisywana w drugim miejscu, system pada.

**Dodatkowo:**

- **`STAN`** — dokładnie jeden na domenę, zero historii, zero dat w treści,
  zero liczb rosteru (te są w `GENEROWANE`), limit 20 KB, obowiązkowe sekcje
  `## Pokrycie` / `## Otwarte` / `## Czego ten dokument nie rozstrzyga`.
- **`KANON`** — nie opisuje mechaniki. „Szary jest antagonistą prologu" = kanon;
  „Szary ma 190 HP" = `STAN`.
- **`DECYZJA`** — jedna decyzja = jeden plik, **niezmienna po zamknięciu**,
  musi zawierać co ODRZUCONO i dlaczego.
- **`moc`** (`ACTIVE` / `SUPERSEDED` / `REJECTED` / `HISTORICAL` / `OPEN`) —
  oś **niezależna** od `stan` dokumentu. `stan` mówi, czy plik będzie jeszcze
  edytowany; `moc` — czy treść **wiąże**. Definicja:
  `docs/decyzje/2026-09-05-moc-decyzji.md`.
- **`HISTORIA`** — tylko dopisywanie; **nigdy nie jest cytowana jako stan gry**.
- **`GENEROWANE`** — ręczna edycja liczby jest błędem, nie skrótem.
- **`OPERACYJNE`** — nigdy nie jest źródłem prawdy o mechanice.
- ⚠⚠ **SYSTEM jest dokumentem, CONTENT jest danymi.** `STAN` opisuje reguły,
  strukturę danych, zależności, niezmienniki, granice domeny i sposób, w jaki
  content korzysta z systemu. **Konkretne miecze, umiejętności, przedmioty,
  stworzenia i NPC-e NIE dostają własnych dokumentów `STAN`** — ich rekordy
  żyją w danych i w `GENEROWANE`. **Wyjątek:** element, który zmienił albo
  ujawnił regułę systemu, dostaje `DECYZJA`/`HISTORIA`, nigdy `STAN`.
  Decyzja: `docs/decyzje/2026-09-05-system-vs-content.md`.

**IMPLEMENTED / DOCUMENTED / VERIFIED** — trzy **niezależne** osie w nagłówku
`STAN`. Stan `IMPLEMENTED ✅ · DOCUMENTED ⚠ · VERIFIED ❌` jest **normalny**
i dozwolony. ⚠ `documented` jest deklaracją i **wolno jej nie ufać**: przymiar
wylicza własną ocenę z kotwic. Metody weryfikacji: `kod` · `przymiar:<nazwa>` ·
`reka:<data>` · `render:<data>`.

**CODE-FIRST** — patrz `## PROCESS RULES`.

**Decyzje historyczne — dwie reguły, obie kosztowały znalezisko:**

1. ⚠ **Moc ocenia się względem KODU i późniejszych decyzji**, nigdy względem
   tego, jak stanowczo dokument jest napisany. „final", „approved",
   „canonical", „docelowy", „v1" opisują **intencję z chwili pisania**.
2. ⚠⚠ **Decyzja może być zastąpiona CZĘŚCIOWO.** Część treści nadal obowiązuje,
   część została unieważniona przez późniejszą zmianę systemu. Zapisz osobno:
   która część, czym zastąpiona, skąd wynika obecny stan. **Nie zaokrąglaj do
   „obowiązuje / nie obowiązuje" i nie uśredniaj kilku decyzji w jedną.**

---

## CURRENT CANON

| domena | dokument `STAN` | otwarte |
|---|---|---|
| `items` | `docs/systemy/items.md` | OI-8, OI-9, OI-10 |
| `attributes` | `docs/systemy/attributes.md` | OI-12, OI-13, OI-14 |
| `stamina` | `docs/systemy/stamina.md` | OI-16, OI-17, OI-18, OI-19 |
| `armor` | `docs/systemy/armor.md` | OI-20, OI-21, OI-22 *(+ OI-23 w narzędziach)* |
| `shields` | `docs/systemy/shields.md` | OI-24, OI-25, OI-26 *(+ OI-27 poza domeną)* |
| `proficiency` | `docs/systemy/proficiency.md` | OI-28, OI-29, OI-30, OI-31 *(+ `D2`/`D3`/`D4`/`D6` własną numeracją)* |
| `combat` | `docs/systemy/combat.md` | OI-32, OI-33, OI-34, OI-35 |
| `effects` | `docs/systemy/effects.md` | OI-27, OI-36 |
| `abilities` | `docs/systemy/abilities.md` | OI-27, OI-38, OI-39 |
| `weapons` | `docs/systemy/weapons.md` | OI-40, OI-41, OI-42 |
| `progression` | `docs/systemy/progression.md` | OI-43, OI-44, OI-45 |
| `economy` | `docs/systemy/economy.md` | OI-45, OI-46 |
| `creatures` | `docs/systemy/creatures.md` | OI-33, OI-35, OI-47 |
| `movement` | `docs/systemy/movement.md` | OI-48, OI-49 |
| `save` | `docs/systemy/save.md` | OI-50, OI-51 |
| `input` | `docs/systemy/input.md` | OI-52, OI-53, OI-54 |
| `audio` | `docs/systemy/audio.md` | OI-55, OI-56, OI-57 |
| `inventory` | `docs/systemy/inventory.md` | OI-58, OI-59, OI-60 |
| `gathering` | `docs/systemy/gathering.md` | OI-61, OI-62, OI-63 |
| `quests` | `docs/systemy/quests.md` | OI-64, OI-65, OI-66 |
| `ui` | `docs/systemy/ui.md` | OI-67, OI-68, OI-69 |
| `presentation` | `docs/systemy/presentation.md` | OI-70, OI-71, OI-72 |
| `world` | `docs/systemy/world.md` | OI-75, OI-76, OI-77 |
| `assets` | `docs/systemy/assets.md` | OI-78, OI-79, OI-80 |
| `architecture` | `docs/systemy/architecture.md` | OI-81, OI-82, OI-83 |
| `performance` | ⛔ **brak — przekrój**, `docs/proces/ekstrakcja_performance.md` | OI-73, OI-74 |

⚠ **Pozostałe 4 pozycje NIE mają dokumentu `STAN`** — a `performance` **nigdy go nie dostanie** (przekrój, `OI-74`). ⭐⭐ **Nie została żadna.** 25 `STAN`-ów systemów · `performance` = przekrój (`OI-74`) · `proces` = warstwa operacyjna. Brak `STAN`-u jest
legalnym stanem świata — nie zakładaj, że gdzieś jest i trzeba go znaleźć.

---

## NEXT STEP

```
⭐⭐ EKSTRAKCJA I KLASYFIKACJA ZAKOŃCZONE — nie ma następnej domeny
ani następnego pliku do zaklasyfikowania. Dalej: wyłącznie decyzje autora.
```

⛔ **NIE SZUKAJ KOLEJNEJ DOMENY.** Każdy system ma dokument, każdy dokument ma
system. Dalsza praca nad dokumentacją to **wyłącznie rozstrzyganie `OI`**,
z czego większość to **jedno zdanie autora**, nie robota.

⭐ **Lista jest w `docs/zadania.md`** (2026-09-08) — **77 spraw aktywnych**
z 86 nadanych numerów, pogrupowanych po KATEGORII, z adresem pełnego opisu
przy każdej. ⛔ Nie licz ich z tego pliku: on trzyma dziś **wyłącznie** sprawy
dokumentacyjne.

⚠ **Co czeka:**

1. **Depozyty** — `world` jest największym odbiorcą w całej serii:
   ⏳ **culling: tylko `.visible`, tylko treść statyczna i nieinteraktywna**
   oraz ⏳ **warstwa Y-sortowana jako OGRANICZENIE pracy co klatkę**
   (obie z `performance`) · gdzie stoją stanowiska ziół i że jedna mapa ma ich
   **zero** (`gathering`) · miejsce, w którym stoi NPC (`quests`) · przejezdność
   terenu i siatka nawigacji (`movement`) · **stan zadań decyduje, czy elita się
   pojawi** (`quests`) · dwa wyjątki zapisywanego stanu świata (`save`).
2. ⚠ **Granica `world` ↔ `assets`** — krok 0 musi rozstrzygnąć, co jest
   **mapą** (co gdzie stoi, przejezdność, portale), a co **materiałem**
   (arkusze, tilesety, styl). ⛔ Nie zakładaj odpowiedzi.
3. ⚠ **Uwaga na katalog**: lekcja z `ui` i `presentation` — plik klasyfikuje się
   po **odpowiedzialności i cyklu życia**, nie po miejscu w drzewie.
4. ⭐ **Krok 0 — plan cięcia przed pisaniem.** Piętnaście domen z rzędu.

---

## OPEN ISSUES

> ⭐⭐ **KANONICZNA LISTA WSZYSTKICH OTWARTYCH SPRAW MIESZKA W `docs/zadania.md`**
> (2026-09-08) — jeden wiersz na sprawę, z KATEGORIĄ (BUG / IMPLEMENTATION /
> DESIGN / CALIBRATION / CONTENT / DOCUMENTATION) i adresem pełnego opisu.
>
> ⛔ **Ta sekcja została zawężona do WŁASNEGO tematu tego pliku** — dokumentacji,
> kontraktu i narzędzi. **72 wiersze o mechanice gry usunięto stąd jako
> DUPLIKAT**: ich kanonicznym domem jest sekcja `## Otwarte` dokumentu `STAN`
> właściwej domeny (kontrakt §2.1), gdzie opis jest **pełniejszy**, niż był
> tutaj. Nic nie zginęło — porównanie `OI-49` w obu miejscach było dowodem,
> że to tutaj stała wersja skrócona.

Nie rozwiązuj ich samodzielnie — **każda wymaga jednego zdania AUTORA**.

| id | rzecz | gdzie |
|---|---|---|
| OI-1 | `docs/README.md` utrzymywany ręcznie; docelowo **generowany** z nagłówków. ⚙ Od 2026-09-07 **jest z czego** — wszystkie dokumenty mają nagłówek | `docs/DOC_CONTRACT.md` §14 |
| **OI-2** | ⚙ **ROZSTRZYGNIĘTE 2026-09-07.** `docs/zaimplementowane.md` ma `typ: HISTORIA` i baner mówiący wprost, że **nie jest już checklistą stanu gry**; stan mechanik niosą `docs/systemy/*.md`, a `CLAUDE.md` i indeks przepięte. ⛔ Plik zostaje — niesie pomiary i odrzucone warianty | `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md` |
| **OI-84** | ⚠ **Osiem dokumentów ponad limitem §8** (`prompty_gemini` 127 KB, `wioska_plan` 71, `swiat` 49, `mapy` 44, `odlozone` 39, `referencje_zewnetrzne` 32, `konfiguracje_broni_checkpoint` 22, `DOC_CONTRACT` 21). Przymiar wypisuje je z nazwy jako OSTRZEŻENIA. ⛔ Cięcie to praca nad TREŚCIĄ — decyzja autora, kolejność z kontraktu §8 | j.w. |
| **OI-85** | ⚠ **13 dokumentów `STAN` odsyła do dokumentów `stan: zamrozony`** (`bieglosc_checkpoint`, `tarcze_analiza`, `combat_v2_audyt`, oba audyty z 2026-09-03, `feedback_obrony_analiza`) — a kontrakt §6 mówi, że do zamrożonego nic nie linkuje **jako do źródła**. Zrobiły to same ekstrakcje, więc to nie wypadek: albo te sześć plików jest w istocie `zamkniety` (zamknięty zapis, wolno cytować pomiar), albo §6 jest za ostre wobec §3. ⛔ **Nie rozstrzygać jednostronnie** — to wybór autora, nie robota | `docs/DOC_CONTRACT.md` §3, §6 |
| OI-3 | Pięć `PROJECT_CHECKPOINT_*.md` w korzeniu repo, cytowanych przez 8 dokumentów z `docs/` | j.w. |
| OI-5 | `docs/swiat.md` niesie tabelę „co już jest w grze" — mechanika w dokumencie `KANON` | j.w. |
| **OI-7** | ⚙ **NIE ODTWARZA SIĘ (2026-09-07).** Trzy przebiegi `tools/katalog_ekwipunku.mjs` z rzędu, bez zmian w `src/`, dały **identyczne 9 bloków**; dokument został odświeżony. Pierwotny objaw (raz 2, potem 9) pochodził najpewniej ze zmiany treści dokumentu MIĘDZY przebiegami, a znany błąd o `parryBonus` zniknął z generatora 2026-09-03. ⚠ Pozycja zostaje otwarta jako **obserwacja**, nie jako zakaz uruchamiania | `docs/ekwipunek_przedmioty.md` |
| **OI-23** | ⚠ **Dwa znaleziska w `src/` i `tools/`, świadomie NIENAPRAWIONE** (ekstrakcja nie rusza kodu): (a) `src/entities/CLAUDE.md` **odwraca kierunek** `ARMOR_PROFILE` — opisuje mnożnik ochrony jak mnożnik obrażeń (niezmiennik słuszny, uzasadnienie odwrócone); (b) asercja „pełna stal = 53,3%" w `tools/katalog_ekwipunku.mjs` sumuje zahardkodowane **cztery** sztuki i **nie może zaświecić na czerwono** | `docs/proces/ekstrakcja_armor.md` §2, §8 |
| **OI-73** | ⚠⚠ **Projekt nie ma ANI JEDNEGO zadeklarowanego celu wydajnościowego** — zero docelowych klatek, zero budżetu klatki, zero klasy urządzenia odniesienia, mimo że platformą docelową jest telefon, a narzędzie pomiarowe **istnieje i podaje percentyle**. ⚙ Skutek podwójny: **żadnej optymalizacji nie da się uznać za wystarczającą, a żadnej regresji za naruszenie**. ⚠ Miernik odpowiada „ile jest", nikt nie powiedział „ile ma być". **Decyzja AUTORA**: jedna liczba i urządzenie odniesienia | `docs/proces/ekstrakcja_performance.md` §7 |
| **OI-74** | ⚠ **`performance` stoi na kanonicznej liście domen, a nigdy nie dostanie `STAN`-u** — ekstrakcja pokazała, że jest **przekrojem**: bez stanu, bez własnych reguł, bez konsumenta w grze. ⚙ Lista domen zmienia się **wyłącznie decyzją z dowodami** (kontrakt §4, precedens `effects`), więc nie zmieniam jej sam. ⛔ **Decyzja AUTORA**: zdjąć pozycję, zostawić jako świadomie pustą z odsyłaczem, czy wprowadzić trzeci status („przekrój"). ⚠ Do czasu decyzji **licznik „X z 27" jest mylący** | j.w. §7 |
| **OI-37** | ⚠ **`DOC_CONTRACT.md` jest STRUKTURALNIE PEŁNY.** Dodanie jednej linii domeny przekroczyło jego limit 20 KB i wymusiło przycięcie powtórzeń; **zostało ~9 bajtów zapasu**. Każda kolejna zmiana kontraktu wymusi kolejne cięcie — a kontrakt jest jedynym dokumentem, którego limitu nie wolno podnieść bez podważenia reguły, którą sam ustanawia | `docs/DOC_CONTRACT.md` §8 |
| OI-11 | Numeracja niezmienników `N-n` jest globalna, a domeny rozłączne | `docs/proces/ekstrakcja_items.md` §5 |
| OI-15 | ⚠ **Nie sprawdzamy, czy komentarze w KODZIE nie kłamią o kodzie.** Przymiar sprawdza dokumentację przeciw kodowi, nie kod przeciw sobie | `docs/proces/ekstrakcja_attributes.md` §6 |

---

## KNOWN RED FLAGS

1. ⚠ **`docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` jest nieaktualny i wprowadza w błąd.** Zapisane
   tabele opisują 10 wariantów broni, roster ma 16. Cytowany w trzech plikach
   niezmiennik „każda broń poza włócznią jest poza orbitą wilka, młot mija próg
   o 0,36 px" **przestał zachodzić** — `Młot bojowy` daje +1,64 px zapasu.
   ⛔ Regeneracja tego pliku unieważnia niezmiennik, na którym stoi model
   rodziny dwuręcznej — to **decyzja projektowa**, nie odświeżenie tekstu.
2. ⚠ **`docs/ekwipunek_przedmioty.md` — 9 bloków nieodświeżonych**, ale
   generator ma znany błąd (wypisuje nieprawdziwe twierdzenie o `parryBonus`)
   **i niestabilny wynik** (OI-7). ⛔ Nie uruchamiaj `--zapisz` przed diagnozą.
3. ✅ **`docs/architektura.md` — ZAMKNIĘTE (2026-09-07).** Następca powstał
   (`docs/systemy/architecture.md`, 2026-09-06), więc warunek z tej pozycji
   jest spełniony: plik ma dziś `typ: HISTORIA`, `stan: zastapiony` i pole
   `zastapione-przez`. ⛔ Nadal nie usuwać — niesie uzasadnienia per moduł.
4. ⚠ **Kształt `WEAPON_FAMILY` zmienił się** (Weapon Traits V1), a cztery
   dokumenty nadal cytują stare pola. Widoczne w `doc_check` jako błędy `§S`.
5. ⚠ **Rozpad atrybutu Kondycja → Witalność + Kondycja (2026-08-21) nadal żyje
   w dokumentach** jako stary model.
6. ⚠ **Trzy dokumenty stoją w stanie „✅ wdrożone, czeka na playtest ręką"
   od sierpnia** z checklistami oznaczonymi NIEWYKONANA (`sklep_migracja_wzorca`,
   `inventory_scroll_ux`, `fauna_faza1`). Nie wiadomo, czy to nadal prawda.
7. ⚠ **Przymiar nie wykryje rozjazdu typu „dokument MILCZY o istniejącym polu".**
   Trzy z dziewięciu rozjazdów pilotażu były właśnie tego typu. **Przymiar
   utrzymuje stan po ekstrakcji, ale nie zastępuje ekstrakcji.**

8. ⚠ **`docs/systemy/armor.md` opisuje DWA materiały pancerza z czterech.** Jest
   domowym dokumentem domeny `armor` i nadal najlepszym źródłem POWODÓW, ale
   jego tabela profilu jest sprzed dwóch materiałów. Aktualny opis: `docs/
   systemy/armor.md` + generowany `docs/ekwipunek_przedmioty.md` §2.2.
   ⛔ Nie archiwizować — niesie uzasadnienia, których nie ma nigdzie indziej.

9. ⚠⚠ **Komentarze w `GameConfig.ts` niosą rachunki dowodowe, które się
   zestarzały** (liczby punktów kompletów sprzed dodania slotu rękawic, census
   kanałów obrażeń sprzed trzech akcji). **Wnioski z nich nadal trzymają, liczby
   nie.** Przymiar dokumentacji tego nie widzi z definicji (OI-15, OI-23).

---

## DO NOT DO

⛔ Bez wyraźnej decyzji autora **nie wolno**:

1. **Traktować starej decyzji jako aktualnej** dlatego, że jest oznaczona jako
   „approved", „final", „docelowa", „v1" albo „zatwierdzona przez autora".
2. **Archiwizować dokumentu** dlatego, że jego główny temat został
   wyekstrahowany — sprawdź najpierw, czy nie niesie wiedzy innych domen.
   ⚙ **Ta pozycja została ZAWĘŻONA 2026-09-07.** Dla ośmiu domen WALKI
   rozstrzygnięto ją odwrotnie: dokumenty źródłowe **usunięto**, a wiedzę
   nośną przeniesiono —
   `docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`.
   ⛔ Poza tamtymi ośmioma domenami reguła obowiązuje dalej; konkretnie **nie
   ruszaj**: `ekwipunek_mechanika.md`, `atrybuty.md`, `architektura.md`.
3. **Utożsamiać rozjazdu dokumentacja ↔ kod z błędem implementacji.**
   Bywa odwrotnie: dokument opisywał dług, który zdążono spłacić.
4. **Zmieniać mechaniki gry przy Canon Extraction.** Ekstrakcja opisuje,
   nie stroi. `src/` pozostaje nietknięty.
5. **Rozstrzygać OI-16, OI-17, OI-20, OI-21, OI-24, OI-25 i OI-28.** Wszystkie
   czekają na decyzję autora, nie na kolejny pomiar.
6. **Uruchamiać generatorów z `--zapisz`** bez sprawdzenia konsekwencji —
   zwłaszcza `tools/macierz_walki.mjs` (unieważnia cytowany niezmiennik),
   `tools/katalog_ekwipunku.mjs` (OI-7) i **`tools/build_mapa.py` (zna mapę
   100×60, skasowałby całą przebudowę lasu)**.
7. **Usuwać historii.** Dokumenty `_ocena` i dziennik są jedynymi nośnikami
   pomiarów, które obaliły wcześniejsze modele.
8. ⚙ **Przenosić plików ani przemianowywać dokumentów.** Etap 4/5 jest
   zamknięty i **rozstrzygnął to odwrotnie, niż zakładano**: rolą dokumentu
   jest jego `typ` w nagłówku, nie katalog. Census pokazał, że każdy plik
   w `docs/` jest cytowany przez co najmniej dwa inne, a przeprowadzka
   wymusiłaby edycję **niezmiennych** dokumentów `HISTORIA` i `DECYZJA`.
   Powód i odrzucone warianty:
   `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md`.

---

## PROCESS RULES

**Canon Extraction, CODE-FIRST:**

```
1. KOD               → odczytaj stan implementacji (esbuild → node na GameConfig,
                       grep po src/). Pełne listy, nie przykłady.
2. DOKUMENTACJA      → dopiero teraz otwórz dokumenty
3. ROZJAZDY          → wypisz wszystkie, z wagą
4. PÓŹNIEJSZE DECYZJE→ sprawdź, czy któraś unieważnia wcześniejszą
5. MOC               → ACTIVE / SUPERSEDED / REJECTED / HISTORICAL / OPEN
                       (dopuszczaj zastąpienie CZĘŚCIOWE)
6. STAN              → napisz dokument; weryfikuj każdy przenoszony niezmiennik
                       przeciw kodowi
7. BRAMKA            → node tools/doc_check.mjs
```

> ⚠⚠ **Canon Extraction NIE ogranicza wyszukiwania do plików nazwanych
> tematyką domeny.** Późniejsza decyzja może leżeć w dokumencie **innej**
> domeny. **Szukaj dokumentu, który ostatni RUSZYŁ mechanikę, nie tego, który
> ma ją w tytule.**

Dwie reguły, które ratują przed najczęstszym błędem:

- **Kolejność 1 → 2 nie jest formalnością.** Rozjazdy typu „dokument milczy
  o istniejącym polu" nie rzucają się w oczy — brak nie wygląda jak
  sprzeczność. Czytając najpierw dokument, nie masz czego z czym porównać.
- **Weryfikuj każdy przenoszony niezmiennik.** W pilotażu trzy z piętnastu
  okazały się nieaktualne albo niepełne.

**Produkty jednej domeny:** `docs/systemy/<domena>.md` (`STAN`) +
`docs/proces/ekstrakcja_<domena>.md` (rozjazdy, rejestr decyzji z mocą, co
należy do innych domen, czego nie wolno stracić) + baner na dokumencie
źródłowym + wiersz w `docs/README.md`.

---

## TOOLS

| plik | do czego |
|---|---|
| `docs/DOC_CONTRACT.md` | Kontrakt dokumentacji — typy, nagłówek maszynowy, domeny, limity, reguły. **Czytaj przed pisaniem czegokolwiek.** |
| `tools/doc_check.mjs` | Przymiar dokumentacja ↔ kod. Odpowiada na jedno pytanie: „dokument twierdzi X, ale kod już nie zawiera X". Tylko czyta. `--sabotaz` sprawdza, czy reguły potrafią zaświecić na czerwono; `--pelny` pokazuje INFO. |
| `tools/doc_export.mjs` | Pakowanie dokumentacji na zewnątrz — skleja zakres w jeden plik z kotwicami i **listą tego, czego w paczce nie ma**. `--domena <id>` to domyślne użycie. Zapisuje tylko z `--zapisz`. |
| `docs/proces/ekstrakcja_items.md` | Pilotaż procedury — **szablon dla kolejnych domen**, z oceną, co zadziałało i czego procedura nie złapie. |
| `docs/proces/ekstrakcja_attributes.md` | Ekstrakcja `attributes` + rejestr 17 decyzji z mocą; źródło reguły o zastąpieniu częściowym. |
| `docs/proces/ekstrakcja_stamina.md` | Ekstrakcja `stamina` + porównanie **trzech warstw** (kod ↔ zamierzony model ↔ stan historyczny) i pięć konfliktów z uzasadnieniem, dlaczego ich nie rozstrzygnięto. |

---

## CURRENT CHECKS

```
node tools/doc_check.mjs .......... 0 BŁĘDÓW · 24 OSTRZEŻENIA · 62 INFO
node tools/doc_check.mjs --sabotaz  17/17
node tools/doc_export.mjs --domena X  działa (filtruje po nagłówkach)
node tools/combat_regresja.mjs .... 121 przypadków, zero różnic
node tools/bieglosc_weryfikacja.mjs 260 sprawdzeń, zielone
node tools/effects_weryfikacja.mjs  65 sprawdzeń, zielone
node tools/movement_weryfikacja.mjs 71 933 sprawdzenia, zielone
node tools/action_runner_weryfikacja.mjs  zielone
npx tsc --noEmit .................. czysto (src/ nietknięty w całym Etapie 0–3)

dokumentów przeskanowanych ........ 149
z nagłówkiem maszynowym ........... 136 / 149  (13 bez: 5 × CLAUDE.md przy kodzie + 8 z korzenia repo — oba świadomie poza kontraktem)
domen z dokumentem STAN ........... 25 / 27  (performance = przekrój, proces nosi OPERACYJNE)
```

✅ **ZERO BŁĘDÓW od 2026-09-07.** Oba wcześniejsze siedziały w dokumentach
`GENEROWANE` i rozwiązały się **bez rozstrzygania czegokolwiek za autora**:

| dawny błąd | jak zniknął |
|---|---|
| `macierz_walki.md` — 10 wariantów wobec 16 w rosterze | **dokument usunięty.** Snapshot pomiaru zestarzał się dwa razy i kłamał ciszej, niż kłamie jego brak; `tools/macierz_walki.mjs` drukuje dziś aktualne liczby do konsoli. Reguła progu przeniesiona do `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`, a `OI-40` **zawężone do dwóch liczb** |
| `ekwipunek_przedmioty.md` — 9 bloków nieodświeżonych | **odświeżony.** `OI-7` **nie odtwarza się**: trzy przebiegi z rzędu dały identyczne 9 bloków, a znany błąd o `parryBonus` zniknął z generatora 2026-09-03 |

⛔ **Nie „czyść" ich pojedynczo i nie wyciszaj reguły §T.** Poprawka księgowa
bez decyzji łata zdanie, nie dziedzinę (lekcja z `attributes`, R-3).

⚠ **Osiem dokumentów przekracza limit z §8** i od 2026-09-07 przymiar wypisuje
je z nazwy jako OSTRZEŻENIA (błędem rozmiar jest tylko dla `STAN` — §7 czyni
limit warunkiem odbioru wyłącznie tam): `prompty_gemini.md` 127 KB ·
`wioska_plan.md` 71 · `swiat.md` 49 · `mapy.md` 44 · `odlozone.md` 37 ·
`referencje_zewnetrzne.md` 32 ·
`konfiguracje_broni_checkpoint.md` 22 KB (`OI-84`). ⛔ **Cięcie ich to praca
nad TREŚCIĄ i należy do autora** — kolejność narzuca kontrakt §8. Pozostałe
ostrzeżenia to próg 80% limitu, żadne nie jest problemem.

⚠⚠ **Rozmiary rosną z każdą domeną i to jest sygnał, nie przypadek.** Sześć
`STAN`-ów po kolei: 8 → 15 → 16 → 18 → 19 KB, bo późniejsze domeny mają po
**osiem źródeł zamiast jednego**. Przy `combat` (osiem źródeł i BRAK dokumentu-modelu) limit
20 KB będzie realnym ograniczeniem, nie formalnością: **zaplanuj od razu, co
idzie do `HISTORIA`, a co do `GENEROWANE`** — kolejność cięcia jest w kontrakcie
§8 i nie wolno jej odwracać.

---

## IMPORTANT DISCOVERIES

**Czterdzieści, których nie wolno zgubić:**

1. ⚠⚠ **Kod może zawierać rzeczy, których dokumentacja w ogóle nie opisuje.**
   Nie każdy rozjazd to sprzeczność — częściej to **milczenie**. W pilotażu
   `items` trzy z dziewięciu rozjazdów to były pola istniejące w kodzie
   i nieobecne w modelu danych (m.in. `weight`, nośnik całego obciążenia).
   ⛔ Żaden skrypt tego nie wykryje.

2. ⚠⚠ **Historyczna decyzja może być zastąpiona CZĘŚCIOWO.**
   Wzorzec `A-8`: „Zręczność mówi jak często krytykujesz, rodzina Axe jak
   mocno" — pierwsza połowa unieważniona, **druga nadal obowiązuje**.
   Ani jeden dokument tego nie odnotował; wyszło wyłącznie z odczytu kodu.
   Powtórzyło się w `stamina` (`K-S3`) **przy drugiej z rzędu domenie**.

3. ⚠⚠ **Aktualny model domeny może mieszkać w dokumencie INNEJ domeny.**
   Ekonomię wysiłku przebudował `docs/systemy/proficiency.md`, a nie
   `docs/systemy/stamina.md`. Czytając „dokumenty o staminie", wziąłbyś model
   historyczny za obowiązujący.

4. ⚠⚠ **Niezmiennik zapisany jako LICZBA umiera cicho; zapisany jako WŁASNOŚĆ
   przeżywa.** Domena `armor` miała dwa takie: regułę „stal musi zostać poniżej
   37,6%" (liczbę policzono na komplecie, który potem urósł o slot — dziś jest
   przekroczona, choć własność, której broniła, trzyma z czterokrotnie większym
   zapasem) oraz zieloną asercję „pełna stal = 53,3%", która sumuje zahardkodowane
   **cztery** sztuki i **nie może zaświecić na czerwono** przy dodaniu piątej.
   ⛔ **Reguła operacyjna dla następnych domen: przelicz każdy niezmiennik podany
   jako liczba, ZANIM go przeniesiesz.** Przepisany z dokumentu przeszedłby jako
   aktualny w obu przypadkach.

5. ⚠⚠ **Dokument domeny nie ma jak zauważyć zmian, które przyszły z INNEJ
   domeny.** W `shields` cztery z dwunastu rozjazdów były tej klasy: parowanie
   przyszło z broni, obciążenie ze staminy, warstwa efektów z umiejętności —
   a `tarcze_analiza.md` niczego nie zaniedbał, bo w samych tarczach nic się nie
   zmieniło. ⛔ **Lista „poza zakresem" starzeje się SZYBCIEJ niż opis
   mechaniki**, bo unieważnia ją dowolna inna domena. Czytaj ją zawsze przeciw
   kodowi, nigdy jako stan.

6. ⚠⚠ **„Zaimplementowane" znaczy „MA KONSUMENTA", nie „istnieje funkcja" —
   a KOMENTARZ W KODZIE nie jest kodem.** Hierarchia źródeł z kontraktu mówi
   „KOD" i przez cztery domeny czytaliśmy to jako „wszystko w plikach `src/`".
   W `proficiency` nagłówek modułu twierdził, że czterech mechanizmów nie ma —
   a ciało tego samego modułu je dostarczało i konsument je wołał. ⛔ Przymiar
   nie odróżni komentarza od kodu i nigdy nie odróżni; jedynym mechanizmem jest
   **sprawdzenie wywołań**.

7. ⚠⚠ **Milczenie o ZŁOŻENIU — dwa razy z rzędu, więc to wzorzec.** `OI-24`
   (brak wspólnego sufitu mitygacji) i `OI-28` (nieosiągalne rangi Mastery) to
   **iloczyny mechanizmów, z których każdy był opisany osobno i poprawnie**.
   Nie brakowało opisu pola — brakowało opisu tego, co wychodzi z pomnożenia.
   **Reguła operacyjna: w każdej domenie z BRAMKAMI policz, czy zawartość gry
   potrafi je przekroczyć.**

8. ⭐ **PLAN CIĘCIA PRZED PISANIEM jest krokiem 0, nie ratunkiem awaryjnym.**
   Kontrakt §8 podaje kolejność cięcia na wypadek przekroczenia limitu; `combat`
   zastosowała ją **profilaktycznie** — spisując przed pierwszym zdaniem, co
   domena bierze, co oddaje sąsiadom i co zostaje w historii. Efekt: największa
   domena w kolejce weszła pod limit **bez rundy skracania**, w jednej sesji
   zamiast dwóch. Cztery wcześniejsze pisano „na pełno" i przycinano po fakcie.

9. ⚠⚠ **Rozjazd potrafi SKAZIĆ dokument napisany dzień wcześniej.**
   `shields.md` powtórzył nieaktualne zdanie z komentarza w kodzie, bo
   ekstrakcja `shields` nie miała powodu liczyć timerów ataku — to nie jej
   domena. Wykryła to dopiero ekstrakcja `combat`. ⛔ **Kolejność domen ma
   znaczenie merytoryczne, nie tylko organizacyjne**, a domeny CENTRALNE (jak
   `combat`) warto robić PÓŹNO: ta jedna odebrała **pięć depozytów** od
   wcześniejszych i dopiero teraz ich odesłania są domknięte.

10. ⚠⚠ **Decyzja SYSTEM/CONTENT chroni przed dokumentami PER ELEMENT, ale nie
   przed REGUŁĄ SYSTEMU zapisaną w dokumencie elementu.** Dwie reguły
   obowiązujące KAŻDY efekt w grze mieszkały w dokumencie o jednej
   umiejętności — formalnie zgodnym z kontraktem, bo to `HISTORIA` o konkretnym
   Rozcięciu. ⛔ Żaden przymiar tego nie wykryje; wykrywa to wyłącznie
   ekstrakcja domeny, której reguła dotyczy. **Nowy wariant, nie powtórka.**

11. ⚠⚠ **Domena może nie mieć ŻADNEGO źródła.** Wtedy ekstrakcja przestaje być
   godzeniem dokumentów z kodem i staje się **pierwszym zapisem** — a jakość
   rejestru decyzji równa się wtedy jakości komentarzy w kodzie. ⚠ Przy
   `effects` jeden z tych komentarzy okazał się odwrócony.

12. ⚙⚠ **Dobrze udokumentowana domena też potrzebuje `STAN`-u — ale z innego
   powodu.** `abilities` dała **zero sprzeczności** kod ↔ dokumentacja; wszystkie
   znaleziska to milczenia i kontrole pozytywne. A mimo to cztery reguły
   systemowe nie miały gdzie mieszkać, bo **dokument o MIGRACJI opisuje
   GRANICĘ, nie SYSTEM**: mówi „co do rejestru nie należy", nie „jak wygląda
   całość". ⛔ Nie zakładaj, że domena bez rozjazdów nie wymaga ekstrakcji.

13. ⚠⚠ **GRANICA UPRAWNIEŃ EKSTRAKCJI — najważniejsze rozróżnienie serii.**
   > Ekstrakcja **poprawia** regułę, gdy pomiar pokazuje, że jej **BRZMIENIE
   > było niedokładne**. ⛔ **Nie poprawia** jej, gdy pomiar pokazuje, że
   > **zmienił się ŚWIAT**, który opisywała — wtedy jedyną poprawną odpowiedzią
   > jest `OPEN`.

   Przy `armor` `N-7` należał do pierwszej kategorii i został poprawiony. Przy
   `weapons` `N-5` i próg zasięgu należą do drugiej — i **zostały zostawione
   nietknięte**, mimo że pomiar był w ręku. ⛔ Przekroczenie tej granicy jest
   zmianą gry pod pozorem porządkowania dokumentacji.

14. ⚠ **Reguła bez METRYKI jest gorsza niż reguła bez ASERCJI.** Przy braku
   asercji wiadomo, co sprawdzić, i można ją dopisać; przy braku metryki
   (`N-5`: nie wiadomo, na której osi i wobec czego) nie da się nawet
   stwierdzić, czy reguła jest dziś spełniona.

15. ⚠⚠ **MILCZENIE O NIEISTNIENIU — czwarty i najtrudniejszy wariant.**
   Dotychczasowe milczenia dotyczyły istniejących **pól** (`items`), **złożeń**
   dwóch opisanych mechanizmów (`shields`, `proficiency`) albo **własności
   układu** (`weapons`). W `economy`/`progression` brakowało opisu **rzeczy,
   których NIE MA**: złota z zabójstw, powtarzalnych ujść, bonusów z poziomu.
   ⛔ **Brak mechaniki nie zostawia śladu w kodzie** — nie znajdzie go ani grep,
   ani porównanie list pól. Znajduje to **wyłącznie pytanie „a skąd
   właściwie…"**, czyli czytanie systemu jako całości.

16. ⚠ **Pomiar bez METODY starzeje się ciszej niż liczba bez daty.** Dwie różne
   wartości dla tego samego sklepu, **obie poprawne** — jedna liczona przy
   jakości domyślnej, druga przy jakości półki. Kontrakt wymaga podania metody
   przy pomiarze; ta domena pokazuje, że to nie jest formalność.

17. ⚠⚠ **„ZASTĄPIONE" WYMAGA SPRAWDZENIA, CZY ZREALIZOWANO TO, O CO PYTANO** —
   a nie tylko, czy coś w tej okolicy powstało. Ekstrakcja `armor` zapisała
   zaparkowaną pozycję „ciężar pancerza → **koszt mobilności**" jako w pełni
   zastąpioną, bo waga przedmiotów powstała. Ekstrakcja `movement` pokazała, że
   wdrożono koszt **wysiłku**, a nie **mobilności** — parking jest w połowie
   otwarty (`OI-48`). ⛔ **Drugi raz w serii ekstrakcja poprawiła ustalenie
   innej ekstrakcji**; to jest normalna praca, nie wpadka — ale znaczy, że
   „SUPERSEDED" trzeba uzasadniać treścią pytania, nie sąsiedztwem tematu.

18. ⚠ **Reguła może być prawdziwa i NIEZAMIERZONA jednocześnie.** „Pościg nie
   dogania marszu" zachodzi dziś dla całego rosteru — ale nic tego nie pilnuje.
   ⛔ **Ekstrakcja nie ma prawa awansować obserwacji na regułę**: opisuje ją,
   mierzy i pyta (`OI-49`).

19. ⚠⚠ **REGUŁA CYTOWANA PIĘĆ RAZY MOŻE BYĆ PIĘĆ RAZY CYTOWANA NIEPEŁNIE.**
   „Nowe pole zapisu jako opcjonalne, bez podbijania `SAVE_VERSION`" ma **dwie
   połowy**: pole opcjonalne **i** domyślną znaczącą „stan sprzed mechaniki".
   Cztery domeny stosowały ją poprawnie i **wszystkie zapisały tylko pierwszą** —
   bo każda pisała o swoim polu, gdzie domyślna była oczywista. ⛔ Widać to
   dopiero z domeny właściciela.

20. ⚠ **Baner „dokument nieaktualny" NIE unieważnia zdań, które brzmią
   samodzielnie.** `architektura.md` jest oznaczony jako martwy jako całość, ale
   jego reguła „podbij wersję, gdy zmienia się KSZTAŁT zapisu" jest cytowalna
   i przepuściłaby dokładnie ten przypadek, dla którego wersję ostatnio
   podbito (zmiana ZNACZENIA przy niezmienionym kształcie).

21. ⚠⚠ **KOMENTARZ MOŻE OPISYWAĆ MECHANIZM, KTÓREGO NIE MA — i przeżyć
   dokładnie dlatego, że SKUTEK jest poprawny.** Cztery widżety „zatrzymują
   propagację, żeby drążek nie przejął dotyku"; drążka zatrzymuje co innego
   (dwa hit-testy i podział ekranu), a te cztery leżą tam, gdzie drążek i tak
   się nie zgłasza. ⛔ Sprawdzenie **przez objaw** zawsze wypada pozytywnie —
   fałsz widać dopiero po przeczytaniu, jak naprawdę działa silnik. ⚠ W tym
   samym katalogu stoi opis **poprawny**; kopiowany jest krótszy.

22. ⚠⚠ **DWIE POŁOWY JEDNEGO CZASOWNIKA W DWÓCH WIDŻETACH: każda poprawna,
   skutek łączny zły.** Otwieranie rozmowy przeniesiono świadomie, zamykanie
   zostało — i `E` zamyka rozmowę, po czym drugi uchwyt ją otwiera. ⛔ Nie widać
   tego z żadnej ze stron; trzeba **zliczyć wszystkich właścicieli klawisza
   naraz**. ⚙ Ta sama klasa co „milczenie o KOMPOZYCJI", pierwszy raz na
   wejściu.

23. ⚠⚠ **ROZJAZD MIĘDZY KODEM A DYSKIEM JEST NIEWIDZIALNY DLA PROCEDURY
   CZYTAJĄCEJ KOD.** Roster dźwięków ma **trzy** kopie (konfiguracja, generator,
   pliki), a kod jest poprawny po obu swoich stronach: klucz wolno
   zadeklarować, brakujący plik wolno pominąć. ⛔ Żaden grep po `src/` tego nie
   pokaże — trzeba **wylistować katalog**. ⭐ Krok do procedury: **gdy domena ma
   roster, policz WSZYSTKIE jego kopie, także te poza kodem.**

24. ⚠⚠ **GWARANCJA BYWA PRAWDZIWA I ZA WĄSKA NARAZ.** „Wywiedzione z tabeli,
   **więc te dwie nie mogą się rozjechać**" jest zdaniem w pełni poprawnym,
   które czyta się jako „roster nie może się rozjechać". Różnicę robi słowo
   **„dwie"** — dokładnie ten rodzaj słowa, który wypada przy cytowaniu. ⚙ Ta
   sama klasa co **pomiar bez jednostki**.

25. ⚠⚠ **DZIURA POTRAFI MIEŚCIĆ SIĘ MIĘDZY DWOMA POPRAWNYMI PRZYPADKAMI
   BRZEGOWYMI.** Przy pełnym plecaku „wszystko wchodzi" działa i „nic nie
   wchodzi" działa — a **„część wchodzi" kasuje resztę**. Procedura
   sprawdzająca warunki brzegowe po kolei znajduje dwa poprawne i zamyka
   sprawę. ⭐ Krok do procedury: **przy każdej odmowie zapytaj, czy istnieje
   stan POŁOWICZNY** — nie jest średnią dwóch pozostałych.

26. ⚠⚠ **LISTA BARIEREK STARZEJE SIĘ W NAJGORSZĄ STRONĘ.** „Czego świadomie
   NIE MA" czyta się po to, żeby nie proponować rzeczy odrzuconych, więc jej
   nieaktualność nie daje błędu — **powstrzymuje przed czymś, co już stoi**.
   Trzy z dziesięciu pozycji bronią dziś zbudowanych pokojów. ⚠ Przegląd tego
   nie łapie, bo taka lista **wygląda na ponadczasową**.

27. ⚠⚠ **RZUTOWANIE TYPU WYŁĄCZA KOMPILATOR DOKŁADNIE NA STYKU DWÓCH DOMEN.**
   Identyfikator gatunku rzutowany na identyfikator przedmiotu jednym słowem
   sprawił, że rozjazd **11 do 5** nie zapalił ani kompilatora, ani żadnej
   bramki. ⭐ Krok do procedury: **każde rzutowanie identyfikatora z jednej
   domeny na identyfikator drugiej jest miejscem, w którym trzeba policzyć OBIE
   listy.**

28. ⚠⚠ **BRAK NIE JEST BŁĘDEM, WIĘC NIE ZOSTAWIA ŚLADU.** Sześć gatunków dodano
   w trzech miejscach z czterech; trzy są udokumentowane, czwarte nie zgłosiło
   się nigdzie, bo **nieobecny wpis nic nie generuje**. ⛔ Jedyną drogą było
   **policzenie dwóch list obok siebie**.

29. ⚠⚠ **DEPOZYT NIE JEST BEZPIECZNIEJSZY OD ŹRÓDŁA, Z KTÓREGO POWSTAŁ.**
   Depozyt „Zielarstwo jako bramka" powstał z **przykładu w komentarzu**,
   przeniesionego do tego pliku przy ekstrakcji `input` — takiej umiejętności
   nie ma. ⛔ Przepisanie zdania do checkpointu nadaje mu pozór ustalenia.
   ⭐ **Depozyt weryfikuje się w kodzie ODBIORCY, nie przyjmuje jako ustalenie
   nadawcy.**

30. ⭐ **PRZY GRANICY DOMEN PYTAJ O KOSZT ROZCIĘCIA, NIE O POKREWIEŃSTWO
   TEMATÓW.** „Czy `dialogue` jest częścią `quests`?" ma dwie obronne
   odpowiedzi i kod nie rozstrzyga żadnej. Rozstrzyga dopiero: **co dokładnie
   rozciąłby rozdział?** — a odpowiedzią był **jeden rekord danych** (NPC),
   nie mechanika. ⚠ Zależność mechanik była **jednokierunkowa**, czyli
   przemawiała za rozdziałem.

31. ⚠⚠ **REGUŁA BYWA KOMPLETNA W MECHANICE I PUSTA W TREŚCI.** Oddawanie
   zadania u innej osoby niż dawca jest wymuszane przez kompilator, rozdzielone
   w routingu i czytane przez marker — **i żadne z 15 zadań tego nie używa**.
   ⚙ To nie jest dryf (głębia przed zawartością jest przyjętym kosztem), ⚠ ale
   znaczy, że **reguła nigdy nie została WYKONANA** — a „zielone" i „nigdy nie
   uruchomione" wyglądają identycznie.

32. ⚠⚠ **ZGŁOSZENIE Z GRY OPISUJE OBJAW O DWIE WARSTWY DALEJ OD PRZYCZYNY.**
   Rekurencyjne wręczanie nagrody etapu (dodanie przedmiotu emituje zdarzenie,
   które wraca do trwającego przeliczenia) zostało zgłoszone jako **„żółte tło
   przy wręczaniu"** — jako błąd koloru. ⭐ Zgłoszenie z rozgrywki jest
   **kierunkiem, nie diagnozą**.

33. ⚠⚠ **POMIAR PO NAZWIE MECHANIZMU LICZY KOMENTARZE JAKO KOD.** Pierwsza
   klasyfikacja widżetów zaliczyła do interaktywnych ten, którego komentarz
   brzmi „deliberately NOT interactive". ⭐ Lustrzane odbicie reguły „nie ufaj
   komentarzom": komentarz był **prawdziwy**, zawiódł **pomiar**. Krok:
   **odsiej komentarze, zanim policzysz cokolwiek**.

34. ⚠⚠ **REGUŁA BYWA PRAWDZIWA, A JEJ ZASIĘG — DOMNIEMANY.** „Pole dotykowe ≥
   próg" jest poprawne; nieprawdziwe było milczące założenie, że dotyczy
   **interfejsu** — dotyczy **pięciu kontrolek**. ⭐ Krok: **przy każdym
   depozycie w formie reguły policz, ile bytów naprawdę obejmuje**.

35. ⚠⚠ **KATALOG JEST HISTORIĄ, NIE GRANICĄ.** Podział plików powstał, zanim
   istniało pojęcie domeny — 626 linii rysujących w przestrzeni świata leży
   w katalogu interfejsu i **nic tego nie zgłasza**. ⛔ Ekstrakcja idąca po
   katalogach opisałaby ten plik jako `ui`.

36. ⭐⭐ **GRANICA MOŻE MIEĆ EGZEKUTORA, KTÓRY NIE WIE, ŻE JEJ PILNUJE.**
   Zamrożona regresja walki jest testem **mechaniki** — i to ona wykrywa, że
   prezentacja weszła w symulację, bo każde ruszenie pozycją, czasem albo
   stanem zmienia jej wynik. ⭐ Najmocniejszy rodzaj przymiaru: świeci na
   czerwono z **innego powodu, niż został napisany**. ⛔ Szukanie „przymiaru
   dla prezentacji" po nazwie nie znalazłoby go nigdy.

37. ⚠⚠ **DEPOZYT BYWA FAŁSZYWY PRZEZ SĄSIEDZTWO W KODZIE, NIE PRZEZ BŁĄD.**
   Zatrzymanie czasu przy krytyku stoi **dwie linie od** wywołania cue,
   wygląda jak feedback i jest tak odczuwane — a wstrzymuje świat fizyki, więc
   jest **stanem gry**. ⭐ Bliskość w pliku wygląda jak przynależność.

38. ⭐ **MILCZENIE O NIEISTNIENIU MA WERSJĘ ODWROTNĄ — I TO JEST WZORZEC.**
   W `presentation` **cztery nieistniejące kanały są opisane wprost,
   z powodami**, więc pytanie „czemu nie ma tego w cue" ma odpowiedź, zanim
   ktoś je zada. ⚙ Do skopiowania do innych domen.

39. ⭐⭐ **DOMENA MOŻE NIE ISTNIEĆ, MIMO ŻE MA NAZWĘ, NARZĘDZIE I KOD.**
   `performance` ma pozycję na liście domen, własny plik pomiarowy, drugi plik
   z „benchmark" w nazwie i kilkanaście miejsc pisanych dla wydajności —
   a **nie ma stanu, konsumenta ani niezmiennika**, bo **pomiar nigdy nie
   wraca do gry**. ⭐ Krok do procedury: **pytaj, czy zmierzona wartość WRACA
   do systemu; jeśli nie, mierzysz narzędziem, a nie opisujesz mechaniki.**
   ⚙ „Wszystkie reguły mają właścicieli gdzie indziej" JEST dowodem pustki.

40. ⚠⚠ **NAZWA NARZĘDZIA TO NAJTAŃSZY FAŁSZYWY DOWÓD.** `combat_benchmark.mjs`
   (990 linii) mierzy **balans walki**, nie klatki — ekstrakcja szukająca
   wydajności po nazwach zaliczyłaby go jako dowód istnienia domeny.

41. ⚠ **DEPOZYT POTRAFI ODWRÓCIĆ SENS REGUŁY.** „Warstwa Y-sortowana
   przeliczana co klatkę" brzmi jak KOSZT; w kodzie ta warstwa jest
   **ograniczeniem kosztu** — istnieje po to, żeby sortować **jak najmniej**.
   ⛔ Zapisałem to tak sam, streszczając cudzy komentarz.

42. ⭐ **NAJWAŻNIEJSZA REGUŁA DOMENY BYWA TĄ, KTÓREJ NIKT NIE NAPISAŁ.**
   „Punkt na mapie to UPRAWNIENIE, nie byt" nie stało nigdzie — a bez niej
   trzy inne domeny wyglądają, jakby łamały mapę: puste stanowisko, brakująca
   elita i nieodrodzony przeciwnik czytają się jako błędy, dopóki nie wie się,
   że mapa **udziela prawa**, a nie stawia bytu.

43. ⚠⚠ **KLUCZ BEZ WERYFIKACJI JEST NAJCICHSZĄ AWARIĄ SERII.** Literówka
   w nazwie obiektu mapy nie daje błędu ani śladu — trzeci raz ta sama klasa,
   za każdym razem po innej stronie (gatunek zioła, odwołania zadań, mapa).

44. ⚠⚠ **REGUŁA JEDNOSTOPNIOWA POTRAFI UKRYĆ MECHANIZM TRÓJSTOPNIOWY.**
   „Brakujący plik po prostu degraduje" powtarza się w komentarzach i w routerze
   — i jest prawdziwe **w dwóch przypadkach na trzy**. Trzeci (odmowa
   zbudowania mapy przy braku arkusza terenu) jest **odwrotnością** tego zdania.
   ⭐ Krok: **przy regule „zawsze X" policz PRZYPADKI, nie potwierdzenia.**

45. ⚠⚠ **REGUŁA ISTNIEJĄCA TYLKO W OPISIE JEST NIEODRÓŻNIALNA OD MECHANIKI —
   dopóki nie zapyta się o EGZEKUTORA.** Zakaz cięcia arkusza po współrzędnych
   brzmi jak reguła kodu, jest zdaniem w `public/assets/README.md`, a jego
   złamanie już raz zaszło bez śladu. ⚙ Rozdział runtime / produkcja / dane /
   historia trzeba **narzucić z zewnątrz** — sam tekst go nie ujawnia.

46. ⭐⭐ **ARCHITEKTURY NIE DA SIĘ WYCIĄGNĄĆ Z KODU BEZ `STAN`-ów ANI ZE
   `STAN`-ów BEZ KODU.** Importy pokazują **połączenia**, nie **własność**;
   dokumenty pokazują **zamiar**, nie **rzeczywistość**. Zdanie „zapis jest
   jedynym modułem piszącym w cudzy stan" wymagało **policzenia zapisów**
   i **wiedzy, że każdy inny właściciel ma bramkę**.

47. ⚠⚠ **REGUŁA MOŻE BYĆ FUNDAMENTEM I NIGDY NIE ZOSTAĆ NAZWANA.** „Rdzeń jest
   czysty" stało w komentarzach jako uzasadnienie **pojedynczych modułów** —
   a jest **warunkiem istnienia całego aparatu przymiarów**. ⛔ Widać to
   dopiero z góry; żadna pojedyncza ekstrakcja nie mogła tego zobaczyć.

**Pozostałe, mniejsze:**

4. **Rozjazd bywa w drugą stronę** — dokument opisywał dług w kodzie, który
   zdążono spłacić tego samego dnia (`attributes`, R-1). „Jest dług" starzeje
   się tak samo jak „nie ma długu".
5. **Zamierzony model też bywa wewnętrznie sprzeczny** — `stamina` §24a podaje
   dwie liczby i mnożnik, który do nich nie pasuje. Tego **nie da się uśrednić**;
   to jest `OPEN`.
6. **Ostrzeżenie też ma być zmierzone.** Baner „nie cytuj liczb z tej tabeli"
   dopisany w Etapie 1 był za szeroki — rozbieżne były 2 pozycje z 12.
7. **Przymiar z fałszywymi alarmami nie będzie uruchamiany.** Pierwsza wersja
   `doc_check` dała 55 błędów; po naprawie pięciu klas fałszywych alarmów
   zostało 21 prawdziwych.

---

## DOMAIN ORDER

Kolejność ustalona w Etapie 2 i niezmieniona. **Nie układaj jej od nowa.**

```
 1. items         ✅ ZROBIONE
 2. attributes    ✅ ZROBIONE
 3. stamina       ✅ ZROBIONE
 4. armor         ✅ ZROBIONE
 5. shields       ✅ ZROBIONE  (potwierdzone: SĄSIEDZTWO `armor`, nie jej część —
                        scalenie dałoby dwie przeciwne reguły w jednym STAN-ie)
 6. proficiency   ✅ ZROBIONE
 7. combat        ✅ ZROBIONE  (⭐ jedna sesja — plan cięcia przed pisaniem)
                      ⚠ była największa: 8 dokumentów źródłowych, BRAK dokumentu-modelu.
                        Planuj dwie sesje. §4 audytu z 2026-09-03 to ~80% treści
 8. abilities     ✅ ZROBIONE
 —  effects       ✅ ZROBIONE poza kolejnością (27. domena, decyzja autora 2026-09-06)
 9. weapons       ✅ ZROBIONE  (⚠ „0,36 px" NIE rozstrzygnięte — `OI-40`, decyzja autora;
                      macierz świadomie NIE przegenerowana)
                      ⚠ pierwotnie: tu trzeba NA NOWO rozstrzygnąć „0,36 px" i przegenerować
                        docs/decyzje/2026-09-07-prog-zasiegu-orbity.md
10. progression + economy  ✅ ZROBIONE (dwa STAN-y — rozdział z odpowiedzialności)      (economy nie ma dziś ŻADNEGO dokumentu)
11. creatures + movement  ✅ ZROBIONE (dwie osobne domeny)
12. world + assets  ← NASTĘPNE
13. ui + input + presentation
14. gathering + audio + quests   (save ✅ ZROBIONE poza kolejnością)
15. architecture      ⚠ ostatnia — jest sumą wszystkich powyższych
```

⚠ **Kolejność jest po RYZYKU, nie po ważności.** Pierwsze cztery są małe
i sprawdzają metodę; `combat` i `weapons` wymagają decyzji projektowych.

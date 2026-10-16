---
typ: STAN
domena: architecture
tytul: Architektura — właściciele, granice, przepływ
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:combat_regresja]
kotwice:
  - src/core/EventBus.ts
  - src/core/InputState.ts
  - src/core/BackHandler.ts
  - src/core/Save.ts
  - src/scenes/GameScene.ts
  - src/config/GameConfig.ts
otwarte: [OI-82, OI-83]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Architektura — właściciele, granice, przepływ

> **Czym jest ten dokument.** **Mapą systemu**: kto jest właścicielem stanu,
> którędy płyną dane, jak wolno przekraczać granice i gdzie są wyjątki.
>
> **Czym NIE jest.** ⛔ **Nie jest spisem katalogów ani plików.** Katalog **nie
> determinuje domeny** — potwierdzone dwukrotnie *(kod prezentacji leży
> w katalogu interfejsu; reguły wydajności nie mają własnego katalogu ani
> domeny)*.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| kto jest właścicielem stanu i jak wolno go dotknąć | **`architecture`** |
| jakimi kanałami systemy rozmawiają | **`architecture`** |
| jak działa **konkretna** mechanika | jej własny `STAN` |
| co jest zawartością, a co systemem | ⚙ decyzja **SYSTEM ≠ CONTENT** |
| jak pisać dokumenty o tym wszystkim | `proces` *(kontrakt)* |

⚠⚠ **Ten dokument nie powtarza ani jednej reguły mechaniki.** Opisuje
**kształt**, w którym te reguły żyją.

---

## 1. Pięć warstw

```
DANE          liczby, roster, mapy, materiał        ← czytane, nigdy nie piszą
RDZEŃ         właściciele stanu, reguły             ← singletony przeżywające sceny
ORKIESTRACJA  scena gry: kolejność zdarzeń w klatce
POWIERZCHNIA  nakładka interfejsu + prezentacja
TRWAŁOŚĆ      zapis
```

⚠⚠ **Warstwy nie są katalogami.** Rozstrzyga **odpowiedzialność i cykl życia**:
rdzeń przeżywa przebudowę sceny, orkiestracja umiera z nią, powierzchnia żyje
tyle, ile stan albo zdarzenie, które pokazuje.

⭐ **Rdzeń jest w większości CZYSTY** — mniej więcej siedem plików na dziesięć
nie dotyka silnika. To nie jest estetyka: **czysty moduł da się uruchomić poza
grą**, a na tym stoją wszystkie przymiary tego projektu.

---

## 2. Właściciel stanu

⚠⚠ **Stan trwały należy do MODUŁOWYCH SINGLETONÓW — jest ich osiemnaście.**
Każdy przeżywa śmierć postaci, przebudowę sceny i przejście między mapami;
dlatego przejście może być przebudową od zera.

**Zasada jest jedna: jeden fakt ma jednego właściciela.** Konsekwencje widać
w każdej domenie — pojemność plecaka pisze wyłącznie ekwipunek, cooldown
zdolności zna wyłącznie ich rejestr, a pozycję na mapie trzyma migawka świata.

⚠ **Stan chwilowy NIE jest własnością nikogo trwałego** — cooldowny, efekty
i pozy giną razem ze sceną i **celowo nie trafiają do zapisu**.

⚠⚠ **Jest dokładnie jeden moduł, który pisze wprost w cudzy stan: ZAPIS.**
Odtwarzanie omija każdą bramkę zakładania i każdą regułę przyjmowania —
⛔ i dlatego jako jedyne **musi po sobie posprzątać** (§6, `OI-83`).

---

## 3. Cztery kanały przekraczania granic

| kanał | do czego | ile |
|---|---|---|
| **wywołanie wprost** | pytanie do właściciela: „czy mogę", „ile mam" | dominujący |
| **zdarzenie** | ogłoszenie faktu; nadawca nie wie, kto słucha | **40 rodzajów** |
| **wspólny stan** | intencja **ciągła** *(kierunek, bieg, atak trzymany)* | 1 moduł |
| **most jednopytaniowy** | ⚠ wyjątek: pytanie **w poprzek warstw** | **2** |

⚠⚠ **Kanał wybiera się po TRWANIU, nie po wygodzie.** Intencja ciągła wysłana
zdarzeniem gubi trzymanie; fakt chwilowy trzymany w stanie odpala się co klatkę.

⚠⚠ **Most jest ostatecznością i ma ścisłą postać**: jedno pytanie, odpowiedź
tak/nie, **zero stanu**, rejestrowany przez stronę, która wie więcej, zerowany
przy rozbiórce. ⭐ Oba istniejące mosty powstały z tego samego powodu: **pytanie
przecina warstwę, której zdarzenie nie przeskoczy** *(trafienie w świat z poziomu
nakładki, sprzętowy przycisk cofania z poziomu aplikacji)*.

⚠ **Interfejs nie sięga do sceny gry — zero wyjątków**, policzone.

---

## 4. Przepływy

**Wejście → rozgrywka**
```
urządzenie → intencja (stan albo zdarzenie) → scena → właściciel reguły
```
⚠ Arbitraż dotknięcia ustala **silnik**; kod ma prawo go najwyżej **powtórzyć**.

**Cios**
```
zamiar → rozstrzygnięcie (czyste dane) → skutki mechaniczne
                                       → cue → prezentacja → dźwięk
```
⚠⚠ **Rozstrzygnięcie jest DANYMI, nie wywołaniem.** ⛔ Prezentacja **nie może
zmienić pozycji, czasu ani stanu** — i to jest jedyna granica w projekcie
z **egzekutorem**: zamrożona regresja walki.

**Świat**
```
plik mapy → punkty (uprawnienia) → domeny bytów decydują, co powstanie
materiał → klucz tekstury → rysowanie
```
⚠ **Mapa mówi CO i GDZIE, materiał — CZYM narysować.** Wiązanie nazwy z mapy
z kluczem tekstury należy do świata; materiał **nie zna map**.

**Trwałość**
```
zmiana stanu → zdarzenie → zapis (migawki wszystkich właścicieli)
```
⚠ **Zapis czyta czternastu właścicieli** — największy zbieg zależności
w projekcie i **jedyne miejsce, które musi znać ich wszystkich**.

---

## 5. Zawartość a system

⚠⚠ **Granica przebiega przez PYTANIE, nie przez typ pliku:** system odpowiada
na „jak to działa", zawartość na „co jest w grze".

⚠ **Zawartość mieszka w danych i mapach; system nigdy jej nie wylicza.**
Roster broni, gatunków, zadań, ziół i materiału to dane — a `STAN` opisujący
je z nazwy byłby **drugim źródłem prawdy**.

⚠⚠ **Styk zawartości z systemem jest KLUCZEM — i klucz bywa rzutowany.**
Zmierzone: **czterdzieści trzy** rzutowania identyfikatora jednej domeny na
identyfikator drugiej. ⛔ Każde **wyłącza kompilator dokładnie na styku**,
w którym najłatwiej o rozjazd (`OI-82`).

⚠ **Konfiguracja jest największym węzłem projektu** — czyta ją mniej więcej
siedemdziesiąt plików. ⚙ To jest zamierzone *(„balans mieszka w konfiguracji,
nigdy w kodzie encji")*, ale znaczy, że **jej zmiana dotyka wszystkiego**.

---

## 6. Wyjątki, które trzeba znać

⚠⚠ **Cykl importów rdzenia jest ZNANY i bezpieczny warunkowo.** Dwa moduły
importują się wzajemnie; działa to **wyłącznie dlatego, że żaden nie dotyka
drugiego w czasie ładowania** — ⛔ przeniesienie odwołania na poziom modułu
zepsułoby start gry.

⚠⚠ **Odtwarzanie zapisu omija wszystkie bramki** i sprząta po sobie **jedną**
łatą normalizującą. ⚠ Pokrywa ona jedną regułę z wielu, które omija (`OI-83`).

⚠ **Scena gry jest ORKIESTRATOREM i jest duża** — blisko pięciu tysięcy linii,
kilkadziesiąt zależności. ⚙ Trzyma **kolejność zdarzeń w klatce**, a nie reguły:
te wyprowadzono do czystych modułów. ⛔ Opis stanu obecnego, nie postulat.

⚠ **Katalog kłamie dwa razy**: kod prezentacji leży w katalogu interfejsu,
a reguły wydajności nie mają ani katalogu, ani domeny — **są właściwością reguł
innych domen**.

---

## 7. Niezmienniki

- **N-259** — **jeden fakt ma jednego właściciela**; stan trwały mieszka
  w singletonach przeżywających sceny (§2).
- **N-260** — **stan chwilowy nie trafia do zapisu** (§2).
- **N-261** — **kanał wybiera się po TRWANIU faktu**, nie po wygodzie (§3).
- **N-262** — **most jest jednopytaniowy, bezstanowy i zerowany przy
  rozbiórce**; ⛔ jest ostatecznością (§3).
- **N-263** — **interfejs nie sięga do sceny gry** (§3).
- **N-264** — **rozstrzygnięcie jest danymi**; ⛔ prezentacja nie zmienia
  pozycji, czasu ani stanu (§4).
- **N-265** — **arbitraż wejścia należy do silnika**; kod może go powtórzyć,
  nie podmienić (§4).
- **N-266** — **czysty rdzeń jest warunkiem istnienia przymiarów** (§1).
- **N-267** — **zawartość mieszka w danych**; system jej nie wylicza (§5).
- **N-268** — **cykl importów wolno mieć tylko wtedy, gdy żadna strona nie
  dotyka drugiej przy ładowaniu** (§6).
- **N-269** — **kto omija bramki, sprząta po sobie** (§6).
- **N-270** — **katalog nie determinuje domeny**; rozstrzyga odpowiedzialność
  i cykl życia (§1, §6).

---

## 8. Checklista

**Nowy system:** ⚠ wskaż **właściciela stanu**, zanim napiszesz pierwszą linię
(N-259) · ⚠ wybierz kanał po **trwaniu faktu** (N-261) · ⛔ nie dodawaj mostu,
dopóki zdarzenie wystarcza (N-262) · ⚠ trzymaj reguły w **czystym module**
(N-266).

**Nowa zależność między domenami:** ⚠ zapytaj, czy nie omijasz **właściciela**
· ⛔ jeśli rzutujesz identyfikator, **policz obie listy** (`OI-82`).

**Nowy stan trwały:** ⚠ dopisz go do zapisu jako **pole opcjonalne**
*(reguła należy do `save`)* · ⚠ sprawdź, czy odtworzenie nie omija bramki,
która ma znaczenie (N-269).

**Nowy dokument domeny:** ⚙ jeden `STAN` na domenę, granice jawne, zawartość
poza nim *(kontrakt)*.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/combat_regresja.mjs` *(egzekutor granicy prezentacji)* ·
`node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| pięć warstw po odpowiedzialności, nie po katalogu | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| osiemnaście właścicieli stanu | ✅ | ✅ | `kod:2026-09-06` |
| czysty rdzeń jako podstawa przymiarów | ✅ | ✅ | ⭐ **7 plików rdzenia na 10** |
| cztery kanały granic | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| most jednopytaniowy jako ostateczność | ✅ | ✅ | ⭐ **dokładnie dwa** |
| interfejs nie sięga do sceny | ✅ | ✅ | ⭐ **zero wyjątków** |
| granica prezentacji | ✅ | ✅ | ✅ `przymiar:combat_regresja` |
| zapis jako jedyny piszący w cudzy stan | ⚙ **świadomy wyjątek** | ✅ | ⚠ **jedna łata, wiele omijanych bramek** — OI-83 |
| **rzutowania na styku domen** | ⚙ **43, nienadzorowane** | ✅ *(policzone po raz pierwszy)* | ❌ — OI-82 |
| cykl importów rdzenia | ⚙ **znany, warunkowo bezpieczny** | ✅ | ❌ **brak przymiaru** |
| stary dokument architektury | ⛔ martwy | ✅ | ✅ `HISTORIA` + następca w nagłówku (2026-09-07) |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-81** | ✅ **ZAMKNIĘTE 2026-10-09** — rozstrzygnięte wariantem pierwszym już przy migracji 2026-09-07: nagłówek `typ: HISTORIA`, `stan: zastapiony`, `zastapione-przez: docs/systemy/architecture.md`, baner na górze. Przegląd odwołań 2026-10-09: `CLAUDE.md` i `README.md` oznaczają go jako zastąpiony, `ekstrakcja_save` (S-1) i decyzja 09-07 to zapis historyczny — **żadne nie cytuje go jako reguły**. |
| **OI-82** | ⚠⚠ **Czterdzieści trzy rzutowania identyfikatora jednej domeny na identyfikator drugiej — każde wyłącza kompilator dokładnie na styku.** Tą drogą przeszło już jedno realne znalezisko *(gatunek bez wpisu przedmiotu — zebranie kończy się błędem)*. ⚙ Rzutowanie jest tu **konieczne**: dane są zamrożone jako literały, więc listy nie mają wspólnego typu. ⛔ **Decyzja AUTORA**: czy styki mają dostać wspólny mechanizm, czy zostają z regułą „policz obie listy". ⛔ Przymiaru nie zbudowałem. |
| **OI-83** | ⚠ **Odtwarzanie zapisu omija każdą bramkę, a sprząta po sobie JEDNĄ łatą.** Dziesięć bezpośrednich zapisów w cudzy stan, po których uruchamiana jest normalizacja pokrywająca **jedną** regułę *(dwuręczność)*. ⚙ Pozostałe bramki *(wymagania atrybutów, pojemność, reguły stosu)* **nie są sprawdzane po odtworzeniu** — dziś bezpiecznie, bo zapis powstał z legalnego stanu. ⚠ Przestanie być bezpieczne przy pierwszej zmianie reguły, która unieważni **istniejące** zapisy. ⛔ **Decyzja AUTORA**: czy odtworzenie ma weryfikować więcej. |

---

## Czego ten dokument nie rozstrzyga

- **Jak działa którakolwiek mechanika** — to jest `STAN` jej domeny.
- **Żadnej konkretnej broni, zdolności, stworzenia, mapy ani pliku** — to jest
  zawartość.
- **Czy architektura jest ładna** — opisuję **stan rzeczywisty**, nie postulat.
- **Docelowego podziału sceny gry** — jej rozmiar jest opisany jako CURRENT.
- **Jak pisać dokumenty** — to jest kontrakt dokumentacji.
- ~~Losu starego dokumentu architektury~~ — `OI-81` zamknięte 2026-10-09 (`HISTORIA`).

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| kanały, zdarzenia i ich cykle życia | `src/core/EventBus.ts` *(przy kodzie)* | ACTIVE |
| dlaczego most, a nie sięgnięcie do sceny | `src/core/InputState.ts`, `src/core/BackHandler.ts` | ACTIVE |
| dlaczego odtwarzanie omija bramki i co po sobie sprząta | `docs/systemy/save.md` §7 | ACTIVE |
| granica prezentacji i jej egzekutor | `docs/systemy/presentation.md` §0.1 | ACTIVE |
| katalog nie determinuje domeny | `docs/systemy/ui.md` §0.1, `docs/proces/ekstrakcja_performance.md` | ACTIVE |
| SYSTEM ≠ CONTENT | `docs/decyzje/2026-09-05-system-vs-content.md` | ACTIVE |
| reguły przy kodzie, katalog po katalogu | `src/*/CLAUDE.md` | ACTIVE |
| **stary opis architektury** | `docs/architektura.md` | ⛔ **`HISTORIA`, zastąpiony** — `OI-81` zamknięte |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_architecture.md` | — |

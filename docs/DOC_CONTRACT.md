---
typ: OPERACYJNE
domena: proces
tytul: Kontrakt dokumentacji
stan: zywy
implemented: nd
documented: tak
verified: [przymiar:doc_check]
kotwice: [tools/doc_check.mjs]
otwarte: [OI-1, OI-5]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Kontrakt dokumentacji

> **Czym jest ten plik.** Regułami, według których powstaje i żyje KAŻDY
> dokument w `docs/`. Nie opisuje gry — opisuje, jak wolno o niej pisać.
>
> **Po co powstał.** Audyt 2026-09-05 pokazał, że dokumentacja tego projektu
> jest rzetelna, ale rośnie **chronologicznie** (jeden dokument = jedna sesja),
> a czytana jest **dziedzinowo** (jedno pytanie = jedna mechanika). Skutek:
> żeby ustalić „jak działa walka", trzeba przeczytać osiem plików i wiedzieć,
> które akapity w każdym z nich są martwe. Ten kontrakt rozdziela role, które
> dziś siedzą w jednym pliku.
>
> ⚙ **Migracja jest ZAMKNIĘTA (2026-09-07).** Do tego dnia zdanie brzmiało
> „ten plik nie migruje niczego" i było prawdziwe. Dziś **każdy dokument
> w `docs/` ma nagłówek maszynowy**, więc kontrakt obowiązuje w całym
> katalogu, nie tylko dla nowych plików. Dokumenty zostały sklasyfikowane
> **w miejscu** — żadnego nie przeniesiono i żadnego nie usunięto; powód
> i odrzucone warianty:
> `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md`.

---

## 1. Hierarchia źródeł — czytaj to najpierw

```
KOD           co faktycznie istnieje, jakie ma symbole, parametry i ścieżki
  ↑           ⚠ ŹRÓDŁO PRAWDY DLA FAKTÓW IMPLEMENTACYJNYCH
  │
STAN          jak działa DZIŚ mechanika gry — model projektowy, nie kopia kodu
  ↑
DECYZJA       dlaczego wybraliśmy taki model
  ↑
HISTORIA      jak i kiedy do tej decyzji doszliśmy
```

Trzy konsekwencje, które rozstrzygają większość sporów o to, gdzie coś wpisać:

1. ⚠ **Dokument STAN nie jest kopią kodu.** Kod odpowiada na „co jest
   zaimplementowane i jak"; STAN odpowiada na „jak ta mechanika działa
   z punktu widzenia projektu gry". Jeśli zdanie da się sprawdzić wyłącznie
   przez `grep`, prawdopodobnie należy do kodu, nie do STANU.
2. ⚠ **Dokument STAN nie jest dziennikiem.** Zdanie zaczynające się od
   „wcześniej było…", „zmieniliśmy…", „po sesji X…" jest zawsze w złym pliku.
3. ⚠ **Dokument historyczny nie jest źródłem stanu.** Wolno z niego brać
   decyzje, uzasadnienia, ograniczenia, pomiary i wiedzę o tym, czego już
   próbowano. Nie wolno brać odpowiedzi na „jak jest dziś".

---

## 2. Typy dokumentów

Sześć typów. **Nie dodawaj siódmego bez decyzji** — każdy kolejny typ osłabia
regułę, która ten system w ogóle utrzymuje (§2.7).

### 2.1 `STAN`

**Odpowiada na:** jak działa dziś mechanika gry w tej dziedzinie.

**Kotwiczony w:** kodzie. Każde twierdzenie o mechanice ma symbol, plik albo
pole konfiguracyjne, które przymiar potrafi sprawdzić.

**Zasady:**
- **Dokładnie jeden `STAN` na domenę.** Dwa to dwa źródła prawdy — czyli zero.
- Zero historii, zero dat w treści, zero „poprzedni model".
- ⚠⚠ **SYSTEM jest dokumentem, CONTENT jest danymi.** `STAN` opisuje reguły,
  strukturę danych, zależności, niezmienniki, granice domeny i **sposób, w jaki
  content korzysta z systemu**. Konkretne elementy — miecze, topory,
  umiejętności, przedmioty, stworzenia, NPC-e — **nie dostają własnego `STAN`u
  tylko dlatego, że istnieją**; ich parametry żyją w danych i w `GENEROWANE`.
  ⚠ **Wyjątek:** jeśli dodanie elementu **zmieniło albo ujawniło regułę
  SYSTEMU**, dokumentujemy tę zmianę jako `DECYZJA` lub `HISTORIA` — nigdy jako
  `STAN` elementu. („Włócznia ma zasięg 98" → dane · „Włócznia ujawniła regułę
  progu trafienia" → `DECYZJA` · „Jak działa próg trafienia dla wszystkich
  broni" → `STAN`.) Powód i odrzucone warianty:
  `docs/decyzje/2026-09-05-system-vs-content.md`.
- Liczba projektowo istotna (próg, punkt neutralny, sufit) wolno wpisać, ale
  **z kotwicą**, żeby przymiar mógł ją porównać z konfigiem.
- Obowiązkowe sekcje: `## Pokrycie`, `## Otwarte`, `## Czego ten dokument nie rozstrzyga`.

### 2.2 `KANON`

**Odpowiada na:** jak wygląda świat i według jakich reguł powstaje jego materiał.

**Kotwiczony w:** decyzji autora. Kodu tu nie ma i przymiar go nie sprawdza.

**Zasady:**
- Świat, fabuła, obsada, geografia, styl wizualny, reguły produkcji assetów.
- ⚠ **`KANON` nie opisuje mechaniki.** „Szary jest antagonistą prologu" — kanon.
  „Szary ma 190 HP i wpada w szał poniżej 40%" — STAN. Tabela „co już jest
  w grze" wewnątrz dokumentu kanonicznego jest **naruszeniem kontraktu**;
  odpowiada za to indeks (§6).
- Zmienia się rzadko i nigdy „przy okazji" sesji kodowej.

### 2.3 `DECYZJA`

**Odpowiada na:** dlaczego model wygląda tak, a nie inaczej.

**Zasady:**
- **Jedna decyzja = jeden plik.** Jeśli plik rozstrzyga dwie sprawy, to są dwa pliki.
- ⚠ **Niezmienna po zamknięciu.** Zmiana zdania to NOWA decyzja z polem
  `zastepuje`. Edytowanie zamkniętej decyzji kasuje jedyny zapis tego, co
  obowiązywało wcześniej — i sprawia, że „odrzucone" cicho znika.
- Musi zawierać: co rozstrzygnięto, **co ODRZUCONO i dlaczego**, jaki pomiar
  albo argument to przesądził, i co z tego zostaje otwarte.
- Decyzja negatywna („celowo tego nie budujemy") jest pełnoprawną decyzją.
- ⚠⚠ **Pole `moc` mówi, czy decyzja NADAL OBOWIĄZUJE — niezależnie od `stan`.**
  **Ocenia się je względem KODU i późniejszych decyzji, nigdy względem tego,
  jak stanowczo dokument jest napisany.** Zmiana samej `moc` nie jest edycją
  decyzji. Definicja: `docs/decyzje/2026-09-05-moc-decyzji.md`.

### 2.4 `HISTORIA`

**Odpowiada na:** jak i kiedy do tego doszliśmy.

**Zasady:**
- Etapy prac i dziennik sesji. **Tylko dopisywanie** — nie przepisujemy przeszłości.
- Data jest treścią, nie metadanymi.
- ⚠ **Nigdy nie jest cytowana jako stan gry.** Wolno cytować jako źródło
  pomiaru, uzasadnienia albo „próbowaliśmy tego i nie zadziałało".
- Dziennik to `HISTORIA` ze `stan: zywy`; zamknięty etap ma `stan: zamkniety`.

### 2.5 `GENEROWANE`

**Odpowiada na:** jakie są aktualne liczby.

**Zasady:**
- Pisane przez skrypt z `tools/`. Pole `generator` w nagłówku jest obowiązkowe.
- ⚠ **Ręczna edycja liczby w takim pliku jest błędem**, nie skrótem — zniknie
  przy następnym przebiegu, a do tego czasu będzie kłamać.
- Proza wokół bloków `<!-- AUTO:… -->` jest ręczna i generator jej nie dotyka.
- Ten typ ma **pierwszeństwo przed `STAN`** we wszystkim, co jest liczbą.

### 2.6 `OPERACYJNE`

**Odpowiada na:** co robimy dalej i jak coś zrobić.

**Zasady:**
- Plan, parking, pomysły, indeks, konsola deweloperska, prompty do generatorów.
- ⚠ **Nigdy nie jest źródłem prawdy o mechanice.** Prompt do Gemini i lista
  odłożonych rzeczy mają tę samą własność: mówią o pracy, nie o grze.
- Zmienia się najczęściej ze wszystkich typów i to jest normalne.

### 2.7 `INSTRUKCJA_KODU` — kategoria graniczna, świadomie POZA kontraktem

Zagnieżdżone `src/*/CLAUDE.md` i `tools/CLAUDE.md` (~93 KB) **nie są
dokumentami w rozumieniu tego kontraktu** i nie dostają nagłówka maszynowego.
Powód i odrzucone warianty: `docs/decyzje/2026-09-05-instrukcje-przy-kodzie.md`.

Obowiązuje je **jedna reguła**:

> ⚠ **Instrukcja przy kodzie może opisywać REGUŁĘ i NIEZMIENNIK, ale nie może
> być jedynym miejscem, w którym opisana jest MECHANIKA.** Tam, gdzie dotyka
> mechaniki, wskazuje `STAN` swojej domeny zamiast go streszczać.

⚠ **`doc_check.mjs` skanuje te pliki** (reguły `§S` i `§P`), mimo że są poza
kontraktem — powód jest zmierzony i stoi w pliku decyzji.

### 2.8 Reguła, która trzyma cały system

> **Tylko `STAN` opisuje dzisiejszą mechanikę gry.**

Pięć pozostałych typów mówi o świecie, o powodach, o przeszłości, o liczbach
albo o pracy. Jeśli mechanika zaczyna być opisywana w drugim miejscu, system
pada — i to jest dokładnie mechanizm, który wyprodukował obecny stan
(status Mastery w trzech plikach, trzy różne wymiary tego samego arkusza).

---

## 3. Nagłówek maszynowy

Front-matter YAML **na samej górze pliku**, przed nagłówkiem `#`.

```yaml
---
typ: STAN
domena: stamina
tytul: Stamina — model wysiłku
stan: zywy
implemented: tak
documented: tak
verified: [przymiar:stamina_weryfikacja, reka:2026-08-21]
kotwice:
  - src/core/Stamina.ts
  - GameConfig.STAMINA.regenPerSecond
otwarte: [OI-12]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---
```

| pole | wartości | wymagane w |
|---|---|---|
| `typ` | `STAN` · `KANON` · `DECYZJA` · `HISTORIA` · `GENEROWANE` · `OPERACYJNE` | wszędzie |
| `domena` | identyfikator z §4 (`DECYZJA`/`HISTORIA` mogą mieć listę) | wszędzie |
| `tytul` | krótka nazwa, bez daty | wszędzie |
| `stan` | `zywy` · `zamkniety` · `zamrozony` · `zastapiony` | wszędzie |
| `implemented` | `tak` · `czesciowo` · `nie` · `nd` | `STAN` |
| `documented` | `tak` · `czesciowo` · `nieaktualne` · `nie` | `STAN` |
| `verified` | lista `metoda:identyfikator` albo `[]` | `STAN` |
| `kotwice` | ścieżki `src/…`, `tools/…` oraz pola `GameConfig.…` | `STAN`, `GENEROWANE` |
| `otwarte` | identyfikatory otwartych problemów (`OI-n`, `D-n`) | opcjonalne |
| `zastepuje` / `zastapione-przez` | ścieżki | opcjonalne |
| `generator` | ścieżka do skryptu | `GENEROWANE` |
| `moc` | `ACTIVE` · `SUPERSEDED` · `REJECTED` · `HISTORICAL` · `OPEN` | `DECYZJA` |
| `data` | `RRRR-MM-DD` — data rozstrzygnięcia | `DECYZJA` |
| `aktualizacja` | `RRRR-MM-DD` | wszędzie |

⚠ **`stan` dotyczy DOKUMENTU, nie mechaniki.** `zamkniety` = nie będzie już
zmieniany (etap, decyzja). `zamrozony` = zostaje jako materiał historyczny,
nigdy nie czytać jako stanu. `zastapiony` = wskazuje następcę i nic więcej.

---

## 4. Domeny

Kanoniczna lista. **Jedna domena = najwyżej jeden dokument `STAN`.** Domena
bez dokumentu `STAN` jest legalnym stanem świata i indeks ma ją pokazywać jako
lukę, a nie pomijać.

```domeny
combat: walka — rozstrzyganie ciosu, geometria, pipeline
weapons: broń — rodziny, warianty, zasięg, tożsamość
armor: pancerz i typy obrażeń
shields: tarcze i blok kierunkowy
abilities: umiejętności czynne
effects: efekty czasowe i ich księgowość
proficiency: biegłość, praktyka i Mastery
attributes: atrybuty postaci
stamina: wysiłek i obciążenie
progression: XP, poziomy, punkty rozwoju
economy: złoto, ceny, loot, sklepy
items: przedmioty, jakość wykonania, trwałość
inventory: plecak, sloty, torby
gathering: zbieractwo i gotowanie
creatures: bestiariusz i zachowania przeciwników
movement: ruch, nawigacja, PathSolver, NavGrid
world: mapy, lokacje, portale
quests: zadania, dialogi, NPC
ui: panele, HUD, wzorce interakcji
input: sterowanie, gałka, ergonomia mobilna
presentation: feedback walki, efekty, kamera
audio: dźwięk i muzyka
save: zapis stanu i migracje
performance: wydajność i optymalizacja mobilna
architecture: warstwy kodu i kontrakty między nimi
assets: assety, arkusze, styl wizualny
render3d: obraz świata w 3D — scena, kamera, modele, zasłony
proces: dokumentacja, plan, narzędzia deweloperskie
```

⚠ **Nie dodawaj domeny, żeby zmieścić jeden dokument.** Domena jest jednostką,
o którą ktoś pyta („jak działa X"), a nie półką na pliki. ⚠⚠ **Rozszerza się wyłącznie
decyzją z dowodami** (§12).

---

## 5. IMPLEMENTED / DOCUMENTED / VERIFIED

Trzy **niezależne** osie. Rozjazd między nimi nie jest błędem — błędem jest
brak możliwości jego wykrycia.

| oś | pytanie | kto rozstrzyga |
|---|---|---|
| **IMPLEMENTED** | czy mechanika istnieje w kodzie | kod |
| **DOCUMENTED** | czy istnieje aktualny dokument `STAN`, który ją opisuje | dokument + przymiar |
| **VERIFIED** | czy została sprawdzona właściwą metodą | przymiar / człowiek |

**Metody weryfikacji** (słownik zamknięty, rozszerzać decyzją):

| metoda | znaczenie |
|---|---|
| `kod` | odczytane wprost ze źródła — symbol/wartość istnieje |
| `przymiar:<nazwa>` | pilnuje tego skrypt z `tools/` |
| `reka:<data>` | playtest człowieka |
| `render:<data>` | obejrzany złożony obraz — obowiązkowe dla wszystkiego graficznego |

**Stany legalne.** `IMPLEMENTED ✅ · DOCUMENTED ⚠ · VERIFIED ❌` jest w tym
projekcie **normalny**: budżet sesji poszedł na analizę i implementację, a
dokumentacja nie została dociągnięta. Kontrakt tego nie zakazuje — wymaga
tylko, żeby dało się to zobaczyć w indeksie.

⚠ **`documented` jest deklaracją i wolno jej nie ufać.** Dlatego przymiar
wylicza własną ocenę niezależnie: jeśli którakolwiek kotwica dokumentu nie
istnieje w kodzie, `documented` jest **najwyżej `czesciowo`**, niezależnie od
tego, co wpisano w nagłówku. To jest jedyny mechanizm, który zamienia
„dokumentacja się zestarzała" z rzeczy niewidocznej w rzecz świecącą na
czerwono. Dokładnie ten przypadek — pole `critChancePerAgility` usunięte
z kodu, twierdzenie zostało w `zaimplementowane.md` na trzy tygodnie.

**Sekcja `## Pokrycie` w dokumencie `STAN`** rozbija trójkę na mechaniki:

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| blok kierunkowy — trzy strefy | ✅ | ✅ | `przymiar:combat_regresja` |
| `sideZoneMul = 0,50` | ✅ | ✅ | ❌ czeka na `reka` |

Pole w nagłówku jest **zwinięciem** tej tabeli: `czesciowo`, jeśli którykolwiek
wiersz nie jest pełny.

---

## 6. Linkowanie

Jedna reguła: **link wolno kierować do dokumentu, który zmienia się RZADZIEJ
albo tak samo rzadko. Nigdy w stronę czegoś bardziej zmiennego.**

```
OPERACYJNE  →  STAN  →  GENEROWANE  →  KANON  →  DECYZJA  →  HISTORIA
   (najbardziej zmienne)                            (niezmienne)
```

Dlaczego akurat tak: link „w górę" wymusza edycję dokumentu mniej zmiennego za
każdym razem, gdy zmieni się ten bardziej zmienny — czyli edycję zamkniętej
`DECYZJI`. Tak umiera niezmienność.

Skutki praktyczne:
- `STAN` linkuje do `DECYZJI` („dlaczego") i do `HISTORII` („kiedy"). ✅
- `DECYZJA` **nie linkuje do `STANU`**. Wskazuje domenę, nie plik. ✅
- `KANON` **nie linkuje do `STANU`** — a więc nie może nieść tabeli „co już
  jest w grze". Od tego jest indeks.
- `OPERACYJNE` linkuje wszędzie — jest najbardziej zmienne, więc nie łamie reguły.
- ⛔ **Do dokumentu `zamrozony` nie linkuje nic jako do źródła.** Wolno go
  wymienić w `zastepuje` następcy i tyle.

---

## 7. Kryteria odbioru dokumentu `STAN`

Dokument jest gotowy, gdy przechodzi **wszystkie osiem**:

1. Odpowiada wyłącznie na „jak to działa dziś". Zero zdań o poprzednich modelach.
2. Ma nagłówek maszynowy z kompletem pól z §3.
3. Każdy symbol z `kotwice` istnieje w `src/`, `tools/` albo `GameConfig` —
   sprawdza `tools/doc_check.mjs`.
4. Żadna liczba będąca zawartością (roster, cennik) nie jest przepisana ręcznie.
5. Ma `## Pokrycie` z rozbiciem na mechaniki.
6. Ma `## Otwarte` i `## Czego ten dokument nie rozstrzyga`.
7. Mieści się w limicie z §8.
8. Jest jedynym `STAN`-em dla swojej domeny.
9. **Opisuje SYSTEM, nie elementy.** Żaden element contentu nie ma własnego
   `STAN`-u, a jego rekordy są w danych albo w `GENEROWANE` (§2.1).

⚠ **Kryterium 6 nie jest formalnością.** Sekcja „czego nie rozstrzyga" jest
tym, co powstrzymuje następną sesję przed potraktowaniem milczenia dokumentu
jako zgody.

---

## 8. Rozmiar i podział

| typ | limit | ostrzeżenie |
|---|---|---|
| `STAN` | 20 KB | 16 KB |
| `KANON` | 40 KB | 32 KB |
| `DECYZJA` | 12 KB | 10 KB |
| `OPERACYJNE` | 20 KB | 16 KB |
| `HISTORIA`, `GENEROWANE` | bez limitu | — |

Limit jest **mechanizmem poprawności, nie estetyką**: dokument, którego nikt
nie czyta w całości, zaczyna sobie przeczyć.

**Kolejność cięcia przy przekroczeniu — w tej kolejności, nie dowolnej:**

1. historia i relacje z wykonania → `HISTORIA`,
2. uzasadnienia i odrzucone warianty → `DECYZJA`,
3. tabele liczbowe → `GENEROWANE`,
4. dopiero potem podział domeny na poddomeny.

⚠ **Przekroczenie limitu jest BŁĘDEM przymiaru tylko dla `STAN`** — bo tylko
tam §7 czyni limit warunkiem odbioru. Dla `KANON`, `DECYZJA` i `OPERACYJNE`
`tools/doc_check.mjs` zgłasza OSTRZEŻENIE z nazwą pliku: widoczne i policzone,
ale nieblokujące. Rozstrzygnięcie:
`docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md`.

⛔ **Nie dziel `STANU` na „część 1 / część 2".** To tworzy dwa źródła prawdy
dla jednej domeny, czyli dokładnie to, czemu ten kontrakt zapobiega.

---

## 9. Informacje pochodzące z kodu

| rodzaj informacji | gdzie mieszka | jak trafia do dokumentu |
|---|---|---|
| nazwa pola, sygnatura, ścieżka wykonania | **kod** | kotwica, nie przepisanie |
| wartość liczbowa z `GameConfig` | **kod** | tylko jeśli jest progiem projektowym — z kotwicą |
| roster, cennik, tabela wariantów | **kod** | wyłącznie przez `GENEROWANE` |
| próg / punkt neutralny / sufit | STAN, z kotwicą | przymiar porównuje z konfigiem |
| pomiar (dps, czas, dystans) | STAN albo DECYZJA | **z podaniem metody pomiaru** |
| odczucie, czytelność, tempo | STAN | wyłącznie jako `verified: reka:<data>` |

⚠ **Pomiar wpisany do dokumentu też się starzeje.** Projekt ma to zapisane
jako regułę wyciągniętą na sobie (`odlozone.md`): zaparkowane „−15 ms" po
przeliczeniu wyszło „+72 ms". Każdy pomiar w dokumencie ma datę i metodę,
albo nie ma go wcale.

---

## 10. Daty i wersjonowanie

- ⛔ **Zero sufiksów `v1` / `v2` / `final` / `nowy` / `stary` w nazwach plików.**
  Ten projekt ma dowód, że nie działają: `bron_design_v1.md` (usunięty) i
  `las_faza1b_final.md` opisują dziś stan częściowo nieobowiązujący, a nazwa
  sugeruje coś przeciwnego.
- ⛔ **Zero dat w nazwie pliku poza typami `DECYZJA` i `HISTORIA`.** Data
  w nazwie pliku `STAN` jest sygnałem, że plik jest w złym typie.
- `STAN`, `KANON`, `OPERACYJNE` — data wyłącznie w polu `aktualizacja`.
- `DECYZJA` — data rozstrzygnięcia w polu `data`; wolno ją mieć też w nazwie.
- `HISTORIA` — data jest treścią.
- **Wersjonowaniem jest git.** Dokument nie ma numeru wersji.
- Zmiana modelu = nowa `DECYZJA` + edycja `STANU`. Nie „nowa wersja dokumentu".

---

## 11. Ciągłość pracy (przepisane 2026-10-11)

> Poprzednie brzmienie („zmiana stanu gry aktualizuje dokładnie dwa pliki")
> nie przetrwało praktyki: jedna zmiana dotykała do 18 plików dokumentacji,
> bo status siedział w routerach, checkpointach i wierszach rejestru naraz.
> Ta sekcja usuwa te miejsca, zamiast prosić o dyscyplinę.

**Gdzie co mieszka — każda informacja ma JEDNO miejsce:**

| informacja | miejsce |
|---|---|
| od czego zacząć, aktywne wątki, następny krok, pytania do autora | `docs/current.md` — jedyny punkt wejścia, aktualizowany w miejscu, ≤ 10 KB |
| jak działa mechanika | `STAN` domeny |
| przebieg i stan jednego wątku (wieś, bandyci, grafika…) | **dokument wątku** — stała nazwa bez daty, sekcja stanu na górze |
| dlaczego tak | `DECYZJA` (jedna sprawa = jeden plik) |
| sprawa otwarta / zamknięta | wiersz-etykieta w `zadania.md` / dosłownie w `issues_archive.md` |
| co się działo | jeden krótki wpis w `dziennik.md` z adresem szczegółów |

**Reguły, które to utrzymują** (egzekwuje `tools/doc_check.mjs`):

- ⛔ **§W — tylko `docs/current.md` mówi „zaczynasz tu".** Nie powstają
  checkpointy ani handoffy z datą w nazwie: wersjami punktu wejścia jest
  git (`git log -p docs/current.md`). Dokument wątku jest punktem wejścia
  WĄTKU — prowadzi do niego `current.md` §2.
- ⛔ **§B — budżety plików czytanych co sesję:** `CLAUDE.md` 28 KB,
  `docs/README.md` 24 KB, `docs/current.md` 10 KB. Router mówi „gdzie",
  nie „jak jest" — status dopisany do routera to drugi punkt wejścia.
- ⛔ **§Z2 — w `zadania.md` › AKTYWNE nie ma spraw zamkniętych**, a wiersz
  ma najwyżej 700 znaków. Opis należy do dokumentu z kolumny „gdzie".
- **§I — nowy dokument dostaje wiersz w indeksie w tej samej sesji.**
- **§A — punkt wejścia nadąża za pracą:** najnowszy wpis dziennika może
  wyprzedzać `aktualizacja` w `current.md` najwyżej o 7 dni. Liczą się daty
  w repo, nie kalendarz — przerwa w pracy nie świeci. Naprawa: przejrzyj
  `current.md`; jeśli mówi prawdę, podbij datę.
- **§D — każdy katalog `src/` ma kotwicę w jakimś `STAN`** albo wpis
  w `BEZ_STAN` (w `tools/doc_check.mjs`) z powodem. Reguła na poziomie
  katalogu, nie pliku — plik zawartości nie potrzebuje `STAN` (§2.1).

**Cykl życia dokumentu wątku:** powstaje razem z wierszem w `current.md` §2 →
żyje (sekcja stanu na górze, przebieg niżej albo w osobnym pliku `HISTORIA`,
jak `postac3d_checkpoint.md` + `postac3d_historia.md`) → przy zamknięciu
dostaje `stan: zamkniety`, a wiersz przechodzi do „Zamknięte" w `current.md`.
Dokument, który przestał być aktualny, a był snapshotem chwili, zmienia typ
na `HISTORIA` i dostaje baner — nie jest usuwany.

**Nowy podsystem w kodzie** (nowy katalog w `src/` albo zachowanie, o które
nikt nie zapyta przez istniejący `STAN`) → w tej samej sesji `STAN`
(z decyzją o domenie, §4) albo wiersz `OI` kategorii DOCUMENTATION.
Lukę `render3d` (kod domyślny od 2026-10-06, opis od 2026-10-11) zostawiła
właśnie nieobecność tej reguły.

**Zamknięcie etapu:** przegeneruj `GENEROWANE` → zaktualizuj `STAN`
(pokrycie I/D/V) albo dokument wątku → wpis w dzienniku → `current.md`
→ `node tools/doc_check.mjs` zielone.

---

## 12. Rozstrzygnięcia zapisane osobno

Kontrakt niesie **regułę**, decyzja niesie **powód** (§2.3).

| decyzja | co rozstrzyga | reguła w tym pliku |
|---|---|---|
| `docs/decyzje/2026-09-05-struktura-docs.md` | `OI-4` — `docs/` dostaje podkatalogi, płaski eksport robi `tools/doc_export.mjs` | §10 (łącza od korzenia repo) |
| `docs/decyzje/2026-09-05-instrukcje-przy-kodzie.md` | `OI-6` — `src/*/CLAUDE.md` poza kontraktem, ale pod przymiarem | §2.7 |
| `docs/decyzje/2026-09-05-moc-decyzji.md` | decyzja ma `moc` niezależną od `stan` dokumentu | §2.3, §3 |
| `docs/decyzje/2026-09-05-system-vs-content.md` | SYSTEM jest dokumentem, CONTENT jest danymi | §2.1, §2.5, §9 |
| `docs/decyzje/2026-09-06-effects-jako-domena.md` | `effects` jako 27. domena; kiedy wolno rozszerzyć listę | §4 |
| `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md` | zamknięcie migracji: klasyfikacja w miejscu zamiast przeprowadzki plików; §R jest bramką tylko dla `STAN` | §8, §13 |
| `docs/decyzje/2026-10-11-render3d-jako-domena.md` | `render3d` jako 28. domena | §4 |

⚠ **Łącza pisze się ścieżką od korzenia repo** (`docs/systemy/items.md`),
nigdy względną (`../decyzje/…`) — inaczej przeniesienie pliku zrywa cudze
łącza, a pakowanie do paczki przestaje być bezpieczne.

---

## 13. Czego ten kontrakt NIE rozstrzyga

- ⚙ **Docelowy układ katalogów jest już rozstrzygnięty (2026-09-07)**: rolą
  dokumentu jest jego `typ`, nie katalog. Podkatalogi mają tylko te rodziny,
  które powstają seriami (`systemy/`, `proces/`, `decyzje/`); reszta leży
  płasko i tak zostaje —
  `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md`.
- **Treści żadnej domeny.** Kontrakt nie wie i nie ma prawa wiedzieć, jak
  działa walka.
- **Kolejności domen w Canon Extraction** — to jest plan pracy, nie kontrakt.

---

## 14. Otwarte problemy

Świadomie nierozstrzygnięte. **Lista wszystkich z kategorią: `docs/zadania.md`.**
Powody tych dokumentacyjnych: `PROJECT_DOCS_CHECKPOINT.md` → `OPEN ISSUES` (historia).

| id | problem |
|---|---|
| **OI-1** | Indeks utrzymywany ręcznie; docelowo **generowany** z nagłówków. ⚙ Od 2026-09-07 **da się** — wszystkie dokumenty mają nagłówek. |
| **OI-84** | Osiem dokumentów przekracza limit z §8 (`prompty_gemini` 127 KB, `wioska_plan` 71, `swiat` 49, `mapy` 44, `odlozone` 37, `referencje_zewnetrzne` 32, `udzwig_umiejetnosci` 23, `konfiguracje_broni_checkpoint` 22). Przymiar wypisuje je z nazwy jako OSTRZEŻENIA. Cięcie jest pracą nad treścią i **należy do autora**. |
| **OI-5** | `swiat.md` niesie mechanikę w dokumencie `KANON` — §2.2. |

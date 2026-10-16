---
typ: OPERACYJNE
domena: proces
tytul: Roadmapa — kolejność etapów wyposażenia i archetypów
stan: zywy
otwarte: [OI-98, OI-100, OI-101, OI-102, OI-103]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-30
---

# Roadmapa — wyposażenie i archetypy

> ⚠ **Dopisek 2026-10-11 (retrospektywa dokumentacji):** od ~2026-09-20 prace
> poszły w 3D i zawartość świata (wieś, otwarty świat, bandyci), a §1 nadal
> nazywa ETAP 1 bieżącym. **Łańcuch niżej obowiązuje** — autor tego samego
> dnia: etap strzelca będzie łatwiejszy, bo postacie 3D animuje się prościej
> niż klatki 2D. Otwarte zostaje tylko, kiedy ETAP 3 wchodzi względem
> bieżących wątków świata (`docs/current.md` §3). „Który etap teraz" czytaj
> z `docs/current.md`, nie z §1.

> ## Czym ten plik JEST
>
> **Zapisem KOLEJNOŚCI dużych etapów** rozwoju wyposażenia i archetypów
> postaci, przyjętym przez autora 2026-09-15. Odpowiada na jedno pytanie:
> **„który etap jest teraz, a który dopiero po nim"**.
>
> ## ⛔ Czym ten plik NIE JEST
>
> - ⛔ **Nie jest zadaniem implementacyjnym.** Zapisanie tej roadmapy **nie
>   zmieniło i nie upoważnia do zmiany** ani mechaniki, ani kodu, ani balansu.
> - ⛔ **Nie jest opisem żadnej mechaniki.** Jak coś działa — `docs/systemy/`.
> - ⛔ **Nie jest listą zadań.** Otwarte sprawy `OI` — `docs/zadania.md`.
> - ⛔ **Nie jest planem KROKÓW bieżącego etapu.** Pierwszy krok następnej
>   sesji mówią checkpointy (§10), nie ten plik.
> - ⛔ **Żaden przyszły archetyp z §3–§7 nie jest tu projektowany.** Nazwa
>   etapu nie jest specyfikacją i nie wolno jej tak czytać.

---

## 0. Łańcuch — obowiązująca kolejność

```
PANCERZ
   ↓
BROŃ (walka wręcz)
   ↓
TARCZE (domknięcie wg checkpointu)
   ↓
DOMKNIĘTY WOJOWNIK                    ← ETAP 2
   ↓
ŁUK / KUSZA / OSZCZEP                 ← ETAP 3
   ↓
STRZELEC / ŁUCZNIK
   ↓
HYBRYDA WOJOWNIK + STRZELEC           ← ETAP 4
   ↓
ŁOWCA                                 ← ETAP 5
   ↓
MAG                  — nie wcześniej niż ~2026-11-15
   ↓
KAPŁAN / PALADYN     — nie wcześniej niż ~2026-12-15 … 2027-01-15
```

⚠ **Nie przeskakuj do dalszego etapu tylko dlatego, że istnieje pomysł na jego
mechanikę.** Pomysł nie jest powodem zmiany kolejności; jest powodem wpisu
w `docs/pomysly.md` albo w `docs/odlozone.md`.

### 0.1 Droga do grywalnego MVP (autor, 2026-09-30)

Druga oś, **prostopadła** do łańcucha wyżej: nie „który archetyp", tylko
„w jakiej kolejności dowozimy grywalną wersję”. Słowami autora: najpierw
**must have**, dopieszczanie potem.

```
1. ASSETY PRZEDMIOTÓW          ← bieżące (ikony pancerza: docs/gemini_armor_icons.md)
   ↓
2. NAKŁADANIE BRONI I PRZEDMIOTÓW NA MODEL 3D — głównie pancerz
   ↓
3. LOKACJA LAS + MODELE 3D PRZECIWNIKÓW
   ↓
4. GAMEPLAY
```

⛔ **Poza tą drogą — nice to have, nie must have:** graficzne nakładanie się
warstw pancerza w EQ i na modelu (przeszywanica wystająca spod kolczugi
itd.) — `docs/odlozone.md` §3. Argument „skoro i tak robimy model 3D, zróbmy
od razu warstwy” jest dokładnie tym zakopaniem się w detalach, przed którym
ta kolejność chroni.

⚠ **Czego ten zapis NIE rozstrzyga:** jak kroki 2–4 mają się do ETAPÓW 2–5
łańcucha wyżej. Autor tego nie określił — nie zgaduj; zapytaj, gdy kolejność
zacznie kolidować.

---

## 1. ETAP 1 — BIEŻĄCY: domknięcie systemu przedmiotów

Kończymy fundament obecnego wyposażenia, **w tej kolejności**.

### 1.1 Pancerze — pierwsze

Do domknięcia:

- warstwowanie `L1`/`L2`/`L3` (dziś warstwa jest **metadaną**, nie mechaniką),
- **semantyka** warstw,
- obciążenie,
- ekonomia,
- realne konfiguracje wyposażenia (co gracz faktycznie nosi),
- materiały,
- balans pancerzy.

**Obecny kierunek warstw — zapis intencji autora, nie liczby:**

| warstwa | wpływ negatywny |
|---|---|
| **L1** — podkład | ⭐ **brak** |
| **L2** — ochrona zasadnicza | brak albo **minimalny** |
| **L3** — wzmocnienie | **mały, ale realny** koszt |

⭐ **Trzy warstwy na wielu częściach ciała mają być odczuwalne przede wszystkim
przez ŁĄCZNĄ MASĘ / OBCIĄŻENIE i wynikające z niego konsekwencje** — nie przez
karę doklejoną do pojedynczej sztuki.

⚠ **Nie zakładaj, że gracz powinien zapełniać wszystkie 12 adresów
warstwowych** (3 warstwy × 4 obszary). „Pełny stos" jest skrajnym przypadkiem
do policzenia, a nie docelowym wyposażeniem typowej postaci.

⚠⚠ **Warstwa opisuje FIZYCZNE MIEJSCE wyposażenia, nie poziom jakości.**
`L3` nie znaczy „lepszy pancerz" — znaczy „leży na wierzchu". Ta pomyłka wraca
i psuje zarówno balans, jak i przyszły system szat (§6).

**Co blokuje:** `OI-98` (warstwowanie jako mechanika), `OI-103` (który model
obciążenia przyjmujemy — trzy policzone, **żaden niezaakceptowany**),
`OI-101`/`OI-102`, `OI-100` (piąty materiał domykający trójkąt typów).
Pełne opisy: `docs/zadania.md` → dokumenty wskazane w kolumnie „gdzie".

### 1.2 Broń — po pancerzach

Pełny repertuar typowego wojownika. **Najpierw broń do walki wręcz** i wszystkie
potrzebne podstawowe konstrukcje/mechaniki.

⚠ Broń dystansowa **nie należy do tego punktu** — jest ETAPEM 3.

### 1.3 Tarcze — trzecie

⭐ **System tarcz jest już w dużej mierze przygotowany.**

⛔ **Tarcze NIE są powodem do ponownego projektowania całego systemu.**
Pozostałe otwarte kwestie rozstrzygamy **zgodnie z checkpointem** i wynikami
`P1` / `T-1` / `T-4` — `docs/tarcze_checkpoint.md`.

> ### ⚠ Rozjazd, o którym trzeba wiedzieć
>
> Do 2026-09-15 indeks wskazywał `docs/tarcze_checkpoint.md` jako **bieżący
> punkt wejścia całego projektu**. Roadmapa stawia tarcze **za** pancerzem
> i bronią. **To nie unieważnia tamtego checkpointu** — pozostaje jedynym
> punktem wejścia **wątku tarcz** i w swoim zakresie jest aktualny; zmienia się
> tylko to, **kiedy** ten wątek jest na warsztacie.
>
> ⚠ `P1` (pomiar rozkładu kątów ciosów) jest **niezależny od kolejności** —
> narzędzie jest wdrożone, a pomiar wymaga grania, nie kodu. Wykonanie go
> wcześniej niczego nie łamie.

---

## 2. ETAP 2 — pełny wojownik

Cel: **kompletny, grywalny archetyp wojownika.** Pełny repertuar:

- pancerzy,
- broni,
- tarcz,
- wyposażenia pomocniczego potrzebnego do walki.

⚠ **Warunek przejścia dalej:** typowy wojownik ma być faktycznie **kompletny
i przetestowany**. Dopiero wtedy rozszerzamy system na walkę dystansową.

---

## 3. ETAP 3 — łucznik / strzelec / łowca: pierwsze rozszerzenie

Następny duży archetyp po wojowniku. Najpierw **wyposażenie**:

- łuk,
- kusza,
- oszczep przeznaczony do miotania.

⛔ **Mag ani kapłan NIE są częścią tego etapu.**

⭐ **Po co ten etap jest właśnie tu:** chcemy zobaczyć, jak **istniejące**
systemy — wyposażenia, obciążenia, broni, staminy i walki — sprawdzają się dla
postaci walczącej na dystans. To jest test fundamentu, nie dokładanie klasy.

⚠ Dziś w projekcie **nie ma mechaniki broni dystansowej po stronie gracza** —
to stan wyjściowy tego etapu, nie dług do naprawienia wcześniej.

---

## 4. ETAP 4 — hybryda wojownik + strzelec

Po osobnym zrobieniu pełnego wojownika i podstawowego strzelca — połączenie obu
sposobów walki. Przykładowo: wojownik korzystający z łuku/kuszy, strzelec
potrafiący walczyć wręcz, konfiguracje mieszane, kompromisy wyposażenia.

⭐ **To ma być naturalna konsekwencja systemu, a nie osobna sztywna klasa.**

---

## 5. ETAP 5 — typowy łowca

Dopiero po sprawdzeniu wojownika, strzelca i ich hybrydy. Łowca rozwijany
**na bazie już istniejących systemów**: walki wręcz, dystansu, mobilności,
wyposażenia, pancerza.

⛔ **Nie projektuj łowcy jako „lepszego łucznika".**

---

## 6. PRZYSZŁOŚĆ — mag

⛔ **Nie implementować. Nie projektować szczegółów teraz.**

**Minimalny horyzont: ~2 miesiące od 2026-09-15, czyli nie wcześniej niż
~2026-11-15** — i to jest dolna granica, nie termin.

Przyszły system maga **może** objąć: szaty · specjalistyczną odzież · własną
progresję wyposażenia · przedmioty magiczne · rozwój niezależny od ciężkiego
pancerza.

**Historyczna oś rang szat** — `Adepta → Mag → Mistrz → Arcymistrz` — zostaje
zachowana jako **potencjalna przyszła oś progresji szat**.

> ### ⚠⚠ Rangi szat ≠ `L1 → L2 → L3`
>
> To **dwie prostopadłe osie**. Szata może być `L1` niezależnie od tego, czy
> jest szatą Adepta, Maga, Mistrza czy Arcymistrza.
>
> ⛔ **Ten przyszły system nie może dziś wpływać na balans warstw pancerza.**
> Jeśli w rozmowie o `L1`/`L2`/`L3` pada argument „ale mag będzie
> potrzebował…", argument jest przedwczesny z definicji.

⚠ **Kolizja nazw, o której trzeba pamiętać:** „Arcymistrzowska" jest dziś
**siódmym poziomem JAKOŚCI WYKONANIA** (`GameConfig` → `QUALITY`) — oś
istniejąca i niezwiązana z rangami szat. Trzecia prostopadła oś; nie mylić.

---

## 7. DALEKA PRZYSZŁOŚĆ — kapłan i paladyn

⛔ **Nie implementować. Nie projektować obecnie szczegółowej mechaniki.**

**Orientacyjny horyzont: ~3–4 miesiące, czyli ~2026-12-15 … 2027-01-15
lub później.**

⛔ **Nie pozwól, żeby przyszłe potrzeby kapłana/paladyna komplikowały obecny
system pancerza, broni ani warstw.**

W przyszłości mogą być rozwijani jako **różne sposoby wykorzystania
istniejących fundamentów** — podobnie jak wojownik i strzelec nie muszą być
sztywnymi klasami.

---

## 8. Zasada architektury — obowiązuje OD ZARAZ

> **Przyszłe archetypy mają być UŻYTKOWNIKAMI wspólnego systemu wyposażenia,
> a nie powodem do niszczenia istniejących fundamentów.**

⛔ **Nie twórz teraz:**

- blokad klasowych,
- specjalnych wyjątków dla maga,
- specjalnych wyjątków dla kapłana,
- specjalnych wyjątków dla paladyna.

Jeżeli przyszły archetyp będzie wymagał nowych mechanik, **zostaną
zaprojektowane dopiero wtedy, kiedy nadejdzie jego etap**.

---

## 9. Kontekst do zachowania

**Historyczne grafiki szat** z wcześniejszego etapu projektu, przedstawiające
stopnie `Adepta → Mag → Mistrz → Arcymistrz`, są **materiałem referencyjnym na
przyszłość**.

⛔ **Nie zmieniaj na ich podstawie systemu pancerza ani warstw.**

⚠ **Gdzie one są:** przeszukanie repozytorium 2026-09-15 (`docs/`,
`public/assets/`, nazwy plików `*szat*`, `*robe*`, `*mag*`, `*adept*`) **nie
znalazło ich** — czyli to materiał autora **spoza repo**. Nie trać sesji na
szukanie. Jeśli mają wrócić do projektu, wchodzą drogą opisaną
w `docs/referencje_zewnetrzne.md`.

---

## 10. Jak ta roadmapa ma się do pozostałych planów

⚠ **Projekt ma regułę „nie twórz drugiego planu".** Ten plik jej nie łamie,
bo działa **na innym poziomie** niż checkpointy: roadmapa mówi **KTÓRY ETAP**,
checkpoint mówi **JAKI KROK w tym etapie**.

| plik | odpowiada na | zakres |
|---|---|---|
| **`docs/roadmap.md`** (ten) | **który etap jest teraz i co po nim** | całe wyposażenie + archetypy |
| `docs/ekwipunek_checkpoint.md` | pierwszy krok sesji w wątku ekwipunku i pancerza | ETAP 1.1 |
| `docs/tarcze_checkpoint.md` | pierwszy krok sesji w wątku tarcz | ETAP 1.3 |
| `docs/konfiguracje_broni_checkpoint.md` | trzy konfiguracje broni (stan 2026-09-05) | fragment ETAPU 1.2 |
| `docs/plan_dalszych_prac.md` | las i optymalizacja mobilna | ⛔ **poza tą roadmapą** |
| `docs/zadania.md` | co jest otwarte i jakiego rodzaju to praca | cały projekt |
| `docs/odlozone.md` | co odłożono, co odblokowuje powrót, **czego nie budujemy** | cały projekt |

⚠ **Las, wieś, grafika, ergonomia telefonu i pakowanie nie są w tym łańcuchu.**
Roadmapa porządkuje **jedną oś** — wyposażenie i archetypy. Brak czegoś tutaj
nie znaczy, że zostało odrzucone.

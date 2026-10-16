---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena effects
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/effects_weryfikacja.mjs, tools/combat_regresja.mjs]
otwarte: [OI-27, OI-36, OI-37]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `effects`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/effects.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Procedura — pierwsza domena BEZ dokumentu źródłowego

| krok | co zrobiono |
|---|---|
| **0. PLAN CIĘCIA** | jak przy `combat`: przed pisaniem spisane, co domena bierze i co oddaje. Wynik: `STAN` 13,8 KB **bez rundy skracania**, drugi raz z rzędu |
| **1. KOD** | `StatusEffects.ts` (273 l.), `EffectKinds.ts` (156 l.), `Contracts.ts` w części efektowej — **w całości**; obie implementacje nosiciela; wszystkie miejsca nałożenia; zapis i przenoszenie przez portal |
| **2. DOKUMENTACJA** | ⚠ **praktycznie nie istnieje** — patrz `E-1` |
| **3. ROZJAZDY** | 8 sztuk (§2) |
| **4. DECYZJE** | 20 pozycji z mocą (§3) |
| **5. STAN + BRAMKA** | `docs/systemy/effects.md`; `doc_check`, `effects_weryfikacja` (65 sprawdzeń), `combat_regresja` (strażnik czystości), `tsc` |

⚠⚠ **Ta ekstrakcja odwróciła swoją zwykłą rolę.** Siedem poprzednich godziło
istniejące dokumenty z kodem. Tutaj **dokumentu do pogodzenia nie było** —
`STAN` jest **pierwszym zapisem reguł tej warstwy poza komentarzami w kodzie**.
Konsekwencja metodyczna jest w §6.

⚙ **Osobno, przed ekstrakcją:** autor ratyfikował `effects` jako 27. domenę.
Decyzja z dowodami i odrzuconymi wariantami:
`docs/decyzje/2026-09-06-effects-jako-domena.md`.

---

## 2. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **E-1** | **milczenie CAŁKOWITE** — warstwa nie ma ani jednego dokumentu opisującego jej reguły | wzmianki są trzy: akapit decyzji, która ją powołała; dokument o **jednej umiejętności**; wpisy w dzienniku | ⛔⛔ najwyższa — **pierwsza domena w całej ekstrakcji bez źródła**; siedem poprzednich miało od jednego do ośmiu |
| **E-2** | `rozciecie_krwawienie.md` §4.1 i §4.6 opisują **reguły WARSTWY** („tik równy z końcem nie pada", „nałożenie = odświeżenie i cztery rzeczy, których nie robi") | to są reguły systemu, nie własności Rozcięcia — obowiązują **każdy** efekt w grze | ⛔ wysoka — **SYSTEM zapisany w dokumencie CONTENTU**. ⚙ Reguły przeniesione do `STAN`; dokument zostaje z liczbami i przypadkami brzegowymi Rozcięcia |
| **E-3** | zakres decyzji powołującej warstwę: „DoT, spowolnienia, **ogłuszenia**, buffy" | ogłuszenie **jako jedyne nie weszło** i jest osobnym polem na stworzeniu | ⚠ średnia — **niedostarczona pozycja zakresu**, nie nieoczywistość → `OI-27` |
| **E-4** | tamże: „**jedno miejsce, w którym mieszka reguła «co omija nietykalność»**" | ⛔ **nie dostarczone** — reguła nadal jest rozproszona po nosicielach | ⚠ średnia — drugi niedokończony fragment tego samego zakresu → `OI-37` |
| **E-5** | **trzy zaczepy bez ani jednego konsumenta**: rozproszenie, odporność, atrybucja sprawcy | zero wywołań w `src/`, **a uprząż testuje wszystkie trzy** | ⛔ wysoka — kolizja dwóch własnych reguł projektu → **OI-36** |
| **E-6** | **milczenie** — nigdzie nie opisano, że efekty **przeżywają portal, ale nie przeżywają zapisu** | dwie różne trwałości, obie celowe, zero dokumentu | ⚠ średnia — opisane po raz pierwszy (`STAN` §8) |
| **E-7** | komentarz w `src/entities/Enemy.ts`: „`ARMOR_PROFILE.metal.slash = 1,4`, więc puszczenie Krwawienia przez profil sprawiłoby, że **stal ZWIĘKSZA** obrażenia rany" | mnożnik działa na **punkty ochrony** → więcej redukcji → rana **mniejsza**. ⚠ **Punkt 3 tego samego komentarza opisuje to poprawnie** (`x × (1 − redukcja)`) | ⚠ średnia — **drugie wystąpienie znaleziska `A-9` z domeny `armor`**; reguła słuszna (dwa pozostałe powody nośne), uzasadnienie nr 2 odwrócone |
| **E-8** | **rozproszenie nazw** — trzy różne rzeczy w kodzie brzmią jak „efekty" | impulsy ruchu · migawka dla paska · ta warstwa | ⚠ średnia — opisane po raz pierwszy jako tabela rozróżniająca (`STAN` §7) |

⚠ **`E-1` i `E-2` to jedno zjawisko w dwóch odsłonach:** reguła systemu nie
miała gdzie mieszkać, więc osiadła tam, gdzie akurat pisano — w komentarzu kodu
i w dokumencie o pojedynczym efekcie.

---

## 3. Rejestr decyzji z mocą

Skróty: `AF` = `audyt_projektowy_fundamentow_2026-09-03.md` (D3),
`RK` = `rozciecie_krwawienie.md`, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **podział warstwa ↔ nosiciel**: „ile jeszcze trwa" vs „co to robi" | AF, KOD | **ACTIVE** |
| D-2 | **warstwa nie interpretuje ładunku** | KOD | **ACTIVE** |
| D-3 | **warstwa CZYSTA** — zero silnika, encji, sceny, zdarzeń | KOD | **ACTIVE** |
| D-4 | **minimum czterech metod nosiciela**, nie „interfejs walczącego" | KOD | **ACTIVE** — ⭐ **DOWIEDZIONE**: drugi nosiciel doszedł bez zmiany w warstwie |
| D-5 | **czas jako PRZYROST**, nie „teraz" | KOD | **ACTIVE** — usunęło zależność od monotoniczności zegara przy portalu |
| D-6 | **najpierw wygaśnięcie, potem tik** (przeniesione z dawnej obsługi jadu) | KOD, RK §4.1 | **ACTIVE** |
| D-7 | **zostawić czas trwania i semantykę warstwy nietkniętą**, mimo że daje o jeden tik mniej | RK §4.1, decyzja autora 2026-09-04 | **ACTIVE** |
| D-8 | **odświeżenie nie zeruje zegara tików** — inaczej szybsze trucie truje wolniej | KOD | **ACTIVE** |
| D-9 | **żywe liczby ZASTĘPOWANE, nie sumowane** | KOD, RK §4.6 | **ACTIVE** |
| D-10 | **jeden zbiór na nosiciela**, ⛔ nigdy singleton modułu | KOD | **ACTIVE** |
| D-11 | **tagi jako zwykłe napisy**, nie zawężony typ | KOD | **ACTIVE** |
| D-12 | **rodzaj efektu deklaruje komplet kluczy**; domyślne muszą być neutralne | KOD | **ACTIVE** |
| D-13 | ⛔ **zero pól pod przyszłe warianty** — nowy klucz razem ze swoim kodem | KOD | **ACTIVE** |
| D-14 | **nadrabianie tików pętlą**, nie pojedynczym sprawdzeniem | KOD | **ACTIVE** |
| D-15 | **warunek wstrzymania należy do nosiciela** (tylko on wie, co znaczy „w walce") | KOD | **ACTIVE** |
| D-16 | **stworzenie NIE dostaje paska** — dwa kanały prezentacji, nie trzy | KOD | **ACTIVE** |
| D-17 | **efekty poza zapisem**, ale przenoszone przez portal | KOD | **ACTIVE** — spójne z cooldownami umiejętności |
| D-18 | **atrybucja sprawcy zapisywana z góry**, bo doklejenie jej później jest zmianą każdego wołającego | KOD | ⚠ **OPEN** — zero czytelników → OI-36 |
| D-19 | **rozproszenie i odporność jako zaczepy**, jawnie „nie mechanika" | KOD | ⚠ **OPEN** — zero wywołań → OI-36 |
| D-20 | **ogłuszenie w zakresie warstwy** | AF (D3) | ⛔ **NIEDOSTARCZONE** → OI-27 |

⚠ **Zastąpienie/niedostarczenie CZĘŚCIOWE po raz SIÓDMY z rzędu** (D-20, D-4
w drugą stronę). Od `attributes` do `effects` nie było domeny bez takiej pozycji.

---

## 4. OI-36 — kolizja dwóch własnych reguł projektu

**Fakt (twardy, sprawdzony gremem):** rozproszenie i odporność **nie mają
w `src/` ani jednego wywołania**; atrybucja sprawcy jest zapisywana i przez nic
nie czytana. **Wszystkie trzy są sprawdzane przez uprząż**, która świeci na
zielono.

**Dwie reguły tego projektu mówią tu przeciwnie:**

| reguła | skąd | co mówi tutaj |
|---|---|---|
| „nie deklaruj mechaniki, której nic nie wypełnia" | `items` `N-13` | ⛔ zaczepy nie powinny istnieć |
| „martwy kod pod bramką jest gorszy niż brak kodu — uprząż świeciłaby na zielono, testując funkcje, których gra nie używa" | `combat`, przy usuwaniu starych kształtów geometrii | ⛔ tym bardziej nie powinny być testowane |
| „doklejenie atrybucji później jest zmianą KAŻDEGO wołającego" | komentarz przy zaczepie | ✅ dlatego mają istnieć **teraz** |

⚠ **Trzecia reguła jest w tym przypadku prawdziwa i zmierzalna** — miejsc
nakładania efektu jest dziś pięć i każde musiałoby zostać zmienione. ⚠ Dwie
pierwsze też są prawdziwe.

**Czego ekstrakcja NIE umie rozstrzygnąć:** czy „zaczep pod przymiarem" jest
dozwolonym wyjątkiem od reguły o martwym kodzie, czy jej naruszeniem. **To jest
polityka projektowa, nie fakt z kodu** — i dlatego zostaje jako `OI-36`,
z jednym zdaniem do autora.

⚠ Różnica wobec usuniętych kształtów geometrii, którą warto znać przy decyzji:
tamte były **pozostałością po zastąpionym kodzie**, te są **wyprzedzeniem**.
Koszt jest podobny, kierunek w czasie przeciwny.

---

## 5. Los każdego niezmiennika

⚠ **Nietypowo: prawie wszystko jest NOWE** — bo prawie nic nie było zapisane
poza kodem.

| niezmiennik | los |
|---|---|
| podział warstwa ↔ nosiciel | 🆕 **N-59** — z komentarza, po raz pierwszy jako reguła domeny |
| czystość warstwy | 🆕 **N-60** |
| minimum czterech metod nosiciela | 🆕 **N-61** |
| `id` jako tożsamość, nałożenie = odświeżenie | ✅ **N-62** — **przeniesione z `RK` §4.6**, czyli z dokumentu o umiejętności |
| żywe liczby zastępowane | ✅ **N-63** — j.w. |
| odświeżenie nie zeruje zegara tików | ✅ **N-64** — j.w. |
| najpierw wygaśnięcie, potem tik | ✅ **N-65** — **przeniesione z `RK` §4.1** |
| czas jako przyrost | 🆕 **N-66** |
| jeden zbiór na nosiciela | 🆕 **N-67** |
| rodzaj deklaruje komplet kluczy | 🆕 **N-68** |
| wstrzymanie należy do nosiciela | 🆕 **N-69** |
| żaden konkretny efekt nie mieszka w warstwie | 🆕 **N-70** |
| „tik omija pancerz i nie ma typu" | ➡ **ZOSTAJE** w `armor` (reguła ochrony) i w `RK` (uzasadnienie dla rany) |
| liczby Krwawienia, pięć tików, `φ` nie podnosi rany | ➡ **ZOSTAJĄ** w `RK` — to jest CONTENT jednej umiejektności |
| co robi jad, sieć, Okrzyk, posiłek | ➡ **DELEGOWANE** do `creatures`, `abilities`, `items` |
| pasek i znacznik nad głową | ➡ **DELEGOWANE** do `presentation` |
| ogłuszenie | ➡ **DELEGOWANE** do `abilities`/`combat`, ⚠ z otwartym `OI-27` |

---

## 6. Czego procedura tu NIE złapała

1. ⚠⚠ **Decyzja SYSTEM/CONTENT chroni przed dokumentami PER ELEMENT, ale nie
   przed REGUŁĄ SYSTEMU zapisaną w dokumencie elementu** (`E-2`). Dwie reguły
   obowiązujące każdy efekt w grze mieszkały w dokumencie o jednej umiejętności
   — formalnie zgodnym z kontraktem, bo to `HISTORIA` o konkretnym Rozcięciu.
   ⛔ **Żaden przymiar tego nie wykryje**; wykrywa to wyłącznie ekstrakcja
   domeny, której ta reguła dotyczy. **Nowy wariant znaleziska, nie powtórka.**

2. ⚠⚠ **Domena może nie mieć ŻADNEGO źródła** (`E-1`) — i wtedy ekstrakcja
   przestaje być godzeniem dokumentów z kodem, a staje się **pierwszym
   zapisem**. Procedura to udźwignęła, ale warto wiedzieć, że nie miała czego
   porównywać: **rejestr decyzji powstał niemal w całości z komentarzy kodu**,
   więc jego jakość jest dokładnie taka, jak jakość tych komentarzy — a `E-7`
   pokazuje, ile to bywa warte.

3. ⚠ **Kontrakt dokumentacji jest STRUKTURALNIE PEŁNY.** Dodanie jednej linii
   domeny przekroczyło jego własny limit 20 KB i wymusiło przycięcie
   powtórzeń w §12 i §14. Po tej operacji zostało **9 bajtów zapasu** —
   czyli **kolejna zmiana kontraktu wymusi kolejne cięcie**. → `OI-37`.

4. ⭐ **Plan cięcia przed pisaniem — drugi raz, drugi raz pod limitem.**
   13,8 KB bez rundy skracania. Przy `combat` można było podejrzewać
   szczęście; przy dwóch domenach z rzędu to jest własność procedury.

⚙ **Co zadziałało:** czytanie kodu w całości (warstwa ma 429 linii razem
z rodzajami — to mieści się w jednej sesji), tabela granic na początku `STAN`,
oraz **osobny przymiar domeny**, który dał gotowe pozycje do `## Pokrycie`.

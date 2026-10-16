---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena combat
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs, tools/combat_geometry.mjs]
otwarte: [OI-32, OI-33, OI-34, OI-35]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `combat`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/combat.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Procedura — i dlaczego zmieściła się w JEDNEJ sesji

Checkpoint zapowiadał dwie sesje: osiem dokumentów źródłowych i **brak
dokumentu-modelu**. Wyszła jedna, i powód jest metodyczny, nie szczęśliwy.

| krok | co zrobiono |
|---|---|
| **0. PLAN CIĘCIA** | ⭐ **przed pierwszym zdaniem** — spisane, co domena bierze, co oddaje sąsiadom i co zostaje w historii. Kontrakt §8 wymaga tej kolejności przy przekroczeniu limitu; tutaj zastosowana **profilaktycznie** |
| **1. KOD** | `HitResolver`, `CombatGeometry`, `DamageResolver`, `Defense`, `combat/DamagePacket`, `combat/DamageRoll` w całości (≈870 l.); bramki `resolveAttack`, commit i rozstrzygnięcie w `GameScene`; `triggerAttack`, `guardDir`, `takeDamage` w `Player`; skutki trafienia |
| **2. DOKUMENTACJA** | `combat_v2_audyt.md` (92 KB), `combat_v2_ocena.md`, `audyt_walka_progresja_2026-09-03.md` §4, `audyt_projektowy_fundamentow_2026-09-03.md`, `warianty_atakow.md`, `combat_wspolpraca.md`, `combat_feel_5a.md`, `src/core/CLAUDE.md` |
| **3. ROZJAZDY** | 10 sztuk (§2) |
| **4. DECYZJE** | 30 pozycji z mocą (§3) |
| **5. POMIAR** | rozjazd pozy i ukorzenienia (§4) |
| **6. STAN + BRAMKA** | `docs/systemy/combat.md` — **18,1 KB, bez cięcia po fakcie** |

⭐ **Wniosek metodyczny: plan cięcia PRZED pisaniem jest tańszy niż trzy rundy
skracania po.** Cztery poprzednie domeny pisano „na pełno", a potem przycinano
do limitu; ta jedna miała listę „co oddaję sąsiadom" przed pierwszym akapitem
i **weszła pod limit za pierwszym razem**. ⚠ Drugi warunek był zewnętrzny:
`audyt_walka_progresja_2026-09-03.md` §4 zawiera pipeline spisany z kodu — czyli
**dokument-model istniał, tylko nie nazywał się modelem**.

---

## 2. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **C-1** | komentarz przy kierunku osłony: „**ukorzenienie ustawiane RÓWNO z pozą ataku**" | równe **wyłącznie przy Zręczności 0 bez zmęczenia**; przy pełnej redukcji odzyskania rozjazd sięga dziesiątek ms, a przy wyczerpaniu odwraca znak. ⚠ **Drugi komentarz w TYM SAMYM pliku mówi „root NIE jest już równy pozie (zmiana 2026-08-20)"** | ⛔⛔ najwyższa — **dwa komentarze w jednym pliku przeczą sobie**; skaził też cudzy dokument (C-2) → **OI-32** |
| **C-2** | `docs/systemy/shields.md` §2.2 (napisane 2026-09-06 z tego komentarza) powtarzało „ukorzenienie ustawiane równo z pozą" | j.w. | ⛔ **NAPRAWIONE w tej sesji** — jedyny rozjazd tej ekstrakcji, który wolno było naprawić, bo powstał wczoraj i w domenie już wyekstrahowanej |
| **C-3** | `combat_v2_ocena.md` §7.1: „walka **nie ma feedbacku uderzenia**; brakuje `PresentationCues` i tego, żeby cokolwiek je produkowało" | warstwa cue **istnieje** (Faza 5A) i produkuje wyniki dla obu stron | ⚠ średnia — **pytanie ZAMKNIĘTE**, dokument o tym nie wie |
| **C-4** | tamże §7.2: „**wilk wciąż trafia zawsze**" | ✅ **NADAL PRAWDA** — kęs testowany samym dystansem, bez łuku wokół zablokowanego wektora | ⚙ **kontrola pozytywna** — zweryfikowane, zostaje otwarte → **OI-35** |
| **C-5** | tamże §7.3/§7.4: „**dwie ścieżki wciąż rozstrzyga `overlap` silnika**" | ✅ **NADAL PRAWDA** — callback kontaktowy żyje, pocisk też | ⚙ **kontrola pozytywna** → **OI-33** |
| **C-6** | `audyt_walka_progresja_2026-09-03.md` §4 — kotwice `plik:linia` | **treść poprawna co do reguł**, ale rzut obrażeń wyjechał do osobnego modułu (2026-09-05), więc wskazania na `Player` już nie trafiają | ⚠ niska — **kotwica linią starzeje się szybciej niż zdanie** |
| **C-7** | **milczenie** — żaden dokument nie mówi, że **poza i ukorzenienie to DWA timery** rozjeżdżające się w obie strony | §4 | ⛔ wysoka — konsekwencja gameplayowa: osłona tarczy przeżywa zobowiązanie albo odwrotnie |
| **C-8** | **milczenie** — jawnie **nierozstrzygnięta** decyzja „jak mitygować pakiet wieloskładnikowy" żyje **wyłącznie w komentarzu pliku** | dwie funkcje spłaszczające pakiet są jedynym szwem | ⚠ średnia — otwarta decyzja projektowa bez śladu w `docs/` → **OI-34** |
| **C-9** | **rozproszenie** — reguła „skutek tylko na trafieniu, które NIE ZABIŁO" obowiązuje **trzy** rzeczy naraz | żyje jako trzy osobne warunki, bez nazwy | ⚠ średnia — opisane po raz pierwszy jako **jedna reguła** (`N-56`) |
| **C-10** | `macierz_walki.md` — tabele opisują 10 wariantów broni | roster ma 16; generator zestawia też bronie dwuręczne z tarczami | ⚠ znane (RED FLAG 1 checkpointu) — ➡ **delegowane do `weapons`** |

⚠ **Kierunek rozjazdów jest tu TRZECI z kolei, inny niż wszędzie.** Nie
„dokumentacja za kodem" (`items`…`armor`) ani „kod za dokumentacją"
(`proficiency`), tylko **komentarz przeciw komentarzowi w tym samym pliku**
(C-1). ⚙ Za to trzy pozycje otwarte z rundy oceny **zweryfikowały się jako
nadal prawdziwe** (C-4, C-5) — dokument, który zapisał pytania zamiast
odpowiedzi, zestarzał się najlepiej ze wszystkich w tej domenie.

---

## 3. Rejestr decyzji z mocą

Skróty: `AU` = `combat_v2_audyt.md`, `OC` = `combat_v2_ocena.md`,
`A9` = audyty z 2026-09-03, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | rozdzielenie **skutków gameplayowych od prezentacyjnych** | AU §5, OC §0 | **ACTIVE** |
| D-2 | ⚠ **hit-stop NIE jest efektem prezentacyjnym** — pauzuje fizykę | OC §0 (korekta rundy 1) | **ACTIVE** |
| D-3 | stan PRD to **problem poprawności, nie sieci** | OC §0 | **ACTIVE** |
| D-4 | podział Fazy 1 na **1A bez zmian zachowania** i 1B z geometrią | AU §6 | **HISTORICAL** — wzorzec migracji wart powtórzenia |
| D-5 | **prześwit zamiast dystansu środków** | OC §0 (runda 2) | **ACTIVE** |
| D-6 | **konwencja zasięgu ataku ZOSTAJE** (do krawędzi celu) | KOD | **ACTIVE** |
| D-7 | niezmiennik „**atak z maksymalnego dystansu musi dosięgnąć nieruchomego celu**" | OC §0 | **ACTIVE** |
| D-8 | **kształty `legacy*` USUNIĘTE** po 1B-b — martwy kod pod bramką jest gorszy niż brak kodu | KOD | **ACTIVE** |
| D-9 | **kąt w stopniach, nie przez cosinusy** | KOD | **ACTIVE** |
| D-10 | **bąbel zwarcia jako PARAMETR**, wymagany, z warunkiem `> 0` | KOD, 2026-08-23 | **ACTIVE** |
| D-11 | **ruch wyklucza atak** (model Wild Rift); sprawdzane przed cooldownem | KOD | **ACTIVE** |
| D-12 | **„nic się nie dzieje" ≠ pudło** — bramka zasięgu przed zamachem | KOD | **ACTIVE** |
| D-13 | **jeden slot zamachu**, nie do nadpisania | KOD | **ACTIVE** |
| D-14 | **zamrożenie profilu ciosu w commicie** | A9 §4.1, KOD | **ACTIVE** |
| D-15 | **zużycie broni raz na ZAMACH** | KOD | **ACTIVE** |
| D-16 | **rozstrzygnięcie w połowie zamachu**; slot zerowany przed liczeniem | KOD | **ACTIVE** |
| D-17 | kolejność **unik → parowanie → blok → pancerz**, **jedno** zaokrąglenie, podłoga 1 | AU, KOD | **ACTIVE** |
| D-18 | **PRD zamiast zwykłego rzutu**; osobne liczniki uniku i parowania | KOD | **ACTIVE** (pierwsza wersja — eskalacja liniowa — odrzucona z powodem) |
| D-19 | **resolvery CZYSTE**, kontekst wchodzi jako DANE | AU §5.1, KOD | **ACTIVE** |
| D-20 | **pakiet obrażeń jako kontrakt**, zero nowej mechaniki | A9 (D2) | **ACTIVE** |
| D-21 | **mitygacja pakietu wieloskładnikowego** | KOD | ⚠ **OPEN — świadomie** → OI-34 |
| D-22 | **rzut obrażeń wyciągnięty z encji** (2026-09-05), bit w bit | KOD | **ACTIVE** |
| D-23 | **jeden rzut, dwa odwzorowania** (2026-09-04) | KOD | **ACTIVE** |
| D-24 | **krytyk poza paskiem wykonania** | A9 §4.1 | **ACTIVE** |
| D-25 | **wrogowie nigdy nie krytykują** — wpisane wprost | A9 §4.3 | ⚠ **ACTIVE, ale dług spójności** — asymetria zaakceptowana 2026-09-05 (domena `proficiency`, `OI-30`) |
| D-26 | **ukorzenienie ≠ poza** (2026-08-20); zmęczenie wydłuża **wyłącznie odzyskanie** | KOD | **ACTIVE** — ⚠ nie dotarła do drugiego komentarza w tym samym pliku (C-1) |
| D-27 | **ciężkie trafienie kasuje zamach gracza**; lekkie i średnie nie | KOD | **ACTIVE** |
| D-28 | **przerwanie ≠ zachwianie**; oba tylko na trafieniu, które nie zabiło | KOD | **ACTIVE** |
| D-29 | **księgowość zabójstwa w JEDNYM miejscu** | KOD | **ACTIVE** |
| D-30 | **balansu nie stroić teraz** | OC §0 (runda 2) | **ACTIVE** — pełny pass balansu nadal niewykonany |

⚠ **Zastąpienie CZĘŚCIOWE po raz SZÓSTY z rzędu** (D-25). Od `attributes` do
`combat` nie było domeny bez takiej pozycji.

---

## 4. Pomiar: poza a ukorzenienie

**Metoda:** wzór ukorzenienia odtworzony jeden do jednego z `Progression`
(zobowiązanie + odzyskanie skracane redukcją i mnożnikiem zmęczenia), poza =
długość zamachu + bufor. Wejście: zamach broni odniesienia.

| stan | ukorzenienie vs poza |
|---|---|
| Zręczność 0, bez zmęczenia | **identyczne** — dlatego komentarz z C-1 wyglądał na prawdziwy |
| Zręczność rosnąca | ukorzenienie **krótsze**, rozjazd rośnie liniowo aż do sufitu redukcji |
| stan wyczerpania | ukorzenienie **dłuższe od pozy** — znak rozjazdu się odwraca |

**Konsekwencja gameplayowa, nieopisana nigdzie:**

- postać zręczna **może już odejść, a tarcza nadal kryje kierunek ataku** —
  osłona przeżywa zobowiązanie;
- postać wyczerpana **stoi zakorzeniona, gdy osłona wróciła już do kierunku
  ruchu** — zobowiązanie przeżywa osłonę.

⚠ **Obie sytuacje są skutkiem dwóch niezależnych, poprawnych decyzji** (skrócenie
odzyskania Zręcznością; osłona idąca za rysowanym zwrotem). ⛔ Nie „naprawiać"
tego zrównaniem timerów bez decyzji — to skasowałoby jedną z nich.

---

## 5. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| „nic się nie dzieje" ≠ pudło | ✅ **N-44** |
| jeden slot zamachu | ✅ **N-45** |
| zamrożenie profilu w commicie | ✅ **N-46** |
| zużycie raz na zamach | ✅ **N-47** — ⚠ przyszedł jako **depozyt z `items`** i został odebrany |
| jedno zaokrąglenie + podłoga 1 | ✅ **N-48** — ⚠ **depozyt z `armor` i `shields`**, odebrany |
| kolejność warstwy 3 | ✅ **N-49** — ⚠ depozyt z `shields` |
| ⛔ nie wołać łańcucha „na próbę" (PRD) | ✅ **N-50** — ⚠ **depozyt z `armor`**, nazwany po raz pierwszy jako reguła |
| prześwit; zasięg do krawędzi | ✅ **N-51** |
| kąt w stopniach | ✅ **N-52** |
| jeden predykat kąta dla ataku i obrony | ✅ **N-53** — ⚠ depozyt z `shields` |
| `CombatBody` ≠ `HitShape` | ✅ **N-54** |
| poza ≠ ukorzenienie | 🆕 **N-55** — z pomiaru (§4) |
| skutek tylko na trafieniu, które nie zabiło | 🆕 **N-56** — z kodu, jako **jedna** reguła zamiast trzech warunków (C-9) |
| resolvery czyste, dane zamiast singletonów | ✅ **N-57** |
| jeden konstruktor pakietu obrażeń | ✅ **N-58** — ⚠ **`N-6` z ekstrakcji `items` wraca tu jako część tej reguły** |
| `swingMul` w tempo ORAZ zamach | ➡ **ZOSTAJE** w `shields`/`weapons` — dotyczy przedmiotu, nie pipeline'u |
| wariant tylko zawęża | ➡ **DELEGOWANY** do `weapons` |
| `m(P)`, ześlizg, fuszerka | ➡ **DELEGOWANY** do `proficiency` (odebrany stamtąd jako wejście) |
| krzywa ochrony i strefy osłony | ➡ **DELEGOWANE** do `armor` / `shields` |
| kolor i glif trafienia | ➡ **DELEGOWANE** do `presentation` |
| ogłuszenie jako prymityw | ➡ **DELEGOWANE** do `abilities`; ⚠ `OI-27` nadal otwarte |

⭐ **Ta domena była ODBIORCĄ depozytów, nie nadawcą.** Pięć niezmienników
oddanych przez wcześniejsze ekstrakcje wróciło tu na swoje miejsce. **Dopiero
teraz `items`, `armor` i `shields` mają komplet swoich odesłań domknięty** —
i to jest argument za tym, żeby domeny centralne robić PÓŹNO, a nie wcześnie.

---

## 6. Granice wyprowadzone z KODU

| granica | co pokazał kod | werdykt |
|---|---|---|
| `combat` ↔ `proficiency` | warstwa 2 leży **wewnątrz** pipeline'u, ale liczy ją cudza domena; `combat` dostaje wynik i skalar | ✅ zależność, granica czysta |
| `combat` ↔ `armor`/`shields` | obie oddają **gotowe ułamki**; `combat` mnoży je i zaokrągla **raz** | ✅ zależność asymetryczna |
| `combat` ↔ `weapons`/`items` | profil ciosu jest **zamrażany**, nie odpytywany | ✅ zależność jednokierunkowa, w jednej chwili |
| `combat` ↔ `creatures` | ⚠ **nie jest czysta**: dwie ścieżki obrażeń wciąż rozstrzyga fizyka silnika, a nie geometria walki | ⚠ zależność z **udokumentowanym długiem** (OI-33) |
| `combat` ↔ `presentation` | `combat` produkuje **wynik + wykonanie + kategorię impaktu**; oprawa jest cudza. ⚠ **Wyjątek: hit-stop pauzuje fizykę**, więc jest mechaniką mimo wyglądu | ✅ zależność z jednym jawnym wyjątkiem |
| `combat` ↔ efekty czasowe | ⚠ **domeny `effects` NIE MA na liście 26.** Efekty czasowe są dziś opisywane przez `combat` (jak są nakładane) i `abilities` (co robią), a ogłuszenie stoi obok warstwy efektów | ⚠ **pytanie taksonomiczne, nie rozstrzygane tutaj** |

⚠⚠ **Do rozstrzygnięcia przez autora przy kolejnej domenie dotykającej stanów:
czy `effects` ma zostać domeną.** Dziś to jedyny system w grze **bez domeny**,
a jego kod (`src/core/combat/`) rośnie. ⛔ Nie zakładać jej „przy okazji" —
kontrakt §4 zabrania dodawania domeny, żeby zmieścić jeden dokument.

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Komentarz może przeczyć komentarzowi w TYM SAMYM pliku** (C-1) —
   i wtedy nie ma nawet reguły „kod wygrywa", bo oba są komentarzami. Rozstrzyga
   dopiero **arytmetyka**: policzenie obu liczb pokazało, że jedno zdanie jest
   prawdziwe tylko w punkcie szczególnym. ⛔ To trzeci wariant tej samej choroby
   po `OI-15`, `OI-23` i `OI-31`; **czwarty z rzędu, w czwartej domenie**.

2. ⚠⚠ **Rozjazd potrafi SKAZIĆ dokument napisany dzień wcześniej** (C-2).
   `shields.md` powtórzył zdanie z komentarza, bo ekstrakcja `shields` nie miała
   powodu liczyć timerów ataku — to nie jej domena. **Ekstrakcja domeny
   sąsiedniej jest jedynym mechanizmem, który to wykrywa**, i dlatego kolejność
   domen ma znaczenie merytoryczne, nie tylko organizacyjne.

3. ⚙ **Dokument z PYTANIAMI starzeje się lepiej niż dokument z odpowiedziami.**
   Trzy z pięciu pytań otwartych rundy oceny zweryfikowały się jako **nadal
   aktualne** po dwóch tygodniach i po czterech przebudowach; jedno zamknęło się
   samo. Żaden opis stanu w tej domenie nie wypadł równie dobrze.

4. ⭐ **Plan cięcia przed pisaniem działa** (§1). Pierwszy `STAN`, który wszedł
   pod limit bez rundy skracania — przy największej domenie w kolejce.

⚠ **Czego nadal nie umiemy:** pełny pass balansu jest niewykonany i **żadna
ekstrakcja go nie zastąpi**. `combat` jest domeną, w której „czy to jest dobre"
i „czy to jest spójne" rozjeżdżają się najbardziej — a procedura odpowiada
wyłącznie na drugie pytanie.

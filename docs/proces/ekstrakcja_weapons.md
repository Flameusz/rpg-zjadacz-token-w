---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena weapons
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs, tools/macierz_walki.mjs, tools/katalog_ekwipunku.mjs]
otwarte: [OI-40, OI-41, OI-42]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `weapons`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/weapons.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia, spisany PRZED pisaniem

| | treść |
|---|---|
| **bierze** | pięć osi, których nie wolno zlać · rodzina jako klasyfikacja z **opcjonalną** cechą · **reguła zawężania** w trzech wymuszonych postaciach · wariant i typ obrażeń · **zasięg jako reguła systemowa** · model (tempo/zamach, ręce, skalowanie atrybutami) · broń w drugiej ręce |
| **oddaje** | rozstrzyganie ciosu, geometria, kadencja dwóch broni → `combat` · typ × materiał → `armor` · `P`, praktyka, mnożnik EFEKTU cechy → `proficiency` · `weight`, `requires`, jakość, trwałość → `items` · co robi punkt atrybutu → `attributes` · blok i osłabianie broni dwuręcznej → `shields` · koszt zamachu → `stamina` · mnożniki i zasięg akcji → `abilities` |
| **NIE opisze** | parametrów żadnej broni · balansu drabinki · kompletności rosteru · **czy próg zasięgu ma zostać wyłącznością jednej broni** (`OI-40`) · **jak mierzyć `N-5`** (`OI-41`) |

**SYSTEM vs CONTENT — rozstrzygnięte przed pisaniem:**

| SYSTEM (→ `STAN`) | CONTENT (→ dane) |
|---|---|
| pięć osi · reguła zawężania · cecha jako deklaracja · zasięg jako własność modelu · „dwie ręce = pusty slot" · druga ręka liczy się własną rodziną | 11 broni · 15 wariantów · 5 rodzin z ich liczbami · wszystkie mnożniki wariantów · progi i marginesy zasięgu |

⛔ **Nie utworzono ani jednego dokumentu per broń.** ⭐ **Czwarta domena z rzędu
pod limitem bez rundy skracania** (15,1 KB).

**Procedura:** kod i konfig w całości (`WEAPON_FAMILY`, `WeaponTraits`,
`MeleeSpec`/`AttackVariant`, rozstrzyganie wariantu i zawężania w `Progression`,
druga ręka) → dokumentacja → rozjazdy → decyzje → **pomiar** → `STAN` → bramki.

---

## 2. Rozjazdy

| # | rzecz | stan |
|---|---|---|
| **W-1** | **Niezmiennik progu zasięgu przestał zachodzić** — teza „każda broń poza włócznią jest poza orbitą, a najdłuższa jednoręczna mija próg o ułamek piksela" jest cytowana w **trzech** dokumentach | ⛔⛔ najwyższa → **OI-40**. ⚙ **Kontrola pozytywna co do procesu:** `macierz_walki.md` **sam to zgłosił** 2026-09-05, sam odmówił regeneracji i **sam wskazał tę ekstrakcję** jako właściwego adresata |
| **W-2** | **`N-5` nie mówi, na której osi się go mierzy ani czym jest „sąsiednia kategoria"** — i nic go nie sprawdza | ⛔ wysoka → **OI-41**; roster ma dziś przypadek, w którym ta niejednoznaczność gryzie (§5) |
| **W-3** | komentarz nad rodziną miecza mówi „cecha jest zaczepem, którego **nikt nie czyta**" | ⚙ **kontrola pozytywna** — komentarz **przy samym polu** prostuje to z datą („czytany od Combat v1, sprostowane 2026-09-03"). ⚠ Wzorzec przeciwny do `OI-31` i `OI-32`, gdzie korekty zabrakło |
| **W-4** | `macierz_walki.md` — tabele opisują 10 wariantów, roster ma 16 | ⚠ znane, zabanerowane; ⛔ **świadomie NIE przegenerowane** (polecenie misji + zależność od `OI-40`) |
| **W-5** | generator macierzy zestawia bronie **dwuręczne z tarczami** — wiersze niemożliwe w grze | ⚠ znane (`odlozone.md`); marginesy z tych wierszy są **fantomowe** → `OI-42` |
| **W-6** | **milczenie** — nigdzie nie opisano, że reguła zawężania jest **wymuszona w TRZECH niezależnych postaciach** (typ „tylko fałsz" · przycięcie mnożnika · cecha rodziny nietykana przez wariant) | ⚠ średnia — dokumenty opisują ją jako jedną regułę dyscypliny; opisana po raz pierwszy jako **wzorzec do powtórzenia** (`STAN` §3) |
| **W-7** | **milczenie** — nigdzie nie opisano, że **zasięg ma PRÓG JAKOŚCIOWY, a nie ciągłą skalę** | ⛔ wysoka — to jest przyczyna, dla której `OI-40` jest decyzją, a nie strojeniem; opisana po raz pierwszy (`STAN` §4) |
| **W-8** | **milczenie** — „broń w drugiej ręce liczy się **własną** rodziną, cechą i rangą" żyje wyłącznie w komentarzach | ⚠ średnia — opisane w `STAN` §6 |

⚠ **Zero sprzeczności kod ↔ dokumentacja o REGUŁACH.** Wszystkie rozjazdy tej
domeny dotyczą **liczb i ich konsekwencji** (W-1, W-2, W-4, W-5) albo są
**milczeniami** (W-6, W-7, W-8). To jest inny profil niż w `items`…`armor`,
gdzie rozjeżdżał się opis mechaniki.

---

## 3. Rejestr decyzji z mocą

Skróty: `BR` = `bron_rodziny_review.md`, `WA` = `warianty_atakow.md`,
`B2H` = `bron_dwureczna_analiza.md`, `AF` = audyt fundamentów 2026-09-03,
`KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **rodzina jako oś tożsamości**, nie etykieta | BR | **ACTIVE** |
| D-2 | **rodzina NIE wynika z typu obrażeń ani z liczby rąk** | KOD | **ACTIVE** |
| D-3 | **pola rodziny opcjonalne** — rodzina bez cechy jest legalna | KOD | **ACTIVE** |
| D-4 | **cecha rodziny jako DEKLARACJA**, nie opcjonalne pole | AF (D5) | **ACTIVE** |
| D-5 | rodzina, której tożsamością jest **parametr modelu**, dostaje **znacznik bez liczby** | AF (D5), KOD | **ACTIVE** |
| D-6 | **ranga mnoży EFEKT cechy, nie jej bazę** | `proficiency` (§14 D1) | **ACTIVE** — depozyt, tutaj tylko baza |
| D-7 | **REGUŁA ZAWĘŻANIA** — wariant odbiera, nigdy nie dodaje | WA, KOD | **ACTIVE** |
| D-8 | zawężanie **wymuszone typem** (`interrupts` nie przyjmuje prawdy) | KOD | **ACTIVE** |
| D-9 | zawężanie **wymuszone przycięciem** mnożnika odrzutu do ≤ 1 | KOD | **ACTIVE** |
| D-10 | **wariant nie dotyka cechy rodziny** | KOD | **ACTIVE** |
| D-11 | **typ obrażeń na WARIANCIE**, nie na broni | WA | **ACTIVE** |
| D-12 | `blunt` ≠ `interrupt` | `typy_obrazen.md` §8 | **ACTIVE** — depozyt z `armor`, odebrany |
| D-13 | **broń startowa poza rodzinami** — nie ma tożsamości do niesienia | KOD | **ACTIVE** |
| D-14 | **skalowanie atrybutami wymagane, bez domyślnej** | `items`, KOD | **ACTIVE** |
| D-15 | **tempo i czas zamachu ruszają się razem** | KOD | **ACTIVE** |
| D-16 | **„dwie ręce" = wyłącznie pusty slot** — zero premii, zero kary do bloku | B2H | **ACTIVE** |
| D-17 | **`hands` jest własnością PRZEDMIOTU**, nie rodziny | `items`, KOD | **ACTIVE** |
| D-18 | **zasięg umiejętności = zasięg broni** — decyzja **ODWRÓCONA przez rozgrywkę** | `shield_bash.md` §3.2 | **ACTIVE** — depozyt z `abilities` |
| D-19 | **konwencja zasięgu do krawędzi celu** | `combat` | **ACTIVE** — cudza, wiążąca |
| D-20 | **`N-4` wariant tylko zawęża** | `items` §6 | ✅ **POCHŁONIĘTY** przez `N-85` (trzy wymuszone postaci zamiast jednej reguły) |
| D-21 | **`N-5` rozpiętość wariantów** | `items` §6 | ⚠ **ZACHOWANY W BRZMIENIU, NIEWERYFIKOWALNY** → OI-41 |
| D-22 | **„każda broń poza włócznią poza orbitą"** | `macierz_walki.md`, `wlocznia_analiza.md`, `CLAUDE.md` | ⛔ **PRZESTAŁ ZACHODZIĆ** → OI-40 |
| D-23 | ⛔ **nie regenerować macierzy bez decyzji** | `macierz_walki.md`, 2026-09-05 | **ACTIVE** — uszanowane w tej sesji |
| D-24 | **broń w drugiej ręce liczy się własną rodziną i rangą** | KOD | **ACTIVE** |

⚠ **Zastąpienie/unieważnienie po raz DZIEWIĄTY z rzędu** (D-22, D-20, D-21) —
ale **pierwszy raz takie, którego ekstrakcji NIE WOLNO naprawić**. Patrz §6.

---

## 4. OI-40 — pomiar

**Metoda:** generator macierzy uruchomiony **w trybie przymiaru, bez zapisu**
(`node tools/macierz_walki.mjs`). Zasięg skuteczny liczony konwencją gry —
od punktu napastnika do krawędzi ciała celu — i porównany z progiem orbity.

**Wynik — pełny roster, 16 wariantów:**

| stan | ile broni |
|---|---|
| **poza progiem** (nie dosięga orbitującego celu) | **14 z 16** |
| **za progiem z komfortem** | **1** — broń drzewcowa |
| **za progiem „ledwo"** | **1** — dwuręczna obuchowa, zapas rzędu jednego–dwóch pikseli |
| **najbliższe chybienie** | dwuręczna sieczna oraz najdłuższa jednoręczna obuchowa — obie mijają próg o mniej niż trzy piksele |

**Co dokładnie przestało zachodzić:** teza w brzmieniu „**każda broń poza
włócznią** jest poza orbitą, a najdłuższa jednoręczna mija próg o ułamek
piksela" — cytowana w trzech dokumentach. Dziś **dwie** bronie są po drugiej
stronie progu, a trzy dalsze leżą w pasie kilku pikseli wokół niego.

⚠ **Tożsamość broni drzewcowej NIE została skasowana** — jej zapas jest o rząd
wielkości większy niż zapas broni dwuręcznej obuchowej. **Została rozcieńczona**,
a to jest inna sytuacja i wymaga innej odpowiedzi.

⛔ **NIE ROZSTRZYGAM.** Trzy możliwe odpowiedzi — przywrócić wyłączność
(skrócić dwuręczne), uznać próg za osiągalny dla broni dwuręcznej (przepisać
tezę), przeliczyć sam próg — **prowadzą do trzech różnych gier**, a nie do
trzech brzmień tego samego zdania. To jest decyzja projektowa autora.

⚠ **Konsekwencja proceduralna:** dopóki `OI-40` nie zapadnie, `macierz_walki.md`
**nie może zostać przegenerowana**, bo regeneracja zapisałaby jedną z tych
trzech odpowiedzi jako fakt.

---

## 5. OI-41 — dlaczego `N-5` nie da się dziś sprawdzić

`N-5` brzmi: *„rozpiętość wariantów jednej broni musi być węższa niż odległość
do sąsiedniej kategorii; broń stojąca na krańcu skali kieruje warianty do
środka"*.

**Czego regule brakuje, żeby dała się sprawdzić:**

1. **osi** — łuk? zasięg? obrażenia? tempo? Jedyny zapisany pomiar użył **łuku**,
   ale reguła tego nie mówi;
2. **definicji „kategorii"** — rodzina? konkretna broń? półka cenowa?
3. **asercji** — ⛔ **nic tego nie sprawdza**, w żadnym narzędziu.

**Przypadek, w którym ta niejednoznaczność zaczyna gryźć** (zmierzony na osi
łuku, bo tylko na niej reguła była kiedykolwiek stosowana): wariant obuchowy
topora jednoręcznego schodzi **dokładnie do wartości broni obuchowej
jednoręcznej**, a jego odpowiednik dwuręczny **poniżej wartości broni obuchowej
dwuręcznej**. Przy odczycie „kategoria = rodzina" jest to przejście przez cudzą
tożsamość; przy odczycie „kategoria = sąsiedni model" — nie musi nim być.

⛔ **Nie wybieram odczytu.** ⚠ **Reguła bez metryki jest gorsza niż reguła bez
asercji**: przy braku asercji wiadomo przynajmniej, co należałoby sprawdzić.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| pięć osi się nie zlewa | 🆕 **N-84** — z komentarza nagłówkowego rodzin |
| **`N-4`** wariant tylko zawęża | ✅ **POCHŁONIĘTY przez N-85** — zachowany numer i odwołania, treść rozwinięta o trzy wymuszone postaci |
| **`N-5`** rozpiętość wariantów | ⚠ **ZACHOWANY BEZ ZMIANY BRZMIENIA** i oznaczony jako nieweryfikowalny → OI-41. ⛔ **Świadomie NIE poprawiony** — poprawienie byłoby wyborem metryki, czyli decyzją projektową |
| reguła zawężania | ✅ **N-85** — z trzema postaciami wymuszenia (W-6) |
| cecha jako deklaracja; rodzina bez cechy legalna | ✅ **N-86** |
| baza w rodzinie, mnożnik w randze | ✅ **N-87** — depozyt z `proficiency`, tu tylko baza |
| typ obrażeń na wariancie | ✅ **N-88** |
| skalowanie atrybutami wymagane | ✅ **N-89** — depozyt z `items`, odebrany |
| tempo i zamach razem | ✅ **N-90** — depozyt z `items`/`shields`, odebrany |
| zasięg z modelu; umiejętność pożycza | ✅ **N-91** — depozyt z `abilities`, odebrany |
| „dwie ręce" = pusty slot | ✅ **N-92** — depozyt z `items` |
| druga ręka liczy się własną rodziną | 🆕 **N-93** (W-8) |
| `blunt` ≠ `interrupt` | ✅ **odebrany** z `armor`, zapisany przy N-85 |
| „każdy dobry przedmiot do drugiej ręki osłabia dwuręczną" | ➡ **ZOSTAJE** w `shields` (`N-29`); tu wymieniony jako skutek |
| konwencja zasięgu do krawędzi | ➡ **ZOSTAJE** w `combat` (`N-51`) |
| „nowy materiał musi mieć kogoś, kogo bije" | ➡ nie dotyczy — `armor` |
| próg orbity | ⛔ **OTWARTY jako decyzja** (OI-40), nie przeniesiony jako reguła |

⭐ **Ta domena była największym ODBIORCĄ depozytów w całej serii — pięć
przyjętych z czterech domen.** Po niej `items`, `armor`, `shields` i `abilities`
mają swoje odesłania domknięte.

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Pierwszy raz ekstrakcji NIE WOLNO było użyć swojego głównego
   narzędzia.** Przy `armor` przeliczenie niezmiennika pozwoliło **poprawić
   jego brzmienie** (`N-7`); tutaj to samo działanie byłoby **zmianą gry**.
   **Granica, którą warto zapisać:**
   > Ekstrakcja poprawia regułę, gdy pomiar pokazuje, że **jej brzmienie było
   > niedokładne**. ⛔ Nie poprawia jej, gdy pomiar pokazuje, że **zmienił się
   > świat, który opisywała** — wtedy jedyną poprawną odpowiedzią jest `OPEN`.

   `N-7` należał do pierwszej kategorii, `N-5` i próg orbity do drugiej.

2. ⚙ **Dokument, który sam zgłasza swój rozjazd i wskazuje właściwego
   adresata, jest najtańszy w obsłudze w całej serii.** `macierz_walki.md`
   zgłosił nieaktualność, odmówił regeneracji, nazwał powód i wskazał tę
   ekstrakcję. **Kosztował zero pracy śledczej** — w przeciwieństwie do
   dokumentów, które trzeba było przeliczyć, żeby odkryć, że kłamią.

3. ⚠ **Reguła bez METRYKI jest gorsza niż reguła bez ASERCJI** (§5). Przy braku
   asercji wiadomo, co sprawdzić i można to dopisać; przy braku metryki nie
   wiadomo nawet, czy reguła jest dziś spełniona. ⛔ To jest nowy wariant
   znaleziska „niezmiennik zapisany jako liczba umiera cicho" — tutaj
   niezmiennik został zapisany jako **zdanie bez jednostek**.

4. ⚠ **Milczenia tej domeny dotyczyły WŁASNOŚCI, nie pól** (W-6, W-7):
   „reguła jest wymuszona trzema mechanizmami" i „ta oś ma próg, nie skalę".
   Obie są **własnościami układu**, więc nie widać ich ani w kodzie linia po
   linii, ani w dokumencie akapit po akapicie.

⚙ **Co zadziałało:** krok 0 (czwarty raz), pełny odczyt konfigu przez esbuild
(15 wariantów w jednym przebiegu), **uruchomienie generatora w trybie przymiaru
zamiast czytania jego wyniku z dokumentu** — to jedno polecenie dostarczyło
cały materiał do `OI-40`.

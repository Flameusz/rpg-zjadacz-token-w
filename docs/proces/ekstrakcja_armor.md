---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena armor
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs, tools/katalog_ekwipunku.mjs]
otwarte: [OI-8, OI-20, OI-21, OI-22]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `armor`

> **Po co ten plik.** Materiał dowodowy i zapis procedury, nie treść dziedziny —
> ta poszła do `docs/systemy/armor.md`. Trzyma rozjazdy, rejestr decyzji z mocą,
> pomiary, los każdego niezmiennika i ograniczenia metody.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Procedura

| krok | co zrobiono |
|---|---|
| **1. KOD** | `Protection.ts` w całości (240 linii), `Equipment.defenseAgainst`/`totalDefense`/`reductionAgainst`, `DamageResolver.resolveIncoming`, `Enemy.damageAfterArmor`, macierz `ARMOR_PROFILE` z komentarzami, 23 sztuki pancerza, wszystkie kanały obrażeń obu stron, wszyscy nosiciele ochrony. Narzędzie: esbuild → node na configu + `grep` po każdym symbolu z `Protection` |
| **2. DOKUMENTACJA** | `typy_obrazen.md` (główny), `ekwipunek_mechanika.md` §2.4/§4/§6/§7, `ekwipunek_przedmioty.md` (generowany), `odlozone.md`, `feedback_obrony_analiza.md`, `audyt_walka_progresja_2026-09-03.md` §3.1, `src/core/CLAUDE.md`, `src/entities/CLAUDE.md` |
| **3. ROZJAZDY** | 14 sztuk (§2) |
| **4. DECYZJE** | 23 pozycje z mocą (§3) — w tym dwie unieważnione przez zdarzenia poza domeną |
| **5. POMIAR** | OI-8 (§4) i margines sufitu (§5), skryptem na zbundlowanym configu |
| **6. STAN + BRAMKA** | `docs/systemy/armor.md`; `doc_check`, `combat_regresja`, `tsc --noEmit` |

⚠ **Kolejność 1 → 2 opłaciła się inaczej niż w poprzednich domenach.** Rozjazdy
typu „dokument milczy" (A-10, A-11) były tu **strukturalne**, nie polowe: nie
brakowało pola, brakowało opisu tego, że ta sama arytmetyka jest **stosowana
w dwóch miejscach**. Czytając najpierw dokumenty, przyjąłbym „jedno miejsce
liczy redukcję" — bo tak mówią wszystkie — i miałbym rację co do rdzenia,
a nie co do systemu.

---

## 2. Rozjazdy

**Kierunek jak w trzech poprzednich domenach: dokumentacja jest za kodem.**
Nowość: dwa rozjazdy leżą w **komentarzach kodu** (A-4, A-5), jeden
w **instrukcji przy kodzie** (A-9), jeden w **asercji narzędzia** (A-14) —
czyli w miejscach, których przymiar dokumentacji z definicji nie sprawdza.

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **A-1** | `typy_obrazen.md` §4 — tabela profilu ma **dwa** materiały | **cztery** | ⛔ wysoka — to jest DOMOWY dokument domeny |
| **A-2** | `ekwipunek_mechanika.md` §2.4 — `armorType` ma trzy wartości | **cztery** | ⛔ wysoka — znane jako `R-2` z ekstrakcji `items` |
| **A-3** | tamże §4 — „jeden z **4 kanałów** wroga"; §7 tego samego pliku pisze o **9** | kanałów jest dziś istotnie więcej niż 9 | ⚠ średnia — **sprzeczność wewnątrz jednego pliku** |
| **A-4** | komentarz przy `ARMOR_PROFILE.mail` — „**siedem** czynnych kanałów: ×4 / ×2 / ×1" | **dziesięć** otypowanych; doszły trzy akcje | ⛔ wysoka — to **rachunek dowodowy** pod wybór liczb. ⚠ **częściowo**: rachunek martwy, WNIOSEK trzyma (liczba GATUNKÓW per typ się nie zmieniła) |
| **A-5** | komentarz przy `ARMOR_PROFILE.metal` — „pełna stal **57 pkt**", „skóra **27**", „36,3% vs 30,2%" | 63 i 31 pkt → **38,7% vs 33,2%** | ⛔ wysoka — liczby sprzed dodania slotu rękawic |
| **A-6** | „stal musi zostać **poniżej 37,6%**" — zapisane jako REGUŁA, nie parking (`odlozone.md`, `ekwipunek_przedmioty.md`) | stal jest dziś na **38,7%** | ⛔⛔ najwyższa — **SUPERSEDED co do liczby, ACTIVE co do własności** (§5) |
| **A-7** | proza pod blokiem `AUTO:profile` — „`pierce` najlepszy na dwa materiały **z trzech**, `blunt` na jeden" | 2 / 2 / 0 — z czterech | ⚠ średnia — tabela `AUTO` **nad** tą prozą jest poprawna |
| **A-8** | `audyt_walka_progresja_2026-09-03.md` §3.1 — „pełny komplet kolczugi przeciw młotowi daje mniej ochrony niż **połowa skóry**" | ~17,9 pkt skutecznych vs ~12,4 połowy skóry — **nieprawda**; prawdą jest „mniej niż PEŁNA skóra" | ⚠ średnia — ⚠ sama tabela §3.1 jest POPRAWNA i najświeższa w całej dokumentacji |
| **A-9** | `src/entities/CLAUDE.md` — „Krwawienie przez profil jako `slash` sprawiłoby, że **stal ZWIĘKSZA** obrażenia rany" | mnożnik działa na PUNKTY OCHRONY: `1,4` znaczy „stal liczy się mocniej", więc rana byłaby **mniejsza** | ⛔ wysoka — **odwrócony kierunek modelu**. Niezmiennik SŁUSZNY, uzasadnienie odwrócone → OI-23 |
| **A-10** | **milczenie** — nikt nie opisuje, że `bonus.defense` z biżuterii **omija profil** | kod dodaje te punkty **po** profilowaniu, świadomie | ⚠ średnia — opisane po raz pierwszy (`STAN` §1.3) |
| **A-11** | **milczenie** — wszystkie dokumenty mówią „jedno miejsce liczy redukcję" | rdzeń jeden, ale **miejsca stosowania dwa**, z osobnym zaokrągleniem po stronie wroga | ⛔ wysoka — fakt strukturalny (`STAN` §1.4) |
| **A-12** | `odlozone.md` — „**Ciężar pancerza**" jako pozycja ODŁOŻONA | `weight` jest na **każdej** sztuce i napędza klasy obciążenia (stal ~26,5 vs skóra ~8) | ⚠ średnia — **SUPERSEDED** przez wdrożenie obciążenia |
| **A-13** | `feedback_obrony_analiza.md` §A.2 — „**Błąd 6**: brak decyzji o `ARMOR_PROFILE.metal.blunt`" | decyzja zapadła dwa dni później | ⚠ niska — **SUPERSEDED** przez `D-12` |
| **A-14** | `tools/katalog_ekwipunku.mjs` — asercja „**pełna stal** bez typu = 53,3%" świeci na zielono | sumuje **zahardkodowaną listę CZTERECH** sztuk, gdy generowana tabela w tym samym skrypcie liczy pięć (63 pkt → 55,8%) | ⛔ wysoka — **asercja, która nie może zaświecić na czerwono** → OI-23 |

⚠⚠ **A-6 i A-14 to jedna choroba w dwóch warstwach: niezmiennik zapisany jako
LICZBA zamiast jako WŁASNOŚĆ.** Liczba starzeje się cicho przy każdej zmianie
rosteru; własność da się sprawdzić skryptem. To jest najważniejsze znalezisko
metodyczne tej domeny.

---

## 3. Rejestr decyzji z mocą

**Ekstrakcja nie wymyśliła ani jednej reguły** — wszystkie pochodzą z dokumentów
albo z komentarzy w kodzie i zostały zweryfikowane przeciw kodowi. Skrót źródeł:
`TO` = `typy_obrazen.md`, `EM` = `ekwipunek_mechanika.md`, `OD` = `odlozone.md`,
`FO` = `feedback_obrony_analiza.md`, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | ochrona w PUNKTACH, nie w procentach | TO §1, §3 | **ACTIVE** |
| D-2 | redukcja procentowa, nie płaska (argument zależy od SKALI obrażeń) | TO §2 | **ACTIVE** |
| D-3 | mnożnik materiału na punktach, nigdy na wyniku | TO §3 | **ACTIVE** |
| D-4 | jedna krzywa i jeden sufit dla **obu** kierunków walki | TO §3 | **ACTIVE** |
| D-5 | profilowanie per SZTUKA; komplety mieszane bez własnej reguły | TO §3 | **ACTIVE** |
| D-6 | brak „odporności nieopancerzonego" | TO §3 | **ACTIVE** |
| D-7 | nigdy poniżej 1 punktu obrażeń | TO §3 | **ACTIVE** |
| D-8 | pająk NIE dostaje `metal`; materiał ≠ klasa abstrakcyjna | TO §5 | **ACTIVE** |
| D-9 | opancerzony wróg jest wyjątkiem, nie rolloutem (R-3) | TO §5, §8 | **ACTIVE** |
| D-10 | jeden typ jest generalistą; rekompensata w surowym DPS | TO §4, §8 | **ACTIVE** |
| D-11 | „przy DWÓCH kategoriach trójkąta nie da się domknąć" | TO §4, OD | ⛔ **REJECTED — obalone danymi** (§4) → OI-22 |
| D-12 | `metal.blunt` 0,40 → 0,50 (2026-08-17), z nazwanym sufitem | KOD, OD | **ACTIVE** |
| D-13 | sufit „stal poniżej odpowiedzi przeszywanicy na obuch" | OD | ⚠ **częściowo SUPERSEDED**: liczba martwa, własność żywa (§5) |
| D-14 | typ obrażeń polem WYMAGANYM; `null` = „świadomie bez typu" | TO §11.4 | **ACTIVE** |
| D-15 | jakość dotyczy wyłącznie pancerza GRACZA | TO §6 | **ACTIVE** |
| D-16 | pancerz nie ma trwałości i to jest decyzja | EM §7 | **ACTIVE** — domena `items` |
| D-17 | „ciężar pancerza" jako pytanie ODŁOŻONE | TO §9, OD | ⛔ **SUPERSEDED** — obciążenie wdrożone (A-12) |
| D-18 | pancerz wypada z warstwy UNDERSTAND do MATH/RECAP | FO §A.2 | ⚠ **ACTIVE częściowo**: trzyma dla wróg → gracz; kierunek gracz → wróg **dostał** kanał (`effectiveness`), a RECAP nie istnieje |
| D-19 | skuteczność liczona z MNOŻNIKA, nigdy z wyniku | KOD | **ACTIVE** |
| D-20 | „brak decyzji o `metal.blunt`" | FO §A.2 | ⛔ **SUPERSEDED** przez D-12 |
| D-21 | bez feedbacku skuteczności na kaflach wariantów | TO §9 (recenzent) | **ACTIVE** — glif wszedł przy liczbie obrażeń, nie na kaflach |
| D-22 | żadnej penetracji pancerza (N-9) | EM §5 | **ACTIVE** |
| D-23 | `blunt` ≠ `interrupt` | TO §8 R-5 | **ACTIVE** — oddane domenie `weapons` |

⚠ **Wzorzec z `attributes` i `stamina` powtórzył się po raz TRZECI: decyzja
zastąpiona CZĘŚCIOWO** (D-13, D-18, A-4), i żadna nie była tak oznaczona
w miejscu, w którym leży. Przy czwartym powtórzeniu przestaje to być
obserwacją, a staje się własnością tej dokumentacji.

---

## 4. OI-8 — pomiar i rozstrzygnięcie

**Pytanie:** `ARMOR_PROFILE` ma cztery materiały, a `N-7` („nowy materiał musi
mieć kogoś, kogo BIJE") rozumował o trójkącie przy trzech. Wymaga pomiaru, nie
poprawki tekstu.

**Metoda:** skrypt nad zbundlowanym `GameConfig.ts`; dla każdego materiału pełny
komplet pięciu slotów (najwyższa obrona w slocie), punkty skuteczne = punkty ×
mnożnik, redukcja = `d/(d+K)` z sufitem; bez jakości i bez biżuterii. Wyniki
zgadzają się z blokiem `AUTO:komplety` w `ekwipunek_przedmioty.md` co do
dziesiątej części punktu procentowego — **generator i ten pomiar liczą to samo**.

**Wynik — dwa różne kierunki tego samego „trójkąta":**

| kierunek | pytanie | stan |
|---|---|---|
| **A** | czy każdy MATERIAŁ ma typ, który jest przeciw niemu najlepszy | ✅ **spełniony przez wszystkie cztery** |
| **B** | czy każdy TYP jest przeciw czemuś najlepszy | ❌ **jeden typ nie odpowiada na nic** (rozkład: 2 / 2 / 0) |

**Rozstrzygnięcie:**

1. `N-7` w pierwotnym brzmieniu **nie jest złamany** — jest **niedookreślony**:
   nie mówi, o który kierunek chodzi, a kierunki dają przeciwne odpowiedzi.
2. Kierunek B jest **stanem zamierzonym**, opisanym w czterech miejscach
   z nazwaną rekompensatą (najwyższe surowe obrażenia broni tego typu) — to jest
   `D-10`, `ACTIVE`. **Nie jest to usterka do naprawienia.**
3. Poprawione brzmienie `N-7` weszło do `STAN` §5 i jest **sprawdzalne
   skryptem**, czego pierwotne nie było.
4. ⛔ **Uzasadnienie `D-11` upada.** Twierdzono, że trójkąt nie domyka się,
   **bo kategorii jest za mało**. Od tego zdania przybyły dwie i kierunek B nadal
   jest niedomknięty — czyli liczba kategorii **nigdy nie była wiążącym
   ograniczeniem**. Domknięcie wymaga materiału, którego **najniższy** mnożnik
   stoi w kolumnie osieroconego typu; żaden z czterech tego nie ma, a zaparkowany
   kandydat („twardy pancerz naturalny") z opisu byłby słaby na typ, który już
   wygrywa — czyli **pogłębiłby** przechył. → **OI-22**.

**Czego pomiar NIE rozstrzygnął:** materiał bazowy jest zdominowany przez
najcięższy **na wszystkich trzech typach naraz** — czyli test dominacji, którym
uzasadniono jedną z liczb w tabeli, wypada dla bazy negatywnie. Ale baza nie ma
bramki Siły, waży ~30% i kosztuje ~34% kompletu ciężkiego, więc jej tożsamością
może być dostępność, a nie odporność. **Pomiar nie umie odpowiedzieć, czy test
dominacji ma obowiązywać materiał wejściowy.** → **OI-21**, decyzja autora.

---

## 5. Sufit i margines — przeliczenia

**A-6 / D-13 — skąd wzięło się 37,6%.** Odtworzone dokładnie: komplet
z **czterech** sztuk (przeszywanicowa klata + trzy sztuki skóry), z czasu, gdy
przeszywanica nie miała pełnego kompletu, a slot rękawic nie istniał. Liczba
odtwarza się co do dziesiątej części punktu procentowego, więc wyprowadzenie
jest pewne.

| stan | odpowiedź przeszywanicy na obuch | stal na obuch | zapas |
|---|---|---|---|
| w chwili zapisu reguły | 37,6% *(komplet mieszany, 4 szt.)* | 36,3% *(57 pkt)* | +1,3 pkt proc. |
| **dziś** | **44,9%** *(pełny komplet, 5 szt.)* | **38,7%** *(63 pkt)* | **+6,2 pkt proc.** |

⚠ **Reguła w brzmieniu liczbowym jest złamana** (38,7% > 37,6%), a **własność,
której broniła, jest spełniona z ponadczterokrotnie większym zapasem.** Nie ma
tu nic do naprawienia w kodzie; jest do naprawienia sposób zapisu niezmiennika.

**OI-20 — margines do sufitu.** Dokumentacja notuje najwyższą osiągalną
redukcję jako ~65,7% (komplet czterosztukowy, najwyższa jakość, bez biżuterii).
Przeliczone dziś na pełnych kompletach: **~68,8%**, a z jednym pierścieniem
ochronnym **~70,3%**, przy `EQUIPMENT.maxDefenseReduction`. Slotów na pierścienie
są dwa, więc przestrzeń jest jeszcze mniejsza.

⚠ **To nie jest zgłoszenie „za blisko".** To jest zgłoszenie, że **nie wiadomo,
czym ten sufit miał być**: stropem projektowym, który gracz ma dobijać na końcu
ścieżki, czy zabezpieczeniem, którego nikt nie miał dotknąć. Odpowiedź zmienia
wniosek na przeciwny.

---

## 6. Los każdego niezmiennika

**Zero pozycji bez losu.** Numeracja `N-*` globalna (OI-11 nadal otwarte).

| niezmiennik | los |
|---|---|
| `N-7` „nowy materiał musi mieć kogoś, kogo bije" | ✅ **POPRAWIONY** — kierunki rozdzielone, brzmienie sprawdzalne skryptem (§4) |
| `N-8` `armorType` to materiał | ✅ **PRZENIESIONY** — `STAN` §2, §5 |
| `N-9` żadnej penetracji pancerza | ✅ **PRZENIESIONY** — `STAN` §5 |
| „punkty, nie procenty" | ✅ przeniesiony jako **N-16** + §1.1 |
| „jeden wzór w obie strony" | ✅ przeniesiony jako **N-17** |
| „kanał omijający pancerz" (jad, krwawienie) | ✅ przeniesiony jako **N-18** — po raz pierwszy jako REGUŁA, nie dwa osobne wyjątki |
| „stroić w `ARMOR_PROFILE`, nie przez typ czyjegoś ataku" | ✅ przeniesiony jako **N-19** |
| „opancerzony wróg jest wyjątkiem" (R-3) | ✅ przeniesiony jako **N-20** |
| „redukcja procentowa, nie płaska" | ✅ przeniesiony **z zachowaniem warunku skali** — argument upadnie, jeśli obrażenia urosną o rząd wielkości |
| „per sztuka, nie per komplet" | ✅ przeniesiony — §1.2 |
| „nigdy poniżej 1 punktu" | ✅ przeniesiony — §1.3; ⚠ realizowany w DWÓCH miejscach (A-11) |
| „jakość tylko po stronie gracza" | ✅ przeniesiony — §3 |
| „sufit: stal poniżej odpowiedzi przeszywanicy" | ⚠ **POPRAWIONY** — z liczby na własność, liczba oznaczona jako martwa (§5) |
| R-4 „cap przy najwyższej jakości" | ⚠ **OTWARTY** jako OI-20, z nowym przeliczeniem |
| R-5 `blunt` ≠ `interrupt` | ➡ **DELEGOWANY** do `weapons` |
| „trwałość pancerza nie istnieje" | ➡ **DELEGOWANY** do `items` (jest tam) |
| „tarcza neutralna wobec typu obrażeń" | ➡ **DELEGOWANY** do `shields` |
| „tarcza to pancerz, który blokuje" | ➡ **ZOSTAJE** w `items`; w `STAN` §3 jako fakt graniczny |
| `bonus.defense` poza profilem | 🆕 **NOWY** — z kodu, nieopisany nigdzie (A-10) |
| dwa miejsca stosowania, jeden rdzeń | 🆕 **NOWY** — z kodu, nieopisany nigdzie (A-11) |

⚠ **Depozyt do zamknięcia jedną linią, nie hurtem:** `docs/systemy/items.md` §6
nosi `N-7`, `N-8` i `N-9` w pełnym brzmieniu. Właścicielem jest od teraz `armor`,
więc w `items` te trzy pozycje mają zostać **wskaźnikiem**, nie kopią.
⛔ Świadomie NIE zrobione w tej sesji (zakres misji zabrania poprawiania
istniejących domen). Do zrobienia przy najbliższym dotknięciu `items`.

---

## 7. Granice wyprowadzone z KODU

Misja kazała nie zakładać, że wszystkie cztery granice są zależnościami. Nie są:

| granica | co pokazał kod | werdykt |
|---|---|---|
| `armor` ↔ `items` | `items` dostarcza **pola**, `armor` nadaje im **znaczenie** | ✅ zależność jednokierunkowa |
| `armor` ↔ `combat` | `armor` oddaje **ułamek**; kolejność kroków i jedno zaokrąglenie należą do `combat`; kierunek na wroga jest domknięty w `armor` | ✅ zależność **asymetryczna** — to treść, nie szczegół |
| `armor` ↔ `creatures` | `creatures` jest stroną **popytową**: nosi ochronę i wystawia typy kanałów; zmiana rosteru zmienia sens kolumn profilu, nie odwrotnie | ✅ zależność, ale **przez dane, nie przez kod** |
| `armor` ↔ `shields` | ⚠ **NIE jest zależnością.** Wspólny jest PLIK (`Protection.ts`) i jedno zaokrąglenie w resolverze — czyli fakt domeny `combat`. Geometria osłony nie czyta profilu, arytmetyka ochrony nie czyta stałych tarczy; tarcza jest **z założenia neutralna wobec typu** | ❌ **sąsiedztwo, nie zależność** |

⚠ **Rekomendacja: `armor` i `shields` zostają OSOBNO.** Wspólny plik kusi do
scalenia, ale byłoby to scalenie po **lokalizacji kodu**, a nie po pytaniu, na
które system odpowiada: pancerz mówi „**czym** we mnie trafiono", tarcza „**czy
zdążyłem ją podstawić**". To rozdzielenie jest w kodzie decyzją, nie przypadkiem.
⛔ Rekomendacja, nie zmiana — scalenie domen jest decyzją autora.

---

## 8. Czego procedura tu NIE złapała

1. ⚠⚠ **Przymiar nie sprawdza, czy KOMENTARZ W KODZIE kłamie o kodzie**
   (OI-15) — i ta domena pokazała cenę. Trzy z czternastu rozjazdów (A-4, A-5,
   A-9) leżą w komentarzach configu i w instrukcji przy kodzie, a **A-9 odwraca
   kierunek modelu**: opisuje mnożnik ochrony tak, jakby był mnożnikiem obrażeń.
   Niezmiennik, którego broni, jest słuszny — ale uzasadnienie czytane dosłownie
   uczy nowego czytelnika czegoś odwrotnego niż robi kod. ⛔ Nie naprawione,
   bo leży w `src/`. → **OI-23**.

2. ⚠⚠ **Ekstrakcja nie odróżnia niezmiennika zapisanego jako WŁASNOŚĆ od
   zapisanego jako LICZBA** — a to różnica między regułą, która przeżyje zmianę
   rosteru, a taką, która cicho umrze. A-6 i A-14 to ten sam błąd w dwóch
   warstwach. **Procedura złapała je tylko dlatego, że policzyłem komplety od
   zera**; przepisane z dokumentu przeszłyby jako aktualne. **Reguła dla
   następnych domen: przeliczaj każdy niezmiennik podany jako liczba, zanim go
   przeniesiesz.**

3. ⚠ **„Zielony przymiar" bywa gorszy od czerwonego.** `katalog_ekwipunku.mjs`
   wypisuje `OK` dla asercji nad zamrożoną listą czterech przedmiotów
   i zamrożoną liczbą — nie może zaświecić na czerwono przy zmianie najbardziej
   prawdopodobnej (nowa sztuka w slocie). Projekt ma to zapisane jako regułę
   globalną i **mimo to nie zastosował jej do własnego narzędzia.**

4. ⚠ **Rozjazd bywa też przeciw dokumentowi NAJŚWIEŻSZEMU.** Audyt z 2026-09-03
   ma poprawną tabelę profilu i nieprawdziwe zdanie tuż pod nią (A-8). Data nie
   jest gwarancją dla zdań — tylko dla tabel, które ktoś wtedy odczytał z kodu.

⚙ **Co zadziałało bez zmian względem `items`:** odczyt przez esbuild → node,
tabela granic domeny na początku `STAN` (bez niej dokument rozlałby się na
`shields` i `creatures`), weryfikacja każdego przenoszonego niezmiennika,
`## Pokrycie` wypełniane na końcu z bramek.

**Budżet:** jedna sesja przy ośmiu źródłach zamiast jednego — zadziałało to, że
rdzeń kodu jest mały (240 linii) i skupiony. ⚠ **To nie zapowiada `combat`**,
gdzie rdzeń jest rozproszony.

---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena attributes
stan: zamkniety
kotwice: [src/core/Progression.ts, tools/doc_check.mjs]
otwarte: [OI-12, OI-13, OI-14, OI-15]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Canon Extraction — `attributes`

Druga domena. Procedura z `docs/proces/ekstrakcja_items.md` §1, bez zmian,
plus **rejestr mocy decyzji** (§3) wprowadzony przez
`docs/decyzje/2026-09-05-moc-decyzji.md`.

---

## 1. Co odczytano z KODU

`Progression.ts` (typ `Attribute`, wszystkie gettery, `spendPoint`),
`Stamina.syncMax`, `Equipment.carryCapacity`, `Save`, oraz bloki `ATTRIBUTES`,
`DEFENSE`, `PROGRESSION`, `STAMINA`, `EQUIPMENT_LOAD`, `PLAYER` z żywego configu.

**Ustalone komplety konsumentów** (nie przykłady — pełne listy):
Siła 3 · Witalność 2 · Kondycja 1 · Zręczność 4.

⚠ **Atrybuty są czytane niemal wyłącznie wewnątrz `Progression`.** Poza nim
tylko: udźwig (`Equipment`), zapis (`Save`) i wyświetlanie (`PlayerPanel`).
To dobra wiadomość architektoniczna i warto ją mieć zapisaną — dodanie
piątego atrybutu jest zmianą w jednym pliku plus zapis.

---

## 2. Rozjazdy kod ↔ dokumentacja

| # | dokument twierdzi | kod ma | waga |
|---|---|---|---|
| **R-1** | `atrybuty.md` §11.4: „`GameConfig.ts` ma **dwa komentarze**, które wciąż powołują się na nieistniejące `critChancePerAgility` — zostają do sprzątnięcia" | **oba są sprzątnięte** (2026-09-05); niosą dziś jawną notę „to pole NIE ISTNIEJE" | ⚠ średnia — **kierunek ODWROTNY niż zwykle** |
| **R-2** | żaden dokument o tym nie wie | ⛔ **TRZECI komentarz, w `Progression.ts`** (`critMultiplier`), nadal twierdzi: „Szansa … dzieli cap **z Zręcznością** … **Zręczność mówi jak często**". Zdanie unieważnione przez decyzję A-3 | ⛔ **wysoka** |
| **R-3** | `zaimplementowane.md`:73 — „spending points into Siła (melee damage) / **Kondycja (max HP)** / Zręczność (attack speed + **crit**)" | trzy nieaktualne twierdzenia naraz: trzy atrybuty, HP przy Kondycji, krytyk ze Zręczności | ⛔ **wysoka** |
| **R-4** | `atrybuty.md` §3: „cała pula XP mapy lasu to **825**", stąd „~148 przejść", „jedno przejście = poziom 11" | audyt 2026-09-03 zmierzył ze spawnów **1 115 XP** za las (`D-9`); liczby pochodne są historyczne | ⚠ średnia |
| **R-5** | §11.1 nie wymienia ręki pobocznej | `offhandNumbers` czyta `strScale`/`dexScale` drugim kanałem (Dual Wield, 2026-09-05) | ⚠ niska — **brak, nie sprzeczność** |
| **R-6** | §11 nie opisuje ekonomii punktów | jedna wspólna pula `skillPoints` na atrybuty **i** umiejętności **i** rangi Mastery | ⚠ średnia — **brak** |
| **R-7** | `CLAUDE.md` „⏳ Otwarte": „Siła to płaska premia do obrażeń" | mnożnik per broń od 2026-08-20 | ⚠ znany dług, `konfiguracje_broni_checkpoint.md` §3 |

⚠⚠ **R-1 łamie wzorzec z audytu i z pilotażu.** Dotąd wszystkie rozjazdy szły
w jedną stronę — dokumentacja za kodem. Tutaj dokument jest **bardziej
pesymistyczny niż rzeczywistość**: opisuje dług, który zdążono spłacić tego
samego dnia. Wniosek dla procedury: **nie wolno przepisywać do `STAN` ani
twierdzeń pozytywnych, ani negatywnych bez sprawdzenia w kodzie.** „Jest dług"
starzeje się tak samo jak „nie ma długu".

⚠ **R-3 jest moją własną pomyłką z Etapu 1 i zgłaszam ją wprost.** Poprawiając
`zaimplementowane.md` naprawiłem wiersz 74 (krytyk) i przeoczyłem wiersz 73,
który niósł ten sam błąd plus dwa dodatkowe. Poprawione przy tej ekstrakcji.
**Lekcja: poprawka księgowa robiona bez ekstrakcji domeny łata pojedyncze
zdanie, nie dziedzinę.**

---

## 3. Rejestr decyzji historycznych i ich MOC

Oceniane **względem kodu i późniejszych decyzji**, nie względem tego, jak
stanowczo dokument je zapisał.

| id | decyzja | moc | zastąpiona przez / uwagi |
|---|---|---|---|
| **A-1** | Trzy atrybuty: Siła / Kondycja / Zręczność | `SUPERSEDED` | rozdział na Witalność + Kondycję (2026-08-21, `stamina_model.md`); kod: typ `Attribute` ma cztery warianty |
| **A-2** | Kondycja daje HP (`hpPerEndurance`) | `SUPERSEDED` | HP należy do Witalności; pola nie ma w configu |
| **A-3** | Zręczność daje szansę na krytyka | `REJECTED` | **świadoma decyzja autora**, potwierdzona 2026-09-05 (`atrybuty.md` §11.4). ⚠ Nie przywracać |
| **A-4** | Siła jako płaska premia do obrażeń | `SUPERSEDED` | model skalowania per broń (A-5) |
| **A-5** | Skalowanie obrażeń **per broń**, mnożnikiem (`strScale`/`dexScale`) | ✅ `ACTIVE` | potwierdzone w `Progression.attributeDamageMul` |
| **A-6** | Rozdzielenie recovery od tempa ataku | ✅ `ACTIVE` | `ATTRIBUTES.recoveryPerAgility` czytane osobno od tempa |
| **A-7** | Niezmiennik `hpRegenPerVitality = hpPerVitality / 150` | ✅ `ACTIVE` | zgadza się w configu |
| **A-8** | „**Zręczność** mówi JAK CZĘSTO krytykujesz, **rodzina Axe** JAK MOCNO" | ⚠ `SUPERSEDED` **połowicznie** | pierwsza połowa unieważniona przez A-3; **druga (`critMultiplierBonus` topora) pozostaje `ACTIVE`**. To jest przypadek, przed którym ostrzega `moc-decyzji.md`: decyzja poprawna w chwili T, dziś prawdziwa w połowie |
| **A-9** | `maxCritChance` jako sufit dzielony z atrybutem | `SUPERSEDED` | dziś sufit sprzętu i broni; nazwa pola została (OI-14) |
| **A-10** | Brak respecu, atrybuty rosną tylko w górę | ✅ `ACTIVE` | komentarz i kod w `Equipment` |
| **A-11** | Przedmiot nie może dawać atrybutu (pierścień „+2 Siły" odrzucony) | ✅ `ACTIVE` | **należy do domeny `items`**, tam już przeniesione |
| **A-12** | Jedna wspólna pula punktów na atrybuty i umiejętności | ✅ `ACTIVE` | `spendPoint` zdejmuje `skillPoints` |
| **A-13** | „Budżet 49 punktów to fikcja, realna rozmowa to pierwsze kilkanaście" | ✅ `ACTIVE` **co do zasady** · `HISTORICAL` **co do liczb** | liczby oparte na starej puli XP (R-4) |
| **A-14** | Diagnoza „Zręczność jest stat-pułapką" | `HISTORICAL` | naprawione przez A-5 i A-6; opisuje stan sprzed 2026-08-20 |
| **A-15** | Rekomendacje z pakietu zewnętrznego `atrybuty_ocena.md` | `HISTORICAL` | pakiet wysłany 2026-08-20, **odpowiedź nigdy nie wróciła**; werdykt miał trafić do §10 i trafił tam z innej ścieżki |
| **A-16** | „Czy Zręczność ma za dużo korzyści" | ❓ `OPEN` | OI-12 — nie da się rozstrzygnąć bez nowego pomiaru |
| **A-17** | Krzywa XP pod obecny roster | ❓ `OPEN` | OI-13; wymaga decyzji, nie poprawki |

⚠ **A-8 jest najciekawszą pozycją i dlatego stoi tu z komentarzem.** Została
zapisana w komentarzu kodu jako rozdział ról, była poprawna, a potem połowa jej
przesłanki zniknęła. **Ani jeden dokument tego nie odnotował** — wyszło dopiero
z odczytu kodu. Gdyby ekstrakcja szła od dokumentacji, A-8 zostałaby przepisana
do `STAN` jako obowiązująca zasada.

---

## 4. Co należy do INNYCH domen

| co | domena | status |
|---|---|---|
| pierścień nie może dawać atrybutu (A-11) | `items` | ✅ już przeniesione |
| klasy obciążenia, koszt uniku i sprintu | `stamina` | czeka |
| `strScale`/`dexScale` jako pola przedmiotu | `items` | ✅ przeniesione jako pola |
| dobór `strScale`/`dexScale` jako oś tożsamości broni | `weapons` | czeka |
| krzywa XP, źródła doświadczenia, liczby budżetu (R-4) | `progression` | czeka |
| unik/parowanie jako ogniwa łańcucha obrony | `combat`, `shields` | czeka |
| biegłość `P` jako oś prostopadła | `proficiency` | czeka |

---

## 5. Czego NIE WOLNO stracić przy późniejszej archiwizacji

| co | gdzie dziś leży | dlaczego krytyczne |
|---|---|---|
| **pomiar, który obalił model płaskiej Siły** — przewaga wariantu spadała z 11,8% do 3,3% przy Sile 10 | `atrybuty.md` §10.4b | jedyne uzasadnienie A-5; bez niego ktoś zaproponuje płaską premię z powrotem |
| **pomiar „pół paska w ~75 s przy każdym buildzie"** (77/76/76/76/75 s) | `atrybuty.md` §2 i §11.1 | jedyne uzasadnienie niezmiennika A-7, który łamie się bezgłośnie |
| **powód odpięcia krytyka** — człon atrybutowy był poniżej progu zauważalności w walce trwającej 2–5 ciosów | `atrybuty.md` §11.4 + komentarz w configu | bez niego A-3 wygląda na przypadkowe usunięcie pola |
| **pomiar błędnego wniosku gracza** (35% przy n=5, 22,3% przy n=20 z krytykami wobec 1,2% bez) | komentarz `COMBAT_FEEDBACK` w configu | uzasadnia deterministyczny kanał feedbacku; **przetrwał zmianę przyczyny** |
| **dlaczego rozdzielono tempo od recovery** | `atrybuty.md` §10.5 | bez tego ktoś je z powrotem sklei jako „uproszczenie" |
| **że A-3 była DECYZJĄ, nie regresją** | `atrybuty.md` §11.4 | brak pola wygląda jak zgubiona funkcja |

⚠ **`atrybuty.md` NIE nadaje się do archiwizacji** i nie wolno go zarchiwizować
po tej ekstrakcji. Jest jedynym nośnikiem **wszystkich sześciu** pozycji
powyżej, a `STAN` świadomie ich nie kopiuje (kontrakt: `STAN` opisuje model,
nie historię). Dostał baner rozdzielający warstwy.

---

## 6. Uwagi do procedury

**Co zadziałało tak samo jak w pilotażu:** odczyt z kodu przed dokumentacją
(dał R-2 i R-5, których dokumentacja nie zna), tabela granic domeny, pełne
listy konsumentów zamiast przykładów.

**Co jest nowe i warto powtórzyć:**

- ⚠ **Rejestr mocy (§3) okazał się ważniejszy niż lista rozjazdów.** Siedem
  z siedemnastu decyzji nie obowiązuje, a **żadna z nich nie jest oznaczona
  jako nieaktualna w miejscu, w którym leży**. Bez rejestru `STAN` odziedziczyłby
  A-1, A-2, A-8 i A-9.
- ⚠ **Rozróżnienie `SUPERSEDED` częściowego** (A-8) było potrzebne od razu,
  przy drugiej domenie. Warto przyjąć, że decyzja może być prawdziwa w części —
  i zapisać którą, a nie zaokrąglać do „obowiązuje / nie obowiązuje".

**Nowe znalezisko o samej procedurze — `OI-15`:** kontrola idzie dziś tylko
w jedną stronę. Sprawdzamy, czy dokument nie kłamie o kodzie; **nie sprawdzamy,
czy komentarze w kodzie nie kłamią o kodzie**. R-2 to komentarz w
`Progression.ts` sprzeczny z implementacją trzy linie niżej. Znalazł go
człowiek czytający plik, nie żadna bramka — i nie ma dziś mechanizmu, który
znalazłby następny taki.

---
typ: STAN
domena: movement
tytul: Ruch — intencja, solver, ciało
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-07, przymiar:doc_check, przymiar:movement_weryfikacja]
kotwice:
  - src/core/movement/MoveIntent.ts
  - src/core/movement/Locomotion.ts
  - src/core/movement/BodySpec.ts
  - src/core/movement/PathFollower.ts
  - GameConfig.PLAYER.speed
  - GameConfig.STAMINA.sprintSpeedMultiplier
otwarte: [OI-49]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Ruch — intencja, solver, ciało

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak cokolwiek w tej grze
> się przemieszcza**: kto mówi „chcę tam", kto decyduje którędy i co ostatecznie
> wpisuje prędkość w ciało.
>
> **Czym NIE jest.** ⛔ **Nie podaje prędkości żadnego gatunku** — to są dane.
> Nie mówi, KIEDY ktoś ucieka albo goni; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| jak powstaje przemieszczenie: intencja → solver → ciało | **`movement`** |
| **kiedy** stworzenie goni, ucieka, patroluje | `creatures` |
| ile kosztuje sprint i unik | `stamina` |
| unik jako umiejętność: cooldown, nietykalność, slot | `abilities` |
| impuls jako **skutek trafienia** | `combat` |
| waga sprzętu i klasy obciążenia | `items`, `stamina` |
| kolizja kafli i skąd bierze się siatka nawigacji | `world` |

⚠⚠ **Ta domena nie ma żadnej własnej decyzji o tym, DOKĄD ktoś idzie.**
Odpowiada wyłącznie na „jakim wektorem" — i to jest cała jej odpowiedzialność.

### 0.0 Przestrzeń — JEDNA, ta sama co walka

> ⚠⚠ **Wszystko w tej warstwie liczy się od ŚRODKA CIAŁA** (`body.center`) —
> pozycja własna, cel intencji i każda bramka dystansu AI. To jest dokładnie
> ten punkt, który walka zna jako `combatOrigin` i od którego mierzy prześwit.

⚠ **Do 2026-09-07 były tu DWIE przestrzenie naraz.** Solver liczył wektor od
środka DUSZKA, a omijanie przeszkód i trasowanie sondowały świat od ciała.
Ciało siedzi u stóp — u gracza **19 px** pod duszkiem, u skoczka 2,25 — więc
ta sama liczba w konfiguracji znaczyła co innego zależnie od tego, po której
stronie gracza stał przeciwnik. Zmierzone: prześwit do przeciwnika krążącego
na promieniu **96** wahał się **75,2–93,4 px**, czyli o 18,2 px, bez żadnego
pola, które by o tym mówiło.

⛔ **Zabezpieczenie jest STRUKTURALNE, nie deklaratywne.** Kontrakt solvera
**nie ma już pól z pozycją duszka** — solver, który ich nie widzi, nie może
w tej przestrzeni policzyć wektora nawet przez pomyłkę.

⚠ **Jedyna legalna zamiana duszek → ciało to kotwica WĘDRÓWKI** (punkt losowany
wokół spawnu, który jest w przestrzeni duszka). Podniesienie obu stron
porównania o to samo przesunięcie jest **zmianą zerową**: ten sam dysk pozycji,
ten sam próg dojścia, ten sam tor. ⛔ Nie używać tego do pozycji **innej**
encji — „gdzie jest gracz" ma jedną odpowiedź.

⚠ **Metryka się NIE zmieniła, tylko przestrzeń.** Pozycjonowanie dalej mierzy
**dystans środków**, walka dalej **prześwit** (`combat` §3). Ujednolicenie
metryki to osobne, większe pytanie i **nie zostało otwarte**.

⚠ **Ani jedna liczba nie została przy tym ruszona** — `circleRadius`,
zasięgi wypadu, pasma i progi agro zostały bez zmian; zmieniła się wyłącznie
przestrzeń, w której obowiązują. Rekalibracja jest osobnym etapem.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `movement` **bierze** | `creatures` | intencję i wybór solvera per gatunek |
| `movement` **bierze** | `world` | przejezdność terenu |
| `movement` **daje** | `creatures` | ⚠ odpowiedź „**nie ma drogi**", którą czyta zachowanie |
| `movement` **wykonuje dla** | `combat` | impulsy opisane danymi |
| `movement` **czyta** | `effects` | mnożnik prędkości ze spowolnienia |

---

## 1. Podział: intencja → solver → ciało

```
ZACHOWANIE   „chcę tam" / „chcę się oddalić"      ← creatures, abilities
SOLVER       jakim wektorem, z omijaniem czy bez  ← ta domena
CIAŁO        wpisana prędkość                     ← silnik
```

⚠⚠ **To jest cała granica tej warstwy.** Zdanie „idź do gracza" jest
**identyczne** pod ruchem wprost, pod omijaniem i pod szukaniem drogi — dlatego
dołożenie globalnego trasowania **nie dotknęło ani jednej linii zachowań**.

⚠ **Kompozycja, nie klasa bazowa — wymuszone przez kod, nie przez gust.**
Byty poruszające się nie mają wspólnego przodka; wciśnięcie ruchu w hierarchię
skończyłoby się zdaniem, że **sarna jest wrogiem**.

⚠ **Migracja bezpieczna po jednym:** intencja jest kasowana co klatkę, a jej
brak znaczy „nikt się nie odezwał" — więc byt jeszcze niezmigrowany pisze
prędkość wprost i warstwa milczy.

---

## 2. Słownik intencji

**Pięć rodzajów — bo każdy ma INNĄ POLITYKĘ WOBEC PRZESZKODY.**

| intencja | polityka |
|---|---|
| **stój** | prędkość zerowana co klatkę |
| **dojdź do punktu** | ⚠ cel jest **wiążący** — solver ma prawo nadłożyć drogi |
| **oddal się** | ⚠⚠ **punktu docelowego NIE MA** — wiążący jest kierunek; solver może ślizgać się wzdłuż przeszkody, ale **nie ma prawa zawracać „do celu"** |
| **okrążaj** | dystans wiążący, kierunek swobodny |
| **impuls** | przebieg opisany w całości; ⛔ nie podlega omijaniu |

⚠⚠ **Podział NIE jest estetyczny — wynika z pomiaru.** Zryw ucieczki
potraktowany jak dojście do punktu i „ominięty" przeszkodą **skrócił udział
pełnych zrywów o kilkanaście punktów procentowych**: omijanie zawraca ku celowi,
a ucieczka celu nie ma. ⭐ **Poprawne nazwanie intencji usuwa ten błąd
z definicji, zamiast łatać go doborem stałej.**

---

## 3. Solvery

| warstwa | rola |
|---|---|
| **trasowanie globalne** | wyznacza trasę wokół przeszkód nie do obejścia lokalnie |
| **korekta lokalna** | omija to, co widać teraz |
| **wprost** | dzisiejszy ruch w linii prostej |

⚠⚠ **Trasowanie globalne dotyczy WYŁĄCZNIE intencji „dojdź do punktu".**
Ucieczka nie ma punktu docelowego (nie ma czego trasować), a okrążanie i impuls
nie mają czego omijać globalnie.

⚠ **Model jest dwustopniowy:** trasa globalna przestawia cel na najbliższy punkt
trasy, po czym **ten sam** solver lokalny prowadzi do niego. ⛔ To nie są dwa
konkurujące systemy.

⚠⚠ **Wybór solvera jest PER GATUNEK, nigdy globalny.** Stworzenie, które nagle
zaczyna obchodzić przeszkody, **czyta się inaczej** niż to, które w nie wchodzi
— to jest zmiana odczucia walki, a nie poprawka techniczna.

⚠ **„Nie ma drogi" jest ODPOWIEDZIĄ, nie awarią.** Warstwa liczy ją i tak przy
każdym kroku; zachowanie ma prawo na niej zerwać pościg *(`creatures`)*.
⛔ To nie jest timeout ani licznik prób.

---

## 4. Ciało fizyczne

⚠⚠ **Każde ciało fizyczne w grze jest ZADEKLAROWANE, nigdy odziedziczone po
rozmiarze klatki.**

⭐ **Ta reguła powstała z realnego błędu, nie z porządkowania.** Byt, który
ciała nie zadeklarował, dostawał domyślne ciało silnika — czyli **całą klatkę
arkusza przemnożoną przez skalę**. Zmierzone skutki: ciało szersze niż dwa
i pół kafla, utrata dostępu do większości mapy rozbitej na setki wysp,
i brak możliwości zmieszczenia się we własnym punkcie odrodzenia.

⚠⚠ **Było to niewidoczne, dopóki świat nie miał ścian.** Przed pierwszą kolizją
terenu rozmiar ciała nie znaczył nic — więc **ani kompilator, ani playtest, ani
żaden raport tego nie zgłaszał**.

⚠ **Ciało fizyczne to NIE hurtbox.** Trafialność opisują osobne pola i jest to
celowe: **zwężenie ciała nie może po cichu przestroić zasięgu ciosu**
*(`creatures`, `combat`)*.

⚠ **Wymiary podaje się w pikselach KLATKI, a silnik mnoży je przez skalę**
duszka co klatkę.

---

## 5. Prędkość gracza

```
prędkość = baza × mnożnik spowolnienia × (sprint ? mnożnik sprintu : 1)
```

⚠⚠ **I nic więcej.** Na prędkość gracza **nie wpływa żaden atrybut** ani
**obciążenie sprzętem**. Obciążenie mnoży **koszt** sprintu i uniku
*(`stamina`)*, a nie prędkość (OI-48).

⚠ **Sprint wymaga niezerowego zasobu wysiłku, ale zero go nie blokuje na stałe**
— gdy zasób wróci, sprint znów działa *(reguła zasobu należy do `stamina`)*.

⚠⚠ **Żadne stworzenie nie dogania idącego gracza prędkością pościgu.** Najwyższa
prędkość pościgu w rosterze jest **niższa** od zwykłej prędkości marszu.
⭐ **Dystans zamyka się ZOBOWIĄZANIEM, nie pościgiem** — akcje z fazami mają
własne prędkości, wielokrotnie wyższe. **To jest reguła projektowa całej walki**
i nowa prędkość pościgu nie ma prawa jej złamać po cichu.

---

## 6. Niezmienniki

- **N-124** — **zachowanie zgłasza INTENCJĘ, nigdy wektor** (§1).
- **N-125** — **kompozycja, nie dziedziczenie** (§1).
- **N-126** — **pięć intencji, każda z własną polityką wobec przeszkody**;
  ⛔ nowa intencja powstaje wtedy, gdy ma **inną politykę**, nie inną nazwę (§2).
- **N-127** — **ucieczka nie ma celu**; solver nie ma prawa zawracać (§2).
- **N-128** — **trasowanie globalne tylko dla „dojdź do punktu"** (§3).
- **N-129** — **wybór solvera per gatunek, nigdy globalnie** (§3).
- **N-130** — **„nie ma drogi" to odpowiedź**, nie awaria i nie timeout (§3).
- **N-131** — **każde ciało fizyczne zadeklarowane, nigdy odziedziczone** (§4).
- **N-132** — **ciało fizyczne ≠ hurtbox** (§4).
- **N-133** — **prędkość gracza zależy wyłącznie od bazy, spowolnienia
  i sprintu** (§5).
- **N-134** — **pościg nie dogania; dogania zobowiązanie** (§5).
- **N-135** — **warstwa ruchu jest CZYSTA** (bez silnika i encji) — inaczej jej
  przymiar przestaje cokolwiek dowodzić.

---

## 7. Checklista

**Nowe zachowanie ruchowe:** zgłoś **intencję**, nie wektor (N-124) · ⚠ wybierz
rodzaj po **polityce wobec przeszkody**, nie po nazwie (N-126) · ⛔ nie dopisuj
szóstej intencji, jeśli któraś istniejąca ma tę samą politykę.

**Nowy gatunek:** ⚠ **zadeklaruj ciało** (N-131) i sprawdź, że nie jest
pomylone z hurtboxem (N-132) · rozstrzygnij solver świadomie — ⚠ to zmienia
odczucie walki (N-129) · ⚠ porównaj prędkość pościgu z prędkością marszu gracza
(N-134).

**Zmiana prędkości gracza:** ⚠ sprawdź, czy nie łamie N-134 dla **całego**
rosteru naraz.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/movement_weryfikacja.mjs` · `node tools/combat_regresja.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| intencja jako granica warstwy | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| pięć intencji z rozłącznymi politykami | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| ucieczka bez zawracania | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| trasowanie tylko dla „dojdź do punktu" | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| dwustopniowy model trasa + korekta lokalna | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| „nie ma drogi" jako odpowiedź, bez przeliczania co klatkę | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| solver per gatunek | ✅ | ✅ | `kod:2026-09-06` |
| ciało zawsze zadeklarowane | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| ciało ≠ hurtbox | ✅ | ✅ | `kod:2026-09-06` |
| prędkość gracza: baza × spowolnienie × sprint | ✅ | ✅ | `kod:2026-09-06` |
| **obciążenie MNOŻY prędkość chodu** (Model D) | ✅ | ✅ | `przymiar:obciazenie_przymiar` (K2, R1-R7) |
| **pościg nie dogania marszu** | ✅ | ✅ *(opisane po raz pierwszy)* | ❌ **zmierzone, niezaakceptowane** — OI-49 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-48** | ⚠ **Obciążenie sprzętem mnoży KOSZTY, nie prędkość — a zaparkowane pytanie brzmiało „jaki jest koszt mobilności ciężkiego pancerza".** Parking jest więc **zrealizowany w połowie**: koszt wysiłku tak, prędkość nie. ⚠ **Korekta wcześniejszego ustalenia:** ekstrakcja `armor` zapisała tę pozycję jako w pełni zastąpioną przez wdrożenie obciążenia — to było **za szerokie**. ⛔ Czy prędkość ma reagować na obciążenie, pozostaje **decyzją autora**; ⚠ N-133 opisuje stan dzisiejszy, nie docelowy. |
| **OI-49** | ⚠⚠ **Żadna prędkość pościgu w rosterze nie przekracza prędkości marszu gracza** — zmierzone. Dystans zamyka się **wyłącznie zobowiązaniem** (akcje z fazami mają prędkości wielokrotnie wyższe). ⚠ **To wygląda na spójny projekt** („nie da się uciec bez konsekwencji, ale da się kitować"), **ale nigdzie nie jest zapisane jako reguła** — więc nowa prędkość pościgu mogłaby ją złamać, nie zapalając niczego. ⛔ **Nie rozstrzygam, czy to jest reguła, czy zbieg okoliczności** — potrzebne jedno zdanie autora, a po nim asercja. |

---

## Czego ten dokument nie rozstrzyga

- **Prędkości żadnego gatunku** ani gracza — to są dane.
- **Balansu**: czy ktoś jest za szybki albo za wolny.
- **Kiedy** stworzenie goni, ucieka albo patroluje — `creatures`.
- **Ile kosztuje sprint i unik** — `stamina`.
- **Uniku jako umiejętności** (cooldown, nietykalność) — `abilities`.
- **Impulsu jako skutku trafienia** — `combat`.
- **Skąd bierze się przejezdność terenu** — `world`.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego intencja, a nie wektor; pomiar ucieczki | `src/core/movement/MoveIntent.ts` *(instrukcja przy kodzie)* | ACTIVE |
| dlaczego ciało musi być zadeklarowane — pełny zapis błędu | `src/core/movement/BodySpec.ts` | ACTIVE |
| przebudowa nawigacji lasu i jej zamknięcie jako etapu | `docs/las_faza1b_final.md`, `docs/plan_dalszych_prac.md` | HISTORICAL — ⚠ etap zamknięty, nie stan |
| dlaczego omijanie włącza się per gatunek | `docs/dziennik.md` 2026-08-31 | ACTIVE |
| rozjazdy, rejestr decyzji i pomiary ekstrakcji | `docs/proces/ekstrakcja_movement.md` | — |

---
typ: HISTORIA
domena: [weapons, items, ui, proces]
tytul: Checkpoint 2026-09-17 — punkt wejścia po sesji katalogu broni
stan: zamkniety
otwarte: [OI-107, OI-105, OI-108, OI-109, OI-110, OI-111, OI-112, OI-24, OI-84, OI-72, B1, B2, B3, C1, C2, C4, C5]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT 2026-09-17 — punkt wejścia

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. W swoim zakresie (roster broni, oś materiału, `minReach`) wolno z niego brać pomiary i powody.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **[w dniu zapisu] punkt wejścia projektu.** Ten plik zastępuje
> `docs/checkpoint_2026-09-16.md` jako punkt wejścia. Tamten w swoim zakresie
> (30 tarcz, `T-1`, pomiar `OI-24`, pięć paczek pancerza) jest nadal aktualny,
> ale **nie wie o niczym z 2026-09-16/17**.
>
> ⛔ **Nie czytaj stąd stanu repozytorium — SPRAWDŹ GO:**
> `git log --oneline -3 && git status --short`.
>
> ⛔ **Nie czytaj stąd liczebności rosteru.** Tabela niżej jest MIGAWKĄ z dnia
> zamknięcia etapu, nie źródłem prawdy. Źródłem jest
> `docs/ekwipunek_przedmioty.md` (generowany przez
> `tools/katalog_ekwipunku.mjs`).

## Co ten etap zamknął

⚠ **Ten plik opisuje TRZY partie z tego samego dnia.** Etap I: układ panelu
handlu, reorganizacja `docs/systemy/items.md`, katalog broni **11 → 21**
i model przedmiotu bojowego (§1–§10 niżej). Etap II: **21 → 30** po warstwach
społecznych. Etap III: **30 → 32**, drabinka ROZMIARU mieczy.

---

## ⭐ ETAP III — drabinka ROZMIARU mieczy (30 → 32)

⚠⚠ **To jest KOREKTA ZAKRESU od autora, nie kolejna partia szerokości.**
Etap II zamknął audyt wnioskiem *„rodzina `sword` nie potrzebuje dokładania"* —
i ten wniosek **zostaje w mocy dla konstrukcji SZERMIERCZYCH** (gladius, estok,
katzbalger, „miecz szczerbaty" są dalej odrzucone). Zawężony jest jego zasięg:
audyt pytał o sposoby FECHTOWANIA i nie zadał pytania o **oś ROZMIARU**.

```
   przed:   Miecz 1H (68) ─────────► Bastard 2H (78)          ...i nic wyżej
   teraz:   Miecz 1H (68) → Miecz długi 1H (74) → Bastard 2H (78)
                          → Miecz dwuręczny (82) → Wielki miecz (92)
```

Pełny wywód, sufity i pytanie o chwyt:
**`docs/decyzje/2026-09-17-drabinka-mieczy-i-chwyt.md`**.

### Cztery miecze, cztery RÓŻNE koszty

| | ręce | obr. | zasięg | martwa | łuk | cykl | Siła | cena | czym płaci |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Miecz długi** | **1** | 9–15 | 74 | — | 72° | 560 ms | 4 | 195 | brakiem parowania i najwyższą bramką Siły wśród 1H |
| Bastard | 2 | 12–19 | 78 | — | 70° | 600 ms | 4 | 260 | slotem drugiej ręki |
| Miecz dwuręczny | 2 | 14–23 | 82 | — | 88° | 800 ms | 6 | 380 | tempem |
| **Wielki miecz** | **2** | 20–34 | 92 | **30** | 104° | 950 ms | 8 | 600 | **wszystkim naraz** |

⛔ **To nie jest drabinka mocy.** Miecz długi **bije słabiej w dps od zwykłego
miecza** (24,0 wobec 25,8) i jest od niego wolniejszy — kupuje się w nim zasięg
74 i łuk 72°, czyli najdłuższą i najszerzej zamiatającą broń jednoręczną
w grze. ⛔ Nie jest „mieczem z większymi obrażeniami".

⚠⚠ **Trzy z czterech liczb miecza długiego to SUFITY, nie wybory**: średnia
12,0 (`§Y Y3`), zasięg 74 (`§Y Y2` — najkrótsza 2H ma 76), cooldown 0,56
(`§Y Y1` — najszybsza 2H ma 0,60). ⛔ Żadnej nie da się podnieść bez
przestrojenia broni dwuręcznej.

### Wielki miecz — ekstremum ośmiu osi, zero nowych mechanik

Najwyższa średnia (27,0) · najszerszy łuk w grze (104°) · najdalszy zasięg
niedrzewcowy (92) · najwolniejszy cykl (950 ms) · najwyższa bramka Siły (8) ·
największa masa (8 kg) · najwyższa cena (600 g) · **pierwsza martwa strefa poza
bronią drzewcową**.

⭐⭐ **Martwa strefa 30 jest tu najważniejsza.** `minReach` był dotąd cechą
wyłącznie pik, halabard i glewii — na tyle konsekwentnie, że łatwo było wziąć go
za własność rodziny `polearm`. **Nie jest**, i wielki miecz to teraz *pokazuje*.
⚠ Sufit zasięgu 92 wyznacza `§ZB Z9` (najkrótsza drzewcowa ma 98), nie gust.

### ⏳ C5 / `OI-112` — bastard zostaje `hands: 2`

**⛔ Nie powstała żadna prowizorka.** Dwa profile chwytu to zmiana mechaniki:

- ⛔ **wariantami się tego NIE DA** — wariant nie dotyka `hands`, więc druga ręka
  zostałaby zablokowana w obu profilach;
- brakuje **nośnika stanu chwytu** (per zestaw, nie per egzemplarz), **warstwy
  statystyk zależnej od chwytu**, **sterowania w UI** i **drugiego klipu 3D**;
- ⚠⚠ **`§Y` dzieli roster na 1H i 2H** — konstrukcja będąca obiema nie należy do
  żadnego z porównywanych zbiorów. To jedyny punkt, w którym ta zmiana dotyka
  NIEZMIENNIKA, a nie kodu, i **od niego trzeba zacząć**;
- ⭐ gotowy jest **zapis**: nowe pola wchodzą jako opcjonalne bez `SAVE_VERSION`.

### Nowa bramka: `tools/rece_przymiar.mjs`

⚠⚠ **Reguła „dwuręczna blokuje drugą rękę" żyła w pięciu miejscach `Equipment`
i NIC jej nie uruchamiało** — `§Y` bada liczby broni, nie zachowanie. Przymiar
sprawdza obie ścieżki (`accepts` dla podświetlenia w panelu, `equip` dla samej
operacji, bo to **dwa niezależne czytelniki**), obie strony (1H wpuszcza tarczę,
2H odmawia), oba zestawy — i **granicę `Save.load()`**, czyli `normalizeHands`,
jedyne miejsce, gdzie nielegalna para w ogóle może powstać.

```
9/9 zielonych · sabotaż: wyłączenie zestawu schowanego → BŁĄD,
                wyłączenie `usesBothHandsIn` w `accepts` → BŁĄD
```

### Art: ikony trzeba było NARYSOWAĆ

⚠⚠ **Obie wolne głownie rzędu mieczy są MNIEJSZE od zwykłego miecza** —
(0,2) 174 px, (0,3) 185 px wobec **239 px** `sword`. Ikona „miecza długiego"
mniejsza od miecza kłamie o jego jedynej cesze. Oba kafle rysuje
`tools/build_ikony_mieczy.py` w paletę próbkowaną z arkusza, do pustych
kafli **(1,4)** i **(1,5)**.

⚠ **Sam rozmiar nie wystarczył**: pierwsza wersja wielkiego miecza czytała się
przy 17,6 px tak samo jak tasak. Rozstrzygnęło **zbrocze** — ciemna bruzda
wzdłuż środka głowni, której nie ma żadna inna ikona arkusza. Widać to było
wyłącznie na zestawieniu ośmiu ostrzy w skali półki sklepu.

### ⚠ Koszt zapisany jawnie: `W4` się ruszył

**`obciazenie_przymiar` `W4` pokazuje 59,7 kg zamiast 58,7 — przesunął go wielki
miecz** (8 kg wobec 7 kg młota bojowego). ⛔ Nie jest to nowa usterka: `W4` jest
czerwony od 2026-09-15, pasmo należy do `OI-105`, a dominuje ciężka pawęż
(16,2 kg). ⚠ **Nie obniżono masy do 7 kg, żeby pomiar został nietknięty** —
strojenie danych pod wygodę pomiaru odwraca zależność między nimi.

---

# ETAP II — druga partia szerokości (21 → 30)

⚠⚠ **Partia I pokrywała RODZINY. Partia II pokrywa WARSTWY SPOŁECZNE.**
Kryterium przyjęcia brzmi dziś: *konstrukcja wchodzi, gdy potrafisz powiedzieć,
KTO w świecie jej używa i DLACZEGO akurat jej*. Pełny wywód, test „czy to nie
synonim" i lista odrzuconych kandydatów:
**`docs/decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md`**.

| konstrukcja | rodzina | ręce | kto tego używa |
|---|---|---:|---|
| **Nóż** *(żelazo)* | `dagger` | 1 | chłopi, biedota, każdy — narzędzie, nie oręż |
| **Mizerykordia** | `dagger` | 1 | rycerstwo, skrytobójcy, bogaci mieszczanie |
| **Buzdygan** | `blunt` | 1 | straż i zbrojni — kuty seryjnie |
| **Kilof** | `blunt` | 1 | górnicy, kopacze — i bandyci, którym został w rękach |
| **Nadziak** | `blunt` | 1 | jazda i szlachta |
| **Cep bojowy** *(żelazo)* | `blunt` | 2 | chłopi w rebelii; **najtańsza 2H w grze** |
| **Topór brodaty** | `axe` | 1 | osadnicy, najemnicy, drużynnicy |
| **Berdysz** | `axe` | 2 | straż miejska i piechota |
| **Rohatyna** | `polearm` | 2 | myśliwi — poprzeczka na dzika |

⛔ **Rodzina `sword` nie dostała ANI JEDNEJ pozycji i to jest WYNIK AUDYTU.**
Osiem mieczy pokrywa już mieszczanina, straż, żołnierza, rzeźnika, bandytę,
obcego kupca i rycerza. Gladius, estok, katzbalger i „miecz szczerbaty" odpadły
jako synonimy albo jako **oś JAKOŚCI przebrana za konstrukcję**.

### Dwie osie użyte zamiast nowych rodzin

- ⭐ **`pierce` z rodziny `blunt`** (kilof, nadziak) — pierwszy raz, kiedy
  rodzina obuchowa niesie inny typ obrażeń. ⛔ Nie łamie reguły zawężania: typ
  obrażeń należy do WARIANTU, a precedens stoi po drugiej stronie (siekiera ma
  wariant `Obuch`).
- ⭐ **`material: "iron"`** (nóż, cep) — **pierwsi użytkownicy osi gatunku po
  stronie broni**. ⚠⚠ Ich `damageMin/Max` i `buyPrice` w `ITEMS` to
  **RÓWNOWAŻNIK STALOWY**: nóż zapisany 7–10 / 20 g działa jak 5,6–8,0 / 12 g.
  ⛔ Nie jest to zaproszenie do podwojenia katalogu żelaznymi bliźniakami.

### ⛔ Czego niezmienniki NIE wpuściły — `C4` / `OI-108`

**Dzida (jednoręczna drzewcowa) nie powstała.** Włócznia z tarczą to najczęstszy
zestaw piechoty, jaki istniał, i dziś **nie da się go złożyć** — wszystkie
cztery drzewcowe są `hands: 2`. Blokuje to `§Y Y2`, a korytarz jest pusty:

```
   ≤ 74 px   przestaje być drzewcową (osiosany kij ma 74)
   ≥ 76 px   łamie Y2 (najkrótsza 2H, topór bojowy, ma 76)
```

⛔ **Nie dopisano drugiego wyjątku obok `hammer`.** Wyjście jest jedno z dwóch
(podnieść zasięgi 2H albo wymienić Y2) i **oba są rebalansem rosteru**.

### Trzy bramki, które PRZESTROIŁY liczby zamiast je przepuścić

| bramka | co wymusiła |
|---|---|
| `§T6` | **trzy cooldowny**: nóż 0,42 → 0,44, cep i berdysz 0,72 → 0,70 — trafienie wypadało 25–35 ms od końca okna ogłuszenia przy progu 50 ms |
| `§Y Y3` | **sufit średniej 1H = 12,0** — buzdygan, kilof i nadziak stoją dokładnie na nim |
| `§ZB Z1` | **łuk topora brodatego 62°** (węziej niż toporek) i **cena rohatyny 190 g** (drożej niż włócznia) |

⭐ **Ani razu nie poluzowano niezmiennika, żeby przepchnąć zawartość.**

⚠ Osobno **dwie konstrukcje trzeba było przeliczyć z PUŁAPKI na WYBÓR**: nóż
(14,6 dps za 15 g wobec 16,8 dps za 12 g osiosanego kija) i mizerykordia
(23,1 dps za 150 g wobec 25,0 dps za 40 g sztyletu, przy premii krytyka już
policzonej w tej liczbie). **Granica jest taka:** wolno być gorszym
w *niektórych* kanałach; nie wolno być gorszym we *wszystkich* naraz **i**
droższym. Pierwsze jest tożsamością, drugie jest usterką.

### Dystrybucja — TRZY półki, nie jedna

| kupiec | co dostał | jakość |
|---|---|---|
| **Myśliwy** | Nóż, Rohatyna | 2–3 |
| **Radzim (Kowal)** | Buzdygan, Nadziak, Topór brodaty, Berdysz, Mizerykordia | 1–2 |
| **Rolnik** | Cep bojowy, Kilof — ⭐ **pierwsza półka Rolnika w ogóle** | 2–3 |

⭐ **Rohatyna u Myśliwego prostuje starą niezgodność**: komentarz przy `spear`
(2026-08) mówił wprost *„oszczep na dziki byłby fabularnie ładniejszy"*
i odrzucił włócznię jako zwykłe wojskowe żelazo. ⛔ Włócznia zostaje u Radzima.
⛔ **Cep i kilof NIE idą do Radzima** — cała ich tożsamość stoi na tym, że nikt
ich nie kupił jako broni. Kilof z półki kowala jest towarem; kilof od chłopa
jest kilofem. ⚠ Półka Radzima rośnie 65 → 70 — dług `B2`.

### Co zmieniło się w STRAŻNIKACH (żadna zmiana nie poluzowała asercji)

| zmiana | po co |
|---|---|
| `§ZB` liczy na wartościach **EFEKTYWNYCH** (po `WEAPON_MATERIAL`) | surowo żelazny cep wychodziłby o 25% za mocny **i** o 67% za drogi naraz |
| `§ZB Z9` *(nowe)* | każda drzewcowa sięga dalej niż każda niedrzewcowa — obietnica rodziny `polearm` przestała być zdaniem w komentarzu (N-94) |
| `§ZB Z10` *(nowe)* | gatunek ma ≥ 1 użytkownika, czyli ścieżka mnożenia jest przechodzona |
| `§W W11c` przestało liczyć RĘCZNIE | stało `bezStrefy.length === 18` — licznik zapalał się przy każdej nowej broni, choć nic się nie psuło |
| `§W W9` *(nowe)* | żelazna broń bije 0,80 i kosztuje 0,60 nominału — **jedyny wiersz dowodzący, że oś coś ROBI** |
| zamek `material` pancerza przepuszcza `type: "weapon"` | dwie osie wymieniły się odpowiedzialnością; ⛔ wyjątek nie rozszerza się na inne typy (`§E E2`) |
| generator katalogu mnoży przez gatunek | czytał `damageMin` wprost i od dziś kłamałby o 25% obrażeń i 67% ceny |

⚠ Wszystkie nowe i zmienione asercje **przeszły sabotaż** — każda umie zaświecić
na czerwono.

### Art etapu II

⭐ **Ikony: ZERO placeholderów, dziewięć z dziewięciu z `items.png`.**
⚠⚠ Przy okazji spisano **mapę rzędów BRONI tego arkusza**
(`public/assets/README.md`) — do tej pory opisane były wyłącznie rzędy pancerza,
więc każda partia broni zaczynała się od archeologii pikseli.
⚠ **Modele 3D: dalej brak** — po etapie III dla **21 z 32** konstrukcji (`OI-109`).
⏳ **Kosa bojowa** przeszła projektowo i jest zablokowana ARTEM (`OI-110`).

---

*(dalej: ETAP I)*

---

---

# ETAP I — zapis z pierwszej partii tego dnia

⚠ Wszystko niżej opisuje stan **po partii I**. ⛔ **Liczba „21 konstrukcji"
niżej jest MIGAWKĄ z tamtej chwili** — dziś jest **32**, a źródłem prawdy
o rosterze jest `docs/ekwipunek_przedmioty.md` *(generowany)*.

## 1. Roster broni — migawka 2026-09-17

**11 → 21 konstrukcji.** Dziesięć nowych, zero nowych rodzin, zero nowych
gałęzi w kodzie walki.

⛔⛔ **Stała tu MIGAWKA 21 konstrukcji: 23 wiersze liczb przepisane ręcznie
z `GameConfig.ts`. Wycięta 2026-09-17 razem z etapem II.** Powód nie jest
oszczędnością miejsca: tabela **zestarzała się tego samego dnia, w którym
powstała**, a plik, w którym stała, sam nad nią ostrzega („⛔ Nie czytaj stąd
liczebności rosteru"). Ostrzeżenie nad nieaktualną tabelą przegrywa
z tabelą — to jest ta sama lekcja, którą zapisał baner
`docs/ekwipunek_przedmioty.md`.

⭐ **Roster i wszystkie jego liczby czyta się z `docs/ekwipunek_przedmioty.md`**
(generowany przez `tools/katalog_ekwipunku.mjs` wprost z configu, z kolumną
`gat.` dla broni żelaznej). Etap I dodał dziesięć konstrukcji: Kiścień,
Glewia, Halabarda, Pika, Kord, Rapier, Szabla, Tasak, Bastard, Miecz
dwuręczny.

⚙ **„Nóż" NIE ISTNIAŁ po etapie I — POWSTAŁ w etapie II** (2026-09-17).
⚠ Zdanie „nie wymuszono konstrukcji bojowej" opisywało sytuację, w której nóż
nie miał ani ikony, ani sprzedawcy, ani powodu. Etap II znalazł wszystkie trzy:
kafel **(8,0)** — jedyną głownię bez jelca na arkuszu — półkę Myśliwego
i rolę „najtańsze ostrze, które ma każdy". ⛔ Nie jest to cofnięcie tamtej
decyzji, tylko domknięcie jej od strony, która wtedy była pusta.

---

## 2. Model przedmiotu bojowego — cztery osie

```
Construction → Material → Quality → Variant
```

### 2.1 `WEAPON_MATERIAL` — gatunek broni (NOWE)

`core/WeaponMaterials.ts`, bliźniak `ArmorMaterials.ts`. Mnoży **obrażenia
i cenę**, i nic poza tym.

- ⭐ **Stal to poziom ZEROWY** — broń bez pola `material` czyta się jako stalowa
  (×1,00). Zamek `§W5` w `materialy_przymiar` dowodzi, że wprowadzenie osi **nie
  ruszyło ani jednej istniejącej liczby** (miecz 9,00–14,00 przed i po).
- Żelazo: `damageMul` 0,80 · `priceMul` 0,60. ⚠ **`priceMul` musi zostać niższy
  od `damageMul`** — inaczej tańszy gatunek jest pułapką, nie wyborem (`§W2`).
- ⛔ **Gatunek nie rusza masy, `requires`, tempa ani zasięgu i nie jest rodziną.**
- ⚠⚠ **Dziś z pola korzysta ZERO broni i to jest poprawny stan docelowy tego
  etapu.** Oś ma pozwalać wystawić żelazny wariant konstrukcji, a nie zmuszać do
  podwojenia katalogu w dniu powstania. ⛔ Nie rozmnażaj `ItemId`.

### 2.2 `melee.minReach` — martwa strefa (NOWE)

Dolna granica zasięgu, opcjonalna; brak = `0` = zachowanie sprzed wprowadzenia.

- Mierzy się **tym samym prześwitem** co `reach` (`HitResolver.withinReach`),
  próg `>=` (nie `>`), skaluje się tym samym `reachMul` wariantu.
- ⛔ **Własność KONSTRUKCJI, nigdy rodziny.** Włócznia jej nie ma, pika ma —
  obie są `polearm`. Pilnuje `§ZB Z5`.
- ⚠⚠ **Dolna granica należy do POSTACI, nie do ręki.** `offhandStrike` bierze
  `Progression.attackMinReach`; wzięcie jej z drugiej broni odtworzyłoby co do
  joty **zastój autoataku** z 2026-09-07, tylko od strony zwarcia.

### 2.3 `parryBonus` — z RODZINY na KONSTRUKCJĘ

```
przed:  WEAPON_FAMILY.sword.traits = [{ kind: "parryBonus", value: 0.15 }]
teraz:  WEAPON_FAMILY.sword.traits = [{ kind: "parry" }]   ← znacznik, jak `reach` u polearm
        ITEMS.sword.melee.parryBonus       = 0,15  (bez zmian)
        ITEMS.short_sword.melee.parryBonus = 0,15  (bez zmian)
        ITEMS.rapier.melee.parryBonus      = 0,30  ⭐
```

⚠ **Powód:** przy jednym mieczu cecha rodziny wyglądała poprawnie; przy ośmiu
oznaczałaby, że rapier nie ma jak być lepszym parrierem od tasaka.
⭐ **Znacznik jest nośny** — czyta go `MasteryCard`, a `Progression.parryChance`
dalej mnoży EFEKT przez `traitMul` rangi. Zmierzone w silniku: miecz **5,75%**
bez rangi i **11,50%** przy M-IV — identycznie jak przed zmianą.
⛔ Nie przywracaj wartości liczbowej do `WEAPON_FAMILY`.

### 2.4 `hands` — dwa stany, bez trzeciego

**Bastard deklaruje `hands: 2`.** ⛔ Trzeci stan nie powstaje: przełączalny
chwyt to przyszła MECHANIKA, nie wariant zapisu, i nie blokuje katalogu.
Zamek `§Y5`: `Progression` **w ogóle nie rozgałęzia się po liczbie rąk**.

---

## 3. Drzewcowe — czym się różnią

⚠⚠ **Zasięg ich NIE różnicuje i nie może.** Trafialność orbitującego wilka
skacze z 22,1% na 97,0% między 95 a 96 px (`WOLF.pack.circleRadius` = 96), więc
każda użyteczna broń drzewcowa stoi powyżej progu — po tej samej stronie jedynej
liczby, która naprawdę rozstrzyga.

| | tożsamość |
|---|---|
| **Włócznia** | jedyna **bez martwej strefy**; czysty zasięg, najtańsza, najniższa bramka Siły |
| **Pika** | skrajność w obie strony: najdalej (128) i najbardziej bezradna w zwarciu (62); najwęższy łuk po rapierze; **najwolniejsza broń w grze** |
| **Halabarda** | jedyna **dwuwariantowa** drzewcowa i najmocniejsza; średnia martwa strefa |
| **Glewia** | najszerszy łuk w grze po siekierze (74°), najszybsza z czterech, najmniejsza martwa strefa |

Pilnuje tego `§ZB Z3`: **każda para musi różnić się ≥2 osiami spoza zasięgu**
(martwa strefa · łuk · liczba wariantów · dps). Dziś każda różni się 3–4.

---

## 4. UI: `tooFar` / `tooClose` — czwarty stan pierścienia

⚠ Cel w martwej strefie piki dostawał `outOfReach`, czyli komunikat **„podejdź
bliżej" w sytuacji, w której trzeba odejść**.

```
dosięgam         → barwa aktywnego celu, alfa pełna
za daleko        → ta sama barwa, PRZYGASZONA
za blisko        → BURSZTYN, alfa niemal pełna     ⭐ NOWE
w zasięgu, tyłem → błękit, alfa niemal pełna
```

Bursztyn, bo błękit należy do „tyłem" (naprawiasz obrotem), a czerwień do
aktywnego celu. ⚠ **Czwarta barwa w walce — dokłada się do `OI-72`** (barwa jako
jedyny nośnik, odbiór niesprawdzony ręką).

---

## 5. Warianty ataku — stan

⛔ **Żadnego ślepego `light`/`ordinary`/`heavy`.** Broń **nie używa** osi
`SHIELD_VARIANT` — `itemVariant()` zwraca `null` dla wszystkich 21 konstrukcji.

Warianty broni to `attacks` (sposoby użycia) i przyznano je **tylko tam, gdzie
niosą różnicę**: dwa mają miecz, krótki miecz, siekiera, topór bojowy, bastard,
miecz dwuręczny i halabarda. ⛔ Glewia dostała **jeden** — pchnięcie drzewcem
należy do piki i halabardy, a wariant „bo inne mają" jest wypełniaczem.

---

## 6. Dystrybucja

| kupiec | pozycji | co doszło |
|---|---:|---|
| **Radzim (Kowal)** | 65 *(→ 70 po etapie II)* | dziewięć konstrukcji — towar z drugiej ręki i odpadowe żelazo (`bron_skad`) |
| **Myśliwy** | 13 | **Kord** — „drewno, skóra i to, co zostaje z tuszy"; domyka drabinkę kij → sztylet → kord |

⛔ Zero nowych linii dialogu. ⛔ Zero systemu tag × region × kupiec.
⚠ Półka Radzima jest **jedyną półką z bronią** i ma 65 pozycji — patrz `B2`.

---

## 7. Art

⭐ **Ikony: ZERO placeholderów.** `items.png` niósł gotowe sylwetki wszystkich
dziesięciu (szabla 2,1 · tasak 6,0 · kiścień 6,4 · pika 4,5 · glewia 8,2 ·
halabarda 9,2). W silniku `dev.missing()` puste, `load.totalFailed` = 0.

⚠⚠ **Modele 3D: BRAK dla wszystkich dziesięciu** *(po etapie II: 19 z 30, `OI-109`)*. `char.glb` niesie jedenaście
siatek `Bron_*` — dokładnie tyle, ile było broni przed tą sesją. Każda nowa
konstrukcja rysuje się jako **pusta dłoń + `console.warn`**
(`Character3D.ustawSlot`). Degradacja jest zaprojektowana, ale widoczna;
potwierdzone zrzutem z piką w ręku.
⚠ Serwer MCP `blender` nie wstał w tej sesji (`CONNECTION_CLOSED`) — modeli nie
dało się przygotować. **Nie blokuje niczego.**

---

## 8. Nowe bramki

| bramka | co pilnuje |
|---|---|
| `combat_regresja` **§W11** | martwa strefa gatuje trafienie, a broń bez `minReach` zachowuje się dokładnie jak przed zmianą |
| `combat_regresja` **§ZB** | spójność katalogu: dominacja, bliźniaki, różnicowanie drzewcowych, `parryBonus` nie spływa z rodziny, dwa stany pierścienia |
| `materialy_przymiar` **§W** | gatunek broni: stal zerowa, `priceMul < damageMul`, zero zmian w istniejących liczbach, sabotaż gatunku spoza tabeli |
| `sklep_uklad` *(nowe w tym etapie)* | okna przewijania obu kolumn sklepu, rząd ZAŁOŻONE, ramki ekranu |

⚠ Wszystkie sabotowane przed przyjęciem — każda umie zaświecić na czerwono.

---

---

> ⚠ **Trzy sekcje niżej (§9–§11) są GLOBALNE, nie należą do etapu I.**
> Opisują stan po wszystkich trzech partiach tego dnia.

## 9. Stan testów — PO TRZECH ETAPACH

```
tsc --noEmit ✅   npm run build ✅   doc_check ✅ 0 błędów

combat_regresja ✅ 121/121 ZERO RÓŻNIC (+ §ZB Z9/Z10, §W W11c)  attack_resolver ✅
rece_przymiar ✅ 9/9 (NOWE)   materialy_przymiar ✅ (+ §W W9)   bieglosc ✅
katalog_ekwipunku ✅ 0 bloków (+ kolumny `gat.` i `martwa`)
sklep_uklad ✅  sklep_cofniecie ✅  ekwipunek_uklad ✅  ui_panele ✅  hud_uklad ✅
stamina_przymiar ✅  stamina_weryfikacja ✅  tarcze_przymiar ✅  viewport ✅
effects ✅  movement ✅  action_runner ✅  quest_guidance ✅  gathering ✅
atrybuty_kalibracja ✅  atlas ✅  occlusion ✅  culling ✅  combat_geometry ✅
```

### ⛔ Trzy czerwone — WSZYSTKIE sprzed 2026-09-17

| bramka | co | dlaczego nietknięte |
|---|---|---|
| `warstwy_przymiar` | `A1`/`C4`: asercja mówi o **18 adresach** `EQUIP_SLOTS`, jest **19** | **`OI-107`** — przyszło z ożywienia slotu `shoulders` (`d5bd27d`, 2026-09-16). Decyzja autora: nie naprawiać przy okazji innego zakresu |
| `zestawy_przymiar` | `A4`: **10 miejsc** wobec **11** | to samo `OI-107` |
| `obciazenie_przymiar` | `W4`: najcięższy zestaw **59,7 kg** wobec pasma 40–55 kg | ciężka pawęż (16,2 kg); pasmo to kalibracja Modelu D, `OI-105`. ⚠⚠ **Liczba wzrosła z 58,7 w etapie III — przesunął ją WIELKI MIECZ** (8 kg wobec 7 kg młota bojowego). ⛔ Nie obniżono jego masy, żeby pomiar został nietknięty |

---

## 10. Znane B/C

**C4 — jednoręczna drzewcowa (dzida) nie może powstać bez rebalansu rosteru.**
Pełny zapis w sekcji ETAP II wyżej; rejestr: `OI-108`.

**C5 — bastard 1H/2H wymaga nośnika stanu chwytu, warstwy statystyk, UI i
rozstrzygnięcia, czym staje się `§Y`.** ⛔ Wariantami się tego nie da.
Pełny zapis: sekcja ETAP III; rejestr: `OI-112`.

**B1 — `statBroni()` NIE powstaje.** Próg („druga rodzina dostanie ≥6 modeli
różniących się głównie liczbami") **niespełniony**: osiem mieczy różni się nie
tylko liczbami (parowanie 0/0,15/0,30, jeden albo dwa warianty, crit, `hands`).
Abstrakcja przyjęłaby tyle wyjątków, ile ma wpisów. ⛔ Nie twórz jej na zapas.

**B2 — dystrybucja to 21 ręcznych tablic `stock`.** Radzim ma 65 pozycji i jest
jedynym sprzedawcą broni. Docelowo reguła (tag × typ kupca × region × poziom).

**B3 — dwie drabinki materiału.** `ARMOR_MATERIAL` i `WEAPON_MATERIAL` mają te
same nazwy gatunków. Przy TRZECIM gatunku zechcą się zejść w jedną
`MATERIAL_GRADE` z kolumną per konsument.

**B4 — `docs/systemy/combat.md` ma 13 bajtów zapasu** do limitu `STAN`.
Następne zdanie o walce nie zmieści się nigdzie. To jest `OI-84`.

**C1 — `§T6` testuje kombinację, której gra zabrania.** Kalibracja okna
ogłuszenia sprawdza wszystkie bronie, w tym `hands: 2` — a Uderzenia tarczą nie
da się wykonać bronią dwuręczną. ⛔ Nie zawężono: `stunMs` jest zamrożone
decyzją autora. Trzy nowe bronie wyprowadzono poza okno zamiast tego.

**C2 — rapier a ranga Mastery.** `parryChance` mnoży efekt przez `traitMul`,
więc M-IV daje rapierowi **13,0%** wobec 11,5% zwykłego miecza. Zamierzone, ale
to pierwsza broń, w której ranga RODZINY skaluje cechę KONSTRUKCJI — warto
potwierdzić po playteście.

**C3 — `OI-107`** (19 vs 18 adresów) czeka na rozstrzygnięcie: poprawka liczby
czy przeredagowanie reguły taksonomii.

---

## 11. Pierwsze kroki następnej sesji

1. ⭐⭐ **`P1`** — pomiar rozkładu kątów ciosów. Instrument gotowy, **wymaga
   GRANIA**. Odblokowuje `B3` → wartości `sideArcDeg` → cały `T-1` tarcz.
2. **`OI-105a`** — playtest Modelu D; protokół w
   `docs/playtest_protocol_oi105a.md`. Też wymaga grania, można razem z `P1`.
3. **`OI-107`** — jedno zdanie autora zamyka dwie czerwone bramki.
4. Modele 3D dziesięciu konstrukcji, gdy wróci Blender.

⛔ **Nie zaczynaj kolejnego etapu contentu przed `P1`.** Roadmapa stawia po
broni **tarcze** (domknięcie wg checkpointu), a te stoją na pomiarze.

---

## Gdzie co czytać

| pytanie | dokument |
|---|---|
| jak działa broń (rodzina, wariant, zasięg, `minReach`, materiał) | `docs/systemy/weapons.md` |
| czym JEST przedmiot (pola, jakość, trwałość, warstwa, zestaw) | `docs/systemy/items.md` |
| bieżący roster i liczby | `docs/ekwipunek_przedmioty.md` *(generowany)* |
| reguły przy kodzie rdzenia | `src/core/CLAUDE.md` §„Broń: konstrukcja kontra rodzina" |
| pierścień celu i barwy walki | `docs/systemy/presentation.md` §6.1 |
| tarcze, `P1`, `B2`/`B3` | `docs/tarcze_checkpoint.md` |
| lista otwartych `OI` | `docs/zadania.md` |

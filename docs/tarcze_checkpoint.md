---
typ: HISTORIA
domena: [shields, items]
tytul: Checkpoint — tarcze, materiały, jakość, warianty
stan: zamkniety
otwarte: [B2, B3, P1, T-1, T-3, T-4, T-5, T-6, OI-24, OI-25, OI-26, OI-105]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT — system tarcz (2026-09-14 … 2026-09-15)

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. Etap projektowania tarcz z 2026-09-15; 30 tarcz jest w kodzie od 09-16, wątek pancerza i tarcz: `docs/pancerz_checkpoint.md`.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **Po co ten plik.** Punkt wejścia do implementacji tarcz. **Następna sesja
> zaczynała się tutaj, nie od ponownej analizy.** Etap projektowania jest
> zamknięty; zostały cztery decyzje, z których żadna nie blokuje startu.
>
> ⛔ **Nie czytaj stąd stanu repozytorium — SPRAWDŹ GO:**
> `git log --oneline -3 && git status --short`.
>
> ⚠ **Rozdzielaj DECYZJĘ PROJEKTOWĄ od IMPLEMENTACJI.** Na 2026-09-15 w kodzie
> istnieją **DWIE** tarcze (`buckler`, `ironbound_shield`). Sześć konstrukcji
> niżej to **decyzje**, nie zawartość. Brak czegoś w `ITEMS` **nie jest dowodem**,
> że zostało odrzucone — ta pomyłka zdarzyła się w tej sesji raz i kosztowała
> całą rundę.
>
> **Pomiary, odrzucone warianty i pełne uzasadnienia:**
> `docs/tarcze_konstrukcje_2026-09-14.md` (`HISTORIA`).

---

# 1. ZAMKNIĘTE DECYZJE

## 1.1 Sześć konstrukcji

| konstrukcja | rola | przewaga | wada |
|---|---|---|---|
| **Puklerz** | broń defensywna walczącego | ⭐ **nie psuje walki**; najlepsza redukcja na kilogram | najniższa ochrona bezwzględna |
| **Okrągła** | pospolita, wszechstronna | ⭐ możesz się **obracać** — **najlepsza ochrona boczna / największy praktyczny zakres zewnętrzny** | poza tą osią wszędzie środek stawki |
| **Rycerska** | ściana frontowa | ⭐ **najwyższa `reduction`**, ⭐ **największy PEŁNY łuk frontalny** | ⛔ najwęższy łuk zewnętrzny — oskrzydlenie |
| **Migdałowa** | znosi serię ciosów | ⭐ **trwałość WZGLĘDEM swojej klasy/masy** na ramie rzemiennej | ⛔ `reduction` **niższa** niż Rycerskiej |
| **Legionowa** | duża osłona + ruch | ⭐ duży łuk **przy zachowanej zdolności walki**; ⭐ **mocny bash** | wysoka masa i wymagania |
| **Pawęż** | obrona pozycyjna | ⭐ **największe fizyczne pokrycie / ochrona pozycyjna** + ⭐ **największa BEZWZGLĘDNA pula `durability`** | ⛔ **nie da się nią walczyć**; skrajny `swingMul` |

⭐ **Każda jest w czymś PIERWSZA i za każdym razem w czym innym.** Sprawdzone
na wszystkich 15 parach — **zero dominacji**; pełny rozpis par:
`docs/tarcze_katalog.md` §3.

### ⚠ Dwa rozstrzygnięcia autora z 2026-09-15, które ten wiersz domknęły

Do tej daty tabela wyżej przypisywała **dwa razy „najwyższą trwałość"**
(Migdałowa i Pawęż) i **dwa–trzy razy „najszerszy łuk"** (Okrągła, Rycerska,
Pawęż), więc twierdzenie „każda pierwsza w czym innym" **nie było spełnione**,
a katalogu nie dało się spisać bez arbitralnego wyboru zwycięzcy.

- **`D-T1` — trwałość to DWIE osie, nie jedna drabina.** Pawęż: **bezwzględna
  pula**. Migdałowa: **trwałość względem klasy/masy**. ⛔ Nie tworzymy jednej
  kolejności „kto ma najlepszą trwałość". ⭐ To ten sam kształt, co przy
  wariantach pancerza: stosunek i wartość bezwzględna są różnymi osiami.
- **`D-T2` — geometria to TRZY znaczenia, nie jedna drabina.** Okrągła:
  ochrona boczna. Rycerska: pełny łuk frontalny. Pawęż: fizyczne pokrycie —
  ⚠ **NIE musi mieć największego `sideArcDeg`**. ⛔ `sideArcDeg` nie jest
  drabiną „im więcej tym lepiej".

### ⛔ Trzy nierówności nietykalne bez świadomej decyzji

```
reduction(Migdałowa)  <  reduction(Rycerska)     ← inaczej Migdałowa = ciężka Rycerska
reduction(Pawęż)      <  reduction(Rycerska)     ← inaczej Pawęż najlepsza we wszystkim
swingMul(Pawęż)       =  skrajny                 ← jedyna realna cena Pawęży
```

⚠ **Dlaczego `swingMul` jest jedyną ceną Pawęży:** masa **nie kosztuje nic**
powyżej `ratio 0,90` (`OI-101`), a `staminaCost` zmierzono jako 5–17% puli
odrabiane w kilka sekund. Złagodzenie `swingMul` zostawia konstrukcję **bez ceny**.

⚙ **Poprawka 2026-09-15:** `OI-101` zostało **zamknięte decyzją o Modelu D**
(`docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`), a **wdrożone `OI-104`
tego samego dnia**. ⛔ **Akapit wyżej opisuje stan kodu SPRZED wdrożenia i od
2026-09-15 jest NIEAKTUALNY**: masa kosztuje dziś także powyżej `ratio 0,90`,
i to trzema kanałami (ruch, wydolność, wysiłek). ⚠ **Cenę Pawęży trzeba
przeliczyć na nowo, zanim ktokolwiek złagodzi `swingMul`** — dziś jej masa
nie jest już darmowa.

## 1.2 Model: `Construction → Material → Quality → Variant`

| oś | co niesie | gdzie mieszka |
|---|---|---|
| **Construction** | geometria · `swingMul` · profil bashu · rola | katalog (`ITEMS`) |
| **Material** | trwałość · cena · masa; PP i `reduction` wtórnie | ⚠ dziś katalog; egzemplarz po ~25 pozycjach |
| **Quality** | jak blisko potencjału stoi egzemplarz | ✅ **`ItemInstance.quality` — już działa** |
| **Variant** | grubość / solidność | ⏳ nie istnieje |

⛔ **`Variant` NIGDY nie rusza `fullArcDeg` ani `sideArcDeg`.** Łuki należą do
konstrukcji. To jest niezmiennik, który sam z siebie uniemożliwia wariantowi
udawanie innej konstrukcji.

## 1.3 Macierz materiałów

| Konstrukcja | Drewno | Żelazo | Stal | Gdzie |
|---|---|---|---|---|
| **Puklerz** | ✅ naturalne | ✅ **lity** | ✅ **lity** | drewno/żelazo wieś · stal gród |
| **Okrągła** | ✅ naturalne | ✅ okucie + umbo | 🟡 rzadka | drewno/żelazo wieś · stal miasto |
| **Rycerska** | ✅ naturalne | ✅ okucie | 🟡 rzadka | drewno wieś · żelazo gród · stal miasto |
| **Migdałowa** | ✅ naturalne | 🟡 okucie, dużo metalu | ⛔ bez sensu | drewno wieś · żelazo gród |
| **Legionowa** | ✅ naturalne | ✅ umbo + okucie krawędzi | 🟡 rzadka | gród · stal miasto |
| **Pawęż** | ✅ **jedyny** | ⛔ nie w tym zakresie | ⛔ nigdy | ⚠ **nie z półki** |

⭐ **Jedna reguła generuje całą rzadkość:** *znaczenie gatunku metalu jest
odwrotnie proporcjonalne do wielkości konstrukcji.* Puklerz jest w całości
metalem; Pawęż jest w 95% drewnem, więc gatunek okucia jest tam szumem.

### Co materiał realnie zmienia

| kanał | siła wpływu |
|---|---|
| ⭐⭐ **`durability`** | **dominujący** — drewno pęka · żelazo gnie się trwale · stal wraca |
| ⭐ **cena** | bardzo silny — drewno ≪ żelazo < stal |
| ⭐ **`weight`** | silny, ⚠ ale **żelazo = stal** (ta sama gęstość); stal lżejsza tylko przez cieńsze wykonanie |
| `defense` / PP | średni |
| `reduction` | ⚠ **słaby TERAZ** — pełny wpływ zablokowany do czasu `T-6` |
| `swingMul` · `staminaCost` · `requires` | ⚠ **pochodne masy**, nie własny wpływ |

⛔ **Materiał nie jest „+10% do wszystkiego"** — na `swingMul` i `staminaCost`
działa **przeciw sobie**: daje ochronę i jednocześnie pogarsza walkę.

## 1.4 Warianty

✅⭐ **NAZEWNICTWO ZAMKNIĘTE 2026-09-16 (`B1`): `lekka / — / ciężka`.**
⛔ „Wzmocniona” odrzucone — sugerowałoby inną właściwość konstrukcyjną (żebra,
okucia, usztywnienie), a modelujemy wyłącznie **więcej tego samego materiału**.
⛔⛔ Dlatego **wariant ciężki nie dostaje własnej właściwości** — działa wyłącznie
osiami z §1.6. ⚠ Gatunek drewna (dąb, lipa, jesion) **nie jest osią**.
Wariant zwykły **nie ma słowa w nazwie** (`Drewniany puklerz` · `Ciężki drewniany puklerz`).

| konstrukcja | warianty | dlaczego nie wszystkie |
|---|---|---|
| Puklerz · Okrągła · Rycerska | ✅ wszystkie trzy | ⭐ ciężka Rycerska **podnosi** `reduction`, Migdałowa **obniża** — nie do pomylenia |
| **Migdałowa** | ⚠ zwykła / ciężka | ⛔ „lekka" zabiera masę i trwałość, czyli całą tożsamość |
| **Legionowa** | ⚠ lekka / zwykła | ⛔ „ciężka” zbliża ją do Pawęży. ⭐ **Jedyna konstrukcja z wariantem `lekkim`** (2026-09-16) — i jedyna, której on leży NA osi tożsamości: 2,2 kg i `swingMul` 1,42 → 1,32 |
| **Pawęż** | ⚠ zwykła / ciężka | ⛔ „lekka" zbliża ją do legionowej |

⭐⭐ **Najciaśniejsza para (Legionowa ↔ Pawęż) jest chroniona przez BRAK
wariantu, a nie przez strojenie liczb.**

Wariant zmienia: ⭐ **`reduction`** (grubsza deska jest sztywniejsza) · masa ·
PP · trwałość · `swingMul` · stamina · wymagania · cena (`B4` ✅ — **wyliczana
mnożnikiem `variantPriceMul`**, nie wpisywana ręcznie).
⛔ Geometrii — nigdy.

## 1.5 Jakość

⛔ **`QUALITY.modifiers` NIE jest przebudowywane.** Struktura jest zdrowa —
to **pięć osobnych krzywych o różnych nachyleniach**, nie jeden mnożnik:

| tabela | Q1 → Q7 |
|---|---|
| `defense` / `damage` | ×1,41 |
| `attackSpeed` | ×1,22 |
| **`maxDurability`** | ⭐ **×2,86** |
| **`priceMul`** | ⛔ **×8,18** |
| `requirement` | +1 → −1 (przesunięcie, nie mnożnik) |

⭐ **Arcydzieło kosztuje osiem razy więcej, chroni o 41% lepiej i służy trzy
razy dłużej.** To jest model rzemieślniczy, nie mnożnikowy.

⭐ **`QUALITY.shopMaxLevel: 4` — już w kodzie.** Q1–Q4 ze sklepów i znajdźek;
**Q5–Q7 nieosiągalne zwykłą drogą.** „2–3 największe miasta = najlepszy
**standardowy** wyrób" oznacza **pełny katalog przy Q4**, nie Q7.

⭐ **Jakość mnoży INNĄ BAZĘ dla każdego materiału** — dobre drewno jest
najlepszym możliwym drewnem i nadal nie jest stalą.

## 1.6 Przypisanie parametrów do osi

| Parametr | MATERIAŁ | WARIANT | JAKOŚĆ |
|---|---|---|---|
| masa | ⭐ silny | ⭐ silny | ⛔ brak |
| PP / defense | średni | średni | ✅ `defense` |
| **reduction** | ⚠ słaby *(pełny po `T-6`)* | ⭐ **silny** | ✅ ten sam mnożnik |
| **durability** | ⭐⭐ **dominujący** | ⭐ silny | ✅ `maxDurability` |
| swingMul · stamina | pochodne masy | pochodne masy | ⛔ brak |
| wymagania | pochodna masy | pochodna masy | ✅ `requirement` |
| cena | ⭐ silny | ⭐ `variantPriceMul` *(wartość otwarta)* | ⭐⭐ `priceMul` |
| ⛔ **geometria** | ⛔ brak | ⛔ brak | ⛔ brak |

⭐⭐ **Każda oś ma inny kanał wiodący: materiał → trwałość, wariant →
sztywność, jakość → cena.**

### ⚠ Dwie korekty tożsamości wymuszone arytmetyką — NIE cofać

1. ⛔ **Migdałowa NIE może opierać tożsamości na PP.** Wymiana `reduction ↓ / PP ↑`
   jest arytmetycznie niewykonalna: `reduction` to mnożnik bez sufitu, a PP wchodzą
   do krzywej malejącej `d/(d+50)` wspólnej z pancerzem. Zmierzone: +3 PP przy 35
   punktach daje +2,0 pp, a −16 pp bloku zabiera ~8 pp. **Wymiana jest czterokrotnie
   niekorzystna.** ⇒ tożsamość niesie **`durability`**, czyli `T-5` jest **warunkiem
   koniecznym Migdałowej**.
2. ⛔ **Pawęż NIE może opierać tożsamości na PP.** Ten sam kanał nasyca się
   dokładnie tam, gdzie Pawęż ma być mocna: przy 40 punktach kolejne 7 daje tylko
   +4,1 pp. Policzone — legionowa przyjmowała 14, Pawęż 12, przy koszcie −25% vs
   −39% DPS, czyli **Pawęż była zdominowana**. ⇒ tożsamość niesie **łuk i trwałość**;
   PP zostaje najwyższe, ale przestaje być powodem, dla którego się ją bierze.

⭐ **Reguła wyprowadzona z obu:** **PP nigdy nie jest tożsamością. Są skutkiem
ubocznym rozmiaru.**

## 1.8 Model ochrony tarczy — DWA NIEZALEŻNE POZIOMY (decyzja 2026-09-15)

> ⛔ **Decyzja projektowa. Nie wracamy do założenia, że różnice materiału
> i jakości mają być skalowane głównie przez PP.**

Tarcza jest **jednocześnie** pancerzem i osłoną kierunkową:

```
PP ciała + PP pancerza + PP PASYWNE tarczy   →  zwykła redukcja pancerza
   +  jeżeli trafienie jest w strefie gardy  →  dodatkowo `block.reduction`

tył   :  samo PP pasywne
bok   :  PP pasywne + block × sideMul
front :  PP pasywne + pełny block
```

⚠ **Poza gardą tarcza NADAL chroni** — tylko biernie. Parowanie zostaje
niezależne i nie należy do geometrii tarczy.

### ⭐ Stan implementacji: **MODEL JEST JUŻ ZREALIZOWANY** (audyt 2026-09-15)

Zweryfikowane **zachowaniem**, nie lekturą — cios 20, tarcza okuta Q3:

| kierunek | PP pasywne | strefa | obrażenia | werdykt |
|---|---|---|---|---|
| bez tarczy, od tyłu | 0,00% | — | **20** | `hit` |
| z tarczą, **od tyłu** | 13,79% | `back` | **17** | `hit` |
| z tarczą, **z boku** | 13,79% | `side` | **13** | `block` |
| z tarczą, **z frontu** | 13,79% | `front` | **9** | `block` |

⛔ **Pipeline nie wymaga żadnej zmiany.** PP tarczy wchodzi przez
`Equipment.armorPieces()` (filtr `type === "armor"`, a slot `offhand` jest
w `EQUIP_SLOTS`), więc działa z każdej strony **automatycznie**; blok wchodzi
osobnym ułamkiem, bramkowanym strefą w `DamageResolver`.

### ⚠⚠ PP musi zostać MAŁE — i krzywa to potwierdza liczbowo

**Zmierzone na `d/(d+50)`:**

| przy PP ciała | +buckler (4) | +okuta (8) |
|---|---|---|
| **0** (goły) | 0,0% → 7,4% — **+7,41 pp** | 0,0% → 13,8% — **+13,79 pp** |
| 31 (skóra) | +2,90 pp | +5,55 pp |
| 63 (stal) | **+1,51 pp** | **+2,93 pp** |

Krok co jeden punkt przy małych wartościach: `0→1` **+1,96 pp**, `1→2` **+1,89 pp**.

⭐⭐ **PP jest jednocześnie ZA CZUŁE na gołej postaci i PRAWIE MARTWE w pełnej
stali.** To jest twardy argument za decyzją: oś, która na jednym końcu
przestraja wszystko jednym punktem, a na drugim nie robi nic, **nie nadaje się
na nośnik `konstrukcja × materiał × jakość × wariant`.**

### ⚠ Semantyka „floor": DZIŚ NIE ISTNIEJE jako mechanizm

`instanceDefense` = `base × (1 + qualityMul) × conditionMul`, **bez
zaokrąglenia**, obcięte przez `Math.max(0, …)`. Zmierzone dla puklerza (base 4):

| | cały | rozbity |
|---|---|---|
| Q1 | 3,40 PP | 1,70 PP |
| Q3 | 4,00 PP | 2,00 PP |
| Q7 | 4,80 PP | 2,40 PP |

⚠ **Niezerowość jest dziś SKUTKIEM mnożenia dodatnich liczb, nie gwarancją.**
Przy `defense: 0` wynik byłby zerem, a przyszły poziom jakości z mnożnikiem
≤ −1 wyzerowałby każdą tarczę. **Jeśli „floor" ma być semantyką, potrzebuje
własnego mechanizmu** — dziś go nie ma.

### ⚠ Znaleziona niespójność: tooltip kłamie o rozbitej tarczy

`ItemTooltip.ts:398` liczy `def.block.reduction × (1 + qualityMul("defense"))`
— **bez `conditionMul`**. `blockSpec` dostało stan w `T-5`, tooltip nie.
⇒ **rozbita tarcza pokazuje pełny procent bloku.** Naprawa to jedno mnożenie;
⛔ nie wykonana, bo audyt jest read-only.

### Otwartość osi — zapisane, żeby nie zamknąć ich przypadkiem

⛔ **Ani `QUALITY.modifiers`, ani zestaw materiałów nie są drabinką zamkniętą.**
Nowe poziomy jakości (arcydzieło, wyżej) i nowe materiały (stopy, fantasy) mają
wchodzić **bez przebudowy mechaniki tarcz**. Dlatego nie projektujemy reguł
w rodzaju „najlepsza obecnie jakość daje X PP".

⭐ **Różnicowanie jakości i materiału idzie POZA PP:** trwałość · masa · cena ·
skuteczność aktywnego bloku · zachowanie pod obciążeniem · wymagania.
⛔ **PP nie jest narzędziem ratowania balansu ani nośnikiem tożsamości** —
to rozwinięcie reguły z §1.6, nie nowa zasada.

## 1.9 Skala PP całego systemu ochrony — audyt capu (2026-09-15)

> ⛔ **Read-only. Zero zmian `d/(d+50)`, capu, wartości pancerzy i PP tarcz.**
> ⚠ **Ustalanie PP tarcz WSTRZYMANE** do rozstrzygnięcia skali całego systemu.

### 1.9.1 Czy warstwowanie będzie sumować PP — TAK, to DECYZJA

| pytanie | odpowiedź |
|---|---|
| jak reprezentowane są warstwy | `core/ArmorLayers.ts` — `itemLayer()` wyprowadza L1/L2/L3 **z materiału** |
| czy istnieje runtime agregujący PP warstw | ⛔ **NIE.** `armorPieces()` iteruje `EQUIP_SLOTS` — **jeden przedmiot na slot** |
| kto w ogóle czyta `ArmorLayers` | ⚠ **wyłącznie `ui/`**: `EquipLayout`, `ItemTooltip`, `PlayerPanel`. **Zero konsumentów w `core/`** |
| czy suma jest decyzją systemową | ✅ **TAK** — `D2` taksonomii (`moc: ACTIVE`) policzył stosy i orzekł *„`defenseK = 50`, `maxDefenseReduction = 0,75`. Nietknięte"*; `D3` nazywa skutek: *„po włączeniu warstw slot niesie do trzech egzemplarzy i **te trzy pętle muszą iterować warstwy**"* |
| gdzie powstałaby suma | `Equipment.armorPieces()` → `defenseAgainst()`; równolegle `equippedWeight` i `sumBonus` |

⛔ **Dlatego 148 PP to `PROJECTION`, nie stan systemu.** `ItemTooltip` mówi to
w kodzie: *„Warstwa jest dziś ODCZYTEM, nie mechaniką"*.

### 1.9.2 Scenariusze — `LIVE` vs `PROJECTION`

⚠ PP liczone **per sztuka przez profil materiału, potem suma** — tak jak
`defenseAgainst`. Stos = najlepsza sztuka w warstwie × 4 obszary.

| stos | status | PP bez typu | redukcja | cięte | kłute | obuch |
|---|---|---:|---:|---:|---:|---:|
| skóra 1 warstwa | `LIVE` | 31 | 38,3% | — | — | — |
| kolczuga 1 warstwa | `LIVE` | 51 | 50,5% | — | — | — |
| stal 1 warstwa | `LIVE` | 63 | 55,8% | — | — | — |
| **1 warstwa (L2)** | `PROJECTION` | 46 | 47,9% | 62,3% | 39,2% | 24,4% |
| **2 warstwy (L1+L2)** | `PROJECTION` | 79 | 61,2% | 71,0% | 46,7% | 51,2% |
| **3 warstwy (L1+L2+L3)** | `PROJECTION` | **148** | **74,7%** | **75,0% ⛔** | 71,1% | 63,5% |

⚠⚠ **KOREKTA do wcześniejszego raportu w rozmowie.** Twierdzenie *„przy pełnym
stosie PP tarczy nie robi NIC"* było policzone **bez typu obrażeń** i przeszacowało
problem. Bez typu pełny stos siedzi na **74,7%**, czyli **0,3 pp pod sufitem** —
a nie na nim. `D2` doszedł do tego pierwszy (*„Liczba bez typu to 74,0%, też pod
sufitem"*) i ten audyt go **odtwarza, nie podważa**.

### 1.9.3 Gdzie sufit naprawdę wiąże

⭐⭐ **Sufit jest per TYP OBRAŻEŃ, nie globalny.**

- **cięte: 219 PP** przy stosie trzywarstwowym → surowo **81,4%**, ucięte do 75%.
  ⛔ **Stos przekracza punkt nasycenia o ~69 PP — cały ten nadmiar jest wyrzucany.**
- **kłute 71,1%**, **obuchowe 63,5%** — obie z zapasem pod sufitem.
- **bez typu 74,7%** — pod sufitem o włos.

`D2` zapisał to samo i uznał za pożądane: *„sufit hamuje dokładnie ten typ,
który nie ma miękkiego celu"*. ⚠ Ale zapisał też dług: *„przy jakości
Arcymistrzowskiej pełny stos daje 170 pkt → 77,3%, więc sufit ucina część
wartości najlepszego wykonania"*.

### 1.9.4 Krzywa i pasmo użyteczne

| redukcja | potrzeba PP |
|---|---:|
| 30% | 21 |
| 50% | 50 |
| 60% | 75 |
| 65% | 93 |
| 70% | 117 |
| **75%** | **150** |

| PP | redukcja | 1 PP wart | +50 PP wart |
|---:|---:|---:|---:|
| 0 | 0,0% | 1,96 pp | 50,0 pp |
| 50 | 50,0% | 0,50 pp | 16,7 pp |
| 100 | 66,7% | 0,22 pp | 8,3 pp |
| 125 | 71,4% | 0,16 pp | 3,6 pp |
| **150** | **75,0%** | **0,00 pp** | **0,0 pp** |

⭐ **Sufit osiągany DOKŁADNIE przy 150 PP.** Powyżej każdy punkt wart zero —
niezależnie od tego, czy pochodzi z pancerza, tarczy, materiału czy jakości.

| stan | PP | zostaje do nasycenia |
|---|---:|---:|
| 80% capu (60,0%) | 75 | 75 PP |
| 90% capu (67,5%) | 104 | 46 PP |
| 99% capu (74,3%) | 144 | **6 PP** |

### 1.9.5 Odpowiedź na pytanie o cap — bez propozycji nowego

> **Czy cap 0,75 zostawia dość przestrzeni przy docelowym warstwowaniu?**

| kanał | werdykt |
|---|---|
| **obuchowe** (63,5%) | ✅ **tak, z dużym zapasem** — ~86 PP do nasycenia |
| **kłute** (71,1%) | ⚠ **wąsko** — ~27 PP zapasu |
| **bez typu** (74,7%) | ⚠⚠ **praktycznie brak** — ~2 PP zapasu |
| **cięte** (219 PP) | ⛔ **NIE — stos jest 69 PP ZA nasyceniem** |

⛔ **Konsekwencja dla otwartości systemu:** każdy przyszły materiał, poziom
jakości powyżej obecnego, dodatkowa warstwa i PP tarczy **ląduje na cięciu
w obszarze wyrzucanym**, a bez typu w paśmie 2 PP. **To nie jest problem tarczy
— to jest sufit systemu ochrony osiągany przez sam pancerz.**

⚠ **Decyzja o krzywej/suficie nie zapada tu.** Ten audyt dostarcza liczby;
rozstrzygnięcie należy do autora i dotyka `OI-24`, `D2` oraz `OI-98`.

## 1.10 Scope PP pancerza + audyt agregacji warstw (2026-09-15)

> ⛔ **Read-only. Zero zmian `d/(d+50)`, `defenseK`, capu, PP tarcz i wartości
> istniejących pancerzy.** ⚠ Docelowy dom tej sekcji to dokument domeny `armor`;
> stoi tu, bo checkpoint jest dziś czynnym punktem wejścia.

### 1.10.1 DECYZJA autora: skala pojedynczej warstwy

> **~30 PP = GÓRNY ZAKRES pojedynczej, obecnie osiągalnej warstwy.**
> ⛔ Nie „każda stalowa część = 30 PP". Normalne elementy stoją niżej, zgodnie
> z konstrukcją, materiałem, ciężarem i rolą.

⭐ **Scope RATYFIKUJE dzisiejszy stan, nie podnosi go.** Najcięższe pojedyncze
sztuki dziś: **kirys 28** · napierśnik stalowy 22 · nabiodrki 21 · kolczuga
długa 18 · brygantyna 17. Szczyt (28) już siedzi przy ~30.

**Przyszłe jakości (mistrzowska → arcymistrzowska → arcydzieło) WYKLUCZONE
z obecnych kalkulacji** — zgodnie z reguła autora. ⚠ Weryfikacja dostępności:

| jakość | realnie dostępna? |
|---|---|
| Q1–Q2 | ✅ półka wiejska (`stockQuality [1,2]`) |
| Q3 | ✅ domyślna + nagrody questowe |
| **Q4** | ✅ **półka miejska** (`stockQuality.armor [3,4]`) — **realny sufit** |
| Q5 | ⛔ **jedna nagroda: `stick`** (żart) |
| Q6–Q7 | ⛔ nieosiągalne |

⚠ **`QUALITY.shopMaxLevel: 4` NIE MA konsumenta w kodzie** — jest komentarzem.
Realny sufit wyznacza `stockQuality` per NPC.

### 1.10.2 ⛔⛔ Nasycenie NIE jest problemem przyszłych jakości

Pełny stos 12 sztuk (najlepsza sztuka w warstwie × 4 obszary), **tylko jakości
realnie dostępne**:

| jakość | bez typu | cięte | kłute | obuch |
|---|---|---|---|---|
| Q1 (wieś) | 126 → 71,6% | **186 → 75,0% ⛔** | 105 → 67,7% | 74 → 59,6% |
| Q2 (wieś) | 136 → 73,1% | **201 → 75,0% ⛔** | 113 → 69,4% | 80 → 61,5% |
| Q3 (domyślna) | 148 → 74,7% | **219 → 75,0% ⛔** | 123 → 71,1% | 87 → 63,5% |
| **Q4 (miasto)** | **155 → 75,0% ⛔** | **230 → 75,0% ⛔** | 129 → 72,1% | 91 → 64,6% |

⭐⭐ **Nasycenie na CIĘTYM występuje już przy Q1 — najniższej jakości z wiejskiej
półki** (186 PP wobec punktu nasycenia 150, czyli **+36 PP wyrzucane**). Przy Q4
przekracza je **także liczba bez typu** (+5 PP).

⇒ **To nie jest problem hipotetycznych jakości ani tarcz.** ⛔ Wyklucznie Q5–Q7
z kalkulacji **niczego nie zmienia** — sufit wiąże w całości wewnątrz obecnie
dostępnego świata.

### 1.10.3 Audyt D2/D3 — co model agregacji ma ROZSTRZYGNIĘTE

| rzecz | status | gdzie |
|---|---|---|
| warstwy **sumują punkty liniowo** | ✅ decyzja | `D2` |
| **jedna krzywa** na sumę (`d/(d+50)`, cap 0,75) | ✅ decyzja, nietknięta | `D2` |
| profil materiału **per sztuka**, potem suma | ✅ działa dziś | `defenseAgainst` |
| `requires.strength` **per przedmiot**, nie sumowane | ✅ decyzja | `D1` |
| `set` ⊥ `layer` | ✅ decyzja | `D4` |
| trzy pętle muszą iterować warstwy | ✅ nazwane | `D3` |
| legalne kombinacje (w tym L1+L3) | ✅ decyzja | taksonomia |

### 1.10.4 ⚠ Czego D2/D3 NIE rozstrzygają — luki modelu agregacji

1. ⚠⚠ **ZAPIS — największa luka.** `Save.ts` trzyma
   `equipment: { head: StoredEquip; chest: StoredEquip; … }`, czyli **jeden
   egzemplarz na slot**. Warstwowanie **zmienia KSZTAŁT**, a reguła `Save.ts`
   brzmi: *„zmiana kształtu → podbij `SAVE_VERSION`; niezgodny zapis jest
   odrzucany (nowa gra), nigdy migrowany"*. **`D3` nazwał trzy pętle — nie
   nazwał zapisu.**
   ⭐ **Istnieje droga ADDYTYWNA bez kasowania postaci:** slot zostaje nośnikiem
   L2 (dzisiejsza zawartość), a `layers?: { chest?: { L1?, L3? }, … }` wchodzi
   jako **pole opcjonalne** — dokładnie tą drogą, którą weszły `quickSlot`,
   pierścienie, `offhand` i `stowed`. **Do rozstrzygnięcia, nie do wyboru
   w locie.**
2. ⚠ **`setProgressFor` liczy WYPOSAŻONE ELEMENTY, nie sloty.** Przy trzech
   warstwach próg „4 sztuki" może zostać spełniony przez **jeden obszar ciała**
   (3 warstwy jednego zestawu) + 1 gdziekolwiek. `D4` **zauważył** różnicę
   (*„pojawi się z warstwowym pancerzem"*), ale jej **nie rozstrzygnął**.
3. ⚠ **`EquipmentSnapshot = Record<EquipSlot, ItemInstance | null>`** — ładunek
   zdarzenia też jest „jeden na slot"; czyta go każdy listener.
4. ⚠ **`slotForItem` / `accepts` / `equipFromBag` rozstrzygają SLOT, nie
   slot+warstwę.** Upuszczenie drugiego napierśnika musi wiedzieć, w którą
   warstwę.
5. ⚠ **Model nie jest jednorodny**: cztery obszary warstwowane × 3, ale
   **ręce mają jedną warstwę**. Maksimum to 13 sztuk, nie 3 × liczba slotów.

⛔ **Dopóki punkty 1–5 nie są rozstrzygnięte, „pełny stos" pozostaje
`PROJECTION`.** Kolejność pozostaje: **agregacja → cap/krzywa → PP tarcz.**

## 1.7 Geometria

- ✅ **Blok jest DETERMINISTYCZNY.** ⛔ `blockChance` odrzucone (`N-23`, z pomiarem).
  Większa tarcza = większa **deterministyczna** strefa, nie większa szansa.
- ✅ **Geometria należy do konstrukcji** — i od 2026-09-16 jest tak ADRESOWANA
  (`T-1`: rejestr `SHIELD_GEOMETRY` per konstrukcja). ⛔ Nie stoi na przedmiocie
  ani na egzemplarzu; wariant i jakość jej nie ruszają (zamki §T1-8).
- ⛔ **`sideMul` zostaje GLOBALNE `0,50`** — zakaz proceduralny w configu
  (*„Nie strój tej liczby, zanim ktoś w to nie zagra"*). Kształt strefy bocznej
  niosą **kąty**, nie siła kary.
- ⛔ **Sufit `fullArcDeg` = 90° zostaje.** `FRONT_ARC_DEG` jest współdzielony
  z parowaniem i bramką zwrotu ataku.
- ⛔ **Wywołanie `guardZone` przy PAROWANIU (`DamageResolver.ts:145`) zostaje
  na `isFrontal`.** Parowanie jest niezależne od geometrii tarczy. Nie
  „ujednolicać" obu wywołań.
- ⚠ **Argument dla `B3`, NIE decyzja:** wartości kątów powinny trafiać w punkty
  wynikające z czterokierunkowego zwrotu, nie interpolować między nimi —
  pomiędzy są niewidzialnym pokrętłem. ⛔ **To jest przesłanka, którą `B3` ma
  rozważyć, a nie przypisany zestaw wartości.**

### ⛔⛔ STATUS `sideArcDeg` — jednoznacznie, żeby nie było wątpliwości (2026-09-15)

> ### `sideArcDeg`: **wartość NIEUSTALONA.**
> ### 45 / 90 / 135 = **progi POMIAROWE**. Decyzja po `P1`, w `B3`.

| rzecz | status |
|---|---|
| **`fullArcDeg = 90°`** (sufit) | ✅ **ZAMKNIĘTE** — nie ruszamy |
| **`sideMul = 0,50`** | ✅ **ZAMKNIĘTE**, globalne — nie ruszamy |
| **`sideArcDeg`** | ⛔ **OTWARTE — brak jakiejkolwiek zatwierdzonej wartości docelowej** |
| **45° / 90° / 135°** | ⚠ **progi EKSPERYMENTALNE do odczytu danych** — ⛔ **nie są trzema gotowymi wartościami do przypisania tarczom** |

⛔ **Wynik `P1` NIE ustala `sideArcDeg`.** Trzy przykłady, żeby zamknąć temat:

- `P1 = TAK` **nie znaczy** „ustawiamy `sideArcDeg = 90°";
- `P1 = POŁOWICZNIE` **nie znaczy** „wszystkie tarcze dostają 45°";
- `P1 = NIE` **nie znaczy** „trzeba natychmiast wymyślić nową geometrię".

**`P1` jest BRAMKĄ do dalszej analizy. `B3` jest miejscem, w którym zapadają
konkretne wartości `sideArcDeg` per konstrukcja.**

⭐ **A skoro geometria jest cechą `Construction` (§1.2), to jeśli `B3` potwierdzi
sens tej osi, wartości `sideArcDeg` mają być ŚWIADOMĄ CZĘŚCIĄ PROFILU KAŻDEJ
KONSTRUKCJI — nie kolejnym globalnym pokrętłem do strojenia.**

### KARTA `B3` — co dokładnie ma rozstrzygnąć (zapisane przed danymi)

**Pytanie `B3`, w brzmieniu autora:**

> **Jaki profil `sideArcDeg` dla każdej z sześciu konstrukcji daje rzeczywistą,
> czytelną i NIE-DOMINUJĄCĄ różnicę w obecnym modelu walki?**

⚠ **`B3` patrzy na CAŁY rozkład względem 45/90/135, nie tylko na „ile jest
≥ 90°".** Ten drugi odczyt należy do `P1` i tam się kończy.

⛔⛔ **`B3` PRZEKŁADA zamkniętą tożsamość konstrukcji na geometrię — nie wymyśla
konstrukcji od nowa.** Relacje są już zamknięte w §1.1 i wchodzą do `B3` jako
WEJŚCIE, nie jako przedmiot dyskusji:

| konstrukcja | relacja, którą geometria ma wyrazić |
|---|---|
| **Okrągła** | wszechstronna — **najszerszy łuk zewnętrzny** |
| **Rycerska** | mocna frontalnie — ⛔ **najsłabszy zasięg zewnętrzny** |
| **Legionowa** | duży łuk **przy zachowanej zdolności walki** |
| **Pawęż** | **najszerszy łuk**, płacony **niemożnością walki** |

⭐ **Zasada minimalności:** przy `P1 = TAK` szukamy **NAJMNIEJSZEGO zestawu
wartości**, który zachowuje zamierzone różnice konstrukcyjne — nie największego,
który da się uzasadnić.

⛔ **Zakaz ratowania balansu geometrią.** `sideArcDeg` nie służy do nadrabiania
innych liczb. `sideMul = 0,50` jest zamknięte, `fullArcDeg = 90°` jest zamknięte,
a geometria ma być **cechą konstrukcji**, nie pokrętłem balansu.

### Pipeline końcowy — ⛔ bez skrótów

```
P1  →  rozkład 45/90/135  →  B3  →  konkretne `sideArcDeg` per konstrukcja  →  T-1
```

- **`P1 = NIE`** → ⛔ **zatrzymujemy się PRZED `B3`** i wracamy do `B2` zgodnie
  z zapisanym scenariuszem (nośnik tożsamości inny niż geometria; ⛔ **nie PP**).
- **`P1 = POŁOWICZNIE`** → ⛔ **nie zakładamy z góry, że wszystkie konstrukcje
  dostaną ten sam łuk.**
- **`P1 = TAK`** → dopiero wtedy rozkład służy do znalezienia najmniejszego
  zestawu wartości zachowującego różnice.

## 1.8 Trwałość i naprawa — ⛔ NIE ZMIENIAĆ

✅ **System jest kompletny i poprawny:**

```
repairCost     = buyPrice(jakość) × 0,5 × (brakujący ułamek trwałości)
repairInstance → przywraca do pełna
hasDurability  = "durability" in getItem(id)     ← pole włącza cały łańcuch
```

⭐⭐ **`condition ≠ quality` jest już zaimplementowane.** Komentarz w
`Quality.ts`: *„Fixes CONDITION only — quality (workmanship) is untouched,
a repaired Podła sword is still Podła."* Naprawiony Podły miecz zostaje Podły.

✅ **ZAMKNIĘTE 2026-09-15 razem z `T-5`.** Do tej daty `blockSpec` **nie czytał**
`destroyedMultiplier`, więc zniszczona tarcza traciła punkty obrony, ale
**blokowała w pełni** — czyli jedyna rzecz, po którą się ją nosi, była odporna
na zużycie. Dziś `conditionMul` wchodzi do `blockSpec` — **ta sama funkcja**, co
przy obrażeniach i punktach obrony, nie druga tabela.
Zmierzone w silniku: puklerz **30,0% → 15,0%** po rozbiciu.

---

# 2. USTALENIA ŚWIATA / EKONOMII

⚠ **To są ZAŁOŻENIA ograniczające projekt przedmiotów, nie systemy do wdrożenia.**
Historia Lechtii, polityka i Gildia — osobny temat, **nie tutaj**.

## 2.1 Zasada nadrzędna

> **Dobre podstawowe wyposażenie jest stosunkowo POWSZECHNE.
> Rzadkie są: wyjątkowe materiały, mistrzowskie wykonanie, unikaty.**

Przy służbie **~40% roku** człowiek powinien w ciągu około roku zdobyć dobry
miecz, tarczę, pas, pochwę i podstawowe wyposażenie — przez żołd, własne
zarobki, **raty u rzemieślnika**, kontrakty, nagrody i rynek wtórny.

⭐ **To jest już egzekwowane przez kod:** `shopMaxLevel: 4` — dobre rzeczy
kupisz, mistrzowskich nie.

## 2.2 Produkcja i handel — jak to siada na taksonomii

| obserwacja | skutek dla przedmiotów |
|---|---|
| ⭐ **drewno obsługuje 6/6 konstrukcji** | królestwo uzbraja się z własnych lasów |
| ⭐⭐ **żelazo wchodzi jako OKUCIE, nie jako tarcza** | kowal nie marnuje metalu na całe tarcze |
| ⭐ **gęstość wartości** | stalowy puklerz **podróżuje**; Pawęż **nigdy** — zawsze lokalna |
| ⭐ naprawa skaluje się z jakością | tania rzecz jest **jednorazowa**, dobra **opłaca się utrzymywać** |

## 2.3 Rynek wtórny i obieg wojskowy

⭐ **Naprawa (`condition ≠ quality`) obsługuje oba obiegi bez nowej mechaniki:**

```
produkcja → użycie → zużycie → naprawa → rynek wtórny → naprawa
wydanie   → służba → odzysk  → naprawa → ponowne wydanie
```

⚠ **Służba 40% roku wyjaśnia półkę Radzima** — ludzie wracają ze sprzętem,
więc wieś jest pełna używanego wyposażenia wojskowego. Mechanika, która już
istnieje (`bron_skad`), dostaje uzasadnienie gospodarcze.

## 2.4 Poziomy dostępności

| poziom | co oferuje |
|---|---|
| **Wieś** | lokalne materiały, podstawowe konstrukcje, niższe jakości |
| **Gród** | więcej materiałów i konstrukcji, lepsi rzemieślnicy |
| **Miasto** | pełniejszy katalog + warianty + wysokie **normalne** jakości |
| **2–3 największe miasta** | ⭐ pełna klasa **najlepszych NORMALNIE dostępnych** wyrobów = **Q4** |
| ⛔ **Q5+** | **nigdy towar z półki** |

⚠⚠ **Zagaje są ŚWIADOMIE PONIŻEJ średniej Lechtii** — dno tej gospodarki, nie
jej przeciętna. ⛔ **Nie kalibruj królestwa po jakości Radzima (`[1,2]`),
asortymencie Sobka ani cenach w jednej wsi.**

## 2.5 Podział pracy w Zagajach — istniejące lore, nie nowa reguła

```
Sobek (stolarz), temat `kola`:
  „Obręcze bije mi Radzim — JA DREWNO, ON ŻELAZO, i tak od dwudziestu lat."

Quest `skora_na_pasy` (nagroda: puklerz Q3):
  „Korpus zrobię z KLEPEK… Obręcz nabiję, pasy przynituję…
   Tylko nie licz, że ci ją potem zbiję ŻELAZEM — żelazo jest Radzima."
```

- **Sobek** — wyłącznie czyste drewno; robi sam, na zamówienie
- **Radzim** — wszystko z metalem; ⚠ **nie musi być producentem**, może zlecać
  wykonanie i składanie, a sprzedawać jako towar handlowy
- ⛔ **Nie podnosić sztucznie półki Radzima** (`stockQuality: [1,2]`) — Zagaje
  mają być biedne

⭐ **Komentarz autora w `GameConfig` już opisuje oś materiału:** *„drewniany
krążek z pasami zużywa się szybciej niż deski spięte żelazem"* — obie dzisiejsze
tarcze mają rdzeń drewniany, różni je **ilość żelaza**. `buckler` **JEST** już
drewnianym puklerzem; `armorType: "leather"` jest poprawne (obciągnięcie skórą
surową), nie jest zaszłością.

---

# 3. OTWARTE DECYZJE

⭐ **Zostały DWIE. Żadna nie blokuje kroków 0–3 implementacji.**

> ✅ **`B1` i `B4` ZAMKNIĘTE 2026-09-16** (decyzja autora), moc **ACTIVE** — pełny
> zapis w `docs/tarcze_katalog.md` §8. `B1`: wariant to **„ciężki”**, ⛔ nie
> „wzmocniony”, i ⛔ nie dostaje własnej właściwości. `B4`: **TAK, droższy**, a cena
> jest **WYLICZANA** — `buyPrice × materialPriceMul × variantPriceMul ×
> qualityPriceMul`; ⏳ sama wartość `variantPriceMul` zostaje otwarta jako balans
> ekonomii i ⛔ nie ustala się jej teraz.

| id | decyzja | blokuje |
|---|---|---|
| **B2** | ⛔ **luka PP i łuku między Legionową a Pawężą** — jedyna, która może zabić konstrukcję | krok 7 |
| **B3** | **jakie wartości `sideArcDeg` mają sens dla sześciu konstrukcji** — ⚠ **po pomiarze `P1`**. ⛔ Wartość NIEUSTALONA; 45/90/135 to progi pomiarowe, nie kandydaci do przypisania (§1.7) | krok 7 |

## Przeniesione z odłożonych — wymagane

| id | rzecz | dlaczego wymagane |
|---|---|---|
| **`T-1`** | ✅ **MECHANIZM WDROŻONY 2026-09-16** — łańcuch `konstrukcja → SHIELD_GEOMETRY → BlockSpec.geometry → resolver` działa; 30 tarcz niesie `construction`; `guardZone` bierze profil PARAMETREM, brak profilu = fallback 60°/100°. ⏳ **WARTOŚCI per konstrukcja to `B3` — rejestr jest CELOWO PUSTY do czasu `P1`.** 18 zamków §T1 w `tarcze_przymiar.mjs`, regresja 121/121 bez różnic | ⭐ jedyna czysta cecha konstrukcji |
| **`T-3`** | asercja §X1 per przedmiot + przepisanie `N-22` | asercja musi umieć zaświecić na czerwono |
| **`T-4`** | `shieldBash` czyta `blockSpec` | ⭐ rozdziela Legionową (mocny bash) od Migdałowej (najsłabszy) |
| **`T-5`** | pole `durability` + model zużycia | ⛔ **warunek konieczny Migdałowej** |
| **`P1`** | ✅ ⭐⭐ pomiar rozkładu kątów ciosów — **narzędzie wdrożone, pomiar NIEWYKONANY** | **przesądza wartość całego `T-1`** |

### ⚠ `P1` — dlaczego jest pierwsze

Dwie z sześciu konstrukcji (**Okrągła** i **Pawęż**) mają tożsamość na osi łuku.
Jedyny pomiar, jaki mamy, to `block 89,4% · parry 5,5% · dodge 5,2% · hit 0,0%`
— i pochodzi z **benchmarku atakującego z frontu**. ⛔ **Nie wiemy, czy w grze
ciosy przychodzą pod różnymi kątami.** Jeśli nie — łuk boczny jest wart
niewiele, a z nim spora część `T-1`.

### ✅ `P1` — narzędzie wdrożone 2026-09-15

`src/core/GuardStats.ts` + jedno wywołanie w `Player.takeDamage` pod
`import.meta.env.DEV` (zweryfikowane: **zero śladu w buildzie produkcyjnym**).
Komendy: `docs/dev_console.md`, sekcja „Rozkład kątów ciosów".

**Trzy odstępstwa od pierwotnego opisu, każde z powodem:**

1. ⭐ **Histogram SUROWEGO KĄTA zamiast licznika stref.** Licznik pod dzisiejszymi
   progami (60/100) odpowiada wyłącznie na pytanie o dzisiejsze progi. `B3` pyta
   o **inne** (45/90/135). Raport podaje **tabelę sześciu par progów** naraz,
   więc jedna sesja grania odpowiada na oba pytania. Ten sam koszt.
2. ⚠⚠ **⛔ NIE czytamy `DamageResult.zone`.** Gałęzie `immune` i `dodge`
   w `resolveIncoming` zwracają `zone: "back"` **na sztywno** — to wypełniacz
   pola, nie geometria. Dodge to 5,2% ciosów, więc odczyt po werdykcie
   **systematycznie zawyżałby „tył"**. Kąt liczy się niezależnie od werdyktu.
3. ⚠ **Sonda NIE siedzi w `resolveIncoming`.** Czystość tej funkcji jest
   warunkiem zapisanym w jej nagłówku (test / replay / serwer), a licznik
   modułowy zbierałby przy okazji śmieci z `combat_regresja.mjs`, które woła ją
   121 razy. Sonda stoi u jedynego wołającego — `Player.takeDamage`.

⚠ **Kąt pochodzi z nowego `Protection.guardAngleDeg`**, wydzielonego z `isFrontal`
refaktorem bit-w-bit (regresja: 121/121 bez różnic). ⛔ **Nie licz kąta drugi raz
u wołającego** — druga kopia geometrii jest błędem, nie optymalizacją (N-25).

⚠ **Czego raport NIE zapisuje: GATUNKU napastnika.** Wymagałoby to zmiany
sygnatury `takeDamage` w ośmiu miejscach. Jeśli dane pokażą, że kąty są
niezerowe, **to będzie pierwsze pytanie uzupełniające** („czy oskrzydlają
wilki, czy wszyscy").

### ✅ Instrument SPRAWDZONY przed graniem — `tools/p1_instrument.mjs`

⛔ **To nie są dane `P1`.** Przymiar karmi raport próbkami o ZNANYM z góry
rozkładzie i sprawdza, czy raport wypisuje to, co twierdzi: skumulowane
`<45/<90/<135`, mediana, ostrość granicy (`<`, nie `≤`), suma FRONT+BOK+TYŁ =
100% w każdym z sześciu wierszy, trwałość próbki. Powod: **próbka `P1` kosztuje
kilkadziesiąt minut grania**, a błąd w arytmetyce raportu kazałby zapłacić je
drugi raz. Wszystkie zamki sprawdzone sabotażem.

**Dwie rzeczy znalezione przy tej okazji i naprawione:**

1. ✅ **Mianownik `n` — ROZSTRZYGNIĘTE decyzją autora (2026-09-15).** Kod liczył
   każdy cios z kierunkiem, protokół mówił co innego — różnica ~5–8% (sam dodge
   to 5,2%), więc raport mógł ogłosić `✅ n ≥ 100` przy 93 ciosach według
   protokołu i powiedzieć „możesz przestać grać" za wcześnie.
   ⭐ **Obowiązuje pierwotny protokół: `n` = ciosy KLASYFIKOWALNE do rozkładu
   FRONT/BOK/TYŁ.** Uniki i `immune` ⛔ **nie wchodzą do mianownika** — ani do
   progu, ani do procentów. ⚠ **Zostają natomiast w zapisanej próbce**, żeby dane
   dało się przeliczyć inną regułą bez powtarzania rozgrywki.
2. ⭐ **Próbka nie przeżywała przeładowania strony.** Pojedyncze F5, przeładowanie
   z HMR po edycji kodu albo crash kasowały całą sesję grania, bez ostrzeżenia.
   Doszło odkładanie do `localStorage` (klucz `rpg-guard-p1`, ⚠ **poza
   przestrzenią `rpg-save*`**) i **jawne** `dev.guard.wznow()`.
   ⛔ Wznowienie nigdy nie dzieje się samo — ciche sklejenie dwóch sesji
   zmieniłoby okno pomiaru w środku, a raport nadal wyglądałby poprawnie.

### ⚠ Jak zebrać próbkę, żeby coś znaczyła — protokół autora (2026-09-15)

**Minimum: ≥100 przyjętych ciosów Z OKREŚLONYM KIERUNKIEM**, docelowo **150–200.**
⚠ Próg jest w kodzie (`GuardStats.PROG_PROBKI`) i raport **sam ostrzega**, gdy
próbka jest za mała. Powód progu: przy 100 ciosach jeden cios to 1 pp, przy 30 —
3,3 pp, czyli cała spodziewana różnica między sąsiednimi progami mieści się
w jednej próbce.

⛔ **Nie liczą się do tego progu:** uniki · `immune` · ciosy bez możliwego
kierunku · wielokrotne farmienie **jednego** przeciwnika w **identycznej**
sytuacji (formalnie wpadnie do n, ale nie jest różnorodnością).

| sytuacja | cel |
|---|---:|
| atak frontalny / przeciwnik przed graczem | ≥30 |
| atak z boku / obchodzenie gracza | ≥30 |
| atak od tyłu / oskrzydlenie | ≥20 |
| walka w ruchu / zmiana pozycji | ≥20 |
| dystansowe / nietypowe kierunki | ≥10 |

⚠ **Liczby mogą się nakładać** — chodzi o to, żeby nie wyszło „180 ciosów od
jednego dzika stojącego przed graczem", a nie o sztuczne odcinanie próbek.

**Minimum trzy różne zachowania:** **dzik** (frontalny/szarżujący) · **wilki**
(ruch, obchodzenie, oskrzydlanie) · **sieciarz** (atak bez kontaktu).

### Co czytamy z raportu — kolejność ważności

1. ⭐⭐ **Czy rozkład ma REALNĄ MASĘ POZA FRONTEM.** To jest całe pytanie `P1`.
2. Skumulowane: `< 45°` · `< 90°` · `< 135°` · `≥ 135°` + **mediana całości**.
   ⚠ Granice są **OSTRE** (`<`), jak w `isFrontal` — granica należy do strony
   NIEchronionej.
3. Tabela sześciu par progów → materiał do **`B3`**.
4. Histogram — kosze nierówne celowo, ich granice to punkty zmiany odpowiedzi.
5. Zobowiązanie własne (mediana w pozie ataku vs poza nią) → test zapisanej tezy
   „tarcza jest odpowiedzią na twój własny root".

⚠ **Gatunek napastnika ŚWIADOMIE nieodnotowywany na tym etapie** (decyzja autora
2026-09-15 — wymagałby zmiany sygnatury `takeDamage` w ośmiu miejscach).
**Jeśli histogram pokaże istotny rozrzut kątów, wtedy** decydujemy, czy następny
pomiar musi rozbić dane na typ przeciwnika.

---

### ⛔⛔ REGUŁA ODCZYTU ZAREJESTROWANA PRZED DANYMI (2026-09-15)

⛔ **Zapisana ZANIM padł pierwszy pomiar i ⛔ NIE DO ZMIANY PO ZOBACZENIU
RAPORTU** — ani progi, ani instrument. Każdy próg nazwany po danych wygląda na
dobrany pod wynik, a ten projekt zna tę pułapkę z innych domen.

**Pytanie `P1`, w brzmieniu autora:**

> **Czy w realnej walce istnieje wystarczająco dużo ataków spoza frontalnego
> obszaru, żeby geometria tarczy była praktycznie odczuwalną cechą konstrukcji?**

**Metryka rozstrzygająca: udział ciosów `angle ≥ 90°`** (z ciosów Z KIERUNKIEM).

| udział `≥ 90°` | werdykt `P1` | co znaczy |
|---:|---|---|
| **< 10%** | ⛔ **NIE** | model walki praktycznie frontalny |
| **10–25%** | ⚠ **POŁOWICZNIE** | geometria istnieje, ale **nie zakładamy jeszcze** różnicowania `sideArcDeg` |
| **> 25%** | ✅ **TAK** | łuk wystarczająco obecny, żeby przejść do `B3` |

**Metryka KONTROLNA: mediana całego rozkładu.** ⚠ **Nie unieważnia `P1`** —
jest ostrzeżeniem interpretacyjnym. `mediana < 45°` znaczy: *nawet jeśli boczny
ogon jest zauważalny, typowy cios nadal siedzi we frontalnym obszarze* — czyli
kwantyzacja czterokierunkowego zwrotu zjada różnice, zanim geometria zdąży
cokolwiek rozstrzygnąć. Waży podwójnie, bo `fullArcDeg = 90°` jest już
świadomie związane z istniejącą geometrią walki (`FRONT_ARC_DEG`), a nie chcemy
systemu matematycznie ciekawego i gameplayowo martwego.

### ⚠⚠ `P1` ≠ `B3` — rozdział wymuszony przez autora

> **`P1` odpowiada „czy warto iść dalej z geometrią". `B3` odpowiada „jak ta
> geometria ma wyglądać".**

⛔ **Reguła progowa wyżej jest regułą PRZEJŚCIA `P1` → dalsza analiza, a NIE
automatyczną decyzją „implementujemy / nie implementujemy `sideArcDeg`".**
Poprzednie brzmienie tej tabeli wyrokowało o `T-1` i `sideArcDeg` wprost
z udziału `≥ 90°` — **to było rozstrzyganie `B3` danymi `P1` i zostało cofnięte
przez autora, zanim padł pomiar.**

`B3` pyta: **które z progów 45 / 90 / 135° dają konstrukcjom rzeczywiście różne
profile ochrony** — i do tego służy **tabela sześciu par progów**, nie sam
udział `≥ 90°`. Ilustracja rozdziału: 20% `≥ 90°` to realny boczny ogon,
a mimo to może się okazać, że **każda** sensowna tarcza powinna kończyć się na
90°; dopiero rozkład 45/90/135 mówi, czy trzy poziomy szerokości łuku mają sens.

### ⛔ Zobowiązanie: nie ratujemy hipotezy

**Jeśli walka okaże się prawie całkowicie frontalna, jest to WYNIK PROJEKTOWY
i przyjmujemy go** — upraszczając dalszą implementację, a nie broniąc łuku.

⚠ **Cena tego scenariusza, nazwana z góry, żeby nie zaskoczyła:** `PP nigdy nie
jest tożsamością` (§1.6) zostało przyjęte świadomie, a tożsamość **Okrągłej**,
**Legionowej** i **Pawęży** opiera się częściowo na geometrii. Martwa oś łuku
znaczy więc, że **tę część założeń trzeba przebudować**, a nie że tarcze wracają
do „więcej PP = lepsza tarcza". To wraca jako `B2`, nie jako nowa taksonomia.

# 4. IMPLEMENTACJA — NEXT STEPS

⚠⚠ **KOLEJNOŚĆ POPRAWIONA 2026-09-15 (`D-T3`).** Do tej daty ta tabela stawiała
`T-1` jako **krok 1**, a „Pipeline końcowy" niżej — jako **ostatni, po `B3`**.
To była sprzeczność w jednym pliku. **Wygrywa pipeline:**

```
P1  →  B3  →  T-1
pomiar → ustalenie `sideArcDeg` → parametryzacja `guardZone`
```

| # | krok | zależy od | uwagi |
|---|---|---|---|
| **0** | ✅ **`P1` — NARZĘDZIE GOTOWE (2026-09-15), czeka na ROZGRYWKĘ** | — | `dev.guard.start()` → pograj → `dev.guard.raport()`. ⚠ Jedyny krok, którego **nie da się wykonać bez grania** |
| **0b** | ✅ **`T-5` ZROBIONE 2026-09-15** — pole `durability` + zużycie przy bloku + `blockSpec` czyta `destroyedMultiplier` | **—** | ⭐ **JEDYNY krok implementacyjny NIEZALEŻNY od `P1`** — można go robić RÓWNOLEGLE do zbierania próbki. ⛔ **przy okazji `blockSpec` czyta `destroyedMultiplier`**. ⚠ `D-T1` podniosło jego wagę: trwałość jest teraz nośnikiem tożsamości **dwóch** konstrukcji |
| **1** | **`B3`** — wartości `sideArcDeg` per konstrukcja | 0 | ⛔ decyzja, nie kod. Materiał: tabela sześciu par progów z raportu `P1` |
| **2** | **`T-1`** — `guardZone(facing, from, arcs)` | 1 | ⛔ parowanie (`DamageResolver:145`) zostaje na `isFrontal`. ⚠⚠ **naprawić `combat_regresja.mjs:185`** — woła `guardZone` bez kątów i po `T-1` świeciłoby na zielono nie sprawdzając niczego. ⭐ Pilnuje tego zamek **§G6** w `tools/tarcze_przymiar.mjs`, zastawiony z wyprzedzeniem — padnie w dniu parametryzacji |
| **3** | ⚠ **`T-3` CZĘŚCIOWO ZROBIONE 2026-09-15** — `N-22` przepisane ✅, asercja per przedmiot ✅ (ramka + spójność `BlockSpec`); ⏳ **geometryczna połowa §X1 czeka na `T-1`**, bo dziś nie ma per-przedmiotowych łuków do sprawdzenia | 2 | Zamek §X5 padnie w dniu `T-1` i wymusi dokończenie |
| **4** | ⭐ **Puklerz · Okrągła · Rycerska**, placeholdery ikon | 2, 3 | |
| **5** | **Migdałowa** | 0b, 4 | ⛔ bez `T-5` jej tożsamość nie ma nośnika — byłaby cięższą Rycerską o niższej redukcji, czyli **zdominowaną** |
| **6** | ⚠ **`T-4` CZĘŚĆ 1 ZROBIONA / CZĘŚĆ 2 ZABLOKOWANA (audyt 2026-09-15)** | 4 | ✅ **Zasada spełniona już dziś**: bramka pyta o `blockSpec`, a w całym łańcuchu bashu **nie ma ani jednego identyfikatora tarczy** (zamki §S1–§S3). ⛔ **Część 2 — profil bashu per konstrukcja — wymaga elementu, którego architektura NIE MA**: `BlockSpec` nie ma pola profilu, a jego kształt nie jest nigdzie rozstrzygnięty. Szczegóły: §4.1 |
| **7** | **Legionowa + Pawęż RAZEM** | 0b, 1, 6, B2 | ⚠ rozdział jest relacyjny — osobno nieweryfikowalny |
| **8** | materiały poza drewnem · warianty · ceny | ✅ B1, B4 zamknięte | tuning |

⭐ **Do startu gotowe są DWA kroki: `0` (wymaga grania) i `0b` (nie wymaga
niczego).** Reszta czeka na `P1`.

✅ **Katalog jest SPISANY, SPRAWDZONY POD DOMINACJĘ I WDROŻONY:**
`docs/tarcze_katalog.md`. ⚠ **30 definicji, nie 39** — zakres zawężono 2026-09-16
(wariant `lekki` został wyłącznie przy Legionowej; powody per konstrukcja są
w `GameConfig.ts` przy `SHIELD_VARIANT` i w §5 katalogu).

⭐ **Wszystkie 30 stoi w `ITEMS` i na półkach** (Sobek 12 drewnianych w jakości 3,
Radzim 19 metalowych w jakości 1–2). Niezmienniki systemu pilnuje
`tools/tarcze_przymiar.mjs` (`node tools/tarcze_przymiar.mjs`), w tym §V — grupa
zamków na sam katalog.

### 4.1 ⛔ `T-4` część 2 — czego brakuje (audyt 2026-09-15)

**Co już jest poprawne:** bramka czyta `Equipment.blockSpec` (`GameScene.ts:4346`),
`requiresShield` jest **jedyną** bramką sprzętową w `ABILITIES`, a w całym
łańcuchu bashu (`GameScene.shieldStrike`, `AbilitySpec` case, `PLAYER_ACTIONS`)
**nie występuje ani jeden identyfikator tarczy**. ⛔ `T-4` **nie jest** i nie
będzie rozwiązywane przez listę nazw.

**Czego brakuje:** `BlockSpec` (`src/core/Equipment.ts:155`) ma **trzy pola** —
`reduction`, `swingMul`, `staminaCost`. **Nie ma profilu bashu.** Checkpoint
§1.2 wymienia „profil bashu" jako część `Construction`, ale **jego kształt nie
jest nigdzie zdefiniowany**.

⚠⚠ **I to nie jest brak, który da się wypełnić dowolnie — każdy z trzech
kandydatów na nośnik „mocnego bashu" koliduje z czymś już rozstrzygniętym:**

| kandydat | kolizja |
|---|---|
| **`stunMs`** | ⛔ `700` jest **skalibrowane** na *„dokładnie jeden darmowy cios każdą z dziewięciu broni, margines 90 ms"*; config ostrzega, że `900` daje 1 **albo** 2 ciosy zależnie od broni, rozstrzygane **marginesem 5 ms** — liczbą, której playtest nie odróżni od szumu |
| **`damageMultiplier`** | ⛔ twarda bariera: *„powyżej 1,0 umiejętność traci rację bytu"* — sufit, nie pokrętło |
| **`windupMs`** | ⛔ *„najszybsza zobowiązująca akcja w grze"* jest **tożsamością** tej umiejętności |

⭐ **Wniosek audytu: nie ma wolnego parametru.** Rozdzielenie Legionowej wymaga
**decyzji autora**, który z trzech kosztów przyjąć — albo dołożenia czwartego
nośnika. ⛔ Nie wybrano żadnego; `T-4` część 2 czeka.

### ✅ `S10` — ZAMKNIĘTE 2026-09-15 (decyzja autora + wdrożenie)

> **Tarcza zużywa się przy Bashu WYŁĄCZNIE po rzeczywistym trafieniu.**

| przypadek | zużycie |
|---|---|
| bash wykonany, nic nie trafione | ⛔ **brak** |
| bash trafia | ✅ istniejące `Equipment.wearShield()` |
| samo rozpoczęcie bashu | ⛔ **brak** |
| osobny `bashWear` | ⛔ **nie powstaje** |

**Jak wdrożone:** piąty wariant `ActionOnHit` — `{ kind: "wearShield" }` —
zadeklarowany na `PLAYER_ACTIONS.shieldBash`, wykonywany w `resolvePendingSwing`
pod `anyHit`, czyli **dokładnie tam, gdzie wisi oglęszenie**. ⭐ To nie jest nowy
mechanizm: to ten sam kanał deklaracji (P3.2), którym jedzie `control`, `refund`
i `armAutoAttack`. Stawka, rzut i próg pozostają wspólne (`EQUIPMENT.durability`),
więc zamek `§D13` (jeden kanał zużycia) świeci dalej na zielono.

⭐ **Domknęło zdanie, które od początku stało w kodzie jako ZAMIAR:** przy
`wearsWeapon: false` stał komentarz *„zużywa się to, czym się uderza — a uderza
tarcza"*, a tarcza nie zużywała się przy bashu **ani razu**.

⚠ Zamki: `§T7` w regresji (deklaracja · pod `anyHit` · bez `bashWear`) oraz
`§S8` w przymiarze tarcz. Pięć sabotaży, pięć czerwieni.

---

### ⛔ `T-4` część 2 — **OPEN**: nośnika nie da się zbudować bez decyzji (2026-09-15)

**Decyzja autora:** mocniejszy bash Legionowej ma być opłacony **istniejącym**
kosztem ofensywnym (`swingMul`); ⛔ bez nowego parametru bash, bez ruszania
`stunMs`, bariery `damageMultiplier` i `windupMs`. **Kierunek docelowy:**
profil bashu jako własność `Construction`, obok `block`.

**Pytanie autora:** czy da się dowieźć sam NOŚNIK, bez wartości balansu?
**Odpowiedź: NIE — i powód jest architektoniczny, nie kosmetyczny.**

✅ **Kanał KOSZTU jest gotowy.** `blockSpec.swingMul` → `offhandSwingMul` →
`Progression.swingMul` → `swingDurationMs`, a wysiłek jedzie za długością
zamachu. Okuta tarcza (`swingMul 1,2`) kosztuje dziś **+20% czasu zamachu
i +20% wysiłku**. Nowy parametr ceny nie jest potrzebny (zamki `§N2`).

⚠⚠ **`swingMul` NIE DOCIERA DO BASHU** (zamek `§N2b`): `commitPlayerAction`
bierze czas z `action.windupMs × 2`, a wysiłek ze stałej
`ABILITIES.shieldBash.staminaCost`. ⇒ to jest cena płacona **autoatakiem**.
Dla tej decyzji dobra wiadomość — ale trzeba to wiedzieć, nie zakładać.

#### ⛔ Dlaczego nośnik wymaga decyzji: profil bashu **NIE MA JEDNEGO CZYTELNIKA**

| pole | kto je czyta DZIŚ | status |
|---|---|---|
| `stunMs` | **statyczna deklaracja** `PLAYER_ACTIONS.shieldBash.onHit` | ⛔ zamrożone (autor) |
| `damageMultiplier` | **resolver** `AbilitySpec.ts` | ⛔ zamrożone (bariera 1,0) |
| `windupMs` | statyczna deklaracja `PLAYER_ACTIONS` | ⛔ zamrożone (tożsamość) |
| `knockbackPx` | ⭐ **`shieldStrike()` — ścieżka ŚWIADOMA SPRZĘTU** | ⛔ = 0 świadomie (`§T7`) |
| `recoveryMs` | statyczna deklaracja `PLAYER_ACTIONS` | ✅ wolne |
| `cooldown` | `Abilities` | ✅ wolne |
| `staminaCost` | `GameScene` (`def.staminaCost`) | ✅ wolne |

⭐ **Siedem pól, CZTERECH różnych właścicieli** — i tylko jedno pole
(`knockbackPx`) płynie już ścieżką, która widzi sprzęt. ⇒ „profil bashu"
nie jest dziś bytem, który da się przenieść pod `Construction` jedną zmianą
hydrauliki. **To nie jest brakujące pole, tylko brakujące MIEJSCE.**

#### Trzy decyzje, których nie mam — i których nie wymyślę sam

1. **KTÓRE pola wchodzą do `Construction.bash`.** Cztery z siedmiu są
   zamrożone. Trzy wolne (`cooldown`, `recoveryMs`, `staminaCost`) mówią
   **„jak często" i „jak drogo", a nie „jak mocno"** — więc nawet one nie
   niosą „mocniejszego bashu" bez rozstrzygnięcia, co to słowo znaczy.
2. **SEMANTYKA pola: nadpisanie czy mnożnik na globalnym?** Od tego zależy, co
   znaczy konstrukcja, która pola nie deklaruje — dziedziczy czy zeruje.
3. **KTÓRY właściciel staje się świadomy sprzętu.** Przeniesienie `stunMs`
   z deklaracji do sprzętu łamie zapisaną regułę `P3.1`: *„deklaracja opisuje
   AKCJĘ; to, czym akcja uderza, zależy od sprzętu w tej klatce"*. To jest
   świadomy podział, a nie przypadek — i jego zmiana jest decyzją projektową.

⛔ **`T-4` część 2 zostaje OPEN.** ⚠ Pusty `bash: {}` „na zapłon" jest
wykluczony przez regułę `src/core/CLAUDE.md`: *„nie okablowuj slotu na zapas"* —
slot bez przedmiotu deklaruje mechanikę, której nie ma. Pilnują `§S8`/`§S9`.

---

### ⏳ `S10` — audyt wariantów (2026-09-15, HISTORIA — decyzja wyżej)

**Cykl życia bashu:**

```
naciśnięcie → bramka `blockSpec` → `shieldStrike()` → `resolveCastTarget`
  → commitPlayerAction:  triggerAttack(windupMs×2, root = windup+recovery)
                         ⚠ `if (action.wearsWeapon) wearWeapon()`  ← dla bashu FALSE
                         pendingSwing{ resolveAt = now + windupMs, onHit: control }
                         koszt staminy i cooldown PŁACONE TUTAJ
  → +180 ms:             anyHit = damageLockedTarget(...)   ⚠ PONOWNY test zasięgu
                         if (onHit && anyHit) → interrupt() + stun()
  → +400 ms:             koniec ukorzenienia
```

**Czy bash zużywa tarczę: ⛔ NIE.** `wearShield()` ma w całym `src/` **jedno**
wywołanie — `Player.ts:1398`, wewnątrz `if (zablokowano)`. Ścieżka bashu nie
dotyka go w żaden sposób.

⚠ **Ale `wearsWeapon: false` NIE jest martwą deklaracją.** `GameScene:4127`
czyta je i dzięki niemu bash **nie zużywa ORĘŻA**. Komentarz *„zużywa się to,
czym się uderza — a uderza tarcza"* jest więc **zaimplementowany w połowie**:
✅ negatywnej (broń się nie zużywa), ⛔ pozytywnej (tarcza też nie).

⚠⚠ **Znalezisko, które przesądza o sposobie wdrożenia:** przestawienie flagi na
`true` **nic by nie dało** — `Equipment.wearWeapon("offhand")` czyta
`offhandWeapon`, a ten zwraca `null` dla wszystkiego, co nie jest bronią.
**Kanał zużycia broni jest dla tarczy strukturalnie zamknięty**, więc zużycie
bashu wymaga WŁASNEGO wywołania. Utrwalone zamkiem §S11 (sprawdzanym
zachowaniem: po sabotażu trwałość spadła 50 → 49).

#### ⛔ Weryfikacja hipotezy o „mikrozużyciu przy redukcji" (2026-09-15)

> **Sprawdzona hipoteza:** *trwałość może być konsumowana także przez
> mikrozużycie związane z redukcją pancerza, co X ciosów.*
> ## ⛔ **TAKI MECHANIZM NIE ISTNIEJE.**

To nie jest „nie znalazłem" — to jest **wyczerpujące wyliczenie** po całym `src/`:

| co | gdzie |
|---|---|
| **jedyne odjęcie trwałości** | `Quality.applyWear` (`Quality.ts:227`) |
| **wszyscy wołający `applyWear`** | **`Equipment.ts` i tylko on** — `wearWeapon` (:1134) i `wearShield` (:1172) |
| **wszystkie mutacje pola `durability`** | wyłącznie `Quality.ts`: tworzenie (:131), sanityzacja zapisu (:172), zużycie (:227), naprawa (:262) |
| **ścieżka mitygacji** (`Protection`, `DamageResolver`) | ⛔ **zero odwołań do trwałości** — jedyna wzmianka to komentarz o *„a **future** durability multiplier"* |
| **konfiguracja** `EQUIPMENT.durability` | `wearChance`, `wearAmount`, `destroyedMultiplier`, `repairPriceFraction` — ⛔ **żadnego pokrętła „co X ciosów"** |

⚠ **Kto w ogóle ma trwałość:** 13 przedmiotów — **11 broni + 2 tarcze**.
⛔ **30 z 32 sztuk pancerza NIE MA pola `durability`** i nie zużywa się nigdy.
`Quality.ts` mówi o tym wprost: *„armour durability is deliberately out of
scope for this pass"*.

⭐ **Konsekwencja dla wyboru modelu bashu:** wariant „mikrozużycie jak
kontakt/mitygacja" **nie ma dziś nośnika** — nie jest wyborem między istniejącymi
modelami, tylko **zbudowaniem drugiego kanału zużycia od zera**.

Utrwalone zamkiem §D13 (trzy asercje, skan całego `src/`). Sabotaż — wstawienie
słowa `durability` w `Protection.mitigate` — zapala go natychmiast.

#### Cztery warianty — konsekwencje, bez wyboru

| | **A. zużycie na WYKONANIE** | **B. zużycie na TRAFIENIE** |
|---|---|---|
| model | pełne, jak broń | pełne, jak blok |
| gdzie wchodzi | `GameScene:4127`, obok `wearsWeapon` | `GameScene:~3455`, w `if (swing.onHit && anyHit)` |
| spójne z | **bronią** — *„ONE wear roll per swing… stays at swing START… a swing cancelled by Unik still wears the weapon"* | **blokiem** — dzisiejszym jedynym zużyciem tarczy (`if (zablokowano)`) |
| niespójne z | blokiem: tarcza zużywałaby się raz od uderzenia, raz od machnięcia | bronią: ta sama akcja zużywa oręż na starcie, a tarczę na trafieniu |
| pudło | ⚠ **zużywa** — bash realnie pudłuje (cel wychodzi z zasięgu w 180 ms, koszt i cooldown i tak zapłacone) | nie zużywa |
| czytelność fizyczna | „machnąłeś tarczą" | „tarcza w coś uderzyła" |

⚠⚠ **To NIE jest różnica bez znaczenia balansowego, wbrew pierwszemu wrażeniu.**
Przy `wearChance 0,15` jedno użycie to 0,15 punktu. Blok przy 2 ciosach na walkę
daje 0,30 pkt/walkę; bash (cooldown 10 s, więc ≤1 na walkę) dołożyłby do 0,15 —
czyli **+25…+50% do całego tempa zużycia tarczy**. Wariant A dokłada to nawet za
pudła, wariant B tylko za trafienia.

**Wariant C — osobny kanał (mikrozużycie).** ⛔ **Wymaga zbudowania mechanizmu,
którego nie ma** (patrz wyżej): nowego pokrętła w `EQUIPMENT.durability`, licznika
stanu na egzemplarzu albo ułamkowej trwałości, oraz decyzji, czy dotyczy też
30 sztuk pancerza bez `durability`. ⚠ Najdroższy z czterech i jedyny, który
rozszerza model `condition` poza tarcze.

**Wariant D — brak zużycia (stan dzisiejszy).** ⭐ Zero pracy, zero ryzyka.
⚠ Koszt: komentarz przy `wearsWeapon: false` **pozostaje zaimplementowany
w połowie** — mówi „zużywa się to, czym się uderza", a tarcza się nie zużywa.
Do rozważenia poprawienie samego komentarza, żeby nie obiecywał mechaniki,
której nie ma.

⛔ **Decyzja należy do autora.** Kod nietknięty.

## Etapy katalogu

```
pełny możliwy:  30 definicji  (× 7 jakości = 210 egzemplarzy — jakość jest DARMOWA)

etap 1 (krok 3+5+7):  6 konstrukcji × drewno, wariant zwykły   →   6 definicji
etap 2:               + żelazo tam, gdzie naturalne            →  10
etap 3:               + stal (miasto)                          →  13
etap 4:               + warianty                               →  30   ✅ WDROŻONE 2026-09-16

⚠ 39 → 30: wariant `lekki` tylko dla Legionowej (decyzja autora 2026-09-16).
```

⚠ **Predykcja, nie problem:** przy etapie 4 katalog przekracza próg ~25 pozycji,
przy którym ręczne definiowanie przestaje być tańsze niż oś na egzemplarzu.
**Wtedy — nie wcześniej** — materiał albo wariant zjeżdża do `ItemInstance`,
tą samą drogą, którą weszła `quality`. To będzie **przeniesienie, nie przebudowa**.

## Architektura — ✅ bez zmian

`ItemId = keyof typeof ITEMS` zostaje (każde `id` sprawdzane przy kompilacji) ·
`ItemInstance` bez zmian · zapis addytywny, bez podbijania `SAVE_VERSION` ·
naprawa nietknięta.
⚠ **Jedyna znana luka na przyszłość:** brak pola na **nazwę własną / sygnaturę
wytwórcy** w `ItemInstance` — potrzebne dopiero, gdy unikaty mają być
wytwarzane, a nie wpisywane ręcznie.

---

# 5. POMYSŁY ODŁOŻONE

| rzecz | gdzie zapisane |
|---|---|
| **`T-6`** — sufit łącznej mitygacji (`OI-24`, dziś 77–83%) | ⚠ warunek **znaczącego** wpływu materiału na `reduction` |
| model obciążenia — ✅ **ROZSTRZYGNIĘTY I WDROŻONY 2026-09-15: Model D, dwie osie** (`OI-101`/`OI-103`/`OI-104` zamknięte); zostaje playtest `OI-105` | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| oś grubości jako system · dostępność wg lokacji · poziomy rzemieślników | `docs/odlozone.md` §3 |
| metalowa Pawęż · stalowa Migdałowa | granica **aktualnego zakresu**, nie „nigdy" |
| materiały fantasy (mithril, gromnil, stopy elfie) | ⛔ **najpierw `docs/swiat.md`, potem liczby** |
| `sideMul` per tarcza | ⛔ zakaz proceduralny do czasu playtestu |
| przebudowa `QUALITY.modifiers` na model pasmowy | domena `items`, nie `shields` |
| Pawęż stawiana jako obiekt · Raise Shield · `coverage` | ⛔ odrzucone — `docs/odlozone.md` §5 |

---

# Gdzie czego szukać

| pytanie | dokument |
|---|---|
| **jak blok działa DZIŚ** | `docs/systemy/shields.md` (`STAN`) |
| pomiary, odrzucone warianty, rejestr `Z-1…Z-9` | `docs/tarcze_konstrukcje_2026-09-14.md` |
| obciążenie — trzy modele, **żaden niewybrany** | `docs/audyt_obciazenia_i_warstw_2026-09-14.md` |
| reguła wariantu, precedens taksonomii | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |
| trójkąt 1H+tarcza / 2H / DW | `docs/archetypy_walki.md` |
| co jest otwarte w całym projekcie | `docs/zadania.md` |

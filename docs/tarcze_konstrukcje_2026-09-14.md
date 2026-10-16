---
typ: HISTORIA
domena: [shields, items]
tytul: Tarcze — audyt systemu i robocza taksonomia konstrukcji
stan: zywy
otwarte: [T-1, T-2, T-3, T-4, T-5, T-6, OI-24, OI-25, OI-26, OI-103]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Tarcze — audyt systemu i robocza taksonomia konstrukcji (2026-09-14)

> ## ⛔ PRZESTAŁ BYĆ PUNKTEM WEJŚCIA — 2026-09-15
>
> **Bieżący stan ustaleń: `docs/tarcze_checkpoint.md`.** Ten plik zachowuje
> **pomiary, odrzucone warianty i rejestr zarzutów `Z-1…Z-9`** i w tym zakresie
> jest aktualny. ⚠ **Ale jego katalog konstrukcji i część statusów są
> nieaktualne** — po nim doszły: szósta konstrukcja (legionowa), przywrócenie
> Migdałowej jako osobnej konstrukcji, oraz dwie korekty tożsamości wymuszone
> arytmetyką (Migdałowa i Pawęż **nie** opierają się na PP).
>
> ⛔ **§5.3 odrzuciło Migdałową argumentem z `coverage`** — czyli przesłanką,
> którą autor unieważnił przy kolczugach. **To odrzucenie jest nieważne
> metodologicznie i zostało cofnięte 2026-09-15.**

> ## ⛔ CZTERY RZECZY, ZANIM COKOLWIEK STĄD WEŹMIESZ
>
> 1. ⛔ **ZERO ZMIAN W KODZIE.** Sesja wyłącznie projektowa. Nie ruszono ani
>    jednej liczby, ani jednego pola, ani jednej funkcji. `SHIELD.*`,
>    `BlockSpec`, `guardZone`, `resolveIncoming`, obie tarcze w `ITEMS` — stoją
>    dokładnie tak, jak stały.
> 2. ⛔ **NIC NIE ZOSTAŁO ZDECYDOWANE.** Katalog czterech konstrukcji z §6 jest
>    **PROPOZYCJĄ**, nie decyzją. Sześć pytań z §9 czeka na autora.
> 3. ⛔ **`docs/systemy/shields.md` jest nadal jedynym źródłem prawdy o tym, jak
>    blok działa DZIŚ.** Ten plik jest `HISTORIA` — bierz z niego pomiary,
>    powody i odrzucone warianty, **nigdy stanu gry**.
> 4. ⚠ **Pierwsza wersja taksonomii (4 konstrukcje na osi „chwytu") została
>    w tej samej sesji OBALONA przez autora analizy i jest tu zapisana jako
>    odrzucona** (§5). Obowiązuje wersja z §6. Nie mieszaj ich.
>
> **Po co ten plik.** Punkt wejścia do kontynuacji na innej maszynie: co
> sprawdzono w kodzie, co zmierzono, do czego doszliśmy i czego już nie trzeba
> powtarzać.

---

## 1. Stan wyjściowy — co system tarcz robi dziś

⚠ Wszystko poniżej zweryfikowane odczytem kodu 2026-09-14, nie z dokumentacji.

### 1.1 Roster — dwie tarcze

| pole | `buckler` | `ironbound_shield` |
|---|---|---|
| nazwa | Puklerz | Tarcza okuta |
| `type` / `slot` | `armor` / `offhand` | `armor` / `offhand` |
| `armorType` | `leather` | `metal` |
| `weight` | 1,5 | 5,0 |
| `defense` | 4 | 8 |
| `block.reduction` | 0,30 | 0,45 |
| `block.swingMul` | 1,08 | 1,20 |
| `block.staminaCost` | 3 | 5 |
| `size` | `maly` | `duzy` |
| `requires` | brak | `strength: 3` |
| cena kupna / sprzedaży | 50 / 20 | 220 / 88 |
| `durability` | **nie istnieje** | **nie istnieje** |
| tag `set` | **brak** | **brak** |

Adresy: `GameConfig.ts:5254`, `GameConfig.ts:5280`. Modele 3D:
`tools/char3d_shields.py` (`TARCZE`), pilnuje `tools/char3d_sprawdz_tarcze.py`.

### 1.2 Ścieżka bloku — pełny przepływ

```
Enemy / Projectile / Bear / Boar / Wolf / GreyWolf / Rabbit / VenomSpider
  → Player.takeDamage(packet, from, execution)            [Player.ts:1246]
     → resolveIncoming(ctx)                               [DamageResolver.ts:139]
          immune → dodge → parry → block → pancerz → JEDNO Math.round
     → Stamina.spend(blockStaminaCost, "block")  jeśli zablokowano  [Player.ts:1369]
     → Stamina.spend(hitCost(mitigated), "hitTaken")                [Player.ts:1370]
     → ogloszCios(...) → CombatCues.cuesFor                        [CombatCues.ts:305]
```

**Arytmetyka** (`DamageResolver.ts:150`):

```ts
blocked = zone === "front" ? blockReduction
        : zone === "side"  ? blockReduction * blockSideMul
        : 0;
mitigated = Math.max(1, Math.round(amount * (1 - armorReduction) * (1 - blocked)));
outcome = blocked > 0 ? "block" : "hit";
```

**Geometria** (`Protection.guardZone`, zbudowana NA `isFrontal`):

| strefa | warunek | efekt |
|---|---|---|
| `front` | kąt < `SHIELD.fullArcDeg` (**60**) | pełne `reduction` |
| `side` | kąt < `SHIELD.sideArcDeg` (**100**) | `reduction × SHIELD.sideZoneMul` (**0,50**) |
| `back` | dalej, albo `from === null`, albo wektor zerowy | nic |

**Zwrot, który się liczy** (`Player.guardDir`, `Player.ts:344`): `attackDir`
w czasie pozy ataku, `moveDir` poza nią — czyli ten, który **rysuje sprite**.

### 1.3 Fakty, które rozstrzygają większość sporów

- **Blok jest deterministyczny.** Zero rzutów (N-23, odrzucone z pomiarem).
- **Blok jest neutralny wobec typu obrażeń** (N-24).
- **Blok nie ma cooldownu, okna, inputu ani przycisku.** Jest w 100% pasywny.
- **Blok nie może zawieść z braku staminy** — `Stamina.spend()` z niezmiennika
  **nigdy nie odmawia** (`Stamina.ts:111`). Guard-break nie ma na czym stanąć.
- **Blok nie daje NIC po udanej obronie.** Żadnej riposty, zwrotu staminy,
  procka, obrażeń dla napastnika.
- **Wszystkie kanały obrażeń niosą kierunek**, więc wszystkie są blokowalne.
  Wyjątek świadomy: jad (`takeVenomTick` omija cały łańcuch).
- **Blok istnieje wyłącznie po stronie GRACZA.** `resolveIncoming` ma jednego
  wołającego; `Enemy` używa tylko `mitigate()` (punkty pancerza).
- **Tarcza zasila DWA niezależne kanały obrony**: punkty (przez `armorPieces()`,
  krzywa `d/(d+50)`, cap 0,75) **oraz** blok (płaski ułamek, **bez capu**).
- **Bramka `requiresShield` czyta `Equipment.blockSpec`**, nie listę nazw
  (`GameScene.ts:4346`). Tarczą jest to, co potrafi blokować.
- **Broń dwuręczna wyklucza tarczę strukturalnie** (`handsRefusalFor`), bez
  osobnej reguły. Trzy bronie `hands: 2`: włócznia, topór bojowy, młot bojowy.

---

## 2. Pomiary — wykonane, nie do powtarzania

### 2.1 Archetypy (`node tools/combat_benchmark.mjs`, SIŁ 5, reszta 0, Q3, cel 20 pkt leather)

| konfiguracja | Att/s | AvgHit | DPS | Stam/s | AvgTaken (20 slash od przodu) | DPS/AvgTaken |
|---|---|---|---|---|---|---|
| 1H sam (miecz) | 2,00 | 6,2 | ~11,0 | 3,96 | 17,87 | 0,62 |
| **1H + puklerz** | 1,85 | 6,2 | **10,2** | **3,96** | **11,62** | **0,88** |
| 1H + okuta *(wyliczone)* | 1,67 | 6,2 | ~9,2 | 3,96 | ~9,8 | ~0,94 |
| **2H (topór bojowy)** | 1,47 | 10,9 | **14,2** | 4,61 | 18,97 | 0,75 |
| **Dual Wield (miecz+sztylet)** | 2,48 | 5,9 | **12,8** | 4,36 | 17,87 | 0,72 |

Rozkład obrony 1H+tarcza: **block 89,4% · parry 5,5% · dodge 5,2% · hit 0,0%**.

⚠⚠ **1H + tarcza jest bezwarunkowo najlepszym archetypem: +25% nad 2H i +30%
nad DW na mierze `DPS / obrażenia przyjęte`** — i to **zanim** doliczy się
kontrolę z Uderzenia tarczą. To jest OI-25, znane i pogłębione.

⭐ **Tarcza nie kosztuje ani punktu staminy na sekundę.** `swingMul` mnoży
kadencję i koszt zamachu tym samym mnożnikiem, więc `stamina/s` się nie rusza
(3,96 z puklerzem = 3,96 bez). **Cena tarczy jest wyłącznie w DPS.**

### 2.2 Punkty obrony tarczy — oś prawie martwa w pełnym pancerzu

| zestaw | pkt bez → z tarczą | redukcja | przyrost |
|---|---|---|---|
| brak + puklerz | 0 → 4 | 0,0% → 7,4% | +7,41 pp |
| brak + okuta | 0 → 8 | 0,0% → 13,8% | +13,79 pp |
| skóra + okuta | 31 → 39 | 38,3% → 43,8% | +5,55 pp |
| **stal + okuta** | 63 → 71 | 55,8% → 58,7% | **+2,93 pp** |

⚠ **Materiał tarczy (`armorType`) jest z tego powodu słabym wyróżnikiem.**

### 2.3 Blok skalowany jakością (`QUALITY.modifiers.defense`, −15%…+20%)

| tarcza | Q1 | Q3 | Q4 (sufit sklepu) | Q7 |
|---|---|---|---|---|
| Puklerz — front / bok | 25,5% / 12,8% | 30,0% / 15,0% | 31,5% / 15,8% | 36,0% / 18,0% |
| Okuta — front / bok | 38,3% / 19,1% | **45,0% / 22,5%** | 47,3% / 23,6% | 54,0% / 27,0% |

### 2.4 Łączna mitygacja — OI-24

| konfiguracja | pancerz | blok | **łącznie** | cios 20 → |
|---|---|---|---|---|
| goły + okuta Q3 | 13,8% | 45,0% | 52,6% | 9 |
| **stal Q3 + okuta Q3** | 58,7% | 45,0% | **77,3%** | 5 |
| stal Q7 + okuta Q7 | 63,0% | 54,0% | **83,0%** | 3 |

⚠ `EQUIPMENT.maxDefenseReduction = 0,75` **nie dotyczy bloku**. `blockSpec` ma
tylko `Math.max(0, scaled)`.

### 2.5 Masa tarczy — koszt PROGOWY, nie ciągły

| zestaw | SIŁ | goły | + puklerz | + okuta |
|---|---|---|---|---|
| skóra + miecz | 5 / 8 / 12 | 10,5 light | 12,0 light | 15,5 **light** |
| stal + miecz | 5 | 29,0 medium | 30,5 **heavy** | 34,0 **heavy** |
| stal + miecz | 8 / 12 | 29,0 medium | 30,5 medium | 34,0 medium |

⚠ Dla buildu lekkiego tarcza kosztuje **dokładnie zero** (nie wypycha z `light`,
więc `DEFENSE.dodge.lightLoadBonus ×1,3` zostaje). Cena masy jest dodatkowo
nierozstrzygnięta — **OI-103**, trzy niewybrane modele.

### 2.6 Koszt staminy bloku — zmierzony jako ZBYT MAŁY, by nieść tożsamość

Pula **120**, regen **3/s** (4/s po odpoczynku). Gracz przyjmuje **1–4 ciosy na
walkę** (królik ~1, wilk ~2, niedźwiedź ~3, dzik ~4; Szary ~10). Walka trwa
**0,6–3,8 s**.

| scenariusz | koszt bloków | % puli | odrobienie |
|---|---|---|---|
| wilk, 2 ciosy, stawka 3 | 6 | 5,0% | 2 s |
| dzik, 4 ciosy, stawka 5 | 20 | 16,7% | 6,7 s |
| różnica najtańsza↔najdroższa przy rozsunięciu 2↔8, 2 ciosy | 12 | 10% | 4 s |

Dla porównania: sam autoatak kosztuje **3,96/s**.

⭐ **Wniosek: `staminaCost` zostaje jako koszt, nie jako charakter konstrukcji.**

---

## 3. ⭐ Dwa znaleziska, które rozstrzygają projekt geometrii

### 3.1 Zwrot postaci jest CZTEROKIEROWY → progi jakościowe, nie pokrętło

`FACING_VECTOR` ma **cztery** wektory (up/down/left/right). Kierunek napastnika
jest ciągły, zwrot gracza nie. **Maksymalny rozjazd między „celuję w niego"
a jego realnym kątem wynosi 45°.**

| `fullArcDeg` | co to znaczy dla gracza | czytelność |
|---|---|---|
| **< 45°** | ⭐ osłona **nie kryje w pełni nawet ćwiartki, w którą patrzysz** — przekątne wyciekają | bardzo wysoka |
| 45–60° | kryje Twoją ćwiartkę, margines 0–15° | wysoka |
| 60–90° | Twoja ćwiartka + kawałek sąsiedniej | średnia |
| > 90° | ⛔ sufit — patrz §3.2 | — |

| `sideArcDeg` | co to znaczy |
|---|---|
| ~100° (dziś) | reakcja niewiele poza Twoją ćwiartką |
| **~135°** | ⭐ reakcja na **całą sąsiednią ćwiartkę** — wilk, który zaszedł z boku, nadal trafia w tarczę |
| ~150° | wszystko poza tyłem |

⚠⚠ **Wartości kątów muszą trafiać w progi 45 / 90 / 135, nie interpolować
między nimi.** Ustawione na progach są uczące się z SYTUACJI (sfora, drugi
przeciwnik, ucieczka). Ustawione pomiędzy — są niewidzialnym pokrętłem.

### 3.2 ⛔ Sufit `fullArcDeg` wynosi 90° i jest wspólny z parowaniem

Regresja §L pilnuje **`fullArcDeg ≤ blockArcDeg`**, gdzie
`blockArcDeg = FRONT_ARC_DEG = 90` jest **współdzielony z bramką zwrotu ataku
(`PLAYER.attackFrontArcDeg`) i z PAROWANIEM**. Podniesienie go rusza regułę
„trafiasz to, co mógłbyś zablokować".

`sideArcDeg` **takiego sufitu nie ma** (dziś 100, już powyżej 90).

⭐ **Z tego wynika cała geometria katalogu — DWIE niezależne osie:**

| oś | zakres użyteczny | co wyraża |
|---|---|---|
| **`fullArcDeg`** | **45°–90°** | jak dużo frontu tarcza kryje **w pełni** |
| **`sideArcDeg`** | **90°–~150°** | jak daleko sięga osłona **osłabiona** |

**Tarcze „twarde" różnią się pierwszą osią. Tarcze „szerokie" — drugą.**

---

## 4. Co da się sparametryzować BEZ nowej mechaniki

⚠ Ustalenie autora (2026-09-14): **modyfikacja istniejącej logiki bloku tak, by
czytała parametry konstrukcji zamiast jednej stałej globalnej, NIE JEST nową
mechaniką.** Ten sam resolver, te same reguły, inne dane wejściowe.

| mechanizm | dziś | co trzeba ruszyć | werdykt |
|---|---|---|---|
| `fullArcDeg` / `sideArcDeg` | stałe `SHIELD.*` czytane wewnątrz `guardZone` | `guardZone(facing, from, arcs)` — jedna sygnatura, **jedno miejsce wołania** (`DamageResolver`). Zagnieżdżenie `isFrontal` zachowuje `front ⊆ bok` strukturalnie | ✅ parametryzacja |
| `sideMul` | **już jest parametrem** `DamageContext.blockSideMul` | jedna linijka w `Player.takeDamage` | ✅ ale patrz §7 |
| profil `shieldBash` | stałe `ABILITIES.shieldBash.*` | czytać z `blockSpec` | ✅ **najbardziej odczuwalna oś** |
| `reduction`, `swingMul`, `staminaCost`, `weight`, `defense`, `armorType`, `requires` | już per przedmiot | nic | ✅ |
| `durability` | `hasDurability` czyta **obecność pola w `ITEMS`** | pole + jedno wołanie zużycia obok istniejącego `Stamina.spend(blockStaminaCost)` | 🟡 pole = zero kodu |

### ⛔ „Nie na teraz" — wymaga mechaniki, której nie mamy

`turnMs` / opóźnienie przeniesienia osłony · aktywny blok („Raise Shield") ·
pawęż stawiana jako obiekt na mapie · osobny mnożnik na kanał pociskowy ·
przełamanie bloku przy zerowej staminie (`spend()` z niezmiennika nie odmawia) ·
`coverage` (⛔ **nigdy** — zamknięte 2026-09-12).

### ⚠ Koszt formalny: N-22 trzeba PRZEPISAĆ, nie złamać po cichu

N-22 brzmi „warunek osłony stoi w stałych, nie na przedmiocie". Jego **jedyne**
uzasadnienie w `shields.md`: *„dzięki temu przyszłe »Raise Shield« byłoby zmianą
stałej"*. Ten sam dokument, sekcja niżej: *„Czy »Raise Shield« ma powstać. **Nie
istnieje i nie jest zaplanowane**."*

⭐ **Jedyne uzasadnienie N-22 opiera się na funkcji, której ten sam plik nie
planuje.** Proponowane nowe brzmienie: *„geometria jest własnością konstrukcji;
siła kary bocznej (`sideMul`) należy do mechaniki."*

---

## 5. ⛔ ODRZUCONE W TEJ SESJI — nie proponować ponownie

### 5.1 Pierwsza wersja taksonomii: „chwyt jako oś porządkująca"

Zaproponowano katalog 4 konstrukcji ułożonych na osi **chwyt centralny ↔
przedramię**, z osiami `turnMs`, `sideMul` i kosztu staminy jako
różnicującymi. **Obalone w tej samej sesji, sześcioma zarzutami:**

| # | zarzut | status |
|---|---|---|
| **Z-1** | ⛔ **Przesłanka była fałszywa.** „Dzisiejsza para to szczebel" jest sprzeczne z kryterium, które projekt przyjął dla pancerza 2026-09-12. Policzone: puklerz **2,67 pkt/kg** vs okuta **1,60**; puklerz **4,05 pp redukcji na %DPS** vs okuta **2,69**. Lżejsza ma lepszy stosunek i niższą wartość bezwzględną **na obu osiach** — to jest definicja wariantu, nie szczebla | **utrzymany** |
| **Z-2** | ⛔ **W przestrzeni WIDOCZNYCH statystyk katalog był drabinką.** 4 z 7 osi różnicujących są dla gracza niewidoczne — i to właśnie te „łamiące drabinkę" | **utrzymany** |
| **Z-3** | ⛔ Koszt staminy bloku nie udźwignie tożsamości — §2.6 | **utrzymany** |
| **Z-4** | ⛔ `turnMs` zderza się z tożsamością systemu (*„tarcza jest odpowiedzią na twój własny root"*) i ze skalą czasu: zamachy trwają **140–290 ms**, więc pasmo użyteczne `turnMs` to 40–120 ms, poniżej progu odróżnialności | **utrzymany — `turnMs` ODRZUCONY** |
| **Z-5** | „geometria per tarcza to szansa bloku tylnymi drzwiami" | ⚠ **CZĘŚCIOWO COFNIĘTY** — patrz §5.2 |
| **Z-8** | „chwyt" ma w kodzie **zero czytelników** — dokładnie ten zarzut, który postawiono polu `size` (OI-9). Rodziny tarcz są strukturalnie słabsze niż rodziny pancerza, bo N-24 zabiera im odpowiednik `ARMOR_PROFILE` | **utrzymany — oś chwytu porzucona** |

### 5.2 ⚠ Korekta do Z-5 — dlaczego geometria per tarcza JEST dopuszczalna

Z-5 zlał dwie różne wady: **nieczytelność** i **losowość**. N-23 odrzuciło
`blockChance` z powodu **wariancyjnego**: *„gracz przyjmuje 1–4 ciosy na walkę,
więc rzut 30% to moneta rzucana raz na starcie"*.

⭐ **Geometria per tarcza ma wariancję ZERO.** Ta sama sytuacja zawsze daje ten
sam wynik. Gracz uczy się **reguły o pozycji**, nie rozkładu. **Nie odtwarza
defektu, dla którego N-23 powstało.**

Co z Z-5 zostaje: gracz nie widzi liczby obrażeń przyjętych, więc uczy się
z sytuacji, nie z pomiaru — **dlatego wartości muszą trafiać w progi z §3.1**.

### 5.3 Konstrukcje odrzucone i powody

| odrzucone | dlaczego |
|---|---|
| **Targe** | identyczna z małą okrągłą — zero różnicy mechanicznej |
| **Migdałowa / kite jako osobna konstrukcja** | ten sam kształt i chwyt co heater, +40% długości; jej sens (noga **jeźdźca**) nie istnieje bez konnicy, a `coverage` nigdy nie powstanie → **wariant rozmiaru Rycerskiej** |
| **Owalna** | duża okrągła albo deskowa zależnie od wygięcia — nazwa bez mechaniki |
| **Adarga** | jej profil („szeroka + lekka + krucha") to **cztery liczby na przedmiocie**, nie geometria; dodatkowo oparta na `armorType`, który §2.2 mierzy jako oś prawie martwą → **wariant, nie konstrukcja** |
| **Bouche / turniejowa** | wycięcie na kopię bez kopii, konia i turnieju |
| **Rondache, rotella, ecu à bouche, warianty regionalne** | `Quality` albo kosmetyka |
| **Hoplon z podwójnym chwytem** | wyróżnia go **formacja** — mechanika grupowa, której nie ma i nie planujemy |
| **Lantern shield** | przedmiot złożony; bez wnętrz i oświetlenia nic nie znaczy |
| **Materiał „drewno" (`wood`)** | ⛔ zamknięte — nowa kolumna `ARMOR_PROFILE` to nowa decyzja balansowa |
| **`blockChance`** | ⛔ N-23, odrzucone z pomiarem |
| **Blok per typ obrażeń** | ⛔ N-24 |
| **Koszt staminy za TRZYMANIE tarczy** | ⛔ N-27 — bierny podatek za sprzęt |
| **Własna kara tarczy do prędkości ruchu** | dubluje masę; ruch należy do obciążenia (OI-103) |
| **`sideMul` per tarcza (na teraz)** | w configu stoi wprost: *„Nie strój tej liczby, zanim ktoś w to nie zagra"* |

---

## 6. ⭐ PROPOZYCJA OBOWIĄZUJĄCA — 4 konstrukcje na dwóch osiach geometrycznych

⛔ **To jest propozycja, nie decyzja.**

|  | **zewnętrzna WĄSKA** (~100°) | **zewnętrzna SZEROKA** (~135°+) |
|---|---|---|
| **pełna WĄSKA** (<45–50°) | **PUKLERZ** | *puste — brak tożsamości* |
| **pełna SZEROKA** (60–90°) | **RYCERSKA** | **OKRĄGŁA** · **PAWĘŻ** |

| | **PUKLERZ** | **OKRĄGŁA** | **RYCERSKA** | **PAWĘŻ** |
|---|---|---|---|---|
| odpowiednik | buckler | wikińska / rotella | heater *(migdałowa = wariant L)* | deskowa / pawęż noszona |
| **pełna strefa** | `−−` najwęższa, **poniżej ćwiartki** | `+` szeroka | `++` najszersza (sufit 90°) | `+` szeroka |
| **zewnętrzna strefa** | `−` wąska | `++` bardzo szeroka | `−−` **najwęższa**, ostre odcięcie | `++` bardzo szeroka |
| **redukcja** | `+` ⭐ wysoka **jak na rozmiar** | `0` | `++` **najwyższa** | `0` ⭐ **NIE najwyższa** |
| redukcja / kg | `++` | `+` | `0` | `−−` |
| obrona (pkt) | `−−` | `0` | `+` | `++` |
| masa | `++` | `+` | `−` | `−−` |
| kara tempa | `++` | `0` | `−` | `−−` |
| stamina / blok | `+` | `0` | `+` | `−−` |
| Uderzenie tarczą | krótkie ogłuszenie, **najszybszy zamach** | ⭐ **najdłuższe ogłuszenie** | słabe | długie, ale **najwolniejszy zamach** |
| durability *(jeśli wejdzie)* | `0` | `0` | `+` | `++` |
| **zdanie gracza** | „muszę stać do niego **prosto**" | „mogę się **obracać** i on i tak dostanie" | „stoję **frontem** i nic nie przechodzi — ale tylko z frontu" | „**nic mnie nie obejdzie**, ale jestem wozem" |

### 6.1 ⚠⚠ Trzy inwersje, bez których katalog NATYCHMIAST staje się drabinką

1. ⭐ **Największy zasięg ≠ największa redukcja.** Pawęż kryje najszerzej
   i zatrzymuje **mniej na cios** niż Rycerska. **Tego nie wolno zgubić przy
   strojeniu — to jedyna rzecz trzymająca katalog.**
2. ⭐ **Rycerska ma najszerszą pełną strefę i NAJWĘŻSZĄ zewnętrzną.** Okrągła
   odwrotnie. Przy tej samej masie są **przeciwstawne**, nie lepsza/gorsza.
3. ⭐ **Puklerz ma najwyższą redukcję na kilogram i najniższą bezwzględną** —
   ten sam kształt, który projekt przyjął jako definicję wariantu dla pancerza.

### 6.2 Test niedominacji

| para | wygrywa pierwsza | wygrywa druga |
|---|---|---|
| Puklerz ↔ Rycerska | masa, tempo, redukcja/kg, szybkość bashu | pełna strefa, redukcja bezwzgl., obrona |
| **Okrągła ↔ Rycerska** | zewnętrzna strefa, masa, tempo, **ogłuszenie** | pełna strefa, redukcja, obrona, durability |
| Okrągła ↔ Pawęż | masa, tempo, stamina, redukcja/kg | obie strefy, obrona, durability |
| **Rycerska ↔ Pawęż** | **redukcja na cios**, masa, tempo, stamina | **zewnętrzna strefa**, obrona, durability |
| Puklerz ↔ Okrągła | masa, tempo, redukcja/kg | obie strefy, ogłuszenie, obrona |

⚠ Test jest strukturalny (na osiach), nie na symbolach — poprzednia wersja
miała dowód **cyrkularny** i to był uzasadniony zarzut Z-9.

### 6.3 Jak to siada na tym, co JUŻ ISTNIEJE

| dzisiejszy przedmiot | staje się | zmiana |
|---|---|---|
| `buckler` | **Puklerz** | dodać `fullArcDeg` ~40 + `sideArcDeg` ~90; reszta liczb bez zmian |
| `ironbound_shield` | **Okrągła** | dodać dzisiejsze wartości globalne jako własne (60/100) — **zero zmian liczbowych** |

⭐ **Krok pierwszy kosztuje: dwa pola na dwóch istniejących przedmiotach, z czego
jeden dostaje dokładnie to, co ma dziś.** Rycerska i Pawęż są nowymi
przedmiotami dopiero w kroku drugim. Da się w to zagrać, zanim cokolwiek dojdzie.

---

## 7. Czego świadomie NIE różnicujemy (na teraz)

| rzecz | powód |
|---|---|
| **`sideMul` per tarcza** | zakaz procesowy w configu: *„Nie strój tej liczby, zanim ktoś w to nie zagra"*. Zostaje **globalna 0,50**; kształt strefy bocznej niosą **kąty**, nie siła kary |
| **`staminaCost` jako oś tożsamości** | §2.6 — 5–17% puli, odrabiane w kilka sekund |
| **`armorType` jako wyróżnik** | §2.2 — +2,9 pp w pełnym pancerzu |
| **kąt jako pokrętło** | §3.1 — wartości trafiają w progi 45/90/135 albo są niewidzialne |

---

## 8. Dziury w kodzie znalezione przy okazji (nie naprawione)

| # | rzecz | waga |
|---|---|---|
| 1 | ⭐⭐ **`shieldBash` nie czyta tarczy.** `stunMs: 700`, `windupMs: 180`, `damageMultiplier: 0.5` są globalne — **puklerz i pawęż ogłuszają identycznie**. To trzeci składnik wartości tarczy (OI-25), dziś całkowicie płaski. ⚠ `700` jest skalibrowane na „dokładnie jeden darmowy cios każdą z dziewięciu broni, margines 90 ms" — różnicowanie przestawia ten rachunek | wysoka |
| 2 | ⚠ **Zniszczona tarcza blokuje dziś w pełni.** `EQUIPMENT.durability.destroyedMultiplier` tnie `instanceDefense`, ale `blockSpec` go **nie czyta**. Dziś bez skutku (tarcze nie mają `durability`), ale staje się błędem w chwili dodania pola | średnia |
| 3 | ⚠ **Koszt staminy bloku jest niewidoczny.** `ItemTooltip` pokazuje tylko `reduction` i karę tempa | średnia |
| 4 | ⚠ **Pas boczny jest niewidoczny** (OI-26). Napis „Blok", tint i dźwięk są **identyczne** dla strefy pełnej i bocznej; brak popupu obrażeń w kierunku wróg→gracz | średnia |
| 5 | ⚠ **Tarcze nie mają tagu `set`** — nie mogą należeć do kompletu (wiąże się z OI-94, premie są puste) | niska |
| 6 | ⚠ **Tarcza nie ma `layer`.** Przy wdrażaniu OI-98 `ArmorLayers` wyprowadziłby warstwę z materiału (puklerz→L2, okuta→L3), co jest bez sensu — `offhand` trzeba jawnie wykluczyć z warstw | niska, ale cicha |
| 7 | ⚠ **`2H + tarcza` jest osiągalnym, tolerowanym stanem** po wczytaniu zapisu przy pełnym plecaku (`normalizeHands` nie odbiera przedmiotu). W tym stanie `blockSpec` działa i Uderzenie tarczą jest dostępne z bronią dwuręczną. **Świadomie przyjęte** — ale to jedyna droga do konfiguracji, którą `docs/odlozone.md` wymienia jako pożądany przyszły węzeł | notatka |
| 8 | `STAMINA.costs.blockFallback = 4` nie ma dziś konsumenta (obie tarcze deklarują własny koszt) | kosmetyka |
| 9 | `guardZone` liczona dwa razy, gdy parowanie się powiedzie (`DamageResolver.ts:146` i `:149`) | kosmetyka |

⚠ **Nie znaleziono ANI JEDNEGO błędu w łańcuchu bloku.**
`node tools/combat_regresja.mjs` przechodzi 121 przypadków bez różnic, w tym
grupy §L i §X1–§X5.

---

## 9. ⛔ SZEŚĆ DECYZJI DO PODJĘCIA — punkt startu następnej sesji

| # | pytanie | co blokuje | moja rekomendacja |
|---|---|---|---|
| **T-1** | **Czy geometria (`fullArcDeg`/`sideArcDeg`) przechodzi na przedmiot?** Wymaga **przepisania N-22** (§4) | **cały katalog** | tak — uzasadnienie N-22 opiera się na niezaplanowanej funkcji |
| **T-2** | **Czy sufit `fullArcDeg` = 90° zostaje?** (wspólny z parowaniem i bramką ataku, §L) | jak szeroka może być najszersza tarcza | **zostaje** |
| **T-3** | Asercja §X1 (`pełna ≤ zewnętrzna`) staje się **per przedmiot**, nie na stałych | inaczej przymiar przestaje świecić na czerwono | tak — asercja, która nie potrafi zaświecić, jest dekoracją |
| **T-4** | **Czy `shieldBash` czyta tarczę?** (§8 poz. 1) | archetyp „tarcza jako broń"; jedyna **w pełni odczuwalna** oś | tak, ale przeliczyć próg „jednego darmowego ciosu" |
| **T-5** | **`durability` tarcz** — pole tak; zużycie przy bloku? I zamknięcie dziury §8 poz. 2 | oś wytrzymałości, naprawa jako koszt | pole tak; zużycie do decyzji |
| **T-6** | **Sufit łącznej mitygacji** (OI-24). Dziś 77% w stali+okutej Q3 | Pawęż go podniesie | wymaga liczby, której w grze nigdzie nie ma |

⚠ **T-1, T-2, T-3 to minimum, żeby zacząć implementację bez ryzyka
przerabiania.** T-4, T-5, T-6 mogą dojść później bez przebudowy.

⚠ **T-1…T-6 NIE są jeszcze numerami `OI`.** Promocja do `docs/zadania.md`
wymaga decyzji autora — `zadania.md` jest jedyną kanoniczną listą i nie
dopisujemy do niej pozycji bez rozstrzygnięcia.

---

## 10. ⚠ Rachunek, który trzeba przyjąć świadomie

**Każda nowa tarcza pogłębia OI-25 i uruchamia N-29** (*„każdy dobry przedmiot
do drugiej ręki jest cichym osłabieniem broni dwuręcznej"*). Cztery konstrukcje
to cztery razy.

Rekomendacja kolejności, sformułowana w audycie i **świadomie tu powtórzona**:
**2H i DW dostają swoje mechaniki przed rozbudową tarcz.** `hands: 2` nie niesie
dziś żadnego bonusu — jedyną strukturalną własnością broni dwuręcznej jest
blokada slotu, czyli **sam koszt**. Haki istnieją i są opisane
w `docs/archetypy_walki.md` §6.2 (odporność podczas zamachu — warunek na
istniejącej gałęzi `impactTier === "heavy"`) i §7.2 (`ActionOnHit` dla
autoataku).

---

## 11. Gdzie szukać reszty

| pytanie | dokument |
|---|---|
| **jak blok działa DZIŚ** | `docs/systemy/shields.md` (`STAN`) |
| rejestr 28 decyzji z mocą, rozstrzygnięcie OI-9 | `docs/proces/ekstrakcja_shields.md` |
| trójkąt 1H+tarcza / 2H / DW, §5.1 i §5.2 o specjalizacji tarczy | `docs/archetypy_walki.md` |
| precedens taksonomii (reguła wariantu, „wariant nie szczebel") | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |
| model obciążenia — trzy warianty, **żaden niewybrany** | `docs/audyt_obciazenia_i_warstw_2026-09-14.md` (OI-103) |
| dlaczego koszt tarczy NIE ma być naprawiany nerfem | `docs/odlozone.md`, poz. „Shield opportunity cost" |
| punkty obrony, materiał, krzywa | `docs/systemy/armor.md` |
| liczby Uderzenia tarczą | `docs/systemy/abilities.md` |

**Narzędzia do powtórzenia pomiarów:**

```bash
node tools/combat_benchmark.mjs
node tools/combat_regresja.mjs
node tools/doc_check.mjs
```

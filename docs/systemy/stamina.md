---
typ: STAN
domena: stamina
tytul: Stamina — zasób wysiłku
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-10-11, przymiar:doc_check, przymiar:stamina_weryfikacja, przymiar:obciazenie_przymiar]
kotwice:
  - src/core/Stamina.ts
  - src/core/ArmorTraining.ts
  - GameConfig.ARMOR_TRAINING
  - src/core/Progression.ts
  - GameConfig.STAMINA
  - GameConfig.EQUIPMENT_LOAD
  - GameConfig.DEFENSE
otwarte: [OI-16, OI-18, OI-19]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Stamina — zasób wysiłku

> **Czym jest ten dokument.** Opisem tego, **co robi dziś kod**: skąd bierze
> się pula, co ją zabiera, jak wraca i co się dzieje przy niskim stanie.
>
> ⚠⚠ **Cztery miejsca w tej domenie mają rozbieżność między KODEM
> a ZAMIERZONYM MODELEM i NIE zostały rozstrzygnięte** — są wymienione w
> `## Otwarte` i opisane w `docs/proces/ekstrakcja_stamina.md` §3.
> **Ten dokument opisuje kod; nie przesądza, że kod ma rację.**

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| pula, koszty, regeneracja, stany zmęczenia, obciążenie | **`stamina`** |
| co daje punkt Kondycji | `attributes` |
| `weight` jako pole przedmiotu | `items` |
| ile kosztuje konkretna umiejętność | `abilities` |
| redukcja wysiłku z rangi Mastery | `proficiency` |
| czy cios trafił i ile zabrał po pancerzu | `combat` |

---

## 1. Niezmiennik nadrzędny

> ⚠⚠ **`spend()` NIGDY NIE ODMAWIA.** Nie ma ścieżki „nie stać cię", nie ma
> zwracanego `false`, nie ma bramki. Zasób schodzi do zera i tam zostaje,
> a jedyną konsekwencją jest gorsza sprawność.

Dwa powody, oba nośne:

1. **To odróżnia zasób wysiłku od many.** Mana odpowiada „czy mogę", stamina
   „jak dobrze mi to wyjdzie".
2. ⚠ **To jedyna rzecz, która trzyma Kondycję jako atrybut OPCJONALNY.** Gdyby
   wyczerpanie odcinało umiejętności, w grze bez respecu **każdy** build
   musiałby w nią inwestować.

⛔ Jeżeli w `Stamina.spend` pojawi się kiedykolwiek `if (value < cost) return false`,
ten system przestaje być tym, czym miał być.

---

## 2. Pula

`STAMINA.base` + Kondycja × `STAMINA.perConditioning`, wstrzykiwana przez
`Stamina.syncMax`.

⚠ **`Stamina` nie importuje `Progression` ani `Equipment`** — pulę wstrzykuje
progresja, a mnożnik obciążenia podaje **wołający** przy wydatku. Powód jest
praktyczny: `Equipment` i `Progression` już się nawzajem importują.

⚠ **Pełna stamina po odrodzeniu**, mimo że HP wraca częściowe. Wstawanie z karą
do tempa i bez uniku byłoby karą za karę.

---

## 3. Co zabiera wysiłek

Sześć kanałów (`EffortKind`): autoatak · unik · umiejętność · sprint · blok ·
przyjęty cios.

| kanał | koszt | mnożnik obciążenia |
|---|---|---|
| **autoatak** | `STAMINA.costs.autoAttackPerSecond` × długość zamachu × (1 − redukcja Mastery) | nie |
| **unik** | `STAMINA.costs.dodge` | **tak** |
| **sprint** | **w walce** `STAMINA.costs.sprintPerSecond`, naliczany klatkami; **poza walką** `sprintOutOfCombatPerSecond` (dziś **0** — darmowy, §3.3) | **tak** |
| **umiejętność** | własny koszt umiejętności | nie |
| **blok** | koszt tarczy; `STAMINA.costs.blockFallback` gdy tarcza go nie podaje | nie |
| **przyjęty cios** | krzywa `STAMINA.heavyHit` od obrażeń **po pancerzu i po tarczy** | nie |

### 3.1 Autoatak — koszt proporcjonalny do zamachu

⭐ **To jest rdzeń całej ekonomii.** Koszt liczy się z **długości zamachu**,
nie z cooldownu i nie z ukorzenienia.

⚠ **Dlaczego akurat zamach:** stosunek `zamach/cooldown` jest **niezmiennikiem
Zręczności**, a `root/cooldown` nie jest. Koszt oparty na roocie uczyniłby
Zręczność statem wytrzymałościowym, co koliduje z jej tożsamością (recovery).

⚠ **Wysiłek liczy się z zamachu BEZ przyspieszenia z Dual Wieldu.** DW skraca
zamach i cooldown tym samym mnożnikiem, więc bez tej korekty dawał więcej
ciosów **taniej**. Reguła w jednym zdaniu: **szybciej machać wolno, machać
taniej nie.** ⛔ Nie dotyczy tarczy — tarcza zamach **spowalnia** i ma prawo
czynić go droższym.

### 3.2 Przyjęty cios — krzywa, nie próg

Zwraca zero dla draśnięć, rośnie liniowo powyżej progu, ma sufit.

⚠ **Świadomie nie binarne.** Próg binarny stał na urwisku: zmiana pancerza
o 2% przełączała kilka ciosów w jednej walce z „darmowe" na „pełny koszt".

### 3.3 Sprint — darmowy poza walką (od 2026-10-11)

⭐ **Decyzja autora z gry:** podróż nie ma męczyć. Przy 10/s w każdej sytuacji
pula 120 dawała ~17 s biegu (~4100 px, 128 kafli przy lesie szerokim na 240)
i ~30 s marszu na odnowę; trasa las → plac wsi (~8600 px) to 57 s marszem albo
47 s z biegiem — i przyjście wyczerpanym. Wycena „przebiegnięcie mapy = 155
staminy przy puli 120" pochodziła sprzed rozstawu lasu ×1,5.

**Walka** (`Player.inCombatForSprint`, okno `STAMINA.sprintCombatWindowMs`) =
wróg w pościgu (`Player.wWalce` z `GameScene`) **albo** cios przyjęty w oknie
**albo** wysiłek bojowy w oknie (każdy `EffortKind` poza `sprint` —
`Stamina.combatEffortAt`). Trzeci sygnał istnieje dla zwierzyny: trafiony lis
czy jeleń ucieka, nie goni, a dogonienie go ma kosztować.

⚠ **Przy stawce 0 bieg NIE woła `Stamina.spend`** — nie zeruje więc licznika
odpoczynku (§4) i nie wstrzymuje szybszej odnowy. Poza walką nie obowiązuje też
bramka „stamina > 0".

---

## 4. Regeneracja

> ⚠⚠ **TUTAJ JEST NIEROZSTRZYGNIĘTY KONFLIKT — patrz OI-16.**

**Co robi kod:** dwa osobne tempa, bez mnożnika. `STAMINA.regenPerSecond`
przy wysiłku, `STAMINA.regenRestedPerSecond` po `STAMINA.restedAfterMs` bez
żadnego wydatku.

⚠ **Kryterium to WYSIŁEK, nie „walka".** Manekin treningowy, wilk i sprint
w walce kosztują tak samo i tak samo zerują licznik odpoczynku. ⛔ Pojęcia
„w walce" w tej warstwie (regeneracja) nie ma i nie trzeba go dorabiać —
jedyne „w walce" w domenie należy do KOSZTU biegu (§3.3) i siedzi w `Player`.

⚠ **Skutek uboczny sprintu W WALCE:** każda klatka biegu zeruje licznik
odpoczynku, więc **bieg wstrzymuje przyspieszoną regenerację**. Zmierzone jako
ważniejsze od samej stawki kosztu — i dlatego darmowy bieg poza walką w ogóle
nie woła `spend` (§3.3).

---

## 5. Stany zmęczenia

Trzy progi (`STAMINA.tiredBelow`, `STAMINA.exhaustedBelow`), wartości
bezwzględne, nie procenty puli. Efekty w `STAMINA.states`.

⚠ **„Zmęczony" NIE rusza tempa ataku — tylko odzyskanie.** To jest decyzja
domykająca spiralę „wolniej atakuję → dłuższa walka → więcej ciosów → więcej
zmęczenia". „Wyczerpany" rusza już oba, bo tam kara ma być odczuwalna.

⚠ **Konsekwencja, którą trzeba znać:** ponieważ „Zmęczony" nie zmienia tempa,
jego jedynym nośnikiem jest mnożnik odzyskania — różnica rzędu kilkudziesięciu
milisekund na cios. **Czy ten stan jest w ogóle odczuwalny, nie zostało
zmierzone** (OI-18).

---

## 6. Obciążenie — MODEL D, dwie osie

> ### ⭐⭐ Siła może kompensować względny WYSIŁEK, ale nie kompensuje bezwzględnej MASY.

To zdanie generuje całą sekcję. Obciążenie rozpada się na **trzy kanały
wiszące na DWÓCH osiach**:

| kanał | wisi na | Siła kasuje? | gdzie w kodzie |
|---|---|---|---|
| **prędkość ruchu** | `kg` — masa bezwzględna | ⛔ **NIE** | `Equipment.speedMultiplier` → `Player.speedMultiplier` |
| **regeneracja staminy** | `kg` — masa bezwzględna | ⛔ **NIE** | `Equipment.regenMultiplier` → `Stamina.tick` |
| **koszt uniku i sprintu** | `ratio = kg / udźwig` | ✅ **TAK** | `Equipment.loadMultiplier` → `Stamina.spend` |
| premia do szansy uniku | `kg` — masa bezwzględna | ⛔ **NIE** | `Progression.dodgeChance` |

**Kształt kar.** Obie osie bezwzględne mają postać `K / (K + max(0, kg − próg))`
— ten sam kształt, co krzywa redukcji `d/(d+defenseK)` w `Protection`. Oś
względna jest liniowa i **bez sufitu**:
`1 + EQUIPMENT_LOAD.effortPerRatio × max(0, ratio − effortFreeRatio)`.

⚠ **Etykiety `Lekkie` / `Średnie` / `Ciężkie` są dziś NAZWAMI dla HUD, nie
progami kary.** Kara jest ciągła na wszystkich kanałach — trzy nazwy nad
wartością ciągłą to ten sam wzorzec, co `STAMINA.states`.

⚠ **Udźwig ma malejący przyrost powyżej `EQUIPMENT_LOAD.softCapStrength`.**
Bez tego wystarczająco wysoka Siła sprowadzała dowolną masę do klasy „Lekkie".

⛔⛔ **Koszt zamachu (`STAMINA.costs.autoAttackPerSecond`) jest POZA tym
modelem — i to jest decyzja, nie przeoczenie.** Ciężki wojownik uderza tak samo
szybko od pierwszej sekundy; gorsza jest wyłącznie jego **wydolność**. To jest
cała mechanika „kilku pierwszych ciosów". **Tempo ataku nie może stać się
czwartym kanałem obciążenia.**

⭐ **Co waży: to, co postać ma NA SOBIE** — `EQUIP_SLOTS` **oraz `STOW_SLOTS`**.
Schowany zestaw broni liczy 100% swojej masy, bo leży na ciele. Zamiana
zestawów jest przez to **neutralna masowo**: `swapWeaponSet()` wymienia
zawartość par, więc suma się nie zmienia.

⛔ **Plecak, torby i ich zawartość nie ważą ani grama.** To osobna decyzja
domeny `inventory`; wynikającą z niej asymetrię (zapasowa broń w plecaku tańsza
niż w `weapon2`) przyjęto świadomie.

⚠ **Premia za lekkość skaluje się MASĄ, nie klasą** — do 2026-09-15 wisiała na
`loadMultiplier`, czyli na `ratio`, więc pełna płyta przy wysokiej Sile wpadała
do klasy „Lekkie" i **dostawała premię za lekkość**. To była inwersja, nie
kalibracja.

⚠ **Rangi treningu (`ARMOR_TRAINING`) zdejmują UŁAMEK kary danego kanału,
nigdy jej nie kasują.** Ulga wchodzi na karę, nie na mnożnik.

⚠ **Ranga III podnosi też szansę uniku — i to jest ZAAKCEPTOWANY skutek, nie
przeciek.** Premia za lekkość jest funkcją niezapłaconej kary RUCHU, więc
odzyskanie mobilności odzyskuje jej ułamek: przy 47,5 kg `×1,1125 → ×1,1594`,
czyli **+0,19 punktu procentowego** przy Zręczności 0. Rozstrzygnięcie autora
po review `OI-104` (2026-09-15): *odzyskanie mobilności ma się przekładać na
unik*. ⛔ Nie „naprawiaj" tego, licząc premię z surowej masy.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| pula z Kondycji, `syncMax` | ✅ | ✅ | `przymiar:stamina_weryfikacja` |
| `spend()` nigdy nie odmawia | ✅ | ✅ | `kod:2026-09-05` |
| autoatak — koszt z długości zamachu | ✅ | ✅ | `kod:2026-09-05` |
| korekta Dual Wieldu (bez taniejszych ciosów) | ✅ | ✅ | `przymiar:combat_regresja` |
| unik / sprint / umiejętność / blok | ✅ | ✅ | `kod:2026-09-05` |
| przyjęty cios jako krzywa | ✅ | ✅ | `kod:2026-09-05` |
| dwa tempa regeneracji | ✅ | ⚠ **konflikt** | ❌ OI-16 |
| trzy stany zmęczenia | ✅ | ✅ | `kod:2026-09-05` |
| obciążenie — trzy kanały, dwie osie | ✅ | ✅ | `przymiar:obciazenie_przymiar` |
| masa: `EQUIP_SLOTS` + `STOW_SLOTS` | ✅ | ✅ | `przymiar:obciazenie_przymiar` (K1) |
| rangi treningu `ARMOR_TRAINING` | ✅ | ✅ | `przymiar:obciazenie_przymiar` (Z5-Z6) |
| czy „Zmęczony" jest odczuwalny | ✅ | — | ❌ **nigdy nie mierzone** — OI-18 |
| kalibracja kosztów wobec tempa gry | ✅ | ⚠ | ❌ `reka` — OI-19 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-16** | ⚠⚠ **Regeneracja: trzy modele w trzech miejscach.** Kod ma dwa tempa bez mnożnika. Zamierzony model (zapis z 2026-09-02, dokument usunięty) podawał te same dwie liczby, ale dopisuje „×1,5 po odpoczynku, **bez zmian**" — a `3 × 1,5 = 4,5`, nie 4. **Nie da się z dokumentów ustalić, czy górne tempo to wartość zamierzona, czy nieprzeliczona pozostałość po mnożniku.** Wymaga decyzji autora, nie poprawki. |
| **OI-18** | **Czy stan „Zmęczony" jest odczuwalny.** Jedynym nośnikiem jest mnożnik odzyskania; zarzut „stan Zmęczony nie produkuje dodatkowego ciosu, więc jest dekoracją" postawiono i **nigdy nie rozstrzygnięto**. |
| **OI-19** | **Cała kalibracja stoi na pomiarze tempa gry, którego nie da się dziś odtworzyć.** Odstęp między walkami i czas przejścia mapy pochodzą z symulacji na starym rosterze. |

---

## Czego ten dokument nie rozstrzyga

- ⚠ **Czy parametry Modelu D są dobrze dobrane.** `speedK`, `regenK`
  i `effortPerRatio` są **wartościami STARTOWYMI do playtestu** (`OI-105`), nie
  stałymi systemu — `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` §3.
- **Czy liczby są dobrze wyważone.** Pozycje w `## Otwarte` to
  otwarte pytania projektowe, nie usterki do naprawienia w tej sesji.
- **Jak wygląda cooldown uniku** — nie był ruszany od wdrożenia i należy do `combat`.
- **Ile kosztuje konkretna umiejętność** — domena `abilities`.
- **Drugiego oddechu, adrenaliny i mechanik niskiej staminy** — nie istnieją
  i nie są zaprojektowane.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **18 decyzji z mocą**, porównanie trzech warstw stanu i pięć konfliktów | `docs/proces/ekstrakcja_stamina.md` |
| co czeka na playtest i czego nie ruszać przed nim | `docs/odlozone.md` §2 |

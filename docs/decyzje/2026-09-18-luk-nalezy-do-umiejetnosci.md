---
typ: DECYZJA
domena: [weapons, abilities, combat]
tytul: Kąt obszaru należy do UMIEJĘTNOŚCI, nie do konstrukcji broni
stan: zywy
moc: ACTIVE
data: 2026-09-18
kotwice:
  - GameConfig.ABILITIES.cleave
  - src/core/AbilitySpec.ts
  - src/core/Equipment.ts
  - src/core/Progression.ts
  - tools/combat_regresja.mjs
otwarte: [OI-113, OI-41, OI-84]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Kąt obszaru należy do UMIEJĘTNOŚCI

> **Co ta decyzja rozstrzyga.** Że zakres Szerokiego cięcia **nie zależy od
> konstrukcji broni**. `melee.arcDeg` i `AttackVariant.arcMul` usunięte;
> `ABILITIES.cleave.halfArcDeg` jest jedynym łukiem w grze po stronie gracza.

---

## 1. Powód — projektowy, nie porządkowy

**Szeroki zamach da się wykonać mieczem, toporem i maczugą tak samo.** Kąt
działania umiejętności opisuje **rozmach ramienia**, a nie oręż w ręce.

⭐ **Granica jest ostra i warto ją umieć powiedzieć:**

```
   ZASIĘG  → własność BRONI    (bierze się z DŁUGOŚCI oręża)
   KĄT     → własność UMIEJĘTNOŚCI (bierze się z ruchu ciała)
```

⛔ **Nie odtwarzaj odpowiednika `arcDeg` zależnego od broni pod żadną nazwą.**
`AbilitySpec.resolveAbility` dalej pożycza `reachPx` z `melee.reach` — i to
jest cała zależność, jaka ma zostać.

⚠ **To NIE jest usunięcie „martwego pola".** Pole miało konsumenta (Szerokie
cięcie) i działało. Usunięte zostało dlatego, że **opisywało niewłaściwego
właściciela**, a nie dlatego, że nikt go nie czytał.

---

## 2. Co zniknęło, co je zastąpiło

| element | przed | po |
|---|---|---|
| `MeleeShape.arcDeg` | pole **wymagane**, 32 bronie + gołe ręce | ⛔ usunięte |
| `AttackVariant.arcMul` | 7 wariantów | ⛔ usunięte |
| `Progression.attackArcDeg` | getter `melee.arcDeg × arcMul` | ⛔ usunięty |
| `StrikeProfile.arcDeg` | pole profilu, 3 zapisy w `GameScene` | ⛔ usunięte |
| `AbilityStrikeInput` | `{ reach, arcDeg }` | `{ reach }` |
| `resolveAbility("cleave")` | `halfArcDeg: strike.arcDeg` | `halfArcDeg: c.halfArcDeg` |
| — | — | ⭐ `ABILITIES.cleave.halfArcDeg = 90` |

⭐ **Dwa z trzech zapisów w `GameScene` miały w komentarzu wprost, że nikt ich
nie czyta** — *„Bez konsumenta na ścieżce autoataku"* i *„łuk nie rozstrzyga
niczego"*. Profil ciosu niósł je przez całą ścieżkę rozstrzygnięcia.

⛔ **Zwykły autoatak nie dostał żadnej nowej geometrii.** Był i zostaje
celowany: `damageLockedTarget` pyta wyłącznie o `reach`/`minReach`.

---

## 3. ⚠⚠ Jedna liczba, której nie dało się „zachować"

`ABILITIES.cleave.halfArcDeg = 90` — **to jest DECYZJA, nie przeniesienie
stanu**, bo stanu nie było: były 32 różne liczby (22° … 104°, mediana ~58).

⭐ **90 to `FRONT_ARC_DEG`** — liczba, którą ta gra już nazywa „przodem": tym
samym kątem bramkowany jest atak (`PLAYER.attackFrontArcDeg`) i blok tarczą
(`SHIELD.blockArcDeg`). Umiejętność *„zamach na całą szerokość"* trafia
dokładnie to, co postać ma przed sobą.

⛔ **Świadomie NIE czyta tej stałej, tylko powtarza wartość.** `FRONT_ARC_DEG`
ma w komentarzu jawne ostrzeżenie *„strojąc tarczę, stroisz też bramkę
ataku"*; trzeci konsument rozciągnąłby to sprzężenie na umiejętność, czyli
strojenie tarczy zmieniałoby zasięg Szerokiego cięcia.

⏳ **Do potwierdzenia ręką na gałce — `OI-113`.** 90 poszerza klin wobec
26 z 32 dotychczasowych broni i zawęża wobec sześciu; `maxTargets: 3` i tak
ogranicza skutek. ⛔ Nie stroić z wyliczenia.

---

## 4. ⭐ Co migracja UJAWNIŁA w strażnikach

⚠⚠ **To jest najcenniejsza część tej zmiany i nie było jej w planie.** Usunięcie
łuku odsłoniło dwie luki, które istniały wcześniej — łuk je maskował.

### 4.1 `§ZB Z1` nie pytało o ROZSTRZAŁ

Natychmiast po usunięciu `arc` zapaliło się **`sword > cleaver_sword`**.

`docs/systemy/weapons.md` §5 czyni rozstrzał **osią tożsamości**, a strażnik
dominacji nigdy o niego nie pytał — porównywał `dps`, czyli średnią. Tasak
(7–17, rozstrzał 10) i miecz (9–14, rozstrzał 5) różnią się właśnie tym.

⛔ **Nie „naprawiono" tego wyjątkiem na `id`.** Do listy kanałów mocy doszedł
`rozstrzal`, czyli oś, którą dokumentacja uznaje od dawna.
⚠ **Wniosek na przyszłość:** tasak miał przewagę nad mieczem wyłącznie w łuku —
czyli w polu, które poza Szerokim cięciem nie robiło nic. Ta przewaga była
**pozorna przez cały czas**, a strażnik jej nie widział.

### 4.2 `§ZB Z3` straciło jedną z czterech osi

Bez łuku **`boar_spear ~ spear`** i **`boar_spear ~ glaive`** spadły do jednej
osi różnicy. Zastąpił go **ODRZUT** — kanał, który drzewcowe naprawdę
różnicuje: rohatyna ma 200, pozostałe trzy zero.

### 4.3 Dwa testy przestały mierzyć to, co deklarowały

- **Kotwice sekcji 2** wybierały z rosteru „najszerszą" i „najwęższą" broń po
  `melee.arcDeg`. Po usunięciu pola selektor spadłby na **fallback wpisany obok
  niego** — harness świeciłby na zielono, testując dwie liczby zamiast gry.
  ⭐ Kotwicą jest dziś `ABILITIES.cleave.halfArcDeg` i zasięgi realnych broni.
- **`§O6`** (kierunek jest ciągły) używał celu ~75° od osi: poza dawnym łukiem
  broni (55°), ale **wewnątrz** nowego łuku umiejętności (90°) — czyli
  przestawał cokolwiek rozróżniać. Punkt przeliczony na ~110°.
  ⚠ Ten punkt trzeba przeliczać przy **każdej** zmianie `halfArcDeg`.

⚠ Baseline przemrożony (`--zapisz-baseline --migracja`): **28 różnic** — 14 nazw
starych przypadków znikło, 14 nowych doszło. Zero różnic w wartościach
geometrii; zmieniły się kotwice, nie matematyka.

---

## 5. Czego migracja NIE zabrała

| | dlaczego |
|---|---|
| `AimPreview` | rysuje z `shape.halfArcDeg` — dostaje tę samą liczbę z innego źródła. ⭐ Podgląd i commit dalej dzielą jeden predykat `coversTarget` |
| `withinArc` w `HitResolver` | dalej jedyny test kąta, dalej jeden konsument |
| `§ZB Z9` (obietnica drzewcowych) | mierzy ZASIĘG, nie łuk |
| `PLAYER.swing.arcDeg` + `sweepMul` | ⛔ **inna rzecz** — animacja sprite'a 2D, nie geometria trafienia |
| `BEAR.swipe.arcDeg` | ⛔ **inna rzecz** — łuk zamachu STWORZENIA, konsument w `Bear.ts` |
| `SHIELD.fullArcDeg` / `sideArcDeg` / `blockArcDeg` | ⛔ **inna rzecz** — strefy obronne |
| Zasięg broni | ⭐ zostaje i ma zostać — wynika z długości oręża |

⛔ **Żadna inna mechanika nie straciła funkcjonalności.** Sprawdzone
przemieceniem wszystkich konsumentów przed migracją; kompilator wskazał
dokładnie trzy miejsca, które przewidywała analiza.

---

## Czego ta decyzja NIE rozstrzyga

- **`OI-113`** — czy 90 jest właściwą liczbą. Wymaga grania, nie wyliczenia.
- **Czy inne umiejętności mają dostać własną geometrię** — dziś pięć z sześciu
  używa `directionTarget` z `acquisitionHalfDeg` z `ABILITIES`, więc już ją mają.
- **`OI-41`** — metryki `N-5`. ⚠ Przykład, którym ją ilustrowano, zniknął razem
  z łukiem; sama niejednoznaczność została.
- **`OI-84`/`OI-111`** — ⚠⚠ po tej zmianie `combat.md` ma **0 bajtów** zapasu,
  a `weapons.md` **10**. Obie musiały wyciąć tyle, ile dopisały.

---
typ: STAN
domena: attributes
tytul: Atrybuty postaci
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-05, przymiar:doc_check, przymiar:atrybuty_kalibracja]
kotwice:
  - src/core/Progression.ts
  - src/core/Stamina.ts
  - GameConfig.ATTRIBUTES
  - GameConfig.DEFENSE
  - GameConfig.PROGRESSION
  - GameConfig.EQUIPMENT_LOAD
otwarte: [OI-12, OI-13, OI-14]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Atrybuty postaci

> **Czym jest ten dokument.** Odpowiedzią na pytanie **co robi punkt włożony
> w atrybut**: cztery atrybuty, ich pełne listy konsumentów, sufity i ekonomia
> punktów.
>
> **Czym NIE jest.** Nie jest historią modelu — ta ma własną warstwę (§Gdzie
> szukać powodów). Nie opisuje staminy, obciążenia ani biegłości; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| co robi punkt atrybutu, jakie są sufity, skąd biorą się punkty | **`attributes`** |
| jak działa pula wysiłku i klasy obciążenia | `stamina` |
| jak przedmiot skaluje się atrybutem (`strScale` / `dexScale` jako pole) | `items` |
| krzywa XP, poziomy, źródła doświadczenia | `progression` |
| biegłość `P`, praktyka, Mastery | `proficiency` |
| unik / parowanie / blok jako łańcuch obrony | `shields`, `combat` |

⚠ **Biegłość NIE jest atrybutem i nie kupuje się jej punktami.** Rośnie
z praktyki, per rodzina broni. To jest **oś prostopadła** — nie mieszaj obu
przy strojeniu.

---

## 1. Cztery atrybuty

```ts
type Attribute = "strength" | "vitality" | "conditioning" | "agility";
//                 Siła        Witalność    Kondycja        Zręczność
```

Wszystkie startują od **zera**. ⚠ **Rosną wyłącznie w górę — respecu nie ma
i nie jest planowany.** To jest założenie, na którym stoi cała reszta: bramka,
której gracz nie przejdzie, byłaby nieodwracalna, dlatego istnieje niezmiennik
„pełna ścieżka bez wymagań" (domena `items`).

---

## 2. Pełne listy konsumentów

**To są komplety, nie przykłady.** Każdy odczytany z `Progression.ts`
i zweryfikowany 2026-09-05.

### 2.1 Siła — trzy kanały

| kanał | jak |
|---|---|
| mnożnik obrażeń, **per broń** | `1 + SIŁ × strScale + ZRĘ × dexScale`; broń decyduje, ile oddaje za punkt |
| udźwig sprzętu | `EQUIPMENT_LOAD.base` + `EQUIPMENT_LOAD.perStrength` |
| **dostęp** do przedmiotów | `requires` przy zakładaniu — jedyny atrybut, który cokolwiek bramkuje |

⚠ **Siła NIE jest płaską premią do obrażeń.** Jest mnożnikiem, którego wielkość
ustala broń. To jest różnica projektowa, nie kosmetyczna: przy premii płaskiej
punkt Siły był wart więcej na broni szybkiej niż na wolnej.

### 2.2 Witalność — dwa kanały

| kanał | pole |
|---|---|
| maksymalne HP | `ATTRIBUTES.hpPerVitality` |
| regeneracja HP poza walką | `ATTRIBUTES.hpRegenPerVitality` |

⚠ **Niezmiennik, który łamie się bezgłośnie:**
`hpRegenPerVitality = hpPerVitality / 150`. Trzyma własność „pół paska w ~75 s
przy każdym buildzie". **Zmiana jednej z tych dwóch liczb bez drugiej psuje ją
i nic tego nie zgłosi.**

### 2.3 Kondycja — jeden kanał

Pula wysiłku: `STAMINA.base` + `STAMINA.perConditioning`, wpinana przez
`Stamina.syncMax`.

⚠ **Jeden kanał to stan faktyczny, nie przeoczenie** — ale jest też powodem
otwartego pytania o parytet (OI-12).

### 2.4 Zręczność — cztery kanały

| kanał | pole | sufit |
|---|---|---|
| mnożnik obrażeń, **per broń** | `dexScale` broni | — |
| tempo ataku | `ATTRIBUTES.attackSpeedPerAgility` | `ATTRIBUTES.maxAttackSpeedBonus` |
| skrócenie **recovery** po zamachu | `ATTRIBUTES.recoveryPerAgility` | `ATTRIBUTES.maxRecoveryReduction` |
| szansa uniku | `DEFENSE.dodge.base` + `DEFENSE.dodge.perAgility` | `DEFENSE.dodge.cap` |

⚠ **Tempo i recovery to DWA osobne kanały, nie jeden.** Rozdzielenie było
celowe: bez niego szybsza postać skracała cały cykl ciosu naraz i Zręczność
robiła się jedynym sensownym atrybutem.

⚠ **Unik ma premię za lekkie obciążenie** (`DEFENSE.dodge.lightLoadBonus`) —
to jest **trzeci konsument obciążenia**, obok kosztu uniku i sprintu.

---

## 3. Czego atrybuty NIE robią

⚠⚠ **Krytyk nie zależy od żadnego atrybutu.** Szansa to `PLAYER.critChance`
+ sprzęt + broń, capowana przez `ATTRIBUTES.maxCritChance`. Siła krytyka to
baza + premia przedmiotu + premia rodziny broni.

⚠ **`ATTRIBUTES.maxCritChance` nie jest sufitem atrybutu** — jest sufitem
sprzętu i broni. Nazwa sugeruje inaczej i jest to pozostałość po modelu,
w którym krytyk pochodził ze Zręczności.

Poza tym atrybuty **nie ruszają**: parowania (`DEFENSE.parry.core` jest stałe),
bloku, biegłości, zasięgu, łuku ciosu ani odrzutu.

---

## 4. Ekonomia punktów

| rzecz | wartość |
|---|---|
| punktów za poziom | `PROGRESSION.skillPointsPerLevel` |
| sufit poziomu | `PROGRESSION.maxLevel` |
| krzywa | `PROGRESSION.baseXp`, `PROGRESSION.growth` |

⚠⚠ **JEDNA WSPÓLNA PULA.** Ten sam licznik kupuje **atrybuty, umiejętności
u trenera i rangi Mastery**. Wydanie punktu w atrybut to rezygnacja
z umiejętności i odwrotnie — i to jest jedyna waluta w grze z realnym
niedoborem.

⚠ **Teoretyczny budżet całej gry jest fikcją planistyczną.** Realna rozmowa
o balansie dotyczy pierwszych kilkunastu punktów, bo tam gracz spędza czas.
Liczby pochodne (ile przejść mapy, jaki poziom po przejściu) **należą do
domeny `progression` i są dziś nieprzeliczone** — patrz OI-13.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| cztery atrybuty, start od 0, brak respecu | ✅ | ✅ | `kod:2026-09-05` |
| Siła — trzy kanały | ✅ | ✅ | `przymiar:atrybuty_kalibracja` |
| Witalność — dwa kanały + niezmiennik /150 | ✅ | ✅ | `kod:2026-09-05` |
| Kondycja — pula staminy | ✅ | ✅ | `przymiar:stamina_weryfikacja` |
| Zręczność — cztery kanały | ✅ | ✅ | `przymiar:atrybuty_kalibracja` |
| sufity tempa / recovery / uniku | ✅ | ✅ | `kod:2026-09-05` |
| krytyk odpięty od atrybutów | ✅ | ✅ | `kod:2026-09-05` |
| wspólna pula punktów | ✅ | ✅ | `kod:2026-09-05` |
| parytet między atrybutami | ✅ *(kod działa)* | ⚠ | ❌ **brak pomiaru** — OI-12 |
| odczucie progresji atrybutów | ✅ | — | ❌ `reka` — nigdy nie mierzone |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-12** | **Czy Zręczność ma za dużo korzyści?** Cztery kanały wobec trzech Siły, dwóch Witalności i jednego Kondycji. ⚠ **Z obecnych danych NIE DA SIĘ odpowiedzieć**: jedyny istniejący pomiar parytetu zawyża ją o krytyk, którego już nie ma, i zaniża, bo jest oparty na `%HP × DPS`, więc unik i recovery w nim nie siedzą. Wymaga **nowego pomiaru**, nie opinii. |
| **OI-13** | **Liczby budżetu punktów są nieprzeliczone.** Wyliczenia „ile przejść mapy na poziom X" pochodzą ze starego rosteru; pula XP lasu została później zmierzona jako istotnie wyższa. Należy do domeny `progression`. |
| **OI-14** | **`ATTRIBUTES.maxCritChance` mieszka w bloku atrybutów, choć nie dotyczy atrybutu.** Nazwa i miejsce są pozostałością po poprzednim modelu. Przeniesienie jest zmianą w konfigu — osobna decyzja. |

---

## Czego ten dokument nie rozstrzyga

- **Czy liczby są dobrze wyważone.** Opisuje kształt, nie strojenie.
- **Krzywej XP i tego, ile punktów gracz realnie dostaje** — domena `progression`.
- **Jak działa stamina i obciążenie** — domena `stamina`.
- **Jak broń dobiera `strScale`/`dexScale`** — domena `items`, oś tożsamości w `weapons`.
- **Czy krytyk powinien wrócić do atrybutu.** To jest decyzja zamknięta
  (§Gdzie szukać powodów), nie otwarte pytanie.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego skalowanie jest per broń, a nie płaskie | `docs/atrybuty.md` §10 | ACTIVE |
| dlaczego krytyk zniknął ze Zręczności | `docs/atrybuty.md` §11.4 | REJECTED (świadomie) |
| dlaczego Kondycja rozpadła się na Witalność i Kondycję | `docs/systemy/stamina.md` | ACTIVE |
| jak wyglądał model trzech atrybutów i co go obaliło | `docs/atrybuty.md` §1–§9 | HISTORICAL |
| pakiet wysłany na zewnątrz z tabelami przed/po | `docs/atrybuty_ocena.md` | HISTORICAL |
| pełny rejestr decyzji z ich mocą | `docs/proces/ekstrakcja_attributes.md` §3 | — |

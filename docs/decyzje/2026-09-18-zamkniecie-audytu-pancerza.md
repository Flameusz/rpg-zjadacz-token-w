---
typ: DECYZJA
domena: [armor, shields, items]
tytul: Zamknięcie audytu pancerza — freeze architektury, odroczenie balansu
stan: zywy
moc: ACTIVE
data: 2026-09-18
kotwice:
  - src/core/Protection.ts
  - src/core/Equipment.ts
  - src/core/ArmorLayers.ts
  - src/core/ArmorMaterials.ts
  - src/core/Quality.ts
  - GameConfig.EQUIPMENT.defenseK
  - GameConfig.EQUIPMENT.maxDefenseReduction
  - GameConfig.ARMOR_PROFILE
  - GameConfig.EQUIPMENT_LOAD
otwarte: [OI-20, OI-21, OI-22, OI-100, OI-106, OI-120, OI-121]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Zamknięcie audytu pancerza

## Co rozstrzygnięto

**Architektura pancerza i tarcz zostaje ZAMROŻONA na poziomie modelu.**
Audyt wykonany na uruchomionych modułach gry nie znalazł ani jednego błędu
architektonicznego. Dalsze zmiany parametrów wymagają **danych z playtestu**,
nie kolejnej analizy statycznej.

⛔ **Freeze nie znaczy „zbalansowane".** Znaczy: *fundament jest dostatecznie
zweryfikowany, żeby przestać go przebudowywać bez nowych danych.*

⛔ **Ten audyt nie zmienił ANI JEDNEJ liczby mechaniki.** Nie ruszono `defense`,
`weight`, `requires`, cen, `QUALITY.modifiers`, `ARMOR_PROFILE`, `defenseK`,
`maxDefenseReduction`, reguł warstw, agregacji PP, reguł tarcz ani obciążenia.

---

## 1. Zweryfikowane fundamenty

### 1.1 Warstwy

```
L1  podkład               miękka, przy ciele        ← armorType: padded
L2  ochrona zasadnicza    giętka, zatrzymuje broń   ← armorType: leather, mail
L3  wzmocnienie           sztywna, miejscowa        ← armorType: metal
```

**Warstwa jest WYPROWADZANA z `armorType`** (`ArmorLayers.itemLayer`), nie
wybierana. Zmierzone na całym katalogu: każdy `armorType` mapuje się na
**dokładnie jedną** warstwę, bez wyjątku.

| grupa | adresy | warstwowane |
|---|---|:--:|
| `head` · `chest` · `legs` · `boots` | `<obszar>_L1/L2/L3` — **12 adresów** | ✅ |
| `gloves` · `shoulders` · `offhand` | po jednym adresie | ❌ |
| `weapon` · `amulet` · `ring1` · `ring2` | nie przyjmują `type: "armor"` | ❌ |

⭐ **`EQUIP_SLOTS` ma 19 adresów**, z czego **16 przyjmuje pancerz**.
⛔ Model jest **świadomie niejednorodny** — ręce i ramiona mają jedną warstwę
i nie mają udawać, że mają trzy.

**Legalne są wszystkie siedem kombinacji**, łącznie z `L1+L3` (luka w środku).
Jedyne ograniczenie: `accepts()` wymaga zgodności **co do warstwy**, więc kirys
jest odrzucany na `chest_L1`, a przeszywanica na `chest_L3`.

### 1.2 Agregacja — suma ADDYTYWNA

```
totalDefense = Σ instanceDefense(inst)   po EQUIP_SLOTS, dla type === "armor"
             + sumBonus("defense")       (biżuteria, poza profilem materiału)
```

⛔ **Bez mnożników pozycyjnych, bez premii „wyściółka pod płytą", bez kar za
pominiętą warstwę.** `Protection.ts` o warstwach **nie wie i nie ma wiedzieć**.
Różnica między warstwami pochodzi **wyłącznie z katalogu**.

Zweryfikowane: **28 z 28** konfiguracji (4 obszary × 7 kombinacji) — suma
składników równa `totalDefense` co do bitu. Zero podwójnego liczenia, zero
pominiętej warstwy, zero legacy fallbacku w ścieżce liczenia.

### 1.3 Protection — rzeczywista kolejność wykonania

```
ITEMS[id].defense
  × materialDefenseMul(itemMaterial(id))   gatunek: iron 0,80 · steel 1,00
  × (1 + qualityMul("defense", q))          jakość:  0,85 … 1,20
  × conditionMul(inst)                      stan:    pancerz zawsze 1 (§3)
  = instanceDefense(inst)
        ↓  suma po armorPieces()
  × ARMOR_PROFILE[armorType][damageType]    ⭐ PER SZTUKA, przed capem
  + sumBonus("defense")
  = Equipment.defenseAgainst(type)
        ↓
  min( d / (d + EQUIPMENT.defenseK) , EQUIPMENT.maxDefenseReduction )
  = Equipment.reductionAgainst(type)
```

### 1.4 Krzywa i cap

```
redukcja = d / (d + 50)          EQUIPMENT.defenseK = 50
sufit    = 0,75                  EQUIPMENT.maxDefenseReduction = 0,75
150 PP   = 75% redukcji          K·c/(1−c) = 50 · 0,75 / 0,25
```

⚠⚠ **150 PP NIE jest twardym limitem punktów ochrony.** Jest punktem, od
którego **końcową redukcję ogranicza cap**. Punkty rosną dalej i **nadal
pracują w kanałach typowanych**, w których suma po profilu nie sięgnęła capu.

---

## 2. `ARMOR_PROFILE` — potwierdzony fakt techniczny

**Profil materiału jest stosowany PRZED końcowym capem redukcji i PER SZTUKA
pancerza**, nie po zsumowaniu punktów.

⚠ To rozróżnienie jest mierzalne, nie kosmetyczne. Na maksymalnym zestawie
naiwne `suma(PP) × średni profil` myli się o **−8,38 pkt na kłutym** i
**+6,74 pkt na obuchowym** względem rzeczywistej implementacji.

⭐ **Mechanizm zachowuje różnice między typami obrażeń mimo istnienia
globalnego capu** — cap ucina wyłącznie te kanały, które faktycznie go sięgnęły.
Na maksymalnym zestawie Q3 ucięte zostaje cięte (−8,7 pp) i suma bez typu
(−3,4 pp); **kłute i obuchowe nie są cięte wcale**.

⛔ Nie oznacza to, że system jest zbalansowany — oznacza, że cap **nie zjada**
różnicowania materiałów, tylko je spłaszcza tam, gdzie punktów jest najwięcej.

---

## 3. Trwałość — stan i odroczony kierunek

### 3.1 Stan faktyczny

**Pancerz nie ma mechanicznego zużycia.** `Quality.hasDurability` czyta
`"durability" in def`; **żadna z 55 sztuk pancerza korpusowego** nie ma tego
pola, więc `conditionMul` zwraca dla nich zawsze `1`.
**Tarcze mają** (30 z 30) — zniszczona tarcza traci **50% PP i 50% udźwigu
bloku** (`EQUIPMENT.durability.destroyedMultiplier`).

### 3.2 `DEFERRED` — zużycie od PRZYJĘTYCH obrażeń

⏳ **Odroczony kierunek projektowy, świadomie NIEZAIMPLEMENTOWANY.**

Rozważany model: trwałość pancerza zużywana **proporcjonalnie do pracy, którą
pancerz faktycznie wykonał**, a nie „−1 za trafienie".

```
incoming damage → armor interaction → absorbed/handled damage → armor wear → durability
```

Zużycie mogłoby w przyszłości zależeć od: ilości obrażeń · typu obrażeń ·
konstrukcji · materiału · jakości.

⛔⛔ **Nic z tego nie zostało zaimplementowane i nie wolno tego dopisywać na
zapas**: żadnych pól `durability` na pancerzu, żadnych wzorów, żadnych wartości,
`conditionMul` nietknięte.

⚠ **Kluczowe zastrzeżenie, dla którego ten akapit w ogóle istnieje:**
przyszła trwałość **nie może być utożsamiona z liczbą trafień**. Broń już ma
zużycie per zamach (`wearChance`) i to jest inny model, z innym powodem. Celem
jest powiązanie zużycia z **rzeczywistą pracą pancerza**.

⏳ Do rozważenia **po playtestach**, nie przed.

---

## 4. Obciążenie — Model D, potwierdzony przepływ

```
equippedWeight → loadCapacity → loadRatio → loadClass → loadMultiplier
```

⚠ `loadClass` jest **etykietą HUD**, nie progiem kary. Kara jest ciągła.
⚠ `equippedWeight` liczy `EQUIP_SLOTS` **oraz `STOW_SLOTS`** (`OI-96`);
torby i plecak **nie ważą**.

**Obserwacja audytowa:** przekroczenie 150 PP **nie jest darmowe**. Zmierzone
na dwóch legalnych zestawach przy Sile 20:

| | 150 PP / 53,0 kg | 181 PP / 82,7 kg |
|---|--:|--:|
| `loadMultiplier` (wysiłek) | 1,186 | **1,568** |
| `speedMultiplier` (ruch) | 0,777 | **0,680** — podłoga |
| `regenMultiplier` (wydolność) | 0,699 | **0,579** |

⛔ **To nie jest dowód, że balans jest ukończony.** Dwa z trzech kanałów masy
osiągają podłogę w paśmie, w którym katalog już operuje, a trzeci jest
wykupywany Siłą. Kalibracja należy do playtestu (`OI-105`).

---

## 5. Pancerz a tarcza — rozdzielenie

| | **Pancerz** | **Tarcza** |
|---|---|---|
| ochrona pasywna (PP) | ✅ | ✅ — **niezależnie od kierunku** |
| warstwy L1/L2/L3 | ✅ (4 obszary) | ❌ — jeden adres `offhand` |
| `ARMOR_PROFILE` | ✅ | ✅ |
| blok aktywny + kierunek | ❌ | ✅ — `guardZone`, `block.reduction` |
| koszt staminy bloku | ❌ | ✅ |
| **trwałość** | ❌ | ✅ |

### 5.1 Hipoteza OBALONA: „drewno dominuje żelazo"

⚠⚠ **Wcześniejsza teza o systematycznej przewadze tarcz drewnianych nad
żelaznymi NIE POTWIERDZIŁA SIĘ.** Wynikała z porównania **surowych PP** bez
uwzględnienia `ARMOR_PROFILE` — a drewno to `leather`, żelazo to `metal`,
czyli dwa różne profile. Po profilu, przy tej samej konstrukcji:

| konstrukcja | | cięte | **kłute** | obuchowe |
|---|---|--:|--:|--:|
| round / regular | drewno | 7,00 | **3,15** | 5,60 |
| | żelazo | **8,96** | **7,36** | 3,20 |
| heater / regular | drewno | 9,00 | **4,05** | 7,20 |
| | żelazo | **12,32** | **10,12** | 4,40 |

**Żelazo jest 2,3–2,5× skuteczniejsze przeciw kłutemu**, ma wyższy
`block.reduction` i 1,3–1,8× większą trwałość. Drewno wygrywa tylko przeciw
obuchowi — i jest lżejsze, tańsze i bez bramki Siły.

⛔ **Z tego powodu NIE zmieniono żadnej statystyki tarczy.** Nie ma tam
problemu do naprawienia.

---

## 6. Czego NIE MA i nie będzie

Potwierdzone wyszukiwaniem po całym `src/` i `tools/` — **zero wystąpień**:

| mechanika | status |
|---|---|
| `coverage` (procentowe pokrycie ciała) | ⛔ **NIE POWSTANIE** — decyzja 2026-09-12, moc `ACTIVE` |
| hit location / trafienie w obszar | ⛔ nie istnieje, nie planowane |
| obrażenia per część ciała | ⛔ nie istnieje |
| penetracja pancerza jako osobna mechanika | ⛔ **N-9** — przewaga idzie przez typ obrażeń |

⛔ **Brak `coverage` nie jest argumentem przeciwko wariantom konstrukcyjnym.**
Ta pomyłka wracała w analizach czterokrotnie i jest tu unieważniona ponownie.

---

## 7. Co ODRZUCONO w tym audycie

| odrzucone | dlaczego |
|---|---|
| zmiana `defenseK` / capu „bo katalog je przekracza" | `OI-20` jest pytaniem o INTENCJĘ sufitu; bez niej to strzelanie do ruchomego celu |
| zmiana statystyk tarcz żelaznych | przesłanka obalona (§5.1) |
| rozdzielenie lamelki i łuski przez zmianę liczb | czeka na `OI-100` (osobny profil), nie na retusz PP |
| dodanie `durability` pancerzowi „skoro architektura gotowa" | §3.2 — model ma być od obrażeń, nie od trafień; wymaga playtestu |
| asercja „żaden pancerz nie dominuje innego" | wymagałaby rozstrzygnięcia, czy `set` i profil liczą się do dominacji — to decyzja, nie kod |
| dopisanie brakujących typów obrażeń do bestiariusza | poza zakresem; kierunek zapisany jako `OI-120` |

---

## 8. Poprawki TECHNICZNE wykonane (bez zmiany mechaniki)

| co | dlaczego |
|---|---|
| `tools/warstwy_przymiar.mjs` A1, C4: 18 → **19 adresów** | stała sprzed `shoulders` (2026-09-16); bramka była czerwona od dwóch dni — `OI-107` |
| `tools/zestawy_przymiar.mjs` A4: 10 → **11 miejsc** | ta sama przyczyna |
| `src/core/ArmorLayers.ts` komentarz: „18 pozycji" → 19 | komentarz kłamał o liczbie adresów |
| `tools/katalog_ekwipunku.mjs` — porównanie bloków po **końcu linii dokumentu** | generator wstawiał LF do pliku z CRLF, więc raportował 11 zmian przy **zerowym rozjeździe**; `doc_check` §T był przez to stale czerwony |
| `docs/systemy/armor.md` §3 — „sześć slotów" → 16 adresów | opis sprzed modelu C i sprzed `shoulders` |

⚠ **Żadna z tych poprawek nie dotknęła mechaniki ani danych przedmiotów.**
⭐ Poprawka generatora została **sprawdzona sabotażem**: po celowym zepsuciu
jednego bloku raport znów pokazuje `1 blok`, po przywróceniu `0`. Bramka
potrafi zaświecić na czerwono.

---

## 9. Co ten dokument NIE rozstrzyga

- **Żadnej liczby balansu.** Wartości profilu, PP, mas i cen są jawnie
  „do playtestu".
- **Czy sufit 0,75 jest projektowym stropem, czy bezpiecznikiem** — `OI-20`,
  decyzja autora.
- **Czy lamelka i łuska mają się rozjechać** — `OI-100`.
- **Czy 18 nieosiągalnych sztuk to zawartość, czy dług** — `OI-106`.
- **Jak ma wyglądać przyszła trwałość pancerza** — §3.2, po playtestach.
- **Czy bestiariusz ma domknąć wszystkie kanały obrażeń** — `OI-120`.

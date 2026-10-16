---
typ: DECYZJA
domena: [armor, items, combat]
tytul: Skala PP i cap — zamrożenie reguł, zakres przyszłego strojenia
stan: zywy
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/Protection.ts
  - GameConfig.EQUIPMENT.defenseK
  - GameConfig.EQUIPMENT.maxDefenseReduction
  - src/core/Equipment.ts
otwarte: [OI-24, OI-94, OI-98, OI-103]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Skala PP i cap — co zamrożone, co do zrobienia później

## 1. Co zostaje BEZ ZMIAN

⛔ **Audyt nie zmienia ani jednej reguły systemu.** Zamrożone:

| rzecz | wartość | status |
|---|---|---|
| `defenseK` | **50** | ⛔ nietknięte |
| krzywa redukcji | **`d / (d + 50)`** | ⛔ nietknięta |
| `maxDefenseReduction` | **0,75** | ⛔ nietknięty |
| wartości PP pancerza | dzisiejsze | ⛔ nietknięte |
| PP tarcz | **jeszcze nie ustalone** | ⏸ wstrzymane, nie odrzucone |

⚠⚠ **To jest rozstrzygnięcie o TRYBIE, nie tylko o liczbach.** Audyt dostarczył
liczby i na tym jego rola się kończy. ⛔ **Obserwacja liczbowa nie jest
uprawnieniem do zmiany reguły** — nawet obserwacja o nasyceniu capu.

## 2. Scope skali — co obowiązuje przy projektowaniu

1. **Q1–Q4 to realnie dostępne poziomy jakości.** Q4 = półka miejska
   (`stockQuality.armor [3,4]`), i to jest **realny sufit**, nie deklarowany.
   ⚠ `QUALITY.shopMaxLevel: 4` **nie ma konsumenta w kodzie** — jest komentarzem.
2. **Pojedyncza, obecnie dostępna warstwa może dochodzić do ~30 PP.**
   ⭐ To **ratyfikuje dzisiejszy stan, nie podnosi go**: szczyt to kirys 28.
   ⛔ Nie znaczy „każda stalowa część = 30 PP".
3. **Przyszłe poziomy mistrzowski / arcymistrzowski / arcydzieło mogą później
   wyjść do ~35 PP+** — jako pasmo projektowe, nie jako dzisiejsza liczba.
4. ⛔ **Q5–Q7 nie są używane do bieżącego balansu.** Dziś nieosiągalne
   (jedyna Q5 w grze to `stick` — żart).
5. ⚠⚠ **Limit ~30 PP dotyczy POJEDYNCZEJ WARSTWY, nie całego wyposażenia.**
   Pełny pancerz sumuje PP z wielu warstw i **ma je sumować** — to jest `D2`
   taksonomii, nie skutek uboczny.

## 3. Warstwowanie — fundament, nie plac budowy

✅ **Model C jest wdrożony (2026-09-15) i zostaje w kodzie jako fundament
przyszłego balansu.** Adres slotu niesie warstwę (`chest_L1`/`_L2`/`_L3`),
`EQUIP_SLOTS` ma 18 pozycji, trzy pętle agregujące sumują wszystkie warstwy.

⛔ **Nie rozwiązujemy teraz dalszych kwestii warstwowania, jeśli nie blokują
tarcz.** Imiennie zostaje na później:

- **`setProgressFor`** — próg zestawu „4 sztuki" może zostać spełniony przez
  jeden obszar ciała w trzech warstwach (luka `D4`). ⛔ Nie ruszamy.
- **model obciążenia** (`OI-103`) — progi 0,55/0,90 **nie są** finalnym balansem.
- **piąty materiał** (`OI-100`), **premie zestawów** (`OI-94`).

## 4. Wyniki audytu — MATERIAŁ DO STROJENIA, nie reguły

⚠⚠ **Wszystko w tej sekcji to POMIAR, nie postulat.** Liczby opisują, gdzie
system stoi dziś; żadna z nich nie jest tu zapisana jako coś do naprawienia.

**Punkt nasycenia krzywej: dokładnie 150 PP** (tam `d/(d+50)` sięga 0,75).
Powyżej każdy punkt wart **zero** — obojętne, czy z pancerza, tarczy, materiału
czy jakości.

Pełny stos 12 sztuk (najlepsza sztuka w warstwie × 4 obszary):

| jakość | bez typu | cięte | kłute | obuch |
|---|---|---|---|---|
| Q1 (wieś) | 126 → 71,6% | **186 → 75,0% ⛔** | 105 → 67,7% | 74 → 59,6% |
| Q3 (domyślna) | 148 → 74,7% | **219 → 75,0% ⛔** | 123 → 71,1% | 87 → 63,5% |
| Q4 (miasto) | **155 → 75,0% ⛔** | **230 → 75,0% ⛔** | 129 → 72,1% | 91 → 64,6% |

⭐⭐ **Sufit wiąże PER TYP OBRAŻEŃ, nie globalnie** — i na ciętym wiąże już przy
**Q1**, najniższej jakości z wiejskiej półki (+36 PP wyrzucane). Przy Q3 nadmiar
na ciętym to **~69 PP**. Obuchowe i kłute mają zapas.

⛔⛔ **To nie jest problem hipotetycznych jakości ani tarcz.** Wykluczenie Q5–Q7
niczego tu nie zmienia — sufit wiąże w całości wewnątrz obecnie dostępnego
świata, **osiągany przez sam pancerz**.

⚠ **Sprostowanie zapisane, żeby nie wróciło:** twierdzenie „przy pełnym stosie
PP tarczy nie robi NIC" było policzone **bez typu obrażeń** i przeszacowało
sprawę. Bez typu pełny stos siedzi na 74,7%, czyli **0,3 pp pod sufitem**.

Pełne tabele krzywej i pasma użytecznego: `docs/tarcze_checkpoint.md` §1.9–§1.10.

## 5. Zakres przyszłych prac

⏳ **Do wykonania później, w tej kolejności, każde jako osobna robota:**

1. **Zweryfikować rzeczywiste zachowanie capu na PEŁNYCH, LEGALNYCH zestawach
   wyposażenia.** ⚠ Tabela wyżej była liczona jako `PROJECTION` na
   „najlepsza sztuka × 4 obszary". Po modelu C stos jest **wyrażalny w kodzie**,
   więc pomiar ma iść przez prawdziwe `Equipment` i prawdziwe `defenseAgainst`,
   nie przez lustrzany wzór w skrypcie.
2. **Zmierzyć wpływ KOLEJNYCH warstw na redukcję per typ obrażeń** — ile
   realnie dokłada L3 nad L1+L2 na ciętym, kłutym i obuchowym.
3. **Dopiero potem** rozważyć cap / `defenseK` / krzywą (`OI-24`).

⛔ **Decyzja o zmianie capu, `defenseK` ani krzywej NIE ZAPADA tu i nie zapadła
nigdzie indziej.** Kto ją kiedyś podejmie, ma zacząć od punktu 1, nie od tabeli.

## 6. Czego ta decyzja NIE rozstrzyga

- ⛔ **PP tarcz** — wstrzymane; wraca po domknięciu geometrii (`P1` → `B3`).
- ⛔ **Cap, `defenseK`, krzywa** — `OI-24`.
- ⛔ **`setProgressFor`**, obciążenie (`OI-103`), piąty materiał (`OI-100`).
- ⛔ **Tożsamość sześciu konstrukcji tarcz** — nietknięta; ⛔ **PP nie jest i nie
  będzie nośnikiem tożsamości konstrukcji.**

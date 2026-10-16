---
typ: DECYZJA
domena: [armor, items, economy]
tytul: Gatunek materiału jako osobna oś — żelazo i stal
stan: zywy
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/ArmorMaterials.ts
  - GameConfig.ARMOR_MATERIAL
  - src/core/Quality.ts
  - tools/materialy_przymiar.mjs
otwarte: [OI-100, OI-103, OI-143]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Gatunek materiału — żelazo i stal jako oś progresji

## ⛔ Co ta decyzja UNIEWAŻNIA

`docs/decyzje/2026-09-12-taksonomia-pancerza.md` ma w tabeli **Odrzucone**
wiersz:

> *napierśnik „żelazny" vs „stalowy" — **ten sam wiersz `ARMOR_PROFILE`***

⚠⚠ **Tamta decyzja NIE jest edytowana ani unieważniana jako całość — jej `moc`
zostaje `ACTIVE`.** Unieważniony zostaje **wyłącznie ten jeden wiersz**, i to
nie dlatego, że zmieniliśmy zdanie, tylko dlatego, że **upadła jego przesłanka**:
odrzucenie zakładało, że materiał musi być kolejnym wierszem `ARMOR_PROFILE`.
Model M1 rozdziela **gatunek** od **profilu** — żelazo dzieli wiersz `metal`
ze stalą i nie dostaje własnego. Argument „ten sam wiersz profilu" przestał więc
opisywać propozycję, o której mówi.

⛔ **Pozostałe pozycje tamtej tabeli zostają odrzucone** — w szczególności
„kolczuga z rękawami jako osobny przedmiot", „łuska między kolczugą a stalą"
i „nitowana vs spajana" (to jest `Quality`).

---

## 1. Model

```
armorType    PROFIL  — jak konstrukcja reaguje na typy obrażeń     (poziomo, N-7)
material     GATUNEK — z jakiego metalu ją zrobiono                (pionowo)
construction FORMA   — zasięg i ilość pokrycia
quality      WYKONANIE — jak dobrze zrobiona ta sztuka             (na EGZEMPLARZU)
variant      GRUBOŚĆ/SOLIDNOŚĆ — jeszcze nie istnieje
```

⭐ **Dowód, że gatunek i profil są naprawdę prostopadłe:** kolczuga i płyta
bywają z tego samego metalu, a mają różne profile. **Żelazo jest jednocześnie
drutem (`mail`) i blachą (`metal`)** — jednym wierszem profilu nie da się tego
zapisać, bo musiałby być dwiema rzeczami naraz.

⛔ **Gatunek nigdy nie zostanie wierszem `ARMOR_PROFILE`.** `N-7` żąda od
nowego wiersza typu obrażeń, w którym ten materiał wygrywa; żelazo z definicji
nie wygrywa ze stalą w niczym. **`N-7` zostaje bez zmian.**

⚠ **Gatunek jest cechą `ItemId`, nie `ItemInstance`.** „Żelazny napierśnik"
i „stalowy napierśnik" to dwa przedmioty — inaczej nie da się ich osobno
wycenić, wystawić na półce ani wrzucić do łupu. Jakość zostaje na egzemplarzu.

## 2. Poziom zerowy: dzisiejszy katalog to STAL

⭐ **Drabinka rośnie W DÓŁ.** Wszystkie istniejące sztuki `metal` (11) i `mail`
(7) są stalą i **nie zmieniła się ani jedna ich liczba**. Żelazo dokłada
szczebel poniżej.

**Powód jest twardy, nie estetyczny:** wariant odwrotny („dziś = żelazo, stal
dochodzi powyżej") wymagałby szczytu PP **ponad** kirysem, a to łamie zamrożony
scope PP (`docs/decyzje/2026-09-15-zakres-pp-i-capu.md`: ~30 PP na pojedynczą
warstwę). Kirys zostaje szczytem katalogu (28 PP).

## 3. Liczby

```
                   defenseMul   priceMul
steel  (poziom 0)     1,00        1,00
iron                  0,80        0,60
```

### Skąd 0,80 — korytarz domknięty z dwóch stron

**SUFIT (czytelność).** Najlepsze żelazo w obiegu musi być słabsze od
najgorszej stali w obiegu, inaczej gatunek zlewa się z jakością wykonania:

```
iron Q4 < steel Q1   →   m × 1,05 < 0,85   →   m < 0,810
```

**PODŁOGA (katalog).** Żelazna szyna nie może zejść pod nogawice kolcze
(12/15 = **0,800**); żelazny napierśnik pod brygantynę (17/22 = 0,773).

**Zostaje pasmo 0,800–0,810 i `0,80` jest jego dnem.** ⚠ Margines jest cienki
z premedytacją: przy `m = 0,85` wszystkie siedem par łamie warunek czytelności
(sprawdzone — przymiar świeci wtedy siedmioma czerwonymi).

### Skąd 0,60 — i dlaczego MUSI być niższe od 0,80

⭐ **`priceMul < defenseMul` jest warunkiem, nie gustem.** Cena za punkt wychodzi
`c/m = 0,75`, więc żelazo jest wyraźnie lepszym zakupem „na złotówkę". Gdyby
`c ≥ m`, żelazo byłoby słabsze **oraz** gorsze na złotówkę — czyli pułapką, a nie
wyborem. Pilnuje tego zamek `C3`.

### Czego gatunek NIE rusza

⛔ **Masy ani `requires`.** `iron X` i `steel X` ważą tyle samo i mają tę samą
bramkę Siły. Różnica gęstości obu metali jest za mała na mechanikę, a masa jest
już osią rozmiaru konstrukcji. **Konsekwencja przyjęta świadomie: żelazo nie
obniża bariery Siły — obniża wyłącznie cenę.**
⛔ **Tabeli jakości.** `QUALITY.modifiers` bez zmian.
⛔ **`defenseK`, capu `0,75`, krzywej redukcji.**

## 4. Roster

**Siedem nowych `ItemId`** — cztery blachy i trzy kolczugi:

| `ItemId` | nazwa | bliźniak |
|---|---|---|
| `iron_helmet` | Żelazny hełm | `steel_helmet` |
| `iron_chest` | Żelazny napierśnik | `steel_chest` |
| `iron_legs` | Żelazne nagolenniki | `steel_legs` |
| `iron_boots` | Żelazne buty | `steel_boots` |
| `iron_coif` | Kaptur żelazny | `mail_coif` |
| `iron_hauberk` | Kolczuga żelazna | `mail_hauberk` |
| `iron_chausses` | Nogawice żelazne | `mail_chausses` |

⭐ **Każda deklaruje liczby KONSTRUKCJI identyczne z bliźniakiem** (PP, masa,
cena, `requires`) — różnicę robi wyłącznie `material: "iron"`. To jest cała
treść zdania *„stalowy kirys jest lepszy JAKO TEN SAM kirys"*: strojenie
konstrukcji przestraja oba gatunki naraz i nie da się ich rozjechać.

### Reguła doboru: gatunek tylko dla STANDARDU obszaru

⚠ **Materiał nie może stać się drugim sposobem kodowania rozmiaru.** Dlatego
drugi gatunek dostaje wyłącznie konstrukcja będąca standardem swojego obszaru —
a standardy są już w danych: **tag `set` ma dokładnie pięć standardów każdego
materiału**, a wszystkie skrajne punkty osi rozmiaru są bez zestawu.

**Nie dostają żelaza:** `kettle_hat`, `half_sabatons` (małe) · `cuirass`,
`cuisses` (pełne) · `brigandine` (własna rodzina) · `short_hauberk`,
`demi_chausses` (krótkie) · tarcze (domena `shields`, zamrożone konstrukcje).

⛔ **RĘCE zostają jednogatunkowe — z arytmetyki, nie z zakazu.** Rękawice kolcze
mają 5 PP przy płytowych 6, więc podłoga korytarza wypada na 5/6 = **0,833**,
czyli **powyżej sufitu czytelności 0,810**. Nie istnieje mnożnik, przy którym
żelazna rękawica płytowa jest jednocześnie czytelnie słabsza od stalowej i nie
gorsza od kolczej. Powód strukturalny: **ręce mają JEDEN adres**, więc wszystkie
materiały biją się tam wprost.

## 5. Odrzucone

| odrzucone | dlaczego |
|---|---|
| żelazo jako piąty wiersz `ARMOR_PROFILE` | `N-7` żądałby typu obrażeń, w którym żelazo wygrywa — a ono nie wygrywa w niczym. Kolizja z `OI-100` o to samo miejsce |
| gatunek zmieniający masę | różnica gęstości za mała na mechanikę; masa jest już osią rozmiaru. „Stal lżejsza" byłaby wymyśloną regułą |
| gatunek zmieniający `requires` | idzie za masą, a masa się nie zmienia |
| przypisanie gatunku istniejącym sztukom po NAZWIE (kapalin, brygantyna, tarcza okuta = żelazo) | **wszystkie 11 sztuk `metal` leży w JEDNYM paśmie 4,0–5,0 g/PP** — ekonomicznie są dziś jednym gatunkiem. Etykieta „żelazo" dla mniejszych sztuk dałaby drabinkę ODWRÓCONĄ (kapalin ma lepsze PP/kg niż hełm) |
| żelazne rękawice | korytarz pusty (§4) |
| żelazny zestaw (`set`) | tworzyłby czwarty i piąty komplet materiałowy, a od modelu C są kumulowalne — to jest `OI-143` |
| trwałość jako waluta gatunku | pancerz nie ma trwałości; 30 sztuk to osobny projekt |
| osobne liczby na żelaznych sztukach zamiast mnożnika | gatunek byłby wtedy konwencją utrzymywaną ręcznie i rozjechałby się przy pierwszym strojeniu konstrukcji |

## 6. Co zostaje otwarte

| id | rzecz |
|---|---|
| **OI-103** | model obciążenia — ⛔ **nietknięty.** Dopiero teraz da się policzyć prawdziwe loadouty, bo katalog urósł |
| **OI-143** | kumulacja zestawów — żelazny komplet czeka na to rozstrzygnięcie |
| **OI-100** | łuska jako piąty PROFIL — ⭐ **architektura gatunku jej nie blokuje**: profil i gatunek są prostopadłe, więc łuska odziedziczy drabinkę bez nowego pola |
| — | ⏳ **trwałość pancerza** jako przyszły, naturalny dom gatunku („żelazo wykrusza się szybciej") — zapisane, nie zrobione |
| — | ⏳ asymetria nazw: „Kolczuga" nie mówi, że stalowa. Łata: linia **Materiał** na karcie. Pełne wyrównanie nazw to osobna przeprowadzka contentowa |

## Moc

**ACTIVE.** ⛔ Nie otwierać bez konkretnego powodu z działającej gry.
Bramka: `node tools/materialy_przymiar.mjs` (58 zamków).

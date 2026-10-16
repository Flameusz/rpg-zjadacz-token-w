---
typ: DECYZJA
domena: [armor, items]
tytul: Warstwy są arytmetycznie równoważne; zestaw liczy się po OBSZARACH
stan: zywy
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/ItemSets.ts
  - src/core/Equipment.ts
  - src/core/ArmorLayers.ts
  - src/ui/ItemCard.ts
  - tools/zestawy_przymiar.mjs
otwarte: [OI-94, OI-103, OI-143]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Warstwy równoważne · zestaw po obszarach

Dwa rozstrzygnięcia podjęte po przeglądzie runtime'u, który nastąpił po
wdrożeniu modelu C (`8d64252`). Pierwsze mówi, **czym warstwa NIE jest**;
drugie zamyka ostatni otwarty fragment `OI-98`.

---

# A — WARSTWA NIE MA WŁASNEJ ARYTMETYKI

**Rozstrzygnięcie: `L1`, `L2` i `L3` są arytmetycznie RÓWNOWAŻNE. Punkty
ochrony przedmiotu nie zależą od jego pozycji w stosie ani od tego, co leży
nad nim i pod nim.**

```
PP(L1) + PP(L2) + PP(L3)   — suma zwykła, ta sama ścieżka co zawsze
```

⛔ **Nie wchodzi i nie wolno tego dodawać bez nowej decyzji:**

- mnożniki pozycyjne (`1,00 / 0,85 / 0,70` ani żadne inne),
- uzależnienie PP jednej warstwy od obecności drugiej,
- „premia L1 pod L3", „płyta bez podkładu", kary za pominiętą warstwę,
- jakakolwiek mechanika warstw w `src/core/Protection.ts`.

⚠ **To nie znaczy, że warstwy są bez znaczenia gameplayowego.** Znaczenie ma
pochodzić **wyłącznie** z: jakie przedmioty mieszczą się na danej warstwie ·
ich PP · ich masy · ich wymagań · ekonomii · i docelowo z poprawnego modelu
obciążenia (`OI-103`).

## A.1 Co katalog już mówi bez jednej linijki kodu

Stan katalogu 2026-09-15 (32 sztuki), najcięższy stos per warstwa, jakość
bazowa, bez typu obrażeń. Liczone przez `Equipment`, nie ręcznie:

| warstwa | rodziny | wymagania Siły | PP | masa | PP/kg |
|---|---|---|---|---|---|
| **L1** | przeszywana | **zero na wszystkich czterech** | 33 | 8,0 kg | **4,13** |
| **L2** | skóra **i** kolczuga | 0 (skóra) · 1–3 (kolczuga) | 46 | 20,0 kg | 2,30 |
| **L3** | płyta | **1–5** | 69 | 33,5 kg | 2,06 |

Z tego wychodzi tożsamość, której nie trzeba wymyślać:
**L1 = wejście bez bramki** (jedyna warstwa dla postaci o Sile 0, najtańsza
w masie i w złocie) · **L2 = warstwa WYBORU** (jedyna z dwiema konkurującymi
rodzinami) · **L3 = moc kupowana za masę i atrybut**.

## A.2 Odrzucone

| wariant | dlaczego odrzucony |
|---|---|
| **B — „L1 znaczy coś dopiero pod czymś"** | łamie `armor.md` §1.2 („stalowy napierśnik na skórzanej reszcie czyta się jako w-większości-metal **sam z siebie**"): punkty sztuki zaczęłyby zależeć od reszty kompletu. Ukryta zasada bez miejsca w UI. ⚠ Nie jest wykluczony na zawsze — jest **niewybrany teraz** |
| **C — pozycja w stosie skaluje punkty** | zmienia efektywne punkty, czyli wchodzi w `D2` (krzywa i cap), który jest ZAMROŻONY. Dubluje karę, gdy wejdzie `OI-103`. Robi z kolejności drugą oś zaraz po zamknięciu taksonomii |

## A.3 Konsekwencja, która zostaje otwarta

⚠ **Cena warstwowania jest dziś płacona kanałem, który jej nie liczy.** Powyżej
`loadRatio 0,90` nie ma progu, więc 61,5 kg i 45 kg kosztują tyle samo, a kara
siedzi w koszcie uniku — czyli obciąża build, który unika, a nie ten, który
nosi trzy warstwy. To jest `OI-101`/`OI-103` i **jest to jedyny powód, dla
którego maksymalny stos jest dziś ściśle dominujący**. Wariant A jest wyborem
świadomym: cena ma być w obciążeniu, nie w ochronie.

---

# B — ZESTAW LICZY SIĘ PO OBSZARACH: `(set, area)`

**Rozstrzygnięcie: jeden obszar ciała wnosi do danego zestawu NAJWYŻEJ JEDEN
element.**

```
head_L1 | head_L2 | head_L3   →  obszar  head
chest_L1| chest_L2| chest_L3  →  obszar  chest
legs_L1 | legs_L2 | legs_L3   →  obszar  legs
boots_L1| boots_L2| boots_L3  →  obszar  boots
gloves · offhand · amulet · ring1 · ring2  →  każdy sobą
```

⚠ **Dwa pierścienie zostają DWOMA elementami** — `ring1` i `ring2` to dwa
osobne miejsca, nie jedno „miejsce na palcach".

⛔ **Liczenie zestawu NIE CZYTA `layer`.** Klucz grupujący bierze się z adresu
wyposażenia, nie z warstwy przedmiotu — `D4` (`set` ⊥ `layer`) zostaje
nienaruszone i **żadna reguła wiążąca zestaw z warstwą nie powstaje**.

## B.1 Mianownik

`setSize(id)` przestaje znaczyć „ilu członków ma zestaw" i znaczy **„ile
elementów da się z niego zdobyć"** — liczbę odrębnych miejsc, jakie jego
członkowie mogą zająć. Bez tego pasek pokazywałby nieosiągalne `4/6` w dniu,
w którym zestaw dostanie dwóch członków w jednym obszarze.

## B.2 Dlaczego akurat ta reguła

- **Nie czyta `layer`** → zgodna z `D4`, w odróżnieniu od każdej reguły typu
  „licz tylko jedną warstwę".
- ⭐ **Na dzisiejszym katalogu jest ZEROWA.** Cztery zestawy mają po pięciu
  członków w pięciu **różnych** obszarach, więc liczby się nie zmieniają.
  Wchodzi bez zmiany balansu, a jej przymiar potrafi zaświecić na czerwono
  dopiero przy pierwszym zestawie pionowym — czyli dokładnie wtedy, kiedy ma.
- **Odpowiada na pytanie, na które reguła „po sztukach" poprawnej odpowiedzi
  nie ma**: który z trzech elementów w torsie się liczy. Żaden z osobna —
  liczy się obszar.

## B.3 Cena

Zestaw **pionowy** (nagroda za pełny stos na jednym obszarze) przestaje być
wyrażalny jako zwykły zestaw. Jeśli kiedyś będzie potrzebny, ma być osobną
mechaniką z własną nazwą, a nie zestawem udającym coś innego.

## B.4 Przypadki

Tors: przeszywanica (L1, Warstwy Lnu) · kolczuga (L2, Splot Pierścieni) ·
napierśnik (L3, Kuta Stal).

| stan | po sztukach (przed) | po obszarach (teraz) |
|---|---|---|
| jedna warstwa | Splot 1 | Splot 1 |
| dwie warstwy | Lnu 1 · Splot 1 | Lnu 1 · Splot 1 |
| trzy warstwy | Lnu 1 · Splot 1 · Stal 1 | Lnu 1 · Splot 1 · Stal 1 |
| **trzy warstwy z JEDNEGO zestawu** (pionowy) | **3** ⚠ próg „2 szt." z jednego obszaru | **1** |
| dwa jednakowe pierścienie jednego zestawu | 2 | **2** (bez zmian) |

## B.5 Jedno źródło prawdy

⚠ **Licznik zestawu był do tej pory w DWÓCH miejscach** — kanoniczne
`setProgressFor` i ręczna kopia w karcie przedmiotu. Karta czyta teraz
`Equipment.setProgress`; drugiej kopii nie ma i nie wolno jej odtwarzać.

⚠ **Wynik jest buforowany** (`Equipment.setBonusCache`, unieważniany
w `emitChanged`). Bez tego liczenie kompletów wchodzi w pętlę klatkową —
a skoro licznik ma być jeden, to i jego bufor jest jeden.

---

# Co zostaje OTWARTE

| id | rzecz |
|---|---|
| **OI-94** | treść premii zestawów — nadal `bonus: {}`, **ta decyzja ich nie dotyka** |
| **OI-143** | ⭐ **NOWY** (numer nadany 2026-09-21; do tej daty nosił kolidujacy `OI-104`) — model C sprawił, że trzy zestawy materiałowe (L1/L2/L3) mogą być **częściowo czynne jednocześnie**; `bonus: {}` to dziś maskuje |
| **OI-103** | model obciążenia — jedyne miejsce, w którym warstwowanie ma dostać swoją cenę |

⚠ **`OI-143` jest warunkiem wstępnym `OI-94`.** Pierwsza liczba wpisana
w `ITEM_SETS` przed rozstrzygnięciem kumulacji zostanie wpisana w złej skali.

---

# Moc

**ACTIVE.** A i B zamknięte. ⛔ Nie otwierać bez konkretnego powodu z działającej
gry. ⚠ Wariant B z §A.2 („L1 pod L3") jest **niewybrany**, nie zakazany na
zawsze — wraca wyłącznie jako nowa decyzja, po playteście, z własnym miejscem
w UI.

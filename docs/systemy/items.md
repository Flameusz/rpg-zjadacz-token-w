---
typ: STAN
domena: items
tytul: Przedmioty — model, jakość, trwałość
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-05, przymiar:doc_check, przymiar:katalog_ekwipunku]
kotwice:
  - src/core/Items.ts
  - src/core/Quality.ts
  - src/core/Equipment.ts
  - GameConfig.ITEMS
  - GameConfig.QUALITY
  - GameConfig.EQUIPMENT
  - GameConfig.EQUIPMENT_LOAD
  - GameConfig.ARMOR_PROFILE
otwarte: [OI-10]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-16
---

# Przedmioty — model, jakość, trwałość

> **Czym jest ten dokument.** Odpowiedzią na pytanie **czym JEST przedmiot**
> w tej grze: jakie pola może nieść, co się dzieje z konkretnym egzemplarzem,
> co przedmiot wnosi do postaci i czego nowemu przedmiotowi nie wolno.
>
> **Czym NIE jest.** Nie jest katalogiem — liczby rosteru są w
> `docs/ekwipunek_przedmioty.md` (generowanym). Nie jest opisem walki, bloku
> ani plecaka; granice w §0.

---

## 0. Granice domeny

| pytanie | domena | dokument |
|---|---|---|
| czym jest przedmiot, co niesie, jak się zużywa | **`items`** | ten plik |
| **gdzie** przedmiot leży, ile się mieści, torby | `inventory` | — |
| jak cios liczy obrażenia i kiedy trafia | `combat` | — |
| krzywa pancerza i materiał × typ obrażeń | `armor` | — |
| strefy osłony i blok kierunkowy | `shields` | — |
| ile przedmiot kosztuje w gospodarce | `economy` | — |
| tożsamość rodziny broni (`family`) | `weapons` | — |

⚠ **Ten dokument opisuje WEJŚCIA, które przedmiot wnosi do tamtych systemów,
i zatrzymuje się na ich granicy.** Powielenie tam opisu bloku albo krzywej
pancerza dałoby drugie źródło prawdy dla cudzej domeny.

---

## 1. Model danych

### 1.1 Siedem typów

Pole `type` rozstrzyga, czym przedmiot jest dla `slotForItem`, `armorPieces`
i sklepu.

| `type` | rola |
|---|---|
| `weapon` | broń w slocie `weapon`; jedyny typ z trwałością |
| `armor` | sztuka pancerza; **tarcza też jest pancerzem** (§1.4) |
| `ring` · `amulet` | biżuteria — nie chroni, dodaje statystykę pochodną (§1.5) |
| `consumable` | jedzenie i mikstury; leczy natychmiast albo w czasie |
| `material` | surowce i zioła; wyłącznie do sprzedaży, questów i gotowania |
| `container` | torby podnoszące pojemność plecaka (mechanika → domena `inventory`) |

⚠ **Typ nie jest slotem.** `slotForItem` wyprowadza slot z typu i z pola
`slot`; `ring` trafia w pierwszy wolny z dwóch, `amulet` w swój własny.

### 1.2 Pola wspólne

| pole | uwagi |
|---|---|
| `id`, `name`, `description`, `color` | obecne na **każdym** przedmiocie |
| `icon` / `iconTexture` / `tintIcon` | wycinek z `items.png`, samodzielny PNG albo plamka koloru |
| `sellPrice` | obecna na każdym przedmiocie |
| `buyPrice` | ⚠ **brak = przedmiotu nie da się kupić.** Jedyny rodzaj nagrody, którego złoto nie obejdzie — dotyczy wszystkich surowców, ziół i kilku sztuk sprzętu |
| `weight` | ⚠ **tylko broń i pancerz.** Materiały, jedzenie, biżuteria i torby **nie ważą nic** — patrz §3 |
| `requires: { strength }` | sprawdzane **wyłącznie przy zakładaniu** (§4) |

### 1.3 Broń (`type: "weapon"`)

| pole | co robi |
|---|---|
| `damageMin` / `damageMax` | baza zakresu; wszystko dalej to mnożniki |
| `strScale` / `dexScale` | **ile obrażeń ta broń oddaje za punkt Siły / Zręczności.** ⚠ Wymagane, bez wartości domyślnej — to jest oś, na której młot należy do siłacza, a sztylet do zręcznościowca |
| `attackCooldown` · `swingDurationMs` | tempo; z drugiego wynika ukorzenienie i moment trafienia |
| `swingThrustPx` | wizualne wysunięcie. ⚠ Nie jest wolnym pokrętłem — powyżej ~11 broń odrywa się od pięści w połowie zamachu |
| `durability` | pula przy jakości domyślnej (§2.2) |
| `melee` | kształt ciosu: łuk, zasięg, odrzut, opcjonalne `interrupts` i modyfikatory krytyka |
| `attacks` | 1–3 sposoby użycia. ⚠ **Typ obrażeń mieszka na WARIANCIE, nie na broni** |
| `family` | rodzina broni — nośnik cechy wspólnej. ⚠ **Nie każda broń ją ma**: broń startowa stoi celowo poza rodzinami, bo nie ma tożsamości do niesienia |
| `hands` | brak = jednoręczna. `2` oznacza **wyłącznie** to, że druga ręka zostaje pusta — zero bonusu do obrażeń, tempa, zasięgu i zero kary do bloku |

⚠ **`hands` jest własnością KONKRETNEGO PRZEDMIOTU, nie rodziny.** Młot
jednoręczny i młot dwuręczny mogą istnieć obok siebie i istnieją.

### 1.4 Pancerz (`type: "armor"`)

| pole | co robi |
|---|---|
| `slot` | `head` · `chest` · `gloves` · `shoulders` · `legs` · `boots` · `offhand` |
| `armorType` | materiał — wybiera wiersz w `ARMOR_PROFILE`. **Cztery materiały**, nie trzy |
| `defense` | **punkty, nie procenty.** Zamiana na redukcję należy do domeny `armor` |
| `block` | `{ reduction, swingMul, staminaCost }` — czyni z pancerza tarczę |
| `size` | ⚠ **etykieta bez żadnego efektu.** Jedyne przyjęte future-proofing, właśnie dlatego, że etykiety nie da się po cichu przestroić |

⚠ **Tarcza nie jest osobnym systemem — to pancerz, który dodatkowo blokuje.**
Dzięki temu za darmo działają: dobór slotu, `accepts`, jakość, trwałość
otoczenia, sklep, tooltip, przeciąganie na lalkę i sumowanie obrony.

### 1.5 Biżuteria i pola `bonus`

`bonus` niesie **statystyki pochodne, nigdy atrybuty**: maksymalne HP, szansę
na krytyka, tempo ataku, punkty obrony.

⚠ **Pierścień dający „+2 Siły" jest odrzucony i to nie jest kwestia gustu.**
`requires` sprawdza się tylko przy zakładaniu, więc taki pierścień przeniósłby
gracza ponad bramkę ciężkiej broni, po czym dałoby się go zdjąć. Bez respecu
każde wyjście z tej sytuacji jest złe.

⚠ **Bonusy wchodzą DO ŚRODKA istniejących sufitów, nie ponad nie.**

---

## 2. Egzemplarz: jakość, stan, cena

Przedmiot w grze to **konkretny egzemplarz** (`ItemInstance`), nie sama nazwa.

### 2.1 Jakość wykonania

Siedem poziomów. Domyślny to `QUALITY.defaultLevel`, sklepy produkują najwyżej
`QUALITY.shopMaxLevel` — poziomy powyżej istnieją w danych jako **rezerwa pod
nagrody z zadań i znalezisk**, nie jako martwy kod.

Strój startowy (`INVENTORY.startingWorn`: koszula, spodnie, łapcie) wchodzi
na postać w jakości **2 („Niska")** — zakładany przez plecak
(`TitleScene.grantStartingGear` → `Equipment.equipFromBag`), więc przechodzi
te same wymagania co przeciągnięcie w panelu.

`QUALITY.modifiers` rusza dokładnie pięć rzeczy: obrażenia, obronę, pulę
trwałości, tempo ataku i próg wymagania Siły. `QUALITY.priceMul` rusza cenę.

⚠ **N-3: jakość nigdy nie rusza `melee` ani `attacks`.** Wykonanie zmienia,
jak dobrze rzecz jest zrobiona, nigdy czym jest. Mistrzowski młot to nadal młot
o tym samym łuku.

⚠ **Zaokrąglenie jest JEDNO, na końcu.** `instanceDamage` i `instanceDefense`
celowo nie zaokrąglają — na małych liczbach dwa sąsiednie poziomy jakości
zlewały się w tę samą wartość na ekranie.

### 2.2 Trwałość

**Tylko broń.** Pancerz nie ma trwałości i to jest decyzja, nie brak.

Zużycie idzie przez `EQUIPMENT.durability`: rzut szansą na zamach, ubytek
o stałą wartość. ⚠ **Raz na ZAMACH, nigdy raz na trafionego wroga** — inaczej
broń o szerokim łuku zużywałaby się kilka razy szybciej na tej samej grupie.

⚠ **Broń zniszczona NIE ZNIKA.** Zostaje w slocie i działa na
`EQUIPMENT.durability.destroyedMultiplier`, jest naprawialna. Przedmiot, za
który gracz zapłacił, nie kasuje się.

Naprawa kosztuje ułamek ceny proporcjonalny do brakującej trwałości
(`EQUIPMENT.durability.repairPriceFraction`).

---

## 3. Waga — co ją niesie

`weight` niesie **wyłącznie broń i pancerz**. To nie jest przeoczenie: worek
ziół nie ma spowalniać uniku, a plecak nie jest częścią sylwetki bojowej.

⚠ **Waga i ochrona liczą się z RÓŻNYCH list** — i to jest reguła przedmiotu,
nie obciążenia. Masę bierze `EQUIP_SLOTS` **oraz `STOW_SLOTS`** (schowany
zestaw leży na ciele), a `totalDefense` i `sumBonus` — sam `EQUIP_SLOTS`.
Schowana broń więc waży, ale nie chroni i nie daje premii.

⛔ **Co masa robi dalej — cztery kanały, kształt kar, udźwig, rangi treningu —
należy do domeny `stamina` i tu się tego nie powtarza:**
`docs/systemy/stamina.md` §6.

---

## 4. Wymagania i bramkowanie

`requires` sprawdza się **tylko przy zakładaniu** i **tylko dla Siły**.

⚠ **N-1: musi istnieć pełna ścieżka bez wymagań.** Broń startowa, sztylet
i **cały komplet skóry oraz przeszywanicy** nie mają `requires` i mieć nie mogą.
Respecu nie ma, więc build czysto Zręcznościowy albo Kondycyjny musi zawsze
mieć czym walczyć i w co się ubrać. Bramka, której gracz nigdy nie przejdzie,
to nie balans — to koniec gry.

⚠ **N-2: bramkuje wyłącznie Siła, wyłącznie na sprzęcie ciężkim.**
Bramkowanie Kondycją albo Zręcznością zamieniłoby błędną inwestycję w martwą
postać.

⚠ **N-12: sprawdź WSZYSTKIE koszty, zanim pobierzesz KTÓRYKOLWIEK.**
Zakładanie sprawdza wymagania przed zdjęciem czegokolwiek z plecaka.

---

## 5. Co przedmiot wnosi do walki

Wejścia, i tylko one — co się z nimi dzieje dalej, rozdziela §0.

- **Ofensywa** — egzemplarz daje zakres obrażeń po jakości i stanie, broń
  kształt ciosu (`melee`), wariant typ obrażeń i mnożniki. Moment trafienia,
  ukorzenienie, krytyk i redukcja są już poza tą domeną.
- **Defensywa** — każda sztuka pancerza daje punkty obrony po jakości,
  `armorType` wybiera wiersz w `ARMOR_PROFILE`, tarcza dokłada `block`. Krzywa
  `EQUIPMENT.defenseK`, sufit `EQUIPMENT.maxDefenseReduction` i strefy osłony
  są już poza tą domeną.

---

## 6. Niezmienniki przedmiotu

Te, które dotyczą **czym przedmiot może być**. ⚠ Numeracja `N-n` jest globalna
i nieciągła — luki są celowe, żeby odwołania z innych dokumentów nie zgniły.

- **N-1 / N-2 / N-12** — §4.
- **N-3** — jakość nie rusza kategorii (§2.1).
- **N-4** — **wariant tylko ZAWĘŻA, nigdy nie przyznaje.** Wymuszone w typach,
  nie w dyscyplinie: obuch siekiery nie może przyznać sobie przerywania młota.
- **N-5** — rozpiętość wariantów jednej broni musi być węższa niż odległość do
  sąsiedniej kategorii. Broń stojąca na krańcu skali kieruje warianty **do środka**.
- **N-7 · N-8 · N-9** — należą do domeny `armor`, pełne brzmienie:
  `docs/systemy/armor.md` §5. ⛔ Nie przepisywać ich tutaj: kopia rozjeżdża się
  z oryginałem i nic tego nie widzi.
- **N-10** — bonusy wchodzą do środka sufitów (§1.5).
- **N-11** — przedmiot, za który gracz zapłacił, nie znika (§2.2). Nagroda nie
  wpada do pełnego plecaka: wolne miejsce sprawdza się **przed** czymkolwiek innym.
- **N-13** — **nowy slot dopiero wtedy, gdy istnieje przedmiot, który go
  wypełni.** Pusty slot i tak jest iterowany przy sumowaniu bonusów, zapisywany
  w każdym zapisie i odpytywany przy zakładaniu — cztery miejsca deklarujące
  mechanikę, której nie ma.
- **N-14** — nowe pole w zapisie dodaje się jako **opcjonalne, bez podbijania
  wersji zapisu**. Podbicie kasuje wszystkie postacie; to cena, której nie płaci
  się za nowy slot.
- **N-15** — **mechanika nie może wymagać nowej grafiki.** Jest jedna klatka
  ataku na kierunek; para mnożników zamachu i pchnięcia to jedyny sposób
  odróżnienia cięcia od pchnięcia na ekranie.

⚠ **Są dokładnie DWA resolvery obrażeń i nie wolno dodać trzeciego.** Nowy
rodzaj przedmiotu ma trafić w istniejący krok, nie dopisać własny.

⚠ **N-6 należy do domeny `combat`** — dotyczy stosowania wariantu w pipeline,
nie tego, czym przedmiot jest.

---

## 7. Checklista: nowy przedmiot

1. **Nisza.** Sprawdź siatki luk w `docs/ekwipunek_przedmioty.md` §4. Wchodząc
   w zajętą komórkę, powiedz wprost, czym się różnisz.
2. **Typ i slot.** Czy istnieje slot, który to przyjmie? (N-13)
3. **Pola obowiązkowe dla typu** — §1.3 dla broni, §1.4 dla pancerza.
   ⚠ `strScale`/`dexScale` nie mają wartości domyślnej.
4. **Waga** — broń i pancerz zawsze, reszta nigdy (§3).
5. **`requires`** — tylko Siła, tylko sprzęt ciężki, i sprawdź N-1.
6. **Cena.** Brak `buyPrice` znaczy „nie do kupienia" i jest decyzją.
7. **Przepuść generator:** `node tools/katalog_ekwipunku.mjs`. ⚠ Nie wpisuj
   liczb do katalogu ręcznie.
8. **Przepuść bramki:** `npx tsc --noEmit`, `npm run build`,
   `node tools/combat_regresja.mjs`.

---

## 9. Warstwa, gatunek i zestaw — trzy pola opcjonalne

Trzy pola, których przedmiot **nie musi** nieść, a które zmieniają jego adres,
jego punkty albo jego przynależność. Wszystkie są **addytywne**: nie wymagają
zmiany w istniejących przedmiotach ani podbicia `SAVE_VERSION` (N-14).

| pole | co rozstrzyga | reguły i odrzucone warianty |
|---|---|---|
| `layer` | **adres** — na której warstwie obszaru rzecz leży (§9.1) | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |
| `material` | **gatunek** metalu, prostopadły do profilu (§9.1a) | `docs/systemy/armor.md` §2.1 |
| `set` | **przynależność** do kompletu (§9.2) | `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` |

### 9.1 `layer` — na której warstwie pancerz leży

**Adres wyposażenia to slot + warstwa.** Obszar warstwowany ma trzy adresy,
więc `EQUIP_SLOTS` liczy je osobno, a `totalDefense`, `equippedWeight`
i `sumBonus` po prostu iterują tę listę.

⚠⚠ **Warstwa jest WYPROWADZANA, nigdy WYBIERANA.** `slotForItem`/`accepts`
liczą adres przez `itemLayer()`. Dwóch `L3` nie da się nosić **nie przez zakaz,
tylko dlatego, że to jeden adres**.

⚠ **`Equipment.head/chest/legs/boots` to READ-ONLY gettery** (`L3` → `L2` →
`L1` → `null`) — zapis idzie wyłącznie przez adres, settera nie ma. Dlatego kod
pytający „co ma na torsie" nie musi wiedzieć o warstwach.

⚠ **Warstwa jest własnością PRZEDMIOTU, a nie sytuacji ani materiału.**
`armorType` daje tylko wartość domyślną; pole `layer` wygrywa zawsze,
a domyślnej mapy **nie wolno** rozbudowywać o wyjątki — od wyjątków jest to
pole.

⚠ **Zamek `layerDeclarationProblems`** (start gry) łapie `layer` postawiony
tam, gdzie nikt go nie zapyta: nie-pancerz · slot bez warstw · wartość spoza
`L1`/`L2`/`L3`. ⛔ Zgodności z materiałem nie sprawdza i nie może.

⛔ **Nie odtwarzaj tu tabeli warstw ani równoważności arytmetycznej** — to są
rozstrzygnięcia, nie model przedmiotu; obie decyzje wskazuje tabela na
początku §9.

### 9.1a `material` — gatunek metalu

⚠ **Prostopadły do profilu**: `armorType` mówi, jak konstrukcja reaguje na typy
obrażeń, `material` — z jakiego metalu ją zrobiono (`iron`/`steel`, tylko `mail`
i `metal`). Mnożniki, ich wyprowadzenie i wpływ na cenę: `docs/systemy/armor.md`
§2.1.

### 9.2 `set` — do którego zestawu przedmiot należy

Tag na przedmiocie; definicje (nazwa, progi, premie) w `ITEM_SETS`
w `GameConfig.ts`, logika w `core/ItemSets.ts`.

⚠ **Członkostwo jest TAGIEM, nie listą w definicji zestawu.** Dzięki temu
„4 z sześciu" i „2 z pięciu" to ta sama struktura, a nowy członek to jedno pole.
Lista w definicji byłaby drugą kopią tej samej prawdy.

⚠ **Progi SUMUJĄ się, nie zastępują.** Przy czterech sztukach działa próg 2
**i** 4 — inaczej czwarta sztuka odbierałaby premię drugiej.

⚠ **Premia idzie kanałem POCHODNYM** (`maxHp` / `critChance` / `attackSpeed` /
`defense`), tym samym co pierścień — dlatego zestaw nie potrzebuje ani jednej
własnej ścieżki w `Progression`, `Player` czy HUD. ⛔ **Zestaw NIGDY nie daje
atrybutu**; obowiązuje reguła znad pierścieni (§1.5): `requires` sprawdza się
tylko przy zakładaniu.

⛔ **PREMIE SĄ CELOWO PUSTE.** Każdy próg ma `bonus: {}` i `text: "premia
nieustalona"`: silnik liczy komplety, pokazuje postęp i progi, ale nie daje ani
jednej statystyki. Powody i warunek odblokowania — `OI-94` i `OI-143`
w `docs/zadania.md`.

⛔ **Nie odtwarzaj tu reguły `(set, area)`, zachowania dwóch pierścieni, zakazu
czytania `layer` przy liczeniu ani buforowania premii** — całość w decyzji
wskazanej w tabeli na początku §9, część B.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| model danych przedmiotu (7 typów, wszystkie pola) | ✅ | ✅ | `kod:2026-09-05` |
| jakość wykonania — 7 poziomów, pięć modyfikatorów | ✅ | ✅ | `przymiar:katalog_ekwipunku` |
| trwałość, zniszczenie, naprawa | ✅ | ✅ | `kod:2026-09-05` |
| wymagania Siły przy zakładaniu | ✅ | ✅ | `kod:2026-09-05` |
| waga i klasy obciążenia | ✅ | ✅ | `przymiar:stamina_weryfikacja` |
| tarcza jako pancerz z `block` | ✅ | ✅ | `przymiar:combat_regresja` |
| biżuteria i `bonus` | ✅ | ✅ | `kod:2026-09-05` |
| warstwy jako adres (slot + warstwa) | ✅ | ✅ | `przymiar:warstwy_przymiar` |
| zestaw liczony po obszarach `(set, area)` | ✅ | ✅ | `przymiar:zestawy_przymiar` |
| torby (`container`) | ✅ | ⚠ *(opis w domenie `inventory`)* | ❌ `reka` — czeka |
| poziomy jakości 5–7 w obiegu | ❌ *(rezerwa)* | ✅ | — |
| `size` na tarczach | ❌ *(etykieta bez efektu)* | ✅ | — |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-10** | **Poziomy jakości 5–7 nie są produkowane przez nic.** Rezerwa pod nagrody, która nie ma jeszcze ani jednego wydawcy. |

⛔ **Nie przywracać tu wierszy o cudzych domenach** — `items` mówi, **czym jest
przedmiot**. Sprawy pancerza i tarcz mają swoje `STAN`-y; `OI-94` i `OI-143`
stoją w `docs/zadania.md`.

---

## Czego ten dokument nie rozstrzyga

- **Balansu żadnej liczby.** Wartości rosteru żyją w konfigu i w katalogu
  generowanym; ten plik opisuje kształt, nie strojenie.
- **Kolejności kroków w rozstrzyganiu ciosu** — domena `combat`.
- **Krzywej redukcji i macierzy materiał × typ obrażeń** — domena `armor`.
- **Stref osłony i kosztu bloku** — domena `shields`.
- **Pojemności plecaka, przeciągania i toreb jako mechaniki** — domena `inventory`.
- **Tego, czy roster jest kompletny.** Siatki luk są w katalogu generowanym.

---

## Gdzie szukać POWODÓW

| pytanie | dokument |
|---|---|
| dlaczego jakość rusza pięć rzeczy, a nie dwie | `docs/jakosc_wykonania.md` |
| dlaczego ochrona liczy się w punktach, nie w procentach | `docs/systemy/armor.md` |
| dlaczego wariant tylko zawęża | `docs/systemy/weapons.md` |
| dlaczego `hands` to jedno pole i nic więcej | `docs/systemy/weapons.md` |
| dlaczego rodzina broni jest osią, a nie etykietą | `docs/systemy/weapons.md` |
| pełna historia tych ustaleń | `docs/dziennik.md` |

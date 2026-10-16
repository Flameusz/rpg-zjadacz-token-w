---
typ: DECYZJA
domena: items
tytul: Taksonomia pancerza — trzy warstwy, konstrukcje, warianty
stan: zywy
moc: ACTIVE
data: 2026-09-12
kotwice:
  - src/core/ArmorLayers.ts
  - src/ui/EquipLayout.ts
  - GameConfig.ARMOR_PROFILE
  - GameConfig.EQUIPMENT
  - GameConfig.ITEM_SETS
otwarte: [OI-94, OI-98, OI-100, OI-101]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-12
---

# Taksonomia pancerza

## Co zostało rozstrzygnięte

**Pancerz ma cztery obszary warstwowane (głowa, tors, nogi, stopy), każdy
z dokładnie trzema warstwami L1/L2/L3, i żadnego systemu `coverage` — nigdy.**

⛔ **`coverage` NIE POWSTANIE.** Bez procentowego pokrycia ciała, bez losowania
miejsca trafienia, bez stref, bez symulacji anatomii. **To nie jest Kingdom Come.**
⛔ **Brak `coverage` nie jest argumentem przeciwko wariantom konstrukcyjnym** —
ta pomyłka pojawiła się w analizie trzy razy i jest tu unieważniona na stałe.

Głębia ma pochodzić z: konstrukcji, materiału, warstwy, masy, typów obrażeń,
wymagań, ceny i swobody łączenia.

## Semantyka warstw

```
L1  wewnętrzna / podkład          miękka, przy ciele
L2  pośrednia / ochrona zasadnicza giętka — to ona zatrzymuje broń
L3  zewnętrzna / wzmocnienie      sztywna, miejscowa
```

⚠ **Warstwa jest właściwością PRZEDMIOTU, nie sytuacji.** Przeszywanica noszona
sama jest dalej L1, z pustym L2 i L3 — nie „awansuje". To jedno zdanie usuwa
całą klasę pytań o kompatybilność.

**Kolczuga = L2.** Nie jest osobną warstwą konstrukcyjną i nie dzieli warstwy
z płytą.

Legalne są wszystkie kombinacje, łącznie z pustymi warstwami: L1 · L2 · L1+L2 ·
L2+L3 · **L1+L3** · L1+L2+L3. ⚠ L1+L3 (płyta na wyściółce bez kolczugi) jest
historycznie poprawną zbroją późnego rycerza — model musi ją dopuszczać.

## Rodziny i ich warstwy

| rodzina | warstwa | obszary |
|---|---|---|
| przeszywana | **L1** | wszystkie cztery |
| skóra utwardzana | **L2** | głowa, tors, nogi, stopy |
| kolczuga | **L2** | wszystkie cztery |
| brygantyna | **L3** | tors |
| płyta | **L3** | wszystkie cztery |
| szyna | **L3** | nogi |

⚠ **L1 jest DZIŚ tekstylna/przeszywana, ale architektura jej na tym nie
zamyka.** Nowa rodzina L1 wchodzi, gdy ma inny profil materiału **i** zachowuje
rolę „pod czymś".

## Katalog docelowy — 25 konstrukcji

**Głowa (5)** · L1: czepiec pikowany · L2: kaptur skórzany, kaptur kolczy ·
L3: hełm otwarty, hełm zamknięty

**Tors (9)** · L1: przeszywanica cienka, przeszywanica gruba · L2: kaftan
skórzany, napierśnik skórzany (utwardzany), kolczuga krótka, kolczuga długa ·
L3: brygantyna, napierśnik płytowy, kirys

**Nogi (6)** · L1: nogawice pikowane · L2: nogawice skórzane, półnogawice
kolcze, nogawice kolcze pełne · L3: ~~nagolenice szynowe~~ **nagolennice
segmentowe**, nabiodrki z nagolennikami

> ⚠ **Sama NAZWA zmieniona 2026-09-16** (decyzja autora): *nagolenice szynowe*
> → **Nagolennice segmentowe**. ⛔ Konstrukcja, warstwa (nogi L3) i rodzina
> („szyna”) bez zmian; pozycja nadal **NIE ISTNIEJE w `ITEMS`** — jest
> zaplanowana. Treść decyzji poza tą etykietą zostaje nietknięta.

**Stopy (5)** · L1: onuce · L2: buty skórzane, obuwie kolcze · L3: sabaton
częściowy, sabaton pełny

**16 istnieje, 9 do dodania.** ⚠ Asymetria (tors 9, stopy 5) jest wynikiem,
nie problemem — liczb nie wyrównujemy.

## Reguła wariantu

> Wariant konstrukcyjny jest osobnym przedmiotem, gdy tworzy **realny
> trade-off**: masa ↔ ochrona ↔ wymagania ↔ cena ↔ *co jeszcze zmieszczę*.

⚠ **Oś „rozmiar/zasięg konstrukcji" jest JEDNOWYMIAROWA** — jeden slot niesie
jedną liczbę ochrony, więc mieszczą się na niej **najwyżej dwa** przedmioty
w obrębie jednej rodziny i obszaru. To NIE jest argument z `coverage`, tylko
z wymiarowości.

⚠ **Różnica RODZINY bije różnicę rozmiaru.** Brygantyna vs płyta jest
mocniejszym wariantem niż płyta mała vs duża.

⚠ **Jakość wykonania nigdy nie jest wariantem** — od tego jest `Quality`.
⚠ **Kosmetyka nigdy nie jest wariantem.**

## Pozostałe sloty

**Ramiona** (planowany, jedna warstwa): naramienniki skórzane/kolcze/płytowe —
muszą różnić się PROFILEM, nie masą, bo konkurują jako alternatywy.
**Ręce** (jedna warstwa): zero nowych. ⚠ `padded_gloves` i `leather_gloves` mają
dziś identyczne punkty i masę — najpierw rozsunąć istniejące.
**Szyja**: ⛔ zostaje biżuterią. Obojczyk wszedłby w konflikt z amuletami —
dwa rodzaje decyzji w jednym slocie. Jeśli powstanie, jego miejsce to L3 głowy.
**Pas**: ⛔ nie jest pancerzem. Historycznie nie chronił i nie ma czym się
różnicować bez wymyślonej reguły.

---

# D1 — wymagania Siły NIE sumują się

**Rozstrzygnięcie: `requires.strength` sprawdzane per przedmiot.**

| obszar | L1 | L2 | L3 | bramka dziś | przy sumowaniu |
|---|---|---|---|---|---|
| głowa | 0 | 1 | 2 | **2** | 3 |
| tors | 0 | 3 | 4 | **4** | 7 |
| nogi | 0 | 2 | 3 | **3** | 5 |
| stopy | 0 | 1 | 2 | **2** | 3 |

**Powód:** `requires` i `weight` odpowiadają na dwa różne pytania — *„czy uniosę
TĘ sztukę"* (per przedmiot) i *„ile kosztuje mnie CAŁY zestaw"* (agregat).
Sumowanie `requires` zrobiłoby z niego drugi agregat, czyli policzyłoby tę samą
rzecz dwa razy: raz w kilogramach, raz w punktach atrybutu.

**Masa gatuje sama i mocno** — pełny stos (54,5 kg) jest w klasie CIĘŻKIE przy
każdej Sile aż do 20 (ratio 1,82 przy Sile 4; 1,21 przy 10; 0,95 przy 15).
Szukanego absurdu nie znalazłem.

# D2 — krzywa redukcji bez zmian

**Rozstrzygnięcie: `defenseK = 50`, `maxDefenseReduction = 0,75`. Nietknięte.**

| stos | masa | pkt | redukcja | efektywność |
|---|---|---|---|---|
| L1 | 8,0 | 33 | 39,8% | **4,97 pp/kg** |
| L1+L2 | 28,0 | 79 | 61,2% | **1,07 pp/kg** |
| L1+L2+L3 | 52,5 | 136 | 73,1% | **0,48 pp/kg** |
| + rękawice + tarcza | 59,5 | 150 | **75,0%** | — |

⭐ **Każda kolejna warstwa daje około połowy poprzedniej, kosztując podobnie lub
więcej.** Efektywność spada pięciokrotnie, potem dwukrotnie. Ta struktura
wyszła z liczb strojonych pod JEDNĄ warstwę i nie wymaga korekty.

**Sufit wiąże wyłącznie na CIĘTYM** (210,6 pkt → 80,8% surowo → ucięte do 75%),
czyli na jedynym typie, przeciw któremu każdy pancerz jest co najmniej
neutralny. Kłute 69,9%, obuchowe 62,7% — obie pod sufitem. Liczba bez typu to
74,0%, też pod sufitem. Sufit hamuje dokładnie ten typ, który nie ma miękkiego
celu, i nie dotyka pozostałych.

Obrażenia na cios przy pełnym stosie: wilk 8,5 → 2,6; Szary 13,0 → 3,9;
niedźwiedź 12,0 → 3,0; **szarża dzika 20,0 → 7,5** — obuch przechodzi przez
metal nawet na szczycie drabinki. Typ obrażeń zostaje czytelny.

⚠ Zapisane, nie do naprawiania: przy jakości Arcymistrzowskiej pełny stos daje
170 pkt → 77,3%, więc sufit ucina część wartości najlepszego wykonania. Dotyczy
wyłącznie szczytu drabinki.

# D3 — obciążenie ODŁOŻONE

**Progi `0,55 / 0,90` NIE są zamrażane jako finalny balans.** Przyszły
atrybut/talent Udźwig może je przestawić.

Masa ma działać **jako dane i parametr** już teraz i działa:
`Equipment.equippedWeight`, `loadCapacity`, `loadRatio`, `loadClass`,
`loadMultiplier`. Katalog może rosnąć bez czekania na model udźwigu.

⚠ **Konsekwencja implementacyjna, nie balansowa:** `equippedWeight`,
`totalDefense` i `sumBonus` iterują po `EQUIP_SLOTS`, zakładając jeden przedmiot
na slot. Po włączeniu warstw slot niesie do trzech egzemplarzy i te trzy pętle
muszą iterować warstwy.

⚠ **Zaparkowane razem z D3:** powyżej ratio 0,90 nie ma już żadnego progu, więc
0,91 i 1,82 dają dziś identyczną karę (OI-101).

# D4 — `set` ⊥ `layer`

**Rozstrzygnięcie: całkowita niezależność.** `layer` opisuje konstrukcję
i miejsce w stosie, `set` przynależność do zestawu. Zestaw może obejmować
elementy z różnych warstw. ⛔ **Nie wolno dodawać żadnego powiązania set ↔ layer.**

Kod już to spełnia: `set` jest tagiem czytanym przez `ItemSets`, `layer`
wyprowadza `ArmorLayers`, i **żadne miejsce w `src/` nie czyta ich razem**.
Liczenie zestawów idzie po wyposażonych ELEMENTACH, więc przy trzech warstwach
działa bez zmiany. Premie zostają `bonus: {}` (OI-94).

---

## Odrzucone

| odrzucone | dlaczego |
|---|---|
| kolczuga z rękawami / z kapturem jako osobne przedmioty | trzeci i czwarty punkt na jednowymiarowej osi krótka↔długa |
| koszula lniana jako L1 | nie chroni — slot do zarządzania bez decyzji |
| czepiec cienki/gruby, kaptur z barmicą, buty niskie/wysokie | obszary ubogie w masę; różnica poniżej progu |
| trzeci hełm pośredni, trzecie nagolenniki, trzecia przeszywanica | interpolacje na zajętej osi |
| nitowana vs spajana, gęsty vs rzadki splot, dobra vs miękka stal | to jest `Quality` |
| ~~napierśnik „żelazny" vs „stalowy"~~ | ~~ten sam wiersz `ARMOR_PROFILE`~~ ⚠ **WIERSZ UNIEWAŻNIONY 2026-09-15** — przesłanka upadła: gatunek materiału NIE jest wierszem profilu. Treść zostaje nietknięta (decyzja jest niezmienna); rozstrzygnięcie zastępcze: `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`. ⛔ Pozostałe wiersze tej tabeli zostają odrzucone |
| warianty regionalne bez różnicy mechanicznej | nazwa bez mechaniki |
| gorget w slocie szyi | konflikt z biżuterią |
| pas jako pancerz | nie chroni, nie ma czym się różnicować |
| nowe rękawice | dwie istniejące są dziś liczbowo nieodróżnialne |
| łuska „między kolczugą a stalą" | leżałaby wewnątrz zakresu na wszystkich trzech osiach → nigdy niczyja odpowiedź |
| sumowanie `requires` przez warstwy | dubluje agregat, którym jest masa (D1) |
| podniesienie `defenseK` | krzywa działa; nie szukamy nowej tylko dlatego, że można (D2) |

## Później — wymaga mechaniki, której nie mamy

| element | czego wymaga |
|---|---|
| łuska/lamelka jako rodzina L2 | piątej kolumny `ARMOR_PROFILE` jako **anty-kłutej i słabej na cięte**; domyka trójkąt typów, więc przestraja surowe obrażenia całej broni ciętej — decyzja domeny `combat` (OI-100)<br><br>✅ **ROZSTRZYGNIĘTE CO DO WARSTWY — 2026-09-16.** ⚠ Treść powyżej zostaje **nietknięta**: była PYTANIEM otwartym („czy te rodziny są L2”), a nie ustaleniem. Decyzja autora rozstrzygnęła je na **`L3`** i obie rodziny są już w katalogu na istniejącym profilu `metal`: **lamelka** — Czepiec lamelkowy, Pancerz lamelkowy, Nogawice lamelkowe, Naramienniki lamelkowe; **łuska** — Pancerz łuskowy, Nogawice łuskowe, Naramienniki łuskowe. ⛔ **Warstwa `L3` jest decyzją ZAMKNIĘTĄ.** ⚠ **To NIE jest ustalenie balansu** — PP, masa, cena, trwałość i bramka Siły pozostają wartościami tymczasowymi do późniejszego audytu. ⏳ **`OI-100` zostaje OTWARTE i dotyczy czego innego**: czy łuska dostanie WŁASNĄ kolumnę `ARMOR_PROFILE`. Sam `armorType` tych sztuk może więc jeszcze zostać ponownie rozpatrzony — ⛔ ale warstwa nie. |
| hełm zamknięty z realną ceną | systemu percepcji / pola widzenia |
| napierśnik kierunkowy | pola „ochrona działa tylko od przodu" |
| premia L1 pod L3 | reguły „wyściółka znaczy coś dopiero pod sztywnym" |
| druga rodzina L1 | powodu gameplayowego; architektura jest otwarta |
| warstwowanie jako MECHANIKA | jeden slot = trzy egzemplarze; dziś `layer` jest metadaną (OI-98) |

## Moc

**ACTIVE.** D1, D2 i D4 są zamknięte. D3 jest świadomie ODŁOŻONE — progi
obciążenia nie są tą decyzją zatwierdzone i nie wolno ich cytować jako
zamrożonych.

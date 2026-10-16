# `src/core/` — niezmienniki singletonów

Reguły dotyczące **wyłącznie** tego katalogu. Stan projektu, mapy, walka i
assety → `CLAUDE.md` w korzeniu. Pełne uzasadnienia i pomiary → `docs/`
(indeks: `docs/README.md`).

> ✅ **Mechanizm POTWIERDZONY 2026-08-20** (pierwszy taki plik w projekcie;
> analogiczne powstaną dla `entities/`, `ui/`, `world/`). `Read` na dowolnym
> pliku z tego katalogu wstrzykuje ten plik automatycznie — sprawdzone przez
> obserwację wstrzyknięcia, nie przez ocenę odpowiedzi modelu.
>
> ⚠ **Wyzwalają go tylko DEDYKOWANE NARZĘDZIA PLIKOWE.** Odczyt bashem
> (`cat`/`sed`/`grep`) **nie** wstrzykuje niczego — sprawdzone również na tym
> pliku. Sesja pracująca bashem przeorze cały katalog i nie zobaczy stąd ani
> jednej reguły, bez błędu i bez śladu. Szczegóły i konsekwencja dla podziału
> dokumentacji: `docs/dziennik.md`, czwarty wpis z 2026-08-20.

---

## Zasada wspólna dla wszystkich singletonów

`Progression` · `Inventory` · `Equipment` · `Quests` · `Skills` · `Buffs` ·
`Abilities` · `Gathering` · `Dialogue` · `Stamina` — moduł-singletony, bo **przeżywają
Player** przez śmierć, respawn i przejścia między mapami. `reset()` zaczyna
nową grę.

⚠ **W dev-buildzie sięgaj po nie przez `window.dev`, nigdy przez `import()`
w konsoli.** Dynamiczny import daje DRUGI graf modułów — `Equipment.equip(...)`
wpisane w konsoli mutuje kopię, której nic nie renderuje, a każdy odczyt wraca
nieaktualny. Kosztowało to realny czas debugowania dwa razy, zanim ten uchwyt
powstał.

---

## Zdarzenia: re-entrancy

⚠ **Akcja wywołana z listenera zdarzenia może wyemitować TO SAMO zdarzenie.**
Złapane na żywo 2026-08-20: `Quests.advanceStages` woła `Inventory.addItem`,
`addItem` **synchronicznie** emituje `inventoryChanged`, listener `Quests`
woła `advanceAllActive()` ponownie — **zanim** zewnętrzna klatka zdążyła
zaznaczyć etap jako wygrantowany. Efekt: niekontrolowana rekurencja,
duplikaty przedmiotów i dziesiątki przebudów UI w jednej klatce.

Zabezpieczenie: flaga `sweeping` w `QuestState.advanceAllActive`. **Każdy nowy
mechanizm, który nasłuchuje zdarzenia i sam wykonuje akcje mogące je
wyemitować, potrzebuje tego samego strażnika.**

⚠ **SPROSTOWANIE (2026-09-02): „żółte tło w oknie dialogowym" NIE było objawem
tej rekurencji.** Do tego dnia stało tu, że było — bo oba zgłoszono jednym
zdaniem i oba wychodzą z tego samego wyzwalacza (awans przy oddawaniu zadania).
Rekurencja była prawdziwa, udowodniona headless symulatorem i naprawiona
`sweeping`-iem; **to zostaje w mocy i nie jest podważane.** Ale rekurencja
przebudowywała listę opcji dialogu — nie miała jak pomalować ekranu.

Żółte tło było **zamrożonym `cameras.main.flash()`**: panel pauzuje `GameScene`
(`PanelBase.pauseGame`), a scena zapauzowana w Phaserze **dalej się RYSUJE,
tylko nie dostaje `UPDATE`** — `CameraManager.update` wisi na `SceneEvents.
UPDATE`, więc licznik efektu stoi, a pełna alfa zostaje na ekranie do
wznowienia. Naprawa (2026-09-02): `GameScene.playAccent()` — efekt
**akcentujący jest PORZUCANY**, gdy scena nie jest aktywna, a nie odkładany do
`RESUME` (odłożony akcent opisuje chwilę, która minęła, i czyta się jak nowe
zdarzenie). Pod bramką idą akcenty; **stan i przejścia portalem NIGDY** —
porzucony `fadeOut` zostawiłby czarny ekran.

⭐ **Lekcja ogólna, ważniejsza od obu tych błędów:** dwa objawy z jednego
wyzwalacza to nie jeden błąd. Naprawa pierwszego wyglądała na naprawę obu przez
sześć tygodni, bo nikt nie awansował w dialogu ponownie.

---

## `Quests.ts`

**Etapy (`QuestStage`, 2026-08-20).** Quest ma albo płaskie `objectives[]`
(starsze, ~20 sztuk), albo `stages[]`. `stagesOf()` owija ten pierwszy kształt
w jeden domyślny etap — **to jest cała historia kompatybilności wstecznej**,
nie ruszaj jej przy dodawaniu nowych pól.

- ⚠ `objectivesOf(id)` zwraca cele **BIEŻĄCEGO etapu**, nie całego questa. To
  jedna zmiana, dzięki której dziennik, `reservedCount` i `isObjectiveMet`
  stały się świadome etapów bez zmian u siebie.
- ⚠ **`id` etapu jest STRINGIEM, nigdy indeksem** — po tym samym kluczu idzie
  zapis. Przestawienie kolejności w configu nie może przestawić postępu.
- ⚠ **`stageIndex` i `grantedStages` to DWA RÓŻNE pytania**: „który etap
  śledzę" vs „który etap już wypłacił `onComplete.grant`". Dla ostatniego
  etapu pierwsze nigdy się nie zmienia, a drugie musi zadziałać dokładnie raz.
  Zlanie ich było realnym błędem (grant ostatniego etapu nigdy się nie
  odpalał).
- **Pełny plecak blokuje awans etapu i czeka na miejsce.** Nic, co quest
  wręcza, nie może zniknąć ani wypaść na ziemię — ta sama reguła
  wszystko-albo-nic, którą stosuje `complete()`.

**Dwie reguły ochrony przedmiotów, celowo różne:**
- `isQuestItem` — blokuje sprzedaż **całkowicie** (przedmiot, który dawca
  wręczył i wręczy ponownie; inaczej byłby to nieskończony kran złota).
- `reservedCount` — blokada **ilościowa**: nadwyżkę wolno sprzedać, ostatnich
  pięciu kawałków mięsa pod aktywny quest już nie. Powstała pod kieł Szarego,
  który **nie odradza się nigdy**.

⭐ **`requiresTopic` — czwarta bramka zadania** (2026-10-15): zadanie
startuje dopiero po rozmowie (`offersQuest` w temacie). `Quests` nie importuje
`Dialogue` (pętla) — odczyt „czy temat padł” wstrzykuje `Dialogue`
(`setTopicSource`); bez źródła bramka jest ZAMKNIĘTA. `waitsOnTopic` =
wszystko spełnione poza rozmową — tak pytają znacznik „!” i powitanie.

⚠ **`isUnlocked` odpowiada na „czy mogę to ZACZĄĆ", nigdy „czy mogę oddać".**
Quest już w dzienniku jest odblokowany bez względu na warunki — bez tego
dopisanie `requiresQuest` do zadania, które ktoś ma aktywne w zapisie, czyni
je **nieoddawalnym na zawsze**.

---

## `Inventory.ts` / `Equipment.ts`

- `hasRoomFor()` to **suchy odpowiednik** `addItem` (bez mutacji) — sprawdzaj
  go PRZED skonsumowaniem czegokolwiek. Pełny plecak ma odrzucić całą
  operację, nie zgubić nagrodę.
- `EQUIP_SLOTS` to **jedyna** lista slotów. Nigdy nie przepisuj jej ręcznie —
  wyprowadzaj z niej UI i zapisy.
- ⭐⭐ **GABARYT W PLECAKU: `INVENTORY.cols` to GEOMETRIA MODELU, nie układ UI**
  (2026-09-18, `docs/decyzje/2026-09-18-gabaryt-w-plecaku.md`). Cztery kolumny,
  zawsze. ⛔ **Nie przenoś tej liczby do UI i nie uzależniaj od rozdzielczości** —
  sąsiad pionowy to `i + cols`, więc zmienna liczba kolumn znaczy, że ten sam
  zapis układa się inaczej na telefonie i na zwężonym oknie (zmierzone: 4/5/6).
  - ⚠⚠ **Przedmiot leży w `slots` WYŁĄCZNIE pod KOTWICĄ**; resztę zajmowanych pól
    wyprowadza `anchorCovering`. ⛔ Żadnych znaczników ani kopii w tablicy —
    w tej reprezentacji „duch drugiej połowy" jest niewyrażalny, i o to chodzi.
    ⭐ Dlatego **format zapisu się nie zmienił**.
  - ⚠ **Pole ≠ przedmiot.** `takeAt` i `moveSlot` sprowadzają pole do kotwicy;
    UI robi to jedną metodą `PlayerPanel.bagAnchor`. ⛔ Nie rozsiewaj tej
    arytmetyki po handlerach.
  - ⚠ `canSetCapacity` i `freeSlotCount` pytają o PRZYKRYCIE, nie o `slots[i]`.
  - ⛔ **Gabaryt NIE wynika z `hands`** ani ze slotu — deklaruje go przedmiot.
    ⭐ Reguła autora (2026-10-01): **broń średnia i duża = `1×2`**, a `1×1`
    wyłącznie do ~45 cm — sztylety i toporek (2026-10-02); zgodność
    z ikoną konstrukcji (32×64) sprawdza przymiar na plikach PNG.
  - ⚠⚠ **Zamiana w lalce NIE jest jeden na jeden.** Zdjęta rzecz `1×2` nie
    zmieści się na jednym polu zwolnionym przez sztylet. `equipFromBag` pyta
    `Inventory.canFitAll` PRZED `takeAt` i odkłada listą `returningFor` w TEJ
    SAMEJ kolejności. ⛔ Nie wracaj do `if (previous) Inventory.addInstance(...)`
    bez sprawdzenia wyniku — tak do 2026-10-01 ginęły miecze i pawęże
    (`OI-124`).
  - Bramka: `node tools/gabaryt_przymiar.mjs` (§K — zamiana nie niszczy).
- ⚠ **Obciążenie liczy `EQUIP_SLOTS` + `STOW_SLOTS`** — czyli to, co postać ma
  NA SOBIE. ⛔ Plecak, dodatkowe torby i skrzynia nadal nie ważą ani grama.
- ⭐⭐ **O MIEJSCE W PLECAKU PYTA SIĘ `Inventory.hasRoomFor`, nigdy licznika
  wolnych kafli.** To jedyne miejsce, które zna GABARYT: dla rzeczy `1×2` liczy,
  ile KOTWIC da się postawić, a nie ile pól jest pustych. Plecak z ośmioma
  wolnymi polami, ale bez dwóch SĄSIADUJĄCYCH PIONOWO, **przyjmie drobiazg
  i odrzuci tarczę** (zmierzone 2026-09-19).
- ⭐⭐ **Operacja, która może się nie udać, sprawdza się PRZED mutacją.** Tak
  działa cofnięcie transakcji w sklepie (`OI-133`, ZAMKNIĘTE 2026-09-21):
  `hasRoomFor` i `canTakeBack` pytają, `addItem`/`takeBackBought` wykonują —
  albo całość, albo **nic**, plus konkretny powód dla gracza. ⛔ Nie wracaj do
  wzorca „spróbuj, potem cofaj częściowy skutek": `addItem` potrafi dodać
  CZĘŚĆ stosu, a sam rollback też bywa nieudany. Bramka:
  `tools/sklep_cofniecie.mjs` §5.
- ⚠⚠ **Obciążenie to MODEL D: trzy kanały na DWÓCH osiach** (`OI-103`/`OI-104`,
  `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`). Zasada, z której wszystko
  wynika: **Siła kompensuje względny WYSIŁEK, nie kompensuje bezwzględnej MASY.**

  | kanał | wisi na | Siła kasuje? |
  |---|---|---|
  | `Equipment.speedMultiplier` → prędkość ruchu | `kg` | ⛔ nie |
  | `Equipment.regenMultiplier` → regeneracja staminy | `kg` | ⛔ nie |
  | `Equipment.loadMultiplier` → koszt uniku i sprintu | `ratio` | ✅ tak |
  | premia w `Progression.dodgeChance` | `kg` | ⛔ nie |

  ⛔ **Piątym kanałem NIE jest tempo ataku.** Koszt zamachu zostaje poza
  modelem, żeby ciężki wojownik zachował „kilka pierwszych ciosów"; gorsza ma
  być wydolność, nie burst. ⚠ Etykiety `Lekkie`/`Średnie`/`Ciężkie` są dziś
  NAZWAMI dla HUD, nie progami kary — kara jest ciągła.
  ⚠ **`speedK`/`regenK` są parametrami STARTOWYMI do playtestu (`OI-105`)**,
  nie stałymi systemu; pilnuje ich `tools/obciazenie_przymiar.mjs`.
- ⚠ **Nowy slot ekwipunku dodaje się jako POLE OPCJONALNE w zapisie**, bez
  podbijania `SAVE_VERSION`. Tak weszły `quickSlot`, pierścienie, `offhand`,
  `gloves` i `amulet` — żadna postać nie została skasowana dla nowego slotu.
- ⚠ **Komórki manekina są martwe, dopóki nie istnieje przedmiot, który w nie
  wejdzie.** Nie okablowuj slotu „na zapas": pusty slot i tak przechodzi przez
  `sumBonus`, ląduje w każdym zapisie i odpowiada w `accepts` — cztery miejsca
  deklarujące mechanikę, której nie ma.
  - ✅ **Ta reguła została 2026-09-11 wzmocniona, nie osłabiona.** Docelowy układ
    ma sloty RAMIONA (ożywione 09-16), PAS i drugi UŻYTKOWY; pas stoi
    w `DOLL_CELLS` (`src/ui/PaperDoll.ts`, od etapu D 2026-10-13; drugi użytkowy
    nie ma tam dziś kafla — pytanie do autora) jako `planned` — **rysowany,
    przygaszony, z powodem na dotknięcie** — a NIE w unii `EquipSlot`. Ożywają jednym wpisem w unii
    w dniu, w którym powstanie pierwszy pas; UI nie wymaga wtedy zmiany, bo
    `slotHasItems()` wyprowadza „czy już są takie przedmioty" z `ITEMS`.
- ⚠ **`STOW_SLOTS` (`weapon2`/`offhand2`) stoją poza `EQUIP_SLOTS`, ale NIE
  poza obciążeniem.** Schowana broń nie chroni i nie daje premii — **waży za to
  w pełni** (`OI-96`, 2026-09-15: leży na ciele, więc się liczy). ⚠ Do 2026-09-15
  stało tu „i (dziś) nie waży"; było to opisane w kodzie jako **dług**, i ten
  dług został spłacony. **Reguła dwuręczności obowiązuje w obu zestawach** i pyta
  o zestaw TEGO slotu, nie o zestaw czynny.
- ⚠ **Wskazany slot, który ODMAWIA, kończy `equipFromBag` — nie ma zejścia na
  `slotForItem`.** To naprawa błędu znalezionego w silniku 2026-09-11:
  upuszczenie tarczy na zablokowaną drugą rękę zestawu II zakładało ją
  w zestawie CZYNNYM i zwracało `true`. Akcja „załóż tu" nie może po cichu
  znaczyć „załóż gdzie indziej".
- ⚠ **Warstwy pancerza to `L1` / `L2` / `L3`, nazwane POZYCYJNIE, nie
  materiałowo** (`core/ArmorLayers.ts`, taksonomia zatwierdzona 2026-09-12).
  L1 = podkład (`padded`), L2 = ochrona zasadnicza (`leather`, `mail`),
  L3 = wzmocnienie (`metal`). ⛔ **Kolczuga jest L2, nie dzieli warstwy
  z płytą** — do 2026-09-12 dzieliła (`metalowa`) i przez to kanoniczny stos
  „przeszywanica → kolczuga → napierśnik" był NIEWYRAŻALNY. Nazwa materiałowa
  zaprasza do pytania „czy kolczuga jest metalowa?"; pozycja w stosie nie.
  ⚠ **Od 2026-09-15 (model C) ADRES SLOTU NIESIE WARSTWĘ**: `chest_L1` /
  `chest_L2` / `chest_L3` to trzy osobne adresy w `EQUIP_SLOTS` (18, nie 10).
  ⛔ **`layer` przestał być metadaną** — ten akapit mówił do tej daty „jeden
  slot trzyma jeden przedmiot". **Warstwa jest WYPROWADZANA, nigdy wybierana**:
  `slotForItem` i `accepts` liczą adres przez `itemLayer()`, więc kirys nie
  wejdzie na `chest_L1` i nie da się nosić dwóch L3.
  ⚠ **Nazwane właściwości (`Equipment.chest`) są READ-ONLY GETTERAMI** zwracającymi
  najbardziej zewnętrzną istniejącą warstwę (L3 → L2 → L1 → `null`). Zapis idzie
  **wyłącznie przez adres** — settera nie ma i nie dodawaj go.
  ⚠ **Konsekwencja, której nie widać w żadnym nowym wierszu kodu:** trzy pętle
  po `EQUIP_SLOTS` (`totalDefense`, `equippedWeight`, `sumBonus`) sumują od tej
  daty WSZYSTKIE warstwy. Pełny stos na torsie to 55 PP i 26 kg zamiast 30/12.
  Bramka: `node tools/warstwy_przymiar.mjs`.
- ⚠ **`set` i `layer` są CAŁKOWICIE niezależne** (D4). Zestaw może obejmować
  przedmioty z różnych warstw. ⛔ Nie dodawaj żadnego powiązania między nimi —
  dziś żadne miejsce w `src/` nie czyta ich razem i tak ma zostać.
- ⚠ **`requires.strength` NIE sumuje się między warstwami** (D1). Wymaganie
  jest per przedmiot; masa całego wyposażenia jest OSOBNYM agregatem i nie
  dublujemy tej funkcji. Sumowanie `requires` policzyłoby tę samą rzecz dwa
  razy: raz w kilogramach, raz w punktach atrybutu.
- ⭐⭐ **`material` to GATUNEK, `armorType` to PROFIL — dwie prostopadłe osie**
  (`core/ArmorMaterials.ts`, decyzja 2026-09-15). Dowód, że naprawdę
  prostopadłe: **żelazo jest jednocześnie drutem (`mail`) i blachą (`metal`)**.
  ⛔ **Gatunku NIGDY nie wolno zrobić wierszem `ARMOR_PROFILE`** — `N-7`
  żądałby wtedy od żelaza typu obrażeń, w którym wygrywa, a ono nie wygrywa
  ze stalą w niczym.
  ⚠ **Poziom zerowy to STAL**: cały dotychczasowy katalog `metal` i `mail`
  bierze gatunek z mapy domyślnej, żelazo (7 sztuk) deklaruje go jawnie.
  ⚠ **Żelazna sztuka deklaruje liczby KONSTRUKCJI bliźniaka** (PP, masa, cena,
  `requires` przepisane 1:1), a obniżkę robią `materialDefenseMul` (0,80)
  i `materialPriceMul` (0,60) w `Quality.ts`. ⛔ Nie „poprawiaj" żelaza przez
  edycję jego surowych liczb — rozjedzie się z bliźniakiem przy pierwszym
  strojeniu konstrukcji (pilnuje §D przymiaru).
  ⛔ **Gatunek nie rusza masy ani `requires`** — to decyzja, nie przeoczenie.
  Bramka: `node tools/materialy_przymiar.mjs`.
- ⚠⚠ **Warstwy są arytmetycznie RÓWNOWAŻNE** (decyzja 2026-09-15). PP przedmiotu
  nie zależy od pozycji w stosie: `PP(L1) + PP(L2) + PP(L3)`, suma zwykła.
  ⛔ **Zero mnożników pozycyjnych, zero „premii L1 pod L3", zero mechaniki
  warstw w `Protection.ts`.** Różnica między warstwami siedzi w katalogu
  (co się mieści, ile PP, ile kg, jakie wymagania, jaka cena) i docelowo
  w modelu obciążenia (`OI-103`).
- ⭐⭐ **Zestawy liczą MIEJSCA: jeden obszar ciała = najwyżej jeden element**
  (`core/ItemSets.ts`, reguła `(set, area)`, 2026-09-15). Trzy warstwy torsu to
  trzy adresy, ale jedno miejsce; `ring1`/`ring2` zostają dwoma. ⛔ Do tej daty
  liczyły się SZTUKI — wtedy próg „2 szt." dawał się spełnić jednym obszarem.
  ⛔ **Liczenie NIE CZYTA `layer`** (klucz grupujący to `placeOfSlot`, czyli
  adres) — tak zostaje `D4`. `setSize` to liczba MIEJSC, nie członków.
  Bramka: `node tools/zestawy_przymiar.mjs`. Premie idą kanałem POCHODNYM (`sumBonus`), tym samym
  co pierścienie — dlatego zestawy nie wymagały zmian w `Progression` ani w HUD.
  Bufor `setBonusCache` unieważnia się w `emitChanged`; bez niego `maxHp`
  budowałoby mapę i sortowało wynik w pętli klatkowej.

---

## Broń: konstrukcja kontra rodzina (od 2026-09-16)

⚠⚠ **RODZINA to szeroka kategoria BIEGŁOŚCI, nie zestaw parametrów.** Decyduje
wyłącznie o tym, w czym gracz ćwiczy i którą rangę Mastery kupuje. **Tożsamość
KONSTRUKCJI mieszka na przedmiocie** (`ITEMS[*].melee`). ⛔ Nie rozwiązuj różnic
między konstrukcjami zakładaniem nowej rodziny — przy 100+ broniach dostaniesz
100 rodzin i zero biegłości.

⚠ **`parryBonus` ZESZŁO z rodziny `sword` na konstrukcję.** Rodzina niesie dziś
sam **znacznik** `{ kind: "parry" }` — dokładnie jak `polearm` niesie `reach` —
a liczba stoi w `melee.parryBonus`. Powód: przy jednym mieczu cecha rodziny
wyglądała poprawnie, przy sześciu oznaczałaby, że rapier nie ma jak być lepszym
parrierem od tasaka. ⭐ Znacznik jest nośny: czyta go `MasteryCard`, a
`Progression.parryChance` dalej mnoży EFEKT przez `traitMul` rangi.
⛔ Nie przywracaj wartości liczbowej do `WEAPON_FAMILY`.

⚠ **`melee.minReach` to DOLNA granica zasięgu**, opcjonalna; brak = `0` =
zachowanie sprzed jej wprowadzenia. Mierzy się tym samym prześwitem co `reach`
(`HitResolver.withinReach`) i skaluje tym samym `reachMul` wariantu.
⛔ **Własność KONSTRUKCJI, nigdy rodziny** (włócznia jej nie ma, pika ma).
⚠⚠ **Dolna granica należy do POSTACI, nie do ręki** — `offhandStrike` bierze
`Progression.attackMinReach`, a nie własną liczbę broni z drugiej ręki. Wzięcie
jej z ręki odtworzyłoby co do joty **zastój autoataku** z 2026-09-07, tylko od
strony zwarcia zamiast od strony dystansu. Pilnuje §W10b/§W11 regresji.

⚠ **`WEAPON_MATERIAL` to czwarta oś przedmiotu** (`core/WeaponMaterials.ts`),
bliźniak `ArmorMaterials` — mnoży **obrażenia i cenę**, i nic poza tym.
⭐ Stal jest poziomem ZEROWYM: broń bez pola `material` czyta się jako stalowa,
więc wprowadzenie osi nie ruszyło ani jednej liczby. ⚠ `priceMul` musi zostać
NIŻSZY niż `damageMul`, inaczej tańszy gatunek jest pułapką, nie wyborem.
⛔ Gatunek nie rusza masy, `requires`, tempa ani zasięgu i **nie jest rodziną**.
⭐ **Od 2026-09-17 oś ma użytkowników: `knife` i `peasant_flail`.**
⚠⚠ **Ich liczby w `ITEMS` to RÓWNOWAŻNIK STALOWY** — nominał, nie to, co widzi
gracz; mnożnik przykłada `Quality`. Kto porównuje bronie czytając `damageMin`
wprost, porównuje liczby, których w grze nie ma — dlatego `§ZB` regresji liczy
dominację PO gatunku, a generator katalogu mnoży przed wypisaniem tabeli.
⚠ Zamek `material` po stronie PANCERZA **przepuszcza `type: "weapon"`** (pilnuje
go `weaponMaterialProblems`); ⛔ wyjątek nie rozszerza się na inne typy.
Bramka: `node tools/materialy_przymiar.mjs` §W (w tym `W9` — oś naprawdę mnoży).

⭐⭐ **CHWYT to DRUGA OŚ obok `hands` — kategoria 1.5H (2026-09-18).**
⛔ `hands` nadal ma **dwa stany** i trzeciego nie dostaje: mówi, ilu rąk broń
CHCE, czyli czym jest jej PEŁNY profil. `grip: "either"` mówi osobno, że
istnieje profil MNIEJSZY. ⛔ **Nie wpisuj `hands: 1.5`** — `itemHands` zwraca
`1 | 2` i sprowadziłby to do `1` **po cichu**, otwierając drugą rękę na półtorak
jako broń dual wield i wrzucając go do zbioru 1H w `§Y` regresji.

- ⚠⚠ **Tryb jest WYPROWADZANY ze stanu drugiej ręki** (`Equipment.gripOf(set)`),
  nigdy wybierany: pusta → `"two"`, zajęta → `"one"`. ⛔ Brak przełącznika, brak
  pola w zapisie, brak zmiany w walce — wyposażenie rusza się tylko w panelu,
  który pauzuje grę.
- ⚠ **Linia katalogowa półtoraka JEST profilem oburęcznym.** Chwyt jednoręczny
  powstaje z niej przez DEROGACJĘ (`ITEMS[*].oneHanded`), nigdy przez drugi
  komplet liczb. ⛔ Tryb oburęczny **niczego nie dodaje** — przestaje odbierać.
- ⛔⛔ **Do `oneHanded` NIE WOLNO dopisać `swingMul` ani `cooldownMul`.** Tempo
  jest już opodatkowane przez `offhandSwingMul` (tarcza ×1,08…×2,15) i płynie
  dalej w koszt staminy, ukorzenienie i moment trafienia. Druga kara na tej
  samej osi to podwójne opodatkowanie JEDNEJ decyzji gracza.
- ⚠ **`minReachAdd` jest DODAWANY, nie mnożony** — włócznia ma `minReach: 0`,
  więc mnożnik nie miałby czego pomnożyć.
- ⚠ **Chwyt należy do ZESTAWU**, nie do egzemplarza: `gripOf(2)` liczy się
  niezależnie od `gripOf(1)`.
- ⚠ **`usesBothHandsIn` pyta dziś o `hands` ORAZ `grip`** — to ta jedna linijka
  ODBLOKOWAŁA drugą rękę przy półtoraku. `handsRefusalFor`, `accepts`,
  `normalizeHands` i zasłona kafla w `PlayerPanel` dziedziczą po niej.
- ⛔⛔ **1.5H NIE JEST kategorią „broń + tarcza" (`OI-122`).** Chwyt pyta
  wyłącznie „czy druga ręka jest ZAJĘTA", nigdy „czy trzyma tarczę" — tarcza
  jest jednym z użyć zwolnionej ręki, obok sztyletu i wszystkiego, co `accepts`
  wpuści. ⛔ **Nie zawężaj tego pytania** i nie dokładaj osobnej kary dla
  konfiguracji „1.5H + broń 1H": koszt liczą już `oneHanded`, `offhandSwingMul`,
  wymagania i masa obu broni oraz biegłość per ręka.
- Bramka: `node tools/rece_przymiar.mjs` §H.
  Decyzja: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.

---

## `Stamina.ts`

⚠ **`spend()` NIGDY NIE ODMAWIA — to jest niezmiennik, nie wygoda.** Nie ma tu
zwracanego `false`, nie ma ścieżki „nie stać cię". Zasób schodzi do zera i tam
zostaje, a jedyną konsekwencją jest gorsza sprawność. Dwa powody, oba nośne:

1. To odróżnia **zasób wysiłku od many**. Mana odpowiada „czy mogę"; stamina
   odpowiada „ile mnie to kosztuje potem".
2. To jedyna rzecz, która trzyma **Kondycję jako atrybut OPCJONALNY**. Gdyby
   wyczerpanie odcinało umiejętności, w grze bez respeca każdy build musiałby
   w nią inwestować.

**Pojawienie się tu `if (this.value < cost) return false` kończy ten system.**

⚠ **Jedyny wyjątek leży POZA tym plikiem: sprint** (`Player.handleMovement`)
wymaga staminy > 0. Nie łamie reguły, bo działaniem podstawowym jest chodzenie
i ono nie jest blokowane nigdy.

⚠ **Nie importuje `Progression` ani `Equipment`, i tak ma zostać.** Pulę
wstrzykuje `Progression.emitAttributes()` przez `syncMax`, a **oba** mnożniki
obciążenia podaje wołający: `loadMultiplier` przy `spend()`, `regenMultiplier`
przy `tick()` (ten drugi od 2026-09-15, Model D — kanał WYDOLNOŚCI). `Equipment` i `Progression` już się nawzajem
importują — trzeci wierzchołek w tym cyklu to `undefined` przy starcie modułów.

⚠ **Regeneracja jest CIĄGŁA, także w walce** — świadomie odwrotnie niż HP
(reguła pięciu sekund). Tamta wyklucza leczenie w walce; stamina ma wracać,
gdy przestajesz się wysilać. Powód jest zmierzony: odstęp między walkami na
mapie lasu to 3,1 s, więc pięciosekundowa blokada nie startowała ani razu
(`docs/systemy/stamina.md`). Po 5 s bez wysiłku tempo rośnie ×1,5.

⚠ **Progi stanów są BEZWZGLĘDNE, nie procentowe.** Próg procentowy rośnie
razem z pulą, więc inwestycja w Kondycję potrafiła karać.

⚠ **`announce()` dławi zdarzenie** (≥0,5 pkt albo zmiana stanu), bo `tick`
leci co klatkę. Nowy odbiorca `staminaChanged` musi to znieść.

---

## ⚠ Feedback walki: DWIE pary plików, łatwe do pomylenia

Od Fazy 5B rozstrzygnięcie ciosu (`ActionResolution`) ma **dwóch niezależnych
konsumentów**, po dwóch stronach podziału z audytu §5.6. Każdy to para
„czysta decyzja + wykonanie z Phaserem":

| decyzja (czysta) | wykonanie (Phaser) | co rusza | serwer to liczy? |
|---|---|---|---|
| `CombatCues.cuesFor` | `CombatFx.playCues` | dźwięk, błysk, kamera, ślad świstu | **nie** |
| `GameplayEffects.effectsFor` | `CombatImpulse.nudge` | **POZYCJĘ CIAŁA** | **docelowo tak** |

⚠ **Reguła kieszonkowa: piszesz coś, co zmienia POZYCJĘ, CZAS albo STAN —
jesteś w parze drugiej.** `CombatFx.ts` ma ten zakaz w nagłówku i to jest
warunek, pod którym 5A w ogóle powstało.

⚠ **Oba pliki „czyste" są na liście strażnika czystości** w
`tools/combat_regresja.mjs` — żadnego Phasera, `Sfx`, `flashHit`, kamery ani
importu z encji/scen.

⚠ **`restoreTint` NIE MOŻE trafić do danych.** Bywa funkcją czytaną dopiero na
końcu błysku (patrz reguła o getterze w `src/entities/CLAUDE.md`), więc jedzie
jako argument wykonania (`FlashTarget`), nie jako pole `PresentationCues`.

⚠ **Właścicielem feedbacku ciosu jest BRONIĄCY SIĘ; napastnik ogłasza wyłącznie
PUDŁO.** Bez tego podziału ten sam cios gra dwa razy — a przed 5B grał
**trzy** razy i **nie było tego słychać wyłącznie dzięki przepustnicy
`AUDIO.minRetriggerMs`**. Mechanizm tłumiący nadmiar sprawia, że nadmiar
przestaje być widoczny jako usterka; nie licz na niego.

⚠ **Impuls jest OPISEM RUCHU, nie tweenem.** Kierunek, amplituda, czasy
i NAZWA krzywej mieszkają w `Impulse`; przesunięcie liczy czysta
`impulseOffsetAt`. `CombatImpulse.ts` ma zostać głupi — zegar i zapis pozycji.
**Nowa własność ruchu dokłada się do danych, nigdy do wykonania**, bo tę samą
regułę ma móc wykonać serwer, który tweenów nie ma.

⚠ **`body.blocked` / `body.touching` NIE DZIAŁAJĄ dla przesunięcia wpisanego
pozycją.** Zmierzone: ciało wjeżdżające impulsem w statyczną przeszkodę dostaje
`embedded: true`, a żadna flaga kontaktu się nie zapala — Arcade rozdziela
wzdłuż względnego RUCHU, a teleport go nie ma. Zawór kolizyjny musi pytać
o PRZYSZŁOŚĆ (`physics.overlapRect` na projektowanym prostokącie), nie
o przeszłość.

⚠ **`CombatAction` ma DWA wymagane pola o ruchu napastnika i to są DWIE różne
własności.** `ownsBody` — czy ciałem steruje sama akcja (szarża dzika, wypad
wilka, odskok Szarego); niezmiennik chroniący przed dwoma systemami ruchu
w jednej klatce. `attackerRecoil: "none" | "onHit"` — czy trafienie kopie
napastnikiem; **jawna decyzja, jedyne, co czyta `effectsFor`**.

- ⚠ **Nie wyprowadzaj jednego z drugiego.** Wiąże je tylko jeden kierunek:
  `ownsBody: true` ⇒ `attackerRecoil: "none"`. Odwrotnie **nie** — `spider_web`
  ciałem nie steruje, a mimo to nie kopie, bo trafia POCISK, kilka kafli i
  kilkaset ms od strzelca. Na tym przykładzie wywrócił się model z jednym
  polem (2026-08-23, `docs/systemy/presentation.md`).
- ⚠ **Wartość nazywa MOMENT.** Odrzut od samego wystrzału to nowa wartość
  (`"onRelease"`), nie przestawienie `spider_web` na `"onHit"`.
- Oba pola są wymagane — nowa akcja ma dostać od kompilatora **oba** pytania.
  Pilnuje §M2 w `tools/combat_regresja.mjs`.

⚠ **`AbilitySpec.ts` jest JEDYNYM źródłem kształtu umiejętności — czyta z niego
podgląd I rozstrzygnięcie.** `resolveAbility` składa `ResolvedAbilitySpec`
(kształt + sufit celów + mnożniki ról), a `coversTarget`/`selectTargets` są
jedynymi konsumentami. **Nie pisz drugiego stożka po stronie UI**: rozjedzie się
przy pierwszej zmianie i nikt tego nie zobaczy, a podgląd, który kłamie, jest
gorszy niż jego brak.

⚠ **Ale JEDEN predykat NIE WYSTARCZA — potrzebne jest też JEDNO ŹRÓDŁO
`strike` (2026-08-26).** `GameScene.updateAimPreview` rozstrzyga **każdą**
umiejętność przez `resolveAbility(id, this.currentStrike())`, a gałąź
umiejętności składa własny profil ciosu. **Wspólna funkcja z dwoma różnymi
wejściami daje dokładnie ten sam skutek co dwa różne stożki.** Zmierzone na
Shield Bashu: gałąź liczyła zasięg 48 px, podgląd zasięg broni — przy
przeciągnięciu palcem podgląd podświetlał cel jako legalny, a commit odrzucał
go **cichym `return`**: bez komunikatu, bez cooldownu, bez staminy. Na dotyku
martwy przycisk jest nieodróżnialny od zepsutego.

- ⚠ **Testy czystych funkcji tego NIE ZŁAPIĄ** — obie strony wołają tę samą
  funkcję, tylko karmią ją czym innym. Strażnik musi pytać o **źródło** liczby,
  nie o jej wartość (`combat_regresja.mjs` §T1b).
- ⚠ **Umiejętność jednocelowa NIE MOŻE sięgać krócej niż autoatak.** Reguła
  autora po zgłoszeniu z gry: *jeśli trafiasz kogoś autoatakiem, trafiasz go
  też umiejętnością na tym celu.* Krótszy zasięg nie jest kosztem — jest
  martwym pasmem, w którym zwykły cios trafia, a umiejętność odmawia
  (zmierzone: do 51% zasięgu przy włóczni). Pilnuje §T1a na całym rosterze
  broni. Pełny zapis: `docs/systemy/abilities.md` Tu też — i tylko tu — wejdą kiedyś poziom umiejętności
i talenty. Pełny opis: `docs/systemy/abilities.md`.

- ⚠ **Kierunek CELOWANIA (ciągły, 360°) to nie zwrot SPRITE'A (cztery
  strony).** Geometria dostaje wektor analogowy, `aimAttackAt` snapuje
  animację. Zejście tego do jednego zaokrągliłoby celowanie do 90°.
- ⚠ **`withinArc` bierze `pointBlankBypassPx` jako WYMAGANY parametr.**
  Umiejętność z podglądem podaje `0` (brak furtki), bo trafienie zza pleców
  poza narysowanym klinem czyni podgląd kłamstwem. `0` znaczy „furtki nie ma"
  — porównanie jest strzeżone przez `> 0`.
- ⚠ **Selekcja celów musi być deterministyczna BEZ kolejności encji**:
  odchylenie → dystans → x → y. Bez dwóch ostatnich kluczy o remisie decyduje
  stabilność `sort`, czyli kto się wcześniej odrodził.
- ⚠ **Archetyp opisuje `shape.kind`, NIGDY `if (id === …)` we wspólnej
  warstwie.** `directionArc` (Szerokie cięcie) — aim wybiera KIERUNEK kształtu;
  `directionTarget` (Szarża) — aim wybiera PRZECIWNIKA. Jedyne miejsce, w którym
  wolno rozgałęzić się po `id`, to `resolveAbility`, bo to jest cała jego praca.
- ⚠ **`AimFrame` niesie DWA punkty odniesienia napastnika i to nie jest
  nadmiarowość.** Projekt ma dwie żywe konwencje: `body` (`combatOrigin`,
  prześwit — Faza 1B) i `sprite` (środek duszka, dystans środków — legacy,
  mierzy tak **Szarża**). Dzieli je u gracza 19 px, więc przepięcie Szarży na
  `body` przestroiłoby jej `minRange`/`maxRange` przy nietkniętych liczbach.
  **Dług do spłacenia razem z resztą przejścia na `combatOrigin`**, nie stan
  docelowy — a że kształt wybiera punkt sam (`originFor`/`rangeTo`), spłata
  będzie jedną zmianą.
- ⚠ **Miara pasma to pole KSZTAŁTU (`metric`), nie własność archetypu.**
  `directionTarget` niosą dziś dwie umiejętności i mierzą inaczej: Szarża
  `spriteCentres` (legacy), Ciężkie uderzenie `surfaceGap`. **Miara musi być
  tą, którą sprawdzi HIT** — inaczej podgląd mówi „w zasięgu", a cios „za
  daleko".
- ⚠ **Opóźniony cios NIE potrzebuje własnej maszyny stanów.** `pendingSwing`
  w `GameScene` opisuje ten model od C-01 (zamrożony cel i kierunek, obrażenia
  później, ponowny test zasięgu przy trafieniu); umiejętność dokłada najwyżej
  `damageMul`. **Zanim napiszesz drugi FSM dla gracza, sprawdź, czego temu
  brakuje.** ⚠ I pamiętaj, że to JEDEN slot — cokolwiek pisze do
  `pendingSwing`, musi najpierw sprawdzić, czy nie nadpisuje ciosu w locie.
- ⚠ **`damage` w `ResolvedAbilitySpec` jest OPCJONALNE.** Szarża nie zadaje
  obrażeń (cios na końcu to zwykły autoatak), więc nie ma tego bloku. Mnożnik
  1,0 „dla symetrii" byłby martwym slotem — pilnuje tego §P1.

⚠ **Recoil to NIE odrzut.** Wychodzi i WRACA (netto zero, 4–9 px), więc jest
sygnałem masy; odrzut jedzie w jedną stronę (~68 px), tworzy dystans i zostaje
wyłącznością obucha. Gdy odpala się odrzut, recoil celu jest pomijany. Pełne
uzasadnienie: `docs/systemy/presentation.md`

---

## Walka: `CombatGeometry.ts` / `HitResolver.ts` / `DamageResolver.ts`

Trzy pliki Fazy 1A Combat v2 (`docs/systemy/combat.md`). Powstały z
**wyciągnięcia** kodu, który działał w `GameScene` i `Player`, nie z napisania
drugiego systemu obok.

⚠ **ŻADEN z nich nie może sięgnąć po Phasera, `Sfx`, `flashHit`, `GameEvents`,
kamerę, scenę ani encje.** To jest warunek dwóch rzeczy naraz: testowalności
(dają się uruchomić w Node — stąd w ogóle jest uprząż regresyjna) i przyszłego
authority (na serwerze nie ma kamery). **Reguła jest EGZEKWOWANA**, nie
deklarowana: `tools/combat_regresja.mjs` sprawdza to na tekście plików i
świeci na czerwono.

✅ **Kształty `legacy*` w `HitResolver` ZNIKNĘŁY w Fazie 1B-b (2026-08-23).**
Odtwarzały dawną geometrię co do bitu — łącznie z `allowance` liczonym
z `max(displayWidth, displayHeight)` — bo Faza 1A miała dowieźć refaktor przy
IDENTYCZNYCH trafieniach. Dziś celem jest zmierzony ślad stopy (`CombatBody`),
a stara arytmetyka żyje wyłącznie jako **zamrożony baseline** w
`tools/combat_regresja.mjs` (gałąź `legacy`) i jako tabela `PRZED_1B`
w `tools/combat_geometry.mjs`.

⛔ **Nie przywracaj martwego kształtu „na wszelki wypadek".** Powód stoi
w nagłówku `HitResolver`: uprząż świeciłaby wtedy na zielono, testując funkcje,
których gra nie używa. ⚠ Ten akapit mówił do 2026-09-07 „przedrostek jest
CELOWY i ma zniknąć" — czyli opisywał kod nieistniejący od dwóch tygodni,
w pliku reguł ładowanym przy każdej pracy w tym katalogu.

⚠ **Bit-w-bit znaczy bit-w-bit.** Trzy pułapki złapane przy przenoszeniu, każda
potrafiła cicho przewrócić trafienie na granicy:
- `Math.hypot(dx,dy)` ≠ `Math.sqrt(dx*dx+dy*dy)` — **różnią się w 38% losowych
  par** (zmierzone). `Phaser.Math.Distance.Between` używa drugiej formy, więc
  `withinLegacyCircle` też musi, choć sąsiednie funkcje używają pierwszej.
- `Phaser.Math.RadToDeg`/`DegToRad` mnożą przez **prekomputowaną stałą**
  (`180/Math.PI`), a nie dzielą — `(r*180)/Math.PI` daje inny ostatni bit.
- Zamiana `dot >= cos(arcDeg)` na porównanie kątów w stopniach jest
  **matematycznie** równoważna, ale nie bitowo (`acos` i `cos` zaokrąglają
  inaczej). Zmiana formy należy do 1B, nie do 1A.

⚠ **`resolveIncoming` ma SKUTEK UBOCZNY** — `Defense` (PRD) pamięta serię
porażek między rzutami. Nie wolno jej wołać „na próbę", np. dla podglądu
obrażeń; do tego jest sama arytmetyka z `Protection`.

⚠ **Stan PRD należy do konkretnej instancji `Defense`.** Wszystko, co go resetuje
albo z niego rzuca, musi wyjść z TEGO SAMEGO grafu modułów — dokładnie ta sama
pułapka co `import()` w konsoli zamiast `window.dev`.

⚠ **`combatOrigin` bierze `body.center` z silnika, NIGDY nie liczy wzoru obok
niego.** Wzór istnieje w `tools/combat_geometry.mjs`, bo tamten skrypt działa
bez Phasera — ale jest lustrem, a lustra rozjeżdżają się cicho.

⚠ **Jad NIE przechodzi przez `DamageResolver`** i nie ma przejść.
`Player.takeVenomTick` świadomie omija pancerz, tarczę, typ i nietykalność —
każda z tych różnic jest decyzją.

---

## `Save.ts`

- **Zmiana kształtu zapisu → podbij `SAVE_VERSION` I DOPISZ MIGRACJĘ**
  `MIGRACJE[stara]` (o jedną wersję w górę). ⭐ Od 2026-10-11 (`OI-51`) niezgodny
  zapis się **migruje**, nie kasuje; zapis z nowszej wersji, za stary albo
  uszkodzony idzie do kopii `-kopia-v<n>` przed nadpisaniem (`zabezpiecz`).
  Luka w łańcuchu świeci na czerwono w `tools/zapis_weryfikacja.mjs` §G1.
- ⚠ Ale **pole DODANE jako opcjonalne nie jest zmianą kształtu** — i to jest
  właściwa droga. Podbicie wersji dla pola addytywnego kasuje realny postęp
  dla zera zysku.
- ⚠ **`Save.load()` pisze wprost w `Equipment.weapon`/`.offhand`, omijając
  `equip()`** — jedyne takie miejsce w `src/`, więc jedyne, które musi po
  sobie posprzątać (`normalizeHands`). Reguła: **akcję wolno odrzucić, stanu
  który już istnieje — nie.** Pełny plecak przy wczytaniu toleruje nielegalną
  parę, zamiast zniszczyć przedmiot.
- `Save.load()` **wycisza autozapis na czas przywracania** — każdy przywracany
  singleton emituje, a każdy emit jest podpięty pod autozapis.

---

## `movement/` — warstwa ruchu (od 2026-08-28)

⚠ **To NIE jest singleton i nie należy do listy wyżej.** `Locomotion` jest
komponentem **per stworzenie**, wstrzykiwanym przez kompozycję — bo `Enemy`,
`Critter`, `FarmAnimal`, `Player` i `Projectile` rozszerzają
`Phaser.Physics.Arcade.Sprite` każde osobno i wspólnego przodka nie mają.

Podział, którego trzeba pilnować:

| plik | rola | wolno mu dotknąć Phasera? |
|---|---|---|
| `MoveIntent.ts` | słownik pięciu intencji + matematyka wektora | **nie** |
| `Steering.ts` | omijanie przeszkód; świat wchodzi wstrzykniętym predykatem | **nie** |
| `NavGrid.ts` | siatka PRZEŚWITU pod przyszły `PathSolver` | **nie** |
| `MovementContext.ts` | sonda terenu, jedno wejście do przestrzeni sceny | tak |
| `Locomotion.ts` | komponent encji: intencja → solver → ciało | tak |
| `solvers/*` | `Direct` (dziś), `Steer` (opcjonalny), `Path` (jeszcze nie istnieje) | tak |

⚠ **Trzy pierwsze są CZYSTE i mają takie zostać** — dokładnie z tego powodu, co
`CombatGeometry`/`HitResolver`: tylko wtedy da się je uruchomić w Node, a tylko
wtedy `tools/movement_weryfikacja.mjs` cokolwiek dowodzi.

⚠ **`desiredVelocity` odtwarza DWIE żywe konwencje normalizacji i to nie jest
nadmiarowość.** `moveTo` w Phaserze idzie przez `atan2` + `setToPolar`, a
`Vector2.normalize().scale()` dzieli przez długość — matematycznie równe,
**bitowo różne**. Migracja miała nie zmienić rozgrywki, więc każda intencja
liczy tak, jak liczyło zachowanie, które zastąpiła. Bramka to wyłapuje: podmiana
jednej konwencji na drugą wywala test na 15. miejscu po przecinku.

⚠ **`NavGrid` jest BUDOWANY, ale jeszcze przez nikogo NIE CZYTANY** (decyzja
autora: reprezentacja przestrzeni ma powstać raz, a nie drugi raz przy
bandytach). Dwie własności są w nim nośne: niesie **prześwit**, nie
„wolne/zajęte" — inaczej A* poprowadziłby dzika (46 px) przez bramę 18 px —
i ma rozdzielczość **podkaflową** (8 px), bo wszystkie bramy w lesie mieszczą
się wewnątrz kafla 32 px.

---

## `Protection.ts`

Jedno miejsce liczące redukcję obrażeń **w OBU kierunkach walki**. Czyste
funkcje nad danymi, celowo **nie** drugi resolver — resolvery zostają tam,
gdzie były.

⚠ **Ochrona liczy się w PUNKTACH, nie w procentach.** Projekt miał krótko dwa
kształty naraz i punkty wygrały: wszystko, co kiedykolwiek będzie modyfikować
ochronę (jakość wykonania, trwałość, buff), naturalnie skaluje **sumę
punktów**, a skalowanie procentu nie ma jednej poprawnej odpowiedzi („+20% do
60%" to albo 72%, albo 80 pp).

⚠ **`damageType` opcjonalny = „bez typu", zwraca punkty bez zmian.** Brak
pancerza to pełne obrażenia — w modelu **nie ma** czegoś takiego jak
„odporność nieopancerzonego".

⚠⚠ **BLOK ODSZEDŁ OD `isFrontal` 2026-09-05 — i to jest ten „świadomy
rozdział", którego żąda punkt niżej.** Tarcza ma dziś TRZY strefy
(`Protection.guardZone`: pełna < 60°, osłabiona < 100°, dalej żadna) i własną
granicę zewnętrzną `SHIELD.sideArcDeg`. `isFrontal` obsługuje od tej daty
PAROWANIE i ATAK — nie blok. Powód rozdziału: atak pyta „czy mogę to trafić",
tarcza „czy zdążę ją podstawić", i te dwa pytania nie muszą mieć jednej granicy.
⚠ `guardZone` jest ZBUDOWANE na `isFrontal` (dwa zagnieżdżone wywołania), więc
konwencja granicy nadal jest JEDNA — pilnuje tego §X w regresji.

⚠ **`isFrontal` obsługuje ATAK i PAROWANIE, i to jest celowe (2026-08-23).**
Poza Parowaniem woła go bramka zwrotu autoataku
(`GameScene.canStrikeFacing`) — z wektorem DO CELU zamiast DO NAPASTNIKA, bo to
ta sama geometria pytana z drugiej strony. Dzięki temu reguła „trafiasz to, co
mógłbyś zablokować" jest **jedną funkcją**, a nie dwiema kopiami.

- Parametr `arcDeg` istnieje wyłącznie po to, żeby atak mógł nazwać swoje
  pokrętło (`PLAYER.attackFrontArcDeg`) bez czytania stałej tarczy. Obie
  wskazują na `FRONT_ARC_DEG`.
- ⚠ **Sprzężenie działa w obie strony: strojąc `SHIELD.blockArcDeg`, stroisz
  bramkę ataku.** Zamierzone. Rozdzielaj je ŚWIADOMIE (dwie stałe, dwa
  uzasadnienia), nigdy przy okazji strojenia jednej z nich.
  ⚠ **Nazwa `blockArcDeg` jest od 2026-09-05 myląca** — nazywa PÓŁKULĘ (atak +
  parowanie), a nie łuk bloku, którym jest `sideArcDeg`. Przemianowanie dotyka
  §L, `PLAYER` i sześciu dokumentów: osobna przeprowadzka, świadomy dług.
- Pilnuje tego §L w `tools/combat_regresja.mjs` — stała, predykat i zawór
  zwarcia, każde z osobną gałęzią błędu.

---

## `Interactables.ts`

⚠ **`GameScene.removeInteractable` NIE MOŻE czyścić `nearby` przed ponownym
przebiegiem.** Zmiana jest ogłaszana przez porównanie nowego zwycięzcy z
`nearby`; wyczyszczenie go najpierw sprawia, że „nic tu teraz nie ma" równa
się „nic tu nie było" — zdarzenie nie leci, a monit **zostaje na ekranie na
zawsze**. Znalezione w silniku, nie z lektury.

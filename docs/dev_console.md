---
typ: OPERACYJNE
domena: proces
tytul: Konsola deweloperska — komendy do testowania
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Konsola deweloperska — komendy do testowania

**Po co ten plik.** Testowanie nowej mechaniki nie może wymagać wygrania gry od
nowa. Poniżej są komendy, którymi ustawia się stan postaci w kilka sekund:
złoto, poziomy, punkty, umiejętności, ekwipunek, cooldowny.

⚠ **Wszystkie działają WYŁĄCZNIE w buildzie deweloperskim** (`npm run dev`).
Uchwyt `window.dev` stoi za `import.meta.env.DEV`, więc w produkcji i w APK go
nie ma — patrz `src/main.ts`.

> ## ⚠ JEDNA ZASADA, KTÓRA UNIEWAŻNIA WSZYSTKIE POZOSTAŁE
>
> **Sięgaj przez `dev.`, NIGDY przez `await import(...)` w konsoli.**
>
> Dynamiczny import daje **drugi graf modułów**. `Equipment.equip(...)` wpisane
> po takim imporcie mutuje kopię, której nic nie renderuje, a każdy odczyt
> wraca nieaktualny — bez błędu, bez ostrzeżenia, po prostu „nic się nie
> dzieje". **Kosztowało to w tym projekcie realny czas debugowania dwa razy**
> i to jest jedyny powód, dla którego `window.dev` w ogóle istnieje.

---

## ⚠ Druga pułapka: przypisanie do pola NICZEGO NIE OGŁASZA

Większość stanu gry to **publiczne pola**, więc `dev.Inventory.gold = 5000`
zadziała… i nie odświeży niczego na ekranie. Interfejs nie odpytuje stanu co
klatkę — **czeka na zdarzenie**. Licznik złota, karta postaci i sklep zostaną
z poprzednią liczbą aż do następnej, niezwiązanej zmiany, która przypadkiem coś
wyemituje.

**Reguła kieszonkowa: jeśli istnieje METODA, użyj metody.** Metody emitują,
przypisania nie. Gdzie metody nie ma (punkty umiejętności), trzeba ogłosić
ręcznie — tabela niżej mówi, czym.

| co zmieniasz | czym | co to emituje |
|---|---|---|
| złoto | `Inventory.addGold(n)` | `inventoryChanged` ✅ |
| przedmiot | `Inventory.addItem(id, n)` | `inventoryChanged` ✅ |
| XP i poziom | `Progression.addXp(n)` | `xpChanged` + `leveledUp` ✅ |
| punkt w atrybut | `Progression.spendPoint(attr)` | `attributesChanged` + `xpChanged` ✅ |
| **punkty umiejętności** | `Progression.skillPoints += n` | **NIC — ogłoś ręcznie** ⚠ |
| nauka u trenera | `Skills.learn(id)` | `skillsChanged` ✅ |
| założenie sprzętu | `Equipment.equip(id)` | `equipmentChanged` ✅ |

---

## Złoto

```js
dev.Inventory.addGold(5000)
```

⚠ **Nie `dev.Inventory.gold = 5000`** — patrz wyżej. `addGold` odrzuca też
wartości ≤ 0, więc odjęcie złota idzie przez `spendGold(n)`, a nie przez minus.

## Punkty umiejętności — jedyne miejsce wymagające ręcznego ogłoszenia

```js
dev.Progression.skillPoints += 20; dev.Progression.emitAttributes(); dev.Progression.emitXp()
```

⚠ **Oba emity są konieczne, i to nie jest ostrożnościowa nadmiarowość.** Dwa
panele czytają **dwa różne zdarzenia**: karta postaci słucha
`attributesChanged`, a pasek XP `xpChanged`. Z jednym emitem jedna z liczb
zostaje nieaktualna — i to ta, na którą akurat nie patrzysz.

⚠ `emitAttributes()` przelicza przy okazji **pulę staminy** (wynika z
Kondycji). To jest jedyne miejsce, przez które przechodzi każda zmiana
atrybutów, więc nie da się ominąć tego przeliczenia.

Wydanie punktu w atrybut ma już własną metodę i emituje samo:

```js
dev.Progression.spendPoint("strength")   // "strength" | "vitality" | "conditioning" | "agility"
```

## Poziomy — ZAWSZE przez XP

```js
dev.Progression.addXp(5000)
```

⚠ **Nigdy `dev.Progression.level = 10`.** `addXp` przelicza pętlę awansów,
dopisuje punkty za każdy poziom i emituje `leveledUp` — a to ostatnie jest tym,
co każe `Abilities.fillFreeSlots` **położyć świeżo odblokowaną umiejętność na
pasku**. Ustawiony ręcznie poziom daje liczbę na ekranie i pusty slot, po czym
wygląda to jak usterka umiejętności.

## Mapa i Kartografia

```js
dev.Skills.learn("cartography_1")             // mapa w panelu (Myśliwy, 0 zł)
dev.Skills.learn("cartography_2")             // minimapa (Sołtys, 60 zł; wymaga I)
dev.Exploration.fraction("forest")            // ile lasu odkryto (0–1)
dev.Exploration.revealAll("forest", 7680, 2880) // cały obszar (rozmiar w px świata)
dev.Exploration.reset()                       // wszystko we mgle
```

⚠ Odkrycia zapisują się najwyżej co 15 s (i przy schowaniu karty) — po
`revealAll` zapis przyjdzie z najbliższym zdarzeniem.

## Umiejętności czynne

⚠ **Każda ma DWIE bramki i obie są konieczne**: poziom (`unlockLevel`) mówi
„jesteś gotowy", trener (`Skills`) mówi „ktoś ci to pokazał". Samo podniesienie
poziomu nie odblokuje niczego.

```js
dev.Skills.learn("shield_work")     // uczy Uderzenia tarczą — POBIERA złoto i punkt
dev.Abilities.unlocked()            // co jest naprawdę odblokowane (obie bramki)
dev.Abilities.slotted()             // co leży na czterech slotach paska
dev.Abilities.assign(0, "shieldBash")  // połóż na konkretnym slocie
dev.Abilities.reset()               // wyzeruj WSZYSTKIE cooldowny
```

⚠ `Skills.learn` pobiera **złoto ORAZ punkt**, więc kolejność ma znaczenie:
najpierw zasoby, potem nauka. Zwraca `false`, gdy nie stać — po cichu, bez
wyjątku.

`dev.Abilities.reset()` jest najczęściej potrzebną komendą przy strojeniu:
pozwala nacisnąć tę samą umiejętność dziesięć razy z rzędu, zamiast czekać
14 sekund między pomiarami.

**Identyfikatory** — umiejętność w `ABILITIES` jest `camelCase`, a nauka
w `SKILLS` ma własne id:

| umiejętność | nauka u Patryczka |
|---|---|
| `cleave` | `wide_cut` |
| `heavyStrike` | `heavy_blow` |
| `lunge` | `lunge_step` |
| `shieldBash` | `shield_work` |
| `dodge` | `footwork` |
| `charge` | `charge_run` |
| `whirlwind` | `blade_dance` |
| `warcry` | `battle_voice` |

## Ekwipunek

```js
dev.Inventory.addItem("ironbound_shield", 1)   // do plecaka
dev.Equipment.equip("ironbound_shield")        // szuka w plecaku po id i zakłada
dev.Inventory.addItem("hammer", 1, 5)          // trzeci argument = jakość 1–7
```

⚠ `Equipment.equip` **szuka przedmiotu w PLECAKU**, więc `addItem` musi być
wcześniej. Zwraca `false`, gdy nie znalazł albo slot jest zablokowany (broń
dwuręczna trzyma `offhand`).

⚠ Jakość 5–7 **nie występuje w sklepach** (`QUALITY.shopMaxLevel` = 4) — przez
konsolę wejdzie, ale pamiętaj, że testujesz wtedy stan, którego gra normalnie
nie rozdaje.

⚠ **`requires` jest sprawdzane i przez konsolę też** — `equip` zwraca `false`
bez słowa wyjaśnienia. Tarcza okuta chce Siły 3, miecz swojego progu; na
świeżej postaci obie odmówią, a wygląda to jak zepsuta komenda. Najpierw
`dev.Progression.addXp(20000)` i `spendPoint("strength")` tyle razy, ile trzeba.

## Model 3D postaci — co ma w rękach

```js
dev.char3d.dostepne()                      // co w ogóle da się założyć w slotach
dev.char3d.bron("sword")                   // ręczne nadpisanie prawej ręki
dev.char3d.tarcza("ironbound_shield")      // ręczne nadpisanie drugiej ręki
dev.char3d.tarcza(false)                   // pusta druga ręka
dev.char3d.tarcza("auto")                  // wróć do śledzenia ekwipunku
dev.char3d.pancerz("ciezki")
```

⚠ **`bron`/`tarcza` NADPISUJĄ i zostają nadpisane do czasu `"auto"`.** Bez tego
komenda działałaby jedną klatkę i zostałaby cicho zjedzona przez synchronizację
z `Equipment` — czyli wyglądałaby na zepsutą. Konsekwencja w drugą stronę:
po `dev.char3d.bron("sword")` zmiana broni w ekwipunku **nie rusza modelu**,
dopóki nie powiesz `bron("auto")`.

⚠ Normalnie tarcza idzie **za tym, co gracz ma w `offhand`**, i gaśnie sama przy
broni dwuręcznej (bo `Equipment` odkłada wtedy drugą rękę do plecaka).
Broń w drugiej ręce (dual wield) **nie ma jeszcze modelu po lewej stronie** —
slot `Tarcza_` rozpoznaje tarcze po polu `block`, a broń po prostu ignoruje.

## Stamina, HP, walka

```js
dev.Stamina.refill()                 // pełna pula
dev.Stamina.current                  // odczyt
dev.Stamina.state                    // "normal" | "tired" | "exhausted"
dev.Defense.reset()                  // wyzeruj licznik PRD (Dodge/Parry)
```

⚠ **`Stamina.spend()` NIGDY nie odmawia** — to niezmiennik systemu, nie
niedopatrzenie. Zasób schodzi do zera i tam zostaje; konsekwencją jest gorsza
sprawność, nie blokada akcji. Nie szukaj w konsoli ścieżki „nie stać cię", bo
takiej nie ma (`docs/systemy/stamina.md`).

## Biegłość i Mastery

```js
dev.WeaponProficiency.get("sword")          // P w rodzinie (null = gołe ręce → 100)
dev.WeaponProficiency.masteryOf("sword")    // ranga WYKUPIONA (0…4)
dev.WeaponProficiency.capFor("sword")       // twardy sufit P przy tej randze
dev.WeaponProficiency.masteryOffer("sword") // próg, cena, `ready`, powód odmowy
dev.WeaponProficiency.setMastery("sword", 2)// ranga BEZ płacenia
dev.WeaponProficiency.set("sword", 150)     // P wprost
dev.WeaponProficiency.unlockMastery("sword")// zakup Z KOSZTEM (złoto + punkty)
```

⚠ **Kolejność jest wiążąca: NAJPIERW ranga, POTEM `P`.** `set` zaciska `P` do
sufitu wykupionej rangi (§34.3), więc `set("sword", 350)` bez rangi da **50**
i to nie jest usterka. Poprawnie: `setMastery("sword", 4)` → `set("sword", 350)`.

⚠ **`unlockMastery` to jedyna ścieżka z KOSZTEM** — pobiera złoto i punkty
rozwoju, i tylko ona odtwarza to, co robi gracz u trenera. `setMastery` służy do
ustawienia stanu, nie do testowania zakupu.

| rangi wykupione | sufit `P` | kolejną rangę kupisz od `P` |
|---|---|---|
| brak | 50 | **40** |
| M-I / M-II / M-III | 100 / 200 / 350 | **90 / 190 / 340** |
| M-IV | bez sufitu | — |

⚠ **Zakup otwiera się 10 punktów PRZED sufitem** (`cap − 10`, §34.2a) — po to,
żeby dało się zdążyć do trenera, zanim praktyka zacznie przepadać. ⛔ **To nie
podnosi sufitu**: `P` dalej staje twardo na 50/100/200/350.

⚠ **Praktyka zdobyta na suficie PRZEPADA** — nie jest bankowana. Gra mówi o tym
sama (napis w kolumnie HUD-u + panel BROŃ + wiersz „Mistrzostwo broni"
u Patryczka); jeśli trenujesz i nic nie przybywa, sprawdź najpierw sufit.

## Trening ciężkiego pancerza (obciążenie, Model D)

```js
dev.ArmorTraining.rank            // ile rang wykupiono (0…3)
dev.ArmorTraining.next            // następna ranga: nazwa, koszt, co zdejmuje
dev.ArmorTraining.canAfford()     // czy starczy punktów na następną
dev.ArmorTraining.learn()         // wykup następnej — POBIERA punkty umiejętności
dev.ArmorTraining.reset()         // z powrotem do zera
```

⚠ **Rangi są LINIOWE — II wymaga I, III wymaga II.** `learn()` kupuje zawsze
NASTĘPNĄ i pobiera jej punkty (1 → 2 → 3, razem 6); zwraca `false`, gdy ich
brakuje — po cichu, bez wyjątku. Punkty dosypuje się jak zwykle:
`dev.Progression.skillPoints += 6` **+ ręczne ogłoszenie** (patrz tabela wyżej).

⚠ **Nie ma odpowiednika `setMastery`, czyli ustawienia rangi BEZ płacenia.**
To świadoma luka, nie przeoczenie — zaparkowana w `docs/odlozone.md` §1.

⛔ **Trener tego NIE sprzedaje i to jest świadome.** Cena w złocie należy do
otwartego `OI-46`; do czasu jej rozstrzygnięcia konsola jest jedyną drogą do
rang. ⚠ Nie dopisuj ceny „żeby działało" — to zamknęłoby `OI-46` bez decyzji.

**Co która ranga zdejmuje** (ulga to UŁAMEK KARY danego kanału, nigdy jej
skasowanie):

| ranga | pkt | zdejmuje |
|---|---|---|
| I — Nawyk ciężaru | 1 | **30%** kary REGENERACJI |
| II — Oddech | 2 | **35%** osi WYSIŁKU (unik, sprint) |
| III — Chód w żelazie | 3 | **25%** kary RUCHU |

**Jak sprawdzić, czy zadziałało** — trzy kanały czyta się osobno, bo wiszą na
dwóch różnych osiach:

```js
dev.Equipment.equippedWeight      // kg — EQUIP_SLOTS + STOW_SLOTS (schowana broń WAŻY)
dev.Equipment.speedMultiplier     // kanał RUCHU      ← masa; Siła go NIE zdejmuje
dev.Equipment.regenMultiplier     // kanał WYDOLNOŚCI ← masa; Siła go NIE zdejmuje
dev.Equipment.loadMultiplier      // kanał WYSIŁKU    ← ratio; Siła go wykupuje
dev.Equipment.loadRatio           // masa / udźwig
150 * dev.Equipment.speedMultiplier   // realny chód w px/s
```

⚠ **Jeżeli podniesiesz Siłę i prędkość się NIE zmieni — to nie jest usterka.**
Tak wygląda zasada Modelu D: *Siła kompensuje względny wysiłek, nie kompensuje
bezwzględnej masy*. Zmieni się `loadMultiplier`, nie `speedMultiplier`.

⚠ **Żeby zmierzyć ciężki zestaw, pamiętaj o drugim zestawie broni** —
`weapon2`/`offhand2` liczą 100% masy (`OI-96`), a plecak dalej nie waży nic.

## Pomiar obciążenia w locie (`OI-105`)

⚠ **Nie ma komendy `dev.obciazenie()` i to jest świadome** — autor wstrzymał
dokładanie hooków przed pierwszym playtestem. Poniżej odczyty z tego, co już
istnieje.

```js
// masa i klasa — to samo, co pokazuje panel postaci
dev.Equipment.equippedWeight        // kg: EQUIP_SLOTS + STOW_SLOTS
dev.Equipment.loadCapacity          // udźwig z Siły (soft cap od 20)
dev.Equipment.loadRatio             // masa / udźwig
dev.Equipment.loadClass             // etykieta HUD: light / medium / heavy

// trzy kanały Modelu D
dev.Equipment.speedMultiplier       // RUCH        ← masa; Siła NIE zdejmuje
dev.Equipment.regenMultiplier       // WYDOLNOŚĆ   ← masa; Siła NIE zdejmuje
dev.Equipment.loadMultiplier        // WYSIŁEK     ← ratio; Siła wykupuje

150 * dev.Equipment.speedMultiplier         // chód w px/s
150 * dev.Equipment.speedMultiplier * 1.6   // sprint w px/s
15  * dev.Equipment.loadMultiplier          // koszt jednego uniku
3   * dev.Equipment.regenMultiplier         // regeneracja przy wysiłku, /s
```

### ⭐ Prędkość FAKTYCZNA, nie wyliczona

```js
const gs = game.scene.getScene("Game");
gs.player.body.speed                 // px/s w tej chwili — 0 gdy stoisz
```

⚠ **`player` jest zadeklarowany jako `private`, ale `private` w TypeScripcie
nie istnieje w runtime** — z konsoli pole jest dostępne normalnie. To jedyna
droga do zmierzenia PRAWDZIWEJ prędkości; wszystko powyżej to arytmetyka, która
może rozjechać się z tym, co robi ciało fizyczne.

**Pomiar ciągły** (wypisuje co pół sekundy, zatrzymasz `clearInterval(h)`):

```js
const gs = game.scene.getScene("Game");
const h = setInterval(() => console.log(
  dev.Equipment.equippedWeight + " kg →",
  Math.round(gs.player.body.speed), "px/s"), 500);
```

⚠ **Sprawdzaj w RUCHU po prostej i bez sprintu** — `body.speed` to długość
wektora prędkości, więc przy chodzeniu po skosie z kolizją terenu zobaczysz
mniej niż wzór. Kolizja i sieć mnożą się z karą masy.

### Trening ciężkiego pancerza na potrzeby testu

```js
dev.Progression.skillPoints += 6;    // ⚠ przypisanie NIC NIE OGŁASZA
dev.Progression.emitAttributes();    // ← ogłoszenie ręczne, patrz tabela wyżej
dev.ArmorTraining.learn();           // ranga I  (1 pkt) — regeneracja
dev.ArmorTraining.learn();           // ranga II (2 pkt) — wysiłek
dev.ArmorTraining.learn();           // ranga III(3 pkt) — RUCH
dev.ArmorTraining.rank               // 3
```

⚠ **Rangi są liniowe** — `learn()` kupuje zawsze następną, nie da się wziąć
samej trzeciej. Cofnięcie: `dev.ArmorTraining.reset()`.

### Siła na potrzeby testu

```js
dev.Progression.skillPoints += 20; dev.Progression.emitAttributes();
for (let i = 0; i < 20; i++) dev.Progression.spendPoint("strength");
dev.Progression.strength
```

⚠ **`spendPoint` emituje, przypisanie do `strength` nie.** Przy Sile 20
i najcięższym dostępnym zestawie kanał WYSIŁKU spada do zera — to nie usterka,
tylko zasada Modelu D (`docs/systemy/stamina.md` §6).

## Zadania

```js
dev.Quests.accept("rabbit_hunt")
dev.Quests.logQuests()               // co jest w dzienniku
dev.Quests.getStatus("rabbit_hunt")
dev.Quests.recordKill("rabbit")      // zalicz zabójstwo bez polowania
```

⚠ **`EnemyType` jest po ANGIELSKU**, mimo że nazwy w grze są polskie:
`"rabbit"`, `"boar"`, `"bear"`, `"wolf"`, `"greywolf"`, `"spider"`,
`"venomspider"`, `"training_dummy"`. Polskie id nie zadziała i **nie zgłosi
błędu** — `recordKill` po prostu nic nie zaliczy.

## Wydajność

```js
dev.perf.overlay()      // licznik FPS w rogu (element DOM, nie napis Phasera)
dev.perf.watch(15)      // percentyle + LICZNIK ZACIĘĆ przez 15 s
dev.perf.scene()        // rozmiar listy wyświetlania, liczba obiektów Text
```

⚠ **Średnie FPS to zła miara ścinania.** 58 FPS potrafi ukryć dwadzieścia
klatek po 40 ms, a to zupełnie inna naprawa niż „za dużo rysowania". Dlatego
raport podaje percentyle i zacięcia, a nie samą średnią.

---

## Rozkład kątów ciosów — `P1` (tarcze)

```js
dev.guard.start()       // zacznij zbierać (czyści poprzednią próbkę)
// …pograj kilka walk RÓŻNEGO typu…
dev.guard.n()           // ile ciosów zebrano
dev.guard.raport()      // histogram kąta + TABELA PROGÓW + zobowiązanie własne
dev.guard.stop()        // przestań zbierać (próbka zostaje)
dev.guard.wznow()       // ⭐ PO F5 / przeładowaniu: podejmij poprzednią próbkę
```

⭐ **Próbka przeżywa przeładowanie strony** (odkładana do `localStorage`, klucz
`rpg-guard-p1` — ⚠ **poza przestrzenią `rpg-save*`**, bo to pomiar, nie stan
postaci). Bez tego pojedyncze F5, przeładowanie z HMR po edycji kodu albo crash
kasowały kilkadziesiąt minut grania, bez ostrzeżenia.
⛔ **Wznowienie jest JAWNE i nigdy nie dzieje się samo** — `start()` zawsze
zaczyna od zera i czyści odkładkę. Ciche sklejenie dwóch sesji grania zmieniłoby
okno pomiaru w środku, a raport nadal wyglądałby poprawnie.

⚠⚠ **`n` to ciosy KLASYFIKOWALNE do rozkładu FRONT/BOK/TYŁ** — decyzja
metodologiczna autora (2026-09-15). Cios bez kierunku nie ma kąta; unik
i `immune` mają kąt, ale nie są starciem z gardą. ⛔ **Żadne z nich nie wchodzi
do mianownika** — ani do progu 100, ani do procentów w rozkładzie. Raport
wypisuje je osobną linijką, żeby widać było, ile odrzucono.

⚠ **Ale ZOSTAJĄ W PRÓBCE.** `record` zapisuje każdy cios i tak ma zostać:
próbki niepełnej nie da się przeliczyć według innej reguły bez powtórzenia
rozgrywki, a rozgrywka jest tu jedynym zasobem, którego nie da się odtworzyć.

⚠ **Sam instrument jest sprawdzony osobno: `node tools/p1_instrument.mjs`**
(⛔ wymyślone próbki, **nie** dane `P1` — test arytmetyki raportu, nie pomiar).

**Po co.** Tożsamość dwóch projektowanych konstrukcji tarcz (**Okrągła**,
**Pawęż**) stoi na osi ŁUKU, a jedyny pomiar, jaki projekt ma
(`block 89,4% · parry 5,5% · dodge 5,2%`), pochodzi z `tools/combat_benchmark.mjs`
— czyli z **napastnika ustawionego na wprost**. ⛔ Nie wiadomo, czy w grze ciosy
w ogóle przychodzą pod różnymi kątami. Pełny kontekst: `docs/tarcze_checkpoint.md`
(`P1`, krok 0).

⚠⚠ **Jedna walka z królikiem NIE jest próbką.** Minimum to **≥100 ciosów
z określonym kierunkiem** (docelowo 150–200) i starcia różnego typu — **sfora
wilków krąży, dzik szarżuje na wprost, sieciarz strzela**. Próbka z jednego
gatunku odpowie na pytanie o ten gatunek, nie o grę.
⚠ **Raport sam ostrzega**, gdy `n` z kierunkiem jest poniżej progu, i podaje,
ile punktów procentowych waży jeden cios. Pełny protokół zbierania (rozkład
sytuacji, czego się nie liczy): `docs/tarcze_checkpoint.md`.

⚠ **Tabela progów jest tu ważniejsza od histogramu.** Pokazuje, co tarcza
złapałaby przy progach **innych** niż dzisiejsze 60/100 — to jest materiał do
decyzji `B3` (45 / 90 / 135), której licznik pod dzisiejszymi progami nie
potrafiłby dostarczyć.

⚠ Liczone jest **każde** przyjęcie ciosu, także unik i parowanie. ⛔ Nie licz
tego z `DamageResult.zone` — gałęzie `immune` i `dodge` wpisują tam `"back"`
na sztywno, więc odczyt po werdykcie zawyżałby „tył" o całe 5,2% uników.

---

## Gotowe przepisy

### Przetestować Uderzenie tarczą od zera

Umiejętność ma **trzy** bramki: poziom 3, nauka u Patryczka i **tarcza
w drugiej ręce**. Jedna linijka załatwia wszystkie:

```js
dev.Inventory.addGold(5000); dev.Progression.addXp(5000); dev.Skills.learn("shield_work"); dev.Inventory.addItem("buckler", 1); dev.Equipment.equip("buckler")
```

Kolejność jest wiążąca: `learn` pobiera 90 g i 1 punkt, `equip` szuka w plecaku.

**Sprawdzenie bramki sprzętowej** — zdejmij tarczę i naciśnij przycisk:
powinno paść „Potrzebujesz tarczy", a **cooldown i stamina mają NIE zejść**
(odmowa wychodzi przed `startCooldown`). Jeśli zeszły, to jest usterka.

Projekt i liczby: `docs/systemy/abilities.md`.

### Postać „gotowa do testów walki"

```js
dev.Inventory.addGold(9999); dev.Progression.addXp(20000); dev.Progression.skillPoints += 30; dev.Progression.emitAttributes(); dev.Progression.emitXp()
```

Potem naucz się, czego trzeba (`dev.Skills.learn(...)`) i dokup sprzęt.

### Przejść całą drogę Biegłości bez farmienia

Cel: zobaczyć **okno zakupu → sufit → powiadomienie → trener → wyższy sufit**
bez 187 walk z wilkiem. Sufit bez rangi to 50, okno otwiera się na 40, więc
postaw `P` tuż pod oknem i dobij resztę ręcznie:

```js
dev.Inventory.addGold(9999); dev.Progression.addXp(20000); dev.WeaponProficiency.set("sword", 39)
```

Potem bij cokolwiek, co uczy (wilk, dzik, skoczek, niedźwiedź). **Na `P = 40`**
oferta u Patryczka staje się gotowa (wiersz „Mistrzostwo broni" → „1 do
odblokowania"), a `P` rośnie dalej normalnie. **Na `P = 50`** ma paść napis
„sufit biegłości 50 — dalsza praktyka PRZEPADA"; kolejne ciosy przypominają
o tym nie częściej niż raz na 20 s.

⚠ **Te dwa momenty są od siebie niezależne i tak ma być** — okno daje czas,
sufit zatrzymuje `P`.

⚠ **Manekin tej drogi nie przejdzie** — uczy tylko 10 punktów od `P_start`
(§14b), więc kukła nie dowiezie postaci do żadnego progu. To jest projekt, nie
usterka.

### Powtarzać jedną umiejętność bez czekania

```js
dev.Abilities.reset()
```

Po każdym użyciu. Bez tego pomiar rytmu umiejętności o 14-sekundowym
cooldownie zajmuje więcej czasu niż sama zmiana, którą mierzysz.

---

## Czego tu NIE MA i gdzie tego szukać

| czego szukasz | gdzie |
|---|---|
| `npm run dev` / `build` / `tsc` / bramki regresji | `CLAUDE.md`, „Polecenia i weryfikacja" |
| zrzuty ekranu i sprawdzanie OSTROŚCI pikseli | `CLAUDE.md`, tamże (`snapshotArea`) |
| pomiary klatek — pełne uzasadnienie | `CLAUDE.md` + `src/core/Perf.ts` |
| co zmienia który singleton | `src/core/CLAUDE.md` |

⚠ **Nie przepisuj tu poleceń z `CLAUDE.md`.** Dwa opisy tego samego rozjeżdżają
się zawsze, a `diff` tego nie widzi — projekt zapłacił już za to raz
(`AGENTS.md`, patrz `docs/archiwum/`).

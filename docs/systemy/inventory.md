---
typ: STAN
domena: inventory
tytul: Plecak i lalka — pojemnik, granica, odmowa
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:sklep_cofniecie]
kotwice:
  - src/core/Inventory.ts
  - src/core/Equipment.ts
  - src/core/Quality.ts
  - src/core/Save.ts
  - src/ui/PaperDoll.ts
  - GameConfig.INVENTORY.slots
  - GameConfig.INVENTORY.maxSlots
  - GameConfig.INVENTORY.stackSize
  - GameConfig.EQUIPMENT_LOAD.base
otwarte: [OI-59, OI-60]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

# Plecak i lalka — pojemnik, granica, odmowa

> **Czym jest ten dokument.** Odpowiedzią na pytanie **gdzie leży przedmiot,
> ile się go mieści i co się dzieje, gdy się nie mieści**: plecak, lalka, torby,
> granica między nimi i polityka odmowy.
>
> **Czym NIE jest.** ⛔ **Nie mówi, czym przedmiot JEST** — to `items`. Nie
> powtarza ani jednej reguły stamtąd; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| **gdzie** przedmiot leży i ile się mieści | **`inventory`** |
| co się dzieje, gdy plecak jest pełny | **`inventory`** |
| co znaczy „założony" i jak przedmiot przechodzi granicę | **`inventory`** |
| czym przedmiot **jest**: typ, pola, jakość, trwałość, waga, wymagania | `items` |
| co **robi** obciążenie z kosztem wysiłku | `stamina` §6 |
| czy obciążenie ma ruszać prędkość | ✅ **rusza** — `stamina` §6 (Model D) |
| ile przedmiot kosztuje i za ile idzie | `economy` |
| kształt zapisu, wersja, reguła addytywna | `save` |
| siatka, przewijanie, przeciąganie, progi gestu | `ui`, `input` *(OI-54)* |
| co i skąd wypada | `creatures`, `world` |

⚠⚠ **Ta domena nie zna ani jednej właściwości przedmiotu.** Pyta `items`
o cztery rzeczy — typ *(czy się stakuje)*, jakość, trwałość *(czy wolno łączyć)*
i pojemność torby — i o nic więcej.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `inventory` **bierze** | `items` | typ, jakość, trwałość, wagę, wymagania |
| `inventory` **daje** | `stamina` | sumę wag **założonego** i klasę obciążenia |
| `inventory` **daje** | `combat` | co jest w rękach *(broń, druga ręka)* |
| `inventory` **daje** | `economy` | pojemnik, w którym mieści się zakup |
| `inventory` **daje** | `quests` | odpowiedź „zmieści się?" **przed** zobowiązaniem |
| `inventory` **oddaje do** | `save` | plecak, lalkę i torby jako stan |

---

## 1. Dwa pojemniki i jedna granica

```
PLECAK   tablica slotów, indeksowana; slot = JEDEN egzemplarz albo pusto
LALKA    dziesięć nazwanych slotów + CZTERY sloty toreb
```

⚠⚠ **Lalka jest cienką warstwą nad plecakiem, nie drugim stanem.** Przedmiot
założony **po prostu nie leży w plecaku** — zakładanie i zdejmowanie to
**przeniesienie przez jedną granicę**, więc złoto i reguły stosu zostają
w jednym miejscu.

⚠⚠ **Sloty toreb są celowo POZA listą slotów lalki.** Ta lista jest iterowana
przy sumowaniu wagi, obrony, premii i przy zapisie — torba wpięta do niej
**przestroiłaby po cichu koszt uniku i sprintu**. Torba robi dokładnie jedną
rzecz: **podnosi pojemność plecaka**.

⚠ **Adresowanie jest INDEKSEM, nie nazwą** — odkąd dwa miecze w plecaku mogą się
różnić wykonaniem i zużyciem, „załóż miecz" jest instrukcją niejednoznaczną.
⚙ Interfejs zawsze wie, **w który kafel** gracz trafił, więc mówi to wprost.

⚠ **Wyjątkiem jest wiązanie szybkiego slotu: ono trzyma NAZWĘ, nie indeks.**
Stosy wędrują między slotami, więc indeks po cichu zacząłby wskazywać co
innego; nazwa przeżywa też wyczerpanie zapasu — kontrolka gaśnie i **sama się
uzbraja**, gdy gracz uzupełni.

---

## 2. Pojemność jest WYLICZANA

```
pojemność = baza + suma pojemności założonych toreb
```

⚠⚠ **Nikt nie przypisuje długości plecaka.** Jest dokładnie jedno wejście,
którym pojemność rośnie i maleje, i wyłącznie lalka przez nie woła.

⚠⚠ **Zmniejszenie pojemności bywa ODMÓWIONE — i to jest sedno tej domeny.**
Zdjęcie torby jest odrzucane w całości (⛔ **nie częściowo**), gdy po skurczeniu
którykolwiek zajęty slot wypadłby poza plecak **albo** nie zostałoby miejsca dla
samej torby.

⭐ **Powodem jest zakaz auto-reorganizacji.** System, który wolno by mu było
przestawić rzeczy gracza w dół, **nigdy nie musiałby odmawiać** — i to jest
dokładnie cena, której ta gra nie płaci.

⚠ **Odmowa musi umieć powiedzieć ILE brakuje**, dlatego pytanie „czy się uda"
jest osobne od samej operacji i **niczego nie zmienia**.

⚠ **Zakładanie torby rośnie PRZED wszystkim innym**, żeby wymiana torby na
równą albo większą nie wyglądała przez moment na „pełno". ⚙ Gdy wychodząca
torba nie ma dokąd wrócić, **cała wymiana jest cofana** — nic się nie stało.

⛔ **Sufit pojemności NIE jest nigdzie egzekwowany.** Deklarowana liczba ma
**jednego czytelnika: panel**, który buduje tyle kafli. Wejście podnoszące
pojemność nie zna jej wcale; sufit trzyma się dziś **arytmetyką zawartości**
(cztery sloty × największa torba + baza), nie regułą (OI-59).

---

## 3. Stos: kiedy dwie sztuki są tą samą rzeczą

⚠⚠ **Ten sam identyfikator już nie wystarcza.** Dwie sztuki łączą się w stos
tylko wtedy, gdy mają **to samo wykonanie** — a wszystko, co ma trwałość, jest
odrzucane **z założenia**: dwa nadwerędzone miecze nie mogą stać się stosem
dwóch bez wymyślenia trwałości dla kupki.

⚠ **Cztery typy nie stakują się nigdy** *(broń, pancerz, amulet, torba)* —
każda sztuka bierze własny slot. ⚙ Amulet nie stakuje się **mimo że pierścienie
tak**: liczba nad ikoną obiecywałaby, że można mieć drugi.

⚠ **Reguła jest jawna, nie przypadkowa.** Broń i pancerz i tak mają stos
o rozmiarze jeden — zapis wprost zaczyna działać w chwili, gdy jakość dostanie
cokolwiek innego.

⚠ **Ręczne przenoszenie ma trzy wyniki i żaden nie gubi sztuki:** puste →
**przenieś**; to samo i jest miejsce → **dolej, resztę zostaw**; cokolwiek
innego → **zamień miejscami**.

---

## 4. Granica: co przechodzi i w którą stronę

⚠⚠ **Zdjęty przedmiot wraca TYM SAMYM egzemplarzem.** Puszczenie go przez
zwykłe „dodaj przedmiot" oddałoby graczowi sztukę **fabrycznie nową** — czyli po
cichu naprawiłoby to, czym walczył.

⚠⚠ **Wymagania sprawdza się PRZED wyjęciem z plecaka.** Odwrotna kolejność
kasuje przedmiot przy odmowie — ta sama klasa błędu, co pobranie zapłaty za
naukę, która się nie odbywa.

⚠ **Bramka dwuręczności musi być sprawdzona OSOBNO od pytania „czy ten slot to
przyjmie".** Gdy pytanie o konkretny slot odmówi, wybór slotu **spada do reguły
domyślnej**, która i tak wskaże drugą rękę — i tarcza weszłaby mimo zakazu.

⚠ **Broń dwuręczna opróżnia drugą rękę dopiero po wyjęciu z plecaka**, bo
miejsce dla odkładanej tarczy bierze się **częściowo ze slotu, który sama
zwolniła**. Rachunek odmowy liczy dokładnie tak samo, więc odłożenie nie może
się nie udać.

---

## 5. Pełny plecak: dwie polityki, nie jedna

⚠⚠ **Wybór polityki zależy od tego, czy po drugiej stronie stoi ZOBOWIĄZANIE.**

| sytuacja | polityka |
|---|---|
| nagroda za zadanie, przekazanie od NPC | ⛔ **sprawdź z góry i ODMÓW w całości** — zadanie nie może zostać rozliczone w połowie |
| zakup | ⛔ **sprawdź z góry**; ⚙ dodatkowo zapłata jest **zwracana** za to, co nie weszło, żeby pełny plecak nie zjadł złota po cichu |
| gotowanie | ⚙ **wykonaj i cofnij**, gdy wynik nie ma gdzie wejść — surowiec wraca |
| znalezisko z ziemi, zbieractwo | ⚙ **przyjmij, ile wejdzie**; reszta zostaje na ziemi |

⚠⚠ **Sprawdzenie wyniku jest za późne dla zobowiązania** — to, co weszło, już
jest w plecaku. Dlatego pytanie „czy zmieści się wszystko" istnieje osobno
i **niczego nie zmienia**.

⚠ **Dwa różne pytania o miejsce:** „czy zmieści się N sztuk **tego**" dolicza
istniejące stosy, „ile jest **wolnych** pól" odpowiada o dwie **różne** rzeczy.
⛔ Dwa pytania pierwszego rodzaju policzyłyby to samo pole dwa razy.

✅ **Częściowe podniesienie z ziemi zostawia RESZTĘ na ziemi** (`Loot.take`,
OI-58 zamknięte 2026-10-09 — dawniej całe znalezisko znikało).

---

## 6. Co waży

⚠⚠ **Waży wyłącznie to, co na sobie.** Plecak, torby i ich zawartość **nie ważą
ani grama** — to decyzja projektowa, nie uproszczenie: gracz ma móc **nosić
dużo**, a płacić za to, co **ma na sobie**.

⚠ Suma wag założonego porównuje się z udźwigiem liczonym z Siły; wynik wpada
w jedną z trzech klas. ⛔ **Ile ta klasa robi i czemu dotyka — nie należy do tej
domeny** *(`stamina` §6 — Model D, cztery kanały)*.

⚠ **Przekroczenie udźwigu NIE jest bramką.** Nic się nie odmawia — rośnie
wyłącznie koszt wysiłku.

---

## 7. Odtworzenie stanu

⚠⚠ **Zapisany slot bywa dwóch kształtów i oba są legalne**: sama nazwa
*(sprzed jakości)* albo pełny egzemplarz. Pierwszy wraca jako sztuka **zwykła
i nienaruszona** — ⭐ „nic, co gracz już ma, nie staje się gorsze".
⚠ **Nieznana nazwa gubi JEDEN slot, nigdy cały zapis.**

⚠⚠ **Pojemność wolno przy wczytaniu tylko DOPEŁNIĆ, nigdy skurczyć** — skrócenie
odcięłoby realne przedmioty, a wczytanie nie ma prawa kasować stanu.

⚠⚠ **Wczytanie pisze wprost w sloty lalki, omijając każdą bramkę** — jedyne
takie miejsce w kodzie i dlatego jedyne, które sprząta po sobie. ⚙ Sprzątanie
jest **tolerancyjne**: przy pełnym plecaku druga ręka **zostaje na sobie**.
⭐ **Akcję wolno odmówić; stanu, który już istnieje — nie.**

---

## 8. Niezmienniki

- **N-174** — **założone NIE JEST w plecaku**; lalka to warstwa nad
  pojemnikiem, nie drugi stan (§1).
- **N-175** — **sloty toreb poza listą slotów lalki**; torba nie waży, nie
  chroni, nie daje premii (§1, §6).
- **N-176** — **slot adresuje EGZEMPLARZ**, nie nazwę; jedyny wyjątek to
  wiązanie szybkiego slotu (§1).
- **N-177** — **pojemność jest wyliczana**, nigdy przypisywana (§2).
- **N-178** — ⛔ **zero auto-reorganizacji**: system woli **odmówić** niż
  przestawić rzeczy gracza (§2).
- **N-179** — **odmowa mówi, ILE brakuje**; pytanie o wykonalność jest osobne
  (§2, §5).
- **N-180** — **stos wymaga tej samej jakości i braku trwałości** (§3).
- **N-181** — **zdjęte wraca tym samym egzemplarzem**, ze swoim zużyciem (§4).
- **N-182** — **wymagania sprawdzane PRZED wyjęciem z plecaka** (§4).
- **N-183** — **zobowiązanie z góry; znalezisko wolno przyjąć częściowo** (§5).
- **N-184** — **pojemność przy wczytaniu tylko rośnie** (§7).
- **N-185** — **akcję wolno odmówić, stanu nie wolno skasować** (§7).

---

## 9. Checklista

**Nowy przedmiot noszony:** ⚠ czy się **stakuje** (N-180) · czy istnieje slot,
który go przyjmie *(`items` N-13)* · ⚠ jeśli nie waży, powiedz to **wprost** (§6).

**Nowa droga do plecaka:** ⚠ politykę pełnego plecaka wybierz **po tym, czy stoi
za nią zobowiązanie** (N-183) · ⛔ nie sprawdzaj wyniku po fakcie (§5).

**Nowy slot lalki:** ⚠ **najpierw sprawdź, czy istnieje przedmiot, który w niego
wejdzie** — jeśli nie, jego miejsce jest w `DOLL_CELLS` jako `planned`, nie
w `EquipSlot` *(`items` N-13)*. ⚠ rozstrzygnij, czy wchodzi do listy iterowanej
przy wadze i zapisie (N-175).

**Nowa torba albo piąty slot torby:** ⛔ **policz sufit** — nic go nie pilnuje
poza liczbą kafli w panelu (OI-59).

**Nowy gabaryt przedmiotu:** ⛔ **nie wyprowadzaj go z `hands` ani ze slotu** —
deklaruje go przedmiot (§11; broń średnia i duża = `1×2`).

**Bramki:** `npx tsc --noEmit` · `npm run build` · `node tools/gabaryt_przymiar.mjs`
*(geometria i atomowość)* · `node tools/sklep_cofniecie.mjs` *(arytmetyka
i **atomowość** cofnięcia, §5)* · `node tools/doc_check.mjs`.

---

## 10. Panel: co jest stałe, a co liczone

Pełny zapis decyzji i odrzuconych układów:
`docs/decyzje/2026-09-11-ekwipunek-fundament.md`. Tu tylko to, co wiąże się
z modelem pojemnika:

- ⚠ **Układ lalki jest DANYMI** (`DOLL_CELLS` — jedna sylwetka panelu
  i sklepu od 2026-10-13), geometrię liczy `computeInventoryLayout`. Widocznych kafli **20 na telefonie, 32 na
  monitorze** — pojemność się przez to NIE zmienia.
- ⚠⚠ **KOLUMNY nie są liczone z okna** (§11) — panel dopasowuje kafel i liczbę
  widocznych WIERSZY.
- ⚠ **Filtr = zakładki + WIDOK filtrowany** (`OI-130`): `slots` nietknięte,
  przestawianie tylko w „Wszystko” (§7/§8; `src/ui/ItemCategory.ts`).
- ⚠ **`weapon2`/`offhand2` (`STOW_SLOTS`)** stoją poza listą lalki: nie chronią
  i nie dają premii. Patrz `docs/systemy/weapons.md`.
- ⚠ **Kafle `planned`** (pas) są w UKŁADZIE, nie w `EquipSlot`;
  `slotHasItems()` ożywia je same, gdy powstanie pierwszy taki przedmiot.
- ⚠ **Panel bierze rozmiar z okna RAZ**; późniejsze zmniejszenie dopasowuje go
  SKALĄ (`PanelBase.reposition`), co przy skali ≠ 1 próbkuje tekst.

## 11. Gabaryt: ile pól zajmuje jeden przedmiot

⭐⭐ **`INVENTORY.cols` = 4 to GEOMETRIA MODELU, nie układ ekranu.** ⛔ Nie
przenoś tej liczby do UI: sąsiad pionowy to `i + cols`, więc zmienne kolumny
znaczą, że **ten sam zapis układa się inaczej na telefonie i na zwężonym oknie**.
⚠ `slots[]` zostaje PŁASKIE; geometria jest logiczną warstwą nad nim.

**Gabaryt (`inventoryFootprint`) to przestrzeń zajmowana przez jeden przedmiot.**
⛔ Niezależny od slotu Equipment, `hands`, `grip`, masy i statystyk — deklaruje
go przedmiot, nie wyprowadza kod. ⚠ Brak pola = `1×1`.

⭐⭐ **Przedmiot leży w `slots` WYŁĄCZNIE pod KOTWICĄ**; resztę pól wyprowadza
`anchorCovering` i **nie zapisuje się jej osobno**. ⛔ Żadnych znaczników ani
kopii — „duch drugiej połowy" jest tu niewyrażalny. ⭐ Dlatego **format zapisu
i `SAVE_VERSION` się nie zmieniły, a stare zapisy są kompatybilne**.

⚠ **Placement, move, remove i swap respektują CAŁY gabaryt**; upuszczone pole
staje się nową kotwicą, a dotknięcie drugiej połowy trafia do kotwicy.
⛔ Nie mieści się → odmowa i zero zmian; **żadnego przycinania ani przesuwania**.
⚠ `canSetCapacity` i `freeSlotCount` pytają o PRZYKRYCIE — pojemność liczy się
w ZAJĘTYCH POLACH, nie we wpisach.

⚠ **Plecak pozostaje slotem Equipment** i określa POJEMNOŚĆ (§2); nie jest
elementem siatki.

⚠ **UI dopasowuje KAFEL i liczbę widocznych WIERSZY**, nigdy liczbę kolumn —
z dolną granicą `HUD_LAYOUT.minTouch` (48 dp). ⚠ Konsekwencja na telefonie:
**4 kolumny zamiast 5**; to jest **świadoma cena determinizmu**, nie regres.

⛔⛔ **Dziś istnieją WYŁĄCZNIE `1×1` i `1×2`.** Nie ma `2×1`, `2×2`, większych
gabarytów, obracania, Tetrisa, automatycznego przesuwania ani przycinania.
⚠ Kształt `{ w, h }` da się rozszerzyć — ⛔ to nie jest zatwierdzony zakres.
✅ **`1×2`: broń > 45 cm, duże tarcze** (`OI-123`); ikona 32×64
⟺ `1×2`. ⚠⚠ **Zamiana w lalce nie jest 1:1** (`OI-124`): `canFitAll`
przed `takeAt`, odkładanie `returningFor`.

Bramka: `tools/gabaryt_przymiar.mjs`. Powody i odrzucone warianty:
`docs/decyzje/2026-09-18-gabaryt-w-plecaku.md`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| plecak jako tablica slotów; slot = egzemplarz | ✅ | ✅ | `kod:2026-09-06` |
| lalka jako warstwa nad plecakiem | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| sloty toreb poza listą lalki | ✅ | ✅ | `kod:2026-09-06` |
| pojemność wyliczana z toreb | ✅ | ✅ | `kod:2026-09-06` |
| odmowa zdjęcia torby, zero auto-reorganizacji | ✅ | ✅ | ❌ **brak przymiaru** |
| **sufit pojemności** | ❌ **nieegzekwowany** | ✅ *(opisane po raz pierwszy)* | ❌ — OI-59 |
| stos tylko przy tej samej jakości | ✅ | ✅ | `kod:2026-09-06` |
| trzy wyniki przenoszenia bez gubienia sztuki | ✅ | ✅ | ❌ **brak przymiaru** |
| zdjęte wraca tym samym egzemplarzem | ✅ | ✅ | `kod:2026-09-06` |
| wymagania przed wyjęciem z plecaka | ✅ | ✅ | `kod:2026-09-06` |
| bramka dwuręczności sprawdzana osobno | ✅ | ✅ | `kod:2026-09-06` |
| dwie polityki pełnego plecaka | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| częściowe podniesienie z ziemi | ✅ reszta zostaje | ✅ | `runtime:2026-10-09` |
| zwrot zapłaty za to, co nie weszło | ✅ | ✅ | ✅ `przymiar:sklep_cofniecie` *(arytmetyka)* |
| waży wyłącznie założone | ✅ | ✅ | `kod:2026-09-06` |
| unia kształtów zapisanego slotu | ✅ | ✅ | `kod:2026-09-06` |
| pojemność przy wczytaniu tylko rośnie | ✅ | ✅ | `kod:2026-09-06` |
| tolerancja pełnego plecaka przy wczytaniu | ✅ | ✅ | `kod:2026-09-06` |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-58** | ✅ **ZAMKNIĘTE 2026-10-09** — reszta zostaje na ziemi (`Loot.take`); zmierzone w silniku: 5 sztuk, miejsce na 3 → 3 w plecaku, 2 na ziemi, po zwolnieniu miejsca znika. |
| **OI-59** | ⚠ **Sufit pojemności nie jest nigdzie egzekwowany.** Deklarowana liczba ma **jednego czytelnika i jest nim panel**, który buduje tyle kafli; wejście podnoszące pojemność nie zna jej w ogóle. ⚙ Dziś sufit trzyma się **arytmetyką zawartości** — cztery sloty razy największa torba plus baza dają dokładnie tę liczbę. ⚠ Jedna większa torba albo piąty slot dają sloty, których panel nie ma czym narysować, **przy stanie i zapisie, które je mają**. ⭐ Ta sama klasa co „niezmiennik zapisany jako LICZBA umiera po cichu". ⛔ **Decyzja AUTORA**: czy sufit ma być regułą, czy pozostać wynikiem zawartości. ⛔ Przymiaru nie zbudowałem. |
| **OI-60** | ⚠⚠ **Trzy pozycje z listy „czego świadomie NIE MA" w `docs/ekwipunek_mechanika.md` §7 zostały ZBUDOWANE**: sloty na torby, waga i obciążenie, oraz wysiłek. ⚠ Przy wadze **nieaktualne jest także uzasadnienie** („dotyka prędkości gracza") — obciążenie nie rusza dziś prędkości *(OI-48)*. ⛔ **To jest lista BARIEREK, nie backlog** — czytana jest po to, żeby nie proponować rzeczy odrzuconych, więc starzeje się **w najgorszą stronę**: broni pokojów, które już stoją. ⛔ **Nie edytowałem tego pliku** — należy do `items`/`stamina`, a misja nie obejmowała migracji `docs/`. |

---

## Czego ten dokument nie rozstrzyga

- **Czym jest przedmiot** — typ, pola, jakość, trwałość, waga jako liczba,
  wymagania: `items`.
- **Co robi obciążenie** z kosztem wysiłku i czy ma ruszać prędkość —
  `stamina` §6, `movement`.
- **Czy 16 slotów, cztery torby i sufit to dobre liczby** — to jest balans,
  a torby nie mają jeszcze ustalonych cen.
- **Cen, kursów i opłacalności** — `economy`.
- **Kształtu zapisu i wersjonowania** — `save`.
- **Siatki, przewijania i progów gestu** — `ui`, `input` *(OI-54)*.
- **Co i skąd wypada** — `creatures`, `world`.
- ⛔ **Żadnego pojedynczego przedmiotu, torby ani slotu** — to jest content.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| pojemność, sufit, zakaz auto-reorganizacji, stany brzegowe | `docs/inventory_scroll_ux.md` §3, §7–§9 | ACTIVE |
| dlaczego torby stoją poza listą slotów lalki | `src/core/Equipment.ts` *(przy kodzie)* | ACTIVE |
| dlaczego egzemplarz, a nie nazwa; unia kształtów | `src/core/Quality.ts`, `docs/jakosc_wykonania.md` | ACTIVE |
| tolerancja pełnego plecaka przy dwuręczności | `docs/systemy/weapons.md` R-6 | ACTIVE |
| reguły zapisu, których ta domena jest klientem | `docs/systemy/save.md` §3 | ACTIVE |
| co przedmiot wnosi i czym jest | `docs/systemy/items.md` | ACTIVE |
| dawne reguły ekwipunku | `docs/ekwipunek_mechanika.md` | ⚠ ACTIVE z wyjątkiem §7 — **trzy pozycje nieaktualne** (OI-60) |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_inventory.md` | — |

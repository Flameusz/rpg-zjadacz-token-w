---
typ: HISTORIA
domena: ui
tytul: Sklep — migracja na wzorzec tapnięcia
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-27
---

# Sklep: migracja na wzorzec „tapnięcie zaznacza" — plan wdrożenia

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/ui.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: ✅ WDROŻONE 2026-08-27, CZEKA NA PLAYTEST RĘKĄ.** `tsc`,
`npm run build` i `tools/sklep_cofniecie.mjs` czyste; ⚠ **nie zweryfikowane
w działającej grze** — panel przeglądarki tej sesji nie uruchamia Phasera
(`document.hidden`, pętla nie startuje). Przed uznaniem za zamknięte: **§7**.

> **Zakres zamknięty przez autora:** ruszamy **wyłącznie warstwę wejścia
> i prezentacji** w `ShopPanel`. **NIE ruszamy:** cen, asortymentów,
> `stockQuality`, `Inventory`, drag&drop.
>
> **Rozszerzony przez autora 2026-08-27 o dwie rzeczy z §6**, jako „problemy
> bezpośrednio związane z doświadczeniem zakupowym": **K5** (arytmetyka
> cofnięcia) i **U1/U3/U4** (brakujące informacje na karcie). Reszta §6 dalej
> czeka na osobną decyzję.

## Co weszło — mapa na kod

| etap | gdzie | uwaga |
|---|---|---|
| E0 kotwica karty | `ShopPanel.cardAnchor(side)` | wariant A; komentarz z rachunkiem stoi w konstruktorze |
| E1 koniec zakupu na tapnięcie | `buildMerchantGrid` | ⚠ patrz poprawka w E1: zapowiadany „podwójny zakup" nie istniał |
| E2 zaznaczenie + ramka | `selectMerchantSlot`, `markSelectedCells`, `GridSlot.box` | ramka dostała **obie** siatki, nie tylko kupca |
| E3 przycisk „Kup" | `showMerchantCard` | odmowa nazywa powód: `Brakuje Xg` / `Plecak pełny` |
| E4 karta przeżywa zakup | `onClick` przycisku „Kup" | odbudowa PO powrocie z `buy()`, nigdy w listenerze |
| E5 licznik ilości | `showMerchantCard` | start od **1**; sufit = zasobność **i** jeden stos |
| E6 podpisy i sprzątanie | podpis panelu, komentarze | „klik, by kupić" przestało być prawdą |
| K5 cofnięcie | `lastTransaction.quality`, `undoLastTransaction`, `takeBackBought` | + `tools/sklep_cofniecie.mjs` |
| U1/U3/U4 karta | `ItemTooltip.weightLines`, „Masz: N", `ShopPanel.paintGold` | `ItemTooltip` poprawia też plecak |

⚠ **Trzecia rzecz w K5, której plan nie przewidział:** `Inventory.removeItem`
zdejmuje po ID i bierze **pierwszy pasujący slot**, więc cofnięcie zakupu
potrafiło zabrać lepszą kopię tej samej broni, którą gracz miał wcześniej.
Stąd `takeBackBought` — po slocie i po jakości dla wszystkiego, co nie stakuje.

---

## 1. Co dokładnie jest do zmiany (stan zastany)

`ShopPanel` jest jedynym panelem, który nie przeszedł na wzorzec zapisany
w `src/ui/CLAUDE.md`: *„tapnięcie ZAZNACZA, a akcje stoją jako rząd przycisków
pod kartą"*. Strona kupca **nie ma stanu zaznaczenia w ogóle** — ma tylko
podgląd na najechanie (`attachTooltip`, `ShopPanel.ts:1221`) i natychmiastowy
zakup na `POINTER_UP` (`ShopPanel.ts:395-398`).

Strona gracza przeszła migrację i jest **wzorcem do skopiowania**:
`selectPlayerSlot` (przełącznik) + `showPlayerCard` (render) + `CardActions`
z licznikiem i ceną w podpisie.

⚠ **Rozdział `select*` / `show*Card` jest nośny, nie kosmetyczny.** `select`
przełącza (drugie tapnięcie w ten sam kafel odznacza), `show*Card` tylko
rysuje — dzięki temu licznik ilości może przerysować kartę **bez** zmiany
zaznaczenia. Strona kupca potrzebuje tej samej pary.

---

## 2. Jedna decyzja przed startem: GDZIE stoi karta kupca

⚠ **To nie jest szczegół — to jedyna rzecz w tej migracji, która może ją
zepsuć.** Pomiary z kodu:

| element | zakres X w przestrzeni panelu (panel 816 j.) |
|---|---|
| lewa krawędź treści | −408 |
| **siatka kupca** (5 × 46 + 4 × 6 = 254) | **−327 … −73** |
| prześwit między kolumnami | −73 … +84 |
| siatka gracza (4 × 52 + 3 × 8 = 232) | +84 … +316 |
| rząd ZAŁOŻONE (292) | +54 … +346 |
| **karta** (`cardAnchor()` = lewa krawędź panelu, szer. do 250) | **−408 … −158** |

**Karta zasłania 169 z 254 jednostek siatki kupca — trzy pełne kolumny z pięciu
plus część czwartej.** Dziś to nie boli, bo po stronie kupca nie ma czego
zaznaczać. Po migracji zaznaczenie towaru **schowa towar**, łącznie z kaflem,
który trzeba tapnąć ponownie, żeby odznaczyć.

Trzeciej kolumny na kartę **nie ma** i to jest policzone: 254 + 292 + 250 +
odstępy = 856 j. treści przy 776 dostępnych (patrz konstruktor `ShopPanel`).
Poszerzenie panelu do 896 podniosłoby minimalną proporcję okna do ~1,55:1 —
odrzucone wcześniej i nie wracamy do tego.

### ✅ Wariant A — WYBRANY PRZEZ AUTORA 2026-08-27 — karta staje po stronie PRZECIWNEJ do zaznaczenia

Zaznaczenie u kupca → karta przy **prawej** krawędzi (nad kolumną gracza).
Zaznaczenie w plecaku / na rzędzie ZAŁOŻONE → karta przy **lewej**, jak dziś.

- **Reguła w jednym zdaniu: karta zakrywa tę kolumnę, której właśnie nie
  używasz.** Kupując patrzysz na półkę i na kartę; plecak jest wtedy nieistotny.
  Sprzedając jest odwrotnie.
- Zgodne z regułą „karta ma JEDEN adres" **w jej intencji**: ta reguła mówi, że
  *najechanie i zaznaczenie* nie mogą stawiać karty w dwóch miejscach. Tu obie
  drogi dla danej strony dają ten sam punkt — trzeba tylko przekazać `side`
  także do `attachTooltip`.
- Koszt: `cardAnchor(side)` zamiast `cardAnchor()`, jedno miejsce.
- ⚠ `showFixed` przyjmuje **lewy górny róg**, a szerokość karty jest znana
  dopiero po zbudowaniu treści. Nie da się jej wyrównać do prawej krawędzi
  „dokładnie" — użyj stałej `panel.right − 250` (maksymalna szerokość karty),
  wąskie karty zostawią luz po prawej i to jest w porządku.

### ❌ Wariant B — ODRZUCONY 2026-08-27 — karta zostaje po lewej, dochodzi jawne odznaczenie

Zostaje zapisany, żeby nie wrócił jako „prostsze rozwiązanie" za dwie sesje.


Karta zasłania półkę, więc odznaczenie nie może wymagać trafienia w zasłonięty
kafel: łapacz tła panelu (tapnięcie w puste miejsce = `clearSelection()`) albo
dodatkowy wiersz „Zamknij" w `CardActions`.

- Tańsze w kodzie, gorsze w rękach: żeby obejrzeć drugi towar, gracz musi zrobić
  **dwa** gesty zamiast jednego, a półka miga w tę i z powrotem.
- ⚠ Łapacz tła to nowy obiekt wejściowy pod całym panelem — musi trafić
  **przed** ikony w liście kontenera, dokładnie z tego powodu, co strefy
  upuszczania (`buildDropZones`), inaczej połknie tapnięcia w kafle.

**Decyzja zapadła: wariant A. E2 jest odblokowane.**

---

## 3. Plan implementacji — etapy

Każdy etap kończy się stanem, który się kompiluje i daje się uruchomić.

### E0 — przygotowanie (bez zmian zachowania)

1. `cardAnchor()` → `cardAnchor(side: Side)` (wariant A) albo bez zmian
   (wariant B). Wszystkie dzisiejsze wywołania podają `"player"`.
2. Nic więcej. `tsc --noEmit` czysto.

### E1 — usunięcie zakupu z tapnięcia

W `buildMerchantGrid()` (`ShopPanel.ts:365`) skasuj **obie** linie:

```ts
icon.on(GAMEOBJECT_POINTER_DOWN, () => icon.setData("wasDragging", false));
icon.on(GAMEOBJECT_POINTER_UP,   () => { if (!icon.getData("wasDragging")) this.attemptBuy(icon); });
```

oraz `obj.setData("wasDragging", true)` w `onDragStart` (`ShopPanel.ts:1265`) —
po skasowaniu czytelnika ta flaga nie ma odbiorcy.

⚠ **POPRAWKA DO PIERWSZEJ WERSJI TEGO DOKUMENTU (2026-08-27).** Stało tu, że
flaga `wasDragging` nigdy nie działała, bo przy zerowych progach drag Phaser
emituje `DRAG_START` przed `POINTER_DOWN` — i że przez to przeciągnięcie na
pusty kafel kupowało dwa razy. **To było nieprawdziwe.** Rozumowanie
o Phaserze się zgadzało, przesłanka o progach nie: `PlayerPanel.ts:518`
ustawia `scene.input.dragTimeThreshold = 300` **na całą scenę UI**, a oba
panele żyją w `UIScene` i dzielą jedną wtyczkę wejścia. Przy progu czasowym
`processDragDownEvent` ustawia tylko `dragState = 2` i nie emituje nic —
`DRAG_START` przychodzi z kolejnego ruchu, po 300 ms, czyli zawsze PO
`POINTER_DOWN`. Flaga działała i podwójnego zakupu nie było.

⚠ **Lekcja, którą warto zabrać dalej: `input` jest PER SCENĘ**, więc dowolny
widżet w `UIScene` stroi wejście wszystkim pozostałym. Wartości `dragTimeThreshold`
szukaj w `src/`, nie w `main.ts`.

Flaga i tak znika: straciła jedynego czytelnika razem z zakupem na tapnięcie.

Po E1 sklepu **nie da się kupić tapnięciem** (drag nadal kupuje — patrz §5, R4).

### E2 — stan zaznaczenia po stronie kupca

Nowe pole `selectedMerchantIndex: number | null`, dopisane do `clearSelection()`
razem z pozostałymi dwoma.

```
selectMerchantSlot(i)   // przełącznik, mirror selectPlayerSlot
  └─ ten sam indeks? → clearSelection()
  └─ pusty kafel?     → clearSelection()
  └─ clearSelection(); selectedMerchantIndex = i; buyQty = 1; showMerchantCard(i)

showMerchantCard(i)     // tylko render, mirror showPlayerCard
  └─ tooltip.showFixed(itemId, cardAnchor("merchant"), makeInstance(itemId, 1, stockQuality(itemId)))
  └─ cardActions.show(tooltip.rect(), [ …stepper?, przycisk Kup ])
```

Podpięcie: `icon.on(GAMEOBJECT_POINTER_UP, () => this.selectMerchantSlot(i))`.

⚠ **`POINTER_UP`, nie `POINTER_DOWN`** — mimo że strona gracza używa `DOWN`.
Przy zerowych progach drag `DOWN` leci również na pierwszej klatce
przeciągnięcia, więc zaznaczenie zapalałoby się przy każdej próbie
przeciągnięcia towaru. (Strona gracza ma ten sam drobiazg; ujednolicenie w §6.)

⚠ **Kolejność zdarzeń dotyku jest po naszej stronie**: `UP` leci **przed**
`OUT`, więc `showFixed` zdąży ustawić `pinned` zanim `hidePreview()` spróbuje
zgasić kartę — i wtedy `pinned` go zablokuje. Nic dodatkowego nie trzeba.

Dorzuć podświetlenie kafla — dziś **żadna** siatka w sklepie nie pokazuje,
co jest zaznaczone (rząd ZAŁOŻONE koloruje ramkę jakością, ale nie
zaznaczeniem). Wzorzec gotowy: `PlayerPanel.markSelectedCell()` — ramka
`3 px UI.goldNum` na zaznaczonym, `2 px` kolor bazowy na reszcie. Wymaga
trzymania referencji do `box` w `GridSlot` (dziś `GridSlot` trzyma tylko
`icon` i `label`).

### E3 — przycisk „Kup"

```ts
const q     = this.stockQuality(itemId);
const unit  = buyPriceOf(itemId, q);          // TA SAMA funkcja, co kafel i karta
const koszt = unit * qty;
const brak  = koszt - Inventory.gold;
const mieR  = Inventory.hasRoomFor(itemId, qty, q);
```

| stan | podpis | `disabled` |
|---|---|---|
| można kupić | `Kup (n) — {koszt}g` | nie |
| za mało złota | `Brakuje {brak}g` | tak |
| brak miejsca | `Plecak pełny` | tak |

⚠ **Odmowa nazywa powód i przycisk zostaje WIDOCZNY** — reguła
`src/ui/CLAUDE.md`. Dziś nieudany zakup jest całkowicie cichy: `attemptBuy`
robi `return` bez słowa, bo `Inventory.buy` zwraca `false`.

⚠ **`Inventory.hasRoomFor` już istnieje i to wystarcza** — żadnej zmiany
w `Inventory`. Bez tego sprawdzenia `buy()` pobiera złoto, `addItem` zwraca
resztę i złoto wraca — transakcja przechodzi „w połowie" i wygląda jak zawieszka.

`onClick` woła istniejące `this.buy(itemId, qty)` (patrz E5 co do `qty`).

### E4 — karta przeżywa zakup

⚠ **`refresh()` woła `clearSelection()` bezwarunkowo** (`ShopPanel.ts:1339`),
a `Inventory.buy` emituje `inventoryChanged` **synchronicznie**. Bez tego kroku
każde tapnięcie „Kup" gasi kartę i gracz musi szukać kafla pod nią, żeby kupić
drugą sztukę.

Rozwiązanie ma precedens: `PlayerPanel.refreshSelectionCard()`. W `ShopPanel`
wystarczy wariant minimalny — **po udanym `buy()` przerysuj kartę kupca**:

```ts
onClick: () => { if (this.buy(itemId, qty)) this.showMerchantCard(i); }
```

Bezpieczne, bo `buy()` jest synchroniczne i `clearSelection()` z `refresh()`
zdąży się wykonać **przed** powrotem z `buy()`. Zaznaczenie kupca trzeba przy
tym przywrócić razem z kartą (`selectedMerchantIndex = i`) — inaczej ramka
zaznaczenia i karta rozejdą się o jedno tapnięcie.

⚠ Asortyment kupca jest **statyczny w trakcie wizyty** (`show()` buduje go raz),
więc indeks po zakupie wskazuje ten sam towar. Dla strony gracza taki powrót
byłby błędny (slot może zniknąć) i dlatego **nie** rozszerzamy tego teraz na
sprzedaż — patrz §6.

### E5 — licznik ilości (opcjonalny, wydzielony celowo)

Dla towaru stackowalnego (`!sellsOneAtATime(def.type)`) dodaj `CardStepper` nad
przyciskiem, dokładnie jak przy sprzedaży.

⚠ **Wartość startowa to 1, a NIE maksimum — odwrotnie niż przy sprzedaży,
i to jest zamierzone.** Sprzedaż startuje od pełnego stosu, bo intencja brzmi
„zostaw mi kilka". Przy zakupie ta sama symetria znaczyłaby „wydaj wszystko, co
masz" na pierwszym tapnięciu — czyli dokładnie ten rodzaj zaskoczenia, który ta
migracja likwiduje.

`max` = ile gracza stać (`Math.max(1, Math.floor(gold / unit))`); brak miejsca
w plecaku łapie przycisk swoim wyszarzeniem, nie licznik.

⚠ `Inventory.buy(itemId, qty, quality)` przyjmuje ilość od początku — **żadnej
zmiany w `Inventory`**. Zmienia się `ShopPanel.buy()`, które dziś ma `1` na
sztywno i zapisuje `lastTransaction.qty = 1`.

**Ten etap można wyciąć bez szkody dla reszty.** Jeśli scope się kończy, zostaw
zakup po jednej sztuce i dopisz to do `docs/odlozone.md`.

### E6 — podpisy i sprzątanie

1. Podpis panelu (`ShopPanel.ts:248`) — „klik, by kupić" przestaje być prawdą.
   Propozycja: `dotknij przedmiot, by zobaczyć opis i akcje` (jedna linia dla
   obu stron; przeciąganie zostaje, ale nie musi być reklamowane).
2. Komentarz `// Double click sells (a quick alternative to dragging)`
   (`ShopPanel.ts:474`) opisuje kod, który robi co innego od czasu poprzedniej
   migracji. Skasuj.
3. `docs/odlozone.md` — sekcja „⚡ NASTĘPNA SESJA" idzie do §6 archiwum
   z datą. ⚠ Jej drugi ⚠ („sprzedaż używa podwójnego tapnięcia", „naprawa
   odraczana o 300 ms") **jest już nieprawdziwy** — obie rzeczy zniknęły przy
   migracji strony gracza. Nie przepisuj go do archiwum jako faktu.
4. Wpis w `docs/dziennik.md`.

---

## 4. Kolejność prac i pliki

| # | etap | plik | ryzyko |
|---|---|---|---|
| 0 | ~~decyzja o kotwicy karty (§2)~~ | — | ✅ **wariant A, 2026-08-27** |
| 1 | E0 `cardAnchor(side)` | `src/ui/ShopPanel.ts` | zerowe |
| 2 | E1 usunięcie click-to-buy | `src/ui/ShopPanel.ts` | zerowe |
| 3 | E2 zaznaczenie + podświetlenie kafla | `src/ui/ShopPanel.ts` | średnie (kolejność zdarzeń, `GridSlot`) |
| 4 | E3 przycisk „Kup" | `src/ui/ShopPanel.ts` | niskie |
| 5 | E4 karta przeżywa zakup | `src/ui/ShopPanel.ts` | **wysokie (re-entrancy)** |
| 6 | E5 licznik ilości | `src/ui/ShopPanel.ts` | niskie |
| 7 | E6 podpisy, komentarze, docs | `ShopPanel.ts`, `docs/*` | zerowe |

**Kodu produkcyjnego dotyka dokładnie jeden plik: `src/ui/ShopPanel.ts`.**
`ItemTooltip`, `CardActions`, `Inventory`, `Quality`, `Npcs` — bez zmian.
To jest miara poprawności zakresu: jeśli otwierasz drugi plik, sprawdź, czy nie
wyszedłeś poza decyzję autora.

**Po każdym etapie:** `npx tsc --noEmit` i `npm run build` czysto.
⚠ Weryfikacja w silniku: podgląd w panelu przeglądarki bywa niesprawny
(zakładka „hidden", brak RAF) — wtedy jedyną drogą jest ręczny przebieg po
checkliście z §7.

---

## 5. Ryzyka

**R1 — karta zasłania półkę.** ✅ **Zamknięte wariantem A (§2).** Zostaje jedna
rzecz do sprawdzenia okiem: przy zaznaczeniu u kupca karta stoi nad kolumną
gracza, więc **zasłania plecak i rząd ZAŁOŻONE** — co jest zamierzone, ale
kolumna gracza ma 292 j. najszerszego elementu przy karcie do 250, więc
sprawdź na najdłuższej karcie w grze, czy nic nie wystaje poza panel.

**R2 — `refresh()` gasi zaznaczenie w środku transakcji.** `Inventory.buy`
emituje `inventoryChanged` synchronicznie, `refresh()` woła `clearSelection()`
bezwarunkowo. Odbudowa karty **musi** być po powrocie z `buy()`, nigdy
w handlerze zdarzenia — inaczej rysujesz kartę, którą `clearSelection()`
zgasi milisekundę później i objaw będzie wyglądał jak „czasem działa".

**R3 — `show()` przebudowuje siatkę kupca od zera** (`rebuildMerchantGrid`
niszczy ikony). `selectedMerchantIndex` musi być zerowany w `show()` **i**
w `hide()`, inaczej po wejściu do innego sklepu zaznaczenie wskazuje kafel
innego kupca.

**R4 — po migracji przeciągnięcie kupiec → plecak nadal kupuje natychmiast,
bez „Kup".** To wynika wprost z zakresu („nie ruszamy drag&drop") i **nie jest
przeoczeniem**, ale zostawia jedną drogę zakupu poza nowym wzorcem.
Ocena: **zostawić**. Przeciągnięcie jest gestem świadomym i kosztownym
(palec przenosi ikonę przez pół panelu), więc nie ma tej wady, którą miało
tapnięcie. ⚠ Ale to znaczy, że **„Cofnij" nadal jest potrzebne** i nie wolno go
przy okazji skasować jako „zbędnego po dodaniu Kup".

**R5 — wiersz `CardActions` ma 40 j. = 28 CSS px, poniżej progu Material
48 dp.** Nowy przycisk „Kup" dziedziczy ten dług. **Nie naprawiaj go tutaj** —
jest opisany w nagłówku `CardActions` razem z powodem (trzy wiersze po 68 j.
plus karta broni przekroczyłyby wysokość ekranu) i należy do osobnej zmiany.

**R6 — bardzo wysoka karta może zasłonić baner „Cofnij".** Karta startuje
40 j. pod górną krawędzią panelu, baner stoi na `undoY = 120`; karta broni
z pełnym porównaniem ma do ~300 j. **Wariant A zdejmuje to dla kupca** (baner
stoi w kolumnie kupca, karta idzie w prawo), ale **nie dla plecaka** — tam
karta dalej jest po lewej, nad banerem. Sprawdź na najdłuższej karcie w grze
(miecz z porównaniem do założonego), zaznaczonej ze strony gracza.

**R7 — `assertTouchTargets()` z `UIScene.create()` nie pokrywa paneli.**
Pilnuje geometrii prawego dolnego rogu, nie kart. Brak czerwonego światła nie
znaczy, że przycisk jest dotykalny.

---

## 6. Przegląd widoku sklepu — trzy kategorie

### 6.1 Konieczne (część migracji albo błąd)

| # | rzecz | dlaczego konieczne |
|---|---|---|
| K1 | zaznaczenie + karta + „Kup" po stronie kupca | sedno decyzji |
| K2 | **podświetlenie zaznaczonego kafla** w obu siatkach | dziś **żadna** siatka w sklepie nie pokazuje, co jest wybrane. Przy jednej karcie na dwie kolumny gracz nie ma jak sprawdzić, czy karta opisuje towar, czy jego własną rzecz. `PlayerPanel.markSelectedCell()` robi to od dawna |
| K3 | wyszarzony „Kup" z powodem (`Brakuje 15g` / `Plecak pełny`) | reguła katalogu; dziś nieudany zakup jest **całkowicie cichy** |
| K4 | podpis panelu i martwy komentarz o podwójnym kliknięciu | podpis będzie kłamał |

**K5 — błąd poza migracją, do osobnego commita: „Cofnij" liczy zwrot po cenie
BAZOWEJ, a kasa pobiera cenę SKALOWANĄ JAKOŚCIĄ.**

```ts
// undoLastTransaction, ShopPanel.ts:1171-1174
Inventory.addGold(def.buyPrice * t.qty);              // ← bazowa
// a buy() zapłaciło:
Inventory.buy(itemId, 1, this.stockQuality(itemId));  // ← buyPrice × QUALITY.priceMul[q]
```

`QUALITY.priceMul` = `{1: 0,55 · 2: 0,75 · 3: 1 · 4: 1,35 · …}`, a Kowal ma
`stockQuality: {weapon: [1,2], armor: [1,2]}`. Zmierzony przykład z komentarza
w tym samym pliku: **tarcza okuta — 140 g bazowo, pobierane 105 g przy jakości
2**. Kupno + Cofnij daje **+35 g na cykl, powtarzalne bez ograniczeń**.
U kupca z zakresem `[3,4]` błąd idzie w drugą stronę i „siatka bezpieczeństwa"
zabiera graczowi 35% ceny.

⚠ **Ta sama przyczyna psuje cofnięcie SPRZEDAŻY podwójnie**: `lastTransaction`
zapisuje `{itemId, qty, kind}` i **gubi jakość**, więc `Inventory.addItem(t.itemId,
t.qty)` oddaje przedmiot w jakości domyślnej. Sprzedaj Mistrzowski miecz i cofnij
— wraca Zwykły. W drugą stronę to darmowe ulepszanie: kup u Kowala jakość 1,
sprzedaj, cofnij → dostajesz jakość 3.

Poprawka jest mała (dopisać `quality` do `lastTransaction`, liczyć zwrot przez
`buyPriceOf`/`sellPriceOf`), ale **jest zmianą zachowania ekonomicznego** —
czyli formalnie poza zakresem tej decyzji. **Do rozstrzygnięcia przez autora,
osobno.** Nie doklejać do migracji: dwie zmiany w jednym commicie to dwie
rzeczy, których playtest nie rozdzieli. ⚠ Jeśli E5 (licznik) wchodzi **przed**
tą poprawką, błąd rośnie liniowo z ilością.

### 6.2 Małe usprawnienia UX/UI (tanie, poza zakresem decyzji)

| # | rzecz | koszt / uwaga |
|---|---|---|
| U1 | **Waga przedmiotu na karcie** — `weight` istnieje na sprzęcie i wpływa na koszt Uniku i Sprintu (`Equipment.totalWeight`), a `ItemTooltip` **nigdzie go nie wypisuje**. Kupując zbroję gracz nie widzi, ile go ona spowolni | jedna linia w `ItemTooltip.rebuild`; poprawia też plecak. ⚠ plik dzielony z `PlayerPanel` — osobny commit |
| U2 | **Ramka kafla w kolorze jakości** w obu siatkach. Rząd ZAŁOŻONE już tak robi (`equipBoxColor`), obie siatki mają ramkę płaską. U Kowala (jakość 1–2) to jest **jego charakterystyka**, dziś niewidoczna, dopóki nie tapniesz | `qualityColor` już zaimportowany w `ShopPanel` |
| U3 | **„Masz: 3"** na karcie towaru — `Inventory.countItem` istnieje. Bez tego nie widać, czy się już nie ma dziesięciu mikstur | jedna linia |
| U4 | **„Zostanie: Yg"** pod przyciskiem Kup | licznik złota jest u góry panelu, karta na dole — dwa spojrzenia zamiast jednego |
| U5 | ujednolicić zaznaczenie strony gracza na `POINTER_UP` | dziś `DOWN`, więc próba przeciągnięcia też zaznacza |
| U6 | `refreshSelectionCard()` dla wszystkich trzech zaznaczeń (pełna parytetowość z `PlayerPanel`) zamiast wariantu minimalnego z E4 | większa zmiana; sprzedaż wymaga sprawdzenia, czy slot jeszcze istnieje |

### 6.3 Pomysły na później (wymagają decyzji, nie kodu)

- **Cena bliżej góry karty.** Dziś „Cena zakupu" jest **pod** opisem, statystykami
  i wymaganiami, a „Cena sprzedaży" jeszcze niżej, przed porównaniem. Przy
  zakupie cena jest pierwszą liczbą, której gracz szuka. Zmiana dotyczy karty
  dzielonej z plecakiem, więc to decyzja o kolejności czytania w całej grze.
- **„Kup i załóż"** jako druga akcja pod kartą — sensowne dokładnie wtedy, gdy
  karta pokazuje porównanie na plus.
- **Potwierdzenie dla drogich zakupów** (np. powyżej 1/3 posiadanego złota).
  ⚠ Domyślnie **nie**: „Kup" jest już świadomą akcją, a drugie okno na dotyku
  uczy klikania „tak" bez czytania.
- **Koszt staminy broni na karcie** — czeka na strojenie staminy, dziś liczby
  by się zestarzały (`docs/stamina_model.md` §9.4).
- **Przewijanie panelu** — zaparkowane w `docs/inventory_scroll_ux.md`; dotyka
  obu kolumn i rośnie razem z asortymentem.

---

## 7. Ręczna checklista — ⚠ NIEWYKONANA, to jest warunek zamknięcia

⚠ **`tsc` i `build` nie widzą niczego z tej listy.** Zmiana jest w warstwie
wejścia i układu, a te dwie rzeczy przechodzą na zielono także wtedy, gdy karta
zasłania pół panelu albo przycisk nie reaguje. Automatem zweryfikowana jest
wyłącznie arytmetyka cofnięcia (`node tools/sklep_cofniecie.mjs`).

1. Tapnięcie towaru **nie kupuje** — pokazuje kartę i rząd przycisków.
2. Kafel zaznaczonego towaru ma widoczną ramkę; drugie tapnięcie odznacza.
3. Cena na kaflu = cena na karcie = kwota pobrana (sprawdź **u Kowala**, jakość
   1–2 — to tam rozjazd był już raz).
4. Brak złota → „Kup" wyszarzony z kwotą, nie cisza.
5. Pełny plecak → „Kup" wyszarzony z powodem, złoto **nie znika**.
6. Po zakupie karta zostaje, złoto na górze się zmienia, można kupić drugi raz
   bez szukania kafla.
7. Przejście kupiec → plecak → ZAŁOŻONE: jedna karta naraz, przyciski zawsze
   opisują to, co na karcie.
8. Przeciągnięcie kupiec → plecak (⚠ wymaga **300 ms przytrzymania** — próg
   `dragTimeThreshold` ustawiony przez `PlayerPanel` na całą scenę): kupuje raz,
   także upuszczone na **pusty** kafel, i nie zostawia po sobie zapalonej karty
   z gestu, który zaznaczeniem nie był.
9. Wyjście i wejście do innego sklepu: brak zaznaczenia z poprzedniej wizyty.
10. **Karta kupca stoi po PRAWEJ i nie wychodzi poza panel** przy najdłuższej
    karcie w grze (miecz z porównaniem do założonego). To jest jedyna rzecz
    z wariantu A, której nie da się policzyć z góry: `showFixed` dostaje lewy
    górny róg, a szerokość karty zależy od treści.
11. **Waga i „Obciążenie po założeniu"** zgadzają się z wierszem „Obciążenie"
    na ekranie postaci PO faktycznym założeniu tej rzeczy.
12. `window.dev.missing` puste, `load.totalFailed` = 0.

---
typ: HISTORIA
domena: [inventory, ui]
tytul: Inventory scrollowany — specyfikacja UX
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-26
---

# Inventory scrollowany — specyfikacja UX

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/inventory.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status: ✅ WDROŻONE 2026-08-26, czeka na playtest ręką.** Wszystkich osiem
> plików z §10 zmienionych, `npm run build` i `npx tsc --noEmit` przechodzą
> czysto. ⚠ **Nie zweryfikowane w działającej grze w tej sesji** — Browser
> pane tej sesji nie renderuje Phasera w tle (znany limit środowiska, patrz
> pamięć `browser-pane-headless-no-raf`), więc Testy 1–4 z briefu wdrożenia
> (16 slotów bez torby / torba +8 / blokada zdjęcia przy pełnym plecaku /
> drag bez przypadkowego scrolla) czekają na ręczne sprawdzenie w przeglądarce
> przez autora. Test 5 (assety) zweryfikowany statycznie: cztery pliki
> `icon_bag_1..4.png` istnieją pod ścieżkami z `ASSETS`.
>
> ⚠ **Dokument opisuje UX i niezmienniki, nie kolejność pracy.** Lista plików
> zmienionych stoi w §10.

## 1. Skąd to się wzięło

Rząd czterech slotów na torby istnieje w `PlayerPanel.buildBagSlots` od dawna
i jest **celowo bezczynny**. Komentarz przy nim wylicza, czego brakowało:

> *„there is no bag ITEM in the game, and `INVENTORY.slots` is a constant 16.
> Making these work is a real feature (a bag item type, a variable backpack
> size, a save shape that survives taking a full bag off), not a UI job."*

Ten dokument zamyka wszystkie trzy pozycje z tej listy.

⚠ **Podział Definition / Instance NIE jest częścią tej roboty — on już
istnieje.** `ItemId` jest unią literałów wyprowadzoną z `ITEMS` (`Items.ts`),
a `ItemInstance` (`Quality.ts`) niesie `quality` i `durability` konkretnego
egzemplarza. Torba dokłada się do tego modelu jako nowy `type`, nie jako nowy
model. Nie projektuj tego od nowa.

---

## 2. Model: unified inventory

**Jedna wspólna pula slotów. Torby podnoszą jej rozmiar. Żadnych osobnych
kontenerów per torba.**

Powód jest podwójny — projektowy i techniczny, i oba wskazują w tę samą stronę.

**Projektowo:** celem jest „prostota Eternium, progresja WoW, brak księgowości".
Osobne kontenery przywracają dokładnie tę księgowość, którą odrzucamy — pytanie
„w której torbie to leży" nie ma dobrej odpowiedzi na telefonie.

**Technicznie:** `Inventory.slots` **już jest jedną płaską tablicą**. Cały
system mówi tym językiem: `addItem` przelatuje ją liniowo, `moveSlot` operuje
na indeksach `from`/`to`, zapis serializuje ją jako jedną listę,
`PlayerPanel.bagSlotXY` liczy pozycję z `index % cols`. Kontenery per torba
wymagałyby zmiany `slots` na tablicę tablic i przepisania **wszystkich** tych
ścieżek plus adresowania w zapisie — różnica rzędu wielkości w nakładzie.

⚠ **Nie „optymalizuj" tego później na kontenery.** To nie jest uproszczenie
pierwszej wersji, tylko wybrany model docelowy.

---

## 3. Pojemność

```
bazowo               16
bag-1  sakiewka      +2
bag-2  torba         +4
bag-3  sakwa         +6
bag-4  plecak        +8
```

Cztery sloty toreb, **dowolna torba w dowolnym slocie** (bez ograniczeń per
slot — slot to slot). Bramką jest cena, nie reguła: cztery plecaki to
czterokrotny koszt plecaka.

**Sufit techniczny: 48 slotów** (16 + 4×8).

⚠ **48 to granica, którą system v1 ma OBSŁUŻYĆ, a nie liczba wynikająca
z balansu ekonomii.** Ile gracz realnie zdoła unieść, rozstrzygnie się osobno,
po playteście i po cenach toreb. Implementacja nie może zakładać żadnej innej
liczby ani zaszywać sufitu w kodzie — pojemność jest wyliczana z założonych
toreb i tyle.

⚠ **Torby NIE mają ciężaru i to jest decyzja, nie przeoczenie.**
`src/core/CLAUDE.md` niesie niezmiennik: *obciążenie liczy WYŁĄCZNIE
`EQUIP_SLOTS` — plecak, dodatkowe plecaki i skrzynia nie ważą w walce ani
grama*. Sloty toreb muszą więc stać **poza `EQUIP_SLOTS`** (patrz §9), bo ta
lista jest iterowana przez `totalWeight`, `totalDefense`, `sumBonus` i zapis.
Wpięcie toreb do niej przestroiłoby po cichu koszt uniku i sprintu — czyli
model staminy, który czeka na playtest, a nie na zmiany.

Z tego samego powodu definicja torby **nie dostaje** pól `weight`, `requires`
ani `durability`. Brak `durability` wyłącza zużycie automatycznie —
`hasDurability` jest sterowane obecnością pola, nie typem.

---

## 4. Geometria — stałe okno widoku

Bez zmian wobec dzisiejszych liczb, i to jest celowe:

```
kafel        64 j.
przerwa       8 j.
kolumny       4
szerokość   280 j.   (4·64 + 3·8)
OKNO WIDOKU 280 j.   ← 4 rzędy, ZAWSZE, niezależnie od pojemności
skok rzędu   72 j.
```

⚠ **Okno 280 j. jest niezmiennikiem, nie liczbą do strojenia.** Równa się
wysokości lalki, a `PlayerPanel:1076` mówi wprost: *„The doll and the grid are
deliberately the SAME height (280px). That equality is not a coincidence to be
tuned away — it is what makes the two columns read as one object."*

| pojemność | rzędy | wysokość treści | zakres przewijania |
|---|---|---|---|
| 16 | 4 | 280 | **0 — brak paska** |
| 24 | 6 | 424 | 144 |
| 32 | 8 | 568 | 288 |
| 48 | 12 | 856 | 576 |

Przy 16 slotach ekran jest **piksel w piksel dzisiejszy**: pasek chowa się sam
(`overflows === false`), zero regresji dla gracza bez toreb.

### Dlaczego nie rozciąganie panelu

Rozważone i **wykluczone arytmetycznie**, nie odrzucone z gustu.

`UI_SCALE.designShortAxis = 580` jest **wyprowadzone z wysokości tego panelu**
(`GameConfig.ts`): *realny zasięg pionowy to 542 px… plus po ~13 px marginesu
daje 580, czyli panel zajmuje 93% krótszej osi*. Powiększenie panelu podnosi
`designShortAxis`, a to przeskalowuje **cały interfejs** — każdy panel, HUD,
`resolution` tekstu.

Projekt już raz tam był, ten sam plik notuje wynik: *„Wcześniej stało tu 720
i było to za agresywne: dawało 0,57 i tekst schodził do ~7,4 px CSS.
**Zgłoszone jako nieczytelne.**"* Siatka dla 24 slotów (424 j., +144) dałaby
`designShortAxis` ≈ 724, czyli dokładnie tamtą regresję.

Ucieczka w mniejszy kafel też jest zamknięta: `HUD_LAYOUT.minTouch` = 68 j.,
a kafel ma **64** — jest już 6% pod własnym progiem projektu.

### Dlaczego nie strony

⚠ **Pojemność zmienia się w trakcie gry, więc granice stron by się
przesuwały.** Zdejmujesz sakwę (+6) → strona 2 kurczy się z 16 do 10 →
przedmiot „drugi od góry na stronie 2" jest teraz gdzie indziej. Przy 24 i 48
ostatnia strona jest poszarpana. To jest ta sama księgowość, tylko schowana
w układzie. Scroll nie ma granic, więc nie ma czego przesuwać.

---

## 5. Model gestów

Wszystkie trzy gesty startują identycznie — palec ląduje na kaflu — więc
rozstrzyga je maszyna stanów, nie osobne handlery.

### Progi

| stała | wartość | uzasadnienie |
|---|---|---|
| `LONG_PRESS_MS` | **300** | Android domyślnie 500 — za wolno dla gry; 300 jest wyczuwalne i nie irytuje |
| `HOLD_SLOP` | **8 j.** | ruch ponad to **przed** progiem anuluje podniesienie → przewijanie |
| `TAP_SLOP` | **4 j.** | istniejący próg z dziennika zadań (`questDragDist > 4`), bez zmian |

`HOLD_SLOP` > `TAP_SLOP` celowo: utrzymanie kciuka nieruchomo przez 300 ms jest
trudniejsze niż nieruszenie go w trakcie szybkiego tapnięcia.

### Przejścia

```
pointerdown na kaflu
   └─ zapamiętaj pointerId, czas, pozycję          → PENDING

PENDING
   ├─ ruch > HOLD_SLOP ......................... → SCROLLING  (anuluj zegar)
   ├─ 300 ms upłynęło, ruch ≤ HOLD_SLOP ........ → DRAGGING   (+ feedback §7)
   ├─ pointerup, ruch ≤ TAP_SLOP ............... → TAP → zaznacz
   └─ pointerup, ruch > TAP_SLOP ............... → nic

SCROLLING
   ├─ ruch ..................................... przesuwaj listę 1:1
   └─ pointerup / POINTER_UP_OUTSIDE ........... → koniec

DRAGGING
   ├─ ruch ..................................... ikona podąża, podświetl cel,
   │                                              auto-przewijanie (§6)
   └─ pointerup ................................ upuść albo cofnij do źródła
```

### Trzy reguły uzupełniające

1. **Pusty kafel nie czeka 300 ms.** Nie ma czego podnieść, więc `pointerdown`
   na pustym slocie wchodzi od razu w `SCROLLING`. Przewijanie chwytem za puste
   miejsce jest natychmiastowe — to główny sposób przewijania.
2. **Tapnięcie w pusty kafel czyści zaznaczenie** (pustka to brak zaznaczenia).
3. **Zaznaczenie przeżywa przewijanie.** Karta przedmiotu zostaje przypięta
   (`ItemTooltip.showFixed`), także gdy zaznaczony slot wyjedzie poza okno.

### ⚠ Nie używaj `input.dragTimeThreshold`

Phaser ma wbudowane `scene.input.dragTimeThreshold`, które wygląda na gotową
odpowiedź na „długie przytrzymanie". Dwa powody, żeby tego nie brać:

- jest **globalne dla sceny** — objęłoby też lalkę i `ShopPanel`;
- **opóźnia start przeciągania, ale nie daje wykluczenia z przewijaniem.**
  W ciągu tych 300 ms handler przewijania i tak działa, więc lista zdąży się
  przesunąć, zanim drag wystartuje, i trzeba by ją cofać.

Maszyna stanów wyżej musi być własna. Wzorzec śledzenia `pointer.id` jest
w projekcie — `VirtualJoystick` i `AbilityBar`.

---

## 6. Przewijanie i przeciąganie

### Przewijanie

- **Śledzenie 1:1, bez bezwładności.** Parytet z dziennikiem zadań, który tak
  działa i nikt nie zgłaszał braku.
- ⚠ **`GAMEOBJECT_POINTER_WHEEL`, nie `GAMEOBJECT_WHEEL`** — to drugie jest
  zdarzeniem wtyczki sceny o innej sygnaturze i podpięte do obiektu **po cichu
  nigdy nie odpala**.
- ⚠ **Przelicz przez `uiScale()`** (`p.y / uiScale()`), inaczej lista przewija
  się wolniej, niż porusza się palec.
- **Nasłuch ruchu i puszczenia na poziomie SCENY**, z `POINTER_UP_OUTSIDE` —
  palec przewijający natychmiast zjeżdża z kafla, na którym wystartował.
- **Pasek**: ślad + uchwyt, oba `setVisible(overflows)`; wysokość uchwytu
  `max(24, (okno/treść) · okno)`.
- **Pozycja przewinięcia trwała** między otwarciami panelu — to ta sama lista.
  (Inaczej niż filtry dziennika, gdzie zmiana filtra zeruje przewinięcie, bo
  zmienia się treść.)
- **Zacisk** do `[0, treść − 280]`. Przy 16 slotach zakres to 0.

### Auto-przewijanie przy krawędzi — **wymagane**

Bez tego przeniesienie przedmiotu z rzędu 1 do rzędu 12 jest fizycznie
niemożliwe.

```
pas górny:  górne 40 j. okna
pas dolny:  dolne 40 j. okna
prędkość:   2 → 6 j./klatkę, proporcjonalnie do zanurzenia w pasie
```

Przy pełnym zakresie 576 j. przelot krawędzią trwa ~1,6 s. Środkowe 200 j. okna
to strefa neutralna.

### Cele upuszczenia

- **Podświetlenie zapala się przy PODNIESIENIU, nie przy najechaniu** (palec
  zasłania kafel): cyjan = pasuje, czerwony = zły slot lub niespełniony wymóg.
  Istniejąca reguła panelu, bez zmian.
- **Lalka i rząd toreb leżą poza maską** — pozostają poprawnymi celami
  w trakcie przewijania siatki.
- **`bagIndex` w `setData` zostaje poprawny** przy przewijaniu (indeks nie
  zależy od pozycji ekranowej). Nic tu nie wymaga zmiany.
- **Upuszczenie poza jakikolwiek cel** = powrót ikony do slotu źródłowego, bez
  komunikatu.

### ⚠ Kafle poza oknem MUSZĄ tracić wejście

Maska przycina **rysowanie, nie trafianie**. Przy 48 slotach 32 niewidoczne
kafle zostałyby aktywnymi celami upuszczenia — pod tytułem panelu, pod
zakładkami, pod rzędem toreb. Przedmiot upuszczony „obok" trafiłby w slot,
którego nie widać.

**Na każdym przewinięciu przełącz `input.enabled` dla OBU obiektów każdego
slotu poza oknem**: ramki `dropZone` **i** ikony. Precedens to
`TopicPanel.syncRowInput`, ale tam jest jeden obiekt na wiersz — tutaj dwa na
slot.

---

## 7. Sprzężenie zwrotne

| moment | sygnał |
|---|---|
| próg 300 ms osiągnięty | ikona ×1,15 + slot źródłowy przygasa do α 0,4 |
| ten sam moment | `navigator.vibrate(10)` — **za strażnikiem `if ('vibrate' in navigator)`** |
| w trakcie ciągnięcia | ikona nad wszystkim (istniejące podniesienie z depth) |
| upuszczenie poprawne | dźwięk `ui-click` |
| upuszczenie odrzucone | powrót + komunikat z powodem (istniejąca ścieżka `flash`) |

⚠ **Wizualne podniesienie jest obowiązkowe, wibracja opcjonalna.** Bez sygnału
w momencie progu gracz nie wie, że wszedł w tryb przeciągania — puszcza palec,
myśląc, że gest nie zadziałał. Projekt nie używa dziś wibracji nigdzie;
`navigator.vibrate` działa w Android WebView bez wtyczki Capacitora, ale na
desktopie nie istnieje, stąd strażnik.

**Licznik pojemności** w nagłówku plecaka: `zajęte / pojemność` (np. `23/32`),
gdzie zajęte to `slots.filter(s => s !== null).length`.

---

## 8. Stany brzegowe

| sytuacja | zachowanie |
|---|---|
| **pojemność 16** | brak paska, brak przewijania, ekran identyczny z dzisiejszym |
| **zdjęcie torby, przedmioty nie mieszczą się** | **ODMOWA** + komunikat „Opróżnij N miejsc" |
| **zdjęcie torby, jest miejsce** | przechodzi; lista skraca się, przewinięcie zaciśnięte do nowego maksimum |
| **założenie torby** | lista się wydłuża, przewinięcie bez zmian, nowe sloty na dole |
| **pełny plecak + nagroda z questa** | istniejąca reguła bez zmian: awans etapu czeka na miejsce |
| **zaznaczony przedmiot wyjeżdża poza okno** | karta zostaje przypięta; kafel po powrocie nadal podświetlony |
| **przewijanie w trakcie przeciągania** | tylko przez auto-przewijanie krawędzią |

⚠ **Zero wyrzucania przedmiotów, zero automatycznego przenoszenia.** Odmowa
zdjęcia torby jest jedyną dopuszczalną odpowiedzią na brak miejsca. Precedens
jest w `src/core/CLAUDE.md` przy `Save.load`: **akcję wolno odrzucić, stanu
który już istnieje — nie.** Wypchnięcie przedmiotów na ziemię albo ciche
skasowanie nadmiaru łamie tę regułę.

Odmowa musi **nazwać powód** — przycisk niedostępny jest w tym interfejsie
wyszarzony i widoczny z uzasadnieniem, nigdy ukryty (`src/ui/CLAUDE.md`).

---

## 9. Niezmienniki architektury

1. ⚠ **Sloty toreb stoją POZA `EQUIP_SLOTS`.** Osobna lista (`BAG_SLOTS`).
   Powód w §3 — `EQUIP_SLOTS` jest iterowane przez cztery obliczenia, z których
   żadne toreb nie chce.
2. ⚠ **`Inventory` NIE MOŻE importować `Equipment`.** Dziś zależność jest
   jednokierunkowa (`Equipment` → `Inventory`); odwrócenie tworzy cykl i daje
   `undefined` przy starcie modułów. Wzorzec, którego projekt już używa dla
   tego samego problemu: `Stamina` nie importuje `Progression`, tylko dostaje
   pulę **wstrzykniętą** przez `syncMax`. Analogicznie `Equipment` po zmianie
   toreb woła `Inventory.setCapacity(...)`.
3. ⚠ **Nowe pole zapisu jest OPCJONALNE, bez podbijania `SAVE_VERSION`.**
   Tak weszły `quality`, `durability`, `quickSlot`, pierścienie, `offhand`,
   `gloves` i `amulet`. Podbicie wersji dla pola addytywnego kasuje realny
   postęp za zero zysku.
4. ⚠ **Torby nie stakują się.** `Inventory.maxStack` stakuje dziś wszystko, co
   nie jest `weapon`/`armor`/`amulet`, do 20 sztuk — torby muszą dołączyć do
   listy wyjątków.
5. ⚠ **Siatka wymiarowana z ŻYWEJ pojemności, nie z `INVENTORY.slots`.**
   I musi **ostrzegać w konsoli**, gdy wyjdzie poza panel: `src/ui/CLAUDE.md`
   notuje, że rząd ekwipunku przerósł panel po cichu przez dwa dodania slotu,
   a ostatni pierścień wisiał poza ramką bez jednego błędu.

---

## 10. Pliki zmienione

Kolejność od danych do UI — stan po wdrożeniu 2026-08-26.

| # | plik | zmiana |
|---|---|---|
| 1 | `src/config/GameConfig.ts` | 4 przedmioty `type: "container"` (sakiewka/torba/sakwa/plecak, `containerSlots` 2/4/6/8) + 4 wpisy w `ASSETS`; `INVENTORY.maxSlots = 48` |
| 2 | `src/core/Assets.ts` | 4 pozycje w tablicy ładowania ikon |
| 3 | `src/core/Items.ts` | `containerSlots(id)` w stylu `itemHands` |
| 4 | `src/core/Inventory.ts` | `capacity`, `canSetCapacity`, `freeSlotCountBelow`, `setCapacity(n)`; `maxStack` — torby niestakowalne |
| 5 | `src/core/Equipment.ts` | `BAG_SLOTS`/`BagSlot` **poza** `EQUIP_SLOTS`; `bagSlotFor`/`acceptsBag`/`equipBagFromBag`/`unequipBag`/`bagUnequipRefusal`; `EVENT.bagsChanged` |
| 6 | `src/core/EventBus.ts` | nowe zdarzenie `bagsChanged` |
| 7 | `src/core/Save.ts` | pole `bags` **opcjonalne**, `SAVE_VERSION` nietknięty; pojemność po wczytaniu domykana do tego, co niosą wczytane torby |
| 8 | `src/ui/PlayerPanel.ts` | `bagGridList` + maska + okno 280 j.; maszyna stanów gestów (`beginGridGesture`/`onGridPointerMove`/`onGridPointerUp`); auto-przewijanie przy drag; `syncSlotIO`; ożywiony rząd toreb (`bagEquipWidgets`); licznik `zajęte/pojemność` |
| 9 | `src/ui/ShopPanel.ts` | strona GRACZA w sklepie: `Inventory.slots.length` zamiast stałej, `playerGrid` jako własny kontener + `rebuildPlayerGrid()` przy zmianie pojemności (patrz §12) |
| 10 | `src/ui/ItemTooltip.ts` | etykieta typu i wiersz „Miejsca: +N" dla `container` |

**Zweryfikowane:** `npm run build` i `npx tsc --noEmit` czyste. **Nie zweryfikowane**: render w działającej grze — patrz notka na górze pliku.

---

## 11. Poza zakresem v1

- **Sortowanie** — przy 48 slotach przycisk „Sortuj" będzie chciany, ale ręczne
  przenoszenie zostaje i wystarcza na start.
- **Bezwładność przewijania** — świadomie pominięta, parytet z dziennikiem.
- **Przenoszenie wielu przedmiotów naraz, dzielenie stosów** — nie było
  w decyzjach.
- **Finalny limit pojemności dla gracza** — patrz §3, to decyzja ekonomii, nie
  systemu.

---

## 12. Znalezisko przy wdrożeniu: `ShopPanel` też zakładał stałą pojemność

Nie było w specyfikacji, bo specyfikacja mówiła o `PlayerPanel`. Podczas
wdrożenia okazało się, że **`ShopPanel` ma DRUGI, niezależny widok całego
plecaka** — kolumna „PLECAK" po prawej, do sprzedawania. Jej siatka była
budowana **RAZ, w konstruktorze**, z liczbą kafli zamrożoną na `INVENTORY.slots`
w chwili otwarcia sklepu pierwszy raz w sesji.

**Sama literalna podmiana `INVENTORY.slots` → `Inventory.slots.length` w
`geom()` NIE naprawiała tego** — zmieniała liczbę, którą `geom()` zwraca, ale
`buildPlayerGrid()` i tak już się nie wywoła drugi raz. Gracz, który założyłby
torbę, miałby sloty 17+ realnie w plecaku, ale **niewidoczne i niesprzedawalne
w sklepie** — martwa strefa bez błędu, dokładnie ten tryb awarii, przed którym
ostrzega `src/ui/CLAUDE.md`.

**Naprawa:** ten sam wzorzec, którego `ShopPanel` już używa dla strony
KUPCA (`rebuildMerchantGrid()`, bo stan kupca też się zmienia po
konstruktorze) — `playerGrid` dostał własny kontener, `rebuildPlayerGrid()`
przebudowuje go, gdy `refresh()` zauważy rozjazd `playerSlots.length` vs
`Inventory.slots.length`, i doszywa też `playerDropZone`.

⚠ **Świadomie NIE dodane: przewijanie w `ShopPanel`.** To byłaby ta sama
robota drugi raz, w drugim pliku, poza tym, o co proszono. Panel ma stałą
wysokość (500 j.) i przy pojemności wyraźnie ponad bazowe 16 kolumna GRACZA
może wyjść poza dolną krawędź — kolumna KUPCA rośnie tak samo od dawna i nikt
tego nie ograniczał, więc to nie jest nowa klasa problemu, tylko stary problem
odziedziczony przez nową, wyższą pojemność. Dodany strażnik (`console.warn` w
`rebuildPlayerGrid`, wzorzec `dolnyLimit` z `buildEquipRow`) **zgłasza to
głośno zamiast pozwolić ciszej ściąć się na ekranie**. Jeśli finalny limit
pojemności z §3 wyjdzie wyraźnie ponad 16-20, `ShopPanel` potrzebuje własnego
przejścia na scroll — osobna sesja, ten sam wzorzec co §4–§6 tego dokumentu.

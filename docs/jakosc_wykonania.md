---
typ: HISTORIA
domena: items
tytul: Jakość wykonania — analiza przed wdrożeniem
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-12
---

# Jakość wykonania przedmiotów — analiza koncepcji

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/items.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


Status (2026-08-12): **zaimplementowane i zaakceptowane** (`src/core/Quality.ts`
+ integracja w Equipment/Inventory/Save/ShopPanel/ItemTooltip/PlayerPanel).
Ten dokument opisuje analizę, która poprzedziła wdrożenie — liczby i
rozstrzygnięcia poniżej odpowiadają temu, co faktycznie stoi w kodzie, chyba
że zaznaczono inaczej. Zewnętrzna ocena (użytkownik + ChatGPT) zaakceptowała
architekturę bez zmian; konkretne poprawki z tej oceny są w
`docs/jakosc_wykonania_ocena.md` i podsumowane niżej:

- **Zachowano** wpływ jakości na obrażenia/obronę/tempo ataku/wymóg Siły/
  trwałość — to świadoma decyzja, nie tylko "obrażenia i obrona".
- **Naprawiono kolizje zaokrągleń** (np. kij Zwykła=Dobra, sztylet
  Mistrzowska=Arcymistrzowska): `instanceDamage`/`instanceDefense` w
  `Quality.ts` już nie zaokrąglają — rzut kością (`Player.rollDamage`, teraz
  `Phaser.Math.FloatBetween`) i redukcja obrażeń pancerza liczą się na
  pełnej precyzji, zaokrąglanie jest wyłącznie na wyświetlaniu
  (`Quality.formatStat`, jedna cyfra po przecinku tylko gdy potrzebna).
  Procenty w `QUALITY.modifiers` NIE zostały zmienione.
- **Dodano minimalną naprawę** (Opcja B z oceny ChatGPT): pojedynczy klik na
  założonej, zużytej broni w `ShopPanel` u sprzedawcy oferującego broń —
  koszt proporcjonalny do brakującej trwałości (`Quality.repairCost`,
  `EQUIPMENT.durability.repairPriceFraction`). Bez systemu rzemiosła, bez
  dopasowania kowal↔kategoria — to zostaje otwartym pytaniem (§5.2 niżej).
- **Bez zmian na razie**: krzywa cen pancerza (identyczna z bronią), typy
  pancerza (tylko skóra/stal), podział broni wg materiału — do rewizji
  dopiero po realnych testach ekonomii, nie na podstawie samej tabeli.
- **Faza 1b (§3.2) rozstrzygnięta — fabularnie, nie przez okrojenie stocku.**
  Kowal zostaje przy pełnym asortymencie (broń/stal/pierścienie); sprzeczność
  z jego własnymi słowami zamyka nowy temat rozmowy `bron_skad`
  (`GameConfig.ts`, `BLACKSMITH.topics`) — nie kuje tego sam, bierze od
  wędrownych kupców (płacą też żelazem) i od ludzi przynoszących znaleziska.
  `stockQuality` 1-2 zostaje bez zmian, teraz czytelne jako "towar z drugiej
  ręki". Zero zmian w `stock`, zero nowej grafiki.

---

## 1. Koncepcja w skrócie (wersja autora)

| Poziom | Jakość | Mod. statystyk | Trwałość |
|---:|---|---:|---:|
| 1 | Podła | −15% | 70% |
| 2 | Niska | −8% | 85% |
| 3 | Zwykła | 0% | 100% |
| 4 | Dobra | +5% | 115% |
| 5 | Wysoka | +10% | 135% |
| 6 | Mistrzowska | +15% | 160% |
| 7 | Arcymistrzowska | +20% | 200% |

Założenia autora:
- z 1 przedmiotu robi się 7,
- broń zużywa się: **przy każdym udanym ataku losowanie**, czy spada trwałość;
  liczba punktów i szansa zależą od jakości,
- poziomy **5–7 na razie nieużywane** — rezerwa na nagrody z zadań,
- **kowal ze wsi nie zna się na broniach i pancerzach** — naprawia młyn i kuje
  rzeczy dla wsi; coś wykuje, ale słabe,
- kowal zyskuje cel (naprawa), ekonomia dostaje balans,
- **faza 1: tylko jakość wykonania.**

---

## 2. Co ta koncepcja robi dobrze

**Mnoży zawartość bez grafiki.** 6 broni + 8 sztuk pancerza to dziś 14
przedmiotów; z jakością to 14 pozycji o różnej wartości i cenie, przy zerowym
koszcie artystycznym. W projekcie, w którym każdy nowy potwór to arkusz
sprite'ów, to najtańsza zawartość, jaka jest dostępna.

**Daje Kowalowi zawód zamiast asortymentu.** Dziś Kowal jest automatem
sprzedającym: otwierasz, kupujesz, wychodzisz i nie masz powodu wracać.
Naprawa to **usługa**, a usługa jest jedyną rzeczą, która robi z NPC miejsce,
do którego się wraca.

**Domyka drenaż złota.** Ekonomia ma dziś dokładnie cztery wydatki: sprzęt
(jednorazowo), mikstury, dwie umiejętności i 10% przy śmierci. Po kupieniu
młota i stalowego kompletu **nie ma na co wydawać** — złoto przestaje być
walutą i staje się licznikiem. Naprawa to wydatek powracający.

**Daje drabince nagród dokąd rosnąć.** To najmocniejsza część pomysłu.
Rezerwa 5–7 znaczy, że **Mistrzowski miecz może pochodzić wyłącznie z
zawartości**, nigdy ze sklepu — a więc nagrodą za zadanie może być *ta sama
broń, którą już znasz, tylko lepsza*. To działa dużo lepiej niż kolejny
przedmiot z większą liczbą, bo gracz zna punkt odniesienia.

---

## 3. Zderzenia z tym, co już stoi w repo

### 3.1 Istnieje formalna decyzja mówiąca „nie" — i sama przewiduje ten moment

`docs/wioska_plan.md` **D-4** rozstrzyga wprost:

> Albo powstaje durability, albo Sobek zostaje klimatem. Wybieramy klimat —
> durability to nowy system ekonomiczny do zbalansowania w grze, która ma
> jeszcze niezałatane `Siła jako płaski bonus`. (…) **Rewidowalne, jeśli
> kiedyś powstanie realny powód do durability — nie jest to teraz.**

Czyli D-4 **nie zakazuje** trwałości, tylko postawiła warunek. Ta koncepcja
jest kandydatem na spełnienie tego warunku (cel dla Kowala + drenaż złota +
drabinka nagród). Ale trzeba uczciwie odnotować: **blokada, którą D-4
wymieniła, nadal stoi** — płaska Siła nie jest naprawiona, więc nowy system
ekonomiczny wchodzi do gry, której balans obrażeń jest wciąż tymczasowy.

To nie jest argument przeciw. To argument za **fazowaniem** (§6).

### 3.2 Asortyment Kowala przeczy fikcji, którą autor właśnie ustalił

Dziś `BLACKSMITH.stock` to: **toporek, miecz, siekiera, młot, pełen komplet
stalowy (hełm/napierśnik/nogawice/buty) i cztery pierścienie.**

Jeśli Kowal „nie zna się na broniach i pancerzach, naprawia młyn i kuje rzeczy
dla wsi", to problemem **nie jest jakość jego towaru — tylko to, że on ten
towar w ogóle ma.** Wiejski kowal sprzedający pełną stalową zbroję i cztery
pierścienie to nie jest kowal o niskiej jakości wykonania, to jest płatnerz.

⚠ To jest najważniejsza konsekwencja tej koncepcji i najłatwiej ją przeoczyć:
**jakość nie naprawi asortymentu.** Podły stalowy napierśnik od człowieka,
który kuje podkowy, dalej jest stalowym napierśnikiem od człowieka, który kuje
podkowy.

**ROZSTRZYGNIĘTE (2026-08-12), inaczej niż sugerowano wyżej.** Autor: skoro
Kowal ma te przedmioty, to skąd je ma jest kwestią jego przeszłości — barter
z wędrownymi kupcami, znaleziska. Rozwiązanie nie okrawa `stock`, tylko
domyka fikcję jednym nowym tematem rozmowy (`bron_skad` w
`BLACKSMITH.topics`, gated `after: ["z_czego_zyjesz"]`): nie kuje broni ani
pancerza, bierze je od wędrownych kupców płacących równie chętnie żelazem co
monetą, i od ludzi przynoszących znaleziska. To zresztą lepiej pasuje do
`stockQuality: 1-2` niż "sam kuje słabo" — towar z drugiej ręki jest z natury
gorszej jakości, nie dlatego że kowal jest niezdarny.

### 3.3 Wydany już dialog **potwierdza** fikcję autora — i jest gotowym paliwem

Kwestia Kowalowej (`rachunki`), już w grze:

> Tu prawie nikt nie płaci monetą. Miłosz płaci mąką za części do młyna, Sobek
> okucia bierze za drewno, Dobiesław za podkowy przysyła połeć.

Czyli **wydany dialog już mówi, co ten człowiek naprawdę wytwarza**: części do
młyna, okucia, podkowy. Ani słowa o broni. Fikcja autora nie jest nową
decyzją — jest doprecyzowaniem czegoś, co gra już powiedziała, a czemu przeczy
tylko tabelka `stock`.

Podobnie Sobek (`kola`): *„Obręcze bije mi Radzim — ja drewno, on żelazo, i tak
od dwudziestu lat."* Podział kompetencji stolarz/kowal **też już istnieje w
dialogu**. Jeśli wejdzie trwałość, D-4 rozwiązuje się sama: Sobek naprawia
drewno, Kowal żelazo, i obaj mówią to, co mówią dziś.

### 3.4 Przedmiot nie ma dziś tożsamości — to jest sedno techniczne

To jest jedno zdanie, od którego zależy, czy ta zmiana jest mała czy duża:

```
InventorySlot = { itemId: ItemId, qty: number }
Equipment.weapon = ItemId | null
```

Przedmiot **jest napisem**. Dwa miecze w plecaku są nierozróżnialne, a
założenie miecza gubi wszystko poza jego nazwą. Jakość i trwałość to stan
**egzemplarza**, więc każde miejsce, które dziś pyta „czy mam przedmiot X",
musi rozstrzygnąć, czy chodzi o *jakikolwiek* X, czy o *ten konkretny*.

Miejsca, które to dotyka (odczytane z kodu):
- `Inventory.count(itemId)` — sumuje po id; **cele zadań typu `collect` czytają
  z tego na żywo**,
- `Inventory.moveSlot` — scalanie stosów po `itemId` (broń/pancerz mają
  `maxStack` 1, więc akurat tu jest bezpiecznie),
- `Equipment.equip/unequip` — przenosi *id* przez granicę plecak↔sloty,
- sprzedaż i kupno w `ShopPanel` (trzy ścieżki sprzedaży),
- podpowiedzi i porównanie z założonym przedmiotem,
- `Quests.isQuestItem`, szybki slot, zapis.

**Wniosek:** faza 1 tej koncepcji nie jest „dodaniem pola do konfiguracji". To
zmiana tego, czym jest przedmiot. Warto to wycenić uczciwie z góry.

### 3.5 Zapis — da się nie skasować nikomu postaci, ale trzeba chcieć

`Inventory.snapshot()` zapisuje `slots` w całości, a niezgodny zapis jest
**odrzucany, nigdy migrowany** (świeży start). Naiwna zmiana kształtu =
podbicie `SAVE_VERSION` = **każda istniejąca postać wyzerowana**.

Projekt ma już przetarty wzorzec, żeby tego uniknąć: `quickSlot`, `ring1/ring2`,
`questProgress` — wszystkie doszły jako **pola opcjonalne bez podbicia wersji**.
Tak samo tutaj: `{ itemId, qty }` musi dalej się wczytywać, a `quality`/`dur`
mają być opcjonalne z domyślną **Zwykłą (3) / 100%**.

To ma też skutek projektowy, nie tylko techniczny — patrz §4.7.

---

## 4. Problemy projektowe do rozstrzygnięcia

### 4.1 Pełne widełki jakości są **szersze niż cała drabinka broni**

Zmierzone dps z `CLAUDE.md`: pięści 8 → kij 15 → sztylet 20 → miecz 23 →
siekiera 24 → **młot 26,2**.

- cała drabinka od sztyletu do młota: **×1,31 (+31%)**
- pełne widełki jakości (−15% … +20%): **×1,41 (+41%)**

Czyli po wprowadzeniu poziomów 5–7 **jakość staje się ważniejsza niż wybór
broni**. Konkretnie:

| zestawienie | dps |
|---|---:|
| Podła siekiera | 20,4 |
| Zwykły sztylet | 20,0 |
| Podły młot | 22,3 |
| Zwykły miecz | 23,0 |
| Arcymistrzowski sztylet | 24,0 |
| Zwykła siekiera | 24,0 |

To bezpośrednio podkopuje kierunek „broń ma wreszcie znaczyć coś wobec
konkretnego przeciwnika": jeśli kategoria broni ginie w szumie jakości, to
kategorie przestają być decyzją.

✅ **Ale decyzja autora o zamrożeniu 5–7 przypadkiem to rozbraja.** Widełki
fazy 1 (−15% … +5%) to **×1,235 (+23,5%)**, czyli *mniej* niż drabinka broni.
Tożsamość broni przeżywa. To jest argument, żeby 5–7 trzymać zamrożone aż do
przeróbki płaskiej Siły na procenty — nie tylko „bo nie ma jeszcze zadań".

### 4.2 „Modyfikator statystyk" — których dokładnie?

To musi być wyliczone jawnie, bo co najmniej jedna odpowiedź jest miną.

⚠ **Jakość nie może mnożyć szybkości ataku ponad `maxAttackSpeedBonus`.**
Ten limit nie jest balansem: `swingDurationMs` skaluje się z tej samej liczby,
więc przebicie go **powoduje zacinanie się sprite'a** w trakcie ataku.
Pierścienie już to rozwiązały — ich bonusy wchodzą **wewnątrz** limitu, nie na
wierzch. Jakość musi trafić do tego samego worka.

⚠ **Jakość nie może ruszać `requires: Siła N`.** Kuszące („Podły młot wymaga
mniej") i to jest dokładnie ta dziura, dla której odrzucono pierścienie ze
statystykami: wymagania są sprawdzane **tylko przy zakładaniu**, więc
przedmiot, który podnosi cię ponad próg, pozwala potem ten próg obejść. Bez
respecu każde wyjście z tego jest złe.

Bezpieczna odpowiedź na fazę 1: **jakość rusza wyłącznie obrażenia broni i
obronę pancerza.** Łuk, zasięg, odrzut, przerywanie i tempo zostają — to są
cechy *kategorii*, nie *egzemplarza*, i to one niosą tożsamość broni.

### 4.3 Losowanie „przy każdym udanym ataku" musi znaczyć **na zamach**, nie na trafionego

To jest ten sam problem, który w tym projekcie wystąpił już dwa razy i dwa razy
został rozwiązany tak samo:
- `AUDIO.minRetriggerMs` — Wir ostrzy trafia pięciu wrogów w jednej klatce i
  odpalał pięć identycznych dźwięków naraz,
- `critHitStop.minGapMs` — to samo z zamrożeniem klatki.

**Siekiera trafia 5/5 celów jednym zamachem** (zmierzone). Wir ostrzy tak samo.
Zręczność daje do +60% tempa. Więc losowanie „per trafiony wróg" znaczy, że:
- siekiera zużywa się **5× szybciej** niż młot na tej samej grupie,
- build na Zręczność zużywa broń ~1,6× szybciej niż na Sile,
- czyli **najszybciej niszczy sprzęt ten, kto zadaje najmniej obrażeń na cios** —
  odwrotnie niż mówi fikcja i odwrotnie niż chce balans.

Rozstrzygnięcie: **jedno losowanie na zamach**, niezależnie od liczby trafionych.

### 4.4 Jakość nie powinna wpływać na żywotność **dwa razy**

Autor proponuje, żeby od jakości zależała *i* pula trwałości, *i* szansa na jej
utratę. Ale pula sama z siebie daje już rozpiętość **70% → 200% = ×2,86**.
Jeśli szansa też skaluje (powiedzmy ×2 między skrajami), realna żywotność
rozjeżdża się na **~×5,7** — a wtedy Podła broń nie jest „tania i gorsza",
tylko bezużyteczna, i cały dolny koniec tabeli staje się martwy.

Propozycja: **skaluje tylko pula.** Szansa i wielkość ubytku zostają stałe —
jedna liczba do strojenia zamiast trzech, a efekt jest ten sam.

### 4.5 Co się dzieje przy zerze

Broń znikająca w połowie walki zrzuca gracza na pięści (8 dps) w najgorszym
możliwym momencie, po tym jak zapłacił za nią 280 złota.

Projekt ma tu wyraźną, konsekwentną wartość: **nigdy nie zabierać graczowi po
cichu tego, co zdobył** — zadania nie kasują przedmiotów zadaniowych, pełny
plecak odmawia zerwania rośliny zamiast ją zmarnować, sprzedaż sprzętu idzie
przez potwierdzenie.

Propozycja: przy zerze przedmiot przechodzi w stan **„Zniszczona"** — mocno
osłabiony, ale **dalej używalny i dalej naprawialny**. Nie znika.

### 4.6 Sklep przelicza asortyment przy każdej wizycie

`ShopPanel.show(npc)` **przelicza stock na każde otwarcie**. Jeśli jakość
towaru będzie losowana w tym momencie, gracz będzie **wychodził i wchodził,
aż wypadnie Dobra** — a to zamienia system w automat do zakładów i kasuje całą
charakterystykę Kowala.

Rozstrzygnięcie: jakość pozycji w sklepie musi być **stała** (zapisana przy
pierwszym wygenerowaniu albo wprost w konfiguracji), nigdy losowana per wizyta.

### 4.7 „Twój sprzęt właśnie stał się gorszy" — najgorsze możliwe pierwsze wrażenie

Jeśli Kowal umie robić tylko 1–3, a 4 jest rzadkie, to **widocznym efektem
wprowadzenia systemu jest to, że wszystko jest gorsze niż wczoraj.** System,
którego premiera odbiera, startuje z długiem zaufania.

Propozycja, spójna z §3.5: **wszystko, co gracz już ma, to Zwykła (3).**
Nic nie traci na wartości. W dół schodzi wyłącznie *nowa* produkcja Kowala
(i to za niższą cenę), w górę idą znaleziska i nagrody. System dodaje wtedy
rozpiętość, zamiast obniżać poziom.

### 4.8 Pancerz nie ma czym się zużywać

Trwałość broni napędza akcja gracza (zamach). Pancerz nie ma odpowiednika —
musiałby się zużywać od **otrzymanych** ciosów, co jest osobną regułą i osobnym
balansem (a przy tym karze gracza za to, że przegrywa, czyli dokłada do spirali).

Propozycja: **faza 1 — jakość dla broni i pancerza, trwałość tylko dla broni.**
Pancerz dostaje trwałość dopiero, jeśli okaże się potrzebna.

### 4.9 Drenaż złota już istnieje

Śmierć zabiera 10% złota. Naprawa będzie **drugim** stałym drenażem. Przy
dochodach rzędu 4,4 zł za oskórowanego królika i 16,2 zł za dzika trzeba to
policzyć razem, a nie osobno — inaczej gracz, któremu idzie źle, płaci dwa
razy za to samo.

---

## 5. Idee, które bym dorzucił

### 5.1 Jakość jako **charakterystyka**, nie rzut kością — najmocniejszy dodatek

Zamiast losować jakość, **przypisz każdemu sprzedawcy zakres jakości per
kategoria — według tego, na czym się zna.** Wtedy jakość przestaje być szumem,
a staje się mapą kompetencji świata:

| kto | na czym się zna | zakres |
|---|---|---|
| Kowal (wieś) | okucia, podkowy, części do młyna | broń/pancerz **1–2**, żelazo gospodarskie 3 |
| Myśliwy | **sam garbuje** — skóra to jego rzemiosło | skórzany komplet **3–4**, metal 1–2 |
| Płatnerz z miasta (przyszłość) | zawód | 3–4, wyjątkowo 5 |
| zadania / znaleziska | — | **5–7, wyłącznie tędy** |

To kosztuje tyle samo co losowanie, a daje trzy rzeczy za darmo: sprzedawcy
przestają być listami towarów, gracz uczy się, **do kogo się idzie po co**, i
„Myśliwy sprzedaje lepszą skórę niż Kowal żelazo" jest natychmiast czytelne bez
jednego zdania tłumaczenia. W projekcie, którego zasadą jest „rzecz ma coś
znaczyć, nie tylko się nazywać", to jest dokładnie ta zasada.

### 5.2 Kowal, który czegoś nie umie **zrobić** — czy umie to **naprawić**?

Bardzo dobre pytanie fikcyjne z prawdziwymi zębami mechanicznymi. Trzy możliwe
odpowiedzi, każda robi co innego:

- **umie naprawić wszystko** — najprostsze, ale wtedy jego niekompetencja nie
  ma żadnych konsekwencji;
- **naprawia tylko do własnego poziomu** — Mistrzowski miecz po jego naprawie
  jest sprawny, ale nie odzyskuje pełnej puli;
- **naprawa u niekompetentnego psuje jakość** — ryzykujesz zejście o poziom.

Druga albo trzecia opcja **z góry buduje wartość przyszłego płatnerza z
miasta**: nagroda za zadanie przestaje być jednorazowa, bo trzeba mieć jeszcze
gdzie ją utrzymać. To jest bardzo tanie zawiązanie przyszłej zawartości.

### 5.3 Trwałość musi tworzyć **decyzję**, inaczej jest podatkiem

Największe ryzyko całego systemu: trwałość, która tylko spada, nie dodaje
rozgrywki — dodaje **buchalterię i spacer do kowala co czterdzieści minut**.

Trwałość zaczyna być mechaniką dopiero wtedy, gdy stawia pytanie *teraz*, w
lesie, a nie *potem*, w mieście. Najprostszy sposób: **noś zapasową broń.**
Młot na 12% i jesteś głęboko na południowym zachodzie — wracasz czy schodzisz
na sztylet? To spina się bezpośrednio z pomysłem na pancerz/odporności wroga
(dwie bronie na dwa rodzaje przeciwnika), i wtedy **oba systemy wzmacniają się
nawzajem zamiast konkurować o uwagę**.

Bez tego spięcia trwałość jest tylko podatkiem od grania.

### 5.4 Jakość ma być widoczna bez czytania

Siedem poziomów w podpowiedzi to siedem linijek tekstu. **Kolor ramki
przedmiotu** (paleta `UI` już istnieje) załatwia to jednym spojrzeniem na
plecak, a nazwa niech niesie tylko przymiotnik: *Miecz (Dobry)*.
„Arcymistrzowska" ma 15 znaków — sprawdzić, czy mieści się w slocie, zanim
wejdzie do nazw.

### 5.5 Kij i pięści zostają poza systemem

Kij dostaje gracz w pierwszym zadaniu w grze, od ojca, w progu domu. **Podły
kij** w tej scenie to zły pierwszy komunikat. Kij = Zwykły na sztywno albo
w ogóle bez jakości.

**ODWRÓCONE (2026-08-12).** Autor zdecydował przeciwnie: kij startowy ma być
**najniższej jakości właśnie dlatego, że to przedmiot startowy** — pasuje to
zresztą do własnego opisu przedmiotu ("Gałąź obcięta na długość ramienia i
zaostrzona nożem") i do kwestii ojca przy wręczaniu ("Osiosałem go wczoraj
przy oborze — broń to żadna"). Podła nie czyta się tu jako zły pierwszy
komunikat, tylko jako trafny: to naprawdę jest byle jaki patyk, i drabinka ma
skądś zacząć rosnąć. Wdrożone jako właściwość TEGO KONKRETNEGO WRĘCZENIA
(`QUESTS.stick_in_hand.grant[0].quality = 1`), nie właściwość przedmiotu
`stick` — kij kupiony później u sprzedawcy nadal idzie przez normalny
`vendorQuality` tego sprzedawcy, niezależnie od tej decyzji.

---

## 6. Proponowana kolejność

**Faza 1 — sama jakość, poziomy 1–4.** Przedmiot dostaje tożsamość
(egzemplarz zamiast napisu), jakość rusza wyłącznie obrażenia/obronę, ceny
skalują się z jakością, sprzedawcy dostają zakresy z §5.1, wszystko istniejące
to Zwykła. **Zero trwałości, zero napraw** — czyli D-4 nadal obowiązuje i nikt
nie musi jej ruszać. Widełki ×1,235 są węższe niż drabinka broni, więc balans
się nie sypie (§4.1).

**Faza 1b — porządek w asortymencie Kowala** (§3.2). Wynika z fikcji, nie z
mechaniki, i jest niezależne od reszty.

**Faza 2 — trwałość i naprawa.** Tu wraca D-4 i tu jest cały ciężar
ekonomiczny. Warunek wejścia: odpowiedź na §5.3 („jaką decyzję to tworzy"),
inaczej to podatek.

**Faza 3 — poziomy 5–7 jako nagrody.** Warunek wejścia: przeróbka płaskiej
Siły na procenty, bo dopiero wtedy drabinka broni jest szersza niż widełki
jakości (§4.1).

---

## 7. Pytania otwarte

1. Czy jakość dotyczy **tylko broni i pancerza**, czy też pierścieni? (Pierścienie
   dają statystyki pochodne i mają własne limity — patrz §4.2.)
2. Czy naprawa przywraca 100% puli, czy każda naprawa trwale ją obniża
   (klasyka gatunku)? Jeśli obniża — kiedy przedmiot ostatecznie umiera i czy
   to nie łamie zasady z §4.5?
3. Czy sprzedaż uwzględnia aktualną trwałość, czy tylko jakość? Jeśli tylko
   jakość, powstaje arbitraż: kup, zużyj, sprzedaj za tyle samo.
4. Czy gracz **widzi** jakość przed kupnem? (Jeśli nie — to hazard, nie wybór.)
5. Co się dzieje z jakością przy przedmiotach z zadań (`grant`), które można
   odzyskać u dawcy?

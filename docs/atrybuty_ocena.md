---
typ: HISTORIA
domena: attributes
tytul: Rebalans atrybutów — pakiet do oceny zewnętrznej
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-20
---

# Rebalans atrybutów + retargeting — pakiet do oceny (dla recenzenta z zewnątrz)

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/attributes.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status gry: surowy prototyp, nie demo.** Top-down 2D action RPG (Phaser 3 +
TypeScript), horyzont wydania **pół roku do roku**. Autor gra w to na bieżąco.
Świadoma kolejność prac: *najpierw to, co grę wyróżni; dopracowanie, ergonomia
telefonu i pakowanie potem.* Głębia systemów wyprzedzająca zawartość jest
**przyjętym kosztem, nie dryfem** — nie argumentuj przeciwko temu terminami.

Referencje tonalne: **Margonem** (czytelność, loot, prostota wejścia),
**WoW** (struktura equipmentu i progresji), **WFRP** (przyziemność, znaczenie
wyposażenia, konsekwencje).

⚠ **Czego ten pakiet NIE zawiera: playtestu.** Wszystko poniżej jest zmierzone
symulacją na żywym configu. Nikt tym jeszcze nie zagrał po zmianie.

---

## 1. Kontekst mechaniki (przeczytaj przed oceną tabel)

**Walka.** Nie jest to „kliknij i patrz na pasek DPS". Cykl: tapnięcie na wroga
fokusuje → autoatak uzbrojony → zamach z **ukorzenieniem** (nie da się ruszyć)
→ trafienie w **połowie** zamachu → odzyskanie. Do tego: pozycjonowanie, unik
z i-frame'ami, **blok kierunkowy tarczą** (chroni tylko przód), przerwanie
zamachu wroga, odrzut, warianty ataku (jedna broń, 1–3 sposoby użycia), cztery
typy obrażeń × cztery materiały pancerza.

**Skala liczb, która rządzi wszystkim.** Walka trwa **2–5 ciosów**; gracz
przyjmuje **1–4 ciosy na walkę** (wyjątek: elita ~10). To jest powód, dla
którego projekt **dwukrotnie odrzucił mechaniki oparte na szansie** (blok
procentowy, losowe ogłuszenie): efekt 10–30% przy dwóch próbach to nie
„redukcja o X%", tylko moneta rzucana raz na walkę.

**Budżet punktów.** 1 punkt na poziom, poziom max 50 → 49 punktów na całą grę.
⚠ **Ale realna rozmowa o balansie dotyczy przedziału 0–15 punktów** — pełne
przejście mapy daje ~10 punktów, a krzywa XP jest osobno zaparkowana jako
nieprzestrojona. Nie oceniaj na kolumnie „49 pkt".

**Brak respeca.** Każdy wydany punkt jest ostateczny. To jest ograniczenie,
które kształtuje wiele decyzji niżej.

**Trzy atrybuty i nic więcej.** Siła, Kondycja, Zręczność. Czwarty
(INT/Percepcja/Szczęście) jest świadomie odrzucony.

---

## 2. Problem, który to naprawiało (stan PRZED)

Siła dawała **+1 obrażeń płasko za punkt**. Zmierzone konsekwencje:

**(a) Odwrócona drabinka broni.** Płaski bonus mnoży się przez ataki na
sekundę, więc jest wart więcej na broni szybkiej niż wolnej:

| Siła | Kij (12 g) | Sztylet (40 g) | Miecz (110 g) | Siekiera (180 g) | Młot (280 g) | najlepsza |
|---:|---:|---:|---:|---:|---:|---|
| 0 | 16,8 | 25,0 | 25,8 | 27,8 | **29,3** | młot |
| 5 | 28,0 | 38,9 | 37,0 | **39,4** | 37,9 | siekiera |
| 10 | 39,2 | **52,8** | 48,2 | 50,9 | 46,5 | **sztylet** |
| 15 | 50,4 | **66,7** | 59,4 | 62,5 | 55,1 | **sztylet** |

⚠ **Najostrzejsza konsekwencja:** młot wymagał **Siły 6**, sztylet nie wymagał
niczego. Czyli **w momencie, w którym gracz legalnie zakładał młot, sztylet —
dostępny mu od pierwszego poziomu — był już od młota lepszy.** Bramka
prowadząca do broni gorszej niż broń bez bramki.

**(b) Rozcieńczanie jakości wykonania.** Obrażenia liczyły się jako
`baza(jakość) × wariant + Siła`. Siła była DODAWANA, więc im więcej jej było,
tym mniejszy względny udział miała jakość — w grze, która ma **7 poziomów
jakości** jako oś zróżnicowania lootu.

**(c) Spłaszczanie wyboru wariantu ataku.** Ta sama arytmetyka. Przewaga
Cięcia nad Pchnięciem: **11,8% (Siła 0) → 6,9% (Siła 4) → 3,3% (Siła 10)**.

**(d) Zręczność jako stat-pułapka.** Dawała tempo ataku (+1,2%/pkt) i szansę
krytyka (+0,6%/pkt). Zmierzony przyrost DPS na punkt (miecz, 0 pkt):
**Siła 8,70 przeciw Zręczności 1,63 — ×5,3.**

⚠ **A jej trzeci, „jakościowy" efekt działał ODWROTNIE, niż głosiła
dokumentacja.** Twierdzono, że Zręczność daje tempo i mobilność, bo skraca
ukorzenienie. Zmierzone (miecz, ile milisekund na sekundę gracz może się ruszać
przy podtrzymywanym autoataku):

| Zręczność | cykl | root | root/cykl | **wolnego ruchu / s** |
|---:|---:|---:|---:|---:|
| 0 | 500 ms | 220 | 44,0% | **560 ms** |
| 10 | 446 | 201 | 45,0% | 550 |
| 20 | 403 | 185 | 45,9% | **541** |

Przyczyna: `root = zamach + 40`, gdzie zamach skalował się przez `1/(1+bonus)`,
a stałe `+40 ms` nie skalowało się wcale. ⚠ **Samo przeskalowanie tego `+40`
daje dokładnie ZERO** (560 ms/s przy każdej wartości), a nie poprawę.

**(e) Kondycja — teza, która nie miała pomiaru.** Powszechnie uważano ją za
najsłabszy stat („nie zwiększa obrażeń w ogóle"). ⚠ **Nie istniał żaden kurs
wymiany HP↔DPS**, więc ta teza nie była ani prawdziwa, ani fałszywa.

---

## 3. Co zmieniono

### 3.1 Siła i Zręczność: skalowanie PER BROŃ

```
obrażenia = baza(jakość) × wariant × (1 + SIŁ×strScale + ZRĘ×dexScale)
```

`strScale`/`dexScale` są **polami przedmiotu**, nie stałymi globalnymi:

| broń | cena | `strScale` | `dexScale` |
|---|---:|---:|---:|
| Osiosany kij | 12 | 0,030 | 0,030 |
| Sztylet | 40 | 0,015 | 0,062 |
| Toporek | 70 | 0,045 | 0,038 |
| Miecz | 110 | 0,050 | 0,045 |
| Włócznia (2H) | 150 | 0,080 | 0,035 |
| Siekiera | 180 | 0,070 | 0,020 |
| Młot | 280 | 0,080 | 0,005 |

**Rozważono i odrzucono jednolity procent** (`1 + SIŁ × p`, jedno `p` dla
wszystkich). ⚠ Zmierzone: jednolity procent **zachowuje drabinkę, ale ją
ZAMRAŻA** — rozpiętość wynosi ×1,74 przy każdej inwestycji, bo mnoży wszystko
tak samo, **więc młot jest najlepszy przy Sile 0 i przy Sile 15, dla postaci
siłowej i dla zręcznościowej.** Wybór broni przestaje być wyborem buildu.

⚠ **Argument, który przeważył, nie jest balansowy:** skalowanie per broń to
jedyny model, do którego wpina się **broń dystansowa i magia** bez wyjątku
w kodzie (łuk = wysoki `dexScale`). Przy „+X% obrażeń fizycznych od Siły" łuk
jest nierozwiązywalny.

### 3.2 Zręczność: rozdzielone zobowiązanie i odzyskanie

```
root = zamach×hitFraction + (zamach×(1−hitFraction) + 40) × (1 − redukcjaZRĘ)
redukcjaZRĘ = min(ZRĘ × 0,020, 0,5)
```

Zamach do klatki trafienia (zapowiedź, czytelność pozy) zostaje nietknięty;
Zręczność tnie **tylko to, co po trafieniu**.

### 3.3 Zręczność traci szansę krytyka

`critChancePerAgility: 0,006 → usunięte`. Uzasadnienie: przy 10 punktach to
**jeden krytyk więcej raz na ~3,3 walki** — poniżej progu zauważalności
w walce na 2–5 ciosów, czyli **ta sama pomyłka, którą projekt odrzucił już
dwukrotnie** (blok procentowy, losowe ogłuszenie). Krytyk ma dwóch lepszych
właścicieli: **broń** (sztylet: +10% szansy) i **rodzinę broni** (topory:
+0,25 do siły krytyka).

### 3.4 Kondycja — bez zmian mechanicznych

Zmieniono wyłącznie **opis**. Zmierzono, że jej „drugi efekt" (regeneracja
skalująca się z Kondycją) jest **matematycznie neutralny**: czas na uleczenie
połowy paska wynosi 77 / 76 / 76 / 75 s przy 0 / 10 / 20 / 49 punktach. To nie
jest korzyść — to **normalizator**, który zapobiega temu, żeby inwestycja w HP
po cichu pogarszała tempo powrotu do zdrowia.

### 3.5 Osobna zmiana: przełączanie celu (zgłoszona z rozgrywki)

Zgłoszenie autora: *„jeśli zfokusowany cel jest poza zasięgiem, a gracz
naciśnie atakuj, to fokusuje się cel w zasięgu — w walce z wilkami i królikami
muszę klikać ręcznie na cel, by zmienić target"*.

Wdrożono na **zboczu naciśnięcia** ataku:
- brak celu / cel martwy → wybierz najbliższego w zasięgu *(bez zmian)*;
- cel żywy, **poza** zasięgiem → przełącz na najbliższego **atakującego**
  w zasięgu;
- cel w zasięgu → **nic**.

Plus komunikat **„Za daleko"** (obok istniejącego „Brak celu"), gdy nie ma na
kogo przełączyć.

Trzy zawężenia względem literalnego zgłoszenia:
1. **Filtr „ten wróg mnie atakuje", nie „najbliższy"** — bez niego naciśnięcie
   ataku w środku walki rozpoczynałoby nową walkę z królikiem skubiącym trawę
   dwa kafle dalej. Mechanizm ma walkę kontynuować, nigdy jej nie poszerzać.
2. **Odrzucono cyklowanie celów w zasięgu** (autor rzucił to jako szerszy
   wariant). ⚠ Powód jest zmierzony: orbita wilka leży dokładnie na progu
   zasięgu — trafialność skacze **z 22,2% na 97,1% cyklu między zasięgiem 78
   a 79 px** — więc cel przeskakiwałby kilka razy na sekundę. Dodatkowo
   zabierałoby graczowi rannego wroga tuż przed dobiciem.
3. **Tylko na zboczu naciśnięcia** — trzymany autoatak nigdy nie zmienia celu
   sam z siebie. To jest gwarancja, że system nie kradnie celu.

---

## 4. Wyniki: PRZED / PO

### 4.1 Najlepsza broń jednocelowa wg buildu (test rozstrzygający)

**PRZED:**

| build | kij | sztylet | miecz | toporek | siekiera | młot | włócznia | najlepsza |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| baza | 16,8 | 25,0 | 25,8 | 25,3 | 27,8 | 29,3 | 23,3 | Młot |
| SIŁ 10 | 39,2 | **52,8** | 48,2 | 49,4 | 50,9 | 46,5 | 42,0 | **Sztylet** |
| SIŁ 15 | 50,4 | **66,7** | 59,4 | 61,5 | 62,5 | 55,1 | 51,3 | **Sztylet** |
| ZRĘ 10 | 19,6 | 29,3 | 30,1 | 29,9 | 32,8 | **34,2** | 27,3 | **Młot** |
| ZRĘ 15 | 21,1 | 31,6 | 32,4 | 32,3 | 35,5 | **36,8** | 29,3 | **Młot** |

**PO:**

| build | kij | sztylet | miecz | toporek | siekiera | młot | włócznia | najlepsza |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| baza | 16,8 | 25,0 | 25,8 | 25,3 | 27,8 | 29,3 | 23,3 | Młot |
| SIŁ 10 | 21,8 | 28,8 | 38,6 | 36,7 | 47,2 | **52,7** | 42,0 | **Młot** |
| SIŁ 15 | 24,4 | 30,6 | 45,1 | 42,4 | 56,9 | **64,4** | 51,3 | **Młot** |
| ZRĘ 10 | 24,5 | **45,4** | 41,8 | 39,1 | 37,3 | 34,4 | 35,3 | **Sztylet** |
| ZRĘ 15 | 28,7 | **56,9** | 50,9 | 46,9 | 42,6 | 37,2 | 42,0 | **Sztylet** |

Rozpiętość (bez kija, który jest starterem i **ma** odpadać): ×1,26 w bazie →
×1,83 przy SIŁ 10 → ×2,10 przy SIŁ 15. Przyjęty sufit: ~×2,1 w realnym paśmie.

### 4.2 Kurs wymiany atrybutów

Przeżywalność w starciu ciągłym jest proporcjonalna do **HP × DPS**
(damage_taken = dps_wroga × hp_wroga / dps_gracza), więc wspólną walutą jest
**przyrost względny na punkt**:

| pkt | %HP/pkt (KON) | Młot SIŁ/ZRĘ | Miecz SIŁ/ZRĘ | Sztylet SIŁ/ZRĘ |
|---:|---:|---|---|---|
| 0 | 6,00 | **8,00** / 1,71 | 5,00 / 5,75 | 1,50 / **7,47** |
| 5 | 4,62 | 5,61 / 1,49 | 3,39 / 4,22 | 1,08 / 5,66 |
| 10 | 3,75 | 4,32 / 1,34 | 2,56 / 3,40 | 0,85 / 4,61 |
| 15 | 3,16 | 3,52 / 1,24 | 2,06 / 2,89 | 0,70 / 3,92 |

**PRZED (miecz, 0 pkt): SIŁ 8,70 przeciw ZRĘ 1,63 — ×5,3.**
**PO: każdy stat we WŁAŚCIWYM sprzęcie daje 6,00–8,00 na punkt — rozstrzał ×1,33.**

Miecz jest celowo neutralny (5,00 / 5,75) jako „punkt odniesienia" rosteru.

### 4.3 Warianty ataku

Przewaga Cięcia nad Pchnięciem:

| | SIŁ 0 | SIŁ 4 | SIŁ 10 |
|---|---:|---:|---:|
| PRZED (miecz) | 11,8% | 6,9% | **3,3%** |
| PO (miecz) | 11,8% | **11,8%** | **11,8%** |
| PRZED (siekiera) | 23,5% | 18,3% | 14,4% |
| PO (siekiera) | 23,5% | **23,5%** | **23,5%** |

### 4.4 Zręczność a wolny czas (miecz)

| Zręczność | PRZED (ms wolnego ruchu / s) | PO |
|---:|---:|---:|
| 0 | 560 | **560** (bez zmian) |
| 10 | 550 | **604** |
| 20 | 541 | **652** |

### 4.5 Łańcuch mnożników (kontrola power creepu)

Najmocniejszy realny cios: jakość Arcymistrzowska × wariant × atrybut ×
Okrzyk bojowy (+35%) × krytyk.

| broń | PRZED @SIŁ15 | PO @SIŁ15 | wzrost |
|---|---:|---:|---:|
| Sztylet | 69,7 | 35,7 | ×0,51 |
| Miecz | 70,0 | 58,7 | ×0,84 |
| Siekiera | 81,4 | 81,7 | **×1,00** |
| Młot | 86,0 | 109,1 | **×1,27** |

Przy SIŁ 0 wszystkie bronie wychodzą **identycznie** — zmiana jest niewidoczna
dla świeżej postaci.

---

## 5. Fakty zaobserwowane przy liczeniu (nie opinie)

1. **Asercja cenowa** („droższa broń ma być lepsza w obrębie buildu") świeci na
   zielono dla **wszystkich** buildów siłowych, a na czerwono dla wszystkich
   zręcznościowych: `Toporek (70 g) < Sztylet (40 g)`. ⚠ Sztylet za 40 g jest
   **końcem drabinki dla Zręczności** — w rosterze nie ma drogiej broni lekkiej.
   Postać zręcznościowa nie ma na co wydawać złota.
2. **Złoto jest już dziś martwą walutą.** Cały sklep w grze kosztuje 1407 g,
   realna ścieżka zakupów ~600 g, a zrzut z rozgrywki pokazał **1618 g**
   w kieszeni. Punkt 1 to pogłębia.
3. **Włócznia nadal nie płaci za dwuręczność.** `hands: 2` nie niesie w tej grze
   **żadnego** bonusu — jedyną ceną dwuręczności jest utrata slotu tarczy.
   Współczynnik podniesiono tak, żeby drabinka cen się zgadzała, ale przy
   buildzie mieszanym różnica z mieczem to 0,2 DPS.
4. **HP przeciwników nie ma krzywej poziomów.** Roster to 30–190 HP przy
   mnożniku mocy gracza ~×2,0 w paśmie 0–15 punktów.
5. **Młot jest teraz nagradzany podwójnie**: najlepszy DPS buildu siłowego
   **oraz** jedyna broń w grze z przerwaniem zamachu wroga i z odrzutem.
   Przeciwwaga: 280 g (najdroższy), wymóg Siły 6, najwolniejszy, najwęższy
   użyteczny łuk (45°), najdłuższy root.
6. **Siła nadal bramkuje pancerz.** Kolczuga wymaga Siły 3, stal 4 — więc
   czysto kondycyjny „tank" nie może założyć pancerza tanka. To istniało przed
   zmianą i nie zostało ruszone.

---

## 6. Czego świadomie NIE zrobiono

- **Obciążenia wyposażenia** (weight/encumbrance) — zaprojektowane na papierze,
  niewdrożone. Wraz z nim: usunięcie wymagań `requires` z broni, pancerz
  wielowarstwowy, umiejętność podnosząca udźwig.
- **Krzywej XP** — zaparkowana osobno jako nieprzestrojona.
- **Respeca.**
- **Czwartego atrybutu.**
- **Strojenia pancerza** (`ARMOR_PROFILE`).

Reguła projektu: każda z tych rzeczy osobno, żeby dało się ocenić, co zadziałało.

---

## 7. Pytania do recenzenta

1. **Czy skalowanie per broń jest właściwym modelem, czy przeinżynierowaniem?**
   Alternatywy: jednolity procent (prostszy, ale zamraża drabinkę) albo
   pozostawienie płaskiego bonusu. Kluczowy kontrargument, który chcę
   usłyszeć, jeśli istnieje: czy siedem par liczb do strojenia to nie za dużo
   powierzchni na roster, który urośnie do 20+ broni.

2. **Czy rozstrzał ×1,33 w wartości punktu (§4.2) to sukces, czy złudzenie
   wynikające z metryki?** Metryka „HP × DPS" zakłada obrażenia otrzymywane
   proporcjonalne do długości walki. W grze z telegrafami, unikiem i blokiem
   kierunkowym dobry gracz przyjmuje ich mniej niezależnie od długości — czyli
   **wartość Kondycji spada wraz z umiejętnością gracza**. Uznałem to za cechę
   pożądaną (Kondycja jest walutą, którą płaci się za pomyłki). Czy to obrona,
   czy racjonalizacja?

3. **Czy rozpiętość ×2,10 przy 15 punktach jest bezpieczna?** Powyżej jakiej
   wartości „najlepsza broń" przestaje być wyborem, a staje się przymusem?

4. **Czy młot nagradzany podwójnie (§5.5) to problem do naprawienia teraz?**
   Jeśli tak — obniżyć jego `strScale`, czy odebrać mu wyłączność na
   przerwanie?

5. **Czy „brak drogiej broni zręcznościowej" (§5.1) należy naprawić zawartością
   (nowa broń), czy liczbami (obniżyć `dexScale` sztyletu)?** Skłaniam się ku
   zawartości, bo obniżanie sztyletu nie daje graczowi na co wydać złota.

6. **Czy odebranie Zręczności szansy krytyka nie jest nadmiarowe?** Argument
   „2–5 ciosów" jest w tym projekcie precedensem zastosowanym dwukrotnie, ale
   krytyk był jedynym efektem Zręczności, który gracz **widzi** jako zdarzenie
   (jest hit-stop, jest większa liczba). Nowa tożsamość — krótsze odzyskanie —
   jest z definicji **niewidoczna**: to brak czegoś, a nie zdarzenie.
   ⚠ To jest moje największe zmartwienie w całej tej zmianie.

7. **Retargeting (§3.5): czy zawężenie do „tylko gdy cel jest poza zasięgiem"
   wystarczy, żeby system nie kradł celu?** Scenariusz, który mnie niepokoi:
   ranny wilk odchodzi o dwa piksele poza zasięg, gracz tapie atak, fokus
   przeskakuje na zdrowego wilka obok, a ranny ucieka.

8. **Czy któraś z tych zmian koliduje z czymś, czego nie widzę**, biorąc pod
   uwagę, że gra ma docelowo dostać broń dystansową, magię, więcej materiałów
   pancerza i efekty statusu?

---
typ: HISTORIA
domena: items
tytul: Jakość wykonania — pakiet do oceny zewnętrznej
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-12
---

# Jakość wykonania — pakiet do oceny (dla recenzenta z zewnątrz)

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/items.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


Status gry: **bardzo wczesny, surowy prototyp** (nie demo). To, co widzisz
poniżej, to pierwsza wersja systemu jakości wykonania przedmiotów — jedna z
wielu planowanych osi zróżnicowania sprzętu w prostym top-down RPG akcji
(Phaser 3 + TypeScript). Docelowo dojdzie dużo więcej broni, więcej
sprzedawców, wyższe progi wymagań atrybutów itd. — nie oceniaj tego jako
gotowy, finalny system, tylko jako fundament pod dalszą rozbudowę.

## Kontekst mechaniki (przeczytaj przed oceną tabel)

- **Przedmiot = konkretny egzemplarz**, nie tylko nazwa. Ten sam miecz może
  istnieć w 7 poziomach jakości; jakość zmienia obrażenia/obronę, pulę
  trwałości, tempo ataku (w ramach istniejącego capu) i próg wymogu siły —
  ale NIGDY kategorię broni (łuk cięcia, zasięg, odrzut — to należy do typu
  broni, nie do jakości).
- **7 poziomów**: Podła, Niska, Zwykła (=dzisiejszy stan gry, punkt odniesienia),
  Dobra, Wysoka, Mistrzowska, Arcymistrzowska.
- **Dziś w obiegu są tylko poziomy 1–4.** Poziomy 5–7 istnieją w danych, ale
  żaden sklep ani żaden dotychczasowy dropa ich nie produkuje — to świadoma
  rezerwa pod przyszłe nagrody z zadań/znalezisk.
- **Trwałość istnieje tylko dla broni**, nie dla pancerza. Traci się ją
  losowo (15% szans, −1 punkt) **raz na cały zamach**, niezależnie od liczby
  trafionych wrogów. Przy zerze broń nie znika — przechodzi w stan
  „Zniszczona" i działa dalej za połowę wartości (obrażenia/obrona).
- **Naprawa jeszcze nie istnieje.** To jest zaplanowana Faza 2 i na razie jej
  nie ma w kodzie — złamana broń zostaje złamana bezterminowo, dopóki gracz
  nie kupi/znajdzie nowej.
- **Sprzedawcy mają przypisany zakres jakości** (np. wiejski kowal: broń i
  pancerz 1–2, bo kuje głównie podkowy i części do młyna; Myśliwy: pancerz
  3–4, bo sam garbuje skórę). Poziom konkretnej pozycji na półce jest
  **deterministyczny** (hash sprzedawca+przedmiot), nie losowany przy każdym
  wejściu do sklepu.
- Wszystko, co gracz miał przed wejściem tego systemu, ładuje się jako
  Zwykła / pełna trwałość — stary zapis nie traci na wartości.

---

## Tabela: PRZED / PO — broń

„Zwykła" (poziom 3) to dokładnie to, co jest dziś w grze bez systemu jakości —
kolumna odniesienia. DPS liczony BEZ bonusu tempa ataku z jakości (ten bonus
zależy od reszty builda gracza — patrz pytanie 3 niżej).

### Osiosany kij (bazowo: 6-9 dmg, cooldown 0.5s, trwałość 40, cena 12/5g, brak wymogu)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 5-8 | 13.0 | 28 | 7g | 3g | — | −8% |
| 2 Niska | 6-8 | 14.0 | 34 | 9g | 4g | — | −4% |
| **3 Zwykła** | **6-9** | **15.0** | **40** | **12g** | **5g** | **—** | **0%** |
| 4 Dobra | 6-9 | 15.0 | 46 | 16g | 7g | — | +3% |
| 5 Wysoka | 7-10 | 17.0 | 54 | 23g | 10g | — | +6% |
| 6 Mistrzowska | 7-10 | 17.0 | 64 | 34g | 14g | — | +9% |
| 7 Arcymistrzowska | 7-11 | 18.0 | 80 | 54g | 23g | — | +12% |

### Sztylet (bazowo: 7-11 dmg, cooldown 0.45s, trwałość 70, cena 40/16g, brak wymogu)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 6-9 | 16.7 | 49 | 22g | 9g | — | −8% |
| 2 Niska | 6-10 | 17.8 | 60 | 30g | 12g | — | −4% |
| **3 Zwykła** | **7-11** | **20.0** | **70** | **40g** | **16g** | **—** | **0%** |
| 4 Dobra | 7-12 | 21.1 | 81 | 54g | 22g | — | +3% |
| 5 Wysoka | 8-12 | 22.2 | 95 | 76g | 30g | — | +6% |
| 6 Mistrzowska | 8-13 | 23.3 | 112 | 112g | 45g | — | +9% |
| 7 Arcymistrzowska | 8-13 | 23.3 | 140 | 180g | 72g | — | +12% |

### Miecz (bazowo: 9-14 dmg, cooldown 0.5s, trwałość 110, cena 110/44g, wymóg Siła 2)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 8-12 | 20.0 | 77 | 61g | 24g | 3 | −8% |
| 2 Niska | 8-13 | 21.0 | 94 | 83g | 33g | 3 | −4% |
| **3 Zwykła** | **9-14** | **23.0** | **110** | **110g** | **44g** | **2** | **0%** |
| 4 Dobra | 9-15 | 24.0 | 126 | 149g | 59g | 2 | +3% |
| 5 Wysoka | 10-15 | 25.0 | 149 | 209g | 84g | 2 | +6% |
| 6 Mistrzowska | 10-16 | 26.0 | 176 | 308g | 123g | 1 | +9% |
| 7 Arcymistrzowska | 11-17 | 28.0 | 220 | 495g | 198g | 1 | +12% |

### Toporek (bazowo: 8-13 dmg, cooldown 0.48s, trwałość 90, cena 70/28g, brak wymogu)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 7-11 | 18.8 | 63 | 39g | 15g | — | −8% |
| 2 Niska | 7-12 | 19.8 | 77 | 53g | 21g | — | −4% |
| **3 Zwykła** | **8-13** | **21.9** | **90** | **70g** | **28g** | **—** | **0%** |
| 4 Dobra | 8-14 | 22.9 | 103 | 95g | 38g | — | +3% |
| 5 Wysoka | 9-14 | 24.0 | 122 | 133g | 53g | — | +6% |
| 6 Mistrzowska | 9-15 | 25.0 | 144 | 196g | 78g | — | +9% |
| 7 Arcymistrzowska | 10-16 | 27.1 | 180 | 315g | 126g | — | +12% |

### Siekiera (bazowo: 6-18 dmg, cooldown 0.5s, trwałość 120, cena 180/72g, wymóg Siła 4)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 5-15 | 20.0 | 84 | 99g | 40g | 5 | −8% |
| 2 Niska | 6-17 | 23.0 | 102 | 135g | 54g | 5 | −4% |
| **3 Zwykła** | **6-18** | **24.0** | **120** | **180g** | **72g** | **4** | **0%** |
| 4 Dobra | 6-19 | 25.0 | 138 | 243g | 97g | 4 | +3% |
| 5 Wysoka | 7-20 | 27.0 | 162 | 342g | 137g | 4 | +6% |
| 6 Mistrzowska | 7-21 | 28.0 | 192 | 504g | 202g | 3 | +9% |
| 7 Arcymistrzowska | 7-22 | 29.0 | 240 | 810g | 324g | 3 | +12% |

### Młot (bazowo: 14-20 dmg, cooldown 0.65s, trwałość 140, cena 280/112g, wymóg Siła 6)
| Poziom | Obrażenia | DPS | Trwałość | Kupno | Sprzedaż | Wymóg Siła | Tempo ataku |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 Podła | 12-17 | 22.3 | 98 | 154g | 62g | 7 | −8% |
| 2 Niska | 13-18 | 23.8 | 119 | 210g | 84g | 7 | −4% |
| **3 Zwykła** | **14-20** | **26.2** | **140** | **280g** | **112g** | **6** | **0%** |
| 4 Dobra | 15-21 | 27.7 | 161 | 378g | 151g | 6 | +3% |
| 5 Wysoka | 15-22 | 28.5 | 189 | 532g | 213g | 6 | +6% |
| 6 Mistrzowska | 16-23 | 30.0 | 224 | 784g | 314g | 5 | +9% |
| 7 Arcymistrzowska | 17-24 | 31.5 | 280 | 1260g | 504g | 5 | +12% |

---

## Tabela: PRZED / PO — pancerz

Trwałości nie ma (§4.8 dokumentu koncepcyjnego — pancerz świadomie na razie
bez niej).

### Skórzany komplet (kaptur/kaftan/nogawice/buty: obrona bazowa 5/10/7/5, brak wymogu)
| Poziom | Kaptur | Kaftan | Nogawice | Buty | Suma | Redukcja obrażeń całego kompletu |
|---|--:|--:|--:|--:|--:|--:|
| 1 Podła | 4 | 9 | 6 | 4 | 23 | 31.5% |
| 2 Niska | 5 | 9 | 6 | 5 | 25 | 33.3% |
| **3 Zwykła** | **5** | **10** | **7** | **5** | **27** | **35.1%** |
| 4 Dobra | 5 | 11 | 7 | 5 | 28 | 35.9% (+2,4% realnie) |
| 5 Wysoka | 6 | 11 | 8 | 6 | 31 | 38.3% (+9,1% realnie) |
| 6 Mistrzowska | 6 | 12 | 8 | 6 | 32 | 39.0% (+11,3% realnie) |
| 7 Arcymistrzowska | 6 | 12 | 8 | 6 | 32 | 39.0% (+11,3% realnie) |

### Stalowy komplet (hełm/napierśnik/nagolenniki/buty: obrona bazowa 10/22/15/10, wymóg Siła 2/4/3/2)
| Poziom | Hełm | Napierśnik | Nagolenniki | Buty | Suma | Redukcja obrażeń całego kompletu |
|---|--:|--:|--:|--:|--:|--:|
| 1 Podła | 9 | 19 | 13 | 9 | 50 | 50.0% |
| 2 Niska | 9 | 20 | 14 | 9 | 52 | 51.0% |
| **3 Zwykła** | **10** | **22** | **15** | **10** | **57** | **53.3%** |
| 4 Dobra | 11 | 23 | 16 | 11 | 61 | 55.0% (+3,2% realnie) |
| 5 Wysoka | 11 | 24 | 17 | 11 | 63 | 55.8% (+4,7% realnie) |
| 6 Mistrzowska | 12 | 25 | 17 | 12 | 66 | 56.9% (+6,8% realnie) |
| 7 Arcymistrzowska | 12 | 26 | 18 | 12 | 68 | 57.6% (+8,2% realnie) |

Ceny pojedynczych sztuk pancerza i pełne tabele wymogów Siły (analogiczne do
broni powyżej) dostępne na życzenie — pominięte tu dla zwięzłości, wzór
mnożników jest identyczny jak przy broni (`priceMul`, `requirement`).

---

## Fakty zaobserwowane przy liczeniu tabel (nie opinie — wynikają z zaokrągleń w kodzie)

- **Kij: Zwykła i Dobra dają identyczny wyświetlany zakres obrażeń (6-9)** —
  różnica +5% ginie w zaokrągleniu przy tak małych liczbach.
- **Sztylet: Mistrzowska i Arcymistrzowska dają identyczny zakres i DPS
  (8-13, 23.3)** — mimo że to dwa różne, teoretycznie odrębne poziomy jakości.
- **Skórzany komplet: Wysoka i Arcymistrzowska dają identyczną sumę obrony
  (32) i identyczną redukcję obrażeń (39,0%)** — dwa najwyższe poziomy
  jakości dla całego zestawu są w praktyce nierozróżnialne liczbowo.
- Redukcja obrażeń rośnie WOLNIEJ niż nominalny % z tabeli jakości (krzywa
  malejących przyrostów `obrona/(obrona+50)`), i to zjawisko jest silniejsze
  im więcej gracz ma już obrony (patrz stal: +20% nominalnie → +8,2%
  realnie, licząc od pełnego zestawu Zwykłego).

---

## Moje pytania dla recenzenta

Proszę o ocenę jako osoba z zewnątrz, nieznająca całego projektu — poniższe
pytania są neutralne, nie sugerują "poprawnej" odpowiedzi, mają pomóc ocenić
system na podstawie samych liczb i mechaniki opisanej wyżej.

1. **Czy tabela `damage`/`defense` (te same % dla obu) ma sens, biorąc pod
   uwagę, że `defense` przechodzi przez krzywą malejących przyrostów, a
   `damage` nie?** Widać to w tabelach: ten sam poziom jakości daje pełny
   nominalny efekt na obrażeniach, ale mocno skompresowany na obronie —
   i tym słabszy, im lepszy zestaw pancerza gracz już nosi. Czy to problem,
   czy nieistotny szczegół na tym etapie gry?
2. **Czy zaobserwowane kolizje zaokrągleń (kij 3=4, sztylet 6=7, skóra 5=7)
   są akceptowalne dla bardzo taniej/słabej broni, czy to sygnał, że niskie
   wartości bazowe i procentowe modyfikatory się nie uzupełniają?**
3. **Bonus tempa ataku z jakości wchodzi w ten sam limit (cap) co Zręczność
   gracza i pierścienie.** Efektywna wartość tego samego przedmiotu może
   wynosić od pełnych +12% do ~0%, zależnie od reszty ekwipunku/atrybutów
   gracza. Czy to akceptowalne (naturalny efekt wspólnego capu), czy warto
   to inaczej rozwiązać?
4. **Trwałość jest już aktywna (broń zużywa się co zamach), ale naprawa
   jeszcze nie istnieje.** Przy obecnych bazowych pulach trwałości i 15%
   szansie na -1/zamach, złamanie broni następuje po rzędu kilku-kilkunastu
   minut ciągłej walki, po czym zostaje ona trwale na połowie obrażeń. Czy
   to akceptowalne ryzyko na etapie prototypu, czy trwałość powinna raczej
   wejść RAZEM z naprawą, nie przed nią?
5. **Krzywa cen (`priceMul`: 0,55 / 0,75 / 1 / 1,35 / 1,9 / 2,8 / 4,5) jest
   identyczna dla broni i pancerza**, mimo że (patrz pytanie 1) realna
   wartość zakupu wyższej jakości pancerza jest mniejsza niż broni. Czy to
   wymaga osobnej krzywej cen dla pancerza, czy to nieistotne przy tak
   wczesnym etapie ekonomii gry?
6. **Ogólne wrażenie:** patrząc WYŁĄCZNIE na powyższe tabele (bez znajomości
   całego kodu) — czy jakość wykonania w obecnym kształcie wygląda na system,
   który gracz odczuje jako sensowną, czytelną drabinkę, czy raczej jako
   kosmetyczny dodatek do istniejącej drabinki broni (sztylet→miecz→
   toporek→siekiera→młot)?
7. **Pytania otwarte z pierwotnego dokumentu koncepcyjnego, wciąż
   nierozstrzygnięte w kodzie**: czy jakość powinna dotyczyć też pierścieni;
   czy naprawa ma przywracać 100% trwałości czy trwale ją obniżać (klasyka
   gatunku) — i jeśli obniża, kiedy przedmiot ostatecznie "umiera"; czy
   przedmioty otrzymywane z zadań (`grant`) powinny mieć ustaloną jakość
   niezależną od standardowej (Zwykła).

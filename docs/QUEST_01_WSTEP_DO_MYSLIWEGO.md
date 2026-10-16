---
typ: HISTORIA
domena: quests
tytul: Quest 01 — wstęp do gry, analiza zewnętrzna
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-22
---

# QUEST 01 — Wstęp do gry / droga do Myśliwego

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/quests.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status:** koncepcja do analizy i implementacji  
> **Zakres dokumentu:** od rozpoczęcia świeżej gry na podwórzu domu gracza do pierwszego dotarcia do Wszebora (Myśliwego).  
> **Cel:** rozbudować istniejące `QUESTS.stick_in_hand` z prostego tutorialu ekwipunku w pierwszy naturalny łańcuch społeczny Zagajów, bez dokładania nowych lokacji i bez klasycznego „tutorialu z popupami”.

---

## 1. Założenie nadrzędne

Pierwsze minuty gry mają nauczyć gracza, że:

1. **sprzęt ma znaczenie,**
2. **mieszkańcy Zagajów są ze sobą powiązani,**
3. **zadania mogą rozgałęziać się na główny i poboczny kierunek,**
4. **przygotowanie do wyjścia jest częścią RPG,**
5. **nie każdy NPC istnieje tylko po to, żeby dać osobny quest,**
6. gracz nie zaczyna jako wojownik — dostaje absolutne minimum pozwalające mu przetrwać.

Pierwszy quest nie powinien być checklistą:

> porozmawiaj z ojcem → matką → Patryczkiem → Myśliwym

Każde przejście musi wynikać z relacji między postaciami.

---

# 2. Kanon postaci użytych we wstępie

## Marko — ojciec

- zna zamiary syna i wie, że chce pomagać rannemu Wszeborowi,
- nie jest z tego zadowolony, ale nie zatrzymuje bohatera,
- daje mu **osiosany kij**,
- zna Patryczka jako kolegę syna, który „włóczył się po karczmach” i niejednemu nabił guza,
- **NIE WIE**, że Patryczek świeżo złamał rękę,
- sugeruje zabranie Patryczka ze sobą dla bezpieczeństwa,
- opcjonalnie odsyła też gracza do Aliny po jedzenie.

Marko **nie wysyła gracza do Patryczka jako do trenera**.

Z jego perspektywy:

> „Nie idź sam. Weź ze sobą kolegę, który potrafi się bić.”

To istotna różnica.

---

## Alina — matka

- opcjonalny etap pierwszego zadania,
- przygotowuje synowi jedzenie na drogę,
- służy jako naturalne wprowadzenie do **slotów użytkowych**,
- nie blokuje postępu, jeśli gracz ją pominie,
- jej zachowanie pokazuje, że akceptuje decyzję syna bardziej praktycznie niż Marko.

---

## Patryczek — kolega gracza

Istniejący kanon pozostaje:

- kolega bohatera,
- mieszka u babki Doroty,
- kiedyś często bił się po karczmach,
- obecnie chce trenować pod turniej pięściarski w mieście,
- pomaga Dorocie przy ziołach, choć nie jest to jego życiowe zajęcie,
- ma **świeżo złamaną dłoń / śródręcze** po głupim incydencie w bójce,
- Dorota złożyła mu rękę,
- uraz jest na tyle lekki, że może mówić i instruować, ale wyklucza normalną walkę.

### Ważne

Gracz **zna Patryczka przed rozpoczęciem gry**.

Pierwsza rozmowa nie może wyglądać jak przedstawianie nowego NPC-a:

> „Cześć, jestem Patryczek.”

To spotkanie dwóch znajomych.

---

## Dorota — zielarka, babka Patryczka

Nie jest obowiązkowym etapem dojścia do Wszebora.

Patryczek otwiera do niej **pierwszy sidequest**:

> „Jak już będziesz się włóczył po lesie, możesz przy okazji pomóc babce.”

Dzięki temu po spotkaniu z Patryczkiem gracz dostaje pierwsze lekkie rozwidlenie:

- **główny kierunek:** Wszebor,
- **poboczny kierunek:** Dorota.

Dorota ma później możliwość delikatnego pociągnięcia / zasiania **głównego wątku fabularnego** poprzez swoją wiedzę o roślinach, zwierzętach i zmianach zachodzących przy lesie.

Nie należy jednak wykładać głównej tajemnicy przy pierwszej rozmowie.

---

# 3. Docelowy graf początku

```text
START — podwórze domu gracza
          │
          ▼
        MARKO
          │
          ├── daje: OSIOSANY KIJ [Podła jakość]
          │
          ├── obowiązkowo: załóż kij
          │
          │
          ├──────────────► ALINA [OPCJONALNIE]
          │                    │
          │                    ├── daje jedzenie
          │                    └── tutorial slotu użytkowego
          │
          ▼
      PATRYCZEK
          │
          ├── ujawnienie świeżej kontuzji
          ├── nie może iść z graczem
          ├── podstawy walki
          ├── podstawy typów obrażeń / rodzin broni
          ├── daje: STARE OWIJKI [Podła jakość]
          │
          ├──────────────► DOROTA [SIDEQUEST]
          │                    │
          │                    └── zioła + zalążek głównego wątku
          │
          ▼
       WSZEBOR
          │
          └── KONIEC ZAKRESU TEGO DOKUMENTU
```

---

# 4. Pierwszy quest — propozycja konstrukcji

## ID techniczne

Najbardziej ekonomiczne rozwiązanie:

- zachować istniejący ID: `stick_in_hand`,
- rozszerzyć jego zakres zamiast tworzyć kilka mikroquestów.

### Tytuł wyświetlany

Do decyzji.

Obecne **„Kij w ręku”** nadal może działać, ale po rozszerzeniu questa przestaje opisywać całość.

Kandydaci:

- **Kij w ręku** — zachowuje istniejący charakter i minimalizuje zmianę,
- **Nie idź sam** — dobrze opisuje motyw ojca,
- **Za wieś** — najbardziej neutralne,
- **Pierwszy krok** — bardziej generyczne, najmniej preferowane.

**Rekomendacja:** na razie zachować `Kij w ręku`; nazwę zmienić dopiero po playteście pełnego początku.

---

# 5. Etap 1 — Marko i kij

## Stan wejściowy

Świeża gra.

- bohater nie ma broni,
- `INVENTORY.startingItems` pozostaje puste,
- gracz zaczyna na własnym podwórzu,
- Marko i Alina znajdują się przy gospodarstwie.

## Rozmowa z Markiem

Nie przepisywać jej jako tutorialowego wykładu.

Sens sceny:

1. Marko widzi, że syn naprawdę zamierza pomagać Wszeborowi.
2. Daje mu kij, bo nie wypuści go z gołymi rękami.
3. Każe mu wziąć ze sobą Patryczka.
4. Wspomina o Alinie jako opcjonalnym przygotowaniu.

### Kierunek dialogu — wersja robocza

> **Marko:**  
> Skoro już się uparłeś, to przynajmniej nie idź z gołymi rękami. Weź.
>
> **[gracz otrzymuje osiosany kij]**
>
> **Marko:**  
> I nie łaź tam sam. Weź ze sobą tego swojego kolegę… Patryczka. Tego, co się tak po karczmach włóczył.
>
> **Gracz:**  
> Patryczka?
>
> **Marko:**  
> Niejednemu już podobno guza nabił. Jak nic więcej, to przynajmniej będzie wiedział, kiedy trzeba komuś przyłożyć, a kiedy brać nogi za pas.
>
> **Marko:**  
> A zanim pójdziesz, możesz zajrzeć do matki. Jak wyjdziesz głodny, to potem będzie marudziła mnie, nie ciebie.

Ton:

- ojciec docina,
- ale decyzje wynikają z troski,
- Patryczek jest znanym kolegą syna,
- Marko nie zna jego obecnego urazu.

---

# 6. Cel obowiązkowy — założenie kija

Istniejący tutorial zostaje.

## Objective

**Załóż osiosany kij.**

Mechanicznie:

- otwarcie ekwipunku,
- umieszczenie broni we właściwym slocie,
- pierwsze zetknięcie ze sprzętem i jakością.

### Ważne

Po założeniu kija **quest nie kończy się**.

To tylko pierwszy etap.

Kij:

- **Podła jakość**,
- startowa, biedna broń,
- typ obrażeń: obuchowy,
- **bez rodziny broni**, zgodnie z aktualnym kanonem projektu,
- nadal powinien być zabezpieczony przed softlockiem / sprzedażą na czas wymagającego go etapu, zgodnie z istniejącym `stick_in_hand`.

---

# 7. Etap opcjonalny — Alina i prowiant

Po rozmowie z Markiem aktywuje się opcjonalny objective:

> **[Opcjonalne] Porozmawiaj z Aliną przed wyjściem.**

Nie blokuje questu.

## Funkcja projektowa

Alina wprowadza:

- jedzenie,
- sloty użytkowe,
- przygotowanie do drogi,
- możliwość szybkiego używania przedmiotów.

Nie tworzyć osobnego tutorialowego NPC-a ani osobnego questa.

---

## Proponowana scena

> **Gracz:**  
> Ojciec powiedział, żebym do ciebie zajrzał.
>
> **Alina:**  
> Oczywiście. Sam by cię wypuścił z kijem i pustym żołądkiem.
>
> **Alina:**  
> Masz. I nie zjedz wszystkiego, zanim dojdziesz do palisady.

Gracz otrzymuje np.:

- `2x Pajda chleba`

Dokładny balans do ustalenia.

Jedzenie powinno być **realnym istniejącym przedmiotem użytkowym**, nie sztucznym quest itemem.

---

## Tutorial slotu użytkowego

Objective opcjonalny może po otrzymaniu jedzenia zmienić się na:

> **[Opcjonalne] Umieść jedzenie w slocie użytkowym.**

Gracz:

1. otwiera plecak,
2. przypisuje jedzenie do slotu,
3. widzi, że przedmiot jest dostępny z HUD-u.

Nie zmuszać gracza do zjedzenia jedzenia na pełnym stanie.

### Jeśli gracz ominie Alinę

- quest główny idzie dalej,
- jedzenie nie przepada permanentnie,
- Alina może później nadal dać pakunek,
- zmienia się tylko greeting, np.:

> Nawet jedzenia nie wziąłeś. Ty zapomniałeś, ja nie.

---

# 8. Etap 2 — droga do Patryczka

Po założeniu kija:

> **Cel główny: Znajdź Patryczka.**

Fabularnie gracz nie idzie „na trening”.

Idzie **zabrać kolegę ze sobą**, zgodnie z prośbą ojca.

To musi być zachowane w tekstach questa i dialogu.

---

# 9. Spotkanie z Patryczkiem — ujawnienie urazu

Gracz zna Patryczka, więc rozmowa zaczyna się bez przedstawiania.

### Proponowany rytm

> **Gracz:**  
> Patryczek. Ojciec mówił, żebyś poszedł ze mną do Wszebora.
>
> **Patryczek:**  
> Akurat dzisiaj?
>
> **Gracz:**  
> Co?
>
> **[gracz zauważa łubki / opatrunek]**
>
> **Gracz:**  
> Coś ty zrobił?
>
> **Patryczek:**  
> Nic.
>
> **Gracz:**  
> Patryczek.
>
> **Patryczek:**  
> Chłop się schylił.
>
> **Gracz:**  
> Jaki chłop?
>
> **Patryczek:**  
> Ten, któremu chciałem przyłożyć.
>
> **Gracz:**  
> I?
>
> **Patryczek:**  
> Za nim był słup.
>
> **Gracz:**  
> Uderzyłeś w słup?
>
> **Patryczek:**  
> Słup się nie schylił.

Humor ma być suchy, krótki.

Nie robić z urazu farsy na kilka ekranów dialogu.

---

# 10. Dlaczego Patryczek nie idzie z graczem

To ma być bezpośrednia konsekwencja urazu.

> **Gracz:**  
> Ojciec chciał, żebyś szedł ze mną.
>
> **Patryczek:**  
> I normalnie bym poszedł. Ale z tą ręką bardziej byś mnie pilnował, niż ja ciebie.

To jest pierwszy drobny „zwrot” questa:

**plan Marko nie działa.**

Gracz mimo wszystko będzie musiał iść sam.

---

# 11. Patryczek — podstawy walki

Patryczek nie jest formalnym mistrzem broni.

Jego kompetencja wynika z:

- bójek karczemnych,
- treningu pięściarskiego,
- praktycznego obycia z przemocą.

Rama rozmowy:

> „Nie nauczę cię teraz walczyć. Mogę ci pokazać tyle, żebyś potrafił się odgonić i uciec, jeśli coś wyskoczy z krzaków.”

To bardzo ważne dla power fantasy:

**na początku nie robimy z bohatera wojownika.**

---

## 11.1. Atak i timing

Patryczek powinien przekazać:

- nie machaj bezmyślnie,
- rozpoczęty cios angażuje postać,
- trzeba obserwować moment ataku.

Przykład:

> Jak już się zamachujesz, to przez chwilę jesteś zajęty właśnie tym. Najpierw patrz, potem bij.

To fabularnie tłumaczy istniejący **wind-up / root**.

---

## 11.2. Dystans

> Masz kij. Jest dłuższy od pięści, pazurów czy zębów. Po coś ta długość jest — nie właź przeciwnikowi pod nos.

To wprowadza myślenie o **zasięgu broni**.

---

## 11.3. Odwrót

Jedna z najważniejszych lekcji:

> Jak coś jest większe od ciebie albo przyjdzie ich kilku, nie musisz niczego udowadniać. Odganiasz się i uciekasz.

Gra od początku ma komunikować:

**nie każdą walkę trzeba wygrać.**

Jest to szczególnie ważne przy istniejącym Szarym na mapie.

---

# 12. Patryczek — typy obrażeń i różnice między broniami

To ma być **krótki model mentalny**, nie pełny wykład systemowy.

Gracz ma wyjść z rozmowy rozumiejąc tylko:

> broń nie różni się wyłącznie liczbą obrażeń — różni się też sposobem zadawania obrażeń.

---

## 12.1. Kij — obuch

Patryczek używa przedmiotu, który gracz już trzyma.

> Tym kijem możesz komuś przede wszystkim nabić guza. Nie tnie, nie przebija — po prostu wali. To obuch.

Technicznie kij nadal nie musi należeć do systemowej rodziny `blunt`; rozmowa dotyczy **typu obrażeń**, nie pola `family`.

---

## 12.2. Miecz

> Mieczem możesz ciąć, ale jak trzeba, możesz też pchnąć sztychem.

Wprowadza ideę:

- cięcie,
- kłucie,
- możliwe warianty ataku jednej broni.

Nie tłumaczyć jeszcze UI wariantów.

---

## 12.3. Topór

> Topór przede wszystkim tnie. Zależy od głowicy, ale niektórym da się też porządnie przyłożyć drugą stroną.

Nie obiecywać mechaniki, której dana konkretna wersja topora nie ma.

Patryczek opisuje **kategorię i logikę**, nie gwarantowany moveset każdego itemu.

---

## 12.4. Włócznia

> Włócznia jest do kłucia. I ma tę zaletę, że coś z zębami może być dalej od ciebie.

Wprowadza:

- obrażenia kłute,
- zasięg.

---

## 12.5. Najważniejsza zasada

Gracz może zapytać:

> To która broń jest najlepsza?

Patryczek:

> **Nie ma najlepszej. Jest tylko lepsza do tego, co masz przed sobą.**

To powinno być traktowane jako jedna z głównych tez systemu walki.

---

## 12.6. Czego NIE tłumaczyć teraz

Nie wprowadzać jeszcze szczegółowo:

- materiałów pancerza,
- procentowych odporności,
- penetracji,
- krytyków,
- jakości wykonania poza samym pokazaniem jakości itemów,
- tarcz,
- aktywnych umiejętności,
- wszystkich wariantów ataku,
- rodzin broni jako technicznego systemu,
- dokładnych bonusów kontra konkretny typ przeciwnika.

Na tym etapie wystarczy:

**obuch / cięcie / kłucie + zasięg + timing + możliwość ucieczki.**

---

# 13. Darmowe owijki Patryczka

Po krótkiej nauce Patryczek zauważa, że gracz idzie praktycznie bez ochrony.

Daje mu swoje stare owijki.

### Dialog roboczy

> **Patryczek:**  
> Czekaj jeszcze.
>
> **Patryczek:**  
> Jak już masz się tam włóczyć, to chociaż osłoń ręce.
>
> **Gracz:**  
> To twoje?
>
> **Patryczek:**  
> Stare. Przetarte. Śmierdzą trochę mniej, niż wyglądają.
>
> **Patryczek:**  
> Wielkiego ciosu nie zatrzymają, ale lepsze to niż goła skóra.

---

## Przedmiot

Roboczo:

**Stare owijki Patryczka**

Założenia:

- slot: dłonie,
- jakość: **Podła**,
- bardzo niska ochrona,
- niska wartość / najlepiej praktycznie bez wartości handlowej,
- mogą mieć niską trwałość,
- żadnych specjalnych bonusów.

### Funkcja

To ma być:

- pierwszy element pancerza,
- tutorial slotu dłoni,
- symbol „biednego startu”,
- prezent wynikający z relacji, nie nagroda za grind.

---

# 14. WAŻNE — owijki nie zastępują istniejącej nagrody z chaina Doroty

Obecna dokumentacja przewiduje, że łańcuch Patryczek → Dorota → Patryczek kończy się:

**rękawicami pikowanymi jakości Zwykłej.**

Nowe owijki powinny z tym współistnieć.

Wręcz tworzą bardzo czytelną progresję:

```text
STARE OWIJKI PATRYCZKA
Podła jakość
darmowe / początek gry
        │
        │ sidequest zielarski
        ▼
RĘKAWICE PIKOWANE
Zwykła jakość
realny upgrade
```

To wzmacnia istniejący chain.

Gracz dostaje od Patryczka zużyte owijki, a pomagając później jemu i Dorocie, zdobywa **normalny, porządnie wykonany odpowiednik**.

Nie usuwać istniejącej nagrody.

---

# 15. Patryczek otwiera pierwszy sidequest — pomoc Dorocie

Po przekazaniu owijek rozmowa może wyglądać tak:

> **Patryczek:**  
> A jak już będziesz się włóczył po lesie…
>
> **Patryczek:**  
> Zajrzyj do babki. Ostatnio ciągała mnie za sobą po zioła, a z tą ręką niewiele jej pomogę.
>
> **Patryczek:**  
> Jak czegoś potrzebuje, możesz zebrać przy okazji. Tylko nie mów, że obiecałem za ciebie.

To **nie blokuje** dojścia do Wszebora.

---

# 16. Rozwidlenie po Patryczku

Po rozmowie gracz powinien mieć dwa aktywne kierunki.

## Główny

> **Porozmawiaj z Wszeborem.**

## Poboczny

> **Sprawdź, czy Dorota potrzebuje pomocy.**

To jest pierwsze kontrolowane otwarcie struktury gry.

Gracz może:

- najpierw iść do Wszebora,
- najpierw iść do Doroty,
- odwiedzić Alinę, jeśli wcześniej ją pominął.

Nie otwierać jeszcze całej wsi i wielu questów równocześnie.

---

# 17. Sidequest Doroty — zakres na tym etapie

Szczegóły tego questa wymagają osobnego dokumentu, ale jego rola we wstępie jest już ustalona.

Patryczek wysyła gracza do Doroty dlatego, że:

- normalnie to on pomaga jej w zbieraniu,
- ma świeżo złamaną rękę,
- nie chce, żeby babka chodziła sama dalej w las,
- gracz i tak będzie się tam włóczył.

To jest naturalna motywacja.

---

## 17.1. Istniejące ustalenia, których nie kasować

Według aktualnej dokumentacji chain używa:

- **babki**,
- **pokrzywy**,

tak żeby nie dublować obecnych zadań Doroty.

Pokrzywa później ma sens jako **włókno** do wykonania rękawic pikowanych.

Te założenia można zachować, o ile nowy przebieg narracyjny ich nie złamie.

---

## 17.2. Dorota jako pierwszy subtelny nośnik głównego wątku

Dorota może zauważać rzeczy, których inni mieszkańcy nie łączą jeszcze w całość:

- pewne zioła rosną gorzej / znikają z dawnych miejsc,
- zwierzyna schodzi bliżej wsi,
- coś zmienia zachowanie lasu,
- Szary może być skutkiem, a nie źródłem problemu.

Bardzo ważne:

**nie wykładać odpowiedzi.**

Przykładowy poziom subtelności:

> „Krwawnik był tam od lat. Teraz muszę chodzić po niego coraz dalej.”
>
> albo:
>
> „Wilk może przegonić zwierzynę. Nie sprawi, że ziemia nagle przestanie rodzić to, co rodziła od dwudziestu lat.”

Gracz może zapytać:

> „To co się dzieje?”

Dorota:

> „Jak będę wiedziała, pierwsza ci powiem. Na razie przynieś mi zioła.”

To jest breadcrumb, nie exposition.

---

# 18. Dotarcie do Wszebora

Po Patryczku gracz rusza do Myśliwego.

Na tym kończy się zakres tego dokumentu.

Stan gracza przy dotarciu powinien typowo wyglądać:

## Obowiązkowo

- broń: **osiosany kij — Podła jakość**,
- zna podstawowy atak,
- rozumie podstawowo dystans,
- wie, że może / powinien uciekać,
- wie, że istnieją trzy główne sposoby zadawania obrażeń:
  - obuch,
  - cięcie,
  - kłucie,
- wie, że różne bronie nie są jedynie liniowymi upgrade'ami.

## Po Patryczku

- dłonie: **stare owijki Patryczka — Podła jakość**,
- ma otwarty pierwszy sidequest prowadzący do Doroty.

## Opcjonalnie po Alinie

- ma jedzenie,
- zna slot użytkowy.

## Opcjonalnie po Dorocie

- ma rozpoczęty / częściowo poznany chain zielarski,
- usłyszał pierwszy bardzo subtelny sygnał, że problem lasu może być większy niż sam Szary.

---

# 19. Co gracz został nauczony bez klasycznego tutorialu

| System | Kto / co go uczy |
|---|---|
| zakładanie broni | Marko → kij |
| jakość przedmiotów | kij i owijki są Podłe |
| slot broni | kij |
| slot użytkowy | Alina → jedzenie |
| używanie jedzenia / prowiantu | Alina |
| slot dłoni / pancerz | Patryczek → owijki |
| podstawowy atak | Patryczek |
| wind-up / zobowiązanie do ciosu | Patryczek |
| zasięg | Patryczek |
| możliwość odwrotu | Patryczek |
| obuch / cięcie / kłucie | Patryczek |
| różne funkcje różnych broni | Patryczek |
| pierwszy sidequest | Patryczek → Dorota |
| nieliniowa kolejność celu | Wszebor vs Dorota vs opcjonalna Alina |
| NPC są ze sobą powiązani | cały chain |

To jest zasadnicza wartość tego wstępu.

---

# 20. Struktura questa / objective — sugestia techniczna

Jeżeli system questowy pozwala na sekwencyjne objective, `stick_in_hand` powinien działać mniej więcej tak:

```text
QUEST: stick_in_hand

1. talk: Marko / accept
2. equip: osiosany kij
3. OPTIONAL talk: Alina
   3a. OPTIONAL equip/use-slot: jedzenie
4. talk: Patryczek
5. equip: stare owijki
6. unlock sidequest: babka_ziola / odpowiednik
7. talk: Wszebor
8. complete stick_in_hand
```

### Do sprawdzenia w kodzie

- czy quest obsługuje objective opcjonalne,
- czy można aktualizować cel po `equip`,
- czy `talk` może być zaliczany tylko po odpowiednim etapie,
- czy sidequest można odblokować flagą / ukończonym etapem, a nie pełnym ukończeniem `stick_in_hand`,
- czy `rabbit_hunt` powinien nadal wymagać całego `stick_in_hand`, czy startować z rozmowy Wszebora po jego ukończeniu.

---

# 21. Alternatywa techniczna, jeśli opcjonalne objective są niewygodne

Nie rozbudowywać systemu questowego tylko dla jednego tutorialu.

Alina może działać całkowicie **poza objective questa**:

- Marko tylko wspomina „zajrzyj do matki”,
- Alina ma stateful greeting,
- przy pierwszej rozmowie wydaje jedzenie,
- UI pokazuje tutorial slotu użytkowego,
- brak wpisu `[Opcjonalne]` w dzienniku.

Narracyjnie efekt jest prawie ten sam.

### Rekomendacja

Jeżeli optional objective wymaga nowej architektury — **nie implementować jej teraz**.

Pierwszeństwo ma flow gry, nie kompletność checklisty.

---

# 22. Ryzyka projektowe

## 22.1. Za dużo tekstu przed pierwszą walką

W tej konstrukcji występują:

- Marko,
- opcjonalnie Alina,
- Patryczek,
- opcjonalnie Dorota,
- dopiero potem Wszebor i pierwsza robota.

Trzeba pilnować, żeby rozmowy były krótkie.

Patryczek może mieć więcej tematów dostępnych opcjonalnie, ale **główna ścieżka dialogu powinna być zwięzła**.

Cel: gracz nie powinien mieć poczucia, że przez 15 minut tylko klika dialogi.

---

## 22.2. Patryczek nie może wykładać całego combat designu

Minimalny obowiązkowy pakiet:

1. dystans,
2. timing,
3. uciekaj, gdy trzeba,
4. obuch / cięcie / kłucie,
5. „nie ma najlepszej broni”.

Reszta później.

---

## 22.3. Nie robić z Aliny obowiązkowego checkpointu

Jej etap jest wartościowy dlatego, że jest opcjonalny.

Gracz, który do niej idzie, dostaje:

- prowiant,
- wiedzę,
- przygotowanie.

Gracz, który nie idzie:

- nadal może grać,
- nie dostaje softlocka,
- nie traci przedmiotu na zawsze.

---

## 22.4. Nie otwierać pięciu questów po Patryczku

Na tym etapie:

- 1 główny cel: Wszebor,
- 1 sidequest: Dorota.

Wystarczy.

---

## 22.5. Nie robić z owijek zbyt dobrego przedmiotu

Są darmowe i mają przede wszystkim:

- nauczyć slotu,
- osłonić dłonie symbolicznie,
- dać poczucie przygotowania.

Ich zadaniem jest zostać później zastąpione.

---

# 23. Wpływ na istniejące dokumenty / elementy

Claude powinien przed implementacją sprawdzić zgodność co najmniej z:

- `swiat.md`
  - § Ojciec,
  - § Matka,
  - § Samouczek `stick_in_hand`,
  - zależność `stick_in_hand → rabbit_hunt`,
- `dziennik.md`
  - wpis o chainie „wnuk otwiera babkę”,
  - istniejące `requiresQuest`,
- `prompty_gemini.md`
  - brief Patryczka,
  - świeże złamanie dłoni / śródręcza,
  - Dorota jako osoba, która złożyła mu rękę,
- `typy_obrazen.md`,
- `warianty_atakow.md`,
- `bron_design_v1.md`,
- `ekwipunek_mechanika.md`,
- `ekwipunek_przedmioty.md`.

---

# 24. Elementy istniejącego kanonu, które należy zachować

1. **Kij daje ojciec, nie Myśliwy.**
2. Świeża gra zaczyna się w Zagajach przy domu bohatera.
3. Marko nie jest kaleką ani świeżo rannym.
4. Patryczek jest kolegą gracza.
5. Patryczek ma świeżo złamaną dłoń z własnej głupoty podczas bójki.
6. Dorota złożyła mu rękę.
7. Patryczek pomaga Dorocie w zbieraniu ziół.
8. Myśliwy pozostaje poza wsią.
9. Główny kręgosłup świata nadal prowadzi:
   `coś w głębi lasu → wilk/Szary → ranny Myśliwy → brak obchodów → problem zajęcy → gracz`.
10. Szary pozostaje przeciwnikiem, na którego świeży gracz nie jest gotowy.
11. Kij pozostaje startowym, prymitywnym narzędziem, a nie „pierwszą prawdziwą bronią”.
12. `family` broni i `damageType` to dwa różne systemy — dialog Patryczka nie może ich mieszać.

---

# 25. Najważniejszy efekt fabularny

Po pierwszych kilku minutach bohater nie wygląda jak „postać po tutorialu”.

Wygląda jak młody chłopak z wioski przygotowany do pierwszego wyjścia tym, co mieli pod ręką jego bliscy:

- **ojciec** dał mu kij,
- **matka** dała mu jedzenie,
- **kolega** oddał stare owijki i powiedział, jak nie dać się zabić,
- **babka kolegi** może poprosić go o pomoc przy ziołach,
- dopiero z takim przygotowaniem dociera do **rannnego Myśliwego**.

Nie ma miecza bohatera, skórzanej zbroi z tutorial chestu ani magicznej mikstury.

To powinno wzmacniać główną tożsamość projektu:

> **Nie jesteś nikim wyjątkowym. Jesteś synem rolnika z wioski na krańcu świata.**

---

# 26. Punkt końcowy dokumentu

Dokument **nie definiuje jeszcze pierwszego zadania Wszebora**.

Po dotarciu do Myśliwego należy osobno rozstrzygnąć:

- jego pierwszą reakcję na przygotowanie gracza,
- czy od razu uruchamia `rabbit_hunt`,
- czy jest jeszcze krótki etap przed zającami,
- jak wpiąć jego ranę,
- kiedy uruchomić pierwszy krok głównego chaina związanego z Szarym,
- kiedy Wszebor zaczyna odsyłać gracza do kolejnych mieszkańców.

To powinien być kolejny dokument / kolejna sesja projektowa.

---

# 27. Skrót dla Claude

**Proponowana zmiana:** rozszerzyć pierwszy quest z „załóż kij” do społecznego onboardingu prowadzącego z domu do Wszebora.

```text
Marko
→ kij [Podły]
→ opcjonalnie Alina + jedzenie + slot użytkowy
→ Patryczek
→ odkrycie świeżego złamania
→ mini-tutorial walki
→ wprowadzenie obuch / cięcie / kłucie
→ stare owijki [Podłe]
→ odblokowanie sidequesta Doroty
→ wybór Dorota albo Wszebor
→ dotarcie do Wszebora
```

**Najważniejsze:** nie zamieniać tego w serię tutorialowych popupów ani cztery osobne mikroquesty. Całość ma wynikać z relacji mieszkańców i przygotowania bohatera do pierwszego wyjścia.

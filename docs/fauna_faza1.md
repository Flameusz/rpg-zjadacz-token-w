---
typ: HISTORIA
domena: creatures
tytul: Fauna, Faza 1 — las zaczyna żyć
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-27
---

# Fauna, Faza 1 — „Las zaczyna żyć". Zakres do decyzji

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/creatures.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: ✅ WDROŻONE 2026-08-27, CZEKA NA PLAYTEST RĘKĄ.** `tsc` i
`npm run build` czyste; ⚠ **nie zweryfikowane w działającej grze** — panel
przeglądarki tej sesji zgłasza `document.hidden: true` nawet po sfrontowaniu
zakładki, więc żadna scena Phasera się nie aktywuje (ten sam znany limit
środowiska, co przy migracji sklepu). Manualna checklista: §9.

Decyzja §3.3 podjęta 2026-08-27: jeleń zostaje w kadrze, zryw 170 px/s —
między chodem gracza (150) a sprintem (240). Priorytet ustalony przez autora:
**reakcja → zryw → powrót do normalnego zachowania**; polowanie i tropienie
**później i bez pól „na przyszłość"** — dotrzymane, patrz §8.

Stan wyjściowy opisuje `docs/bestiariusz_audyt.md` — ten dokument nie powtarza
inwentaryzacji, tylko odpowiada „co zrobić najpierw i dlaczego akurat to".

Wszystkie liczby policzone z żywego `GameConfig.ts` i żywego
`forrest.tmj` (skrypty jednorazowe, nie zostawione w `tools/`).

---

## 1. Pomiar, który ustawia całą fazę

⚠ **Zanim cokolwiek o zachowaniu: policzyliśmy, ile fauny gracz W OGÓLE
WIDZI.** To zmienia kolejność prac, więc idzie pierwsze.

**Widoczny kadr** (`CAMERA.minTilesShortAxis` 9, kafel 32, zoom całkowity):

| urządzenie | zoom | widok świata | pół-wysokość |
|---|---|---|---|
| telefon (891×411 CSS, DPR 2,6) | 3 | **772 × 356 px** | **178** |
| desktop 1280×720 | 2 | 640 × 360 px | 180 |
| desktop 1920×1080 | 2 | 960 × 540 px | 270 |

**Oczekiwana liczba stworzeń w kadrze** (mapa lasu 3200×1920 px, kadr
telefonu ≈ 4,5% mapy):

| | spawnów | w kadrze |
|---|---|---|
| wrogowie razem | 19 | **0,85** |
| fauna neutralna razem | 7 | **0,31** |
| sarna | 2 | **0,09** |
| lis | 2 | **0,09** |

⚠ **Sarnę widać średnio raz na jedenaście ekranów. Zachowanie dopisane
stworzeniu o takiej gęstości jest pracą niewidoczną** — i to jest jedyny powód,
dla którego ten dokument w ogóle mówi o spawnach, mimo że zlecenie ich nie
wymieniało. Faza 1 bez przestawienia gęstości dostarczy kod, którego nie da się
ocenić w rozgrywce.

**Ale jest wyjątek i on ratuje kolejność prac.** Współrzędne z `forrest.tmj`:

```
player  (1232, 1616)
deer    (1300, 1500)   → 134 px od punktu wejścia
bird    (1184, 1600)   →  51 px
fox     ( 900,  900)   → 789 px
rabbit  najbliższy     → 334 px
```

⚠ **Pierwsza sarna stoi 134 px od punktu startowego mapy — czyli wewnątrz
pierwszego kadru** (kadr to ±386 × ±178; sarna wypada na dx 68, dy −116).
**Sarna jest, obok ptaka, pierwszą żywą istotą, jaką gracz widzi w lesie.**
Jedno stworzenie o gęstości 0,09 ma więc nieproporcjonalny udział w pierwszym
wrażeniu — i dlatego jeleń, a nie lis, jest właściwym pierwszym celem.

---

## 2. Mechanizm: najprostsza możliwa świadomość świata

### 2.1 Jedna linia infrastruktury

`GameScene.ts:2045` już iteruje po krytterach:

```ts
for (const critter of this.critters) critter.update(now);
```

Cała „świadomość świata" na tym etapie to **dopisanie drugiego argumentu**:
`critter.update(now, this.player)`. Nic więcej nie jest potrzebne — nie ma
rejestru zagrożeń, nie ma broadcastu, nie ma systemu percepcji.

### 2.2 Maszyna stanów — trzy fazy, wzorowane na króliku

`Critter` ma dziś dwa stany (`idling` / wędrówka). Dochodzą dwa:

```
wander ──(dist ≤ alertRange)──▶ alert ──(alertMs)──▶ flee
  ▲                              │                     │
  └──────(dist > calmGap)────────┴─────(fleeMs)────────┘
```

⚠ **Kopiujemy KSZTAŁT `Rabbit.flee`, nie kod — i to jest wybór, nie lenistwo.**
Kusi, żeby wyciągnąć archetyp `Prey` do wspólnego modułu, ale królicza ucieczka
siedzi **wewnątrz `Enemy.updateChase`** i jest spleciona z rzeczami, których
sarna nie ma: `provoked`, bramka `hop`, sploch po HP, `canDeaggro`, cooldown
kęsa. Wyciągnięcie wspólnego mianownika dziś znaczy **podpięcie sarny pod
maszynę stanów `Enemy` za zero zysku**. Reguła: wspólny moduł powstaje przy
TRZECIM użytkowniku, nie przy drugim.

Wspólne jest za to **to, czego trzeba pilnować**, i to przepisujemy wprost:

⚠ **Ucieczka MUSI być przerywana (zryw → postój), nigdy ciągła.**
`src/entities/CLAUDE.md` notuje to jako zmierzony błąd: pierwsza wersja królika
uciekała bez przerwy i **nie dało się go trafić w ogóle**. Sarny nie trzeba
trafiać — ale sarna, która nigdy nie staje, jest smugą, nie zwierzęciem. Postój
jest tu treścią: to jedyny moment, w którym gracz widzi, że ona na niego patrzy.

### 2.3 Czego NIE robić

⚠ **Nie robić z jelenia `Enemy`.** Sprawdzone w kodzie: blokada celu czyta
z grupy `this.enemies` (`GameScene.ts:1535/1583/1607`), a `Critter` w tej grupie
nie jest. Wejście do `Enemy` daje pasek HP, śmierć, obrażenia kontaktowe **i
klikalność** — czyli dokładnie to, co zlecenie wyklucza.

⚠ **Nie dokładać pathfindingu.** `Critter` używa dziś `physics.moveTo` (linia
prosta) i ucieczka używa tego samego. Kryttery **nie mają collidera z terenem**
(`map.solids` łączy się tylko z graczem, wrogami i pociskami) — chodzą przez
wszystko. Dziś tego nie widać, bo chodzą wolno i blisko; **zrywająca się sarna
to pokaże**. To jest świadoma cena Fazy 1, nie przeoczenie: dodanie collidera
krytterom jest osobną, większą zmianą.

---

## 3. Jeleń

### 3.1 Cztery odpowiedzi ze zlecenia

| pytanie | odpowiedź | liczba |
|---|---|---|
| reakcja na obecność | staje i patrzy (`alert`) | promień **≤ 170** — patrz niżej |
| reakcja na podejście | zryw w przeciwną stronę | po `alertMs` |
| ucieczka | zryw o stałym wektorze, potem postój | `fleeMs`, potem `alert` |
| powrót | wraca do wędrówki, gdy gracz się odsadzi | `calmGap` |

### 3.2 Promień czujności ma twardy sufit i to jest pomiar

⚠ **Promień reakcji musi być mniejszy niż pół-wysokość kadru (178 px), bo
inaczej sarna reaguje POZA EKRANEM.** Gracz idący z góry albo z dołu zobaczy
wtedy zwierzę, które już stoi spłoszone — czyli nie zobaczy reakcji, tylko jej
skutek. Punkt odniesienia: królik ma `prey.alertRange` **110** przy
`aggroRange` 140, i to działa.

Propozycja: **150** dla jelenia (płochliwszy niż królik, dalej wewnątrz kadru,
z zapasem 28 px na pionowe podejście).

### 3.3 ✅ ROZSTRZYGNIĘTE 2026-08-27: jeleń zostaje w kadrze, ale nie daje się dogonić stępa

**Decyzja autora — wariant „zostaje w kadrze", z korektą:** zryw ma
**przewyższać zwykły ruch gracza**, ale nie być ucieczką absolutną. Jeleń ma
pozostać widoczny przez pierwszą fazę reakcji i dać czas na decyzję. Cel:
**żywe zwierzę, nie dekoracja i nie niemożliwy cel.**

Kolejność priorytetów, też z decyzji: **reakcja → zryw → powrót do normalnego
zachowania**. Polowanie i tropienie należą do później i **nie wolno ich tu
antycypować** żadnym polem „na przyszłość".

#### Co to znaczy w liczbach

Zryw **170 px/s** siada dokładnie w widełkach, które stawia ta decyzja:

| | px/s | skutek |
|---|---|---|
| chód gracza | 150 | **nie dogoni** — jeleń utrzymuje przewagę |
| **zryw jelenia** | **170** | |
| sprint gracza | 240 | **dogoni, ale za staminę** |

⚠ **To nie jest liczba dobrana dla wygody — to jest cała treść „nie
dekoracji ani niemożliwego celu".** Podejście do jelenia przestaje być czymś,
co dzieje się samo przy chodzeniu, a staje się **decyzją z kosztem**
(`STAMINA.sprintPerSecond` 10/s, mnożone przez obciążenie). Gracz w stali
zapłaci za tę ciekawość więcej niż gracz w skórze — i nic o tym nie trzeba
mówić słowami.

#### Proponowany komplet (do strojenia na gałce, nie do zamrożenia)

| pole | wartość | skąd |
|---|---|---|
| `alertRange` | 150 | sufit 178 (§3.2), zapas 28 px na podejście pionowe |
| `alertMs` | 550 | **faza „widzę cię"** — dwukrotność króliczych 260, bo to jest właśnie ten czas na decyzję, o który prosi decyzja |
| `boltSpeed` | 170 | między chodem a sprintem (wyżej) |
| `boltMs` | 450 | jeden zryw = 76 px — krótko, żeby zaraz znów stanął |
| `watchMs` | 900 | postój; ⚠ **przerywany przez `panicGap`** |
| `panicGap` | 60 | poniżej tego jeleń zrywa się NATYCHMIAST, nie czekając na koniec postoju |
| `calmGap` | 260 | powyżej — powrót do wędrówki |

⚠ **`panicGap` jest tu nowy względem królika i bez niego rzecz się rozpada.**
Przeliczone dla gracza idącego stępa prosto na zwierzę: alert (550 ms, gracz
robi 82 px) → luka 68 px; zryw (450 ms, jeleń 76, gracz 67) → luka 77; postój
900 ms, w którym gracz robi 135 px — **czyli bez tej bramki wchodzi w jelenia
i staje na nim na pół sekundy**. Z bramką postój kończy się po ~110 ms, jeleń
zrywa się znowu, a pętla stabilizuje się na **60–80 px przewagi**: zwierzę
cały czas w kadrze, cały czas poza zasięgiem ręki.

Gdy gracz przestaje iść, jeleń robi jeszcze ~3 zrywy do `calmGap` 260 i wraca
do wędrówki. **To jest ten „powrót do normalnego zachowania" z priorytetów** —
i on musi być widoczny, bo zwierzę, które nie przestaje się bać, jest tak samo
martwe jak to, które się nie boi wcale.

#### ⚠ Podejście od góry albo od dołu jest przypadkiem gorszym i nie da się go zestroić

Kadr ma **772 px szerokości, ale tylko 356 wysokości**. Jeleń uciekający
„od gracza" w pionie wychodzi z kadru po ~1,3 zrywu, w poziomie mieści się
przez całą pętlę pościgu. Żadna wartość `boltSpeed` tego nie naprawia, bo to
jest kształt ekranu, nie liczba.

**Wniosek dla punktu 5 zakresu (spawny): stawiając sarny, wybieraj miejsca,
do których gracz dochodzi wzdłuż osi poziomej** — czyli przy szlaku wschód–zachód,
nie na wąskich przesmykach północ–południe. To jest rozstawienie robiące robotę
za mechanikę, i jest darmowe.

### 3.4 ⚠ Pułapka, którą ta zmiana wprowadza, jeśli się o niej nie pomyśli

`Critter.decide()` wybiera cel **wokół `homeX`/`homeY` zapisanych w
konstruktorze**, w promieniu `wanderRadius` (jeleń: 110):

```ts
this.target.set(this.homeX + Math.cos(angle) * r, this.homeY + Math.sin(angle) * r);
```

Sarna, która ucieknie 200 px, po powrocie do wędrówki **pójdzie prosto z
powrotem w stronę gracza**, bo tam jest jej dom. Wygląda to jak zwierzę
niezdolne do nauki i jest gorsze niż brak ucieczki.

Lekarstwo jest jednolinijkowe — **przepisać dom na miejsce, w którym zryw się
skończył** — ale trzeba je zaplanować, bo bez niego cała funkcja czyta się jako
zepsuta. ⚠ Konsekwencja do zważenia: sarna dryfuje wtedy po mapie na stałe,
zamiast trzymać się rewiru. Alternatywa: przesuwać dom o połowę dystansu zrywu
(kompromis między „ucieka" a „mieszka tu").

---

## 4. Lis

### 4.1 Obecność i ruch — już są, brakuje ZAMIARU

Lis chodzi dziś dokładnie tak samo jak sarna, krowa i owca: losowy punkt
w promieniu, postój, powtórz. Przy `idleChance` 0,45 stoi prawie połowę czasu.
To jest poprawne i całkowicie nieczytelne — nic w tym ruchu nie mówi, że to
drapieżnik.

**Najtańsza zmiana, która to odwraca: cel wędrówki wybierany DO CZEGOŚ.**
Zamiast losowego kąta — kierunek w stronę najbliższego punktu zainteresowania
(stanowisko ziół, królik, ognisko), z zachowaniem dzisiejszego `wanderRadius`
jako limitu. Zero pathfindingu: `moveTo` po prostej, tak jak dziś.

⚠ **Sam KIERUNEK czyta się jako zamiar, nawet gdy po drugiej stronie nic się
nie dzieje.** Lis idący konsekwentnie w jedną stronę wygląda, jakby coś wiedział;
lis chodzący w losowe strony wygląda jak dekoracja. To jest cała różnica i nie
wymaga żadnego systemu.

### 4.2 Bez robienia z niego przeciwnika

Nie dotykamy: HP, agro, obrażeń, klikalności. Lis zostaje `Critter`em.

---

## 5. Relacje między stworzeniami — ⚠ NIE w Fazie 1

Zlecenie pyta o trzy. Odpowiedź na wszystkie trzy brzmi „jeszcze nie", i dla
każdej z innego powodu.

### 5.1 „Lis płoszy królika" — nie, bo trzeba by ruszyć królika

Ucieczka królika przyjmuje **gracza**, nie „zagrożenie": `flee(player, nowMs)`,
a uruchamia ją `Enemy.updateChase`, czyli stan wywołany `aggroRange` **na
graczu**. Nie ma kanału „boję się czegoś innego". Dodanie go znaczy przebudowę
najlepiej ogranego stworzenia w grze.

⚠ **A zysk jest policzalny i mały:** żeby gracz to zobaczył, lis i królik muszą
być **jednocześnie w kadrze**. Najbliższa para spawnów to lis (900,900) i królik
(1072,1072) — 243 px w linii prostej, przy kadrze ±386 × **±178**. Mieszczą się
tylko przy kamerze ustawionej niemal dokładnie między nimi. **Dziś ta scena jest
praktycznie niewidoczna** i przebudowa królika kupiłaby ją dla ułamka procenta
przejść.

### 5.2 „Wilk wpływa na faunę" — nie, bo żaden wilk nie stoi przy faunie

Kanał broadcastu **już istnieje**: wycie ma `pack.callRadius` **200 px** i budzi
pobratymców. Podpięcie krytterów pod ten sam sygnał jest technicznie tanie.

⚠ **Ale zmierzone odległości mówią, że nic by się nie odpaliło.** Wilki stoją
w (464,1424), (579,1428), (516,1545), (912,1648); najbliższa sarna to (1300,1500)
— **415 px od najbliższego wilka**, czyli ponad dwa promienie wycia. **Żaden
krytter nie znajduje się dziś w zasięgu żadnego wilczego wycia.** To nie jest
brak mechaniki, to rozstawienie.

### 5.3 „Zwierzęta reagują na zagrożenie" — to jest §3, tylko szerzej

Reakcja na gracza JEST reakcją na zagrożenie. Uogólnienie źródła zagrożenia
z „gracz" na „cokolwiek groźnego" jest naturalnym krokiem **Fazy 2** i wtedy
obejmie i wilka, i lisa jednym mechanizmem. Robienie tego teraz znaczy budowanie
abstrakcji dla jednego użytkownika.

---

## 6. Minimalny zakres i pliki

| # | co | plik | rozmiar |
|---|---|---|---|
| 1 | `update(now)` → `update(now, player)` | `src/scenes/GameScene.ts` (~2045) | 1 linia |
| 2 | maszyna `wander/alert/flee` + przepisanie domu po zrywie | `src/entities/Critter.ts` | ~50 linii |
| 3 | pola reakcji w `CritterTuning`, wartości dla `DEER`; **`FOX` bez reakcji w tej fazie** | `src/config/GameConfig.ts` | blok konfigu |
| 4 | cel wędrówki lisa kierowany do punktu zainteresowania | `src/entities/Critter.ts` | ~15 linii |
| 5 | **gęstość i rozstawienie spawnów** sarn/lisów/ptaków | `public/assets/maps/forrest.tmj` | punkty |
| 6 | dopisek o zmianie granicy klas | `src/entities/CLAUDE.md` | akapit |

⚠ **Punkt 5 nie jest kosmetyką i nie jest opcjonalny** — patrz §1. Bez niego
punkty 1–4 dostarczają zachowanie o gęstości 0,09.

⚠ **`.tmj` edytuje się ręcznie albo skryptem jednorazowym, który NIE zostaje
w `tools/`.** Reguła katalogu: mapa tknięta w Tiled jest mapą, a `--zapisz`
generatora ją skasuje.

⚠ **Punkt 6 istnieje, bo ta zmiana łamie zapisaną regułę.**
`src/entities/CLAUDE.md` mówi dziś: *„`FarmAnimal` i `Critter` — różnią się
liczbami i grafiką, nie zachowaniem, więc nie rób z nich podklas"*. Po Fazie 1
sarna i lis **będą się różnić zachowaniem**. Rozwiązanie zgodne z kierunkiem
projektu: **jedna klasa, zachowanie sterowane konfigiem** (jak `EnemyConfig`),
a nie dwie podklasy. Regułę trzeba przepisać, nie złamać po cichu.

---

## 7. Ryzyka

| # | ryzyko | dlaczego groźne | co je zdejmuje |
|---|---|---|---|
| R1 | **Zachowanie niewidoczne przy gęstości 0,09** | Faza kończy się kodem, którego nie da się ocenić w rozgrywce | punkt 5 wchodzi razem z resztą, nie po |
| R2 | **Powrót do domu po ucieczce** (§3.4) | sarna wraca prosto na gracza; czyta się jak usterka | zaplanowane przepisanie domu |
| R3 | **Promień reakcji > 178 px** | reakcja odpala się poza kadrem, gracz widzi tylko skutek | sufit 170, propozycja 150 |
| R4 | **Ucieczka ciągła zamiast zrywami** | zwierzę zamienia się w smugę; zmierzony błąd królika | postój jest fazą maszyny, nie przerwą |
| R5 | **Brak collidera z terenem** | zrywająca się sarna wejdzie w drzewo | świadoma cena Fazy 1; nie udawać, że jej nie ma |
| R6 | **Pokusa ruszenia królika pod relacje** | najlepiej ograne stworzenie w grze, za scenę o znikomej widoczności | §5 mówi „nie" z liczbą |
| R7 | **Gracz staje na jeleniu** | bez `panicGap` postój 900 ms wypada dokładnie wtedy, gdy idący stępa gracz pokonuje 135 px przy luce 77 — zwierzę czyta się jak tapeta w najgorszym możliwym momencie | bramka `panicGap` 60 (§3.3) |
| R8 | **Pole „na przyszłość" pod polowanie** | decyzja autora mówi wprost: tropienie później. Slot dodany teraz („`huntable: false`", „`trackScent`") jest martwą deklaracją mechaniki, której nie ma — ten projekt ma na to osobną regułę przy komórkach manekina | nic nie dodawać poza reakcją, zrywem i powrotem |

---

## 8. Co weszło — mapa na kod

| co | plik | uwaga |
|---|---|---|
| gracz w `Critter.update` | `src/scenes/GameScene.ts` (~2056) | `critter.update(now, this.player)` |
| punkty zainteresowania (stanowiska ziół) | `src/scenes/GameScene.ts` (~849–859) | `Object.values(map.herbNodes ?? {}).flat()`, liczone RAZ, przekazane do konstruktora obu gatunków |
| maszyna `none/alert/watch/bolt` + rehoming | `src/entities/Critter.ts` — `updateFlee`, `enterBolt` | patrz §8.1 niżej |
| bias kierunku wędrówki (lis) | `src/entities/Critter.ts` — `findBiasAngle`, `pickWanderAngle` | liczony raz w konstruktorze, nie co klatkę |
| `CritterFleeTuning`, `DEER.flee`, `FOX.interestRadius` | `src/config/GameConfig.ts` | wartości z §3.3/§4.1 tego dokumentu |
| przepisanie reguły „bez różnic w zachowaniu" | `src/entities/CLAUDE.md` — sekcja „Granica: co jest Enemy, a co dekoracją" | reguła mówi teraz „bez rozgałęzień po gatunku w kodzie", nie „bez różnic w zachowaniu" |

**Kodu produkcyjnego dotyka `Critter.ts` + `GameConfig.ts` + jedna sekcja
`GameScene.ts`.** Zero zmian w `Rabbit.ts`, `Enemy.ts`, `FarmAnimal.ts` — jak
zakładał §2.2/§5.

### 8.1 Jedna rzecz doprecyzowana przy pisaniu, której plan nie przewidział

⚠ **Powrót z `alert`/`watch` do `none` musiał wymusić natychmiastowe
`decide()`, inaczej zwierzę zamierało w pozie idle na resztki starego
`nextDecisionAt`.** Plan mówił „przepisz dom", ale nie mówił nic o
`nextDecisionAt` — a `idling` zostaje `true` z wejścia w `alert` (żeby
zwykła wędrówka nie odpaliła się w środku sekwencji), więc bez jawnego
`this.nextDecisionAt = nowMs` na WYJŚCIU zwierzę stałoby w miejscu do
`walkMsMax` (2800 ms u jelenia) zamiast ruszyć od razu. To jest dokładnie ta
część priorytetu „reakcja → zryw → **powrót**", którą łatwo było zostawić
niedziałającą, bo nic w kompilacji jej nie łapie — złapane przy ręcznym
przeliczeniu pętli, nie przez `tsc`.

### 8.2 Numeryczna weryfikacja pętli (ręczna, bo `Critter` nie da się odpalić bez Phasera)

Gracz idący stępa (150 px/s) prosto na stojącego jelenia, przeliczone po
kolei ze wzorów w kodzie:

```
alert  550 ms: gracz zamyka 82,5 px → luka przy wejściu w bolt: 150−82,5 = 67,5
bolt   450 ms: jeleń +76,5 (170×0,45), gracz +67,5 → luka: 67,5+9 = 76,5
watch: panicGap (60) osiągnięty po ~110 ms zamiast pełnych 900 ms watchMs
→ kolejne cykle bolt/watch stabilizują się na luce 60–69 px
```

Zgadza się z zapowiedzią z §3.3 („60–80 px przewagi"). Przy SPRINCIE gracza
(240 px/s) pierwszy zryw daje ujemną deltę (gracz doganiający szybciej, niż
jeleń ucieka) — jeleń zostaje wtedy **wyprzedzony w trakcie pojedynczego
zrywu**, kończy go i natychmiast zrywa się ponownie od nowej pozycji gracza
(`panicGap` łapie to w `watch`). Bez collidera gracz↔`Critter` (§2.3, R5) to
wygląda jak przejście przez zwierzę, nie zderzenie — zgodne z „jeleń nie jest
klikalny, dogonienie nic nie daje".

---

## 9. Co da największy efekt dla gracza — ranking

1. **Reakcja sarny.** Nie dlatego, że sarn jest dużo (0,09), tylko dlatego, że
   **jedna z nich stoi 134 px od punktu wejścia do lasu**. Pierwsze zwierzę,
   które gracz widzi, przestaje być tapetą. To jest najtańszy zwrot w całym
   dokumencie.
2. **Gęstość i rozstawienie.** Mnożnik dla wszystkiego innego. Dziś stosunek
   wróg : fauna w kadrze wynosi **0,85 : 0,31**, a w gęstwinie **5 : 0**.
3. **Zamiar lisa.** Tanie i zmienia odczyt gatunku z dekoracji na drapieżnika —
   ale dopóki lisa widać raz na jedenaście ekranów, jest to zwrot odroczony
   do punktu 2.
4. **Relacje międzygatunkowe.** Największe wrażenie, najgorszy stosunek kosztu
   do widoczności **przy dzisiejszym rozstawieniu**. Wraca w Fazie 2, po
   punkcie 2 — i wtedy jednym mechanizmem (uogólnione źródło zagrożenia),
   zamiast trzema osobnymi.

⚠ **Punkt 5 (gęstość i rozstawienie spawnów) NIE wszedł w tym przejściu** —
implementacja objęła wyłącznie zachowanie (§8), zgodnie z zawężonym poleceniem
„Jeleń + Lis jako nowe zachowania Critter". Bez niego reakcja sarny — punkt 1
tego rankingu — jest ubrana w kod, ale rzadka w rozgrywce (0,09 w kadrze).
Punkt 5 zostaje jawnie odłożony, nie zapomniany.

---

## 10. Ręczna checklista — ⚠ NIEWYKONANA

`tsc` i `build` nie widzą niczego z tej listy — to jest maszyna stanów
sterowana czasem i dystansem do gracza, dokładnie ten rodzaj kodu, którego
kompilator nie oceni.

1. Gracz podchodzi do sarny stępa: zwierzę zamiera (`alert`), po ~0,5 s
   zrywa się, dystans **rośnie**, po chwili znowu staje i patrzy.
2. Gracz zatrzymuje się w trakcie ucieczki: sarna po serii zrywów **wraca do
   spokojnej wędrówki** w rozsądnym czasie (nie zamiera w bezruchu).
3. Gracz sprintuje wprost na sarnę: da się ją dogonić/wyprzedzić (zgodnie z
   decyzją — sprint kosztuje staminę i to jest cena), zwierzę nie utyka
   w ścianie ani nie znika.
4. Sarna zrywająca się w stronę drzewa/skały: bez collidera z terenem może
   przez nie przejść (R5, znana i zaakceptowana cena tej fazy — nie zgłaszać
   jako nowy błąd).
5. Lis: chodzi jak dotąd, ale **konsekwentnie w jedną stronę** przy stanowisku
   ziół w pobliżu jego domu — sprawdź na spawnie (900,900), najbliższym do
   stanowisk ziół w `forrest.tmj`.
6. Lis **nie reaguje** na gracza (nie ucieka, nie zamiera) — to jest zamierzone
   dla tej fazy (§5.3), nie usterka do naprawienia.
7. `window.dev.missing` puste, `load.totalFailed` = 0 (animacja „run" jest
   nowym czytelnikiem starej tekstury — sprawdź, że się w ogóle wgrała).

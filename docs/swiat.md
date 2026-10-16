---
typ: KANON
domena: world
tytul: Świat — fabuła, obsada, lokacje
stan: zywy
otwarte: [OI-5]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Świat — fabuła, obsada, lokacje

> **Czym jest ten plik.** Cała wiedza o świecie gry, która **nie jest kodem**:
> fabuła, obsada, wioska, las, wnętrza i teksty. Odłożona świadomie — teraz
> budujemy mechaniki, grafikę i lokacje robimy później.
>
> `CLAUDE.md` opisuje **kod**. Ten plik opisuje **świat**. Gdy coś z tego
> wchodzi do kodu, ląduje w tabeli statusu poniżej.

---

## Status — co już jest w grze

| element | stan |
|---|---|
| `MERCHANT.greetings` — 7 kwestii zależnych od stanu | ✅ wpięte, przetestowane (doszła `notYet` — zagadnięty, zanim ojciec dał kij, odsyła do domu) |
| `QUESTS.rabbit_hunt` — opis ze stawką (żniwa, dniówka) | ✅ wpięte |
| `QUESTS.scraps_bounty` — opis z zaczepem pod miasto | ✅ wpięte |
| Wilk w SW rogu lasu, dziki na wschodzie | ✅ gradient zgodny z fabułą |
| **Wataha** — 3 wilki w SW, okrążają i wyją, budząc się nawzajem | ✅ wpięte, zmierzone |
| **Szary** jako nazwany elitarny przeciwnik (190 PŻ, kąsa i odskakuje, wpada w szał poniżej 40%) | ✅ wpięty; **nie odradza się** |
| Trofeum: **Kieł Szarego** (140 g, pewny drop, bez skórowania) | ✅ wpięte — **od 2026-08-17 nie jest już towarem, tylko surowcem**: oddaje się go Myśliwemu, który robi z niego naszyjnik (patrz wiersz o zemście niżej) |
| **Naszyjnik z kła Szarego** — pierwszy amulet w grze | ✅ wpięty — `ITEMS.grey_fang_necklace` (+8 pkt proc. krytyka), nagroda za `grey_wolf_revenge`. Otwiera **slot `amulet`**, czyli trzeci martwy kafel lalki ekwipunku. Nie do kupienia nigdzie; drugiego nie będzie, bo Szary się nie odradza. |
| **Pająki sieciarze** — pierwszy przeciwnik walczący na dystans (sieć spowalnia o 45%) | ✅ wpięte, 3 na wschodzie |
| **Skoczki jadowite** — druga odmiana pająka, walcząca w zwarciu; ukąszenie zostawia narastający jad | ✅ wpięte, 3 **głębiej niż dziki** (1 osobno + para). Pierwszy przeciwnik, którego zagrożenie rośnie w trakcie walki, a nie jest stałe. Trzy stosy jadu są osiągalne **tylko przy parze** — pojedynczy nie ma na to dość życia i to jest decyzja, nie niedoróbka (`docs/pajak_jadowity_koncepcje.md`). |
| Zemsta na Szarym jako **zadanie** + zapis, że nie żyje | ✅ wpięte — `QUESTS.grey_wolf_revenge`, odsłaniane po `rabbit_hunt`. Zabójstwa liczone dożywotnio i zapisywane, więc po przeładowaniu Szary **nie wraca**. ⚠ **Dwa cele od 2026-08-17: `kill` ORAZ `collect grey_fang`** — kieł się oddaje, a Myśliwy robi z niego naszyjnik. To ODWRÓCENIE wcześniejszej decyzji („kieł zostaje graczowi"); uzasadnienie w komentarzu nad zadaniem w `GameConfig.ts`. Nagroda: sam EXP + przedmiot, **bez złota** — płaci wieś, osobnym zadaniem u Sołtysa. |
| **Co się dzieje po zabiciu Szarego** (§7, pytanie otwarte nr 1) | ✅ zamknięte 2026-08-17 — wszystkie trzy części minimum: kieł jako cel, zmieniona kwestia powitalna Myśliwego (`allDone`) i trwały zapis śmierci. Plus czwarta, o którą prosił ten sam punkt: scena nazwania. |
| Scena **„ktoś nazywa cię myśliwym"** | ✅ wpięta — `QUESTS.mysliwy_z_zagajow` u Sołtysa, odsłaniane po `grey_wolf_revenge`. Jedyny cel to **założenie naszyjnika**: składkę wieś zebrała już wcześniej, chodzi o to, żeby ludzie zobaczyli, komu dali. `ELDER.greetings.allDone` („Trzymaj się, myśliwy") jest teraz echem tej sceny, a nie jej zapowiedzią. |
| **Samouczek: uzbrojenie się w kij** jako pierwsze zadanie | ✅ wpięte — `QUESTS.stick_in_hand` (cel typu `equip`). **Kij daje OJCIEC przy przyjęciu zadania** (wcześniej Myśliwy — patrz §5.4), nie ekwipunek startowy: `INVENTORY.startingItems` jest puste. Kij jest niesprzedawalny póki zadanie trwa (inaczej: pompa złota) i wymieniany raz, gdyby przepadł (inaczej: ślepy zaułek). **Nagroda to sam EXP, bez złota** — jedyne takie zadanie w grze; ojciec nie płaci synowi za wzięcie kija. **Konsekwencja: świeża gra zaczyna się w WIOSCE**, nie w lesie. |
| **Kowal** jako drugi sklep (stal, topory, pierścienie) | ✅ wpięty, **własna kuźnia w wiosce** + podwórze z wyposażeniem (kowadło, piec, miech, węgiel, osełka, imadło, stojaki, beczka), własny portret i **pętla idle** — jedyny NPC z prawdziwą animacją |
| Ognisko + gotowanie, skórowanie, sklep, szkolenie | ✅ mechaniki działają |
| **Prolog i ekran tytułowy** | ⏳ napisane (§5), niewpięte. ⚠ **Warunek „czeka na wioskę" jest SPEŁNIONY od 2026-08-10** — wioska istnieje, a świeża gra zaczyna się właśnie w niej, na podwórzu domu gracza. Ten wiersz stał niezmieniony przez siedem sesji i blokada jest dziś fikcyjna; zostaje sama decyzja, czy prolog wchodzi. |
| **Rozmowy tematyczne** („Zapytaj o…") | ✅ wpięte — **68 tematów u 19 NPC** (stan zweryfikowany 2026-08-17; ⚠ ta liczba rośnie co sesję, przemieć `NpcDef.topics` zamiast jej ufać) (`NpcDef.topics`, `src/core/Dialogue.ts`, `src/ui/TopicPanel.ts`). Zbiór zadanych pytań jest **globalny**, więc wiedza przenosi się między ludźmi. Łańcuch idzie **wstecz po kręgosłupie z §1** (urząd/ramię → Szary → czemu zszedł → gęstwina → most) i **kończy się bez odpowiedzi** — nikt w Zagajach nie wie, co jest za mostem. Mapa łańcucha: komentarz `ŁAŃCUCH PYTAŃ` nad `MERCHANT.topics`. **Drugi, osobny łańcuch — wojskowa przeszłość Ojca i Myśliwego** (`mysliwy_ojciec` → `ojciec_wojsko` → `wojna`/`alina`/`a_ty`) idzie wstecz nie do lasu, tylko do domu, i kończy się tak samo ślepo: Myśliwy urywa w pół zdania i nigdy nie mówi, czego sam nie znalazł. |
| **Wioska** jako lokacja | ✅ **OWALNICA 128×128 (2026-10-09)** — nawsie (owalny plac ze studnią i sadzawką) z traktem rozwidlającym się wokół, zagrody szczytem do nawsia, podwórko w płocie, stodoły od zewnątrz; karczma z chmielnikiem przy północnym wjeździe, kuźnia przy południowym, młyn nad młynówką (staw, koło; potok płynie dalej przez las do rzeki), pola na północy, **błonia** między wsią a lasem. ⛔ **Wieś NIE MA palisady** — grodzi się płotem; palisada to szczebel grodu, mur — miasta. Las leży na południe, płynnie (`swiat.world`). Układ i powody: `docs/decyzje/2026-10-09-owalnica-zagajow.md`. Brak nadal: tablica zleceń, wnętrza. |
| **Studnia** na placu | ✅ złożona z elementów (`tools/build_studnia.py`), stoi w centrum placu, kolizja na kręgu |
| **Wnętrza** (3) | ⏳ zaprojektowane, nie istnieją |
| **Ojciec i Matka** | ✅ wpięci, stoją na podwórzu **domu gracza** — i tam też zaczyna się świeża gra. **Ojciec ma zadanie** (`stick_in_hand`, pierwsze w grze) i wraz z Myśliwym niesie łańcuch o wojsku (§2). (Grafika z prawdziwych zdjęć — patrz `docs/prompty_gemini.md`.) |
| **Sołtys, Rolnik, Młynarz** | ✅ wpięci, każdy przy swoim budynku, **każdy z własnymi tematami rozmowy** (patrz wiersz „Rozmowy tematyczne" niżej). **Sołtys ma już własne zadanie** (`know_the_village` — obejdź kowala, młynarza i Dobka; drugi dawca zadań w grze i pierwszy poza lasem). Rolnik i Młynarz nadal bez sklepu/zadań, ale są **celami** tego zadania, więc rozmowa z nimi wreszcie coś znaczy. ⚠ **Młynarz stoi przy młynie dopiero od 2026-08-17** — wcześniej stał przy studni na placu, ~1517 px od własnego koła, bo młyn dorysowano po jego wstawieniu i nikt go za nim nie przesunął. „Każdy przy swoim budynku" było dla niego nieprawdą przez cały ten czas. |
| **Reszta obsady** | 🟡 **warstwa „rozmowa" z `wioska_plan.md` §6 wpięta** — Hanna, Witek, Kuba, Sulisław, Agata, Dobrawa, Sobek, Gniewko. **Obsada urosła od tego czasu: 19 NPC, 68 tematów** (2026-08-17). Każde z nich wymienia z imienia 1–2 sąsiadów wg siatki §6.2. **Portretów jeszcze nie mają** — lecą na wspólnym NPC.png z własnym tintem, gotowe prompty w `docs/prompty_gemini.md`. Warstwa „tło" (dzieci, parobcy) świadomie NIE dochodzi; **czeladnik kowala Adrian i karczmarz Bogusz weszli 2026-10-09** z własnymi tematami. |
| **Zwierzęta** (kury, świnie, owce, psy…) | ✅ **wpięte 2026-08-14** — kury, krowy, byk, świnie, owce, baran i koty chodzą po Zagajach jako `FarmAnimal`, ptaki po lesie, sarny i lisy jako `Critter`. ⚠ Świnie stoją z `pig_walk.png`, a **nie** z `pig.png` z `build_swinia.py` — tamten plik jest dziś materiałem odrzuconym. ⭐ **Psy od 2026-10-11** (model 3D z wilka, `tools/farm3d.py`): **Kirci**, kudłata ruda suka Anny, włóczy się po błoniach przy południowej bramie — celowo NIE przy Annie, bo kanon mówi, że „zawsze się znajduje, wieczorem, brudna”; do tego dwa **białe owczarki Gniewka** przy stadzie. Szczeknięcie w `village_ambient` zostaje i dalej jest Kirci. |
| **Codzienność** — mieszkańcy zajęci swoimi sprawami | ⏳ wymaga harmonogramu/AI, którego nie ma. Do tego czasu rolę pełnią **rekwizyty** — patrz „Rekwizyty charakteryzują taniej niż sprite'y" |
| **Przeniesienie Myśliwego do wioski** | ❌ **ODWOŁANE decyzją autora (2026-08-17): zostaje w lesie.** To nie jest odłożenie, tylko rozstrzygnięcie — wiersz był otwarty od początku i zamyka się na „tam jest ok, że stoi". Fabularnie i tak było to uzasadnione lepiej niż przeprowadzka: §3 („Palisada — i dlaczego Myśliwy mieszka poza nią") tłumaczy, że ma tam **robotę** — suszarnie, wędzarnię, ognisko — których w obejściu nie postawi. Mechanicznie odpada przy okazji ryzyko: jego pozycja w lesie ma **zmierzone i asercjonowane** odległości do ogniska i Kowala, a przeprowadzka kazałaby je wyliczyć od nowa. |
| Scena „ktoś nazywa cię myśliwym" | ✅ wpięta jako `QUESTS.mysliwy_z_zagajow` — patrz wiersz wyżej. Mówi ją **Sołtys**, bo on nosi urząd i tylko on ma prawo tak kogoś nazwać; sąsiadka z rodzin rolniczych okazała się niepotrzebna. |

---

# 1. Fabuła

## Zdanie wyjściowe

Nie jesteś nikim wyjątkowym. Jesteś synem rolnika z wioski na krańcu świata.
Marzysz o gildii bohaterów — a dostajesz zające w kapuście. **Ta przepaść jest
fabułą.**

## Bohater

Młody, bez perspektyw, jeśli nic się nie zmieni. Żyje w świecie magii
i potworów, ale sam nie ma z nimi nic wspólnego — pole, obrządek, sen, i tak
w kółko.

Kluczowe: **nie jest ofiarą i nie jest wybrańcem.** Nie ucieka od ojca ani nie
poświęca się dla niego. Dochodzi do wniosku, że życie na roli to nie dla
niego — i że pomoże ojcu inaczej: **zarabiając na siebie**. To go czyni
sympatycznym, a nie egoistą ani męczennikiem.

## Kręgosłup — łańcuch przyczynowy

> ⚙ **Zaktualizowany 2026-09-08.** Do tej daty łańcuch kończył się u góry na
> „czymś w głębi lasu" i to „coś" było domyślnym KOŃCEM opowieści. Dziś
> **las jest szczeblem, nie szczytem** — a szczyt jest świadomie pusty.

Wszystko wynika z jednego ciągu, a nie z zestawu osobnych faktów:

```
        ktoś — GDZIE INDZIEJ                    ⟵ szczyt PUSTY dla gracza (autor wie: nekromanta — niżej)
              ↓  pracuje w
   odległym lesie jako WARSZTACIE
              ↓  wypycha
      faunę z tamtych terenów
              ↓  napiera na
     obrzeża — wilki, w tym Szary
              ↓  kaleczy
            Myśliwy
              ↓  nie chodzi już na obchód
        zające bez kontroli
              ↓  zagrażają
            zbiory
              ↓  ktoś musi przejąć obowiązek
              TY
```

**Gracz przechodzi ten łańcuch wstecz, szczebel po szczeblu** — i o to chodzi:
gradient trudności na mapie **jest fabułą, a nie rozkładem spawnów.**

⚠⚠ **Reguła czytania, która trzyma całą konstrukcję: każdy szczebel wygląda
jak szczyt, dopóki gracz na niego nie wejdzie.** Wilki wyglądają na problem,
dopóki nie okaże się, że coś je wypchnęło. Las wygląda na siedzibę, dopóki nie
okaże się, że jest warsztatem. ⛔ Nie wolno tego psuć, ujawniając wyżej
położony szczebel, zanim gracz stanie na niższym.

### Szary jest OBJAWEM, nie źródłem

⚠⚠ **To jest najważniejsze pojedyncze ustalenie tego łańcucha.** Szary jest
kulminacją **pierwszego, lokalnego problemu** — nie przyczyną zjawiska.
Zabicie go zamyka zagrożenie dla stad i domyka obowiązek, który wieś powierzyła
graczowi. **Nie zamyka niczego wyżej.**

Skutek dla całej reszty gry: **napór nie ustaje po Szarym.** Wilków dalej
przybywa, a z czasem problem przestaje dotyczyć wyłącznie wilków — kolejne
gatunki opuszczają swoje miejsca, a obszar zjawiska rośnie.

⚠ Zapłatą za Akt początkowy jest więc **uznanie, nie rozwiązanie**: scena,
w której ktoś we wsi pierwszy raz nazywa bohatera *myśliwym*. Wieś ma prawo
świętować lokalne zwycięstwo; gracz w tym momencie wie już nieco więcej niż
wieś, i **ta rozbieżność jest zamierzona**.

### Falowanie napięcia — oddech jest częścią konstrukcji

⛔ **Nie ma ciągłej eskalacji.** Po kulminacji przychodzi świadomy, krótki
oddech, i dopiero po nim druga fala.

```
normalność → niepokój → zagrożenie → eskalacja → KULMINACJA (Szary)
    → ODDECH: zwyczajne zadanie, podróż do najbliższego miasta, rozszerzenie świata
    → POWRÓT do Zagajów
    → odkrycie, że pod nieobecność bohatera zrobiło się GORZEJ
    → druga eskalacja → ponowne wejście w las → cięższe odkrycia
```

⚠ **Oddech nie jest przerwą w opowieści — jest jej narzędziem.** Ma dać
graczowi poczucie, że problem został zamknięty, żeby powrót mógł to poczucie
odebrać: *„myślałem, że rozwiązałem problem; tymczasem problem rozwijał się,
kiedy mnie nie było"*. Bez oddechu ten powrót nie ma czego odwrócić.

⚠ **Podróż musi mieć zwyczajny, własny powód.** ⛔ Nie wolno jej pisać jako
pretekstu do pokazania miasta — pretekst widać, a wtedy oddech przestaje być
oddechem i staje się przerywnikiem. Zaczep istnieje w tym dokumencie od dawna
(„Dalszy łańcuch"): **Kowal potrzebuje kogoś, kto pojedzie do miasta, bo wilki
się panoszą i nie ma komu iść** — czyli powodem wyjazdu jest **nierozwiązany
problem z wilkami**, a wyjazd staje się możliwy dzięki temu, co gracz zrobił
z najbliższą watahą. Droga przez las i most na drugi brzeg rzeki — na mapie
**na południe** od wsi — jest pod ten wątek położona.

### Kolejność odsłaniania — co przychodzi KIEDY

Rzeczy mocne mają swój moment i **ich przyspieszenie kosztuje więcej, niż
daje**:

| kiedy | co wolno pokazać |
|---|---|
| pierwsza fala | dziwne zachowanie fauny, coraz ciszej, coraz mniej naturalnych odgłosów, narastający niepokój |
| — | ⛔ **nie: ciała, odór, rozkład** |
| po powrocie, druga fala | zapach gnijącego mięsa, ślady rozkładu, ciała ludzi i zwierząt, coraz wyraźniejsze ślady czegoś nienaturalnego |
| dopiero potem | odkrywanie eksperymentów i tego, kto za nimi stoi |

⚠ Progresja atmosferyczna pierwszej fali działa przez **odejmowanie, nie
dodawanie**: nic nie wchodzi na ekran, coś z niego znika. Cisza jest sygnałem
tylko wtedy, gdy gracz zdążył przyzwyczaić się do hałasu.

⚠⚠ **Hałas jest objawem, cisza jest źródłem.** Zwierzęta uciekają OD miejsca
pracy, więc bliżej niego jest **pusto**, a dalej **tłoczno**. Odwrotna
intuicja („im głębiej, tym więcej potworów") łamie logikę całego zjawiska.

### Skala — Zagaje są punktem startowym, nie światem

⛔ **Ta gra nie dzieje się wokół Zagajów i lasu.** Świat rozszerza się razem
z bohaterem:

```
mała wieś → najbliższa okolica → las → pierwszy wyjazd
   → większy region → kolejne miejsca i ośrodki → rosnąca skala konfliktu
```

⚠ **Konkretne miejsca poza pierwszym wyjazdem nie są rozstrzygnięte i nie
wolno ich wymyślać, żeby zapełnić mapę.** Rozstrzygnięty jest wyłącznie
**wymóg strukturalny**: długoterminowa struktura musi umożliwiać rozwój
bohatera poza Zagajami, istnienie kolejnych ośrodków wiedzy, innych trenerów
i specjalistów oraz stopniowy wzrost skali konfliktu.

⚠⚠ **Patryczek NIE jest źródłem całej wiedzy potrzebnej do końcowego rozwoju
bohatera** — i to nie jest uwaga fabularna, tylko wymóg. Wieś, w której jeden
człowiek z ręką w łubkach uczy wszystkiego, przestaje być wiarygodna dokładnie
w chwili, w której stawka przerasta stado owiec. **Zagaje mają przestać być
WYSTARCZAJĄCE, nie przestając być WAŻNE.**

### ⭐ Szczyt jest znany autorowi: NEKROMANTA (2026-10-11)

**Decyzja autora:** prawdziwym zmartwieniem jest **nekromanta**. To on jest
„kimś gdzie indziej”, a odległy las jest jego **warsztatem**. Z tego wynikają
pozostałe szczeble: „eksperymenty” z kolejności odsłaniania to jego robota,
a „to, co robi się z martwymi”, przestaje być abstrakcją.

Tą samą decyzją **kolonia pająków w Gęstwinie jest WYPCHNIĘTA**, tak samo jak
wilki: to szczebel, nie źródło (`docs/spider_colony.md`, `OI-172`).

⛔⛔ **Dla gracza szczyt zostaje PUSTY.** Ta wiedza jest dla autora, nie dla
treści rozdziału 1. Słowo *nekromanta* (ani *nekromancja*, *wskrzeszanie*,
*nieumarli*) **nie pada w żadnym tekście gry**, dopóki gracz nie stanie na
szczeblu tuż pod nim. Obowiązuje reguła z góry tego rozdziału: każdy szczebel
wygląda jak szczyt, dopóki gracz na niego nie wejdzie. Kto, gdzie, po co
i jak daleko sięga, **nie jest jeszcze rozstrzygnięte** i nie trzeba tego
rozstrzygać przed drugą falą. ⚠ **To ODLEGŁY wątek** (autor, 2026-10-11): na
dziś z nekromanty korzysta się wyłącznie jako z PRZYCZYNY ucieczki fauny
(niżej, „podświadomy lęk”), nie jako z postaci ani miejsca.

### Czego ten łańcuch świadomie nie rozstrzyga

Szczyt jest pusty celowo i **wolno mu takim zostać jeszcze długo** — gracz
i tak ma go poznawać od dołu. Ale autor musi znać odpowiedzi wcześniej niż
gracz, więc stoją tu z nazwy:

- **dlaczego ŻYWA fauna ucieka od tego, co robi się z martwymi** — pytanie
  o fizykę świata, nie o antagonistę. Bez niego każda kolejna anomalia jest
  zgadywana, a nie wyprowadzana. ✅ **Rozstrzygnięte przez autora
  2026-10-11: PODŚWIADOMY LĘK.** Plugawa magia nekromancji budzi w dzikich
  stworzeniach instynktowny strach, więc wolą przenosić się jak najdalej od
  niej. Nic ich nie goni; to one odchodzą. Konsekwencje dla treści:
  - **zwierzę czuje to wyraźnie, człowiek ledwie**: ludzie odbierają to
    najwyżej jako niejasny niepokój. Taki ton mają już kwestie Zielarki
    („coś czekało”), Bogusza („cichy las to zły las”) i Ciechana (zwierz
    „stoi i patrzy”). ⛔ Mieszkaniec nigdy nie nazywa przyczyny;
  - **im bliżej źródła, tym ciszej**: zgodne z „hałas objawem, cisza
    źródłem”;
  - **lęk działa na każdy gatunek**, także na kolonię pająków, dlatego jest
    wypchnięta tak jak wilki;
- **czym jest drugi ośrodek zdolności** i czy odpowiedzią jest gildia bohaterów
  z §1 („Bohater") — czyli czy marzenie bohatera i brakujący szczebel drabinki
  progresji to ta sama rzecz;
- **co trzyma gracza związanego z Zagajami**, gdy wieś przestanie wystarczać;
- **czy premisa „nie jesteś wybrańcem" obowiązuje do końca**, czy tylko na
  starcie;
- **gdzie w pierwszej fali bohater po raz pierwszy robi coś, czego nikt mu nie
  kazał** — dziś jest wyłącznie posłuszny, a ojciec go wyposaża, zamiast
  zabraniać;
- **po czym gracz pozna, że napór wilków jest FABUŁĄ, a nie odrostem mobów.**

## Dlaczego akurat ty zabijasz zające

Pytanie, na które większość gier RPG nigdy nie odpowiada.

Odstrzał to **urząd**, nie otwarty sezon. Pełni go wioskowy myśliwy. Myśliwy
jest ranny, więc rola przechodzi na ciebie. Trzebienie zajęcy to jedyny powód,
dla którego co roku odbywają się zbiory — więc jest to praca płatna,
usankcjonowana i potrzebna sąsiadom.

Skutek: wczesna pętla gry (zabij → obedrzyj → sprzedaj → kup sprzęt → wyszkól
się) **przestaje być grindem, a staje się utrzymaniem.**

## Ton

Ciepły realizm z suchym humorem — bliżej wczesnego Fable i Rune Factory niż
Wiedźmina. Brutalność świata jako **konsekwencja, nie widowisko**: nie rzeź,
tylko ojciec, który rano nie wstaje tak sprawnie, i pole, które samo się nie
zaorze.

**Najmocniejsza scena do napisania:** moment, w którym ktoś we wsi pierwszy raz
nazywa go *myśliwym*, a nie *synem rolnika*. Powinien ważyć więcej niż
jakikolwiek awans na poziom.

### Mowa mieszkańców — standard stylizacji (2026-10-11)

> Wspólna reguła dla każdej kwestii, którą gracz przeczyta (`NpcDef.greeting(s)`,
> `topics`, teksty `QUESTS`). Jeden standard zamiast profili per postać —
> głos postaci niesie to, **o czym** i **jak krótko** mówi, a to już jest
> w samych kwestiach. Wyszło z propozycji „bardziej po staropolsku”; przyjęty
> wariant: **lekko, wg wieku**.

**Podstawa: współczesna polszczyzna, swojska, konkretna.** Dialogi Zagajów
już przed tą zmianą miały wyraźne, różne głosy (Gniewko liczy, Ciechan ucina,
Agata rachuje, Anna kpi). Stylizacja ma tego **nie zrównać** — dlatego jest
lekka i większość kwestii zostaje nietknięta.

**1. Najpierw usuwaj anachronizmy — psują więcej, niż dodaje archaizm.**
Wieś jest wczesnopiastowska (§2 „Zasady nazewnictwa”). Nie istnieją w niej:
*herbata, gips, kredyt, zeszyt, kartka* (we wsi — w mieście pismo jest), *serio,
mechanizm, problem, system, sekundy*. Zamienniki w obiegu: **napitek, łubki,
na borg / na kreskę, karby na kiju, łuczywo**. Liczenie i pamięć we wsi to
**karby**, nie pismo.

**2. Archaizacja rośnie z WIEKIEM, nie z zawodem.**

| pokolenie | kto (`wioska_plan.md` §6) | rejestr |
|---|---|---|
| **starszyzna 60+** | Sulisław, Kuba, Dorota Zielarka | **1–2 formy na kwestię, nie więcej**: *-że* (*podejdźże, dawajże*), *jeno, nim, gdy, choć, pomni, gdzieżby, dal* |
| średnie 30–59 | Marko, Alina, Radzim, Agata, Dobiesław, Miłosz, Dobek, Hanna, Witek, Sobek, Gniewko, Ciechan, Wszebor, Zofia, Bogusz | swojska mowa dzisiejsza; pojedyncze ludowe *se, żeś, co* (zaimek względny) — bez archaizmów |
| młodzi do 30 | Zbych, Bolko, Adrian, Patryczek, Dobrawa, Anna | najprostsza; tu dozwolona największa potoczność |
| **bohater** (`q`) | — | **zawsze najprostszy** — to głos gracza i pytanie musi być czytelne w pół sekundy |

**3. Słownik dozwolony — krótki z założenia.**

| forma | znaczy | kto | uwaga |
|---|---|---|---|
| *jeno* | tylko | starszyzna | ✅ staropolskie, dziś zrozumiałe; max raz na kwestię |
| *-że* (*chodźże*) | wzmocnienie | starszyzna | ✅ żywe do dziś, brzmi starczo, nie teatralnie |
| *nim* | zanim | starszyzna | ✅ |
| *pomnieć* | pamiętać | starszyzna | ✅ rzadko — jedno użycie w grze wystarczy |
| *niechaj* | niech | starszyzna, sołtys przy urzędzie | ✅ tylko w życzeniu/rozkazie |
| *napitek, borg, karb, łuczywo* | — | każdy | ✅ nazwy rzeczy, nie styl — wolno wszystkim |
| *synu* | wołacz od *syn* | ojciec, każdy starszy | ✅ słowo prasłowiańskie, w polszczyźnie od jej początków, a wołacz *synu* jest **do dziś formą poprawną** — dlatego brzmi dawnie i naturalnie naraz (autor, 2026-10-11). Tak samo *syn Marka* jest w pełni zgodne z epoką; *Markowic* to wybór stylu, nie poprawka |
| ***-owic*** (*Markowic*) | syn Marka | **sołtys** (urząd) | ⚠ **propozycja stylistyczna**, nie kanon nazewnictwa — odojcowskie *-owic/-ic* jest wczesnośredniowieczne, ale formy nie weryfikowano w źródłach dla wsi |

**⛔ Nie używać** — formy z innej epoki albo innego rejestru:
*waść, waszmość, mości* (XVII w., szlachta — Trylogia, nie wieś),
*azaliż, zali* (staropolszczyzna biblijno-literacka — w ustach chłopa parodia),
*dyć, ino, kiej* (gwara XIX–XX w. — Reymont, nie staropolszczyzna; ⚠ dopuszczalne
dopiero, gdy świadomie zbudujemy regionalną gwarę), przestawny szyk
(*„rzekł on był”*), podniosłość. **„Lechtia” nie pada w dialogach**, dopóki
nie ma jej kanonu (`audyt_zagaje_swiat_2026-10-09.md` F.10).

**4. Zwracanie się do bohatera — tu najłatwiej o zlanie się głosów.**
Do 2026-10-11 „chłopcze” mówiło 11 postaci (18×); zostało 8× u pięciu.
Przydział: **Wszebor i Radzim — „chłopcze”** (mentor, majster; poza nimi po
jednym razie u Kuby, Ciechana i Sobka, gdzie siedzi w rytmie zdania) · **Ojciec —
„synu”** · **starszyzna — „synku”** · **Dobek — „młodziku”** (z góry, bo nie
prosi) · **Sołtys — „Markowic”**, a po `mysliwy_z_zagajow` — **„myśliwy”**
(to jest TA scena: nazwa odojcowska → urząd) · **reszta — bez formy**
(imię, nic, albo zwrot w zdaniu). Matka zostaje przy „dzieciaku”.
⚠ **Każda forma rodzajowa to przyszły koszt**: płeć bohatera jest w planach
(`kreator_postaci.md` §3, `OI-168`) — przed jej wejściem te miejsca trzeba
będzie rozwidlić, więc nie mnóż ich bez potrzeby.

**5. Spójność.** Postać nie zmienia rejestru między `greeting`, `topics`
i tekstem zadania. Zawód daje **słowa** (Sobek: klepki, struganie; Radzim:
okucia), nie **temat każdej rozmowy**. Przysłowie — najwyżej jedno na postać
i tylko takie, które wynika z jej życia.

**6. Kwestie nietykalne dla stylu**: `ELDER.greetings.allDone` („Trzymaj się,
myśliwy…”), Myśliwy urywający w pół zdania (§2) i każde zdanie, które
odsłania albo **zakrywa** ogniwo łańcucha z §1. Zmiana brzmienia nie może
zmienić tego, co postać wie.

---

# 2. Obsada

## Myśliwy (w kodzie: `MERCHANT`, id `hunter`)

Ranny przez wilka. Wraca do sił, **ale nie do lasu**. Zostaje kwatermistrzem
i mentorem — tym, który *wysyła*, nie tym, który *idzie*.

Każda jego mechanika dostaje uzasadnienie bez dopisywania czegokolwiek:

| mechanika w grze | powód fabularny |
|---|---|
| uczy Skórowania i Pieczenia | przekazuje ci swoje rzemiosło |
| daje zlecenia | nie może już chodzić po obchodzie |
| skupuje skóry i mięso | nadal on to przerabia i sprzedaje |
| bierze zapłatę za naukę | to fach, nie przysługa |

## Ojciec — stary, nie kaleki

Żyje. Gospodarstwo stoi. Trzydzieści lat przy pługu: biodro, plecy, wolniejszy
niż był. **Nie ranny.**

Ranny Myśliwy *i* kaleki ojciec to dwóch połamanych mężczyzn w jednej wsi —
robi się ponuro i traci ostrość. **Wilk ma być jedyną raną w prologu.**

Za to „pole samo się nie zaorze" przestaje być gadaniem — ono naprawdę się nie
zaorze, i dlatego ojciec się boi.

**Ojciec wręcza kij** (`QUESTS.stick_in_hand`, wpięte — wcześniej robił to
Myśliwy, patrz §5.4). To pierwsze zadanie w grze i jedyne, które dostajesz
w domu: „idziesz za wieś, to nie idź z gołymi rękami". Dzięki temu ojciec
przestaje być samą obecnością, a wyjście z domu ma scenę, a nie tylko
przejście przez bramę.

## Ojciec i Myśliwy — wojsko ✅ (wpięte jako tematy rozmów)

Znają się **sprzed trzydziestu lat: jeden zaciąg, jeden tydzień, trzy wojny.**
Kilka razy o włos od śmierci, raz jeden wyciągnął drugiego i raz odwrotnie.
Obaj w końcu odpuścili wojaczkę — ojciec wcześniej, Myśliwy później.

To nie jest ciekawostka, tylko **brakująca przyczyna pod §2**:

- **Dlaczego ojciec się sprzeciwia.** Nie ma cię za dziecko. Rozpoznaje w tobie
  siebie sprzed trzydziestu lat („młoda krew buzuje ci tak samo jak wtedy jemu")
  i wie, dokąd go to zaniosło. Bez tego „boi się" u Matki jest ładnym zdaniem
  bez pokrycia.
- **Dlaczego przestali.** Nie dlatego, że im kazano — każdemu został w końcu
  jeden powód, żeby wracać wieczorem do domu. Ojciec swój znalazł: **Alinę**.
  Myśliwy **nie znalazł żadnego** i dlatego mieszka sam w lesie, poza
  wsią, od dwudziestu lat. To jedno zdanie tłumaczy naraz jego samotność,
  jego miejsce na mapie i jego stosunek do ciebie.
- **Dlaczego to on cię uczy.** Mentor przestaje być przypadkowym sklepikarzem
  z zapasem skór, a staje się kimś, kto już raz oglądał chłopaka z tak samo
  buzującą krwią.

**Kluczowa zasada: Myśliwy urywa.** Na pytanie „on poznał Alinę, a ty?"
odpowiada „...nieważne", a dopytany mówi tylko, DOKĄD poszedł (do lasu), nigdy
CZEGO nie miał. To ten sam chwyt co pytanie o most z §1 — gracz wychodzi
z rozmowy z jednym zdaniem, którego nie dostał. **Nie dopisuj tam wyjaśnienia.**

Ojciec ze swojej strony **odmawia opowiadania** („idziesz do niego i tak, jak
zechce, to ci sam powie") — gdyby opowiedział, nie byłoby powodu pytać
Myśliwego, a cały łańcuch istnieje po to, żeby wiedzę nosić między ludźmi.
Matka dokłada trzeci punkt widzenia i **odmawia bycia powodem** („nie stawiaj
mnie w tej opowieści za powód, dzieciaku"), żeby to nie osunęło się w romans.

## Matka

Żyje. Rozwiązuje trzy rzeczy naraz:

- **kto zostaje przy gospodarstwie**, kiedy jesteś w lesie — bez niej decyzja
  bohatera wygląda na porzucenie
- **kto cię puszcza** — ojciec się sprzeciwia, matka pakuje zawiniątko, więc
  scena wyjścia z domu jest dwuznaczna zamiast jednostronnej
- pozwala ojcu być tylko starym, a nie porzuconym

**W domu jest rudy kot** (autor, 2026-10-11). Kot bohatera — nie daje się
miziać i ucieka przed czułością, co wkurza Annę, która próbuje go ukochać
(sekcja „Anna — kuzynka karczmarza").

## Wilk — czyli Szary

Sprawca rany. Jest na mapie **teraz**, w południowo-zachodnim rogu lasu, daleko
od startu i za silny na 1. poziom. Gracz, który tam zawędruje wcześnie, ginie —
i to jest **zamierzone**: „on tam jest, ty jeszcze nie jesteś gotowy".

Odegranie się na nim to pierwszy prawdziwy cel osobisty.

**To już nie jest zwykły wilk.** Przez pewien czas był — 55 PŻ, słabszy od
dzika, bez jednej własnej mechaniki — więc gracz mógł zabić czarny charakter
własnego prologu przypadkiem, na 4. poziomie, nie wiedząc, że to był on.
Dziś ma imię (nosi je nad paskiem życia), 190 PŻ, kąsa i **odskakuje** poza
zasięg, a poniżej 40% życia przestaje uciekać i idzie na ciebie. Nazwany wróg
musi być **czytelny jako nazwany**, zanim zacznie być trudny.

**Nie odradza się.** Zabity zostaje zabity — dlatego to wydarzenie, a nie
element krajobrazu.

Za nim stoi jego **wataha**: trzy wilki bliżej skraju lasu, które okrążają
gracza i **wyciem budzą się nawzajem**. Szary stoi na tyle daleko, że wycie
watahy go nie ściąga — spotkanie z nim musi być decyzją, nie wypadkiem.

### Co zostaje po nim ✅ (domknięte 2026-08-17)

> Ten akapit opisywał przez długi czas **największą dziurę fabularną w grze**:
> zabicie Szarego nie zostawiało żadnego śladu — nie było zadania, Myśliwy nie
> zmieniał kwestii, a po przeładowaniu strony wilk wracał. Zostaje jako zapis
> tego, co dokładnie trzeba było domknąć, bo przewidział też środek: kieł jako
> „naturalny przedmiot do oddania, kiedy zadanie o zemście wreszcie powstanie".

Dziś zostaje po nim **łańcuch trzech kroków, a nie przedmiot**:

1. **Myśliwy** bierze kieł (`grey_wolf_revenge`, cel `collect`) i oddaje
   **naszyjnik** — jedną ręką, niezdarnie oprawiony. Nie płaci złotem: nie ma
   z czego, a gdyby miał, byłaby to transakcja zamiast rewanżu.
2. Jego kwestia powitalna zmienia się i **odsyła do Sołtysa** — ten sam wzorzec
   co `topics.owce` → Gniewko.
3. **Sołtys** wypłaca składkę całej wsi (`mysliwy_z_zagajow`, 220 g) pod jednym
   warunkiem: masz mieć ten kieł na wierzchu. To jest scena z §1 — moment, w
   którym ktoś nazywa cię *myśliwym*, a nie *synem rolnika*.

⚠ **Konsekwencja dla całej struktury zadań, warta zapamiętania: to jest
PIERWSZE połączenie między kręgosłupem leśnym a wiejskim.** Do tej pory
`stick_in_hand → rabbit_hunt → {Szary, sfora, zające}` i
`know_the_village → droga_na_wschod → skora_na_pasy` były dwoma osobnymi
drzewami, które nigdzie się nie stykały, a `grey_wolf_revenge` był jedynym
liściem będącym zarazem kulminacją. Teraz kulminacja lasu wpada do wsi.

## Reszta wsi — 14–16 sprite'ów, wrażenie trzydziestu

Zbudowane **wokół rodzin, nie stanowisk**.

> Stan na dziś: stoi **sześcioro** — Kowal (pełny sklep), Sołtys, Rolnik,
> Młynarz, Ojciec i Mama (na razie sama rozmowa). Myśliwy mieszka w lesie,
> poza wsią. Wszystko poniżej to plan, nie opis. **Pełna, imienna lista
> trzydziestu** (kto, w jakim wieku, w którym obejściu, ze sprite'em czy bez,
> w jakiej kolejności budować) jest w `docs/wioska_plan.md` §6 — ten opis
> rodzin zostaje jako kanon tonu i relacji, ale konkretne przypisania (kto
> gdzie mieszka, kto już stoi) czytać z tamtego pliku.

### Zasada nadrzędna: nikt nie żyje z jednej rzeczy

**W Zagajach nie ma „rolnika od marchwi".** Każda rodzina przede wszystkim
utrzymuje samą siebie: ogród, kilka grządek, kury, drewutnia, niewielki
zapas żywności. Dopiero *część* mieszkańców wykonuje ponadto zawód, z
którego korzysta cała wieś — i to jest ich dochód, nie całe życie.

To nie jest ozdobnik, tylko ta sama zasada, którą kod stosuje już do
przeciwników (różnią się **zachowaniem**, nie tabelką) i do broni
(kategorie **znaczą coś**, nie są nazwami dla tej samej rzeczy). Wieś,
w której każdy jest funkcją jednego sklepu, czyta się jak zbiór automatów.

### Rdzeń (pełne role)

| kto | imię | rola |
|---|---|---|
| **Ojciec** | **Marko** | dom; jedyny, który nie chce, żebyś szedł |
| **Mama** | **Alina** | ta, która cię puszcza; zostaje przy gospodarstwie |
| **Myśliwy** | Wszebor | mentor, sklep, szkolenie *(mieszka w lesie, poza wsią)* |
| **Kowal** | Radzim | pługi, podkowy, okucia wozów, części młyna — **broń robi sporadycznie**; później wysyła cię do miasta |
| **Kowalowa + czeladnik** | — | kuźnia to warsztat rodzinny, nie stanowisko jednoosobowe |
| **Młynarz** | Miłosz | serce ekonomii; pierwszy powie, że zboża nie starczy |
| **Młynarzowa + dwóch synów** | — | synowie pomagają i przy kamieniu, i w polu |
| **Sołtys** | Dobiesław | **sam orze własne pole**; urząd pełni dodatkowo, nie zamiast |
| **Sołtysowa + dorosła córka** | Dobrawa | bo sołtys bez rodziny to urzędnik, a nie gospodarz |
| **Rolnik** (jedna z rodzin) | Dobek | zdrobnienie — chłopi na co dzień nosili krótkie formy |

### Zasady nazewnictwa

Wieś jest **słowiańska, wczesnopiastowska**, i imiona mają to nieść:

- **Mężczyźni** trzymają się starych imion dwuczłonowych (Dobiesław,
  Radzim, Wszebor, Mirosław) albo ich codziennych form na **-ko/-ek**
  (Marko, Dobek, Bolko) — dokładnie tak mówiono we wsi.
- **Kobiety** noszą imiona chrześcijańskie (Agnieszka, Agata, Alina/
  Adelajda). **Ta asymetria jest historycznie prawdziwa**, nie
  niedopatrzeniem: rdzenie słowiańskie prawie nie zaczynają się od
  samogłosek, a imiona żeńskie schrystianizowały się szybciej niż męskie.
- **Przydomek to zawód, nie nazwisko** — *Radzim Kowal*, *Miłosz Młynarz*.
  Tak właśnie rozpoznawano ludzi, zanim istniały nazwiska (i tak nazwiska
  potem powstały: Kowal → Kowalski). Przy okazji gracz nadal widzi nad
  głową, kto sprzedaje żelazo.

**Dwa tytuły zostają tytułami, celowo:**

- **Myśliwy** — bo odstrzał to **urząd**, a kulminacją prologu jest scena,
  w której ktoś nazywa *ciebie* „myśliwym", a nie „synem rolnika". Gdyby
  nad jego głową stało „Wszebor", ta scena straciłaby punkt odniesienia.
- **Ojciec / Mama** — bo etykieta to punkt widzenia **gracza**, a grasz ich
  synem. Marko i Alina to imiona, którymi posługuje się reszta wsi.

### Zawody, które wieś utrzymuje dodatkowo

| kto | po co istnieje |
|---|---|
| **Zielarka** (starsza wdowa) | zioła, opatrunki, porody. **Nie alchemiczka, nie czarownica.** Naturalna kandydatka na brakującego sprzedawcę mikstur — patrz uwaga o mechanikach niżej |
| **Pasterz + żona + syn** | największe stado owiec; inni mają po jednej-dwie, on robi to zawodowo |
| **Stolarz + żona** | wozy, płoty, dachy, meble, beczki |

### Trzy rodziny rolnicze (po 3–4 osoby)

Baza ekonomiczna wsi. Różnią się **wielkością gospodarstwa, nie
specjalizacją** — jedni mają więcej zboża, drudzy lnu, trzeci świń. Wśród
nich **sąsiadka, której pole ratujesz** — to ona pierwsza nazwie cię
*myśliwym*.

### Tło

- **Dwóch starszych mężczyzn przy studni** — komentują wszystko, są żywą
  kroniką wsi.
- **6–8 dzieci** — bez funkcji mechanicznej. ⚠ Wymagają decyzji, której ten
  dokument nie podejmuje: na ekranie dotykowym ruchome postacie bez roli
  albo mają kolizję (i są przeszkodą pod palcem), albo jej nie mają (i są
  duchami). Rozstrzygnąć **zanim** powstanie ich grafika.

### Anna — kuzynka karczmarza (autor, 2026-10-10)

- **Kuzynka Bogusza.** Zbuntowała się: nie będzie kurą domową i nie da się
  rodzicom wyswatać „z tym, kto więcej zaoferuje" — sama na siebie zarobi.
  Mieszka u kuzyna przy karczmie i **tam sprzedaje jedzenie**; przed
  karczmą stoją ławy, na których ktoś zawsze siedzi.
- **Bogusz jest wdowcem — Anna mu pomaga, ale nie jest służącą.** Gotuje
  (na pewno lepiej niż on), obsługuje gości, sprząta lżej w izbie. Kurą
  domową zrobić się nie da: często powtarza Boguszowi, żeby sobie znalazł
  żonę, bo ona mu gaci prać nie będzie. W kuchni pomoże, przy karczmie
  pomoże, ale sprzątać karczmarz też musi — bo ona, jak mówi, „nie jest
  służącą".
- **Raz w tygodniu, w dzień targowy, wiezie do miasta to, co wieś ma za
  dużo.** Konia i wozu wieś się dogaduje — ktoś i tak musi wozić do miasta
  węgiel drzewny i inne rzeczy ze wsi. Czasem jedzie kilka wozów naraz
  (np. z drewnem z lasu) i Anna zabiera się z nimi; często ktoś jej
  towarzyszy jako ochrona, bo pełny wóz kusi niejednego bandytę — albo ktoś,
  kto i tak jedzie na targ coś kupić albo pooglądać towary.
- **Temperament.** Kiedyś piła po karczmach; niejeden próbował ją klepnąć
  w tyłek — kończyło się plaskaczem albo podbitym okiem.
- **Woli towarzystwo mężczyzn i chce się z nimi kolegować.** Bohater uważa,
  że to naiwne: wilk z owcą się nie przyjaźni — ci „koledzy" udają, że taki
  układ im wystarcza, a czekają, aż zmieni zdanie; widać, jak na nią patrzą.
- **Dlatego miejscowi bandyci jej nie ruszają.** Część „kolegów" jest spod
  ciemnej gwiazdy albo zna takich, co znają bandytów — jeden z tych, którzy
  smalą do niej cholewki, poprosił, żeby jej nie tykali. Stąd jeździ
  z pełnym wozem często sama (zgodne z jej `sama_sobie`: „nie potrzebuję
  pomocy przy wozie").
- **Pies — Kira, zdrobniale Kirka** (autor, 2026-10-11, ze zdjęcia).
  **Szczupła kundelka, suka**, średniej wielkości: czarny grzbiet, głowa
  i kark, **podpalane** (płowobrązowe) policzki, pierś i łapy; uszy stojące,
  ale miękkie — jedno lubi się załamać na czubku; brązowe oczy, pysk lekko
  siwiejący. ⚠ **Nie ruda i nie kudłata** — „ruda" w wypowiedzi autora
  z 2026-10-11 dotyczyła kota. Chodzi własnymi drogami — wraca wieczorem,
  brudna (temat `kirci`).
- **Bohater dokarmia Kirkę po cichu, za plecami Anny** — Kirka to mistrzyni
  wyłudzeń na ładne oczy.
- **Zadanie — zamiar autora (`OI-174`): poszukanie Kirki.** ✅ Wpięte
  2026-10-12 jako `QUESTS.szukaj_kirki` — miejsce: łąka nad młynówką
  w **północno-zachodnim** rogu wsi (NE pokazywał czarną pustkę świata),
  Kirki nie ma na mapie, dopóki się nie znajdzie; Anna o pomoc nie prosi.
  Trzeba mieć
  **pieczone mięso** (`cooked_meat`) — wtedy Kirka **sama przybiega** zza
  bocznej granicy mapy (np. z prawego górnego rogu), kiedy gracz się tam
  znajdzie. Działa, bo zna zapach tego, kto ją dokarmia.
- **Rudy kot bohatera ją wkurza.** Anna próbuje go ukochać, a on nie daje się
  pomiziać — ucieka przed każdą czułością. Stąd jej żal do rudych kotów
  w ogóle (temat `koty`: „rude ani razu").

### Drwale — Ciechan z synami (autor, 2026-10-10)

- **Ojciec z dwoma synami**, dwie chałupy na południowo-zachodnim skraju wsi,
  kładka przez potok prowadzi na zachodni brzeg i do wyrębu w lesie. Konie do
  zwózki pożyczają od sołtysa i płacą mu w drewnie.
- **Ciechan** (~55) — małomówny, „krzyż jak stary pień"; trzydzieści lat na
  tych samych ścieżkach, więc pierwszy widzi, że zwierz zachowuje się inaczej.
  Synów samych w głąb już nie puszcza. ⚠ Mówi, CO widzi, nigdy DLACZEGO —
  wyższy szczebel łańcucha zostaje zakryty (§1).
- **Bolko** (~28) — robi za dwóch, chce przejąć wyrąb; postawił z bratem
  własną chałupę naprzeciw ojcowskiej. Dostarcza bukowe szczapy na mielerz
  kowala (Adrian zwozi) i kłody Sobkowi — z Sobkiem kłóci się co zimę o cenę.
- **Zbych** (~19) — ciągnie go do miasta i wojska, słucha przejezdnych
  w karczmie; lustro bohatera, tylko bez odwagi, żeby pójść. Raz zaprosił Annę
  na jarmark („może coś z tego będzie, ale nie w tym roku").

### Relacje — najtańsza treść w całym dokumencie

Mieszkańcy znają się od lat i **mają się nawzajem wspominać**. To zwykłe
kwestie dialogowe, a `NpcDef.greetings` już obsługuje linie zależne od
stanu — zero nowych systemów. Wersja tania i wystarczająca: **każdy wymienia
z imienia jednego–dwóch innych.** Przykłady:

- kowal pożycza narzędzia młynarzowi,
- sołtys pomógł wdowie przetrwać zimę,
- zielarka odbierała porody większości dzieci we wsi,
- matka bohatera wymienia jajka na mąkę,
- ojciec bohatera chodzi sąsiadom do żniw.

### ⚠ Część „klimatu" to mechanika w kostiumie

Trzy z powyższych postaci to nie tło, tylko nieodkryte systemy — i wybór,
**które** z nich naprawdę nimi zostaną, jest tu właściwą decyzją
projektową:

- **Zielarka** = docelowy szczebel leczenia — i już zbudowany: `docs/wioska_plan.md`
  D-3 rozstrzygnął, że **Dorota Zielarka** (`HERBALIST` w `GameConfig.ts`)
  przejmuje mikstury od Myśliwego (mały, drogi sklep — kupno przed wyprawą,
  nie uzupełnienie w biegu), `health_potion` opuścił `MERCHANT.stock`, cała
  ekonomia HP (regen → jedzenie → mikstura) nadal zakłada, że mikstura jest
  droga i działa w walce. ⚙ Chata i punkt na mapie stoją od 2026-08-10
  (`wioska_plan.md` §5.8); zdanie niżej jest historyczne. ~~Brakuje jej tylko punktu na mapie~~ — jest w pełni
  wpięta w kodzie i grywalna na wspólnym placeholderze, ale nikt jeszcze nie
  postawił punktu `herbalist`/`zielarka` w Tiled, patrz `CLAUDE.md`.
- **Pasterz** = wełna, czyli materiał, czyli surowiec dla krawca.
- **Stolarz** = „naprawia" rzeczy, których **trwałości w grze nie ma**.
  Albo powstaje durability, albo stolarz zostaje klimatem — obie odpowiedzi
  są dobre, ale trzeba ją wybrać świadomie.

Reszta może zostać czystym klimatem bez wyrzutów sumienia.

### Ile realnie sprite'ów

**14–16 postaci bazowych**, nie 30. Wrażenie osady trzydziestoosobowej robi
się wariantami: inny kolor ubrania, fryzura, broda, nakrycie głowy.

⚠ **Ograniczeniem nie jest budżet grafiki, tylko zagęszczenie.** Każdy NPC
ma `interactRange` 48 px, więc dwóch musi stać **>96 px od siebie**, żeby
`E` nie było dwuznaczne (zweryfikowane przemiataniem kafli przy Kowalu
i ognisku — patrz CLAUDE.md). Do tego wioska ma być **przebiegana, nie
zwiedzana**. Trzydziestu ludzi plus zwierzęta na małym hubie to problem
gęstości, nie rysowania — im więcej mieszkańców, tym większa musi być
mapa, a im większa mapa, tym dotkliwszy podatek od każdego powrotu z lasu.

## Rekwizyty charakteryzują taniej niż sprite'y

**Najważniejsza rzecz, jakiej nauczyło nas podwórze kowala.** Kowadło,
miech, worek węgla, osełka, stół z imadłem, trzy stojaki i beczka nie robią
**nic** mechanicznie. A mimo to Kowal jest jedyną postacią w tej wiosce,
o której wiadomo, czym się zajmuje przez cały dzień — bez jednej linii
dialogu i bez jednej klatki animacji.

Z tego wynika przepis na „żywą wieś" **dostępny bez systemu harmonogramów
i bez animacji postaci**:

> Człowieka definiują przedmioty, wśród których stoi.

Stos drewna z wbitym toporem mówi „ktoś tu rąbie". Sznur z praniem mówi
„ktoś tu mieszka i pierze". Grządki mówią „ta rodzina się żywi". Animacja
doda ruch, ale **informację dają rekwizyty** — i dlatego droga do gęstej
wsi prowadzi przez ~8 scharakteryzowanych **obejść**, a nie przez 30
sprite'ów.

Stan zapasów: `Buildings.png` ma już 91 kafli, w tym **ławkę**
(`lawka_l`/`lawka_p`), **beczkę** (`barrel_0`), **koryto** (`koryto_0`),
**stóg siana** (`stog_0..3`), **płot** (`zagroda_*`), **klapę dla kur**
(`klapa_0`) i **wiatę**. Na mapie wioski **nie użyto ani jednego z nich.**
Do pełnej bazy subsystencji z tej sekcji brakuje realnie czterech rzeczy:
**grządki warzywne, stos drewna, suszarnia/pranie, wóz.**

## Zwierzęta

Osadę zamieszkaną robią też kury, koguty, gęsi, kaczki, świnie, kozy, owce,
psy i koty. Nie wszystkie muszą być interaktywne.

⚠ Uczciwa wycena: **każdy gatunek kosztuje mniej więcej tyle, co
przeciwnik** (arkusz + encja + animacje). Kolejność wg wartości na piksel:

1. **Kury** — najwyższy zwrot. Małe, mogą być głupie (dziobią, chodzą
   losowo), a „kury na podwórzu" czyta się jako „tu ktoś mieszka"
   natychmiast.
2. **Świnia** — `pig.png` **już istnieje** (`tools/build_swinia.py`) i nie
   jest do niczego podpięta. Najtańszy możliwy zysk w całej tej sekcji.
3. Reszta — dopiero gdy pierwsze dwie się sprawdzą.

## Codzienność — odłożona, ale nie jest ozdobnikiem

Noszenie drewna, zamiatanie podwórza, karmienie kur, naprawa płotu,
rozmowa przy studni, wyprowadzanie owiec, odpoczynek na ławce.

**To jest odłożone na później** (wymaga harmonogramu/AI mieszkańców,
którego dziś nie ma wcale — jedyny krok w tę stronę to pętla idle Kowala).
Ale **nie jest to dekoracja**: to wizualizacja tego, czym ci ludzie
naprawdę się zajmują, i bez niej wieś zostaje zbiorem NPC czekających na
kliknięcie. Do czasu, aż powstanie, tę samą robotę wykonują **rekwizyty**
(patrz sekcja wyżej).

## Zasada, którą to wszystko sprawdzać

> Gracz ma odnieść wrażenie, że Zagaje istniały długo przed rozpoczęciem
> gry i będą istnieć, gdy bohater stąd odejdzie.

Nie: „czy ten NPC ma sklep?", tylko: **„czy widać, że ten człowiek żył tu
wczoraj?"**

---

# 3. Wioska (roboczo: Zagaje)

> ⭐ **GEOGRAFIA (poprawiona 2026-10-09):** wieś leży na **północy**, las na
> **południe** od niej; rzeka przecina las, a za nią (dalej na południe) idzie
> trakt do miasta. Kierunki w rozdziale 4 są już zapisane w tym układzie.
>
> **Uwaga inżynierska (nie fabularna):** poniższy opis (rozdział 3) zakładał
> wioskę na POŁUDNIE od lasu (las u góry układu, rzeka/młyn u dołu) —
> pierwotny szkic, zanim mapa powstała. Pierwsza wersja mapy
> (`village-zagaje.tmj`, `tools/build_wioska.py`) stoi **na północ** od lasu
> — decyzja podjęta przy budowie, nie zmiana fabuły. **`docs/wioska_plan.md`
> już to rozstrzygnął (§1.2d, decyzje D-2/D-3 w §10):** młyn NIE ląduje na
> dalekiej północy wsi, z dala od bramy, jak zakładał ten szkic — stoi na
> południowej flance, blisko bramy, z własnym stawem i jazem zamiast rzeki
> leśnej (rzeka `forrest.tmj` i wioska nie są dziś hydrologicznie
> połączone — nie ma mostu danych między mapami poza portalem). Fabularne
> uzasadnienia w rozdziale 3 poniżej (czemu młyn, czemu płot zamiast palisady,
> czemu Myśliwy poza wsią) zostają w mocy; sam **rozkład** („Rozkład" niżej) jest
> nieaktualny wobec przyjętego układu — aktualny schemat i pełna, imienna
> lista 30 mieszkańców są w `docs/wioska_plan.md` §4 i §6.

## Dlaczego ta wioska tu stoi — młyn

Punkt wyjścia dla całej reszty: nad rzeką stoi **młyn wodny**. To domyka
ekonomię osady:

- **rzeka** — napędza koło i broni wsi od południa
- **pola** — zboże trzeba gdzieś zmielić
- **droga** — mąkę się wywozi, po mąkę się zjeżdża
- **kowal ma z czego żyć** — nie z kilku chałup, ale z mechanizmu młyńskiego,
  pługów i okuć wozów, które tu zajeżdżają

Dla fabuły najważniejsze: jeśli zające zeżrą zboże, **młyn nie ma czego
mielić**. Stawka rośnie z „będzie głodno" do „osada się rozejdzie".

## Płot, nie palisada — i dlaczego Myśliwy mieszka poza wsią

⭐ **Szczeble osady (2026-10-09):** wieś grodzi się **płotem**, gród —
**palisadą**, miasto — **murem**. Zagaje są wsią, więc stoją za płotami
(owalnica: `docs/decyzje/2026-10-09-owalnica-zagajow.md`); palisada w grze
zapowiada pierwszy gród.

Płot trzyma bydło w środku, a zwierza z boku — dzika nie zatrzyma. Zająca nie
zatrzyma nawet palisada — podkopie, przejdzie, wejdzie w zboże mimo wszystko.
**Dlatego odstrzału nie da się zastąpić murem** i dlatego ten urząd istnieje.

Myśliwy mieszka **poza wsią**, w lesie — tam ma robotę, suszarnie
i ognisko. Dlatego wilk dopadł jego, a nie kogokolwiek ze wsi.
**Układ wioski tłumaczy prolog bez jednego zdania dialogu.**

## Rozmiar

⚠ **Nieaktualne (2026-10-09): wieś ma 128 × 128 kafli** (owalnica, decyzja
wyżej). Pierwotny szkic poniżej zostaje jako zapis zamysłu:

**≈ 28 × 34 kafli** (≈900 × 1090 px), mniej więcej ⅓ lasu. Przejście wzdłuż
~7 s. Hub ma być przebiegany, nie zwiedzany — inaczej powrót po każdym
polowaniu staje się karą.

## Rozkład

```
                    ↑ las, droga
   TTTTTTTTTT.....==.....TTTTTTTTT
   TT........................TTTTT
   ....[CHATA MYŚLIWEGO]..........   ← POZA palisadą
   ......ognisko   suszarnie......
   ██████████████ BRAMA ██████████   ← palisada
   ..............  ==  ...........
   ...[SOŁTYS].....==....[KOWAL]..
   ................==.............
   ........[STUDNIA + TABLICA]....
   ................==.............
   ..[CHATA]..[CHATA]....[CHATA]..
   ................==......,,,,,,,
   ...[TWÓJ DOM]...==......,,,,,,,   , = pola
   ...[STODOŁA]....==......,,,,,,,
   ................==......,,,,,,,
   ..[CHATA]..[CHATA]......,,,,,,,
   ................==.............
   ..........[MŁYN]===============
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   ← rzeka
```

Trzy rzeczy celowe:

1. **Pole leży między lasem a wsią** — geograficzny zapis fabuły. Gracz
   codziennie mija to, czego broni.
2. **Brama dzieli dom od roboty.** Przechodzisz ją rano, wracasz przez nią
   wieczorem. Później naturalne miejsce na „wracasz ranny".
3. **Myśliwy najbliżej lasu**, poza murem.

## Obiekty i miejsca

| obiekt | po co |
|---|---|
| **Młyn** | racja bytu osady; landmark nad rzeką |
| **Studnia** | środek placu, punkt orientacyjny, miejsce spotkań |
| **Tablica zleceń** | przy studni; namiastka gildii, dom przyszłych zleceń |
| **Ognisko** | gotowanie *(mechanika działa)* — u Myśliwego, bo on uczy |
| **Suszarnie skór** | wizualny dowód jego fachu; tłumaczy skup skór |
| **Płoty + wrota zagród** | owalnica: podwórko w płocie, stodoły od zewnątrz domykają wieś (palisada = gród) |
| **Karczma + chmielnik** | przy trakcie od strony miasta, z wiechą; „tablica przy karczmie” z tematu Kowala |
| **Stodoła + wóz** | gospodarstwo ojca |
| **Kapliczka** przy drodze | klimat; później punkt zapisu/odrodzenia |

Wioska ma sprawiać wrażenie większej: dym z kominów, pranie, wóz przy młynie,
pola ciągnące się poza kadr, gwar zza płotów.

## Wnętrza

**Decyzja: wchodzimy do budynków.** Ale nie do wszystkich.

### Zasada — nigdy nie chowaj sklepu za przejściem

Jeśli sprzedaż skór wymaga wejścia do chaty, każda wyprawa kończy się dwoma
przejściami i pętla wioska → las → łup → powrót dostaje podatek. Na telefonie,
przy sesjach po kilka minut, to się odczuje.

| gdzie | co |
|---|---|
| **na zewnątrz** | to, co robisz stale — Myśliwy handluje i szkoli na podwórzu; kowal stoi przy kowadle pod zadaszeniem |
| **wewnątrz** | to, co robisz raz — fabuła i odkrywanie |

### Trzy wnętrza na start

**1. Twój dom — obowiązkowy** (≈9 × 7)

Prolog *zaczyna się* w łóżku. Bez tego wnętrza nie ma sceny przebudzenia,
a wybiegnięcie na podwórze przestaje być przejściem z domu w świat. Jedyne
miejsce, gdzie istnieje rodzina.

Palenisko, stół, łóżko rodziców, siennik gracza, skrzynia, okno.

**2. Chata Myśliwego — fabularna** (≈9 × 8)

Na początku **leży w niej ranny** — i to jest powód, żeby wejść: żeby go
zobaczyć. Później siedzi przy stole i wysyła cię w las. **Handel zostaje na
podwórzu.**

Łóżko, skóry na ścianach, stojaki na broń, kociołek.

**3. Kuźnia — bo kuźnia to miejsce, nie stragan** (≈10 × 8)

Palenisko, kowadło, miech, beczka. Kowal pracuje przy otwartym froncie, więc
widać go od progu — rozmowa nie wymaga wchodzenia, ale wejść można.

**Na później:** młyn (świetny klimatycznie, mechanicznie zbędny), dom sołtysa.
**Pomijamy chałupy wieśniaków** — cztery identyczne izby to praca, której gracz
nie zauważy.

### Dlaczego tylko trzy

Każde wnętrze to osobna mapa do postawienia, umeblowania i przetestowania.
Lepiej trzy izby wyglądające jak czyjś dom niż dziesięć pustych pudełek
z łóżkiem.

Przy przybliżeniu na telefonie widać ~6 kafli szerokości, więc izba 9 × 7
**wypełnia ekran** — wnętrza wyjdą ciasne i przytulne dokładnie tak, jak
powinny. To jedyny przypadek, gdzie wąski kadr gra na naszą korzyść.

---

# 4. Las

Szkielet (droga północ–południe od wsi w głąb lasu, most nad rzeką) jest dobry.
⚠ Kierunki niżej w układzie MAPY (wieś na północy). Trzy zmiany:

1. ⛔ *(odrzucone 2026-08-17 — Myśliwy zostaje w lesie, `wioska_plan.md` §4.3)*
   **Myśliwy wychodzi z lasu** pod wieś, ognisko razem z nim.
   Dziś sklep i trener stoją w lesie, przez co **wioska nie ma po co istnieć**.
   Po przeniesieniu powstaje pętla: wioska → las → łup → powrót.
2. **Zagęścić drzewa między wsią a rzeką**, żeby polany z zającami były
   czytelne. Teraz las jest rzadki i wszystko wygląda tak samo.
3. **Podkreślić most** — zwężenie, rozpadające się barierki. Ma mówić
   „dalej to inna sprawa", zanim ktokolwiek to powie.

**Wilk zostaje w SW rogu.** Leży idealnie: blisko wioski (dlatego przyszedł),
z dala od drogi (dlatego nie spotkasz go przypadkiem na 1. poziomie).

## Strefy

| strefa | zawartość |
|---|---|
| **Wioska** (północ, nad lasem) | dom, pola, młyn; Myśliwy przy skraju lasu |
| **Las między wsią a rzeką** | twój rewir — zające; wataha i Szary |
| **Wschodnia gęstwina** | dziki, a między nimi **sieciarze**; **za dzikami — skoczki jadowite** |
| **Za gęstwiną** (osobna mapa, ✅ wpięta 2026-08-16) | patrz niżej — trakt, który się urywa |
| **Most** | próg, przerywnik aktów |
| **Za rzeką** (dalej na południe) | droga dalej — **tędy do miasta** (wątek kowala) |

## Pająki — pierwszy ślad tego, co siedzi głębiej

Kręgosłup fabuły mówi, że *coś w głębi lasu* wypchnęło wilka pod wioskę.
Pająki są pierwszą rzeczą, która tego dotyka: nie polują jak zwierzę, tylko
**oplątują i czekają**, a ich sieć spowalnia gracza akurat na tyle, żeby dopadł
go dzik. Nie tłumaczą jeszcze niczego — mają tylko sprawiać wrażenie, że
wschodnia gęstwina należy już do kogoś innego.

Rozstawienie jest celowe: **jeden osobno** (gracz uczy się, czym jest sieć)
i **dwa przy dziku** (gracz uczy się, po co ona jest).

### Skoczki jadowite — im głębiej, tym mniej to jest zwykły las

Druga odmiana, wpięta później i postawiona **za dzikami**, nie między nimi. To
jest cała jej treść fabularna: sieciarza można spotkać przypadkiem, idąc na
dziki; skoczka spotyka się dopiero wtedy, gdy się **poszło dalej, niż trzeba
było**. Gęstwina nie robi się gęstsza — robi się bardziej cudza.

Skoczek nie zastawia sieci i nie czeka. **Podchodzi, unosi przednie odnóża
i kąsa**, a jad zostaje i narasta z każdym kolejnym ukąszeniem. Różnica wobec
sieciarza jest czytelna bez jednego słowa tekstu: tamten chce, żebyś się nie
ruszał, ten nie potrzebuje, żebyś stał.

To samo rozstawienie w tej samej roli co przy sieciarzach: **jeden osobno**
(gracz uczy się czytać telegraf ukąszenia) i **para głębiej** (dopiero tam jad
dochodzi do trzech stosów, bo dwa telegrafy naraz to już wybór, którego pilnować).

⚙ **Kolonia (zamiar autora 2026-10-11):** leże w jaskini — od 2026-10-12
**za Gęstwiną** (matecznik albo puszcza za lasem gospodarczym), Gęstwina jest
jego przedpolem; role jak w mrowisku — sieciarze i skoczki są jej pierwszymi, rozproszonymi
przedstawicielami. Granice i zderzenia z kręgosłupem: `docs/spider_colony.md`.

⚠ Skoczki **nie tłumaczą niczego więcej niż sieciarze** — reguła z akapitu wyżej
obowiązuje dalej. Mają tylko przesunąć granicę: pierwsza połowa gęstwiny to
jeszcze zwierzęta, druga już nie do końca.

### Za gęstwiną — osobna mapa (✅ wpięta 2026-08-16)

Za wschodnim skrajem lasu, przesmykiem w ścianie drzew tuż za parą skoczków,
zaczyna się **osobna mapa** (`thicket-gestwina.tmj`, 64×64).

⚠ **To nie jest strefa opisana wyżej — to jest to, co leży ZA nią.** Strefa
„wschodnia gęstwina" była i zostaje częścią mapy lasu.

Miejsce mówi o sobie trzema rzeczami i **żadna nie potrzebowała nowej
grafiki** — cały sens tej mapy polega na tym, że da się go powiedzieć układem:

- **Trakt wchodzi i umiera.** Kilkanaście kafli udeptanej drogi, potem dwa
  krótsze odcinki, potem nic. Ktoś tędy chodził i przestał chodzić. To jest
  najmocniejsze zdanie, jakie da się tu postawić kaflami, które już mamy.
- **Las ciemnieje w głąb.** Brzoza — drzewo światłolubne i najjaśniejsze
  w arkuszu — praktycznie znika, a jej miejsce zajmują świerk i grab. Zmiana
  jest płynna, więc czyta się jako wchodzenie głębiej, a nie jako granica.
- **Woda stoi.** Zamiast rzeki dwa rozlewiska bez odpływu, oba domknięte
  wewnątrz mapy. Rzeka mówi „doliną się idzie"; zastoisko mówi „tu się kończy".

⚠ **Ta mapa dalej niczego nie tłumaczy** — reguła od sieciarzy i skoczków
obowiązuje bez zmian, i tym bardziej dotyczy **pytania o most z §1**, które ma
zostać bez odpowiedzi. Nie ma tu nikogo, kto by cokolwiek powiedział: żadnego
NPC, żadnej notatki, żadnego znaleziska. Jest tylko droga, która się urywa,
i las, który robi się cudzy. Kto zechce tę mapę rozbudować — **niech nie
zaczyna od wyjaśnienia**.

## Uwaga o czytelności na telefonie

Przy obecnym przybliżeniu kamery, na telefonie w pionie widać **~6 kafli
szerokości**. Budynek 4-kaflowy zajmuje prawie cały ekran.

Albo zmniejszamy przybliżenie w wiosce, albo trzymamy budynki wąskie i blisko
drogi — inaczej gracz porusza się po korytarzu z tekstur.

---

# 5. Teksty — prolog (niewpięte)

> Struktura: **ekran tytułowy = marzenie**, **„Nowa gra" = rzeczywistość, która
> się wdziera**. Gracz dosłownie budzi się z ekranu tytułowego do pierwszej
> scenki. Ekran tytułowy przestaje być tapetą — staje się pierwszym aktem,
> a przycisk startu momentem przełomu, który gracz sam wywołuje.

## 1. Ekran tytułowy

Głos zmienia się w połowie: zaczyna **narrator** („jesteś"), kończy **chłopak**
(„odłożył"). Ten przeskok to moment, w którym gracz zrasta się z postacią —
dlatego **nie wygładzać go** z powrotem do jednej osoby.

```
Nie jesteś nikim wyjątkowym.

Wioska nazywa się Zagaje i leży tam, gdzie ptaki zawracają,
a psy szczekają dupami. Jesteś synem rolnika. Młody, zdrowy,
bez perspektyw — o ile nic się nie zmieni.

A świat ma magię. Świat ma potwory. Gdzieś daleko stąd jest
gildia, gdzie człowiek podchodzi do tablicy, zdejmuje zlecenie
i wraca jako ktoś inny.

Tylko że jest dziesiąta wieczorem, a rano znowu w pole.

Eh.

Może gdybym odłożył na porządny ekwipunek. Może gdyby stary
Myśliwy pokazał mi, jak się trzyma broń. Może kiedyś...

I zasypiasz. Jak co wieczór.
```

## 2. Po „Nowa gra" — przerwanie

Nie ma tu walki i nie ma rzezi. **Złamaniem jest bezradność, nie krew.**
Pierwsza walka, którą gracz *wygra*, to zające — tak jak powinno być.

```
Wyrywa cię ze snu nie krzyk, tylko cisza.

Psy ucichły. Wszystkie naraz.

Krzyk przychodzi dopiero potem — od zagrody Myśliwego.
Zrywasz się, biegniesz boso przez podwórze, w rękach nic,
w głowie nic.

Zdążasz zobaczyć tylko kształt między drzewami. Szary, niski,
szybki. Patrzy na ciebie przez moment — i tyle. Nie ucieka.
Po prostu odchodzi, jakbyś nie był wart zachodu.

Stary leży pod płotem i klnie. Żyje.

Ty stoisz boso w błocie i nie zrobiłeś nic.
```

## 3. Ranek — przejęcie obowiązku

Tu pada decyzja bohatera: rola to nie dla niego, ale nie odchodzi — zaczyna
zarabiać na siebie.

```
Myśliwy ma poszarpane ramię i minę człowieka, który już policzył,
ile go to będzie kosztować.

— Nie chodzi o mnie — mówi. — Chodzi o zające.

Bo ktoś musi je trzebić. Co roku, całe lato. Inaczej do żniw
nie zostaje nic prócz łodyg, a wieś zimą je to, czego nie zjadły.

Ojciec mówi, żebyś nie zawracał głowy. Że pole samo się nie zaorze.

Mówisz mu, że pole zaorze się i bez ciebie, a jeść trzeba tak
czy siak. Że nie odchodzisz — po prostu od dziś zarabiasz na
siebie sam.

Nie jest zadowolony. Ale cię nie zatrzymuje.
```

## 4. Samouczek — uzbrojenie się w kij ✅ (wpięte jako `QUESTS.stick_in_hand`)

Pierwsze zadanie w grze: **weź kij do ręki.** Nie „zabij pięć zajęcy" — tylko
otwórz plecak i załóż to, co masz.

Dlaczego akurat to jest dobry samouczek:

- **Uczy plecaka w jedynym momencie, w którym plecak jest treścią**, a nie
  formalnością. Później ekwipunek jest czynnością poboczną; tutaj jest celem.
- **Gołe pięści dają 8 DPS i to jest teraz odczuwalne.** Machnij parę razy na
  golasa, a różnica po założeniu kija (15 DPS) jest przeżyta, nie przeczytana.
  To najtańsza lekcja „sprzęt ma znaczenie", jaką gra może dać.
- **Domyka prolog bez dopisywania sceny.** Chłopak decyduje, że zarabia na
  siebie — i pierwsze, co robi, to obcina gałąź. Żadnego wybrańca, żadnego
  miecza z nieba. Zgodne z tonem: ciepły realizm.

**Jak to ostatecznie wyszło — i dlaczego nie tak, jak planowano.** Plan mówił:
kij leży **w plecaku** od ekranu tytułowego, a zadaniem jest go założyć. Tak
zrobiono i pierwszy playtest natychmiast go **sprzedał** — pierwsze zadanie w
grze przestało być wykonalne, bo kija nikt nie sprzedaje. Dlatego:

- `INVENTORY.startingItems` jest **puste**, a `TitleScene.grantStartingGear`
  nie zakłada **BRONI**. Start na gołe pięści (8 DPS) jest teraz treścią, nie
  usterką — trwa tyle, ile droga przez podwórze do ojca.
  ⚙ **Od 2026-10-03 zakłada za to STRÓJ** (`INVENTORY.startingWorn`, decyzja
  autora): koszula, spodnie i łapcie w jakości „Niska" — chłopak z podwórza
  jest ubrany, nie biega w bieliźnie modelu 3D. To prawdziwe przedmioty
  (ważą, chronią o punkt, da się je sprzedać); żadne zadanie „załóż" ich nie
  dotyczy.
- **Kij wręcza Ojciec** przy przyjęciu zadania (`grant` w `QUESTS`).
  **Wcześniej robił to Myśliwy i to była pomyłka co do miejsca sceny.** Kij
  wręczony w lesie, przez człowieka, do którego przeszedłeś już obok wszystkich
  zajęcy, jest formalnością; ten sam kij wręczony w progu, przez ojca, który cię
  zatrzymuje wychodzącego, JEST tą sceną — dokładnie tą, którą opisuje §3
  („nie jest zadowolony, ale cię nie zatrzymuje"). Kwestia stoi wprost:
  *„idziesz za wieś, to nie idź z gołymi rękami (…), a jak, nie daj Boże,
  wyjdzie na ciebie coś większego, to przynajmniej będziesz miał co trzymać"*.
  Przy okazji domyka dwie rzeczy: ojciec dostaje mechanikę zamiast samej
  obecności, a gracz **musi** z nim porozmawiać przed Myśliwym, co otwiera
  łańcuch o wojsku (§2).
- **Konsekwencja, nośna:** świeża gra zaczyna się **w wiosce**, na własnym
  podwórzu — kilka kafli pod drzwiami domu gracza, z Ojcem i Mamą między tobą
  a chatą (`GameScene.init`). Myśliwy nie ma nic do dania, póki to zadanie nie
  jest oddane (`rabbit_hunt` stoi za nim), więc start w lesie posadziłby gracza
  obok człowieka bez roboty i bez podpowiedzi, że pierwsze zadanie jest za bramą.
- **A jak gracz i tak pójdzie najpierw do Myśliwego** (bramy nikt nie zamyka),
  to Myśliwy go odsyła: *„do lasu z gołymi rękami się nie chodzi (…) idź do domu,
  niech ci stary da coś do ręki — on wie, co robi, uwierz mi na słowo"*
  (`MERCHANT.greetings.notYet`). To jedyne miejsce, w którym łańcuch o wojsku
  odzywa się sam z siebie, zanim gracz o cokolwiek zapyta.
- Kij jest **niesprzedawalny, póki zadanie trwa** (`Quests.isQuestItem`,
  sklep odmawia i mówi dlaczego). Bez tego wymiana kija u dawcy była
  nieskończoną pompą złota: sprzedaj → pogadaj → dostań nowy → powtórz.
- Zgubiony inaczej niż przez sprzedaż jest wymieniany **raz** i tylko raz
  (`Quests.replenishGrants`) — siatka na ślepy zaułek, nie źródło dochodu.

Typ celu „załóż przedmiot" istnieje (`Objective` → `equip`), obok `collect`,
`kill` i `talk`.

---

# 6. Teksty w grze (`GameConfig.ts`) ✅

Wpięte i sprawdzone: dziennik zadań, okno rozmowy i widok zadań u Myśliwego —
bez wylewania się z ramek i bez kolizji.

## `MERCHANT.greetings` — kwestie zależne od stanu

`NpcDialog.pickGreeting()` wybiera pierwszą pasującą, od najbardziej
konkretnej:

| stan | kwestia |
|---|---|
| coś gotowe do oddania | „Widzę, że nie poszedłeś się przespać pod drzewem. Dawaj to, z czym wróciłeś." |
| zlecenie do wzięcia, **nic jeszcze nie skończone** | „Nie gap się na ramię. Zające wchodzą w zboże, a ja przez miesiąc nie przejdę własnego podwórza. Robota jest do wzięcia — jak nie ty, to nikt." |
| zlecenie do wzięcia, ale nie pierwsze | „Jest jeszcze jedna rzecz, jak masz siłę. Siadaj, powiem ci." |
| robota w toku | „I jak tam? Zające same się nie policzą. Wracaj, jak będziesz miał co pokazać." |
| nic do wzięcia, ale ma czego uczyć | „Mięso to połowa zająca. Reszta to skóra, a tej marnować nie wolno — mogę cię nauczyć, jak zechcesz." |
| wszystko przekazane | „Nauczyłem cię wszystkiego, co umiem. Reszty nauczy cię las. I pamiętaj — ten szary wciąż gdzieś tam jest." |

Dwie rzeczy warte zapamiętania:

- **`firstJob` jest oddzielone od `newJob`**, bo tylko pierwsza rozmowa może
  nieść przekazanie urzędu — przy drugim zleceniu kwestia o ramieniu jest już
  nieaktualna.
- **Kwestia przeliczana jest też przy powrocie z podokna** (`backToDialog`),
  nie tylko przy otwarciu. Oddanie zadania dzieje się wewnątrz `QuestPanel`,
  więc bez tego Myśliwy dopominałby się o coś, co przed chwilą dostał.

Ostatnia kwestia **zasiewa wilka** — pierwsza wzmianka o nim po prologu.

## `MERCHANT.greeting` (awaryjne)

```
"Ramię mi jeszcze nie wróciło, więc las jest twój. Masz coś do sprzedania, czy przyszedłeś się czegoś nauczyć?"
```

## `QUESTS.rabbit_hunt.description`

Niesie stawkę (żniwa), powód (nie może chodzić) i ramę zapłaty (dniówka).

```
"Zające wchodzą w zboże i wychodzą z niego tłuste. Póki nie mogę chodzić po lesie, robisz to za mnie — inaczej do żniw nie zostanie nic prócz łodyg. Przynieś mi 5 kawałków mięsa, dostaniesz dniówkę."
```

## `QUESTS.scraps_bounty.description`

Zawiera **zaczep pod przyszły wątek miasta** — żeby później nic nie cofać.

```
"Skoro umiesz już skórować, nie marnuj tego, co zostaje. Zbierz 8 strzępów — wyprawię z nich coś, za co ktoś w mieście zapłaci."
```

---

# 7. Ustalenia i pytania

## Rozstrzygnięte

| pytanie | ustalenie |
|---|---|
| Ojciec żyje? | **tak** — stary, nie kaleki |
| Matka żyje? | **tak** — ona cię puszcza, ona zostaje przy gospodarstwie |
| Wchodzimy do budynków? | **tak** — trzy wnętrza na start |
| Rodzeństwo bohatera? | **nie**, na razie |
| Nazwa wioski | **Zagaje**, robocza |

## Otwarte

1. ~~**Co się dzieje po zabiciu Szarego?**~~ ✅ **Zamknięte 2026-08-17** —
   wszystkie trzy części minimum plus scena nazwania, u Sołtysa. Szczegóły w §2
   („Co zostaje po nim"). Zostaje jedno pytanie z tego wątku: **rola Myśliwego
   po śmierci wilka** (patrz „Dalszy łańcuch" niżej) — jego ramię się nie
   zrosło, urząd jest oddany, a on nadal handluje i szkoli. To jest dziś
   naturalne, ale nie na zawsze.
2. ~~Czy ojciec jest NPC-em w wiosce, czy istnieje tylko w prologu?~~
   ✅ **Rozstrzygnięte przez praktykę, nie decyzją: jest NPC-em.** Stoi na
   podwórzu domu gracza, daje `stick_in_hand` (pierwsze zadanie w grze) i niesie
   połowę łańcucha o wojsku. To pytanie odpowiedziało się samo i zostało tu
   otwarte dłużej, niż powinno.
3. Czy gildia bohaterów jest osiągalna w tej wersji gry, czy zostaje
   marzeniem i zapowiedzią?
4. Czy trzebienie zajęcy ma być cykliczne (sezon/rok)? To naturalna podstawa
   pod zlecenia powtarzalne — a przy modelu z reklamami dokładnie ten rodzaj
   pętli, który buduje powroty.
5. ⚠⚠ **DWOJE MIESZKAŃCÓW ZAGAJÓW ISTNIEJE W GRZE I NIE ISTNIEJE W KANONIE.**
   Zmierzone 2026-09-08 na żywej konfiguracji: **Patryczek** i **Anna** stoją
   na `village-zagaje.tmj`, mają portrety, kwestie i tematy rozmów, a nie ma
   ich **ani w tym dokumencie, ani w `wioska_plan.md`** — czyli w obu plikach,
   które ten projekt każe otworzyć, „zanim napiszesz cokolwiek, co gracz
   przeczyta". To nie jest luka w kodzie: to **treść, która weszła do gry
   z pominięciem kanonu**.
   - **Patryczek** niesie dziś więcej niż własną rolę: jest **jedynym
     sprzedawcą rang Mastery**, czyli bramą do całego systemu biegłości,
     a jego charakterystyka („ręka w łubkach", „nigdy nie prosi wprost") jest
     wprost powiązana z tym, dlaczego uczy zamiast pokazywać. **Zagaje mają
     więc drugą po Myśliwym postać okaleczoną tak, że przestała robić swoje** —
     a `§2` nie wie, czy to jest echo tego samego wydarzenia, czy zbieg.
   - **Anna** prowadzi sklep z chlebem i **rzuca zaczep** („jak szukasz
     kudłatej rudej suki, to ja też"), który nie ma dziś kontynuacji nigdzie.
   ✅ **ROZSTRZYGNIĘTE 2026-10-10 (autor):** Patryczek — wnuk zielarki,
   mieszka u babki; Anna — kuzynka Bogusza, sekcja „Anna — kuzynka
   karczmarza" wyżej; obsada obejść: `wioska_plan.md` §5 (wstęp).
   Historyczne brzmienie poniżej.
   ⛔ **Nie dopisano im lore w ramach porządków 2026-09-08** — kim są, z czyjego
   są obejścia, czy Patryczek jest weteranem z łańcucha o wojsku i czy zaczep
   Anny ma cokolwiek znaczyć, **jest decyzją autora, nie robotą agenta.**
   ⚠ Do czasu tej decyzji **`§2` i `wioska_plan.md` §5 są NIEPEŁNE jako obsada**,
   a nie tylko nieaktualne — nie należy zakładać, że skoro kogoś tam nie ma,
   to go nie ma w grze.

## Dalszy łańcuch — ⚙ **PRZESTAŁ BYĆ ODŁOŻONY (2026-09-08)**

Kowal potrzebuje kogoś, kto pojedzie do miasta — wilki się panoszą, a nie ma
komu iść. Droga przez las i most za rzekę (na mapie: na południe od wsi) jest
już położona pod ten wątek.

⚙ **Ten wątek ma dziś przypisaną ROLĘ w kręgosłupie: jest ODDECHEM** między
pierwszą a drugą falą napięcia — pierwszym rozszerzeniem świata poza Zagaje.
Nagłówek mówił „(odłożony)" i to przestało być prawdą; szczegóły w §1,
„Falowanie napięcia".

⚠ **Rola Myśliwego po śmierci Szarego wciąż do omówienia** — jego ramię się nie
zrosło, urząd jest oddany, a on nadal handluje i szkoli. Dziś naturalne, nie na
zawsze. ⚠ **Do tego doszło pytanie bliźniacze:** Patryczek też jest kaleką,
który uczy, bo nie może pokazać. **Zagaje mają dwie postaci okaleczone tak, że
przestały robić swoje** — czy to jest echo tego samego wydarzenia, czy zbieg,
nie jest rozstrzygnięte (patrz §7, pytanie 5).

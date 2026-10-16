---
typ: HISTORIA
domena: creatures
tytul: Bestiariusz — audyt stanu przed pracą nad AI
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-27
---

# Bestiariusz — audyt stanu przed pracą nad AI i ekosystemem

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/creatures.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: AUDYT, nic nie wdrożone, nic nie zaprojektowane (2026-08-27).**
Odpowiada na „co mamy, czego brakuje, gdzie są luki". **Nie projektuje AI** —
to była wyraźna granica zlecenia. Rekomendacje w §5 są kolejnością prac, nie
specyfikacją.

Wszystkie liczby wyciągnięte z **prawdziwego `GameConfig.ts`** (esbuild → node,
skrypt jednorazowy, nie zostawiony w `tools/`) i z **żywych `.tmj`**, nie
z dokumentacji. Zachowania odczytane z `src/entities/*.ts`.

---

## 1. Roster — co faktycznie istnieje

### 1.1 Wrogowie (7 gatunków + manekin)

| gatunek | HP | XP | pościg | agro/zerwanie | obrażenia | stan |
|---|---|---|---|---|---|---|
| **Królik** (`Rabbit`) | 30 | 25 | 70 | 140 / 260 | kęs, kontakt **wyłączony** | ✅ pełny |
| **Dzik** (`Boar`) | 95 | 70 | 52 | 175 / 340 | szarża 16–24 `blunt`, kieł | ✅ pełny |
| **Wilk** (`Wolf`) | 55 | 45 | 115 | 165 / 320 | wypad + kęs `pierce` | ✅ pełny |
| **Szary** (`GreyWolf`) | 190 | 260 | 132 | 210 / 420 | kęs 18–26 `pierce`, kontakt 11–15 | ✅ pełny, **elita, nie odradza się** |
| **Sieciarz** (`Spider`) | 42 | 55 | 62 | 230 / 380 | pocisk (sieć) + kontakt 3–5 | ✅ pełny |
| **Skoczek** (`VenomSpider`) | 46 | 40 | 96 | 150 / 300 | kęs 3–5 `pierce` + jad 3 stosy | ✅ pełny |
| **Niedźwiedź** (`Bear`) | 130 | 100 | 60 | 190 / 360 | zamach 55°, kontakt wyłączony | ✅ pełny |
| **Manekin** (`TrainingDummy`) | — | 0 | — | 0 | zero | ✅ narzędzie treningowe |

Wszystkie chodzą na `ActionRunner` (Faza 2 Combat v2), wszystkie mają telegraf,
łup, dźwięk i respawn (poza Szarym). **Żaden nie jest placeholderem** — to jest
najważniejsza pojedyncza obserwacja tego audytu: nie ma tu nic do dokończenia,
jest co rozbudować.

### 1.2 Zachowania AI — po jednym zdaniu

- **Królik** — archetyp `Prey`: ucieka zrywami (`bolt` 420 ms → `watch` 820 ms),
  **agresywny dopiero po uderzeniu**, poniżej 40% HP wpada w sploch i zamiera.
  Jedyne stworzenie, które reaguje na gracza inaczej niż atakiem.
- **Dzik** — szarża z telegrafem **560 ms** (300 px/s, 420 ms lotu, tor
  sprawdzany co klatkę), kieł na zwarcie z blokadą „musiał wcześniej odbiec".
- **Wilk** — okrąża na promieniu 96 z wyprzedzeniem 26°, wypada z 120 px,
  **wyje i budzi wszystkich pobratymców w promieniu 200** (przekaźnik: obudzony
  wyje dalej, rekurencja gaśnie sama).
- **Szary** — wilk, który zamienił cykl watahy na **pojedynek**: kęs, odskok
  128 px, znowu. Poniżej 40% HP szał (×1,22 tempo, ×1,25 obrażenia,
  ×0,62 cooldown).
- **Sieciarz** — strzela z 220 px, **wycofuje się poniżej 96 px**. Jedyny
  dystansowy w grze.
- **Skoczek** — dochodzi i kąsa, jad kumuluje się do 3 stosów (2 obr. / 1,5 s
  przez 6 s), **omija pancerz i nietykalność**, blokuje regenerację.
- **Niedźwiedź** — najwolniejszy, najdłuższy telegraf (**620 ms**) i najdłuższe
  okno kary (**800 ms**).

### 1.3 Fauna neutralna — istnieje więcej, niż mówi zlecenie

| klasa | gatunki | zachowanie | gdzie |
|---|---|---|---|
| `FarmAnimal` | kura, krowa, byk, świnia, owca, baran, kot | wędrówka/postój wokół punktu | Zagaje (16 szt.) |
| `Bird` | ptak | przeskoki tweenem, **bez `update()`** | las (3 szt.) |
| `Critter` | **sarna/jeleń, lis** | wędrówka/postój wokół punktu | las (2 + 2) |

⚠ **`Critter` to dokładnie te dwa stworzenia, o które pyta zlecenie.**
`DEER` i `FOX` mają strojenie w `GameConfig`, arkusze (`deer_*`, `fox_*`),
animacje (`deerAnim`/`foxAnim`), aliasy w `TiledMap` (`jelen`, `lis`) i **stoją
na mapie lasu od 2026-08-14**. To nie są pomysły do wprowadzenia, tylko obecność
bez roli — o czym dalej w §4.

---

## 2. Ocena: czy to worki HP?

### 2.1 Nie — i da się to pokazać liczbami

Każdy wróg wymusza **inną decyzję**, i to nie deklaratywnie:

| gatunek | pytanie, które zadaje graczowi | czym odpowiada |
|---|---|---|
| Królik | „gonić czy odpuścić" | cel, który **ucieka i wraca**; atak wymaga zatrzymania się |
| Dzik | „zejść z toru czy przerwać" | 560 ms telegrafu, tor liniowy |
| Wilk | „gdzie stoję" | okrążanie karze plecy; bramka zwrotu jest realna |
| Wataha | „którego pierwszego" | wycie zamienia jednego wroga w trzech |
| Szary | „czy starczy mi zasobów" | 190 HP + szał = jedyna walka na wytrzymałość |
| Sieciarz | „czy zdążę dojść" | wycofuje się 84 px/s przy 150 px/s gracza |
| Skoczek | „czy stać mnie na czas" | jad rośnie, więc przeciąganie kosztuje |
| Niedźwiedź | „kiedy uderzyć" | 800 ms okna kary — najlepsze w grze |

**To jest dobry roster.** Pokrywa dystans, pozycję, timing, tłum, wytrzymałość
i presję czasu. Żaden nie jest kopią sąsiada.

### 2.2 Ale trzy systemy walki są testowane przez JEDNO stworzenie albo żadne

⚠ **Pancerz wrogów: 1 z 7.** Tylko dzik ma `armor` (`leather`, 22 pkt).
Pozostałych sześciu ma `armor: null`, a brak pancerza znaczy **pełne obrażenia
niezależnie od typu** (`Protection` zwraca punkty bez zmian). Czyli cała oś
**typ obrażeń × materiał pancerza** — cztery typy, cztery materiały, własny
plik `Protection.ts`, przycisk typu na pierścieniu HUD-u i pełny dokument
`docs/typy_obrazen.md` — jest po stronie gracz→wróg egzekwowana **przez jednego
przeciwnika w grze**. Przełączanie typu przeciw sześciu z siedmiu nie robi nic.

⚠ **Dystans: 1 z 7.** Sieciarz jest jedynym przeciwnikiem, który w ogóle
zmusza do zamykania dystansu.

⚠ **Kontrola: 0 z 7.** Gracz dostał ogłuszenie (Uderzenie tarczą, 2026-08-26).
Żaden wróg nie ma niczego, co odbiera graczowi akcję — jest spowolnienie
(sieć) i jad, nie ma kontroli. To nie jest zarzut, tylko pusty slot po stronie
przeciwnika.

### 2.3 AI ma dokładnie DWA stany i to jest sufit, nie usterka

`Enemy.updateAI` zna `patrol` i `chase`. Przejście to **czysty dystans**:

```ts
if (aiState === "patrol" && !player.isDead && dist <= cfg.aggroRange) enterChase();
```

Konsekwencje, wszystkie zmierzone w kodzie:

- **Brak linii wzroku.** Ściana drzew, głaz, budynek — nic nie zasłania. Wróg
  po drugiej stronie skały widzi gracza tak samo jak na polanie.
- **Brak zwrotu.** Podejście od tyłu jest identyczne z podejściem od przodu.
  Skradanie się nie istnieje jako kategoria.
- **Brak pamięci.** Zerwanie pościgu to natychmiastowy powrót do patrolu —
  nie ma „ostatniej znanej pozycji", nie ma szukania, nie ma czujności.
- **Brak słuchu.** Walka obok nie interesuje nikogo poza wilkami (wycie).
- **Zero interakcji między gatunkami.** Jedyny kanał to `aggro()` z wycia.
  Wilk nie poluje na królika. Niedźwiedź nie płoszy niczego. Lis nie ucieka
  przed wilkiem.
- **Zero reakcji na gracza poza atakiem** — z jednym wyjątkiem, i to jest
  najważniejszy istniejący klocek: **królik ma pełny, działający archetyp
  `Prey`** (czujność → zryw → obserwacja → sploch).

---

## 3. Ekosystem: co widzi gracz na mapach

| mapa | wrogowie | fauna neutralna | stosunek |
|---|---|---|---|
| **Las** 100×60 | 19 (5 królik, 4 wilk, 3 sieciarz, 3 skoczek, 2 dzik, 1 niedźwiedź, 1 Szary) | 7 (2 sarny, 2 lisy, 3 ptaki) | **2,7 : 1** |
| **Gęstwina** 64×64 | 5 (2 sieciarze, 3 skoczki) | **0** | **∞** |
| **Zagaje** 100×100 | 0 (+ manekin) | 16 zwierząt gospodarskich | 0 : 16 |

⚠ **Gęstwina nie ma ani jednego żywego stworzenia poza pająkami.** Fabularnie
to działa (`swiat.md`: „pierwsza połowa gęstwiny to jeszcze zwierzęta, druga już
nie do końca") — ale działa **przypadkiem**, bo pustka nie jest niczym
zaznaczona. Nie ma tam ciszy po zwierzętach; nie ma tam nigdy żadnych zwierząt.
To jest największa pojedyncza szansa ekosystemowa w projekcie: **ta mapa ma
gotowe uzasadnienie fabularne dla nieobecności fauny, więc pokazanie fauny na
skraju i jej braku w głębi kosztuje kilka punktów spawnu.**

---

## 4. Lis i jeleń — nie „dodać", tylko „dać rolę"

Oba istnieją, chodzą i są nieklikalne. Czego im brakuje, dokładnie:

**`Critter.update(nowMs)` nie przyjmuje gracza.** Nie ma podpięcia — sarna
i lis fizycznie nie mogą wiedzieć, że ktoś stoi obok. Idą swoją pętlą, gdy
gracz wchodzi im w bok, i idą swoją pętlą, gdy gracz bije obok nich
niedźwiedzia. **To jest cała luka** i jest jednozdaniowa: brak wejścia.

### 4.1 Jeleń — rola: skala i dystans lasu

- **Czym ma być:** miarą tego, że las jest większy niż gracz. Duży, płochliwy,
  widziany częściej z daleka niż z bliska.
- **Zachowanie, które pasuje:** archetyp `Prey` **bez** części bojowej —
  czujność na większym promieniu niż królik, zryw w przeciwną stronę, zatrzymanie
  i obserwacja. Klocek istnieje (`RABBIT.prey`), sprawdzony w rozgrywce.
- ⚠ **Nie robić z niego zwierzyny łownej — i to ma uzasadnienie w biblii świata,
  nie tylko w zleceniu.** `swiat.md`: *odstrzał to urząd, nie otwarty sezon*,
  a urząd dotyczy **zajęcy tratujących zboże**. Jeleń nie jest szkodnikiem,
  więc nie jest twoją robotą. **Myśliwy, który mija jelenia i nie strzela, mówi
  o świecie więcej niż jeleń, który daje 3 sztuki mięsa.**
- **Ryzyko:** jeleń, który ucieka natychmiast, jest tym samym co brak jelenia.
  Musi dać się zobaczyć, zanim zniknie — czyli promień czujności większy niż
  zasięg ucieczki (u królika `alertRange` 110 przy `aggroRange` 140; jeleniowi
  potrzeba odwrotnej proporcji).

### 4.2 Lis — rola: dowód, że las ma własne sprawy

- **Czym ma być:** jedynym stworzeniem, które **coś robi, gdy gracz nie
  patrzy**. Nie ucieka i nie atakuje — poluje, węszy, przemyka.
- **Zachowanie, które pasuje:** cel wędrówki wybierany nie losowo, tylko
  **do czegoś** — do stanowiska ziół, do królika, do padliny po walce. Nawet
  bez żadnej mechaniki po drugiej stronie, sam **kierunek** czyta się jako zamiar.
- ⚠ **Tu leży najtańsza w projekcie interakcja międzygatunkowa:** lis podchodzi
  do królika, królik ucieka (`Prey` **już to potrafi**). Dwie linie zamiarów
  i las przestaje być zbiorem niezależnych pętli. **To jest jedyne miejsce
  w tym audycie, gdzie nowa jakość kosztuje mniej niż nowy przeciwnik.**
- **Ryzyko:** lis polujący na królika, którego gracz ma zabić dla Myśliwego,
  wchodzi w quest. Musi być scenką, nie konkurencją — królik nie może zginąć.

---

## 5. Rekomendacja — kolejność

### 5.1 Najpierw: wejście gracza do `Critter`

Jedna zmiana odblokowuje wszystko powyżej i **nic nie psuje**: `Critter` dostaje
pozycję gracza i próg reakcji. Bez tego żadna rozmowa o ekosystemie nie ma
gdzie się zaczepić.

### 5.2 Potem: jeleń jako `Prey` bez walki

Największy zwrot za wysiłek w całym audycie. Archetyp jest napisany, przetestowany
i opisany; jeleń potrzebuje jego połowy (czujność + ucieczka), bez kęsa
i bez splochu.

⚠ **Pułapka udokumentowana w `src/entities/CLAUDE.md` i warto ją tu powtórzyć:**
*ucieczka MUSI być przerywana (zryw → czujność), nigdy ciągła.* Pierwsza wersja
królika uciekała bez przerwy i **nie dało się go trafić w ogóle**. Jeleń
nietrafialny nie jest problemem (nie ma być trafiany), ale jeleń, który nigdy
nie stoi, jest smugą, nie zwierzęciem.

### 5.3 Potem: lis z zamiarem

Cel wędrówki wybierany do obiektu zamiast losowo. Reakcja królika przychodzi
gratis, bo `Prey` reaguje na zagrożenie, nie na gracza z nazwy.

### 5.4 Dopiero potem: AI wrogów

I **nie od nowych przeciwników**. Trzy braki z §2.2 są warte więcej niż ósmy
gatunek, bo naprawiają systemy, które już są zbudowane i opłacone:

1. **Pancerz dla reszty rosteru** — najtańsza rzecz w tym dokumencie
   (`armor` to jedno pole w konfigu) i jedyna, która sprawia, że **istniejący,
   w pełni zbudowany system typów obrażeń zacznie działać na więcej niż jednym
   wrogu**. ⚠ Nie dla pająków — `metal` dla chityny jest jawną barierką
   (`odlozone.md` §5).
2. **Linia wzroku albo zwrot przy agro** — dziś podejście od tyłu nie istnieje
   jako kategoria, więc cała warstwa „jak się zbliżam" jest pusta.
3. **Pamięć po zerwaniu pościgu** — „ostatnia znana pozycja" zamienia zerwanie
   z wyłącznika w decyzję.

### 5.5 Które zostają neutralne — na stałe

**Sarna/jeleń, lis, ptaki, wszystkie zwierzęta gospodarskie.** ⚠ Neutralność
jest tu **funkcją, nie brakiem funkcji**: las, w którym wszystko da się zabić,
jest listą celów. Ta reguła należy do barierek — jeśli wróci propozycja „a może
jeleń dawałby skórę", odpowiedź brzmi: **wtedy przestaje mówić to, po co go
postawiono.**

---

## 6. Fantazja gracza: czy ten las żyje?

**Dziś: prawie.** I to „prawie" da się nazwać dokładnie.

**Co działa:** wataha, która się nawołuje. Sieciarz, który się cofa. Królik,
który ucieka, dopóki go nie uderzysz. Dzik, który daje 560 ms na zejście z toru.
To są **zachowania zwierząt, nie paski HP** — i gracz to widzi bez jednego słowa
tekstu.

**Co nie działa — trzy rzeczy, w kolejności widoczności:**

1. **Wszystko, co żyje, dotyczy gracza.** Każde stworzenie w lesie albo idzie
   do gracza, albo od gracza, albo go ignoruje. **Nic nie ma sprawy z kimś
   innym.** Las nie jest listą przeciwników — ale jest listą relacji
   dwustronnych, wszystkich z tym samym drugim końcem.
2. **Fauna neutralna jest dekoracją i wygląda jak dekoracja.** Sarna, która nie
   podnosi głowy, gdy przechodzisz o dwa kroki, czyta się jako sprite, nie jako
   zwierzę. **To psuje więcej, niż daje jej obecność** — nieruchoma reakcja jest
   informacją: „to jest tło".
3. **Proporcja 2,7 : 1 na korzyść wrogów** znaczy, że las to głównie rzeczy,
   które chcą cię zabić. W gęstwinie to jest 5 : 0.

**Werdykt:** walka ma tożsamość gatunków, świat jej nie ma. Ryzyko na dziś nie
brzmi „las jest listą przeciwników do pokonania" — bo przeciwnicy są dobrzy —
tylko **„las jest sceną, na której stoi siedem dobrze napisanych ról i żadnego
tła"**. Naprawa jest tańsza, niż wygląda: dwa stworzenia, które już tam są,
i jedno wejście, którego im nie podano.

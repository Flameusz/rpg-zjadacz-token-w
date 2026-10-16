---
typ: HISTORIA
domena: world
tytul: Las — projekt docelowy lokacji
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-27
---

# Las — projekt docelowy lokacji (Faza 1B, decyzja przed implementacją)

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/world.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: PROJEKT DO DECYZJI AUTORA (2026-08-27). Nic nie wdrożone, `.tmj`
nietknięty, zero kodu.** To nie jest audyt — audyt jest osobno
(`docs/las_audyt_level_design.md`) i ten dokument go **nie powtarza**, tylko
się na nim opiera. Zadanie: zaprojektować las jako **pierwszą dużą lokację
świata**, a nie mapę z punktami walki.

Nowe pomiary robione tylko tam, gdzie decyzja ich wymagała (profil rzeki,
korelacja zagrożenia z dystansem, geometria młyna w Zagajach). Reszta liczb
pochodzi z audytu.

Schemat układu: **`docs/img/las_uklad_docelowy.png`**.

---

## 0. ⚠ Ten dokument ZMIENIA rekomendację z audytu. Piszę to wprost.

`las_audyt_level_design.md` §10.6 rekomendował **Opcję A (nie powiększać)**.
To była odpowiedź na pytanie: *„czy mapa jest za mała dla ekosystemu, który
już na niej stoi?"* — i na tamto pytanie odpowiedź nadal brzmi **nie**.

To zlecenie stawia inne pytanie: *„czy mapa jest wystarczająca jako pierwsza
duża lokacja świata, z progresją wioska → rzeka → skraj → las → głęboki las →
stara puszcza, plus warstwa ludzka?"* Na to pytanie odpowiedź brzmi **nie
jest** — i rekomendacja zmienia się na **wzrost, wyłącznie na wschód**.

**Nie jest to zmiana zdania po nowych danych — to inna odpowiedź na inne
pytanie**, i argument z §10.3 audytu (mapa mieści 10 stref) nadal obowiązuje
dla siedmiu stref ekologicznych. **Sześć pasm progresji + warstwa ludzka to
inny rachunek** i przeprowadzam go od nowa w §7.

---

## 1. Co w obecnym lesie jest FUNDAMENTEM, a co PROTOTYPEM

Rozdzielam to ostro, bo od tego zależy, ile pracy jest do wyrzucenia.

### ✅ Fundament — zostaje, nie ruszamy

| element | dlaczego to jest dobra kość |
|---|---|
| **Rzeka od krawędzi do krawędzi** | pojedyncze pasmo w każdej kolumnie, wchodzi zachodem (wiersze 18–23), wychodzi wschodem (17–21). To jest prawdziwa rzeka, nie jezioro — pomyliłem się w audycie §1.4, patrz §2.1 |
| **Jedno przejście (bród x 38–45)** | jedyna brama między dwiema połowami świata |
| **Droga-kręgosłup + brama północna (41,1)** | powtarzalne wejście gracza; drogowskaz już stoi |
| **Myśliwy na skraju, poza wsią** | decyzja z 2026-08-17, z uzasadnieniem fabularnym i zmierzonymi odległościami — **zostaje** (§4) |
| **Wataha + Szary w SW** | jedyne działające terytorium; `swiat.md` mówi „leży idealnie" — ale **rola się zmienia**, patrz §5.3 |
| **Rewir królików** | zwarty, dobrze rozstawiony |
| **Stanowiska ziół po siedliskach** | jedyna warstwa mapy z prawdziwą logiką ekologiczną — **wzorzec do naśladowania dla fauny** |
| **Dziesięć asercji `build_mapa.py`** | koperta ograniczeń, wszystkie przechodzą |

### 🔧 Prototyp — do przebudowy, ale nie do wyrzucenia

| element | co jest nie tak |
|---|---|
| **Podłoże** | 6-stopniowa gęstość trawy o średniej 2,3–2,9 w KAŻDYM z 60 bloków — czysty szum |
| **Rozkład drzew** | 46 % zwarcia, ale pojedynczo i równomiernie: zero koron, zero polan |
| **Gradient wschodni** | odwrócony względem `swiat.md` (brzoza rośnie ku Gęstwinie zamiast znikać) |
| **Bród** | to nie jest bród — to **przerwa w wodzie** (§2.2) |
| **Rozstawienie zagrożeń** | korelacja HP↔dystans **r = 0,23** (§3) |
| **Zachodni fragment rzeki** | najszerszy punkt całej rzeki (9 kafli) leży w martwej ćwiartce (§2.3) |

### ❌ Czego nie ma wcale

Warstwy ludzkiej poza chatą Myśliwego. Zero wyrębów, drwali, obozów, ruin,
bandytów. **Las nie ma z kim być w konflikcie.**

---

## 2. Rzeka

### 2.1 ⚠ Sprostowanie do audytu: to JEST rzeka, nie dwa jeziora

W audycie §1.4 napisałem, że rzeka „czyta się jak dwa zbiorniki". Zmierzyłem
profil kolumna po kolumnie i **to było błędne**:

```
  x   |  0   12   24   36   39  |42|  45   60   72   84   99
 szer |  6    9    4    3    1  | 0|   5    7    5    2    5   kafli
 pasm |  1    1    1    1    1  | –|   1    1    1    1    1
```

**Jedno pasmo w każdej kolumnie, od krawędzi do krawędzi.** Program liczący
zbiorniki znajduje dwa **wyłącznie dlatego, że przy x = 42 wody nie ma
w ogóle** — o czym niżej. Rzeka jest poprawna topologicznie; to, czego jej
brakuje, to **kierunek**.

### 2.2 ⚠ Bród jest dziurą w rzece, nie płycizną

Przy x = 42 **nie ma ani jednego kafla wody**. Rzeka jest przecięta na wylot,
a przerwę przykrywa piasek i droga.

To jest różnica projektowa, nie kosmetyczna:

- **Bród** = woda płynie dalej, tylko jest płytka. Mówi: *„da się przejść"*.
- **Dziura** = rzeka przestaje istnieć na trzy kolumny. Mówi: *„tu rzeki nie ma"*.

Po włączeniu kolizji ta różnica staje się mechaniką: bród to **kafle
przechodnie z wodą na wierzchu**, dziura to po prostu ląd. Jedno jest progiem,
drugie jest brakiem progu.

**Decyzja do podjęcia:** bród (płycizna, woda widoczna, może spowolnienie)
czy **kładka/most** (`swiat.md` §4.3 prosi o most od dawna: *„zwężenie,
rozpadające się barierki"*). Most jest mocniejszy fabularnie i droższy
w kaflach; bród jest tańszy i lepiej pasuje do wsi, która nie ma pieniędzy na
most. **Rekomendacja: bród teraz, most jako późniejsza inwestycja wsi** —
wtedy postawienie mostu może być zadaniem.

### 2.3 Kierunek przepływu — rekomendacja: **ze WSCHODU na ZACHÓD**

Rzeka musi płynąć skądś dokądś, bo inaczej jest dekoracją. Trzy możliwe
historie i dlaczego wybieram tę:

**⚠ Świat nie ma gór i moim zdaniem nie powinien ich dostać w tej sesji.**
`swiat.md` nigdzie nie mówi o górach; jego metoda to zostawiać drugą stronę
bez odpowiedzi (pytanie o most kończy się „nikt nie wie"). Wymyślenie pasma
górskiego to decyzja o skali całego świata, nie o mapie lasu. **Rzeka, której
źródło jest po prostu „dalej na wschód, niż ktokolwiek z Zagajów był", jest
zgodna z retoryką, którą ten projekt już stosuje.**

| wariant | fabuła | koszt |
|---|---|---|
| **W → E** (młyn u góry biegu, rzeka odpływa w dzicz) | woda ze wsi ucieka w las | ⚠ **wymaga przebudowy całego profilu szerokości** — dziś rzeka jest szeroka na zachodzie |
| **✅ E → W** (źródło w głębi lasu, woda idzie do wsi) | **wieś pije to, co wypływa z miejsca, którego się boi** | ⚠ **żaden** — dzisiejsza geometria już to spełnia |
| brak kierunku (dziś) | rzeka jako ozdoba | — |

**Rozstrzygające jest to, że argument fabularny i argument kosztowy wskazują
to samo.** Rzeka rozszerza się w dół biegu; dzisiejsza rzeka ma **2–5 kafli na
wschodzie i 6–9 na zachodzie**. To jest dokładnie profil rzeki płynącej
E → W. Nie trzeba jej przebudowywać — trzeba ją **domknąć i wygładzić**, żeby
ten profil był monotoniczny zamiast falować (dziś: 6 → 9 → 4 → 3 → 1 → 5 → 7
→ 2 → 5).

Zysk fabularny jest przy tym duży i darmowy: **rzeka staje się drugą strzałką
wskazującą na wschód**, obok pytania o most i obok traktu, który się urywa
w Gęstwinie. Trzy niezależne rzeczy pokazują w to samo miejsce i **żadna
niczego nie tłumaczy** — czyli dokładnie reguła `swiat.md`.

### 2.4 Młyn — sprawdzone w plikach, nie założone

| fakt | źródło |
|---|---|
| staw młyński: **x 0–7, y 82–98** w mapie wsi, 128 kafli | zmierzone w `village-zagaje.tmj` |
| dotyka **zachodniej** krawędzi wsi, kończy się **1 kafel przed** południową | zmierzone |
| brama: wieś (51,98) ↔ las (41,1) | `portale.py` + oba `.tmj` |
| ⇒ oś: **wieś x51 = las x41**, więc **wieś x0 = las x −10** | wyliczone |
| ⇒ młyn leżałby w układzie lasu na **x −8…−1, tuż za zachodnią krawędzią, na północy** | wyliczone |

Czyli: **młyn stoi dokładnie tam, gdzie powinien stać przy przepływie E → W** —
za zachodnią krawędzią lasu, po stronie wsi, w dole biegu.

⚠ **I nie trzeba nic z tym robić.** `wioska_plan.md` §4 rozstrzygnął, że młyn
ma **własny lokalny staw i jaz**, nie rzekę ciągnącą się przez mapy —
*„prościej w kaflach, i tak żadna z map nie widzi drugiej"*. Ta decyzja
zostaje. Rzeka wychodzi zachodnią krawędzią lasu i **fabuła mówi**, że dalej
skręca do Zagajów pod koło Miłosza. Zero kafli, zero kodu, zero rozciągania
map na siebie.

**⚠ Nie rekomenduję powiększania mapy na zachód**, żeby „domknąć" młyn —
oznaczałoby to rysowanie młyna dwa razy, na dwóch mapach, czyli dokładnie ten
błąd, przed którym ostrzega `src/world/CLAUDE.md` przy portalach.

### 2.5 Lewy górny fragment rzeki — tak, wymaga przebudowy

Autor pytał o niego wprost. Pomiar potwierdza:

- **Najszerszy punkt CAŁEJ rzeki, 9 kafli, leży przy x 12–18** — czyli
  w miejscu, gdzie nikt nie chodzi i gdzie do najbliższego stworzenia jest
  **1250 px** (największa pustka na mapie).
- Brzeg jest tam poszarpany i blobowaty, bo pochodzi z blob-47 bez ręcznej
  poprawki.
- Zero brzegu: na całą rzekę przypadają **22 kafle piasku** i wszystkie leżą
  przy brodzie.

**Co z tym zrobić — i to jest zamiana wady na zaletę:** przy przepływie E → W
to jest **dół biegu**, więc rzeka MA prawo być tam najszersza i najwolniejsza.
Wystarczy dopowiedzieć dlaczego: **rozlewisko, olszyna, trzcina, wolna woda.**
Martwa ćwiartka nad nim przestaje być pustką, bo dostaje mokry brzeg pod sobą
i **wyręb** nad sobą (§6.1).

⚠ Ale szerokość musi być **monotoniczna**. Dziś zaraz na wschód od bulwy
(x 24–39) rzeka spada do 4 → 3 → 1 kafla. Rzeka nie zwęża się czterokrotnie
w dół biegu. To trzeba wygładzić.

---

## 3. Progresja zagrożenia — pomiar, który rozstrzyga

Odległość od bramy północnej (jedyne powtarzalne wejście) vs HP przeciwnika:

```
   963 px  = 1,2 kadru   królik        30 HP
  1172 px  = 1,5         DZIK          95 HP
  1420 px  = 1,8         NIEDŹWIEDŹ   130 HP
  1486 px  = 1,9         wilk          55 HP
  1657 px  = 2,1         sieciarz      42 HP
  1890 px  = 2,4         SZARY        190 HP
  2015 px  = 2,6         skoczek       46 HP

  korelacja HP ↔ dystans od bramy:  r = 0,23
  korelacja HP ↔ dystans od startu: r = 0,38
```

⚠ **Cały roster — od 30 HP do 190 HP — mieści się w pasie od 1,2 do 2,6
szerokości kadru telefonu.** Pełna rozpiętość trudności gry zajmuje **1,4
szerokości ekranu głębokości.** Niedźwiedź (130 HP) jest bliżej bramy niż
zwykły wilk. **r = 0,23 znaczy: rozstawienie jest praktycznie losowe względem
zagrożenia.**

To jest liczbowa odpowiedź na pytanie „czy obecna mapa pozwala na naturalną
progresję zagrożenia": **nie pozwala, bo nie ma w niej głębokości.** I to jest
argument niezależny od estetyki: nawet gdyby wszystko inne było idealne, nie
ma dokąd rozłożyć siedmiu poziomów groźby na 1,4 ekranu.

---

## 4. Myśliwy i niedźwiedź

### 4.1 Myśliwy zostaje na skraju — i to jest rozstrzygnięte, nie otwarte

Pytanie „w głębi lasu czy na skraju" **ma już odpowiedź autora z 2026-08-17**
(`swiat.md`: *„ODWOŁANE decyzją autora: zostaje w lesie"*, z uzasadnieniem —
suszarnie, wędzarnia, ognisko, których w obejściu nie postawi, plus zmierzone
i asercjonowane odległości do ogniska).

Pomiar potwierdza, że pozycja jest projektowo poprawna dla roli „pierwszy
kontakt z dziczą": **812 px od bramy = 1,05 szerokości kadru.** Jeden ekran
od wsi, po stronie lasu, przed rzeką. Dokładnie próg.

**⚠ Nie zgadza się jednak DOJŚCIE, i to jest realna wada.** Odnoga biegnie na
wysokości y = 8 od drogi (x 40) do chaty (x 66) — **26 kafli = 832 px**, przy
kadrze ±386 px. Czyli **stojąc na rozjeździe, gracz nie widzi chaty** i musi
przejść dwa ekrany ślepą odnogą w wierze, że coś tam jest.

To naprawia jeden kafel: **drogowskaz na rozjeździe.** Arkusz `znaki.png` jest
wpięty i ma 16 kafli, z których **używany jest jeden**. Najtańsza poprawka
w całym dokumencie.

### 4.2 Niedźwiedź — nie, to nie jest logiczne dla świata

**Zmierzone: 614 px od Myśliwego = 0,80 szerokości kadru telefonu.**

Czyli 130-kilowy niedźwiedź mieszka **mniej niż jeden ekran** od chaty
człowieka, którego zawód polega na pilnowaniu skraju lasu, który uczy gracza
tropić i który martwi się wilkiem sto razy dalej. Ta scena nie broni się
w żadnym czytaniu:

- gdyby niedźwiedź tam był, Myśliwy dawno by się nim zajął albo się wyniósł;
- gdyby Myśliwy nie dał rady, ostrzegałby o niedźwiedziu, a nie o Szarym;
- gracz, który znajdzie niedźwiedzia sam, dowiaduje się, że Myśliwy jest ślepy.

⚠ **Asercja `niedzw-hub > 400` jest za słaba i to jest usterka asercji, nie
tylko rozstawienia.** 400 px to pół ekranu. Próg dla „osobne spotkanie, nie
sąsiad huba" powinien być rzędu **trzech szerokości kadru (≈ 2300 px)**.

**Decyzja: niedźwiedź schodzi do starej puszczy** (§5, pasmo P6). Tam jest
najgroźniejszy i tam pilnuje czegoś (ruin, barłogu, źródła rzeki), zamiast
pilnować niczego obok sklepu.

---

## 5. Struktura docelowa — sześć pasm i jedna anomalia

Schemat: `docs/img/las_uklad_docelowy.png`.

⚠ **Kształt jest LITERĄ „L", nie linią.** Gracz wchodzi od północy (brama
stoi na x 41 i nie da się jej ruszyć bez ruszania wsi), więc pierwszy ruch
jest zawsze na południe. Progresja skręca na wschód dopiero za rzeką. To nie
jest kompromis — to jest dobre: **moment skrętu jest momentem, w którym droga
przestaje prowadzić do wsi i zaczyna prowadzić w las.**

### P1 · SKRAJ — y 0–16 (istniejące)

| | |
|---|---|
| **klimat** | jasno, szerokie prześwity, brzoza i buk, ślady ludzi |
| **teren** | droga, odnoga do Myśliwego, wyręb na zachodzie |
| **stworzenia** | ptaki, **sarna przy drodze**, króliki na skraju |
| **zagrożenie** | **ZERO.** Nic tu nie zabija |
| **człowiek** | wyręb + drwale (zachód), obejście Myśliwego (wschód), drogowskaz na rozjeździe |
| **rozbudowa** | tablica zleceń u Myśliwego; drwale jako dawcy zadań; kapliczka przy drodze |

⚠ **Zerowe zagrożenie jest decyzją, nie luką.** To jedyne pasmo, przez które
gracz przechodzi ZA KAŻDYM RAZEM, w obie strony, przez całą grę. Pasmo, przez
które przechodzi się dwieście razy, nie może mieć w sobie walki.

### P2 · RZEKA — y 16–26, cała szerokość (istniejące)

| | |
|---|---|
| **klimat** | próg. Woda płynie z głębi lasu ku wsi |
| **teren** | rzeka 2–9 kafli, **szersza ku zachodowi**; brzegi: piasek, trzcina, olcha; bród na x 38–45 |
| **stworzenia** | sarny przy wodopoju (**podejście po osi POZIOMEJ**), lis węszący brzegiem, ptaki wodne, **kruki** |
| **zagrożenie** | **ZERO.** Próg ma być cichy — groźnie robi się po drugiej stronie |
| **człowiek** | bród; później most jako inwestycja wsi |
| **rozbudowa** | wierzby, zastawka na ryby, rozlewisko na zachodzie |

⚠ **Bez kolizji to pasmo nie istnieje.** Rzeka bez kolizji jest kolorem.

### P3 · LAS WŁAŚCIWY — y 26–52, x 15–65 (istniejące)

| | |
|---|---|
| **klimat** | znany, roboczy, twój. Dąb i buk, **2–3 prawdziwe polany** |
| **teren** | koniec utrzymywanej drogi; skręt na wschód |
| **stworzenia** | króliki (na polanach), lis, **borsuk** |
| **zagrożenie** | niskie. Samotny wilk na zachodnim skraju jako ostrzeżenie |
| **człowiek** | mielerz, ostatnie znaki ciosane na drzewach |
| **rozbudowa** | grunt pod zadania Myśliwego |

### P3b · BÓR WILKÓW — x 0–22, y 36–59 ⚠ ANOMALIA, nie stopień progresji

| | |
|---|---|
| **klimat** | najciemniej i najgęściej na mapie (70–83 % zwarcia) |
| **stworzenia** | wataha ×3 + Szary — **pozycje bez zmian** |
| **zagrożenie** | wysokie, **na złej głębokości i to jest sens** |

⚠ **To jest najważniejsza decyzja projektowa w całym dokumencie.**

Progresja mówi: wataha = poziom czwarty, czyli głęboko. Mapa mówi: wataha
stoi 1,9 kadru od bramy, blisko wsi. `swiat.md` mówi: *„Wilk zostaje w SW
rogu. Leży idealnie."* Wygląda to na sprzeczność.

**Nie jest.** Kręgosłup fabuły brzmi: *coś w głębi lasu wypchnęło wilka pod
wioskę.* Czyli **wataha na złej głębokości JEST fabułą.** Gdyby stała tam,
gdzie „powinna", nie byłoby o czym opowiadać.

Żeby to zadziałało, gracz musi najpierw poznać normę, a potem zobaczyć jej
złamanie. Robi się to **bez dodawania ani jednego stworzenia**:

1. **Bór wilków dostaje ślady ŚWIEŻEGO przyjścia** — brak wydeptanych ścieżek,
   nora rozkopana pod wykrotem, świeża padlina. Nie wygląda jak dom.
2. **W starej puszczy (P6) stoi PUSTY, STARY BARŁÓG** — wygryziony w korzeniach,
   kości obrośnięte mchem, ścieżki zarosłe. **Wygląda jak dom, którego nikt nie
   pilnuje.**

Gracz, który dojdzie do P6, zrozumie bez jednego słowa tekstu, skąd przyszły
wilki. **Koszt: dekoracje. Zero nowych mobów, zero kodu.**

⚠ Konsekwencja: **Szary zostaje 2,4 kadru od bramy, czyli za blisko jak na
190 HP.** To jest świadomy wyjątek od progresji, a nie jej złamanie — bo bór
leży **poza osią progresji** (oś idzie na południe, potem na wschód; bór jest
na zachód). Gracz idący ścieżką nigdy tam nie trafia przypadkiem, a Myśliwy
ostrzega go z imienia. **Bramkowanie ostrzeżeniem zamiast dystansem** jest
poprawnym narzędziem i już działa.

### P4 · OLSZYNA / MOKRADŁA — x 52–78, y 26–42 (istniejące, do zbudowania)

| | |
|---|---|
| **klimat** | mokro, grząsko, ciemna ziemia, olcha i świerk |
| **teren** | rozlewiska bez odpływu, kałuże, przewrócone pnie |
| **stworzenia** | **dziki** — wreszcie we własnym siedlisku |
| **zagrożenie** | średnie |
| **rozbudowa** | babrzysko, tropy, zerwany płot pułapki |

⚠ **Dziki się NIE PRZESUWAJĄ.** Dzik #1 stoi już na skraju tego obszaru
(kafel 62,34). **Buduje się teren wokół nich.**

### P5 · GŁĘBOKI LAS — x 78–112, y 26–58 (część istniejąca, część nowa)

| | |
|---|---|
| **klimat** | świerk zamyka się nad głową, brzoza znika, runo gęstnieje, linie widzenia spadają |
| **teren** | trakt przestaje być utrzymywany |
| **stworzenia** | **ostatni dzik = linia ubytku** (§6.3), za nią sieciarze |
| **zagrożenie** | wysokie |
| **człowiek** | **obóz bandytów** — dokładnie tam, gdzie kończy się utrzymywany trakt |
| **rozbudowa** | bandyci jako pierwszy ludzki przeciwnik; łuk (§6.2) |

### P6 · STARA PUSZCZA — x 112–140, cała wysokość (NOWA)

| | |
|---|---|
| **klimat** | najstarszy, najciemniejszy las. Ogromne świerki i graby, **runo znika, bo korona go dusi** |
| **teren** | zwarcie ≥ 75 % (poziom Gęstwiny), źródło rzeki na wschodniej krawędzi |
| **stworzenia** | **niedźwiedź**, **żubr**, skoczki; **ani jednego małego zwierzęcia** |
| **zagrożenie** | najwyższe |
| **człowiek** | **ruiny** starsze niż Zagaje; **pusty barłóg**; brama do Gęstwiny |
| **rozbudowa** | to jest przedsionek wszystkiego, co przyjdzie później |

⚠ **Cisza jest tu treścią.** `bestiariusz_audyt.md` §3 nazwał brak fauny
w Gęstwinie „największą pojedynczą szansą ekosystemową w projekcie" —
ale zauważył, że działa **przypadkiem**. Tu ma działać na skutek: gracz
przechodzi przez linię ubytku (P5) i **słyszy, że ptaki się skończyły**.

---

## 6. Fauna

### 6.1 Progresja gatunków po pasmach

| poziom | gatunki | pasmo | co gracz się uczy |
|---|---|---|---|
| **życie** | ptak, sarna, królik | P1, P2 | las jest zamieszkany i nie jest listą celów |
| **małe zagrożenie** | lis, **borsuk** | P2, P3 | nie wszystko trzeba zabijać |
| **ryzyko** | dzik, samotny wilk | P3, P4 | pojedyncze spotkanie może pójść źle |
| **terytorium** | wataha | ~~P5~~ **P3b, ANOMALIA** | to nie jest przeciwnik, to jest miejsce |
| **najwyższe** | niedźwiedź, **żubr** | P6 | są rzeczy większe od ciebie |
| **skażone** | sieciarz, skoczek | P5, P6 | las przestaje być lasem |

### 6.2 Nowe gatunki — cztery, każdy za nową sytuację

⚠ **Każdy z nich musi przejść ten sam test: jaką sytuację wnosi, której nie ma?**
Odrzucone są niżej, z powodami.

#### 🐦 KRUK — sygnał, nie przeciwnik  ⭐ najtańszy zwrot w dokumencie

- **Sytuacja:** **pierwszy kanał informacji ze świata do gracza.** Kruki
  krążą nad padliną i nad miejscem niedawnej walki. Widzisz ptaki nad
  drzewami — wiesz, że coś tam leży, **zanim tam dojdziesz**.
- **Dlaczego to jest duże:** `bestiariusz_audyt.md` §6 diagnozuje, że
  *„wszystko, co żyje, dotyczy gracza"*. Kruk jest pierwszą rzeczą, która
  dotyczy **czegoś innego**, a gracz to tylko widzi.
- **Koszt:** klasa `Bird` istnieje i **nie ma `update()`** — krąży tweenem.
  Kruk to `Bird` z innym arkuszem, po okręgu, nad punktem.
- **Zero walki, zero XP, zero wpływu na przestrzeloną pulę.**

#### 🦡 BORSUK — pierwsze zwierzę, które nie ucieka i nie goni

- **Sytuacja:** **stoi przy norze i nie odpuszcza.** Nie ma agro po dystansie
  — jest groźny wyłącznie, jeśli podejdziesz do JEGO miejsca.
- **Dlaczego:** każdy dzisiejszy przeciwnik albo idzie do gracza, albo od
  niego. Borsuk jest pierwszym, dla którego odpowiedzią jest **obejść**.
  Dokładnie ta lekcja, którą niesie Myśliwy mijający jelenia.
- **Koszt:** to jest `Rabbit` z ucieczką zamienioną na „trzymaj pozycję" —
  najbliższy istniejący archetyp.

#### 🐂 ŻUBR — największy, opancerzony, i całkowicie bezpieczny

- **Sytuacja:** **jedyne stworzenie, które jest naraz maksymalnie groźne
  i całkowicie nieszkodliwe — zależnie od ciebie.** Neutralny do
  sprowokowania; sprowokowany jest najcięższą walką w lesie.
- **Dlaczego to jest mechanicznie ważne:** `bestiariusz_audyt.md` §2.2
  zmierzył, że **pancerz ma 1 z 7 wrogów**, więc cała oś *typ obrażeń ×
  materiał pancerza* — własny plik `Protection.ts`, pierścień w HUD, pełny
  dokument `typy_obrazen.md` — jest egzekwowana przez jednego przeciwnika.
  Żubr to gruba skóra o wysokich punktach: **drugi w grze prawdziwy test
  tego systemu**, i to taki, którego gracz podejmuje dobrowolnie.
- **Fabularnie:** żubr jest zwierzęciem starej puszczy. Gdzie stoi żubr, tam
  las nie był tknięty.
- ⚠ **Uwaga o zakresie:** szarża żubra byłaby naturalnym miejscem na
  **kontrolę** (0 z 7 wrogów ją ma). **To jest decyzja sesji o walce, nie
  o level designie** — zgłaszam, nie rozstrzygam.

#### 🏹 BANDYCI — nie zwierzę, i o to chodzi

- **Sytuacja:** **pierwszy przeciwnik, który wybrał bycie przeciwnikiem.**
  Zwierzę broni terytorium albo jest głodne. Człowiek jest tam dla ciebie.
- **Dlaczego mechanicznie:** **dystans testuje 1 z 7 wrogów** (tylko
  sieciarz). Łucznik-bandyta jest drugim dystansowym i **nie wymaga
  wymyślania fikcji** — człowiek ma łuk, bo ma ręce.
- **Gdzie:** P5, przy końcu utrzymywanego traktu. Bandyta potrzebuje drogi,
  którą można obrabować, więc **istnienie bandytów wymaga, żeby trakt
  gdzieś prowadził** — co jest dodatkowym argumentem za skrętem na wschód.
- ⚠ **Ludzki przeciwnik to zmiana tonu całej gry.** Zgłaszam jako możliwość
  wynikającą z układu, a nie jako rekomendację do wykonania.

#### Odrzucone i dlaczego

| gatunek | powód odrzucenia |
|---|---|
| **Ryś** | Byłby najlepszym z nowych — atak z zasadzki, kara za nieuważne podejście. ⚠ **Wymaga linii wzroku i zwrotu, których AI nie ma** (`bestiariusz_audyt.md` §2.3: agro to czysty dystans). **Właściwa odpowiedź, gdy powstanie linia wzroku** — nie wcześniej, bo bez niej ryś jest wilkiem z inną grafiką |
| **Łoś** | Powiela sarnę (duże, płochliwe) i żubra (wielkie, neutralne). Nowa sylwetka, zero nowej sytuacji |
| **Żmija** | Jad jest już tożsamością skoczka. Druga kumulacja jadu rozmywa pierwszą |
| **Wilk drugiej watahy** | Dokłada do przestrzelonej puli XP i **osłabia anomalię z §5**: druga wataha czyni pierwszą normalną |

### 6.3 ⚠ Dzik ↔ pająk — to nie jest granica biomów, to jest SUKCESJA

Autor pyta o cztery warianty. **Odpowiedź brzmi: żaden z nich, a piąty.**

Stan: dziki (2000,1104) i (1872,1488), sieciarze na południowej krawędzi
mapy; najmniejszy dystans dzik↔pająk = 385 px. Asercja wymaga > 340 i została
**odwrócona świadomie 2026-08-13** („teraz mają być dwa osobne spotkania"),
co jest sprzeczne z `swiat.md` („dwa przy dziku"). Ta sprzeczność nadal czeka
na rozstrzygnięcie — patrz audyt §3.4.

Ale samo pytanie „jakie siedlisko mają pająki" jest źle postawione:

⚠ **Pająki nie są fauną i nie należy ich stawiać po siedliskach.** `swiat.md`
mówi, że mają sprawiać wrażenie, że *„wschodnia gęstwina należy już do kogoś
innego"*. Zwierzę zajmuje niszę. **To zajmuje teren.**

**Właściwa reguła: gdzie są pająki, tam nie ma zwykłych zwierząt.** Nie
konkurencja o pokarm — **ubytek**. To jest jedyne czytanie, które niesie
fabułę, i jednocześnie odpowiada na wszystkie cztery warianty autora naraz:

- osobne siedliska? **tak, ale nie równolegle — sekwencyjnie;**
- granica biomów? **nie, granica sukcesji;**
- pająki = skażony fragment? **tak, i to jest ich cała treść;**
- jeden wypiera drugi? **tak, i to jest widoczne bez jednego słowa.**

**LINIA UBYTKU — konkretna reguła do wykonania:**

```
   x < 95      normalna gęstość fauny, dziki, króliki, ptaki
   x = 95      ⚠ OSTATNI DZIK — najgłębszy punkt, w którym zwykły las jeszcze działa
   x > 95      zero fauny neutralnej, zero ptaków; sieciarze, potem skoczki
```

**Dzik jest ostatni, pająk pierwszy.** Nie sąsiadują przypadkiem — **stoją po
dwóch stronach granicy i to jest ich relacja.** Asercja `dzik-pajak > 340`
jest wtedy spełniona automatycznie i przestaje być arbitralną liczbą: staje
się zapisem tego, że są to dwa różne światy, a nie dwa spotkania.

⚠ Reguła jest też **testowalna**, więc może zostać asercją: *„na wschód od
linii ubytku nie stoi ani jeden `bird`/`deer`/`fox`/`rabbit`"*. Asercja, która
potrafi zaświecić na czerwono — zgodnie z niezmiennikiem projektu.

### 6.4 Terytoria — jak mają wyglądać

Trzy poziomy, malejąco:

1. **Terytorium (wataha, niedźwiedź, żubr):** ma **granicę**, którą widać
   przed przekroczeniem — ściana świerku, wykrot, kości, brak zwierzyny.
   Ma **środek** (barłóg, legowisko). Gracz ma wiedzieć, że wszedł.
2. **Rewir (króliki, sarny, lis):** ma **siedlisko**, nie granicę. Króliki są
   tam, gdzie polany; sarny tam, gdzie woda i skraj; lis tam, gdzie jest co
   węszyć. **Wzorzec już istnieje na tej mapie — to sposób rozstawienia ziół**
   (krwawnik: 0 % zadrzewienia na ośmiu stanowiskach).
3. **Obecność (ptaki, kruki):** brak miejsca, ale **reagują na zdarzenia**.

⚠ **Zasada nadrzędna: terytorium poznaje się po tym, czego w nim NIE MA.**
Bór wilków rozpoznaje się po braku zwierzyny, stara puszcza po braku runa
i ptaków, strefa pająków po braku wszystkiego. **To jest tańsze niż
stawianie czegokolwiek i czyta się mocniej.**

---

## 7. Skala — A czy B, i w którą stronę

### 7.1 Rachunek pojemności, przeprowadzony od nowa dla SZEŚCIU PASM

Audyt liczył strefy ekologiczne (7 sztuk, zmieszczone). Tu liczę **pasma
progresji**, a to inna jednostka: pasmo musi mieć głębokość **na osi ruchu**,
bo gracz ma je *przejść*, nie *obejrzeć*.

Kadr to **24 × 11 kafli**. Pasmo płytsze niż ~25 kafli na osi ruchu przecina
się w mniej niż półtora kadru — nie zdąży się stać miejscem. Przyjmuję
**25–35 kafli głębokości na pasmo.**

Oś ruchu po skręcie jest **pozioma**, więc liczy się szerokość na wschód od
drogi (x = 41):

| | dostępne na wschód od drogi | pasm po 30 kafli |
|---|---|---|
| **dziś, 100 szer.** | 59 kafli | **2** |
| **140 szer.** | 99 kafli | **3** |

Potrzebne pasma na wschód od drogi: **las właściwy → głęboki las → stara
puszcza = 3.** Plus warstwa ludzka (obóz, ruiny), która potrzebuje własnego
miejsca, a nie doklejenia do istniejących.

⚠ **Dzisiejsza mapa mieści dwa z trzech. To jest brakujące pasmo, nie
brakująca powierzchnia** — i dlatego rekomendacja z audytu (§10.6) się
odwraca dla tego celu.

### 7.2 Dlaczego WYŁĄCZNIE na wschód

| kierunek | ocena |
|---|---|
| **wschód** ✅ | rośnie oś, którą telefon w ogóle pokazuje (kadr 2,17× szerszy niż wyższy); brama do Gęstwiny przestaje być wciśnięta w krawędź; ucieczka sarny działa czytelnie w poziomie (`fauna_faza1.md` §3.3) |
| **południe** ❌ | mapa jest już 5,4 kadru wysoka przy 4,1 szerokim — czyli **odwrotnie niż powinna**. Wzrost w pionie pogłębia najgorszą oś |
| **zachód** ❌ | tam jest wieś i młyn; domykanie hydrologii przez mapę oznacza rysowanie młyna dwa razy (§2.4) |
| **północ** ❌ | tam jest brama do Zagajów |

### 7.3 Rekomendacja: **100 × 60 → 140 × 60**

| | dziś | docelowo |
|---|---|---|
| kafle | 6 000 | **8 400** (+40 %) |
| piksele | 3200 × 1920 | **4480 × 1920** |
| ekrany | 4,1 × 5,4 | **5,8 × 5,4** |
| przejście E–W | 21 s / 13 s | **30 s / 19 s** |
| vs Zagaje (10 000 kafli) | 60 % wsi | **84 % wsi** |

⚠ **Najważniejsza własność tego wariantu: żaden istniejący obiekt ani kafel
nie zmienia współrzędnych.** Wzrost jest czystym dopisaniem kolumn x 100–140
po prawej. Kolizji z niczym nie ma, bo tam dziś nic nie stoi poza bramą do
Gęstwiny.

**Co trzeba ruszyć — dokładnie trzy rzeczy:**

1. `tools/portale.py` → `BRAMA_GESTWINY`, przesunięcie o +40 kafli;
2. `thicket-gestwina.tmj` → `spawnX` powrotu (dziś 3056 → 4336);
3. obie kopie `forrest.tmj` → resize w Tiled, kotwiczony do lewej krawędzi.

⚠ Reguła `src/world/CLAUDE.md`: **bramę rusza się w `portale.py`, na obu
mapach naraz**, nigdy przez dostawienie drugiego obiektu.

### 7.4 Czego NIE robić przy powiększaniu

- ⚠ **Nie dokładać wrogów proporcjonalnie do powierzchni.** Pula XP jest
  przestrzelona i `odlozone.md` ma na to jawną barierkę. Nowe pasma dostają
  **niedźwiedzia przesuniętego z NE**, skoczki przesunięte, plus co najwyżej
  żubra. **Bilans mobów: +1, nie +40 %.**
- ⚠ **Nie uruchamiać `tools/build_mapa.py --zapisz`.** `SZER, WYS = 100, 60`
  i tak nie zna niczego z Tiled — nadpisanie skasowałaby całą pracę.
- ⚠ **Nie powiększać przed kolizją.** Nowy teren bez granic to nowy przejazd.

---

## 8. Warstwa ludzka — dlaczego las jej potrzebuje

Autor wymienił: wyręby, drwale, bandyci, obozy, ruiny. Wszystkie mieszczą się
w jednej myśli: **las bez ludzi nie ma z kim być lasem.**

| element | pasmo | co wnosi | koszt |
|---|---|---|---|
| **Wyręb + drwale** | P1, zachód | martwa ćwiartka dostaje POWÓD, żeby być pusta: wieś stąd bierze drewno, więc zwierzyna się wyniosła. **Pustka staje się treścią** | kafle `ziemia` + istniejący `pniak` (użyty raz na mapie) |
| **Drogowskaz na rozjeździe** | P1 | odnoga do Myśliwego przestaje być ślepą wiarą | **1 kafel** z `znaki.png` (15 nieużywanych) |
| **Obejście Myśliwego** | P1 | `mapy.md` obiecuje „trader's glade" — dziś chata stoi w gołej trawie | ~120 kafli + płot |
| **Mielerz** | P3 | ostatni ślad wsi przed dziczą | ~30 kafli |
| **Obóz bandytów** | P5 | pierwszy przeciwnik, który WYBRAŁ; pierwszy łucznik po sieciarzu | nowy przeciwnik — osobna sesja |
| **Ruiny** | P6 | coś, co było przed Zagajami. ⚠ **Nie tłumaczą niczego** — reguła Gęstwiny obowiązuje | kafle `Buildings` + `kamienie` |
| **Pusty barłóg** | P6 | wyjaśnia watahę z P3b bez jednego słowa (§5) | dekoracja |

⚠ **Kolejność ma znaczenie i jest odwrotna do intuicji.** Ślady ludzi są
NAJGĘSTSZE przy wsi i **znikają w głąb**. Ostatni znak ciosany na drzewie,
ostatni mielerz, ostatni kilometr utrzymanego traktu — a potem bandyci, którzy
są tam właśnie dlatego, że nikogo już nie ma. **Znikanie człowieka jest tym
samym gradientem, co znikanie zwierząt** (§6.3), tylko przesuniętym o pasmo.
Dwa gradienty, jeden kierunek: **to jest cała reżyseria tego lasu.**

---

## 9. Odpowiedzi na pięć pytań

### 1. Czy obecny las jest dobrym fundamentem, czy wymaga większej przebudowy?

**Fundament jest dobry; powierzchnia jest prototypem.**

Zostaje bez zmian: rzeka (topologicznie poprawna, z profilem szerokości już
pasującym do przepływu E → W), jedno przejście, droga i brama północna,
Myśliwy na skraju, wataha w SW, rewir królików, siedliskowe rozstawienie ziół,
dziesięć asercji.

Do przebudowy: podłoże (szum), rozkład drzew (brak koron i polan), gradient
wschodni (odwrócony), bród (dziura zamiast płycizny), rozstawienie zagrożeń
(r = 0,23).

**Do dobudowania: jedno pasmo na wschodzie i cała warstwa ludzka.**

To nie jest „przebudować od zera". To jest **dokończyć zaczęte i dopisać
trzecie pasmo.**

### 2. Czy zwiększać mapę?

**Tak — dla TEGO celu.** Nie dlatego, że jest za mała na siedem stref
ekologicznych (nie jest, mieści dziesięć), tylko dlatego, że **na wschód od
drogi mieści dwa pasma progresji, a potrzebne są trzy.**

### 3. Jeśli tak, w którym kierunku i dlaczego?

**Wyłącznie na wschód: 100 × 60 → 140 × 60.**

Trzy powody, w kolejności wagi:
1. **To jedyny kierunek, w którym jest miejsce** — północ to brama do wsi,
   zachód to wieś i młyn, południe to najgorsza oś telefonu.
2. **Rośnie oś, którą telefon pokazuje** (kadr 2,17× szerszy niż wyższy;
   mapa jest dziś wyższa niż szersza w ekranach, czyli odwrotnie niż powinna).
3. **Nic nie zmienia współrzędnych** — czysty dopisek kolumn. Koszt to trzy
   pliki i jedna brama.

### 4. Jak wygląda docelowa progresja gracza przez las?

Kształt **litery „L"** — na południe, potem na wschód:

```
  Zagaje
    ↓          P1 SKRAJ            0 zagrożenia · ptaki, sarna · wyręb, Myśliwy
    ↓          P2 RZEKA            0 zagrożenia · próg · sarna u wodopoju, kruki
    ↓          P3 LAS WŁAŚCIWY     niskie · króliki, lis, borsuk · polany
    ↘   ⟵ P3b BÓR WILKÓW (na zachód, POZA osią — anomalia, bramkowana ostrzeżeniem)
      →        P4 OLSZYNA          średnie · dziki we własnym mokradle
      →        P5 GŁĘBOKI LAS      wysokie · LINIA UBYTKU · sieciarze · bandyci
      →        P6 STARA PUSZCZA    najwyższe · niedźwiedź, żubr · ruiny, barłóg
                                   ↓
                                Gęstwina
```

Dwa gradienty biegną w tę samą stronę i **oba działają przez ubytek, nie przez
dodawanie**: zwierząt ubywa na wschód od linii ubytku, ludzi ubywa od wsi.
Gracz idzie w kierunku, w którym **wszystkiego jest coraz mniej** — i to jest
to, co ma robić strach.

### 5. Jak powinny wyglądać terytoria zwierząt?

Trzy poziomy: **terytorium** ma granicę i środek (wataha, niedźwiedź, żubr);
**rewir** ma siedlisko, nie granicę (króliki, sarny, lis, borsuk);
**obecność** ma zdarzenia, nie miejsce (ptaki, kruki).

⚠ I jedna zasada nad nimi: **terytorium poznaje się po tym, czego w nim nie ma.**
Bór wilków — brak zwierzyny. Stara puszcza — brak runa i ptaków. Strefa
pająków — brak wszystkiego. To jest tańsze niż stawianie czegokolwiek
i czyta się mocniej.

---

## 10. Kolejność wykonania (propozycja, nie zlecenie)

> **0. DECYZJE AUTORA** (§11) →
> **1. Kolizja kafli** (bez niej żadne pasmo nie istnieje) →
> **2. Bród i brzegi rzeki** + wygładzenie profilu szerokości →
> **3. Polany w P3 + odwrócenie gradientu wschodniego** →
> **4. Resize 100 → 140 i P6 stara puszcza** →
> **5. Przesunięcia: niedźwiedź, sieciarze, lis z wody, sarna** →
> **6. Warstwa ludzka: wyręb, drogowskaz, podwórze Myśliwego** →
> **7. PLAYTEST RĘKĄ** →
> 8. dopiero potem: kruki, borsuk, żubr, bandyci

⚠ Kolizja idzie pierwsza, bo **zmienia to, jak czyta się każdy kafel
postawiony później**. Malowanie polan przed kolizją to malowanie ścian, przez
które się przechodzi.

⚠ Resize idzie **po** naprawie istniejącego, nie przed — inaczej powiększamy
problem, zamiast go rozwiązać.

---

## 11. Co wymaga DECYZJI AUTORA, zanim cokolwiek ruszy

| # | decyzja | dlaczego nie mogę jej podjąć |
|---|---|---|
| **D-A** | **Powiększenie 100 → 140** | zmienia bramę na dwóch mapach i resetuje warunek powrotu kolizji, jeśli zrobione w złej kolejności |
| **D-B** | **Kierunek rzeki E → W** i status młyna jako „poza mapą" | to jest decyzja o fikcji świata, nie o kaflach; dotyka `swiat.md` |
| **D-C** | **Kolizja kafli** — `odlozone.md` §3, warunek „layout ustabilizowany" | ten dokument twierdzi, że layout jest już wiadomy; potwierdzenie należy do autora |
| **D-D** | **Sieciarze: `swiat.md` „dwa przy dziku" vs asercja `> 340`** | dwie sprzeczne, świadome decyzje o tym samym (audyt §3.4). Moja propozycja „linii ubytku" (§6.3) jest zgodna z asercją, ale **unieważnia zdanie z `swiat.md`** |
| **D-E** | **Bród czy most** | koszt vs fabuła; `swiat.md` §4.3 prosi o most |
| **D-F** | **Nowe gatunki: kruk / borsuk / żubr** | każdy to nowy arkusz i nowa klasa; żubr dotyka też balansu pancerza |
| **D-G** | **Bandyci = ludzki przeciwnik** | zmiana tonu całej gry, nie decyzja level designu |
| **D-H** | **Wataha jako ANOMALIA** (§5, P3b) | najmocniejsza propozycja w dokumencie i jedyna, która przedefiniowuje istniejącą, zamkniętą decyzję (`swiat.md`: „leży idealnie") — **nie przez ruszenie wilków, tylko przez zmianę tego, co ich pozycja znaczy** |

---

## 12. Ryzyka

| # | ryzyko | co je zdejmuje |
|---|---|---|
| R1 | **Powiększenie przed naprawą istniejącego** | kolejność z §10: resize jest krokiem 4, nie 1 |
| R2 | **Dokładanie mobów proporcjonalnie do powierzchni** | §7.4 — bilans +1, nie +40 % |
| R3 | **Uruchomienie `build_mapa.py --zapisz`** | generator zna 100 × 60 i nie zna niczego z Tiled |
| R4 | **Ruszenie wilków „dla progresji"** | §5 P3b — ich pozycja jest fabułą; zmienia się otoczenie, nie pozycja |
| R5 | **Wyjaśnienie ruin albo starej puszczy** | reguła Gęstwiny: *„kto zechce tę mapę rozbudować — niech nie zaczyna od wyjaśnienia"* |
| R6 | **Nowe gatunki jako wypełniacz** | test z §6.2: jaką sytuację wnosi? Ryś odrzucony mimo że najlepszy — bo bez linii wzroku jest wilkiem z inną grafiką |
| R7 | **Przesunięcie łamiące asercje po cichu** | koperta z audytu §3.3; sprawdzać KAŻDE przesunięcie, także niedźwiedzia |
| R8 | **Praca na `assets/forrest.tmj`** zamiast `maps/` | kopie się rozjechały (audyt §1.1) — zsynchronizować przed czymkolwiek |

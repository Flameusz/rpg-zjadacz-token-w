---
typ: HISTORIA
domena: ui
tytul: Ekwipunek, postać i nawigacja panelu — research gier mobilnych
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

> Surowy raport subagenta (2026-10-13). Synteza i decyzje: `docs/ui_mobile_research.md` §8. Zrzuty nie są w repo (scratchpad sesji).

# Ekwipunek, postać i nawigacja panelu — jak to robią RPG na telefon w poziomie

Badanie do przebudowy panelu (decyzja D13). Zrzuty leżą obok tego pliku; każda
teza o konkretnej grze ma adres albo nazwę zrzutu.

## 0. W skrócie

1. **W żadnym z 13 obejrzanych ekranów panelu (ekwipunek, postać, menu)
   pozioma górna listwa nie służy do przełączania głównych działów.** Górna krawędź mieści tytuł lub ścieżkę,
   waluty i ✕. Działy przełącza się z pionowej szyny z boku: z lewej w Genshin
   i Eternium, z prawej w OSRS i w menu HSR. Drugi sposób to rząd zakładek
   u dołu kolumny (Diablo Immortal, Black Desert Mobile, Darkrise, Exiled
   Kingdoms).
2. **W poziomie brakuje wysokości, więc górna listwa jest droższa od bocznej
   szyny.** Listwa o wysokości 64–68 j. zabiera 11–12% wysokości. Szyna
   szerokości ok. 100 j. zabiera 8% szerokości, a przy plecaku na 4 kolumny
   szerokości mamy w nadmiarze.
3. **Tekst mamy o ok. 25–50% mniejszy od rynku.** U konkurencji tekst główny ma
   2,9–4,0% wysokości ekranu, czyli 17–23 j. w naszym układzie. Nasze 11–13 j.
   to 1,9–2,2%. Wynik jest poniżej minimum Apple dla gier (11 pt ≈ 15 j.).
4. **Lalka „anatomiczna” wokół postaci występuje we wszystkich ARPG z próbki**
   (Eternium, Diablo Immortal, BDM, Darkrise, Exiled Kingdoms, Grim Soul).
   Siatka slotów bez sylwetki nie występuje w żadnym z nich. Autor ma rację,
   że sylwetka ze sklepu czyta się lepiej.
5. **Szczegóły przedmiotu jako okienko przykrywające ekran to najczęstszy
   słaby punkt.** Diablo Immortal zasłania nim lalkę, Eternium plecak.
   Genshin trzyma stałą kolumnę szczegółów, co przy szerokim ekranie jest
   lepsze.
6. **Rekomendacja:** układ [lalka-sylwetka | plecak 4 kol. | stała karta
   szczegółów | prawa szyna]. Mieści się w 1257 j. z zapasem. Karta
   szczegółów i plecak to wspólne komponenty ze sklepem. Całego układu nie
   da się wspólnie używać, bo w sklepie lalka musi się zwinąć.

## 1. Metoda i zastrzeżenia

- **Skąd zrzuty.** Google Play (część to reklamy z prawdziwym UI w środku),
  Interface In Game (Genshin, HSR), Game8 (Diablo Immortal; żółtą ramkę
  dorysował Game8), AppGamer (BDM, znak wodny), wiki OSRS. Game UI Database,
  fandom i Reddit blokują pobieranie, więc dla Albion, Undecember, Torchlight
  Infinite, Warspear, Toram, Tarisland, Stardew i Last Day on Earth **nie mam
  zrzutów**; cytuję recenzje albo pomijam.
- **Pomiar tekstu.** Wersalik na powiększonych wycinkach, em = wersalik / 0,7,
  wynik jako % wysokości ekranu, na nasze jednostki: `% × 580`.
- **Przeliczenie jednostek do sprawdzenia.** 580 j. na 1080 px daje
  1 j. = 1,86 px. Przy gęstości Androida 2,625 (420 dpi) to 0,71 dp, wtedy
  48 dp = 68 j., zgodnie z briefem. Przy gęstości 3,0 wychodzi 0,62 dp,
  wtedy 48 dp = **77 j.** Brief miesza obie wartości. Rozstrzyga
  `adb shell wm density` na S21 FE. Fizycznie (ok. 402 ppi) 1 j. ≈ 0,118 mm.

## 2. Przegląd gier

### 2.1 Tabela porównawcza

| gra (zrzut) | nawigacja i wyjście | układ strony ekwipunku (udział szerokości) | lalka | szczegóły przedmiotu |
|---|---|---|---|---|
| **Eternium** (`eternium_inventory_paperdoll.png`) | globalna szyna ikon **z lewej** (6%); druga szyna z prawej (kuźnia, wygląd); waluty i ✕ w prawym górnym rogu | lalka z modelem 3D ok. 33%, plecak po prawej | 2 kolumny po 7 slotów po bokach modelu + broń i tarcza pod nim (16 slotów); pod spodem 3 duże liczby (Damage / Toughness / Recovery) i „Details” | okienko na środku (ok. 37% szer.) przykrywa plecak; zestaw „(3/6)” z progami 2/4/6; akcje na dole karty |
| **Diablo Immortal** (`diablo_immortal_inventory_overview.jpg`, `…_item_detail_popup.jpg`) | brak zakładek u góry; waluty i ✕ nad plecakiem; „Equipment / Cosmetics” pod modelem; kategorie plecaka jako ikony **na dole** po prawej | kolumna 6 slotów pobocznych (5%), model (ok. 33%), blok 2×3 slotów głównych (13%), plecak 6 kol. (37%) | ok. 12 slotów, sylwetka tylko częściowo | karta na całą wysokość (27%) **zasłania model**; nagłówek „EQUIPPED”; przycisk akcji na dole |
| **Genshin Impact** (`genshin_mobile_bag_weapons.png`) | szyna kategorii **z lewej** (7 ikon + kosz, 7,5%); u góry ścieżka „Inventory / Weapons”, waluty, licznik „11/2000” i ✕ | siatka 5 kol. (46%) + **stała kolumna szczegółów** (32%) | brak; zakładanie odbywa się w ekranie postaci | stały panel po prawej; „Details” w prawym dolnym rogu; sortowanie w lewym dolnym |
| **Genshin, wybór broni** (`genshin_mobile_weapon_swap_compare.png`) | ↩ w prawym górnym rogu (ekran podrzędny) | lista pasujących broni z lewej, model z bronią w środku, szczegóły z prawej | — | przełącznik „Compare”; „Switch” i „Enhance” w prawym dolnym rogu, czyli przepływ od slotu |
| **Genshin, postać** (`genshin_mobile_character_attributes.png`) | szyna drużyny z lewej, podmenu tekstowe (Attributes, Weapons…), ✕ w prawym górnym rogu | model w środku, 5 statystyk po prawej, pod nimi „Details” | — | — |
| **Black Desert Mobile** (`blackdesert_mobile_inventory.png`) | „←” i tytuł w lewym górnym rogu, ikona wyjścia w prawym górnym; zakładki (Beauty / My Info / Dye / Options) **na dole po lewej** | statystyki 28%, model 22%, sloty-kółka 14%, plecak 32% | ok. 11 okrągłych slotów w 2 kolumnach obok modelu + rząd kostiumów | w plecaku pomarańczowe „!” na lepszych przedmiotach; waga „501.91/1500 LT” i miejsca „33/100” z „+”; przyciski „Open Chests” i „Auto-Equip” |
| **Darkrise** (`darkrise_character_inventory.png`) | tytuł z lewej, waluty i okrągły ✕ z prawej u góry; **3 szerokie zakładki na dole** (Active skills / Passive skills / Stats) | lalka 47%, plecak 6×4 (47%) ze stronami „2/2” i dwoma przyciskami sortowania | 2×4 sloty po bokach postaci + 2 małe pierścienie; pod spodem poziom, XP i „Equipment 96446” | — |
| **Exiled Kingdoms** (`exiledkingdoms_inventory_character.png`) | przyciski działów (Journal, Skills, Reputation, Crafts) **w lewym dolnym rogu**, duży „Back” **w prawym dolnym** | 3 kolumny: postać i atrybuty (33%), lalka ze szczegółami (33%), plecak 4×5 (31%) | 12 pól ramką wokół postaci | karta pod lalką, „Drop / Equip” pod kartą |
| **Grim Soul** (`grimsoul_inventory_paperdoll.png`, reklama) | — | szybkie sloty z lewej, model w środku, 5 slotów pancerza z prawej, karta przedmiotu z prawej | anatomiczna: hełm, korpus, rękawice, spodnie, buty | karta-pergamin z materiałami „12/15” |
| **OSRS mobile** (`osrs_mobile_inventory_side_panel.png`) | **prawa szyna** 2×7 ikon; panel otwiera się obok szyny, gra toczy się dalej | plecak 4×7 ma 22% szerokości i 54% wysokości | osobna zakładka | — |
| **Lineage 2M** (`lineage2m_stats_equipment_overlay.png`, reklama) | ikony menu w prawym górnym rogu; panel z ✕ | panel statystyk z wykresem radarowym nałożony na żywy świat | sloty-romby w 2 kolumnach po bokach postaci, w świecie | — |
| **Honkai: Star Rail** (`hsr_phone_menu_right_rail.png`) | **prawa wąska szyna** (✕ na górze, wyłączanie na dole), obok siatka ikon menu; zrzut może być z PC, UI jest wspólne | — | — | — |

### 2.2 Co wynika dla każdej gry

- **Eternium (wzorzec autora).** Ekran ma dwie szyny: globalną z lewej
  (zadania, osiągnięcia, poczta) i wewnętrzną z prawej (ekwipunek, kuźnia,
  wygląd). Lalka jest symetryczna i każdy slot pokazuje poziom przedmiotu,
  więc da się ją przeczytać w sekundę. Najmocniejszy element to **3 duże
  liczby podsumowania** zamiast pełnej tabeli statystyk. Najsłabszy to karta
  przedmiotu, która przykrywa plecak: nie widać, co jeszcze można założyć.
  Karta pokazuje zestaw jako „Fury Battlegear Set (3/6)” i wszystkie progi
  (2/4/6), a nieaktywne progi są przygaszone. To gotowy wzór dla naszych
  zestawów (`eternium_inventory_paperdoll.png`).
- **Diablo Immortal.** Wszystkie komórki plecaka są **pionowe (ok. 1:2)**,
  więc długa broń wygląda dobrze bez układania „tetrisa”. Główne sloty mają
  ten sam kształt. Kategorie plecaka są na dole po prawej, w strefie kciuka.
  Wada: karta szczegółów zasłania model i lalkę. Gracze prosili też
  o wskaźnik pełnego plecaka
  ([PCGamesN](https://www.pcgamesn.com/diablo-immortal/improved-UI)).
  Strzałka „lepsze” na przedmiotach bywa myląca
  ([HellHades](https://hellhades.com/?p=28478)). Z opcji tekstu artykuł
  o dostępności wymienia tylko powiększenie czatu do 200%
  ([MobileSyrup](https://mobilesyrup.com/2022/05/28/blizzard-entertainment-diablo-immortal-accessibility-features/)).
- **Genshin.** To najczystszy przepływ od przedmiotu: kategoria → siatka →
  **stały** panel szczegółów → akcja w prawym dolnym rogu. Pojemność
  („Weapons 11/2000”) stoi u góry obok walut. Zakładanie jest **osobnym
  przepływem od slotu** (ekran postaci → Weapons → lista pasujących →
  „Compare” → „Switch”). Szum: na zrzucie 10 z 13 przedmiotów ma znaczek
  „New”.
- **Black Desert Mobile.** To najgęstsza strona: statystyki, model, sloty
  i plecak naraz. Dobre pomysły to waga i miejsca jako paski z „+” oraz
  znaczek „!” na lepszych przedmiotach.
- **Darkrise** to najprostszy i najbardziej czytelny ekran w próbce: dwie
  połówki po ok. 47%, duże komórki (13,5% wysokości), duży tekst i 3 zakładki
  na dole. Dowodzi, że **lalka z grafiką 2D/pixel-art bez modelu 3D
  wystarcza**.
- **Exiled Kingdoms.** Postać, lalka i plecak są na jednym ekranie, a „Back”
  jest dużym przyciskiem w prawym dolnym rogu. To jedyny w próbce precedens
  wyjścia w strefie prawego kciuka. „Equip” leży w tym samym dolnym pasie,
  oddzielone portretem.
- **OSRS.** Jagex świadomie przeniósł wszystkie przyciski paneli (ikony
  zakładek) na **prawą** stronę w dwóch kolumnach, oddzielając panele
  używane w walce od rzadkich. Pisze, że po zwinięciu drugiej kolumny pola
  dotyku są szersze i łatwiej w nie trafić. Wyskakujący panel przeniesiono,
  bo zasłaniał plecak
  ([wiki OSRS, Mobile UI Rework](https://oldschool.runescape.wiki/w/Update:Mobile_UI_Rework_-_Overview_%26_Open_Beta)).
  Komórki (7% wysokości) są jednak za małe jak na standard.
- **Torchlight Infinite (bez zrzutu).** Recenzent krytykuje brak
  przeciągania, wybór slotu pierścienia ręcznie oraz to, że auto-sortowanie
  niewiele daje
  ([itemlevel.net](https://itemlevel.net/torchlight-infinite-review-is-it-really-a-torchlight-game/)).
- **Titan Quest mobile (bez zrzutu)** to port PC z siatką „tetris”. Recenzja
  wskazuje zarządzanie ekwipunkiem jako okresową uciążliwość na dotyku
  ([TouchArcade](https://toucharcade.com/2016/05/20/titan-quest-review/)).
- **Albion Online.** Przy wejściu na urządzenia mobilne studio celowało
  w tablety, a telefonów nie wspierało ze względu na mały ekran (wywiad bez
  daty,
  [MMOGames](https://www.mmogames.com/articles/archives/albion-online-mobile-development-interview)).
  To przestroga przed UI zrobionym pod PC.
- **Wild Rift.** Szybkie kupowanie i polecana ścieżka przedmiotów
  ([ONE Esports](https://www.oneesports.gg/wild-rift/wild-rift-will-have-a-different-item-system-than-league-of-legends))
  podsuwają gotową następną akcję, jak nasze „lepsze niż założone”.
- **Dwa zestawy broni** nie mają precedensu na telefonie w próbce. Wzorzec
  z PC to zakładki „I / II” nad slotami broni z przygaszonym nieaktywnym
  zestawem (Diablo II,
  [Blizzard](https://classic.battle.net/diablo2exp/basics/controls.shtml)).

## 3. Liczby: tekst, komórki, wytyczne

### 3.1 Zmierzone na zrzutach

| gra | tekst główny (em, % wys.) | w naszych j. | komórka plecaka (% wys.) | w naszych j. |
|---|---|---|---|---|
| Genshin | 2,9% | ≈17 | 17,6% (kafel 14,4×17,6) | 83×102 |
| Eternium | 2,9% | ≈17 | slot 8,5%, plecak ok. 10,4% | 49 / 60 |
| Diablo Immortal | 3,1% | ≈18 | 10,7×20,8% (pionowa) | 62×121 |
| Exiled Kingdoms | 3,5% | ≈20 | 11,2% | 65 |
| Darkrise | 3,3–4,0% | 19–23 | 13,5% | 78 |
| BDM | — (zrzut 740 px) | — | ok. 10% | 58 |
| OSRS | — | — | 7,2% | 42 |
| **my** | **1,9–2,2%** | **11–13** | 11,7% | **68** |

**Wniosek.** Komórki mamy w normie (10–14% wysokości). **Tekst jest
odstępstwem.** Rynek nie schodzi z tekstem głównym poniżej ok. 17 j.

### 3.2 Wytyczne platform

| źródło | tekst | cel dotyku |
|---|---|---|
| Apple HIG, gry ([link](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)) | iOS: domyślnie **17 pt**, minimum **11 pt** (≈23 / ≈15 j.) | domyślnie **44×44 pt**, minimum 28×28 pt |
| Android ([link](https://developer.android.com/guide/topics/ui/accessibility/apps)) | kontrast 4,5:1 dla tekstu < 18 sp | **48×48 dp** (większy jest lepszy) |
| Xbox XAG 101 ([link](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101)) | mobile i streaming: 18 px przy 100 DPI, 72 px przy 400 DPI (wysokość od wydłużenia górnego do dolnego). Na S21 FE to ok. 39 j., poziom bardzo ambitny. Skalowanie do 200% | ikony skalują się razem z tekstem |
| Game Accessibility Guidelines ([tekst](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/), [dotyk](https://gameaccessibilityguidelines.com/ensure-interactive-elements-virtual-controls-are-large-and-well-spaced-particularly-on-small-or-touch-screens/)) | 28 px przy 1080p dla TV, jako próg, nie cel | telefon: **0,96 cm** (≈82 j.) |

**Proponowane progi** dla 1257×580: tekst główny **18 j.** (min. 17), opisy
pomocnicze **≥15 j.**, nazwa przedmiotu 20–22 j., tytuły 24 j., liczby na
komórkach ≥14 j. z obrysem. Cel dotyku **≥68 j.** (≥77 j., jeśli gęstość to
3,0), a dla przycisków głównych 76–82 j. Potrzebny jest suwak skali tekstu
(XAG: do 200%).

## 4. Archetypy ekranu ekwipunku na telefon w poziomie

| | archetyp | przykłady | koszt szer. / wys. | mocne | słabe |
|---|---|---|---|---|---|
| **A** | **Lalka wokół postaci + plecak, szczegóły w okienku** | Eternium, Diablo Immortal, Grim Soul, Darkrise | lalka z modelem 33–47%, plecak 37–50%; szczegóły nic nie kosztują, dopóki ich nie otworzysz | stan postaci czyta się w sekundę, sloty są anatomiczne, model pokazuje wygląd | okienko zasłania to, z czym porównujesz; model zabiera 20–33% szerokości na dekorację |
| **B** | **Trzy kolumny: postać, lalka ze szczegółami, plecak** | Exiled Kingdoms, BDM | 3 × ok. 31–33% | wszystko widać naraz, strona postaci w ekwipunku, mniej zakładek | gęsto; szczegóły mają mało miejsca; łatwo o drobny tekst (BDM) |
| **C** | **Kategorie + siatka + stała kolumna szczegółów, bez lalki** | Genshin (plecak) | szyna 7,5% + siatka 46% + szczegóły 32% | duży tekst, nic nie wyskakuje, sortowanie i filtry, przepływ od przedmiotu | nie widać, co jest założone; zakładanie gdzie indziej; pasuje do gier z 2–6 slotami |
| **D** | **Panel z boku nad światem** | OSRS, Lineage 2M | 20–25% szerokości, świat zostaje | szybkie mikstury, gra się toczy | małe komórki (OSRS 7%), mało miejsca na szczegóły i porównanie |
| **E** | **Wybór od slotu** (podekran) | Genshin, wybór broni | pełny ekran | lista przefiltrowana do slotu, porównanie jest naturalne, mało decyzji | to tylko drugi przepływ, plecak trzeba przeglądać osobno |

**A + stała kolumna z C** łączy czytelność lalki z niezasłanianym porównaniem.
W poziomie stać na to dopiero wtedy, gdy zrezygnuje się z dużego modelu 3D
w środku lalki.

## 5. Górne zakładki czy prawa szyna — werdykt

**Kto czego używa.** Pionowa szyna: Genshin (z lewej), Eternium (z lewej, plus
podszyna z prawej), OSRS (z prawej), menu HSR (z prawej). Zakładki na dole
kolumny: Diablo Immortal, BDM, Darkrise, Exiled Kingdoms. Górna listwa
działów nie występuje w żadnym zrzucie. Górę zajmują tytuł, waluty, pojemność
i ✕.

**Koszt.** Górna listwa z celami dotyku 68 j. zabiera **11,7% wysokości**,
czyli z wymiaru, którego brakuje: to o jeden rząd plecaka mniej. Szyna
szerokości 96–100 j. (ikona plus podpis ≥15 j.) zabiera **7,6–8% szerokości**.
Bilans szerokości z §6 wychodzi dodatni, więc plecakowi na 4 kolumny szyna
nie przeszkadza.

**Która strona.**
- Za **prawą** przemawiają: strefa prawego kciuka, spójność z rozmową
  (odpowiedzi z prawej, „Do widzenia” na dole), precedens OSRS i HSR.
- Za **lewą** (Genshin): w panelu drążek ruchu jest nieaktywny, więc lewy
  kciuk jest wolny. Lewa szyna kłóci się jednak z lalką po lewej i z modelem
  myślowym autora.

**Werdykt: prawa szyna, pod warunkami.**
1. Najwyżej 6 pozycji plus wyjście, każda ≥68 j. wysokości. Ułożenie od
   góry: sakiewka (64×44, tylko do odczytu), Postać, Ekwipunek, Zadania,
   Mapa, Opcje, przerwa, „✕ Wróć do gry”. Suma ≈ 500 j. z 580.
2. „Wróć do gry” musi mieć wyraźnie inny wygląd (kolor, ramka) i co najmniej
   12 j. odstępu od przycisku akcji karty. Obie rzeczy lądują w tym samym
   gorącym rogu. Przypadkowe wyjście jest tanie, jeśli panel otwiera się
   ponownie na tej samej zakładce i z tym samym zaznaczeniem.
3. Podpis pod ikoną zostaje. Same ikony wymagają nauki, a celem jest
   orientacja w kilka sekund.
4. Zakładki **wewnątrz** strony (kategorie plecaka, „warstwa”, „zestaw I/II”)
   umieszczamy lokalnie nad kolumną, której dotyczą (jak BDM i Diablo
   Immortal), a nie na szynie.

## 6. Rekomendacja dla naszych ograniczeń

### 6.1 Układ (1257×580, margines 16 j.)

```
| lalka-sylwetka ~240 | plecak 4 kol. ~310 | karta szczegółów ~480 | szyna ~100 |
```

- **Lalka (ok. 240 j.)** to sylwetka ze sklepu: 3 kolumny po 72 j.,
  a ręce to wysokie kafle 1×2 obok korpusu. Nad rękami przełącznik
  **„I | II”** (wzorzec D2): aktywny zestaw jest w lalce, nieaktywny widać
  jako dwie miniatury w przełączniku, więc zestaw nie znika za zakładką. Nad
  korpusem segmentowany przełącznik **warstwy: Spód / Środek / Wierzch**
  przełącza naraz zawartość wszystkich kafli obszarów ciała, tak jak
  „Equipment / Cosmetics” w Diablo Immortal zmienia całą lalkę. Na każdym
  kaflu trzy kropki pokazują, które warstwy są zajęte. Pod lalką są **3–4
  duże liczby** (Obrażenia, Ochrona, Udźwig, ewentualnie Stamina), jak
  w Eternium, i „Szczegóły →” prowadzące do strony Postać.
- **Plecak (ok. 310 j.).** 4 kolumny × 72, 6 widocznych rzędów, przewijanie
  pionowe. Przedmioty 1×2 zajmują dwie komórki w pionie (drogę Diablo
  Immortal, gdzie wszystko jest pionowe, odrzucam, bo podwoiłaby wysokość
  przy 16 slotach). Nad siatką ikony kategorii (≥68 j.) i **pojemność
  „12/16 · 23,4/40 kg”** jako pasek, jak w BDM. Na komórkach: pasek
  trwałości u dołu, czerwony róg przy niespełnionej Sile, znaczek „lepsze”
  tylko przy pewnym porównaniu (DI pokazuje, że niepewna strzałka szkodzi).
  Wolne i zablokowane komórki muszą się różnić.
- **Karta szczegółów (ok. 480 j., stała, bez okienek).** Pusty stan to „Wybierz
  przedmiot albo slot”. Na górze nazwa (20–22 j.), jakość, materiał
  i warstwa. Dalej **porównanie z założonym w tym samym slocie i tej samej
  warstwie** jako różnice (+3 ochr. ▲ zielone, −0,8 kg ▼). Potem
  wymagania, trwałość i zestaw „Kolczy (2/4)” z progami jak w Eternium. Na
  dole przyciski: główny 82 j. („Załóż · zestaw I”) i drugi („Zestaw II”,
  „Napraw”, „Upuść”).
- **Szyna (ok. 100 j.)** jak w §5.

Bilans szerokości: 16 + 240 + 16 + 310 + 16 + 480 + 16 + 100 = 1194 j.
z 1257, czyli ok. 60 j. zapasu.

Bilans wysokości plecaka: kategorie 56 + 6 rzędów × 72 + odstępy ok. 30
= 518 z 548.

Bilans wysokości lalki: ok. 4 rzędy × 72 + 2 przełączniki × 68 + liczby 56
+ odstępy ≈ 520 z 548. Jest ciasno. Jeśli zabraknie miejsca, liczby
przechodzą na stronę Postać. Przełączników nie zmniejszamy poniżej celu
dotyku.

### 6.2 Przepływy

- **Od przedmiotu (Genshin):** dotknięcie komórki → karta po prawej →
  przycisk główny pod prawym kciukiem.
- **Od slotu (wybór broni w Genshin):** dotknięcie slotu → karta pokazuje
  założony przedmiot z „Zdejmij”, a **plecak filtruje i podświetla pasujące
  przedmioty** (reszta przygaszona). Lewy kciuk obsługuje lalkę, prawy
  plecak i kartę.
- **Przeciąganie jako skrót, nie jedyna droga.** Brak przeciągania
  i ręczny wybór slotu krytykuje recenzja Torchlight, a siatka przeniesiona
  z PC bywa na dotyku uciążliwa (Titan Quest). Dla pierścieni domyślny slot to wolny
  albo słabszy, z możliwością zmiany w karcie.

### 6.3 Strona Postać

Lewa połowa: 4 atrybuty jako wiersze 72 j. z „+” (≥68 j.), licznik wolnych
punktów i podgląd skutku przed zatwierdzeniem. Prawa połowa: statystyki
pochodne w 3 grupach (Atak, Obrona, Wysiłek) z objaśnieniem po dotknięciu.
Biegłość w 5 rodzinach jako paski. Kropka na szynie przy „Postać”, gdy są
wolne punkty. Wykres radarowy z Lineage 2M (liczby na wierzchołkach)
wygląda efektownie, ale przy 4 atrybutach daje romb. Lista z „+” czyta się
lepiej.

### 6.4 Sklep

Wspólne mają być **komponenty**: `ItemCell` (1×1 / 1×2, trwałość, znaczki),
`BagGrid` (kategorie, pojemność), `ItemCard` (różnice, zestaw, wymagania,
pasek akcji), `SlotTile`, przełączniki „I | II” i warstwy. Sklep potrzebuje
półki kupca (ok. 330 j.), więc
[półka | karta | plecak gracza | szyna] mieści się tylko bez lalki. Lalka
w sklepie pojawia się w karcie jako porównanie „założone”. Wtedy sylwetka,
którą autor chwali w sklepie, staje się **jedyną** lalką w grze, ze stałym
miejscem w ekwipunku.

## 7. Antywzorce

1. **Okienko szczegółów przykrywające porównywany kontekst**
   (`diablo_immortal_item_detail_popup.jpg`, `eternium_inventory_paperdoll.png`).
2. **Górna listwa działów w poziomie**, bo zabiera rząd plecaka.
3. **Tekst poniżej ok. 15 j.** (11 pt Apple). Brak skali tekstu.
4. **UI z PC zmniejszone na telefon** (Albion, Titan Quest) i odwrotnie:
   Blizzard przyznał, że jednakowe ekrany DI wydają się na PC nieco za duże
   ([Blizzard](https://news.blizzard.com/diablo-immortal/23789255/)).
5. **Ukryta pojemność.** Brak sygnału pełnego plecaka (DI).
6. **Szum znaczków** („New” na 10 z 13 przedmiotów w Genshin) i znaczki
   „lepsze” z niepewnego porównania.
7. **✕ w lewym górnym rogu**, najgorszej strefie zasięgu. Problem
   nieosiągalnych przycisków zamykania opisuje
   [AHFE](https://openaccess.cms-conferences.org/publications/book/978-1-964867-13-7/article/978-1-964867-13-7_13).
8. **Drugi zestaw broni albo inne warstwy ukryte bez śladu.** Gracz zapomina,
   co ma pod spodem; kropki i miniatury to rozwiązują.
9. **Duży model 3D w lalce „bo wszyscy tak mają”.** Darkrise i Exiled
   Kingdoms pokazują, że sylwetka wystarcza.

## 8. Do rozstrzygnięcia przez autora

- Czy lalka ma pokazywać **model 3D** (widać warstwę wierzchnią, kosztuje ok.
  120 j. szerokości i pracę w `render3d`), czy portret i sylwetkę?
- Domyślna warstwa w przełączniku: **Wierzch** (to, co widać na postaci) czy
  **Środek** (ochrona zasadnicza)?
- Wyjście na dole szyny (spójne z rozmową) czy na górze (rynek: ✕ w prawym
  górnym rogu)? Pomiar na S21 FE: liczba przypadkowych wyjść.
- Gęstość ekranu (§1) zmienia próg dotyku z 68 na 77 j.

## Zrzuty

| plik | co pokazuje |
|---|---|
| ⭐ `eternium_inventory_paperdoll.png` | Eternium: lalka 2×7 + broń wokół modelu, 3 liczby podsumowania, okienko przedmiotu z zestawem (3/6), szyna z lewej i podszyna z prawej |
| ⭐ `diablo_immortal_inventory_overview.jpg` | DI: sloty poboczne, model, blok 2×3, plecak z pionowymi komórkami, kategorie na dole (żółta ramka od Game8) |
| `diablo_immortal_item_detail_popup.jpg` | DI: karta „EQUIPPED” zasłaniająca model |
| ⭐ `genshin_mobile_bag_weapons.png` | Genshin: lewa szyna kategorii, siatka, stała kolumna szczegółów, pojemność i ✕ u góry |
| `genshin_mobile_weapon_swap_compare.png` | Genshin: wybór od slotu, „Compare”, „Switch” w prawym dolnym rogu |
| `genshin_mobile_character_attributes.png` | Genshin: strona postaci — model, 5 statystyk, „Details” |
| ⭐ `darkrise_character_inventory.png` | Darkrise: najczytelniejszy podział 50/50, duży tekst, 3 zakładki na dole |
| ⭐ `exiledkingdoms_inventory_character.png` | Exiled Kingdoms: 3 kolumny (postać, lalka ze szczegółami, plecak 4×5), „Back” w prawym dolnym rogu |
| `blackdesert_mobile_inventory.png` | BDM: statystyki, model, sloty-kółka, plecak z wagą i „!” lepszych przedmiotów, zakładki na dole |
| ⭐ `osrs_mobile_inventory_side_panel.png` | OSRS: prawa szyna 2×7 i plecak 4×7 obok, nad światem |
| `hsr_phone_menu_right_rail.png` | HSR: prawa wąska szyna z ✕ na górze i siatka menu |
| `grimsoul_inventory_paperdoll.png` | Grim Soul (reklama): anatomiczne sloty wokół modelu, karta przedmiotu z materiałami |
| `lineage2m_stats_equipment_overlay.png` | Lineage 2M (reklama): statystyki radarowe i sloty-romby nałożone na żywy świat |

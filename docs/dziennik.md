---
typ: HISTORIA
domena: proces
tytul: Dziennik sesji
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-14
---

# Dziennik sesji

Notatki z sesji roboczych — co się faktycznie zmieniło i dlaczego, żeby
kolejna sesja (lub Ty, wracając po przerwie) nie musiała odtwarzać kontekstu
z samego diffu. Najnowsze na górze. Szczegóły projektowe i techniczne żyją
tam, gdzie zawsze (`CLAUDE.md`, `docs/*.md`) — to jest narracja, nie
dokumentacja referencyjna.

> ⚠ **Nie czytaj stąd stanu repozytorium — SPRAWDŹ GO.**
>
> ```bash
> git log --oneline -3 && git status --short
> ```
>
> Stał tu akapit opisujący prozą, co jest zacommitowane. **Zestarzał się ósmy
> raz** (2026-08-26): twierdził, że `main` stoi na `d77e58e` i że niezacommitowanych
> jest sześć najwyższych wpisów — w rzeczywistości `main` był już na `f6d70c5`,
> a wpisy do 2026-08-25 włącznie **były w commicie**. Ósma pomyłka pod
> ostrzeżeniem „sprawdź `git log`-iem zamiast przepisywać z pamięci" wystarczy,
> żeby uznać, że **problemem jest sam pomysł trzymania tego w prozie**, a nie
> to, że ktoś zapomniał zaktualizować liczbę.
>
> Stan na 2026-08-26: niezacommitowany jest **wpis z tego dnia** (Uderzenie
> tarczą) razem z kodem, który opisuje. Ta linia też się zestarzeje — polecenie
> wyżej nie.

---

## 2026-10-16 — Wprowadzenie w sterowanie, pokrzywy u Patryczka, nazwa Nevermore

- `CONTROLS_TUTORIAL` (GameConfig) + `GameScene.controlsTutorialStep`: do
  przyjęcia „Kija w garści” — `move` (dotknij lewej części ekranu, wyjdź
  z podwórka) → `father` (pulsujący okrąg wokół Ojca, ikona nad głową =
  zadanie) → `talk` (przycisk rozmowy). Ten sam `TutorialGuide`.
- „Zioła dla babki” → „Pokrzywy dla babci”: 5 pokrzyw oddawanych Patryczkowi,
  nagroda owijki (zdjęte z etapu `visit_patryczek`), po oddaniu odsyła do
  babuni i wspomina turniej w grodzisku; „Pierwsza lekcja” wymaga pokrzyw.
  ⚠ Temat `turniej` dalej mówi „w mieście” — do ujednolicenia przez autora.
- Nazwa gry: **Nevermore** (tytuł strony, ekran tytułowy, Capacitor, Android).
- Plan: druga lekcja = Przewrót w przód (dziś Unik) + celowanie umiejętnościami;
  powolny onboarding staminy/cech/HP/przedmiotów — `docs/pomysly.md` C–D.
  Nie sprawdzone w silniku (limit tokenów) — odbiór w grze.

---

## 2026-10-15 (5) — Plan na najbliższą sesję

Autor zapisał trzy rzeczy na następną sesję (`docs/pomysly.md` „Na
najbliższą sesję”, tory 9–11 w `content_expansion.md`, wiersz w
`current.md` §2): onboarding sterowania (ruch, wyjście z podwórka,
podświetlony Ojciec, ikona nad głową = zadanie), pokrzywy dla babci
kończone u Patryczka z zaczepką turnieju w grodzisku, druga lekcja walki
(zmiana celu, pierwsza umiejętność). Otwarte w §3: reguła zmiany celu,
teksty agenta do odbioru.

---

## 2026-10-15 (4) — Samouczek walki u Patryczka („Pierwsza lekcja”)

Zadanie po „Nauczysz mnie walczyć?” (`offersQuest`), cel nowego rodzaju
`hit` (Uderz: Manekin ×3 — `Quests.recordHit` tam, gdzie ląduje cios gracza).
Kroki liczy `GameScene.updateCombatTutorial` z żywego stanu: podejdź
(pulsujący okrąg zasięgu wokół postaci — UCZCIWY: koło o promieniu zasięgu
broni od środka ciała, kamera spłaszcza je jak grunt), za blisko, stań
przodem (niebieski pierścień pod celem), naciśnij atak (pulsujący obrys
przycisku, pełny czerwony pierścień), bij dalej, zmiana celu, wróć.
Manekin wybierany jako cel od początku — pierścień uczy swoich stanów
po drodze. `TutorialGuide` u góry (bez wejścia, chowa się pod rozmową).
Render 1:1 całego przejścia na nowej grze. Z renderu: kroki mijające
same z trafieniami przemykały (3 trafienia w ~1 s) → `minReadMs` 4,5 s
i krok po kroku; ramka wisiała nad rozmową → chowana pod `KeyFocus`;
powitanie przy oddaniu mówiło o babce → własne `turnIn` lekcji.
⚠ Krok „zmiana celu” uczy reguły, która JEST (przełączenie, gdy cel wyszedł
z zasięgu); plan autora mówił o przełączaniu przy celu w zasięgu — do decyzji.
Teksty Patryczka (opis, kroki, `working`, `turnIn`, `done`) — do odbioru.

---

## 2026-10-15 (3) — Otwarcie gry z rozmowy; prowiant po kiju; plany

Autor: pierwsza rozmowa ma zaczynać się od GRACZA. Ojciec tylko zatrzymuje
(„Stój. Dokąd się wybierasz?” — łącznik agenta, do odbioru), gracz mówi
„Tato, ja już postanowiłem. Pójdę do Wszebora…” (`FATHER.topics.postanowilem`,
słowa autora), a odpowiedź ojca — jego dotychczasowa mowa z opisu zadania —
otwiera „Kij w garści” (`offersQuest`). Patryczek pada dopiero tam, nie
w pierwszym zdaniu gry; pozostałe tematy ojca czekają na tę rozmowę.
„Prowiant na drogę” wymaga ukończenia zadania ojca (`requiresQuest`).
Render: nowa gra → Ojciec → oferta; Mama bez „!” przed oddaniem kija.
Zapisane do planu (`docs/pomysly.md`, tory 7–8 w `content_expansion.md`):
króliki przy polach jako realny problem wsi, samouczek walki u Patryczka.

---

## 2026-10-15 (2) — Zadania jako gałęzie tematów: Gniewko pierwszy

Para pól: temat `offersQuest` + zadanie `requiresTopic` (`Quests.waitsOnTopic`,
źródło „czy temat padł” wstrzykuje `Dialogue` — bez pętli importów).
„Rachunek pasterza” bierze się po odpowiedzi na „Słyszałem, że straciłeś
owce. Ile?”: kolumna przechodzi od razu w „Biorę to.” (cel `Ubij: Wilk ×3`
w podpisie, nagroda w dopisku) / „‹ Jeszcze nie”. Przed rozmową: „!” nad
głową i powitanie `firstJob`, temat pierwszy z „!”; po „Jeszcze nie” —
zwykły wiersz zadania. `ile_zabraly` stracił `after: owce` (temat-brama
musi być dostępny zawsze), pytanie gracza bez „Myśliwy mówi”. Przymiar
rozmów: `R8`/`Z9` + osiągalność przez temat; trzy sabotaże czerwone.
Render: pierwsza rozmowa, ścieżka „Jeszcze nie”, ponowne pytanie, przyjęcie.
Tego samego dnia przepięte kolejne trzy pary (autor: „przepnij zadania,
które mają pasujący temat”): Myśliwy `urzad` → „Pierwszy odstrzał”, Dobek
`ile_zjadaja` → „Wydeptane zagony” (opis zaczyna się „Mówiłem ci już”),
Ciechan `zrabowany_woz_temat` → „Zrabowany wóz”; temat-brama ukryty za
innym pytaniem tej samej osoby przekazuje „!” temu pytaniu. Bez pary:
Anna (powitanie przy zadaniu już jest odpowiedzią o Kirkę — temat by ją
powtórzył), Kowal („Droga na wschód” zakłada rozmowę o pajęczynie, ale ta
stoi za łańcuchem u Myśliwego i Zielarki), reszta — brak tematu-zapowiedzi.
Render: Ciechan od „Gdzie rąbiecie?” do oferty z dwoma celami.
Otwarte: zniknięcie zakładki Zadania.

---

## 2026-10-14 (8) — Plan: migracja na widok izometryczny (sobota 2026-10-17)

Autor po młynie: widok top-down pokazuje budynek tylko z czterech stron,
a takie konstrukcje jak młyn się w nim nie sprawdzają (koło trzeba było
skręcić o 25°). Decyzja kierunku: **migracja na widok izometryczny**, praca
zaplanowana na sobotę 2026-10-17 (większy nakład). Część rzeczy zostanie,
część trzeba dopasować — tak, żeby gra pokazywała nie tylko młyn, ale i inne
budowle. Wpis: `docs/current.md` §2, `OI-164` w `docs/zadania.md`. Młyn
zostaje dziś w obecnej postaci.

---

## 2026-10-14 (7) — Młyn: koło pionowo w nurcie, młynówka i woda

Zgłoszenie autora: koło czytało się jak tarcza leżąca płasko. Przyczyna: oś
modelu biegła wzdłuż rzeki (północ–południe), więc kamera z południa widziała
lico koła. Dziś (`tools/props3d.py`, „KOŁO STOI PIONOWO”): początek modelu =
punkt osi na zachodniej ścianie młyna (punkt z Tiled), koło nasiębierne
w płaszczyźnie nurtu 4,2 j. na zachód, oś wzdłuż X w ścianę, obrót w silniku
wokół X z nurtem (`Trees3D.animuj`). Nowy nieruchomy model `mlynowka`
w tym samym punkcie: kamienna komora ze stopniami, kozioł z łożyskiem, rynna
na kozłach doprowadzająca wodę na wierzch koła od jazu z zastawką, strumień,
kurtyna z czerpaków, piana. Budżet trójkątów per kształt (`budzet`).
Render 1:1 (zrzut 3D) + macierz instancji: obrót wokół osi koła w punkcie
(188,8; 960). Druga wersja tego samego dnia (autor: „wygląda jak
taśmociąg”): koło dokładnie prostopadłe do ściany kamera z południa widziała
BOKIEM, a długa rynna na sześciu kozłach dokładała wrażenie taśmy. Dziś koło
i zabudowa są skręcone o 25° (`KOLO_SKRET`, oś obrotu w silniku z
`skretDeg`), koło odsunięte na 8,5 j. od ściany (inaczej skręcone wchodziło
w mur), krótkie koryto z drewnianej skrzyni wlotu na słupach (pełny kamienny
filar czytał się jak komin), strugi z czerpaków cienkie z kroplami (pełne
tafle czytały się jak szyby).

---

## 2026-10-14 (6) — Rozmowa: zdania zamiast przycisków, „Bywaj.”

Wariant A autora: wiersze kolumny rozmowy bez ramek i tła — ikona rodzaju
(`drawUiIcon`), tekst, cienka kreska; tło zapala się pod palcem, pole dotyku
bez zmian. Pożegnanie „Bywaj.” w kolumnie i w szynie. Render 1:1 u Myśliwego
(dalszy ciąg tematu złoty, „Bywaj.” zamyka). Wariant B — przebieg kilku
wymian w pasie — odłożony. Decyzja: dopisek w
`docs/decyzje/2026-10-14-uslugi-jako-wypowiedzi.md`.

---

## 2026-10-14 (5) — „Porozmawiajmy o…”, dziennik Aktywne/Ukończone, umiejętności bierne, cele zadań na mapie

Cztery uwagi autora naraz. „Omówione” → „Porozmawiajmy o…” (zdanie gracza,
liczba w dopisku). Dziennik ma podzakładki „Aktywne (n) | Ukończone (n)”.
Umiejętności bierne (Skórowanie, Pieczenie, Kartografia) stoją w Postać →
Umiejętności pod czynnymi — dotąd nie było ich nigdzie. Mapa, widok Świat
i minimapa pokazują cele zadań: zielone `?` u osoby, której oddajesz,
i złoty dymek tam, dokąd prowadzi śledzone zadanie — ten sam odczyt co nad
głową (`NpcStatus`), widoczny też we mgle; pozycje mieszkańców zapamiętane
w atlasie, więc z Gęstwiny widać cel w Zagajach. Render 1:1: Zielarka
z dymkiem we mgle, `?` u Ojca w widoku Świat, dziennik, lista umiejętności,
rozmowa u Myśliwego.

---

## 2026-10-14 (4) — Rozmowa zamiast zakładek: usługi jako wypowiedzi gracza

Autor: „dialog ma wyglądać jak dialog, a nie jak zakładki”. Usługi w kolumnie
rozmowy to wiersze ze zdaniem gracza (`ServiceRow.line`), szyna usługi —
imię, „‹ Rozmowa”, „Do widzenia”. Render 1:1: Myśliwy (Handel — szyna ikon,
Szkolenie), Patryczek (cztery usługi, Mistrzostwo, powrót). Z renderu: „Wróć
do rozmowy” nie mieścił się w kaflu (ostrzeżenie `[Rail]`) → „‹ Rozmowa”;
„!” przy przeglądzie zleceń dublował wiersz zlecenia → przegląd cichy.
W tej samej rozmowie: kościany poker zapisany w `docs/pomysly.md`; kierunek
na zadania jako gałęzie tematów (do decyzji). Decyzja:
`docs/decyzje/2026-10-14-uslugi-jako-wypowiedzi.md`.

---

## 2026-10-14 (3) — `mapa_przymiar`: atlas świata i mgła pod asercją

`tools/mapa_przymiar.mjs` (27 sprawdzeń, §A–§E): atlas ↔ `swiat.world`,
bramy portali w atlasie, obrazy minimapy ↔ mapy Tiled, koło/zapis/obcy
rozmiar/„*” w `Exploration`, Kartografia II po I i stary zapis bez
`explored`. Kontrola „brak obszaru za portalem” NIE świeciła w pierwszej
wersji — sprawdzian pomijał portal do obszaru spoza atlasu, czyli dokładnie
przypadek „nowa mapa bez wpisu”; poprawione. Sabotaż na prawdziwym kodzie
(Gęstwina przesunięta w `GameConfig`, wyłączone sprawdzanie wymiarów
w `Exploration`) — oba czerwone, po przywróceniu zielono.

---

## 2026-10-14 (2) — Mapa świata, mgła „jak w Minecrafcie” i Kartografia I–II

Autor: mapa powiązana z umiejętnością Kartografia (I — mapa, II — minimapa),
odkrywanie terenu jak w Minecrafcie, a przede wszystkim: „będąc na jednej
mapie nie wiemy, jakie lokacje są dalej”. Decyzje (pytania z tej sesji): I
u Myśliwego za darmo, II u Sołtysa za złoto, bez II róg minimapy PUSTY,
pamięć terenu działa zawsze. Kod: `core/Exploration.ts` (bity per obszar,
komórka 64 px, koło 384 px), `ui/MapFog.ts` (pergamin + obraz minimapy
w odkrytych komórkach, dorysowanie tylko nowych), strona MAPA na kartce
(`parchmentSheet`) z widokami Okolica | Świat; `MAP_ATLAS` stawia Gęstwinę
brama do bramy przy lesie (240; 165 kafli). `requiresSkill` w `SKILLS`
(II po I) — znacznik „+” i karta trenera to rozumieją. Zapis: pole
`explored`; stary zapis dostaje I+II i odkrytą wieś z lasem. Render 1:1:
nowa gra (róg pusty, mapa „nie umiesz”), nauka I, las, II (minimapa), Świat
z „?” i po wejściu do Gęstwiny. Z renderu: obrys `strokeRect` gubił pionowe
boki, nazwa na środku zasłaniała znacznik — obie poprawione. Stan:
`docs/systemy/world.md` §5.1, `save.md` „`explored`”.

---

## 2026-10-14 — Celowanie „dotknij, potem cel" i znaczniki nad mieszkańcami jako ikony

**Celowanie (D12, autor):** ustawienie „Celowanie: przeciągnij / dotknij celu” w Opcjach i w menu głównym (`Settings.aimMode`, urządzenie). W trybie dotyku przycisk zdolności z podglądem UZBRAJA sesję (podgląd + ✕), dotknięcie świata ją zatwierdza (punkt → grunt kamerą świata ściśniętą o sin θ; przy wrogu w promieniu `ABILITY_AIM.tapSnapPx` celuje w jego ciało), ten sam przycisk ją zdejmuje. Pułapka drążka rozwiązana łapaczem pod HUD-em; łapacz znika dopiero w następnej klatce, bo drążek pyta o trafienie PO zdarzeniu obiektu. Render: uzbrojenie, wskazanie na lewej połowie (cooldown ruszył, drążek nie), anulowanie tym samym przyciskiem (zero kosztu). **Znaczniki nad NPC** („biała kropka wygląda dziwnie”): rysowane ikony w stylu WoW zamiast napisów monospace — złoty `!`, zielony `?`, złoty dymek rozmowy w miejsce białego `◆`, zielony `+` (`entities/NpcMarkerIcons.ts`); znaczenia i priorytety bez zmian.

---

## 2026-10-13 (9) — `tarcze_przymiar`: dwa czerwone zamki (D13, N1)

**N1 — wada ZAMKA, nie kodu.** Repo trzyma LF, checkout z `core.autocrlf=true`
ma CRLF; zamek wycinał ciało `guardKat` do `"\n  }\n"`, `indexOf` dawał −1
i „ciałem" była reszta `Player.ts` (słowo „cel" w innej metodzie). Przymiar
sprowadza dziś końce linii do LF przed wzorcami; inne przymiary szukają
`"\n  }"` bez końcowego `\n` i tej pułapki nie mają. **D13 — prawdziwe
naruszenie, bez zmiany mechaniki.** Łup bandytów (2026-10-11) ustawiał
startowe zużycie egzemplarza w `GameScene`, a `durability` ma jednego
właściciela: zapis przeszedł do `Quality.setDurabilityFraction`. Oba zamki
sprawdzone sabotażem (czerwone na zepsutym kodzie, zielone po przywróceniu).

---

## 2026-10-13 (8) — UI etap F: lista + karta, zadania w rozmowie (D4), role tekstu w panelu gracza

Brief §9 F („skończmy interfejs" — autor). Jeden widżet `ListDetail`
(geometria `ListDetailLayout`, `panel_fit` §F z kontrolą) dla zadań u dawcy,
szkolenia, Mistrzostwa, Postać → Umiejętności / Broń i dziennika; widoki usług
na całym obszarze (997×556 na S21 FE zamiast 816×440). D4: „!" i „?" jako
wiersze kolumny rozmowy (oferta w głosie dawcy → „Biorę to." / „‹ Jeszcze
nie"; oddanie pisze nagrodę w nawiasie — bez nowych kwestii NPC). Umiejętności
na pasek: rząd sześciu kafli slotów w pasie akcji karty zamiast stosu
przycisków. Cechy, Opcje, Mapa na rolach (`PlayerPanel` na `NA_ROLACH`),
podzakładki 52 j. Render złapał: skrawek ósmego wiersza listy (okno ma dziś
całkowitą liczbę wierszy), przecięty wiersz ciała karty, opis umiejętności
powtórzony w „Co daje", tytuł mapy na ramce, kropki na cudzych podpisach,
zlepione ogłoszenia „NOWA ZDOLNOŚĆ" przy skoku o kilka poziomów. Szczegóły
i odstępstwa: `docs/ui_mobile_research.md` §9 F. Na koniec usunięty martwy
kod karty-dymka (`ItemTooltip`, `CardActions`, `cardToLines`); kontrole
ujemne przymiarów przepięte na żywy renderer `ShopDetails`.

---

## 2026-10-13 (7) — UI etap E: sklep kupiec | gracz | karta

Brief §9 E, prowadzony z autorem na żywo — trzy zrzuty 1:1 i trzy zwroty.
Start: lista + karta wg researchu (R4). Autor: „lista obok plecaka w slotach
jest nieintuicyjna" → zrzut A/B lista ↔ kafle → **kafle**. Potem: „zmieścimy
plecak, kupca i kartę w trzech kolumnach" → **kupiec | gracz | karta**,
kafel 68 j. (był 57–62). Potem: „taki sam tabulator po stronie gracza" →
**Kup·Odkup** i **Plecak·Na sobie** (sylwetka), naprawa przy rzeczach gracza.
„Sprzedaj surowce" usunięte (surowce do wyrobu; barierka `odlozone.md` §5),
menu boczne w Handlu zostaje samymi ikonami („tylko w sklepie"). Karta
(`ShopDetails`, wspólna z panelem gracza) na rolach tekstu: ciało obok
podglądu, D10 — porównanie z OBOMA zestawami (przełącznik w wąskiej karcie),
obciążenie po → teraz w bloku. E3: Cofnij 1:1 do końca rozmowy + Odkup
`SHOP.buybackMarkup`. Render i przymiary złapały: rzecz noszona porównywała
się z drugim zestawem, cofnięcie sprzedaży oddawało NOWY egzemplarz (darmowa
naprawa), pas pod cenę spychał ikony `1×1` do ×1 (`I3`), ⓘ 3 j. poza panelem,
blok porównania w ciele jako jeden wiersz (dziura w karcie). Decyzja:
`docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md`.

---

## 2026-10-13 (6) — Minimapa jako kartka pergaminu (D15)

Autor: „zamiast złotego bordera coś jak mapa z Minecrafta — mapa jako wiszący
element" (wątek z `docs/pomysly.md` „Kartografia”). Kartka liczona w czystym
`src/ui/MapParchment.ts`, rysowana raz `Graphics` w `Minimap`: kontur
z nacięciami w rytmie 9 komórek i rozdarciami parami (pojedyncze ząbki czytały
się jak szum), pas przy mapie, cień 2 j. „Piksel" kartki = kafel mapy (2 j.).
Kwadrat 108 j. bez zmian (prześwit do `E` 12 j.), więc płaci okno: 108 →
92 j. (54 → 46 kafli). `hud_uklad` §6c: kartka z cieniem w kwadracie, kontur
≥ komórkę od mapy; kontrola na przesuniętej kartce i sabotaż (rozdarcie
na 3) świecą. Mgła wojny i Kartograf — nietknięte (mechanika do decyzji).

---

## 2026-10-13 (5) — UI etap D: ekwipunek na szynie

Brief §9 D (`docs/ui_mobile_research.md`). Lalka = sylwetka `DOLL_CELLS`
(`src/ui/PaperDoll.ts`) — jedna lista dla panelu i sklepu, `SHOP_DOLL` jest
z niej wyprowadzony; krata `EQUIP_CELLS` zniknęła. E1 (oko/Spód/Środek/Wierzch
dla całej lalki + kropki warstw), E2 (`[I ▪▪] ⇄ [II ▪▪]` nad rękami: segment =
widok, ⇄ = zamiana), trzy liczby pod lalką, plecak 4 kol. z torbami pod
siatką, stała kolumna karty (`ShopDetails`). Panel gracza stoi obok własnej
szyny (D13; `TabBar.ts` usunięty, `formatAmount` → `theme.ts`) — 997×556 na
S21 FE, kafle 68. Render złapał trzy rzeczy, których liczby nie mówiły:
zlepione podpisy liczb („obrażeniaochrona −41%"), miniaturę tarczy na ramce
segmentu zestawu i **ikonę w locie niewidoczną nad lalką** (maska siatki;
błąd starszy niż D) — przeciąganie poszerza dziś maskę o kolumny lalki
i karty. `phone_render` dostał krok `drag` (przytrzymanie + ruch + zrzut
w locie). `ekwipunek_uklad` przepisany na sylwetkę (5 ramek, kontrola §0).
Dwa pytania do autora: domyślny widok warstw i miejsce „Użytkowy II".

---

## 2026-10-13 (4) — Handel: szyna samych ikon, złoto w sklepie „(−x)"

Autor po odbiorze C: „w Handlu same ikony na pasku bocznym; złoto jest
częścią sklepu; zamiast tekstu »po zakupie« wartość −x lekko na czerwono".
Ocena przed wdrożeniem (liczby z `ShopLayout`): +112 j. dla sklepu, kafel
54 → 62 j. na S21 FE (laptop 61 → 69) — połowa straty, normę 68 da dopiero E;
koszt — dwie gęstości szyny i imię znika w Handlu (niesie je podpis półki).
Wdrożone: `DialogView.denseRail` + `host: "frame-dense"`, złoto „3 020 (−40)"
w `UI.spend` (znika, gdy nie stać — mówi to „Brakuje"), szyna rozmowy bez
sakiewki, złoto wraca do nagłówków Szkolenia i Mistrzostwa, ⓘ w rogu sklepu.
Render złapał przeskok kafli szyny o 84 j. między trybami → gęsta szyna
trzyma miejsce tożsamości, pilnuje `S7` (kontrola: stary układ = 84 j. BŁĄD).
Laptop zapalił `Z9` (tarcza ×2 w ręce, ×1 w plecaku przy siatce 69 j.) →
kafel sylwetki ≤ kafel siatki.

---

## 2026-10-13 (3) — UI etap C: rama rozmowy z usługami, grupy tematów (D14)

Brief §9 C. „Rozmowa" = zakładka 0, usługi w STAŁEJ kolejności
(`NpcDialog.SERVICE_ORDER`) jako kafle po dwa w kolumnie, wejście w usługę
zwęża kolumnę do szyny (przejście 200 ms), widok usługi stoi w obszarze na
lewo od szyny bez tytułu i ✕; Wstecz o jeden poziom; stan zakładki do końca
rozmowy (`suspend`/`restore`). **D14**: `Topic.group` + `TOPIC_GROUPS`,
zioła Zielarki w grupie „Opowiedz mi o ziołach"; `rozmowy_przymiar` R6/R7
(kontrola: literówka → 2 BŁĘDY). Render 1:1 złapał trzy rzeczy, których nie
pokazała żadna liczba: ikona Mistrzostwa (skrzyżowane miecze) czytała się
jak ✕ obok „Do widzenia" → medal; krój proporcjonalny odsłonił stare
nakładanie opisu i przycisków w Mistrzostwie → przyciski pod opisem; powrót do
Handlu gubił zaznaczenie (`refresh` je czyści) → `restore` je odtwarza.
Węższy sklep zapalił `sklep_uklad` D4 (podgląd 1×2 o 2 j. za niski) →
wysokość podglądu ze skali rysunku. ⚠ Koszt do etapu E: kafel sklepu 54–56 j.
na telefonie (ostrzeżenie R3/Z6). Odstępstwa: `docs/ui_mobile_research.md` §9.
`tools/phone_render.mjs` dostał krok `tapAt`; scenariusz ramy:
`tools/phone_render_frame.json`.

---

## 2026-10-13 (2) — UI etap B: krój, role tekstu, krycie, szyna, przymiar paneli

Brief `docs/ui_mobile_research.md` §9 B. **D1**: krój całego UI
proporcjonalny (`theme.UI_FONT`), świat zostaje na monospace; `readingStyle`
zniknął (cały UI czyta się tym krojem). **Role** `TYPE` (title 23 · prose 21 ·
name 21 · body 18 · small 15) + `fontPx` — na role przeszły `TabBar`,
`ConversationSheet`, nowy `Rail`; reszta paneli w D–F. **Krycie**: tło panelu
1,0 + przyciemnienie na cały ekran pod panelem (`PanelBase.scrim`). **Szyna**:
`Rail.ts` + czysta geometria `FrameLayout.ts` (też obszar usługi, kolumna
rozmowy, rozmiary paneli przeniesione z konstruktorów). **`OI-68`**:
`tools/panel_fit.mjs` — sześć ramek, panele w obszarach, szyna, próg dotyku,
role, skan literałów; kontrole §0 świecą na zepsutych danych. Render 1:1:
tekst ostry w powiększeniu ×2, liczby w kolumnach wyrównane do prawej.

---

## 2026-10-13 (1) — research UI 2: rama usług, sklep, ekwipunek

Autor: „sklep i panel to prototypy — na interfejsy towarzyszące graczowi cały
czas nie liczy się szybkie dowiezienie". Audyt na renderze 1:1 (bezgłowy Chrome,
2340×1080) + trzech subagentów (sklep, ekwipunek, rozmowa → usługi). Zgodny
wynik: tekst 2× za mały (7–8 dp przy 9–14 dp u wzorców), nawigacja jako
pionowa szyna (D13), rozmowa = zakładka 0 ramy usług, towar kupca jako lista
z zadokowaną kartą, sylwetka zamiast kraty w plecaku. Kodu nie ruszano.
Synteza i decyzje E1–E5: `docs/ui_mobile_research.md` §8; raporty:
`docs/research/ui_*_research.md`.

---

## 2026-10-12 (5) — interfejs mobilny, sesja 2: para broni, ramka postaci, minimapa → mapa, pasek zakładek, „Załóż · Zestaw II"

Autor: „wciel się w specjalistę od GUI/HUD mobilnych, research Wild Rift /
MLBB / mobilnych RPG, świeży gracz ma się szybko odnaleźć". Research na dwóch
subagentach (MOBA; menu i ekwipunek mobilnych RPG, Eternium sprawdzone na
zrzutach) — skrót i decyzje w `docs/ui_mobile_research.md`.

- **Para broni**: zmiana zestawu przeszła z `middle` 3 na `outer` 3, obok
  trybu ataku; równa waga, wspólna podkładka (`WeaponSwapButton.paintPlate`).
- **Ramka postaci** (`HUD.ts`): odznaka poziomu z pierścieniem XP (tap →
  POSTAĆ), HP, wysiłek; złoto i „Punkty rozwoju (C)" zeszły z HUD-u.
- **Minimapa → MAPA**, nowy **`MenuButton`** (plecak) na lewo od niej →
  panel; pasek buffów rośnie od niego. `hud_uklad` §6b (sabotaż → 2 BŁĘDY).
- **`TabBar`** (ikony `UiIcons` + podpis, sakiewka z monetą, ✕ ostatni kafel)
  zamiast tekstowych zakładek i dolnego „Wróć do gry"; zakładka zapisu =
  „Opcje". `ekwipunek_uklad` czyta `tabBarH` z tekstu `PlayerPanel`.
- **Karta**: „Załóż · Zestaw I / II", „Zamień · pierścień I / II"; zagęszczona
  (21 → 18 wierszy) pod krój 12 j. **Pusty kafel lalki filtruje plecak.**
- **`CoachMark`**: dymki pierwszego razu (menu, zestaw, sposób ataku).
- Legenda mapy mówiła „złota = przejście, zielona = kupiec" — rysujemy
  złote kropki mieszkańców; poprawiona.
- Przy okazji: `doc_check` §I/§K po sesji 1 (`ui_mobile_research.md` w
  indeksie, kotwica decyzji z `TopicPanel` → `ConversationSheet`).
- Weryfikacja: render 1:1 z S21 FE (bezgłowy Chrome, 780×360 CSS, DPR 3,
  zrzuty 2340×1080) — HUD, wszystkie zakładki, karta, zestaw II, rozmowa,
  sklep; konsola bez wyjątków, `dev.missing()` puste.
- Do `odlozone.md`: trzy stopnie monet (§1), onboarding w zadaniach Ojca /
  Patryczka / Mamy i tryb „dotknij → celuj → dotknij" (§3). Pomysły autora
  bez kodu: szyna pionowa (D13), rozmowa jako rama usług (brief §7).

---

## 2026-10-12 (4) — chwyt broni: topór i pałka niesione jak miecz, ostrze prowadzi cios

Zgłoszone przez autora ze zrzutu wsi: „bandyci i postać dziwnie trzymają broń,
np. topór; miecz jest ok”. Dwie przyczyny, obie zmierzone na renderze:

- **Kąt noszenia.** Topory i młoty 1H miały `obrot` −12…−18°, obuchowe 0° —
  przy opuszczonej ręce wisiały PIONOWO, głowicą przy kostce, lekko za piętą.
  Dziś wszystkie jednoręczne topory i obuchowe +30° jak miecz: głowica przed
  nogą (`char3d_weapons.MOCOWANIE`).
- **Strona ostrza.** Ostrze (`+x` z `weapon_shapes`) leżało na lokalnym +Z,
  więc w klatce cięcia patrzyło w górę — cały roster uderzał grzbietem
  (topór ostrze·ruch −0,35, szabla −0,73). Siatka obrócona o 180° wokół
  trzonka (`OSTRZE_LOKALNE` = −Z): topór +0,76, w noszeniu ostrze ku ziemi.
  ⚠ Drzewcowe zostały na +Z (`OSTRZE_DRZEWCOWEJ`) — ich ostrze ustawia poza,
  odwrócenie skręcało nadgarstek (pchnięcie 1,20 → 1,44 j.). Zamach halabardy
  i glewii prowadzi więc dalej hakiem → `OI-176`.
- Bramka `char3d_sprawdz_bron`: nowa kolumna „ostrze” (BŁĄD dla broni
  o niesymetrycznej głowicy); przed poprawką świeciła na czerwono dla 21 broni.
- Przebudowane `char.glb` i trzy `enemy_bandit_*.glb`; ostrzeżenia IK ataku
  identyczne jak przed zmianą. Sprawdzone w silniku (topór z boku).

---

## 2026-10-12 (3) — „porozmawiaj” = rozmowa w temacie (`OI-66`); zioła i ikony skór odłożone

Decyzje autora: zioła bez zastosowania zostają towarem (`OI-61` zamknięte),
ikony skóry lisa / dziczyzny / skóry jelenia odłożone („drobnica”), a cel
„porozmawiaj” ma dotyczyć rozmowy w danym temacie.

- `Quests`: `talk.topic`, `recordTopic` (woła `TopicPanel.ask`, także z
  archiwum), `pendingTopics`; `recordTalk` zalicza już tylko cele bez tematu.
- `TopicPanel`: temat do zadania pierwszy, złoty „!”, stoi także, gdy był już
  zadany; za bramką `after` „!” dostaje temat odsłaniający. Hub (`NpcDialog`):
  „temat do zadania”.
- Pięć celów przepiętych na istniejące tematy (zero nowych tekstów): Patryczek
  `reka`, Gniewko `czyje_owce`, Młynarz `bez_zboza`, Sobek `kola`, Zielarka
  `gdzie_szukac`. `rozmowy_przymiar` §Z8 (sabotaż `kolaX` → BŁĄD).
- Silnik: Zielarka — samo otwarcie okna 0/1, hub „!”, `ziola` z „!”, potem
  `gdzie_szukac` z „!” → 1/1, tracker przeszedł do „Zbierz: Babka 0/3”.

---

## 2026-10-12 (2) — kadr nie pokazuje pustki otwartego świata

Zgłoszone przy teście Kirki: w NE rogu wsi prawa ćwiartka kadru była czarna.
Świat ma 240 kafli szerokości (las), wieś 128, więc na wschód od wsi leży
pole `pustka` (`WorldComposer`), a kamera miała granice całego świata.

- `src/world/VoidFraming.ts` (czysta funkcja): o ile przesunąć środek kadru,
  żeby nie zachodził na pustkę. `WorldComposer.voidsOf` daje prostokąty pustki,
  `GameScene.trzymajKadrPozaPustka` co klatkę ustawia `followOffset`.
- Pierwsza wersja wybierała najkrótszą drogę. Przy wewnętrznym narożniku
  (róg wsi ↔ las na wschodzie, teren przechodni) przełączała się skokowo,
  ~200 px na krok. Druga jest ciągła: krótsza oś w pełni, dłuższa
  `max(0, 2·krótsza − dłuższa)`.
- Zapas 12 → 40 px: kamera Phasera (lerp 0,12 + `roundPixels`) staje do ~8 px
  przed celem (w pionie piksel ekranu ≈ 1,9 px świata), a w marszu wlecze się
  za graczem.
- Pomiar w silniku: we wsi prawa krawędź 4056, w lesie góra 4128. Marsz po
  skosie przez narożnik: 0 px pustki; bieg: ≤ 12 px chwilowo (36 kl./s w Browser pane).
- `tools/kadr_pustka_weryfikacja.mjs`: 28 sprawdzeń. `SABOTAZ=1` daje 6 błędów,
  stara reguła najkrótszej drogi — błąd ciągłości (471 px na krok).

---

## 2026-10-12 (1) — plan dwóch tygodni, przegląd spójności postaci, Kirka w grze

Autor w pracy: bez testów, bez decyzji strategicznych, bez Blendera na tym
komputerze. Krzywa XP i Mastery czekają do ~10-26. Kierunek przyjęty wstępnie:
Gęstwina (1. fala kolonii), rozbudowa bandytów, warianty zwierząt. Wątek
i wieczorny odbiór: `docs/content_expansion.md`.

- **Leże kolonii za Gęstwiną** (autor: „za lasem gospodarczym za gęstwiną,
  może matecznik albo puszcza”) — `spider_colony.md` §3, `swiat.md`,
  `region_geography_proposal.md` §4.5, `current.md`.
- **`OI-175` — przegląd spójności postaci** (`docs/character_consistency.md`):
  6 poprawek od ręki (m.in. Patryczek „teść w łóżku” → „jej teść, co ledwie widzi”,
  Sulisław 81 i Janek 11 w planie, Dobek bez wołów w §6, uzupełniony spis
  mieszkańców), 7 kart decyzji B1–B7, 9 luk w relacjach do wspólnego pisania.
  `doc_check` §S złapał moje własne odwołania `NPC.temat` (wymaga `NPC.topics.id`).
- **`OI-174` — „Poszukaj Kirki”**: piąty rodzaj celu `reach` (`Quests.ts`),
  obiekt `miejsce` na mapie (`TiledMap.questSpots`), Kirka jako zwierzę
  z imieniem (`NAMED_ANIMAL_OBJECTS`), scenariusz `FarmAnimal.biegnij/zjedz/
  przenies`, scenka `scenes/QuestSpots.ts`, `rozmowy_przymiar` §Z7 (sabotaż:
  zła nazwa miejsca → BŁĄD). ⚠ Komentarz przy `ANNA.quests` zapisywał decyzję
  „Anna nie potrzebuje pomocy — zero zadań”; zadanie napisane tak, że Anna nie
  prosi, gracz się upiera. Render: pierwsze miejsce (NE, kafel 118,5) dawało
  psa za górną krawędzią kadru i **czarną pustkę świata** po prawej (osobne
  zadanie); przeniesione na łąkę NW (14,12), pies staje przy lewej nodze, bo
  nad graczem chował się za jego modelem. Zapis/wczytanie i oddanie sprawdzone.
- Bramki: `tsc`, `build`, `doc_check` (0 błędów), `rozmowy_przymiar`.

---

## 2026-10-11 (26) — Kira (Kirka), pies Anny, i rudy kot bohatera w kanonie

Autor (ze zdjęciem psa): `swiat.md` nie wiedział, że Anna ma psa ani że
wkurza ją rudy kot. Dopisane w sekcji Anny i przy Matce (dom bohatera):
**Kira, zdrobniale Kirka — szczupła kundelka, czarna podpalana**; **rudy kot
jest kotem bohatera**, Anna próbuje go ukochać, a on ucieka. Bohater
dokarmia Kirkę po cichu za plecami Anny („mistrzyni wyłudzeń na ładne oczy").

⚠ **Sprostowanie do K6b (2026-10-11 (13)):** „ruda" z tamtej wypowiedzi
autora dotyczyła KOTA, nie psa — stąd błędne powitanie Anny („kudłatej rudej
suki"), ruda maść `animals/dog.glb` (`tools/farm3d.py` `pies_rudy`) i imię
**Kirci** w grze. Do wyrównania w ramach `OI-174`.

**Zamiar zadania (`OI-174`):** poszukanie Kirki — z pieczonym mięsem
(`cooked_meat`) Kirka sama przybiega zza bocznej granicy mapy (np. prawy
górny róg), gdy gracz tam stanie.

**Wyrównane tego samego dnia:** `dog.glb` przemalowany na czarny podpalany
(`tools/farm3d.py` `pies_kira`, podgląd z Blendera obejrzany, render w grze —
jeszcze nie), powitanie Anny „chudej czarnej suki”, pytanie „Znalazła się ta
twoja Kirka?” / „Kira? Znajdzie się…”. Id `kirci` (temat, obiekt mapy) bez zmian.

---

## 2026-10-11 (25) — zakładki w panelu postaci 48 j. (`OI-95`), nazwy pancerza pod grę (`OI-152`)

- **`OI-95`:** pasek zakładek nad plecakiem w panelu postaci 40 → 48 j.
  (`CategoryStrip.STRIP_H`, jak w sklepie), pasmo `FILTER_ROW_H` 46 → 52
  (`src/ui/EquipLayout.ts`). Przy 54 monitor 1920×1080 tracił rząd plecaka
  (8 → 7) — 52 nie zabiera nic na żadnym z trzech ekranów `ekwipunek_uklad`.
  Render 891×411: pasek nie wchodzi na pierwszy rząd.
- **`OI-152` (autor: nazwy mają pasować do gry i nie przytłaczać —
  „stalowe szyny nie brzmią jak przedmiot, który chcesz założyć”):**
  nazwy ocenione na arkuszu ikon ×4; ikona ma rację. Nogawice → spodnie
  (6 sztuk), półnogawice → Spodenki kolcze, Szyszak → Hełm stożkowy,
  Nagolennice segmentowe → Okute spodnie, Nabiodrki z nagolennikami →
  Pełne nagolenniki, Półpłytowe → Półstalowe buty (autor; „Nakładki na buty” odrzucone), Skórzany ćwiekowany →
  Kaftan ćwiekowany; 11 opisów bez „szyn” i „nogawic”. Wzór nazw już był
  w grze („Kaftan pikowany”, „Rękawice kolcze”, „Skórzane buty”).
  Id bez zmian, więc zapisy nietknięte. Przegenerowane
  `ekwipunek_przedmioty.md` i `dystrybucja_ekwipunku.md`.
- Bramki: `tsc`, `ekwipunek_uklad`, `filtr_przymiar`, `karta_przedmiotu`,
  `sklep_uklad`, `rozmowy_przymiar`, `doc_check` — zielone.
- Przy okazji: `OI-153` (ikony ziół) zamknięte — zrobione 2026-10-05,
  w rejestrze wisiało jako otwarte. Rejestr: **67** otwartych.

---

## 2026-10-11 (24) — krzywa XP odłożona, `OI-173` zamknięte, propozycja przeglądu rejestru

**Decyzja autora:** krzywa XP i rangi Mastery (`OI-43`, `OI-28`, `OI-46`) —
za wcześnie: przeciwnikami są zwierzęta i świeżo dodani bandyci, a przy tej
skali gry i liczbie umiejętności poziomy nie są problemem. → `zadania.md`
ODŁOŻONE, barierka w `CLAUDE.md`.

**Zrobione bez decyzji:** `OI-173` zamknięte — `systemy/world.md` §4.1
(otwarty świat) i `systemy/ui.md` §6.1 (minimapa jako jedyne wejście do
panelu na telefonie; z `ui.md` wycięty nieaktualny opis `OI-87` i odwołania
do zamkniętego `OI-52`, żeby zmieścić się w 20 KB). „Lewa/prawa animacja
ataku gracza" (`Character.png`) z `odlozone.md` §4 do archiwum — unieważniona
przez 3D; zniknęła też z barierek `CLAUDE.md`. `OI-85` przemierzone: 4
odwołania zamiast 13.

**Przegląd rejestru — ✅ autor: „tak, hurtem A i B”.** Wdrożone: A (8 spraw) → `issues_archive.md`, B (17) → `zadania.md` ODŁOŻONE; `abilities.md`, `proficiency.md`, `weapons.md` i `DOC_CONTRACT.md` bez zamkniętych numerów. Rejestr: 95 → **70** otwartych. Propozycja w brzmieniu sprzed decyzji (hurtem albo per grupa).
Większość spraw `DESIGN` powstała przy ekstrakcji 09-05…08 i od tamtej pory
nie pojawiła się w dzienniku ani razu. Rejestr zszedłby z 95 do ~60.

*A. Zamknąć — nieaktualne, zdublowane albo kosmetyka dokumentacji:*
`OI-39` (czy playtest celowania się odbył — autor gra na bieżąco) ·
`OI-3` (checkpointy w korzeniu: zostają jako `HISTORIA` z banerem, cytują
je komentarze w kodzie) · `OI-37` (kontrakt pełny — dziś zwykłe ostrzeżenie,
scalić z `OI-84`) · `OI-11` i `OI-41` (numeracja i brzmienie `N-n` —
kosmetyka) · `OI-15` (kłamiące komentarze — świadome ograniczenie
przymiaru) · `OI-74` (`performance` to przekrój, rozstrzygnięte 09-06) ·
`OI-30` (duplikat długu D1 w `systemy/proficiency.md`).

*B. Zamrozić do playtestu albo do dalszego etapu (→ ODŁOŻONE, bez zdania teraz):*
balans atrybutów i punktów `OI-12`, `OI-13`, `OI-44` (razem z odłożoną
krzywą XP) · stamina `OI-16`, `OI-18`, `OI-19` · pancerz i tarcze wg
FREEZE 09-18 `OI-21`, `OI-22`, `OI-25`, `OI-26` · walka i sterowanie
`OI-40`, `OI-86`, `OI-88`, `OI-89`, `OI-90` · odbiór barw `OI-72`, `OI-92`.

*C. Zostawić jako otwarte:*
- **UX telefonu — warto rozstrzygnąć przed wydaniem:** `OI-93` (pasek
  zdolności: nowy gracz uczy się przez stratę), `OI-67` (13 przycisków
  paneli pod progiem dotyku), `OI-95` (zakładki w panelu postaci 40 j. przy
  68 w normie — w sklepie 48), `OI-69`, `OI-54`, `OI-91`, `OI-73` (brak
  celów wydajnościowych).
- **Dług techniczny — przy pracy w danym miejscu:** `OI-27`, `OI-33`,
  `OI-34`, `OI-36`, `OI-49`, `OI-57`, `OI-59`, `OI-60`, `OI-66`, `OI-70`,
  `OI-71`, `OI-82`, `OI-83`, `OI-85`.
- **Decyzje o kierunku:** `OI-5`, `OI-14`, `OI-64`, `OI-77`, `OI-78`, `OI-97`.

---

## 2026-10-11 (23) — przegląd powdrożeniowy; trzy kalibracje autora

Decyzje autora w rozmowie:
- **Cała gra idzie w 3D** — modele i animacje zamiast assetów i klatek 2D.
  Zdanie „grafika wioski to świadomie otwarta dziura" przestało obowiązywać
  (`CLAUDE.md`, kalibracja); zakaz zastępników (`wioska_plan.md` §7.4)
  zostaje. `public/assets/README.md` dostał baner: co jest żywe, a co jest
  ścieżką awaryjną 2D.
- **Roadmapa:** łańcuch archetypów obowiązuje; strzelec będzie łatwiejszy
  w 3D. Otwarte tylko, kiedy ETAP 3 względem wątków świata.
- **`docs/ai-pixel-snapped-game-sprites-main/`** (11 MB, pipeline pixel-artu
  postaci 2D) — autor: „chyba nie będzie potrzebne". Wnioski są już
  w `prompty_gemini.md` i `referencje_zewnetrzne.md`; usunięcie czeka na „tak".

Wdrożone tego samego dnia (decyzja autora: „tak"):
- **`ai-pixel-snapped-game-sprites-main/` usunięty** (80 plików, 11 MB); żywe
  odwołania (`README.md`, `prompty_gemini.md`, `referencje_zewnetrzne.md`,
  komentarz `tools/build_pole.py`) wskazują historię gita.
- **`doc_check` §A** (punkt wejścia nie może zostać ponad 7 dni pracy za
  dziennikiem — daty w repo, nie kalendarz) i **§D** (każdy katalog `src/`
  z kotwicą w `STAN` albo z powodem w `BEZ_STAN`). Dowód na danych: po
  odsunięciu `systemy/render3d.md` §D świeci na `src/render3d`. Sabotaż 26/26.
- **`src/characters/` (`CutoutRig`, `HunterSkeleton`) i `RigTestScene` usunięte**
  (decyzja autora) — płaski rig 2D sprzed przejścia na 3D, uruchamiany tylko
  przez `?rig=1` w buildzie deweloperskim; wejście zdjęte z `src/main.ts`.
  `BEZ_STAN` w `doc_check` jest teraz pusty. Usunięte też osierocone
  `public/assets/characters/hunter/` (18 plików) i `tools/build_hunter_rig.py`;
  wiersz o riggu Spine przeszedł w `odlozone.md` z §4 do §6 (archiwum).

Sprawdzone: tag `docs-retro-baseline-2026-10-11` → drzewo robocze różni się
wyłącznie 25 plikami dokumentacji i `tools/doc_check.mjs`. ⚠ Tag jest tylko
lokalny. ⚠ Import `@docs/current.md` w `CLAUDE.md` niezweryfikowany na żywo
(samodzielne CLI bez ważnej sesji logowania) — do potwierdzenia na starcie
następnej sesji.

---

## 2026-10-11 (22) — retrospektywa systemu dokumentacji: jeden punkt wejścia, `STAN` dla 3D

Zlecenie autora: krytycznie ocenić system pamięci projektu i go poprawić.
Punkt odtworzenia: tag **`docs-retro-baseline-2026-10-11`** (migawka całego
drzewa roboczego, z niezacommitowaną pracą sesji (1)–(21); `main` nietknięty).
Porównanie: `git diff docs-retro-baseline-2026-10-11 -- docs CLAUDE.md tools src/render3d`.

**Diagnoza (zmierzona):**
- **Dziesięć plików ogłaszało się punktem wejścia**; wyznaczony punkt wejścia
  (`checkpoint_2026-09-21.md`) w 12 lokalnych sesjach od 09-21 nie został
  ani razu otwarty narzędziem Read; najczęściej czytane były `README.md`
  i `dziennik.md` (każdy w 32 z 56 lokalnych sesji). Jego §1 nie wiedział o świecie 3D,
  wsi ani bandytach.
- **Epoka 3D nie miała `STAN`:** `src/render3d/` (~3700 linii, domyślne od
  10-06) — zero odwołań w `systemy/`; wiedza w wierszu `OI-164` (3,5 KB),
  w checkpointach i w akapicie „Otwarte" `CLAUDE.md`. `CLAUDE.md` każe
  sprawdzać obraz przez `game.renderer.snapshot()`, które w widoku 3D łapie
  tylko HUD.
- **Routery odrosły:** indeks 104 → 19 → 44 KB, `CLAUDE.md` 36 KB z ~8 KB
  statusu (z błędami: `OI-98` jako otwarte, „6 decyzji" przy 32).
- **Rejestr `OI`:** 45 zamkniętych wierszy w sekcji AKTYWNE, 60 KB.
- **Reguła „zmiana = dwa pliki" (kontrakt §11) nie działała:** commit
  `1ad9f0c` ruszył 18 plików dokumentacji. Ostrzeżenia `doc_check` o rozmiarze
  (49) nikt nie czytał — nie potrafiły zaświecić.

**Zmiany:**
- **`docs/current.md`** — jedyny punkt wejścia, bez daty w nazwie, ≤ 10 KB,
  **importowany do `CLAUDE.md` (`@docs/current.md`)**, więc dochodzi do
  kontekstu bez osobnego odczytu. Wchłonął `checkpoint_2026-09-21.md`.
- **`docs/systemy/render3d.md`** (28. domena, `decyzje/2026-10-11-render3d-jako-domena.md`)
  i **`src/render3d/CLAUDE.md`** (reguły rendererów, hosta 2D, zrzutu 3D).
- **Osiem przeterminowanych checkpointów/handoffów → `HISTORIA`** z banerem;
  treść nietknięta. Root `PROJECT_DOCS_CHECKPOINT.md` / `_RESUME.md` — baner.
- **`zadania.md` 60 → 30 KB:** 45 zamkniętych wierszy dosłownie do nowego
  **`docs/issues_archive.md`** (z dawną sekcją „Zamknięte" i notatkami
  o numeracji); sześć wierszy przyciętych do etykiety, pełne brzmienie
  w archiwum. Nowy `OI-173` (luki `STAN`: otwarty świat, minimapa).
- **`CLAUDE.md` 35,6 → 26 KB**, `README.md` 44 → 17 KB (jeden wiersz na
  dokument, poprawione kategorie). Dopisane w `CLAUDE.md`: „Ciągłość pracy"
  i „Współpraca z autorem" (pamięć agenta jest per komputer).
- **`tools/doc_check.mjs`:** §W (tylko `current.md` ogłasza punkt wejścia),
  §B (budżety 28/24/10 KB), §Z2 (zamknięte i przerośnięte wiersze w AKTYWNE);
  lista zagnieżdżonych `CLAUDE.md` wyliczana, nie wpisana. Każda reguła
  zaświeciła na prawdziwych danych przed porządkami; sabotaż 23/23.
- **`DOC_CONTRACT.md` §11 przepisany** — gdzie mieszka każda informacja,
  cykl życia dokumentu wątku, reguła „nowy podsystem → `STAN` albo `OI`".
- `roadmap.md` — dopisek: rzeczywisty kierunek odbiegł od §1 (pytanie do autora).

**Świadomie bez zmian:** typy i nagłówki, `STAN`-y domen, decyzje, dziennik
(wpisy październikowe są już krótkie), `docs/*.json` (wejścia generatorów),
`public/assets/README.md` (210 KB — osobna sprawa), root `PROJECT_CHECKPOINT_*`.

---

## 2026-10-11 (21) — K6j: wschodni blok od nowa, jako dwa pasy

Autor: „czuję, że coś tu zjebaliśmy". Słusznie — K6c–K6i były łatkami po
jednej uwadze i dały mozaikę kojców. Przed dalszą pracą: szkic „dziś vs plan"
pokazany i zaakceptowany, potem JEDEN skrypt na cały blok. Pas Gniewka
(podwórze → pastwisko owiec), pas kowala (podwórze → ogród → sad), błonia
otwarte z krowami. Przymiar złapał dwie usterki przed zapisem (narożnik pod
wrotami sołtysa, furtka 1×1). Szczegóły: `zagaje_projekt_ukladu.md` „K6j".

---

## 2026-10-11 (20) — K6i: pastwiska według właścicieli

Po zamianie zagród krowy sołtysa stały na pastwisku bez wejścia od
właściciela. Dziś: krowy — część z wrotami od sołtysa, owce — część
z wrotami od Gniewka; dolne pastwisko przy kuźni zlikwidowane (łąka).
Szczegóły: `zagaje_projekt_ukladu.md` „K6i".

---

## 2026-10-11 (19) — K6h: gnojowisko jako kopiec za oborą

Model z pryzmy zamiast skrzyni z desek; trzy kopce za oborą/chlewami (Zofia,
Witek, Marko), z podwórzy zdjęte. Dobek i sołtys bez kopca — tył ich obór to
droga i plac. Szczegóły: `zagaje_projekt_ukladu.md` „K6h".

---

## 2026-10-11 (18) — K6f zamiana zagród, K6g wschód wsi

Szczegóły: `zagaje_projekt_ukladu.md` „K6f" i „K6g". Kapliczki wstrzymane
barierką w `odlozone.md` §5 (religia nieokreślona). Przymiar zielony,
`houses3d` bramka zielona (150 budynków), zero kieszeni w środku wsi,
sprawdzone w grze.

---

## 2026-10-11 (17) — K6e: ogród kowala przy ścieżce do zielarki

Ogródek z rogu pastwiska (płot pastwisk z trzech stron — „zwierzęta by się
do niego dobrały", autor) przeniesiony na skrawek x 85–97, y 103–105 między
pastwiskiem owiec a ścieżką; furtka na ścieżkę. Przymiar zielony, `houses3d`
bramka zielona, sprawdzone w grze. Szczegóły: `zagaje_projekt_ukladu.md` „K6d".

---

## 2026-10-11 (16) — K6d: trakt bez bram, ogródek kowala, dąb na placu

Szczegóły: `zagaje_projekt_ukladu.md` „K6d". Przymiar złapał furtkę ogródka
wychodzącą na ścianę składu kuźni — przesunięta przed zapisem. Po drodze
sprawdzone kieszenie terenu: w środku wsi zostaje jedna zamknięta, 14 kafli
za chałupą Dobka (x 50–56, y 39–40) — nieszkodliwa, ale zsuwanie gracza
z zapisu (`NavGrid.nearestPassable`) nie pyta o łączność i mogłoby tam
postawić postać. Nienaprawione, zgłoszone autorowi.

---

## 2026-10-11 (15) — K6c: kowal w górę, Gniewko do wsi; pasieka od chaty

- Pasieka Doroty: sześć uli z ścian chaty → dwa rzędy między chatą a stogiem
  (autor). Opis i współrzędne: `zagaje_projekt_ukladu.md` (lista „Nie ruszać").
- K6c (wariant C autora, doprecyzowany: przesuwa się CAŁA działka kowala):
  szczegóły w `zagaje_projekt_ukladu.md` „K6c". Dwa szkice wariantów
  pokazane autorowi przed zmianą (scratchpad, nie w repo).
- ⚠ Do decyzji: brama południowa (y 89) dzieli dziś kuźnię i Gniewka;
  propozycje 3, 5, 6, 7 (pasy pól na wschodzie, drzewa śródpolne, błonia
  z kapliczką, ugór) — autor bez preferencji, niezrobione.

---

## 2026-10-11 (14) — minimapa z drzewami wsi, woda pod kładką

- `build_minimap.py`: korony drzew-STEMPLI (wieś, Gęstwina) — ciąg kafli pnia
  w wierszu = jedno drzewo. Wieś: 0 → 480 koron (sady widać).
- **Kładka sama otwiera przejście** (`TiledMap.komorkiKladek`): cztery kafle
  `path` z wody pod mostkiem zdjęte, woda pod nim widoczna. Ten sam warunek
  w `wies_przechodniosc.py` + nowa reguła „oba końce kładki osiągalne" —
  sprawdzone, że świeci na czerwono po wyłączeniu wyjątku (na zachodnim
  brzegu nie ma drzwi, więc test drzwi kładki by nie zauważył).
- Analiza rozkładu wsi (pusta wschodnia połowa, pastwisko przy trakcie,
  owczarnia bez drogi, pasieka przy ścianach chaty) — szkic propozycji
  pokazany autorowi, czeka na wybór.

---

## 2026-10-11 (13) — K6b: grusza na placu, pranie, gnojowniki, psy

Prośba autora po K6. Szczegóły: `zagaje_projekt_ukladu.md` „K6b”.
- Grusza zamiast buka na placu (plan rdzenia wsi mówił „grusza”).
- `houses3d.py`: dwa nowe rodzaje sprzętu — `pranie` (sznur, płótna, kosz)
  i `gnojownik` (obudowa z desek z trzech stron, kopiec ze słomą, widły).
- Psy jako `FarmAnimal` (`dog`, `sheepdog`): model z wilka w `farm3d.py`
  (jak kot z lisa), klip `Eat` = węszenie; 2D awaryjnie z `wolf.png`.
  Imię psa Anny wzięte z kanonu: **Kirci** (autor pisał „np. Kirke”).
  ⚠ Kirci stoi na błoniach, NIE przy Annie — jej kwestie mówią, że pies się
  włóczy i Anna sama go szuka. Jeśli ma stać przy straganie, trzeba zmienić
  `ANNA.greeting` i temat `kirci`.
- Skala psa 0,7 (wierna) dawała psa wielkości kota — podniesiona do 0,9/0,95
  po zrzucie z gry.
- Bramki: `tsc`, `build`, `wies_przechodniosc` (zielony), `rozmowy_przymiar`
  OK, `houses3d` bramka zielona; `dev.missing()`/`dev.mapWarnings()` puste.
  Minimapa HUD odświeżona przez autora (`build_minimap.py --zapisz` po
  `pip install pillow`) — podwórza zielone. ⚠ Generator nie rysuje drzew wsi
  (raport: „drzew 0”) — czyta drzewa lasu, nie stemple `Nature`.

---

## 2026-10-11 (12) — K6 Zagajów: podwórza z trawą i drzewami, wrota przypięte

Zrzuty autora: furtka w powietrzu, ścieżka do ściany, podwórza całe udeptane,
„drzewo owocowe i dające cień jest lepsze niż wyrugowana do zera z drzew
wioska z jednym drzewem w rynku”. Diagnoza z żywego `.tmj`: podwórza były
w CAŁOŚCI pomalowane warstwą `path` (2043 kafle), a drzewa owocowe z K3 stały
za płotami (pola, sad sołtysa) — na samych podwórzach zero.

- Jednorazowy skrypt `k6_podworza` (scratchpad, idempotentny): klepisko tylko
  na wydeptanych trasach, liczonych z drzwi i wrót, po skosie, ze ściętymi
  rogami; 12 drzew owocowych na pięciu podwórzach; trzy wrota przypięte
  płotem, szczelina Dobka zamknięta, odnoga w ścianę karczmy zdjęta,
  ścieżka Doroty do drzwi. Szczegóły: `zagaje_projekt_ukladu.md` „K6”.
- `houses3d.py`: skrzydła wrót z pionowymi listwami; `--zapisz` (130
  budynków, bramka zielona).
- `wies_przechodniosc.py`: nowa reguła „oba końce wrót przy płocie albo
  ścianie” — na mapie sprzed K6 kod 1 (te same trzy wrota), po K6 kod 0.
- Pierwsza wersja skryptu sadziła drzewa w polu za obwodem (region 10 077
  kafli uznany za podwórze) i stawiała gruszę przy samej ścianie — złapane
  przymiarem, zanim cokolwiek zapisano. Druga: drogi pod kątem prostym cięły
  plac na prostokątne trawniki — złapane dopiero zrzutem z gry.

---

## 2026-10-11 (11) — szczyt łańcucha: nekromanta; kolonia wypchnięta

Decyzja autora jednym zdaniem: „kolonia jest wypchnięta, prawdziwym
zmartwieniem będzie nekromanta”.

- `swiat.md` §1: nowy podrozdział „Szczyt jest znany autorowi”. **Dla gracza
  szczyt zostaje pusty**: ⛔ słowo *nekromanta* (ani pokrewne) nie pada
  w tekstach gry, dopóki gracz nie stanie szczebel niżej. Diagram łańcucha
  dostał adnotację.
- Pytanie „dlaczego żywa fauna ucieka od tego, co robi się z martwymi”:
  ✅ **zamknięte tego samego dnia — podświadomy lęk** przed plugawą magią
  nekromancji. Zwierzę czuje wyraźnie, człowiek ledwie, a mieszkaniec
  nigdy nie nazywa przyczyny. Nekromanta to **odległy wątek**: dziś służy
  wyłącznie jako przyczyna ucieczki fauny.
- `spider_colony.md` §4 i `OI-172`: miejsce kolonii w łańcuchu ✅; otwarte
  zostaje tylko, w której fali gracz widzi leże.

---

## 2026-10-11 (10) — kolonia pająków zapisana jako zamiar (`OI-172`)

Autor przekazał fragment rozmowy z ChatGPT o kolonii w głębi Gęstwiny
i dalekiej pajęczej rasie humanoidalnej. W repo nie było o tym ani słowa —
„18 września opisałeś…” odnosi się do rozmów z ChatGPT, nie do dokumentacji.

- **Nowy `docs/spider_colony.md` (`KANON`)** — rozdziela: co jest w grze
  (sieciarz, skoczek, pusta Gęstwina), zamiar autora (leże, role jak
  w mrowisku), moje propozycje. Dwa zderzenia z kręgosłupem zapisane
  wprost: **kolonia jest szczeblem, nie szczytem** (`swiat.md` §1) i **ofiary
  w jaskini to druga fala** (pierwsza ⛔ ciał).
- **`OI-172`** (DESIGN) — jedno zdanie autora o miejscu kolonii w łańcuchu.
- **`odlozone.md` §3** — pajęcza rasa „ala nerubianie”, daleko na południu,
  nie wcześniej niż ok. 2027-04; ⛔ bez haków na zapas.
- Geografia regionu (węglarze, wejście do jaskini) świadomie poza zakresem —
  osobna decyzja, por. audyt 2026-10-09 W1.
- Przy okazji: autor potwierdził, że *synu* jest prasłowiańskie i poprawne
  do dziś — dopisane do słownika w `swiat.md` §Ton; *syn Marka* równie
  zgodne z epoką.

---

## 2026-10-11 (9) — mowa mieszkańców: lekka stylizacja wg wieku

Punkt wyjścia: propozycja (ChatGPT), żeby wieś mówiła „bardziej po
staropolsku”. Audyt ~270 kwestii 24 NPC pokazał, że głosy są już wyraźne,
a realne usterki to **anachronizmy** i **„chłopcze” u 11 postaci**. Słownik
z propozycji odrzucony w części: *waść* (XVII w., szlachta), *azaliż/zali*
(biblijno-literackie), *dyć* (gwara XIX–XX w.) — trzy epoki naraz, czyli to,
przed czym sama propozycja ostrzegała. Autor wybrał wariant **„lekko, wg wieku”**.

- **Standard** → `swiat.md` §1 „Ton” › „Mowa mieszkańców” (jeden dla całej
  wsi, bez profili per postać; nowy dokument nie powstał).
- **27 zamian tekstu w `GameConfig.ts`**, zero zmian id/warunków/zadań:
  anachronizmy (gips → łubki, herbatka → napitek, kredyt → borg, serio,
  mechanizm, kartka/zeszyt → karby, świeczka → łuczywo); formy zwracania się
  (Ojciec „synu”, starszyzna „synku”, Dobek „młodziku”, Sołtys „Markowic”,
  reszta bez formy — „chłopcze” 18× → 8×); starszyzna 60+ (Sulisław, Kuba,
  Dorota) dostała po 1–2 formy (*-że, jeno, nim, pomni*).
- Bramki: `rozmowy_przymiar` OK (92/92 tematów, 16/16 zadań), `tsc` czysty,
  `build` czysty. ⚠ **W grze nieoglądane** — sama treść stringów, układ okna
  nietknięty, ale dłuższe kwestie warto zerknąć w `NpcDialog` przy okazji.
- ⚠ „Markowic” to propozycja stylistyczna, nie zweryfikowany historyzm.

---

## 2026-10-11 (8) — filtr: zakładki kategorii zamiast przygaszania (`OI-130`)

Autor: „ten filtr tylko kontrastuje przedmioty w plecaku, reszta zostaje na
swoich miejscach — nie wydaje mi się, że to najlepszy sposób filtrowania”.
Wybrane z dwóch pytań: **zakładki kategorii** na półce, **widok filtrowany**
w plecaku.

- `src/ui/ItemCategory.ts` (czysty): 11 kategorii po MIEJSCU zakładania
  (Broń, Tarcze, Głowa, Tors, Ramiona, Ręce, Nogi, Stopy, Biżuteria, Użytkowe,
  Surowce), `categoriesPresent` — pusta zakładka nie istnieje.
- `src/ui/CategoryStrip.ts`: glify slotów (język pustych kafli lalki), napis
  tylko na wybranej, licznik w rogu, przewijanie w poziomie (u Kowala 9 zakładek
  na ~300 j.), maska z macierzy świata rodzica, wejście tylko w widocznych.
- **Półka kupca**: filtr prawdziwy (`purchasable` po filtrze). Pasek
  48 + 6 j. — na S21 FE półka zostaje przy 5 wierszach, plecak 6 → 5 (bazowe 16
  dalej bez paska, `W4`).
- **Plecak (sklep i panel)**: mapa `kotwica → miejsce w widoku` przez
  `packShelf`; `Inventory.slots` nietknięte. W widoku filtrowanym tapnięcie,
  sprzedaż i zakładanie działają, pola nie są strefami upuszczania. Stare
  przygaszanie i `BagFilter` usunięte.
- Sprawdzone w silniku (1257×580): Kowal „Głowa” → 7 hełmów dosuniętych;
  plecak „Tarcze” → okrągła + migdałowa 1×2 obok siebie; sprzedaż w widoku
  przelicza go, sprzedanie ostatniej rzeczy kategorii wraca do „Wszystko”;
  panel postaci „Głowa” → założenie skórzanego kaptura z widoku, widok się
  przelicza, 0 pól z wejściem upuszczania.
- Bramki: `tools/filtr_przymiar.mjs` (C1–C4; sabotaż: pas na nieznanym slocie
  ląduje w „Surowce” → czerwono), `sklep_uklad` §F2 (sabotaż `stripGap −20` →
  12× czerwono).

---

## 2026-10-11 (7) — dystrybucja ekwipunku (`OI-106`), łup „co miał na sobie”, `OI-121`

Prośba autora: „przejdź do otwartych elementów, które dadzą najwięcej małym
kosztem decyzyjnym”. Najpierw obóz bandytów: **miejsce v3 jest ROBOCZE**
(„wrócimy jeszcze do ułożenia tego obozu”) — wpis w `docs/odlozone.md` §1.

- **Przymiar `tools/dystrybucja_przymiar.mjs`** (bez decyzji): skąd gracz bierze
  każdą sztukę ekwipunku — sklepy, zadania (`grant`, `reward.item`,
  `onComplete.grant`), łup, start. Tabela → nowy `docs/dystrybucja_ekwipunku.md`.
  Pierwszy przebieg: z 85 pancerzy **10 bez żadnej drogi zdobycia** (nie 18 —
  część zamknęli bandyci). ⚠ Pierwsza wersja liczyła tylko przedmioty ze
  `slot` i **przeoczyła wszystkie bronie** (broń nie ma `slot`) — dziś 127 sztuk.
  Samokontrola `--sabotaz` (wypięcie przeszywanicy ze sklepu) świeci na czerwono.
- **Decyzja autora: „na razie wszystko do sklepów”** (łatwiej testować
  wizualnie) → reguła ETAPU TESTÓW w przymiarze: każda broń i pancerz w jakimś
  sklepie (wyjątki: biżuteria, owijki Patryczka). Rozdane wg rzemiosła:
  10 sztuk metalu u Kowala, 4 skórzane u Myśliwego, płótno/len/łapcie
  + rękawice pikowane u Witka. Do przeglądu przed wydaniem (`odlozone.md` §1).
- **Łup z wroga = to, co MIAŁ NA SOBIE, rzadko i zniszczone** (pomysł autora,
  „żeby bandyci nie zrobili się farmą przedmiotów”): `LOOT.equipmentDrops`
  przeszło z gałęzi w `dropKillLoot` do DANYCH (czyta je przymiar), listy idą
  za strojem presetów `npc3d.py`. `Loot` niesie konkretny egzemplarz
  (`instance`), podniesienie przez `addInstance`. Zmierzone w silniku: 500 zbójów
  z pałką → 55 sztuk (11%), pałka 4–12 pkt trwałości; herszt → szyszak q2
  + skórzane buty q2, szyszak w plecaku z jakością. ⚠ Pancerz nie ma dziś
  trwałości (odroczona), więc „zniszczony” to u niego tylko jakość 1–2.
- **`OI-121` (decyzja autora):** Buty piechura PP 4 → 6; Rękawice pikowane
  `buyPrice` 18 / `sellPrice` 7 — 18 stało jako cena SPRZEDAŻY, wyglądało na
  pomyloną cenę kupna.
- **Lis pod kurnikiem — odłożony** (autor: „lis w biały dzień nie podejdzie do
  kurnika, tylko wpada nocą”) do cyklu dnia i nocy (`odlozone.md` §4).

---

## 2026-10-11 (6) — BANDYCI: pierwsi humanoidalni wrogowie (`OI-171`)

Decyzja autora: „Tak, całość" (propozycja w rozmowie → `docs/bandyci_plan.md`).
⚠ Korekta wobec pierwszego szkicu: **nie w Gęstwinie** — kanon (`swiat.md`):
tam „nie ma nikogo, kto by cokolwiek powiedział". ⭐ **Obóz przeniesiony dwa
razy w tej samej sesji** (autor: „za blisko traktu, ma być w ciężej dostępnym
miejscu") — patrz „Krok 3b".

- **Krok 1 — model:** `tools/npc3d.py` tryb wroga (preset + `wrog.bron`):
  chód/bieg budowane od nowa na szkielecie presetu, warianty z bronią
  przemianowane na `Walk`/`Run` (zakres 0–4, bez klatki bezruchu), `Attack`,
  `Idle` z bezruchu chodu z bronią. Trzy pliki `enemy_bandit_*.glb` (~0,55–0,6 MB).
  Podgląd z kamery gry: trzy różne sylwetki (kaptur + pałka, czapka +
  przeszywanica + topór, kolczuga + spangenhelm + miecz). `Creature3D`:
  śmierć bez klipu = upadek korzenia (inaczej `Idle` w pętli nie kończył się
  i ciało nie znikało).
- **Krok 2 — klasa:** `entities/Bandit.ts`, jedna klasa / trzy konfigi
  (`BANDIT_CLUB`/`AXE`/`CHIEF`), zamach jak `Bear.resolveSwipe`, alarm obozu
  wzorem wycia wilka. Wyłapane po drodze: `displayName` = napis nad paskiem
  HP, więc mają go tylko elity (herszt) — zwykłym zbójom zdjęty.
  `combat_regresja` miała jawną tabelę decyzji ruchu napastnika i świeciła na
  nowych akcjach — dopisane (asercja zadziałała, jak miała).
- **Krok 3 — obóz:** jednorazowy, idempotentny skrypt na `forrest.tmj`
  (polana wokół 106,77 — okno 14×12 miało jedno drzewo, 12 kafli na południe
  od wschodniego traktu): 2 szałasy (`wiata`) + zrabowany wóz (`woz`) jako
  obiekty `budynki`, ognisko, sągi, 5 spawnów; zeszły 4 drzewa, krzewy,
  kamień, 2 rośliny wodne i 6 ziół z prostokąta. `houses3d.py --zapisz`:
  +3 siatki, 123 istniejące identyczne. Spawny ≥ 182 px od pni, żaden
  w budynku (`forest_clearance.py` nie ruszył tu — brak numpy/scipy).
  Minimapy przegenerowane.
- **Krok 3b — kryjówka (v3):** v1 (106,77) stała 12 kafli od traktu; v2
  przy południowym krańcu mapy (111,82, 17,5 kafla) dalej pokazywała dachy
  z drogi — kamera z traktu sięga ~16 kafli w pionie. **v3: (119,5; 38,5),
  NA PÓŁNOC od traktu, 24,5 kafla**, na brzegu rzeki bez brodu (plecy), od
  traktu zasłonięta stawem — dojście tylko lasem, dookoła stawu. Wycinana
  tylko elipsa 8,5×6,5 + kafel wokół obrysów szałasów; spawn jelenia, który
  wpadł w obóz, przesunięty 14 kafli na wschód (na południe trafiał w środek
  obozu). Skrypt odmawia zapisu, gdy cokolwiek stanęłoby na wodzie. Id
  budynków bez zmian → `houses3d.glb` aktualny bez przebiegu. Render: z traktu
  ani dachu, z obozu wóz nad stawem, szałasy pod rzeką; postać postawiona na
  trakcie nad obozem — **zero pościgu**. Opis zadania i `working` Ciechana
  przepisane na nowe miejsce (koleiny na północ, staw obejść).
- **Krok 4:** złoto z wroga prosto do sakiewki (+napis), herszt zostawia
  spangenhelm i lamelkę/łuskę (`OI-106`), zbóje rzadko ćwiekowaną skórę /
  naramienniki; zadanie „Zrabowany wóz" (Ciechan, po Szarym, 2 etapy) +
  `greetings` Ciechana; tematy u Ciechana, Anny (wie, kim są — nie powie)
  i sołtysa (przyczyna z niższego szczebla: Myśliwy nie chodzi traktem).
- **Sprawdzone w silniku:** 5 spawnów na miejscu, modele wczytane, jeden
  zbój w agro budzi cały obóz, telegraf widoczny, naga postać lvl 8 traci
  ~80 HP w 5 s od trzech naraz, herszt pada i znika, +95 zł, łup na ziemi;
  `mapWarnings`/`missing`/`failed` puste.
- Katalogi: pasmo M-III wypełnione (zbóje 100/120, herszt 160); wyczyszczenie
  map = poziom 20; zadania 1000 XP. Bramki: tsc, build, combat_regresja (0/0),
  hud_uklad, rozmowy (92 tematy / 16 zadań), assety — zielone.
- ⏳ Playtest liczb (tabela w planie jest startowa), pomiar pięciu modeli
  ze skórą na S21 FE.

---

## 2026-10-11 (5) — przegląd rejestru: wszystko, co nie wymaga decyzji autora

Prośba autora: „przejrzyj listę rzeczy, które nie wymagają decyzji, i zacznij
realizację". Przejrzany `docs/zadania.md`; zrobione:

- **§V8 w `combat_regresja`** świecił fałszywie: okno 200 znaków przerósł blok
  `AKTYWNOSC_STWORZEN`. Dziś „ta sama pętla, do 800 znaków" — sprawdzone na
  odwróconej kolejności i osobnej pętli (czerwono). Regresja: 0 różnic, 0 błędów.
- **OI-76** ✅ / **OI-78** ⚙: ostrzeżenia map trafiają do `dev.mapWarnings()`.
  Od razu wyszło 6 fałszywych „duplikatów tilesetu" — sklejony świat niesie
  kopię z każdej mapy; próg = liczba map członkowskich. Wstrzyknięta literówka
  `krwawnk` → 1 ostrzeżenie. OI-78 przeniesione do DESIGN (zostaje pytanie
  o surowość).
- **OI-65** ✅ `tools/rozmowy_przymiar.mjs`: 88 tematów, 15 zadań, wszystko
  osiągalne. Jedna literówka w `after` ukrywa łańcuchem 10 tematów u 6 NPC.
  (`CLAUDE.md` podawał 73 tematy — poprawione.)
- **OI-79** ✅ `tools/assety_przymiar.mjs`: 326 ścieżek z konfigu + dźwięki,
  bez listy pól (rekurencja po eksportach). Świeci po zabraniu `charge.wav`.
- **OI-47 / OI-38 / OI-45** ✅ trzy nowe dokumenty `GENEROWANE`:
  `stworzenia_katalog.md` (roster, siatka ról — puste pasma M-III/M-IV,
  kanały obrażeń), `umiejetnosci_katalog.md` (parametry, nauka, poziomy —
  7–9 puste, role), `postep_katalog.md` (krzywa 1–50, pula map = poziom 17,
  zadania 850 XP / 630 zł, ujścia). Liczby do `OI-43`, bez rozstrzygania.
- **OI-53** ✅ `hud_uklad.mjs` §7 (strefa drążka, granica z `VirtualJoystick.ts`)
  i §8 (`activePointers` ≥ 2) — oba świecą po celowym zepsuciu.
- Bilans `zadania.md` przeliczony skryptem: **100 otwartych** (DESIGN 54,
  CALIB 17, CONTENT 13, IMPL 8, BUG 7, DOC 1).
- ⚠ Sprostowanie do wpisów (2)–(4): sprawdzałem `dev.missing` jako obiekt
  (`Object.keys`), a to funkcja — zawsze dawało zero. Sprawdzone porządnie:
  `dev.missing()` puste, `dev.failed()` 0, czyli wnioski się utrzymały.
- **Pominięte świadomie:** OI-1 (pełne generowanie indeksu zastąpiłoby ręczny
  routing — wybór formy; sieroty i tak łapie `doc_check` §I), OI-68 (geometria
  paneli wymaga wyjęcia układu z klas Phasera), OI-80 (pytanie autora wprost).

---

## 2026-10-11 (4) — umiejętności na modelu 3D: przegląd i poprawki; manekin w 3D

Przegląd na prośbę autora („sprawdź, czy umiejętności nie wymagają polishu po
przejściu na model 3D"), wszystko zrobione decyzją autora:

- **Błąd wspólny (najważniejszy):** w świecie 3D `Character3D` podawał modelowi
  gracza tint `null` i alfę `1` — nic, co gra rysuje na sprite'cie gracza, nie
  docierało do modelu: mignięcie trafienia/bloku/parowania/uniku, przezroczystość
  Uniku (jedyny sygnał nietykalności), miganie po odrodzeniu. Dziś tint i alfa
  idą ze sprite'a, jak w `Creature3D`. Sprawdzone renderem: czerwony błysk
  i półprzezroczystość na modelu.
- **Śmierć:** model pada na bok (obrót korzenia wokół osi zwrotu, 400 ms,
  ease-in jak tween sprite'a) i blednie. Wcześniej stał.
- **Wir ostrzy:** grał jeden kierunkowy cios; dziś korzeń modelu robi pełne koło
  w czasie zamachu (`poza: "wir"` w `triggerAttack`). Bez nowej animacji.
- **Uderzenie tarczą:** grało zamach BRONIĄ. Nowy klip `Attack_ShieldBash`
  (`tools/char3d_shield_bash.py`): garda → tarcza do piersi → wybicie z wypadem.
  Pierwsza wersja nie miała widocznego zamachu z kamery gry — cofnięcie
  pogłębione. Kanał: deklaracja `PLAYER_ACTIONS.shieldBash.poza = "tarcza"` →
  `triggerAttack({ poza })` → `Player.zamach.poza` → `Character3D.klipCiosu`.
  `char.glb` przeeksportowany: geometria identyczna (109 siatek, 144 węzły,
  32 698 wierzchołków), jedyna różnica to nowy klip. Ostrzeżenia `[BLAD]`
  zasięgu ramienia w `Attack`/`Attack_Thrust` przy eksporcie — stan zastany.
- Bez zmian: Szerokie cięcie, Ciężkie uderzenie, Rozcięcie (cios), Szarża
  i Wypad (bieg + cios), Okrzyk (pierścień) — poza okrzyku zostaje na później.
- **Manekin treningowy w 3D** (`tools/dummy3d.py`, `MODELE_3D.training_dummy`):
  pal na krzyżaku, słomiany korpus z powrozem, głowa z worka; drewno z
  `wood_palette`. Klipy `Idle`/`Hit` jako animacja obiektu; zachwianie na każde
  trafienie (`TrainingDummy.stan3d`). ⚠ Pierwszy eksport stał do pasa gracza —
  model bez armatury musi mieć skalę 1,6527 w wierzchołkach (wpis w
  `public/assets/README.md`).
- Bramki: `tsc`, `build`, `hud_uklad`, `stamina_weryfikacja` zielone.
  `combat_regresja`: 0 różnic, 1 błąd kontroli krzyżowej §V8 — **stan zastany**:
  okno 200 znaków między `updateEffects` a `updateAI` przerósł blok
  `AKTYWNOSC_STWORZEN` z wcześniejszego commitu (kolejność w kodzie poprawna).

---

## 2026-10-11 (3) — po teście na S21 FE: prawa krawędź odzyskana, bieg darmowy poza walką

Dwie obserwacje autora z telefonu (zrzut z gry, poziom 31), obie decyzje autora:

- **Pasek nawigacji nie stoi już na grze** — `MainActivity` chowa go w trybie
  immersive i wysuwa tylko na chwilę po geście. Rezerwa przy prawej krawędzi
  `HUD_LAYOUT.edgeRight` 80 → 24 j., cały klaster walki o te same 56 j. w prawo
  (`anchor.right` 127 → 71). Minimapa i buffy jadą za `edgeRight`.
  `tools/hud_uklad.mjs`: pas nawigacji (40 j.) zastąpiony stałym marginesem
  krawędzi 16 j. — celowo stałą przymiaru, nie konfigiem. Zielone; atak 17,3 mm
  od przegubu kciuka (było dalej), `E` 52,2 mm.
- **Bieg poza walką darmowy** (`sprintOutOfCombatPerSecond: 0`), w walce 10/s
  jak dotąd. Walka = wróg w pościgu (`wWalce`) albo cios przyjęty albo wysiłek
  bojowy w ostatnich 5 s (`STAMINA.sprintCombatWindowMs`,
  `Stamina.combatEffortAt`). Darmowy bieg nie woła `spend`, więc nie dławi
  szybszej odnowy. Wyliczenie powodu w `docs/systemy/stamina.md` §3.3:
  ~17 s biegu na pulę, trasa las → wieś 57 s marszem / 47 s z biegiem
  i wyczerpanie na miejscu. `stamina_weryfikacja` zielona.
- ⏳ Do sprawdzenia na telefonie: wysunięty pasek zakrywa teraz na moment prawy
  skraj klastra (przyjęte); czy darmowy bieg nie odbiera smaku pogoni za lisem
  przed pierwszym trafieniem.

---

## 2026-10-11 (2) — minimapa HUD jako wejście do panelu; generator minimap dogoniony

- **Decyzja autora, wariant A** (makieta obu wariantów w rozmowie): minimapa
  w prawym górnym rogu ZAMIAST przycisku „C"; tapnięcie otwiera panel od razu,
  na ostatniej zakładce. Wariant B (rząd skrótów przy minimapie) odrzucony —
  ~400 j. szerokości w rogu, pytanie o pauzę i tyle samo tapnięć.
- `src/ui/Minimap.ts` — wycinek wokół gracza (`zoom` 0,5 → ~54 kafle
  w poprzek), strzałka zwrotu, kropki NPC, ikona menu, kropka niewydanych
  punktów. W świecie skleja obrazy wsi i lasu (`WorldState.regions`), więc
  na szwie nic nie przeskakuje — sprawdzone renderem na granicy y=4096.
  Wersja awaryjna bez tekstur: przycisk „MENU" (sprawdzone usunięciem tekstur
  i restartem `UIScene`; tapnięcie dalej otwiera panel).
- Geometria: **bok 108 j. wyprowadzony z przycisku `E`** stojącego pod
  minimapą (12 j. prześwitu przy wymaganych 11). `tools/hud_uklad.mjs` §6
  sprawdza minimapę jako prostokąt; przy boku 112 świeci na czerwono
  (sprawdzone). Pasek buffów przeszedł NA LEWO od minimapy.
- `WorldState` dostał `regions` i `playerHeading` (pisze `GameScene`).
- **`tools/build_minimap.py` — trzecia wersja.** Obraz był nieaktualny od
  dwóch przebudów: las bez drzew (drzewa są obiektami `trees` od rozstawu),
  wieś jako owalnica sprzed K1, bez budynków-obiektów, pól i płotów. Doszły
  korony z obiektów, obiekty `budynki` (płot = linia 2 px, wrota = przerwa,
  kładka = droga), `pola`/`uprawy`; ciemniejsza korona (stara zlewała się
  z trawą przy 2 j. na kafel). Usunięte wypalone kropki NPC (oba widoki
  rysują NPC-ów na żywo) i bramy na szwie świata. Samokontrola: środek
  każdego budynku ma kolor budynku — świeci po wstawieniu bramy w chałupę
  (sprawdzone). Uruchomione przez zamiennik PIL w scratchpadzie (Pillow
  dalej nie jest zainstalowany).
- `tsc`, `build`, `hud_uklad` zielone; `dev.missing` puste,
  `load.totalFailed` 0. ⏳ Telefonu nie mierzono.

---

## 2026-10-11 (1) — polityka zapisu: migracja zamiast kasowania; „Zapisz i wyjdź"

Autor: „fajnie by było mieć opcje zapisz i wyjdź z gry lub zapisz i wyjdź do
menu, zajmij się przy okazji polityką zapisu".
- **`OI-51` zamknięte.** Niezgodny zapis się MIGRUJE łańcuchem `MIGRACJE`
  (czysta `migruj`, na kopii, wersja po wersji). Podbicie `SAVE_VERSION` bez
  migracji świeci na czerwono w przymiarze (§G1). `MIN_WERSJA` = 3. Czego build
  nie umie wczytać (nowsza wersja po cofnięciu buildu, za stara, uszkodzony
  JSON), tego nie niszczy: przed nadpisaniem i przed „Nową grą" idzie do kopii
  `<klucz>-kopia-v<n>`. Slot pisze „zapis z nowszej wersji gry — zaktualizuj
  grę". `tools/zapis_weryfikacja.mjs`: 77 sprawdzeń, sabotaż 4/4 wykryty.
- **Zakładka ZAPIS:** „Zapisz i wyjdź do menu" (było „Menu Główne") oraz
  „Zapisz i wyjdź z gry" — tylko na Androidzie (przeglądarka nie zamknie karty);
  `GameScene` robi gwarantowany autozapis, potem `App.exitApp()`.
- **Błąd przy okazji:** po wyjściu do menu ekran tytułowy stał na zamrożonej
  klatce świata 3D — wspólne płótno three.js zostawało pod przezroczystym
  płótnem Phasera. `WorldView3D.destroy` je chowa, konstruktor pokazuje.
- **`OI-43` (krzywa XP) czeka na rozbudowę rozgrywki** — autor: „po jakimś
  czasie czujesz się, jak twoim największym osiągnięciem jest zabicie wilka".
  Brakuje celów po faunie lasu, nie liczb krzywej.
- **Rytm pracy (autor):** commity rzadko — raz na zamknięty wątek, nie na każdy
  krok; APK tylko na prośbę, bez proponowania.
- Przegląd „co dalej po wiosce": z drogi do MVP (`roadmap.md` §0.1) zostaje
  krok 4 — gameplay; propozycja: humanoidalni przeciwnicy (bandyci) na bazie
  V5 jako test „pełnego wojownika", potem Gęstwina w 3D. Bez decyzji autora.

## 2026-10-10 (12) — Zagaje K5: drwale Ciechan z synami, wozy, stragan Anny

Autor: „skończmy najpierw wioskę, dopiero potem przejdziemy na telefon".
Drwale wybrane przez autora z dwóch propozycji: **Ciechan** (~55) z synami
**Bolkiem** (~28) i **Zbychem** (~19) — NPC z rozmowami (mielerz kowala po
`AGATA.topics.wegiel`, deski Sobka, Anna, „coś szło za nami w krzakach"),
modele 3D z presetów `npc3d`, twarze pixel-art w `build_player_face.py` (zarost
`Z` z własną parą tonów — siwy u ojca). Zagroda: chałupa synów naprzeciw
ojcowskiej, drewutnia z sągami, kozioł do piłowania, pniak, dłużyce; drzewa
z podwórza zdjęte. **Sprzęt zagród jako obiekty `budynki`** (obrót + kolizja,
których `DECOR_PROPS` nie ma): `woz` (Dobek, młynarz), `stragan` (Anna przy
trakcie naprzeciw karczmy — stała dotąd w kaflu płotu), `kozel`, `snopki`
(rzędem W–E; rząd N–S zlewał się z kamery w słupek). Liczba NPC: 24.
APK zbudowane i zainstalowane na S21 FE, `main` wypchnięty.

## 2026-10-10 (11) — Zagaje K3b: kopane moczydło lnu, kładka przez potok

Autor: „mostek przez rzekę i sztuczny zbiornik lekko oddalony od głównego
nurtu do moczenia lnu". Moczydło = **kopany staw 5×5** na łące po starym
młynie, zasilany rowkiem 1 kafla z młynówki — poniżej młyna i studni,
najbliżej lnu Witka (owal ze ściętymi narożnikami czytał się jak krzyż).
Stare moczydło za potokiem (bez dojścia) zasypane. **Kładka** (`kladka`
w `houses3d`: pomost w łuku, pale, poręcze) przy drwalach — `kolizja=false`,
pod nią kafle `path` nad wodą. Zachodni brzeg na południe od młynówki był
dotąd odcięty. ⚠ `wies_przechodniosc` liczył wodę z samej warstwy `water`
i kładki nie widział — dziś bierze NAJWYŻSZY kafel, jak `TiledMap`.

## 2026-10-10 (10) — Zagaje K3: pola wg zamożności, sady, łąka kośna

Pasy pól za obwodem, długość = zamożność (Dobek do wody, sołtys najszerszy,
Marko krótki), ogrody warzywne za tylnymi płotami, sad sołtysa (8 jabłoni),
drzewa przy trakcie, łąka kośna przy lesie ze stogami. Rezerwa na wschodzie
→ **pastwisko krów sołtysa** (autor). Gęsi Zofii mają koryto, modelu gęsi
nie ma (parking, `odlozone.md` §3).

## 2026-10-10 (9) — Zagaje: poprawki K2 ze zrzutów autora, młyn w NW

Pięć poprawek z gry: zwarta zabudowa i wrota wozowe 3–4 kafle („na podwórko
powinien móc wjechać wóz"), budynki gospodarcze wąskich działek rzędem przy
tylnym płocie, kurnik Marka i wrota Zofii/kuźni poza przejazdem, chałupa
kowala w rogu frontem na podwórze, **płot nie stoi obok płotu** (kuźnia na linii
obwodu) i **narożniki płotów się łączą** (`skroc_l`/`skroc_p`). Nowy przymiar
`tools/wies_przechodniosc.py` (autor: „postacie będą symulowały zachowania
gospodarcze") — drzwi z drogą do placu, wrota z obu stron, korytarz wozu
3 kafli. **Młyn przeniesiony** w lewy górny róg przy wozowni (autor: dalej od
lasu, bliżej traktu — mąka na sprzedaż), odnoga od traktu zamiast drogi U.
Koło młyńskie do dopracowania — parking. APK z sesji: obejście „Unable to
establish loopback connection" (`CLAUDE.md`, polecenia).

## 2026-10-10 (8) — Zagaje K2: zagrody przy trakcie, obwód płotów

Plan B (autor): podwórza przy trakcie, płoty zagród w jeden obwód z bramami
na trakcie i furtkami na pola, za obwodem miejsce na sady i pola. Siedem
starych, identycznych zagród zastąpione zabudową z kart obejść (21 budynków,
nowe modele 3D), Zofia i Witek zamienieni chałupami, kuźnia z chałupą
kowala w osobnej ogrodzonej zagrodzie, stodoła wozaków, chałupa drwali.
Szczegóły i sprawdzenia: `docs/zagaje_projekt_ukladu.md`, „Stan kroków".
Następny: K3 (pola, sady, łąka kośna przy lesie, drzewa przy drodze).

## 2026-10-10 (7) — Zagaje: koniec owalnicy, K1 (droga prosto, plac)

Autor z gry: „co to za staw w środku wioski, dlaczego droga wygląda jak
rondo?" Nowa decyzja (`docs/decyzje/2026-10-10-zagaje-droga-plac-krokowo.md`)
unieważnia układ owalnicy: jedna droga, plac po obu stronach, zagrody wg
majątku z kart obejść (pierwsza wersja zrównywała wszystkich — poprawione),
**przestronne podwórka** (wzór: ulicówka autora ze zdjęcia; „małe podwórka"
było moim złym odczytaniem zarzutu), pasy pól za zagrodami, wieś rośnie
krokami K1–K5. Obsada: Anna — kuzynka Bogusza (wdowiec), pomaga w karczmie,
„nie jest służącą" (`docs/swiat.md`); Patryczek u babki-zielarki; trzech
drwali (ojciec z synami). Zlecenie dla zewnętrznych modeli
(`docs/prompt_wies_gospodarka.md`) i audyt z projektem
(`docs/zagaje_projekt_ukladu.md`). **K1 wdrożone na mapie** — szczegóły
w projekcie, sekcja „Stan kroków".

## 2026-10-10 (6) — ✅ prototyp postaci 3D zamknięty

Autor chciał zamknąć etap postaci 3D, żeby przejść do innego tematu.
Rozstrzygnięte pytaniami wprost: **baza V5 = MASTER** (`OI-134` zamknięte —
„na razie nic lepszego nie wyczarujemy"; humanoidalni wrogowie odblokowani),
**obrys odrzucony** (`OI-135` — przy tej wielkości postaci i przy obrocie się
sypie), pomiary z telefonu (`OI-157`, `OI-158`, `OI-169`, `OI-170`) i resztki
(chwyt oburęczny w marszu, kształt głowy, rekwizyty, twarz z boku, fryzura
gracza) do `docs/odlozone.md` §2/§3. Otwarty zostaje tylko kreator (`OI-166`)
jako osobny etap. Checkpoint z banerem i `stan: zamkniety`, akapity w
`CLAUDE.md` scalone w jeden. Zapis: `docs/postac3d_historia.md` dopisek (36).

## 2026-10-10 (5) — mieszkańcy bez „talerza" wokół szyi; checkpoint postaci 3D wyczyszczony

Zgłoszenie autora: chusta Hanny wygląda w grze jak talerz wokół szyi; przejrzeć
też innych. Przegląd wszystkich 21 modeli (Blender `gra` / `bok` / `gra_px`
+ sprawdzenie w grze) znalazł tę samą klasę usterki u czterech i trzy inne:
chusty i kaptur domykają się teraz na szyi (Hanna i Zofia dostały chustę
wiązaną z tyłu, jak na portretach), pelerynka Gniewka jest powłoką ciała,
nogi pod spódnicą znikają (ząbki ud u Agaty), Bogusz ma kaftan cięty w talii,
poły z obwodem brzucha i czapkę nad czubkiem głowy, warkocz Dobrawy jest
ciągły. Pełny zapis: `docs/postac3d_historia.md` dopisek (35).

`docs/postac3d_checkpoint.md` (163 KB przy limicie 20 KB) rozdzielony wg
kontraktu §8: etapy dosłownie, z tą samą numeracją, do nowego
`docs/postac3d_historia.md` (`HISTORIA`); checkpoint (12 KB) to sam stan —
baza V5, rig, mieszkańcy, bramki, otwarte `OI` i tabela „gdzie leżą stare
numery". Odwołania do paragrafów w `CLAUDE.md`, `src/entities/CLAUDE.md`,
`zadania.md` i handoffie przepięte; komentarze w kodzie zostały (trafiają przez
tabelę). `doc_check` 0 błędów.

## 2026-10-10 (4) — szare kwadraty żwiru usunięte z gruntu lasu

Zgłoszone wcześniej jako „osobne zadanie" (wpis o oknie płatów gruntu):
60 pojedynczych kafli żwiru `Teren#10/#11` rozsianych w warstwie `ground`
`forrest.tmj` (x 5–32 / y 58–84 i x 144–209 / y 5–68) czytało się w 3D jako
szare kwadraty. Jednorazowy skrypt poza `tools/` (wzorzec zmiany punktowej):
każdy kafel → najczęstszy kafel `ForestGround` wśród 8 sąsiadów. Sprawdzone:
zmieniło się dokładnie 60 kafli w `ground`, reszta pliku identyczna bajt
w bajt, drugi przebieg nie znajduje nic; render w grze czysty;
`dev.missing` puste. Minimapa nie czyta `ground` — bez przebudowy.

## 2026-10-10 (3) — stylizacja mieszkańców po teście na telefonie

Autor: mieszkańcy 3D to „patyczaki bez wyrazu, każdy taki sam" — regresja
względem pixel-artu. Pomiar wydajności na S21 FE (rejestrator przez CDP do
WebView): 113–120 kl./s, zacięcia tylko przy wczytywaniu gry. Stylizacja:
kontur i cieniowanie tonowe w silniku, styl proporcji `czytelny` (większa
głowa, grubsze kończyny), pozy rąk per mieszkaniec, poprawione usta.
`docs/postac3d_checkpoint.md` dopisek (23).

## 2026-10-10 (2) — mieszkańcy 3D: 17 presetów z osi wariantów

Cała wieś poza Boguszem i Adrianem dostała modele 3D z jednej bazy: preset =
(płeć, wiek, budowa) + barwy z portretu + strój z katalogu. Doszły kształty
głowy (wieniec, długie włosy, warkocz, długa broda), nakrycia z katalogu
przemalowane na filc i płótno (kapelusz, czapka, chusta, pelerynka) i fartuch
męski kładziony rzutem promieni na sylwetkę. Szczegóły:
`docs/postac3d_checkpoint.md` dopisek (22); koszt do zmierzenia: OI-170.

## 2026-10-10 (1) — baza V4.5 (hybryda) i warianty sylwetki z jednej bazy

Porównanie V3.7 vs V4 w tej samej zbroi w wielkości z telefonu: stara baza
czytała się lepiej (większa głowa, widoczna twarz). Przyjęta hybryda ~4,8 głowy
z nogami i anatomią V4 i większą dłonią. Bramka tarcz okazała się mieć fałszywy
alarm parzystości na szwie kciuka — dostała głosowanie trzech promieni
i samokontrolę metryki. Nowy `tools/char3d_variants.py`: płeć × wiek × budowa
jako delty do bazy (24 kombinacje sprawdzane), Ojciec i Mama przepięci na osie,
wysokości stroju zakotwiczone do ciała. Szczegóły:
`docs/postac3d_checkpoint.md` dopisek (21).

## 2026-10-09 (22) — test A na Ojcu („ludzik Michelin")

Anatomia (zwężenia kończyn, mniejsze dłonie), cieńszy strój, ciemniejsze
brzegi ubrań, AO wypieczone w kolorze wierzchołków, światło krawędziowe
w shaderze. Mama bez zmian — do porównania. Szczegóły i strojenie:
`docs/postac3d_checkpoint.md` dopisek (15).

---

## 2026-10-09 (21) — fryzura bez hełmu i Mama 3D

Autor: „popraw fryzurę, żeby nie wyglądała jak hełm, potem Mama". Fryzura
Ojca z pasmami, nierównym brzegiem i baczkami; Mama jako drugi typ ciała na
tym samym szkielecie (`biust` w bazie), spódnica i fartuch
(`tools/char3d_odziez.py`), kok. Napisy NPC liczone z wysokości modelu.
Szczegóły: `docs/postac3d_checkpoint.md` dopisek (14).

---

## 2026-10-09 (20) — kamera ×0,8 i pilot mieszkańca 3D: Ojciec

Autor: wygląd Bogusza/Adriana zaparkowany, czas na modele 3D; ocena bazy
i rozmiaru postaci względem gier mobilnych. Pomiar: postać zajmowała ~17%
ekranu S21 FE — bliżej niż Wild Rift/Diablo Immortal/Metin (szacunek).
Decyzja: **kamera ×0,8** i **pilot na Ojcu** zamiast abstrakcyjnej akceptacji
bazy. Nowe: `tools/npc3d.py` (NPC = preset bazy), `tools/char3d_hair.py`
(fryzury/zarost jako bryły — katalog pod kreator), `NPC_3D`,
`Merchant.stan3d()`. Szczegóły i pułapki: `docs/postac3d_checkpoint.md`
dopisek (13). Ojciec i Mama odsunięci od ściany (okap zasłaniał NPC).

---

## 2026-10-09 (19) — karczmarz Bogusz i czeladnik Adrian

Prośba autora. `INNKEEPER` (Bogusz, karczma przy północnym wjeździe: sprzedaje
chleb, ser, pieczone mięso; tematy `piwo` → `przejezdni`/`tablica`) i `ADRIAN`
(czeladnik Radzima przy miechu; `terminowanie` → `do_miasta`, `mielerz`
otwiera się po `AGATA.topics.wegiel`). W planie wsi czeladnik nazywał się
Bolko — przemianowany na Adriana, także w kwestii Agaty. Obaj na wspólnym
`NPC.png` z tintem (bez portretów).
- ⚠ Naprawa przy okazji: **billboardy 3D gubiły tint** (instancjonowane, bez
  koloru na egzemplarz), więc każdy NPC na `NPC.png` wyglądał w 3D tak samo.
  `WorldView3D.aktualizujBillboardy` pisze teraz kolor instancji przy zmianie
  tintu. Obejrzane: obaj rozróżnialni, pozostałe billboardy bez zmian.

---

## 2026-10-09 (18) — Zagaje jako OWALNICA 128×128

Decyzja autora (wszystkie warianty zalecane): 128×128, karczma przy północnym
wjeździe, kuźnia poza zabudową przy trakcie, palisada w lore → płoty.
Zapis: `docs/decyzje/2026-10-09-owalnica-zagajow.md`.
- Mapa zbudowana od zera jednorazowym skryptem (stemple drzew i kafle kuźni
  ze starej mapy): nawsie z owalną drogą, 7 zagród z podwórkiem w płocie,
  karczma + chmielnik, kuźnia, młyn nad młynówką, pola N, błonia S.
  90 obiektów `budynki` (50 odcinków płotu, 7 wrót), 406 drzew, 56 ziół.
  Kontrole skryptu: brak nakładania, nic na wodzie/trakcie, **każdy obiekt
  osiągalny chodem od bramy lasu**.
- `terrain_forest_transitions.png` + pełne komplety blob wody i ścieżki
  (61 kafli; dekoder PNG w czystym Pythonie, bo na tej maszynie nie ma
  numpy/PIL — reguła arkusza bez zmian). Solid wody dopisany w lesie.
- Młynówka przez las do rzeki (koryto 54 kafle, 7 drzew i 7 drobnych
  obiektów usuniętych). `swiat.world`: wieś x 0, las y 4096.
- `houses3d.py`: `plot`/`zerdzie`/`wrota`/`karczma` (wiecha); plecionka
  uproszczona do pasów (51 tys. → ~13 tys. trójkątów na wieś), glb 2,55 MB.
  `props3d.py`: `chmiel`. Dekoracja `chmiel` (obrazek tylko dla 2D).
- Lore: temat Sołtysa „palisada" przepisany (id bez zmian — zapis),
  „zanim dojdziesz do palisady" → „zanim wyjdziesz za opłotki".
- Render obejrzany: nawsie, chmielnik, młyn z kołem, kuźnia, błonia,
  ujście młynówki do rzeki. ⏳ Telefonu nie mierzono. ⏳ Minimapa nie rysuje
  budynków-obiektów (podwórka widać).

---

## 2026-10-09 (17) — otwarty świat, etap 2: wieś + las jako JEDNA mapa

Plik świata Tiled `public/assets/maps/swiat.world` układa wieś (x 352 px —
11 kafli, żeby droga wsi x50–51 trafiła w drogę lasu x60–63) nad lasem
(y 3200). `src/world/WorldComposer.ts` skleja je przy starcie w jedną mapę
Tiled w pamięci (klucz `map-swiat`, 240×190 kafli); reszta silnika widzi
jedną mapę jak dotąd.
- **Sklejanie:** tilesety doklejane kopiami z nowym `firstgid`, warstwy
  łączone po nazwie, obiekty przesunięte; budynek dostaje właściwość `model`
  (stare id z mapy członkowskiej → `houses3d.glb` bez przebudowy). Portale
  MIĘDZY mapami świata znikają, `player` tylko z pierwszej mapy. Pola świata
  bez mapy → warstwa `pustka`, lita jak krawędź.
- **Stare id → świat:** `GameScene.init` zamienia `village`/`forest` (zapis,
  portal Gęstwiny, nowa gra) na `swiat` + przesunięcie pozycji. Gęstwina
  zostaje osobną mapą z portalem.
- **Obszar pod graczem** (`WorldState.region`, co 15 klatek): dźwięk tła,
  minimapa obszaru, podpis slotu zapisu (nowe OPCJONALNE `world.region`).
- Zweryfikowane w przeglądarce: przejście wieś → las chodem bez szwu
  (y 3072 → 3817, obszar przełącza się na `forest`), powrót z Gęstwiny ląduje
  w lesie z przesunięciem (7536, 5392), stary zapis wsi → świat (+352 px),
  nowa gra we wsi, minimapa lasu z właściwym markerem, `dev.missing` puste,
  `failed` 0. Na świecie: 19 NPC, 40 wrogów, 15 zwierząt, 29 budynków.
- ⚠ Zakładki zbieractwa (`Gathering`, klucz `mapId:gatunek`) startują od
  nowa — klucz `swiat:` nie zna starych `village:`/`forest:`; skutek: zioła
  odrastają od razu raz, po aktualizacji. Akceptowalne.
- ⏳ Nie mierzone na telefonie (odłączony). ⏳ Dialog „Na północ, przez most"
  i reszta pomysłów wsi (owalnica, podwórka, młynówka) — decyzje autora.

---

## 2026-10-09 (16) — otwarty świat, etap 1: grunt w oknie + sen stworzeń

Decyzja autora: świat jako jedna siatka kawałków **64×64** (jak RuneScape),
obszary ułożone w pliku świata Tiled (`.world`), płynne przejścia; ekran
ładowania tylko dla wnętrz i lochów. Etap 1 = kawałki wewnątrz jednej mapy.
- **Grunt w oknie (`WorldView3D.oknoGruntu`, `GRUNT_3D`):** płat 1024 px
  (pół kawałka) pieczony, gdy wchodzi w kadr (od razu — dziura gorsza niż
  wolniejsza klatka) albo w zapas 640 px (jeden płat na klatkę), zwalniany
  1600 px za kadrem. Płótno zwalniane po wysłaniu tekstury na kartę.
  Las: w pamięci 4–12 płatów (14,7–32,8 Mpx) zamiast całej mapy (~79 Mpx,
  ~400 MB); mapa 256² kosztowałaby tyle samo co okno. Koszt okna na S21 FE
  zmierzony: **0,05 ms/klatkę**.
- **Sen stworzeń (`AKTYWNOSC_STWORZEN.promienPx` 1200):** wróg dalej od
  gracza i NIE goniący — bez AI i bez ruchu (prędkość zerowana poza gałęzią
  AI, jak przy ogłuszeniu); efekty czasowe tykają. Promień > każdy zasięg
  wykrycia (max 230 / zerwania 420 / wołania 200 px). Model 3D dalej od
  kadru nie odgrywa animacji i nie jest rysowany. Las: 30 z 39 śpi, żaden
  śpiący się nie rusza; dzik po podejściu budzi się i goni.
- Znalezione przy okazji (NIE z tej zmiany — to samo na starym kodzie):
  szare kwadraty w lesie = 60 kafli żwiru `Teren#10/#11` w gruncie; osobne
  zadanie.
- ⚠⚠ **S21 FE przegrzany w trakcie testów:** status termiczny 4 (krytyczny),
  obudowa 47,9 °C, AP 61 °C — wieś spadła do ~107 FPS (p95 16,7) niezależnie
  od zmiany (A/B: z oknem 107, bez 109). Przy 120 FPS bateria SPADAŁA mimo
  USB (38 → 23% w ~35 min, ~0,7–0,95 A). ⏳ Ponowny pomiar na chłodnym
  telefonie; ⏳ rozważyć limit klatek (60) jako ustawienie/domyślny na telefonie.

---

## 2026-10-09 (15) — S21 FE po całym dniu 3D: zmierzone

APK z bieżącego kodu (domy-obiekty, palisada, zwierzęta wsi 3D, kuźnia,
uprawy, studnia, koło, ognisko), zapis autora (poz. 31). Pomiar rAF przez
DevTools (`adb forward` + `Runtime.evaluate`), 15 s na próbę.
- ⚠ Pierwsze próby wyszły po 60 FPS — telefon był w trybie oszczędzania
  (ekran 60 Hz, `refresh_rate_mode 0`), nie spadek. Po wyłączeniu: 120 Hz.
- **Las, 60 Hz:** postój 59,9 / p95 16,8 ms / 0 zacięć; marsz po raz pierwszy
  — 4 klatki > 33 ms (max 134 ms), dwie powtórki tej trasy — 0. Zacięcia
  JEDNORAZOWE: pierwsze wejście w nowy fragment (wysyłka tekstur, kompilacja
  shaderów). ⏳ Do wygładzenia rozgrzaniem przy wczytaniu mapy.
- **Wieś, 120 Hz:** postój 119,8 FPS / p95 8,4 ms / 0; marsz przez plac
  118 FPS / p95 8,4 / dwie klatki po 33 ms; zachód (zagrody, zwierzęta,
  najgęstsza zabudowa) 119,8 / 8,4 / 0. Sterta JS 123 MB, stała.
- Z ekranu telefonu: kadr ma ~25×12 kafli, więc bryła domu zajmuje dużą jego
  część; bladnący dach obory przy graczu zakrywa ~40% kadru szachownicą —
  działa, ale jest ciężki wizualnie (do oceny autora).
- ⚠ Build Androida z sesji: `JAVA_HOME` = JBR Android Studio
  (`C:/Program Files/Android/Android Studio/jbr`) + `JAVA_TOOL_OPTIONS`
  z wpisu 2026-10-04 (10); `window.game` w buildzie to element DOM, nie gra.

---

## 2026-10-09 (14) — palisada Zagajów (B1) jako obiekty 3D

Kolejny punkt audytu (P1.5): pierwsza rzecz z listy „brak kafli", którą 3D
odblokowało. `tools/houses3d.py` zna typy `palisada` (rząd zaostrzonych pali
~2,5 m + dwie belki od wewnątrz; wyższy chowałby fronty chałup za nim)
i `brama` (słupy, nadproże, daszek; `kolizja: false`).
- Linia y=88 jak w planie (§4.2), ale **x8–99, nie x20–80**: samokontrola
  skryptu („zamknięta brama odcina las") zaświeciła na wariancie z planu —
  wieś dało się obejść od wschodu. Dziś palisada opiera się o staw młyński
  (zachód) i krawędź mapy (wschód), trzy pnie na linii są jej częścią.
- Odcinki ≤ 11 kafli: zasłona gasi kawałek ściany przy graczu, nie całość.
- Plac ćwiczeń Patryczka leżał NA linii — Patryczek i manekin do środka.
- Pola południowe są ZA palisadą, przy lesie — zgodnie z §4.4 i z zapisem
  „palisada nie rozwiązuje problemu zajęcy".
- `?widok2d`: obiekt bez kafli pod sobą dostaje płaski zarys
  (`rysujBezKafli2D`) — inaczej palisada byłaby w 2D niewidzialną ścianą.
- Sprawdzone: render przy bramie, przejście przez bramę, BFS (brama lasu
  i pola za palisadą osiągalne), konsola czysta w obu trybach.

---

## 2026-10-09 (13) — rozstaw zachodu Zagajów NA OBIEKTACH (K3 z audytu)

Autor: „kontynuuj". Zasada rozstawu: budynek z tyłu stoi dalej niż cień dachu
budynku przed nim (`wys · 4,955 / tan 40° / 32` kafla: stodoła 8,5, obora 7,1,
chałupa 6,2–6,8). Jednorazowy skrypt przesuwa obiekt RAZEM z jego kaflami
(kolizja K3 jedzie z nimi) i odmawia zapisu, gdy nowy obrys wejdzie na wodę,
drogę, pole, drzewo, sprzęt kuźni, rekwizyt albo inny budynek, gdy jakiś
punkt wyląduje w budynku albo przestanie być osiągalny z punktu startu
(samokontrola: kurnik w stawie i krowa w stodole zapalają bramkę).
- **Stodoła Dobka** +5 na południe (y50–60): chałupa Gniewka za nią ma 8
  kafli prześwitu (było 3 — dach chował jej drzwi).
- **Kurnik** z frontu stodoły (gdzie w 3D zasłaniał wrota) na zachód od niej
  (x10–15/y44–50), kury przed nim.
- **Obora Zofii** +3 na południe (y69–77): jej dach nie chowa wrót stodoły.
- **Dom L młynarza** −6 na północ (y56–66): młyn przestał zasłaniać jego
  drzwi (prześwit 7, było 1); między domem a młynem podwórze młynarza.
- **Chałupa Dobka** +1 na wschód: kuźnia nie wchodzi jej pod front.
- Dwie beczki stały W obrysie stodoły (model wchodził w ścianę) — przed
  front; kot, dwa rumianki i dziurawiec spod nowych obrysów — obok.
- Raport po: zero budynków z ciasnym tyłem. Stan zastany zostawiony: chałupa
  Gniewka i owczarnia przykrywają narożnikami kilka kafli pola.
- Minimapa wsi przeliczona (`tools/build_minimap.py` przez zamiennik PIL
  w scratchpadzie — system nie ma Pillow; stara minimapa była nieaktualna
  już wcześniej). Modele domów bez przebiegu generatora: id i wymiary
  obiektów te same.

---

## 2026-10-09 (12) — budynki jako OBIEKTY Tiled (K4 z audytu) + geografia `swiat.md`

Autor: „popraw swiat.md i przejdź na budynki jako obiekty w Tiled".
- **`swiat.md`:** kierunki w układzie mapy (wieś na północy, las na południe,
  trakt do miasta za rzeką) — punkt P0 audytu, zapowiedziany od 2026-08-10.
- **Warstwa `budynki`** w `village-zagaje.tmj` (17 obiektów) i `forrest.tmj`
  (chata Myśliwego) + właściwość mapy `prefiks3d`. Migracja jednorazowym
  skryptem z logiki dotychczasowego generatora (zespoły kafli + `SKRZYDLA`),
  1:1; JSON mapy zapisywany bajt w bajt jak Tiled (sprawdzone przed zapisem).
- **`src/world/Buildings.ts`:** prostokąt → kolizja (ten sam przebieg co kafle,
  ciało + NavGrid) i model `dom-<prefiks>-<id>` w środku krawędzi frontu,
  z obrotem 0/90/180/270. Warstwa pomijana przy spawnach i przy
  `hasObjectLayer`. Zasłona liczona z prostokąta (niezależna od obrotu).
- **`tools/houses3d.py`** czyta obiekty (typ, dach, ściany, obrót, drzwi,
  okna, komin, klapa…); bramka sprawdzona na czerwono (nieznany typ, wrota
  poza frontem → ODMOWA, plik nietknięty).
- Dowody: wieś wygląda jak przed migracją (zrzuty, te same wysokości brył,
  plik deterministyczny — ten sam rozmiar po przebiegu tam i z powrotem);
  obrót chałupy #98 na 90° obejrzany w grze i wycofany; BFS od startu gracza
  — 47/47 punktów osiągalnych.
- ⚠ Prostokąt jest pełniejszy niż kafle (narożniki przy szczycie) — rumianek
  (45,43) wylądował w chałupie #100, przesunięty na (47,43).
- ⏳ Następny krok audytu: rozstaw zachodu wsi NA OBIEKTACH (K3), z usunięciem
  kafli przesuwanych budynków.

---

## 2026-10-09 (11) — studnia, koło młyńskie, ognisko i zwierzęta wsi w 3D (`OI-164`, `OI-161`)

Autor: „studnia, koło młyńskie, ognisko wymagają aktualizacji do 3D, tak jak
i zwierzęta ze wsi".
- **Encje jako rekwizyty:** `Well`, `WaterWheel`, `Campfire` rejestrują się
  w `PropInstances` (`studnia`, `kolo_mlynskie`, `ognisko` + `ogien`) —
  widok 3D gasi im WYŁĄCZNIE rysowanie, dotyk (gotowanie przy ognisku)
  i ciało zostają. ⚠ `resetPropInstances` stał PO tych encjach (czyścił ich
  wpisy) — przeniesiony przed studnię.
- **Ruch:** `REKWIZYTY_3D.animacje` — macierze co klatkę tylko dla tych grup.
  Koło (model ze środkiem na osi) obraca się w tempie `WATERWHEEL.revolutionMs`;
  ⚠ oś z Tiled leży 16 px w obrysie młyna, więc punkt zaczepienia to PODSTAWA
  koła (inaczej pół koła w ścianie). Płomień migocze skalą na materiale
  świecącym (`REKWIZYTY_3D.swiecace`, bez oświetlenia).
- **Zwierzęta (`tools/farm3d.py`):** krowa (łaty), byk (rogi), owca (wełna
  z szumu), baran (spiralne rogi), świnia, kura, kot w czterech umaszczeniach.
  `FarmAnimal.stan3d()` (chód / `Eat`) → `Creature3D`, jak dzik; kot dostaje
  plik ze swojego umaszczenia (klucz arkusza). Po wczytaniu modelu gaśnie
  pikselowy cień spod arkusza.
- Z renderu: krowa z łbem jelenia była mała i nisko → skala łba (długość
  i wysokość) w przekształceniu; byk miał stopień na karku (szyja szersza
  od tułowia) → przejście 1,6 j. i węższa szyja; kot — ogon za długi;
  kura — korale wisiały przed szyją.
- ⏳ Kąt kamery po domach; ⏳ pomiar S21 FE (15 stworzeń 3D we wsi);
  ⏳ świnia ma jeszcze dziczy, spiczasty ryj; lekkie załamanie na karku byka.

---

## 2026-10-09 (10) — domy 3D: cała wieś i chata Myśliwego (`OI-164`)

Autor: „przejdźmy do domów 3D, a potem będziemy myśleć, jak to wygląda" —
dzisiejsze bryły z kafli są skutkiem braku assetów (generator nie umiał
budynków modularnych, stąd szablony L/T w Tiled), dopasowanie bryły
zostawione nam.
- **`tools/houses3d.py`** — jeden model na budynek, nazwany obrysem zespołu
  kafli `dom-x0-y0-x1-y1` (ten sam zespół i ta sama kotwica, co liczy
  `WorldView3D.wyodrebnij`). Generator CZYTA MAPĘ: obrys = prostokąt
  zespołu (kolizja K3 liczy go tak samo), drzwi/wrota/okna/komin/klapa
  z kolumn w `buildings-detale`/`-over`, ściany z bali przy kaflach
  `sciana*`, inaczej z desek; kalenica wzdłuż X przy kaflach `kalenica*`,
  inaczej szczyt do gracza. Ręcznie (`SKRZYDLA`) tylko podział zespołów
  złożonych: stodoła + kurnik, dom L (tylne skrzydło X + skrzydło
  szczytowe Y; dachy przenikają się w 3D same, bez kafli kosza).
  16 budynków: 15 we wsi + chata Myśliwego w lesie, 1,5–6,4 tys. trójkątów.
- Silnik: zespół z modelem pod swoją nazwą → model, billboard gaśnie; bez
  modelu (zespół zmieniony w Tiled) → billboard jak dotąd. Domy: bez
  rozrzutu, bez plamki cienia, **osobny materiał bez kołysania** (dach na
  40 j. bujałby się o ~0,5 j.).
- ⚠⚠ **Zasłony dla domów:** test liczył bryłę jak drzewo — wycentrowaną
  w punkcie zaczepienia. Dom stoi punktem na FRONCIE i sięga 7–11 kafli
  w głąb, więc gracz za chałupą znikał pod dachem, a dach nie bladł.
  `zaslania(..., tyl)` liczy grunt [front − głębokość, front].
- Z renderu: jednolita płyta strzechy czytała się jak blacha → łaty wiązek
  w pasach; komin daleko od kalenicy wychodził jako ciemna szczelina →
  przy kalenicy, jasny kamień, czapka.
- ⏳ Dachy przy kącie 40° zajmują dużo ekranu — wraca pytanie o kąt
  kamery (autor: „potem będziemy myśleć, jak to wygląda"). ⏳ Koło młyńskie
  dalej billboardem. ⏳ Pomiar S21 FE.

---

## 2026-10-09 (9) — wieś w 3D: kuźnia i pola (`OI-164`)

Autor: „kontynuujmy przechodzenie z 2D na 3D" → wybór „drobne braki we wsi".
- **Kuźnia:** osiem modeli w `tools/props3d.py` (piec, kowadło, osełka, miech,
  stojak narzędzi, stojak broni, worek węgla, stół z imadłem), sylwetki
  z `Kuznia.png`. Kafle `Kuznia` idą tą samą drogą co ławki i płot z
  `Buildings` — `REKWIZYTY_3D.kafleKuznia`; piec 2×2 = model na lewym dolnym
  kaflu przesunięty o kafel, trzy pozostałe ćwiartki gasną razem z nim.
  ⚠⚠ Piec z osobnych ścian (płaski kolor na kamień) wyszedł w grze z
  zielonymi pasami: `do_blendera` robi `normals_make_consistent`, a dla
  wyspy z jednej ściany „na zewnątrz" jest niejednoznaczne — Blender
  odwracał co drugi kamień i przez dziurę było widać trawę. Na renderze
  w Blenderze tego nie było widać (workbench rysuje obie strony). Siatka
  dostaje flagę `bez_wyrownania`; domyślne zachowanie bez zmian.
  ⚠ Pierwszy piec (stożek, kursy przesunięte o pół kamienia) czytał się jak
  szyszka i miał szczeliny między kursami — dziś kopuła ze wspólnymi
  pierścieniami.
- ⚙ **Poprawka po zrzucie autora (tego samego dnia):** piec-„ul" był kopią
  sylwetki z grafiki Gemini i tak piece kowalskie nie wyglądały — dziś
  PALENISKO: kamienny blok do pasa z żarem na wierzchu, tylna ściana,
  gliniany okap na dwóch słupach i komin, otwór dyszy od strony miecha.
  Stojak narzędzi (młotki na cienkich trzonkach „wisiały w powietrzu") →
  REGAŁ z czterema półkami, narzędzia leżą. Stół z imadłem czytał się jak
  żerdź płotu — blat 3,6 → 4,6 j. głębokości, grubszy i jaśniejszy.
- **Pola:** dziesięć rodzajów upraw (zboże dojrzałe/zielone, ściernisko, len,
  nać gęsta/niska/cebulowa, kapusta w trzech fazach) × 3 kształty, jeden model
  na kafel `Pole` w warstwie `uprawy` (`REKWIZYTY_3D.kafleUprawy`), bez
  rozrzutu i bez cienia. ⚠ Same źdźbła nad gołą ziemią czytały się jak rzadki
  zagon — **płaski obrazek upraw zostaje pod modelami** jako podłoże (masa
  koloru), model daje wysokość; gracz stoi w dojrzałym zbożu po pas.
  Budżet: źdźbło = 2 trójkąty, kłos = 6; kafel zboża 288 trójkątów.
- **Koszt (pulpit, wieś):** uprawy 752 egzemplarze w 46 grupach, ~164 tys.
  trójkątów (reszta rekwizytów i drzew ~537 tys.); kuźnia ~2 tys.
  ⏳ Pomiar na S21 FE.
- ⏳ Zostaje: ognisko (encja z animowanym płomieniem — nie wejdzie drogą
  rekwizytów), chata Myśliwego i domy 3D, Gęstwina.

---

## 2026-10-09 (8) — `OI-81` zamknięte: rozstrzygnięte już 2026-09-07

Stary `docs/architektura.md` ma od migracji 2026-09-07 nagłówek `HISTORIA`,
`zastapiony` i następcę — czyli pierwszy wariant z opisu `OI-81`. Pozycja wisiała
otwarta, bo nikt jej nie odhaczył. Przegląd odwołań: żadne nie cytuje go jako reguły.

---

## 2026-10-09 (7) — `OI-23` domknięte: asercja katalogu, która nie mogła zaświecić

`katalog_ekwipunku.mjs` sprawdzał lustro wzoru redukcji liczbą „pełna stal = 53,3%”
z ręcznej listy czterech sztuk (tabela liczy pięć). Dziś wczytuje `Protection.ts`
esbuildem i porównuje lustra `redukcja`/`pktPrzeciw` z `reductionFromPoints`/
`armorPointsAgainst` (401 próbek; 4 profile × 4 typy). Sabotaż (K+1, ×1,01)
świeci na czerwono obiema asercjami. Raport: 0 bloków do odświeżenia.

---

## 2026-10-09 (6) — komentarze, które kłamały o kodzie (`OI-32`, `OI-75`, `OI-23` część)

- `OI-32`: `SHIELD` w `GameConfig` — poza i ukorzenienie POKRYWAJĄ się, nie są równe.
- `OI-75`: `MapBuilder.nav` i `MovementContext.nav` — siatka jest CZYTANA (6 miejsc).
- `OI-23` A-9: `src/entities/CLAUDE.md` — profil mnoży punkty ochrony, więc stal
  zjadałaby ranę, a nie ją zwiększała. A-14 (asercja w katalogu) zostaje.

---

## 2026-10-09 (5) — drobnica: przymiar dźwięku (`OI-55`), komentarz Mastery (`OI-31`)

- `tools/audio_przymiar.mjs` — tabela głośności = generator = pliki (21/21/21),
  sabotaż S1 (usunięty plik) i S2 (klucz bez pliku) świeci na czerwono.
- Nagłówek `WeaponProficiency.ts` przestał twierdzić, że ładunki rang nie są
  wdrożone — są (`effortReduction`, `traitMultiplier`, `critLowCut`,
  `minimumFromRank`, czytane przez `Progression`).

---

## 2026-10-09 (4) — ustawienia dźwięku (`OI-56`) i „Wyjdź z gry”

- **`core/Settings.ts`** — ustawienia URZĄDZENIA (własny klucz `localStorage`,
  poza slotami zapisu, nie resetuje ich „Nowa gra”): `sound`, `ambient`.
  `Sfx` słucha `settingsChanged`: wyciszenie przez `sound.mute` menedżera, tło
  włącz/wyłącz na żywo z pamięcią pętli mapy (`mapAmbient`).
- **Menu główne:** nowe „Ustawienia” (dwa przełączniki ze stanem w napisie,
  „Odgłosy tła” przygaszone przy wyciszonej grze) oraz **„Wyjdź z gry” —
  wyłącznie w aplikacji** (`App.exitApp()`; strona nie zamknie własnej karty).
  Bez potwierdzenia — autozapis leci przy każdej zmianie. Rozstaw menu nie
  wchodzi już na tytuł przy pięciu pozycjach.
- **W grze:** te same przełączniki po prawej stronie zakładki ZAPIS.
- Sprawdzone w Browser pane na 891×411: menu, przełączanie, zapis ustawień,
  przetrwanie przeładowania, zakładka ZAPIS bez nakładek. ⚠ Wyjście z gry
  i faktyczny odsłuch — tylko na S21 FE (pane nie dekoduje audio).

---

## 2026-10-09 (3) — paczka drobnych błędów: OI-58, OI-62, OI-52, `dt` w `Character3D`, OI-55

Wszystkie cztery „decyzje autora” z audytów przyjęte w oczywistym wariancie
(autor zlecił paczkę błędów bez rozstrzygania każdego osobno).

- **OI-58** — częściowe podniesienie zostawia resztę na ziemi (`Loot.take`).
  Silnik: 5 sztuk przy miejscu na 3 → 3 w plecaku, 2 na ziemi; pełny plecak →
  bez zmian; po zwolnieniu miejsca reszta wchodzi i znalezisko znika.
- **OI-62** — `NodeSpawner.collect` woła `Gathering.record`; zegar odrostu
  startuje od zebrania. Silnik: brak zakładki przed zbiorem, po zbiorze 3
  stojące bez zebranego stanowiska.
- **OI-52** — nowe `src/ui/KeyFocus.ts`: właściciel ekranu + zużycie
  naciśnięcia. Silnik (8 kroków): `E` zamyka rozmowę bez ponownego otwarcia,
  `C`/`B` nie otwierają panelu na rozmowie, `E` nie zaczyna rozmowy pod
  panelem, `ESC` zamyka to, co jest na wierzchu. ⚠ `Q` (szybki slot) celowo
  nietknięty — poza zakresem zgłoszenia.
- **`Character3D`** — `dt` ograniczone do 0,1 s jak w `Creature3D` (złapane
  rano: po 20 s rozmowy mikser przeskakiwał o 20 s).
- **OI-55 ZAWĘŻONE, nie naprawione** — okazało się nieaktualne: `dodge.wav`
  i `parry.wav` są od 2026-09-08 (`c5e1d4e`), roster 21 = 21 plików. Zostaje
  brak przymiaru. ⚠ W Browser pane audio się nie dekoduje (dotyczy WSZYSTKICH
  kluczy), więc odsłuch tylko na urządzeniu.

Bramki: `tsc` ✓ · `build` ✓ · `zapis_weryfikacja` 59/59 · `combat_regresja`
121 bez różnic · `doc_check` 0 błędów. ⚠ S21 FE niesprawdzony.

---

## 2026-10-09 (2) — cios na stojąco zostawia postać zwróconą do celu (`OI-146`)

Autor: „skakanie między pozycjami w walce wygląda dziwnie”. Po ciosie w cel pod
kątem `guardKat` wracał z `attackRad` na `zwrotRad` (kierunek ostatniego marszu):
model skakał cios → stary zwrot → cios, tarcza między ciosami kryła drogę, którą
gracz przyszedł, a bramka następnego ciosu liczyła kąt od niej.

- `Player.triggerAttack`: przy `!movingInput` zwrot = `attackRad` (przez `ustawZwrot`,
  dalej jedyny zapisujący). W marszu nic się nie zmienia — rozdział chroni bieg.
- ⛔ Nie jest to auto-obrót do celu z przed 2026-08-23: `canStrikeFacing` stoi
  przed zamachem, więc obrót zostawia tylko cios, który legalnie padł z przodu.
- Zmierzone w Browser pane (manekin): cel 40° → po 1. ciosie zwrot i osłona 40°
  przez 5 kolejnych zamachów; cel 179° → 0 zamachów. `tsc` ✓, `build` ✓,
  `combat_regresja` 121 przypadków, zero różnic. ⚠ Odbiór na S21 FE niesprawdzony.
- ⏳ Autor dorzucił szerzej: „przy świadomości zagrożenia, jeśli jest stargetowane,
  powinniśmy się do niego zwracać”. To już obrót BEZ ciosu — koliduje z decyzją
  2026-08-23 (okrążanie watahy bez konsekwencji). Warianty: A — zostaje jak jest,
  B — powolny obrót z limitem °/s (okrążanie dalej kosztuje), C — natychmiastowy.
  ⚙ ODŁOŻONE przez autora: decyzja 08-23 dotyczyła 2D i ataku 4-kierunkowego,
  wraca do oceny po wdrożeniu 3D.

---

## 2026-10-09 — Rozmowa: lista tematów zamieniona w przebieg rozmowy (`OI-87`, część)

Decyzja autora: **panel zostaje tego samego rozmiaru (816×470) i bez podziału
na kolumny — zmienia się tylko lista.** Model danych i treść 73 tematów
nietknięte (`docs/decyzje/2026-09-08-prezentacja-przed-modelem-danych.md`).

### Co się zmieniło (`src/ui/TopicPanel.ts`, przepisany; `NpcDialog` +2 drobiazgi)

- Ekran pokazuje **chwilę**: kwestia gracza (kursywa) → wypowiedź NPC (14 px,
  szpalta 580 j.) → pytania pod spodem. Na start mówi **powitanie z hubu**
  (ta sama chwila, nie powtórka — `NpcDialog.openView` podaje je widokowi).
- Pytania = front (`available ∧ ¬asked`), **kontynuacje bieżącego tematu
  pierwsze i w złotej ramce**, najwyżej 3 naraz + wiersz „Zapytaj o coś
  innego… (n)" przy szerszym froncie.
- Już zadane → **archiwum** pod przyciskiem w lewym dolnym rogu. Escape/`E`/
  Android Back i „← Wróć" cofają o JEDEN krok (archiwum → rozmowa → hub):
  `DialogView.back?(): boolean`.
- Pytania stoją tuż pod wypowiedzią; przy długiej wypowiedzi przyklejają się
  do dołu, a wypowiedź się przewija — **okno kończy się na całym wierszu**
  (ucięty wiersz złapany na zrzucie 891×411).
- `**słowo**` w tekście nie wychodzi już na ekran jako gwiazdki (4 odpowiedzi).

**Weryfikacja:** `tsc` ✓ · `build` ✓ · runtime w Browser pane na 891×411:
Patryczek (kontynuacje, front 4 → stronicowanie), Myśliwy `ojciec_wojsko`
(699 znaków → przewijanie, pytania przypięte), Wdowa (koniec rozmowy),
archiwum + Escape. Zero błędów w konsoli. ⚠ **Odbiór na S21 FE niesprawdzony.**

⭐ **Browser pane URUCHAMIA grę**, wbrew dotychczasowej notatce: pane nie
odpala `requestAnimationFrame`, ale wystarczy z konsoli
`game.loop.raf.stop(); game.loop.raf.start(game.loop.step.bind(game.loop), true, 16)`
— pętla na `setTimeout`, ~30–40 FPS, pełna rozgrywka.

### Pomiary tej sesji (przed zmianą)

- **Łańcuchy:** 27/73 odpowiedzi (37%) otwiera temat u tej samej osoby,
  43/73 nie otwiera niczego, 12 powiązań między osobami (7 od Myśliwego).
  U 15/19 osób pierwsza wizyta to 1–3 wymiany.
- ⚠ **KOREKTA audytu 09-08: front NIE jest zawsze ≤ 3.** Patryczek dochodzi do
  4 w jednej wizycie; bramki świata (zadania, zioła) piętrzą się między
  wizytami do 7 (Zielarka), 5 (Myśliwy), 4 (Ojciec).
- **Tekst na telefonie (891×411):** UI wirtualnie 1257×580, 1 j. = 0,7086 px
  CSS → dawne 12 px = **8,5 px CSS**. Najdłuższa odpowiedź: 13 wierszy
  w starej kolumnie 378 j.
- **Pauza rozmowy (zmierzone w obu trybach):** logika, zegar sceny, miksery 3D,
  kamera — stoją; renderowanie trwa co klatkę (w `?widok3d` pełna scena
  three.js, ~20,5 tys. trójkątów na klatkę dla nieruchomego obrazu).
- ⚠ Przy okazji: `Character3D` nie ogranicza `dt` — po 20 s rozmowy mikser
  przeskoczył o 20 s w pierwszej klatce (`Creature3D` ma limit 0,1 s).
  Nienaprawione.

---

## 2026-10-06 (4) — kolizje budynków Zagajów (K3 część 2)

Autor: zostało ~31% tygodniowego limitu — „zmiany, które dadzą najwięcej małym
kosztem". Przez każdy dom we wsi dało się przejść. Jednorazowym skryptem
tileset `Buildings` w `village-zagaje.tmj` dostał `solid` na wszystkich 87
kafla użytych w `buildings`, `buildings-detale`, `wyposazenie`
i `buildings-over` (ściany, wiaty, dachy, drzwi, okna, ławki, koryta, płot
zagrody, beczki) — dach liczy się jako bryła domu, bo w 3D obrys domu to cały
prostokąt, nie sama ściana frontowa. 923 lite komórki. Kontrola: nikt nie
stoi w ścianie (poza kołem młyńskim, które jest PRZYKLEJONE do młyna i nie ma
ciała), wszystko osiągalne BFS-em z punktu startu, samokontrola świeci na
czerwono. Chata Myśliwego w lesie bez zmian (kolizja jest kluczowana
`nazwaTilesetu#id` per mapa). ⏳ Odbiór z ręki: czy dach jako bryła nie
zabiera za dużo przejścia „za domem".

---

## 2026-10-06 (3) — „drzewa są i 2D, i 3D": billboard zgaszony tylko w pamięci

Zrzut autora z telefonu (brama płd. wsi): obok modeli stały pikselowe świerki
i korony. Dane mapy były czyste (każdy pień rozpoznany, zero grup bez pnia,
zero kafli drzew poza `trees-*`), a w okolicy żaden billboard nie był
„niezgaszony" — dopiero schowanie wszystkich partii billboardów usunęło
piksele. ⚠⚠ Przyczyna: w `aktualizujBillboardy` wysyłka buforów instancji na
GPU (`needsUpdate`) stała PRZED blokiem statycznych billboardów, więc
zgaszenie billboardu drzewa (model stanął) zmieniało macierz tylko w pamięci.
Gasły wyłącznie te, których partię przypadkiem odświeżyło coś innego w tej
samej klatce. Naprawione kolejnością. Przy okazji kafle koron „rozlane" pod
pień drzewa z modelem idą do płaszczyzny kępek zamiast płasko w grunt (we wsi
0 takich, ale reguła progu domu nie może ich łapać).

---

## 2026-10-06 (2) — wieś wchodzi w 3D: leśny grunt, kępki, rekwizyty

Autor: „wioska korzysta ze starego Nature, blend drzew 2D i 3D, ziemia inna niż
w lesie — widok 3D powinien powoli ogarniać wioskę". Punkty 1–3:
- **Grunt jak w lesie.** `village-zagaje.tmj` dostał (jednorazowym skryptem,
  na końcu listy — żadne istniejące id się nie przesunęło) tilesety
  `ForestGround` @964 i `ForestTransitions` @970; `ground` Teren#0–5 →
  ForestGround#0–5 (ten sam układ pikseli, leśna paleta), `water`/`path` →
  przejścia z wybitą starą trawą. `tools/build_terrain_forest_transitions.py`
  liczy dziś zbiór kafli z OBU map (wieś dołożyła 5 kafli dróg); 63 kafle lasu
  bajt w bajt identyczne. ⚠ Skutek uboczny = pierwsza część K3: woda we wsi
  (128 komórek) jest lita jak w lesie — skrypt sprawdził BFS-em od punktu
  startu, że każdy obiekt jest osiągalny (i że kontrola świeci na czerwono).
- ⚠ Python systemu nie ma Pillow ani numpy (generatory ich wymagają) —
  generator puszczony Pythonem Blendera (numpy) z zastępczym `PIL.Image`
  w scratchpadzie; zgodność dekodera potwierdzona porównaniem arkuszy.
- **Kępki i krzaczki z kafli** `Nature` 0–26 (warstwy `undergrowth`/`bushes`,
  wieś i las) → modele (`kepka_trawy` ×3 kształty, `krzew_kopula_maly` w skali
  z kafla, `REKWIZYTY_3D.kafleNiskie`). Pieczone do OSOBNEJ płaszczyzny, która
  gaśnie dopiero, gdy modele stanęły. Wieś: 539 sztuk.
- **Rekwizyty wsi:** stóg, strach na wróble, 3 ule (kłody bartne ze słomianym
  daszkiem, wylot do kamery) jako `DECOR_PROPS` (9/9); ławki, beczki, koryta
  i płot zagrody z kafli `Buildings` (`REKWIZYTY_3D.kafleBuildings`) —
  wycięte z billboardów budynków do własnych obiektów. Płot `dokladne`:
  segment = dokładnie kafel, zero rozrzutu (inaczej szpary).
- ⚠ Z renderu: dom kuźni zrośnięty ze sprzętem ma prostokąt daleko poza
  ściany i bladł, gdy gracz stał OBOK. Billboardy mają dziś drugi stopień
  testu zasłony — alfa piksela obrazka w miejscu tułowia/głowy gracza.
- ⏳ Zostaje: sprzęt kuźni (tileset `Kuznia`), pola/uprawy (płasko),
  domy 3D, kolizje budynków (K3 część 2), Gęstwina (dalej stary `Teren`).

---

## 2026-10-06 (1) — widok 3D DOMYŚLNY: tap w cel, napisy, woda

Autor: „przejdźmy do realizacji 2" (domknięcie widoku 3D), potem wieś.
Spadków w grze nie czuje — pomiar S21 FE pominięty.
- **Tap w cel:** obszar trafienia duszka leży w ściśniętej kamerze (×sinθ),
  a w 3D widać więcej — stuknięcie w głowę wilka/NPC-a trafiało w pustkę.
  Dziś rozciągany w górę od stóp: billboard (NPC, ognisko) ×1/sinθ, model 3D
  ×cosθ/sinθ (1/sinθ dawało wilkowi obszar dwa razy wyższy niż on sam).
  ⚠⚠ Phaser przy KAŻDEJ zmianie klatki przywraca wysokość obszaru z klatki
  (`setSizeToFrame`), zostawiając przesunięte `y` — obszar odjeżdżał nad
  stopy. Stąd `customHitArea = true`. Zmierzone: jeleń trafia od stóp po
  poroże, Hanna (132 px na ekranie) na całej wysokości.
- **Napisy i paski:** liczby obrażeń, imiona i paski HP rozciągane w pionie
  o 1/sinθ na czas rysowania (przywracane po renderze) — były spłaszczone o 36%.
- **Woda:** grunt pieczony w trzech płaszczyznach (spód / woda / wierzch:
  piasek brzegu leży NAD wodą w kolejności warstw), woda z shaderem —
  falowanie ~1 px tekstury i refleksy z pozycji w świecie. ⚠ Iloczyn dwóch
  podobnych fal dawał okrągłe „groszki"; dziś wydłużone, porwane pasma.
- **Widok 3D domyślny:** `WorldView3D.wlaczony` = prawda, 2D wyłącznie jako
  ścieżka awaryjna `?widok2d` / `VITE_WIDOK3D=0`; `dev.widok3d.wylacz()`.

---

## 2026-10-05 (9) — zasłony: cały obiekt blednie, koniec stałego okręgu

Autor z gry: „ten blur wokół postaci w kształcie stałego okręgu psuje
imersję". Był to prześwit z prototypu: szachownica w promieniu 46 px wokół
gracza na WSZYSTKIM, co stało bliżej kamery — także na krzakach i ziołach,
które nikogo nie zasłaniają, i niezależnie od tego, czy coś gracza zakrywało.
- Dziś (`ZASLONY_3D`, `Trees3D.zaslania`): obiekt blednie, gdy NAPRAWDĘ
  przykrywa tułów — kamera ortogonalna pochylona o θ, więc punkt na wysokości h
  wypada na ekranie tam, gdzie grunt o h/tanθ na północ; bryła o wysokości H
  i półszerokości r przykrywa pas `zB + r … zB − r − H/tanθ`. Billboard stoi
  równolegle do ekranu: jego h przykrywa h/sinθ.
- Blednie CAŁY (atrybut `aZanik` per instancja / per billboard, dithering
  Bayera 4×4 do krycia 0,38, wejście i wyjście 150 ms) — bez sortowania
  przezroczystości, więc kępy jednej korony nie prześwitują przez siebie.
- Obiekty niższe niż 0,9 wzrostu gracza nie bledną nigdy (krzaki, kamienie,
  zioła, flora). Koszt: test kilku tysięcy egzemplarzy na klatkę na CPU.
- Grupy instancji dostały własne geometrie dzielące TE SAME bufory
  wierzchołków (wysyłane raz) — dochodzi tylko atrybut zaniku.

---

## 2026-10-05 (8) — las DOKOŃCZONY w 3D (flora wodna, pniaki, drewno, drobiazgi)

Autor: „dokończmy las przed pomiarem, żeby sprawdzić realnie, na ile sobie
jeszcze możemy pozwolić". `tools/props3d.py`: **111 kształtów, 827 KB**.
- Flora wodna: pałki (źdźbła + brązowa kolba), trzciny (wiecha), kępy
  bagienne (rdzawe końcówki), rośliny brzegowe — po 3 kształty. Źdźbło to
  liść `lisc` wyciągnięty stromo w górę.
- Pniaki: 7 gatunków × 3 stany (świeży jasne słoje / zwietrzały szary,
  poszarpany / stary zgniły z mchem), kora z palet `tree3d.GATUNKI`, pniak
  z siekierą. Kłody i stosy: ścięte końce ze słojami (`denko`), stosy końcami
  do kamery. Grzyby, lilia (płaski liść z wcięciem + kwiat), suszona skóra na
  stelażu.
- `REKWIZYTY_3D.bezObrotu` (kłody, stosy, stelaż — kierunek z Tiled) i
  `REKWIZYTY_3D.plaskie` (brzeg stawu — namalowana łacha kładziona PŁASKO;
  stojący billboard sterczał z wody).
- ⚠ Z renderu: stos z kłód 8–11 j. uciekał w głąb kadru i stał jak wieża
  (dziś 4,5–5,5 j.); korzenie z ostrym zwężeniem czytały się jak kolce.
- Las: **1030 / 1032 rekwizytów** jako modele (2 = brzegi stawu, płasko),
  1017 / 1017 drzew, 610 grup instancji. Zostają 2D: ognisko (encja z
  animacją ognia), chata Myśliwego (kafle), warstwy gruntu.

---

## 2026-10-05 (7) — rekwizyty 3D: krzewy, kamienie, zioła

Autor: „wypadałoby zrobić pozostałe obiekty na mapie" → „tak, plus zioła".
- `tools/props3d.py` → `public/assets/props/props3d.glb` (530 KB, meshopt):
  11 krzewów (kopuły, jagodowy/kwitnący z kulkami, gałęziste z kępkami na
  witkach, suchy, niski, chrust z leżących patyków), 5 klas kamieni (bryła
  ścięta płaszczyznami — fasety, mech na górnych ścianach), 11 ziół (łodygi,
  liście, kępka przy ziemi, kwiat wg gatunku: kulki / baldach / kłos / dzwonki
  / koszyczek). 59 kształtów. Klocki importowane z `tree3d.py` (main za
  `__name__`), żeby krzew i drzewo nie miały dwóch stylów.
- Rekwizyty: `GameScene` rejestruje każdy `DECOR_PROPS` w
  `src/world/PropInstances.ts`; `Trees3D` stawia instancję modelu o nazwie
  obiektu z Tiled bez numeru (`kamien_drobny_04` → `kamien_drobny`).
  Las: **743 / 1032** rekwizytów jako modele (reszta: flora wodna, pniaki,
  drewno, grzyby — świadomie na później).
- Zioła: OSOBNA, dynamiczna ścieżka — `Gatherable` znika po zbiorze i odrasta,
  więc model idzie za duszkiem co klatkę (alfa → wzrost/zanik, `scaleY` →
  kurczenie przy zbiorze, `angle` → kołysanie). Duszek zostaje do tapnięcia.
  Poświata „gracz blisko" (`postFX` duszka, w 3D niewidoczna) → pulsująca
  emisja modelu (`Gatherable.blisko`, `REKWIZYTY_3D.poswiata`).
- ⚠ Wyszło na zbliżeniu: zioło z samych łodyg i liści było patykiem z kropką
  — dopiero kępka liści przy ziemi dała mu masę; kępki krzewu gałęzistego przy
  20 ścianach czytały się jak kanciaste lizaki; płaski krzew z kopuły był o 50%
  za wysoki (stała kępa szczytowa 0,66 korony) — dziś układ `luzny`.
- ⚠ Grupowanie rekwizytów w kwadraty 1024 jak drzew dało **675 grup** (37
  kształtów po kilka sztuk) — dziś 2048 px, 500 grup. ⏳ Pomiar S21 FE.

---

## 2026-10-05 (6) — drzewa 3D na S21 FE: zmierzone

APK z `VITE_WIDOK3D=1` (24,5 MB, `trees.glb` z meshopt w paczce), `adb install -r`
na zapisie autora (poz. 29). Pomiar rAF przez DevTools Protocol, 15 s na próbę,
ekran 120 Hz, bateria 15% na ładowaniu USB (może zaniżać):

| miejsce | FPS | p50 | p95 | max | > 17 ms | > 33 ms |
|---|---|---|---|---|---|---|
| Zagaje, brama płd., postój | 119,8 | 8,3 | 8,4 | 8,5 | 0 | 0 |
| las, wejście płn., postój (1) | 118,9 | 8,3 | 8,4 | 33,5 | 3 | 2 |
| las, wejście płn., postój (2) | 119,8 | 8,3 | 8,4 | 8,5 | 0 | 0 |
| las, MARSZ 14 s w głąb | 110,6 | 8,4 | 16,7 | 16,8 | 0 | 0 |

W marszu ~7% klatek spada na próg 60 Hz (jedno pominięte odświeżenie), zero
klatek ponad 17 ms — bez zacięć. ⏳ Nie rozdzielone, czy to drzewa, czy sam
marsz (brak pomiaru marszu z billboardami); do sprawdzenia przy następnym
pomiarze, najlepiej na pełnej baterii.
- ⚠ Budowanie APK z sesji: `gradlew` potrzebuje `JAVA_HOME` = JDK z Android
  Studio (`C:\Program Files\Android\Android Studio\jbr`) obok
  `JAVA_TOOL_OPTIONS` z 2026-10-04. `Start-Process -Wait` czeka też na demona
  Gradle — APK jest gotowy dużo wcześniej, niż polecenie wraca.
- ⚠ Ładowanie gry na telefonie trwa dłużej niż wygaszanie ekranu — telefon
  zablokował się w trakcie; odblokowanie robi autor.

---

## 2026-10-05 (5) — drzewa 3D: różnorodność („wyglądają bardzo podobnie")

Autor po obejrzeniu lasu: „jest lepiej, chociaż drzewa wyglądają bardzo
podobnie". Przyczyna: wszystkie liściaste szły JEDNYM przepisem (kopuła kęp),
po jednym kształcie na gatunek × rozmiar, a egzemplarze różnił tylko obrót,
skala ±10% i jasność ±8%.
- **Sylwetka jako dane gatunku** (`uklad` w `tools/tree3d.py`): dąb
  `rozlozysty` (szeroki pierścień osobnych kęp, prześwity na konary), olcha
  `kolumna` (słup ze szpicem), brzoza `luzny` (kępy z przerwami), grab
  wysoki owal (`ring_z`/`ring_r` kopuły), buk kopuła. Palety rozsunięte:
  buk jasny limonkowy, dąb ciemna oliwka, grab chłodna zieleń, olcha
  niebieskozielona, brzoza żółtozielona.
- **Dwa kształty** na gatunek × rozmiar (`buk_duzy`, `buk_duzy_2`; 78 obiektów),
  wybór po położeniu. Eksport z **meshopt** (`EXT_meshopt_compression`): 78
  kształtów = 1,37 MB, tyle co wcześniej 39 bez kompresji. ⚠ `Trees3D` musi
  dawać loaderowi `MeshoptDecoder`, inaczej plik się nie wczyta.
- **Egzemplarz**: jasność ±12%, odcień ±7% (cieplej/chłodniej), szerokość ±12%
  i wysokość ±8% niezależnie (`GameConfig.DRZEWA_3D`).
- ⚠ Olcha w pierwszej palecie wyszła prawie czarna (kolumna czytała się jak
  dziura w kadrze) — rozjaśniona.

---

## 2026-10-05 (4) — drzewa 3D: wszystkie gatunki, wieś i Gęstwina

Autor po pilocie: „lepiej pasują do gry niż płaskie assety". Dalej tym torem:
- `tools/tree3d.py`: **13 gatunków × 3 rozmiary = 39 wariantów** — doszły dąb,
  grab, olcha (przechył pnia), brzoza (plamy kory w kolorach wierzchołków),
  wierzba (spód kęp opada kurtyną, pionowe pasma witek) i owocowe wsi: jabłoń,
  śliwa, grusza (owoce jako osobne kulki). Referencja sylwetki i barwy =
  stemple `tree_stamps.png`. Budżet 3200 trójkątów trzymany liczbą kęp, nie
  podnoszeniem progu. Świerki zwężone (0,30 → 0,22 H) pod pixel-art.
- ⚠ Wierzba w pierwszej wersji czytała się jak STÓG: kurtyna do ziemi chowała
  pień. Dziś kończy się na 0,30 H (`zwis_min`).
- **Drzewa z kafli** (Zagaje, Gęstwina): dolny rząd drzewa w `Nature` jednoznacznie
  wskazuje gatunek i rozmiar → `DRZEWA_3D.kafleNature`; `WorldView3D` przekazuje
  je do `Trees3D`, billboard gaśnie dopiero, gdy model stanął.
- Wynik: las **1017/1017**, Zagaje **284/284**, Gęstwina **476/476**.
  `dev.missing`/`totalFailed` puste, build czysty.
- ⏳ `trees.glb` ma już **1,3 MB** (39 wariantów, bez kompresji) — kandydat na
  meshopt/kwantyzację przed APK. Pomiar S21 FE wciąż otwarty.

---

## 2026-10-05 (3) — drzewa 3D: pilot (buk, świerk) w widoku 3D

Prośba autora: „popracować nad wioską", a skoro idziemy w widok 3D (`OI-164`),
to wioska jako początek migracji — **zaczynając od drzew**, bo dają najwięcej
w obu lokacjach. Styl wybrany przez autora: **stylizowane jak Wild Rift**.
- Przy okazji zmierzone: **Zagaje nie mają ANI JEDNEGO kafla kolizji** —
  żaden z sześciu tilesetów `village-zagaje.tmj` nie ma `solid` ani kształtu;
  przez każdy dom i przez rzekę da się przejść (blokuje tylko studnia). K3
  z `wioska_plan.md` stoi otwarte.
- `tools/tree3d.py` (Blender bez okna) → `public/assets/trees/trees.glb`
  (~200 KB): `buk_*` i `swierk_*` w trzech rozmiarach (28 / 20 / 13 j. —
  2,2× / 1,6× / 1× wzrostu gracza). Styl robią dwie rzeczy, nie geometria:
  normalne korony z gradientu elipsoidy CAŁEJ korony (kępy cieniują się jak
  jedna masa) i kolor = albedo + zapieczone zacienienie, nigdy kierunek światła.
- `src/render3d/Trees3D.ts`: stempel z modelem → instancja (grupy po wariancie
  × kwadrat 1024 px, żeby odcinanie kadru działało), rozrzut skali/obrotu/jasności
  z położenia, cień-plamka, kołysanie i prześwit wokół gracza w shaderze.
  `TreeLayer` wystawia `treeInstancesFor(scene)`; kolizja pnia bez zmian.
  Liczby w `GameConfig.DRZEWA_3D`. Las: **594 / 1017** drzew jako modele,
  73 grupy; reszta gatunków zostaje billboardem (podgląd wszystkich liściastych
  jako buk: `?widok3d&drzewa3d=wszystkie`).
- ⚠ Wyszło dopiero na zbliżeniu: `bmesh.ops.create_icosphere(subdivisions=2)`
  w Blenderze 5 to **80 ścian** — obrys korony kanciasty. Duże i średnie mają
  dziś 3 (320 ścian/kępę, duży buk 3064 trójkąty), małe 2.
- ⚠ Harness: w ukrytym panelu pętla gry stoi (~3 FPS), a scena przechodzi dalej
  praktycznie tylko przy zrzutach — `scene.restart` przed końcem `BootScene`
  daje awaryjną mapę 640×480 i „Missing animation".
- ⏳ Pomiar na S21 FE, pozostałe gatunki (brzoza, dąb, grab, olcha, wierzba),
  drzewa z kafli `Nature` we wsi i w Gęstwinie, zasłony (`Occluders`) liczą
  się dalej z prostokąta stempla, nie z modelu.

---

## 2026-10-05 (2) — lis „ucieka cały czas”: kryterium zwrotu zależało od prędkości gracza

Zgłoszenie autora z gry. Pomiar w silniku na dzisiejszym (rozstawionym) lesie,
gracz sterowany przez prawdziwe `InputState` (obija się o drzewa), pozostałe
stworzenia wyłączone:
- goły gracz, pełne wychylenie (150 px/s): zwrot 3,6–3,9 s — jak w strojeniu
  z 2026-10-04 (3); zysk zrywu 31–39 px przy progu `minGainPx` 45;
- **ekwipunek spowalnia**: zestaw średni 133 px/s, ciężki 112 px/s; **na
  telefonie chód skaluje się z wychyleniem drążka** (`input × speed`);
- poniżej ~143 px/s każdy zryw był „udany” i cofał licznik — ciężki zestaw:
  11 zrywów w 15 s, ZERO zwrotu. Odwracał tylko sprint. Opóźnienie celowania
  (150–300 ms) nie zmienia nic; w zbroi gracz nawet nie dochodził do zasięgu
  ciosu.

Wariant A (decyzja autora, wybrany spośród A / B „próg 45 → 75 px” / „najpierw
zagram”): zryw nieudany także wtedy, gdy gracz przebiegł W STRONĘ lisa
≥ `FOX.flight.pursuitShare` (0,4) jego drogi. Przed kodem policzony na nagranych
trajektoriach, po wdrożeniu zmierzony: goły 3,6–4,0 s, 60% wychylenia 3,6–4,1 s,
ciężki 3,6–4,1 s, sprint 2,3–2,6 s, stojący — lis uchodzi.
`combat_regresja` i `movement_weryfikacja` bez różnic.

⚠ Przy okazji, harness w ukrytym panelu: wywołanie, które przekroczy limit
czasu narzędzia, **dalej krokuje pętlę w tle** — drugie wywołanie krokuje ją
równolegle i wyniki się mieszają (zyski +804 px). Pomiar = zadanie w tle +
odpytywanie wyniku. Klawiatura joysticka (`VirtualJoystick.update`) zeruje
`InputState.move` co klatkę — trzeba ją wyłączyć na czas pomiaru.

---

## 2026-10-05 (1) — ikony reszty rosteru: spis, prompty Gemini, zioła wpięte

**Spis** (`ITEMS` wykonany przez esbuild): 155 przedmiotów, 126 z nową ikoną,
**29 do zrobienia** — 7 na plamce koloru (6 ziół + kieł Szarego), 5 na starym
`items.png` (pierścienie, naszyjnik), 17 ze sierpniowej ścieżki GPT.
Pięć arkuszy z promptami: `docs/gemini_item_icons.md`.

**Decyzje autora:** tylko istniejące przedmioty — PAS i nowe amulety wracają
~2026-10-19 (`docs/odlozone.md` §1), bo przedmioty pod nowe sloty „to
odkładanie gameplayu, gdy las jest już grywalny"; po ikonach: AI stworzeń
(lis ucieka bez końca — `OI-162`), potem broń dystansowa albo wioska.
Jedzenie i surowce — wszystkie 12 od nowa. Pierścienie — z kamieniem i bez.

**Zioła (wsady A i B) — wpięte.** `tools/build_herb_icons.py`: 11 ikon,
5 nadpisanych, 6 nowych (`ASSETS` + `queueImages` + `iconTexture`).
Arkusz A przyszedł na szarobrązowym tle zamiast magenty; w B pięć gałązek
leżało w lustrze. Zejście ~60 → 28 px: głosowanie wnętrza przy pokryciu 0,25,
ciemne przerwy → ton o krok ciemniejszy (głosowanie czerni zjadało łodygi),
gamma dla ciemnych zieleni (pokrzywa: kontrast 32 → 60), zatkane dziury
1 px. Silnik: 270/270 wczytane, `totalFailed` 0, `dev.missing`/`failed`
puste, 11 tekstur `item-icon-*` = pliki co do piksela. ⏳ Ocena autora
w grze. Zamknięty też wiszący `OI-155` (torby, wpięte 2026-10-04).

**Biżuteria, jedzenie, surowce (wsady C, D, E) — wpięte.**
`tools/build_misc_icons.py` (potok zmniejszania importowany z ziół): 18 ikon,
6 nowych plików (4 pierścienie, kieł, naszyjnik), reszta nadpisana.
Wszystkie trzy arkusze na innym tle niż magenta; tło zdejmowane zalewaniem
od brzegu komórki przez kolory DOMINUJĄCE na obwodzie (pierwsza wersja,
z każdym kolorem brzegu, zjadła niedźwiedzia, którego łapy dotykają
brzegu), plus zamknięte okna (wnętrza pierścieni). Ciemne skóry rozjaśnia
gamma na jasności V — po kanałach RGB dzik wyszedł szary jak kamień.
**Roster: 155/155 z własną ikoną.** Gruczoł jadowy v1 czytał się jak gruszka —
ponowiony osobnym arkuszem (nerkowaty worek + czarny kieł), wpięty (§6.6).

---

## 2026-10-04 (13) — dosiew zwierząt w rozstawionym lesie (26 → 39)

Prośba autora: więcej zwierząt — przestrzeń ma się czuć żywa, zwłaszcza
w walce. Zając 6→10, lis 3→5, jeleń 3→5, dzik 2→4, sieciarz 3→5, skoczek
3→4; sfora, Szary i niedźwiedź bez zmian. Reguły: linia ubytku (ofiary
x < 142,5 kafla), polana pod spawnem, ≥ 380 px od innych spawnów,
drapieżnik ≥ 520 px od wejść. `tools/forest_clearance.py` 0 błędów; w grze
39 wrogów. Przy okazji `tools/stamina_model.mjs`: tabela liczebności lasu
miała 5 zajęcy przy 6 na mapie — to była ta stara czerwona samokontrola;
po wyrównaniu do 39 przymiar dochodzi do testów projektowych (5 niezdanych
— propozycje strojenia, nie błędy; wcześniej w ogóle się nie uruchamiały).

## 2026-10-04 (12) — kierunek: kamera A; ROZSTAW LASU ×1,5

Autor odblokował telefon: wioska w 3D „ogólnie OK", ważniejsza jest gęstość
lasu i kolizje blokujące stworzenia. Po analizie kierunku — **kamera A**
(stała kamera 3D jak LoL / Wild Rift, logika 2D, Tiled zostaje). Potem
wycinka: „chciałbym móc powalczyć zamiast przeciskać się między drzewami".
- Pomiar przed: prześwit pień–pień mediana **16 px**, 1 z 26 spawnów z polaną,
  pościg sfory „goni, ale stoi" **28–40%** klatek.
- Las ×1,5 → 240×90 (`docs/decyzje/2026-10-04-rozstaw-lasu.md`). Po: odstęp
  pni we wnętrzu ≥ 84 px (asercja), 26/26 spawnów z polaną, pościg **0–4%**.
- ⚠ Wyszło dopiero na renderze, nie w raporcie:
  - jeden odstęp na całą mapę dał SAD — odstęp idzie dziś za gęstością źródła;
  - drogi puste w środku: `terrain_forest_transitions.png` trzyma wyłącznie
    kafle UŻYWANE przez mapę, reszta jest przezroczysta. Nowy obrys potrzebował
    nowych układów blob → arkusz przebudowany jego generatorem (który zakładał
    gidy sprzed remapu — poprawione) i wydłużony o wiersz; arkusze drzew
    przesunięte o 19 gidów;
  - pas trawy między wodą a piaskiem — piasek to obwódka wody, liczona dziś
    jako (woda ∪ piasek) − woda;
  - pojedyncze kafle żwiru/ziemi rosły w bloki 2×2 — przenoszone pojedynczo.
- Asercja złapała kafel wody 118 bez `solid` w arkuszu przejść (w `Teren` jest)
  — woda byłaby przechodnia. Przeniesione.
- Nowe: `NavGrid.nearestPassable` + zsuwanie gracza z przeszkody przy wejściu
  z zapisu/bramy (stare zapisy z lasu). `tools/forest_clearance.py` — przymiar
  reguł (0 błędów teraz, 1362 na starej mapie). `tools/portale.py`, portale
  wsi i Gęstwiny, minimapa lasu zaktualizowane; minimapa wsi znów dryfuje sama
  z siebie — cofnięta, jak 2026-08-28.
- **S21 FE, widok 3D:** 24 kawałki gruntu (było 10), skraj i najgęstsze miejsce
  lasu — 119,1–119,8 FPS na 120 Hz, p95 8,4 ms, 0 klatek > 33 ms (4 × 15 s).
  Zapis autora stał w lesie na dawnym punkcie lądowania (1328, 144) — po
  rozstawie to północny skraj na zachód od drogi; wolne pole, więc bez zsuwania.
- Bramy sprawdzone w obie strony w grze. Transformację zrobił jednorazowy
  skrypt (nie zostaje w `tools/`, zgodnie z regułą zmiany punktowej).

## 2026-10-04 (11) — prototyp 3D: wioska, rzeka, domy, NPC-e

Pytanie autora: „a co z wioską, rzeką i domkami?". W Zagajach prototyp
pokazywał SAMĄ TRAWĘ.
- ⚠⚠ Przyczyna: `TiledMap` co klatkę gasi warstwy poza kamerą (bramka
  zajętości), a grunt piekł się przed ustawieniem kamery i pomijał
  „niewidoczne". Pieczenie ignoruje dziś `visible`.
- Budynki i drzewa z WARSTW KAFLI (Zagaje, Gęstwina, chata myśliwego w lesie)
  stają: składowe 4-spójne → jeden billboard na budynek, zakotwiczony
  w najniższym wierszu ściany; drzewa dzielone per pień (kafel korony idzie
  do najbliższego pnia pod nim). Spakowane w atlasy 2048². Próg/schodek
  pod kotwicą leży płasko w gruncie. Rodziny: `PIONOWE` w `WorldView3D.ts`
  (także `znaki` — drogowskaz).
- ⚠⚠ `Sprite` w Phaserze NIE dziedziczy po `Image`: skan brał tylko `Image`,
  więc wszyscy pikselowi NPC-e, ognisko i zioła rysował Phaser NA światem 3D.
  Myśliwy stojący ZA graczem zasłaniał mu tułów. Dziś to billboardy.
- Rekwizyty w korzeniu sceny z głębokością `entities + y` (kamienie, flora
  wodna, kłody, zioła — ~450 w lesie) też były płaskie na wierzchu; dziś są
  billboardami.
- Podpisy, znaczniki zadań i sakiewki NPC-ów lądowały na twarzach (postać
  stoi w pełnej wysokości, odstęp w ściśniętej kamerze to × sinθ). Tuż przed
  renderem Phasera są podnoszone o 1/sinθ od stóp właściciela, po renderze
  wracają. Właściciel = obiekt o tej samej głębokości y-sortu (+0…7),
  najbliższy w poziomie. Paski HP brył 3D celowo NIE są podnoszone: z cotθ
  pasek dzika wisiał ~50 px nad grzbietem.
- Sprawdzone renderem: Zagaje (domy, dachy, studnia, grusza, drogi, pola),
  młyn z kołem nad rzeką, gracz za ścianą domu (prześwit działa), Gęstwina
  (476 drzew per pień), las bez regresji. `dev.missing` / `load.totalFailed`
  puste.
- ⏳ Telefon: APK 3D zbudowany i zainstalowany, ale zrzutu i pomiaru nie
  było — S21 był zablokowany. Woda nadal statyczna, uprawy leżą płasko.

## 2026-10-04 (10) — prototyp 3D na S21 FE: zmierzony, bramka zaliczona

Telefon dostępny z komputera przez `adb` (Wi-Fi) i protokół DevTools
(`adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>`, ewaluacja
JS przez WebSocket) — da się z sesji zrzucać ekran (`adb exec-out screencap`),
stukać (`adb shell input tap`) i mierzyć klatki w działającej grze.
- ⚠ Pierwszy test autora („płynnie") był na STARYM APK 2D: `gradlew
  assembleDebug` tylko buduje; instalacja to `adb install -r` (zachowuje dane).
  Rozpoznane po `lastUpdateTime` i nazwie paczki JS w WebView.
- ⚠⚠ Błąd widoczny dopiero na telefonie: HUD, drążek i przyciski znikały pod
  światem 3D — płótno `position: absolute` przykrywa statyczne płótno Phasera.
  Na pulpicie nie wyszło, bo zrzuty składałem ręcznie w dobrej kolejności.
  Naprawa: płótno Phasera `relative` + `z-index: 1`.
- Wynik (las, zapis autora, 2 × 15 s): **119 FPS na 120 Hz, p95 8,4 ms,
  2 klatki > 33 ms**.
- Drogi „w kwadraty" w 3D to NIE błąd pieczenia — tak samo wyglądają w 2D
  (kafle przejść lasu).
- ⚠ Budowanie APK z sesji Claude: Java na Windows pada na `Unable to establish
  loopback connection` (gniazdo uniksowe w katalogu tymczasowym ze ścieżką
  `JAROSA~1`/`ł`). Pomaga `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\rpg\android\.gradle
  -Djava.io.tmpdir=C:\rpg\android\.gradle`.

## 2026-10-04 (9) — PROTOTYP „świat w 3D” (rozgrywka 2D, obraz w jednej scenie 3D)

Decyzja autora po analizie kierunku: „zobaczmy, co z tego wyjdzie”.
`src/render3d/WorldView3D.ts`, włączany WYŁĄCZNIE `?widok3d` (albo build
`VITE_WIDOK3D=1` na telefon). Logika, fizyka, NavGrid, walka i HUD bez zmian.
- Grunt: warstwy Tiled wypieczone w tekstury 1024² na płaszczyźnie.
- Drzewa i rekwizyty: billboardy z TYCH SAMYCH arkuszy, instancjonowane
  (3478 obiektów → 8 partii), sortowane buforem głębi per piksel z postaciami.
- Postacie/stworzenia: ich animowane modele przenoszone do sceny świata
  (`Shared3D.swiat3d`) — `stan3d()` i animacje nietknięte.
- Kamera Phasera ściśnięta `setZoom(z, z·sinθ)` — rzeczy na gruncie (pierścień
  celu, tap → świat) trafiają w to samo miejsce co w 3D.
- Prześwit: drzewa PRZED graczem rzedzone szachownicą wokół niego.

Pomiar na pulpicie, ten sam punkt lasu, z synchronizacją GPU: 2D 11,1 / 15,1 ms
(p50/p95), prototyp 40° **10,4 / 14,4 ms**; sam świat 3D 3,7 ms, 25 wywołań
rysowania. Widać ~1,3–1,7× więcej gruntu w pionie przy tym samym zoomie.
Po drodze z renderu: gracz biały (tint nadpisywał kolor materiału — dziś
mnożony), las znikał (drzewa liczone raz, gdy culler 2D miał je zgaszone).
⏳ Znane braki prototypu: paski HP i liczby tylko w przybliżeniu nad głową,
napisy Phasera ściśnięte w pionie, dachy (`-over`) ukryte, woda statyczna,
budynki wioski wypieczone płasko w grunt (Zagaje nietestowane), tap w wroga
przybliżony. ⏳ **Bramka: pomiar na S21 FE.**

## 2026-10-04 (8) — dzik w zwarciu, pierścień celu pod stopami, hurtboxy z modeli 3D

Trzy zgłoszenia z gry.
1. **Dzik „stał jak debil" przy graczu.** Zakleszczenie: w zwarciu kieł
   ustępował gotowej szarży (`gore.requiresChargeAwayMs`), a szarża wymaga
   prześwitu > `gore.range` — w zwarciu nie startuje nigdy. Dziś bez kła dzik
   cofa się na rozbieg (`BOAR.backoff`, tyłem, łbem do gracza) i stamtąd
   szarżuje. Zmierzone w silniku, gracz stoi 10 s przy dziku: 6 ciosów,
   cykl szarża → kieł → cofnięcie → szarża, najdłuższa bezczynność 1,4 s
   (czeka na rozbiegu, aż szarża ostygnie).
2. **Pierścień celu** był kołem 22 px na środku duszka, NAD istotą. Dziś
   elipsa na gruncie pod stopami (dół ciała Arcade — kotwica cienia
   `Creature3D`), szeroka na ślad stworzenia, w warstwie cieni. Tekstura per
   rozmiar (`Assets.targetMarkerKey`).
3. **Hurtboxy a modele 3D:** porównane z wymiarami `.glb` (4,955 px/j.).
   Większość rosteru ~120–125 % długości bryły; odstawały niedźwiedź 142 %
   i Szary 154 % (arkusze 2D większe od modeli) oraz lis 69 % i jeleń 61 %
   (po krytterze). Skorygowane do ~120 %; ciała fizyczne nietknięte
   (nawigacja lasu). Baseline `combat_regresja` przemrożony `--migracja` —
   dwa przypadki „niedźwiedź tuż poza" przestały trafiać, zamierzenie.
   ⚠ `docs/systemy/combat.md` stoi DOKŁADNIE na limicie 20 KB — notatka
   poszła do `creatures.md` §1.2.

## 2026-10-04 (7) — sakwa podróżnika: z „damskiej torebki” w ekwipunek

Uwaga autora: trzecia ikona wyglądała jak damska torebka. Przyczyna:
sylwetka — pasek łukiem nad bryłą (rączka torebki) i jedna sprzączka na
środku (zapięcie). Nowa sakwa: szeroka, krępa, zwinięte posłanie na
wierzchu (len), dwa paski przez posłanie i klapę z żelaznymi ramkami
sprzączek, pasek na ramię zwisa z boku. Po drodze dwie poprawki z renderu:
pasek ukośnie w górę sterczał jak antena, kwadratowe ramki parą czytały się
jak oczy.

## 2026-10-04 (6) — ikony toreb RYSOWANE (dopracowanie)

Wersja z rana (źródła ścieżką skórzanego kaftana) miała dobry kolor
i kontur, ale w powiększeniu ×8 widać było, że zmniejszenie zjadło budowę:
klapy, pasek sakwy, sprzączki i paski plecaka rozpłynęły się w bryły.
`tools/build_bag_icons.py` rysuje teraz każdą torbę z geometrii, ze
znakiem rozpoznawczym: sakiewka — falbana, otwór, sznurek z supłem i dwoma
końcami; torba — niska, łukowata klapa ze szwem i kołeczkiem; sakwa —
pasek łukiem, klapa, język z żelazną sprzączką; plecak — uchwyt, szelka,
klapa na dwa paski z mosiężnymi sprzączkami, kieszeń. Raport pilnuje
znaków, odrębności par, kontrastu, konturu i dziur (prześwit paska sakwy
dozwolony tylko duży). Obejrzane w plecaku w grze.

## 2026-10-04 (5) — ikony toreb w stylu skórzanego ekwipunku

Prośba autora: dopasować sakwy/plecaki do reszty skórzanych przedmiotów.
Stare ikony: Lanczos z 64×64, 315–496 kolorów, miękki brzeg, nasycona
pomarańcz. Nowy `tools/build_bag_icons.py` puszcza źródła ścieżką skórzanego
kaftana (import funkcji z `build_armor_icons.py`): 5–7 kolorów z rampy skóry
`wood_palette.py` + `BAST` na mosiądz i sznurek, kontur 4-sąsiedni,
wyśrodkowanie. Bramki zaświeciły po drodze na czerwono (kontrast 30 < 50,
4 px dziury w pętli paska) i to one wymusiły jaśniejsze stopnie skóry
i domknięcie pętli. Obejrzane w plecaku w grze obok strzępów skóry,
rękawic, butów i czepca.

## 2026-10-04 (4) — jeleń: neutralny, broni się po ciosie; jeleń 3D; koniec `Critter`

Decyzja autora: jeleń z natury nie jest wrogi — zachowuje się jak istota
neutralna, ale zaatakowany atakuje. Z `Critter` w `Enemy` (`Deer.ts`, `DEER`,
`AKCJE.deerRam`, rejestr, łup, spawn z trzech punktów `deer` w `forrest.tmj`).
Płoszenie z liczbami Fazy 1 fauny bez zmian (170 px/s między chodem a sprintem,
`panicGap` 60); zryw do punktu z `Enemy.escapePoint` — wybór drogi wyciągnięty
z `Fox` do bazy przy trzecim użytkowniku. Zmierzone w silniku: stępa za nim 8 s
= zero obrażeń, odstęp ~60 px; po ciosie bodzie co ~1,9 s; po odejściu się
uspokaja. `Critter` został bez gatunków i jest usunięty razem
z `CritterTuning`/`critterSpawns`. Model 3D: z pomiaru referencji (wapiti,
usunięta) — poroże własne, mniejsze i grubsze; poprawka z renderu: łeb +1 j.,
smuklejsza szyja, grubsze nogi.

## 2026-10-04 (3) — lis jako przeciwnik („złodziej z kurnika”) + lis 3D

Decyzja autora: lis ucieka, a gdy pościg trwa, w końcu staje i atakuje.
Z dekoracji (`Critter`) w `Enemy` (`Fox.ts`, `FOX`, `AKCJE.foxBite`, rejestr,
łup, spawn z trzech istniejących punktów `fox` w `forrest.tmj`). Spust zwrotu
MIERZONY: bilans dystansu każdego zrywu, 3 nieudane pod rząd → telegraf
(warkot 0,7 s) → walka wzorem rozjuszonego królika. Uderzenie odwraca od razu;
po zerwaniu pościgu lis uspokaja się całkiem.

Strojenie z silnika (zegar syntetyczny, gracz przesuwany stępa/sprintem):
pierwsza wersja (zryw 175 px/s × 0,7 s, zwrot natychmiast po dogonieniu)
poddawała się po 1,3–1,6 s. Potem: zryw 200 × 0,8 s, `alertPanicGap`,
dogonienie = nieudany zryw zamiast zwrotu, oraz **wachlarz kierunków zrywu
z wolną drogą** (NavGrid) — zryw wprost od gracza wbijał się w pień (−5 px
bilansu). Wynik na trzech lisach × czterech kierunkach: stępa 3,6–3,9 s,
sprint ~2 s, stojący — ucieka. Model 3D z pomiaru referencji (skala z kłębu,
referencja usunięta); poprawki z renderu: uszy z bryłą, głębszy warkot.
Przy okazji: `combat_regresja` §M2 dostał `fox_bite`; `stamina_model`
świecił na czerwono JUŻ PRZED zmianą (20 spawnów wobec 19 w rosterze) —
lis dopisany po obu stronach, różnica nietknięta.

## 2026-10-04 (2) — niedźwiedź 3D

Z referencji zmierzone proporcje (garb, osadzenie łba, przyczepy i promienie
nóg, stopa tylna płasko) i rytm chodów; model referencyjny usunięty.
`tools/bear3d.py` na rdzeniu `quad3d`: bryła, szkielet i wszystkie klipy
nasze — zapowiedź `Rear` i cios `Swipe` zaprojektowane pod fazy
`AKCJE.bearSwipe`. Poprawki z renderu: pierwsza wersja była kapibarą (łeb na
wysokości grzbietu, kark grubości łba) — łeb niżej garbu, zagłębienie karku,
szersze policzki, uszy z bryłą, jaśniejszy pysk; tułów +15% względem
krępej referencji. W grze: pościg = galop (tempo ~0,83), zapowiedź → zamach
przez całą bezbronność (akcja bez `active`, lekcja pająków), zwrot
z zamrożonego `swipeDir`. Koszt p95 0,4 ms na pulpicie.

## 2026-10-04 (1) — pająki 3D; poprawka prędkości klipów

Z referencji zmierzone proporcje (głowotułów/odwłok, przyczepy łap,
rozpiętość); szkielet referencji nieczytelny (zdublowane segmenty, cele IK),
więc chód zaprojektowany wzorem pająków (naprzemienne czwórki). Rdzeń
dostał opcjonalne zaczepy `cialo` / `zbuduj_klipy` (dzik identyczny w
zrzucie). `tools/spider3d.py`: sieciarz i skoczek. Poprawki z renderu i gry:
skoczek zlewał się z trawą (oliwka → barwy ostrzegawcze), klip ciosu
znikał przy akcji bez `active` (sieć) i z jednoklatkowym `active` (kęs).
Przy okazji: `predkosciKlipow` wszystkich zwierząt liczone źle (krok/cykl
zamiast krok/(podparcie·cykl)) — łapy przebierały za szybko; poprawione.

## 2026-10-03 (17) — królik 3D

Z referencji zmierzone liczby (przyczajona sylwetka, łapy w „Z" ze stopą
płasko, chód = skoki parami); plik usunięty. `tools/rabbit3d.py` w skali gry
(×1,8 natury — tak duży jest sprite 2D). Klip `Hop` = jeden skok, restart na
każdym wybiciu (`Stan3D.od`). Dwie poprawki z renderu: uszy-blaszki z profilu
jak u szczura → uszy z bryłą; różowy nos z przodu jak plama krwi →
stonowany. Rdzeń dostał `UCHO_BLASZKA` (opcjonalne; dzik identyczny w
zrzucie). Sprawdzone w grze: skoki, czujność, ugryzienie rozjuszonego.

## 2026-10-03 (16) — rdzeń czworonogów, wilk i Szary 3D

Z generatora dzika wydzielony rdzeń `tools/quad3d.py` (gatunek = dane);
dowód: zrzut dzika przed/po identyczny. Wilk z referencji (zmierzone liczby:
profil, nogi, stępa, bieg skokami, kęs jako wypad, skok, przewrót; plik
usunięty) w `tools/wolf3d.py`; kłus, wycie i warkot zaprojektowane. Trzy
poprawki z renderu: łapa pod gruntem, zad hieny i łeb pod grzbietem (poza
referencji, nie anatomia), Szary prawie biały w świetle gry. `Wolf.stan3d()`
czyta `playOneShot`/`howl()`/fazę wypadu; sprawdzone na żywej watasze.

## 2026-10-03 (15) — wspólny renderer 3D i dzik w grze

`Shared3D`: jeden `WebGLRenderer` na całą stronę (zamiast kontekstu na
postać), każda postać rysuje swój wycinek i od razu go kopiuje; unikalne
klucze tekstur; wspólne światło i skala obrazu (gracz ją mierzy, stworzenia
ją dziedziczą — jedna gęstość pikseli na metr). `Creature3D` dla wrogów:
sprite przestaje RYSOWAĆ (puste `renderWebGL`), ale dalej przyjmuje tap —
`setVisible(false)` w Phaserze 3.90 wyłącza też wskaźnik, a `alwaysEnabled`
nie istnieje. Tint, alfa i pozycja kopiowane co klatkę; poza kadrem bez
renderu; po śmierci model dogrywa przewrót sam. `Boar.stan3d()` mapuje fazy
`ActionRunner`a na klipy. Żywy dzik w grze: telegraf → szarża (trafia) →
bezbronność → kieł. Desktop: p50 0,6 / p95 1,2 ms na stworzenie. ⏳ S21 FE.

## 2026-10-03 (14) — dzik 3D: referencja zmierzona, generator własny

Autor: przejście do przeciwników w 3D, od dzika. Z modelu referencyjnego
zmierzone wyłącznie proporcje (25 przekrojów tułowia, osadzenie łba, uszu,
oczu, ogona, odcinki nóg) i fazy ruchu (stępa, kłus, galop, szarża, cios
kłem, trafienie, śmierć); sam model usunięty. Siatkę, szkielet i animacje
buduje własny generator czworonoga (`OI-161`).

Generator `tools/boar3d.py`: bryła z 25 przekrojów, nogi-rury, kły, uszy,
oczy, ogon, strefy koloru; 10 klipów liczonych z parametrów (tor pęciny +
dwukościowe IK + wahanie łopatki). Pięć poprawek z renderu: klapy nóg poza
tułowiem, noga-słup bez zasięgu (łokieć cofnięty), znak wahania łopatki,
znak kątów łba (telegraf podnosił łeb), oś przewrotu przy śmierci.
`animals/boar.glb` ~300 KB, roundtrip sprawdzony; w grze jeszcze nie.

## 2026-10-03 (13) — strój startowy chłopa, rzemień, duży nóż

Autor: postać nie może zaczynać w samych gaciach. Decyzje: prawdziwe
przedmioty założone na start w jakości „Niska" (`INVENTORY.startingWorn`:
koszula, spodnie, łapcie), rzemień jako geometria koszuli (slot `belt` dalej
planowany; pierwsza wersja stała na splocie słonecznym — zeszła na biodra), warianty kolorów na razie tylko dla gracza. Nóż „jak obieraczka"
→ duży nóż chłopski 36 cm na modelu (sztylet 42, mizerykordia 48). Test
nowej gry w przeglądarce; zapis przywrócony z kopii.

## 2026-10-03 (12) — czytelność postaci 3D po zrzutach z S21 FE

Pięć poprawek ze zrzutów autora: cień pod stopami, światło z boku zamiast
z przodu (niebo/ziemia + słońce + kontra), jasność pancerza wg slotu (koniec
„szarego kombinezonu"), kopuła hełmu (koniec „kaszkietu"), mała broń
(`OI-158`). Każda z renderem z gry; bramki zielone. Dalej: podstawowy strój
chłopa — rozmowa z autorem.

## 2026-10-03 (11) — szyja i bieg wojownika

Autor: „brak szyi — goryl" i „bieg jak skradanie". Broda siedziała poniżej
góry tułowia (0,710 < 0,745); `glowa_uniesienie` 0,09 podnosi głowę z kośćmi,
hełmy liczą progi w układzie głowy, `ZAPAS_GORA_PX` 56 → 47. Bieg: tułów
prawie pionowo, głowa skontrowana, miednica wyżej, krok przed ciało.
A/B w Blenderze, render z silnika, bramki zielone. Wzór czytelności autora:
Stronghold Crusader.

## 2026-10-03 (10) — NPC-e 2D to próg, nie wzór

Autor: wszystkie postacie 2D zostaną zastąpione modelami 3D; są minimum
jakości, a 3D ma je przebić czytelnością (ubiór, animacja), nie
szczegółowością. ⛔ „Spójność stylu z NPC-ami" przestaje być kryterium.
Przeformułowane: `OI-135` (kontur = pytanie o czytelność), tabela ocen i plan
w `docs/postac3d_checkpoint.md`, akapit bazy w `CLAUDE.md`.

## 2026-10-03 (9) — baza postaci V3.6: tułów i nogi jedną siatką

Autor: „nogi i biodra wyglądają jak doklejone" + zgoda na dopracowanie bazy.
Przyczyna: noga była osobną rurą wsuniętą w miednicę, a uda szersze od bioder.
`_zszyj_krocze` zszywa tułów z udem, biodro wyprowadzone z uda, łydka bez
„cholewy", wariant B proporcji. Przymiar, bramki broni/tarcz, render z gry
i zrzut obok NPC-ów. Kopia: `blender/wersje/char_v3_przed_zszyciem_2026-10-03.blend`.

## 2026-10-03 (8) — bieg, hełmy, ocena bazy postaci

Autor: „czapki i hełmy czytają się jak fryzura; sprawdź, czy model wymaga
dopracowania; przygotuj bieg — chód przy dużej szybkości wygląda dziwnie".
1. **Bieg** (`tools/char3d_run.py`, `OI-138` zamknięte): klip `Run` + 13
   wariantów z bronią/tarczą; w silniku przejście wg prędkości i tempo od
   prędkości. Zmierzone w grze (podstawiona prędkość, pozycja przywrócona).
   Bramki broni/tarcz mierzą bieg (grunt z pozy stojącej). Render pozy biegu
   z klipu silnika w 8 fazach.
2. **Hełmy**: objętość, otok, odblask, nosal — render z gry, nosal poprawiony
   dwa razy (w twarzy → przed twarzą → przy licu).
3. **Baza (`OI-134`)**: pomiar 4,42 głowy / 0,42 szerokości wobec NPC-ów
   3,0–3,9 / 0,47–0,55; przymiar A/B bez zapisu. Decyzja autora.

## 2026-10-03 (7) — pancerz na modelu: cały katalog

1. Tors: równy dół (cięcie po wysokości), wzory w `COLOR_0`, bez `Subdivision`
   (`OI-160` zamknięte: 71 → 27 KB na sztukę).
2. Nogi, stopy, dłonie, naramienniki, głowa — 55/55 sztuk; bramka pokrycia
   przerywa eksport na sztuce bez modelu. Baza w bieliźnie na całym ciele.
3. Na renderze z gry wyszły i zostały naprawione: dziura na czubku buta,
   brązowe nogi płytowe. `char.glb` 1,89 MB.

## 2026-10-03 (6) — pancerz na modelu 3D: pilot torsu

Autor: „idealny moment, by sprawdzić, jak model poradzi sobie z pancerzem".
1. `tools/armor_roster.mjs` (esbuild; warstwa z `itemLayer`), nowy
   `tools/char3d_armor.py`: 15 sztuk torsu, pokrycie z konstrukcji, grubość
   z warstwy, kolor z ikony (dekoder PNG w czystym Pythonie). Bramka pokrycia
   przerywa eksport na sztuce torsu bez modelu.
2. Baza w bieliźnie na torsie (`char3d_zones`). `Character3D.zsynchronizujPancerz`
   — widoczność wg `Equipment.wornItemIds`; `dev.char3d.pancerz` z listą id.
3. ⚠ Normalne ciała na torsie do środka → pancerz chował się w tułowiu;
   naprawione orientacją ścian od kości. Render z gry: warstwy poprawne.
4. Otwarte: ząbkowany dół, jednolite kolory, `OI-160` (glb 1,1 → 2,0 MB).
   Zgłoszona przy okazji martwa strefa drzewcowej → `OI-159`.

## 2026-10-03 (5) — broń drzewcowa: pchnięcie zamiast zamachu, dłuższy zasięg

Autor: „ataki drzewcowych za krótkie, a atak włócznią to dźganie, nie machanie".
1. Pomiar: grot w starym zamachu ~54 px przy zasięgu gry 98–128 px; wszystkie
   drzewcowe poza glewią mają atak kłuty, a model grał zamach topora.
2. **Pchnięcie** (`tools/char3d_thrust.py`, oburącz i z tarczą) z wypadem
   miednicy; wybór w silniku po `Progression.damageType`. **Gotowość w walce**
   drzewcowej: drzewce opuszczone do przodu.
3. **Długość**: `SKROT_DRZEWCOWEJ` 0,6 (zasięg = tożsamość rodziny), pika sufit
   273 cm i chwyt 82 cm (noszenie pionowe w kadrze). Grot: włócznia 75/98,
   pika 102/128, halabarda 72/110 px (z wypadem zamachu).
4. Kadr 320×184 (`OI-157` — telefon). Bramka broni: pchnięcie, gotowość,
   grunt w ciosie; reguła kolejności długości zawężona do rodziny.
5. Rozbrojone: przycinanie zasięgu do barku ze spoczynku (`bark_z_pozy`),
   wyciek obrotu dłoni między klipami (zerowanie + jawny klucz).

## 2026-10-03 (4) — tarcze w skali 1:1 (`OI-156`), cios raz na zamach (`OI-151`), tempo ciosu (`OI-118`)

Autor: „zdam się na ciebie". Decyzje i pomiary:
1. **`OI-156`** — tarcza jako dziecko kości dziedziczyła skalę armatury 1,6527:
   zmierzone okrągła 91 cm przy „56", legionowa 149 przy „90". Naprawa:
   obiekt kompensuje skalę (`char3d_shields`), przesunięcie uchwytu też.
   ⭐ `SKALA_GRY` 0,8485 → **1,0**: wymiar historyczny 1:1, ta sama reguła co
   broń. Dawne 0,8485 dobierano pod zasłanianie głowy na bryle ~92 cm; dziś ten
   sam przyrząd daje zasłonę głowy okrągłej 0% (próg wtedy 23,6%). Po naprawie
   puklerz 37 / okrągła 65 / legionowa 106 cm. Bramka tarcz zielona.
2. **`OI-151`** — start klipu ciosu na ZBOCZU nowego zamachu (`Player.zamach`),
   nowy zamach przerywa dogrywany klip. Zmierzone: 1 start na zamach dla
   130–880 ms (było 2× Uderzenie tarczą, 3× Ciężkie uderzenie).
3. **`OI-118`** — `tempoCiosu(ms)`: klip trwa `max(ms, 240)`, cięcie w chwili
   trafienia. Na żywo: +4 / +8 / +17 / +44 / +68 ms (Ciężkie, tarcza,
   dwuręczny, miecz, nóż). Dolna granica 240 ms = 60 ms na klatkę.
4. `tsc`, `build`, bramki broni i tarcz, `dev.missing()` puste.

## 2026-10-03 (3) — broń drzewcowa w marszu: pionowo przy boku, nie „jak bazooka"

Zgłoszone wprost przez autora. `Walk_Armed_2H` trzymał obie dłonie przy piersi,
a drzewce leżało ukośnie przy barku (koniec piki sterczał za głową); jednorącz
z tarczą — ukośnie za barkiem. Teraz:
1. **`char3d_chod`**: poza CARRY `NIESIENIE_DRZEWCE` + `_ustaw_drzewce` (obrót
   kości dłoni spoza łańcucha IK: oś broni w pion pochylony do przodu, ostrze
   do przodu). Klipy `Walk_Armed_Pole`, `_Shielded`, `_Shielded_Large`.
2. **`Character3D`**: drzewcowa POZA WALKĄ gra ten klip bez względu na chwyt;
   w walce wraca gotowość oburęczna. Topór i młot dwuręczny zostają na
   ramieniu — tak się je nosi.
3. Bramka broni: osobny przebieg „(nosz.)" dla 6 drzewcowych — grunt i rama
   w bezruchu i chodzie. Pika: tylec 0,15 j. pod stopami (limit 0,30),
   krótsze drzewca trzymane w połowie (tylec ~40 cm nad ziemią).
4. Blender MCP: połączony (domyślna scena; pipeline i tak idzie wsadowo).

## 2026-10-03 (2) — broń i tarcze okute W DŁONI modelu 3D

Commit lokalny `6b3d045` zamyka szlif ikon (bez pusha — decyzja autora).
Potem: „widoczność w rękach podczas walki broni i nowych tarcz".

1. ⭐⭐ **`tools/weapon_shapes.py`** — jedno źródło kształtu 37 broni (bliźniak
   `shield_shapes.py`): długość w cm, przekrój dla czytelności, części
   zakotwiczone od dołu (rękojeść) i od góry (grot, głowa). Skala ZMIERZONA:
   stare atrapy stały w świecie ~1:1 (miecz 95 cm), tylko włócznia skrócona
   220 → 150 → reguła „1:1 do 120 cm, nadwyżka ×0,3". Roster z prawdziwego
   modułu (`tools/weapon_roster.mjs`, esbuild). `char3d_weapons.py` trzyma
   wyłącznie mocowanie. Zamyka `OI-109`.
2. ⚠ **Bufor postaci 96×128 → 192×160** (`Character3D.ts`, stała gęstość
   `J_NA_PX`, przyrost wysokości wyłącznie nad głową). Zmierzone w żywej
   grze na STARYCH atrapach: młot bojowy w chwycie oburęcznym ucinany przy
   każdym zwrocie bokiem, cios mieczem dotykał y = 0. Koszt na desktopie
   w szumie (`OI-157` — telefon).
3. **Bramka `char3d_sprawdz_bron.py`**: kolumny RAMA (24 kąty, noszenie
   i cios, stałe czytane z TS), broń o chwycie `either` w obu chwytach.
   Sprawdzona na czerwono celowo zepsutymi danymi. Wynik: 37/37 w normie.
4. **Ostrze do przodu** — skręt −90° wokół osi broni; bez niego topory,
   halabarda i berdysz w profilu stały krawędzią i czytały się jak włócznie.
5. **Tarcze okute w 3D**: `shield_shapes.OKUCIA` (wspólne z ikonami —
   generator ikon sprawdza zgodność), 9 brył `Tarcza_<konstrukcja>_<gatunek>`,
   silnik wybiera wariant po IKONIE (`Character3D.wariantTarczy`) z drewnem
   jako zapasem. 30/30 tarcz trafia na bryłę.
6. Silnik: bryła i skala postaci liczone z SAMEGO CIAŁA — wcześniej ukryte
   bronie w T-pozie i broń założona przy wczytaniu potrafiły przesunąć
   i zmniejszyć postać.
7. Weryfikacja: `tsc`, `build`, obie bramki 3D, `dev.missing()` puste,
   `load.totalFailed` 0, arkusze kontrolne z prawdziwego renderu silnika.
   Otwarte: `OI-156` (skala tarcz ×1,65), `OI-157`, `OI-158` (nóż, głowice 1H).

## 2026-10-03 — audyt wizualny ekwipunku i poprawki czytelności

1. **Audyt całości** (`docs/gemini_weapon_icons.md` §15): pomiar 107 ikon
   (kontrast, ciemne piksele, wypełnienie, kontur, kierunek światła) + półki.
   Plan dalszych ikon zapisany: `OI-153` zioła, `OI-154` biżuteria + kieł,
   `OI-155` torby.
2. **A — kontur 4-sąsiedni dla broni** (1,69 → 1,10 px konturu na piksel
   obwodu, jak pancerz i tarcze). **C — noże na standard metalu** (kontrast
   noża 36 → 54; `OI-126` domknięte). **B — światło pancerza**: lustro (9),
   brzeg (39), gradient wnętrza (4); żadna ikona nie ma już światła odwrotnego.
3. Po ocenie autora: krótki miecz węższy, struktura wartości w głowach młotów
   i buzdygana (piąta wersja), tarcza rycerska bez nitów, drzewce 3 px.

## 2026-10-02 (5) — tarcze METALOWE wpięte; wspólny standard metalu

1. **Opis korbacza**: „na krótkim **łańcuchu**" (było „rzemieniu") — zgodnie z ikoną.
2. ⭐ **`tools/metal_palette.py`** — wspólny standard STEEL/IRON (liczby 1:1
   z pancerza; pancerz bajt w bajt ten sam). Zamyka część `OI-126`.
3. **`tools/build_metal_shield_icons.py`** — warstwa metalu na nietkniętym
   drewnianym masterze wg macierzy materiałów: lity puklerz, obręcze, umbo,
   nity. Autor: migdałowa z umbo w górnej części (nie pasy), umbo puklerza
   wyraźniejsze. Umbo przeszło trzy usterki widoczne tylko na renderze
   (przerywany kołnierz → zębatka → kwadrat). 9 ikon na 18 tarcz + „Tarcza okuta".
4. **Wpięte**; w silniku tekstury OK, `dev.missing` puste; gabaryt, lalka
   i sklep zielone. Bez własnej ikony zostało 12 przedmiotów: 4 pierścienie,
   amulet, kieł Szarego i 6 ziół.

## 2026-10-02 (4) — OBUCHY wpięte: cała broń ma własne ikony

1. **Arkusze A i B obuchów** przyjęte (oba bez napisów — prompt bez nazw na
   liście działa). Korbacz na łańcuchu (autor: „łańcuch, nie rzemień").
2. **`tools/build_blunt_icons.py`**: 11 sztuk, 1×2 po skosie, zwis pionowy,
   wyśrodkowanie. Pass czytelności oceniany przy wielkości z plecaka: głowy
   ×1,1–1,4 (skala dotyczy długości), jaśniejsze drewno brył, grubszy kij;
   buzdygan — pióra obrysem zamiast szczelin („szczotka").
3. **Wpięte**: 11 ikon + gabaryt 1×2; `gabaryt_przymiar` zielony (45 × 1×2).
   Bez własnej ikony zostało 30 przedmiotów: 18 tarcz metalowych (`OI-126`),
   7 materiałów (kieł + 6 ziół), 4 pierścienie, amulet.
4. ✅ Opis korbacza w grze: „na krótkim **łańcuchu**" (było „rzemieniu") — zgodnie z ikoną.

## 2026-10-02 (3) — ikony wyśrodkowane w polach; zwis kiścienia i cepa

1. **Autor: „wyśrodkuj w polach ogólnie przedmioty, spójność to podstawa".**
   `tools/icon_center.py` w pięciu generatorach; 26 ikon broni + skórzany
   hełm + torba 3 przesunięte o całe piksele (rysunek identyczny co do
   piksela — sprawdzone względem HEAD). 0 ze 109 ikon poza środkiem.
2. **Kiścień i cep: łańcuch ZWISA pionowo w dół ekranu** (autor: „bardziej jak
   kula na łańcuchu"), nie wzdłuż trzonka ani w osi. Zwis wypada po stronie
   światła; cep mieści się wtedy przy 57 px (było 62) — do potwierdzenia.
   Arkusz B obuchów przyjęty (pierwszy bez napisów); arkusz A w drodze.

## 2026-10-02 (2) — 1×1 tylko dla broni do ~45 cm; krótki miecz na skos; wsad obuchów przygotowany

1. **Autor: „1×1 to opcja tylko dla broni krótkiej typu sztylet"** — wariant
   z progiem długości (~45 cm), **toporek zostaje 1×1**. Krótki miecz (65 cm)
   przeszedł z 45° na skos 1:2 (szeroka głownia 7 pasów, jelec 2 pasy szerszy
   — przy 1 pasie czytał się jak nóż); kod 45° z generatora mieczy usunięty.
2. `gabaryt_przymiar` §A: nowa reguła „1×1 z własną ikoną mają WYŁĄCZNIE
   sztylety i toporek" (broń na kaflu `items.png` czeka na wsad) — sprawdzona
   psuciem danych. 34 przedmioty 1×2.
3. **Wsad 7 — obuchowe** (`docs/gemini_weapon_icons.md` §13): dwa arkusze
   (podział tylko ze względu na skalę), wszystkie 11 sztuk na 1×2; prompt bez
   nazw i liczb na liście (lekcja z napisów na arkuszu toporów).

## 2026-10-02 — wsad TOPORÓW: projekt Gemini, ostrze po stronie światła, głowy wielokątem; wpięte

1. **Wsad 6** (`docs/gemini_weapon_icons.md` §12): siedem toporów + miecz jako
   kotwica. Arkusz złamał zakaz napisów i tła (beż zamiast magenty) — przyjęty,
   bo jest tylko projektem; lekcja: „2. Hatchet (18)" Gemini czyta jako podpis.
2. **Autor: ostrze z prawego górnego na lewy dolny** (strona światła), obuch
   i młotek po stronie cienia. Koszt policzony: szeroka głowa przy lewym górnym
   rogu nie pozwala osi dojść do rogu — **duński 62 → 50 px, berdysz 70 → 57**.
3. ⭐ **Głowa topora jako WIELOKĄT** (punkty (t, w), rasteryzacja po środkach
   pikseli, cieniowanie w pikselach), trzonek dalej w pasach. Brzegi w poprzek
   osi wychodziły w pasach poszarpane. **Broda (skeggøx) przemyślana**: jedno
   lite ostrze, spód blisko krawędzi, głębokie wycięcie pod brodą — wersja ze
   spodem prosto do oka czytała się jak tasak.
4. **Wpięte**: 7 ikon, 6 × `1×2`; w silniku bez braków; `gabaryt_przymiar`
   zielony (33 przedmioty 1×2).

## 2026-10-01 — reguła „broń średnia i duża = 1×2"; naprawa utraty przedmiotu w lalce

1. **Decyzja autora:** gabaryt 1×2 dla broni to REGUŁA, nie wyjątek
   („łatwiej rysować duże i średnie bronie na dwóch kratkach"). Zamyka
   `OI-123` i zaparkowane miecze (§10.8): dziewięć mieczy zostaje na 1×2,
   znaczniki „TYMCZASOWE" zdjęte.
2. ⚠⚠ **Przy wpinaniu znaleziony ŻYWY błąd utraty przedmiotu (`OI-124`).**
   `equipFromBag` zakładał zamianę jeden na jeden i ignorował odmowę
   `addInstance`. Sonda na prawdziwych modułach: sztylet za miecz przy
   pełnym plecaku → `true`, **miecz znika**; to samo puklerz za pawęż —
   czyli błąd był w grze od tarcz 1×2 (2026-09-19). Opis `OI-124` mówił
   „`addInstance` i tak odmówi, a wołający to obsługują" — wołający NIE
   obsługiwał. Naprawa: `Inventory.canFitAll` + `Equipment.returningFor`,
   odmowa dla każdego slotu z komunikatem; `useSlot` zakłada TEN kafel
   (`equipFromBag(index)`), nie „pierwszy taki".
3. **`gabaryt_przymiar`**: lista dozwolonych zastąpiona regułą „gabaryt
   wynika z ikony konstrukcji" (czyta PNG); od razu złapała sześć metalowych
   tarcz bez własnej ikony — zgodnie z zasadą „konstrukcja, nie materiał"
   reguła patrzy na ikonę konstrukcji. Nowa §K: 7 przypadków zamiany, dwa
   czerwone bez naprawy. Przymiar **w całości zielony** (był 4, potem 3
   czerwone). Pozostałe bramki `Equipment` bez zmian względem HEAD.
4. Przy okazji zamknięte `OI-114` (widły mają ikonę od wczoraj).
5. ✅ **Miecze 1×2 po skosie 1:2** — autor po przymiarze na półce: „o niebo
   lepiej pasuje do gry". REGUŁA: broń zawsze po skosie, kąt z gabarytu
   (1×1 → 45°, 1×2 → 1:2). `build_sword_icons.py` przepisany w pasach osi
   (kropkowanie z przymiaru zniknęło), kotwica dobierana od ramki, pałąk
   rapiera po stronie światła; zapisane i sprawdzone w plecaku
   (`docs/gemini_weapon_icons.md` §10.9).

## 2026-09-30 (2) — wsad broni DRZEWCOWYCH: projekt Gemini, skos 1:2, wpięte

1. **Wsad 5 broni** (`docs/gemini_weapon_icons.md` §11): sześć drzewcowych
   w jednym arkuszu 16:9 + miecz jako kotwica skali. Nowa zasada skali:
   **grot 0,44 px/cm, drzewce skrócone** (pełna skala: włócznia 97 px, pika
   198 px). Arkusz v1 przyjęty bez odrzutu — groty trzymały skalę miecza ±3 px.
2. **Układ: skos 1:2 od rogu do rogu 32×64** (decyzja autora: „po skosie
   wyglądają lepiej"). Przymiar trzech układów rozstrzygnął, że 45° odpada
   (w 32 px tylko ~43 px, rohatyna = miecz z jelcem), a pion jest sztywny.
   Koszt skosu: symetria liścia nie jest symetrią kratki.
3. **`tools/build_polearm_icons.py`** — całkowite osie `s = x+2y`, `u = 2x−y`
   (pas 4 `u` = 2 px drzewca na wiersz). Cztery przebiegi, wszystkie wady
   widoczne dopiero na renderze: drzewce między zębami wideł, „trzeci ząb"
   z rozchylonych końców, topór halabardy jako pusta ramka, glewia jak miecz
   na kiju. Asercje sprawdzone psuciem danych.
4. **Wpięte do gry**: `iconTexture` + `inventoryFootprint 1×2` przy sześciu,
   `ASSETS.iconWeaponPolearms`. W silniku: `dev.missing` puste,
   `totalFailed` 0, w plecaku po 2 pola. `gabaryt_przymiar.mjs`: dwie reguły
   unieważnione przez drzewcowe przepisane mocniej; zostają 3 czerwone
   należące do zaparkowanych mieczy (było 4).
5. ⏳ Otwarte: ocena piki ↔ włóczni i ostrza halabardy w grze; miecze 1×2
   (§10.8) dostały trzecią opcję — skos jak drzewcowe.

## 2026-09-30 — wsady 5–7 wpięte, pancerz pokryty ikonami, przegląd czytelności; zasada warstwy, droga do MVP

Trzy zmiany w dokumentach przed wysłaniem promptu wsadu 5
(nogi: metal) do Gemini.

1. **Układ 3×2 → 4×2.** Bilans sześciu arkuszy: wszystkie cztery 16:9
   trzymały kratę, oba 4:3 były złamane (Gemini oddaje 16:9 i dopycha
   komórki zmyślonymi sztukami). Wolne komórki = dodatkowe kotwice ze
   wsadu 4 (`docs/gemini_armor_icons.md` §8.0).
2. ⛔ **Wariant 1 („płyty NA spodniach”, 2026-09-28) ODWOŁANY** na widok
   promptu — autor: sztuki „wyglądają jak połączone warstwowane, zwłaszcza
   blacha i przeszywanice”. Obszar przyjmuje L1+L2+L3 naraz, więc ikona L3
   z pikowanym lnem pod spodem to dwa przedmioty w jednym. Nowa zasada dla
   wszystkich obszarów: **ikona pokazuje tylko swoją warstwę** (§1, §8.0b).
   Klata od początku tak szła; nogi były wyjątkiem.
3. **Droga do grywalnego MVP** zapisana w `docs/roadmap.md` §0.1: assety
   → nakładanie broni i pancerza na model 3D → las i modele 3D przeciwników
   → gameplay. Graficzne nakładanie się warstw (przeszywanica wystająca
   spod kolczugi przy rękawach, szyi i pasie; płyty przykrywające resztę)
   → `docs/odlozone.md` §3 jako **nice to have** po MVP.
4. **Wsad 5 przyjęty i wpięty** — 6 ikon (5 konstrukcji + `iron_legs`),
   slot nóg zamknięty. Krata 4×2 trzymana, zasada warstwy trzymana. Dwie
   sztuki złapane WYŁĄCZNIE na renderze przy zielonym raporcie: lamelka
   (szum → głosowanie + nowa faktura `lamele_rzedy`) i nabiodrki (plama →
   głosowanie; linie styku płyt przy brzegu dublowały obrys, `gruby_kontur`
   na czerwono 0,152 → `styki_przy_brzegu`, próg nieruszany). 31 starych
   ikon bajt w bajt bez zmian. ⚠ Zrzutu plecaka brak — ukryty panel
   (`docs/gemini_armor_icons.md` §8.4).
5. **Poprawki wsadu 5 po ocenie autora** (§8.5): symetria nabiodrek
   i lamelki (lustro dla kształtu, przesunięcie dla tonów — światło zostaje
   z lewej góry), sprzątanie śmieci (dziury w pasie, 2-pikselowe klamry,
   ostrogi) i łuska z prześwitem skóry, żeby w 1× nie myliła się z kolczugą.
   ⭐ Autor: **przegląd całej rodziny ikon dopiero po wygenerowaniu
   wszystkich przedmiotów** — nie wcześniej.
6. **Wsad 6 (buty) przyjęty i wpięty** — 9 ikon. v1 w PROFILU (wzór starych
   `items.png`) autor odrzucił bez wrzucania; ✅ decyzja: **para prosto
   z przodu** (§9.0). v2: Gemini narysowało linie kraty → `bez_kresek`;
   skórzane buty tej samej wysokości co buty piechura → wycięty pas
   cholewki (`skroc`) zamiast losowania. Cztery czerwone kontrole, wszystkie
   prawdziwe; jedyny wyjątek od kontroli dziur: prześwit półpłytowych
   (`przeswit`, to jest konstrukcja). Nowa rampa łyka `BAST`. Zrzut plecaka
   w grze zrobiony (§9.4).
7. **Wsad 7 (rękawice + naramienniki) przyjęty i wpięty** — 9 ikon.
   ✅ **Pancerz pokryty w całości: 55 ikon, zero sztuk na wspólnym kaflu
   `items.png`.** Zamówione 3×3 / 1:1, przyszło 5×2 / 16:9 — ⭐ trzeci raz
   Gemini oddaje 16:9 bez względu na zamówienie. Owijki z gołymi palcami
   (`bez_skory`), kolcze z pięcioma palcami zamiast łapawicy (`lapawica`),
   kratka pikowania natywnie. Zrzut plecaka w grze zrobiony (§10.4).
8. **Przegląd czytelności całego pancerza** (§11) — kryterium autora:
   czytelność ważniejsza od detalu; zakres: tylko pancerz. Audyt na tle
   kafla plecaka z tarczami jako wzorcem → dwie nowe kontrole (kontrast
   ≥ 50, szum ≤ 0,55; progi z tarcz), które przed poprawkami zaświeciły na
   13 sztukach. Jaśniejsze szare żelazo (żelazna kolczuga 28 → 54),
   jaśniejsze płótno, przygaszony len, jedna łuska i jedna lamelka we
   wszystkich slotach, splot łapci. ⭐ Lekcja: pod wzorem faktury ma leżeć
   JEDEN ton na element — ton per piksel z arkusza migotał przy regularnym
   wzorze. 26 ikon zmienionych, 29 bez zmian. Nóż i sztylety (też ciemne
   żelazo) świadomie poza zakresem — OI-126.

---

## 2026-09-28 — ikony pancerza: wsady 3–4 wpięte, obrys, reguła spodni

Cel: ciąg dalszy odświeżenia ikon pancerza (`docs/gemini_armor_icons.md`).
Wsad 3 (klata: kolczuga i metal, 7 konstrukcji) i wsad 4 (nogi: len, skóra,
kolczuga, 5) przeszły przez `tools/build_armor_icons.py` i są w grze —
razem **31 ikon**. Wsad 5 (nogi: metal) ma gotowy prompt.

**Co złapał wyłącznie render, przy zielonym raporcie:**
- nity brygantyny, łuski i blaszki lamelki nie przeżyły zejścia 2× →
  faktury natywne (`nity`, `luski`, `lamele`); pary nitów w 1× zlewały się
  w paski, stąd pojedyncze nity w równej kracie;
- ⚠ **„nieprzyzwoicie duży obrys" (autor) na WSZYSTKICH ikonach od
  pilota** — kontur z 8-sąsiedztwa plus niezdjęta obwódka arkusza. Pomiar:
  27–77% drugiego pierścienia było konturem, u tarcz 0%. Po poprawce 0–7%;
  nowa asercja `gruby_kontur` sprawdzona psuciem obu przyczyn osobno (§6.5).

**Dwie decyzje autora, które wyszły dopiero na widok promptu:**
1. **Slot nóg = zawsze SPODNIE** — model 3D gracza będzie w bieliźnie,
   przedmioty nakładane jak w WoW. Prompt wsadu 4 z osobnymi nogawicami
   odrzucony przed wysłaniem.
2. **Metal na nogach = płyty NA spodniach** (wariant 1), nie płyty na pasie.

Rozjazdy nazwa/opis ↔ grafika (Szyszak, „nogawice”, żelazne nagolenniki
z opisem szyn) zebrane jako `OI-152` (CONTENT). Ocena całości — autor, na
telefonie, później; do tego czasu ikony stoją z dopiskiem „PILOT”.

---

## 2026-09-27 (3) — ikony rodziny sztyletów: od Gemini do generatora

Cel: nowe ikony noża / noża myśliwskiego / sztyletu / mizerykordii na poziomie
tarcz. Najpierw dopasowanie wsadu Gemini (odrzucone: za małe, jelce ginęły przy
skalowaniu), potem generator proceduralny i ~20 iteracji noży sterowanych
recenzjami z Gemini.

**Właściwa przyczyna porażek z piętą noża** znalazła się dopiero na końcu:
rysowanie „jeden zakres [lo..hi] na wiersz płótna" nie potrafi wyrazić cięcia
prostopadłego do osi 45° — wiersz przechodzi wtedy przez róg pięty, szczelinę
i rękojeść. Noże przepisane na osie broni (`s`, `u`) i rasteryzację piksel po
pikselu; rozstrzygnęło zdjęcie noża kuchennego od autora.

Stan: `tools/build_ikony_sztyletow.py` (przymiar / `--zapisz`), asercje:
grzbiet prosty, pięta z luką, zero dziur, paleta, złote SHA1 zamrożonego
sztyletu i mizerykordii — każda sprawdzona na zepsutych danych. Wnioski dla
mieczy: `docs/gemini_weapon_icons.md` §9.

---

## 2026-09-27 (2) — gracz nie ma już czterech kierunków

Decyzja autora: model 2D/4-kierunkowy gracza jest legacy i z niego
wychodzimy. Cztery etapy, po każdym `tsc` + build + regresja 121/121:

1. **Mechanika na kąt** — `facingVector` i unik bez drążka z `zwrotRad`
   (`OI-148`, `OI-149` zamknięte; na żywo 6 kątów × 5 ścieżek, 0,0°).
2. **Martwy kod** — `guardDir`/`attackFacing`/`facingDir`, `KAT_ZWROTU`.
   ⚠ Stara asercja N1 przeszłaby po usunięciu gettera na pustym wycinku —
   przepisana i sprawdzona mutacjami na czerwono.
3. **Stan** — pola `moveDir`/`attackDir` usunięte; arkusz 2D (zostaje jako
   fallback) liczy rząd z kąta w `wierszArkusza`.
4. **Typ** — `GuardFacing = number`; dane testowe na kątach, wynik bit w bit.

Pełny zapis: `docs/postac3d_checkpoint.md` §38.

---

## 2026-09-27 — domknięcia wątku 3D bez nowych assetów

Zakres wybrany pod warunek autora „nic, co wymaga nowych grafik":

- ✅ **`OI-150`** — Wir ostrzy celuje wzdłuż zwrotu przed `triggerAttack`;
  wcześniej poza i osłona szły za POPRZEDNIM ciosem (tarcza na plecach).
  Na żywo 5/5 przez prawdziwą ścieżkę umiejętności.
- ✅ **`OI-147` wariant A** — `heading` w `triggerAttack` z `attackRad`;
  pierścień efektu i wypad mają jeden wektor, różnica 0° na 8 kątach.
- ✅ **`OI-118` audyt** (opis stanu, bez zmian w `Character3D`): klip ciosu
  364 ms dla każdej broni, cięcie zawsze w 182 ms — sztylet trafia ~110 ms
  przed nim. Wykryte **`OI-151`**: poziomowe wyzwalanie odpala klip 2×
  (Uderzenie tarczą) i 3× (Ciężkie uderzenie) w jednym zamachu.
- ✅ **`OI-137` zamknięte pomiarem** — nieaktualne od A4. Blender bez okna na
  kopii `char.blend`: generator odtwarza plik bit w bit, 42/44 kluczy steruje.
  ⚠ Pułapka pomiaru: cztery klucze ruszają kości albo atrybut `zona`, nie
  wierzchołki — sam test siatki zgłasza je fałszywie jako martwe.

Pełny zapis: `docs/postac3d_checkpoint.md` §36–37 i sekcja `OI-137` w §3.

---

## 2026-09-23 — AUDYT GEOMETRII ATAKU: `OI-147` przeformułowane, celowanie w przestrzeni ciał

Kierunek autora po V3: nie modelować dalej anatomii, najpierw spójność
model → wypad → hitbox. Dwa wnioski, oba z pomiaru na żywo:

1. **`OI-147` pytało o hitbox, którego nie ma.** Autoatak trafia po celu,
   zasięgu i bramce zwrotu; skwantowany `heading` rysuje tylko pierścień efektu.
   Trafienie 13/13 przy środku pierścienia do 52 px od celu. Wariant A zostaje
   czystą prezentacją — niewdrożony.
2. **Prawdziwy rozjazd siedział w źródle kąta.** `attackRad` liczony był między
   środkami SPRITE'ÓW, więc model, wypad i osłona w oknie zamachu odjeżdżały do
   36,7° od ciała celu. Naprawione (`GameScene.bodyVectorTo`, trzy miejsca, w tym
   kurs lotu Szarży/Wypadu); po zmianie 0,0° na 7 gatunkach × 8 kątach.

Nowe: `OI-148` (`facingVector` czterokierunkowy), `OI-149` (unik bez drążka),
`OI-150` (Wir dziedziczy stary kąt — tarcza kryje plecy). Pełny zapis:
`docs/postac3d_checkpoint.md` §36.

⚠ Pułapka pomiaru: w ukrytym panelu przeglądarki zegar gry stoi — pompować
`game.step()` ręcznie, inaczej zamach się nie rozstrzyga i wygląda to jak błąd.

---

## 2026-09-21 (4) — TRZY ROZSTRZYGNIĘCIA AUTORA WPROWADZONE

**(1) `OI-104` / `OI-143` — zderzenie numeru rozwiązane.** Kanon: `OI-104`
zostaje przy **Modelu D** (zamknięte decyzje zachowują numery), kumulacja
zestawów dostaje **`OI-143`**. Przeniesione **15 referencji** w siedmiu
plikach. ⚠ **`docs/dziennik.md` NIE został przepisany** — to `HISTORIA`, więc
zapis z 15 września mówi, co było wtedy; dostał dwa wskaźniki w przód.
⚠ Jeden rozjazd wyszedł dopiero przy audycie końcowym: `docs/README.md`
niósł znaczenie B i mój zgrubny filtr go ukrył.

**(2) `OI-142` — nowy punkt wejścia.** Powstał `docs/checkpoint_2026-09-21.md`
(router, nie opis projektu: etapy zamknięte, najważniejsze otwarte `OI`,
świadomie odłożone, stan przymiarów, granice zakresu). `CLAUDE.md`
i `docs/README.md` na niego wskazują; `checkpoint_2026-09-17.md` zdegradowany
z zachowaniem swojego zakresu, **żaden stary checkpoint nie został usunięty**.

**(3) `OI-133` — cofnięcie sprzedaży jest operacją ATOMOWĄ.** Wdrożone.
`undoLastTransaction` sprawdza WSZYSTKO przed mutacją i kasuje
`lastTransaction` dopiero po sukcesie; trzy ścieżki odmowy (brak miejsca ·
brak złota · nieudane `takeBackBought`) nazywają powód przez `refuseUndo`,
a transakcja zostaje do ponowienia.
⭐ O miejsce pyta **`Inventory.hasRoomFor`**, które **już było świadome
gabarytu** — nie trzeba było nowej mechaniki. Doszedł nie-mutujący
`canTakeBack`, żeby kontrakt „albo całość, albo nic" nie wisiał na tym, że
`qty` w pętli jakościowej jest dziś zawsze 1.
⚠ **Świadomy koszt, zgłoszony przed wdrożeniem:** dawny komentarz bronił
przycisku przed „lingering" — zakup rzeczy już zużytej jest nieodwracalny na
zawsze, więc „Cofnij" zostaje i powtarza odmowę. Autor rozstrzygnął na rzecz
atomowości. **Zmian w semantyce finansowej nie było** — każda ścieżka jest
dziś ściśle „wszystko albo nic", czyli bezpieczniejsza niż poprzednia.

**Testy.** `tools/sklep_cofniecie.mjs` §5 przepisane z *charakterystyki wady*
na **kontrakt**: 11 asercji, w tym zamiatanie `hasRoomFor` ⟷ `addItem` po całym
katalogu (**3255 prób, 0 rozjazdów**, próbka trafia w obie odpowiedzi).
Sabotaż **6/6**, pliki przywrócone bajt w bajt.

⚠⚠ **Lekcja sesji: §5h było dekoracją i wyszło to dopiero przy sabotażu.**
Wzorzec `Inventory.gold < cost[\s\S]*?refuseUndo\(` przeskakiwał do
komunikatu NASTĘPNEJ ścieżki, więc po usunięciu właściwego przechodził na
zielono. Naprawione oknem LINII. Zapaliło się tylko §5i — gdyby go nie było,
regres przeszedłby niezauważony.

⚠ **Druga rzecz do zapamiętania: `docs/systemy/inventory.md` miał ~55 bajtów
zapasu** do TWARDEGO limitu `STAN` (20 KB; dla `STAN` limit jest BŁĘDEM, nie
ostrzeżeniem). Dopisana reguła wywaliła bramkę, więc trafiła tam, gdzie i tak
jest jej miejsce — do `src/core/CLAUDE.md`, obok kodu `Inventory`.

**Nietknięte:** `B1` (obciążenie `W4`) i cały wątek 3D.

Bramki: `tsc --noEmit` ✅ · `npm run build` ✅ · `doc_check` ✅ 0 błędów ·
**29 z 30 przymiarów zielonych** (czerwony wyłącznie `obciazenie_przymiar` W4).

---

## 2026-09-21 (3) — PORZĄDKI PO AUDYCIE: cztery zamknięte, cztery zostawione

Druga część audytu. **Zasada tej sesji: zamykam tylko to, co da się zamknąć
technicznie; wszystko, co wymaga wskazania kanonu albo UX, zostaje otwarte.**

**ZROBIONE**

- **`**Po` usunięty.** ⚠ Dwa zaskoczenia: plik był **śledzony przez gita**
  (mój wcześniejszy `grep '^\*\*Po'` nie trafiał, bo na dysku to bajty
  `EF 80 AA`, nie gwiazdki), a jego prawdziwa nazwa to dwa znaki **U+F02A**
  (Private Use Area) plus `Po` —
  MSYS koduje tak nielegalną na Windows gwiazdkę w Private Use Area. Stąd `ls`
  pokazywał `**`, a `os.listdir` co innego. Wszedł w `be9a896` jako 0/0 i przez
  całą historię miał 0 bajtów.
- **Punkt wejścia (`CLAUDE.md`).** `checkpoint_2026-09-17.md` stał jako
  „BIEŻĄCY PUNKT WEJŚCIA", choć repo poszło cztery dni dalej. Baner poprawiony
  w idiomie, którego repo już używa dla `checkpoint_2026-09-16`. ⛔ **Nowego
  punktu wejścia NIE nadałem** — to decyzja autora, zarejestrowana jako
  `OI-142`. Do tego czasu kontekst nadrabia się z tego dziennika.
- **`OI-133` dostało diagnostykę** — `tools/sklep_cofniecie.mjs` §5, 8 asercji,
  sabotaż 3/3. ⚠⚠ **Przy okazji ustalenie: cichych wyjść w `undoLastTransaction`
  są TRZY, nie jedno** (brak miejsca · brak złota na odkup · nieudane
  `takeBackBought`). Poprzedni opis wymieniał tylko brak miejsca.
  ⭐ §5 pokazuje też, że `Inventory` **sygnalizuje** niepowodzenie wartością
  zwrotną — silnik wie, wołający tę wiedzę wyrzuca. ⛔ Zachowania NIE zmieniono:
  UX przy braku miejsca to decyzja autora.
- **`OI-104` zinwentaryzowane** — 19 odwołań znaczenia A (Model D, ZAMKNIĘTE)
  i 13 znaczenia B (kumulacja zestawów, OTWARTE), z adresami. Do tego
  adnotacja przy zestawieniu, bo rejestr liczył `104` jako zamknięte i
  jednocześnie trzymał je jako otwarte zderzenie.

**ZOSTAWIONE ŚWIADOMIE**

- ⛔ **A3 — wspólny stub Phasera: NIE ROBIĘ, i moja własna diagnoza z rana była
  błędna.** Liczba „18 identycznych stubów" pochodziła z luźnego grepa.
  Pomiar: **10 RÓŻNYCH stubów w 19 narzędziach**, a różnice niosą treść —
  7 narzędzi ma pusty obiekt, 4 jego drugą pisownię, reszta to stuby cięte pod
  konkretną potrzebę (same `Math.Clamp`; sam `DegToRad`; `Math` + emiter;
  emiter pełny). ⭐⭐ **Minimalizm jest tu MECHANIZMEM, nie niechlujstwem:**
  `bieglosc_weryfikacja` pisze wprost „gdyby `EventBus` sięgnął głębiej,
  bundlowanie padnie tutaj — głośno, a nie po cichu", a `combat_regresja` —
  „stub z dokładnie tymi dwiema funkcjami, dzięki czemu uruchamia się
  PRAWDZIWY `isFrontal`, a nie jego kopia". Jeden wspólny, tłusty stub
  **wygasiłby ten czujnik w 19 narzędziach naraz**. Realna duplikacja to
  jednolinijkowy idiom w dwóch pisowniach — wyciąganie go do modułu dodaje
  pośredniość zamiast ją usuwać. Do decyzji: czy w ogóle chcemy wspólnego
  modułu z NAZWANYMI wariantami (`stubPusty`/`stubMath`/`stubEmiter`), co
  czujnik zachowuje, ale dotyka 19 przymiarów.
- ⛔ **B5 — dokumenty ponad limit: zostają.** Rozstrzyga sam `DOC_CONTRACT` §8:
  limit jest bramką **wyłącznie dla `STAN`**, a **ponad limitem nie ma ANI
  JEDNEGO `STAN`-u** (19 przekroczeń to `OPERACYJNE`/`KANON`/`DECYZJA`, czyli
  z założenia nieblokujące ostrzeżenia). Wszystkie cztery kroki cięcia z §8
  przenoszą albo reklasyfikują treść — to decyzja o zawartości, nie edycja.
  ⚠ Uczciwie: `docs/zadania.md` urosło w tej sesji 41,3 → 44,0 KB przez
  inwentaryzację `OI-104`.
- ⛔ **B1 — obciążenie `W4` (59,7 kg wobec pasma 40–55 kg): NIE TKNIĘTE**
  na wyraźne polecenie. Świadomie odłożone do etapu balansu; nie jest blokerem.

Bramki: `tsc --noEmit` ✅ · `npm run build` ✅ · `doc_check` ✅ 0 błędów ·
**30 z 31 przymiarów zielonych** (czerwony wyłącznie `obciazenie_przymiar` W4).

---

## 2026-09-21 (2) — AUDYT: martwa asercja obrysu + PIERWSZY przymiar ZAPISU

Sesja bez decyzji projektowych — audyt repo pod kątem rzeczy do poprawienia
„od ręki". Dwie rzeczy zrobione, jedna zgłoszona do rozstrzygnięcia.

**(1) `occlusion_weryfikacja` §D zgasło po cichu — i kontrola negatywna to
złapała.** Bramka była CZERWONA na `D4`. Diagnoza: nie regres obrysu, tylko
**martwa próbka**. `PLAYER.scale` poszedł 1 → 1,15 (V3.5, 2026-09-20), więc
sylwetka urosła 31 → 35,65 px, a najszerszy pusty margines w rosterze stempli
ma 32 px. Strażnik `GRACZ_W/2 < margines/2` przestał przepuszczać cokolwiek:
pętle `D2` i `D4` robiły **zero obiegów**, `D2` przechodziło trywialnie, a `D4`
świeciło. ⭐ **To jest dokładnie ten przypadek, dla którego `D4` napisano** —
asercja, która nie potrafi zaświecić na czerwono, jest dekoracją, i tylko
kontrola negatywna umiała to powiedzieć.
Naprawa: próbkę dosunięto do krawędzi rysunku zamiast stawiać ją na środku
marginesu (bada tę samą własność, nie wymaga, by gracz mieścił się w
marginesie). Doszły dwa strażniki: „próbka naprawdę coś sprawdza (31 stempli)"
i „robi to NA WYSOKOŚCI korony". §D idzie dziś po **31 stemplach**, `D4` daje
31/31. Sprawdzone sabotażem: rejestracja całej komórki zamiast rysunku zapala
`D2` na 31 fałszywych obrysów.

**(2) `OI-50`: zapis dostał pierwszy przymiar w historii projektu.**
`tools/zapis_weryfikacja.mjs`, **59 asercji**, sześć sekcji: pełny obieg
zapis→wyczyszczenie→wczytanie (§A), całkowitość odmowy przy obcej wersji (§B),
**strukturalne sprawdzenie ze źródła, że każde pole `SaveData` jest i pisane,
i czytane** (§C), wczytanie zapisu bez wszystkich pól opcjonalnych (§D), klucze
i izolacja slotów (§E), wyciszenie autozapisu (§F).
⭐ **Sabotaż: 14 mutacji `Save.ts`, 14 wykrytych, zero przeoczonych** (plik
przywrócony bajt w bajt).

⚠ **Najdroższa lekcja tej sesji jest w §A1.** Pierwsza wersja porównywała
migawkę JAKO CAŁOŚĆ i przechodziła, choć wycięcie `Equipment.weapon2` z
`load()` nie zapalało niczego — bo postać testowa nie miała schowanego zestawu,
a pole puste po obu stronach „wraca" zawsze. Strażnik jest dziś **per pole**, a
postać wypełnia **każdy** blok zapisu. Trzy fałszywe alarmy, które przy okazji
z tego wyszły, były błędami przymiaru, nie kodu, i są opisane przy nich:
`normalizeInstance` zdejmuje `durability` pancerzowi (bo pancerz trwałości
jeszcze nie ma), `load` DOSYPUJE plecakowi pojemność obiecaną przez torby, a
„Nową grę" robi `Abilities.resetLoadout()`, nie `reset()`.

⛔ **`OI-50` NIE zostało zamknięte — zostało ZAWĘŻONE.** Przymiar pokrywa
SKUTEK reguły addytywnej, ale nie widzi tego, czy nowe pole *zadeklarowano*
jako opcjonalne, ani czy `SAVE_VERSION` nie poszedł w górę bez powodu. To są
reguły o przyszłej edycji, nie o dzisiejszym stanie. Zamknięcie to decyzja
autora, nie wniosek z zieleni.

**(3) Do rozstrzygnięcia — `obciazenie_przymiar` `W4` jest CZERWONY.**
„Najcięższy osiągalny zestaw mieści się w paśmie kalibracji (40–55 kg)" →
**59,7 kg**. Był czerwony przed tą sesją i **nie został tknięty**: to skutek
rozrostu katalogu (broń 11 → 37, tarcze, warstwy), więc albo pasmo idzie w
górę, albo masy w dół — jedno i drugie jest decyzją Game Directora, nie
poprawką techniczną.

Bramki po sesji: `tsc --noEmit` ✅ · `npm run build` ✅ · `doc_check` ✅ 0 błędów ·
**29 z 30 przymiarów zielonych** (czerwony wyłącznie `obciazenie_przymiar` W4,
patrz wyżej).

---

## 2026-09-21 — A6: BROŃ 1H + TARCZA = CLOSED

**A5** (zwrot modelu z intencji gracza, nie z `body.velocity`) · **A6.1** (kąt
noszenia miecza przestrojony po A2, `OI-136`) · **A6.2** (tarcza CARRY —
`chwyt` wyliczany z macierzy kości, lico wzdłuż boku) · **A6.3** (tarcza GUARD
— lico do zagrożenia, `OI-140`). Pełny zapis: `docs/handoff_2026-09-20_fundament_postaci.md`
§3g–§3k.

⭐ **Najdroższa lekcja tej sesji nie dotyczy geometrii, tylko PRZYRZĄDÓW.**
Cztery razy z rzędu autor zobaczył na renderze coś, czego zielona bramka nie
widziała, i za każdym razem przyczyną była asercja mierząca **nie to, co poza
ma robić**:

1. bramka broni liczyła „bezruch" z klatki 0 akcji ATAKU (poza gotowości), a od
   A2 postać stojąca gra klatkę `BEZRUCH` klipu chodu;
2. bramka tarcz mierzyła klipy `Walk`/`Walk_Armed`, w których pozy niesienia
   tarczy w ogóle nie ma;
3. test przenikania liczył **parzystość przecięć promienia na CIENKIM DYSKU** —
   przypadek zdegenerowany; raportował 100 wierzchołków „w tarczy" przy tarczy
   odsuniętej 1,45 j. poza rękę;
4. reguły relacji ręka↔tarcza (pisane pod CARRY) zaświeciły na czerwono na
   **poprawnej** pozie GUARD, bo w gardzie tarcza MA być przed ręką i licem
   do widza.

⛔ Wniosek zapisany w `tools/CLAUDE.md`: **bryłę o znanym kształcie licz wzorem,
nie promieniem**, a każdy przyrząd geometryczny ma mieć **samokontrolę na
przypadkach o znanej odpowiedzi — co najmniej jeden PASS i jeden FAIL**.
Wzorzec: `char3d_clearance.samokontrola` (cztery przypadki, pierwszy i ostatni
identyczne, żeby złapać przeciek stanu).

## 2026-09-20 (A2) — CHÓD: cykl 4-kluczowy, stopa naprawdę odrywa się od gruntu

**Etap A2 fundamentu postaci 3D.** Akcja `Walk` przebudowana z 3 kluczy na
symetryczny cykl 4-kluczowy + osobną klatkę bezruchu. Nowy generator
`tools/char3d_walk.py`; pełny zapis w `docs/handoff_2026-09-20_fundament_postaci.md`
§3d, kontrakt w `tools/CLAUDE.md`.

**Diagnoza wyszła inna, niż zakładał plan.** „Uniesienie 0,07 j." nie było
parametrem do podbicia:

- składało się z trzech kanałów, a jeden działał w przeciwną stronę —
  `Bone.005`, korzeń WSZYSTKICH kontrolek IK, jechał w górę razem z miednicą,
  więc stopy unosiły się razem z biodrem;
- cykl był **asymetryczny 2:1** (jeden krok 0,4 s, drugi 0,2 s) — kuśtykanie,
  a nie chód;
- noga w kontakcie siedziała na **100,8% zasięgu**, kolano na 179,8°, a IK
  gubiło cel o 0,043 j.;
- przy 3 kluczach **nie było gdzie postawić szczytu** dla prawej nogi (środek
  jej wymachu wypada w f = 2,5, gdzie klucza nie ma). Dlatego poprzednia
  poprawka musiała go spłaszczyć — to nie była ostrożność, tylko brak miejsca
  w strukturze. Naprzemienny chód wymaga PARZYSTEJ liczby kluczy.

**Render powiedział to, czego liczby nie mówiły.** Pas klatek z żywej gry
(bufor 96×128) pokazał, że przy marszu NA KAMERĘ postać praktycznie stoi:
stride jest ścięty przez `sin 15°` do ~6,5 px, a pion dawał 0,5 px. Z boku
chód czytał się poprawnie — i dlatego problem przeżył kilka sesji.

**Decyzja autora, która odblokowała etap:** poza bezruchu dostaje **własną,
piątą klatkę poza pętlą**, a nie osobne klipy `Idle_*`. W poprawnym cyklu nie
ma ani jednej klatki z obiema stopami płasko i razem — stary cykl taką miał
tylko dlatego, że był zdegenerowany. `Character3D.paraKlipow` tnie jeden klip
`subclip`-em na pętlę 0–4 i zamrożoną pozę na klatce 5: **jeden klip na stan
wyposażenia**, zero nowych akcji w Blenderze i w `.glb`.

**Cztery rzeczy złapane dopiero pomiarem, każda warta zapamiętania:**

1. `scn.frame_set(f)` wołane PO ustawieniu pozy kasuje ją z akcji, a pomiar
   i tak coś zwraca — objawem było sześć klatek z identycznymi liczbami.
2. Spoczynek kości stopy to „wzdłuż goleni", nie „płasko": stopa wbijała piętę
   **0,63 j.** w grunt przy idealnie poprawnej kostce. Raport cyklu był
   zielony; złapała to dopiero bramka broni.
3. Palce w dół w powietrzu (+16°) **zjadały prześwit** z 5,6 px do 3 px —
   uniesienie było w liczbach, nie na ekranie. Znak odwrócony na −10°.
4. Zakończony `fadeOut` w three.js **wyłącza akcję**, a `setEffectiveWeight`
   na wyłączonej daje zero. Po pierwszym ciosie postać wchodziła w bezruch
   z sumą wag ZERO i wracała do pozy spoczynkowej rigu (ręce na boki).
   Zmierzone w grze, naprawione jednym `enabled = true` w `krok()`.

**Korekta na zamknięcie sesji: `bujanie` 0,42 → 0,30** (decyzja autora).
Geometrycznie obie wartości są poprawne; 0,42 czytało się jako za mocne
kołysanie. Cena jest zmierzona i warto ją znać: głowa buja się o **3 px**
w buforze zamiast 4, **zapas zasięgu nogi w kontakcie maleje z ~4 pp do
~2 pp** (97,1–98,2% wobec granicy 100%), a `dodaj_rozchylenie_ramion` wpada
w osobliwy jakobian na większej liczbie klatek — stąd **asymetria ramion do
0,198 j. (~1 px) na klatkach kontaktu**, której przy 0,42 nie było. Wszystkie
asercje, bramki i żywa gra: bez zmian. **A2 zamknięte.**

**Bramka broni poprawiła się przy okazji**: broni zamiatających grunt 3 → 1,
miecz 1,71 j. → 0,46 j. pod linią gruntu (`OI-136` zaktualizowane). Reszta
poprawy nie wzięła się z pozy niesienia — wzięła się z tego, że podłoga
przestała się ruszać.

⚠ **Poślizg stopy świadomie NIE był naprawiany i nie jest usterką animacji.**
Gracz jedzie 150 px/s przy sylwetce 69 px = 2,17 wzrostu/s (człowiek IDĄCY
robi ~0,8); stopa podporowa musiałaby cofać się o 45–60 px na krok w
sprite'cie szerokim na 35 px. To jest skala lokomocji, nie cykl chodu —
zapisane jako **`OI-138`**, decyzja należy do autora.

⚠ **Panel przeglądarki zamraża `requestAnimationFrame`** (`game.loop.frame`
stoi), więc wejście z klawiatury nie dociera do Phasera i żywy test „przejdź
się postacią" jest tam niewykonalny. Zamiast udawać, że działa, sterowano
`Character3D.krok()` wprost, z podstawioną prędkością ciała — ta sama
ścieżka kodu, prawdziwy wybór klipu, prawdziwy render do bufora gry.

---

## 2026-09-19 (9) — POSTAĆ 3D: generator bazy, V2 odrzucona, V3 do oceny

⛔ **Nic z tej sesji nie jest zaakceptowane i nic nie jest zacommitowane.**
Punkt wejścia: **`docs/postac3d_checkpoint.md`**.

Zgłoszenie brzmiało: gracz za mały, głowa za duża i zbyt okrągła, twarz
nieczytelna, model ma być bazą pod przyszłe humanoidy. Ciało i głowa są od
dziś **generowane** z proporcji (`tools/char3d_base.py` + przymiar
`tools/build_char3d_base.py`), a nie lepione ręcznie.

**Dwie iteracje, pierwsza odrzucona.** V2 dostała proporcje z antropometrii
(6,34 głowy, rozpiętość ramion = wzrost) i przeszła wszystkie asercje — po
czym została odrzucona wizualnie jako „manekin z głową jak pinezka, kobiecą
linią barków, z innej stylistyki niż NPC-e".

⭐⭐ **Lekcja sesji: humanoida do tej gry nie ocenia się antropometrią.**
Dopiero pomiar **istniejących NPC-ów** pokazał skalę pomyłki — pixel-artowi
wieśniacy mają **3,0–3,9 głowy**, głowę na **0,64–0,71 szerokości barków**
i sylwetkę **0,47–0,55 wzrostu**. V2 miała odpowiednio 6,34 / 0,33 / ~0,25.
Benchmarkiem są NPC-e i render z gameplayu, nie tabela. Moja własna asercja
„6,5 głowy = dobrze" świeciła się na zielono przez cały czas i mierzyła nie to,
co trzeba — **asercja może być zielona i bezużyteczna naraz**.

V3 (4,48 głowy, szerszy pas barkowy, dłonie szersze od nadgarstka, szczęka,
uszy, włosy jako geometria) jest lepsza i kierunek jest właściwszy, ale
**czeka na ocenę** — `OI-134`, `OI-135`.

**Trzy pułapki złapane wyłącznie na renderze albo na `md5`, nie w raporcie:**

- ⚠ **`Mirror` przerzuca wagi tylko do grupy, która JUŻ ISTNIEJE.** Bez pustych
  grup `_R` odbita połowa jedzie za lewą ręką. Pomiar pokazywał, że kości
  w pozie stoją idealnie, a w renderze ręka strzelała pionowo nad głowę.
- ⚠ **Kontrolek IK nie wolno obracać, tylko przesuwać** — `pose.bone.location`
  żyje w lokalnych osiach spoczynku; `FootIK` zbudowany w −Y zamiast +Y
  (obrót o 180°) wywrócił biodra i nogi.
- ⚠ **`save_mainfile()` pisze do pliku OTWARTEGO.** Uruchomiony na kopii
  z `blender/wersje/` nadpisał **kopię zapasową V1**, zostawiając
  `public/assets/char.blend` z poprzednią postacią — a raport pisał przy tym
  „char.blend nadpisany" i był prawdziwy, tylko o innym pliku. Złapane dopiero
  na `md5` wyeksportowanego `.glb` (identyczny z poprzednim). Zapis idzie dziś
  pod jawną ścieżkę.

Przy okazji zdjęto z `char3d_attack` i `char3d_chod` zaszytą zależność od
jednego szkieletu: pozy ciosu i niesienia były **współrzędnymi absolutnymi**
tamtego rigu, więc po podniesieniu barku cel wypadał poza zasięgiem ramienia.
⚠ Przy rigu kalibracyjnym przelicznik jest **tożsamością** — sprawdzone
porównaniem raportu bramki przed i po.

⚠ **Blender MCP NIE DZIAŁA** (brak `uv`/`uvx`, addon nie nasłuchuje na 9876).
Praca szła przez `bpy` w tle, ale ocena V3 została zrobiona na **rzeczywistych
zrzutach z gry**. Warunek techniczny na następną sesję opisany w checkpoincie.

Zostaje otwarte: miecz schodzi **1,09 j.** pod stopy w chodzie (`OI-136`,
V1 miał 1,76 j.), **14 kluczy `PROPORCJE` jest martwych** (`OI-137`), brak
czarnego konturu i miększa stylistyka twarzy niż u NPC-ów (`OI-135`).

## 2026-09-19 (8) — HANDEL: dopracowanie i zamknięcie wątku UI

**Punkt wejścia bez zmian:** `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md`
(rozszerzona o §2.5).

⛔⛔ **Kody `L1`/`L2`/`L3` zeszły z ekranu.** Decyzja autora i trafna: kod
warstwy **wygląda jak nazwa slotu**, więc sam z siebie odtwarzał
nieporozumienie, które sylwetka miała usunąć („mam trzy sloty na tors").
Dziś karta mówi **„Pancerz · Klatka piersiowa · wierzchnie wzmocnienie"**,
przełącznik ma chipy **Spód / Środek / Wierzch**, a pomoc — „niektóre części
ciała mogą nosić więcej niż jeden element pancerza". ⚠ Słowniki są DWA
(`ARMOR_LAYER_LABEL` dla systemu i dokumentacji, `ARMOR_LAYER_PLAYER` dla
gracza) i ⛔ nie wolno ich scalić: generowany katalog i `doc_check` mają dalej
mówić adresami.

⭐⭐ **Podgląd przestał kłamać o rozmiarze.** Ramka podglądu ma teraz KSZTAŁT
GABARYTU (kwadrat albo dwa razy wyższa), a rysunek wchodzi w obie w TEJ SAMEJ
skali. ⚠ Wcześniej skala szła „pod obrazek": hełm 32×32 mieścił się w ×2
(64 px), a tarcza 32×64 tylko w ×1 — czyli **przedmiot dwa razy większy
wyglądał w podglądzie na mniejszy**. To ta sama pomyłka, co „gabaryt niesie
ikona", tylko w czwartym miejscu. Rzecz `1×1` nie płaci za to wysokością:
jej ramka się kurczy i oddaje ~50 j. treści.

⭐⭐ **Porównanie jest PRZYPIĘTE nad ceną**, poza przewijaniem — przewija się
opis i statystyki, a „nowe → noszone", cena i akcja są zawsze widoczne.
⚠ **Z zapasowym wyjściem:** gdy przypięcie nie zostawia ciału choćby 56 j.,
porównanie wraca do przewijania. Przypadek jest realny (rzecz `1×2` z naprawą
= wysoki podgląd + dwa przyciski), a bez tego wychodził najgorszy możliwy
stan: pasek przewijania nad jednym przyciętym wierszem.

**Reszta listy autora:**
- **Pomoc `ⓘ` dostała treść PODYKTOWANĄ** — osiem haseł w brzmieniu z promptu,
  bez słowa o warstwach jako slotach. ⛔ Nie dopisuj dziewiątego.
- **Naprawa ma własny podpis `NAPRAWA` w KAŻDYM stanie** — także u kupca,
  który jej nie świadczy („nie ukrywaj naprawy dlatego, że ten kupiec jej nie
  robi"). Pasek zjechał na DÓŁ kolumny: wolny pion pod sylwetką był dziurą
  w środku panelu, przy dole jest oddechem i równa się z sąsiadami.
- „1 rzeczy" w wizytówce kupca → **„1 rzecz"**. Widać to u Zielarki, która ma
  na półce dokładnie jedną pozycję.

**Nowe bramki:** `T4` (⛔ karta nie pokazuje kodu warstwy — 155 przedmiotów),
`D4` (podgląd daje TĘ SAMĄ skalę rzeczy `1×1` i `1×2`), `D5` (ramka `1×2` jest
wyraźnie wyższa od kwadratu).

**Sprawdzone w grze na docelowej ramce (1257×580 j.) i przy 1000×470:**
pusty sklep (wizytówka kupca) · hełm `1×1` i pawęż `1×2` obok siebie
(kwadrat vs ramka podwójna, ta sama skala) · zakup dotknięciem i
przeciągnięciem · sprzedaż z plecaka i **sprzedaż założonego** („Sprzedaj —
zdejmie") · naprawa z kwotami (Kowal) i **brak naprawy** (Zielarka) ·
cofnięcie · **brak złota** (czerwone ceny na półce + „Brakuje 198 g") ·
**brak miejsca** („Brak miejsca w plecaku") · wymagania („⚠ Nie spełniasz
wymagań") · pomoc · zamknięcie ✕.

⛔ **Znalezione przy okazji, NIE naprawione: `OI-133`.** Cofnięcie sprzedaży
**milczy, gdy w plecaku nie ma miejsca** — baner znika, złota nie ubywa, rzecz
nie wraca i drugiej szansy nie ma. Najłatwiej trafić rzeczą `1×2`: plecak
z ośmioma wolnymi polami, ale bez dwóch sąsiadujących pionowo, przyjmie
drobiazg i odrzuci tarczę (zmierzone). To dotyka `undo` i `Inventory`, czyli
mechaniki — zgłoszone jako `OI`, zgodnie z regułą „najpierw udokumentuj".

⏳ **Nie zamykam wątku sam.** Zostaje `OI-130` (mechanika filtra), `OI-133`
i playtest na urządzeniu — dopiero kciuk na S21 FE rozstrzyga o kaflu 70 j.

---

## 2026-09-19 (7) — HANDEL, PASS FINALNY: gabaryt po założeniu, porównanie strzałką

**Punkt wejścia bez zmian:** `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md`
(rozszerzona o §2.4).

⭐⭐ **Najważniejsze: GABARYT NIE ZNIKA PO ZAŁOŻENIU.** Tarcza `1×2` zajmowała
dwa pola w plecaku i **kurczyła się do kwadratu w chwili, w której gracz ją
zakładał** — fizyczny rozmiar rzeczy przestawał istnieć dokładnie tam, gdzie
zaczynał mieć znaczenie. Dziś kafel ręki w sylwetce sklepu jest **wysoki na
dwa pola**, tak jak od 2026-09-19 w lalce panelu postaci. ⛔ To nadal **jeden
slot**: jedna ramka, jedna ikona, jeden adres `Equipment`.

⚠ **Sylwetka musiała się przez to przemeblować** i to jest rachunek, nie gust:
rząd rąk POD czterema wierszami ciała byłby szóstym wierszem (≈512 j. przy 496
dostępnych na telefonie). Ręce weszły więc w **rale, na wysokości stóp** —
sylwetka jest teraz siatką `3 × 5`, a jej układ jest **DANĄ** (`SHOP_DOLL` ma
`col`/`row`/`rows`), nie pętlą po grupach. Przestawienie sylwetki to dziś
zmiana jednej tablicy.

**Reszta listy autora, po kolei:**
- **Porównanie czyta się strzałką** — `Obrona 18,7 → 22` zamiast tabeli trzech
  kolumn, z kolorem WYŁĄCZNIE na wartości nowej i własnym tłem bloku. Kolor
  znaczy **korzyść**: cięższa rzecz jest czerwona, choć liczba rośnie.
- **„Nie spełniasz wymagań" stoi na GÓRZE karty.** Wymóg Siły był wypisany na
  czerwono, ale w sekcji, która przy dłuższej karcie leży poza widocznym
  ciałem — czyli odpowiedź na „czy mogę tego używać" wymagała przewijania.
- **Pomoc `ⓘ` odpowiada na PYTANIA, nie opisuje ekranu**: osiem haseł w dwóch
  kolumnach (jak kupić, jak sprzedać, co znaczy cena, czym jest gabaryt `1×2`,
  jak działa naprawa i cofnięcie), a ramka ma **wysokość liczoną z treści** —
  wcześniej 40% jej powierzchni było puste.
- **Pusty stan kolumny szczegółów to WIZYTÓWKA KUPCA** (złoto, ile rzeczy na
  półce, czy naprawia i za ile), a nie jedno zdanie na środku pustego
  prostokąta. To jest pierwszy ekran każdej wizyty w sklepie.
- **Naprawa urosła z 26 do 40 j.** i mówi pełnym zdaniem z kwotą
  („Wszystko · 223 g", „Sprzęt bez uszkodzeń", „Ten kupiec nie naprawia").
  Usługa, której gracz ma nie przeoczyć, była najdrobniejszym elementem panelu.
- ⚠ **`ⓘ` i `✕` miały NACHODZĄCE pola trafienia** (rozstaw 44 j. przy polach
  po 68 j.) — złapane własnym tapnięciem w trakcie przeglądu: dotknięcie
  między ikonami **zamykało panel zamiast otworzyć pomoc**. Rozstaw to teraz
  pełna norma dotyku. ⛔ Nie zbliżaj tych dwóch: jeden z nich jest wyjściem.

**Nowe bramki w `tools/sklep_uklad.mjs`:** `Z7` (wysokie są DOKŁADNIE dwa kafle
rąk), `Z8` (gabaryt nie tworzy drugiego kafla wyposażenia — 11 kafli na 19
adresów), `Z9` (**ta sama tarcza ma tę samą skalę w plecaku i w ręce**, liczoną
dwoma niezależnymi rachunkami). `Z5` mierzy teraz WYSOKOŚĆ kafla, nie bok —
inaczej wysoki kafel wchodziłby w pasek naprawy niezauważony. ✅ Sprawdzone
negatywnie: `handRows: 1` zapala `Z7` i cztery ramki `Z9`.

**Przy okazji, drugi raz tego dnia: zamek świecił z nieaktualnego powodu.**
`G2` w `zestawy_przymiar.mjs` szukał `Equipment.setProgress` w `ItemTooltip`,
skąd rachunek przeniósł się do `ItemCard`. Teza bez zmian, adres nowy,
plus kontrola negatywna „dymek nie sięga po `Equipment` sam".

**Obejrzane w grze (S21 FE, 1257×580 j.):** tarcza migdałowa w ręce — wysoka na
dwa pola, jedna ramka · krótki miecz w tym samym kaflu — wyśrodkowany, bez
rozciągania · zakup dotknięciem i **przeciągnięciem** (obie drogi zostawiają
„↩ Cofnij") · naprawa z kwotami · pomoc · wizytówka kupca · `Młot` z ostrzeżeniem
o wymaganiach i czerwoną masą w porównaniu. Sprawdzone też przy 1000×470 —
bez nachodzenia i bez ucięć.

⏳ **Nie zamykam tematu.** Playtest na urządzeniu jest przed nami, a `OI-130`
(mechanika filtra) dalej stoi otwarte — miejsce w wierszu podpisu czeka.

---

## 2026-09-19 (6) — TARCZA TO TARCZA: koniec fikcyjnej warstwy `L2`

**Zgłoszenie z renderu:** dymek drewnianej tarczy migdałowej pisał
**„Pancerz · Druga ręka · L2 · ochrona zasadnicza"**. ⚠ Autor miał rację
dwukrotnie: tarcza nie leży w warstwie **i** nie jest pancerzem w tym, co
gracz czyta.

⭐⭐ **Źródło: trzy ogniwa, pękło ostatnie.** ① tarcza ma `armorType: "leather"`
(drewno) albo `"metal"` — to **świadoma decyzja o profilu obrażeń**
(`shields.md` §1: „żadnego materiału »drewno«"), nie o stosie. ② `itemLayer()`
wyprowadza warstwę z `armorType` i **odpowiada dla każdego pancerza** — tak
jest napisana i tak ma być: *filtruje PYTAJĄCY*, bo inaczej `ArmorLayers`
musiałby znać listę slotów. ③ `ItemCard` **nie zapytał o obszar** i wydrukował
odpowiedź, która dla `offhand` jest fikcją.

⛔ **Żadna tarcza nie deklaruje pola `layer`** — wartość nie była odziedziczona,
tylko wyliczona i pokazana nie w tym miejscu. Klasyfikacja: **błędne mapowanie
w UI**, nie decyzja projektowa i nie wada danych.

**Zasięg (zmierzony na żywym katalogu, nie oszacowany):** 30 tarcz
(12 drewno → „L2", 18 żelazo/stal → „L3"), **5 par rękawic i 4 naramienniki** —
razem **39 sztuk na 85 pancerzy**. Cztery obszary ciała (46 sztuk) mówiły
prawdę.

⚠ **Wada jest starsza niż wczorajsza przebudowa sklepu**: `ItemTooltip` w HEAD
drukował `Warstwa: …` bez filtra. Przeniesienie warstwy do wiersza TOŻSAMOŚCI
zrobiło z przygaszonej statystyki **zdanie o tym, czym rzecz jest** — i dopiero
wtedy rzuciło się w oczy.

**Naprawa — wyłącznie prezentacja, zero mechaniki:**
1. `ItemCard` pyta o warstwę **tylko za `LAYERED_AREAS`** — ta sama reguła,
   którą od dawna stosują `Equipment.armorAddress`, `Save`
   i `tools/katalog_ekwipunku.mjs`.
2. Tarcza (`"block" in def`) przedstawia się jako **„Tarcza · Druga ręka"**.
3. Bramka `§T` w `tools/karta_przedmiotu.mjs`: `T1` — pancerz spoza czterech
   obszarów warstwy NIE pokazuje (39 sztuk), `T2` — **kontrola pozytywna**:
   każda z 46 sztuk warstwowanych pokazywać ją MUSI, `T3` — tarcza nie mówi
   o sobie „Pancerz". ✅ Po cofnięciu poprawki `T1` i `T3` świecą na czerwono
   i odtwarzają **dokładnie** tekst ze zrzutu.

⛔ **`itemLayer()` zostało nietknięte.** Naprawa w niej zmusiłaby `ArmorLayers`
do znajomości cudzej domeny i unieważniła kontrakt, na którym stoją `Equipment`
i `Save`. Statystyki, ceny, model i adresy tarcz: **bez zmian**.

**Sprawdzone w grze:** „Ciężka drewniana tarcza migdałowa → **Tarcza · Druga
ręka**" · „Pancerz lamelkowy → **Pancerz · Klatka piersiowa · L3 ·
wzmocnienie**" (warstwy żyją tam, gdzie mają).

**Przy okazji: dwa zamki w `tarcze_przymiar.mjs` świeciły na czerwono
z NIEAKTUALNEGO powodu** — `B2` szukał wzoru na procent bloku w `ItemTooltip`,
skąd przeprowadził się do `ItemCard` (dziś pilnuje go pod nowym adresem
+ kontrola negatywna „dymek nie liczy sam"), a `V5` nie znał pól `iconTexture`
i `inventoryFootprint` z prac nad grafiką tarcz. ⚠ **Czerwony zamek, który
kłamie, jest gorszy niż jego brak** — uczy przechodzić obok czerwieni.

⚠ **Reguła stoi w `src/ui/CLAUDE.md`, nie w `docs/systemy/shields.md`** — ten
drugi ma dziś **19,99 KB przy twardym limicie 20 KB** dla typu `STAN`, więc
KAŻDE dopisanie wywala `doc_check`. To jest zadanie „przyciąć shields.md",
nie „wcisnąć jeszcze jeden akapit".

---

## 2026-09-19 (5) — GABARYT NIESIE POLE, NIE IKONA

**Zgłoszenie z renderu:** ta sama tarcza wygląda na `1×2` u kupca i na `1×1`
w plecaku. ⚠ **Model był cały czas poprawny** (`anchorCovering(12) = 8`,
jeden rekord pod kotwicą, ikona wyśrodkowana na przykryciu) — wada siedziała
w RENDERZE POLA.

⭐⭐ **Sedno: gabaryt niosła WYŁĄCZNIE ikona.** Sześć drewnianych tarcz ma
rysunek 32×64 i widać było dwa pola; **osiemnaście żelaznych i stalowych ma
ten sam gabaryt `1×2` przy rysunku 32×32** — i wyglądało jak `1×1`. Gabaryt
przestawał być własnością przedmiotu, a stawał się przypadkiem rysownika.
Do tego drugie pole było rysowane jak PUSTY slot, a w sklepie **martwe
dotykowo**.

**Naprawa (bez tknięcia modelu):**
1. **Jeden przedmiot = jedno POLE** — kafel kotwicy ma wysokość `2·cell + gap`,
   kafel przykryty chowa własną ramkę (`fieldRect`, `paintField`,
   `paintBagField`). Zaznaczenie samo stało się JEDNĄ ramką.
2. **Pole trafienia = całe przykrycie**, więc tap i drag działają z dowolnej
   części gabarytu — także przy rysunku 32×32.
3. **Panel POSTACI dostał to samo**, plus dwie naprawy własne: `toggleBagSelection`
   sprowadza indeks do KOTWICY (tapnięcie dolnej połowy tarczy **odznaczało**
   przedmiot zamiast go wybrać), a `onGridDragEnd` odkłada ikonę na środek
   przykrycia (skakała o pół pola). Pasek zużycia trzyma się dolnej krawędzi POLA.

⚠⚠ **Pułapka Phasera warta zapamiętania:** `setInteractive(kształt)` **ani**
`InputPlugin.setHitArea` **nie podmienią kształtu obiektowi, który już ma
wejście** — obie kończą się na `if (!gameObject.input)` i po cichu zostawiają
prostokąt klatki. Zmierzone dwukrotnie (`customHitArea` się ustawia, `hitArea`
nie), zanim poszła podmiana pól wprost. Objaw: „dolna połowa tarczy nie
reaguje".

**Sprawdzone w grze:** pole `1×1` 70 j. obok pola `1×2` 148 j. · tarcza
z rysunkiem 32×32 ma **takie samo pole** jak ta z 32×64 · tapnięcie drugiego
pola wybiera przedmiot (a drugie tapnięcie odznacza) · zakup `1×2` daje JEDEN
rekord zajmujący dwa pola · sprzedaż zwalnia OBA · przy jednej wolnej dziurze
`1×1` wchodzi, a `1×2` dostaje „Brak miejsca w plecaku".

Nowa bramka `§G` w `tools/sklep_uklad.mjs`: pole `1×1` = kafel, pole `1×2`
= `2·cell + gap`, wyśrodkowanie na obu kaflach, brak nachodzenia pól na półce.

---

## 2026-09-19 (4) — FINALNY PASS SKLEPU: sylwetka zamiast tabeli warstw

**Punkt wejścia bez zmian: `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md`**
(rozszerzona o §2.2).

⛔⛔ **Autor obalił model, nie geometrię.** Poranna wersja bloku ZAŁOŻONE
rysowała **tabelę `część ciała × L1/L2/L3`** — czyli przeniosła do interfejsu
wewnętrzną strukturę danych. Korekta brzmiała wprost: *warstwy NIE SĄ slotami
widocznymi dla gracza; gracz pyta „co mam na głowie", nie „co mam na trzeciej
warstwie głowy"*.

⭐ **To była trafna diagnoza i widać ją na zrzucie**: trzy identyczne glify
hełmu obok siebie, z których **dwa są w sklepie na zawsze puste** (niczego się
tu nie zakłada), 21 narysowanych pól na 19 adresów i kafel 49 j. przy normie 68.

**Nowy blok to SYLWETKA: jedenaście kafli na dziewiętnaście adresów** — cztery
obszary ciała w środkowej kolumnie, biżuteria i osłony na railach, ręce pod
spodem. Kafel urósł do **74 j.**, czyli powyżej normy dotyku, bez zabierania
miejsca siatkom (te mają 70 j.).

⭐⭐ **Warstwa wróciła trzema kanałami, żaden z nich nie jest slotem:** kropki
pod kaflem (ile zajętych), wiersz tożsamości karty (`Pancerz · Tors · L2 ·
ochrona zasadnicza`) i **przełącznik `L1 L2 L3`**, który pojawia się wyłącznie
przy obszarze noszącym więcej niż jedną sztukę. ⚠ Bez tego przełącznika
przebudowa **zabrałaby dostęp do ośmiu adresów** — pilnują tego dwie nowe
asercje: `Z1` (każdy adres pod dokładnie jednym kaflem) i `Z4` (żadna warstwa
nie jest osobnym kaflem).

**Cztery rzeczy zobaczone dopiero na renderze 2×** (przymiar był zielony):
ikona 32 px w kaflu 70 j. zajmowała **21% powierzchni** → sufit skali podniesiony
do ×2 · rale centrowane w pionie dawały pół kroku przesunięcia i sylwetka
czytała się jak trzy niezależne kolumny → wyrównane do wierszy ciała · glif
pustego kafla ginął przy większym polu → rozjaśniony · **karta ucinała wiersz
w połowie** („Obciążenie" przecięte poziomo) → ciało karty ma dziś **całkowitą
liczbę wierszy**, ta sama reguła co okna siatek.

Przy okazji, z listy autora: **pomoc `ⓘ` przestała opisywać layout** (sześć
krótkich odpowiedzi zamiast instrukcji obsługi), **cena, na którą nie stać,
jest czerwona na kaflu** (informacja przed dotknięciem, nie po), a **warstwa
zniknęła ze statystyk** i stoi w wierszu tożsamości, gdzie jej miejsce.

✅ `OI-129` zamknięte tym samym ruchem. ⏳ Nowe: `OI-132` (sprzedaż zestawu
schowanego — stan odziedziczony, teraz widoczny wprost).

---

## 2026-09-19 (3) — EKRAN HANDLU PRZEBUDOWANY: cztery kolumny, karta jako kolumna

**Punkt wejścia: `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md`.**
Poniżej narracja; stan, barierki i pomiary są tam.

**Zadanie brzmiało „potraktuj ekran handlu jako całość".** Nie poprawka
tooltipa — przeprojektowanie układu, hierarchii, przestrzeni i ergonomii przy
**nietkniętej mechanice**.

⭐⭐ **Cztery wady dały się ZMIERZYĆ i to one wyznaczyły zakres:**
panel 816×500 j. na ekranie 1257×580 (S21 FE) zostawiał **441 j. pustej
szerokości** · kafle 46 / 52 / **32** j. przy normie dotyku 68 · dymek karty
zasłaniał **trzy z pięciu kolumn** oglądanej półki · opis przedmiotu to 20+
linijek bez ani jednego nagłówka, z ceną w środku listy.

**Co powstało.** `KUPIEC → PLECAK → ZAŁOŻONE → SZCZEGÓŁY` — kolumny w kolejności
decyzji gracza. Panel liczy rozmiar z okna (`shopPanelW/H`), układ z rozmiaru
(`computeShopLayout`), a kafel wychodzi **68 j., czyli dokładnie norma
dotyku**. Karta ma własną kolumnę z pasem `CENA → AKCJA` **przyklejonym do
dołu**: nie płynie z treścią, więc „Kup" jest zawsze w tym samym miejscu.

⭐ **Blok ZAŁOŻONE przestał być paskiem 19 ikon.** Wiersz mówi, gdzie na ciele;
kolumny `L1 L2 L3` mówią, jak głęboko. Układ jest danymi (`SHOP_EQUIP_ROWS`),
a przymiar pilnuje, że **każdy adres `EQUIP_SLOTS` ma kafel** — bez tego nowy
slot byłby w sklepie niewidoczny i nic by tego nie zgłosiło.

⭐⭐ **Najważniejsza rzecz architektoniczna: `src/ui/ItemCard.ts`.** Jeden model
karty, dwa renderery (kolumna sklepu i dymek panelu postaci). Powód nie jest
estetyczny: wzór na procent bloku stał już w dwóch miejscach i **rozjechał
się** — rozbita tarcza pokazywała pełny procent. Trzecia kopia była
nieunikniona, gdyby kolumna szczegółów czytała katalog sama.

⚠ **Pięć rzeczy USUNIĘTYCH świadomie** (lista z powodami w decyzji): stała
podpowiedź na dole, „← Wróć", dwa wyszarzone przyciski „Tu nie naprawia"
w nagłówku, podgląd karty na najechanie i `CardActions` w tym panelu.

⚠ **`✕` w prawym górnym rogu jest decyzją autora PRZECIW własnemu pomiarowi
projektu.** `PanelBase.addCloseButton` mierzył ten róg jako najgorszy dla
kciuka (75–79 mm przy zasięgu ~55 mm) i dlatego stawia swój przycisk na dole.
Zapisane wprost, bo inaczej za trzy miesiące ktoś „naprawi" to z powrotem.

⚠⚠ **Przymiar złapał dwie realne usterki, których render nie pokazał**, bo
liczy SZEŚĆ ramek ekranu zamiast jednej: w oknie pionowym **kolumny nachodziły
na siebie** (`K1`, minima szerokości sumowały się do 426 j. przy 390
dostępnych) i **nazwa przedmiotu zostawała ze 113 j.** obok podglądu (`D3`).
Obie naprawione przez policzenie dolnych zacisków zamiast dobrania ich na oko.

⚠ **Render złapał dwie, których przymiar nie mógł:** pas akcji rezerwował stałe
138 j., więc przy jednym przycisku zostawało pod nim 80 j. pustki, a ostatnia
sekcja karty wyjeżdżała poza maskę — puste miejsce i ucięta treść na jednym
ekranie. Druga: dolny rząd siatki przecięty w połowie kafla, czytający się jak
błąd rysowania (okno ma dziś **całkowitą liczbę wierszy**).

**Sprawdzone w grze:** pusty stan, wybór towaru, zakup, brak złota, brak
miejsca, gabaryt 1×1 i 1×2, przedmiot noszony, porównanie nowy↔noszony, tarcza,
broń, pancerz, zestaw, naprawa dostępna i niedostępna, licznik ilości,
sprzedaż stosu, przeciąganie w obie strony, cofnięcie, `ⓘ`, `✕`, cztery ramki
okna.

---

## 2026-09-19 (2) — GABARYT NA PÓŁCE KUPCA: sklep układa 1×2 tak jak plecak

**Zgłoszenie z gry, jedno zdanie:** *„w sklepie też powinny zajmować 2 pola tak
jak w ekwipunku, jeśli taki mają wymiar"*. Render potwierdził w minutę: ikona
32×64 stała na kwadratowej ramce 46 j. i wystawała **9 j. nad nią i 9 j. pod
nią**, a każdy rząd zwykłych towarów niósł 24 j. pustki.

⚠⚠ **To była poprawka objawu, postawiona kilka godzin wcześniej w tej samej
sesji.** Kolumna kupca dostała wtedy wyższy rząd (`rowH` 70), czyli rozsunięcie
CAŁEJ półki pod najwyższą ikonę — przy nietkniętej, wciąż kwadratowej ramce
pola. Kolumna gracza od początku robiła to dobrze, bo jest lustrem plecaka
i pytała o `itemFootprint`. **Dwie siatki w jednym panelu mówiły o tym samym
przedmiocie dwie różne rzeczy.**

⭐⭐ **Naprawa: półka układa GABARYT.** `packShelf` w `src/ui/ShopLayout.ts`
(czysta funkcja, zero Phasera) układa towar pierwszym wolnym prostokątem
w kolejności czytania — **tą samą regułą, co `Inventory.firstFitFor`**. Towar
`1×2` zajmuje pole i to pod nim, ikona siada na środku przykrycia
(`shelfXY`), cena kotwiczy się w dolnym rogu przykrycia, a złota ramka
zaznaczenia świeci na **obu** polach (`merchantCellOwner`) — to samo, czego
plecak nauczył się dzień wcześniej.

⭐ **`rowH` wrócił na 46 j. i wróciły cztery widoczne rzędy** — czyli `OI-125`
(„3 rzędy zamiast 4") zamknęło się samo. **Nie było czego rozstrzygać:**
to nie była cena ikon w pełnej skali, tylko cena rozsuniętego rzędu.

⚠ **Trzy rzeczy zabrała ze sobą ta zmiana, bo wszystkie liczyły z kotwicy:**
okno przewijania kolumny (`columnWindowRows` — wierszy jest tyle, ile powie
ułożenie, a nie `ceil(pozycji / kolumn)`; półka Sobka ma 12 pozycji i 5
wierszy), widoczność kafla w oknie (tarcza sięga niżej niż jej kotwica)
i **powrót ikony po przeciągnięciu** — `onDragEnd` odkładał tarczę na środek
kotwicy, czyli pół pola wyżej, po obu stronach panelu.

**Bramki.** `tools/sklep_uklad.mjs` dostał trzy nowe sekcje: `V3` (ostatni
towar cały w oknie po przewinięciu — odpowiednik `S6` po stronie kupca),
`§I` (ikona 32×64 mieści się 1:1 w dwóch polach — **z parą negatywną `I2`**,
która pokazuje 1/2 w jednym polu, czyli dowód, że test potrafi zaświecić na
czerwono) i `§P` (ułożenie: brak kolizji, brak wyjścia poza szerokość, drobiazg
staje OBOK tarczy, nie pod nią). Wszystko zielone, `tsc` i `build` czyste,
render sprawdzony u Sobka i u Kowala, także w ramce S21 FE.

⚠ **Osiemnaście żelaznych i stalowych tarcz `1×2` ma nadal ikonę 32×32**
(`OI-126`), więc w obu siatkach siedzi ona na środku dwóch pól i zostawia wokół
pustkę. To brak grafiki, nie usterka układu: **pole zajmuje konstrukcja, nie
obrazek**.

---

## 2026-09-19 — MASTER TARCZ: grafika, standard drewna, pierwszy przedmiot 1×2 w grze

**Punkt wejścia wątku: `docs/tarcze_grafika_checkpoint.md`.** Poniżej narracja; stan
i barierki są tam.

**Skąd wyszliśmy.** Autor przyniósł arkusz sześciu tarcz wygenerowany przez GPT
i przepuszczony przez Pixel Snapper, z zadaniem: zrobić z tego **wzorzec** dla
całego przyszłego katalogu, nie ładny obrazek.

**Sześć rewizji, każda z pomiaru, nie z gustu.** Kształt (heater czytał się jak
wiadro, migdałowa jak jajko) → footprint z historycznych wymiarów przy jednej
skali świata 0,44 px/cm → paleta z `forrest.png` zamiast rdzawej rampy
`items.png` → skala optyczna rodziny → mapowanie słojów → nasycenie.

⭐⭐ **Trzy rzeczy, które warto zapamiętać z tej sesji, bo są ogólne:**

1. **Szerokość tarczy wypukłej to CIĘCIWA, nie ŁUK.** Legionowa dominowała nad
   rodziną (1,88× powierzchni okrągłej), bo brałem 63 cm z tabel, a ikona jest
   widokiem z przodu. Reguła skali się nie ugięła — poprawione zostało WEJŚCIE
   do niej.
2. **„Dwa gatunki drewna" to nie była barwa.** Zgłoszenie „legionowa
   żółto-pomarańczowa, pawęż spłowiała" okazało się w pomiarze różnicą ZAKRESU
   DYNAMIKI (rozrzut 2,20 vs 1,81 szczebla), przy średniej barwie różniącej się
   o 0,004 G:R. Naprawa poszła w mapowanie światła, nie w paletę.
3. **Morela to nasycenie przy wysokiej jasności.** Brąz o nasyceniu 0,55 przy
   jasności 150 przestaje być drewnem. Rampa ma dziś nasycenie MALEJĄCE ku
   górze — w cieniu odwrotnie, bo odbarwiony cień to szary muł.

**Integracja (na wyraźne „wprowadzamy do gry").** Sześć PNG pisanych przez
generator wprost do `public/assets/items/`, `iconTexture` na 12 drewnianych
tarczach, `inventoryFootprint: 1×2` na 12 tarczach (wszystkie migdałowe,
legionowe i pawęże — **także żelazne i stalowe**, bo gabaryt wynika
z konstrukcji), kafel ręki w lalce na dwa pola w pionie.

⭐ **To są pierwsze przedmioty w grze deklarujące gabaryt.** Oś weszła
2026-09-18 bez ani jednego użytkownika i dopiero teraz go dostała.

⚠⚠ **Trzy usterki wyszły WYŁĄCZNIE z renderu, przy wszystkich asercjach
zielonych**, i wszystkie trzy zgłosił autor z uruchomionej gry:
ikony 1×2 przecięte w połowie przez ramkę kafla poniżej (kolejność rysowania) ·
złota ramka zaznaczenia na połowie przedmiotu · sklep zmniejszający ikonę do
kafla. Czwarta rzecz — półka kupca ma dziś 3 rzędy zamiast 4 — jest **ceną**,
nie usterką, i czeka na decyzję (`OI-125`).

⚠ **Bramka gabarytu zaświeciła na czerwono i miała rację.** Miała asercję
„żaden przedmiot nie deklaruje gabarytu" — prawdziwą do tej sesji. Przepisana
na mocniejszą (gabaryt mają wyłącznie trzy konstrukcje i KAŻDA ich sztuka)
natychmiast wyłapała pominięte egzemplarze żelazne i stalowe.

**Nie zamknięte:** autor wraca z własną listą spostrzeżeń do dopracowania.
Sesja kończy się na **działającej integracji**, nie na wyczerpaniu tematu.

---

## 2026-09-18 (4) — Archiwizacja sesji: co zostaje zapisane

Sesja zamknięta na życzenie autora. ⛔ **Zero zmian w kodzie, w katalogu
przedmiotów, w balansie, w `Character3D`, w animacjach, w systemie tarcz
i w parametrach walki.** Wyłącznie dokumentacja.

### (1) Katalog broni — ZAMKNIĘTY jako baseline

Nowy dokument: `docs/decyzje/2026-09-18-katalog-broni-zamkniety-37.md`.
Zapisuje, że **37 konstrukcji jest zatwierdzonym baseline'em, a nie stanem
przejściowym**, że model `Construction → Material → Quality → Variant →
ItemInstance` zostaje bez zmian i że **brak globalnego balansu jest STANEM,
nie długiem**.

⛔ **Nie powtarza zawartości rosteru** — liczebności czyta się z
`docs/ekwipunek_przedmioty.md`, a przebieg dojścia do 37 opisuje wpis
2026-09-18 (2) i dwie decyzje z 2026-09-17.

### (2) ⭐⭐ Zasada robocza: ZAKRES → POMIAR → BALANS

Zapisana w §4 tej samej decyzji i jako **barierka** w `docs/odlozone.md` §5.
Cztery rzeczy, których zakazuje na tym etapie: mechanik „dla ciekawości",
sztucznego obsadzania pustych pól, globalnego balansu przed domknięciem
itemizacji i rozwiązywania hipotez bez danych z rozgrywki.

⚠ To nie jest zakaz myślenia o mechanikach — jest zakazem **wdrażania ich**
przed pomiarem.

### (3) Dwa nowe numery, oba jako TEMATY, nie zadania

- **`OI-118`** — audyt techniczny: czy i jak warstwa 3D korzysta
  z `swingDurationMs`. ⛔ `Character3D` i `TEMPO_ATAKU` **nietknięte**; decyzji
  o sposobie rozwiązania **nie podjęto**. Obserwacja źródłowa: wpis
  2026-09-18 (3), sekcja (4).
- **`OI-119`** — `minReach` jako **możliwa** podstawa przyszłej jakości
  trafienia zależnej od dystansu. ⛔ Sweet spotu ani degradacji **nie
  implementujemy**; przy powrocie najpierw sprawdzić istniejące pola.

### (4) Co było już zapisane i czego NIE dublowałem

- **`OI-116`** (rozdzielenie `attackCooldown` / `swingDurationMs`) — zapisane
  wcześniej tego dnia: `docs/odlozone.md` §2, `docs/zadania.md`, pomiar we
  wpisie 2026-09-18 (3). ⛔ Bez zmian.
- **`OI-117`** (tożsamość buzdyganu) — zapisane wcześniej tego dnia:
  `docs/odlozone.md` §3, `docs/zadania.md`. ⛔ Bez zmian; nadal **bez** armor
  breakera, bez specjalnego wariantu, bez nowych statystyk i bez osobnego
  rozstrzału.
- **Kij → `blunt`** i **kilof poza katalogiem** (`OI-115`) — opisane we wpisie
  2026-09-18 (2). W nowej decyzji tylko **przypomniane jednym zdaniem**, żeby
  nie dało się ich cofnąć przez nieuwagę.

### (5) ⛔ Tarcze

**Żadnej nowej analizy tarcz w tej sesji.** Stan techniczny systemu tarcz
został wcześniej zebrany z repozytorium i to wystarcza. ⚠ Późniejsza analiza
projektowa prowadzona poza tą sesją **nie została tu przekazana** — nie ma jej
w żadnym dopisanym dziś zdaniu i **nie należy jej rekonstruować**.

### Bramki

`doc_check` — 0 błędów. ⛔ Bez commita i bez pusha.

---

## 2026-09-18 (3) — Przymiar `attackCooldown` ↔ `swingDurationMs`

Przymiar **wyłącznie analityczny**, na żądanie autora, po niezależnej obserwacji
przekazanej od Gemini. ⛔ **Nie zmieniono ani jednej liczby w `ITEMS`** — to jest
pomiar, nie praca nad katalogiem. Temat zaparkowany jako **`OI-116`**
(⚠ **hipoteza, nie decyzja projektowa**).

### (1) Korelacja jest silniejsza, niż brzmiało zgłoszenie

| para | Pearson r | r² | Spearman ρ |
|---|---:|---:|---:|
| **`attackCooldown` ↔ `swingDurationMs`** | **0,9689** | **0,9389** | **0,9808** |
| `attackCooldown` ↔ DPS | 0,3023 | 0,0914 | 0,2883 |
| `swingDurationMs` ↔ DPS | 0,4149 | 0,1721 | 0,3955 |

Regresja: `swing_ms = 371,7 × cd_s − 9,4`, **odchylenie reszt 12,2 ms** przy
rozpiętości `swing` 130–340 ms — czyli **5,8% rozpiętości parametru**.
⭐ `ρ = 0,98` znaczy, że **kolejność broni po obu parametrach jest praktycznie ta
sama**; monotoniczności nie tłumaczy skala.

Powyżej 2σ odstają trzy konstrukcje: **Topór bojowy** (+41,6 ms), **Pika**
(−30,4 ms), **Nóż** (−24,1 ms). Każda ma czytelne uzasadnienie w fikcji, co
sugeruje, że odstępstwa powstawały **pojedynczo i intuicyjnie**, a nie jako
świadomie obsadzona oś.

⭐ **DPS nie zależy od żadnego z tych dwóch parametrów** (r² 0,09 i 0,17), bo
obrażenia rosną razem z cooldownem (r² 0,80). Czyli ta oś **nie niesie dziś
żadnego balansu, który dałoby się zaburzyć** — niesie jedno wspólne pojęcie
„ciężkości".

### (2) Ćwiartka „długi cooldown + krótki swing" jest PUSTA

Podział po medianach katalogu (`cd` 0,56 s, `swing` 200 ms):

| ćwiartka | liczba | kto |
|---|---:|---|
| niski cd + krótki swing | 17 | **same 1H** |
| niski cd + długi swing | 1 | Tasak — ⚠ artefakt cięcia, leży dokładnie na medianie |
| **długi cd + krótki swing** | **0** | ⛔ **nikt** |
| długi cd + długi swing | 19 | **wszystkie 15 broni 2H** + 4 najcięższe 1H |

⚠ Nie istnieje też ani jedna broń 2H o `swing` poniżej mediany katalogu
(najkrótszy to 225 ms — Bastard i Widły).

### (3) Runtime — co naprawdę konsumuje który parametr

`attackCooldown` → **wyłącznie** `Player.attackReadyAt` (`Player.ts:971`), czyli
kadencja i przez nią DPS. ⛔ Nie występuje w żadnym wzorze staminy, rootu ani
momentu trafienia.

`swingDurationMs` → **cztery rozłączne rzeczy**: `rootedUntil`
(`rootDurationForSwing`), `attackPoseUntil`, **moment lądowania obrażeń**
(`GameScene.ts:3239`, `swing × 0,5`) oraz `swingStaminaCost`
(`11 × swing/1000 × (1 − effortReduction)`).

⭐⭐ **Oba pola są w pełni podłączone i sterują rozłącznymi rzeczami.**
Rozdzielenie osi **nie wymaga ani jednej linii kodu** po stronie rozgrywki.

### (4) ⚠ Jedyny kanał, którego rozdzielenie NIE pokaże: animacja 3D

`Character3D.TEMPO_ATAKU = 2.2` **omija** `swingDurationMs` — nie nadpisuje go,
bo to dwie rozłączne ścieżki, które się nie spotykają. Klip `Attack` ma 0,8 s,
więc gra **364 ms dla każdej z 37 broni**, podczas gdy okno ciosu w rozgrywce
waha się **170–380 ms**. `zagrajAtak()` nie przyjmuje żadnego czasu.

⚠⚠ **Znalezione przy okazji, ⛔ NIE naprawiane:** bramka `atakTrwa` gaśnie dopiero
na zdarzeniu `"finished"` klipu (364 ms), a `attackCooldown` dzieli się przez
`(1 + attackSpeedBonus)` przy `ATTRIBUTES.maxAttackSpeedBonus = 0,6`. Przy pełnym
bonusie tempa **21 z 37 konstrukcji ma cooldown krótszy niż klip**, więc co drugi
cios nie dostaje żadnej animacji 3D. ⛔ Temat 3D rozpatrywany osobno (`OI-109`);
`Character3D` i `TEMPO_ATAKU` **nietknięte**.

### (5) Trzy pary do playtestu — ⛔ WARTOŚCI NIEZAPISANE

⛔ **Poniższe liczby nie weszły do `ITEMS`** i wejść nie mają, dopóki autor nie
zdecyduje. Dobrane tak, że **`attackCooldown` zostaje nietknięty** — więc DPS,
obrażenia, zasięg i masa nie zmieniają się o jotę; rusza się wyłącznie `swing`,
w granicach relacji **już obecnych w katalogu** (0,295 Nóż … 0,419 Topór bojowy).
Pochodne: `stamina = 11 × swing/1000`, `root = swing + 40` (Zręczność 0).

| broń | cd | dziś (swing / stamina / root) | profil „niskie zobowiązanie" | profil „wysokie zobowiązanie" |
|---|---:|---|---|---|
| **Buzdygan** | 0,52 | 185 / 2,04 / 225 | **155 / 1,71 / 195** | — |
| **Młot bojowy 1H** | 0,52 | 185 / 2,04 / 225 | — | **220 / 2,42 / 260** |
| **Miecz** | 0,50 | 180 / 1,98 / 220 | **150 / 1,65 / 190** | — |
| **Miecz długi** | 0,56 | 200 / 2,20 / 240 | — | **235 / 2,59 / 275** |
| **Włócznia** | 0,60 | 230 / 2,53 / 270 | **180 / 1,98 / 220** | — |
| **Rohatyna** | 0,64 | 235 / 2,59 / 275 | — | **270 / 2,97 / 310** |

⭐ **Najciekawsza jest Włócznia**: `cd` 0,60 (powyżej mediany) przy `swing` 180
(poniżej) obsadziłoby **pustą ćwiartkę** — profil *„uderzam rzadziej, ale szybciej
odzyskuję kontrolę"*. Pierwsza taka broń w grze i pierwsza dwuręczna w tej
ćwiartce.

⚠ **Buzdygan i Młot bojowy 1H są dziś bliźniakami co do liczby** (cd 0,52,
swing 185, DPS 23,08, ta sama rodzina, ta sama liczba rąk) — dlatego są
najczystszym możliwym testem: jedyną wprowadzoną zmienną jest badana oś.

⚠⚠ **Zastrzeżenie do zapisania PRZED playtestem:** bez synchronizacji 3D odbiór
będzie mierzony **bez kanału wizualnego**. Wynik „nie czuć różnicy" **nie znaczy
wtedy, że oś jest bezwartościowa** — może znaczyć wyłącznie, że model nie pokazuje
tego, co robi ciało.

---

## 2026-09-18 (2) — Domknięcie puli konstrukcji: 32 → 37

Autor podał **finalną pulę** z nazwy i zamknął dziesięć decyzji (F1–F10).
FAZA C wykonana; ⛔ bez commita i pusha.

### (1) Sześć konstrukcji, nie osiem

⚠ Brief wymieniał do dodania także **Miecz długi** i **Wielki miecz** — obie
**już istniały** od 2026-09-17. Sprawdziłem `ITEMS` przed edycją zamiast
przepisać listę z polecenia; inaczej powstałyby duplikaty `ItemId`.

Weszły: **Maczuga**, **Młot bojowy 1H**, **Korbacz**, **Topór duński**,
**Labrys**, **Widły**. Roster **32 → 37**: blunt 11 · sword 10 · axe 7 ·
polearm 6 · dagger 3. To jest dokładnie pula, co do sztuki.

### (2) ⭐ `interrupts: false` dostał PIERWSZEGO użytkownika

Młot bojowy 1H i 2H mają teraz wariant **Dziób** (`pierce`), który **nie
przerywa**. Zero nowej mechaniki — to jest ten sam wzorzec, którym siekiera
niesie `Obuch`, plus zamek typu, który czekał bez użytkownika od powstania.

⚠ Dwa dni temu klasyfikowałem to pole jako „martwe". Dziś działa. **To jest
dokładnie ta zasada, którą autor postawił: brak konsumenta ≠ martwe.**

### (3) ⚠⚠ Trzy kolizje ikon, których nie wyłapało oko

Sześciu nowym broniom przypisałem kafle z pamięci i **trzy powtarzały już
zajęte**: topór duński = berdysz `(2,5)`, młot bojowy 1H = nadziak `(3,0)`,
widły = rohatyna `(5,3)`. Wyszło dopiero na skanie `icon.row/col` po całym
`ITEMS` — po tym, jak `tsc`, `build` i cały `combat_regresja` przeszły na
zielono. ⛔ Żaden strażnik nie pilnuje unikalności ikon.

⚠ **Wniosek zapisany w `public/assets/README.md`:** kafle przydziela się
skanem, nie z głowy.

⏳ **Widły zostały z ikoną PLACEHOLDEROWĄ** — okuty drąg. Na arkuszu nie ma
sylwetki z zębami i żadne przycięcie tego nie da (`OI-114`).

### (4) `stick` wszedł do rodziny `blunt` — i to unieważnia stary zapis

⚠⚠ W configu stało od dawna: *„ŚWIADOMIE BEZ `family`… broń startowa
odziedziczyłaby oś rodziny obuchowej"*. Decyzja autora (F1) to odwraca.
⭐ **Pierwszy powód tamtego zapisu dalej obowiązuje** (rodzina nie wyprowadza
się z typu obrażeń) — upadła przesłanka drugiego: kij JEST prostą konstrukcją
obuchową, a nie osobną kategorią.

**Skutek mechaniczny jest realny:** kij dziedziczy `staggerMs: 50` i **buduje
biegłość obuchową**. Pierwsza broń w grze przestała być ćwiczeniem donikąd.
⛔ Typ `improvised` nie powstał.

### (5) Kilof wyszedł z katalogu broni

Usunięty wpis `ITEMS.pickaxe` (1322 bajty) i jedno miejsce w stocku.
⭐ **Półka Rolnika nie straciła drugiej pozycji** — kilof zastąpiły **Widły**,
czyli narzędzie gospodarskie, które jest pełnoprawnym `polearm`. Jego charakter
wyraża cena (54 g), gatunek (żelazo) i dystrybucja, **nie kategoria
mechaniczna**. ⛔ Nie oznaczyłem ich jako „broń improwizowana".

⏳ `OI-115` trzyma informację: Kilof → przyszły przedmiot użytkowy.
⛔ Systemu narzędzi nie projektowałem — `Gathering.ts` nie zna dziś pojęcia
narzędzia w rękach.

### (6) `§T6` znowu przestroił liczbę

**Labrys 0,78 → 0,80.** Trafienie wypadało 45 ms od końca okna ogłuszenia przy
progu 50. Ta sama bramka przestroiła wcześniej nóż, cep i berdysz — to już
czwarty raz i zaczyna być przewidywalne: **każda nowa broń wolniejsza od
~0,7 s wymaga sprawdzenia przy tym oknie.**

### (7) Czego NIE zrobiłem

⛔ `OI-112` (bastard i włócznia 1H/2H) — oba zostają `hands: 2` (F6/F7).
⚠ Zapisałem w decyzji o drabince mieczy, że **włócznia ma DWIE blokady**:
`OI-112` (chwyt) **i** `OI-108`/`§Y Y2` (korytarz zasięgu jest pusty).
⛔ Buława — poza pulą (brak osi prestiżu). ⛔ Lewak, Sierp — poza pulą.
⛔ Crit main/off-hand nietknięty (F10). ⛔ Zero globalnego rebalansu.
⛔ `hammer` (Młot) nietknięty — nie obniżałem go, żeby zrobić miejsce młotowi
bojowemu 1H (F3); sufit 12,0 tej drugiej konstrukcji bierze się z `§Y Y3`.

### Bramki

`tsc` ✅ · `build` ✅ · `doc_check` ✅ 0 błędów · `combat_regresja` ✅ zero różnic
(`§ZB` 12/12, w tym `Z10` z trzema broniami żelaznymi) · `rece_przymiar` ✅ ·
`katalog_ekwipunku` ✅ · pozostałe 21 ✅.
⛔ Trzy czerwone bez zmian: `warstwy`, `zestawy` (`OI-107`), `obciazenie`
(`OI-105`, **59,7 kg — labrys waży 7,0 kg, czyli mniej niż wielki miecz 8,0,
więc maksimum się nie ruszyło**).

---

## 2026-09-18 — Łuk wyprowadzony z broni do umiejętności

Decyzja autora: **zakres Szerokiego cięcia nie zależy od konstrukcji broni**,
bo szeroki zamach da się wykonać mieczem, toporem i maczugą tak samo. Pełny
zapis: `docs/decyzje/2026-09-18-luk-nalezy-do-umiejetnosci.md`.

### (1) Co zniknęło

`melee.arcDeg` (32 bronie + gołe ręce), `AttackVariant.arcMul` (7 wariantów),
`Progression.attackArcDeg`, `StrikeProfile.arcDeg` z trzema zapisami
w `GameScene`, `AbilityStrikeInput.arcDeg`. Weszło jedno pole:
`ABILITIES.cleave.halfArcDeg`.

⭐ **Kompilator wskazał dokładnie trzy miejsca, które przewidywała analiza** —
ani jednego więcej. To był dobry sygnał, że mapa zależności z audytu była pełna.

⛔ Zwykły autoatak nie dostał żadnej nowej geometrii. Był i zostaje celowany.

### (2) ⚠⚠ Jedna liczba, której nie dało się „zachować"

`halfArcDeg = 90`. **Stanu sprzed migracji nie było** — były 32 różne liczby
(22° mizerykordii … 104° wielkiego miecza, mediana ~58). Nie da się „nie
zmienić" czegoś, co nie miało jednej wartości, i trzeba to nazwać wprost.

90 to `FRONT_ARC_DEG`, czyli liczba, którą gra już nazywa „przodem": tym samym
kątem bramkowany jest atak i blok tarczą. ⛔ **Ale stałej nie zaimportowałem** —
`FRONT_ARC_DEG` ma w komentarzu ostrzeżenie *„strojąc tarczę, stroisz też
bramkę ataku"*, a trzeci konsument rozciągnąłby to sprzężenie na umiejętność.
Wartość powtórzona, powód zapisany. `OI-113`.

### (3) ⭐ Najcenniejsze: migracja ODSŁONIŁA dwie luki w strażnikach

Tego nie było w planie i to jest lepszy plon niż samo przeniesienie pola.

**`§ZB Z1` nie pytało o ROZSTRZAŁ.** Natychmiast po usunięciu łuku zapaliło się
`sword > cleaver_sword`. `weapons.md` §5 czyni rozstrzał **osią tożsamości**,
a strażnik dominacji porównywał tylko `dps`, czyli średnią.
⚠⚠ **Wniosek jest nieprzyjemny i wart zapisania: tasak miał nad mieczem
przewagę wyłącznie w łuku** — czyli w polu, które poza Szerokim cięciem nie
robiło nic. Ta przewaga była **pozorna przez cały czas**, a strażnik jej nie
widział, bo patrzył na średnią zamiast na rozstrzał.

**`§ZB Z3` straciło jedną z czterech osi.** `boar_spear ~ spear` i
`~ glaive` spadły do jednej różnicy. Zastąpił łuk **ODRZUT** — kanał, który
drzewcowe naprawdę różnicuje (rohatyna 200, reszta zero).

⛔ Żadnej z tych dwóch nie „naprawiłem" wyjątkiem na `id`. Reguła w `CLAUDE.md`
mówi wprost: jeśli strażnik zapala się na konstrukcji, to konstrukcja nie ma
tożsamości, a nie strażnik ma błąd.

### (4) Dwa testy przestały mierzyć to, co deklarowały

- **Kotwice sekcji 2** wybierały z rosteru najszerszą i najwęższą broń po
  `melee.arcDeg`. Po usunięciu pola selektor spadłby na **fallback wpisany
  linijkę obok** — harness świeciłby na zielono, testując dwie stałe zamiast
  gry. Dokładnie klasa awarii, przed którą ostrzega `HitResolver` przy
  kształtach `legacy*`.
- **`§O6`** („kierunek jest ciągły") używał celu ~75° od osi: poza dawnym łukiem
  broni (55°), ale **wewnątrz** nowego łuku umiejętności (90°). Test dalej
  przechodziłby, nic nie mierząc — czyli wpadłby w pułapkę, przed którą
  ostrzega jego własny komentarz. Punkt przeliczony na ~110°; ⚠ trzeba go
  przeliczać przy każdej zmianie `halfArcDeg`.

### (5) Zasada audytu, którą przyjąłem w tej sesji

⚠ **„Brak konsumenta" ≠ „martwe".** Autor postawił tę regułę wprost i miał
rację — dwa dni temu miałem w raporcie sekcję „parametry martwe" z czterema
pozycjami. Po przejściu przez szablon (zastosowanie → konsument → przyszłe
użycie → co stracimy → klasyfikacja) **żadna się nie utrzymała**: dwie są
zamkami typu, jedna czeka na drugą stronę systemu, jedna trzyma wzorzec.

⭐ Łuk usunięto z **innego powodu**: miał konsumenta i działał, ale opisywał
**niewłaściwego właściciela**. To jest jedyne uzasadnienie usunięcia, które
przeszło.

### (6) Dokumentacja przy suficie — teraz naprawdę

⚠⚠ Po tej zmianie **`combat.md` ma 0 bajtów zapasu**, a `weapons.md` 10. Obie
musiały wyciąć dokładnie tyle, ile dopisały; w `combat.md` trzy zdania o łuku
były nieprawdziwe i ich usunięcie sfinansowało nowe. To jest `OI-111` i przestaje
być teoretyczne.

### Bramki

`tsc` ✅ · `build` ✅ · `doc_check` ✅ 0 błędów · `combat_regresja` ✅ zero różnic
po przemrożeniu (28 różnic = 14 starych nazw znikło, 14 nowych doszło; **zero
zmian w wartościach geometrii**) · `rece_przymiar` ✅ · pozostałe 22 ✅.
⛔ Trzy czerwone bez zmian: `warstwy`, `zestawy` (`OI-107`), `obciazenie`
(`OI-105`, 59,7 kg jak wczoraj).

⚠ Sabotaż przeszedł dla wszystkich czterech zmienionych asercji: `Z1`
(rozstrzał tasaka), `Z3` (odrzut rohatyny), `O1` (kąt wpisany literałem),
`O6` (kąt 55 zamiast 90).

---

## 2026-09-17 (3) — Drabinka ROZMIARU mieczy 30 → 32; bastard zostaje `hands: 2`

Korekta zakresu od autora, trzeci etap tego samego dnia. Punkt wejścia bez
zmian: `docs/checkpoint_2026-09-17.md`, sekcja **ETAP III**. Decyzja:
`docs/decyzje/2026-09-17-drabinka-mieczy-i-chwyt.md`.

### (1) Audyt z etapu II miał rację — ale na inne pytanie

Rano zamknąłem etap II wnioskiem *„rodzina `sword` nie potrzebuje dokładania"*
i **ten wniosek dalej jest poprawny**: gladius, estok i katzbalger zostają
odrzucone jako synonimy, a „miecz szczerbaty" jako oś JAKOŚCI. ⚠ Audyt pytał
jednak wyłącznie o **sposoby fechtowania** i nigdy nie zadał pytania o **oś
ROZMIARU**. Między mieczem 1H (zasięg 68) a bastardem 2H (78) nie było nic,
a powyżej miecza dwuręcznego nie było niczego w ogóle.

⭐ **Wniosek na przyszłość:** „rodzina jest pełna" zawsze znaczy „pełna WZDŁUŻ
osi, o którą pytałem". Warto wypisać osie, zanim się ogłosi kompletność.

### (2) Trzy z czterech liczb miecza długiego to SUFITY, nie wybory

Miecz długi wyszedł najmocniej ograniczoną konstrukcją, jaką ten katalog do
tej pory dostał — bo jest **duży i jednoręczny naraz**, a to jest dokładnie
przestrzeń, którą `§Y` zamyka z trzech stron:

```
   średnia 12,0   ← Y3: najmocniejsza 1H < najsłabsza 2H (włócznia 12,5)
   zasięg    74   ← Y2: każda 2H dalej niż każda 1H (topór bojowy 76)
   cooldown 0,56  ← Y1: każda 2H wolniejsza niż każda 1H (bastard 0,60)
```

⚠ Trzy niezależne niezmienniki spotkały się na jednej konstrukcji i **każdy
dotknęła co do jedności**. ⛔ Żadnego nie ruszono; miecz długi jest w dps
**słabszy od zwykłego miecza** (24,0 vs 25,8) i kupuje się w nim wyłącznie
zasięg 74 oraz łuk 72° — najszerszy wśród jednoręcznych.

### (3) Wielki miecz: pierwsza martwa strefa POZA bronią drzewcową

⭐⭐ To jest najważniejsza rzecz tego etapu i nie jest nią liczba obrażeń.
`minReach` niosły dotąd wyłącznie pika, halabarda i glewia — na tyle
konsekwentnie, że **łatwo było wziąć go za własność rodziny `polearm`**.
`§W W11d` mówił od początku, że nią nie jest; wielki miecz to teraz *pokazuje*.

⚠ Reszta to ekstremum istniejących osi i **ani jedno nowe pole**: 27,0 średniej,
łuk 104°, zasięg 92, cykl 950 ms, Siła 8, 8 kg, 600 g, odrzut 260.

### (4) Strażnik przepisany DRUGI RAZ tego samego dnia

`§W W11c` w ciągu jednego dnia miał trzy postaci:

```
   rano:     bezStrefy.length === 18                   ← licznik
   południe: zeStrefa === "glaive,halberd,pike"        ← lista
   wieczór:  martwa strefa jest MNIEJSZOŚCIĄ i w każdej rodzinie,
             która ją ma, jest też konstrukcja bez niej   ← REGUŁA
```

⚠⚠ **Wersję z listą przewrócił wielki miecz — i przewrócił ją słusznie.** Sam
ją rano napisałem jako „naprawę" licznika i **popełniłem ten sam błąd o jeden
poziom wyżej**: lista nazw jest migawką rosteru tak samo jak liczba, tylko
lepiej wygląda. Dopiero trzecia wersja mówi coś, co jest prawdą niezależnie od
tego, ile broni ma katalog.

⚠ Sabotaż był pouczający: pierwsza próba (martwa strefa dla włóczni) **nie
zapaliła W11c**, bo rodzina `polearm` ma od etapu II jeszcze rohatynę bez
martwej strefy. Reguła działała poprawnie; to mój sabotaż był za słaby.

### (5) Bramka rąk nie była testowana przez NIC

⚠⚠ Przy okazji sprawdzania „czy miecz długi naprawdę wpuszcza tarczę" wyszło,
że reguła dwuręczności żyje w **pięciu miejscach** `Equipment`
(`usesBothHandsIn`, `handsRefusalFor`, `equipFromBag`, `accepts`,
`normalizeHands`) i **ani jedna asercja w projekcie jej nie uruchamiała**.
`§Y` bada liczby broni, nie zachowanie; jedynym dowodem było przeczytanie kodu.

Stąd `tools/rece_przymiar.mjs`. Dwie rzeczy, które ten przymiar od razu pokazał:

- ⭐ **`accepts` i `equipFromBag` to DWA niezależne czytelniki.** Zepsucie
  samego `accepts` nie psuje zakładania — gracz widzi podświetlony slot, który
  zaraz odmówi. Bez osobnej asercji połowa reguły nie jest badana przez nic.
- ⚠ **Pierwsza wersja przymiaru świeciła na zielono przy zepsutej bramce**,
  bo wielki miecz ma `requires.strength = 8`, a testowa postać miała Siłę 0 —
  `equip` odmawiał z zupełnie innego powodu. Dopiero `Progression.strength = 20`
  sprawiło, że test bada to, co miał badać.

### (6) Bastard: ⛔ żadnej prowizorki, konkretna lista braków

Autor chce bastarda używalnego 1H **i** 2H. **Nie da się tego dziś zrobić
poprawnie i nie zrobiłem tego źle.**

⛔ Pierwsza kusząca odpowiedź — *„dwa `attacks`: Jedną ręką i Oburącz"* —
**nie działa i to jest rozstrzygnięte**: wariant przemnaża obrażenia, łuk,
zasięg i tempo, ale **nie dotyka `hands`**, więc slot drugiej ręki byłby
zablokowany w obu. Wariant opisuje sposób CIOSU, nie sposób TRZYMANIA.

Brakuje nośnika stanu chwytu, warstwy statystyk zależnej od chwytu, sterowania
w UI i drugiego klipu 3D. ⚠⚠ **Ale najważniejszy brak nie jest kodem:** `§Y`
dzieli roster na 1H i 2H, a konstrukcja będąca obiema nie należy do żadnego
z porównywanych zbiorów. **To jedno zdanie autora jest pierwszym krokiem, nie
ostatnim.** `C5` / `OI-112`.

⭐ Jedyna rzecz gotowa: **zapis**. Nowe pola wchodzą jako opcjonalne bez
`SAVE_VERSION` — tak weszły `quickSlot`, pierścienie, `offhand`, `gloves`.

### (7) Ikony trzeba było narysować, bo arkusz kłamał

⚠⚠ Obie wolne głownie rzędu mieczy są **mniejsze od zwykłego miecza**:
(0,2) 174 px, (0,3) 185 px wobec **239 px** `sword`. Ikona „miecza długiego"
mniejsza od miecza kłamie o jego jedynej cesze, więc powstał
`tools/build_ikony_mieczy.py` — dwa kafle rysowane w paletę **próbkowaną
z arkusza** (cztery tony metalu, pięć brązu).

⚠ **Sam rozmiar nie wystarczył.** Pierwsza wersja wielkiego miecza wyglądała
świetnie w izolacji i **przy 17,6 px czytała się tak samo jak tasak** — obie są
szerokimi, liściastymi głowniami. Zobaczyłem to dopiero na zestawieniu ośmiu
ostrzy obok siebie w skali półki sklepu. Rozstrzygnęło **zbrocze**: ciemna
bruzda wzdłuż środka głowni, której nie ma żadna inna ikona arkusza.
⭐ „Patrz na render, nie tylko na raport" — czwarty raz w tym projekcie, tym
razem na ikonie 32×32.

Dwie pułapki generatora, obie zapisane w `tools/CLAUDE.md`:

- **konsola Windows (cp1250) wywaliła skrypt na `⛔` w jego WŁASNYM raporcie**,
  przerywając pracę po pierwszym z dwóch kafli;
- **próg „ikona ma być większa od sąsiadów" miał wpisany własny wynik** (323 px
  wobec 323 px) — asercja porównywała się ze sobą i nie potrafiła zaświecić.
  Dziś progiem jest tasak (299 px), czyli coś, czego ten generator nie rysuje.

### (8) Koszt zapisany jawnie

⚠ **`obciazenie_przymiar` `W4` pokazuje 59,7 kg zamiast 58,7 — przesunął go
wielki miecz** (8 kg wobec 7 kg młota bojowego). ⛔ Nie jest to nowa usterka:
`W4` jest czerwony od 2026-09-15, pasmo 40–55 kg należy do `OI-105`, a dominuje
ciężka pawęż (16,2 kg). **Nie obniżyłem masy do 7 kg, żeby pomiar został
nietknięty** — strojenie danych pod wygodę pomiaru odwraca zależność między
nimi. Liczba jest dopisana do `OI-105` z nazwą sprawcy.

### Bramki

`tsc` ✅ · `build` ✅ · `doc_check` ✅ 0 błędów · `combat_regresja` ✅ 121/121
zero różnic · **`rece_przymiar` ✅ 9/9 (nowy)** · `materialy_przymiar` ✅ ·
`katalog_ekwipunku` ✅ 0 bloków · pozostałe 22 ✅. ⛔ Trzy czerwone sprzed tego
dnia: `warstwy` i `zestawy` (`OI-107`, liczby bez zmian) oraz `obciazenie`
(`OI-105`, **liczba ruszona — patrz punkt 8**).

---

## 2026-09-17 (2) — Katalog broni 21 → 30: warstwy społeczne zamiast nisz DPS

Druga partia szerokości tego samego dnia. Punkt wejścia bez zmian:
`docs/checkpoint_2026-09-17.md`, sekcja **ETAP II**. Decyzja z pełnym wywodem:
`docs/decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md`.

### (1) Audyt zaczął się od pytania „kto", nie od tabeli DPS

Brief autora był jednoznaczny: katalog ma przedstawiać świat, a dopiero potem
tabelę wyborów. Przełożyło się to na kryterium przyjęcia — *konstrukcja wchodzi,
gdy potrafisz powiedzieć, KTO jej używa i DLACZEGO akurat jej* — i na cztery
pytania odsiewające (synonim / oś jakości / oś materiału / inny właściciel).

⭐ **Najważniejszy wynik audytu jest NEGATYWNY: rodzina `sword` nie dostała ani
jednej pozycji.** Osiem mieczy pokrywa już mieszczanina, straż, żołnierza,
rzeźnika, bandytę, obcego kupca i rycerza. Cztery sprawdzone kandydatury
(gladius, estok, katzbalger, „miecz szczerbaty") odpadły — ostatnia dlatego, że
**zardzewiały miecz to miecz jakości 1, a nie nowy `ItemId`**. Najszersza
rodzina w katalogu okazała się tą, która najmniej potrzebuje dokładania.

### (2) Dwie konstrukcje były PUŁAPKAMI i trzeba je było przeliczyć

To jest jedyne miejsce, w którym „broń może być słabsza" ma granicę, i obie
pierwsze wersje ją przekroczyły:

```
  Nóż 5–9 żelaza      14,6 dps / 15 g   wobec osiosanego kija 16,8 dps / 12 g
  Mizerykordia 6–10   23,1 dps / 150 g  wobec sztyletu        25,0 dps /  40 g
```

⚠⚠ W obu przypadkach broń była gorsza **we wszystkich kanałach naraz i droższa**
— a przy mizerykordii premia do krytyka (0,18) była w tej liczbie **już
policzona**, więc nie zostawało nic, co tłumaczyłoby cenę. **Wolno być gorszym
w niektórych kanałach; nie wolno być gorszym we wszystkich i droższym.**
Poprawka: nóż 7–10 za 12 g (równo z kijem — różnicą jest zasięg 50 vs 74
i przynależność do rodziny, czyli biegłość), mizerykordia 8–12.

### (3) Niezmienniki zablokowały jedną konstrukcję i przestroiły pięć liczb

⛔⛔ **Dzida — jednoręczna drzewcowa — NIE POWSTAŁA.** Włócznia z tarczą to
najczęstszy zestaw piechoty, jaki istniał, i **dziś nie da się go w tej grze
złożyć**, bo wszystkie cztery drzewcowe są `hands: 2`. Blokuje `§Y Y2`, a
korytarz między „to już nie drzewcowa" (≤ 74) a „to łamie Y2" (≥ 76) jest pusty.
⚠ Kuszące było dopisanie drugiego wyjątku obok `hammer` — **nie zrobiono tego**:
wyjątek w strażniku, który zapada przy dosypaniu zawartości, uczy ignorowania
strażnika. `C4` / `OI-108`, decyzja autora.

Przestrojone liczby: `§T6` wymusił trzy cooldowny (nóż 0,42 → 0,44, cep
i berdysz 0,72 → 0,70 — trafienie wypadało 25–35 ms od końca okna ogłuszenia
przy progu 50 ms), `§Y Y3` ustawił sufit średniej 1H na 12,0, a `§ZB Z1`
wymusił łuk topora brodatego 62° i cenę rohatyny 190 g.

### (4) Oś gatunku dostała pierwszych użytkowników — i to obnażyło trzy kłamstwa

`WEAPON_MATERIAL` powstał 2026-09-16 i **nie korzystała z niego ani jedna broń**.
Był to poprawny stan startowy, ale **ścieżka, której nikt nie przechodzi, psuje
się po cichu**. Żelazo dostały dwie sztuki, w których jest faktem świata: **nóż**
i **cep bojowy** — obie z wiejskiej kuźni, nie z warsztatu płatnerza.

Natychmiast wyszło, że trzy miejsca czytały `damageMin`/`buyPrice` wprost
i od tej chwili kłamałyby o **25% obrażeń i 67% ceny** naraz:

1. **`§ZB` regresji** liczyło dominację i bliźniaki na surowych polach;
2. **generator katalogu** wypisywał do `ekwipunek_przedmioty.md` nominał
   zamiast tego, co widzi gracz *(dostał kolumnę `gat.`)*;
3. **zamek `material` po stronie PANCERZA** zgłaszał żelazną broń jako błąd
   zdaniem *„nikt o nie nie zapyta"* — nieprawdziwym od tego dnia.

⚠ Trzeci przypadek wymagał przepięcia asercji `§E E2`, która wprost testowała,
że gatunek na broni JEST błędem. ⛔ Zamka nie zdjęto: E2 pyta dziś o mikstur
z polem `material` (typ, który naprawdę nie ma żadnej osi gatunku) i osobno
sprawdza, że broń jest przepuszczana.

### (5) Strażnik, który liczył ręcznie

`§W W11c` brzmiało `bezStrefy.length === 18`. **Zapalał się przy każdej nowej
broni, choć nic się nie psuło** — dokładnie ten rodzaj strażnika, który uczy
ignorowania strażników, i wprost zakazany przez `CLAUDE.md` („nie wpisuj
ręcznych liczników jako źródła prawdy"). Dziś wymienia z nazwy trójkę
z martwą strefą: `glaive,halberd,pike`.

Dołożone: **`§ZB Z9`** (każda drzewcowa sięga dalej niż każda niedrzewcowa —
obietnica rodziny `polearm` przestała być zdaniem w komentarzu; powstała
dlatego, że **berdysz** był pierwszą bronią spoza rodziny, którą naprawdę kusiło
długie drzewce) i **`§ZB Z10`** (gatunek ma ≥ 1 użytkownika) oraz **`§W W9`**
(żelazna broń bije 0,80 i kosztuje 0,60 nominału — jedyny wiersz dowodzący, że
oś cokolwiek robi). ⚠ Wszystkie przeszły sabotaż.

### (6) Dystrybucja na trzy półki i pierwsza półka Rolnika

⛔ Nie wszystko poszło do Radzima. **Cep i kilof stoją u Rolnika** — to nie jest
sklep, tylko zdanie o świecie zapisane w danych: obie bronie mają tożsamość
*„nikt tego nie kupił jako broni"*, a kilof z półki kowala jest zwykłym towarem.
⭐ **Rohatyna u Myśliwego prostuje starą niezgodność**: komentarz przy `spear`
z 2026-08 mówił wprost *„oszczep na dziki byłby fabularnie ładniejszy"*
i odrzucił włócznię jako wojskowe żelazo — rohatyna nim nie jest.

### (7) Archeologia pikseli, której nie musiało być

⚠⚠ `public/assets/README.md` opisywał **wyłącznie rzędy pancerza (20–29)**.
Rzędy broni (0–8) nie były spisane nigdzie, więc partia zaczęła się od
przycinania arkusza i zgadywania, co jest czym. **Mapa jest teraz w tym pliku**
razem z listą wolnych kafli i z jednym faktem, który rozstrzygnął ikonę noża:
**(8,0) to jedyna głownia BEZ JELCA na całym arkuszu**, a każdy wolny kafel
rzędu 0 przy 17,6 px czyta się jako miecz.

⏳ Ten sam skan zablokował **kosę bojową** (`OI-110`): zakrzywionego ostrza na
długim drzewcu na arkuszu nie ma, a (2,5) i (2,8) czytają się jako topory.
Konstrukcja przeszła projektowo i czeka na ikonę, nie na projekt.

### (8) Dokumentacja przy suficie

⚠ `docs/systemy/weapons.md` ma po tej partii **12 bajtów zapasu** do limitu
`STAN` — druga taka pozycja obok `combat.md` (13 bajtów). Żeby zmieścić `N-94`,
punkt checklisty i wiersz routingu, trzeba było **wyciąć dokładnie tyle, ile
dopisano**: nieaktualną blokadę `OI-7` w `OI-42`, postmortem błędu
`equipFromBag` (HISTORIA w dokumencie typu `STAN`) i powtórzone bullety.
To jest `OI-111`.

⭐ Przy okazji z checkpointu **wyleciała migawka 21 konstrukcji** — 23 wiersze
liczb przepisane ręcznie z `GameConfig.ts`, które zestarzały się tego samego
dnia. Nad tabelą stało ostrzeżenie „nie czytaj stąd liczebności rosteru";
**ostrzeżenie nad nieaktualną tabelą przegrywa z tabelą**. Ta sama lekcja, którą
zapisał baner `ekwipunek_przedmioty.md`.

### Bramki

`tsc` ✅ · `build` ✅ · `doc_check` ✅ 0 błędów · `combat_regresja` ✅ 121/121 zero
różnic · `materialy_przymiar` ✅ · `katalog_ekwipunku` ✅ 0 bloków · pozostałe 22
instrumenty ✅. ⛔ Trzy czerwone (`warstwy`, `zestawy`, `obciazenie`) są **sprzed
tej partii** i mają identyczne liczby: `OI-107` i `OI-105`. Najcięższa nowa broń
(berdysz, 5,4 kg) jest lżejsza od młota bojowego, więc `W4` się nie ruszył.

---

## 2026-09-17 — Katalog broni 11 → 21 i model przedmiotu bojowego

Domknięcie etapu, który objął trzy sesje i jeden commit: **układ panelu handlu**,
**reorganizacja `items.md`** i **katalog broni**. Punkt wejścia:
`docs/checkpoint_2026-09-17.md`. Poniżej to, czego nie widać w diffie.

### Audyt, który nie znalazł tego, czego szukał

Brief zakładał, że dziesięć nowych konstrukcji wymusi refaktor. **Nie wymusiło.**
Grep po literałach `ItemId` w warstwie walki: **zero trafień**. Jedyne dwa
`switch` w `src/` idą po `id` UMIEJĘTNOŚCI (ikony proceduralne) i po
`PlayerAction.id`. `WeaponProficiency` pyta wyłącznie `family === null`
(gołe ręce). ⇒ dziesięć broni weszło jako **dane**.

⭐ **Najcenniejsze znalezisko było gdzie indziej:** `docs/ekwipunek_checkpoint.md`
§4B twierdził, że siedmiopozycyjny katalog testowy broni jest „zaproponowany
i policzony", a uzasadnienie wskazywał w `dziennik.md` 2026-09-12 (2). **Tamten
wpis dotyczy generatora warstw i dziewięciu pancerzy — nie ma w nim ani jednej
broni.** Liczby istniały „w rozmowie sesji", czyli nie istniały, i były tak
czytane przez cztery dni. **Propozycja bez zapisu nie jest propozycją.**

### Trzy osie, które doszły — i jedna, która się przeprowadziła

**`WEAPON_MATERIAL`** (`core/WeaponMaterials.ts`) — bliźniak `ArmorMaterials`,
ten sam kształt i te same nazwy pojęć. ⭐ Stal jest poziomem zerowym, więc
wprowadzenie osi **nie ruszyło ani jednej istniejącej liczby** (zamek `§W5`).
⚠ **Z pola korzysta dziś ZERO broni i to był cel** — oś ma pozwalać wystawić
żelazny wariant, a nie zmuszać do podwojenia katalogu w dniu powstania.

**`melee.minReach`** — dolna granica zasięgu. ⚠⚠ Powstała, bo drzewcowych **nie
da się różnicować zasięgiem**: trafialność orbitującego wilka skacze z 22,1% na
97,0% między 95 a 96 px, więc każda użyteczna broń drzewcowa stoi po tej samej
stronie jedynej liczby, która rozstrzyga. ⛔ Własność KONSTRUKCJI — włócznia jej
nie ma, pika ma, obie są `polearm`.

⚠ **Dolna granica należy do POSTACI, nie do ręki.** `offhandStrike` bierze
`Progression.attackMinReach`. Wzięcie jej z drugiej broni odtworzyłoby co do joty
**zastój autoataku** z 2026-09-07 — tylko od strony zwarcia zamiast dystansu.

**`parryBonus` zszedł z RODZINY na KONSTRUKCJĘ.** Przy jednym mieczu cecha
rodziny wyglądała poprawnie; przy ośmiu oznaczałaby, że rapier nie ma jak być
lepszym parrierem od tasaka. Rodzina niesie dziś sam znacznik `{ kind: "parry" }`
— dokładnie jak `polearm` niesie `reach`. ⭐ Znacznik jest nośny: czyta go
`MasteryCard`, a `parryChance` dalej mnoży EFEKT przez rangę. Zmierzone
w silniku: miecz **5,75%** bez rangi i **11,50%** przy M-IV, czyli co do bitu
tyle, ile przed przeprowadzką.

### Strażniki zadziałały dokładnie tak, jak obiecywał ich nagłówek

⭐⭐ **Sześć liczb moich nowych broni złamało istniejące niezmienniki** — Y2
(zasięg 2H), Y3 (obrażenia 2H) i T6 (okno ogłuszenia). §Y ma w nagłówku zdanie:
*„cecha tożsamości oparta na danych rozpada się cicho przy pierwszym nowym
przedmiocie"*. Rozpadła się przy dziesiątym i strażnik to złapał.

⚠ **Wiążącą bronią przy Y2 okazał się STARTOWY KIJ (74), nie rapier.** Bastard
przy 74 remisował z kijem; poszedł na 78. **Poprawiałem swoje liczby, nigdy
niezmienniki.**

⚠ Przy T6 wyszło coś, czego nie naprawiam: **strażnik testuje kombinację, której
gra zabrania** — Uderzenie tarczą bronią `hands: 2`. `stunMs` jest zamrożone
decyzją autora, więc trzy nowe bronie wyprowadziłem poza okno zamiast zawężać
zakres asercji. Zapisane jako `C1`.

### Dwie rzeczy, które wyszły dopiero z porównania parami

**Kord przegrywał z krótkim mieczem.** Ten drugi miał dwa warianty ORAZ
parowanie ORAZ był tańszy. Kord przesunięty na 60 g i 8–14: **najtańsza broń
rodziny, która nie płaci za nic poza ostrzem**.

**Tasak i szabla miały tę samą średnią I ten sam rozstrzał.** Rozjechane na
przeciwne bieguny przy niezmienionej średniej 12,0: tasak **7–17** (rozstrzał 10,
najszerszy wśród mieczy), szabla **10–14** (rozstrzał 4, najciaśniejszy w grze
razem ze sztyletem). To jest oś tożsamości wprost z `weapons.md` §5.

⇒ stąd nowa sekcja **`§ZB` w regresji**: dominacja, bliźniaki, różnicowanie
drzewcowych, `parryBonus` nie spływający z rodziny, dwa stany pierścienia.
Sabotaż zdany.

### UI: pierścień celu kłamał o kierunku

Cel w martwej strefie piki dostawał `outOfReach`, czyli **„podejdź bliżej"
w sytuacji, w której trzeba odejść**. Czwarty stan (`tooClose`, bursztyn, pełna
alfa jak `behind` — oba są odwracalne jednym ruchem). ⚠ Czwarta barwa w walce,
dokłada się do `OI-72`.

### Rzeczy, które NIE powstały — i to jest wynik

⛔ **`statBroni()`** — próg niespełniony: osiem mieczy różni się nie tylko
liczbami (parowanie 0/0,15/0,30, jeden albo dwa warianty, crit, `hands`).
⛔ **Interrupt dla kiścienia** — ma dość tożsamości na trzech istniejących osiach
(rozstrzał 14, odrzut 300 przy jednej ręce, zachwianie z rodziny); dodanie
przerywania zrobiłoby z niego tańszy młot.
⛔ **Warianty `light`/`heavy` dla broni** — `itemVariant()` zwraca `null` dla
wszystkich 21 i tak ma zostać.
⛔ **Nóż** — nie istnieje w grze w żadnej postaci; nie wymuszono konstrukcji.

### Dziura, którą odsłoniło odświeżenie katalogu

⚠ **`ItemTooltip` czytał gatunek wyłącznie z pancerza.** Pierwszy żelazny kord
różniłby się od stalowego **tylko liczbą obrażeń**, co czyta się jak gorsza
jakość wykonania — czyli jak zupełnie inna oś. Naprawione.

⚠ Przy okazji zdjęty baner z `docs/ekwipunek_przedmioty.md`: **„DZIEWIĘĆ BLOKÓW
JEST NIEODŚWIEŻONYCH" z instrukcją „liczby broni czytaj z przymiaru, nie z tabel
niżej"** stał tam dwanaście dni po tym, jak `OI-7` zamknięto, a `D-4` zniknęło
razem z polem. **Ostrzeżenie o nieaktualności samo się zestarzało.**

### Art

⭐ Ikony wszystkich dziesięciu **były już narysowane w `items.png`** — zero
placeholderów, zero nowej grafiki.
⚠⚠ Modeli 3D brak dla wszystkich dziesięciu; każda rysuje się jako **pusta dłoń
+ `console.warn`**. Serwer MCP `blender` nie wstał (`CONNECTION_CLOSED`).

---

## 2026-09-16 (2) — Sklep: kolumna kupca dostała okno; pointer pod skalowanym UI

**Zgłoszone ze zrzutu z rozgrywki**: po rozszerzeniu katalogu tarcz lista towaru
Kowala wychodziła poza dolną krawędź panelu handlu. Poniżej to, czego nie widać
w diffie.

### Trzy przecieki, nie jeden — i wszystkie tej samej klasy

⚠⚠ **Kolumna kupca nie miała OKNA.** Liczba rzędów była wyprowadzana
z `purchasable.length` — poprawnie — ale **nic nie ograniczało wyniku w dół**.
Półka Radzima urosła z 37 do 56 pozycji, czyli **12 rzędów = 572 j. przy 248 j.
budżetu**, więc siedem ostatnich rzędów malowało się **221 j. poza panelem**.

⭐⭐ **Nauka warta zapamiętania: wyprowadzenie z danych NIE wystarcza.**
Komentarz nad `MERCHANT_GRID` chwalił się wprost, że rzędy są liczone ze stocku,
a nie wpisane na sztywno — *„exactly the kind of bug that reappears the next
time an item is added"* — i ten sam bug wrócił **drugimi drzwiami**. Kolumna
plecaka dostała maskę i przewijanie 2026-09-05; kolumna kupca nie, bo wtedy się
mieściła. Potrzebne są OBIE rzeczy: liczba rzędów z danych **i** okno.

⚠ **Rząd ZAŁOŻONE łamał się po stałej `5`**, dobranej dla dziesięciu slotów.
Model C plus ożywione `shoulders` dały **19 adresów → 4 rzędy sięgające 280 j.
przy limicie 193**. Istniejący `console.warn` **świecił i nikt go nie widział** —
dokładnie jak przy plecaku jedenaście dni wcześniej.

⚠ **Podpisy przy kaflach były nieczytelne niezależnie od pionu.** Monospace 9 px
to ~5,4 j. na znak, a `„Głowa · wzmocnienie"` potrzebuje 103 j. przy podziałce
37. Na zrzucie czytało się to dosłownie jako `GłowaBlochronaWzmocnienie`.
Odpowiedź jest ta sama, do której lalka `PlayerPanel` doszła wcześniej: **glif
w kaflu zamiast podpisu**, plus cyfra warstwy w rogu; nazwa slotu żyje dalej
w karcie przedmiotu i w podpowiedzi. Zaakceptowane przez autora.

Przy okazji wyszły dwa mniejsze: **linia podziału** mierzyła się do ZAWARTOŚCI
(schodziła 310 j. pod panel), a **strefa upuszczania** też — czyli niewidzialny
prostokąt łapiący *zakup* tam, gdzie gracz nie widzi żadnej półki.

### ⚠⚠ Pointer pod skalowanym UI — bug niewidoczny na desktopie

Znalezione przy okazji, **starsze od tej sesji i groźniejsze od samego
overflow**: `onScrollStart` odejmował `container.x` (jednostki WIRTUALNE) od
`pointer.x` (piksele BUFORA).

```
poprawnie:  (p.x / uiScale() − container.x) / container.scale
było:       (p.x            − container.x)
```

Na desktopie `uiScale() === 1`, więc **nic nie było widać**. Na telefonie
`uiScale()` to `dpr × clamp(krótsza oś / 580)` — dla S21 FE `2,625 × 0,709 =
1,86`, czyli strefa czuła na przewijanie leżała **86% obok kolumny**.
Przewijanie plecaka w sklepie było więc niesprawne na telefonie od dnia, w którym
powstało (2026-09-05), i żadna liczba tego nie mówiła. Reguła stoi w
`src/ui/CLAUDE.md` od dawna: *wszystko, co czyta `pointer.x/y`, wymaga jawnego
przeliczenia*.

⛔ **Maska to INNY przypadek i łatwo je pomylić.** `Graphics` maski idzie przez
kamerę sceny, więc `uiScale()` tam **nie wchodzi** — wchodzi wyłącznie
`container.scale`. Potwierdzone renderem przy skali panelu 0,548: linia cięcia
siedzi dokładnie na krawędzi okna.

### Co powstało

`src/ui/ShopLayout.ts` — geometria panelu jako **czyste dane** (zero Phasera,
zero stanu), ten sam wzorzec co `EquipLayout.ts`. `ShopPanel` inicjalizuje z niej
swoje pola, więc drugiego rachunku tej samej geometrii nie ma.

`tools/sklep_uklad.mjs` — przymiar uruchamiający **prawdziwy** moduł i
**prawdziwe półki z `GameConfig`**. Sprawdza m.in., że kolumna kończy się nad
tym, co pod nią stoi, że rząd ZAŁOŻONE mieści się nad stopką i że **pasek
pokazuje się dokładnie wtedy, gdy jest potrzebny** (pięć z sześciu półek mieści
się w całości i suwaka nie dostaje). Sabotaż: zwężenie rzędu zapala `E1`,
podmiana `columnFloor` na dawne `panelH/2 − 44` zapala `S4` i `E1`.

⚠ **`tools/ui_panele_weryfikacja.mjs` §1 zostało wycięte, nie przepisane.**
Czytało literały ze źródła `ShopPanel.ts` wyrażeniem regularnym i w minucie,
w której te liczby przeniosły się do `ShopLayout.ts`, **wywaliło się wyjątkiem
zamiast zaświecić na czerwono** — czyli asercja nie zgłosiła awarii, tylko
przestała istnieć. Cztery jej własności żyją dalej jako §S2/§S4/§S5/§S6 w nowym
przymiarze, liczone z modułu zamiast z tekstu.

### Katalog ekwipunku — dziura, którą odsłoniło odświeżenie

⚠⚠ **`SLOTY_PANCERZA` w `tools/katalog_ekwipunku.mjs` było listą RĘCZNĄ i nie
znało slotu `shoulders`.** Skutek: nagłówek raportu liczył **85 sztuk pancerza,
a tabele opisywały 81** — czterech naramienników nie było w dokumencie, mimo że
były w grze, a raport świecił na zielono. Generator dostał slot i **asercję
„każdy pancerz trafia do tabeli"**, która pod sabotażem pokazuje
`81/85 — POZA: shoulders`.

⚠ Kontrole tego generatora **nie gatują kodu wyjścia** (żadna, nie tylko nowa) —
czerwień widać w raporcie, bramką jest `doc_check` §T. Stan sprzed tej sesji,
zostawiony bez zmian.

### Zweryfikowane

`tsc` ✅ · `npm run build` ✅ · `sklep_uklad` ✅ · `ui_panele` ✅ ·
`sklep_cofniecie` ✅ · `ekwipunek_uklad` ✅ · `hud_uklad` ✅ ·
`combat_regresja` ✅ 121/121 · `tarcze_przymiar` ✅ · `viewport` ✅.

W silniku, na wszystkich sześciu kupcach, przy `scroll = 0` i na maksymalnym
przewinięciu: **zero niezamaskowanych elementów poza ramką** i **zero kafli
klikalnych poza oknem** (skan drzewa kontenera). Ramki: 800×500 (skala panelu
1,00) i 740×360 przy dpr 2 (`uiScale` 1,24, **skala panelu 0,548**) — ta druga
jest ścieżką, która przed poprawką pointera nie działała wcale.

### ⛔ Dług zapisany, nie naprawiony

⚠ **`warstwy_przymiar` i `zestawy_przymiar` są czerwone i to NIE pochodzi z tego
zakresu** — patrz `OI-107`. Obie twierdzą, że `EQUIP_SLOTS` ma 18 adresów
zwijających się do 10 miejsc; od ożywienia `shoulders` w `d5bd27d` jest ich
**19 i 11**. ⛔ Świadomie nietknięte decyzją autora: to jest sprawa taksonomii
i warstwowania, nie handlu, i nie naprawia się jej przy okazji sklepu.

⚠ `doc_check` zostaje z **jednym** błędem — `docs/systemy/items.md` 20,5 KB
ponad limit 20,0 KB dla typu `STAN`. Przyszedł z merge'a 2026-09-16 (1), jest
decyzją treściową i też nie należy do tego zakresu.


---

## 2026-09-16 (1) — Tarcze: katalog 30, `T-1`, pomiar `OI-24`; pięć paczek pancerza

**Najdłuższa sesja katalogowa tego projektu.** Sześć domknięć naraz, wszystkie
wypchnięte w `d5bd27d`. Poniżej to, czego nie widać w diffie.

### Merge, który czekał — osiem konfliktów

`feat/tarcze-ciezar-bloku` (T-7) stała niewmergowana z **41 plikami**, a `main`
miiał **10 niewypchniętych commitów**. Obie linie pisały równolegle tego samego
dnia i obie dodały całe nowe sekcje zamków do `tarcze_przymiar.mjs` — wybór
jednej strony kosztowałby kilkanaście asercji, więc zostały obie (§N + §K),
z przemianowaniem kolizji nazwy `koszt`.

> ✅ **ROZSTRZYGNIĘTE 2026-09-21: `OI-104` zostaje przy Modelu D, a sprawa
> opisana niżej dostała `OI-143`.** Akapit zostaje w brzmieniu z dnia zapisu —
> to `HISTORIA`, więc mówi, co było wtedy, nie co obowiązuje dziś.

⚠⚠ **`OI-104` oznacza DWIE RÓŻNE sprawy** — obie linie nadały ten sam numer
niezależnie (kumulacja zestawów vs wdrożenie Modelu D). Zachowane obie
z jawnym ostrzeżeniem; ⛔ nowego numeru NIE nadano samodzielnie.

### `T-1` — geometria jako dane, bez kalibracji

Mechanizm `construction → SHIELD_GEOMETRY → BlockSpec.geometry → resolver`
działa, a rejestr jest **celowo pusty** — wartości to `B3`, po `P1`. Regresja
121/121 bez różnic, bo `guardZone` dostał parametr z wartością domyślną.

⭐⭐ **Znalezisko warte zapamiętania:** zamek §G6 brzmiał *„`guardZone` ma dziś
arność 2 — po `T-1` ten zamek MA paść”* i **nie padł mimo wdrożenia `T-1`**.
Powód jest w języku, nie w kodzie: **`Function.length` liczy parametry do
pierwszego z wartością domyślną**, więc `guardZone(a, b, geo = ...)` nadal
raportuje 2. Tripwire na `.length` był od początku niezdolny zadziałać —
czyli był dekoracją. Zastąpiony sprawdzeniem źródła, które umie paść.

### `OI-24` — pomiar, nie decyzja

Cap `0,75` jest **nie do obejścia w swoim kanale** (pełny sprzęt Q7 × cztery typy
obrażeń). Ale kanał pancerza dobija do niego **już przy jakości 4**, a ŁĄCZNA
mitygacja wychodzi **91,8% ze sprzętu z półki** — bo tarcza mnoży się PO capie.
⚠⚠ **Cap zdejmuje tylko 0,5–0,9 pp**: na tym poziomie punktów ogranicza KRZYWA,
nie sufit. Gdyby kiedyś padła decyzja o wspólnym suficie łącznej mitygacji,
ruszanie `0,75` **nie jest dźwignią, której się szuka**.

⚠ Pierwsza wersja tego zamka mierzyła na komplecie **półpustym** (28% zamiast
75%), bo grupowała po `def.slot` zamiast po 18 adresach modelu C.

### Katalog tarcz: 39 → 30

Wariant `light` został **wyłącznie przy Legionowej**. Rozstrzygnęło to jedno
zdanie z Modelu D: **`speedFreeKg` i `regenFreeKg` wynoszą 10 kg**, więc
oszczędność 0,4 kg na lekkim puklerzu **nie robi w grze dosłownie nic** — a przy
tym obniża `blockCapacity` i PODNOSI koszt wysiłku za punkt. Lekka rycerska była
wariantem **anty-tożsamościowym**: zbijała `reduction`, czyli to, po co się tę
konstrukcję bierze.

⚠ **Audyt katalogu złapał realny błąd:** `ironbound_shield` wymaga Siły 3,
a baza deklarowała 0 — więc **żelazna okrągła o tej samej masie nie wymagała
niczego**. Zamek §V1 tego nie widział, bo nie porównywał `requires`.

### Pięć paczek pancerza

Zwykły ubiór (6), `studded_leather`, Szyszak, ożywienie slotu `shoulders`,
lamelka i łuska (7). ⭐ **Slot ramion ożył dokładnie tak, jak projekt to zapisał
z góry**: kafel stał jako `planned` od 2026-09-11 z regułą *„komórki manekina są
martwe, dopóki nie istnieje przedmiot, który w nie wejdzie”*. `SAVE_VERSION`
nietknięte — `shoulders?` to szósta rzecz dodana polem opcjonalnym.

⛔ **Karwasze zatrzymane**: slot `arms` nie istnieje nigdzie, a siatka lalki jest
**12/12 pełna**. Umieszczenie nowego kafla to decyzja układu, nie konsekwencja
techniczna — zgłoszone zamiast zgadnięte.

### Audyt warstwowania — jeden realny błąd modelu

55 konstrukcji pancerza sprawdzonych. Werdykt: **model jest spójny dla
kanonicznego stosu i rozjeżdża się dokładnie tam, gdzie MATERIAŁ przestaje
odpowiadać POZYCJI** — bo warstwa jest wyprowadzana z `armorType`.

⛔ **`steel_boots`/`iron_boots` są opisane jako kompletny but, a siedzą na
`boots_L3`**, więc legalny jest zestaw „buty L2 + buty L3” = **dwie pary butów**.
Kontrast w tym samym obszarze: `half_sabatons` są opisane poprawnie jako
nakładka. ⚠ Naprawa to **nazwa i opis**, nie warstwa.


---

> ⚠ **Wpisy (22) i (23) przyszly z linii `main`, wpisy (13)–(21) z galezi
> `feat/tarcze-ciezar-bloku`.** Obie linie pisaly rownolegle tego samego dnia i obie
> nadaly swoim wpisom numery (13) i (14). Numery 22–23 nadano przy scalaniu
> (2026-09-16), zeby byly unikalne — ⛔ **nie twierdza, ze te dwa wpisy powstaly po (21).**

## 2026-09-15 (23) — GATUNEK materiału: żelazo jako szczebel pod stalą

**Audyt najpierw, kod potem.** Pytanie brzmiało „czy `metal` nie miesza żelaza
ze stalą". Odpowiedź z danych: ⛔ **nie ma dziś żadnej ukrytej drabinki
materiałowej** — wszystkie jedenaście sztuk `metal` leży w JEDNYM paśmie
**4,0–5,0 g/PP**, a różnice, które wyglądają na gatunek, to oś ROZMIARU i biegną
w przeciwną stronę (kapalin ma **lepsze** PP/kg niż stalowy hełm). Przypisanie
gatunku po nazwie dałoby drabinkę odwróconą.

**Model M1 (wybrany przez autora):** `armorType` zostaje PROFILEM, dochodzi
`material` jako GATUNEK. ⭐ Dowód, że osie są naprawdę prostopadłe: **żelazo jest
jednocześnie drutem (`mail`) i blachą (`metal`)** — jednym wierszem
`ARMOR_PROFILE` tego nie zapiszesz. Skutek uboczny: `OI-100` (łuska) przestaje
konkurować o to samo miejsce.

**Liczby wyprowadzone, nie wybrane.** SUFIT z czytelności (`iron Q4 < steel Q1`
→ `m < 0,810`) i PODŁOGA z katalogu (żelazna szyna nie pod nogawice kolcze,
12/15 = 0,800) domykają korytarz do **0,800–0,810**; autor wziął `0,80`.
Cena `0,60` — warunek `priceMul < defenseMul`, inaczej żelazo jest słabsze
**oraz** gorsze na złotówkę, czyli pułapką. ⛔ **Ręce wypadły z osi
arytmetycznie**: rękawice kolcze 5 PP przy płytowych 6 dają podłogę 0,833,
powyżej sufitu 0,810 — korytarz pusty.

**Wdrożone:** `core/ArmorMaterials.ts` (oś, mapa profili z drabinką, walidacja),
mnożnik w `instanceDefense`/`buyPriceOf`/`sellPriceOf`, linia **Materiał** na
karcie, siedem nowych `ItemId` (4 blachy + 3 kolczugi) u Radzima.
⭐ **Każda żelazna sztuka deklaruje liczby KONSTRUKCJI swojego bliźniaka** —
różnicę robi wyłącznie `material`. Dzięki temu strojenie konstrukcji przestraja
oba gatunki naraz. Zero zmian w istniejących liczbach; kirys zostaje szczytem.

**Taksonomia:** wiersz „napierśnik żelazny vs stalowy — ODRZUCONE" z 2026-09-12
unieważniony **jawnie i punktowo** (przekreślony w miejscu + wskaźnik), bo upadła
jego przesłanka („ten sam wiersz `ARMOR_PROFILE`"). ⛔ Reszta tamtej tabeli
zostaje odrzucona, `moc` tamtej decyzji zostaje `ACTIVE`, `N-7` nietknięte.

⚠ **`OI-103` NIETKNIĘTY — `k = 0,6` nie jest zatwierdzone.** Katalog urósł, więc
`61,5 kg` z audytu obciążenia opisuje już przeszłość.

**Bramki:** `tsc` czysty · `build` przechodzi · materiały **58/58** (sprawdzone,
że świecą: przy `m = 0,85` pada siedem zamków czytelności) · zestawy 39/39 ·
warstwy 40/40 · combat 121/121 · tarcze 129 · ⭐ **`doc_check` ZERO BŁĘDÓW** —
po przegenerowaniu katalogu zniknął też ten jeden, znany sprzed sesji.

---

## 2026-09-15 (22) — Przegląd runtime'u po modelu C; dwie decyzje; `(set, area)` wdrożone

**Przegląd (bez zmian w kodzie) — co model C naprawdę zrobił.** Warstwa dostała
**adres, nie znaczenie**: w ścieżce liczenia ochrony (`armorPieces` →
`instanceDefense` → `armorPointsAgainst` → `d/(d+50)`) warstwa nie występuje ani
razu, a jedyną egzekwowaną regułą legalności jest **arność adresu** (jeden adres
= jeden przedmiot). Zmierzone na katalogu: L1 = 33 PP / 8,0 kg (**4,13 PP/kg**,
zero wymagań Siły), L2 = 46 / 20,0, L3 = 69 / 33,5; pełny stos 148 PP / 61,5 kg
→ 74,7%.

⚠ **Jedyna realna szkoda balansowa nie leży w warstwach**: weszły przed modelem
obciążenia (`OI-103`), a powyżej `ratio 0,90` kara ma sufit — 45 kg i 61,5 kg
kosztują tyle samo, i to w koszcie UNIKU, czyli w walucie, której nosiciel trzech
warstw nie wydaje. Maksymalny stos jest dziś ściśle dominujący.

**Decyzja 1 — warstwy arytmetycznie RÓWNOWAŻNE (wariant A).** PP nie zależy od
pozycji w stosie. ⛔ Odrzucone: „L1 znaczy coś dopiero pod czymś" (łamie
`armor.md` §1.2 — punkty sztuki zaczęłyby zależeć od reszty kompletu)
i mnożniki pozycyjne 1,00/0,85/0,70 (wchodzą w zamrożone `D2`). Tożsamość warstw
ma pochodzić z katalogu i z obciążenia.

**Decyzja 2 — zestaw liczy się po OBSZARACH `(set, area)`.** Jeden obszar ciała
wnosi najwyżej jeden element; `ring1`/`ring2` zostają dwoma miejscami; mianownik
`setSize` to liczba możliwych MIEJSC, nie członków. ⛔ Liczenie nie czyta
`layer` — `D4` nienaruszone.

**Wdrożone:** `ItemSets` liczy `WornElement { place, itemId }`,
`Equipment.wornElements` + `placeOfSlot` (jedyny słownik miejsc),
`ItemTooltip` przestał mieć **własny, drugi licznik zestawu** i czyta
`Equipment.setProgress`.

⭐ **Reguła jest na dzisiejszym katalogu ZEROWA** — cztery zestawy mają po
pięciu członków w pięciu różnych obszarach, więc nie zmieniła ani jednej liczby.
Dlatego przymiar (`tools/zestawy_przymiar.mjs`, 39 zamków) ładuje **drugi graf
modułów** z katalogiem zmienionym w locie: trzy warstwy torsu pod jednym tagiem,
czyli **zestaw pionowy**, którego dziś nie ma, a który `D4` dopuszcza. Sprawdzone,
że zamek świeci na czerwono: po degradacji reguły do liczenia sztuk `D1` pokazuje
`worn=3`, a `D2` zapala próg „2 szt." z jednego obszaru ciała.

**Nowe `OI-104`** *(od 2026-09-21 numer tej sprawy to `OI-143` — zderzenie
rozstrzygnięte na rzecz Modelu D)* — model C położył L1/L2/L3 na rozłącznych adresach, więc pełna
przeszywanica + kolczuga + stal daje **trzy progi „4 szt." naraz**; przed
warstwami komplet materiałowy był wyborem wyłącznym. Dziś maskuje to
`bonus: {}`. **Warunek wstępny `OI-94`.**

**Przy okazji, bez zmiany rozgrywki:** nagłówek `ArmorLayers.ts` twierdził „to
jest DZIŚ METADANA, nie mechanika", a komentarz `paintLayerPips` — „zapala się
najwyżej jedna kropka"; oba kłamały od `8d64252`. Doszedł `layerDeclarationProblems`
— zamek na `layer` postawiony tam, gdzie nikt go nie zapyta (nie-pancerz, slot
bez warstw, wartość spoza `L1/L2/L3`). ⛔ Nie sprawdza zgodności z materiałem
i nie może: to pole **jest** wyjątkiem od domyślnej mapy.

**Znalezione, świadomie NIENAPRAWIONE** (czeka na decyzję o kaflu lalki):
kafel obszaru ma **adres zamrożony przy budowie panelu** (`setData("equipSlot")`),
więc przeciągnięcie przeszywanicy na tors dostaje odmowę „To nie ten slot",
choć tapnięcie w plecaku działa; ta sama przyczyna sprawia, że asercja pokrycia
zgłasza w konsoli 8 adresów bez kafla.

**Bramki:** `tsc` czysty · `build` przechodzi · warstwy 40/40 · zestawy 35/35 ·
combat 121/121 · tarcze 129 · układ ekwipunku OK · `doc_check` — ten sam jeden
znany błąd sprzed sesji (`ekwipunek_przedmioty.md`, 11 bloków).

---

## 2026-09-15 (21) — DYSTRYBUTORZY: 9 z 11 sierot trafilo na polki

⛔ **Zero zmian mas, PP, cen, jakosci, materialow, konstrukcji, Modelu D,
`EQUIPMENT_LOAD`, treningu, warstw, tarcz i walki.** Zmieniona wylacznie
DOSTEPNOSC: trzy tablice `stock` w `GameConfig.ts`.

**Problem.** Druga partia pancerza (2026-09-12) weszla do `ITEMS` **bez
dystrybutora**: 11 sztuk nie wystepowalo w zadnym sklepie, zadnej nagrodzie
questowej ani w zadnym loocie. Ten sam rodzaj martwej zawartosci, co palka
i krotki miecz w 2026-08-26.

**Przypisanie po MATERIALE, czyli po fachu rzemieslnika:**

| kto | co doszlo | jakosc |
|---|---|---|
| Kowal (Radzim) | `short_hauberk`, `demi_chausses`, `kettle_hat`, `brigandine`, `cuirass`, `cuisses`, `half_sabatons` | 1–2 (druga reka, bez zmian) |
| Mysliwy (Wszebor) | `hardened_leather_chest` | 3–4 (wlasny wyrob) |
| Witek | `arming_doublet` | 3 (Zwykla, len) |

⭐ **Najciezszy zestaw KUPOWALNY: 36,5 → 45,5 kg** (55,5 kg z drugim zestawem
broni). Kirys (17 kg) i nabiodrki (10 kg) byly jedynym powodem, dla ktorego
gorne pasmo `OI-105a` bylo niedostepne bez konsoli.

⚠⚠ **KOREKTA MOJEGO WLASNEGO AUDYTU.** Zestaw „47,5 kg" z raportu `OI-105`
skladalem przypisaniem do pol (`Equipment.weapon = …`), czyli **z pominieciem
reguly dwurecznosci** — `war_hammer` ma `hands: 2` i `handsRefusalFor` nie
pozwala trzymac przy nim tarczy. **47,5 kg nigdy nie bylo zestawem legalnym.**
Prawdziwe maksimum katalogu to 45,5 kg (1H + tarcza) albo 42,5 kg (2H) i dzis
oba sa do kupienia. ⚠ Buildy `D` i `E` w protokole `OI-105a` byly zbudowane
poprawnie (`hammer`, 1H), wiec protokol tego bledu nie odziedziczyl.

### ⛔ DWA KONFLIKTY — zatrzymane, nie rozstrzygniete samodzielnie

1. **Drewniane tarcze u Sobka sa NIEMOZLIWE do dodania.** W `ITEMS` istnieja
   **dwie** tarcze (`buckler` skorzany, `ironbound_shield` metalowy),
   a `armorType` przyjmuje wylacznie `leather` / `padded` / `metal` / `mail` —
   **w calym katalogu nie ma ani jednego przedmiotu z drewna**. Puklerz
   drewniany, tarcza okragla, rycerska i pawez to pozycje z `tarcze_katalog.md`
   (39 definicji **kandydackich**, „⛔ ZERO liczb balansowych, w `ITEMS` nadal
   DWIE tarcze"). Dodanie ich znaczyloby: nowe przedmioty + nowy material +
   wymyslone masy, PP i ceny — czyli dokladnie to, czego polecenie zabrania,
   i zakres `tarcze_checkpoint.md` (8 krokow wdrozenia).
   ⚠ Osobno: **Sobek nie ma dzis sklepu w ogole** (`stock: 0`), wiec nie jest
   to „uzupelnienie istniejacego dystrybutora", tylko utworzenie nowego.
2. **`padded_gloves` i `worn_wraps` nie maja pola `buyPrice`.** `buyPriceOf`
   zwraca dla nich `0`, wiec na polce stanelyby jako wiersz bez ceny. Dopisanie
   ceny jest decyzja balansowa, nie uzupelnieniem dystrybutora.

**Weryfikacja w ZYWYM grafie modulow dzialajacej gry** (nie w kopii): kazda
z 9 pozycji jest na wlasciwej polce, z jakoscia wyprowadzona przez
`vendorQuality` **wewnatrz zadeklarowanego zakresu kupca** i z realna cena
(15–98 g). Gra bootuje, 60 FPS.

**Checki:** `tsc` ✅ · `build` ✅ · `doc_check` 0 bledow · **21 przymiarow** ✅.

---

## 2026-09-15 (20) — B-1: gra nie wstawała przy viewporcie 0x0

⛔ **ZERO zmian w Modelu D, walce, staminie, pancerzu, tarczach, warstwach,
progresji i ekonomii.** Wyłącznie odporność startu.

**Przyczyna, zmierzona a nie wydedukowana.** `main.ts` czyta `cssSize()`
w trakcie ewaluacji modułu i wynikiem karmi `Phaser.Game`. Dokument bez layoutu
raportuje `0`, więc `game.config` wychodzi `0x0` → framebuffer 0x0 → WebGL
`INCOMPLETE_ATTACHMENT` → renderer ginie na niezlapanym wyjatku → **zadna scena
nie startuje**. Czarny ekran, zero komunikatow w grze.

⚠ **`fitToWindow()` tego NIE ratowal**, mimo ze wyglada na zabezpieczenie: wisi
na zdarzeniu `resize`, wiec odpala sie **po** smierci renderera. Zmierzone:
`game.scale` pokazywal juz 1024x768, a `game.config` nadal `0x0`.

**Dowod, ze to wlasnie to:** recznie zbudowany framebuffer **0x0** dal w tym
samym kontekscie WebGL **dokladnie ten sam status** co gra, podczas gdy
256x256, 1280x720, 1280x720+depth-stencil i 2048x2048 wszystkie wyszly
`COMPLETE`.

**Naprawa — dwa miejsca, oba lokalne:**

1. `core/Viewport.ts` — `cssSize()` dostaje kolejke zejsc
   (kontener → okno → korzen dokumentu → `screen`) i **gwarantuje wynik > 0**;
   przy calkowitej porazce schodzi na `1x1` i **ostrzega w konsoli** (ta sama
   regula, co przy brakujacym PNG: gra wstaje zawsze, ale degradacja zostawia
   slad). ⭐ Poprawka siedzi przy ZRODLE pomiaru, wiec `fitToWindow()` dostaje
   te sama gwarancje za darmo.
2. `main.ts` — jednorazowe `requestAnimationFrame(fitToWindow)`. Powod: `resize`
   jest zdarzeniem WEJSCIA i nie ma obietnicy, ze przegladarka je wysle tylko
   dlatego, ze layout wreszcie sie policzyl. ⛔ Nie petla i nie obserwator.

**Weryfikacja w silniku — swieze otwarcie panelu, czyli DOKLADNIE scenariusz,
ktory wczesniej zabijal renderer:**

```
PRZED: config 0x0     · niezlapany wyjatek · 0 scen        · czarny ekran
PO:    config 3440x1440 (zejscie na `screen`) · contextLost false
       · 61 FPS · 4 sceny, Boot LOADING · scale juz 1024x768 (rAF zadzialal)
       · konsola: zero bledow
```

**Nowy przymiar `tools/viewport_przymiar.mjs`** — laduje PRAWDZIWY `Viewport.ts`
(esbuild, `import.meta.env.DEV` podmienione) i karmi go siedmioma ksztaltami
okna. ⭐ **Autotest `--sabotaz` odtwarza kod SPRZED poprawki i ten oblewa 5 z 7
przypadkow** — czyli straznik naprawde swieci na czerwono, a nie jest dekoracja.

⚠ **Zauwazona cena, przyjeta swiadomie:** przy zejsciu na `screen` gra alokuje
na jedna klatke plotno wielkosci monitora (tu 3440x1440 ≈ 20 MB), zanim `rAF`
sprowadzi je do rozmiaru okna. Sciezka jest awaryjna i nie powinna wystapic
normalnie; alternatywa (`1x1` od razu) oznaczalaby gre nie do zagrania, gdyby
korekta kiedys nie dojechala.

⚠ **`B-2` (loader Phasera staje w niewyrenderowanym dokumencie) NIE RUSZONY** —
traktowany jako problem srodowiska testowego, zgodnie z decyzja autora.

**Checki:** `tsc` ✅ · `build` ✅ · `doc_check` 0 bledow · **20 przymiarow** ✅ ·
dwa autotesty `--sabotaz` ✅.

---

## 2026-09-15 (19) — OI-105a: przygotowanie i krytyka Modelu D

⛔ **ZERO zmian w kodzie i w parametrach.** Sesja przygotowawcza: odczyt,
pomiary, protokół.

⚠⚠ **ZNALEZISKO, KTÓRE ZMIENIŁO ZAKRES: trzy z sześciu zamówionych mas są
NIEOSIĄGALNE.** `cuirass` (17 kg) i `cuisses` (10 kg) — dwie najcięższe sztuki
pancerza — **nie występują w żadnym sklepie, żadnej nagrodzie questowej ani
w żadnym loocie**. Przemiecione `stock` wszystkich NPC-ów.

⇒ **Najcięższy zestaw kupowalny w grze to 36,5 kg** (stal ×5 + młot + tarcza
okuta), a nie 47,5. Z drugim zestawem broni — 46,5 kg. **11 z 32 pancerzy nie
ma dystrybutora**; to zawartość z drugiej partii (2026-09-12), której nikt nie
wpiął do gospodarki. Zapisane jako **`OI-106`** (CONTENT).

**Decyzja autora:** `OI-105` rozdzielone na **`105a`** (pasmo 12–46,5 kg, teraz)
i **`105b`** (47–75,5 kg, po `OI-98`). ⭐ Powód: model kalibrowano na 10–75,5 kg,
a grywalne jest dolne ~55% krzywej — **„nie czuć" na tym paśmie nie dowodziłoby,
że model jest zły**.

### Siedem ryzyk zgłoszonych PRZED testem (hipotezy, nie werdykty)

- **R-1** — kanał WYSIŁKU znika przy Sile ≈ 18,5 dla najcięższego dostępnego
  zestawu. Przy Sile 20 buildy A–D mają **identyczny koszt uniku 15,0**.
  ⇒ **ranga II treningu („Oddech", 2 pkt) nie ma czego zdejmować.**
- **R-2** — sprint unieważnia karę mobilności jako bramkę ucieczki: każdy build
  zrywa aggro Szarego (deAggro 420 px) w ~2 s, mając zapas 82–126 kafli.
- **R-3** — kotwica watahy (115 px/s) opisuje **zachowanie marginalne**: wilki
  gonią 115 wyłącznie dobiegając spoza orbity, a krążą przy **78** (`Wolf.circleStep`).
- **R-4** — „mocny burst ciężkiego" nie jest własnością pancerza: obrażenia
  zależą od BRONI, a broń jest niezależna od zbroi.
- **R-5** — regeneracja niemierzalna w jednej walce (~8,6 pkt na puli 120).
- **R-6** — premia do uniku poniżej szumu (5,15% vs 4,45%).
- **R-7** — Unik (dash) ignoruje masę, więc jest **relatywnie cenniejszy dla
  ciężkich** — emergentne, nieprojektowane.

⚙ **Skorygowałem własną wcześniejszą ocenę:** zapowiadałem test sieci jako
„najmocniejszy efekt w grze". **Liczby tego nie potwierdziły** — wszystkie
buildy uciekają sieciarzowi (62 px/s) nawet spowolnione, a różnica przez całe
2,6 s to **jeden kafel**. Test zostaje wyłącznie jako kontrola podłogi.

⭐ **Najlepszym ciągłym dyskryminatorem okazał się POŚCIG, nie ucieczka.**
Królik ucieka przerywanie przy 92 px/s, więc tempo domykania to `148−92 = 56`
(A) wobec `127,5−92 = 35,5` (D) — **stosunek 1,58×**.

⭐ **Najostrzejszym pojedynczym testem jest ranga III treningu:** przenosi chód
na buildzie D przez próg Szarego (127,5 → **133,1** przy Szarym 132), czyli
kupuje zmianę **jakościową**, nie procent.

⚠ Build C (30,5 kg) daje **131,97 px/s przy Szarym 132** — różnica 0,03 px/s.
Wynik tego pomiaru **będzie niejednoznaczny i jest to przewidziane**.

**Dostarczone:** `docs/playtest_protocol_oi105a.md` (pięć buildów ze sklepów
z cenami 252–1270 g, siedem testów z kryteriami PASS/FAIL, tabela do wypełnienia
ręką) oraz sekcja pomiarowa w `docs/dev_console.md` (`player.body.speed`, trzy
mnożniki, ustawianie Siły i rang).

⛔ **`dev.obciazenie()` NIE dodane** — autor wstrzymał dokładanie hooków przed
pierwszym testem.

---

## 2026-09-15 (18) — OI-104 ZAMKNIĘTE (review autora)

⛔ **ZERO zmian w kodzie.** Sesja domykająca: review, akceptacja, status.

**Autor zaakceptował kształt naprawy `lightLoadBonus`** — i to jest jedyna
rzecz, która wymagała jego zdania, bo `OI-103` nie mówiła nic o szansie uniku.
Zatwierdzone wprost:

- ciągła zależność od **masy bezwzględnej** przez `speedMultiplier`,
- ⛔ **zero zależności od Siły**,
- ⛔ zero nowych parametrów (tylko `speedFloor`, `speedK`, `lightLoadBonus`),
- ⭐ **premia dla lekkiego zestawu przy Sile 0 jest przyjętym skutkiem
  poprawki** — stary kod dawał tam ×1,00, dzisiejszy ×1,29,
- ⭐ **wpływ rangi III na unik jest przyjętym, małym efektem** wynikającym
  z odzyskania mobilności (+0,19 pp przy 47,5 kg).

⚠ **Drugi z tych skutków dopisany do `systemy/stamina.md` §6**, bo była to
mechanika istniejąca w kodzie i nieopisana nigdzie — dokładnie ta klasa luki,
którą kontrakt każe zamykać po stronie `STAN`.

**Co pokazało review** (pomiar, nie deklaracja): przy 47,5 kg i Sile 0 → 20 →
40 → 70 wartości `speedMul 0,80`, `L 0,375`, premia `×1,1125` i dodge `4,45%`
są **identyczne we wszystkich czterech wierszach**, podczas gdy stary warunek
dawał od Siły 40 pełne `×1,30`. Konsumentów `dodgeChance` jest dwóch
(`Player.takeDamage` → `DamageResolver.rollDodge`) i **żaden panel tego nie
pokazuje**, więc zmiana nie ma powierzchni w UI.

⛔ **Nie tknięto treści decyzji `OI-103` ani `OI-96`** — na wyraźne polecenie.
⚠ Skutkiem jest to, że ich nagłówki maszynowe (`otwarte:`) oraz nagłówek
`audyt_obciazenia_kalibracja_2026-09-15.md` **nadal wymieniają `OI-104`**.
Rejestr (`docs/zadania.md`) jest kanoniczną listą otwartych spraw i mówi
prawdę; odświeżenie tamtych trzech pól to jedno zdanie autora.

**Status:** `OI-104` → ZAMKNIĘTE. Rejestr: AKTYWNE 91 → **90**, IMPLEMENTATION
13 → **12**, ZAMKNIĘTE 11 → **12**.

**Następny krok: `OI-105`** — playtest parametrów STARTOWYCH na katalogu
realnie osiągalnym (do **59,5 kg**: 47,5 na sobie + 12 w schowanym zestawie).
⛔ Nie rozpoczęty w tej sesji.

---

## 2026-09-15 (17) — OI-104: finalizacja i walidacja

**Cofnięte w tej samej sesji:** `ArmorTraining.setRank()` i `offer()` —
napisane jako wygoda konsoli, ale **poza zakresem `OI-104`**. Decyzja autora:
zaparkować, nie dowozić. Pomysł stoi w `docs/odlozone.md` §1 z warunkiem
powrotu (sesja `OI-105` albo wpięcie treningu do trenera razem z `OI-46`).
`docs/dev_console.md` opisuje **wyłącznie to, co istnieje**: `rank`, `next`,
`canAfford()`, `learn()`, `reset()` plus trzy mnożniki do pomiaru.

⚠ **Render w panelu przeglądarki NIE WSTAJE** — `Framebuffer status: Incomplete
Attachment` leci z inicjalizacji renderera Phasera, **przed pierwszą sceną**
(`renderer.type = 2`, canvas 1280×720, `MAX_TEXTURE_SIZE` 16384, więc to nie
rozmiar). `npm run build` przechodzi. To ograniczenie środowiska, nie kodu —
**kontrola pikseli pozostaje NIEWYKONANA i jest jedyną luką walidacji.**

**W zamian: pełna sonda runtime na PRAWDZIWYCH modułach** (esbuild + stub
Phasera; stub musiał nauczyć się `on(e, fn, ctx)`, bo listenery klas polegają
na `this` — bez tego `Save.load` wywracał się na `TrackedQuest`).

| zestaw | kg | chód | sprint | regen | unik | dodge |
|---|---|---|---|---|---|---|
| skóra + miecz + puklerz | 12,0 | **148,03** | 236,84 | 2,941 | 15,68 | 5,15% |
| mieszany | 30,5 | **131,96** | 211,14 | 2,490 | 28,16 | 4,75% |
| stal + topór + tarcza | 40,0 | **125,00** | 200,00 | 2,308 | 34,57 | 4,58% |
| MAKS osiągalny | 47,5 | **120,00** | 192,00 | 2,182 | 39,64 | 4,45% |

⭐ **Wszystkie cztery trafiają w kalibrację co do setnej.** Przecięcie z Szarym
liczone na 30,5 kg = 132 px/s wychodzi w runtime **131,96** — próg wypada
dokładnie tam, gdzie go policzono.

⭐⭐ **Dowód zasady, SIŁA 0 → 70 przy 47,5 kg:** udźwig 20 → 120, `ratio`
2,375 → 0,396, unik **39,64 → 15,00** (oś wysiłku wykupiona do zera) —
a **chód 120,00, regen 2,182 i dodge 4,45% nie drgnęły ani razu**.

**Trening trafia w osobne osie, po jednej na rangę:** I → regen 2,182 → 2,427
(chód i unik bez zmian) · II → unik 39,64 → 31,01 · III → chód 120 → **127,50**.

**`OI-96` zmierzone osobno dla obu slotów:** `weapon2` (młot 7 kg) 47,5 → 54,5
kg i 120 → 115,68 px/s; `offhand2` (tarcza 5 kg) → 52,5 kg i 116,88; oba → 59,5
kg i 112,78. **Każdy slot liczy pełną masę.**

**Tooltip:** `isWorn` zwraca `true` dla egzemplarza w `weapon2`, `true` dla
czynnego, `false` dla luźnego z plecaka — podwójne naliczenie zamknięte.

**Sprint:** `sprint/chód = 1,600` przy każdej masie, `sprintSpeedMultiplier`
nietknięty, a w `EQUIPMENT_LOAD` jest **zero** kluczy ze sprintem — kanał ruchu
jest jeden.

**Zapis:** `Save.save` zapisał `armorTraining: 2` przy `version: 3`; po
`reset()` → 0, po `Save.load` → 2. **Stary zapis BEZ pola wczytał się
poprawnie** (ranga 0, reszta postępu nietknięta) — reguła addytywna działa.

**Scope check:** `defenseK`, `sprintSpeedMultiplier` i `SAVE_VERSION` pojawiają
się w diffie **wyłącznie w komentarzach**; wartości w kodzie to nadal 50, 1.6
i 3. Zero zmian w `ARMOR_PROFILE`, `QUALITY`, `SHIELD`, `blockStaminaCost`,
`ARMOR_LAYERS`, `ITEM_SETS`.

**Checki:** `tsc` ✅ · `build` ✅ · `doc_check` 0 błędów (32 ostrzeżenia — +1 to
`dev_console.md` 17,3 KB na progu 80%) · **18 przymiarów** ✅ ·
`obciazenie_przymiar` 25 reguł ✅ · `--sabotaz` **11/11** ✅.

---

## 2026-09-15 (16) — OI-104: MODEL D WDROŻONY

⚙ **Pierwsza zmiana w `src/` w tym wątku.** Obciążenie ma od dziś **trzy kanały
na dwóch osiach**, zgodnie z zamrożoną decyzją. ⛔ Ani jeden parametr startowy
nie został ruszony przy wdrożeniu.

**Co weszło do kodu:**

| kanał | gdzie | oś |
|---|---|---|
| prędkość ruchu | `Equipment.speedMultiplier` → `Player.speedMultiplier` | `kg` |
| regeneracja staminy | `Equipment.regenMultiplier` → `Stamina.tick` | `kg` |
| koszt uniku i sprintu | `Equipment.loadMultiplier` (ciągły, bez sufitu) | `ratio` |
| premia do szansy uniku | `Progression.dodgeChance` | `kg` |

`equippedWeight` iteruje `EQUIP_SLOTS` **+ `STOW_SLOTS`** (`OI-96`), udźwig
dostał malejący przyrost powyżej Siły 20, a `EQUIPMENT_LOAD.multiplier` (tabela
trzech klas) **zniknął** — etykiety zostały, progi kary nie.

⭐ **Nowy singleton `core/ArmorTraining.ts`** — trzy rangi 1+2+3 pkt, ulgi
30% / 35% / 25%, zapis jako **pole opcjonalne `armorTraining`** bez podbijania
`SAVE_VERSION`. ⛔ **Trener go nie sprzedaje i to jest świadome**: cena w złocie
należy do otwartego `OI-46`, więc rangi kupuje się dziś wyłącznie za punkty
(`dev.ArmorTraining.learn()`).

⚠ **Naprawiona INWERSJA `lightLoadBonus`.** Premia za lekkość wisiała na
`ratio`, więc pełna płyta przy Sile 50 wpadała do klasy „Lekkie" i **dostawała
premię za lekkość**. Dziś skaluje się masą bezwzględną i jest CIĄGŁA — to była
jedyna decyzja projektowa, której wdrożenie wymagało, bo decyzja `OI-103`
o dodge chance nie mówiła nic; **zgłoszona osobno w raporcie**.

⚠ **`ItemTooltip.weightLines` liczyło podmianę przez `slotForItem()`**, które
zwraca slot CZYNNY — więc od chwili, gdy `STOW_SLOTS` ważą, sztuka leżąca
w `weapon2` **nie była rozpoznawana jako noszona i podgląd doliczał jej masę
drugi raz**. Wprowadzono `Equipment.isWorn(inst)`.

**Weryfikacja runtime na PRAWDZIWYCH modułach** (esbuild + stub Phasera, bo
`EventBus` ciągnie Phasera, a panel przeglądarki nie wstaje —
`Framebuffer status: Incomplete Attachment`):

```
MAKS osiągalny 47,5 kg  → chód 120,0 px/s · regen 2,18/s · unik 39,6 (SIŁ 0)
+ schowany zestaw 59,5  → chód 112,8 px/s   ← OI-96 działa
  to samo przy SILE 70  → chód 112,8 px/s · regen 2,01/s · unik 15,0
  + trening I+II+III    → chód 122,1 px/s · regen 2,31/s
```

⭐⭐ **Wiersz trzeci jest dowodem zasady:** Siła 70 sprowadziła koszt uniku
z 47,7 do 15,0 (pełne wykupienie osi wysiłku), a **prędkość i regeneracja nie
drgnęły ani o setną**. Premia do uniku też nie wróciła (4,27% przy Sile 0
i przy Sile 70).

**Przymiar przepięty na odczyt z konfigu.** Reguła `W1` zaświeciła dokładnie
w dniu wdrożenia, tak jak była zaprojektowana, i kazała skasować lokalny blok
parametrów. Doszły cztery **strażniki wpięcia** (`K1`–`K4`) na tekście źródeł —
wzorzec czystości z `combat_regresja.mjs`.

⚠ **Autotest `--sabotaz` złapał WŁASNĄ wadę strażników.** Pierwsza wersja `K1`
brała „nagłówek + 900 znaków" i wchodziła w sąsiednią metodę, więc znajdowała
`STOW_SLOTS` w `isWorn()` **mimo wyciętej pętli w `equippedWeight`** — świeciła
na zielono nad zepsutym kodem. Ekstrakcja ciała idzie dziś po parze klamr.
Sabotaży: **11, wszystkie wykryte.**

**Dwa przymiary wymagały aktualizacji, bo pytały o nieistniejącą już tabelę:**
`stamina_weryfikacja` (§6 i scenariusz „ciężki") oraz
`attack_resolver_weryfikacja` (§4 — pytanie było na dodatek ŹLE POSTAWIONE, bo
sprawdzało klasę wiszącą na `ratio`).

**Zamknięte przy okazji:** `OI-17` (ile mechanik dotyka obciążenie — odpowiedź:
cztery kanały) i `OI-48` (czy prędkość reaguje na obciążenie — odpowiedź: tak).

**Checki:** `tsc --noEmit` ✅ · `npm run build` ✅ · `doc_check` **0 błędów** ·
**15 przymiarów regresji** ✅ · `obciazenie_przymiar` 25 reguł ✅ ·
`--sabotaz` 11/11 ✅.

⛔ **Niezrobione świadomie:** dev-balast dla `OI-105` (autor wyłączył z zakresu —
`OI-105` ma najpierw przetestować katalog osiągalny, czyli do 59,5 kg).

---

## 2026-09-15 (15) — OI-96 ZAMKNIĘTE: schowany zestaw waży 100% masy

⛔ **ZERO zmian w `src/`.** Jedna decyzja + wpięcia.

**Rozstrzygnięte (decyzja autora):** `weapon2` i `offhand2` liczą się do
obciążenia **w pełnej masie**, tak samo jak sprzęt noszony. ⛔ Bez
`stowedWeightFactor = 0,5`, ⛔ bez wyjątku dla pary schowanej.
**Uzasadnienie:** schowany zestaw jest NA POSTACI i jest częścią wyposażenia —
przy Modelu D, gdzie masa steruje ruchem i zmęczeniem, nie może ważyć zera.

⭐ **To spłata długu, który kod sam nazwał.** Komentarz przy `STOW_SLOTS`
w `Equipment.ts` brzmi od początku: *„To, że schowana broń nie WAŻY, jest
DŁUGIEM, a nie tezą"* i podaje spłatę — *„jedna pętla po `STOW_SLOTS`
w `equippedWeight`"*. Odroczenie miało warunek („obciążenie jest niestrojone"),
a ten warunek zniknął razem z `OI-103`.

⛔ **PLECAK BEZ ZMIAN** — przedmiot w torbie nadal waży zero
(`docs/inventory_scroll_ux.md` §3). To osobna decyzja i nie została ruszona.
⚠ Wynikająca z tego asymetria (zapasowy młot w plecaku tańszy niż w `weapon2`)
jest **nazwana w decyzji §3**, żeby nie wróciła za trzy sesje jako „znalazłem błąd".

⛔ **Model D nietknięty** — `speedK`, `regenK`, `effortFreeRatio`,
`effortPerRatio`, podłogi, soft cap Siły 20 i trening 1+2+3 bez zmian.
`OI-103` zostaje zamknięte jako **„Model D — dwie osie, parametry STARTOWE do
playtestu"**.

**Zmierzone skutki:** schowany zestaw kosztuje **2–11 px/s** zależnie od pary
i bazy; potrafi przenieść build przez próg fauny (25 kg + topór i tarcza:
136 → 130 px/s, traci Szarego). ⭐ **Zamiana zestawów zostaje neutralna masowo** —
`swapWeaponSet()` wymienia zawartość par, więc suma się nie zmienia i zamiana
w panelu nigdy nie przeskoczy klasy obciążenia.

⚠ **Znalezione przy pisaniu decyzji, do naprawy w `OI-104`:**
`ItemTooltip.weightLines` liczy podmianę przez `Equipment.slotForItem()`, które
zwraca **slot CZYNNY**. Po zmianie sztuka leżąca już w `weapon2` nie zostanie
rozpoznana jako noszona i **podgląd doliczy jej masę drugi raz**. Dwa komentarze
(`Equipment.ts` przy `STOW_SLOTS`, `GameConfig.ts:5671` przy torbach) zaczną
wtedy kłamać o kodzie.

**Dokumenty:** nowa `docs/decyzje/2026-09-15-masa-schowanego-zestawu.md`
(`DECYZJA`, `moc: ACTIVE`). Zaktualizowane: `zadania.md` (OI-96 → ZAMKNIĘTE,
DESIGN 52→51), `README.md`, `CLAUDE.md` (router), oraz — wyłącznie o status
`OI-96` — `decyzje/2026-09-15-obciazenie-dwie-osie.md`, której §7 zostawiła
tę sprawę świadomie otwartą.

`node tools/doc_check.mjs`: **0 błędów**. `OI-104` bez blokerów.

---

## 2026-09-15 (14) — OI-103 ZAMKNIĘTE: Model D, dwie osie obciążenia

⛔ **ZERO zmian w `src/`.** Decyzja + audyt kalibracyjny + przymiar.

**Rozstrzygnięte (`OI-103`, przy okazji `OI-101`):** obciążenie rozpada się na
**trzy kanały wiszące na DWÓCH osiach** — `kg` (bezwzględna) steruje
**prędkością ruchu** i **regeneracją staminy**, `ratio` (względna) steruje
**kosztem uniku i sprintu**. ⭐⭐ Zasada nadrzędna, która wszystko tu generuje:
**Siła może kompensować względny WYSIŁEK, ale nie kompensuje bezwzględnej MASY.**

⭐ **Koszt zamachu NIETKNIĘTY** — burst ciężkiego wojownika zostaje identyczny,
gorsza jest wyłącznie wydolność. To była jawna prośba autora („kilka pierwszych
ciosów") i to ona wyrzuciła kanał tempa ataku z Modelu C.

**Co obaliło poprzednią rekomendację.** Model C (rekomendacja audytu 09-14)
wiesza wszystkie kanały na `ratio`. Zmierzone: **60 kg przy Sile 40 daje ratio
0,50, czyli ruch ×1,00 — pełna płyta całkowicie za darmo**. Model C powstał,
zanim postawiono zasadę wyżej. ⛔ Nie wracać do A/B/C ani do osi liniowej
(ta nie przeszła kalibracji: nie da się mieć darmowego progu dla strzelca
i trafić obu przecięć z fauną naraz).

**Dlaczego `speedK = 150`, a nie gust.** Wymuszony z DWÓCH stron przez
`chaseSpeed` z konfigu: niżej (100–120) skoczek 96 wchodzi w katalog i łamie
niezmiennik „odejście zawsze działa"; wyżej (180–220) wataha 115 przestaje
łapać 62 kg i ekstremum przestaje kosztować. Przecięcia lądują na
**30,5 kg (Szary 132)** i **55,7 kg (wataha 115)**.

⚠⚠ **Parametry są STARTOWE, nie systemowe** — zapisane wprost w decyzji §3.
Zmiana `speedK` po playteście **nie wymaga nowej decyzji**; zmiana architektury
z §2 wymaga. Playtest dostał własny numer (`OI-105`): 62 kg · 75,5 kg ·
75,5 kg + ranga III · relacje do 115 i 132.

**Trening: trzy rangi 1+2+3 = 6 pkt** — dokładnie tyle, co pełne Mastery I–IV
na jedną rodzinę broni. ⛔ **15 pkt odrzucone twardo**: budżet życiowy postaci
to **49 pkt** (`skillPointsPerLevel: 1`), a całe drzewo 11 umiejętności kosztuje
14 — piętnaście punktów to 107% ceny wszystkich umiejętności w grze.
⭐ Ranga III kupuje **PRÓG, nie procent**: 62 kg wraca ponad watahę (111 → 121),
a 40 kg **nadal nie dogania Szarego** (125 → 131 przy 132) — to wyszło z liczb,
nie z wyjątku.

⚠ **Znalezione przy okazji: INWERSJA na uniku.** `Progression.ts:444` daje
`lightLoadBonus ×1,3` każdemu w klasie „Lekkie" — czyli przy Sile 50 **postać
w 75,5 kg pełnej płyty dostaje premię „za lekkość"**. Do naprawy razem
z wdrożeniem (`OI-104`).

**`weapon2`/`offhand2`:** rekomendacja **PEŁNEJ MASY** (zero nowych stałych;
komentarz w `Equipment.ts` sam nazywa to długiem i podaje spłatę — „jedna pętla
po `STOW_SLOTS`"). ⛔ **Decyzja NIEPODJĘTA na wyraźne polecenie autora**,
`OI-96` zostaje otwarte. Zmierzony koszt: 2–11 px/s; potrafi przenieść build
przez próg fauny. Nazwana asymetria: **plecak nadal waży zero**.

⛔ **Ceny złota rang treningu ZOSTAJĄ OTWARTE** — 400/1200/2500 g to szkic bez
kotwicy, ekonomia należy do `OI-46`. Świadomie nie zamknięte w tej decyzji.

**Przymiar:** `tools/obciazenie_przymiar.mjs` — 25 kryteriów, wszystkie zielone.
⭐ **Autotest `--sabotaz` sprawdza, że umie zaświecić na czerwono**: siedem
sabotaży (przyspieszony skoczek, `speedK` 100 i 220, zmieniona prędkość gracza,
trening za 15 pkt, trening zdejmujący 100% kary, oś wysiłku z sufitem) — każdy
wykryty. Reguła `W1` zaświeci w dniu wdrożenia i każe przepiąć przymiar na
odczyt z `EQUIPMENT_LOAD`.

**Dokumenty:** nowe `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` (`DECYZJA`,
`moc: ACTIVE`) i `docs/audyt_obciazenia_kalibracja_2026-09-15.md` (`HISTORIA`,
pełne tabele + wrażliwość). Zaktualizowane: `zadania.md` (OI-103/OI-101 →
ZAMKNIĘTE, nowe OI-104/OI-105, OI-96 przepięte), `README.md`,
`ekwipunek_checkpoint.md` (OI-103 przestało blokować OI-98),
`tarcze_checkpoint.md`.

⚠ **Czego ta decyzja NIE zamyka:** pytania „czy warstwowanie jest OP".
`eHP ×4,00` przy 62 kg pochodzi z PP, nie z masy — żadna kara mobilności tego
nie spłaca. Zostaje w `OI-98` i `tarcze_checkpoint.md` §1.10.

`node tools/doc_check.mjs`: **0 błędów**.

---

## 2026-09-15 (13) — Roadmapa etapów: wyposażenie → wojownik → strzelec → mag

⛔ **ZERO zmian w `src/`, zero zmian mechaniki i balansu.** Sesja wyłącznie
dokumentacyjna, na wyraźne polecenie autora: **zapisać KIERUNEK, nie wykonać
go**.

**Nowy dokument:** `docs/roadmap.md` (`OPERACYJNE`, domena `proces`).
Łańcuch: **pancerz → broń (wręcz) → tarcze → domknięty wojownik → łuk/kusza/
oszczep → strzelec → hybryda wojownik+strzelec → łowca → mag → kapłan/paladyn**.

**Horyzonty przeliczone na daty bezwzględne** (autor podał względne):
mag **nie wcześniej niż ~2026-11-15** (min. ~2 miesiące), kapłan i paladyn
**~2026-12-15 … 2027-01-15 lub później**.

**Kierunek warstw zapisany jako intencja, nie liczby:** `L1` bez wpływu
negatywnego · `L2` brak albo minimalny · `L3` mały, ale realny koszt.
⭐ Trzy warstwy na wielu częściach ciała mają być odczuwalne **przede wszystkim
przez łączną masę/obciążenie**. ⚠ Nie zakładamy, że gracz zapełnia wszystkie
**12 adresów warstwowych**. ⚠⚠ **Warstwa to fizyczne MIEJSCE, nie poziom
jakości.**

⚠ **Rozjazd nazwany wprost, nie przemilczany:** indeks wskazywał
`tarcze_checkpoint.md` jako bieżący punkt wejścia **całego projektu**, a
roadmapa stawia tarcze **za** pancerzem i bronią. Checkpoint tarcz **nie jest
unieważniony** — zostaje punktem wejścia swojego wątku; zmienia się tylko,
kiedy ten wątek jest na warsztacie. `P1` (pomiar kątów) jest niezależny od
kolejności.

**Mag — dwie rzeczy do zapamiętania.** Historyczna oś rang szat
`Adepta → Mag → Mistrz → Arcymistrz` zostaje jako **potencjalna przyszła oś
progresji szat**; ⛔ **nie jest tym samym co `L1 → L2 → L3`** (szata może być
`L1` przy dowolnej randze) i ⛔ **nie wolno jej dziś używać jako argumentu
w balansie warstw**. ⚠ „Arcymistrzowska" jest przy tym **siódmym poziomem
JAKOŚCI WYKONANIA** — trzecia, niezwiązana oś; nie mylić.

⚠ **Grafik szat nie ma w repo** — przeszukanie (`docs/`, `public/assets/`,
nazwy `*szat*`, `*robe*`, `*mag*`, `*adept*`) nic nie znalazło. To materiał
autora spoza repozytorium; zapisane w `roadmap.md` §9, **żeby następna sesja
nie szukała pliku, którego tu nie ma**.

**Wpięcia (żeby dokument nie osierociał):** wiersz w `docs/README.md` (tabela
`OPERACYJNE` + dwa wiersze routingu), wiersz w routerze `CLAUDE.md`, dwa wpisy
parkingowe w `docs/odlozone.md` §3 (mag · kapłan/paladyn) i **jedna barierka
w §5: ⛔ żadnych blokad klasowych ani wyjątków „pod maga/kapłana/paladyna"
na zapas**.

**Przymiar:** `node tools/doc_check.mjs` — **0 błędów** (bez zmian względem
stanu sprzed sesji).

---

## 2026-09-15 (12) — Decyzja: zapis warstw pancerza (płaska kotwica + `layers?`)

⛔ **ZERO zmian w `src/`.** Nowy dokument:
`docs/decyzje/2026-09-15-zapis-warstw-pancerza.md` (`DECYZJA`, `moc: ACTIVE`).

**Rozstrzygnięte:** warstwy wchodzą do zapisu jako **opcjonalna mapa `layers?`**
(cztery klucze: `head`/`chest`/`legs`/`boots`; warstwy nazwane `L1`/`L2`/`L3`,
⛔ nie tablica). `layers[area]` ma pierwszeństwo; brak → fallback do płaskiego
slotu i wyprowadzenie warstwy przez `itemLayer()`. ⛔ `SAVE_VERSION` **bez
zmian**. `offhand`, `weapon`, `stowed` i ręce **poza mapą**.

**Kotwica = najbardziej ZEWNĘTRZNA warstwa** (L3 → L2 → L1), decyzja autora.
⛔ Nie „najwyższe PP" — PP nie może definiować semantyki zapisu, a reguła nie
może zależeć od balansu.

⛔⛔ **Odrzucono pierwotny kierunek „slot = L2".** Dzisiejszy slot **nie trzyma
L2** — trzyma to, co gracz nosi, a `itemLayer()` wyprowadza warstwę z materiału
(`metal` → L3). Przyjęcie tamtego przeklasyfikowałoby **kirys na podkład** i
pozwoliło dołożyć drugi L3 — bez błędu i bez śladu.

⚠ **Downgrade do starego builda jest STRATNY** i jest to jawnie przyjęte: stary
build zobaczy tylko kotwicę i przy swoim zapisie zgubi pozostałe warstwy.
⛔ Świadomie nie budujemy mechanizmu zachowującego nieznane pola.

⚠ Nazwany przy okazji dług: **`itemLayer("ironbound_shield")` zwraca dziś L3**,
choć `offhand` nie jest obszarem warstwowanym.

---

## 2026-09-15 (11) — Scope PP pancerza (~30) + audyt agregacji warstw

⛔ **ZERO zmian w `src/`.** Zapis: checkpoint §1.10.

**Decyzja autora:** ~30 PP to **górny zakres pojedynczej, obecnie osiągalnej
warstwy** — nie wartość domyślna. ⭐ **Scope RATYFIKUJE dzisiejszy stan, nie
podnosi go**: najcięższa sztuka to **kirys 28 PP**.

⚠ **Zweryfikowana dostępność jakości** (warunek autora — wykluczyć niedostępne):
Q1–Q2 półka wiejska · Q3 domyślna/quest · **Q4 półka miejska = realny sufit** ·
Q5 tylko jedna nagroda-żart (`stick`) · Q6–Q7 nieosiągalne.
⚠ `QUALITY.shopMaxLevel: 4` **nie ma konsumenta w kodzie** — realny sufit
wyznacza `stockQuality` per NPC.

⭐⭐ **Najważniejsze: nasycenie NIE jest problemem przyszłych jakości.** Pełny
stos 12 sztuk przekracza punkt nasycenia (150 PP) na **CIĘTYM już przy Q1** —
najniższej jakości z wiejskiej półki (186 PP, **+36 wyrzucane**). Przy Q4
przekracza też liczba bez typu (155, +5). ⇒ **Wykluczenie Q5–Q7 niczego nie
zmienia** — sufit wiąże w całości wewnątrz obecnie dostępnego świata.

**Audyt D2/D3 — co JEST rozstrzygnięte:** sumowanie liniowe · jedna krzywa ·
profil materiału per sztuka · `requires` per przedmiot (D1) · `set ⊥ layer` (D4) ·
trzy pętle do przerobienia (D3) · legalne wszystkie kombinacje warstw.

⚠ **Czego D2/D3 NIE rozstrzygają — pięć luk:**
1. ⚠⚠ **ZAPIS.** `Save.equipment` trzyma **jeden egzemplarz na slot**;
   warstwowanie zmienia KSZTAŁT, a reguła brzmi „zmiana kształtu → podbij
   `SAVE_VERSION` → zapis odrzucony". **D3 nazwał trzy pętle, nie nazwał
   zapisu.** ⭐ Istnieje droga **addytywna** bez kasowania postaci: slot zostaje
   nośnikiem L2, a `layers?` wchodzi jako pole opcjonalne — tą samą drogą co
   `quickSlot`, pierścienie i `stowed`.
2. `setProgressFor` liczy **elementy**, nie sloty → próg „4 sztuki" spełni jeden
   obszar ciała w trzech warstwach. D4 to zauważył, nie rozstrzygnął.
3. `EquipmentSnapshot` też jest „jeden na slot".
4. `slotForItem`/`accepts`/`equipFromBag` rozstrzygają slot, nie slot+warstwę.
5. Model nie jest jednorodny — ręce mają jedną warstwę; maksimum to 13 sztuk.

⛔ Dopóki 1–5 nie są rozstrzygnięte, „pełny stos" pozostaje `PROJECTION`.
Kolejność: **agregacja → cap/krzywa → PP tarcz.**

---

## 2026-09-15 (10) — Audyt skali PP i capu: sufit wiąże PER TYP, nie globalnie

⛔ **ZERO zmian `d/(d+50)`, capu, wartości pancerzy i PP tarcz.** Ustalanie PP
tarcz **wstrzymane**. Zapis: checkpoint §1.9.

**Sumowanie warstw to DECYZJA, nie moje założenie** — `D2` taksonomii
(`moc: ACTIVE`) policzył stosy i orzekł „krzywa nietknięta", a `D3` nazwał
skutek implementacyjny („trzy pętle muszą iterować warstwy"). ⛔ Ale **nie jest
zaimplementowane**: wszyscy konsumenci `ArmorLayers` siedzą w `ui/`, zero
w `core/`; `armorPieces()` iteruje sloty. Dlatego 148 PP to `PROJECTION`.

⚠⚠ **KOREKTA do mojego poprzedniego raportu.** „Przy pełnym stosie PP tarczy
nie robi NIC" liczyłem **bez typu obrażeń** i przeszacowałem problem. Bez typu
stos siedzi na **74,7%** — 0,3 pp pod sufitem, nie na nim. `D2` doszedł do tego
pierwszy („liczba bez typu to 74,0%"); ten audyt go **odtwarza**.

⭐⭐ **Prawdziwe znalezisko: sufit wiąże PER TYP.** Cięte **219 PP → 81,4%
surowo, ucięte do 75%** — stos przekracza punkt nasycenia o **~69 PP**, i cały
ten nadmiar jest wyrzucany. Kłute 71,1%, obuchowe 63,5% — obie z zapasem.

**Krzywa:** sufit osiągany **dokładnie przy 150 PP**; 1 PP wart 1,96 pp przy
zerze, 0,50 przy 50, 0,22 przy 100, **0,00 przy 150**. Do 50% trzeba 50 PP,
do 70% — 117, do 75% — 150.

⛔ **Konsekwencja dla otwartości:** każdy przyszły materiał, poziom jakości
i dodatkowa warstwa ląduje **na cięciu w obszarze wyrzucanym**, a bez typu
w paśmie 2 PP. **To nie jest problem tarczy — to sufit systemu ochrony
osiągany przez sam pancerz.** Decyzja dotyka `OI-24`, `D2` i `OI-98`.

---

## 2026-09-15 (9) — Model ochrony tarczy: decyzja + audyt (pipeline JUŻ go realizuje)

⛔ **ZERO zmian w `src/`.** Audyt read-only + zapis decyzji w checkpointcie §1.8.

**Decyzja autora:** tarcza ma dwa niezależne poziomy — pasywny PP (z każdej
strony) i aktywny `block.reduction` (tylko w strefie gardy). ⛔ PP **nie jest**
nośnikiem progresji: różnice materiału i jakości idą poza PP.

⭐ **Audyt: pipeline JUŻ to realizuje, zero zmian potrzebnych.** Zweryfikowane
zachowaniem (cios 20, okuta Q3): od tyłu **20 → 17** (`hit`, samo PP), z boku
**→ 13** (`block`), z frontu **→ 9** (`block`). PP wchodzi przez
`armorPieces()` (filtr `type === "armor"`, `offhand` jest w `EQUIP_SLOTS`), więc
działa z każdej strony automatycznie; blok jest bramkowany strefą w resolverze.

⭐⭐ **Krzywa potwierdza decyzję liczbowo.** Tarcza okuta dokłada **+13,79 pp**
na gołej postaci i **+2,93 pp** w pełnej stali; krok co jeden punkt przy małych
wartościach to ~1,9 pp. **PP jest jednocześnie za czułe na gołym i prawie
martwe w stali** — więc nie nadaje się na nośnik
`konstrukcja × materiał × jakość × wariant`.

⚠ **„Floor" PP nie istnieje jako mechanizm.** `instanceDefense` to
`base × (1+qualityMul) × conditionMul` bez zaokrąglenia; niezerowość jest
skutkiem mnożenia dodatnich liczb, nie gwarancją. Zmierzone: puklerz Q1 3,40 PP,
rozbity 1,70 PP. Przy `defense: 0` byłoby zero.

⚠ **Znaleziona niespójność:** `ItemTooltip.ts:398` liczy blok **bez
`conditionMul`** — `blockSpec` dostało stan w `T-5`, tooltip nie. **Rozbita
tarcza pokazuje pełny procent bloku.** Naprawa to jedno mnożenie; nie wykonana,
bo audyt read-only.

✅ Potwierdzone: **nie ma drugiego miejsca** traktującego `block.reduction` jako
ochronę pasywną (trzej konsumenci: `blockSpec` producent, `Player` → resolver,
tooltip → wyświetlanie). Zużycie nadal wisi na **aktywnym bloku**, nie na
posiadaniu tarczy.

---

## 2026-09-15 (8) — Weryfikacja hipotezy o mikrozużyciu: ⛔ NIE ISTNIEJE

⛔ **ZERO zmian w `src/`.** Trzy asercje w jednym zamku (111 → 114).

**Sprawdzana hipoteza:** *trwałość może być konsumowana także przez
mikrozużycie związane z redukcją pancerza, co X ciosów.*
## ⛔ **Taki mechanizm nie istnieje.**

To nie jest „nie znalazłem" — to wyczerpujące wyliczenie po całym `src/`:
jedyne odjęcie trwałości to `Quality.applyWear`; jedynym wołającym jest
`Equipment` (`wearWeapon`, `wearShield`); pole `durability` mutuje wyłącznie
`Quality.ts` w czterech miejscach (tworzenie, sanityzacja zapisu, zużycie,
naprawa); ścieżka mitygacji (`Protection`, `DamageResolver`) **nie ma ani
jednego odwołania do trwałości** — jedyna wzmianka to komentarz o *„a **future**
durability multiplier"*. W `EQUIPMENT.durability` są cztery pokrętła
(`wearChance`, `wearAmount`, `destroyedMultiplier`, `repairPriceFraction`)
i **żadnego „co X ciosów"**.

⚠ **Kto w ogóle ma trwałość: 13 przedmiotów — 11 broni + 2 tarcze.**
⛔ **30 z 32 sztuk pancerza nie ma pola `durability`** i nie zużywa się nigdy.
`Quality.ts` mówi to wprost: *„armour durability is deliberately out of scope
for this pass"*.

⭐ **Konsekwencja dla bashu:** wariant „mikrozużycie jak kontakt/mitygacja"
**nie ma nośnika** — to nie wybór między istniejącymi modelami, tylko
zbudowanie **drugiego kanału zużycia od zera**, z decyzją, czy obejmuje też
30 sztuk pancerza.

**Zamek §D13** (jedyny dodany, trzy asercje, skan całego `src/`): `applyWear`
wołane tylko z `Equipment` · `durability` mutowane tylko w `Quality.ts` ·
ścieżka mitygacji nie dotyka trwałości. Sabotaż — wstawienie słowa `durability`
do `Protection.mitigate` — zapalił trzecią natychmiast.

⚠ **Pierwsza wersja zamka świeciła na czerwono bez powodu:** regex liczył
DEFINICJĘ `applyWear` w `Quality.ts` jako wywołanie. Ten sam błąd co przy
komentarzach w `T-3` — asercja tekstowa musi odróżniać deklarację od użycia.

⛔ Decyzja o modelu zużycia bashu (A/B/C/D) nadal należy do autora.

---

## 2026-09-15 (7) — `S10`: audyt zużycia tarczy przy bashu (decyzja otwarta)

⛔ **ZERO zmian w `src/`.** Jeden nowy zamek (110 → 111) i zapis audytu
w checkpointcie.

**Czy bash zużywa tarczę: ⛔ NIE.** `wearShield()` ma w całym `src/` **jedno**
wywołanie — `Player.ts:1398`, w `if (zablokowano)`. Ścieżka bashu go nie dotyka.

⚠ **Ale `wearsWeapon: false` NIE jest martwą deklaracją** — `GameScene:4127`
czyta je i dzięki niemu bash nie zużywa **oręża**. Komentarz *„zużywa się to,
czym się uderza — a uderza tarcza"* jest **zaimplementowany w połowie**:
✅ negatywnej, ⛔ pozytywnej.

⚠⚠ **Znalezisko, które przesądza o sposobie wdrożenia:** przestawienie flagi na
`true` **nic by nie dało** — `wearWeapon("offhand")` czyta `offhandWeapon`,
a ten zwraca `null` dla wszystkiego, co nie jest bronią. **Kanał zużycia broni
jest dla tarczy strukturalnie zamknięty.** Zamek §S11 sprawdza to
ZACHOWANIEM; po sabotażu (otwarcie kanału) zaświecił i pokazał `trwałość
50 → 49`.

**Bash realnie pudłuje** — `pendingSwing` rozstrzyga się 180 ms po naciśnięciu
z **ponownym testem zasięgu**, a koszt i cooldown są już zapłacone. Więc
„sukces" ma dwa sensy i **oba mają konsekwencje**: wykonanie (spójne z bronią,
która zużywa się na STARCIE zamachu, nawet przerwanego Unikiem) albo trafienie
(spójne z blokiem, czyli z jedynym dzisiejszym zużyciem tarczy). Pełne
zestawienie z miejscami wdrożenia: `docs/tarcze_checkpoint.md`.

⚠ **To nie jest różnica bez wagi balansowej**, wbrew pierwszemu wrażeniu: blok
przy 2 ciosach/walkę to 0,30 pkt, bash (cooldown 10 s) dołożyłby do 0,15 —
czyli **+25…+50% do tempa zużycia tarczy**.

⛔ Decyzja autora. Kod nietknięty.

---

## 2026-09-15 (6) — `T-4`: audyt → zasada SPEŁNIONA, część 2 ZABLOKOWANA

⛔ **ZERO zmian w `src/`** (`git diff --stat -- src/` puste). Doszło 10 zamków
w przymiarze (100 → 110) i zapis audytu w checkpointcie §4.1.

**Co audyt ustalił.** Zasada `T-4` — *źródłem prawdy jest `blockSpec`, nie lista
nazw* — **jest już spełniona**: bramka czyta `Equipment.blockSpec`
(`GameScene.ts:4346`), `requiresShield` jest **jedyną** bramką sprzętową
w `ABILITIES`, a w całym łańcuchu bashu (`shieldStrike` + `AbilitySpec` case +
`PLAYER_ACTIONS`) **nie ma ani jednego identyfikatora tarczy**.

⛔ **Część 2 — profil bashu per konstrukcja — wymaga elementu, którego
architektura nie ma.** `BlockSpec` ma trzy pola i żadnego profilu bashu;
checkpoint §1.2 wymienia „profil bashu" jako część `Construction`, ale **jego
kształtu nikt nie zdefiniował**.

⚠⚠ **I nie da się go wypełnić dowolnie — każdy z trzech kandydatów koliduje
z czymś rozstrzygniętym:** `stunMs 700` jest skalibrowane na „dokładnie jeden
darmowy cios każdą z dziewięciu broni" (900 daje 1 albo 2 zależnie od broni,
marginesem **5 ms**) · `damageMultiplier` ma twardą barierę poniżej 1,0 ·
`windupMs` niesie tożsamość („najszybsza zobowiązująca akcja w grze").
⭐ **Nie ma wolnego parametru** — rozdzielenie Legionowej wymaga decyzji, który
koszt przyjąć. Zatrzymałem się zgodnie z regułą: zgłosić brak, nie wymyślać go.

**Zamki §S (10).** Rdzeń `T-4`: ⛔⛔ żaden identyfikator tarczy w łańcuchu bashu ·
bramka pyta o zdolność · `requiresShield` unikalne · zasięg z BRONI · `damageType`
na sztywno · `staggerMs: 0` · `damageMultiplier < 1`. Plus dwa zamki gotowości
(§S8/§S9), które padną w dniu, gdy profil bashu zejdzie na konstrukcję.

⭐⭐ **Sabotaż potwierdził rdzeń.** Wstrzyknięte `Equipment.offhand?.itemId ===
"ironbound_shield"` do `shieldStrike` dało `BŁĄD S1 … ⚠ przemycone:
ironbound_shield`, a `damageMultiplier: 1.2` — `BŁĄD S7 … 1.2`. Oba nazwały
konkretny warunek. `src/` przywrócone bit-w-bit.

⏳ **Znalezisko poboczne (nie werdykt):** `PLAYER_ACTIONS.shieldBash` ma
`wearsWeapon: false` z komentarzem *„zużywa się to, czym się uderza — a uderza
tarcza"*. Po `T-5` tarcza MA trwałość, ale `wearShield()` woła **wyłącznie
ścieżka bloku** — bash jej nie zużywa. Komentarz opisuje intencję, której kod nie
realizuje. Utrwalone zamkiem §S10, do rozstrzygnięcia razem z częścią 2.

---

## 2026-09-15 (5) — `T-3`: asercja per przedmiot + `N-22` przepisane

⛔ **ZERO zmian w `src/`** — `git diff --stat -- src/` puste. `P1`, `GuardStats`,
`guardZone`, `sideArcDeg`, `T-1` nietknięte.

⚠ **`T-3` ma w checkpointcie `zależy od: T-1`, a `T-1` jest zablokowany** — więc
zrobione jest to, co stoi bez niego, a reszta jest **nazwana**, nie udawana.

**Asercja (§X, 19 zamków).** Iteruje po tym, co NAPRAWDĘ jest w `ITEMS` — nie po
katalogu kandydackim. ⛔ Asercja żądająca sześciu konstrukcji świeciłaby na
czerwono za **niewdrożenie**, czyli za stan zamierzony.
⭐ Geometryczna połowa rozwiązana **jednym resolverem `lukiDla()`**: dziś zwraca
wartości globalne, po `T-1` zacznie zwracać własne — **bez zmiany ani jednej
asercji**. Domyka to zamek **§X5**, który padnie w dniu, w którym pierwszy
przedmiot zadeklaruje własny łuk, i wymusi dokończenie `T-3`.
Poza geometrią §X sprawdza per przedmiot: N-21 (`armor`/`offhand`), `armorType`
w `ARMOR_PROFILE`, `0 < reduction < 1`, **`swingMul ≥ 1`** (tarcza SPOWALNIA —
przyspieszenie to kanał Dual Wieldu) i **redukcję przy Q7 < 100%**.

⭐⭐ **Sabotaż potwierdził, że zamki potrafią zaświecić.** Celowo zepsute dane
(`swingMul 0,95`, `reduction 0,9`, `fullArcDeg 120`) dały **7 czerwonych**, każdy
**nazywający przedmiot i złamany warunek** — np. `X1. buckler: 120° / 100°`,
`X4. ironbound_shield: 108,0%`, `X5. ⚠ buckler — zaktualizuj §X1 i N-22`.
Config przywrócony bit-w-bit.

**`N-22` przepisane.** ⚠ **Sprawdzone: NIE był niespójny po `T-5`** — `T-5` ruszył
SIŁĘ bloku (stan egzemplarza), a `N-22` mówi o WARUNKU („z której strony"), który
nadal stoi w stałych. Nowe brzmienie wypowiada podział wprost: **warunek** (kąty,
`sideMul`) → mechanika, globalny · **siła** (`reduction`) → egzemplarz: przedmiot
× jakość × **stan** · **cena** → przedmiot.
⚠ Zapisane też, że **pierwotne uzasadnienie jest martwe** („Raise Shield", o
którym ten sam plik mówi, że nie istnieje i nie jest planowany) — niezmiennik
stoi dziś na **N-25** i na wspólnym suficie z parowaniem.
⛔ **Nie napisano, że geometria jest już na przedmiocie** — nie jest.

⚠ **`shields.md` przekroczył limit `STAN` (20 KB) i wymagał odchudzenia.**
Wycięte: własna proza o łańcuchu trwałości (należy do domeny `items`, tak stoi
w §0), duplikaty tabel między §1/§4/§6 oraz **jeden akapit HISTORII** („POPRAWKA
2026-09-06: do tej daty stało tu…") — `DOC_CONTRACT` mówi wprost, że `STAN` nie
jest dziennikiem. **Fakt mechaniczny (poza ≠ root, dwa timery) został.**

---

## 2026-09-15 (4) — `T-5`: trwałość tarczy przez ISTNIEJĄCY łańcuch

Pierwszy krok implementacyjny tarcz, który **nie czekał na `P1`** — i jedyny taki.

**Cztery zmiany, wszystkie małe, zero nowego systemu:**

1. `GameConfig` — pole `durability` na obu tarczach (puklerz **50**, okuta **90**).
   ⭐ **Sama obecność pola włącza cały łańcuch**: zużycie, naprawę (także
   zbiorczą), skalowanie `QUALITY.maxDurability`, linię w tooltipie i
   `destroyedMultiplier`. `hasDurability` czyta obecność pola, **nie typ
   przedmiotu**, więc tarcze weszły do systemu **bez ani jednej gałęzi
   `if (tarcza)`**. Relacja puklerz < okuta wynika ze zdania, które od dawna
   stoi w configu przy półce Radzima: *„drewniany krążek z pasami zużywa się
   szybciej niż deski spięte żelazem"*.
2. `Quality.conditionMul` — **wyeksportowane**. Było prywatne, konsumowały je
   tylko `instanceDamage`/`instanceDefense`.
3. ⭐⭐ `Equipment.blockSpec` — **czyta `conditionMul`. To jest ZAMKNIĘCIE
   DZIURY**, nie nowa mechanika: do dziś zniszczona tarcza traciła punkty
   obrony, ale **blokowała w pełni**, czyli jedyna rzecz, po którą się ją nosi,
   była odporna na zużycie. Zmierzone w silniku: **30,0% → 15,0%**.
4. `Equipment.wearShield()` + jedno wywołanie w `Player.takeDamage` **obok
   `Stamina.spend(blockStaminaCost)`** — bo oba odpowiadają na to samo pytanie
   („co kosztowało zasłonięcie się") i oba płaci się za **faktycznie
   zablokowany cios**, nigdy za noszenie tarczy (N-27).

⚠ **Osobna metoda, nie parametr `wearWeapon`:** broń zużywa cios
**wyprowadzony**, tarcza — **przyjęty**. To dwa różne zdarzenia bojowe.

⚠ **Czas życia wychodzi DŁUGI i to jest zapisane, nie przemilczane:** przy
`wearChance 0,15` jeden punkt schodzi co ~6,7 bloków, więc 90 punktów to ~600
bloków ≈ **300 walk**. Jeśli trwałość ma być odczuwalna, strojeniem jest
`wearChance`/`wearAmount` albo te liczby — **osobna decyzja balansowa, poza
zakresem `T-5`**, którego zadaniem było działanie łańcucha.

**Przymiar: 81 zamków** (było 52). Grupa §D: brak pola → zachowanie bez zmian ·
świeża tarcza pełna · zużycie zdejmuje `wearAmount` · **stan wpływa na
`blockSpec` dokładnie przez `destroyedMultiplier`** · naprawa przywraca ·
naprawa **nie rusza jakości** · `maxDurability` skaluje istniejącą tabelą
(Q1 63 / Q3 90 / Q7 180) · stan **nie dotyka geometrii ani `sideMul`** · brak
`blockChance` · brak osobnej ścieżki naprawy.

⭐⭐ **Dwa zamki §J2 zmieniły znak i to jest dowód, że przymiar potrafi
zaświecić na czerwono:** opisywały stan „`T-5` niezrobione", padły w dniu
wdrożenia i wymusiły poprawkę. Dokładnie po to istnieją.

⚠ **Drugi raz w tej sesji czerwony był BŁĄD TESTU, nie kodu:** `makeInstance`
przyjmuje `(itemId, **qty**, quality)`, a ja podawałem jakość na drugiej
pozycji — Q3 przechodziło **przypadkiem**, bo to wartość domyślna. Wyłapał to
zamek D7, bo testuje **trzy** wartości na osi, nie jedną.

⛔ **Czego NIE zrobiono:** `guardZone` nietknięte (`T-1` czeka na `P1 → B3`),
zero `sideArcDeg` na przedmiotach, zero z 39 definicji katalogu, `QUALITY.modifiers`
nieruszane, żadnej osobnej naprawy dla tarcz.

⚠ **Dług:** `docs/ekwipunek_przedmioty.md` (`GENEROWANE`) nie zna nowych pól —
generator był nieodświeżony już wcześniej (11 bloków) i ta zmiana to pogłębia.
Cleanup świadomie odłożony przez autora.

---

## 2026-09-15 (3) — Katalog tarcz: 39 definicji, przymiar, DESIGN ZAMKNIĘTY

⛔ **Zero zmian w `src/`.** Doszły: `docs/tarcze_katalog.md`,
`tools/tarcze_przymiar.mjs`, poprawki w checkpointcie.

### Trzy rozstrzygnięcia autora, bez których katalogu NIE DAŁO SIĘ spisać

Praca zatrzymała się na zgłoszeniu konfliktów — §1.1 checkpointu przypisywał
**dwa razy „najwyższą trwałość"** (Migdałowa i Pawęż) i **dwa–trzy razy
„najszerszy łuk"**, więc twierdzenie „każda pierwsza w czym innym" nie było
spełnione, a każde przypisanie porządku wybierałoby zwycięzcę.

- **`D-T1` — trwałość to DWIE osie.** Pawęż: **bezwzględna pula**. Migdałowa:
  **trwałość względem klasy/masy**. ⛔ Żadnej jednej drabiny.
- **`D-T2` — geometria to TRZY znaczenia.** Okrągła: ochrona boczna. Rycerska:
  pełny łuk frontalny. Pawęż: fizyczne pokrycie — ⚠ **nie musi wygrywać
  `sideArcDeg`**.
- **`D-T3` — kolejność `P1 → B3 → T-1`.** Rozstrzyga sprzeczność wewnątrz
  checkpointu: §4 stawiało `T-1` jako krok 1, pipeline jako ostatni. **Wygrywa
  pipeline**; §4 poprawione.

⭐ **Dwie pary przechodzą test dominacji WYŁĄCZNIE dzięki tym decyzjom:**
Migdałowa ↔ Pawęż dzięki `D-T1`, Legionowa ↔ Pawęż dzięki `D-T2`.

### Katalog

**39 definicji** (6 konstrukcji × materiały × warianty), przeliczone niezależnie
i **zgodne co do jednego** z „etap 4 → 39" w checkpointcie. Dominacja sprawdzona
na **15/15 parach**. Rozdział ról: Legionowa ↔ Pawęż przez **zdolność do walki**
(chroniony dodatkowo BRAKIEM wariantu), Migdałowa ↔ Rycerska przez **horyzont
czasowy** („zatrzymać ten cios" vs „znieść serię").
⛔ Zero liczb balansowych; nazwy są placeholderem do `B1`.

### Przymiar — 52 zamki na PRAWDZIWYM kodzie

`tools/tarcze_przymiar.mjs`: znane kąty 0/45/60±/90/100±/135/180, konwencja
ostra `<` na wektorach dokładnych, sufit `fullArcDeg ≤ 90`, `sideMul` globalne,
brak `blockChance`, `blockSpec` z przedmiotu, bash czyta `blockSpec`, resolver
liczy kąt a nie `DamageResult.zone`, `condition ≠ quality`, brak geometrii
i `quality` w `ITEMS`.

⭐⭐ **Zamek §G6 zastawiony Z WYPRZEDZENIEM na pułapkę `T-1`:** pilnuje arności
`guardZone` i tego, że `combat_regresja.mjs:185` woła ją dwuargumentowo.
**Padnie w dniu parametryzacji i wymusi poprawkę tamtego testu** — czyli
dokładnie wtedy, kiedy regresja mogłaby zacząć świecić na zielono, nie
sprawdzając niczego.

⚠ **Lekcja z pierwszego uruchomienia:** 7 czerwonych, z czego **6 było błędem
przymiaru, nie kodu** — `blockChance`, `wynik.zone` i `DamageResult.zone`
trafiały w KOMENTARZE mówiące, że ich nie używamy; „wood" w kolor rekwizytu.
Siódmy to szum zmiennoprzecinkowy testu (`R(60)` → 59.99999999999999).
Naprawione przez `bezKomentarzy()` i przez testowanie granicy na wektorach
dokładnych. **Asercja czerwona z niewłaściwego powodu uczy ignorować raport** —
to ta sama reguła z `tools/CLAUDE.md`, tylko z drugiej strony.

### Stan

Design tarcz **ZAMKNIĘTY**. Otwarte zostają wyłącznie rzeczy zarejestrowane
wcześniej: `P1` (pomiar), `B3` (wartości `sideArcDeg`), `B1`, `B4`, `B2`.
⭐ **`T-5` jest jedynym krokiem implementacyjnym niezależnym od `P1`** —
i `D-T1` właśnie podniosło jego wagę, bo trwałość jest teraz nośnikiem
tożsamości dwóch konstrukcji.

---

## 2026-09-15 (2) — `P1`: sonda rozkładu kątów ciosów (krok 0 tarcz)

Pierwszy krok implementacyjny z `docs/tarcze_checkpoint.md` §4. **Narzędzie
gotowe, pomiar NIEWYKONANY** — wymaga rozgrywki, nie kodu.

**Co weszło:** `src/core/GuardStats.ts` (dev-only) + jedno wywołanie
w `Player.takeDamage` pod `import.meta.env.DEV` + `dev.guard` w `main.ts`.
Zweryfikowane: **zero śladu w buildzie produkcyjnym** (grep po `dist/`).

**Trzy odstępstwa od pierwotnego opisu „licznik `zone` w `resolveIncoming`":**

1. ⭐ **Histogram surowego kąta zamiast licznika stref.** Licznik pod dzisiejszymi
   progami odpowiada tylko na pytanie o dzisiejsze progi; `B3` pyta o 45/90/135.
   Raport podaje **tabelę sześciu par progów naraz**, więc jedna sesja grania
   odpowiada na oba pytania. Ten sam koszt, a rozgrywka to jedyny zasób w tym
   pomiarze, którego nie da się zasymulować.
2. ⚠⚠ **⛔ Nie czytamy `DamageResult.zone`** — gałęzie `immune` i `dodge`
   zwracają tam `"back"` **na sztywno**. To wypełniacz pola, nie geometria.
   Dodge to 5,2% ciosów, więc odczyt po werdykcie **zawyżałby „tył"** i pomiar
   odpowiedziałby na pytanie `P1` błędem zamiast danymi.
3. ⚠ **Sonda nie siedzi w `resolveIncoming`** — czystość tej funkcji jest
   warunkiem z jej nagłówka (test/replay/serwer), a licznik modułowy zbierałby
   śmieci z `combat_regresja.mjs`, które woła ją 121 razy.

**Refaktor w `Protection.ts`:** `guardAngleDeg` wydzielone z `isFrontal`,
**bit-w-bit** (`!from → NaN → false` daje ten sam wynik co `if (!from) return
false`). Powód jest z niezmiennika: sonda potrzebuje surowego kąta, a policzenie
go u wołającego byłoby **drugą kopią geometrii** (N-25). Regresja: **121/121 bez
różnic**.

**Weryfikacja instrumentu, nie tylko kompilacji.** W żywym buildzie wstrzyknięto
55 próbek o znanych kątach (30/50/80/120/170° + 5 bez kierunku) i porównano
wszystkie sześć wierszy tabeli progów z ręcznym wyliczeniem — **zgodność co do
jednej wartości**. Bez tego pierwsza realna sesja grania mogłaby zostać spalona
na błędnym raporcie.

⚠ **Czego sonda NIE zapisuje: gatunku napastnika** — wymagałoby zmiany sygnatury
`takeDamage` w ośmiu miejscach. **Decyzja autora: nie teraz**; jeśli histogram
pokaże istotny rozrzut kątów, wtedy rozstrzygniemy, czy następny pomiar musi
rozbić dane na typ przeciwnika.

**Doprecyzowanie próbki (autor, ta sama sesja).** Raport drukuje teraz
**skumulowane** `< 45° / < 90° / < 135° / ≥ 135°` i **medianę całości** — wcześniej
dało się je tylko wyliczyć z tabeli progów, czyli „na oko", czego autor chciał
uniknąć. Doszedł też **próg mocy próbki** (`PROG_PROBKI = 100` ciosów
Z KIERUNKIEM): poniżej niego raport ostrzega i podaje, ile pp waży jeden cios.
⚠ Granice skumulowanych są **OSTRE** (`<`), zgodnie z konwencją `isFrontal` —
mieszanie `≤` z `<` to ta klasa błędu, którą projekt zapłacił raz na cosinusie
90°. Pełny protokół zbierania (rozkład sytuacji, minimum trzy zachowania, czego
się nie liczy) stoi w `docs/tarcze_checkpoint.md`.

⛔ **Zero zmian w mechanice.** `SHIELD.*`, `BlockSpec`, `guardZone`, arytmetyka
bloku, obie tarcze w `ITEMS` — nietknięte. `tsc`, `build` i regresja czyste.

**Następne:** pograć z `dev.guard.start()` (⛔ starcia RÓŻNEGO typu — sfora,
dzik, sieciarz), potem `T-1`.

---

## 2026-09-14 (2) — Tarcze: audyt systemu i robocza taksonomia (zero zmian w kodzie)

Sesja **wyłącznie projektowa**. Nie ruszono ani jednej linijki `src/`, ani
jednej liczby w `GameConfig.ts`. Pełny zapis:
`docs/tarcze_konstrukcje_2026-09-14.md` — **to jest punkt wejścia do
kontynuacji**, razem z §9 (sześć decyzji T-1…T-6).

### Co ustalono o stanie

Łańcuch bloku jest **poprawny** — `node tools/combat_regresja.mjs` przechodzi
121 przypadków bez różnic, grupy §L i §X1–§X5 włącznie. Zero błędów w geometrii,
kolejności kroków i liczbie zaokrągleń.

Zmierzone benchmarkiem (`tools/combat_benchmark.mjs`): **1H + tarcza jest
bezwarunkowo najlepszym archetypem — +25% nad 2H i +30% nad DW** na mierze
`DPS / obrażenia przyjęte`, i to **zanim** doliczy się kontrolę z Uderzenia
tarczą. To jest OI-25, znane; ⛔ autor nie chce tego naprawiać nerfem tarczy.

⭐ **Tarcza nie kosztuje ani punktu staminy na sekundę** — `swingMul` mnoży
kadencję i koszt zamachu tym samym mnożnikiem (3,96/s z puklerzem = 3,96/s bez).
Cała jej cena siedzi w DPS.

### Dwa znaleziska, które rozstrzygają projekt geometrii

1. ⭐ **Zwrot postaci jest CZTEROKIEROWY** (`FACING_VECTOR`), więc maksymalny
   rozjazd „celuję w niego" ↔ jego realny kąt wynosi **45°**. Z tego wychodzą
   **progi jakościowe 45 / 90 / 135**: kąt poniżej 45° znaczy „osłona nie kryje
   nawet ćwiartki, w którą patrzysz", 135° znaczy „wilk, który zaszedł z boku,
   nadal trafia w tarczę". ⚠ Wartości muszą **trafiać w progi, nie
   interpolować** — inaczej geometria jest niewidzialnym pokrętłem.
2. ⛔ **Sufit `fullArcDeg` wynosi 90°** i jest **wspólny z parowaniem i bramką
   zwrotu ataku** (§L pilnuje `fullArcDeg ≤ blockArcDeg`). `sideArcDeg` sufitu
   nie ma. Czyli: tarcze „twarde" różnią się **pełną** strefą (45–90°), tarcze
   „szerokie" — **zewnętrzną** (90–150°). Dwie niezależne osie.

### Przebieg — i jedna rzecz, którą warto znać

Pierwsza wersja taksonomii (4 konstrukcje na osi „chwytu", z `turnMs` jako osią
reakcji) została **obalona w tej samej sesji**, po tym jak autor poprosił
o próbę jej podważenia. Sześć zarzutów, z czego trzy nośne:

- ⛔ **Przesłanka była fałszywa.** „Dzisiejsza para to szczebel" jest sprzeczne
  z kryterium, które projekt przyjął dla pancerza 2026-09-12. Policzone: puklerz
  **2,67 pkt/kg** i **4,05 pp redukcji na %DPS**, okuta **1,60** i **2,69** —
  lżejsza ma lepszy stosunek i niższą wartość bezwzględną na obu osiach, czyli
  **jest wariantem, nie szczeblem**.
- ⛔ **`turnMs` odrzucony na stałe**: zamachy trwają 140–290 ms, więc pasmo
  użyteczne to 40–120 ms (poniżej progu odróżnialności), a opóźnienie osłony
  uderza wprost w zapisaną tożsamość systemu („tarcza jest odpowiedzią na twój
  własny root").
- ⚠ Zarzut „geometria per tarcza = szansa bloku tylnymi drzwiami" **cofnięty
  częściowo**: zlewał *nieczytelność* z *losowością*, a N-23 odrzuciło
  `blockChance` z powodu **wariancyjnego**. Geometria ma wariancję zero.

Autor skorygował ramę: **parametryzacja istniejącego resolvera nie jest nową
mechaniką**. To otworzyło wersję obowiązującą — 4 konstrukcje (Puklerz ·
Okrągła · Rycerska · Pawęż) na dwóch osiach kątowych.

⚠ **Koszt formalny do zapłacenia świadomie:** N-22 („warunek stoi w stałych")
trzeba **przepisać, nie złamać po cichu**. Jego jedyne uzasadnienie w
`shields.md` opiera się na „Raise Shield", o którym ten sam plik mówi, że **nie
istnieje i nie jest zaplanowane**.

### Dziury w kodzie znalezione po drodze (⛔ nienaprawione)

- ⭐⭐ **`shieldBash` nie czyta tarczy** — `stunMs: 700` i `windupMs: 180` są
  globalne, więc **puklerz i pawęż ogłuszają identycznie**. Trzeci składnik
  wartości tarczy jest dziś całkowicie płaski.
- ⚠ **Zniszczona tarcza blokowałaby w pełni** — `blockSpec` nie czyta
  `destroyedMultiplier`. Dziś bez skutku (brak `durability`), błąd w chwili
  dodania pola.
- ⚠ Koszt staminy bloku i pas boczny są **niewidoczne dla gracza**; tarcze nie
  mają tagu `set`; `offhand` trzeba będzie jawnie wykluczyć z warstw przy OI-98.

### Co NIE zostało zrobione

⛔ Zero zmian w `src/`. ⛔ Żadna decyzja niepodjęta — T-1…T-6 czekają. ⛔ T-1…T-6
**nie są jeszcze numerami `OI`**; promocja do `zadania.md` wymaga rozstrzygnięcia
autora. ⛔ `docs/systemy/shields.md` **nietknięty** — mechanika się nie zmieniła,
więc `STAN` nie miał czego opisać inaczej.

---

## 2026-09-15 — System tarcz: projekt ZAMKNIĘTY, zero kodu

Sesja wyłącznie projektowa, siedem rund. **Nie ruszono ani jednej linijki kodu
ani jednej wartości balansowej.** Pełny zapis ustaleń:
`docs/tarcze_checkpoint.md` — **od tego zaczyna się następna sesja**.

### Co zostało ustalone

**Sześć konstrukcji:** Puklerz · Okrągła · Rycerska · Migdałowa · **Legionowa**
· Pawęż. Model `Construction → Material → Quality → Variant`, z niezmiennikiem
⛔ **wariant nigdy nie rusza geometrii**.

### Trzy rzeczy, które wyszły dopiero z arytmetyki

1. ⛔ **Migdałowa nie może stać na PP.** Wymiana `reduction↓ / PP↑` jest
   niewykonalna: `reduction` to mnożnik bez sufitu, PP wchodzą do krzywej
   malejącej wspólnej z pancerzem — wymiana wychodzi **czterokrotnie
   niekorzystnie**. ⇒ tożsamość niesie trwałość, więc **`T-5` staje się
   warunkiem koniecznym** tej konstrukcji.
2. ⛔ **Pawęż też nie może stać na PP** — ten sam kanał nasyca się dokładnie na
   szczycie katalogu. Policzone: legionowa przyjmowała 14, Pawęż 12, przy
   koszcie −25% wobec −39% DPS, czyli **Pawęż była zdominowana**. ⇒ tożsamość
   przeniesiona na **łuk i trwałość**.
3. ⭐ Reguła wyprowadzona z obu: **PP nigdy nie są tożsamością, tylko skutkiem
   ubocznym rozmiaru.**

### Pomyłka, którą trzeba zapamiętać

⛔ **Zacytowałem dokument `HISTORIA` jako wiążący stan projektu** i na tej
podstawie ogłosiłem, że Migdałowa „została odrzucona". `DOC_CONTRACT` §2.4
mówi wprost, że `HISTORIA` **nigdy nie jest cytowana jako stan**. Gorzej:
odrzucenie w §5.3 opierało się na **argumencie z `coverage`**, czyli
przesłance, którą autor unieważnił już przy kolczugach. ⚠ **Ta sama pomyłka
wróciła po raz czwarty.**

⚠ Drugi wniosek z tej samej sytuacji: sesja projektowa z 09-14 (17:00–1:20)
działała na **drugiej maszynie** i jej transkrypt jest tu nieosiągalny —
`search_session_transcripts` na „Migdałowa" daje zero trafień. **Do tej maszyny
dotarł wyłącznie commit.** Stąd ten checkpoint.

### Stan implementacji

⚠ **W kodzie nadal są DWIE tarcze** (`buckler`, `ironbound_shield`). Sześć
konstrukcji to **decyzje projektowe**, nie zawartość. Architektura uniesie je
bez przebudowy: `ItemId`, `ItemInstance`, zapis i naprawa zostają nietknięte.

Otwarte zostają cztery decyzje (`B1`–`B4`), z których **żadna nie blokuje
kroków 0–3**. Pierwszy krok to **`P1`** — pomiar rozkładu kątów nadchodzących
ciosów, bo przesądza wartość całego `T-1`.

---

## 2026-09-14 — Audyt matematyczny warstw i obciążenia (zero zmian w mechanice)

Sesja **wyłącznie analityczna**. Nie ruszono ani jednej wartości balansowej:
`defenseK`, cap redukcji, progi obciążenia, mnożniki, wagi, obrona i wymagania
Siły przedmiotów, koszty uniku i sprintu — wszystko stoi tak, jak stało.

Pełny zapis: `docs/audyt_obciazenia_i_warstw_2026-09-14.md`.

### Co audyt ustalił

⛔ **Warstwowanie nadal NIE jest zaimplementowane** — `layer` to metadana, jeden
slot trzyma jeden przedmiot. Wszystkie liczby o „pełnym stosie" są **projekcjami**
policzonymi tak, jakby warstwy już sumowały punkty i masę.

Dwa niezależne znaleziska, oba w modelu OBCIĄŻENIA, nie w warstwach:

1. ⚠⚠ **Nasycenie powyżej `heavyAbove`.** Przy Sile 10 masa 45 kg i 120 kg
   kosztuje dokładnie tyle samo (mnożnik 1,50, 22,5 staminy za unik). Ochrona
   rośnie z każdym kilogramem, koszt przestaje rosnąć przy pierwszym — więc
   powyżej `ratio 0,90` dokładanie pancerza jest **ściśle dominujące**. Zapisane
   jako **OI-101**, adres przeniesiony na nowy audyt.
2. ⚠ **Kara trafia w zły kanał.** Koszt uniku wydaje wyłącznie build lekki;
   ciężki, mając 74,7% redukcji, po prostu przyjmuje ciosy. Pogłębia to fakt, że
   `Stamina.spend()` nigdy nie odmawia akcji.

Skutek dla warstw (projekcja): przewaga maksymalnego stosu nad lekkim to
**×2,53 w eHP** przy karze, która nie dotyka ani obrażeń, ani tempa. ⚠ **To jest
ocena modelu obciążenia, nie warstwowania** — warstwy tylko ujawniają wadę,
która w rosterze jednosztukowym nie miała jak zaświecić.

⭐ **Argument ZA warstwami pozostaje mocny i nie dotyczy balansu:** te same
25 sztuk pancerza dają **466 560 kombinacji zamiast 2 520** — ×185, bez ani
jednego nowego przedmiotu.

### Hipoteza autora i trzy modele — NIC NIE WYBRANO

Autor postawił hipotezę: load ma dotykać **uniku, prędkości ruchu i prędkości
ataku**, a **nie** parowania, bloku ani redukcji. Audyt ocenia ją jako
**naprawiającą kanał, ale nie kształt** — można dodać karę do ataku i nadal mieć
45 kg = 120 kg.

Policzono trzy modele (pięć klas · płynny liniowy · hybryda z etykietą dla UI
i ciągłą karą per kanał). ⛔ **Rekomendacja Claude'a to Model C — hybryda, i jest
NIEZAAKCEPTOWANA oraz NIEWDROŻONA.** Wybór należy do autora, zapisany jako
**OI-103**, blokuje wdrożenie OI-98.

### Errata do własnej pracy

⚠ Uzasadnienie D2 w `decyzje/2026-09-12-taksonomia-pancerza.md` („pełny stos
142 pkt → 74%") jest policzone na stosie, **którego nie da się dziś założyć** —
realne maksimum to 62,4%. ⛔ Decyzji nie poprawiono, bo `DECYZJA` jest niezmienna
po zamknięciu; **samo rozstrzygnięcie D2 stoi**, błędne jest tylko uzasadnienie
liczbowe. Errata żyje w §10 audytu.

### Higiena

Skrypt liczący modele powstał w katalogu roboczym sesji i **został skasowany** —
nie liczy niczego, co gra liczy naprawdę, więc w `tools/` byłby przymiarem
sprawdzającym sam siebie. Wszystkie jego wyniki są przepisane do audytu.

---

## 2026-09-12 (2) — Generator zna warstwy + pierwsza partia pancerza (9 sztuk)

Pierwsze wdrożenie zawartości po zamknięciu taksonomii. **Katalog pancerza
rośnie z 23 do 32 sztuk**, wszystkie w czterech obszarach warstwowanych.

### Generator nauczony osi `layer`

`tools/katalog_ekwipunku.mjs` dostał kolumnę `warstwa` (plus `waga`), wiersze
sortowane warstwami, nowy blok `AUTO:stos` (cztery obszary × trzy warstwy
w jednej tabeli) i licznik w raporcie.

⚠ **Warstwa czytana z PRAWDZIWEGO `core/ArmorLayers.ts`**, nie z kopii mapy —
kolczuga przeniosła się już raz (`metalowa` → `L2`) i taka zmiana musi
dojeżdżać do katalogu sama. To ta sama reguła, co przy `familyTraitValue`
i przy `ControlLayout` w `hud_uklad.mjs`.

⚠ **Blok `stos` istnieje po to, żeby KOLIZJA WARSTW nie mogła się schować.**
Do 2026-09-12 kolczuga i płyta dzieliły warstwę i nie widział tego nikt, bo
żaden dokument nie pokazywał warstw obok siebie.

### Dziewięć przedmiotów

Kapalin (głowa L3) · Kaftan podzbrojny (tors L1) · Kolczuga krótka (tors L2) ·
Napierśnik skórzany (tors L2) · Brygantyna (tors L3) · Kirys (tors L3) ·
Półnogawice kolcze (nogi L2) · Nabiodrki z nagolennikami (nogi L3) ·
Sabatony częściowe (stopy L3).

⚠ **Żaden nie deklaruje pola `layer`** — domyślna mapa materiałów trafia
wszystkie dziewięć tam, gdzie mają być. Pole jest od wyjątków, nie od
potwierdzania reguły.

⚠ **Reguła wyceny: dwie osie naraz.** Wariant lżejszy ma LEPSZY stosunek obrony
do masy i NIŻSZĄ obronę bezwzględną; cięższy odwrotnie. Sprawdzone
arytmetycznie na wszystkich 32 pancerzach: **zero przypadków dominacji**
(ten sam slot i warstwa, porównanie po obronie, masie, Sile i cenie).

### Rzecz, na którą poszło najwięcej pracy: dwie ikony

Arkusz `items.png` miał wolne kafle w rzędach pancerza — siedem z dziewięciu
ikon wzięło je wprost, zero nowej grafiki. **Ale żaden wolny kafel nie ma
FAKTURY SIATKI**: wszystkie są gładką płytą. Obie alternatywy dla dwóch
wariantów kolczugi były złe: ta sama ikona co pełna kolczuga to usterka zapisana
przy `gambeson`, a ikona płytowa na kolczudze **kłamie o materiale** — czyli
o rzeczy, która decyduje o profilu obrażeń.

Stąd `tools/build_mail_variants.py`: wariant jest WYPROWADZANY ze źródła —
pełna sztuka ucięta na zadanej wysokości i domknięta **własnym obrysem autora**
(najciemniejszym kolorem kafla). Zero malowania od zera, zachowana faktura.
Kafle (7,26) i (7,27). Pełny opis rzędów pancerza i reguła dopisywania:
`public/assets/README.md`.

### Czego NIE zweryfikowałem

⚠ **Kontrola wizualna w silniku nie doszła do skutku** — Browser pane nie
renderował przez całą sesję (okno w tle), więc gra stawała na ekranie
ładowania. Zweryfikowane bez renderu: wartości i warstwy (generator czyta
prawdziwe `ITEMS`), brak dominacji (arytmetycznie), wszystkie dziewięć
współrzędnych ikon trafia w treść arkusza (skan alfy), pełna regresja. **Do
obejrzenia zostaje, jak te ikony wyglądają w plecaku i w sklepie.**

---

## 2026-09-12 — Taksonomia pancerza zamknięta: trzy warstwy, D1–D4

Runda projektowa bez rozbudowy contentu. Autor zamknął cztery decyzje, a ja
poprawiłem jeden realny błąd modelu, który sam wprowadziłem dzień wcześniej.

**Zapis decyzji:** `docs/decyzje/2026-09-12-taksonomia-pancerza.md`.

### Rzecz, którą warto zapamiętać z tej rundy

⭐ **Przypisanie dzisiejszych 20 pancerzy do warstw dało SYMETRIĘ IDEALNĄ:**
każdy z czterech obszarów warstwowanych ma dokładnie **1 × L1, 2 × L2, 1 × L3**.
Nikt tego tak nie projektował — wyszło z historycznych nazw, którymi roster
powstawał. Wniosek: roster nie wymagał rozbudowy, żeby unieść warstwy, tylko
ROZPŁASZCZENIA W DRUGĄ STRONĘ. To wyjaśniło też F1 (skóra przegrywająca
z przeszywanicą): nie był to błąd balansu, tylko dwie RÓŻNE WARSTWY zmuszone do
rywalizacji o jeden slot.

### Błąd, który naprawiłem po sobie

`ArmorLayers.ts` niósł **cztery** warstwy nazwane materiałowo
(`wewnetrzna`/`ochronna`/`metalowa`/`zewnetrzna`) i mapował **kolczugę razem
z płytą** na `metalowa`. Skutek: kanoniczny stos „przeszywanica → kolczuga →
napierśnik" był **niewyrażalny** — dwie z trzech warstw kolidowały.

⚠ **Przyczyną była NAZWA.** Warstwa nazwana „metalowa" zaprasza do pytania „czy
kolczuga jest metalowa?", na które odpowiedź brzmi tak. Nazwa pozycyjna
(`L1`/`L2`/`L3`) takiej dwuznaczności nie ma. To jest ten sam rodzaj pomyłki, co
nazwanie slotu po jednym z jego przyszłych mieszkańców (`offhand` kontra
„Tarcza").

⚠ **Kropki warstw w kaflu lalki nie wymagały ANI JEDNEJ zmiany**, bo ich liczba
jest wyprowadzona z `ARMOR_LAYERS.length`, a nie wpisana. Cztery → trzy przeszło
samo.

### Cztery decyzje

- **D1 — `requires.strength` NIE sumuje się przez warstwy.** Powód: `requires`
  i `weight` odpowiadają na dwa różne pytania, a sumowanie zrobiłoby z wymagania
  drugi agregat — policzyłoby tę samą rzecz raz w kilogramach i raz w punktach
  atrybutu. Sprawdzone: masa gatuje sama (pełny stos 54,5 kg jest CIĘŻKI przy
  każdej Sile do 20), absurdu z braku sumowania nie znalazłem.
- **D2 — krzywa redukcji BEZ ZMIAN** (`defenseK = 50`, sufit 75%). ⭐ Zmierzone:
  L1 → 39,8%, L1+L2 → 61,2%, L1+L2+L3 → 73,1%; efektywność **4,97 → 1,07 → 0,48
  pp/kg**. Każda warstwa daje około połowy poprzedniej przy podobnym koszcie
  masy — struktura wyszła z liczb strojonych pod JEDNĄ warstwę i nie wymagała
  korekty. Sufit wiąże wyłącznie na CIĘTYM (80,8% → 75%), czyli na jedynym
  typie, przeciw któremu każdy pancerz jest neutralny lub lepszy.
- **D3 — obciążenie ODŁOŻONE.** Progi 0,55/0,90 **nie są zamrożone**; przyszły
  atrybut Udźwig może je przestawić. Masa ma działać jako dane i parametr —
  i działa.
- **D4 — `set` ⊥ `layer`.** Zero powiązania, i kod już to spełniał.

### Co zostaje

Nowe pozycje: **OI-100** (czy domykamy trójkąt typów piątym materiałem —
przestraja całą broń ciętą), **OI-101** (brak progu powyżej ratio 0,90),
**OI-102** (trzy pętle zakładające jeden przedmiot na slot).

⛔ **`coverage` NIE POWSTANIE** — decyzja autora, zapisana w decyzji domenowej.
I ⛔ **brak `coverage` przestaje być argumentem przeciwko wariantom
konstrukcyjnym**; ta pomyłka pojawiła się w mojej analizie trzy razy, zanim
autor ją unieważnił.

---

## 2026-09-11 (3) — Fundament wyposażenia: układ z danych, zestawy, dwa zestawy broni

**Zadanie autora było fundamentalne, nie kosmetyczne:** zaprojektować ekwipunek,
który jest prosty na starcie, a po setkach godzin i przy dużej kolekcji nadal
pozwala budować i optymalizować wyposażenie — z punktu widzenia **game designu,
UX i architektury naraz**, z WoW-em i Eternium jako punktem odniesienia
(nie wzorem do przepisania).

**Pełny zapis decyzji, trzy odrzucone układy i to, czego świadomie NIE
wdrożono:** `docs/decyzje/2026-09-11-ekwipunek-fundament.md`. Tu tylko narracja.

### Co naprawdę blokowało

Trzy sprzężenia, każde zmierzone:
- **układ był własnością PNG** — `slots.png` to krata 3×4 z wypalonymi glifami,
  a `DOLL_LAYOUT` był jej odbiciem w kodzie;
- **panel miał stałe 816×530 j.** — na telefonie 65% szerokości, na monitorze
  1080p **42% szerokości i 49% wysokości**;
- **osiemnaście stałych geometrii** prawdziwych dla jednej kombinacji rozmiaru
  panelu i kafla. Komentarz przy `columnsTop = −172` **sam przyznawał**, że jego
  uzasadnienie przestało obowiązywać po wprowadzeniu skali UI.

### Co weszło

Nowe pliki: `src/ui/EquipLayout.ts` (układ jako dane + czysta geometria),
`src/core/ItemSets.ts`, `src/core/ArmorLayers.ts`, `tools/ekwipunek_uklad.mjs`
(przymiar układu na trzech ramkach), `tools/build_slot_glyphs.py` +
`public/assets/ui/slot_glyphs.png` (13 glifów wyciętych ze starej lalki
i dorysowanych).

Efekt w liczbach: telefon **1225×556 j. = 97%/96% ekranu**, kafel 70 j.,
**25 kafli plecaka widocznych** (było 16); monitor — kafel 82 j., 40 kafli.
Trzecia kolumna przestała stać pusta: gdy nic nie jest zaznaczone, pokazuje
statystyki bojowe i pełną listę zestawów, a ustępuje karcie przedmiotu.

### Trzy rzeczy, które wyszły dopiero z RENDERU

Wszystkie trzy przy **asercjach arytmetycznych na zielono** — dokładnie reguła
numer jeden z `tools/CLAUDE.md`:
1. przyciski filtra narysowane NA pierwszym rzędzie kafli (siatka i filtr
   zaczynały się na tej samej wysokości — stąd `gridTop` osobne od `columnsTop`);
2. rząd toreb wchodzący na pasek zestawów (jeden centrowany, drugi liczony od
   krawędzi kolumny — dwa elementy dzielące pas muszą mieć jedną krawędź);
3. przycisk zamiany zestawów 34×34 j. = **24 CSS px przy normie 48 dp**.

⚠ **Asercja `ekwipunek_uklad.mjs` NIE jest dekoracją — świeciła na czerwono
dwa razy** (kolumna wyposażenia 504 > 460 j.; „5 kafli w jednej kolumnie") i oba
razy wymusiła zmianę układu, a nie zmianę progu.

### Błąd znaleziony przy okazji, w rdzeniu

`equipFromBag(index, preferred)` przy slocie, który ODMAWIA, spadał na
`slotForItem` i zakładał przedmiot **gdzie indziej** — zwracając `true`. Dopóki
sloty były jednym zestawem, kosztowało to najwyżej wybór palca. Od drugiego
zestawu: upuszczenie tarczy na drugą rękę zestawu II (zablokowaną toporem
dwuręcznym) **zakładało ją w zestawie CZYNNYM**, wyrzucając stamtąd puklerz.
Ścieżka UI była czysta (panel sprawdza `accepts` wcześniej), więc znalazł to
dopiero test API. Naprawione w rdzeniu; guard `W6` w `combat_regresja.mjs`
przepisany pod nowy kształt reguły i **sprawdzony, że potrafi zaświecić na
czerwono**.

### Czego NIE zrobiłem i dlaczego

- **Warstwy jako mechanika** — dziś `layer` jest metadaną. Wdrożone zostały dwie
  rzeczy, bez których warstwy byłyby przebudową całego ekwipunku: kafel
  z miejscem na pasek warstw i **liczenie zestawów po ELEMENTACH, nie po
  slotach**.
- **`shoulders` / `belt` / drugi slot użytkowy w `EquipSlot`** — kafle są
  rysowane, ale przygaszone, z powodem na dotknięcie. Reguła z
  `src/core/CLAUDE.md`: komórka manekina jest martwa, dopóki nie ma przedmiotu,
  który w nią wejdzie.
- **Ani jeden nowy przedmiot.** Zestawy powstały z tagów na dwudziestu
  istniejących pancerzach.

⛔ **Liczby premii zestawów są DO PLAYTESTU** (OI-94) — rząd wielkości wzięty
z pierścieni. Wyzerowanie systemu to `bonus: {}` w progach `ITEM_SETS`.

---

## 2026-09-11 (2) — Tarcza widoczna w drugiej ręce + audyt wilka 3D od Gemini

Dwie rzeczy, powiązane tylko tematem (3D): audyt cudzego assetu i własna,
mała robota na modelu gracza.

### Tarcza w lewej dłoni — trzeci slot wymienny

**Jest w grze i przeszła przez prawdziwą ścieżkę `Equipment`**, nie przez
nadpisanie z konsoli: `buckler` i `ironbound_shield` pokazują się w drugiej ręce,
a broń dwuręczna gasi tarczę sama (bo `Equipment` odkłada wtedy `offhand` do
plecaka — zweryfikowane, `offhand: null`).

Nowe: `tools/char3d_shields.py` (moduł, słownik `TARCZE`),
`tools/char3d_preview_shields.py` (podgląd), `tools/char3d_sprawdz_tarcze.py`
(bramka). W silniku: slot `tarcza` → przedrostek `Tarcza_`, synchronizacja
z `Equipment.offhand`, `dev.char3d.tarcza(...)`.

⚠⚠ **Skala obiektu `Armature` wynosi 1,6527 i to przewróciło pierwszy rachunek
rozmiaru.** Wymiary w `char3d_weapons.py`/`char3d_shields.py` są w przestrzeni
LOKALNEJ, więc „promień 2,25" to w świecie 7,4 j. średnicy przy postaci wysokiej
na 12,96 j. — **57% wzrostu**, tarcza zasłaniała nogę do kostki. Po zmierzeniu
skali (a nie po zgadnięciu z wysokości postaci): 1,65 → 42%. Liczba wylądowała
w `public/assets/README.md`, bo to jest dokładnie ten fakt, który następna sesja
odkryłaby jeszcze raz.

⚠ **Kąt noszenia `(0, −20, 0)` jest z porównania renderów, nie z głowy.** Bez
niego lico tarczy stoi za bardzo bokiem do kamery gry: lokalne Z kości
`Bone.002_L.003` biegnie w świecie (−0,65, −0,76, 0,01), czyli przód **i mocno
w poprzek ciała**. Zestawienie 0° vs −20° rozstrzygnęło to w jednym spojrzeniu.

⚠ **Kolory obu tarcz są odpipetowane z `items.png`** (kafle 2,9 i 11,9), nie
dobrane do palety broni — tamta pochodzi z `Character.png` i jest chłodniejsza.
Ikony pokazały też kształt: obie są **okrągłe, z centralnym guzem**, czyli
chwyt jest środkowy. Dlatego tarcza siedzi na wysokości pięści i nie potrzebuje
przesunięcia na przedramię — wyglądało to najpierw na błąd („za nisko"), a jest
zgodne z tym, co narysowane.

⚠ **Bramkę widziano na czerwono** (`tools/CLAUDE.md`): `chwyt` przestawiony na
`(0, 2.20, 0.30)` → BLAD, zejście +1,11 j. pod linię stóp; wykreślenie
`buckler` z `TARCZE` → BLAD rosteru. Obie próby kończyły się kodem 1.
Zapas jest jednak mniejszy, niż wygląda: puklerz ma **2,56 j. nad stopami**,
tarcza okuta **1,31 j.**, a przesunięcie o 1,5 j. jeszcze się w tolerancji mieści.

⏳ **Zostaje otwarte, świadomie:** (1) lewa ręka **macha w marszu**, bo
`Walk_Armed` zatrzymuje wyłącznie rękę z bronią — jeśli playtest przeczyta to
jako kołysanie tarczą, lekarstwem jest poza niesienia dla lewej dłoni w
`char3d_chod.py`, ta sama technika co dla prawej; (2) **broń w drugiej ręce
(dual wield) nadal nie ma modelu po lewej** — slot rozpoznaje tarcze po polu
`block` i broń po prostu ignoruje, żeby nie zasypywać konsoli fałszywym alarmem.

### Audyt wilka 3D (skrypt Gemini) — NIE do przyjęcia jako baza produkcyjna

Skryptu **nie ma w repo** — audyt szedł z treści wklejonej przez autora,
uruchomionej w Blenderze 5.2.1 i zmierzonej, nie ocenionej wzrokiem.

Cztery rzeczy, które przewracają go jako *wzorzec* (sam asset jest tani:
260 trójkątów, 22 kości):

1. **Nie kończy się sukcesem** — `action.fcurves` zniknęło ze slotted actions;
   projekt używa nowego API od `char3d_blender.py`.
2. **5 z 6 akcji ma `users=0` i żadnego fake usera** — po zapisie `.blend`
   zostaje jedna. Asset żyje tylko w sesji, która go stworzyła.
3. **Śmierć nie jest upadkiem, tylko obrotem w planie.** `Root` wskazuje +Z,
   więc obrót o 90° wokół jego lokalnego Y to YAW. Zmierzone na kl. 40:
   `Head.z` = 0,75 (bez zmian), `min_z` = −0,042. Wilk kończy **stojąc**.
4. **Orientacja odwrotna do konwencji projektu** — pysk na +Y w Blenderze →
   glTF **−Z**, a gracz patrzy w +Z. Wilk biegałby tyłem.

⚠ Do tego cała „optymalizacja top-down" (poszerzony korpus, yaw zamiast pitchu)
jest pod kamerę **90°**, a gra renderuje pod **15°** (`Character3D.ELEV_DEG`).

⚠ **Prawdziwy problem jest jednak nie w wilku, tylko w moście:** `Character3D`
tworzy **własny kontekst WebGL na instancję** i ma **stały** `KLUCZ_TEKSTURY`,
więc druga instancja przejęłaby teksturę pierwszej. Sfora to 3 wilki + Szary +
gracz = 5 mostów po 0,5 ms (desktop, `OI-3D-3` mówi wprost, że dla wrogów nic
nie zmierzono). **Pierwszym krokiem jest pomiar N mostów na S21 FE, nie asset.**

Pełny audyt (8 sekcji, MUST/SHOULD/NICE, proponowana architektura) poszedł do
autora w rozmowie; do `docs/` trafi, jeśli zapadnie decyzja o robieniu
przeciwników w 3D.

---

## 2026-09-11 — Celowanie: intencja domyślna, obrót w miejscu, trzy stany pierścienia

**Wyjście:** audyt UX celowania (rola: Lead Combat UX Designer), potem brief
wdrożeniowy przekazany przez autora, potem review całego modelu walki przed
pierwszym pełnym playtestem. Kodu dotknęło dopiero drugie z tych trzech.

### Co było faktycznie zepsute — i pomiar, którego nie da się odtworzyć później

⭐⭐ **Wspólny `AbilitySpec` NIE WYSTARCZYŁ, i to jest najważniejsza lekcja tej
sesji.** Projekt miał zapisane, że podgląd i rozstrzygnięcie czytają jeden
kształt (N-81) — i czytały. Mimo to **pytały o innego kandydata**: podgląd
liczył cel z osi zwrotu postaci (sektor akwizycji ±24–30°), a tapnięcie
rozstrzygało **blokadą celu**. Skutek: podgląd potrafił zaznaczyć wroga B,
a puszczenie palca uderzało w A — albo nie zaznaczał nikogo, choć cios
wychodził normalnie.

⚠ **Zmierzone uprzężą headless** (esbuild na czystym `AbilitySpec`, jak
`combat_regresja`; 6 zdolności × 3 profile broni × 36 kątów × 3 dystanse
w paśmie = **1944 przypadki**):

```
cel na WŁASNEJ osi (po poprawce):        1944/1944   (100%)
ten sam cel przy osi = zwrot postaci:    1284/1944   ( 66%)
                                          ↑ i to przy NAJLEPSZYM z czterech zwrotów
selekcja na osi celu:                     odchylenie 0.000°, kolejność encji bez wpływu
```

⭐ **34% legalnych położeń celu było dla podglądu niewidzialne.** Miara po
przestrzeni geometrycznej, nie po realnej rozgrywce (w grze cele stoją
nierównomiernie) — ale to jest rząd wielkości wady, nie jej sufit.

⚠ **Uprząż została w scratchpadzie sesji, świadomie NIE w `tools/`.** Bramka bez
właściciela i bez wpisu w dokumentacji jest długiem, nie zabezpieczeniem; gdyby
miała zostać, to jest osobna decyzja. Liczby wyżej są jedynym jej śladem —
dlatego stoją tutaj.

### Cztery zmiany w kodzie (P0/P1 z briefu)

1. **Intencja domyślna** (`abilities` §6.1): sesja celowania ma dwa stany.
   Tapnięcie = „zrób to mojemu celowi" (oś biegnie DO celu, podgląd zawężony do
   niego), przeciągnięcie = „nie temu — temu". Przełącza **pierwszy przelot
   zdarzenia ruchu**, bo ono leci wyłącznie po przekroczeniu progu gestu — drugi
   kanał na ten sam fakt byłby drugim zapisem. Intencja przeliczana **co
   klatkę**, dopóki gracz nie przejął.
2. **Łuk kierunkowy honoruje cel** — bez ani jednej gałęzi po `id` w wykonaniu:
   klin dziedziczy oś z sesji. ⛔ Tylko w przedniej półkuli; cel za plecami nie
   przechodzi.
3. **Obrót w miejscu** (`input` §9): trzecia strefa drążka. ⚠ **Pierwsza wersja
   miała próg 0,3 i była ZA MAŁA** — 2,1 mm wychylenia to mniej niż świadome
   popchnięcie kciukiem (3–5 mm), więc gracz i tak wypadałby do marszu i **i tak
   robił krok**: poprawka wyglądałaby na zrobioną, nie będąc. 0,45 = promień
   rysowanej gałki (3,2 mm), czyli granica jest **już na ekranie** („gałka
   zakrywa środek" = „obracam się"). Koszt: ginie marsz poniżej 45% prędkości
   (OI-88).
4. **Trzy stany pierścienia celu** (`presentation` §6.1) + **cicha ścieżka
   „doleciałem i nic"**: klatka dobiegnięcia napędu ciała ustawiała tylko
   kierunek ZAMACHU, a bramka zwrotu pyta o zwrot POSTACI — który w tej jednej
   klatce należał do drążka, bo `driveLocked` już się nie wykonał.

### Czwarta odmowa ataku — i dlaczego dopiero teraz

Review modelu (część trzecia sesji) znalazł **jedną cichą bramkę**: „ruch
wyklucza atak" nie mówiła nic, choć wpada się w nią najczęściej ze wszystkich.
⭐ **Cisza przestała być tylko brakiem dokładnie przez zmianę nr 4**: pierścień
zaczął świecić „gotowe", czyli interfejs **obiecywał cios, którego nie ma**.
Reguła jest nietknięta — dodany został powód („Zatrzymaj się"), milczący
w trakcie napędu ciała i gdy cios jest w locie.

⚠ **Przy okazji wyszła asymetria, której nikt nie nazwał** (OI-90): zdolności
bramki ruchu **nie mają** — ukorzeniają ciało przy zamachu, więc zatrzymanie
jest ich skutkiem, nie warunkiem. Uzasadnienie jest mocne, ale **do tej pory
nieporównywalne dla gracza**, bo bramka autoataku milczała.

### Czego świadomie NIE zrobiono

⛔ Auto-obrotu do celu (usunięty 2026-08-23, powód zmierzony w grze) ·
⛔ auto-podchodzenia (`odlozone.md` §5) · ⛔ zmiany reguły „ruch wyklucza atak" ·
⛔ powiększania pól dotykowych wrogów — **to była rekomendacja z audytu i została
ODWOŁANA po pomiarze**: królik ma 38,4 px świata × zoom 3 = ~115 px urządzenia
przy standardzie HUD-u ~119, czyli jest **na poziomie własnej normy gry**,
a powiększenie zjadałoby stawianie bazy drążka (pola wrogów odpytuje jego most
hit-testu) · ⛔ zrównania dwóch języków podglądu (OI-91) i znaku na pasku
zdolności (OI-93) — oba cofałyby istniejącą decyzję albo dokładały element
w najciaśniejsze miejsce ekranu.

**Bramki:** `tsc` ✓ · `build` ✓ · `combat_regresja` ✓ (exit 0) ·
`movement_weryfikacja` ✓ (ruch bit w bit) · `hud_uklad` ✓ · `doc_check` ✓.
⚠ **Live-testu nie było** — Phaser nie bootuje się w Browser pane (brak RAF),
a `window.dev` odpowiada tam wartościami sprzed bootu. Wszystko powyżej jest
zweryfikowane konstrukcją, uprzężą i bramkami; **odczucie nie jest
zweryfikowane w ogóle** i to jest treść sześciu nowych pozycji OI-88…OI-93.

---

## 2026-09-08 (4) — Audyt rozmów, NPC i questów: dane są rozmową, interfejs jest indeksem

⛔ **Zero zmian w `src/`.** Audyt + zapis ustaleń. Nic nie zaimplementowano,
żadnego dialogu nie przepisano.

### ⭐⭐ Najważniejszy wniosek

> **Obecny system ma już zalążek prawdziwej struktury rozmowy. Problemem jest
> przede wszystkim sposób jej PREZENTACJI — dane są bardziej rozmową, niż
> sugeruje interfejs.**

⛔ **Nie budujemy od zera dużego systemu dialogowego, dopóki nie sprawdzimy,
ile da sama przebudowa prezentacji istniejącego.**

### Pomiary — na żywym `GameConfig`, nie z dokumentacji

| miara | wartość |
|---|---|
| NPC-ów / tematów | **19 / 73** |
| tematów z bramką `after` | **45 z 73 (62 %)** |
| **najszerszy front rozmowy w CAŁEJ grze** | **3 pytania** |
| NPC-ów z jednym nowym tematem na wejściu | **18 z 19** |
| najgłębszy łańcuch — Patryczek | **6 poziomów**, 10 z 11 tematów z bramką |
| mediana odpowiedzi NPC | 298 znaków / **6 zdań** |
| mediana kwestii gracza | 33 znaki |
| stosunek objętości NPC : gracz | ≈ **9 : 1** |
| **odpowiedzi kończących się pytaniem do gracza** | **0 z 73 (0 %)** |
| `requiresQuest` / `requiresHerb` | 6 / 5 |
| powitań stanowych | 47 |

*Front* = tematy jednocześnie odblokowane i jeszcze niezadane.

⚠⚠ **Kluczowa obserwacja:** `TopicPanel:359` woła `Dialogue.available()` —
wszystko odblokowane, **łącznie z już zadanym**. Front nigdy nie przekroczył 3,
a panel rysuje u Patryczka jedenaście wierszy z paskiem przewijania.
**Nagrodą za rozmowę z człowiekiem jest to, że zaczyna wyglądać jak wiki.**

⭐ **Funkcja licząca właściwy front JUŻ ISTNIEJE:** `Dialogue.newCount()` robi
dokładnie `available ∧ ¬asked` i napędza dziś **plakietkę z liczbą**, nie widok.

### Czego system NIE potrafi — zmierzone, nie przypuszczone

⛔ gracz nie ma wypowiedzi (`q` to etykieta wiersza) · ⛔ NPC nie reaguje na
poprzednią kwestię (`a` to jeden literał) · ⛔ rozmowa nie ma zakończenia
(„← Wróć" i zamknięcie okna) · ⛔⛔ **dialog nie może prowadzić do questa** —
brak pola `requiresTopic`; `quests.md` §0.1 mówi to wprost: *„stan zadań nie
czyta rozmowy ani razu"* · ⛔ świat nie może zmienić TREŚCI wypowiedzi, tylko
jej widoczność · ⛔ NPC nie odmawia i nie przemilcza (temat jest pełny albo
ukryty) · ⚠ pamięć jest binarna (globalny `Set<string> asked`).

⚠⚠ **Najcięższa pozycja: śmierć Szarego — kulminacja Aktu I — nie zmienia ani
jednego z 73 zdań w grze.** To jest wprost sprzeczne z kręgosłupem zapisanym
tego samego dnia: powrót do Zagajów po podróży **nie ma dziś czym zadziałać**.

### ⚙ KOREKTA rekomendacji z tej samej sesji

⛔ **Rekomendacja „rozbić monologi", postawiona na kryterium DŁUGOŚCI, została
ODRZUCONA przez autora — i słusznie.** Kryterium było złe: cięcie po znakach
produkuje dialog-wydmuszkę („jedno zdanie → klik → jedno zdanie"), a krótki
dialog nie jest z definicji lepszy od długiego.

Właściwą zmienną wskazał dopiero pomiar zakończeń: **0 z 73 wypowiedzi zostawia
otwarte drzwi.** Objawem był „monolog", przyczyną nie jest liczba zdań, tylko
**brak wyjścia z wypowiedzi**.

⭐ Zasada zapisana jako decyzja:
`docs/decyzje/2026-09-08-dlugosc-wypowiedzi-nie-jest-problemem.md`.
**Wypowiedź może być długa. Nie może być zamknięta.**
⛔ Nie tniemy Patryczka o słupie — dopisujemy mu ostatnie pół zdania.

### Case study — Patryczek

⭐ **Materiał na człowieka jest napisany i jest bardzo dobry**: ograniczenie
wpisane w ciało (ręka w łubkach), powód, dla którego uczy słowem, wstyd
(„nie w walce — słup wygrał"), babka, uczucie do Zofii, turniej. Najgłębsza
struktura rozmowy w grze.

⚠ **I ten sam człowiek jest w interfejsie pozycją `Mistrzostwo broni`.** Gracz
spotyka go jako cztery wiersze menu, z których jeden nazywa się „Rozmowa".
**Utrata immersji następuje dokładnie na ekranie hubu** — zanim padnie
pierwsze zdanie.

⚠ Jego `moreToTeach` — *„Ręką nie pokażę, ale gębą owszem. Siadaj."* — jest
zaproszeniem do sceny, a dziś jest napisem nad listą.

### Co system robi DOBRZE — zachowujemy bez dyskusji

⭐⭐ **globalny `asked`** — wiedza wędruje między ludźmi; temat `zofia`
u Patryczka wymaga `sama` **od Wdowy**. Najtańszy możliwy sposób, żeby obsada
19 osób sprawiała wrażenie społeczności, która wie rzeczy · ⭐ **`after`** ·
⭐ **`requiresHerb`** (jedyna bramka zaczepiona o świat, nie o rozmowę) ·
⭐ **powitania stanowe z nadpisaniem per quest** · ⭐ **warunkowe wiersze
hubu** · ⭐ **`stockQuality` jako charakterystyka** (gracz uczy się, do kogo iść
po co, bez linii dialogu) · ⭐ **kontrakt nawigacji wstecz** · ⭐ **cały
napisany content**.

### Decyzje zamknięte w tej sesji

1. **Model danych zostaje nietknięty** do czasu sprawdzenia, ile daje sama
   prezentacja — `docs/decyzje/2026-09-08-prezentacja-przed-modelem-danych.md`.
   ⚠ `next`, warianty `a`, `close`, `requiresTopic` są **PROPOZYCJAMI**, nie
   decyzjami; odrzucona została **kolejność**, nie sama treść.
2. **Reguła długości wypowiedzi** — decyzja wyżej.

### Kierunek docelowy — USTALONY co do kształtu, NIE do wdrożenia

```
NPC rozpoczyna rozmowę → NPC mówi → gracz wybiera sensowną odpowiedź/pytanie
   → NPC reaguje → kolejny krok → zakończenie
   → ewentualnie akcja: quest / trening / handel
```

⛔ **Tego modelu jeszcze NIE wdrażamy.** Najpierw sam sposób prezentacji.

### Kierunek UI — PROPOZYCJA do następnej sesji

Ponieważ podczas rozmowy gameplay i tak jest **pauzowany**, rozważamy **duży /
prawie pełnoekranowy panel rozmowy** zamiast małego okna: więcej miejsca na
tekst, wyraźniejsze wyeksponowanie NPC, jasny rozdział wypowiedzi NPC od
kwestii gracza, przyciemniony zamrożony świat w tle.
⛔ Layoutu **nie rozstrzygamy**.

⚑ Audyt zarekomendował też wariant **B** dla hubu (hub zostaje ekranem
funkcji, ale rozmowa staje się wejściem, a `Handel`/`Szkolenie`/`Mistrzostwo`
wyjściem z niej). ⛔ **To jest PROPOZYCJA — decyzja nie zapadła.**

### Czego NIE chcemy — zapisane, żeby nie wróciło

⛔ ogromnych drzew dialogowych dla samego branchingu · ⛔ dziesiątek sztucznych
wyborów · ⛔ krótkich pustych wiadomości · ⛔ sztucznego dzielenia dobrych
wypowiedzi · ⛔ dialogów będących formularzem · ⛔ NPC wyglądających jak baza
wiedzy · ⛔ questów będących wyłącznie kartą z opisem i przyciskiem „Przyjmij" ·
⛔ budowania dużej technologii dialogowej bez potrzeby.

> **Priorytet: naturalność rozmowy > liczba wyborów > techniczna złożoność.**

### `OI-87` — dziesięć pytań do rozstrzygnięcia JAKO JEDEN PAKIET

⛔ Nie rozstrzygaj ich pojedynczo — to jeden wybór projektowy widziany
z dziesięciu stron:

1. dokładny layout dużego panelu rozmowy,
2. czy rozmowa zajmuje cały ekran, czy większość,
3. ile świata pozostaje widoczne w tle,
4. jak wizualnie reprezentujemy NPC,
5. jak reprezentujemy wypowiedzi gracza,
6. jak działa przechodzenie między kolejnymi tematami,
7. czy i kiedy potrzebujemy `next`,
8. jak rozmowa prowadzi do questa,
9. jak NPC reaguje na zmianę stanu świata,
10. jak zachować istniejący content bez niepotrzebnego przepisywania.

### ⚠ Dwie pułapki dla sesji wdrożeniowej

1. ⚠⚠ **`Quests.recordTalk` jest wołane z `NpcDialog:672`, przy OTWARCIU okna**
   (`OI-66`). Zmiana kolejności widoków **przesuwa moment zaliczenia celu
   „porozmawiaj"** — a na tym stoją `know_the_village` i etap `stick_in_hand`.
   Do obsłużenia świadomie, nie do odkrycia.
2. ⚠ **Kontrakt nawigacji wstecz** (`E`/`Escape`/Android Back → jedno `back()`)
   ma już bliznę po rozjeździe, a `OI-52` mówi, że ognisko klawiatury jest
   **dziś zepsute**. Przebudowa wejścia dotyka dokładnie tego miejsca —
   ⚑ argument, żeby `OI-52` naprawić **przy tej samej pracy**.

### Weryfikacja

```
node tools/doc_check.mjs ..... 0 BŁĘDÓW
git status src/ .............. czysto — ZERO zmian w kodzie
```

Skrypty pomiarowe (`dialog_audit`, `turn_audit`, `frontier`) leżą w katalogu
tymczasowym sesji, **poza repo** — świadomie: to były pomiary jednorazowe, a
nie przymiary. ⚠ Gdyby któryś miał wrócić, wraca jako `tools/*_weryfikacja.mjs`
z sabotażem, nie jako skrypt w scratchpadzie.

---

## 2026-09-08 (3) — Kanon: kręgosłup fabularny przedłużony w górę i podzielony na fale

⛔ **Zero zmian w `src/`.** Aktualizacja `KANON` na podstawie decyzji autora
z tej sesji. Nie powstał żaden quest, dialog ani scena — świadomie.

**Co się zmieniło w `docs/swiat.md` §1 „Kręgosłup":**

1. ⚠⚠ **Szczyt łańcucha przestał być końcem opowieści.** Do dziś kończył się na
   „czymś w głębi lasu" i to „coś" było domyślnym finałem. Dziś **las jest
   szczeblem, nie szczytem**: jest **warsztatem**, a nie siedzibą — miejscem,
   gdzie gracz ogląda SKUTKI działalności kogoś, kto jest gdzie indziej. Szczyt
   zostaje **świadomie pusty** i wolno mu takim zostać długo.
2. ⚠⚠ **Szary jest OBJAWEM, nie źródłem.** Zabicie go zamyka lokalne zagrożenie
   i obowiązek powierzony przez wieś — **nic wyżej**. Napór nie ustaje: wilków
   przybywa, potem problem przestaje dotyczyć wyłącznie wilków.
3. **Dopisana reguła czytania:** *każdy szczebel wygląda jak szczyt, dopóki
   gracz na niego nie wejdzie.* ⛔ Ujawnienie wyższego szczebla przed czasem
   psuje całą konstrukcję.
4. **Napięcie FALUJE, nie rośnie monotonnie.** Po kulminacji przychodzi
   świadomy oddech: zwyczajne zadanie → podróż do najbliższego miasta →
   powrót → **odkrycie, że pod nieobecność bohatera zrobiło się gorzej** →
   druga eskalacja. ⚠ Oddech jest narzędziem, nie przerwą: ma dać poczucie
   zamknięcia, żeby powrót mógł je odebrać.
5. **Kolejność odsłaniania zapisana jako tabela.** Pierwsza fala: cisza,
   ubywanie odgłosów, niepokój. ⛔ **Bez ciał i odoru.** Rozkład, zwłoki
   i ślady nienaturalnego — dopiero druga fala.
6. ⚠⚠ **Hałas jest objawem, cisza jest źródłem.** Fauna ucieka OD warsztatu,
   więc bliżej niego jest pusto, a dalej tłoczno. Odwrotna intuicja („im
   głębiej, tym więcej potworów") łamie logikę zjawiska.
7. **Skala: Zagaje są punktem startowym, nie światem.** Zapisany **wymóg
   strukturalny** (nie konkretne miejsca — tych świadomie nie wymyślono):
   struktura musi udźwignąć rozwój poza Zagajami, kolejne ośrodki wiedzy,
   innych trenerów i rosnącą skalę konfliktu.
8. ⚠⚠ **Patryczek nie jest źródłem całej wiedzy potrzebnej do końcowego
   rozwoju.** To nie jest uwaga fabularna, tylko wymóg — i pokrywa się
   z komentarzem, który stał w `GameConfig` przy `PROFICIENCY.mastery.trainer`
   („pierwszy i testowy trener") oraz z `OI-28`/`OI-46`. **Zagaje mają przestać
   być WYSTARCZAJĄCE, nie przestając być WAŻNE.**

**§7 „Dalszy łańcuch" przestał być odłożony** — wątek wyjazdu do miasta dostał
rolę: jest **oddechem** między falami. ⚠ Powodem wyjazdu zostaje
**nierozwiązany problem z wilkami** („nie ma komu iść"), a wyjazd staje się
możliwy dzięki temu, co gracz zrobił z najbliższą watahą. ⛔ Podróż nie może
być pretekstem do pokazania miasta — pretekst widać.

**Sześć pytań przeniesionych do `## Czego ten łańcuch świadomie nie
rozstrzyga`** — najważniejsze: **dlaczego ŻYWA fauna ucieka od tego, co robi
się z martwymi** (fizyka świata, nie antagonista) oraz **czym jest drugi
ośrodek zdolności** — z zapisaną obserwacją, że odpowiedzią może być gildia
bohaterów, która **już jest w premisie postaci** jako jego marzenie. ⛔ Żadnego
z nich nie rozstrzygnąłem.

⚠ **Koszt: `swiat.md` urósł 50,4 → 57,2 KB** przy limicie 40 KB dla `KANON`
(`OI-84`, ostrzeżenie `§R`, nie błąd). ⚑ Naturalnym cięciem jest tabela
**„Status — co już jest w grze"**, bo to jest `OI-5` — mechanika w dokumencie
`KANON`, wprost wbrew kontraktowi §2.2. ⛔ Nie wyciąłem jej: `OI-5` stoi
w rejestrze jako `DESIGN`, czyli decyzja autora.

Weryfikacja: `node tools/doc_check.mjs` — **0 błędów**, 25 ostrzeżeń (bez
zmiany liczby); `git status src/` czysto.

---

## 2026-09-08 (2) — Porządek zadań: jedna lista `OI` + cleanup dokumentacji fabularnej

⛔ **Zero zmian w `src/`.** Sesja porządkowa: nic w grze nie działa dziś
inaczej. Zweryfikowane `git status` — `src/` nietknięte.

### Część A — zadania

**Znalezione:** rejestr `OI` żył w **dwóch** miejscach naraz. `PROJECT_DOCS_CHECKPOINT.md`
→ `OPEN ISSUES` niósł 85 wierszy, a sekcje `## Otwarte` w `docs/systemy/*.md`
niosły te same sprawy **w pełniejszym brzmieniu**. Porównanie `OI-49` w obu
plikach przesądziło kierunek: checkpoint miał wersję SKRÓCONĄ, więc to on był
kopią, a nie odwrotnie.

**Zrobione:**

1. **Nowy `docs/zadania.md`** — jedyna kanoniczna lista, **wyłącznie indeks**:
   id, kategoria, etykieta, adres pełnego opisu. ⛔ Świadomie **nie zawiera
   opisów** — kopia opisu byłaby trzecim źródłem prawdy.
2. **Checkpoint zawężony do własnego tematu** — 72 wiersze o mechanice gry
   usunięte jako duplikat; zostało 13 dokumentacyjnych. Historia jest w gicie.
3. **Bilans: 86 numerów → 77 aktywnych, 2 odłożone, 6 zamkniętych,
   1 odrzucony.**

⚠⚠ **Najważniejsza liczba nie jest liczbą zadań, tylko ich rozkładem:
`DESIGN` to 43 z 77.** Projekt czeka dziś na **decyzje autora**, nie na
implementację. `BUG` są trzy.

**Sprzątnięte rozjazdy** (każdy zmierzony na kodzie, nie przyjęty z dokumentu):

| co kłamało | prawda | gdzie |
|---|---|---|
| `CLAUDE.md`: „14 zadań u dziewięciu dawców", „68 tematów", „pięciu ziół" | **15 zadań u 10 dawców, 73 tematy, 11 ziół** | policzone z `GameConfig` |
| `odlozone.md` §1: ujście złota „⚠ ZERO KODU" | rangi Mastery są w kodzie od 2026-09-03 (`masteryOffer`, sprzedaż u Patryczka); otwarte jest **CONTENT** (`OI-28`/`OI-46`), nie implementacja | `docs/odlozone.md` |
| `konfiguracje_broni_checkpoint.md` §3.1: „git status powinien dać 32 M + 5 ??" | w commicie `dc79745` i trzech po nim | dokładnie ta klasa pomyłki, przed którą ostrzega baner tego dziennika |
| `items.md` niósł `OI-8` i `OI-9` w **starszym brzmieniu** niż `armor.md`/`shields.md`, gdzie obie zostały rozstrzygnięte | wiersze usunięte, zostaje wskazanie domeny właściciela | trzy nagłówki `otwarte:` poprawione |
| `DOC_CONTRACT.md` nagłówek: `otwarte: [… OI-7]` | `OI-7` nie odtwarza się od 2026-09-07; wpisano `OI-37` | — |
| `README.md`: `docs.rar` | plik nie istnieje w repo | nazwa usunięta |
| `CLAUDE.md` → „⏳ Otwarte": **37 linii ✅ ZAMKNIĘTYCH** rzeczy o lesie | skrócone do 11; otwarte zostaje tylko ETAP A i dwa fallbacki z `plan_dalszych_prac.md` | — |

**Cztery werdykty autora przyjęte i zapisane** (P0-1, P0-2, P1-1 zweryfikowane
w kodzie przed zapisem, nie na słowo):

- `P0-1` (ruch/AI w przestrzeni ciał), `P0-2` (zasięg w DW — potwierdzone
  w komentarzu `GameScene.offhandStrike`, naprawione 2026-09-07),
  `P1-1` (stara geometria) → **ZAMKNIĘTE**.
- ⛔ `P1-2` / **`OI-35` → ODRZUCONE. Nie implementować.** Kęs wilka zostaje
  testowany samym dystansem. Zdjęte z `otwarte:` w `combat` i `creatures`,
  wpisane do sekcji ODRZUCONE — ⚠ **narzędzie do naprawy istnieje i to nie
  jest powód, żeby go użyć.**
- `OI-40` bez zmian: `CALIBRATION`, dwie liczby, ⛔ nie nudgować.

### Część B — fabuła, lore, świat

⚠ **Nie było czego czyścić i to jest wynik, nie uchylenie się.** Klasyfikacja
z 2026-09-07 zrobiła tę pracę: `swiat.md` i `wioska_plan.md` mają `KANON`,
pięć analiz narracyjnych ma `HISTORIA` ze `stan: zamkniety`, `pomysly.md` jest
jawnie niezatwierdzony. **Zero dokumentów fabularnych usunięto, zero
przeniesiono, zero przeklasyfikowano.** `wioska_plan.md` nie jest sprzeczny ze
`swiat.md` — cytuje go i pogłębia (§6.1 wprost: „`swiat.md` szacuje 14–16 baz
i ma rację").

⚠⚠ **Jedno realne znalezisko, zmierzone na żywej konfiguracji: DWOJE
MIESZKAŃCÓW ZAGAJÓW ISTNIEJE W GRZE I NIE ISTNIEJE W KANONIE.**

**Patryczek** i **Anna** stoją na `village-zagaje.tmj`, mają portrety
(`tools/build_patryczek.py`, `tools/build_anna.py`), kwestie i rozmowy —
i **nie ma ich ani w `swiat.md`, ani w `wioska_plan.md`**, czyli w obu
dokumentach, które ten projekt każe otworzyć „zanim napiszesz cokolwiek, co
gracz przeczyta". Cała reszta rosteru (17 z 19) jest w obu.

To nie jest brak w kodzie — to **treść, która weszła do gry z pominięciem
kanonu**, i waży więcej, niż wygląda:

- **Patryczek jest jedynym sprzedawcą rang Mastery**, czyli bramą do całego
  systemu biegłości (`PROFICIENCY.mastery.trainer = "patryczek"`). Jego
  charakterystyka — **ręka w łubkach**, „nigdy nie prosi wprost" — jest wprost
  powodem, dla którego uczy zamiast pokazywać. **Zagaje mają więc drugą po
  Myśliwym postać okaleczoną tak, że przestała robić swoje**, a `swiat.md` §2
  nie wie, czy to echo tego samego wydarzenia, czy zbieg okoliczności. To jest
  pytanie o **kręgosłup przyczynowy**, nie o metrykę NPC-a.
- **Anna** rzuca zaczep („jak szukasz kudłatej rudej suki, to ja też"), który
  nie ma dziś kontynuacji nigdzie.

⛔ **Lore im nie dopisano — świadomie.** Kim są, z czyjego są obejścia i czy
zaczep Anny ma cokolwiek znaczyć, jest **decyzją autora**. Zapisane jako
`swiat.md` §7 pytanie 5 (pełny opis) + baner nad `wioska_plan.md` §5, żeby
nikt nie wyciągnął z tej listy wniosku „skoro go tam nie ma, to go nie ma
w grze".

**Pozostałe otwarte pytania fabularne — bez zmian, bo są autora:** gildia
bohaterów (osiągalna czy zapowiedź), cykliczność trzebienia zajęcy, rola
Myśliwego po śmierci Szarego, chlew Witka i świnie stojące w zbożu
(`odlozone.md` §1), nazwa „Zagaje" wciąż formalnie robocza.

### Weryfikacja

```
node tools/doc_check.mjs ..... 0 BŁĘDÓW (bez zmian), OSTRZEŻEŃ 24 → 25
git status src/ .............. czysto — ZERO zmian w kodzie gry
```

⚠ Nowe (25.) ostrzeżenie `§R` to **`docs/zadania.md` — 16,9 KB, próg
ostrzeżenia dla `OPERACYJNE` przy limicie 20 KB**. Świadome: plik jest w 90%
tabelą i rośnie tylko o wiersz na sprawę. ⚠ Gdyby dobił do limitu, cięciem
**nie jest podział listy** (to znowu dwa źródła), tylko zamknięcie spraw.

⚠ `swiat.md` urósł 48,9 → 50,4 KB o pytanie 5 i **był ponad limitem już
wcześniej** (`OI-84`) — nie jest to nowe ostrzeżenie. ⛔ Cięcie tego pliku to
praca nad TREŚCIĄ i należy do autora; nie robię go przy okazji porządków.
`DOC_CONTRACT.md` został **bez zmiany rozmiaru** (21,4 KB) — edycje były
świadomie neutralne, bo `OI-37` mówi, że ma ~9 bajtów zapasu.

---

## 2026-09-08 — ⚗ EKSPERYMENT: `BaseHumanoid`, prototyp postaci 3D w Blenderze

⚠⚠ **To jest kierunek EKSPERYMENTALNY, nie decyzja o przepisaniu gry.** Nic
z tego nie dotyka kodu gry, Phasera, ekwipunku ani sprite'ów w `public/assets/`.
Gra dalej stoi na pixel-arcie 2D. Plik `.blend` leży w `blender/`, **poza
`public/`** — świadomie, bo cokolwiek w `public/` Vite wrzuca do builda,
a plik źródłowy 3D nie ma czego robić w paczce dla przeglądarki.

**Zakres:** bazowy humanoid low-poly jako przyszła wspólna baza dla gracza,
NPC-ów i reszty humanoidów — model + rig + kamera testowa. **Zero animacji,
zero eksportu, zero integracji** (jawnie odłożone przez autora).

**Model:** 16 brył (głowa, szyja, klatka, biodra, po dwa: ramię/przedramię/
dłoń/udo/łydka/stopa), 1160 trójkątów, wysokość **dokładnie 2,000 m** przy
konwencji świata 1 kafel = 1 m — czyli 2 kafle wzrostu, zmierzone, nie
przyjęte na słowo. Cztery płaskie materiały (skóra / tunika / spodnie / buty),
bez tekstur.

**Rig:** `Root → Hips → Spine → Neck → Head` + osobne łańcuchy kończyn,
17 kości, sztywne bone-parenting bez skinningu (świadomie — pod idle/walk/
attack/hurt/die to wystarcza, a nie wymaga malowania wag).

### Dwie rzeczy warte zapamiętania na przyszłe sesje w Blenderze

⚠ **Nazwy węzłów shaderów są PRZETŁUMACZONE.** Blender autora chodzi po
polsku, więc `nodes.get("Principled BSDF")` zwraca `None` — węzeł nazywa się
„Pryncypialna BSDF". Szukaj po `n.type == 'BSDF_PRINCIPLED'`, nigdy po nazwie.

⚠ **`Base Color` przyjmuje wartości LINIOWE, nie sRGB.** Wpisanie tam liczb
odczytanych jak z color pickera daje wyprane, szarawe kolory — brązy schodzą
do szarości, bo krzywa gamma ściska różnice między kanałami. Trzeba
przepuścić przez `srgb_to_linear()` przed przypisaniem. Ta sama klasa błędu
co przy palecie drewna dzień wcześniej, tylko z drugiej strony.

### Weryfikacja pivotów — test izolowany, nie „wygląda dobrze"

Obrót JEDNEJ kości naraz + pomiar, czy sam staw stoi w miejscu (pivot na
stawie), a człon poniżej się rusza (transformacja propaguje):

| staw | przesunięcie stawu | ruch członu poniżej |
|---|---|---|
| łokieć / kolano / bark / biodro / kręgosłup | **0,000000 m** | 0,12–0,32 m |

Zero na wszystkich pięciu. Test łączony (kilka kości naraz) tego NIE dowodzi —
mieszają się w nim rotacje rodziców i każdy wynik wygląda „rozsądnie".

**Pozostałe QA:** stopy na z=0 · symetria L/P **0,000000 m** na sześciu parach ·
17 kości, zero nadmiarowych · kamera ortho 3/4 pod 55° (nie dosłowny top-down
90° — sprawdzone renderem, że z 90° widać wyłącznie czubek głowy i końce
butów, postać jest nieczytelna).

`.mcp.json` w korzeniu podpina serwer Blender MCP do projektu — bez niego
sesja Claude Code nie widzi narzędzi Blendera (konfiguracja z
`claude_desktop_config.json` **nie** działa dla zakładki Code).

---

## 2026-09-07 (5) — Korekta palety: stosy drewna odstawały kolorem od lasu

Zgłoszenie autora po obejrzeniu wpisu (4) w działającym lesie: kłody wyraźnie
odstają — za ciepłe, żółto-brązowe, inny charakter niż drzewa/dekoracje.
Zakres: **wyłącznie kolor**, zero zmian geometrii/rozmiaru/układu, zero nowej
grafiki, zero podrasowania artystycznego.

**Dlaczego poprzednia ocena („mieści się w rampach") była błędna.** Wpis (4)
sprawdzał wyłącznie ŚREDNIE HSV całego sprite'u i uznał je za wystarczająco
bliskie `kora`/`drewno`. To był zły test: paleta świata desaturuje w stronę
światła (każda rampa w `gen_palette.py` ma `s_swiatlo < s_cien`), a render AI
robi odwrotnie — najjaśniejsze piksele (przekroje, połysk wzdłuż pnia) są
NAJBARDZIEJ nasycone. Uśrednienie maskowało dokładnie tę różnicę, którą
`tools/snap_paleta.py` już raz opisał (nagłówek, sekcja o ogniu): jasny,
nasycony róg palety kradnie uwagę niezależnie od tego, jak wygląda średnia.

**Weryfikacja przed naprawą** (per prośbę autora — porównanie z żywym
`tree_stamps`/`forest_decor_atlas`, nie z formułą): zmierzone piksele
`oak_stump_fresh` z `forest_decor_atlas.png` (H≈25–39°, S spada z 0,69 przy
korze do 0,41 przy jasnym przekroju, V rośnie 0,10→0,96) potwierdziły ten sam
kierunek co formuła `gen_palette.py` — akceptowana grafika w grze **też**
desaturuje w stronę światła, mimo że sama nigdy nie przeszła przez
`snap_paleta.py` (katalog assetów już to notował: pniaki gatunkowe to „pure
crop, no recolour").

**Naprawa — dokładnie metoda `snap_paleta.py`, na całym arkuszu źródłowym.**
Nearest-neighbor RGB do zbioru `kora`(5) + `drewno`(5) + `piasek`(4, **bez**
najjaśniejszego `#f9ecad` — ten sam złocisty żółty, którego unika ognisko) +
`neutralne`(3, kontur) = 17 kolorów. Raport: każda rampa dostała piksele
(kora 187 686 / drewno 165 948 / neutralne 142 973 / piasek 112 541), zero
pustych — 96 380 kolorów źródła → 17. Zastosowane na **całym**
`stosy-i-klody.png` (nie na sześciu już wyciętych plikach), potem sześć
plików z wpisu (4) wycięte PONOWNIE z tymi samymi bboxami i współczynnikami
skali co poprzednio — finalne wymiary bit-w-bit identyczne (45×34, 72×46,
29×34, 54×40, 110×26, 19×38), zmienił się wyłącznie kolor.

⚠ **Limit ≤64 kolorów dotyczy PALETY ŹRÓDŁOWEJ (17 klastrów), nie finalnego
pliku po skalowaniu.** LANCZOS przy pomniejszaniu miesza sąsiadujące kolory z
tych 17 w płynne przejścia na krawędziach — zmierzone ~400–2200 unikalnych
RGBA per plik, **tyle samo co PRZED korektą** (kontrolne przeliczenie starej
wersji `woodpile_small` dało 1295, nowa ma 1211 — brak regresji, to jest
zachowanie samego resample'u, nie tej zmiany). Docelowe grzebanie w tym
schodzi do Pixel Snappera, nie do tego kroku.

### Weryfikacja

- ✅ Render: zestawienie przed/po (rząd 1 arkusza) i kompozyt obok
  `oak_stump_fresh`/pnia drzewa z `tree_stamps.png` — spójna rodzina barw.
- ✅ Wszystkie cztery kompozyty stref (A1/A5/A7/A8) z wpisu (4) przeliczone
  ponownie z nowymi plikami — drewno przestało „świecić" na tle koron i
  kamieni, reszta układu (pozycje, odstępy) nietknięta.
- ✅ `npm run build` czyste. Zero zmian w kodzie — wyłącznie piksele.
- Kopia oryginalnego (sprzed korekty) `stosy-i-klody.png` zachowana w
  scratchpadzie sesji, nie w repo — jeśli autor zechce porównać albo cofnąć.

`docs/katalog_assetow.md` §1.7 poprawione w miejscu (nie nowy akapit) — stary
akapit „bez recoloru, snap niepotrzebny" był po prostu nieaktualny/błędny.

---

## 2026-09-07 (4) — Las: stosy drewna i dłużyce (K2, `stosy-i-klody.png`)

Zadanie autora: zintegrować nowy arkusz `stosy-i-klody.png` jako dekorację
gospodarki leśnej — stosy, dłużyce, luźniejsze kupki. Wyłącznie dekoracja:
**bez** lootowania, zbierania, craftingu, NPC i bez kolizji, o ile dekoracja
jej nie wymaga. Zakaz zapychania przestrzeni odzyskanej przy okazji korekty
zagęszczenia drzew (wpis (3) wyżej, ta sama sesja).

**Research przed zmianą** potwierdził dokładnie tę lukę:
`docs/katalog_assetow.md` §1.7 miał „stosy drewna / dłużyce — ❌ TODO, brak
jakiegokolwiek pliku" od dawna (jedna z siedmiu pozycji K1–K10
`forest_rebuild_scope.md` §6.3). Wzorzec integracji skopiowany 1:1 z pniaków/
kamieni/krzewów (§1.2/§1.5/§1.3): pojedynczy statyczny obrazek na
`DECOR_PROPS`, punkt w Tiled, **bez fizyki** — obiekty punktowe bez `gid` i
tak nie dziedziczą kolizji drzew.

**Wybór z arkusza (22 gotowe sprite'y → użyto 6).** Connected-component
rozdzielił arkusz na 22 osobne kompozycje: 6 uporządkowanych stosów
(front-widok, rzędy kłód), 6 luźniejszych kupek (widok po skosie), 6 dłużyc
leżących, 4 odcięte odcinki pnia postawione pionowo. Zamiast całych 22 —
sześć wariantów po brifie autora („modularność: mały stos, większy stos,
dłużyca pozioma, dłużyca pionowa, 2–3 luźne kłody", nie jeden ogromny stempel
ze wszystkim): `woodpile_small`, `woodpile_large`, `logs_loose`,
`logs_scattered`, `log_horizontal`, `log_vertical`.

**Paleta: bez zmian, bo nie było potrzeby.** Zmierzone HSV materiału
(H≈36°, S≈0,49, V≈0,32) leży już wewnątrz ramp `kora`/`drewno`
(`tools/gen_palette.py`) — inaczej niż `items.png`, który wymagał snapu przy
ikonach jedzenia. Jedyna obróbka: crop per sprite (premultiplied-alpha
resize, żeby uniknąć ciemnej otoczki przy pomniejszaniu) i skalowanie.

**Skala: sześć NIEZALEŻNYCH współczynników, nie jeden wspólny.** Dłużyce to
niełupane odcinki pnia (grubsze z natury), stosy to już rozłupane szczapy —
jeden mnożnik rozdąłby kłody albo spłaszczył stosy. Każdy wariant skalowany
do wysokości/długości mieszczącej się w podanym przez autora paśmie (stos
1–2 m, dłużyca kilka metrów, gracz ≈ 2 kafle), zweryfikowanej porównaniem z
realnym `oak_stump_fresh.png` (41×33 px) i klatką gracza (31×60 px) — nie
przez oglądanie samego arkusza źródłowego. Finalne rozmiary i `renderLayer`
(background/ysorted wg tego samego progu ~60–75% wysokości gracza, co przy
pniakach/krzewach): tabela w `docs/katalog_assetow.md` §1.7.

**Rozmieszczenie: 15 obiektów, nowa warstwa `drewno`** w obu kopiach
`forrest.tmj` (wzorzec `krzewy`/`kamienie`/`flora-wodna` — osobna warstwa
filtrowalna w Tiled). Gradient z `forest_rebuild_scope.md` §2 (A1 najgęściej
i najporządniej → A8 porzucone), NIE sztywny podział: **A1** 5 szt., **A5**
5 szt. malejąco ku wschodowi, **A7** 2 szt. („ostatni sąg", nic dalej na
wschód), **A8** 3 szt. (porzucona składnica). Dobór punktów filtrował
kandydatów po: 1–7 drzew w promieniu 110 px (dekoracja przy realnym
drzewostanie, nie w pustce po korekcie zagęszczenia z wpisu (3)), ≥26 px od
istniejącej dekoracji, ≥140 px od spawnu stworzenia/ogniska/kupca/portalu,
poza kaflami `path`/`water`/`sand`. Wszystkie 15 punktów zweryfikowane
osobno (zero naruszeń progów) i obejrzane na renderze — patrz niżej.

### Weryfikacja

- ✅ `npx tsc --noEmit` i `npm run build` czyste.
- ✅ `node tools/atlas_weryfikacja.mjs` — „88 wpisów DECOR_PROPS ma poprawny
  asset.key" (było 82; +6 nowych, zero regresji na starych).
- ✅ `node tools/culling_geometria_weryfikacja.mjs`,
  `node tools/occlusion_weryfikacja.mjs`, `node tools/gathering_kompletnosc.mjs`
  — wszystkie zielone, nietknięte tą zmianą (czysto geometryczne/inna domena).
- ✅ Round-trip obu `.tmj`: diff to WYŁĄCZNIE nowa warstwa `drewno` (15
  obiektów) — sprawdzone `git diff --stat` (jedna linia na plik, bo eksport
  Tiled jest jednowierszowy JSON) i inspekcją listy warstw przed/po.
- ✅ **Obejrzane, nie tylko policzone** (reguła numer jeden `tools/CLAUDE.md`):
  panel przeglądarki tej sesji wywala WebGL (`Framebuffer status: Incomplete
  Attachment`) **przed** wczytaniem jakiejkolwiek mapy — ten sam, niezależny
  od zmiany awaria co 2026-08-29/2026-09-07 (3). Zamiast tego: kompozyt
  złożony z PRAWDZIWYCH sprite'ów (nowe drewno + realne kadry
  `forest_decor_atlas.png` dla sąsiednich pniaków/kamieni/krzewów + przybliżone
  korony drzew z żywych współrzędnych `.tmj`) dla wszystkich czterech stref —
  żaden nowy obiekt nie nachodzi na pień, ścieżkę ani na inny punkt dekoracji,
  skala względem koron/pniaków/kamieni czyta się spójnie.
- ⏳ **NIE zweryfikowane w silniku** (ten sam powód co wpis (3)) — do
  sprawdzenia ręką: `window.dev.missing` puste, `load.totalFailed` 0, render
  w Tiled/grze pokazuje 15 nowych obiektów na warstwie `drewno`.

### Obserwacja poza zakresem (niezgłaszana do naprawy tą sesją)

⚠ **Niedźwiedź wciąż stoi na starej pozycji (84,15 / px 2692,486), nie w A8.**
`forest_rebuild_scope.md` §5 (S3) i root `CLAUDE.md` „Otwarte" opisują to jako
znaną, otwartą pozycję planu — potwierdzone tu skanem żywego `.tmj`, nie z
dokumentacji. Nie ruszone: poza zakresem tego zadania (dekoracja drewna, nie
przesunięcia spawnów).

---

## 2026-09-07 (3) — Las: korekta zagęszczenia drzew (−46, **2,80 %**)

Zadanie autora: **bardzo delikatnie** rozluźnić las, żeby miejscami miał więcej
oddechu na ruch, manewrowanie, szarże i przyszłe ataki dystansowe. Limit
**10 % (164 drzewa) jako SUFIT, nie cel**; wprost: „jeżeli wystarczy 4–6 %,
zostawiamy resztę". Nie przebudowa — teren, rzeka, drogi, gatunki, spawny,
kolizja, AI i pathfinding **nietknięte**. Zmieniona wyłącznie warstwa `trees`
w obu kopiach `forrest.tmj`.

**Wynik: 1641 → 1595 drzew.** Usuniętych 46 = **2,80 %**, czyli 28 % przyznanego
limitu.

### ⚠ Pierwsza miara była zła i warto wiedzieć, dlaczego

Pierwszy ranking liczył, **ile wolnej powierzchni przybywa** po usunięciu
drzewa (suma przyrostu prześwitu w oknie). Na górze listy wylądowały
**samotne drzewa na polanie** — bo wokół nich nic nie stoi, więc przyrost jest
maksymalny. To jest ranking dokładnie odwrotny do zadanego: samotne drzewo na
polanie jest scenerią, a nie barierą, i jego usunięcie to czysta strata
wizualna przy zerowym zysku gameplayowym.

Druga miara, ta użyta: **etykietowanie składowych liczone W OKNIE 4 kafli, nie
globalnie.** Drzewo jest kandydatem tylko wtedy, gdy w oknie 128 px wokół niego
przestrzeń przejezdna dla danego ciała rozpada się na **dwie osobne składowe**,
a po jego usunięciu staje się jedną. Globalnie taki test nic nie wykrywa — las
jest jedną składową nawet dla ciała 48 px (98,5 % powierzchni), czyli objazd
**zawsze** istnieje. To jest ta sama pomyłka, którą opisuje
`las_faza1b_final.md` §10.1: **spójność odpowiada na inne pytanie niż
prześwit.** Objazd, którego nikt nigdy nie wybierze, nie jest objazdem.

Ciała brane z realnych wymiarów (`dev.bodies()`, nie `bodyWidth` z configu —
poprawka 2026-08-28): **48 px** (dzik 46 / Szary / niedźwiedź) i **29 px** (wilk).

### Reguły, które wycinały kandydatów mimo dobrego wyniku

- **Koszt wizualny.** Dla każdego drzewa policzona „korona odsłonięta" = piksele
  nieprzykryte przez żadne inne drzewo. Powyżej 3200 px² kandydat odpada, bo
  zostawia widoczną dziurę. Dzięki temu z gęstej kępy wychodzi drzewo, którego
  koronę i tak zasłaniają sąsiedzi (najniższy przypadek: 17 px² — niewidoczne).
- **Limit skupiska.** Najwyżej **2 cięcia w promieniu 96 px** i **3 w promieniu
  224 px**. Drugie cięcie w tej samej bramie tylko wtedy, gdy po pierwszym
  bariera DALEJ stoi (ponowne liczenie po każdym cięciu to potwierdza) — inaczej
  wycięłoby się pięć drzew tam, gdzie wystarczy jedno.
- **Zakaz korytarza.** Trzy cięcia leżące blisko jednej prostej są odrzucane.
  ⚠ Pierwsza wersja tej reguły miała fałszywy alarm: uznawała za „korytarz"
  parę cięć odległych o 16 px (czyli **tę samą bramę**) plus trzecie 170 px
  dalej. Poprawione: trójka liczy się tylko wtedy, gdy to naprawdę trzy różne
  miejsca (każda para ≥ 96 px).

### Gdzie i ile

| strefa | cięć | dlaczego |
|---|---|---|
| A5 delianki | 10 | najgęstsze knieje przy spawnie gracza i wilku #4 |
| A8 koniec gospodarki | 9 | pas świerkowy x125–130 — cztery bramy 19–27 px |
| A6 olszyna | 4 | siedlisko dzików, przesmyk między rozlewiskami |
| A9 brzeg północny | 4 | rewir niedźwiedzia (ciało 48) |
| A10 źródło (N+S) | 5 | świeży wschód, bramy 17–20 px |
| A4 rzeka | 3 | dojścia do wody, bród nietknięty |
| A5b bór wilków | 4 | patrz niżej — celowo prawie zero |
| A7 dalekie delianki | 3 | siedlisko sieciarzy/skoczków |
| A2 trakt | 2 | zagajnik brzozowy przy trakcie |
| poza (skraj y=59) | 2 | dolna krawędź mapy |

**Świadomie NIE ruszone, mimo że miara je wskazuje:**

- **A5b bór wilków — 63 pozostałe bariery lokalne, budżet 4/327 (1,2 %).**
  Gęstość 60–70 % jest tam ZAMIERZONA (`forest_rebuild_scope.md` A5b:
  „najciemniejszy fragment zachodu, ciasny"), a nawigacja watahy została
  zamknięta 2026-08-31. Cztery cięcia poszły wyłącznie w kieszenie dla ciała
  wilka, spawny nietknięte.
- **A3 obejście Myśliwego — 9 barier, budżet 0.** Ściana dębów i buków na
  wschód od chaty **jest projektem**, nie przypadkiem: „jedyna twarda krawędź
  lasu na mapie i ma taka być". Cztery z tych barier mają najwyższy wynik na
  całej liście (14 k px²) i zostają.
- **A1 wyrąb — budżet 0.** Gęstość 20–30 % już jest zamierzona.
- **Wierzby (8 szt.) — chronione po nazwie.** Landmarki nad wodą.

### Pomiar przed/po (nie liczba drzew, tylko przestrzeń)

| miara | przed | po |
|---|---|---|
| **drzewa tworzące barierę lokalną** | **243** | **110** |
| — z tego poza strefami chronionymi | 159 | **38** |
| składowe przestrzeni dla ciała 48 px | 100 | **86** |
| kieszenie < 4000 px² (ciało 48 px) | 95 | **84** |
| składowe dla wilka (29 px) | 58 | 54 |
| przejezdna powierzchnia — dzik | 60,71 % | 61,27 % |
| przejezdna powierzchnia — gracz | 86,40 % | 86,74 % |

Przestrzeń manewrowa (spójny obszar w promieniu 8 kafli od spawnu):
**wilk #3 41 775 → 67 955 px² (+63 %)**, GreyWolf 12 257 → 15 953 (+30 %),
dzik #1 72 300 → 77 765 (+7,5 %). Najdłuższy odcinek pełnej szerokości przy
spawnie skoczka #2: 388 → 596 px.

**Szarża ma gdzie się odbyć — sprawdzone liczbą, nie na oko.** Szarża dzika to
`300 px/s × 420 ms = 126 px` drogi przy wyzwoleniu ≤ 175 px
(`BOAR.charge`). Krótszy z dwóch odcinków przy spawnach dzików ma **212 px**,
dłuższy 528 — czyli mieści się z zapasem. Odcinki przy sieciarzach (LOS do
sieci) 520–636 px. **Nic tu nie było dodawane pod szarżę** — to pomiar
zastanego stanu po cięciach, zgodnie z zakresem („oceń, czy geometria daje im
miejsce", nie „projektuj mechanikę").

### Weryfikacja

- ✅ **Obejrzane, nie tylko policzone.** Render całej mapy przed i po
  (własny rasteryzer w scratchpadzie: kafle + stemple drzew sortowane po Y),
  do tego kontaktówka **przed | po dla każdego z 46 cięć** w kadrze 12×12
  kafli. Trzy kandydatury odrzucone na renderze, nie na liczbie.
- ✅ **Różnica na całej mapie: 0,693 % pikseli.** Przy oglądaniu obu wersji
  obok siebie w skali mapy są nie do odróżnienia — charakter lasu (gęsty bór
  SW, kępy, polany) bez zmian.
- ✅ `npm run build` (z `tsc --noEmit`) czysty. `gathering_kompletnosc.mjs`
  zielony — 11 gatunków, stanowiska ziół na mapie nienaruszone.
- ✅ Round-trip `json.dumps` obu `.tmj` jest **bajt w bajt** identyczny przed
  zapisem (sprawdzane asercją w skrypcie), więc diff zawiera **wyłącznie**
  46 usuniętych obiektów — zero przenumerowania warstw i firstgidów.
- ✅ Żadna dekoracja nie osierocona: sprawdzone 810 punktów
  (`rosliny`/`krzewy`/`kamienie`/`flora-wodna`/`objects`) — najbliższy to krzew
  32 px od usuniętego pnia, nic nie „wisiało" na drzewie.
- ⏳ **NIE zweryfikowane w silniku.** Panel przeglądarki tej sesji wywala
  WebGL (`Framebuffer status: Incomplete Attachment`) i zatrzymuje loader na
  dźwiękach — **przed** wczytaniem jakiejkolwiek mapy, więc awaria jest
  niezależna od tej zmiany (ten sam panel dławił się już 2026-08-29,
  `tree_instances.md` §5). Do sprawdzenia ręką: `dev.treeProto.forest()` →
  `window.dev.missing` puste, `load.totalFailed` 0, liczba pni **1595**.

Skrypty (miara, wybór, render, nałożenie cięć) **nie zostają w `tools/`** —
wzorzec zmiany punktowej z `tools/CLAUDE.md`. Lista 46 `id` obiektów Tiled
została zachowana, bo pozwala nałożyć te same cięcia na dowolną późniejszą
wersję `.tmj` (odporna na przenumerowanie `firstgid` przy zapisie w Tiled —
operuje na `id`, nie `gid`).

### Po zaciągnięciu `dc79745` (tego samego dnia)

Sesja robiła cięcia **przed** wciągnięciem twojego commitu; mapa nie była w nim
tknięta, więc `git pull --ff-only` przeszedł bez konfliktu i 46 cięć przetrwało
bez ponownego nakładania. Dwie rzeczy z tamtego commitu dotykają jednak tego
zakresu:

- **`OcclusionGrid`/`Occluders`** — każda korona rejestruje się dziś jako
  zasłona. 46 drzew mniej = 46 occluderów mniej; nic strukturalnego, bo rejestr
  jest budowany z żywej warstwy `trees`. `tools/occlusion_weryfikacja.mjs`
  chodzi po `TREE_STAMPS` (manifest), nie po mapie — na tę zmianę jest ślepy
  i **taki ma być**.
- **`forest_rebuild_scope.md` dostał `stan: zamkniety`** — więc dopisku o tej
  sesji tam NIE ma i nie będzie (kontrakt §2: dokument zamknięty nie jest już
  zmieniany). Liczba drzew żyje w `katalog_assetow.md` (`KANON`), narracja tutaj.

Skrypty (miara, wybór, render, nałożenie cięć) **nie zostają w `tools/`** —
wzorzec zmiany punktowej z `tools/CLAUDE.md`. Zachowana została lista 46 `id`
obiektów Tiled: pozwala nałożyć te same cięcia na dowolną późniejszą wersję
`.tmj` i jest odporna na przenumerowanie `firstgid` przy zapisie w Tiled
(operuje na `id`, nie `gid`).

---

## 2026-09-07 (2) — Odchudzenie dokumentacji walki: 27 dokumentów usuniętych

**Zakres:** dokumentacja ośmiu domen walki (`combat`, `weapons`, `armor`,
`shields`, `abilities`, `effects`, `stamina`, `proficiency`). ⛔ **Zero zmian
w mechanice**: żadnej liczby obrażeń, zasięgu, staminy, cooldownu ani kosztu.
`npx tsc --noEmit` czysto, `combat_regresja` bez różnic.

**Co się stało.** Dokumentacja walki odpowiadała na pytanie „jak do tego
doszliśmy" dziesięć razy dokładniej niż na „jak to działa teraz". **27
dokumentów (~1,1 MB) zostało USUNIĘTYCH** — nie przeniesionych do archiwum,
nie oznaczonych, usuniętych. Historia jest w gicie i to jedyne miejsce, gdzie
ma być. Największe: checkpoint biegłości 254 KB, audyt Combat v2 92 KB, analiza
tarcz 89 KB, audyt walki i progresji 70 KB.

**Co ocalono, zanim znikły:**

* **trzy decyzje** — `2026-09-07-obrona-wroga-nie-istnieje.md` (wróg nie ma
  bloku ani parowania, więc dwie cechy tożsamości 2H są **strukturalnie
  nieosiągalne**, a defensywna połowa „commitment" już istnieje i nikt jej nie
  zaprojektował), `2026-09-07-prog-zasiegu-orbity.md` (skąd bierze się próg
  zasięgu, czemu przejście przez niego jest **binarne** — 22,2% wobec 97,1%
  cyklu orbity — i czemu pas ±2 px jest zakazany) oraz
  `2026-09-07-odchudzenie-dokumentacji-combat.md` (sama zasada);
* **pięć pytań playtestowych warstwy 2** → `odlozone.md` §2, razem
  z częstościami per stworzenie (królik 23,2% ciosów nieczystych — jedyny
  praktyczny przypadek do weryfikacji ręką);
* **trzy kierunki** → `pomysly.md`: Szarża jako model dzika (z dwiema twardymi
  zależnościami: brak pola masy u przeciwników i **brak collidera
  `player × enemies`**), udźwig jako oś rozwoju, pancerz wielowarstwowy.

**Sekcje „Gdzie szukać POWODÓW" w ośmiu `STAN`-ach przepisane** — wskazują dziś
rejestry decyzji z `docs/proces/ekstrakcja_*.md` (te zostają: to **werdykty
z `moc`**, w formie krótszej niż dokument źródłowy) i trzy nowe decyzje.

⚠ **236 odwołań przepiętych w 55 plikach**, w tym w komentarzach `src/` —
`GameConfig.ts` sam cytował usuwane dokumenty 34 razy. Odwołanie w kształcie
`` `docs/X.md` §4.3 `` traciło numer rozdziału: sekcja nie przenosi się do
innego dokumentu, a zostawiona kłamałaby. ⛔ **Nie ruszano** `dziennik.md`,
`zaimplementowane.md`, `archiwum/` ani rejestrów ekstrakcji — tam nazwy plików
są **cytatem historycznym albo atrybucją źródła decyzji**, nie łączem.

**Dwa dokumenty `GENEROWANE` rozstrzygnięte przy okazji — bez decydowania za
autora:**

* `macierz_walki.md` **usunięty**. Zapisany snapshot pomiaru zestarzał się dwa
  razy (10 wariantów wobec 16) i kłamał ciszej, niż kłamie jego brak.
  `tools/macierz_walki.mjs` jest od teraz **przymiarem do konsoli**; reguła §T
  w `doc_check` na ten plik usunięta razem z nim.
* `ekwipunek_przedmioty.md` **odświeżony**. ⚙ `OI-7` (niestabilny wynik
  przymiaru) **nie odtwarza się**: trzy przebiegi z rzędu dały identyczne
  9 bloków, a znany błąd o `parryBonus` zniknął z generatora 2026-09-03.

**`OI-40` zawężone, nie zamknięte.** Teza „każda broń poza włócznią jest poza
orbitą" nigdy nie była niezmiennikiem — była **pomiarem rosteru z 2026-08-16**.
2026-08-26 autor świadomie ją utrzymał (pasmo 2H 72–78, pod progiem), a
2026-09-05 równie świadomie **wymienił** ją na cechę tożsamości 2H (zasięg
dwuręcznej obuchowej 74 → 80). Otwarte zostają dwie liczby, nie model.

**Bramki:** `doc_check` **0 BŁĘDÓW** (na starcie sesji 22), `--sabotaz` 17/17,
`doc_export` działa, `npx tsc --noEmit` czysto.

---

## 2026-09-07 — Zamknięcie migracji dokumentacji: klasyfikacja zamiast przeprowadzki

**Zakres:** wyłącznie dokumentacja. `src/` nietknięty, zero zmian w mechanice,
zero uruchomionych generatorów z `--zapisz`.

**Co się stało.** 70 dokumentów w `docs/` nie miało nagłówka maszynowego, więc
kontrakt ich nie obejmował. Wszystkie dostały `typ` / `domena` / `stan` —
**w miejscu**. Stan końcowy: **136 dokumentów, zero bez klasyfikacji** (25
`STAN`, 5 `KANON`, 6 `DECYZJA`, 59 `HISTORIA`, 2 `GENEROWANE`, 39
`OPERACYJNE`). **Nie przeniesiono ani nie usunięto żadnego pliku.**

⚠⚠ **Najważniejsze znalezisko nie dotyczy dokumentów, tylko przymiaru.**
`tools/doc_check.mjs` sprawdzał `tresc.startsWith("---\n")`, a na tej maszynie
`core.autocrlf=true` daje **CRLF na dysku**. Skutek: raport drukował
`z nagłówkiem maszynowym 0 / 147`, a reguły **§N, §K, §Z i §R nie miały czego
sprawdzać od dnia powstania**. Awaria była niema — sekcja bez nagłówków wygląda
identycznie jak sekcja bez uwag. To samo dotyczyło `doc_export.mjs`: `--domena`
nie miało po czym filtrować i odpowiadało „nic nie pasuje do tego zakresu".
Naprawione w obu; sabotaż ma teraz **próbę na nagłówek z CRLF** (17/17), bo
inaczej ta awaria wróci przy pierwszym `git clone` na Windowsie.

**Dlaczego bez przeprowadzki plików.** Census odwołań: **każdy** dokument
w `docs/` jest cytowany przez co najmniej dwa inne (`odlozone.md` 61,
`dziennik.md` 41, `swiat.md` 40, `wioska_plan.md` 37). Przenoszenie wymusiłoby
poprawianie łączy **wewnątrz dokumentów `HISTORIA` i `DECYZJA`** — a te są
z kontraktu **niezmienne**. Ładniejsze drzewo kosztem złamania najmocniejszej
reguły tego systemu to zła wymiana. Zapis i odrzucone warianty:
`docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md`.

**Reszta:**

* **41 dokumentów `HISTORIA` dostało baner** „STAN tej domeny mieszka gdzie
  indziej" z nazwą właściwego `docs/systemy/*.md`. Pominięte te, które miały
  już własny, lepszy baner.
* **`docs/README.md` przepisany na router**: 104 KB → 19 KB, zaczyna się tabelą
  „pytanie → dokument". Pełne opisy zachowane w
  `docs/archiwum/README-opisy-dokumentow-2026-09-07.md` — ten sam ruch, co
  z `CLAUDE-opisy-dokumentow-2026-08-20.md`.
* **`OI-2` zamknięte.** `zaimplementowane.md` przestało być checklistą stanu
  gry; `CLAUDE.md` i indeks przepięte na `docs/systemy/`.
* **§R: przekroczenie limitu jest błędem tylko dla `STAN`** — kontrakt czyni
  limit warunkiem odbioru wyłącznie w §7, a §7 dotyczy tylko `STAN`u. Osiem
  dokumentów stoi ponad limitem i przymiar wypisuje je z nazwy przy każdym
  przebiegu (`OI-84`); cięcie to praca nad treścią i należy do autora.
* Dwie realne poprawki treści: `src/entities/Chicken.ts` → `FarmAnimal.ts`
  (klasa o tej nazwie nigdy nie istniała, kury są `FarmAnimal`) oraz okno
  markera historycznego w przymiarze, które ucinało werdykt stojący linijkę
  niżej niż cytat.

**Bramki:** `doc_check` **2 błędy** — oba to nieodświeżone dokumenty
`GENEROWANE` (`OI-40`, `OI-7`), zablokowane **decyzją autora, nie robotą**:
regeneracja `macierz_walki.mjs` zapisałaby jedną z trzech możliwych odpowiedzi
jako fakt, a `katalog_ekwipunku.mjs` ma niestabilny wynik przymiaru.
`--sabotaz` 17/17, `doc_export` działa, `npx tsc --noEmit` czysto.

---

## 2026-09-06 (2) — Zbieractwo: sześć gatunków bez wpisu przedmiotu (OI-61) + przymiar kompletności

Zadanie: domknąć zbieranie roślin dodanych przy przebudowie lasu. Ustalone
statycznie (bez odpalania gry), z prawdziwej konfiguracji, nie ze starego
audytu: **10 gatunków rośnie w lesie** (`forrest.tmj`) — 4 z pierwotnej piątki
(babka, krwawnik, pokrzywa, dziurawiec) + wszystkie 6 dodanych przy przebudowie
(lebiodka, wrotycz, mięta, nawłoć, dziewanna, żywokost, 30 stanowisk łącznie).
Piąty z pierwotnej piątki (rumianek) rośnie tylko w Zagajach — to content, nie
brak.

⚠⚠ **Sześć nowych gatunków miało gatunek, duszek i stanowiska, ale ŻADEN wpis
w `ITEMS`** — dokładnie `OI-61` z `docs/systemy/gathering.md`, opisane tego
samego dnia wcześniej przez inną sesję. `GameScene.gatherFrom` rzutuje
`plant.herb as ItemId` (`const itemId = plant.herb as ItemId`), więc `tsc` nie
miał szans złapać braku — zebranie którejkolwiek z sześciu kończyło się błędem
wykonania w `Inventory.addItem` (czyta `ITEMS[itemId]`, które jest
`undefined`).

**Naprawa:** sześć wpisów w `ITEMS` (`lebiodka`, `wrotycz`, `mieta`, `nawloc`,
`dziewanna`, `zywokost`), ten sam kształt co pozostałe pięć ziół. ⚠ **Bez
`icon`/`iconTexture` celowo** — skorzystano z ISTNIEJĄCEGO mechanizmu
zapasowego (`makeItemIcons` → kolorowa plamka z `color`), zero nowej
mechaniki. Kolory dobrane z realnych pikseli kwiatów na własnych duszkach
(`public/assets/props/herb_*.png`), nie zmyślone. Ceny (2–5 g) luźno
skorelowane z `respawnSec`, tą samą logiką co dziurawiec w oryginalnej piątce.

⚠ **`OI-61` był w rzeczywistości DWIE rzeczy naraz**, i naprawiona jest tylko
CIĘŻSZA połowa. Ta sama szóstka dalej nie ma konsumenta odkrycia (rozmowa u
Doroty) ani celu zadania — to leży w domenach `quests`/dialog, poza granicą
domeny `gathering` (§0 tego dokumentu), i zostaje świadomie nietknięte.

**Nowy przymiar: `tools/gathering_kompletnosc.mjs`** (połowa `OI-63`, który
mówił „nic nie sprawdza kompletności gatunku"). Czyta PRAWDZIWE `HERBS`/
`ITEMS`/`ASSETS` przez esbuild → node (konwencja `movement_weryfikacja.mjs`),
prawdziwe pliki `.tmj` i prawdziwy literał `HERB_OBJECT_NAMES` z `TiledMap.ts`
(wycięty i NAPRAWDĘ wykonany, nie zgadywany po tekście — `TiledMap.ts` ciągnie
zbyt ciężki graf modułów, żeby bundlować go w całości dla jednej stałej).
Sprawdza komplet czterech rzeczy w OBIE strony: gatunek→dane oraz
`HERB_OBJECT_NAMES`→gatunek (osierocony wpis też świeci na czerwono). ⚠
**Zweryfikowane, że naprawdę świeci na czerwono** — celowo zepsute
`ITEMS.zywokost`, przymiar złapał (`exit 1`), przywrócone, `tsc`+`build` dają
bajtowo identyczny bundle co przed sabotażem.

⛔ **Druga połowa `OI-63` (zgodność stanowiska z siedliskiem) zostaje
otwarta** — `.tmj` nie koduje wprost typu terenu wokół punktu, więc przymiar
nie ma czym tego zmierzyć.

Weryfikacja: `npx tsc --noEmit` + `npm run build` czyste; `node tools/
gathering_kompletnosc.mjs` — 11/11 gatunków kompletnych, zero osieroconych
wpisów; `node tools/doc_check.mjs` — 14 istniejących błędów, żaden nie
dotyczy gatherowania (nietknięte, poza zakresem).

---

## 2026-09-06 — Prawdziwe ikony umiejętności (7 z 9) + naprawa klucza tekstury

Autor dostarczył serię gotowych PNG (transparentne symbole, bez własnego koła/tła)
do podmiany proceduralnych glifów w `makeAbilityIcons`: `szerokie-ciecie.png`
(cleave), `szarza.png` (charge), `wypad.png` (lunge), `uderzenie-tarcza.png`
(shieldBash — podmieniony raz w trakcie sesji na mniejszy, czystszy wariant),
`rozciecie.png` (rend), `mocne-uderzenie.png` (heavyStrike), `bojowy-okrzyk.png`
(warcry). Mechanizm: `REAL_ABILITY_ART` w `Assets.ts` — mapa `AbilityId → ASSETS
entry`; jeśli tekstura się wczyta, `extractTile` kopiuje ją pod klucz
`ability-icon-<id>` zamiast proceduralnego rysunku; jeśli nie, gra **cofa się do
starego glifu** (niezmiennik „gra zawsze się uruchamia").

⚠ **`dodge` i `whirlwind` zostają proceduralne ŚWIADOMIE** — autor uznał je za
kandydatów do przeprojektowania, więc zamawianie/przycinanie realnej grafiki
teraz byłoby pracą do wyrzucenia. Nie generuj im ikon „przy okazji" — dopisane
jako barierka w `docs/odlozone.md` §5.

**Pierwsza wersja `charge`** (z `szarza.png` w oryginalnym kadrze) czytała się
jako niemal ten sam przycisk co `lunge` — zgłoszone przez autora. Źródło nie ma
żadnej widocznej broni (samo ciało + peleryna + smugi), więc jedyną bezpieczną
dźwignią (bez dorysowywania) było POWIĘKSZENIE sylwetki: kolor-po-kolorze
zweryfikowałem, że lewy skraj źródła (x<16) to wyłącznie pył/smuga, zero
peleryny, i przyciąłem go — kadr 57×41 → 44×41, skala w 32×32 20px → 26px
wysokości. Nie rozwiązuje tego do końca (obie ikony dalej dzielą paletę
czerwień/czerń), ale pomaga razem z tym, że przyciski i tak mają różny kolor
obrysu (`ABILITIES.lunge.color` miętowy vs `ABILITIES.charge.color` złoty).

⚠⚠ **Znaleziony PRZY OKAZJI, osobny i starszy błąd: `shieldBash` (i
`heavyStrike`) miały niewidoczną ikonę OD ZAWSZE, nie tylko po dodaniu
realnej grafiki.** `makeAbilityIcons` budował klucz tekstury z `def.id`
(`abilityIconKey(def.id as AbilityId)`), a `AbilityBar`/`PlayerPanel` proszą o
ikonę po **kluczu obiektu ABILITIES** (`AbilityId` = `keyof typeof ABILITIES`).
Dla większości umiejętności oba się zgadzają przypadkiem (`cleave.id ===
"cleave"`), ale `shieldBash.id === "shield_bash"` i `heavyStrike.id ===
"heavy_strike"` — więc generowana tekstura (`ability-icon-shield_bash`) nigdy
nie była tą, o którą proszono (`ability-icon-shieldBash`). Naprawa: pętla w
`makeAbilityIcons` iteruje dziś po `Object.keys(ABILITIES) as AbilityId[]`, nie
po `Object.values(...)` + `def.id`; rysowanie proceduralne (`switch (def.id)`)
zostało nietknięte, bo ono poprawnie operowało na prawdziwej wartości pola.
Dokładnie ten sam wzorzec „cichej rozbieżności" co `combatOrigin` w
`src/core/CLAUDE.md`.

Weryfikacja: `npx tsc --noEmit` + `npm run build` czyste po każdym kroku;
`git status` pilnowany po drodze, żeby żadna tymczasowa zmiana testowa (patrz
niżej) nie została w repo.

⚠ **Notatka dla następnej sesji o przeglądarce weryfikacyjnej w tym środowisku:**
domyślny renderer `Phaser.AUTO` (WebGL) zgłasza `Framebuffer status: Incomplete
Attachment` w tym konkretnym sandboxie przeglądarki — niezależne od kodu gry.
Obejście na czas testu: `main.ts` `type: Phaser.CANVAS`, zawsze **przywrócone**
do `Phaser.AUTO` przed końcem sesji (`git diff src/main.ts` puste).

---

## 2026-09-05 (13) — Dzik dobijał się do gęstwiny: osiągalność liczona i wyrzucana

Trzecie zgłoszenie: gracz staje za gęstwiną, dzik zamiast odpuścić szuka
przejścia bez końca.

⚠⚠ **Przyczyna: informacja o nieosiągalności BYŁA LICZONA I WYRZUCANA.**
`findPath` (A* nad `NavGrid`) zwraca `null`, gdy trasy nie ma — i jest wołane
dla **każdego** `seek` przez `Locomotion`. Ale `PathFollower.next()` zwracał
`null` w DWÓCH różnych sytuacjach: „czysta linia, trasa niepotrzebna" oraz
„trasy NIE MA". Wołający nie miał jak ich odróżnić, więc `Locomotion` w obu
przypadkach zostawiał **surowy `seek` na gracza** — a `SteerSolver` kręcił
lokalnie w nieskończoność.

⚠ **Instrumentacja przed jakąkolwiek zmianą** (sonda na prawdziwych modułach,
cztery układy): `findPath` poprawnie zwrócił trasę dla trzech przechodnich
i `null` dla zamkniętego. **System WIEDZIAŁ.** Przy okazji wyszło, że stan bez
trasy liczył A* **co klatkę** (120/120), bo przy pustej liście `idx >= length`
jest prawdą zawsze.

**Minimalne rozwiązanie — trzy miejsca, zero nowego pathfindingu:**
1. `PathFollower` zapamiętuje `noRoute` i wystawia `unreachable`; `exhausted`
   przestaje wymuszać przeliczenie, gdy wiadomo, że trasy nie ma. Zmierzone:
   **120 → 3 wywołania A* na 120 klatek**;
2. `Locomotion` wystawia `targetUnreachable`;
3. `Enemy` traktuje brak trasy **jak zbyt duży dystans** — ta sama gałąź, ta
   sama bramka `canDeaggro()`, to samo `onLoseAggro()`. Czyli **istniejące,
   bezpieczne zachowanie**: powrót do patrolu.

⛔ **To NIE jest timeout ani licznik prób** — to odpowiedź nawigacji na pytanie
„czy w ogóle jest którędy". Dzik nie przechodzi przez drzewa: przy istniejącym
obejściu `unreachable` jest `false` i pościg trwa jak dotąd.

⚠ **Poprawka siedzi w `Enemy`, nie w `Boar`** — pętla była własnością wspólnego
stosu ruchu, a nie dzika. Warunek zapala się wyłącznie, gdy trasy **naprawdę
nie ma z bieżącej pozycji**; wtedy pościg jest bezcelowy dla każdego gatunku.

⛔ **Nic z wcześniejszych poprawek nie cofnięte:** zobowiązanie `Steering`,
rozróżnienie `hold`/`impulse`, `hasClearLine()` dla szarży i próg dystansu
szarży — wszystkie strażniki dalej zielone (§OSC, §OSC2, §Z).

**Guard `§REACH` w `movement_weryfikacja.mjs`** — sześć układów na prawdziwym
`NavGrid` + `PathFollower`: czysta droga, pojedyncza przeszkoda, dwa drzewa
z przejściem, **cel całkowicie zamknięty**, gęstwina ze zgłoszenia i jej
lustrzane odbicie. Plus asercja kadencji A*. **Sabotaż 3/3** (unreachable
zawsze false, zawsze true, A* znów co klatkę).
⚠ Pierwsza wersja scenariuszy stawiała zagrodę **obok** celu, bo `NavBox.x/y`
to LEWY GÓRNY RÓG, nie środek — test świecił na zielono z niewłaściwego powodu.

---

## 2026-09-05 (12) — Dzik wracał w stronę sadzawki: `hold` wymazywał objazd

Drugie zgłoszenie: po wpisie (11) migotanie zniknęło, ale dzik nadal „wracał
w stronę sadzawki" — kilka podejść, zanim dotarł.

⚠⚠ **Przyczyny NIE było w `steer()` i to jest najważniejsze w tym wpisie.**
Strażnik §OSC z poprzedniej sesji przechodzi wszystkie układy z **zerem** zmian
strony — bo mierzy CIĄGŁY ruch. Zbudowałem trzy nowe układy (długa przeszkoda
260 px, sadzawka + drzewo ze zgłoszenia, przeszkoda z kuszącą dziurą) i **każdy
przeszedł czysto**. Dopiero to skierowało mnie o warstwę wyżej.

**Przyczyna: `SteerSolver` zerował `steerState` przy intencji `hold`.**
`Boar.updateAi` woła `move.hold()` przy KAŻDEJ akcji (`if (this.akcje.busy)`) —
telegraf szarży 560 ms, zamach kła 420 ms, każde odzyskanie. Każda taka pauza
**wymazywała wybraną stronę objazdu**, więc po wznowieniu pościgu dzik losował
ją od zera: czasem tę samą, czasem przeciwną, czyli z powrotem na przeszkodę.

**Zmierzone na PRAWDZIWYM `steerSolver`** (układ ze zgłoszenia, pauzy o kadencji
akcji dzika):

| pauzy (klatek co / przez) | zmian strony PRZED | dotarł PRZED | PO |
|---|---:|---|---:|
| bez pauz | 0 | TAK (698) | 0, TAK |
| 180 / 40 | **6** | **NIE** | **0, TAK (898)** |
| 132 / 34 ≈ telegraf szarży | 0 | TAK (970) | 0, TAK |
| 90 / 25 | **10** | **NIE** | **0, TAK (973)** |
| 60 / 20 | **15** | **NIE** | **0, TAK (1058)** |

**Minimalna zmiana: rozdzielenie `impulse` i `hold`.**
`impulse` nadal kasuje — odrzut albo lot szarży **przestawia ciało**, więc
wybrana strona opisuje sytuację, której już nie ma. `hold` tylko zatrzymuje,
więc pamięć ma przeżyć. Jedna gałąź `if` mniej i jedna więcej.

⛔ **Nie dodałem żadnej nowej pamięci** — `SteerState` istniał od początku
i wystarcza. ⛔ **`commitPx` nietknięte** (40). Zobowiązanie i tak nie tyka
podczas pauzy: `consumeCommitment` zjada je PRZEBYTĄ DROGĄ, a stojąc nie
przebywa się żadnej. Bez A*, bez pathfindingu, bez waypointów; prędkość,
obrażenia i szarża bez zmian.

**Co zachowane:** wybór PIERWSZEJ strony nadal idzie kątami (świeże stworzenie
próbuje najmniejszego odchylenia), zobowiązany nadal przechodzi cały wachlarz po
swojej stronie, `probe(0)` nadal nie kasuje — czyli obie poprawki z wpisu (11)
zostają w mocy.

**Guard `§OSC2` w `movement_weryfikacja.mjs`** — jeździ **prawdziwym
`steerSolver`** z intencjami (`seek`/`hold`), nie samym `steer()`, bo różnica
mieszkała dokładnie w warstwie, której §OSC nie dotykał. Sześć układów
(przejście górą, dołem, długa przeszkoda, układ ze zgłoszenia, kusząca dziura,
ślepy zaułek) plus **jawna asercja asymetrii**: po `hold` stan ma zostać, po
`impulse` ma zniknąć. **Sabotaż 5/5** — łapie także błąd odwrotny („impulse
przestał kasować"), którego same scenariusze nie widziały.

---

## 2026-09-05 (11) — Dzik kręcił się w kółko: oscylacja w `steer()`

Zgłoszone ze zrzutu: dzik między drzewem a sadzawką przerzuca kierunek co kilka
klatek i nie dochodzi do gracza.

⚠⚠ **Pierwsza hipoteza była BŁĘDNA i obalił ją pomiar, nie namysł.**
Podejrzewałem `probe(0)`, które kasowało zobowiązanie przy chwilowo wolnej
drodze. Zbudowałem deterministyczny symulator na czystym `steer()` (ciało 46 px,
52 px/s, dt 1/60), zmierzyłem **11 zmian strony i utknięcie 207 px od celu**,
zastosowałem poprawkę — i liczby wyszły **co do bitu identyczne**. Reset nie był
przyczyną.

**Przyczyna: „zobowiązanie" nie było zobowiązaniem, tylko preferencją na jedną
próbę.** Wachlarz szedł KĄTAMI i przy każdym kącie próbował najpierw strony
zobowiązanej. Gdy przy tym kącie strona zobowiązana była zajęta, a druga wolna,
stworzenie **natychmiast przepinało zobowiązanie na drugą stronę**. W ciasnym
miejscu geometria odwraca się co kilka klatek → przerzuty lewo ↔ prawo.

**Naprawa, dwie linijki logiki, zero nowych systemów:**
1. **zobowiązany przechodzi CAŁY wachlarz po swojej stronie** i dopiero gdy tam
   nic nie jest wolne, wolno mu rozważyć drugą (wymaganie „jeżeli wybrana droga
   również jest zablokowana, dopiero wtedy podejmuje ponowną decyzję");
2. `probe(0)` **nie kasuje** zobowiązania — kończy je wyłącznie przebyta droga
   (`consumeCommitment`), tak jak zawsze deklarował nagłówek pliku.

⚠ **Wybór PIERWSZY zostaje kątami** i to jest celowe: świeże stworzenie ma
próbować najmniejszego odchylenia niezależnie od strony. Kolejność stronami dla
niezobowiązanego wysyłałaby je w 140° skręt, zanim rozważyłoby 18° w drugą —
psując to, po co wachlarz istnieje („w otwartym terenie nie robi nic").

**Zmierzone przed → po (zmiany strony objazdu):**

| układ | przed | po |
|---|---:|---:|
| przeszkoda wprost | 11, nie doszedł | **0, doszedł** |
| przeszkoda po lewej | 6 | **0** |
| przeszkoda po prawej | 3 | **0** |
| drzewo + sadzawka, przejście górą | — | **0, doszedł** |
| to samo odbite, przejście dołem | — | **0, doszedł** |
| ślepy zaułek (brak przejścia) | 19 | **1** |

⚠ **Obie poprawki zarabiają na siebie osobno** — sprawdzone A/B: sam nowy
wachlarz zostawia w ślepym zaułku **9 przerzutów**, dopiero brak resetu schodzi
do 1. Ślepy zaułek **nie musi** kończyć się dojściem (luka 20 px przy ciele
46 px); wymagane jest tylko, żeby stworzenie się nie miotało.

⛔ **Bez pathfindingu, bez A*, bez nowego systemu.** `NavGrid` nie był tu
potrzebny i nie został użyty: `steer()` pyta świat przez wstrzyknięty predykat
`isFree` (`ctx.isFree` → drzewo kolizji), a to jest właściwa warstwa dla
LOKALNEGO omijania. `NavGrid` obsługuje pytanie o trasę na odległość (używa go
bramka szarży z wpisu 8) i mieszanie tych dwóch byłoby drugim systemem.
Prędkość, obrażenia i szarża nietknięte.

**Guard `§OSC` w `tools/movement_weryfikacja.mjs`** — sześć układów przeszkód,
limit 2 zmian strony, sprawdza też dojście tam, gdzie przejście istnieje.
⚠ Pierwsza wersja miała parametry przepisane na sztywno i **przeszła sabotaż
`commitPx = 0`** — czyli nie zauważyłaby skasowania zobowiązania, którego
pilnuje. Czyta teraz `MOVEMENT.steer` z configu. **Sabotaż 4/4.**

---

## 2026-09-05 (10) — „Biała kreska" zamiast założonego plecaka

⚠⚠ **To była tekstura `__MISSING` Phasera, nie problem plecaka.** Ikony slotów
na torby powstają z pustym kluczem (`add.image(x, y, "")`) i dostają teksturę
dopiero w obsłudze zdarzenia `bagsChanged`.

**Przyczyna: rząd TOREB wypadł z pierwszego przemalunku panelu.** Konstruktor
`PlayerPanel` maluje z żywego stanu **każdą inną grupę** — postać,
siatkę plecaka, `EQUIP_SLOTS` (`refreshEquipIcons(Equipment)`), zadania, mapę —
tylko nie `BAG_SLOTS`. Panel zbudowany, gdy torba **już** była założona
(wczytany zapis, restart `UIScene` po śmierci albo zmianie mapy), zostawał
z pustą ikoną **na zawsze**, bo `bagsChanged` już nie miało prawa się pojawić.

⚠ Zgłoszenie było spójne z tą przyczyną w każdym szczególe: **podpowiedź
działała** (czyta `Equipment[slot]` na żywo), **drugi plecak w plecaku był
dobry** (siatka ma własny przemalunek), a **inne założone przedmioty też były
dobre** (`EQUIP_SLOTS` mają swój).

⛔ **Sprawdzone i wykluczone:** `icon-bag-4` **jest** ładowane
(`ASSETS.iconBag1…4` w `queueImages`), `item-icon-leather_backpack` powstaje tą
samą ścieżką `extractTile` co każda inna ikona, a brak skali w rzędzie toreb
jest świadomy (komentarz „native icon size (32px) … non-integer scale would
blur under NEAREST"). Asset, dane przedmiotu i mapowanie ID → ikona są
w porządku.

**Naprawa: jedna linijka** — `this.onBagsChanged(Equipment)` w tym samym bloku,
który już robi to dla pozostałych grup. ⛔ Żadnego wyjątku dla plecaka: to jest
domknięcie **wspólnego** kontraktu „grupa ikon, której jedynym malarzem jest
handler zdarzenia, musi dostać jednorazowy przemalunek z żywego stanu".

⚠ Strażnik `tools/shop_panel_weryfikacja.mjs` rozrósł się do
**`tools/ui_panele_weryfikacja.mjs`** i dostał §2, który wymienia wszystkie
sześć grup ikon `PlayerPanel`. **Sabotaż 2/2** — usunięcie przemalunku toreb
albo `EQUIP_SLOTS` zapala go na czerwono.

---

## 2026-09-05 (9) — Sklep: viewport plecaka kończył się w złym miejscu

Poprawka do poprawki z wpisu (8) — zgłoszona ze zrzutu ekranu: przewinięte
sloty plecaka wjeżdżały **pod sekcję ZAŁOŻONE**.

⚠⚠ **Przyczyna była jedną liczbą.** Okno plecaka brało dolną granicę
z `this.h / 2 − 44` (= **206**), czyli z budżetu podpowiedzi na samym dole
panelu — a nagłówek ZAŁOŻONE stoi na **88**. Między plecakiem a tą podpowiedzią
mieści się cała sekcja wyposażenia, więc viewport był o ~120 px za wysoki.
**To jest dokładnie ta sama pomyłka, którą komentarz przy `dolnyLimit`
w `buildEquipRow` opisuje słowami „krawędź panelu nie jest limitem, bo nie jest
pusta"** — i którą popełniłem mimo że ten komentarz stoi dwadzieścia linijek
niżej w tym samym pliku.

**Naprawa:** `equipLabelY = 88` wyciągnięte z literału w `buildEquipRow` do
nazwanego pola, żeby maska, hit-testing i sam nagłówek liczyły się z JEDNEGO
miejsca. Viewport = `equipLabelY − 6 − górna krawędź pierwszego rzędu` =
**232 px = dokładnie 4 pełne rzędy**, czyli tyle, ile kolumna zajmowała przed
dodaniem przewijania. ⛔ Ani jedna liczba układu nie zmieniona — `equipLabelY`
to nazwanie istniejącej wartości.

⚠⚠ **Druga dziura, znaleziona przy okazji: `refresh()` włączał wejście każdemu
PEŁNEMU slotowi, nie pytając o okno.** Maska ukrywała ikony przewinięte poza
obszar, ale hit-test dalej by je łapał — czyli po każdym kupnie/sprzedaży
wracały niewidzialne, klikalne kafle. `syncPlayerSlotIO()` woła się teraz na
końcu `refresh()`.

**Zweryfikowane arytmetycznie, nie „na oko"** — nowy `tools/shop_panel_weryfikacja.mjs`
czyta literały ze źródła i sprawdza cztery własności: dolna krawędź okna nad
nagłówkiem, okno = całkowita liczba rzędów, przy bazowych 16 slotach
`maxScroll = 0` (**brak paska, jak przed zmianą**), a na maksymalnym przewinięciu
ostatni rząd jest cały widoczny i kończy się równo na 82 — sześć pikseli nad
ZAŁOŻONE. Sprawdzone dla 16 / 32 / 48 slotów. **Sabotaż 3/3.**

⚠ Renderu dalej nie widziałem — arytmetyka się zgadza, ale drag&drop przy
przewiniętej liście zostaje do Twojego playtestu.

---

## 2026-09-05 (8) — Cztery poprawki z playtestu

**1. Dzik: KIEDY wolno zacząć szarżę.** Zgłoszone z gry: dzik szarżował stojąc
przy graczu (czytało się to jak „mam tylko jeden atak") i przez drzewo —
zaczynał lot, zapierał się o kolizję i tracił akcję. Dopisane **dwa warunki
przed `request`**, oba z istniejących części systemu:
`chargeOdlegloscOk` (próg = **istniejące `BOAR.gore.range`**, mierzony
`gapBetween`, tą samą miarą co gałąź kła) i `chargeTorWolny`
(**`NavGrid.hasClearLine`** — ta sama siatka i ta sama metoda, której używa
podgląd celowania gracza).
⚠ Warunki stoją **PRZED** `request`, więc zablokowana szarża w ogóle nie
startuje akcji — dzik spada do istniejącego kła albo pościgu i nie zostaje
w stanie szarży. ⛔ **Ani jedna liczba szarży się nie zmienia**; §Z4 sprawdza
dziewięć pól `BOAR.charge` plus `gore.range` wprost, żeby „poprawka warunków"
nie stała się wygodnym miejscem na cichy balans.
⚠ Priorytet szarży nad kłem **zostaje** poza zwarciem — świadoma decyzja
z komentarza przy tej gałęzi nie została cofnięta, tylko wycięto z niej
przypadek kontaktu. Brak siatki (mapy bez kolizji kafli) = zachowanie sprzed
zmiany, na zapis.
**§Z: 20 asercji, sabotaż 7/7.** ⚠ Z1/Z2 przeszły sabotaż w pierwszej wersji —
sprawdzały ISTNIENIE metody, więc wyjęcie wywołania z `if` ich nie ruszało.
Przepisane na wywołanie **w bramce**.

**2. Handel: plecak nie przewijał się i wychodził poza panel.** Ryzyko było
znane i zapisane (`docs/inventory_scroll_ux.md`) razem z `console.warn`, który
miał je „zgłaszać głośno" — playtest pokazał, że ostrzeżenie w konsoli nie jest
naprawą. **Przeniesiony mechanizm z `PlayerPanel`**, nie nowy pomysł: maska
geometryczna + przesuwanie `y` kontenera + pasek + **wyłączanie wejścia poza
oknem** (sama maska ukrywa kafel, ale zostawia go klikalnym — byłyby niewidzialne
kafle łapiące tapnięcia). Gest przewijania wisi na scenie i jest bezpieczny obok
drag&drop, bo przeciąganie i tak wymaga 300 ms przytrzymania
(`scene.input.dragTimeThreshold`, ustawiony raz przez `PlayerPanel`).
⚠ `reposition()` nadpisane — maska jest w współrzędnych EKRANU i nie jedzie za
panelem sama.

**3. Etykieta „Cofnij zakup: …" mogła wyjechać z ramki.** Jednowierszowy
przycisk o stałej szerokości 232 px i zmiennej treści; `Naszyjnik z kła Szarego`
mieści się o włos i nic tego nie pilnowało. `wordWrap` odpada (pudełko ma 26 px
wysokości), więc nazwa jest skracana z wielokropkiem.

**4. Komunikat +1 Władanie był nie do zauważenia.** Było `hold 500 + duration
900` = **1,4 s**, z pełnym kryciem tylko przez pierwsze pół sekundy. Jest
**2,5 s** (1,4 s pełnej krycia + 1,1 s wznoszenia z wygaszaniem) plus `pulse` —
**istniejąca opcja `floatingText`**, nie druga animacja i nie drugi system
komunikatów. ⛔ Pozycja, kolor, rozmiar, pogrubienie i głębokość nietknięte.
Mechanika przyznawania `P` bez zmian.

⚠ **Przegląd pozostałych paneli — bez zmian, bo nie znalazłem tam realnego
przepełnienia:** `ItemTooltip` wrapuje **każdą** linię (`maxTextWidth 230`)
i sam się skaluje; `QuestPanel` ma pięć `wordWrap`; `TopicPanel` ma maskę
i trzy `wordWrap`; `TrainerPanel` trzy; `NpcDialog`, `ConfirmDialog`,
`ContextAction` po jednym. `MasteryCard`/`AbilityCard` nie rysują własnych
tekstów. **Nie ruszałem stylu, kolorów, fontów ani układu.**

⚠ Renderu nie widziałem — przewijania sklepu przy pełnych torbach **nie da się
sprawdzić maszynowo**. To jest jedyna rzecz z tej sesji, która czeka na
Twój playtest.

---

## 2026-09-05 (7) — Benchmark: biegłość jako trzeci wymiar pomiaru

`--proficiency` · `--proficiency --matrix` · `--proficiency --sustain`.
**Zero zmian w mechanice** — `combat_regresja` 121/121, `src/` nietknięte.

⚠⚠ **Najważniejsze ustalenie NIE jest liczbą, tylko własnością systemu:
powyżej P50 `P` NIE DA SIĘ ZMIERZYĆ W ODERWANIU OD MASTERY.**
`WeaponProficiency.set()` **przycina wartość do `capFor(family)`**, a ten
zależy od wykupionej rangi (`masteryThresholds` = sufity 50 · 100 · 200 · 350).
Żeby w ogóle osiągnąć P200 trzeba mieć rangę M-II, a ranga niesie własny
ładunek (`effortReduction`, `traitMultiplier`, `critLowCut`). Benchmark
**wypisuje rangę w tabeli i mówi to wprost** — wiersze P200/P350 to „P + ranga",
nie czysty wpływ biegłości. Rozdzielenie tego byłoby zmyśleniem stanu, którego
gra nie potrafi osiągnąć.

**Poziomy wyprowadzone z konfigu, nie wpisane:** P0 (świeży start), P50
(`masteryThresholds[0]`), P100 (`neutral` — punkt, w którym `x = 1`), P200,
P350 (ostatni skończony próg; po M-IV `capFor` zwraca `Infinity`, więc górnej
granicy `P` w systemie nie ma). Zamek sprawdza po ustawieniu, że `get()`
naprawdę zwraca żądaną wartość — inaczej benchmark mierzyłby inne `P`, niż
deklaruje w nagłówku.

**Obserwacje — wyłącznie z pomiaru:**

⚠⚠ **Biegłość jest najsilniejszą osią w całym benchmarku i to nie jest bliskie.**
P0 → P350 daje **+143% / +153% / +147%** DPS (tarcza / 2H / DW). Dla porównania
różnica między najlepszą a najgorszą konfiguracją to ~40%, a pełny zakres
pancerza celu ~3,5×. **Ten sam gracz z tą samą bronią jest 2,5× silniejszy po
wytrenowaniu.**

⚠ **Skok P0 → P100 to +110% i jest identyczny dla wszystkich trzech
konfiguracji** — bo `missChance` (12%) i `slipChance` (17%) schodzą do zera
dokładnie w `neutral`, a `m(P)` idzie 0,600 → 1,000. Powyżej P100 krzywa się
wypłaszcza: P100 → P350 to już tylko +15…+19%.

⚠ **Ranking konfiguracji NIE ZMIENIA SIĘ z biegłością** — 2H > DW > tarcza na
każdym poziomie P i przy każdym pancerzu. Biegłość skaluje wszystkie trzy
niemal identycznie (+53% na P50 dla każdej z nich, co do punktu procentowego).

⚠⚠ **Sustain pokazuje efekt, którego burst nie widzi: biegłość jest też
mechaniką WYTRZYMAŁOŚCIOWĄ.** `effortReduction` rangi obniża koszt zamachu, więc
przy tej samej liczbie ciosów (88 / 111 / 147 — niezmiennej!) zużycie staminy
spada: 2H **275,9 → 209,7**, DW **258,9 → 196,8**. Stan końcowy 2H idzie
`exhausted (24)` → `normal (90)`. **Wytrenowany gracz nie tylko bije mocniej —
przestaje się męczyć.**

⚠ **MH/OH w DW skalują się równolegle** (crit MH 14,9% / OH 24,6% na każdym P —
sztylet niesie swoje `critChanceBonus`), a udział obrażeń OH rośnie minimalnie
(43,2% → 47,8%), bo `φ` z rangi działa na sztylet (rodzina z `critMultiplierBonus`),
a na miecz nie.

⛔ **Żadnej decyzji balansowej.** To jest pomiar.

---

## 2026-09-05 (6) — Benchmark: pięć pancerzy, sustain i macierz typów

Rozszerzenie przymiaru, **zero zmian w mechanice gry** (`combat_regresja`
121/121, `src/` nietknięte tą sesją).

**Cel benchmarkowy to dwie liczby: punkty i materiał** — dokładnie kształt
`ArmorSpec`, którym gra opisuje pancerz obu stron. ⛔ Świadomie bez klasy
`Enemy`: HP, AI i telegrafy nie wpływają na żadną mierzoną wartość.

⚠⚠ **SUSTAIN nie jest burstem × czas i to jest jego cały sens.** Pętla ma
zegar, `Stamina.tick` regeneruje jak w grze, a **profil ciosu jest przeliczany
przed KAŻDYM zamachem** — bo `attackCooldown` dzieli przez
`Stamina.attackSpeedMultiplier`, a ten spada w stanach `tired`/`exhausted`.
Zmierzone (60 s, LIGHT): 2H kończy **`exhausted` (24)**, DW **`tired` (41)**,
tarcza **`normal` (63)**. Układ sam się stabilizuje: zmęczony bije wolniej, więc
wydaje mniej — **żadna konfiguracja nie spada do zera w 60 s.**

**Obserwacje z macierzy — zapisane jako POMIAR, nie jako wniosek balansowy:**

⚠⚠ **Pytanie A ma odpowiedź NIEMONOTONICZNĄ i przyczyna jest zaskakująca.**
Przewaga DW nad 1H+tarcza rośnie **+17,1% → +25,7% → +43,8% → +51,1%**, po czym
**spada do +26,9%** przy `very_heavy`. To **nie jest własność Dual Wieldu** —
to **typ obrażeń off-handa**: sztylet bije `pierce`, a `pierce` ma w
`ARMOR_PROFILE` mnożnik **×0,70 przeciw `mail`** (heavy → DW świeci) i **×1,15
przeciw `metal`** (very_heavy → DW gaśnie). Gdyby w drugiej ręce leżała broń
sieczna, krzywa wyglądałaby inaczej.

⚠ **Pytanie B: tak, typ obrażeń ma ogromne znaczenie** — przy 50 pkt redukcja
waha się od **25,9%** (blunt vs mail) do **64,3%** (slash vs mail). To
najszersze pasmo w całym pomiarze, szersze niż różnice między konfiguracjami.

⚠ **Pytanie C: 2H trzyma przewagę PŁASKO** — +40,0 / +39,2 / +43,4 / +40,3 /
+41,9%. Nie zależy od pancerza, bo `battle_axe` i `sword` biją tym samym
`slash`; różnica jest czysto w liczbach broni.

⚠ **Pytanie D: różnice wynikają z istniejących mechanik.** Benchmark nie ma
ani jednego własnego mnożnika — VALIDATION (12 zależności) sprawdza m.in., że
`offhandSwingMul` działa TYLKO w DW i tarczy, że krytyk liczy się per ręka
(zmierzone: **MH 14,1% vs OH 24,8%** — sztylet niesie swoje `critChanceBonus`)
i że DW kosztuje więcej staminy niż sama broń główna.

⚠ Doszedł zamek sprawdzający **przy starcie**, że KAŻDY scenariusz odwołuje się
do materiału istniejącego w `ARMOR_PROFILE` — nie tylko ten uruchomiony.

⛔ **Żadnej decyzji balansowej.** To jest pomiar; decyzje po playteście.

---

## 2026-09-05 (5) — `tools/combat_benchmark.mjs`: koniec liczenia DPS ręką

Narzędzie pomiarowe, nie etap projektowania. Porównuje trzy konfiguracje na
**prawdziwych modułach gry** — `DamageRoll.rollWeaponDamage`, `rollExecution`,
`scaleDamage`, `Protection.mitigate`, gettery `Progression`, `Equipment.equip`,
`DamageResolver.resolveIncoming`.

⚠⚠ **Żeby to było możliwe, arytmetyka rzutu musiała wyjść z `Player`.**
`Player` jest sprite'em Phasera, więc **jedyna funkcja licząca obrażenia ciosu
była nieosiągalna dla narzędzi** — benchmark musiałby przepisać wzór, czyli
zrobić dokładnie to, czego miał uniknąć. `core/combat/DamageRoll.ts` to
WYCIĄGNIĘCIE bit w bit (ten sam porządek `Math.random()`, te same wyrażenia);
`Player.rollDamage` jest dziś jednolinijkową nakładką dodającą mnożnik
z efektów. Wzorzec i powód identyczne jak przy `DamageResolver` w Fazie 1A.5.
**`combat_regresja` 121/121 zero różnic** — czyli przeprowadzka nie ruszyła
ani jednego bitu.

⚠ **Trzy guardy zmieniły KOTWICĘ, nie pytanie.** §V11–V13 (dwa `Math.random()`,
`preCrit` z `basePrzedKrytykiem`, ten sam `u`) czytają teraz `DamageRoll.ts`.
§W3 dostało dodatkowo mocniejszą asercję: **nakładka w `Player` ma być cienka** —
gdyby ktoś dopisał do niej odczyt stanu, arytmetyka znów przestałaby być
mierzalna.

⚠⚠ **Trzeci raz w tym projekcie wpadłem w pułapkę DWÓCH GRAFÓW MODUŁÓW.** Każdy
osobny `esbuild` daje własny graf, więc `Equipment` widział INNY singleton
`Progression` niż ten, któremu benchmark ustawiał Siłę — objaw: „equip odrzuca
miecz na wymaganie Siły, mimo że Siła jest ustawiona linijkę wyżej". To jest ta
sama pułapka, którą `CLAUDE.md` opisuje przy `window.dev`. Naprawa: **jeden
plik-baryłka, jeden bundle, jeden import.**

⚠ **Benchmark musi ustawić SIŁĘ 5** — nie z widzimisię: wymagania Siły liczą się
z wagi i są egzekwowane przez `Equipment.equip` (miecz 2, włócznia 3, **topór
bojowy 5**, młot 6). Przy Sile 0 konfiguracji 2H **nie da się założyć**. 5 to
minimum, przy którym wszystkie trzy są legalne; wypisane w nagłówku raportu,
nie ukryte.

**Zmierzone (10 000 iteracji, seed 12345, bez pancerza):**

| | Att/s | AvgHit | DPS | Stam/s | do zera |
|---|---|---|---|---|---|
| 1H + tarcza | 1,85 | 8,7 | 14,2 | 3,96 | 125 s |
| 2H | **1,47** | **15,3** | **19,8** | 4,61 | **74 s** |
| Dual Wield | **2,48** | 7,6 | 16,6 | 4,36 | 88 s |

⚠ **Wszystkie trzy tożsamości widać w liczbach, żadna nie jest wpisana ręcznie:**
2H najwolniejsze i najmocniejsze na cios, DW najczęstsze i najdroższe w stosunku
do siły ciosu, tarcza najtańsza i najbardziej wytrzymała. Obrona: tarcza blokuje
89,4% ciosów frontalnych, 2H **0%** (brak tarczy i brak parowania poza rodziną
miecza), DW 0% bloku ale 5,5% parowania.

⚠ **Zamek §0 czyta źródło `GameScene.ts`** i sprawdza, że każde pole
`StrikeProfile`, na którym benchmark stoi, bierze się w grze z tego samego
gettera. Bez tego benchmark mógłby cicho mierzyć inną grę niż ta, w którą się
gra. Sekcja VALIDATION dokłada 12 zależności strukturalnych (m.in. „krytyk DW
leży między ręką główną a drugą" i „DW kosztuje więcej staminy niż sama broń
główna") — obie potwierdzają naprawy z wpisu (4).

⚠ Znalezione po drodze i naprawione: scenariusz `heavy` używał materiału
`"steel"`, którego **nie ma w `ARMOR_PROFILE`** (jest `metal`) — wywalał się
dopiero po `--armor heavy`. Doszedł zamek sprawdzający klucze wszystkich
scenariuszy przy starcie.

⚠ Powtarzalność sprawdzona: ten sam seed → identyczny wynik, inny seed → inny.
**Playtest zostaje po stronie autora — benchmark mierzy model, nie odczucie.**

---

## 2026-09-05 (4) — Dual Wield: dwie naprawy zamieniają prototyp w konfigurację

```
obie ręce uczestniczą        ✅ już działało
kadencja per ręka            ✅ już działała (+18…24% zamachów)
krytyk per ręka              ⚠ NAPRAWIONE — czytany był z ręki GŁÓWNEJ
stamina rośnie z tempem      ⚠ NAPRAWIONE — wyższy event rate był DARMOWY
kary MH/OH                   ⛔ nadal nie istnieją, §W7 pilnuje
```

Audyt prototypu wykazał, że **mechanika była na miejscu, ale dwa parametry
płynęły złym kanałem** — i oba dawało się zmierzyć, nie tylko wydedukować.

⚠⚠ **1. Krytyk off-handa pochodził z broni ręki głównej.** `rollDamage` czytał
`Progression.critChance`, a ten bierze `Equipment.weaponMelee.critChanceBonus`.
Zmierzone na żywym configu: `Sztylet + Miecz` dawał **+24,1%** dps zamiast
+19,5%, `Miecz + Sztylet` **+11,7%** zamiast +16,0%. Układ **nagradzał trzymanie
broni o wysokim krytyku w ręce głównej i karał za włożenie jej do drugiej** —
zachęta, której nikt nie zaprojektował i której nie dało się zobaczyć w grze.
`critChance` dołączył do `StrikeProfile`; był **ostatnim parametrem rzutu
czytanym na żywo**.

⚠⚠ **2. Wyższy event rate DW nie kosztował ani punktu staminy.** Koszt zamachu
jest proporcjonalny do jego długości, a `DUAL_WIELD.swingMul` skraca zamach
i cooldown **tym samym** mnożnikiem — więc skracał się też rachunek. Zmierzone:
DW miecz+sztylet **3,71 staminy/s wobec 3,96/s samego miecza**, czyli +24%
ciosów **taniej** niż jedna broń. Tożsamość DW mówi „wysoki event rate, WIĘKSZE
obciążenie staminy" — druga połowa po prostu nie zachodziła.
Naprawa mieści się w istniejącym wzorze: wysiłek liczy się z długości zamachu
**bez** przyspieszenia z DW. Wynik **4,36/s (+18%)**.
**Reguła: szybciej machać wolno, machać taniej nie.**
⛔ Tarcza nietknięta — `blockSpec.swingMul` zostaje w rachunku, bo tarcza zamach
SPOWALNIA i ma prawo czynić go droższym. `dualWieldSwingMul` zwraca 1 poza DW.

⚠⚠ **Stara liczba „alternowanie = strata 17–43%" jest NIEAKTUALNA.** Mierzono ją
**przy niezmienionej kadencji**, zanim `swingMul = 0,85` weszło do kodu. Dziś DW
daje **+16…+18% dps** przy +18…+24% zamachów. **Nie potrzebuje rekompensaty** —
i dlatego nie dokładam żadnej.

⚠ **Zmieniłem jeden istniejący guard i to wymaga uzasadnienia.** §W3 twierdziło:
„`critChance` ZOSTAJE żywy (własność postaci, nie ręki)". **To była nieprawda
o kodzie, którego pilnowało** — dwa z trzech składników należą do postaci,
trzeci do broni z jednej ręki. Guard nie został osłabiony: pilnuje teraz
MOCNIEJSZEJ własności (żaden parametr rzutu nie jest czytany na żywo) plus
tego, że premia postaci wchodzi do obu rąk tak samo. Doszło §W9 (wysiłek).
**Sabotaż §W: 6/6 złapanych.**

⚠ Maszynowo: `tsc`, `build`, `combat_regresja` **121/121 zero różnic**
(zachowanie 1H i 1H+tarcza nietknięte), `atrybuty_kalibracja` 10/10,
dziewięciu strażników OK. **Playtest 2× sztylet zostaje po stronie autora.**

---

## 2026-09-05 (3) — 2H: audyt tożsamości, jedna liczba, dwie cechy zablokowane

```
wolniejsza                   ✅ już wynikało z liczb broni
duże obrażenia               ✅ już wynikało z liczb broni
większy zasięg               ✅ po zmianie JEDNEJ liczby (war_hammer 74 → 80)
trudniejsza do zablokowania  ⛔ wróg nie ma bloku
trudniejsza do sparowania    ⛔ wróg nie ma parowania
```

Zadanie brzmiało „dowieź 2H jako grywalną mechanikę". **Wynik audytu:
mechaniki nie trzeba było dowozić — trzy z pięciu cech już wynikały
z istniejących warstw**, a czwarta i piąta nie mają na czym zadziałać.

⚠⚠ **Najważniejsze znalezisko, nieopisane nigdzie wcześniej: defensywna połowa
„commitment" już istnieje i nikt jej nie zaprojektował.** `parryChance` zwraca
0 bez rodziny z `parryBonus` (ma go tylko `sword`), a `hands: 2` blokuje
off-hand. Gracz z bronią dwuręczną **nie ma ani bloku, ani parowania** — traci
całą warstwę obrony kierunkowej, którą 1H + tarcza właśnie dostało rozbudowaną
do trzech stref. To jest emergentne z architektury.

⚠⚠ **Cechy 4 i 5 są zablokowane strukturalnie, nie liczbowo.** Wrogowie nie
mają bloku ani parowania — `Protection.guardZone` i `DamageResolver` obsługują
wyłącznie ciosy przychodzące DO GRACZA. **Zatrzymałem się zamiast napisać
premię, która nie miałaby na co działać** — ta sama blokada, która zatrzymała
`uninterruptible`.

**Jedyna zmiana w kodzie gry: `war_hammer.melee.reach` 74 → 80.** Przy 74 `Młot
bojowy` sięgał dokładnie tyle co **starterowy Osiosany kij** i krócej niż
jednoręczny `Młot` (78), więc cecha „większy zasięg" dla tej broni nie
zachodziła w ogóle. `reach` nie wchodzi do obrażeń ani do dps — wyłącznie do
wyboru celu i podglądu celowania.

⚠⚠ **`Młot` jest bronią `hands: 1` o parametrach 2H** (14–20, cd 0,65, swing
240, reach 78) i łamie wszystkie trzy dowiezione cechy od strony jednoręcznej.
Strażnik §Y trzyma ten wyjątek JAWNIE (`Y4`), zamiast go przemilczeć: gdyby
ktoś zmienił `Młota`, Y4 zaświeci i każe usunąć wyjątek. ⛔ Nie naprawiam tego —
to rebalans rosteru. **Prostuje to przy okazji starą notę** „Młot 1H vs Młot
bojowy 2H": obie te bronie nie są dwuręczne.

⚠ **§Y przeszło sabotaż dopiero za trzecim podejściem.** Dwie asercje `Y5` były
dekoracjami: `blockReduction` nie łapało `_blockReduction`, a
`hands` nie łapało `Equipment.itemHands`. Obie miały granicę słowa tam,
gdzie sabotaż wchodzi przez przedrostek. **Po poprawce 5/5.**

⚠ Renderu nie widziałem. Maszynowo: `tsc`, `build`, `combat_regresja` 121/121
zero różnic, `atrybuty_kalibracja` 10/10, dziewięciu strażników OK.
**Odczucie 2H zostaje po stronie autora.**

---

## 2026-09-05 (2) — Tarcza: trzy strefy osłony zamiast bloku binarnego

```
MODEL      120° pełnego bloku + 40° osłabionego na stronę = 200° reakcji
GRANICE    front κ < 60°   side κ < 100°   back dalej
sideZoneMul 0,50 — WARTOŚĆ PLAYTESTOWA, nie balans
PAROWANIE  nietknięte (półkula 90°)
PLAYTEST   po stronie autora
```

Do tej daty blok był binarny: **cała przednia półkula dawała PEŁNĄ redukcję**,
a od 90° wzwyż zero. Model gameplayowy inspirowany szerokim polem widzenia
człowieka — **nie odwzorowaniem anatomii**: gracz widzi cios z boku i zdąży
zareagować, ale tarcza nie jest wtedy ustawiona optymalnie.

⚠ **Pełny blok świadomie NIE rośnie ponad 120°.** Gdyby tarcza chroniła prawie
całe otoczenie, `1H + tarcza` byłoby bezwarunkowo najlepszą konfiguracją
obronną, a pozycjonowanie przestałoby cokolwiek znaczyć.

⚠⚠ **To jest ŚWIADOMY ROZDZIAŁ granicy ataku i granicy bloku** — pierwszy
w tym projekcie. Komentarz przy `FRONT_ARC_DEG` od dawna żądał, żeby jeśli
kiedyś do tego dojdzie, zrobić to „dwiema stałymi i dwoma uzasadnieniami", a nie
przy okazji strojenia jednej z nich. Oto one: `blockArcDeg` (90°) to **półkula**
— bramka zwrotu ataku i **PAROWANIE**, nietknięte; `sideArcDeg` (100°) to
**zewnętrzna granica tarczy**. Uzasadnienie rozejścia: atak pyta „czy mogę to
trafić", tarcza „czy zdążę ją podstawić". §L nadal pilnuje równości atak ↔
półkula, §X pilnuje stref.

⚠ **`guardZone` jest zbudowane NA `isFrontal`** (dwa zagnieżdżone wywołania),
więc konwencja granicy nadal jest JEDNA. Zagnieżdżenie gwarantuje przy okazji
strukturalnie, że `front ⊆ bok ⊆ blokowalne` — pas boczny jest RÓŻNICĄ dwóch
testów, więc nie potrafi być szerszy od granicy zewnętrznej.

⚠ **Naprawione przy okazji, bo od stref stałoby się nieprawdą:** `Player.take
Damage` odtwarzał `blocked` drugi raz, wprost z `Equipment.blockSpec.reduction`.
Przy jednej strefie dawało to tę samą liczbę; przy trzech blok BOCZNY zdejmuje
`reduction × sideZoneMul`, więc odtworzenie kłamałoby. Dziś czytany jest
werdykt (`DamageResult.zone`), nie odtwarzana liczba.

⚠ **Usunięte martwe `Protection.blockFraction`** — bez wywołań od wyciągnięcia
`DamageResolver` (Faza 1A.5), a mimo to opisywane w **czterech dokumentach**
jako żywa ścieżka bloku. Zostawione obok stref byłoby drugą, dwustrefową
odpowiedzią na to samo pytanie.

⚠ **Blok boczny NIE dostał osobnej kary za wysiłek** i to nie jest
przeoczenie: `Stamina.hitCost` liczy się od `mitigated`, więc słabsza mitygacja
już kosztuje więcej staminy. Druga kara byłaby policzeniem tego samego dwa razy.

**Zmiana zachowania w baseline: DOKŁADNIE JEDNA.** Cios równo z boku (90°) był
`hit 14`, jest `block 12`. Wszystkie pozostałe zamrożone przypadki wyszły
bit w bit tak samo — w tym `parry pewny, ale Z BOKU` (`hit 20`), co jest
dowodem na frozen baseline, że parowanie nie zostało poszerzone.

⚠ **Strażnik §X złapał własną dekorację.** Asercja „resolver nie czyta
`SHIELD`" przechodziła sabotaż, bo w zapisanym regexie `` zamieniło się na
znak BACKSPACE — reguła prawdziwa w intencji, martwa w pliku. Wymieniona na
`includes("SHIELD")` bez ani jednego ukośnika. **Sabotaż 7/7 po poprawce.**

⚠ Renderu nie widziałem — podgląd w narzędziu nie uruchamia gry. Sprawdzone
maszynowo: `tsc`, `build`, `combat_regresja` 121/121 zero różnic po świadomej
migracji baseline'u. **Playtest szerokości frontu i wartości 0,50 zostaje po
stronie autora.**

---

## 2026-09-05 — Dual Wield: prototyp mechaniki (i trójkąt archetypów na papierze)

```
STATUS:
PROTOTYP DW (dwie bronie, naprzemiennie)  = W KODZIE
KARY, POZIOMY DW, EFEKTY                  = ŚWIADOMIE NIE
TOŻSAMOŚĆ TRZECH ARCHETYPÓW               = ZAPISANA, ZERO KODU
PLAYTEST                                  = PO STRONIE AUTORA
```

Sesja miała dwie części i warto je trzymać osobno: **długą analizę projektową**
(model wariantu B na prawdziwych liczbach broni, benchmark siedemnastu
archetypów z dziesięciu gier, trójkąt tożsamości) i **wąski prototyp kodu**,
który z tej analizy wyszedł.

**Prototyp odpowiada na jedno pytanie: czy dwie bronie jako DWA NIEZALEŻNE
PROFILE CIOSU wchodzą w ten system.** Wchodzą. Model `pendingSwing` został
nietknięty — jeden slot, jedna poza, jedno ukorzenienie; zmienia się wyłącznie
to, CZYM ten jeden zamach jest wyprowadzony. `offhandStrike()` jest **trzecim
profilem ciosu w grze** i zbudowany dokładnie jak drugi (`shieldStrike`): nie
bierze niczego z `Progression.melee`, tylko z własnego narzędzia.

⚠⚠ **Po drodze wyszła istniejąca niespójność, starsza od DW.** `StrikeProfile`
zamrażał zasięg, typ, biegłość i rodzinę — z jawnym uzasadnieniem, że odczyt
przy TRAFIENIU pozwalałby przezbroić się w oknie zamachu. Ale `rollDamage`
czytał `Progression` **na żywo**, więc obrażenia jako jedyne nie były mrożone:
dało się zamachnąć jedną bronią, a rozstrzygnąć rzutem drugiej. Naprawione
w tym samym miejscu, w którym mieszka reszta profilu.

⛔ **Czego prototyp NIE ma i to jest decyzja:** kar MH/OH, bramek poziomu DW,
efektów, proców, movesetu, wyrównania DPS. **Każda ręka zadaje pełne obrażenia
swojej broni.** §W w `combat_regresja.mjs` ma jawną asercję, że mnożnik kary
nadal nie istnieje — ciche dołożenie go ma zapalić lampkę, bo balans jest
osobnym etapem.

⚠ **§W złapało realny błąd przy pierwszym uruchomieniu**: podmiana na
`nextStrike()` trafiła w `landRushStrike` (cios kończący Wypad) zamiast
w `resolveAttack`. Bez tej asercji Wypad zacząłby losowo lądować off-handem.

**Trzy liczby z analizy, warte zapamiętania przed strojeniem:**
1. ⚠⚠ **przy niezmienionej kadencji model naprzemienny jest STRATĄ 17–43%** we
   wszystkich konfiguracjach — przyspieszenie tempa jest warunkiem istnienia
   tego modelu, nie ozdobą;
2. **utrzymywalność jest gotową ceną**: jedna broń bije bez końca (koszt ~3,0/s
   wobec regenu 3,0/s), DW ma okno **38–58 s**;
3. **DW nagradza inwestycję w DWIE bronie** — przy nierównym Władaniu jest
   gorszy niż lepsza z broni solo. Bramka umiejętności jest **emergentna z `P`**,
   nikt jej nie projektował.

⚠ **Sprostowanie do mojej własnej analizy z tej samej sesji:** twierdziłem, że
DW „nagradza słaby main-hand". Nieprawda — porównywałem do złego punktu
odniesienia (własna broń z MH zamiast **najlepszej broni użytej solo**). Pod
poprawnym odniesieniem struktura zachęt jest właściwa.

📄 **Pełny zapis: `docs/archetypy_walki.md`** — §1–§3 prototyp (w kodzie),
§4–§7 kierunek na przyszłość (zero kodu, nie specyfikacja).

⚠ Renderu nie widziałem — podgląd w narzędziu nie uruchamia gry. Sprawdzone
maszynowo: `tsc`, `build`, osiem strażników, `combat_regresja` 111/111 zero
różnic. **Playtest 2× sztylet zostaje po stronie autora.**

---

## 2026-09-04 (3) — Celowanie Szarży: z prototypu w język UX

```
STATUS:
JĘZYK „LANE" (podgląd Szarży)   = W KODZIE
MECHANIKA SZARŻY                = NIETKNIĘTA
PASMO                           = PRZESTROJONE Z RUNTIME'U (130→100, 420→360)
PRZEBUDOWA SZARŻY (§5)          = NADAL OTWARTA
```

Zgłoszenie autora: *„celowanie Szarży wygląda jak debug tool, a nie jak finalny
UX mobilnego RPG"*. Stan zastany: kreska 3 px do środka celu i kółko wokół celu.
Dwa prymitywy `Graphics`, zero hierarchii, a przy braku legalnego celu — **pusty
ekran**.

**Diagnoza, która ustawiła całą resztę: brakowało jednego STANU, nie ozdób.**
Przeciwnik mógł wyglądać na dwa sposoby („wybrany" albo „nijak"); nie istniało
*„mógłbym cię wziąć, ale nie ciebie"*. Wszystkie wcześniejsze podejścia
(pierścienie, strefy, korytarze) zasypywały tę lukę geometrią wokół gracza —
a gracz patrzy na potwory, nie na geometrię wokół siebie.

**Rdzeń, do którego doszliśmy: WYPEŁNIENIE korytarza znaczy „to się wydarzy".**
Jedna reguła obsługuje cztery stany (brak celu · rozbieg przed `minRange` ·
właściwy tor · odcinek za przeszkodą) zamiast czterech osobnych elementów.
To ona zamknęła najdłuższy spór tej sesji.

⚠ **Do dwóch rzeczy wróciliśmy wbrew etykiecie „odrzucone" w dokumentacji —
świadomie i po sprawdzeniu warunków.** Pierścienie MIN/MAX są w grze, mimo że
`szarza_aiming_v2_handoff.md` i `wypad_i_szarza.md` §1 mówiły „pierścieni nie
będzie". Wolno było, bo (1) odrzucony był WARIANT mocny i ciągły, a nie kształt,
(2) zmieniły się liczby (`maxRange` 420 → 360 przy kadrze 391 px), (3) doszedł
stan „kandydat", który przejął ciężar pytania „kto jest w zasięgu".
**Reguła na przyszłość, zapisana w §7.0: „odrzucone" znaczy „ten wariant, przy
tych liczbach, w tamtym otoczeniu".**

**Trzy rzeczy, które kosztowały najwięcej i są warte zapamiętania:**

1. ⚠⚠ **„Na desktopie widać, na telefonie znika" to problem JEDNOSTEK.** Gra
   rysuje w pikselach URZĄDZENIA, więc linia grubości 1 ma przy DPR ≈ 2,6 około
   **0,38 piksela CSS** — jest fizycznie ~3× cieńsza niż na desktopie. Trzy
   rundy kalibracji alfy poszły na to, zanim znalazłem przyczynę. **Każdą cienką
   linię w świecie kalibruj na telefonie, nigdy na desktopie.**
2. **`X` przy przeszkodzie znaczy „tor przecięty", NIE „tu się zatrzymasz".**
   Arcade ślizga ciało po przeszkodzie, więc bieg potrafi obsunąć się bokiem
   i mimo wszystko dojechać; obietnica miejsca zatrzymania wymagałaby symulacji
   ślizgu, czyli systemu ruchu. Świadomie słabsze, prawdziwe znaczenie.
3. **Nie powstał drugi opis przestrzeni.** Przeszkodę pyta `NavGrid`
   (`firstBlockedOn`, dodana w tej sesji — `hasClearLine` do niej deleguje),
   kandydatów filtruje `coversTarget` — ten sam predykat, którym rozstrzyga
   commit. Zakres blokad to teren i pnie; studnia, ognisko i NPC mają własne
   collidery i świadomie ich nie widzimy.

**Przestrojenie pasma przyszło z gry, nie z arkusza:** po dorysowaniu okręgów
autor zobaczył, że pasmo jest wizualnie za rozległe. 130 → 100 i 420 → 360.
⚠ Skutek uboczny do obserwacji: margines `minRange` nad najdłuższą bronią
(włócznia, `reach` 98) spadł z 32 px do 2 px. Formalnie reguła stoi (te liczby
mierzą co innego), ale **włócznik jest miejscem, gdzie to wyjdzie pierwsze**.
Wypad korekty nie wymagał — §S2 przejeżdża cały roster i zapas mu wzrósł.

⭐ **Sformułowanie autora, które zmienia ramę na przyszłość:** *„nie robimy
systemu Szarży, tylko wspólny język aimowania, z którego każda umiejętność
korzysta z odpowiednich elementów"*. Elementy są wspólne, **dobór należy do
mechaniki** — Szarża bierze pasmo, tor i przeszkodę; Krok i Cios weźmie
MAX i cel; Ciężkie uderzenie nie bierze nic ponad wybrany cel. Mechanizm już
jest: `ABILITIES.*.aimPreview` to DANA, nie `if (id === …)`.

**Tego samego dnia doszedł Wypad („Krok i Cios") na języku `reach`** — pierwszy
test tezy o wspólnym języku, i od razu pouczający. Dostał okrąg zasięgu,
kandydatów i cel; **nie dostał** MIN, rozbiegu ani ✕, bo jego mechanika ich nie
ma. Dwie rzeczy wyszły dopiero przy robocie:

- ⚠⚠ **Okrąg zasięgu musi być powiększony o promień ciała gracza.** Wypad mierzy
  `surfaceGap`, więc naiwny okrąg o promieniu `maxRangePx` pokazywałby dużego
  wroga jako poza zasięgiem, choć jest trafialny. Po powiększeniu jest ŚCISŁY
  i czyta się naturalnie: „dotyka cię okrąg — dosięgniesz".
- ⚠⚠ **Reguła wypełnienia NIE przeniosła się z Szarży.** Tam pusty pas znaczy
  „nic się nie stanie"; u Wypadu **brak celu to drugie, pełnoprawne użycie**
  (skok za pełne 14 s), więc tor jest wypełniony. Gdyby dobór elementów był
  mechaniczny, ten podgląd kłamałby o najczęstszym sposobie użycia umiejętności.

⏳ Przy audycie wyszła **niesymetryczność tap vs drag**: przeciągnięcie
przechodzi przez `coversTarget` (sektor ±30°), a tapnięcie bierze `currentTarget`
po samym dystansie — czyli poleci też do celu za plecami. **Świadomie
nienaprawione**, zapisane jako osobne rozstrzygnięcie (§8.5).

📄 **Pełny zapis decyzji, odrzuconych wariantów i powodów: `wypad_i_szarza.md`
§7 (Szarża, 15 podsekcji) i §8 (Wypad).** Ten wpis jest narracją, nie referencją.

⚠ **Renderu nie widziałem ani razu w trakcie tej sesji** — podgląd w narzędziu
nie uruchamia gry (`game.loop.frame` stoi na 0). Każda runda kalibracji szła
z runtime'u autora. Sprawdzone maszynowo: `tsc`, `build`, `combat_regresja`
(111/111, zero różnic, w tym §P3 „pasmo 100–360" i §S2), `effects` 65/65 oraz
doraźna próba wejść pasa na prawdziwych modułach (kandydaci, wybrany,
punkt przecięcia).

---

## 2026-09-04 (2) — Krwawienie WIDAĆ: znacznik nad wrogiem przez mechanizm Ogłuszenia

```
STATUS:
IKONA KRWAWIENIA NAD WROGIEM   = W KODZIE
MECHANIZM                      = ten sam, co znacznik Ogłuszenia (rozszerzony)
WARSTWA EFEKTÓW                = NIETKNIĘTA
GRAFIKA STATUSÓW               = PLACEHOLDER (zaakceptowany)
```

Domknięcie jednej pozycji z listy „poza zakresem" wpisu wyżej: rana była
policzalna (pasek HP drgał), ale **niewidoczna jako STAN**. Dziś nad
krwawiącym wrogiem stoi ikona umiejętności, która ranę zadała.

**Nie powstał drugi system statusów — rozszerzył się ten, który był.**
Ogłuszenie miało nad głową znacznik od 2026-08-26; Krwawienie wchodzi tym
samym kanałem, przez `onEffectsChanged()` (do dziś świadomie pusty).

**Jedyna zmiana architektoniczna, i była wymuszona:** pojedyncze pole
`stunMarker` → `statusMarks`, czyli **rząd wielu jednoczesnych znaczników**.
Powód jest konkretny, nie porządkowy — **Ogłuszenie i Krwawienie występują
naraz** (Uderzenie tarczą i Rozcięcie niczym się nie wykluczają), a drugie
takie pole liczyło się z tego samego `offsetY`, więc oba znaczniki stanęłyby
**dokładnie na sobie**. Geometria rzędu wyszła do `COMBAT_FEEDBACK.statusMarks`
(odstęp należy do rzędu, nie do żadnego pojedynczego stanu).

⚠ **Podział ról został nietknięty i to jest treść tej zmiany:** czas, stosy,
tiki i wygaśnięcie prowadzi dalej **`EffectSet`**; `statusMarks` odpowiada
**wyłącznie za prezentację** i nie jest źródłem prawdy o niczym. Praktyczny
skutek: ponowne Rozcięcie odświeża ten sam efekt, więc trafia w zajęty slot
i **nie tworzy drugiej ikony**, a gaśnięcie ogłasza warstwa — **zero drugiego
licznika po stronie widoku**. Ikona jedzie z `spec.iconKey`, więc `Enemy` nie
zna `abilityIconKey` i druga zdolność z raną pokaże swoją własną.

Strażnik: **§V15 w `combat_regresja.mjs`** (sześć asercji, sprawdzone, że
świecą na czerwono po celowym zepsuciu — literał ikony i usunięta gałąź
gaszenia dały 2 błędy).

⚠ **`✷` Ogłuszenia i ikona `rend` w 14 px zostają PLACEHOLDERAMI** do czasu
docelowej grafiki statusów — decyzja autora, zaakceptowana świadomie, nie
przeoczenie.

⚠ **Render NIEOBEJRZANY w tej sesji z powodu środowiska**, nie zaniedbania:
podgląd wywalał się na `Framebuffer status: Incomplete Attachment`, a pod
wymuszonym CANVAS-em pętla klatek nie ruszyła w ogóle (`game.loop.frame`
stało na 0). Sprawdzone są: `tsc`, `build`, `combat_regresja` (zero różnic),
`effects_weryfikacja` (65/65) i księgowość znacznika na prawdziwej warstwie
efektów. Układ rzędu na ekranie zostaje do obejrzenia przy najbliższej grze.

---

## 2026-09-04 — ROZCIĘCIE: pierwszy skill z efektem na WROGU

```
STATUS:
ENEMY JAKO EffectHost/EffectTarget   = W KODZIE (pierwszy nosiciel poza graczem)
ActionOnHit.bleed (4. wariant)       = W KODZIE
ROZCIĘCIE (ABILITIES.rend)           = W KODZIE
PLAYTEST                             = NIEWYKONANY
LICZBY BALANSOWE POZA BRIEFEM        = PLACEHOLDER
```

**Zadanie brzmiało: jeden prosty skill na istniejących fundamentach**, a nie
przebudowa walki. Tak wyszło — `EffectSet`, `EffectKinds`, `DamagePacket`,
`DamageResolver`, `Protection`, `pendingSwing`, `AbilitySpec` i `Abilities`
są **nietknięte**, a `combat_regresja` daje **111/111, zero różnic**.

**Co MUSIAŁO się zmienić i dlaczego — trzy rzeczy, żadna kosmetyczna:**

1. **`Enemy` deklaruje `EffectTarget` + `EffectHost`.** To jest dokładnie ten
   przypadek, który nagłówek `combat/Contracts.ts` zapowiedział w 2026-09-03
   („kiedy pojawi się DoT na wrogu, `Enemy` dopisze implementację, a wołający
   nie zmienią ani linijki") — i tak się stało: **ani jedno istniejące
   wywołanie nie zostało tknięte.** Warstwa efektów nie dostała ani jednej
   linijki.
2. ⚠ **`GameScene.creditKill` — wyciągnięte, bo Krwawienie potrafi dobić.**
   Do tej sesji księgowość zabójstwa (XP, łup, respawn, `Quests.recordKill`,
   licznik) mieszkała **wewnątrz pętli trafień**, bo cios był jedyną ścieżką
   śmierci. Tik `EffectSet` uderza poza tą pętlą, a `Enemy.die()` sam z siebie
   nie przyznaje niczego — bez tego wyciągnięcia wróg dobity raną **znikałby
   bez nagrody i bez odrodzenia, nie zgłaszając niczego**. Ekstrakcja bit
   w bit, zero zmiany zachowania.
3. **Czwarty wariant `ActionOnHit`: `bleed`.** Trzy alternatywy sprawdzone
   i odrzucone z powodu, nie z gustu: `StrikeProfile` (to opis „czym uderzam"
   — rana trafiłaby na KAŻDY zamach tą bronią), gałąź `case` (nagroda wisi na
   TRAFIENIU, nie na naciśnięciu), osobne pole obok `onHit` (ten sam wyzwalacz
   `anyHit`, więc lista jest jedna — OD-1 z review P3.3).

⚠ **`PLAYER_ACTIONS` ma dziś CZTERY wpisy i to jest SPROSTOWANIE, nie obejście.**
Checkpoint P3 §D mówił „trzy i nie ma rosnąć". Zdanie zostaje w mocy o
**migracjach** — żadna z pięciu pozostałych umiejętności nie weszła. Ale §C
definiuje przynależność jednoznacznie („część bojowa kończy się wpisem do
`pendingSwing`"), a Rozcięcie spełnia to co do słowa. Sprostowanie stoi
w banerze checkpointu i w `docs/README.md`.

### Trzy decyzje projektowe podjęte przez autora PRZED kodem

Kod wymuszał je i żadna nie mogła zapaść przez przypadek implementacji:

- ⚠⚠ **Krwawienie robi PIĘĆ tików, nie sześć — 160 obrażeń, nie 170.**
  `EffectSet.tick` odejmuje czas PRZED tikiem, więc tik lądujący równo
  z wygaśnięciem **nie pada** (reguła przeniesiona z `updateVenom`).
  Przy 6000/1000 daje to tiki w 1000–5000 ms. **Decyzja: zostawić 6000 ms
  i semantykę warstwy nietkniętą.** ⛔ Nie „naprawiać" kolejności
  w `StatusEffects` — zmieniłoby to jad skoczka.
- **Snapshot 10% liczy się PRZED krytykiem.** Krytyk podnosi wyłącznie cios
  bezpośredni. Buff Okrzyku wchodzi normalnie (bo wchodzi do rzutu), `m(P)`
  i Ześlizg też (rana dziedziczy biegłość ciosu, który ją zadał). Żeby to było
  możliwe bez odtwarzania arytmetyki `rollDamage` u wołającego, funkcja zwraca
  dziś **addytywne** `preCrit` — `amount` i `crit` bit w bit jak przedtem.
- **Tik NIE liczy pancerza i nie ma typu obrażeń.** Poza analogią do jadu jest
  tu powód własny i mierzalny: `ARMOR_PROFILE.metal.slash = 1,4`, więc stal
  **wzmacniałaby** ranę. Feedback: **tylko pasek HP wroga**, odświeżany na
  każdym tiku (wróg nie ma paska efektów, a `core/Buffs` jest listą GRACZA).

**Uprzęże:** `effects_weryfikacja` 40 → **65 sprawdzeń** (nowa §7 na PRAWDZIWYM
`BLEED` i PRAWDZIWYCH liczbach configu); `combat_regresja` — nowa **§V**, 33
asercje na deklarację, adres, ścieżkę snapshotu i kontrakty `Enemy`.
⚠ **Każda sprawdzona CELOWYM ZEPSUCIEM**, z przywróceniem plików 1:1 (md5):
granica wygaśnięcia `<= 0` → `< 0` **→ 6 błędów, w tym zmierzone 6 tików i 60
obrażeń**; `maxStacks 1 → 3` → 3; tag `BLEED` → `poison` → 2; klucz payloadu
`damagePerTick` → `damage` → **TS2345 u konsumenta i TS2353 u producenta**;
snapshot od `roll.amount` → 3; tik bez `scaleDamage` → 2; brak `EffectSource`
→ 1; literał czasu w deklaracji → 1; brak `creditKill` (obie strony) → po 1;
własny `bleedUntil` na `Enemy` → 1.

**Zielone:** `tsc` 0 · `build` 0 · pełny przebieg `tools/*.mjs` — **17 × exit 0,
2 × exit 1**, oba czerwone ZNANE i sprzed tej sesji (`atrybuty_kalibracja`:
Sztylet 24,0 wobec 25; `stamina_model`: 20 spawnów wobec rosteru 19).

### Finalny audyt tej samej sesji — dwie realne poprawki

Przegląd całego diffu (nie tylko Krwawienia) znalazł **dwie rzeczy do
naprawienia** i obie zostały naprawione przed zamknięciem.

**1. ⭐ PRZECIEK `φ` (`critLowCut`) DO KRWAWIENIA — złapany, naprawiony.**
`critLowCut` to cecha rodziny topora i sztyletu na Mastery M-II/M-IV: przy
krytyku **podnosi PODŁOGĘ losowania**, czyli krytyk zmienia nie tylko mnożnik,
ale i sam rzut. Pierwsza wersja liczyła `preCrit` z tego podniesionego rzutu,
więc **krytyk podnosił Krwawienie pośrednio**: zmierzone **+12,5%** na
M-II/M-III i **+25%** na M-IV — bez mnożnika, bez śladu i bez sposobu, w jaki
gracz mógłby to wytłumaczyć. Łamało to regułę „krytyk rusza wyłącznie cios
bezpośredni" tam, gdzie nikt by nie szukał.

⭐ **Naprawa jest bit-w-bit neutralna i nie kosztuje ani jednego rzutu:**
`Phaser.Math.FloatBetween(a, b)` to **dosłownie** `Math.random() * (b − a) + a`
(sprawdzone w źródle Phasera, nie założone), więc rozpisanie go daje JEDEN
`u`, z którego powstają DWA odwzorowania — `base` na pasmo ciosu i
`basePrzedKrytykiem` na pełen zakres. `base` zostaje identyczne, globalny
strumień losowy nietknięty. Zweryfikowane: **200 000 losowych par `(min, max,
φ)`, zero rozjazdów bitowych**; przy `φ = 0` obie liczby są tożsame, więc dla
dziewięciu z jedenastu broni i każdego poniżej M-II poprawka nie zmienia ani
jednego bitu.

**2. Tożsamość umiejętności wyciekła do warstwy ogólnej.**
`damageMatchingEnemies` wpisywało `abilityIconKey("rend")` na sztywno — czyli
nazwę konkretnej umiejętności w **generycznym wykonawcy**, wbrew regule
„archetyp opisuje `kind`, nigdy `if (id === …)` we wspólnej warstwie".
Druga umiejętność z Krwawieniem dostałaby cudzą ikonę i nikt by tego nie
zauważył. Ikonę dokłada dziś **tłumacz z `action.id`** — dokładnie tam i tak
samo, jak dokłada `refund.id`.

⚠ **Przy okazji naprawiony strażnik, który świecił na czerwono na poprawnym
kodzie:** §V czytało `damageMatchingEnemies` RAZEM z komentarzami, więc
dopisanie jednej linijki komentarza wypchnęło asercję poza okno. Strażnik ma
mierzyć KOD, nie długość dokumentacji — ta sama lekcja co przy §T7 (2026-08-26).

**Uprząż po audycie:** §V **33 → 38 asercji** (V11–V13 na `φ`, V14 na
tożsamość). Każda sprawdzona zepsuciem: powrót `preCrit` do `base` → 1,
złe odwzorowanie `basePrzedKrytykiem` → 1, drugi `Math.random()` → 2,
literał ikony z powrotem w wykonawcy → 1. Sonda liczbowa potwierdziła
przypadek kontrolny: **110 / 10 / 160** bez krytyka i **198 / 10** z krytykiem.

**Świadomie NIE ruszone w audycie:** pięć tików zamiast sześciu (decyzja
autora), dwie ścieżki DoT (po jednej na hosta), `onEffectsChanged` pusty,
`EffectSource` bez czytelnika, liczby-placeholdery.

⚠ **W silniku nieoglądane** — to samo ograniczenie środowiska, co przy P3.
Do sprawdzenia w playteście: czy pięć tików czyta się jako rana, czy jako szum
paska HP, i czy Rozcięcie odróżnia się w ręku od Ciężkiego uderzenia.

📄 **Pełny opis mechaniki (wzory, przepływ, zachowania brzegowe, zależności):
`docs/rozciecie_krwawienie.md`.**

---

## 2026-09-03 (2) — Mastery: okno przedsprzedaży rangi (`cap − 10`)

**Decyzja autora, jedna zmiana.** Trener sprzedaje kolejną rangę **10 punktów
`P` przed sufitem** (40 / 90 / 190 / 340 zamiast 50 / 100 / 200 / 350).

**Po co:** praktyka zdobyta na suficie **przepada** (§34.3), więc dotąd jedyna
droga do wyższej rangi prowadziła przez **zatrzymanie się** — gracz dowiadywał
się, że ma iść do trenera, dopiero gdy już zaczynał tracić. Okno zamienia to na
ostrzeżenie z wyprzedzeniem: jest czas dojść do wioski, zanim licznik stanie.

⛔ **Sufit się NIE ruszył ani o punkt** — i to jest cała trudność tej zmiany.
Nietknięte: progi 50/100/200/350, cennik, efekty rang, model `P`, naliczanie
praktyki, przepadanie praktyki na suficie, powiadomienie o suficie, ranga jako
osobny zapisany stan. Zmiana to **jedna stała** (`PROFICIENCY.mastery.
unlockLead`) czytana z **jednego miejsca** (`masteryOffer`).

⚠ **Miejsce, w którym to mogło się rozlać po systemie po cichu:** odczyty
o PROGU (§34.5) — `thresholdRankFor`, `P_start` nowej rodziny (D3), pasek
postępu. Gracz, który kupił M-I przy `P = 40`, **nie jest weteranem**, bo D3
pyta o kompetencję (`P ≥ 50`), a nie o zapłatę. Uprząż pilnuje tego wprost.

**Uprząż:** 193 → **260 sprawdzeń** (nowa §10a). Czerwone świeci dwoma
niezależnymi zepsuciami: `unlockLead: 0` → 14 błędów, przeciek okna do `capFor`
→ 30 błędów. ⭐ Przy okazji uprząż złapała błąd **w moim teście**, nie w kodzie:
sprawdzałem „praktyka płynie" wilkiem (`P = 68`) przy graczu na `P = 90+`, gdzie
funkcja nauczyciela milczy z projektu (`ρ ≤ 0,8`).

---

## 2026-09-03 — Biegłość: domknięcie zakresu przed pierwszym playtestem

```
STATUS:
WARSTWA 2 (OBA KIERUNKI)       = W KODZIE
PRAKTYKA: MANEKIN + WALKA      = W KODZIE (D7 zamkniete)
MASTERY I-IV (stan kupowany)   = W KODZIE (§34, ladunki rang)
POWIADOMIENIE O SUFICIE        = W KODZIE (ta sesja)
PLAYTEST                       = NIEWYKONANY -- to jest nastepny krok
```

**Sesje 10–13 (2026-09-02, commit `7955d74`) wdrożyły §34, ładunki rang,
regenerację 3/4 i praktykę z walki.** Ta sesja była przeglądem całości przeciw
kontraktowi §34.10 i liście długu §33.3 — z jednym pytaniem: czy da się dziś
zagrać w cały system bez dziur.

**Znalezione: jedna pozycja niedowieziona.** Kontrakt poz. 12 („powiadomienie
o progu OBOWIĄZKOWE") był spełniony w połowie — trzy panele mówiły o suficie
poprawnie, ale **każdy wymaga, żeby gracz sam z siebie postanowił go otworzyć**.
W samej grze dojście do sufitu `P` było nieodróżnialne od dalszej nauki: ten sam
cios, ten sam dźwięk, zero informacji — a §34.3 każe praktyce w tym stanie
**przepadać**. Wdrożone: zdarzenie `weaponCapReached` z obu kanałów praktyki
(raz w chwili dojścia, potem przy każdym zmarnowanym ciosie) + napis w kolumnie
HUD-u, **dławiony po stronie UI** do raz na 20 s. ⛔ Fuszerka i pudło milczą —
nie niosły praktyki, więc nie ma czego ogłaszać jako straty.

⭐ **Poza tym nie ruszono nic** — i to jest wynik przeglądu, nie oszczędność.
Sprawdzone i kompletne: jeden rzut Execution na zamach po warstwie 1,
`allowFumble` jako własność akcji, zamrożenie `P`/rodziny w `StrikeProfile`,
sufit + softzone + `√k` w obu kanałach praktyki, rozdział PRÓG/RANGA (§34.5)
w komplecie, ładunki rang z filtrami rodzin, zakup u trenera z kontraktem
„sprawdź oba koszty przed pobraniem", cztery pola zapisu z autozapisem
wyciszonym na czas `load`.

**Świadomie zostawione otwarte** (pozycje D z §33.3, każda z powodem):
`g(x)` po stronie wroga — **nie ma z czego go policzyć**, `crit_bazowy` fauny
nie istnieje ani w `EnemyConfig`, ani w checkpointcie, a §13 zapisuje `g(P)`
jako *niewycenione*; pusty stan `boarCharge` przy przelocie (prezentacja);
ujemny bilans staminy przy blokowaniu lekkiego ciosu (balans, nie błąd);
kalibracja kierunku wróg → gracz (czeka na playtest).

**Uprząż:** `bieglosc_weryfikacja` 183 → **193 sprawdzenia**, nowa §13,
sprawdzona pod kątem czerwieni (wycięcie `emit` → 4 błędy). Reszta bramek bez
zmian i zielona.

⚠ **Podgląd Phasera w tym środowisku nadal nie renderuje** (`Framebuffer status:
Incomplete Attachment` — ten sam błąd co 2026-09-02), więc **układ nowego napisu
nie został obejrzany okiem**, tylko policzony. To jest pierwsza rzecz do
sprawdzenia w playteście.

---

## 2026-09-02 (3) — praktyka w kodzie, MASTERY przeprojektowane na stan kupowany

```
STATUS:
WARSTWA 2 GRACZ -> WROG        = W KODZIE (commit 8a0335c)
PRAKTYKA + MANEKIN             = W KODZIE
PRAKTYKA Z WALKI               = NIE (trzy miejsca nierozstrzygniete)
MASTERY                        = PRZEPROJEKTOWANE, ZERO KODU
```

**Sesja 7 (kod).** Warstwa 2 weszła po stronie gracza — `WeaponProficiency` jako
jedyny magazyn `P`, `P` i rodzina zamrażane w `StrikeProfile`, jeden rzut
`Execution` na zamach i dopiero po warstwie 1. Doszła praktyka (`core/Practice.ts`)
i kanał manekina `P_start → P_start + 10`, panel BROŃ i narzędzie playtestowe
u Patryczka. Waga wykonania dla nauki: clean 1,00 · graze 0,30 (istniejący
`slipMultiplier`) · fumble i whiff 0. Uprząż `bieglosc_weryfikacja.mjs`, 54
sprawdzenia, sprawdzona pod kątem czerwieni trzema zepsuciami.

**Sesja 8 (projekt, bez kodu).** ⚠ **Mastery przestaje być funkcją `P`.** Nowy
model (`bieglosc_checkpoint.md` §34): próg 50/100/200/350 daje **twardy sufit `P`
i uprawnienie**, rangę kupuje się u trenera za **50 / 250 / 700 / 1800 g**
i **0 / 1 / 2 / 3 pkt rozwoju** z istniejącej puli. **Praktyka zdobyta na suficie
przepada** — nie jest bankowana.

**Co zostało ODWRÓCONE i dlaczego to trzeba wiedzieć:**

- **wariant A z §14** (*„próg nadaje rangę automatycznie i bezwarunkowo"*),
  zamknięty w sesji 4 — dziś opisuje wariant odrzucony;
- **zakaz z §14**: *„⛔ Mastery NIE MOŻE kosztować punktów umiejętności… Złoto tak,
  punkty nie"*. Argument, którym go uzasadniono (ranga staje się wyborem buildu,
  a nie wynikiem praktyki), **nie został obalony — został nazwany i przyjęty jako
  cena.** Liczby: 6 pkt na pełną rodzinę, 30 pkt na pięć, przy 13 pkt na cały
  katalog umiejętności i 1 pkt na poziom.

⭐ **Zamknięte przy okazji, bez wysiłku:** otwarte pytanie §28 *„czy softzone gaśnie
w capie, czy powyżej niego"* **znika razem ze swoim zakresem** — skoro `P` staje
twardo na progu, stan „`P` powyżej capu" nie istnieje. Cztery sesje temu to samo
pytanie było oznaczone jako BLOKUJĄCE dla wariantów B/C.

⚠ **Twardy warunek odziedziczony z tamtej analizy i już spełniony przez kod:**
pasmo softzone musi być kluczowane **progiem `P`, nigdy posiadaną rangą** —
`Practice.masteryBand()` czyta wyłącznie `P` i **nie wolno tego przepiąć** przy
wdrażaniu §34.

**Ekonomia — na czym stoi cennik** (zmierzone na żywym configu i mapie): pełne
wyczyszczenie lasu ≈ 197 g, questy 630 g, cały sklep 1407 g, wszystkie
umiejętności 835 g, najdroższy przedmiot 360 g, zaobserwowany portfel 1618 g.
Praktyka i złoto pochodzą z tej samej czynności, więc na drodze do M-IV gracz
zarabia mimochodem ~16 700 g. Stąd: **M-I = 0,3 przejścia lasu** (formalność, bo
jest twardą bramką progresji), **M-IV droższe od całego sklepu** (jedyna rzecz,
która zostaje do kupienia po skompletowaniu ekwipunku — odpowiedź na
`odlozone.md` §1 „martwe złoto").

Zmiany wyłącznie w dokumentacji: `bieglosc_checkpoint.md` (nowe §34, banner,
znaczniki ⚠ ODWRÓCONE przy §14 ×2, §27, §28 ×2, §33), `CLAUDE.md`, `docs/README.md`,
`docs/odlozone.md`, `docs/zaimplementowane.md`. **Kodu nie tknięto.**

---

## 2026-09-02 (2) — żółte tło po awansie: SPROSTOWANIE diagnozy z 2026-08-20 + naprawa

```
STATUS:
ŻÓŁTE TŁO PO AWANSIE           = NAPRAWIONE (GameScene.playAccent)
DIAGNOZA Z 2026-08-20           = BYŁA BŁĘDNA CO DO TEGO OBJAWU — sprostowana niżej
REKURENCJA `Quests`             = była PRAWDZIWYM, OSOBNYM błędem; naprawa `sweeping` STOI
```

User zgłosił ze zrzutu: po oddaniu zadania, które daje awans, przy otwartym
oknie dialogowym cała scena dostaje jednolite żółte tło. **To jest dokładnie to
samo zgłoszenie, co 2026-08-20** („awans po zakończeniu zadania jeśli jesteśmy
w oknie dialogowym powoduje żółte tło") — objaw wrócił, bo nigdy nie został
naprawiony.

### Co było naprawdę

`GameScene.onLeveledUp` woła `cameras.main.flash(160, 255, 230, 128)` — czyli
`#FFE680`, barwa ze zrzutu co do wartości. Awans przychodzi także Z PAUZY:
`QuestPanel` oddaje zadanie, gdy `NpcDialog` trzyma `GameScene` zapauzowaną
(`PanelBase.pauseGame`). A w Phaserze scena zapauzowana **dalej się RYSUJE,
tylko nie dostaje `UPDATE`**:

```
SceneManager.update():  step()   dla status > START && <= RUNNING   → PAUSED (6) wypada
SceneManager.render():  render() dla visible && >= LOADING && < SLEEPING → PAUSED RYSUJE
CameraManager.update    słucha SceneEvents.UPDATE                    → nie leci
```

`Flash._elapsed` nie posuwa się ani o milisekundę, więc efekt stoi na **pełnej
alfie** aż do zamknięcia panelu. Ten sam mechanizm zamrażał drugi efekt tej
samej metody — `expandingRing` zastygał w pierwszej klatce, niewidoczny tylko
dlatego, że leżał pod żółcią.

### ⚠ Sprostowanie wpisu z 2026-08-20 — i co z niego ZOSTAJE

Tamten wpis („Dopisek tego samego dnia — user ZŁAPAŁ w żywej grze drugi,
poważniejszy bug") przypisał żółte tło **rekurencji** `Quests.advanceStages` →
`Inventory.addItem` → `inventoryChanged` → `advanceAllActive()`.

- ✅ **Rekurencja była PRAWDZIWA.** Udowodniona własnym headless symulatorem
  (201 wywołań `addItem` przed sztucznym limitem), naprawiona flagą `sweeping`
  w `QuestState`, zweryfikowana po naprawie (1 wywołanie, 1 emisja). **Ta
  naprawa stoi, jest potrzebna i nic jej tu nie podważa.**
- ❌ **Ale to nie ona malowała ekran.** Rekurencja burzyła i odbudowywała listę
  opcji dialogu dziesiątki razy w klatce — nie miała czym ustawić alfy kamery.
  Oba objawy zeszły się w jednym zgłoszeniu, bo mają **wspólny wyzwalacz**
  (awans przy oddawaniu zadania), i drugi został przypisany do pierwszego.

⭐ **Dlaczego pomyłka przeżyła sześć tygodni:** naprawa rekurencji wyglądała na
naprawę obu, a nikt nie awansował w dialogu ponownie aż do dziś. **Dwa objawy
z jednego wyzwalacza to nie jeden błąd** — i to jest lekcja z tego wpisu,
ważniejsza od obu tych błędów z osobna.

### Naprawa: `GameScene.playAccent()`

Jedna bramka na efekty czasowe sceny odpalane **spoza jej pętli** (ze zdarzenia,
przycisku panelu, rozmowy z NPC):

```ts
private playAccent(run: () => void): void {
  if (!this.scene.isActive()) return;   // dev: console.debug
  run();
}
```

**Porzuca, nie odkłada do `RESUME`** — decyzja autora i argument, który ją
zamyka: akcent opisuje CHWILĘ, a odłożony akcent opisuje chwilę, która minęła,
i czyta się jak nowe, niczym niewywołane zdarzenie po zamknięciu dialogu.
Informacja i tak dochodzi w komplecie — dźwięk awansu, baner HUD-u i baner
nowych umiejętności żyją w `UIScene`, **której nikt nie pauzuje**. Porzucany
jest wyłącznie akcent świata, na który gracz w tej chwili nie patrzy.

Reguła, którą ta metoda wymusza: **akcent przez bramkę, STAN i PRZEJŚCIA
nigdy.** Dlatego w `onLeveledUp` emisje `abilitiesUnlocked`/`abilitiesChanged`
zostały poza bramką, a przy odrodzeniu pod bramką jest błysk i aureola, ale
`startFollow`/`centerOn` już nie — porzucone zostawiłyby kamerę nad miejscem
śmierci. Portale (`fadeOut` + `FADE_OUT_COMPLETE`) **nie mogą** tam trafić:
porzucone dałyby czarny ekran.

Wpięte w dwóch miejscach: `onLeveledUp` (realna ekspozycja) i
`onRespawnRequested` (prewencyjnie — `RespawnPrompt` dziś NIE pauzuje, więc
zachowanie nie zmienia się ani o klatkę, ale mina jest rozbrojona).

### Znaleziona przy okazji, NIENAPRAWIONA ekspozycja

Tło panelu jest interaktywne tylko na własnym prostokącie (816×530), a HUD nie
chowa się przy otwartym panelu — więc **pasek umiejętności zostaje klikalny przy
zapauzowanej scenie**. Tapnięcie zdolności odpala wtedy `onAbilityRequested` na
zamrożonym świecie: `this.time.now` stoi, więc cooldown liczy się z martwego
zegara, a ring i `shake` zastygną tak samo jak żółty flash. **Nie ruszane** —
naprawa oznacza decyzję o bramkowaniu WEJŚCIA w czasie pauzy, czyli zmianę
zachowania rozgrywki, a nie łatę na efekt.

`tsc --noEmit` 0 błędów, `npm run build` czysty, dziewięć uprzęży z `tools/`
exit 0 (w tym `combat_regresja` — 111 przypadków, zero różnic). ⚠ **Nie
obejrzane w silniku**: Browser pane w tej sesji nie ma działającego WebGL
(`Framebuffer status: Incomplete Attachment` przy starcie Phasera).

---

## 2026-08-31 (10) — Bear: korekta brodu (1 kafel) — bród ZAMKNIĘTY, drugie gardło w A9 OTWARTE

```
STATUS:
BEAR — GŁÓWNY BRÓD (A4)        = NAPRAWIONY (1 kafel, tx=40 ty=24: gid 838→890)
BEAR — DRUGIE GARDŁO (A9)      = ZDIAGNOZOWANE, NIEROZSTRZYGNIĘTE, wymaga większej korekty
```

Kontynuacja (9). Punkt wyjścia: podejrzenie, że problem Beara to nie „duże
ciało kontra las", tylko sam bród jest ciasny nawet dla mniejszych stworzeń.
Potwierdzone.

### Diagnoza (świeży `NavGrid`, nie wcześniejsze przybliżenia)

Zejście do konkretnych kafli (nie tylko `NavGrid`, także surowe warstwy
`.tmj`) pokazało dokładny mechanizm: **droga (`path`) ma stałą szerokość
2 kafli (64 px), ale w jednym miejscu (ty 23→24) skacze bokiem o 1 kafel** —
a otaczające kafle warstwy `water` (tileset `ForestTransitions`, rodzina
kafli brzegowych) są tam **masowo `solid: true`, bez luzu**. Nakładka „skok
o 1 kafel" + „zero zapasu" dawała dokładnie **32 px** wspólnej części między
sąsiednimi rzędami — twarda przyczyna, nie „ciało za duże". Winne kafle
terenu, **nie drzewa** (żadne drzewo nie stoi w promieniu zwężenia,
sprawdzone).

### Ślepy zaułek po drodze: gid 837/839 są PUSTE

Pierwsza propozycja (838→837, „sąsiedni wariant w tym samym wierszu
tilesetu") **odrzucona po realnej weryfikacji pikselowej** (wycięty i
powiększony fragment `terrain_forest_transitions.png`, nie zgadywanie z
configu): 837 i 839 to **całkowicie puste kafle**. Podmiana ujawniłaby kafel
warstwy `ground` pod spodem — zwykłą **trawę**, w środku piaszczystego
brzegu tuż przy wodzie. Sprawdzone też szerzej: prawie cała otaczająca
rodzina brzegowa (738, 739, 806, 833, 835, 836, 838, 841, 843, 846, 847) jest
`solid` — to nie jest jeden źle oznaczony kafel, tylko cała rodzina
zaprojektowana jako blokująca.

**Poprawny zamiennik: gid 890 (local 164)** — brązowy, wydeptany kafel
brzegu, **niesolid**, i już użyty na mapie jeden rząd dalej (ty=25,
tx 37–40) — dokładnie ten kafel, który tworzy widoczny piaszczysty brzeg w
tym miejscu. Nie nowy element, tylko przedłużenie istniejącego o jeden rząd.

⚠ **Wniosek na przyszłość**: sąsiedztwo w siatce tilesetu NIE gwarantuje
sensownego zamiennika wizualnego — trzeba wyciąć i obejrzeć piksele, nie
wnioskować ze struktury danych. Ten sam błąd, który już raz kosztował sesję
przy `docs/dziennik.md` (7) („kafel wycięty ze współrzędnych regenerowanego
arkusza to współrzędna bez właściciela") — tu złapany PRZED zapisem, nie po.

### Wdrożenie — dokładnie 1 kafel

`tx=40, ty=24` (świat 1280,768), warstwa `water`, obie kopie `forrest.tmj`:
**gid 838 → gid 890**. Potwierdzone programowo: dokładnie jedna wartość w
tablicy `data` zmieniona w każdym pliku, `trees`/`objects`/`rosliny`/
`flora-wodna`/`krzewy`/`kamienie` bajt-w-bajt identyczne jak przed zmianą i
między obiema kopiami. `npx tsc --noEmit` i `npm run build` czyste.

### Wynik na żywej, edytowanej mapie

| | bodyW | przed | po |
|---|---|---|---|
| Player | 18 | ✅ 2370 px / 14 wp | bez zmian |
| Wolf | 28,8 | ✅ 2390 px / 14 wp | bez zmian |
| Boar | 46,2 | ❌ brak trasy | ✅ 2431 px / 14 wp |
| Bear | 48,0 | ❌ brak trasy | ✅ 2431 px / 14 wp |

Lokalny prześwit samego brodu: **32 → 64 px** (prawdziwy margines, nie
wciskanie się w granicę). Render przed/po (zoom×2 na sam bród, zoom×4 na
zmieniony kafel, zoom×1 na szerokie otoczenie): zmieniony kafel czyta się
jako mała piaszczysta ostroga wchodząca w wodę tuż przy drodze — te same
schodkowe krawędzie sand/woda co reszta brzegu na tej mapie, zero
prostokątnej dziury, zero wrażenia mostu.

### ⚠ Drugie wąskie gardło — POTWIERDZONE, NIE NAPRAWIONE

Minimalny clearance NA CAŁEJ trasie Bear (spawn ↔ główny las) to nadal
**dokładnie 48 px** — nie 64. Przyczyna: **osobne, niezwiązane z brodem**
zwężenie w okolicy x≈2528, y≈432 (A9, ~1250 px na wschód od brodu),
zlokalizowane tą samą metodą co bród (najkrótszy „most" między składowymi
przy bw=49 — nie zgadywanie). Bear dziś **przechodzi, ale z zerowym
marginesem**.

**Mechanizm INNY niż bród — mieszany, nie tylko teren**: brak tam solidnych
kafli wody w bezpośrednim sąsiedztwie (sprawdzone — teren czysty), zamiast
tego **kilka drzew** (małe pnie, 13–18 px, x 2439–2601 / y 305–467)
skupionych blisko dużego solidnego bloku wody dalej na południe (ty 16–19).
To NIE jest ta sama, prosta korekta co bród — wymagałaby ruszenia i drzew, i
terenu naraz, czyli dokładnie „większej przebudowy" z definicji polecenia.
**Nie tknięte, zgodnie z poleceniem.** Rekomendacja do osobnej, przyszłej
decyzji — nie wdrażać automatycznie przy okazji następnego zadania.

---

## 2026-08-31 (9) — Naprawa `body.width` + GreyWolf Wariant A (wyjście z siedliska)

```
STATUS:
BODYW SPRZĘŻENIE SCALE→BODY   = NAPRAWIONE
GREYWOLF SAFE-KILL (spawn)    = ROZWIĄZANE (Wariant A)
GREYWOLF — DRUGIE WYJŚCIE     = ODŁOŻONE (Wariant B udokumentowany, niewdrożony)
BEAR / BRÓD                   = NIETKNIĘTE, wciąż OPEN DECISION
```

Kontynuacja audytu topologii z (8). Dwie osobne rzeczy w jednej sesji: naprawa
architektoniczna (ciało fizyczne vs skala wizualna) i jej bezpośrednia
konsekwencja — dopiero po niej dało się w ogóle zaprojektować sensowną
korektę geometrii GreyWolfa.

### A. `body.width` przestał zależeć od `updateMotionFx`

Zmierzone przed naprawą: `body.width` GreyWolfa (nominalnie 48 px = `20×2,4`
z configu) faktycznie wahał się **45–67 px w zależności od fazy oddechu i
prędkości** — bo `Enemy.updateMotionFx` (squash/stretch/oddech/„pop" po
trafieniu) woła `setScale()` na tym samym obiekcie, który niesie `Body`, a
Arcade **co klatkę przelicza `body.width = sourceWidth × scaleX`**
(potwierdzone w źródle Phasera, `Body.js:updateBounds`). `Locomotion.resolve()`
czyta to `body.width` na żywo i podaje jako `bodyW` do `PathFollower`/solverów
— czyli nawigacja gonił ruchomy cel, którego nikt świadomie nie wybrał.

Dodatkowo złapane w kodzie: `PathFollower.next()` ma `bodyW !== this.bodyW`
jako jeden z warunków przeliczenia trasy (`wrongBody`) — przy falującym
`bodyW` ten warunek był prawdziwy niemal co klatkę, więc throttling A*
(`findPath`), który plik deklaruje w nagłówku, w praktyce nie działał dla
żadnego poruszającego się wroga.

**Naprawa** (`src/entities/Enemy.ts`): nowa `restoreBodySize()`, wołana jako
PIERWSZA linia `updateAI()` — pisze `body.width/height/halfWidth/halfHeight`
wprost jako `cfg.bodyWidth × cfg.scale` (bez `body.setSize()`, bo ten mnoży
przez WŁASNĄ, już nieaktualną skalę body — sprawdzone w źródle, nie
założone). Świadomie **nie** „po `updateMotionFx()`", jak brzmiała pierwsza
wersja polecenia — prześledzenie kolejności klatki Phasera (`Body.preUpdate`
w `SceneEvents.UPDATE`, PRZED `GameScene.update()`) pokazało, że łatka w tym
miejscu ginie, zanim `Locomotion.resolve()` zdąży cokolwiek przeczytać.

Zweryfikowane na żywo (nie tylko liczbą z configu): GreyWolf złapany w pełnym
pościgu (`speed=132=chaseSpeed`, `scaleX=2,736` — wizualnie dokładnie tyle,
ile dawał stary błąd) miał `body.width=48` przez cały czas. Wolf/Boar/Bear
sprawdzone tak samo. `cfg.hurt`/hurtbox — bez zmian, bo nigdy nie czytały
`body.width`. `PathFollower.computedAtMs` przestał gonić za `now` co klatkę.

⚠ **Nowa, trwała informacja projektowa**: `bodyW` każdego `Enemy` jest teraz
faktycznie stały i równy `cfg.bodyWidth × cfg.scale` — każda przyszła analiza
prześwitów może to traktować jako fakt, nie przybliżenie.

### B. GreyWolf — przeliczenie i Wariant A

Świeży `NavGrid` z żywego silnika (nie z poprzednich, częściowo skażonych
falującym `bodyW`, wyników): kieszeń GreyWolfa **372 komórki**, główna
składowa lasu **52 672 komórki**, próg — teraz naprawdę stały — **48 px**.
Sprawdzone wyczerpująco wszystkie 8 kierunków kompasu (zachłanne
przeszukiwanie do 35 drzew na kierunek): **jedyny kierunek prowadzący gdziekolwiek
to wschód** — NE nie ma ani jednego drzewa z realnym wpływem, N/NW/W
płaskoszczytują pod 1700–1750 komórek nawet po 30+ drzewach, S/SE kończą się
razem z krawędzią mapy. Znaleziono też **Wariant B** — drugą, w pełni
zweryfikowaną trasę (15 drzew, inne drzwi 96 px dalej na południe) —
**udokumentowany, NIE wdrożony**, zostaje jako gotowa opcja na później.

**Wdrożony: Wariant A, 8 drzew, PRZESUNIĘTYCH (nie usuniętych)** — obie kopie
`forrest.tmj`:

| id | gatunek | stara pozycja | nowa pozycja |
|---|---|---|---|
| 1575 | grab_duzy_new | 368, 1792 | 360, 1824 |
| 413 | swierk_sredni_new | 384, 1792 | 390, 1820 |
| 437 | brzoza_duza2_new | 416, 1760 | 426, 1730 |
| 1576 | grab_duzy_new | 432, 1792 | 422, 1826 |
| 1606 | swierk_maly2_new | 448, 1792 | 456, 1822 |
| 1577 | swierk_maly2_new | 448, 1760 | 440, 1726 |
| 1544 | swierk_duzy2_new | 528, 1760 | 534, 1732 |
| 924 | grab_maly_new | 608, 1792 | 602, 1824 |

Przesunięcia dobrane eksperymentalnie (test kolejnych wielkości: 16 px za
mało, 23 px wciąż za mało, 24 px otwiera połączenie — próg twardy z
rozdzielczości `NavGrid` 8 px) i zaokrąglone w górę do ~28–34 px z jitterem
x (±6–10 px), żeby uniknąć dwóch idealnie równoległych rzędów. Zweryfikowane
PRZED zapisem: podgląd na żywym silniku (przesunięcie realnych sprite'ów w
scenie, zrzut ekranu, powrót) — brak alei, brak prostokątnego prześwitu, ślad
wizualny nieregularny.

**Wynik na żywej, edytowanej mapie** (nie symulacja): spawn GreyWolfa i
punkt odniesienia w głównym lesie mają ten sam numer składowej NavGrid
(52 672 → 53 085 po scaleniu). `PathSolver.findPath` (prawdziwy, nie
przybliżenie) potwierdzony w obie strony (wyjście z siedliska I powrót) do
pięciu różnych punktów głównego lasu, 10–26 waypointów, żadna trasa nie
zawraca przez siedlisko. Symulowany łańcuch ucieczki gracza (5 kroków w głąb
lasu) — GreyWolf ma trasę na każdym kroku, rosnącą długością wraz z
dystansem, bez zrywania się.

**Retest safe-kill**: dawna 372-komórkowa kieszeń GreyWolfa jest dziś częścią
głównej składowej — konkretny, znany spot **usunięty**. Audyt bezpośredniego
otoczenia (promień ~5 kafli od siedliska i korytarza) pod kątem INNYCH
oczywistych foreców: 27 mniejszych kieszeni nadal istnieje w promieniu, ale
żadna nie przekracza 104 komórek (~6,5 kafla) i żadna nie leży bezpośrednio
przy nowym wyjściu — ta sama „naturalna tekstura", którą globalny audyt (8)
już sklasyfikował jako kategorię A. **Nie znaleziono uzasadnienia dla
dodatkowych przesunięć** — zgodnie z poleceniem autora nic nie wymuszono.

`npx tsc --noEmit` i `npm run build` czyste. Liczba drzew w obu `forrest.tmj`
nadal 1641 — zmienione wyłącznie pozycje ośmiu wskazanych obiektów.

---

## 2026-08-31 (8) — CHECKPOINT: „Optymalizacja mobilna + PathSolver + topologia lasu"

```
STATUS:
LAS WORLD DESIGN         = CLOSED
LAS AI/NAVIGATION        = STABLE WITH POLISH
MOBILE OPTIMIZATION      = IN PROGRESS
RUNTIME MOBILE VALIDATION = PENDING
```

**Następny punkt wejścia dla kolejnej sesji**: najpierw przeczytać ten wpis
oraz `docs/plan_dalszych_prac.md` (nowy, jedyny bieżący plan kolejnych
kroków — dodany do `docs/README.md`). Potem zacząć od testu runtime na S21
FE (ETAP A), dopiero potem globalny audyt topologii lasu pod kątem
alternatywnych korytarzy dla fauny (ETAP B).

Ta sesja przeszła jednym ciągiem przez cztery fazy: diagnoza wydajności
mobilnej → `Y_SORTED_WORLD` → `RenderCuller` → atlasowanie (już opisane w
(7) niżej) → weryfikacja `PathSolver` na żywej mapie → naprawa izolacji
watahy wilków → pełny audyt geometrii GreyWolfa. Poniżej zapis chronologiczny
części, która NIE miała jeszcze wpisu.

### A. Diagnoza wydajności mobilnej

Punkt wyjścia: **odczuwalny problem z wydajnością na Samsungu Galaxy S21
FE**, przy braku analogicznych problemów na desktopie. ⚠ **Desktopowy
localhost NIE jest miarodajnym testem mobilnym** — inny GPU, inny
throttling, inna rozdzielczość efektywna; różnica jest jakościowa, nie tylko
ilościowa.

Analiza Phaser 3.90 potwierdziła: `Image`/`Sprite` **nie są automatycznie
cullowane** względem pozycji kamery — silnik renderuje wszystko, co jest w
display list, niezależnie od tego, czy mieści się w viewport. `visible=false`
POMIJA obiekt w renderowaniu (poprawny mechanizm do cullingu). `setActive(false)`
**NIE jest właściwym mechanizmem w tym projekcie** — wyłącza update loop
(AI, fizykę), nie rendering, więc użyty do cullingu wizualnego wyłączyłby
przy okazji zachowanie stworzeń poza ekranem.

Orientacyjne liczby (viewport telefonu ~772×356 px świata, ten sam kadr co w
`fauna_faza1.md`):
- **~2449 obiektów świata** łącznie na mapie lasu,
- **~115 obiektów** faktycznie w samym viewport,
- **~349 obiektów** przy marginesie +1× viewport,
- **~684 obiektów** przy marginesie +2× viewport.

⚠ Żadna liczba FPS nie została tu zapisana jako fakt — nic nie było
zmierzone na telefonie w tej sesji, tylko wywnioskowane z analizy kodu i
geometrii sceny.

### B. `Y_SORTED_WORLD`

Wprowadzony `Y_SORTED_WORLD` (`src/core/YSortedWorld.ts`): rozdzielenie
elementów **statycznych** (nie wymagających Y-sortowania co klatkę) od
elementów **dynamicznych** (wymagających ciągłej aktualizacji depth względem
gracza i innych encji). Wynik: **~52% redukcji statycznej listy
sortowanej**.

W trakcie implementacji wykryto dodatkowe źródła dynamicznych depth-update,
które trzeba było uwzględnić osobno: **`Bird`, `FarmAnimal`, `targetMarker`,
elementy potomne encji** (child sprite'y, nie tylko sam korpus). Wszystkie
poprawnie uwzględnione.

Potwierdzone przy okazji, nietknięte: korona drzewa (`canopy`) jest
`DEPTH.overhead` (walk-behind, nie Y-sort), pień pozostaje Y-sorted; kolizja
i nawigacja (`NavGrid`) to niezależne dane od warstwy renderowania — zmiana
jednej nie rusza drugiej.

### C. `RenderCuller`

Zaprojektowany i wdrożony `RenderCuller` (`src/core/RenderCuller.ts`,
`src/world/RenderCulling.ts`) — culling względem viewport kamery z
marginesem. ⚠ **Render-only**: nie wyłącza gameplay, AI ani physics — te
działają dalej dla obiektów poza ekranem, culling dotyka wyłącznie tego, co
się rysuje.

**To NIE jest wniosek „problem wydajności rozwiązany".** Działanie w
praktyce wymaga jeszcze testu na prawdziwym S21 FE (ETAP A planu) — dziś
zweryfikowane tylko logicznie/przez `tsc`+`build`, nie zmierzone na
urządzeniu.

### D. Atlasowanie

Pełny opis w (7) niżej i `docs/katalog_assetow.md` §4.1 — tu tylko status
zbiorczy:

```
ATLASOWANIE (forest_decor_atlas + water_flora_atlas) = IMPLEMENTED
RUNTIME VALIDATION (na telefonie)                     = PENDING
HERBS ATLAS                                           = NOT IMPLEMENTED
```

`forest_decor_atlas.png` (512×512, 56 klatek: 23 kamienie + 11 krzewów + 22
pniaki) i `water_flora_atlas.png` (256×256, 19 klatek) — bitowa zgodność
wszystkich 75 klatek zweryfikowana dwukrotnie, 2px padding, zero trimowania,
zero recoloru, zero skalowania, zero ponownego Pixel Snappera. Tiled
nietknięty, depth/Y-sort nietknięty. Stare PNG pozostawione fizycznie na
dysku jako rollback/referencja (nieużywane przez loader, nieusunięte
świadomie).

### E. PathSolver — weryfikacja na żywej mapie

```
PATHSOLVER = STABLE WITH POLISH
```

Potwierdzone tej sesji na żywym `forrest.tmj`: `PathSolver` działa globalnie
dla lądowych `Enemy`/`Critter` korzystających z `Locomotion` (nie tylko dla
wybranych gatunków), `NavGrid` jest źródłem clearance, `bodyW` jest
uwzględniany per stworzenie (dzik 46,2px, wilk 28,8px, GreyWolf/Bear 48px —
każdy inaczej ograniczony geometrią, zgodnie z projektem). `PathFollower` ma
throttling (nie liczy trasy co klatkę — `GOAL_MOVE_PX`/`MAX_AGE_MS`).
`SteerSolver` pozostaje lokalnym mechanizmem WYŁĄCZNIE dla dzika (jedyny
gatunek z `solver: "steer"`) — zweryfikowany jako działający poprawnie,
pościg aktualizuje się względem świeżej pozycji gracza, nie zamrożonego celu
sprzed kilku klatek.

### F. Wataha wilków — naprawa (WYKONANA, nie tylko zdiagnozowana)

Pierwotna izolacja trzech wilków (#14/#15/#16) wynikała **z geometrii
drzew**, nie z błędu `PathSolvera` ani z błędnych spawnów — potwierdzone
rekonstrukcją realnego `NavGrid` z żywej mapy i flood-fillem: cała trójka
siedziała w kieszeni 992 komórek odciętej od głównej składowej lasu (104 898
kom. dla ciała 28,8px).

**Naprawa: przesunięto TYLKO 2 drzewa, po 16px każde** — `id=948`
(grab_duzy_new, dy=−16) otwierał połączenie całej kieszeni z głównym lasem;
`id=244` (olcha_srednia2_new, dx=+16) odsuwał pień od punktu spawnu
wolf#15, który miał tam clearance 16px — mniej niż jego własne ciało
(28,8px). **Spawny wilków NIE zostały przesunięte** — obie korekty to
drzewa, nie zwierzęta.

Wynik zweryfikowany na żywej, edytowanej mapie: wszystkie 4 spawny wilków
(#14/#15/#16/#64) są dziś w jednej głównej składowej (105 890 kom.). Testy
pościgu (wilk goniący uciekającego gracza przez 7 różnych scenariuszy
terenowych) — **7/7 zakończone sukcesem** (wcześniej 5/7 zwracało `NULL`).
Obie kopie `forrest.tmj` zsynchronizowane, `tsc`/`build` czyste.

### G. GreyWolf — audyt safe-kill exploita

⚠ **To jest DIAGNOZA, nie naprawa — żadna zmiana kodu/mapy nie została
wykonana dla GreyWolfa w tej sesji.**

Ustalenia:
- GreyWolf: `bodyWidth = 48px`. Jego mikrobiotop (kieszeń 372 komórek) **nie
  ma ŻADNEJ komórki z clearance ≥48px** w bezpośrednim otoczeniu — potwierdzone
  wyczerpującym testem (8 kierunków × kombinacje do 4 drzew z 8 najbliższych
  kandydatów, zero rozwiązań).
- Otwarcie **pełnego** wyjścia wymagałoby ok. **14 drzew** wzdłuż najkrótszej
  możliwej linii (217px) do głównej strefy lasu — to nie jest sensowna
  punktowa poprawka (por. wzorzec z §F: 1–2 drzewa).
- **Safe-kill exploit potwierdzony**: ~299 punktów w 16 klastrach, gdzie
  gracz poziom 1 (kij, reach 74px, jedyna broń dostępna wcześnie w grze) może
  atakować GreyWolfa (biteReach 39px) bez ŻADNEJ możliwości, by ten dotarł
  bliżej — zweryfikowane realnym `PathSolver.findPath` (zawsze `NULL`) na
  każdym reprezentatywnym punkcie.
- **Problem jest SYSTEMOWY, nie dotyczy wyłącznie spawnu GreyWolfa** —
  odtworzony (mniejszą skalą) przy watasze wilków MIMO że ta ma już globalne
  połączenie z lasem (85 kandydatów / 8 klastrów lokalnie przy norze), oraz w
  **12 z 12** losowo próbkowanych, niepowiązanych ze spawnem kieszeni 48px
  rozsianych po całej mapie (progiem najostrożniejszym w rosterze, Bear
  24px). Boar — śladowo (2 punkty). Bear — brak lokalnie (ma inny, wcześniej
  opisany problem: izolacja przez szerokość brodu na rzece, nie drzewa).

### H. Najważniejsza decyzja dotycząca topologii (ZASADA PROJEKTOWA)

Zapisana jako oficjalna zasada, obowiązująca od tej sesji:

> **NIE wymagamy, aby każda szczelina między drzewami była przechodnia dla
> każdego stworzenia.** Jest normalne, że Player przechodzi przez małą
> lukę, Rabbit/Fox przez więcej, Wolf mniej, Bear/GreyWolf jeszcze mniej.
>
> Problemem NIE jest sama wąska szczelina. Problemem jest: brak sensownej
> alternatywnej trasy, powstawanie dużych izolowanych obszarów, sytuacja, w
> której gracz może łatwo wykorzystać topologię jako TRWAŁĄ FORTECĘ przeciwko
> AI.
>
> Docelowa zasada dla lasu gospodarczego: **„Nie każda szczelina musi
> mieścić każde stworzenie, ale normalna struktura lasu powinna zapewniać
> odpowiednie ciągi komunikacyjne dla zwierząt żyjących w tym lesie."**
>
> **LAS NIE MA BYĆ PROJEKTOWANY TAK, ŻEBY GRACZ MÓGŁ SWOBODNIE LAWIRUJĄC
> MIĘDZY DRZEWAMI UCIEC ZWIERZĘCIU TYLKO DLATEGO, ŻE AI NIE MA ALTERNATYWNEJ
> TRASY.**

### I. Melee LOS — ODŁOŻONE, nie jest planowanym rozwiązaniem topologii

Po dyskusji: **melee LOS nie wpisujemy do planu jako fix problemu
szczelin lasu.** Jeśli gracz może fizycznie wejść w daną wnękę, nie chcemy
automatycznie zabraniać mu ataku tylko dlatego, że pień stoi geometrycznie
pomiędzy nim a przeciwnikiem — to inny problem niż topologia dostępności.

```
MELEE LOS — ODŁOŻONE / NIE JEST OBECNIE PLANOWANE JAKO ROZWIĄZANIE
PROBLEMU TOPOLOGII LASU.
```

Fakt, że melee dziś nie ma LOS (potwierdzone czytaniem `HitResolver`/
`GameScene.targetInReach` — czysty test dystansu `gapBetween`, zero
raycastu), a ranged JE MA (`Spider` przez `nav.hasClearLine`, świadomie,
udokumentowane) — może być **później osobnym tematem Combat Design**, nie
odpowiedzią na exploit GreyWolfa.

### J. Player ↔ Enemy collision — zauważone, nierozstrzygnięte

Dziś: Player i Enemy **nie blokują się wzajemnie fizycznie** — jest
`physics.add.overlap` (do obrażeń kontaktowych), nie pełny `collider`.
Zauważone jako **potencjalna decyzja gameplayowa**, NIE jako bug do
natychmiastowej naprawy. Nie rozstrzygnięte w tej sesji.

### Otwarte decyzje (GreyWolf, Bear)

Pełny opis: `docs/plan_dalszych_prac.md` §OPEN DECISIONS. W skrócie:
GreyWolf wymaga decyzji autora (duży terytorialny drapieżnik ograniczony
terenem, świadomie, vs. korekta geometrii ~14 drzew) — niezależnie od tej
decyzji, exploit jest systemowy i wymaga osobnej naprawy (§H/§I wskazują
kierunek: zasada topologii + prawdopodobnie combat, nie tylko geometria).
Bear ma inny, osobny problem: bród na rzece za wąski dla ciała 48px — teren,
nie drzewa, niewykonane.

### Plan dalszych prac

Nowy dokument: **`docs/plan_dalszych_prac.md`** — jedyny bieżący plan
kolejnych sesji (ETAP A–G), dodany do `docs/README.md`. Nie duplikuje tej
sekcji dziennika — niesie wyłącznie kolejność i status operacyjny.

---

## 2026-08-31 (7) — Atlasowanie decoru: `forest_decor_atlas` + `water_flora_atlas`

Po audycie atlasowania (analiza, bez zmian kodu) wdrożone: **dwa atlasy**,
mechanicznie spakowane z już zaakceptowanych PNG, zero zmiany treści.

- `tools/build_forest_atlases.py` (nowy, wzorzec `build_tree_stamps.py` —
  przymiar domyślnie, `--zapisz` do zapisu). Pakowanie: proste shelf-packing,
  `Image.paste` BEZ maski (nie `alpha_composite` — to drugie przelicza RGB
  pod przezroczystymi pikselami i złapało się na `birch_stump_*`/
  `spruce_stump_*`: wizualnie identyczne, bajt-w-bajt różne — wykryte
  własną asercją skryptu, naprawione przed zapisem czegokolwiek).
- `forest_decor_atlas.png` 512×512 (30,9% wypełnienia) — 56 klatek: 23
  kamienie + 11 krzewów + 22 pniaki (21 gatunkowych + `pniak_z_siekiera`).
- `water_flora_atlas.png` 256×256 (27,2% wypełnienia) — 19 klatek: 17 flora
  wodna + `brzeg_stawu`/`lilia_wodna`.
- Weryfikacja bajt-w-bajt PRZED zapisem i PONOWNIE po odczytaniu zapisanego
  pliku z dysku — obie przeszły czysto (0 rozbieżności na 75 klatek).
  `tools/atlas_weryfikacja.mjs` (nowy, wzorzec `movement_weryfikacja.mjs`)
  zostaje jako stały regression gate: sprawdza istnienie każdej klatki,
  brak duplikatów, brak osieroconych klatek, brak starych kluczy tekstur.
- **Realna pułapka złapana W TRAKCIE, nie po fakcie**: pierwsza wersja
  przepięcia `GameScene`'s decor loop kompilowała się (`tsc` czysty) mimo że
  `def.asset.frame` był odczytywany z typu, który go NIE gwarantował dla
  91 wpisów `DECOR_PROPS` jednocześnie — `satisfies` sprawdza zgodność, ale
  NIE poszerza wywnioskowanego typu stałej. Naprawione nazwanym,
  eksportowanym `DecorPropDef` i jawnym rzutowaniem w pętli `GameScene`
  zamiast polegania na `(typeof DECOR_PROPS)[DecorId]`.
- `GameConfig.ts`: `ASSETS.<75 wpisów>` przepięte z `{key,path}` na
  `{key: atlasKey, frame: nazwaKlatki}` — **`DECOR_PROPS` (nazwy, `renderLayer`)
  i `.tmj` nietknięte**, dokładnie jak planowano. `src/core/Assets.ts`:
  dwie pętle `load.image` (kamienie/krzewy) i siedem pętli (gatunki pniaków)
  zastąpione dwoma `load.atlas(...)`.
- **Nie zaatlasowane, świadomie**: `mushrooms` (0–3 instancje na żywej
  mapie), `TreeStamps`/`TreeStampsBig` (już zamknięty system, nietknięty),
  `Well`/`Campfire`/`WaterWheel`/`TrainingDummy` (własne encje). `herbs_atlas`
  odłożony — populacja żywych ziół ograniczona `Gathering.maxActive`, nie
  setkami instancji.
- `npx tsc --noEmit` i `npm run build` czyste. Stare PNG **zostają na
  dysku** (nieużywane przez loader, ale nieusunięte — zgodnie z poleceniem:
  najpierw przepięcie + testy, usunięcie plików to osobny, świadomy krok).
- Pełna lista klatek i uzasadnienie wyborów: `docs/katalog_assetow.md` §4.1.

---

## 2026-08-31 (6) — ZAMKNIĘCIE ETAPU: las jako world-space

Autor zaakceptował stan po (4) i (5) i zamknął etap wprost, jednym zdaniem
(cytat, bo to jest teraz obowiązująca klasyfikacja, nie streszczenie):

```
LAS — ART / WORLD DESIGN = CLOSED
LAS — GAMEPLAY / AI = READY FOR RUNTIME TESTING
```

Akceptacja obejmuje dosłownie wszystko z (1)–(5): 7 gatunków drzew + nowy
buk, 21 pniaków, jeden system 23 kamieni (stary całkowicie wycofany), 286
krzewów, 72 stanowiska ziół, 244 obiekty flory wodnej, finalne podłoże,
model twardych kolizji, `NavGrid`, `PathSolver`+`PathFollower`, `SteerSolver`
jako lokalny fallback, LOS sieciarza, poprawki spawnów (wilk #4,
niedźwiedź), umiarkowany wzrost populacji.

**Świadomie POZA tym zamknięciem, zapisane jako gameplay polish do
PRZYSZŁEJ, osobnej decyzji — nie luki do domknięcia teraz:**
- wilk #2 (16 px prześwitu na spawnie — lokalnie odcięta kieszeń, znaleziona
  testami PathSolvera w (5), NIE była na liście „oczywistych problemów");
- standard prześwitu (`las_faza1b_final.md` §10) — formalnie dalej
  nierozstrzygnięty, ale autor wprost odmówił przerabiania geometrii lasu
  pod abstrakcyjny próg, skoro PathSolver już radzi sobie z różnym `bodyW`;
- soft-collision krzewów (`speedMultiplierAt`) — zaprojektowane miejsce,
  niewdrożone;
- reszta pierwotnego zakresu `forest_rebuild_scope.md`: A9/Brzeg Północny,
  A10/Źródło (teren dalej niepomalowany) i pełny cel populacji Z-9
  (19→25 wrogów, 7→15 ambient — dziś 23→26) — **nie są ani zamknięte, ani
  odrzucone**, tylko poza tym etapem.

**Reguła na przyszłość, zapisana explicite przez autora**: nie otwierać
ponownie etapów assetowych/world-space lasu bez konkretnego błędu wykazanego
w DZIAŁAJĄCEJ GRZE. Powód niedopracowania geometrii pod statystyczny
clearance jest odrzucony wprost — PathSolver rozwiązuje to inaczej
(trasowaniem, nie przerzedzaniem), więc dalsze rzeźbienie mapy pod liczbę nie
ma dziś uzasadnienia.

**Dokumentacja zaktualizowana w tej samej sesji** (żaden nowy plik — zgodnie
z regułą „nie twórz kolejnego dokumentu, jeśli istniejący katalog/checkpoint
wystarczy"): baner zamknięcia na górze `docs/forest_rebuild_scope.md` i
`docs/katalog_assetow.md`, zaktualizowany wiersz routingu w `docs/README.md`
(dwa wiersze: `forest_rebuild_scope.md`, `katalog_assetow.md`) i w korzeniowym
`CLAUDE.md` (tabela „Gdzie co jest" + bullet w „⏳ Otwarte", przepisany z
historii błędu na status zamknięcia).

**Następny etap (zapowiedziany, NIE rozpoczęty w tej sesji)**: testowanie
świata w działającej grze — runtime PathSolver, ruch wszystkich stworzeń,
zachowanie w gęstym lesie, stuck detection, rzeczywiste spawny, pościg/flee,
LOS sieciarza, ewentualne soft-collision krzewów. Nic z tego nie
zaimplementowano ponad to, co już było w (5) — to jest zapowiedź kierunku,
nie praca wykonana.

---

## 2026-08-31 (5) — PathSolver dla całego rosteru + korekta spawnów + umiarkowany wzrost populacji

Domknięcie przebudowy lasu po audycie (4). Kod, nie tylko analiza: nowy
`PathSolver`, dwie poprawki spawnów, realizacja S1/S2, LOS sieciarza, +5
nowych punktów populacji. Zero nowej grafiki, Snapper nie uruchamiany.

### PathSolver — jeden plik, cały roster za darmo

`src/core/movement/solvers/PathSolver.ts` (A* nad `NavGrid`, czysty — bez
Phasera) + `src/core/movement/PathFollower.ts` (pamięć trasy per stworzenie).
Wpięty w **`Locomotion.resolve()`**, nie w encjach: dla intencji `seek`
podmienia cel na najbliższy punkt trasy, PO CZYM ten sam solver (`direct`/
`steer`) prowadzi lokalnie — dokładnie model z briefu (Path → trasa globalna,
Steer → korekta w locie, Direct → fallback). ⚠ **To automatycznie objęło
CAŁY dotychczasowy roster `Enemy`+`Critter`**, bo to jedyne dwie klasy, które
w ogóle konstruują `Locomotion` (`Player`/`FarmAnimal`/`Projectile` — sprawdzone
grepem — nie używają `.move.*` wcale) — **zero zmian w którymkolwiek
`updateChase`**.

- **bodyW** brany z realnego ciała Arcade (`self.bodyW`, już przemnożone przez
  skalę) — nie z configu, nie ma osobnej siatki „dla dzika".
- **Fast path**: gdy linia prosta do celu jest wolna (`NavGrid.hasClearLine`,
  nowa metoda), trasa to jeden punkt = surowy cel — identyczne zachowanie co
  dziś, zero kosztu ponad dotychczasową sondę. Realny A* uruchamia się tylko,
  gdy droga jest zablokowana.
- **Throttling**: trasa NIE liczy się co klatkę. Przeliczenie tylko gdy: cel
  przesunął się >40px, trasa się zestarzała (4s — safety net), trasa się
  skończyła, albo stworzenie stoi w miejscu mimo intencji ruchu (>700ms bez
  progresu >6px).
- **Relaksacja start/celu**: gdy start albo cel same w sobie są za ciasne dla
  `bodyW` (np. cel = gracz stojący w wąskim miejscu), szuka najbliższej
  przejezdnej komórki w promieniu **10 komórek (80px)** — zmierzone na
  żywym spawnie wilka (patrz niżej), 6 komórek (48px) nie wystarczało.
  Bezpiecznik: brak trasy = `null` = wywołujący wraca do surowego `seek`
  (dzisiejsze zachowanie, nigdy gorzej niż dziś).
- **Zakaz cięcia rogów po przekątnej** między dwiema zajętymi komórkami —
  inaczej trasa przeciskałaby się przez róg pnia, którego ciało realnie by
  nie ominęło.
- String-pulling (uproszczenie trasy do punktów załamania) przez tę samą
  `hasClearLine` — bez tego cel `seek` skręcałby co 8px i drgał zamiast iść.

**LOS sieciarza** (`Spider.ts:fire`) — ten sam `NavGrid.hasClearLine`, bez
drugiego systemu kolizji. Sprawdzane PRZED wejściem w windup (`akcje.request`),
nie w `fire()` — brak LOS znaczy, że cooldown się NIE rusza (sieciarz nie jest
karany za geometrię, tylko czeka na czyste pole). Szerokość testu to
`WEB_PROJECTILE.bodyRadius*2` (pocisk), nie ciało pająka.

**Testy — deterministyczne na żywej mapie, nie runtime.** Panel przeglądarki
w tej sesji dzieli serwer dev z inną sesją (Browser tools go nie widzą) —
zgodnie z regułą „nie udawaj testu, którego środowisko nie umożliwia" testy
poszły przez `esbuild` → Node (ten sam wzorzec co `movement_weryfikacja.mjs`):
18 przypadków na prawdziwym `forrest.tmj` (kolizja kafli + 1641 pni), w tym
dokładny przypadek dzika z 2026-08-28 (`(2000,1104)`, wcześniej klinował się),
trasa przez most/bród, trasa OMIJAJĄCA budynek, i jawnie zaakceptowany `null`
tam, gdzie lokalna gęstość faktycznie nie zostawia miejsca na 29px (patrz
niżej) — **wszystkie 18 przeszły**. Skrypt testowy nie zostaje w repo
(jednorazowy, wzorem `tools/CLAUDE.md`).

### Poprawki spawnów (Część 3)

| co | z | na | powód |
|---|---|---|---|
| **wilk #4** | (912,1648) | (936,1648) | 0px prześwitu na spawnie (świerk 2px od punktu) → 48px, przesunięcie 24px |
| **niedźwiedź** | (2704,496) | (2692,486) | 32px prześwitu przy ciele 48px → 64px, przesunięcie 17px |
| sieciarz ×3 (S1) | (1616,1776)·(2160,1776)·(2352,1808) | (3072,946)·(3312,1298)·(3152,1650) | linia ubytku x=95 (`forest_rebuild_scope.md`) nadal aktualna — geometrycznie stare miejsca były OK, przesunięto z powodu FABULARNEGO |
| skoczek ×3 (S2) | (2320,1360)·(2704,1456)·(2800,1520) | (3296,946)·(3504,1362)·(3392,1698) | jw., głębiej/dalej na wschód niż sieciarz (konwencja `swiat.md`) |

Wszystkie nowe pozycje zweryfikowane: 0 na path/water/buildings, prześwit dla
własnego ciała z zapasem ≥17px ponad wymagane minimum, ≥180px od innego
spawnu jakiegokolwiek gatunku, sieciarz↔dzik nadal >>340px (asercja
`las_faza1b_final.md` nietknięta, teraz z jeszcze większym zapasem).

⚠ **Sarna #1 NIE przesunięta** (15px do najbliższego pnia w jednym kierunku
ucieczki) — zgodnie z poleceniem, to nie jest samodzielny powód do ruszenia
jedynego miejsca spawnu.

⚠ **Wilk #2 (16px prześwitu na spawnie) też NIE przesunięty** — nie był na
liście „oczywistych problemów" w tym briefie (tylko #4 i niedźwiedź). Nowe
ustalenie z testów PathSolvera: to jest lokalnie odcięta kieszeń dla ciała
29px nawet z relaksacją 80px — PathSolver poprawnie zwraca `null` i wraca do
surowego `seek` (bezpiecznie, nie gorzej niż dziś). Zostaje jako pozycja do
rozważenia w PRZYSZŁEJ korekcie spawnów, nie w tej.

### Umiarkowany wzrost populacji (Część 4–6)

Policzone przed decyzją: 23 punkty ambient/wrogów + 3 ptaki = 26 łącznie.
Dodano **5**: 2× `bird` przy bramie północnej (1250,96)/(1380,130) — zamyka
starą lukę „nic żywego w pierwszych 5 sekundach" (`forest_rebuild_scope.md`
§6.2), 1× `rabbit`/`fox`/`deer` w A2 (skraj lasu przy trakcie, dziś pusty —
`(1504,324)`/`(1088,388)`/`(1744,148)`). **+13% populacji realnej (23→26),
+67% ptaków (3→5)** — świadomie nierówno, bo ptaki są czystą, bezkosztową
dekoracją (zero ciała fizycznego), a reszta rosteru to prawdziwa treść
gameplayowa. Każdy nowy punkt zweryfikowany: przejezdny dla własnego ciała
(z ≥15px zapasu lokalnego), 0 na path/water/buildings, ≥100px od NAJBLIŻSZEGO
istniejącego spawnu jakiegokolwiek gatunku, ≥120–180px od tego samego
gatunku, rozstawione osobno (nie w jednym punkcie — pierwsza wersja algorytmu
tak zrobiła, złapane i poprawione przed zapisem). Zero nowych drapieżników —
zgodnie z briefem, wzrost idzie w faunę neutralną + ambient.

**Nie tknięte świadomie**: A1 (wyrąb) zostaje bez fauny — to zamierzona
pustka, nie luka. Reszta mapy (A5, A5b, A6, reszta A7/A8) bez zmian.

### AI navigation — odpowiedzi z audytu (4) POTWIERDZONE w kodzie

`map.solids`/`NavGrid` faktycznie jest jednym źródłem prawdy (nie trzeba było
niczego rozdzielać), `SteerSolver` zostaje lokalnym fallbackiem PO trasie
(nietknięty, wciąż tylko dzik), soft obstacles (`speedMultiplierAt`) świadomie
NIE dodane — tylko rekomendacja w kodzie zapisana przy `MovementContext`.

### Weryfikacja

`npx tsc --noEmit` i `npm run build` czyste. Obie kopie `.tmj` zsynchronizowane
(66/66 obiektów identyczne, `nextobjectid` 2775→2780 w obu). 18/18 testów
deterministycznych PathSolvera na żywej geometrii. Renderem potwierdzone:
nowa pozycja wilka #4 (na trawie, nie w pniu), niedźwiedzia (przy trakcie),
nowe spawny A2 (przy drogowskazie, między brzozami — czyta się jak żywe
wejście do lasu), nowe sieciarz/skoczek w A7 (rozstawione, nie w rzędzie).

**Następny krok (decyzja autora, NIE kolejna sesja automatycznie):** wilk #2
(16px, lokalnie odcięty), standard prześwitu (§10, wciąż formalnie otwarty —
PathSolver go OBCHODZI, nie rozstrzyga), soft-collision krzewów
(`speedMultiplierAt`, zaprojektowane, nie wdrożone).

---

## 2026-08-31 (4) — audyt kolizji i nawigacji lasu (dwie sesje: globalny audyt + wykończeniówka)

Po ETAP 4 (pniaki+buk) autor poprosił o dwa kolejne, czysto analityczne
przebiegi — **zero nowej grafiki, Snapper nie uruchamiany, zero zmian w
`.tmj`.** Pierwszy: globalny audyt kolizji środowiska (drzewa/skały/pniaki/
krzewy/zioła/flora wodna/budynki/teren, tabela collision↔świat). Drugi:
„wykończeniówka" — finalny audyt placementu 1641 drzew po migracjach, pełny
collision pass, ponowna weryfikacja pniaków/krzewów/kamieni/flory wodnej,
globalny rescan dekoracji na budynkach z regułą OGÓLNĄ (nie hardkod), audyt
populacji zwierząt względem realnej geometrii, rekomendacja architektoniczna
pod `PathSolver`/AI avoidance, i osobny wątek: sieciarz strzela bez line-of-
sight.

### Najważniejsze ustalenie: realny rozkład prześwitów jest DUŻO gorszy, niż
sugerował `las_faza1b_final.md` §10 — i to jest oczekiwane, nie regres

Stary §10 liczył prześwity na SIATCE 32px (drzewa jako kafle jednego kształtu:
`x=9,w=14`), więc wyszły dokładnie dwie wartości (18 / 32–33 px, 52+389 bram).
**Drzewa są dziś tile-objectami z 39 różnymi trunk-boxami (12–28 px) na
DOWOLNYCH pikselach** (`docs/tree_instances.md`) — inny model danych, inny
wynik. Policzone od nowa klonem algorytmu `NavGrid.ts` (transformata chamfer,
komórka 8 px) na żywej geometrii (1641 pni + 1042 boxy wody/budynków):

```
% mapy OSIĄGALNEJ (flood-fill z otwartego punktu), per ciało:
  gracz/królik (18–21 px):  87,5 %
  skoczek/wilk/sieciarz (24–31 px): 80,6 %
  dzik/Szary/niedźwiedź (46–48 px): 40,5 %   ⚠ mniej niż POŁOWA lasu
```

40,5% dla dużych stworzeń **potwierdza** starą sarnę z §10.4 (40,1%) — ale
teraz to liczba dla DZIKA/SZAREGO/NIEDŹWIEDZIA wprost, na dzisiejszej mapie,
nie estymata sprzed migracji drzew. **To nie jest coś do naprawienia w tej
sesji** — to jest twardy argument za tym, że decyzja o standardzie prześwitu
(§10, dalej NIEROZSTRZYGNIĘTA) jest pierwszym krokiem następnej sesji, nie
kolejnym audytem.

Rozkład najbliższego sąsiedztwa pień↔pień (1641 par): **79% ma sąsiada w
promieniu <21 px** (w tym 392 pary <6 px, wiele dosłownie stykających się
boxów) — to jest CHARAKTER gęstego lasu (canopy „swobodny overlap" z
`tree_instances.md`), nie 1641 błędów do poprawienia. Trójka nie została
przerzedzona.

### Nowe, konkretne znaleziska (do decyzji, NIE poprawione automatycznie)

- ⚠⚠ **Jeden z czterech wilków (912,1648, tile 28.5/51.5) ma prześwit 0 px w
  swoim własnym punkcie spawnu** — świerk (`swierk_duzy3_new`) stoi trunk-
  boxem 2 px od punktu spawnu. Wataha jest **oficjalnie NIETKNIĘTA (Z-7,
  anomalia fabularna)** — nie przesunięty, tylko zgłoszony. To jest inny błąd
  niż `las_faza1b_final.md` §10.3 (klinowanie w pościgu) — tu chodzi o sam
  PUNKT startowy.
- **Niedźwiedź (2704,496)**: prześwit w punkcie spawnu 32 px przy ciele 48 px
  — **nie mieści się sam w sobie**; tylko 47% najbliższego otoczenia (64 px)
  jest przejezdne dla jego własnego ciała. Zbieżne z planowanym S3
  (`forest_rebuild_scope.md`) — dodatkowy, świeży argument za przesunięciem.
- **Sarna @(1300,1500)**: potwierdzone z poprzedniej sesji — 15 px do
  najbliższego pnia (`grab_duzy2_new`) w kierunku, w który `flee` tylko się
  ślizga (nie omija). Punkt spawnu sam ma 64 px prześwitu (stać można), ale
  jeden kierunek ucieczki jest wąski.
- **Sieciarz strzela BEZ line-of-sight — potwierdzone w kodzie**
  (`src/entities/Spider.ts:79-117`, `fire()`): decyzja o strzale to czysty
  dystans (`retreatRange`/`fireRange`), zero raycastu; pocisk koliduje z
  `map.solids` i `splat()`-uje na pierwszym drzewie na torze
  (`GameScene.ts:868`). Przy dzisiejszym rozstawieniu drzew to systemowe
  marnowanie strzałów, nie edge case. **Rekomendacja (nie wdrożona)**: prosty
  test `physics.overlapRect` wzdłuż linii strzału PRZED wejściem w `active`,
  albo placement sieciarzy w bardziej otwartych miejscach, albo oba —
  decyzja autora.
- 2 drzewa (`buk_maly`, `buk_sredni2`) mają trunk-box w całości wewnątrz już
  zablokowanego dachu chaty Myśliwego — nadmiarowe, nieszkodliwe, opisane w
  poprzednim audycie, wciąż aktualne.

### Potwierdzone jako CZYSTE (bez zmian, świeżo zweryfikowane)

21 pniaków — bez regularnych rzędów (statystyka + wizualnie), bez path/wodzie/
budynkach. 142 kamienie — bez sztucznej regularności (najbliższy-sąsiad
11–504 px), 5 głazów pełni rolę landmarków (2 „wychodnie" + pojedyncze).
244 obiekty flory wodnej — gradient dobry (`palka`/`trzcina`/`roślina
brzegowa` max 2 kafle od wody, tylko `kępa_bagienna` sięga dalej w
mokradłach — zgodnie z projektem). 286 krzewów — bez nowych naruszeń.
**Generalna reguła budynku** (suma `buildings*`+`wyposazenie`+`znaki`, bufor
1 kafla) przetestowana na WSZYSTKICH warstwach dekoracji naraz (`objects`,
`rosliny`, `flora-wodna`, `krzewy`, `kamienie`) filtrowanych do prawdziwych
`DECOR_PROPS` (nie NPC/portale/wrogowie) — **zero naruszeń**.

### Rekomendacja architektoniczna pod PathSolver (odpowiedź, nie implementacja)

`map.solids` już jest wspólnym źródłem prawdy gracz↔AI (ten sam collider,
`TiledMap.ts`), a `NavGrid` jest zbudowany z DOKŁADNIE tych samych boxów —
więc **PathSolver nie potrzebuje nowej reprezentacji przestrzeni**, tylko
konsumenta czytającego istniejący `clearance`. `SteerSolver` zostaje
lokalnym fallbackiem PO ścieżce (naprawia drobne odchylenia, nie zastępuje
trasowania — potwierdzone eksperymentem z dziku 2026-08-28). Soft obstacles
(przyszłe spowolnienie w krzewach) mają wejść jako TRZECI, osobny kanał
(`MovementContext.speedMultiplierAt`), nigdy przez ciała fizyczne — żeby nie
mieszać „nie da rady" z „wolniej".

**Nic z tego nie wdrożono.** `npx tsc --noEmit` i `npm run build` czyste
(bo nic w kodzie/mapie nie ruszono). Obie kopie `.tmj` nadal identyczne
(różnica tylko w ścieżkach `image` tilesetów, nieszkodliwa — silnik wiąże po
nazwie).

**Następny krok (decyzja autora, nie następna sesja automatycznie):**
1. standard prześwitu (na realnych ciałach z tej sesji, nie z §10),
2. `PathSolver` czytający `NavGrid`,
3. korekta spawnów (wilk-w-drzewie, niedźwiedź, sarna, sieciarz/skoczek z
   `forest_rebuild_scope.md` S1–S7),
4. line-of-sight sieciarza.

---

## 2026-08-31 (3) — przebudowa lasu ETAP 4: migracja nowego buka do stempli + integracja pniaków

Kamienie z ETAP 3 zaakceptowane. Ten etap: (A) nowy buk (buki-v1) do atlasu
stempli drzew zamiast starego, (B) docelowa obsługa 21 pniaków. Zero nowej
grafiki, Snapper nie uruchamiany.

### CZĘŚĆ A — buk zmigrowany do TreeStamps

**Architektura (przeanalizowana):** drzewo = tile-object z `gid` → `buildTreeLayer`
→ PIEŃ (dolny pas `TRUNK_SLICE` 32 px komórki, `DEPTH.entities + y`) + KORONA
(reszta, `DEPTH.overhead`), depth per-drzewo po `object.y`. Dwa arkusze:
`TreeStamps` (komórka 96) i `TreeStampsBig` (160, dziś tylko wierzba duża).
`FOREST_SPRITES`/`ForestAtlasManifest.ts` + `TreeInstanceExtractor`/
`TreeZOrderPrototype` — **martwy kod** po migracji drzew (nic w `src/` ich nie
importuje); jedyny żywy konsument to `TreeStampManifest.ts`.

**Rozwiązanie:** nowy buk jako **standalone** (klucz `beeches` w
`docs/forrest_atlas.json`, mechanika identyczna z `willows` — osobne PNG, nie
crop z `forrest.png`). `build_tree_stamps.py`: `load_willows` czyta teraz
`willows + beeches`. **Nie wymyślono nowej klasy komórki** — duży buk 128 px
mieści się w istniejącej `TreeStampsBig` (160).

- **5 wariantów** (proporcje/skala z zaakceptowanego zestawu, bez normalizacji):
  `buk_duzy`/`buk_duzy2` (128 px → TreeStampsBig id 2/3), `buk_sredni`/
  `buk_sredni2` (96 → TreeStamps id 35/36), `buk_maly` (64×96 → id 37).
  Źródła: `docs/art-review/trees/buk_v1_*.png` (kopie zaakceptowanych
  `props/beech_tree_*.png`, już w skali 32-krotności).
- ⚠ **Duży buk (128) > dąb (96)** — świadome, wynika z natywnej grafiki
  buki-v1 (bez upscalingu), tak samo jak wierzba jest większa od dębu.
- **`build_tree_stamps.py --zapisz`** przegenerował `tree_stamps.png`
  (768×480 bez zmian — 38 stempli mieści się w 5×8), `tree_stamps_big.png`
  (160→320 wysokości, 4 kafle), `TreeStampManifest.ts`, `tree_proto.tmj`,
  `willow_test.tmj`.
- **Przepięcie mapy** (`migracja_buk.py`, seed 20260904, NIE w tools/):
  **140 obiektów buka** ze starego gid na nowy — 55 duży → `buk_duzy`/`duzy2`
  (BIG, width/height 96→160, `y` bez zmian bo bottomleft), 51 średni →
  `buk_sredni`/`sredni2`, 34 mały → `buk_maly`. Wpis tilesetu `TreeStampsBig`
  w obu `.tmj`: tilecount 2→4, imageheight 160→320.
- **STARY buk = LEGACY:** `buk_duzy_new`/`sredni_new`/`maly_new` zostają w
  `sprites` (forrest_atlas.json), `forrest.png` i manifescie na id **2/16/25**
  — **niereferowane przez żaden obiekt na mapie**. Usunięcie ich
  przenumerowałoby id 3..37 → 1633 drzewa. To jest stan LEGACY: obecny, ale
  martwy. Źródła w `docs/art-review/trees/buk_*_new-*.png` — nietknięte.
- **Usunięto z runtime:** `beechTreeLarge/Large2/Medium/Medium2/Small` z
  `ASSETS` i `DECOR_PROPS`, `load.image` w `Assets.ts`, 5 obiektów `buk_test_*`
  z `objects`, 5 plików `public/assets/props/beech_tree_*.png`.
- Grep `src/` po `beechTree|beech_tree|buk_test|buk_*_new` (poza martwymi
  prototypami + `TreeStampManifest`) → **0 trafień**.

### CZĘŚĆ B — pniaki jako DECOR_PROPS (bez StumpStamps)

**Analiza A/B/C → wybór A (`DECOR_PROPS`).** Pniaki JUŻ są w `DECOR_PROPS`
(21 wpisów, nazwy `<gatunek>_pniak_{swiezy,zwietrzaly,stary}`) i to spełnia
wszystko: origin (0.5,1) = linia gruntu, `DEPTH.entities + spot.y` = poprawny
depth po stopach, **brak podziału pień/korona** (pniak to jeden sprite
naziemny — osobny system stempli nie ma czego rozwiązać), stan przez nazwę,
**bez fizyki** (obiekt punktowy bez `gid` → `buildTreeLayer` go pomija, nie
dziedziczy kolizji drzew — sprawdzone).

**`StumpStamps` NIE powstał** — byłby uzasadniony tylko przy: podziale
pień/korona (nie ma), tilesecie edytorowym dla dużych nakładających się
sprite'ów (pniaki są małe, punktowe jak grzyby/kamienie), collision boxach
(świadomie brak), setkach instancji (świadomie NIE masowo).

**Rozmieszczenie:** z 34 zdublowanych instancji zostawiono **21** (`trim_pniaki.py`,
NIE w tools/) — jedna na gatunek × stan, na sensownym gruncie, bez krawędzi
mapy i bez far-east. Klaster grab+olcha na x34–46/y44 = A5 delianki. Generyczny
`pniak` (LEGACY) nietknięty. **Masowego rozmieszczenia (`scope` K1) NIE
robiono** — świadomie, to osobny przyszły etap.

### Weryfikacja

`npx tsc --noEmit` czysty, `npm run build` czysty. Obie kopie `.tmj`
zsynchronizowane (trees 1641/1641 identyczne pozycje+gid, objects 61/61,
`nextobjectid` 2775, TreeStampsBig tilecount 4/imageheight 320 w obu).
Manifest: nowy buk id 35–37 + BIG 2–3, stary buk id 2/16/25 (LEGACY).
Rendery: nowy vs stary buk (skupiska), nowy buk w lesie mieszanym (przy dębie/
grabie — styl pasuje), 21 pniaków 1:1 (przezroczystość/deform/ground-align/
stany OK), pniaki na mapie (A5 delianki, brzeg wierzb), szeroki render.
Depth sorting nowego buka i pniaków — sprawdzony na `tree_proto` i mapie.

⚠ **Do wykonania później:** globalny collision pass drzew (w tym nowy buk —
trunk boxy są w manifescie, ale kolizja z nich to osobny etap), soft-collision
krzewów, masowe pniaki, A9 flora wodna.

**Następny krok:** ocena autora. Bez kolejnego etapu samodzielnie.

---

## 2026-08-31 (2) — przebudowa lasu ETAP 3: migracja kamieni na jeden system, stary WYCOFANY

**Data migracji: 2026-08-31.** Decyzja autora: **koniec dwóch równoległych,
stylistycznie różnych systemów kamieni.** Stary (`kamienie.png`, 150-px
komórki, chłodna rampa `kamien`, 7 wariantów) i nowy (`stone_*`, ≤48 px,
ciepła paleta + `mech`, 23 warianty) czytały się jak dwa niezwiązane pakiety.
Nowy pakiet 23 kamieni jest teraz **jedynym** systemem.

**KROK 1 — audyt (58 starych obiektów, warstwa `kamienie`):**
- `glaz_wielki` ×4 (~136 px) — jedyne prawdziwe „duże kamienie". **Nie mają
  odpowiednika 1:1** w nowym pakiecie (głaz kończy się na ~48 px — świadoma
  decyzja §1.5, „nie większe niż sensowna przeszkoda").
- `glaz_a`/`glaz_b` ×20 (~60 px) — głazy polne pojedyncze.
- `kupa_a`/`kupa_b` ×16 (~60 px) — kupki skał.
- `kamyki` ×14 (120×24 px) — szerokie rozsypki żwiru.
- `filar` ×4 (40×56 px) — pionowe słupy (brak pionowego wariantu w nowym).
- 4 kamienie **na wodzie**, 11 w gęstym lesie, 3 blisko stanowisk ziół.
- Zero zależności gameplayowych (`las_faza1b_final.md`: „przenoszenie nic nie da").

**KROK 2 — migracja (skrypt `migracja_kamienie.py`, seed 20260903, NIE
zostaje w tools/):** stare 58 + wcześniejsze 34 nowe (z `objects`) = kotwice
kompozycji → **142 obiekty** na warstwie `kamienie` (ta sama nazwa, nowa
zawartość `kamien_*`). Model kontekstowy:
- **landmarki**: 3× `glaz_wielki` → **wychodnia** (ciasna kępa 6–8 kamieni:
  2 głaz + 2 duży + średnie/małe, promień ~1 kafla — czyta się jak
  rumowisko/eratyk ~85 px zamiast monolitu 136 px). 1× (róg x3,y3) →
  pojedynczy głaz.
- `kupa_*` → kępy 2–3 · `kamyki` → rozsypki 3–5 drobnych · `glaz_a/b` →
  pojedynczy średni/duży (duży na otwartym/brzegu) · `filar` → pojedynczy duży.
- rozmiar wg strefy: otwarty teren większe dozwolone, gęsty las drobne/małe
  (45 % gęstoleśnych kotwic porzucone), brzeg **na LĄDZIE** = otoczaki
  średnie/duże.
- **7 kamieni porzuconych** (woda/ścieżka/budynek), 4 dalsze (gęsty las).
  **Zero na wodzie** — nowy pakiet nie ma wariantu wodnego.
- + lekka rozsypka uzupełniająca (28) w otwartym terenie z dala od kotwic.
- Klasy: drobny 46 · mały 29 · średni 36 · duży 26 · głaz 5. 22 z 23
  wariantów użyte. Bez kolizji (konwencja zachowana — collision boxów
  kamieni celowo nie dodajemy).

**KROK 2b — wycofanie starego kodu (cały łańcuch aktywnie używany):**
- `src/config/GameConfig.ts` — `ASSETS.kamienie` (klucz+ścieżka+7 frame'ów) USUNIĘTE.
- `src/core/Assets.ts` — `load.image(ASSETS.kamienie…)`, `sliceKamienie()` + wywołanie USUNIĘTE.
- `src/world/TiledMap.ts` — `RockSpawn`, `ROCK_OBJECT_NAMES`, `rockSpawns`
  (pole + gałąź `readSpawns` + 3 obiekty zwrotne) USUNIĘTE.
- `src/scenes/GameScene.ts` — `import type RockSpawn`, pętla renderująca
  `map.rockSpawns`, `rockSpawns?:` w typie `buildWorld` USUNIĘTE.
- `tools/build_kamienie.py`, `tools/rozstaw_kamieni.py` — SKASOWANE (służyły
  tylko martwemu systemowi; historia w git).
- `public/assets/props/kamienie.png` — SKASOWANY.
- `tools/audyt_rekwizytow.py` — `REKWIZYTY` zaktualizowane (stare nazwy out,
  23 nowe + krzewy + flora wodna in).
- Zachowane świadomie: `docs/art-review/*`, `docs/referencje_zewnetrzne.md`
  (źródło `rocks.png`), historyczne wzmianki w dokumentach.
- Grep `src/` po `rockSpawn|RockSpawn|ROCK_OBJECT|ASSETS.kamienie|sliceKamienie|
  kamienie.png|glaz_a|…` — **zero trafień** w aktywnym kodzie (pozostałe:
  „filar" jako słowo, „kamyki" w dialogu, datowany komentarz historyczny).

**KROK 3 — weryfikacja:** `npx tsc --noEmit` czysty, `npm run build` czysty.
Obie kopie `.tmj` zsynchronizowane (`kamienie` 142/142, identyczne pozycje,
`objects` 79/79, `nextlayerid` 21, `nextobjectid` 2775, kolejność warstw
zgodna). Skan: 0 kamieni na wodzie/ścieżce/budynku, 0 starych nazw
gdziekolwiek, wszystkie `kamien_*` mają plik PNG. Rendery przed/po:
wychodnia SW (28,33), wychodnia E (87,40), brzeg zachodni, okolica chaty,
szeroki render całej mapy. Efekt: jeden ciepły, spójny materiał kamienia
zamiast dwóch (chłodny 150-px + ciepły ≤48-px).

⚠ **Kompromis do świadomej akceptacji:** stary `glaz_wielki` (136 px,
wyraźny landmark) → wychodnia ~85 px. Mniejsza masa, ale zachowana obecność
„jest tu formacja skalna", przy jednym systemie zamiast wyjątku. Alternatywa
(zostawić 4 stare obiekty jako wyjątek) odrzucona — kłóci się z „jeden
spójny system".

**Następny krok:** ocena autora. Bez buka, collision boxów, pniaków,
TreeStamps, krzewów, flory wodnej.

---

## 2026-08-31 — przebudowa lasu ETAP 2: pełne rozmieszczenie krzewów (podszyt)

Autor zaakceptował ETAP 1b. Kolejny etap: **11 zaakceptowanych krzewów** jako
podszyt lasu na całej mapie. Zero nowej grafiki, Snapper nie uruchamiany,
skala/kolor/geometria assetów bez zmian.

**Co zrobione (33 testowe → 286 na nowej warstwie `krzewy`):**

- Skasowano 33 testowe `krzew_*` z `objects`. Dodano **286 obiektów** na
  **nowej warstwie obiektowej `krzewy`** (osobna, jak `flora-wodna` — nie
  mieszać). Nazwy = te co w `DECOR_PROPS`, bez nowych. `readSpawns` czyta
  bez zmian w kodzie.
- **Model strefowy** (analiza żywego `.tmj`: gęstość drzew w promieniu 3
  kafle → strefy D/L/g/o + odległość od ścieżki/wody/budynku):
  - gęsta kopuła (mały/średni/duży) **129** — podstawa, najczęstsza;
  - oliwkowy **48** — wmieszany w kępy kopuł (nie osobne skupiska), 14%
    szansy podmiany małej/średniej kopuły;
  - kwitnący **19** — osobny przebieg: słoneczne polany (środek `g`, z dala
    od `D`, nie przy wodzie);
  - gałęzisty/suchy **51** — skraje, przejścia, luźny las;
  - niski/chrust **29** — osobny przebieg wzdłuż ścieżek (widoczność);
  - jagodowe (dome_berry/twiggy_berry) **10** — rzadkie akcenty, **bez
    mechaniki zbioru**.
- **Strefy (kafle z krzewem):** gęsty bór `D` **9** (celowo lekko — już gęsto,
  czytelność), luźny las `L` **118**, polana `g` **116** (granice polan
  wzmacniane ×1,9, środek ×0,55), przy ścieżce `p` **38**, otwarte/wyrąb `o`
  **5** (celowo puste).
- **Skupiska + prześwity:** zmienny odstęp ziaren 4–9 kafli, rozmiary klastrów
  1 / 2–4 / 4–8 / 7–13 (rozkład 34/34/22/10 %), dominanta wariantu per klaster
  (70 %) + reszta z puli strefy → kępa czyta się jako jedna masa, nie próbnik.
  Zmienny min-odstęp wewnątrz klastra 15–30 px. **Brak stałego odstępu, brak
  rzędów.**
- **Relacja z drzewami:** twardy zakaz „ściany przed pniem" (|dx|<13 px w
  paśmie pnia), limit **2 krzewy** blisko jednego pnia (24 pnie na limicie z
  1641). Krzewy wypełniają przestrzeń MIĘDZY drzewami, nie zasłaniają podstaw.
- **Wykluczenia:** ścieżka/woda/budynek (0/0/0), ≥24 px od flory wodnej (0
  naruszeń), ≥36 px od stanowiska zioła (0), ≥64 px od NPC/ogniska/portalu,
  ≥34 px od innych rekwizytów, brzeg wody (dwet≤1) wykluczony.

⚠ **Soft-collision / spowolnienie ruchu dla krzewów NIE zaimplementowane** —
autor wyraźnie prosił najpierw o ocenę rozmieszczenia wizualnego, zachowanie
ruchowe to osobna decyzja. Krzewy to na razie czyste `DECOR_PROPS` bez ciała.

**Weryfikacja:** własny kompozytor renderujący `krzewy` (dodane 11 ścieżek
PNG). Rendery przed/po: SW gęsty bór (prawie bez zmian — celowo), centrum
A6 (podszyt wokół kęp drzew + z dala od brzegów), północ (trakt + obejście
Myśliwego czyste), wschód (luźny las), szeroki render całej mapy. `npx tsc
--noEmit` czysty. Obie kopie `.tmj` zsynchronizowane (286/286, te same
pozycje, `nextobjectid` 2626, `nextlayerid` 20). 0 par krzewów <12 px,
min dystans 16,3 px. Skrypt `rozstaw_krzewy.py` **nie zostaje w `tools/`**.

**Następny krok:** ocena autora. Bez buka, collision boxów, pniaków, kamieni
do czasu decyzji.

### Poprawka tego samego etapu: krzewy na dachu chaty Myśliwego

Autor zgłosił z renderu: **6 krzewów na dachu chaty**. Przyczyna: filtr
placementu wykluczał tylko warstwę kafli `buildings` (ściany, y5–7). Dach
jest na `buildings-over` (rysowany nad encjami, **bez kolizji**), detale na
`buildings-detale` — obie pomijane. „Krzew na kaflu bez kolizji" ≠ „krzew
poza budynkiem".

⚠ **Naprawa REGUŁY, nie hardkod chaty** (uwaga autora + tip): strefa
wykluczenia dekoracji naziemnych = **suma wszystkich warstw kafli o nazwie
`buildings*` + `wyposazenie` (podwórze kuźni) + `znaki` (drogowskaz/płot
przy bramie), bufor 1 kafla**. Działa dla każdego obecnego i przyszłego
budynku z modularnego zestawu (`kafle_domu` zawsze maluje na te warstwy).
⚠ `rozstaw_ziola.py` miał już poprawną, pełną maskę
(`buildings`+`-detale`+`-over`+`wyposazenie`) — to skrypty krzewów i flory
wodnej ją zawęziły. Flora wodna nie ucierpiała (brzegi rzeki daleko od
chaty), ale jej maska też jest do poprawienia przy ewentualnym re-runie.

**Korekta chirurgiczna** (`popraw_krzewy_budynki.py`, seed 20260902): kasuje
**7** krzewów w strefie budynku (6 na samym kaflu dachu + 1 w buforze),
każdy przenosi tuż obok tym samym wariantem (spirala 1–5 kafli, z
zachowaniem odstępów), 0 skasowanych bez zamiennika. **Pozostałe 279
krzewów bez zmian** (diff pozycji = tylko te 7). Skan wszystkich 5 warstw
obiektów: **0 obiektów na kaflu konstrukcyjnym**. `tsc` czysty, obie kopie
`.tmj` zsynchronizowane (286/286, `nextobjectid` 2633). Render rejonu
chaty przed/po + szeroki render kontrolny. Skrypty nie zostają w `tools/`.

---

## 2026-08-30 (6) — przebudowa lasu ETAP 1b: flora wodna na reszcie brzegów rzeki

Autor zaakceptował ETAP 1 („model dobry, zachowuję jako bazę — ważne:
nieregularne skupiska + czysty środek rzeki"). ETAP 1b = **ten sam model**
zastosowany do brzegów, których ETAP 1 celowo nie ruszał.

**Co zrobione (+92 obiekty, `flora-wodna` 152 → 244):**

- **Regiony 1b**: odcinek środkowy rzeki przy brodzie (x 31–45 — tylko **6**
  obiektów, bo bufor brodu/traktu zjada większość; bród flankowany kilkoma
  trzcinami) i **odcinek wschodni** (x 77–138, y 13–34 — **86** obiektów).
  A10 Źródło (x 139+) i A6 (x 46–76) to ETAP 1, nietknięte.
- **Regiony 1b to zwykły brzeg rzeki, NIE mokradło** — bazowe
  prawdopodobieństwa modelu, bez boostu „marsh" (ten był tylko dla A6/staw/
  A10). Efekt: rzadziej, więcej prześwitów niż w obszarach flagowych.
- Nowe rodziny: pałka 19 · trzcina 17 · roślina_brzegowa 20 · kępa_bagienna 36.
  **Łącznie 244**: pałka 55 · trzcina 38 · roślina_brzegowa 50 · kępa_bagienna 101.
- **ETAP 1 nietknięty 1:1** — skrypt 1b ma osobny seed (20260831), ładuje
  bieżący `.tmj`, zachowuje wszystkie 152 obiekty ETAP 1 (liczą się do
  min-dystansu na styku regionów), dokłada tylko nowe. Idempotentny: przy
  ponownym uruchomieniu kasuje z warstwy obiekty leżące w regionach 1b i
  stawia od nowa, obiekty ETAP 1 zostawia.

**Czego NIE ruszano** (polecenie): assety, kolorystyka, skala, zioła, drzewa,
krzewy, podłoże, geometria brzegów (schodkowe krawędzie A6/A4/A10 — osobny
terrain pass), obiekty niezwiązane z florą wodną.

**Weryfikacja:** render przed/po dla 3 reprezentatywnych odcinków (bród,
x78–108, x108–140). `npx tsc --noEmit` czysty. Obie kopie `.tmj`
zsynchronizowane (244/244, te same pozycje, `nextobjectid` 2340).
Skan wszystkich 244: **0 na głębokiej wodzie / brodzie / pod budynkiem**,
0 nieznanych nazw, min. dystans nowy↔dowolny 14,5 px. Zioła/rekwizyty/rocks
na miejscu (bufor 40/44 px). Skrypt `rozstaw_flora_wodna_1b.py` **nie
zostaje w `tools/`**.

⚠ `nextlayerid` przeskoczyło 18→19 (jeden zmarnowany id) — ETAP 1 był
zapisywany dwa razy (raz, potem po dostrojeniu), każdy zapis kasuje i
odtwarza warstwę z nowym id. Bez znaczenia (id warstw nie muszą być ciągłe),
odnotowane żeby nie szukać „gdzie zniknęła warstwa 18".

**Następny krok:** ocena autora. Bez krzewów, buka, collision boxów, pniaków,
kamieni do czasu decyzji.

---

## 2026-08-30 (5) — przebudowa lasu ETAP 1: rozmieszczenie flory wodnej (3 obszary)

Start właściwego etapu przebudowy mapy na bazie zamkniętego pakietu flory
(`docs/katalog_assetow.md`). **Zero nowej grafiki, Snapper nie uruchamiany** —
tylko rozmieszczanie gotowych assetów w Tiled. Polecenie: praca etapami, render
kontrolny po każdym większym kroku, nie przechodzić automatycznie dalej.

**Co zrobione — ETAP 1, flora wodna (17 assetów → 152 obiekty):**

- Skasowano 17 testowych obiektów (jedno ciasne skupisko przy x105/y21).
- Dodano **nową warstwę obiektową `flora-wodna`** (obie kopie `.tmj`), osobną
  od `objects` — cała roślinność wodna daje się teraz w Tiled znaleźć i
  przełączyć jednym oczkiem. `readSpawns` chodzi po wszystkich warstwach
  obiektów, więc gra czyta ją bez zmian w kodzie; nazwy (`palka_*`,
  `trzcina_*`, `kepa_bagienna_*`, `roslina_brzegowa_*`) już były w
  `DECOR_PROPS`.
- **Zakres świadomie NIE cała mapa** — trzy obszary, gdzie model strefowy jest
  w pełni wyrażony: **zachodnie rozlewisko** (x 2–30, flagowy fragment),
  **A6 rozlewiska + staw** (x 46–76 / y 26–52), **A10 Źródło** (x 139–158).
  Pozostałe brzegi rzeki (środek + wschód, x 31–138) → **ETAP 1b** po ocenie
  modelu. Rodziny: pałka 36 · trzcina 21 · roślina_brzegowa 30 · kępa_bagienna 65.

**Model rozmieszczania** (skrypt jednorazowy `rozstaw_flora_wodna.py`, **NIE
zostaje w `tools/`** — wzorzec zmiany punktowej; seed 20260830):

- BFS `d_water` z żywego `.tmj` (nie z generatora). Strefy:
  `roslina_brzegowa` na lądzie przy samej granicy (d_water==1);
  `palka`/`trzcina` w **nieregularnych skupiskach** na linii brzegu i płytkiej
  wodzie — dozwolona TYLKO krawędź wody (`d_land==1`), nigdy głęboka;
  `kepa_bagienna` w paśmie średnim (d_water 1–3), zagęszczona w regionach
  mokradłowych (A6/staw/A10).
- Skupiska wysokiej roślinności: ziarna ≥5 kafli od siebie, klaster 2–5 łodyg
  z gaussowskim jitterem (σ≈14 px), mix pałka/trzcina — nigdy rząd. Gwarancja:
  każdy zbiornik ≥5 kafli dostaje min. 1 skupisko (inaczej małe rozlewiska
  wychodziły gołe).
- Wykluczenia: bród + pas traktu (bufor 2 kafle od `path`), budynki, krawędź
  mapy, 44 px od dowolnego rekwizytu/NPC, **40 px od stanowiska zioła**
  (zioła gameplayowe — nietknięte).

**Weryfikacja renderem** (własny kompozytor `render_mapa.py` — kafle Teren/
ForestGround/ForestTransitions + drzewa z `TreeStamps` + wszystkie rekwizyty
z warstw obiektów; panel przeglądarki dalej nie uruchamia Phasera):
przed/po dla trzech obszarów. Potwierdzone: brak rzędów, środek wody czysty,
zero obiektów na głębokiej wodzie/brodzie/budynku, skupiska nieregularne z
przerwami, zioła na miejscu. `npx tsc --noEmit` czysty. Obie kopie `.tmj`
zsynchronizowane (ta sama liczba obiektów, `nextlayerid`/`nextobjectid`).

⚠ **Uwaga do ETAP 1b/oceny:** assety pałki/trzciny są mocno złociste (brązowe
kolby + złote kwiatostany — zgodne z zaakceptowanym recolorem), więc przy
większej gęstości cała linia brzegu robi się żółta. Świadomie przesunięto
proporcję w stronę zielonych kęp bagiennych (65) kosztem trzciny (21).

**Następny krok:** ocena autora. Po zatwierdzeniu → ETAP 1b (reszta brzegów)
albo ETAP 2 (krzewy).

---

## 2026-08-30 (4) — flora wodna zaakceptowana: podstawowa flora dekoracyjna ZAMKNIĘTA

**Flora wodna/bagienna przygotowana i zaakceptowana** — 17 assetów gotowych
(`docs/art-review/rosliny-wodne.png`, 4 rodziny: pałka wodna, trzcina
piórkowa, kępy bagienne, roślinność brzegowa). Kolorystyka dopasowana do
istniejącej flory lasu: kontrolowany recolor po akceptacji funkcjonalnej
(zmierzony problem — nasycenie zieleni 0,91 wobec 0,71 w prawdziwych
koronach — naprawiony remapem do 14 kolorów łącznie, z realnych próbek
`forrest.png` + już zaakceptowanych krzewów/ziół). Pełny opis:
**`docs/katalog_assetow.md` §1.8.**

⚠⚠ **Tym samym generowanie PODSTAWOWEJ FLORY DEKORACYJNEJ LASU jest
ZAMKNIĘTE** — drzewa, pniaki, krzewy, zioła, kamienie i flora wodna mają
teraz wszystkie gotowe, ocenione assety. Otwarte zostają dwie osobne sprawy,
nie generowanie grafiki: integracja ze stampami (drzewa/pniaki) i
systematyczne rozmieszczenie na całej mapie (krzewy częściowo zrobione,
flora wodna to na razie JEDEN testowy klaster przy jednym brzegu, nie
rozmieszczenie wg logiki stref na całej rzece).

**Następna sesja zaczyna od**: faktycznego wstawiania/integracji roślinności
wodnej na całej mapie lasu, wg ustalonej logiki stref: woda → roślinność
przybrzeżna → trzciny/sitowie → wilgotna trawa → zwykła flora → las.
Kanoniczny katalog wszystkiego: `docs/katalog_assetow.md`.

---

## 2026-08-30 — 21 pniaków (7 gatunków × 3 stany), skala per-gatunek, buk przeprojektowany

Zamknięty etap testowy: pniaki i drzewa dla wszystkich siedmiu gatunków lasu
(dąb, brzoza, świerk, buk, grab, olcha, wierzba). **Jeszcze NIE zintegrowane
z `TreeStamps`** — to świadomie osobny, kontrolowany etap, odłożony na potem.
Na razie wszystko to proste obrazki w `DECOR_PROPS` (`public/assets/props/`),
testowo wpięte na żywą mapę lasu obok prawdziwych drzew danego gatunku i obok
gracza — patrz nazwy obiektów `*_pniak_*`/`*_test_*` w `forrest.tmj`.

**Buk przeszedł przeprojektowanie w trakcie etapu.** Pierwszy zestaw
(`buk.png`) miał tylko jeden stan świeżości na pięć rozmiarów — za mało na
3-stanowy wzorzec. Autor podesłał `buki-v1.png` (8 osobnych elementów: 2×
duży, 2× średni, 1× mały, 3 pniaki) jako właściwe źródło. Pierwsze cięcie
(bounding-boxy z paddingiem) złapało fragmenty sąsiednich drzew na
avg./małym — poprawione connected-component labelingiem (`scipy.ndimage.label`
na masce alfa, zerowanie wszystkiego poza właściwym komponentem w obrębie
przycinanego prostokąta). **Ta technika stała się standardem** dla grabu,
olchy i wierzby — wszystkie miały czyste, rozłączne komponenty od razu.

⚠ **Stary asset buka (`buk_duzy_new`/`buk_sredni_new`/`buk_maly_new`,
id 2/16/25 w `TreeStampManifest.ts`) NIE ZOSTAŁ USUNIĘTY.** Ma bardzo
charakterystyczną, kopulastą, nisko rozgałęzioną koronę (drzewo rosnące w
otwartej przestrzeni, nie w gęstym lesie) — zbyt dobra grafika, żeby ją
wyrzucić. Propozycje nowej roli (lipa wiejska / pojedyncze drzewo-landmark /
drzewo na łące / stary dąb-weteran) zostały przedstawione autorowi, ale
**celowo nieprzypisane** — roboczo traktowany jako unikalne stare drzewo do
wykorzystania później. **Nie przypisuj mu gatunku ani roli bez pytania.**

⚠⚠ **Ustalona finalna zasada skalowania pniaków — nie ma jednej wspólnej
szerokości.** Wczesne gatunki (dąb, brzoza, świerk) dostały ~40 px "bo tyle
miał dąb"; dopiero od grabu przyjęto właściwą metodę: zmierzyć realną
szerokość nasady PNIA dużego drzewa (piksele kory, bez korony/zieleni, w
paśmie kontaktu z ziemią — licz się z tym, że naiwne okno "dolne N wierszy"
złapie zwisającą koronę i zawyży wynik; trzeba wykluczyć zielone piksele) i
pozwolić pniakowi być umiarkowanie grubszym (obserwowany akceptowalny zakres
×0.88–×1.35 tej podstawy), nigdy ~×2+. QA złapało już wpięte brzozę/świerk/
grab jako przewymiarowane (×2.35, ×3.4-niepewne, ×1.71) i skorygowało je
proporcjonalnie z tego samego pre-scale źródła (bez ponownego recoloru).

**Finalne szerokości ŚWIEŻEGO pniaka (zaakceptowane, nie zmieniać bez
wyraźnej decyzji autora):** dąb 38 px · brzoza 23 px · świerk 20 px (dobrany
wizualnie — nasada świerka jest ucięta krawędzią własnej kanwy 96 px, pomiar
niewiarygodny) · buk 48 px · grab 28 px · olcha 33 px · wierzba 58 px
(świadomie największy — wierzba ma już w grze dwukrotnie większą komórkę
`TreeStampsBig` i dwukrotnie szerszy hitbox pnia niż reszta rosteru).

Pełna tabela wymiarów i uzasadnień: historia tej sesji w transkrypcie; skrót
metody i wartości też w komentarzach przy `ASSETS.*StumpFresh` w
`GameConfig.ts`.

**Następny krok (osobna sesja, po zamknięciu reszty środowiska lasu):**
integracja 21 pniaków + zaakceptowanego zestawu drzew z `TreeStamps` /
przyszłym `StumpStamps`.

---

## 2026-08-30 (3) — checkpoint końca sesji: flora środowiska + nowy kanoniczny katalog

**Powód wpisu**: limit tej sesji się kończy, kontynuacja w nowej. Pełny audyt
i inwentarz są w **`docs/katalog_assetow.md`** (nowy plik, dziś) — ten wpis
to tylko skrót orientacyjny, nie duplikat tabel.

**Zamknięte w tej sesji**: 7 rodzin drzew (dąb/świerk/brzoza/grab/olcha/
wierzba — **6 z 7 w żywym atlasie `TreeStampManifest.ts`**, buk NIE),
21 pniaków (7 gatunków × 3 stany, assety + zamrożone szerokości), 11 krzewów
(assety + rozmieszczenie testowe), 11 ziół (roster + siedliska + proximity-
glow w rendererze, nie w PNG), 23 nowe kamienie dekoracyjne + rampa `mech` w
`docs/paleta.json`.

⚠ **Stary buk (`buk_duzy_new`/`sredni`/`maly` w atlasie) zostaje jako LEGACY /
nierozstrzygnięty landmark — NIE usuwać, NIE zmieniać grafiki, NIE
przypisywać samodzielnie gatunku.** Nowy zestaw buka (`buki-v1.png`) istnieje
tylko jako `DECOR_PROPS` TEST, poza stampami — atlas go nie widzi.

**Podłoże**: `Teren.png` już odświeżone i kompletne, nietknięte tą sesją, nie
generować ponownie.

**Otwarte**: flora wodna niedomknięta — brakuje trzciny/sitowia/roślinności
przybrzeżnej (lilia wodna już jest, nie generować ponownie). Elementy
gospodarki leśnej (dłużyce, mielerz, wykrot, kładka, kości) to wciąż czyste
TODO, zero plików. `drewno_porabane.png` istnieje, ale nie ma wpisu w
`ASSETS`/`DECOR_PROPS`.

**Od czego zacząć następną sesję**: `docs/katalog_assetow.md` §3 (TODO/TEST/
LEGACY) ma pełną listę z priorytetami. Dwie największe otwarte decyzje: (1)
czy/jak podmienić starego buka w `TreeStampManifest.ts` na nowy zestaw, (2)
kiedy i jak zacząć integrację 21 pniaków + nowych drzew ze stampami
(`StumpStamps` nie istnieje jeszcze wcale).

---

## 2026-08-30 (2) — 23 kamienie zintegrowane, rampa `mech` w palecie świata

Zamknięty etap: dekoracyjne kamienie (`docs/art-review/kamienie-snapped.png`,
41 wyizolowanych, 23 wybrane, reszta zostaje jako rezerwa) są teraz na mapie
lasu jako zwykłe `DECOR_PROPS` — 34 egzemplarze, bez kolizji (ta sama
konwencja co istniejący system `ASSETS.kamienie`/`rockSpawns`), pięć klas
wielkości (`drobny`/`maly`/`sredni`/`duzy`/`glaz`) o **naturalnej, nie
znormalizowanej skali** — najmniejszy 7×9 px, największy głaz 56×42 px.

⚠ **Nowa rampa `mech` w `docs/paleta.json`** (5 stopni, `#242506`→`#ada020`),
dopisana po tym, jak realne omszałe kamienie przechodziły przez
`tools/snap_paleta.py` i cały mech lądował w `ziemia`/`kora`/`akcent_zlocisty`
— zmierzone, że żadna z prawdziwie zielonych ramp (`trawa`/`listowie`/
`korona`) nie jest nawet BLISKA (mech to ciemna, zdesaturowana oliwka, nie
żywa zieleń liścia/trawy). Dokładnie ten sam błąd, przed którym ostrzega
nagłówek `snap_paleta.py` ("cała kategoria koloru potrafi zniknąć"), tylko że
tym razem faktycznie złapany na renderze przed integracją, nie po. Rampa
wchodzi do obliczeń WYŁĄCZNIE tam, gdzie konkretny wpis w `CELE` ją
zażąda — zero wpływu na istniejące rekwizyty.

⚠ **Rampa `kamien` (chłodny szaro-niebieski) świadomie NIE jest używana przez
te kamienie — sprawdzone, nie przeoczone.** Źródłowa grafika jest cieplejsza
niż ta rampa z założenia (nawet najciemniejsze/najbardziej "szare" piksele
mają realny ciepły odcień), a ciepłe mapowanie skała→`ziemia`/`kora` siada
spójnie obok istniejącej ścieżki/podłoża (potwierdzone renderem). Rampa
zostaje w palecie na przyszły chłodniejszy materiał, po prostu te konkretne
kamienie jej nie potrzebują — nie "napraw" tego bez nowego pomiaru.

**Rozmieszczenie**: `tools/snap_paleta.py` ma teraz stały wpis `_KAMIENIE_*`
(pętla po 23 nazwach plików, jeden współdzielony zestaw ramp) — uruchom
`python tools/snap_paleta.py --tylko stone_ --zapisz` po każdej zmianie
źródeł w `docs/art-review/kamienie/`. Same pozycje na mapie (`objects`,
nazwy `kamien_<klasa>_<nr>`) to jednorazowy skrypt, nie zostaje w `tools/`
— jeśli trzeba przełożyć kamienie, generuj pozycje od nowa (odległość od
wody/ścieżki/drzew/innych obiektów, patrz git history tej sesji), nie
edytuj `.tmj` ręcznie.

---

## 2026-08-28 (4) — terrain pass: warstwa `ground` dla A1–A10

Po resize (wpis wyżej) autor zlecił WYŁĄCZNIE strukturę terenu — zero
drzew/dekoracji/obiektów/spawnów. Zakres okazał się węższy, niż brzmiał na
pierwszy rzut oka: dotyczy dokładnie **jednej warstwy kafli** (`ground`),
bo drzewa/dekoracje mieszkają na osobnych warstwach (`trees-base`,
`undergrowth`, `bushes`), a woda/piasek/ścieżka są jawnie zakazane do
ruszania w tym kroku.

**Metoda**: pole gęstości trawy jako ważona suma 15 kotwic strefowych
(RBF, ta sama „suma gaussów nie sinusoid" lekcja co `build_mapa.py`), plus
jawne nadpisania (twarda krawędź obejścia Myśliwego, pięć polan pod
istniejącymi królikami, próg przy nowej bramie). Osobne pole akcentów
`ziemia`/`kamień`, klastrowane, nie rozrzucone.

⚠ **Dwie realne pomyłki złapane na renderze, nie w liczbach, obie
naprawione przed zapisem**:
1. Pierwsza wersja pola miała promienie kotwic zbyt duże względem
   rozstawu stref — wszystko rozmywało się do środka skali, A5b (bór
   wilków, ma być najciemniejszy) było ledwo odróżnialne od tła.
2. **Pięć polan w A5 zlewało się w jeden korytarz** — dokładnie ten błąd,
   przed którym ostrzegało polecenie autora. Trzy najbliższe sobie
   króliki (odległości 6–8 kafli) przy promieniu polany 5 dawały jedną
   wydłużoną plamę przez pół strefy. Naprawione podniesieniem tła A5 i
   zawężeniem promienia polan — cztery/pięć wyraźnie oddzielonych plam.

⚠⚠ **Znalezisko, zgłoszone, nie naprawione w tym kroku**: drzewa w x0–99
są ze starej, nieustrukturyzowanej generacji sprzed tej całej przebudowy i
NIE zostały tknięte (zgodnie z poleceniem). Skutek: 24–37% komórek w
promieniu 5 kafli od każdego królika ma dziś pień, więc nowo wyrzeźbione
polany są dziś częściowo zasłonięte starymi drzewami na renderze. **To
nie jest błąd tego kroku** — to jest dokładnie to, co zapowiada kolejność
„teren najpierw, drzewa potem": geometria jest gotowa i zmierzona, drzewa
czekają na następny etap, z jasnym priorytetem (przerzedzić polany A5 i
obrys A3 jako pierwsze).

Rozlewiska w A6 (planowane w scope docu) świadomie pominięte: każdy nowy
kafel wody na tej mapie automatycznie dostaje pełną kolizję na poziomie
tilesetu (Step 1B), więc dorzucenie kałuż impulsywnie byłoby projektowaniem
nowej przeszkody bez tej samej ostrożności, jaką dostał bród w Step 2.
Odłożone do osobnej decyzji.

Walidacja: diff wobec poprzedniego commita zmienia dokładnie jedną z 12
warstw kafli, warstwy obiektów bajt w bajt identyczne, kolizja niezmieniona
(1673 — `ground` nigdy nie niesie kolizji), `tsc`/`build` czyste. Pełny
zapis, w tym tabela gęstości per strefa i lista otwartych punktów dla
etapu drzew: `PROJECT_CHECKPOINT_TERRAIN.md`.

**Zatrzymano po renderze i checkpoincie, zgodnie z poleceniem.** Następny
etap: drzewa.

### Korekta tego samego dnia: A6–A10, po przeglądzie renderu

Autor obejrzał render i potwierdził kierunek A1–A5 („nie przebudowywać"),
ale zlecił dopracowanie A6–A10 — pięć konkretnych uwag, każda inna: A6 miało
czytać się jako mokradła samym podłożem (ciemna ziemia, wilgotne kieszenie,
nierówna struktura), A7 miało wyraźniej przejść od użytkowanego lasu do
końca wygodnego traktu, A8 miało przestać być „tylko innym odcieniem
trawy", A9 miało dostać własną tożsamość brzegu, A10 miało przestać być
jednolitą brązową powierzchnią i zyskać czytelny rdzeń + suchsze obrzeża.

⚠ **Zamrożenie A1–A5+A5b wykonane jako TWARDE nadpisanie, nie jako
„postaraj się nie ruszać".** Pole przeliczone na nowo (nowe kotwice A6–A10
wpływają na cały ważony rozkład), a potem komórki pięciu stref jawnie
nadpisane z powrotem wartościami z poprzedniego commita. Dowiedzione
diffem: **0 różniących się komórek w każdej z pięciu stref** (3320 komórek
razem), podczas gdy A6–A10 zmieniły od 167 do 509 komórek każda.

Zmiany per strefa (pełne w checkpoincie §2.5): A6 — drugi, ostrzejszy
przebieg szumu lokalnego + cztery bezwodne wilgotne zagłębienia zamiast
dwóch dużych plam ziemi; A7 — gradient pogłębiony (0,50→0,66 na
0,40→0,74) i ściśnięty do wnętrza pasma; A8 — drugi przebieg szumu +
dwie dodatkowe twarde „zarośnięte składnice"; A9 — rozrzucone kropki
zamienione na **pas skalny wzdłuż brzegu** (y10–15), dając strukturę
północ-południe; A10 — płaskie pasmo akcentu zamienione na **jeden
dominujący punkt źródłowy** z promieniującą wilgocią i spadkiem gęstości
trawy w samym rdzeniu, z wyraźnie suchszymi obrzeżami.

⚠ **A6 dalej bez kafli wody** — to nie jest niedopatrzenie względem
polecenia, tylko dokładne przeczytanie jego brzmienia: „już samym
podłożem" mówi wprost, że efekt ma dać sama tekstura, nie nowe kafle.
Decyzja z pierwszego przebiegu (woda = automatyczna kolizja na poziomie
tilesetu, decyzja poza zakresem tego kroku) zostaje w mocy.

⚠ Jedna drobna rozbieżność zmierzona i zapisana, nie ukryta: **A10
straciło kamień** (29→0) — silne pole ziemi wokół punktu źródłowego
dominuje nad słabszymi klastrami kamienia w tym samym sąsiedztwie
(`add_cluster` bierze wyższe z dwóch prawdopodobieństw). Efekt wizualny
na renderze jest dalej dobry, ale to jest do poprawki przy okazji.

Walidacja: te same testy co w pierwszym przebiegu, plus explicit dowód
zamrożenia (§2.5 checkpointu). `tsc`/`build` czyste. Cztery obrazy
wysłane: pełna mapa + trzy dedykowane zbliżenia (A6, A8, A10) z
prawdziwych kafli.

---

## 2026-08-28 (3) — review Senior Game Architecta: las 160×60, i jego techniczne wdrożenie

Autor poprosił o kierunek na przyszłość — rozszerzenie docelowego rozmiaru
lasu ze 140×60 (zamkniętego w Z-1) na 160×60 — najpierw jako pytanie
techniczne (Sonnet: bezpieczeństwo, korzyść, zależności), potem jako pełne
review projektowe (Opus, w roli Senior Game Architecta).

**Wynik techniczny (Sonnet):** silnik jest szerokościowo agnostyczny — zero
hardkodowanych wymiarów w `src/`, `NavGrid`/`world bounds`/`camera bounds`
liczą się z żywego `.tmj`. Ryzyko leży wyłącznie w danych i narzędziach:
`tools/portale.py` (brama liczona wzorem „krawędź − 1 kafel"),
`tools/build_minimap.py` (kod dynamiczny, PNG zamrożony — **luka, której nie
było w żadnym istniejącym planie**), oraz w liczbach w dokumentacji.

**Wynik projektowy (Opus, po korekcie):** pierwsza wersja propozycji
(„A8a/A8b", A8b jako głębsza cisza przed bramą) **odrzucona w recenzji** —
dwa realne błędy: próg Gęstwiny to beat 3–4 kafli, nie korytarz 640 px (0,83
ekranu telefonu), i kolejność była odwrócona (niedźwiedź jako ostatnia rzecz
przed pustką = antyklimaks). Zatwierdzony kierunek po korekcie:

- **160×60, ale uzasadnienie inne niż „więcej miejsca na ciszę"**: A8 przy
  140 był PRZEŁADOWANY (4 set-piece'y na 28 kolumnach = 1,16 ekranu), nie
  pusty. 20 kolumn ma dekompresować, nie wydłużać ciszę.
- **A8 zostaje dokładnie taki, jak zaplanowano dla 140** (x112–139, ruiny,
  barłóg, obsada) — **nic się w nim nie przesuwa**.
- **x140–159 dostaje tożsamość POZYTYWNĄ: A10 · Źródło.** Rzeka w N1 planu
  „wychodzi wschodnią krawędzią jako źródło" — przy 140 to znaczyło „urywa
  się na krawędzi"; przy 160 można to faktycznie postawić (mokradło
  źródłowe, 2 skoczki, zioła cieniolubne). Robi fabularną metaforę
  `swiat.md` („wieś pije to, co wypływa z miejsca, którego się boi")
  dosłowną, i zamyka północny brzeg w pętlę zamiast ślepej odnogi.
- **A9 · Brzeg Północny (x80–140, y0–16) — nowe pasmo, zagospodarowuje
  lukę, którą audyt już raz zmierzył** (cała północ = 50% mapy = jeden wróg).
  **Niedźwiedź przenosi się TU**, nie do A8 — rozstrzyga to sprzeczność
  między S4 (`las_faza1b_final.md`, y8–30) a scope dokumentem (A8, y26+),
  na korzyść północy: A8 zachowuje czystą treść ludzką bez bossa
  konkurującego o uwagę.
- **Próg Gęstwiny zostaje 3–4 kaflami przy samej bramie** — nie rozciągnięty.
- **Z-9 („+0 mobów") ponownie otwarte** — było liczone dla 140 (już tam 40%
  spadek gęstości), przy 160 to 60%, na mapie, która przy DZISIEJSZEJ
  gęstości nie przechodzi własnego testu pustki z audytu (28% > pół kadru
  od czegokolwiek żywego). Kierunek: **wrogowie 19→25 (+32%), ambient
  7→15 (+114%)** — stosunek wróg:ambient z 2,7:1 na ~1,67:1. Model
  rdzeń+peryferie: terytoria (wilki, dziki, sieciarze, skoczki) vs
  pojedyncze wędrowce (niedźwiedź, Szary, lisy, ptaki). Dwie reguły
  pilnujące różnicy „żywo" vs „arena": peryferyjny osobnik nie agruje z
  trasy przelotowej, ambient nie liczy się do budżetu spotkań.

⚠ **To wszystko jest kierunkiem projektowym, nie liczbami z tabeli do
wklejenia.** Terrain pass i populacja to osobne, jeszcze nierozpoczęte
kroki — dokładna gęstość na hektar wraca przy nich, na żywych danych.

### Techniczne wdrożenie (ten sam dzień, druga część sesji)

Autor zlecił WYŁĄCZNIE mechaniczny resize — zero malowania, zero populacji
poza jednym już zatwierdzonym wyjątkiem. Wykonane i zweryfikowane:

- **Resize 100×60 → 160×60**, obie kopie `.tmj`, kotwica lewa-górna. Nowe
  kolumny (x100–159) **całkowicie puste** na wszystkich 12 warstwach —
  zamierzone, terrain pass ich jeszcze nie dotyczy. Zweryfikowane per-komórka:
  x0–99 bajt w bajt identyczne z poprzednim commitem na każdej z 12 warstw.
- **Brama wschodnia przesunięta**: `tools/portale.py` (`BRAMA_LAS_WSCHOD`
  tx=98→158, `WEJSCIE_DO_LASU_ZE_WSCHODU` tx=95→155, tym samym wzorem
  „krawędź−1", który dał 98 przy szerokości 100), zastosowane w obu kopiach
  `forrest.tmj` (obiekt portalu) i w `thicket-gestwina.tmj` (`spawnX`).
  `BRAMA_GESTWINY` nietknięta — leży na mapie Gęstwiny.
- **Lis #2 przeniesiony (59,18)→(59,16)**, z wody na piasek brzegu — jedyny
  dozwolony wyjątek od „nie ruszaj spawnów", bo to nie nowa decyzja
  (`forest_rebuild_scope.md` S4, potwierdzone jako realny konflikt fizyki w
  `PROJECT_CHECKPOINT_STEP1B.md` §1.3).
- **Minimapa zregenerowana** (`build_minimap.py --zapisz`) — luka, której nie
  było w żadnym wcześniejszym planie: kod czyta wymiary z żywego `.tmj`, ale
  PNG jest zamrożonym obrazkiem, więc resize bez ponownego uruchomienia
  zostawiłby zakładkę „Mapa" z uciętym widokiem. ⚠ **Przy okazji wyszedł
  dryf niepowiązany z tą sesją**: `village_minimap.png` w repo nie zgadza
  się z `village-zagaje.tmj` (ta mapa nietknięta od dawna) — cofnięte, nie
  naprawione, zgłoszone osobno.
- **Walidacja**: symulacja prawdziwej ścieżki kolizji silnika na żywym
  `.tmj` — suma komórek solid **niezmieniona (1673)**, `linia-ubytku`/
  `rzeka-spojna`/`kupiec-fire`/`niedzw-hub` (próg dzisiejszy, niedźwiedź
  jeszcze nieruszony) wszystkie przechodzą, konflikty spawn↔solid te same
  6 fałszywych alarmów co w Step 1B, minus lis. `tsc`/`build` czyste.
  **Nie zweryfikowane w silniku** — ten sam limit środowiska co poprzednio.
- **Dokumentacja**: `las_faza1b_final.md` (Z-1 podniesione, Z-9 otwarte,
  kroki 4/5 §6 oznaczone zrobione z uwagą o odwróconej kolejności wobec
  kroku 3), `forest_rebuild_scope.md` (ramka na początku + w §4, bez
  przepisywania treści), `docs/README.md`, `CLAUDE.md`, `docs/mapy.md`,
  `docs/zaimplementowane.md`, `GameConfig.ts`/`TiledMap.ts` (komentarze),
  `tools/portale.py`. Pełny zapis techniczny: `PROJECT_CHECKPOINT_RESIZE160.md`.

**Następny krok: terrain pass A1–A10**, jednym przebiegiem po x0–159
(istniejące kolumny i nowe razem — decyzja autora o kolejności, patrz
checkpoint §5). Populacja dopiero po nim.

---

## 2026-08-28 (2) — Step 1B: kolizja wody

Warstwa ruchu (poniżej w tym samym dniu) zamknięta checkpointem, autor
przeszedł na las. Pierwszy krok: **kolizja wody**, ostatni kawałek §6 wiersza
1 z `las_faza1b_final.md` — pnie i budynki miał już Step 1A.

**Mechanizm**: 49 wariantów kafla wody w `Teren` (lokalne id 12,13,76–122,
policzone programowo z `docs/kafle.json`, nie przepisane ręcznie) dostały
`solid: true`, tym samym sposobem co ściany chaty w Step 1A. Reguła „najwyższy
kafel decyduje" (niezmieniona) robi resztę: `path`/`sand` nad wodą = bród.

⚠ **Bród nie jest tym, co sugerowała intuicja.** Polecenie brzmiało „zweryfikuj
dokładnie, które komórki brodu mają path/sand jako topmost, nie zakładaj" —
i to była dobra instrukcja: z 8 komórek wody w paśmie brodu tylko **5 ma drogę
na wierzchu**. x=40/y=24 jest gołą wodą (trakt przechodzi z kolumny 40 na 41
akurat w tym rzędzie), więc realny korytarz zwęża się z 2 kafli do 1 na jednym
rzędzie. Nieprawione — to jest domalowanie mapy, poza zakresem tego kroku.

⚠⚠ **Znalezisko przy weryfikacji „gracz nie wchodzi do wody poza brodem":
7 komórek wody przecieka, bo dekoracja (korona drzewa, krzew, runo, filler
pnia bez trafienia w trunk) leży na wierzchu wody bez własnej kolizji.** Ten
sam mechanizm, przed którym `las_faza1b_final.md` §3.7 już ostrzegał dla pni
pod koroną — tylko że tu jest to woda pod dekoracją, nie pień. Sprawdzone
(flood-fill po zablokowaniu prawdziwego brodu): **żadna z tych 7 komórek nie
łączy brzegów** — mapa rozpada się na dwie części 2808/1393, więc bród
zostaje jedynym PRZEJŚCIEM, te siedem to izolowane kieszenie, w których gracz
może stanąć, ale nie przejść. Nienaprawione świadomie: punktowa naprawa to
malowanie mapy (poza zakresem), naprawa klasowa (kolizja na `trees-over`/
`bushes`/`undergrowth`) zablokowałaby zamierzoną przechodniość gdzie indziej.

⚠ **Jeden prawdziwy konflikt spawn↔kolizja: lis rodzi się w wodzie**
(kafel 59,18). Sześć innych trafień z surowego skanu to fałszywe alarmy —
`Gatherable` nie ma ciała fizycznego (nigdy nie koliduje), a `lilia` to
`lilia_wodna` (`ASSETS.lilyPad`), więc jej dwa trafienia w wodę są
**poprawnym stanem, nie usterką**. Ten drugi fakt (`Gatherable extends
Phaser.GameObjects.Sprite`, zero fizyki) wart zapamiętania — bez niego naiwny
skan współrzędnych „spawn na solidnej komórce" fałszywie alarmuje na każdym
ziołowym stanowisku w pobliżu wody czy pnia. Spawn lisa nieprzesunięty —
zmiana pozycji spawnu jest zastrzeżona dla autora.

**Metoda weryfikacji, mocniejsza niż w Step 2**: zamiast próbki asercji
odległości, **diff całego pliku wobec poprzedniego commita po odjęciu nowego
pola `Teren.tiles`** — bajt-w-bajt identyczny. Dowodzi, że nic poza kolizją
się nie ruszyło, mocniej niż jakikolwiek zestaw punktowych sprawdzeń by
dowiódł. Serializer (custom, bo Tiled nie eksportuje jak `JSON.stringify`)
zweryfikowany na roundtripie PRZED użyciem do zapisu.

⚠ **Pułapka przy renderowaniu weryfikacyjnym: `ImageDraw` na płótnie RGBA nie
miesza się z tłem.** Półprzezroczysty czerwony prostokąt narysowany wprost na
canvasie wyszedł jako CZYSTY `(200,30,30)` — zero wkładu tła — złapane przez
spróbkowanie piksela, nie okiem (na oko wyglądało to prawdopodobnie na
„ciemniejszą wodę", nie na oczywisty błąd). Trzeba rysować na osobnej
przezroczystej warstwie i złożyć `Image.alpha_composite`. Zapisane tu, bo to
dokładnie ta klasa błędu — cichy, wygląda prawie dobrze — przed którą ostrzega
`tools/CLAUDE.md` o patrzeniu na render.

`tsc`/`build` czyste (krok nie dotyka kodu). **Nie zweryfikowane w silniku**
— ten sam, powtarzający się limit środowiska (Browser pane nie uruchamia
Phasera). Pełny zapis, w tym dokładna tabela kształtu brodu: `PROJECT_CHECKPOINT_STEP1B.md`.

### Domknięcie Step 1B: trzy znaleziska rozstrzygnięte, żadne nie naprawiane teraz

Autor potwierdził wszystkie trzy jako **odłożone, nie jako otwarte pytania**:

- Zwężenie brodu do 1 kafla (x=40/y=24) — zapisane jako uwaga do późniejszej
  korekty geometrii brodu.
- 7 izolowanych kieszeni wody pod dekoracją — do przebudowy mapy.
- Spawn lisa w wodzie (59,18) — **nietknięty, i to nie była nawet nowa
  decyzja**: `forest_rebuild_scope.md` wiersz S4 śledzi dokładnie to
  przesunięcie od przed tej sesji („lis #2, w wodzie → brzeg rzeki, na
  lądzie"). Checkpoint tylko potwierdził symulacją silnika, że usterka jest
  realna (ciało faktycznie koliduje), nie tylko wizualna.

Obie odłożone rzeczy dostały wiersz w `docs/odlozone.md` §3.
**Step 1B zamknięty w obecnym stanie.** Następny etap ogłoszony przez
autora: **przebudowa samego lasu**, nie kolejne poprawki techniczne rzeki —
`docs/forest_rebuild_scope.md` jest dokumentem otwieranym przed Tiled.

---

## 2026-08-28 — warstwa ruchu, ciało sarny i błąd w liczbach, na których stał §10

Trzy rzeczy, w tej kolejności: pomiary → **znalezisko, które unieważnia część
poprzednich pomiarów** → fundament techniczny.

### Pomiary domówione przed decyzją

Autor poprosił o trzy brakujące przypadki, zanim zatwierdzi standard prześwitu.
Symulacja kroku Arcade przeciw żywemu `forrest.tmj` (ta sama metoda co §10.8;
walidacja: odtwarza opublikowane liczby — 1203 komórki solid, 52 bramy 18 px,
gracz 86,6 % mapy, sarna 39,5 % w 163 wyspach):

- **Wataha w ciasnym przejściu — `collider(enemies, enemies)` NIE jest dziś
  problemem.** Rozpychanie występuje w **0,2 %** pozycji, a usunięcie collidera
  nie zmienia wyniku w trzeciej cyfrze. ⚠ Powód jest warunkowy i wart
  zapamiętania: wilki nie tłoczą się w bramie, bo **orbitują** — rozchodzą się,
  zanim zdążą się zakleszczyć. Pierwsze stworzenie, które będzie zamykać dystans
  po prostej **i** występować w grupie, trafi na to od razu.
- **Sieciarz: jego problemem nie jest ruch, tylko LINIA STRZAŁU.** Stoi w paśmie
  ognia od chwili agro, więc pathfinding nie ma tu czego naprawiać — ale sieć
  jest pociskiem i **pęka o pierwszy pień** (`Projectile.ts:111`). Zmierzone:
  **45 %** sieci trafia w drzewo na dzisiejszych pozycjach i **82 %** w gęstości
  odpowiadającej projektowanym A7/A8. Ani omijanie, ani szerszy prześwit tego
  nie ruszają. ⚠ To jest konflikt z planem, który przenosi sieciarze w gęste
  pasmo — zapisany jako osobny punkt do rozstrzygnięcia przy A7/A8.
- **Zryw sarny pogarszał się od „omijania".** Pełne zrywy 83 % → **73 %**, bo
  omijanie zawraca ku celowi, a ucieczka celu nie ma. To nie było strojenie —
  to był błąd KATEGORII, i to on ukształtował słownik intencji niżej.

### ⚠ Znalezisko: ciała stworzeń są 1,5–2,4× większe, niż mówił §10

`Body.setSize` zapisuje `sourceWidth`, a `updateBounds()` liczy co klatkę
`width = sourceWidth × |scaleX|`. Czyli **liczba w `GameConfig` jest w pikselach
KLATKI, nie świata**. Realne ciała:

```
  gracz 18   królik 21   skoczek 24   wilk 29   sieciarz 31   dzik 46   Szary 48   niedźwiedź 48
```

Gracz jest **najwęższy w grze**, bo jako jedyny ma `scale: 1`. Analiza z
2026-08-27 porównała bramy z surowym `bodyWidth`, więc wyszło „dzikowi brakuje
4 px" zamiast „brakuje mu 28". **Propozycja standardu 24 px była policzona na
złych danych i jest nieaktualna.** Co ciekawe, projekt znał tę zależność od
dawna — `tools/combat_geometry.mjs:375` mnoży przez skalę. Rozjechały się dwa
liczydła, nie kod.

⚠ Morał do zapamiętania: **§10 mieszał dwie konwencje w jednej tabeli** —
krytterom liczył `klatka × skala` (poprawnie), wrogom sam `bodyWidth`
(niepoprawnie). Nic tego nie zgłaszało, bo obie liczby są „szerokością ciała".

### Co weszło do kodu

Autor zatwierdził kierunek: **prawdziwa warstwa ruchu, nie hack pod jedną
mapę**, z A* jako planowanym rozszerzeniem, nie „może kiedyś".

- **`src/core/movement/`** — `BodySpec` (jedna droga do ciała fizycznego),
  `MoveIntent` (pięć intencji), `Locomotion` (komponent per stworzenie),
  `MovementContext` (sonda terenu), `DirectSolver`, `SteerSolver`, `NavGrid`.
- ⚠ **Kompozycja, nie klasa bazowa** — wymuszone: `Enemy`, `Critter`,
  `FarmAnimal`, `Player` i `Projectile` rozszerzają sprite'a Arcade każde
  osobno.
- ⚠ **Migracja podklas po jednej była BEZPIECZNA dzięki jednej własności:**
  `resolve()` milczy, gdy w danej klatce nikt nie zgłosił intencji. Podklasa
  niezmigrowana działała dokładnie jak dotąd. Przeszło osiem zachowań (siedem
  wrogów + krytter), każde osobno, `tsc` i `build` po każdym.
- **`Critter` dostał ciało** — bugfix, nie decyzja projektowa. Sarna 79×57 →
  26×14 px realnych: **39,5 % → 84,8 % mapy, 163 wyspy → 1**, pełne zrywy
  69 % → 83 %.
- **`NavGrid` budowany od razu, czytany przez nikogo** — decyzja autora. Siatka
  **prześwitu** (nie „wolne/zajęte") o rozdzielczości **8 px** (nie kaflowej —
  wszystkie bramy w lesie mieszczą się wewnątrz kafla 32 px). Zmierzone na
  żywej mapie: 400×240 komórek, **94 KB, 7 ms** budowy.
- **`SteerSolver` istnieje i jest DOMYŚLNIE WYŁĄCZONY.** Włącza się per gatunek
  (`solver: "steer"`), bo omijanie jest zmianą odczucia walki, nie poprawką.
- **`tools/movement_weryfikacja.mjs`** — 63 tys. porównań **bitowych** z
  formułami Phasera. ⚠ Kontrola negatywna przeprowadzona: podmiana `atan2` +
  `setToPolar` na `normalize().scale()` — czyli zmiana **matematycznie
  równoważna** — wywala test na 15. miejscu po przecinku. Dokładnie ta klasa
  różnicy, przed którą ostrzega `src/core/CLAUDE.md`.
- **`dev.bodies()`** — realne ciała w pikselach świata, żeby pytanie „czy się
  zmieści" nie wracało do configu.

⚠ **Nie zweryfikowane w silniku**: panel przeglądarki w tej sesji nie
uruchamia Phasera (`Framebuffer status: Incomplete Attachment` — ten sam limit
środowiska co przy Fazie 1A i migracji sklepu). `tsc`, `build` i bramka
`movement_weryfikacja.mjs` przechodzą czysto; **ruch stworzeń w grze wymaga
sprawdzenia ręką.**

### Eksperyment ze `Steer` na dziku — wynik NEGATYWNY i to jest wynik

Autor wrócił z rozgrywki najpierw z „jest lepiej, dzik się przeciska", potem —
po sprawdzeniu w tym samym miejscu — z „dalej mogę oszukać dzika, tamto jakoś
mu się udało prześlizgnąć". ⚠ **Pierwsza obserwacja była prawdziwa jako
obserwacja i fałszywa jako przyczyna**: żaden gatunek nie miał wtedy `steer`,
`Enemy` liczy ciało tym samym wzorem co przed migracją, a wszystkie osiem
zachowań jest przepisane 1:1 (sprawdzone gałąź po gałęzi). Pościg był **bitowo
tym samym ruchem** co przed refaktorem. Wyjaśnienie: 80–89 % pozycji zawsze
było osiągalnych, a ślizg po korze wygląda z ekranu jak objazd.

Morał do zapamiętania, bo jest tańszy niż jego powtórka: **po refaktorze, który
ma NIC nie zmienić, „chyba jest lepiej" jest sygnałem do sprawdzenia kodu, nie
do świętowania.** Bramka bitowa nie łapie jednej rzeczy — gałęzi, która
przestała zgłaszać intencję (ciało jechałoby wtedy prędkością z poprzedniej
klatki). Sprawdzone osobno, takiej gałęzi nie ma.

Potem `steer` włączony **dzikowi i tylko jemu**, bez ruszania `commitPx`.
Wynik w tym samym miejscu: **klinuje się dalej.** Przyczyna przeczytana ze
źródła, nie zasymulowana:

- Sonda **nie jest ślepa** — kolizja kafli to prawdziwe statyczne ciała Arcade
  (`staticGroup` ze stref), więc `overlapRect` je widzi.
- Sonda pyta, czy w punkcie wyprzedzenia zmieści się **całe ciało: 46 px**.
  Bramy w lesie mają 18 albo 33 px, więc **cały wachlarz** (18°…140°) wypada
  zajęty, a wtedy `steer()` z definicji oddaje wektor pierwotny.
- Wyprzedzenie to `max(14 px, prędkość × 0,28 s)` ≈ 15 px przy pościgu dzika —
  sonda patrzy bliżej, niż samo ciało jest szerokie.

⚠ **Czyli w ciasnym terenie `Steer` degraduje się do `Direct`. To granica
lokalnego omijania jako KLASY, nie usterka.** Trasę wokół takiego miejsca umie
znaleźć dopiero `PathSolver` czytający prześwit — i to jest niezależne
potwierdzenie, dlaczego `NavGrid` niesie prześwit, a nie „wolne/zajęte".

**Decyzje autora po eksperymencie (2026-08-28):**

1. **`SteerSolver` ZOSTAJE** jako docelowy solver lokalnego omijania, także dla
   przyszłych NPC-ów. Negatywny wynik jednego przypadku nie jest przesłanką do
   jego usunięcia. **Zostaje też włączony dzikowi** — nie ma technicznego powodu,
   żeby go zdejmować (jedno `overlapRect` na klatkę, wyjście po pierwszej
   sondzie przy wolnej drodze).
2. **Nie stroimy `MOVEMENT.steer` pod ten przypadek.** To gałki wspólne;
   strojenie ich pod jedno miejsce na mapie byłoby naprawianiem geometrii
   solverem.
3. **To miejsce jest odtąd problemem GEOMETRII LASU, nie AI.**
4. **Propozycja standardu 24 px — ODŁOŻONA**, nie przedyskutowana i odrzucona:
   nie podejmujemy decyzji geometrycznej na tabeli policzonej w złej jednostce.
   Wraca jako nowa analiza na realnych ciałach.

### Domknięcie: `FarmAnimal` i ramka w §10 (druga sesja tego samego dnia)

Autor wstrzymał decyzję o standardzie prześwitu do czasu, aż będzie ją można
podjąć na realnych wymiarach ciała. Trzy rzeczy przed checkpointem:

- **`FarmAnimal` przeszedł na `applyBody`** — dokładnie ta sama luka co
  u krytterów, znaleziona przy odtwarzaniu stanu: `setScale` bez `setSize`,
  więc **krowa miała ciało 112 × 112 px**, byk 122 × 122, świnia i owca po
  ~86. ⚠ **To NIE jest naprawa objawu w rozgrywce** — zwierzęta gospodarskie
  nie mają ani jednego collidera, a Zagaje nie mają kolizji kafli, więc nic się
  nie zmienia na ekranie. Chodzi o to, żeby reguła „każde ciało jest
  zadeklarowane" nie miała wyjątku, bo to na niej stoi `dev.bodies()`.
- Liczby ze skanu alfy arkuszy: `w` = bbox w rzucie PRZODEM (jedyny, który daje
  szerokość zwierzęcia, a nie jego długość), `h` = 0,55 × `w` (proporcja
  odczytana z gotowych ciał sarny i lisa), `feetPadding` = odległość stopy od
  dołu klatki w rzucie z profilu. ⚠ Arkusze 128 px mają **39–45 px pustego
  marginesu pod zwierzęciem**, więc `feetPadding: 2` jak u wrogów zawiesiłoby
  krowę pół sylwetki nad ziemią.
- ⚠ **Przy okazji wyszedł strukturalny SOBOWTÓR typu**: `FarmAnimal.ts` miał
  własną deklarację `FarmAnimalTuning` z tymi samymi ośmioma polami co config,
  trzymaną w zgodzie wyłącznie przez typowanie strukturalne. Milczała tak długo,
  aż ktoś dołożył pole. Zlane w jeden typ, importowany — tak jak `CritterTuning`.
- **`las_faza1b_final.md` §10 dostał ramkę „POPRAWKA 2026-08-28"** plus
  jednolinijkowe ostrzeżenia przy tabeli §10.2 i przy propozycji §10.6, żeby
  ktoś wchodzący w środek dokumentu nie wziął zaniżonych liczb za dobrą monetę.
  **Sam standard prześwitu NIE został ruszony** — dalej czeka na decyzję.

---

## 2026-08-27 (5) — las przestaje być puszczą, zaczyna być gospodarką

Konsultacja zewnętrzna (§10, prompt w `prompt_collision_review.md`) **nie
odpowiedziała na zadane pytanie** — recenzent odesłał zamiast tego brief na
przebudowę lasu. ⚠ **Dostał tylko `las_projekt_docelowy.md` i
`las_audyt_level_design.md`**, więc nie widział ani planu wykonawczego z
decyzjami Z-1…Z-10, ani tego, że Step 0–2 są wdrożone — prosił m.in.
o zaprojektowanie brzegów rzeki, które przebudowaliśmy tego samego dnia.

Brief okazał się jednak w ~80% zgodny z zatwierdzonym planem (140 kafli,
olszyna, mokradła, +0 mobów, wyręby) i wnosił jedną rzecz, której plan nie
miał: **tożsamość lasu jako GOSPODARCZEGO** — trakt, drwale, delianki,
znikanie człowieka w głąb. Konflikt był dokładnie jeden.

**Decyzja autora: stara puszcza WYCHODZI z tej mapy** na osobną, przyszłą
lokację za bramą do Gęstwiny. Pasmo x 112–139 zostaje, ale przestaje być
P6 · STARA PUSZCZA i staje się **A8 · KONIEC GOSPODARKI** — zarzucony wyrąb,
młodnik, samosiew, zwarcie 55–65 % zamiast ≥ 75 %. **Z-6 zostaje w mocy co do
KIERUNKU**: powodem przeniesienia niedźwiedzia nigdy nie była „puszcza", tylko
618 px od Myśliwego. Ruiny wypadają, pusty barłóg zostaje. Brama do Gęstwiny
staje się **progiem**, nie kolejnym stopniem.

Powstał **`docs/forest_rebuild_scope.md`** — zakres prac dla kogoś, kto
otwiera Tiled. Podział ról: **scope mówi CO malować i gdzie, plan zostaje przy
decyzjach Z-1…Z-10 i kolejności §6.**

Trzy pomiary zrobione na żywym `.tmj` na potrzeby tego dokumentu, bo bez nich
byłby ogólny:

- ⚠ **Trakt ma dokładnie 2 kafle szerokości od y1 do y59.** Nie poszerza się
  przy wsi, nie zarasta w głębi. Największy brak gradientu na mapie — i
  najtańszy do naprawy, bo droga już jest, tylko nic nie opowiada.
- **Runo nie przekracza 9 % w żadnym paśmie dziesięciokolumnowym.** Kafle,
  nie kod — najtańsza dźwignia w całej przebudowie.
- ⚠ **Gradient gatunkowy biegnie w złą stronę.** Idąc ku Gęstwinie brzoza
  rośnie 38 → 77, świerk spada 123 → 34, a `swiat.md` mówi, że ma być
  odwrotnie. **Próg dzieje się w drzwiach zamiast po drodze.**

Wniosek, który przewrócił kolejność prac w §6 tamtego dokumentu: odpowiadając
na pytanie kontrolne („czy gracz opisze to inaczej niż «las»?") wyszło, że
**wszystkie zdania poza dwoma opierają się na warstwie ludzkiej albo na
podłożu, nie na drzewach**. Gracz nie zapamiętuje zwarcia koron — zapamiętuje
stos drewna i miejsce, gdzie droga się urwała. **Teren i dekoracje niosą
tożsamość, drzewa niosą tylko klimat**, więc idą pierwsze.

§10 zostaje otwarte i zeszło do `odlozone.md` §1 jako decyzja autora.
⚠ **`forest_rebuild_scope.md` celowo nie podaje ANI JEDNEGO prześwitu** —
wszędzie stoi „do ustalenia po standardzie §10", z zasadą na czas
niepewności: *projektuj przepływy, nie bramki*.

---

## 2026-08-27 (4) — kolizja z Step 1A zderzyła się z rozmiarami ciał

Playtest autora, dwa zgłoszenia pod rząd: „dziki łatwo zablokować w drzewach
blisko siebie, my przejdziemy, dzik nie" i „a co potem z jeleniami?".
**Oba trafione, oba potwierdzone pomiarem.** Pełna analiza z liczbami, metodą
i pytaniami do konsultacji: `docs/las_faza1b_final.md` §10 — tu tylko narracja.

⚠ **Pierwsza odpowiedź agenta ODRZUCIŁA pierwsze zgłoszenie i była błędna.**
Zapisuję to, bo pomyłka jest metodologiczna i wróci: agent zmierzył
**spójność** wolnej przestrzeni („objazd istnieje, więc to nie problem
rozstawienia") zamiast **prześwitu**. Objazd faktycznie istnieje — i jest bez
znaczenia, bo `moveToObject` nigdy go nie wybierze. Do tego siatka miała krok
4 px, a brama ma 18 px, więc pomiar **fizycznie nie mógł zobaczyć** zjawiska.
Autor musiał to powtórzyć trzeci raz, ze zrzutami ekranu, zanim agent zmierzył
właściwą rzecz. **Objazd, którego AI nigdy nie wybierze, nie jest objazdem.**

Trzy fakty, jedna przyczyna:

1. **52 bramy w lesie mają prześwit dokładnie 18 px** — bo box pnia zajmuje
   9…23 w kaflu 32 px. Ciało gracza to **dokładnie 18**. Dzik ma 22, Szary 20,
   niedźwiedź 30. Rozkład jest zero-jedynkowy: albo 18 px, albo 32–33 px, nic
   pośrodku.
2. **Pościg to linia prosta** i klinuje się na pniu w 11–20 % pozycji gracza
   w zasięgu agro — zero-jedynkowo, nie „wolniej": dzik podchodzi dwie sekundy
   i stoi osiemnaście.
3. ⚠ **`Critter` nigdy nie woła `setSize`**, więc sarna ma ciało wielkości
   klatki arkusza — **79×57 px**, szersze niż dwa i pół kafla. Dostęp do 40 %
   mapy, w 163 osobnych wyspach. Jej zryw to 76 px lotu przy 79 px ciała:
   **nie odskoczy o własną długość.**

Trzeci punkt jest **regresją z poprzedniej sesji**: `collider(critters,
map.solids)` dodano świadomie (R-1), żeby sarna przestała przechodzić przez
drzewa. Ciało 79×57 nie znaczyło wcześniej nic, bo w grze nie było **ani
jednego** kafla z kolizją. Ta jedna linia zamieniła je w klatkę — R-1 zdjął
objaw i odsłonił przyczynę, o której nie wiedział.

**Wspólny mianownik: nigdzie nie było zapisane, ile ma mieć najwęższe
przejście w lesie.** Ciała strojono pojedynczo, w świecie bez ścian, gdzie ta
liczba nie znaczyła nic. Step 1A dał światu ściany i wszystkie te niezależne
decyzje po raz pierwszy zaczęły ze sobą rozmawiać — stąd trzy objawy naraz.
Widać to też w tym, że **pięć encji czyta `body.blocked` i wszystkie pięć
znaczy przez to „przerwij akcję"**.

Nic nie wdrożone. Propozycja (standard prześwitu ≥ 24 px, prawdziwe ciało dla
krytterów, ślizg zamiast parcia w korę) leży w §10 jako **niezatwierdzona** —
autor konsultuje ją z zewnętrznym LLM. Odnotowana też decyzja autora:
**reguły „szarża kasuje się o cokolwiek" nie ruszamy** do czasu playtestu
naprawionego pościgu.

---

## 2026-08-27 (3) — chata Myśliwego miała kolizję tylko na parterze

Zgłoszenie z rozgrywki: „drzewa mają kolizje, ale nie dom myśliwego". Potwierdzone
i naprawione — ale diagnoza była o połowę inna, niż brzmiało zgłoszenie.

**Dom kolizję MIAŁ** — na dwunastu kaflach ze Step 1A (`sciana_*`, `fundament_*`,
`okno_0`), czyli na trzech dolnych wierszach: y5–y7. Nie miał jej na **piętnastu
kaflach dachu** (y2–y4, `kalenica_0/1/2`, `polac_0/1/2`, `polac2_1`, `komin_1`,
`okap_0/1/2`), a to jest **cała górna połowa budynku, narysowana jako lita ściana
z bali**. Wchodząc od północy gracz przechodził przez ścianę i stawał w środku
domu, zasłonięty dachem; zatrzymywał się dopiero na wierszu y5. Od frontu (od
południa, tak jak się do Myśliwego podchodzi) kolizja działała — dlatego to
przetrwało Step 1A i symulację kolizji, która liczyła komórki, a nie sprawdzała,
czy obrys budynku jest zamknięty.

⚠ **Przyczyna jest w regule „najwyższy kafel wygrywa", nie w liście solid.**
Dach leży na warstwie `buildings-over`, więc to ON jest kaflem najwyższym w tych
komórkach — ściana pod nim nie ma szans zadecydować. Ta sama reguła, która
świadomie robi otwarte drzwi (kafel drzwi nad ścianą), tu po cichu zrobiła
otwartą ścianę. **Robiąc listę solid dla budynku, patrz na warstwę najwyższą
w komórce, nie na tę, która nazywa się `buildings`.**

Naprawa: jedenaście kafli dachu dostaje `solid: true` w tilesecie `Buildings`
(obie kopie `.tmj`). `komin_0` w (67,1) zostaje przechodni świadomie — leży nad
kalenicą, a jego podstawa i tak jest w zablokowanym wierszu y2; zablokowanie go
postawiłoby samotną ścianę w trawie za domem.

**Asercja `chata-szczelna`** (dopisana do `las_faza1b_final.md` §6.1): obrys
x64–68 × y2–7 solid wszędzie poza drzwiami (66,6) i (66,7). Sprawdzona
kontrolą negatywną na `git show HEAD` — świeci na czerwono, wskazując dokładnie
piętnaście kafli dachu. Komórek solid na mapie: 1188 → **1203** (+15, dokładnie
dach). Zero spawnów w kaflach solid. `tsc` i `build` czyste.

**Znalezione przy okazji, NIE naprawione:** dwa kafle płotu (`zagroda_0`,
`zagroda_2`) przy bramie północnej — (39,1) i (42,1), warstwa `znaki` — też są
przechodnie. To osobna decyzja: zablokowanie ich zwęża wjazd na drogę tuż przy
portalu, więc nie ruszam tego bez pomiaru bramy.

---

## 2026-08-27 (2) — Faza 1 fauny: jeleń dostał zryw, lis dostał zamiar

Wdrożenie `docs/fauna_faza1.md` — zakres zawężony w poleceniu do „Jeleń + Lis
jako nowe zachowania Critter", bez ruszania spawnów/gęstości (świadomie
odłożone, patrz plik). Zero nowych klas: jeleń i lis zostają jedną klasą
`Critter`, różnią się wyłącznie strojeniem w `GameConfig`.

**Znalezisko przy pisaniu, nie w planie:** komentarz przy `ASSETS.deer`/`.fox`
mówił od 2026-08-14, że `runKey` jest „loaded and sliced ale UNUSED — ambient
wildlife never needs to actually run". Zryw właśnie tej animacji potrzebował —
tekstura i slicing czekały gotowe od trzynastu dni na dokładnie ten moment.

**Błąd złapany ręcznym przeliczeniem, nie przez `tsc`:** wyjście z `alert`
albo `watch` z powrotem do `none` zostawiało `idling = true` i stary
`nextDecisionAt` (sprzed całej sekwencji zrywu, do 2,8 s w przyszłości u
jelenia) — bez jawnego `nextDecisionAt = nowMs` zwierzę zamierałoby w pozie
idle zamiast ruszyć, czyli dokładnie ten krok priorytetu autora
(„reakcja → zryw → **powrót**"), który nic w kompilacji nie łapie.

**Weryfikacja bez silnika:** `Critter` dziedziczy po
`Phaser.Physics.Arcade.Sprite` i nie da się go odpalić headless (w
odróżnieniu od czystych modułów typu `Inventory`/`Quality`, dla których ta
sesja ma gotowy wzorzec esbuild→node). Zamiast tego — ręczne przeliczenie
pętli gracz-stępa-na-jelenia ze wzorów wprost z kodu, potwierdzające liczbę
zapowiedzianą w planie („60–80 px przewagi"); zapisane w
`docs/fauna_faza1.md` §8.2, żeby nie trzeba było go odtwarzać przy playteście.

⚠ **Panel przeglądarki tej sesji dalej nie uruchamia Phasera** — nawet po
sfrontowaniu zakładki `document.visibilityState` zostaje `"hidden"` i żadna
scena się nie aktywuje. Ten sam limit, co przy migracji sklepu 2026-08-27.
Manualna checklista czeka w `docs/fauna_faza1.md` §10.

Nietknięte, zgodnie z poleceniem: `Rabbit.ts`, `Enemy.ts`, `FarmAnimal.ts`,
spawny w `.tmj`. Relacje międzygatunkowe (lis płoszy królika, wilk płoszy
faunę) zostają odrzucone dla tej fazy z pomiarem w `fauna_faza1.md` §5 —
niezmienione tym wdrożeniem.

---

## 2026-08-27 — sklep przechodzi na „tapnięcie zaznacza" + dwa błędy przy okazji

Zgłoszenie z rozgrywki brzmiało „na telefonie pierwszy tap w towar od razu
kupuje". Audyt potwierdził i **odrzucił dwie hipotezy z samego zgłoszenia**: to
nie był błąd mobilny (kod nie ma ani jednej gałęzi mobile/desktop w tej
ścieżce) ani podwójne wywołanie. Jedno tapnięcie odpalało dokładnie jedną
akcję — tą akcją był zakup. Plan wdrożenia: `docs/sklep_migracja_wzorca.md`.

⚠ **Audyt zgłosił przy okazji drugi błąd wejścia, którego nie ma** — §2 opisuje
pomyłkę i jej przyczynę. Realny drugi błąd wyszedł gdzie indziej, w pieniądzach
(§3).

### 1. Sklep był jedynym panelem poza wzorcem katalogu

`ShopPanel` kupował na `POINTER_UP` w ikonę towaru, bez zaznaczenia, bez karty,
bez ilości i bez potwierdzenia — od **pierwszego commita** (`git log -L`
potwierdza). Reszta `src/ui/` przeszła na „tapnięcie ZAZNACZA, akcje pod kartą"
przy plecaku, lalce, slotach toreb i ekranie umiejętności; strona kupca została
sama. Dziś ma to samo: zaznaczenie, kartę z `showFixed`, `CardActions`
z licznikiem i przycisk **Kup**, który jako jedyny wydaje pieniądze.

⚠ **Karta dostała DWA adresy, po jednym na kolumnę** (`cardAnchor(side)`),
i to jest cena tej migracji. Karta ma do 250 j. i stała przy lewej krawędzi
panelu (−408…−158), a siatka kupca stoi −327…−73 — czyli zaznaczenie towaru
**zasłoniłoby 169 z jej 254 j., trzy pełne kolumny z pięciu**. Trzeciej kolumny
nie ma i to jest policzone w konstruktorze od dawna (856 j. treści przy 776
dostępnych). Reguła, która z tego wyszła: **karta zakrywa tę kolumnę, której
właśnie nie używasz**. Nie łamie to „karty o jednym adresie" z
`src/ui/CLAUDE.md` — tamta reguła zabrania rozjazdu **najechania vs
zaznaczenia**, a obie drogi pytają teraz tę samą funkcję o tę samą stronę.

### 2. Fałszywy alarm o `wasDragging` — i dlaczego go tu zapisuję

⚠ **Audyt zgłosił drugi błąd, którego NIE MA. Zapisuję to jako pomyłkę, żeby
nikt nie „naprawiał" go ponownie.** Twierdzenie brzmiało: skoro `main.ts` nie
ustawia progów drag, to przy Phaserowych zerach `processDragDownEvent` odpala
`DRAG_START` na samym wciśnięciu, przed `processDownEvents` — czyli
`POINTER_DOWN` kasował flagę zaraz po jej ustawieniu, strażnik był martwy,
a przeciągnięcie na pusty kafel kupowało dwa razy. Rozumowanie o Phaserze było
poprawne; **przesłanka o progach nie**.

`PlayerPanel.ts:518` ustawia `scene.input.dragTimeThreshold = 300` **na całą
scenę UI**, świadomie i z komentarzem wymieniającym `ShopPanel` z nazwy. Oba
panele żyją w `UIScene`, więc dzielą jedną wtyczkę wejścia. Przy progu
czasowym `processDragDownEvent` idzie w gałąź `dragState = 2` i **nie emituje
nic**; `DRAG_START` przychodzi dopiero z kolejnego ruchu, po 300 ms — czyli
zawsze PO `POINTER_DOWN`. Flaga działała, podwójnego zakupu nie było.

⚠ **Lekcja jest o czytaniu konfiguracji, nie o Phaserze: `input` jest PER
SCENĘ, więc dowolny widżet w `UIScene` stroi wejście wszystkim pozostałym.**
`main.ts` jest tylko jednym z miejsc, w których te progi mogą być ustawione,
i akurat nie tym, które wygrywa. Szukając wartości takiego pola, przeszukaj
`src/`, nie samą konfigurację gry.

Co z tego zostało naprawdę: `wasDragging` **straciło jedynego czytelnika**
razem z zakupem na tapnięcie i zostało usunięte z `ShopPanel`. ⚠ W
`PlayerPanel` ta sama flaga jest ustawiana i **nikt jej nie czyta** — zostawiona
nietknięta, bo to nie był plik tej zmiany.

### 3. „Cofnij" liczyło pieniądze z innego miejsca niż kasa

Znalezione przy okazji, **osobny błąd**: `undoLastTransaction` oddawał
`def.buyPrice`, a `Inventory.buy` pobierał `buyPriceOf(id, jakość)`, czyli cenę
× `QUALITY.priceMul`. U Kowala (`stockQuality` 1–2, mnożnik 0,55–0,75) tarcza
okuta kosztowała 105 g, a cofnięcie oddawało 140 — **+35 g na cykl kup→cofnij,
powtarzalne bez ograniczeń**. U kupca z półką 3–4 błąd szedł w drugą stronę
i „siatka bezpieczeństwa" zabierała 35% ceny. Druga połowa tego samego braku:
`lastTransaction` nie zapisywał jakości, więc cofnięcie sprzedaży oddawało
przedmiot przez `addItem` **bez wykonania** — sprzedany Mistrzowski miecz
wracał Zwykły, a w drugą stronę było to darmowe ulepszanie (kup jakość 1,
sprzedaj, cofnij, masz 3).

⚠ **Trzeci wymiar tego samego: `Inventory.removeItem` zdejmuje po ID i bierze
PIERWSZY pasujący slot.** Gracz z Mistrzowskim mieczem, który kupił u Kowala
Podły i cofnął zakup, stracił ten lepszy. Stąd `takeBackBought` — po slocie
i po jakości dla wszystkiego, co nie stakuje.

Pilnuje tego `node tools/sklep_cofniecie.mjs`: pyta **prawdziwy `Inventory`**,
ile realnie pobrał i wypłacił, zamiast przeliczać wzór obok niego (drugi wzór
powtórzyłby dokładnie tę pomyłkę o poziom wyżej). 308 przypadków, cała drabinka
jakości. ⚠ Sprawdzone, że **umie zaświecić na czerwono**: podstawienie starego
wzoru daje `BŁĄD` i kod wyjścia 1. §3 raportuje przy okazji skalę dawnej szkody
w jakościach w obiegu (131 par, najgorsza +180 g na cykl).

### 4. Czego gracz nie widział, kupując

Karta miała nazwę, jakość, trwałość, obrażenia/obronę, wymagania, obie ceny
i porównanie z założonym — czyli dużo. Brakowało trzech rzeczy, wszystkie
dopisane do `ItemTooltip` (więc poprawiają też plecak):

- ⚠ **Waga była NIEWIDOCZNA w całej grze.** `weight` siedzi na każdej broni
  i każdym elemencie pancerza i steruje kosztem Uniku oraz Sprintu, a jedyne,
  co gracz o nim widział, to wiersz „Obciążenie" na ekranie postaci — czyli
  SKUTEK, już po zakupie i założeniu. Stalowy kirys waży 12, kolczuga 10,
  gambeson 4. Karta mówi teraz `Waga: X` oraz `Obciążenie po założeniu:
  14/18 — Średnie`, liczone jako **podmiana w slocie**, nie suma (inaczej
  wymiana hełmu na lżejszy „dokładałaby" wagi).
- **`Masz: N`** — cały plecak, nie jeden stos.
- **`120 złota → 90 po zakupie`** w liczniku u góry, bo przycisk „Kup" ma
  220 j. i nie zmieści obu kwot.

⚠ Stan posiadania musiał wejść do **klucza deduplikacji** `ItemTooltip.place` —
bez tego kupienie drugiej miksturki zostawiłoby na karcie „Masz: 1". Ta sama
pułapka, co przy kluczu rysowania cooldownu w `AbilityBar`.

### 5. Co zostało świadomie nietknięte

**Przeciągnięcie kupiec → plecak nadal kupuje od razu, bez „Kup"** — zakres
decyzji autora wykluczał drag&drop, a przeciągnięcie jest gestem kosztownym
i celowym, więc nie ma wady, którą miało tapnięcie. Konsekwencja: **„Cofnij"
jest nadal potrzebne** i nie wolno go skasować jako „zbędnego po dodaniu Kup".
Nietknięte też: ceny, asortymenty, `stockQuality`, `Inventory`.

⚠ **Nie zweryfikowane w działającej grze.** `tsc`, `npm run build`
i `tools/sklep_cofniecie.mjs` czyste, ale panel przeglądarki tej sesji nie
uruchamia Phasera (`document.hidden`, pętla nie startuje, lista scen pusta).
Checklista ręczna: `docs/sklep_migracja_wzorca.md` §7.

---

## 2026-08-26 — utwardzenie pamięci projektu i audyt dokumentacja↔kod

Dzień zaczął się od czterech rund przeglądu `docs/` i skończył dwoma broniami.
Ta część opisuje przegląd; wdrożenia mają własne wpisy niżej.

### 1. Dokumentacja nie była bałaganem — była nieodporna na WYSYŁKĘ

Audyt 51 dokumentów nie znalazł ani jednego pliku nieaktualnego *i* bez wartości
historycznej. Prawie każdy miał banner statusu, odwrócone decyzje były oznaczone.
Problem leżał gdzie indziej i wyszedł dopiero z **rozpakowania paczki**
(`docs/inventory_scroll_ux.zip`): eksport to **`docs/*.md` + `docs/*.json`,
płasko, bez podkatalogów**. Czyli zewnętrzny analizator dostaje `docs/` **bez
`CLAUDE.md`, bez pięciu zagnieżdżonych `CLAUDE.md` i bez `public/assets/README.md`**
— przy **188 odwołaniach** z wnętrza `docs/` do tych właśnie plików.

Skutek: `docs/README.md` dostał blok kalibracyjny (przepisany ze wzorca, który
projekt już miał w `atrybuty_ocena.md`) i sekcję „⚠ Jeżeli analizujesz tylko tę
paczkę" z jawną listą braków. **Bez fałszywej kompletności** — braki są nazwane,
nie zasłonięte.

### 2. ⚠ Jedyny poważny rozjazd: nagłówek, który zaprzeczał własnemu plikowi

`combat_v2_audyt.md` głosił *„Nic niewdrożone, `src/` nietknięty"* — a w tym
samym pliku stało `✅ Faza 0`, `1A`, `1B-a`, `1B-b`, `✅ Faza 2` (wszystkie sześć
klas), `3.1`, `3.2`, `✅ 3.3`, `✅ Faza 4`. Relacje z faz dopisywano **do tego
pliku**, nie poprawiając zdania na górze, a `docs/README.md` powtarzał ten fałsz.
Agent czytający tylko nagłówek **przebudowałby skończony, grywalny system**.

### 3. Audyt dokumentacja↔kod: 3 krytyczne, 7 średnich

Najciekawsze były dwa znaleziska w plikach REGUŁ, nie w dokumentach:

- **`src/entities/CLAUDE.md` twierdził, że kontakt to „JEDYNY kanał niedźwiedzia"**
  — a `Bear.contactDamageEnabled` zwraca `false` od Fazy 3.3, i komentarz nad
  nim mówi to wprost. Plik reguł **auto-wstrzykiwany przy każdej edycji
  `src/entities/`** zaprzeczał kodowi, który reguluje.
- **„KANAŁÓW jest CZTERY"** wyliczało `Boar.tryTouchDamage`, metodę, która **nie
  istnieje** — szarża jest akcją `ActionRunner`a od Combat v2.

Do tego: `zaimplementowane.md` wskazywał `GameScene.damageEnemiesInArc` (usunięte
2026-08-23) i nie znał Combat v2, 5A, 5B, celowania ani Wypadu; `combat_wspolpraca.md`
odsyłał po ograniczenia do pustego `AGENTS.md`; wymiary arkuszy rozjechały się
**w trzech wersjach naraz** (`assety.md` 640×230, `public/assets/README.md`
640×197, rzeczywistość **640×263**).

⚠ **Wniosek, który warto zapamiętać:** wszystkie rozjazdy to dokumentacja, która
została z tyłu za trzema szybkimi sesjami (Combat v2 → 5A/5B → celowanie/Shield
Bash). **Ani jeden nie wskazywał na błąd w implementacji.**

### 4. Zmiana w kodzie: dokładnie jedna, i to komentarz

`Enemy.combatOrigin` twierdził „dziś nikt inny go jeszcze nie woła" i „`radius`
jeszcze nie istnieje jako dana" — obie nieprawdziwe, bo `combatBody` stoi
dziesięć linii niżej i zwraca `radius` z `cfg.hurt`. Przeczesane `dziś nikt` /
`jeszcze nie` / `na razie` / `TODO` po całym `src/`: to był **jedyny** komentarz
niezgodny z implementacją.

### 5. Powstały dwa nowe dokumenty, oba z wpisem w indeksie tego samego dnia

`gui_umiejetnosci_handoff.md` (specyfikacja przebudowy ekranu umiejętności) oraz
`pomysly.md` — kierunki, które **jeszcze nie weszły do pracy**, świadomie
oddzielone od `odlozone.md` (tam leży to, co z pracy **wyszło** i ma warunek
powrotu). Dziś: Kartografia i Władanie bronią.

⚠ Przy Władaniu bronią odnotowany wskaźnik, którego brak kosztowałby sesję:
`bron_dwureczna_analiza.md` §5.3 dobierało oś podziału broni **tak, żeby nie
zbiegała się z mistrzostwem**, a koniec §5 zapisuje, że taka zawartość powinna
wisieć na tym, **co broń robi**, a nie na tym, ile ma rąk.

---

## 2026-08-26 — napisy wyniku obrony i naprawa karty umiejętności

### Napisy „Unik" / „Sparowano" / „Blok"

Zgłoszenie: gracz ma rozumieć, że wynik nie był zwykłym zerem. Stan przed
zmianą był gorszy, niż wyglądał: **`dodge` i `parry` nie mają plików
dźwiękowych** (`combat_feel_5b.md` §9), a kierunek wróg→gracz nie ma popupu
z liczbą — więc dwa z trzech wyników obronnych były rozróżniane **wyłącznie
odcieniem błysku, przez 120 ms, pod palcem gracza**.

Weszło po właściwej stronie podziału §5.6: liczby i teksty do `COMBAT_FEEDBACK`,
decyzja do `CombatCues` (Phaser-free), wykonanie do `CombatFx`. **Combat Resolver
nietknięty**, bramka regresyjna bez różnic.

⚠ **`immune` świadomie bez napisu** — nietykalność jest cicha we wszystkich
kanałach i odwrócenie tego wymaga zmiany zapisanej decyzji, nie dopisania pola.

### ⚠ Karta umiejętności odwracała sens danej

Audyt wdrożenia znalazł jeden realny błąd: karta pokazywała **„Odrzut: 0"** przy
Uderzeniu tarczą, bo strażniki sprawdzały **obecność pola**, nie wartość.
A `SHIELD_BASH.knockbackPx: 0` istnieje **celowo** — config mówi wprost: *„pole
istnieje, żeby decyzja była WIDOCZNA, a nie domyślna przez nieobecność"*. Czyli
deklaracja „ta umiejętność świadomie nie odrzuca" była czytana jako statystyka
o wartości zero.

17 strażników przestawionych z obecności na wartość; przemiecione wszystkie
8 umiejętności × 19 rysowanych pól — to było **jedyne zero w rosterze**.

---

## 2026-08-26 — pierwsze alternatywne style walki: topór 2H i młot 2H

Model docelowy i relacja z wdrożenia: `docs/bron_design_v1.md` §7.B4a.
**Wdrożone, `tsc` / `build` / bramka regresyjna / macierz walki czyste.**

### 1. Punkt wyjścia był inny, niż wyglądał

Zamówienie brzmiało „dodaj pierwszą broń dwuręczną". **Broń dwuręczna była
w grze od 2026-08-16** — włócznia, `hands: 2`, u Kowala, z zamkniętym review
fundamentu. Nie budowaliśmy więc dwuręczności, tylko **dokładaliśmy jej drugą
i trzecią tożsamość**: włócznia zajęła oś ZASIĘGU, wolne były PRESJA i KONTROLA.

### 2. ⚠ Oś zasięgu ma pasmo szerokości 0,36 piksela

`macierz_walki.mjs` liczy prześwit efektywny = zasięg + krawędź hurtboxa celu
(**+17,64 j.** dla wilka), próg orbity watahy to 96. Młot 1H (78) daje 95,64 —
**chybia o 0,36 px**. Czyli: **nie da się dać broni 2H „zasięgu większego niż
KAŻDA 1H" bez oddania jej orbity watahy.**

Stąd rozstrzygnięcie autora: pasmo **72–78**, pod progiem. Topór 76, młot 74,
włócznia zachowuje wyłączność na kontrolę przestrzeni. To ten sam wzorzec, na
którym projekt sparzył się przy `SHIELD.blockArcDeg` i kątach pierścieni HUD:
**dwie liczby, które mają być równe, nie nadają się na próg.**

### 3. Miecz 2H odłożony — z powodem, nie z ostrożności

Autor pytał, czemu unikamy miecza dwuręcznego, skoro w wielu grach jest
standardem. Dwa zapisane powody: `slash` **nie bije dziś żadnego materiału
pancerza** (§4.6 — trójkąt otwarty do trzeciego typu ochrony), a jedyna żywa oś
rodziny `sword` to **Parry, mechanika OBRONNA** — odwrotność archetypu 2H.
Odłożony, nie odrzucony.

### 4. ⚠ Dwie liczby wypchnęła BRAMKA, nie gust

`combat_regresja.mjs` §T6 pilnuje, żeby pierwsze trafienie po Uderzeniu tarczą
nie wypadało bliżej niż 50 ms od końca ogłuszenia. Obie bronie weszły w to:
młot bojowy 45 ms (0,78 → **0,80**), topór 48 ms (0,70/265 → **0,68/285**).
Przy toporze poprawka **wydłużyła zamach**, czyli wzmocniła tożsamość „większa
kara za błąd" — bramka pchnęła broń w stronę, w którą i tak miała iść.

⚠ Tempo obu jest **sprzężone z `ABILITIES.shieldBash.stunMs`**. Zapisane przy
obu polach.

### 5. ⚠ Katalog złapał brakujące pole, którego `tsc` nie widział

Po pierwszym wpisie `tools/katalog_ekwipunku.mjs` pokazał w kolumnie „2H"
**myślnik** przy obu nowych broniach. Powód: napisałem komentarz o `hands: 2`
i **nie wpisałem samego pola** — `hands` jest opcjonalne, więc kompilator nie
miał czego zgłosić. Bez regeneracji katalogu obie bronie trafiłyby do gry jako
jednoręczne, z tarczą w drugiej ręce, wbrew całemu modelowi.
**Generowany katalog jest tu bramką, nie ozdobą.**

### 6. Zero nowych assetów

Ikony wzięte z `items.png`: **2,2** (topór dwusieczny na długim drzewcu) i
**2,3** (młot dwuręczny) — komórki z gotową grafiką, wcześniej nieużywane.
⚠ Fakt do zapamiętania: **rząd 2 arkusza to topory, rząd 3 to młoty
dwuręczne, i cały rząd 3 był pusty w `ITEMS`** — jest tam jeszcze materiał.

### 7. Co zostało otwarte

- `macierz_walki.mjs` zestawia bronie 2H z tarczami — wiersze niemożliwe w grze
  (dotyczy też włóczni od 08-16). Marginesy z nich są fantomowe.
- Margines przy kęsie Szarego: topór −138 ms, młot −163 ms wobec −103 ms
  włóczni. Kontrą Szarego jest **przerwanie obuchem** (`odlozone.md` §5) —
  młot bojowy ją ma, topór świadomie nie.
- Młot bojowy ma **niższy DPS niż młot 1H** (25,9 vs 29,3); kupuje odrzut 460,
  przerwanie i zachwianie. Do oceny ręką.
- Balans liczb w całości do strojenia po playteście — model jest docelowy,
  liczby nie.

---

## 2026-08-26 — ekran UMIEJĘTNOŚCI: lista przestała być katalogiem, layout przestał być stałą

Specyfikacja: `docs/gui_umiejetnosci_handoff.md` (D-1…D-12, zatwierdzone).
**Wdrożone, `tsc` i `build` czyste; obejrzane przez autora na żywym buildzie.**

### 1. Zgłoszony objaw był stałą liczoną z rosteru, nie kwestią pozycji

Lista budowała się jako `top = slotY + 86` przy `rowH = 50` dla `Abilities.all()`.
Przy ośmiu umiejętnościach ostatni wiersz lądował na page-local **+299** przy
dnie strony **+245** — dwa wiersze poza ramką, **i dalej klikalne**, bo maska
przycina rysowanie, nie trafianie. Każda dziewiąta umiejętność wypychała listę
o kolejne 50 j. bez błędu gdziekolwiek. To ta sama usterka, którą rząd
ekwipunku zapłacił przy siódmym slocie (`src/ui/CLAUDE.md`).

Naprawa jest strukturalna, nie kosmetyczna: kontener + `GeometryMask` + suwak
+ `syncSkillRowIO`, wzorem plecaka i `TopicPanel`.

### 2. Decyzja architektoniczna autora: ekran zarządza POSIADANYM

Lista czyta `Abilities.unlocked()`, nie `all()`. Nienauczone umiejętności
zniknęły z panelu — **nie tracąc drogowskazu**, bo katalog stoi w `TrainerPanel`
(nazwa, opis, koszt, `Poznane ✓`), a awans ogłasza `EVENT.abilitiesUnlocked`.
Panel był trzecią kopią tej samej listy. Pusta lista jest teraz **normalnym
stanem** (świeża postać zna zero umiejętności) i niesie jedyne zdanie, jakiego
ten ekran potrzebuje — bez wyliczania zawartości gry.

⚠ Skutek: lista stała się DYNAMICZNA, a poprzedni kod stał na tym, że jest
stała. Stąd **pula wierszy**: obiekty powstają raz, `refreshSkills` je tylko
przypisuje i przesuwa. Kasowanie obiektów wejściowych w trakcie obsługi ich
własnego zdarzenia było dokładnie tym, przed czym ostrzegał stary komentarz.

### 3. Przypisanie wyłącznie przez kartę — skrót odrzucony świadomie

Tap zaznacza i pokazuje kartę; na pasek kładzie przycisk slotu. Skrót
„przytrzymaj 300 ms" był w projekcie i **autor go wyciął przed implementacją**:
przy rosnącej liczbie umiejętności przypadkowa zmiana wyposażenia kosztuje
więcej niż zaoszczędzone tapnięcie. Praktyczny zysk: w tej liście zostają dwa
gesty (tap i ciągnięcie), więc trzystanowa maszyna z plecaka nie była potrzebna.

### 4. Dwie rzeczy znalazły się dopiero na renderze, nie w liczbach

⚠ **Środowisko sesji nie renderuje Phasera** — WebGL zwraca `Framebuffer status:
Incomplete Attachment`, zanim powstaną sceny (ten sam mur co przy
`rozdzial1_questy_ocena.md`, inna warstwa). Weryfikację wizualną zrobił autor
zrzutem z własnego buildu i **to ona zamknęła dwie usterki**:

1. **Stos przycisków schodził na „Wróć do gry".** Karta była wyrównana do góry
   LISTY, więc prawa kolumna traciła 130 j. u góry. Poprawka autora: sloty
   i tytuł nad kolumną listy, karta ciągnięta do góry strony.
2. **Etykieta „Slot 4 — zamień (Ciężkie uderzenie)" ma 35 znaków** przy ~28
   mieszczących się w przycisku 220 j. — łamana teraz na dwie linie.

Domiar po poprawce (przymiar rachunkowy na stałych czytanych z kodu): najwyższa
karta (Uderzenie tarczą, ~260 j.) ze stosem czterech przycisków kończy się na
**+238** przy dnie **+245**. Prześwit 7 j., a nad kartą 6 j. do paska
podzakładek. ⚠ **Dwie liczby, które mają być równe, nie nadają się na próg** —
stąd wycięcie przycisku dla slotu, w którym umiejętność już leży: nie niósł
akcji, a kosztował 46 j. wysokości.

### 5. Co zostało niezweryfikowane ręką

Przewijanie palcem, próg tapnięcia po geście i wygląd najwyższej karty
w działającej grze. Liczby się zgadzają, render sprawdził autor dla stanu
sprzed dwóch ostatnich poprawek.

---

## 2026-08-26 — `Uderzenie tarczą`: pierwsza KONTROLA w grze, i test napisany przed kodem

Pełny projekt i pomiary: `docs/shield_bash.md` (v1.1, review zamknięty).
**Wdrożone, czeka na playtest ręką.**

### 1. ⚠ Znalezisko, które ukształtowało umiejętność, dotyczy istniejącego kodu

`Enemy.updateAI` pomija `updateChase`, dopóki trwa `knockedBackUntil`, a
**każde** `akcje.tick()` siedzi wewnątrz `updateChase`. Terminy `ActionRunner`a
są bezwzględne, więc **zawieszenie stworzenia nie pauzuje jego akcji** —
mijają w tle, a pierwszy tik po oknie odpala zaległe przejścia naraz.

Zmierzone: akcja z telegrafem 560 ms, zawieszona w t=0 i odpytana w t=1000,
**wchodzi w `active` w tej samej klatce, w której zawieszenie mija**. Przy
zachwianiu młota (50 ms) niewidoczne; przy ogłuszeniu 700 ms to byłby dzik
bodzący bez zapowiedzi.

**Stąd kształt prymitywu, a nie z gustu: ogłuszenie KASUJE akcję
(`ActionRunner.cancel`), a runner NIE dostaje pauzy** — pauza uczyniłaby jego
oś czasu warunkową i unieważniła `action_runner_weryfikacja.mjs`.

### 2. Trzy pojęcia, trzy pola — `interrupt` / `stagger` / `stun`

Ogłuszenie **nie zostało** doklejone do `knockedBackUntil` przez `Math.max`,
choć obie bramki wyglądają identycznie. Chcą od ciała czegoś przeciwnego:
odrzut żeby **jechało**, ogłuszenie żeby **stało**. Priorytet w `updateAI` jest
odtąd jawny: **impuls > ogłuszenie > AI**.

Powstał też drugi, nieplanowany hook. `restoreStateTint()` — bo zdejmowanie
ogłuszenia gasiło tint SZAŁU Szarego. Zapamiętanie tintu sprzed ogłuszenia nie
działa: szał może zacząć się **w trakcie** (od ciosów, które gracz zadaje
właśnie dlatego, że przeciwnik stoi), więc podklasa musi zostać **zapytana**,
a nie odtworzona.

### 3. Test przed kodem — i dwie asercje, które musiały same się naprawić

Kolejność narzucona przez review: **§T na czerwono → implementacja → zielono →
playtest**. §T powstała pierwsza (25 błędów, `0 RÓŻNIC`, reszta uprzęży
nietknięta) i przy okazji złapała dwie własne wady:

- **trzy asercje przechodziły PRZEZ PUSTKĘ** — `undefined === undefined`
  i „gałąź nie ogłusza", bo gałęzi w ogóle nie było;
- **okno o stałym rozmiarze** (`slice(i, i + 4000)`) ucinało gałąź w połowie,
  czyli mierzyło **długość komentarzy**, nie zachowanie. §T7 świecił na
  czerwono na poprawnym kodzie.

⚠ Osobno, **nie dotyczy Shield Basha**: kotwica wycinka w §S6
(`private damageCurrentTarget`) rozpadła się — taka metoda już nie istnieje,
`indexOf` zwracał −1, więc `slice(a, -1)` obejmowało **całą resztę pliku**
zamiast jednej metody. Bramka świeciła zielono, nie ograniczając niczego.
Naprawione (`cialoMetody`); §S dalej zielone, bo werdykt był przypadkiem
poprawny.

### 4. Liczba, którą zmienił pomiar

Review podniosło `stunMs: 900` jako „w mobilnym RPG dużo" i poprosiło o A/B
700 vs 900 **oceniane ręką**. Pomiar na żywym rosterze pokazał coś ostrzejszego:
**900 ms jest wartością, której nie da się ocenić ręką.** 700 daje dokładnie
jeden darmowy cios **każdą z dziewięciu broni** (margines 90 ms); 900 daje 1
albo 2 **zależnie od broni**, rozstrzygane marginesem **5 ms**. Czyste wartości
do A/B: **700 i 1000**. Pilnuje tego §T6 — który nie mówi, ile ma trwać
ogłuszenie, tylko że wybrana wartość jest MIERZALNA.

### 5. Co jeszcze wyszło z tożsamości, nie z liczb

- ~~**Zasięg 48 px jest WŁASNY, nie z broni** — jedyna taka umiejętność. Żeby
  ogłuszyć, trzeba podejść bliżej, niż wymaga twój oręż.~~
  ⚠ **ODWRÓCONE TEGO SAMEGO DNIA — patrz punkt 6 niżej.** Zostawiam ten wiersz
  przekreślony, a nie usunięty: to jest dziennik, więc ma pokazywać, że
  argument brzmiał przekonująco **przed** kontaktem z grą. Usunięcie go
  zamieniłoby zapis przebiegu w zapis stanu, a od tego jest
  `zaimplementowane.md`.
- **Bez `wearWeapon()`** — zużywa się to, czym się uderza, a uderzamy tarczą.
- **Bramka „wymaga tarczy" pyta o `blockSpec`, nie o zawartość slotu** — bo
  `offhand` może kiedyś nosić pochodnię. Broń dwuręczna wypada z tego sama.

⚠ **Zapisany koszt:** Shield Bash **pogłębia** zaparkowany „Shield opportunity
cost" (`odlozone.md` §1) — robi z tarczy źródło ofensywy. Przyjęte świadomie;
przeciwwagą jest slot na czterosłotowym pasku. Tamta pozycja **zostaje otwarta**.

### 6. ⚠ Zasięg 48 px — decyzja odwrócona przez rozgrywkę tego samego dnia

Zgłoszenie autora: *„nieintuicyjne jest to, że zasięg skilla jest mniejszy niż
autoataku"*. Pomiar potwierdził i **powiększył** zarzut: 48 px nie było kosztem,
tylko **martwym pasmem 8–50 px** — 51% zasięgu przy włóczni i 38% przy młocie,
czyli przy dwóch **legalnych buildach z tarczą** (obie `hands: 1`). Przy
włóczni ponad połowa normalnego dystansu walki była strefą, w której
umiejętność po prostu nie działała.

**Drugi objaw był gorszy i nie zgłosił się sam.** `updateAimPreview`
rozstrzyga KAŻDĄ umiejętność przez `currentStrike()`, czyli zasięg BRONI, więc
przy przeciągnięciu palcem podgląd podświetlał cel jako legalny, a commit
odrzucał go **cichym `return`** — bez komunikatu, bez cooldownu, bez staminy.
⚠ **Testy czystych funkcji tego nie złapią**: obie strony wołają ten sam
`resolveAbility`, tylko karmią go innym `strike`. To jest nowa klasa błędu
w tym projekcie — nie „drugi stożek UI", tylko **ten sam stożek z dwóch
źródeł**.

Decyzja autora: **zasięg = zasięg broni**, z regułą *„jeśli trafiasz kogoś
autoatakiem, trafiasz go też umiejętnością na tym celu"*. Tożsamość nie
ucierpiała, bo nigdy nie stała na zasięgu — stoi na mnożniku 0,5, wymogu tarczy
i na tym, że przerwanie pochodzi z narzędzia.

⚠ **§T1 zostało ODWRÓCONE, a nie dopisane.** Asercja „zasięg WŁASNY, krótszy
niż broni" pilnowała wycofanej decyzji; zostawiona świeciłaby na czerwono przy
poprawce i wyglądała jak regresja. Doszły dwie nowe: **§T1a** (zasada ogólna —
przemiata cały roster broni, więc nowa broń zaświeci sama) i **§T1b** (strażnik
na rozjazd podglądu z commitem; pyta o **źródło** liczby, nie o jej wartość).
Czerwony sprawdzony celowym zepsuciem — §T1a wymienia wszystkie dziewięć broni
z osobna.

**Lekcja do zapamiętania:** miałem ten pomiar na własnej liście „przed
implementacją" (§6 pkt 3 w `shield_bash.md`) i go nie wykonałem, bo rozumowanie
o tożsamości tarczy brzmiało wystarczająco. Rozgrywka znalazła to w kilka minut.

---

## 2026-08-25 (drugi wpis) — `Wypad`: nowa umiejętność, i rozpoznanie, które zamknęło trzy sesje

Pełny projekt: `docs/wypad_i_szarza.md`. Wypad **wdrożony**, Szarża rozpisana
do przebudowy, kod Szarży nietknięty.

Punkt wyjścia: zgłoszenie z playtestu — znajomy autora nie rozumiał celowania
Szarży ani strefy, w której odmawia. Trzy sesje szukały odpowiedzi w rysunku
(pierścienie, pasy hazardu, dither, kropkowany tor) i wszystkie odbiły się od
tego samego.

### 1. ⚠ Dzisiejsza „Szarża" jest mechanicznie WYPADEM

To jest całe wyjaśnienie tamtych trzech sesji. Aim wybiera **przeciwnika**,
lot go **ŚLEDZI** (`driveLocked(dx, dy)` przelicza wektor co klatkę — kurs nie
jest zamrożony), całość kończy uzbrojony atak. Lot za celem zakończony kęsem:
to jest **wilk**, nie dzik. **Budowaliśmy podgląd szarży dla mechaniki wypadu.**

Wzorce obu leżą w rosterze i noszą te same nazwy co u gracza: `Wolf.ts` ma
wypad (krótki lot, cooldown 1,9 s), `Boar.ts` ma szarżę (kierunek zamrożony,
tor sprawdzany co klatkę, trafienie kończy bieg). **Gracz uczy się obu, zanim
je dostanie** — obrywa od jednej i drugiej od pierwszej godziny gry.

### 2. ⚠ Pomiar, który zamyka pierścienie na zawsze

Najdalszy widoczny punkt od gracza to róg kadru: `√(355² + 164²)` ≈ **391 px**.
`charge.maxRange` = 420. Czyli **cały widoczny ekran mieści się WEWNĄTRZ tego
okręgu** — nie pokaże się nigdy, ani kawałkiem, w żadnym kierunku. Wcześniej
notowane „nie mieści się w kadrze" było wersją słabszą od prawdy.

`szarza_aiming_v2_handoff.md` dostał nagłówek ⛔ i został w `docs/` wyłącznie
jako zapis, czego już nie renderować drugi raz.

### 3. Co weszło — i ile z tego było za darmo

Cały dorobek 2026-08-23 (`AimSession`, `selectTargets`, `coversTarget`,
`AimPreview`) okazał się **poprawny** — był tylko przypięty do złej nazwy
i złej skali. Wypad to nowy blok configu, `case` w `resolveAbility`, gałąź
w scenie, wpis u trenera i ikona. Cios idzie przez `pendingSwing`, więc typ
obrażeń z aktywnego wariantu broni, krytyki, pancerz, XP, łup, zużycie
i przerwanie młota **przyszły bez jednej nowej linijki**.

`pendingCharge` → `pendingRush`, unia `kind: "chase" | "dash"`: różnica między
Szarżą a Wypadem nie leży w samym locie, tylko w tym, ZA CZYM leci i co dzieje
się na końcu.

### 3a. Dwie poprawki od autora, obie po wdrożeniu i obie trafne

**(a) Natarcie ma TRWAĆ.** Wypad kończył się jednym pchnięciem i postać stawała
przy wrogu z zaznaczonym celem, czekając na kolejne tapnięcie — **czego Szarża
akurat nie robi**, więc obie umiejętności uczyłyby dwóch różnych nawyków.
Trafienie uzbraja teraz autoatak. Bezpieczne mimo trwającego zamachu:
`autoAttackArmed` jest flagą TRWAŁĄ, a `resolveAttack` wychodzi wcześniej,
dopóki `pendingSwing` leci (§R6) — autoatak przejmuje PO ciosie, nie nadpisuje go.
Zamiast dwóch luźnych flag powstał jeden blok `onHit`, nazywający pojęcie
„co daje trafienie".

**(b) ⚠ Wypad NIE potrzebuje celu — i bez tego cały mechanizm z §4 był fikcją.**
Pierwsza wersja odmawiała („Wypad potrzebuje celu"). Przy takiej bramce **zwrot
60 % jest praktycznie BEZWARUNKOWY**: gałąź waliduje zasięg, lot przy 900 px/s
dolatuje niemal zawsze, a cel ma tylko `windupMs` = 150 ms na wyjście z zasięgu
broni (~22 px). Efektywny cooldown wynosił po prostu 5,6 s, a **baza 14 s była
ozdobą** — ta sama liczba, o której sam napisałem w configu „tylko ona pilnuje
pościgu".

⚠ **Postawienie sprawy przez autora było lepsze od mojego pierwszego**: rzecz
nie w karaniu za pudło, tylko w **wycenie dwóch sposobów użycia** — „jeśli
używasz tego skilla do przemieszczania bez celu dostajesz długi cooldown".
Brak celu schodzi więc do przeskoku kierunkowego: zero nagród, pełne 14 s.
Jeden przycisk, jeden cooldown, dwie drogi.

⚠ Przy okazji własny błąd, złapany od razu: pierwsza wersja tej zmiany dała
`target: Enemy | null` obok `arrival: … | "none"` — **dwa zapisy jednego
faktu**, przy czym `"none"` nie było czytane przez żaden kod. Czyli martwy slot
z `src/core/CLAUDE.md`. Zastąpione unią, więc stany niemożliwe (pościg bez celu,
przeskok z parametrami ciosu) **nie dają się zapisać**. Wyszło też, że zapas
czasu 1,6× ma sens wyłącznie przy pościgu — przy przeskoku przeniósłby postać
dalej niż deklarowany zasięg.

### 4. ⚠ Zwrot cooldownu okazał się barierką, nie balansem

Przy pisaniu configu trafiłem w `odlozone.md` §5 („auto-podchodzenie do celu")
i byłem dokładnie tą osobą, przed którą ten wiersz ostrzega — chciałem wpisać
Wypadowi cooldown 5 s. Wiersz mówi wprost, że gap-closer z cooldownem rzędu
sekund kasuje pościg za sieciarzem, czyli zawartość wskazaną po playteście jako
fajną.

Rozwiązał to **opis Fiory Q przysłany przez autora**: baza 14 s, **−60 % przy
trafieniu**. Chybiony Wypad kosztuje pełne 14 s, celny wraca po 5,6 s.
**Pościg zostaje rozgrywką, pojedynek dostaje narzędzie do powtarzania —
i rozdziela je jedna liczba zamiast wyboru między nimi.**

⚠ Stąd: obniżenie BAZY jest inną zmianą niż obniżenie zwrotu, i tylko baza
pilnuje pościgu (§S5). Zwrot musi wisieć na `anyHit` w `resolvePendingSwing`,
bo naliczony przy naciśnięciu przeszedłby wszystkie testy czystych funkcji
i po cichu skasowałby całą tę różnicę (§S6).

### 5. Znalezisko z pomiaru: pierwszy zasięg zostawiał dziurę

Przy `rangeReachMul: 2` **cztery bronie z dziewięciu** nie dosięgały progu
Szarży (sztylet 112, pałka 120, krótki miecz i toporek po 124, przy 130) —
czyli martwa strefa, którą Wypad miał zlikwidować, zostawała dla najkrótszych
broni. Stąd 2,4. **§S2 przejeżdża cały roster**, więc nowa krótka broń zapali
lampkę zamiast po cichu odtworzyć dziurę.

### 6. Bramki: §S1–S7, jedenaście asercji, jedenaście sabotaży na czerwono

Najmocniejsze trzy: **§S2** przejeżdża cały roster broni (styk z Szarżą),
**§S6** pilnuje, że nagroda wisi na `anyHit`, a **§S7** — że bramka celu nie
wróci po cichu i że przeskok bez celu nie zacznie nagradzać.

⚠ **Pierwszy przebieg sabotażu dał 4/6 i to był błąd MOJEGO skryptu, nie
bramek**: wzorce wieloliniowe szukały `\n`, a pliki mają CRLF. Złapane tylko
dlatego, że skrypt jawnie rozróżnia „nie trafiłem" od „zielone" — bez tego
rozróżnienia **nietrafiony sabotaż wygląda identycznie jak działająca
asercja**. To ta sama pułapka co przy `windupMs: 420` (2026-08-23), drugi raz.

⚠ Przy okazji: wstawienie `case "lunge"` przed `case "charge"` przesunęło
granicę strażnika §R6, który wycinał ciało heavyStrike „do `case charge`" —
od tej chwili obejmowałby dwie umiejętności naraz, a wtedy kod jednej może
zamaskować regresję drugiej przy zielonym raporcie. Granica zawężona.

### 7. Potwierdzenie

`tsc` 0, `build` 0, regresja walki 111 przypadków bez różnic, §S **11/11
zielonych i 11/11 udowodnionych sabotażem**. **Żywy test w silniku niemożliwy** — Browser
pane raportuje kartę jako `hidden`, więc `requestAnimationFrame` nie odpala,
Phaser nie kończy bootu i sceny nie powstają (`allScenes: []`). Ta sama bariera
co 2026-08-24. **Wypad czeka na ręczne sprawdzenie autora.**

---

## 2026-08-24 — Menu Główne z aktywnej gry (iteracja 1)

Zakładka ZAPIS (`PlayerPanel`) była ślepą uliczką: zapisz/wczytaj/usuń/zamknij,
ale żadnej drogi do `TitleScene`. Poprzedzone audytem całego flow
Save/Load/Menu (bez implementacji) — wynik: architektura już gwarantuje
świeżość zapisu (`Save.save()` czyta żywe singletony synchronicznie), więc
**dirty state jest niepotrzebny**. Przyjęty wariant: gwarantowany autosave przy
wyjściu + `Anuluj / Menu Główne`, nie trójdzielny `Wyjdź bez zapisu` — tamten
nie chroniłby niczego, czego nie chronią już trzy sloty ręczne.

### Co weszło

Nowe zdarzenie `EVENT.returnToTitleRequested`, obsłużone **w całości
w `GameScene`** (`onReturnToTitleRequested`): `Save.save()` → fade → `scene.stop("UI")`
→ `scene.start("Title")`. `PlayerPanel` tylko emituje, po `ConfirmDialog`.

⚠ **`scene.stop("UI")` PRZED `scene.start("Title")` jest krytyczne, nie
kosmetyczne.** `scene.start()` zatrzymuje wyłącznie scenę, która go wywołała —
`UIScene` została `launch()`owana osobno przez `TitleScene` i nic innego jej
nie zatrzymuje. Bez jawnego stopu HUD/PlayerPanel/NpcDialog zostają
renderowane nad ekranem tytułowym, a kolejny `scene.launch("UI")` z
`TitleScene` jest no-opem na już aktywnej scenie — brak nowego `create()`,
więc „Kontynuuj" wskrzesza stare instancje widżetów. Zweryfikowane też wprost
w źródle Phasera (nie z pamięci): `KeyboardPlugin.shutdown()` woła
`removeAllListeners()`, spięte z SHUTDOWN wtyczki input — więc `C`/`B`/`L`/`M`/`Z`
zarejestrowane przez `PlayerPanel` (który sam ich nigdy jawnie nie zdejmuje)
mimo to nie dublują się po powrocie.

Przy okazji: globalny przycisk zamknięcia panelu „✕ Zamknij" → „Wróć do gry"
(mylił się z zamknięciem gry). „Menu Główne" to osobny przycisk wyłącznie
w treści zakładki ZAPIS, nie drugi `addCloseButton`. Touch targety w wierszu
slotu podniesione częściowo (24→32 j. wysokości przycisku) — świadomie NIE do
pełnego progu `HUD_LAYOUT.minTouch`=68 j., bo to wymagałoby przebudowy całej
strony; odłożone do przyszłego review renderu. Rozróżnienie autosave/manualny/
pusty slot: kolor etykiety (`goldLight`/`gold`/`muted`), zero nowych barw.

**Poza zakresem, celowo**: Audio/Music/Controls settings, pełny Settings Menu,
osobne Pause Menu, pełny redesign zakładki ZAPIS.

`tsc --noEmit` i `npm run build` czyste. Żywy test w przeglądarce niemożliwy
w tamtej sesji Claude — Browser pane nie kompozytował klatek (karta
traktowana jako `hidden`, `requestAnimationFrame` nigdy nie odpalił, pętla gry
się nie uruchomiła). Zweryfikowane ręcznie przez autora — potwierdzone.

## 2026-08-23 (siódmy wpis) — trzeci prototyp: `Ciężkie uderzenie`

Pełny opis: `docs/ability_aiming_prototyp.md` §9.3. Burst na jeden cel:
**wolniej, drożej, mocniej i nic poza tym** — zero statusów, bo pytanie brzmi
„czy sama ta wymiana jest warta slotu", a bleed czy ogłuszenie zamazałyby
odpowiedź.

### 1. Archetyp `directionTarget` uniósł drugą umiejętność — po jednym refaktorze

Szarża i Ciężkie uderzenie dzielą kształt, ale **mierzą inaczej, bo mierzą co
innego**. Miara przestała wynikać z `kind` i stała się polem kształtu:
`metric: "spriteCentres" | "surfaceGap"`.

⚠ To nie estetyka: `surfaceGap` jest **tą samą miarą, którą sprawdzi HIT**
(`targetInReach`). Inna miara znaczyłaby, że podgląd mówi „w zasięgu",
a cios po chwili „za daleko" — czyli dokładnie ten rozjazd, przed którym broni
wspólny `AbilitySpec`.

### 2. Opóźniony HIT bez nowego FSM-u

**Nie powstała żadna maszyna stanów.** Cały rytm już był w `pendingSwing` od
C-01 — zamrożony cel i kierunek, obrażenia później, ponowny test zasięgu
w chwili trafienia. Brakowało **jednej liczby**: `damageMul?`.

Stąd za darmo: krytyki, pancerz, popup, XP, łup, zużycie, `cuesFor` i tier
ciężkości. Animacja dostaje `windupMs * 2`, żeby trafienie wypadło przy pełnym
wyprostowaniu ostrza (`swingHitFraction` = 0,5).

⚠ **Jedna bramka musiała dojść i jest nośna: autoatak nie może nadpisać
zamachu w locie.** `pendingSwing` ma jeden slot; przy zwykłym ciosie to nie
bolało, bo cooldown broni jest dłuższy niż pół zamachu, ale przy 420 ms
windupu autoatak zjadłby Ciężkie uderzenie **po cichu** — z opłaconym kosztem
i cooldownem, bez obrażeń. Klasyczna cicha awaria, którą łapie tylko pytanie
„co jeszcze pisze do tego pola".

### 3. ⚠ Podgląd wchodzi wbrew świeżej lekcji, na wyraźne życzenie

Zamówienie prosiło o „melee reach + sector", czyli **dokładnie ten kształt,
który przy Szarży odrzucono dwa razy jako „wygląda jak AoE"**. Wchodzi, bo
skala jest inna (68 px zamiast 420), ale to jest pierwsza rzecz do oceny ręką.
Wybór jest **daną** (`ABILITIES.heavyStrike.aimPreview`), nie gałęzią po nazwie
— zdjęcie to zmiana jednej wartości na `"pathOnly"`.

### 4. Bramki

Nowa sekcja **§R**, sześć bloków — w tym §R5 pilnujący, że to **nie stanie się
Cleave'em z jednym celem** (mocniejsze, droższe, zamach ≥250 ms, zero
dodatkowych efektów) i §R6, strażnik tekstowy na rytm: gałąź musi odkładać
cios w `pendingSwing` i **nie wolno jej zadawać obrażeń na puszczeniu palca**
ani płacić kosztu samodzielnie.

Sześć sabotaży na czerwono, każdy w swojej gałęzi.

⚠ Przy okazji: pierwszy przebieg sabotażu D nie tknął gałęzi o długości
zamachu, bo `windupMs: 420` występuje w configu **trzy razy** (niedźwiedź,
skoczek, ta umiejętność) i podmiana trafiła w cudzą linię. Dosabotowane
punktowo — gałąź świeci. **Sabotaż, który nie trafił w to, co miał, wygląda
identycznie jak asercja, która działa.**

---

## 2026-08-23 (szósty wpis) — drugi archetyp celowania: `Szarża`

Pełny opis: `docs/ability_aiming_prototyp.md` §9.2. Combat 5B i mechanika
samej Szarży **nietknięte** — zmienił się wyłącznie sposób wyboru celu.

### 1. `AimSession` dało się współdzielić BEZ wyjątków

To był warunek STOP i został spełniony. Wspólna warstwa (`AbilityBar`, sesja
w `GameScene`, cancel, ✕) **nie zna ani jednej nazwy umiejętności**. Różnicę
archetypów niesie `shape.kind`:

```
directionArc     → Szerokie cięcie: aim wybiera KIERUNEK
directionTarget  → Szarża:          aim wybiera PRZECIWNIKA
```

Rozgałęzienia po `id` są dokładnie dwa i oba dozwolone: `resolveAbility` (to
jest cała jego praca) i logika wykonawcza per ability.

### 2. Dwa małe refaktory wspólnej warstwy zamiast drugiego systemu

- `ResolvedHitShape` stał się **unią**; `coversTarget`/`rangeTo`/`AimPreview`
  rozgałęziają się po `kind`, nie po nazwie.
- `damage` w specyfikacji stało się **opcjonalne**. Szarża nie zadaje obrażeń,
  więc nie ma tego bloku — mnożnik 1,0 „dla symetrii" byłby martwym slotem.
  Przy okazji `SelectedTarget` przestał nieść `multiplier`: selekcja odpowiada
  na „KTO", a nie „ile", i mapowanie rola→mnożnik przeniosło się do
  `multiplierFor`.

### 3. ⚠ Dwie żywe konwencje pomiaru — zapisane jako `AimFrame`

Szarża mierzy **dystans między środkami DUSZKÓW** (`Math.hypot(target.x -
player.x, …)`), a reszta walki **prześwit od `combatOrigin`**. Punkty dzieli
u gracza 19 px, więc przepięcie Szarży przestroiłoby jej pasmo przy
nietkniętych liczbach w configu — czego ta iteracja miała nie robić.

Zamiast to przemilczeć, konwencja **weszła do typów**: `AimFrame { body,
sprite }`, a kształt wybiera swój punkt sam. Dług jest teraz widoczny
i spłacalny jedną zmianą.

### 4. Sektor akwizycji — 30° (PROTOTYPOWE)

Bez niego „wskaż cel" degeneruje się do „weź kogokolwiek w pasmie": celowanie
w górę wybierałoby jedynego wroga stojącego z prawej. Dokładnie ten przypadek
jest testem (§P2).

### 5. Dwie poprawki po pierwszym kontakcie z ręką

**Podgląd mylił się z zasięgiem działania — i trzeba było trzech podejść.**
Najpierw dwa pełne okręgi (`minRange`/`maxRange`) — czytały się jak AoE. Potem
korytarz przycięty sektorem — kierunek wrócił, ale zgłoszenie było to samo.
Ostatecznie **sam pasek do celu, bez żadnego łuku**.

⚠ Wniosek szerszy niż jedna umiejętność: **każdy zakrzywiony kształt wokół
postaci czyta się jako zasięg działania**, wypełniony czy nie, przycięty czy
pełny. Nie da się tego odkręcić alfą ani grubością kreski — trzeba usunąć
kształt. Pasek mówi KTO i KTÓRĘDY, i nic ponadto.

⚠ Koszt jest świadomy: **`minRange` zniknął z obrazu**. Cel bliższy niż próg po
prostu nie dostaje paska (reguła widoczna przez BRAK), a przy tapnięciu dalej
leci komunikat „Za blisko na szarżę". Jeśli okaże się nieczytelne, wraca jako
słowo albo kolor paska — nie jako łuk. Razem z korytarzem wypadł podgląd pasma
po nieudanym tapnięciu (`flashRangePreview`) i pięć kluczy configu.

**Po ręcznym wskazaniu postać dobiegała i nie atakowała.** Szarża uzbraja na
końcu lotu `autoAttackArmed`, ale ten strzela do `currentTarget` — a ręczne
wskazanie blokady celu nie ruszało. ⚠ **Ścieżka tapnięcia działała**, bo tam
cel już jest zaznaczony, więc wada dotyczyła wyłącznie nowej drogi i **nie
mogła wyjść w testach czystych funkcji**: `selectTargets` odpowiada na „kto",
a brakowało kroku „…i to on jest teraz celem".

⚠ Naprawione przez `selectTarget`, wydzielone z `setTarget` — bo `setTarget`
**PRZEŁĄCZA** i szarża na już zaznaczonego wroga odznaczyłaby go, psując
ścieżkę, która działa. Przełącznik zostaje własnością tapnięcia (C-02).

### 6. Bramki

Nowa sekcja **§P**, osiem bloków (kształt, sektor, pasmo, determinizm,
podgląd==commit, brak celu, ręczne bije blokadę). §O przepisane na nowe API,
baseline dalej **bez różnic**.

§P8 jest strażnikiem tekstowym na zgłoszony błąd (Szarża musi wołać
`selectTarget` i nie wolno jej wołać `setTarget`) — obie gałęzie sprawdzone
sabotażem.

⚠ **Sabotaż wykrył dekorację w §P3.** Pierwsza wersja testu miary stawiała
wielki cel POD `minRange`, gdzie dystans środków i prześwit dają **ten sam**
werdykt („za blisko") — przechodziła nawet po przepięciu na prześwit.
Przebudowana na cel tuż NAD progiem, gdzie miary dają werdykt **przeciwny**.
To ta sama lekcja co przy §O6 (45° mieszczące się w obu łukach): **przypadek
testowy, w którym obie hipotezy dają tę samą odpowiedź, nie testuje niczego.**

---

## 2026-08-23 (piąty wpis) — celowanie kierunkowe: prototyp `Szerokiego cięcia`

Pełny opis: `docs/ability_aiming_prototyp.md`. Combat 5B **zamrożony i
nietknięty** — ta iteracja go nie dotyka.

### 1. ⚠ Zanim powstała linijka kodu: pointerów dotykowych był JEDEN

Audyt (ten sam dzień) twierdził, że silnik obsługuje dwa. **Nieprawda** —
`Config.js` daje `input.activePointers: 1`, `InputManager` mówi wprost „by
default there is 1 touch pointer enabled", a `onTouchStart` **po cichu wyrzuca**
dotknięcie, gdy nie ma wolnego pointera.

**To nie był problem prototypu, tylko żywa wada gry**: na telefonie, trzymając
joystick, nie dało się nacisnąć **ani ataku, ani żadnej umiejętności**. Na
desktopie niewidoczne (WASD + `mousePointer`), i dlatego przeżyło do dziś.

⚠ Lekcja metodologiczna: audyt czytał dokumentację i pamięć, nie źródło paczki.
Sprawdzenie `node_modules` zajęło dwa polecenia i wywróciło jedno z wejściowych
założeń zamówienia. Podniesione do 2 decyzją autora, jako osobna delta.

### 2. Dwie rzeczy, których nie wolno zlewać

`aimDirection` (**ciągły, 360°**, idzie do geometrii) to **nie** `visualFacing`
(**cztery strony**, rysuje sprite i broń). Przebudowa animacji na 360° to osobna
i dużo większa praca; bez tego rozdzielenia „celowanie 360°" byłoby kłamstwem
zaokrąglonym do 90°.

### 3. Jeden kształt karmi podgląd i cios

`core/AbilitySpec.ts` (czysty, Phaser-free): `resolveAbility` → `coversTarget`
→ `selectTargets`. Podgląd rysuje **z tego samego spec-a**, którym rozstrzyga
się trafienie, i **z tej samej selekcji** — dlatego znaczniki celów mogą
w ogóle istnieć. Osobny „stożek UI" był zakazany w zamówieniu i jest to dobry
zakaz.

Podgląd rozdziela dwa znaczenia: **obrys koła = zasięg**, **wycinek = obszar
obrażeń**. Dotychczasowy `expandingRing` był pełnym kołem i **kłamał o
kształcie**; zszedł do roli błysku.

### 4. ⚠ Delta zachowania: cleave stracił furtkę zwarcia

`withinArc` pomijał kąt przy prześwicie ≤ 28 px, więc wróg przy plecach obrywał
**poza narysowanym klinem**. `pointBlankBypassPx` jest teraz **wymaganym
parametrem kształtu**; cleave podaje 0.

**Baseline regresyjny nietknięty (zero różnic)** — uprząż podaje legacy'owy
bąbel wprost, bo jej zadaniem jest dowieść, że *silnik* się nie zmienił.
Zmieniła się wartość wybierana przez cleave i to jest osobna delta, pilnowana
przez §O5, pokazującą obie liczby obok siebie.

### 5. ⚠ Znalezisko do decyzji: pół-łuk topora to 200°

`melee.arcDeg` jest PÓŁ-łukiem w całym projekcie. Topór ma 100, czyli **200°
pokrycia** — wszystko poza wąskim klinem z tyłu. Podgląd narysuje to wiernie
i **to będzie pierwsza rzecz, którą prototyp pokaże na ekranie**. Nie strojone:
zamówienie mówiło wprost, żeby nie ruszać szerokości.

### 6. Anulowanie gestu + naprawa zamarzającego licznika (zgłoszone z gry)

**Anulowanie:** strefą jest **sam przycisk** — przeciągnij palec z powrotem
i puść. Podczas celowania świeci na nim ✕ (czerwienieje pod palcem).

⚠ Osobne pole w rogu byłoby błędem: każde miejsce na ekranie leży w jakimś
KIERUNKU od przycisku, więc **zabierałoby ten kierunek celowaniu**. Środek nie
jest kierunkiem. Decyduje puszczenie, nie przejechanie; działa dopiero po
przekroczeniu deadzone, żeby nie zjeść szybkiego tapnięcia.

**Licznik cooldownu zamarzał na „1"** z wygaszoną ikoną, choć przycisk był już
klikalny. Błąd sprzed prototypu: klucz deduplikacji w `AbilityBar.update`
zlewał „stygnie, zostały 3 ms" i „gotowa" w jedno `0`, więc klatka faktycznego
końca cooldownu wypadała na `continue`.

⚠ **Okno = `0,000694 × cooldown`, więc wada rosła z długością**: zmierzone
21% użyć dla Szerokiego cięcia (5 s), 59% dla Szarży, **100% dla Okrzyku
(24 s)**. Stąd wrażenie „czasem", a przy długich „zawsze". Reguła do zapamiętania:
**klucz deduplikacji musi opisywać wszystko, co pętla rysuje** — ten kwantyzował
kąt łuku, a rysował też tekst, alfę ikony i jasność ramki.

### 7. Bramki i czego NIE udało się sprawdzić

Nowa sekcja §O, sześć bloków; **cztery sabotaże na czerwono** przed przyjęciem.
⚠ §O6 w pierwszej wersji była **dekoracją** — cel na przekątnej (45°) mieści się
w pół-łuku 55° obu kierunków, więc gałąź przechodziła, nic nie mierząc.

⚠ **Nie udało się sprawdzić w silniku**: panel przeglądarki był ukryty, więc
`requestAnimationFrame` nie odpalał, sceny nie wystartowały, a WebGL zgłaszał
`Framebuffer: Incomplete Attachment` (płótno zerowego rozmiaru). Cykl życia
pointera, rysowanie podglądu i dwa pointery na urządzeniu **czekają na
playtest**.

---

## 2026-08-23 (czwarty wpis) — 5B domknięte: impuls jako dane, kolizje, macierze

Cztery wymagania autora przed zamknięciem 5B + domknięcie długu 5A.5.
Pełny opis: `docs/combat_feel_5b.md` (przepisany).

### 1. Impuls przestał być „tweenem"

`Impulse` opisuje ruch **w całości, w danych**: kierunek, dystans, `outMs`,
`backMs` i **NAZWA** krzywej. Przesunięcie liczy czysta `impulseOffsetAt`.
`CombatImpulse.ts` to teraz zegar i zapis pozycji — **bez `ease` i bez
`yoyo`**, bo tę samą regułę ma móc wykonać serwer, który tweenów nie ma.

⚠ `quadOut` odtwarza `Phaser.Math.Easing.Quadratic.Out` co do wzoru — to
przeprowadzka mechanizmu, nie strojenie.

⚠ **Zysk był natychmiastowy:** „wraca do zera" przestało być grepem po
`yoyo: true`, a stało się liczbami. I dobrze, bo pierwsza wersja tej asercji
okazała się dekoracją (niżej).

### 2. ⚠ Weryfikacja kolizji wywróciła pierwszą wersję zaworu

Autor miał rację, że `Body.preUpdate()` dowodzi tylko zgodności sprite↔body.
Pomiar klatka po klatce pokazał, że **pierwszy zawór był MARTWYM KODEM**:
czytał `body.blocked`/`touching`, a przy impulsie wjeżdżającym w przeszkodę
**żadna z tych flag nie zapaliła się ani razu** — ciało dostawało
`embedded: true` i tkwiło w przeszkodzie 9 klatek.

Powód: impuls **wpisuje pozycję**, więc z punktu widzenia Arcade ciało
TELEPORTUJE się do środka przeszkody. Silnik rozdziela wzdłuż względnego RUCHU;
przy zerowej prędkości nie ma osi wypchnięcia. **Flagi kontaktu opisują
kolizje, których ten mechanizm nie produkuje.**

Zawór pyta teraz o PRZYSZŁOŚĆ (`physics.overlapRect` na projektowanym
prostokącie, tylko ciała statyczne) i nie wchodzi w przeszkodę.

⚠ **Przy okazji decyzja „odkręcić offset czy zapomnieć" musiała się ODWRÓCIĆ.**
Przy zaworze reagującym po fakcie cofnięcie sumowało się z wypchnięciem przez
fizykę — zmierzony dryf **+8,65 px** po jednym ciosie pod ścianą; wtedy
poprawne było zapomnienie. Przy zaworze zapobiegawczym fizyka niczego nie
koryguje, więc odkręcenie wraca dokładnie do zera. **Zmiana jednego bez
drugiego przywraca tamten dryf** — zapisane w kodzie, bo z kodu tego nie widać.

Wyniki (przenikanie / za przeszkodą / dryf): drzewo z prawej **0,97 px / nie /
0** · luka 0 **1,82 / nie / 0** · drzewo z lewej **0 / nie / 0** · 10 ciosów
w drzewo **1,20 / nie / 0** · drugi mob **chwilowe / nie / 0** · gracz przy
granicy **nie wyszedł** · **przed naprawą: przenikanie 8–10 px, dryf do 8,65**.

⚠ **Wróg wychodzi poza mapę o 14 px i wraca** — bo `collideWorldBounds` jest
u wrogów `false` (stan sprzed 5B, trzyma ich AI). Do decyzji autora.

⚠ **Mapy nie mają ANI JEDNEGO collidera kafli** — testy stały na własnych
przeszkodach. Gdy kolizje kafli wejdą, ten rozdział trzeba przemierzyć od nowa.

### 3. Ciało i kopnięcie: `ownsBody` + `attackerRecoil` (poprawione w przeglądzie)

Szarża dzika, wypad wilka i odskok Szarego **nie dostają** generycznego
kopnięcia — sterują już własnym ciałem. Reszta rosteru dostaje.

⚠ **Dwa systemy ruszające tym samym ciałem to znany, zmierzony błąd tego
projektu** (`knockedBackUntil` powstało, bo AI nadpisywała odrzut i z 160 px/s
zostawało 31 px). `ownsBody` broni przed powtórzeniem go z drugiej strony.

⚠ Pole **wymagane, nie opcjonalne** — i kompilator od razu na tym zarobił,
wymuszając decyzję także dla `spider_web`, o której bym nie pomyślał.
`reportAttack` bierze teraz CAŁĄ AKCJĘ, nie samo `id`, żeby flaga nie mogła
rozjechać się z akcją.

⚠ **KOREKTA z przeglądu, tego samego dnia: to jedno pole znaczyło DWIE rzeczy
naraz** („akcja rusza ciałem" ORAZ „akcja nie dostaje kopnięcia") — i wywrócił
to właśnie `spider_web`, ten wymuszony wpis. Sieciarz strzela stojąc, więc
`ownsBody: false`, i przy starym modelu **dostawał kopnięcie w chwili, gdy jego
POCISK dolatywał do celu** — kilka kafli i kilkaset ms od jego ciała.

Rozdzielone: `ownsBody` zostaje **wyłącznie** niezmiennikiem własności ciała
(`effectsFor` już go nie czyta, `ActionResolution` już go nie niesie), a
kopnięcie jest osobną, jawną daną `attackerRecoil: "none" | "onHit"`. Wiąże je
jeden kierunek — `ownsBody: true` ⇒ `"none"` — i **tylko ten**. Nazwa wartości
mówi o momencie: gdyby sieciarz miał kiedyś dostać odrzut od samego wystrzału,
to jest chwila **wypuszczenia** pocisku i wchodzi jako `"onRelease"`, nie przez
przestawienie `"onHit"`.

⚠ **Zachowanie gry rusza się tu o zero**: `spider_web` i tak nie wołał
`reportAttack` (trafia pocisk), więc kopnięcie strzelca było błędem czekającym,
nie widzianym. Wartość zmiany jest w modelu i w §M2, nie w obrazie.

§M2 pilnuje odtąd czterech rzeczy: obu kolumn osobno, niezmiennika i tego, że
`effectsFor` czyta **wyłącznie** deklarację. Plus dwie gałęzie broniące samego
rozdzielenia — w tabeli musi zostać wiersz `false` + `none`, a `effectsFor` nie
ma prawa zareagować na podrzucone `attackerOwnsBody`. Cztery sabotaże na
czerwono przed przyjęciem.

⚠ **Gracz jest wyjątkiem świadomie**: jego wypad przy zamachu jest impulsem
tego samego rodzaju (wychodzi i wraca), więc oba sumują się i **wygaszają
nawzajem** — cios w coś twardego skraca własny wypad.

### 4. Macierz wynik → impuls

MISS, DODGE, PARRY, BLOCK, IMMUNE — **żadnego efektu pozycyjnego**. HIT —
oba kanały. Trafienie bez kierunku (`dir === null`) też nic nie rusza.
Oczekiwanie jest **wpisane wprost w strażniku**, nie wyprowadzone z kodu.

### 5. ⚠ Trzeci duplikat prezentacji, najgorszy z trzech

Niedźwiedź, dzik i Szary grały `Sfx.play("impact")` **bezwarunkowo, PRZED
`takeDamage`** — zanim wynik istniał. **Szarża brzmiała jak trafiona także
wtedy, gdy gracz ją uskoczył**, co wprost przewracało cel Fazy 5A. Do tego
`impact` to dźwięk tiera `heavy`, więc na ciężkim ciosie leciał drugi raz.

⚠ Wszystkie trzy warstwy duplikacji maskowała przepustnica
`AUDIO.minRetriggerMs`. **Mechanizm tłumiący nadmiar sprawia, że nadmiar
przestaje być widoczny jako usterka.** Stąd §M5: encja nie ma prawa grać
dźwięku WYNIKU (`hurt`/`impact`/`block`/`dodge`/`parry`) wprost.

⚠ **Znalezione przy okazji: `dodge` i `parry` NIE MAJĄ PLIKÓW DŹWIĘKOWYCH**
(`cache.audio.exists` = false). Były bezgłośne także przed 5B — dwa wyniki
Attack Resolvera rozróżnia dziś wyłącznie kolor błysku. Nie naprawiane: nowy
wpis w `SOUNDS` przesuwa strumień `rng` i zmienia każdy plik poniżej.

### 6. Dług 5A.5 domknięty

§N1: hurtbox (`Enemy.combatBody`) **nie czyta żywej skali** — liczy z
`cfg.hurt × cfg.scale`, więc skok `flashHit` nie ma jak nim ruszyć.
§N2: wymiarowanie ciała fizycznego tylko w znanych miejscach budowy.

### ⚠ Dwie asercje, które okazały się dekoracją

**§M3** sprawdzała monotoniczność powrotu — a sabotaż „powrót zwraca stałą 1"
dawał ciąg 1,1,…,1,0, czyli niemalejący, i **przechodził**. Dopiero dwie
dodane gałęzie to widzą: powrót ma być STOPNIOWY (środek ściśle w środku)
i LUSTREM wyjścia.

**§N2** w pierwszej wersji zapalała się na dziewięciu plikach UI
(`Rectangle.setSize`), a po zawężeniu do `body.setSize(` przepuszczała
`body?.setSize(`.

Obie wyszły **wyłącznie pod sabotażem**. Reguła „asercja, która nie potrafi
zaświecić na czerwono, jest dekoracją" zarobiła dziś dwa razy.

### Stan

`tsc` 0 · `build` 0 · pięć uprzęży zielonych, `combat_regresja` bez różnic.
**STOP przed balansem — czeka human playtest**, lista pytań w
`docs/combat_feel_5b.md` §12.

---

## 2026-08-23 (trzeci wpis) — Faza 5B: recoil i domknięcie Combat v1

Zamówienie: *„walka jest czytelna i wszystko działa, czas na 5B"*.

⚠ **Najpierw rzecz, którą trzeba było rozstrzygnąć przed pisaniem kodu.** To
zdanie spełnia warunek 5A tylko w połowie: §12 pytało, czy widać różnicę między
uskokiem a brakiem ataku — tak. Ale recoil był w §13.4 zawiązany na INNYM
warunku: *„jeśli po playteście nadal będzie brakowało masy"*, a o braku masy
nikt nie powiedział. Recoil wszedł na **jawną decyzję autora**, nie dlatego, że
warunek się ziścił, i to jest zapisane w `docs/combat_feel_5b.md` §1, żeby po
playteście dało się tę decyzję odwrócić z pełnym powodem pod ręką.

Drugie pytanie tej rundy — trzęsienie dla `medium` — rozstrzygnięte **na nie**.
Trzęsie dalej wyłącznie `heavy`: skoro walka czyta się dobrze, konserwatywny
start z 5A zadziałał, a kanał niesie znaczenie właśnie dlatego, że jest rzadki.

### Recoil: dlaczego nie jest drugim odrzutem

To było pytanie blokujące. `COMBAT_FEEDBACK.knockbackDurationMs` mówi wprost,
że odrzut ma wyłącznie obuch, bo *„to, że każda broń miała »trochę«, jest
powodem, dla którego kategorie przestały cokolwiek znaczyć"*. Powszechny recoil
łamałby tę decyzję — **gdyby był jednokierunkowy**.

⚠ **Nie jest: wychodzi i WRACA, netto dokładnie zero.** Stąd cały podział —
odrzut 68 px w jedną stronę TWORZY DYSTANS i zostaje wyłącznością obucha,
recoil 4–9 px tam i z powrotem NIESIE MASĘ i może być powszechny. Gdy odpala
się odrzut, recoil celu jest pomijany: ciało należy wtedy do impulsu, a recoil
ciągnąłby cel z powrotem do punktu, z którego odrzut go zabrał.

### ⚠ Przesunięcie przyrostowe — jedyny sposób, żeby to nie było fałszywe

Autor postawił warunek, przez który 5A zostało bez recoilu: żadnego przesuwania
sprite'a względem hitboxa. **Sprawdzone w źródle Phasera:**
`Arcade.Body.preUpdate()` woła `updateFromGameObject()`, czyli ciało jedzie za
obrazkiem w każdym kroku fizyki. Zapis w `gameObject.x` rusza więc hitboksem.
Zmierzone: różnica offsetu ciało−sprite ≤ **0,4 px**, i to szum sprzed ciosu.

⚠ Tween na wartość BEZWZGLĘDNĄ byłby błędem: nadpisywałby własny ruch ciała
(przeciwnik szarpnięty w biegu zamarłby i skoczył), a dwa szarpnięcia naraz
walczyłyby o ten sam atrybut. Każde szarpnięcie pamięta **własny przyłożony
offset** i dokłada różnicę.

⚠ **To wymusiło przepisanie WYPADU przy zamachu.** Stary tweenował `x`/`y`
bezwzględnie, więc kasował recoil lądujący w połowie zamachu. Liczby bez zmian
(6 px / 70 ms), tylko mechanizm — wyszły przy okazji do `PLAYER.swingLunge`.

### ⚠ `hurt` grał TRZY RAZY na trafienie, a maskowała to przepustnica

Przy przepinaniu Combat v1 na `cuesFor` wyszło, że ten sam dźwięk leciał
trzykrotnie: surowo z `Player.takeDamage`, przez `cuesFor` tamże (bo
`tiers.medium.sfx` to też `hurt`) i trzeci raz z `Enemy.reportAttack`.
**Zmierzone, nie wywnioskowane** — po wyłączeniu `AUDIO.minRetriggerMs` stary
kształt zwraca `["hurt","hurt","hurt"]`, nowy `["hurt"]`.

⚠ **Lekcja szersza niż ten dźwięk: mechanizm tłumiący nadmiar sprawia, że
nadmiar przestaje być widoczny jako usterka.** Dlatego własność jest teraz
jawnym warunkiem — *napastnik ogłasza wyłącznie PUDŁO, każdy inny wynik należy
do broniącego się* — a nie liczeniem na to, że duplikat i tak przepadnie.

### ⚠ Zapisana wada: tier po stronie wroga jest wyłączony

`Stamina.impactTier` ma progi kalibrowane pod obrażenia **przyjmowane przez
gracza** (light ≤9, medium 10–20, heavy ≥21). Postać na 1. poziomie bije za
3–5, czyli **wszystkie jej ciosy są `light`**. Skutki: błysk wroga nie dostał
tiera (różnicowałby jednym poziomem), a `light` recoil nie mógł być
prawie-zerowy, bo to jedyna wartość, jaką nowy gracz zobaczy. Druga skala,
liczona z ułamka HP celu, jest zakazana — właściwa naprawa to pass balansu.

### Nowe bramki i to, jak je łamano

- **§M — recoil**: tylko `hit` rusza ciałem · szarpnięcie rośnie ostro z tierem
  (4 < 6 < 9) · recoil ≤ ¼ drogi odrzutu (9 kontra 68,4) · `nudge` ma `yoyo`
  i twarde zerowanie. Uruchamia **prawdziwy** `effectsFor` przez esbuild.
- **§N — skok skali kontra hitbox**: dług §8.2 z 5A, niedomknięty przez fazę.

⚠ **Pierwsza wersja §N miała dwie wady i obie wyszły dopiero pod sabotażem.**
Igła `setSize(` zapaliła się na dziewięciu plikach UI (`Rectangle.setSize`) —
strażnik świecący na poprawnym kodzie zostaje po tygodniu wyciszony. Po
zawężeniu do `body.setSize(` **przepuszczała `body?.setSize(`**, a opcjonalny
łańcuch jest w tym kodzie normą. Stąd wyrażenia zamiast substringów.

### Dwie pomyłki własne, obie warte zapisania

⚠ **`git checkout -- src/entities/Rabbit.ts` skasował 196 linii
niezacommitowanej pracy.** Użyte do sprzątnięcia po sabotażu strażnika, na
pliku, który miał zmiany w drzewie roboczym. Odzyskane co do bitu z **map
źródeł w `Trace-…json.gz`** (`metadata.sourceMaps[].sourceMap.sourcesContent`
trzyma pełne źródło TS razem z komentarzami). **Nie używaj `git checkout --` w
tym repozytorium, dopóki drzewo robocze jest tak grube** — do sabotażu i
przywracania służy kopia pliku.

⚠ **Pomiar opóźnienia pierścienia celu dał 5,8 px i wyglądał jak realny
artefakt.** `setTarget` na JUŻ zaznaczonym celu go **odznacza** (przełącznik
C-02), więc mierzony był martwy, ukryty znacznik. Po jawnym zaznaczeniu
opóźnienie wynosi **0**. Przy pomiarach w silniku sprawdź, czy stan, który
mierzysz, w ogóle jest włączony.

### Weryfikacja

`tsc` 0 · `build` 0 · pięć uprzęży zielonych, w tym `combat_regresja` **bez ani
jednej różnicy**. W silniku: powrót szarpnięcia do **dokładnie 0** (pojedynczo,
12× pod rząd i 12× nakładająco, gdzie szczyt sięga 34,7 px) · cios zabijający
w trakcie szarpnięcia bez awarii · dźwięki po jednym na zdarzenie · świst pudła
nietknięty.

⚠ **Nakładanie sumuje się do 34,7 px — to zapisany limit, nie zabezpieczone.**
Trzeba 12 trafień w 48 ms; najszybszy autoatak chodzi co ~500 ms przy
szarpnięciu 130 ms, więc nie zdarza się. Gdyby powstał kanał trafiający gęściej
niż co 130 ms, to jest liczba, którą trzeba wtedy ograniczyć.

---

## 2026-08-23 (drugi wpis) — trace z przeglądarki: ścinanie NIE jest w kodzie gry

Zgłoszenie: *„gra w losowych momentach klatkuje"* + `Trace-20260823T152041.json.gz`
(26 MB spakowane, 162 MB JSON, 511 tys. zdarzeń, 42,4 s nagrania).

### Co trace faktycznie pokazał

| miara | wartość |
|---|---|
| klatek wyświetlonych / porzuconych | 3230 / **1095 (25%)** |
| przerw w `requestAnimationFrame` > 25 ms | **85** |
| łączny czas bez ani jednej narysowanej klatki | **9,6 s z 42,4 s = 22,6%** |
| `FireAnimationFrame` — czas w klatce | p50 **2,4 ms**, p99 4,9 ms |
| wątek główny renderera | zajęty 26,7%, **bezczynny 72%** |
| cały kod z `/src/` (AI, walka, fizyka, UI) | **1,1% czasu zegara** |

⚠ **Klatka gry liczy się w 2,4 ms, a gra stoi przez jedną piątą sesji.**
W trakcie zacięć wątek główny jest BEZCZYNNY (2–5%), kompozytor dostaje
`BeginFrame` co 10 ms i każdy oznacza `DroppedFrame`, a `BeginMainFrame` nie
idzie do JS-a w ogóle. To nie jest „za dużo pracy w klatce" — to
niedostarczanie klatek.

⚠ **Trzy powody, dla których TEN trace nie diagnozuje gry**, wszystkie
w metadanych: nagranie miało włączone **zrzuty ekranu (1800 sztuk, 42,5/s,
25,5 MB)**, które czyta się z GPU przy każdej wyświetlonej klatce — proces GPU
stał przez to na 47% zajętości przy zaledwie 4,9 s realnych poleceń GL z 20 s
jego pracy; gra działała w **przeglądarce wbudowanej w VS Code** (proces
„Browser" profiluje się jako `…/Microsoft VS Code/…/out/main.js`), która dzieli
kompozytor z edytorem; do tego doszedł profiler CPU i zbieranie source-map.
**Zanim ktokolwiek uzna to ścinanie za zdiagnozowane, trzeba powtórzyć pomiar
w samodzielnym Chrome bez zrzutów.**

### Co mimo to zostało poprawione

Trace pokazuje, GDZIE idzie CPU, nawet jeśli nie pokazuje przyczyny zacięć.
Cztery poprawki, wszystkie zweryfikowane w silniku, nie z lektury.

**1. Bramka widoczności warstw kafli** (`world/TiledMap.gateLayersByCamera`).
`RunCull` miał **747 ms self time — największą pozycję całego profilu po
bezczynności**. Powód: Phaser culluje i rysuje każdą warstwę osobno co klatkę
po całym kadrze, a Zagaje mają **czternaście** warstw, z czego `znaki` ma
1 kafel na 10 000, `wyposazenie` 15, `buildings-detale` 78. Warstwa dostaje
prostokąt otaczający + siatkę bloków 4×4 kafla; `setVisible(false)` wypada
z `getVisibleChildren` **przed** cullingiem i rysowaniem.

⚠ **Sam prostokąt otaczający NIE wystarcza i to jest zmierzone** — przegrywa
z warstwą rozproszoną (`buildings-detale`: 78 kafli, ale prostokąt na
2656×1792 px). Średnia warstw na klatkę w Zagajach (1845 pozycji kamery):
bez bramki 14,00 · sam prostokąt 9,25 · bloki 16×16 9,21 · bloki 8×8 8,12 ·
**bloki 4×4 7,36** · ideał 6,91. Tabela stoi przy `MAPS.layerCullBlockTiles`.

Weryfikacja: **9 pozycji kamery, zrzuty z bramką kontra ze wszystkimi
warstwami widocznymi, przy zamrożonych tweenach i animacjach — 9/9
identycznych co do piksela**, przy 2–9 z 14 warstw schowanych. Zmierzony zysk
na żywym rendererze (80 pozycji × 6 klatek): **0,764 → 0,553 ms na klatkę,
−27,6%** całej sceny.

⚠ Ta asercja umie zaświecić na czerwono — pierwszy przebieg dał jedną pozycję
„różne", a kontrola (dwa zrzuty pod rząd, nic nie ruszane) pokazała, że
różnicę robiła **kołysząca się pokrzywa**, nie bramka. Stąd zamrażanie
animacji w teście.

**2. Znacznik celu: `Arc` → `Image` na pieczonej teksturze**
(`COMBAT_FEEDBACK.targetMarker`, `Assets.makeTargetMarkerTexture`).
`Arc` z obrysem idzie przez `StrokePathWebGL` i **tesseluje okrąg na ~100
odcinków w KAŻDEJ klatce, w której masz cel** — w trace `ArcWebGLRenderer`
750 ms, `StrokePathWebGL` 546 ms, `batchLine` 469 ms. Zmierzone na żywo:
**56,8 µs na pierścień na klatkę jako `Arc` kontra 10,3 µs jako `Image` —
5,5×**. To ta sama pułapka, którą `src/ui/CLAUDE.md` opisuje przy
`Graphics.slice`.

⚠ Tekstura ma bok `(promień + grubość) × 2`, nie `promień × 2` — `strokeCircle`
rysuje linię wyśrodkowaną na promieniu, więc ciaśniejsze płótno obcięłoby
połowę obrysu dookoła. Sprawdzone wycinkiem 4× (`snapshotArea`): obrys równy,
bez przycięcia i bez dziur.

**3. Bramka `this.open` w `PlayerPanel` i `ShopPanel`.** `refreshQuests`
**niszczy i buduje od zera** wszystkie karty zadań (nowe obiekty `Text` =
płótno 2D plus synchroniczna wysyłka tekstury na GPU) i wisiał na
`inventoryChanged` — czyli odpalał się przy **każdym podniesionym łupie, przy
zamkniętym panelu**. W trace: `refreshQuests` 236 ms, `Text2` 234 ms,
`updateText` 190 ms, `texImage2D` 72 ms.

⚠ **To nie było wymyślanie wzorca, tylko dokończenie go** — `TrainerPanel`,
`QuestPanel` i `TopicPanel` miały tę bramkę od dawna, i to opisaną tymi samymi
słowami. Brakowało jej w dwóch panelach.

⚠ `ShopPanel` znalazł się w tym dopiero **śladem stosu**, już po naprawie
`PlayerPanel`: pomiar „ile obiektów `Text` powstaje na 5 podniesień przy
zamkniętych panelach" pokazał 10 zamiast zera, a stos wskazał
`ShopPanel.refreshEquip → buildRepairAll → makeButton`. Po obu poprawkach:
**0**. Nie zgaduj, który panel jest winny — policz i przeczytaj stos.

⚠ **Żadnej flagi „brudne" i celowo.** Jedyną drogą do otwarcia jest
`openTo()`/`show()`, które ustawiają `open = true` PRZED odświeżeniem, więc
otwarcie zawsze maluje z żywego stanu. Sprawdzone: 7 sztuk mięsa i 123 złota
dodane przy zamkniętym panelu, po otwarciu ekran pokazuje „143 złota" i slot
z 17 sztukami.

⚠ **Odznaka punktu rozwoju siedzi na przycisku OTWIERAJĄCYM, poza panelem** —
jedyna rzecz z `refreshCharacter`, która musi biec także przy zamkniętym,
i dlatego jedyna przed bramką. `refreshEquipIcons` zostało **niebramkowane
świadomie**: `openTo()` go nie woła, więc bramka zgubiłaby zmianę sprzętu
zrobioną przy zamkniętym panelu.

**4. `dev.perf` przestał być najdroższą funkcją w grze.** `Perf.rysuj` miał
**404 ms self time — 1% czasu zegara i więcej niż całe `/src/` razem wzięte**,
przy nagłówku pliku obiecującym, że „miernik ma nie wchodzić w mierzone".
Trzy przyczyny, każda ~100 razy na sekundę: kopia okna pod sortowanie, druga
tablica z `filter`, oraz **zapis do DOM** unieważniający styl całej strony
(537 × `ScheduleStyleRecalculation`, 529 × `InvalidateLayout` w tym samym
trace). Teraz: bufor sortowania alokowany raz, jedno przejście po oknie
zamiast trzech, przemalowanie co 250 ms i kolor zapisywany tylko przy zmianie.
Zmierzone: **100 klatek (1000 ms wirtualnych) → 4 zapisy do DOM zamiast 100.**

### Rzeczy, które przy okazji wyszły

⚠ **Sterowanie grą z konsoli przy schowanej karcie wymaga podania `loop.delta`
ręcznie.** `game.step(t, dt)` NIE ustawia `loop.delta` — robi to `TimeStep`,
którego się wtedy omija. Pierwszy pomiar nakładki dał „0 zapisów do DOM"
i wyglądał jak zepsuta nakładka; naprawdę `tick()` poprawnie odbijał się od
własnego zabezpieczenia `dt <= 0`. **Zanim uznasz taki wynik za błąd kodu,
sprawdź, czy to nie artefakt uprzęży.**

⚠ **Zrzut sceny renderuje się bez POST_UPDATE tylko ręcznie**
(`renderer.preRender()` plus `scene.render()` plus `renderer.postRender()`).
Przez `game.step()` bramka warstw zdąży przestawić widoczność przed
rysowaniem, więc „wzorzec bez bramki" nigdy nie byłby bez bramki.

### Stan

`npx tsc --noEmit` i `npm run build` czyste. Wszystkie uprzęże projektu
zielone: `combat_regresja.mjs` (zero różnic wobec baseline), 
`attack_resolver_weryfikacja.mjs`, `stamina_weryfikacja.mjs`, `hud_uklad.mjs`.
W silniku: `window.dev.missing` puste, `load.totalFailed` = 0.

**Nierozstrzygnięte i ważniejsze niż wszystkie cztery poprawki razem:**
czy po powtórzeniu nagrania w czystym Chrome bez zrzutów z tych 22,6% zostaje
cokolwiek. Jeśli tak — winnego trzeba szukać dalej, bo w tym trace kodu gry
w ogóle nie widać.

---

## 2026-08-23 — Pierwszy pass wydajności (i narzędzie, żeby był drugi)

Zgłoszenie: *„trochę tnie gra, możemy coś zoptymalizować?"*

⚠ **Najpierw problem z samym zgłoszeniem: „tnie" nie jest daną.** Trzy różne
przyczyny wyglądają dla gracza identycznie i wymagają trzech różnych napraw —
niskie stałe FPS (za dużo pracy w klatce), pojedyncze zacięcia po 40–100 ms
(GC albo wysyłka tekstury), oraz dławienie przeglądarki. Średnia FPS **ukrywa
tę drugą**: 58 FPS z dwudziestoma szarpnięciami czyta się jako „jest dobrze".

Dlatego pierwszą rzeczą jest `dev.perf` (`src/core/Perf.ts`): licznik w rogu,
`watch(15)` z percentylami i licznikiem zacięć, `scene()` z rozmiarem listy
wyświetlania i liczbą napisów. **Nakładka to element DOM, nie obiekt Phasera** —
napis Phasera dokładałby dokładnie tę pracę, której szukamy.

**Co znalazłem i wyciąłem** (bez profilera — audytem pętli klatkowej):

`Text.setColor` **przerysowuje płótno i wysyła teksturę na GPU ZAWSZE**, nawet
gdy kolor jest ten sam — inaczej niż `setText`, które Phaser odsiewa po
równości ciągu. Wołane bezwarunkowo w trzech miejscach: `BuffBar.update` (co
klatkę × każdy efekt), `AbilityBar.update` (co klatkę × 4) i `HUD.paintStamina`
(kilkanaście razy na sekundę przez całą regenerację). Projekt znał ten mechanizm
od drugiej strony — `installTextFiltering()` istnieje właśnie dlatego, że każde
przerysowanie napisu przywraca NEAREST.

`AbilityBar` dodatkowo tesselował wycinkę cooldownu (`slice` + `fillPath`) dla
czterech przycisków sześćdziesiąt razy na sekundę — **także gdy żaden nie
stygnął**, czyli przez większość gry.

⚠ **Własny błąd, złapany przed zostawieniem go:** kwantyzację łuku ustawiłem
najpierw na 1/120 obwodu z uzasadnieniem „i tak nie widać". Policzone w
jednostkach logicznych, nie w pikselach urządzenia — przy promieniu 38 j. i
kamerze UI 1,75× krawędź skakałaby o ~3,5 px co siedem klatek. Zysk i tak siedzi
w stanie bezczynnym, więc krok zszedł na 0,5°.

**Czego NIE ruszyłem, świadomie:** pula obiektów `Text` dla liczb obrażeń (każdy
popup to nowe płótno + wysyłka tekstury — realny kandydat na zacięcia w walce,
ale zmiana z prawdziwym ryzykiem regresji), liczba warstw kafli (Zagaje mają 16
na 100×100), sortowanie po głębokości. **Wszystkie trzy czekają na pomiar** —
optymalizowanie ich w ciemno to zgadywanie.

⚠ **Renderu znów nie sprawdziłem** (panel się nie kompozytuje: `document.hidden`,
canvas 0×0). Sprawdzone w silniku tyle, ile się dało: `dev.perf` istnieje,
`overlay()` włącza się i wyłącza, `scene()` nie rzuca.


## 2026-08-23 — Zwrot postaci wraca do drążka (Combat Feel, pass 2)

Zgłoszenie z rozgrywki: *„jeśli wilk krąży i już wcześniej z nami walczył, to
nawet podchodząc od tyłu postać go zhituje — nieważne, czy od pleców."*

Kod pokazał **trzy** niezależne auto-obracania, nie jedno. Każde miało własne,
sensowne uzasadnienie i żadne nie pytało gracza o zdanie:

1. `aimAttackAt` wołane **bezwarunkowo** przed każdym zamachem,
2. brak bramki kąta przy trafieniu — z komentarzem *„Deliberately no facing/arc
   check"*, bo pierwsze ustawienie gwarantowało,
3. `faceTarget` obracające **tarczę** na cel co klatkę.

Dwa pierwsze to jedna decyzja: drugie istniało wyłącznie dlatego, że pierwsze
je gwarantowało.

⚠ Trzecie łamało regułę zapisaną w dokumentacji **własnego gettera** i w
`SHIELD.blockArcDeg`: „tarcza kryje to, co rysuje sprite". W bezruchu sprite
rysuje `moveDir`, a tarcza kryła `targetDir` — czyli config i komentarz
opisywały model, którego kod już nie realizował. Ta niespójność stała tam od
Combat v1 i nikt jej nie widział, bo objawiała się jako *ułatwienie*.

**Co weszło.** Zwrot należy do drążka. Blokada celu wybiera cel i nic więcej.
Autoatak startuje tylko w przedniej półkuli (90° półkąta = `FRONT_ARC_DEG`),
a snap na cel został — ale jako **assist wewnątrz półkuli**, nie jako obrót.
Bramka sprawdza się **przed** snapem; odwrotna kolejność unieważnia warunek.
Atak i obrona dzielą jeden predykat (`Protection.isFrontal`), więc „trafiasz to,
co mógłbyś zablokować" jest jedną funkcją, nie dwiema kopiami.

Cel za plecami zostaje zaznaczony i **czeka** — autoatak wystrzeli sam w klatce,
w której gracz się odwróci. Naciśnięcie mówi „Odwróć się"; cisza byłaby tu
gorsza niż przy „Za daleko", bo wróg stoi w zasięgu i wszystko wygląda poprawnie.

⚠ Zaworem zwarcia jest `attackFacingBypassGapPx` = **0 px** (ciała fizycznie na
sobie), **nie** `pointBlankRadius` = 28 px. Ten drugi odtworzyłby atak 360° w
zwarciu — a zwarcie jest w tej walce stanem normalnym, nie awarią.

**Mięsistość.** Trzy pokrętła tierów były zapisane w configu i **martwe**:
`flashMs` istniał, a `flashHit` czytał stały `hitFlashMs`; skok skali był na
sztywno 1,12. Draśnięcie królika i cios niedźwiedzia różniły się więc wyłącznie
dźwiękiem. Teraz ciężar mówią trzy kanały, a przy `heavy` czwarty (kamera).
Rotacji sprite'a **nie** dodałem, mimo że była dozwolona — obrót pixel-artu o
kilka stopni rozmywa teksturę, a skok skali daje ten sam sygnał bez tej ceny.

**Świst** grał `swing`, czyli **ten sam plik co własny zamach gracza**. Dostał
rozstrojenie w dół. Przy okazji: przepustnica `minRetriggerMs` jest per plik,
więc chybiony cios wroga w ciągu 40 ms od zamachu gracza **przepadał bez śladu**
— dokładnie w najgęstszej chwili walki, dla której ten sygnał powstał.

**Znalezione przy okazji:** `flashHit` liczył skok skali od wartości w połowie
poprzedniego tweena, więc dwa trafienia w 120 ms zostawiały sprite trwale za
dużym. Przy watasze to norma, nie przypadek brzegowy.

**Dwie nowe bramki, obie pokazane na czerwono przed przyjęciem:** §K (wynik
`Player.takeDamage()` nigdy jako boolean — na wstrzykniętym historycznym błędzie
jadu) i §L (przednia półkula: stała, predykat i zawór, trzy osobne gałęzie).
Pierwsza wersja §K dała dwa **fałszywe** alarmy, bo zmienna nazywa się `w`,
a polskie komentarze są pełne słowa „w" — strażnik świecący na czerwono na
poprawnym kodzie zostaje wyciszony, więc reguła ustąpiła jawnej liście pułapek.

⚠ **Renderu NIE sprawdziłem w tej sesji.** Panel podglądu się nie kompozytuje
(`document.hidden`, canvas 0×0, `Framebuffer: Incomplete Attachment`), więc
Phaser nie wystartował scen. Bramka geometrii została policzona headless
z prawdziwych modułów. To jest ograniczenie środowiska, nie wynik.

Poza zakresem świadomie: turn-in-place, target leash, rebalans, AI wilka,
recoil/knockback, hit-stop na `physics.world`, przepięcie Combat v1 na `cuesFor`.


## 2026-08-22 — Combat v2: audyt, Faza 0 (pomiar) i Faza 1A (refaktor bez zmiany zachowania)

Zaczęło się od zgłoszenia „przeciwnik wchodzi sprite'em w gracza". Analiza
pokazała, że to **nie jest usterka wizualna**: dla czterech z siedmiu gatunków
`overlap` ciał JEST warunkiem trafienia (wilk, dzik, niedźwiedź, królik), więc
czytelności nie da się poprawić bez ruszenia sposobu rozstrzygania ataku. Stąd
`docs/combat_v2_audyt.md` — pełny audyt + plan migracji, po dwóch rundach
recenzji z drugim modelem.

**Główny wniosek audytu:** Combat v2 to w ~60% wyciągnięcie kodu, który już
działa. Hit Resolver, Damage Resolver, Attack Resolver i maszyna
windup/active/recovery **już istnieją** — tylko po jednej stronie walki i pod
innymi nazwami.

### Faza 0 obaliła dwa moje własne założenia

`tools/combat_geometry.mjs` (alpha bbox każdej klatki każdego arkusza):

- **Twierdziłem, że fantomowy dystans pionowy to „~12 px i 40% progu".**
  W podejściu poziomym siedzi pod pierwiastkiem i wynosi 0,4 px przy progu 96 —
  czyli byłby nieistotny. **Ale w pionie nie siedzi pod pierwiastkiem**:
  skoczek atakuje z góry z 74,8 px, a z dołu z 41,3 px. **58% rozjazdu na tym
  samym progu.** Tego nikt nie przewidział.
- **Twierdziłem, że niedźwiedź straci ~36 px zasięgu.** Faktycznie −11,5 px, a
  pająki wręcz ZYSKUJĄ (+3,2). Porównałem `allowance` z zerem zamiast z
  proponowanym promieniem.

Otwarty dług: niedźwiedź ma arkusz jednokierunkowy, więc głębokości nie da się
z niego zmierzyć w ogóle. Narzędzie podaje widełki z proporcji innych
czworonogów (~31 px) i **nazywa to inferencją, nie pomiarem**.

### Faza 1A: refaktor przy IDENTYCZNYM zachowaniu

Powstały `core/CombatGeometry.ts`, `core/HitResolver.ts`, `core/DamageResolver.ts`
+ `combatOrigin` na `Player`/`Enemy`. `GameScene` nie ma już własnej geometrii,
`Player.takeDamage` nie ma już własnego łańcucha obrony. `Protection.ts` przy
okazji stracił import Phasera.

**Bramką jest `tools/combat_regresja.mjs` — 111 zamrożonych przypadków**, ziarno
stałe i `Defense.reset()` per przypadek (PRD pamięta serię, więc bez tego N-ty
test zależałby od poprzednich). `--nowy` puszcza to samo przez prawdziwe moduły.

### Trzy rzeczy warte zapamiętania

1. **`Math.hypot(dx,dy)` ≠ `Math.sqrt(dx²+dy²)` — w 38% losowych par.**
   `Phaser.Math.Distance.Between` używa drugiej formy. Podobnie `RadToDeg`
   mnoży przez prekomputowaną stałą, a nie dzieli.
2. **Przemyciłem zmianę zachowania do fazy, która ma nic nie zmieniać.**
   Przepisałem test łuku z cosinusów na stopnie „przy okazji naprawiając"
   uśpioną pułapkę `cos(90°)`. Równoważne matematycznie, nie bitowo. Cofnięte.
3. **Pierwsza wersja strażnika czystości resolverów była DEKORACJĄ.** Świecił
   na zielono mimo wstrzykniętego `Sfx.play` — w pliku wylądował znak 0x08
   zamiast dwuznaku ``. Złapane wyłącznie dlatego, że sprawdziłem, czy
   asercja **potrafi paść**. To jest ta reguła z `tools/CLAUDE.md` w akcji,
   trzeci raz w tym projekcie.

### Potwierdzenie

`tsc` 0, `build` 0, regresja 0 (także `--nowy`), **i rozgrywka: „walka wygląda
bez zmian"** — czyli dokładnie to, co 1A miało dowieźć.

Następny krok to **1B**, czyli pierwsza faza, w której walka zacznie się
naprawdę zmieniać na ekranie. Nie ruszona.

---

## 2026-08-25 — audyt XP economy: quest XP vs mob farming XP, BEZ ZMIAN

Po serii audytów fundamentów (Combat V1, Weapon V1, Armor V1, Equipment/
Itemization V1 — wszystkie PASS) autor chciał skorygować jeden element
Character Progression: żeby questing był główną ścieżką XP, a farmienie
respawnów dodatkiem. Zanim padła jakakolwiek liczba w configu, zmierzono
**dwa realne pytania zamiast zgadywać procent redukcji**:

1. **Ile XP daje jedno pełne przejście dostępnego contentu?** Nagrody questowe:
   **850 XP** (suma z 15 questów). Cały pool mobów lasu+gęstwini: **~1175 XP**
   (liczba znana już wcześniej, `odlozone.md` §1). Razem: **2025 XP**.
2. **Ile z tego pool'a mobów jest WYMAGANE wprost przez cele questów** (kill
   bezpośredni + oczekiwana liczba zabić dla collect-objectives, liczona z
   realnych szans dropu w `LOOT`)? **~1185 XP — praktycznie CAŁY pool, nie
   jego część.** Trzy questy z RNG-owym collect (`rabbit_hunt`, `scraps_bounty`,
   `skora_na_pasy`) i trzy z bezpośrednim „zabij N" (`zajace_w_zbozu`,
   `wolf_pack_cull`, `droga_na_wschod`, `grey_wolf_revenge`) razem proszą o
   więcej zabić królika, niż realnie stoi ich w jednym przejściu mapy.

### Wniosek, który zamknął temat bez zmiany configu

**Przy dzisiejszej wielkości vertical slice „XP questowe" i „XP z farmienia"
nie są dwoma częściowo nakładającymi się źródłami — to w praktyce ten sam
zbiór.** Płaska redukcja mob XP (rozważany kandydat: `-55%`) obniżyłaby więc
RÓWNOCZEŚNIE nagrodę za zwykłe wykonywanie questów (850 + 1185×0,45 ≈ **1383**
zamiast 2035) — bo questy dziś PŁACĄ przez zabijanie, nie obok niego.
„Opcjonalne farmienie ponad potrzeby questów", czyli dokładnie to, co miała
ograniczyć redukcja, **przy obecnej zawartości praktycznie nie istnieje jako
osobna kategoria.**

**Decyzja: NIE zmieniamy XP za moby, XP za questy, krzywej XP, +1 punktu
atrybutu/poziom ani `maxLevel`.** Character Progression zamknięte jako
**PASS — bez zmian**, ze świadomym stanem tymczasowym zapisanym w
`docs/odlozone.md` §1 (wiersz „Krzywa XP") — wraca to, gdy pojawi się
wystarczająco dużo contentu, żeby „zabicie wymagane przez quest" i
„zabicie ponad potrzebę questu" realnie się rozjechały.

⚠ **Poprawka w trakcie sesji**: pierwsza wersja obliczenia „ścieżki questowej
po redukcji" dała błędne ~1218 zamiast poprawnych ~1383 — złapane i
skorygowane w tej samej rozmowie, nie po fakcie.

---

## 2026-08-24 — Attack Resolver (Dodge/Parry/Block/Impact), Combat v1: WDROŻONE

Wielosesyjny cykl projektowy (audyt combat-loopu → korekty filozofii MMORPG-
zamiast-action → symulacje A/B/C dla RNG uniku/parry → pełna kalibracja na
realnych danych rosteru → naprawa krzywej losowości → implementacja) zamknięty
jako **Combat v1**. Zero otwartych pytań filozoficznych — tylko trzy nazwane
ryzyka kalibracyjne, patrz niżej.

### Kierunek: obrona jako część rozstrzygania ataku, nie przyciski

Dodge/Parry/Block **nie są inputem**. Rozstrzygają się automatycznie w
`Player.takeDamage`, w kolejności: geometria (bez zmian, deterministyczna) →
Dodge (wszechkierunkowy) → Parry (frontalny, tylko broń z tożsamością rodziny
"parry" — dziś miecz) → Block (frontalny, deterministyczny, bez zmian) →
pancerz → obrażenia → impact. Aktywne przyciski zostają wyłącznie dla
umiejętności i Dasza (mobilność) — Dodge ≠ Dash, świadomie rozdzielone.

### Co weszło

- **`src/core/Defense.ts`** (nowy) — PRD ("Pseudo Random Distribution", technika
  Dota 2/Warcraft 3 "bad luck protection"). Dodge i Parry mają OSOBNE liczniki
  progresji (autor świadomie odrzucił wspólny "Defense Momentum" jako sztuczny).
- **`DEFENSE`** w `GameConfig.ts` — baseline rzadki z założenia: Dodge 4% bazowo
  (+0,4pp/DEX, ×1,3 tylko dla lekkiego obciążenia), Parry 5% rdzeń × (1+0,15)
  na mieczu = 5,75%, zero na reszcie rodzin broni.
- **`Progression.dodgeChance`/`.parryChance`** — konsumują wreszcie
  `familyParryBonus`, które od 2026-08-15 było udokumentowanym future hookiem
  bez czytelnika.
- **`Protection.isFrontal`** — wydzielone z `blockFraction` (ta sama arytmetyka,
  zero zmian w liczbach), teraz współdzielone przez Block i Parry.
- **`Stamina.impactTier`** — lekki/średni/ciężki z TEJ SAMEJ krzywej co
  `hitCost`, zero nowego statu poise. Ciężki (sufit krzywej) kasuje
  `pendingSwing` przez nowe zdarzenie `EVENT.playerHeavyHit`.
- **`Player.guardDir`** — naprawiona niezgodność z modelem „stój w zasięgu i
  walcz": poza oknem zamachu, przy zalockowanym celu i bezruchu, kryje
  KIERUNEK DO CELU (`faceTarget`, odświeżane co klatkę przez `GameScene.
  updateGuardFacing`), nie zamrożony `moveDir` sprzed ostatniego kroku.

### ⚠ Blocker znaleziony i naprawiony PRZED wdrożeniem: krzywa PRD

Pierwsza wersja licznika progresji (eskalacja liniowa `p×(1+streak)`) **nie
zachowywała `p` jako długoterminowej średniej** — przy niskim, rzadkim
baseline (2–8%) realna średnia odjeżdżała 3–6× w górę (zmierzone: nominalne 3%
dawało realnie ~15–18%). Naprawione właściwym PRD: `C` kalibrowane binary-
searchem tak, żeby oczekiwana liczba prób między sukcesami = `1/p`. Zweryfikowane
na REALNYM kodzie (nie modelu): p=2/4/8/15% → zrealizowane 1,98/3,98/8,00/14,99%.

⚠ **Efekt uboczny, świadomie zaakceptowany, nie naprawiony**: przy rzadkim
baseline poprawa P(0 uników) w oknie 2–5 ciosów jest SŁABA — to jest
matematyczna konsekwencja niskiego p (okno gwarancji ~1/p² nie mieści się w
krótkiej walce), nie wada implementacji. Przewaga nad zwykłym rzutem ujawnia
się w skali sesji (10-20+ starć), spójnie z tym, jak stamina jest projektowana
na skalę wyprawy, nie pojedynczej walki.

### Weryfikacja

⚠ **Panel przeglądarki miał w tej sesji realne ograniczenie** —
`document.hidden === true` (zakładka bez focusu), pierwsze uruchomienie dało
`Framebuffer status: Incomplete Attachment` z WebGL, sceny Phasera nie
startowały same z siebie (ręczne `scene.start('Boot')` pomogło ominąć, ale
render nigdy nie został obejrzany na oko przez cały pobyt w tej sesji) —
**to jest odstępstwo od reguły numer jeden `tools/CLAUDE.md`, nazwane, nie
przeoczone**, tak jak przy wdrożeniu staminy 2026-08-21. Zamiast tego:
1. `npx tsc --noEmit` i `npm run build` czyste.
2. Prawdziwe moduły (`Defense`, `Progression`, `Stamina`, `Protection`)
   uruchomione przez `import()` z konsoli deweloperskiej na żywym grafie
   modułów Vite (nie esbuild-owa kopia) — zero wyjątków, liczby zgodne co do
   cyfry z arytmetyką configu (np. `dodgeChance` przy DEX 15 = 0,13 =
   (0,04+15×0,004)×1,3, dokładnie).
3. `tools/attack_resolver_weryfikacja.mjs` (nowy, wzorem
   `stamina_weryfikacja.mjs`) — trwały regression-guard, wszystkie asercje
   zielone.

### Świadomie NIE zrobione teraz

Player stagger (prawdziwy, poza kasowaniem `pendingSwing`), defensywny
Interrupt, fazy bossów, ranged/caster, talenty Dodge/Parry, nowe systemy MMO —
wszystko odłożone jawnie, nie przeoczone.

---

## 2026-08-21 — stamina, cztery atrybuty i obciążenie: WDROŻONE

Po review gate („czy jest bloker? jeśli nie — implementuj") poszła pierwsza
grywalna wersja systemu wysiłku. **Blokera nie było**; dwie rzeczy wymagały
decyzji przy wdrożeniu i obie są opisane niżej.

### Co weszło

Nowy singleton `src/core/Stamina.ts` + bloki `STAMINA` i `EQUIPMENT_LOAD`
w configu. Konsumenci: autoatak (1), unik (15 × obciążenie), umiejętności
(10–15), blok (3–5, **za faktycznie zablokowany cios**, koszt należy do
tarczy), sprint (10/s × obciążenie, Shift albo wypchnięta gałka), przyjęty
cios (krzywa 0–12). Pasek wysiłku w HUD, dwa nowe wiersze w panelu postaci.

**Kondycja rozpadła się na dwa atrybuty:** Witalność (HP) i Kondycję (stamina).
⚠ Stare zapisy czytają się bez straty — `endurance` mapuje się na Witalność,
Kondycja startuje pusta, `SAVE_VERSION` **nie** ruszony (niezmiennik z
`CLAUDE.md`: pole addytywne nie jest zmianą kształtu).

### Dwie decyzje, których specyfikacja nie przesądzała

1. ⚠ **Stan „Zmęczony" NIE rusza tempa ataku, tylko odzyskanie.** Specyfikacja
   zakazywała spirali „wolniej atakuję → dłuższa walka → więcej ciosów →
   więcej zmęczenia" i jednocześnie proponowała karę do tempa. Tempo ataku
   jest jedyną karą, która tę spiralę domyka (zmierzone poprzedniego dnia:
   17 bloków na przejściu przy wyczerpaniu wobec 8 bez niego), więc dostał ją
   wyłącznie „Wyczerpany". To jest sprzeczność w samej specyfikacji,
   rozstrzygnięta na korzyść zakazu spirali.
2. ⚠ **Sprint wymaga staminy > 0 — jedyna twarda bramka w całym systemie.**
   Reguła brzmi „zero nie blokuje działań PODSTAWOWYCH", a podstawowe jest
   chodzenie, nie bieganie.

### Weryfikacja

⚠ **Panel przeglądarki był zamknięty przez całą sesję**, więc canvas miał
0×0 px, żadna scena nie wystartowała i **render nie został obejrzany** —
łamie to regułę numer jeden z `tools/CLAUDE.md` i jest jedyną rzeczą, której
w tym wdrożeniu nie sprawdzono. Zamiast tego powstał
`tools/stamina_weryfikacja.mjs`, który **uruchamia prawdziwy `Stamina.ts`**
(esbuild + atrapa `EventBus`, bo ten ciągnie Phasera) i sprawdza dziewięć
grup asercji na prawdziwym configu: pulę z Kondycji, bezwzględność progów,
niezmiennik „`spend` nigdy nie odmawia", ciągłość regeneracji, brak urwiska
w koszcie przyjętego ciosu, klasy obciążenia realnych kompletów, koszt bloku
per tarcza i to, że **ukorzenienie nie przekracza cyklu ataku w żadnym
stanie** (młot wyczerpany: 416 ms roota w cyklu 813 ms).

Asercje sprawdzone na CZERWONO przez celowe zepsucie configu (`recoveryMul`
9,9 i waga stalowego napierśnika 12 → 1 kg): 5 asercji zapaliło się, kod
wyjścia 1. `tsc --noEmit` i `npm run build` czyste.

### Do playtestu

Stosunek kosztów (unik 15 : umiejętność 10–15 : blok 3–5), **cooldown uniku
został na 6 s i nie był ruszany** (zmiana timingu walki „przy okazji" jest
zakazana przez samą specyfikację, więc koszt uniku znaczy dziś mniej, niż
zakładał model), próg sprintu na gałce (0,92) i wagi przedmiotów. Lista:
`docs/stamina_model.md` §9.4.

---

## 2026-08-20 (szósty wpis) — stamina: iteracja 2 pomiarów po decyzjach autora

Odpowiedź na pakiet `stamina_ocena.md` przyszła jako **dziesięć rozstrzygnięć
kierunkowych** (stamina = wysiłek, nie druga mana; wyczerpanie nigdy nie blokuje
akcji; progi bezwzględne; CON = utrzymywanie wysiłku) plus pięć pytań „co zbadać
w następnej iteracji". Ta sesja policzyła te pięć pytań.

**Nowe:** `tools/stamina_model.mjs` (przymiar, nic nie zapisuje) i
`docs/stamina_model.md` (aktualny model — `stamina_ocena.md` schodzi do roli
historii, wpis w `docs/README.md` przepisany).

### Trzy wyniki, których nikt nie szukał

1. ⚠ **Opóźnienie regeneracji (5 s z propozycji) jest DŁUŻSZE niż odstęp między
   walkami na mapie (3,1 s).** Odstęp policzony z `forrest.tmj`: trasa zachłanna
   przez 19 spawnów to 8318 px, czyli 462 px między walkami. Konsekwencja:
   podczas przejścia lasu regeneracja **nie startuje ani razu**, a potrojenie jej
   TEMPA nie zmienia niczego. To była jedna liczba przepisana z reguły 5 sekund
   dla HP — mechaniki o odwrotnym celu.
2. ⚠ **Zasób o stałym drenażu i stałej regeneracji nie ma stanu pośredniego** —
   saturuje na pełnym albo na zerze (styl aktywny: 84% → 3% czasu wyczerpania
   między regeneracją 5/s a 10/s). Stan pośredni tworzy wyłącznie czas
   opróżniania bufora, czyli **horyzont = pula ÷ deficyt**. To odwróciło wniosek,
   z którym siadaliśmy do pomiaru („pula to tylko bufor"), i broni kształtu CON
   z propozycji autora.
3. ⚠ **Sprint jest wyłącznikiem regeneracji, nie kosztem ciągłym.** Przy „sprint
   = wysiłek" nawet stawka ZERO zostawia gracza wyczerpanym. Dotyczy każdej
   przyszłej czynności ciągłej, w tym trzymania tarczy.

### Metoda: symulacja krokowa zamiast per-walka

`stamina_horyzont.mjs` liczył stan raz na walkę i przez to **świecił zielono**
tam, gdzie gracz siedzi na zerze pół wyprawy („Wyczerpany po: —" przy stanie
25/120 po każdej walce). Nowy przymiar chodzi krokiem 50 ms.

⚠ **Asercja silnika najpierw była dekoracją** — porównywała symulację z tym
samym `profilBroni`, z którego symulacja korzysta, więc celowe przeskalowanie
cyklu o 20% zostawiało raport zielony. Poprawiona wersja odtwarza oczekiwaną
wartość niezależną ścieżką z `ITEMS`/`ATTRIBUTES`. Wszystkie trzy
samosprawdzenia sprawdzone na czerwono.

⚠ **Filtr spawnów po `o.type` zwracał ZERO** — tożsamość obiektu w tych mapach
siedzi w `name`, a `type` jest pustym stringiem we wszystkich obiektach
`forrest.tmj`. Wyszło tylko dlatego, że obok stała asercja na liczbę spawnów.

### Rekomendacja (do decyzji autora)

Regeneracja **4/s ciągła** zamiast 5/s po 5 s bez wysiłku — jedyna kombinacja
ze 126 przebadanych, która rozdziela cztery style gry na cztery różne horyzonty.
Reszta liczb bez zmian. Otwarte zostają: stawka uniku wobec skilla, próg
ciężkiego ciosu (stoi na urwisku przy kontakcie Szarego), cooldown uniku
i to, czy sprint w ogóle wchodzi teraz.

---

## 2026-08-20 (piąty wpis) — cięcie: `CLAUDE.md` 334 KB → 14,6 KB

Wykonanie planu z wpisu o audycie, po potwierdzeniu mechanizmu we wpisie niżej.

### Wynik

| | przed | po |
|---|---|---|
| zawsze ładowane (`CLAUDE.md`) | **333 656 B** (~84k tokenów) | **14 617 B** (~3,7k) |
| ładowane warunkowo, per katalog | 0 | 44 KB w 5 zagnieżdżonych plikach |
| referencja w `docs/` | — | 333 KB, przeniesione bez zmian |

**Nic nie zostało skasowane — to przeniesienie.** Sprawdzone maszynowo:
każda niepusta linia starego pliku została odnaleziona w nowym zestawie, poza
**49**, i wszystkie 49 to nagłówki sekcji, nieaktualne zdanie wstępu oraz
sekcja „Gdzie mieszka dokumentacja", którą router świadomie zastąpił.

### Co gdzie poszło

- `## Implemented checklist` (235 KB, 86 pozycji) → **`docs/zaimplementowane.md`**
- `## Maps (Tiled)` (43 KB) → **`docs/mapy.md`**
- `## Assets` (18 KB) → **`docs/assety.md`**
- `## Architecture` (13 KB) → **`docs/architektura.md`**
- wielki akapit opisujący `docs/` (14 KB, **jedna linia w źródle**) →
  **`docs/archiwum/`**, bo `docs/README.md` sam nazywa go rzeczą, którą
  zastępuje („jest w nim wszystko, ale nie da się z niego **wybrać**").
  Trzymanie dwóch routerów naraz to dokładnie ta duplikacja semantyczna,
  którą audyt zmierzył jako niewidoczną dla diffa.

W korzeniu zostało to, co potrzebne ZAWSZE: ramka kalibracyjna (autor gra na
bieżąco, faza projektu, grafika wioski), router, polecenia i zrzuty,
architektura w skrócie, **niezmienniki przecinające katalogi**, skrócony spis
„co już jest" pogrupowany tematycznie + lista ⏳, konwencje pracy. Ramka,
polecenia i konwencje wstawione **dosłownie** ze starego pliku, nie przepisane
z pamięci.

### ⚠ Dwie nieaktualności naprawione przy okazji — i to jest argument za cięciem

Obie były w pliku od dawna i obie wyszły dopiero wtedy, gdy trzeba było napisać
jedno zdanie zamiast przewijać 1330 linii:

1. **Wstęp mówił „Capacitor/Android wrapping is future work — don't build for
   it yet"**, podczas gdy checklista 500 linii niżej opisuje działający projekt
   `android/` i zbudowane APK. Sprzeczność wewnątrz jednego pliku.
2. **„sześć przeciwników"** — jest ich **siedem** (niedźwiedź doszedł
   2026-08-14). Ta sama pomyłka, którą ten plik wytykał `AGENTS.md`.

To jest 13. i 14. miejsce, gdzie ten plik prostował sam siebie. Przy 334 KB
rosnących o 23 KB dziennie spójności nie da się utrzymać — o to szło.

### Czego NIE zrobiono

Nie ruszano kodu. Nie scalano `docs/assety.md` z `public/assets/README.md`
(dwa opisy tych samych pikseli, świadomie zostawione z adnotacją, który wygrywa
przy sprzeczności) — to osobne zadanie. Kopia sprzed cięcia leży w scratchpadzie
sesji, ale **prawdziwym zabezpieczeniem jest git**: wszystko powyżej jest
niezacommitowane.

---

## 2026-08-20 (czwarty wpis) — rozstrzygnięcie testu: zagnieżdżone `CLAUDE.md` DZIAŁAJĄ, ale tylko na narzędziach plikowych

Domknięcie testu zaplanowanego we wpisie niżej. Nowa sesja, autor zadał
dokładnie pytanie kontrolne: „co mówi reguła o `stageIndex` i
`grantedStages`?".

### Wynik: ✅ mechanizm działa

Zaraz po `Read` na `src/core/Quests.ts` harness **sam** wstrzyknął
system-reminder z pełną treścią `src/core/CLAUDE.md`. Nie było potrzeby
otwierania go niczym.

⚠ **Kryterium z poprzedniego wpisu okazało się gorsze niż to, którego użyto —
i warto wiedzieć dlaczego.** Tamto brzmiało „czy odpowiedź pada bez czytania
pliku narzędziem", czyli mierzyło WIEDZĘ modelu, a ta jest skażona wszystkim,
co sesja zdążyła wcześniej wygrepować (i była: pierwszą reakcją na pytanie był
`grep`, więc treść siedziała już w rozmowie — znowu fałszywy pozytyw, tym
razem z innego powodu niż za pierwszym razem). Rozstrzygające jest zdarzenie
po stronie harnessu: **czy pojawia się wstrzyknięcie**. To widać albo nie
widać niezależnie od tego, co model już wie, więc test przechodzi nawet w
„skażonej" sesji.

### ⚠ Warunek, którego procedura nie przewidziała: to NIE jest „praca w katalogu"

Wyzwalaczem są **dedykowane narzędzia plikowe**, nie sam fakt operowania na
plikach z tego katalogu. Trzy obserwacje z jednej sesji:

| co zrobiono | wstrzyknięcie |
|---|---|
| start sesji (cwd = korzeń repo) | ✗ |
| `grep` + `sed -n` przez Bash — **w tym odczyt samego `src/core/CLAUDE.md`** | ✗ |
| `Read` na `src/core/Quests.ts` | ✓ |

**To jest pułapka operacyjna, nie ciekawostka.** Sesja pracująca bashem
(`cat`/`sed`/`grep`) może przeorać cały `src/core/` i nie zobaczyć stamtąd ani
jednej reguły. Objaw jest identyczny jak przy niedziałającym mechanizmie:
cicho, bez błędu, bez śladu w diffie. Tryby, w których Claude Code preferuje
Bash zamiast `Read`, istnieją i bywają domyślne.

### Konsekwencja dla planu podziału

Idzie gałąź **„działa"**: powstają `src/entities/`, `src/ui/`, `src/world/` +
`tools/`, a odpowiadające sekcje znikają z głównego `CLAUDE.md`. Z **jedną
poprawką do planu**, wymuszoną tabelką wyżej:

⚠ **Przenosząc treść, zostaw w korzeniu wskaźnik** — jeden wiersz na katalog,
w rodzaju „reguły `src/core/` są w `src/core/CLAUDE.md`; otwórz go, jeśli
czytasz ten katalog bashem". Bez tego oszczędność 337 KB → ~25 KB kupuje sobie
klasę cichych pominięć, i to akurat w plikach, które ten projekt trzyma
najostrzej. Wskaźnik kosztuje ~4 wiersze i jest ceną tej oszczędności, a nie
ozdobą.

Samo cięcie sekcji z `CLAUDE.md` **nie zostało zrobione w tej sesji** — to
osobna, ryzykowna przeprowadzka i należy jej się własne wejście, nie doklejka
do testu.

---

## 2026-08-20 (trzeci wpis) — audyt kontekstu: co się ładuje w każdej sesji

Autor poprosił o audyt pamięci projektu pod kątem zużycia tokenów: „powoli
gromadzimy jej coraz więcej… finalnie jedno zapytanie może przepalić wszystkie
tokeny za rok".

### Co zmierzono (liczby, nie szacunki)

- **`CLAUDE.md` = 337 KB ≈ 84k tokenów, ładowane w całości ZAWSZE.**
  `## Implemented checklist` to **71,3%** tego (235 KB, 86 pozycji, **77 ✅**).
  Czyli większość zawsze-obecnego kontekstu to historia, nie instrukcja.
- **Krzywa z gita:** 150 KB (11.08) → 337 KB (20.08). **+124% w 9 dni,
  monotonicznie, plik nigdy nie zmalał.** ~5-6k tokenów/dobę doliczanych do
  każdej przyszłej sesji.
- **13 miejsc, gdzie `CLAUDE.md` prostuje SAM SIEBIE** („this file said
  otherwise", „SUPERSEDED", „was FALSE"). To konsekwencja rozmiaru, nie
  niedbałości — pliku rosnącego o 23 KB dziennie nie da się utrzymać spójnym.
- **Duplikacja jest SEMANTYCZNA, nie tekstowa**: wspólnych 8-gramów między
  `CLAUDE.md` a `swiat.md`/`wioska_plan.md`/`odlozone.md` = **0-1**. Nikt nie
  kopiował — dwa pliki streszczają to samo własnymi słowami i dlatego
  rozjeżdżają się niezależnie. **Gorszy rodzaj duplikacji niż kopia, bo diff
  go nie widzi.**
- `docs/` jest **zdrowy**. `docs/README.md` to już poprawny router (kolumna
  „otwórz, zanim…"); duże analizy są prawidłowo warunkowe. Nie przebudowywać.

### Co zrobiono od razu (zero ryzyka dla kodu)

1. **`AGENTS.md`: 172 KB → 1,3 KB.** Był pełną kopią `CLAUDE.md`, zamrożoną
   2026-08-12 i przez 8 dni rozjeżdżającą się z rzeczywistością: `5 equip
   slots` przy dziesięciu, `The five:` przeciwników przy sześciu, zero wiedzy
   o kolczudze/`worn_wraps`/`QuestStage`/`WEAPON_FAMILY`, wskaźnik na
   nieistniejący `.Codex/`. Teraz jest **wskaźnikiem na `CLAUDE.md`**; stara
   treść w `docs/archiwum/AGENTS-2026-08-12-STARY.md` z nagłówkiem ⛔.
2. **Naprawiony błędny opis w `docs/README.md`**: `jakosc_wykonania_ocena.md`
   był tam opisany jako „odpowiedź recenzenta" — **nie jest**, to pakiet
   WYSŁANY na zewnątrz, kończący się 7 pytaniami, bez ani jednej odpowiedzi.
   Werdykt żyje w nagłówku `jakosc_wykonania.md`. Wyszło przy zwykłym pytaniu
   autora „czym się różnią te dwa pliki" — czyli dokładnie ten dryf, który ten
   audyt opisuje, złapany na żywo.
3. **Dopisany `QUEST_01_WSTEP_DO_MYSLIWEGO.md` do indeksu** (dołożyłem go dwa
   wpisy wcześniej i sam wpadłem w lukę, przed którą ten indeks ostrzega).
4. **Konsolidacja pamięci Claude**: 33 KB/14 plików → 22 KB/12 plików. Dwa
   wpisy same oznaczały się jako NIEAKTUALNE; wpis o jakości wykonania (9,8 KB
   narracji o systemie zamkniętym 2026-08-12) zwinięty do 2,3 KB **samych
   barier**. Dodana reguła wstępu do pamięci: trzymamy wyłącznie to, czego
   repo nie może wiedzieć.

### ✅ Test ROZSTRZYGNIĘTY — `src/core/CLAUDE.md`

> ⚠ **Wynik: mechanizm działa, ale wyzwalają go tylko dedykowane narzędzia
> plikowe (`Read`), nie odczyty bashem. Pełne rozstrzygnięcie i poprawka do
> planu — czwarty wpis z 2026-08-20, na górze pliku.** Poniższa treść to zapis
> tego, jak test zaplanowano; kryterium, które w niej stoi („czy odpowiedź
> pada bez czytania pliku"), okazało się gorsze od użytego ostatecznie.

Powstał **prawdziwy** plik z niezmiennikami rdzenia (singletony, re-entrancy
zdarzeń, `Quests`/etapy, `Inventory`/`Equipment`, `Save`, `Protection`,
`Interactables`). Sprawdza, czy Claude Code **dociąga zagnieżdżone
`CLAUDE.md`** przy pracy w danym katalogu.

**Jak zweryfikować — i dlaczego MUSI to być inna sesja.** Autor zadał pytanie
testowe od razu, tego samego dnia, i **test był nieważny**: plik powstał w tej
samej rozmowie, więc jego treść siedziała w historii niezależnie od tego, czy
mechanizm działa. Poprawna odpowiedź niczego by nie dowiodła — fałszywy
pozytyw wbudowany w procedurę.

Ważny test: **`/clear` albo nowa rozmowa** (nikt wtedy nie widział tego pliku),
potem zadanie dotykające `src/core/` i pytanie wprost, np. „co mówi reguła o
`stageIndex` i `grantedStages`?". Jeśli odpowiedź pada **bez czytania pliku
narzędziem** — mechanizm działa. Jeśli trzeba go otworzyć — nie działa.

- **Działa** → powstają `src/entities/`, `src/ui/`, `src/world/` + `tools/`, a
  odpowiadające sekcje **znikają** z głównego `CLAUDE.md`. Cel: ~337 KB → ~25 KB
  zawsze-ładowane.
- **Nie działa** → treść wraca do korzenia, a routing idzie przez
  `docs/README.md` (dyscyplina zamiast mechanizmu).

Do czasu rozstrzygnięcia **nic nie zostało usunięte z `CLAUDE.md`** — nowy plik
jest na razie nadmiarowy, i tak ma być. Kolejność jest celowa: najpierw
dodać, potwierdzić, dopiero potem ciąć.

---

## 2026-08-20 (drugi wpis, wieczorem) — `Quest.stages` + quest-specific greetings

Kontynuacja poprzedniego wpisu z dziś. Po pierwszej, płaskiej wersji rozszerzenia
`stick_in_hand` user (przez "gpt") poprosił o diagnostykę całego cyklu życia
questa/dialogów z pytaniem wprost: czy obecna architektura wystarcza na
zaplanowane wieloetapowe łańcuchy NPC (Dobiesław→Dobek→Miłosz→Radzim→Sobek), czy
trzeba dobudować `stages`/`optional objectives`/`quest-specific greetings`.

**Diagnostyka (bez zmian w kodzie) znalazła dwie realne dziury**: `objectives`
to zbiór bez kolejności (gracz mógł dziś zrobić cele `stick_in_hand` w dowolnej
kolejności), a `pickGreeting()` liczy stan powitania PO CAŁYM zestawie zadań
NPC-a naraz, więc dwa zadania jednego NPC w tym samym stanie dzielą jeden tekst
— to jest DOKŁADNIE to, co zmusiło poprzedni wpis do obejścia (owijki
doczepione do `grant` innego zadania zamiast naturalnego mid-quest granta).
`optional objectives` uznane za NIEpotrzebne teraz — istniejący wzorzec
"osobne zadanie z `objectives: []`" (`prowiant_od_matki`) już to pokrywa
wystarczająco tanio.

**Decyzja (user, po diagnostyce): wdrożyć oba fixy RAZEM z migracją
`stick_in_hand`/`ziola_dla_babki` na nowy kształt**, w jednej sesji — żeby
system był od razu sprawdzony na prawdziwym przebiegu, nie martwy do
przetestowania później.

**Co powstało:**
- `Quests.QuestStage` — `{ id: string, objectives, onComplete?.grant }`.
  Celowo string `id`, nie indeks (żeby przestawienie kolejności w configu nie
  przestawiało cichutko zapisanego postępu) i celowo PROSTA lista, nie graf —
  diagnostyka pokazała, że planowane łańcuchy są liniowe.
- **Kompatybilność wsteczna przez `stagesOf()`**: quest bez `stages` (czyli
  wszystkie ~20 dotychczasowych) jest owijany jako jeden domyślny etap. Zero
  migracji reszty questów, zero zmiany kształtu ich zapisów.
- `objectivesOf(id)` przestał zwracać CAŁĄ listę celów questa — zwraca cele
  TYLKO bieżącego etapu. To jedna zmiana, która naprawia dziennik questów za
  darmo (QuestPanel/PlayerPanel już iterowały `objectivesOf`, nic w nich nie
  trzeba było ruszać) i automatycznie robi `reservedCount`/`isObjectiveMet`
  świadome etapów.
- Auto-awans etapu na `equipmentChanged`/`inventoryChanged`/po `recordKill`/
  `recordTalk` — pętla, bo jedno zdarzenie może domknąć więcej niż jeden etap
  naraz (np. gracz miał już potrzebne przedmioty, zanim quest w ogóle ruszył).

**⚠ Prawdziwy błąd złapany WŁASNYM headless testem, nie przez usera ani przez
`tsc`.** Pierwsza wersja pętli awansu traktowała "to już ostatni etap" jako
"nie ma czego robić" i wychodziła PRZED sprawdzeniem, czy trzeba coś wręczyć —
czyli `onComplete.grant` OSTATNIEGO etapu (owijki na `visit_patryczek`) nigdy
by się nie odpalił. Do tego, gdyby to poprawić naiwnie (samym przesunięciem
indeksu), zapis/wczytanie gry zgubiłoby informację "już wręczone" i przy
kolejnym zdarzeniu wręczyłoby drugą kopię. Złapane przez **własny, izolowany
symulator w skrypcie Node** (kopia algorytmu bez importu prawdziwego
`Quests.ts` — bundlowanie przez esbuild wymaga pełnego Phasera, który dotyka
DOM-u i nie działa w Node) — 15 asercji obejmujących normalny przebieg, pełny
plecak blokujący awans i round-trip zapisu. Naprawa: osobny `grantedStages:
Set<string>` (klucz `questId::stageId`), rozdzielony od `stageIndex` — bo to
są dwa różne pytania ("który etap śledzę" vs "który etap już wypłacił
grant"), co dokumentuje teraz komentarz przy tym polu jako ostrzeżenie na
przyszłość.

- **Quest-specific greetings**: `Quests.QuestGreetings` (opcjonalne
  `firstJob`/`working`/`turnIn`/`allDone`/`newJob` NA POZIOMIE questa),
  `pickGreeting()` w `NpcDialog.ts` przepisany z `.some()` (bool) na `.find()`
  (konkretne zwycięskie id), więc quest może teraz nadpisać tekst NPC-a,
  zamiast dzielić go z resztą jego zadań. W pełni addytywne — żaden istniejący
  quest nie definiuje `greetings`, więc zachowanie wszystkich 20 jest
  identyczne jak wcześniej.
- **Migracja treści**: `stick_in_hand` → dwa etapy (`equip_stick` →
  `visit_patryczek`), owijki Patryczka wróciły z `ziola_dla_babki.grant` do
  natywnego `onComplete.grant` na `visit_patryczek` — dokładnie tam, gdzie
  fabularnie powinny być od początku, zanim brak mid-quest grantów zmusił do
  obejścia. `ziola_dla_babki` wraca do czysto ziołowego opisu. `PATRYCZEK.
  greetings.firstJob` dostał linię o owijkach + zapowiedź "pomożesz, może
  będzie coś lepszego" (na żądanie użytkownika) — z udokumentowanym, przyjętym
  ryzykiem: zakłada, że gracz już dostał owijki, co jest prawdą w ~99%
  przebiegów (jedyny wyjątek: ktoś dotrze do Patryczka, zanim w ogóle
  zagada z Ojcem — geograficznie mało prawdopodobne, ale silnik i tak nie ma
  dziś jak tego warunku wyrazić).

`tsc --noEmit` i `npm run build` czyste po każdym kroku. Zapis: nowe pola
`questStages`/`questGrantedStages` w `Save.ts`, oba opcjonalne/addytywne, bez
podbicia `SAVE_VERSION`. ⚠ **Nie zweryfikowane zrzutem ekranu z żywej gry** —
Browser pane w tej sesji nie kompilował klatek przez cały dzień; cała ta
robota stoi na dokładnej lekturze kodu, `tsc`/`build` i własnym headless
symulatorze algorytmu, nie na obejrzeniu w silniku.

### Dopisek tego samego dnia — user ZŁAPAŁ w żywej grze drugi, poważniejszy bug

User zgłosił: „awans po zakończeniu zadania jeśli jesteśmy w oknie dialogowym
powoduje żółte tło" — czyli grał, mimo że ja sam nie mogłem zweryfikować w
silniku (patrz akapit wyżej). To był realny sygnał niekontrolowanej rekurencji,
nie usterka koloru.

> ⚠ **SPROSTOWANIE dopisane 2026-09-02 — treść poniżej zostaje bez zmian, ale
> jedno przypisanie w niej jest błędne.** Rekurencja opisana niżej była
> prawdziwa i jej naprawa (`sweeping`) obowiązuje. **Żółtego tła jednak NIE
> powodowała** — to był zamrożony `cameras.main.flash()` z awansu, odpalony na
> zapauzowanej `GameScene`. Oba objawy miały wspólny wyzwalacz i drugi został
> przypisany do pierwszego. Pełny rozbiór i naprawa: wpis **2026-09-02 (2)**
> na górze pliku.

**Mechanizm**: `advanceStages` woła `Inventory.addItem(...)` dla `onComplete.
grant`; `Inventory.addItem` synchronicznie emituje `inventoryChanged`; nowy
listener `Quests` na to zdarzenie woła `advanceAllActive()` PONOWNIE, zanim
zewnętrzna klatka zdążyła wykonać `grantedStages.add(key)`. Zagnieżdżone
wywołanie widzi więc etap jako wciąż niewygrantowany i wręcza owijki drugi raz
— co znów emituje `inventoryChanged`, i tak dalej. W realnej grze rekurencję
przerwałby dopiero pełny plecak (po uprzednim nabiciu stosu duplikatów), a po
drodze `NpcDialog.refreshOptions`/`QuestPanel.refresh` (oba nasłuchują
`questsChanged`) burzyły i odbudowywały listę opcji dialogu dziesiątki razy w
jednej klatce — stąd artefakt.

**Zweryfikowane WŁASNYM headless symulatorem PRZED naprawą i PO**: wersja bez
strażnika rekursji rozjeżdża się (201 wywołań `Inventory.addItem` zanim
sztuczny limit przerwał test — w prawdziwym kodzie nie ma takiego limitu, więc
albo przepełnienie stosu, albo plecak nabity duplikatami owijek). Naprawa:
`private sweeping = false` w `QuestState`, `advanceAllActive()` natychmiast
zwraca `false` przy wywołaniu zagnieżdżonym. Po naprawie: dokładnie 1 wywołanie
`Inventory.addItem`, dokładnie 1 emisja `inventoryChanged`, zero rekurencji —
ten sam symulator, ten sam scenariusz, teraz zielony. `tsc`/`build` czyste.

To drugi przypadek w tym wpisie, gdzie headless symulacja (nie `tsc`, nie
przegląd kodu) złapała błąd, który realnie wpłynąłby na grywalność — warto
zapamiętać ten wzorzec przy następnym `EVENT.*`-owym mechanizmie, który sam
odpala akcje mogące wyemitować to samo zdarzenie, na które nasłuchuje.

---

## 2026-08-20 — cała ósemka dostaje twarz + rozszerzenie `stick_in_hand`

Dwie osobne roboty w jednej sesji.

**Portrety.** Dokończona cała ósemka z `wioska_plan.md` §6 — Witek, Sobek,
Agata, Dobrawa (Kuba/Gniewko/Hanna/Sulisław były już z poprzedniej sesji).
Ten sam przepis co zawsze (Gemini → `tools/build_<imię>.py`, bounding-box
flood-fillem, tabela przekolorowania), z dwoma realnymi znaleziskami:

- **Sobek**: czysty najbliższy-sąsiad po całej palecie naraz wciskał
  dominujący brąz fartucha w `piasek` zamiast `drewno` — matematycznie
  bliżej, ale kasowało kontrast fartuch/tunika. Naprawa: przypisanie koloru
  do ROLI po pozycji w kadrze, dopiero potem najbliższy ton wewnątrz tej
  roli.
- **Dobrawa**: jej jasnozielony kirtel leżał na tyle blisko chroma-key
  zieleni tła, że stara heurystyka „resztek po nasyceniu" (`g>140 &
  g>r+30 & g>b+30`, używana od Gniewki) zjadała całą spódnicę jako tło —
  na podglądzie czytało się to jak biała dziura. Złapane dopiero
  spróbkowaniem surowych pikseli, nie czytaniem Countera na przyciętej
  klatce. Naprawa: ciasny próg odległości do konkretnego koloru tła
  zamiast reguły po dominacji G.

**Prawdziwy bug, nie tylko brak weryfikacji**: po wpięciu Witka/Sobka/
Agaty/Dobrawy user zgłosił „nie widzę postaci" — `queueImages()`
(`src/core/Assets.ts`) woła `load.image()` dla każdego assetu **z osobna, po
nazwie**, nie generycznie po `ASSETS`. Cztery nowe `ASSETS.<imię>` wpisy
istniały, `portraitTexture` w blokach istniał, `tsc` był czysty — a mimo to
nic się nie ładowało, bo nikt nigdy nie zażądał wczytania tych czterech
plików. Naprawione dopisaniem brakujących `load.image(...)` linii. Poprawiony
też błędny komentarz przy `ASSETS.kuba`, który od dawna twierdził, że wpięcie
to „jeden wpis" — nie jest, to trzy kroki, i ten sam błąd wróci przy
dziewiątym NPC, jeśli ktoś zaufa temu zdaniu zamiast sprawdzić.

**Rozszerzenie `stick_in_hand`.** User podrzucił zewnętrzną analizę
(`docs/QUEST_01_WSTEP_DO_MYSLIWEGO.md`, robiona z ChatGPT) proponującą
rozbicie pierwszego zadania na wieloetapowy łańcuch społeczny Marko→Alina→
Patryczek→Dorota→Wszebor. Przed wdrożeniem zrobiony audyt zgodności ze
stanem kodu (Explore agent) — znalazł trzy realne kolizje, nie tylko
nieaktualne założenia:

1. Zwięzłość `stick_in_hand` i brak złota w nagrodzie są UDOKUMENTOWANĄ
   decyzją (`docs/swiat.md` §4 — kij w plecaku od razu kiedyś się zepsuł,
   dało się go sprzedać przed założeniem).
2. Scena „złamana ręka" i „uczę słowem, nie pokazem" **już istnieją**
   (`PATRYCZEK.topics.reka`, `greetings.moreToTeach`) — dokument je
   duplikował.
3. Patryczek jest **już** formalnym trenerem 5 umiejętności (`SKILLS`) na
   `WeaponFamily`/`AttackVariant`/`DamageType` — dokument chciał te systemy
   „obejść" w dialogu, jakby nie istniały.

Rozstrzygnięcia: `stick_in_hand` dostał dokładnie JEDEN nowy cel (`talk:
patryczek`, kredytowany samym otwarciem rozmowy — `Quests.recordTalk` leci z
każdego otwarcia okna NPC), zamiast sześciu etapów. Reszta łańcucha
(jedzenie od Aliny, owijki od Patryczka) poszła jako osobne, w pełni
opcjonalne granty POZA strukturą głównego zadania — nowe zadanie
`prowiant_od_matki` (Alina, `objectives: []`, więc od razu oddawalne w tej
samej rozmowie) i nowy `grant` przy już istniejącym `ziola_dla_babki`
(Patryczek wręcza `worn_wraps` na przyjęciu tego zadania, nie jako osobne
trzecie zadanie — trzecie zadanie kolidowałoby ze wspólną maszyną stanów
`PATRYCZEK.greetings`, bo `ready`/`available`/`active` liczą się PO CAŁYM
zestawie jego zadań naraz w `NpcDialog.pickGreeting`).

Nowy przedmiot: `worn_wraps` (Stare owijki Patryczka, gloves, 1 obrony, bez
`buyPrice`) — świadomie NIE zastępuje `padded_gloves`, tylko poprzedza je w
rozgrywce, dokładnie ta sama relacja co osiosany kij → porządny kij z
`rabbit_hunt`. Pięć nowych, w pełni OPCJONALNYCH tematów u Patryczka
(`nauka_teraz`→`dystans`→`obrazenia`/`ucieczka`→`najlepsza_bron`) zamiast
wymuszonej scenki — silnik nie ma mechanizmu wymuszonych dialogów, a
wymuszanie czytania przed pierwszą walką jest dokładnie tym, przed czym
ostrzega samo §22.1 tego dokumentu.

`tsc --noEmit` i `npm run build` czyste, `tools/katalog_ekwipunku.mjs
--zapisz` przegenerowany (nowy wpis w tabeli rękawic). ⚠ **Nie zweryfikowane
zrzutem ekranu z żywej gry** — Browser pane w tej sesji nie kompilował
klatek (`Framebuffer status: Incomplete Attachment`), więc cała ta robota
stoi na przeglądzie kodu i `tsc`/`build`, nie na obejrzeniu w silniku.

---

## 2026-08-18 (wieczorem) — rodziny broni, czyli tożsamość osobno od parametrów

Autor rozstrzygnął CR-em to, co dzień wcześniej było przedmiotem review.
**Fundament wszedł w całości, a dwie moje rekomendacje zostały odrzucone —
i to jest w porządku, bo obie były propozycjami zamiany osi, nie zastrzeżeniami
do architektury.** Topór dostał mocniejszego krytyka zamiast proponowanego
`best-of-2`, a obuchowe własne zachwianie zamiast „to już jest `interrupts`".

**Co to naprawdę zmienia:** broń przestała być workiem liczb z doklejonymi
pojedynczymi cechami. `family` mówi, czym broń JEST, a model dalej mówi
wszystko inne. Kryterium sukcesu z CR-a — „dodamy dziesięć mieczy i wszystkie
zachowają tożsamość rodziny bez kopiowania mechaniki" — jest spełnione
dosłownie: **toporek nie ma ani jednej własnej linijki o krytykach**, a
dziedziczy oś, bo ma wpisane `family: "axe"`.

**Rzecz, którą złapał dopiero pomiar, i najciekawsza w tej sesji.** Wpisałem
osi topora +0,35, bo brzmiało jak „wyraźnie, ale nie za dużo". Przemiecenie
Zręczności pokazało, że przy tej wartości **siekiera (180 g) przeskakuje młota
(280 g, Siła 6) już od Zręczności 29** — przy obserwowanym w rozgrywce
poziomie 27, czyli w zasięgu realnej gry. To jest dokładnie ten sam błąd,
który projekt naprawiał kiedyś przy młocie („najdroższy zakup aktywnie karał").
Progi wyszły tak: +0,20 nigdy, **+0,25 od Zręczności 59**, +0,30 od 41,
+0,35 od 29, +0,50 od 10. Zeszedłem na 0,25 i **poprawiłem własny komentarz**,
bo pierwotnie twierdził, że inwersja zaczyna się dopiero przy 0,50 — nieprawda,
napisana zanim cokolwiek zmierzyłem.

⚠ Ten próg jest wyprowadzony z **zasięgu rozgrywki**, nie z samej mechaniki.
Naprawa krzywej XP (`odlozone.md` §1) każe go przeliczyć — zapisane przy
liczbie, nie tylko tutaj.

**Trzy rozdziały, których kod teraz pilnuje, a nie tylko dokumentacja.**
Rodzina jest niezależna od typu obrażeń, od `hands` i od jakości. Najostrzejszy
przypadek to siekiera: jej wariant **Obuch** zadaje `blunt`, ale rodzina to
`axe`, więc **nie dostaje zachwiania** — sprawdzone na żywo (`typ=blunt`,
`stagger=0`). Gdyby rodzina szła za typem obrażeń, wariant przyznawałby
zdolność, czego zabrania reguła zawężania. Z tego samego powodu **osiosany kij
został świadomie poza rodzinami**: jest `blunt`, ale to zaostrzona gałąź, a nie
obuch, i broń startowa nie ma dziedziczyć osi archetypu.

**Zero migracji, i to nie przez ostrożność, tylko przez kształt.** `family`
jest wyprowadzana z `itemId`, więc **nie ma jej w zapisie w ogóle** —
sprawdzone: `SAVE_VERSION` dalej 3, a `JSON.stringify(zapis).includes("family")`
daje `false`. Stary i nowy zapis są identyczne co do kształtu; podstawiłem
surową instancję sprzed zmiany i rodzina rozwiązała się w momencie odczytu.

⚠ **Zachwianie działa dziś prawie wyłącznie na papierze i wpisałem to wprost
przy liczbie.** Jedyna broń z rodziny obuchowej to młot, a młot ma odrzut,
który już zawiesza AI na 180 ms; `stagger` bierze `Math.max`, więc dokłada
zero. Oś zacznie pracować dopiero przy obuchowej broni bez odrzutu — planowanej
maczudze. To jest świadome: fundament wchodzi przed wariantami, nie po nich.

**Generator musiał się nauczyć rodzin.** `katalog_ekwipunku.mjs` liczył krytyk
z dwóch członów zamiast trzech, więc kolumna DPS zaniżałaby topory —
a `ekwipunek_przedmioty.md` jest w tym projekcie źródłem prawdy o liczbach.
Rodziny dostały tam własny **generowany** blok, żeby nikt nie wpisał ich
ręcznie.

---

## 2026-08-17 (wieczorem) — dwie równoległe sesje, jeden merge konfliktów

Autor pracował lokalnie przez cały dzień (pięć części niżej) bez pociągnięcia
zmian z GitHuba — na innej maszynie/koncie (`jaroslaw.mazurek@sigmacem.com`,
16:35) w międzyczasie powstała i została wypchnięta kolczuga. Wynik: dwa
rozjechane commity z **be9a896** jako wspólnym przodkiem, oba dotykające
`GameConfig.ts`, `CLAUDE.md`, `docs/dziennik.md`, `docs/ekwipunek_przedmioty.md`.

`GameConfig.ts` zmergował się automatycznie bez konfliktu i — po sprawdzeniu —
**bez sprzeczności merytorycznej**: naprawa `metal.blunt` (0,40→0,50, część
„druga" niżej) i dodanie `ARMOR_PROFILE.mail` żyją w różnych blokach kodu i się
uzupełniają. Sprzeczne okazały się tylko **komentarze**, które odwoływały się do
starej wartości `metal.blunt = 0,40` z wnętrza sekcji `padded`/`mail` (napisane
wcześniej tego samego dnia, zanim naprawa powstała) — trzy takie miejsca
poprawione ręcznie po scaleniu. `docs/ekwipunek_przedmioty.md` (plik
generowany) rozwiązany przez wzięcie struktury z obu stron i ponowne
uruchomienie `tools/katalog_ekwipunku.mjs --zapisz`, zamiast ręcznego
przepisywania liczb w tabelach.

Wpis o kolczudze wstawiony niżej, między „drugą częścią" a „Kieł idzie…" —
kolejność w ramach dnia jest przybliżona (nie ma znacznika godziny poza
16:35 pusha), ale obie sesje nawzajem o sobie nie wiedziały, więc żaden lokalny
wpis z tego dnia nie wspomina kolczugi ani odwrotnie.

---

## 2026-08-17 (piąta część) — warsztat Sobka i świnie w zbożu

Autor: rozbudowa wsi w ramach posiadanych assetów, i „Myśliwy niech zostanie
w lesie". Drugie zapisałem jako **rozstrzygnięcie, nie odłożenie** — `swiat.md`
§3 i tak uzasadniał to lepiej niż przeprowadzka (suszarnie, wędzarnia i ognisko
nie stoją w obejściu), a przy okazji odpada przeliczanie asercjonowanych
odległości w lesie.

**Backlog kafli okazał się w większości nieaktualny.** `wioska_plan.md` §7.2
(„bez tego wieś nie jest wsią") ma sześć pozycji; **pięć jest zrobionych**:
młyn (znaleziony poprzedniego dnia), kury, świnia, grządki mają gotową grafikę,
a pieniek z siekierą istnieje. Naprawdę brakuje tylko palisady. Do tego
**w `znaki.png` leżą narysowane dwie pozycje z listy „brakuje"** — tablica
ogłoszeń z kartkami i krzyż przydrożny — a malowany jest z tego arkusza jeden
kafel.

**Warsztat Sobka stanął** (x66–71/y45–51): deski zamiast bali, szerokie wrota
(stolarz wnosi dłużyce, nie wchodzi bokiem), okno w szczycie. Sobek stoi przy
wrotach na (68,52). Postawiony **jednorazowym skryptem**, nie
`build_wioska.py --zapisz` — regeneracja skasowałaby młyn i całe E1.

⚠ **I znów: raport zielony, obraz zły.** Pierwsza wersja skryptu zgłosiła
„położono 60 kafli, 0 braków" i wyrenderowała **plamy trawy, wody i kamienia**.
Powód: zapisałem surowe `id` z `docs/budynki.json` (0–151), a `.tmj` chce
**gid = lokalne id + firstgid tilesetu** (Buildings zaczyna się na 362) — w
generatorze robi to `Warstwa.set`, przy pisaniu wprost do mapy trzeba ręcznie.
Złapane wyłącznie renderem kafli. Gdybym poprzestał na liczbie z raportu,
w Zagajach stałby budynek z wody.

⚠ **Chlew Witka zablokowany, i to nie z braku kafli.** Plan rezerwuje pod niego
środek-wschód pasa południowego — a wschodnia niwa została pomalowana dokładnie
tam. Przemiecenie całego pasa za wolnym 6×7 dało **jedno** miejsce, po
przeciwnej stronie. Przy okazji wyszło coś gorszego: **Witek i obie świnie stoją
wewnątrz zboża** (zwierzęta doszły 2026-08-14, pole powstało 2026-08-11, nikt
nie sprawdził jednego przeciw drugiemu). Wycięcie dziury w polu jest złą
naprawą wg precedensu tego projektu — stanowisko krwawnika w tej samej niwie
zostało wtedy **przesunięte**, a nie pole przycięte. Zaparkowane jako decyzja.

---

## 2026-08-17 (czwarta część) — Młynarz wraca pod młyn, którego „nie ma"

Autor: „młynarza wypada przenieść pod młyn". Sprawdzenie przed ruszeniem czegokolwiek
dało wynik ciekawszy niż samo przeniesienie.

**Młyn stoi. Trzy dokumenty twierdziły, że nie.** `swiat.md` („Brak: młyn"),
`wioska_plan.md` §5.10 („⏳ największy brak na mapie") i `CLAUDE.md` („the last of
the ten households with no tiles at all"). W rzeczywistości bryła jest na
x2–9/y74–81, własny staw na x0–7/y82–89, a koło młyńskie na styku (4,82) — czyli
**dokładnie w przedziale, który wyznaczyła decyzja D-2**.

⚠ **Powód zniknięcia z radaru jest mechaniczny i wart zapamiętania: młyn jest
namalowany RĘCZNIE i nie ma go w `BUDYNKI_WIOSKI` w `build_wioska.py`.** Żaden
raport generatora go nie widzi, więc „czego brakuje" liczone z generatora zawsze
wychodziło z młynem po stronie braków. Ta sama klasa rzeczy co świnia i strach na
wróble z wcześniejszych części dnia — tylko odwrotnie: tam potrzeba została
zaspokojona obok zaparkowanej rzeczy, tu **robota została wykonana obok narzędzia,
które ją liczy**. Konsekwencja praktyczna: `build_wioska.py --zapisz` skasowałby
młyn.

**Sam ruch.** Miłosz stał na (46,60) — przy studni, na placu, **1517 px od własnego
koła**. Teraz stoi na (9,82), tuż przy drzwiach młyna, na suchym kaflu (drzwi
wychodzą częściowo nad staw, więc miejsce nie było oczywiste). Sprawdzone: kafel
pusty na wszystkich ośmiu warstwach, a reguła O1 („każda para NPC dalej niż 96 px")
przechodzi na **153 parach z zerem naruszeń** — najciaśniejsza para w wiosce to
Zielarka/Patryczek, 115 px, i była taka wcześniej.

⚠ **Skutek uboczny do sprawdzenia w grze:** `know_the_village` (obejdź kowala,
młynarza i Dobka) rośnie z 452 px do **1050 px** od kowala i 1418 px od Dobka. Dla
zadania, które nazywa się „Nowe twarze" i ma pokazać wieś, to prawdopodobnie
poprawa — ale to ~9 sekund marszu w jedną stronę i nikt tego jeszcze nie przeszedł.

---

## 2026-08-17 (trzecia część) — porządki w `docs/`, i cztery martwe warunki

Prośba brzmiała „poczyśćmy odłożone i zrób porządek w docach". Sprzątanie
znalazło więcej, niż sprzątało.

**`docs/README.md` — indeks, którego nie było.** 26 dokumentów, a jedynym spisem
był akapit w `CLAUDE.md`: ~1200 słów bez akapitu, w którym każdy dokument
opisany jest kilkoma zdaniami. Jest w nim wszystko, ale **nie da się z niego
WYBRAĆ**, a to inna czynność niż czytanie — i audyt z 2026-08-16 udowodnił to
twardo, znajdując cztery analizy, do których nic nie prowadziło. Indeks daje
jedną linijkę na plik i odpowiedź na „kiedy to otworzyć".

⚠ **Przy okazji wyszło 80 plików leżących w `docs/` bez żadnego wpisu:**
`ai-pixel-snapped-game-sprites-main/` — cudze repo z ośmiokrokowym pipeline'em
promptów do robienia **prawdziwego** pixel-artu z generatorów AI, cytowane raz
przez `build_pole.py`, z własną licencją. To jest dokładnie ta klasa rzeczy,
przed którą powstał `referencje_zewnetrzne.md`, tylko że o katalogu obok. I jest
**bezpośrednio istotne**: `odlozone.md` §4 mówi, że lewa/prawa klatka ataku czeka
na grafika pikselowego, a to jest pipeline do takiej klatki.

**`odlozone.md` przebudowane — grupowanie po tym, CO ODBLOKOWUJE.** Było „najpierw
zawartość, potem technika", czyli podział, z którego nie dało się odczytać rzeczy
najważniejszej: **że większości pozycji nie da się ruszyć bez autora.** Teraz
sekcje to decyzja autora / playtest przez człowieka / osobna duża sesja /
materiał z zewnątrz. Doszły dwie sekcje innego rodzaju: **§5 barierki** — rzeczy,
których celowo NIE robimy (auto-follow, globalny `MAX_ROOT_MS`, `metal` dla
pająków), bo każda wraca jako „dobry pomysł" co kilka sesji i potrzebuje nie
terminu, tylko pilnowania — oraz **§6 archiwum**, żeby zrobione nie wróciło jako
propozycja.

⚠ **Cztery warunki powrotu okazały się martwe, każdy tak samo.** Świnia i strach
na wróble (poprzednia część dnia), a teraz jeszcze: **prolog** czekał „na
wioskę", która stoi od 2026-08-10 i w której zaczyna się świeża gra — blokada
była fikcyjna przez siedem sesji; i **pytanie otwarte §7 nr 2** („czy ojciec jest
NPC-em?"), które odpowiedziało się samo, gdy ojciec dostał pierwsze zadanie
w grze. Stąd reguła dopisana na górze parkingu: **warunek powrotu wiąż
z ARTEFAKTEM, nie z potrzebą** — potrzebę może zaspokoić coś innego, konkretny
plik nie.

**Liczby w trzech miejscach też się rozjechały** i zostały przemiecione z żywej
gry: **19 NPC** (nie 16/17/18), **68 tematów rozmów** (nie 29/54/55), 12 budynków
we wsi (nie 9). Do każdej dopisane ostrzeżenie, że rosną co sesję.

---

## 2026-08-17 (druga część) — przeoranie listy odłożonych: macierz walki i stal

Zamiast brać kolejny wiersz z `docs/odlozone.md` i go „robić", najpierw
przejrzałem wszystkie 30 żywych. Wynik jest sam w sobie treścią sesji.

**Dwa wiersze były martwe.** Świnia i strach na wróble czekały na potrzeby, które
zostały zaspokojone **obok nich** — świnie stoją w Zagajach od 2026-08-14, tylko
z `pig_walk.png` zamiast z `pig.png`; strach stoi na niwie żytniej, tylko z
osobnej grafiki. Morał ogólniejszy niż te dwa wiersze i dopisany do obu:
**warunek powrotu opisany przez POTRZEBĘ zestarzeje się po cichu**, bo potrzebę
może zaspokoić coś innego. Lepiej wiązać go z artefaktem.

**Trzy wiersze to jedno pytanie.** Nagrody 11+, ujście dla złota i krzywa XP są
opisane osobno, ale to trzy widoki jednego: po dziesiątym poziomie progresja nie
ma dokąd iść, a złoto nie ma na co pójść. Zapisane, nie robione.

### Macierz walki — `tools/macierz_walki.mjs` + `docs/macierz_walki.md`

Dwie usterki znalezione wcześniej ubocznie (młot chybia orbitę wilka o 0,36 px;
młot + tarcza kasuje counterplay skoczka o 15 ms) zostały zaparkowane z tą samą
uwagą: *z jednej trójki nie wolno robić reguły*. Policzyłem pozostałe — **120
kombinacji** root × telegraf i 10 broni × 2 dystanse. Trzy wnioski:

1. **Globalny `MAX_ROOT_MS` nie powinien powstać.** Trzy z czterech telegrafów
   mieszczą każdy root w grze, przy Zręczności 0 i z każdą tarczą.
2. **Pomiar „−15 ms" nie odtwarza się — wychodzi +72 ms**, i wiadomo dlaczego:
   tamten rachunek przyjął ~167 ms na zejście, a z kodu wychodzi 80 ms, bo
   `VenomSpider.enterWindup` robi `setVelocity(0,0)` (skoczek stoi przez cały
   telegraf, więc to nie wyścig) i do pokonania jest tylko
   `bite.reach − bite.range` = 12 px.
3. **„Młot na ostrzu noża" to zły opis.** Poza zasięgiem jest **każda broń
   oprócz włóczni** — kij chybia o 4,36 px, miecz o 10,36, sztylet o 22,36.
   Młot jest po prostu najbliższy. Podniesienie go na 79 nie naprawiłoby
   anomalii, tylko uczyniło go jedyną poza włócznią bronią, którą da się stać
   w miejscu i bić krążącego wilka — to zmiana projektowa.

⚠ **Sam generator dwa razy skłamał, zanim zaczął mówić prawdę, i oba razy
wiarygodnie.** Najpierw pominąłem **czas lotu** ataku: wyszło 49 czerwonych
wierszy zamiast 12 i wniosek „sieci nie da się uniknąć niczym". Potem liczyłem
dystans ucieczki od miejsca, w którym stoi GRACZ — a to odwraca przyczynowość,
bo **to przeciwnik dobija do gracza**; dystans do ucieczki nie zależy od broni
w ogóle. Żadna z tych wersji nie rzuciła błędu. Model przyjąłem dopiero, gdy
odtworzył co do drugiego miejsca po przecinku dwie liczby, które ktoś zmierzył
wcześniej niezależnie (−0,36 px i −1,34 px).

**Jedyny ciasny telegraf to Szary** — budżet 167 ms, poniżej roota każdej broni,
łącznie z pięściami. Ale jego własny kod nazywa kontrę wprost: *„A blunt hit
cancels the bite… the one counter"*. To projekt, nie usterka. Ładny szczegół,
który przy okazji wyszedł: **jedyna broń, która MOŻE go przerwać (młot, jedyna
z `interrupts`), jest zarazem jedyną, która nigdy przed jego kęsem nie ucieknie**
— przy żadnej Zręczności. Sztylet odwrotnie: ucieka od Zręczności 9, przerwać nie
umie. Dwie różne odpowiedzi, żadna nie jest obiema.

### `metal.blunt` 0,40 → 0,50

Zmierzony objaw brzmiał: pełna stal daje przeciw obuchowi 31,3%, skóra 30,2% —
**1,2 pkt proc. za komplet czterokrotnie droższy**. Kluczowe przeformułowanie:
problemem nie było to, że stal jest za słaba, tylko że różnica leży **poniżej
progu zauważalności** — to nie czytelny kompromis, tylko błąd zaokrąglenia.

Po zmianie 36,3% przeciw 30,2%. **Sufit wyznacza przeszywanica**: przeszywanica
+ skóra to 37,6% za 85 g przy 240 g stali, więc stal musi zostać poniżej, inaczej
kasuje przedmiot dodany dokładnie po to, żeby obuch miał odpowiedź. 0,55 dałoby
38,5% i właśnie to by zrobiło — dlatego 0,50, a nie „więcej, bo wygląda lepiej".
Zweryfikowane na żywych getterach `Equipment.reductionAgainst`, nie tylko w
arkuszu.

### Rząd „ZAŁOŻONE" w sklepie wyjechał poza panel

Pytanie autora brzmiało niewinnie — „gdzie u kowala jest opcja naprawy" — a
odpowiedź („tapnij założoną broń w rzędzie ZAŁOŻONE") kazała sprawdzić ten rząd.
Okazał się zepsuty: układany jest z `EQUIP_SLOTS.length` przeciw stałym dobranym
dla **siedmiu** slotów, a lista urosła od tamtej pory trzy razy (druga ręka,
rękawice, amulet — ten ostatni dołożyłem dziś). Przy dziesięciu rząd ma **365 px
i sięga −32,5..332,5 w panelu kończącym się na 300**: ostatni pierścień wisiał
poza ramką, a kafel broni przechodził przez linię podziału w kolumnę kupca.

⚠ **Zepsuło się bezgłośnie i przetrwało dwa dodania slotu.** Stary komentarz przy
tych stałych sam podawał rachunek „7×32 + 6×5 = 254" — czyli ktoś to policzył raz
i nikt nie przeliczył potem. Dlatego naprawa to nie tylko łamanie po pięć
(180 px, mieści się z zapasem), ale też **ostrzeżenie w konsoli**, gdy rzędy
wejdą w cudze miejsce.

⚠ **I ten strażnik złapał mnie DWA RAZY, za drugim po tym, jak sam był zły.**
Pierwsza wersja łamania sięgała 258 px przy połowie wysokości panelu 250 →
podniosłem nagłówek. Druga przechodziła (232 < 250) i **dalej była zła**, bo na
dole panelu stoi jeszcze dwuwierszowa podpowiedź (góra ~193) i przycisk „Wróć" —
**krawędź panelu nie jest limitem, bo nie jest pusta.** Strażnik mierzy teraz do
podpowiedzi, a rzędy siedzą na 112 i 158, kończąc się na 188. Dokładnie ta sama
lekcja, którą ten projekt ma zapisaną przy mapie: liczba wyszła zielona, obraz
był zły.

### „Napraw wszystko" jak w WoW-ie — i dziura, którą odsłoniło

Autor poprosił o ikonę naprawy wszystkiego wprost z widoku handlu. Zderzyło się
to od razu z faktem, że **naprawić dało się wyłącznie rzecz ZAŁOŻONĄ**
(`repairEquipped` czytał `Equipment[slot]`) — czyli „napraw wszystko"
naprawiałoby jedną broń, dokładnie tę samą, którą już naprawia przycisk pod
kartą. **Akcja zbiorcza, która po cichu pomija połowę stanu posiadania, jest
gorsza niż jej brak**, bo nic na ekranie nie mówi, że coś pominięto. Więc razem
z przyciskiem doszła naprawa broni z plecaka — i jej odpowiednik pod kartą
przedmiotu w torbie, żeby jedno pytanie nie miało dwóch odpowiedzi zależnie od
tego, który kafel się tapnęło.

Dwie decyzje warte zapisania. **Wszystko albo nic przy złocie** — ta sama zasada
co przy oddawaniu zadania i `Skills.learn`; naprawa „ile się dało" zostawiłaby
gracza bez złota i bez wiedzy, co właściwie naprawił, bo lista nie ma widocznej
kolejności. I **przycisk z ceną zamiast nagiej ikony młotka**: ten panel raz już
miał niewidzialną naprawę i został z tego powodu przepisany na widoczne
przyciski, a ikona, po której trzeba najechać po tooltip, wraca dokładnie tam —
tym bardziej że na dotyku najechania nie ma.

Zmierzone na żywo: młot założony + miecz i siekiera w plecaku dały **282 g**;
przy 281 g odmowa i **żadna trwałość nietknięta**; przy 282 g wszystkie trzy
wróciły do pełna. Naprawiają tylko sprzedawcy z bronią na półce — Myśliwy i
Kowal tak, Zielarka, Witek i Anna nie, i przycisk mówi to zamiast milczeć.

**Dopisane po prośbie autora: drugi przycisk, „Napraw w użyciu".** Warto zapisać
*dlaczego*, bo to nie jest wariant tego samego: **istnieje z powodu reguły
wszystko-albo-nic z akapitu wyżej.** Skoro brak złota odmawia całej paczki, gracz
bez pełnej kwoty wracał do tapania broni pojedynczo przez kartę — czyli do
dokładnie tej żmudy, którą „napraw wszystko" miało zlikwidować. Wąski przycisk
jest odpowiedzią na ograniczenie szerokiego.

Dwie decyzje przy okazji. **Oba przyciski stoją zawsze**, także gdy pokazują tę
samą kwotę (nic uszkodzonego w plecaku) — przycisk, który raz jest, a raz go nie
ma, jest gorszy niż powtórzona liczba. I **stoją po bokach licznika złota, nie
obok siebie**, bo licznik siedzi na x=0, a dwa przyciski po 170 px nie mieszczą
się po jednej stronie panelu szerokiego na 600.

Przejechane wszystkie cztery stany: uszkodzone wszędzie → **139 g / 282 g**; tylko
plecak → „w użyciu" słusznie wyszarzone, „wszystko" 143 g; tylko założone → obie
kwoty 90 g; nic → oba wyszarzone.

---

## 2026-08-17 — Kolczuga, czyli czwarty materiał pancerza za zero grafiki

Zadanie brzmiało prosto: „dorobić pancerz kolczy, kolczuga była świetna
przeciw cięciu". Wyszły z tego trzy rzeczy, z czego dwie były niespodzianką.

**Niespodzianka pierwsza, i najważniejsza: cały komplet już był narysowany.**
`items.png`, kolumna 6, wiersze 25–28 — kaptur, koszulka, nogawice, buty, w
tym samym bloku, którego kolumny 0–5 to płyta używana przez stalowy szczebel.
Sprawdzone wycięciem przy 10×, nie miniaturką. Zero nowych pikseli, zero
nowego generatora; robota zeszła do wpisania danych.

**Niespodzianka druga: sztandarowa zaleta kolczugi nie ma dziś na kogo
działać.** Policzyłem kanały obrażeń wrogów, zanim wpisałem jakąkolwiek
liczbę: siedem czynnych, `blunt` ×3, `pierce` ×4, cztery bez typu — i
**`slash` nie zadaje nikt**. Czyli materiał, którego cała tożsamość to
odporność na cięcie, wchodzi do gry, w której cięcia nie ma po stronie
przeciwnika. Świadomie tego nie „naprawiłem" przy okazji: najtańsze
odblokowanie to jedno pole (`BEAR.touchDamageType` na `slash` — niedźwiedź
bije łapą, nie kłem), ale to jest decyzja balansowa autora o wydanym już
wrogu, a nie skutek uboczny dokładania przedmiotu. Zapisane w `ARMOR_PROFILE`
i w `CLAUDE.md`, do rozstrzygnięcia osobno.

**Rzecz trzecia, i to ta, która uratowała przedmiot: test dominacji.** Pierwsza
wersja miała `slash: 1,55` i przeszła wszystko — `tsc`, build, kontrole
własne generatora. A przeciągnięcie każdej pary napierśników przez punkty
skuteczne pokazało, że **stalowy napierśnik bije kolczugę na wszystkich trzech
typach naraz** (22 pkt kontra 18 zjada przewagę mnożnika). Kolczuga nie byłaby
więc najlepsza przeciw niczemu nawet w przyszłości, w której cięcie zaistnieje
— czyli jej jedyna historyczna zaleta byłaby liczbą bez pokrycia, a cała
przesłanka zadania fikcją. Podniesienie do `1,80` domyka to: komplet kolczy
daje 62,3% przeciw cięciu, pełna stal 61,5%. **Ten sweep wart jest uruchomienia
przy każdym następnym pancerzu**; jedyne dwie dominacje, jakie zostały, są
starsze ode mnie (przeszywanica i stal wypierają skórzany kaftan).

Ładny efekt uboczny: `blunt: 0,35` jest najgorszy w grze, poniżej płyty —
bo kolczuga przepuszcza wstrząs i dlatego nosiło się ją NA przeszywanicy,
która ma w tabeli najlepszy obuch. Jednego slotu klatki nie da się nawarstwić,
więc zamiast komentarza wpisałem do katalogu wiersz kompletu „kolczuga +
przeszywanica na klacie": −4,5 pkt proc. cięcia, +10 pkt proc. obucha, bramka
z Siły 3 na 2. Historyczny sposób noszenia został prawdziwą decyzją buildową.

Fabularnie towar poszedł do Radzima i pasuje tam **lepiej niż leżąca obok
stal**: kolczugi żaden wiejski kowal by nie uszył, ale `bron_skad` mówi wprost,
że jego półka to znaleziska i zapłata złomowym żelazem — a kolczuga jest
wzorcowym takim przedmiotem, bo przeżywa właściciela. Łatanie oczek to już
jego fach. Zero nowych linii dialogu.

**Domknięcie tego samego dnia, decyzją autora: niedźwiedź bije `slash`.**
Czyli kolumna cięcia przestała być zapasem po kilku godzinach od dodania. Do
tego rękawice kolcze (te też już były narysowane — wiersz 29, rząd rękawic),
przez co kolczuga jest **pierwszym materiałem pokrywającym wszystkie pięć
slotów pancerza**. Pomiar, który to uzasadnia: cios niedźwiedzia za 12 punktów
przechodzi jako **4,2 przez kolczugę, 4,5 przez pełną płytę**, 7,8 przez skórę
i 12,0 na goło — kolczuga wygrywa z płytą mimo sześciu punktów obrony mniej.
To jest ta chwila, w której przestaje być szczeblem, a zaczyna być kształtem.

Dwie rzeczy pilnowane przy okazji, obie zmierzone, nie założone. Rękawice
kolcze **nie wypierają pikowanych** — nagroda za łańcuch u Doroty zostaje
najlepszą odpowiedzią na obuch (4,4 vs 1,75 pkt skutecznego), bo gdyby kupne
były lepsze pod każdym względem, domknięcie tamtego łańcucha traciłoby sens.
I przemiecione dominacje po wszystkich sześciu slotach: **jest ich 6, żadna
nie dotyczy kolczugi**, wszystkie starsze od tej sesji.

⚠ Cena zmiany niedźwiedzia, zapisana, żeby nie zgubić: **obuch zszedł z trzech
kanałów na dwa i został wyłącznie u dzika.** Przeszywanica nie straciła racji
bytu, ale odpowiada teraz na jedno stworzenie zamiast dwóch. Jeśli okaże się
za wąska — dać obuch nowemu stworzeniu, nie cofać niedźwiedzia.

**Trzeci przebieg tego samego dnia: domknięcie siatki slot × materiał.** Skoro
kolczuga pokryła pięć slotów, reszta wyglądała przy niej jak dziury — więc
doszły skórzane rękawice, stalowe rękawice, czepiec i nogawice pikowane.
Znowu zero nowej grafiki; wszystkie cztery kafle leżały na arkuszu. ⚠ Wiersz
29 (rękawice) **nie trzyma konwencji kolumn z wierszy 21-28**: płyta 0-5,
kolczuga 6, ale skóra 7-8 — czyli `leather_gloves` siedzi w kolumnie 7, choć
każda inna sztuka skórzana jest w zerowej. Widać to wyłącznie z wycięcia.

Efekt jest większy niż suma czterech przedmiotów: **każdy materiał ma teraz
swoją kolumnę.** Przeszywanica bierze obuch (44,6%), kolczuga cięcie (64,7%),
stal grot (59,2%), a skóra jest tanią podłogą bez bramki. Do dziś „który
pancerz" znaczyło głównie „ile mam złota"; teraz to pytanie o to, z czym się
zaraz bijesz.

Przy okazji wyszła **prawdziwa usterka**: `gambeson` miał ten sam kafel co
`leather_chest`, więc dwa różne pancerze wyglądały w plecaku identycznie — i
to akurat w slocie, w którym gracz porównuje towar w sklepie. Cała
przeszywanica przeniesiona do kolumny 1, więc każdy materiał ma jedną kolumnę
arkusza. Jedyna kolizja ikon, jaka została, to cztery pierścienie i ta jest
celowa.

Dwie liczby znów **wymusił test dominacji**, nie gust: stalowe rękawice mają 6,
bo przy 7 biły kolcze na wszystkich trzech typach; czepiec i nogawice pikowane
mają 6 i 8, bo przy 7 i 9 wypierały skórzane całkowicie i lekki szczebel
skurczyłby się do jednego materiału. Ten sweep zarobił już na siebie trzeci raz
w jednej sesji — warto go traktować jak część procedury dodawania pancerza.

**Ostatni slot zamknęły ONUCE — i to jest najlepszy moment tej sesji, bo
przyszedł od autora.** Zostawiłem pusty slot butów przeszywanicy z
uzasadnieniem „pikowanych butów nie było". To była prawda o pikowanych
butach i **fałszywy wniosek o całym slocie**: onuca, czyli pas płótna
owijany na stopę zamiast skarpety, jest bezsporna i akurat słowiańska —
chłopski ubiór nosił ją do XX wieku, a rosyjska armia wydawała do 2013 roku.
Pasuje do tej gry lepiej niż cokolwiek, co sam bym wymyślił.

Jedyne, co poprawiłem w propozycji, to przymiotnik: **nie „pikowane"**.
Onucę się owija, a przeszycie warstw zrobiłoby z niej sztywny placek, którego
nie da się owinąć — wielowarstwowość bierze się tu z owijania, nie ze szwu.
Materiał `padded` jest poprawny, nazwa „Onuce" też; „Onuce pikowane" już nie.

⚠ **4 obrony to jedyna działająca wartość** i znów rozstrzygnął pomiar: przy 3
skórzane buty wypierają onuce całkowicie, przy 5 onuce biją skórzany but na
CIĘCIU (6,0 vs 5,0), co przy owijce z płótna jest absurdem. Przy 4 wygrywają
dokładnie jedną kolumnę — obuch — czyli liczba mówi to samo, co fikcja:
onuce nie zatrzymują ostrza, tylko amortyzują.

Morał do zapamiętania jest szerszy niż jeden przedmiot: **„tego konkretnego
obiektu nie było" nie znaczy „ten slot ma zostać pusty".** Warto sprawdzić,
czy nie istniał inny, prawdziwy przedmiot pełniący tę samą rolę — zwłaszcza
w ubiorze chłopskim, do którego ta gra i tak jest osadzeniem.

⚠ Jedna rzecz **niezweryfikowana na ekranie**: panel przeglądarki nie był
wyświetlony, więc WebGL nie wstał (`Framebuffer status: Incomplete Attachment`,
płótno 0×0) i gra nie zbootowała. Liczby zmierzone drogą, którą projekt ma do
tego zbudowaną (esbuild → node na prawdziwym `GameConfig.ts`), kafle ikon
sprawdzone wycięciem z PNG — ale nikt jeszcze nie widział kolczugi w sklepie.

---

## 2026-08-17 — Kieł idzie do Myśliwego, wraca jako naszyjnik, wieś płaci

Krótka sesja, jedna zmiana, ale zamyka **największą otwartą dziurę fabularną**,
którą `docs/swiat.md` nosił od początku: zabicie Szarego nie zostawiało śladu.

Pytanie autora brzmiało „oddajemy kieł Myśliwemu, dostaniemy naszyjnik z kłem?".
Odpowiedź w kodzie brzmiała: nie — nagroda to było 150 g, a Myśliwy mówił we
własnym opisie zadania „kieł zostaw sobie". Kształt, który autor podał zamiast
tego, jest lepszy od trzech, które zaproponowałem: **kieł wchodzi, naszyjnik
wychodzi, a złoto płaci wieś u Sołtysa**, bo „złoto nic nie znaczy w sumie".

Trzy rzeczy warte zapamiętania z tej sesji.

**1. Odwrócenie zapisanej decyzji, świadomie.** `GameConfig.ts` miał komentarz,
że `grey_fang` celowo NIE jest celem zadania, bo skonsumowanie go odebrałoby
pamiątkę po walce. Argument był poprawny — przy założeniu, że w zamian dostaje
się monety. Tu pamiątka nie znika, tylko zmienia postać na taką, którą się nosi
i którą widać. `swiat.md` §2 opisywał ten ruch („naturalny przedmiot do
oddania") zanim zadanie w ogóle powstało; kod po prostu go nie dogonił.

**2. Odpowiedź na pytanie autora „czy to wymaga powiązania zadań w spójny
ciąg".** Wyrysowanie grafu pokazało rzecz, której nie widać z żadnego
pojedynczego zadania: były **cztery rozłączne drzewa**, a `grey_wolf_revenge`
był jedynym LIŚCIEM, który jest zarazem kulminacją fabuły. Wszystkie inne
łańcuchy albo się ciągną dalej, albo są świadomie pobocznymi przysługami. Nowe
zadanie u Sołtysa jest więc **pierwszą krawędzią między kręgosłupem leśnym a
wiejskim** — i przy okazji miejscem, w które wpada scena „ktoś nazywa cię
myśliwym" (§1 nazywa ją najmocniejszą sceną do napisania). Sołtys mówi ją, bo
nosi urząd; nikt inny nie ma do tego prawa.

**3. Jedno zadanie odsłoniło ślepy zaułek, który istniał obok niego.**
`Quests.isQuestItem` blokował sprzedaż tylko przedmiotów WRĘCZONYCH przez
zadanie. Kieł nie jest wręczany, tylko wypada z trupa — a Szary **nie odradza
się nigdy**, więc sprzedanie kła byłoby jedynym nieodwracalnym stanem w grze.
Stąd `Quests.reservedCount`: reguła **ilościowa**, nie zero-jedynkowa —
nadwyżkę wolno sprzedać, celu nie. Zmierzone: przy aktywnym `rabbit_hunt` i 8
kawałkach mięsa sprzedaż 3 przechodzi, 4 już nie.

**Zerowy koszt graficzny.** Ikona to `items.png` (0,13) — jedyny naszyjnik na
całym arkuszu, sprawdzony wycięciem, nie miniaturą: brązowy rzemień z jasnym
wisiorem, 4 kolory. Glif amuletu jest wygrawerowany w `slots.png` od dnia, w
którym powstała lalka ekwipunku. Slot `amulet` był trzecim z czterech martwych
kafli; został jeden (druga mikstura).

⚠ **Czego NIE zweryfikowałem i dlaczego.** Cała logika przejechana na żywo przez
`window.dev` (łańcuch, konsumpcja kła, nagroda, blokady sprzedaży, krytyk
0,15 → 0,23, zapis bez podbicia wersji). Ale **panel Browsera w tej sesji ani
razu nie skomponował klatki** (`Framebuffer status: Incomplete Attachment`, więc
Phaser nie dodał żadnej sceny), czyli kafla amuletu na lalce, dymka i komunikatu
odmowy w sklepie **nikt nie widział**. Są zrobione tym samym wzorcem co
działające rękawice i druga ręka, ale to nie to samo co spojrzenie — a ten
projekt ma zapisane, ile razy wszystkie liczby były zielone przy złym obrazie.

---

## 2026-08-16 (wieczór) — Android, dwa razy zły obraz, trzecia mapa i szarża

Sesja pod hasłem „zbudowałem APK, GUI jest za duże". Najważniejsza rzecz nie
jest ani techniczna, ani projektowa: **dwa razy z rzędu wszystkie liczby były
zielone, a obraz był zły** — i oba razy zobaczyłem to dopiero patrząc na
piksele. To jest ta sama lekcja, którą `build_mapa.py` ma zapisaną od dawna
(„look at the map, don't just read the report"), tylko trafiła w interfejs.

**Runda 1 — GUI za duże.** Wszystkie liczby w `src/ui/` pisano pod okno
1280×720, a okno APK to zmierzone **891×411 px CSS**. Zrobiłem skalę UI:
wirtualna rozdzielczość na kamerze sceny (`setOrigin(0,0)` + `setZoom`), żeby
nie przepisywać ~2000 współrzędnych w `PlayerPanel`/`ShopPanel`. Współczynnik
wyprowadzony z reguły „najwyższy panel musi się zmieścić", a nie dobrany.

**Runda 2 — „napisy nieczytelne".** I tu leżały DWA błędy naraz, z czego jeden
mój. Mój: `resolution` ustawiłem na `1/skala` zamiast `skala`, więc tekst
renderował się 1,75× za duży i był próbkowany w dół prawie 3:1. Głębszy,
istniejący od zawsze: **płótno renderowało się w pikselach CSS i było
rozciągane 2,6× metodą najbliższego sąsiada**, bo `pixelArt: true` ustawia
`image-rendering: pixelated`. Kafle to znoszą, tekst się rozpada. Naprawa to
`Scale.NONE` + `zoom: 1/DPR`, czyli płótno w pikselach urządzenia.

⚠ **Trzeci błąd wyszedł dopiero, gdy autor zapytał „jesteś pewny?".** Nie
byłem — sprawdziłem liczbami, nie okiem. Okazało się, że **samo `resolution`
≠ 1 psuje tekst pod NEAREST-em**: `frame.setSize` dostaje wartość ułamkową
(zmierzone 64,66 texela w płótnie 64 px), więc kwad próbkuje poza teksturę
i gubi kolumny pikseli. Rozwiązanie: tekst ze skalą ≠ 1 dostaje **LINEAR**,
pixel-art zostaje na NEAREST — łatane na `Text.prototype.updateText`, bo
Phaser przywraca NEAREST przy każdym `setText`. Dopiero wtedy zrobiłem zrzut
1:1 i **zobaczyłem** równe litery.

⚠ Przy okazji: zrzut przysłany przez czat bywa po drodze przeskalowany, co
samo rozmazuje tekst. Zanim uznasz takie zgłoszenie za potwierdzone albo
obalone — zrób własny zrzut 1:1.

**Android.** Tryb pełnoekranowy natywnie (`MainActivity` + `values-v28`),
bo webowy fullscreen jest niepewny. Gradle nie startuje w sandboksie
(`Unable to establish loopback connection`), więc kod natywny zweryfikowałem
`javac`-em przeciwko realnym `.aar`/`android.jar`.

**Trzecia mapa — Wschodnia Gęstwina.** Autor wybrał ją z trzech propozycji.
⚠ Pierwsze założenie było błędne i poprawił je `swiat.md`: „wschodnia
gęstwina" to STREFA istniejącej mapy lasu, więc nowa mapa jest tym, co leży
**za** nią — a pytania o most nadal nie dotyka. Zero nowej grafiki; tożsamość
niesie układ (trakt, który się urywa; brzoza znikająca na rzecz świerka; woda
bez odpływu). **Cztery błędy złapał wyłącznie render**: szum gęstości ze
średnią ujemną (mapa czytała się jak sad), twardy próg składu gatunkowego
(pionowy szew przez całą mapę przy idealnych sumach w liczniku), rozlewisko
z jednej elipsy (basen) i ścieżka gasnąca losowaniem per kafel (wyglądała jak
błąd renderowania). Piąty — goły pień bez korony po wycięciu przesmyku —
też tylko z rendera.

**Szarża.** Na prośbę autora, w stylu WoW-a: cel → podbiegnięcie → atak.
⚠ Napisałem własny prymityw ruchu zamiast użyć `dash()`, bo **cel się rusza**:
zmierzone, uciekający 200 px/s odjeżdża w trakcie lotu o 117 px, czyli
dokładnie o tyle rozminąłby się sztywny wektor. Atak na końcu to zwykły
autoatak, więc krytyki/XP/łup/zużycie działają bez nowej linijki. ⚠ To **nie
odparkowuje auto-followa** — granica leży w cooldownie i w tym, że trzeba ją
wybrać; zapisane w `odlozone.md` razem z warunkiem, przy którym granica pęka.

**Na koniec przegląd `.md`.** Trzy pozycje z `odlozone.md` odparkowane (zoom
i HUD, wysokość panelu, pakowanie Androida) — przy czym wysokość panelu
rozwiązała się **ubocznie**, przez zmianę, która o panelu nie wiedziała, więc
warunek powrotu („sesja poświęcona ergonomii panelu") nigdy nie nadszedł.
Poprawione też dwa wiersze, które jako powód podawały „canvas 0×0, weryfikacja
w silniku niemożliwa" — nieprawda od tej sesji, i akurat ten rodzaj
nieaktualności najbardziej szkodzi, bo zniechęca do sprawdzenia.

---

## 2026-08-16 — Broń dwuręczna, włócznia, i cztery pomiary, które obaliły to, co sam napisałem

Sesja zaczęła się od prośby o analizę broni dwuręcznej „jako elementu
docelowego systemu, nie kolejnego wariantu itemu", a skończyła włócznią stojącą
na półce Kowala. Najbardziej wartościowe nie jest jednak ani jedno, ani drugie
— tylko **to, że cztery razy pomiar wywrócił twierdzenie, które wcześniej
padło jako pewnik.** Warto to zapamiętać jako metodę, bo trzy z tych czterech
rzeczy brzmiały wiarygodnie i przeszłyby bez sprawdzenia.

**Pomiar 1 — ostrzeżenie z analizy tarcz było odwrócone.** `tarcze_analiza.md`
§9.3 straszyła, że `swingMul` tarczy i broni dwuręcznej nie mogą się mnożyć bez
limitu, bo poza ataku zacznie się rwać. Policzone na wzorze z `Progression`:
ten sam mnożnik trafia w **oba** pola, więc stosunek pozy do cyklu jest
niezmienniczy — 38,0% dla siekiery przy mnożniku 1,00, 1,20 i 1,44 identycznie.
Ryzyko leży po przeciwnej stronie (maksymalna Zręczność z lekką bronią) i tam
też jest dwukrotny zapas.

**Pomiar 2 — dziura, przez którą przechodzi najczęstsza operacja w grze.**
`hands: 2` miało być „jednym polem i jedną regułą". Grep pokazał, że `Save.ts`
pisze **wprost** w `Equipment.weapon` i `.offhand`, omijając `equipFromBag`
i każdą bramkę w nim. Jedyne takie miejsce w całym `src/`, więc jedyna granica
do pilnowania — ale bez niej reguła byłaby fikcją. Przy okazji wyszło, że
walidacja ma **dwa kierunki**, a `accepts()` pokrywa tylko jeden: `slotForItem`
dla broni zawsze odpowiada `"weapon"`, więc broń dwuręczna założona przy
zajętej drugiej ręce po prostu zostawiłaby tam tarczę.

**Pomiar 3 — młot z tarczą okutą łamie counterplay skoczka od dnia wdrożenia
tarcz.** Tell skoczka to 480 ms, wyjście poza zasięg ~167 ms; młot sam ma root
280 ms i margines +33 ms, ale z tarczą okutą root rośnie do 328 ms, czyli
**−15 ms**. Pomiar 33 ms powstał przy skoczku (13 sierpnia), tarcze doszły
później i nikt go nie przeliczył. Zewnętrzny recenzent słusznie nie pozwolił
zrobić z tego globalnego `MAX_ROOT_MS` — to jedna trójka `broń × offhand ×
przeciwnik`, a dla dzika i Szarego nikt analogicznego rachunku nie zrobił.
Wylądowało w `odlozone.md` jako przypadek do sprawdzenia, nie jako reguła.

**Recenzja zewnętrzna poprawiła jedną rzecz zasadniczą**: `hands` opisuje
**konkretny przedmiot, nie rodzinę broni**. Młot jednoręczny i młot dwuręczny
mogą istnieć obok siebie. To wycofało moją rekomendację „przeklasyfikuj
siekierę i młot" — i miało miły efekt uboczny, którego sam nie zauważyłem:
skoro żaden istniejący przedmiot nie zmienia swojego `hands`, **żaden
istniejący zapis nie staje się nielegalny**, więc normalizacja przy wczytaniu
jest zabezpieczeniem na przyszłość, a nie migracją.

Fundament wszedł i został sprawdzony w silniku przez tymczasowe oznaczenie
młota jako 2H (znacznik potem cofnięty). Najważniejszy wynik jest negatywny:
**blok schodzi z 0,45 na `null` sam z siebie, bez ani jednej linijki warunku**,
bo `blockSpec` czyta slot drugiej ręki. Gdyby trzeba było dopisać `if (2H)`,
fundament byłby zły — i to był właściwy test poprawności.

**Potem włócznia, i pomiar 4 — najciekawszy.** Miała być bronią „kontroli
przestrzeni", więc kluczowe pytanie brzmiało: jaki zasięg. Symulacja pełnego
cyklu wilka pokazała **urwisko**: przy zasięgu 95 wilk jest trafialny przez 22%
cyklu, przy 96 — przez 97%. Jeden piksel, bo tyle wynosi `circleRadius`
orbity. Zasięg okazał się **przełącznikiem, nie pokrętłem** — nie ma
bezpiecznego środka, w którym broń byłaby „trochę dłuższa".

Przy okazji obaliłem własne straszenie z poprzedniej wiadomości: twierdziłem,
że długi zasięg **skasuje** pościg za cofającym się sieciarzem, czyli zawartość,
którą autor wprost nazwał fajną. Symulacja: miecz 1,25 s, zasięg 96 → 0,83 s,
zasięg **120 → 0,67 s**. Pościg zostaje, bo jest zdominowany przez dojście
od 220 px. Zysk jest realny, ale to skrócenie o jedną trzecią, nie usunięcie.

⚠ **A potem urwisko przesunęło się o 18 px, już po decyzji.** `targetInReach`
nie porównuje odległości z zasięgiem wprost — odejmuje `allowance` równy 35%
rozmiaru celu, czyli dla wilka 17,64 px. Prawdziwy próg to **zasięg ≥ 78,36**,
nie 96. Decyzja (98) przeżyła i wyszła z tego lepiej uzasadniona: włócznia jest
pierwszą bronią, która przekracza próg **z zapasem 20 px**, zamiast ocierać się
o niego. Bo ocieranie się jest już w grze — **młot mija próg o 0,36 px**, a pas
sieciarza o 1,3, więc najdłuższa broń w grze prawdopodobnie trafia krążącego
wilka raz tak, raz nie, bez powodu widocznego dla gracza. Ta sama klasa usterki
co `blockArcDeg`, tylko wdrożona. Zaparkowane.

**Na koniec zgłoszenie z gry: „włócznia wygląda jak patyk, a przy ataku
lewituje poza dłonią".** Oba objawy to moje błędy z tej samej sesji i oba
wzięły się z oglądania czegoś w złej skali. Broń w dłoni rysowana jest z
`heldWeaponScale` 0,55, czyli jako **17,6 px** — a ja wybierałem ikonę przy
64 px w plecaku. Zmierzone po fakcie: ikona włóczni i ikona **kija** mają tę
samą oś 45° i praktycznie tę samą długość (40,3 vs 39,6 px), więc przy 17,6 px
różni je wyłącznie grot, a ten schodzi do kilku pikseli. Drugi objaw:
`swingThrustPx` 13 (najwięcej w grze, wybrane „dla tożsamości", bez
obejrzenia) plus origin kotwiczony 6,6 px przed prawdziwym końcem drzewca —
odstępy się sumują i w połowie zamachu widać szczelinę.

Zrzutu z gry zrobić się nie dało (ukryty panel podglądu → canvas 0×0), więc
`updateSword` został **odtworzony offline w PIL z tych samych stałych** i oba
objawy się powtórzyły. Naprawa: ikona kol. 3 → 5, `swingThrustPx` 13 → 9, plus
`sweepMul: 0.45` na wariancie — bo przy okazji wyszło, że włócznia zamiatała
pełne 22° jak cięcie. Wszystko czysto wizualne, zero zmian w balansie.

**Poza tym, po drodze:** dwa nowe dokumenty ekwipunku (`ekwipunek_mechanika.md`
— reguły pisane ręcznie; `ekwipunek_przedmioty.md` — cały roster generowany
z `GameConfig.ts` przez `tools/katalog_ekwipunku.mjs`, żeby przepisana liczba
nie mogła się rozjechać), audyt katalogu `docs/` (cztery dokumenty były
osierocone, a 11 MB cudzego pakietu leżało bez wpisu w rejestrze referencji),
i wyjęcie `__pycache__` spod gita — zmieniało się w 10 z 21 commitów,
w większości bez zmiany własnego źródła.

## 2026-08-15 — Lalka ekwipunku, czyli jak zdjęcie z gry rozstrzygnęło trzy spory

Autor przysłał obrazek: ciemna plansza slotów w kształcie krzyża, hełm,
amulet, rękawice, dwie dłonie, buty. Pytanie brzmiało „czy możemy zrobić taki
system slotów". Plik leżał już w `public/assets/sloty.png`.

**Pomiar był ważniejszy od pomysłu.** Obrazek okazał się regularną siatką 3×4 o
podziałce 33 px, z wnętrzem kafla **32×32 — dokładnie tyle, ile ma ikona z
`items.png`**, więc ikona wchodzi 1:1 bez skalowania. Ale zajętych było 9 kafli
z 12 i zbiór slotów **nie pokrywał się z grą**: brakowało nogawic i drugiego
pierścienia, za to były trzy sloty, których gra nie zna. Decyzja autora:
składamy własny układ, wszystkie 10 slotów, a te bez przedmiotów zostają
nieaktywne.

Układ ustaliliśmy rozmową, nie zgadywaniem: środkowa kolumna to sylwetka z góry
na dół (hełm → klatka → spodnie → buty), ręce po bokach, **pierścienie parą pod
rękami** — bo to ten sam typ przedmiotu i ma się tak czytać. Zostały dwa pytania
otwarte, oba postawione wprost: gdzie amulet i co z miksturami. Mikstury
okazały się jedyną rzeczą na tej planszy, która **nie jest kwestią rysunku,
tylko mechaniki** — gra ma jeden szybki slot i jeden przycisk na HUD, a w
landscape pionowa kolumna umiejętności jest już pełna. Stanęło na dwóch
kaflach, jednym żywym.

Generator (`tools/build_slots.py`) **kopiuje 10 z 12 glifów piksel w piksel** ze
źródła autora i tylko je przestawia; dorysowane są dokładnie dwa — spodnie i
fiolka. Trzy rzeczy trzeba było rozwiązać po drodze i każda wymagała podejścia:
źródło jest krzyżem a cel prostokątem (brakujące narożniki powstają z odbicia
lewego górnego — legalnego dopiero po zmierzeniu symetrii fazy), czyste tło
kafla nie istnieje w źródle i trzeba je odtworzyć (sama mediana nie wystarcza:
90 pikseli ma glif w co najmniej 5 z 9 kafli), a glify rysuje się **konturem, nie
bryłą** — co sprawdziliśmy wydrukiem ASCII tuniki, zanim cokolwiek powstało.

**Potem był błąd i zdjęcie, które go pokazało.** Pierwsza wersja postawiła lalkę
NAD siatką plecaka — dokładnie ten układ, który na wstępie odradzałem pod
landscape, i który potem sam wybrałem, bo pytanie o układ zostało odpowiedziane
odpowiedzią o slotach. Pomiar w żywym silniku przy 640×360: **dolny rząd
plecaka ucięty o 18 px, góra lalki o 16**. Przed zmianą wszystko się mieściło.
Poprawka to lalka OBOK siatki: kolumna ma wtedy wysokość `max(lalka, siatka)`, a
nie sumę, i kosztuje szerokość, której landscape ma w nadmiarze.

Drugie zdjęcie — tym razem prawdziwy zrzut z gry — rozstrzygnęło skalę.
Rekonstrukcja układu pokazała, że lalka z kaflem 32 px stoi obok plecaka z
kaflem 52 px **jak miniaturka**. Autor wybrał ×2 i dorzucił: „ekwipunek dopasuj
do slotów plecaka". Zrobiliśmy to w drugą stronę, bo 32 → 52 to mnożnik 1,625,
czyli rozmyty pixel-art — **siatka plecaka zeszła z 52 na 64**, żeby spotkać się
z lalką ×2. Efektem ubocznym są równe kolumny po 280 px i wygodniejsze pola
dotyku. Rządek slotów na dodatkowe worki (pomysł autora, z Margonema i WoW-a)
wylądował pod lalką — też nieaktywny, bo przedmiotu „worek" nie ma, a zrobienie
go to prawdziwa funkcja, nie robota UI.

**Czego świadomie NIE zrobiliśmy:** amulet, rękawice, druga ręka i druga
mikstura nie weszły do `EquipSlot`. Slot w modelu danych, do którego nic nigdy
nie wejdzie, jest iterowany przez `sumBonus`, zapisywany w każdym save i
odpowiadany przez `accepts` — cztery miejsca po cichu obiecujące mechanikę,
której nie ma. To ta sama lekcja, co opcjonalny `damageType` z CR-3, tylko
wyciągnięta zawczasu. Kafel drugiej ręki jest miejscem, w które wejdzie tarcza
z `docs/tarcze_analiza.md`.

Zostaje jedna rzecz zepsuta i **nie jest to wina tej zmiany**: pasek zakładek
panelu przy 360 px wysokości jest poza ekranem, bo panel ma 530 px i jest
wyśrodkowany. Naprawa oznacza skrócenie całego panelu, czyli przełożenie
czterech pozostałych stron.

### Tego samego dnia: tarcze (SHIELD-02)

„Czas na tarcze" — i okazało się, że kafel drugiej ręki, który godzinę
wcześniej postawiliśmy jako wygaszony, dostał zawartość szybciej, niż ktokolwiek
planował.

`docs/tarcze_analiza.md` miał 1513 linii, werdykt **GO** i gotowy zakres, więc
robota polegała na wykonaniu decyzji, a nie na ich podejmowaniu — z jednym
wyjątkiem, który dokument sam oznaczył jako **blokujący**: który kierunek
„posiada" tarczę podczas zamachu. Autor wybrał „to, co rysuje sprite", i kod
potwierdził, że to nie jest kompromis: `rootedUntil` jest ustawiane **równo**
`attackPoseUntil`, więc przez cały czas ukorzenienia sprite patrzy w cel.
Tarcza działa najmocniej dokładnie wtedy, gdy gracz jest najbardziej bezbronny
— z powodu własnego zobowiązania.

**Jeden prawdziwy błąd, którego analiza nie przewidziała.** Próg
`Math.cos(90°)` to 6,1e-17, a nie zero, więc cios **dokładnie z boku** wypadał
po niewłaściwej stronie nierówności — zmierzone: przy zwrocie w dół cios z
(1,0) nie był blokowany, a decydował o tym wyłącznie szum zmiennoprzecinkowy.
To jest najgorszy możliwy rodzaj reguły w grze o pozycję: prawdziwa,
powtarzalna i nie do wytłumaczenia. Liczone jest teraz kątem w stopniach
z ostrym `<`, a granica należy do strony nieChronionej.

**Dwie rzeczy zmienił autor w trakcie.** Puklerz miał być do kupienia
u stolarza; skończył jako **nagroda za zadanie** u Sobka — i łańcuch napisał
się sam, bo `droga_na_wschod` u Radzima jest wprost o drewnie na osie **dla
Sobka**. Czyścisz trakt cudzymi rękami, o nic nie prosząc, a potem stolarz
oddaje. Jedna linijka `requiresQuest` i zero nowej treści. Druga zmiana: jakość
Zwykła za zadanie, Podła/Niska na półce.

**Kolejność odbiega od rekomendacji samej analizy** (§A.10: CR-3.1 przed
tarczą, osobno) i to jest świadome, ale ma cenę zapisaną na papierze: playtest
powie „lepiej / gorzej", nie powie „dlaczego", bo otrzymane obrażenia dalej nie
mają liczby. Dlatego dźwięk i osobny błysk nie były tu ozdobą.

**Na koniec autor kazał zrobić z zakupu decyzję — i przy okazji wypadła
usterka sprzed tarcz.** Siatka sklepu wypisywała cenę BAZOWĄ, a kasa pobierała
skalowaną jakością, więc u Kowala (towar w jakości 1-2) **każdy przedmiot na
obu półkach pokazywał więcej, niż realnie kosztował** — tarcza okuta: napisane
140 g, pobierane 105. Przy jakości 4+ pomyłka szłaby w drugą stronę i gracz
płaciłby więcej, niż widzi. Decyzja zakupowa nie może stać na liczbie, której
się nie pokazuje, więc naprawione.

Sama decyzja stoi teraz na dwóch osiach zamiast jednej: puklerz na półce jest
**Podły** (28 g, blok 25,5%, bez wymagań), tarcza okuta **Niska** (165 g, blok
41,4%, −17% tempa, Siła 3). Cena tej drugiej poszła ze 140 na 220 g i nie
z wyczucia, tylko z twierdzenia o konwersji z §9.1: blok 45% od przodu jest
wart tyle, co +45% DPS-u, a `swingMul` 1,20 oddaje z tego 17% — przy 140 g było
to najtańsze duże wzmocnienie w grze i kupowało się je bez zastanowienia.
Rozsunięcie jakości wymagało nowego, drobnego pola (`stockQualityFor`)
zaciskanego do zakresu kupca, żeby wiejski kowal nie mógł jedną linijką
w tabeli zacząć sprzedawać mistrzowskiej roboty.

### I jeszcze łańcuch zbieracki — wnuk otwiera babkę

Zadania Doroty leżały dotąd na wierzchu: podchodzisz, dostajesz. Autor
przestawił to tak, że otwiera je **Patryczek** — i uzasadnienie było już
napisane, tylko nieużyte. Jego pierwsze zdanie w grze to „mam rękę w łubkach
i babkę na karku", a temat `babka_ziola` mówi, że to on chodzi z nią do lasu.
Z ręką w łubkach nie schyla się i nie niesie, a wilki zeszły pod wieś. Więc
ani jej nie puści samej, ani sam nie pójdzie. To jedyny moment, w którym
o cokolwiek prosi — i dlatego on też ten łańcuch zamyka, rękawicami pikowanymi
w jakości Zwykłej.

**To wymusiło naprawę, którą projekt świadomie omijał od `wolf_pack_cull`.**
`Quests.isUnlocked` patrzyło wyłącznie na warunki wstępne, więc dopisanie
`requiresQuest` do wydanego już zadania **ukrywało je u dawcy każdemu, kto miał
je akurat aktywne** — postać zostawała z wpisem w dzienniku, którego nie da się
domknąć. `CLAUDE.md` notował to jako powód, dla którego zemsta na Szarym nie
została przełożona za watahę, mimo że narracyjnie tam pasowała. Zamiast omijać
tę pułapkę drugi raz, znika u źródła: **zadanie, które jest już w dzienniku,
jest odblokowane zawsze** — warunek odpowiada na „czy mogę zacząć", nie „czy
mogę oddać". Sprawdzone w obie strony na stanie zapisu sprzed przełożenia.

Zioła w łańcuchu są dobrane tak, żeby się nie dublowały: Patryczek prosi
o **babkę i pokrzywę**, czyli dokładnie te dwa gatunki, o które Dorota nie
pyta w żadnym swoim zadaniu. Domknięcie to znowu pokrzywa — **na włókno**, bo
pikowanie to warstwy tkaniny, a włókno pokrzywowe jest historycznie prawdziwym
materiałem na płótno. Dzięki temu rękawice powstają w tej wsi bez wprowadzania
nowego surowca i bez wchodzenia w rolę Witka, który robi len.

Rękawice otwierają **drugi z czterech wygaszonych kafli lalki** — po drugiej
ręce, którą godzinę wcześniej otworzyła tarcza. Dokładnie po to ta lalka
powstała z pustymi polami zamiast z siedmioma na sztywno. Zmierzone: nowy slot
podnosi pełną stal z 57 na 61 punktów, czyli z 53,3% na 55,0% redukcji — 1,7
punktu procentowego, świadomie mało, bo slot ma być miejscem na przyszłe
przedmioty, a nie skokiem mocy w dniu otwarcia.

Zmierzone po wykonaniu, na żywym silniku: redukcja przód/bok/tył dla obu tarcz
przy braku zbroi i przy pełnej stali (tarcza okuta + stal = **76% od przodu**,
43% z boku i z tyłu); pełny kanał kontaktu na wszystkich siedmiu stworach
(dzik 5,3 z przodu wobec 9,2 z tyłu); jad przechodzi nietknięty przez tarczę
i stal; `swingMul` rusza tempo i czas zamachu **równo ×1,20** na sześciu
broniach, a ukorzenienie jedzie za nimi; czas zamachu nie przekracza cooldownu
nawet przy maksymalnej Zręczności; stary zapis bez `offhand` wczytuje się
prawdziwą ścieżką bez zmian.

## 2026-08-13 (noc) — Dziennik zadań, który się mieści, i zadanie, po które trzeba wrócić

Dwie rzeczy, obie z jednego zdjęcia ekranu i jednego zdania od autora.

**Dziennik zadań przestał się mieścić.** Na screenshocie widać pięć zadań, z
czego ostatnie („Nowe twarze") wychodzi dołem poza ramkę panelu i po prostu
się urywa — bez paska, bez cienia, bez niczego, co by mówiło, że jest tam coś
jeszcze. Zgłoszenie brzmiało dwuczłonowo i słusznie: **przewijanie plus podział
na aktywne i ukończone**. Sama możliwość przewijania by nie wystarczyła —
ukończonych zadań tylko przybywa, więc za miesiąc trzeba by przewinąć archiwum,
żeby dojść do tego jednego, które się właśnie robi.

Lista jest teraz przycięta `GeometryMask`-iem, przewijana kółkiem (desktop) i
palcem (dotyk), z paskiem pojawiającym się tylko wtedy, gdy treść naprawdę
wystaje. Nad nią dwa filtry z licznikami — `AKTYWNE (2)` / `UKOŃCZONE (3)` —
bo pusta lista pod jednym filtrem musi się dać odróżnić od pustego dziennika.
Po drodze jeden własny błąd, złapany przed wysłaniem i wart zapamiętania:
`GAMEOBJECT_WHEEL` to zdarzenie **sceny** (`'gameobjectwheel'`, inna
sygnatura), a nie obiektu — podpięte pod GameObject nie odpala się nigdy i nic
o tym nie mówi. Per-obiektowe nazywa się `GAMEOBJECT_POINTER_WHEEL`.

**A w połowie tej roboty przyszedł pomysł na zadanie**, i jest lepszy niż
wygląda: sfora wilków zabiera owce, więc zlecenie na nią daje **pasterz**, a
Myśliwy tylko odsyła — „idź do Gniewka, pewnie ma dla ciebie zlecenie".

Z tego wychodzą trzy rzeczy naraz, których żadne dotychczasowe zadanie nie
robiło. Po pierwsze, **rozmowa staje się źródłem zadania**. Cały mechanizm
globalnego zbioru zadanych pytań istniał do tej pory po to, żeby wiedza
przechodziła między ludźmi — ale przechodziła sama dla siebie. Tu jeden temat u
Myśliwego (`owce`) jest **jedyną** rzeczą, która otwiera trzeciego dawcę zadań;
Gniewko stoi na ugorze za chałupami i nikt by tam nie zaszedł bez powodu. Po
drugie, **zadanie przechodzi przez bramę w obie strony**: bierze się we wsi,
robi w lesie, oddaje we wsi. Do tej pory każde domykało się po jednej stronie
portalu. Po trzecie, sfora dostaje wreszcie *powód*, żeby na nią iść — nie
„są tam trzy wilki", tylko cztery owce w dwa tygodnie, z czego trzy cudze.

Jedna rzecz, której świadomie **nie** zrobiłem, mimo że się prosiła: wstawienia
sfory jako wymaganego szczebla przed Szarym. Eskalacja byłaby prawdziwa (trzy
zwykłe wilki przed elitą na 190 HP), ale `isUnlocked` liczy się na żywo —
dorzucenie `requiresQuest` do zadania, które w czyimś zapisie jest już
`active`, ukryłoby je u dawcy i nie dałoby się go oddać. Kolejność jest więc
opowiedziana, nie wymuszona. To jest pułapka na każdą przyszłą zmianę bramek w
już wydanym zadaniu, nie tylko na tę jedną.

Sprawdzone skryptem po zbundlowaniu konfiga (`esbuild` → node): 17 NPC, 54
tematy, 8 zadań, zero wiszących `after`, wszystkie tematy osiągalne z zera,
każde zadanie ma dawcę, który je wymienia, i dawcę z `greetings`.

**Na koniec przestawienie spawnów na `forrest.tmj`** — trzy polecenia, jedno
zdanie każde, ale razem zmieniają, jak się tę mapę czyta.

*Dziki od pająków.* Dwa sieciarze stały 125 px od dzika **celowo**: sieć robiła
z uniknialnej szarży szarżę nie do uniknięcia i to była cała ich rola.
Decyzja autora jest taka, że dzik i pająk mają być dwoma spotkaniami, nie
jednym — więc próg odwrócony, z „< 175" na „> 340" (`SPIDER.aggroRange` 230
plus zapas na to, że walka z dzikiem się przesuwa). Struktura „jeden uczy, para
pokazuje po co" przeżyła przeprowadzkę; samotny jest teraz po prostu pierwszy
na trasie, a nie najgłębszy.

*Zające od wilków.* Najbliższa para miała 276 px, czyli mniej niż
`WOLF.deAggroRange` (320) — wilk ściągnięty na gracza mógł skończyć na trasie
patrolu zająca i dorzucić trzeciego uczestnika do bijatyki, której nikt nie
zapraszał. Nowy próg 380.

*Samotny wilk przed sforą.* Najciekawsze z trzech, bo domyka lukę, o której
nikt wcześniej nie mówił: sfora jest pierwszym spotkaniem w grze, którego
**nie da się rozebrać na pojedyncze walki**, a jedynym sposobem sprawdzenia,
czy poradzisz sobie z jednym wilkiem, było spotkanie trzech. Czwarty wilk stoi
na trasie z polany gracza na południowy zachód, 399 px od najbliższego z
trójki — dwukrotność `callRadius`, więc żadne wycie nie sięga drugiej strony.
Ta odległość JEST mechaniką, nie kosmetyką, i ma teraz własną asercję.

Efekt uboczny, który trzeba było dopiąć w tekście: `recordKill("wolf")` nie
odróżnia samotnika od sfory, więc jego zabicie daje 1/3 postępu w zadaniu
pasterza. Pierwsza wersja opisu mówiła „wszystkimi trzema, bo dwie to tylko
rozzłoszczona reszta" i po dołożeniu czwartego wilka kłóciła się z własnym
licznikiem. Gniewko prosi teraz o „trzy wilki mniej na zachodnim skraju" i sam
uprzedza, że jednego spotka się po drodze, samego.

Wszystko poszło **jednorazowym skryptem po `.tmj`** (obie kopie), nie przez
`build_mapa.py --zapisz` — generator zmiótłby warstwę `rosliny`. Reguły trafiły
za to do `raport()` w generatorze, więc następne ręczne przesunięcie w Tiled
złapie się samo. Przy okazji wyszło, że `public/assets/forrest.tmj` (ta kopia,
którą się otwiera w Tiled) **od dawna nie była kopią** — brakowało jej całej
warstwy 42 stanowisk ziół. Odtworzona z tej spod `maps/`.

**Panel potwierdzony na zrzutach z rozgrywki.** Sam nie mogłem go obejrzeć —
okno przeglądarki było ukryte, przez co WebGL nie zainicjował kontekstu
(`Framebuffer status: Incomplete Attachment`) i scena w ogóle nie wstała, więc
nie dało się tego obejść ręcznym `game.step()` jak zwykle. Autor przysłał
zrzuty: przewijanie działa, filtry stoją na `AKTYWNE (2)` / `UKOŃCZONE (6)`,
zadanie pasterza wisi z `Ubij: Wilk 3/3` gotowe do oddania.

⚠ **I ten sam zrzut pokazał usterkę, której podział na dwie listy dopiero
narobił:** ukończone zadania zbierackie wyświetlają cel jako **`0/5`**
(„Plaga królików ✓ • Zbierz: Mięso królicze: 0/5", tak samo „Zapasy zielarki
✓" z `0/4` i `0/3`). To nie jest błąd licznika — cele `collect` są z
założenia liczone **na żywo z plecaka**, a oddanie zadania właśnie te
przedmioty zjadło. Póki ukończone i aktywne stały w jednej liście, ginęło to
w tłumie; osobna zakładka „UKOŃCZONE" składa się wyłącznie z takich linii i
czyta się jak lista niezrobionych rzeczy z ptaszkiem obok. Cele `kill` i
`talk` są zatrzaskiwane, więc pokazują ✓ poprawnie — widać to w tym samym
kadrze („Ubij: Szary ✓"). Poprawka jest w UI, nie w `Quests`: w zakładce
ukończonych rysować cel jako spełniony, bo status zadania jest rozstrzygnięty.
Do zrobienia następnym razem.

⚠ **Krzywa XP jest przestrzelona mocniej, niż mówiło wyliczenie.** W notatkach
stało „jedno przejście mapy = poziom 11". Bieżąca rozgrywka: **poziom 27**,
1618 złota, rozdział punktów Siła 5 / Kondycja 17 / Zręczność 1. To jest
dokładnie ten rodzaj liczby, którego symulacja nie da — i argument za tym, żeby
`PROGRESSION.growth` przestać odkładać.

---

## 2026-08-13 (późny wieczór) — Przejścia między mapami przestały być niewidzialne

Autor: „przydałoby się wizualnie oznaczyć przejścia np. między wioską a lasem".
Zacząłem od drogowskazu przy bramie i **to był węższy pomysł niż problem** —
autor od razu zapytał, co z wejściami do budynków i jaskiń, i przywołał
margonemową półprzezroczystą ikonę wejścia. To przewróciło projekt na właściwą
stronę: **znacznik przejścia to SŁOWNIK, którego gracz uczy się raz**, a nie
scenografia dobierana pod miejsce. Drogowskaz oznacza bramę na drodze i nie
oznacza niczego przy drzwiach chałupy.

Stąd dwie warstwy, świadomie rozdzielone:

- **Ikona wejścia** — półprzezroczysty łuk ze strzałką, leżący płasko na ziemi,
  oddychający alfą. Rysowana **z obiektu `portal`**, a nie malowana na mapie:
  przejście nie może działać bez tego obiektu, więc znacznik z niego wyliczony
  nie da się zapomnieć. Nowe drzwi = jeden punkt w Tiled i ikona jest.
  Kierunek strzałki bierze się z najbliższej krawędzi mapy (poprawne dla obu
  dzisiejszych bram), z możliwością nadpisania właściwością `dir` — bo pierwsze
  drzwi w środku wsi żadnej krawędzi mieć nie będą.
- **Scenografia** — drogowskaz z `znaki.png`, który leżał wygenerowany i
  niewpięty (status dokładnie taki jak `pig.png`), plus przerwa w płocie przy
  bramie lasu.

**Poprawka triggera poszła w tym samym kroku i to nie był dodatek.** Brama
łapała 56 px na drodze szerokiej na 64 px — dało się przejść skrajem obok.
Dopóki brama była niewidzialna, było to nierozróżnialne od „jeszcze tam nie
doszedłem"; z drogowskazem i ikoną ta sama pomyłka czyta się jako zepsuta gra.
Punkt bramy siedzi teraz na **styku dwóch kafli**, nie w środku jednego —
dokładnie ta poprawka, którą `CLAUDE.md` przewidział i odłożył.

**Dwie rzeczy złapał dopiero render, nie raport** (ta sama lekcja co przy
układzie lasu): `wiata_slup_1` okazał się w 1024/1024 pikseli nieprzezroczysty
— to kawałek ściany wiaty z zapieczonym ciemnym wnętrzem, więc jako „słupki
bramy" dał dwie czarne dziury przy drodze; oraz wioska **już ma** płot z
przerwą na drogę, więc mój drugi płot dwa kafle niżej wyglądał jak resztka po
pierwszym. Pierwsze zamienione na `zagroda_*`, drugie usunięte — wioska
dostaje sam drogowskaz.

⚠ Znowu bez uruchomienia w silniku: `tsc` i `build` czyste, mapy sprawdzone
odczytem i **złożone do PNG i obejrzane**, ale ikona wejścia rysuje się dopiero
w grze, a panel podglądu jest ukryty (canvas 0×0, Phaser pada na framebufferze).
Kafle są zweryfikowane wzrokowo, ikona nie.

---

## 2026-08-13 (wieczór) — Skoczek jadowity: pierwszy przeciwnik, którego zagrożenie rośnie

Sesja zaczęła się od pytania „co to za pająki i jakie mają mechaniki", a
skończyła nowym stworem. Po drodze przeszła przez pełny cykl recenzji z
ChatGPT — i to ten cykl jest tu najciekawszy, nie sam kod.

**Najpierw pakiet do oceny** (`docs/pajaki_ocena.md`): kompletny opis sieciarza
z liczbami, kodem i rozstawieniem odczytanym z `.tmj`, plus lista decyzji z
`odlozone.md`, których nie wolno proponować od nowa. Przy okazji wyszła jedna
rzecz, o której nikt nie wiedział: counterplay „teren pochłania sieć" jest
**martwy**, bo kolider pocisków celuje w `map.solids`, a las nie ma ani jednego
static body.

**Potem trzy koncepcje zamiast jednej** (`docs/pajak_jadowity_koncepcje.md`) —
na wyraźną prośbę recenzenta, żeby zrobić mały „design battle" zamiast od razu
kodować. Różniły się nie liczbami, tylko tym, **czym jad w ogóle jest**:
kumulujący, blokujący leczenie, albo egzekwujący terytorium. Wybór padł na
pierwszą. Przed koncepcjami poszło sześć ustaleń technicznych sprawdzonych w
kodzie, z których każde zabijało jakiś oczywisty pomysł — najważniejsze, że
**zwykły DoT nie może iść przez `takeDamage`**, bo ta metoda przy każdym
wywołaniu trzęsie kamerą i gra „auć": cztery ticki to cztery wstrząsy, czyli
awaria, nie trucizna.

**Najważniejszy moment sesji to jednak pomiar.** Recenzent zapytał, czy trzy
stosy jadu są w ogóle osiągalne — i miał rację, że pyta. Symulacja przebiegu
walki (sześć broni × Siła 0/2/4 × gra zachłanna/poprawna × pojedynczo/w parze)
pokazała, że przy pierwotnych liczbach gracz widzi **zawsze dokładnie jeden
stos**. Mechanika trzech stosów nie była „słabo widoczna" — nie istniała. Co
gorsza, mój własny opis („jedno–dwa ukąszenia") był poprawny i kłócił się z
`maxStacks: 3`, które zaprojektowałem dwa akapity dalej.

Z pomiaru wyszła rzecz, która przesądziła o kształcie stwora: **pojedynczy
skoczek nie może dać trzech stosów bez zamiany w dzika** (potrzebowałby 68–96
HP). Więc trzy stosy są stanem STARCIA, nie pojedynku — samotny daje 1–2, para
daje 3. Dokładnie ta sama struktura, którą ma sieciarz.

Druga korekta poszła pod prąd mojemu własnemu wnioskowi. Napisałem, że para
jest „szczelna" i wymusza przyjęcie jadu albo młot albo Unik — bo policzyłem
unik jako pełne wycofanie za 600 ms. Nieprawda: unik mieści się prawie w
całości w naturalnej przerwie między końcem ukorzenienia a kolejnym dozwolonym
zamachem, więc kosztuje 43–63 ms (młotem zero). Para jest trudna
**przestrzennie**, nie czasowo. To była dobra wiadomość, bo recenzent
niezależnie zażądał, żeby para nie była testem posiadania konkretnej broni —
i okazało się, że nie musi nią być.

Wdrożone: `VENOM_SPIDER` + `VenomSpider.ts` (fazy approach/windup/bite/recover,
ponowny test zasięgu w chwili trafienia, młot przerywa tell), cicha ścieżka
obrażeń i drugi stan na `Player` obok spowolnienia, `stacks` w snapshotcie
`Buffs` + licznik przy ikonie, `venom_gland` w łupie, placeholder grafiki
(mniejszy i zielony — dwa pająki muszą się różnić sylwetką, nie skalą) i trzy
punkty spawnu. Autor w trakcie implementacji przesunął je **głębiej niż dziki**
— pierwotnie samotny stał przed nimi na trasie.

Czego NIE zrobiono i to jest świadome: pająk **nie leczy się po zerwaniu
pościgu**. Kosztem odejścia jest czas — 6 s jadu plus 5 s blokady regeneracji
— a nie utrata postępu, bo heal-on-deaggro byłby precedensem dla całego
bestiariusza.

⚠ **Weryfikacja w silniku się nie odbyła.** `npx tsc --noEmit` i `npm run build`
przechodzą czysto, mapa jest sprawdzona odczytem `.tmj` (odległości, unikalne
id, obie kopie zgodne), ale Browser pane był ukryty, więc canvas miał 0×0 i
Phaser wywalił się na `Framebuffer status: Incomplete Attachment` jeszcze przed
dodaniem scen. Rytm walki, ticki jadu i licznik stosów są policzone, nie
zagrane — pierwszy playtest jest do zrobienia.

---

## 2026-08-13 — CR-3: przeciwnicy zaczęli zadawać typowane obrażenia

Domknięcie drugiej połowy pętli z CR-2. Do tej pory pancerz gracza umiał liczyć
redukcję per typ obrażeń, tylko **nikt mu typu nie podawał** — wszystkie cztery
miejsca, w których wróg rani gracza, wołały `takeDamage` z jednym argumentem.
Efekt: kolumna `metal` w `ARMOR_PROFILE` nie robiła nic, a wybór stal↔skóra był
dekoracją.

### Jak to szło

Ten sam układ co wcześniej (GPT projektuje i recenzuje, tu się mierzy
i implementuje), znowu z analizą przed dotknięciem kodu — i znowu to się
opłaciło, bo analiza znalazła dwie rzeczy, których brief nie zakładał:

- **Kanał ≠ przeciwnik.** Nie „pięciu wrogów, pięć ataków", tylko **cztery
  kanały kodu**, przy czym dzik i Szary używają po dwa. Wypad wilka w ogóle nie
  zadaje własnych obrażeń — kieł ląduje przez zwykły overlap kontaktowy, więc
  „otypowanie ugryzienia wilka" to otypowanie jego `touchDamage`, innego miejsca
  nie ma.
- **Szary ma dwa kanały naraz** i nigdzie nie wyłącza odziedziczonego kontaktu.

### Rzecz, która najbardziej zaskoczyła

Pomiary T5/T6 wykonane **przed** zmianą, właśnie po to, żeby było z czym
porównywać. Okazało się, że „poboczny" kontakt to nie jest szum:

- dzik — zwykłe wejście w gracza daje **54%** jego surowych obrażeń (13 ticków /
  130) przeciw 111 z sześciu szarż;
- Szary — kontakt to **29%** wyjścia, ale **tylko gdy gracz jest w zwarciu**.
  Gdy stoi w dystansie: dokładnie zero. Czyli kanał, który wygląda na
  nieistotny, staje się istotny dokładnie wtedy, kiedy gracz robi to, co musi
  robić, żeby w Szarego w ogóle trafić.

To przesądziło o typowaniu **obu** kanałów u obu stworów. Sam odczyt kodu
mówił tylko, że drugi kanał istnieje — dopiero pomiar powiedział, ile znaczy.

### Co postanowiono świadomie NIE robić

- **Królik i pająk zostają bez typu.** Królik nie ma ataku, tylko overlap
  i cooldown; bronią pająka jest spowolnienie, nie 4–7 obrażeń. Otypowanie ich
  zmieniłoby wyłącznie tyle, że startowa skóra chroniłaby gorzej przeciw
  startowemu przeciwnikowi. Zasada zapisana wprost: system ma służyć rozgrywce,
  a nie domagać się kompletności.
- **`ARMOR_PROFILE` nie strojony.** CR-3 wprowadza typy; strojenie liczb to
  osobna robota, inaczej nie wiadomo, co zadziałało.
- **Feedback obrażeń poza zakresem** (CR-3.1).

### Rzecz, którą trzeba zapisać, żeby nie umknęła

Pojawił się ładnie brzmiący wniosek — „skóra na dzika, stal na wilki" — i jest
**nieprawdziwy**. Stal wygrywa przeciw `pierce` wilka (4 vs 7 obrażeń), ale
przeciw `blunt` stal i skóra są równoważne: **31,3% vs 30,2%**, czyli 1,1 pkt
proc. za komplet czterokrotnie droższy. To nie kontrgra, tylko skutek
`metal.blunt = 0,40`. Zaparkowane jako konkretna anomalia do strojenia, a nie
jako „nie mamy danych".

Druga rzecz tej samej wagi: **gracz nie widzi otrzymanych obrażeń**, więc
playtest CR-3 nie ma jak pokazać, że typy działają. Kryterium tego kroku jest
mechaniczne. Gdyby ktoś po zagraniu napisał „typy nic nie dają", byłby to
artefakt braku feedbacku, a nie ocena modelu.

### Jak to sprawdzono

Silnik odpalony przez `preview_start`, świat sterowany ręcznie
(`game.loop.step()` na sztucznym zegarze + zaseedowany `Math.random`), więc
scenariusze są powtarzalne co do milisekundy. Po zmianie **T5/T6/T7 powtórzone
na tych samych seedach wyszły liczba w liczbę identycznie** — te same fazy
dzika (566/400/750/1450 ms), te same wypady wilka (117–118 px / 383 ms), ta sama
kadencja, te same surowe obrażenia. Zmienił się wyłącznie typ i wysokość
redukcji. To jest dowód nieinterferencji, o który chodziło: typ obrażeń nie jest
nośnikiem niczego poza redukcją.

Sprawdzono też, że **usunięcie wymaganego pola wywala build** — bo cała lekcja
tego kroku brzmi: parametr opcjonalny sprawia, że „zdecydowaliśmy, że nie ma
typu" i „ktoś zapomniał" wyglądają w kodzie identycznie.

Na koniec doszły liczby w skali starcia (ile HP zabiera cała walka, nie jeden
cios) — i **przy nich harness dwa razy skłamał w sposób wyglądający na wynik
gry**: trzęsienie kamery przy otrzymaniu ciosu ciągnie `Math.random()`, więc
dwa przebiegi „tego samego" starcia rozjeżdżają się, gdy tylko jedno trafienie
zada inną liczbę; a kilka wilków/dzików dzieli **jeden** obiekt configu, więc
podmiana typów w pętli po instancjach wyłączyła je na resztę sesji. Oba
udokumentowane w `docs/typy_obrazen.md` §11.7 wraz z metodą, która działa
(jeden przebieg + sumy liczone analitycznie z logu trafień).

### Wpadka warta zapamiętania

`GameConfig.ts` został przypadkiem przepuszczony przez `Get-Content` /
`Set-Content` w PowerShellu, co przeczytało plik jako **CP1250** (polski Windows)
i zapisało jako UTF-8 z BOM — czyli rozwaliło każdy polski znak i każdą ramkę
`──` w całym pliku. `git checkout` odpadał, bo plik nosi niezacommitowaną pracę
z poprzednich sesji. Naprawione odwróceniem transformacji bajtowo (UTF-8 dekod
→ strip BOM → **CP1250** enkod), z kopią zapasową przed próbą. Wniosek na
przyszłość: do edycji plików źródłowych używać narzędzia edycyjnego, nigdy
potoku `Get-Content | Set-Content`.

---

## 2026-08-13 — warianty ataku i typy obrażeń (CR-1 + CR-2)

Jeden ciągły wątek w dwóch krokach: broń przestała mieć jeden sposób użycia,
a obrażenia przestały być jedną liczbą bez rodzaju. Na końcu sesji działa pełna
pętla **broń → wariant → typ obrażeń → pancerz celu → jakość → finalne
obrażenia**.

### Jak to szło

Ten sam podział pracy co poprzednio (GPT projektuje i recenzuje, tu się
implementuje), ale **z jedną zmianą, która realnie zadziałała: każdy krok
zaczynał się od analizy z zakazem dotykania kodu.** Obie analizy (CR-1, CR-2)
znalazły rzeczy, których nie znalazłby przegląd po fakcie:

- CR-1 dostał brief z drabinką sześciu broni — w kodzie jest **siedem**
  (brakowało toporka). Brief prosił też o „lunge" jako istniejący parametr;
  takiego pola nie ma, są trzy różne rzeczy pod jedną nazwą.
- CR-1 miał zbudować UI „gdy warianty będą 2 albo 3". Pomiar pokazał, że
  w orientacji poziomej **kolumna umiejętności jest przepełniona o 1 px** przy
  812×375, więc rząd wariantów nie miał prawa iść w pionie. Poszedł w bok.
- CR-2 znalazł najdroższą rzecz w całej sesji: **w kodzie były dwa niezależne
  modele ochrony.** Gracz miał punkty obrony przez `d/(d+50)`, a przeciwnik
  (od CR-1) surowy procent na typ. Nikt tego nie zauważył, bo `EnemyConfig.
  resist` nie miał ani jednego użytkownika — czyli był darmowy do wymiany.
  Wymieniony na wspólny `core/Protection.ts`.

### Rzecz, która najbardziej zaskoczyła

Pchnięcie mieczem dostało w CR-1 `damageMul 0,85` i `swingMul 0,85`, żeby było
czystym sidegrade'em: ten sam DPS, inny kształt. Było to poprawne dokładnie
tak długo, jak długo typ obrażeń nic nie robił. Gdy w CR-2 doszedł pancerz,
okazało się, że `pierce` nie jest gorsze od `slash` przeciw **żadnej** z dwóch
kategorii ochrony — więc pchnięcie wygrywało lub remisowało wszędzie. Wariant
bez wady przestaje być wyborem. `swingMul` poszedł na 0,95 i dopiero wtedy
trójkąt się domknął.

Morał na przyszłość: **„sidegrade" zdefiniowany jako równy DPS jest stabilny
tylko dopóty, dopóki nie dojdzie druga oś porównania.** Przy dokładaniu
kolejnej (odporności, statusy, cokolwiek) trzeba przeliczyć stare sidegrade'y,
bo część z nich cicho stanie się upgrade'ami.

### Decyzje, które świadomie NIE weszły

Autor przyhamował trzy rzeczy i to był dobry ruch: podpowiedzi ↑↓ na kaflach
wariantów („najpierw sprawdźmy, czy system sam w sobie jest czytelny"), ciężar
pancerza jako koszt metalu, i **pancerz pająka**. To ostatnie to najlepsza
korekta sesji: chityna prosiła się o `metal`, ale `metal` jest materiałem,
a nie abstrakcyjną klasą „sztywny" — wpisanie tego trzeba by potem odkręcać.
Pająk został bez pancerza, chityna czeka na własny, trzeci typ. Wszystko
w `docs/odlozone.md`.

Efekt uboczny tej decyzji, który trzeba pamiętać: **obuch siekiery nie ma dziś
na kim błyszczeć** — jest z założenia słabszy w surowym DPS i opłaca się tylko
przeciw metalowi, którego nikt nie nosi. Sprawdzone na tymczasowym celu
(+10,8%), więc wiadomo, że model działa; brakuje mu tylko przeciwnika.

### Co jeszcze wyszło po drodze

- Płaska Siła ma teraz **drugi** koszt: spłaszcza nie tylko drabinkę broni, ale
  i wybór typu obrażeń (przewaga cięcia nad pchnięciem: 11,8% przy Sile 0,
  6,9% przy Sile 4, remis przeciw metalowi). Nadal zaparkowana.
- Trzeci przycisk umiejętności wychodzi poza ekran w orientacji poziomej.
  Zastane, nie ruszane, zapisane.
- Harness testowy w przeglądarce dwa razy skłamał: raz przez cofanie zegara
  między partiami kroków, raz przez gubienie/dublowanie zamachów przy liczeniu
  DPS. **Pomiar przez liczby silnika (`meleeDamage`, `damageAfterArmor`) był
  wiarygodny, pomiar przez zliczanie zdarzeń nie.**

---

## 2026-08-12 (druga sesja) — przebudowa modelu walki

Jeden wątek, ale gruby: system walki przeszedł z „stoję w zasięgu, obrażenia
same się dzieją" na `cel → autoatak → zobowiązanie → punkt trafienia →
trafienie/pudło → reakcja`. Sesja zaczęła się od zwykłego review poprzedniego
kroku i rozrosła, bo review odsłoniło rzeczy, które nie działały.

### Jak to się prowadziło — nowy tryb pracy

Powstał `docs/combat_wspolpraca.md` — wspólny dziennik między analizą (Codex /
ChatGPT) a implementacją (Claude), z regułami: status wpisu, obowiązkowe
kryteria akceptacji, zakaz cichej zmiany decyzji projektowej, wymóg opierania
się na pomiarze w silniku zamiast na domysłach. **Ten podział realnie się
opłacił**: Codex pisał briefy (C-01…C-03), a implementacja je podważała
pomiarami — np. kryterium „cel może uciec spod ciosu" przechodziłoby
**fałszywie** na króliku, bo przy zwykłym pościgu wróg przechodzi w oknie
zamachu 5–16 px przy zasięgu 52–78 px. Codex wyczerpał miesięczny limit w
trakcie jednej sesji, więc C-04 i C-05 poszły już bez niego.

### Kolejność zdarzeń, bo sama w sobie jest pouczająca

1. **Review targetowania** — opis w kodzie i `CLAUDE.md` nie zgadzał się ze
   stanem faktycznym w kilku miejscach.
2. **Autoatak zmienił model dwa razy** na polecenie autora: najpierw
   „trzymanie przycisku", potem „naciśnięcie *uzbraja*, puszczenie nie
   przerywa". Zostało to drugie.
3. **Autor zgłosił problem z animacji**: „uciekam, a postać atakuje". Pomiar
   potwierdził dwie osobne przyczyny — brak jakiegokolwiek warunku stopu dla
   autoataku oraz to, że kierunek ruchu i kierunek ataku były **jednym polem**
   (52 ze 120 klatek postać machała w lewo, bijąc wroga po prawej).
4. **Wybór modelu: WoW czy Wild Rift.** WoW pozwala bić w biegu, ale wygląda
   dobrze wyłącznie dzięki warstwowej animacji (góra ciała macha, nogi biegną)
   — a Character.png to 4 kierunki × jedna klatka ataku, bez rigu. Wild Rift
   (zamach ukorzenia, jedna animacja naraz) był **jedynym modelem mieszczącym
   się w posiadanej grafice**. To ograniczenie techniczne wybrało design, nie
   odwrotnie.
5. **C-01 – C-05 + tap w obiekty świata** (szczegóły i pomiary:
   `docs/combat_wspolpraca.md`).

### Co z tego wyszło

- **Rozdzielenie `moveDir` / `attackDir`** — ruch i zamach to dwa niezależne
  kierunki.
- **Ukorzenienie na czas zamachu** + zakaz rozpoczynania zamachu w ruchu.
  Ucieczka: było 4 pełne zamachy w biegu, jest 0 zamachów i 190 px w 1,5 s.
- **C-01: trafienie w połowie zamachu**, cel i kierunek zablokowane, świeży
  test zasięgu, brak zastępczego trafienia łukiem. Sztylet trafia po 83 ms,
  młot po 133 ms.
- **C-02: ponowny tap odznacza cel** — pierwszy w historii projektu sposób na
  „przestań walczyć".
- **C-03: joystick kradł tapnięcia w świat i robił to od zawsze.** Phaser
  hit-testuje per scena, a zabezpieczenie pytało własną scenę UI, która nigdy
  nie widzi przeciwnika z `GameScene`. `CLAUDE.md` twierdził, że to działa —
  nieprawda, zmierzone (`ui` → 0, `gs` → 1, joystick i tak się stawiał).
  Naprawione mostem `InputState.worldHitTest`.
- **C-04 okazało się już zrobione** przez C-01; domknięty został tylko
  pierścień FX, liczony teraz w chwili uderzenia zamiast przy naciśnięciu.
- **C-05: przejęcie celu po zabiciu** — i to dwa razy zmieniło grę: wataha
  trzech wilków to teraz **jedno tapnięcie zamiast sześciu akcji**. Reguła:
  przejmowany jest najbliższy **już atakujący**, nigdy po prostu najbliższy
  (królik pasący się 39 px pominięty na rzecz wilka z 119 px), więc auto-focus
  może kontynuować walkę, ale nigdy jej nie zacząć.
- **Regresja wykryta i naprawiona przy okazji**: ukorzenienie jechało na polu
  pozy ataku, więc Wir ostrzy — który pożycza tę pozę — zaczął przyszpilać
  gracza na ~220 ms, dokładnie odwrotnie do zadania umiejętności anty-stadowej.
  Rozdzielone na `attackPoseUntil` (animacja) i `rootedUntil` (zobowiązanie).
- **Tap w obiekty świata** (rośliny / osadnicy / ognisko), podpięty w jednym
  lejku `addInteractable`. Zamknięta przy okazji dziura podwójnego zbierania:
  zebrana roślina wypada z listy, ale żyje jeszcze ~300 ms w tweenie zanikania
  i była nadal hit-testowalna.

### Playtest i werdykt

Autor zagrał: **walka jest bardziej dynamiczna**, pająki łatwiejsze (bo
zaznaczenie + pościg za cofającym się przeciwnikiem działa jako rozgrywka, nie
utrudnienie), przejmowanie celu sprawdza się w praktyce. **Root zostaje.**

Wcześniejsze zastrzeżenie implementacji, że ukorzenienie zjada połowę okna
uniku przed szarżą dzika, zostało przez autora słusznie osłabione: dzik zadaje
16–24 z 100 HP, więc to koszt jednej piątej paska, a nie śmierć.

⚠ **Czego playtest nie objął**: walki bez wybranego celu (tam obowiązuje
„stań, żeby machnąć", a tutorial nie uczy targetowania) oraz watahy wilków —
jedynego miejsca w bestiariuszu, gdzie wypad jest **celowo nieczytelny**, więc
obrona roota przez „odczytaj zagrożenie i przestań atakować" tam nie działa.

### Stan repo na koniec sesji

**Nadal nic nie jest zacommitowane** — teraz to sześć splecionych tematów plus
tap w obiekty świata. `tsc --noEmit` i `npm run build` czyste na każdym kroku;
w odróżnieniu od poprzedniej sesji panel podglądu działał, więc wszystko było
weryfikowane w żywym silniku ręcznym krokowaniem `game.step()`.

⚠ **Pułapka pomiarowa warta zapamiętania**: przy ręcznym krokowaniu tweeny
postępują ~7× wolniej niż krok symulacji. Kosmetyczny tween wypadu potrafi
wtedy przypiąć pozycję gracza i dać fałszywy odczyt „gracz nie może uciec"
(11 px zamiast 190 px). Jeśli pomiar dotyczy czegoś, co rusza sprite'em —
najpierw sprawdź, czy nie mierzysz tweena.

---

## 2026-08-12

Dwa duże wątki: dokończenie systemu jakości/trwałości przedmiotów (zaczęty w
poprzedniej sesji, nieukończony) i pierwszy krok w stronę targetowanej walki.

### Jakość wykonania i trwałość przedmiotów — od oceny do wdrożenia

1. **Wyjaśnienie stanu.** Poprzednia sesja zaimplementowała cały system
   (`src/core/Quality.ts`) i wypaliła limit tokenów przed podsumowaniem —
   zacząłem od odtworzenia, co faktycznie stoi w kodzie (7 poziomów jakości,
   trwałość broni, minimalna naprawa jeszcze nie istniała).
2. **Krytyczna ocena mnożników** (`QUALITY.modifiers`) — cztery znalezione
   słabości: `damage`/`defense` używają tej samej tabeli % mimo że `defense`
   przechodzi przez nieliniową `defenseReduction`; `attackSpeed` dzieli
   wspólny cap z Zręcznością/pierścieniami (realna wartość 0-12% zależnie od
   builda); `requirement` gruboziarniste; krzywa `maxDurability` niespójna z
   krzywą `damage`. Szczegóły: [[jakosc-wykonania-krytyka-mnoznikow]] (pamięć)
   i `docs/jakosc_wykonania_ocena.md` (pakiet z tabelami przed/po, wysłany do
   ChatGPT).
3. **Decyzja ChatGPT** (przekazana przez Ciebie): architektura zostaje bez
   zmian. Dwie rzeczy do poprawy: kolizje zaokrągleń (bez zmiany procentów) i
   naprawa broni (Opcja B — minimalna, gotowa tego samego dnia zamiast
   wyłączania zużycia).
4. **Wdrożone:**
   - `instanceDamage`/`instanceDefense` przestały zaokrąglać — precyzja
     zachowana aż do rzutu kością (`Player.rollDamage` → `FloatBetween`) i do
     `defenseReduction`. Wyświetlanie: `Quality.formatStat` (1 miejsce po
     przecinku tylko gdy potrzebne). Zweryfikowane w silniku: kolizje typu
     "kij Zwykła=Dobra" i "skórzany komplet Wysoka=Arcymistrzowska" zniknęły.
   - Minimalna naprawa: klik na założonej zużytej broni w `ShopPanel`, u
     dowolnego sprzedawcy z bronią w ofercie, koszt proporcjonalny do
     brakującej trwałości (`EQUIPMENT.durability.repairPriceFraction`).
5. **Faza 1b — asortyment Kowala.** Sprzeczność między jego `stock` (pełna
   stal + 4 pierścienie) a jego własnymi słowami ("kuję podkowy") rozwiązana
   **fabularnie, nie przez okrojenie stocku** — nowy temat rozmowy
   `bron_skad`: nie kuje broni/pancerza, bierze je od wędrownych kupców i ze
   znalezisk. Zero zmian w `stock`.
6. **Kij startowy → Podła jakość.** `Quests.grant` dostał opcjonalne pole
   `quality`; `stick_in_hand` nadaje kij na poziomie 1, bo to przedmiot
   startowy (branch ojca ostrugany wieczorem wcześniej) — odwraca pierwotną
   rekomendację koncepcji (§5.5), świadomie.
7. **Pierwsza nagroda-przedmiot z questa.** `rabbit_hunt` (drugi quest w
   grze) daje teraz 50g + 30 XP + kij **Wysokiej** jakości — pierwsze realne
   użycie rezerwy poziomów 5-7. Dodany generyczny mechanizm
   `Quests.RewardItem` + `Inventory.hasRoomFor()` (zasada wszystko-albo-nic:
   pełny plecak odrzuca całe oddanie questa, nie tylko nagrodę-przedmiot).
   **Uwaga**: to formalnie pomija warunek wejścia w Fazę 3 z dokumentu
   koncepcyjnego (przeróbka płaskiej Siły na %) — nazwane wprost, zaakceptowane
   jako pojedynczy wyjątek o zerowym ryzyku (kij to dół drabinki broni).
8. **Status fazowania na koniec dnia:** Faza 1 ✅, Faza 1b ✅, Faza 2 ✅
   (mechanicznie — pytanie projektowe §5.3 "czy to tworzy decyzję" nigdy
   formalnie nie odpowiedziane), Faza 3 **świadomie wstrzymana** jako szeroki
   rollout — jeden wyjątek (`rabbit_hunt`) zostaje, kolejnych nie dodawać bez
   wyraźnej prośby.
9. **Nowa konwencja: `docs/odlozone.md`.** Na Twoją prośbę — rzeczy świadomie
   odłożone (nie zwykły backlog) trafiają tam jedną linijką z powodem i
   warunkiem powrotu, zamiast żyć tylko w mojej pamięci. Zawiera dziś 11
   pozycji, w tym szeroki rollout Fazy 3, Siłę jako płaski bonus, obronę
   wrogów (patrz niżej), trwałość pancerza i cztery wcześniej odłożone
   zadania techniczne (zoom/HUD, kolizje, krzywa XP, świnia).

### Walka wręcz — audyt kodu i pierwszy krok w stronę targetowania

10. **Audyt na żądanie ChatGPT.** Szczegółowa analiza obecnego stanu walki
    (targetowanie, ruch, atak, zasięg, facing, wielu przeciwników) z
    cytowaniami plik:linia, bez żadnych propozycji zmian — czysty opis stanu
    faktycznego. Kluczowe ustalenie: **zero systemu targetowania w całym
    kodzie**, atak to bezstanowy test geometryczny (łuk + strefa kontaktowa)
    przeliczany od nowa przy każdym zamachu, trafia wielu wrogów naraz.
11. **Pierwszy krok targetowania, wdrożony tego samego dnia.** Klik/tap na
    wrogu ustawia `GameScene.currentTarget`; podstawowy atak z wybranym
    celem trafia TYLKO jego (przez `damageCurrentTarget()`, cienki wrapper
    nad tym samym `damageMatchingEnemies` co reszta gry — zero duplikacji
    logiki obrażeń/critów/knockbacku/lootu). **Bez targetu atak nadal działa
    dokładnie jak dziś** (stary łuk, wielu wrogów naraz) — to jest warunek,
    pod jakim uznałem to za ewolucję, nie regresję: siekiera/młot nie tracą
    swojej tożsamości (trafianie grupy) dopóki gracz nie zacznie celować.
    Poza zasięgiem cel NIE jest czyszczony (gracz musi sam podejść — zero
    auto-follow, zgodnie z zakresem zadania).
    - Znaleziony po drodze konflikt: `VirtualJoystick` przechwytywał całą
      lewą połowę ekranu na `POINTER_DOWN`, więc tapnięcie wroga po lewej
      stronie zarazem stawiałoby tam joystick. Naprawione jedną linią
      (`scene.input.hitTestPointer`) — nazwane jako osobna decyzja przed
      wdrożeniem, zaakceptowane.
    - Znaleziony przy implementacji: `GameScene` jest reużywaną instancją
      między restartami sceny (przejście portalem) — `currentTarget`/
      `targetMarker` musiały dostać jawny reset w `create()`, inaczej
      wskazywałyby na zniszczone obiekty po zmianie mapy.
    - Zweryfikowane end-to-end w żywym silniku (nie tylko `tsc`): kliknięcie,
      trafienie w zasięgu, brak trafienia poza zasięgiem z zachowanym
      targetem, czyszczenie targetu po śmierci, fallback do starego łuku bez
      targetu — wszystko potwierdzone bezpośrednimi wywołaniami na
      `window.game.scene.getScene('Game')`.
    - Świadomie NIE dodane (poza zakresem tego kroku): auto-follow,
      pathfinding, priorytet/nearest-target, tab-targeting, cykl AoE dla
      podstawowego ataku.

### Stan repo na koniec sesji

**Nic nie jest zacommitowane.** 17 plików zmienionych, 1 nowy plik kodu
(`src/core/Quality.ts`), 4 nowe pliki docs (`jakosc_wykonania.md`,
`jakosc_wykonania_ocena.md`, `odlozone.md`, i ten dziennik). `tsc --noEmit` i
`npm run build` czyste przez całą sesję, każdy krok weryfikowany
bezpośrednio w silniku (dynamiczny import modułów / `window.dev` /
`window.game` — pełny interaktywny playtest niemożliwy, panel podglądu nie
renderował w tej sesji).

**Do rozważenia na start następnej sesji:** commit tego wszystkiego (jeden
batch czy podzielony na quality/durability + combat targeting — do
ustalenia), potem wybór kierunku z wcześniej zadanego pytania "co dalej"
(więcej broni/broń dystansowa, rozbudowa wioski — obrona wrogów świadomie
odłożona, patrz `docs/odlozone.md`).

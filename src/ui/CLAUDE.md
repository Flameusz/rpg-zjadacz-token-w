# `src/ui/` — panele, HUD, sterowanie dotykiem

Reguły dotyczące **wyłącznie** tego katalogu. Singletony, z których UI czyta →
`src/core/CLAUDE.md`. Stan projektu → `CLAUDE.md` w korzeniu.

⚠ **Ten plik dochodzi automatycznie tylko przy `Read`/`Edit`.** Odczyt bashem
niczego nie wstrzykuje — jeśli czytasz ten katalog bashem, otwórz go wprost.

⚠ **To jest interfejs DOTYKOWY na telefonie w orientacji poziomej.** Nie ma
najechania myszą, palec zasłania to, co dotyka, a krótsza oś okna bywa ~360 px
CSS. Każda decyzja niżej z tego wynika.

---

## Zasada wspólna: UI nie sięga do sceny gry

Widżety rozmawiają z rozgrywką **wyłącznie** przez `InputState` / `Controls` /
`GameEvents` — żadnego `scene.get("Game")`. Panele dziedziczą po `PanelBase`
(kontener, tło, przycisk zamknięcia, `makeButton()`, centrowanie, pauza na czas
otwarcia), style i kolory idą z `core/theme.ts`.

⚠ **Jedyny wyłom jest jednopytaniowy i celowo taki został**: `InputState.worldHitTest`.
`VirtualJoystick` zajmuje **całą lewą połowę ekranu**, a Phaser trafia w obiekty
**per scena** — więc lokalny `hitTestPointer` widżetu z `UIScene` fizycznie nie
może zobaczyć wroga, który jest interaktywny w `GameScene`. Most odpowiada na
jedno pytanie („czy pod palcem jest coś ze świata?") i nie niesie ani celu, ani
ruchu, ani referencji do wroga.
- **Oba testy trafienia są nośne**: lokalny broni własnych przycisków HUD-u
  (świat ich nie widzi), most broni świata.
- Rejestracja na **KOŃCU `create()`**, zerowanie na `SHUTDOWN` — inaczej po
  restarcie sceny most trafiałby w listę wyświetlania poprzedniej mapy, a na
  ekranie tytułowym wetowałby gałkę na zawsze.

---

## Skala interfejsu — najłatwiejsza rzecz do odwrócenia w całym projekcie

Skalowana jest **KAMERA sceny** (`setOrigin(0,0)` + `setZoom(factor)`), czyli
rozdzielczość wirtualna. Mnożnik doklejony do każdej współrzędnej oznaczałby
przejrzenie ~2300 linii `PlayerPanel.ts` z gwarancją, że jedna zostanie
pominięta.

⚠ **`textStyle` ustawia `resolution: factor` i KIERUNEK tego mnożnika był
realnym błędem.** Reguła: `resolution` to liczba **pikseli TEKSTURY na piksel
logiczny**, kamera UI rysuje `factor` pikseli ekranu na piksel logiczny, więc
równość daje 1 teksel na 1 piksel urządzenia. Stało tam przez chwilę
`1 / factor` — tekst renderowany 1,75× za duży i próbkowany w dół prawie 3:1,
pod NEAREST-em miazga. **Odwrotność wygląda prawdopodobnie.**

⚠ **`resolution ≠ 1` samo w sobie psuje tekst pod NEAREST** — to OSOBNA pułapka
od kierunku. `Text.updateText` daje ramce szerokość **ułamkową** (zmierzone
64,66 teksela w płótnie szerokim na 64), kwad próbkuje poza teksturę i gubi
kolumnę pikseli w środku wyrazu. Stąd `installTextFiltering()`: tekst ze skalą
inną niż 1 dostaje LINEAR, pixel-art zostaje na NEAREST. **Łata idzie na
prototyp `Text.updateText`**, bo `WebGLRenderer.canvasToTexture` przywraca
NEAREST przy KAŻDYM przerysowaniu — czyli przy każdym `setText`, a więc na
liczniku HP i odliczaniu cooldownów.

⚠ **Tekst w ŚWIECIE ma `worldTextStyle` i celowo NIE kompensuje** — kamera
świata powiększa, a napisy mają być klockowate tak samo jak kafle.
`Fx.floatingText` obsługuje obie strony i wybiera styl po kluczu sceny.

⚠ **Zamiast `scene.scale.width/height` używaj `uiW(scene)`/`uiH(scene)`.** Rzecz
kotwiczona do prawej albo dolnej krawędzi musi znać szerokość **wirtualną**, nie
fizyczną. To jedyna zmiana rozsiana po plikach tego katalogu.

⚠ **Wszystko, co czyta `pointer.x/y`, liczy w pikselach EKRANU i wymaga jawnego
przeliczenia** — gałka (bez tego podstawa lądowała wyraźnie obok palca),
przewijanie list i kart palcem (`ListDetail`, `ShopPanel`). **Drag&drop NIE wymaga**:
Phaser liczy `dragX/dragY` przez kamerę obiektu, więc dostaje współrzędne
wirtualne sam.

⚠ **Nowy widżet ma iść przez `textStyle`, nawet jeśli nie potrzebuje kroju ani
koloru z motywu.** `AttackButton` jako jedyny składał styl ręcznie i jako jedyny
rozsypywał się przy skalowaniu.

⭐ **Krój i rozmiar (od 2026-10-13, D1 + etap B).** Krój CAŁEGO UI jest
proporcjonalny (`theme.UI_FONT`, Roboto na Androidzie); świat zostaje na
monospace (`worldTextStyle`). Rozmiar bierze się z ROLI, nie z literału:
`fontSize: fontPx("body")` — `TYPE` w `theme.ts` (title 23 · prose 21 ·
name 21 · body 18 · small 15, podłogi z researchu §8 R1).
- ⚠ Pliki przeniesione na role są na liście `NA_ROLACH` w
  `tools/panel_fit.mjs` (§L) — tam `fontSize` inne niż `fontPx(…)`, także
  `` `${STAŁA}px` ``, świeci na czerwono. Plik przeniesiony w D–F dopisz.
- ⚠ Proporcjonalny krój nie ma `tabular-nums`: liczby w kolumnie wyrównuj do
  PRAWEJ (`setOrigin(1, …)`), ⛔ nigdy spacjami.
- ⚠ Panele zbudowane pod 11–13 j. NIE dostają roli „przy okazji" — podmiana
  liczby bez przebudowy rozsadza ich geometrię (to praca etapów D–F).

---

## Koszt klatki: co wolno wołać w `update()`

⚠ **`Text.setColor` przerysowuje płótno napisu i wysyła teksturę na GPU ZAWSZE
— także gdy kolor jest ten sam.** To nie jest to samo co `setText`, które Phaser
odsiewa po równości ciągu. Ten katalog zna ten mechanizm z drugiej strony:
`installTextFiltering()` istnieje właśnie dlatego, że **każde** przerysowanie
napisu przywraca filtrowanie NEAREST — czyli patch dokłada się do każdego
takiego przerysowania.

Znalezione 2026-08-23 w trzech miejscach naraz, wszystkie wołane bezwarunkowo:
`BuffBar.update` (co klatkę, na każdy aktywny efekt), `AbilityBar.update` (co
klatkę × 4 przyciski) i `HUD.paintStamina` (kilkanaście razy na sekundę przez
całą regenerację).

**Reguła: w pętli klatkowej stosuj kolor, tint i obrys TYLKO przy zmianie
stanu, od którego zależą.** Zapamiętaj ostatnio ZASTOSOWANĄ wartość w widżecie
(`paintedPaused`, `paintedGold`, `drawnRatio`) i porównaj. `null`/`-1` znaczy
„jeszcze nie malowano", żeby pierwsza klatka zawsze przeszła.

⚠ **Klucz deduplikacji musi opisywać WSZYSTKO, co pętla rysuje — inaczej
zamraża stan końcowy.** Zmierzony przypadek (naprawiony 2026-08-23, zgłoszony
z rozgrywki): `AbilityBar` kwantyzował sam kąt łuku (`round(ratio*720)`),
a rysował też tekst sekund, alfę ikony i jasność ramki. „Stygnie, zostały 3 ms"
i „gotowa" dawały ten sam klucz `0`, więc klatka końca cooldownu wypadała na
`continue` i **przycisk zostawał z napisem „1" i wygaszoną ikoną, będąc już
klikalnym**. Okno miało szerokość `0,000694 × cooldown`, więc wada rosła
z długością: 21% użyć przy 5 s, **100% przy 24 s**. Lekarstwo jest ogólne —
gdy stan „trwa" i „skończone" wyglądają inaczej, **nie wolno im dzielić
klucza** (tu: `remaining > 0 ? Math.max(1, krok) : 0`).

⚠ **`Graphics.slice` + `fillPath` tesseluje łuk OD NOWA przy każdym
wywołaniu.** Wycinka cooldownu robiła to dla czterech przycisków sześćdziesiąt
razy na sekundę, także gdy **żaden nie stygnął**. Zysk siedzi w stanie
bezczynnym, nie w kwantyzacji kroku.

⚠ **Kwantyzując cokolwiek pod „i tak nie widać", policz to w pikselach
URZĄDZENIA, nie w jednostkach logicznych.** Pierwsza wersja tej bramki miała
krok 1/120 obwodu i była błędem: promień 38 j. daje obwód ~239 j., a kamera UI
powiększa do 1,75×, więc krawędź skakałaby o ~3,5 px. Oszczędność w stanie,
który trwa sekundy, nie jest warta widocznego skakania.

**Mierz, zanim zaczniesz ciąć:** `dev.perf.overlay()` (licznik w rogu),
`dev.perf.watch(15)` (percentyle + licznik zacięć), `dev.perf.scene()`
(rozmiar listy wyświetlania, liczba obiektów `Text`, tweeny).

---

## Dotyk: widoczny przycisk zamiast ukrytego gestu

⚠ **Podwójne tapnięcie jest złym czasownikiem i zostało z tego katalogu
usunięte.** Projekt płacił za nie realnym opóźnieniem (naprawa w sklepie była
odraczana o 300 ms, żeby nie odpalić się na pierwszej połowie podwójnego
tapnięcia sprzedaży) i było niewidoczne — nic na ekranie nie mówiło, że
przedmiot da się w ogóle założyć.

**Wzorzec: tapnięcie ZAZNACZA** (karta w stałej kolumnie), a akcje stoją
na dole karty (`ShopDetails` — przedmiot, `ListDetail` — reszta).
- **Przycisk niedostępny jest WYSZARZONY i WIDOCZNY, z powodem** („Tu nie
  naprawia", „brakuje: 15g, 2 pkt"). Brak przycisku nie niesie informacji, a
  odmowa bez powodu na dotyku czyta się jak zepsute UI.
- **Akcja kliknięcia odpala się na pointer UP.** Na pointer down każde
  porządkowanie plecaka liczyłoby się też jako kliknięcie — a kliknięcie
  w konsumowalny przepina slot `Q`.
  - ⚠ **`input` jest PER SCENĘ, więc próg przeciągnięcia ustawia jeden widżet
    wszystkim.** `PlayerPanel` ustawia `scene.input.dragTimeThreshold = 300`
    (jego długie przytrzymanie w plecaku), a `ShopPanel` żyje w tej samej
    `UIScene` i **dziedziczy to bez pytania** — przeciągnięcie w sklepie też
    wymaga 300 ms przytrzymania. Wartości tego pola szukaj w `src/`, nie
    w `main.ts`; wniosek wyciągnięty z `main.ts` był już raz błędny
    (`docs/dziennik.md` 2026-08-27 §2).
  - ⚠ Praktyczny skutek: skoro `DRAG_START` przychodzi **po** `POINTER_DOWN`,
    na wciśnięciu nie wiadomo jeszcze, czym gest będzie. Zaznaczanie na `DOWN`
    zapala kartę na początku każdej próby przeciągnięcia. `ShopPanel` zaznacza
    na `UP` z tego powodu; strona gracza została na `DOWN` i to jest dług, nie
    wzorzec.
  - ⚠ Flaga `wasDragging` (`PlayerPanel.onDragStart`) **nie ma dziś ani jednego
    czytelnika** — jej jedyny odszedł razem z zakupem na tapnięcie w sklepie.
    Nie buduj na niej nowego kodu, nie sprawdziwszy, czy cokolwiek ją czyta.

**Podświetlenie celu zapala się przy PODNIESIENIU, nie przy najechaniu** (cyjan
= pasuje, czerwony = zły slot albo niespełniony wymóg). Palec zasłania ikonę,
więc „najpierw wyceluj, potem się dowiedz" to zła zamiana.

⚠ **Karta ma w panelu JEDEN adres — stałą kolumnę.** Do 2026-08-21 karta
była dymkiem przy kursorze i biła się o uwagę z kolumną (kolumna stała pusta
dokładnie wtedy, gdy było co w niej pokazać). Od etapu F (2026-10-13) dymka
(`ItemTooltip`) nie ma w ogóle — ⛔ nie wracaj do karty-okienka: zasłania to,
z czym gracz porównuje (research R5).

⚠ **Każdy nowy handler przeciągania musi sprawdzać SWÓJ znacznik** (`bagIndex`
w plecaku, `side` w sklepie). Oba panele słuchają tych samych zdarzeń całej
sceny; bez sprawdzenia przeciąganie zaczęte w jednym działa w drugim.

---

## ⚠ Pointery dotykowe: są DWA i to nie jest dużo

⚠ **Phaser domyślnie daje JEDEN pointer dotykowy.** `main.ts` podnosi
`input.activePointers` do **2** i ta linia jest nośna: bez niej `onTouchStart`
**po cichu wyrzuca** drugie równoczesne dotknięcie — bez zdarzenia, bez błędu.
Objaw sprzed poprawki (2026-08-23): trzymając joystick lewym kciukiem, **nie
dało się nacisnąć ani przycisku ataku, ani żadnej umiejętności**. Na desktopie
niewidoczne, bo ruch idzie z WASD, a klik z `mousePointer`.

**Budżet jest więc dokładnie dwa: lewy kciuk prowadzi, prawy działa.** Trzecia
kontrolka wymagająca RÓWNOCZESNEGO trzeciego palca nie zadziała, dopóki ktoś
świadomie nie podniesie tej liczby.

⚠ **Gest przeciągnięcia czyta się z listenerów SCENY, nie z obiektu przycisku.**
`GAMEOBJECT_POINTER_MOVE`/`_UP` przestają lecieć, gdy palec zjedzie z kontrolki
— a przy celowaniu zjeżdża natychmiast. Wzorzec (`VirtualJoystick`,
`AbilityBar`): zapamiętaj `pointer.id` na `pointerdown`, potem filtruj po nim
w `POINTER_MOVE` / `POINTER_UP` / **`POINTER_UP_OUTSIDE`**. Bez tej ostatniej
pary puszczenie poza płótnem zostawia sesję otwartą na zawsze.

⭐ **Tryb celowania „dotknij, potem cel"** (`Settings.aimMode = "tap"`,
2026-10-14): `AbilityBar` uzbraja sesję i stawia ŁAPACZA — przezroczysty
prostokąt na cały ekran pod przyciskami HUD-u (głębokość 999). Drążek widzi go
lokalnym testem trafienia i nie startuje, świat nie dostaje dotyku (sito 1).
⚠⚠ **Łapacz znika dopiero w NASTĘPNEJ klatce** — Phaser podaje zdarzenie
obiektu PRZED poziomem sceny, a drążek pyta `hitTestPointer` na poziomie
sceny; schowany od razu łapacz oddałby ten sam dotyk drążkowi. Punkt jedzie
do sceny gry w pikselach płótna (`abilityAimPointed`) — świat przelicza go
SWOJĄ kamerą, UI jej nie zna.

⚠ **Kierunek z przeciągnięcia nie wymaga konwersji do świata.** Obie kamery
skalują x i y jednakowo i nie obracają, więc znormalizowany wektor delty
policzony w przestrzeni UI **jest tym samym wektorem w świecie**. Punkt
wymagałby `getWorldPoint`; kierunek nie wymaga niczego. Nie dokładaj tam
przeliczeń „dla porządku".

---

## Ekwipunek: układ jest DANYMI, geometria jest LICZONA (od 2026-09-11)

Pełny zapis decyzji i odrzuconych układów:
`docs/decyzje/2026-09-11-ekwipunek-fundament.md`.

⭐⭐ **Od etapu D (2026-10-13) lalka to SYLWETKA, a nie krata** — jedna lista
`DOLL_CELLS` w `src/ui/PaperDoll.ts` dla panelu gracza i widoku „Na sobie"
w sklepie (`SHOP_DOLL_CELLS` = jej kafle `gear`). Obszar ciała = jeden kafel, ręce
wysokie na dwa pola, pas `planned`. Strona PLECAK: lalka | plecak 4 kol.
z torbami POD siatką | STAŁA kolumna karty (`ShopDetails`, ten sam renderer
co w sklepie). Geometria: `computeInventoryLayout` (`EquipLayout.ts`).
Dodanie slotu to JEDEN wpis w `DOLL_CELLS`. ⛔ Nie odtwarzaj drugiej listy
slotów „dla wygody" — `DOLL_LAYOUT` (krata 3×4 wypalona w `slots.png`)
i `EQUIP_CELLS` (krata panelu obok sylwetki sklepu) były takimi listami.
- ⭐ **E1 — jeden przełącznik warstw dla całej lalki** (`👁 Spód Środek
  Wierzch`): oko = „to, co widać" (najbardziej zewnętrzna warstwa, domyślne).
  Kropki pod kaflem mówią, ile warstw zajętych. ⚠ Upuszczenie na kafel
  warstwowy trafia w WARSTWĘ PRZEDMIOTU, nie w pokazaną (`dropTargetFor`) —
  warstwa jest wyprowadzana, nigdy wybierana.
- ⭐ **E2 — przełącznik zestawów NAD rękami**: segmenty `I`/`II` to WIDOK
  (które ręce pokazuje lalka, miniatury obu par zawsze widoczne), `⇄` to
  AKCJA (`Equipment.swapWeaponSet`). ⛔ Nie zlewaj ich w jeden przycisk.
- **Trzy liczby pod lalką** (obrażenia, ochrona, obciążenie — złote, gdy
  obciążenie już kosztuje). Pełny zestaw: pusty stan karty („Na sobie").
- ⚠ **Ikona w locie jest dzieckiem `bagGridList` z MASKĄ siatki** — na czas
  przeciągania maska obejmuje też kolumny lalki i karty (`setGridMaskWide`),
  inaczej palec niósł „nic" dokładnie nad celem. Błąd był starszy niż D.

⚠ **`EquipLayout.ts` i `PaperDoll.ts` są CZYSTE — zero Phasera, zero stanu.**
Układ, który liczy się bez sceny, sprawdza się bez uruchamiania gry. **Po każdej
zmianie układu albo rozmiaru panelu: `node tools/ekwipunek_uklad.mjs`** — pięć
ramek (kontrola `§0` musi świecić na zepsutej stronie): nakładki, wyjście poza
panel, próg dotykowy, adres bez kafla, ręce pod przełącznikiem, torby pod
siatką, karta ≥ 300 j.

⚠ **Pas NAD kolumną to osobna liczba od góry jej kafli** (filtr nad siatką,
przełącznik warstw nad lalką). Zlanie ich było pierwszą wersją i dawało
przyciski filtra narysowane NA pierwszym rzędzie kafli — **zgłoszone z renderu,
przy wszystkich asercjach arytmetycznych na zielono**.

⚠ **Dwa elementy dzielące jedno pasmo muszą liczyć się od TEJ SAMEJ krawędzi.**
Rząd toreb był centrowany w kolumnie, a pasek zestawów liczył swoją lewą krawędź
od krawędzi kolumny — weszły na siebie. Też tylko z renderu.

⚠ **Glif slotu i ikona przedmiotu wykluczają się nawzajem.** Pusty kafel mówi,
CO tu wchodzi; zajęty mówi, co tu leży. Do przebudowy glif był wypalony w tle,
więc ikona rysowała się NA nim i ciemny przedmiot nie odróżniał się od pustki.

⚠ **Rozmiar panelu liczy się RAZ, w konstruktorze** (`panelWidth`/`panelHeight`).
Okno zmniejszone później nie przebudowuje pięciu zakładek —
`PanelBase.reposition` dopasowuje panel SKALĄ. **Konsekwencja: wszystko, co
liczy w przestrzeni EKRANU, musi mnożyć przez `container.scale`** — maska
siatki, autoprzewijanie przy krawędzi i przewijanie kolumny karty
(`attachCardScroll`, punkt przez `uiScale()` i skalę — reguła sklepu niżej).

⭐⭐ **Filtr = ZAKŁADKI KATEGORII + WIDOK filtrowany** (`OI-130`, decyzja
autora 2026-10-11 — zastąpił przygaszanie: „to nie najlepszy sposób
filtrowania"). Wspólne dla półki kupca, plecaka w sklepie i plecaka w panelu:
`ItemCategory.ts` (czysty — która rzecz do której zakładki) + `CategoryStrip.ts`
(pasek: glify slotów, napis tylko na wybranej, przewijanie w poziomie).
- **Półka** filtruje naprawdę (`purchasable` po filtrze, `stockAll` całość) —
  kupiec nie ma układu do ochrony.
- **Plecak** dostaje mapę `kotwica → miejsce w widoku` (`bagView`/`playerView`,
  `packShelf`); ⛔ `Inventory.slots` nie rusza się ani o pole. Kafel ma numer,
  przeciąganie adresuje numerem, a zdjęcie sprzętu potrafi odmówić, bo plecak
  nie zagęszcza się sam — dlatego w widoku filtrowanym działa tapnięcie
  i przeciągnięcie NA lalkę/do kupca, ⛔ a pola nie są strefami upuszczania.
- ⚠ Pusta zakładka nie istnieje (`categoriesPresent`); zniknięcie wybranej
  kategorii wraca do „Wszystko” po cichu (`setItems(…, silent)`), inaczej
  `refresh → setItems → onChange → refresh` zagnieżdża się w sobie.
- Po zmianie kategorii albo nowym slocie: `node tools/filtr_przymiar.mjs`
  (pierwszy pas bez zakładki wpadłby do „Surowce”); geometria paska — `F2`
  w `tools/sklep_uklad.mjs`.

⚠ **Kolumna SZCZEGÓŁY ustępuje karcie przedmiotu, nie odwrotnie.** Statystyki są
tłem, karta jest odpowiedzią na pytanie, które gracz właśnie zadał. Obie
rysowane naraz w jednym miejscu to ten sam błąd, co najechanie kontra
zaznaczenie.

---

## Sklep: KUPIEC | GRACZ | KARTA (etap E, 2026-10-13)

Decyzje i pomiary: `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md`
(zastąpiła cztery kolumny z `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md`).

⭐⭐ **Trzy kolumny, każda kolumna przedmiotów z WŁASNYMI zakładkami** —
decyzje autora po zrzutach 1:1, ⛔ nie cofaj bez nowej:
- **towar kupca to KAFLE, nie lista wierszy** — ten sam kafel, co plecak
  (przedmiot wygląda tak samo wszędzie). Research rekomendował listę; autor
  wybrał kafle po zrzucie A/B. Cena leży NA kaflu (obrys), nazwa — na karcie;
- **kupiec i gracz widoczni NARAZ**, karta trzecią kolumną — sprzedaż to
  dotknięcie własnej rzeczy, ⛔ bez zakładki „Sprzedaj";
- ten sam przełącznik po obu stronach: kupiec **Kup | Odkup**, gracz
  **Plecak | Na sobie** — zawsze 2 + 2, niezależnie od kupca;
- naprawa należy do rzeczy GRACZA: „Napraw" na karcie, „Napraw noszone /
  wszystko" na wizytówce kupca (pusta karta). ⛔ Bez „Sprzedaj surowce" —
  surowce posłużą kiedyś do wyrobu; zbiorcza sprzedaż czeka na typ „złom";
- menu boczne w Handlu ma SAME IKONY (miejsce), w rozmowie podpisy zostają.

⚠ **Geometria: `computeShopLayout` w `src/ui/ShopLayout.ts` (CZYSTY, zero
Phasera).** Po każdej zmianie układu, półki kupca, `DOLL_CELLS` albo
`INVENTORY.cols`: `node tools/sklep_uklad.mjs` (sześć ramek ekranu; render:
`node tools/phone_render.mjs tools/phone_render_shop.json`). Obie siatki są
RÓWNE (4 kolumny = `INVENTORY.cols`), kafel trzyma normę dotyku (68 j.),
karta bierze resztę — kafel ustępuje tylko, gdy karta spadłaby pod
`cardMin`.

⚠ **Skala ikony w kaflu: margines 4 j., sufit ×2** — przy kaflu 68 j.
rysunek wchodzi w ×2, tak samo jak w panelu gracza (`I4`). Przy 6 j. sklep
rysował tę samą rzecz dwa razy mniejszą. ⛔ Nie rezerwuj pasa pod cenę —
spychał rzeczy `1×1` do ×1 przy `1×2` w ×2 (`I3`).

⭐ **Bez okien „Czy na pewno?"** — „↩ Cofnij" ostatniej transakcji (1:1, do
końca ROZMOWY — E3; napis dobiera się do miejsca) i **Odkup** z narzutem
(`SHOP.buybackMarkup`, per kupiec, w pamięci sceny UI — ⚠ świadomie nie
w zapisie i nie w module). Potwierdzenie zostaje dla rzeczy jakości ≥
`SHOP.confirmSellQuality`, amuletu i rzeczy zdejmowanej z siebie.
⚠ **Sprzedaną SZTUKĘ cofnięcie i odkup oddają jako TEN egzemplarz**
(`addInstance`, z zużyciem). Przez `addItem` wracał nowy — sprzedaż
uszkodzonego miecza i cofnięcie było darmową naprawą.
⚠ **Kilka zmian naraz → `batching`**: `Inventory.sellAt` emituje zmianę
synchronicznie, więc licznik Odkupu czytałby listę sprzed `rememberSold`.

⭐⭐ **Co karta MÓWI, decyduje `src/ui/ItemCard.ts` — jeden model, jeden
renderer** (`ShopDetails` w sklepie i w panelu gracza; dymek zniknął w F).
`node tools/karta_przedmiotu.mjs` buduje kartę dla wszystkich przedmiotów.
⛔ Nie dopisuj statystyki do renderera — wzór na procent bloku stał kiedyś
w dwóch miejscach i rozjechał się.
- ⭐ **D10: broń, tarcza i pierścień porównują się z OBOMA miejscami**
  (`compares`, zestaw I i II / pierścień I i II); pancerz z adresem slot +
  warstwa. Rzecz NOSZONA nie porównuje się wcale (`P3`/`P6` — na renderze
  miecz z zestawu I pisał „zamiast noszonego: Siekiera").
- **Obciążenie po → teraz stoi W BLOKU porównania**, nie w STANIE; osobny
  wiersz „Masa" zszedł (ta sama różnica w kg).
- **Porównanie pisze się strzałką `nowe → noszone`; kolor pada tylko na
  NOWE i znaczy KORZYŚĆ** (cięższe jest czerwone, choć liczba rośnie — znak
  z modelu). ⛔ Nie koloruj po `mine > theirs`; ⛔ nie wracaj do tabeli
  trzech kolumn.

⛔⛔ **WIERSZ TOŻSAMOŚCI MÓWI, CZYM RZECZ JEST — nie jak jest zbudowany
model.** Tarcza = „Tarcza · Druga ręka" (w danych `armor`), jedzenie =
„Jedzenie" (w danych `consumable` — chleb pisał się „Eliksir"). ⛔ O warstwę
`L1`/`L2`/`L3` pytaj WYŁĄCZNIE za cztery obszary ciała (`LAYERED_AREAS`;
`itemLayer()` odpowiada dla każdego pancerza — filtruje PYTAJĄCY). Pilnują
`T1`–`T3` w `karta_przedmiotu`.

⛔⛔ **KODY WARSTW `L1`/`L2`/`L3` NIE WYCHODZĄ NA EKRAN** — karta mówi
„wierzchnie wzmocnienie", chipy „Spód / Środek / Wierzch". Dwa słowniki:
`ARMOR_LAYER_LABEL` (system) i `ARMOR_LAYER_PLAYER`/`ARMOR_LAYER_SHORT`
(ekran). Pilnuje `T4`.

**Karta (`ShopDetails`, geometria `detailsColumn`) — reguły układu:**
- ⭐⭐ **PODGLĄD MA KSZTAŁT GABARYTU, a skala jest wspólna** — rzecz `1×1`
  kwadrat, `1×2` ramka dwa razy wyższa, ten sam mnożnik (`D4`/`D5`).
  Skala „pod obrazek" robiła tarczę mniejszą od hełmu.
- ⭐ **Ciało OBOK podglądu** (pod nazwą), gdy pas obok ma ≥ `BESIDE_W` j.
  (`beside`) — podgląd `1×2` (140 j.) spychał ciało w dół karty, a porównanie
  do przewijania. Karta szeroka (≥ `WIDE_CARD`, monitor) ma tytuły sekcji
  w lewym marginesie, oba porównania obok siebie i jeden rząd akcji.
- ⭐⭐ **PORÓWNANIE PRZYPIĘTE NAD AKCJĄ**, poza przewijaniem. W wąskiej
  karcie przy dwóch miejscach — **przełącznik „Zestaw I | Zestaw II" i JEDEN
  blok** (dwa bloki pod sobą wypychały porównanie). ⚠ Gdy przypięcie nie
  zostawia ciału `MIN_BODY_H`, porównanie wraca do ciała (zapasowe wyjście,
  ⛔ nie usuwaj); wtedy blok ma krawędzie wierszy W ŚRODKU — inaczej okno
  ucinało się przed całym blokiem i zostawiało dziurę na pół karty.
- **Kolejność informacji jest ustalona**: nazwa → typ i jakość → statystyki
  → porównanie → stan → wymagania → akcja; „Nie założysz tego" NA GÓRZE
  ciała. ⛔ Sekcja bez wartości się nie rysuje.
- **Przycisk główny = ostatnia akcja, z kwotą na napisie** („Kup · 340 g");
  odmowa nad nim („Brakuje 40 g"). Licznik `− n + Max` (Stardew: samo `+`
  przy dużej ilości to „2000 tapnięć").
- **Okno przewijania ma CAŁKOWITĄ liczbę wierszy** — także w ciele karty
  (`rowEdges`). Przecięty wiersz czyta się jak błąd rysowania.

⛔⛔ **GABARYT NIESIE POLE, NIE IKONA — i to jest reguła całego UI.** Rzecz
`1×2` ma JEDEN prostokąt na dwa pola (`fieldRect`), kafel przykryty chowa
ramkę; dotyczy półki, plecaka i odkupu. Ręce w sylwetce „Na sobie" są
wysokie na dwa pola — **to nadal JEDEN slot**. ⛔ Nie „ratuj" gabarytu
skalowaniem ikony.
- ⚠ **POLE TRAFIENIA = POLE.** W sklepie interaktywny jest prostokąt pola
  (`Rectangle.setSize` przestawia też `input.hitArea`). ⚠ Dla `Image`
  (panel gracza) `setInteractive(kształt)` ani `input.setHitArea` NIE
  podmienią kształtu obiektowi z wejściem — tam: `input.hitArea = …`,
  `hitAreaCallback`, `customHitArea = true`, potem ponownie `setDraggable`.
- ⚠ **Wierszy nie liczy się z liczby pozycji** — `packShelf` (półka, widok
  filtrowany plecaka) albo pojemność plecaka.

⛔⛔ **NIE PROJEKTUJ UI Z MODELU DANYCH — `L1`/`L2`/`L3` nie są slotami.**
Widok „Na sobie" to **sylwetka** z `DOLL_CELLS` (kafle `gear`,
`SHOP_DOLL_CELLS`): obszar ciała = jeden kafel z kropkami warstw, a karta
rzeczy noszonej ma chipy warstw. `Z1`/`Z2` w `sklep_uklad`: każdy adres
`EQUIP_SLOTS` pod dokładnie jednym kaflem. ⛔ Nie odtwarzaj drugiej listy
sylwetki.

⚠⚠ **Punkt z `pointer.x/y` wymaga DWÓCH przeliczeń:**
`(p.x / uiScale() − container.x) / container.scale` (strefa przewijania
leżała kiedyś 86% obok kolumny). ⛔ Maska to inny przypadek: `Graphics`
maski idzie przez kamerę, więc wchodzi **wyłącznie** `container.scale`.
Masek jest trzy: kafle kupca, plecak, ciało karty.

⚠ **Wybór na POINTER UP i tylko bez przewijania** (`scrollMoved` — Phaser
podaje `GAMEOBJECT_POINTER_UP` kafla PRZED `POINTER_UP` sceny). Przeciągania
między kolumnami dziś nie ma (dotknięcie + przycisk na karcie).

⚠ **Instrukcja mieszka pod `ⓘ`** — osiem haseł dyktowanych przez autora
(2026-09-19); etap E zmienił tylko zdania, które przestały być prawdą.
⛔ Nie dopisuj dziewiątego.
⚠ Kupiec, który nie naprawia, nie ma usługi na wizytówce; na KARCIE
uszkodzonej rzeczy dostaje wyszarzone „Tu nie naprawia" (tam gracz pyta).

## Lista + karta: zadania, szkolenie, Mistrzostwo, Postać, dziennik (etap F, 2026-10-13)

⭐⭐ **Wybór z krótkiej listy i jedna decyzja = `ListDetail`** (renderer)
+ `ListDetailLayout` (CZYSTA geometria, `panel_fit` §F z kontrolą). Panel
podaje DANE (`ListRow[]`, `ListCard`) i reaguje na wybór; przewijanie, maski,
wejście wierszy poza oknem i przycisk mieszkają w widżecie. ⛔ Nie buduj
kolejnej kopii kolumn „spis | szczegóły" w panelu — tak wyglądały
`QuestPanel`/`TrainerPanel`/`MasteryPanel` i strona Broń przed etapem F.
- **Treść ma wspólne źródła**: zadanie — `QuestCard` (tablica dawcy
  i dziennik), rodzina broni — `WeaponFamilyCard` (Mistrzostwo SPRZEDAJE,
  Postać → Broń tylko POKAZUJE — D5), umiejętność — `AbilityCard`
  (wiersze „etykieta: wartość" rozdzielane na dwie kolumny).
- **Pas akcji karty**: przycisk z kwotą w prawym dolnym rogu (`action`) ALBO
  rząd kafli wyboru miejsca (`picker` — pasek umiejętności: wolny kładzie,
  zajęty zamienia, złoty zdejmuje); nad nim jedno zdanie — `refusal`
  (czerwone) albo `hint` (wyciszone).
- ⚠ **Ciało karty ucina się na CAŁYM wierszu** (`bodyEdges` → maska) —
  przecięte „Niezgrabnie" pod paskiem przewijania złapał render 1:1.
- ⚠ Widżet liczy przez **macierz świata kontenera**, więc działa i jako panel
  usługi, i jako STRONA zagnieżdżona w panelu gracza (pod pasem podzakładek
  — kontener przesunięty o pół pasa). Maski odświeżaj przy `reposition()`.
- ⚠ Wybór trzymany jako ID (`QuestId`, `SkillId`, `WeaponFamily`,
  `AbilityId`), nigdy indeks — przyjęcie, nauka, oddanie przestawiają listę.

## Rozmowa z NPC

`NpcDialog` jest właścicielem **całej** rozmowy: bliskości, klawisza `E`, monitu
i **pauzy gry**. ⭐⭐ **Od 2026-10-14 rozmowa wygląda jak ROZMOWA, nie jak
zakładki** (autor; `docs/decyzje/2026-10-14-uslugi-jako-wypowiedzi.md`):
usługi to WYPOWIEDZI GRACZA w kolumnie odpowiedzi („Pokaż, co masz na
sprzedaż.”, „Czego możesz mnie nauczyć?” — `ServiceRow.line`), a szyna
usługi ma tylko imię, „‹ Rozmowa” i „Bywaj.”. ⭐ **Wiersz kolumny to ZDANIE,
nie przycisk** (wariant A, 2026-10-14): bez ramki i tła, ikona rodzaju
(dymek — pytanie, moneta — handel, księga — zlecenie…), cienka kreska pod
spodem, tło dopiero pod palcem; pole dotyku ma całą wysokość wiersza.
Pożegnanie to „Bywaj.” (wcześniej „Do widzenia”). ⛔ Nie wracaj do kafli
„Handel/Szkolenie” ani do zakładek wszystkich usług w szynie. Rama
(etap C, 2026-10-13) zostaje: wejście w usługę
ZWĘŻA kolumnę do szyny (`Rail`: imię NPC — E4, „‹ Rozmowa”, „Do
widzenia" na dole; ⛔ bez sakiewki — złoto pokazuje widok, który je wydaje),
a widok usługi (`ShopPanel` / `QuestPanel` /
`TrainerPanel` / `MasteryPanel`, `host: "frame"`) staje na lewo od niej —
⛔ bez własnego tytułu, ✕ i „← Wróć". Research: `docs/ui_mobile_research.md`
§8, `docs/research/ui_dialogue_frame_research.md` §4.
- ⚠⚠ **Usługi stoją w STAŁEJ kolejności** (`NpcDialog.SERVICE_ORDER`: Handel,
  Zadania, Szkolenie, Mistrzostwo) — wiersze-wypowiedzi nad „Omówione”,
  zawsze w tym samym miejscu. ⛔ Nie wracaj do „pilne na górę": pilność
  niesie ZNACZNIK (`!` `?` `+`) i dopisek przy wierszu, nie miejsce.
  ⚠ Wiersz „Wróćmy do twoich zleceń.” jest CICHY — „!”/„?” zleceń stoją już
  jako własne wiersze nad pytaniami (D4); drugi znacznik był dublem.
  ⚠ Podpis kafla szyny mieści się w 134 j. — „Wróć do rozmowy” nie mieścił
  się i ostrzegł `[Rail]` w konsoli, stąd „‹ Rozmowa”.
- ⚠ **Wstecz = JEDEN poziom** (`E`, `Escape`, Android Back → `NpcDialog.back`):
  okno w widoku → usługa → „Rozmowa" → grupa/„Omówione" → korzeń → koniec.
- ⚠ **Stan zakładki trwa do końca rozmowy**: druga wizyta w usłudze to
  `restore`, przejście na inną — `suspend`; pełne `hide` dopiero przy „Do
  widzenia". ⚠ `ShopPanel.refresh` CELOWO czyści zaznaczenie, więc `restore`
  stawia je z powrotem — nowy widok z takim `refresh` musi zrobić to samo.
- ⭐ **Grupy tematów (D14)**: temat z `group` (`TOPIC_GROUPS`) liczy się
  w wierszu grupy („Opowiedz mi o ziołach · 4 nowe tematy ›"); w grupie —
  okruszek nad listą, „‹ Zmień temat" nad „Bywaj.”, bez bloku usług.
  Pusta grupa znika (kolumna wraca do korzenia). Tematy do zadania stoją
  w korzeniu zawsze. Już zadane → „Porozmawiajmy o…” (od 2026-10-14;
  wcześniej „Omówione (n)” — autor: „dziwnie brzmi”), liczba w dopisku.
- ⚠ Szyna leży NAD widokami usług (głębokość 1402 > 1400) — przyciemnienie
  widoku (`PanelBase.scrim`) pokrywa cały ekran, także pod szyną.
- ⭐ **Szyna ma dwie gęstości**: z podpisami i SAME IKONY dla widoku gęstej
  treści (`DialogView.denseRail` — dziś Handel, decyzja autora 2026-10-13);
  od 10-14 to dwa kafle: powrót do rozmowy i ✕.
  ⚠ Kafle stoją na TYCH SAMYCH wysokościach w obu (miejsce tożsamości zostaje
  puste) — `S7` w `panel_fit`; pierwsza wersja przestawiała je o 84 j.
- ⚠ Arkusz **nie ma skali** (`PanelBase.reposition` go nie dotyczy) — liczy
  geometrię z `uiW`/`uiH` przy każdym rysowaniu; przyciemnienie świata jest
  interaktywne na całym ekranie, inaczej dotyk nad pasem trafiałby w drążek.
- ⚠ **Strony wypowiedzi tnie się na granicach ZDAŃ, mierząc zawinięte wiersze**
  niewidocznym `Text` o tym samym stylu — nie liczbą znaków. Przebudowa listy
  (zdarzenie) nie może cofać strony (`pagesKey`).
- ⚠ **Blokada `INPUT_GUARD_MS`** po nowej wypowiedzi: tapnięcie przewijające
  nie trafia w odpowiedź, która pojawiła się pod palcem. „Bywaj.” jej
  nie podlega i stoi pod przerwą.

⚠ **Te widoki NIE pauzują i NIE wznawiają same** — pauza należy do rozmowy, bo
inaczej przejście ze sklepu do trenera na moment odpauzowałoby świat.
Klawisze: `E` i `ESC` cofają o JEDEN poziom (`back()`), tak samo Android Back.

⚠ **Klawiatura ma ognisko: `src/ui/KeyFocus.ts` (`OI-52`, 2026-10-09).**
Modal przy otwarciu bierze `KeyFocus.take(...)`, przy zamknięciu `release`;
obsłużone naciśnięcie oznacza `consume(e)`. Klawisz ŚWIATA pyta
`worldMay(e)`. ⚠ Samo `owner` nie wystarcza: rozmowa zwalnia ognisko W TRAKCIE
obsługi, a `ContextAction` (zarejestrowany później) dostaje ten sam obiekt
zdarzenia — bez `consume` `E` zamykał rozmowę i otwierał ją z powrotem.

⚠ **NPC z zadaniem MUSI mieć `greetings`.** `pickGreeting` sięga po
`firstJob`/`turnIn`/`working`, a NPC z zadaniem i bez linii renderował pusty
dymek. Każda gałąź ma dziś zejście na zwykłe `greeting`, ale i tak napisz linie.

⚠ **Wiersze rozmowy są WARUNKOWE.** Wszystkie trzy renderowały się kiedyś zawsze,
więc gadający mieszkaniec bez sklepu oferował Handel/Zadania/Szkolenie do trzech
pustych pokoi — to czyta się jak zepsuty sklep, nie jak człowiek. Ramka jest
wymiarowana pod najgorszy przypadek i centruje tyle wierszy, ile NPC ma naprawdę.

⭐⭐ **Arkusz pokazuje CHWILĘ rozmowy, nie SPIS tematów (od 2026-10-09).**
Wypowiedź NPC w pasie, odpowiedzi gracza w kolumnie (front = `available ∧
¬asked`, tematy do zadania pierwsze, kontynuacje bieżącego tematu przed resztą),
już zadane w „Omówione (n)". ⛔ Nie wracaj do listy wszystkich
`Dialogue.available()` jako widoku głównego — to był układ „spis treści +
hasło", przez który rozmowa czytała się jak wiki (`OI-87`). ⚠ „Omówione"
i grupa to własne poziomy: `ConversationSheet.back()` cofa je do korzenia,
zanim `NpcDialog` zamknie całość.

⭐ **D4 (etap F, 2026-10-13): zadanie bierze się i oddaje W ROZMOWIE.**
W korzeniu kolumny, nad pytaniami: „?" do oddania (dotknięcie oddaje
i pisze nagrodę), „!" do wzięcia (opis w głosie dawcy w pasie — poziom
`offer`: „Biorę to." / „‹ Jeszcze nie"). Zakładka Zadania zostaje
przeglądem z tymi samymi przyciskami — dwie drogi do JEDNEJ operacji
`Quests`. ⭐ **Od 2026-10-15 zadanie może wyrastać z TEMATU** (`offersQuest`
+ `requiresTopic`, pierwszy Gniewko): po odpowiedzi kolumna przechodzi
w poziom `offer` bez „Masz dla mnie robotę?”, a pas zostaje z odpowiedzią
rozmówcy — dlatego podpis oferty niesie CEL (`Ubij: Wilk ×3`) pod nazwą
zadania. ⛔ Wypowiedź po decyzji to linia z danych (`working`) albo suchy
komunikat w nawiasie — przy oddaniu: `greetings.done` dawcy + nagroda w nawiasie (autor 2026-10-15); nowe kwestie wg „Mowa mieszkańców” w `docs/swiat.md`.

⚠ **Wiersze arkusza mają WŁASNY dźwięk kliknięcia** (`buildRow`) — nie są
budowane przez `PanelBase.makeButton`, więc go nie dziedziczą. To najczęściej
naciskane przyciski w grze.

---

## Geometria prawego dolnego rogu ma JEDEN dom

**`ControlLayout.ts`** — `combatAnchor()`, `ringSlot(ring, index)`,
`ringCell()`, `ringCapacity()`. Strojone liczby (promienie, kąty, rozmiary)
mieszkają w `HUD_LAYOUT` w `GameConfig.ts`, tam też stoi pomiar zasięgu kciuka.

⚠ **Widżet NIE liczy własnej pozycji.** Pyta o slot, dostaje punkt. Do
2026-08-20 geometria była eksportowana z `QuickSlot` (czterema funkcjami) — to
była połowiczna naprawa 11-pikselowej nakładki: liczby miały jeden dom, ale dom
był widżetem, który sam był ich klientem, więc nowy element importował „z quick
slota", co nic nie znaczy.

⚠ **Kontrolki leżą na TRZECH PIERŚCIENIACH wokół przycisku ataku, nie
w kolumnie — i to jest wynik pomiaru.** Kolumna dawała piątemu przyciskowi
**60 mm** od przegubu kciuka przy zasięgu funkcjonalnym ~55 mm; rząd poziomy —
57 mm skrajnemu; łuk trzyma wszystkie w paśmie 20–44 mm. Łuk jest jedynym
kształtem, w którym przyciski są RÓWNO oddalone od kciuka.

⚠ **O pierścieniu decyduje PILNOŚĆ × CZĘSTOTLIWOŚĆ, nie kategoria.**
Przenosząc coś między pierścieniami, przenosisz sąd o częstotliwości.
⭐ **Od 2026-10-12 pierścień to GEOMETRIA (`inner`/`middle`/`outer`/`context`),
a co na nim stoi, mówi `HUD_LAYOUT.place`** — widżet pyta `slotOf(kind, i)`,
`cellOf`, `visualOf`, nie `ringSlot` z nazwą rodzaju. Powód: do tej daty
pierścień nazywał się rodzajem („types"), więc przesunięcie umiejętności bliżej
kciuka wymagało przemianowania łuku. Ten sam dzień przyniósł zmianę sądu:
typ ataku zmienia się raz na walkę (autor), więc zszedł do JEDNEGO przycisku
na `outer` z kolumną wyboru (`AttackModeButton`, `modeMenuSlot`), a `inner`
dostały umiejętności 1–3. Typ obrażeń dalej widać zawsze — na przycisku ataku.
⚠ **Dwa rodzaje na jednym slocie** łapie §5 `hud_uklad.mjs` (odległość 0
arytmetyka przepuściłaby jako „ta sama kontrolka").

⭐ **Tryb ataku i zmiana zestawu to PARA** (`outer` 2–3, od 2026-10-12, autor:
„jeden zmienia broń, drugi typ obrażeń dla niej"): równa waga wizualna,
wspólna podkładka rysowana przez `WeaponSwapButton.paintPlate`, gdy istnieją
oba. ⚠ Satelita przy samym przycisku ataku (wzór MOBA) odpada: pierścień
wewnętrzny niesie umiejętności 1–3, a mniejszy niż `minTouch` łamałby próg.
`middle` 3 jest wolne — rezerwa na 7. umiejętność / „ultimate".

⚠ **Kąt jest przypisany do SLOTU, nie do kolejności.** Umiejętność w slocie 2
stoi w tym samym miejscu przy dwóch i przy czterech noszonych; puste sloty się
nie rysują. Nauka trzeciej nie może przestawiać dwóch pierwszych pod kciukiem.

⚠ **Próg dotykowy to `HUD_LAYOUT.minTouch` = 68 j. = 48 CSS px** (norma
Material 48 dp). Przed przebudową **wszystko poza przyciskiem ataku było pod
progiem**: umiejętności 50 j. (5,9 mm), warianty 44 j. (5,2 mm). Pilnuje tego
`assertTouchTargets()` wołane z `UIScene.create()`.

⚠ **Prawa krawędź: margines `HUD_LAYOUT.edgeRight` (24 j.), NIE pas
nawigacji** — od 2026-10-11. Do tej daty stała tu rezerwa 80 j. pod pasek
Samsunga (zmierzony: ostatnie 40 j.), bo był widoczny na stałe. `MainActivity`
chowa go dziś w trybie immersive i pasek wysuwa się tylko na chwilę po geście
od krawędzi (zgłoszone z telefonu autora), więc rezerwa zeszła, a klaster
walki przesunął się o 56 j. bliżej kciuka. ⚠ Wysunięty pasek na moment ZAKRYJE
prawy skraj klastra — przyjęty koszt. `env(safe-area-inset-*)` nic nie daje:
w trybie immersive paski raportują zero.

⚠ **Po każdej zmianie kąta, promienia albo rozmiaru: `node tools/hud_uklad.mjs`.**
Uruchamia PRAWDZIWY `ControlLayout.ts` i sprawdza nakładki, wyjście poza ekran,
margines krawędzi, próg dotykowy i zasięg kciuka. Pierwsza wersja kątów trafiała
w prześwit 87,0 j. przy wymaganych 87,0 — o wynik decydował szum
zmiennoprzecinkowy, dokładnie jak przy `SHIELD.blockArcDeg`. **Dwie liczby,
które mają być równe, nie nadają się na próg.**

---

## Prawy górny róg: minimapa = MAPA, przycisk menu = panel (od 2026-10-12)

**Minimapa otwiera zakładkę MAPA** — odruch z każdej innej gry (Wild Rift,
Diablo Immortal, Genshin). Od 2026-10-11 do 2026-10-12 otwierała panel na
ostatniej zakładce i potrzebowała znaczka ☰, żeby to w ogóle zapowiedzieć.
**Wejściem do panelu jest `MenuButton`** — kwadrat z plecakiem NA LEWO od
minimapy (`ControlLayout.menuButtonRect`, `HUD_LAYOUT.menuButton`); otwiera
panel na ostatniej zakładce innej niż mapa (`PlayerPanel.menuTab`, domyślnie
PLECAK). Odznaka poziomu w ramce postaci otwiera POSTAĆ
(`EVENT.playerPanelRequested`). Właściciel obu wejść: `PlayerPanel`.

⚠⚠ **Na telefonie przycisk menu jest JEDYNYM wejściem do ekwipunku i zapisu**
— ikona jest rysowana (`UiIcons`), nie zależy od żadnej tekstury. ⛔ Nie
uzależniaj jego istnienia ani klikalności od obrazu.

⭐ **Rząd przy minimapie to miejsce na PRZYSZŁE ikony** (sklep, poczta,
wydarzenia): rosną W LEWO od przycisku menu, a pasek buffów — na lewo od
nich. ⛔ Nie do klastra walki i nie pod minimapę (tam stoi `E`).

⚠ **Bok minimapy 108 j. jest wyprowadzony z przycisku `E`**, który stoi prosto
pod nią (`rings.context`). Pilnuje tego `node tools/hud_uklad.mjs` §6
(prostokąt kontra koło), a przycisk menu — §6b.

⚠ **Otwarty świat = jedna minimapa sklejona z obrazów obszarów**
(`WorldState.regions`). Per obszar przeskakiwałaby na szwie.

⭐ **Oprawa minimapy = kartka PERGAMINU** (2026-10-13, D15, referencja:
ramka mapy z Minecrafta — `MapParchment.ts`, czysty): kontur z nacięciami
i rozdarciami, pas przy mapie, cień („kartka wisi"), czysty pergamin pod
rysunkiem. ⚠ Kartka z cieniem stoi W ŚRODKU kwadratu 108 j. — płaci okno
mapy (92 j.), nie prześwit do `E`; pilnuje `hud_uklad.mjs` §6c (z kontrolą).
⚠ „Piksel" kartki = kafel mapy (2 j.), a postrzępienie liczy się ze skrótu
pozycji, ⛔ nie z `Math.random` — brzeg nie może się zmieniać co scenę.

⚠ **Wycinek robi `setCrop`, nie maska** — zero bufora szablonu i zero pułapki
„maska w przestrzeni ekranu". `zoom` tylko 1/4, 1/2 albo całkowity (obraz ma
4 px na kafel), inaczej przycięcie wypada w ułamkach teksela.

⚠ **Obraz to `tools/build_minimap.py --zapisz`** — gracz widzi go cały czas,
więc **po zmianie zabudowy, pól albo rozstawu drzew przepuść generator**.

⭐ **Mgła i Kartografia (2026-10-14, `docs/systemy/world.md` §5.1).** Minimapa
i strona MAPA rysują z tekstury MGŁY (`MapFog.fogTexture`), nie z obrazu
minimapy wprost — ⛔ nie wracaj do `minimapKey` w widżecie, bo mapa
pokazałaby teren, którego gracz nie widział. Minimapa istnieje dopiero
z Kartografią II (bez niej: schowana I z wyłączonym wejściem), strona MAPA
z Kartografią I. ⚠ `MapFog` dorysowuje tylko komórki ze zdarzenia
`explorationChanged`; całość maluje się wyłącznie przy `cells: null`.
⚠ Nowy obszar świata = wpis w `MAP_ATLAS` (inaczej nie ma go w widoku
„Świat”); rozmiar bierze się z obrazu minimapy (`MAP_FOG.minimapPxPerWorld`).
Po zmianie atlasu, portalu, mapy albo obrazu minimapy:
`node tools/mapa_przymiar.mjs`.
⭐ **Cele zadań na mapie i minimapie** (`MapQuestMarks.ts`, 2026-10-14):
zielone `?` (oddaj) i złoty dymek (porozmawiaj — krok ŚLEDZONEGO zadania),
ten sam odczyt co nad głową (`NpcStatus.npcQuestMarker`). ⚠ Widoczne także
we MGLE (gracz wie, dokąd iść); `!` i `+` zostają w świecie. ⛔ Nie licz
celów drugi raz w UI — pytaj `mapQuestMark`.

⚠ Akcja na **puszczeniu** (test trafienia `hitTestPointer` na `POINTER_UP`
sceny) i **ta sama bramka `KeyFocus` co skróty klawiszowe** — bez niej
tapnięcie w trakcie rozmowy otwierało panel NA niej (`OI-52`). Dotyczy
minimapy, przycisku menu i odznaki poziomu.

---

## Oprawa wspólna: ikony, pasek zakładek, dymki (od 2026-10-12)

- **`UiIcons.ts`** — ikony oprawy rysowane `Graphics` (ostre przy każdym
  powiększeniu kamery UI), jednobarwne: stan niesie KOLOR wołającego.
  Moneta (`drawCoin`) ma stopień (`gold`/`silver`/`copper`) — pod trzy
  stopnie monet z `docs/odlozone.md` §1. ⛔ Ikony PRZEDMIOTÓW zostają
  pixel-artem: to treść, nie oprawa.
- **Dziennik: podzakładki „Aktywne (n) | Ukończone (n)”** (2026-10-14), ten
  sam pas co Postać (`SUB_TAB`); tracker HUD-u otwiera „Aktywne”.
- **Umiejętności BIERNE** (wpis `SKILLS` bez `unlocksAbility` — Skórowanie,
  Pieczenie, Kartografia) stoją na liście Postać → Umiejętności POD czynnymi
  (2026-10-14; wcześniej nie było ich nigdzie): karta bez rzędu slotów.
- **Strony panelu gracza na ROLACH tekstu** (etap F): `PlayerPanel.ts`
  jest na liście `NA_ROLACH` (`panel_fit` §L) — ⛔ żadnego `fontSize: "12px"`.
  Podzakładki Postaci 52 j., Cechy (wiersz 32 j., „+" 52 j.), Opcje
  (przyciski 56 j.), Mapa (podpisy mieszkańców `small`).
- **Nawigacja panelu gracza = SZYNA** (`Rail`, etap D 2026-10-13, D13):
  sakiewka u góry, zakładki ikona + podpis (kropka na „Postać", gdy są
  punkty), „Wróć do gry" na dole (E5). Poziomy `TabBar.ts` (pas 56 j. nad
  KAŻDĄ stroną) został usunięty; `formatAmount` mieszka w `theme.ts`.
  ⛔ Nie wracaj do paska u góry — w poziomie brakuje wysokości (research R2).
- ⭐ **Samouczek walki u Patryczka** (2026-10-15, `COMBAT_TUTORIAL`): krok
  liczy `GameScene.updateCombatTutorial` z ŻYWEGO stanu (dystans, zwrot,
  trafienia) i ogłasza `EVENT.tutorialStep` + migawką `WorldState.tutorial`
  (widżety powstające później czytają ją przy starcie). `TutorialGuide` —
  ramka z głosem Patryczka u góry, ⛔ bez wejścia (nie połyka dotyku),
  chowa się pod rozmową/panelem (`KeyFocus`); `AttackButton` pulsuje
  obrysem w kroku `attack`. Kroki mijające same z trafieniami (`keep`,
  `switch`) trzymają `minReadMs` i idą po jednym — autoatak kija zadaje
  trzy trafienia w ~1 s.
- **`CoachMark.ts`** — dymek „pierwszego razu" przy kontrolce, która właśnie
  się POJAWIŁA. Raz na urządzenie (`localStorage`, ⚠ świadomie nie w zapisie),
  jeden naraz, nie na modalu, czeka na `CombatHint` (`holdFor`), gaśnie na
  dowolne tapnięcie i ⛔ go nie połyka. Nowy dymek = `CoachMark.once(id, …)`
  w miejscu, w którym kontrolka staje się widoczna — nie na starcie gry.

⭐ **Karta przedmiotu niesie CEL, gdy cel jest dwuznaczny**
(`PlayerPanel.equipTargetsFor`): broń i tarcza → „Załóż · Zestaw I / II",
pierścień przy dwóch zajętych → „Zamień · pierścień I / II". Odmowę nazywa
ta sama ścieżka co upuszczenie na kafel (`dropOntoEquipSlot`). ⛔ Nie wracaj
do jednego „Załóż" przez `slotForItem` dla rzeczy z dwoma miejscami.

⭐ **Pusty kafel lalki filtruje plecak** do zakładki tego slotu
(`categoryOfSlot` + `CategoryStrip.select`) — „najpierw slot". Zajęty kafel
pokazuje kartę i ⛔ nie rusza filtra ustawionego przez gracza.

---

## Oprawa panelu i rama (od 2026-10-13, etap B)

- **Tło panelu ma krycie 1,0, a pod panelem leży przyciemnienie na CAŁY
  ekran** (`PanelBase.scrim`, krycie 0,85, interaktywne). Przy 0,95 przez
  panel prześwitywał HUD, a podwidoki 816×440 stały z HUD-em dookoła.
  ⚠ Przyciemnienie jest PIERWSZYM dzieckiem kontenera (widoczność idzie za
  panelem bez zachodu w podklasach), a `layoutScrim` liczy je odwrotnie przez
  pozycję i skalę kontenera. ⛔ Nie dodawaj nic `addAt(0)`/`sendToBack` do
  kontenera panelu — wyląduje POD przyciemnieniem.
- **Panel ma obszar GOSPODARZA**: `host` w konstruktorze `PanelBase` —
  `"frame"` (obszar na lewo od szyny, `FrameLayout.serviceArea` — usługi
  rozmowy i, od etapu D, panel gracza z własną szyną), `"frame-dense"` (obok
  szyny samych ikon — Handel) albo `"screen"` (cały ekran). Centrowanie i skala
  (`panelFitScale`) liczą się do obszaru, nie do okna.
- **Szyna** (`Rail.ts`, geometria `FrameLayout.computeRailLayout`): tożsamość
  i sakiewka u góry, zakładki ikona + podpis (kafel ≥ 68 j.), wyjście NA DOLE
  (E5) pod przerwą ≥ 16 j., cichy wygląd. Kafel zakładki i kafel usługi to
  JEDEN rysunek (`buildTile`). Poniżej 1000 j. szerokości (okno pionowe)
  szyna przechodzi w same ikony — telefon zawsze ma podpisy (`S6`).
- **Rozmiary paneli mają jeden dom**: `FrameLayout` (`PLAYER_PANEL`,
  `subviewSize`) i `ShopLayout` (`shopPanelW/H`). ⛔ Nie wpisuj rozmiaru
  w `super(scene, 816, …)`.
- ⚠ **Po zmianie rozmiaru panelu, szyny albo obszaru: `node
  tools/panel_fit.mjs`** (`OI-68`) — sześć ramek, panele w swoich
  obszarach, szyna, próg dotyku, role tekstu, skan literałów; kontrole `§0`
  muszą świecić na czerwono na zepsutych danych.

---

## Panele: dwie rzeczy, które nie wychodzą w liczbach

⚠ **`GeometryMask` (przewijane listy i ciała kart) żyje
w przestrzeni EKRANU**, a panel jest wycentrowany na zmieniającym rozmiar
widoku — więc odświeżenie maski musi wisieć na `reposition()`. Jej `Graphics`
nie jest na liście wyświetlania, więc niszczy się go ręcznie na `SHUTDOWN`.

⚠ **Maska przycina RYSOWANIE, nie WEJŚCIE.** Element wyprowadzony przewijaniem
poza okno jest niewidoczny, ale dalej trafialny — a nad oknem listy stoją
tytuł i podtytuł panelu, więc tapnięcie w nie odpalałoby pozycję, której nie
widać. Przewijana lista **klikalnych** pozycji musi im wyłączać wejście poza
oknem (dziś `CategoryStrip.syncInput` i `ListDetail.setListScroll`).

⚠ **Przy przewijanej liście klikalnych pozycji łapacz pod spodem NIE
wystarcza.** Wzorzec z dziennika zadań (przezroczysty prostokąt zbierający
kółko i ciągnięcie) działa tam, gdzie karty nie mają wejścia; tam, gdzie każdy
wiersz jest przyciskiem, palec nigdy nie ląduje na łapaczu. Ciągnięcie musi
startować także na wierszach, a kliknięcie odpalać się na **pointer UP za flagą
`dragged`** — inaczej każde przewinięcie otwiera pozycję, na której palec stanął.

⚠ **Ruch i puszczenie łap na poziomie SCENY, nie obiektu.** Palec ciągnący listę
wyjeżdża poza wiersz, na którym wystartował, a `GAMEOBJECT_POINTER_MOVE`
przestaje wtedy lecieć — przewijanie zamiera w połowie gestu.

⚠ **`GAMEOBJECT_POINTER_WHEEL` ('wheel') to zdarzenie per-obiekt;
`GAMEOBJECT_WHEEL` ('gameobjectwheel') to zdarzenie wtyczki sceny o innej
sygnaturze.** Podpięte do obiektu to drugie **po cichu nigdy nie odpala** — bez
błędu, po prostu kółko nic nie robi.

⚠ **Rząd slotów/zakładek liczony ze stałych PRZERASTA panel po cichu.** Rząd
ekwipunku był wymiarowany pod siedem slotów, lista urosła do dziesięciu i ostatni
pierścień wisiał **poza ramką** — bez błędu gdziekolwiek, przez dwa dodania
slotu. Wymiaruj z `EQUIP_SLOTS.length`, zawijaj, i **ostrzegaj w konsoli**, gdy
wynik wyjdzie poza panel. Z tego samego powodu rozmiar czcionki paska zakładek
zależy od ich LICZBY, a nie jest stałą.

⚠ **Po każdej zmianie układu przemieć WSZYSTKIE dzieci strony względem granic
panelu.** Podpis wyjeżdżał za prawą krawędź i nic w liczbach układu tego nie
mówiło; zgłoszone ze zrzutu ekranu.

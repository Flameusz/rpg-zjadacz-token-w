---
typ: OPERACYJNE
domena: proces
tytul: Pomysły — kierunki przed wejściem do pracy
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-12
---

# Pomysły — kierunki rozwoju

> **Czym jest ten plik.** Zapis kierunków, które autor chce mieć zanotowane,
> zanim staną się czymkolwiek więcej. **Nic tutaj nie jest zatwierdzone do
> implementacji** i nic nie opisuje stanu gry.
>
> ⚠ **To NIE jest `docs/odlozone.md`.** Tamten plik trzyma rzeczy, które
> **wyszły z pracy** — zaparkowane z konkretnym wyzwalaczem („czeka na decyzję
> autora", „czeka na playtest") oraz barierki, czyli rzeczy, których celowo
> NIE robimy. Tutaj leżą rzeczy, które do pracy jeszcze **nie weszły**: szkice
> kierunku bez wyzwalacza, bez zakresu i bez zobowiązania. Gdy pomysł zaczyna
> mieć warunek uruchomienia, przenosi się do `odlozone.md`.
>
> ⚠ **Nie traktuj wpisu stąd jako specyfikacji.** Poziomy, nazwy i przykłady
> są ilustracją myśli, nie ustaleniem.

---

## Kartografia — przyszła umiejętność świata

**Status:** ⭐ **poziomy I–II i mgła W KODZIE od 2026-10-14** — stan:
`docs/systemy/world.md` §5.1. Decyzje autora: I u Myśliwego za darmo (mapa),
II u Sołtysa za złoto (minimapa), bez II róg minimapy pusty, pamięć terenu
zawsze. Poziom 3 i reszta niżej — dalej pomysł, **nie implementować** bez
decyzji.

### Założenie

Kartografia ma być przykładem **umiejętności użytkowej niezwiązanej
bezpośrednio z walką**. Jej celem jest stopniowe rozwijanie orientacji gracza
w świecie oraz naturalne uczenie systemów gry.

### Potencjalny rozwój

**Poziom 1**

- darmowa nauka na początku gry (np. od myśliwego jako element onboardingu),
- odblokowanie podstawowej mapy,
- widoczna własna lokalizacja,
- odkrywanie odwiedzonych obszarów (mgła wojny).

**Poziom 2**

- możliwość zdobycia wiedzy od NPC (np. wójt),
- oznaczanie ważnych miejsc,
- pinezki gracza,
- widoczne wybrane informacje o NPC.

**Poziom 3**

- oznaczanie miejsc występowania roślin/surowców,
- rozpoznawanie typów NPC (np. nauczyciel, handlarz),
- oznaczanie NPC związanych z zadaniami.

### Dopisek autora (2026-10-12): minimapa jako PERGAMIN + odkrywanie

- **Minimapa i mapa w formie kartki pergaminu**: postrzępiona krawędź jak
  mapa w Minecrafcie — referencja wyłącznie dla krawędzi (zrzut autora
  z 2026-10-12). Dwa cele naraz: kartka **wyraźnie odcina mapę od świata
  gry** (dziś minimapa to prostokąt z ramką, który zlewa się z HUD-em),
  a przy tym nadaje jej klimat. ⚠ Pole dotyku minimapy dalej ≥ `minTouch`
  i bok wyprowadzony z przycisku `E` pod nią (`HUD_LAYOUT.minimap`,
  `tools/hud_uklad.mjs` §6) — postrzępiony brzeg rysuje się W ŚRODKU tego
  kwadratu, nie poza nim.
  ✅ **Minimapa w kartce: 2026-10-13** (`src/ui/MapParchment.ts`; okno mapy
  92 j. w kwadracie 108). Otwarte: zakładka MAPA w tej samej oprawie.
- **Odkrywanie terenu (mgła wojny)** na mapie i minimapie — obszar
  nieodwiedzony to czysty pergamin, odwiedzony dostaje rysunek.
- **Kartograf jako umiejętność, która ODBLOKOWUJE mapę i minimapę**, a dalej
  drzewko innych możliwości (poziomy 1–3 wyżej). ⚠ Kłóci się z dzisiejszym
  stanem, w którym minimapa jest od pierwszej klatki — przed decyzją trzeba
  rozstrzygnąć, co gracz widzi BEZ Kartografa (np. sama strzałka na czystym
  pergaminie) i czy pierwszy poziom nie powinien przyjść w pierwszych
  minutach gry (onboarding — `docs/odlozone.md` §3).
- ⭐ Interfejs jest na to przygotowany: minimapa i zakładka MAPA to jedno
  wejście (`Minimap` → `PlayerPanel.openTo("map")`), więc i pergamin, i mgła
  są zmianą rysunku, nie przepięciem nawigacji.

### Czego ten wpis NIE przesądza

Nie projektuje implementacji, nie zakłada systemu „umiejętności świata" jako
osobnej mechaniki i nie rozstrzyga, czy Kartografia miałaby korzystać
z istniejących `SKILLS` (nauka u trenera), czy z czegoś innego. To zapis
kierunku, nie plan.

---

## Kościany poker w karczmie — minigra poboczna

**Status:** pomysł autora (2026-10-14). **Nie implementować** bez decyzji.

### Założenie

Gra w kości na zasadach pokera, **ta sama logika co w Wiedźminie** (autor):
minigra przy stole w karczmie Bogusza. Pasuje do świata — kości są
średniowieczne i wiejskie, nie wymagają kart ani niczego spoza „ciepłego
realizmu” (`docs/swiat.md`) — i daje rozgrywkę poboczną bez walki.

### Zasady w wersji z Wiedźmina (punkt wyjścia)

- Każdy gracz ma **pięć kości**. Rzut, potem **jeden przerzut**: wybierasz,
  które kości rzucić ponownie (od zera do wszystkich).
- Stawka przed rzutem i podbicie przed przerzutem.
- Układy, od najsłabszego: nic · para · dwie pary · trójka · mały strit
  (1–5) · duży strit (2–6) · ful (trójka + para) · kareta (cztery) ·
  poker (pięć jednakowych). Remis układu rozstrzygają oczka.
- Partia do dwóch wygranych rund.

### Do rozstrzygnięcia przed projektem

- Z kim się gra: stali bywalcy karczmy (kto z obsady, `swiat.md`), czy
  przyjezdni; czy przeciwnicy różnią się siłą (ostrożny / ryzykant).
- Stawki i limit: złoto gracza to waluta całej gry — minigra nie może stać
  się kranem złota (por. „nieskończony kran” w `src/core/CLAUDE.md`).
- Czy jest nagroda poza złotem (temat rozmowy, zadanie, przedmiot) i czy
  rośnie umiejętność gry (lepszy przerzut, „czytanie” przeciwnika).
- Prezentacja: kości jako modele 3D na stole czy widok 2D panelu; obsługa
  dotykiem (dotknięcie kości = zaznacz do przerzutu, jeden przycisk „Rzuć”).
- Wejście: rozmowa z karczmarzem (nowa usługa w ramie rozmowy) czy stół
  jako rzecz w świecie.

---

## Władanie bronią — przyszły system mistrzostwa

> ## ⚠ STATUS NIEAKTUALNY — POMYSŁ WSZEDŁ DO PRACY (2026-09-01 … 2026-09-03)
>
> **Obowiązującym dokumentem jest `docs/systemy/proficiency.md`** (projekt,
> pomiary, zamknięte parametry) — a stanem obowiązującym jest **KOD**:
> `core/Proficiency.ts`, `core/WeaponProficiency.ts`, `core/Practice.ts`.
> Zrealizowane: warstwa 2 w obu kierunkach (Fumble / Ześlizg / czysto + `m(P)`),
> `P` per rodzina broni, praktyka z walki i z manekina, softzone, **Mastery I–IV
> jako ranga KUPOWANA u trenera** (§34).
>
> ⛔ **Nie cytuj sekcji niżej jako planu.** Zostaje jako zapis pierwotnej
> intuicji — w kilku miejscach rozstrzygniętej INACZEJ (m.in. rozwój nie jest
> licznikiem użyć, a ranga nie wynika z praktyki, tylko z zapłaty).

**Status pierwotny:** pomysł przyszłościowy. **Nie implementować.**

### Założenie

Władanie bronią ma rozdzielić sam fakt posiadania broni od umiejętności
posługiwania się nią.

Ten sam miecz w rękach początkującego wojownika, doświadczonego żołnierza,
szermierza lub mistrza fechtunku powinien dawać inne możliwości, mimo używania
tego samego typu broni.

Celem jest budowanie tożsamości postaci przez praktykę, techniki i sposób
walki, a nie wyłącznie przez statystyki przedmiotu.

### Potencjalny kierunek

Przykładowe grupy władania:

- miecze,
- topory,
- broń obuchowa,
- włócznie,
- inne typy broni w przyszłości.

Rozwój mógłby wynikać z używania danej broni podczas realnej walki, ale nie
powinien sprowadzać się wyłącznie do prostego licznika użyć.

Potencjalnie większe znaczenie mogłyby mieć:

- walka z wymagającymi przeciwnikami,
- stosowanie technik,
- sytuacje wymagające kontroli broni,
- nauka u odpowiednich nauczycieli.

### Przykładowa różnica

Początkujący użytkownik miecza:

- zna podstawowy zamach,
- ma słabszą kontrolę ruchu,
- popełnia więcej błędów.

Doświadczony szermierz:

- lepiej kontroluje dystans,
- szybciej przechodzi między akcjami,
- może wykorzystywać bardziej zaawansowane techniki.

### Potencjalny wpływ na walkę

Władanie bronią nie musi oznaczać wyłącznie zwiększenia obrażeń. Jednym
z możliwych kierunków jest wpływanie na **jakość wykonywanych ataków** oraz
rozstrzygnięcia w walce.

Przykładowo niższy poziom władania mógłby oznaczać:

- większą szansę na nieefektywne trafienie,
- gorszą kontrolę ruchu po ataku,
- większą utratę skuteczności przeciwko wymagającym przeciwnikom.

Wyższy poziom władania mógłby oznaczać:

- bardziej stabilne trafienia,
- lepsze wykorzystanie otwarć,
- dostęp do bardziej zaawansowanych reakcji lub technik.

Inspiracją jest koncepcja znana z części RPG, gdzie poziom wyszkolenia broni
wpływa na **tabelę rozstrzygnięcia ataku**, a nie tylko na wartość obrażeń.

### Czego ten wpis NIE przesądza

Nie ustala:

- liczby poziomów władania,
- sposobu zdobywania doświadczenia,
- kosztów rozwoju,
- wpływu na statystyki,
- konkretnych talentów lub technik,
- czy system będzie osobnym mechanizmem czy częścią istniejących umiejętności,
- konkretnej tabeli trafień,
- procentowych szans,
- kar za niski poziom władania,
- czy mistrzostwo broni będzie ukrytym parametrem czy widocznym systemem.

To zapis kierunku rozwoju walki, nie specyfikacja.

### Powiązania (wskaźniki, nie ustalenia)

Projekt dotykał już tego tematu z drugiej strony i warto tam zajrzeć, **zanim**
ten pomysł kiedykolwiek wejdzie do pracy:

- `docs/systemy/weapons.md` — oś podziału broni była dobierana tak,
  **żeby NIE zbiegała się z mistrzostwem**; obie jej strony skalują się z inną
  umiejętnością gracza.
- `docs/systemy/weapons.md` (koniec §5) — zapisane wprost: zawartość typu
  „mistrzostwo broni dwuręcznej" powinna wisieć na **tym, co broń robi**, a nie
  na tym, ile ma rąk.
- `docs/systemy/weapons.md` — warstwa `Weapon Traits`, przy której
  zostawiono miejsce na przyszłą rozbudowę tożsamości broni.
- ⚠ **Skala liczb, która już dwa razy przewróciła mechaniki oparte na szansie**
  (`docs/atrybuty_ocena.md`, `docs/systemy/shields.md`): walka trwa **2–5 ciosów**,
  a gracz przyjmuje **1–4 ciosy** na starcie. Przy dwóch próbach efekt „10–30%
  szansy" nie jest redukcją o X%, tylko **monetą rzucaną raz na walkę** — z tego
  powodu odrzucono blok procentowy i losowe ogłuszenie. Ten wpis mówi „większa
  szansa na nieefektywne trafienie" i **niczego nie ustala** (patrz wyżej), ale
  ktokolwiek będzie to kiedyś projektować, musi tę liczbę znać, zanim sięgnie
  po procenty.

---

## Szarża jako model dzika — kierunek, nie specyfikacja

⚙ **Wyciągnięte 2026-09-07** z usuniętego `wypad_i_szarza.md` §5. Zero kodu.
Stan dzisiejszej Szarży: `docs/systemy/abilities.md`.

**Problem, który to rozwiązuje.** Dzisiejsza Szarża blokuje cel — czyli jest
pociskiem samonaprowadzającym, a nie rozpędzonym ciałem. Model dzika odwraca to
na **kierunek + pas + konsekwencja**: nie ma blokady celu, więc nie ma czego
rysować wokół gracza.

- **Kierunek zamrożony na starcie, ale z OGRANICZONĄ sterownością.** To jedyna
  liczba dzieląca człowieka od zwierzęcia: piechur w biegu koryguje kurs, nie
  zawraca. Za dużo → pocisk samonaprowadzający w przebraniu; zero → dzik, dla
  gracza frustrujący; **trochę → tam mieszka umiejętność gracza**. Kontrgra
  skaluje się sama: cel uskakuje w bok, a dłuższa szarża wymaga większego kąta.
- **Rampa impetu zamiast bramki minimalnego dystansu** — ta sama liczba
  przestaje ODMAWIAĆ i zaczyna opisywać rozpęd. ⚠ Dystans rozpędzania jest
  własnością **nóg, nie oręża**; związanie go z bronią zrobiłoby z kopijnika
  najgorszego szarżującego.
- **O końcu decyduje to, w co wjechałeś** — królik leci w powietrze, niedźwiedź
  albo drzewo zatrzymują jak mur.

⚠⚠ **Dwie twarde zależności, bez których to nie ruszy:**

1. wymaga **nowego pola (masa/opór) w konfigu każdego przeciwnika** — `weight`
   w przedmiotach to waga broni pod obciążenie i nie ma z tym związku;
2. ⛔ **dziś gracz przenika przez wszystko** — nie ma collidera
   `player × enemies` (są `enemies × enemies` i `player × solids`).
   „Tor go ignoruje" nigdy nie było wybrane — **to jest brak collidera, nie
   decyzja projektowa**.

---

## Udźwig jako oś rozwoju — węzły do rozważenia

⚙ **Wyciągnięte 2026-09-07** z usuniętego `udzwig_umiejetnosci.md`. Nic
zatwierdzone, nic wdrożone. Stan obciążenia: `docs/systemy/stamina.md`
i `docs/systemy/attributes.md`.

**Problem, który to rozwiązuje.** Udźwig rośnie dziś wyłącznie z Siły, więc
każda decyzja „co nosić" jest tą samą decyzją co „ile bić". Odczepienie
pojemności od obrażeń daje drugą, niezależną oś budowania postaci.

Węzły warte zachowania jako kierunki: **umiejętność podnosząca udźwig**
(pojemność bez obrażeń), **broń dwuręczna + tarcza** i **podwójna broń
dwuręczna** jako skrajne węzły drzewka, **pawęż stawiany** zamiast noszonego
w drugiej ręce, oraz **Marsz legionisty** (koszt marszu pod obciążeniem).

⚠ **Twarda zależność:** nic z tego nie ma sensu bez działającego obciążenia —
pola wagi na przedmiotach i licznika udźwigu. Ten warunek jest **spełniony od
2026-08-21**, więc blokada jest dziś tylko decyzją, nie brakiem fundamentu.

---

## Pancerz wielowarstwowy (przeszywanica + kolczuga + napierśnik)

⚙ **Wyciągnięte 2026-09-07** z usuniętego `udzwig_umiejetnosci.md` §10.
Stan pancerza: `docs/systemy/armor.md`.

**Problem, który to rozwiązuje.** Dziś jeden slot niesie jeden materiał, więc
„lepszy pancerz" znaczy „inny przedmiot", a nie „więcej warstw". Warstwy dałyby
naturalną progresję ekonomiczną **skóra → przeszywanica → kolczuga → stal**,
w której gracz dokłada, zamiast wymieniać.

⚠ **Zależności:** wymaga rozstrzygnięcia, jak sumują się punkty ochrony **per
sztuka** (dziś: sumowanie na sztukę, sufit redukcji), oraz kosztu mobilności
metalu — obie pozycje są już zaparkowane w `docs/odlozone.md`.

---

## Ochrona głowy przed ogłuszeniem / oszołomieniem

> **Status: pomysł przyszłości / NIEIMPLEMENTOWANE** (zanotowane 2026-09-16).
> ⛔ Nic z tego nie jest dziś w kodzie i żaden hełm nie niesie żadnego pola
> ani bonusu z tym związanego.

**Myśl.** Konstrukcja hełmu mogłaby wpływać nie tylko na ochronę przed
obrażeniami, ale też na **podatność postaci na efekty ogłuszenia i
oszołomienia**. Dziś hełm różnicuje się wyłącznie punktami ochrony, masą,
ceną i bramką Siły — czyli tymi samymi osiami, co każdy inny kawałek pancerza.
To by dało głowie oś, której nie ma żaden inny obszar ciała.

⛔ **Czego ten wpis NIE przesądza — świadomie:**

- ⛔ **Żadnego wzoru.** Ani mnożnika, ani odejmowania, ani progu.
- ⛔ **Żadnych wartości** ani bonusów dla konkretnych hełmów.
- ⛔ **Żadnego pola na przedmiocie.**
- ⛔ Czy nośnikiem jest **szansa**, **czas trwania**, czy **próg wejścia**
  w stan — to są trzy różne mechaniki i trzy różne konsekwencje.
- ⛔ Czy dotyczy ogłuszenia (`Enemy.stun` ma dziś tylko kierunek gracz → wróg),
  czy osobnego stanu „oszołomienia”, który nie istnieje.

⚠ **Wymaga osobnego zaprojektowania, nie dopisania liczby.** Kierunek gracz →
wróg ma dziś twardą kontrolę (`Enemy.stun`), ale **kierunku wróg → gracz nie**
— więc „ochrona przed ogłuszeniem” nie ma dziś przed czym chronić. To jest
pierwsza rzecz do rozstrzygnięcia, zanim cokolwiek trafi na hełmy.

⚠ **Nie mylić z hełmem zamkniętym.** Tamten czeka na **system percepcji**
(`docs/decyzje/2026-09-12-taksonomia-pancerza.md`, tabela „Później”) i jest
pytaniem o KOSZT osłony, a nie o jej dodatkowy efekt.

**Gdy ten pomysł dostanie wyzwalacz** (np. „po wdrożeniu kontroli wróg →
gracz”), przenosi się do `docs/odlozone.md` — zgodnie z regułą z nagłówka
tego pliku.

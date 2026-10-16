---
typ: HISTORIA
domena: [architecture, proces]
tytul: Audyt projektowy fundamentów
stan: zamrozony
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-03
---

# AUDYT PROJEKTOWY FUNDAMENTÓW — 2026-09-03

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/architecture.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Pytanie audytu:** czy obecne mechaniki tworzą zdrowy, skalowalny fundament
> pod duże RPG rozwijane latami, czy już teraz istnieją decyzje, które później
> wymuszą kosztowną przebudowę?
>
> **Kalibracja przyjęta na wejściu (nie podważam jej):** to nie jest projekt
> małej gry mobilnej. 2D, jeden autor i mały roster to **etap**, nie docelowa
> skala. Złożoność sama w sobie nie jest zarzutem — oceniam, czy każda warstwa
> ma **własną odpowiedzialność** i **przestrzeń projektową na przyszłość**.
>
> **Poprzednik:** `docs/audyt_walka_progresja_2026-09-03.md` (stan faktyczny,
> liczby). Ten dokument **nie powtarza tamtych liczb** — cytuje je tylko tam,
> gdzie są dowodem w sprawie projektowej.
>
> ⛔ **Nie zmieniono ani jednej linii kodu.**

---

## 1. EXECUTIVE SUMMARY

**Werdykt: B — fundament jest dobry, ale wymaga kilku decyzji przed dalszym
rozwojem.** Nie jest to grzecznościowe „B". Rdzeń rozstrzygania walki jest
lepszy niż większość prototypów tej wielkości i **nie należy go ruszać**.
Brakujące rzeczy są **strukturalne, nie liczbowe**, i wszystkie mają tę samą
własność: dziś kosztują dni, za rok będą kosztować tygodnie.

1. **Rdzeń walki jest czysty i zweryfikowany — to jest realne aktywo.**
   `CombatGeometry`, `HitResolver`, `DamageResolver`, `Protection`,
   `Proficiency`, `Practice`, `Defense` nie importują ani Phasera, ani encji,
   ani sceny — **sprawdzone importami, nie deklaracją**. Strażnik czystości
   w `tools/combat_regresja.mjs` egzekwuje to tekstowo. **604 asercje**
   w 9 uprzężach, z kulturą sprawdzania, czy asercja umie zaświecić na czerwono.
   To jest fundament, na którym da się budować przez lata.

2. **Trójwarstwowy podział (geometria → wykonanie → obrona) jest poprawny
   i skaluje się.** Każda warstwa odpowiada na inne pytanie („czy mogłem
   dosięgnąć" / „jak dobrze wyprowadziłem" / „czy obrońca się obronił"), żadna
   nie dubluje drugiej, i **oś `Execution` jest prostopadła do `ActionOutcome`**
   — nowy atak dostaje obie osie za darmo. To nie jest przerost. To jest
   dokładnie ten podział, którego duże RPG potrzebuje.

3. ⚠ **NAJWAŻNIEJSZE: gracz nie jest walczącym, tylko przypadkiem
   szczególnym.** Nie istnieje w kodzie żaden interfejs `Combatant` /
   `Damageable`. Każdy wróg przyjmuje **konkretną klasę `Player`**
   (`updateChase(player: Player)`, 11 plików importuje `Player`), a pocisk
   nazywa się `EnemyProjectileOptions`. **To jest jedyna decyzja w tym projekcie,
   która blokuje NARAZ: party, sojuszników, przywołania, walkę wróg-wróg,
   PvP, addy bossa i port do 3D.** Rdzeń rozstrzygania jest już agnostyczny —
   to encje i scena są sprzężone. Naprawa dziś = interfejs plus podmiana
   sygnatur. Naprawa za rok = każdy wróg i każda umiejętność.

4. ⚠ **Obrażenia są skalarem z jednym typem.** `takeDamage(amount, damageType,
   …)` — jedna liczba, jeden typ z zamkniętej trójki. Elemental, obrażenia
   mieszane, odporności, DoT i tarcze pochłaniające **nie mają gdzie zamieszkać**.
   Dobra wiadomość: cały łańcuch przechodzi przez **dwie funkcje**
   (`resolveIncoming`, `mitigate`), więc przejście na „pakiet obrażeń" jest
   dziś zmianą lokalną. Przy 50 umiejętnościach i 200 broniach nie będzie.

5. ⚠ **Nie istnieje system efektów statusowych.** Jad, spowolnienie, buff
   obrażeń i posiłek to **cztery osobne pola na klasie `Player`**, każde
   z własnym tickiem i własnym sprzątaniem. **Wróg nie może dostać ŻADNEGO
   efektu** poza ogłuszeniem i zachwianiem. Bez tej warstwy nie da się zrobić
   podpalenia, krwawienia, klątwy, spowolnienia wroga, buffów drużynowych
   ani mechanik bossów — a każdy kolejny efekt dokłada piąte, szóste i siódme
   pole do `Player`.

6. ⚠ **Wróg ma deklaratywny system akcji, gracz nie ma.** `CombatAction`
   + `ActionRunner` (telegraf → active → recovery → cooldown, `ownsBody`,
   `interruptible`, `oncePerActive`) to dobry, danymi sterowany model —
   i **dokładnie ten kształt** będzie potrzebny dla bossów i czarów. Gracz
   dostał zamiast tego **jeden slot `pendingSwing` i 471-linijkowy `switch`
   w `GameScene`**, po jednym bespoke bloku na umiejętność. Ósma umiejętność
   już tam jest. Pięćdziesiąta nie wejdzie.

7. **Proficiency i Mastery to NAPRAWDĘ dwa różne pojęcia — ale mówią jednym
   językiem.** Proficiency = jakość wykonania (zdobywana użyciem, ciągła,
   nasycająca się, **nie snowballuje** — `m(P)` dąży do 1,12 i jest karą poniżej
   neutralnej, nie premią powyżej). Mastery = specjalizacja kupowana (złoto
   + punkty, decyzja buildowa). Model jest zdrowy. **Problem jest w wyjściu:
   oba systemy wypuszczają WYŁĄCZNIE mnożniki.** Jedyny kanał niearytmetyczny
   w całej Biegłości to Fuszerka/Ześlizg — i to on niesie całą fantazję
   „nie umiem tym machać". Mastery nie ma dziś ani jednego ładunku
   jakościowego.

8. ⚠ **Cecha rodziny nie skaluje się do 30 rodzin.** Tożsamość rodziny to dziś
   **opcjonalne pole liczbowe** czytane przez `"parryBonus" in f` w czterech
   miejscach `Progression`. Włócznia — której tożsamością jest ZASIĘG, czyli
   parametr modelu, nie mnożnik — **ma M-II i M-IV puste** i jest to zapisane
   jako decyzja (D3). To nie jest wyjątek, to zapowiedź: każda przyszła
   rodzina, której tożsamość nie jest liczbą do pomnożenia (łuk, kostur,
   proca, broń drzewcowa, tarcza bojowa), trafi w tę samą ścianę.

9. **Obronna połowa gry nie ma stawki — i to jest powód, dla którego „tank"
   nie istnieje, a WIT/KON są słabe.** Śmierć kosztuje 10% złota, mikstury
   są bez cooldownu i bez limitu, nie ma agro ani sojuszników. **To nie jest
   problem współczynników.** Dopóki przetrwanie nie jest zasobem, żaden
   atrybut obronny nie kupi stylu gry, tylko „dłużej do tej samej śmierci".

10. **Sufit nauczania (roster uczy odradzalnie do `P = 85`) to problem
    CONTENTU, nie systemu.** `teacher(ρ)` z premedytacją wygasza starą
    zawartość jako nauczyciela — to jest dobra mechanika dla dużego RPG, bo
    wiąże progresję z eksploracją. **Ale zamienia progi `P` w kontrakt
    contentowy:** każdy próg wymaga przeciwnika o odpowiednim `P`. To trzeba
    zapisać jako regułę rostera, nie naprawiać w formule.

11. **Konfiguracja-jako-typ (`ItemId = keyof typeof ITEMS`) jest bardzo dobra
    dzisiaj i będzie ograniczeniem przy 200 przedmiotach.** Kompilator łapie
    każdą literówkę i każdą lukę, i to jest realna wartość. Ale zamyka drogę do
    danych ładowanych w runtime (mody, patche zawartości, edytor), a jeden plik
    `GameConfig.ts` ma już **12 745 linii**. To jest ⏸️ LATER, nie 🔴 — pod
    warunkiem świadomego rozdziału configu na moduły, zanim urośnie ×3.

12. **Dwie unie typów są przepisywane ręcznie zamiast wyprowadzane z configu.**
    `WeaponFamily` (`Equipment.ts:67`) i `DamageType` są listami literałów
    obok `WEAPON_FAMILY`/`ARMOR_PROFILE`, a `WEAPON_FAMILIES` powstaje przez
    **rzutowanie** `Object.keys(...) as WeaponFamily[]`. Rozjazd nie zapali
    kompilatora. Koszt naprawy: jedna linijka na typ, dziś.

13. **Jedna broń = jeden slot.** `accepts()` przepuszcza broń wyłącznie do
    slotu `weapon`, a cała `Progression` czyta `Equipment.weapon` w liczbie
    pojedynczej (obrażenia, zasięg, rodzina, `P`). **Dual wield nie jest
    zablokowany jedną linijką — jest zablokowany modelem składania statystyk.**
    To jest świadomy, spójny wybór, ale musi być podjęty **jako wybór**, bo
    `odlozone.md` już dziś wskazuje dual wield jako kandydata na koszt
    alternatywny tarczy.

14. **Ekonomia ma pętlę, ale nie ma stawki.** Złoto → Mastery → tańszy wysiłek
    → dłuższa walka → więcej łupu → złoto jest **domkniętą pętlą dodatnią**,
    a punkty rozwoju są jedyną waluta z realnym niedoborem (26 punktów na
    poziomie 27 wobec 13 na umiejętności + 6 na jedną rodzinę). To jest dobry
    fundament ekonomiczny. Brakuje mu wyłącznie **ryzyka** (patrz punkt 9).

15. **Nie znalazłem ani jednej warstwy, którą uznałbym za przerost.** Jakość
    wykonania, trwałość, obciążenie, typy obrażeń, PRD, warianty ataku,
    Biegłość, Mastery, manekin — każda ma odrębną odpowiedzialność i każda
    otwiera przestrzeń projektową, której duże RPG używa. **Rekomendacja
    „uprościć" nie pada w tym raporcie ani razu.**

---

## 2. FUNDAMENTY, KTÓRE SĄ JUŻ DOBRE — nie ruszać

### 2.1 Czystość rdzenia rozstrzygania 🟢

Sprawdzone importami, nie deklaracją:

| plik | importy runtime |
|---|---|
| `CombatGeometry.ts` | **zero** |
| `Defense.ts` | **zero** |
| `HitResolver.ts` | `CombatGeometry` |
| `Proficiency.ts` | `GameConfig` (+ typ) |
| `Practice.ts` | `GameConfig` (+ typ) |
| `DamageResolver.ts` | `Protection`, `Defense` (+ 2 typy) |
| `Protection.ts` | `GameConfig`, `CombatGeometry` (+ 2 typy) |

**Dlaczego to jest fundament, a nie kosmetyka:** te pliki dają się uruchomić
w Node bez silnika. To jest jedyny powód, dla którego istnieje 604-asercyjna
uprząż, i to samo jest warunkiem, żeby kiedyś ten sam kod mógł stać po stronie
serwera albo w innym rendererze. **Port do 3D nie tknie ani jednego z tych
plików.**

⚠ Drobiazg: strażnik czystości pilnuje 8 plików, ale **`Protection.ts`,
`Practice.ts` i `Stamina.ts` nie są na jego liście**, choć spełniają warunek.
Dopisanie ich to jedna linijka — IMPLEMENTATION.

### 2.2 Trójwarstwowy podział rozstrzygania 🟢

```
warstwa 1  geometria   „czy mogłem dosięgnąć"       → whiff
warstwa 2  wykonanie   „jak dobrze wyprowadziłem"   → fumble / graze / clean
warstwa 3  obrona      „czy obrońca się obronił"    → dodge / parry / block / hit
```

Trzy różne pytania, trzy różne właściciele, **zero dublowania**. Sprawdziłem
przypadki graniczne: `executionFor` nigdy nie zwraca `whiff` (warstwa 1 jest
wyłącznym właścicielem pudła geometrycznego), a `ExecutionLanded` to **bramka
kompilatora**, nie komentarz — fuszerka nie ma jak przejść do liczenia obrażeń.
Ta ostatnia sztuczka chroni licznik PRD przed spaleniem na ciosie, który nie
wylądował. To jest dojrzała inżynieria.

⭐ **Prostopadłość `Execution × ActionOutcome` jest właściwym uogólnieniem.**
Każdy przyszły atak — czar, strzał, cios bossa — dostaje obie osie bez pisania
czegokolwiek. To jest przestrzeń projektowa, nie przerost.

### 2.3 `CombatAction` + `ActionRunner` 🟢

Deklaratywny model akcji wroga: `windupMs / activeMs / recoveryMs / cooldownMs`,
`interruptible`, `oncePerActive`, `ownsBody`, `attackerRecoil`, `attackerLunge`.
**To jest dokładnie ten kształt, którego wymagają bossy, czary z czasem rzucania
i ataki obszarowe z telegrafem.** Wszystkie siedem gatunków deklaruje ataki w tym
kształcie (`AKCJE` w configu); runner prowadzi dziś dwa z nich (dzik, niedźwiedź),
reszta odmierza czas ręcznie — **to jest dług adopcji, nie błąd projektu**.

### 2.4 Ochrona w punktach, nie w procentach 🟢

`reductionFromPoints(p) = min(p/(p+50), 0,75)` z profilem materiału jako
mnożnikiem **punktów**. Konsekwencja: jakość wykonania, trwałość, buff, affiks
i przyszła odporność **komponują się przez dodanie punktów**, bez pytania „czy
+20% do 60% to 72% czy 80 pp". To jest jedna z lepszych decyzji w projekcie
i skaluje się bez zmian do dowolnej liczby źródeł ochrony.

### 2.5 PRD dla uniku i parowania 🟢

Kalibrowany licznik serii (`Defense.ts`) z osobnymi licznikami dla uniku
i parowania. Usuwa frustrację serii pecha bez zmiany średniej. **Skaluje się
do dowolnej liczby obrońców** — pod jednym warunkiem, że stan PRD przestanie
być globalnym singletonem, kiedy pojawi się drugi walczący (patrz §4.1).

### 2.6 Warianty ataku jako mnożniki własnych liczb broni 🟢

`arcMul / reachMul / damageMul / swingMul` + **własny `damageType`**. Jedna broń
odpowiada na dwa różne pancerze, bez drugiej pozycji w katalogu. Wariant
**nie może dodać zdolności** (reguła zawężania: obuch siekiery nie dziedziczy
przerwania młota) — reguła zapisana i egzekwowana. To jest gotowy mechanizm dla
„stance", „grip", trybu celowanego i przyszłych modów broni.

### 2.7 Jakość i trwałość jako mnożniki istniejących liczb 🟢

`QUALITY` nie dokłada ani jednej nowej statystyki — mnoży obrażenia, obronę,
tempo, trwałość i **przesuwa wymóg Siły**. Zniszczony przedmiot działa za 50%,
nie znika. Autor **świadomie trzyma to osobno od przyszłej rarity/affiksów**
(`odlozone.md`) i to jest poprawna decyzja: jakość wykonania i wyjątkowość
przedmiotu to dwie różne osie, których zlanie jest klasycznym długiem RPG.

### 2.8 Obciążenie jako klasa, nie jako podatek 🟢

`udźwig = 20 + 2,5 × Siła`, trzy klasy, **dokładnie dwa (realnie trzy)
konsumenty**. Świadome „ciężki loadout ma być INNYM stylem, a nie gorszym"
jest właściwą filozofią dla dużego RPG. ⚠ `odlozone.md` już zapisało dwa
warunki, które trzeba zabezpieczyć **w projekcie, nie potem**: udźwig jako
**suma źródeł** (nie `baza + SIŁA×k` na sztywno) i udźwig wystawiający
**poziom**, nie samą pojemność. Podpisuję się pod tym — to jest tanie dziś
i drogie za rok.

### 2.9 Polityka zapisu: pole opcjonalne bez podbijania wersji 🟢

Sześć systemów weszło bez skasowania ani jednej postaci. Autozapis wyciszany
na czas wczytywania (`muted`). ⚠ Polityka „niezgodny zapis = nowa gra, nigdy
migracja" jest poprawna **przed premierą** i musi zostać świadomie odwrócona
przed nią (⏸️ LATER, nie teraz).

### 2.10 Kultura uprzęży 🟢🟢

604 asercje, strażnik czystości działający na tekście plików, wymóg
„asercja, która nie potrafi zaświecić na czerwono, jest dekoracją" oraz
udokumentowane celowe psucia z liczbą złapanych błędów. **Przy jednym autorze
i wieloletnim horyzoncie to jest ważniejsze niż połowa mechanik.** Nie ruszać,
rozszerzać.

---

## 3. FUNDAMENTY WYMAGAJĄCE DECYZJI TERAZ

> Kolejność = malejący koszt zwłoki, nie malejąca ważność.

### 3.1 🔴 Brak abstrakcji walczącego (`Combatant`) — ARCHITECTURE PROBLEM

**Stan:** nie istnieje żaden interfejs opisujący „coś, co może zadać i przyjąć
cios". Wrogowie przyjmują `Player` jako typ konkretny; `Projectile` przyjmuje
`EnemyProjectileOptions`; `Enemy.takeDamage(amount, fromX, fromY, …)` przyjmuje
współrzędne, więc *technicznie* wróg mógłby uderzyć wroga, ale nic w kodzie tego
nie robi ani nie opisuje.

**Co to blokuje (naraz):** drużyna, towarzysze, najemnicy, przywołania,
oczarowanie/kontrola umysłu, walka frakcji, addy bossa, PvP, tryb obserwatora,
port do 3D z inną klasą postaci.

**Dlaczego to jest tanie DZIŚ:** rdzeń rozstrzygania **już jest agnostyczny** —
`DamageResolver` przyjmuje osiem pól kontekstu, `HitResolver` przyjmuje
`CombatBody`. Sprzężenie siedzi wyłącznie w encjach i scenie. Dziś jest to
interfejs + podmiana sygnatur w ~10 plikach. Po dołożeniu 40 wrogów i 40
umiejętności to jest przepisanie wszystkiego, co dotyka walki.

⚠ **Powiązany, ukryty warunek:** `Defense` (PRD) jest **singletonem modułu**.
W chwili, gdy istnieje drugi walczący z unikiem, licznik serii musi zamieszkać
na walczącym. To jest ta sama zmiana i ten sam moment.

**Decyzja do podjęcia:** czy walka jest relacją między dwoma `Combatant`,
czy pozostaje na stałe relacją `Player ↔ Enemy`.

### 3.2 🔴 Obrażenia jako skalar + jeden typ — ARCHITECTURE PROBLEM

**Stan:** `amount: number` + `damageType: "slash" | "pierce" | "blunt" | null`.
Typ jest **wyłączny** — atak ma dokładnie jeden. `ARMOR_PROFILE` to macierz
materiał × typ.

**Co to blokuje:** obrażenia mieszane (miecz + podpalenie), żywioły,
odporności/immunitety, tarcze pochłaniające, wampiryzm liczony od składowej,
DoT z typem, „50% fizyczne / 50% magiczne", konwersje.

**Co NIE jest problemem:** dodanie czwartego typu fizycznego samo w sobie jest
tanie — macierz wymusi uzupełnienie wszystkich materiałów i kompilator to złapie.
**Problemem jest wyłączność.**

**Dlaczego tanie dziś:** cały łańcuch przechodzi przez `resolveIncoming`
i `mitigate`. Wywołań `takeDamage` jest kilkanaście. Przy 200 broniach i 50
umiejętnościach będzie ich kilkaset.

**Decyzja:** czy obrażenia są **jedną liczbą z etykietą**, czy **workiem
składowych**. Nie trzeba tego implementować teraz — trzeba wybrać, bo od tego
zależy sygnatura, którą będą pisać wszystkie przyszłe mechaniki.

### 3.3 🔴 Brak warstwy efektów statusowych — ARCHITECTURE PROBLEM

**Stan:** cztery bespoke pola na `Player` (`venom`, `slow`, `damageBuff`,
`foodHeal`), każde z własnym tickiem, własnym sprzątaniem i własnym wpisem do
`Buffs` — a `Buffs` jest **listą do paska UI**, nie systemem mechanicznym
(`active[]`, `set/get/remove`, zero logiki). **Wróg nie ma żadnego pola na
efekty** — może dostać wyłącznie `stun`/`stagger`/`knockback`, każdy jako
osobny znacznik czasu.

**Co to blokuje:** podpalenie, krwawienie, klątwy, spowolnienie wroga,
osłabienie pancerza, zatrucie wrogów, buffy drużynowe, aury, stackowanie
i wygaszanie, dispel, odporność na kontrolę, mechaniki bossów oparte
o narastające debuffy.

**Koszt zwłoki jest liniowy i widoczny:** każdy nowy efekt to piąte, szóste
i siódme pole na `Player`, każde z własną pętlą i własnym błędem do złapania.
Jad **omija dziś nietykalność** — nie dlatego, że tak zaprojektowano całość,
tylko dlatego, że nie ma miejsca, w którym ta reguła mogłaby być wspólna.

**Decyzja:** czy powstaje jeden komponent `Effects` (właściciel: `Combatant`),
z regułami stackowania, odświeżania i wygaszania, wspólny dla obu stron.

### 3.4 🟠 Gracz bez deklaratywnego modelu akcji — ARCHITECTURE PROBLEM

**Stan:** `pendingSwing` (jeden slot na całą grę: autoatak, Ciężkie uderzenie,
Wypad, Uderzenie tarczą) + `switch (p.id)` o długości **471 linii**
w `GameScene`, po bespoke bloku na każdą z ośmiu umiejętności. Kształt trafienia
jest już danymi (`AbilitySpec` → `ResolvedHitShape`) — **skutek nie jest**.

**Co to blokuje:** 50 umiejętności, czary z czasem rzucania, kanałowanie,
combo/łańcuchy, umiejętności modyfikowane przez broń, drzewka talentów
zmieniające zachowanie umiejętności, umiejętności towarzyszy.

**Dlaczego 🟠 a nie 🔴:** switch jest **skupiony w jednym miejscu** i konwersja
jest mechaniczna. Ale `AimableAbilityId` to **ręcznie pisana unia**
duplikująca wiedzę z `ABILITIES`, a stan efektów gracza (dash, buff, jad,
posiłek) mieszka jako pola na `Player` — więc to zadanie jest siostrą §3.3
i najtaniej wykonać je razem.

**Decyzja:** czy gracz dostaje ten sam kontrakt akcji, który mają wrogowie
(`CombatAction`-podobny), i **kiedy** — moim zdaniem **zanim powstanie
umiejętność numer 9**.

### 3.5 🟠 Tożsamość rodziny broni jako opcjonalne pole liczbowe — SYSTEM PROBLEM

**Stan:** `WEAPON_FAMILY.sword.parryBonus`, `.axe.critMultiplierBonus`,
`.blunt.staggerMs`, `.dagger.critMultiplierBonus`, `.polearm` — **puste**.
Czytane przez `"pole" in f` w czterech miejscach `Progression`. Ładunek Mastery
`traitMultiplier` **mnoży efekt tego pola**, więc rodzina bez pola nie ma czego
mnożyć: **włócznia ma M-II i M-IV puste** i jest to zapisana decyzja (D3),
a topór i sztylet dostały osobny nośnik (`φ`), bo ich baza wynosiła zero.

**Diagnoza:** to nie jest wyjątek do posprzątania — to **sufit modelu**.
Przy 15–30 rodzinach większość tożsamości nie będzie mnożnikiem liczby
(zasięg, obszar, mobilność, dystans, zasób, rytm, warunek). Każda z nich
powtórzy historię włóczni albo historię `φ`.

**Decyzja:** czy rodzina **deklaruje listę cech** (efekt + nośnik + skalowanie
rangą), zamiast mieć opcjonalne pole i cztery `in`-guardy. To jest praca na
jeden dzień dzisiaj i przebudowa `Progression` + wszystkich rang za rok.

### 3.6 🟠 Stawka przetrwania — SYSTEM PROBLEM (nie balans)

**Stan:** śmierć = 50% HP, **10% złota**, pełna stamina, brak utraty XP
i przedmiotów. Mikstura leczy 40 HP za 15 g **bez cooldownu i bez limitu**.
Nie ma agro, nie ma sojuszników, nie ma niczego do obrony poza sobą.

**Konsekwencja projektowa (nie liczbowa):**
- **Witalność** kupuje „dłużej do tej samej taniej śmierci";
- **Kondycja** kupuje „dłużej do miękkich stanów, które nie blokują akcji";
- **tank nie ma treści mechanicznej** — nie dlatego, że tarcza jest za słaba,
  tylko dlatego, że **nie ma kogo chronić i nie ma czego uniknąć**;
- cała warstwa obronna (pancerz, typy, blok, parry, unik) rozstrzyga o zasobie,
  którego uzupełnienie kosztuje 15 g.

⚠ **To jest przyczyna, a asymetria atrybutów jest objawem.** Zmiana
współczynników KON/WIT niczego tu nie naprawi.

**Decyzja:** czym jest ryzyko w tej grze. Bez niej nie da się sensownie
zaprojektować ani tanka, ani healera, ani ekonomii mikstur, ani trudności
bossów.

### 3.7 🟠 Jedna broń, jeden slot — SYSTEM PROBLEM (do świadomego wyboru)

`accepts()` przepuszcza broń wyłącznie do slotu `weapon`, a **cała `Progression`
czyta `Equipment.weapon` w liczbie pojedynczej** — obrażenia, zasięg, łuk,
rodzina, `P`, `swingDurationMs`. Dual wield nie jest zablokowany jedną linijką;
jest zablokowany **modelem składania statystyk** (czyja rodzina? czyje `P`?
czyj zasięg? który `swingMul`?).

To jest spójny wybór i **nie krytykuję go**. Ale `odlozone.md` wskazuje dual
wield jako jednego z dwóch kandydatów na koszt alternatywny tarczy — więc
decyzja „jednoręczność jest ostateczna" musi zostać podjęta **jawnie**, bo
zamyka gałąź designu, którą projekt sam sobie otworzył.

### 3.8 🟡→🔴 Unie typów przepisywane ręcznie — IMPLEMENTATION, ale z ryzykiem

`export type WeaponFamily = "sword" | "axe" | "blunt" | "dagger" | "polearm"`
(`Equipment.ts:67`) stoi **obok** `WEAPON_FAMILY` w configu, a `WEAPON_FAMILIES`
powstaje przez **rzutowanie** `Object.keys(...) as WeaponFamily[]`. Ten sam wzorzec
dotyczy `DamageType` i `AimableAbilityId`. **Rozjazd nie zapali kompilatora** —
zapali się dopiero jako brakująca rodzina w panelu albo `undefined` w tabeli rang.

Naprawa: `keyof typeof WEAPON_FAMILY`. Jedna linijka na typ, dziś, zero ryzyka.
Klasyfikuję wyżej niż zwykły dług, bo **koszt błędu rośnie z liczbą rodzin**.

---

## 4. PROBLEMY SKALOWALNOŚCI

### 4.1 Skala 10 → 50 → 200 broni

| co | 10 | 50 | 200 |
|---|---|---|---|
| `ITEMS` jako jeden `as const` | ✅ | ⚠ plik > 25k linii | 🔴 nie do utrzymania w jednym pliku |
| `ItemId = keyof typeof ITEMS` | ✅ świetne | ✅ wolniejszy `tsc` | ⚠ typy pochodne puchną |
| katalog broni (`ekwipunek_przedmioty.md`) | ✅ | ✅ generowany | ✅ |
| **dostępność przedmiotu** | ⚠ już dziś Pałka i Krótki miecz były **nieosiągalne** przez wiele commitów | 🔴 pewne | 🔴 |
| warianty ataku | ✅ | ✅ | ✅ |

⭐ **Największe ryzyko przy 200 broniach nie jest typowe, tylko contentowe:**
katalog pokazuje, **co istnieje**, nie **co jest osiągalne**. Ten błąd już
wystąpił i przeżył wiele commitów. Rozwiązanie jest znane i zapisane
(`odlozone.md`) — kolumna „źródło" + asercja świecąca na BRAK.

**Rekomendacja strukturalna:** rozdzielić `GameConfig.ts` na moduły
(`config/items/*`, `config/enemies/*`, `config/abilities/*`) **zanim urośnie
×3**, zachowując `as const` i typy pochodne. To jest tania praca mechaniczna
dziś i bolesna przy 25 tysiącach linii.

### 4.2 Skala 5 → 50 → 500 przeciwników

**Dobre:** `EnemyConfig` jest w pełni danymi (HP, obrażenia, pancerz, prędkości,
zasięgi, `proficiency`, `teachingRole`, ciała), `Enemy` jest sterowany configiem,
a zachowanie wchodzi jako podklasa. `CombatAction` daje wspólny kształt ataku.

**Ryzyka:**
- **dwa równoległe `switch (kind)`** (`createEnemy`, `enemyCfg`) — przy 500
  gatunkach to rejestr, nie switch. IMPLEMENTATION, tanie kiedykolwiek.
- **adopcja `ActionRunner` 2/7** — Wilk (385 linii), Szary (291), Królik (472)
  odmierzają czas ręcznie. Przy 500 gatunkach potrzebny jest **jeden idiom
  zachowania**, nie pięć. To jest dług do spłacenia przy okazji, nie przebudowa.
- **AI ma dwa stany** (`patrol`/`chase`) i agro po czystym dystansie — bez linii
  wzroku, pamięci i słuchu (zapisane w `bestiariusz_audyt.md`). Dla 500 wrogów
  i bossów potrzebna będzie warstwa decyzji. **Dobra wiadomość:** warstwa ruchu
  (`MoveIntent → PathSolver → SteerSolver → DirectSolver`) już istnieje
  i jest wstrzykiwana kompozycją, więc AI może usiąść nad nią bez ruszania
  encji.

### 4.3 Skala 4 → 15 → 30 rodzin broni

**To jest najsłabsze miejsce w skalowaniu** i opisuje je §3.5. Dodatkowo:
- `P` jest trzymane w `Map<WeaponFamily, number>` i zapisywane jako
  `Record<string, number>` — **skaluje się bez zmian**, ✅;
- ale **koszt Mastery jest per rodzina** (2800 g + 6 pkt). Przy 30 rodzinach
  „opanuj wszystko" jest z definicji niemożliwe — i **to jest dobre**, to jest
  właśnie specjalizacja. ⚠ Wymaga jednak decyzji, czy `P_start = 25` dla
  weterana zostaje stały przy 30 rodzinach, bo dziś przesiadka jest tania
  w obu walutach.

### 4.4 2D → 3D

**Nieoczekiwanie dobra pozycja.** Rdzeń rozstrzygania nie zna renderera;
`CombatBody` to `{x, y, radius, length?, axis?}` — kapsuła, która w 3D staje
się kapsułą z osią Z; `isFrontal` liczy kąt między wektorami. Zmiana 2D→3D
dotknie: `CombatGeometry` (trzeci wymiar), `Direction` (cztery kierunki →
ciągły yaw), warstwy ruchu (`NavGrid` 2D) i całej prezentacji. **Nie dotknie:**
`DamageResolver`, `Protection`, `Proficiency`, `Practice`, `Defense`,
`Progression`, `Equipment`, `Save`.

⚠ **Jedyny prawdziwy dług 2D w mechanice:** `Direction` = cztery strony świata,
używane przez blok/parry (`FACING_VECTOR`). To jest do przewidzenia i tanie.

### 4.5 Solo → party

Blokuje §3.1 (brak `Combatant`) i §3.6 (brak agro). Dodatkowo: `Progression`,
`Equipment`, `Stamina`, `Defense` są **singletonami modułu** — czyli „statystyki
gracza" są globalne. Dla drużyny każdy z nich musi stać się instancją per
postać. **To jest największa pojedyncza przebudowa, jaką ten projekt może
napotkać**, i decyzja o drużynie powinna zapaść, zanim te singletony obrosną
kolejnymi konsumentami.

⚠ Uwaga sprawiedliwa: singleton jest tu **świadomy i uzasadniony** (przeżywa
`Player` przez śmierć/respawn/zmianę mapy). Nie krytykuję wyboru — sygnalizuję,
że **to on płaci rachunek za drużynę**.

### 4.6 Melee → ranged → magic

| co potrzebne | stan |
|---|---|
| kształt dostarczenia ataku (łuk / pocisk / kanał) | ⛔ jedyny kształt broni to `MeleeShape`; `resolveAttack` bramkuje `isMoving` i `targetInReach` po melee |
| pocisk gracza | ⛔ `Projectile` jest jawnie wroga (`EnemyProjectileOptions`) |
| drugi zasób (mana/focus) | ⚠ `Stamina` jest singletonem jednego zasobu; drugi = kopia klasy |
| czas rzucania / kanałowanie | ⛔ brak (u wroga jest `windupMs` — u gracza nie) |
| celowanie w sojusznika / siebie | ⛔ `AimCandidate<T>` jest generyczne ✅, ale selekcja celów zna tylko wrogów |
| obrażenia nie-fizyczne | ⛔ patrz §3.2 |

⭐ **Wniosek:** ranged i magic nie wymagają przebudowy **rdzenia**, ale wymagają
**czterech nowych warstw** (dostarczenie, zasób, czas rzucania, efekty).
Trzy z nich są tanie. Czwarta (§3.3) jest tania **tylko dziś**.

---

## 5. PROBLEMY WYNIKAJĄCE WYŁĄCZNIE Z BRAKU CONTENTU

> ⚠ Tego **nie wolno naprawiać w systemie**. Wszystkie poniższe znikną same,
> gdy przybędzie zawartości — a „naprawa" formuły zepsuje działający model.

| objaw | dlaczego to CONTENT |
|---|---|
| **Roster uczy odradzalnie tylko do `P = 85`** | `teacher(ρ)` jest zaprojektowany tak, żeby stara zawartość przestawała uczyć. To jest **cecha**. Progi 50/100/200/350 są kontraktem na przeciwników o `P` 60–280, których jeszcze nie ma. |
| **Pancerz ma 1 z 7 wrogów** | cała oś typ × materiał działa dziś prawie wyłącznie wróg → gracz. Dodanie 3–4 opancerzonych wrogów zamyka sprawę bez linijki kodu. |
| **`maxCritChance` 0,60 nieosiągalne (realnie 0,45)** | brak przedmiotów, nie zła formuła. |
| **`m(P)` powyżej 100 to martwa gałąź** | najwyższe `P` w rosterze = 82; ożyje z mocniejszą fauną. |
| **Jakości 5–7 nieosiągalne** | świadoma decyzja (`jakosc_wykonania.md` §6), nie luka. |
| **Nagrody za poziomy 11+** | zapisane w `odlozone.md` jako otwarta decyzja o **długim horyzoncie progresji** — to jest content + jedna decyzja projektowa, nie wada systemu. |
| **Cztery sloty na osiem umiejętności** | przy 30 umiejętnościach to stanie się realnym wyborem. Dziś jest ciasne, ale nie jest błędem. |
| **Włócznia bez cechy rodziny** | ⚠ **wyjątek: to NIE jest tylko content** — patrz §3.5. Brakuje modelu, nie zawartości. |

---

## 6. PROBLEMY WYMAGAJĄCE PLAYTESTU

| pytanie | dlaczego żaden skrypt nie odpowie |
|---|---|
| Czy `P = 50` (81,4% obrażeń, 6% fuszerek) czyta się jako **„nie umiem"**, czy jako **„gra mi zabrała 19%"** | to jest ryzyko ODBIORCZE — decyduje o tym, czy cała Biegłość jest fajna, czy irytująca |
| Czy „Niezgrabnie" odróżnia się od pudła geometrycznego | §7 checkpointu nazywa to największym ryzykiem odbiorczym systemu |
| Czy Ześlizg brzmi jak KONTAKT | dla ciosów ≤ 5 pkt **cue jest jedynym nośnikiem kategorii**, bo liczba po zaokrągleniu jest ta sama |
| Czy ekonomia wysiłku (koszt 1,54–3,19 na zamach) zmienia rytm walki | zmiana balansowa z 2026-09-02, nigdy nie grana |
| Czy „Zmęczony" jest zauważalny | `attackSpeedMul: 1,0`, jedyny nośnik to `recoveryMul 1,15` |
| Czy okno przedsprzedaży rangi (`cap − 10`) daje realny czas na dojście do trenera | zależy od odległości do wioski w realnej rozgrywce |
| Czy manekin jest satysfakcjonującym wejściem w rodzinę | 10 punktów to ~2 minuty bicia w worek |
| Czy przesiadka na nową broń „boli właściwie" | test rozstrzygający całej Biegłości (§17 checkpointu) |

---

## 7. BRAKUJĄCE FUNDAMENTY

### MUST HAVE FOUNDATION — brak wymusi przebudowę

| # | czego brakuje | co przez to jest niemożliwe |
|---|---|---|
| **F1** | **`Combatant` / `Damageable`** — kontrakt „coś, co walczy" | drużyna, sojusznicy, przywołania, wróg↔wróg, addy bossa, PvP |
| **F2** | **Pakiet obrażeń** zamiast skalara + jednego typu | żywioły, obrażenia mieszane, odporności, absorpcja, wampiryzm |
| **F3** | **Warstwa efektów statusowych** (wspólna, obustronna, ze stackowaniem) | DoT, CC na wrogach, aury, debuffy, mechaniki bossów, dispel |
| **F4** | **Deklaratywny model akcji GRACZA** | >8 umiejętności, czary, kanałowanie, combo, talenty zmieniające zachowanie |
| **F5** | **Model cech rodziny** (deklaracja, nie opcjonalne pole) | rodziny, których tożsamość nie jest mnożnikiem — łuki, kostury, tarcze bojowe |
| **F6** | **Model stawki** (śmierć, leczenie, zagrożenie) | tank, healer, support, trudność bossów, sensowna ekonomia mikstur |

### SHOULD HAVE LATER — potrzebne, ale dobudowalne bez ruszania fundamentu

| # | co | dlaczego może poczekać |
|---|---|---|
| S1 | **Threat / agro** | wchodzi razem z F1; sam w sobie jest warstwą nad walką |
| S2 | **Affiksy / rarity na `ItemInstance`** | pole opcjonalne + polityka zapisu już to udźwignie |
| S3 | **Warstwa decyzji AI** (LOS, pamięć, słuch, grupy) | siada nad istniejącą warstwą ruchu |
| S4 | **Drugi zasób** (mana/focus) | `Stamina` jest wzorcem do skopiowania |
| S5 | **Rejestr wrogów zamiast dwóch `switch`** | mechaniczne, zawsze tanie |
| S6 | **Migracja zapisów** | konieczna dopiero przed premierą |
| S7 | **Rozbicie `GameConfig.ts` na moduły** | mechaniczne, ale rób **zanim** urośnie ×3 |
| S8 | **Crafting / receptury** | `Gathering`, materiały i `CAMPFIRE.recipe` to gotowe klocki |

### CONTENT

Więcej wrogów (w tym opancerzonych i o wysokim `P`), więcej broni w istniejących
rodzinach, przedmioty z `critChance`, nagrody za poziomy 11+, zastosowanie ziół,
źródła jakości 5–7, drugi i trzeci trener rang.

### OPTIONAL

Reputacja/frakcje, specjalizacje questowe, enchanty, sety, dungeon loot,
budowanie/osada. **Żadne z nich nie wymaga zmian w dzisiejszym fundamencie**
poza F1–F3.

---

## 8. DECYZJE NIEODWRACALNE / HIGH-RISK

| decyzja | ryzyko | ocena |
|---|---|---|
| **`Player` jako typ konkretny w całej walce** | 🔴 **najwyższe** — blokuje sześć przyszłych systemów naraz, koszt rośnie z każdą encją | zmienić teraz |
| **Obrażenia jako skalar + typ wyłączny** | 🔴 wysokie — dotyka każdego przyszłego wywołania | zdecydować teraz, wdrożyć przy pierwszej potrzebie |
| **Statystyki gracza jako singletony modułu** (`Progression`, `Equipment`, `Stamina`, `Defense`) | 🟠 wysokie **tylko przy drużynie**; dziś uzasadnione | decyzja o drużynie przesądza |
| **Cecha rodziny = jedno pole liczbowe** | 🟠 średnie, rośnie z liczbą rodzin | zmienić przed rodziną nr 6 |
| **Jedna broń w jednym slocie** | 🟠 średnie — zamyka dual wield i „drugą rękę ofensywną" | podjąć jawnie |
| **`ItemId = keyof typeof ITEMS`** | 🟡 niskie dziś, średnie przy 200 przedmiotach; zamyka dane w runtime | świadomie zaakceptować albo zaplanować rozdział |
| **Zapis: niezgodny = nowa gra** | 🟡 zerowe przed premierą, krytyczne po | odwrócić przed premierą |
| **Progi Mastery jako kontrakt contentowy** | 🟡 to jest cecha, nie ryzyko — pod warunkiem zapisania jako reguła rostera | zapisać w regułach projektu |
| **Punkty rozwoju jako wspólna waluta atrybutów, umiejętności i Mastery** | 🟢 **niskie i celowo** — to jedyne miejsce realnej konkurencji systemów | zostawić |
| **Absolutna skala `P` z neutralną w 100** | 🟢 niskie — własność regresyjna, nie snowballuje | zostawić |

---

## 9. TABELA OCENY CAŁEGO SYSTEMU

| mechanika | odpowiedzialność własna? | dubluje? | skaluje się? | ocena |
|---|---|---|---|---|
| Geometria trafienia (`HitResolver`) | tak — „czy dosięgnął" | nie | tak | 🟢 KEEP |
| Execution (fumble/graze/clean) | tak — „jak wyprowadził" | nie | tak | 🟢 KEEP |
| `m(P)` — mnożnik jakości | tak — deterministyczny kanał `P` | ⚠ z Mastery mówi tym samym językiem | tak | 🟢 KEEP |
| `DamageResolver` (kolejność obrony) | tak | nie | tak | 🟢 KEEP |
| `Protection` (punkty, profile) | tak | nie | tak | 🟢 KEEP |
| PRD (`Defense`) | tak | nie | ⚠ singleton przy drużynie | 🟢 KEEP / 🟠 przy F1 |
| Blok (deterministyczny, kierunkowy) | tak | nie | tak | 🟢 KEEP |
| Parry (pasywne, rodzina miecza) | tak | ⚠ z unikiem — oba pasywne PRD bez decyzji | tak | 🟡 PLAYTEST |
| Unik pasywny vs Unik-umiejętność | ⚠ **ta sama nazwa, dwie mechaniki** | częściowo | tak | 🟠 RETHINK (nazewnictwo/rola) |
| Typy obrażeń × materiały | tak | nie | ⚠ tylko przy wyłącznym typie | 🟠 RETHINK (§3.2) |
| Warianty ataku | tak | nie | tak | 🟢 KEEP |
| Rodziny broni | tak | nie | ⛔ **nie przy 30 rodzinach** | 🟠 RETHINK (§3.5) |
| Proficiency (`P`) | tak — kompetencja | nie | tak | 🟢 KEEP |
| Mastery (ranga kupowana) | tak — specjalizacja + sufit | ⚠ ładunki są wyłącznie liczbowe | tak | 🟡 PLAYTEST + 🟠 ładunki |
| Praktyka (`teacher × √k`, softzone) | tak | nie | tak (wymaga contentu) | 🟢 KEEP |
| Manekin treningowy | tak — wejście w rodzinę | nie | tak | 🟢 KEEP |
| Stamina (zasób wysiłku) | tak | nie | ⚠ singleton przy drużynie | 🟢 KEEP |
| Obciążenie | tak | nie | tak | 🟢 KEEP (z warunkami z `odlozone.md`) |
| Jakość wykonania | tak | nie — świadomie ≠ rarity | tak | 🟢 KEEP |
| Trwałość | tak | nie | tak | 🟡 PLAYTEST (podatek od szybkich broni) |
| Interrupt / stagger / knockback / stun | ⚠ **cztery pojęcia, dwa liczniki** | częściowo | ⚠ bez systemu efektów | 🟠 RETHINK (§3.3) |
| Efekty statusowe (jad, spowolnienie) | ⛔ brak warstwy | — | ⛔ | 🔴 CHANGE NOW |
| Umiejętności czynne | tak | nie | ⛔ switch | 🟠 RETHINK (§3.4) |
| Krytyk | tak | ⚠ **poza paskiem Execution wbrew §6** | tak | 🟠 RETHINK |
| Poziom / XP / punkty | tak | nie | ⚠ brak nagród 11+ | 🟡 PLAYTEST + CONTENT |
| Ekonomia złota | tak | nie | tak | 🟢 KEEP |
| Loot | tak | nie | tak | ⏸️ LATER (dropy sprzętu) |
| Respawn | tak | nie | tak | 🟢 KEEP |
| Zapis | tak | nie | ⚠ brak migracji | ⏸️ LATER |
| `EnemyConfig` + podklasy | tak | nie | tak | 🟢 KEEP |
| `ActionRunner` | tak | nie | tak | 🟢 KEEP (dokończyć adopcję) |
| Warstwa ruchu (`movement/`) | tak | nie | tak | 🟢 KEEP |
| AI (patrol/chase) | tak | nie | ⛔ przy 500 wrogach | ⏸️ LATER (S3) |
| `Combatant` | ⛔ **nie istnieje** | — | ⛔ | 🔴 CHANGE NOW |
| Uprzęże / strażniki | tak | nie | tak | 🟢🟢 KEEP |

---

## 10. TOP 7 DECYZJI DO PODJĘCIA TERAZ

> Gdybym był lead system designerem tego projektu i wiedział, że to fundament
> RPG budowanego latami — te siedem, w tej kolejności. **Żadna z nich nie jest
> zmianą balansu i żadna nie wymaga nowej zawartości.**

### D1 🔴 Wprowadzić `Combatant` jako kontrakt walki

**Co:** interfejs opisujący „to, co bierze udział w walce" (pozycja, `combatBody`,
`combatOrigin`, `takeDamage`, zwrot, stan efektów). Wrogowie przyjmują
`Combatant`, nie `Player`. `Projectile` przestaje być „wroga".
**Dlaczego teraz:** odblokowuje sześć przyszłych systemów jedną zmianą, a koszt
rośnie z każdą nową encją i umiejętnością. Rdzeń rozstrzygania **już jest
gotowy** — to jest zmiana sygnatur, nie matematyki.
**Czego NIE robić przy okazji:** nie rozbijać singletonów `Progression`/
`Stamina` — dopóki nie zapadnie decyzja o drużynie, mają zostać.

### D2 🔴 Rozstrzygnąć, czym są obrażenia: liczbą z etykietą czy pakietem składowych

**Co:** decyzja projektowa, nie implementacja. Jeśli pakiet — sygnatura
`takeDamage` i `DamageContext` dostają kształt, który to udźwignie, nawet jeśli
dziś zawsze niesie jedną składową fizyczną.
**Dlaczego teraz:** to jest sygnatura, którą będzie pisać każda przyszła
mechanika obrażeń. Dziś zmienia się ją w dwóch funkcjach.

### D3 🔴 Zaprojektować warstwę efektów statusowych — obustronną

**Co:** jeden komponent `Effects` na `Combatant`: DoT, spowolnienia, ogłuszenia,
buffy, z regułami stackowania/odświeżania/wygaszania i jednym miejscem, w którym
mieszka reguła „co omija nietykalność". Zastępuje cztery bespoke pola na
`Player` i **daje wrogom możliwość bycia celem efektu**.
**Dlaczego teraz:** każdy nowy efekt bez tej warstwy to kolejne pole i kolejna
pętla. To jest jedyny dług w tym zestawieniu, który **rośnie liniowo z każdą
sesją contentową**.

### D4 🟠 Dać graczowi ten sam kontrakt akcji, który mają wrogowie

**Co:** akcja gracza jako dane (`windup / active / recovery / cooldown / koszt /
kształt / skutek`), zamiast bespoke bloku w `switch`. `AbilitySpec` już dowiódł,
że wzorzec działa dla kształtu — trzeba domknąć skutek.
**Kiedy:** **zanim powstanie umiejętność numer 9.**
**Uwaga:** wykonać razem z D3 — połowa bloków w switchu to właśnie efekty.

### D5 🟠 Przejść z „cecha rodziny = pole liczbowe" na deklarację cech

**Co:** rodzina deklaruje listę cech (co robi · na czym siedzi · jak skaluje się
rangą), zamiast opcjonalnego pola i czterech `in`-guardów.
**Kiedy:** **przed dodaniem rodziny nr 6.**
**Test poprawności rozwiązania:** czy da się opisać włócznię (zasięg), łuk
(dystans) i tarczę bojową (kontrola) bez dopisywania wyjątku w `Progression`.

### D6 🟠 Rozstrzygnąć model stawki: co kosztuje śmierć, czym jest leczenie, czym zagrożenie

**Co:** trzy powiązane liczby i jedno pojęcie — kara za śmierć, dostępność
leczenia w walce, oraz czy istnieje agro/zagrożenie.
**Dlaczego to decyzja projektowa, nie balans:** od niej zależy, czy WIT i KON
mogą kiedykolwiek kupować **styl gry**, czy zostaną „większym paskiem", oraz
czy archetyp obronny w ogóle ma prawo istnieć.
**Czego NIE robić:** nie przestrajać KON/WIT ani tarczy przed tą decyzją —
to jest leczenie objawu.

### D7 🟡 Wyprowadzić unie typów z configu i domknąć strażnika czystości

**Co:** `WeaponFamily = keyof typeof WEAPON_FAMILY`, to samo dla `DamageType`
i identyfikatorów umiejętności; `Protection`/`Practice`/`Stamina` dopisane do
listy strażnika czystości w `combat_regresja.mjs`.
**Dlaczego w TOP 7 mimo trywialności:** to jedyna pozycja, w której błąd jest
**cichy** — rozjazd typu z configiem nie zapala kompilatora, a koszt rośnie
z każdą rodziną.

---

## 11. REKOMENDOWANA KOLEJNOŚĆ DALSZEGO PROJEKTOWANIA

```
ETAP 0 — PLAYTEST (już zaplanowany, nic nie blokuje)
  └─ Biegłość + Mastery + stamina w ręku. Wynik może zmienić D6.

ETAP 1 — HIGIENA FUNDAMENTU (dni, zero ryzyka)
  ├─ D7  unie z configu + strażnik czystości
  ├─ rejestr wrogów zamiast dwóch switch (S5)
  └─ kolumna „źródło" w katalogu ekwipunku + asercja na BRAK

ETAP 2 — KONTRAKTY (przed jakąkolwiek nową dużą mechaniką)
  ├─ D1  Combatant                    ← odblokowuje wszystko poniżej
  ├─ D3  warstwa efektów              ← razem z D1, wspólny właściciel
  └─ D2  decyzja o pakiecie obrażeń   ← decyzja teraz, wdrożenie przy 1. żywiole

ETAP 3 — TOŻSAMOŚĆ (przed rozbudową rosteru broni)
  ├─ D5  deklaracja cech rodziny
  ├─ D4  akcja gracza jako dane
  └─ decyzja o dual wield / drugiej ręce ofensywnej (§3.7)

ETAP 4 — STAWKA (decyzja projektowa, potem liczby)
  └─ D6  śmierć / leczenie / zagrożenie → dopiero potem WIT, KON, tarcza

ETAP 5 — ZAWARTOŚĆ (dopiero teraz, na gotowych kontraktach)
  ├─ wrogowie o wysokim P i z pancerzem  (odblokowuje progi Mastery)
  ├─ nagrody za poziomy 11+
  └─ broń w istniejących rodzinach

ETAP 6 — NOWE FILARY (na fundamencie z etapów 2–4)
  └─ ranged · magia · drużyna · bossy · affiksy · crafting
```

⚠ **Reguła kolejności, którą warto zapisać:** *nowa duża mechanika wchodzi
dopiero po kontrakcie, którego potrzebuje.* Łuki po D2+D4, magia po D2+D3+D4,
drużyna po D1, bossy po D3.

---

## 12. EMERGENT DESIGN I NEGATIVE SPACE

### 12.1 Co już emerguje — i jest dobre

| interakcja | dlaczego działa |
|---|---|
| **obuch × telegraf** | młot przerywa szarżę dzika — realna kontra oparta o wiedzę, nie o statystykę |
| **`teacher(ρ)` × wybór celu** | „bij coś ponad swój poziom, żeby się nauczyć" — presja eksploracyjna wbudowana w naukę |
| **klasa obciążenia × unik** | lekki loadout daje ×1,3 do uniku **i** tańszy unik — spójna tożsamość, nie dwa niezależne bonusy |
| **wariant ataku × materiał pancerza** | jedna broń, dwie odpowiedzi na dwóch przeciwników |
| **`m(P)` × przesiadka na nową broń** | zmiana oręża realnie boli i to jest treść, nie kara |
| **jakość × wymóg Siły** | Mistrzowska broń obniża wymóg o 1 — jakość otwiera sprzęt, nie tylko podbija liczby |

### 12.2 Ryzyka emergentne

| # | co | kategoria |
|---|---|---|
| E1 | **Praktyka z AoE liczona per cel**, każdy z licznikiem `k` od 1 (najwyższy przyrost) — Wir ostrzy w grupie uczy wielokrotnie szybciej niż pojedynek | SYSTEM (drobny, ale rośnie z liczbą AoE) |
| E2 | **AGI jest miękkim must-have** — trzy z czterech kanałów (tempo, unik, odzyskanie) działają **niezależnie od broni**, podczas gdy STR poza `strScale` daje tylko udźwig | SYSTEM |
| E3 | **Bilans staminy dodatni na M-IV** — mistrz bije bez końca; zapisane jako świadoma cena | BALANCE (znane) |
| E4 | **Mikstury bez cooldownu** unieważniają całą warstwę obronną | SYSTEM (część D6) |
| E5 | **Zużycie broni jako podatek od szybkości** — sztylet zużywa się ~3,8× szybciej na minutę walki niż młot bojowy | BALANCE / PLAYTEST |
| E6 | **Tarcza jest bezwarunkowo opłacalna** (znane, `odlozone.md`) — dziś dodatkowo daje twardą kontrolę | SYSTEM (część §3.7) |

### 12.3 Negative space — czego dziś **nie da się zbudować**

| archetyp / mechanika | co go blokuje |
|---|---|
| **Łucznik, kusznik, procarz** | brak kształtu „dostarczenie na dystans" po stronie gracza; `MeleeShape` jest jedynym kształtem broni |
| **Mag, kapłan, druid** | brak drugiego zasobu, czasu rzucania, obrażeń nie-fizycznych i efektów |
| **Healer / support** | brak `Combatant`, brak sojuszników, brak celowania w kogoś innego niż wróg |
| **Tank** | brak zagrożenia/agro i brak stawki (D6) |
| **Build na DoT / żywioły** | brak §3.2 i §3.3 |
| **Dual wield** | model jednej broni w `Progression` (§3.7) |
| **Build na kontrolę** | jedyna twarda kontrola gracza to Uderzenie tarczą; brak systemu odporności na CC |
| **Build na przedmiotach (affiksy, sety)** | `ItemInstance` ma dziś `quality` i `durability`; rozszerzenie jest **addytywne i tanie** ✅ |
| **Crafting** | brak receptur, ale klocki (materiały, stacja, `Skills`) stoją ✅ |
| **Bossy z fazami** | `ActionRunner` udźwignie akcje; brak faz, skryptu areny i efektów (D3) |

⭐ **Wzorzec:** wszystko, czego nie da się zbudować, blokują **te same trzy
brakujące kontrakty** (F1, F2, F3) plus jeden kształt (dostarczenie ataku).
To jest bardzo dobra wiadomość — to nie jest dwadzieścia niezależnych braków,
tylko cztery.

---

## 13. PROFICIENCY vs MASTERY — odpowiedź na pytanie wprost

**Pytanie:** czy `P` faktycznie znaczy kompetencję, a Mastery specjalizację,
czy to dwa paski progresji?

**Odpowiedź: koncepcyjnie to są dwa różne systemy i model jest zdrowy —
ale ich WYJŚCIE jest dziś tego samego rodzaju, więc gracz zobaczy dwa paski.**

Argumenty za tym, że to naprawdę dwa systemy:

- **inny nośnik**: `P` jest ciągłe i zdobywane użyciem; ranga jest dyskretna
  i kupowana;
- **inna waluta**: czas vs złoto + punkty rozwoju;
- **inna rola**: `P` steruje **dostępem i tempem** (sufit, softzone, `P_start`),
  ranga steruje **efektami** — rozdział jest zapisany (§34.5) i **egzekwowany
  w kodzie** (`thresholdRankFor` vs `masteryOf`);
- **inna decyzja gracza**: `P` to „czym macham", ranga to „w co inwestuję
  6 punktów z 26";
- `P` **nie snowballuje** — `m(P)` nasyca się na 1,12 i jest głównie karą
  poniżej neutralnej.

Argumenty za tym, że dziś czyta się to jako dwa paski:

- **oba wypuszczają wyłącznie mnożniki.** Kompetencja objawia się jako
  +18,6% obrażeń między `P` 50 a 100; specjalizacja jako −12% staminy,
  ×1,5 do parady i +minimum. Nic z tego nie zmienia **sposobu gry**;
- **jedyny kanał niearytmetyczny to Fuszerka/Ześlizg** — i on niesie całą
  fantazję „nie umiem tym machać". Jest to jednocześnie kanał, który
  §33.4 nazywa największym ryzykiem odbiorczym;
- **Mastery jest dziś przede wszystkim bramką na `P`**, a dopiero potem
  ładunkiem. Doświadczenie brzmi: rośnij → ściana → zapłać → rośnij;
- **rangi nie mają ani jednego ładunku jakościowego** — żadna nie odblokowuje
  techniki, wariantu ataku, ani nie zmienia zachowania broni.

**Wniosek projektowy (nie rekomendacja liczb):** rozdział ról jest poprawny
i **nie należy tych systemów łączyć**. Brakuje im **różnych rodzajów wyjścia**:
`P` ma zostać przy niezawodności (fumble/graze/`m`), a Mastery powinna kiedyś
dostać ładunek **jakościowy** — checkpoint sam to przewiduje („przyszłe `gate`
technik czyta PRÓG `P`"), tylko żadna technika jeszcze nie istnieje.
To jest 🟠 RETHINK na poziomie *co ranga daje*, nie *ile daje* — i naturalnie
zbiega się z D4 i D5.

---

## 14. ODPOWIEDŹ KOŃCOWA

# **B — dobry fundament, wymaga kilku decyzji przed dalszym rozwojem.**

**Uzasadnienie w trzech zdaniach:**

1. **Rdzeń jest lepszy niż przeciętny fundament komercyjnego RPG na tym etapie**
   — czysty, warstwowy, przetestowany 604 asercjami, z egzekwowaną regułą
   czystości i dyscypliną „balans mieszka w configu". Tego **nie wolno ruszać**
   i nie ma powodu.
2. **Braki nie są w tym, co zbudowano, tylko w tym, czego jeszcze nie nazwano:**
   nie ma kontraktu walczącego, kontraktu obrażeń ani kontraktu efektu.
   Wszystkie trzy są dziś tanie, bo rdzeń jest już agnostyczny; wszystkie trzy
   drożeją z każdą kolejną encją i umiejętnością.
3. **Ani jedna warstwa nie jest przerostem.** Biegłość, Mastery, jakość,
   trwałość, obciążenie, typy obrażeń, warianty i PRD mają odrębne
   odpowiedzialności i realną przestrzeń projektową. Odpowiedź „uprościć"
   nie pada w tym raporcie ani razu — i to jest szczera ocena, nie uprzejmość.

**Czego NIE robić w następnej kolejności:** nie stroić współczynników atrybutów,
nie osłabiać tarczy, nie przerabiać krzywej XP i nie ruszać progów Mastery.
Wszystkie cztery są objawami decyzji, które jeszcze nie zapadły (D6, §3.7,
content, content).

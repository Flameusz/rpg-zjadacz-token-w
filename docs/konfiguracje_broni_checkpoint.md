---
typ: HISTORIA
domena: proces
tytul: Checkpoint — trzy konfiguracje broni
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT — trzy konfiguracje broni (2026-09-05)

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. Stan samej broni z 2026-09-05.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> ⛔ **PRZESTAŁ BYĆ PUNKTEM WEJŚCIA 2026-09-12.** Ówczesny punkt wejścia to
> `docs/ekwipunek_checkpoint.md`. Ten plik **nie wie** o przebudowie panelu
> ekwipunku (2026-09-11), taksonomii pancerza ani decyzjach D1–D4 (2026-09-12) —
> te weszły po nim. **W swoim zakresie — trzy konfiguracje broni — jest
> aktualny** i zostaje jako zapis tamtego etapu.
>
> ⚠ To jest dokładnie ta sama pomyłka, którą ten projekt zapisał już przy
> `docs/plan_dalszych_prac.md`: dokument nazwany „bieżącym planem" zostaje nim
> w nagłówku długo po tym, jak sesje poszły gdzie indziej.
>
> **Po co ten plik.** Zapis stanu BRONI na 2026-09-05. Mówi
> **gdzie byliśmy**, a nie **jak co działa** — opisy mechanik zostają
> w swoich dokumentach i ten plik ich nie powtarza.
>
> ⚙ **KOREKTA 2026-09-08 — akapit o stanie repo był NIEAKTUALNY.** Stało tu
> „wszystko poza `fb2eca9` jest NIEZACOMMITOWANE (32 M + 5 ??)"; te zmiany
> weszły do commita `dc79745` (2026-09-07) i po nim doszły trzy kolejne.
> **§5 zostaje jako zapis stanu z 2026-09-05, nie jako oczekiwanie wobec
> dzisiejszego drzewa** — dokładnie ta klasa pomyłki, przed którą ostrzega
> baner `docs/dziennik.md` („nie czytaj stąd stanu repozytorium — SPRAWDŹ GO").
> ⚠ Zasada bez zmian: **nie commituj bez polecenia.**
>
> ⚠ **Ten plik jest checkpointem CAŁEJ sesji 2026-09-05**, nie tylko konfiguracji
> broni. Szczegóły każdej decyzji: `docs/dziennik.md`, wpisy 2026-09-05 (1)–(13).

---

## 1. Stan trzech konfiguracji

### 1H + tarcza — ✅ **DOWIEZIONE**

Mechanika **wdrożona, zweryfikowana i udokumentowana**. Blok kierunkowy ma trzy
strefy osłony (wcześniej binarny).

📄 **Dokumentacja — jedyne źródło prawdy, nie przepisuj jej tutaj:**
- `docs/systemy/shields.md` **§C** (STAN AKTUALNY) — model, granice, kod, co
  pilnuje. Sekcje §1–§B.14 tego pliku to zapis decyzji z 2026-08-15; przy
  sprzeczności **wygrywa §C**.
- `docs/ekwipunek_mechanika.md` — łańcuch obrażeń.
- `docs/zaimplementowane.md` — wpis „Tarcze".
- `src/core/CLAUDE.md` — reguła przy kodzie.

Weryfikacja z sesji wdrożeniowej: `tsc` czysto, `build` czysto,
`combat_regresja` **121/121 zero różnic** (po świadomej migracji baseline'u —
jedna zmiana zachowania), 9/9 pozostałych strażników OK, sabotaż strażnika §X
**7/7 złapanych**.

⚠ **Otwarty jest PLAYTEST, nie kod** — odczucie szerokości frontu i wartość
`sideZoneMul`. Autor gra na bieżąco; renderu nie oglądał żaden agent.

---

### 2H — 🟢 **TRZY CECHY DOWIEZIONE, DWIE ZABLOKOWANE** (audyt 2026-09-05)

⚠⚠ **Poprzednie brzmienie tego wpisu („nie dostała ani jednej mechaniki
własnej") było NIEPRAWDZIWE** i wynikało z tego, że nikt nie policzył cech
emergentnych. Audyt kodu 2026-09-05:

| cecha tożsamości | stan | skąd |
|---|---|---|
| **wolniejsza** | ✅ **jest** | `attackCooldown` 1H 0,45–0,50 vs 2H 0,60–0,80; `swingDurationMs` 1H 140–190 vs 2H 230–290. Dłuższy zamach = dłuższy root (`rootDurationForSwing`) |
| **duże obrażenia** | ✅ **jest** | średnia 1H 8,0–12,0 vs 2H 12,5–18,5; `strScale` 2H **0,08–0,09**, najwyższy w grze |
| **większy zasięg** | ✅ **jest** (po naprawie) | `reach` 2H 76/80/98 wobec 1H 56–74. ⚠ `war_hammer` miał **74 — tyle co starterowy kij** i mniej niż jednoręczny `Młot`; podniesione do 80 |
| **trudniejsza do zablokowania** | ⛔ **NIEOSIĄGALNA** | **wrogowie nie mają bloku** |
| **trudniejsza do sparowania** | ⛔ **NIEOSIĄGALNA** | **wrogowie nie mają parowania** |

⚠⚠ **DEFENSYWNA POŁOWA „COMMITMENT" JUŻ ISTNIEJE i nikt jej nie zaprojektował.**
`Progression.parryChance` zwraca **0**, jeśli trzymana broń nie deklaruje
`melee.parryBonus`. ⚠ **Do 2026-09-16 czytało się to z RODZINY** i zdanie
brzmiało „a ma go wyłącznie `sword`"; dziś rodzina niesie sam znacznik `parry`,
a liczbę deklaruje KONSTRUKCJA — i deklaruje ją mniejszość mieczy. **Wniosek
zostaje w mocy, tylko na mocniejszej podstawie:** żadna broń dwuręczna nie ma
parowania, bo żadna go u siebie nie deklaruje, a `hands: 2` blokuje off-hand,
więc nie ma też tarczy. Gracz z bronią dwuręczną **traci całą warstwę obrony
kierunkowej** — dokładnie „commitment", tylko wyrażony po stronie obrony, nie
ataku. **To jest emergentne z architektury i nie wymaga kodu.**

**Ustalenia projektowe, do których nie trzeba wracać:**
1. ⚠⚠ **Cechy 4 i 5 wymagają OBROŃCY, który blokuje i paruje — takiego nie ma.**
   `src/entities/*.ts` nie zawiera bloku, parowania ani stanu gardy;
   `Protection.guardZone` i `DamageResolver.resolveIncoming` obsługują wyłącznie
   ciosy **przychodzące do gracza**. Ścieżka gracz → wróg zna tylko pancerz
   i typ obrażeń. **Każda implementacja tych cech dzisiaj byłaby niewidoczna
   w grze** — ta sama blokada, która zatrzymała `uninterruptible`. Zbudowanie
   obrony po stronie wroga to nowy podsystem, nie „minimalny mechanizm".
2. ⚠⚠ **`Młot` (`hammer`) jest bronią `hands: 1` o parametrach 2H** — 14–20 obr.,
   cd 0,65, swing 240, reach 78 — i **łamie wszystkie trzy dowiezione cechy od
   strony jednoręcznej**. Dlatego strażnik §Y porównuje 2H do „najlepszej 1H
   **poza Młotem**" i trzyma ten wyjątek JAWNIE. ⛔ Domknięcie reguły znaczyłoby
   ruszenie `Młota`, czyli rebalans rosteru — patrz §2 pkt 4.
   ⚠ To także prostuje starą notę „`Młot` 1H DPS 54,2 vs `Młot bojowy` 2H 50,5":
   **obie bronie NIE są 2H**, jak sugerował wcześniejszy zapis.
3. ⚠ **2H nie ma dziś mechaniki WŁASNEJ i nie potrzebuje jej** — tożsamość
   wynika z liczb broni w istniejących warstwach (`geometry` → `damage`
   → `stamina`), zgodnie z zakazem globalnego bonusu za konfigurację.
2. Kierunek tożsamości: **commitment / impact** — duże obrażenia, niska
   szybkość, trudniejsze do sparowania/zablokowania. Kierunek **przyjęty**,
   liczby i mechanika **nierozstrzygnięte**.
3. **Osobne Mastery 2H nie zostało odrzucone** — świadomie zostawione otwarte,
   z zastrzeżeniem, że gdyby weszło, to jako **cena zaangażowania**, nie jako
   kolejna „rodzina broni".
4. Nota balansowa (do playtestu, nie do naprawy): `Młot` 1H ma DPS **54,2**,
   przerwania, knockback i wolną drugą rękę; `Młot bojowy` 2H ma **50,5**. Para
   obuchów nie idzie za wzorcem pary toporów (+46% / −26%).
5. Bramki umiejętnościowe („Dwuręczność", „Ciężkie Bronie") **nie istnieją**
   w żadnej postaci.

**⛔ Świadomie ODRZUCONE — nie wracać bez nowych danych:**
- **`STR × 1,5` dla 2H** — mnożnik Siły zależny od konfiguracji.
- **`uninterruptible`** (rozwiązanie A) — zatrzymane **na etapie specyfikacji,
  przed kodem**. Powód konkretny: próg `heavy` (≥ 21 obrażeń po mitygacji) jest
  dziś osiągalny praktycznie tylko przez szarżę dzika i tylko bez pancerza,
  więc mechanika byłaby **placebo**. Autor przyjął i odłożył.
- **Globalny bonus za samą konfigurację 2H** (płaskie „+X% bo dwuręczna").

📄 `docs/archetypy_walki.md` §4–§7 — trójkąt archetypów, benchmark, kierunki.
**Zero kodu, to nie jest specyfikacja.**

---

### 1H + off-hand / Dual Wield — 🟢 **PIERWSZA GRYWALNA WERSJA** (2026-09-05)

⚠ **Nadal NIE ma:** balansu, kar MH/OH, progresji, Mastery, skilli. „Grywalna"
znaczy: obie ręce naprawdę uczestniczą w walce, każdy cios rozlicza właściwą
broń, a styl ma odczuwalną cenę. **Nie znaczy: zbalansowana.**

**Dwie naprawy zamieniły prototyp w konfigurację** (obie w istniejących
warstwach, zero nowych statów):

1. ⚠⚠ **Szansa krytyka była czytana z ręki GŁÓWNEJ dla obu rąk.**
   `Player.rollDamage` brał `Progression.critChance`, a ten składa się
   z `PLAYER.critChance` + premii postaci + **premii broni z ręki głównej**.
   Zmierzone: `Sztylet + Miecz` dawał **+24,1%** dps zamiast +19,5%, a
   `Miecz + Sztylet` **+11,7%** zamiast +16,0% — układ **nagradzał trzymanie
   broni o wysokim krytyku w ręce głównej i karał za włożenie jej do drugiej**.
   Niewidoczna zachęta, której nikt nie zaprojektował. Dziś `critChance` jest
   w `StrikeProfile`, czyli zamrożone per ręka — jak reszta rzutu.
2. ⚠⚠ **Wyższy event rate DW był DARMOWY w staminie.** Koszt zamachu jest
   proporcjonalny do jego długości, a `DUAL_WIELD.swingMul` skraca zamach
   i cooldown tym samym mnożnikiem, więc mnożnik skracał się w rachunku.
   Zmierzone: DW miecz+sztylet **3,71 staminy/s wobec 3,96/s samego miecza** —
   DW dostawał +24% ciosów **taniej** niż jedna broń. Dziś wysiłek liczy się
   z długości zamachu **bez** przyspieszenia z DW: **4,36/s (+18%)**.
   Reguła: **szybciej machać wolno, machać taniej nie.**

**Zmierzona tożsamość po naprawach** (atrybuty 0, jakość Zwykła):

| konfiguracja | zamachy/s | dps vs solo MH | stamina/s |
|---|---|---|---|
| SOLO Miecz | 2,00 | — | 3,96 |
| DW Miecz + Sztylet | **2,48** (+24%) | **+16,0%** | **4,36** (+10% nad solo) |
| SOLO Sztylet | 2,22 | — | 3,42 |
| DW Sztylet + Sztylet | **2,61** (+18%) | **+17,6%** | **4,03** (+18% nad solo) |

⚠⚠ **Stara liczba „alternowanie jest stratą 17–43%" jest NIEAKTUALNA.** Była
mierzona **przy niezmienionej kadencji**, zanim `DUAL_WIELD.swingMul = 0,85`
weszło do kodu. Dziś DW jest **na plusie w dps** — dlatego **nie potrzebuje
żadnej rekompensaty i żadnego bonusu**.

⛔ **Kary MH/OH nadal NIE ISTNIEJĄ i §W7 tego pilnuje.** Nie dokładaj ich,
zanim playtest nie pokaże, że są potrzebne.

**Co jest w kodzie (prototyp):** broń jednoręczna w drugiej ręce; ataki
naprzemienne MH → OH na **jednym** `pendingSwing`; każda ręka z własnym
Władaniem / Mastery / obrażeniami / typem; **kadencja per ręka** (model C);
koszt staminy i zużycie broni per ręka; tempo istniejącym kanałem
`offhandSwingMul`.

**⛔ Czego prototyp NIE ma i to jest decyzja, nie brak:** kar MH/OH, poziomów
DW, efektów/proców, movesetu, wyrównania DPS. **Każda ręka zadaje pełne
obrażenia swojej broni.** Strażnik §W w `tools/combat_regresja.mjs` ma jawną
asercję, że mnożnik kary nadal nie istnieje — ciche dołożenie go zapali lampkę.

**Ustalenia do zapamiętania:**
1. ⚠ **Skill / proficiency Dual Wield zostaje NA PÓŹNIEJ.** Nie projektujemy go
   teraz.
2. ⚠⚠ Przy niezmienionej kadencji model naprzemienny jest **stratą 17–43%** we
   wszystkich konfiguracjach — przyspieszenie tempa jest **warunkiem istnienia**
   tego modelu, nie ozdobą.
3. Utrzymywalność jest gotową ceną: jedna broń bije bez końca, DW ma okno
   **38–58 s**.
4. DW nagradza inwestycję w **dwie** bronie — przy nierównym Władaniu wypada
   gorzej niż lepsza broń solo. Bramka jest **emergentna z `P`**, nikt jej nie
   projektował.
5. ⚠ **Kolejność DW I → II → III (2× sztylet → 1H + sztylet → 2× 1H) i część
   założeń balansowych pochodzą z propozycji ChatGPT i NIE SĄ zatwierdzonym
   designem.** Nie traktuj tych liczb jak ustaleń.

📄 `docs/archetypy_walki.md` §1–§3 (prototyp), §4–§7 (kierunek).

---

## 2. Decyzje ZAMKNIĘTE — nie analizować bez nowych danych

1. **Konfiguracja wynika z WYPOSAŻENIA, nie z klasy.** Nie ma i nie będzie
   klas ani „stylów walki" jako bytu; jest to, co gracz ma w rękach.
2. **`hands: 1 | 2` wystarcza.** Nie powstaje osobny `TwoHandedSystem` ani
   `DualWieldSystem` — konfiguracja jest wnioskiem z zawartości slotów.
3. **Żadnych globalnych bonusów za samą konfigurację.** Różnica ma płynąć
   z broni i z mechanik, nie z płaskiego mnożnika „bo 2H / bo DW".
4. **Nie balansujemy jeszcze konkretnych wartości broni.** Roster zostaje jak
   jest do czasu playtestu trzech konfiguracji.
5. **Kolejność prac: najpierw dowieźć trzy podstawowe konfiguracje → playtest →
   dopiero dalszy rozwój.** Progresja, mastery i specjalizacje idą po playteście.

⚠ Osobno, reguła procesu z tej sesji: **„odrzucone" w starym dokumencie nie jest
trwałym zakazem.** Wracając do tematu oceniaj go w dzisiejszym kontekście —
ale lista ⛔ wyżej pochodzi z TEJ sesji i ma powody zapisane przy sobie.

---

## 3. Długi odłożone — tylko lista

| dług | gdzie opisany |
|---|---|
| Stary wpis **„Siła to płaska premia do obrażeń"** w `CLAUDE.md` → „⏳ Otwarte" — nieaktualny opis; ruszyć **tylko** przy świadomym porządkowaniu `CLAUDE.md` | `CLAUDE.md` |
| **Asymetria krytyka gracz ↔ wróg** — u gracza krytyk siedzi w warstwie 1 i nie wynika z `P`; wariant C dla wroga wyprowadza go z biegłości. Asymetria **zaakceptowana**, spójność semantyczna to dług | `docs/systemy/proficiency.md` (D1) |
| **Wartości do dalszego playtestu** — `sideZoneMul = 0,50`, szerokość frontu tarczy, kadencja i koszty DW, krzywa XP, koszty staminy | dokumenty właściwe każdej mechaniki |
| **Czy Zręczność ma za dużo korzyści** (4 kanały wobec 1 Kondycji) — ⚠ jedyny pomiar parytetu (§10.4d) zawyża ją o nieistniejący krytyk i zaniża o pominięty unik/recovery, więc **nie da się odpowiedzieć bez nowego pomiaru** | `docs/atrybuty.md` §11.5 |
| ~~Dwa komentarze w `GameConfig.ts` o usuniętym `critChancePerAgility`~~ — ✅ **SPRZĄTNIĘTE 2026-09-05** | `docs/atrybuty.md` §11.4 |
| ~~`tools/atrybuty_kalibracja.mjs` czytał stary kształt `WEAPON_FAMILY` i stare `hpPerEndurance`~~ — ✅ **NAPRAWIONE 2026-09-05**, samosprawdzenie 10/10. ⚠ Potwierdziło, że `ekwipunek_przedmioty.md` i tabele §10.4(c)/(d) były poprawne — kłamał przymiar | `docs/atrybuty.md` §11.6 |
| ⚠ **Asercja cenowa: 23 naruszenia zamiast 4** — roster urósł z 7 do 11 broni, wszystkie nowe naruszenia dotyczą `Pałki`, `Krótkiego miecza`, `Topora bojowego` i `Młota bojowego`. Powtarzalne wzorce: `Krótki miecz 75 g < Toporek 70 g` oraz `Młot bojowy 360 g < Topór bojowy 320 g`. **Sygnał balansowy, nie usterka** — ta sama sprawa co nota o `Młocie` 1H vs `Młocie bojowym` 2H | `docs/atrybuty.md` §10.4(a) |
| **Proficiency / Mastery dla DW i ewentualne Mastery 2H** — świadomie na później, nieprojektowane | `docs/archetypy_walki.md` |
| **Dług nazewniczy `SHIELD.blockArcDeg`** (nazywa półkulę, nie łuk bloku) | `docs/systemy/shields.md` |
| Otwarte długi Biegłości **D2 / D3 / D4** | `docs/systemy/proficiency.md` |

---

## 3.1 Pierwsze kroki następnej sesji

1. Przeczytaj ten plik i `docs/dziennik.md` — **trzynaście wpisów 2026-09-05
   (1)–(13)**, najnowsze na górze. Ten plik mówi GDZIE jesteśmy, dziennik
   DLACZEGO.
2. **Nie commituj bez polecenia.** Sprawdź `git status` i **nie porównuj go
   z niczym zapisanym w tym pliku.** ⚠ Stało tu „powinno być 32 M + 5 ??"
   z odsyłaczem do §5 — od 2026-09-06 nieprawda (te zmiany są w commicie
   `dc79745` i po nim doszły trzy kolejne). §5 zostaje jako zapis stanu
   z 2026-09-05, nie jako oczekiwanie wobec dzisiejszego drzewa.
3. Weryfikacja przed uznaniem czegokolwiek za zrobione:
   `npx tsc --noEmit`, `npm run build`, `node tools/combat_regresja.mjs`
   (oczekiwane: **121/121 zero różnic**), `tools/*weryfikacja*.mjs`
   (**10/10**, doszedł `ui_panele_weryfikacja.mjs`), `tools/atrybuty_kalibracja.mjs`
   (**10/10**) oraz `tools/combat_benchmark.mjs`.
   ⚠⚠ **WSZYSTKO ma być ZIELONE.** Wcześniejsze brzmienie tego punktu mówiło,
   że `atrybuty_kalibracja` „świeci na czerwono i to jest stan zastany" — to
   było prawdą do 2026-09-05 i **przestało nią być** (naprawa opisana w §3
   i w `docs/atrybuty.md` §11.6). Czerwone cokolwiek = TWOJA regresja.
4. ⚠ **Zanim dołożysz strażnika: zepsuj kod celowo i sprawdź, że świeci na
   czerwono.** W tej sesji **pięć** strażników przeszło sabotaż w pierwszej
   wersji — patrz §4.6.
5. Playtest jest **po stronie autora** — żaden agent nie uruchomi tu gry
   (podgląd nie renderuje klatek). Lista tego, co czeka: §4.3 pkt 1.

---

# 4. STAN NA KONIEC SESJI 2026-09-05

## 4.1 Co zostało dowiezione

| obszar | stan |
|---|---|
| **1H + tarcza** | ✅ **DOWIEZIONE.** Blok kierunkowy w TRZECH strefach (120° pełnego / 2×40° osłabionego / reszta bez ochrony), `sideZoneMul = 0,50` jako wartość PLAYTESTOWA. Model: `docs/systemy/shields.md` **§C** |
| **2H** | 🟢 **3 z 5 cech dowiezione** (wolniejsza, duże obrażenia, większy zasięg). Cechy 4–5 (trudna do zablokowania/sparowania) **ZABLOKOWANE STRUKTURALNIE** — wrogowie nie mają bloku ani parowania. Patrz §1 |
| **Dual Wield** | 🟢 **PIERWSZA GRYWALNA WERSJA.** Krytyk per ręka + stamina rosnąca z tempem. Bez balansu, kar, progresji. Patrz §1 |
| **Benchmark** | ✅ `tools/combat_benchmark.mjs` — 3 konfiguracje × 5 pancerzy × 5 poziomów `P`, sustain 60 s, macierz typ×materiał, tryby `--all` / `--matrix` / `--proficiency` |
| **AI dzika** | ✅ Trzy poprawki: warunki wejścia w szarżę, stabilność objazdu, osiągalność celu |
| **UI** | ✅ Przewijanie plecaka w sklepie, viewport nad „ZAŁOŻONE", ikona założonej torby, dłuższy komunikat `+1 P` |

## 4.2 Najważniejsze fixy i ICH PRZYCZYNY

⚠ **Wzorzec, który powtórzył się w tej sesji cztery razy: informacja była
liczona i wyrzucana albo czytana ze złego miejsca.** Warto go szukać najpierw.

| fix | przyczyna |
|---|---|
| **Krytyk per ręka (DW)** | `rollDamage` czytał `Progression.critChance`, a ten bierze `Equipment.weaponMelee` — czyli broń z ręki **GŁÓWNEJ**. Off-hand losował krytyka cudzą szansą. Układ nagradzał trzymanie broni o wysokim krytyku w MH i karał za włożenie jej do OH |
| **Stamina DW** | koszt zamachu ∝ długość zamachu, a `DUAL_WIELD.swingMul` skraca zamach **i** cooldown tym samym mnożnikiem → mnożnik skracał się w rachunku. DW dostawał +24% ciosów **taniej** niż jedna broń. Wysiłek liczy się teraz z zamachu **bez** przyspieszenia DW |
| **`war_hammer` reach 74→80** | sięgał tyle co starterowy kij i **mniej** niż jednoręczny `Młot` (78) — cecha „większy zasięg" dla tej broni nie zachodziła |
| **Szarża dzika** | brak warunków wejścia: szarżował w zwarciu i przez drzewo. Dodane `chargeOdlegloscOk` (próg = istniejące `gore.range`) i `chargeTorWolny` (`NavGrid.hasClearLine`), oba **PRZED** `request` |
| **Oscylacja objazdu** | „zobowiązanie" było preferencją na jedną próbę: wachlarz szedł kątami, więc przy zajętej stronie zobowiązanej **przepinał się** na drugą. Zobowiązany przechodzi teraz cały wachlarz po swojej stronie; `probe(0)` nie kasuje zobowiązania |
| **Powroty do przeszkody** | `SteerSolver` zerował `steerState` przy `hold`, a dzik woła `hold()` przy KAŻDEJ akcji (telegraf 560 ms). Każda pauza wymazywała stronę objazdu. Teraz `impulse` kasuje, `hold` **zachowuje** |
| **Pętla przy nieosiągalnym celu** | `findPath` zwracał `null` = „nie ma trasy", ale `PathFollower.next()` zwracał `null` także przy „trasa niepotrzebna" — wołający nie odróżniał. Dodane `unreachable`; `Enemy` traktuje brak trasy jak zbyt duży dystans (istniejące `onLoseAggro`) |
| **Biała kreska zamiast plecaka** | rząd TOREB wypadł z pierwszego przemalunku panelu; ikony zostawały na teksturze `__MISSING` Phasera. Konstruktor malował każdą inną grupę |
| **Plecak w sklepie pod „ZAŁOŻONE"** | viewport brał dolną granicę z `h/2 − 44` (206) zamiast z nagłówka „ZAŁOŻONE" (88). Plus `refresh()` włączał wejście ikonom poza oknem |
| **`atrybuty_kalibracja` kłamała** | czytała `"critMultiplierBonus" in f` (kształt sprzed Weapon Traits V1) i `hpPerEndurance` (nazwa sprzed rozdziału atrybutu). Dokumentacja miała rację, przymiar nie |

## 4.3 Otwarte problemy

1. ⚠⚠ **PLAYTEST WSZYSTKIEGO Z TEJ SESJI.** Renderu nie widział żaden agent —
   podgląd nie uruchamia gry. Czekają: odczucie trzech stref bloku, wartość
   `sideZoneMul = 0,50`, DW 2× sztylet, zachowanie dzika w gęstwinie,
   przewijanie sklepu przy pełnych torbach, drag&drop na przewiniętej liście.
2. **2H cechy 4–5 nieosiągalne** — wymagają obrony po stronie wroga (nowy
   podsystem). ⛔ Nie implementować „premii przeciw blokowi", bo nie ma na co
   działać.
3. **`Młot` (`hammer`) jest `hands: 1` o parametrach 2H** (14–20, cd 0,65,
   swing 240, reach 78) i łamie wszystkie trzy dowiezione cechy 2H od strony
   jednoręcznej. §Y trzyma ten wyjątek jawnie.
4. **Krytyk gracza nie wynika z `P`** — u wroga wariant C wyprowadza go
   z biegłości. Asymetria zaakceptowana, spójność semantyczna to dług.
5. **Asercja cenowa: 23 naruszenia zamiast 4** — roster urósł 7 → 11 broni.
6. **Czy Zręczność ma za dużo korzyści** (4 kanały wobec 1 Kondycji) —
   `atrybuty.md` §11.5 tłumaczy, dlaczego nie da się odpowiedzieć bez nowego
   pomiaru.
7. **Dług nazewniczy `SHIELD.blockArcDeg`** — nazywa półkulę, nie łuk bloku.

## 4.4 Świadomie odłożone

- **Balans wartości broni** — decyzja §2 pkt 4: dopiero po playteście trzech
  konfiguracji.
- **Kary MH/OH w DW** — §W7 pilnuje, że nie istnieją. Nie dokładać, zanim
  playtest nie pokaże, że są potrzebne.
- **Mastery / skille / progresja DW i 2H.**
- **`uninterruptible`** dla 2H — byłoby placebo (próg `heavy` praktycznie
  nieosiągalny).
- **Stary wpis „Siła to płaska premia" w `CLAUDE.md`** — nieaktualny, ruszyć
  tylko przy świadomym porządkowaniu tego pliku.

## 4.5 Najbliższy sensowny krok

**PLAYTEST.** Nie ma sensownej pracy projektowej przed nim — sześć mechanik
z tej sesji czeka na jedno uruchomienie gry. Kolejność sprawdzania: dzik
w gęstwinie (trzy poprawki AI naraz) → trzy strefy bloku → DW 2× sztylet →
sklep z pełnymi torbami.

## 4.6 Testy — ostatnie wyniki (koniec sesji)

```
npx tsc --noEmit ............ czysto
npm run build ............... czysto
combat_regresja ............. 121/121, ZERO RÓŻNIC
atrybuty_kalibracja ......... 10/10 samosprawdzenia
combat_benchmark ............ VALIDATION 12/12, deterministyczny
tools/*weryfikacja*.mjs ..... 10/10 OK
  movement_weryfikacja ...... 21 asercji (§OSC, §OSC2, §REACH)
  ui_panele_weryfikacja ..... §1 viewport sklepu, §2 przemalunek ikon
combat_regresja §Z .......... 20 OK (szarża dzika)
```

⚠ **Sabotaż każdego nowego strażnika** (reguła „asercja, która nie potrafi
zaświecić na czerwono, jest dekoracją"): §X 7/7 · §Y 5/5 · §Z 7/7 · §W 6/6 ·
§OSC 4/4 · §OSC2 5/5 · §REACH 3/3 · `ui_panele` §1 3/3, §2 2/2.
⚠ **Pięć strażników przeszło sabotaż w pierwszej wersji i wymagało wzmocnienia**
— najczęstsza pomyłka: sprawdzanie ISTNIENIA metody zamiast jej UŻYCIA, oraz
`\b` w regexie tam, gdzie sabotaż wchodzi przedrostkiem (`_blockReduction`,
`itemHands`).

# 5. NIEZACOMMITOWANE ZMIANY (32 M + 5 ??)

**Nowe pliki (5):**
`docs/archetypy_walki.md` · `docs/konfiguracje_broni_checkpoint.md` (ten plik) ·
`src/core/combat/DamageRoll.ts` · `tools/combat_benchmark.mjs` ·
`tools/ui_panele_weryfikacja.mjs`

**Kod gry (11):** `src/config/GameConfig.ts` · `src/core/DamageResolver.ts` ·
`src/core/Equipment.ts` · `src/core/Progression.ts` · `src/core/Protection.ts` ·
`src/core/movement/{Locomotion,NavGrid,PathFollower,Steering}.ts` ·
`src/core/movement/solvers/SteerSolver.ts` · `src/entities/{Boar,Enemy,Player}.ts` ·
`src/scenes/GameScene.ts` · `src/ui/{AimPreview,PlayerPanel,PracticeToast,ShopPanel}.ts`

**Narzędzia (4):** `tools/atrybuty_kalibracja.mjs` · `tools/combat_regresja.mjs` ·
`tools/combat_regresja_baseline.json` (⚠ **przemrożony świadomie** — jedna
zmiana zachowania: cios równo z boku `hit 14` → `block 12`) ·
`tools/movement_weryfikacja.mjs`

**Dokumentacja (9):** `docs/{README,atrybuty,audyt_walka_progresja_2026-09-03,
dziennik,ekwipunek_mechanika,stamina_model,tarcze_analiza,wypad_i_szarza,
zaimplementowane}.md` · `src/core/CLAUDE.md`

⚠ **Przed commitem sprawdź, czy zakres jest zamierzony** — to jest praca
z trzynastu wpisów dziennika, nie z jednego zadania.

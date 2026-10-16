---
typ: STAN
domena: combat
tytul: Walka — pipeline ciosu i łańcuch rozstrzygania
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-07, przymiar:doc_check, przymiar:combat_regresja]
kotwice:
  - src/core/HitResolver.ts
  - src/core/CombatGeometry.ts
  - src/core/DamageResolver.ts
  - src/core/Defense.ts
  - src/core/combat/DamagePacket.ts
  - src/core/combat/DamageRoll.ts
  - GameConfig.PLAYER.swingHitFraction
  - GameConfig.DEFENSE
otwarte: [OI-33, OI-34, OI-86]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-11
---

# Walka — pipeline ciosu i łańcuch rozstrzygania

> **Czym jest ten dokument.** Odpowiedzią na pytanie **co się dzieje z ciosem od
> naciśnięcia do HP**: jakie bramki go wpuszczają, co zamraża się w chwili
> zamachu, w jakiej kolejności rozstrzyga się trafienie i co z niego wynika.
>
> **Czym NIE jest.** Nie opisuje broni, pancerza, tarczy, biegłości, umiejętności
> ani zachowań stworzeń — te domeny wchodzą tu **wejściami**, a dokument
> zatrzymuje się na ich granicy (§0). Nie jest też historią przebudowy.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| bramki ciosu, kolejność warstw, zaokrąglenie, skutki trafienia | **`combat`** |
| jak dobrze cios wykonano (warstwa 2), `m(P)`, ześlizg | `proficiency` |
| ile zdejmuje materiał i krzywa ochrony | `armor` |
| strefy osłony i koszt bloku | `shields` |
| zasięg, wariant i typ obrażeń konkretnej broni | `weapons`, `items` |
| liczby, cooldowny i ładunki umiejętności | `abilities` |
| kto atakuje i jak wygląda telegraf stworzenia | `creatures` |
| dźwięk, tint, napis, hit-stop jako **oprawa** | `presentation` |
| ile kosztuje zamach, unik, blok | `stamina` |

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `combat` **czyta** | `weapons`, `items` | zamrożony profil ciosu: zasięg, typ, odrzut, przerwanie, zachwianie |
| `combat` **czyta** | `proficiency` | wynik warstwy 2 i `m(P)` |
| `combat` **czyta** | `armor`, `shields` | dwa gotowe **ułamki** redukcji + strefę osłony |
| `combat` **daje** | `stamina` | obrażenia PO mitygacji (koszt przyjętego ciosu) |
| `combat` **daje** | `progression`, `economy` | księgowość zabójstwa |
| `combat` **daje** | `presentation` | wynik + wykonanie + kategorię impaktu |

⚠ **Wszystkie wejścia z innych domen przychodzą jako DANE, nie jako odczyt
singletonów.** Resolvery dostają gotowe ułamki i liczby, nie sięgają po
`Equipment` ani `Progression`. To jest warunek, pod którym da się je uruchomić
poza silnikiem — i jedyny powód, dla którego uprząż regresyjna cokolwiek
dowodzi.

---

## 1. Pipeline ciosu gracza

### 1.1 Bramki — kolejność jest treścią

```
ruch?                  → nic (ruch = brak ataku)
zamach w locie?        → nic (JEDEN slot ciosu)
cooldown?              → nic
brak celu?             → nic
cel poza zasięgiem?    → nic
zwrot niezgodny?       → czeka, autoatak zostaje UZBROJONY
```

⚠⚠ **„Nic się nie dzieje" to NIE jest pudło.** Odmowa przed zamachem nie zużywa
cooldownu, animacji ani trwałości broni. Cios poza zasięgiem, który „i tak by
poszedł", jest kosztem za zero — i dlatego bramka zasięgu stoi **przed**
rozpoczęciem zamachu, a nie przy trafieniu.

⚠ **Ruch wyklucza atak** (model znany z Wild Rift): zamach ukorzenia, więc
start w biegu zamieniałby każdy odwrót w kuśtykanie. ⚠ Sprawdzane **przed**
cooldownem, żeby chodzący gracz go nie spalał; zatrzymanie wznawia bicie
w następnej klatce, **bez ponownego naciśnięcia**.

⚠ **Od 2026-09-11 podaje powód — była jedyną cichą.** ⚠⚠ **Zdolności tej bramki
NIE MAJĄ i to jest rola:** ukorzeniają przy zamachu, więc zatrzymanie jest ich
skutkiem, nie warunkiem. ⛔ Nie zrównywać (OI-90).

⚠ **Jeden slot zamachu, którego nie wolno nadpisać.** Przy zwykłym autoataku
to się nie zdarza (cooldown jest dłuższy niż pół zamachu), ale **akcja o celowo
długim zamachu zostałaby po cichu zjedzona**: obrażenia nigdy by nie padły,
a koszt i cooldown zostałyby zapłacone.

### 1.2 Commit — co się ZAMRAŻA

W chwili naciśnięcia zamrażany jest **profil ciosu**: typ obrażeń, zasięg,
odrzut, przerwanie, zachwianie, biegłość i rodzina broni.
⚠⚠ **ŁUK WYPADŁ Z PROFILU 2026-09-18** — należy do UMIEJĘTNOŚCI, nie do broni
(`decyzje/2026-09-18-luk-nalezy-do-umiejetnosci.md`).

⚠⚠ **Zamrożenie jest mechaniką, nie optymalizacją:** przezbrojenie w oknie
zamachu nie zmienia ciosu, który już poszedł.
⚠ **Nauka pyta o co innego** i czyta wartość ŻYWĄ: „jak dobrze go
wyprowadziłeś" i „ile umiesz" to dwa pytania (`proficiency`).

W tej samej chwili płacone są: cooldown, wysiłek i **jeden** rzut na zużycie
broni. ⚠ **Zużycie liczy się raz na ZAMACH, nigdy raz na trafionego wroga.**

### 1.3 Rozstrzygnięcie — w połowie zamachu

Cios rozstrzyga się po `PLAYER.swingHitFraction` długości zamachu, tam gdzie
ostrze jest wyprostowane.

⚠ **Slot zamachu jest zerowany PRZED liczeniem** — inaczej ten sam cios dałoby
się rozstrzygnąć dwa razy.

⚠ **Zamach porzucony Unikiem znika, ale koszt i zużycie ZOSTAJĄ zapłacone.**
To jest cena zmiany zdania, nie usterka.

---

### 1.4 Kadencja dwóch rąk

Gdy druga ręka trzyma **broń**, ciosy idą **naprzemiennie na tym samym,
jedynym slocie zamachu**: ręka oddaje głos drugiej dopiero po rozstrzygnięciu.
⛔ Nie ma drugiego slotu i nie ma równoległych zamachów — cała reszta §1
obowiązuje bez zmian.

⚠ **Zejście na rękę główną, kiedy druga ręka nie jest bronią, to ŚCIEŻKA
NORMALNA, nie bezpiecznik.** Tarcza i pusta ręka nie mają profilu ciosu.

⚠⚠ **Zasięg obu rąk to JEDNA liczba, należąca do postaci** — reguła i powód
mieszkają w `weapons` §4.

⚠⚠ **Mnożnik kadencji jedzie TYM SAMYM kanałem, którym tarcza SPOWALNIA
zamach** — jeden kanał, dwa przeciwne użycia. ⛔ Nie dokładaj drugiego.

⚠ **Liczba mnożnika jest PLACEHOLDEREM, nie wynikiem strojenia.** Przy 1 model
naprzemienny jest z konstrukcji stratą (połowa ciosów idzie słabszą ręką przy
niezmienionej kadencji), więc bez niej nie dałoby się ocenić niczego poza tym,
że jest gorzej.

⚠ Wysiłek liczy się z zamachu **bez** tego przyspieszenia (`stamina`), a każda
ręka niesie **własną rodzinę, cechę, rangę i krytyk** (`weapons` §6).

---

## 2. Trzy warstwy i łańcuch obrony

```
warstwa 1   czy cios kogo dosięga?          → pudło geometryczne
warstwa 2   jak dobrze go wykonano?         → domena `proficiency`
warstwa 3   czy obrońca się obronił?        → nietykalność → unik → parowanie → blok → pancerz
```

⚠⚠ **KOLEJNOŚĆ warstwy 3 jest treścią, nie szczegółem.** Unik jest
**wszechkierunkowy** i próbowany zawsze; parowanie jest **frontalne**; blok ma
własne, szersze strefy (domena `shields`); pancerz działa zawsze.

⚠⚠ **JEDNO zaokrąglenie, na samym końcu.** Obie redukcje mnożą się jako ułamki
i dopiero wynik idzie do zaokrąglenia. Kolejność pancerz ↔ tarcza jest
numerycznie obojętna (mnożenie ułamków) i wybrana dla czytelności — **liczba
zaokrągleń obojętna NIE jest**: przy dzisiejszych obrażeniach podwójne
zaokrąglenie zjadłoby cały efekt tarczy na małych ciosach.

⚠ **Nigdy poniżej 1 punktu.** Cel w ciężkim pancerzu byłby inaczej
nieśmiertelny, a pływające „0" czyta się jako zepsutą grę.

⚠ **Unik i parowanie mają PRD (rozkład pseudolosowy), nie zwykły rzut**, i
**osobne, niezależne liczniki**. ⚠⚠ **Wołanie łańcucha ma SKUTEK UBOCZNY
w liczniku serii** — dlatego ⛔ **nie wolno wołać go „na próbę"**, np. żeby
pokazać podgląd obrażeń. Do tego służy sama arytmetyka ochrony.

⚠ **Wołający czyta WERDYKT, nie odtwarza redukcji z wyniku.**

---

## 3. Warstwa 1 — geometria

⚠⚠ **Mierzymy PRZEŚWIT, nie dystans środków.** Zero znaczy „stykają się",
wartość ujemna — „nachodzą". Tylko dzięki temu jedna liczba znaczy to samo dla
królika i dla niedźwiedzia.

⚠ **Zasięg ATAKU ma własną konwencję i celowo się jej trzymamy**: od punktu
napastnika do **KRAWĘDZI** hurtboxa celu. ⛔ Zmiana tej konwencji zmieniłaby
znaczenie **każdej liczby zasięgu w grze naraz** — i nie dałoby się rozdzielić
skutków od zmiany kształtu.

⚠ **`CombatBody` to NIE `HitShape`.** Pierwsze odpowiada na „gdzie tę istotę da
się trafić", drugie na „co obejmuje ten konkretny cios". Dzik może mieć okrągłe
ciało i kapsułowatą szarżę.

⚠ **Kąt liczy się w STOPNIACH, nie przez cosinusy.** Przy progu 90° cosinus
wynosi `6,1e-17` zamiast zera i o trafieniu decyduje szum zmiennoprzecinkowy.
Projekt zapłacił za tę lekcję raz — ⛔ nie wolno jej cofnąć.

⚠ **Bramka zwrotu ataku i przednia półkula obrony to JEDEN predykat**, pytany
z dwóch stron: „trafiasz to, co mógłbyś zablokować". ⚠ Jedyne obejście to
**bąbel zwarcia** liczony w prześwicie, **wymagany jako parametr** — wartość
domyślna zlałaby „ta akcja świadomie nie ma furtki" z „ktoś nie pomyślał".

---

## 4. Obrażenia: pakiet, rzut, krytyk

⚠ **Cios podróżuje jako PAKIET komponentów, nie jako para liczba+typ.** Dziś
każdy pakiet ma **dokładnie jeden** komponent i liczy się co do bitu tak, jak
przed wprowadzeniem tego kontraktu. ⛔ Żywiołów, odporności, penetracji ani
absorpcji **nie ma i nie miało być**.

⚠⚠ **Jak mitygować pakiet WIELOSKŁADNIKOWY jest świadomie NIEROZSTRZYGNIĘTE**
(OI-34) — dlatego warstwa 3 pracuje na SUMIE, a szew jest w dwóch funkcjach
spłaszczających pakiet do dzisiejszej pary.

⚠ **Krytyk jest rzucany POZA paskiem wykonania**, osobnym rzutem. To dwie różne
osie: „jak dobrze wyszedł" i „czy trafił w słaby punkt".

⚠ **JEDEN rzut, DWA odwzorowania.** Ten sam wylosowany ułamek daje obrażenia
ciosu **i** snapshot dla efektów pochodnych — bez zużycia drugiego losowania,
czyli **bez ruszenia globalnego strumienia**. Gdyby snapshot brał osobny rzut,
krytyk podnosiłby efekt pochodny **pośrednio**, przesunięciem rozkładu.

⚠ **Wrogowie nigdy nie krytykują** — wpisane wprost, nie wyprowadzone z braku
szansy. ⚠ To jest **asymetria zaakceptowana**, nie luka: u gracza krytyk siedzi
w warstwie 1 i nie wynika z biegłości (domena `proficiency`, `OI-30`).

---

## 5. Zobowiązanie: POZA i UKORZENIENIE to DWA timery

⚠⚠ **To są dwie osobne liczby i mylenie ich jest najłatwiejszym błędem w tej
domenie.**

| timer | co trzyma | z czego wynika |
|---|---|---|
| **poza ataku** | animacja **i kierunek osłony** | długość zamachu + bufor |
| **ukorzenienie** | zobowiązanie ciała | zobowiązanie + **odzyskanie skracane Zręcznością** i wydłużane zmęczeniem |

⚠ **Równe są WYŁĄCZNIE przy Zręczności 0 i bez zmęczenia.** Przy pełnej
redukcji odzyskania ukorzenienie kończy się **wyraźnie wcześniej** niż poza —
czyli tarcza kryje kierunek ataku jeszcze przez chwilę, gdy gracz może już
odejść. Przy wyczerpaniu jest odwrotnie: gracz stoi zakorzeniony, a osłona
wróciła już do kierunku ruchu. ⚠ **Kto cytuje „root równa się pozie", cytuje
stan sprzed 2026-08-20** (OI-32).

⚠ **Zmęczenie wydłuża WYŁĄCZNIE odzyskanie, nigdy zobowiązania.** Zapowiedź
ciosu jest informacją dla obu stron; rozciąganie jej psuje czytelność.

⚠ **Ciężkie trafienie KASUJE zamach gracza w locie.** Lekkie i średnie nie
ruszają go w ogóle — kategoria impaktu jest tu mechaniką, nie oprawą.

---

## 6. Skutki trafienia

⚠⚠ **PRZERWANIE, ZACHWIANIE i EFEKT CZASOWY to trzy różne rzeczy** i broń może
mieć jedno, drugie, oba albo żadne:

| skutek | co robi |
|---|---|
| **przerwanie** | kasuje zamach celu (i uzbraja mu cooldown akcji) |
| **zachwianie** | rusza **wyłącznie ruch**, niczego nie kasuje |
| **efekt czasowy** | zostaje na celu i tyka własnym zegarem |

⚠⚠ **Wszystkie trzy obowiązuje reguła „tylko na trafieniu, które NIE ZABIŁO".**
Przerywanie, chwianie i ranienie trupa nic nie znaczy, a stan celu jest już
zdemontowany. ⛔ Nowy skutek trafienia dopisuje się **do tej samej reguły**, nie
obok niej.

⚠ **Efekt czasowy przechodzi przez warstwę 2 tym samym wynikiem, co cios, który
go zadał** — osobny rzut byłby drugim pytaniem o to samo.

⚠ **Księgowość zabójstwa (XP, łup, zadania, odrodzenie) ma JEDNO miejsce.**
Śmierć sama z siebie nie przyznaje niczego — pominięcie tej ścieżki daje wroga,
który znika bez nagrody i bez odrodzenia, **nie zgłaszając niczego**.

---

## 7. Wyjątki od kolejności — komplet

⚠ **Ta lista jest treścią domeny, nie przypisem.** Każda pozycja jest decyzją.

| wyjątek | na czym polega |
|---|---|
| **jad** | omija pancerz, tarczę, typ, unik, parowanie **i nietykalność** — trucizna jest już w środku |
| **kontakt przez nachodzenie ciał i pocisk** | brak zdarzeń warstwy 2; sam `m(P)` nanoszony przed wysłaniem |
| **część ataków stworzeń** | świadomie **nie fuszerują** — nie mają dyskretnej chwili rozstrzygnięcia albo ich warstwa 1 zawiera już celowanie |
| **wszystkie umiejętności gracza** | ⚠ **żadna nie fuszeruje**; fuszerka dotyczy wyłącznie autoataku |
| **pusty zamach** | wykonanie „czysto" jest tu **deklaracją**, że warstwa 2 się nie wypowiada, a nie wynikiem rzutu |
| **zamach porzucony Unikiem** | znika, ale cooldown i zużycie zostają zapłacone |
| **ciężkie trafienie** | kasuje zamach gracza (§5) |
| **krytyk** | poza paskiem wykonania (§4) |
| **nietykalność po odrodzeniu** | ta sama ścieżka co unik |
| **popup obrażeń** | liczy pancerz drugi raz — wolno, bo funkcja jest czysta i daje tę samą liczbę |

⚠⚠ **Dwie ścieżki wciąż rozstrzyga fizyka silnika, nie geometria walki**:
kontakt dwóch stworzeń i pocisk (OI-33).

---

## 8. Niezmienniki

- **N-44** — **odmowa przed zamachem nic nie kosztuje** („nic się nie dzieje" ≠ pudło).
- **N-45** — **jeden slot zamachu**, nie do nadpisania (§1.1).
- **N-46** — **profil ciosu zamraża się przy commicie** (§1.2).
- **N-47** — **zużycie broni raz na ZAMACH**, nigdy per trafiony cel.
- **N-48** — **jedno zaokrąglenie na końcu łańcucha** i **podłoga 1 punktu**.
- **N-49** — **kolejność warstwy 3 jest treścią** (§2).
- **N-50** — ⛔ **nie wolno wołać łańcucha obrony „na próbę"** — ma skutek
  uboczny w licznikach PRD.
- **N-51** — **prześwit, nie dystans środków**; zasięg ataku do KRAWĘDZI celu.
- **N-52** — **kąt w stopniach, nigdy przez cosinusy** (§3).
- **N-53** — **atak i obrona dzielą jeden predykat kąta** (§3).
- **N-54** — **`CombatBody` ≠ `HitShape`** (§3).
- **N-55** — **poza ≠ ukorzenienie** (§5).
- **N-56** — **skutek trafienia tylko wtedy, gdy cios NIE ZABIŁ** (§6).
- **N-57** — **resolvery są CZYSTE i dostają dane, nie singletony** (§0.1).
- **N-58** — **pakiet obrażeń ma jeden konstruktor**; nowy rodzaj ciosu trafia
  w istniejący krok, nie dopisuje własnego.

---

## 9. Checklisty

**Nowy cios (broń, umiejętność, atak stworzenia):** rozstrzygnij jawnie, czy
fuszeruje · zdecyduj, co zamraża commit · sprawdź, czy odmowa jest bezkosztowa
(N-44) · skutki dopisz do reguły „nie na trupie" (N-56) · nie dokładaj drugiego
zaokrąglenia (N-48).

**Zmiana geometrii:** ⛔ nie ruszaj konwencji prześwitu bez przeliczenia
WSZYSTKICH zasięgów naraz (N-51) · kąt w stopniach (N-52) · sprawdź, czy
podgląd celowania mierzy tą samą liczbą co commit.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/combat_regresja.mjs` (⚠ **zamrożony baseline — różnica jest
sygnałem, nie błędem do wyciszenia**).

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| bramki ciosu i ich kolejność | ✅ | ✅ | `kod:2026-09-11` |
| zamrożenie profilu w commicie | ✅ | ✅ | `przymiar:combat_regresja` |
| rozstrzygnięcie w połowie zamachu | ✅ | ✅ | `kod:2026-09-06` |
| warstwa 1 na prześwicie i śladzie stopy | ✅ | ✅ | `przymiar:combat_regresja` |
| kolejność warstwy 3 + jedno zaokrąglenie + podłoga | ✅ | ✅ | `przymiar:combat_regresja` |
| PRD z osobnymi licznikami | ✅ | ✅ | `przymiar:combat_regresja` |
| pakiet obrażeń, jeden konstruktor | ✅ | ✅ | `przymiar:combat_regresja` §U |
| jeden rzut, dwa odwzorowania | ✅ | ✅ | `przymiar:combat_regresja` |
| przerwanie / zachwianie / efekt czasowy | ✅ | ✅ | `przymiar:combat_regresja` |
| reguła „nie na trupie" | ✅ | ✅ | `przymiar:combat_regresja` §V |
| naprzemienność rąk na jednym slocie zamachu | ✅ | ✅ | `kod:2026-09-07` |
| poza ≠ ukorzenienie | ✅ | ✅ | `kod:2026-10-09` |
| kontakt i pocisk poza geometrią walki | ✅ *(dług)* | ✅ | — OI-33 |
| mitygacja pakietu wieloskładnikowego | ❌ *(świadomie)* | ✅ | — OI-34 |
| czy walka CZUJE się dobrze po feedbacku | ✅ | ⚠ | ❌ `reka` — OI-35 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-32** | ✅ **ZAMKNIĘTE 2026-10-09** — komentarz przy `SHIELD` (`GameConfig`) mówi dziś „pokrywa się, nie równa”. |
| **OI-33** | ⚠ **Dwie ścieżki obrażeń wciąż rozstrzyga fizyka silnika**, nie geometria walki: kontakt dwóch stworzeń i pocisk. Zapisane jako świadomy dług; ⚠ **wyłączenie kontaktu pająków jest realnym osłabieniem**, nie porządkami — u obu to istotna część wyjścia. |
| **OI-34** | ⚠⚠ **Mitygacja pakietu WIELOSKŁADNIKOWEGO jest świadomie nierozstrzygnięta** i jest to pytanie **projektowe**, nie techniczne: podłoga na każdym komponencie zmieniałaby dolny koniec zależnie od podziału, a blok i pancerz mają dziś jeden mnożnik na cały cios. ⛔ **Nie rozstrzygać przez przypadek implementacji** — do chwili, gdy pojawi się pierwszy realny drugi komponent, warstwa 3 pracuje na sumie. |
| **OI-86** | ⚠ **Mnożnik kadencji dwóch rąk jest PLACEHOLDEREM i nikt tym nie zagrał.** Liczba stoi w configu wyłącznie po to, żeby prototyp miał jakiekolwiek tempo do oceny ręką; przy 1 model naprzemienny jest z konstrukcji stratą. ⛔ Nie dobierać jej „na oko" — kadencje parytetu policzone na żywym configu leżą w `docs/archetypy_walki.md` §2. |
| **OI-35** | ⛔ **ODRZUCONE decyzją autora 2026-09-08 — nie implementować.** Kanoniczny zapis stoi w domenie właściciela: `docs/systemy/creatures.md`. Tu zostaje wyłącznie ślad, bo `combat` jest właścicielem kształtu, którego ta naprawa by użyła. |

⚠ **Osobno, poza numeracją `OI`:** dwa mechanizmy stanów (`OI-27`) oraz
**głębokość hurtboxa niedźwiedzia — jedyna ZGADNIĘTA liczba w geometrii walki**;
każda inna została zmierzona na klatkach arkusza.

---

## Czego ten dokument nie rozstrzyga

- **Żadnej liczby** — zasięgi, cooldowny i odrzuty żyją w konfigu.
- **Balansu.** Pełny pass balansu nie został wykonany i jest tego świadomy.
- **Jak dobrze cios wykonano** — domena `proficiency`.
- **Ile zdejmuje pancerz i tarcza** — `armor`, `shields`.
- **Zachowań i telegrafów stworzeń** — `creatures`.
- **Oprawy trafienia** (dźwięk, tint, napis, kamera) — `presentation`.
- **Czy warstwa efektów czasowych ma wchłonąć ogłuszenie** — `OI-27`.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **30 decyzji z ich MOCĄ**, rozjazdy kod↔dokumentacja, pomiary pozy i ukorzenienia | `docs/proces/ekstrakcja_combat.md` |
| dlaczego wróg nie ma obrony i czego z tego powodu **nie da się zbudować** | `docs/decyzje/2026-09-07-obrona-wroga-nie-istnieje.md` |
| dlaczego ochrona liczy się w punktach i skąd typ obrażeń | `docs/systemy/armor.md` |

---
typ: OPERACYJNE
domena: stamina
tytul: Protokół playtestu OI-105a — Model D na osiągalnym katalogu
stan: zywy
otwarte: [OI-105, OI-106]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# PROTOKÓŁ OI-105a — Model D, pasmo 12–55,5 kg

> **Po co ten plik.** Żeby playtest Modelu D dał się wykonać ręką, zapisać
> i porównać — zamiast skończyć jako „chyba czuć". Wypełnia się go **w trakcie
> grania**, nie po.
>
> ⛔ **To NIE jest kalibracja Modelu D.** Model kalibrowano na paśmie
> **10–75,5 kg**; grywalne dziś jest **12–55,5 kg**, czyli dolne ~68% krzywej
> (po uzupełnieniu dystrybutorów 2026-09-15 — było ~55%).
> Wniosek „nie czuć" z tego protokołu **nie dowodzi, że model jest zły** —
> dowodzi, że zawartość nie sięga tam, gdzie model zaczyna mówić. Pasmo
> 47–75,5 kg to osobny test (`OI-105b`, po `OI-98`).
>
> ⛔ **Nie zmieniaj tu żadnej liczby balansu.** Parametry Modelu D są
> **STARTOWE** (`docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` §3); zmiana
> po playteście jest dozwolona, ale **po wyniku, nie w trakcie**.
>
> **Jak mierzyć:** `docs/dev_console.md`, sekcja „Pomiar obciążenia w locie".

---

## 1. Pięć buildów — wyłącznie towar ze sklepów

⚠ **Żaden nie wymaga konsoli do zdobycia.** Wszystkie mieszczą się
w obserwowanym portfelu z rozgrywki (1618 g).

⚠ **Koszty to ceny FAKTYCZNE u kupca**, czyli po przeskalowaniu jakością
(`buyPriceOf(id, vendorQuality(...))`), a nie `buyPrice` z katalogu. Półka
Radzima idzie w jakości 1–2, więc stal jest tam **tańsza** niż cena bazowa.

| # | zestaw | skład | kg | PP | koszt | gdzie |
|---|---|---|---|---|---|---|
| **A** | lekki | skóra ×5 + miecz + puklerz | **12,0** | 35 | 185 g | Myśliwy + Kowal |
| **B** | średni | kolczuga ×5 + miecz + puklerz | **25,5** | 55 | 223 g | Kowal |
| **C** | mieszany | stal ×4 + kolcz. nogawice + topór + puklerz | **30,5** | 64 | 306 g | Kowal |
| **D** | ⭐ **MAKS NOSZONY** | kirys + nabiodrki + stal ×3 + młot + tarcza okuta | **45,5** | 83 | 588 g | Kowal |
| **E** | D + drugi zestaw | D + młot i tarcza **schowane** | **55,5** | **83** | 963 g | Kowal |

**Dokładny skład (identyfikatory do `dev.Inventory.addItem`):**

```
A: leather_helmet leather_chest leather_gloves leather_legs leather_boots sword buckler
B: mail_coif mail_hauberk mail_gloves mail_chausses mail_boots sword buckler
C: steel_helmet steel_chest steel_gauntlets mail_chausses steel_boots axe buckler
D: steel_helmet cuirass steel_gauntlets cuisses steel_boots hammer ironbound_shield
E: D + weapon2=hammer, offhand2=ironbound_shield   (drugi młot i druga tarcza)
```

⚠ **`E` ma te same PP co `D`** — schowany zestaw nie chroni, tylko waży. To jest
najczystszy test `OI-96` w całym protokole: **+10 kg, zero korzyści**.

⚠⚠ **`war_hammer` NIE WCHODZI do `D` ani `E`.** Ma `hands: 2`, a
`Equipment.handsRefusalFor` nie pozwala trzymać przy nim tarczy — zestaw
„młot bojowy + tarcza" jest **nielegalny** i nie da się go założyć w grze.
Najcięższa legalna para to `hammer` (1H, 5 kg) + `ironbound_shield`.

⚙ **Podniesione 2026-09-15 z 36,5 / 46,5 kg.** `cuirass` (17 kg) i `cuisses`
(10 kg) dostały dystrybutora (Kowal, jakość 1–2), więc pełny ciężki zestaw jest
od tej daty do kupienia normalnie. ⚠ Wcześniejsza wartość „47,5 kg" z audytu
`OI-105` była **zestawem nielegalnym** — składano ją przypisaniem do pól,
z pominięciem reguły dwuręczności.

---

## 2. Wymagane wartości Siły i treningu

| test | Siła | trening |
|---|---|---|
| T1, T2, T4 | dowolna — **chód nie zależy od Siły** | brak |
| **T3** | 20 | brak |
| **T5 (R-1)** | **0 → 10 → 20 → 26** | brak |
| **T6** | 20 | **0 → I → II → III** |

⚠ **Siła 26 to maksimum realne przy poziomie 27** (49 pkt na całe życie, 26 przy
obserwowanym poziomie). Wyżej wchodzimy w build, którego dziś nie da się zagrać —
jeśli chcesz zobaczyć Siłę 40+, oznacz wynik jako **eksperyment diagnostyczny
poza contentem**, nie jako `OI-105a`.

Ustawianie: `docs/dev_console.md`.

---

## 3. Wartości ODNIESIENIA — policzone przed testem

⚠ **Nie są to wyniki.** Są tym, czego model się spodziewa — po to, żeby dało się
zobaczyć rozjazd między arytmetyką a ciałem fizycznym.

### Chód (px/s) — ⛔ niezależny od Siły i od rang I–II

| build | kg | chód | sprint | Szary 132 | wataha 115 | skoczek 96 |
|---|---|---|---|---|---|---|
| A | 12,0 | **148,0** | 237 | ucieka | ucieka | ucieka |
| B | 25,5 | **136,0** | 218 | ucieka | ucieka | ucieka |
| **C** | 30,5 | **132,0** | 211 | ⚠ **REMIS** | ucieka | ucieka |
| D | 45,5 | **121,3** | 194 | ⛔ NIE | ucieka | ucieka |
| **E** | 55,5 | **115,1** | 184 | ⛔ NIE | ⚠ **REMIS** | ucieka |

⚠⚠ **DWA punkty pomiarowe wypadają na styk i oba są przewidziane:**
**C daje 131,97 px/s przy Szarym 132** (różnica 0,03 px/s) oraz **E daje
115,1 px/s przy watasze 115** (różnica 0,1 px/s). Wyniki tych dwóch pomiarów
**będą niejednoznaczne**. Nie traktuj niejednoznaczności jako błędu pomiaru.

⚠ Trzeci styk: **E w sieci daje 63,3 px/s przy sieciarzu 62** — margines
1,3 px/s (patrz T4).

### Koszt uniku wg Siły (baza 15,0) — hipoteza R-1

| build | kg | STR 0 | STR 10 | STR 20 | STR 26 | kara znika od Siły |
|---|---|---|---|---|---|---|
| A | 12,0 | 15,7 | 15,0 | 15,0 | 15,0 | **0,7** |
| B | 25,5 | 24,8 | 15,2 | 15,0 | 15,0 | 10,5 |
| C | 30,5 | 28,2 | 16,7 | 15,0 | 15,0 | 14,2 |
| **D** | 45,5 | 38,3 | 21,2 | **16,4** | **15,7** | **32,7** |
| **E** | 55,5 | 45,0 | 24,2 | **18,3** | **17,4** | 50,9 |

⭐⭐ **To osłabia hipotezę `R-1`, i to jest wynik, nie poprawka.** Przy starym
`D` (36,5 kg) kanał wysiłku znikał od Siły 18,5, czyli **w zasięgu zwykłej
postaci**. Przy nowym `D` (45,5 kg) znika dopiero od **Siły 32,7**, a przy Sile
26 — realnym suficie przy poziomie 27 — kara nadal wynosi 15,7 zamiast 15,0.
**Na najcięższym legalnym zestawie kanał wysiłku żyje przez całą grę.**

⚠⚠ **Skąd 32,7, a nie 25,1.** Powyżej `softCapStrength = 20` udźwig rośnie już
tylko o **1,0 kg za punkt** zamiast 2,5 (`EQUIPMENT_LOAD.perStrengthAbove`).
`A`, `B` i `C` zerują się **poniżej** Siły 20, więc sufit ich nie dotyczy;
`D` i `E` zerują się **powyżej** i dotyczy ich w całości. Wzór liniowy dałby dla
`D` 25,1 — i taka liczba stała tu do korekty z tej tury. Poprawnie:
udźwig musi sięgnąć `45,5 / 0,55 = 82,7 kg`, a przy sufcie to `Siła 32,7`
(dla `E`: `100,9 kg`, czyli **Siła 50,9**).

### Regeneracja — 10 s postoju po walce

| build | `regenMul` | odzysk / 10 s | strata wobec A |
|---|---|---|---|
| A | 0,980 | **34,3** | — |
| B | 0,866 | 30,3 | −4,0 |
| C | 0,830 | 29,0 | −5,3 |
| **D** | 0,738 | **25,8** | **−8,5** |
| **E** | 0,687 | 24,1 | **−10,3** |

### Trening na D (45,5 kg, Siła 20)

| rangi | Σ pkt | chód | regen | unik | Szary 132 | wataha 115 |
|---|---|---|---|---|---|---|
| 0 | 0 | 121,3 | 2,21 | 16,4 | ⛔ NIE | ucieka |
| I | 1 | 121,3 | **2,45** | 16,4 | ⛔ NIE | ucieka |
| II | 3 | 121,3 | 2,45 | **15,9** | ⛔ NIE | ucieka |
| **III** | 6 | **128,5** | 2,45 | 15,9 | ⛔ **NADAL NIE** | ucieka |

⚠⚠ **DWIE rzeczy odwróciły się względem starego `D` i obie są wynikiem, nie
poprawką:**

1. ⭐ **Ranga II ZACZĘŁA działać** (16,4 → 15,9). Przy starym `D` kara wysiłku
   przy Sile 20 wynosiła zero, więc ranga nie miała czego zdejmować. To jest
   materiał do `R-1`: hipoteza „ranga II jest pusta" **przestaje obowiązywać na
   najcięższym legalnym zestawie**.
2. ⛔⛔ **Ranga III PRZESTAŁA przekraczać próg Szarego.** Przy starym `D`
   przenosiła chód 127,5 → 133,1, czyli ponad 132. Przy nowym `D` daje
   121,3 → **128,5**, czyli **nadal poniżej**. **Kryterium PASS testu T6 straciło
   przez to swój punkt zaczepienia — patrz blok decyzji przy T6.**

⚠ Na `E` (55,5 kg) ranga III daje 115,1 → **123,8 px/s**, czyli odsuwa od
watahy — ale wataha i bez treningu jest na styk (115,1).

---

## 4. Testy — kryteria PASS / FAIL

⚠ **PASS nie znaczy „model dobry".** Znaczy „kanał robi to, co miał robić".
Osobne pytanie — **czy to czuć** — ma własną kolumnę i własny werdykt.

### T1 · Próg Szarego (chód pieszy)

**Jak:** zaagruj Szarego, **idź** w linii prostej po otwartym terenie, **bez
sprintu**, trzymaj `body.speed` na podglądzie. Notuj, czy dystans rośnie, maleje,
czy stoi. Powtórz na A, C, D.

| | kryterium |
|---|---|
| **PASS** | A ucieka pieszo · D **nie** ucieka pieszo · C daje wynik niejednoznaczny |
| **FAIL** | D ucieka pieszo **albo** A nie ucieka |
| **ODCZUCIE** | czy „nie mogę odejść" czyta się jako ciężar, czy jak zepsuta gra? |

### T2 · Pościg za uciekającym ⭐ najlepszy ciągły dyskryminator

**Jak:** goń królika (`prey.fleeSpeed` 92, przerywany: 420 ms biegu / 820 ms
postoju) i sarnę (`boltSpeed` 170 / 450 ms, postój 900 ms). Mierz **czas od
startu do pierwszego trafienia**. Po 3 próby na A i na D.

**Przewidywane tempo domykania** (królik): A `148−92 = 56 px/s` · D
`121,3−92 = 29,3 px/s` → **stosunek 1,91×** (przy starym `D` było 1,58×).

| | kryterium |
|---|---|
| **PASS** | mediana czasu pościgu na D ≥ **1,3×** mediany na A |
| **FAIL** | różnica < 1,15× albo nieodróżnialna od wariancji |
| **ODCZUCIE** | czy ciężar odbiera **inicjatywę**, czy tylko dokłada sekundy? |

### T3 · Łańcuch trzech walk bez odpoczynku

**Jak:** trzy wilki pod rząd, przerwy **10 s w bezruchu**. Zapisz
`dev.Stamina.current` w sześciu punktach: start i koniec każdej walki. Siła 20.
Na A i na D.

**Przewidywana trajektoria** (Siła 20, 15 s wymiany + 2 uniki na walkę):

| | walka 1 | walka 2 | walka 3 |
|---|---|---|---|
| **A** (12,0) | 120 → 74,7 | 109,0 → 63,7 | 98,1 → 52,8 |
| **D** (45,5) | 120 → 61,1 | 86,9 → 28,1 | **53,9 → 0** |

| | kryterium |
|---|---|
| **PASS** | stamina na starcie **trzeciej** walki jest na D niższa o ≥ **12 pkt** niż na A |
| **FAIL** | różnica < 6 pkt |
| **ODCZUCIE** | czy różnica jest w ogóle zauważalna bez patrzenia na liczby? |

⚠⚠ **Po podniesieniu `D` do 45,5 kg ten test robi się ŁATWY — przewidywana
różnica na starcie trzeciej walki to 44,2 pkt przy progu PASS 12.** ⛔ Progu
**nie ruszam**; zaznaczam tylko, że stracił ostrość i może wymagać Twojej
decyzji razem z wynikiem.

⚙ **Korekta `R-5`.** Do 2026-09-15 stało tu, że jedna walka nie wystarczy (~8,6
pkt przy starym `D`). **Przy 45,5 kg różnica po JEDNEJ walce to już 13,6 pkt**,
czyli powyżej progu PASS. ⚠ Łańcuch zostaje mimo to — bo pokazuje rzecz, której
pojedyncza walka nie pokaże: **`D` schodzi w trzeciej walce do ZERA staminy**,
a `A` kończy ją z 52,8.

### T4 · Sieć sieciarza

**Jak:** daj się trafić siecią na A, na D **i na E**, idź pieszo przez całe
2,6 s spowolnienia.

**Przewidywane:** A `81,4 px/s` (212 px) · D `66,7 px/s` (173 px) ·
**E `63,3 px/s` (165 px)**; sieciarz goni 62.
⚠ **Wszystkie trzy uciekają**, ale **`E` ma margines 1,3 px/s** — to trzeci
punkt na styk w tym protokole. Różnica dystansu A ↔ D przez całe spowolnienie:
**38 px, czyli 1,2 kafla.**

| | kryterium |
|---|---|
| **PASS** | zapisany fakt: sieć **nie jest** bramką dla żadnego buildu |
| **FAIL** | któryś build **nie** ucieka sieciarzowi (62 px/s) — wtedy podłoga prędkości jest za nisko |
| **ODCZUCIE** | czy 67 px/s (D) czyta się jak grywalne spowolnienie, czy jak zawieszenie? |

⚙ **Korekta wobec mojej wcześniejszej oceny:** zapowiadałem T4 jako „najmocniejszy
efekt w grze". **Liczby tego nie potwierdzają** — różnica wynosi jeden kafel.
Zostawiam test wyłącznie jako kontrolę podłogi i odczucia.

### T5 · Kanał wysiłku wg Siły (hipoteza R-1)

**Jak:** build D, cztery przebiegi: Siła 0 → 10 → 20 → 26. Po każdym odczytaj
`15 * dev.Equipment.loadMultiplier` i wykonaj 5 uników, patrząc na pasek.

**Przewidywane na `D` (45,5 kg):** Siła 0 → **38,3** · 10 → **21,2** ·
20 → **16,4** · 26 → **15,7**.

| | kryterium |
|---|---|
| **PASS** | kara rośnie monotonicznie w dół z Siłą i przy Sile 26 **nadal nie jest zerowa** (≈ 15,7); pełne wyzerowanie dopiero przy Sile ≈ **32,7** |
| **FAIL** | kara zeruje się wcześniej niż przy Sile 20 **albo** nie zeruje się wcale |
| **WERDYKT PROJEKTOWY** | czy kanał, który znika dopiero **poza realnym sufitem Siły**, jest dobrze skalibrowany, czy nadal za łatwy do wykupienia? ⚠ Pytanie do autora, nie do pomiaru |

⚙ **`R-1` OSŁABŁA po podniesieniu `D`.** Przy 36,5 kg wysiłek znikał od
**Siły 18,5**, czyli w zasięgu zwykłej postaci — stąd hipoteza „trzeci kanał
jest martwy". Przy 45,5 kg znika dopiero od **32,7** (sufit udźwigu powyżej
Siły 20 — patrz §3), a przy Sile 26 (realny sufit poziomu 27) kara **nadal
wynosi 15,7**. ⇒ **Na najcięższym legalnym zestawie kanał wysiłku żyje przez
całą grę.** To jest wynik, nie poprawka.

> ### 🔶 PUNKT DO DECYZJI AUTORA — kryterium PASS testu T5
>
> Kryterium brzmiało „zeruje się przy Sile ≈ 18,5" i **dało się je zobaczyć
> wprost**: cztery przebiegi 0 → 10 → 20 → 26 obejmowały punkt zerowania.
> Przy `D` = 45,5 kg punkt zerowania (**32,7**) **leży poza zakresem tego
> testu i poza realnym sufitem Siły przy poziomie 27**. Zmierzyć da się
> wyłącznie, że kara przy Sile 26 jest wciąż niezerowa — sama liczba 32,7
> pozostaje **ekstrapolacją z modelu, nie pomiarem**.
>
> ⛔ **Nie zmieniam kryterium sam.** Trzy widoczne wyjścia — (a) zostawić
> w obecnym brzmieniu i przyjąć, że T5 potwierdza tylko monotoniczność
> i niezerowość przy 26; (b) dołożyć piąty przebieg na Sile 33 jako
> **eksperyment diagnostyczny poza contentem** (§2 zabrania liczyć go jako
> `OI-105a`); (c) uznać, że `R-1` jest już rozstrzygnięta rachunkiem i T5
> schodzi do roli kontroli odczucia. **Wybór należy do autora.**

### T6 · Trening I → II → III na D

**Jak:** build D (45,5 kg), Siła 20. Po każdej randze powtórz T1 (próg Szarego).

> ## ⚠ WARIANT C — decyzja autora 2026-09-15
>
> **Oczekiwanym wynikiem tego testu jest to, że ranga III NIE przeprowadza
> przez próg Szarego.** Na `D` = 45,5 kg daje **121,3 → 128,5 px/s**, czyli
> nadal poniżej 132.
>
> ⚠ **To nie jest wada rangi III** — zdejmuje dokładnie tyle samo kary co
> zawsze (25%). Zmieniła się masa, od której kara się liczy. Przy starym `D`
> (36,5 kg) ranga przenosiła 127,5 → 133,1, czyli ponad próg; przy najcięższym
> **legalnym** zestawie już nie.
>
> ⇒ **Zapisujemy to jako fakt o modelu: na najcięższym legalnym wyposażeniu
> żaden trening nie odzyskuje Szarego.** ⛔ Odrzucone warianty: przeniesienie
> testu na `C` (30,5 kg) — badałby wtedy nie ten zestaw, o który chodzi —
> oraz zamiana progu na kryterium liczbowe, która odebrałaby T6 jego jedyną
> wartość, czyli charakter progowy.

| | kryterium |
|---|---|
| **PASS** | ranga III **nie** przenosi przez 132 (oczekiwane **128,5**), ale podnosi chód o **+7,2 px/s**, a ranga I podnosi regenerację 2,21 → **2,45** |
| **FAIL** | ranga III **przeprowadza** przez 132 — wtedy pomiar rozjechał się z modelem, sprawdź najpierw masę zestawu |
| **DODATKOWO** | ⭐ potwierdź, że **ranga II COŚ zmienia** (unik 16,4 → **15,9**). Przy starym `D` nie zmieniała nic — to jest materiał do `R-1` |
| **ODCZUCIE** | czy 6 punktów rozwoju za `+7,2 px/s` i `+0,24 regen/s`, **bez przekroczenia żadnego progu**, to uczciwa cena? |

⚠ **Na `E` (55,5 kg)** ranga III daje 115,1 → **123,8 px/s**, czyli odsuwa od
watahy — ale wataha i bez treningu jest tam na styk (115,1 wobec 115).

### T7 · Ślepa próba B vs D ⭐⭐ odpowiada na pytanie wprost

**Jak:** **druga osoba** ustawia zestaw B (25,5 kg) albo D (45,5 kg) bez
pokazywania. Grasz 2 minuty normalnie. Zgadujesz który. ⚠ **Wykonaj jako
OSTATNI** — po T1–T6 znasz zestawy i próba przestaje być ślepa.

| | kryterium |
|---|---|
| **PASS** | 4 trafienia na 5 prób |
| **FAIL** | wynik na poziomie losowania (2–3 / 5) |

⚠⚠ **To jest jedyny test odpowiadający wprost na pytanie „czy ciężki wojownik
zachowuje się jak ciężki wojownik".** Jeśli wypadnie FAIL przy wszystkich
pozostałych PASS — **to jest najważniejszy wynik całego `OI-105a`** i znaczy, że
model mówi poprawnie, ale **za cicho** na tym paśmie.

⛔ **Bez drugiej osoby T7 jest niewykonalny.** Nie zastępuj go autosugestią.

---

## 5. Czego NIE testujemy i dlaczego

| rzecz | powód |
|---|---|
| **szansa uniku** (R-6) | 5,15% (`A`) vs **4,48%** (`D`) vs **4,33%** (`E`) — poniżej wariancji PRD. **Wynik liczbowy, nie odczuciowy** |
| **ucieczka sprintem** (R-2) | każdy build zrywa aggro w ~2 s i ma zapas 82–126 kafli. Nie różnicuje — **zapisane jako wynik, nie testowane** |
| **przewaga ofensywna ciężaru** (R-4) | nie istnieje: obrażenia zależą od BRONI, a broń jest niezależna od pancerza. Pancerz daje eHP |
| **pasmo 47–75,5 kg** | `OI-105b`, po `OI-98` |

---

## 6. Hipotezy do rozstrzygnięcia — nie do potwierdzenia

| # | hipoteza | rozstrzyga |
|---|---|---|
| **R-1** | kanał wysiłku jest martwy od Siły ≈ 19 — ⚙ **osłabiona rachunkiem 2026-09-15**: na `D` = 45,5 kg zeruje się dopiero od Siły **32,7**, czyli poza realnym sufitem | T5 (patrz punkt do decyzji przy T5) |
| **R-2** | sprint unieważnia karę mobilności jako bramkę ucieczki | zapisane, potwierdzone rachunkiem |
| **R-3** | kotwica watahy (115) opisuje zachowanie marginalne — wilki krążą przy 78 | T1 przy okazji watahy |
| **R-5** | regeneracja niemierzalna w jednej walce | T3 |
| **R-6** | premia do uniku poniżej szumu | ⛔ nie testujemy ręką |
| **R-7** | Unik ignoruje masę → relatywnie cenniejszy dla ciężkich | obserwacja podczas T1–T3 |

---

## 7. TABELA DO WYPEŁNIENIA

```
data: ____________   postać: poziom ____   ZRĘ ____   KON ____

T1  Szary, chód pieszy
    A (12,0)  body.speed ______  uciekam: TAK / NIE / niejednoznacznie
    C (30,5)  body.speed ______  uciekam: TAK / NIE / niejednoznacznie
    D (45,5)  body.speed ______  uciekam: TAK / NIE / niejednoznacznie
    E (55,5)  body.speed ______  uciekam: TAK / NIE / niejednoznacznie  <- styk z watahą
    ODCZUCIE: ______________________________________________
    PASS / FAIL

T2  Pościg (czas do pierwszego trafienia, 3 próby)
    królik  A: ___ / ___ / ___ s    D: ___ / ___ / ___ s   iloraz median ____
    sarna   A: ___ / ___ / ___ s    D: ___ / ___ / ___ s   iloraz median ____
    ODCZUCIE: ______________________________________________
    PASS (≥1,30) / FAIL (<1,15)

T3  Łańcuch trzech walk, Siła 20, przerwy 10 s
              walka 1 start/koniec   walka 2   walka 3
    A (12,0)  ____ / ____           ____/____  ____/____
    D (45,5)  ____ / ____           ____/____  ____/____
    różnica na starcie walki 3: ______ pkt
    PASS (≥12) / FAIL (<6)

T4  Sieć  A (12,0): ______ px/s   D (45,5): ______ px/s
          E (55,5): ______ px/s   <- margines 1,3 px/s nad sieciarzem 62
    ktoś nie ucieka? TAK / NIE
    ODCZUCIE: ______________________________________________

T5  Wysiłek na D (45,5 kg), koszt uniku
    STR 0: ____   STR 10: ____   STR 20: ____   STR 26: ____
    (oczekiwane: 38,3 / 21,2 / 16,4 / 15,7)
    kara przy STR 26 jest NIEZEROWA: TAK / NIE     PASS = TAK
    punkt zerowania 32,7 jest EKSTRAPOLACJĄ — poza zakresem testu
    🔶 KRYTERIUM PASS DO DECYZJI AUTORA (wariant a / b / c): ____
    WERDYKT AUTORA: naturalny efekt skali / dziura systemowa

T6  Trening na D (45,5 kg), Siła 20        [WARIANT C obowiązujący]
    ranga 0:  chód ____ (121,3)  regen ____ (2,21)  T1: ____
    ranga I:  chód ____ (121,3)  regen ____ (2,45)  T1: ____
    ranga II: chód ____ (121,3)  unik  ____ (15,9)
    ranga III:chód ____ (128,5)  T1: ____
    czy ranga II zmieniła cokolwiek (unik 16,4 -> 15,9): TAK / NIE
    czy ranga III PRZEPROWADZIŁA przez próg Szarego 132: TAK / NIE
        PASS = NIE (oczekiwane 128,5)   FAIL = TAK
    PASS / FAIL

T7  Ślepa próba B (25,5) vs D (45,5), druga osoba — trafienia: ___ / 5
    PASS (≥4) / FAIL (≤3)

── DWA PYTANIA KOŃCOWE ──────────────────────────────────────
1. Czy ciężki wojownik zachowuje się jak ciężki wojownik,
   czy jak lekko spowolniona wersja tej samej postaci?
   ________________________________________________________
2. Czy lekki build realnie kupuje mobilność za ochronę?
   ________________________________________________________
```

---

## 8. Czego ten protokół nie rozstrzyga

- ⛔ **Kalibracji pasma 47–75,5 kg** — `OI-105b`.
- ⚠ **Czy `speedK = 150` jest dobre** — na paśmie 12–55,5 kg model schodzi do
  **0,767 chodu** (−23,3% wobec postaci bez sprzętu) i **0,687 regeneracji**
  (−31,3%). Pełna krzywa sięga **−32%** (`speedFloor 0,68`) i **−45%**
  (`regenFloor 0,55`), więc gracz widzi dziś **~73% zakresu prędkości
  i ~70% zakresu regeneracji** — więcej niż przed uzupełnieniem dystrybutorów,
  ale **górne 20 kg nadal poza zasięgiem**.
- 🔶 **Kryterium PASS testu T5** — po podniesieniu `D` punkt zerowania kanału
  wysiłku (Siła 32,7) wypadł poza zakres testu. **Czeka na decyzję autora**;
  pełny opis przy T5.
- ⛔ **Czy warstwowanie będzie OP** (`OI-98`).
- ⛔ **Braku dystrybutora dla 11 pancerzy** (`OI-106`) — to zawartość, nie model.
- ⚠ **Nie rozstrzyga też sam z siebie, czy Model D jest dobry.** Rozstrzyga,
  czy **mówi cokolwiek** na paśmie, które gracz dziś może zagrać.

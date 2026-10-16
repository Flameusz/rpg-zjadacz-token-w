---
typ: HISTORIA
domena: [armor, stamina]
tytul: Audyt — matematyka warstwowania pancerza i model obciążenia
stan: zamkniety
otwarte: [OI-98, OI-101, OI-103]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-14
---

# AUDYT — matematyka warstwowania pancerza i model obciążenia (2026-09-14)

> ## ⛔ TRZY RZECZY, KTÓRE TRZEBA WIEDZIEĆ, ZANIM SIĘ STĄD COKOLWIEK WEŹMIE
>
> 1. ⛔ **WARSTWOWANIE NIE JEST ZAIMPLEMENTOWANE.** `layer` jest dziś
>    **metadaną**: jeden slot trzyma jeden przedmiot, a `equippedWeight`,
>    `totalDefense` i `sumBonus` iterują po slotach, nie po warstwach. **Każda
>    liczba w §3, §5 i §6 opisująca „pełny stos" jest PROJEKCJĄ** — policzoną
>    tak, jakby warstwowanie już działało i sumowało punkty oraz masę. Nie jest
>    to pomiar z gry i nie wolno jej cytować jako stanu.
> 2. ⛔ **NIC NIE ZOSTAŁO WYBRANE ANI WDROŻONE.** Model C z §8 jest
>    **rekomendacją Claude'a, NIEZAAKCEPTOWANĄ przez autora**. Podział kar
>    z §7 jest **HIPOTEZĄ autora do oceny**, nie decyzją. Ten audyt niczego nie
>    rozstrzyga — od tego jest `DECYZJA`, której jeszcze nie ma.
> 3. ⛔ **Żadna wartość mechaniczna nie została zmieniona.** `defenseK`, cap
>    redukcji, progi obciążenia, mnożniki, wagi, obrona i wymagania Siły
>    przedmiotów, koszty uniku i sprintu — wszystkie stoją tak, jak stały.
>
> **Po co ten plik.** Zapis pełnego audytu z 2026-09-14, żeby następna sesja nie
> musiała go powtarzać: co kod robi dziś, co zrobi po wdrożeniu warstw, gdzie
> matematyka się psuje i jakie trzy modele naprawy policzono.
>
> ⛔ **To jest `HISTORIA`.** Stan pancerza: `docs/systemy/armor.md`. Stan
> obciążenia i staminy: `docs/systemy/stamina.md`. Taksonomia warstw i decyzje
> D1–D4: `docs/decyzje/2026-09-12-taksonomia-pancerza.md`.
>
> ⛔ **Ten audyt NIE otwiera D1–D4.** D3 (obciążenie) było przez tę decyzję
> **świadomie odłożone** z zapisem, że progi `0,55 / 0,90` nie są finalnym
> balansem. Audyt działa dokładnie w tej szczelinie — nie wbrew niej.

---

## 1. Metoda

| co | jak sprawdzone |
|---|---|
| stałe balansowe | odczytane wprost z `src/config/GameConfig.ts` |
| roster i rozkład warstw | `docs/ekwipunek_przedmioty.md` (`GENEROWANE`), blok `AUTO:stos` |
| liczba przedmiotów na obszar | `grep` po `slot:` w `GameConfig.ts` — 25 sztuk w czterech obszarach warstwowanych, 5 na rękawicach |
| arytmetyka modeli | jednorazowy skrypt w katalogu roboczym sesji, **poza repo**; stałe przepisane z konfigu, zero importu z `src/` |

⚠ **Skrypt liczący modele został skasowany po audycie i to jest celowe.** Nie
liczy niczego, co gra liczy naprawdę — jest kalkulatorem hipotez, a narzędzie
w `tools/` musi pilnować prawdziwego kodu (reguła z `tools/CLAUDE.md`).
Zostawienie go tam dałoby przymiar, który zawsze świeci na zielono, bo sprawdza
sam siebie. **Wszystkie jego wyniki są przepisane niżej** — audyt jest
odtwarzalny z tego dokumentu.

---

## 2. FAKT — co kod robi dziś

Wszystko w tej sekcji jest w kodzie i sprawdzalne.

### 2.1 Ochrona

```
reduction = min( pkt / (pkt + defenseK) , maxDefenseReduction )
defenseK = 50        maxDefenseReduction = 0,75
```

Punkty przechodzą przez `ARMOR_PROFILE` (mnożnik na PUNKTY, nie na obrażenia):

| materiał | cięte | kłute | obuchowe |
|---|---|---|---|
| skóra | 1,00 | 0,45 | 0,80 |
| przeszywanica | 1,20 | 0,35 | 1,10 |
| kolczuga | 1,80 | 0,70 | 0,35 |
| stal | 1,40 | 1,15 | 0,50 |

### 2.2 Obciążenie

```
udźwig      = base 20 + Siła × 2,5
ratio       = masa / udźwig
klasa       = ratio > 0,90 → ciężki ; > 0,55 → średni ; wpp. lekki
mnożnik     = lekki 1,00 · średni 1,25 · ciężki 1,50
```

Mnożnik dotyka **dokładnie dwóch rzeczy**: kosztu uniku (15 staminy) i kosztu
sprintu (10 staminy/s). Klasa `lekki` dodatkowo dostaje `lightLoadBonus = 1,3`
na **szansę** uniku.

⚠ **Kanałów jest dwa, nie jeden.** Mnożnik kosztu działa na wszystkie klasy;
premia do szansy działa tylko na lekką. W kodzie przy `DEFENSE.dodge.lightLoadBonus`
stoi komentarz, że medium/heavy **świadomie NIE dostają drugiej kary**, bo już
płacą mnożnikiem kosztu. To jest istniejąca decyzja projektu i §7 pytanie 3
odnosi się wprost do niej.

### 2.3 Unik

```
szansa = min( 0,5 ; (0,04 + Zręczność × 0,004) × (lekki ? 1,3 : 1,0) )
```

Przy Zręczności 10: **10,4%** w klasie lekkiej, **8,0%** w średniej i ciężkiej.

### 2.4 Czego obciążenie NIE dotyka dziś

Prędkości ruchu · prędkości ataku · parowania · bloku · redukcji obrażeń ·
regeneracji staminy · zasięgu · celności.

---

## 3. PROJEKCJA — co się stanie po wdrożeniu warstw

⛔ **Od tego miejsca liczby są projekcjami.** Zakładają model, którego nie ma:
cztery obszary × trzy warstwy, punkty i masa sumują się addytywnie.

### 3.1 Przestrzeń kombinacji

Rozkład rosteru po obszarach i warstwach (stan katalogu 2026-09-12):

| obszar | L1 | L2 | L3 | kombinacji w obszarze |
|---|---|---|---|---|
| Głowa | 1 | 2 | 2 | 2 × 3 × 3 = **18** |
| Klata | 2 | 4 | 3 | 3 × 5 × 4 = **60** |
| Nogi | 1 | 3 | 2 | 2 × 4 × 3 = **24** |
| Buty | 1 | 2 | 2 | 2 × 3 × 3 = **18** |

```
DZIŚ   (jeden przedmiot na obszar)   6 × 10 × 7 × 6  =      2 520
PO WARSTWACH                        18 × 60 × 24 × 18 =    466 560     ×185
```

⭐ **To jest główny argument ZA warstwowaniem i nie jest liczbą o balansie.**
Te same 25 sztuk pancerza dają 185 razy większą przestrzeń decyzji. Nie trzeba
do tego ani jednego nowego przedmiotu — dokładnie to, co autor postawił jako
warunek („nie rozdmuchuj contentu").

### 3.2 Trzy realne konfiguracje

Przy Zręczności 10 i Sile 10 (udźwig 45 kg), obciążenie liczone obecnym modelem:

| konfiguracja | masa | pkt | redukcja | klasa | unik | eHP |
|---|---|---|---|---|---|---|
| **tylko L1** (podkład na 4 obszarach) | 5,5 kg | 26 | 34,2% | lekki | 10,4% | **1,70×** |
| **L1 + L2** | 13 kg | 53 | 51,5% | lekki | 10,4% | **2,30×** |
| **L1 + L2 + L3, maksimum** | 61,5 kg | 148 | 74,7% | ciężki | 8,0% | **4,30×** |

`eHP` = mnożnik efektywnych punktów życia: `1/(1−redukcja) × 1/(1−unik)`.

### 3.3 Wartość krańcowa warstwy

| krok | Δ masy | Δ redukcji | Δ eHP |
|---|---|---|---|
| nic → L1 | +5,5 kg | +34,2 pkt% | +0,70 |
| L1 → +L2 | +7,5 kg | +17,3 pkt% | +0,60 |
| +L2 → +L3 | +48,5 kg | +23,2 pkt% | **+2,00** |

⚠⚠ **Krzywa nie wygasa — ona przyspiesza.** Krańcowa wartość trzeciej warstwy
jest **większa** niż pierwszej, mimo że krzywa `pkt/(pkt+50)` sama w sobie ma
malejące przyrosty. Powód jest arytmetyczny: `eHP` rośnie jak `1/(1−r)`, więc
te same „+23 punkty procentowe" znaczą tym więcej, im bliżej jesteśmy sufitu.
Cap `0,75` jest wtedy nie hamulcem, tylko **asymptotą, do której opłaca się
biec**.

---

## 4. ZNALEZISKO A — nasycenie powyżej `heavyAbove`

⚠⚠ **To jest najważniejsze znalezisko tego audytu.**

Powyżej `ratio = 0,90` nie ma już żadnego progu. Funkcja kary ma sufit, a masa
go nie ma.

| model | 45 kg (ratio 1,00) | 120 kg (ratio 2,67) | rozróżnia? |
|---|---|---|---|
| **obecny** | 1,50 | 1,50 | ⛔ **NIE** |

**Przy Sile 10 czterdzieści pięć kilogramów i sto dwadzieścia kilogramów
kosztują dokładnie tyle samo: 22,5 staminy za unik.**

**KONSEKWENCJA.** Ochrona rośnie monotonicznie z każdym dołożonym kilogramem;
koszt przestaje rosnąć przy pierwszym. Od momentu przekroczenia `0,90`
dokładanie pancerza jest **ściśle dominujące** — nie ma żadnej liczby, która by
za to zapłaciła.

**OCENA.** To nie jest kwestia strojenia progu. Funkcja kary z sufitem nie
potrafi wycenić budowy postaci, która sufit przekracza — a warstwowanie jest
dokładnie mechaniką, która go przekracza. Zapisane jako **OI-101**.

---

## 5. ZNALEZISKO B — kara płacona w walucie, której beneficjent nie wydaje

Drugi, niezależny problem. Nawet gdyby kara rosła bez sufitu, **trafia w zły
kanał**.

| kanał | kto go faktycznie wydaje |
|---|---|
| koszt uniku | **wyłącznie build lekki** — ciężki ma 74,7% redukcji i przyjmuje ciosy zamiast unikać |
| koszt sprintu | wszyscy, ale głównie poza walką |
| prędkość ataku | **wszyscy, w każdej walce, zawsze** — dziś NIE jest kanałem obciążenia |
| prędkość ruchu | wszyscy, cały czas — dziś NIE jest kanałem obciążenia |

**KONSEKWENCJA.** Cała kara za masę siedzi w pierwszym wierszu, czyli obciąża
dokładnie tego, kto pancerza nie nosi. Pogłębia to trzecia własność kodu:
**`Stamina.spend()` nigdy nie odmawia akcji**. Koszt nie jest bramką, tylko
opóźnieniem regeneracji — a build, który nie unika, nie odczuwa nawet tego.

**OCENA.** To jest wada strukturalna, nie kalibracyjna. Żadna zmiana liczby
`1,50` jej nie usuwa, bo problemem jest to, **w czym** kara jest wyrażona.

---

## 6. Wpływ na wielowarstwowość — czy to jest OP

**FAKT.** Łącząc §3, §4 i §5: od Siły 3 wzwyż maksymalne warstwowanie jest
optymalne przy każdym profilu obrażeń i każdej Zręczności.

- protekcja rośnie monotonicznie,
- koszt zatrzymuje się na `1,50`,
- jedyna realna strata to unik `10,4% → 8,0%` (2,4 punktu procentowego),
- ta strata jest z nadwyżką pokryta przez skok redukcji `51,5% → 74,7%`.

**Przewaga maksymalnego stosu nad konfiguracją lekką: 4,30 / 1,70 = ×2,53
w efektywnych punktach życia, przy karze, która nie dotyka ani obrażeń, ani
tempa.**

**OCENA.** Tak — przy dzisiejszym modelu obciążenia wielowarstwowość byłaby OP,
i to nie „trochę". ⚠ **Ale to jest ocena modelu OBCIĄŻENIA, nie warstwowania.**
Warstwy nie są zepsute; one **ujawniają** wadę, która w rosterze jednosztukowym
nigdy nie miała okazji zaświecić, bo nikt nie przekraczał `ratio 0,90`.

---

## 7. HIPOTEZA autora — rozdział kanałów kary

⛔ **To jest HIPOTEZA postawiona przez autora do oceny, nie decyzja.**

> Load **powinien** wpływać na: **unik, prędkość ruchu, prędkość ataku**.
> Load **nie powinien** wpływać na: **parowanie, blok, redukcję**.

⚠ **Ustalenie zakresu.** Sformułowanie „redukcję uniku" odczytane jako:
obciążenie nie rusza redukcji obrażeń. Pytanie o koszt uniku jest osobne
i odpowiada na nie punkt 3.

### 7.1 Ocena ogólna — hipoteza naprawia jedną z dwóch wad

| wada | czy hipoteza ją naprawia |
|---|---|
| **KANAŁ** (§5) — kara w walucie, której tank nie wydaje | ✅ **tak** |
| **KSZTAŁT** (§4) — kara ma sufit, masa nie | ❌ **nie** |

⚠ **Można dodać karę do ruchu i ataku i nadal mieć 45 kg = 120 kg.** To są
ortogonalne problemy i hipoteza dotyka tylko pierwszego.

### 7.2 Odpowiedzi na siedem pytań

**1. Czy ten podział tworzy sensowne archetypy?** ✅ **Tak — to najmocniejsza
część hipotezy.** Powód jest strukturalny: prędkość ataku jest **jedyną walutą,
której ciężkozbrojny nie może nie wydać**. Archetypy wychodzą czytelne: lekki
unika i bije szybko · średni to kompromis · ciężki przyjmuje ciosy i bije wolno.
⚠ **Wyłączenie parowania i bloku jest poprawne**: to umiejętność użycia
tarczy/broni, nie ruchliwość ciała. Gdyby obciążenie je tłumiło, ciężki build
straciłby swoją jedyną aktywną obronę i zostałby workiem HP bez decyzji.

**2. Czy kara do ruchu i ataku rozwiązuje problem, że ciężkozbrojny nie czuje
kary do uniku?** ⚠ **Połowicznie.** Na mierze złożonej `eHP × DPS` przewaga
maksymalnego stosu spada z **×2,53** do **×2,06**. Zmniejszona, nie zniesiona —
i zniesiona być nie powinna, bo ciężki pancerz ma być lepszy w przeżywaniu.
Dopóki kara nie rośnie powyżej `0,90`, build nadal nie płaci **więcej za
więcej**.

**3. Czy ciężki pancerz ma nadal mieć karę do kosztu uniku i sprintu?**
**Koszt UNIKU — nie. Koszt SPRINTU — tak.** Obniżanie szansy uniku **i**
podnoszenie jego kosztu to dwie kary za tę samą akcję. ⚠ **Projekt podjął już
tę decyzję w drugą stronę** — komentarz przy `lightLoadBonus` mówi wprost, że
medium/heavy nie dostają drugiej kary, bo płacą mnożnikiem kosztu. Odwrócenie
tego bez zniesienia tamtego daje dokładnie to, co raz odrzucono. Szansa jest
lepszym lewarem niż koszt: jest widoczna natychmiast, a `spend()` i tak nigdy
nie odmawia. Sprint zostaje, bo nie dubluje — to podatek od przemieszczania
się, nie od obrony.

**4. Więcej klas, czy kara rosnąca wewnątrz klasy?** ⭐ **Kara rosnąca wewnątrz
klasy; trzy etykiety zostają.** Pięć klas nie rozwiązuje problemu, tylko go
**odsuwa** — nasyca się przy `1,80` zamiast `0,90`. ⭐ **Rozstrzygający argument
jest w tym projekcie już zbudowany: `STAMINA.states` to trzy nazwane stany nad
ciągłą wartością 0–120.** Etykieta komunikuje, liczba działa. Hybryda
obciążenia jest konsekwencją przyjętego wzorca, nie nowym pomysłem.

**5. Czy Siła ma w pełni kompensować?** **Nie.** Dziś kompensuje prawie
całkowicie, bo model jest **czysto ilorazowy** — Siła zawsze przegoni masę:

| STR | udźwig | ratio (61,5 kg) | obecny mnożnik |
|---|---|---|---|
| 0 | 20,0 | 3,08 | ciężki 1,50 |
| 10 | 45,0 | 1,37 | ciężki 1,50 |
| **20** | 70,0 | **0,88** | **średni 1,25** |
| 30 | 95,0 | 0,65 | średni 1,25 |

Jeśli Siła znosi karę do zera, „ciężki pancerz" przestaje być wyborem i staje
się nagrodą za jeden atrybut. Lewar: **człon bezwzględny obok ilorazowego** —
kara od `masa/udźwig` **plus** mała kara od samych kilogramów, której Siła nie
rusza. Wtedy zostaje podłoga.

**6. Czy Siła ma pozwalać nosić, czy zmniejszać skutki?** ⚠ **Dziś robi obie
rzeczy i płaci za to podwójnie** — to samo znalezisko, co przy D1: Kirys wymaga
Siły 5, a Siła 5 sama podnosi udźwig o 12,5 kg. Pancerz stawiający bramkę sam
wytwarza udźwig na jej pokrycie. Kierunkowo: `requires.strength` = **dostęp**
(istnieje i działa), `loadCapacity` = **łagodzenie**, ale z ograniczeniem, żeby
nie dochodziło do zera.

**7. Jak rozwiązać nasycenie?** **Funkcja kary musi być nieograniczona z góry.**
Wszystkie trzy modele z §8 to robią, w różnym stopniu.

---

## 8. Trzy modele — policzone, żaden niewybrany

⛔ **Wszystkie trzy są materiałem do decyzji. Żaden nie jest zaimplementowany
ani zaakceptowany.**

### MODEL A — pięć klas

Progi `0,55 / 0,90 / 1,30 / 1,80` · mnożniki `1,00 / 1,25 / 1,50 / 1,80 / 2,20`.

| masa | STR 0 | STR 5 | STR 10 | STR 15 | STR 20 |
|---|---|---|---|---|---|
| 20 kg | ciężki 1,50 | średni 1,25 | lekki 1,00 | lekki 1,00 | lekki 1,00 |
| 30 kg | b.ciężki 1,80 | ciężki 1,50 | średni 1,25 | lekki 1,00 | lekki 1,00 |
| 40 kg | przeciąż. 2,20 | ciężki 1,50 | średni 1,25 | średni 1,25 | średni 1,25 |
| 50 kg | przeciąż. 2,20 | b.ciężki 1,80 | ciężki 1,50 | średni 1,25 | średni 1,25 |
| 60 kg | przeciąż. 2,20 | przeciąż. 2,20 | b.ciężki 1,80 | ciężki 1,50 | średni 1,25 |
| 80 kg | przeciąż. 2,20 | przeciąż. 2,20 | b.ciężki 1,80 | b.ciężki 1,80 | ciężki 1,50 |

➕ minimalna zmiana, zachowuje istniejący wzorzec
➖ **nadal się nasyca** (tylko wyżej) · pięć etykiet na HUD · przeskoki czytają
się jako „schodki"

### MODEL B — płynny liniowy

`mnożnik = 1 + 0,75 × max(0 ; ratio − 0,55)`, bez sufitu; etykieta z tych samych
progów co dziś.

| masa | STR 0 | STR 5 | STR 10 | STR 15 | STR 20 |
|---|---|---|---|---|---|
| 20 kg | 1,34 | 1,05 | 1,00 | 1,00 | 1,00 |
| 30 kg | 1,71 | 1,28 | 1,09 | 1,00 | 1,00 |
| 40 kg | 2,09 | 1,51 | 1,25 | 1,11 | 1,02 |
| 50 kg | 2,46 | 1,74 | 1,42 | 1,24 | 1,12 |
| 60 kg | 2,84 | 1,97 | 1,59 | 1,37 | 1,23 |
| 80 kg | 3,59 | 2,43 | 1,92 | 1,63 | 1,44 |

➕ nasycenie znika · jeden parametr · brak schodków
➖ **jeden mnożnik na wszystkie kanały — NIE realizuje podziału z §7** · brak
podłogi, więc przy skrajnych masach kara może zabić grywalność

### MODEL C — hybryda (realizuje hipotezę wprost)

Trzy **etykiety** dla HUD · kara **ciągła** · **osobny kształt na kanał** ·
koszt uniku **zniesiony**.

```
nad   = max(0 ; ratio − 0,55)
dodge = 1 / (1 + 1,2 × nad)          ← bez podłogi, tu ma boleć
ruch  = max(0,75 ; 1 − 0,18 × nad)   ← z podłogą
atak  = max(0,75 ; 1 − 0,18 × nad)   ← z podłogą

sprint: koszt zostaje · unik: koszt ZNIESIONY
parowanie, blok, redukcja: NIETKNIĘTE
```

| masa | STR | ratio | etykieta | dodge | ruch | atak |
|---|---|---|---|---|---|---|
| 20 kg | 10 | 0,44 | lekki | ×1,00 | ×1,00 | ×1,00 |
| 30 kg | 10 | 0,67 | średni | ×0,88 | ×0,98 | ×0,98 |
| 40 kg | 10 | 0,89 | średni | ×0,71 | ×0,94 | ×0,94 |
| 50 kg | 10 | 1,11 | ciężki | ×0,60 | ×0,90 | ×0,90 |
| 60 kg | 10 | 1,33 | ciężki | ×0,52 | ×0,86 | ×0,86 |
| 80 kg | 10 | 1,78 | ciężki | ×0,40 | ×0,78 | ×0,78 |
| 60 kg | 20 | 0,86 | średni | ×0,73 | ×0,94 | ×0,94 |
| 80 kg | 0 | 4,00 | ciężki | ×0,19 | ×0,75 | ×0,75 |

**Co to robi z walką** (miecz, cykl 0,50 s, DPS bazowy 25,8):

| build | cykl | DPS | dodge |
|---|---|---|---|
| lekki 13 kg | 0,500 s | 25,8 | ×1,00 |
| ciężki 45 kg | 0,544 s | 23,7 | ×0,65 |
| maks 61,5 kg @ STR 10 | 0,586 s | 22,0 | ×0,51 |
| maks 61,5 kg @ STR 20 | 0,531 s | 24,3 | ×0,72 |

**Co to robi z przewagą stosu:**

| konfiguracja | eHP | atak | eHP × DPS |
|---|---|---|---|
| lekka L1 | 1,70× | ×1,00 | **1,70** |
| L1 + L2 | 2,30× | ×1,00 | **2,30** |
| maks L1+L2+L3 | 4,12× | ×0,85 | **3,51** |

Przewaga maksymalnego stosu: **×2,53 → ×2,06**.

➕ realizuje podział z §7 dokładnie · nasycenie znika · zero podwójnych kar ·
podłoga chroni grywalność · zgodny z istniejącym wzorcem `STAMINA.states`
➖ trzy współczynniki zamiast jednego · wymaga dodania **kanału prędkości ruchu,
którego dziś nie ma**

### Rozstrzygnięcie nasycenia we wszystkich trzech

| model | 45 kg (r = 1,00) | 120 kg (r = 2,67) | rozróżnia? |
|---|---|---|---|
| obecny | 1,50 | 1,50 | ⛔ **NIE** |
| A — 5 klas | 1,50 | 2,20 | tak (×1,47), ale nasyca się dalej |
| B — płynny | 1,34 | 2,59 | ✅ tak (×1,93) |
| C — hybryda | dodge ×0,65 | dodge ×0,28 | ✅ tak (×2,30) |

---

## 9. REKOMENDACJA — Model C

> ⛔ **NIEZAAKCEPTOWANA · NIEWDROŻONA · to jest rekomendacja Claude'a, nie
> decyzja autora.** Wybór należy do autora i nie został dokonany. Dopóki nie ma
> pliku w `docs/decyzje/`, obowiązuje model z §2.2 bez zmian.

Cztery powody, w kolejności wagi:

1. **Jest jedynym, który realizuje hipotezę z §7.** A i B mają jeden mnożnik na
   wszystko — nie da się nimi powiedzieć „unik mocno, atak lekko".
2. ⭐ **Projekt ma ten wzorzec zbudowany.** `STAMINA.states` to trzy nazwane
   stany nad ciągłą wartością. Hybryda jest konsekwencją istniejącej
   architektury, nie nowym pomysłem.
3. **Usuwa podwójną karę zamiast ją dokładać** — zgodnie z decyzją, którą
   projekt już podjął przy `lightLoadBonus`.
4. **Podłoga na ruchu i ataku chroni przed buildem niegrywalnym.** Kara ma
   boleć, nie wyłączać.

### 9.1 Dwie rzeczy nierozstrzygnięte wewnątrz rekomendacji

⚠ **Kanał prędkości ataku ma istniejący wzorzec i musi go użyć.**
`attackCooldown` dzieli się już przez `Stamina.attackSpeedMultiplier` — mnożnik
obciążenia wchodzi tą samą drogą. ⚠ **Musi ruszać `swingDurationMs` razem
z cooldownem**, inaczej poza ataku się rwie. Skutek uboczny jest korzystny:
koszt staminy zamachu liczy się z `swingDurationMs`, więc wolniejszy zamach
kosztuje więcej za sztukę, ale zamachów jest mniej — **stamina/s zostaje bez
zmian**, tak jak dziś przy Zręczności.

⚠ **Kanał prędkości ruchu nie istnieje i jest najmocniejszym z trzech.**
−25% prędkości czuć w każdej sekundzie gry, także poza walką. To jednocześnie
największa zaleta (archetyp staje się namacalny) i największe ryzyko (podatek od
przemieszczania się między walkami). Wejść ostrożniej niż z atakiem.

---

## 10. Errata do własnej pracy

⚠ **Uzasadnienie D2 w `docs/decyzje/2026-09-12-taksonomia-pancerza.md` jest
policzone na stosie, którego NIE DA SIĘ ZAŁOŻYĆ.** Zdanie „pełny stos daje
142 pkt → 74%" zakłada sumowanie warstw, którego kod nie ma — dziś jeden slot
trzyma jeden przedmiot, więc realne maksimum wynosi **62,4%**, nie 74%.

⛔ **Decyzja NIE została poprawiona i to jest zgodne z kontraktem** —
`DECYZJA` jest niezmienna po zamknięciu (`DOC_CONTRACT.md` §2.3). Rozstrzygnięcie
D2 (`defenseK = 50`, cap `0,75`, bez zmian) **stoi i pozostaje w mocy**; błędne
jest wyłącznie jego uzasadnienie liczbowe. Errata żyje tutaj, a poprawka
wejdzie do nowej decyzji, gdy warstwowanie będzie wdrażane.

⚠ **Drugi rozjazd:** `src/core/CLAUDE.md` niesie niezmiennik „obciążenie dotyka
dokładnie dwóch rzeczy". Jest **prawdziwy dziś** (§2.2), ale przestanie być
prawdziwy przy pierwszym wdrożeniu któregokolwiek modelu z §8 — to miejsce do
załatania razem z decyzją, nie wcześniej.

---

## 11. Czego ten audyt NIE rozstrzyga

- **Który model wygrywa.** §9 jest rekomendacją; decyzji nie ma.
- **Czy warstwowanie w ogóle wchodzi** (OI-98). Audyt mówi, co się stanie, jeśli
  wejdzie przy dzisiejszym obciążeniu — nie, że ma wejść.
- **Żadnej liczby balansowej.** Progi, mnożniki, `defenseK`, cap, wagi, obrona
  i wymagania Siły przedmiotów zostają tam, gdzie były.
- **Odczucia.** Czy −25% prędkości ruchu czyta się jako ciężar, czy jako
  zacięcie gry, rozstrzyga ręka na gałce, nie ten dokument.
- **D1–D4.** Zamknięte, moc `ACTIVE`, nieruszane.

---

## 12. Otwarte

| id | rzecz |
|---|---|
| **OI-98** | warstwowanie jako MECHANIKA — dziś `layer` jest metadaną |
| **OI-101** | nasycenie powyżej `ratio 0,90` (§4) — adres pełnego opisu przeniesiony do tego pliku |
| **OI-103** | **który model obciążenia przyjmujemy** (§7–§9): obecny · A · B · C · inny. Blokuje wdrożenie OI-98 |
| OI-17 | „obciążenie dotyka dwóch rzeczy czy trzech" — pytanie starsze od tego audytu i **zawarte w OI-103**; rozstrzygnięcie modelu rozstrzyga i je |
| OI-102 | trzy pętle po slotach zakładają jeden przedmiot na slot — techniczna bramka OI-98 |

---
typ: HISTORIA
domena: creatures
tytul: Pająk jadowity — trzy koncepcje
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-13
---

# Pająk jadowity — trzy koncepcje do wyboru

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/creatures.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


Odpowiedź na Zadanie B z `docs/pajaki_ocena.md`, w trybie „design battle": **trzy
różne stwory, nie trzy warianty jednego**. Nic z tego nie jest zaimplementowane
— to materiał do wyboru.

Wspólna zgoda z recenzentem: nowy pająk ma **zwarcie, mało HP, żadnej szarży,
odskoku, watahy, prędkości wilka, slowa ani pancerza**, a jego bronią jest jad.
Różnią się tym, **czym jad w ogóle jest**, bo to jedyna decyzja, która realnie
zmienia rozgrywkę — reszta to liczby.

---

## 0. Ustalenia techniczne wspólne dla wszystkich trzech

Zmierzone w kodzie zanim cokolwiek zaprojektowałem. Każda z nich zabija jakiś
oczywisty pomysł, więc idą przed koncepcjami.

**T-1. Zwykły DoT NIE MOŻE iść przez `Player.takeDamage`.** Ta metoda przy
każdym wywołaniu: gra dźwięk `hurt`, robi flash na sprite, **trzęsie kamerą
(90 ms)**, kasuje posiłek i restartuje blokadę regeneracji. Tick co sekundę
przez 6 sekund = sześć wstrząsów kamery i sześć „auć" — to czyta się jak awaria,
nie jak trucizna. Jad potrzebuje **cichej ścieżki obrażeń** (osobna metoda,
która rusza HP + zdarzenie paska, bez SFX i kamery). To jest ~15 linijek, ale
musi być napisane świadomie.

**T-2. Małe ticki przez pancerz zaokrąglają się do zera.** `takeDamage` liczy
`Math.round(amount × (1 − redukcja))`. Pełna stal przeciw `pierce` to ~19,5%
redukcji, ale przy tickach rzędu 1–2 obrażeń zaokrąglenie zjada różnicę albo
całość. Wniosek: **albo jad jest nieotypowany i nietłumiony przez pancerz**
(uzasadnienie: to nie cios, tylko toksyna — pancerz nie chroni przed czymś, co
już jest w środku), **albo ticki muszą być na tyle duże, żeby zaokrąglenie
nie decydowało**. Rekomendacja: nieotypowany i nietłumiony, i napisać to
w komentarzu, bo inaczej ktoś to za pół roku „naprawi".

**T-3. Nie ma generycznego systemu stanów.** Spowolnienie z sieci to **jedno
pole `slow` na `Player`** plus wpis w snapshotcie `Buffs` dla paska. Jad będzie
drugim takim polem. To jest moment, w którym warto to raz uogólnić (dwa to już
wzorzec), ale to osobna decyzja i osobny koszt — nie chowam jej w liczbach.

**T-4. Pasek buffów jest JEDYNYM kanałem informacji.** Gracz **nie widzi liczb
obrażeń, które dostaje** (zaparkowane, `docs/odlozone.md`) — ma tylko pasek HP,
flash i winietę. Za to `Buffs` już obsługuje debuffy: czerwona ramka zamiast
złotej, odliczanie sekund i **linijka `detail`** po tapnięciu ikony (tak działa
„Pajęczyna — Ruch −45%, unik działa normalnie"). Każda koncepcja niżej musi się
w tym zmieścić, bo innego kanału nie ma.

**T-5. Telegraf musi być dłuższy niż ukorzenienie po zamachu.** Zamach ukorzenia
gracza na ~180–260 ms i **nie da się go zacząć w ruchu**. Żeby „przerwij atak
i odejdź" było naprawdę dostępne, tell musi mieć **co najmniej ~400 ms** — dla
porównania: dzik 560 ms, Szary 260 ms, sieciarz 420 ms. Krótszy tell to nie
zagrożenie, tylko podatek bez sygnału (dokładnie ten zarzut jest już otwarty
wobec wypadu watahy).

**T-6. ⚠ Odejście od walki jest dziś DARMOWYM RESETEM — i to podważa całą
premisę „walczę dalej czy odchodzę".** HP przeciwnika nigdy się nie regeneruje
i nie wraca do pełna przy zerwaniu pościgu (sprawdzone: `hp` ustawiane tylko
w konstruktorze i przy trafieniu). Gracz może więc: zbić pająka do 20%, odejść,
odczekać jad i regenerację, wrócić i dobić go jednym ciosem. **Bez korekty
„odejdź" nie jest decyzją, tylko optymalną grą.** Trzy wyjścia, wszystkie są
decyzją autora, nie implementacji:
  - (a) ten stwór **leczy się przy zerwaniu pościgu** (`onLoseAggro` → `hp = maxHp`);
    byłby pierwszy w bestiariuszu, więc to precedens na całą resztę;
  - (b) koszt odejścia jest **czasowy** i to wystarcza (jad + blokada regeneracji
    = kilkanaście sekund stania w lesie);
  - (c) świadomie zostawiamy reset i przyjmujemy, że decyzja jest o tempie, nie
    o przetrwaniu.
  Koncepcja **B** niżej jest jedyną, która nie potrzebuje tego rozstrzygać.

---

## Koncepcja A — **Skoczek jadowity** (jad kumulujący)

> **Pytanie do gracza:** „Ile jeszcze ukąszeń zniesiesz, zanim opłaci ci się
> przerwać własny atak?"

Najbliższa szkicowi recenzenta. Jad **narasta z każdym trafieniem**, więc
kontynuowanie autoataku jest wprost stawką: trzeci stos boli trzy razy mocniej
niż pierwszy, a licznik widać na pasku.

### Zachowanie

Mały, lekki pająk, który **nie goni szybciej niż wilk** i nie ma czym uderzyć
z zaskoczenia. Podchodzi, zatrzymuje się w zasięgu ukąszenia, **podnosi
przednią parę odnóży (tint, 480 ms)** i kąsa. Po ukąszeniu cofa się o pół
kroku i czeka na własny cooldown — nie odskakuje jak Szary, po prostu nie
przykleja się do gracza.

### Maszyna stanów

```
approach ──(dist ≤ biteRange)──> windup ──(480 ms)──> bite ──> recover ──(cooldown)──> approach
   ▲                                │                                          │
   └────────────(gracz odszedł)─────┘                                          │
                                    └──(trafienie obuchem: interrupt)──> recover
```

- `canDeaggro()` → `false` w `windup` (telegraf to obietnica, ta sama reguła co
  u sieciarza i dzika).
- `interrupt()` → kasuje `windup`, ustawia `recover` i **odpala pełny cooldown**
  — czyli młot realnie kupuje uniknięty stos jadu.
- Ukąszenie ma **własny test zasięgu w chwili trafienia** (`biteReach` > `biteRange`,
  wzorzec Szarego), więc odejście w trakcie tellu naprawdę pudłuje.

### Config

```ts
export const VENOM_SPIDER = {
  hp: 34,                       // niżej niż sieciarz (42) i wilk (55): ma ginąć szybko
  xpReward: 40,
  // ⚠ Dotyk celowo prawie zerowy. U dzika kontakt to 54% surowego outputu i
  // dlatego musiał dostać typ na obu kanałach; tutaj odwrotnie — cała stawka
  // ma siedzieć w ukąszeniu, żeby decyzja gracza dotyczyła tellu, a nie
  // przypadkowego ocierania się o hitbox.
  touchDamageMin: 2,
  touchDamageMax: 3,
  touchDamageCooldown: 1.4,
  touchDamageType: null,
  patrolSpeed: 34,
  chaseSpeed: 96,               // wolniej niż wilk (115): nie jest szybkim wilkiem
  aggroRange: 150,
  deAggroRange: 300,
  patrolRadius: 48,
  respawnDelay: 15, respawnJitter: 6, respawnSafeRadius: 110,
  scale: 1.5, bodyWidth: 16, bodyHeight: 11,
  bite: {
    biteRange: 58,              // musi podejść bliżej, niż sięga miecz (68)
    windupMs: 480,              // > ukorzenienia po zamachu (T-5)
    windupTint: 0xa8d84f,
    biteReach: 70,              // test w chwili trafienia — odejście pudłuje
    damageMin: 5, damageMax: 8,
    damageType: "pierce",       // kły to przebicie; skóra 0,45 → stal ma sens
    cooldownMs: 1800,
    recoverMs: 320,             // okno na darmowy cios po ukąszeniu
  },
  venom: {
    id: "venom",
    name: "Jad",
    damagePerStack: 2,          // NIEotypowany i NIEtłumiony pancerzem (T-2)
    tickMs: 1500,
    durationMs: 6000,           // odświeżany, nie sumowany, przy każdym ukąszeniu
    maxStacks: 3,
  },
} as const;
```

**Liczby wynikowe:** pełne 3 stosy = 6 obr. co 1,5 s przez 6 s = **24 HP**, plus
same ukąszenia 3 × ~6,5 = ~20 HP. Pełne zaangażowanie kosztuje więc ~44 HP przy
100 HP bazowych — dużo, i o to chodzi. Zabicie: 34 HP ≈ 1,5 s kontaktu mieczem,
czyli **jedno–dwa ukąszenia, jeśli gracz nie marudzi**.

### Rozstawienie

Trzy sztuki, tą samą logiką co sieciarz („jeden uczy, para pokazuje po co"):
- **jeden samotny** na skraju wschodniej gęstwiny, w zasięgu wzroku z drogi —
  uczy tellu i tego, co robi jad, bez niczyjej pomocy;
- **dwa razem** (~90–120 px od siebie) głębiej — dwa telle na przemian to
  pierwszy raz, gdy gracz musi wybrać, którego przerwać;
- ⚠ **nie stawiać ich w zasięgu aggro dzika** — dzik + jad + brak regeneracji
  w walce to trzy rzeczy naraz. Sieciarze już obsługują parę z dzikiem.
- Reguła odległości od watahy i Szarego (296 px) bez zmian.

### Counterplay

**Bez umiejętności (poziom 1–2):** telegraf 480 ms > ukorzenienie 260 ms →
przerwanie autoataku i cofnięcie się o pół sekundy naprawdę pudłuje ukąszenie.
34 HP oznacza, że skupienie się na nim wygrywa: jest to pierwszy przeciwnik,
przy którym „zabij tego, nie tamtego" opłaca się **w zwarciu** (dotąd tylko
z dystansu, przy sieciarzu). Młot przerywa tell.

**Z umiejętnościami:** Unik omija ukąszenie w całości (i-frames), ale **nie
zdejmuje już nałożonego jadu** — świadomie, inaczej Unik zostałby „przyciskiem
kasowania stanów" i to samo trzeba by potem zrobić z siecią. Wir ostrzy nadaje
się do pary skoczków. Okrzyk skraca fazę, w której w ogóle się je zbiera.

### Nagroda

XP **40** — celowo poniżej sieciarza (55), mimo trudniejszej walki, bo pula XP
mapy jest już przestrzelona (310→825, jedno przejście daje lvl 11 zamiast 6).
Nowy stwór nie ma tego pogłębiać.
Loot: `spider_silk` (0,5) + **`venom_gland` / Gruczoł jadowy** (0,35, 1 szt.,
~18 g) — bez wymogu Skórowania, tak samo jak nić. Gruczoł jest naturalnym
składnikiem dla Doroty Zielarki, ale **dopóki nie ma alchemii, to materiał na
sprzedaż i tak trzeba go opisać** — nie obiecywać w opisie zastosowania,
którego nie ma (błąd, którego uniknął Sobek nie obiecując napraw).

### Co to psuje

1. **Wymaga cichej ścieżki obrażeń (T-1) i drugiego pola stanu na `Player`
   (T-3)** — to nie jest „config + podklasa", tylko realne dotknięcie klasy
   gracza, czyli najbardziej newralgicznego pliku w projekcie.
2. **Stosy trzeba pokazać, a jedyny kanał to linijka `detail` po tapnięciu
   ikony** — czyli informacja o tym, ile ktoś ma stosów, jest o jedno
   tapnięcie za daleko w walce, w której nie ma czasu tapać. Ryzyko: gracz czuje,
   że „traci HP bez powodu". To jest ten sam problem, przez który zaparkowany
   jest feedback otrzymywanych obrażeń — tu wraca ze zdwojoną siłą.
3. **T-6:** bez rozstrzygnięcia darmowego resetu decyzja „odchodzę" jest
   optymalna zawsze, a nie czasem.
4. Trzeci stwór z typem `pierce` w bestiariuszu (wilk, Szary, skoczek) —
   skórzana zbroja robi się coraz bardziej jednoznacznie zła.

---

## Koncepcja B — **Kąsacz gnilny** (jad, który nie zadaje obrażeń)

> **Pytanie do gracza:** „Stać cię na następną walkę, skoro po tej się nie
> wyleczysz?"

Jad **nie tyka HP w ogóle**. Zamiast tego **zamyka leczenie**: przez kilkanaście
sekund nie działa regeneracja poza walką ani jedzenie. Zagrożenie nie jest
w tej walce, tylko w tej następnej.

To jest koncepcja, która **wykorzystuje systemy, które już są, zamiast dokładać
nowy**: gra ma trzy piętra leczenia (regeneracja darmowa/wolna/poza walką →
jedzenie tanie/szybkie/poza walką → mikstura droga/natychmiastowa/w walce)
i **nic dziś nie wymusza najwyższego piętra**. Ten pająk je wymusza — i tym
samym po raz pierwszy sprawia, że sklep Doroty ma znaczenie mechaniczne.

### Zachowanie

Powolny, ciężki, przyklejony. Nie odskakuje i nie ucieka: kąsa co ~2 s
z krótkim, ale czytelnym tellem. Jest **trwalszy** niż skoczek — ma dać graczowi
czas na zauważenie, że pasek HP przestał wracać.

### Maszyna stanów

Ta sama co w A (`approach / windup / bite / recover`), z dwoma różnicami:
- ukąszenie nakłada `zakażenie` **zamiast** stosu jadu, i tylko jeśli jeszcze
  nie działa (nie odświeża się w nieskończoność przy każdym ciosie);
- `canDeaggro()` → `false` tylko w `windup`; poza tym normalnie.

### Config (skrót — różnice względem A)

```ts
  hp: 48,
  xpReward: 45,
  touchDamageMin: 4, touchDamageMax: 6, touchDamageCooldown: 1.2,
  touchDamageType: "pierce",
  chaseSpeed: 78,               // wolniejszy od gracza (150): da się odejść
  aggroRange: 140, deAggroRange: 280,
  bite: {
    biteRange: 54, windupMs: 420, biteReach: 66,
    damageMin: 7, damageMax: 10, damageType: "pierce",
    cooldownMs: 2000, recoverMs: 280,
  },
  infection: {
    id: "rot",
    name: "Zakażenie",
    durationMs: 14000,          // blokada leczenia; ŻADNYCH obrażeń
    // Odświeżane tylko wtedy, gdy nie działa — inaczej pająk trzymałby gracza
    // w blokadzie w nieskończoność i „odejdź" przestałoby być odpowiedzią.
    refreshable: false,
  },
```

### Rozstawienie

Dwa–trzy egzemplarze **na trasie do wschodniej gęstwiny**, czyli przed dzikami
i sieciarzami, nie między nimi. Sens jest sekwencyjny: kąsacz zabiera możliwość
podleczenia się **przed** trudnym fragmentem, a nie w jego trakcie.

### Counterplay

**Bez umiejętności:** można go po prostu **wyminąć** — jest wolniejszy od gracza
(78 vs 150) i ma mały aggro. Pierwszy przeciwnik w grze, którego świadome
ominięcie jest poprawną odpowiedzią. Jeśli już zakazi: mikstura działa
normalnie, więc odpowiedź istnieje i kosztuje złoto.
**Z umiejętnościami:** Unik omija ukąszenie; Wir ostrzy nieistotny (nie chodzą
w grupach) — i to jest zaleta, bo nie każdy stwór musi karmić każdą umiejętność.

### Nagroda

XP **45**. Loot: `spider_silk` (0,6) + `venom_gland` (0,3).

### Co to psuje

1. **Najsłabiej widoczna mechanika w całej grze.** Gracz, który nie tapnie
   ikony na pasku, zobaczy tylko tyle, że „regeneracja przestała działać" —
   a to czyta się jak **błąd**, nie jak przeciwnik. To jest realne ryzyko,
   nie teoretyczne: dokładnie ta pomyłka zdarzyła się już raz przy jedzeniu
   („buff znika, gdy go klikam" — a to było dojście do pełnego HP).
2. **Dewaluuje Pieczenie mięsa**, za które gracz zapłacił 35 g i **3 punkty
   umiejętności** (najdroższa rzecz w tej walucie). Zabranie mu działania
   w jednej strefie jest projektowo uczciwe, ale trzeba to nazwać.
3. Nie odpowiada na pytanie, które postawił recenzent („czy potrafisz przerwać
   własny atak"). Decyzja jest **strategiczna, między walkami**, a nie
   w rytmie zamachu. To osobna, dobra rzecz — ale inna niż zamówiona.

---

## Koncepcja C — **Strażniczka gniazda** (jad jako egzekutor terytorium)

> **Pytanie do gracza:** „Czy w ogóle tu wchodzisz?"

Nie goni. Stoi na kokonie i **jest brutalna wyłącznie w promieniu kilku kafli**.
Poza nim całkowicie nieszkodliwa. Pierwszy przeciwnik, którego wolno pominąć —
i pierwsze miejsce na mapie, które **należy do kogoś** i trzeba je odebrać.

### Zachowanie

`patrolRadius: 0` — nie wędruje. `aggroRange` mały, `deAggroRange` ledwo większy
(smycz), więc odejście o trzy kafle kończy walkę natychmiast. W środku swojego
koła: mocne, telegrafowane ukąszenie z jadem i sporo HP. Za kokon płaci lootem,
którego nie ma nigdzie indziej.

### Config (skrót)

```ts
  hp: 62,
  xpReward: 65,
  touchDamageMin: 5, touchDamageMax: 8, touchDamageCooldown: 1.1,
  touchDamageType: "pierce",
  patrolSpeed: 0,               // nie wędruje: pilnuje
  chaseSpeed: 70,
  aggroRange: 110,
  deAggroRange: 170,            // smycz — 2 kafle za aggro i po walce
  patrolRadius: 0,
  bite: { biteRange: 62, windupMs: 520, damageMin: 9, damageMax: 13,
          damageType: "pierce", cooldownMs: 2100, recoverMs: 380 },
  venom: { damagePerStack: 3, tickMs: 2000, durationMs: 6000, maxStacks: 2 },
```

### Rozstawienie

**Dwie sztuki, każda na własnym gnieździe**, w miejscach, które gracz i tak
mija: jedno przy rozwidleniu ścieżki we wschodniej gęstwinie, drugie głębiej,
poza trasą. Gniazdo jest obiektem świata (kokon), z którego zbiera się łup —
mechanicznie najbliżej temu do istniejących stanowisk ziół.

### Counterplay

**Bez umiejętności:** wyjście z koła. Zawsze, natychmiast, za darmo. Walka jest
w 100% opcjonalna i to jest jej treść — gracz sam ustala, kiedy jest gotowy.
**Z umiejętnościami:** Unik pozwala walczyć w kole zamiast z jego krawędzi;
Okrzyk skraca fight, w którym każdy dodatkowy tell to kolejny stos.

### Nagroda

XP **65** (najwyższe z trójki — to najbliżej mini-bossa) + zawartość kokonu:
`spider_silk` ×3–5 pewne + `venom_gland` pewny. Pewność ma znaczenie: przy walce
całkowicie opcjonalnej losowy łup znaczy, że gracz mógł zapłacić HP za nic.

### Co to psuje

1. **Wymaga nowej zawartości, nie tylko nowego stwora** — kokon jako obiekt
   świata, jego grafika (której nie ma) i łup. Pozostałe dwie koncepcje to
   config + podklasa + spawny.
2. **Przy braku kolizji na mapie stacjonarny wróg jest trywialny do pominięcia**
   — cała jej wartość zależy od tego, czy nagroda w kokonie jest naprawdę
   warta walki. Jeśli nie, to jest to darmowe XP, którego gracz nie tknie.
3. Najdalej od pytania recenzenta — uczy o **mapie**, nie o rytmie walki.
4. Ryzyko konfliktu z zasadą, że wschodnia gęstwina „niczego jeszcze nie
   tłumaczy": gniazdo z kokonami jest dość mocnym stwierdzeniem fabularnym,
   żeby wymagać zgody `docs/swiat.md`, a nie tylko decyzji balansowej.

---

## Porównanie i moja rekomendacja

| | A. Skoczek | B. Kąsacz | C. Strażniczka |
|---|---|---|---|
| Nowa nisza | tempo zwarcia | ekonomia leczenia | terytorium |
| Odpowiada na pytanie recenzenta | **tak, wprost** | częściowo | nie |
| Koszt implementacji | średni (T-1 + T-3) | **niski** | wysoki (nowy obiekt świata) |
| Widoczność mechaniki | średnia | **zła** | dobra |
| Wymaga rozstrzygnięcia T-6 | tak | **nie** | nie (smycz) |
| Dokłada do przestrzelonej puli XP | +120 | +90–135 | +130 |

**Wybrałbym A** — jako jedyna stawia decyzję tam, gdzie recenzent chciał: w
rytmie zamachu, przy ukorzenieniu i telegrafie, na poziomie, na którym gracz
nie ma jeszcze Uniku.

Z jednym zapożyczeniem z B, **które nie kosztuje ani linijki**: ticki jadu idą
przez obrażenia, a **każde otrzymane obrażenie restartuje pięciosekundową
blokadę regeneracji i kasuje trwający posiłek**. Czyli jad z koncepcji A
*automatycznie* robi to, co koncepcja B robi jawnie — przez 6 sekund jadu plus
5 sekund blokady gracz nie odzyska ani punktu. Gałąź „odchodzę" kosztuje więc
**~11 sekund stania w lesie**, i to jest dokładnie ta cena, która robi z tego
decyzję zamiast oczywistości.

Zanim cokolwiek napiszę w kodzie, potrzebuję dwóch rozstrzygnięć od Ciebie:
1. **T-6** — czy ten pająk leczy się przy zerwaniu pościgu (precedens na cały
   bestiariusz), czy koszt czasowy z akapitu wyżej wystarcza?
2. **Widoczność stosów (punkt 2 „co psuje" w A)** — zostajemy przy linijce
   `detail` na pasku buffów, czy jad dostaje coś wyraźniejszego (np. licznik
   przy ikonie), co jest już małą zmianą w UI, a nie w walce?

---

# Pomiar przebiegu walki (odpowiedź na zastrzeżenie recenzenta)

**Decyzje przyjęte:** A — Skoczek jadowity; **nie leczy się** po zerwaniu
pościgu (T-6 zamknięte kosztem czasowym); jad **nietłumiony pancerzem**; cicha
ścieżka obrażeń; **licznik stosów widoczny przy ikonie**; tell 480 ms; realny
test zasięgu przy trafieniu; młot przerywa tell.

Zastrzeżenie było trafne, a odpowiedź jest gorsza, niż brzmiało pytanie.
**Przy liczbach z koncepcji A trzy stosy nie są „rzadkie" — są nieosiągalne.**
Model: naciśnięcie → trafienie po `0,5 × swingDurationMs`, kolejny zamach po
`attackCooldown`, oczekiwany mnożnik krytyka 1,12, pająk bez pancerza, ukąszenie
co `cooldownMs + windupMs`, jad odświeżany przy każdym ukąszeniu.
Skrypt: `sim_jad.py` / `sim_jad2.py` (scratchpad, nie w repo).

### P-1. Liczby z koncepcji A dają ZAWSZE jeden stos

HP 34, cooldown 1800 ms → ukąszenie co 2280 ms. Kolejne stosy lądowałyby
w 0,48 s / 2,76 s / 5,04 s od wejścia w zasięg. Zabicie 34 HP trwa **0,6–2,1 s**
zależnie od broni i Siły. Wynik: **1 ukąszenie, 1 stos — dla każdej z sześciu
broni i każdej wartości Siły.** Mechanika trzech stosów nie jest słabo widoczna,
tylko nie istnieje. Moje własne „jedno–dwa ukąszenia" było poprawnym opisem
walki i niepoprawnym opisem tego, co zaprojektowałem obok.

### P-2. Pojedynczy pająk NIE MOŻE dać trzech stosów bez zamiany w dzika

Ile HP musi mieć, żeby dożyć do trzeciego ukąszenia (przy cooldownie skróconym
do 600 ms, czyli ukąszeniu co 1080 ms):

| broń | Siła 0 | Siła 2 | Siła 4 |
|---|---|---|---|
| kij | 44 HP | 56 HP | 68 HP |
| miecz | 68 HP | 80 HP | 92 HP |
| młot | 77 HP | 86 HP | 96 HP |

Dzik ma 95 HP. Trzeci stos w pojedynku wymagałby więc stwora **z górnej półki
wytrzymałości** — czyli dokładnie tego, czego brief zakazuje („mało HP", „nie
duże HP"). **Wniosek: trzy stosy to stan STARCIA, nie pojedynku.**

### P-3. Rozwiązanie jest w rozstawieniu, nie w liczbach stwora

Rekomendowane: **HP 46, `cooldownMs: 700` (ukąszenie co 1180 ms), tell 480 ms,
ukąszenie 4–6, jad 2/stos co 1,5 s przez 6 s, maks 3.**

| sytuacja | stosy | czas | HP gracza |
|---|---|---|---|
| **jeden pająk, gra zachłanna** | **1–2** | 1,0–2,6 s | 13–26 |
| **jeden pająk, odchodzi na tell** | **0** | 1,2–3,1 s | 0 |
| **para, gra zachłanna** | **3 (wszystkie buildy poza młotem/Siła 4)** | 2,5–5,6 s | **43–66** |

To jest dokładnie ta sama struktura, którą ma sieciarz: **jeden uczy, para
pokazuje po co.** Samotny skoczek przy ścieżce uczy tellu i tego, czym jest jad
(1 stos); para w głębi gęstwiny jest jedynym miejscem, w którym licznik dochodzi
do 3 — i kosztuje wtedy **43–66 HP przy 100 HP bazowych**, czyli jest realnym
zagrożeniem życia, a nie ozdobą.

Uwaga do liczby 2: przy jednym pająku granica między 1 a 2 stosami leży
**dosłownie na ±3 HP** (miecz Siła 2 zabija 46 HP w 1,59 s, drugie ukąszenie
pada w 1,66 s). Nie warto tego stroić — projektowo samotny skoczek jest „jeden
stos", a dwójka to stan przejściowy w drodze do trzech.

### P-4. ⚠ Trudność pary jest PRZESTRZENNA, nie czasowa (skorygowane)

**Pierwsza wersja tego punktu twierdziła, że pary nie da się odtańczyć, i była
błędna.** Wynikała z założenia, że uchylenie się kosztuje ~600 ms bez ataku —
czyli że gracz wycofuje się i wraca *poza* własnym rytmem. Przy dwóch pająkach
na przesuniętych cyklach (tell co ~590 ms) wychodziło z tego, że gracz nie
wykonuje ani jednego zamachu, i symulacja to potwierdzała, bo miała wpisane to
samo założenie.

Policzone porządnie: **unik mieści się prawie w całości w naturalnej przerwie
między końcem ukorzenienia a kolejnym dozwolonym zamachem.**

| broń | cooldown | root | wolne okno | strata na unik |
|---|---|---|---|---|
| kij | 500 | 210 | 290 | **43 ms** |
| sztylet | 450 | 180 | 270 | **63 ms** |
| toporek | 480 | 205 | 275 | **58 ms** |
| miecz | 500 | 220 | 280 | **53 ms** |
| siekiera | 500 | 230 | 270 | **63 ms** |
| młot | 650 | 280 | 370 | **0 ms** |

(unik = 25 px w bok i z powrotem przy 150 px/s = 333 ms)

Drugi warunek też przechodzi: **tell 480 ms starcza na reakcję od zera**, nawet
jeśli gracz nacisnął atak dokładnie w chwili jego rozpoczęcia — root plus marsz
to 347–447 ms, czyli margines **33 ms dla młota i 83–133 ms dla reszty**.

Wniosek odwrotny do pierwotnego i zgodny z tym, czego chciał recenzent: **parę
da się wygrać samym ruchem, targetowaniem i focusowaniem.** Jej trudność jest
**przestrzenna** — dwa kierunki zagrożenia naraz, więc cofnięcie się przed
jednym może wejść pod drugiego — a nie czasowa. Nie jest testem posiadania
młota ani Uniku i nie wolno jej takim zrobić.

Konsekwencje dla rozstawienia (bez zmian, ale teraz z innego powodu):

- cooldown **700 ms** zostaje — nie po to, żeby dało się odtańczyć (da się przy
  600 też), tylko żeby przy pomyłce był oddech;
- **para stoi ZA samotnym skoczkiem na trasie**, nigdy przed nim;
- **nie stawiać pary w zasięgu aggro dzika** (175 px) — dzik + 3 stosy + brak
  regeneracji przez ~11 s to trzy rzeczy naraz, a gra już ma parę sieciarzy
  przy dziku i to jest jej limit tego chwytu;
- trzeci skoczek: **nie** — trójka to wataha, a wataha jest wilkiem.

### P-5. Zachłanność jest poprawnie ukarana (sprawdzone, nie założone)

Pojedynek, miecz/Siła 0: gra zachłanna kończy walkę w 1,59 s i kosztuje 26 HP;
gra poprawna kończy ją w 1,87 s i kosztuje 0. **0,28 sekundy za 26 HP** — tell
opłaca się szanować, i to bez Uniku, samym chodzeniem. Dla młota rachunek jest
jeszcze lepszy, bo przerwanie tellu nie kosztuje nawet tych 0,28 s.

### P-6. Licznik stosów kosztuje mniej, niż się wydawało

`BuffBar` ma **już** per-ikonę obiekt tekstowy z odliczaniem sekund,
odświeżany co klatkę z tego samego snapshotu, z którego czyta `remainingMs`.
Licznik stosów to: pole `stacks?: number` w `ActiveBuff`, drugi mały tekst
w widgecie i jedna linijka w tej samej pętli. **Musi iść snapshotem, nie
zdarzeniem** — zmiana stosu w środku walki nie może przebudowywać paska.

---

---

# Status: WDROŻONE (2026-08-13)

Obie otwarte kwestie rozstrzygnięte przez autora, koncepcja A zaimplementowana
w całości. Ten rozdział jest zapisem tego, co ostatecznie poszło do gry —
reszta dokumentu zostaje jako uzasadnienie, także tych wariantów, które
odpadły.

**Rozstrzygnięcia:**

1. **Para NIE jest szczelna.** Nie wolno jej robić testem posiadania młota albo
   Uniku — ma być testem focusowania i zarządzania pozycją. P-4 wyżej pokazuje,
   że jest to spełnione, choć pierwsza wersja tego punktu twierdziła inaczej.
   Cooldown **700 ms bez zmian**.
2. **Ukąszenie ścięte 4–6 → 3–5.** Para przy 4–6 kosztowała 43–66 HP przy
   100 HP bazowych plus ~11 s bez leczenia — za blisko śmierci jak na zwykłego
   moba, zwłaszcza że gracz wchodzi tam ok. 5 poziomu, często bez mikstur.
3. **Bez leczenia po zerwaniu pościgu** (T-6): kosztem odejścia jest czas, nie
   utrata postępu. Heal-on-deaggro byłby precedensem dla całego bestiariusza.
4. **Licznik stosów przy ikonie**, nie tylko w `detail` po tapnięciu.

**Liczby, które poszły do `GameConfig.VENOM_SPIDER`:**

```
hp 46 · xp 40 · chase 96 · aggro 150 / de-aggro 300 · bez pancerza
bite:  range 58 · reach 70 · windup 480 ms · cooldown 700 ms · recover 300 ms
       3–5 obrażeń, typ pierce
venom: 2 obr./stos co 1,5 s przez 6 s, maks 3 stosy, odświeżany nie sumowany
dotyk: 2–3 co 1,4 s, bez typu (szczątkowy — nie jest kanałem ataku)
```

**Rozstawienie w `forrest.tmj`** — wszystkie trzy **głębiej niż dziki**
(zmiana wobec pierwotnego szkicu, decyzja autora w trakcie implementacji:
sieciarza spotyka się przypadkiem, skoczka dopiero gdy poszło się dalej):
samotny **(2320, 1360)**, para **(2704, 1456)** i **(2800, 1520)**, 115 px od
siebie. Zaudytowane odczytem `.tmj`: 410–902 px od najbliższego dzika,
326–567 px od najbliższego sieciarza.

**Co powstało w kodzie:** `VENOM_SPIDER` w `GameConfig.ts`;
`src/entities/VenomSpider.ts` (fazy `approach/windup/bite/recover`, ponowny
test zasięgu w chwili trafienia, `interrupt()` na obuch); `Player.applyVenom`/
`updateVenom`/`takeVenomTick` (cicha ścieżka obrażeń — bez dźwięku, flasha,
wstrząsu kamery, bez redukcji pancerzem, ale z restartem blokady regeneracji
i skasowaniem posiłku); `stacks` w `Buffs` + licznik w `BuffBar`; `venom_gland`
w `ITEMS`/`LOOT`; `makeVenomSpiderPlaceholder` w `Assets.ts`; nazwa obiektu
w `TiledMap` (`venomspider` / `skoczek` / `pajak_jadowity`).

⚠ **Czego NIE zrobiono: weryfikacji w silniku.** `npx tsc --noEmit` i
`npm run build` przechodzą czysto, mapa sprawdzona odczytem pliku, ale gra nie
została uruchomiona — ukryty Browser pane daje canvas 0×0 i Phaser wywala się
na `Framebuffer status: Incomplete Attachment` jeszcze przed dodaniem scen.
**Rytm walki, ticki jadu i licznik stosów są policzone, nie zagrane.**
Pozycja w `docs/odlozone.md`.

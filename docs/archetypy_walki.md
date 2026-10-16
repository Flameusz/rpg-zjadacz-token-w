---
typ: OPERACYJNE
domena: weapons
tytul: Archetypy walki — prototyp dual wieldu i kierunki
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Archetypy walki — 1H+Tarcza / 2H / Dual Wield

**Data: 2026-09-05.** Dokument ma **dwie warstwy i nie wolno ich mylić**:

| §1–§3 | **PROTOTYP DUAL WIELDU — W KODZIE.** Opis tego, co naprawdę działa |
|---|---|
| **§4–§7** | **KIERUNEK NA PRZYSZŁOŚĆ — ZERO KODU.** Ustalenia z analizy i benchmarku, do osobnych sesji. **Nie jest to specyfikacja do wykonania.** |

⛔ **Nie implementuj niczego z §4–§7 „przy okazji".** Każda z tych pozycji jest
osobną decyzją projektową, a część z nich autor świadomie zostawił otwartą.

---

# §1. Prototyp Dual Wield — co zostało zrobione

**Zakres był wąski i celowy: sprawdzić, czy dwie bronie jako DWA NIEZALEŻNE
PROFILE CIOSU współpracują z istniejącym systemem walki.** Nie balans, nie
poziomy, nie efekty.

| działa | jak |
|---|---|
| broń jednoręczna w drugiej ręce | `Equipment.accepts` przepuszcza `itemHands === 1` |
| ataki naprzemienne MH → OH → MH → OH | `GameScene.nextHand` + `nextStrike()` |
| każda ręka = własna broń | `offhandStrike()` — trzeci profil ciosu w grze |
| własne Władanie i Mastery per ręka | `Progression.offhandNumbers` |
| własne obrażenia, typ, zasięg, łuk, cecha rodziny | jw. |
| tempo przez ISTNIEJĄCY kanał | `Equipment.offhandSwingMul` |
| **kadencja PER RĘKA** | `StrikeProfile.cooldownMs` → `triggerAttack` |
| koszt staminy per ręka | `strike.staminaCost` |
| zużycie broni per ręka | `Equipment.wearWeapon(slot)` |

⛔ **Czego prototyp NIE ma — świadomie:** mnożników kary MH/OH, bramek poziomu
Dwuręczności, efektów, proców, zasobów, movesetu, nowych zdolności, wyrównania
DPS do 1H/2H/tarczy. **Każda ręka zadaje pełne obrażenia swojej broni.**
Dokładanie kary przed oceną mechaniki byłoby balansowaniem czegoś, o czym nie
wiadomo jeszcze, czy jest dobre.

## §1.0. Kadencja — model „per-ręka" (2026-09-05)

**Bramka po ciosie należy do ręki, która właśnie uderzyła.** Nadal jest JEDEN
timer i jedna sekwencja — nie ma dwóch niezależnych timerów. Zmienia się
wyłącznie to, czyim cooldownem ustawia się następne okno.

⚠⚠ **Powód: do 2026-09-05 bramka po KAŻDYM ciosie brała `Progression.attackCooldown`,
czyli tempo ręki GŁÓWNEJ** — więc broń off-handa nie uczestniczyła w wyznaczaniu
kadencji w ogóle. Przy 2× sztylet było to niewidoczne (identyczne bronie), przy
parze mieszanej znaczyło, że druga broń nie ma tempa.

Rozważone cztery modele i ich konsekwencje:

| model | przepustowość (miecz+sztylet) | co robi z tożsamością broni |
|---|---|---|
| średnia = suma cyklu | 2,77/s | **miesza** oba tempa w jedną liczbę |
| najwolniejsza rządzi | 2,64/s | off-hand nigdy nie przyspiesza — ⛔ kara za mieszanie |
| **per-ręka (wybrany)** | **2,77/s** | **każda broń zachowuje własne tempo** |
| osobny współczynnik | — | off-hand dalej nie uczestniczy |

**Wybrano per-ręka**, bo: (1) ma tę samą przepustowość co średnia, (2) zachowuje
tempo obu broni zamiast je uśredniać, (3) nie unieważnia zdania
„`attackCooldown` to tempo tej broni", które czyta też UI, (4) jest **tym samym
wzorcem**, którym do `StrikeProfile` weszły już czas zamachu, koszt staminy
i liczby rzutu.

⚠ **Konsekwencja do playtestu: przy parze mieszanej rytm jest SYNKOPOWANY**
(dłuższy odstęp po wolniejszej broni). Zmierzone przy ZRĘ 10: miecz + sztylet
daje **379 → 342 → 379 → 342 ms**. Przy 2× sztylet model jest nierozróżnialny od
średniej (342 ms równo).

⚠ **Zero nowych liczb i mnożników** — `offhandAttackCooldown` liczy tym samym
wzorem co `attackCooldown`, z tym samym `swingMulPublic`.

⚠ **Umiejętności zostają na ręce GŁÓWNEJ** — naprzemienność dotyczy wyłącznie
autoataku. Dotyczy to także ciosu kończącego Wypad (`landRushStrike`).

## §1.1. ⚠⚠ Znaleziona i naprawiona istniejąca niespójność

`StrikeProfile` zamrażał przy zamachu zasięg, typ, biegłość i rodzinę — z jawnym
uzasadnieniem, że odczyt w chwili TRAFIENIA pozwalałby przezbroić się w oknie
zamachu. Ale **`Player.rollDamage` czytał `Progression` na żywo**, więc
obrażenia jako jedyne **nie były zamrożone**: dało się zamachnąć jedną bronią,
a rozstrzygnąć rzutem drugiej.

Dla Dual Wieldu było to blokujące (cios off-handa musi losować z zakresu SWOJEJ
broni), ale **niespójność istniała wcześniej** i naprawiono ją w tym samym
miejscu, w którym mieszka reszta zamrożonego profilu.

⚠ `critChance` **zostaje odczytem żywym** i to jest decyzja: szansa krytyka jest
własnością POSTACI i sprzętu, nie ręki ani zamachu. Mnożnik krytyka — przeciwnie,
bo jego cecha należy do rodziny broni.

## §1.2. Znane ograniczenia prototypu

- **Brak bramki poziomu Dwuręczności** — system poziomów DW nie istnieje, więc
  dziś w drugiej ręce wolno położyć **dowolną** broń jednoręczną, nie tylko
  sztylet. Udawanie bramki warunkiem na typ broni byłoby wymyśloną regułą.
- **Jedna poza zamachu** — obie ręce dzielą tę samą animację. Wizualnie DW nie
  odróżnia się od jednej broni.
- **`DUAL_WIELD.swingMul` jest PLACEHOLDEREM**, nie wynikiem strojenia. Stoi
  poniżej 1, bo przy 1 model naprzemienny jest z konstrukcji stratą.

## §1.3. Bramka

`tools/combat_regresja.mjs` **§W** — siedem grup asercji: naprzemienność,
przełączanie ręki przy zatwierdzeniu, zamrożenie liczb rzutu, jeden dom
rozwiązywania off-handa, koszt i zużycie za ręką, ograniczenie do broni
jednoręcznej oraz **jawna asercja, że kar MH/OH nadal NIE MA** (ciche dołożenie
mnożnika ma zapalić lampkę, bo balans jest osobnym etapem).

⚠ §W złapało realny błąd już przy pierwszym uruchomieniu: podmiana na
`nextStrike()` trafiła w `landRushStrike` zamiast w `resolveAttack`.

---

# §2. Liczby, które trzeba znać przed strojeniem

Policzone 2026-09-05 na żywym configu (`Proficiency.ts` + `GameConfig`):

- ⚠⚠ **Przy niezmienionej kadencji model naprzemienny jest STRATĄ 17–43%** — we
  wszystkich konfiguracjach i przy wszystkich poziomach Władania. Połowa ciosów
  idzie słabszą ręką, więc **przyspieszenie kadencji jest warunkiem istnienia
  tego modelu**, nie ozdobą.
- **Kadencje parytetu** (przy których DW = jedna broń) mieszczą się w paśmie
  κ ≈ 0,57–0,84 zależnie od konfiguracji i poziomu.
- **Utrzymywalność jest naturalną ceną i już istnieje**: jedna broń bije bez
  końca (koszt ~3,0/s wobec regenu 3,0/s), DW ma okno **38–58 s**.
- **Podłoga pozy nie ogranicza tempa** — zapas 85–150%.
- **DW nagradza inwestycję w DWIE bronie**: przy nierównym Władaniu jest gorszy
  niż lepsza z broni użyta solo (−18% i −26% w skrajnych rogach siatki).
  Bramka umiejętności jest **emergentna z `P`**, nie zaprojektowana.

---

# §3. Kolejność odblokowań — ustalenie autora

```
DW I   → 2× sztylet
DW II  → 1H + sztylet
DW III → 2× 1H
DW IV–V → NIE PROJEKTUJEMY
```

Uzasadnienie: **trudność opanowania pary**, nie atrakcyjność buildu. Dwie lekkie,
podobne bronie są najłatwiejsze; para różnych klas wymaga koordynacji dwóch
sposobów prowadzenia; dwie ciężkie są najtrudniejsze przez masę i bezwładność.

⭐ **Trzy niezależne potwierdzenia tej kolejności, których nie było w pierwotnym
uzasadnieniu:**
1. **Rodziny broni:** 2× sztylet i 2× miecz używają JEDNEJ rodziny (obie ręce
   dzielą to samo `P`); **1H + sztylet jest jedyną konfiguracją wymagającą
   DWÓCH treningów** — czyli mieszana jest najdroższa także systemowo.
2. **Waga łączna:** 2,0 → 3,5 → 5,0 kg, wprost w udźwig, unik i sprint.
3. **Precedens:** D&D 5e dopuszcza w regule bazowej **wyłącznie broń lekką**
   w obu rękach, a feat *Dual Wielder* odblokowuje cięższe. Ta sama kolejność.

⚠ Konsekwencja do świadomości: DW II jest **twardsze niż DW III w kosztach
nauki** (dwie rodziny vs jedna), a łatwiejsze w masie. Daje to DW II własną
tożsamość: jedyna konfiguracja z **dwiema cechami rodzin naraz** i dwoma typami
obrażeń.

---

---

# §4. DALSZY ROZWÓJ ROZRÓŻNIENIA STYLÓW WALKI

> ⛔ **OD TEGO MIEJSCA: KIERUNEK, NIE SPECYFIKACJA. ZERO KODU.**

Trzy archetypy mają być **równorzędne w sensie „każdy jest najlepszą odpowiedzią
na inne pytanie"**, a nie równe w DPS. Wyrównywanie ich do jednej liczby jest
jawnie odrzucone.

| | 1H + Tarcza | 2H | Dual Wield |
|---|---|---|---|
| **pytanie** | „on uderzy mocno i to widać" | „muszę go rozbić, zanim on rozbije mnie" | „muszę zdążyć, zanim zabraknie mi tchu" |
| **oś przewagi** | przetrwanie i kontrola | siła pojedynczej interakcji | **liczba ZDARZEŃ w czasie** |
| **waluta, którą płaci** | obrażeniami | czasem (bezbronność) | oddechem (stamina) |
| **dojrzałość** | ✅ gotowy | ⚠ tylko liczby broni | ⚠ prototyp mechaniki |

⭐ **Każdy płaci INNĄ walutą — i to jest najlepszy dowód, że trójkąt jest
prawdziwy, a nie trzema wariantami jednego stylu.**

## §4.1. Weryfikacja benchmarkiem (2026-09-05)

Podział **jest zbieżny z rozwiązaniami czterech dojrzałych systemów w czterech
różnych gatunkach**: Monster Hunter (SnS / Great Sword / Dual Blades), ESO (trzy
linie umiejętności), Dragon Age: Origins (trzy drzewa), Souls (tarcza /
dwuręczenie / power stance). Niezależna zbieżność to najmocniejszy dowód, jaki
design może dostać.

Dwa zastrzeżenia dotyczą NAS, nie podziału — patrz §5.2 i §6.1.

---

# §5. 1H + TARCZA — kierunek

**Przewaga:** przetrwanie i kontrola. **Koszt:** czysty DPS.

⚠ **Cena tarczy jest dziś WYŁĄCZNIE w obrażeniach.** `blockSpec.swingMul`
wydłuża zamach **i** cooldown, więc `stamina/s` ataku się nie zmienia (koszt
zamachu i kadencja mnożą się przez tę samą liczbę). Souls stawia cenę
w staminie; u nas jej tam nie ma. Świadoma różnica, nie błąd — ale trzeba ją
znać przy projektowaniu Specjalizacji.

## §5.1. Specjalizacja tarczy — kierunek

⚠⚠ **Progresja ma dotyczyć OKNA, nie SIŁY — i to jest wniosek z benchmarku, nie
preferencja.** Ani jeden dojrzały system nie rozwija tarczy przez „blokujesz
o X% więcej":

- Souls: **stabilność** = ile staminy kosztuje blok;
- ESO: koszt bloku + **osobne umiejętności** (taunt, Defensive Posture);
- WoW: Shield Block = **uptime**, Shield Specialization = **proc po bloku**;
- MH: guard points = **czysty timing**.

Redukcja jest własnością PRZEDMIOTU (jak `melee` broni). Kompetencją jest łuk,
czas, koszt i to, co blok **zostawia po sobie**.

## §5.2. ⚠ Brak, którego nie widzieliśmy

**Nasz blok nie daje ZA NIC po udanej obronie.** Każda gra z benchmarku coś
daje: guard counter (Elden Ring), riposte, obrażenia staminy napastnika (Souls),
guard point → atak (MH), proc zasobu (WoW). Nasz blok jest czysto negatywny —
unikasz kary, nie zyskujesz przewagi.

⭐ Hak istnieje: `Player.takeDamage` zwraca `{ outcome, mitigated, killed }`,
więc „udany blok" jest już rozpoznawalnym zdarzeniem. Brakuje konsumenta.

---

# §6. 2H — kierunek

**Przewaga:** siła pojedynczej interakcji. **Koszt:** czas bezbronności.

## §6.1. ⛔ Największa dziura w całym trójkącie

W `GameConfig`, przy włóczni, stoi wprost: **`hands: 2` NIE niesie żadnego
bonusu.** Jedyna strukturalna własność broni dwuręcznej to blokada drugiego
slotu — czyli **sam koszt**. Dziś 2H **nie ma ani jednej mechaniki, której nie
ma 1H**; ma większe liczby i wolniejszą kadencję.

To jest dokładnie antywzorzec, który benchmark identyfikuje jako powód, dla
którego 2H bywa „gorszym 1H".

## §6.2. Czego brakuje — jedna mechanika, nie dwie

Benchmark mówi jednym głosem: **długi commitment jest sprzedawalny TYLKO wtedy,
gdy w jego trakcie jesteś ODPORNY.**

- MH Great Sword: **Tackle** — hyper armor, dobrowolne przyjęcie ciosu jako
  DECYZJA, nie ratunek;
- Dark Souls II / Elden Ring: **poise / hyper armor**;
- Nioh: postawy.

Bez tego commitment jest czystym ryzykiem bez wypłaty.

⭐⭐ **Hak ISTNIEJE i jest jedną gałęzią.** `GameScene` kasuje `pendingSwing`
gracza, gdy ten oberwie ciężko (bramka `Stamina.impactTier`). „Odporność podczas
zamachu" to **warunek na tej gałęzi**, a nie nowy system.

⚠ **Odradzam pasek postawy / stance damage** (wariant B rozważany w analizie):
wymaga nowego zasobu na każdym wrogu, nowego UI, strojenia per gatunek i
**zderza się znaczeniowo z trzema istniejącymi pojęciami kontroli**
(`interrupt` / `stagger` / `stun`). Do tego bez odporności i tak nie naprawia
commitmentu — tylko dokłada moc.

## §6.3. Mastery 2H — jeśli powstanie

⚠ **Nie może być drugą osią opisującą „jak dobrze władam toporem"** — to ma już
rodzina `axe`. Po przeformułowaniu autora (2026-09-05) ma dotyczyć **stylu
ciężkiej broni**, czyli **ceny zaangażowania**: skrócenia ukorzenienia,
odporności na przerwanie, zachowania części pędu. **Nie obrażeń** — te ma broń.

Test, który każda z czterech warstw postępu musi przejść — **inne pytanie**:

| warstwa | pyta o |
|---|---|
| Władanie / Mastery rodziny | jak dobrze operuję TĄ bronią |
| Specjalizacja tarczy | jak szerokie i tanie jest moje okno obrony |
| Mastery 2H | ile kosztuje mnie zaangażowanie w cios |
| Dwuręczność | ile tracę na koordynacji dwóch rąk |

⚠ Koszt uboczny do przyjęcia świadomie: to są **cztery osie postępu** obok
atrybutów, `Skills` i jakości wykonania. Powinny dzielić **jedną prezentację**
(trener + karta Mastery), a nie dostać trzech nowych paneli.

---

# §7. DUAL WIELD — kierunek dalszy

## §7.1. Wyróżnik: częstotliwość ZDARZEŃ, nie obrażenia

W tej grze na *zdarzeniu trafienia* wisi: nałożenie i odświeżenie efektu, rzut
na krytyk, rzut warstwy 2, **przyrost Władania**, przerwanie, zachwianie.

## §7.2. ⚠⚠ Oś jest dziś NIEDOFINANSOWANA na poziomie wejściowym

Sprawdzone: **`pendingSwing.onHit` wypełniają wyłącznie UMIEJĘTNOŚCI** —
autoatak nie niesie żadnej deklaracji on-hit. Zestawiając to z rosterem:

na poziomie **DW I (2× sztylet)** częstotliwość opłaca dziś praktycznie **tylko
krytyk**. Krwawienie przychodzi z umiejętności i **nie kumuluje się**
(`maxStacks: 1`); sztylet nie ma ani przerwania, ani zachwiania; zasobów nie
generujemy.

⭐ **Punkt rozszerzenia jest gotowy:** `ActionOnHit` to deklaratywna unia
(`control` / `refundCooldown` / `armAutoAttack` / `bleed`), konsumowana w chwili
trafienia. Brakuje jednego: **autoatak jej nie niesie**.

⚠ Anty-synergia do rozstrzygnięcia: licznik `1/√n` praktyki jest **per
przeciwnik**, więc naprzemienne ciosy zużywają go dwa razy szybciej — obie
rodzinny uczą się wolniej niż jedna broń. Może być zamierzoną ceną stylu.

## §7.3. Nagrody i kary rozwoju — kierunek

**Kary DW mają być OSOBNĄ WARSTWĄ MNOŻNIKOWĄ obok warstwy 2 — nigdy jej
wejściem.** ⛔ Obniżenie `proficiency` dla off-handa podniosłoby chybienie
i ześlizg (kara liczona drugi raz), zafałszowało pasek wykonania i **skaziło
praktykę** — czyli złamało zasadę „sztylet zachowuje swoje Władanie".

⛔ **Nie kopiować kary do trafienia z WoW Classic** — warstwa 2 ma już chybienie
zależne od `P`; drugie byłoby liczeniem tego samego dwa razy.

**Redukcja kar — zero nowych systemów:**

| co redukuje | czym | nowy kod? |
|---|---|---|
| poziom Dwuręczności | karę STYLU (mnożnik MH + tempo) | ✅ jedyne nowe liczby |
| Władanie off-handa | wyższe `m(P)`, mniej chybień — **automatycznie** | ❌ |
| Mastery off-handa | `effortReduction`, cecha rodziny — **automatycznie** | ❌ |
| Siła / obciążenie | waga drugiej broni — **automatycznie** | ❌ |

⚠ **Otwarte pytania przed liczbami:**
1. czy mnożnik main-hand w ogóle ma istnieć (brief mówi „dołożenie drugiej broni
   nie ma niszczyć podstawowej broni", a mnożnik MH robi dosłownie to);
2. czy DW jest stylem **burstowym** (wynika z ekonomii staminy);
3. czy trzy konfiguracje to trzy style, czy trzy poziomy — **parametry DW są
   ślepe na konfigurację**, więc różnica musi przyjść skądinąd (κ per para,
   zasięg, typ obrażeń, cechy rodzin).

## §7.4. DW IV–V

**Świadomie nieprojektowane.** Odnotowane tylko: warstwa 2 ma dziś **cztery**
rangi Mastery, a docelowo ma być pięć poziomów Władania — piąta ranga i DW IV–V
to ten sam otwarty obszar i warto projektować je **razem**, nie osobno.

## §7.5. Specjalne movesety

**Poza zakresem na długo.** DS2 Power Stance i MH Dual Blades pokazują, że
własny moveset jest najlepszym rozwiązaniem — i najdroższym: to koszt TREŚCI
(animacji), nie kodu. U nas jedna poza zamachu jest twardym ograniczeniem.

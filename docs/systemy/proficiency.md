---
typ: STAN
domena: proficiency
tytul: Biegłość, praktyka i Mastery
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:bieglosc_weryfikacja, przymiar:combat_regresja]
kotwice:
  - src/core/Proficiency.ts
  - src/core/WeaponProficiency.ts
  - src/core/Practice.ts
  - src/core/WeaponTraits.ts
  - GameConfig.PROFICIENCY
  - GameConfig.PRACTICE
otwarte: [OI-28, OI-29]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Biegłość, praktyka i Mastery

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak dobrze postać włada
> tym, co trzyma**: czym jest `P`, co robi z ciosem, skąd rośnie i co daje ranga
> kupiona u trenera.
>
> **Czym NIE jest.** Nie jest listą liczb rosteru ani opisem walki. Nie opisuje
> geometrii ciosu, obrony ani umiejętności; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| czym jest `P`, jak rośnie, co daje ranga | **`proficiency`** |
| czy cios fizycznie dosięgnął celu (warstwa 1) | `combat` |
| unik, parowanie, blok, pancerz (warstwa 3) | `combat`, `shields`, `armor` |
| ile kosztuje zamach i skąd się bierze `C` | `stamina` |
| czym jest rodzina broni i jakie ma cechy | `weapons` |
| ile `P` ma które stworzenie | `creatures` |
| skąd biorą się punkty rozwoju i złoto na rangi | `progression`, `economy` |
| jak wygląda cue „Niezgrabnie" i „Ześlizg" | `presentation` |

⚠⚠ **Biegłość NIE JEST atrybutem i nie kupuje się jej punktami.** Rośnie
z praktyki, osobno w każdej rodzinie broni. To jest **oś prostopadła** do
atrybutów — nie mieszaj obu przy strojeniu.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `proficiency` **czyta** | `weapons` | rodzina założonej broni i jej cechy |
| `proficiency` **czyta** | `creatures` | `P` przeciwnika — jako **nauczyciela** i jako własną biegłość wroga |
| `proficiency` **daje** | `combat` | wynik warstwy 2 i mnożnik jakości `m(P)` |
| `proficiency` **daje** | `stamina` | redukcję kosztu zamachu z rangi |
| `proficiency` **daje** | `weapons` | mnożnik EFEKTU cechy rodziny |
| `proficiency` **bierze** | `progression`, `economy` | punkty rozwoju i złoto na rangi |
| `proficiency` **zapisuje** | `save` | `P`, `P_start` i **rangę** — trzy osobne pola |

---

## 1. Gdzie to leży: trzy warstwy rozstrzygania

```
warstwa 1   czy cios mógł fizycznie dosięgnąć?     → pudło geometryczne
warstwa 2   JAK DOBRZE go wykonano?                → ta domena
warstwa 3   czy obrońca się obronił?               → unik / parowanie / blok / pancerz
```

⚠⚠ **Warstwa 2 jest OSIĄ PROSTOPADŁĄ do wyniku ataku, nie kolejnym wynikiem.**
Cios może być jednocześnie „zablokowany" (warstwa 3) i „ześlizgnięty"
(warstwa 2) — to odpowiedzi na dwa różne pytania i wolno im wypaść razem.

⚠ **Kolejność 1 → 2 jest treścią, nie optymalizacją.** Rzut warstwy 2 pada
**dopiero po** zebraniu trafionych celów; wcześniejszy mieszałby **pudło
geometryczne** z **fuszerką wykonania**, a to rozróżnienie jest największym
ryzykiem odbiorczym systemu.

⚠ **Warstwa 2 działa w OBU kierunkach walki**, tym samym kodem. Jej pliki są
**czyste** (zero Phasera, encji, sceny) — tylko dlatego uprząż potrafi je
uruchomić w Node i cokolwiek dowieść.

---

## 2. `P` — skala i punkt neutralny

`P` jest **liczbą absolutną**, nie odsetkiem czegokolwiek, i mieszka **per
rodzina broni**.

⚠⚠ **`PROFICIENCY.neutral` jest własnością MATEMATYCZNĄ, nie nazwą rangi.**
W punkcie neutralnym wszystkie trzy kanały warstwy 2 są tożsamością: zero szansy
na fuszerkę, zero na ześlizg, mnożnik dokładnie `1`. **Postać kompetentna wobec
punktu neutralnego ma dokładnie balans sprzed warstwy 2** — to jest test
regresyjny numer jeden i musi świecić na zielono.

⚠ **Broń bez rodziny (gołe ręce, kij) dostaje punkt neutralny, nie zero.**
Brak rodziny jest legalnym stanem, nie dziurą; `P = 0` byłoby cichym
osłabieniem oręża, którego system w ogóle nie modeluje.

⚠ **Nowa rodzina startuje od wartości STAŁEJ** (`PROFICIENCY.startNewFamily`):
zero dla postaci, która nigdzie nie doszła do progu, wyższa dla weterana.
⚠⚠ **Warunkiem jest PRÓG `P`, nie wykupiona ranga** — próg mówi o kompetencji,
ranga o zapłacie. ⛔ Model „procent najlepszej innej rodziny" został zmierzony
i odrzucony: czynił przesiadkę łagodniejszą dla bardziej zaawansowanego.

⚠ **`P_start` jest ZAPISYWANY przy pierwszym użyciu rodziny**, nie wyprowadzany
w locie — wyprowadzanie jest niestabilne i odblokowałoby manekina po raz drugi.
⚠ **Rodzina zaczyna istnieć, kiedy nią naprawdę machasz** — praktyka ją tworzy,
nie założenie broni.

---

## 3. Warstwa 2: co robi z ciosem

Trzy wyniki (**fuszerka · ześlizg · czysto**) plus deterministyczny mnożnik
jakości `m(P)`.

| kanał | kształt |
|---|---|
| szansa fuszerki | liniowo od maksimum przy `P = 0` **do zera w punkcie neutralnym** |
| szansa ześlizgu | ten sam kształt, inna amplituda |
| `m(P)` | rośnie do `1` w punkcie neutralnym, **powyżej się NASYCA** |

⚠⚠ **`m(P)` jest SKALAREM, nie zdarzeniem.** Nie ma czego ogłosić, więc wolno mu
działać w **każdym** kanale obrażeń — także tam, gdzie fuszerka i ześlizg nie
mają jak zaistnieć (kontakt przez nachodzenie ciał, pocisk). **Ten podział jest
całym powodem, dla którego warstwa 2 nie zostawia połowy wyjścia rosteru poza
systemem.**

⚠ **JEDEN rzut na ZAMACH, nie na cel.** Wykonanie opisuje, *jak wyprowadzono
cios*, a nie kogo trafił; rzut per cel dałby broni o szerokim łuku kilka
niezależnych losowań na jednym machnięciu.

⚠⚠ **`allowFumble` jest polem WYMAGANYM.** Parametr opcjonalny sprawia, że „ten
atak świadomie nie pudłuje" i „ktoś nie pomyślał" wyglądają w źródle
identycznie. `false` należy się atakowi, który **nie ma dyskretnej chwili
rozstrzygnięcia** albo którego **warstwa 1 zawiera już komponent celowania** —
drugi, losowy rzut na to samo zjawisko byłby podwójnym liczeniem.

⚠ **Ześlizg NIE bierze `m(P)`** — to osobna gałąź paska, nie gorsze trafienie;
pomnożenie obu liczyłoby tę samą karę dwa razy.

⚠ **Wynik warstwy 2 wchodzi PRZED redukcjami**, na surowe obrażenia — tylko
dzięki temu podłoga „nigdy poniżej 1" obejmuje także ześlizg.

⚠ **Fuszerka kończy atak PRZED łańcuchem obrony**, i pilnuje tego **kompilator**,
nie komentarz. Przepuszczenie jej spaliłoby licznik serii obrony.
⚠ **Pudło geometryczne nigdy nie wypada z warstwy 2.**

---

## 4. Nauka: dwa kanały

| kanał | wzór | rola |
|---|---|---|
| **manekin** | `baza × soft(P) × efektywność(P − P_start)` | **rozbieg**, twardo ograniczony do kilku pierwszych punktów rodziny |
| **walka** | `baza × nauczyciel(ρ) × soft(P) × c × (√k − √(k−1))` | **właściwy kanał progresji** |

⚠ **Manekin nie uczy „coraz mniej" — on KOŃCZY.** Poza swoim zakresem daje
dokładnie zero, a nie wartość malejącą.

### 4.1 Funkcja nauczyciela

Wartość przeciwnika jako sparingpartnera zależy **wyłącznie od relacji**
`ρ = P_przeciwnika / P_gracza`: poniżej progu martwego zero, w równości
jedność, przy dwukrotnej przewadze sufit.

⚠⚠ **To jest DRUGIE pytanie systemu i ma DRUGI mianownik.** „Jak dobrze tym
macham" liczy się **absolutnie** (§3); „ile mnie to może nauczyć" jest
**relacją**. Zlanie ich w jedno odrzucono: przy jednym mianowniku nowicjusz nie
czuje nic, a słaby roster cichnie wobec mistrza.

⚠ **`P = 0` → nauczyciel na suficie.** Postać, która nie umie nic, uczy się od
wszystkiego — dlatego pierwsze punkty da się zdobyć w walce, nie tylko na kukle.

⚠⚠ **Z progu martwego wynika TWARDY SUFIT NAUKI per przeciwnik**: stworzenie
przestaje uczyć, gdy `P` gracza przekroczy jego własne `P` podzielone przez ten
próg. **To jest najważniejsza konsekwencja całego modelu nauki** i to ona wiąże
tę domenę z zawartością gry (OI-28).

### 4.2 Malejący przyrost i softzone

⚠ **Przyrost w obrębie jednego przeciwnika MALEJE, liczony przyrostowo** — suma
daje pierwiastek, więc długa walka uczy więcej, ale nie liniowo. ⛔ To
**zastąpiło** twardy limit „maks. X na egzemplarz", który odwracał wartość
długich walk i czynił bossa najgorszym nauczycielem w grze.

⚠ **Licznik trafień jest per EGZEMPLARZ i nie ma wygaszania czasowego** — bo
odrodzenie to zawsze nowa instancja; timer byłby drugim mechanizmem na to samo.
⚠ **Rośnie LENIWIE, dopiero gdy praktyka naprawdę zostanie przyznana** — inaczej
kara za powtarzanie sparingu spadałaby na zamachy, które nikogo nie nauczyły.

⚠ **Softzone liczy się PER PASMO Mastery i resetuje przy wejściu w nowe.** Model
liczony od globalnego sufitu odrzucono: liczył malejące przyrosty **drugi raz**,
po rosnącej cenie punktu.

### 4.3 Cena punktu

⚠ **Cena kolejnego punktu rośnie liniowo, więc łączna praktyka jest
KWADRATOWA** — to jest własność, dzięki której wysokie `P` cokolwiek znaczy.
⚠ **`+1` pozostaje atomem** — zmienia się cena punktu, nigdy jednostka; reszta
czeka w **puli**, która jest buforem, a nie ułamkiem `P`.
⚠ **Waga wyniku warstwy 2 dla nauki:** czysto pełna, ześlizg ułamkowa (ta sama
liczba, która mówi „tyle z ciosu weszło"), fuszerka i pudło **dokładnie zero**.

---

## 5. Mastery — ranga KUPOWANA

⚠⚠ **Ranga jest OSOBNYM, ZAPISANYM STANEM — nie funkcją `P`.** Dwie postacie
z tym samym `P` mogą mieć różne rangi, zależnie od tego, czy zapłaciły u trenera.
To jedyna wielkość tej domeny, której **nie da się odtworzyć z `P`**, i dlatego
jedyna z własnym polem zapisu. ⛔ Model, w którym próg sam nadawał rangę, został
odwrócony i nie wolno do niego wracać.

### 5.1 Podział odczytów — najłatwiejsze miejsce do cichego złamania

```
PRÓG `P`         → softzone · wartość startowa nowej rodziny · przyszłe bramki technik
RANGA WYKUPIONA  → SUFIT `P` · EFEKTY rang
```

⛔ **Nie przepinaj softzone na rangę.** Gracz bez zapłaty nigdy nie opuściłby
pierwszego pasma i jego progresja **cicho by zwalniała** — czyli Mastery stałoby
się bramką na progresji biegłości, wprost wbrew temu, czym ma być.

### 5.2 Sufit i przepadanie

⚠⚠ **`P` staje TWARDO na suficie, a praktyka zdobyta na suficie PRZEPADA** —
nie jest bankowana ani w `P`, ani w puli. Bankowanie byłoby odroczonym punktem,
czyli tym, czego decyzja zabrania.

⚠ **Dlatego powiadomienie o suficie jest OBOWIĄZKOWYM elementem UI, nie ozdobą.**
Sufit zatrzymuje progresję po cichu: cios wygląda i brzmi tak samo, a nic nie
daje. Widoki, które o suficie mówią, gracz musi **sam z siebie** otworzyć.

⚠ **Zakup otwiera się kilka punktów PRZED sufitem** (`PROFICIENCY.mastery.unlockLead`),
żeby dało się zdążyć do trenera. ⛔ To **nie jest** zmiana progu — sufit,
przepadanie i powiadomienie nie zmieniają się ani o punkt.
⚠ **Zakup nie rusza `P`** — podnosi wyłącznie sufit.

### 5.3 Efekty rang

Cztery ładunki, **wszystkie czytają rangę WYKUPIONĄ w rodzinie ZAŁOŻONEJ
BRONI**: redukcja kosztu zamachu, mnożnik cechy rodziny, dolne cięcie rozstrzału
przy krytyku i minimum proporcjonalne. Wartości: `PROFICIENCY.mastery.payload`.

⚠⚠ **Ładunek działa TYLKO wtedy, gdy trzymasz broń z tej rodziny.** Wykupiona
najwyższa ranga toporem nie robi nic dla miecza w ręku — to jest cały sens
biegłości per rodzina, nie skutek uboczny.

⚠ **Mnożymy EFEKT, nie POLE.** ⚠ **Rodziny, których cecha ma bazę ZERO, dostają
własny nośnik** — mnożenie zera zostaje zerem; obecność cechy służy tam wyłącznie
do **rozpoznania rodziny**. ⚠ **Rodzina, której tożsamością nie jest liczba, ma
ładunki PUSTE** — to zapisana decyzja, nie brak.

⚠ **Redukcja kosztu dotyczy WYŁĄCZNIE autoataku** — umiejętności i blok mają
własne koszty i Mastery ich nie tyka.

---

## 6. Niezmienniki

- **N-30** — **punkt neutralny jest tożsamością.** Każda zmiana wzorów warstwy 2
  musi zostawić `m(neutral) = 1`, zero fuszerki i zero ześlizgu.
- **N-31** — **jeden rzut na ZAMACH, nie na cel** (§3).
- **N-32** — **`allowFumble` jest wymagany**, nigdy domyślny (§3).
- **N-33** — **fuszerka kończy atak przed łańcuchem obrony**, egzekwowane typem.
- **N-34** — **ześlizg nie mnoży się przez `m(P)`** (§3).
- **N-35** — **warstwa 2 działa PRZED redukcjami**, na surowej wartości.
- **N-36** — **`m(P)` wolno wszędzie, zdarzenia warstwy 2 tylko tam, gdzie jest
  dyskretna chwila rozstrzygnięcia** (§3).
- **N-37** — **absolutna skala dla „jak dobrze", relacja dla „ile to uczy"**
  (§4.1). Dwa pytania, dwa mianowniki.
- **N-38** — **ranga to zapisany stan, nie funkcja `P`** (§5).
- **N-39** — **próg i ranga sterują ROZŁĄCZNYMI rzeczami** (§5.1).
- **N-40** — **praktyka na suficie przepada i musi być OGŁOSZONA** (§5.2).
- **N-41** — **`+1` jest atomem; zmienia się cena punktu, nigdy jednostka** (§4.3).
- **N-42** — **licznik trafień rośnie tylko wtedy, gdy praktyka została
  przyznana** (§4.2).
- **N-43** — **pliki wzorów zostają CZYSTE** (zero Phasera i sceny) — inaczej
  uprząż przestaje cokolwiek dowodzić.

---

## 7. Checklisty

**Nowa rodzina broni:** zadeklaruj **cechę**, nie dopisuj pola (może być
znacznikiem bez liczby) · rozstrzygnij, jak ranga skaluje jej EFEKT — ⚠ przy
bazie zero potrzebny jest **własny nośnik** · rodzina bez liczbowej tożsamości
ma prawo mieć **puste ładunki**, ale zapisz to jako decyzję.

**Nowy kanał obrażeń:** rozstrzygnij `allowFumble` **jawnie** (N-32) · `m(P)`
stosuj zawsze, zdarzeń warstwy 2 nie dorabiaj bez dyskretnej chwili
rozstrzygnięcia (N-36) · sprawdź kolejność warstw (N-33, N-35).

**Nowy przeciwnik:** `P` jest **wymagane, bez wartości domyślnej** · ⚠ policz,
**do jakiego `P` gracza przestaje uczyć** (§4.1) — to jest jego rola
w progresji, nie liczba dekoracyjna · sprawdź, czy zmienia odpowiedź na OI-28.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/bieglosc_weryfikacja.mjs` · `node tools/combat_regresja.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| warstwa 2 — kierunek wróg → gracz | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| warstwa 2 — kierunek gracz → wróg | ✅ | ✅ | `przymiar:combat_regresja` |
| punkt neutralny jako tożsamość | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| jeden rzut na zamach, po warstwie 1 | ✅ | ✅ | `kod:2026-09-06` |
| `allowFumble` wymagany | ✅ | ✅ | `kod:2026-09-06` |
| ześlizg bez `m(P)`, przed redukcjami | ✅ | ✅ | `przymiar:combat_regresja` |
| magazyn `P` per rodzina + `P_start` | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| praktyka z manekina | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| praktyka z walki (nauczyciel + malejący przyrost) | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| softzone per pasmo | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| Mastery jako ranga kupowana, sufit `P` | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| przepadanie praktyki na suficie + powiadomienie | ✅ | ✅ | `przymiar:bieglosc_weryfikacja` |
| cztery ładunki rang wpięte w rozgrywkę | ✅ | ✅ | `kod:2026-10-09` |
| osiągalność rang przy dzisiejszej zawartości | ❌ | ⚠ | ❌ **policzone — OI-28** |
| odbiór warstwy 2 przez człowieka | ✅ | — | ❌ **nigdy** — OI-29 |
| krytyk po stronie wroga (`g(x)`) | ❌ *(świadomie)* | ✅ | asymetria zaakceptowana — dług D1 (`OI-30` zamknięte jako duplikat) |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-28** | ⚠⚠ **TRZY Z CZTERECH RANG MASTERY SĄ NIEOSIĄGALNE przy dzisiejszej zawartości.** Z progu martwego funkcji nauczyciela wynika twardy sufit nauki per przeciwnik; **cała odradzalna fauna przestaje uczyć, zanim `P` sięgnie bramki drugiej rangi**, a jedyne stworzenie powyżej niej **nie odradza się** i jednym egzemplarzem nie daje ułamka potrzebnej praktyki. Trzecia i czwarta ranga są nieosiągalne **arytmetycznie**. Przeliczenie: `docs/proces/ekstrakcja_proficiency.md` §5. ⚠ **To nie usterka, tylko brak zawartości** wyceniony w istniejącym cenniku. Decyzja autora. |
| **OI-29** | ⛔ **Odbiór warstwy 2 nie był sprawdzony przez człowieka ANI RAZU.** Pięć pytań, których nie zmierzy skrypt, stoi w `docs/odlozone.md` §2 razem z częstościami per stworzenie. ⚠ **Ześlizg jest w części małych ataków nierozróżnialny liczbowo**, więc cue nie jest jego prezentacją — jest jego **jedynym nośnikiem**. |
| **OI-31** | ✅ **ZAMKNIĘTE 2026-10-09** — nagłówek `WeaponProficiency.ts` mówi dziś, że ładunki SĄ wdrożone, i wymienia je z nazwy. |

⚠ **Otwarty dług tej domeny, cztery pozycje** (przeniesione tu 2026-09-07
z usuniętego checkpointu biegłości): **pusty stan szarży przy przelocie**
(prezentacja), **ujemny bilans staminy przy blokowaniu bardzo lekkiego ciosu**
(balans), **kalibracja kierunku wróg → gracz** (czeka na playtest) oraz
**martwa gałąź górnej części krzywej**. ⚠ Żadna z nich nie jest usterką kodu —
wszystkie czekają na decyzję albo na rękę na gałce.

---

## Czego ten dokument nie rozstrzyga

- **Żadnej liczby.** Wartości stoją w konfigu; ten plik opisuje kształt i reguły.
- **Czy krzywa jest dobrze wystrojona** — to jest pytanie do playtestu (OI-29).
- **Ile `P` ma które stworzenie** — domena `creatures`.
- **Czym jest rodzina broni i skąd bierze cechę** — domena `weapons`.
- **Skąd biorą się punkty rozwoju i złoto** — `progression`, `economy`.
- **Biegłości i Mastery dla dwóch broni naraz ani dla broni dwuręcznej** —
  świadomie nieprojektowane (`docs/archetypy_walki.md`).

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **30 decyzji z mocą**, 8 rozjazdów i pomiar osiągalności rang (`OI-28`) | `docs/proces/ekstrakcja_proficiency.md` |
| pięć pytań, na które odpowie **wyłącznie playtest** (`OI-29`) | `docs/odlozone.md` §2 |
| dlaczego asymetria krytyka została zaakceptowana | `docs/konfiguracje_broni_checkpoint.md` §3 |
| dlaczego cecha rodziny jest deklaracją, nie polem | `docs/audyt_projektowy_fundamentow_2026-09-03.md` D5 |

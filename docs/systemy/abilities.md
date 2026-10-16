---
typ: STAN
domena: abilities
tytul: Umiejętności czynne — zdobycie, pasek, wykonanie
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:combat_regresja]
kotwice:
  - src/core/Abilities.ts
  - src/core/Skills.ts
  - src/core/AbilitySpec.ts
  - src/core/combat/PlayerAction.ts
  - GameConfig.ABILITIES
  - GameConfig.ABILITY_SLOTS
  - GameConfig.SKILLS
otwarte: [OI-27]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Umiejętności czynne — zdobycie, pasek, wykonanie

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak w tej grze działa
> umiejętność**: skąd się bierze, jak trafia na pasek, co ją wpuszcza,
> w jakiej postaci jest opisana i czego robić jej nie wolno.
>
> **Czym NIE jest.** ⛔ **Nie mówi, co robi ani jedna konkretna umiejętność** —
> to są dane. Nie opisuje mechanizmu zamachu, warstwy efektów ani biegłości;
> granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| zdobycie, pasek, cooldown, postać deklaracji, celowanie | **`abilities`** |
| mechanizm zamachu, geometria, łańcuch obrony, „nie na trupie" | `combat` |
| księgowość tego, co umiejętność zostawia po sobie | `effects` |
| `m(P)`, fuszerka jako mechanizm, ładunki rang | `proficiency` |
| ile kosztuje wysiłek i jak działa jego pula | `stamina` |
| zasięg i profil ciosu (⚠ **umiejętność nie ma własnego**) | `weapons`, `items` |
| czym jest tarcza i dlaczego bywa bronią | `shields` |
| skąd punkty rozwoju i złoto | `progression`, `economy` |
| pasek, podgląd rysowany, dźwięk | `presentation` |

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `abilities` **bierze** | `progression`, `economy` | poziom, punkty rozwoju, złoto |
| `abilities` **bierze** | `combat` | mechanizm zamachu i geometrię kształtów |
| `abilities` **bierze** | `weapons`, `items` | zamrożony profil ciosu — **w tym zasięg** |
| `abilities` **bierze** | `shields` | jedyną bramkę sprzętową w całym zestawie |
| `abilities` **daje** | `effects` | specyfikację efektu (jeden z trzech producentów) |
| `abilities` **daje** | `creatures` | ogłuszenie — jedyną twardą kontrolę w grze |
| `abilities` **daje** | `save` | **układ paska**; ⛔ cooldowny świadomie NIE |

---

## 1. Zdobycie i pasek

### 1.1 Dwie bramki, obie konieczne

**Poziom** mówi „jesteś gotowy", **trener** mówi „ktoś ci to pokazał". Zdjęcie
którejkolwiek było rozważone i odrzucone.

⚠ **Brak nauczyciela znaczy „nie wymaga nauki", nie „niedostępna na zawsze".**
Umiejętność bez pary u trenera jest odblokowana samym poziomem — inaczej
dodanie nowej dawałoby przycisk, którego nie da się zdobyć, **i nic by tego nie
zgłosiło**.

⚠ **Nauka pobiera OBA koszty i sprawdza OBA przed pobraniem któregokolwiek.**
Zabranie złota i niedanie umiejętności jest gorsze niż odmowa. (Ta sama reguła
co przy rangach i przy zakładaniu sprzętu.)

### 1.2 Umiejętności jest WIĘCEJ niż slotów — i to jest treść

⚠⚠ **Pasek mieści `ABILITY_SLOTS` (6 od 2026-10-12), a nauczyć się można wszystkich.** Wybór, co
nosić, jest decyzją gracza, **nie ograniczeniem do obejścia**.

⚠ **Świeżo odblokowana umiejętność ląduje na pierwszym WOLNYM slocie** — i to
przy każdym sposobie zdobycia (nauka, awans, wczytanie), bo wszystkie trzy
przechodzą przez te same dwa zdarzenia. ⛔ **Nie rusza tego, co gracz już
ułożył**: pełny pasek zostaje bez zmian, a nowa umiejętność czeka w panelu.

⚠ **Ta sama umiejętność nie może leżeć na dwóch slotach** — przypisanie jej
tam, gdzie już leży, **przenosi**, a zajęty slot **zamienia się miejscami**.
Dwa przyciski dzielące jeden cooldown to slot wyrzucony bez ostrzeżenia.

### 1.3 Co przeżywa, a co nie

| rzecz | zapis | restart sceny (portal, śmierć) |
|---|---|---|
| **układ paska** | ✅ tak — decyzja gracza | ✅ zostaje |
| **cooldowny** | ⛔ **nie** | ⛔ zerowane |
| samo odblokowanie | ⛔ nie trzymane wcale | wynika z poziomu i nauki |

⚠ **Cooldowny nie przeżywają wczytania świadomie** — bankowanie ich pozwalałoby
pominąć długi cooldown przez wyjście i wejście. ⚠ **Odtworzenie układu z zapisu
nie jest decyzją gracza**, więc nie wywołuje zapisu — inaczej wczytywanie
zapisywałoby w trakcie wczytywania.

⚠ **Nieznane `id` w zapisie leci w pusty slot, a nie wywala wczytywania.**

---

## 2. Cykl użycia

```
gotowość (odblokowana + brak cooldownu)?   → cisza, jeśli nie
[dźwięk użycia]
wykonanie archetypu — z własnymi odmowami
KOSZT WYSIŁKU i COOLDOWN — na samym KOŃCU
```

⚠⚠ **Koszt i cooldown płacone są PO wszystkich odmowach.** Nieudana akcja
**nie pali ani cooldownu, ani wysiłku**. To jest ta sama reguła, którą walka
stosuje do ciosu poza zasięgiem („nic się nie dzieje" ≠ pudło).

⚠ **Cooldown uzbraja ten, kto akcję faktycznie wykonał** — odmowa nigdy go nie
zapala.

⚠ **Jeden wyjątek, jawny i uzasadniony:** unik płaci wysiłek **wcześniej
i osobno**, bo jako jedyny mnoży się przez obciążenie. ⚠ **Dlatego świadomie
nie ma kosztu w danych** — żeby nie zapłacić dwa razy.

---

## 3. Cooldown

⚠ **`Abilities` jest JEDYNYM właścicielem cooldownu**: trzyma go, zasila pasek,
obsługuje zwrot i zeruje przy śmierci. Deklaracja akcji cooldownu **ani nie
odlicza, ani nie deklaruje**.

⚠ **Zwrot skraca TRWAJĄCY cooldown o ułamek jego PEŁNEJ długości**, nie
pozostałej. Od pozostałej wynik zależałby od tego, ile trwa zamach — czyli
wydłużenie animacji po cichu zmieniałoby balans, w miejscu, w którym nikt by go
nie szukał.

⚠ **Zwrot nie potrafi cooldownu ZAŁOŻYĆ.** Wołanie na gotowej umiejętności jest
niczym; nagroda za trafienie nie ma prawa niczego uzbroić.

---

## 4. Cztery archetypy wykonania

⚠⚠ **Model wykonania jest NIEJEDNORODNY i to jest treść, nie dług.**

| archetyp | czym się rozstrzyga |
|---|---|
| **cios zatwierdzony, rozstrzygany później** | kończy się wpisem do slotu zamachu |
| **napęd ciała** | lot; ⚠ **nie jest ciosem** — bez zapowiedzi, bez celu w chwili startu, bez rozstrzygnięcia trafienia |
| **natychmiastowe AoE** | rozstrzyga się w tej samej klatce, wielocelowo, **świadomie bez ukorzenienia** |
| **efekt na sobie / obrona ciałem** | nie celuje w nikogo |

⚠⚠ **KRYTERIUM PRZYNALEŻNOŚCI do deklaratywnego rejestru jest jednoznaczne:**
> *akcja należy do rejestru wtedy i tylko wtedy, gdy jej część bojowa kończy się
> wpisem do slotu zamachu.*

⛔ **Rejestr nie jest miejscem na „wszystkie umiejętności".** Wpis powstaje
**razem ze swoim konsumentem**; dopisanie deklaracji, której nic nie wykonuje,
tworzy martwy slot.

⚠ **Jedna umiejętność łamie trzy niezmienniki naraz** (kasuje zamach zamiast go
składać, płaci wysiłek poza wspólnym ogonem, odmawia PO starcie) — i dlatego
**nie ma i nie ma mieć deklaracji**. Sześć z sześciu jej pól byłoby martwych.

---

## 5. Deklaracja akcji

Akcja o kształcie zamachu jest **danymi**: adres, czasy, mnożnik, polityka
ukorzenienia, czy może spudłować wykonaniem, czy zużywa broń, oraz **lista
konsekwencji trafienia**.

⚠⚠ **Ani jednej nowej liczby.** Każda wartość deklaracji jest **odczytana**
z danych umiejętności, nie przepisana. Przepisana liczba zawsze się rozjeżdża.

⚠ **Pola są WYMAGANE, nie opcjonalne** — „ta akcja świadomie nie pudłuje / nie
zużywa broni" i „ktoś nie dopisał pola" nie mogą wyglądać w źródle identycznie.

⚠ **Ukorzenienie jest POLITYKĄ, nie liczbą do dopisania**: albo własny rytm
akcji, albo tempo broni. ⭐ Powstało dlatego, że jedna akcja **nie miała
w danych** czasu odzyskania — więc kontrakt dostał politykę **opisującą
istniejące zachowanie**, zamiast dopisywać jej liczbę.

⚠ **Konsekwencje trafienia to LISTA wariantów po rodzaju**, nie worek pól
opcjonalnych. Jedna akcja potrzebuje dwóch naraz, wyzwalacz jest jeden, więc
lista jest jedna; adresata niesie nazwa wariantu.
⚠ **Pusta lista znaczy „świadomie nic"** i dlatego pole jest wymagane — pustej
listy nie da się pominąć, trzeba ją napisać.
⛔ **Nowy wariant dokłada się tylko wtedy, gdy wymaga tego rzeczywista
mechanika** — nigdy dla symetrii, zawsze razem ze swoim konsumentem.

⚠ **Deklaracja NIE wykonuje nagród** i nie wie, czym jest ogłuszenie ani zwrot.
Wykonuje je rozstrzygnięcie zamachu, pod jedną bramką „cokolwiek trafiło".

---

## 6. Celowanie

Dwa archetypy, **różnica w danych, nie w gałęziach po nazwie**:

| kształt | co wybiera celowanie |
|---|---|
| **kierunkowy łuk** | KIERUNEK kształtu |
| **wskazanie celu** | PRZECIWNIKA |

### 6.1 Intencja domyślna: „zrób to mojemu celowi" (2026-09-11)

⚠⚠ **Sesja celowania ma DWA stany, nie jeden.** Dopóki palec nie minął progu
gestu, sesja opisuje **intencję domyślną** — zaznaczony cel. Po przekroczeniu
progu opisuje to, co wskazuje gracz, i od tej chwili **ostatnia informacja od
gracza wygrywa**.

```
tapnięcie   →  „użyj tego na moim celu"       (oś celowania biegnie DO celu)
przeciągnięcie → „nie temu — temu"            (oś analogowa, cel z osi)
```

⚠⚠ **Podgląd MUSI odpowiadać na to samo pytanie, na które odpowie
zatwierdzenie — a jedno źródło KSZTAŁTU tego nie gwarantuje.** To jest lekcja
osobna od §6 i droższa: kształt był wspólny (`coversTarget`), ale podgląd pytał
„kto stoi najbliżej osi zwrotu", a tapnięcie rozstrzygało **blokadą celu**.
Dwie różne odpowiedzi na jedno naciśnięcie. Zmierzone przed poprawką:
**1284 z 1944 legalnych położeń celu** przechodziło przez podgląd — czyli
**34% było dla niego niewidzialne**, i to przy najlepszym z czterech zwrotów
postaci. Na osi intencji przechodzi 1944/1944, z odchyleniem dokładnie zerowym.

⚠ **Zawężamy KANDYDATÓW, nie omijamy selekcji.** Legalność dalej rozstrzyga ten
sam predykat i ta sama miara pasma, więc cel za daleko, za blisko albo za
przeszkodą **wypada z podglądu dokładnie wtedy, kiedy odmówi mu wykonanie**;
pusty podgląd jest wtedy komunikatem, nie brakiem.

⚠ **Łuku kierunkowego zawężenie NIE dotyczy** — trafia wszystko w klinie, więc
ukrycie reszty trafionych odwróciłoby naprawianą wadę. Tam intencja domyślna
zmienia wyłącznie **OŚ** klina.

⚠ **Intencja jest przeliczana co klatkę**, dopóki gracz nie przejął celowania:
w trakcie gestu chodzi cel, chodzi gracz i **może się obrócić drugim palcem**,
więc zamrożona intencja pokazywałaby cel, którego zatwierdzenie odmówi.

### 6.2 Bramka zwrotu: macha ↔ przenosi ciało

⚠⚠ **Reguła istniała w kodzie od dawna i nie była nazwana — stąd wrażenie
siedmiu różnych zachowań:**

> **Akcja, która MACHA ORĘŻEM, jest bramkowana zwrotem. Akcja, która PRZENOSI
> CIAŁO, nie jest — bo obraca ją sam bieg.**

Dlatego intencja domyślna celuje w cel za plecami **tylko** przy akcjach
przenoszących ciało; przy pozostałych oś zostaje na zwrocie postaci, podgląd
jest pusty i pada odmowa. ⛔ **To nie jest obejście bramki** — łuk kierunkowy
obraca się do celu wyłącznie w przedniej półkuli, czyli w tej samej, którą
pyta autoatak.

⛔ **Automatyczne obracanie postaci do celu tu nie wraca** (usunięte
2026-08-23): obraca się **oś celowania**, nigdy ciało. Zwrot zostaje własnością
drążka *(`input` §9)*.

⚠⚠ **Podgląd i rozstrzygnięcie czytają TEN SAM kształt.** Osobny „stożek UI"
ze skopiowanymi liczbami rozjechałby się przy pierwszej zmianie i **nikt by tego
nie zobaczył** — podgląd kłamałby cicho, a gracz podjąłby na jego podstawie
decyzję. **To jest jedyny powód, dla którego ta warstwa istnieje.**

⚠ **Wspólna warstwa celowania nie zna ani jednej nazwy umiejętności.**
Rozgałęzienie po nazwie jest dozwolone **w jednym miejscu** — w funkcji, której
to jest cała praca.

⚠ **Umiejętność kierunkowa z podglądem NIE MOŻE mieć furtki zwarcia** —
przeciwnik stojący blisko obrywałby **poza narysowanym klinem**.

⚠ **Wskazanie celu jest WALIDOWANE ponownie przy zatwierdzeniu**, nie szukane od
nowa — i ⛔ **nie podstawia się nikogo innego**, gdy wskazany przestał być
legalny.

---

## 7. Czego umiejętność NIE robi

Reguły należące do sąsiadów, których umiejętność **nie ma prawa złamać**:

- ⚠ **Żadna umiejętność nie pudłuje wykonaniem.** Powód jest ekonomiczny:
  kosztuje cooldown i wysiłek, a fuszerka kasowałaby cały ten wydatek rzutem,
  którego gracz nie kontroluje. *(mechanizm: `proficiency`)*
- ⚠⚠ **Umiejętność nie ma własnego zasięgu — bierze go z broni.** Decyzja
  **odwrócona przez rozgrywkę**: własny, krótszy zasięg okazał się nie kosztem,
  tylko martwym pasmem, w którym autoatak trafia, a umiejętność odmawia.
  **Reguła: jeśli trafiasz kogoś autoatakiem, trafiasz go też umiejętnością.**
- ⚠ **Redukcja kosztu z rangi NIE dotyczy umiejętności** — tylko autoataku.
  *(`proficiency`)*
- ⚠ **Bramka sprzętowa jest JEDNA w całym zestawie** i czyta zdolność
  przedmiotu, nie jego nazwę. ⛔ Druga powstaje dopiero razem z akcją, która
  naprawdę wymaga konkretnego oręża. *(`shields`)*
- ⚠ **Skutek trafienia obowiązuje tylko wtedy, gdy cios NIE ZABIŁ.** *(`combat`)*
- ⚠ **Co umiejętność zostawia na celu, liczy warstwa efektów** — akcja wiezie
  **umowę** (ułamek), nie gotową liczbę, bo ta zależy od rzutu i wykonania
  **tego** ciosu. *(`effects`)*

---

## 8. Niezmienniki

- **N-71** — **dwie bramki zdobycia**; brak nauczyciela = „nie wymaga nauki".
- **N-72** — **oba koszty nauki sprawdzone przed pobraniem któregokolwiek**.
- **N-73** — **umiejętności więcej niż slotów**; wybór jest treścią (§1.2).
- **N-74** — **jedna umiejętność, jeden slot**; przypisanie przenosi, nie kopiuje.
- **N-75** — **koszt i cooldown na KOŃCU**, po wszystkich odmowach (§2).
- **N-76** — **cooldown ma jednego właściciela**; deklaracja go nie zna (§3).
- **N-77** — **zwrot liczy się od pełnej długości i nie potrafi założyć** (§3).
- **N-78** — **kryterium przynależności do rejestru** (§4); wpis powstaje razem
  ze swoim konsumentem.
- **N-79** — **ani jednej nowej liczby w deklaracji**; wszystko odczytane (§5).
- **N-80** — **pola deklaracji są wymagane**, nigdy domyślne (§5).
- **N-81** — **jedno źródło kształtu dla podglądu i zatwierdzenia** (§6).
- **N-84** — **tapnięcie celuje w INTENCJĘ DOMYŚLNĄ** (zaznaczony cel), a
  podgląd od pierwszej klatki pokazuje **to, co zrobi puszczenie palca** — także
  wtedy, gdy odpowiedzią jest pustka (§6.1).
- **N-85** — **bramka zwrotu obowiązuje akcje machające, nie przenoszące
  ciało**; obraca się oś celowania, **nigdy** postać (§6.2).
- **N-82** — **układ paska przeżywa, cooldowny nie** (§1.3).
- **N-83** — **umiejętność nie ma własnego zasięgu** (§7).

---

## 9. Checklista: nowa umiejętność

1. **Archetyp** (§4). ⚠ Deklarację dostaje **wyłącznie** akcja kończąca się
   wpisem do slotu zamachu (N-78).
2. **Dwie bramki**: poziom w danych + czy uczy jej trener (N-71).
3. **Celowanie**: który z dwóch kształtów; ⚠ kierunkowy z podglądem **bez
   furtki zwarcia** (§6).
4. **Pola wymagane** — rozstrzygnij jawnie fuszerkę i zużycie broni (N-80).
5. **Konsekwencje trafienia** jako lista; ⛔ nowy wariant tylko z konsumentem.
6. ⚠ **Nie dopisuj jej własnego zasięgu** (N-83) ani drugiej bramki sprzętowej.
7. Sprawdź, że odmowa **nic nie kosztuje** (N-75).
8. Bramki: `npx tsc --noEmit` · `npm run build` ·
   `node tools/combat_regresja.mjs` (grupy §R6a, §S6, §T7, §V).

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| dwie bramki odblokowania | ✅ | ✅ | `kod:2026-09-06` |
| brak nauczyciela = brak wymogu nauki | ✅ | ✅ | `kod:2026-09-06` |
| oba koszty nauki przed pobraniem | ✅ | ✅ | `kod:2026-09-06` |
| sloty, automatyczne dokładanie, przenoszenie | ✅ | ✅ | `kod:2026-09-06` |
| układ paska w zapisie, cooldowny poza | ✅ | ✅ | `kod:2026-09-06` |
| koszt i cooldown po odmowach | ✅ | ✅ | `kod:2026-09-06` |
| wyjątek uniku (koszt osobno, przez obciążenie) | ✅ | ✅ | `przymiar:stamina_weryfikacja` |
| zwrot cooldownu od pełnej długości | ✅ | ✅ | `przymiar:combat_regresja` §S6 |
| deklaratywny rejestr + kryterium przynależności | ✅ | ✅ | `przymiar:combat_regresja` §R6a/§T7 |
| zgodność deklaracji z danymi (zero nowych liczb) | ✅ | ✅ | `przymiar:combat_regresja` |
| lista konsekwencji trafienia | ✅ | ✅ | `przymiar:combat_regresja` §V |
| dwa archetypy celowania, jedno źródło kształtu | ✅ | ✅ | `przymiar:combat_regresja` |
| **intencja domyślna: podgląd = wynik tapnięcia** | ✅ | ✅ *(opisane po raz pierwszy)* | ✅ `1944/1944` *(uprząż doraźna)*; ⚠ obrót klina w tłumie — OI-89 |
| **bramka zwrotu: macha ↔ przenosi ciało** | ✅ | ✅ *(nazwane po raz pierwszy)* | `kod:2026-09-11` |
| język podglądu spójny między zdolnościami o tej samej mechanice | ⚙ **dwa języki** | ✅ | ❌ **decyzja autora** — OI-91 |
| żadna umiejętność nie pudłuje wykonaniem | ✅ | ✅ | `kod:2026-09-06` |
| zasięg z broni | ✅ | ✅ | `kod:2026-09-06` |
| **zestawienie danych umiejętności** | ❌ | ⚠ | ❌ **brak generatora** — OI-38 |
| odbiór celowania przez człowieka | ✅ | ⚠ | autor gra na bieżąco — `OI-39` zamknięte 2026-10-11 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-27** | ⚠ **Ogłuszenie stoi poza warstwą efektów** — jest osobnym polem na stworzeniu, a umiejętność tylko o nie prosi. ⛔ Wejście do warstwy jest **decyzją projektową** (ogłuszenie kasuje akcję, a nie tyka) i **nie jest rozstrzygane tutaj**. |
| **OI-38** | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/katalog_umiejetnosci.mjs --zapisz` → `docs/umiejetnosci_katalog.md` (parametry, nauka, poziomy odblokowania, siatka ról wyprowadzona z pól danych). |

---

## Czego ten dokument nie rozstrzyga

- **Co robi którakolwiek konkretna umiejętność** ani żadnej jej liczby.
- **Balansu** — mnożników, cooldownów, kosztów, progów odblokowania.
- **Czy sześć slotów to właściwa liczba** (od 2026-10-12 sześć — miejsce dały
  przyciski typu ataku zwinięte do jednego; dalszy krok: pasek per zestaw
  broni, `docs/ui_mobile_research.md` D3).
- **Mechanizmu zamachu, geometrii i łańcucha obrony** — `combat`.
- **Księgowości efektów** — `effects`.
- **Czy ogłuszenie ma wejść do warstwy efektów** — `OI-27`.
- **Umiejętności biernych ani drzewka talentów** — nie istnieją.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **28 decyzji z mocą** i wynik testu SYSTEM ≠ CONTENT | `docs/proces/ekstrakcja_abilities.md` |
| dlaczego zwrot cooldownu, a **nie** auto-podchodzenie do celu | `docs/odlozone.md` §5 |
| kierunek przebudowy Szarży na model dzika (zero kodu) | `docs/pomysly.md` |

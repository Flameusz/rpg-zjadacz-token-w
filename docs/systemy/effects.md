---
typ: STAN
domena: effects
tytul: Efekty czasowe — księgowość tego, co trwa
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:effects_weryfikacja]
kotwice:
  - src/core/combat/StatusEffects.ts
  - src/core/combat/EffectKinds.ts
  - src/core/combat/Contracts.ts
  - tools/effects_weryfikacja.mjs
otwarte: [OI-27, OI-36]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Efekty czasowe — księgowość tego, co trwa

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak w tej grze działa
> cokolwiek, co trwa w czasie**: co składa się na efekt, co się dzieje przy
> ponownym nałożeniu, kiedy pada tik, kiedy efekt znika i kto o tym decyduje.
>
> **Czym NIE jest.** ⛔ **Nie mówi, co robi ani jeden konkretny efekt** — to
> należy do domen, które je nakładają (§0). Nie opisuje paska efektów.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| ile efekt jeszcze trwa, ile ma stosów, kiedy tik, kiedy koniec | **`effects`** |
| **co** efekt robi — obrażenia, spowolnienie, leczenie, premia | domena, która go nakłada |
| jad i spowolnienie siecią | `creatures` |
| krwawienie i premia z Okrzyku | `abilities` |
| leczenie posiłkiem | `items` |
| dlaczego tik omija pancerz | `armor` |
| ogłuszenie | `abilities` / `combat` — ⚠ **dziś POZA tą warstwą** (`OI-27`) |
| pasek efektów i znacznik nad głową | `presentation` |

⚠⚠ **To jest domena o KSIĘGOWOŚCI, nie o skutkach.** Jeżeli piszesz tu zdanie
zaczynające się od „ten efekt zabiera…", jesteś w złym dokumencie.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `effects` **przyjmuje od** | `creatures`, `abilities`, `items` | gotową specyfikację efektu — **trzej niezależni producenci** |
| `effects` **pyta** | nosiciela | czy odporny, czy efekt ma teraz stać |
| `effects` **woła** | nosiciela | „wykonaj tik", „stan się zmienił" |
| `effects` **daje** | `presentation` | żywą listę do narysowania (pośrednio, przez nosiciela) |
| `effects` **nie zna** | nikogo | ⛔ zero importów encji, sceny, silnika i zdarzeń |

---

## 1. Reguła nadrzędna: warstwa ↔ nosiciel

```
WARSTWA (czysta)   ile jeszcze trwa · ile stosów · kiedy tik · kiedy koniec
NOSICIEL           CO efekt robi — obrażenia, spowolnienie, leczenie, premia
```

⚠⚠ **Warstwa NIE INTERPRETUJE ładunku.** „2 obrażenia na stos" i „ruch ×0,55"
są liczbami efektu, nie księgowości — czyta je nosiciel. **Skutek praktyczny:
nowy efekt nie wymaga ani jednej linijki w warstwie.**

⚠ **To zostało DOWIEDZIONE, nie zadeklarowane.** Drugi nosiciel doszedł
2026-09-04 i warstwa **nie dostała ani jednej linijki kodu**. To jest jedyny
dowód, jaki „minimum zamiast interfejsu walczącego" mogło dostać.

⚠ **Warstwa jest CZYSTA** — bez silnika, encji, sceny i zdarzeń — i jest to
egzekwowane przez strażnika w przymiarze. Stąd bierze się jedyny powód, dla
którego jej przymiar cokolwiek dowodzi.

⚠ **Nosiciel odpowiada na cztery pytania i tylko na cztery**: wykonaj tik ·
stan się zmienił · czy odporny (opcjonalne) · czy teraz stoi (opcjonalne).
⛔ **Nie dokładaj tu metod „bo się przydadzą"** — drugi nosiciel potrzebował
dokładnie tych czterech.

---

## 2. Czym jest efekt

| pole | rola |
|---|---|
| `id` | **klucz TOŻSAMOŚCI** — dwa nałożenia z tym samym `id` to ten sam efekt |
| `durationMs` | ile trwa; ⚠ **zero albo mniej = nałożenie ODRZUCONE** |
| `tickMs` | odstęp między tikami; **brak = efekt bez tików**, czysty modyfikator |
| `maxStacks` | sufit stosów; brak = jeden |
| `payload` | **wartości POCZĄTKOWE** liczb efektu |
| `tags` | kategorie do wyszukiwania; ⛔ **warstwa nie nadaje im znaczenia** |
| `debuff` | wyłącznie prezentacja |
| `dispellable` | czy rozproszenie ma prawo go zdjąć |
| `detail`, `name`, `iconKey` | opis dla prezentacji; ⛔ **warstwa nigdy tego nie woła** |

⚠ **Żywe liczby są ODDZIELNE od `payload`** — bo część efektów **się zużywa**
(posiłek ma „ile HP zostało do oddania"). Warstwa tych liczb nie interpretuje;
pilnuje wyłącznie, żeby **ginęły razem z efektem**.

⚠ **Tagi są zwykłymi napisami, nie zawężonym typem** — i to jest świadome.
Zawężenie kazałoby czystej księgowości zaimportować listę konkretnych efektów,
czyli poznać to, czego z założenia nie zna.

---

## 3. Cykl życia

### 3.1 Nałożenie **jest** odświeżeniem

Jedno wejście robi obie rzeczy, po `id`:

| co | jak |
|---|---|
| nie tworzy drugiego efektu | jeden wpis pod `id` |
| odświeża czas | czas wraca do pełnego |
| dokłada stos do sufitu | `min(stosy + 1, sufit)` |
| **nie sumuje liczb** | ⚠ żywe liczby są **ZASTĘPOWANE** — drugi posiłek zastępuje niedokończony |

⚠⚠ **Odświeżenie NIE ZERUJE zegara tików.** Zerowanie sprawiłoby, że dokładanie
stosów **odracza obrażenia** — czyli szybsze trucie truje wolniej.

### 3.2 Wygaśnięcie, zdjęcie, rozproszenie, wyczyszczenie

- **wygaśnięcie** — czas doszedł do zera podczas przewijania;
- **zdjęcie** po `id` — sprzątanie nosiciela; ⚠ **działa także na efekt
  niedyspelowalny**, bo to nie jest mechanika rozpraszania;
- **rozproszenie** — zdejmuje **wyłącznie** to, co dyspelowalne, wg predykatu;
- **wyczyszczenie** — wszystko naraz (śmierć, odrodzenie, nowa gra), **bez
  ogłoszenia**, bo woła to nosiciel w chwili, gdy i tak przebudowuje
  prezentację.

---

## 4. Czas

⚠⚠ **Czas wchodzi jako PRZYROST, nie jako „teraz".** Warstwa nie ma prawa znać
zegara sceny — dzięki temu test przewija czas bez podmieniania czegokolwiek,
a przeniesienie efektu między scenami **nie zależy od monotoniczności zegara
silnika**.

⚠⚠ **Kolejność jest treścią: najpierw wygaśnięcie, potem tik.** Tik lądujący
**równo** z końcem trwania **nie pada**. ⛔ Nie „naprawiać" tego zamianą
kolejności — zmieniłoby to zachowanie każdego efektu tikającego naraz.
**Kto chce jednego tiku więcej, podnosi czas trwania i wie, co robi.**

⚠ **Nadrabianie tików jest pętlą, nie pojedynczym sprawdzeniem.** Przy zacięciu
klatki przyrost potrafi objąć dwa tiki, a **zgubiony tik to zgubione obrażenia**.

⚠ **Efekt wstrzymany nie odlicza i nie tika.** Warunek należy do **nosiciela** —
tylko on wie, co znaczy „w walce".

⚠ **Przewijanie pracuje na KOPII listy**, bo tik potrafi zabić nosiciela
i wyczyścić cały zbiór w trakcie.

---

## 5. Nosiciele

**Obaj: gracz i stworzenie.** Jeden zbiór na nosiciela — ⛔ **nigdy singleton
modułu**, bo drugi nosiciel to normalny przypadek, nie wyjątek.

⚠ **Nosiciele mają RÓŻNE kanały prezentacji i to jest zamierzone**: gracz ma
pasek, stworzenie — pasek HP i znacznik nad głową. ⛔ **Trzeciego kanału nie ma
i nie ma powstać.**

⚠ **Cała księgowość ikony po stronie stworzenia siedzi w JEDNEJ metodzie
nosiciela** — bo warstwa woła ją przy nałożeniu, odświeżeniu, wygaśnięciu
i zdjęciu. Dzięki temu ikona gaśnie **bez ani jednego licznika czasu** po tamtej
stronie.

---

## 6. Rodzaje efektów jako kontrakt liczb

Rodzaj efektu deklaruje **komplet kluczy** swojego ładunku. Producent
i konsument odnoszą się do tej samej deklaracji, więc **rozjechanie się nazwy
klucza jest błędem kompilacji, a nie cichym zerem**.

⚠ **Wartości domyślne muszą być NEUTRALNE** — takie, przy których efekt niczego
nie robi. Służą dwóm rzeczom naraz: nazywają komplet kluczy i są odczytem
awaryjnym.

⚠ **Nosiciel nie musi znać `id` efektu, którego szuka** — pyta o **rodzaj**.
Dzięki temu druga zdolność zadająca ten sam rodzaj rany działa bez zmiany ani
jednej linijki u konsumenta.

⛔ **Zero pól „pod przyszłe warianty".** Nowy klucz dokłada się **razem ze swoim
kodem**, nie wcześniej.

---

## 7. Co NIE jest efektem czasowym

⚠⚠ **W kodzie są trzy różne rzeczy o mylących nazwach. To jest najłatwiejsza
pomyłka w tej domenie.**

| rzecz | czym jest naprawdę | czyje |
|---|---|---|
| **impulsy ruchu** (odrzut, wypad, odskok) | opis RUCHU jako dane, po autorytatywnej stronie podziału | `combat` |
| **lista dla paska** | migawka dla HUD-u gracza, **jeden pisarz**, jawnie „prezentacja, nie mechanika" | `presentation` |
| **ogłuszenie** | osobne pole na stworzeniu, **poza tą warstwą** | ⚠ `OI-27` |

⚠ **Ogłuszenie było w pierwotnym zakresie decyzji, która tę warstwę powołała**
(„DoT, spowolnienia, **ogłuszenia**, buffy") i jako jedyne nie weszło. To jest
**niedostarczona pozycja zakresu**, nie nieoczywistość taksonomiczna.

---

## 8. Trwałość

| przejście | czy efekty przeżywają |
|---|---|
| **portal / zmiana mapy** | ✅ tak — nosiciel przenosi je jawnie |
| **zapis i wczytanie** | ❌ **nie** — efektów nie ma w zapisie |

⚠ **Brak w zapisie jest spójny z cooldownami umiejętności**: stan chwili nie
przeżywa wczytania. ⛔ Nie dodawać go „dla porządku" — to jest decyzja o tym
samym kształcie co tam.

---

## 9. Niezmienniki

- **N-59** — **warstwa nie interpretuje ładunku** (§1). Nowy efekt nie dokłada
  do niej ani jednej linijki.
- **N-60** — **warstwa jest CZYSTA**: zero silnika, encji, sceny i zdarzeń.
- **N-61** — **nosiciel odpowiada na cztery pytania i tylko na cztery** (§1).
- **N-62** — **`id` jest tożsamością**: nałożenie tego samego `id` odświeża,
  nigdy nie tworzy drugiego efektu (§3.1).
- **N-63** — **żywe liczby są zastępowane, nie sumowane** (§3.1).
- **N-64** — **odświeżenie nie zeruje zegara tików** (§3.1).
- **N-65** — **najpierw wygaśnięcie, potem tik** (§4). Tik równy z końcem nie pada.
- **N-66** — **czas wchodzi jako przyrost, nigdy jako „teraz"** (§4).
- **N-67** — **jeden zbiór na nosiciela, nigdy singleton** (§5).
- **N-68** — **rodzaj efektu deklaruje komplet kluczy**; wartości domyślne są
  neutralne (§6).
- **N-69** — **warunek wstrzymania należy do nosiciela**, nie do warstwy (§4).
- **N-70** — ⛔ **żaden konkretny efekt nie mieszka w warstwie** (§0).

---

## 10. Checklista: nowy efekt

1. **Czy to naprawdę efekt czasowy?** Sprawdź §7 — impuls ruchu i wpis na pasku
   nim nie są.
2. Zadeklaruj **rodzaj** z kompletem kluczy i **neutralnymi** wartościami
   domyślnymi (N-68).
3. Zdecyduj: tika czy jest czystym modyfikatorem · ile stosów · czy dyspelowalny.
4. ⚠ **Licz tiki wg N-65** — przy `czas / odstęp` ostatni tik **nie pada**.
5. Nałożenie napisz jako **odświeżenie** i sprawdź, czego ono NIE robi (§3.1).
6. Skutek napisz **u nosiciela**, nie w warstwie (N-59, N-70).
7. Jeśli efekt ma stać w jakimś stanie gry — warunek u nosiciela (N-69).
8. Bramki: `npx tsc --noEmit` · `node tools/effects_weryfikacja.mjs` ·
   `node tools/combat_regresja.mjs` (strażnik czystości).

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| podział warstwa ↔ nosiciel | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| czystość warstwy | ✅ | ✅ | `przymiar:combat_regresja` |
| nałożenie = odświeżenie, cztery własności | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| stosy i sufit | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| kolejność wygaśnięcie → tik | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| nadrabianie tików przy zacięciu klatki | ✅ | ✅ | `kod:2026-09-06` |
| wstrzymanie efektu przez nosiciela | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| dwaj nosiciele, jeden zbiór na nosiciela | ✅ | ✅ | `kod:2026-09-06` |
| rodzaj jako kontrakt liczb | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| przeniesienie przez portal | ✅ | ✅ | `kod:2026-09-06` |
| brak w zapisie | ✅ *(świadomie)* | ✅ | `kod:2026-09-06` |
| odporność i rozproszenie | ⚠ **zaczep bez konsumenta** | ✅ | `przymiar:effects_weryfikacja` — OI-36 |
| atrybucja sprawcy | ⚠ **zapisywana, nieczytana** | ✅ | — OI-36 |
| ogłuszenie w warstwie | ❌ | ✅ | — OI-27 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-27** | ⚠ **Ogłuszenie stoi POZA warstwą** — jest osobnym polem na stworzeniu, mimo że decyzja powołująca tę warstwę wymieniała je w zakresie. ⚠ Nie jest to samo co DoT: ogłuszenie **kasuje akcję**, a nie tyka — więc wejście do warstwy jest **decyzją projektową**, nie porządkową. ⛔ Nie rozstrzygać przy okazji. |
| **OI-36** | ⚠⚠ **Trzy zaczepy bez konsumenta, a przymiar świeci na nie zielono.** Odporność i rozproszenie **nie mają w grze ani jednego wywołania**, atrybucja sprawcy jest zapisywana i nieczytana — a wszystkie trzy są sprawdzane przez uprząż. **To jest kolizja dwóch własnych reguł projektu:** jedna mówi „nie deklaruj mechaniki, której nic nie wypełnia", druga — że doklejenie atrybucji później jest zmianą każdego wołającego. ⚠ Ten sam projekt **usunął** analogiczne martwe kształty geometrii z uzasadnieniem „uprząż świeciłaby na zielono, testując funkcje, których gra nie używa". **Wymaga jednego zdania autora: jaka jest polityka wobec zaczepów pod przymiarem.** |

---

## Czego ten dokument nie rozstrzyga

- **Co robi którykolwiek konkretny efekt** — domeny z §0.
- **Żadnej liczby**: czasów, obrażeń na tik, stosów, mnożników.
- **Czy tik ma liczyć pancerz** — reguła należy do `armor`, a wyjątek dla
  efektów jest tam opisany.
- **Jak wygląda pasek i znacznik** — `presentation`.
- **Czy ogłuszenie ma wejść do warstwy** — `OI-27`.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **20 decyzji z mocą** i kolizja dwóch własnych reguł projektu (`OI-36`) | `docs/proces/ekstrakcja_effects.md` |
| dlaczego `effects` jest osobną domeną; co odrzucono | `docs/decyzje/2026-09-06-effects-jako-domena.md` |
| dlaczego warstwa w ogóle powstała i co zastąpiła | `docs/audyt_projektowy_fundamentow_2026-09-03.md` D3 |

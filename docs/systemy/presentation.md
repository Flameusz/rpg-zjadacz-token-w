---
typ: STAN
domena: presentation
tytul: Prezentacja — cue, kanał, granica symulacji
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:combat_regresja]
kotwice:
  - src/core/CombatCues.ts
  - src/core/CombatFx.ts
  - src/core/HitFlash.ts
  - src/core/Fx.ts
  - src/core/theme.ts
  - src/ui/AimPreview.ts
  - GameConfig.COMBAT_FEEDBACK.hitFlashMs
  - GameConfig.COMBAT_FEEDBACK.targetMarker
  - GameConfig.UI_SCALE.designShortAxis
otwarte: [OI-70, OI-71, OI-72, OI-92]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-16
---

# Prezentacja — cue, kanał, granica symulacji

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak gra pokazuje, że coś
> się stało**: czym jest cue, kto decyduje co zagrać, kto to wykonuje i gdzie
> przebiega granica, której prezentacji nie wolno przekroczyć.
>
> **Czym NIE jest.** ⛔ **Nie opisuje ani jednego efektu, napisu czy koloru** —
> to jest zawartość. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| **jak** zdarzenie zostaje pokazane | **`presentation`** |
| kto decyduje, **co** zagrać dla danego wyniku | **`presentation`** |
| arytmetyka skali, rozdzielczości i filtrowania tekstu | **`presentation`** |
| powierzchnia, która **trwa** ze stanem i coś **znaczy** do odczytania | `ui` |
| co gracz robi urządzeniem | `input` |
| **dźwięk** jako kanał odtwarzania | `audio` |
| **co się stało** i z jakim wynikiem | `combat` i domeny mechaniki |
| ⛔ **zatrzymanie czasu, ruch ciała, zmiana stanu** | **NIE tutaj** — §1 |

### 0.1 Granica potwierdzona kodem

⚠⚠ **Reguła jest zapisana w kodzie jako warunek istnienia tej warstwy:
„nic tutaj nie może zmienić pozycji, czasu ani stanu".** ⭐ Ma **egzekutora**:
zamrożona regresja walki nie ma drgnąć ani o bit — ⛔ **jeśli drgnie, znaczy
to, że prezentacja weszła w symulację.**

⚠ **Warstwa ma bliźniaka, którego łatwo pomylić.** Drugi moduł o podobnej
nazwie **rusza ciałem i o to w nim chodzi** — jest wykonawcą skutków
gameplayowych. ⭐ **Reguła kieszonkowa z kodu: jeśli piszesz coś, co zmienia
POZYCJĘ, jesteś w złym pliku.**

⚠⚠ **Katalog nie decyduje o przynależności.** Potwierdzone: plik leżący
w katalogu interfejsu, **budowany przez scenę gry i rysujący w przestrzeni
świata**, należy tutaj. ⚙ Rozstrzyga **odpowiedzialność i cykl życia**, nie
miejsce w drzewie.

⚠ **Powierzchnia graniczna oddana przez `ui` — rozstrzygnięta.** Ciągła
reakcja na stan, której **nie da się odczytać jako wartości** *(wzmacnia się
i pulsuje, nie podaje liczby)*, należy do **`presentation`**: odpowiada na
ogłoszenie „jest źle", nie na pytanie „ile mam".

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `presentation` **bierze** | `combat` | rozstrzygnięcie akcji jako **dane** |
| `presentation` **bierze** | `proficiency` | wynik warstwy 2, którego **jedynym nośnikiem** bywa barwa |
| `presentation` **oddaje** | `audio` | wybrany sygnał — kanał odtwarzania jest tam |
| `presentation` **daje** | `ui` | motyw, skalę, style tekstu |
| `presentation` **czyta** | `abilities` | **te same** dane kształtu, którymi rozstrzyga się cios |

---

## 1. Podział: decyzja osobno, wykonanie osobno

```
ROZSTRZYGNIĘCIE   co się stało                  ← combat, czyste dane
DECYZJA           co ma zagrać                   ← ta domena, CZYSTA, bez silnika
WYKONANIE         zagraj to                      ← ta domena, dotyka silnika
```

⚠⚠ **Warstwa decyzji jest CZYSTA i testowalna poza grą** — nie importuje
silnika. To ten sam podział, co przy rozstrzyganiu akcji: **decyzja osobno,
wykonanie osobno**.

⚠ **Wykonanie ma zostać GŁUPIE.** Dostaje gotowy tekst i gotowy kolor, nie
klucz wyniku — wybór słowa należy do warstwy, która zna wynik.

⚠⚠ **Trzy rzeczy świadomie NIE przeszły przez tę granicę** i każda z innego
powodu (§4). ⛔ Żadna z nich nie jest zaległością do nadrobienia.

---

## 2. Cue: pięć kanałów jednego zdarzenia

**Słownik cue opisuje JEDNO zdarzenie — rozstrzygnięcie ciosu — i ma pięć
kanałów:** dźwięk, błysk, wstrząs, ślad, napis.

| kanał | co niesie |
|---|---|
| **dźwięk** | ⚙ opis; odtwarzanie należy do `audio` |
| **błysk** | ⭐ **jedyny błysk, jaki ta gra rysuje na graczu** — więc jego BARWA jest całym słownikiem tego kanału |
| **wstrząs** | ciężar ciosu |
| **ślad** | wyłącznie **pudło** — „coś się zamachnęło i nie trafiło" |
| **napis** | wynik, który **zatrzymał** cios |

⚠⚠ **Napis potwierdza błysk tym samym kolorem.** Dwa kanały mówiące o jednym
wyniku muszą się zgadzać, inaczej gracz dostaje dwie odpowiedzi na jedno
pytanie.

⚠ **Przywrócenie barwy po błysku jest ARGUMENTEM WYKONANIA, nie daną cue** —
bywa **funkcją** czytaną dopiero na końcu błysku, bo cel może w tym czasie
zmienić stan. ⚠⚠ Powód jest zmierzony: bezwarunkowe czyszczenie barwy
**kasowało telegraf** trwający w tle, a **nieaktualny telegraf jest gorszy niż
żaden**, bo gracz na niego reaguje.

⚠ **Skok skali jest SYMETRYCZNY i wraca w miejsce.** ⛔ Nie wolno zrobić z niego
przesunięcia — grafika ma potwierdzać ciało bojowe, a nie udawać ruch, którego
w symulacji nie ma.

---

## 3. Reszta prezentacji idzie WPROST

⚠⚠ **Tabela cue rządzi jednym zdarzeniem; wszystko inne jest wołane wprost.**
Zmierzone: pięć miejsc odgrywa cue, a poza nimi żyją **napisy, pierścienie,
wstrząsy i barwy telegrafów** wołane bezpośrednio (§Pokrycie).

⚙ **Stopień skanalizowania jest RÓŻNY dla różnych kanałów i to jest fakt, nie
zarzut:**

| kanał | stan |
|---|---|
| **błysk** | ⭐ **w pełni skanalizowany** — zero wywołań poza wykonawcą |
| **wstrząs** | ⚠ w tabeli **i** wołany wprost |
| **napis** | ⚠ w tabeli **i** wołany wprost, z wielu domen |
| **barwa telegrafu** | ⚙ **osobny, prawomocny kanał** — należy do stworzenia, nie do ciosu |

⚠ **Napis ma trzy różne role naraz**: liczba do **rzucenia okiem**, słowo
o wyniku i **zdanie do przeczytania**. ⭐ Dlatego czas trzymania przed zanikiem
jest parametrem: liczba ma być **mignięciem**, zdanie musi zdążyć zostać
przeczytane.

⚠ **Napis w ŚWIECIE i napis w INTERFEJSIE to dwa różne style** — świat zostaje
klockowaty jak kafle, interfejs kompensuje przybliżenie kamery (§5).

---

## 4. Cztery świadome wyłączenia

⚠⚠ **Każda z tych rzeczy mogła wejść do cue i świadomie nie weszła.**

| co | dlaczego nie |
|---|---|
| **zatrzymanie czasu przy krytyku** | ⛔ **wstrzymuje świat fizyki** — jest **stanem gry**, nie prezentacją; wpisane tu trafiłoby po złej stronie podziału |
| **popup obrażeń** | niesie **cztery pola**, z których rozstrzygnięcie ma dziś dwa; dołożenie brakujących „bo pasuje" to dokładnie **martwe sloty** — przeprowadza się **razem ze swoim konsumentem albo wcale** |
| **odrzut sprite'a** | przesuwałby grafikę **niezależnie od ciała bojowego** — granicy nie przesunięto, tylko przeszło na drugą stronę i nazwano to wprost |
| **nietykalność po uniku** | ⛔ **celowo cicha**: gracz właśnie dostał informację „przewrót zadziałał", a drugi sygnał w tym samym miejscu tylko ją rozmydla |

⭐ **To jest treść, nie brak.** Wyliczenie istnieje, bo **nieobecność kanału nie
zostawia w kodzie żadnego śladu** — bez niego każda kolejna sesja proponuje te
same cztery rzeczy od nowa.

---

## 5. Tekst: dwie przestrzenie, jedna łata

⚠⚠ **Pixel-art rysuje się najbliższym sąsiadem, a tekst tak się nie da.** Przy
skali innej niż 1 ramka napisu dostaje szerokość **ułamkową**, więc próbkowanie
wychodzi poza teksturę i **gubi kolumnę pikseli w środku wyrazu**.

⚠ **Ustawienie filtra na obiekcie NIE wystarcza** — silnik przywraca ostry
filtr przy **każdym** przerysowaniu napisu, czyli przy każdej zmianie liczby na
liczniku. Dlatego łata idzie na **prototyp rysowania tekstu**, a nie na
pojedynczy obiekt.

⚠⚠ **Warunek „skala różna od 1" jest tym, co chroni wygląd świata.** Napisy
w świecie zostają nieskompensowane i **klockowate tak samo jak kafle**, przez
które przechodzi ten sam zoom kamery. ⚙ Przy skali równej 1 renderowanie jest
**dosłownie takie jak przed wprowadzeniem skali**.

⚠ **Kierunek mnożnika rozdzielczości był realnym błędem** — odwrotność wygląda
równie prawdopodobnie i daje tekst próbkowany w dół. ⛔ To jest miejsce,
w którym „wygląda sensownie" nie wystarcza.

---

## 6. Podgląd celowania

⚠⚠ **Podgląd NIE ZNA geometrii.** Dostaje **gotowy kształt i gotową listę
trafionych** — czyli **te same dane, którymi rozstrzyga się cios**. ⛔ Rysowany
z własnych liczb byłby lustrem rozstrzygnięcia i **rozjechałby się cicho** przy
pierwszej zmianie.

⭐ **Podgląd, który kłamie, jest gorszy niż jego brak** — gracz podejmuje na
jego podstawie decyzję.

⚠ **Obrys znaczy ZASIĘG, wypełnienie znaczy OBSZAR OBRAŻEŃ.** ⛔ Nie wolno im
wyglądać tak samo: pełne koło przy ciosie w klin **kłamie o kształcie**.

⚠ **Język podglądu jest DANĄ umiejętności, nigdy gałęzią po jej nazwie.**

⚠ **Znaczniki celów są częścią odpowiedzi, nie ozdobą** — zasięg mierzy się do
**krawędzi** celu, więc duże zwierzę bywa trafialne, mając środek poza
narysowanym okręgiem.

### 6.1 Pierścień celu: sygnał CIĄGŁY, nie reakcja na zdarzenie (2026-09-11)

⚠⚠ **Do tej daty pierścień aktywnego celu miał JEDEN wygląd, a walka trzy
stany.** O tym, że cios nie wyjdzie, gracz dowiadywał się **wyłącznie napisem,
po naciśnięciu przycisku i z dławikiem** — czyli już po podjęciu decyzji. Trzy
komunikaty zastępowały jeden stan, którego nie było.

```
dosięgam           →  barwa aktywnego celu, alfa pełna   (wygląd niezmieniony)
za daleko          →  ta sama barwa, PRZYGASZONA
za blisko          →  BURSZTYN, alfa niemal pełna        (martwa strefa broni)
w zasięgu, tyłem   →  INNA barwa, alfa niemal pełna
```

⚠ **„Za daleko" jest ILOŚCIOWE, więc niesie je alfa, nie druga barwa** — inaczej
konkurowałaby z czerwienią aktywnego celu. **„Tyłem" dostaje barwę**, bo jest
odwracalne jednym ruchem kciuka: ma wołać o ten ruch, nie wyglądać jak brak celu.

⚠⚠ **„Za blisko” to OSOBNY stan.** Przygaszenie znaczy „podejdź”, więc przy
broni z dolną granicą (`melee.minReach`) kłamałoby o KIERUNKU. Bursztyn, bo
błękit należy do „tyłem”. ⚠ Czwarta barwa — dokłada się do `OI-72`.

⚠ **Nośnikiem jest BARWA i ALFA ISTNIEJĄCEGO kółka — zero nowych obiektów.**
Drugi kształt wokół postaci czyta się w tej grze jako obszar działania
(odrzucone dwukrotnie przy napędzie ciała), a kształt rysowany co klatkę jest
płatny co klatkę — dlatego ten pierścień jest **upieczoną teksturą**. Stany
wymusiły jedną zmianę techniczną: tekstura jest pieczona **biała i kolorowana
tintem**, bo zapieczona barwa pozwalała wyłącznie przygaszać.

⚠ **Ten sygnał odpowiada na to samo pytanie, co odmowa po naciśnięciu** — tymi
samymi dwoma predykatami i w tej samej kolejności (dystans przed zwrotem).
⛔ Rozjechanie ich znaczy, że pierścień obiecuje cios, którego bramka nie
wpuści. ⚠ **Po playteście:** dwa z trzech napisów odmowy stały się nadmiarowe —
okazja do **ujęcia** tekstu z ekranu, nie dodania *(`ui` §4)*.

---

## 7. Barwa jako jedyny nośnik

⚠⚠ **Dla części wyników BARWA jest jedyną informacją.** Przy uniku i parowaniu
**nie przeszło nic**: nie ma liczby, nie ma czasu, nie ma skoku — zostaje kolor
błysku i słowo tej samej barwy.

⚠⚠ **To samo dotyczy wyniku warstwy 2**: przy małym rzucie ześlizg i czyste
trafienie dają po zaokrągleniu **tę samą liczbę**, więc kategorii nie niesie ani
liczba, ani intensywność — ⛔ **niesie ją wyłącznie ten kanał**
*(`proficiency`)*.

⭐ **Konsekwencja jest twarda: cue nie jest tu ozdobą, tylko JEDYNYM wyjściem
mechaniki.** Wyciszenie go usuwa mechanikę z odbioru gracza, nie tylko z obrazu.

⚠ **Napis wyniku obronnego powstaje TYLKO po stronie gracza** — i to jest
bramka postawiona świadomie, żeby wynik pojawiający się kiedyś po drugiej
stronie był **decyzją do podjęcia, nie zachowaniem odziedziczonym**.

---

## 8. Niezmienniki

- **N-226** — ⛔ **prezentacja nie zmienia pozycji, czasu ani stanu**; regresja
  walki jest egzekutorem tej granicy (§0.1).
- **N-227** — **decyzja co zagrać jest CZYSTA**, wykonanie dotyka silnika
  (§1).
- **N-228** — **wykonanie jest głupie**: dostaje gotowy tekst i kolor, nie
  klucz wyniku (§1).
- **N-229** — **napis potwierdza błysk tą samą barwą** (§2).
- **N-230** — **przywrócenie barwy czyta się na KOŃCU błysku**, nie na początku
  (§2).
- **N-231** — **skok skali jest symetryczny**; ⛔ nigdy przesunięciem (§2).
- **N-232** — **kanał wyłączony z cue wymaga POWODU**, a powód zostaje zapisany
  (§4).
- **N-233** — **nowy kanał przeprowadza się razem ze swoim konsumentem albo
  wcale** (§4).
- **N-234** — **napisy w świecie nie kompensują skali**; interfejs kompensuje
  (§5).
- **N-235** — **podgląd rysuje z DANYCH rozstrzygnięcia**, nigdy z własnych
  liczb (§6).
- **N-236** — **obrys ≠ wypełnienie**: zasięg i obszar obrażeń muszą wyglądać
  inaczej (§6).
- **N-237** — **język podglądu jest daną**, nie gałęzią po nazwie (§6).
- **N-238** — **tam, gdzie barwa jest jedynym nośnikiem, cue jest mechaniką**,
  nie ozdobą (§7).

---

## 9. Checklista

**Nowy sygnał dla wyniku walki:** ⚠ dopisz go do **danych** cue, nie do
wołającego (N-228) · ⚠ sprawdź, czy nie kłóci się z barwą innego kanału
(N-229) · ⛔ jeśli miałby ruszyć pozycją, czasem albo stanem — **jesteś w złym
pliku** (N-226).

**Nowy kanał w tabeli cue:** ⚠ policz, czy rozstrzygnięcie **ma wszystkie
pola**, których potrzebuje — brakujące dokładane „bo pasuje" to martwe sloty
(N-233) · ⚠ jeśli nie wchodzi, **zapisz powód** (N-232).

**Nowy podgląd:** ⛔ nie licz geometrii — **poproś o gotowy kształt** (N-235) ·
⚠ odróżnij obrys od wypełnienia (N-236) · ⚠ język wybierz **daną** (N-237).

**Nowy napis:** ⚠ rozstrzygnij, czy ma być **mignięciem czy zdaniem** (§3) ·
⚠ wybierz przestrzeń — świat zostaje klockowaty (N-234).

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/combat_regresja.mjs` *(egzekutor granicy — musi dać zero różnic)* ·
`node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| granica „bez pozycji, czasu i stanu" | ✅ | ✅ | ⭐ `przymiar:combat_regresja` — **egzekutor, nie opis** |
| rozdział decyzji i wykonania | ✅ | ✅ | `kod:2026-09-06` |
| pięć kanałów cue dla jednego zdarzenia | ✅ | ✅ | `kod:2026-09-06` |
| napis potwierdza błysk barwą | ✅ | ✅ | `kod:2026-09-06` |
| przywrócenie barwy na końcu błysku | ✅ | ✅ | `reka:2026-08-23` |
| **błysk skanalizowany** | ✅ | ✅ *(policzone)* | ⭐ **zero wywołań poza wykonawcą** |
| **wstrząs i napis poza tabelą** | ⚙ **wołane też wprost** | ✅ *(opisane po raz pierwszy)* | ❌ — OI-70 |
| cztery świadome wyłączenia z cue | ✅ | ✅ | `kod:2026-09-06` |
| dwie przestrzenie tekstu | ✅ | ✅ | `kod:2026-09-06` |
| łata filtrowania na prototypie tekstu | ✅ | ✅ | ❌ **brak przymiaru** — OI-71 |
| podgląd rysuje z danych rozstrzygnięcia | ✅ | ✅ | `kod:2026-09-06` |
| obrys ≠ wypełnienie; język jako dana | ✅ | ✅ | `kod:2026-09-06` |
| **pierścień celu jako sygnał ciągły (cztery stany)** | ✅ | ✅ *(opisane po raz pierwszy)* | ❌ **odbiór barwy niesprawdzony** — OI-92 |
| **barwa jako jedyny nośnik wyniku** | ✅ | ✅ | ❌ **odbiór nigdy nie sprawdzony** — OI-29, OI-72 |
| napis obronny tylko po stronie gracza | ✅ | ✅ | `kod:2026-09-06` |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-92** | ⚠ **Trzeci stan pierścienia celu („tyłem") dzieli RODZINĘ BARW z tintem ogłuszenia.** Oba są zimne i jasne, a występują w tej samej scenie — więc „stoję do celu tyłem" i „mój cel jest ogłuszony" mogą się zlać, i to dokładnie w chwili, w której obie informacje są pilne. ⚙ **Wybór nie był przypadkowy** (błękit znaczy w tej grze „nie może działać"), ale trzecia barwa w walce jest decyzją prezentacyjną, nie techniczną. ⛔ **Nie zmieniam w ciemno** — do sprawdzenia ręką jedno pytanie: czy pierścień czyta się jako „obróć się". Jeśli nie, nośnikiem może zostać **kształt** (pierścień przerywany), nie kolejna barwa. |
| **OI-70** | ⚠ **Kanały są skanalizowane w RÓŻNYM stopniu i nic tego nie pilnuje.** Zmierzone: błysk — **zero** wywołań poza wykonawcą *(pełna kontrola)*; wstrząs — tabela **plus 5** wywołań wprost; napis — tabela **plus 23** wywołania w 9 plikach; pierścień — **12** wywołań, w ogóle poza tabelą. ⚙ **To nie jest wada** — cue opisuje **jedno zdarzenie** (rozstrzygnięcie ciosu), a napis nad przedmiotem czy pierścień zamachu nie są jego częścią. ⚠ Ale znaczy, że **reguła „napis potwierdza błysk" obowiązuje tylko wewnątrz tabeli**, a poza nią barwy dobiera każdy wołający osobno. ⛔ **Decyzja AUTORA**: czy barwy sygnałów mają mieć jedno źródło, czy pozostać lokalne. |
| **OI-71** | ⚠ **Łata filtrowania tekstu nie ma przymiaru, a jej awaria jest niewidoczna w liczbach.** Objaw to „napisy wyglądają niewyraźnie" — ⛔ nie błąd, nie ostrzeżenie, nie różnica w żadnym raporcie. ⚠ Łata siedzi na **prototypie rysowania tekstu silnika**, więc każda aktualizacja silnika może ją cicho unieważnić; ⚠⚠ **kierunek mnożnika rozdzielczości był już raz odwrócony** i wyglądał prawdopodobnie. ⚙ Projekt ma na to regułę („patrz na render, nie na raport"), ale **nie ma narzędzia**. ⛔ Przymiaru nie zbudowałem. |
| **OI-72** | ⚠⚠ **Tam, gdzie barwa jest jedynym nośnikiem, prezentacja przestaje być prezentacją — a mimo to nikt nigdy nie sprawdził, czy ta barwa jest czytelna.** Dotyczy uniku, parowania i wyniku warstwy 2 *(ześlizg i czyste trafienie dają po zaokrągleniu tę samą liczbę)*. ⚙ Pytanie **nie jest techniczne**: żaden skrypt nie odpowie, czy gracz odróżnia dwa odcienie w ferworze walki na telefonie. ⚠ Czyta się razem z `OI-29` *(odbiór warstwy 2 nigdy niesprawdzony ręką)* i `OI-26` *(pas boczny bloku niewidoczny)* — ⛔ **trzy otwarte pozycje o tej samej przyczynie: kanał niosący mechanikę nie ma potwierdzenia odbioru.** **Decyzja AUTORA**: playtest. |

---

## Czego ten dokument nie rozstrzyga

- **Żadnego efektu, napisu, koloru ani glifu z osobna** — to jest content.
- **Czy dzisiejsze barwy i czasy są dobre** — nigdy nie mierzone ręką
  *(OI-72)*.
- **Zatrzymania czasu, ruchu ciała i zmiany stanu** — to jest mechanika, i to
  jest **cała treść granicy** tej domeny.
- **Dźwięku jako kanału odtwarzania** — `audio`.
- **Powierzchni, które trwają razem ze stanem i coś znaczą do odczytania** —
  `ui`.
- **Co gracz robi urządzeniem** — `input`.
- **Co się stało i z jakim wynikiem** — `combat` i domeny mechaniki.
- ⛔ **Kiedy warto dołożyć nowy kanał** — to jest decyzja projektowa, nie
  reguła.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| granica „bez pozycji, czasu i stanu" i jej bliźniak | `src/core/CombatFx.ts` *(przy kodzie)* | ACTIVE |
| dlaczego cue jest opisem, a nie wywołaniem; cztery wyłączenia | `src/core/CombatCues.ts` | ACTIVE |
| pułapka przywracania barwy po błysku | `src/core/HitFlash.ts` | ACTIVE |
| pełna arytmetyka filtrowania tekstu i skali | `src/core/theme.ts` | ACTIVE |
| trzy języki podglądu celowania i odrzucone warianty | `docs/systemy/abilities.md`, `docs/systemy/abilities.md` | ACTIVE |
| dlaczego blok musi mieć własny kanał | `docs/systemy/shields.md` | ACTIVE |
| barwa jako jedyny nośnik wyniku warstwy 2 | `docs/systemy/proficiency.md`, `docs/systemy/proficiency.md` | ACTIVE |
| powierzchnie trwające ze stanem | `docs/systemy/ui.md` §0.1 | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_presentation.md` | — |

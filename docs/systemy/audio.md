---
typ: STAN
domena: audio
tytul: Dźwięk — kanał, roster, cisza
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check]
kotwice:
  - src/core/Sfx.ts
  - src/core/Settings.ts
  - src/core/CombatCues.ts
  - src/core/CombatFx.ts
  - tools/gen_audio.py
  - GameConfig.AUDIO.minRetriggerMs
  - GameConfig.AUDIO.ambientEnabled
  - GameConfig.COMBAT_FEEDBACK.whiff
otwarte: [OI-57]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Dźwięk — kanał, roster, cisza

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak w tej grze wydaje się
> dźwięk**: kto jest właścicielem odtwarzania, skąd bierze się lista dźwięków,
> czym pętla różni się od zdarzenia i **kiedy cisza jest decyzją**.
>
> **Czym NIE jest.** ⛔ **Nie mówi, JAK brzmi którykolwiek dźwięk ani który
> dźwięk pasuje do którego zdarzenia** — pierwsze jest zawartością, drugie
> należy do `presentation`. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| jak dźwięk jest odtwarzany, z jakimi zabezpieczeniami | **`audio`** |
| skąd wiadomo, jakie dźwięki w ogóle istnieją | **`audio`** |
| co robi pętla tła i kiedy się zmienia | **`audio`** |
| **który** sygnał towarzyszy któremu wynikowi | `presentation` |
| jak dźwięk jest **wygenerowany** (widmo, obwiednia) | `assets` |
| co się właśnie stało w walce | `combat` |
| kiedy przycisk jest niedostępny i jak to widać | `ui` |
| która mapa jest wczytana | `world` |

⚠⚠ **Ta domena nie decyduje, CO ma zabrzmieć.** Wybór sygnału dla wyniku walki
robi tabela cue *(`presentation`)*; tu mieszka wyłącznie **kanał**: jak zagrać,
czym się zabezpieczyć i czego nie zagrać dwa razy.

### 0.1 Dlaczego osobna domena

⚙ **Sprawdzone kodem, nie założone.** Trzy rzeczy, których żadna warstwa
prezentacji nie ma:

1. ⭐ **Cykl życia jest GRY, nie sceny.** Wiązanie następuje raz, przy starcie,
   i **przeżywa każdą przebudowę świata**. Wszystko, co rysuje, umiera razem ze
   swoją sceną — dźwięk nie może, bo pętla tła ma trwać przez przejście
   portalem.
2. ⭐ **Ma reguły, których nie ma nic innego:** przepustnica retriggeru,
   odblokowanie przez przeglądarkę, polityka brakującego pliku, rozdział
   pętla/zdarzenie.
3. ⭐ **Ma własny roster i własne narzędzie**, a jego ograniczenie zmieniło API
   odtwarzania (§6).

⛔ **Ale granica nie brzmi „wszystko, co dźwięczy".** Ta domena jest do
`presentation` w tym samym stosunku, co `movement` do `creatures`: **odpowiada
na „jak zagrać", nigdy na „co zagrać".**

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `audio` **bierze** | `presentation` | wybór sygnału + rozstrojenie, głośność, kubełek |
| `audio` **bierze** | `world` | ⚠ **którą pętlę grać** — właściwość mapy, nie stała |
| `audio` **bierze** | `assets` | pliki i generator |
| `audio` **słucha** | `progression`, `combat`, `inventory` | pięciu zdarzeń, związanych raz przy starcie |
| `audio` **daje** | `ui` | potwierdzenie naciśnięcia — ⚠ **wyłącznie gdy coś się stało** (§7) |

---

## 1. Jeden właściciel, trzy drogi dojścia

⚠⚠ **Odtwarzaniem zarządza dokładnie jedno miejsce.** Nic w grze nie sięga do
menedżera dźwięku silnika samodzielnie — inaczej przepustnica, brakujące pliki
i blokada przeglądarki byłyby obsłużone tyle razy, ile jest wywołań.

| droga | czym jest | ile |
|---|---|---|
| **zdarzenie** | związane **raz, przy starcie gry**; nigdy nie odwiązywane, bo nie ma czego — właściciel przeżywa sceny | **5** |
| **wywołanie wprost** | tam, gdzie zdarzenia **nie ma i nie warto go wymyślać** („zamach", „cios wylądował") | **27** w 13 plikach |
| **tabela cue** | dane: wynik walki → sygnał + rozstrojenie + głośność + kubełek | **1 ścieżka**, 5 miejsc wywołania |

⚠ **Podział jest świadomy, nie historyczny.** Zdarzenie dostaje dźwięk wtedy,
gdy **i tak istnieje**; wymyślanie zdarzenia wyłącznie po to, żeby przenieść
dźwięk, byłoby gorsze niż wywołanie w miejscu, w którym rzecz się dzieje.

⭐ **Tabela cue jest jedyną drogą, która skaluje się z zawartością** — nowy
wynik walki dostaje dźwięk **wpisem w danych**, bez dotykania kodu odtwarzania.

---

## 2. Roster jest DANYMI — i ma trzy niezależne kopie

⚠⚠ **Lista dźwięków wywodzi się z tabeli głośności**, więc ładowanie i użycie
**nie mogą się rozjechać**: klucz bez głośności nie istnieje dla nikogo.

⛔ **Ta gwarancja obejmuje dwie kopie z trzech.** Trzecią są **pliki na dysku**,
i o nich tabela nie wie nic:

```
tabela głośności   21 kluczy      ← roster: co gra ładuje i czym wolno zagrać
generator            21 wpisów    ← czym te pliki są wytwarzane
pliki na dysku       21 sztuk     ← co naprawdę zabrzmi
```

✅ **Dziś 21 : 21 : 21** — `dodge`/`parry` dostały pliki 2026-09-08 (`c5e1d4e`).
⚠ Brakujący plik byłby cichy: lista brakujących, **jedno** ostrzeżenie w
konsoli, potem pomijanie bez błędu. ✅ Pilnuje `tools/audio_przymiar.mjs`.

⚠ **To nie jest awaria — to jest polityka.** Brakujący dźwięk **nigdy nie jest
śmiertelny**, dokładnie tak jak brakująca grafika: skasowanie całego katalogu
dźwięków ma dać grę **cichą**, a nie grę, która wywala się na pierwszym ciosie.

---

## 3. Pętla i zdarzenie to dwa różne obywatelstwa

| | pętla tła | dźwięk jednorazowy |
|---|---|---|
| **uchwyt** | trzymany, żeby dało się ją zatrzymać | brak |
| **przepustnica** | ⛔ nie dotyczy | ✅ obowiązuje |
| **blokada przeglądarki** | ⚠ **odkładana** — zagra, gdy przeglądarka pozwoli | ⛔ **przepada** |
| **ponowne żądanie tego samego** | nie robi nic *(nie stakuje drugiej kopii)* | gra od nowa |

⚠⚠ **Asymetria wobec blokady jest sensem tego rozdziału.** Przeglądarka odmawia
dźwięku do pierwszego prawdziwego gestu użytkownika; pętla poproszona
przedwcześnie **zapamiętuje żądanie i rusza po odblokowaniu**, bo inaczej
„jest tło" znaczyłoby „jest tło, o ile akurat wcześniej czegoś dotknąłeś".
Dźwięk chwilowy nie ma czego odkładać — jego moment już minął.

⚠ **Czekające żądanie jest POLEM, nie zmienną domknięcia** — i to jest reguła,
nie szczegół. Zaczep odblokowania potrafi przeżyć wywołanie, które go założyło,
więc zapamiętany kurczowo klucz pozwoliłby **mapie, którą gracz już opuścił**,
zdecydować, co zabrzmi.

⚠ **Zaczep jest JEDEN, nie jeden na wywołanie** — każdy dodatkowy byłby drugą
próbą uruchomienia pętli, która już gra.

---

## 4. Pętla należy do MIEJSCA

⚠⚠ **Którą pętlę grać, jest właściwością MAPY, nie stałą globalną.** Ambience
to najtańszy kanał zdania „jesteś gdzie indziej"; jedna pętla na cały świat
marnuje go — przejście bramą nie zmieniało wtedy w uszach nic.

⚠ **Zmiana miejsca = rozbiórka sceny → zatrzymanie → budowa → start.** Dlatego
ścieżka „gra zła pętla, podmień ją" jest dziś **nieosiągalna** i istnieje jako
zabezpieczenie na wypadek zmiany mapy bez przebudowy sceny. ⚙ **Świadomie
utrzymywana martwa gałąź** — cicho zostawiona grająca pętla lasu w wiosce byłaby
nieprzyjemnym sposobem dowiedzenia się o jej braku.

⚠ **Zatrzymanie pętli kasuje także żądanie CZEKAJĄCE.** Bez tego opuszczenie
mapy nadal uzbrajałoby jej tło na moment, w którym przeglądarka wreszcie
pozwoli zagrać.

⚠ **Pętla ma wyłącznik, nie tylko suwak** — stałe brzmienie jest jedynym
dźwiękiem, przed którym gracz nie może uciec. ✅ Od 2026-10-09 ma go GRACZ
(`Settings.ambient`, OI-56); `AUDIO.ambientEnabled` zostaje wyłącznikiem
kompilacji ponad nim.

⭐ **Ustawienia (`core/Settings`) należą do URZĄDZENIA, nie do postaci** —
własny klucz `localStorage`, poza slotami `Save`. Wyciszenie idzie przez
`sound.mute` menedżera (gasi też grające), tło przez `Sfx.applySettings`,
które pamięta pętlę mapy (`mapAmbient`) także przy wyłączonym tle.

---

## 5. Przepustnica: kubełek, nie plik

⚠⚠ **Ten sam dźwięk nie może wyzwolić się szybciej niż okno przepustnicy.**
Powód jest arytmetyczny: zdolność obszarowa rozstrzyga się przeciw wszystkim
celom **w jednej klatce**, więc pięć trafień naraz to pięć identycznych próbek
w tej samej chwili — zsumowana amplituda przesterowuje i czyta się jako trzask,
nie jako pięć ciosów.

⚠⚠ **Okno liczy się per KUBEŁEK, nie per plik — i to jest naprawiony błąd, nie
ozdoba.** Dwa różne ZNACZENIA dzielące jeden plik dzieliły też okno i **zjadały
się nawzajem**: świst pudła przeciwnika przepadał bez śladu, jeśli padł tuż po
zamachu gracza — czyli dokładnie w najgęstszym momencie walki, dla którego ten
sygnał w ogóle powstał.

⭐ **Reguła ogólna: kubełek dzieli się z tym, z czym dzielisz ZNACZENIE, a nie
z tym, z czym dzielisz plik.**

---

## 6. Jeden plik, wiele znaczeń

⚠⚠ **Rozstrojenie i mnożnik głośności są tu osią ZNACZENIA, nie ozdobą.** Trzy
pliki niosą po kilka rozróżnialnych zdarzeń:

| plik | ile znaczeń | czym rozróżnione |
|---|---|---|
| zamach | **3** | własny · cudzy chybiony · chybiony niezgrabnie |
| przyjęcie ciosu | **3** | lekki · średni · ześlizg |
| trafienie / krytyk | **2 każdy** | czysto · ześlizg |

⚠⚠ **Powodem NIE jest oszczędność, tylko ograniczenie narzędzia.** Generator
dźwięków ciągnie **jeden wspólny strumień losowy** w kolejności swojego
słownika, więc **dopisanie na końcu jest tanie, a wstawienie w środku po cichu
zmienia każdy plik poniżej** — mimo że nikt nie ruszał ich kodu.

⭐ **Z tego ograniczenia wyrosło API odtwarzania.** Rozstrojenie i własny
kubełek istnieją dlatego, że **nowy plik był droższy niż nowy parametr**.
⚠ Jest to zapisane jako **świadomy dług**, nie jako wzorzec docelowy (OI-57).

---

## 7. Cisza jest decyzją

⚠⚠ **Wyszarzony przycisk MILCZY — i to jest reguła odwrotna do wizualnej.**
`ui` wymaga, żeby odmowa **była widoczna i nazwana**; ta domena wymaga, żeby
**nie zabrzmiała**. Powód jest ten sam po obu stronach: dźwięk kliknięcia znaczy
„zadziałało", więc odtworzony przy odmowie **kłamałby**.

⛔ **W rosterze nie ma dźwięku odmowy** i żadna odmowa nie brzmi. Powód jest
nazwany wprost: odmowa jest **komunikatem**, a komunikat czyta się oczami.

⚠ **Kontrolki bojowe nie mają dźwięku interfejsu.** Ich potwierdzeniem jest
**dźwięk skutku w świecie** (zamach, zdolność, łyk), a nie kliknięcie przycisku.
⚙ Kliknięcie należy do paneli i do wierszy rozmowy.

⚠ **Wiersze huba rozmowy mają WŁASNE wywołanie dźwięku**, bo są budowane ręcznie
i nie dziedziczą go po wspólnej fabryce przycisków. ⚠ To najczęściej naciskane
przyciski w grze — cisza była tu **słyszalna**.

⚠ **Dwa źródła kliknięcia mają dwa różne momenty:** fabryka przycisków gra przy
naciśnięciu, wiersze rozmowy przy puszczeniu. ⚙ **Obie zgadzają się ze swoją
akcją** (każda gra dokładnie wtedy, gdy jej akcja się wykonuje), więc różnica
jest w tym, kiedy akcja pada — nie w dźwięku.

---

## 8. Niezmienniki

- **N-162** — **jedno miejsce odtwarza dźwięk**; nic nie sięga do menedżera
  silnika samodzielnie (§1).
- **N-163** — **właściciel dźwięku żyje dłużej niż scena**; wiązanie następuje
  raz i nie jest odwiązywane (§0.1, §1).
- **N-164** — **roster wywodzi się z konfiguracji**, nigdy nie jest przepisywany
  ręcznie (§2).
- **N-165** — **brakujący plik daje CISZĘ, nigdy błędu** (§2).
- **N-166** — **pętla i dźwięk chwilowy to dwa różne obywatelstwa**: pętla ma
  uchwyt, omija przepustnicę i **czeka** na odblokowanie; chwilowy nie (§3).
- **N-167** — **czekające żądanie pętli jest polem, nie domknięciem** (§3).
- **N-168** — **pętla należy do MIEJSCA**, nie do gry (§4).
- **N-169** — **zatrzymanie pętli kasuje też żądanie czekające** (§4).
- **N-170** — **przepustnica liczy się per kubełek ZNACZENIA, nie per plik**
  (§5).
- **N-171** — **jeden plik wolno rozdzielić na znaczenia rozstrojeniem**, ale
  wtedy **musi dostać własny kubełek** (§5, §6).
- **N-172** — ⛔ **odmowa nie brzmi**; wyszarzony przycisk milczy (§7).
- **N-173** — **kontrolkę bojową potwierdza skutek w świecie**, nie dźwięk
  interfejsu (§7).

---

## 9. Checklista

**Nowy dźwięk:** dopisz klucz do tabeli głośności **i** wpis do generatora
**NA KOŃCU** (N-164, §6) · ⚠ sprawdź, czy plik naprawdę powstał —
`node tools/audio_przymiar.mjs` · dobierz poziom względem **częstości**, nie ważności.

**Nowe znaczenie na istniejącym pliku:** rozstrój je (N-171) · ⚠ **daj mu własny
kubełek**, inaczej zje sąsiada w oknie przepustnicy (N-170).

**Nowa mapa:** ⚠ wskaż jej pętlę (N-168) — brak wskazania to cisza, nie
domyślne tło.

**Nowy przycisk:** ⚠ jeśli budujesz go ręcznie, **dodaj dźwięk sam** (§7) ·
⛔ nie odtwarzaj go przed sprawdzeniem, czy akcja jest dostępna (N-172).

**Bramki:** `npx tsc --noEmit` · `npm run build` · `node tools/doc_check.mjs` ·
`node tools/audio_przymiar.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| jeden właściciel odtwarzania | ✅ | ✅ | `kod:2026-09-06` |
| cykl życia gry, nie sceny | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| trzy drogi dojścia (zdarzenie · wprost · tabela) | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| roster wywiedziony z konfiguracji | ✅ | ✅ | `kod:2026-09-06` |
| roster zgodny z plikami | ✅ **21 : 21** | ✅ | ✅ `przymiar:audio_przymiar` |
| brakujący plik = cisza, nie błąd | ✅ | ✅ | `kod:2026-09-06` |
| rozdział pętla / dźwięk chwilowy | ✅ | ✅ | `kod:2026-09-06` |
| odkładanie pętli do odblokowania | ✅ | ✅ | ❌ **nie sprawdzone ręką** |
| pętla per mapa | ✅ | ✅ | `reka:2026-08-31` |
| podmiana pętli bez przebudowy sceny | ✅ | ✅ | ⚙ **ścieżka nieosiągalna** — zabezpieczenie |
| przepustnica per kubełek | ✅ | ✅ | `kod:2026-09-06` |
| jeden plik, wiele znaczeń przez rozstrojenie | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| odmowa milczy; wyszarzone milczy | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| kontrola dźwięku dla gracza | ✅ wyciszenie + tło (bez suwaka) | ✅ | `runtime:2026-10-09` |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-55** | ✅ **ZAMKNIĘTE 2026-10-09** — pliki `dodge`/`parry` są od 2026-09-08 (`c5e1d4e`), a zgodność tabeli, generatora i dysku pilnuje `tools/audio_przymiar.mjs` (z sabotażem: usunięty plik i klucz bez pliku świecą na czerwono). |
| **OI-56** | ✅ **ZAMKNIĘTE 2026-10-09** — dwa przełączniki (Dźwięk, Odgłosy tła) w menu głównym → „Ustawienia” i w grze na zakładce ZAPIS; zapamiętane na urządzeniu. Suwaka głośności świadomie brak — w razie potrzeby osobna sprawa. |
| **OI-57** | ⚠ **Wspólny strumień losowy generatora czyni DOPISANIE dźwięku tanim, a WSTAWIENIE — drogim**: wpis w środku słownika po cichu zmienia każdy plik poniżej. ⭐ Z tego ograniczenia **wyrosło API odtwarzania** — rozstrojenie i własny kubełek powstały jako tańsza alternatywa dla nowego pliku. ⚠ Jest to zapisane jako **świadomy dług** z nazwanym kandydatem na spłatę, nie jako wzorzec. ⛔ **Nie rozstrzygam**, czy rozdzielić strumienie per dźwięk — to zmiana narzędzia, która przegeneruje wszystko. |

---

## Czego ten dokument nie rozstrzyga

- **Jak brzmi którykolwiek dźwięk** — widmo, obwiednia i warstwy są
  zawartością, a ich uzasadnienia stoją przy generatorze.
- **Który sygnał pasuje do którego wyniku walki** — `presentation`
  *(tabela cue)*.
- **Poziomu żadnego dźwięku** — to są dane; ⚙ regułą jest tylko **„głośność
  dobiera się do CZĘSTOŚCI, nie do ważności"**.
- **Czy dzisiejszy miks jest dobry** — nigdy nie był oceniany ręką.
- **Kiedy przycisk jest niedostępny i jak to widać** — `ui`.
- **Która mapa jest wczytana i skąd** — `world`.
- ⛔ **Żadnego pojedynczego dźwięku, mapy, NPC-a ani ekranu** — to jest content.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| polityka brakującego pliku, przepustnica, blokada przeglądarki | `src/core/Sfx.ts` *(przy kodzie)* | ACTIVE |
| dlaczego pętla jest właściwością mapy | `GameConfig.MAPS` *(przy kodzie)* | ACTIVE |
| dlaczego dopisywać na końcu; pasmo pętli lasu | `tools/gen_audio.py` | ACTIVE |
| dlaczego blok ma być słyszalny jako inne zdarzenie | `docs/systemy/shields.md` | ACTIVE |
| świst pudła jako sygnał kontrgry | `docs/systemy/combat.md` | ACTIVE |
| dlaczego wyszarzone milczy, a odmowa jest napisem | `docs/systemy/input.md` §8, `src/ui/CLAUDE.md` | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_audio.md` | — |

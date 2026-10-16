---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena audio
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/Sfx.ts, tools/gen_audio.py]
otwarte: [OI-55, OI-56, OI-57]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `audio`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/audio.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia i rozstrzygnięcie domeny

### 1.1 Czy `audio` jest osobną domeną — sprawdzone kodem

**Pytanie misji:** własny system czy część `presentation`?

| test | wynik |
|---|---|
| ma **własną odpowiedzialność**, której nikt inny nie pełni | ✅ jedyny właściciel odtwarzania; nic nie sięga do menedżera silnika samodzielnie |
| ma **cykl życia inny niż prezentacja** | ✅⭐ **wiąże się raz przy starcie gry i przeżywa każdą przebudowę świata**; wszystko, co rysuje, umiera ze swoją sceną |
| ma **reguły, których nie ma nic innego** | ✅ przepustnica retriggeru · blokada przeglądarki · polityka brakującego pliku · rozdział pętla/zdarzenie |
| ma **własny roster i narzędzie** | ✅ 21 kluczy wywiedzionych z konfiguracji + generator |
| czy jego reguły dałoby się **wchłonąć** do `presentation` bez straty | ⛔ **nie** — musiałyby wejść do warstwy, która nie przeżywa restartu sceny, czyli straciłyby pętlę tła |

⭐ **Rozstrzygnięcie: TAK, osobna domena — ale jej granica nie brzmi
„wszystko, co dźwięczy".** Wybór **którego** sygnału użyć dla wyniku walki
robi tabela cue i to zostaje w `presentation`. ⚙ **`audio` odpowiada na „jak
zagrać", nigdy na „co zagrać"** — dokładnie ten sam kształt, co `movement`
wobec `creatures`.

⚠ **Wynik nie był z góry przesądzony.** Gdyby dźwięk był wyłącznie czwartym
kanałem tabeli cue (obok błysku, wstrząsu i napisu), byłby częścią prezentacji.
Rozstrzygnęły **dwie ścieżki, które przez tabelę nie przechodzą wcale**: pętla
tła i dziesięć kliknięć interfejsu.

### 1.2 Plan cięcia

| | treść |
|---|---|
| **bierze** | jeden właściciel i trzy drogi dojścia · roster jako dane · rozdział pętla/zdarzenie i blokada przeglądarki · pętla per mapa · przepustnica per kubełek · rozstrojenie jako oś znaczenia · **cisza jako decyzja** |
| **oddaje** | który sygnał do którego wyniku → `presentation` · jak dźwięk jest wygenerowany → `assets` · która mapa → `world` · kiedy przycisk jest niedostępny → `ui` |
| **NIE opisze** | brzmienia żadnego dźwięku · poziomu żadnego dźwięku · czy dzisiejszy miks jest dobry |

⭐ **Jedenasta domena z rzędu z planem cięcia; wróciła pod limit bez rundy
skracania** (17,0 KB) — ⚙ po jednorazowym przekroczeniu przy `input`.

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | jeden właściciel · 21 kluczy z konfiguracji · trzy drogi dojścia · pętla per mapa z odkładaniem do odblokowania · przepustnica per kubełek · rozstrojenie jako oś znaczenia · brakujący plik = cisza · odmowa milczy |
| **INTENDED** | ⚠ **osobny plik świstu** — nazwany wprost jako kandydat do spłaty długu (`OI-57`) · ⚠ **ekran ustawień dźwięku** — kod ma na niego przygotowaną gałkę, ekranu nie ma (`OI-56`) |
| **HISTORICAL** | jedna pętla globalna na cały świat (wioska grała las) · przepustnica **per plik**, przez którą świst pudła przepadał · pierwsza pętla lasu z 24% energii powyżej 2 kHz — czytała się jak szum kineskopu |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **A-1** | roster dźwięków jest spójny | ⛔ **21 kluczy · 19 plików · 19 wpisów generatora.** Dwa klucze (**unik**, **parowanie**) nie mają pliku; te dwa wyniki walki **nie brzmią nigdy** | ⛔⛔ najwyższa → `OI-55` |
| **A-2** | „lista wywiedziona z tabeli głośności, **więc te dwie nie mogą się rozjechać**" | ⚙ **twierdzenie jest PRAWDZIWE** — i mimo to rozjazd zachodzi, bo kopie są **trzy**, a gwarancja wiąże dwie. Trzecia (pliki na dysku) nie jest związana niczym | ⛔ wysoka — ⚠ **to nie jest fałszywy komentarz, tylko gwarancja o węższym zakresie, niż sugeruje jej brzmienie** |
| **A-3** | „podmiana pętli bez przebudowy sceny **dziś nigdy nie zachodzi**" | ✅ **potwierdzone** — jedyne wywołanie startu pętli siedzi w budowie sceny, a zmiana mapy zawsze zaczyna się od rozbiórki | ⚙ **zgodne** — ⭐ rzadki przypadek: komentarz opisuje **własną nieosiągalność** i ma rację. Gałąź jest zabezpieczeniem, nie martwym kodem do usunięcia |
| **A-4** | **milczenie** — nigdzie nie opisano **asymetrii wobec blokady przeglądarki** | pętla poproszona przed odblokowaniem **czeka i rusza później**; dźwięk chwilowy **przepada** i zostaje po nim jedno ostrzeżenie w konsoli | ⚠ średnia — ⚙ obie ścieżki są poprawne, ale **reguła, która je rozdziela, nie była nigdzie zapisana** |
| **A-5** | **milczenie** — nigdzie nie opisano, że **cisza bywa DECYZJĄ** | dźwięk kliknięcia jest odtwarzany **po** sprawdzeniu dostępności, świadomie („wyszarzony przycisk musi milczeć, inaczej kliknięcie czyta się jako «zadziałało»"); w rosterze **nie ma dźwięku odmowy** | ⚠⚠ wysoka — ⭐ **depozyt z `input` rozstrzygnięty ODWROTNIE dla tego kanału**, patrz §5 |
| **A-6** | rozstrojenie i własny kubełek to parametry wygody | ⛔ **nie** — powstały, bo **wspólny strumień losowy generatora** czyni wstawienie nowego pliku drogim: wpis w środku słownika zmienia każdy plik poniżej | ⭐ wysoka → `OI-57`. **Ograniczenie NARZĘDZIA ukształtowało API RUNTIME'U** |
| **A-7** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **gracz nie ma żadnej kontroli nad dźwiękiem** | głośność główna i wyłącznik tła są **stałymi kompilacji**; brak ekranu ustawień, wyciszenia i suwaka | ⚠ średnia → `OI-56` |
| **A-8** | dźwięk kliknięcia pada w jednym momencie | ⚙ **w dwóch**: fabryka przycisków gra przy **naciśnięciu**, wiersze huba rozmowy przy **puszczeniu** | ⚙ **nie rozjazd** — każda ścieżka gra dokładnie wtedy, gdy **wykonuje się jej akcja**. Odnotowane, bo wygląda na niekonsekwencję, a nią nie jest |
| **A-9** | **brak przymiaru** — nic nie sprawdza żadnej reguły tej domeny | generator **produkuje** pliki; nikt nie sprawdza, czy roster im odpowiada, czy kubełki są rozłączne, ani czy każda mapa ma pętlę | ⛔ wysoka → `OI-55` |

⚠ **Profil domeny: zero sprzeczności kod ↔ dokumentacja, jeden rozjazd
kod ↔ DYSK i cztery milczenia.** ⚙ Wszystkie komentarze w tej domenie okazały
się **prawdziwe** — łącznie z tym, który opisuje własną martwą gałąź.

---

## 4. Pomiary

**Metoda:** zliczenie rosteru wprost z konfiguracji, zestawione z **listą
katalogu** i ze słownikiem generatora; wywołania policzone po kodzie, bez
komentarzy.

| pomiar | wynik |
|---|---|
| klucze w tabeli głośności | **21** *(19 jednorazowych + 2 pętle)* |
| pliki na dysku | **19** |
| wpisy generatora | **19** |
| ⛔ **klucze bez pliku** | **2** — unik, parowanie |
| pliki bez klucza | **0** |
| dźwięki związane **zdarzeniem** | **5** *(wiązane raz, przy starcie)* |
| wywołania **wprost** | **27** w **13** plikach |
| z nich kliknięcia interfejsu | **10** |
| ścieżka **danych** (tabela cue) | **1**, wołana z 5 miejsc |
| pliki niosące **więcej niż jedno znaczenie** | **3** *(zamach — 3, przyjęcie ciosu — 3, trafienie i krytyk — po 2)* |
| ⛔ **przymiary tej domeny** | **0** |

**Co z tego wynika:**

1. ⚠⚠ **Roster ma trzy kopie, a związane są dwie.** ⭐ To jest **dokładnie ta
   sama klasa błędu, co „pomiar bez jednostki"** z `economy`: gwarancja jest
   prawdziwa i **węższa niż jej brzmienie**, więc czyta się jak szersza.
2. ⚙ **Dominującym odbiorcą dźwięku jest interfejs, nie walka** — 10 z 27
   wywołań wprost to jedno kliknięcie. Walka idzie w większości **danymi**.
3. ⭐ **17 plików jednorazowych niesie co najmniej 22 rozróżnialne zdarzenia.**
   Różnicę robi rozstrojenie, nie zawartość katalogu.

⛔ **Nie oceniam, czy 21 dźwięków to dużo ani czy miks jest dobry.** To jest
opis, nie werdykt; ⚠ **miks nigdy nie był oceniany ręką**.

---

## 5. Depozyty — weryfikacja

| depozyt | wynik |
|---|---|
| **pętla per mapa i wymiana przy portalu** | ✅ realna — ⚙ ale **wymiana zachodzi przez ROZBIÓRKĘ sceny**, nie przez podmianę; gałąź podmiany jest **nieosiągalna i utrzymywana świadomie** (A-3). ⚠ Depozyt uzupełniony o rzecz, której nie niósł: **zatrzymanie kasuje też żądanie CZEKAJĄCE** |
| **dźwięk odmowy jako część „odmowa nigdy nie jest cicha"** | ⛔ **rozstrzygnięty ODWROTNIE — i to jest poprawne.** Dźwięku odmowy **nie ma i nie ma go być**: kliknięcie znaczy „zadziałało", więc odtworzone przy odmowie **kłamie**. ⭐ Ta sama zasada („nie kłam graczowi") daje **przeciwne reguły w dwóch kanałach**: oko dostaje powód, ucho ciszę |
| **własny dźwięk wierszy huba rozmowy** | ✅ potwierdzony co do joty — ⚙ z **niezapowiedzianym dodatkiem**: te wiersze grają przy **puszczeniu**, a fabryka przycisków przy **naciśnięciu** (A-8) |
| **pozostałe reguły odtwarzania znalezione w kodzie** | ✅ trzy, żadna wcześniej nieopisana: **przepustnica per kubełek znaczenia**, **rozstrojenie jako oś znaczenia**, **asymetria wobec blokady przeglądarki** |

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| jedno miejsce odtwarza dźwięk | 🆕 **N-162** |
| właściciel żyje dłużej niż scena | 🆕 **N-163** — ⭐ argument rozstrzygający o osobnej domenie |
| roster wywiedziony z konfiguracji | 🆕 **N-164** — ⚠ **z jawnie zapisanym zakresem gwarancji** (A-2) |
| brakujący plik = cisza, nie błąd | 🆕 **N-165** — ⚙ depozyt z reguły globalnej „gra ZAWSZE się uruchamia", potwierdzony dla dźwięku |
| pętla i dźwięk chwilowy: dwa obywatelstwa | 🆕 **N-166** (A-4) |
| czekające żądanie jest polem, nie domknięciem | 🆕 **N-167** |
| pętla należy do miejsca | 🆕 **N-168** — depozyt, potwierdzony |
| zatrzymanie kasuje żądanie czekające | 🆕 **N-169** |
| przepustnica per kubełek znaczenia | 🆕 **N-170** |
| rozdzielenie pliku rozstrojeniem wymaga własnego kubełka | 🆕 **N-171** (A-6) |
| odmowa nie brzmi | 🆕 **N-172** (A-5) — ⚠ **jawnie odwrotny do reguły wizualnej i to jest zamierzone** |
| kontrolkę bojową potwierdza skutek w świecie | 🆕 **N-173** |
| głośność dobiera się do CZĘSTOŚCI, nie do ważności | ➡ **ZOSTAJE** przy danych; w `STAN` wyłącznie jako zdanie o kryterium, bez liczb |
| brzmienie, widmo, obwiednia | ➡ **ZOSTAJĄ** dla `assets` i przy generatorze |
| który sygnał do którego wyniku | ➡ **ZOSTAJE** dla `presentation` (tabela cue) |
| kontrola głośności dla gracza | ⛔ **OTWARTA** → `OI-56`, nierozstrzygana |
| spójność rosteru z assetami | ⛔ **OTWARTA** → `OI-55`, nierozstrzygana |
| wspólny strumień losowy generatora | ⛔ **OTWARTY** → `OI-57`, nierozstrzygany |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **ROZJAZD MIĘDZY KODEM A DYSKIEM JEST NIEWIDZIALNY DLA PROCEDURY
   CZYTAJĄCEJ KOD** (A-1). Obie strony są **poprawne**: konfiguracja legalnie
   deklaruje klucz, obsługa legalnie pomija brakujący plik. Żaden grep po `src/`
   nie mógł tego pokazać, bo **nie ma tam czego znaleźć** — trzeba było
   **wylistować katalog** i zestawić trzy listy. ⭐ Nowy krok do procedury:
   **gdy domena ma roster, policz WSZYSTKIE jego kopie, łącznie z tymi poza
   repozytorium kodu.**

2. ⚠⚠ **Gwarancja może być prawdziwa i za wąska naraz** (A-2). „Wywiedzione
   z tabeli, **więc te dwie nie mogą się rozjechać**" jest zdaniem **w pełni
   poprawnym**, które czyta się jako „roster nie może się rozjechać". ⛔ Różnicę
   robi słowo „dwie", a to jest dokładnie ten rodzaj słowa, który przy
   cytowaniu wypada. ⚙ Ta sama klasa co **pomiar bez jednostki** (`economy`,
   `save`).

3. ⭐ **OGRANICZENIE NARZĘDZIA POTRAFI UKSZTAŁTOWAĆ API RUNTIME'U** (A-6).
   Rozstrojenie i własny kubełek nie powstały z projektu dźwięku, tylko dlatego,
   że **wspólny strumień losowy generatora czyni nowy plik droższym niż nowy
   parametr**. ⚠ Bez przeczytania **narzędzia** ta decyzja wygląda na wybór
   estetyczny. ⛔ Ekstrakcja czytająca wyłącznie `src/` przegapiłaby powód.

4. ⚠⚠ **Ta sama zasada daje przeciwne reguły w dwóch kanałach** (A-5).
   „Nie kłam graczowi" znaczy dla oka **„nazwij powód odmowy"**, a dla ucha
   **„milcz"**. ⛔ Depozyt przyjęty bez sprawdzenia kanału zapisałby regułę
   odwrotną do prawdziwej — a brzmiał wiarygodnie, bo cytował istniejącą,
   poprawną regułę **innej domeny**.

5. ⚠ **Komentarz opisujący własną nieosiągalność jest rzadki i wart odnotowania
   po stronie plusów** (A-3). Po dwóch domenach, w których komentarze kłamały,
   ta domena nie miała **ani jednego** fałszywego. ⚙ Wniosek nie brzmi
   „komentarzom można ufać", tylko: **sprawdzenie kosztuje tyle samo w obie
   strony, a wynik bywa różny**.

⚙ **Co zadziałało:** wylistowanie katalogu assetów (bez tego A-1 nie istnieje),
przeczytanie **generatora** obok kodu gry (bez tego A-6 wygląda na kaprys) oraz
zestawienie depozytu z **kanałem**, do którego trafia, zamiast z jego brzmieniem.

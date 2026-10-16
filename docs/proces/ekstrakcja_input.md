---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena input
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/InputState.ts, src/ui/VirtualJoystick.ts]
otwarte: [OI-52, OI-53, OI-54]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `input`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/input.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | trzy kształty intencji (ciągła / chwilowa / **sesja**) · kontrakt przenoszenia i jednopytaniowe mosty · podział lewa/prawa i budżet dwóch palców · **arbitraż dotyku** · sesja celowania · progi rozstrzygające gest · cykl życia wskaźnika i przestrzenie współrzędnych · czasowniki dotyku · klawiatura i system Back |
| **oddaje** | gdzie stoi kontrolka, jak duża jest i co pokazuje → `ui` · rysowanie podglądu, ✕, pierścienia biegu → `ui` · pauza i modalność paneli → `ui` · skala interfejsu i DPR → `presentation` · co robi intencja po dotarciu → `movement`, `combat`, `abilities` |
| **NIE opisze** | ergonomii (czy łuk i promienie są dobre) · żadnego pojedynczego przycisku, ekranu ani zdolności · balansu żadnej liczby |

⚠ **Granica sprawdzona, nie założona.** Pierwsze cięcie kładło **próg
dotykowy** po stronie `ui` (bo mieszka w układzie HUD-u). Kod tego nie
potwierdza: rozmiar celu jest **warunkiem, żeby palec trafił**, a nie decyzją
o wyglądzie — grafika kontrolki bywa od niego mniejsza i **to jest zamierzone**.
⭐ **Rozstrzygnięcie: `input` stawia WYMÓG, `ui` wybiera miejsce i wygląd.** To
jedyne miejsce, w którym ta domena mówi drugiej, co ma zrobić.

⚠ Drugie cięcie sprawdzone tak samo: **podział lewa/prawa nie jest układem
HUD-u**. Drążek zgłasza się po **każde** dotknięcie lewej połowy, więc „prawa
strona" jest regułą wejścia, nie estetyką rozmieszczenia.

⭐ **Dziesiąta domena z rzędu z planem cięcia przed pisaniem** — ⚠ ale
**pierwsza, która wymagała rundy skracania** (20,6 KB → 19,4 KB). Powód
w §7.

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | trzy kształty intencji · dwa mosty jednopytaniowe · lewa/prawa · dwa pointery · arbitraż silnika + podwójny hit-test · sesja celowania z dwoma końcami · trzy progi gestu · tapnięcie zaznacza · dwa źródła biegu · Back jako trzecie drzwi |
| **INTENDED** | ⛔ **nic** — ta domena nie ma dziś ani jednej zapowiedzianej, niewdrożonej reguły |
| **HISTORICAL** | podwójne tapnięcie (usunięte) wraz z 300 ms opóźnieniem, które istniało wyłącznie po to, żeby się z nim nie bić · jeden pointer dotykowy · bieg włączany przy 92% wychylenia · trzy niezależne uchwyty `E`, każdy z własnym monitem |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **I-1** | komentarz w czterech widżetach: „zatrzymaj propagację, **żeby drążek nie przejął tego dotyku**" | ⛔ **nie to zatrzymuje drążek.** Kanał anulowania silnika to **czwarty argument uchwytu**, którego ten kod nigdzie nie używa — zatrzymywane jest zdarzenie **przeglądarki**. Poziom sceny (gdzie słucha drążek) emituje się mimo wszystko. ⚙ Do tego **wszystkie cztery widżety leżą w prawym dolnym rogu**, gdzie drążek i tak nie zgłasza się po wskaźnik (bramka „lewa połowa") | ⛔ średnia — mechanizm nieszkodliwy, ale **opisany fałszywie i kopiowany do każdego nowego widżetu**. ⚠ `src/ui/CLAUDE.md` (przy `PanelBase`) mówi to **poprawnie**: drążek „odpytuje hit-test samodzielnie, **bez polegania na propagacji**". Dwa opisy jednego mechanizmu w jednym katalogu |
| **I-2** | `src/ui/CLAUDE.md`: „`E` **kończy rozmowę z każdej warstwy**, `ESC` cofa o jeden poziom" | ⛔ **oba klawisze wołają dokładnie tę samą metodę**, która cofa o **jeden** poziom. Różnicy nie ma, a „z każdej warstwy" nie zachodzi dla żadnego z nich | ⛔ wysoka — dwa twierdzenia, **oba nieprawdziwe**, o najczęściej używanym klawiszu gry |
| **I-3** | milczenie — nigdzie nie zapisano, że `E` ma **DWÓCH właścicieli bez uzgodnienia** | rozmowa wiąże `E` z cofnięciem, przycisk kontekstowy wiąże `E` z otwarciem. Oba uchwyty odpalają się na tym samym naciśnięciu, w kolejności rejestracji: rozmowa **zamyka się**, po czym drugi uchwyt **natychmiast otwiera ją z powrotem** | ⛔⛔ najwyższa → `OI-52` |
| **I-4** | milczenie — nigdzie nie zapisano, że **klawiatura nie ma ogniska wejścia** | klawisz panelu postaci otwiera panel **w trakcie rozmowy**; jego zamknięcie **wznawia świat**, choć rozmowa dalej jest otwarta. Ani jeden uchwyt klawisza nie pyta, czy ekran należy do kogoś innego | ⛔ wysoka → `OI-52` |
| **I-5** | milczenie o **właścicielu priorytetu** — ani jeden dokument nie mówi, że kolejność wejścia ustala **silnik** | scena wyżej przechwytuje wskaźnik i świat **nie widzi go w ogóle**; dopiero po pętli po obiektach leci zdarzenie poziomu sceny, **bez informacji, czy dotyk został zużyty** | ⚠ średnia — ⭐ z tego wynika, że **podwójny hit-test drążka jest ręcznym POWTÓRZENIEM porządku silnika**, a nie drugim mechanizmem. Bez tego zdania wygląda na obejście |
| **I-6** | „podwójne tapnięcie usunięte z tego katalogu" | ✅ **prawda w kodzie** — ⚠ ale **trzy komentarze wciąż je opisują**, w tym jeden **poza** katalogiem, którego reguła to mówi | ⚠ średnia — ⛔ **nienaprawione: `src/` jest poza zakresem tej misji** |
| **I-7** | milczenie — nigdzie nie zapisano, że **„tapnięcie czy przeciągnięcie" rozstrzyga się w trzech miejscach, w dwóch jednostkach** | dystans (celowanie) · **czas** (siatka plecaka) · dystans, własny i mniejszy (przewijanie) | ⚠ średnia → `OI-54` |
| **I-8** | milczenie — próg **czasowy** jest polem **CAŁEJ sceny** | ustawia go jeden panel, dziedziczą wszystkie pozostałe; w kodzie dziedziczącego **nie ma po tym śladu** | ⚠ średnia → `OI-54` |
| **I-9** | „dwa pointery pokrywają układ, na którym stoi sterowanie" | ✅ prawda — ⛔ **bez asercji.** Trzeci równoczesny palec jest wyrzucany przez silnik **bez zdarzenia i bez błędu** | ⚠ średnia → `OI-53` |

⚠ **Profil domeny: dwa twierdzenia fałszywe, sześć milczeń, jeden dług
komentarzy.** ⚙ Zero sprzeczności między kodem a *żywym* dokumentem
tematycznym — wszystkie trzy rozjazdy siedzą w **instrukcjach przy kodzie**,
czyli w miejscu, które ta domena czyta najczęściej.

---

## 4. Pomiary

**Metoda:** zliczenie wprost ze źródła (uchwyty, rejestracje, klawisze), bez
próbkowania grepem po jednym wzorcu.

| pomiar | wynik |
|---|---|
| wywołania „zatrzymaj propagację" | **40** |
| z nich z uzasadnieniem „żeby drążek nie przejął" | **4** — ⚙ i **wszystkie cztery** leżą po prawej, gdzie drążek nie zgłasza się w ogóle |
| rejestracje uchwytów wskaźnika **na poziomie sceny** | **23** w **7** widżetach |
| sesje gestu obsługujące **puszczenie poza płótnem** | **8 z 8** — ⭐ reguła trzyma się bez wyjątku |
| widżety zdejmujące swoje uchwyty przy rozbiórce sceny | **5 z 7** — ⚙ **nie jest to usterka**: silnik czyści uchwyty sceny sam; asymetria jest w dyscyplinie, nie w skutku |
| ⚠ **klawisze nazwane** związane w grze | **19** (+ klasa cyfr) w **8** widżetach |
| ⚠ **klawisze mające więcej niż jednego właściciela** | **3** |
| z nich **z bramką** rozstrzygającą, kto odpowiada | **2** *(potwierdzenie odrodzenia · zamknięcie panelu)* |
| ⛔ **bez bramki** | **1** — `E` (I-3) |
| komentarze opisujące usunięte podwójne tapnięcie | **3** |

**Co z tego wynika:**

1. ⭐ **Reguła „sesja czyta się ze sceny, po identyfikatorze, z puszczeniem poza
   płótnem" jest jedyną regułą tej domeny z pokryciem 100%.** Osiem niezależnych
   gestów, zero wyjątków — i jedyna, która była **zapisana wprost** przed tą
   ekstrakcją.
2. ⚠ **Dotyk ma trzy niezależne mechanizmy rozstrzygania sporu; klawiatura ma
   zero.** Ta nierównowaga nie wynika z decyzji — wynika z tego, że dotyk
   **musiał** ją mieć, żeby gra dała się w ogóle obsłużyć palcami, a klawiatura
   działała „wystarczająco dobrze" od pierwszego dnia.
3. ⚠ Bramki przy dwóch z trzech dzielonych klawiszy są **lokalne i różne**
   (flaga uzbrojenia · flaga otwarcia). ⛔ Nie ma wzorca, do którego trzeci
   mógłby się dołożyć — i dlatego go nie ma.

⛔ **Nie oceniam, czy 19 klawiszy to dużo.** To jest opis, nie werdykt.

---

## 5. Depozyty z `abilities` — weryfikacja

**Pytanie misji:** czy trzy rzeczy przekazane przez `abilities` są realne i kto
je konsumuje.

| depozyt | wynik |
|---|---|
| **sesja celowania kierunkowego** | ✅ realna, **czterozdarzeniowa**, z dwoma różnymi końcami. ⚙ Rozdział własności potwierdzony w kodzie: **cykl wskaźnika w wejściu, stan świata w rozgrywce** — i to jest jedyny powód, dla którego zerwanie sesji przy rozbiórce sceny w ogóle musi istnieć |
| **sposób przekazywania intencji** | ✅ — ⭐ ale dopiero pomiar pokazał, że kształtów jest **trzy**, nie dwa. `abilities` opisało zdarzenie i sesję; **ciągły stan** (trzy pola) nie należał do tamtej domeny i nigdzie nie był opisany jako **wybór kanału** |
| **„dotyk zamiast podwójnych tapnięć"** | ✅ w kodzie, w całym katalogu — ⚠ **z trzema komentarzami opisującymi stan sprzed usunięcia** (I-6) |

⚙ **Depozyty odebrane i uzupełnione:** `STAN` §1 zapisuje **regułę wyboru
kanału** (kształt wybiera TRWANIE czynności), której żaden depozyt nie niósł —
niosły **przykłady**, nie kryterium.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| kształt intencji wybiera trwanie | 🆕 **N-146** — ⭐ kryterium wyprowadzone z trzech przykładów |
| interfejs nie sięga do sceny; mosty jednopytaniowe | 🆕 **N-147** — ⚠ depozyt z `src/ui/CLAUDE.md`, **rozszerzony o drugi most** (system Back) |
| lewa prowadzi, prawa działa | 🆕 **N-148** |
| budżet dwóch palców | 🆕 **N-149** — ⛔ bez przymiaru (`OI-53`) |
| pole dotykowe ≥ próg i ≥ grafika | 🆕 **N-150** — ⚙ jedyny wymóg tej domeny wobec `ui` |
| priorytet ustala silnik | 🆕 **N-151** (I-5) |
| poziom sceny odbiera także dotyk zużyty | 🆕 **N-152** (I-5) |
| cykl wskaźnika ze sceny, po id, z `UP_OUTSIDE` | 🆕 **N-153** — ⭐ jedyna reguła z pokryciem 100% |
| celowanie nic nie kosztuje do zatwierdzenia | 🆕 **N-154** — depozyt z `abilities`, potwierdzony |
| próg zamiast zegara | 🆕 **N-155** |
| o anulowaniu decyduje puszczenie | 🆕 **N-156** |
| kierunek bez konwersji, punkt z konwersją | 🆕 **N-157** |
| tapnięcie zaznacza, przycisk wykonuje | 🆕 **N-158** — depozyt z `src/ui/CLAUDE.md`, potwierdzony pomiarem |
| odmowa nigdy nie jest cicha | 🆕 **N-159** — ⚙ **forma** odmowy zostaje w `ui`; tu wyłącznie zakaz milczenia |
| dwa źródła biegu, jedna flaga | 🆕 **N-160** — ⚙ rzadki przypadek: udokumentowane **trzy razy i zgodnie** |
| „nie skonsumowano" = odtwórz domyślne | 🆕 **N-161** |
| histereza i strefy drążka jako liczby | ➡ **ZOSTAJĄ** przy kodzie (`GameConfig.STICK`); tu tylko **reguła**, że progi są dwa |
| geometria pierścieni, kąty, promienie, hierarchia pilności | ➡ **ZOSTAJĄ** dla `ui` |
| pauza świata przy otwartym panelu | ➡ **ZOSTAJE** dla `ui` — ⚠ z wyjątkiem tego, że **klawisz potrafi ją zdjąć nie pytając** (`OI-52`) |
| ognisko wejścia dla klawiatury | ⛔ **OTWARTE** → `OI-52`, nierozstrzygane |
| jedna reguła progu gestu | ⛔ **OTWARTE** → `OI-54`, nierozstrzygane |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Komentarz może opisywać mechanizm, którego NIE MA — i przetrwać
   dokładnie dlatego, że skutek jest poprawny** (I-1). Kontrolki po prawej
   naprawdę nie kradną dotyku drążkowi, więc reguła „działa" przy każdym
   sprawdzeniu **przez objaw**. ⛔ Fałsz widać wyłącznie po przeczytaniu, **czym
   naprawdę jest kanał anulowania silnika** — a to jest lektura biblioteki, nie
   projektu. ⚙ Ten sam katalog ma opis poprawny (przy panelu) i cztery kopie
   niepoprawnego; ⭐ **kopiowany jest ten krótszy**.

2. ⚠⚠ **Dwie połowy jednego czasownika trafiły do dwóch widżetów i nikt tego
   nie zauważył, bo każda z osobna jest poprawna** (I-3). Otwieranie rozmowy
   przeniesiono świadomie („`E` traci połowę otwierającą"), a zamykanie zostało
   — obie decyzje mają w kodzie uzasadnienie i obie są dobre. ⛔ **Zły jest
   dopiero ich SKUTEK ŁĄCZNY**, którego nie widać z żadnej z dwóch stron:
   trzeba było zliczyć **wszystkich właścicieli każdego klawisza naraz**. ⭐ To
   jest ta sama klasa, co „milczenie o KOMPOZYCJI" z `shields` i `proficiency`,
   pierwszy raz na wejściu.

3. ⚠ **Reguła bez metryki, po raz kolejny — ale tu z odwrotnym znakiem.**
   Budżet dwóch palców i „kontrolka bojowa po prawej" są przestrzegane
   **bez wyjątku**, więc nigdy nie zabolały; asercja pilnuje **rozmiaru** celów,
   bo tamta reguła **zabolała** (wszystko poza przyciskiem ataku było pod
   progiem). ⭐ **Przymiar powstaje po awarii, nie po zapisaniu reguły** —
   dokładnie ta sama obserwacja co przy `save` (`OI-50`).

4. ⚠ **Pomiar zmienił granicę domeny, nie tylko jej opis** (§1). Próg dotykowy
   wyglądał na własność układu, dopóki nie zestawiono go z faktem, że
   **grafika bywa mniejsza od pola trafienia i to jest zamierzone**. ⚙ Kryterium,
   które z tego wyszło: **czy ta liczba mówi, gdzie ląduje palec, czy co widzi
   oko**.

5. ⚠ **Rundy skracania nie dało się uniknąć planem** (20,6 → 19,4 KB). ⚙ Powód
   jest strukturalny, nie redakcyjny: ta domena **nie ma jednego mechanizmu
   z wariantami**, tylko **dziewięć niezależnych reguł o wspólnym temacie** —
   nie ma czego zwinąć w tabelę, bo nic się nie powtarza. ⭐ **Plan cięcia
   trafnie wybrał, CO opisać, i nie potrafił przewidzieć, ILE to zajmie.**

⚙ **Co zadziałało:** przeczytanie **biblioteki**, a nie tylko projektu (bez tego
I-1 i I-5 są niewidzialne), oraz **zliczenie właścicieli per klawisz** zamiast
sprawdzania klawiszy po kolei.

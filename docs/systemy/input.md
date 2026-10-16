---
typ: STAN
domena: input
tytul: Wejście — intencja, arbitraż, gest
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check]
kotwice:
  - src/core/InputState.ts
  - src/ui/VirtualJoystick.ts
  - src/ui/AbilityBar.ts
  - src/ui/ControlLayout.ts
  - src/core/BackHandler.ts
  - GameConfig.STICK.runEngage
  - GameConfig.STICK.turnZoneFrac
  - GameConfig.ABILITY_AIM.deadzonePx
  - GameConfig.HUD_LAYOUT.minTouch
otwarte: [OI-54]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-11
---

# Wejście — intencja, arbitraż, gest

> **Czym jest ten dokument.** Odpowiedzią na pytanie **co gracz robi
> urządzeniem i jak ta czynność dociera do rozgrywki**: jakim kanałem, kto
> rozstrzyga spór o ten sam dotyk i po czym poznajemy, czy palec tapnął, czy
> przeciągnął.
>
> **Czym NIE jest.** ⛔ **Nie mówi, gdzie stoi którykolwiek przycisk ani jak
> wygląda** — to jest `ui`. Nie mówi też, co dzieje się **po** dotarciu
> intencji; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| jak czynność palca/klawisza staje się intencją i kto ją dostaje | **`input`** |
| kto rozstrzyga spór o ten sam dotyk | **`input`** |
| co odróżnia tapnięcie od przeciągnięcia | **`input`** |
| **gdzie** stoi przycisk, jak duży jest i co pokazuje | `ui` |
| co rysuje podgląd celowania, ✕ i pierścień biegu | `ui` |
| co robi zdolność po zatwierdzeniu kierunku | `abilities` |
| co znaczy zbocze naciśnięcia ataku | `combat` |
| co robi wektor ruchu z prędkością | `movement` |
| pauza świata i koszt biegu | `ui`, `stamina` |

⚠⚠ **Ta domena nie wie, co znaczy żadna z intencji, które przenosi.** Wie
tylko, **czym jest** czynność gracza i **komu ją oddać**.

⚠ **Jeden wymóg biegnie w drugą stronę: `input` stawia warunek `ui`.** Pole
dotykowe nie może być mniejsze od `HUD_LAYOUT.minTouch` **ani od własnej
grafiki** (§3).

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `input` **daje** | `movement` | wektor ruchu i flagę biegu |
| `input` **daje** | `combat` | stan „atak trzymany" |
| `input` **daje** | `abilities` | żądanie użycia i **sesję celowania** |
| `input` **pyta** | `world` | ⚠ **czy pod palcem jest coś ze świata** — jedno pytanie, jedna odpowiedź |
| `input` **wymaga od** | `ui` | minimalnego pola dotykowego |

---

## 1. Trzy kształty intencji

⚠⚠ **Kształt wybiera się po TRWANIU czynności, nigdy po tym, czyja to
kontrolka.**

| kształt | czym jest | jak jedzie |
|---|---|---|
| **ciągły** | trwa tyle, ile trwa nacisk: kierunek marszu, bieg, atak trzymany | **wspólnym stanem**, odczytywanym raz na klatkę |
| **chwilowy** | zdarza się raz: użyj zdolności, użyj mikstury, zagadaj, wstań | **zdarzeniem** |
| **sesja** | ma początek, przebieg i **dwa różne końce** | ⚠ **czterema zdarzeniami** |

⚠ **Mieszanie kształtów jest zakazane wprost.** Intencja ciągła wysłana
zdarzeniem znaczy „raz na naciśnięcie" i gubi trzymanie; chwilowa trzymana
w stanie odpala się co klatkę.

⭐ **Ciągłych jest dokładnie trzy** i to jest cały wspólny stan wejścia.
Wszystko inne jest chwilowe albo jest sesją.

---

## 2. Kontrakt: co wolno przenieść

⚠⚠ **Interfejs nigdy nie sięga do sceny gry.** Widżet nie ma prawa znaleźć
rozgrywki i jej czegoś kazać — rozmawia z nią wyłącznie przez wspólny stan,
emiter akcji i szynę zdarzeń.

⚠ **Jest dokładnie JEDEN wyłom i jest jednopytaniowy: most hit-testu.**
Odpowiada „czy pod tym wskaźnikiem jest coś ze świata" i ⛔ **nie niesie ani
celu, ani ruchu, ani referencji do niczego**. Powód jest techniczny, nie
stylistyczny — trafianie w obiekty liczy się **per scena**, więc kontrolka
z nakładki fizycznie nie może zobaczyć wroga (§4).

⚠ **Most rejestruje się na KOŃCU budowy świata i zeruje przy jego rozbiórce.**
Inaczej po przebudowie sceny odpytuje listę **poprzedniej mapy**, a na ekranie
tytułowym wetuje gałkę na zawsze — objaw brzmi „drążek przestał działać".

---

## 3. Podział ekranu i budżet palców

```
LEWA POŁOWA    prowadzi   — pływający drążek, baza tam, gdzie dotkniesz
PRAWA POŁOWA   działa     — atak, zdolności, warianty, przedmiot, interakcja
```

⚠⚠ **To nie jest układ HUD-u, tylko reguła WEJŚCIA.** Drążek zgłasza się po
**każde** dotknięcie lewej połowy, a nie po dotknięcie własnego kółka — więc
kontrolka postawiona po lewej biłaby się z prowadzeniem o ten sam palec.
⛔ Nowa kontrolka bojowa nie ma prawa stanąć po lewej.

⚠⚠ **Budżet to DWA równoczesne palce i jest ustawiony jawnie.** Silnik daje
domyślnie **jeden** i **po cichu wyrzuca** drugie dotknięcie — bez zdarzenia,
bez błędu. Objaw sprzed poprawki: trzymając drążek, nie dało się nacisnąć
niczego po prawej stronie ekranu.

⚠ **Trzecia kontrolka wymagająca RÓWNOCZESNEGO trzeciego palca nie zadziała**,
dopóki ktoś świadomie nie podniesie tej liczby. ⛔ Nic tego nie pilnuje
(OI-53).

⚠ **Palec dostaje CAŁE pole komórki, grafika może być mniejsza.** Cel dotykowy
większy od rysunku jest techniką, nie oszustwem: pozwala zejść z wagą wizualną
kontrolki bez zejścia poniżej progu. Progu pilnuje asercja w buildzie
deweloperskim.

---

## 4. Arbitraż: kto dostaje ten dotyk

⚠⚠ **Priorytet wejścia ustala SILNIK, a nie kod tej gry.** Kolejność jest
stała i przechodzi przez trzy sita:

```
1. scena WYŻSZA pierwsza          nakładka przed światem
2. w scenie: obiekt NA WIERZCHU   tylko jeden, nie wszyscy pod palcem
3. dopiero potem poziom SCENY     odbiera KAŻDY dotyk, także już zużyty
```

⚠⚠ **Sito 1 jest twarde: gdy nakładka trafiła w cokolwiek interaktywnego, świat
nie zobaczy tego wskaźnika w ogóle.** Dlatego tapnięcie „przez przycisk"
w stojącego pod nim wroga jest niemożliwe **bez ani jednej linii kodu**.

⚠⚠ **Sito 3 nie niesie informacji, czy dotyk został już zużyty** — i to jest
cały powód, dla którego drążek broni się sam. Robi to **dwoma** hit-testami:
lokalnym (własne przyciski nakładki) i przez most (świat). ⭐ **Podwójny
hit-test jest ręcznym POWTÓRZENIEM porządku, który silnik już ustalił** — nie
drugim, konkurencyjnym mechanizmem.

⚠ **Lokalny test sam nie wystarcza i to jest zmierzone**: nad wrogiem zwracał
zero — i baza drążka lądowała na przeciwniku, którego gracz właśnie tapał.

⛔ **Zatrzymanie propagacji zdarzenia przeglądarki NIE jest częścią tego
arbitrażu.** Kanał anulowania silnika to osobny argument uchwytu, którego ten
kod nigdzie nie używa; poziom sceny odpala się mimo wszystko. **Porządek trzymają
hit-testy i podział na połowy, nie propagacja.**

⚠ **Panel jest interaktywny na CAŁEJ powierzchni** — żeby dotknięcie jego
pustego miejsca miało w co trafić i nie zostało uznane przez drążek za wolne.

---

## 5. Sesja celowania

**Jedyna intencja, która ma przebieg.** Kontrakt jest czterozdarzeniowy:
**start → ruch → zatwierdzenie albo zerwanie**.

| reguła | treść |
|---|---|
| **cykl pointera należy do wejścia** | id zapamiętane przy naciśnięciu, wszystko dalsze filtrowane po nim |
| **stan świata należy do rozgrywki** | wejście nie wie, w co celuje |
| **jedna sesja naraz** | drugi palec prowadzi, nie celuje |
| **naciśnięcie nic nie kosztuje** | koszt i cooldown płaci **wyłącznie** zatwierdzenie |
| **próg zamiast zegara** | podgląd rusza natychmiast; o tapnięciu vs. przeciągnięciu rozstrzyga **dystans przy puszczeniu** |
| **kierunek jest zatrzaskowy** | po przekroczeniu progu powrót palca do środka nie wraca do zwrotu postaci |
| **anulowanie decyduje PUSZCZENIE** | przejechanie przez strefę w drodze na drugą stronę nie przerywa niczego |
| **strefą anulowania jest SAM przycisk** | każde inne miejsce leży w jakimś **kierunku**, czyli zabierałoby ten kierunek celowaniu |
| **śmierć sceny zabija sesję** | inaczej świat zostaje z podglądem i bez zatwierdzenia |

⚠ **Próg anulowania jest WIĘKSZY od progu celowania i to jest zamierzone:**
pomyłka w jedną stronę kosztuje cooldown, w drugą nie kosztuje nic.

⚠ **Tapnięcie bez przeciągnięcia niesie „brak kierunku", nie zero.** Rozgrywka
czyta to jako **intencję domyślną**; cel ręcznie wskazuje przeciągnięcie albo
drugi tryb *(`abilities`)*.

⭐ **Drugi tryb: „dotknij, potem cel"** (ustawienie, 2026-10-14): naciśnięcie
UZBRAJA sesję, dotknięcie świata ją zatwierdza (punkt → grunt kamerą świata),
ten sam przycisk ją zdejmuje. Łapacz pod HUD-em zabiera ten dotyk drążkowi
i światu. ⚠ Tylko zdolności z podglądem.

---

## 6. Trzy progi, trzy jednostki

⚠⚠ **Ta gra rozstrzyga „tapnięcie czy przeciągnięcie" w trzech miejscach i za
każdym razem inaczej.**

| gdzie | czym mierzy |
|---|---|
| celowanie zdolnością | **dystansem** palca od środka przycisku |
| siatka plecaka | **czasem** przytrzymania |
| przewijana lista | **dystansem**, własnym i mniejszym |

⚠⚠ **Próg czasowy jest własnością CAŁEJ sceny, nie panelu, który go ustawił.**
Ustawia go jeden panel, a dziedziczą wszystkie pozostałe — bez pytania i bez
śladu w kodzie tego, który dziedziczy. ⛔ Czy to jest jedna reguła z trzema
strojeniami, czy trzy różne pytania — **nierozstrzygnięte** (OI-54).

---

## 7. Cykl życia wskaźnika i przestrzenie

⚠⚠ **Gest czyta się z listenerów SCENY, nigdy z obiektu kontrolki.** Zdarzenia
obiektu przestają lecieć, gdy palec z niego zjedzie — a przy celowaniu i przy
przewijaniu zjeżdża natychmiast.

**Wzorzec jest jeden i obowiązuje wszystkie gesty:** zapamiętaj identyfikator
wskaźnika przy naciśnięciu → filtruj po nim ruch i puszczenie → ⚠ **osobno
obsłuż puszczenie POZA płótnem**. Bez tej ostatniej pary gest zostaje otwarty
na zawsze.

⚠ **Współrzędne wskaźnika są w pikselach EKRANU i wymagają jawnego
przeliczenia** do przestrzeni, w której leżą kontrolki. Bez tego baza drążka
ląduje wyraźnie obok palca.

⚠ **Wyjątek nie jest wyjątkiem, tylko innym pytaniem: KIERUNEK nie wymaga
konwersji, PUNKT wymaga.** Obie kamery skalują jednakowo i nie obracają, więc
znormalizowany wektor delty jest tym samym wektorem w świecie. ⛔ Nie dokładaj
tam przeliczeń „dla porządku".

---

## 8. Czasowniki dotyku

⚠⚠ **Podwójne tapnięcie jest złym czasownikiem i nie występuje w tej grze.**
Kosztowało realnym opóźnieniem (inna akcja musiała czekać, żeby nie odpalić się
na jego pierwszej połowie) i było niewidoczne — nic na ekranie nie mówiło, że
ten gest istnieje.

**Obowiązujący rozkład czynności:**

| czynność | znaczenie |
|---|---|
| **tapnięcie** | ZAZNACZA — nigdy nie wykonuje akcji nieodwracalnej |
| **przycisk pod kartą** | wykonuje |
| **przytrzymanie** | podnosi do przeniesienia (siatka plecaka) |
| **przeciągnięcie** | celuje albo przewija |
| **tapnięcie w cel w świecie** | wybiera cel; ponowne — **rezygnuje** |

⚠ **Akcja odpala się na PUSZCZENIU, nie na naciśnięciu** — na naciśnięciu
każde porządkowanie plecaka liczyłoby się też jako kliknięcie.

⚠ **Odmowa musi mieć powód.** Przycisk niedostępny zostaje **widoczny
i wyszarzony z powodem**, a cisza po naciśnięciu jest na dotyku nieodróżnialna
od zepsutej kontrolki. ⚙ *Formę odmowy prowadzi `ui`; tutaj obowiązuje sam
zakaz milczenia.*

⛔ **„Tapnięcie w puste podłoże" jest zajęte i nie wolno mu nic przypisać** —
lewa połowa należy do prowadzenia.

---

## 9. Klawiatura i system Back

⚠⚠ **Klawiatura jest wejściem RÓWNOLEGŁYM i celowo NIEPEŁNYM** — nie odwzorowuje
dotyku i nie ma takiego obowiązku. Docelowym urządzeniem jest telefon
w orientacji poziomej, zablokowanej natywnie.

⚠⚠ **WYCHYLENIE MA TRZY ZNACZENIA** (2026-09-11): poniżej progu obrotu — **zwrot
w miejscu**; do promienia — marsz; powyżej `runEngage` — bieg.

⚠⚠ **OBRÓT NIE JEST RUCHEM** (N-162): flaga ruchu zostaje fałszem, więc obrót
**nie wstrzymuje zamachu** — inaczej strefa nie dawałaby nic. Powstała, bo dotąd
**jedynym sposobem zmiany zwrotu był KROK**. ⚠ Próg = promień rysowanej gałki,
więc granicy nie trzeba dorysowywać.

⚠ **Bieg ma DWA źródła i jedną flagę** (N-160): dotyk — strefa z histerezą
(inaczej drżenie kciuka przełączałoby go kilka razy na sekundę), klawiatura —
własny klawisz, bo tam wektor jest zawsze jedynką. Dlatego **obrót w miejscu też
nie ma na niej strefy**.

⚠⚠ **Klawiatura NIE MA ogniska wejścia.** Dotyk ma arbitraż (§4); klawisze nie
mają żadnego — uchwyty są globalne dla nakładki i działają także wtedy, gdy
ekran należy do panelu albo do rozmowy. ⛔ **Jeden klawisz ma dziś dwóch
właścicieli bez uzgodnienia** (OI-52).

⚠ **Sprzętowy Back to TRZECIE drzwi do tego samego cofnięcia**, obok klawisza
i przycisku; jego most jest jednopytaniowy tak samo jak most hit-testu.
⚠⚠ **Podpięcie się pod Back ZASTĘPUJE domyślne zachowanie systemu**, więc
odpowiedź „nikt tego nie skonsumował" znaczy **„odtwórz domyślne własnoręcznie"**.

---

## 10. Niezmienniki

- **N-146** — **kształt intencji wybiera TRWANIE**: ciągła idzie stanem,
  chwilowa zdarzeniem, sesja czterema zdarzeniami (§1).
- **N-147** — **interfejs nie sięga do sceny gry**; jedyne mosty odpowiadają na
  **jedno pytanie** i nie niosą stanu (§2, §9).
- **N-148** — **lewa połowa prowadzi, prawa działa**; ⛔ kontrolka bojowa nie ma
  prawa stanąć po lewej (§3).
- **N-149** — **budżet to dwa równoczesne palce**; trzeci jest po cichu
  wyrzucany przez silnik (§3).
- **N-150** — **pole dotykowe ≥ próg i ≥ grafika** kontrolki (§3).
- **N-151** — **priorytet wejścia ustala silnik**; kod ma prawo go najwyżej
  **powtórzyć**, nigdy podmienić (§4).
- **N-152** — **poziom sceny odbiera każdy dotyk, także zużyty** — dlatego
  odbiorca musi sprawdzić sam, czy dotyk należał do kogoś innego (§4).
- **N-153** — **cykl wskaźnika czyta się ze sceny**, po identyfikatorze,
  z obsługą puszczenia poza płótnem (§7).
- **N-154** — **celowanie nic nie kosztuje aż do zatwierdzenia** (§5).
- **N-155** — **o tapnięciu rozstrzyga próg, nie zegar oczekiwania** (§5, §6).
- **N-156** — **o anulowaniu rozstrzyga puszczenie**, nie przejechanie (§5).
- **N-157** — **kierunek nie wymaga konwersji do świata, punkt wymaga** (§7).
- **N-158** — **tapnięcie zaznacza, przycisk wykonuje**; ⛔ zero ukrytych gestów
  i zero podwójnych tapnięć (§8).
- **N-159** — **odmowa nigdy nie jest cicha** (§8).
- **N-160** — **bieg ma dwa źródła i jedną flagę**; strefa z histerezą na
  dotyku, osobny klawisz na klawiaturze (§9).
- **N-162** — **wychylenie ma trzy znaczenia (obrót / marsz / bieg), a OBRÓT
  NIE JEST RUCHEM**: nie zapala flagi ruchu, więc nie wstrzymuje zamachu (§9).
- **N-161** — **„nie skonsumowano" znaczy „odtwórz domyślne"**, nie „nic nie
  rób" (§9).

---

## 11. Checklista

**Nowa kontrolka:** **po prawej** (N-148) · policz palce (N-149) · pole ≥ progu
(N-150) · ⛔ bez ukrytego gestu (N-158) · nazwij powód odmowy (N-159).

**Nowy gest:** czytaj ze **sceny**, po identyfikatorze, z puszczeniem poza
płótnem (N-153) · wybierz próg świadomie (N-155, OI-54) · sprawdź, czy dotyk
nie należał do kogoś innego (N-152).

**Nowa intencja:** rozstrzygnij **kształt** przed kanałem (N-146) · ⛔ przez most
nic poza odpowiedzią na jedno pytanie (N-147).

**Nowy klawisz:** ⚠ zapytaj `ui/KeyFocus` — klawisz świata `worldMay(e)`,
modal `consume(e)` (OI-52).

**Bramki:** `npx tsc --noEmit` · `npm run build` · `node tools/hud_uklad.mjs` ·
`node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| trzy kształty intencji, jeden wspólny stan | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| interfejs nie sięga do sceny; most na jedno pytanie | ✅ | ✅ | `kod:2026-09-06` |
| podział lewa/prawa | ✅ | ✅ | `kod:2026-09-06` |
| budżet dwóch pointerów | ✅ | ✅ | ❌ **brak asercji** — OI-53 |
| pole dotykowe ≥ próg i ≥ grafika | ✅ | ✅ | ✅ asercja *(sam próg)* |
| priorytet wejścia (scena → obiekt → scena) | ✅ *(silnik)* | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| podwójny hit-test drążka | ✅ | ✅ | `reka:2026-08-23` |
| sesja celowania: cztery zdarzenia, dwa końce | ✅ | ✅ | ❌ **playtest niewykonany** |
| trzy progi gestu w trzech jednostkach | ✅ | ✅ *(opisane po raz pierwszy)* | ❌ **nieuzgodnione** — OI-54 |
| cykl wskaźnika: id + puszczenie poza płótnem | ✅ | ✅ | `kod:2026-09-06` |
| kierunek bez konwersji, punkt z konwersją | ✅ | ✅ | `kod:2026-09-06` |
| **trzy strefy wychylenia; obrót nie zapala flagi ruchu** | ✅ | ✅ | ❌ **próg niesprawdzony ręką** — OI-88 |
| tapnięcie zaznacza, przycisk wykonuje | ✅ | ✅ | `reka:2026-08-27` *(częściowo)* |
| ognisko wejścia dla klawiatury | ✅ `ui/KeyFocus` | ✅ | `runtime:2026-10-09` |
| system Back jako trzecie drzwi | ✅ | ✅ | ❌ **tylko build natywny** |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-52** | ✅ **ZAMKNIĘTE 2026-10-09** — `ui/KeyFocus`: właściciel ekranu (rozmowa/panel) + zużycie naciśnięcia. Zmierzone: `E` zamyka rozmowę bez ponownego otwarcia, `C`/`B` nie otwierają panelu na rozmowie, `E` nie zaczyna rozmowy pod panelem. |
| **OI-53** | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/hud_uklad.mjs` §7 (kontrolki i minimapa poza strefą drążka, granica czytana z `VirtualJoystick.ts`) i §8 (`activePointers` ≥ 2 w `main.ts`); oba świecą po celowym zepsuciu. |
| **OI-54** | ⚠ **Trzy progi na to samo pytanie, w dwóch różnych jednostkach — i jeden z nich jest globalny dla sceny.** Próg czasowy ustawia jeden panel, a dziedziczą go wszystkie pozostałe, bez śladu w ich kodzie. ⚠ **To nie musi być błąd** — długie przytrzymanie w siatce i szarpnięcie na liście to mogą być dwa różne pytania. ⛔ **Nie rozstrzygam**, czy sprowadzić je do jednej reguły; potrzebne jedno zdanie autora. |

---

## Czego ten dokument nie rozstrzyga

- **Gdzie stoi którakolwiek kontrolka, jak duża jest i co pokazuje** — `ui`.
- **Czy dzisiejsza ergonomia jest dobra** — układ, promienie i kąty należą do
  `ui`.
- **Co robi którakolwiek zdolność po zatwierdzeniu kierunku** — `abilities`.
- **Co znaczy zbocze naciśnięcia ataku** i dlaczego puszczenie przycisku nie
  przerywa autoataku — `combat`.
- **Co robi wektor ruchu z prędkością** — `movement`.
- **Ile kosztuje bieg i unik** — `stamina`.
- **Pauzy świata, modalności paneli i wyszarzeń** — `ui`.
- **Skali interfejsu, DPR i ostrości tekstu** — `presentation`.
- ⛔ **Żadnego pojedynczego przycisku, ekranu ani zdolności** — to jest content,
  nie system.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| most hit-testu zamiast sięgnięcia do sceny; pomiar nad wrogiem | `src/core/InputState.ts` *(przy kodzie)* | ACTIVE |
| trzy strefy drążka, histereza, rachunek na milimetry | `GameConfig.STICK` *(przy kodzie)* | ACTIVE |
| obrót w miejscu: powód i wycena progu | `docs/odlozone.md` §2 | ACTIVE |
| całość reguł dotyku, pointerów i paneli | `src/ui/CLAUDE.md` | ACTIVE |
| język celowania: progi, strefa anulowania, odrzucone warianty | `docs/systemy/abilities.md`, §4.1 | ACTIVE |
| dlaczego zniknęło podwójne tapnięcie — pełny rachunek kosztu | `docs/sklep_migracja_wzorca.md` | ACTIVE |
| stan maszyny gestu w siatce plecaka i próg czasowy | `docs/inventory_scroll_ux.md` | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_input.md` | — |

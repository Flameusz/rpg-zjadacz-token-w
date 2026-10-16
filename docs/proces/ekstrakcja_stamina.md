---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena stamina
stan: zamkniety
kotwice: [src/core/Stamina.ts, src/core/Progression.ts]
otwarte: [OI-16, OI-17, OI-18, OI-19]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Canon Extraction — `stamina`

Trzecia domena. Pierwsza, w której **kod, zamierzony model i stan historyczny
to trzy różne rzeczy naraz** — i dlatego §2 jest rozpisana potrójnie.

---

## 1. Trzy warstwy — czym się różnią i skąd pochodzą

| warstwa | źródło | co znaczy |
|---|---|---|
| **CURRENT IMPLEMENTATION** | `src/core/Stamina.ts`, `Progression.swingStaminaCost`, `GameConfig.STAMINA` | co kod robi dziś |
| **INTENDED DESIGN** | `bieglosc_checkpoint.md` §24a (ekonomia wysiłku, sesja 2, ZAMKNIĘTE) | model wynikający z **obowiązujących** decyzji |
| **HISTORICAL STATE** | `stamina_model.md` §9 (wdrożenie 2026-08-21), `stamina_ocena.md`, `stamina_model_ocena.md` | jak było i co to uzasadniało |

⚠ **Kluczowe rozróżnienie tej domeny:** obowiązującym modelem projektowym
**nie jest** `stamina_model.md`, tylko §24a checkpointu Biegłości — bo to on
przebudował ekonomię wysiłku 2026-09-02. `stamina_model.md` pozostaje
obowiązujący dla **kierunku i pomiarów**, a jest historyczny dla **liczb
autoataku i regeneracji**. To jest podział wewnątrz jednego dokumentu,
dokładnie jak przy A-8.

---

## 2. Stan potrójny — tabela

Legenda: ✅ zgodne we wszystkich trzech · ⚠ rozbieżność.

| rzecz | CURRENT (kod) | INTENDED (§24a) | HISTORICAL (`stamina_model.md` §9.2) | |
|---|---|---|---|---|
| pula | `base` + CON × `perConditioning` | — | to samo | ✅ |
| progi zmęczenia | 45 / 25, bezwzględne | — | to samo | ✅ |
| kara „Zmęczony" | odzyskanie ×1,15, tempo bez zmian | — | to samo | ✅ |
| kara „Wyczerpany" | tempo ×0,8, odzyskanie ×1,4 | — | to samo | ✅ |
| unik | 15 × obciążenie | — | to samo | ✅ |
| blok | koszt z tarczy (3 / 5) | — | to samo | ✅ |
| przyjęty cios | próg 9, +1/pkt, sufit 12 | — | to samo | ✅ |
| sprint | 10/s × obciążenie, prędkość ×1,6 | — | ⚠ **„sprint NIE ISTNIEJE w grze; to propozycja"** | ⚠ |
| obciążenie | udźwig 20 + 2,5×STR, progi 0,55 / 0,9 | — | to samo | ✅ |
| **koszt autoataku** | `C × zamach × (1 − Mastery)`, `C = 11` | **to samo** | ⚠ **płaski `1`** | ⚠ |
| **regeneracja** | **dwa tempa: 3 / 4**, przełącznik = **wysiłek** | ⚠ **3 „w walce" / 4 „poza walką" + „×1,5 bez zmian"** | ⚠ **4 ciągła ×1,5 po 5 s** | ⚠⚠ |
| **obciążenie — zasięg** | trzy miejsca czytają `loadMultiplier` | ⚠ **„dotyka wyłącznie uniku i sprintu i tak ma zostać"** | to samo co INTENDED | ⚠ |

⚠ **Osiem z dwunastu pozycji jest zgodnych we wszystkich trzech warstwach.**
`stamina_model.md` §9.2 jest **dokładny we wszystkim poza regeneracją
i autoatakiem** — i to jest ważne, bo baner „nie cytuj liczb z tej tabeli",
który sam dopisałem w Etapie 1, był **za szeroki**. Poprawione przy tej ekstrakcji.

---

## 3. Konflikty do rozstrzygnięcia — NIE ROZSTRZYGNIĘTE

### K-S1 · Regeneracja — trzy modele, jeden wewnętrznie sprzeczny ⚠⚠

| warstwa | co mówi |
|---|---|
| HISTORICAL | `4/s ciągła · ×1,5 po 5 s bez wysiłku` → efektywnie 4 i 6 |
| INTENDED | `3 pkt/s W WALCE · 4 pkt/s POZA WALKĄ (×1,5 po odpoczynku, bez zmian)` |
| CURRENT | `regenPerSecond: 3`, `regenRestedPerSecond: 4`; komentarz w kodzie: **„DWA TEMPA, nie jedno z mnożnikiem"** |

⚠⚠ **INTENDED przeczy sam sobie:** `3 × 1,5 = 4,5`, nie 4. Dopisek „×1,5 …
bez zmian" jest resztą po poprzednim modelu, przeniesioną do nowego bez
przeliczenia. Kod wybrał liczby (3 i 4) i **jawnie odrzucił mechanizm mnożnika**.

**Czego NIE da się ustalić z dokumentów:** czy górne tempo `4` to wartość
zamierzona, czy pozostałość. Jeśli intencją było „×1,5 od nowej bazy",
powinno być `4,5`.

⛔ **Nie zmieniam.** Uzasadnienie liczby `3` jest w §24a policzone i mocne
(*„regen musi zejść poniżej 3,96, żeby atak w ogóle drenował"*); dla liczby `4`
takiego wyliczenia **nie ma nigdzie**. To jest decyzja autora, nie poprawka.

### K-S2 · Koszt autoataku — rozjazd, który NIE jest błędem

| warstwa | co mówi |
|---|---|
| HISTORICAL | płaski `1` za cios |
| INTENDED | `C × t_zamachu × (1 − redukcja_Mastery)`, `C = 11 pkt/s` |
| CURRENT | to samo, **plus korekta z 2026-09-05**: długość liczona bez przyspieszenia Dual Wieldu |

✅ **Kod = intencja + późniejsza, udokumentowana poprawka.** Zapis „Autoatak 1"
w `stamina_model.md` §9.2 jest **HISTORICAL, nie usterką implementacji** —
model zmieniono świadomie, a dokument staminy nie został o tym powiadomiony.

⚠ To jest przypadek, przed którym ostrzegałeś: **rozjazd dokument ↔ kod nie
oznacza błędu w kodzie.** Tu oznacza dług dokumentacyjny po zmianie modelu
dokonanej w **innym** dokumencie.

### K-S3 · Kryterium przełączania regeneracji — częściowe zastąpienie (wzorzec A-8)

INTENDED mówi **„w walce / poza walką"**. CURRENT mówi **„wysiłek / brak
wysiłku"**, a komentarz w kodzie dodaje: ⛔ *„nie ma tu pojęcia »w walce«
i nie trzeba go dorabiać"*.

➡ **§24a zostało częściowo zastąpione przez własne wdrożenie:** liczby przyjęto,
sformułowanie odrzucono. **Część ACTIVE:** dwa tempa, wartość 3, uzasadnienie
przez drenaż. **Część SUPERSEDED:** „w walce" jako kryterium oraz „×1,5".
**Czym zastąpione:** implementacją z 2026-09-02 (`Stamina.tick`).

### K-S4 · Ile mechanik dotyka obciążenie

Twierdzenie „**dokładnie dwie: unik i sprint**" występuje w **czterech**
miejscach: `src/core/CLAUDE.md`, `src/entities/Player.ts`,
`src/ui/ItemTooltip.ts` (usunięty 2026-10-13) oraz `bieglosc_checkpoint.md` §24a.

Kod czyta `Equipment.loadMultiplier` w **trzech** miejscach: koszt uniku, koszt
sprintu i **bramka premii do szansy uniku** (`DEFENSE.dodge.lightLoadBonus`).

⚠ **To NIE jest jednoznaczny błąd i audyt zaokrąglił to zbyt mocno.** `D-8`
nazwał to „trzecim konsumentem". Precyzyjniej:

- odczyt **„mnożnik kosztu"** → twierdzenie **prawdziwe** (dwa koszty);
- odczyt **„co czyta obciążenie"** → twierdzenie **fałszywe** (trzy miejsca).

Trzeci punkt nie mnoży kosztu — bramkuje premię. ⛔ **Nie rozstrzygam, która
intencja obowiązuje**; wymaga jednego zdania od autora, po którym poprawia się
albo kod, albo cztery komentarze.

### K-S5 · „Sprint nie istnieje w grze"

`stamina_model.md` §2 wymienia sprint wśród **propozycji**. Kod ma dokładnie te
liczby wdrożone. ➡ HISTORICAL, propozycja stała się implementacją.

---

## 4. Rejestr decyzji z ich MOCĄ

| id | decyzja | moc | uwagi |
|---|---|---|---|
| **S-1** | `spend()` nigdy nie odmawia — stamina to nie mana | ✅ `ACTIVE` | niezmiennik nadrzędny; trzyma Kondycję jako atrybut opcjonalny |
| **S-2** | Stamina jako zasób **serii starć**, nie jednej walki | ✅ `ACTIVE` | powstała z obalenia S-3 |
| **S-3** | Stamina jako zasób **jednej walki** | `SUPERSEDED` | zastąpiona przez S-2; obalona pomiarem „walka trwa 0,6–3,8 s, zasób nigdy nie wiąże" |
| **S-4** | „Zmęczony" nie rusza tempa ataku (tylko „Wyczerpany") | ✅ `ACTIVE` | domyka spiralę zmęczenia |
| **S-5** | Pełna stamina po odrodzeniu | ✅ `ACTIVE` | — |
| **S-6** | Sprint wymaga staminy > 0 — jedyna twarda bramka | ✅ `ACTIVE` | nie łamie S-1: podstawowe jest chodzenie |
| **S-7** | Płaski koszt autoataku `1` | `SUPERSEDED` | zastąpiony przez S-8 (§24a, 2026-09-02) |
| **S-8** | Koszt ∝ długość zamachu, `C = 11 pkt/s` | ✅ `ACTIVE` | uzasadnienie: `zamach/cd` jest niezmiennikiem Zręczności |
| **S-9** | DW nie może być tańszy — wysiłek bez przyspieszenia DW | ✅ `ACTIVE` | dołożone 2026-09-05, zmierzone (3,71/s vs 3,96/s) |
| **S-10** | Regeneracja `4/s ciągła × 1,5 po odpoczynku` | `SUPERSEDED` | zastąpiona przez S-11 |
| **S-11** | Regeneracja: dwa tempa, `3` przy wysiłku | ⚠ `ACTIVE` **częściowo** | **ACTIVE:** dwa tempa i wartość `3` (policzona). **OPEN:** wartość górnego tempa i to, czy kryterium miało brzmieć „walka" czy „wysiłek" — K-S1, K-S3 |
| **S-12** | Koszt przyjętego ciosu jako **krzywa**, nie próg binarny | ✅ `ACTIVE` | próg binarny stał na urwisku |
| **S-13** | Obciążenie dotyka wyłącznie uniku i sprintu | ⚠ `OPEN` | K-S4 — prawdziwe lub fałszywe zależnie od odczytu |
| **S-14** | Wejście sprintu przez wypchnięcie gałki do 0,92 | `SUPERSEDED` | zastąpione dwustrefowym drążkiem z histerezą (2026-08-21); **powód: strefa marszu miała promień 6,5 mm, chodzenie było fizycznie niewykonalne** |
| **S-15** | Cooldown uniku zostaje 6 s, nietknięty | ✅ `ACTIVE` | świadome pominięcie: zmiana cooldownu to zmiana timingu walki |
| **S-16** | „Nie projektuj systemu pod dzisiejszą liczbę umiejętności" | ✅ `ACTIVE` | ⚠ sama reguła cytowała liczbę („pięć"), która zestarzała się w sześć dni — dziś jest ich dziewięć |
| **S-17** | Stosunek kosztów unik : umiejętność : blok | ❓ `OPEN` | pasmo poszerzyło się do 10–18; czeka na playtest |
| **S-18** | Wagi przedmiotów to pierwsze przybliżenie | ❓ `OPEN` | sprawdzone tylko, że klasy wychodzą tam, gdzie miały |

---

## 5. Co należy do INNYCH domen

| co | domena |
|---|---|
| co daje punkt Kondycji | `attributes` ✅ przeniesione |
| `weight` jako pole przedmiotu, „plecak nie waży" | `items` ✅ przeniesione |
| koszty poszczególnych umiejętności | `abilities` |
| redukcja wysiłku z rangi Mastery | `proficiency` |
| cooldown uniku, timing walki | `combat` |
| dwustrefowy drążek i histereza sprintu (S-14) | `input` |
| pomiar tempa gry, na którym stoi kalibracja (OI-19) | `progression` / `world` |

---

## 6. Czego NIE WOLNO stracić

| co | gdzie | dlaczego |
|---|---|---|
| **pomiar obalający zasób jednej walki** („walka trwa 0,6–3,8 s") | `stamina_ocena.md` §4 | jedyne uzasadnienie S-2; bez niego ktoś zaproponuje zasób jednej walki od nowa |
| **wyliczenie, dlaczego regen to 3, a nie 4 ani 2** („`11 × 0,360 = 3,96`, regen musi zejść poniżej") | `bieglosc_checkpoint.md` §24a | jedyne uzasadnienie liczby `3`; ⚠ dla liczby `4` **nie ma odpowiednika** |
| **tabela „dlaczego nie podnieść `C` zamiast obniżać regen"** | `bieglosc_checkpoint.md` §24a | broni relatywnej ceny uniku — 8,1 zamachów na unik zamiast 6,4 |
| **dlaczego zamach, a nie root** (`zamach/cd` niezmiennikiem Zręczności) | `bieglosc_checkpoint.md` §24a | bez tego ktoś „uprości" koszt do rootu i zamieni Zręczność w stat wytrzymałościowy |
| **historia progu 0,92 na gałce** (strefa marszu = 6,5 mm) | `stamina_model.md` §9.4 | S-14; zgłoszone z rozgrywki jako „zużywamy wytrzymałość chodząc" |
| **zarzut „Zmęczony jest dekoracją"** | `stamina_model_ocena.md` | jedyne miejsce; OI-18 |
| **zarzut „model stoi na tempie chodzenia, którego nie da się wystroić"** | `stamina_model_ocena.md` | jedyne miejsce; OI-19 |

⚠ **Żadnego z trzech dokumentów staminy nie wolno zarchiwizować.**
`stamina_model.md` niesie kierunek, pomiary i S-14; oba pakiety `_ocena` są
**jedynymi** nośnikami pomiarów obalających i dwóch zarzutów, które dziś
stoją jako OI-18 i OI-19.

---

## 7. Uwagi do procedury

**Co potwierdziło się po raz trzeci:** odczyt kodu przed dokumentacją. K-S3
(kryterium „wysiłek", nie „walka") istnieje **wyłącznie w komentarzu kodu** —
żaden dokument o tym nie wie.

**Co jest nowe w tej domenie:**

- ⚠⚠ **Obowiązujący model projektowy domeny może mieszkać w dokumencie INNEJ
  domeny.** Ekonomię wysiłku przebudował checkpoint Biegłości, nie dokument
  staminy. Gdyby ekstrakcja czytała tylko „dokumenty o staminie", wzięłaby
  model historyczny za obowiązujący. **Wniosek dla kolejnych domen: szukaj
  dokumentu, który ostatni RUSZYŁ mechanikę, nie tego, który ma ją w tytule.**
- ⚠ **Zamierzony model też bywa wewnętrznie sprzeczny.** §24a podaje dwie
  liczby i zaraz obok mnożnik, który do nich nie pasuje. Nie da się tego
  „uśrednić" — to jest `OPEN`.
- ⚠ **Mój własny baner z Etapu 1 był za szeroki.** Napisałem „nie cytuj liczb
  z tej tabeli", a rozbieżne są **dwie z dwunastu** pozycji. Baner poprawiony;
  lekcja: **ostrzeżenie też ma być zmierzone.**

**Budżet:** trzecia domena, jedna sesja — ale wyłącznie dlatego, że
`stamina_model.md` jest dobrze napisany. Rozstrzygnięcie K-S1 i K-S4 wymaga
autora i **nie jest pracą dokumentacyjną**.

---

## SESSION HANDOFF

**Domena `stamina` została zaakceptowana** przez autora (2026-09-05). Dokument
`STAN` i ten zapis ekstrakcji są zamknięte.

⚠⚠ **`OI-16` i `OI-17` pozostają `OPEN` i NIE należy ich rozstrzygać podczas
kolejnej ekstrakcji.** Obie wymagają jednego zdania od autora, po którym
poprawka jest mechaniczna:

- **OI-16** — górne tempo regeneracji: `4` (jak w kodzie) czy `4,5` (jak
  wynikałoby z „×1,5" w zamierzonym modelu). Uzasadnienie liczby `3` jest
  policzone; dla górnego tempa nie ma go nigdzie.
- **OI-17** — czy „obciążenie dotyka dokładnie dwóch rzeczy" ma znaczyć
  „mnożnik kosztu" (wtedy twierdzenie jest prawdziwe), czy „co czyta
  obciążenie" (wtedy fałszywe). Rozstrzygnięcie decyduje, czy poprawia się
  kod, czy cztery komentarze.

⛔ **Nie zaokrąglaj żadnej z nich do „kod ma rację".** Ta domena jest
przykładem na to, że rozjazd dokument ↔ kod bywa długiem dokumentacyjnym po
świadomej zmianie modelu (`K-S2`), a nie usterką implementacji.

⭐ **Wynik tej domeny potwierdził regułę procesu:** obowiązujący model
projektowy domeny **mieszkał w dokumencie innej domeny** (`bieglosc_checkpoint.md`
§24a, nie `stamina_model.md`). Przy każdej kolejnej ekstrakcji szukaj
dokumentu, który **ostatni ruszył mechanikę**, a nie tego, który ma ją
w tytule. Reguła jest zapisana w `PROJECT_DOCS_CHECKPOINT.md` → `PROCESS RULES`.

**Następna domena: `armor` — nierozpoczęta.**

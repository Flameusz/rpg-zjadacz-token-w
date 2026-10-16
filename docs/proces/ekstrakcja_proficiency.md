---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena proficiency
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/bieglosc_weryfikacja.mjs, tools/combat_regresja.mjs]
otwarte: [OI-28, OI-29, OI-30, OI-31]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `proficiency`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/proficiency.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Procedura

| krok | co zrobiono |
|---|---|
| **1. KOD** | `Proficiency.ts` (131 l.), `WeaponProficiency.ts` (751 l.), `Practice.ts` (233 l.), `WeaponTraits.ts` (93 l.) w całości; wszystkie konsumenty ładunków rang w `Progression`, `DamageRoll`, `GameScene`; miejsca rzutu warstwy 2 po obu stronach; punkty wywołania praktyki; pola zapisu; `PROFICIENCY` i `PRACTICE` w całości |
| **2. DOKUMENTACJA** | `bieglosc_checkpoint.md` (258 KB — §14, §14a/b, §16, §19–§22, §27, §33, §34), `audyt_walka_progresja_2026-09-03.md` §3.2/§7.3, `audyt_projektowy_fundamentow_2026-09-03.md` D5, `konfiguracje_broni_checkpoint.md` §3, `archetypy_walki.md`, `src/core/CLAUDE.md` |
| **3. ROZJAZDY** | 8 sztuk (§2) |
| **4. DECYZJE** | 30 pozycji z mocą (§3) |
| **5. POMIAR** | sufity nauki per przeciwnik, bramki zakupu rang, symulacja osiągalności (§5) |
| **6. STAN + BRAMKA** | `docs/systemy/proficiency.md`; `doc_check`, `bieglosc_weryfikacja` (260 sprawdzeń), `combat_regresja`, `tsc` |

⚠⚠ **Ta domena odwróciła zwykły kierunek rozjazdu.** W czterech poprzednich
domenach dokumentacja była za kodem. Tutaj **dokumentacja miała rację, a kłamał
komentarz w kodzie** (P-1). Konsekwencja dla metody jest w §8.

---

## 2. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **P-1** | nagłówek `src/core/WeaponProficiency.ts`: „**Ładunki rang … NADAL NIE SĄ wdrożone** — pozycja D8" | **wszystkie cztery są wdrożone i wpięte w rozgrywkę**: redukcja kosztu zamachu, mnożnik cechy rodziny, dolne cięcie rozstrzału i minimum proporcjonalne — czyta je `Progression`, którego własny komentarz mówi „**wdrożone 2026-09-02**" | ⛔⛔ najwyższa — **dwa komentarze w tym samym `src/` przeczą sobie o tym samym fakcie**; checkpoint i `CLAUDE.md` mają rację → **OI-31** |
| **P-2** | **milczenie o ZŁOŻENIU** — nikt nie policzył, że **bramki zakupu rang leżą powyżej sufitu nauki wynikającego z rosteru** | trzy z czterech rang są dziś nieosiągalne (§5) | ⛔⛔ najwyższa — **oba składniki były zapisane osobno**, iloczyn nie → **OI-28** |
| **P-3** | `bieglosc_checkpoint.md` §33.1: „autoatak `true`; **5 umiejętności** `false`" | **cztery** akcje gracza deklarują `allowFumble`, wszystkie `false` | ⚠ niska — liczba nie pasuje ani do tamtego dnia, ani do dziś |
| **P-4** | korpus `bieglosc_checkpoint.md` **nie zna sesji 10–13** (Mastery, efekty rang, praktyka z walki) | tabela na górze i §33.3 znają je i są poprawne | ⚙ **znane i ZAPOWIEDZIANE przez sam dokument** jako dług „do domknięcia przy Canon Extraction domeny `proficiency`" — patrz §8 poz. 3 |
| **P-5** | §33.2: „`teachingRole` — decyzja zapisana, **pola w `EnemyConfig` NIE MA**" | pole **JEST** (weszło razem z praktyką z walki); mówi o tym §33.3 D7 **w tym samym pliku** | ⚠ średnia — sprzeczność wewnątrz jednego dokumentu |
| **P-6** | §33.3 D1: krytyk po stronie wroga jako **otwarty dług do zbudowania** | 2026-09-05 zapadła decyzja **akceptująca asymetrię** — w dokumencie **innej domeny** | ⚠ średnia — **częściowo SUPERSEDED**: nie „do zbudowania", tylko dług spójności → **OI-30** |
| **P-7** | §33.5: `combat_regresja.mjs` — **111 przypadków** | dziś **121** | ⚠ niska — pomiar z datą, nie twierdzenie o dziś; wprowadza w błąd czytany jako stan |
| **P-8** | **milczenie** — nikt nie mówi, że **wszystkie umiejętności gracza mają `allowFumble: false`** | wynika to z czterech osobnych deklaracji; skutek gameplayowy: **umiejętność nigdy nie pudłuje wykonaniem, autoatak tak** | ⚠ średnia — własność systemowa rozproszona po czterech miejscach |

⚠ **P-2 i P-8 to ta sama klasa co `OI-24` z domeny `shields`: brakuje nie opisu
POLA, tylko opisu tego, co wychodzi ze ZŁOŻENIA rzeczy już opisanych.** Drugi
raz z rzędu — patrz §8.

---

## 3. Rejestr decyzji z mocą

Skróty: `CH` = `bieglosc_checkpoint.md`, `AF` =
`audyt_projektowy_fundamentow_2026-09-03.md`, `KB` =
`konfiguracje_broni_checkpoint.md`, `KOD` = komentarz w źródle.

⚠ **W `CH` żyją TRZY niezależne numeracje `D*`** (dług implementacyjny §33.3;
nośniki cech §14; start rodziny i trener §34.8/§34.9). ⛔ Zawsze cytuj razem
z numerem sekcji.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | warstwa 2 jako **oś prostopadła** do wyniku ataku, nie kolejny wynik | CH §5 | **ACTIVE** |
| D-2 | **punkt neutralny = tożsamość** (test regresyjny nr 1) | CH §10 | **ACTIVE** |
| D-3 | `P` **per rodzina broni**, nie globalne | CH §14a | **ACTIVE** |
| D-4 | brak rodziny → **punkt neutralny**, nie zero | KOD | **ACTIVE** |
| D-5 | **jeden rzut na ZAMACH**, nie na cel | KOD | **ACTIVE** |
| D-6 | `allowFumble` **wymagany**, własność AKCJI | CH §33.1, KOD | **ACTIVE** |
| D-7 | **ześlizg nie bierze `m(P)`** — osobna gałąź, nie gorsze trafienie | CH §12 | **ACTIVE** |
| D-8 | warstwa 2 **przed redukcjami**, żeby podłoga objęła ześlizg | KOD | **ACTIVE** |
| D-9 | **fuszerka kończy atak przed obroną**, egzekwowane TYPEM | CH §33.1, KOD | **ACTIVE** |
| D-10 | `m(P)` jako **skalar** wolno wszędzie; zdarzenia tylko przy dyskretnej chwili rozstrzygnięcia | KOD | **ACTIVE** |
| D-11 | kolejność **warstwa 1 → warstwa 2** (rozróżnienie pudła od fuszerki) | CH §7 | **ACTIVE** |
| D-12 | **dwa mianowniki**: absolutny dla jakości, relacyjny dla nauki | CH §21 | **ACTIVE** |
| D-13 | `P = 0` → nauczyciel na suficie (**królik uczy**) | CH §16, §21 | **ACTIVE** |
| D-14 | **malejący przyrost `√n`** zamiast twardego limitu na egzemplarz | CH §20 | **ACTIVE** (odrzucony wariant zapisany razem z powodem) |
| D-15 | licznik trafień **per EGZEMPLARZ**, bez wygaszania czasowego | CH §33.3 D7 | **ACTIVE** |
| D-16 | licznik **leniwy** — rośnie tylko przy przyznanej praktyce | KOD | **ACTIVE** |
| D-17 | **softzone per PASMO (M2)**; model liczony od globalnego sufitu odrzucony | CH §22 | **ACTIVE** |
| D-18 | koszt punktu rosnący liniowo → praktyka **kwadratowa**; `+1` atomem | CH §19 | **ACTIVE** |
| D-19 | **manekin KOŃCZY**, nie uczy coraz mniej | CH §14b | **ACTIVE** |
| D-20 | **`P_start` ZAPISYWANY**, nie wyprowadzany w locie | KOD | **ACTIVE** |
| D-21 | start nowej rodziny czyta **PRÓG**, nie rangę | CH §34.8 (D3) | **ACTIVE** |
| D-22 | **wariant A: „próg sam nadaje rangę"** | CH sesje 2–4 | ⛔ **REJECTED — odwrócone przez §34**; stare akapity oznaczone ⚠ ODWRÓCONE |
| D-23 | ranga jako **stan kupowany U TRENERA NPC**, nie z panelu postaci | CH §34.9 (D5) | **ACTIVE** |
| D-24 | sufit `P` z rangi; **praktyka na suficie PRZEPADA**, nie jest bankowana | CH §34.3 | **ACTIVE** |
| D-25 | **powiadomienie o suficie obowiązkowe** w UI | CH §34.7 | **ACTIVE** |
| D-26 | **okno przedsprzedaży** (`unlockLead`) — zakup przed sufitem, próg nietknięty | KOD, 2026-09-03 | **ACTIVE** |
| D-27 | ładunek rangi mnoży **EFEKT, nie POLE** | CH §14 (D1) | **ACTIVE** |
| D-28 | rodziny o **bazie cechy zero** dostają własny nośnik | CH §14 (D2) | **ACTIVE** |
| D-29 | rodzina bez liczbowej tożsamości ma **ładunki PUSTE** | CH §14 (D3) | **ACTIVE** |
| D-30 | **cecha rodziny jako DEKLARACJA**, nie opcjonalne pole | AF (D5) | **ACTIVE** |
| D-31 | redukcja kosztu **wyłącznie dla autoataku** | CH §25 | **ACTIVE** |
| D-32 | para `a`/`b` w cenie punktu to **konwencja wdrożeniowa**, nie liczba z checkpointu | CH §33.1 | **ACTIVE** — do przeliczenia razem z „finalnymi czasami pasm" |
| D-33 | krytyk `g(x)` po stronie wroga **odłożony** | CH §33.3 (D1) | ⚠ **częściowo SUPERSEDED** — asymetria zaakceptowana (KB §3) |
| D-34 | biegłość i Mastery **dla dwóch broni naraz oraz dla dwuręcznej — nieprojektowane** | KB §3, `archetypy_walki.md` | **ACTIVE** (decyzja negatywna) |
| D-35 | pliki wzorów zostają **CZYSTE**; stan i zdarzenia piętro wyżej | KOD | **ACTIVE** |

⚠ **Zastąpienie CZĘŚCIOWE wystąpiło po raz PIĄTY z rzędu** (D-33), licząc
`attributes`, `stamina`, `armor` i `shields`. **To już nie jest obserwacja —
to jest domyślne założenie, z którym trzeba wchodzić w każdą kolejną domenę.**

---

## 4. Co zostało ODWRÓCONE, a nie tylko zmienione

Ta domena ma jedyny w projekcie przypadek **jawnie odwróconej decyzji
zamkniętej**: model, w którym próg `P` sam nadawał rangę (D-22), został przez
autora odwrócony na model rangi kupowanej (D-23).

⚙ **Zrobiono to wzorcowo i warto to zapisać jako kontrolę pozytywną:**
sekcja odwracająca jest oznaczona jako **NADRZĘDNA wobec wszystkiego, co
dokument mówi wcześniej**, a każdy dotknięty akapit ma przy sobie znacznik
„⚠ ODWRÓCONE". **Żadna inna domena tego projektu nie ma równie czystego zapisu
zmiany zdania** — i to jest wzorzec do powtórzenia, nie wyjątek do wybaczenia.

⚠ Skutek dla czytającego: **`P` i ranga rozeszły się na dwie osie**, a najłatwiej
złamać to po cichu, przepinając czytelnika progu na rangę albo odwrotnie. Kod
nazywa ten podział wprost i ma dla obu osi osobne funkcje o długich nazwach.

---

## 5. OI-28 — pomiar osiągalności rang

**Metoda:** skrypt nad zbundlowanym `GameConfig.ts`, odtwarzający funkcje
`teacher`, `softzone` i `pointCost` jeden do jednego z `core/Practice.ts`.
Kontrola: wyliczone sufity nauki zgadzają się z tabelą §7.3 audytu z 2026-09-03
co do dziesiątej części punktu.

**Fakt 1 — twardy sufit nauki per przeciwnik.** Z progu martwego funkcji
nauczyciela wynika, że stworzenie przestaje uczyć, gdy `P` gracza przekroczy
jego własne `P` podzielone przez ten próg. Dla całego dzisiejszego rosteru daje
to sufity od kilkudziesięciu punktów (królik) do **85** (wilk — najwyższy
przeciwnik **odradzalny**) i **102,5** (jedyne stworzenie powyżej niego, które
**nie odradza się**).

**Fakt 2 — bramki zakupu rang.** Zakup otwiera się `unlockLead` punktów przed
sufitem, więc kolejne rangi wymagają `P` równego progowi minus ta stała:
**pierwsza — poniżej sufitu bez rangi; druga — POWYŻEJ sufitu odradzalnej fauny;
trzecia i czwarta — wielokrotnie powyżej wszystkiego, co roster potrafi
nauczyć.**

**Fakt 3 — symulacja.** Przy stałym biciu wilków dojście do sufitu 85 zajmuje
**ponad tysiąc egzemplarzy**, po czym praktyka wynosi dokładnie zero. Domknięcie
brakujących kilku punktów do bramki drugiej rangi wymagałoby **kilkudziesięciu
egzemplarzy jedynego stworzenia powyżej progu — a ono się nie odradza**. Nawet
tysiąc trafień w ten jeden egzemplarz nie wystarcza: malejący przyrost `√n`
dławi to z definicji.

**Wniosek:** przy dzisiejszej zawartości **osiągalna jest wyłącznie pierwsza
ranga**. Cennik trzech pozostałych (razem 2 750 g i 6 punktów rozwoju) opisuje
zakupy, do których gra nie ma jak doprowadzić.

⚠⚠ **To NIE jest usterka i nie należy tego „naprawiać" przy okazji.** System
jest wewnętrznie spójny; brakuje **zawartości**, która by go wypełniła. Trzy
możliwe odpowiedzi — obniżyć bramki, dodać mocniejszą faunę, albo przyjąć, że
wyższe rangi są treścią przyszłego etapu — są **decyzją projektową autora**.

⚠ **Skutek uboczny, który przy tej okazji przestaje być hipotetyczny:** ryzyko
„najwyższa ranga znosi ekonomię wysiłku" zapisane w audycie z 2026-09-03 dotyczy
rangi, której dziś **nie da się kupić**. Zniknie z listy ryzyk albo wróci
w pełnej sile — zależnie od tego, którą odpowiedź wybierze autor.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| punkt neutralny jako tożsamość | ✅ **N-30** |
| jeden rzut na zamach | ✅ **N-31** |
| `allowFumble` wymagany | ✅ **N-32** |
| fuszerka przed obroną, egzekwowana typem | ✅ **N-33** |
| ześlizg bez `m(P)` | ✅ **N-34** |
| warstwa 2 przed redukcjami | ✅ **N-35** |
| skalar wszędzie, zdarzenia tylko przy dyskretnej chwili | ✅ **N-36** |
| dwa mianowniki | ✅ **N-37** |
| ranga to zapisany stan | ✅ **N-38** |
| rozdział odczytów PRÓG ↔ RANGA | ✅ **N-39** |
| przepadanie praktyki + obowiązkowe powiadomienie | ✅ **N-40** |
| `+1` atomem | ✅ **N-41** |
| leniwy licznik trafień | ✅ **N-42** |
| czystość plików wzorów | ✅ **N-43** |
| „nigdy 0 obrażeń" (podłoga) | ➡ **DELEGOWANY** do `combat` — tam mieszka zaokrąglenie; tutaj tylko warunek, pod którym obejmuje ześlizg |
| kolejność unik → parowanie → blok → pancerz | ➡ **DELEGOWANY** do `combat` |
| `P` wymagane na stworzeniu, bez domyślnej | ➡ **DELEGOWANY** do `creatures`, wymieniony w checkliście |
| cecha rodziny jako deklaracja | ➡ **DELEGOWANY** do `weapons`; tutaj zostaje wyłącznie **jak ranga ją skaluje** |
| redukcja kosztu tylko autoataku | ✅ przeniesiony — `STAN` §5.3; ⚠ **konsument jest w `stamina`** |
| „wszystkie umiejętności gracza nie pudłują wykonaniem" | 🆕 **NOWY** — z kodu, nieopisany nigdzie (P-8) |
| bramki rang wobec sufitu nauki | 🆕 **NOWY** — z pomiaru (P-2, §5) |

---

## 7. Granice wyprowadzone z KODU

| granica | co pokazał kod | werdykt |
|---|---|---|
| `proficiency` ↔ `combat` | warstwa 2 leży **między** warstwą 1 a obroną; wynik wchodzi jako surowa wartość, zaokrąglenie i łańcuch obrony należą do `combat` | ✅ zależność asymetryczna |
| `proficiency` ↔ `weapons` | `weapons` daje **bazę** cechy, `proficiency` — **mnożnik EFEKTU**. Rozdział jest w kodzie jawny (`WeaponTraits` vs `Progression`) | ✅ zależność dwustronna, ale o rozłącznych rolach |
| `proficiency` ↔ `creatures` | ⚠ **dwustronna i nieoczywista**: `P` stworzenia jest **naraz** jego własną biegłością (warstwa 2 po jego stronie) **i wartością dydaktyczną** dla gracza. Jedna liczba, dwie role | ✅ zależność — i miejsce, gdzie zmiana rosteru zmienia progresję gracza (OI-28) |
| `proficiency` ↔ `stamina` | ranga obniża koszt zamachu; `stamina` jest **konsumentem**, nie współwłaścicielem | ✅ jednokierunkowa |
| `proficiency` ↔ `progression`/`economy` | rangi kupuje się **z tej samej puli punktów** co atrybuty i umiejętności oraz za złoto | ✅ zależność przez **wspólny niedobór**, nie przez kod |

⚠ **Wniosek taksonomiczny: `proficiency` słusznie jest osobną domeną, a nie
częścią `progression`.** Rośnie z **użycia**, nie z poziomu; jest per rodzina,
nie per postać; i nie da się jej kupić punktami — kupuje się wyłącznie **sufit**.
Wspólna jest tylko waluta.

---

## 8. Czego procedura tu NIE złapała

1. ⚠⚠ **Kod jest źródłem prawdy dla faktów implementacyjnych — ale KOMENTARZ
   W KODZIE nim nie jest.** Kontrakt (§1 hierarchii źródeł) mówi „KOD" i przez
   cztery domeny czytaliśmy to jako „wszystko w plikach `src/`". Ta domena
   pokazała różnicę: **nagłówek modułu twierdził dokładnie odwrotnie niż ciało
   tego samego modułu i niż jego konsument** (P-1). ⛔ **Przymiar nie odróżnia
   kodu od komentarza w kodzie i nigdy nie odróżni** — jedynym mechanizmem jest
   sprawdzenie, czy funkcja ma WYWOŁANIA, a nie czy istnieje.
   **Reguła dla następnych domen: „zaimplementowane" znaczy „ma konsumenta".**

2. ⚠⚠ **Milczenie o ZŁOŻENIU — drugi raz z rzędu, więc to już wzorzec.**
   W `shields` był to brak wspólnego sufitu mitygacji; tutaj — bramki rang
   wobec sufitu nauki. W obu razach **każdy składnik był opisany osobno
   i poprawnie**. ⛔ **Żaden przymiar tego nie znajdzie.**
   **Reguła operacyjna: w każdej domenie, która ma BRAMKI, policz, czy
   zawartość gry potrafi je przekroczyć.**

3. ⚙ **Kontrola pozytywna — dokument, który sam zapowiedział swój dług.**
   `bieglosc_checkpoint.md` napisał wprost, że sesje 10–13 nie weszły do korpusu
   i że jest to „dług do domknięcia przy Canon Extraction domeny `proficiency`".
   Ekstrakcja zastała dokładnie to, co zapowiedziano — ani mniej, ani więcej.
   **Dokument, który zna swoje granice, jest tańszy w ekstrakcji od dokumentu,
   który udaje kompletność.**

4. ⚠ **Piąta domena z rzędu, w której najważniejsza otwarta pozycja jest
   ODCZUCIOWA** (OI-29). Ekstrakcja potrafi ustalić, że playtestu nie było,
   i policzyć, na kim zjawisko da się w ogóle zaobserwować — **i to jest cały
   jej wkład**. Dalej zaczyna się gałka.

⚙ **Co zadziałało:** odczyt code-first (P-1 wyszło z pytania „kto to woła", nie
z lektury), tabela granic domeny, przeliczenie każdego niezmiennika podanego
liczbą (reguła z `armor` — to ona wyprodukowała §5), `## Pokrycie` z bramek.
⚠ **Budżet:** największe źródło w projekcie (258 KB) **nie było wąskim gardłem**,
bo miało poprawną tabelę stanu na górze. Wąskim gardłem był **kod** — 1 208 linii
w czterech plikach, które trzeba było przeczytać w całości, żeby zobaczyć P-1.

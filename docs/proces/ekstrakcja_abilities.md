---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena abilities
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs]
otwarte: [OI-27, OI-38, OI-39]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `abilities`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/abilities.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia, spisany PRZED pisaniem

| decyzja | treść |
|---|---|
| **bierze** | zdobycie (dwie bramki) · pasek i sloty · cooldown ze zwrotem · cztery archetypy wykonania i kryterium przynależności do rejestru · postać deklaracji akcji · dwa archetypy celowania · reguły ograniczające, których umiejętność nie może złamać |
| **oddaje sąsiadom** | mechanizm zamachu, geometria, łańcuch obrony, „nie na trupie", impulsy → `combat` · `m(P)` i fuszerka jako mechanizm, ładunki rang → `proficiency` · księgowość tego, co zostaje na celu → `effects` · koszt wysiłku jako system → `stamina` · zasięg i profil ciosu → `weapons`/`items` · bramka tarczy → `shields` · pasek i podgląd rysowany → `presentation` |
| **NIE opisze** | ani jednej liczby żadnej umiejętności · co robi która · balansu · czy cztery sloty to dobra liczba · ogłuszenia jako prymitywu (`OI-27`) |

⭐ **Trzecia domena z rzędu pod limitem bez rundy skracania** (16,2 KB).
Po `combat` i `effects` to przestaje być obserwacją — **krok 0 jest procedurą**.

**Procedura właściwa:** kod w całości (`Abilities` 221 l., `Skills` 122 l.,
`AbilitySpec` 516 l., `PlayerAction` 423 l. + rozdzielacz i bramki w scenie) →
dokumentacja → rozjazdy → decyzje z mocą → `STAN` → bramki.

---

## 2. Rozjazdy

⚙⚠ **To najlepiej udokumentowana domena w całej serii — i to zmieniło rolę
ekstrakcji.** Nie było czego prostować; było co **zebrać**. **Zero sprzeczności
kod ↔ dokumentacja.** Wszystkie osiem pozycji to **milczenia** albo **kontrole
pozytywne**.

| # | rzecz | stan |
|---|---|---|
| **A-1** | checkpoint etapu deklaratywnego zachował pierwotne zdanie („rejestr ma trzy wpisy i **nie ma rosnąć**") i dopisał **datowane sprostowanie**: zdanie było prawdziwe o **migracjach** i takim zostaje, ale nie było prawdziwe o **nowych** akcjach | ⚙⚙ **kontrola pozytywna — wzorzec** obok odwrócenia modelu rang w `proficiency`; ⚠ **czwarte zastąpienie CZĘŚCIOWE**, po raz pierwszy **odnotowane przez autora dokumentu, a nie przez ekstrakcję** |
| **A-2** | komentarz w kodzie mówił „w kolejności zdobywania"; kolejność jest **konfiguracyjna** | ⚙ **kontrola pozytywna** — poprawiono OPIS, nie zachowanie, bo kolejność konfiguracyjna jest tu właściwa (wiersz nie skacze między sesjami) |
| **A-3** | **milczenie** — **cztery archetypy wykonania** nie są nigdzie opisane jako system | ⚠ średnia — §D checkpointu opisuje je **od strony negatywnej** („co NIE należy do rejestru"). Pierwszy raz opisane pozytywnie w `STAN` §4 |
| **A-4** | **milczenie** — reguła „**koszt i cooldown na KOŃCU, po wszystkich odmowach**" nie jest nigdzie zapisana, tak samo jak jawny wyjątek uniku | ⛔ wysoka — to jest reguła o realnym skutku („nieudana akcja nic nie kosztuje"), żyjąca w jednym komentarzu przy wywołaniu |
| **A-5** | **milczenie** — „**brak nauczyciela = nie wymaga nauki**" żyje wyłącznie w komentarzu jednej metody | ⚠ średnia — reguła z realnym skutkiem: nowa umiejętność bez wpisu u trenera jest dostępna samym poziomem |
| **A-6** | **brak infrastruktury** — żaden skrypt nie produkuje zestawienia umiejętności | ⛔ wysoka → **OI-38**; jedyna domena, w której nie da się zastosować reguły „liczby w `GENEROWANE`" |
| **A-7** | dokument prototypu celowania stoi w „czeka na playtest ręką" od 2026-08-23 | ⚠ **nie do ustalenia** → **OI-39**; ⛔ nie zgaduję |
| **A-8** | §D checkpointu notuje, że przyszły runner gracza miałby **własną mapę cooldownów, czyli drugiego właściciela** | ⚙ **zapisane ryzyko, nie dzisiejszy dług** — przeniesione do `STAN` §3 jako reguła „jeden właściciel cooldownu" |

---

## 3. Rejestr decyzji z mocą

Skróty: `P3` = `checkpoint_p3_player_actions_2026-09-03.md`,
`AIM` = `ability_aiming_prototyp.md`, `SB` = `shield_bash.md`, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **dwie bramki**: poziom + trener; zdjęcie którejkolwiek odrzucone | KOD, `SKILLS` | **ACTIVE** |
| D-2 | **brak nauczyciela = „nie wymaga nauki"**, nie „niedostępna" | KOD | **ACTIVE** |
| D-3 | **oba koszty nauki sprawdzone przed pobraniem któregokolwiek** | KOD | **ACTIVE** |
| D-4 | **umiejętności więcej niż slotów** — wybór jest treścią | KOD | **ACTIVE** |
| D-5 | auto-slot **tylko na wolne**; nie rusza układu gracza | KOD | **ACTIVE** |
| D-6 | **jedna umiejętność, jeden slot**; zajęty slot **zamienia się**, nie gubi | KOD | **ACTIVE** |
| D-7 | **układ paska w zapisie, cooldowny NIE** | KOD | **ACTIVE** |
| D-8 | **odtworzenie ≠ decyzja gracza** — restore nie wywołuje zapisu | KOD | **ACTIVE** |
| D-9 | nieznane `id` z zapisu → pusty slot, nie błąd wczytywania | KOD | **ACTIVE** |
| D-10 | **koszt i cooldown po wszystkich odmowach** | KOD | **ACTIVE** |
| D-11 | **unik płaci osobno**, bo jako jedyny mnoży się przez obciążenie — dlatego **świadomie nie ma kosztu w danych** | KOD | **ACTIVE** |
| D-12 | **jeden właściciel cooldownu**; deklaracja go nie zna | P3.4 | **ACTIVE** |
| D-13 | **zwrot od PEŁNEJ długości**; ⛔ nie potrafi cooldownu założyć | KOD | **ACTIVE** |
| D-14 | **kryterium przynależności do rejestru** (kończy się wpisem do slotu zamachu) | P3 §C | **ACTIVE** |
| D-15 | „rejestr ma trzy wpisy i **nie ma rosnąć**" | P3 | ⚠ **częściowo SUPERSEDED** — prawdziwe o migracjach, nie o nowych akcjach (A-1) |
| D-16 | **ani jednej nowej liczby** w deklaracji | P3, KOD | **ACTIVE** |
| D-17 | **pola deklaracji wymagane**, nigdy domyślne | P3.3, KOD | **ACTIVE** |
| D-18 | **ukorzenienie jako POLITYKA**, nie liczba do dopisania | P3.5 | **ACTIVE** — ⭐ powstała, bo akcja **nie miała** liczby w danych |
| D-19 | konsekwencje trafienia jako **lista wariantów po rodzaju**; pusta = „świadomie nic" | P3 (OD-1) | **ACTIVE** |
| D-20 | nowy wariant **tylko z konsumentem**, nigdy dla symetrii | P3 §E | **ACTIVE** |
| D-21 | **jedno źródło kształtu** dla podglądu i zatwierdzenia | AIM | **ACTIVE** |
| D-22 | umiejętność kierunkowa z podglądem **bez furtki zwarcia** | KOD, 2026-08-23 | **ACTIVE** |
| D-23 | wskazany cel **walidowany ponownie**, ⛔ bez podstawiania innego | KOD | **ACTIVE** |
| D-24 | **żadna umiejętność nie pudłuje wykonaniem** — powód ekonomiczny | P3, KOD | **ACTIVE** |
| D-25 | **zasięg z BRONI** — decyzja **odwrócona przez rozgrywkę** | SB §3.2 | **ACTIVE** |
| D-26 | **jedyna bramka sprzętowa** w całym zestawie; czyta zdolność, nie nazwę | SB §1.3 | **ACTIVE** |
| D-27 | **obrona ciałem poza rejestrem** — łamie trzy niezmienniki naraz | P3 §D | **ACTIVE** |
| D-28 | **gracz NIE na runnerze akcji** — miałby drugiego właściciela cooldownu | P3 §D | **ACTIVE**, z warunkiem powrotu |

⚠ **Zastąpienie CZĘŚCIOWE po raz ÓSMY z rzędu** (D-15). Od `attributes` do
`abilities` nie było domeny bez takiej pozycji. ⚙ **Tym razem z różnicą, która
jest dobrą wiadomością:** jako pierwsze zostało odnotowane **przez autora
dokumentu, zanim ekstrakcja tam dotarła**.

---

## 4. Test SYSTEM ≠ CONTENT — wynik

| rzecz | gdzie należy | stan po ekstrakcji |
|---|---|---|
| zasady systemu umiejętności | `docs/systemy/abilities.md` | ✅ powstały |
| dane pojedynczych umiejętności | konfig → tabela `GENEROWANE` | ⛔ **generatora nie ma** (OI-38) |
| historia decyzji o konkretnych umiejętnościach | dokumenty per umiejętność jako `HISTORIA`/`DECYZJA` | ✅ **zostają nietknięte** |

⚙ **Cztery dokumenty per umiejętność są zgodne z decyzją SYSTEM/CONTENT, nie
wbrew niej** — każdy ujawnił regułę systemu: bramka sprzętowa i zasięg z broni ·
lista konsekwencji trafienia i polityka ukorzenienia · warstwa efektów po
stronie wroga · dwa archetypy celowania. ⛔ **Nie utworzono ani jednego nowego
dokumentu per umiejętność.**

⚠ **Konsekwencja braku generatora, którą trzeba znać:** dla tej domeny nie
istnieje **siatka luk** („który archetyp jest pusty"), a to jest narzędzie,
którym `items` i `weapons` planują nową zawartość. Projektując umiejętność
numer 10, nie ma czego otworzyć.

---

## 5. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| dwie bramki zdobycia | 🆕 **N-71** — z kodu i danych |
| oba koszty przed pobraniem | ✅ **N-72** — ⚠ **trzecie wystąpienie tej samej reguły** (po `items` N-12 i rangach); tutaj jako lokalne powtórzenie, nie nowy niezmiennik |
| więcej umiejętności niż slotów | 🆕 **N-73** |
| jedna umiejętność, jeden slot | 🆕 **N-74** |
| koszt i cooldown na końcu | 🆕 **N-75** — z komentarza przy wywołaniu (A-4) |
| jeden właściciel cooldownu | ✅ **N-76** — przeniesione z P3.4 |
| zwrot od pełnej długości, nie zakłada | ✅ **N-77** |
| kryterium przynależności do rejestru | ✅ **N-78** — przeniesione z P3 §C **bez zmiany ani słowa** |
| zero nowych liczb w deklaracji | ✅ **N-79** |
| pola wymagane | ✅ **N-80** |
| jedno źródło kształtu | ✅ **N-81** — przeniesione z prototypu celowania |
| układ przeżywa, cooldowny nie | 🆕 **N-82** |
| brak własnego zasięgu | ✅ **N-83** — przeniesione z dokumentu o umiejętności tarczy |
| „nie na trupie", jedno zaokrąglenie, mechanizm zamachu | ➡ **ZOSTAJE** w `combat` |
| `m(P)`, fuszerka jako mechanizm, ładunki rang | ➡ **ZOSTAJE** w `proficiency` |
| księgowość efektu, nałożenie = odświeżenie | ➡ **ZOSTAJE** w `effects` |
| ogłuszenie jako prymityw | ➡ **ODDANE** — ⚠ z otwartym `OI-27`, nierozstrzyganym tutaj |
| „tarcza to pancerz, który blokuje" | ➡ **ZOSTAJE** w `shields`; tutaj tylko fakt „jedyna bramka sprzętowa" |
| cztery archetypy wykonania | 🆕 **`STAN` §4** — opisane pozytywnie po raz pierwszy (A-3) |

---

## 6. Czego procedura tu NIE złapała

1. ⚙⚠ **Domena może być dobrze udokumentowana — i wtedy ekstrakcja zmienia
   rolę.** Zero sprzeczności kod ↔ dokumentacja; wszystkie znaleziska to
   **milczenia** i **kontrole pozytywne**. ⚠ To nie znaczy, że `STAN` był
   zbędny: cztery reguły systemowe (A-3, A-4, A-5, A-8) nie miały gdzie
   mieszkać, bo **dokument o migracji opisuje GRANICĘ, nie SYSTEM** — mówi
   „co do rejestru nie należy", nie „jak wygląda całość".

2. ⚠⚠ **Milczenia tej domeny były SYSTEMOWE, nie polowe.** Nie brakowało opisu
   pola; brakowało opisu **czterech archetypów jako całości** i **reguły
   kolejności płacenia**. ⛔ Żaden przymiar tego nie znajdzie — brak nie wygląda
   jak sprzeczność, a tutaj nawet nie jak brak pola.

3. ⚠ **Pierwsza pozycja `## Pokrycie` typu „brak infrastruktury".** Przy
   `OI-38` przymiar nie ma czego sprawdzić, bo generatora nie ma — więc wiersz
   pokrycia jest pusty **nie dlatego, że czegoś nie zweryfikowano, tylko
   dlatego, że nie ma czym**. To nowy rodzaj luki w tej tabeli.

4. ⛔ **Ekstrakcja umie stwierdzić BRAK ZAPISU, nie brak zdarzenia** (A-7,
   `OI-39`). Piąte otwarte tej klasy w serii. Kalibracja projektu mówi wprost,
   że brak dokumentu playtestowego nie oznacza braku testu — więc jedyną
   uczciwą odpowiedzią jest `OPEN`, a nie domysł w żadną stronę.

⚙ **Co zadziałało:** krok 0 (trzeci raz), czytanie kodu w całości, tabela granic
na początku `STAN`, oraz — nowość — **czytanie dokumentu etapowego jako źródła
DECYZJI, a nie stanu**: §C i §D checkpointu dały siedem niezmienników gotowych
do przeniesienia bez zmiany słowa.

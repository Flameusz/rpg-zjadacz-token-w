---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena presentation
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/CombatCues.ts, src/core/CombatFx.ts]
otwarte: [OI-70, OI-71, OI-72]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `presentation`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/presentation.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — granica potwierdzona kodem

⚙ **Ustalenie z `ui` nie było otwierane od nowa** — miało zostać potwierdzone.
Zostało, i to **mocniej, niż zakładał depozyt**: granica jest w kodzie
**zapisana jako warunek istnienia warstwy** i **ma egzekutora**.

| granica | brzmienie z kodu | egzekutor |
|---|---|---|
| `presentation` ↔ mechanika | ⛔ **„nic tutaj nie może zmienić pozycji, czasu ani stanu"** | ⭐ **zamrożona regresja walki** — „jeśli drgnie, feedback wszedł w symulację" |
| `presentation` ↔ `ui` | trwa ze **zdarzeniem** vs trwa ze **stanem** i coś znaczy | — |
| `presentation` ↔ `input` | pokazuje skutek vs przenosi intencję | — |
| `presentation` ↔ `audio` | **wybiera** sygnał vs **odtwarza** go | — |

⭐ **Reguła kieszonkowa, wprost z kodu: „jeśli piszesz coś, co zmienia POZYCJĘ,
jesteś w złym pliku".** Warstwa ma bliźniaka, który rusza ciałem — i **o to
w nim chodzi**.

| | treść |
|---|---|
| **bierze** | podział decyzja/wykonanie · słownik cue · cztery świadome wyłączenia · dwie przestrzenie tekstu i łata filtrowania · podgląd celowania · barwa jako jedyny nośnik |
| **oddaje** | odtwarzanie dźwięku → `audio` · powierzchnie trwające ze stanem → `ui` · intencja → `input` · wynik akcji → `combat` |
| **NIE opisze** | żadnego efektu, napisu, koloru ani glifu · czy dzisiejsze barwy są dobre · kiedy warto dołożyć kanał |

⭐ **Piętnasta domena z rzędu z planem cięcia**, pod limitem (17,1 KB).

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | decyzja czysta / wykonanie z silnikiem · pięć kanałów cue · cztery wyłączenia z powodami · dwie przestrzenie tekstu · trzy języki podglądu · barwa jako jedyny nośnik części wyników |
| **INTENDED** | ⚠ **dylatacja czasu na warstwie renderu** — zapisana jako **osobna decyzja**, do której odłożono zatrzymanie czasu przy krytyku · ⚠ **odrzut sprite'a** — nazwany, uzasadniony i świadomie niezaimplementowany · ⚠ **popup obrażeń w tabeli cue** — dopiero razem z konsumentem |
| **HISTORICAL** | jedna decyzja o sygnałach rozpisana w **trzech plikach** *(dźwięk w encji, błysk w scenie, drugi błysk w przeciwniku)* · błysk kończący się bezwarunkowym czyszczeniem barwy, które **kasowało telegraf** · podgląd rysowany pełnym kołem, który **kłamał o kształcie** ciosu |

---

## 3. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **P-1** | granica prezentacji jest regułą redakcyjną | ⚙ **jest regułą z EGZEKUTOREM.** Zamrożona regresja walki nie ma drgnąć ani o bit — a jest testem **mechaniki**, nie prezentacji | ⭐ **zgodne** — patrz §7.1 |
| **P-2** | **depozyt: „hit-stop jako depozyt z `combat`"** | ⛔ **ODRZUCONY.** Zatrzymanie przy krytyku **wstrzymuje świat fizyki**, więc jest **stanem gry**; kod nazywa to wprost i trzyma je poza tabelą cue. ⚠ Do tego **miesza kanały**: ta sama funkcja wstrzymuje fizykę **i** wywołuje wstrząs kamery | ⛔ wysoka — ⚠⚠ depozyt fałszywy **przez sąsiedztwo w kodzie**, patrz §7.2 |
| **P-3** | **depozyt: plik z katalogu interfejsu rysujący w świecie** | ✅ **potwierdzony**: 626 linii, budowany przez **scenę gry**, rysowany nad światem, nie w nakładce | ⚙ zgodne — należy tutaj |
| **P-4** | **depozyt: powierzchnia graniczna zostawiona przez `ui`** | ✅ **rozstrzygnięta**: reakcja **ciągła**, ale **bez wartości do odczytania** — odpowiada na ogłoszenie „jest źle", nie na pytanie „ile mam". Należy do `presentation` | ⚙ zgodne |
| **P-5** | tabela cue rządzi prezentacją | ⛔ **rządzi JEDNYM zdarzeniem.** Zmierzone poza nią: **5** wstrząsów, **23** napisy w 9 plikach, **12** pierścieni. ⭐ Jedyny kanał w pełni skanalizowany to **błysk — zero wywołań poza wykonawcą** | ⚠ średnia → `OI-70`. ⚙ **Nie wada**: napis nad przedmiotem nie jest częścią rozstrzygnięcia ciosu |
| **P-6** | łata filtrowania tekstu działa | ✅ działa — ⛔ **bez przymiaru**, na **prototypie rysowania tekstu silnika**, a jej awaria to „napisy wyglądają niewyraźnie": ani błąd, ani ostrzeżenie, ani różnica w raporcie. ⚠⚠ Kierunek mnożnika **był już raz odwrócony** | ⚠ średnia → `OI-71` |
| **P-7** | **depozyt: barwa jako nośnik wyniku warstwy 2** | ✅ **potwierdzony i szerszy**: barwa jest jedynym nośnikiem także dla **uniku i parowania** *(nie przechodzi żadna liczba)*. ⛔ Odbiór **nigdy nie sprawdzony ręką** | ⛔ wysoka → `OI-72`, czytane z `OI-29` i `OI-26` |
| **P-8** | komentarze w tej domenie | ✅ **wszystkie prawdziwe** — ⭐ i są **źródłem reguł**, nie ich echem: cztery wyłączenia z cue istnieją **wyłącznie** jako zapisane powody | ⚙ **zgodne** — piąta domena z rzędu bez fałszywego komentarza |
| **P-9** | **milczenie o nieistnieniu** | ⚙ **odwrócone**: zwykle brak mechaniki nie zostawia śladu — tutaj **cztery nieistniejące kanały są opisane wprost, z powodami** | ⭐ **wzorzec do skopiowania**, nie ciekawostka |

⚠ **Profil domeny: jeden depozyt odrzucony, jeden potwierdzony szerzej niż
brzmiał, dwa braki przymiaru.** ⚙ **Zero sprzeczności kod ↔ komentarz.**

---

## 4. Decyzje zastane (nie moje — odczytane)

⚠⚠ **Cztery kanały mogły wejść do cue i świadomie nie weszły.** Każda decyzja
ma w kodzie **powód**, a nie tylko skutek:

| decyzja | powód | moc |
|---|---|---|
| **zatrzymanie czasu przy krytyku NIE jest cue** | wstrzymuje świat fizyki → **stan gry**; wpisane do cue trafiłoby po złej stronie podziału | ACTIVE |
| **popup obrażeń NIE wchodzi do cue** | niesie **cztery pola**, rozstrzygnięcie ma **dwa**; dokładanie brakujących „bo pasuje" to **martwe sloty** — przeprowadza się razem z konsumentem albo wcale | ACTIVE |
| **odrzut sprite'a NIE powstaje** | przesuwałby grafikę niezależnie od ciała bojowego; ⭐ **granicy nie przesunięto — przeszło się na drugą stronę i nazwało to wprost** | ACTIVE |
| **nietykalność po uniku NIE gra niczym** | gracz właśnie dostał „przewrót zadziałał"; drugi sygnał w tym samym miejscu **rozmydla pierwszy** | ACTIVE |
| **napis obronny tylko po stronie gracza** | wynik po drugiej stronie ma być **decyzją do podjęcia**, nie zachowaniem odziedziczonym | ACTIVE |
| **napisy w świecie nie kompensują skali** | mają być klockowate tak samo jak kafle, przez które przechodzi ten sam zoom | ACTIVE |

---

## 5. Pomiary

**Metoda:** wywołania policzone **per kanał**, z pominięciem komentarzy
*(lekcja z ekstrakcji `ui`)*; przynależność plików rozstrzygnięta po
**budowniczym i przestrzeni rysowania**, nie po katalogu.

| pomiar | wynik |
|---|---|
| kanały w słowniku cue | **5** *(dźwięk, błysk, wstrząs, ślad, napis)* |
| miejsca odgrywające cue | **5** |
| ⭐ wywołania **błysku** poza wykonawcą | **0** |
| wywołania **wstrząsu** poza tabelą | **5** |
| wywołania **napisu** poza tabelą | **23** w **9** plikach |
| wywołania **pierścienia** *(kanał w ogóle poza tabelą)* | **12** |
| miejsca ustawiające **barwę** poza błyskiem | **6** *(telegrafy — osobny, prawomocny kanał)* |
| świadome **wyłączenia** z cue, z zapisanym powodem | **4** |
| pliki warstwy prezentacji | **9** · **2 081** linii |
| największy plik | **626** *(podgląd celowania — leży w katalogu interfejsu)* |
| przymiary pilnujące granicy | **1** *(regresja walki — ⭐ napisana w innym celu)* |
| przymiary pilnujące **wyglądu** | **0** |

**Co z tego wynika:**

1. ⭐ **Jedyny kanał w pełni skanalizowany to ten, który niesie najwięcej
   znaczenia.** Błysk jest jedynym błyskiem, jaki gra rysuje na graczu — i jako
   jedyny nie ma ani jednego wywołania poza wykonawcą. ⚙ Kanały o mniejszej
   nośności są rozproszone.
2. ⚠ **Tabela cue opisuje jedno zdarzenie, a nie prezentację.** Czytana sama
   sugeruje, że rządzi wszystkim; **policzenie wywołań pokazuje proporcję**:
   pięć miejsc wobec czterdziestu kilku poza nią.
3. ⚠⚠ **Domena ma egzekutora granicy i zero przymiarów wyglądu.** Pilnowane
   jest to, czego **nie wolno** *(ruszyć symulacji)*; ⛔ nie jest pilnowane nic
   z tego, co ma **wyglądać** dobrze.

⛔ **Nie oceniam barw, czasów ani intensywności** — to jest zawartość, nigdy
niemierzona ręką (`OI-72`).

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| prezentacja nie zmienia pozycji, czasu ani stanu | 🆕 **N-226** — ⭐ jedyny w projekcie z egzekutorem **napisanym w innym celu** |
| decyzja czysta, wykonanie z silnikiem | 🆕 **N-227** |
| wykonanie jest głupie | 🆕 **N-228** |
| napis potwierdza błysk barwą | 🆕 **N-229** — ⚠ obowiązuje **wewnątrz tabeli** (`OI-70`) |
| przywrócenie barwy na końcu błysku | 🆕 **N-230** |
| skok skali symetryczny, nigdy przesunięcie | 🆕 **N-231** |
| wyłączenie z cue wymaga powodu | 🆕 **N-232** (§4) |
| kanał przeprowadza się z konsumentem albo wcale | 🆕 **N-233** |
| napisy w świecie nie kompensują skali | 🆕 **N-234** |
| podgląd rysuje z danych rozstrzygnięcia | 🆕 **N-235** |
| obrys ≠ wypełnienie | 🆕 **N-236** |
| język podglądu jest daną | 🆕 **N-237** |
| barwa jako jedyny nośnik = cue jest mechaniką | 🆕 **N-238** (P-7) |
| **hit-stop** | ➡ **ZOSTAJE** w `combat` jako **stan gry** — depozyt odrzucony (P-2) |
| odtwarzanie dźwięku, przepustnica, brakujący plik | ➡ **ZOSTAJE** w `audio` |
| powierzchnie trwające ze stanem | ➡ **ZOSTAJĄ** w `ui` |
| barwy, czasy i intensywności | ➡ **ZOSTAJĄ** jako dane |
| skanalizowanie kanałów | ⛔ **OTWARTE** → `OI-70` |
| ochrona łaty filtrowania | ⛔ **OTWARTA** → `OI-71` |
| potwierdzenie odbioru barwy | ⛔ **OTWARTE** → `OI-72` |

---

## 7. Czego procedura tu NIE złapała

1. ⭐⭐ **GRANICA MOŻE MIEĆ EGZEKUTORA, KTÓRY NIE WIE, ŻE JEJ PILNUJE.**
   Zamrożona regresja walki jest testem **mechaniki**; to ona wykrywa, że
   prezentacja weszła w symulację — bo każde ruszenie pozycją, czasem albo
   stanem **zmienia jej wynik**. ⭐ To jest **najmocniejszy rodzaj przymiaru**:
   taki, który świeci na czerwono z **innego powodu, niż został napisany**,
   i którego nikt nie musi pamiętać o utrzymywaniu. ⛔ Szukanie „przymiaru dla
   prezentacji" po nazwie nie znalazłoby go nigdy.

2. ⚠⚠ **DEPOZYT BYWA FAŁSZYWY PRZEZ SĄSIEDZTWO W KODZIE, NIE PRZEZ BŁĄD**
   (P-2). Zatrzymanie czasu przy krytyku stoi **dwie linie od** wywołania cue,
   wygląda jak feedback i **jest** odczuwane jako feedback — a wstrzymuje świat
   fizyki, czyli jest stanem gry. ⭐ **Bliskość w pliku jest najsilniejszym
   źródłem fałszywych depozytów**, bo wygląda jak przynależność. ⚙ Tutaj kod
   sam ostrzegał; przy następnym takim przypadku może nie ostrzegać.

3. ⭐ **MILCZENIE O NIEISTNIENIU MA TU FORMĘ ODWROTNĄ — I TO JEST WZORZEC.**
   Zwykle brak mechaniki nie zostawia w kodzie żadnego śladu i każda sesja
   odkrywa go od nowa. Tutaj **cztery nieistniejące kanały są opisane wprost,
   z powodami** — więc pytanie „czemu nie ma popupu w cue" ma odpowiedź, zanim
   ktoś je zada. ⭐ To jest do skopiowania do innych domen, nie ciekawostka.

4. ⚠ **PROPORCJI NIE WIDAĆ Z DEFINICJI — TYLKO Z LICZENIA** (P-5). Tabela cue
   ma pięć kanałów i czyta się jak system rządzący prezentacją; dopiero
   policzenie wywołań **per kanał** pokazuje, że rządzi **jednym zdarzeniem**,
   a poza nią żyje kilkadziesiąt wywołań. ⚙ Żadne z nich nie jest błędem —
   ale bez tej proporcji `STAN` opisałby zasięg tabeli **szerzej, niż
   obowiązuje** *(ta sama pułapka, co przy progu dotykowym w `ui`)*.

⚙ **Co zadziałało:** liczenie wywołań **per kanał** zamiast czytania definicji,
rozstrzyganie przynależności pliku po **budowniczym i przestrzeni rysowania**
zamiast po katalogu, oraz sprawdzenie depozytu w **kodzie odbiorcy** — to ono
odrzuciło hit-stop.

---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena movement
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/movement_weryfikacja.mjs]
otwarte: [OI-48, OI-49]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `movement`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść poszła do
> `docs/systemy/movement.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia

| | treść |
|---|---|
| **bierze** | podział intencja → solver → ciało · słownik pięciu intencji i ich **polityki wobec przeszkody** · trzy warstwy solverów i zakres trasowania · wybór solvera per gatunek · „nie ma drogi" jako odpowiedź · **deklarowanie ciała fizycznego** · prędkość gracza i to, co na nią NIE wpływa |
| **oddaje** | kiedy ktoś goni/ucieka → `creatures` · koszt sprintu i uniku → `stamina` · unik jako umiejętność → `abilities` · impuls jako skutek trafienia → `combat` · waga i klasy obciążenia → `items`/`stamina` · przejezdność terenu → `world` |
| **NIE opisze** | prędkości żadnego gatunku · balansu · czy obciążenie POWINNO ruszać prędkość |

⚠ **Granica sprawdzona, nie założona:** ta domena **nie ma żadnej decyzji
o tym, DOKĄD ktoś idzie**. Gdyby miała, byłaby częścią `creatures`.

⭐ **Siódma i ósma domena z rzędu pod limitem bez rundy skracania.**

---

## 2. CURRENT / INTENDED / HISTORICAL

| warstwa | co do niej należy |
|---|---|
| **CURRENT** | pełny stos intencja → solver → ciało, trasowanie globalne wpięte dla całego rosteru, deklarowane ciała, prędkość gracza |
| **INTENDED** | ⚠ „miękka kolizja krzewów" — **zaprojektowana, niewdrożona**, świadomie zostawiona jako gameplay polish |
| **HISTORICAL** | cała przebudowa nawigacji lasu (etap **zamknięty**) · pomiary prześwitów i szerokości ciał · historia błędu odziedziczonego ciała |

⚠⚠ **Dokumenty przebudowy lasu są HISTORIĄ ETAPU, nie stanem systemu.**
Zawierają pomiary i decyzje, ale ich tematem jest **konkretna mapa**, nie
warstwa ruchu. ⛔ Nie cytować ich jako opisu mechaniki.

---

## 3. Rozjazdy

| # | rzecz | stan |
|---|---|---|
| **M-1** | **milczenie o nieistnieniu** — nigdzie nie zapisano, że **na prędkość gracza nie wpływa ŻADEN atrybut ani obciążenie** | ⛔ wysoka — Zręczność skraca odzyskanie i podnosi unik, ale **nie czyni szybszym**; obciążenie mnoży **koszty**, nie prędkość → `OI-48` |
| **M-2** | ⚠ **korekta własnego wcześniejszego ustalenia**: ekstrakcja `armor` zapisała zaparkowaną pozycję „ciężar pancerza → koszt mobilności" jako **w pełni zastąpioną** przez wdrożenie obciążenia | ⚠ **za szeroko** — zrealizowany jest koszt **wysiłku**, nie **mobilności**. Parking jest w połowie otwarty → `OI-48` |
| **M-3** | **milczenie** — nigdzie nie zapisano, że **żadna prędkość pościgu nie przekracza prędkości marszu gracza**, a dystans zamyka **zobowiązanie** | ⛔ wysoka — wygląda na spójny projekt, ale nic tego nie pilnuje → `OI-49` |
| **M-4** | **milczenie** — reguła **„wybór solvera per gatunek, nigdy globalnie"** żyje wyłącznie w komentarzu pola konfiguracji | ⚠ średnia — to jest zmiana **odczucia walki**, nie ustawienie techniczne |
| **M-5** | **milczenie** — nigdzie nie zapisano, że **trasowanie globalne dotyczy WYŁĄCZNIE jednej intencji** i dlaczego pozostałe cztery są z niego wyłączone | ⚠ średnia |
| **M-6** | reguła **„każde ciało zadeklarowane, nigdy odziedziczone"** wraz z pełnym zapisem błędu | ⚙ **kontrola pozytywna** — opisana w kodzie wzorcowo: objaw, pomiar, przyczyna, dlaczego nikt tego nie widział. Przeniesiona bez zmian |
| **M-7** | pomiar polityk intencji (ucieczka „ominięta" jak dojście do punktu skróciła udział pełnych zrywów) | ⚙ **kontrola pozytywna** — pomiar z powodem, przeniesiony jako uzasadnienie `N-126`/`N-127` |

⚠ **Profil domeny: zero sprzeczności, pięć milczeń, dwie kontrole pozytywne.**
⚠⚠ Jedno ze znalezisk jest **korektą ustalenia z wcześniejszej ekstrakcji tej
samej serii** (M-2) — drugi taki przypadek po `shields`/`combat`.

---

## 4. Rejestr decyzji z mocą

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **intencja zamiast wektora** jako granica warstwy | KOD | **ACTIVE** |
| D-2 | **kompozycja, nie klasa bazowa** — wymuszone brakiem wspólnego przodka | KOD | **ACTIVE** |
| D-3 | **pięć intencji po POLITYCE wobec przeszkody**, nie po nazwie | KOD, pomiar | **ACTIVE** |
| D-4 | **ucieczka nie ma celu** — solver nie zawraca | KOD | **ACTIVE** |
| D-5 | **migracja bezpieczna po jednym** (brak intencji = warstwa milczy) | KOD | **ACTIVE** |
| D-6 | **trasowanie globalne tylko dla „dojdź do punktu"** | KOD | **ACTIVE** |
| D-7 | **model dwustopniowy**: trasa globalna + ten sam solver lokalny | KOD | **ACTIVE** |
| D-8 | **wybór solvera per gatunek, nigdy globalnie** | KOD | **ACTIVE** (M-4) |
| D-9 | **„nie ma drogi" jako odpowiedź**, nie awaria; ⛔ bez timeoutu | KOD, 2026-09-05 | **ACTIVE** |
| D-10 | **każde ciało zadeklarowane, nigdy odziedziczone** | `BodySpec` | **ACTIVE** (M-6) |
| D-11 | **ciało fizyczne ≠ hurtbox** — zwężenie ciała nie stroi zasięgu | KOD | **ACTIVE** |
| D-12 | **warstwa czysta**, uruchamialna poza silnikiem | KOD | **ACTIVE** |
| D-13 | **obciążenie mnoży koszty, nie prędkość** | KOD | ⚠ **ACTIVE jako stan; parking otwarty** → `OI-48` |
| D-14 | „**ciężar pancerza → koszt mobilności**" jako pozycja odłożona | `odlozone.md` | ⚠ **częściowo zrealizowana** — korekta M-2 |
| D-15 | **miękka kolizja krzewów** — zaprojektowana, świadomie niewdrożona | `las_faza1b_final.md` | **ACTIVE** (decyzja negatywna) |
| D-16 | **standard prześwitu formalnie NIEROZSTRZYGNIĘTY, ale nieblokujący** — trasowanie obchodzi ciasne miejsca zamiast wymagać przerzedzenia | `las_faza1b_final.md` §10 | **ACTIVE** |

⚠ **Zastąpienie CZĘŚCIOWE po raz JEDENASTY z rzędu** (D-14) — i po raz drugi
w serii jest to **korekta ustalenia poprzedniej ekstrakcji**, nie dokumentu
autora.

---

## 5. Pomiary

**Metoda:** wartości wprost z konfigu; prędkości pościgu porównane z prędkością
marszu i sprintu gracza; prędkości akcji zobowiązanych odczytane z ich
własnych pól.

| pomiar | wynik |
|---|---|
| **najwyższa prędkość pościgu w rosterze** | **niższa niż marsz gracza** |
| prędkości akcji zobowiązanych | **wielokrotnie wyższe** niż marsz |
| gatunki używające omijania | ⚠ **jeden z siedmiu** — reszta idzie wprost |
| wpływ obciążenia na prędkość | **zero** |
| wpływ atrybutów na prędkość | **zero** |

**Co z tego wynika, bez oceny:**

1. ⚠⚠ **Nie da się uciec przed zobowiązaniem, ale da się odejść od pościgu.**
   To jest spójna reguła walki — **i nigdzie nie zapisana** → `OI-49`.
2. ⚠ **Opt-in na omijanie jest realny, nie deklaratywny** — dziś korzysta z niego
   jeden gatunek. ⛔ To znaczy, że włączenie go komuś kolejnemu jest **zmianą
   odczucia**, nie porządkami (`N-129`).
3. ⚠ **Ciężki pancerz nie spowalnia** — kosztuje wysiłek. `OI-48`.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| intencja zamiast wektora | 🆕 **N-124** |
| kompozycja, nie dziedziczenie | 🆕 **N-125** |
| pięć intencji po polityce | 🆕 **N-126** — z zachowanym **pomiarem** (M-7) |
| ucieczka bez zawracania | 🆕 **N-127** |
| trasowanie tylko dla „dojdź do punktu" | 🆕 **N-128** (M-5) |
| solver per gatunek | 🆕 **N-129** (M-4) |
| „nie ma drogi" to odpowiedź | ✅ **N-130** — ⚠ **współdzielony z `creatures`** (`N-117`): tu jako wynik warstwy, tam jako reguła zerwania pościgu |
| ciało zawsze zadeklarowane | ✅ **N-131** — przeniesione bez zmian (M-6) |
| ciało ≠ hurtbox | ✅ **N-132** — ⚠ współdzielony z `creatures` (`N-116`) |
| prędkość gracza = baza × spowolnienie × sprint | 🆕 **N-133** (M-1) |
| pościg nie dogania; dogania zobowiązanie | 🆕 **N-134** (M-3) — ⚠ opisany jako reguła, **ale nie potwierdzony jako zamierzony** → `OI-49` |
| warstwa czysta | 🆕 **N-135** |
| kiedy ktoś goni/ucieka | ➡ **ZOSTAJE** w `creatures` |
| koszt sprintu i uniku, mnożnik obciążenia | ➡ **ZOSTAJE** w `stamina` |
| unik: cooldown, nietykalność, slot | ➡ **ZOSTAJE** w `abilities` |
| impuls jako skutek trafienia | ➡ **ZOSTAJE** w `combat` |
| przejezdność terenu i siatka | ➡ **ZOSTAJE** w `world` |
| standard prześwitu | ➡ **ZOSTAJE** jako decyzja etapu lasu — ⚠ nieblokująca, nieprzenoszona do `STAN` |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **Ekstrakcja potrafi POPRAWIĆ ustalenie innej ekstrakcji z tej samej
   serii** (M-2). Zapis „pozycja zaparkowana — ZASTĄPIONA" powstał w `armor`
   na podstawie faktu, że waga przedmiotów istnieje. **Był za szeroki**: parking
   pytał o **koszt mobilności**, a wdrożono koszt **wysiłku**. ⛔ Wniosek:
   **„zastąpione" wymaga sprawdzenia, czy zrealizowano to, o co pytano** — a nie
   tylko, czy coś w tej okolicy powstało. To drugi taki przypadek w serii.

2. ⚠⚠ **Milczenie o nieistnieniu — piąty raz, tu w najczystszej postaci.**
   „Na prędkość nie wpływa żaden atrybut ani obciążenie" (M-1) to zdanie
   o **dwóch brakujących zależnościach**. ⛔ Nie znajdzie go grep, bo nie ma
   czego szukać; znajduje je **wyłącznie pytanie „co jeszcze mogłoby na to
   wpływać".**

3. ⚠ **Reguła może być prawdziwa i niezamierzona jednocześnie** (M-3, `OI-49`).
   „Pościg nie dogania marszu" zachodzi dla całego rosteru — ale nic tego nie
   pilnuje, więc nie wiadomo, czy to projekt, czy zbieg okoliczności.
   ⛔ **Ekstrakcja nie ma prawa awansować obserwacji na regułę** — może ją
   opisać i zapytać.

4. ⚙ **Najlepiej udokumentowana warstwa w całym projekcie.** Instrukcje przy
   kodzie niosą tu objaw, pomiar, przyczynę i wyjaśnienie, dlaczego błąd był
   niewidoczny — ⭐ **`BodySpec` jest wzorcem zapisu błędu, którego reszta
   projektu jeszcze nie dorównała**. Ekstrakcja przenosiła, nie prostowała.

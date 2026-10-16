---
typ: STAN
domena: quests
tytul: Zadania, rozmowy, NPC — stan, etap, wskazówka
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:quest_guidance_weryfikacja]
kotwice:
  - src/core/Quests.ts
  - src/core/Dialogue.ts
  - src/core/Npcs.ts
  - src/core/QuestGuidance.ts
  - src/core/NpcStatus.ts
  - src/core/TrackedQuest.ts
  - src/scenes/QuestSpots.ts
  - tools/quest_guidance_weryfikacja.mjs
  - tools/rozmowy_przymiar.mjs
otwarte: [OI-64, OI-87]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

# Zadania, rozmowy, NPC — stan, etap, wskazówka

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak gra pamięta, co
> gracz ma do zrobienia i o co już zapytał**: stan zadania, etapy, cele,
> przejścia, bramki rozmowy i jedna wskazówka „co dalej".
>
> **Czym NIE jest.** ⛔ **Nie opisuje ani jednego zadania, NPC-a ani tematu** —
> to jest zawartość. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| stan zadania, etapy, cele, przejścia | **`quests`** |
| co gracz już zapytał i czy wolno zapytać | **`quests`** *(warstwa rozmowy)* |
| kim jest NPC jako **spoiwo** zadań, tematów i nauki | **`quests`** |
| **gdzie** NPC stoi i którą mapę zamieszkuje | `world` |
| przyjęcie przedmiotu i miejsce w plecaku | `inventory` |
| czym jest przedmiot i ile kosztuje | `items`, `economy` |
| XP i punkty za ukończenie | `progression` |
| odkrycie gatunku jako fakt ze świata | `gathering` |
| nauka u trenera | `progression` |
| kształt zapisu i wersjonowanie | `save` |
| okno rozmowy, wiersze, pauza | `ui` |

### 0.1 Dlaczego JEDNA domena, nie dwie

⚙ **Sprawdzone kodem, nie przyjęte z nazwy.** Kontrakt dokumentacji już dziś
mówi *„zadania, dialogi, NPC"* — kod tego nie podważa, ale z **innego powodu,
niż podpowiada intuicja**:

1. ⚠ **Zależność jest JEDNOKIERUNKOWA.** Warstwa rozmowy czyta stan zadań;
   ⛔ **stan zadań nie czyta rozmowy ani razu**. Cel „porozmawiaj" zalicza się
   przy **otwarciu okna**, a robi to interfejs — nie warstwa pytań.
2. ⭐ **Spoiwem jest NPC, nie mechanika.** Ten sam rekord niesie zadania,
   tematy, powitania i rolę trenera; rozdzielenie domen rozcięłoby **jeden
   obiekt danych**, a nie dwa systemy.
3. ⚠ **Żadna z warstw nie musiałaby powtarzać reguły drugiej** — i to jest
   argument **za** możliwością rozdziału, nie przeciw.

⛔ **Nie rozstrzygam, czy `dialogue` ma kiedyś zostać wydzielona** — dowody
zebrane w `OI-64`, decyzja należy do autora *(rozszerzenie listy domen wymaga
decyzji, DOC_CONTRACT §4)*.

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `quests` **bierze** | `inventory` | odpowiedź „zmieści się?" **przed** zobowiązaniem |
| `quests` **bierze** | `gathering` | odkrycie gatunku jako **bramkę rozmowy** |
| `quests` **daje** | `progression`, `economy` | XP i złoto przy oddaniu |
| `quests` **daje** | `economy` | ⚠ **zakaz sprzedaży** przedmiotu z zadania |
| `quests` **daje** | `creatures` | ⚠ **fakt, że elita już padła** — świat jej nie stawia |
| `quests` **daje** | `ui` | jedną wskazówkę „co dalej" i jeden glif nad NPC |
| `world` **daje** | `quests` | miejsce, w którym NPC stoi |

⚠⚠ **Ani jeden cel zadania nie odwołuje się do MIEJSCA.** Nie ma celu „idź
tam"; najbliższym jest „porozmawiaj", a gdzie ten ktoś stoi, wie `world`.

---

## 1. Trzy warstwy i jedno spoiwo

```
ZADANIE   status · etap · liczniki               ← stan, zapisywany
ROZMOWA   zbiór zadanych pytań                    ← stan, zapisywany
NPC       zadania + tematy + powitania + nauka    ← dane, spoiwo
```

⚠ **Warstwa rozmowy nie decyduje, co temat MÓWI** — treść stoi przy NPC-u.
Odpowiada wyłącznie na **„czy wolno o to zapytać"** i **„czy już pytałem"**.

---

## 2. Cel: dwie rodziny, śledzone inaczej

| rodzina | co to znaczy | jak jest liczona |
|---|---|---|
| **wyprowadzana** *(zbierz, załóż)* | świat **sam wie**, ile masz | ⚠ **czytana na żywo przy każdym pytaniu, nigdy przechowywana** |
| **zatrzaskiwana** *(ubij, porozmawiaj, stań w miejscu)* | nic w świecie nie pamięta, że to się stało | ⚠ zapisywana w chwili zdarzenia |

⭐ **Stań w miejscu (`reach`, 2026-10-12)** — punkt `miejsce` z mapy (`id`)
i opcjonalny przedmiot w plecaku. Zalicza **scena** (`QuestSpots`), nie
warstwa zadań: przed zaliczeniem może się coś wydarzyć w świecie (Kirka
przybiega i zjada mięso). Czasownik i podmiot wpisu są danymi zadania.
Literówkę w `spot` łapie `rozmowy_przymiar` §Z7.

⭐ **Porozmawiaj = rozmowa W TEMACIE (`OI-66`, autor 2026-10-12).** Cel
`talk` z polem `topic` zalicza się, gdy gracz otworzy ten temat u tej osoby
(`recordTopic`, także z archiwum), nie gdy otworzy okno. Temat do zadania stoi
na początku pytań ze złotym „!”; za bramką `after` — „!” dostaje temat, który
go odsłania. Hub: „temat do zadania”. Cel bez `topic` zachowuje stare
znaczenie, ale dziś nie używa go żadne zadanie. Brakujący temat łapie §Z8.

⚠⚠ **Postęp wyprowadzany jest odwracalny i to jest zamierzone.** Sprzedaj zioła
— licznik spada; zdejmij kij — cel się cofa. ⭐ **Oddanie jest tym, co zjada
towar**, więc przechowana liczba mogłaby się rozjechać z plecakiem.

⚠⚠ **Zatrzaskiwane liczą się WYŁĄCZNIE, gdy zadanie jest aktywne.** Zabicie
elity, zanim ktokolwiek o to poprosi, **nie domyka zemsty po cichu**.

⚙ **Osobno od tego biegnie licznik zabójstw na całe życie postaci** — jego
jedyne zadanie to, żeby elita **nie wróciła po przeładowaniu strony**. ⛔ Cele
„ubij" z niego **nie czytają**.

---

## 3. Etapy

⚠⚠ **Etapy są LISTĄ, nie grafem.** Bez rozgałęzień, bez warunków między
krokami, bez wymagań per cel. ⭐ Powód jest zmierzony, nie estetyczny: łańcuchy
społeczne, których ten projekt chce, są **liniowe**, a model grafu kosztowałby
złożoność za problem, którego nie ma.

⚠ **Przejście jest AUTOMATYCZNE i pętlowe** — jedno zdarzenie może przenieść
zadanie przez kilka już spełnionych etapów naraz.

⚠⚠ **„Wydano nagrodę etapu" to OSOBNY fakt od „na którym etapie jestem".**
Ostatni etap nigdy nie przechodzi dalej, a jego nagroda i tak ma paść
**dokładnie raz** — bez osobnego zapisu wypadłaby albo nigdy, albo przy każdym
kolejnym zdarzeniu.

⚠ **Etap zapisuje się IDENTYFIKATOREM, nigdy indeksem** — przestawienie
kolejności w treści nie ma prawa przesunąć zapisanego postępu.

⚠⚠ **Przeliczanie po zdarzeniu jest RE-ENTRANCYJNE i musi mieć strażnika.**
Wręczenie przedmiotu emituje zmianę plecaka, a ta wywołuje kolejne przeliczenie
— **wewnątrz** trwającego. Bez blokady ten sam etap wręcza nagrodę raz za razem,
aż plecak się zapełni.

---

## 4. Przejścia: wszystko albo nic

| przejście | reguła |
|---|---|
| **wzięcie** | wolno tylko z „dostępne"; wręczany zestaw startowy idzie do plecaka |
| **oddanie** | ⚠ **u właściwej osoby** — sprawdzane w mechanice, nie tylko przez to, gdzie panel je wyświetla |
| **oddanie** | ⚠⚠ **sprawdź KOMPLET, zanim pobierzesz cokolwiek**: i towar, i miejsce na nagrodę |
| **warunek wstępny** | ⚠ bramkuje **WZIĘCIE**, nigdy oddanie |

⚠⚠ **Warunek wstępny działający na oddanie byłby pułapką.** Dopisanie wymagania
do zadania, które ktoś ma **już w dzienniku**, ukryłoby je u dawcy i uczyniło
**nieoddawalnym na zawsze** — postać zostałaby z wpisem, którego nie da się
domknąć.

⚠⚠ **Nic, co zadanie wręcza, nie może przepaść przez pełny plecak.** Krok
z nagrodą **czeka** — zostaje „spełniony, jeszcze nie wypłacony" i próbuje
ponownie, gdy gracz zwolni miejsce. ⛔ Ani upuszczenie na ziemię, ani ciche
pominięcie.

⚙ **Oddanie zjada wyłącznie cele „zbierz".** Zabójstwo jest już wydane,
a odbieranie kija, który kazano nosić, byłoby absurdem.

---

## 5. Przedmiot z zadania: dwie osłony i jedna łata

⚠⚠ **Przedmiot WRĘCZONY przez trwające zadanie jest niesprzedawalny.**
To nie jest wygoda — to jest **warunek bezpieczeństwa całego wręczania**: rzecz,
którą można oddać za monety człowiekowi, który wręczy następną, jest kranem ze
złotem.

⚠ **Druga, niezależna osłona: sprzedaż, która zerwałaby cel.** Liczona
**SUMĄ po zadaniach, nie maksimum** — dwa zadania po trzy sztuki naprawdę
potrzebują sześciu, bo każde oddanie zjada własne trzy.

⚠ **Trzecia warstwa to jednorazowe uzupełnienie u dawcy.** ⛔ **Siatka
bezpieczeństwa, nie zaopatrzenie** — pod normalną grą nie odpala się nigdy,
bo sprzedaż jest już zablokowana. Liczy też to, co gracz **ma na sobie**,
inaczej przyjście w podarowanym kiju wyglądałoby jak strata.

⚠ **Limit „raz na zadanie, na zawsze" jest zapisywany** — bez tego przeładowanie
strony otwierałoby ten kran od nowa.

---

## 6. Rozmowa: jeden zbiór pytań na cały świat

⚠⚠ **Zbiór zadanych pytań jest GLOBALNY, nie per NPC.** Dzięki temu pytanie
u jednej osoby otwiera pytanie u drugiej — **wiedza wędruje między ludźmi**,
a to jest jedyny tani sposób, żeby tak mała obsada sprawiała wrażenie, że wie
rzeczy, których gracz nie wie.

**Trzy bramki, łączone koniunkcją:**

| bramka | znaczenie |
|---|---|
| **po innych pytaniach** | łańcuch zamiast menu |
| **po ukończonym zadaniu** | rozmowa dogania fabułę |
| **po odkryciu gatunku** | ⭐ jedyna bramka opisująca coś zrobionego **w świecie**, nie powiedzianego |

⭐ **Grupa tematów** (D14, 2026-10-13): pole `group` tematu (słownik
`TOPIC_GROUPS`) zbiera tematy RÓWNOLEGŁE — wiele niezadanych naraz, jak zioła
u Zielarki — w jeden wiersz rozmowy z licznikiem nowych; łańcuch `after`
grupą nie jest (prowadzi go rozmowa sama). ⚠ Grupa nie jest bramką: niczego
nie odsłania ani nie ukrywa, tylko zmienia, GDZIE pytanie stoi. Literówkę
i grupę jednego tematu łapią `R6`/`R7` przymiaru rozmów.

⚠⚠ **Pytanie niedostępne jest UKRYTE, nigdy wyszarzone.** Pytania, którego nie
wolno zadać, gracz **nie ma powodu znać** — wypisanie go zdradza łańcuch, do
którego należy. ⚙ To jest **odwrotność reguły dla przycisków** *(`ui`: odmowa
widoczna z powodem)*, i różnica jest celowa: przycisk odmawia **czynności**,
temat ukrywa **wiedzę**.

⚠ **Zapisanie pytania emituje zmianę tylko za PIERWSZYM razem** — inaczej każde
ponowne przeczytanie odpowiedzi zapisywałoby grę.

⚠ **Nieznane identyfikatory z zapisu zostają, nie są kasowane** — temat usunięty
dziś może wrócić, a ciche zapomnienie oznaczyłoby go graczowi jako nowy.

---

## 7. Jedna wskazówka, trzy miejsca

⚠⚠ **„Co dalej" liczy się w JEDNYM miejscu**, a tracker, glif nad NPC-em
i dziennik są **trzema odczytami tej samej odpowiedzi**. ⛔ Drugie takie
miejsce rozjechałoby się z pierwszym przy pierwszej zmianie.

⚠ **To nie jest planer.** Przy kilku niespełnionych celach wskazuje
**pierwszy w kolejności autora** i na tym kończy — nie waży odległości ani
trudności. ⚙ Kolejność jest **decyzją autora w danych**.

⚠ **To nie jest też nawigator.** Wskazówka niesie **kto**, nigdy **gdzie** —
ani strzałki, ani odległości.

⚠⚠ **Czasownik i nazwa są ROZDZIELONE, a nazwa stoi po dwukropku
w mianowniku** — i to jest wymuszone gramatyką, nie stylem. Polskie nazwy
odmieniają się nieregularnie *(regularne, przymiotnikowe i zmieniające temat
naraz)*, więc każde wpięcie imienia w zdanie musiałoby je odmienić. ⭐ Dwukropek
**cytuje** nazwę, więc przypadek nie jest potrzebny nigdzie.

⚠ **Nad NPC-em wisi DOKŁADNIE JEDEN glif**, w stałym porządku ważności:
*można tu oddać* → *tu prowadzi bieżący krok* → *jest tu nowa robota*. Trzy
naraz zlewają się w ozdobę. ⚙ Od 2026-10-14 glif jest IKONĄ (wzór: WoW) —
zielony `?`, złoty dymek rozmowy, złoty `!`; zielony `+` trenera stoi rzędem
niżej. ⛔ Znaczenia i kolejność bez zmian.

---

## 8. Niezmienniki

- **N-198** — **cel jest WYPROWADZANY albo ZATRZASKIWANY**; wyprowadzanego
  nigdy się nie przechowuje (§2).
- **N-199** — **zatrzaskiwany liczy się wyłącznie przy aktywnym zadaniu** (§2).
- **N-200** — **etapy są listą, nie grafem**; przechodzi się je po kolei
  i automatycznie (§3).
- **N-201** — **etap zapisuje się identyfikatorem, nigdy indeksem** (§3).
- **N-202** — **„nagroda etapu wydana" to osobny fakt od „na którym etapie
  jestem"** (§3).
- **N-203** — **przeliczanie po zdarzeniu jest re-entrancyjne i wymaga
  strażnika** (§3).
- **N-204** — **wszystko albo nic**: sprawdź komplet warunków, zanim pobierzesz
  cokolwiek (§4).
- **N-205** — ⛔ **nic wręczanego nie przepada przez pełny plecak**; krok czeka
  (§4).
- **N-206** — **warunek wstępny bramkuje WZIĘCIE, nigdy oddanie** (§4).
- **N-207** — **oddaje się u właściwej osoby**, i pilnuje tego mechanika, nie
  układ panelu (§4).
- **N-208** — **przedmiot z aktywnego zadania jest niesprzedawalny**;
  uzupełnienie przysługuje **dokładnie raz** (§5).
- **N-209** — **zbiór zadanych pytań jest globalny** (§6).
- **N-210** — **pytanie niedostępne jest ukryte, nie wyszarzone** (§6).
- **N-211** — **jedna wskazówka „co dalej", jeden odczyt** dla trackera, glifu
  i dziennika (§7).
- **N-212** — **czasownik i nazwa rozdzielone; nazwa w mianowniku po
  dwukropku** (§7).

---

## 9. Checklista

**Nowe zadanie:** ⚠ rozstrzygnij rodzinę każdego celu (N-198) · ⚠ warunek
wstępny to bramka **wzięcia** (N-206) · ⚙ nagroda i wręczany zestaw muszą
przejść regułę „wszystko albo nic" (N-204, N-205) · ⛔ nie zakładaj, że gracz
odda je u dawcy — **powiedz to danymi** (N-207).

**Nowy etap:** ⚠ nadaj mu **stabilny identyfikator** (N-201) · ⚙ pamiętaj, że
ostatni etap też wypłaca swoją nagrodę, i **dokładnie raz** (N-202).

**Nowy temat:** ⚠ bramkuj **łańcuchem**, nie listą (N-209) · ⛔ nie wyszarzaj
(N-210) · ⚠ grupa (`group`) tylko dla tematów równoległych · ⚙ odwołania
i grupy sprawdza `node tools/rozmowy_przymiar.mjs` (OI-65).

**Nowy NPC:** ⚙ jeden rekord niesie zadania, tematy, powitania i naukę (§1) ·
⚠ zadanie musi być wymienione **u swojego dawcy**.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/quest_guidance_weryfikacja.mjs` · `node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| dwie rodziny celów | ✅ | ✅ | `kod:2026-09-06` |
| zatrzask tylko przy aktywnym zadaniu | ✅ | ✅ | `kod:2026-09-06` |
| etapy jako lista, przejście automatyczne | ✅ | ✅ | `kod:2026-09-06` |
| etap po identyfikatorze | ✅ | ✅ | `kod:2026-09-06` |
| „nagroda etapu wydana" jako osobny fakt | ✅ | ✅ | `kod:2026-09-06` |
| strażnik re-entrancji | ✅ | ✅ | ❌ **złapane na żywo, brak przymiaru** |
| wszystko albo nic przy oddaniu | ✅ | ✅ | `kod:2026-09-06` |
| krok czeka zamiast gubić nagrodę | ✅ | ✅ | `kod:2026-09-06` |
| warunek wstępny bramkuje tylko wzięcie | ✅ | ✅ | `kod:2026-09-06` |
| oddanie u właściwej osoby | ✅ | ✅ | ⚙ **zero zadań to ćwiczy** |
| zakaz sprzedaży + rezerwacja celu | ✅ | ✅ | `kod:2026-09-06` |
| jednorazowe uzupełnienie | ✅ | ✅ | `kod:2026-09-06` |
| globalny zbiór pytań, trzy bramki | ✅ | ✅ | `kod:2026-09-06` |
| ukrywanie zamiast wyszarzania | ✅ | ✅ | `kod:2026-09-06` |
| jedna wskazówka „co dalej" | ✅ | ✅ | ✅ `przymiar:quest_guidance` |
| rozdział czasownika i nazwy | ✅ | ✅ | ✅ `przymiar:quest_guidance` |
| **spójność odwołań w treści** | ✅ *(dziś zero wiszących)* | ✅ | ✅ `przymiar:rozmowy_przymiar` (2026-10-11) — OI-65 zamknięte |
| **wydzielenie warstwy rozmowy** | — | ✅ *(dowody zebrane)* | ⛔ **decyzja autora** — OI-64 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-64** | ⚠ **Czy warstwa rozmowy ma zostać osobną domeną — dowody zebrane, decyzja nierozstrzygnięta.** Za rozdziałem: własny stan, własne pole zapisu, własne zdarzenie, **zależność jednokierunkowa** *(rozmowa czyta zadania, zadania rozmowy nie)* i **przewaga objętości zawartości** — 73 tematy wobec 15 zadań. Przeciw: spoiwem jest **jeden rekord NPC-a**, niosący zadania, tematy, powitania i naukę naraz; rozdział rozciąłby obiekt danych, nie system. ⚙ Kontrakt dokumentacji przypisuje dziś jedno do drugiego. ⛔ **Decyzja AUTORA** — lista domen rozszerza się wyłącznie decyzją z dowodami. |
| **OI-65** | ✅ **ZAMKNIĘTE 2026-10-11** — przymiar `node tools/rozmowy_przymiar.mjs` (bramki tematów, cele i nagrody zadań, dawcy, sklepy, osiągalność). Stan: 88 tematów i 15 zadań osiągalnych; jedna literówka w `after` ukrywała łańcuchem 10 tematów. |
| **OI-66** | ✅ **ZAMKNIĘTE 2026-10-12** (autor): „porozmawiaj” = rozmowa w danym temacie — §2. Wpis: `docs/issues_archive.md` |
| **OI-87** | ⚠⚠ **Dane są rozmową, interfejs jest indeksem — a to jest wybór RENDEROWANIA, nie brak autorstwa.** Zmierzone: najszerszy front rozmowy w całej grze to **3 pytania**, 18 z 19 NPC-ów otwiera się jednym, a panel woła `Dialogue.available()` i rysuje wszystko odblokowane **łącznie z już zadanym** (u Patryczka 11 wierszy z przewijaniem). `Dialogue.newCount()` liczy właściwy front i napędza dziś plakietkę, nie widok. ⛔ **Do rozstrzygnięcia jako JEDEN pakiet** (dziesięć pytań: rozmiar panelu, ile świata w tle, reprezentacja NPC i kwestii gracza, przejścia, rola hubu, droga do questa, reakcja na stan świata) — pełna lista w `docs/dziennik.md` 2026-09-08 (4). Zakres i to, czego świadomie NIE ruszamy: `docs/decyzje/2026-09-08-prezentacja-przed-modelem-danych.md` |

---

## Czego ten dokument nie rozstrzyga

- **Żadnego zadania, NPC-a, tematu, etapu ani nagrody z osobna** — to jest
  content.
- **Czy zadań, dawców i tematów jest dobra liczba** — to jest ilość zawartości.
- **Gdzie NPC stoi i którą mapę zamieszkuje** — `world`.
- **Przyjęcia przedmiotu i polityki pojemności** — `inventory`.
- **Ile XP i złota jest warte ukończenie** — `progression`, `economy`.
- **Odkrycia gatunku jako mechaniki** — `gathering`.
- **Nauki u trenera** — `progression`.
- **Okna rozmowy, wierszy i pauzy** — `ui`.
- ⛔ **Kolejności zadań w fabule** — to jest decyzja autora w danych.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego etapy są listą, a nie grafem | `src/core/Quests.ts` *(przy kodzie)* | ACTIVE |
| dlaczego zbiór pytań jest globalny | `src/core/Dialogue.ts`, `src/core/Npcs.ts` | ACTIVE |
| dlaczego wskazówka ma jeden dom i skąd dwukropek | `src/core/QuestGuidance.ts` | ACTIVE |
| priorytet glifów nad NPC-em | `src/core/NpcStatus.ts` | ACTIVE |
| skąd wzięły się etapy — zgłoszenie i przebieg diagnozy | `docs/QUEST_01_WSTEP_DO_MYSLIWEGO.md` | HISTORICAL |
| ocena pierwszego rozdziału zadań | `docs/rozdzial1_questy_ocena.md` | ACTIVE |
| polityka pełnego plecaka, której to jest klientem | `docs/systemy/inventory.md` §5 | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_quests.md` | — |

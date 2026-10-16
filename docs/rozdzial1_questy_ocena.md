---
typ: HISTORIA
domena: quests
tytul: Rozdział I jako sieć questów — pakiet do oceny
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-22
---

# Rozdział I jako sieć questów — pakiet do oceny z zewnątrz

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/quests.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: PATCH A WDROŻONY (2026-08-22) w `GameConfig.ts`.** Struktura
zbieżna po czterech rundach (GPT: 8,5/10, zielone światło; nazwa MQ2:
„Pierwszy odstrzał"). Graf zweryfikowany na żywym, zbundlowanym configu —
zero cykli, wszystkie prereqy wskazują istniejące id. `tsc --noEmit` i
`npm run build` czyste. PATCH B (merge questów Doroty) świadomie
NIEWDROŻONY — pozostaje osobną zmianą.

Jedna korekta wobec planu: „pamięć referrali" przez warunkowe powitanie
(`Dialogue.isAsked`) **okazała się niebudowalna bez zmiany silnika** —
`pickGreeting()` nie ma żadnego rozgałęzienia na zbiór zadanych pytań, tylko
na status questa. Sprawdzono też, że nie była potrzebna: `PEASANT.firstJob`
(„Miłosz cię przysłał?") i `BLACKSMITH.firstJob` („Sobek u mnie był i gadał
o kołach") **już zakładają referral bezwarunkowo** — istniejący tekst,
sprzed tej rundy. Gated topic (`Topic.after`) zostaje jako tania opcja na
przyszłość, nie część Patcha A.

Ten dokument jest samowystarczalny — nie zakłada dostępu do poprzedniej
rozmowy, tylko do repo.

## ⚠ Playtest NIE wykonany — środowisko nie renderuje

GPT poprosił o dwa przebiegi (tylko MAIN, potem naturalna gra). **Claude nie
mógł tego zrobić**: dev server się uruchamia, ale `document.hidden = true`
w tym środowisku, przeglądarka throttluje/zawiesza sieciowe wczytywanie
assetów w tle, a loader Phasera stoi na 32/106 bez ruchu (potwierdzone: 2000
ręcznych kroków pętli gry nic nie zmieniło — problem jest w sieci, nie w
klatkach). To samo ograniczenie wystąpiło wcześniej w tej sesji przy
weryfikacji HUD-u.

**Co Claude zrobił zamiast tego:** statyczny odczyt całego łańcucha
tekstów pod kątem pięciu kategorii blokerów z listy GPT (gdzie iść, dlaczego,
sprzeczność, przedwczesna wiedza, brak mostu). To NIE jest playtest — nie
mówi nic o tym, czy wilki „czują się pilne" ani czy „myśliwy" brzmi jak coś
zapracowanego. Te pytania (GPT #3, #5, #6) wymagają grania przez człowieka.
Znalezione i naprawione statycznie, bez grania:

1. **Bloker, `GNIEWKO.notYet`** — podczas obchodu w `know_the_village`
   Gniewko mechanicznie nie ma jeszcze żadnego zadania (`wolf_pack_cull`
   odblokowuje się dopiero PO oddaniu obchodu Sołtysowi), więc pada na tekst
   napisany dla przypadkowego przechodnia: „Idź, chłopcze, nie płosz mi ich."
   Dokładnie odwrotnie niż premisa questa. **Naprawione** — nowy tekst
   oddaje informację o wilkach, nie otwierając questa mechanicznie wcześniej.
2. **Bloker, `rabbit_hunt.greetings.turnIn`** — beat, który sam dopisałem
   w tej sesji, nigdzie nie kierował gracza do Sołtysa. **Naprawione.**
3. **Obserwacja, NIE naprawiona (poza zakresem tego patcha):** żaden tekst
   `stick_in_hand` (Marko ani Patryczek) nie nazywa Wszebora z imienia ani
   nie mówi wprost „idź do niego" — most MQ1→MQ2 opiera się dziś wyłącznie
   na znaczniku questa. Pre-existing, nie wprowadzone tym patchem. Do
   sprawdzenia przy właściwym playteście (pytanie GPT #1).
4. **Fałszywy alarm, sprawdzony i odrzucony:** `SOBEK` nie ma pola `notYet`
   — pada na neutralny `greeting` bazowy, nie koliduje z niczym. Pierwszy
   grep był wadliwy (przypadkowo złapał tekst Gniewki); poprawiony przez
   `grep -n` na dokładnych numerach linii przed jakąkolwiek zmianą.

**Wniosek: statyczny odczyt złapał dwa realne blokery i uratował przed
naprawianiem nieistniejącego trzeciego — ale nie zastępuje graniania.**
Pytania GPT #1, #3, #5, #6 (czy coś "czuje się" pilne/zapracowane/naturalne)
zostają w całości dla człowieka.

## ⚠ Dwa niezależne patche, nie jeden

Rekomendacja z rundy 4 (GPT, potwierdzona): przebudowa kręgosłupa i merge
questów Doroty to **dwie osobne zmiany produkcyjne**, mimo że obie dotykają
istniejących `id`. Rozdzielenie pozwala przy playteście przypisać poprawę
tempa właściwej zmianie, zamiast zgadywać, która z dwóch jednoczesnych
edycji zadziałała.

- **PATCH A** — przebudowa MQ1–MQ6 + reprioritetowanie prereqów (ta sekcja).
- **PATCH B** — merge `zielarskie_zapasy` + `dziurawiec_na_zime` (sekcja
  „Sidequesty"). Niezależny, wdrażalny osobno, przed albo po A.

## Jak to powstało (żeby nie wracać do rozstrzygniętych sporów)

1. Claude przeanalizował 15 istniejących questów i 19 NPC-ów, znalazł że
   struktura jest **rozgałęzieniem, nie łańcuchem** (`wolf_pack_cull`,
   `zajace_w_zbozu`, `grey_wolf_revenge` wszystkie wiszą osobno na
   `rabbit_hunt`), i zaproponował pięć **pierścieni** dobudowanych wokół
   kręgosłupa, bez ruszania jego kolejności.
2. GPT zaproponował inną oś: **przebudować sam kręgosłup w liniowy MQ1–MQ6**
   i dopiero wokół niego powiesić side questy. To jest silniejsza diagnoza —
   Claude to potwierdził w kodzie i przyjął jako szkielet.
3. Dwie korekty przeszły weryfikację źródłową (cytaty i linie niżej):
   - **Sołtys nazywa się Dobiesław** — Claude się mylił, twierdząc inaczej.
     `wioska_plan.md:685`, `swiat.md:273`, i komentarz WEWNĄTRZ
     `GameConfig.ts` (`ELDER`, linia ~4887) wszystkie się zgadzają. Pole
     `ELDER.name` po prostu nigdy nie dostało dopisanego imienia — luka do
     zamknięcia jednym polem, nie spór do rozstrzygania.
   - **Zofia (wdowa) NIE dostaje questa w Rozdziale I.** `swiat.md:43` mówi
     wprost: scenę „ktoś nazywa cię myśliwym" **świadomie przeniesiono** z
     sąsiadki na Sołtysa, „bo on nosi urząd i tylko on ma prawo tak kogoś
     nazwać; sąsiadka […] okazała się niepotrzebna". Dodatkowo dialog Sobka
     (linia ~5666) wspomina trumnę wysłaną Zofii trzy lata temu i kończy się
     instrukcją „nie pytaj o to jej" — gra już raz postawiła znak „nie
     tutaj" przy tej postaci. Zostaje bez questa.

**Te dwie rzeczy są zamknięte. Nie otwierać ich ponownie bez nowego dowodu
źródłowego.**

---

## Ograniczenie techniczne, pod które jest pisany CAŁY poniższy plan

`Quests.isUnlocked` sprawdza `requiresQuest` przez **pełne ukończenie**
zadania, nie przez pojedynczy zrealizowany cel:

```ts
if (q.requiresQuest && this.getStatus(q.requiresQuest as QuestId) !== "completed") return false;
```

Skutek: **nie da się** odblokować side questa w trakcie trwania questa
głównego, tylko po jego pełnym oddaniu. Wszystko niżej jest zaprojektowane
pod to ograniczenie — żadna z trzech odnóg MQ3 nie odblokowuje się
progresywnie w trakcie rozmów, tylko wszystkie naraz, przy oddaniu raportu
Sołtysowi.

Drugie ograniczenie: `giver` jest jednocześnie dawcą i odbiorcą zadania —
nie da się „przyjąć u A, oddać u B". Przekazanie między postaciami modeluje
się jako dwa zadania: pierwsze kończy się `talk: B`, drugie ma
`requiresQuest` na pierwsze i `giver: B`. Ten wzorzec **już działa** w grze
(`droga_na_wschod` → `skora_na_pasy`, Radzim → Sobek).

---

## Główna ścieżka: MQ1–MQ6

Legenda: **ISTNIEJE** = działa dziś bez zmian · **ZMIANA** = istnieje, wymaga
edycji pola · **NOWE** = trzeba dopisać dialog/tekst.

### MQ1 — „Kij w garści" (`stick_in_hand`) — ISTNIEJE bez zmian

| pole | wartość |
|---|---|
| giver | `father` (Marko) |
| requiresQuest | brak (pierwsze zadanie gry) |
| etapy | 1) `equip: stick` (kij wręczony przy przyjęciu, jakość Podła) → 2) `talk: patryczek` (kredytowane samym otwarciem rozmowy; Patryczek wręcza owijki w tej samej rozmowie) |
| dalej | gracz idzie do Wszebora naturalnie — jest dawcą MQ2 |

Sprawdzone w kodzie: struktura dokładnie odpowiada wizji „Marko → kij →
Patryczek → Wszebor". Nic do zmiany.

### MQ2 — „Plaga królików" (`rabbit_hunt`) — ISTNIEJE, jeden dialog do NOWEGO tekstu

| pole | wartość |
|---|---|
| giver | `hunter` (Wszebor) |
| requiresQuest | `stick_in_hand` |
| cel | `collect: rabbit_meat, count: 5` (80% dropu z zabitego zająca) |
| nagroda | 50g, 30 XP, `stick` jakości Wysoka |

⚠ **Kluczowy beat („pięciu zajęcy to za dużo, nie za mało") NIE ISTNIEJE
jeszcze jako tekst.** Dzisiejszy `MERCHANT.greetings.turnIn` to generyczna
linia dzielona przez WSZYSTKIE zadania Wszebora: „Widzę, że nie poszedłeś się
przespać pod drzewem. Dawaj to, z czym wróciłeś." Ponieważ `rabbit_hunt` jest
chronologicznie **pierwszym** zadaniem, przy którym gracz w ogóle zobaczy ten
stan powitania, można bezpiecznie podmienić tę linię na wersję niosącą beat —
koszt: ta sama linia powtórzy się (identyczna) przy oddaniu KAŻDEGO
kolejnego zadania Wszebora, bo `greetings` nie są dziś keyowane per quest,
tylko per stan NPC. **Pytanie do recenzenta w sekcji na końcu.**

### MQ3 — „Sprawy Zagajów" (redesign `know_the_village`) — ZMIANA

**Zachowuje id `know_the_village`** (zmiana id skasowałaby graczom postęp w
zapisie — silnik nie migruje niezgodnych zapisów). Zmienia się **treść i
cele**.

| pole | dziś | po zmianie |
|---|---|---|
| giver | `elder` | `elder` (bez zmian) |
| requiresQuest | brak | `rabbit_hunt` (Wszebor odsyła gracza do Sołtysa) |
| cele | `talk: blacksmith`, `talk: miller`, `talk: peasant` | `talk: gniewko`, `talk: miller`, `talk: sobek` |
| nazwa | „Nowe twarze" | „Sprawy Zagajów" |

**Treść (Sołtys/Dobiesław):**
> „Wszebor zwykle wiedział, co dzieje się przy lesie, zanim ludzie przyszli z
> tym do mnie. Skoro teraz **trochę za niego chodzisz**, zajrzyj do trzech
> osób. Zobacz, czy czegoś nie potrzebują."

⚠ **Zmiana tekstu wynika z ograniczenia mechaniki, sprawdzonego w kodzie
(runda 4, GPT):** `Quests.recordTalk` zalicza `talk` na SAMYM OTWARCIU okna
rozmowy (`NpcDialog.openDialog`), zanim gracz zobaczy jakikolwiek tekst —
mechanika gwarantuje „zajrzałeś", nie „dowiedziałeś się". Sołtys nie może więc
obiecywać „zbierz trzy raporty" ani „dowiedz się, co się stało" — quest ma
brzmieć jak prośba o wizytę, nie o śledztwo, żeby gracz, który tylko otworzy
i zamknie rozmowę bez klikania tematów, nie poczuł złamanej obietnicy.

⚠ **Twarde ograniczenie dla finalnego tekstu (runda 4, GPT):** Sołtys nie
mówi „jesteś teraz zastępcą Wszebora" — to byłby awans przed łukiem, zamiast
jego rezultatem. Formuła to przysługa („trochę za niego chodzisz"), nie urząd.
Status zmienia się dopiero w MQ6.

Trzy rozmowy, **żadna nie daje jeszcze questa** — tylko informację i
(w dwóch przypadkach) referral, który **już istnieje w grze**. Każda pokazuje
INNĄ domenę wsi (bezpieczeństwo / żywność / infrastruktura) — warunek
odróżnienia od „Nowe twarze" jest spełniony już na tym etapie projektu, nie
wymaga dalszej zmiany:

- **Gniewko (owce):** mówi o wilkach podchodzących pod zagrody. Zero
  referrala — sam jest dawcą MQ4.
- **Miłosz (młyn):** temat `zajace_u_dobka` **już istnieje w kodzie**
  (`MILLER.topics`) — „Idź do niego i zapytaj wprost o zające. Tylko nie mów
  mu, że ja cię posłałem." Odsyła do Dobka (peasant).
- **Sobek (wozy):** temat o drewnie na osie **już istnieje w kodzie**
  (`SOBEK.topics`) — „Radzim ci lepiej powie […]. Zapytaj go o wschód."
  Odsyła do Radzima (blacksmith).

⚠ **NOWE, tanie (runda 4, GPT, zweryfikowane budowalne przez `Dialogue.isAsked`):**
Dobek i Radzim powinni mieć **dwie wersje** otwarcia rozmowy o swoim problemie,
warunkowane tym, czy gracz naprawdę zapytał Miłosza/Sobka o referral, a nie
tylko odbył `talk`:
```
IF Dialogue.isAsked("zajace_u_dobka"): "Miłosz ci nagadał?"
ELSE: zwykłe wejście w problem, bez odniesienia
```
To wykorzystuje istniejący globalny zbiór zadanych pytań jako nagrodę za
ciekawość, nie jako obowiązkową mechanikę questu — gracz, który nie kliknął
tematu, nie traci nic poza smaczkiem.

**Powrót do Sołtysa** = scena hierarchizacji:
> „Zboże poczeka dzień. Wóz też. Wilk nie." *(NOWY tekst, do napisania)*

Przy oddaniu odblokowują się **naraz** (bo `requiresQuest` wymaga pełnego
ukończenia):

```
know_the_village (completed)
  ├─ wolf_pack_cull    requiresQuest: rabbit_hunt → know_the_village   [ZMIANA]
  ├─ zajace_w_zbozu    requiresQuest: rabbit_hunt → know_the_village   [ZMIANA]
  └─ droga_na_wschod   requiresQuest: know_the_village                [już tak jest — bez zmian]
```

### MQ4 — „Rachunek pasterza" (`wolf_pack_cull`) — ISTNIEJE bez zmian mechaniki

| pole | wartość |
|---|---|
| giver | `gniewko` (już tak jest — GPT proponował to jako zmianę, w kodzie już jest) |
| requiresQuest | `rabbit_hunt` → **`know_the_village`** [jedyna zmiana] |
| cel | `kill: wolf, count: 3` (już tak jest — GPT proponował „trzyosobową watahę" jako nowy content, w kodzie już jest gotowe) |
| nagroda | 80g, 70 XP |

⚠ Wilki na mapie **respawnują** (12–17 s), więc to nie jest jednorazowo
czyszczony encounter, tylko liczony kill-count na wspólnej puli. Nie zmienia
to niczego mechanicznie, tylko nie sprzedawać w opisie jako unikalne
wydarzenie.

⚠ **Brakujący most do MQ5 — realna luka złapana w rundzie 4 (GPT), teraz
domknięta.** Bez tego przejście czyta się jako „zabij 3 wilki → zabij
większego wilka", nie jako eskalację. Naprawa: `GNIEWKO.greetings.turnIn`
dostaje treść zauważającą coś charakterystycznego (kierunek, ślady,
zachowanie) i odsyłającą do Wszebora — **ten sam wzorzec referrala co
Miłosz→Dobek i Sobek→Radzim w MQ3**, żadnego nowego objective.

> „Wróciłeś. […] Te trzy nie chodziły same — ktoś je tu pchał. Powiedz o tym
> Wszeborowi, on zna te ślady lepiej ode mnie." *(NOWY tekst)*

⚠ **Ten most jest tańszy niż beat MQ2 z tego samego powodu:** `wolf_pack_cull`
to JEDYNE zadanie Gniewki w całej grze, więc jego `greetings.turnIn` nie
dzieli się z żadnym przyszłym zadaniem — zero kosztu powtórki, w
przeciwieństwie do generycznego powitania Wszebora w MQ2.

### MQ5 — „Szary" (`grey_wolf_revenge`) — ZMIANA prereqa + rekomendacja nazwy

| pole | dziś | po zmianie |
|---|---|---|
| requiresQuest | `rabbit_hunt` | **`wolf_pack_cull`** |
| cele | `kill: grey_wolf` + `collect: grey_fang` (bez zmian) | bez zmian |
| nagroda | XP + `grey_fang_necklace` (bez zmian) | bez zmian |

Bezpieczeństwo zmiany: `Quests.isUnlocked` ma wyjątek dla zadań już
aktywnych w zapisie (poprawiony przy okazji `zielarskie_zapasy` —
`GameConfig.ts`, komentarz nad tym zadaniem), więc ostrzejszy prereq nie
psuje nikomu trwającej rozgrywki.

Wszebor przekazuje sprawę Sołtysowi, nie sam nazywa gracza myśliwym:
> „Idź do Dobiesława." — „Po co?" — „Bo to już nie jest tylko sprawa między
> tobą a mną." *(NOWY tekst)*

### MQ6 — „Myśliwy z Zagajów" (`mysliwy_z_zagajow`) — ISTNIEJE bez zmian

| pole | wartość |
|---|---|
| giver | `elder` |
| requiresQuest | `grey_wolf_revenge` (bez zmian) |
| cel | `equip: grey_fang_necklace` |
| nagroda | 220g, 60 XP |

Scena nazwania **już jest napisana** w `ELDER` — potwierdzone w kodzie,
zgodna z `swiat.md §7`. Nic do zmiany.

---

## PATCH B — Sidequesty, mapa bez zmian w MAIN, jeden merge

```
MQ1 ─┬─ prowiant_od_matki (mother)                    ISTNIEJE, bez zmian
     │
     └─ ziola_dla_babki (patryczek)
          ↓
        [zielarskie_zapasy + dziurawiec_na_zime]       MERGE — 2-etapowy quest,
          ↓                                             ta sama mechanika co MQ1
        rekawice_od_wnuka (patryczek)                   ISTNIEJE, bez zmian

MQ2 ─── scraps_bounty (hunter, requires: skinning)       ISTNIEJE, bez zmian

MQ3 ─┬─ zajace_w_zbozu (peasant/Dobek)                  ZMIANA requiresQuest (wyżej)
     │
     └─ droga_na_wschod (blacksmith/Radzim)              ISTNIEJE, bez zmian
          ↓
        skora_na_pasy (sobek)                            ISTNIEJE, bez zmian
```

**Merge `zielarskie_zapasy` + `dziurawiec_na_zime`:** oba mają dziś
`giver: herbalist`, silnik ma już `stages` (dowód: `stick_in_hand`), więc to
czysta redukcja z czterech zadań do trzech, zero nowej mechaniki.

---

## Co NIE wchodzi do Rozdziału I (potwierdzone źródłowo, nie do ponownego otwierania)

- **Zofia/wdowa** — patrz sekcja korekt na górze.
- **„Zapytaj o…" jako questy** (wojskowa przeszłość Marka/Wszebora, most,
  gęstwina) — zostają tematami. Oba recenzenci zgodni niezależnie.
- **Turniej Patryczka, reputacja Sołtysa, nowe profesje, rarity** — poza
  zakresem tej rundy, nikt tego nie proponował.

---

## Pytania dla recenzenta — stan po rundzie 4

Trzy z czterech pytań rozstrzygnięte przez GPT w rundzie 4, zapisane jako
decyzje:

1. **`MERCHANT.greetings.turnIn` (MQ2 beat „pięć to za dużo").**
   ✅ **Rozstrzygnięte: nie zmieniać silnika.** Jeśli koszt reużywanej,
   identycznej linii przy kolejnych zadaniach Wszebora okaże się w praktyce
   zbyt duży — beat wolno chwilowo pominąć albo przenieść gdzie indziej.
   Kręgosłup jest ważniejszy niż to jedno zdanie.
2. **Ile tekstu pisać teraz.**
   ✅ **Rozstrzygnięte: tylko dialogi STRUKTURALNE** — motywacja questa,
   kluczowa informacja, przejście do następnego questa, finał. Voice/flavor
   (drobne charakteryzujące zdania bez wpływu na graf) zostaje na osobną
   sesję.
3. **Pamięć referrali z MQ3.**
   ✅ **Rozstrzygnięte: warunkowo, przez `Dialogue.isAsked()`** — patrz
   sekcja MQ3 wyżej. Zaimplementowane jako wariant otwarcia rozmowy, nie
   jako wymóg questa.

**Jedno pytanie pozostaje otwarte, bo jest wyborem smaku, nie techniki:**

4. **Nazwa MQ2.** GPT proponuje zmianę z „Plaga królików" na „Pierwszy
   odstrzał" albo „Na zające", argumentując że „plaga" zdradza reveal.
   Claude częściowo się nie zgadza z uzasadnieniem — reveal dotyczy WINY
   Wszebora (nieobecność w lesie), nie samej liczby królików, której nazwa
   nie zdradza. Zmiana jest technicznie darmowa (`name` nie jest częścią
   klucza zapisu, wyłącznie `id`) — więc to czysto autorska decyzja bez
   kosztu w żadną stronę.

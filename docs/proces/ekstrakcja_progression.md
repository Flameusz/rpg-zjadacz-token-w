---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — progression i economy
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/atrybuty_kalibracja.mjs, tools/katalog_ekwipunku.mjs]
otwarte: [OI-43, OI-44, OI-45, OI-46]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `progression` i `economy`

> **Po co ten plik.** Materiał dowodowy i zapis procedury dla **dwóch** domen
> zrobionych w jednej sesji; treść poszła do `docs/systemy/progression.md`
> i `docs/systemy/economy.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — plan cięcia i decyzja o rozdziale

### 1.1 Jedna domena czy dwie — rozstrzygnięte ODPOWIEDZIALNOŚCIĄ

⚙ **DWIE.** Trzy argumenty, w tej kolejności:

1. **Kontrakt już je rozdziela.** Lista kanoniczna ma `progression` i `economy`
   jako **osobne pozycje**. Scalenie byłoby zmianą listy domen — czyli tym
   samym progiem, który przy `effects` wymagał decyzji autora. ⛔ Wygoda sesji
   nie jest do tego wystarczającym powodem.
2. **Zestawienie w planie prac było o BUDŻECIE SESJI, nie o taksonomii.**
   Kolejność domen łączy je jednym wierszem, bo obie są małe — a nie dlatego,
   że są jednym systemem.
3. **Odpowiedzialności są rozłączne i widać to w kodzie.** Rozstrzygające:
   ⚠⚠ **złoto i punkty rozwoju nie wymieniają się w żadną stronę.** Jedyny
   punkt styku to dwa ujścia pobierające obie waluty naraz — a to jest reguła
   **atomowości**, nie wspólny system.

⚠ **Kontrargument, który sprawdziłem i odrzuciłem:** „obie mówią o tym, co
gracz gromadzi". To jest podobieństwo **tematu**, nie odpowiedzialności — przy
tym kryterium `items` i `inventory` też byłyby jedną domeną.

### 1.2 Plan cięcia

| | `progression` | `economy` |
|---|---|---|
| **bierze** | źródła XP · krzywa i sufit · co daje poziom · **jedna wspólna pula punktów** · atomowość wydania | źródła złota (⚠ **nie z zabójstw**) · cena = baza × jakość · jakość półki · ujścia · atomowość dwóch walut |
| **oddaje** | co robi punkt → `attributes` · nauka i sloty → `abilities` · `P` i rangi → `proficiency` · złoto → `economy` · kto daje ile XP → `creatures`/`quests` | pola ceny i jakość → `items` · nagrody zadań → `quests` · koszty nauki → `abilities` · cennik rang → `proficiency` · łup → `creatures` |
| **NIE opisze** | ani jednej liczby krzywej i nagród · balansu · czy sufit poziomu jest dobry | ceny żadnego przedmiotu · balansu · czym ma być ujście dla złota |

**SYSTEM vs CONTENT:** SYSTEM = źródła, kształt krzywej jako reguła, wspólna
pula, sposób powstawania ceny, charakter ujść. CONTENT = wszystkie liczby:
progi, nagrody rosteru i zadań, cenniki, asortyment. ⛔ **Zero dokumentów per
poziom, nagrodę, cenę czy sprzedawcę.**

⭐ **Piąta i szósta domena z rzędu pod limitem bez rundy skracania** (9,4 i 9,3 KB).

---

## 2. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **E-1** | audyt z 2026-09-03: nauka umiejętności kosztuje „**835 g + 13 pkt**" | dziś **945 g + 14 pkt** | ⚠ niska — różnica to **dokładnie jedna umiejętność dodana 2026-09-04**. Pomiar był poprawny w swoim dniu |
| **E-2** | zapisany pomiar „**cały sklep w grze kosztuje 1407 g**" | ta ekstrakcja mierzy **≈ 3 156 g** | ⚠ średnia — ⚙ **to NIE jest sprzeczność, tylko INNA METODA**: tamto liczono przy jakości domyślnej i przed wzrostem rosteru, to przy **jakości półki każdego sprzedawcy**. ⚠ Ilustracja reguły „pomiar bez metody starzeje się cicho" |
| **E-3** | **milczenie** — nigdzie nie zapisano, że **zabójstwo NIE DAJE ZŁOTA** | ani jedno stworzenie nie upuszcza monet; jedyne powtarzalne źródło to sprzedaż | ⛔⛔ najwyższa — **fundament całej ekonomii, opisany w kodzie brakiem** |
| **E-4** | **milczenie** — nigdzie nie zapisano, że **naprawa jest jedynym POWTARZALNYM ujściem** | asortyment, nauka i rangi kończą się; naprawa wraca | ⛔ wysoka — to jest treść zaparkowanego problemu „ujście dla złota" |
| **E-5** | **milczenie** — nigdzie nie zapisano, że **poziom sam z siebie nie daje NICZEGO** poza punktami i bramkami | żadnego HP, obrażeń ani statystyki z awansu | ⚠ średnia — decyzja („postać rośnie wyborem, nie czasem") widoczna wyłącznie jako brak kodu |
| **E-6** | „**krzywa XP nieprzestrojona pod obecny roster**" — pozycja znana i otwarta | ⚙ **znana, ale NIGDY NIE POLICZONA** | ⚠ ekstrakcja dodaje **wyłącznie pomiar** (§4); ⛔ decyzja nietknięta → `OI-43` |
| **E-7** | **milczenie** — nikt nie policzył **budżetu punktów wobec ujść** | pula ze skali poziomów wobec sumy kosztów nauki i rang (§5) | ⛔ wysoka → `OI-44` |
| **E-8** | `OI-13` z domeny `attributes`: „liczby budżetu punktów nieprzeliczone (stary roster) — **należy do domeny `progression`**" | ⚙ **depozyt ODEBRANY** i policzony (§5) | ⚙ zamknięte co do pomiaru, **otwarte co do decyzji** → `OI-44` |

⚠ **Profil tej domeny: same milczenia, zero sprzeczności o regułach.** Trzy
z nich (E-3, E-4, E-5) dotyczą **rzeczy, których NIE MA** — patrz §8.

---

## 3. Rejestr decyzji z mocą

Skróty: `A9` = `audyt_walka_progresja_2026-09-03.md`, `OD` = `odlozone.md`,
`JW` = `jakosc_wykonania.md`, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | **jedna wspólna pula punktów** na atrybuty, umiejętności i rangi | `attributes` §4, A9 | **ACTIVE** |
| D-2 | **poziom daje wyłącznie punkty i bramki** | KOD | **ACTIVE** |
| D-3 | **dwa źródła XP: zabójstwo i zadanie** | KOD | **ACTIVE** |
| D-4 | **nagroda należy do stworzenia**, bez skalowania do poziomu | KOD | **ACTIVE** |
| D-5 | **XP na sufcie przepada**, pasek stoi pełny | KOD | **ACTIVE** |
| D-6 | **przelew przez wiele poziomów naraz**, każdy ogłaszany osobno | KOD | **ACTIVE** |
| D-7 | **wydanie punktów atomowe**, ze zwrotem przy niepowodzeniu | KOD | **ACTIVE** |
| D-8 | ⛔ **respec nie istnieje i nie jest planowany** | `attributes` | **ACTIVE** |
| D-9 | **zabójstwo nie daje złota** — pieniądz z handlu | KOD (przez brak) | **ACTIVE** (E-3) |
| D-10 | **łup częściowo bramkowany umiejętnością bierną** | KOD, `SKILLS` | **ACTIVE** |
| D-11 | **jakość mnoży cenę w obie strony**, jedną tabelą | JW, KOD | **ACTIVE** |
| D-12 | **brak ceny kupna = nie do kupienia** | `items` §1.2 | **ACTIVE** — depozyt, odebrany jako reguła ekonomii |
| D-13 | **cena nigdy poniżej jednego złota** | KOD | **ACTIVE** |
| D-14 | **jakość półki należy do sprzedawcy**, osobno per kategoria | KOD | **ACTIVE** — charakterystyka postaci wyrażona towarem |
| D-15 | **naprawa jako ułamek ceny proporcjonalny do braku trwałości** | `items` §2.2 | **ACTIVE** |
| D-16 | **dwa ujścia pobierają dwie waluty**; sprawdź obie przed pobraniem | KOD | **ACTIVE** — trzecie wystąpienie tej samej reguły w projekcie |
| D-17 | **rangi jako główne ujście złota** („ujście rosnące z decyzjami gracza") | OD, `bieglosc_checkpoint.md` §34 | ⚠ **ACTIVE, ale w praktyce ZABLOKOWANE** przez `OI-28` → `OI-46` |
| D-18 | „krzywa XP wymaga **DECYZJI**, nie poprawki" | `CLAUDE.md` | **ACTIVE** — ⚙ potwierdzone pomiarem, nietknięte |

⚠ **Zastąpienie/uzupełnienie CZĘŚCIOWE po raz DZIESIĄTY z rzędu** (D-17): decyzja
obowiązuje jako kierunek, ale **jej skutek został unieważniony przez brak
zawartości w innej domenie**. To jest nowy wariant — nie „późniejsza decyzja
unieważniła wcześniejszą", tylko **pomiar w domenie obok**.

---

## 4. OI-43 — pomiar krzywej XP

**Metoda:** progi z konfigu (`baseXp × growth^(poziom−1)`, zaokrąglane jak
w kodzie); pula z mapy policzona jako **suma nagród za zabicie każdego spawnu
dokładnie raz**, odczytanego z pliku mapy; pula zadań jako suma nagród XP
wszystkich zadań i ich etapów.

| co | wynik |
|---|---|
| jedno pełne przejście mapy (każdy przeciwnik raz) | **poziom 12** |
| przejście **+ wszystkie zadania** | **poziom 16** |
| **ostatnie odblokowanie umiejętności** | **poziom 10** |
| dojście do sufitu poziomów | **≈ 122 pełne przejścia** |
| poziom zaobserwowany w rozgrywce | **27** ≈ 6,3 przejścia |

**Co z tego wynika, bez oceny:**

1. ⚠ **Wszystkie odblokowania umiejętności wypadają przed końcem pierwszego
   przejścia z zadaniami.** Cała reszta skali poziomów nie odblokowuje niczego —
   daje wyłącznie punkty.
2. ⚠ **Przeciwnicy się odradzają**, więc „przejście" nie jest sufitem, tylko
   jednostką miary. Poziom 27 z rozgrywki jest tego dowodem.
3. ⚠ Krzywa wykładnicza + stała nagroda rosteru znaczy, że **koszt poziomu
   rośnie, a dochód nie**.

⛔ **NIE ROZSTRZYGAM.** Pozycja była znana jako wymagająca decyzji; ekstrakcja
dodaje wyłącznie liczby. Cztery możliwe dźwignie (mnożnik krzywej, nagrody
rosteru, poziomy odblokowań, sufit) **prowadzą do różnych gier**.

---

## 5. OI-44 i OI-46 — pomiar budżetów

**Metoda:** sumy z konfigu; asortyment liczony przy **jakości półki** każdego
sprzedawcy (patrz E-2 — metoda ma znaczenie).

**Punkty rozwoju:**

| pozycja | udział w puli ze skali poziomów |
|---|---|
| pełna nauka wszystkich umiejętności | ~28% |
| pełne rangi dla **wszystkich** rodzin broni | ~61% |
| **zostaje na atrybuty** | **~10%** |

⚠ **To nie jest usterka** — wspólna pula ma zmuszać do wyboru. ⚠ **Ale nikt tego
nie policzył**, więc nie wiadomo, czy dzisiejszy stosunek jest zamierzony.
⚠⚠ **Czytać z `OI-28`:** trzy z czterech rang są dziś nieosiągalne, więc
**realny nacisk na pulę jest znacznie mniejszy niż cennik** — a to znaczy, że
budżet zmienia się **sam**, gdy zawartość dogoni rangi.

**Złoto:**

| strona | charakter |
|---|---|
| dochód: zadania | **jednorazowy**, rzędu setek |
| dochód: sprzedaż | **jedyny powtarzalny** |
| ujście: cały asortyment | jednorazowe, tysiące |
| ujście: nauka | jednorazowe, setki |
| ujście: **rangi wszystkich rodzin** | **rząd wielkości powyżej asortymentu** |
| ujście: naprawa | **jedyne powtarzalne** |

⚠⚠ **Największe ujście jest dziś w praktyce zamknięte** (`OI-28`), a wszystkie
pozostałe poza naprawą są skończone. **Zaparkowana pozycja „ujście dla złota"
ma więc DRUGĄ przyczynę, której parking nie znał** — nie tylko brakuje ujść,
ale to wybrane jako główne jest zablokowane brakiem zawartości. → `OI-46`.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| jedna wspólna pula punktów | ✅ **N-97** — ⚠ depozyt z `attributes`, **odebrany** |
| „liczby budżetu punktów nieprzeliczone" (`OI-13`) | ✅ **POLICZONE** (§5); ⚠ **decyzja nadal otwarta** → `OI-44` |
| dwa źródła XP | 🆕 **N-94** |
| nagroda należy do stworzenia | 🆕 **N-95** |
| poziom nie daje nic poza punktami i bramkami | 🆕 **N-96** (E-5) |
| punkty wyłącznie z awansu | 🆕 **N-98** |
| atomowe wydanie | ✅ **N-99** — trzecie wystąpienie reguły „sprawdź wszystko przed pobraniem czegokolwiek" |
| brak respecu | ✅ **N-100** — depozyt z `attributes`/`items`, tu jako fundament |
| XP na sufcie przepada | 🆕 **N-101** |
| zabójstwo nie daje złota | 🆕 **N-102** (E-3) |
| sprzedaż jedynym powtarzalnym dochodem | 🆕 **N-103** |
| naprawa jedynym powtarzalnym ujściem | 🆕 **N-104** (E-4) |
| jakość mnoży cenę w obie strony | ✅ **N-105** |
| brak ceny kupna = nie do kupienia | ✅ **N-106** — depozyt z `items`, **odebrany** |
| podłoga jednego złota | 🆕 **N-107** |
| jakość półki należy do sprzedawcy | 🆕 **N-108** |
| dwie waluty, jedna atomowość | ✅ **N-109** |
| złoto i punkty się nie wymieniają | 🆕 **N-110** — rozstrzygnęło rozdział domen (§1.1) |
| co robi punkt po wydaniu | ➡ **ZOSTAJE** w `attributes`/`abilities`/`proficiency` |
| ile kosztuje nauka i rangi | ➡ **ZOSTAJE** w `abilities`/`proficiency` |
| co wypada ze stworzenia | ➡ **ZOSTAJE** w `creatures` |
| nagrody zadań | ➡ **ZOSTAJE** w `quests` |
| jakość, trwałość, pola ceny | ➡ **ZOSTAJE** w `items` |

---

## 7. Czego procedura tu NIE złapała

1. ⚠⚠ **MILCZENIE O NIEISTNIENIU — nowy wariant, trzy wystąpienia naraz**
   (E-3, E-4, E-5). Dotychczasowe milczenia dotyczyły **istniejących** pól
   (`items`), **złożeń** dwóch opisanych mechanizmów (`shields`, `proficiency`)
   albo **własności układu** (`weapons`). Tutaj brakowało opisu **rzeczy, których
   NIE MA**: złota z zabójstw, powtarzalnych ujść, bonusów z poziomu.
   ⛔ **Brak mechaniki nie zostawia śladu w kodzie**, więc nie ma czego znaleźć
   gremem ani porównaniem list. Znajduje to **wyłącznie pytanie „a skąd
   właściwie…"** — czyli czytanie systemu jako całości, nie pliku po pliku.

2. ⚠⚠ **To jedyna domena, w której KAŻDE pytanie wymagało liczenia od zera.**
   Cztery pomiary tej ekstrakcji (krzywa, pula mapy, budżet punktów,
   asortyment) **nie istnieją nigdzie w powtarzalnej formie** — a to jest
   dokładnie ta praca, którą generator ma usuwać. ⛔ Generatora nie zbudowano
   (polecenie misji); brak zapisany jako `OI-45`. ⚠ **Konsekwencja: te liczby
   zestarzeją się tak samo jak te z E-1 i E-2**, i nic tego nie zgłosi.

3. ⚠ **Pomiar bez METODY starzeje się ciszej niż liczba bez daty** (E-2). Dwie
   różne wartości dla tego samego sklepu, **obie poprawne** — bo mierzone przy
   innej jakości i innym rosterze. Kontrakt wymaga metody przy pomiarze; ta
   domena pokazuje, dlaczego to nie jest formalność.

4. ⚙ **Rozdzielenie domen okazało się WYNIKIEM, nie założeniem.** Rozstrzygnął
   je jeden fakt z kodu — **brak kursu wymiany między walutami** — a nie
   podobieństwo tematów. ⚠ Gdyby kiedyś powstała wymiana (złoto → punkty albo
   odwrotnie), **ten rozdział trzeba przemyśleć od nowa**.

⚙ **Co zadziałało:** krok 0 z decyzją taksonomiczną **przed** pisaniem,
odczyt puli mapy wprost z pliku mapy (nie z dokumentu), oraz trzymanie się
zasady „liczę i pokazuję, nie poprawiam" przy czterech liczbach, które
wyglądały podejrzanie.

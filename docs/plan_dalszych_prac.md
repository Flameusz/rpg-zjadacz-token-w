---
typ: OPERACYJNE
domena: proces
tytul: Plan lasu i optymalizacji mobilnej
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Plan dalszych prac — checkpoint 2026-08-31

> ## ⚠ ZAWĘŻENIE ZAKRESU — poprawka księgowa 2026-09-05
>
> **Ten plik jest planem LASU I OPTYMALIZACJI MOBILNEJ. Nie jest planem całego
> projektu.**
>
> Zdanie „to jest jedyny, bieżący plan kolejnych sesji" było prawdziwe
> 2026-08-31 i przestało być prawdziwe 2026-09-01: pięć kolejnych sesji poszło
> w walkę (biegłość, P3, tarcze, dual wield, benchmark), czego ten plan nie
> obejmuje i o czym nie wie. **Bieżącym punktem wejścia dla projektu jest
> `docs/konfiguracje_broni_checkpoint.md`** (2026-09-05, §3.1).
>
> ✅ **W swoim zakresie plik pozostaje aktualny i nic w nim nie unieważniono** —
> ETAP A (runtime test na S21 FE) nadal jest PENDING, OPEN DECISIONS (drugie
> gardło Bear w A9, Wariant B GreyWolfa) nadal otwarte, sekcja „czego NIE
> robimy" nadal obowiązuje.
>
> ⚠ Reguła „nie twórz drugiego planu" z akapitu niżej **zostaje w mocy** i to
> ona jest powodem tego banera: zamiast trzeciej listy „co dalej", jeden
> wskaźnik na obowiązujący punkt wejścia.

**Rola tego pliku.** To był **jedyny, bieżący plan kolejnych sesji** po
zamknięciu etapu lasu (art/world-design) i pierwszej rundzie optymalizacji
mobilnej. Nie jest dziennikiem (`docs/dziennik.md` niesie chronologię i
uzasadnienia — ten plik niesie WYŁĄCZNIE „co dalej, w jakiej kolejności").
Nie twórz drugiego, równoległego planu — jeśli coś się zmieni, zaktualizuj
ETAPY poniżej w tej samej sesji, w której decyzja zapada.

⚠ **Pełny kontekst każdego ustalenia (liczby, metodologia, cytaty) mieszka w
`docs/dziennik.md`, wpisy 2026-08-31 (8), (9) i (10).** Ten plik świadomie NIE
powtarza tamtej treści — podaje tylko wnioski operacyjne i kolejność.

---

## Skąd to wynika

Sesja 2026-08-31 przeszła przez cztery fazy pracy w jednym ciągu: diagnoza
wydajności mobilnej → `Y_SORTED_WORLD` → `RenderCuller` → atlasowanie →
weryfikacja `PathSolver` na żywej mapie → naprawa izolacji watahy wilków →
pełny audyt geometrii GreyWolfa (ujawnił safe-kill exploit, zdiagnozowany
jako SYSTEMOWY, nie lokalny). Pełny zapis: `docs/dziennik.md` (8).

**Kontynuacja tego samego dnia (dziennik (9))**: naprawa architektoniczna —
`body.width` każdego `Enemy` zależał od czysto kosmetycznego squash/stretch
(`Enemy.updateMotionFx`), więc realne ciało GreyWolfa w pościgu wahało się
45–67 px zamiast stałych 48 px zapisanych w configu. Po naprawie (`bodyW`
teraz naprawdę stały) dopiero dało się sensownie zaprojektować i wdrożyć
korektę geometrii — **Wariant A (8 przesuniętych drzew) wdrożony**, znany
safe-kill spot GreyWolfa usunięty.

**Dalsza kontynuacja (dziennik (10))**: Bear — główny bród (A4) naprawiony
**jednym kaflem terenu** (nie drzewa, nie spawn, nie `bodyW`). Po drodze
odrzucona pierwsza propozycja kafla (837/839 okazały się puste — ujawniłoby
trawę zamiast brzegu), zastąpiona zweryfikowaną pikselowo alternatywą (890).
Ujawniło to też **drugie, osobne wąskie gardło w A9** (~x2528,y432,
mechanizm mieszany drzewa+teren) — Bear dziś je przechodzi, ale z zerowym
marginesem; **nienaprawione, świadomie**.

## Stan na koniec sesji

```
LAS — ART / WORLD DESIGN     = CLOSED
LAS — AI / NAVIGATION        = STABLE WITH POLISH
MOBILE OPTIMIZATION          = IN PROGRESS
RUNTIME MOBILE VALIDATION    = PENDING (S21 FE)
BODYW (scale→body sprzężenie) = NAPRAWIONE (dziennik (9))
GREYWOLF SAFE-KILL EXPLOIT    = ROZWIĄZANY dla spawnu GreyWolfa (Wariant A)
GREYWOLF — DRUGIE WYJŚCIE     = Wariant B udokumentowany, ŚWIADOMIE niewdrożony
BEAR — GŁÓWNY BRÓD (A4)       = NAPRAWIONY (dziennik (10)), 1 kafel terenu
BEAR — DRUGIE GARDŁO (A9)     = ZDIAGNOZOWANE, NIEROZWIĄZANE (mieszane drzewa+teren)
```

---

## ETAPY

### ETAP A — Runtime test na S21 FE (PIERWSZE, przed czymkolwiek innym)

Zweryfikować na prawdziwym telefonie (Samsung Galaxy S21 FE), nie na
desktopowym localhost:
- czy `RenderCuller` faktycznie ogranicza liczbę renderowanych obiektów w
  praktyce (render-only — NIE wyłącza gameplay/AI/physics, to samo w sobie
  nie jest dowodem poprawy FPS),
- czy dwa atlasy (`forest_decor_atlas`, `water_flora_atlas`) faktycznie
  poprawiają cokolwiek w praktyce — dziś zweryfikowane tylko bit-w-bit
  (poprawność treści), NIE zmierzone na urządzeniu,
- zmierzyć realne FPS/zacięcia (`dev.perf.watch(15)`, licznik zacięć — nie
  sama średnia, patrz `CLAUDE.md` § Polecenia i weryfikacja).

**Bez tego pomiaru ETAP F (dalsza optymalizacja) nie ma uzasadnienia i nie
wolno go zaczynać.**

### ETAP B — Globalny audyt topologii lasu: korytarze ekologiczne

Zakres: sprawdzić, czy zwierzęta (zwłaszcza duże ciała — Wolf 28,8px,
Boar 46,2px, Bear/GreyWolf 48px) mają NATURALNE alternatywne ciągi
komunikacyjne w całym lesie, nie tylko przy swoich spawnach.

⚠ **Czego to NIE jest:**
- to nie jest audyt minimalnego clearance (ten już się odbył, wynik:
  33 izolowane kieszenie 48px poza główną składową — patrz dziennik (8));
- to nie jest przerzedzanie lasu;
- to nie jest projektowanie geometrii pod Bear/GreyWolf jako standard.

Pytanie, na które ten audyt ma odpowiedzieć: **które z ~33 znanych kieszeni
48px (i odpowiadających im kieszeni dla mniejszych ciał) to normalna tekstura
gęstego lasu, a które to faktyczne pułapki topologiczne** — używając
kryterium z dziennika (8): brak drogi NA STAŁE (nie tylko długiej), zero
alternatywy, zero potrzeby ruchu ze strony gracza.

### ETAP C — Korekta wyłącznie ewidentnie niefortunnych skupisk drzew

Tylko jeśli ETAP B potwierdzi konkretny problem. Bez przesuwania spawnów
jako pierwszej reakcji — to jest zasada nienaruszalna (patrz §5 niżej).
Wzorzec punktowej korekty: przesunięcie 1 drzewa o 16px (wataha wilków,
2026-08-31) — nie usuwanie, nie przerzedzanie całych obszarów.

### ETAP D — Rozstrzygnięcie GreyWolf

✅ **WYKONANE (dziennik (9))**: Wariant A (8 przesuniętych drzew) wdrożony,
siedlisko GreyWolfa połączone z głównym lasem, `PathSolver` i safe-kill
zweryfikowane na żywej mapie. Wariant B (drugie, niezależnie zweryfikowane
wyjście, 15 drzew) **zostaje udokumentowany, ale niewdrożony** — dokładać
tylko po konkretnym sygnale z gry, że jedno wyjście nie wystarcza.

⚠ **Nadal aktualne z (8)**: systemowy safe-kill mechanizm (brak LOS w melee,
brak collidera Player↔Enemy) NIE został tym rozwiązany — usunięty został
wyłącznie konkretny spot przy spawnie GreyWolfa. Jeśli ten sam wzorzec
znajdzie się gdzie indziej (inny duży drapieżnik, inne siedlisko), potrzebna
osobna analiza, nie automatyczne domniemanie, że jest już naprawiony.

### ETAP E — Rozstrzygnięcie Bear / szerokość brodu

✅ **Główny bród WYKONANE (dziennik (10))**: 1 kafel terenu (tx=40,ty=24,
warstwa `water`, gid 838→890), lokalny prześwit brodu 32→64 px. Player/Wolf/
Boar/Bear potwierdzeni `PathSolver`em w obie strony.

⚠ **Drugie gardło (A9, ~x2528,y432) POZOSTAJE OTWARTE, świadomie.** Bear
dziś przechodzi całą trasę, ale z zerowym marginesem (48 px, nie 64) —
przyczyna INNA niż bród (mieszana: kilka drzew + osobny blok terenu), więc
to nie jest ta sama, prosta korekta. Patrz OPEN DECISIONS niżej.

### ETAP F — Dalsza optymalizacja mobilna (WARUNKOWE)

**Tylko jeśli ETAP A wykaże, że S21 FE nadal ma problem po `RenderCuller` +
atlasach.** Dopiero wtedy ocenić: chunking, `RenderTexture`, static baking,
inne rozwiązania GPU/CPU. **Chunking NIE jest obowiązkowym następnym
krokiem** — to opcja zależna od wyniku pomiaru, nie z góry przyjęty plan.

### ETAP G — Późniejszy gameplay polish

Po rozstrzygnięciu D/E: soft-collision krzewów (`speedMultiplierAt` —
zaprojektowane miejsce w `MovementContext`, niewdrożone), ewentualny
collider Player↔Enemy (dziś świadomie NIE rozstrzygnięty — patrz OPEN
DECISIONS), inne rzeczy wynikające z testów walki.

---

## OPEN DECISIONS

### GreyWolf — ✅ ZAMKNIĘTE dla spawnu, mechanizm systemowy nadal otwarty

- **Rozstrzygnięte (dziennik (9)): naprawa geometrii, nie „terytorialny
  drapieżnik ograniczony terenem".** Wariant A (8 drzew) wdrożony, siedlisko
  połączone z główną składową (52 672 → 53 085 komórek NavGrid), `PathSolver`
  potwierdzony w obie strony do pięciu punktów głównego lasu.
- Koszt okazał się niższy niż pierwotny szacunek „~14 drzew" — po naprawie
  `bodyW` (patrz wyżej) dokładniejsze przeszukanie znalazło rozwiązanie na
  8 drzewach, wyczerpująco potwierdzone jako jedyny naturalny kierunek
  (wszystkie pozostałe 7 kierunków kompasu sprawdzone i odrzucone).
- ⚠ **Systemowy mechanizm safe-kill (299 punktów / 16 klastrów w pierwotnym
  pomiarze z (8): brak LOS w melee, brak collidera Player↔Enemy) NIE został
  tym rozwiązany** — usunięty został wyłącznie konkretny spot przy spawnie
  GreyWolfa. Jeśli ten sam wzorzec ujawni się przy innym dużym przeciwniku,
  potrzebna osobna analiza.

### Bear — główny bród ✅ ZAMKNIĘTY, drugie gardło OTWARTE

- **Główny bród (A4) rozstrzygnięty (dziennik (10)): 1 kafel terenu, nie
  drzewa.** `water` tx=40/ty=24, gid 838→890 (zweryfikowany pikselowo —
  pierwsza propozycja, 837, okazała się pustym kaflem i została odrzucona
  przed zapisem). Lokalny prześwit brodu 32→64 px, Player/Wolf/Boar/Bear
  wszyscy potwierdzeni realnym `PathSolver`em północ↔południe.
- ⚠ **Nowe, osobne odkrycie: drugie wąskie gardło w A9** (~x2528, y432,
  ~1250 px na wschód od brodu). Minimalny clearance NA CAŁEJ trasie Bear to
  wciąż dokładnie 48 px (nie 64) — Bear przechodzi, ale bez marginesu.
  Mechanizm INNY niż bród: **kilka drzew** (małe pnie, x2439–2601/y305–467)
  skupionych blisko osobnego, dużego bloku solidnego terenu dalej na
  południe (ty16–19). Wymagałaby ruszenia i drzew, i terenu naraz —
  **świadomie nietknięte**, do osobnej przyszłej decyzji, nie wdrażać przy
  okazji innego zadania.

---

## Czego NIE robimy w najbliższej sesji

- nie generujemy kolejnych assetów,
- nie przebudowujemy wizualnie lasu,
- nie wracamy do starego systemu kamieni,
- nie zmieniamy `TreeStamps`,
- nie przebudowujemy `PathSolvera` bez konkretnego dowodu z działającej gry,
- nie przesuwamy spawnów wilków (ani żadnych innych zwierząt) jako pierwszej
  reakcji na problem geometrii,
- nie wdrażamy melee LOS jako „fixu lasu" — **odłożone, patrz
  `docs/dziennik.md` (8) §I: to osobny temat Combat Design, nie rozwiązanie
  problemu topologii**,
- nie dodajemy automatycznie collidera Player↔Enemy,
- nie przerzedzamy lasu globalnie,
- nie wdrażamy chunkingu bez pomiaru na S21 FE (ETAP A musi być pierwszy).

---

## Od czego zacząć kolejną sesję

1. Przeczytać `docs/dziennik.md` (wpisy 2026-08-31 (8), (9), (10)) i ten plik.
2. Zacząć od **ETAPU A** — runtime test na S21 FE (wciąż PENDING, nic w
   (9)/(10) tego nie zmieniło).
3. Nie wracać do analiz już wykonanych (geometria GreyWolfa, wataha wilków,
   atlasowanie, naprawa `bodyW`, główny bród Bear) bez nowego, konkretnego
   sygnału z działającej gry — ETAP D i główny bród ETAPU E są zamknięte,
   nie „do ponownego rozważenia".
4. Drugie gardło Bear w A9 (OPEN DECISION, mieszane drzewa+teren) i Wariant B
   GreyWolfa (odłożony fallback) zostają nietknięte, dopóki gra nie da
   konkretnego powodu.

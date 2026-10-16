# Checkpoint — Faza 1B, po Step 1B: kolizja wody (2026-08-28)

> ⚠ **Kolejny krok jest zrobiony od tego samego dnia — patrz
> `PROJECT_CHECKPOINT_RESIZE160.md`** (resize mapy 100×60 → 160×60, nie
> 140×60 jak dotąd planowano). Ten plik zostaje poprawny w swoim zakresie
> (kolizja wody), nie doczytuj stąd rozmiaru mapy.

**Ten plik opisuje wyłącznie to, co FAKTYCZNIE wykonano i zweryfikowano.**
Poprzedni stan: `PROJECT_CHECKPOINT_STEP2.md` (Step 0, 1A, 2 — zsynchronizowane
kopie `.tmj`, kolizja pni/budynków, geometria rzeki i brzegów). Ten checkpoint
dokłada **wyłącznie Step 1B — kolizja wody**, zgodnie z
`docs/las_faza1b_final.md` §3.7 i §6 wiersz 1.

Warstwa ruchu (`src/core/movement/`) i eksperyment ze `SteerSolver` na dziku
są osobnym, wcześniejszym tematem tej samej sesji — patrz `docs/dziennik.md`
2026-08-28, wpisy przed tym.

---

## 1. Co zostało wykonane

**Kolizja pełnokaflowa dla wszystkich 49 wariantów kafla wody** w tilesecie
`Teren` (local id 12, 13 i 76–122 — dwa pełne wypełnienia „woda 1"/„woda 2"
plus 47-wariantowy blob autotile'a), zakodowana jako property `solid: true`,
dokładnie tym samym mechanizmem co ściany chaty Myśliwego w Step 1A
(`tiles: [{id, properties:[{name:"solid",...}]}]`). Lista local id policzona
programowo z `docs/kafle.json` (filtr `name.startsWith("woda")`), nie
przepisana ręcznie.

Mechanizm „najwyższy kafel decyduje" (`TiledMap.ts`, niezmieniony w tej
sesji) robi resztę bez żadnego kodu: gdzie `path`/`sand` leżą NAD wodą, ta
komórka jest przechodnia; gdzie nic nie leży, woda blokuje.

### 1.1 Bród — dokładny kształt, zmierzony, nie założony

Zgodnie z poleceniem — **nie zakładać, sprawdzić które komórki brodu mają
`path`/`sand` jako topmost.** Wynik na żywych danych: z 8 komórek wody w
paśmie brodu (x=40–41, y=22–24) dokładnie **5 ma `path` na wierzchu**:

```
        x=40    x=41
y=22    path    path
y=23    path    path
y=24    SOLID   path
```

**x=40/y=24 jest gołą wodą** — droga tam nie sięga (diagonalny trakt
przechodzi z kolumny x=40 na x=41 dokładnie w tym miejscu). Efekt: bród nie
jest prostokątem 2×3, tylko korytarzem **2 kafle szerokim na trzech
czwartych przejścia, zwężającym się do 1 kafla (x=41) na jednym rzędzie**.
Otwarta przestrzeń nad i pod korytem (y=20–21 i y=25) nie jest wodą wcale
(zwykła trawa), więc realne podejście do brodu jest szersze niż te 5 komórek
— widoczne na zbliżeniu brodu, wyrenderowanym i przejrzanym w tej sesji
(niepersystowane w repo, zgodnie z konwencją „scratch/debug images nie idą
do repo" — patrz `CLAUDE.md`; renderować ponownie z `public/assets/maps/
forrest.tmj` w razie potrzeby, metoda w §3).

Nie poszerzano tego rzędu (dopisanie `path`/`sand` na x=40/y=24 byłoby
malowaniem mapy, poza zakresem tej sesji).

✅ **Zapisane jako uwaga do późniejszej korekty geometrii brodu (decyzja
autora, 2026-08-28) — nie poprawiać teraz.** Jednokafelkowa poprawka
(`path`/`sand` na x=40/y=24), do zrobienia świadomie przy przebudowie rzeki/
brodu w dalszych krokach lasu, nie jako efekt uboczny kolizji. Zapisane też
w `docs/odlozone.md` §3.

### 1.2 ⚠ Znalezisko: 7 komórek wody „przecieka" poza brodem — NIE naprawione

Weryfikacja „gracz nie może wejść do wody poza brodem" (z polecenia) znalazła
**7 komórek wody, gdzie topmost jest kaflem dekoracyjnym bez własnej
kolizji**, więc mimo wody pod spodem komórka wychodzi przechodnia:

| warstwa na wierzchu | ile komórek | współrzędne |
|---|---|---|
| `trees-over` (korona drzewa) | 2 | (0,23), (1,23) — sama krawędź mapy |
| `bushes` | 1 | (95,16) |
| `undergrowth` | 1 | (24,21) |
| `trees-base`, wariant bez pnia (filler stempla) | 3 | (1,16), (31,20), (36,20) |

To jest ta sama klasa problemu, którą `las_faza1b_final.md` §3.7 już
przewidywał ostrzeżeniem *„kafel korony domalowany nad litym pniem czyni tę
komórkę z powrotem przechodnią"* — tylko że tu koroną/krzewem/runem jest
domalowana nad WODĄ, nie nad pniem. Osobne od bram/brodu.

**Sprawdzone, że to NIE jest drugi bród**: analiza spójności (flood-fill po
zablokowaniu prawdziwego brodu, z tymi 7 komórkami dalej otwartymi) dzieli
mapę na dwie rozłączne części (2808 i 1393 komórek) — czyli **żadna z tych
7 komórek nie łączy brzegów**, każda jest izolowaną kieszenią w linii brzegu.
Gracz może w niej stanąć (jeden kafel), nie może nią przejść na drugą stronę.

✅ **Decyzja autora (2026-08-28): zostaje odłożone do przebudowy mapy.**
Naprawa punktowa (przemalowanie 7 komórek) i naprawa klasowa (kolizja na
`trees-over`/`bushes`/`undergrowth` — zablokowałaby też miejsca, gdzie
przechodniość pod tymi warstwami jest ZAMIERZONA) obie czekają na Step 3+
lasu. Zapisane też w `docs/odlozone.md` §3.

### 1.3 ⚠ Znalezisko: spawn fauny w wodzie po dodaniu kolizji — NIE naprawione

Ten sam skan (obiekty × nowe solidy) złapał **jeden prawdziwy konflikt
mechaniczny**: spawn lisa (`fox`, obiekt na warstwie `objects`, piksel
1900,600 → kafel 59,18) leży w komórce, która po Step 1B jest pełną wodą.
Lis ma prawdziwe ciało fizyczne i collider z `map.solids`
(`src/entities/Critter.ts` — usunięty 2026-10-04, `GameScene.ts:876`), więc rodzi się dziś
zanurzony w solidną kolizję.

Pozostałe 6 trafień z surowego skanu (dwa `lilia`, `babka`, `dziurawiec`,
`glaz_a`, `kupa_b`) **NIE są konfliktem**: `Gatherable` (`src/entities/
Gatherable.ts`) rozszerza `Phaser.GameObjects.Sprite`, nie ma ciała fizycznego
i nigdy nie koliduje z `map.solids`; kamienie (`kamienie` layer) to
`this.add.image` bez fizyki (świadomie, patrz `las_faza1b_final.md` §3.7).
Co więcej `lilia` = `lilia_wodna` (`ASSETS.lilyPad`, `GameConfig.ts:11211`)
— **grzybień/lilia wodna rośnie w wodzie z definicji**, jej dwa trafienia są
poprawnym stanem, nie usterką.

**Nie przesunięto spawnu lisa — i nie trzeba było o tym decydować, tylko
sprawdzić.** `docs/forest_rebuild_scope.md` **już** śledzi dokładnie ten
spawn: wiersz **S4** — „lis #2, 59,18 (w wodzie) → brzeg rzeki, na lądzie",
z audytem tej samej usterki sprzed tej sesji (§4.2 tamtego dokumentu). Ten
checkpoint tylko potwierdza z symulacji silnika, że usterka jest realna
(ciało koliduje, nie tylko punkt leży wizualnie na wodzie) — przesunięcie
idzie razem z resztą kroku S (spawny), nie osobno teraz.

---

## 2. Zmienione pliki

**Mapa (dane, nie kod):**
- `public/assets/maps/forrest.tmj` — dodany `tiles: [...]` (49 wpisów) do
  tilesetu `Teren`. **Jedyna różnica wobec poprzedniego commita**, potwierdzona
  deep-equal po odjęciu tego pola.
- `public/assets/forrest.tmj` — zsynchronizowana identycznie (różnica
  wyłącznie w ścieżkach PNG tilesetów, jak przy każdym poprzednim kroku).

**Kod:** żaden. Ten krok jest czysto danymi mapy — `TiledMap.ts` już umiał
czytać `tiles[]` z Step 1A, nic w silniku się nie zmieniło.

**Dokumentacja:** ten plik, `docs/dziennik.md`, `docs/las_faza1b_final.md`
(§6 wiersz 1 oznaczony zrobiony), `PROJECT_CHECKPOINT_STEP2.md` (wskaźnik na
ten plik).

---

## 3. Jak to zweryfikowano

**Metoda: odtworzenie prawdziwej ścieżki kolizji silnika** (`topmostTileAt` +
`CollisionLookup` z `TiledMap.ts`) w Node, przeciw **żywemu, już
zmodyfikowanemu** `.tmj` — ta sama metoda co w Step 1A/§10.8, nie
przybliżenie.

1. **Serializer zweryfikowany na roundtripie**: parsowanie żywego pliku i
   ponowna serializacja (bez żadnej zmiany) dała bajt-w-bajt identyczny
   wynik — dopiero potem serializer użyty do zapisu zmiany.
2. **Diff wobec poprzedniego commita**: po odjęciu nowego pola `Teren.tiles`,
   reszta obu plików mapy jest **bajt-w-bajt identyczna** z wersją przed tą
   sesją — dowód, że żadna warstwa, obiekt ani spawn nie ruszyły się przy
   okazji (to samo pytanie, na które w Step 2 odpowiadały 10 asercji
   `build_mapa.py`; tu odpowiedź jest silniejsza, bo to diff, nie próbka).
3. **Tally**: kafli wody 503 (niezmienione od Step 2), z tego **473 solid,
   30 przechodnich** (21 brzeg/piasek, 5 bród, 4 nienaprawione przecieki §1.2
   — 3 z 7 to warianty `trees-base` bez pnia). Komórek solid na całej mapie:
   1203 → **1673**.
4. **Spójność**: bez brodu mapa rozpada się na 2 składowe (2808 / 1393
   komórek) — bród jest jedynym przejściem; z brodem — jedna składowa
   (4206 komórek), cała mapa osiągalna.
5. **Konflikt spawn↔solid**: przemieciona cała warstwa `objects`, `rosliny`,
   `kamienie` (26 stworzeń + zioła + kamienie) — jeden prawdziwy konflikt
   (lis, §1.3), sześć fałszywych trafień odrzuconych z uzasadnieniem (§1.3).
6. **Render z prawdziwych tilesetów** (nie schemat) — `Teren.png` cięty tym
   samym marginesem/odstępem co silnik (0/1px, pitch 33px, zweryfikowane
   osobno przez wycięcie 20 znanych kafli wody i wizualną kontrolę, że są
   niebieskie). Dwa obrazy, kolizja nałożona jako czerwone/pomarańczowe pola
   (z prawdziwym alpha-blendingiem — pierwsza wersja renderu miała pułapkę:
   `ImageDraw` rysowany wprost na płótnie RGBA NIE miesza się z tłem, trzeba
   rysować na osobnej warstwie i złożyć `Image.alpha_composite`; złapane przez
   spróbkowanie piksela i porównanie z oczekiwanym kolorem, nie okiem):
   - pełna szerokość rzeki (x 0–99, y 12–29) — pokazuje bród jako **jedyną**
     przerwę w czerwonym paśmie na całej długości;
   - zbliżenie brodu (x 35–46, y 16–27, 8×) — pokazuje dokładny kształt z §1.1.

`npx tsc --noEmit` i `npm run build` — czyste (ten krok nie dotyka kodu, ale
sprawdzone dla pewności, jak przy Step 2).

⚠ **Nie zweryfikowane w silniku** — panel przeglądarki w tej sesji nie
uruchamia Phasera (ten sam, powtarzający się limit środowiska co przy Step
1A/1B poprzednich sesji i przy warstwie ruchu). Ręczna checklista z
`las_faza1b_final.md` §6.2 („gracz nie przechodzi przez rzekę poza brodem")
**wymaga przejścia w grze**, symulacja nie jest tego substytutem — jest
najlepszym dostępnym dowodem do czasu playtestu.

---

## 4. Otwarte punkty — WSZYSTKIE rozstrzygnięte przez autora (2026-08-28)

Step 1B jest zamknięty w obecnym stanie. Żaden z trzech punktów niżej nie
czeka na decyzję — decyzja już zapadła (odłożyć), zapisana tu i w
`docs/odlozone.md` §3, żeby żadna kolejna sesja nie próbowała ich naprawiać
punktowo przy okazji czegoś innego.

| # | co | decyzja | gdzie wraca |
|---|---|---|---|
| 1 | Bród zwęża się do 1 kafla na jednym rzędzie (x=40/y=24 goła woda) | **odłożone** — uwaga do późniejszej korekty geometrii brodu | przebudowa rzeki/brodu w dalszych krokach lasu (Step 3+) |
| 2 | 7 komórek wody przechodnich poza brodem (dekoracja nad wodą) | **odłożone** — do przebudowy mapy | Step 3+ lasu |
| 3 | Spawn lisa (59,18) w solidnej wodzie | **już zaplanowane, nie nowa decyzja** — `forest_rebuild_scope.md` wiersz **S4** śledzi dokładnie to przesunięcie od przed tej sesji | krok S (spawny) przebudowy lasu |
| 4 | Weryfikacja w silniku | środowisko (Browser pane nie uruchamia Phasera w tej sesji) | pierwsza okazja z działającym podglądem |

**Nie ruszone w tym kroku, celowo**: standard prześwitu (`las_faza1b_final.md`
§10 — odłożony wcześniej w tej sesji), przebudowa lasu (Step 3+), warstwa
ruchu (zamknięta checkpointem przed tym krokiem).

**Następny etap ogłoszony przez autora: przebudowa samego lasu — nie kolejne
poprawki techniczne rzeki.** `docs/forest_rebuild_scope.md` jest dokumentem,
który się otwiera przed Tiled.

---

## 5. Jak wznowić

1. `git log --oneline -3 && git status --short` — nie wierz prozie.
2. Ten plik + `PROJECT_CHECKPOINT_STEP2.md` (Step 0–2) dają pełny stan mapy.
3. `npx tsc --noEmit && npm run build` — oba muszą przejść czysto.
4. Następny nierozpoczęty krok z `las_faza1b_final.md` §6 to **Step 3 —
   przemalowanie terenu w istniejących kolumnach** (T1, T2, T6, T7, T8, T9,
   T11), ale on i tak czeka na `forest_rebuild_scope.md` jako dokument
   otwierany przed Tiled, oraz — jeśli autor zdecyduje malować gęściej —
   na decyzję o standardzie prześwitu (§10).

---
typ: OPERACYJNE
domena: assets
tytul: Prompty do Gemini — generowanie postaci
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Prompty do Gemini — generowanie postaci

> **Po co ten plik.** Generowanie grafiki postaci przez Gemini + wycinanie/
> przekolorowanie u nas (patrz `tools/build_kowal.py`) okazalo się dużo
> lepszą ścieżką niż rysowanie postaci proceduralnie od zera (blokowe
> prymitywy jak `build_wilk.py`) ORAZ niż wycinanie z wysokiej-wierności
> malarskich arkuszy-referencji (`kowal.png`, `tools.png`...). Powód: skoro
> u nas i tak każda grafika z Gemini przechodzi przez wycięcie +
> przekolorowanie na paletę projektu, opłaca się, żeby Gemini generował od
> razu W STYLU DOCELOWYM, niskiej wierności — mniej pracy po naszej stronie,
> czystszy materiał wejściowy. Ten plik trzyma sprawdzone prompty i to, co
> się z nich nauczyliśmy, żeby nie zgadywać od nowa za każdym razem.

---

## Historia: kowal

**Pierwszy prompt (usera)** wygenerował `blacksmith.png` — zadziałał
zaskakująco dobrze (patrz sekcja "Co działało" niżej). **Drugi, poniższy**
to ten sam prompt, dostrojony pod nasz konkretny pipeline (paleta projektu
wprost w promencie, płaskie cieniowanie, izolacja od innych obiektów) —
jeszcze nie przetestowany, następny do wypróbowania.

### Co działało w pierwszym prompcie (`blacksmith.png`) — zostaje

- Sekcja **Input image role**: referencja tylko dla tożsamości/sylwetki, nie
  dla stylu renderowania. Gemini posłuchał — wynik jest w INNYM, prostszym
  stylu niż `kowal.png`, nie jego kopią.
- **Brak trzymanej broni** (`no held weapons`) — dzięki temu w kadrze jest
  WYŁĄCZNIE postać, żadnego sąsiadującego propu do omijania przy wycinaniu.
  To był największy problem przy `kowal.png` (dłoń dotykała stolika z
  imadłem, każdy prostokątny kadr albo urywał rękę, albo łapał kawałek
  mebla).
- **Chroma green, w pełni kryjące, bez cienia pod postacią** — czyste tło,
  `_usun_zielone` (flood-fill + próg resztkowy) poradził sobie bez ręcznego
  poprawiania.
- **Ciasny, policzony (nie zgadnięty) bounding-box treści** — 50×101 canvas,
  postać zajmuje x7-42/y16-82. Gemini trzymał się marginesu.
- Wynik ma **tylko ~16 realnych kolorów** — dużo mniej niż `kowal.png`
  (malarski gradient), więc jawna tabela przekolorowania (nie klasyfikator
  progowy) była wystarczająca i szybka do zbudowania.

### Co poprawić w kolejnej iteracji

- Kolory NIE trafiły w paletę projektu (zbliżone, ale nie identyczne) —
  wymagały wciąż jawnej tabeli przekolorowania. Gdyby prompt podał gotowe
  hexy, cel byłby: zero przekolorowania, samo wycięcie.
- Cieniowanie miało miejscami miękkie przejścia (nie w pełni płaskie pasy) —
  drobne, ale to dokładnie ten koszt, który płacimy przy każdym takim
  materiale.
- Spodnie wyszły w osobnym, nigdzie indziej nieużywanym odcieniu zieleni —
  jeden kolor bez odpowiednika w `docs/paleta.json`, musiał dostać
  najbliższy zastępnik (`listowie[0]`).

---

## Prompt — wersja 2 (do wypróbowania)

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked well once for the same character concept —
keep the same overall approach, tightened in the ways below.

Input image role: high-fidelity identity reference only. Preserve broad
character identity, silhouette, outfit, proportions, and readable
personality. Do NOT preserve the high-detail rendering style — convert
the reference into a simpler game sprite.

Create one full-body south-facing / front-facing character anchor on a
32x64 canvas.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- lower fidelity than the reference
- simpler shapes and fewer fine details
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone) —
  no more than 3 tones on any single material
- readable silhouette
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- designed to fit cleanly inside future 32x64 animation cells

Composition:
- exactly one full-body character, nothing else in frame
- facing screen/front/south, centered, full body visible, generous margin
  on all sides (character must not touch canvas edges)
- neutral upright pose, arms at sides, feet slightly apart
- no held weapons or tools, no worn/slung weapons either (effects and
  gear live in separate sheets only)
- NO other objects anywhere in frame: no furniture, no anvil, no
  workbench, no ground shadow, no decoration, nothing the character
  touches or stands against — silhouette fully isolated from everything
  else, this matters more than any other constraint here

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- npc blacksmith who lives and works in a small village, standing at
  ease, not mid-task

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - leather / apron / straps: #49231D, #623B2D, #7B573F, #947654, #AC976C
  - cloth / undershirt: #694936, #8D6D4F, #B1956B, #D5C08B
  - dark accents / boots / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) not drawn
    from the list above — skin is its own material, it does not need to
    match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Dlaczego te konkretne zmiany

- **Paleta wprost w promencie** (hexy z `docs/paleta.json`, ramps `drewno`/
  `piasek`/`neutralne`) — cel: crop wychodzi już w naszych kolorach, `_MAPA`
  w skrypcie staje się kosmetyczna zamiast koniecznej.
- **„No other objects... this matters more than any other constraint
  here"** — podkreślone specjalnie, bo to była jedyna rzecz, która realnie
  zepsuła `kowal.png` (dłoń dotykająca stolika). Wypunktowanie tego jako
  najważniejszy warunek to wniosek z tamtej sesji, nie domysł.
- **„No anti-aliasing... including the outline" + „exactly 2-3 bands"** —
  Gemini domyślnie renderuje miękkie, malarskie przejścia nawet gdy prosi
  się o pixel art; to jest próba wymuszenia twardszych krawędzi już na
  wejściu, żeby `_przekoluj` miał mniej pracy (mniej pikseli spoza tabeli
  do dociągania „najbliższym sąsiadem").
- **Skóra jako osobna, nienazwana rampa** — świadomie NIE każemy Gemini
  używać projektowej palety na skórze. To jest zgodne z tym, jak już
  traktujemy Character.png/NPC.png (własna domena pikseli, patrz
  `CLAUDE.md`) — skóra to kolor postaci, nie „materiał", który ma pasować
  do otoczenia.
- **Kontur zostaje** (nie usuwamy go w prompcie ani w skrypcie) — mimo że
  `docs/ART_DIRECTION.md` 4.4 mówi „prop: bez czarnego obrysu". Wypróbowane
  bez obrysu na `blacksmith.png` (ten sam trik co `_usun_kontur` w
  `build_kuznia.py`) i porzucone: sylwetka robi się miękka, ruchoma postać
  na tle bezkonturowej trawy potrzebuje go bardziej niż nieruchomy prop.
  Zob. notatka w `tools/build_kowal.py`.

---

## Jak dodać kolejną postać tym samym przepisem

1. Wygeneruj w Gemini z promptem jak wyżej (podmień tylko „Character
   identity"), zapisz jako `public/assets/<nazwa>.png`.
2. Policz ciasny bounding-box treści (nie-zielonych pikseli) — nie zgaduj.
3. Zdejmij zielone tło DWA razy: flood-fill od krawędzi kadru + globalny
   próg na resztkach (łapie izolowane zielone piksele w szczelinach, np.
   między nogami), które flood-fill nie dosięgnie.
4. Wypisz najczęstsze kolory (`Counter` na wyciętym kadrze) i zbuduj JAWNĄ
   tabelę przekolorowania — sprawdź każdy kolor na osobnej masce
   (podgląd z tym jednym kolorem podświetlonym), nie zgaduj z nazwy.
   Piksele spoza tabeli dostają kolor NAJBLIŻSZEGO wpisu (nie najbliższy
   kolor rampy) — to trzyma przejścia antyaliasingu w tej samej kategorii
   co sąsiadujące piksele.
5. Zapisz wynik do `public/assets/`, wepnij jako `ASSETS.<klucz>` (patrz
   `src/config/GameConfig.ts`) — jeśli to NPC, przez `NpcDef.portraitTexture`
   z fallbackiem na wspólny placeholder, dokładnie jak Kowal.

Pełny przykład: `tools/build_kowal.py`.

---

## Animacja idle — jedna klatka na raz (w toku)

**Próba "cała siatka na raz" (5x2, 10 klatek w jednym zapytaniu) zawiodła
i to zmierzone, nie na oko** (`public/assets/test.png`, 4 wygenerowane
ćwiartki zamiast 10):
- Layout zignorowany: 2x2 zamiast 5x2.
- Brak realnej animacji — 4 ćwiartki to praktycznie ta sama poza, różnice
  to szum generacji, nie zamierzony ruch.
- Dryf skali/pozycji MIĘDZY klatkami: bounding-box górnego rzędu ~1287-
  1288px wysokości, dolnego ~1259px (~2% skurczenia), głowa przesunięta
  o ~23px między rzędami — nawet przy idealnej palecie taka siatka nie
  nadaje się do cięcia na sztywny pitch.
- Watermark Gemini (mały diamentowy sparkle) wrócił w jednej z ćwiartek.

**Działa: jedna klatka na jedno zapytanie**, Image 1 = zaakceptowany
anchor (`blacksimth-test.png`), z promptem wymuszającym identyczny
canvas/baseline/paletę i osobno opisaną POJEDYNCZĄ pozę z sekwencji.
Zmierzone na Frame 1 i Frame 2:
- Frame 1 (`test1.png`): bounding-box **identyczny co do piksela** z
  anchorem (`(2,8)-(47,94)`, 46x87) — zero dryfu skali/pozycji.
- Frame 2 (`test2-pixel-snapper.png`): też identyczny bounding-box, i
  diff względem Frame 1 (194px zmienionych) skupiony konkretnie wokół
  kołnierza/góry fartucha — widoczna, celowa różnica („wdech"), nie
  losowy szum po całej sylwetce. Reszta różnic to pojedyncze piksele
  szumu barwnego, tego samego typu co niżej.
- Kolory NIE trafiają 1:1 w hex anchora (drift kilku-kilkunastu
  jednostek/kanał, np. kontur `(1,1,19)` → `(18,14,28)`) mimo jawnej
  listy hex w promptcie — to jest właśnie robota dla pixel-snappera z
  custom palette (`kowal_palette_swatch.png`, 14 kolorów wyciągniętych z
  anchora), NIE dla dalszego dopieszczania promptu.
- Watermark potrafi wrócić pojedynczo (mały odprysk 3-5px na bucie,
  współrzędne różne za każdym razem) — snapper go spłaszcza zamiast
  usuwać, więc i tak trzeba dojrzeć ręcznie (Paint) po snapperze, nie
  polegać wyłącznie na automacie.
- Frame 3 (`test3-pixel-snapper.png`): diff względem Frame 2 (132px)
  skupiony w y20-83 — góra ciała rusza, stopy prawie nietknięte, zgodnie
  z opisem pozy. Zmierzony bounding-box sylwetki stabilny (~2700px) w
  Frame 1/2/3, brak dryfu skali.
- **Asymetria butów NIE jest błędem dryfu między klatkami** — była
  zmierzona identycznie (co do piksela) w Frame 1/2/3, czyli wypalona
  już w samym anchorze (`blacksimth-test.png`), nie w generacji kolejnych
  klatek. User poprawił anchor ręcznie; kolejne klatki generować z
  POPRAWIONEGO `blacksimth-test.png` jako Image 1.

### Szablon promptu na pojedynczą klatkę

Podmieniaj TYLKO numer klatki i opis pozy w sekcji „Primary request" —
reszta (Input image, Composition, Palette discipline, Background,
Critical constraints) zostaje identyczna dla każdej klatki, to jest to,
co wymusza spójność.

```
Intended use:
single frame (frame N of 10) of a south-facing idle animation loop for a
top-down 2D game character. This will be generated one frame at a time
and assembled into a spritesheet programmatically afterward — pixel-exact
consistency with Image 1 matters more than anything else in this request.

Input image:
Image 1 is the approved south-facing identity anchor. Match it EXACTLY:
same character size, same foot baseline (feet at the same canvas height
as Image 1), same center position, same outline weight, same palette,
same silhouette proportions. Do not resize, re-crop, or reposition the
character relative to Image 1.

Primary request:
Recreate the character from Image 1 on an identical 50x102 canvas,
performing this single pose:

Frame N (of 10): <opis pozy z sekwencji poniżej>

Composition constraints:
- one full-body character, nothing else in frame
- feet at the exact same y-position as Image 1 (baseline must not drift)
- same overall character size as Image 1 except where the pose
  description explicitly says otherwise
- same center position as Image 1

Palette discipline (must match Image 1 exactly):
- use ONLY these hex colors, or the single closest one from this list —
  do not introduce any new hue, tint, or shade not already present in
  Image 1:
  - leather / apron / straps: #49231D, #623B2D, #7B573F, #947654, #AC976C
  - cloth / undershirt: #694936, #8D6D4F, #B1956B, #D5C08B
  - dark accents / boots / outline: #12101A, #2B2A36, #4A4956
  - skin: reuse the exact same 2-3 skin tones already visible in Image 1
- flat cel-shading only, same 2-3 solid bands per surface as Image 1
- no anti-aliasing, no soft blur, no gradients, hard pixel edges only
- no dithering, no noise texture, no speckle, no grain anywhere on the
  character — every surface is made of large, clean, solid-color pixel
  clusters, exactly like Image 1, never a scattered/stippled mix of
  colors within one material

Background:
- exact flat #00FF00, perfectly uniform, zero noise/grain/vignette,
  zero dithering or speckle of any kind — a single unbroken flat color
  across 100% of the background
- no shadow, no ground contact mark

Critical constraints:
- no watermark, no logo, no sparkle/star mark, no signature of any kind
  anywhere in the image, including corners and edges
- no added props, UI, labels, frame numbers, or scene detail
- no attack effect, no glow, no particles, no aura
```

**Update (Frame 7, próba 2->3):** próba 2 (regeneracja z naciskiem na
kontrast cieniowania kołnierza) wprowadziła szum/ziarno zamiast tego —
odkryto lukę w tym szablonie: zakaz ditheringu/ziarna z ORYGINALNEGO
promptu na anchor nigdy nie trafił do szablonu per-klatka (był tylko
"no anti-aliasing/gradients", nie "no dithering/noise/speckle"). Dopisano
wyżej na stałe — obowiązuje od teraz dla KAŻDEJ kolejnej klatki, nie
tylko Frame 7.

### Sekwencja pozy (10 klatek, z pierwotnego szablonu sprite-fusion)

1. neutral relaxed stance (= Image 1 / anchor)
2. slight inhale, shoulders/robe rise by a few pixels — **zrobione**
   (`test2-pixel-snapper.png`)
3. hat/hair/cloth settles with tiny sway — **zrobione**
   (`test3-pixel-snapper.png`)
4. tiny facial/cloth movement while body stays grounded — **zrobione**
   (`test4.png`; diff względem Frame 3 930px i względem Frame 1 565px —
   wyraźnie więcej niż 105-132px między poprzednimi parami, ale wizualnie
   czyste — warto doglądnąć przy domykaniu pętli na Frame 10)
5. slight exhale, robe lowers — **zrobione** (`test5.png`; diff 708px
   względem Frame 4, 420px względem Frame 1 — ten sam podwyższony poziom
   dryfu co Frame 4, wygląda na cechę tej pary klatek a nie jednorazowy
   fluke; wizualnie czysta, buty symetryczne)
6. subtle hand/accessory sway — **zrobione** (`test6.png`; diff 238px
   względem Frame 5, wizualnie czysta, buty symetryczne)
7. return toward neutral — **zrobione, `test7a.png` (trzecia próba,
   zastępuje `test7.png`)**. Historia: pierwsza generacja miała
   przyciemniony kark/kołnierz (obcy kolor + zniknięty pasek
   podświetlenia + ogólnie spłaszczony kontrast cieniowania — za duży
   problem na ręczny remap, patrz commit history/sesja). Druga próba
   regeneracji (z naciskiem na kontrast) wprowadziła szum/dithering —
   przy okazji odkryto, że szablon per-klatka nigdy nie dostał zakazu
   ditheringu/ziarna z oryginalnego promptu na anchor (dopisano na stałe
   do szablonu wyżej). Trzecia próba (`test7a.png`) czysta: bbox/fg-px
   identyczne z anchorem, jasność karku 68.0 (w normie 68-73.6), pasek
   podświetlenia kołnierza obecny (40/66px trafia we wzorzec, reszta w
   sąsiedni legalny midtone), bez szumu, buty symetryczne. Diff do
   anchora 228px — najniższy ze wszystkich klatek.
8. tiny cloth sway in opposite direction — **zrobione** (`test8.png`;
   diff do anchora 265px, fg-px 2702 identyczne z anchorem/Frame 1)
9. settle — **zrobione, `test9.png` (pierwsza próba, ostatecznie
   zaakceptowana)**. Miała losowe ciemne znaki ("X" + kropki) na
   fartuchu, niewidoczne w progu diffu (25) na jednolitym brązie,
   złapane dopiero wizualnym zbliżeniem — nauka: **diff-threshold na
   dużych jednolitych powierzchniach nie łapie plamek/szumu tekstury,
   trzeba zerknąć w zoomie, nie tylko na liczby**. Próba 2 (`test9a.png`,
   prompt z jawnym zakazem "no stitching/marks/decoration") usunęła
   X-a, ALE **przy okazji spłaszczyła prawdziwą wytłoczoną kieszeń na
   piersi** — element obecny od anchora (Frame 1) w dół, nie szum.
   Odrzucona z tego powodu. **Lekcja: zbyt szeroki zakaz "no extra
   detail" w prompcie kasuje też prawdziwe elementy designu, nie tylko
   błędy generacji — precyzyjniej byłoby nazwać wprost co ma zniknąć
   ("stray X-shaped marks", nie ogólne "any decoration").**
10. match frame 1 closely for a clean loop — **zrobione** (`test10.png`).
    Generacja miała czysty bbox/kieszeń/buty, ALE kolor koszulki/rękawów
    wyszedł o cały stopień jaśniejszy niż anchor — `(149,112,86)` →
    `(199,164,121)`, cień `(99,65,48)` → `(115,79,58)`. To NIE był drift
    rzędu antyaliasingu (jak drobne przesunięcia konturu widziane
    wcześniej) tylko realny skok na inny wpis w rampie (`#8D6D4F` vs
    `#B1956B`), więc zwykły pixel-snapper by tego nie naprawił — snapnąłby
    do NAJBLIŻSZEGO wpisu, czyli wciąż złego. Naprawione ręcznym,
    jawnym remapem dwóch kolorów (336px), dokładnie ta sama technika co
    `tools/build_kowal.py` — bez ponownej generacji. Diff do Frame 1 spadł
    z 1194px do 862px po poprawce.

**10/10 klatek gotowych i WPIĘTE DO GRY** (`tools/build_kowal_idle.py` →
`public/assets/kowal_idle.png`, `ASSETS.kowalIdle` + `createKowalAnimations`
w `Animations.ts` + `BLACKSMITH.idleAnimKey` + `Merchant.ts` odtwarza pętlę
zamiast statycznej klatki — patrz CLAUDE.md "Working conventions" i sam
`Merchant.ts` po szczegóły). Zweryfikowane w silniku
(`game.renderer.snapshot()`, hidden-pane-safe technika z manualnym
`game.loop.step()`): dokładnie jeden animowany Kowal na mapie wioski, gra
`kowal-idle`, kolory stabilne.

**Ważna lekcja z tego kroku: sam pixel-snapping do wspólnej palety NIE
wystarcza, jeśli paleta ma bliskie-sobie duplikaty.** Pierwsza wersja
`kowal_palette_swatch.png` (14 kolorów wyciągniętych ręcznie z anchora)
miała kilka par w odległości <25 (np. `(141,111,82)`/`(151,111,84)` —
dwa "prawie te same" tony koszulki). Zwykły nearest-neighbour snap
per-klatka powodował, że drobny szum generacji przechylał piksele raz w
jedną, raz w drugą stronę granicy między takimi duplikatami — widoczne
jako MIGOTANIE koloru koszulki/paska/pasków fartucha między klatkami w
złożonej animacji, mimo że każda klatka z osobna wyglądała czysto.
Naprawa w dwóch krokach:
1. Deduplikacja palety (14 → 9 kolorów, scalanie par <22 jednostek).
2. **Bias w stronę koloru z Frame 1 na TEJ SAMEJ współrzędnej** przy
   snapowaniu klatek 2-10 (`_ANCHOR_BIAS` w `build_kowal_idle.py`) — bbox
   jest piksel-identyczny we wszystkich klatkach, więc porównanie
   pozycja-do-pozycji jest ważne bez żadnego realignmentu. Pierwsza
   wartość (1500) naprawiła koszulkę/pasek, ale NIE paski od fartucha na
   ramionach (user złapał to na oko w grze) — te akurat mają większy
   rozrzut szumu na granicy dwóch bliskich tonów. Podniesione do 6000
   naprawiło wszystko naraz, bez spłaszczenia zamierzonego ruchu
   (oddech/dłoń nadal widoczne, fg-px nadal 2694-2709 zależnie od klatki).
   **Jeśli kolejna postać dostanie wieloklatkową animację tą samą
   metodą, zacznij od razu z wysokim biasem zamiast doklejać go
   iteracyjnie region po regionie.**

### Status plików roboczych

`test.png`, `idle_guide_5x2.png` — nieużywane testy z nieudanej próby
"cała siatka na raz" (patrz wyżej), zostają jako historyczny dowód.
`test1.png`..`test10.png`, `blacksimth-test.png`, `kowal_palette_swatch.png`
to już źródła REALNEGO, wpiętego assetu — patrz sekcja "Wpięte do gry"
poniżej.

## Wpięte do gry

`tools/build_kowal_idle.py` przerabia `test1.png`..`test10.png` na
`public/assets/kowal_idle.png` (spritesheet 460×87, 10 klatek 46×87).
`ASSETS.kowalIdle` (GameConfig.ts) → `createKowalAnimations`
(Animations.ts, wołane z BootScene) → `BLACKSMITH.idleAnimKey` →
`Merchant.ts` odtwarza pętlę zamiast statycznej klatki. `frameRate: 3`
(dostrojone w sesji — 6 było za szybko). Zweryfikowane w silniku przez
`game.renderer.snapshot()` + manualny `game.loop.step()` (hidden-pane-safe
technika, patrz CLAUDE.md).

## Myśliwy — drugi NPC, jedna statyczna klatka (bez animacji na razie)

User: "nie chce mi się bawić w czasochłonną animację, zróbmy im tylko 1
klatkę idle bez animacji". Ten sam przepis co pierwszy portret Kowala
(`blacksmith.png` → `kowal_portrait.png`), zastosowany do Myśliwego —
patrz `tools/build_hunter.py`. Wpięty jako `ASSETS.hunter` /
`MERCHANT.portraitTexture = "hunter-portrait"`, zweryfikowany w silniku
(`game.renderer.snapshot()`).

**Pierwsza próba (tekst-only prompt, bez obrazu referencyjnego) wyszła
zbyt malarska** — user złapał to na oko porównując obok Kowala: więcej
niż 3 tony na twarzy, cieńszy/zmienny kontur, gradienty na paskach,
smuklejsze/bardziej anatomiczne proporcje. Dokładnie ten mechanizm z
sekcji "Lekcje z zewnętrznego pipeline'u" niżej (prompt bez dyscypliny =
większa/subtelniejsza natywna siatka = odstaje stylistycznie).

**Naprawione dołączeniem `blacksimth-test.png` (Kowala) jako Image 1 —
ale w ROLI STYLU/PROPORCJI, nie tożsamości** (jawnie wypisane w prompcie:
"do NOT preserve this character's identity... match ONLY the fidelity
level and body-proportion language"), plus zmierzone liczby zamiast
przymiotników: głowa ≈30% wysokości sylwetki, ramiona ≈90-95% szerokości
canvasu. Wynik (`hunter.png`, druga próba): 44×86 (Kowal: 46×87), głowa
~40% wysokości, ramiona ~95% szerokości — wystarczająco blisko, czyta się
jako ta sama rodzina sprite'ów. **To odwrotność triku z generowania
samego Kowala** (tam obraz referencyjny dawał TOŻSAMOŚĆ, tu dał
STYL/PROPORCJE) — warto pamiętać przy kolejnym NPC: dołączenie już
zaakceptowanej postaci jako "style-only, not identity" reference to
tańszy i pewniejszy sposób trzymania spójności całego rosteru niż samo
powtarzanie tych samych przymiotników w tekście.

Przekolorowanie (`build_hunter.py`) poszło łatwiej niż przy Kowalu —
źródło miało tylko 12 unikalnych kolorów (prompt trzymał się podanej
palety dużo ściślej niż `blacksmith.png` w swoim czasie), każdy
zidentyfikowany przez podświetlenie własnej maski (nie zgadywany):
kamizelka/cień → `drewno`, tunika → `piasek` (niemal dokładne trafienie,
dystans 5), spodnie/buty → `neutralne`, kontur → `neutralne[0]`; skóra,
włosy, brwi/cień twarzy i bandaż zostają własną domeną jak u Kowala.

## ⚠ Dlaczego Dorota/Zofia wyszły „lekko z boku" — i poprawka w obu promptach

Zgłoszone przez usera po próbie generacji: postać wychodzi pod delikatnym
kątem (3/4), nie idealnie na wprost, mimo że prompt mówi „front-facing".
**To NIE są te same prompty co przy Mamie/Ojcu** — dwie realne różnice
struktury, obie teraz poprawione w promptach niżej:

1. **Referencja identity vs. referencja stylu.** Mama/Ojciec: `Input image
   role: high-fidelity identity reference` na PRAWDZIWYM zdjęciu —
   „Preserve broad character identity — age, face shape, hair, build".
   Prawdziwe zdjęcie twarde zakotwicza geometrię (to naprawdę czyjaś
   twarz w konkretnym ujęciu). Dorota/Zofia: referencją jest ISTNIEJĄCY
   SPRITE (`elder.png`/`mother.png`) w roli „styl/proporcje, NIE tożsamość
   — wymyśl NOWĄ postać". Ten sam trik zadziałał przy Myśliwym
   (referencja Kowala), ale bez twardego zdjęcia jako kotwicy model ma
   więcej swobody w ułożeniu sylwetki — i, jak widać, potrafi tę swobodę
   zużyć na kąt kamery, nie tylko na wygląd.
2. **Brakowało jawnego, liczbowego bloku proporcji.** Prompt Mamy ma
   osobną sekcję „Body-proportion language" (head ≈ 30-40% wysokości,
   ramiona ≈ 90-95% szerokości canvasu) — dokładnie ta sama technika
   „zmierzone liczby zamiast przymiotników", która naprawiła Myśliwego
   (patrz sekcja niżej: „to jest robota dla pixel-snappera... NIE dla
   dalszego dopieszczania promptu" — ale przy PROPORCJACH akurat
   dopieszczanie promptu zadziałało). Prompty Doroty/Zofii tej sekcji nie
   miały.

**Poprawka w obu promptach niżej:** dodana jawna linia zakazująca 3/4
(„camera-straight, perfectly symmetrical front view — NOT a three-quarter
view"), dodany blok proporcji z Mamy, dodana linia „every filled shape...
no stray fragments" z tego samego promptu. Jeśli kąt i tak wróci, kolejny
krok to przejście na przepis Myśliwego/Mamy wprost: **prawdziwe zdjęcie
jako identity reference**, jeśli jakieś istnieje, zamiast sprite'u jako
style reference — to jest twardszy anchor niż cokolwiek w samym tekście
promptu.

## Dorota Zielarka — ósmy NPC, WPIĘTA (`dorota-pixel-snapper.png` → `tools/build_dorota.py` → `herbalist_portrait.png`)

`docs/wioska_plan.md` D-3 rozstrzygnął, że Dorota przejmuje sprzedaż mikstur
od Myśliwego (`HERBALIST` w `GameConfig.ts`, wpięta i grywalna na wspólnym
placeholderze — patrz `CLAUDE.md`). Brakuje tylko źródłowego obrazka. Poniższy
prompt to ten sam przepis co Myśliwy: **jedna statyczna klatka idle, bez
animacji** (user już raz zdecydował, że nie chce się bawić w animację dla
każdego NPC), z już zaakceptowaną postacią jako referencją STYLU/PROPORCJI
(nie tożsamości).

**Wybór referencji: `elder.png` (Sołtys), nie `mother.png`.** Oboje istnieją,
ale wiek niesie więcej informacji stylistycznej niż płeć w tej niskiej
wierności — Sołtys jest jedyną dotychczasową postacią jawnie starą (siwizna,
postawa), a to jest cecha, którą Dorota (61 lat) dzieli z nim, nie z Mamą.
Prompt wprost każe Gemini zmienić płeć na kobiecą — to nie jest kopiowanie
tożsamości, tylko pożyczenie „jak stara postać czyta się w tym stylu".

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND AGE reference only, NOT identity. The attached
image (an elderly village elder character) shows the target fidelity level,
outline weight, shading style, and how age (grey/white hair, slightly
stooped posture, weathered face) reads in this exact art style. Do NOT
reuse his face, his clothing, or his gender — generate a DIFFERENT,
elderly WOMAN character in the same rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held weapons or tools, no held basket/jars/plants either — effects
  and props live in separate sheets only, character must be fully
  isolated from anything it could be holding or standing against
- NO other objects anywhere in frame: no furniture, no herbs hanging to
  dry, no shelves, no ground shadow — silhouette fully isolated from
  everything else, this matters more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys)

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- an elderly widow (about 60 years old) who lives at the edge of a small
  medieval village and treats the sick with herbs, poultices, and
  midwifery — NOT a witch, NOT an alchemist, NOT a fantasy healer: no
  robes, no pointed hat, no staff, no potion bottles, no glowing
  effects, no mystical jewelry or symbols. She should read as an
  ordinary, humble countrywoman: a plain long wool skirt/dress, a apron,
  a simple headscarf covering greying hair, worn practical shoes.
  Slightly stooped posture consistent with her age, kind but weathered
  face.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - dress/skirt (undyed wool): #4D241C, #673E2C, #825C3F, #9C7D55, #B6A16E
  - apron / vest: #49231D, #623B2D, #7B573F, #947654, #AC976C
  - headscarf / shawl accent (muted sage, for a herbalist without going
    mystical-green): #245A38, #347138, #568847, #809F5D
  - dark accents / boots / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate grey/white hair ramp (3-4 tones, warm-neutral not cool-blue)
    not drawn from the lists above — skin and hair are their own
    material, they do not need to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Stan: gotowe, wpięte

Prompt (front-fix + proporcje, patrz notatka „Dlaczego Dorota/Zofia wyszły
lekko z boku" wyżej) wygenerował `dorota-pixel-snapper.png` — czysto z
przodu, bez kąta. `tools/build_dorota.py` liczy bounding-box flood-fillem
(x4-51, y8-99, 47×91) i przekolorowuje **trzema** pulami zamiast jednej
jawnej tabeli jak `build_elder.py`: SKÓRA (3 tony, wykryte progiem
R-G>40/R-B>60/R>150) i WŁOSY (3 tony, wykryte progiem nasycenia<30 +
ciepły odcień) zostają WŁASNĄ domeną — reszta (kontur/suknia/fartuch/
chusta) idzie najbliższym sąsiadem do połączonej puli `ziemia`+`drewno`+
`neutralne`+`listowie`. **Siwizna musiała dostać osobny przypadek**: jej
zadeklarowana paleta (ziemia/drewno/listowie) jest cała brązowo-zielona,
więc bez tego wyjątku włosy zmapowałyby się na brąz i „staruszka" by
zniknęła — dokładnie ta sama pułapka co w `build_elder.py`.

Wpięta: `public/assets/herbalist_portrait.png` zapisany, `ASSETS.herbalist`
ładuje go bez fallbacku na placeholder — zweryfikowane w silniku
(`texture.key === "herbalist-portrait"`, nie `"npc-portrait"`).

- **Kolor tła headscarf/shawl (`listowie`) jest jedynym elementem, który
  odróżnia jej paletę od Sołtysa/Rolnika** (obaj używają `drewno`/`piasek`
  bez zieleni) — świadomy wybór, żeby dało się ją rozpoznać z daleka jako
  „tę od ziół", bez robienia jej wizualnie mistyczną.

---

## Wdowa Zofia — grafika gotowa (`zofia.png` → `tools/build_zofia.py` → `zofia_portrait.png`), NIE wpięta w kodzie

`docs/wioska_plan.md` 5.3/6.2: Zofia (35 lat) jest tą, która **jako pierwsza
nazwie bohatera „myśliwym"** — jej pole leży w rogu niwy południowej, przy
samej ścianie lasu, i nie ma komu go bronić (mąż nie żyje, teść Sulisław za
stary, syn Janek za mały). To jest przyszła **kluczowa scena**, nie zwykła
rozmowa, więc w odróżnieniu od Doroty **nie wpinam jej teraz do
`GameConfig.ts`/`Npcs.ts`** — user prosił tylko o prompt. Kod (NpcId,
`ZOFIA` NpcDef, spawn w `TiledMap.ts`/`GameScene.ts`, tym samym przepisem co
Dorota) to osobny, mały krok, jeśli i kiedy będzie potrzebny.

**Referencja stylu: `mother.png` (Alina), nie `elder.png`.** Zofia ma 35 lat
— dorosła kobieta, nie staruszka — więc Mama jest bliższym dopasowaniem wieku
i sylwetki niż Sołtys. Prompt każe Gemini zmienić tożsamość (inna twarz,
inne ubranie, biedniejsze), zachować tylko poziom szczegółowości i styl.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND FIDELITY reference only, NOT identity. The
attached image (an adult village woman character) shows the target
fidelity level, outline weight, shading style, and body proportions for a
grown woman in this exact art style. Do NOT reuse her face, her hairstyle,
or her clothing — generate a DIFFERENT adult woman character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held tools, no held items, no geese or animals in frame — effects
  and props live in separate sheets only, character must be fully
  isolated from anything it could be holding or standing next to
- NO other objects anywhere in frame: no fence, no washing line, no
  ground shadow — silhouette fully isolated from everything else, this
  matters more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-38% of total height, shoulders ≈ 82-88% of canvas width —
  same compact, chunky low-fidelity family as the other villagers already
  made for this game (Kowal, Myśliwy, Sołtys, Mama), but noticeably
  LEANER/THINNER than Mama specifically: a narrower torso and shoulder
  width relative to height, no wide/stout build — reads as underfed and
  overworked, not as a smaller version of Mama's stocky frame. Still
  compact and chunky in the pixel-art sense (large simple head, no
  anatomical slenderness) — thinner is a silhouette-width change, not a
  shift toward realistic proportions.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a young widow (about 35 years old) from a poor farming household in a
  small medieval village, raising two children and an elderly
  father-in-law alone, keeping a flock of geese. She should read as
  tired but resilient, NOT frail or elderly — an adult working woman,
  upright posture, plain and visibly mended clothing: a simple long
  skirt/dress in a faded, worn tone, an apron with one or two patches of
  a slightly different fabric tone (mended, not torn or ragged), a
  plain headscarf covering practical, simply-tied-back hair, bare or
  worn simple shoes. No jewelry, no ornamentation, nothing that reads as
  well-off — she is the poorest household on this list, but proud and
  well-kept, not dirty or ragged. Noticeably LEANER / THINNER build than
  a well-fed farmwife (running the household alone on little food) —
  narrow through the waist and shoulders, NOT stocky or wide — but still
  reads as healthy and capable, not sickly or emaciated.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - dress/skirt (worn, faded homespun): #694936, #8D6D4F, #B1956B, #D5C08B
  - apron (undyed, plainer than the dress): #4D241C, #673E2C, #825C3F, #9C7D55
  - mended patch on the apron (a visibly different, slightly greyer
    fabric — one small patch only, not a pattern): #646775, #7F8692,
    #9CA6B0
  - headscarf ties / boots / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate hair ramp (2-3 tones, plain brown, tied back, no highlights
    beyond a normal cel-shaded band) not drawn from the lists above —
    skin and hair are their own material, they do not need to match the
    environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Stan: grafika gotowa, kod celowo NIE ruszony

`zofia.png` wyszła czysto z przodu (front-fix zadziałał, patrz notatka
wyżej), chudsza sylwetka niż Mama — widoczna w podglądzie. `tools/build_zofia.py`
liczy bounding-box flood-fillem (x5-55, y10-115, 50×105); w odróżnieniu od
Doroty **włosy NIE dostały osobnego przypadku** — są brązowe, a jej
zadeklarowana paleta (`piasek`/`ziemia`) jest też brązowo-piaskowa, więc
zwykły najbliższy-sąsiad trafia w wiarygodny odcień bez ryzyka utraty
charakterystyki (nie ma tu kategorii koloru, która zniknęłaby po
zmapowaniu — w przeciwieństwie do siwizny Doroty). Łatki na fartuchu
(`kamien`, szare) wyszły dokładnie jak w prompt cie — dwie widoczne plamy
innego materiału.

Zapisano: `public/assets/zofia_portrait.png`. **Świadomie NIE wpięte do
`GameConfig.ts`/`Npcs.ts`** — ten sam status co `pig.png` (patrz CLAUDE.md,
„art staged ahead of need"): plik gotowy do użycia, zero kodu, dopóki ktoś
nie zdecyduje wpiąć ją jako NPC. Zofia dziś nie ma nawet `NpcId`. Jeśli/gdy
zostanie wpięta jako zwykła postać talk-only, przepis jest identyczny jak
przy Dorocie; ale jej właściwa treść to raczej scena („nazywam cię
myśliwym"), więc zanim to zaprogramować, warto rozstrzygnąć, czy istniejący
`NpcDef.greetings` (kwestie zależne od stanu) wystarczy, czy to wymaga
czegoś nowego — `docs/wioska_plan.md` K1/K6 to jeszcze nie rozstrzyga.

---

## Lekcje z zewnętrznego pipeline'u (`docs/ai-pixel-snapped-game-sprites-main` — usunięty z repo 2026-10-11, pliki w historii gita)

User dorzucił cudzy, dużo bardziej rozbudowany pipeline do tego samego
problemu (prompty + referencje, MIT, bez kodu — sam tekst i obrazy).
Przejrzane w całości. To, co się z tego przekłada na naszą pracę:

**Potwierdza nasze podejście:**
- "Never pass the raw output downstream — always the snapped/zaakceptowany
  anchor jako identity reference." Dokładnie nasza zasada (Image 1 = zawsze
  poprawiony `blacksimth-test.png`, nigdy `blacksmith.png` czy klatka N-1).
- Dyscyplina promptu ma MIERZALNY wpływ na jakość: ich test — prompt
  detail-heavy odzyskał siatkę natywną 170×168 (bezużyteczna), prompt
  restrykcyjny 96×96 (świetna). Nasz prompt ma już większość ograniczeń
  (flat shading, wąska paleta, "no anti-aliasing") — potwierdza, że kierunek
  jest słuszny, nie że trzeba coś zmieniać teraz.

**To NIE jest luka w naszym pipeline — user już robi ten krok, poza
repo.** Prawdziwy "pixel snap" (odzyskanie natywnej siatki: k-means na
palecie → gradient krawędzi X/Y → wykrycie rozstawu komórek z pików
gradientu → cięcie na najbliższy pik → resample większościowym kolorem
komórki, nie tylko przemapowanie koloru) to dokładnie
[spritefusion.com/pixel-snapper](https://www.spritefusion.com/pixel-snapper)
— ten sam algorytm, który ten zewnętrzny pipeline linkuje jako swoje
źródło (`Hugo-Dz/spritefusion-pixel-snapper`). **User przepuszcza przez
niego każdą surową grafikę z Gemini, zanim w ogóle trafia do nas** — więc
`test1.png`..`test10.png`, które dostajemy, mają już odzyskaną natywną
siatkę pikseli, nie tylko dobre kolory. Nasz `_snap`/`_snap_biased` w
`build_kowal_idle.py` robi coś innego i komplementarnego: mapuje JUŻ
czyste piksele na konkretną, wąską paletę tego projektu (i pilnuje
spójności koloru między klatkami przez `_ANCHOR_BIAS`) — nie odzyskuje
struktury siatki, bo nie musi, ten problem jest już rozwiązany zanim
plik do nas dotrze. Pełny podział pracy: Gemini generuje → user
spritefusion (odzyskanie siatki) → my chroma-key + recolor na paletę
gry (+ dla animacji: anchor-bias spójność między klatkami).

**Batch-generation całej siatki klatek NA RAZ może działać — nasza
wcześniejsza porażka (`test.png`, 2x2 zamiast 5x2) nie dowodzi, że jest to
z natury niewykonalne, tylko że brakowało nam dwóch rzeczy, które ten
pipeline uznaje za obowiązkowe:**
1. Drugi obraz referencyjny — jednolity naprzemienny czarno-biały
   checker w DOKŁADNYM rozmiarze docelowego płótna, wymuszający siatkę
   pikseli (nie linie siatki, tylo teksturę). My wysyłaliśmy tylko opis
   tekstowy layoutu.
2. **Odzyskiwanie klatek przez connected-component + bounding-box, NIE
   przez grid-crop** — pozy wychodzą poza przydzieloną komórkę (broń,
   odrzut), więc cięcie na sztywno obcina fragmenty. Sformułowane wprost:
   "Never grid-crop the pose board. Recover foreground components instead."
   Warte rozważenia przy następnej wieloklatkowej animacji (np. atak
   Kowala) zamiast 8-10 osobnych zapytań do Gemini — dużo tańsze, jeśli
   guide + component-recovery faktycznie to domykają.
- **Foot-baseline lock jako jawny, osobny krok**: znajdź najniższy
  nieprzezroczysty rząd, ustaw na stałą wysokość, wyśrodkuj poziomo. U nas
  to wychodzi "za darmo" z instrukcji "match Image 1 exactly" w prompcie —
  ale nie mamy JAWNEJ weryfikacji/auto-naprawy gdy dryf się jednak zdarzy.
  Mieliśmy dryf (Frame 7/10 w tej sesji) i łapaliśmy go ręcznie, piksel po
  pikselu. Warto dodać asercję bbox do `build_kowal_idle.py` (już mamy
  dane — fg-px per klatka w raporcie — brakuje tylko `assert` na bbox
  identyczny z `_BOX`).
- **Cykl chodu = image-to-video, nie kolejne still-image generacje** —
  ich obserwacja: still-image model nie utrzyma postaci w miejscu między
  klatkami chodu, i2v (WAN/SeedDance) robi to naturalnie z samej natury
  wideo. Istotne, jeśli Kowal (albo dowolny NPC/enemy) kiedyś dostanie
  cykl chodu zamiast tylko idle-loopu.
- **"Native review checkpoint"**: osobny krok, w którym każda odzyskana
  klatka ląduje na wspólnym płótnie wyrównanym do jednej linii bazowej i
  jest przeglądana pod kątem złych odzysków (skręcone pozy, ucięte
  kończyny) ZANIM wejdzie do finalnego arkusza. Formalizuje to, co
  robiliśmy ad-hoc w tej sesji (ręczne zoom-crop porównania klatka-po-
  klatce w Reada) — warto z tego zrobić mały skrypt (siatka wszystkich
  klatek + wspólne tło) zamiast powtarzać to ręcznie za każdym razem.

## Ławka, beczka, studnia — rekwizyty (`tools/build_lawka.py`,
## `build_barrel.py`, `build_studnia.py`)

Trzy nowe źródła Gemini przetworzone tą samą metodą (crop + chroma-key +
snap do palety projektu), każde z własną lekcją:

- **`lawka.png` → `Buildings.png`** (kafle `lawka_l`/`lawka_p`, wiersz 7):
  pierwsza próba doklejenia nowego wiersza NADPISAŁA już używane kafle
  dachu (`kon_polac_kal_0/2`) — zły offset (`stare_h // PITCH` zamiast
  `(stare_h+1) // PITCH`, bo wysokość arkusza to `wiersze*33 - 1`, nie
  `wiersze*33`). Cofnięte z gita, naprawione, i dodana asercja kolizji id
  PRZED zapisem (nie po) — każdy kolejny `build_*.py`, który dokleja do
  `Buildings.png`, powinien mieć ten sam guard.
- **`barrel.png`**: inny odcień zielonego tła niż reszta assetów — kolor
  tła teraz WYKRYWANY z rogów obrazka, nie zakładany na sztywno. Też:
  przekolorowanie PRZED skalowaniem niszczy cienkie kontury przy
  nie-całkowitej skali (NEAREST losowo pomija 1px linie) — poprawka:
  skalowanie (`BOX`, nie `NEAREST`) na surowych kolorach, snap do palety
  DOPIERO po.
- **`studnia.png`**: cały arkusz narysowany na module ~40px zamiast 32px
  (zmierzone connected-component bbox, nie na oko) — jeden globalny
  współczynnik 0.8 naprawia całość naraz. Elementy wycięte jako OSOBNE
  pliki PNG (nie wklejane do `Buildings.png`) na wyraźną prośbę usera —
  będzie sam składał mapy w Tiled, więc kod nie powinien z góry narzucać
  siatki dla elementów, które nie są prawdziwym tilesetem (pierścień,
  słupek, belka, wiadro, kołowrót to freeform rekwizyty, nie kafle
  łączące się krawędziami). Wyjątek: pierścień i dach (potem zarzucony)
  dostały twarde dopasowanie do 32×32, bo mają służyć jako pojedynczy
  kafel.
- **Kołowrót dopisany do `studnia_zlozona.png`** (już wpiętego assetu,
  `Well.ts`/`ASSETS.well`) — podmiana pliku pod tą samą ścieżką, zero
  zmian w kodzie. `Well`'s collider liczy się z `this.width/this.height`
  załadowanej tekstury, więc zmiana wymiarów obrazka (70×50 → 70×78) była
  bezpieczna sama z siebie.

## `pole.png` — 163 kafle upraw (`tools/build_pole.py`)

Duży arkusz (461×250, ~139 elementów: zaorana ziemia, kapusta, zboże,
warzywa korzeniowe w kolejnych etapach wzrostu). User dał instrukcję jako
formalny brief ("You are a pixel art asset preparation tool, not an
artist" — nie przerysowywać, tylko przygotować pod Tiled). Kilka realnych
lekcji, każda potwierdzona pomiarem, nie zgadywana:

- **K-means z losową inicjalizacją i za dużym k jest niebezpieczny, gdy
  źródło ma MAŁO unikalnych kolorów.** `pole.png` ma tylko 15 unikalnych
  kolorów w treści (bardzo płaskie, zero szumu) — przy zadanym k=32
  k-means++ nie miał już z czego wybierać kolejnych środków (kwadrat
  odległości do najbliższego = 0 dla każdego pozostałego piksela) i
  wywalał się na `NaN`, a we wcześniejszej (czysto losowej) wersji
  zostawiał "martwe" klastry, które dawały wyskakujące, obce kolory na
  krawędziach — to były te "kursory"/białe plamy z pierwszej rundy,
  **zgłoszone przez usera, potwierdzone pomiarem że źródło ma zero
  pikseli >180 jasności**, czyli w 100% wprowadzone przez skrypt.
  Naprawa: gdy unikalnych kolorów ≤ k, użyj ich wprost, bez k-means.
- **Zlepione (touching) komponenty tego samego typu NIE powinny być
  odrzucane, tylko dzielone** — gęste rzędy zboża stykają się bez przerwy
  w zielonym tle, więc connected-component łączy po kilka w jeden blob.
  Pierwsza wersja je odrzucała (dziury w wyniku); poprawka: policz medianę
  pojedynczego kafla z "normalnych" komponentów, dla zlepionych podziel
  na `round(wymiar/mediana)` równych części wzdłuż dłuższej osi. Prawdziwy
  wyjątek (nieregularny "kawałek pola" w rogu źródła, 45×96) rozpoznany
  inaczej: duży w OBU wymiarach naraz, nie tylko wydłużony w jedną stronę.
- **Płaski test "diff-od-tła + nie-zielony" zastosowany do CAŁEGO kadru
  dziurawi wnętrze zielonych obiektów.** Rośliny są z natury zielone —
  test `g>140 i g>r+30 i g>b+30` zastosowany wszędzie łapał też legalne
  ciemnozielone cieniowanie liści/kapusty, zostawiając białe dziury w
  środku (zgłoszone przez usera, zmierzone: 58k "podejrzanie zielonych"
  pikseli, ale to metryka bez sensu tutaj — w przeciwieństwie do
  beczki/studni, gdzie NIC w temacie nie jest zielone, więc każdy zielony
  piksel tam był bezpiecznym sygnałem tła). Właściwa technika (ta sama co
  w `build_kowal.py` od początku sesji, tu pominięta w pierwszym
  przebiegu): flood-fill TYLKO od krawędzi kadru — respektuje kształt,
  nie wejdzie w środek liścia otoczonego własnym konturem niezależnie od
  tego, jak "zielony" jest w środku — plus osobny, znacznie ściślejszy
  test resztkowy (`g>200, g>r+100, g>b+100`) na izolowanych kieszeniach
  tła, których flood-fill nie dosięgnie.
- **Wysokie rośliny (łodyga rosnąca ponad własną działkę ziemi) nie
  powinny być ani ściskane do kwadratu, ani przycinane** — user: "zachowaj
  proporcje ale... pomyśl jak zrobić pole... gdzie jedna roślina składa
  się z dwóch kafelków". Rozwiązanie: DOKŁADNIE ten sam wzorzec co
  `trees-base`/`trees-over` w `Nature.png` (patrz CLAUDE.md) — dolna
  część (ziemia + dolna łodyga, wysokość jednego kafla) trafia do
  głównego arkusza jako normalny kafel 32×32; górna część (reszta
  łodygi/liście) to osobny plik (`pole_over_NN.png`) o naturalnej
  wysokości (bez wymuszania 32px), przeznaczony na warstwę `-over`
  rysowaną nad postaciami, jedno pole wyżej w Tiled niż jego własna
  podstawa. Skala jednolita (ten sam współczynnik dla X i Y, liczony z
  mediany szerokości kafla) — żadnego niezależnego rozciągania osi, które
  psuło proporcje w poprzednich wersjach.
- **Kolory NIE zostały przemapowane na projektową paletę budynków/
  kamienia** (`docs/paleta.json`) — świadoma decyzja: to inna tematyka
  (uprawy, nie ściany), a instrukcja usera wprost zabraniała
  "przerysowywania" stylu. Redukcja kolorów to kwantyzacja WŁASNYCH
  kolorów źródła (do 15 unikalnych, i tak już bardzo płaskich), nie
  wymuszenie obcej rampy.

---

## Ósemka z `wioska_plan.md` §6 — WPIĘTA W KODZIE; Kuba ma już portret

**Kuba: ZROBIONY** (`kuba.png` 50×104 → `tools/build_kuba.py` → `kuba_portrait.png`,
`ASSETS.kuba`, `KUBA.portraitTexture`, `scale: 0.74`). Prompt niżej zadziałał za
pierwszym razem: na wprost, puste ręce, broda czytelna. **Jego skrypt jest
wzorem dla pozostałej siódemki** — w szczególności dla Sulisława, który ma ten
sam problem z siwizną.

⚠ **Nie używaj `snap_paleta.py` do portretów.** Ten skrypt snapuje do
najbliższego sąsiada i przy Kubie zjadłby brodę: siwizna ma najbliżej rampę
`kamien`, czyli tę samą co kapelusz i buty, więc cała kategoria „włosy"
zniknęłaby w kategorii „kamień". `build_kuba.py` ma **jawną tabelę** zbudowaną
ze zmierzonych centroidów, a skóra i broda mają **własne rampy poza
`paleta.json`** — ta sama decyzja co u Zofii i Doroty.

Hanna, Witek, Kuba, Sulisław, Agata, Dobrawa, Sobek i Gniewko **istnieją już
w grze**: mają bloki w `GameConfig.ts`, wpisy w `NPCS`, po dwa tematy rozmowy
i własne punkty w `village-zagaje.tmj`. Czego nie mają, to twarzy — każdy
renderuje się na wspólnym `NPC.png` z własnym `tint`, czyli tą samą ścieżką,
którą przeszedł Kowal, zanim dostał swój portret.

**Podmiana jest jedną linijką na osobę**: wygeneruj obrazek, przepuść go przez
skrypt wzorowany na `tools/build_zofia.py`, dopisz `portraitTexture` do bloku
w `GameConfig.ts` (+ `ASSETS` i ładowanie w BootScene). `tint` zostaje jako
fallback, dokładnie jak u wszystkich pozostałych.

### Czego NIE zmieniać w prompcie

Cały szkielet bierz z sekcji „Wdowa Zofia" niżej — łącznie z **poprawką z
sekcji ⚠ o ujęciu 3/4**: jawny zakaz three-quarter view i liczbowy blok
proporcji (głowa ≈ 30–40% wysokości, ramiona ≈ 90–95% szerokości). Bez tych
dwóch rzeczy postać wychodzi pod kątem i w złej skali, co zostało już raz
zgłoszone i naprawione. Zmieniasz **wyłącznie blok „Character identity"**.

### Referencja stylu na osobę (`wioska_plan.md` §6.1)

Plan liczy 15 baz, z czego 5 gotowych; ta ósemka mieści się w trzech
istniejących archetypach, więc jako *style/proportion reference* (NIE
tożsamość — „invent a NEW character") bierz:

| postać | wiek | referencja stylu | uwaga |
|---|---|---|---|
| Hanna | 38 | `mother.png` | chłopka dorosła |
| Agata | 43 | `mother.png` | kowalowa — ciemniejsza, przydymiona |
| Dobrawa | 19 | `mother.png` | **jedyna bez własnej bazy** — plan chce „dziewczyny", a tej kategorii nie ma; wyraźnie młodsza sylwetka, bez chusty |
| Witek | 44 | `peasant.png` | chłop dorosły |
| Sobek | 38 | `peasant.png` | stolarz |
| Gniewko | 33 | `peasant.png` | pasterz |
| Kuba | 66 | `elder.png` | starzec |
| Sulisław | ~68 | `elder.png` | starzec, **niewidomy na jedno oko** |

### Bloki „Character identity" — gotowe do wklejenia

⚠ **Żadna z tych postaci NICZEGO NIE TRZYMA — i to nie jest przeoczenie.**
Blok „Composition" w szkielecie mówi wprost: `no held tools, no held items
(...) character must be fully isolated from anything it could be holding`.
Powód jest techniczny: kadr wycina się flood-fillem od krawędzi, a rekwizyt
albo skleja się z sylwetką tam, gdzie nie powinien, albo zostaje osobnym
kawałkiem i łamie regułę „single closed region". Zawód ma być czytelny
z **ubrania i śladów pracy** — fartuch, wióry na ramieniu, sadza, mokre
rękawy — nie z przedmiotu w dłoni. (Pierwsza wersja tych bloków miała
rekwizyty w rękach i była sprzeczna ze szkieletem; poprawione.)

Kolory NIE są brane z `tint` w `GameConfig.ts` — tint to placeholder, który
przestanie cokolwiek znaczyć w chwili, gdy portret powstanie. Palety buduj
z `docs/paleta.json`, tak jak wszystkie dotychczasowe.

- **Hanna** (`0xd9b0a6`) — a farmer's wife in her late thirties, headscarf tied
  at the nape, sleeves rolled to the elbow, a plain work apron. Faded rose and
  undyed linen. Practical, unhurried, hands empty at her sides.
- **Witek** (`0x9aa88c`) — a flax grower in his mid-forties, coarse grey-green
  tunic, sleeves soaked and stained dark to above the elbow from the retting
  pond. Weathered, slightly stooped, hands empty.
- **Kuba** (`0xa8a8b0`) — an old man of sixty-six, standing but visibly
  stooped, a shapeless felt hat, full grey beard, hands empty at his sides.
  Alert eyes — he watches everything that crosses the square.
- **Sulisław** (`0xb4aca0`) — a very old man, thinner and paler than Kuba, one
  eye clouded white, head tilted slightly as if listening rather than looking.
  Undyed homespun, no hat. **Do not make him look frail-comic — he is dignified.**
- **Agata** (`0xb9a17e`) — a blacksmith's wife in her early forties, dark
  headscarf, soot-marked apron over an ochre dress, hands empty. Sharp,
  businesslike expression.
- **Dobrawa** (`0xa8c98a`) — a village girl of nineteen, **no headscarf**, hair
  in a single braid, light green kirtle, hands clasped in front. Youngest adult
  in the cast — the silhouette must read as clearly younger than Hanna's.
- **Sobek** (`0xc2a075`) — a carpenter in his late thirties, leather apron,
  wood shavings caught on the shoulders and forearms, hands empty. Sturdy build.
- **Gniewko** (`0xcfc4ac`) — a shepherd of thirty-three, hooded cloak of
  undyed cream wool, worn boots, hands empty. Lean, outdoor.

### Kolejność, gdyby robić po kolei

Sulisław i Kuba pierwsi — siedzą przy studni na placu, czyli przy drodze,
którą gracz przechodzi za każdym razem, i `wioska_plan.md` §6.2 przewiduje im
docelowo komentowanie stanu gry (K8). Potem Dobrawa (jedyna bez bazy, więc
najwięcej się na niej nauczysz), na końcu reszta.

⚠ **W praktyce user zaczął od Gniewki** (2026-08-18), nie od tej kolejności —
prompt niżej odstępuje od planu celowo, reszta siódemki idzie tym samym
przepisem, w dowolnej kolejności.

---

## Gniewko/Pasterz — pierwszy z pozostałej siódemki, prompt złożony (2026-08-18)

Ten sam szkielet co Zofia (front-fix + blok proporcji), referencja stylu
`peasant.png` (Rolnik/Dobek — dorosły chłop, patrz tabela wyżej), blok
„Character identity" rozwinięty z gotowej notatki wyżej (`0xcfc4ac`, „a
shepherd of thirty-three... Lean, outdoor"). Paleta zbudowana z
`docs/paleta.json`, nie wymyślona — płaszcz z rampy `piasek` (ta sama, z
której powstał kremowy strój Anny), tunika pod spodem z `drewno` o ton
ciemniej, kontur/pas/buty z `neutralne`.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND PROPORTION reference only, NOT identity. The
attached image (an adult male village farmer character) shows the target
fidelity level, outline weight, shading style, and body proportions for a
grown man in this exact art style. Do NOT reuse his face, his hairstyle,
or his clothing — generate a DIFFERENT adult man character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held crook, no held staff, no held tools, no dog, no sheep anywhere
  in frame — effects and props live in separate sheets only, character
  must be fully isolated from anything it could be holding or standing
  next to
- NO other objects anywhere in frame: no fence, no ground shadow, no
  animals — silhouette fully isolated from everything else, this matters
  more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Rolnik) — but
  noticeably LEANER than a well-fed farmer: a narrower torso, not stocky
  or wide, reading as someone who works outdoors on foot all day rather
  than someone who works a farmstead. Still compact and chunky in the
  pixel-art sense (large simple head, no anatomical slenderness) —
  thinner is a silhouette-width change, not a shift toward realistic
  proportions.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a shepherd of thirty-three from a small medieval farming village, who
  pastures a flock owned jointly by several households on open fallow
  land past the village edge. He should read as lean and weathered from
  being outdoors in all weather, NOT stocky or well-fed like the village's
  other grown men — narrow through the shoulders and waist, wiry rather
  than muscular. A hooded cloak of plain, undyed cream/off-white wool worn
  over a simpler, slightly darker tunic, sturdy worn boots, a plain belt.
  Hands empty at his sides — no crook, no staff, nothing held. Alert,
  watchful posture, as if always keeping half an eye on something out of
  frame. No jewelry, no ornamentation, nothing that reads as well-off.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - cloak (outer layer, undyed cream wool): #694936, #8D6D4F, #B1956B,
    #D5C08B, #F9ECAD
  - tunic (under the cloak, plainer and a shade darker): #49231D,
    #623B2D, #7B573F, #947654, #AC976C
  - belt / boots / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small warm skin-tone ramp (2-3 tones, a shade
    darker/more weathered than an indoor character's, since he is
    outside constantly) and ONE separate hair ramp (2-3 tones, plain
    brown, short and practical, a little unkempt) not drawn from the
    lists above — skin and hair are their own material, they do not need
    to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Stan: gotowe, wpięte (2026-08-18)

Prompt wyszedł czysto za pierwszym razem: front na wprost, kaptur/płaszcz
widoczny jako narzuta na ramionach (nie w pełni zakrywający głowę — mniej
dosłowny niż „hooded", ale sylwetka czyta się poprawnie), ręce puste,
zero obcych obiektów w kadrze. `gniewko.png` (51×99).

`tools/build_gniewko.py` liczy bounding-box flood-fillem (x2-47, y7-90,
46×84) — **inaczej niż u Kuby, włosy NIE dostały własnej domeny koloru**:
zmierzone brązy włosów (6 tonów) trafiają najbliższym sąsiadem w
`ziemia`/`kora`/`piasek` z odległością rzędu kilku jednostek RGB, bez
kolizji z otoczeniem (dokładnie ten sam przypadek co Zofia — kolor
środowiska jest też brązowy, więc żadna kategoria nie znika po zmapowaniu).
Tylko skóra dostała własną, ciasną rampę (3 tony) — bez niej jaśniejsze
tony wpadały w `akcent_cieply`, a ciemniejsze w `piasek`/`ziemia`, i dłoni
nie dałoby się odróżnić od nogawic tuż obok. Wynik: **100% pikseli trafia
dokładnie w tabelę**, 15 kolorów wyjściowych, zero spoza palety.

Wpięte: `public/assets/characters/gniewko_portrait.png`, `ASSETS.gniewko`,
ładowanie w `BootScene`, `GNIEWKO.portraitTexture = "gniewko-portrait"`,
`scale: 0.79` (66 / 84, ta sama metoda co u Kuby/Zofii). Zweryfikowane
zrzutem ekranu od usera na żywej mapie wioski — Pasterz stoi przy swojej
chacie z nowym portretem zamiast wspólnego `NPC.png` z tintem.

---

## Hanna — trzecia z ósemki, prompt złożony (2026-08-18)

Referencja stylu `mother.png` (Alina — patrz tabela wyżej), blok „Character
identity" rozwinięty z gotowej notatki wyżej (`0xd9b0a6`, „a farmer's wife
in her late thirties... Faded rose and undyed linen"). Żona Dobka (`HANNA`
w `GameConfig.ts`), odpowiada za nabiał w gospodarstwie — stąd „mleko nie
poczeka" w jej powitaniu; to jedyny fakt fabularny wpleciony w tożsamość,
nic wymyślonego ponad już istniejące dialogi. **Proporcje standardowe**
(NIE szczuplejsze jak u Zofii/Anny) — zdrowa gospodyni, nie niedożywiona
wdowa.

Paleta: suknia ze spłowiałego różu z `akcent_cieply` (bez najciemniejszego
tonu — zbyt nasycony, czytałby się jak krew, nie jak spłowiały barwnik),
fartuch z niebielonego lnu z `piasek` (jaśniejszy i prostszy niż suknia),
kontur/chusta/buty z `neutralne`.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE reference only, NOT identity. The attached image
(an adult village woman character) shows the target fidelity level,
outline weight, shading style, and body proportions for a grown woman in
this exact art style. Do NOT reuse her face, her hairstyle, or her
clothing — generate a DIFFERENT adult woman character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held tools, no held items, no pail, no animals in frame — effects
  and props live in separate sheets only, character must be fully
  isolated from anything it could be holding or standing next to
- NO other objects anywhere in frame: no fence, no washing line, no
  ground shadow — silhouette fully isolated from everything else, this
  matters more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Mama) — sturdy and
  healthy build, NOT leaner than Mama the way Zofia or Anna are.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a farmer's wife in her late thirties (about 38) from a small medieval
  farming village, married to a peasant with no oxen of his own, and
  responsible for the household's dairy work rather than fieldwork. She
  should read as practical and unhurried, sturdy and capable — NOT frail
  or delicate. A plain headscarf tied at the nape rather than covering
  all her hair (a few strands visible at the front), sleeves rolled up
  past the elbow, a simple work apron over a faded rose dress in an
  undyed linen tone. No jewelry, no ornamentation, nothing that reads as
  well-off. Hands empty at her sides, not mid-task.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - dress (faded rose, worn): #871919, #AA432E, #CC7448, #EFAC69
  - apron (undyed linen, plainer and lighter than the dress): #694936,
    #8D6D4F, #B1956B, #D5C08B
  - headscarf ties / boots / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate hair ramp (2-3 tones, plain brown, tied back under the
    scarf, no highlights beyond a normal cel-shaded band) not drawn from
    the lists above — skin and hair are their own material, they do not
    need to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Stan: gotowe, wpięte (2026-08-18)

Wyszło czysto za pierwszym razem: front na wprost, ręce puste, chustka
zawiązana z tyłu (choć zakrywa więcej włosów niż „tied at the nape"
sugerowało — czyta się i tak poprawnie), rękawy podwinięte, sukienka w
spłowiałym różu pod fartuchem w niebielonym lnie z rdzawym lamowaniem.
`hanna.png` (50×105).

`tools/build_hanna.py` liczy bounding-box flood-fillem (x1-47, y9-95,
47×87) — **włosy dostały własną rampę, tym razem TAK jak u Kuby, nie jak
u Gniewki**: spod chustki widać tylko kilka kosmyków, w tej samej
brązowo-tan rodzinie co sama chustka (obie „niebielony len"), więc
najbliższy sąsiad miał realną szansę zlać je w jeden kolor — dokładnie ta
sama pułapka co broda na kapeluszu. Sukienka i lamowanie fartucha poszły
do `akcent_cieply` (a nie osobnej rampy) — pierwsze użycie tej kategorii
palety do ubioru postaci, nie tylko do efektów. Wynik: **100% pikseli
trafia dokładnie w tabelę**, 19 kolorów wyjściowych, zero spoza palety.

Wpięte: `public/assets/characters/hanna_portrait.png`, `ASSETS.hanna`,
ładowanie w `BootScene`, `HANNA.portraitTexture = "hanna-portrait"`,
`scale: 0.76` (66 / 87).

---

## Sulisław — czwarty z ósemki, prompt złożony (2026-08-18)

Referencja stylu `elder.png` (Sołtys), czyli **ta sama co Kuba** — i to jest
całe ryzyko tej postaci, patrz niżej.

### ⚠ Rozstrzygnięte przed generowaniem: ma 81 lat, nie 68

`wioska_plan.md` mówił 68, ale `ZOFIA.topics.sama` — **kwestia, którą gracz
może już w grze usłyszeć** — mówi „teść ma osiemdziesiąt jeden lat i połowę
wzroku". To była nasza własna sprzeczność, nie rozbieżność źródeł: oba teksty
wyszły z tej samej ręki. Rozstrzygnięta na **81**, a `wioska_plan.md`
poprawiony, żeby nie wróciła. Reguła na przyszłość: **wypowiadany dialog bije
planowanie**, bo dialogu nie da się cofnąć z zapisów gracza.

Dla portretu to konkretna różnica — ma być **wyraźnie starszy i wątlejszy od
Kuby (66)**, nie „drugi starzec".

### ⚠ Dwie rzeczy, które decydują o powodzeniu

**1. Nie może czytać się jak Kuba.** Stoją **160 px od siebie** (kafle 54,62
i 50,65), obaj przy studni na placu — gracz widzi ich **w jednym kadrze**. Przy
wspólnej referencji i wspólnym archetypie „starzec" grozi to dwoma
identycznymi sylwetkami. Dlatego rozdzielenie idzie przez **sylwetkę, nie
przez detal**: Kuba ma **bezkształtny filcowy kapelusz i pełną brodę**, więc
Sulisław jest **bez kapelusza, z odkrytą siwą głową i bez brody** (przystrzyżony
zarost). To różnica widoczna z daleka, w przeciwieństwie do koloru oczu.

**2. Zbielałe oko to 1–2 piksele i samo nie zadziała.** Portret jest
przycinany do ~45×89 i renderowany ze `scale` ~0,76, więc twarz ma
kilkanaście pikseli szerokości. Ślepota **musi jechać na postawie**:
przekrzywiona głowa, jakby nadsłuchiwał, a nie patrzył. To jest ta sama reguła,
którą projekt zapisał przy ziołach — „cały odczyt musi być w sylwetce i dwóch
kolorach, bo tylko to przeżywa zmniejszenie". Oko prosimy mimo to, bo nic nie
kosztuje.

⚠ **Siwizna MUSI dostać własną rampę** (jak u Kuby i Doroty). Snapowanie
najbliższym sąsiadem wpycha ją w `kamien`, czyli tę samą rampę co buty —
i cała kategoria „włosy" znika. `build_kuba.py` jest tu wzorem.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND AGE reference only, NOT identity. The attached
image (an elderly village elder character) shows the target fidelity level,
outline weight, shading style, and how age reads in this exact art style.
Do NOT reuse his face, his hat, his beard, or his clothing — generate a
DIFFERENT, even older man in the same rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer.
  The ONLY exception is the head, which is tilted very slightly to one
  side (see identity below) — the body stays square to the viewer.
- facing screen/front/south, centered, full body visible
- standing, at ease, not mid-task, NOT sitting
- no walking stick, no cane, no held tools, no held items of any kind —
  effects and props live in separate sheets only, character must be fully
  isolated from anything it could be holding or leaning on
- NO other objects anywhere in frame: no bench, no well, no ground
  shadow — silhouette fully isolated from everything else, this matters
  more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-38% of total height, shoulders ≈ 80-86% of canvas width —
  same compact, chunky low-fidelity family as the other villagers already
  made for this game (Kowal, Myśliwy, Sołtys), but noticeably THINNER and
  more stooped than any of them: narrow shoulders, slightly hollow chest,
  a visible forward curve of the upper back. Still compact and chunky in
  the pixel-art sense (large simple head, no anatomical slenderness) —
  thinner is a silhouette-width change, not a shift toward realistic
  proportions.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a very old peasant man, eighty-one years old, living in his widowed
  daughter-in-law's household in a small medieval village. He spends his
  days sitting by the village well with another old man. He is nearly
  blind in one eye.
- BARE HEAD, no hat and no hood — thin white/grey hair, receding, wispy
  rather than full. NO full beard: at most short, uneven stubble. This
  matters — another old man in this game already has a felt hat and a
  full beard, and these two stand next to each other, so their
  silhouettes must not match.
- one eye is clouded pale/milky white, the other normal and dark. His
  head is tilted very slightly to one side, chin a little raised, as
  though LISTENING rather than looking — that posture, not the eye, is
  what has to communicate the failing sight.
- undyed homespun: a plain long shirt/tunic belted at the waist, simple
  loose trousers, worn soft shoes. Everything faded and colourless from
  age and washing. No jewelry, no ornament, nothing that reads as
  well-off.
- ⚠ He must read as DIGNIFIED, not comic and not pitiful: upright head,
  calm and steady expression. No hunched cringe, no toothless grin, no
  cartoon frailty, no trembling pose.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - shirt/tunic (undyed homespun, washed out): #694936, #8D6D4F,
    #B1956B, #D5C08B
  - trousers (plainer and darker than the shirt): #4D241C, #673E2C,
    #825C3F, #9C7D55
  - belt / shoes / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small skin-tone ramp (2-3 tones) — noticeably
    PALER and greyer than a working man's, he is indoors and immobile —
    and ONE separate white/grey hair ramp (3-4 tones, warm-neutral, NOT
    cool blue-grey), neither drawn from the lists above: skin and hair
    are their own material and do not need to match the environment
    palette
  - the clouded eye may use the lightest tone of the hair ramp
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Stan: gotowe, wpięte (2026-08-18)

⚠ **Jedyne źródło z tej ósemki, które przyszło jako JPEG 14× za duże**
(720×1483 zamiast prawdziwej siatki sprite'a ~50×100) — Gemini narysowało
„styl pixel art" w wysokiej rozdzielczości zamiast faktycznie niskiej. Zanim
cokolwiek innego, `tools/build_sulislaw.py` sprowadza to `Image.BOX`-em
(uśredniającym, nie najbliższym sąsiadem) do szerokości 50 — dopiero po tym
kroku reszta przepisu Kuby (zdjęcie zieleni, bounding-box, przekolorowanie)
ma sens. Zmierzone: mediana biegu tego samego koloru w poziomie ~12–14 px,
stosunek 720/50 = 14,4 — spójne z jednym „kaflem sztuki" ≈ 14 prawdziwych
pikseli.

⚠ **Na pełnej rozdzielczości cieniowanie szczęki czytało się jak pełna
broda — na prawdziwej siatce 44×86 to zwykły cień, nie osobna faktura
włosów.** Sprawdzone wycięciem powiększonej głowy 14×, ze współrzędnymi
naniesionymi na obraz: Sulisław jest gładko ogolony. To dobrze — rozdziela
sylwetkę od Kuby (kapelusz + pełna broda) bez zmiany treści promptu, sam
prompt już to zamawiał („NO full beard").

Zmętniałe oko zadziałało: `(25,14)` w przyciętym obrazku to jasny
niebieskoszary `#c0c6cb` na tle ciemnofioletowego zdrowego oka `(18,14)`
`#312c34` — widoczna różnica nawet przy 44 px szerokości postaci. Głowa nie
wyszła przechylona (prompt o to prosił), ale samo oko wystarczyło.

Siwizna dostała własną rampę (jak broda Kuby) — najbliższy sąsiad wpychał ją
w `kamien`, tę samą paletę co nigdzie indziej na tej postaci nieużytą, więc
byłoby to bezpieczne, ale niespójne z resztą rodziny starców. Zmętniałe oko
dzieli najjaśniejszy ton tej rampy, dokładnie jak przewidywał prompt.

Wpięte: `public/assets/characters/sulislaw_portrait.png`, `ASSETS.sulislaw`,
ładowanie w `BootScene`, `SULISLAW.portraitTexture = "sulislaw-portrait"`,
`scale: 0.77` (66 / 86).

---

## Anna — młoda kobieta ~25 lat, przepis FOTO (2026-08-14)

**To jest przepis Mamy/Ojca, nie Doroty/Zofii** — i nie jest to wybór
stylistyczny, tylko wprost wniosek z notatki „Dlaczego Dorota/Zofia wyszły
lekko z boku" wyżej. Tamta sekcja kończy się zdaniem, że jeśli kąt 3/4
wróci, kolejnym krokiem jest **prawdziwe zdjęcie jako identity reference,
bo to twardszy anchor niż cokolwiek w tekście promptu**. Tutaj zdjęcie jest
od początku, więc zaczynamy od najmocniejszej wersji.

Prompt niesie wszystkie trzy poprawki, które tamta notatka wprowadziła:
jawny zakaz 3/4, blok proporcji z liczbami, oraz linię „every filled
shape… no stray fragments".

### ⚠ Dwie rzeczy do rozstrzygnięcia PRZED generowaniem

**1. Imię koliduje z trzema już istniejącymi.** W obsadzie są już **Hanna**
(żona Dobka), **Alina** (matka gracza) i **Agnieszka** (żona młynarza,
`wioska_plan.md` §6). „Anna" to czwarte imię w tym samym gnieździe, a od
„Hanny" różni się jedną literą. To ma skutek mechaniczny, nie tylko
estetyczny: NPC-e wymieniają się z imienia w dialogach („Miłosz cię
przysłał", „Gniewko wypasa stado"), dziennik zadań podaje zleceniodawcę po
imieniu, a `NPC_OBJECT_NAMES` w `TiledMap.ts` przyjmuje imię jako nazwę
obiektu w Tiled. Zmiana imienia teraz to jedna linijka; po napisaniu
dialogów i zapisaniu save'ów — znacznie więcej.

**2. „Wysoka i szczupła" jest w bezpośrednim konflikcie z blokiem proporcji
tej gry.** Ustalony blok mówi: „head ≈ 30-40%, shoulders ≈ 90-95% —
compact, chunky, **NOT slender/anatomical**, matching the other villagers".
Postać wysoka i szczupła w sensie dosłownym wypadłaby z tej rodziny
wizualnej. Rozwiązane **względnie, nie przez porzucenie systemu**: głowa na
DOLNYM końcu pasma (≈30%, czyta się wyżej), ramiona ≈80-85% (węziej niż
90-95% krępych wieśniaków), ale nadal chunky pixel art. Dzięki temu jest
„tą wysoką i szczupłą" **na tle obsady**, a nie postacią z innej gry.

### Rola nie jest ustalona

Blok „Character identity" niżej zakłada **młodą wieśniaczkę** — bo tym jest
każdy dotychczasowy NPC i to determinuje ubranie. Jeśli Anna jest kimś
innym (wędrowna, z miasta, spoza Zagaja), **to jedyny blok do przepisania**;
reszta promptu zostaje bez zmian.

### Prompt (Image 1 = zdjęcie twarzy)

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already produced several accepted village NPCs for this
game — keep the same overall approach.

Input image role: HIGH-FIDELITY IDENTITY REFERENCE. The attached photo is
a real person. Preserve broad character identity only — approximate age,
face shape, hair colour and hair length, general build. Do NOT preserve
the photographic rendering: convert the reference into a simple game
sprite. Do NOT attempt a portrait likeness at this resolution; only
broad, readable traits survive at this size.

Create one full-body south-facing / front-facing character anchor on a
32x64 canvas.

Camera and pose (earlier generations for this game failed here — be strict):
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned
- shoulders square to camera, both eyes equally visible, nose centered on
  the vertical axis
- neutral upright standing pose, at ease, not mid-task
- arms at sides, feet slightly apart

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- lower fidelity than the reference
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface — no more than 3 tones on any single material
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- every filled shape must be a single closed region fully enclosed by the
  outline — no stray or floating pixel fragments
- designed to fit cleanly inside future 32x64 animation cells

Body-proportion language (she is the TALL, SLIM one of this cast — but she
must still belong to it):
- head ~ 30% of total height — the LOW end of this game's 30-40% band, so
  she reads taller than the other villagers
- shoulders ~ 80-85% of canvas width — narrower than the 90-95% used for
  the stockier villagers (Kowal, Mysliwy, Soltys), so she reads slimmer
- still chunky, readable, simple-shaped pixel art — do NOT switch to
  slender anatomical or realistic proportions, and do NOT stretch the
  limbs into a fashion-illustration figure

Composition:
- exactly one full-body character, nothing else in frame
- centered, full body visible, generous margin on all sides (character
  must not touch canvas edges)
- no held weapons, tools or props of any kind; no worn or slung gear
- NO other objects anywhere in frame: no furniture, no ground shadow, no
  decoration, nothing the character touches or stands against —
  silhouette fully isolated from everything else, this matters more than
  any other constraint here

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the background
  — zero noise, zero grain, zero vignette, zero gradient, zero dithering
  or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a young woman, about 25 years old, living in a small medieval village.
  Tall and slim relative to the rest of this cast. Long blonde hair, worn
  loose or in one simple braid — no elaborate hairstyle, no headdress.
  Plain practical countrywoman's clothing: a long simple wool or linen
  dress, a plain apron or belted overdress, worn practical shoes. She is
  NOT a noble, NOT a warrior, NOT a fantasy character: no armour, no
  jewellery, no ornate trim, no embroidery, no cloak, no hood, no staff,
  no magic, no glowing effects.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - dress / skirt (undyed wool): #4D241C, #673E2C, #825C3F, #9C7D55, #B6A16E
  - apron / linen overdress: #694936, #8D6D4F, #B1956B, #D5C08B, #F9ECAD
  - dark accents / shoes / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate BLONDE hair ramp (3-4 tones, warm golden-wheat — NOT neon
    yellow, NOT cool ash-grey) not drawn from the lists above — skin and
    hair are their own materials and do not need to match the environment
    palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Po generacji — ta sama ścieżka co reszta

1. Zapisz wynik jako `public/assets/anna.png` (albo `<imię>.png`, jeśli imię
   się zmieni — patrz ostrzeżenie wyżej).
2. `tools/build_anna.py` na wzór `build_zofia.py`/`build_dorota.py`:
   bounding-box flood-fillem po tle #00FF00, przycięcie, przemapowanie na
   paletę, zapis `<imię>_portrait.png`.
3. Wpięcie: `ASSETS.<imię>` + blok `NpcDef` w `GameConfig.ts` + punkt w
   `village-zagaje.tmj` + wiersz w `NPC_OBJECT_NAMES` (`TiledMap.ts`).
   ⚠ Rozstawienie musi przejść `tools/audyt_rekwizytow.py` — reguła O1
   wymaga >96 px od każdego innego NPC.

### Stan (2026-08-14): portret gotowy i wpięty, POSTAĆ BEZ MIEJSCA NA MAPIE

`anna.png` (50×106, 34 kolory) wygenerowana **za pierwszym podejściem —
na wprost, bez kąta 3/4**. Czyli przepis „prawdziwe zdjęcie jako identity
reference" zadziałał dokładnie tak, jak zapowiadała notatka o Dorocie
i Zofii: twarde zdjęcie kotwiczy geometrię lepiej niż jakikolwiek zapis
w tekście promptu.

`tools/build_anna.py` → `anna_portrait.png` (52×108, 28→19 kolorów).
**Trzy własne domeny koloru zamiast jednej** — blond (678 px) i skóra
(424 px) snapują do ramp wyciętych z jej własnego obrazka, oczy łapie
rampa `woda` (#6cafc7 leży 20 jednostek od jej #7eabc3). Bez wyjątku na
blond wyszłaby BRUNETKA: `docs/paleta.json` nie ma nasyconej złoto-żółtej
rampy, więc najbliższym sąsiadem blondu są brązy `drewno`/`ziemia`. To ta
sama pułapka, którą `build_dorota.py` opisuje przy siwiźnie.

⚠ **Jedyna wada wygenerowanego obrazka: sylwetka dotyka lewej i prawej
krawędzi kadru** (wiersze y57–70, czyli najszersze miejsce rękawów), mimo
linijki „generous margin" w prompcie. Sprawdzone — to **nie amputacja**:
kontur `#110f19` stoi na x=0 i x=49 kompletny, brakuje wyłącznie
przezroczystego marginesu. Generator dokleja 1 px zamiast prosić
o regenerację, bo regeneracja ryzykowałaby utratę pozy na wprost, która
tu wyszła poprawnie za pierwszym razem.

**Wniosek na przyszłe postacie:** linijka o marginesie jest zbyt miękka.
Warto ją wzmocnić liczbą — np. „at least 2 px of empty background on
every side; the character outline must never touch the canvas edge".

**Wpięta w kodzie, niewidoczna w grze:** `ASSETS.anna` (+ `load.image`
w `Assets.ts` — ⚠ łatwo o tym zapomnieć, bez tego leci awaryjny tint),
`ANNA` w `GameConfig.ts`, `NpcId "anna"` + wpis w `NPCS`, wiersz
w `NPC_OBJECT_NAMES`. Brakuje **wyłącznie punktu w `village-zagaje.tmj`** —
autor nie zdecydował, gdzie stoi, a `wioska_plan.md` nie rezerwuje jej
strefy (nie ma jej w rozpisce trzydziestu).

⚠ `anna` i `hanna` różnią się jedną literą i **obie są prawdziwymi nazwami
obiektów** w `NPC_OBJECT_NAMES`. Literówka w Tiled da po cichu nie tę
postać, zamiast ostrzeżenia o nieznanej nazwie — jedyny taki przypadek
w tej tabeli.


---

## Patryczek — kolega gracza, trener walki (2026-08-14)

Ten sam przepis co Anna: **zdjęcie jako identity reference**, bo to
najtwardsza kotwica (patrz notatka „Dlaczego Dorota/Zofia wyszły lekko
z boku"). Prompt niesie te same trzy poprawki: zakaz 3/4, blok proporcji
z liczbami, linia o braku pływających pikseli.

### Brief od autora

Kolega głównej postaci. Kiedyś bił się po karczmach, teraz **trenuje, żeby
kiedyś stanąć do turnieju na pięści w mieście**. Mieszka u babki — **zielarki
Doroty** — i pomaga jej w ziołach, ale to nie jest zajęcie dla niego. Matka
nie żyje, zmarła na chorobę i **on o tym nie rozmawia**. Ojciec porzucił ich,
kiedy Patryczek był mały.

### Co z tego wynika dla SYLWETKI

- **Młody i solidny, nie umięśniony jak zapaśnik.** Wiejski chłopak, który
  się bije, a nie atleta z areny.
- **Bez broni i bez zbroi** — pięściarz. Podwinięte rękawy albo gołe
  przedramiona są jedyną rzeczą, która przy 32 px powie „ten się bije".
- ⚠ **Ramiona na GÓRNYM końcu pasma 90-95%**, odwrotnie niż Anna (80-85%,
  żeby czytała się szczupło). To jest ta sama zasada użyta w drugą stronę:
  różnica sylwetki wyrażona WEWNĄTRZ ustalonych proporcji, nie przez ich
  porzucenie.

### Prompt (Image 1 = zdjęcie twarzy)

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already produced several accepted village NPCs for this
game — keep the same overall approach.

Input image role: HIGH-FIDELITY IDENTITY REFERENCE. The attached photo is
a real person. Preserve broad character identity only — approximate age,
face shape, hair colour and hair length, general build. Do NOT preserve
the photographic rendering or the modern clothing: convert the reference
into a simple game sprite wearing the medieval village clothing described
below. Do NOT attempt a portrait likeness at this resolution; only broad,
readable traits survive at this size.

Create one full-body south-facing / front-facing character anchor on a
32x64 canvas.

Camera and pose (earlier generations for this game failed here — be strict):
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned
- shoulders square to camera, both eyes equally visible, nose centered on
  the vertical axis
- neutral upright STANDING pose, at ease, arms relaxed at sides
- NOT a fighting stance, NOT fists raised, NOT mid-action — the fighting
  is who he is, not what he is doing in this frame
- feet slightly apart

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- lower fidelity than the reference
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface — no more than 3 tones on any single material
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- every filled shape must be a single closed region fully enclosed by the
  outline — no stray or floating pixel fragments
- designed to fit cleanly inside future 32x64 animation cells

Body-proportion language (he is the SOLID, broad-shouldered one of this
cast — but he must still belong to it):
- head ~ 32% of total height, within this game's 30-40% band
- shoulders ~ 95% of canvas width — the TOP of the 90-95% range used for
  the other villagers, so he reads heavier-set than them
- a young man's build: compact and sturdy, NOT a bodybuilder, NOT
  anatomical, NOT heroic-proportioned — still chunky, simple-shaped pixel
  art like the rest of this cast

Composition:
- exactly one full-body character, nothing else in frame
- centered, full body visible, at least 2 px of empty background on every
  side; the character outline must never touch the canvas edge
- no held weapons, tools or props of any kind; no worn or slung gear
- NO other objects anywhere in frame: no furniture, no ground shadow, no
  decoration, nothing the character touches or stands against —
  silhouette fully isolated from everything else, this matters more than
  any other constraint here

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the background
  — zero noise, zero grain, zero vignette, zero gradient, zero dithering
  or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a young man, about 20 years old, living in a small medieval village.
  Short cropped hair. Lean and sturdy — a village lad who fights with his
  fists, not a trained soldier and not a muscular arena athlete.
  Plain peasant clothing: a simple linen shirt with the SLEEVES ROLLED UP
  to the elbow showing bare forearms, plain wool trousers, worn simple
  shoes or wrapped feet. Optionally a strip of cloth wrapped around the
  knuckles of one or both hands.
  He is NOT a knight, NOT a guard, NOT a fantasy fighter: no armour, no
  helmet, no shield, no sword, no cloak, no jewellery, no ornate trim,
  no insignia.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - linen shirt: #694936, #8D6D4F, #B1956B, #D5C08B, #F9ECAD
  - wool trousers / belt: #4D241C, #673E2C, #825C3F, #9C7D55, #B6A16E
  - dark accents / shoes / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate short-hair ramp (2-3 tones, warm dark brown) not drawn from
    the lists above — skin and hair are their own materials and do not
    need to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

### Materiał na dialogi (z briefu, jeszcze nienapisany)

Cztery wątki, w kolejności od najlżejszego:

1. **Turniej na pięści w mieście** — jego cel, i jedyna rzecz, o której mówi
   z własnej woli. Zahacza o `BLACKSMITH.topics.miasto` („cztery dni wozem"),
   więc miasto zbiera już trzeci głos: kowal (wozy), Anna (targ), Patryczek
   (turniej). ⚠ Nadal **nikt tam nie był i nikt go nie opisuje** — reguła
   z `swiat.md` o łańcuchach kończących się bez odpowiedzi obowiązuje.
2. **Karczmy** — przeszłość, z której już wyrósł, ale która tłumaczy, skąd
   umie się bić i dlaczego może uczyć.
3. **Babka i zioła** — pomaga Dorocie, ale to nie dla niego. Naturalne
   odesłanie w OBIE strony: on wspomina o niej, ona o nim.
4. **Rodzice** — matka zmarła na chorobę i **on tego tematu nie podejmuje**,
   ojciec odszedł, gdy był mały. ⚠ To jest materiał na temat, który
   **odmawia odpowiedzi**, a nie na wyznanie: `swiat.md` ma już dwa takie
   (most, `a_ty` Myśliwego) i to jest sprawdzony chwyt tego świata. Zwłaszcza
   że ojciec gracza ODSZEDŁ NA WOJNĘ I WRÓCIŁ, a ojciec Patryczka po prostu
   zniknął — dwa różne rodzaje nieobecnego ojca, tuż obok siebie.

### Uraz — dlaczego Patryczek sam się tym nie zajmie

Autor poprosił o drobny uraz z bójki w karczmie: nic groźnego, ale na jakiś
czas wykluczające z walki. Zamysł jest słuszny — bez tego pierwsze pytanie
gracza brzmi „skoro umiesz się bić, to czemu ja mam iść". Trzy rzeczy
trzeba było przy tym rozstrzygnąć.

**1. ⚠ Nie może to być ramię, bo ramię jest już zajęte — i to mocno.**
`MERCHANT.topics.ramie` daje Myśliwemu rozszarpane ramię („Zabrał mi kawał
ramienia i odszedł — nie uciekł, odszedł"), Sołtys się na nie powołuje
(„a ten leży z rozerwanym ramieniem"), i **to ono otwiera cały kręgosłup
pytań** (`ramie → szary → czemu_zszedl → gestwina → most`). Drugi mężczyzna
we wsi wyłączony z akcji rannym ramieniem czytałby się jak chwyt scenarzysty,
a nie jak życie. Rejestr musi być odwrotny w każdym calu:

|  | Myśliwy | Patryczek |
|---|---|---|
| przyczyna | wilk, przy pracy | **własna głupota, po pijaku** |
| waga | poważny, definiujący | drobny, przejściowy |
| ton | tragiczny, godny | **zawstydzający** |
| rola w fabule | otwiera główny wątek | tylko tłumaczy, czemu nie idzie sam |

**2. Uraz musi wykluczać WALKĘ, ale nie NAUCZANIE.** To jest wymóg, którego
brief nie mówi wprost, ale wynika z jego roli: jeśli Patryczek ma uczyć
gracza, nie może być unieruchomiony. Złamana noga albo żebra wykluczają
jedno i drugie.

**3. Stąd: ZŁAMANA RĘKA — konkretnie kostka/śródręcze.** To jest prawdziwa
i najbardziej typowa kontuzja gołych pięści (tzw. złamanie boksera dotyczy
V kości śródręcza i bierze się dokładnie ze źle trafionego ciosu). Spełnia
wszystko naraz:

- bierze się **z tego, jak on walczy** — więc go charakteryzuje, a nie tylko
  odstawia na bok,
- goi się i jest przejściowa („nic groźnego"),
- w łubkach nadal można poprawiać komuś postawę, trzymać łapy i mówić, co
  robi źle — **trenować da się jedną ręką**, bić się nie,
- i jest **wstydliwa**: on nie złamał jej przegrywając. Złamał ją na czymś,
  co nie było człowiekiem — chybił i trafił w słup. Bohaterstwa zero, co
  jest dokładnym przeciwieństwem wilka Myśliwego.

**Efekt uboczny, który domyka postać:** właśnie dlatego siedzi u babki i
mieli zioła. Nie może trenować, więc robi to, czego nie znosi — a to
zamienia „pomaga babci, ale to nie dla niego" z tła w **bieżącą sytuację**.

⚠ **Dorota jest tą, która mu tę rękę złożyła.** Jej pierwszy temat mówi
wprost, czym się zajmuje: „na ranę krwawnik i czysta szmata, na poród moje
dwie ręce". Wnuk w łubkach jest jej robotą i to spina obie postacie bez
jednej nowej mechaniki.

### Szkic tematu (do dopracowania przy wpinaniu)

```
id: "reka"
q: "Co masz z tą ręką?"
a: "Złamana. Kostka, o tu. I zanim zapytasz — nie, nie w walce. Znaczy
    w walce, ale nie o człowieka. Zamachnąłem się, chłop się schylił, a za
    nim był słup. Słup wygrał. Babka mi to złożyła i owiązała, i powiedziała
    dokładnie jedno zdanie, którego ci nie powtórzę. Sześć tygodni.
    Sześć tygodni, i wtedy wracam."
```

⚠ Przy pisaniu reszty: on **nie ma prosić gracza o pomstę ani o załatwienie
sprawy za niego**. Cała treść urazu to „nie mogę teraz, więc uczę" — jeśli
zamieni się w zlecenie zemsty na kimś z karczmy, przestaje być drobny.

---

## Ostatnia czwórka placeholderów — Witek, Sobek, Agata, Dobrawa (2026-08-20)

Po Gniewku/Hannie/Sulisławie/Kubie zostały dokładnie **cztery** postacie z
`wioska_plan.md` §6, które nadal renderują się na wspólnym `NPC.png` z samym
`tint` (zweryfikowane grepem po `portraitTexture:` w `GameConfig.ts` — Witek,
Agata, Dobrawa i Sobek są jedynymi czterema blokami NPC bez tego pola).
Cztery gotowe prompty niżej, ten sam szkielet co Zofia/Gniewko/Hanna (front-
fix + blok proporcji), referencje stylu z tabeli w sekcji „Referencja stylu
na osobę" wyżej, palety zbudowane z `docs/paleta.json`. Kolejność bez
znaczenia; jak zwykle jeden prompt = jedno zapytanie = jeden obrazek zapisany
jako `public/assets/<imię>.png`.

⚠ **Cała czwórka zrobiona tego samego dnia** (patrz „Stan: gotowe, wpięte"
pod każdym promptem niżej) — Witek, Sobek, Agata i Dobrawa. Tym samym cała
ósemka z `wioska_plan.md` §6 ma już własną twarz.

Po wygenerowaniu każdego: ten sam krok co zawsze — bounding-box flood-
fillem, jawna/wykryta tabela przekolorowania (skóra/włosy własną domeną,
tak jak Kuba/Hanna, bo obie postacie mają jasne włosy blisko palety otoczenia
— sprawdzić przy każdej z osobna, nie zakładać z góry), zapis do
`public/assets/characters/<imię>_portrait.png`, `tools/build_<imię>.py` wzorem
`build_hanna.py`/`build_gniewko.py`, dopisanie `portraitTexture` + `scale` w
`GameConfig.ts`, `ASSETS.<imię>` + ładowanie w `BootScene`.

### Witek (44, lniarz) — referencja `peasant.png`

Paleta: tunika ze zgaszonej, mglistej szarości `kamień` (nie `drewno`/
`piasek` — te są ciepłe, a `WITEK.tint` = `0x9aa88c` jest wyraźnie zimny/
zzieleniały, „przygaszony len"), rękawy i dół zmoczone i pociemniałe od
mokrzenia w sadzawce z `kora` (ciemny, mętny brąz — nie `neutralne`, żeby
plama czytała się jako mokra tkanina, nie jak cień), pas/buty/kontur
z `neutralne`.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND PROPORTION reference only, NOT identity. The
attached image (an adult male village farmer character) shows the target
fidelity level, outline weight, shading style, and body proportions for a
grown man in this exact art style. Do NOT reuse his face, his hairstyle,
or his clothing — generate a DIFFERENT adult man character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held tools, no held bundle of flax, nothing in his hands — effects
  and props live in separate sheets only, character must be fully
  isolated from anything it could be holding or standing next to
- NO other objects anywhere in frame: no pond, no flax bundles, no
  ground shadow — silhouette fully isolated from everything else, this
  matters more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Rolnik) — a
  standard sturdy adult male build, but with a slight stoop/forward tilt
  through the shoulders, as someone who bends over a retting pond all day.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a flax grower in his mid-forties from a small medieval farming village,
  the only person there who processes flax from field to cloth. Weathered
  face, slightly stooped posture from constant bending over water. A
  coarse, muted grey-green homespun tunic, with the sleeves and lower hem
  soaked and stained noticeably darker than the rest of the garment — the
  visible result of working flax retting-ponds. No jewelry, no
  ornamentation, nothing that reads as well-off. Hands empty at his sides.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - tunic (dry areas, muted grey-green flax homespun): #494A57, #646775,
    #7F8692, #9CA6B0
  - sleeves / lower hem (soaked, stained dark from the retting pond):
    #351A1A, #472B27, #5A3F35, #6C5545
  - belt / boots / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate hair ramp (2-3 tones, plain brown, short) not drawn from the
    lists above — skin and hair are their own material, they do not need
    to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

#### Stan: gotowe, wpięte (2026-08-20)

Wyszło czysto za pierwszym razem: front na wprost, ręce puste, zero obcych
obiektów w kadrze, tunika czytelnie szaro-zielona z pociemniałymi rękawami/
dołem/pasem/butami. `witek.png` (50×102).

`tools/build_witek.py` liczy bounding-box flood-fillem (x1-48, y8-94, 48×87)
— **włosy NIE dostały własnej domeny koloru, tak jak u Gniewki, nie jak u
Kuby**: tunika jest chłodna (szaro-zielona), więc zmierzony brąz włosów
(`#5b3d31`) trafia najbliższym sąsiadem niemal dokładnie w `kora[2]`
(`#5a3f35`, odległość ~21 na RGB) bez kolizji z niczym sąsiadującym. Tylko
skóra dostała własną, ciasną rampę (3 tony). Wynik: **100% pikseli trafia
dokładnie w tabelę**, 13 kolorów wyjściowych, zero spoza palety.

Wpięte: `public/assets/characters/witek_portrait.png`, `ASSETS.witek`,
`WITEK.portraitTexture = "witek-portrait"`, `scale: 0.76` (66/87, ta sama
metoda co u Hanny/Gniewki). `tsc --noEmit` czysty. ⚠ **Nie zweryfikowane
zrzutem ekranu z żywej gry w tej sesji** — Browser pane nie skompilował
klatki (`Framebuffer status: Incomplete Attachment`, ten sam, udokumentowany
już wcześniej w tym repo problem — silnik nie wystartował ani jednej sceny),
więc to wpięcie stoi na tych samych podstawach co reszta ósemki: czysty
crop, 100% trafień w paletę, poprawna struktura kodu identyczna z już
działającymi Hanną/Gniewką/Sulisławem — ale nie obejrzane na żywej mapie.

---

### Sobek (38, stolarz) — referencja `peasant.png`

Paleta: fartuch skórzany z `drewno` (ta sama rampa co u innych rzemieślniczych
skór), tunika pod spodem jaśniejsza z `piasek`, wióry na ramionach/
przedramionach jako mały ciepły akcent z `akcent_zlocisty` (jasne, świeże
drewno — kontrastuje z ciemniejszym fartuchem), pas/buty/kontur z `neutralne`.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE AND PROPORTION reference only, NOT identity. The
attached image (an adult male village farmer character) shows the target
fidelity level, outline weight, shading style, and body proportions for a
grown man in this exact art style. Do NOT reuse his face, his hairstyle,
or his clothing — generate a DIFFERENT adult man character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held tools, no held wood, no workbench — effects and props live in
  separate sheets only, character must be fully isolated from anything
  it could be holding or standing against
- NO other objects anywhere in frame: no workbench, no planks, no ground
  shadow — silhouette fully isolated from everything else, this matters
  more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Rolnik) — sturdy,
  broad-shouldered build, standing solidly.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a carpenter in his late thirties from a small medieval village, sturdy
  build, standing at ease. A worn leather apron over a plainer linen
  tunic, with a scatter of pale wood shavings caught on his shoulders and
  forearms (small texture detail, not held objects). No jewelry, no
  ornamentation, nothing that reads as well-off. Hands empty at his
  sides, not mid-task.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - leather apron: #49231D, #623B2D, #7B573F, #947654, #AC976C
  - tunic (under the apron, plainer and lighter): #694936, #8D6D4F,
    #B1956B, #D5C08B
  - wood-shaving accent (small patches on shoulders/forearms only):
    #BC9A29, #ECC846, #FFDF61
  - belt / boots / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate hair ramp (2-3 tones, plain brown, short) not drawn from the
    lists above — skin and hair are their own material, they do not need
    to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

#### Stan: gotowe, wpięte (2026-08-20)

Wyszło czysto za pierwszym razem: front na wprost, ręce puste, fartuch
skórzany wyraźnie ciemniejszy od tuniki pod spodem, złociste wióry widoczne
jako drobne plamki na obu ramionach i przedramionach. `sobek.png` (51×103).

`tools/build_sobek.py` liczy bounding-box flood-fillem (x1-48, y8-94, 48×87
— ten sam rozmiar co Witek). ⚠ **Tu, w odróżnieniu od Witka/Gniewki, sama
odległość RGB nie wystarczała**: czysty najbliższy-sąsiad po całej
zadeklarowanej palecie naraz wciskał dominujący brąz fartucha (#79422e,
402px) w `piasek[0]` (dystans 369) zamiast w `drewno` (579) — matematycznie
bliżej, ale to scalałoby fartuch skórzany z lnianą tuniką w jedną rampę i
kasowało kontrast, o który chodziło w prompcie. Każdy zmierzony kolor został
więc najpierw przypisany do ROLI po pozycji w kadrze (fartuch środek klatki,
tunika/rękawy szeroko po bokach, spodnie nisko, buty na samym dole, włosy
wąski pasek na czubku głowy, skóra rozproszona po twarzy i ramionach),
dopiero potem snapowany do najbliższego tonu WEWNĄTRZ przypisanej rampy.
Włosy znów bez własnej domeny (dzielą `drewno` z fartuchem/butami, zero
kolizji — inne miejsce kadru). Tylko skóra dostała własną, ciasną rampę.
Wynik: **100% pikseli trafia dokładnie w tabelę**, 15 kolorów wyjściowych,
zero spoza palety.

Wpięte: `public/assets/characters/sobek_portrait.png`, `ASSETS.sobek`,
`SOBEK.portraitTexture = "sobek-portrait"`, `scale: 0.76` (66/87, ta sama
metoda co u Witka/Hanny/Gniewki). `tsc --noEmit` czysty. ⚠ **Nie
zweryfikowane zrzutem ekranu z żywej gry w tej sesji** — ten sam,
udokumentowany problem z Browser pane co przy Witku (`Framebuffer status:
Incomplete Attachment`, silnik nie wystartował żadnej sceny).

---

### Agata (43, kowalowa) — referencja `mother.png`

Paleta: suknia w ochrze z `piasek` (środkowe/ciemniejsze tony — cieplejsza
i ciemniejsza niż fartuch Hanny), fartuch i chusta osmalone sadzą z
`neutralne` (ciemna szarość zamiast czerni, żeby nie zlało się z konturem),
kontur/buty też z `neutralne`. Sylwetka standardowa jak Hanna, NIE
szczuplejsza — to nie wdowa ani nastolatka.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE reference only, NOT identity. The attached image
(an adult village woman character) shows the target fidelity level,
outline weight, shading style, and body proportions for a grown woman in
this exact art style. Do NOT reuse her face, her hairstyle, or her
clothing — generate a DIFFERENT adult woman character in the same
rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, at ease, not mid-task
- no held tools, no held items, no anvil, no forge — effects and props
  live in separate sheets only, character must be fully isolated from
  anything it could be holding or standing against
- NO other objects anywhere in frame: no forge, no anvil, no ground
  shadow — silhouette fully isolated from everything else, this matters
  more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Mama, Hanna) —
  sturdy and healthy build, NOT leaner, NOT frail.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a blacksmith's wife in her early forties from a small medieval village,
  sharp and businesslike in bearing, not soft or timid. A dark headscarf
  covering all her hair, and a soot-marked apron (visible dark smudges
  and streaks, not a uniform dye) worn over an ochre-toned dress. No
  jewelry, no ornamentation. Hands empty at her sides, not mid-task.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - dress (ochre): #8D6D4F, #B1956B, #D5C08B, #F9ECAD
  - apron and headscarf (soot-marked dark grey, with visible darker smudge
    patches on the apron): #12101A, #2B2A36, #4A4956, #75737F
  - boots / outline: #12101A, #2B2A36, #4A4956
  - pick ONE separate small warm skin-tone ramp (2-3 tones) and ONE
    separate hair ramp (2-3 tones, plain dark brown, fully covered by the
    headscarf except perhaps one strand) not drawn from the lists above —
    skin and hair are their own material, they do not need to match the
    environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

#### Stan: gotowe, wpięte (2026-08-20)

Wyszło czysto za pierwszym razem: front na wprost, ręce puste, ciemna chusta
zakrywa włosy poza jednym kosmykiem na czole, fartuch osmalony sadzą nad
suknią w ochrze widoczną na rękawach i dole. `agata.png` (50×105).

`tools/build_agata.py` liczy bounding-box flood-fillem (x1-47, y9-95,
47×87). ⚠ **W odróżnieniu od Sobka, tu czysty najbliższy-sąsiad po całej
palecie naraz zadziałał od razu poprawnie** — chusta/fartuch (chłodna
szarość) i suknia (ciepła ochra) mają na tyle różne odcienie, że żaden
zmierzony kolor nie trafia w niewłaściwą rampę bez dzielenia po pozycji.
Kosmyk włosów (4 tony, wąski pasek na czubku głowy) trafia najbliższym
sąsiadem w `piasek` — tę samą rampę co suknia — bez kolizji, bo leży w
zupełnie innym miejscu kadru. Tylko skóra dostała własną, ciasną rampę (3
tony). Wynik: **100% pikseli trafia dokładnie w tabelę**, 11 kolorów
wyjściowych, zero spoza palety.

Wpięte: `public/assets/characters/agata_portrait.png`, `ASSETS.agata`,
`AGATA.portraitTexture = "agata-portrait"`, `scale: 0.76` (66/87, ta sama
metoda co u Sobka/Witka/Hanny). `tsc --noEmit` czysty. ⚠ **Nie
zweryfikowane zrzutem ekranu z żywej gry w tej sesji** — ten sam,
udokumentowany problem z Browser pane co przy Witku/Sobku (`Framebuffer
status: Incomplete Attachment`, silnik nie wystartował żadnej sceny).

---

### Dobrawa (19, dziewczyna bez własnej bazy) — referencja `mother.png`

⚠ **Jedyna z ósemki bez naturalnego wzorca proporcji/wieku w istniejącym
zestawie** (`wioska_plan.md` §6.1 sam to nazywa) — `mother.png` daje styl
kobiecej sylwetki, ale blok proporcji musi jawnie ciągnąć ją MŁODZIEJ i
SZCZUPLEJ niż Hanna/Agata, żeby nie wyszła jako trzecia kopia tej samej
zamężnej gospodyni. Paleta: kirtel w jasnej zieleni z `listowie` (jaśniejsze
tony — nie ciemna leśna zieleń), włosy w jednym warkoczu jako własna rampa
(BEZ chusty — jedyna z ósemki, u której włosy są głównym elementem twarzy),
kontur/buty z `neutralne`.

```
Intended use: create a lower-fidelity production sprite anchor for a
top-down 2D game. This exact process (Gemini generation -> programmatic
crop + recolor) already worked for several other village NPCs — keep the
same overall approach.

Input image role: STYLE reference only, NOT identity, and NOT age. The
attached image (an adult village woman character) shows the target
fidelity level, outline weight, and shading style for this exact art
style. Do NOT reuse her face, her age, her hairstyle, or her clothing —
generate a DIFFERENT, notably YOUNGER character (a nineteen-year-old
woman, not a mature adult) in the same rendering style and fidelity level.

Create one full-body south-facing / front-facing character anchor on a
50x102 canvas, generous margin on all sides.

Style target:
- polished 16-bit / early 32-bit JRPG character sprite style
- crisp chunky pixel art, HARD pixel edges — no anti-aliasing, no soft
  blur, no smooth/airbrushed gradients anywhere, including the outline
- flat cel-shading only: exactly 2-3 solid, sharply-bordered color bands
  per surface (base tone + one shadow tone + optional highlight tone)
- dark outline clusters: ONE consistent near-black outline color, uniform
  1px stroke, used only as an outline, never blended into interior shading
- readable silhouette, designed to fit cleanly inside future 32x64
  animation cells

Composition:
- exactly one full-body character, nothing else in frame
- camera-straight, perfectly symmetrical FRONT view — NOT a three-quarter
  view, NOT angled, NOT turned to either side; both shoulders equally
  visible and level, face and chest pointed directly at the viewer
- facing screen/front/south, centered, full body visible
- neutral upright standing pose, hands clasped loosely in front of her,
  not mid-task
- no held tools, no held items — effects and props live in separate
  sheets only, character must be fully isolated from anything it could
  be holding or standing against
- NO other objects anywhere in frame: no fence, no basket, no ground
  shadow — silhouette fully isolated from everything else, this matters
  more than any other constraint here
- every filled shape must be a single closed region fully enclosed by
  the outline — no stray or floating pixel fragments

Body-proportion language:
- head ≈ 30-40% of total height, shoulders ≈ 90-95% of canvas width —
  compact, chunky, NOT slender/anatomical, matching the other villagers
  already made for this game (Kowal, Myśliwy, Sołtys, Mama) — but
  noticeably SLIGHTER and YOUNGER than the mature women already made
  (Mama, Hanna, Agata): a narrower frame overall, the silhouette must
  read as clearly the youngest adult in the cast. Still compact and
  chunky in the pixel-art sense (large simple head, no anatomical
  slenderness) — younger and slighter is a proportion/scale change, not
  a shift toward realistic anatomy.

Background:
- exact flat #00FF00, perfectly uniform hex across 100% of the
  background — zero noise, zero grain, zero vignette, zero gradient,
  zero dithering or speckle of any kind
- fully opaque, no transparency
- no shadow, no ground contact mark under the character

Character identity:
- a village girl of nineteen from a small medieval farming village, the
  youngest adult in the village. Unmarried — NO headscarf, hair worn in
  a single visible braid down her back or over one shoulder. A simple
  light green kirtle/dress, plain and undecorated, no apron. No jewelry,
  no ornamentation. Hands clasped loosely in front of her, relaxed,
  approachable posture rather than a working stance.

Restrictive constraints (the prompt-discipline lever):
- deliberately simple 16-bit era pixel art, low fidelity
- chunky readable silhouette, compact body proportions, large simple head
- STRICT palette — use ONLY these hex colors, or the single closest one
  from this list; do not introduce any hue not represented here:
  - kirtle (light, undyed-green wool): #245A38, #347138, #568847, #809F5D
  - trim / boots / outline: #12101A, #2B2A36, #4A4956, #75737F
  - pick ONE separate small warm skin-tone ramp (2-3 tones, youthful, not
    weathered) and ONE separate hair ramp (2-3 tones, plain brown, in a
    single braid) not drawn from the lists above — skin and hair are
    their own material, they do not need to match the environment palette
- big pixel clusters, no dithering, no noise texture
- no ornate trim, no tiny accessories, no jewelry
```

#### Stan: gotowe, wpięte (2026-08-20)

Wyszło czysto za pierwszym razem: front na wprost, ręce splecione, bez
chusty, pojedynczy warkocz przez ramię, wyraźnie węższa/młodsza sylwetka niż
reszta ósemki. `dobrawa.png` (47×97).

⚠ **Tu złapany REALNY BŁĄD w metodzie używanej od Gniewki**, nie tylko w
tej jednej postaci. `tools/build_dobrawa.py` najpierw liczył bounding-box
starym dwuetapowym usuwaniem zieleni (flood-fill + „resztki po nasyceniu",
`g>140 & g>r+30 & g>b+30`) — i ten drugi warunek **zjadł całą spódnicę**:
jasnozielony kirtel (`#8fb771`, 551px, największa pojedyncza plama w całym
obrazku) też ma G wyraźnie dominujące nad R i B, więc heurystyka trafna dla
izolowanych resztek czystej zieleni w szczelinach okazała się fałszywie
pozytywna dla całego jasnego ubrania. Na podglądzie czytało się to jak
**biała suknia** (przezroczystość renderowana na białym tle podglądu), nie
jak zielona — i sam `Counter` na już przyciętej klatce nic nie pokazywał,
bo brakujących pikseli po prostu nie było na liście. Złapane dopiero przez
**spróbkowanie surowych pikseli** w miejscu, które na oko wyglądało na
białe. Naprawa: usunięta heurystyka po nasyceniu, w jej miejsce jeden,
ciasny próg odległości do konkretnego koloru tła (`suma |różnic| < 60` na
drugim przebiegu) — złapał prawdziwe resztki (odległe o kilka-kilkanaście)
i zostawił kirtel (odległy o ~310) w spokoju. **Wniosek na przyszłość:
jasne/pastelowe ubrania w zielono-żółtych odcieniach trzeba sprawdzać PRZED
budową tabeli przez spróbkowanie surowych pikseli w środku dużej plamy
koloru, nie tylko przez czytanie Countera na już przyciętej klatce.**

`tools/build_dobrawa.py` (po poprawce) liczy bounding-box x4-41, y8-88 —
**38×81, wyraźnie węższy niż Witek/Sobek/Agata (47-48px)**, zgodnie z
promptem. Włosy/warkocz/buty dzielą jedną rampę (`drewno`) — to dosłownie
ten sam materiał w dwóch miejscach kadru (warkocz biegnie całym bokiem
sylwetki od głowy do butów), więc nie da się ich rozdzielić po pozycji.
Tylko skóra dostała własną, ciasną rampę (3 tony). Wynik: **100% pikseli
trafia dokładnie w tabelę**, 12 kolorów wyjściowych, zero spoza palety.

Wpięte: `public/assets/characters/dobrawa_portrait.png`, `ASSETS.dobrawa`,
`DOBRAWA.portraitTexture = "dobrawa-portrait"`, `scale: 0.81` (66/81 — wyżej
niż reszty ósemki, bo jej portret jest niższy). `tsc --noEmit` czysty. ⚠
**Nie zweryfikowane zrzutem ekranu z żywej gry w tej sesji** — ten sam,
udokumentowany problem z Browser pane co przy Witku/Sobku/Agacie
(`Framebuffer status: Incomplete Attachment`, silnik nie wystartował żadnej
sceny).

**Tym samym cała ósemka z `wioska_plan.md` §6 ma już własną twarz**: Kuba,
Sulisław, Gniewko, Hanna (2026-08-18), Witek, Sobek, Agata, Dobrawa
(2026-08-20). Żaden mieszkaniec wioski nie renderuje się już na wspólnym
`NPC.png` z samym `tint` — `tint` zostaje wyłącznie jako awaryjny fallback
na każdym z nich.

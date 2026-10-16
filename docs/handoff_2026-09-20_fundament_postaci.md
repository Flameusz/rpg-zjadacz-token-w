---
typ: HISTORIA
domena: [assets, proces]
tytul: Handoff — fundament postaci 3D, po etapach A1, A4 i A2
stan: zamkniety
kotwice:
  - tools/char3d_base.py
  - tools/char3d_walk.py
  - tools/char3d_chod.py
  - src/render3d/Character3D.ts
otwarte: [OI-134, OI-138]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Handoff — fundament postaci 3D (po A1, A4 i A2)

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. Fundament rigu i chodu A1–A6; stan postaci 3D: `docs/postac3d_checkpoint.md`.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> Dokument wejściowy dla NOWEJ sesji. Nie jest poradnikiem projektu — zawiera
> wyłącznie to, co potrzebne, żeby kontynuować pracę nad **fundamentem postaci**.
> Stan postaci 3D dziś: `docs/postac3d_checkpoint.md`; historia etapów: `docs/postac3d_historia.md`
> (⚠ zawiera błędy — patrz §6).

---

## 1. Stan faktyczny po A1, A4 i A2

**A1, A4, A2 i A5 ZROBIONE i zweryfikowane** (A5 → §3g). **`MODEL BASE = LOCKED`** (§3f). Następny etap: **wyposażenie**.

A1 i A4 weszły wyłącznie do `tools/char3d_base.py`. **A2 dołożyło
`tools/char3d_walk.py`** (nowy generator cyklu), przycięło
`char3d_walk_lean.py` i **jako pierwsze ruszyło `src/`** —
`src/render3d/Character3D.ts` dzieli teraz klip chodu na pętlę i pozę
bezruchu. `char.glb` ma **645 908 B**.

Stan bramek po A2:

| bramka | wynik |
|---|---|
| `npx tsc --noEmit` | czysto |
| `npm run build` | czysto |
| `char3d_sprawdz_bron.py` | **27** linii błędu; broni zamiatających grunt **1** (przed A2: 3) |
| `char3d_sprawdz_tarcze.py` | 2/2 OK, żadna nie zamiata gruntu |
| asercje cyklu (`char3d_walk.sprawdz`) | OK — zasięg, przeprost, symetria, pętla, oderwanie, bezruch |
| asercja pozy stojącej | 12 552 pozycje, max 1,42e-04 j., zero powyżej 5e-4 |
| eksport glTF | 9 klipów, bez błędu |
| żywa gra | `dev.missing` puste, `load.totalFailed` = 0 |
| idempotencja | drugi `--zapisz` → **0,00e+00** różnicy |

⚠ **26 z 27 błędów broni to „brak modelu 3D dla broni z `GameConfig`"**
(katalog ma 37 konstrukcji, modeli jest 11) — stan zastany, osobny temat
`OI-109`. Dwudziesty siódmy to `OI-136`.

---

## 2. A1 — dokładny zakres zmiany

**Problem (zmierzony, nie domniemany):** łańcuch IK ręki był w pozie
spoczynkowej **idealnie współliniowy** — bark, łokieć, ogniwo i nadgarstek na
tym samym Y (0,03) i Z (−2,02). Solver LEGACY nie ma wtedy przesłanki, w którą
stronę zgiąć staw, i **nie zginał go wcale**: kąt łokcia 180,0° na każdej
klatce każdego klipu, niezależnie od tego, gdzie postawić cel IK (testowane do
60% zasięgu — dłoń i tak lądowała na 100%). Noga problemu nie miała, bo ma
wbudowane wstępne zgięcie (kolano wysunięte 0,25 j. przy nodze 5,25 j. = 4,8%).

**Zmiana — trzy miejsca w `tools/char3d_base.py`:**

1. nowy, **żywy** klucz w `PROPORCJE`: `"lokiec_wysun": 0.012` (ułamek wzrostu);
2. w `_uklad()`, obok `Y_BARK`: `y_lokiec = Y_BARK + u(P["lokiec_wysun"])`
   oraz `y_ogniwo = Y_BARK + u(P["lokiec_wysun"]) * 0.8`;
3. podmiana `Y_BARK` → `y_lokiec`/`y_ogniwo` **wyłącznie w środku łańcucha** —
   `Bone.002_L.001` (ogon), `Bone.002_L.004` (głowa i ogon), `Bone.002_L.002`
   (głowa). Prawa ręka jedzie z lustra `_L`→`_R` (odbicie tylko X).

**Nietknięte (potwierdzone pomiarem, przesunięcie 0,00000 j.):** kość dłoni
`Bone.002_?.003` (head, tail, długość 0,680) · bark `Bone.002_?.001` head ·
`HandIK_?.005` · `Elbow_?.007` (cel biegunowy — **świadomie zostawiony**, ma
własne klucze w akcji `Walk`, a przesunięcie go nic nie daje) · obojczyk
`Bone.002_?` · skala `Armature` 1,6527 · nazwy kości · `roll` · T-poza ·
**cały mesh**.

Jedyny efekt uboczny: kość ramienia 1,6051 → 1,6175 j. (+0,77%, przeciwprostokątna).

### Wyniki PRZED / PO

| miara | przed | po |
|---|---|---|
| łokieć przy celu 100 / 85 / 70% zasięgu | 180,0 / 180,0 / 180,0 | **173,2 / 118,8 / 91,7** |
| łokieć **prawy** w marszu z bronią | 180,0° | **161,4°** |
| łokieć **lewy** w marszu z tarczą | 180,0° | **179,8°** ← patrz niżej |
| atak 1H poza tolerancją | 1 (błąd 1,26) | 1 (błąd **1,00**) |
| atak 2H poza tolerancją | **5** (1,32–3,27) | **2** (1,06–1,20) |
| miecz w marszu, najniższy punkt | −11,94 | **−11,73** (podłoga −11,28) |
| puklerz, przechylenie lica `normal.z` | +0,09 | **+0,01** |

⚠ **Łokieć lewy z tarczą został prosty i to NIE jest wada A1.** Stała
`NIESIENIE_TARCZA_SPOCZYNEK` celuje w punkt na pełnym wyciągnięciu ręki, więc
ręka słusznie jest prosta. A1 sprawia, że **da się** zamówić inaczej —
przestrojenie póz tarczy jest osobnym krokiem, PO A5.

Testowano offsety 0,010 / 0,012 / 0,016 / 0,023 / 0,035 (ułamka wzrostu).
Osobliwość pęka już przy najmniejszym; większe **nie zwiększają** zakresu
zgięcia, za to mocniej obracają dłoń w pozie niesienia (4,0° przy 0,012 vs 8,0°
przy 0,023), czyli mocniej przestrajają `obrot`/`chwyt` ekwipunku.

---

## 3. Co jest ZWERYFIKOWANE POMIAREM (tej sesji)

Wszystko poniżej zmierzone skryptami na żywym `char.blend` (Blender 5.2.1,
`"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"`):

- **Rig.** `ik_solver = LEGACY`. Cztery więzy IK, `chain_count=3`,
  `use_stretch=True`, ale `ik_stretch = 0.00` na **wszystkich** kościach →
  **nic się nie rozciąga**; długość kości w pozie = 100% spoczynkowej. Zero
  blokad, limitów i sztywności. Ustawienia ręki i nogi **identyczne** — różnicę
  robiła wyłącznie geometria spoczynku.
- **Zasięgi (świat):** ręka bark→nadgarstek 3,396 j.; noga biodro→kostka
  5,250 j.; wzrost 12,84 j.; kość dłoni 0,680 j.; skala `Armature` 1,6527.
- **Cele IK w `Walk`** siedzą na 98–108% zasięgu (nie 153–165%, patrz §6).
- **Kolano działa wzorowo:** cel na 100/92/85/78/70% → 180/135/118/104/90°.
- **Chód.** Amplitudy: stopa X 0,12 · **Y 3,07** · Z **0,07**; dłoń Y 2,26 ·
  Z 0,20; miednica Z **0,27**. Cykl to 3 pozy + domknięcie.
- **Widoczność chodu na ekranie** (kamera 15°, bufor 96×128, 8,26 px/j.):
  marsz **w bok 25,4 px** ruchu stopy, marsz **w dół/górę 7,2 px**. Dłoń
  odpowiednio 18,6 / 5,4 px.
- **Sylwetka (poza bezruchu).** Szerokość: barki 5,02 · klatka 5,34 · talia
  5,38 · biodra 5,15 — czyli **prostokąt bez talii**, bo ręce wypełniają
  miejsce, gdzie tors faktycznie się zwęża. Prześwit ręka↔tułów: **0,31 j.
  (2,6 px) przy łokciu, 0,10 j. (0,8 px) przy nadgarstku.**
- **Głowa/barki = 0,56** przy benchmarku z pixel-artowych NPC 0,64–0,71.
- **Skala ekwipunku — poprawna, nie ruszać:** miecz 6,45 j. = 50% wzrostu,
  krótki miecz 36%, puklerz 2,72 j. = 21%, tarcza okuta 42%.
- **W `char.blend` jest JEDNA akcja: `Walk`.** Pozostałe 8 klipów powstaje
  przy eksporcie przez numeryczny solver (`char3d_attack._dopasuj`).
- **Przed A4: 14 z 43 kluczy `PROPORCJE` było martwych.** Po A4 opisowe są
  już tylko dwa, świadomie — patrz §3c.
- **`Enemy.isChasing`** (`src/entities/Enemy.ts:694`) = `!dead && aiState ===
  "chase"`, jedno wejście (`enterChase`), wyjście po `deAggroRange`, śmierci
  gracza albo `targetUnreachable`. `GameScene.ts:2544` czyta to raz na klatkę
  do `Player.wWalce`. **Mechanizm stanu walki jest zrobiony poprawnie.**

## 3b. Co NIE jest zweryfikowane

⚠ **Cztery z pięciu pozycji tej listy zostały zamknięte 2026-09-20 —
patrz §3e.** Zostaje wyłącznie:

- Przechylenie lica tarczy w pozie WALKI (~0,34–0,35) — nie mierzone po A1.
  ⛔ I tak nie ma sensu mierzyć go przed A5: pozy `NIESIENIE_TARCZA_*` idą do
  przestrojenia OD ZERA (§6 pkt 3).

---

## 3c. A4 — ZROBIONE (2026-09-20)

Tabele `tulow` i `noga` w `_cialo()` nie mają już wymiarów wpisanych wprost —
każdy pierścień jest ułamkiem KOTWICY z `PROPORCJE`. Kontrakt opisany
w `tools/CLAUDE.md` (sekcja „Generator postaci").

**12 kluczy ożyło** (sprawdzone: +20% rusza od 14 do 60 wierzchołków):
`klatka_polszer` · `klatka_glebokosc` · `talia_polszer` · `talia_glebokosc` ·
`biodro_polszer` · `biodro_glebokosc` · `szyja_promien` · `krocze` ·
`udo_promien` · `kolano_promien` · `lydka_promien` · `kostka_promien`.

**2 zostają OPISOWE świadomie**, mają to napisane przy sobie w kodzie:
- `masa_kg` — gabaryt wynika z wymiarów; udawana zależność byłaby kolejnym
  polem do pamiętania.
- `bark_polszerokosc` — obrys naramiennika powstaje dziś z `bark_polrozstaw`
  + `ramie_promien`. ⛔ Zrobienie z niego sterownika to **zmiana projektu**
  tabeli `ramie` (wyprowadzenie promienia z różnicy dwóch parametrów), a nie
  przepięcie literału. Kandydat na osobną, świadomą decyzję.

⚠ **`wzrost_m` NIGDY nie był martwy** — audyt policzył go jako martwy przez
regexę szukającą `P["..."]`, a kod używa `P['...']` (linia ~1293). Martwych
było **14**, nie 15.

**Asercja (obie połowy przeszły):**
- siatka + wszystkie kości identyczne, **max różnica 4,77e-07 j.**, zero
  wartości powyżej 1e-6 (833 porównane pozycje);
- każdy z 12 kluczy realnie rusza siatką.

**Bramki po A4 — bez zmian wobec stanu po A1:** `tsc` czysto · broń 29 linii
błędu · tarcze 2/2 OK · atak 1H 1 poza tolerancją (1,00), 2H 2 (1,06/1,20) ·
dwa `--zapisz` pod rząd identyczne · `char.glb` 644 688 B · żywa gra
`dev.missing` puste, `totalFailed` 0. Wartości PROPORCJE zostały przeliczone
na faktyczne wymiary (pierścień kotwiczący ma mnożnik 1,000), więc **liczby
różnią się od poprzednich, a model jest ten sam** — stare opisywały stan
sprzed kilkunastu rund rzeźbienia i po prostu kłamały.

---

## 3d. A2 — ZAMKNIĘTE (2026-09-20)

### Co było nie tak (zmierzone, nie domniemane)

| miara | stary cykl | po A2 |
|---|---|---|
| uniesienie kostki | **0,065 j.** = 0,54 px w buforze 96×128 | **0,70 j.** = 5,6 px |
| bujanie miednicy | 0,268 j. | **0,30 j.** (pierwsza wersja A2 miała 0,42 — obniżone decyzją autora 2026-09-20) |
| noga w kontakcie | **100,8% zasięgu**, kolano **179,8°**, IK gubi cel o 0,043 j. | **97,1–98,2%**, kolano 153–159°, błąd IK **0,0000** |
| czas dwóch kroków | **0,4 s i 0,2 s** (kuśtykanie 2:1) | **0,4 s i 0,4 s** |
| miecz w chodzie (bramka) | 1,71 j. pod stopy | **0,46 j.** (dalej `OI-136`) |
| bramka broni — broni zamiatających grunt | **3** | **1** |

⛔ **„0,07" nie było parametrem do podbicia.** Składało się z trzech kanałów,
z których jeden działał w przeciwną stronę: `FootIK.location[0]` **i** `[2]`
(lokalne osie kości stopy są skośne), a do tego `Bone.005` — korzeń
WSZYSTKICH kontrolek IK — jechał w górę razem z miednicą, więc stopy unosiły
się razem z biodrem i większość uniesienia sama się kasowała.

⛔ **Przy 3 kluczach nie było GDZIE postawić szczytu.** Środek wymachu lewej
nogi wypadał w kluczu 1, prawej w f = 2,5 — gdzie klucza nie ma. Dlatego
poprzednia poprawka musiała szczyt spłaszczyć. Naprzemienny chód wymaga
PARZYSTEJ liczby kluczy.

### Parametry obowiązujące (`char3d_walk.CHOD`)

    polkrok 1,55 · uniesienie 0,70 · bujanie 0,30 · pochylenie_stopy −10°

⚠ **`bujanie` 0,30 to wybór autora z 2026-09-20, nie wynik wyliczenia.**
Pierwsza wersja A2 miała 0,42 — geometrycznie równie poprawną, ale czytającą
się jako za mocne kołysanie. Cena: głowa buja się o **3 px** w buforze gry
zamiast 4, a **zapas zasięgu nogi w kontakcie maleje z ~4 pp do ~2 pp**
(97,1–98,2% wobec granicy 100%, za którą IK przestaje trafiać). Podnosząc
kiedykolwiek `polkrok`, sprawdź ten procent w raporcie — obie liczby dzielą
ten sam budżet.

⚠ **Skutek uboczny obniżenia bujania, zmierzony:** `dodaj_rozchylenie_ramion`
trafia teraz w osobliwy jakobian na WIĘKSZEJ liczbie klatek, więc odsunięcie
nadgarstka o 0,2 j. ląduje na prawej ręce, a na lewej nie —
**asymetria ramion do 0,198 j. (≈1 px na ekranie) na klatkach kontaktu**.
Przy 0,42 obie ręce dostawały to samo (albo obie nic). Poza stojąca i pozy
mijania są dalej symetryczne (0,003 j.). ⛔ Naprawa siedzi w `_przesun`
(tłumiona pseudoodwrotność zamiast pełnej inwersji), czyli poza zakresem
korekty „zmień wyłącznie `bujanie`" — **osobny temat**.

### Układ klatek (obowiązujący)

    0  kontakt A        1  przeniesienie A (prawa stopa w górze)
    2  kontakt B        3  przeniesienie B (lewa stopa w górze)
    4  domknięcie pętli (== 0)        5  POZA BEZRUCHU, poza pętlą

⚠ **Bezruch musiał dostać własną klatkę**, bo w poprawnym cyklu nie ma ani
jednej klatki z obiema stopami płasko i razem. Klip idzie do gry w całości,
a `Character3D.paraKlipow` tnie go `subclip`-em na pętlę 0–4 i zamrożoną pozę
na klatce 5 — **jeden klip na stan wyposażenia**, dwie akcje po stronie
silnika. Zero nowych akcji w Blenderze i w `.glb`.

### Dowód, że poza STOJĄCA się nie zmieniła

`build_char3d_base.sprawdz_bezruch` porównuje **wszystkie wierzchołki
i wszystkie kości** klatki 5 z klatką 1 starej akcji: **12 552 pozycje,
max różnica 1,42e-04 j.**, zero powyżej progu 5e-4. Drugi przebieg
`--zapisz` daje **0,00e+00** — przebudowa jest idempotentna.

⚠ Kontrolki IK porównywane są po HEADZIE. Ich ogon przeskakuje o 3,8 j.
(stary `Walk` trzymał na `HandIK` stały, niezerowy obrót), a więz IK czyta
z nich **wyłącznie pozycję** — porównywanie ogona dawało czerwoną asercję
bez treści.

### Pułapki, które kosztowały osobny obrót

1. ⚠ **`scn.frame_set(f)` MUSI iść PRZED ustawieniem pozy.** Odwrotnie
   przelicza pozę z akcji i kasuje wszystko, co właśnie wpisano — a pomiar
   i tak coś zwraca. Objaw: sześć klatek z IDENTYCZNYMI liczbami.
2. ⚠ **Spoczynek kości stopy to „wzdłuż goleni", nie „płasko".** Stopa
   zostawiona w spoczynku wbijała piętę **0,63 j.** w grunt przy idealnie
   poprawnej kostce; raport cyklu był zielony, złapała to dopiero bramka
   broni. Poziomuje `_wypoziomuj_stope`.
3. ⚠ **Znak pochylenia stopy w powietrzu jest odwrotny od intuicji.** Palce
   w dół (+16°) zjadały prześwit z 5,6 px do 3 px. W połowie wymachu stopa
   ma być zgięta grzbietowo (−10°).
4. ⚠ **Próg asercji nie może być własnym parametrem generatora.** Pierwsza
   wersja warunku „stopa się odrywa" liczyła próg jako `uniesienie × 0,5`,
   więc przy `uniesienie = 0` przechodziła na zielono. Dziś próg jest stały
   (`MIN_ODERWANIE`) i wzięty z widoczności w buforze gry.
5. ⚠ **Zakończony `fadeOut` w three.js WYŁĄCZA akcję** (`enabled = false`),
   a `setEffectiveWeight` na wyłączonej akcji daje zero, cokolwiek się poda.
   Cios wygasza obie akcje pary — bez jawnego `enabled = true` w `krok()`
   postać po pierwszym ciosie wchodziła w bezruch z **sumą wag zero** i
   wracała do pozy spoczynkowej rigu. Zmierzone w grze, naprawione.
6. ⚠ **Obojczyki nie animują się i tak ma zostać.** Stary cykl obracał lewy
   o 11,2° na dwóch klatkach z trzech — czyli **poza stojąca ma dziś jeden
   bark obrócony, a drugi nie**. To wada zastanej pozy, nie chód; A2 przenosi
   ją bez zmian, żeby nie ruszać pozy stojącej. Osobna, świadoma decyzja.

### Czego A2 świadomie NIE ruszało

Mesha · `PROPORCJE` · pozy spoczynkowej rigu · nazw kości · skali `Armature` ·
`roll` · punktów montażowych ekwipunku · `char3d_attack` · **poz niesienia
broni i tarczy** (`NIESIENIE_*`) · rozjazdu dłoni przy broni 2H ·
**poślizgu stopy** (`OI-138`) · `timeScale` klipu.

⛔ **Usunięte jako martwe i wprowadzające w błąd:** `dodaj_wychyl` +
`ORIG_ROT` (wyłączone od dopisku 17, liczyły od tabeli opisującej stary
3-kluczowy cykl) oraz `napraw_wysokosc_kroku` + `_STOPA_POPRAWKA`
(adresowały klatki przez `% 3`). Wychył miednicy żyje dziś
w `char3d_walk.KONTAKT_QUAT`, wysokość stopy jest parametrem.
Usunięty też **turntable** w akcji `Walk` (obrót obiektu co 3 klatki) —
na nowym układzie wypadałby w środku cyklu.

---

## 3e. DOMKNIĘCIE BAZY — cztery sprawdzenia (2026-09-20)

Zamyka listę z §3b. ⛔ **Nie zmieniono ani modelu, ani rigu, ani animacji,
ani `char.glb`** — przymiar leciał bez `--zapisz`. Jedyna zmiana w kodzie
dotyczy PRZYMIARU, nie postaci (punkt 1 niżej).

### 1. Sylwetka po A1 + A2 — PASS

Poza bezruchu jest symetryczna (obie stopy płasko i razem), kontur czyta się
jako humanoid w buforze gry 96×128 i **obok pixel-artowych NPC-ów w żywej
grze** (Rolnik / Hanna / Anna) — to jest standard oceny przyjęty w projekcie,
nie antropometria. Marsz po A2 sylwetki nie psuje.

⚠⚠ **Znaleziony i naprawiony błąd PRZYMIARU, nie postaci.**
`char3d_zones.apply_zones()` robi `frame_set(1)`, a `build_char3d_base.main()`
renderowało arkusz `nowy_*` zaraz po nim, nie ustawiając klatki. Do A2 klatka 1
BYŁA pozą stojącą, więc trafiało w nią przypadkiem; po A2 klatka 1 to
`przeniesienie A` — **nogi w rozkroku, jedna stopa w górze**. Każda ocena
sylwetki z `docs/podglad/nowy_front.png` po A2 dotyczyła więc pozy CHODU.
Raport był przy tym cały czas zielony. Naprawa: jawny `frame_set(BEZRUCH)`
przed `renderuj("nowy")`. Reguła dopisana do `tools/CLAUDE.md`.

Dwie obserwacje NIEBLOKUJĄCE (do odnotowania, nie do naprawy teraz):
asymetria ramion w klatkach kontaktu z §3d (prawy łokieć 137,6° przy lewym
179,7°) jest w renderze gry niewidoczna — ok. 2 px; poza bezruchu jest
symetryczna, bo osobliwy jakobian trafia tam OBA nadgarstki naraz.

### 2. Ramię / łokieć po A1 — PASS, mesh zostaje

Zmierzone na siatce po modyfikatorach, prawa ręka, bezruch vs pięć klatek ciosu
(promień w 85. centylu, 10 plastrów wzdłuż łańcucha):

- **zero zapadnięcia objętości.** Największe odchylenie to −9% tuż za łokciem
  i **jest identyczne we wszystkich klatkach, łącznie z gotowością** — czyli
  nie bierze się ze zginania. W samym zgięciu rozrzut wynosi 1 pp.
- **+17% na pierwszym plastrze w klatce cięcia** to naramiennik dociśnięty do
  klatki piersiowej przy ręce prowadzonej przez ciało, nie deformacja stawu.
- **przenikanie: 1 wierzchołek na 358** przy najciaśniejszym zgięciu 1H.

Profil boczny ramienia przez cały cios pokazuje czysty załom w łokciu, bez
„parówek" i bez wcięcia. ⛔ **Geometria z ośmiu rund rzeźbienia (§6 pkt 2)
NIE przeszkadza** — nie ruszać jej.

### 3. Elbow IK / kierunek zgięcia — PASS, bez zmiany

- Bieguny są **symetryczne** (`pole_angle` −90° po obu stronach) i **statyczne**:
  w akcji `Walk` `Elbow_?.007` ma klucze na wszystkich sześciu klatkach, ale
  **wszystkie w tożsamości** (0,0,0 / 1,0,0,0). Nie ma więc czego stroić per
  klatka i nie ma skąd wziąć niespodzianki.
- **Przemiatanie 44 celów** po całej bryle zasięgu (przód/tył/góra/dół/bok/
  przez ciało × 95/80/60/45% zasięgu): **0 łokci skierowanych do przodu**,
  36 do tyłu, 8 „płaskich". Te 8 to czyste sięgnięcia w płaszczyźnie
  strzałkowej (prosto w przód / prosto w tył), gdzie łokieć poprawnie idzie
  na zewnątrz i w dół (przód) albo na zewnątrz i w górę (tył).
- Kąt łokcia jest **monotoniczny** względem odległości celu (96% → 147°,
  81% → 109°, 61% → 77°, 46% → 56°), **bez przeskoków**, a dłoń trafia w cel
  z błędem 0,01–0,02 j. na każdym z 44 celów.

⚠ Kolana mają bieguny ASYMETRYCZNE (`PoleKnee_L` 0°, `PoleKnee_R` −180°), co
kompensuje `roll`. Kolana mierzone wcześniej działają wzorowo — **nie ruszać**.

### 4. Łokieć podczas ataku — PASS z uwagami

Blender: kąt łokcia 129° (gotowość) → **70°** (zamach) → **78°** (cięcie) →
116° (przeniesienie) → 129°, łokieć skierowany DO TYŁU w każdej klatce 1H.

Żywa gra, prawdziwy bufor 96×128, miecz + puklerz, cios w miejscu i **cios
w marszu**: zamach / cięcie / przeniesienie czytają się, łokieć zgina się
widocznie i w dobrą stronę, **nie ma wejścia w pozę spoczynkową rigu** ani na
początku, ani na końcu. Po ciosie, dalej w marszu,
`Walk_Armed_Shielded|petla` ma wagę **1** — dawny błąd „suma wag zero"
(§3d pułapka 5) pozostaje naprawiony.

Znane, NIEBLOKUJĄCE (wszystkie zastane i opisane gdzie indziej): `_sprawdz`
zgłasza 1 pozę poza tolerancją dla 1H (cięcie, 1,00) i 2 dla 2H — to cele
wpisane POZA zasięgiem ramienia, ścinane przez solver, wizualnie poprawne ·
ostrze schodzi pod stopy w marszu (`OI-136`) · puklerz w bezruchu siedzi na
brzuchu (`NIESIENIE_TARCZA_SPOCZYNEK`, do przestrojenia po A5) · w ciosie nie
uczestniczy lewa ręka ani nogi (treść animacji, późniejszy etap).

### Werdykt

**BAZA HUMANOIDA: READY.** Kolejny krok bez zmian: **A5**.

---

## 3f. MODEL BASE = LOCKED (2026-09-20)

Decyzja autora po osobnym review „czy baza jest dobrym DONOREM pod wyposażoną
postać". **Zamknięte BEZ ZMIAN geometrii.** ⛔ Nie wracamy do proporcji, barków,
bioder, nóg ani głowy. Dalsze prace: wyposażenie, pancerz, broń, tarcza,
animacja, rigging, materiały, detal.

### Co rozstrzygnęło — pomiar na tym, co rysuje gra

Cztery sylwetki w IDENTYCZNEJ skali ekranowej (gracz 69 px, NPC 64–66 px),
mierzone pasmami wysokości, nie maksimum:

| | H | maxW/H | **barki/H** | **biodro/H** | szczyt szerokości |
|---|---|---|---|---|---|
| gracz | 69 | 0,42 | **0,42** | **0,41** | 32% wysokości (barki) |
| peasant | 66 | 0,56 | **0,45** | 0,52 | 45% (poła kaftana) |
| hanna | 66 | 0,55 | **0,42** | 0,52 | 48% (fartuch) |
| anna | 64 | 0,48 | **0,42** | 0,48 | 61% (spódnica) |

⚠⚠ **Wcześniejsze „gracz 0,42 wobec NPC 0,48–0,56" było porównaniem
MAKSIMÓW, a maksimum NPC-a to jego KAPELUSZ, POŁA i SPÓDNICA.** Po rozbiciu na
pasma: **linia barków jest identyczna** (0,42 vs 0,42–0,45). Gracz nie jest
wąski w barkach — jest **nieubrany**. Różnica siedzi w środku tułowia i na
biodrach (0,41 vs 0,48–0,52), czyli dokładnie tam, gdzie ląduje kolczuga,
tasety i pas.

### Dlaczego NIE poszerzamy

1. **Separacja jest zasobem, który pancerz tylko WYDAJE.** Gracz ma jej dziś
   najwięcej z czwórki: karb szyi, prześwit ręka↔tułów po obu stronach, ciągły
   prześwit między nogami. Wąska baza z otwartymi szczelinami jest stanem
   ODWRACALNYM — szeroka baza z zamkniętymi nie jest.
2. **Obrys robią RĘCE (±2,71 j.), a strefa naramiennika sięga ±2,51 j.** Czyli
   naramiennik ma ~0,2 j. (≈2 px) wzrostu, zanim w ogóle ruszy sylwetkę.
3. Poszerzenie tułowia/bioder zamknęłoby wcięcie, które dziś oddziela tors od
   nóg — i policzyłoby masę pancerza dwa razy.
4. Animacja jest zweryfikowana (§3e); większe promienie tylko zjadają
   prześwity, niczego nie poprawiają.

### ⚠ Zastrzeżenie, które idzie do etapu PANCERZA

**Dzisiejszy prototyp `char3d_armor` dokłada do sylwetki 0 px — zmierzone.**
Powstaje jako KOPIA wielokątów ciała napuchnięta o 0,09/0,16 j. lokalnej
(≈1,5 px na stronę w buforze gry), więc jest obcisłą powłoką, nie objętością.
To dowód mechanizmu warstwy, nie dowód masy. Założenie „pancerz dołoży masę"
jest więc **nadal niezweryfikowane** i staje się WYMAGANIEM wobec kolejnego
etapu: pancerz ma być prawdziwą geometrią, nie shrink-wrapem.

**Budżet dla etapu pancerza (z pomiaru, żeby nie wyprowadzać go od nowa):**

- środek tułowia i biodra: **+0,07–0,11 H** szerokości (≈5–8 px przy 69 px
  wzrostu) dociąga gracza do pasma NPC — to jest budżet kolczugi/taset/pasa;
- naramiennik: ~2 px swobodnego wzrostu na zewnątrz, zanim ruszy obrys;
- noga: ~2 px na stronę, zanim zamknie się prześwit 4–6 px między nogami;
- ⚠ **najciaśniejszy budżet to RAMIĘ**: prześwit ręka↔tułów ma dziś 1–2 px
  i jest miejscami przerywany. Gruby pancerz na RAMIENIU (nie na barku) sklei
  rękę z tułowiem i zabije separację. Tu ostrożnie.

---

## 3g. A5 — ZAMKNIĘTE (2026-09-20)

**Źródłem zwrotu modelu 3D jest INTENCJA GRACZA, nie `body.velocity`.**
Zakres: dwa pliki, ok. 20 linii kodu. ⛔ Geometrii, rigu, generatora, cyklu
`Walk` ani `char.glb` **nie dotknięto** — `MODEL BASE` zostaje LOCKED.

### Co robił kod PRZED (zmierzone, nie domniemane)

`Character3D.krok()` liczył `kat = atan2(vx, vy)` z prędkości ciała, pod bramką
`v² > 4`. Dawało to **dwa rozjazdy** i jeden stan zablokowany:

| objaw | pomiar |
|---|---|
| **obrót w miejscu niewidoczny** | strefa `STICK.turnZoneFrac` pisze `moveDir`, ale `setVelocity(0,0)` → `idzie=false` → `kat` zamrożony. `moveDir` right→down, `kat` stoi na 135° |
| **ślizg po przeszkodzie obracał postać** | wejście NE (intencja 135°), prędkość odchylona przez kolizję na czysty wschód → model 90° |
| **model zostawał w pozie ataku** | po ciosie `kat` = 0° (snap 4-kier.), a `guardDir` = „right". Model patrzył w dół, tarcza kryła prawo — dokładnie „druga, ukryta prawda", której zakazuje `src/entities/CLAUDE.md` |

### Zmiana

- **`Player.ustawZwrot(v)`** — JEDYNE miejsce zapisujące zwrot. Pisze
  `moveDir` (4 wartości, dla 2D i tarczy) **i** `zwrotRad` (ciągły kąt,
  `atan2(x, y)` w osiach ekranu) z tego samego wektora. Trzy istniejące
  miejsca zapisu (`handleMovement`, `faceAlongTravel`, `driveLocked`) wołają
  ją zamiast przypisywać `moveDir`.
- **`Player.zwrotKat`** — getter; przy zerowym wejściu trzyma ostatnią wartość.
- **`Character3D.krok()`** czyta `gracz.zwrotKat`. Bramka `idzie` zniknęła
  z tej gałęzi (jest zbędna — kąt sam się nie kasuje) i **została** tam, gdzie
  była potrzebna: w wyborze pętli chodu vs pozy bezruchu.

⛔ `zwrotKat` **nie jest trzecim źródłem prawdy** — to ten sam zwrot w innej
rozdzielczości. Reguła dopisana do `src/entities/CLAUDE.md`.

### Wynik pomiaru PO zmianie

| kryterium A5 | wynik |
|---|---|
| 8 kierunków (N…NW) | **błąd 0,0° na każdym**, `rotation.y == kat` |
| więcej niż 8 (drążek analogowy) | 22,5 / 67,5 / 112,5 / 157,5 / 203 / 291° — **błąd 0,0°** |
| obrót w miejscu | **model obraca się**, `isMoving=false` (gra poza bezruchu, nie chód) |
| zatrzymanie | 8 klatek po puszczeniu drążka → **jedna wartość**, bez skoku do 0° |
| przejścia N→NE→E, E→SE→S, S→SW→W, W→NW→N | kroki dokładnie −45°, −45° |
| przejścia gwałtowne N→S, E→W, NE→SW | dokładnie −180°, **bez obrotu 360° w złą stronę** (kąt jest PRZYPISYWANY, nie interpolowany) |
| jitter | 15 klatek marszu + 15 bezruchu → **po jednej wartości** |
| Walk → Idle → Walk | −135 / −135 / −135, **bez resetu** |
| ślizg po przeszkodzie | model trzyma intencję 135°, nie odchyloną prędkość 90° |
| atak i powrót | wejście −45° (kwantyzacja `attackDir`), **po ciosie wraca do 135°** — stan zablokowany zniknął |
| `tsc` / `build` / `dev.missing` / `totalFailed` | czysto / czysto / puste / 0 |

### Czytelność (render z gry, 96×128, miecz + puklerz)

Osiem kierunków rozróżnialnych: przód niesie twarz i jasną karnację, tył —
ciemną czapę włosów, a tarcza działa jako drugi, niezależny wskaźnik zwrotu.
Obrót w miejscu jest teraz widoczny jako obrót, wcześniej były to cztery
identyczne klatki.

### ⏳ Co zostaje otwarte — `OI-140`

`attackDir`/`guardDir` są dalej **czterokierunkowe**, więc w pozie ataku model
skacze o ≤45°, a tarcza kryje ćwiartkę zamiast kierunku. ⛔ **Nie rozwiązywać
tego kwantując model** — rozwiązaniem jest ciągły `attackDir`, a to dotyka
`canStrikeFacing`, `FRONT_ARC_DEG` i bloku kierunkowego. Należy do etapu
wyposażenia/tarczy.

---

## 3h. A6.1 — BROŃ 1H: ZAMKNIĘTE (2026-09-20)

Pierwszy podetap **A6 (wyposażenie)**. ⛔ Humanoida, rigu, cyklu `Walk` ani
pozy niesienia **nie dotknięto** — zmiana siedzi w PRZEDMIOCIE i w BRAMCE.

### Audyt: pipeline mocowania już istnieje i jest poprawny

Broń jest **węzłem glTF wpiętym w kość dłoni**, nie teksturą ani sprite'em.
Łańcuch rodziców zmierzony w żywej grze:

    Bron_sword → Bone002_R003 → Bone002_R002 → Bone002_R004
               → Bone002_R001 → Bone002_R → … → Armature

`Character3D.ustawSlot()` przełącza wyłącznie `visible` między wariantami
jednego slotu. **Broń nie może się odkleić od dłoni, bo jest jej dzieckiem** —
nie ma tu nic do przeliczania co klatkę. To jest docelowa architektura A6
i nie wymaga zmian.

### Stan zmierzony — dwie rzeczy, nie jedna

**1. Chwyt 2H NIE jest już zepsuty.** Poprzedni audyt notował błąd lewej dłoni
na drzewcu **1,46 j.** przy tolerancji 0,55. Dziś: **0,39 j. dla wszystkich
trzech broni dwuręcznych** — mieści się. ⭐ Naprawiło się samo przy A1/A2
(wstępne zgięcie łokcia + przebudowa cyklu). **Nie zakładać starych liczb.**

**2. `OI-136` był GORSZY, niż mówiła bramka.** Miecz schodził pod grunt nie
tylko w chodzie, ale też w **prawdziwej pozie bezruchu** — tej samej wartości
0,457 j. Bramka tego nie pokazywała, bo mierzyła nie tę pozę (niżej).

### Przyczyna `OI-136` — zmierzona, nie domniemana

| klatka `Walk_Armed` | Z dłoni | oś kości dłoni | nachylenie | pod podłogą |
|---|---|---|---|---|
| 0, 2, 4 | −5,354 | (−0,12; −0,39; −0,91) | 65,8° | −0,33 ok |
| **1, 3, 5 (bezruch)** | −5,354 | (−0,11; −0,12; −0,99) | **80,7°** | **+0,457 BŁĄD** |

⭐ **Dłoń stoi na STAŁYM Z na każdej klatce — `NIESIENIE_1H` działa
bez zarzutu.** Zmienia się **ORIENTACJA** kości dłoni, bo więz IK nie
kontroluje obrotu (`use_rotation=False`), więc nadgarstek wychodzi z łańcucha
raz pod 65,8°, a raz pod 80,7°. ⛔ Nie jest to wada pozy niesienia, modelu
miecza ani rigu.

### Zmiana 1 — kąt noszenia miecza `16° → 30°`

Kąt noszenia jest **własnością przedmiotu** i to jest właściwe miejsce na
kompensację nadgarstka. Stara wartość została dobrana na 3-kluczowym cyklu
sprzed A2. Przymiar (max zanurzenie w chodzie, limit 0,30 j.):

    16° +0,457 BŁĄD · 22° +0,234 · 26° +0,052 · **30° −0,156** · 34° −0,388 · 38° −0,643

Wybrane **30°**: zapas 0,46 j., odklejenie broni od pięści rośnie tylko
0,207 → 0,244 j. (≈0,3 px w buforze gry; powyżej 38° zaczyna być widoczne),
cios nietknięty (ostrze 3,36 j. nad gruntem). ⭐ Render dał drugi argument:
przy 16° ostrze nakładało się na goleń i zlewało z nogą, przy 30° czyta się
jako osobny przedmiot.

### Zmiana 2 — bramka mierzyła NIE TĘ POZĘ

`char3d_sprawdz_bron.py` liczyło kolumnę „bezruch" z **klatki 0 akcji ataku**,
z komentarzem „poza gotowości = tak stoi na co dzień". **Od A2 to zdanie jest
nieprawdziwe** — postać stojąca gra klatkę `BEZRUCH` klipu `Walk_Armed`,
a gotowość bojowa pokazuje się wyłącznie w trakcie ciosu. Bramka mierzyła więc
pozę, której gracz na co dzień nie widzi.

Dowód, że asercja **potrafi teraz zaświecić**: po cofnięciu kąta na 16°
kolumna bezruchu pokazuje `+0.46 BLAD` (przedtem przy tym samym, zepsutym
stanie pokazywała `-2.24 ok`).

### Wynik

| bramka | przed | po |
|---|---|---|
| broń zamiatająca grunt | **1** (`sword`) | **0** |
| błędy bramki broni | 27 | **26** (wszystkie = brak modelu z katalogu, `OI-109`) |
| chwyt 2H (lewa na drzewcu) | 0,39 ok | 0,39 ok |
| bramka tarcz | 2/2 OK | 2/2 OK |
| `tsc` / `build` | czysto | czysto |
| regresja walki | 403 OK / 0 | **403 OK / 0** |
| żywa gra | `missing` puste, `totalFailed` 0 | bez zmian |

### Test minimum A6.1 (żywa gra, bufor 96×128)

IDLE · WALK (4 klatki) · obrót w miejscu (5 pozycji) · 8 kierunków · ruch
analogowy (22,5 / 67,5 / 112,5 / 157,5°) · atak 1H (10 klatek) · powrót do
idle · powrót do walk. **Miecz trzyma się dłoni w każdej klatce**, obraca się
z postacią, nie przenika ciała, nie zmienia pozycji humanoida, a po ciosie
wraca do identycznej pozy niesienia.

**`OI-136` ZAMKNIĘTE.** Otwarte zostaje `OI-109` (26 broni z katalogu bez
modelu 3D) — stan zastany, nie regresja A6.1.

### ⏳ Następny podetap: A6.2 — tarcza spoczynkowa

---

## 3i. A6.2 — TARCZA SPOCZYNKOWA (CARRY): ZAMKNIĘTE (2026-09-20)

⛔ Humanoida, rigu, cyklu `Walk` ani **pozy** `NIESIENIE_TARCZA_SPOCZYNEK`
nie dotknięto. Zmiana siedzi w PRZEDMIOCIE (`chwyt`) i w BRAMCE.

### Audyt: bramka miała DWIE ślepe plamy

1. **Mierzyła nie te klipy.** Sprawdzała `Walk` i `Walk_Armed` — w obu lewa ręka
   macha pełnym cyklem, bo pozy niesienia tarczy tam po prostu nie ma. Gra
   z tarczą gra `Walk_Shielded` / `Walk_Armed_Shielded`. Ta sama klasa błędu,
   co kolumna „bezruch" w bramce broni (A6.1).
2. **Nie sprawdzała przenikania w ogóle** — wyłącznie zejście pod grunt. Problem,
   o który tu chodzi, był poza jej zasięgiem z definicji.

### Przyczyna — zmierzona

Oś kości lewej dłoni w pozie niesienia (stabilna na każdej klatce):

    local X → (−0,84; +0,54; −0,10)   do środka ciała i do tyłu
    local Y → (+0,10; −0,03; −0,99)   w dół, wzdłuż ręki
    local Z → (−0,54; −0,84; −0,03)   do środka ciała i DO PRZODU

`chwyt` obu tarcz miał **dodatnie Z**, czyli wypychał dysk **przed ciało**.
Stąd oba objawy naraz: tarcza przenikała biodro/udo **i** czytała się jak
garda. ⭐ **−Z = na zewnątrz i do tyłu** — to jest kierunek CARRY.

⚠ Pierwszy przymiar poszedł w złą stronę (+Z) i pokazał pułapkę wprost: przy
`chwyt` +1,1 przenikanie puklerza spada do zera, ale środek tarczy ląduje
**1,7 j. PRZED tułowiem**. Geometria kupiona kosztem wymogu projektowego.

### Zmiana — `chwyt`, czyli odległość DYSKU od pięści

| tarcza | `chwyt` przed | `chwyt` po |
|---|---|---|
| puklerz | (0,0; −0,05; **+0,30**) | (−0,56; −0,33; **−0,42**) — patrz trzecia korekta |
| tarcza okuta | (0,0; −0,12; **+0,34**) | (−0,51; −0,33; **−0,42**) — patrz trzecia korekta |

### ⚠⚠ KOREKTA KRYTERIUM (autor, 2026-09-20) — i co z niej wyszło

Pierwsza wersja A6.2 optymalizowała **najgłębszy pojedynczy wierzchołek**
i wybrała dla okutej `chwyt −1,16`. **To było złe kryterium.** Tarcza niesiona
przy boku MA nachodzić na obrys człowieka — decyzja autora, poparta
referencjami (hoplita, wojownik z dużą tarczą). Zmierzona nakładka tarczy na
sylwetkę w buforze gry:

    stare +0,34 → **50%**   ·   −0,85 → **32%**   ·   −1,16 → **27%**

⭐ **Po przestawieniu pytania z „jak daleko" na „jaki udział tarczy siedzi
w ciele", −0,85 wygrało także LICZBOWO** — i to była niespodzianka:

| `chwyt` Z | CARRY głęb. | CARRY % | GUARD głęb. | GUARD % |
|---|---|---|---|---|
| +0,34 (stare) | 0,730 | 29% | 0,706 | 18% |
| **−0,85** | 0,424 | **9%** | **0,164** | **8%** |
| −1,16 | 0,051 | 1% | **0,460** | 11% |

⚠ **`chwyt` jest wspólny dla CARRY i GUARD**, więc odsuwanie tarczy dalej
**psuło pozę WALKI** (0,164 → 0,460 j.). Założone przy −1,16 `OI-141`
**rozpuściło się** przy −0,85 i zostało zamknięte tego samego dnia.

### Wynik — udział tarczy w ciele przez cały cykl, OBIE pozy

| poza | tarcza | przed | po |
|---|---|---|---|
| **CARRY** | puklerz | 22% / 0,468 j. | **2% / 0,026 j.** |
| **CARRY** | okuta | 29% / 0,730 j. | **9% / 0,424 j.** |
| GUARD | puklerz | 8% / 0,159 j. | **2% / 0,026 j.** |
| GUARD | okuta | 18% / 0,706 j. | **8% / 0,164 j.** |

Środek tarczy przeszedł z Y −0,68…−0,79 (**przed** tułowiem) na dodatni
(**za** płaszczyzną tułowia, czyli z boku). To jest liczbowy zapis
„CARRY ≠ GUARD".

### Bramka — rozszerzona i widziana na czerwono

`char3d_sprawdz_tarcze.py` sprawdza teraz **klipy, które gra naprawdę gra** —
i to WSZYSTKIE cztery: `Walk_Shielded`, `Walk_Armed_Shielded` oraz oba
`_Combat` (bo `chwyt` jest wspólny dla CARRY i GUARD). Dokłada **test
przenikania** liczony parzystością przecięć promienia.

⛔ **Bramka pyta o UDZIAŁ, nie o najgłębszy wierzchołek** (limit **15%**
wierzchołków tarczy w ciele; drugi próg, 0,90 j., istnieje tylko na przypadek
absurdalny i jest celowo luźny). Wersja karząca najgłębszy punkt **pchała
w złą stronę**: żeby ją zaspokoić, trzeba było odsuwać tarczę, aż przestawała
wyglądać na niesioną przy boku. Progi wzięte z pomiaru (stan przed A6.2:
29%/18% → ma błysnąć; stan po: 9%/8% → ma przejść).

⚠ **Test ma własną SAMOKONTROLĘ** i to nie jest ozdoba: pierwsza wersja
liczyła przynależność po znaku normalnej i **nie przeszła jej** — środek
tułowia czytał się jako „na zewnątrz", bo siatka jest połówkowa + Mirror.
Druga pułapka: przy włączonym `Solidify` (odwrócony hull konturu) **każdy**
punkt czyta się jako wewnętrzny, więc bramka gasi go przez `apply_zones()`.
Bez samokontroli obie wersje raportowałyby „zero przenikania".

Dowód czerwieni: przywrócenie wartości sprzed A6.2 →
`BLAD: ironbound_shield: 26% tarczy siedzi w ciele`, kod wyjścia **1**.
Zielono: **48 sprawdzeń** (4 klipy × 6 klatek × 2 tarcze).

### Odpowiedź na pytanie projektowe

**„Czy ta postać wygląda jak ktoś, kto NIESIE tarczę przy boku?" — TAK.**
Sprawdzone na obu tarczach, w ośmiu kierunkach, w marszu i w obrocie w miejscu:
tarcza trzyma się lewego boku, ręka jest opuszczona, **środek sylwetki
(klatka, głowa) zostaje wolny w każdym kierunku**. Duża tarcza zasłania część
biodra i uda — i tak ma być.

### Test minimum w żywej grze (96×128, miecz + tarcza)

IDLE · cały cykl WALK · WALK→IDLE · IDLE→WALK · obrót w miejscu przez 8
kierunków · 8 kierunków w marszu · analog (22,5 / 67,5 / 112,5 / 157,5°).
Klip potwierdzony w mikserze: **`Walk_Armed_Shielded|petla`, waga 1**.
Tarcza trzyma się lewej ręki, obraca się z postacią, **zostaje przy biodrze
w każdym kierunku**, nie wchodzi w tors ani w udo podczas kroku, nie skacze
na przejściach. Sylwetka pozostaje czytelna.

### Bramki

`tsc` czysto · `build` czysto · regresja walki **403 OK / 0 różnic** ·
bramka broni bez zmian (`sword −0,16 ok`) · bramka tarcz **OK** ·
żywa gra `missing` puste, `totalFailed` 0.

### ⚠⚠⚠ TRZECIA KOREKTA — „tarcza jest w środku ręki" (autor)

Po poprawieniu „plecaka" postawiłem środek tarczy **dokładnie na pięści**
(+0,35; 0; 0). Naprawiło to głębokość i lico, ale wprowadziło **nowy błąd**:
dysk wyśrodkowany NA dłoni, więc **opuszczone przedramię leżało w jego
płaszczyźnie**. Zgłoszone przez autora z renderu gry.

⛔ **Pierwszy przyrząd do zmierzenia tego KŁAMAŁ.** Liczył parzystość przecięć
promienia z siatką tarczy i przy tarczy odsuniętej 1,45 j. (fizycznie daleko
poza ręką) dalej raportował ~100 wierzchołków „wewnątrz". Siatka jest szczelna
(zero krawędzi o innej liczbie ścian niż 2), więc nie o to chodziło:
**tarcza to CIENKI DYSK, a dla cienkiego dysku parzystość jest przypadkiem
zdegenerowanym** — promień biegnący blisko płaszczyzny lica przecina wiele
ścian współpłaszczyznowych.

### Przyrząd: `tools/char3d_clearance.py`

Liczy **analitycznie**, bez promieni: tarcza jest dyskiem z konstrukcji, więc
odległość punktu od bryły to wzór zamknięty (walec o promieniu `R`
i półgrubości `t`). Zero iteracji, zero zależności od gęstości siatki.

**Samokontrola na czterech sztucznych przypadkach o znanej odpowiedzi**
(wpięta w bramkę, uruchamia się przed każdym pomiarem):

| przypadek | wynik | oczekiwano |
|---|---|---|
| 1. tarcza daleko na zewnątrz | prześwit **+3,44** | PASS |
| 2. tarcza na przedramieniu | **−0,40** (161 wierzch. w środku) | FAIL |
| 3. tarcza daleko za ręką | prześwit +2,65 → łapie reguła `dY` = +5,43 | FAIL |
| 4. tarcza znów daleko na zewnątrz | **+3,44** (identycznie jak 1) | PASS |

⚠ Stary przyrząd **oblałby 1 i 4** — i właśnie dlatego przepuścił błąd, który
autor zobaczył gołym okiem. Przypadki 1 i 4 są celowo identyczne: sprawdzają,
że pomiar jest deterministyczny i nie przecieka stanem.

⚠ Przypadek 3 ma prześwit **dodatni i to jest poprawne** — tarcza za ręką jej
nie przecina. Pilnuje go osobna reguła `dY`, i samokontrola sprawdza, że ta
reguła naprawdę reaguje. Inaczej przypadek 3 nie miałby żadnego strażnika.

### Korekta wartości

Ręka wystaje **0,65 j.** na zewnątrz od osi pięści, więc tarcza musi minąć
całe przedramię. Zmierzone przyrządem (minimum po **wszystkich klatkach obu
póz**, 24 kombinacje):

    dX +0,55 → −0,35 j. (35 wierzch. w tarczy) · +0,95 → −0,11 (10)
    dX +1,15 → +0,06 (0) · **+1,30 → +0,19 (0)** ← wybrane · +1,45 → +0,31 (0)

| tarcza | `chwyt` | prześwit przedramienia |
|---|---|---|
| puklerz | (−0,56; −0,33; −0,42) | **+0,18 j.**, 0 wierzch. w tarczy |
| okuta | (−0,51; −0,33; −0,42) | **+0,13 j.**, 0 wierzch. w tarczy |

`+1,15` też było czyste, ale z marginesem 0,06/0,01 j. — na granicy szumu pozy.

### Bramka

`char3d_sprawdz_tarcze.py` ma teraz **cztery niezależne asercje**: zejście
w grunt · zanurzenie w ciele (udział głębszy niż 0,25 j.) · relacja
ręka→tarcza (`dY`, strona, lico) · **prześwit przedramienia**. Plus
samokontrolę przyrządu przed pomiarem.

Dowód czerwieni dla nowej asercji: przywrócenie wariantu „ręka w tarczy" →
`BLAD: buckler: PRZEDRAMIE W TARCZY`, kod wyjścia **1**.

### ⚠⚠⚠ CZWARTA KOREKTA — ORIENTACJA: „z przodu widać prawie całe lico"

Autor złapał to na zrzucie z gry: przy `obrot −90°` lico tarczy było w **55%
skierowane w stronę widza**, więc z FRONTU widać było prawie cały dysk —
i CARRY zaczynało czytać się jak GUARD.

**Audyt orientacji** (osie odniesienia zmierzone, nie założone):

    forward (przód postaci)     (0,00; −1,00; 0,00)
    outward (lewy bok)          (1,00;  0,00; 0,00)
    oś przedramienia            (0,10; −0,11; −0,99)   ← pionowa, ręka opuszczona

| `obrot` Y | \|n·bok\| | \|n·przód\| | kąt od płaszczyzny boku | prześwit przedramienia |
|---|---|---|---|---|
| −90 (było) | 0,78 | **0,55** | 38° | +0,13 |
| −110 | 0,95 | 0,25 | 19° | +0,31 |
| **−125** | **0,99** | **0,01** | **8°** | **+0,36** |

⭐ **Oba kryteria poprawiają się RAZEM** — obrócenie lica wzdłuż boku odsuwa
dysk od przedramienia, więc prześwit rośnie. To nie jest kompromis.

⛔ **Wcześniejsze odrzucenie „99% na zewnątrz" (»z przodu tarcza znika«) było
mierzone przy `chwyt` dX +0,35**, czyli przy tarczy leżącej NA ciele. Przy
dX +1,30 tarcza stoi obok sylwetki i jej krawędź czyta się jako osobny,
pionowy element.

### Wartości obowiązujące

| tarcza | `chwyt` | `obrot` |
|---|---|---|
| puklerz | (−0,579; −0,333; −0,367) | (0, **−125**, 0) |
| tarcza okuta | (−0,539; −0,333; −0,339) | (0, **−125**, 0) |

Zmierzone: lico **99% na zewnątrz / 1% do widza** · prześwit przedramienia
**+0,41 / +0,36 j.**, zero wierzchołków ręki w tarczy · `dY` 0,26 ·
zanurzenie w ciele 0% — wszystko jako **minimum po 24 kombinacjach
klatka × poza** (CARRY i GUARD).

### Sprawdzone widoki

FRONT → **krawędź** · BACK → **krawędź** · LEWY/PRAWY → **lico** ·
3/4 → **częściowe lico**. Osiem kierunków w żywej grze 96×128, obie tarcze:
ten sam wzór, bez wyjątków.

### ✅ A6.2 CARRY — ZAMKNIĘTE (2026-09-21)

Dwa zaległe testy na finalnych wartościach: **obrót w miejscu przez 8
kierunków** i **ruch analogowy** (22,5 / 67,5 / 112,5 / 157,5 / 202,5 / 292,5°).
Tarcza trzyma bok w każdym, bez skoków. CARRY = LOCKED.

---

## 3j. A6.3 — TARCZA BOJOWA (GUARD): ZAMKNIĘTE (2026-09-21)

### Audyt: GUARD był CARRY tylko podniesionym

Zmierzone przed zmianą: w obu pozach **|n·bok| = 1,00**, czyli tarcza w pozie
walki stała **krawędzią do przodu**, dokładnie jak w niesieniu. Kontrast
CARRY↔GUARD był wyłącznie w wysokości dłoni. To nie jest garda.

### Dlaczego nie dało się tego zrobić prościej

- ⛔ **`obrot` tarczy** — własność PRZEDMIOTU, wspólna dla obu póz. Zmiana
  zepsułaby CARRY, które właśnie zamknięto.
- ⛔ **kontrolka IK** — więz czyta z niej wyłącznie POZYCJĘ
  (`use_rotation=False`, zmierzone).
- ⛔ **skręt nadgarstka wokół własnej osi** — sprawdzony i odrzucony: zamiata
  normalną po STOŻKU wokół osi ramienia, a ramię wisi pionowo, więc lico
  dochodziło najwyżej do **|n·przód| = 0,54**, a reszta szła W GÓRĘ (stara
  wada „taca do pizzy"). Zmierzone dla 7 kątów × 4 pozycji dłoni.

### Rozwiązanie: `LICO_TARCZY_WALKA` + solver

⭐ **Kość lewej dłoni `Bone.002_L.003` jest POZA łańcuchem IK**
(`chain_count = 3` obejmuje `.002`/`.004`/`.001`), więc jej obrót jest wolny
i **nie rusza pozycji dłoni**. `char3d_chod._ustaw_lico_tarczy` obraca ją
iteracyjnie, aż lico tarczy wskaże zadany kierunek w świecie — ta sama metoda
„policz, ZMIERZ, skoryguj", którą `char3d_attack._dopasuj` stosuje do pozycji.

    LICO_TARCZY_WALKA = (0.0, −1.0, 0.0)     # przodem do zagrożenia

Wynik: **|n·przód| = 1,00 · |n·bok| = 0,00 na KAŻDEJ klatce**, przy prześwicie
przedramienia +0,37 j. Normalna lica liczona z `TARCZE[...]["obrot"]`, nie
z obiektu — poza musi dać się zbudować także bez tarczy w scenie (tak woła ją
eksport). ⚠ Funkcja **krzyczy**, gdy tarcze przestaną mieć wspólny `obrot`.

### Poza: `NIESIENIE_TARCZA_WALKA` (1,6; −0,5; −5,6) → **(1,3; −2,0; −4,4)**

Stara trzymała tarczę na wysokości PASA (środek 1,2 j. nad biodrem). Nowa kryje
**KLATKĘ** (2,4 j.), a głowa, prawa ręka i miecz zostają czytelne.
⛔ Odrzucone „przez ciało" (0,8; −2,2; −4,2): tarcza wchodziła na tułów i głowę,
czyli kupowała osłonięcie kosztem sylwetki.

### `OI-140` — ZAMKNIĘTE: osłona i bramka ataku są CIĄGŁE

⭐ **`Protection.guardAngleDeg` przyjmuje teraz `Direction` ALBO ciągły kąt**
(`GuardFacing`). Podanie `Direction` daje wynik **bit w bit** jak przedtem —
ta sama tablica, ta sama arytmetyka — i na tym stoi 121/121 regresji.

- `Player.guardKat` — ciągły, **regułą przepisaną z `guardDir`** (w pozie ataku
  zwrot należy do ciosu, poza nią do ruchu).
- `Player.takeDamage` i `GuardStats.record` czytają `guardKat`.
- `GameScene.canStrikeFacing` czyta `zwrotKat` zamiast `facingDir`.
- `FRONT_ARC_DEG` **nietknięte** (90°).

**Pomiar, który to uzasadnia** — stojąc na NE (model 135°):

| cios z | stara ćwiartka | blok? | ciągły | blok? |
|---|---|---|---|---|
| N | 90° | **NIE** | 45° | **TAK** |
| NE | 45° | tak | 0° | tak |
| E | 0° | tak | 45° | tak |
| S | 90° | nie | 135° | nie |
| W | 180° | nie | 135° | nie |

Cios z kierunku, w który postać **jawnie patrzy**, nie był blokowany. Dziś łuk
90° jest symetryczny wokół realnego zwrotu (±45°).

⏳ **Poza ataku jest DALEJ czterokierunkowa** (`attackDir`) — świadomie:
`attackDir` niesie celowanie i jego uciąglenie to osobna decyzja.

### Bramka: CARRY i GUARD mają PRZECIWNE reguły

Pierwsza wersja miała jeden zestaw (ten od CARRY) i po podniesieniu tarczy
**zaświeciła na czerwono na POPRAWNEJ geometrii**: „lico patrzy na widza… to
jest płaszczyzna GARDY". No właśnie — w pozie GUARD ma być gardą. Ta sama klasa
błędu, co kolumna „bezruch" w bramce broni (A6.1) i klipy CARRY (A6.2).

Dziś bramka rozpoznaje pozę po nazwie klipu (`_Combat`) i sprawdza:
**CARRY** — tarcza przy boku, na głębokości pięści, licem na zewnątrz ·
**GUARD** — tarcza przed ręką (−dY ≥ 0,30), licem w przód (|n·Y| ≥ 0,80).
Wspólne dla obu: prześwit przedramienia, zanurzenie w ciele, zejście w grunt.

Dowód czerwieni: wyłączenie solvera lica →
`BLAD: ironbound_shield: GUARD — lico tarczy NIE kryje frontu`, kod **1**.

### Testy w żywej grze (96×128) — 14/14

CARRY→GUARD · GUARD→CARRY · 8 kierunków stojąc · obrót w miejscu · 8 kierunków
w marszu · analog · `guardKat == zwrotKat` we wszystkich 8 · łuk 90° ·
blok z właściwej strony · brak teleportu · brak ręki w tarczy (prześwit +0,37) ·
brak resetu zwrotu · miecz zamocowany · atak + tarcza bez wzajemnego psucia.

⭐ **Tarcza w GUARD podąża za zwrotem**: lico celuje tam, gdzie patrzy postać,
więc z kamery widać je przy S, a krawędź przy E/W. To jest spójne z ciągłym
facingiem z A5 i widać to bez tłumaczenia.

⏳ **Obserwacja na później, nie usterka:** w trakcie samego zamachu tarcza
schodzi do pozy lewej ręki z klipu `Attack` (garda opada na czas ciosu)
i wraca po nim. Stan zastany, czytelny; gdyby miał się zmienić, to jest
decyzja o treści animacji ataku, nie o mocowaniu.

---

## 3k. A6 = CLOSED (2026-09-21)

**BROŃ 1H + TARCZA jako stabilny system wyposażenia.**

| podetap | stan |
|---|---|
| A6.1 broń 1H | ✅ `OI-136` zamknięte, kąt noszenia przestrojony po A2, bramka mierzy właściwą pozę |
| A6.2 tarcza CARRY | ✅ `chwyt` wyliczany z macierzy kości, lico wzdłuż boku, nowy przyrząd prześwitu |
| A6.3 tarcza GUARD | ✅ lico do zagrożenia, poza na wysokości klatki, `OI-140` zamknięte |

⛔ **Humanoida, rigu, cyklu `Walk` i systemu facing NIE dotknięto w całym A6.**
Wszystkie zmiany siedzą w: przedmiocie (`char3d_weapons`, `char3d_shields`),
pozie wyposażenia (`char3d_chod`), bramkach i logice guard/facing.

⏳ Otwarte i świadomie odłożone: `OI-109` (26 broni z katalogu bez modelu 3D).

### ⏳ Następna rodzina wyposażenia — dopiero teraz

---

## 4. Plan dalszy: ~~A4~~ → ~~A2~~ → ~~A5~~ → **A6 WYPOSAŻENIE** — **A6 ZAMKNIĘTE 2026-09-21** (~~A6.1 broń 1H~~ · ~~A6.2 CARRY~~ · ~~A6.3 GUARD~~)

⚠ **Kolejność jest decyzją autora.** Po każdym etapie sprawdzić, czy poprzedni
nadal działa i czy nic nie zmieniło się niezamierzenie.

### A4 — ✅ ZROBIONE, patrz §3c. Poniżej oryginalny opis zadania.
15 kluczy `PROPORCJE` nie jest przez nic czytanych; tabele `tulow` i `noga`
w `_cialo()` mają liczby wpisane wprost:

```
wzrost_m · masa_kg · krocze · bark_polszerokosc
klatka_polszer · klatka_glebokosc · talia_polszer · talia_glebokosc
biodro_polszer · biodro_glebokosc · szyja_promien
udo_promien · kolano_promien · lydka_promien · kostka_promien
```

To **dokładnie te pokrętła**, którymi robi się „ta sama baza, ale cięższa /
bardziej umięśniona / kobieca" — czyli cel numer jeden autora. Dziś żyją
głównie długości i ręce/głowa.

⭐ **Darmowa asercja:** po podpięciu, przy dzisiejszych wartościach, siatka musi
wyjść **identyczna**. Jeśli wyjdzie inna — podpięcie jest złe. Sprawdzać liczbą
wierzchołków + `zmierz()` + porównaniem renderu.
⛔ A4 to **wyłącznie** przepięcie literałów na parametry. Żadnego strojenia
sylwetki przy okazji.

### A2 — ✅ ZAMKNIĘTE 2026-09-20 (po korekcie `bujanie` 0,42 → 0,30). Pełny zapis w §3d.

Cykl `Walk` przebudowany z 3 kluczy na **symetryczny cykl 4-kluczowy**
+ osobną klatkę bezruchu. Generator: **nowy `tools/char3d_walk.py`**
(parametry w `CHOD`). Kontrakt: `tools/CLAUDE.md`, sekcja „Cykl chodu".

### A5 — ✅ ZAMKNIĘTE 2026-09-20, patrz §3g. Poniżej oryginalny opis zadania.
`Character3D.krok()` liczy kąt z **prędkości** (`atan2(vx, vy)`) i tylko gdy
ciało się rusza. Skutki: **obrót w miejscu (`STICK.turnZoneFrac`, `Player.ts`
~486) jest na modelu niewidoczny** — `moveDir` się zmienia, prędkość jest
zerowa, model stoi jak stał. Do tego ślizg wzdłuż przeszkody obraca model
w stronę ślizgu, a atak skacze do jednego z czterech kierunków (`KAT_ZWROTU`).
Źródłem ma być `moveDir` (interpolowany), nie prędkość.
⚠ To jest naruszenie własnej reguły projektu z `src/entities/CLAUDE.md`
(„`guardDir` to WIDOK na to, co rysuje sprite… **Trzeciego źródła nie ma**").

### Dopiero POTEM — ponowna ocena pozy wyposażenia
Przestroić `NIESIENIE_TARCZA_SPOCZYNEK` / `NIESIENIE_TARCZA_WALKA` /
`NIESIENIE_1H` oraz `obrot`/`chwyt` przedmiotów — **od zera**, w przestrzeni,
w której zgięty łokieć już istnieje. Potem ponowna ocena sylwetki, negative
space i animacji przez autora.

---

## 5. Decyzje autora (obowiązujące, nie podważać)

- **Etapowanie:** `BASE → RIG → ANIMATION → EQUIPMENT → MOVEMENT/COMBAT →
  dopiero DETAILS`. Uproszczony wygląd jest **celowy** i nie jest problemem
  do zgłaszania.
- **Kolejność fundamentu: A1 → A4 → A2 → A5.** Bez rozszerzania zakresu.
- **Kategorie B i C zamrożone:** nie ruszać głowy, skali broni, detali mesha,
  twarzy, włosów, ubrania, materiałów, stylu finalnego.
- **Cel nadrzędny modelu:** ma być **bazą do kopiowania** pod inne postacie
  (inny wzrost, waga, muskulatura, wariant żeński). To jest uzasadnienie dla
  A4.
- **Docelowy zestaw do ogrania:** postać + pancerz + **miecz 1H + tarcza**.
- **Punkty odniesienia (różne warstwy, żadnej nie kopiujemy):** WoW — kierunek
  RPG/MMORPG · League of Legends — walka i celowanie · WFRP — charakter świata
  i wyposażenia · **Stronghold Crusader HD** — język wizualny: proste, mocne
  kształty, ograniczona paleta, kontrast, czytelne materiały, czytelność mimo
  dużej liczby obiektów.
  ⛔ **Metin Mobile NIE jest benchmarkiem** — padł raz jako dowód, że pełny
  zakres MMORPG da się zrobić na mobile, i tyle. Autor w niego nie grał.
- **Stan „w walce" ma być prawdziwym stanem gry** (analogicznie do Combat
  w WoW), spiętym z istniejącym aggro/pościgiem — **nie timerem**. Już tak
  jest zrobione.
- **Autor gra w tę grę na bieżąco.** Brak zapisanego playtestu ≠ brak grania.

---

## 6. ⚠ Wcześniejsze próby i kompromisy poprzedniego agenta — oddzielić od faktów

**To są kompromisy i pomyłki, NIE zasady techniczne projektu.** Nie dziedzicz
ich jako ograniczeń.

1. ⛔ **`docs/postac3d_historia.md` §11 (dawniej w checkpoincie) kłamie.** Twierdzi, że cele IK siedzą
   na 153–165% zasięgu i że `use_stretch` rozciąga kości. **Oba zdania są
   fałszywe** — to błąd jednostek (długość kończyny w przestrzeni LOKALNEJ,
   2,11, porównana z odległością w ŚWIECIE, 3,49; 3,396 ÷ 1,6527 = 2,055).
   Zmierzone naprawdę: cele na 98–108%, kości w pozie 100% długości. Ta
   pomyłka skierowała trzy sesje w złą stronę.
2. ⛔ **Osiem rund rzeźbienia mesha ręki (V3.3f–V3.3v: `_luk_ramienia`,
   „diament", wybrzuszenie i ich cofanie) to były próby NAMALOWANIA zgięcia
   łokcia w siatce**, bo rig go nie dawał. Dlatego każda „prawie działała"
   i wracała. Po A1 większość tej geometrii jest prawdopodobnie zbędna —
   ⚠ ale **nie ruszać jej teraz**, to kategoria B/C.
3. ⛔ **Pozy tarczy (`NIESIENIE_TARCZA_*`) to piąta iteracja kompromisu**, nie
   projekt. Szukały dobrego punktu na kuli prostego ramienia, na której go nie
   ma. Do przestrojenia od zera po A5.
4. ⛔ **Przechylenie lica tarczy ~0,35 w pozie walki** jest zaakceptowaną
   **wadą**, nie decyzją. Wynikało z supinacji nadgarstka przy prostej ręce.
5. ⛔ **`dodaj_rozchylenie_ramion(dodatek=0.20)`** odsuwa całą sztywną rękę,
   bo łokieć nie odstawał sam. Po A1 do ponownej oceny.
6. ⛔ **Zdanie „obrót kontrolki `HandIK` nie ma wpływu na efektor"** jest
   PRAWDZIWE (sprawdzone) — więz IK czyta tylko pozycję. Zostawić jako fakt.
7. ⚠ **`PLAYER.scale = 1.15`** dobrane na oko pod czytelność. Kompromis.

---

## 7. Co przeczytać na starcie nowej sesji

| plik | po co |
|---|---|
| `CLAUDE.md` (korzeń) | router projektu; ładuje się i tak |
| **ten plik** | stan fundamentu i plan |
| `tools/CLAUDE.md` | ⭐ reguła nr 1 („PATRZ NA RENDER") i zasada przymiaru/`--zapisz` — **obowiązkowo przed dotknięciem `tools/`** |
| `tools/char3d_base.py` | generator ciała i rigu; `PROPORCJE` + `_uklad()` + `_cialo()` — **główny plik A4** |
| `tools/char3d_chod.py` | klipy chodu, stałe `NIESIENIE_*` — **A2 i późniejsze pozy** |
| `tools/char3d_attack.py` | solver `_dopasuj`, przelicznik `_przenies`, pozy ataku |
| **`tools/char3d_walk.py`** | ⭐ **cały cykl chodu i poza bezruchu** — parametry w `CHOD`, asercje w `sprawdz()` |
| `tools/char3d_walk_lean.py` | już tylko `dodaj_rozchylenie_ramion` (+ solver jakobianowy); reszta wycięta w A2 |
| `tools/build_char3d_base.py` | przymiar + zapis + render 14 widoków do `docs/podglad/` |
| `src/render3d/Character3D.ts` | **A5**: `krok()`, `KAT_ZWROTU`; od A2 także `paraKlipow` i podział klipu na pętlę + bezruch |
| `src/entities/CLAUDE.md` | reguła „zwrot należy do drążka" — **kontekst A5** |
| `src/entities/Player.ts` (~470–500) | strefa obrotu drążka, `moveDir`, `movingInput` |
| `docs/postac3d_historia.md` (do 2026-10-10 w `postac3d_checkpoint.md`) | historia 32 dopisków — ⚠ **czytać z §6 tego pliku w ręku** |
| `public/assets/README.md` | pułapki `char.blend`, ścieżki assetów |

**Polecenia:**
```bash
blender -b public/assets/char.blend --python tools/build_char3d_base.py            # przymiar, NIC nie zapisuje
blender -b public/assets/char.blend --python tools/build_char3d_base.py -- --zapisz
blender -b public/assets/char.blend --python tools/char3d_export_gltf.py -- public/assets/characters/char.glb
blender -b public/assets/char.blend --python tools/char3d_sprawdz_bron.py
blender -b public/assets/char.blend --python tools/char3d_sprawdz_tarcze.py
npx tsc --noEmit
```
⚠ `blender` NIE jest w `PATH` — pełna ścieżka:
`"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"`.

**Weryfikacja w grze:** dev server na `http://localhost:49196`, Kontynuuj →
konsola: `window.dev.Inventory.addItem('sword',1,3); window.dev.Equipment.equip('sword')`,
`window.dev.missing()` ma być puste, `scene.load.totalFailed` = 0.
⚠ Po przeładowaniu `scene.player` bywa `undefined` przez kilka sekund —
poczekać i powtórzyć, to nie błąd kodu.
⚠ Syntetyczny input (klawiatura, joystick, `body.setVelocity`) **nie działa**
w tym środowisku przeglądarkowym — do obrotu modelu ustawiać `p.moveDir`
i potwierdzać kątem sylwetki na zrzucie, nie brakiem błędu.

---

## 8. Do sprawdzenia PRZED kolejną zmianą

1. ~~**Przed A2:** potwierdzić, którą klatkę zamraża bezruch.~~ ✅ Nieaktualne:
   bezruch ma od A2 **własną klatkę poza pętlą** (5), więc nie koliduje już
   z żadną klatką cyklu.
2. ~~**Przed A5:** sprawdzić, czy `Player.moveDir` jest jedynym źródłem zwrotu
   i jak zachowuje się przy szarży/uniku/odrzucie (`driveLocked`,
   `faceAlongTravel`).~~ ✅ Zrobione w A5: miejsc zapisu były **trzy**
   (`handleMovement`, `faceAlongTravel`, `driveLocked`) i wszystkie trzy wołają
   dziś `ustawZwrot()`, więc nowy kąt nie może rozjechać się z `moveDir`.
   ⚠ Odrzut (knockback) zwrotu **nie pisze** i to jest poprawne — postać
   odrzucona nie obraca się plecami do tego, na co patrzy.
3. **Zawsze:** render przed i po (`docs/podglad/`, także `gra_px` 96×128) —
   raport nie wystarcza.

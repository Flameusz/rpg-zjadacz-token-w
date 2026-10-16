---
typ: OPERACYJNE
domena: assets
tytul: Ikony pancerza z Gemini — wsady, prompty i ocena
stan: zywy
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-30
---

# Ikony pancerza z Gemini — wsady, prompty i ocena

> **Po co ten plik.** Ikony pancerza pochodzą z rzędów 20–29 `items.png`
> (pakiet sprzed ~12 lat). Z 55 sztuk **13 stoi na jawnym PLACEHOLDERZE**,
> a kilka dzieli jeden kafel — np. łapcie, trzewiki, buty piechura i skórzane
> buty mają wszystkie `(0,24)`, a pięć sztuk płytowo-lamelkowych klaty
> i ramion ma `(2,26)`. To jest usterka „dwa różne przedmioty z jedną
> sylwetką w slocie, w którym gracz porównuje towar w sklepie"
> (`public/assets/README.md`).
>
> Ten plik jest bliźniakiem `docs/gemini_weapon_icons.md` — lekcje z tamtego
> (§3, §9) obowiązują tutaj bez powtarzania ich w całości.
>
> ⛔ **Katalog pancerza jest zamrożony (ARMOR SYSTEM FREEZE, 2026-09-18).**
> To jest odświeżenie grafiki ISTNIEJĄCYCH przedmiotów, nie dopisywanie nowych.

---

## 1. Decyzje przed wsadem (domyślne — do potwierdzenia przez autora)

| decyzja | wybór | dlaczego |
|---|---|---|
| **Co rysuje Gemini** | **KONSTRUKCJĘ, nie przedmiot** | Żelazny bliźniak ma tę samą bryłę co stalowy (`docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`). 7 sztuk żelaznych powstaje z wersji stalowej **zamianą rampy metalu**, nie osobnym rysunkiem. Ta sama zasada co przy tarczach: „ikona idzie po KONSTRUKCJI". Zostaje **48 konstrukcji**. |
| **Skala** | **BEZ** skali 0,44 px/cm; każda sztuka wypełnia kafel (~26–30 px) | Hełm (25 cm) wyszedłby w tej skali na 11 px. Pancerz porównuje się **w obrębie slotu**, nie hełm z butem. Różnicę pokrycia (kolczuga vs kolczuga krótka) niesie **kształt**, nie skala. |
| **Widok** | z przodu, płasko, symetrycznie; buty — ✅ **para PROSTO Z PRZODU**, czubkami na widza, lewy i prawy jako lustro (decyzja autora 2026-09-30 po odrzuceniu profilu — §9.0); rękawice — **jedna** rękawica grzbietem | Najczytelniejsza sylwetka przy 32 px. ⛔ Profil butów (wzór starych `items.png`) odrzucony przez autora na arkuszu. |
| **Kształt w slocie NÓG** | ✅ **SPODNIE — jedna bryła od pasa, zszyta w kroku.** Nigdy dwie osobne nogawice-rury ani pojedyncze nagolenniki. (Decyzja autora 2026-09-28, po prompcie wsadu 4 v0.) | **Model 3D gracza będzie docelowo w bieliźnie, a przedmioty nakładają się na niego jak w WoW** — tak jak dziś broń i tarcze. Ikona pokazuje to, co założy się na model, więc każda warstwa nóg (`L1`–`L3`) ma być czymś, co się zakłada jak spodnie. Historyczna konstrukcja (nogawice wiązane osobno do pasa) przegrywa z tą regułą. |
| **Ikona WARSTWY** | ✅ **ikona pokazuje TYLKO swoją warstwę** — sztuka L3 to sam metal z własnym pasem, rzemieniami i podkładem widocznym najwyżej jako brzeg; nigdy spodnie, len czy przeszywanica pod spodem. Dotyczy każdego obszaru warstwowanego (głowa, klata, nogi, buty). (Decyzja autora 2026-09-30 — §8.0b.) | Warstwa wynika z materiału, a obszar przyjmuje L1+L2+L3 naraz; ikona „płyty na przeszywanicy” byłaby dwoma przedmiotami w jednym i na modelu 3D dublowałaby L1. |
| **Metal w slocie NÓG** | ⛔ ~~WARIANT 1: płyty NA SPODNIACH~~ (2026-09-28) — **ODWOŁANY 2026-09-30** przez regułę wiersza wyżej, zanim powstał arkusz. Dziś: metal wisi na **pasie**, który łączy obie nogi; gdzie metal nie kryje, prześwituje tło. | Wariant 1 chronił przed gołą nogą między płytami przy samym L3 — to jest uczciwy skutek założenia samej blachy; pod spód zakłada się L1/L2. |
| **Wsady** | **po slocie** | Gracz porównuje w obrębie slotu — cechy rozpoznawcze muszą się różnić **na jednym arkuszu**. |
| **Piksele** | ✅ **HYBRYDA (wsad 1 v2, §4.5):** zmniejszenie arkusza do ~28 px + paleta + kontur, a **faktury drobniejsze niż 2 px (kolczuga) nakładane natywnie PO zmniejszeniu**. Poniżej pierwotne uzasadnienie pytania. | Przy mieczach arkusz był tylko projektem, bo skalowanie zjadało cienkie jelce (`gemini_weapon_icons.md` §9). Pancerz to zwarte bryły, więc wynik Pixel Snappera w natywnej siatce **może** się tu nadawać wprost. Prompt prosi o prawdziwą siatkę 32 px, żeby obie drogi zostały otwarte. ⚠ Przeciw: `tools/CLAUDE.md` — „przy bryłce ~13×15 px taniej NARYSOWAĆ niż odzyskiwać z downscalu". |

---

## 2. Plan wsadów

| wsad | slot | konstrukcje | układ | stan |
|---|---|---|---|---|
| **1** | głowa | 8 | 4×2, 16:9 | ✅ v2 przyjęty — §4.5 |
| **2** | klata: len i skóra | 6 | 3×2, 4:3 | ✅ v1 przerobiony obróbką — §5.4 |
| 3 | klata: kolczuga i metal | 7 + kotwica stylu | 4×2, 16:9 | ✅ v1 przyjęty i wpięty — §6.4 |
| 4 | nogi: len, skóra, kolczuga | 5 + kotwica | 3×2, 4:3 | ✅ v1 przyjęty i wpięty — §7.4 |
| 5 | nogi: metal | 5 + 3 kotwice | **4×2, 16:9** (było 3×2 — §8.0) | ✅ v1 przyjęty i wpięty — §8.4 |
| 6 | buty | 8 | 4×2, 16:9 | ✅ v2 (z przodu) przyjęty i wpięty — §9.4 |
| 7 | rękawice + naramienniki | 5 + 4 | zamówione 3×3 / 1:1, przyszło 5×2 / 16:9 | ✅ v1 przyjęty i wpięty — §10.4 |

**Kotwica stylu** = jedna sztuka z poprzedniego, udanego arkusza narysowana
ponownie w nowym. Tak jak miecz we wsadzie mieczy dwuręcznych: trzyma skalę
i styl między arkuszami. ⛔ Nie jako załączony obraz — Gemini zaczyna
załączoną broń/przedmiot **edytować** (lekcja z §3 pliku broni).

Wsad dostaje pełną sekcję dopiero wtedy, gdy jest robiony. Po wsadzie 1
blok stylu (§3) może się zmienić — dlatego reszta czeka.

⭐ **Decyzja autora 2026-09-28: PILOT najpierw.** Wsad 1 (głowa) idzie
przez CAŁY potok — obróbka, żelazne warianty, wpięcie do gry, ocena
w grze — ZANIM powstanie kolejny arkusz. Przy broniach prompt zmieniał się
po każdym przejściu przez obróbkę; sześć arkuszy naraz oznaczałoby sześć
powtórek.

---

## 3. Stały blok stylu dla pancerza (angielski — wklejany na POCZĄTKU)

```text
Create a completely NEW pixel-art image from scratch. The attached picture of
wooden shields is ONLY a style sample: do not edit it, do not redraw it, and
do not put any shields in the result.

The image contains NO text of any kind: no titles, no captions, no item names,
no letters, no numbers, no labels.

STYLE (take it from the attached shields): true pixel art. Every art pixel is a
crisp, perfectly square block of ONE flat colour; all blocks are the same size
and sit on one global grid. No anti-aliasing, no soft edges, no gradients, no
blur, no glow. A 1-pixel very dark brown-black outline (#0E0905) around every
object. Light from the top-left. Each material uses 3-5 flat tones stepped by
hand. Silhouette first, detail second - every object must still be
recognisable when shrunk to 32 pixels.

BACKGROUND: solid flat magenta #FF00FF everywhere outside the objects. No floor,
no shadow, no vignette, no frame, no grid lines between the objects.

MATERIALS - each must be recognisable by its surface pattern alone:
- Linen: unbleached warm off-white and pale beige, soft folds.
- Quilted (padded) linen: the same linen, thicker, with clearly visible
  parallel quilting lines (vertical ribs).
- Leather: warm browns (red > green > blue), base about #734B30, shadows down
  to #2B1B10, highlights up to #C0896A. Hardened leather is darker, smoother
  and a little glossier.
- Mail (chainmail): cool grey with a fine regular CHECKERBOARD dot pattern of
  rings over the whole surface. The checkerboard is what makes it mail - no
  smooth areas.
- Lamellar: many small narrow vertical steel plates arranged in horizontal
  rows, laced together with brown leather thongs.
- Scale: small rounded steel scales overlapping downward like fish scales.
- Plate: smooth steel surfaces, cool light grey, a crisp near-white highlight
  on the edges facing the top-left, darker blue-grey on the far side.
- No gold, no brass, no gems, no engravings, no heraldry, no runes, no
  decorative trim. Grounded, historical, practical medieval - not fantasy.

VIEW - THE SAME FOR EVERY ITEM: strictly FRONT view, the camera looking
straight at the front of the item at eye level. No three-quarter view, no side
view, no turning, no tilt, no perspective. The left and right halves of every
item are mirror images of each other.

LAYOUT OF EVERY ITEM: shown alone, centred in its square and filling most of
it (a small margin on every side). No body, no mannequin, no head or hands
inside the item.
```

⚠ **Akapit VIEW dopisany po wsadzie 1 v1** — samo „from the front,
symmetrical" w LAYOUT nie wystarczyło: 4 z 8 sztuk przyszły w 3/4 (§4.4).

---

## 4. WSAD 1 — głowa (8 konstrukcji)

### 4.1 Lista

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA (ma przeżyć 32 px) |
|---|---|---|---|---|
| 1 | Czepiec | `cloth_coif` | L1 | cienki len, **tasiemki pod brodą**, najtańszy |
| 2 | Czepiec pikowany | `padded_cap` | L1 | ten sam kształt, ale **pionowe wałki pikowania**, grubszy |
| 3 | Skórzany kaptur | `leather_helmet` | L2 | **brąz**, kaptur z osłoną szyi, owal twarzy |
| 4 | Kaptur kolczy | `mail_coif` | L2 | **szachownica kółek** + **opad na kark i barki** |
| 5 | Czepiec lamelkowy | `lamellar_coif` | L3 | **rzędy wąskich blaszek** na rzemieniu, przylega do czaszki |
| 6 | Stalowy hełm | `steel_helmet` | L3 | **„garnek"**: płaski wierzch, walec, **szczelina wzroku** |
| 7 | Szyszak | `spangenhelm` | L3 | **stożek z ożebrowaniem**, bez ronda i bez nosala |
| 8 | Kapalin | `kettle_hat` | L3 | **szerokie rondo** |

Z palety, bez rysunku: `iron_coif` ← `mail_coif`, `iron_helmet` ← `steel_helmet`.

⚠ **„Stalowy hełm" to hełm garnczkowy** — opis żelaznego bliźniaka w grze
mówi wprost *„ten sam garnek co stalowy"*. ⚠ **„Szyszak" ma id `spangenhelm`**
i opis spangenhelmu (*„kuty dzwon z żelaznym ożebrowaniem, bez ronda i bez
zasłony"*) — prompt rysuje to, co mówi opis, nie historyczny szyszak
z karkiem i policzkami. Rozjazd nazwa ↔ opis to sprawa contentowa, nie
graficzna.

### 4.2 Prompt

Proporcje obrazu **16:9**. Załącznik: **tylko**
`docs/art-review/gemini/ref_style_shields.png`. **Nowy czat.** Blok z §3,
a pod nim:

```text
TASK: one image divided into eight equal invisible squares, 4 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One piece of head armour per square, all eight in exactly
the same style. Order: top row left to right = items 1-4, bottom row left to
right = items 5-8.

1. A plain linen coif: a thin, close-fitting cap of unbleached off-white
   linen covering the top and sides of the head and the ears, with two thin
   ties hanging below where the chin would be. Soft, cheap, no padding.
2. A padded arming cap: the same close-fitting shape as item 1 but clearly
   thicker, made of quilted linen with visible vertical quilting ribs, a
   rolled padded edge around the face, and two ties under the chin.
3. A leather hood: brown leather, covering the head, ears and neck down to the
   shoulders, with an oval opening for the face and a visible seam over the
   crown.
4. A mail coif: the same hood shape as item 3, but made of steel CHAINMAIL.
   Its whole surface - crown, sides and cape - is covered with a fine,
   regular checkerboard of alternating light and dark grey pixels, like
   tiny rings; there is NO smooth grey area anywhere on it. An opening for
   the face, and a wide mail cape falling over the neck and the tops of the
   shoulders. Without the checkerboard it would be wrong.
5. A lamellar cap: a rounded skullcap built from rows of small narrow
   vertical steel plates, three or four horizontal rows, laced together with
   thin brown leather thongs. It hugs the skull; no brim, no face guard.
6. A great helm (pot helm): a steel cylinder with a flat top that covers the
   whole head and face. A narrow horizontal eye slit across the front and a
   few small breathing holes below it. It must look like an upturned pot.
7. A spangenhelm: a pointed conical steel helmet made of segments joined by
   four riveted metal ribs that run from the rim up to the point, with a
   riveted band around the rim. No brim, no nose guard, no face guard.
8. A kettle hat: an open steel helmet with a rounded crown and a very wide,
   flat brim all around, like a hat.

The eight items must be recognisable from each other by outline alone:
soft cap, quilted cap, hood, mail hood with cape, segmented skullcap,
flat-topped pot, pointed cone, wide-brimmed hat.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, and no shields.
```

### 4.3 Ocena (odrzuć od razu, jeśli…)

- któraś sztuka zawiera głowę, twarz albo manekina;
- **kaptur kolczy nie ma szachownicy** albo ma gładkie płaty — to jest cała
  jego tożsamość;
- hełm garnczkowy nie ma płaskiego wierzchu, szyszak nie jest stożkiem,
  kapalin nie ma ronda;
- czepiec (1) i czepiec pikowany (2) są nie do odróżnienia;
- złoto, klejnoty, herby, zdobienia, napisy;
- coś przecina granicę komórki albo tło nie jest jednolitą magentą.

Pojedyncza nieudana komórka nie wymaga nowego arkusza — opisz poprawkę.

### 4.4 Wynik v1 (2026-09-28) — ODRZUCONY, v2 z poprawionym promptem

`armor_head_v1_raw.png` (240×134):

- ⛔ **Widok niespójny:** czepiec, czepiec pikowany, oba kaptury i hełm
  garnczkowy w 3/4, reszta z przodu. Autor: widok boczny nie. Poprawka:
  akapit VIEW w bloku stylu (§3).
- ⛔ **Kaptur kolczy bez szachownicy** — gładki szary płat, czyta się jak
  przebarwiony skórzany kaptur. Poprawka: opis faktury jako „szachownica
  pikseli, zero gładkich płatów".
- ⚠ Sztuki mają **40–58 px** zamiast ≤30 — Gemini nie trzymało siatki
  32 px, więc piksele i tak nie pójdą wprost (§1, ostatni wiersz).
- ✅ Do zachowania: garnczkowy (płaski wierzch, szczelina, otwory), szyszak
  (stożek z ożebrowaniem), kapalin (rondo), czytelna różnica czepiec ↔
  czepiec pikowany.

### 4.5 Wynik v2 (2026-09-28) — PRZYJĘTY jako projekt

⚠ Plik nazywa się `armor_head_v1_raw.png` (239×134) — autor nadpisał nim
odrzucony v1. Nazwa zostaje; ten wpis mówi, co w nim jest.

- ✅ **Wszystkie osiem z przodu i symetrycznie** — akapit VIEW zadziałał.
- ✅ **Kaptur kolczy ma szachownicę na całej powierzchni.**
- ✅ czepiec ↔ czepiec pikowany, kaptur skórzany ↔ kolczy (ten sam kształt,
  inna faktura), lamelka (rzędy + wiązanie), garnczkowy, kapalin.
- ⚠ **Szyszak zgubił ożebrowanie** (w v1 było) — gładki stożek z opaską.
  Sylwetka nadal jedyna w arkuszu; żebra dołożyć przy obróbce albo
  poprawką pojedynczej komórki.

**Test zejścia do 28 px** (skrypt jednorazowy, poza repo): zwarte bryły
czytają się dobrze nawet przy 1× — **inaczej niż cienkie jelce mieczy**
(`gemini_weapon_icons.md` §9). ⛔ **Faktura kolczugi NIE przeżywa**:
najbliższy sąsiad rozbija szachownicę na łaty (mora), uśrednianie zlewa ją
w gładką szarość — czyli w materiał, którym kolczuga nie jest. Stąd
hybryda w §1: kształt i cieniowanie z Gemini, szachownica nakładana
natywnie na maskę kolczugi po zmniejszeniu.

### 4.6 Pilot w kodzie (2026-09-28) — czeka na ocenę autora w grze

Generator: `tools/build_armor_icons.py` (przymiar; `--podglad`, `--zapisz`).
Potok z §1, 10 ikon `public/assets/items/icon_armor_*.png`, wpięte przez
`iconTexture` (znacznik `PILOT ikon pancerza` w `GameConfig.ts`, lista
`ASSETS.iconArmor`, pętla w `Assets.ts`).

Poprawki znalezione WYŁĄCZNIE na renderze (raport był zielony):
- **szczelina wzroku garnczkowego zbladła** — czerń arkusza przyciągała się
  do najciemniejszej stali; kontur dopuszczony jako ton wewnętrzny;
- **żelazo z rampy noża czytało się jako BRĄZ** na dużej płaszczyźnie —
  żelazo pancerza dostało własną, szarszą rampę (rampa noża nietknięta);
- **prześwit pod brodą czepca pikowanego** — dziurę zamykają dopiero
  obwódki tasiemek, więc zaślepianie idzie PO konturze, tonem wnętrza
  (kontur dawał czarną plamę).

**Dopracowanie wg wzorca czytelności — tarcze i sztylety (autor,
2026-09-28).** Półka porównawcza pokazała trzy różnice, poprawione:
- **skóra za ciemna** — kaptur skórzany miał najjaśniejszy piksel 84,
  tarcze z tego samego drewna 150. Najbliższy kolor decyduje teraz wyłącznie
  o MATERIALE, a jasność skóry i lnu jest rozciągana na dozwolone stopnie
  (`wyrownaj`). Skóra: `DROBNE` z `wood_palette.py` — lamelka zeszła
  z 15 do 10 kolorów, kaptur skórzany z 9 do 5 i ma dziś zakres 10–129;
- ⛔ **stali NIE rozciągamy** — próbowane: wybieliło kaptur kolczy
  i położyło szachownicę w otworze twarzy; najbliższy kolor już daje stali
  pełen zakres 10–224;
- **za małe** — 28 px przy 29–30 u tarcz i sztyletów → 30 px;
- **samotne piksele konturu** w środku sylwetki (kropkowany brzeg otworu
  kaptura) → kolor sąsiadów. ⚠ Poza sztukami `otwory=True` (garnczkowy —
  otwory oddechowe to ten sam kształt).

Miara szachownicy przerobiona na wzór 2×2 (była: kolczuga 0,63 / lamelka
0,59 — nierozróżnialne; jest: 0,76 / 0,00). Sześć asercji, każda sprawdzona
psuciem danych.

⚠ **Rampy stali / żelaza / lnu są lokalne w generatorze** — do przeniesienia
do wspólnego standardu metalu, gdy powstanie (OI-126), razem z pytaniem, czy
żelazo noża ma przejść na szarszą rampę pancerza.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_head_v1_raw.png` (surowy
z Gemini) i — jeśli przepuścisz przez Pixel Snapper — `armor_head_v1_snap.png`
w natywnej siatce (≈128×64), **bez skalowania w górę**, paleta szeroko
(24–32 kolory). Oba pliki są potrzebne: wsad 1 rozstrzyga, czy piksele
Snappera nadają się wprost (§1, ostatni wiersz).

---

## 5. WSAD 2 — klata: len i skóra (6 konstrukcji)

### 5.1 Lista

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA |
|---|---|---|---|---|
| 1 | Koszula | `linen_shirt` | L1 | blady len, **luźne długie rękawy**, rozcięcie pod szyją |
| 2 | Przeszywanica | `gambeson` | L1 | **gruba, długa do ud**, szerokie PIONOWE wałki, rękawy |
| 3 | Kaftan pikowany | `arming_doublet` | L1 | **dopasowany, do pasa**, gęste drobne pikowanie, guziki z przodu |
| 4 | Skórzany kaftan | `leather_chest` | L2 | brąz, **krótkie rękawy**, sznurowanie z przodu |
| 5 | Skórzany ćwiekowany | `studded_leather` | L2 | brąz **bez rękawów**, **gęsta siatka ćwieków** |
| 6 | Napierśnik skórzany | `hardened_leather_chest` | L2 | **sztywna, formowana skorupa** torsu, bez rękawów, paski na barkach |

Trzy sztuki lniane różnią się **długością i grubością**, trzy skórzane —
**rękawem i fakturą** (gładka / ćwieki / sztywna skorupa).

### 5.2 Prompt

Proporcje **4:3**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 (z akapitem VIEW), a pod nim:

```text
TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One torso garment per square, laid out flat and seen from
the front, all six in exactly the same style. Order: top row left to right =
items 1-3, bottom row left to right = items 4-6.

1. A plain linen shirt: pale unbleached linen, loose and soft, long wide
   sleeves spread slightly outwards, a short slit at the neck. Thin cloth,
   the cheapest item in the image.
2. A gambeson: a thick padded linen coat reaching down to the thighs, with
   long sleeves. Its whole surface is quilted in wide, clearly raised
   VERTICAL ribs. It looks heavy and puffy.
3. An arming doublet: a close-fitting quilted linen jacket that ends at the
   waist, with long narrow sleeves. Dense, fine quilting in thin lines and a
   row of small buttons down the front. Clearly thinner and shorter than the
   gambeson.
4. A leather jerkin: plain smooth brown leather, short sleeves, reaching the
   hips, with a leather lacing closing the front.
5. Studded leather armour: a sleeveless brown leather vest reaching the hips,
   covered all over with a dense regular grid of small round iron studs.
6. A hardened leather breastplate: a rigid, moulded dark brown leather shell
   shaped like a torso, with a slight vertical ridge down the middle, no
   sleeves, and two leather straps over the shoulders. It looks stiff, like
   a board, not like cloth.

The six items must be recognisable from each other by outline and surface
alone: loose shirt, long puffy coat, short fitted jacket, jerkin with short
sleeves, studded vest, rigid moulded shell.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no body inside the garments, and no shields.
```

### 5.3 Ocena (odrzuć od razu, jeśli…)

- widok nie jest prosto z przodu albo w ubraniu jest ciało/manekin;
- przeszywanica nie jest wyraźnie dłuższa i grubsza od kaftana pikowanego;
- ćwiekowany nie ma siatki ćwieków; napierśnik skórzany wygląda jak
  miękki kaftan;
- złoto, zdobienia, napisy.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_chest_soft_v1_raw.png`.

### 5.4 Wynik v1 (2026-09-28) — TREŚĆ dobra, PIKSELE za miękkie

`armor_chest_soft_v1_raw.png` (454×151, czyli 3:1 zamiast 4:3):

- ✅ **Wszystkie sześć konstrukcji trafione:** luźna koszula, długa
  przeszywanica w pionowe wałki, dopasowany kaftan z guzikami, skórzany
  kaftan z krótkim rękawem i sznurowaniem, kamizelka ćwiekowana, sztywna
  skorupa z paskami.
- ⛔ **Krata złamana:** 7 sztuk porozrzucanych, skórzany kaftan DWA razy,
  przeszywanica przez oba rzędy, tło w kilku odcieniach magenty.
  Obsłużone w generatorze — wycinanie `plama` zamiast `grid` (każda sztuka
  to osobna spójna plama; kaftan wzięty dolny).
- ⛔ **Arkusz MIĘKKI** (rozmyte krawędzie, cieniowanie gradientem), a
  zmniejszenie ~3,3x (hełmy ~1,8x, arkusz ostry). Po obróbce len i skóra są
  plamiste, a ćwieki, guziki i wałki ginęły.

Co próbowane w generatorze:
- ✅ `wygladz` — filtr większościowy 3x3 na stopniach w obrębie materiału;
- ✅ `faktura` natywna po zmniejszeniu — `walki` (przeszywanica), `guziki`
  + poziome szwy (kaftan pikowany), `cwieki` (siatka, kolor `STEEL[2]` —
  `STEEL[3]` czytał się jak groszki);
- ⛔ **światło liczone z sylwetki** (gradient jak u tarcz + detal z arkusza)
  — ODRZUCONE: wyciąganie detalu wzmocniło szum miękkiego arkusza, a
  napierśnik skórzany stracił wyprofilowanie, które niosło właśnie światło
  Gemini. Kod usunięty.

⭐ **Zasada autora (2026-09-28): „mamy wsad, ale efekt końcowy to i tak
nasza robota".** Oba arkusze przeszły już przez Pixel Snapper (redukcja do
64 kolorów) — miękkość nie jest do odrobienia po stronie źródła i nie jest
powodem do ponownego losowania. Obróbka ma dawać wynik z KAŻDEGO wsadu
o poprawnej treści.

✅ **Rozwiązanie: tony PRZED zmniejszeniem, zmniejszenie GŁOSOWANIEM**
(`zmniejsz_glosowaniem`, sztuki z `wygladz=True`):
1. przyciągnięcie do ramp + `wyrownaj` w PEŁNEJ rozdzielczości arkusza,
2. 3 przebiegi `wygladz` w pełnej rozdzielczości,
3. zmniejszenie mapy tonów — docelowy piksel dostaje ton przeważający
   w swoim polu; średnia nie powstaje, więc nie powstają tony pośrednie,
4. `zdejmij_obwodke` — obwódka arkusza przeżywa głosowanie jako pas
   konturu, a `na_kafel` dokłada drugi (wychodziło 2 px czerni przy 1 px
   u tarcz i sztyletów),
5. `wygladz` na kaflu + faktury natywne.
Koszula, skórzany kaftan (sznurowanie wreszcie widać) i napierśnik
skórzany wyszły czysto; przeszywanica ma nieregularne pasy, ale czyta się
jako pikowana. Zapisane i wpięte jak hełmy (`ASSETS.iconArmor`).

⚠⚠ **Generator NIE BYŁ deterministyczny** — złapane przy tej okazji,
bo SHA1 kaptura skórzanego zmienił się bez zmiany kodu. Remis głosów
rozstrzygał `max(set(krotki z napisem))`, a kolejność takiego zbioru
zależy od losowego haszowania napisów w Pythonie. Naprawa: `wiekszosc()`
(remis → porządek sortowania). Sprawdzone: trzy przebiegi
z `PYTHONHASHSEED` 1/2/3 dają identyczne sumy.

---

## 6. WSAD 3 — klata: kolczuga i metal (7 konstrukcji + kotwica)

### 6.1 Lista

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA (ma przeżyć 30 px) |
|---|---|---|---|---|
| 1 | Kolczuga | `mail_hauberk` | L2 | **szachownica**, **długa do kolan**, **długie rękawy** |
| 2 | Kolczuga krótka | `short_hauberk` | L2 | ta sama szachownica, ale **do pasa** i **rękaw do łokcia** |
| 3 | Pancerz lamelkowy | `lamellar_chest` | L3 | **poziome pasy wąskich pionowych blaszek**, brązowe wiązanie, **bez rękawów** |
| 4 | Pancerz łuskowy | `scale_chest` | L3 | **łuski zachodzące w dół** (łuki „U"), **brzeg skóry** przy szyi i dole, krótki rękaw z łusek |
| 5 | Stalowy napierśnik | `steel_chest` | L3 | **jedna gładka płyta**, grzbiet środkowy, **kończy się w pasie**, dwa rzemienie na barkach |
| 6 | Brygantyna | `brigandine` | L3 | **płótno ciemnej czerwieni** + **rzędy par nitów**, bez rękawów, do bioder |
| 7 | Kirys | `cuirass` | L3 | napierśnik **+ krawędź naplecznika** za barkami i bokami, klamry, **fartuch z 3 lameli** pod pasem — największa bryła |
| 8 | *(kotwica)* Skórzany kaftan | `leather_chest` | — | przerysowany ze wsadu 2; trzyma skalę torsu między arkuszami, **pikseli nie bierzemy** |

Z palety, bez rysunku: `iron_hauberk` ← `mail_hauberk`,
`iron_chest` ← `steel_chest`.

**Pary, które muszą się rozejść na jednym arkuszu** (gracz porównuje je
w tym samym slocie; lamelka, łuska i napierśnik dzieliły dotąd kafel `(2,26)`):
- **kolczuga ↔ kolczuga krótka** — fakturę nakładamy natywnie i będzie
  IDENTYCZNA (§4.5), więc różnicę niesie **wyłącznie sylwetka**: długość
  i rękaw. Stąd rękaw do łokcia w krótkiej, choć opis w grze mówi tylko
  „do pasa";
- **lamelka ↔ łuska** — identyczne statystyki, dotąd ten sam placeholder.
  Faktura (prostokąty w pasach ↔ łuki w dół) plus rękaw (brak ↔ krótki
  z łusek) plus brzeg skóry podkładu u łuskowego;
- **napierśnik ↔ kirys** — w widoku z przodu naplecznika nie widać, więc
  kirys dostaje to, czego napierśnik NIE ma: krawędź naplecznika wystającą
  za barkami i bokami, klamry i fartuch z lameli. Napierśnik zostaje
  najprostszą bryłą arkusza.

⚠ **Brygantyna vs skórzany ćwiekowany (wsad 2)** — obie to kamizelka
z metalowymi łebkami. Rozdziela je **materiał** (płótno, nie skóra) i **układ
nitów** (pasy par wzdłuż ukrytych płytek, nie równa siatka). ⚙ **Decyzja
domyślna do potwierdzenia: płótno ciemnej, spranej czerwieni** — jak
historyczne brygantyny kryte suknem. Brąz zlałby się ze skórą, a len
z przeszywanicą. Kolor nie jest zdobieniem (§3 zakazuje herbów i złota, nie
barwionego płótna), ale **generator nie ma dziś rampy płótna** — dojdzie
lokalnie jak rampy stali/lnu (OI-126).

⚠ **Napierśnik stalowy ↔ napierśnik skórzany (wsad 2)** mają zbliżoną
bryłę z założenia — to ta sama konstrukcja w dwóch materiałach. Rozdziela je
kolor materiału, i to wystarczy.

### 6.2 Prompt

Proporcje **16:9**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 (z akapitem VIEW), a pod nim:

```text
TASK: one image divided into eight equal invisible squares, 4 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One torso armour per square, laid out flat and seen from
the front, all eight in exactly the same style and drawn for the same body
size: the shoulders are equally wide in every square, so that the length of
each item is directly comparable. Order: top row left to right = items 1-4,
bottom row left to right = items 5-8.

Exactly eight items, each drawn exactly ONCE, each entirely inside its own
square. Nothing crosses into a neighbouring square and nothing is repeated.

1. A long mail hauberk: a steel CHAINMAIL shirt reaching down to the knees,
   with long sleeves down to the wrists, a round neck opening (no hood) and a
   short slit at the bottom front. Its whole surface - body and sleeves - is
   covered with a fine, regular checkerboard of alternating light and dark
   grey pixels, like tiny rings; there is NO smooth grey area anywhere on it.
2. A short mail shirt: the same chainmail and the same checkerboard as
   item 1, but it ends at the waist and its sleeves end at the elbows.
   Clearly shorter and lighter than item 1.
3. A lamellar cuirass: a sleeveless torso armour reaching the hips, built from
   five or six horizontal rows of small, narrow, vertical rectangular steel
   plates standing side by side, the rows laced together with thin brown
   leather thongs that show as dark brown lines between the rows. Straight,
   rectangular pattern.
4. A scale armour: a torso armour reaching the hips with short sleeves, made
   of small rounded steel scales overlapping downward like fish scales, every
   scale a small "U" shape. A thin edge of brown leather backing shows at the
   neck and along the bottom hem. Rounded pattern, not rectangular.
5. A steel breastplate: ONE smooth, rounded steel plate covering the chest and
   belly, with a slight vertical ridge down the middle and a crisp highlight
   on the upper left. It ends straight at the waist. Two narrow brown leather
   straps go over the shoulders. No sleeves, no skirt, no rivet rows. The
   simplest item in the image.
6. A brigandine: a sleeveless jacket of dark, faded red canvas reaching the
   hips, with small steel rivet heads arranged in neat horizontal rows of
   pairs across the whole front, showing where the hidden steel plates are.
   Cloth, not leather: flat matte red, no shine.
7. A full cuirass: a steel breastplate like item 5 but bigger and heavier,
   with the edge of the matching backplate visible behind it at the shoulders
   and along both sides, small steel buckles on the shoulder straps and at
   the sides, and below the waist a skirt of three overlapping horizontal
   steel bands. The largest and heaviest item in the image.
8. A leather jerkin: plain smooth brown leather, short sleeves, reaching the
   hips, with a leather lacing closing the front.

The eight items must be recognisable from each other by outline and surface
alone: long mail with long sleeves, short mail with elbow sleeves, sleeveless
rows of narrow plates, rounded scales with short sleeves, plain smooth plate,
red cloth with rivet rows, big plate with backplate edges and a banded skirt,
brown jerkin.
Every edge is a hard pixel edge; shading uses 3-5 flat stepped tones, never a
smooth gradient. The background is ONE exact flat colour, #FF00FF, with no
lighter or darker patches of magenta.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no body inside the armour, and no shields.
```

⚠ **Dwa zdania dopisane po wsadzie 2 (§5.4):** „dokładnie osiem, każda raz,
każda w swojej komórce" (tam było 7 sztuk, kaftan dwa razy, przeszywanica
przez dwa rzędy) i „tło w JEDNYM odcieniu" (tam kilka odcieni magenty).
Zdanie o twardych krawędziach to przypomnienie, nie nadzieja — generator
i tak obrabia miękki arkusz (`zmniejsz_glosowaniem`), więc sama miękkość
**nie jest powodem do ponownego losowania** (zasada autora z §5.4).

### 6.3 Ocena (odrzuć od razu, jeśli…)

- widok nie jest prosto z przodu albo w pancerzu jest ciało/manekin;
- **któraś kolczuga ma gładkie płaty** zamiast szachownicy — kształt
  i cieniowanie bierzemy z Gemini, a gładka szarość to materiał, którym
  kolczuga nie jest;
- **kolczuga i kolczuga krótka mają tę samą długość** — faktura będzie
  u nich identyczna, więc to jedyna różnica;
- lamelka i łuska mają ten sam wzór (obie prostokąty albo obie łuki);
- **napierśnik i kirys są tej samej wielkości** albo kirys nie ma fartucha
  z lameli;
- brygantyna jest brązowa albo ma równą siatkę ćwieków — to byłby skórzany
  ćwiekowany ze wsadu 2;
- złoto, mosiądz, zdobienia, herby, napisy.

Treść poprawna, piksele miękkie albo krata złamana → **przyjmujemy**
i obrabiamy (§5.4: wycinanie `plama`, tony przed zmniejszeniem). Pojedyncza
nieudana komórka nie wymaga nowego arkusza — opisz poprawkę. Kotwica (8)
nieudana — bez znaczenia, o ile skala torsu zgadza się z resztą.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_chest_metal_v1_raw.png`.

### 6.4 Wynik v1 (2026-09-28) — PRZYJĘTY, wpięty do gry

`armor_chest_metal_v1_raw.png` (240×131):

- ✅ **Pierwszy arkusz, który utrzymał kratę** — 8 plam, każda w swojej
  komórce, żadnej sztuki dwa razy. Dwa zdania dopisane po wsadzie 2
  zadziałały. Wycinanie `grid`, nie `plama`.
- ✅ **Ostry** (szachownica kolczugi co 1 px, płaskie tony) — ścieżka jak
  przy hełmach (BOX → rampy), bez `zmniejsz_glosowaniem`. Zejście ~2×.
- ✅ Wszystkie siedem konstrukcji trafione; kirys ma fartuch z lameli
  i klamry, brygantyna jest czerwona z rzędami nitów.
- ⚠ **Kolczuga nie wyszła „do kolan"** — jest tylko ~9% dłuższa od krótkiej
  (62 ↔ 57 px), a każda sztuka wypełnia kafel, więc długość się nie
  przenosi. Parę rozróżnia **rękaw** (do nadgarstka ↔ do łokcia) i rozcięcie
  u dołu. Czyta się; nie było powodu do ponownego losowania.
- ⚠ Krawędzi naplecznika kirysu po zejściu prawie nie widać — kirys niesie
  fartuch z lameli i klamry, to wystarcza przy napierśniku obok.

Co zrobił generator (`tools/build_armor_icons.py`, słownik `KLATA_METAL`):
- **rampa `canvas`** (sprana czerwień, próbkowana z arkusza) — decyzja
  domyślna z §6.1, ⏳ nadal do potwierdzenia przez autora;
- **trzy faktury natywne** — ta sama lekcja co przy ćwiekach: detal
  drobniejszy niż 2 px nie przeżywa zejścia 2×, a raport był zielony
  także BEZ nich. Wyszło wyłącznie na renderze:
  - `nity` (brygantyna) — sam BOX dał gołe, plamiste płótno. Najpierw
    wygładzenie płótna, potem nity. ⚠ **Pary nitów z arkusza w 1× zlewały się
    w białe paski** (płótno jak pasiak) → pojedyncze nity w RÓWNEJ kracie co
    3 px; ćwieki skóry idą w przesuniętą, więc się nie mylą;
  - `luski` (pancerz łuskowy) — sam BOX dał kropkowany szum, który czytał się
    jak jaśniejsza kolczuga. Pasy po 2 wiersze, łuska 3 px, pasy przesunięte;
  - `lamele` (pancerz lamelkowy) — pionowe blaszki zginęły, zostały same
    rzemienie. Szczelina co 3 px, tylko na stali;
- żelazne bliźniaki: `iron_hauberk` ← `mail_hauberk`, `iron_chest` ←
  `steel_chest`.

Kontrole: obie grupy klaty porównywane RAZEM (jeden slot, 15 sztuk).
Kontrola szachownicy sprawdzona psuciem na nowym arkuszu — szachownica na
napierśniku → `[X] gładki metal czyta się jak kolczuga (0.70)`. ⚠ Nie
łapie za to szachownicy nałożonej NA łuski (0,00: pasy łusek rozbijają
wzór 2×2) — to nie jest ochrona przed zepsuciem faktury łusek.
16 ikon zapisanych wcześniej: **bajt w bajt bez zmian** (SHA1 przed/po).

W grze: 9 tekstur `icon-armor-*` wczytanych 32×32, `dev.missing` puste,
`load.totalFailed` = 0, plecak pokazuje nowe ikony ostro (zrzut 1:1
`snapshotArea`).

### 6.5 Poprawka OBRYSU — wszystkie 25 ikon (2026-09-28)

⛔ **Zgłoszenie autora po wpięciu wsadu 3: „nieprzyzwoicie duży obrys".**
Dotyczyło całej rodziny, nie tylko wsadu 3 — raport był zielony od
pierwszego pilota. Pomiar: w drugim pierścieniu od krawędzi (tuż pod
konturem) **27–77% pikseli było konturem**, u tarcz drewnianych **0%**.
Dwie niezależne przyczyny:

1. **kontur z 8-sąsiedztwa** (`na_kafel`, wzięty od sztyletów) — na każdym
   skosie i zaokrągleniu wypełnia róg i czyta się jako 2 px. Tarcze biorą
   4-sąsiedztwo (`build_shield_icons.erozja`): linia cienka, schodek przez
   rogi. Sztyletom to nie szkodziło, bo głownia to proste odcinki;
2. **obwódka arkusza Gemini (2–3 px) nie była zdejmowana na ścieżce
   OSTREJ** — `zdejmij_obwodke` działał wyłącznie po `zmniejsz_glosowaniem`.

Każda przyczyna osobno dawała pogrubienie; dopiero obie poprawki razem
zeszły do **0–7%**. Skutek uboczny: cienki kontur nie domyka szpary po
skosie, prześwit pod brodą czepca pikowanego urósł do 17 px →
`zaslep_drobne_dziury` `maks` 12 → 20.

Nowa asercja `gruby_kontur` (próg 15% = wzorzec tarcz 0% + zapas na linie
wewnętrzne przy brzegu). **Sprawdzona psuciem obu przyczyn osobno:**
powrót do 8-sąsiedztwa → błąd na 25 ikonach; brak zdjęcia obwódki na
ścieżce ostrej → błąd na hełmach (26–42%). W grze sprawdzone zrzutem 1:1.

⏳ **Do oceny przez autora w grze:**
- **żelazo na dużej płycie** (`iron_chest`, `iron_hauberk`) czyta się
  oliwkowo-szaro — rampa `IRON` była strojona na hełmach, na napierśniku
  płaszczyzna jest największa w całym pancerzu. Nie ruszane: ta sama rampa
  niesie żelazny kaptur i hełm, a to sprawa wspólnego standardu metalu
  (OI-126);
- czerwień brygantyny (§6.1).

⭐ **Decyzja autora 2026-09-28: ocena CAŁOŚCI na telefonie, później.**
Wsady idą dalej bez czekania na ocenę pojedynczych arkuszy — pilot (§2)
spełnił swoją rolę, potok jest ustalony.

---

## 7. WSAD 4 — nogi: len, skóra, kolczuga (5 konstrukcji + kotwica)

### 7.1 Lista

⛔ **Wersja v0 tego wsadu (dwie osobne nogawice-rury u pikowanych
i kolczych) ODRZUCONA przed wysłaniem** — łamała regułę „slot nóg =
spodnie" (§1), którą autor doprecyzował dopiero na widok promptu: model 3D
gracza będzie w bieliźnie, a przedmioty nakładają się na niego jak w WoW.

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA (ma przeżyć 30 px) |
|---|---|---|---|---|
| 1 | Spodnie | `linen_trousers` | L1 | blady **cienki** len, **luźne, miękko fałdowane**, sznurek w pasie |
| 2 | Nogawice pikowane | `padded_chausses` | L1 | ten sam len, ale **grube i sztywne** — prosta, szeroka bryła, **pionowe wałki**, **wałek w pasie z trokami** |
| 3 | Skórzane nogawice | `leather_legs` | L2 | **brąz**, dopasowane, pas z klamrą |
| 4 | Nogawice kolcze | `mail_chausses` | L2 | **szachownica**, spodnie **do kostki**, rzemienny pas |
| 5 | Półnogawice kolcze | `demi_chausses` | L2 | ta sama szachownica, **krótkie — kończą się NAD kolanem**, sznurowane u dołu |
| 6 | *(kotwica)* Skórzany kaftan | `leather_chest` | — | ten sam co we wsadzie 3 — trzyma styl; **pikseli nie bierzemy** |

Z palety, bez rysunku: `iron_chausses` ← `mail_chausses`.

Wszystkie pięć to **spodnie: jedna bryła od pasa, zszyta w kroku.** Nazwy
„nogawice" zostają w grze — to sprawa contentowa, nie graficzna (jak
„Szyszak" ↔ spangenhelm, §4.1).

Dotąd pięć sztuk stało na trzech kaflach: spodnie i nogawice pikowane
dzieliły `(1,23)` (spodnie jako jawny placeholder), kolcze pełne i półnogawice
— wyprowadzony wariant jednej ikony.

**Pary, które muszą się rozejść:**
- **spodnie ↔ nogawice pikowane** — ten sam len i, po regule spodni, ten
  sam krój. Zostaje **grubość i faktura**: cienkie, luźne, rozszerzone
  fałdami ↔ grube, proste, sztywne, wałki pionowe (natywnie `walki`, jak
  przeszywanica), wałek w pasie. ⚠ **To najsłabsza para całej rodziny** —
  podobnie jak czepiec ↔ czepiec pikowany (§4.1), które rozeszły się na
  0,42–0,46 przy progu 0,25. Kontrola odrębności to zmierzy;
- **nogawice kolcze ↔ półnogawice** — szachownica natywna będzie
  identyczna (jak przy kolczugach, §6.1), więc różnicę niesie wyłącznie
  **długość**. Tu jest duża (do kostki ↔ nad kolano), a że każda sztuka
  wypełnia kafel, półnogawice wyjdą jako **szeroka, niska bryła** obok
  wysokich spodni — różnica, która przeżywa skalowanie;
- **spodnie ↔ skórzane nogawice** — ten sam krój, rozdziela je materiał
  (jak napierśnik stalowy ↔ skórzany, §6.1).

⚠ **Stopy:** żadna sztuka nie ma stóp ani butów. Historyczne nogawice
kolcze okrywały stopę, ale w grze stopa to osobny slot (`boots`) — kolcza
stopa w slocie nóg myliłaby się z butem kolczym (wsad 6).

⚠ **Kotwica = skórzany kaftan, drugi raz.** We wsadzie 3 Gemini narysowało
go czysto i w tej samej skali co resztę; nóg nie ma jeszcze na żadnym
arkuszu, więc żadna sztuka nóg nie może być kotwicą.

⚠ **Konsekwencja dla wsadu 5 (nogi: metal)** — do rozstrzygnięcia, zanim
powstanie jego prompt: nagolenniki, nagolennice segmentowe i nabiodrki
z nagolennikami to historycznie OSOBNE płyty na udo i goleń. Po regule
spodni każda z nich musi być narysowana jako zestaw zakładany od pasa
(np. płyty na spodniach albo zawieszone na pasie), nie jako dwie luźne
płyty.

### 7.2 Prompt

Proporcje **4:3**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 (z akapitem VIEW), a pod nim:

```text
TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One piece of leg wear per square, laid out flat and seen
from the front, waist at the top, all six in exactly the same style. Order:
top row left to right = items 1-3, bottom row left to right = items 4-6.

Exactly six items, each drawn exactly ONCE, each entirely inside its own
square. Nothing crosses into a neighbouring square and nothing is repeated.

Items 1-5 are all TROUSERS: one single garment from the waist down, with
the two legs sewn together at the crotch. Never two separate leg tubes.
No feet, no shoes and no boots on any item: every leg ends with an open hem.

1. Plain linen trousers: pale unbleached THIN linen, loose and soft, with
   soft folds and slightly wider legs, reaching the ankles, gathered at the
   waist by a thin drawstring with two short hanging ends. The cheapest item
   in the image.
2. Padded trousers: the same pale linen but THICK and stiff, quilted all
   over in wide, clearly raised VERTICAL ribs, reaching the ankles. Straight,
   wide, puffy legs, a thick rolled padded waistband with two short ties.
   Clearly heavier and bulkier than item 1.
3. Leather trousers: plain smooth brown leather, fitted close to the legs,
   reaching the ankles, with a leather belt and a small iron buckle at the
   waist.
4. Mail trousers: steel CHAINMAIL trousers reaching down to the ankles, with
   a brown leather belt at the waist. Their whole surface is covered with a
   fine, regular checkerboard of alternating light and dark grey pixels,
   like tiny rings; there is NO smooth grey area anywhere.
5. Short mail breeches: steel CHAINMAIL breeches that END ABOVE THE KNEES,
   with a brown leather belt at the waist and a brown leather lace across
   the bottom of each leg. The same checkerboard as item 4. Clearly much
   shorter than item 4 - wide and low, not tall.
6. A leather jerkin: plain smooth brown leather, short sleeves, reaching the
   hips, with a leather lacing closing the front.

The six items must be recognisable from each other by outline and surface
alone: thin loose linen trousers, thick ribbed padded trousers, fitted brown
trousers with a belt, long mail trousers, short wide mail breeches, brown
jerkin.
Every edge is a hard pixel edge; shading uses 3-5 flat stepped tones, never a
smooth gradient. The background is ONE exact flat colour, #FF00FF, with no
lighter or darker patches of magenta.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no body or legs inside the clothing, and no shields.
```

### 7.3 Ocena (odrzuć od razu, jeśli…)

- w ubraniu są nogi, ciało albo manekin; któraś sztuka ma stopy lub buty;
- **któraś z sztuk 1–5 to dwie osobne nogawice** zamiast spodni zszytych
  w kroku — reguła slotu (§1);
- **spodnie i spodnie pikowane nie różnią się grubością** — obie cienkie
  albo obie z wałkami;
- **półnogawice sięgają kolana lub niżej** — z identyczną szachownicą
  długość jest ich jedyną cechą;
- któraś kolczuga ma gładkie płaty zamiast szachownicy;
- złoto, zdobienia, napisy.

Treść poprawna, piksele miękkie albo krata złamana → **przyjmujemy**
i obrabiamy (§5.4). Pojedyncza nieudana komórka nie wymaga nowego arkusza.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_legs_soft_v1_raw.png`.

### 7.4 Wynik v1 (2026-09-28) — PRZYJĘTY, wpięty do gry

`armor_legs_soft_v1_raw.png` (240×131) — **zamówione 3×2 / 6 sztuk, przyszło
4×2 / 8.** Krata utrzymana (każda sztuka w swojej komórce), więc wycinanie
`grid` (2, 4). Arkusz ostry — ścieżka jak hełmy i wsad 3.

- ✅ **Reguła spodni trzymana** — wszystkie sztuki zszyte w kroku.
- ✅ spodnie ↔ spodnie pikowane: fałdy i sznurek ↔ pionowe wałki i gruby
  wałek pasa. **Wałki przeżyły zejście bez faktury natywnej** (inaczej niż
  przeszywanica z miękkiego arkusza). Najsłabsza para z §7.1 rozeszła się
  mocniej niż czepce (najbliższa para całej rodziny dalej: czepce 0,46).
- ✅ nogawice kolcze do kostki ↔ półnogawice: po wypełnieniu kafla
  półnogawice są szeroką, niską bryłą — różnica przeżywa skalowanie.
- ⚠ Dwie sztuki NADMIAROWE, pominięte: (0,3) drugie skórzane spodnie
  **bez pasa**, (1,2) kolcza „spódnica" z rozcięciem. Wzięte skórzane
  z pasem i klamrą — zgodnie z promptem. Kotwica (1,3) wyszła bez rękawów;
  bez znaczenia, pikseli nie bierzemy.

Obróbka — ścieżka wybierana **per sztuka**, porównaniem na renderze:
- `leather_legs` przez głosowanie (`wygladz=True`) — dopiero tam pas
  z klamrą czyta się jako pas; na ścieżce ostrej był plamą;
- ⛔ `linen_trousers` NIE — głosowanie zjadało fałdy, a fałdy są cechą, która
  odróżnia je od sztywnych pikowanych;
- ⛔ `demi_chausses` NIE — szum w kolczudze i **podwójny obrys (29%)**:
  nowa kontrola `gruby_kontur` (§6.5) zaświeciła na czerwono przy
  pierwszej próbie.

`iron_chausses` ← `mail_chausses` z palety. W grze: 6 tekstur 32×32,
`dev.missing` puste, `load.totalFailed` = 0, plecak pokazuje nowe ikony.

---

## 8. WSAD 5 — nogi: metal (5 konstrukcji + 3 kotwice)

⭐⭐ **Zasada warstwy (§1, decyzja autora 2026-09-30): ikona L3 pokazuje
WYŁĄCZNIE metal i jego własne mocowanie.** Żadnych spodni, lnu ani
przeszywanicy pod spodem. Wariant 1 z 2026-09-28 („płyty NA spodniach”)
**odwołany przed wysłaniem promptu** — zob. §8.0b.

### 8.0 Zmiana układu przed wysłaniem (2026-09-30): 3×2 → 4×2

Bilans sześciu arkuszy Gemini (4 pancerza + 2 mieczy):

| zamówione | arkusze | wynik |
|---|---|---|
| 4×2, 16:9 | hełmy, klata metal, miecze 1H, miecze 2H | ✅ krata trzymana za każdym razem (235–240 × 131–134) |
| 3×2, 4:3 | klata len/skóra, nogi len/skóra | ⛔ **oba złamane**: 7 sztuk w 3:1 z duplikatem; 8 sztuk w 16:9 z dwiema zmyślonymi |

**Gemini nie trzyma 4:3 — oddaje 16:9 i dopycha komórki czymś
wymyślonym.** Wsad 4 przeszedł tylko dlatego, że nadmiarowe sztuki dało się
pominąć. Wsad 5 idzie więc w układzie, który Gemini i tak rysuje: **4×2
i osiem sztuk**; dwie wolne komórki idą na dodatkowe kotwice ze wsadu 4
(spodnie pikowane, skórzane nogawice), a nie na zmyślenia Gemini.
⚙ Tę samą zmianę stosować w kolejnych wsadach zaplanowanych na 3×2 (§2:
wsad 7 ma 3×3, do sprawdzenia przy jego prompcie).

### 8.0b Odwołanie wariantu 1 (2026-09-30)

Zgłoszenie autora na widok promptu v1.1: *„część przedmiotów wygląda już jako
połączone warstwowane, zwłaszcza blacha i przeszywanice”*.

Warstwa jest wyprowadzana z materiału (`ArmorLayers.itemLayer`: len
i przeszywanica → L1, skóra i kolczuga → L2, metal → L3), a obszar nóg
przyjmuje **wszystkie trzy naraz**. Ikona „płyty na spodniach pikowanych”
to więc **L1 + L3 w jednym przedmiocie**: gracz w nogawicach pikowanych
i stalowych nagolennikach widziałby przeszywanicę dwa razy, a na modelu 3D
dwie warstwy lnu jedna na drugiej. To samo z lamelką, łuską i szynami „na
skórzanych spodniach” (L2 + L3).

Klata od początku szła tą zasadą (stalowy napierśnik = sama płyta
z rzemieniami, bez przeszywanicy — §6); nogi były wyjątkiem.

**Co wolno w ikonie L3** — rzeczy, które są częścią TEJ konstrukcji:
- pas i rzemienie, na których metal wisi;
- podkład, bez którego konstrukcja nie istnieje (łuska, lamelka, szyny są
  do czegoś naszyte/nitowane), ale **widoczny tylko jako brzeg, wiązanie
  albo wąskie pasy między szynami** — nigdy jako płat tkaniny czy skóry;
- ⛔ **nigdy blady len z wałkami** — to jest wygląd przedmiotu L1.

Gdzie metal nie kryje, **prześwituje tło**. Gołe fragmenty nogi przy samym
L3 na modelu 3D są uczciwym skutkiem założenia samej blachy — pod spód
zakłada się L1/L2. Reguła „slot nóg = jedna bryła od pasa” (§1) zostaje:
obie nogi łączy **pas**, nie tkanina w kroku.

⚙ **Ta sama zasada obowiązuje wsad 6 (buty) i każdy inny obszar
warstwowany:** ikona warstwy nie zawiera przedmiotu innej warstwy (np.
trzewik płytowy bez skórzanego buta pod spodem).

### 8.1 Lista

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA (ma przeżyć 30 px) |
|---|---|---|---|---|
| 1 | Nogawice lamelkowe | `lamellar_legs` | L3 | **długie panele lamelki** od biodra po kostkę, drobne pionowe blaszki w poziomych rzędach; brąz tylko jako wiązanie |
| 2 | Nogawice łuskowe | `scale_legs` | L3 | **łuska jest całą powierzchnią** nogi od biodra po kostkę (łuki „U” w dół), brzeg skóry tylko u pasa i dołu |
| 3 | Stalowe nagolenniki | `steel_legs` | L3 | **dwie SZEROKIE gładkie płyty na nogę** (udo, goleń) na rzemieniach; **przerwa na kolanie**, między płytami prześwituje tło; najprostsza bryła |
| 4 | Nagolennice segmentowe | `splinted_greaves` | L3 | **3–4 WĄSKIE pionowe szyny** na udzie i goleni, nity, **wąskie pasy brązu** między szynami; kolano tylko ze skóry |
| 5 | Nabiodrki z nagolennikami | `cuisses` | L3 | **noga zakuta w całości**, ciągły metal od pasa do kostki, **nakolannik z wachlarzem**, **taszki z 2 lameli** pod pasem; największa bryła |
| 6 | *(kotwica)* Nogawice kolcze | `mail_chausses` | — | przerysowane ze wsadu 4 — trzymają skalę NÓG; **pikseli nie bierzemy** |
| 7 | *(kotwica)* Nogawice pikowane | `padded_chausses` | — | ze wsadu 4 — **pikseli nie bierzemy** |
| 8 | *(kotwica)* Skórzane nogawice | `leather_legs` | — | ze wsadu 4 — **pikseli nie bierzemy** |

Z palety, bez rysunku: `iron_legs` ← `steel_legs`.

**Dotąd wszystkie pięć stało na jednym kaflu `(2,27)`** (cztery jawne
placeholdery + stalowe) — najgorzej rozróżnialny slot w całym pancerzu.

**Pary, które muszą się rozejść:**
- **stalowe nagolenniki ↔ nabiodrki z nagolennikami** — ten sam układ co
  napierśnik ↔ kirys (§6.1): prostsza sztuka ma **przerwy** (dwie osobne
  tafle, tło na kolanie i nad goleniem), pełniejsza jest **ciągła**
  (nakolannik z wachlarzem, taszki u pasa). Taszki pełnią tu rolę fartucha
  kirysu — to cecha, którą widać w 1×;
- **lamelka ↔ łuska ↔ szyny** — trzy faktury metalu: drobne prostokąty
  w rzędach / łuki w dół / kilka długich pionowych pasów z brązem między
  nimi. Lamelka i łuska dostaną te same faktury natywne co klata (`lamele`,
  `luski`), więc gracz rozpozna materiał między slotami;
- **stalowe nagolenniki ↔ nagolennice segmentowe** — dwie SZEROKIE gładkie
  tafle z tłem między nimi ↔ WĄSKIE pionowe szyny z nitami na pasach brązu.
  ⚠ Po odwołaniu wariantu 1 zniknął rozdzielacz „len ↔ brąz pod spodem”;
  zostaje szerokość elementów i brąz między szynami.

⚠ **Kotwice 7–8 to dokładnie to, co gracz zakłada POD sztuki 1–5.** Stoją
na arkuszu osobno, żeby Gemini widziało tkaninę jako OSOBNY przedmiot —
prompt zakazuje jej wprost w sztukach 1–5. Jeśli Gemini mimo to zacznie
nakładać metal na te spodnie, przy v2 zamienić kotwice 7–8 na kotwice
z innego slotu (np. skórzany kaftan).

⚠ **Rozjazd opis ↔ grafika (sprawa contentowa, nie graficzna — jak
„Szyszak”, §4.1):**
- żelazne nagolenniki mają w grze opis *„szyny z odpadowego żelaza, nitowane
  na pasach”*, czyli konstrukcję nagolennic segmentowych. Grafika idzie za
  zasadą gatunku (żelazo = ta sama bryła co stal,
  `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`), więc ikona
  pokaże płyty;
- nogawice łuskowe: *„Łuska naszyta na nogawice od biodra po kostkę”* —
  po §8.0b „nogawice” to podkład łuski, niewidoczny spod niej. Opis może
  zostać.

### 8.2 Prompt (v2 — zasada warstwy)

Proporcje **16:9**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 (z akapitem VIEW), a pod nim:

```text
TASK: one image divided into eight equal invisible squares, 4 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One piece of leg armour or leg wear per square, laid out
flat and seen from the front, waist at the top, all eight in exactly the same
style and drawn for the same body size. Order: top row left to right = items
1-4, bottom row left to right = items 5-8.

Exactly eight items, each drawn exactly ONCE, each entirely inside its own
square. Nothing crosses into a neighbouring square and nothing is repeated.

Items 1-5 are METAL LEG ARMOUR ONLY. They are worn OVER separate trousers,
so draw NO trousers, NO cloth, NO linen and NO quilted padding under or
between the metal. Each of items 1-5 is one piece hanging from a brown
leather belt at the waist: the belt joins the two armoured legs at the top,
and everything below it is the armour itself with its own straps and
lacing. Wherever the metal does not cover the leg, the magenta background
shows through. No feet, no shoes and no boots: every leg ends at the ankle.

1. Lamellar leg armour: on each leg one long panel of lamellar from hip to
   ankle - many small narrow vertical steel plates standing side by side in
   horizontal rows, the rows laced together with thin brown leather thongs
   that show as dark brown lines. The lacing is the only leather visible.
   Straight, rectangular pattern.
2. Scale leg armour: each leg covered from hip to ankle entirely by small
   rounded steel scales overlapping downward like fish scales, every scale
   a small "U" shape. The scales ARE the whole surface; only a very thin edge
   of brown leather shows at the belt and at the bottom. Rounded pattern.
3. Steel leg plates: on each leg ONE wide smooth steel plate over the thigh,
   hanging from the belt on short brown straps, and ONE wide smooth steel
   plate over the shin, joined to the thigh plate by two short brown leather
   straps across the knee. The knee itself is an open gap between the
   plates with the background showing through. Two separate plates per leg.
   The simplest item in the image.
4. Splinted leg armour: on each leg three or four long, narrow, vertical
   steel strips over the thigh and again over the shin, riveted side by side
   onto narrow brown leather bands, with round rivet heads and thin stripes
   of brown leather between the strips. No plate on the knee - only the
   leather bands cross it.
5. Full plate legs: each leg completely enclosed in continuous steel from
   the belt down to the ankle - a thigh plate, a round knee cop with a small
   fan-shaped side wing, and a shin plate, all joined with no gaps. Below
   the belt hang two short overlapping horizontal steel bands (tassets). The
   two armoured legs are joined only by the belt and the tassets. The
   largest and heaviest item in the image.
6. Mail trousers: steel CHAINMAIL trousers reaching down to the ankles, the
   two legs sewn together at the crotch, with a brown leather belt at the
   waist. Their whole surface is covered with a fine, regular checkerboard of
   alternating light and dark grey pixels, like tiny rings; there is NO
   smooth grey area anywhere.
7. Padded trousers: pale linen, THICK and stiff, quilted all over in wide,
   clearly raised VERTICAL ribs, reaching the ankles, the two legs sewn
   together at the crotch, with a thick rolled padded waistband and two
   short ties. No metal on them at all.
8. Leather trousers: plain smooth brown leather, fitted close to the legs,
   reaching the ankles, the two legs sewn together at the crotch, with a
   leather belt and a small iron buckle at the waist. No metal on them at
   all.

The eight items must be recognisable from each other by outline and surface
alone: long panels of small laced plates, legs made entirely of scales, two
separate wide plates per leg with an open knee, narrow riveted strips with
leather between them, fully enclosed plate legs with knee cops and tassets,
mail trousers, plain quilted trousers, plain leather trousers.
Items 1-5 contain metal and straps only - never cloth or padding.
Every edge is a hard pixel edge; shading uses 3-5 flat stepped tones, never a
smooth gradient. The background is ONE exact flat colour, #FF00FF, with no
lighter or darker patches of magenta.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no body or legs inside the armour, and no shields.
```

### 8.3 Ocena (odrzuć od razu, jeśli…)

- ⛔ **któraś ze sztuk 1–5 ma pod metalem albo między nim spodnie, len,
  przeszywanicę albo płat skóry** — zasada warstwy (§8.0b). Wąskie pasy
  brązu między szynami (4), wiązanie lamelki (1) i brzeg skóry łuski (2) są
  dozwolone;
- któraś ze sztuk 1–5 to luźne płyty bez pasa — obie nogi muszą łączyć się
  pasem u góry;
- w pancerzu są nogi, ciało, stopy albo buty;
- **stalowe nagolenniki nie mają przerwy na kolanie** — wtedy zlewają się
  z nabiodrkami;
- **nabiodrki nie mają taszek ani nakolannika** — to ich jedyne cechy
  widoczne w 1×;
- szyny (4) wyglądają jak lamelka (1) — muszą być długie i nieliczne;
- złoto, zdobienia, napisy.

Treść poprawna, piksele miękkie albo krata złamana → **przyjmujemy**
i obrabiamy (§5.4). Pojedyncza nieudana komórka nie wymaga nowego arkusza.
Kotwice (6–8) nieudane — bez znaczenia, o ile skala nóg zgadza się z resztą.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_legs_metal_v1_raw.png`.

### 8.4 Wynik v1 (2026-09-30) — PRZYJĘTY, wpięty do gry

`armor_legs_metal_v1_raw.png` (245×136) — **krata 4×2 trzymana**, osiem
sztuk w swoich komórkach, arkusz ostry, tło w granicach progu `bez_tla`
(jeden piksel w paśmie 60–150). Zmiana układu z §8.0 zadziałała.

- ✅ **Zasada warstwy trzymana** — żadna ze sztuk 1–5 nie ma spodni, lnu ani
  płata skóry pod metalem; wszystkie wiszą na pasie.
- ✅ stalowe nagolenniki: dwie tafle na nogę, przerwa na kolanie;
  nabiodrki: nakolannik z wachlarzem, ciągły metal; szyny: wąskie pasy na
  brązie.
- ⚠ łuska w arkuszu wyszła drobnym rombem, blisko kolczugi z komórki 6 —
  bez znaczenia, bo faktura `luski` i tak idzie natywnie.
- ⚠ taszki nabiodrek prawie niewidoczne; nabiodrki niosą nakolannik.

Obróbka — ścieżka wybierana **per sztuka** na renderze (raport był zielony
już przy pierwszym przebiegu, a dwie sztuki były nieczytelne):
- **lamelka**: ścieżka ostra + `lamele` dała plamisty szum stali ze skórą
  (w arkuszu nóg przeplatają się drobniej niż 2 px). → głosowanie + nowa
  faktura **`lamele_rzedy`**: co 3. wiersz rzemień (`RZEMIEN = DROBNE[1]`;
  `DROBNE[2]` dawał pomarańczową drabinę), w pozostałych blaszki ze
  szczeliną co 3 px;
- **nabiodrki**: ostra = szara plama bez nakolanników; wygładzenie tonów na
  kaflu = czyste, ale bezkształtne spodnie. Głosowanie niesie linie styku
  płyt, ale te przy brzegu dublowały obrys — `gruby_kontur` **zaświecił na
  czerwono (0,152 > 0,15)** i był niewrażliwy na liczbę przebiegów
  wygładzania (linie pochodzą z arkusza). → **`styki_przy_brzegu`**: kontur
  leżący na brzegu sylwetki po `zdejmij_obwodke` → najciemniejsza stal
  (0,062, render bez zmian). ⛔ Próg NIE ruszany;
- ⛔ **szyny NIE przez głosowanie** — rozpadały się na osobne kawałki
  (obrys 21%); zostają na ścieżce ostrej;
- łuska (`luski`) i stalowe nagolenniki — ścieżka ostra, bez zmian.

`iron_legs` ← `steel_legs` z palety (ta sama oliwkowa szarość co
`iron_chest` na dużej płycie — sprawa OI-126, §6.5).

Kontrole: nogi porównywane RAZEM (11 sztuk, jeden slot); najbliższa para
całej rodziny bez zmian (czepce 0,46). **31 ikon zapisanych wcześniej bajt
w bajt bez zmian** (SHA1 przed/po). W grze: 6 tekstur `icon-armor-*`
wczytanych 32×32, `dev.missing` puste, `load.totalFailed` = 0.
⚠ **Zrzutu plecaka NIE zrobiono** — panel przeglądarki był ukryty (pętla
5 klatek na 8 s); piksele oceniane na podglądzie generatora (10×/2×/1×).

**Slot nóg jest zamknięty: 11 konstrukcji + 2 żelazne bliźniaki mają
własne ikony.** Z pięciu sztuk na wspólnym kaflu `(2,27)` nie został żaden.

### 8.5 Poprawki po ocenie autora (2026-09-30)

Autor: *„grafiki jeszcze wymagają drobnych poprawek, zanim przejdziemy do
kolejnego wsadu”*. Zakres wskazany przez autora: **tylko wsad 5** — przegląd
całej rodziny ikon dopiero **po wygenerowaniu wszystkich przedmiotów**.
Trzy poprawki wybrane przez autora z listy znalezionej na zbliżeniu z osią
symetrii (raport był zielony przy każdej z nich):

1. **Symetria** (`symetria`) — nabiodrki: skrzydełko nakolannika po jednej
   stronie, plama w kroku obok środka, rozcięty pas; lamelka: krzywa lewa
   nogawka. Arkusz nabiodrek BYŁ symetryczny — krzywiznę wprowadziło
   zmniejszenie z głosowaniem. ⭐ Kształt i materiał idą LUSTREM, tony —
   PRZESUNIĘCIEM z bliźniaczego odcinka wiersza, żeby obie nogi miały
   światło z lewej góry (samo lustro dałoby prawej nodze jasny prawy brzeg).
   Lamelka z prawej połowy, nabiodrki z lewej — wybrane na renderze.
2. **Śmieci** (`sprzataj`): kępki konturu ≤ 3 px nie przy tle (czarne dziury
   w pasie), kępki materiału ≤ 2 px (pomarańczowe klamry na krawędzi płyt —
   „samotny piksel” ich nie łapał, mają po 2 px), ostrogi sylwetki (lustro
   skopiowałoby wyrostek lamelki na drugą nogę). ⛔ **Nie dla nabiodrek** —
   krótkie wewnętrzne linie styku płyt to też kępki ≤ 3 px i znikały razem
   ze śmieciami. Do tego `zaslepka` skórą: prześwit między rzemieniami pod
   pasem nagolenników był zaślepiany najciemniejszą stalą (fioletowy kwadrat).
3. **Łuska ≠ kolczuga w 1×** (`luski_skora`): w dołku między łuskami
   prześwituje ciemny podkład skóry. ⚠ **Łuska klaty (`scale_chest`) nadal
   ma dołek stalowy** — materiał między slotami czyta się dziś trochę inaczej;
   do ujednolicenia przy przeglądzie całej rodziny.

Zmieniło się wyłącznie 6 ikon wsadu 5; **31 pozostałych bajt w bajt bez
zmian**, wynik identyczny przy `PYTHONHASHSEED` 1/2/3. Klucze tekstur
bez zmian — wpięcie w grze z §8.4 nietknięte.

⏳ **Świadomie NIE ruszane (do przeglądu całości):** oliwkowe żelazo na
dużej płycie (`iron_legs`, OI-126), taszki nabiodrek prawie niewidoczne.

---

## 9. WSAD 6 — buty (8 konstrukcji)

### 9.0 v1 (profil) ODRZUCONY przez autora (2026-09-30)

Prompt v1 prosił o parę w PROFILU, czubkami w lewo — wzór starych ikon
`items.png` i moje odczytanie „para w 3/4 z boku” z §1. Gemini narysowało
dokładnie to, a autor odrzucił arkusz bez wrzucania: *„nie wrzucę ci takich
grafik”*. Do repo nie trafił.

✅ **Decyzja autora: para PROSTO Z PRZODU**, czubkami na widza — ten sam
widok co cała reszta pancerza. Konsekwencje:
- blok stylu z §3 idzie **bez zmian** (akapit VIEW wraca; w v1 był
  podmieniony);
- lewy i prawy but to **lustro**, więc `symetria` z §8.5 pasuje wprost
  (w profilu nie pasowała);
- ⚠ z przodu nosek przesłania część cholewki — wysokość (trzewik ↔ pół
  łydki ↔ pod kolano) musi nieść sama sylwetka, stąd zdanie o równej
  szerokości noska w prompcie;
- pięta z przodu jest niewidoczna — półpłytowe tracą płytę piętową jako
  cechę; zostaje nosek + płyta na kostce z tłem między nimi.

### 9.1 Lista

| komórka | przedmiot | id | warstwa | CECHA ROZPOZNAWCZA (ma przeżyć 30 px) |
|---|---|---|---|---|
| 1 | Onuce | `foot_wraps` | L1 | **blady len nawinięty ukośnymi pasami** w kształt stopy i kostki, luźny koniec; bez podeszwy |
| 2 | Łapcie | `bast_shoes` | L2 | **plecionka z łyka** (słomkowy beż, splot w kratkę), niskie, sznurki krzyżowane na przodzie |
| 3 | Trzewiki | `low_boots` | L2 | **niskie, do kostki**, gładki brąz, sznurowanie na przodzie |
| 4 | Skórzane buty | `leather_boots` | L2 | **do połowy łydki**, gładki brąz, bez klamer |
| 5 | Buty piechura | `marching_boots` | L2 | **najwyższe — pod kolano**, gruba podeszwa, szwy, dwa paski z klamrami na przodzie |
| 6 | Buty kolcze | `mail_boots` | L2 | **szachownica** na całej cholewce do kostki, brązowa podeszwa |
| 7 | Stalowe buty | `steel_boots` | L3 | **cała stopa w stali**: poziome lamy od noska po kostkę, płyta na kostce; ciągły metal |
| 8 | Półpłytowe | `half_sabatons` | L3 | **dwie osobne płyty** (nosek, kostka) na rzemieniach, **między nimi tło** |

Z palety, bez rysunku: `iron_boots` ← `steel_boots`.

**Dotąd pięć sztuk skórzanych stało na jednym kaflu `(0,24)`** (łapcie,
trzewiki i buty piechura jako jawne placeholdery), a stalowe i żelazne na
`(2,28)`.

**Zasada warstwy (§8.0b) w butach:**
- L3 (`steel_boots`, `half_sabatons`) — sam metal z rzemieniem pod stopą,
  **bez buta w środku**. Opis półpłytowych („reszta stopy zostaje w skórze”)
  mówi o bucie L2 noszonym pod spodem, nie o części przedmiotu;
- `mail_boots` to L2, a opis mówi *„skórzane buty obszyte kolczą siatką”* —
  skóra (podeszwa, brzeg) jest częścią TEJ konstrukcji, więc zostaje;
- onuce (L1) nie mają w sobie stopy — pusty zwój lnu w kształcie stopy.

⚙ **Decyzja 2026-09-30 (autor przekazał ją mnie): w butach warstwy są mało
widoczne, a CZYTELNOŚĆ jest ważniejsza od detalu.** Półpłytowe zostają bez
buta, bo w 1× czytają się jako nosek i płyta na kostce. Jeśli przegląd
czytelności pokaże, że jakaś sztuka butów czyta się gorzej przez zasadę
warstwy, **w butach wygrywa czytelność** — np. skóra w prześwicie zamiast tła.

**Pary, które muszą się rozejść:**
- **trzewiki ↔ buty kolcze** — ta sama wysokość, rozdziela faktura
  (gładki brąz ↔ szachownica natywna);
- **skórzane buty ↔ buty piechura** — wysokość (pół łydki ↔ pod kolano)
  plus klamry;
- **stalowe ↔ półpłytowe** — jak nabiodrki ↔ nagolenniki (§8.1): pełniejsza
  sztuka jest ciągła, prostsza ma przerwę z tłem;
- **onuce ↔ łapcie** — obie jasne: gładki len w ukośne pasy ↔ słomkowa
  plecionka w kratkę z ciemniejszą podeszwą.

⚙ **Do generatora, zanim arkusz wróci:**
- **rampa łyka** (`bast`) — słomkowy beż nie jest ani lnem, ani skórą.
  Lokalnie jak `canvas` (OI-126);
- para = lustro → `symetria` (§8.5) dla każdej sztuki, której Gemini
  narysuje nierówne buty.

### 9.2 Prompt (v2 — z przodu)

Proporcje **16:9**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 **bez zmian** (z akapitem VIEW), a pod nim:

```text
TASK: one image divided into eight equal invisible squares, 4 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One pair of footwear per square, all eight in exactly the
same style and drawn for the same foot size: the toes are equally wide in
every square, so the heights of the items are directly comparable. Order:
top row left to right = items 1-4, bottom row left to right = items 5-8.

Exactly eight items, each drawn exactly ONCE, each entirely inside its own
square. Nothing crosses into a neighbouring square and nothing is repeated.

Every item is a PAIR standing side by side with a small gap between the two
pieces, seen strictly from the FRONT: the toes point straight at the viewer.
The left and the right piece are mirror images of each other. Never a side
view, never a profile, never a three-quarter view.

Every item is EMPTY footwear: no feet, no legs, no socks inside. Every item
is ONE thing only - never one item worn over another: no shoe inside the
metal ones, no cloth inside the leather ones.

1. Linen foot wraps: long strips of pale unbleached linen wound round and
   round into the shape of a foot and ankle, like a thick soft sock with no
   sole. The diagonal edges of the wound strips are clearly visible, and a
   loose end of a strip hangs at the ankle. Cloth only - the cheapest and
   softest item in the image.
2. Bast shoes: low shoes woven from strips of pale straw-coloured tree bark
   in a tight checkered basket weave, with a thin flat woven sole and thin
   cords crossing over the front of the foot and tied at the ankle.
3. Low leather shoes: plain brown leather shoes reaching just to the ankle,
   with a hard dark brown sole and a short lacing down the front. The lowest
   of the leather items.
4. Leather boots: plain smooth brown leather boots reaching halfway up the
   calf, with a simple dark sole. No buckles, no straps.
5. Marching boots: tall, heavy brown leather boots reaching just below the
   knee, with a very thick sole, clearly visible stitched seams and two
   leather straps with small iron buckles across the front. The tallest item
   in the image.
6. Mail boots: ankle-high boots whose whole upper is steel CHAINMAIL, with
   a dark brown leather sole and a thin leather edge at the top. The upper
   is covered with a fine, regular checkerboard of alternating light and
   dark grey pixels, like tiny rings; there is NO smooth grey area on it.
7. Steel sabatons: the whole front of the foot covered in steel - several
   overlapping horizontal steel bands from the toes up to the ankle, and a
   solid steel plate around the ankle, held by a brown leather strap under
   the foot. Continuous metal with no gaps. The heaviest item in the image.
8. Half sabatons: only TWO separate steel plates on each foot - a cap over
   the toes and a plate around the ankle - joined to each other by brown
   leather straps. Between the two plates there is nothing: the magenta
   background shows through.

The eight items must be recognisable from each other by outline and surface
alone: wound linen wraps, woven straw shoes, low brown shoes, mid-calf brown
boots, tall heavy boots with buckles, ankle-high mail boots, feet fully
covered in steel bands, two separate steel plates on straps.
Every edge is a hard pixel edge; shading uses 3-5 flat stepped tones, never a
smooth gradient. The background is ONE exact flat colour, #FF00FF, with no
lighter or darker patches of magenta.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no feet or legs inside the footwear, and no shields.
```

### 9.3 Ocena (odrzuć od razu, jeśli…)

- **któraś para nie jest prosto z przodu** (profil, 3/4, czubki w bok) —
  to był powód odrzucenia v1;
- w obuwiu jest stopa, noga albo skarpeta; **w stalowych lub półpłytowych
  jest but** (zasada warstwy, §8.0b);
- **skórzane buty i buty piechura mają tę samą wysokość** — to ich główna
  różnica;
- **półpłytowe nie mają przerwy z tłem** między noskiem a kostką — wtedy
  zlewają się ze stalowymi;
- buty kolcze bez szachownicy albo z gładkimi płatami;
- złoto, zdobienia, napisy.

Treść poprawna, piksele miękkie albo krata złamana → **przyjmujemy**
i obrabiamy (§5.4). Pojedyncza nieudana komórka nie wymaga nowego arkusza.
Para nierówna — nie powód do losowania, wyrówna ją `symetria`.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_boots_v1_raw.png`.

### 9.4 Wynik v2 (2026-09-30) — PRZYJĘTY, wpięty do gry

`armor_boots_v1_raw.png` (239×134) — prompt v2 (z przodu). Nazwa pliku
`v1`, bo odrzucony profil nigdy nie trafił do repo (§9.0).

- ✅ **Wszystkie osiem par prosto z przodu**; zasada warstwy trzymana —
  w stalowych i półpłytowych nie ma buta, półpłytowe mają tło między
  noskiem a kostką.
- ✅ łapcie: plecionka w kratkę i sznurki; onuce: nawinięte pasy z luźnym
  końcem; buty piechura: paski z klamrami; kolcze: szachownica.
- ⛔ **Gemini narysowało LINIE KRATY** (x = 0, 59, 120, 179, 238; y = 66)
  i kreseczki w górnym wierszu, mimo „no grid lines” w bloku stylu.
  → `bez_kresek` (flaga arkusza `kreski=True`): najpierw pasy przy brzegu
  komórki zajęte > 60% (linie łączą się z kreseczkami w RAMKĘ, która sama
  nie jest „liniowa”), potem kawałki < 30 px albo cieńsze niż 3 px.
  ⚠ Nie `plama` — para to dwa kawałki.
- ⚠ **Skórzane buty tej samej wysokości co buty piechura** (62 ↔ 62 px
  w arkuszu) — kryterium odrzucenia z §9.3, ale naprawione w generatorze
  zamiast losowania: `skroc=(8, 22)` wycina pas gładkiej cholewki, brzeg
  i szew nad kostką zostają. Każda ikona wypełnia kafel, więc różnicę
  wysokości niesie PROPORCJA: trzewiki przysadziste, skórzane pośrednie,
  buty piechura smukłe.

Kontrole zaświeciły na czerwono cztery razy — wszystkie prawdziwe:
- `mail_boots` szachownica **0,00** — kolczuga zeszła ciemna, siatka „o stopień
  ciemniej” lądowała na stopniu 0, którego miara nie liczy → `podnies_stal=1`
  (0,78);
- `marching_boots` kolor spoza ramp — szczelinę między cholewkami łatał
  `LEATHER[0]` spoza `DROBNE` → `zaslepka=("leather", DROBNE[0])`;
- `half_sabatons` 24 px zamkniętych dziur — to JEST prześwit z promptu →
  **`przeswit=True`, jedyny wyjątek od kontroli dziur**, z uzasadnieniem
  przy wpisie;
- `leather_boots` obrys 16% → `styki_przy_brzegu` uogólnione na materiał
  (`styki_ton`, skóra: `DROBNE[0]`).

Ścieżki per sztuka (render): skórzane buty przez głosowanie (czystsze);
⛔ trzewiki NIE (rozpadały się, obrys 23%); ⛔ łapcie NIE na samym łyku
(płaskie, splot i sznurki niesie brąz). Nowa rampa **`BAST`** (łyko,
próbkowana z arkusza) — lokalnie jak `canvas` (OI-126).

`iron_boots` ← `steel_boots` z palety. **37 ikon zapisanych wcześniej
bajt w bajt bez zmian**, wynik identyczny przy różnych `PYTHONHASHSEED`.
W grze: 9 tekstur 32×32, `dev.missing` puste, `load.totalFailed` = 0,
**zrzut plecaka zrobiony** (pętla chodziła: panel był widoczny) — buty
i nogi metalowe czytają się w kaflach plecaka.

⏳ **Do przeglądu całej rodziny** (autor: po wygenerowaniu wszystkich
przedmiotów): sznurowanie trzewików prawie znikło; onuce i trzewiki
stykają się w parze; żelazo oliwkowe (OI-126).

---

## 10. WSAD 7 — rękawice i naramienniki (5 + 4 konstrukcje)

### 10.1 Lista

| komórka | przedmiot | id | slot | CECHA ROZPOZNAWCZA (ma przeżyć 30 px) |
|---|---|---|---|---|
| 1 | Rękawice pikowane | `padded_gloves` | gloves | **blady len w drobną kratkę pikowania**, pięć palców, miękkie |
| 2 | Stare owijki Patryczka | `worn_wraps` | gloves | **szare, znoszone pasy płótna** nawinięte na dłoń i nadgarstek, **palce odkryte** (puste otwory), strzępiące się końce |
| 3 | Skórzane rękawice | `leather_gloves` | gloves | **brąz**, pięć palców, krótki mankiet |
| 4 | Rękawice kolcze | `mail_gloves` | gloves | **łapawica** — palce RAZEM, **szachownica**, skórzany mankiet |
| 5 | Stalowe rękawice | `steel_gauntlets` | gloves | **płytki osobno na każdy palec**, płyta na grzbiecie, **rozszerzony mankiet**, skóra podszewki na brzegach |
| 6 | Naramienniki skórzane | `leather_pauldrons` | shoulders | **gruba skórzana nakładka** na bark, rzemienie pod pachę |
| 7 | Naramienniki lamelkowe | `lamellar_pauldrons` | shoulders | **rzędy wąskich blaszek** zachodzące w dół jak dachówka, brązowe wiązanie |
| 8 | Naramienniki łuskowe | `scale_pauldrons` | shoulders | **łuski „U” w dół** na całym naramienniku |
| 9 | Naramienniki płytowe | `plate_pauldrons` | shoulders | **kopuła barku + 3 szerokie gładkie lamy** w dół; największa bryła |

Brak żelaznych bliźniaków w tych slotach. Oba sloty są **bez warstw**
(`gloves`, `shoulders` — `docs/systemy/armor.md` §3), więc zasada warstwy
§8.0b nie ma tu czego pilnować. Skóra podszewki (stalowe) i mankietu
(kolcze) jest częścią konstrukcji — opisy mówią „naszyte na skórę”.

**Dotąd:** rękawice pikowane i owijki na jednym kaflu `(0,20)`, wszystkie
trzy metalowe naramienniki na `(2,26)` (placeholdery), skórzane na kaflu
kaftana `(0,22)`.

**Układ — 3×3, 1:1** (jak w planie §2). ⚠ **Nietestowany**: Gemini
trzymało kratę tylko w 4×2 / 16:9, a oba zamówienia 4:3 wróciły złamane
(§8.0). Tu 4×2 nie wystarcza (9 sztuk), a rozbicie na dwa arkusze kosztuje
autora dodatkową rundę. **Zabezpieczenie: każda sztuka to JEDNA bryła**
(jedna rękawica, jeden naramiennik — nie pary), więc przy złamanej kracie
generator wycina `plama`, jak przy wsadzie 2 (§5.4).

**Widok:**
- rękawica — **jedna, prawa, grzbietem do widza, palcami w górę, kciuk
  w lewo**. Jedyny świadomy wyjątek od „lustrzanych połówek” z akapitu VIEW
  (kciuk) — prompt mówi to wprost, żeby Gemini nie rozstrzygało samo;
- naramiennik — **jeden, od zewnątrz ramienia**: kopuła barku u góry, lamy
  w dół. Symetryczny, więc `symetria` (§8.5) działa, gdyby wyszedł krzywy.

**Pary, które muszą się rozejść:**
- **rękawice pikowane ↔ owijki** — oba z lnu: rękawica z palcami i kratką
  pikowania ↔ pasy na dłoni z odkrytymi palcami, szarsze (znoszone);
- ⚠ **rękawice pikowane ↔ kolcze** — kratka pikowania i szachownica kolczugi
  to podobny wzór; rozdziela je kolor (len ↔ stal) i palce (pięć ↔ łapawica);
- **skórzane ↔ stalowe** — brąz z pięcioma palcami ↔ metal z płytkami
  i rozszerzonym mankietem;
- **lamelkowe ↔ łuskowe ↔ płytowe** — ta sama trójka faktur co w klacie
  i nogach (prostokąty w rzędach / łuki w dół / kilka dużych lam).
  Faktury natywne (`lamele`, `luski_skora`) jak w nogach.

⚙ Do generatora: owijki mogą potrzebować szarszego lnu niż `LINEN` —
ocenić na renderze, nie z góry.

### 10.2 Prompt

Proporcje **1:1**. Załącznik: tylko `ref_style_shields.png`. **Nowy czat.**
Blok z §3 **bez zmian**, a pod nim:

```text
TASK: one SQUARE image divided into nine equal invisible squares, 3 across
and 3 down. Each square is one 32x32-pixel sprite, upscaled so every art
pixel is a large square block. One item per square, all nine in exactly the
same style. Order: top row left to right = items 1-3, middle row left to
right = items 4-6, bottom row left to right = items 7-9.

Exactly nine items, each drawn exactly ONCE, each entirely inside its own
square. Nothing crosses into a neighbouring square and nothing is repeated.
Every item is ONE single piece: one glove, not a pair; one shoulder guard,
not a pair.

Items 1-5 are GLOVES: each is ONE empty right-hand glove seen from the back
of the hand, fingers pointing straight up, the thumb sticking out to the
LEFT. The thumb is the only part that breaks the left-right mirror symmetry.
No hand inside.

Items 6-9 are SHOULDER GUARDS: each is ONE empty shoulder guard seen from the
outside of the arm, with a rounded cap at the top over the shoulder and its
parts hanging downward. Its left and right halves are mirror images. No
shoulder or arm inside.

1. Padded gloves: pale unbleached linen gloves with five fingers, the whole
   surface quilted in a small, fine grid of stitched lines. Soft and thick.
2. Old hand wraps: long, worn, greyish-beige strips of cloth wound around
   the palm, the back of the hand and the wrist, in the shape of a hand.
   The fingers are NOT covered: the wraps end below the knuckles, leaving
   empty openings. A frayed loose end of a strip hangs from the wrist.
   Dirty and used, the cheapest item in the image.
3. Leather gloves: plain smooth brown leather work gloves with five fingers
   and a short cuff at the wrist.
4. Mail mittens: mittens made of steel CHAINMAIL with the four fingers
   together in one piece and a separate thumb, and a brown leather cuff at
   the wrist. The mail is covered with a fine, regular checkerboard of
   alternating light and dark grey pixels, like tiny rings; there is NO
   smooth grey area on it.
5. Steel gauntlets: a separate small steel plate on every finger, a larger
   steel plate over the back of the hand, and a wide flared steel cuff at
   the wrist. A thin edge of brown leather lining shows at the openings.
6. Leather shoulder guard: a thick, rounded, hardened brown leather cap
   over the shoulder with a second smaller leather piece below it, and two
   leather straps hanging down to tie it under the arm.
7. Lamellar shoulder guard: built from four or five horizontal rows of
   small, narrow, vertical steel plates, each row overlapping the one below
   like roof tiles, the rows laced together with thin brown leather thongs.
   Straight, rectangular pattern.
8. Scale shoulder guard: covered all over with small rounded steel scales
   overlapping downward like fish scales, every scale a small "U" shape,
   with a thin brown leather edge along the bottom. Rounded pattern.
9. Plate shoulder guard: a smooth steel dome over the shoulder and three
   wide, smooth, curved steel bands below it, each overlapping the next one
   downward, with a crisp highlight on the upper left. The largest and
   heaviest item in the image.

The nine items must be recognisable from each other by outline and surface
alone: quilted linen glove, cloth wraps with bare finger openings, brown
leather glove, mail mitten, plated steel gauntlet with a flared cuff,
leather shoulder cap with straps, rows of small laced plates, rounded
scales, smooth steel dome with wide bands.
Every edge is a hard pixel edge; shading uses 3-5 flat stepped tones, never a
smooth gradient. The background is ONE exact flat colour, #FF00FF, with no
lighter or darker patches of magenta and no lines between the squares.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, no hands, arms or shoulders inside the items, and no shields.
```

⚠ Dopisane z lekcji wsadu 6: „no lines between the squares” w zdaniu
o tle (tam linie kraty przyszły mimo zakazu w bloku stylu).

### 10.3 Ocena (odrzuć od razu, jeśli…)

- **zamiast pojedynczych sztuk są pary** (dwie rękawice, dwa naramienniki)
  — przy złamanej kracie para to dwie plamy i wycinanie `plama` przestaje
  działać;
- rękawice nie grzbietem do widza albo nie palcami w górę;
- w rękawicy jest dłoń, w naramienniku ramię;
- **owijki zakrywają palce** — wtedy zlewają się z rękawicami pikowanymi;
- **rękawice kolcze mają pięć osobnych palców** albo nie mają szachownicy;
- lamelkowe i łuskowe mają ten sam wzór;
- złoto, zdobienia, napisy.

⚠ **Krata złamana albo proporcja inna niż 1:1 — NIE powód do losowania**,
o ile jest dziewięć osobnych sztuk: wycinanie `plama`. Brakuje sztuki
(np. przyszło 16:9 z ośmioma) — dosyłamy jedną brakującą osobnym, małym
promptem, nie cały arkusz.

**Gdzie wrzucić:** `docs/art-review/gemini/armor_hands_shoulders_v1_raw.png`.

### 10.4 Wynik v1 (2026-09-30) — PRZYJĘTY, wpięty do gry

`armor_hands_shoulders_v1_raw.png` (241×134) — **zamówione 3×3 / 1:1,
przyszło 16:9 / 5×2** (dziesięć komórek). ⭐ **Trzeci raz z rzędu Gemini
oddało 16:9 niezależnie od zamówionej proporcji** (4:3 ×2, 1:1 ×1) — przy
kolejnych arkuszach zamawiać wprost 16:9 i liczyć komórki pod 4×2 albo 5×2.
Krata trzymana, więc wycinanie `grid` (2, 5); fallback `plama` niepotrzebny.

- ✅ pojedyncze sztuki, nie pary; rękawice grzbietem, palcami w górę,
  kciuk w lewo; naramienniki od zewnątrz, kopuła u góry.
- ⚠ komórka (1,3) — **zmyślona hybryda** (kopuła + łuski), pominięta.
- ⛔ **owijki z gołymi PALCAMI** (skóra) mimo „no hand inside” →
  `bez_skory`: kolor skóry (R−G ≥ 40, R−B ≥ 60) + obrys w promieniu 2 px
  → przezroczyste. Owinięcie zostaje, palce znikają.
- ⛔ **rękawice kolcze z pięcioma palcami** zamiast łapawicy (opis: *„palce
  zostają razem”*). Po zejściu sylwetka była już zwarta — palce dzieliły
  tylko ciemne kreski stali → `lapawica=0.45`: w górnych 45% sztuki stal
  stopnia 0 → stopień 2, szachownica idzie po wszystkim.
- linie kraty ciemnomagentowe (163,1,165) — `bez_kresek` jak w butach.

Poprawki z renderu (raport był zielony od pierwszego przebiegu):
- rękawice pikowane zgubiły kratkę pikowania → faktura natywna
  `pikowanie` (punkty szwu co 3 px);
- owijki w kolorze rękawic pikowanych → `stopnie={"linen": (0, 1, 2)}`
  (znoszone, bez najjaśniejszego lnu);
- brązowe kropki na stalowych rękawicach i naramiennikach lamelkowym
  i łuskowym → `sprzataj`.

**46 ikon zapisanych wcześniej bajt w bajt bez zmian**, wynik identyczny
przy różnych `PYTHONHASHSEED`. W grze: 9 tekstur 32×32, `dev.missing`
puste, `load.totalFailed` = 0, **zrzut plecaka zrobiony** — wszystkie
dziewięć czyta się w kaflach.

⏳ **Do przeglądu całej rodziny:** kropki rzemienia na naramienniku
lamelkowym (czyta się raczej jak beczka z listew niż dachówka), resztki
brązu na palcach stalowych rękawic.

### 10.5 Pancerz — stan po wsadzie 7

✅ **Wszystkie siedem wsadów wpięte: 55 ikon** (48 konstrukcji + 7 żelaznych
bliźniaków z palety). Żadna sztuka pancerza nie stoi już na wspólnym
kaflu `items.png`. Następny krok wg decyzji autora: **przegląd całej
rodziny dopiero po wygenerowaniu wszystkich przedmiotów** (§8.5) —
lista „do przeglądu” jest w §6.5, §8.4, §8.5, §9.4 i §10.4.

---

## 11. Przegląd czytelności i ujednolicenie (2026-09-30)

⭐ **Kryterium autora: czytelność grafik ważniejsza od detalu.** Zakres
wybrany przez autora: **tylko pancerz** (nóż i sztylety dzielą z pancerzem
ciemne żelazo, ale zostają do osobnej rundy — OI-126).

### 11.1 Pomiar (audyt na tle kafla plecaka `theme.slotBg` 0x1c2030)

Wzorzec: tarcze drewniane — kontrast (mediana jasności wnętrza − tło)
**51–63**, szum (odsetek pikseli z < 2 z 4 sąsiadów w tym samym kolorze)
**0,13–0,55**.

| problem | sztuki przed | przyczyna |
|---|---|---|
| za ciemne | żelazny kaptur / kolczuga / nogawice kolcze **28**, napierśnik skórzany **21**, brygantyna **25**, naramienniki skórzane **30** | rampa żelaza za ciemna i oliwkowa; czerwień płótna ma niską jasność; arkusz narysował skórę ciemno |
| migocze w 1× | łuska 0,80–0,84, lamelka nóg 0,78, łapcie 0,83 | ton z arkusza PER PIKSEL pod wzorem faktury; łuska 3 px × pas 2 |
| ten sam materiał różnie | łuska: stalowy dołek (klata) ↔ skóra (nogi, barki); lamelka: trzy różne wzory | faktury dopisywane wsad po wsadzie |
| len świeci | len 170–200 przy 80–130 reszty | najjaśniejszy stopień (232,220,204) |

### 11.2 Zmiany

- **Dwie nowe kontrole** w `build_armor_icons.py`: `MIN_KONTRAST = 50`,
  `MAX_SZUM = 0.55` — progi z tarcz, nie z wyniku generatora. Kolczuga
  zwolniona z szumu (szachownica jest jej tożsamością, §4.5).
  **Sprawdzone psuciem: przed poprawkami zaświeciły na 13 sztukach** —
  dokładnie tych z audytu.
- **`IRON`** jaśniejsza i neutralnie szara: (58,57,56 … 176,172,166).
  Żelazna kolczuga 28 → 54; oliwkowy odcień zniknął. Nadal cieplejsza
  i ciemniejsza od niebieskawej stali.
- **`CANVAS`** jaśniejsza, a płótno w `WYROWNUJ` — sama jaśniejsza rampa
  POGORSZYŁA brygantynę (25 → 28: ciemne czerwienie przestały trafiać
  w płótno). Stopień 0 zostaje do rozpoznania materiału.
- **`LINEN[3]`** (232,220,204) → (220,205,184) — lekko przygaszony (decyzja
  autora); len dalej najjaśniejszy.
- skóra: napierśnik skórzany `stopnie (4, 7, 9, 10)` (był 1, 4, 7, 9) —
  nadal ciemniejszy od miękkiego kaftana; naramienniki skórzane
  `(4, 7, 10, 11)`.
- ⭐ **Jedna łuska** (klata, nogi, barki): łuska 4 px × pas 3 wiersze,
  **jeden ton na łuskę** (większość z arkusza), dołek stalowy. Kropki skóry
  z §8.5 USUNIĘTE — łuskę od kolczugi odróżniają teraz pasy.
- ⭐ **Jedna lamelka** (klata, nogi, barki): co 4. wiersz rzemień, blaszki
  2 px ze szczeliną co 3 px, **jeden ton na blaszkę**. Nogi `szczeliny=False`
  — na wąskiej nogawce szczeliny zjadały pasy.
- **Łapcie**: sam łyk (`BAST` w `WYROWNUJ`) + splot 2×2, jeden ton na oczko.
  ⚠ Łyk bez rozciągania jasności dawał płaską, jednotonową cholewkę;
  łyk ze skórą — szum 0,63–0,74.
- `wygladz_kafel` (wygładzenie tonów na kaflu przed fakturą): łuska,
  lamelka, łapcie, onuce.

⭐ **Wniosek na przyszłe faktury natywne: wzór sam nie wystarcza — pod nim
ma leżeć JEDEN ton na element wzoru.** Ton per piksel z arkusza dawał szum
przy idealnie regularnym wzorze.

### 11.3 Wynik

26 ikon zmienionych, 29 bez zmian; wynik identyczny przy różnych
`PYTHONHASHSEED`. Wszystkie 55 ≥ 50 kontrastu; szum > 0,55 wyłącznie
w kolczudze (zwolnionej). Klucze tekstur i ścieżki bez zmian — wpięcie
w grze nietknięte.

⏳ **Świadomie poza tym przeglądem:**
- nóż, sztylet, nóż myśliwski (kontrast 14–28) — metal broni, OI-126;
- szachownica kolczugi ściemnia sztukę w 1× (mediana ~90, kontrast 54–59)
  — na progu, ale zamierzona;
- brygantyna jest teraz żywą czerwienią, nie „spraną” — tak wyszło z progu
  kontrastu; do oceny autora.

---
typ: OPERACYJNE
domena: assets
tytul: Ikony broni z Gemini — wsad, prompt i obróbka
stan: zywy
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-01
---

# Ikony broni z Gemini — wsad, prompt i obróbka

> **Po co ten plik.** Stare ikony broni pochodzą z `items.png`, pakietu
> rysowanego w GIMP-ie ~12 lat temu. Odstają od nowych tarcz
> (`docs/tarcze_grafika_checkpoint.md`). Odświeżamy je **rodzinami**, a ten
> plik trzyma **stały blok stylu** (jeden dla wszystkich rodzin) i **wsady**
> (lista przedmiotów rodziny + prompt).
>
> ⛔ **Katalog broni jest ZAMKNIĘTY** (commit `6c1a49a`). To jest odświeżenie
> grafiki ISTNIEJĄCYCH przedmiotów, nie dopisywanie nowych.

---

## 1. Potok — kto za co odpowiada

```
Gemini (obraz ~1024 px, udawany pixel-art)
   ↓  autor: ocenia wg §5, odrzuca złe
Pixel Snapper (siatka + redukcja palety)
   ↓  autor: wrzuca wynik do docs/art-review/gemini/
Claude — dopasowanie końcowe (§6)
   ↓
public/assets/items/icon_weapon_<id>.png  → `iconTexture` w ITEMS
```

**Gemini daje PROJEKT i bazę pikseli, nie plik gotowy do gry.** Dokładny
rozmiar, położenie rękojeści, kąt i paletę ustawia krok końcowy — model
obrazowy nie umie liczyć pikseli i nie należy tego od niego oczekiwać.

---

## 2. Twarde wymagania gry (nie do negocjacji w prompcie)

| wymaganie | wartość | skąd |
|---|---|---|
| kafel | **32×32** wyłącznie dla broni **do ~45 cm** (sztylety, toporek — decyzja autora 2026-10-02) · **32×64** dla całej reszty (gabaryt 1×2 — ⭐ REGUŁA, nie wyjątek) | `public/assets/README.md`, §10.8, §13.1 |
| oś | **45°**, ostrze w **lewy górny**, głowica w **prawy dolny** | rig broni w dłoni: `iconRestDeg` −135 |
| położenie | ⭐ **WYŚRODKOWANA w polu** (środek obrysu = środek kafla, ±0,5 px) — decyzja autora 2026-10-02 „spójność to podstawa”. ⛔ Do tej daty: koniec głowicy w (0,94 · 0,91) kafla | `tools/icon_center.py`; dawniej `PLAYER.swing.gripOrigin` (rig 2D — legacy) |
| krótka broń | ✅ od 2026-10-02 **też wyśrodkowana** (do tej daty kończyła się przed lewym górnym rogiem) | jak wyżej |
| czytelność | ocenia się przy **17,6 px** (broń w dłoni), nie tylko przy 64 px (plecak) | README, reguła po „włócznia jak patyk" |
| tożsamość | każda broń musi mieć cechę rozpoznawalną **w samej sylwetce** | README, rzędy broni |

⚠ Ikona narysowana pod innym kątem jest trzymana krzywo, a pole per przedmiot
nie istnieje. Kąt i kotwicę wyrównuję w kroku końcowym, ale im bliżej 45°
przyjdzie wynik, tym mniej przerysowywania.

---

## 3. Załączniki do Gemini

Dołącz **wyłącznie** `docs/art-review/gemini/ref_style_shields.png` — wzorzec
STYLU (kontur, cieniowanie, kierunek światła, rampa drewna; nowe tarcze z gry).
Każdy wsad zaczynaj w **NOWYM czacie**.

⛔ **NIE załączaj `ref_layout_old_daggers.png`.** Pierwsza próba (2026-09-27)
pokazała, że Gemini traktuje załączony obraz z bronią jako obraz DO EDYCJI:
odpisał, że „poprawił orientację broni", czyli przerysował stare ikony zamiast
narysować nowe. Układ (oś 45°, głowica w prawym dolnym rogu, relacja długości)
opisuje dziś sam tekst promptu. Plik zostaje jako materiał dla autora
i dla kroku końcowego.

⚠ Ta sama próba dała **napisy** mimo zakazu: nagłówki komórek w stylu
„TOP-LEFT cell - PEASANT KNIFE" model czytał jako podpisy do narysowania.
Dlatego prompt nie ma już etykiet wersalikami, a zakaz tekstu stoi na
początku i na końcu. **Mizerykordia dostała jelec-poprzeczkę** — opis tarczek
jest teraz jawnie sformułowany jako zaprzeczenie poprzeczki.

---

## 4. Stały blok stylu (angielski — wklejany na POCZĄTKU każdego wsadu)

```text
Create a completely NEW pixel-art image from scratch. The attached picture of
wooden shields is ONLY a style sample: do not edit it, do not redraw it, do not
fix it, and do not put any shields in the result.

The image contains NO text of any kind: no titles, no captions, no item names,
no letters, no numbers, no labels.

STYLE (take it from the attached shields): true pixel art. Every art pixel is a
crisp, perfectly square block of ONE flat colour; all blocks are the same size
and sit on one global grid. No anti-aliasing, no soft edges, no gradients, no
dithering noise, no blur, no glow. A 1-pixel very dark brown-black outline
(#0E0905) around every object. Light from the top-left. Each material uses 3-5
flat tones stepped by hand. Silhouette first, detail second - every object
must still be recognisable when shrunk to 18 pixels.

BACKGROUND: solid flat magenta #FF00FF everywhere outside the objects. No floor,
no shadow, no vignette, no frame, no lines between the objects.

MATERIALS:
- Wood and leather: warm browns only (red > green > blue). Base about #734B30,
  shadows down to #2B1B10, highlights up to #C0896A. Leather is a darker,
  smoother brown than wood.
- Steel: cool light grey, a crisp near-white highlight on the edge facing the
  top-left, darker blue-grey on the far side.
- Iron: darker, duller, slightly warm grey, low contrast. It must look clearly
  cheaper than steel.
- No gold, no brass, no gems, no engravings, no runes. Grounded, historical,
  practical medieval - not fantasy.

LAYOUT OF EVERY WEAPON: it lies on an exact 45-degree diagonal, blade tip toward
the TOP-LEFT, pommel toward the BOTTOM-RIGHT. The pommel end touches the area
just inside the bottom-right corner of its square. Shorter weapons do NOT reach
the top-left corner and are NOT centred.
```

---

## 5. WSAD 1 — rodzina SZTYLETÓW (3 przedmioty + kotwica skali)

### 5.1 Lista

| komórka | przedmiot | id | materiał | długość* | CECHA ROZPOZNAWCZA (musi przeżyć 18 px) |
|---|---|---|---|---|---|
| lewa górna | **Nóż** | `knife` | **żelazo** | ≈19 px | **BRAK jelca** + drewniana rękojeść z nitami |
| prawa górna | **Sztylet** | `dagger` | stal | ≈24 px | **krótki prosty jelec** + obustronne ostrze z graniem |
| lewa dolna | **Mizerykordia** | `misericorde` | stal | ≈30 px | **najdłuższa i najwęższa** (igła) + **tarczki** jelca i głowicy |
| prawa dolna | *Miecz — kotwica skali* | `sword` | stal | ≈42 px | tylko punkt odniesienia; **nie jest częścią wsadu** |

\* Długość od sztychu do końca głowicy, w pikselach kafla 32 px, mierzona
wzdłuż przekątnej. Relacja jest ważniejsza niż liczba: **nóż < sztylet <
mizerykordia**, a wszystkie trzy wyraźnie krótsze od miecza.

⚠ **Stan dzisiejszy, który ten wsad naprawia** (widać na
`ref_layout_old_daggers.png`): ikona noża to **samo ostrze bez rękojeści**,
„sztylet" wygląda jak nóż z jelcem, a mizerykordia jak krótki miecz. Trzy
cechy z tabeli wyżej są zaprojektowane tak, żeby każda z trzech broni różniła
się od pozostałych **innym** elementem (jelec / brak jelca / długość i kształt
igły) — to jest ta sama zasada, którą README zapisało dla starych ikon.

Opis w grze (kontekst dla wyglądu, nie do wklejenia):
- Nóż: *„Kawałek żelaza z drewnianą rękojeścią. Kroi chleb, oprawia zająca…"* — narzędzie, wiejski kowal.
- Sztylet: *„Lekki i szybki. Pierwsze prawdziwe ostrze, jakie będziesz miał."*
- Mizerykordia: *„Wąskie, sztywne ostrze bez ostrzy bocznych… wchodzi tam, gdzie kończy się pancerz."* — broń rycerstwa, 150 g.

### 5.2 Prompt — arkusz 2×2 (zalecany)

Proporcje obrazu **1:1**. Wklej blok stylu z §4, a pod nim:

```text
TASK: one square image divided into four equal invisible squares (2 by 2). The
whole image is a 64x64 pixel-art canvas - each square is one 32x32-pixel
sprite - upscaled so every art pixel is a large square block. One weapon per
square, all four in exactly the same style.

Length from blade tip to pommel end, in art pixels along the diagonal of a
32-pixel square: knife about 19, dagger about 24, misericorde about 30, sword
about 42 (almost corner to corner). The order knife < dagger < misericorde <
sword must be obvious at a glance.

Top-left square: a cheap peasant utility knife made of dull IRON by a village
smith. Single-edged blade with a straight back and a simple point. It has no
guard at all - the blade goes straight into the handle. Plain wooden handle,
about as long as the blade and as wide as its base, with two tiny light rivet
dots. Clearly the cheapest object in the image.

Top-right square: a plain STEEL soldier's dagger. Straight double-edged blade
tapering evenly to a point, with a central ridge (one half lit, the other in
shadow). A short, straight steel crossbar guard about two and a half times the
blade width. Grip wrapped in dark leather with 2-3 visible bands, small round
steel pommel.

Bottom-left square: a STEEL misericorde, a knight's armour-piercing dagger. The
longest and thinnest of the three daggers: a very narrow, stiff, needle-like
blade with no cutting edges, only one bright ridge line down its centre,
ending in a needle point. IMPORTANT: it has NO crossbar. Where a crossbar would
be there is a small round steel disc, like a coin set across the blade, seen at
an angle as a small oval; the pommel is a second identical disc. Dark leather
grip between the two discs. Precise and well made, no ornament.

Bottom-right square: a plain one-handed STEEL arming sword, used only for size
comparison: straight double-edged blade, straight crossbar guard, leather grip,
round pommel, reaching almost from corner to corner of its square.

Reminder: absolutely no text, letters, names or labels anywhere in the image,
and no shields.
```

### 5.3 Prompt — pojedyncza broń (do poprawek)

Gdy arkusz wyjdzie dobrze poza jedną komórką, nie losuj całego od nowa.
Proporcje **1:1**, blok stylu z §4, a pod nim:

```text
TASK: one single 32x32-pixel sprite, upscaled so that every art pixel is a
large square block, filling the whole image. <OPIS KOMÓRKI Z 5.2, bez nazwy
komórki>. Its length from blade tip to pommel end is about <N> art pixels
along the diagonal of the 32-pixel canvas, pommel end 1-2 pixels from the
bottom-right corner.
```

⚠ Przy poprawce **dołącz też udaną komórkę z arkusza** jako drugi obraz
z dopiskiem „match the style of the second attached image exactly" — inaczej pojedyncza ikona
odjedzie stylem od reszty rodziny.

---

## 6. Ocena przed Pixel Snapperem — co odrzucić od razu

Odrzuć obraz, jeśli choć jedno jest prawdą:

- oś wyraźnie nie jest 45° albo ostrze celuje w inny róg niż lewy górny;
- krawędzie są rozmyte / wygładzone (Snapper tego nie uratuje, tylko ukryje);
- tło nie jest jednolitą magentą albo przedmiot rzuca cień;
- **nóż ma jakikolwiek jelec**, **sztylet nie ma jelca**, **mizerykordia nie
  jest najdłuższa** z trzech — to są cechy rozpoznawcze, nie szczegóły;
- pojawiło się złoto, klejnoty, runy, zdobienia, napisy;
- coś przecina granicę komórki.

**Pixel Snapper:** zostaw wynik w natywnej siatce (arkusz ≈64×64, pojedyncza
ikona ≈32×32) — **nie skaluj go w górę** przed wysłaniem. Paletę ustaw raczej
szeroko (ok. 24–32 kolorów na arkusz): zredukuję ją sam do ramp gry, a zbyt
ostra redukcja w Snapperze zlewa grań ostrza z jego cieniem.

**Gdzie wrzucić:** `docs/art-review/gemini/` jako
`daggers_v<N>_raw.png` (z Gemini) i `daggers_v<N>_snap.png` (po Snapperze).
Surowy plik też jest potrzebny — przy wątpliwości porównuję z nim, co Snapper
zgubił.

---

## 7. Dopasowanie końcowe (Claude)

1. Podział arkusza na komórki, usunięcie magenty → przezroczystość.
2. **Kąt 45° i kotwica głowicy (30, 29)** — wyrównanie per ikona.
3. **Długość wg tabeli 5.1**; relacja nóż < sztylet < mizerykordia < miecz.
4. **Paleta:** drewno i skóra → `tools/wood_palette.py` (`RAMPA`, `KONTUR`).
   Metal → **nowa rampa metalu z dwoma gatunkami (żelazo / stal)**, której
   standard dziś NIE istnieje. ⭐ Ten sam standard odblokuje metalowe tarcze
   (`OI-126`, 24 sztuki na jednym kaflu) — rampa powstanie więc jako osobny,
   wspólny plik, tak jak drewno, a nie jako liczby w jednym generatorze.
5. **Kontrola przy 64 px i przy 17,6 px** — obok siebie na jednej półce,
   razem ze starym mieczem. Cecha rozpoznawcza każdej broni ma się czytać
   przy 17,6 px.
6. Zapis `public/assets/items/icon_weapon_<id>.png`, wpięcie przez
   `iconTexture` (klucz z przedrostkiem `icon-`, trzy miejsca — patrz
   `public/assets/README.md`), w silniku `window.dev.missing` puste
   i `load.totalFailed` = 0.

---

## 8. Kolejne wsady (propozycja kolejności)

| wsad | rodzina | sztuk | uwaga |
|---|---|---|---|
| 1 | sztylety | 3 | ten plik, §5 |
| 2 | miecze i szable | 10 | **w toku — §10** (skala 0,44 px/cm, dłuższe pionowo w 32×64) |
| 3 | topory | 7 | ✅ **wpięte — §12** (ostrze po stronie światła, głowa wielokątem) |
| 4 | obuchowe | 11 | ✅ **wpięte — §13** (wszystkie 1×2; łańcuch zwisa pionowo) |
| 5 | drzewcowe | 6 | ✅ **wpięte — §11** (1×2, skos 1:2, grot w skali 0,44, drzewce skrócone) |

Wsad dostaje sekcję w tym pliku dopiero wtedy, gdy jest robiony — lista wyżej
to kolejność, nie plan szczegółowy.

---

## 9. Wynik wsadu 1 (2026-09-27) — czytaj przed wsadem mieczy

✅ **Rodzina zamknięta i wpięta:** nóż, nóż myśliwski, sztylet, mizerykordia.
Generator: `tools/build_ikony_sztyletow.py`; pliki
`public/assets/items/icon_weapon_*.png`. Nóż myśliwski nie ma przedmiotu
w `ITEMS` — plik czeka bez wpięcia.

⛔ **Krok §7 (dopasowanie pikseli Gemini) NIE zadziałał i nie jest częścią
potoku.** Wsad po Snapperze miał ~43 px przekątnej; zejście do 32 px zjadało
jelce, szum cieniowania zamieniał się w kropki, a każda korekta kończyła się
walką z cudzymi pikselami. Gemini zostaje **projektantem** (sylwetka, cechy
rozpoznawcze, proporcje rodziny), piksele rysuje generator.

⭐ **Trzy lekcje dla wsadu mieczy** (szczegóły: `public/assets/README.md`,
sekcja o sztyletach):
1. **Broń z piętą/ricasso/wycięciem opisuj w osiach broni** (`s = x+y`,
   `u = x−y`), nie profilem „jeden zakres na wiersz płótna" — ten drugi nie
   potrafi narysować cięcia prostopadłego do osi 45° (~20 nieudanych iteracji).
2. **Grzbiet to `u = 0` z definicji** — wtedy nie ma czego „wygładzać".
3. **Łuk czubka = parabola**, nie elipsa (elipsa daje łopatkę).

⚠ **Proces, który zawiódł:** recenzje przekazywane z Gemini opisywały kształt
słowami („ząb", „V", „prostopadle"), a implementacja zgadywała liczby.
Rozstrzygnęło dopiero zdjęcie prawdziwego noża kuchennego od autora i
czerwone linie na renderze. **Przy mieczach zacznij od zdjęcia referencyjnego
i szkicu na renderze, nie od opisu.**

---

## 10. WSAD 2 — miecze (10 sztuk, dwa arkusze)

### 10.1 Decyzje przed wsadem (autor, 2026-09-27)

- **Gemini = projekt, nie piksele** (§9). Z arkusza biorę sylwetkę, proporcje
  i cechę rozpoznawczą; piksele rysuje generator.
- **Skala jak tarcze: 0,44 px = 1 cm** — w sklepie miecz i tarcza stoją obok
  siebie i nie mogą kłamać o rozmiarze.
- **Gabaryt wynika z długości:** co mieści się w 32 px, zostaje w 1 kratce
  (oś 45°, jak sztylety); dłuższe dostają **32×64, pionowo, sztych w górę**,
  i 2 kratki w plecaku. Wielki miecz (~180 cm = 79 px) jako jedyny się nie
  mieści — dostaje pełną wysokość i jest najdłuższy, to wystarczy.
- ⚠ Pionowa ikona nie pasuje do starego 2D-rigu broni w dłoni
  (`iconRestDeg` −135). Autor: rig 2D to legacy do usunięcia, nie blokuje.

| przedmiot | id | ~cm | ~px | pole | CECHA ROZPOZNAWCZA |
|---|---|---|---|---|---|
| Krótki miecz | `short_sword` | 65 | 29 | 1×1 | najkrótszy, szeroka prosta głownia |
| Kord | `messer` | 80 | 35 | 1×2 | JEDNOSIECZNY, prosty; płaska rękojeść z nitami |
| Tasak | `cleaver_sword` | 85 | 37 | 1×2 | głownia SZERSZA KU SZTYCHOWI, ścięty czubek |
| Miecz | `sword` | 90 | 40 | 1×2 | wzorzec: prosty krzyż, zbrocze, gałka-dysk |
| Szabla | `sabre` | 90 | 39 | 1×2 | KRZYWA głownia, rękojeść zagięta na końcu |
| Miecz długi | `longsword` | 100 | 44 | 1×2 | jak miecz, ale wyraźnie dłuższa, węższa głownia |
| Rapier | `rapier` | 110 | 48 | 1×2 | igła + KOSZ/pałąk osłaniający dłoń |
| Bastard | `bastard_sword` | 118 | 52 | 1×2 | długa rękojeść (półtora dłoni), gałka gruszka |
| Miecz dwuręczny | `greatsword` | 135 | 59 | 1×2 | bardzo długi, długi krzyż, rękojeść na 2 dłonie |
| Wielki miecz | `zweihander` | 180 | 62* | 1×2 | ZBROCZE przez całą głownię + HACZYKI nad jelcem |

\* ścięte do wysokości pola. Wszystkie stalowe.

### 10.2 Załączniki

Tylko `docs/art-review/gemini/ref_style_shields.png` (jak w §3 — nie
załączaj żadnych obrazów broni, Gemini zaczyna je edytować). Każdy arkusz
w **nowym czacie**. Wynik do `docs/art-review/gemini/` jako
`swords_1h_v1_raw.png` i `swords_2h_v1_raw.png` (Snapper niepotrzebny —
to tylko projekt).

### 10.3 Blok stylu dla mieczy (zastępuje §4 — inny układ)

```text
Create a completely NEW image from scratch. The attached picture of wooden
shields is ONLY a style sample: do not edit it, do not redraw it, and do not
put any shields in the result.

The image contains NO text of any kind: no titles, no captions, no names,
no letters, no numbers, no labels.

STYLE: clean pixel art with crisp square pixels, flat colours, no
anti-aliasing, no blur, no glow. A 1-pixel very dark brown-black outline
(#0E0905) around every object. Light from the top-left. Silhouette first,
detail second.

BACKGROUND: solid flat magenta #FF00FF everywhere. No floor, no shadow, no
frame, no lines between the objects.

MATERIALS: all blades are plain STEEL - cool light grey with a crisp
near-white highlight on one edge and darker blue-grey on the other. Grips
are dark brown leather or brown wood. Guards and pommels are steel. No gold,
no brass, no gems, no engravings, no runes. Historical, practical medieval -
not fantasy.

LAYOUT: every sword stands perfectly VERTICAL, point UP, pommel DOWN. All
swords stand side by side in one row, evenly spaced, not touching, and all
pommels sit on the same invisible baseline at the bottom. ALL SWORDS ARE
DRAWN AT THE SAME SCALE, so their real lengths can be compared directly.
```

### 10.4 Prompt — arkusz 1: siedem mieczy jednoręcznych

Proporcje obrazu **16:9**. Blok z §10.3, a pod nim:

```text
TASK: seven one-handed swords in one row, from left to right in this exact
order. Relative total lengths are given in brackets - the rightmost sword
is the tallest and almost fills the image height.

1. Short sword (29): the shortest. Broad, straight, double-edged blade that
   tapers to a point, simple straight crossguard, short grip, disc pommel.
2. Messer (35): SINGLE-edged straight blade with a straight back, the point
   slightly clipped. Short straight crossguard. Flat slab grip made of two
   wooden plates with two light rivets, no separate pommel.
3. Falchion (37): single-edged, heavy, the blade gets WIDER toward the tip
   and ends in a broad clipped point - it must look like a cleaver sword.
   Short crossguard, leather grip, small pommel.
4. Arming sword (40): the classic knight's sword. Straight double-edged
   blade with a dark fuller down the middle, straight crossguard, leather
   grip, round disc pommel.
5. Sabre (39): CURVED single-edged blade, clearly bent backwards. Small
   crossguard, grip that bends forward at the end into a hooked pommel.
6. Long sword, one-handed (44): like the arming sword, but its blade is
   clearly LONGER and NARROWER; still a one-hand grip.
7. Rapier (48): the tallest of the seven. Very narrow, stiff, needle-like
   blade. Complex hilt: a curved knuckle bow from the crossguard down to the
   pommel and one side ring - the hand is enclosed by steel.

Each sword must be recognisable by its outline alone, even if shrunk very
small. Reminder: no text, letters or numbers anywhere, and no shields.
```

### 10.5 Prompt — arkusz 2: trzy dwuręczne + wzorzec skali

Proporcje obrazu **16:9**. Blok z §10.3, a pod nim:

```text
TASK: four swords in one row, from left to right in this exact order.
Relative total lengths are given in brackets. The first sword is only a
scale reference; the rightmost one fills the whole image height.

1. Arming sword (40): classic knight's sword, straight double-edged blade
   with a fuller, straight crossguard, one-hand grip, disc pommel.
2. Bastard sword (52): long straight blade, a noticeably LONGER grip for one
   and a half hands, pear-shaped pommel, straight crossguard.
3. Two-handed greatsword (59): very long straight blade, long straight
   crossguard, long two-hand grip, heavy round pommel.
4. Zweihander (80): enormous. A dark fuller runs along the WHOLE blade. Just
   above the main crossguard the blade has an unsharpened base with two
   small side hooks (parrying lugs). Very wide crossguard, very long grip,
   big pommel.

Each sword must be recognisable by its outline alone, even if shrunk very
small. Reminder: no text, letters or numbers anywhere, and no shields.
```

### 10.6 Ocena arkusza (odrzuć od razu, jeśli…)

- któryś miecz nie stoi pionowo albo sztych nie jest u góry;
- skala się rozjeżdża (np. rapier krótszy od miecza, bastard krótszy od
  miecza długiego) — relacja długości to połowa informacji;
- **kord albo tasak ma obosieczną głownię**, szabla jest prosta, rapier nie
  ma pałąka, wielki miecz nie ma haczyków — to są cechy, nie detale;
- złoto, klejnoty, runy, napisy.

Pojedynczy nieudany miecz nie wymaga nowego arkusza — wystarczy mi opis
poprawki; piksele i tak rysuje generator.

### 10.7 Wynik v1 (2026-09-28) — PRZYJĘTY jako projekt

Pliki: `docs/art-review/gemini/swords_1h_v1_raw.png` (240×133) i
`swords_2h_v1_raw.png` (235×134). Oba przeszły §10.6 bez odrzutu.
Długości zmierzone z alfy (bbox kolumny), przeliczone na miecz = 40:

| miecz | cel | v1 | uwaga do generatora |
|---|---|---|---|
| krótki miecz | 29 | 30 | ✅ szeroka głownia, gałka-dysk |
| kord | 35 | 36 | ✅ płaska rękojeść z nitami, bez gałki · ⚠ jelec za długi (miał być krótki) — skrócić |
| tasak | 37 | 38 | ✅⭐ najlepszy w arkuszu: rozszerzenie ku sztychowi, ścięty czubek od strony grzbietu |
| miecz | 40 | 40 | ✅ zbrocze, gałka-dysk |
| szabla | 39 | 39 | ✅ krzywizna, rękojeść zagięta w hak · ⚠ ozdoba na środku jelca — pominąć |
| miecz długi | 44 | 44 | ⚠ różni się od miecza praktycznie tylko długością — **najsłabsze ogniwo rodziny** |
| rapier | 48 | 47 | ✅ pałąk + pierścień, bardzo czytelny |
| bastard | 52 | 48 | ✅ dłuższy trzon, gałka-gruszka · za krótki (skala arkusza 2 się ścisnęła) |
| dwuręczny | 59 | 53 | za krótki · ⚠ ciemne kropki na lewej krawędzi głowni (jak szczerby) — nie przenosić |
| wielki miecz | 80→62 | 63 | ✅ haczyki nad jelcem, zbrocze przez całą głownię, szeroki jelec |

Kolejność długości zachowana w obu arkuszach. Ściśnięcie skali arkusza 2 nie
ma znaczenia — **długości bierze generator z tabeli §10.1**, z arkusza tylko
sylwetki i cechy rozpoznawcze.

⚠ Arkusz ma ~2,8× rozdzielczość gry (miecz = 111 px wysokości przy celu
40 px). Zgodnie z §9 nie jest źródłem pikseli.

⭐ **Miecz długi wymaga cechy, której Gemini nie dało:** w generatorze
dostaje wyraźnie węższą głownię bez zbrocza (grań) i dłuższy trzon niż
miecz — sama długość w polu 32×64 nie wystarcza.

### 10.8 Generator (2026-09-28) — PRZYMIAR, czeka na ocenę autora

`tools/build_sword_icons.py` — natywny rysunek, długość = cm × 0,44 z
asercją. Pionowe ikony wyśrodkowane w 32×64 jak pawęż, krótki miecz na osi
45° w osiach broni (`s`, `u`) jak noże. Asercje: wymiar płótna, długość ±1,
tabela ↔ cm × 0,44, kolejność długości, zamknięte dziury (rapier MUSI je
mieć — pałąk), paleta, odrębność sylwetek (1−IoU ≥ 0,15). Każda sprawdzona
psuciem danych.

✅ **ROZSTRZYGNIĘTE 2026-10-01 przez autora:** „gabaryt 1×2 mają mieć też
bronie — to nie wyjątek, to reguła; łatwiej rysować duże i średnie bronie na
dwóch kratkach". Dziewięć mieczy zostaje na 1×2, krótki miecz na 1×1;
znaczniki „TYMCZASOWE" zdjęte, `gabaryt_przymiar` zielony (reguła ikony
konstrukcji, §A). ⚠ Przy wpięciu znaleziony i naprawiony błąd utraty
przedmiotu przy zamianie w lalce (`OI-124`, `docs/systemy/inventory.md` §11).
✅ **UŁOŻENIE rozstrzygnięte tego samego dnia — §10.9: miecze 1×2 po skosie.**

Stan sprzed decyzji (dla porządku): ⏸ **ZAPARKOWANE 2026-09-28.** Pliki zapisane,
wpięcie TYMCZASOWE i niezacommitowane (znacznik `⚠ TYMCZASOWE — podgląd ikon
mieczy` w `GameConfig.ts` i `Assets.ts`). `gabaryt_przymiar.mjs` świeci przez
nie 4 błędami — spodziewanymi. Otwarte pytanie: kord/tasak/miecz/szabla
w 1×1 po przekątnej (mieszczą się: 35–40 px przy przekątnej ~43 px) czy
zostają w 1×2 pionowo (na kratce plecaka wyglądają przy sztyletach słabo).

Pierwotny plan (przed tymczasowym wpięciem): po akceptacji `--zapisz`,
`ASSETS.iconWeapon*` + `iconTexture` przy przedmiotach, a dla dziewięciu
pionowych `inventoryFootprint: { w: 1, h: 2 }` — to zmienia zajętość plecaka,
więc idzie razem z wpięciem, nie wcześniej. Stary `build_ikony_mieczy.py`
(kafle w `items.png`) staje się wtedy ścieżką awaryjną.

### 10.9 Miecze PO SKOSIE 1:2 (2026-10-01) — ZAPISANE i WPIĘTE

Autor po przymiarze trzech mieczy na półce plecaka (pion vs skos, obok
sztyletów i drzewcowych): **„o niebo lepiej pasuje do gry"**.

⭐ **REGUŁA dla całej broni: zawsze po skosie, kąt wynika z gabarytu** —
`1×1` → 45° (sztylety, krótki miecz), `1×2` → 1:2 od rogu do rogu (miecze od
kordu, drzewcowe). Następne rodziny (topory, obuchy) rysuje się tak samo.

`tools/build_sword_icons.py` przepisany: dziewięć rysunków przeszło z pionu
**wiersz w wiersz** (wiersz pionu = 1 px wzdłuż osi), więc proporcje, długości
i cechy rozpoznawcze się nie zmieniły; krótki miecz bajt w bajt ten sam.
Trzy wady przymiaru, naprawione:
- **kropkowanie głowni** — ton liczony od ciągłej odległości od osi skakał
  między pikselami z wiersza na wiersz; dziś rysunek jest w PASACH (dwie
  kolejne `u` = dokładnie 1 px na wiersz), więc każdy ton to równy pasek;
- **prawy dolny róg** — jelec i gałka dotykały ramki; kotwica jest
  DOBIERANA (najbliżej rogu bez dotknięcia ramki), wyszło (29, 62),
  kord (28, 61), szabla (30, 60);
- **rapier** — pałąk przeniesiony na stronę światła (lewa-dół), po stronie
  cienia leży róg płótna.
Wielki miecz: 62 px (79 nie mieści się; tyle samo co w pionie).
⭐ **2026-10-02: krótki miecz też na 1×2 po skosie** — decyzja autora „1×1
tylko dla broni krótkiej typu sztylet" (próg ~45 cm; toporek zostaje 1×1).
Szeroka głownia 7 pasów, jelec 2 pasy szerszy (przy 1 pasie czytał się jak
nóż). Kod 45° z osiami noży usunięty z generatora.

Nowa asercja **„ucięty"**: ten sam rysunek na dużym płótnie z kotwicą
przesuniętą o (32, 64) — przesunięcie zachowuje wzór pikseli — musi dać tyle
samo pikseli co ikona. ⛔ Nie „piksel na pas": kratka 1:2 ma wyznacznik 5,
pas wiersza dostaje legalnie 0–2 piksele.

⚠ Do oceny w grze: miecz zwykły (40 px) leży w dolnej części kafla 1×2 —
spójnie z kotwicą głowicy, ale na półce wydaje się mniejszy niż w pionie.

---

## 11. WSAD 5 — drzewcowe (6 sztuk, jeden arkusz)

Wsad robiony przed zamknięciem mieczy (§10.8), bo pytanie, które je
zaparkowało (1×1 czy 1×2), drzewcowych **nie dotyczy**: żadna nie mieści się
w 32 px, wszystkie są 1×2.

### 11.1 Decyzje przed wsadem (domyślne — do potwierdzenia przez autora)

| decyzja | wybór | dlaczego |
|---|---|---|
| **Gemini = projekt** | jak §9/§10: sylwetka i cecha rozpoznawcza z arkusza, **piksele rysuje generator** (przyszły `build_polearm_icons`, na wzór `build_sword_icons.py`) | Drzewce ma 2–3 px szerokości; skalowanie arkusza zjadłoby je tak samo jak jelce. |
| **Gabaryt** | **1×2, 32×64** — wszystkie sześć | Żadna nie mieści się w 32 px. |
| **Układ** | ✅ **SKOS 1:2 od rogu do rogu** (~63°): grot w lewym górnym, koniec drzewca w prawym dolnym (decyzja autora 2026-09-30 — „po skosie wyglądają lepiej") | Przymiar trzech układów: pion sztywny i pusty; **45° w 32 px kończy się na ~43 px** i rohatyna czyta się jak miecz z jelcem; skos 1:2 daje ~65 px (dłużej niż pion) i czyste schodki 2 px. ⚠ Koszt: odbicie względem osi 1:2 nie przekłada kratki na siebie, więc symetryczny liść ma krawędzie o różnych schodkach. **Prompt Gemini zostaje pionowy** — projekt czyta się łatwiej, skos robi generator. ⚠ Miecze 1×2 (§10.8) stoją dziś PIONOWO; jeśli ten układ zostanie, pytanie o nie wraca. |
| **Skala** | ⚠ **GROT w skali 0,44 px/cm, DRZEWCE skrócone.** | Pełna skala nie wchodzi: włócznia 220 cm = 97 px, pika 450 cm = 198 px. Grot jest tym, co gracz porównuje z mieczem w sklepie i czym broń się różni; drzewce „jest po prostu długie". Tak samo jak u mieczy skala dotyczy **długości**, szerokość ustawia czytelność. |
| **Długość całości** (wzdłuż osi skosu) | pika **64** (jedyna od rogu do rogu) · włócznia, halabarda, glewia **60** · rohatyna **58** · widły **56** | Kolejność realnych długości zachowana, a pika — jedyna, której tożsamością jest samo drzewce („dłuższe od dwóch ludzi") — dostaje wyraźny naddatek. Różnice 2–4 px są celowo małe: to porządek, nie pomiar. Koniec drzewca zawsze w prawym dolnym rogu (kotwica), krótsze kończą się dalej od lewego górnego. (Przed skosem: 62/58/56/54 w pionie.) |
| **Materiał** | stal · **widły żelazo** (jedyne; `material: "iron"`) · drzewce: jesion z `tools/wood_palette.py` | Widły muszą czytać się jako narzędzie z kuźni od lemieszy. |
| **W dłoni** | nie dotyczy | Rig 2D (`iconRestDeg` −135, reguła 17,6 px przy włóczni) to legacy do usunięcia — decyzja autora z §10.1. Broń w dłoni przejdzie na model 3D (`docs/roadmap.md` §0.1). |

### 11.2 Lista

Długość grotu: cm × 0,44, od sztychu do końca tulei (bez okuć na drzewcu).

| przedmiot | id | materiał | grot ~cm → px | całość px (skos) | CECHA ROZPOZNAWCZA (musi przeżyć 32 px szerokości) |
|---|---|---|---|---|---|
| *Miecz — kotwica skali* | `sword` | stal | 90 → 40 (cały miecz) | 40 | tylko punkt odniesienia dla wielkości grotów; **nie jest częścią wsadu** |
| Włócznia | `spear` | stal | 35 → 15 | 60 | **liść** grotu, gładka tuleja, **nic poprzecznego** |
| Pika | `pike` | stal | 25 → 11 | **64** | **najwyższa**, **najmniejszy i najwęższy** grot (szpic), **dwa długie okucia (langety)** schodzące po drzewcu, cieńsze drzewce |
| Halabarda | `halberd` | stal | 55 → 24 | 60 | **trzy elementy naraz**: topór z jednej strony, **hak** z drugiej, **szpic** na górze — jedyna asymetryczna na boki |
| Glewia | `glaive` | stal | 55 → 24 | 60 | **długa, jednosieczna, lekko wygięta głownia** jak wielki nóż, przedłużająca linię drzewca; **nic nie sterczy w bok** (odróżnia od halabardy) |
| Rohatyna | `boar_spear` | stal | 45 → 20 | 58 | grot **szerszy i dłuższy** od włóczni + **poprzeczka** pod piórami — poprzeczka to cała tożsamość (opis w grze) |
| Widły | `pitchfork` | **żelazo** | 35 → 15 | 56 | **dwa długie zęby** (U), matowe żelazo, jaśniejsze, surowe drzewce; najniższa |

Opisy w grze (kontekst, nie do wklejenia):
- Pika: *„Drzewce dłuższe od dwóch ludzi. Rozstrzyga, zanim przeciwnik zdąży podejść…"*
- Halabarda: *„Topór, szpic i hak na jednym drzewcu."*
- Glewia: *„Długa, lekko wygięta głownia na drzewcu. Nie zatrzymuje szarży jak pika…"*
- Rohatyna: *„Szeroki grot z poprzeczką pod piórami. Poprzeczka nie jest ozdobą…"*
- Widły: *„Dwa długie zęby na drzewcu wyższym od człowieka. Kuje je ten sam kowal, co lemiesze…"*

⚠ **Najsłabsza para rodziny: włócznia ↔ rohatyna** (obie: liść na tulei).
Różnicę niesie poprzeczka i większy liść rohatyny — w ocenie arkusza (§11.5)
patrz na nią pierwszą. Druga para: **włócznia ↔ pika** — rozdziela je
wielkość grotu, langety i wysokość, nie sam kształt.

### 11.3 Załączniki

Tylko `docs/art-review/gemini/ref_style_shields.png` (jak §3 i §10.2), nowy
czat. Wynik do `docs/art-review/gemini/` jako `polearms_v1_raw.png`
(Snapper niepotrzebny — to tylko projekt).

### 11.4 Prompt

Proporcje obrazu **16:9** (lekcja z pancerza: 16:9 trzyma układ, 4:3 się
łamie). ⚠ Prompt jest PIONOWY także po decyzji o skosie — liczby w nawiasach
to wysokości sprzed skosu; dla projektu liczy się tylko ich kolejność. Blok stylu z **§10.3** (miecze — pionowy układ) z jedną zamianą: akapit
`MATERIALS` zastąp tym poniżej. Pod blokiem wklej `TASK`.

```text
MATERIALS: metal heads are plain STEEL - cool light grey with a crisp
near-white highlight on the edge facing the top-left and darker blue-grey on
the other side - except the pitchfork, which is dull, darker, slightly warm
IRON with low contrast. Shafts are straight wooden poles in warm browns
(base about #734B30, shadows down to #2B1B10, highlights up to #C0896A),
2-3 art pixels thick. No gold, no brass, no gems, no engravings, no runes,
no tassels, no ribbons, no flags. Historical, practical medieval - not
fantasy.
```

```text
TASK: seven weapons in one row, from left to right in this exact order,
standing perfectly VERTICAL, point UP, all bottom ends on the same invisible
baseline. The first one is a sword used only as a scale reference.

The long shafts are SHORTENED so that everything fits in the image; only the
shaft is shortened. The metal HEADS are drawn at the SAME SCALE as the
sword, so a head can be compared with the sword directly. Relative total
heights are given in brackets; the pike is the tallest and almost fills the
image height.

1. Arming sword (40): plain one-handed steel sword, straight double-edged
   blade with a fuller, straight crossguard, leather grip, disc pommel.
2. Spear (58): a plain leaf-shaped steel spearhead, about a third of the
   sword's length, on a round socket. Nothing sticks out sideways - no
   crossbar, no wings.
3. Pike (62): the tallest weapon and the thinnest shaft. A very SMALL,
   narrow, needle-like steel point - clearly smaller than the spearhead -
   with two long thin steel strips running down the shaft below it.
4. Halberd (58): a steel head with THREE parts at once: a broad axe blade on
   one side, a pointed back hook on the other side, and a long straight
   spike on top. The only weapon that sticks out to both sides.
5. Glaive (58): one long, single-edged, slightly curved steel blade - like a
   big knife about half the sword's length - that continues straight up from
   the shaft, cutting edge forward. Nothing on its back, no hook, no spike.
6. Boar spear (56): a steel spearhead that is clearly WIDER and LONGER than
   the spear's, and directly below the blade a short straight steel
   crossbar across the shaft.
7. Pitchfork (54): the shortest. A farm pitchfork: two long, thin, slightly
   curved IRON tines forming a U, forged from one piece, on a plain rough
   pale wooden pole. Clearly a cheap village tool, not a military weapon.

Each weapon must be recognisable by the outline of its head alone, even
when shrunk very small. The weapons do not touch each other. Reminder: no
text, letters or numbers anywhere, and no shields.
```

### 11.5 Ocena arkusza (odrzuć od razu, jeśli…)

- któraś broń nie stoi pionowo albo grot nie jest u góry;
- **włócznia ma cokolwiek poprzecznego**, **rohatyna nie ma poprzeczki**
  albo jej grot nie jest większy od włóczni — to jest cała różnica pary;
- **halabardzie brakuje któregoś z trzech** (topór / hak / szpic);
- **glewia ma hak, kolec albo topór** z boku (staje się halabardą);
- pika nie jest najwyższa albo jej grot nie jest najmniejszy;
- widły mają trzy+ zęby, lśniącą stal albo wyglądają na broń;
- grot wyraźnie gubi skalę (np. halabarda z głowicą dłuższą od miecza);
- złoto, klejnoty, runy, frędzle, chorągiewki, napisy.

Tak jak przy mieczach (§10.6): pojedyncza nieudana broń nie wymaga nowego
arkusza — wystarczy opis poprawki, piksele i tak rysuje generator.

### 11.6 Wynik v1 (2026-09-30) — PRZYJĘTY jako projekt

Plik: `docs/art-review/gemini/polearms_v1_raw.png` (240×135, tło magenta
bez alfy). Przeszedł §11.5 bez odrzutu. Długości zmierzone z maski
(bbox kolumny), przeliczone na miecz = 40; „metal" = piksele szare,
razem z tulejami, poprzeczkami i langetami:

| broń | cel całość | v1 | cel grot | v1 metal | uwaga do generatora |
|---|---|---|---|---|---|
| włócznia | 58 | 52,1 | 15 | 18,4 | ✅ liść na tulei, nic w bok |
| pika | 62 | 55,3 | 11 | 29,7* | ✅ najwyższa, maleńki szpic z kołnierzem, langety · ⚠ ciemna kropka przy lewej langecie — nie przenosić |
| halabarda | 58 | 53,5 | 24 | 21,6 | ✅ topór (półksiężyc), hak, szpic — wszystkie trzy |
| glewia | 58 | 53,0 | 24 | 26,1 | ✅ wygięta, jednosieczna, sztych odchylony, nic w bok |
| rohatyna | 56 | 51,2 | 20 | 22,0 | ✅ długa poprzeczka · ⚠ liść tylko ~20% dłuższy od włóczni — w generatorze wyraźnie większy |
| widły | 54 | 48,1 | 15 | 16,6 | ✅ dwa zęby w U, matowe żelazo, jasne drzewce, najniższe |

\* z langetami. Kolejność całości zachowana (pika > halabarda > glewia >
włócznia > rohatyna > widły); skala całości ściśnięta jak w arkuszu mieczy
dwuręcznych — bez znaczenia, liczby bierze generator z §11.1–11.2. **Groty
trzymają skalę miecza** (±3 px), czyli prompt „heads at the same scale" działa.

### 11.7 Generator (2026-09-30) — ZAPISANY i WPIĘTY do gry

`tools/build_polearm_icons.py` — skos 1:2 w całkowitych osiach broni
(`s = x + 2y`, `u = 2x − y`; pas 4 kolejnych `u` = dokładnie 2 px drzewca na
wiersz). Groty z §11.2 w skali 0,44, całość z §11.1. Asercje: wymiar płótna,
tabela grotu ↔ cm × 0,44, długość grotu i całości ±1,5, kolejność, **pika
najdłuższa**, wnętrze nie dotyka ramki, brak zamkniętych dziur, paleta,
**gatunek metalu grotu** (widły żelazo, reszta stal), odrębność grotów
1−IoU ≥ 0,15 (najbliżej: włócznia/rohatyna 0,31). Każda sprawdzona psuciem
danych — dwie (ramka, dziury) zaświeciły same w trakcie strojenia.

Co wyszło dopiero na renderze (4 przebiegi):
- **widły**: drzewce wlewało się między zęby (drzewce zaczyna się dopiero pod
  grotem); rozchylone końce zębów robiły „daszek" czytany jak **trzeci ząb**;
  przy rozstawie 2,3 px szczelina na schodkach 2:1 domykała się konturem →
  rozstaw 2,8;
- **halabarda**: topór na wąskiej szyjce czytał się jak pusta ramka — dziś
  przyklejony do tulei na całej wysokości, jak w prawdziwej;
- **glewia**: przy krzywiźnie 1,4 px wyglądała jak głownia miecza na kiju;
  2,6 px wychodziło poza kafel → 2,1;
- **pika**: jasne langety czytały się jak długa igła → ciemniejsze i krótsze.

✅ **Wpięte 2026-09-30 (decyzja autora):** `--zapisz` → 6 plików
`icon_weapon_<id>.png`, lista `ASSETS.iconWeaponPolearms` + pętla w
`Assets.ts`, `iconTexture` i **`inventoryFootprint: { w: 1, h: 2 }`** przy
sześciu przedmiotach (`icon` z `items.png` zostaje ścieżką awaryjną).
Sprawdzone w silniku: sześć tekstur 32×64, `window.dev.missing` puste,
`load.totalFailed` = 0 we wszystkich scenach, w plecaku każda zajmuje 2 pola.

`gabaryt_przymiar.mjs`: dwie reguły, które drzewcowe unieważniły NA STAŁE,
dostały mocniejszą postać — „gabaryt WYŁĄCZNIE: tarcze migdałowe/legionowe/
pawęże **i drzewcowe**" + odwrotność „**każda** drzewcowa go ma" (sprawdzone
zepsuciem: bez gabarytu piki świeci), oraz „`hands: 2` nie implikuje gabarytu
— wśród dwuręcznych są oba kształty". ⚠ Zostają **3 czerwone** i wszystkie
należą do zaparkowanych mieczy (§10.8): miecze spoza reguły, regresja na
`sword` jako 1×1, `bastard` 1×1. Przed tą zmianą były 4.

⏳ **Otwarte do oceny w grze:** pika ↔ włócznia przy 64 px (różni je szpic
i ciemne langety), czytelność ostrza halabardy. Miecze 1×2 stoją pionowo —
pytanie z §10.8 wraca z nową opcją: skos jak drzewcowe. ✅ Rozstrzygnięte
2026-10-01: miecze też po skosie (§10.9).

---

## 12. WSAD 6 — topory (7 sztuk, jeden arkusz)

### 12.1 Decyzje przed wsadem (domyślne — do potwierdzenia przez autora)

| decyzja | wybór | dlaczego |
|---|---|---|
| **Gemini = projekt** | jak §9–§11: z arkusza sylwetka głowy i cecha rozpoznawcza; **piksele rysuje generator** (przyszły `build_axe_icons`, na wzór mieczy: rysunek w PASACH osi) | Trzonek ma 2 px, broda topora brodatego 1 px — skalowanie arkusza zjadłoby oba. |
| **Układ** | **skos wg gabarytu** (§10.9): `1×1` → 45°, `1×2` → 1:2. Prompt PIONOWY, skos robi generator | Reguła całej broni. ⚠ To pierwsza rodzina, w której cecha rozpoznawcza wystaje **w poprzek** osi — sprawdzian reguły. |
| **Gabaryt** | ⚠ **próg: dłuższe niż krótki miecz (65 cm) → `1×2`.** Na `1×1` zostaje tylko **toporek**; siekiera i topór brodaty (~70 cm) idą na `1×2` | Krótki miecz to dziś najdłuższa broń `1×1`; siekiera i brodaty wypadają między nim a kordem (80 cm, `1×2`). |
| **Strona ostrza** | ostrze po stronie **CIENIA** (prawa-góra skosu), obuch i hak po stronie światła | Tak jak topór halabardy (§11.7): po stronie cienia jest wolne płótno, po stronie światła lewy górny róg. |
| **Skala** | długość trzonka i wysokość głowy: cm × 0,44, jak miecze; **szerokość** głowy ustawia czytelność | Ta sama zasada co miecze i groty. |
| **Materiał** | wszystkie stalowe (żaden topór nie ma `material`) · trzonki: jesion z `tools/wood_palette.py` | Siekiera i toporek mają być narzędziem z wyglądu, nie z gatunku metalu. |

### 12.2 Lista

Długość całości = trzonek + głowa, wzdłuż osi. Wysokość głowy = wzdłuż trzonka.

| przedmiot | id | ręce | ~cm | ~px | pole | CECHA ROZPOZNAWCZA (musi przeżyć ikonę) |
|---|---|---|---|---|---|---|
| *Miecz — kotwica skali* | `sword` | 1H | 90 | 40 | — | tylko punkt odniesienia; **nie jest częścią wsadu** |
| Toporek | `hatchet` | 1H | 40 | 18 | **1×1** | **najkrótszy**, mała klinowa głowa, prosty trzonek |
| Siekiera | `axe` | 1H | 75 | 33 | 1×2 | głowa narzędzia z **płaskim obuchem** z tyłu (atak „Obuch"), krótkie proste ostrze |
| Topór brodaty | `bearded_axe` | 1H | 70 | 31 | 1×2 | **broda**: dolny róg ostrza schodzi długim, cienkim hakiem w dół wzdłuż trzonka; brak obucha |
| Topór bojowy | `battle_axe` | 2H | 105 | 46 | 1×2 | szerokie, łukowe ostrze **i obuch-młotek** z tyłu (atak „Obuch"); grubszy trzonek |
| Topór duński | `dane_axe` | 2H | 140 | 62 | 1×2 | **bardzo szeroki, cienki blat** o płytkim łuku, rogi wysunięte w górę i w dół; nic z tyłu; najdłuższy trzonek wśród toporów |
| Berdysz | `bardiche` | 2H | 160 | 64* | 1×2 | **wielki, wąski PÓŁKSIĘŻYC**, znacznie wyższy niż szeroki, przymocowany w DWÓCH miejscach; dolny koniec ostrza przywiązany do drzewca |
| Labrys | `labrys` | 2H | 110 | 48 | 1×2 | **DWA identyczne ostrza** po obu stronach trzonka (symetria); jedyny bez „przodu" |

\* ścięty do najdłuższej przekątnej kafla, jak wielki miecz.

Opisy w grze (kontekst, nie do wklejenia):
- Toporek: *„Krótki trzonek, jedno ostrze. Do rąbania drewna i, w razie czego, nie tylko."*
- Topór brodaty: *„Długa, cienka broda ostrza schodzi pod samą rękę…"*
- Berdysz: *„Wielki półksiężyc stali na drzewcu do pasa…"*
- Topór duński: *„Szeroki, cienki jak brzytwa blat na drzewcu do ramienia…"*
- Labrys: *„Dwa blaty na wspólnym trzonku, symetryczne co do grama…"*

⚠ **Pary do pilnowania:** siekiera ↔ topór bojowy (obie z obuchem — rozdziela
je wielkość, szerokość łuku i trzonek) · topór duński ↔ berdysz (oba duże —
duński jest SZEROKI, berdysz WYSOKI) · topór brodaty ↔ siekiera (broda vs obuch).

⚠ **Labrys po skosie:** dwa ostrza wystają na OBIE strony osi, a po stronie
światła leży lewy górny róg. Głowa może musieć zejść niżej po osi albo labrys
będzie krótszy — rozstrzyga przymiar, nie prompt.

### 12.3 Załączniki

Tylko `docs/art-review/gemini/ref_style_shields.png`, nowy czat. Wynik do
`docs/art-review/gemini/` jako `axes_v1_raw.png` (Snapper niepotrzebny).

### 12.4 Prompt

Proporcje obrazu **16:9**. Blok stylu z **§10.3**, z akapitem `MATERIALS`
zamienionym na ten niżej. Pod blokiem `TASK`.

```text
MATERIALS: axe heads are plain STEEL - cool light grey with a crisp
near-white highlight on the cutting edge and darker blue-grey toward the
back. Hafts are straight wooden handles in warm browns (base about #734B30,
shadows down to #2B1B10, highlights up to #C0896A). No gold, no brass, no
gems, no engravings, no runes, no leather wraps with tassels. Historical,
practical medieval and Viking-age - not fantasy.
```

```text
TASK: eight objects in one row, from left to right in this exact order,
standing perfectly VERTICAL: haft end DOWN, head UP. All bottom ends on the
same invisible baseline. Every axe blade points to the RIGHT. The first
object is a sword used only as a scale reference. All objects are drawn at
the SAME SCALE; relative total heights are given in brackets.

1. Arming sword (40): plain one-handed steel sword, straight double-edged
   blade with a fuller, straight crossguard, leather grip, disc pommel.
2. Hatchet (18): the smallest. A short straight wooden handle with a small
   wedge-shaped steel head.
3. Woodcutter's axe (33): a working tool. Short straight cutting edge and a
   flat square HAMMER BACK (poll) on the left side of the head.
4. Bearded axe (31): no back at all. The lower corner of the blade runs
   down in a long, thin, hooked BEARD along the handle, leaving a gap
   between the beard and the handle.
5. Battle axe (46): two-handed. A broad, curved cutting edge AND a small
   hammer back on the left. Thicker haft than the woodcutter's axe.
6. Dane axe (62): two-handed, the longest haft of the axes. A very WIDE,
   very THIN blade with a shallow curved edge whose upper and lower horns
   reach up and down. Nothing on the back.
7. Bardiche (64): two-handed, the tallest object. A huge, NARROW, crescent
   blade that is much TALLER than it is wide, fixed to the haft at two
   points; its lower end is tied to the haft below the head.
8. Labrys (48): two-handed. TWO identical crescent blades, one on each side
   of the haft, perfectly symmetrical. The only axe without a front or back.

Each axe must be recognisable by the outline of its head alone, even when
shrunk very small. The objects do not touch each other. Reminder: no text,
letters or numbers anywhere, and no shields.
```

### 12.5 Ocena arkusza (odrzuć od razu, jeśli…)

- któraś broń nie stoi pionowo albo głowa nie jest u góry;
- ostrza nie patrzą w jedną stronę (poza labrysem);
- **siekiera bez obucha** albo **topór brodaty z obuchem** / bez brody;
- **topór duński węższy od bojowego** albo **berdysz szerszy niż wysoki**;
- **labrys niesymetryczny** albo z jednym ostrzem;
- toporek nie jest najmniejszy, berdysz nie jest najwyższy;
- złoto, klejnoty, runy, frędzle, napisy.

Pojedyncza nieudana głowa nie wymaga nowego arkusza — wystarczy opis
poprawki; piksele i tak rysuje generator. Gdy kształt głowy zostanie sporny,
**zdjęcie prawdziwego egzemplarza i szkic na renderze** zamiast opisu (§9).

### 12.6 Wynik v1 (2026-10-01) — PRZYJĘTY jako projekt; generator = PRZYMIAR

`docs/art-review/gemini/axes_v1_raw.png` (592×327). ⚠ **Złamał dwie reguły
§12.5: napisy nad każdą bronią i beżowe tło zamiast magenty.** Przyjęty mimo
to, bo arkusz jest tylko projektem — reguła chroni piksele, których stąd nie
bierzemy. ⭐ Lekcja do promptu: numerowana lista z nazwą i liczbą w nawiasie
(„2. Hatchet (18)") Gemini przepisał jako PODPIS — jak etykiety w §3.

Wszystkie cechy rozpoznawcze z §12.2 są na arkuszu (obuch siekiery, broda
z prześwitem, młotek bojowego, szeroki blat duńskiego, wysoki półksiężyc
berdysza na dwóch mocowaniach, symetryczny labrys). Długości do miecza = 40:
toporek 18,4 · siekiera 30,3 · brodaty 30,6 · bojowy 39,7 · labrys 42,1 ·
duński 47,1 · berdysz 51,7 — kolejność zgodna z tabelą poza parą siekiera ≈
brodaty; długości bierze generator z §12.2.

`tools/build_axe_icons.py` — rysunek w pasach osi jak miecze, toporek na 45°,
reszta 1:2, kotwica dobierana od ramki. Asercje: długość, tabela ↔ cm, ucięcie
(duże płótno), dziury (berdysz MUSI mieć prześwit, reszta nie), paleta,
**obuch** (siekiera i bojowy mają, brodaty i duński nie), **lustro labrysa**,
**ostrze po stronie cienia**, odrębność głów. Na renderze wyszło (2 przebiegi):
pięć tonów w poprzek głowy dawało paski → cztery role (krawędź, górny brzeg,
przy oku, środek); broda i berdysz przy 2 pasach od trzonka zalewane konturem
→ ≥ 4 i ≥ 6 pasów; dolny róg duńskiego za długi („żagiel").
⏸ Nic nie zapisane do `public/assets/`, nic nie wpięte — czeka na ocenę autora.

### 12.7 Poprawki po ocenie autora (2026-10-02) — PRZYMIAR v5

Autor: „dopracuj grafiki i obróć ostrze z prawego górnego na lewy dolny;
jakościowo kształt brody ostrza warto przemyśleć".

1. ✅ **Ostrze po stronie ŚWIATŁA (lewa-dół)**, obuch i młotek po stronie
   cienia. ⚠ Koszt policzony, nie zgadnięty: po stronie światła leży lewy
   górny róg, więc szeroka głowa nie pozwala osi dojść do rogu. **Topór
   duński 62 → 50 px, berdysz 70 → 57 px** (maksima bez dotknięcia ramki).
   Duński dostał węższy blat, a bojowy o pas węższy, żeby zachować kolejność
   długości i „duński szerszy od bojowego" — szerokość duńskiego niosą dziś rogi.
2. ⭐ **Głowa jako WIELOKĄT, nie w pasach osi.** Brzegi biegnące w poprzek
   osi 1:2 wychodziły w pasach poszarpane (wyznacznik kratki 5), krawędź
   tnąca przerywana, broda bez wklęsłego spodu. Dziś obrys głowy to lista
   punktów (t, w) w pikselach, rasteryzowana po środkach pikseli
   i cieniowana w przestrzeni PIKSELI: krawędź tnąca (< 1 px od łamanej
   krawędzi), faza (< 2 px), górny brzeg jasny, spód ciemny, ciemniej przy
   oku. Trzonek, oko i rzemienie zostają w pasach — biegną wzdłuż osi.
   ⭐ Kształt jest teraz DANYMI: szkic autora przekłada się na punkty.
3. **Broda (skeggøx):** jedno lite ostrze — górny brzeg prosty, krawędź tnąca
   długo w dół, a spód wraca BLISKO krawędzi (broda ~2 px) i dopiero przy
   oku skręca do trzonka. Wycięcie nad trzonkiem pod brodą jest głębokie.
   ⚠ Spód poprowadzony prosto od czubka do oka (v4) dawał tasak.
4. Berdysz pogrubiony do ~3 px (przy ~2 px krawędź i faza zabielały całe
   ostrze — „drut"), toporek dostał większą głowę.

Asercje przeszły na dane wielokątów tam, gdzie kratka pikseli kłamie: lustro
labrysa liczone na PUNKTACH (odbicie względem osi 1:2 nie jest symetrią
kratki), obuch = wielokąt po stronie cienia, ostrze = wielokąty po stronie
światła, krawędź tnąca musi leżeć na obrysie, głowa nie może wystawać nad
początek rysunku (inaczej długość kłamie).
✅ **WPIĘTE 2026-10-02 (decyzja autora):** `--zapisz` → 7 plików
`icon_weapon_<id>.png`, lista `ASSETS.iconWeaponAxes` + pętla w `Assets.ts`,
`iconTexture` przy siedmiu przedmiotach i `inventoryFootprint 1×2` przy sześciu
(toporek 1×1). W silniku: tekstury 32×32 / 32×64, `window.dev.missing` puste,
`load.totalFailed` = 0, w plecaku po 2 pola. `gabaryt_przymiar` zielony
(33 przedmioty 1×2, 21 z 37 broni).

---

## 13. WSAD 7 — obuchowe (11 sztuk, DWA arkusze)

### 13.1 Decyzje przed wsadem (domyślne — do potwierdzenia przez autora)

| decyzja | wybór | dlaczego |
|---|---|---|
| **Gemini = projekt** | jak §9–§12; piksele rysuje przyszły `build_blunt_icons` — trzonek w pasach, **głowa wielokątem** (§12.7) | Głowy obuchów wystają w poprzek osi jak głowy toporów. |
| **Próg gabarytu** | ✅ **1×1 tylko do ~45 cm** (decyzja autora 2026-10-02: „1×1 to opcja tylko dla broni krótkiej typu sztylet”). **Wszystkie 11 obuchów → 1×2** | Głowa obucha wystaje w poprzek osi — w kaflu 32 px pod 45° zostałyby z niej 3–4 px. Na 1×1 zostają sztylety i toporek (40 cm). |
| **Strona** | część uderzająca (lico młota, dziób nadziaka) po stronie **ŚWIATŁA**, kolec/obuch po stronie cienia | Jak ostrze topora (§12.7). |
| **Łańcuch i rzemień** | kiścień: trzonek + **łańcuch z widocznymi ogniwami** + kula; korbacz: **rzemień** + okuty ciężarek; cep: dwa drewniane człony na krótkim łączniku. W ikonie łańcuch biegnie dalej po osi skosu, lekko wygięty | `§8`: „łańcuch musi czytać się przy 18 px" — ogniwa co 2 px, nie linia. Rzemień korbacza ma być GŁADKI (brąz), łańcuch kiścienia W OGNIWACH (stal) — to jest różnica pary. |
| **Materiał** | drewno bez żelaza: kij, pałka, maczuga (opis: „ani grama żelaza") · cep: **żelazo** (`material: "iron"`) · reszta stal | Opisy w grze. |
| **Dwa arkusze** | A: sześć krótszych + miecz; B: pięć dłuższych + miecz; każdy w nowym czacie | Podział tylko ze względu na SKALĘ i ciasnotę rzędu (8 sztuk to granica, §12) — gabaryt mają wszystkie ten sam, 1×2. |
| **Prompt bez nazw i liczb na liście** | pozycje opisane słowami („pierwszy od lewej"), wysokości słownie względem miecza | ⚠ Arkusz toporów przepisał „2. Hatchet (18)" jako PODPISY nad bronią (§12.6). |

### 13.2 Lista

| przedmiot | id | ręce | ~cm | ~px | pole | arkusz | CECHA ROZPOZNAWCZA |
|---|---|---|---|---|---|---|---|
| *Miecz — kotwica* | `sword` | 1H | 90 | 40 | — | A, B | tylko skala |
| Pałka | `club` | 1H | 50 | 22 | 1×2 | A | krótki drewniany kołek, **grubszy na końcu**, bez metalu |
| Młot | `hammer` | 1H | 60 | 26 | 1×2 | A | **duży, prostokątny stalowy łeb**, oba lica płaskie (jak młot kowalski) |
| Buzdygan | `mace` | 1H | 60 | 26 | 1×2 | A | okrągła głowa z **piórami (żebrami)** dookoła, stalowy trzonek |
| Nadziak | `war_pick` | 1H | 65 | 29 | 1×2 | A | **długi, zakrzywiony w dół DZIÓB**, malutki młotek z drugiej strony |
| Młot bojowy 1H | `war_hammer_1h` | 1H | 55 | 24 | 1×2 | A | mały łeb z **ząbkowanym licem** + **prosty kolec** z tyłu + **szpic na górze** |
| Korbacz | `chain_mace` | 1H | 55 | 24 | 1×2 | A | krótki trzonek owinięty skórą, **KRÓTKI łańcuch (3 ogniwa)**, mniejszy **jajowaty ciężarek w obręczach** (decyzja autora 2026-10-02: łańcuch, nie rzemień) |
| Osiosany kij | `stick` | 1H | 70 | 31 | 1×2 | B | **krzywa gałąź** z sękami, końcówka zaostrzona nożem, kora miejscami |
| Kiścień | `flail` | 1H | 75 | 33 | 1×2 | B | trzonek + **ŁAŃCUCH w ogniwach** + gładka żelazna **kula** |
| Maczuga | `great_club` | 1H | 85 | 37 | 1×2 | B | **gruby sękaty konar**, ciężki szeroki koniec, bez metalu |
| Młot bojowy 2H | `war_hammer` | 2H | 120 | 53 | 1×2 | B | **ciężki łeb na długim trzonku**, kolec z tyłu |
| Cep bojowy | `peasant_flail` | 2H | 180 | 62* | 1×2 | B | **długi kij + krótki bijak** na łączniku, bijak okuty żelaznymi obręczami |

\* ścięty do najdłuższej przekątnej kafla.

⚠ **Pary do pilnowania:** nadziak ↔ młot bojowy 1H (dziób krzywy i długi vs
kolec prosty + szpic na górze) · kiścień ↔ korbacz (OBA na łańcuchu od 2026-10-02 —
kiścień: długi łańcuch + duża gładka kula; korbacz: krótki łańcuch + mniejsze
okute jajo) · pałka ↔ maczuga ↔ kij (mały kołek / wielki konar /
krzywa cienka gałąź) · młot ↔ młot bojowy 1H (blok bez kolca vs mały łeb
z kolcem).

Opisy w grze (kontekst, nie do wklejenia):
- Kiścień: *„Kula na łańcuchu. Omija tarczę, bo nie leci prosto…"*
- Korbacz: *„Okuty ciężarek na krótkim łańcuchu. Lżejszy od kiścienia i szybszy…"* (do 2026-10-02: „rzemieniu” — zmienione razem z ikoną)
- Nadziak: *„Młotek z długim dziobem, kuty pod jedną rękę i siodło…"*
- Młot bojowy 1H: *„Krótki trzonek, mały łeb i długi kolec z drugiej strony…"*
- Maczuga: *„Gruby konar obrobiony w rękojeść. Nie ma w niej ani grama żelaza…"*
- Cep bojowy: *„Cep do młócenia z bijakiem nabitym żelazem…"*

### 13.3 Załączniki

Tylko `docs/art-review/gemini/ref_style_shields.png`, **każdy arkusz w nowym
czacie**. Wyniki: `docs/art-review/gemini/blunt_short_v1_raw.png` (A)
i `blunt_long_v1_raw.png` (B).

### 13.4 Prompt — wspólny akapit MATERIALS

Blok stylu z **§10.3**, akapit `MATERIALS` zamieniony na:

```text
MATERIALS: metal heads are plain STEEL - cool light grey with a crisp
near-white highlight on the top edges and darker blue-grey underneath -
except the war flail at the end of the second sheet, whose iron bands are
dull, darker, slightly warm IRON. Wooden parts are warm browns (base about
#734B30, shadows down to #2B1B10, highlights up to #C0896A). Leather is a
darker, smoother brown. No gold, no brass, no gems, no engravings, no runes,
no tassels. Historical, practical medieval - not fantasy.
```

### 13.5 Prompt — arkusz A (krótkie, 16:9)

```text
TASK: seven objects in one row, evenly spaced, standing perfectly VERTICAL:
handle end DOWN, head UP, all bottom ends on the same invisible baseline.
The main striking side of every head points to the RIGHT. All objects are
drawn at the SAME SCALE. Do not write any names, numbers or captions above
or below the objects.

The first object on the left is a plain one-handed steel sword, used only as
a scale reference: straight blade with a fuller, straight crossguard,
leather grip, disc pommel.

The second object is about half as tall as the sword: a short wooden
cudgel, a thick peg that gets clearly thicker toward its top end. Only wood,
no metal.

The third object is a little taller: a one-handed hammer with a big
rectangular steel head, both striking faces flat, like a blacksmith's
hammer, on a short wooden handle.

The fourth object is the same height: a flanged mace - a round steel head
made of six vertical flanges (fins) around a centre, on a short steel shaft
with a leather grip.

The fifth object is a bit taller: a horseman's war pick - a long, thin,
DOWNWARD-CURVED beak on the right side of the head and only a tiny hammer
face on the left, on a straight handle.

The sixth object is a little shorter: a one-handed war hammer - a small
hammer head with a toothed (crowned) face on the right, a STRAIGHT spike on
the left, and a short spike pointing straight up from the top of the head.

The seventh object is the same height: a short wooden handle with a short,
smooth, plain LEATHER strap hanging from its top, ending in an egg-shaped
weight shod with steel bands. No chain.

Each object must be recognisable by its outline alone, even when shrunk very
small. The objects do not touch each other. Reminder: no text, letters or
numbers anywhere, and no shields.
```

### 13.6 Prompt — arkusz B (długie, 16:9)

```text
TASK: six objects in one row, evenly spaced, standing perfectly VERTICAL:
handle end DOWN, head UP, all bottom ends on the same invisible baseline.
The main striking side of every head points to the RIGHT. All objects are
drawn at the SAME SCALE. Do not write any names, numbers or captions above
or below the objects.

The first object on the left is a plain one-handed steel sword, used only as
a scale reference: straight blade with a fuller, straight crossguard,
leather grip, disc pommel.

The second object is about three quarters as tall as the sword: a crooked
wooden branch cut to length, with a few knots and patches of bark, its top
end roughly sharpened with a knife. Only wood.

The third object is a little taller: a flail. A short wooden handle with a
steel cap and a small steel ring on its top. From that ring a METAL CHAIN
rises upward in a gentle curve: five separate, interlocking, oval steel
links, each link drawn as a small grey ring with a visible hole in the
middle, alternating face-on and edge-on like a real chain. The chain is
grey metal exactly like the ball - it is NOT a strap, NOT a belt, NOT a
rope, NOT leather and NOT brown. The last link holds a plain smooth round
steel ball, slightly bigger than the handle is wide.

The fourth object is a little taller than the sword: a heavy club made from
a thick, knotty tree limb - narrow at the grip and much wider and heavier at
the top. Only wood, no metal.

The fifth object is much taller, about one and a third times the sword: a
two-handed war hammer - a heavy steel hammer head with a flat face on the
right and a spike on the left, on a long wooden haft.

The sixth object is the tallest, filling the image height: a peasant war
flail - a long wooden pole, and at its top a short thick wooden beater
attached by a short chain link, continuing upward; the beater is wrapped
with dark IRON bands and studs.

Each object must be recognisable by its outline alone, even when shrunk very
small. The objects do not touch each other. Reminder: no text, letters or
numbers anywhere, and no shields.
```

### 13.7 Ocena arkuszy (odrzuć od razu, jeśli…)

- coś nie stoi pionowo albo głowa nie jest u góry;
- **nadziak bez krzywego dzioba** albo **młot bojowy 1H bez szpica na górze**;
- **kiścień bez widocznych ogniw**; **korbacz na rzemieniu** albo z kulą identyczną jak kiścień (ma być krótszy łańcuch i jajowaty ciężarek w obręczach);
- ⚠ **kiścień na pasie/rzemieniu** — v1 (2026-10-02) dał kulę na brązowym
  pasie; prompt opisuje dziś ogniwa wprost i zakazuje pasa, rzemienia, sznura;
- **pałka, kij lub maczuga z metalem**; maczuga niewiele większa od pałki;
- buzdygan bez piór (gładka kula = kiścień bez łańcucha);
- złoto, klejnoty, runy, frędzle.

⚠ Napisy i tło inne niż magenta **nie dyskwalifikują** arkusza-projektu
(§12.6) — zapisz je w ocenie jako lekcję do promptu.

### 13.8 Wynik arkusza B v1 (2026-10-02) — PRZYJĘTY jako projekt

`docs/art-review/gemini/blunt_long_v1_raw.png` (240×132). ✅ Pierwszy arkusz
**bez napisów i na magencie** od wsadu mieczy — prompt bez nazw i liczb na
liście (§13.1) zadziałał. ✅ Kiścień po poprawce promptu (§13.6: pięć
osobnych stalowych ogniw, zakaz pasa, rzemienia, sznura) ma łańcuch w ogniwach;
pierwsza próba dała kulę na brązowym pasie.

Wszystkie cechy z §13.2: krzywa gałąź z sękami i zaostrzonym końcem, łańcuch
+ kula, sękata maczuga szersza u góry, młot z licem i kolcem, cep z bijakiem
w żelaznych obręczach na łańcuchu. Wysokości do miecza = 40: kij 35,7 ·
kiścień 34,2 · maczuga 37,1 · młot bojowy 2H 39,3 · cep 43,2 — długie
ściśnięte jak na każdym arkuszu; długości bierze generator z §13.2.

⚠ **Łańcuch kiścienia i bijak cepa ZWISAJĄ obok trzonka** (łuk nad szczytem
trzonka, kula/bijak w dół), nie przedłużają osi. Domyślnie tak też w ikonie:
zwis po stronie ŚWIATŁA, jak ostrze topora — do potwierdzenia autora.

---

## 14. Wyśrodkowanie WSZYSTKICH ikon w polu (2026-10-02)

Autor po przymiarze (półka: kotwica w rogu vs środek): **„wyśrodkuj w polach
ogólnie przedmioty — spójność to podstawa"**, także 1×1.

- `tools/icon_center.py` — wspólny krok pięciu generatorów (sztylety, miecze,
  drzewcowe, topory, pancerz): przesunięcie CAŁKOWITE, środek prostokąta
  obrysu w środku płótna, tolerancja 0,5 px (asercja `bledy_srodka`,
  sprawdzona wyłączeniem kroku). ⭐ Kontrole KSZTAŁTU (zamrożone SHA1
  sztyletów, długości, dziury) liczą się PRZED przesunięciem — opisują rysunek,
  nie miejsce.
- Wynik: 26 ikon broni + skórzany hełm przesunięte; porównanie z HEAD
  potwierdza, że wycięty rysunek jest identyczny co do piksela. Torba 3 (bez
  generatora) przesunięta jednorazowo. Po zmianie **0 ze 109 ikon** poza środkiem.
- Generatory dalej dobierają kotwicę przy rogu — to tylko sprawdzian, że
  rysunek mieści się w kaflu na pełnej długości; położenie ustawia wyśrodkowanie.
- Gry to nie dotyka: rig 2D broni w dłoni czyta kafle `items.png`
  (`item-icon-*`), nie `iconTexture`, i jest wyłączony przy postaci 3D.

### 13.9 Zwis kiścienia i cepa — ustalenia z przymiaru (2026-10-02)

Autor po dwóch rundach szkiców: zwis „bardziej jak kula na łańcuchu", potem
„łańcuch ciut dłuższy, zwisający drąg cepa ciut dłuższy".

- ⭐ **Zwis PIONOWO w dół ekranu**, nie wzdłuż trzonka i nie w osi. Na skosie
  1:2 „w dół" to w osiach broni g = (2/√5, −1/√5) — zawsze strona ŚWIATŁA.
- **Kiścień:** łuk ze szczytu trzonka (okucie z kółkiem), potem **5 ogniw**
  w zwisie co 2 px, kula r ≈ 2,8 px na końcu. Trzonek bierze prawie całą
  długość — zwisający łańcuch nie dodaje długości.
- **Cep:** krótki łącznik, bijak **12,5 px** zwisający pionowo, okuty żelazem
  na końcach i w środku. ⚠ Mieści się przy **57 px** (cel 62): przy szczycie
  drzewca ~2 px od lewej krawędzi łącznik po stronie światła nie ma miejsca —
  ograniczeniem jest ŁUK łącznika, nie kąt bijaka (sprawdzone: bijak bliżej
  osi dał 58 px).
- Ogniwa: rytm „płasko (2 px, jasne) / bokiem (1 px, ciemne)" co 1,1 px po
  łańcuchu — szkic w scratchpadzie; generator przejmuje te liczby.

### 13.10 Arkusz A v1 + generator (2026-10-02) — PRZYMIAR, czeka na ocenę autora

`docs/art-review/gemini/blunt_short_v1_raw.png` (240×134) — bez napisów, na
magencie, przyjęty jako projekt: pałka grubsza ku górze, młot z prostokątnym
łbem, buzdygan z piórami na stalowym trzonku z owijką, nadziak z długim
zakrzywionym dziobem, młot bojowy 1H z ząbkowanym licem + kolcem + szpicem,
korbacz na KRÓTKIM ŁAŃCUCHU z jajowatym ciężarkiem (autor 2026-10-02:
„korbacz ma mieć łańcuch, nie rzemień" — prompt dostał zakaz rzemienia).

`tools/build_blunt_icons.py` — 11 sztuk, wszystkie 1×2 po skosie, trzonek
w pasach, reszta jako elementy w pikselach (wielokąt, koło, elipsa, łańcuch,
odcinek), zwis pionowy w dół ekranu (§13.9), wyśrodkowanie na końcu.
Asercje: długość, tabela ↔ cm, ucięcie, dziury (dozwolone tylko przy
łańcuchach), paleta, **część uderzająca po stronie światła** (nadziak, młoty
bojowe), **łańcuch zwisa pionowo** (ostatni odcinek ‖ g), **zero metalu**
w pałce, kiju i maczudze, odrębność sześciu par (najbliżej młot ↔ młot
bojowy 1H, 0,26), wyśrodkowanie.

Na renderze wyszło (v1 → v2): buzdygan ze szczelinami w głąb głowy czytał się
jak szczotka → pióra niesie obrys z głębokimi wcięciami + gałka; kolec młota
bojowego 1H ginął przy 7,6 px → 9,6 px; obręcze korbacza jasne na jasnym
ciężarku ginęły → ciemne.
**v3 — czytelność (autor: „dopracuj, zwłaszcza czytelność"):** oceniane przy
wielkości z plecaka, nie przy 8×.
- ⭐ **Głowy powiększone** (`Rys.powieksz`, współczynnik w katalogu `glowa`):
  ×1,25–1,4 dla krótkich (pałka, młoty, buzdygan, nadziak, korbacz),
  ×1,1–1,25 dla długich. Skala 0,44 px/cm dotyczy DŁUGOŚCI; wielkość głowy
  ustawia czytelność — przy 22–26 px długości głowy miały po kilka pikseli.
  Bryły na całej długości (pałka, maczuga) poszerzone tylko w poprzek.
  ⚠ Młot bojowy 2H przy ×1,25 nie mieścił się przy lewym górnym rogu → ×1,1.
- **Drewno brył jaśniejsze o 1–2 szczeble** (pałka, kij, maczuga): cień
  WOOD[3] zlewał się z granatem kafla i konturem.
- **Kij grubszy** (1,7 px, było 1,25) z większymi sękami — czytał się jak patyk.
✅ **WPIĘTE 2026-10-02 (decyzja autora):** 11 plików `icon_weapon_<id>.png`,
`ASSETS.iconWeaponBlunt` + pętla w `Assets.ts`, `iconTexture`
i `inventoryFootprint 1×2` przy jedenastu. W silniku: tekstury 32×64,
`window.dev.missing` puste, `load.totalFailed` = 0. `gabaryt_przymiar`
zielony (45 przedmiotów 1×2, 33 z 37 broni). ⭐ **Cała broń ma własne ikony.**
✅ Opis korbacza w grze zmieniony na „na krótkim **łańcuchu**" (decyzja autora 2026-10-02).

---

## 15. Audyt wizualny ekwipunku jako CAŁOŚCI (2026-10-02)

Po skompletowaniu broni (37), pancerza (55) i tarcz (15). Autor: „spojrzenie
na nie jako całość, dopracowanie czytelności i wizualnie, żeby cieszył oko".
Pomiar na plikach PNG, ocena na półkach ×2 (wielkość z plecaka).

| rodzina | jasność śr | kontrast min do kafla | piksele < 55 | wypełnienie pola | kolorów | kontur / obwód | światło TL−BR |
|---|---|---|---|---|---|---|---|
| broń | 112 | 36 (nóż) | 14% | 8% | 7 | **1,69** | +39 |
| tarcze | 101 | 52 | 11% | 42% | 17 | 1,08 | +34 |
| pancerz | 115 | 47 | 3% | 40% | 6 | 1,01 | **+5** |

**Wnioski:**
1. ⚠ **Kontur broni jest 8-sąsiedni** (narożniki zapełnione → ~1,7 px konturu
   na piksel obwodu), pancerza i tarcz 4-sąsiedni (~1,0). Na cienkich, ukośnych
   przedmiotach podwójny ciemny pas waży tyle co sam przedmiot. Pancerz przeszedł
   tę lekcję wcześniej („4-sąsiedztwo, nie 8", §6.5 pliku pancerza).
2. ⚠ **Światło pancerza słabe i miejscami ODWROTNE** (arkusze Gemini mają
   własne światło): rękawice skórzane −14, onuce −11, łapcie −10, naramienniki
   lamelkowe −8, stalowe rękawice −8, skórzany hełm −6. Broń i tarcze +34…+39.
3. **Kontrast:** najsłabszy nóż (36, 56% pikseli ciemnych — stara rampa noża,
   `OI-126`), dalej skórzane buty, żelazny czepiec, skórzany hełm (47–50).
4. **Wypełnienie:** broń 4–8% pola przy pancerzu ~40% — wynika z kształtu,
   nie z błędu; niesie to wagę wizualną trzonków i grubość konturu.
5. **Grubość trzonków niespójna:** drzewcowe 2 px na wiersz, topory i obuchy
   3 pasy (~3 px) — drzewcowe wyglądają przy toporach wątło.
6. ✅ Spójne: wyśrodkowanie (0 ze 109 poza środkiem), skos wg gabarytu, palety
   (drewno i metal ze standardów), sylwetki w obrębie rodzin.

**Propozycje (do decyzji autora):** A — kontur 4-sąsiedni dla całej broni
(także sztylety: zmiana zamrożonych SHA1); B — wspólna grubość drzewca/trzonka;
C — przebieg ŚWIATŁA dla ikon pancerza o odwrotnym/słabym świetle (jasny brzeg
lewy-górny, ciemny prawy-dolny, w obrębie własnej rampy); D — noże i sztylety
na standard `metal_palette.py` (domyka `OI-126`).

**Plan dalszych ikon** (zapisany w `docs/zadania.md`): `OI-153` zioła (11),
`OI-154` biżuteria + kieł Szarego (+ strzępy skóry), `OI-155` torby
(sprowadzenie do pixel-artu).
✅ **Zrealizowane:** torby 2026-10-04 (`tools/build_bag_icons.py`), zioła,
biżuteria, jedzenie i surowce 2026-10-05 — `docs/gemini_item_icons.md`.

### 15.1 Wykonanie A, B, C (2026-10-02) + przymiar D

Decyzja autora: „robimy A, B, C, D jako przymiar do oceny".

- ✅ **A — kontur 4-sąsiedni dla całej broni** (`Canvas.finalize` w generatorze
  mieczy — z niego biorą topory i obuchy — oraz drzewcowych i sztyletów).
  Kontur / obwód **1,69 → 1,10** (pancerz 1,01, tarcze 1,08). Halabarda
  zostawiła 1 px zamkniętego tła między hakiem a drzewcem (8-sąsiedni go
  zalewał) → generator drzewcowych zatyka mikrodziury ≤ 2 px konturem.
  Zamrożone SHA1 sztyletu i mizerykordii przeliczone świadomie.
- ✅ **C — noże na standard metalu**: rampa noża = stopnie 0, 2, 4
  `metal_palette.py`. Nóż: kontrast **36 → 54**, piksele < 55: **56% → 14%**.
  Stal sztyletów już była standardem — bez zmian. Domyka `OI-126`.
- ✅ **B — przebieg ŚWIATŁA pancerza** (`build_armor_icons.py`, tylko ikony
  z pomiarem < +8): (1) światło odwrotne → **lustro**, jeśli poprawia pomiar —
  przenosi oryginalne cieniowanie bez przemalowania (9 ikon: hełm skórzany,
  onuce, łapcie, rękawice, buty…; bezpieczne, bo przedmioty symetryczne lub
  parzyste); (2) **brzeg** od światła o krok jaśniej, od cienia ciemniej
  (39 ikon); (3) światło od DOŁU, gdzie lustro nie pomaga → **gradient
  wnętrza** (4 ikony: onuce, rękawice skórzane, stalowe rękawice, naramienniki
  lamelkowe). Krok w obrębie rampy materiału (2 szczeble w gęstej rampie
  skóry). Asercja: po przebiegu żadna ikona nie ma światła odwrotnego.
- ⏸ **D — drzewce 3 px (przymiar, niezapisany)**: drzewcowe jak trzonki
  toporów i obuchów; pika zostaje 1 px (to jej cecha). Czeka na ocenę autora.

### 15.2 Poprawki po ocenie autora (2026-10-02)

- **Krótki miecz** „dziwnie szeroki": głownia 7 → **5 pasów** (jak miecz),
  jelec o pas węższy. Niesie go długość i kształt gladiusa (równoległa głownia,
  sztych zbiega się w 4 wierszach), nie szerokość.
- **Buzdygan** „stalowy z kolcami" czytał się jak kolczasty jeż: powiększenie
  głowy ×1,4 → **×1,2**, pióra 4,4 → **3,4 px**.

### 15.3 Druga runda po ocenie autora (2026-10-03)

Autor: „buzdygan mało czytelny, młoty też; krótki miecz lepiej; tarcze
rycerskie z guzikami dziwnie wyglądają; drzewce na 3 px".

- ⭐ **STRUKTURA WARTOŚCI głów obuchów** (`build_blunt_icons.py`, materiały
  `stal_lico` i `stal_jasna`): jedna stal na całej głowie dawała szarą plamę.
  Młot — korpus z jasną górną krawędzią + dwa ciemniejsze, wyższe LICA (było:
  „cegła"); młoty bojowe — ciemniejsze OKO oddziela lico od jasnego kolca
  i szpica. Zasada: **części głowy = osobne tony**, nie jeden ton z jasnym
  i ciemnym brzegiem.
- **Buzdygan, piąta wersja:** korpus z jasną granią i ciemnymi rowkami
  (≥ 1 px — cieńsze gubiły się w wierszach), pióra jako DWA krótkie zęby na
  stronę, ciemny kołnierz pod głową, gałka. Historia odrzuceń: szczotka →
  jeż → mało czytelny → łopatka.
- **Tarcza rycerska bez nitów** — jasna kropka z cieniem czytała się jak guzik.
- **Drzewce 3 px** (trzy pasy: światło / baza / cień, te same tony co trzonki
  toporów i obuchów); pika 1 px. Koniec drzewca przesunięty do (29, 61) —
  szerszy dotykał ramki; **glewia 60 → 58 px** (zakrzywiony sztych przy lewej
  krawędzi).

### 15.4 Ostatnie szlify przed zatwierdzeniem (2026-10-03)

Po przeglądzie całości (107 ikon; kontur 1,01–1,10 we wszystkich rodzinach,
światło min. +0, kontrast min. 48) autor wybrał dwa z trzech szlifów:
1. **Szabla** — przesunięcie sztychu 4 → **6 pasów**: przy wielkości z plecaka
   czytała się prawie prosto obok miecza i miecza długiego.
2. **Skórzany hełm i buty** — najciemniejsze tony skóry o 2 szczeble rampy
   jaśniej (`ROZJASNIJ_SKORE`, buty do stopnia 5, hełm do 4); kontrast
   48–50 → **54–55**, asercja ≥ 52.
Kord ↔ tasak (1−IoU 0,17) zostaje — różnicę niesie okładzina i ścięty sztych.

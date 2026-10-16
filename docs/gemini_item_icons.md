---
typ: OPERACYJNE
domena: assets
tytul: Ikony zioł, biżuterii, jedzenia i surowców z Gemini — lista, prompty i ocena
stan: zywy
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-05
---

# Ikony zioł, biżuterii, jedzenia i surowców z Gemini

> **Po co ten plik.** Broń (37), pancerz (55), tarcze (15) i torby (4) mają
> już nowe ikony. Ten plik zamyka **resztę rosteru**: wszystko, co dziś stoi
> na kolorowej plamce, na starym `items.png` albo na sierpniowej ścieżce GPT
> (miękkie cieniowanie, brak wspólnego konturu i światła).
>
> Bliźniak `docs/gemini_weapon_icons.md` i `docs/gemini_armor_icons.md` —
> lekcje stamtąd (§3 broni: załącznik jako obraz DO EDYCJI, napisy mimo
> zakazu; §4.5 pancerza: hybryda pikseli) obowiązują tu bez powtarzania.
>
> ⛔ **Tylko ISTNIEJĄCE przedmioty.** Nowe sloty (PAS, kolejne amulety) są
> odłożone decyzją autora 2026-10-05 — patrz §1.

---

## 0. Inwentaryzacja (pomiar 2026-10-05, `ITEMS` wykonany przez esbuild)

155 przedmiotów. Stan ikon:

| stan | ile | co |
|---|---|---|
| ✅ nowa ikona (Gemini/generator, kontur 4-sąsiedni, światło TL) | 126 | broń 37, pancerz 55, tarcze 30 (15 rysunków), torby 4 |
| ⛔ **plamka koloru** (`makeItemSwatch`, brak jakiejkolwiek ikony) | **7** | dziewanna, lebiodka, mięta, nawłoć, wrotycz, żywokost, **kieł Szarego** |
| ⛔ **stary `items.png`** | **5** | 4 pierścienie (jeden kafel `(0,14)` barwiony `tintIcon`), naszyjnik `(0,13)` |
| ⚠ **stara ścieżka GPT** (sierpień, 3–6 kolorów, bez wspólnego konturu/światła) | **17** | 5 ziół, 5 jedzenia/mikstura, 7 surowców |

**Do zrobienia: 29 ikon.** Po tej rundzie `items.png` nie ma ani jednego
użytkownika wśród przedmiotów.

✅ **Stan 2026-10-05 po wpięciu: 155 / 155 przedmiotów ma `iconTexture`**
z istniejącym plikiem (pomiar tym samym sposobem). `icon` z `items.png`
zostaje tylko jako ścieżka awaryjna pierścieni, naszyjnika i tarcz.

Poza zakresem: `icon_weapon_hunting_knife.png` leży bez przedmiotu celowo
(`GameConfig.ts`, komentarz przy sztyletach).

---

## 1. Decyzje przed wsadem (autor, 2026-10-05)

| decyzja | wybór | dlaczego / skąd |
|---|---|---|
| **Zakres** | ✅ **tylko istniejące przedmioty** — placeholdery i stare ikony | Autor: przedmioty typu pas „na tym etapie to odkładanie gameplayu w momencie, gdy las jest już grywalną lokacją". **Nowe sloty (PAS, amulety) wracają za ~2 tygodnie (~2026-10-19)** — `docs/odlozone.md` §1. Kolejność po ikonach: **AI stworzeń** (lis ucieka bez końca, nie da się go dogonić — `OI-162`), potem **broń dystansowa albo wioska**. |
| **Jedzenie i surowce** | ✅ **wszystkie 12 od nowa** (nie tylko strzępy skóry) | Cały plecak ma mieć jeden styl, jak broń i pancerz. |
| **Pierścienie** | ✅ **oba podejścia** — to biżuteria pierwszej lokacji, więc z kamieniem i bez. Domyślnie: **2 z oczkiem, 2 bez** (§4.1) | Autor: „oba podejścia kiedyś się przydadzą". Kolor, który gracz już zna (żółty / błękitny / czerwony / zielony), zostaje — niesie go materiał, nie nakładany tint. |
| **Ujęcie zioła** | ✅ **ścięta gałązka PO SKOSIE 45°**: ucięty koniec łodygi w **prawym dolnym** rogu (jak rękojeść broni), kwiat i liście w **lewym górnym** | Jak dzisiejsza piątka, tylko czytelniej; spójne z osią broni. |
| **Cecha rozpoznawcza** | **prawdziwa cecha botaniczna**, widoczna w samej sylwetce | `OI-153`; zioła to realne gatunki („gra bawi, gra uczy") — gracz ma potem rozpoznać roślinę na spacerze. |
| **Gabaryt** | wszystko **1×1, 32×32** | Żaden z tych przedmiotów nie przekracza ~45 cm. |
| **Piksele** | **hybryda jak pancerz** (`gemini_armor_icons.md` §4.5): zmniejszenie do ~28 px + paleta materiału + kontur **4-sąsiedni** + `icon_center.wysrodkuj` | Formy organiczne. ⚠ Cienkie łodygi mogą nie przeżyć zmniejszenia (jak jelce mieczy) — wtedy łodygę dorysowuje generator natywnie, a z Gemini zostaje kształt i cieniowanie kwiatu. |
| **Wsady** | **po grupie podobnych** | Rzeczy, które gracz może pomylić, muszą się różnić **na jednym arkuszu** (cztery żółte zioła razem, dwa białe razem, surowe i pieczone mięso razem, cztery skóry razem). |

---

## 2. Plan wsadów

| wsad | grupa | sztuk | układ | tło | stan |
|---|---|---|---|---|---|
| **A** | zioła: żółte i białe kwiaty | 6 | 3×2, 4:3 | magenta `#FF00FF` | ✅ v1 przyjęty i wpięty — §3.6 |
| **B** | zioła: liście i kwiaty fioletowe | 5 + kotwica | 3×2, 4:3 | ⚠ **cyjan `#00FFFF`** | ✅ v1 przyjęty i wpięty — §3.6 |
| **C** | biżuteria + kieł Szarego | 6 | 3×2, 4:3 | magenta | ✅ v1 przyjęty i wpięty — §4.4 |
| **D** | jedzenie + mikstura | 6 | 3×2, 4:3 | magenta | ✅ v1 przyjęty i wpięty — §5.4 |
| **E** | surowce zwierzęce | 6 | 3×2, 4:3 | magenta | ✅ v1 wpięty — §6.4; gruczoł v2 — §6.6 |

⚠ **Wsad B ma tło CYJAN, nie magentę** — różowa lebiodka, liliowa mięta
i fioletowe dzwonki żywokostu leżą za blisko `#FF00FF`, a zdejmowanie tła
po odległości zjadłoby kwiaty (lekcja z `tools/CLAUDE.md` o zielonym tle
i spódnicy Dobrawy). We wsadzie C błękitny szklany pierścień wyklucza cyjan,
więc tam zostaje magenta.

**Każdy wsad w NOWYM czacie.** Jedyny załącznik:
`docs/art-review/gemini/ref_style_shields.png` (wzorzec stylu). Kotwica
stylu we wsadzie B to sztuka z wsadu A **opisana tekstem**, nie załączona.

**Gdzie wrzucić wynik** (po Pixel Snapperze, jak dotąd):
`docs/art-review/gemini/<wsad>_v1_raw.png` — nazwy w każdym rozdziale.

---

## 2.1 Stały blok stylu (angielski — wklejany na POCZĄTKU każdego wsadu)

Wariant bloku z pancerza. Dwie zmiany: akapit MATERIALS jest per wsad
(wklejany pod spodem), a tło jest parametrem (`<BACKGROUND>` = `#FF00FF`
albo `#00FFFF` według tabeli w §2).

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
object. Light from the top-left: the top-left edges are lighter, the
bottom-right edges darker. Each material uses 3-5 flat tones stepped by hand.
Silhouette first, detail second - every object must still be recognisable
when shrunk to 32 pixels.

BACKGROUND: solid flat <BACKGROUND> everywhere outside the objects. No floor,
no shadow, no vignette, no frame, no grid lines between the objects. Nothing
else in the picture may use this background colour.

Grounded, historical, practical medieval village - not fantasy. No magic
glow, no sparkles, no runes, no engravings, no decorative trim.
```

---

## 3. Zioła (11) — wsady A i B

### 3.0 Akapit MATERIALS i LAYOUT dla obu wsadów zioł

```text
PLANTS: real European wild plants drawn as a botanist would recognise them.
Greens shift in hue: shadows are cooler and bluer, lights are warmer and more
yellow - never one flat olive green. Leaves of different species have clearly
different greens (fresh, dark, grey-felted) as described for each item.
Flowers are flat, saturated and clean, brighter than the leaves.

LAYOUT OF EVERY PLANT: one freshly cut sprig, lying alone on an exact
45-degree diagonal. The CUT END of the stem points to the BOTTOM-RIGHT corner
of its square; the flowers and leaf tips point to the TOP-LEFT. The sprig
fills the diagonal of its square with a small margin on every side. No pot,
no soil, no roots unless the item says so, no basket, no string, no hand.
```

### 3.1 Wsad A — lista (żółte i białe kwiaty)

**Grupa najbardziej myląca w grze:** cztery żółte i dwa białe. Każde dostaje
inny KSZTAŁT kwiatostanu — to on niesie tożsamość w 32 px, nie kolor.

| komórka | przedmiot | id | CECHA ROZPOZNAWCZA (sylwetka) |
|---|---|---|---|
| 1 | Dziewanna | `dziewanna` | **gęsty KŁOS** żółtych kwiatków ciasno na grubej łodydze + **szarozielony, filcowy** liść — najjaśniejsza, najbardziej srebrzysta zieleń w grze |
| 2 | Dziurawiec zwyczajny | `dziurawiec` | luźny baldach **GWIAZDEK** (5 płatków + pędzelek pręcików), drobne **parzyste owalne listki** z jasnymi kropkami, cienka rdzawa łodyga |
| 3 | Nawłoć pospolita | `nawloc` | **WYGIĘTA WIECHA** — złote pióropusze łukiem w jedną stronę, wąskie lancetowate liście |
| 4 | Wrotycz pospolity | `wrotycz` | płaska tarcza żółtych **GUZIKÓW bez płatków** + ciemny, **pierzasto wcięty** liść jak paproć |
| 5 | Rumianek pospolity | `rumianek` | 2–3 koszyczki: **wypukła żółta KOPUŁKA w białym wieńcu**, nitkowate liście |
| 6 | Krwawnik pospolity | `krwawnik` | jeden **PŁASKI BIAŁY TALERZ** z dziesiątek drobnych kwiatków (bez żółtego środka) + długi, drobno pierzasty liść |

Pary do pilnowania: **kłos ↔ gwiazdki ↔ wiecha ↔ guziki** (żółte),
**kopułka w wieńcu ↔ płaski talerz** (białe — dziś rumianek i krwawnik są
prawie nie do odróżnienia).

### 3.2 Wsad A — prompt

Proporcje **4:3**. `<BACKGROUND>` = **`#FF00FF`**. Blok §2.1, akapit §3.0,
a pod nimi:

```text
TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One cut herb sprig per square, all six in exactly the
same style. Order: top row left to right = items 1-3, bottom row left to
right = items 4-6.

1. Great mullein (Verbascum): the top of a thick, straight stalk carrying a
   DENSE SPIKE of small flat yellow five-petal flowers packed tightly all
   around it, and at the cut end one big, thick, soft leaf covered in felt -
   pale silvery grey-green, the palest green in the image.
2. St John's wort (Hypericum perforatum): a thin rusty-brown stem branching
   at the top into a loose flat cluster of bright yellow STAR-shaped flowers,
   each with five separate petals and a tuft of fine stamens in the middle.
   Small oval leaves in opposite pairs along the stem, with tiny light dots.
3. Goldenrod (Solidago): a stem ending in a CURVED, ARCHING PLUME - many
   tiny golden-yellow flowers along branches that all bend over to one side,
   like a golden feather. Narrow lance-shaped leaves below.
4. Tansy (Tanacetum vulgare): a stiff stem ending in a flat-topped cluster of
   round yellow BUTTONS with NO petals at all, and one dark green leaf deeply
   cut on both sides like a fern frond.
5. Chamomile (Matricaria chamomilla): two or three small daisy flowers on
   thin stems - each a raised, DOMED yellow centre in a ring of white petals
   - and very thin, thread-like feathery leaves.
6. Yarrow (Achillea millefolium): one FLAT, dense WHITE PLATE made of dozens
   of tiny white flowers with no yellow centre, on a straight stem, and one
   long narrow leaf finely divided like a feather.

The six sprigs must be recognisable from each other by silhouette alone:
dense spike, loose stars, curved plume, flat buttons, domed daisies, flat
white plate.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, every sprig on the same 45-degree diagonal with the cut end at the
bottom-right, and no shields.
```

### 3.3 Wsad B — lista (liście i kwiaty fioletowe)

| komórka | przedmiot | id | CECHA ROZPOZNAWCZA (sylwetka) |
|---|---|---|---|
| 1 | Babka lancetowata | `babka` | 2–3 długie **wąskie liście z RÓWNOLEGŁYMI żyłkami** wzdłuż + cienki bezlistny pęd z krótkim **brązowym walcem** na końcu |
| 2 | Pokrzywa zwyczajna | `pokrzywa` | **pary sercowatych liści z PIŁKOWANYM brzegiem**, ciemna soczysta zieleń, ostry liść szczytowy |
| 3 | Mięta polna | `mieta` | parzyste, ząbkowane owalne listki w **świeżej, jasnej** zieleni i **liliowe KULKI kwiatów w KĄTACH liści** wzdłuż łodygi — szczyt to liście, nie kwiat |
| 4 | Lebiodka pospolita | `lebiodka` | **purpurowa łodyga** i **zaokrąglona kępa różowo-liliowych kwiatków NA SZCZYCIE** z ciemnofioletowymi pączkami, gładkie owalne listki |
| 5 | Żywokost lekarski | `zywokost` | **zwisające rurkowate DZWONKI** fioletowo-niebieskie w zawiniętym gronie, szorstki duży liść, a **zamiast uciętej łodygi — gruby CZARNY KORZEŃ** z białym przekrojem (to korzeń się zbiera) |
| 6 | *kotwica:* Rumianek | — | ta sama sztuka co A5, tylko do trzymania skali i stylu; **do gry idzie wersja z wsadu A** |

Pary do pilnowania: **mięta ↔ lebiodka** (kwiaty w kątach liści ↔ kępa na
szczycie), **babka ↔ pokrzywa** (równoległe żyłki ↔ piłkowany brzeg).

### 3.4 Wsad B — prompt

Proporcje **4:3**. `<BACKGROUND>` = **`#00FFFF`**. Blok §2.1, akapit §3.0,
a pod nimi:

```text
TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One cut herb sprig per square, all six in exactly the
same style. Order: top row left to right = items 1-3, bottom row left to
right = items 4-6.

1. Ribwort plantain (Plantago lanceolata): two or three long, narrow
   lance-shaped leaves, each with 3-5 PARALLEL lighter veins running along
   its whole length, plus one thin leafless stalk ending in a short, dark
   brown CYLINDER-shaped flower head with a pale ring around it.
2. Stinging nettle (Urtica dioica): the top of a stem with opposite PAIRS of
   heart-shaped leaves with deeply SAW-TOOTHED edges and a pointed tip leaf.
   Dark, rich, juicy green.
3. Corn mint (Mentha arvensis): a sprig with opposite pairs of small oval,
   finely toothed leaves in a FRESH, LIGHT green, and small round BALLS of
   pale lilac flowers sitting in the JOINTS where the leaves meet the stem,
   along its length. The tip of the sprig is leaves, not flowers.
4. Wild marjoram (Origanum vulgare): a purple-red stem with small smooth oval
   leaves, ending at the TOP in a rounded, branched cluster of tiny pink-lilac
   flowers with dark purple buds.
5. Comfrey (Symphytum officinale): a curled cluster of HANGING, tube-shaped
   bell flowers in violet-blue, one large rough hairy leaf, and instead of a
   cut stem, the bottom-right end is a thick BLACK ROOT with a white cut face.
6. Chamomile: two or three small daisy flowers, each a raised domed yellow
   centre in a ring of white petals, with thread-like feathery leaves.

The six sprigs must be recognisable from each other by silhouette alone:
parallel-veined blades, saw-toothed hearts, lilac balls in the leaf joints,
pink cluster on top, hanging bells with a black root, domed daisies.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, every sprig on the same 45-degree diagonal with the cut end at the
bottom-right, nothing in cyan except the background, and no shields.
```

### 3.5 Ocena zioł (odrzuć od razu, jeśli…)

- którakolwiek gałązka nie leży po skosie albo ucięty koniec nie jest w prawym dolnym;
- dziewanna nie ma ZWARTEGO kłosa albo jej liść jest zwykłą zielenią, nie szarą;
- wrotycz ma płatki (ma być guzik), krwawnik ma żółty środek;
- mięta ma kwiaty na szczycie (wtedy jest lebiodką);
- doniczka, ziemia, sznurek, koszyk; tekst; w B — cyjan w kwiatach.

**Gdzie wrzucić:** `docs/art-review/gemini/herbs_a_v1_raw.png`,
`docs/art-review/gemini/herbs_b_v1_raw.png`.

**Pliki w grze:** dzisiejsze nazwy zostają (`icon_chamomile.png`,
`icon_yarrow.png`, `icon_nettle.png`, `icon_ribwort_plantain.png`,
`icon_st_johns_wort.png`); nowe po angielsku: `icon_mullein.png`,
`icon_goldenrod.png`, `icon_tansy.png`, `icon_corn_mint.png`,
`icon_wild_marjoram.png`, `icon_comfrey.png`.

### 3.6 Wynik v1 (2026-10-05) — PRZYJĘTY, wpięty do gry

✅ **Treść bez poprawek** — każda cecha z §3.1/§3.3 jest na arkuszu: kłos
i filcowy liść dziewanny, gwiazdki dziurawca, wygięta wiecha nawłoci,
guziki wrotyczu, kopułki rumianku ↔ płaski talerz krwawnika, równoległe
żyłki i brązowy walec babki, piłkowane serca pokrzywy, kulki mięty
w kątach liści ↔ kępa lebiodki na szczycie, dzwonki i czarny korzeń
żywokostu.

⚠ **Co przyszło inaczej niż w prompcie:**
- **arkusz A na szarobrązowym tle** (136,117,106), nie na magencie;
- **arkusz B: 5 z 6 gałązek w lustrze** (ucięty koniec w lewym dolnym) —
  zdanie o kierunku w prompcie nie wystarczyło. Generator je lustruje;
  przy kolejnych wsadach po skosie sprawdzać to w pierwszej kolejności.

**Generator:** `tools/build_herb_icons.py` (przymiar / `--podglad` /
`--zapisz`). Potok i powody każdego kroku — nagłówek pliku; fakty
o pikselach — `public/assets/README.md`, sekcja o ziołach.

| miara | zakres | próg (z innej rodziny) |
|---|---|---|
| kontrast do kafla | 57–158 | ≥ 50 (pancerz) |
| gruby kontur | 0,04–0,14 | ≤ 0,15 (pancerz); kontur 8-sąsiedni daje ≥ 0,43 |
| odrębność par z §3.1/§3.3 | 0,78–0,91 | ≥ 0,25 (pancerz) |
| światło TL−BR | −9…+99 | tylko raport — w gałązce jasność rozkłada kompozycja |

**Silnik:** 270/270 plików, `totalFailed` 0, `dev.missing` i `dev.failed`
puste, 11 tekstur `item-icon-*` identycznych z plikami co do piksela.
⏳ Ocena autora w grze (plecak, 1x na telefonie).

---

## 4. Biżuteria i kieł Szarego — wsad C

### 4.1 Lista

Pierścienie: **dwa z oczkiem, dwa bez** (decyzja §1). Kolor, który gracz zna
z dzisiejszego tintu, niesie **materiał** — bez farbowania kafla w kodzie.
⚙ Przy wpięciu `icon` + `tintIcon` ZOSTAŁY jako ścieżka awaryjna (jak przy
tarczach); `iconTexture` ma pierwszeństwo, więc nowa ikona nie jest barwiona.

| komórka | przedmiot | id | kolor w grze | CECHA ROZPOZNAWCZA |
|---|---|---|---|---|
| 1 | Pierścień precyzji | `ring_precision` | żółty | brązowa obrączka z **dużym owalnym, płaskim oczkiem z BURSZTYNU** (miodowy, prześwitujący) — z oczkiem |
| 2 | Pierścień zwinności | `ring_swiftness` | błękitny | **cały ze SZKŁA** — gruba, gładka, bladobłękitna obrączka, bez metalu i kamienia (wczesnośredniowieczne pierścionki szklane, częste w znaleziskach słowiańskich) — bez oczka |
| 3 | Pierścień wigoru | `ring_vigor` | czerwony | cienka **ciemna żelazna** obrączka z **małym okrągłym KARNEOLEM** osadzonym wysoko w miseczce — z oczkiem |
| 4 | Pierścień ochrony | `ring_warding` | zielony | **szeroka płaska obrączka z brązu w ZIELONEJ patynie** z dwoma wypukłymi żeberkami dookoła — bez oczka |
| 5 | Kieł Szarego | `grey_fang` | — | **jeden duży zakrzywiony kieł wilka**, pożółkła kość, ciemniejszy korzeń, **wyszczerbienie** przy czubku |
| 6 | Naszyjnik z kła Szarego | `grey_fang_necklace` | — | ten sam kieł **czubkiem w dół**, korzeń **niezdarnie owinięty** ścięgnem, nad nim **zamknięta PĘTLA rzemienia** |

Pary do pilnowania: bursztyn (duży płaski owal) ↔ karneol (mały, wysoki,
okrągły); szkło (gruba gładka) ↔ patynowany brąz (szeroka z żeberkami);
kieł ↔ naszyjnik (pętla rzemienia).

### 4.2 Prompt

Proporcje **4:3**. `<BACKGROUND>` = **`#FF00FF`**. Blok §2.1, a pod nim:

```text
MATERIALS - THIS IMAGE ONLY: simple village jewellery of early medieval
Central Europe. Bronze, iron, amber, glass and carnelian ARE allowed here.
No gold, no faceted gems, no diamonds, no filigree, nothing fantasy.
Bone and fang: yellowed ivory with a darker brownish root. Leather thong:
warm brown (base about #734B30, shadow #2B1B10).

VIEW OF THE RINGS - THE SAME FOR ALL FOUR: the ring stands upright, seen from
the front and slightly from above, so the band reads as an oval and the top
of the ring (where a stone would sit) faces the viewer at the top. All four
rings are the same size and fill most of their squares.

TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One object per square, all six in exactly the same style,
each centred in its square with a small margin. Order: top row left to right
= items 1-3, bottom row left to right = items 4-6.

1. A bronze ring with a LARGE, flat, oval cabochon of honey-coloured AMBER,
   translucent, with a light spot on its top-left.
2. A ring made ENTIRELY of pale blue GLASS: a thick, smooth, round band with
   no metal and no stone, a crisp light reflection on the top-left.
3. A thin dark IRON ring with a SMALL round deep-red carnelian stone held
   high in a little cup on top.
4. A WIDE, flat BRONZE band covered in green verdigris patina, with two
   raised ribs running around it. No stone.
5. A single large, curved wolf canine fang lying on a 45-degree diagonal,
   point toward the top-left: yellowed ivory, darker brownish root, a small
   chipped notch near the tip.
6. A necklace: the same wolf fang hanging point DOWN, its root clumsily bound
   with a few wraps of dark sinew to a CLOSED LOOP of brown leather thong
   that fills the upper half of the square.

The six objects must be recognisable from each other by outline alone:
big flat amber oval, thick glass band, small high red stone, wide ribbed
band, loose fang, fang on a thong loop.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, and no shields.
```

### 4.3 Ocena (odrzuć od razu, jeśli…)

- pierścienie w różnych rzutach albo różnej wielkości;
- złoto, fasetowane kamienie, ornamenty;
- szklany pierścień ma metal albo kamień; brązowy szeroki nie jest zielony;
- naszyjnik bez wyraźnej pętli (czyta się jak drugi kieł).

**Gdzie wrzucić:** `docs/art-review/gemini/jewelry_v1_raw.png`.
**Pliki w grze:** `icon_ring_precision.png`, `icon_ring_swiftness.png`,
`icon_ring_vigor.png`, `icon_ring_warding.png`, `icon_grey_fang.png`,
`icon_grey_fang_necklace.png`.

### 4.4 Wynik v1 (2026-10-05) — PRZYJĘTY, wpięty do gry

✅ Wszystko zgodnie z §4.1, pierścienie w jednym rzucie i jednej wielkości.
⚠ Tło beżowe zamiast magenty, z **narysowanymi liniami siatki** między
komórkami (mimo „no grid lines”) — komórka przycinana o 3 px.
Wnętrza pierścieni i pętla rzemienia to zamknięte „okna” tła — zalewanie od
brzegu do nich nie dociera, więc generator zdejmuje też zamknięte plamy
koloru tła ≥ 12 px. Karneol na żelazie rozjaśniony (kontrast 45 → 60).

---

## 5. Jedzenie i mikstura — wsad D

### 5.1 Lista

| komórka | przedmiot | id | CECHA ROZPOZNAWCZA |
|---|---|---|---|
| 1 | Bochen chleba | `bread` | **okrągły** wiejski bochen, ciemnozłota skórka z **nacięciem**, mąka na wierzchu |
| 2 | Ser | `cheese` | „krowi, dojrzewał w chłodzie" → **krąg sera z wyciętym klinem**, blada kremowa żółć (nie cytrynowa), ciemniejsza skórka |
| 3 | Jajka | `eggs` | **trzy** jajka w kupce, kremowo-brązowawe |
| 4 | Pieczone mięso | `cooked_meat` | **upieczony udziec na kości**, ciemnobrązowa przypieczona skórka |
| 5 | Mięso królicze | `rabbit_meat` | **ten sam kształt surowy** — różowo-czerwony, białe żyłki tłuszczu, jasny koniec kości. ⚠ Para z 4 na jednym arkuszu: surowe ↔ pieczone |
| 6 | Mikstura zdrowia | `health_potion` | mała **szklana fiolka z korkiem**, czerwony płyn |

⚠ Dzisiejszy chleb to podłużny bochenek, a ser — nasycony cytrynowy klin.
Zmiana kształtu jest świadoma: „bochen" w tej wsi jest okrągły, a ser
z opisu to dojrzewający krąg. Gracz rozpozna je i tak — to jedyne
przedmioty w swoich rolach.

### 5.2 Prompt

Proporcje **4:3**. `<BACKGROUND>` = **`#FF00FF`**. Blok §2.1, a pod nim:

```text
MATERIALS - THIS IMAGE ONLY: plain peasant food of a medieval village.
Warm, appetising but natural colours - no neon, no plastic shine. Glass is
pale green-grey and slightly transparent; cork is light brown.

LAYOUT OF EVERY ITEM: shown alone, centred in its square and filling most of
it (a small margin on every side), seen from the front and slightly from
above. No plate, no table, no cloth, no knife, no hand.

TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One food item per square, all six in exactly the same
style. Order: top row left to right = items 1-3, bottom row left to right =
items 4-6.

1. A ROUND rustic loaf of bread: dark golden-brown crust, one deep cut
   across the top showing lighter crumb, a dusting of flour.
2. A wheel of aged cow's cheese with one WEDGE cut out: pale creamy yellow
   inside with a few small holes, a darker yellow-brown rind.
3. Three eggs in a small pile: creamy, light brownish shells.
4. A ROASTED leg of meat on the bone: dark brown, crisp, glossy roasted skin,
   the pale bone end sticking out to the bottom-right.
5. The SAME leg of meat RAW: pink-red flesh with thin white streaks of fat,
   the pale bone end sticking out to the bottom-right. Clearly uncooked.
6. A small glass vial with a cork stopper, filled with dark red liquid, a
   crisp light reflection on the glass on the top-left.

Items 4 and 5 have the same shape on purpose; only their colour tells
roasted from raw. All six must be recognisable at 32 pixels.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, and no shields.
```

### 5.3 Ocena (odrzuć od razu, jeśli…)

- talerz, stół, nóż; chleb nie jest okrągły; ser bez wyciętego klina;
- surowe i pieczone mięso mają różne kształty albo czytają się podobnym kolorem;
- fiolka świeci (poświata, iskry).

**Gdzie wrzucić:** `docs/art-review/gemini/food_v1_raw.png`.
**Pliki w grze:** dotychczasowe nazwy (`icon_bread.png`, `icon_cheese.png`,
`icon_egg.png`, `icon_cooked_meat.png`, `icon_rabbit_meat.png`,
`icon_health_potion.png`) — nadpisanie, zero zmian w kodzie.

### 5.4 Wynik v1 (2026-10-05) — PRZYJĘTY, wpięty do gry

✅ Bez zastrzeżeń treściowych: okrągły bochen z nacięciem, krąg sera
z klinem, trzy jajka, surowe i pieczone udźce w tym samym kształcie, fiolka
z korkiem. Tło szare 128. Rozjaśnione: pieczeń (39 → 58) i fiolka (33 → 56).

---

## 6. Surowce zwierzęce — wsad E

### 6.1 Lista

Cztery „skóry" to grupa najłatwiejsza do pomylenia — muszą się różnić
**kształtem złożenia i fakturą**, nie samym odcieniem brązu.

| komórka | przedmiot | id | CECHA ROZPOZNAWCZA |
|---|---|---|---|
| 1 | Strzępy skóry | `leather_scraps` | **trzy MAŁE nieregularne skrawki** cienkiej, jasnej skóry królika, nachodzące na siebie, poszarpane brzegi |
| 2 | Wilcze futro | `wolf_pelt` | **złożone** futro, **SZARE** z ciemniejszym grzbietem i jasnym podbrzuszem, **puszysty ogon** zwisa |
| 3 | Skóra dzika | `boar_hide` | sztywna ciemnobrązowo-czarna skóra **ZWINIĘTA w rulon i przewiązana** sznurkiem, **grzebień szczeciny** sterczy z rulonu |
| 4 | Niedźwiedzia skóra | `bear_hide` | **ROZPOSTARTA** cała skóra, ciemna czekolada, kudłaty brzeg, **cztery łapy z jasnymi pazurami** |
| 5 | Pajęcza nić | `spider_silk` | luźny **motek** srebrzystobiałej nici z kilkoma odstającymi pasmami, lekki połysk |
| 6 | Gruczoł jadowy | `venom_gland` | **gruszkowaty, prześwitujący woreczek** w oliwkowej zieleni, połysk, przy wąskim końcu **mały ciemny kieł/przewód** |

### 6.2 Prompt

Proporcje **4:3**. `<BACKGROUND>` = **`#FF00FF`**. Blok §2.1, a pod nim:

```text
MATERIALS - THIS IMAGE ONLY: hunting and skinning materials of a medieval
village. Leather: warm browns (red > green > blue), base about #734B30,
shadows down to #2B1B10, highlights up to #C0896A. Fur is drawn as clusters
of short flat strokes, never as smooth colour. No blood, no gore.

LAYOUT OF EVERY ITEM: shown alone, centred in its square and filling most of
it (a small margin on every side), seen from above or slightly from the
front. No table, no rack, no hand.

TASK: one image divided into six equal invisible squares, 3 across and 2
down. Each square is one 32x32-pixel sprite, upscaled so every art pixel is a
large square block. One item per square, all six in exactly the same style.
Order: top row left to right = items 1-3, bottom row left to right = items
4-6.

1. Leather scraps: three SMALL, irregular offcuts of thin, light tan rabbit
   leather, overlapping each other, with ragged, torn edges.
2. A wolf pelt: a FOLDED grey fur pelt, darker grey along the back, pale
   underside, with a BUSHY TAIL hanging down from it.
3. A boar hide: a stiff, dark brown-black hide ROLLED into a tight roll and
   tied with a cord, with a ridge of long coarse BRISTLES sticking up out of
   the roll.
4. A bear skin: a whole hide SPREAD flat, dark chocolate brown with a shaggy
   outline and FOUR PAWS reaching to the corners, each with small pale claws.
5. Spider silk: a loose skein of silvery-white thread wound into a ball, a
   few loose strands trailing off, a slight sheen.
6. A venom gland: a pear-shaped, glossy, translucent sac in olive green,
   with a small dark fang-like duct at its narrow end.

The four hides must be recognisable from each other by shape alone: small
scraps, folded grey fur with a tail, tied roll with bristles, spread skin
with four paws.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, and no shields.
```

### 6.3 Ocena (odrzuć od razu, jeśli…)

- dwie skóry mają ten sam kształt (złożenie/rulon/rozpostarcie/skrawki);
- wilk nie jest szary; niedźwiedź bez łap; krew;
- gruczoł brązowy (dzisiejszy błąd — patrz komentarz przy `venom_gland` w `GameConfig.ts`).

**Gdzie wrzucić:** `docs/art-review/gemini/materials_v1_raw.png`.
**Pliki w grze:** dotychczasowe nazwy (`icon_leather_scraps.png`,
`icon_wolf_pelt.png`, `icon_boar_hide.png`, `icon_bear_hide.png`,
`icon_spider_silk.png`, `icon_venom_gland.png`) — nadpisanie.

### 6.4 Wynik v1 (2026-10-05) — wpięty; gruczoł do ponowienia

✅ Cztery skóry różnią się kształtem (skrawki / złożone szare futro z ogonem
/ rulon ze szczeciną / rozpostarta skóra z łapami), motek nici czytelny.
⚠ **Każda komórka na innym beżowym tle**, a łapy niedźwiedzia i futro wilka
dotykają brzegu komórki — pierwsze zdjęcie tła (wszystkie kolory brzegu
jako tło) zjadło całą skórę niedźwiedzia. Tłem są dziś tylko kolory
zajmujące ≥ 5% obwodu komórki.
⚠ **Skóra dzika:** prawie czarna. Gamma po kanałach RGB odbarwiła ją na
szaro („kamienny wałek”), więc ciemne skóry rozjaśnia gamma na samej
jasności V, a spirala zwoju, przewiązka i szczecina zostają w kolorze
konturu (tylko we wnętrzu — na brzegu dawały obrys 2 px). Dzik (55) zostaje
ciemniejszy od niedźwiedzia (67).
⛔ **Gruczoł jadowy czyta się jak oliwkowa GRUSZKA** — przewód Gemini
narysowało jak ogonek owocu. Przekolorowanie ogonka na kość nie pomogło
(dalej gruszka z jaśniejszą szypułką), więc w grze stoi wersja z arkusza
(kolor już poprawny — stara ikona była brązowa), a kształt wymaga nowego
arkusza: §6.5.

### 6.5 Prompt — sam gruczoł jadowy (ponowienie)

Proporcje **1:1**. `<BACKGROUND>` = **`#FF00FF`**. Blok §2.1, a pod nim:

```text
TASK: one 32x32-pixel sprite, upscaled so every art pixel is a large square
block, centred in the image and filling most of it.

A spider's venom gland, as harvested by a hunter: a glossy, translucent
KIDNEY-shaped sac lying on its side, sickly yellow-green with darker green
veins showing through, a bright wet highlight on the top-left. Attached to
one end, a small CURVED BLACK FANG, sharp and hooked, clearly the spider's
fang - not a stem. A tiny drop of venom hangs from the fang tip.

It must NOT look like a fruit, a pear, a leaf or a bottle: no stem, no
upright pear shape, no cork. It lies horizontally.
Reminder: absolutely no text, letters, numbers or labels anywhere in the
image, and no shields.
```

**Gdzie wrzucić:** `docs/art-review/gemini/venom_gland_v2_raw.png` —
generator dostanie wtedy osobne źródło dla tej jednej sztuki.

### 6.6 Wynik v2 gruczołu (2026-10-05) — PRZYJĘTY, wpięty do gry

✅ Nerkowaty worek leżący na boku, ciemniejsze żyłki, czarny zakrzywiony kieł
i kropla jadu — przestał czytać się jak owoc. Jedna sztuka na szarym tle 138;
generator bierze cały arkusz (`ARKUSZE["V"]`, komórka `None`). Kontrast 131,
światło +57, bez poprawek punktowych. `materials_v1_raw.png` (1, 2) zostaje
w repo jako zapis odrzuconej gruszki.

---

## 7. Dopasowanie końcowe (Claude, po dostarczeniu arkuszy)

1. Cięcie arkusza na komórki po siatce Pixel Snappera, zdjęcie tła ciasnym
   progiem odległości od DOKŁADNEGO koloru tła (nie heurystyką nasycenia).
2. Zmniejszenie treści do ~28 px, kwantyzacja **wnętrza** do ramp materiału
   (skóra i drewno z `tools/wood_palette.py`, reszta — własne rampy
   z przesunięciem odcienia), **kontur 4-sąsiedni na końcu**.
3. Zioła po skosie: sprawdzenie, czy łodyga przeżyła zmniejszenie; jeśli nie
   — łodyga natywna z generatora.
4. `icon_center.wysrodkuj` + `bledy_srodka`; pomiar jak w audycie §15 pliku
   broni (jasność, kontrast do kafla ≥ 52, kontur/obwód ~1,0, światło TL−BR > 0).
5. Wpięcie: `ASSETS` + `iconTexture` dla siedmiu sztuk bez ikony, usunięcie
   `icon`/`tintIcon` z pierścieni i naszyjnika, nadpisanie pozostałych plików.
   Weryfikacja w silniku: `window.dev.missing` puste, `load.totalFailed` = 0,
   **render plecaka 1:1** (nie raport).

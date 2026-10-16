---
typ: HISTORIA
domena: [stamina, items]
tytul: Kalibracja Modelu D — obciążenie, ruch, sprint, regeneracja, wysiłek
stan: zamkniety
otwarte: [OI-96, OI-104, OI-105]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# AUDYT KALIBRACYJNY — Model D (2026-09-15)

> **Czym ten plik jest.** Zapisem pomiarów, które przesądziły parametry
> startowe Modelu D. Rozstrzygnięcie i jego moc: **`docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`**.
>
> ⛔ **To NIE jest opis dzisiejszej mechaniki.** Modelu D **nie ma w kodzie**.
> Wszystkie liczby „propozycji" są projekcją; „dziś" opisuje stan `src/`
> na 2026-09-15.
>
> **Poprzednik:** `docs/audyt_obciazenia_i_warstw_2026-09-14.md` — tam siedzą
> ZNALEZISKA A i B oraz Modele A/B/C (⛔ wszystkie odrzucone, patrz decyzja §4).
>
> **Metoda.** Wszystkie wartości czytane z `GameConfig.ts` przez
> esbuild → node (wzorzec `tools/katalog_ekwipunku.mjs`), nie przepisywane.
> Powtarza je `tools/obciazenie_przymiar.mjs`.

---

## 1. FAKT — co kod robi dziś

`EQUIPMENT_LOAD`: `udźwig = 20 + 2,5 × Siła` · progi `0,55` / `0,90` ·
mnożniki `1,00` / `1,25` / `1,50`.

**Obciążenie dotyka dziś DOKŁADNIE dwóch rzeczy:** kosztu uniku
(`GameScene.ts` → `Stamina.spend(…, Equipment.loadMultiplier)`) i kosztu
sprintu (`Player.ts`). Plus trzeciej, niezamierzonej — patrz §7.

⛔ **Kanał prędkości ruchu NIE ISTNIEJE.** `Player.ts:499` liczy
`PLAYER.speed × speedMultiplier × (sprint ? 1,6 : 1)`, a `speedMultiplier`
czyta **wyłącznie efekt sieci**. 5 kg i 75 kg biegną 150 px/s.

### 1.1 Wada strukturalna

| Siła | udźwig | najcięższy zestaw nadal **„Lekkie"** |
|---|---|---|
| 20 | 70 kg | 38,5 kg |
| 40 | 120 kg | 66,0 kg |
| 70 | 195 kg | **107,3 kg** |

**Każdą masę da się znormalizować Siłą**, bo kara jest funkcją wyłącznie
`ratio`, a udźwig rośnie liniowo bez sufitu.

---

## 2. Katalog — realne masy

⚠ **Warstwy nie są mechaniką** (`ArmorLayers.ts`: *„to jest DZIŚ METADANA"*),
jeden slot = jeden przedmiot. Pozycje `PROJ` są projekcją.

| # | zestaw | masa | PP | redukcja | eHP |
|---|---|---|---|---|---|
| 1 | kaftan + miecz | 5,5 | 10 | 16,7% | ×1,20 |
| 3 | 4×L1 + broń `PROJ` | 10,5 | 33 | 39,8% | ×1,66 |
| 5 | kolczuga 1/slot + broń + puklerz | 25,5 | 55 | 52,4% | ×2,10 |
| 6 | stal L3 1/slot + broń + tarcza | 34,0 | 71 | 58,7% | ×2,42 |
| 7 | ⭐ **MAKSIMUM OSIĄGALNE DZIŚ** | **47,5** | 83 | 62,4% | ×2,66 |
| 9 | pełny stos, średni `PROJ` | 58,0 | 144 | 74,2% | ×3,88 |
| 10 | pełny stos MAKS, 12 adresów `PROJ` | **75,5** | 162 | **75,0% cap** | ×4,00 |

Suma wszystkich 32 sztuk pancerza: 126,3 kg. Najcięższa sztuka: kirys 17 kg.

⚠ **Dzisiejszy realny sufit to 47,5 kg.** Wszystko wyżej wymaga `OI-98`.

---

## 3. RUCH — oś kg, Siła nie wchodzi

```
speedMul = max(0,68 ; 150 / (150 + max(0 ; kg − 10)))
```

| kg | speedMul | chód px/s | kara | kto dogoni idącego |
|---|---|---|---|---|
| 12 | 0,987 | 148 | 1,3% | nikt |
| 20 | 0,938 | 141 | 6,3% | nikt |
| 25 | 0,909 | 136 | 9,1% | nikt |
| 30 | 0,882 | 132 | 11,8% | nikt (na styk) |
| 35 | 0,857 | 129 | 14,3% | Szary |
| 40 | 0,833 | 125 | 16,7% | Szary |
| 47,5 | 0,800 | 120 | 20,0% | Szary |
| 55 | 0,769 | 115 | 23,1% | Szary |
| 62 | 0,743 | 111 | 25,7% | wataha, Szary |
| 70 | 0,714 | 107 | 28,6% | wataha, Szary |
| **75,5** | 0,696 | **104** | **30,4%** | wataha, Szary |

### 3.1 ⭐ `speedK = 150` jest WYMUSZONY, nie wybrany

Prędkości stworzeń z `GameConfig`: dzik 52 · niedźwiedź 60 · sieciarz 62 ·
królik 70 · wataha-orbita 78 · **skoczek 96** · **wataha-pościg 115** ·
**Szary 132**. Gracz bazowo 150.

| speedK | Szary (132) | wataha (115) | skoczek (96) | werdykt |
|---|---|---|---|---|
| 100 | 24 kg | 40 kg | **66 kg** | ⛔ łamie „odejście zawsze działa"; 30–40 kg nieużywalne |
| 120 | 26 kg | 47 kg | **78 kg** | ⛔ to samo, łagodniej |
| **150** | **30,5 kg** | **55,7 kg** | **94,4 kg** | ✅ |
| 180 | 35 kg | **65 kg** | 111 kg | ⛔ 62 kg nadal odchodzi od watahy |
| 220 | 40 kg | 77 kg | 134 kg | ⛔ ekstremum przestaje kosztować |

⚠ Niezmiennik, którego pilnuje dolny wiersz: komentarz przy `chaseSpeed`
niedźwiedzia i skoczka mówi wprost *„wolniej niż gracz (150), więc odejście
zawsze działa"*.

⚠ **Podłoga `0,68` (102 px/s) wiąże dopiero od 80,6 kg** — poza całym
katalogiem (maks 75,5). Jest backstopem na przyszłe przedmioty, nie elementem
strojenia.

⚠ **Skala odniesienia:** sieć sieciarza to `slowFactor 0,55`, czyli −45%.
Kara masy sięga −30% i ma zostać słabsza od najmocniejszego spowolnienia w grze.

---

## 4. SPRINT — sprawdzony osobno, własnej stałej NIE potrzebuje

Sprint jest różnicowany **dwoma niezależnymi kanałami naraz**: prędkością
(oś kg, bo `sprint = chód × 1,6`) i kosztem (oś ratio).

Zasięg jednego sprintu z pełnej puli (px):

| kg | sprint px/s | @STR 10 | @STR 20 | @STR 40 | @STR 70 | % zasięgu strzelca |
|---|---|---|---|---|---|---|
| 12 | 237 | 4026 | 4026 | 4026 | 4026 | 100% |
| 25 | 218 | 3518 | 3542 | 3542 | 3542 | 88% |
| 35 | 206 | 2558 | 3248 | 3248 | 3248 | 81% |
| 40 | 200 | 2234 | 3044 | 3120 | 3120 | 77% |
| 47,5 | 192 | 1863 | 2567 | 2947 | 2947 | 73% |
| 62 | 178 | 1382 | 1936 | 2305 | 2665 | 66% |
| 75,5 | 167 | 1093 | 1549 | 1858 | 2252 | 56% |

1. ⭐ **Sprint jest najostrzejszym kanałem: ×2,6 różnicy zasięgu** (chód tylko
   ×1,42). Poprawne — pościg i odwrót to miejsce, gdzie masa ma boleć najmocniej.
2. ⭐ **Sprint zawsze ucieka wszystkiemu** — 75,5 kg biegnie 167 px/s przy
   Szarym 132. Sprint zostaje uniwersalnym przyciskiem odwrotu; przestaje być
   darmowy.
3. ⛔ **Nie dokładaj trzeciej stałej na sprint** — dwa kanały dają ×2,6, trzeci
   byłby podwójną karą za to samo.

---

## 5. REGENERACJA — oś kg, Siła nie wchodzi

```
regenMul = max(0,55 ; 100 / (100 + max(0 ; kg − 10)))
```

| kg | regenMul | regen/s (wysiłek) | regen/s (odpoczęty) | kara |
|---|---|---|---|---|
| 12 | 0,980 | 2,94 | 3,92 | 2,0% |
| 25 | 0,870 | 2,61 | 3,48 | 13,0% |
| 35 | 0,800 | 2,40 | 3,20 | 20,0% |
| 40 | 0,769 | 2,31 | 3,08 | 23,1% |
| 47,5 | 0,727 | 2,18 | 2,91 | 27,3% |
| 62 | 0,658 | 1,97 | 2,63 | 34,2% |
| 75,5 | 0,604 | 1,81 | 2,42 | 39,6% |

⭐ **Koszt zamachu NIETKNIĘTY** (miecz: 1,98 pkt). Ten kanał realizuje „kilka
pierwszych ciosów" dosłownie — burst identyczny, wydolność gorsza.

**Wrażliwość `regenK`:**

| regenK | @25 kg | @40 kg | @75,5 kg | przewaga strzelca |
|---|---|---|---|---|
| 70 | 18% | 30% | 48% | ×1,88 — ⛔ 40 kg przestaje być używalne |
| 85 | 15% | 26% | 44% | ×1,73 |
| **100** | **13%** | **23%** | **40%** | **×1,62** ✅ |
| 130 | 10% | 19% | 34% | ×1,48 |
| 180 | 8% | 14% | 27% | ×1,35 — ⛔ kanał przestaje być czuć |

---

## 6. WYSIŁEK — oś ratio, Siła kasuje

```
effortMul = 1 + 0,9 × max(0 ; ratio − 0,55)     ⛔ BEZ SUFITU
udźwig    = 20 + 2,5 × STR  (do 20)  |  70 + 1,0 × (STR − 20)  (powyżej)
```

Mnożnik kosztu uniku i sprintu (litera = etykieta HUD):

| kg | STR 10 | STR 20 | STR 30 | STR 40 | STR 50 | STR 60 | STR 70 |
|---|---|---|---|---|---|---|---|
| 12 | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L |
| 25 | 1,00 Ś | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L |
| 35 | 1,21 Ś | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L |
| 40 | 1,30 Ś | 1,02 Ś | 1,00 L | 1,00 L | 1,00 L | 1,00 L | 1,00 L |
| 47,5 | 1,46 C | 1,12 Ś | 1,04 Ś | 1,00 L | 1,00 L | 1,00 L | 1,00 L |
| 62 | 1,75 C | 1,30 Ś | 1,20 Ś | 1,13 Ś | 1,06 Ś | 1,01 Ś | 1,00 L |
| 75,5 | **2,02 C** | 1,48 C | 1,35 C | 1,26 Ś | 1,18 Ś | 1,12 Ś | **1,07 Ś** |

⭐ **Przy Sile 70 z kary 75,5 kg zostaje 7%** — Siła wykupuje 93% wysiłku,
**a chód przy 75,5 kg to 104 px/s przy KAŻDEJ Sile**. To jest cała zasada
Modelu D w jednym wierszu.

⭐ **ZNALEZISKO A domknięte:** `ratio` 1,00 vs 2,67 → dziś ×1,00 (mnożnik płaski
1,50), po zmianie **×2,07**.

**Wrażliwość `effortK`** (koszt jednego uniku, pula 120):

| effortK | @ratio 1,0 | @1,68 | @2,67 | ocena |
|---|---|---|---|---|
| 0,6 | 19,1 | 25,2 | 34,1 | słabiej niż dziś w środku pasma |
| **0,9** | **21,1** | **30,3** | **43,6** | ✅ ciągłość z dzisiejszym maks. 22,5 |
| 1,2 | 23,1 | 35,3 | 53,2 | ⛔ unik = 44% puli |
| 1,5 | 25,1 | 40,4 | 62,7 | ⛔ unik = połowa puli |

---

## 7. ⚠ INWERSJA, którą przy okazji znaleziono

`Progression.ts:444` — `dodgeChance` mnoży przez `lightLoadBonus ×1,3` każdego
w klasie „Lekkie". **Przy Sile 50 postać w 75,5 kg pełnej płyty dostaje premię
„za lekkość".** To jest trzeci, niezamierzony konsument obciążenia i musi zostać
naprawiony razem z wdrożeniem (`OI-104`): warunek ma wisieć na **kg**, nie na
`loadMultiplier`.

---

## 8. SYNTEZA — profil roli przy Sile 20

*(realny sufit dzisiejszej gry: 49 pkt na cztery atrybuty, `skillPointsPerLevel: 1`)*

| rola | chód | sprint | ratio | unik | regen | walka→wycz. | sprint [s] | eHP |
|---|---|---|---|---|---|---|---|---|
| strzelec 12 kg | **148** | 237 | 0,17 | 15,0 | 2,94 | **27 s** | **17,0** | ×1,66 |
| lekki wojownik 25 kg | 136 | 218 | 0,36 | 15,0 | 2,61 | 25 s | 16,2 | ×2,10 |
| ciężki 35 kg | 129 | 206 | 0,50 | 15,0 | 2,40 | 23 s | 15,8 | ×2,42 |
| ciężki 40 kg | 125 | 200 | 0,57 | 15,3 | 2,31 | 23 s | 15,2 | ×2,60 |
| maks dziś 47,5 kg | 120 | 192 | 0,68 | 16,7 | 2,18 | 21 s | 13,4 | ×2,66 |
| ekstremum 62 kg | 111 | 178 | 0,89 | 19,5 | 1,97 | 18 s | 10,9 | ×4,00 |
| **ekstremum 75,5 kg** | **104** | 167 | 1,08 | 22,1 | 1,81 | **16 s** | **9,3** | ×4,00 |

**Siła 10, 75,5 kg:** chód 104 · unik 30,2 · sprint 6,5 s · walka→wyczerpany
13 s. Ciężko, ale grywalnie.
**Siła 70, 75,5 kg:** chód **nadal 104** · unik 16,1 · sprint 13,5 s ·
walka→wyczerpany 20 s.

---

## 9. TRENING — trzy rangi, efekt zmierzony

Budżet życiowy: **49 pkt**. Całe drzewo 11 umiejętności: **14 pkt**.
Mastery I–IV na jedną rodzinę broni: **6 pkt**.

| koszt | % budżetu życiowego | % ceny całego drzewa |
|---|---|---|
| 3 pkt | 6% | 21% |
| **6 pkt** (I+II+III) | **12%** | 43% |
| 15 pkt | 31% | **107%** ⛔ |

Efekt przy Sile 20 *(chód / regen / unik / walka→wyczerpany)*:

| ranga | 40 kg | 62 kg | 75,5 kg |
|---|---|---|---|
| bez treningu | 125 / 2,31 / 15,3 / 23 s | 111 / 1,97 / 19,5 / 18 s | 104 / 1,81 / 22,1 / 16 s |
| I (1 pkt) | 125 / **2,52** / 15,3 / 24 s | 111 / **2,28** / 19,5 / 19 s | 104 / **2,17** / 22,1 / 17 s |
| II (Σ3) | 125 / 2,52 / 15,2 / 24 s | 111 / 2,28 / **17,9** / **20 s** | 104 / 2,17 / **19,6** / **19 s** |
| III (Σ6) | **131** / 2,52 / 15,2 / 24 s | **121** / 2,28 / 17,9 / 20 s | **116** / 2,17 / 19,6 / 19 s |
| *strzelec 12 kg* | *148 / 2,94 / 15,0 / 27 s* | | |

⭐⭐ **Ranga III kupuje PRÓG, nie procent:**

- **62 kg: 111 → 121 px/s przekracza watahę (115).** Odzyskujesz odejście pieszo.
- **40 kg: 125 → 131 px/s NIE przekracza Szarego (132).** ⭐ Trening **nigdy**
  nie oddaje ucieczki przed Szarym — i to wyszło z liczb, nie z wyjątku.

⚠ **Pozycja na playtest, nie do przestrojenia teraz:** przy **75,5 kg ranga III
daje 115,8 px/s wobec watahy 115** — margines **0,8 px/s**. Na papierze
uciekasz, w praktyce idziesz wilkom po piętach.

---

## 10. `weapon2` / `offhand2` — koszt pełnej masy

Chód px/s (delta) po doliczeniu schowanego zestawu:

| baza | 0 kg | ×1,0 najcięższy (młot+tarcza, 12 kg) | ×0,5 (6 kg) | ×1,0 lekki (miecz+puklerz, 4 kg) |
|---|---|---|---|---|
| strzelec 12 kg | 148 | 137 (−10,8) | 142 (−5,6) | 144 (−3,8) |
| lekki wojownik 25 kg | 136 | 127 (−9,2) | 132 (−4,8) | 133 (−3,2) |
| ciężki 40 kg | 125 | 117 (−7,8) | 121 (−4,0) | 122 (−2,7) |
| maks dziś 47,5 kg | 120 | 113 (−7,2) | 116 (−3,7) | 117 (−2,5) |
| ekstremum 62 kg | 111 | 105 (−6,2) | 108 (−3,2) | 109 (−2,2) |

**Przypadki, w których schowany zestaw PRZENOSI build przez próg fauny:**

- 25 kg + topór i tarcza (8,5 kg): 136 → 130 — **traci Szarego**
- 25 kg + młot i tarcza (12 kg): 136 → 127 — **traci Szarego**
- 47,5 kg + topór i tarcza (8,5 kg): 120 → 115 — **traci watahę**

Rekomendacja i jej uzasadnienie: decyzja §7. ⛔ Nie implementować bez akceptacji.

---

## 11. KRYTERIA ODBIORU — komplet

Powtarza je `tools/obciazenie_przymiar.mjs`.

| kryterium | wynik |
|---|---|
| strzelec 12 kg praktycznie bez kary ruchu | ✅ 1,3% |
| strzelec ucieka wszystkiemu pieszo | ✅ 148 > 132 |
| przecięcie z Szarym w paśmie 30–40 kg | ✅ 30,5 kg |
| przecięcie z watahą w paśmie 55–65 kg | ✅ 55,7 kg |
| skoczek (96) nieosiągalny w katalogu | ✅ 94,4 > 75,5 kg |
| 30–40 kg używalne (ucieka watasze, unik ~15 @STR20) | ✅ 125–129 px/s |
| 60–75,5 kg używalne, nie martwe | ✅ walka→wycz. 16–18 s |
| przewaga ruchu strzelca nad ekstremum | ✅ ×1,42 |
| przewaga regeneracji strzelca nad ekstremum | ✅ ×1,62 |
| przewaga zasięgu sprintu strzelca | ✅ ×2,60 |
| oś wysiłku bez nasycenia (ZNALEZISKO A) | ✅ ×2,07 (dziś ×1,00) |
| **Siła 70 NIE kasuje kary ruchu 75,5 kg** | ✅ 104 px/s przy każdej Sile |
| Siła zdejmuje ≥90% osi wysiłku przy 75,5 kg | ✅ zostaje 7% |
| po 3 rangach 75,5 kg nadal wyraźnie gorsze od 12 kg | ✅ 116 vs 148 px/s · 2,17 vs 2,94 |
| trening oddaje watahę przy 62 kg, ale nie Szarego przy 40 kg | ✅ 121 > 115 · 131 < 132 |

---

## 12. Czego ten audyt NIE rozstrzyga

- ⛔ **Czy warstwowanie jest OP.** `eHP ×4,00` przy 62 kg pochodzi z PP, nie
  z masy; żadna rozsądna kara mobilności tego nie spłaca. Należy do `OI-98`
  i `tarcze_checkpoint.md` §1.10.
- ⛔ **Ekonomii złota rang treningu** — `OI-46`.
- ⚠ **Mnożenia kary z siecią** (0,696 × 0,55 = 57 px/s przy 75,5 kg).
- ⚠ **Marginesu 0,8 px/s** przy 75,5 kg + ranga III wobec watahy.
- ⛔ **Niczego o Sile 50–70 jako realnym zakresie** — przy `skillPointsPerLevel: 1`
  i `maxLevel: 50` **budżet życiowy to 49 pkt na cztery atrybuty**, więc Siła
  50+ jest dziś arytmetycznie nieosiągalna. Kolumny STR 30–70 są testem
  odporności modelu, nie prognozą postaci.

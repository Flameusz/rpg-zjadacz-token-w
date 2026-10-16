---
typ: GENEROWANE
domena: items
tytul: Ekwipunek — stan rosteru
stan: zywy
kotwice: [tools/katalog_ekwipunku.mjs]
generator: tools/katalog_ekwipunku.mjs
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-17
---

# Ekwipunek — stan rosteru

> ## ✅ ODŚWIEŻONY — baner o dziewięciu nieodświeżonych blokach USUNIĘTY (2026-09-17)
>
> ⛔ **Stał tu przez dwanaście dni baner „DZIEWIĘĆ BLOKÓW JEST NIEODŚWIEŻONYCH"
> wraz z instrukcją: *liczby broni czytaj z przymiaru, nie z tabel niżej*.**
> Obie rzeczy przestały być prawdą:
>
> - `OI-7` (niestabilny wynik przymiaru) **zamknięte 2026-09-07** — wynik się
>   nie odtworzył;
> - `D-4` (generator wypisywał „`parryBonus` 0,15, **nieczytany**") **zniknęło
>   razem z polem**: premia parowania zeszła 2026-09-16 z rodziny na
>   konstrukcję, a generator opisuje dziś znacznik, nie liczbę;
> - dokument jest przegenerowywany w każdej sesji, która rusza katalog, i
>   pilnuje tego `doc_check` §T.
>
> ⚠ **Nauka, dla której ten akapit zostaje:** baner „nie ufaj temu plikowi"
> przeżył powód, dla którego powstał. Ostrzeżenie o nieaktualności samo się
> zestarzało i przez dwanaście dni odsyłało czytelnika od poprawnych tabel.

> **Ten plik jest GENEROWANY.** Tabele między znacznikami `<!-- AUTO:… -->`
> wylicza `tools/katalog_ekwipunku.mjs` bezpośrednio z `GameConfig.ts` (przez
> esbuild, na prawdziwych wartościach — nie z parsowania tekstu). Proza wokół
> nich jest ręczna i generator jej nie dotyka.
>
> ```
> node tools/katalog_ekwipunku.mjs            # przymiar — tylko raport
> node tools/katalog_ekwipunku.mjs --zapisz   # odświeża tabele
> ```
>
> ⚠ **Nie edytuj liczb w tym pliku.** Zmieniaj `GameConfig.ts` i przepuść
> generator. Ręcznie wpisana liczba rozjedzie się z kodem i **nikt tego nie
> zauważy**, bo obie będą wyglądały wiarygodnie — projekt ma na to bliznę
> (stała pozycja Doroty w `CLAUDE.md`, współrzędne „chaty zachód"
> w `wioska_plan.md`).
>
> **Rozdział ról:** ten plik mówi **CO JEST**. Reguły — czym wolno być nowemu
> przedmiotowi, jak liczy się cios, czego nie robić — są w
> `docs/ekwipunek_mechanika.md` i to on jest plikiem do czytania jako pierwszy.

---

## 1. Broń

Jeden wiersz = jedna **para (broń, wariant)**, a nie jedna broń. To jest
właściwa jednostka: gracz nie wybiera broni, tylko sposób jej użycia, i to
wariant niesie typ obrażeń oraz kształt zamachu.

- **DPS** = średnia z zakresu × oczekiwana wartość krytyka ÷ cykl, przy
  Zręczności 0. Kolumny `@S0` / `@S4` to Siła 0 i 4 — te same dwa punkty, na
  których liczy `docs/systemy/shields.md`, żeby dało się porównać.
- **root** = `Progression.rootDurationMs`, czyli okno, w którym nie można się
  ruszyć. **root/cykl** mówi, jaką część czasu gracz stoi. ⚠ **Od 2026-08-20 to
  NIE jest `swingDurationMs + 40`**: root dzieli się na zobowiązanie (do klatki
  trafienia) i odzyskanie, a **Zręczność skraca tylko to drugie**. Kolumna niżej
  liczy przy Zręczności 0, więc pokazuje wartość MAKSYMALNĄ — postać zręczna
  stoi krócej. Powód i pomiar: `docs/atrybuty.md` §10.5.
- **ręce** czyta `hands` (brak = 1). ⚠ To własność **konkretnego przedmiotu**,
  nie rodziny broni: młot jednoręczny i młot dwuręczny mogą stać obok siebie.
  Dziś dwuręczna jest wyłącznie **włócznia**; siekiera i młot zostają
  jednoręczne, czyli **wolno je nosić z tarczą** — świadomie, patrz
  `docs/systemy/weapons.md` R-1.

<!-- AUTO:start:bronie -->
| broń | ręce | gat. | wariant | typ | obr. | DPS @S0 | DPS @S4 | cykl | root | root/cykl | zasięg | martwa | odrzut | przerywa | Siła | cena | trwałość |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gołe ręce | — | — | Cios | obuchowe | 3,0–5,0 | 9,0 | 9,7 | 500 ms | 220 ms | 44% | 52 | — | — | nie | — | — | — |
| Osiosany kij | — | — | Uderzenie | obuchowe | 6,0–9,0 | 16,8 | 18,8 | 500 ms | 210 ms | 42% | 74 | — | — | nie | — | 12 | 40 |
| Pałka | — | — | Uderzenie | obuchowe | 7,0–10,0 | 19,8 | 22,2 | 480 ms | 200 ms | 42% | 60 | — | — | nie | — | 25 | 60 |
| Sztylet | — | — | Pchnięcie | kłute | 7,0–11,0 | 25,0 | 26,5 | 450 ms | 180 ms | 40% | 56 | — | — | nie | — | 40 | 70 |
| Miecz | — | — | Cięcie | cięte | 9,0–14,0 | 25,8 | 30,9 | 500 ms | 220 ms | 44% | 68 | — | — | nie | 2 | 110 | 110 |
|  |  |  | Pchnięcie | kłute | 7,6–11,9 | 23,0 | 27,7 | 475 ms | 211 ms | 44% | 73 | — | — | nie | 2 | 110 | 110 |
| Krótki miecz | — | — | Cięcie | cięte | 8,0–12,0 | 23,8 | 27,2 | 470 ms | 200 ms | 43% | 62 | — | — | nie | 1 | 75 | 90 |
|  |  |  | Pchnięcie | kłute | 6,8–10,2 | 21,3 | 24,3 | 446 ms | 192 ms | 43% | 67 | — | — | nie | 1 | 75 | 90 |
| Toporek | — | — | Rąbnięcie | cięte | 8,0–13,0 | 25,3 | 29,9 | 480 ms | 205 ms | 43% | 62 | — | — | nie | — | 70 | 90 |
| Siekiera | — | — | Cięcie | cięte | 6,0–18,0 | 27,8 | 35,6 | 500 ms | 230 ms | 46% | 70 | — | — | nie | 4 | 180 | 120 |
|  |  |  | Obuch | obuchowe | 5,1–15,3 | 22,5 | 28,8 | 525 ms | 240 ms | 46% | 63 | — | — | nie | 4 | 180 | 120 |
| Młot | — | — | Uderzenie | obuchowe | 14,0–20,0 | 29,3 | 38,7 | 650 ms | 280 ms | 43% | 78 | — | 380 | **tak** | 6 | 280 | 140 |
| Włócznia | **1.5H** | — | Pchnięcie | kłute | 10,0–15,0 | 23,3 | 30,8 | 600 ms | 270 ms | 45% | 98 | — | — | nie | 3 | 150 | 100 |
| Topór bojowy | **2H** | — | Cięcie | cięte | 11,0–24,0 | 29,8 | 39,3 | 680 ms | 325 ms | 48% | 76 | — | — | nie | 5 | 320 | 130 |
|  |  |  | Obuch | obuchowe | 9,3–20,4 | 25,3 | 33,4 | 680 ms | 325 ms | 48% | 68 | — | — | nie | 5 | 320 | 130 |
| Młot bojowy 2H | **2H** | — | Uderzenie | obuchowe | 15,0–22,0 | 25,9 | 35,2 | 800 ms | 330 ms | 41% | 80 | — | 460 | **tak** | 6 | 360 | 150 |
|  |  |  | Dziób | kłute | 13,5–19,8 | 23,3 | 31,7 | 800 ms | 330 ms | 41% | 76 | — | 460 | nie | 6 | 360 | 150 |
| Kord | — | — | Cięcie | cięte | 8,0–14,0 | 26,2 | 30,4 | 470 ms | 205 ms | 44% | 60 | — | — | nie | 1 | 60 | 95 |
| Tasak | — | — | Rąbnięcie | cięte | 7,0–17,0 | 24,4 | 30,3 | 550 ms | 240 ms | 44% | 64 | — | — | nie | 3 | 120 | 110 |
| Szabla | — | — | Cięcie | cięte | 10,0–14,0 | 30,3 | 35,1 | 460 ms | 210 ms | 46% | 70 | — | — | nie | 2 | 165 | 100 |
| Rapier | — | — | Pchnięcie | kłute | 7,0–12,0 | 24,2 | 26,1 | 440 ms | 195 ms | 44% | 72 | — | — | nie | 1 | 210 | 85 |
| Bastard | **1.5H** | — | Cięcie | cięte | 12,0–19,0 | 28,9 | 37,0 | 600 ms | 265 ms | 44% | 78 | — | — | nie | 4 | 260 | 120 |
|  |  |  | Pchnięcie | kłute | 12,0–19,0 | 28,9 | 37,0 | 600 ms | 265 ms | 44% | 78 | — | — | nie | 4 | 260 | 120 |
| Miecz dwuręczny | **2H** | — | Cięcie | cięte | 14,0–23,0 | 25,9 | 34,7 | 800 ms | 315 ms | 39% | 82 | — | — | nie | 6 | 380 | 130 |
|  |  |  | Pchnięcie | kłute | 14,0–23,0 | 25,9 | 34,7 | 800 ms | 315 ms | 39% | 82 | — | — | nie | 6 | 380 | 130 |
| Pika | **2H** | — | Pchnięcie | kłute | 12,0–18,0 | 20,5 | 27,5 | 820 ms | 305 ms | 37% | 128 | **62** | — | nie | 4 | 200 | 90 |
| Halabarda | **2H** | — | Rąbnięcie | cięte | 13,0–22,0 | 24,5 | 32,8 | 800 ms | 310 ms | 39% | 110 | **34** | — | nie | 5 | 340 | 115 |
|  |  |  | Pchnięcie | kłute | 13,0–22,0 | 24,5 | 32,8 | 800 ms | 310 ms | 39% | 110 | **34** | — | nie | 5 | 340 | 115 |
| Glewia | **2H** | — | Zamach | cięte | 11,0–19,0 | 25,5 | 33,1 | 660 ms | 290 ms | 44% | 104 | **28** | — | nie | 4 | 290 | 105 |
| Kiścień | — | — | Zamach | obuchowe | 5,0–19,0 | 23,2 | 29,7 | 580 ms | 245 ms | 42% | 64 | — | 300 | nie | 3 | 190 | 95 |
| Miecz długi | — | — | Cięcie | cięte | 9,0–15,0 | 24,0 | 29,3 | 560 ms | 240 ms | 43% | 74 | — | — | nie | 4 | 195 | 120 |
| Wielki miecz | **2H** | — | Zamach | cięte | 20,0–34,0 | 31,8 | 43,3 | 950 ms | 380 ms | 40% | 92 | **30** | 260 | nie | 8 | 600 | 160 |
| Nóż | — | **żelazo** | Pchnięcie | kłute | 5,6–8,0 | 17,8 | 18,8 | 440 ms | 170 ms | 39% | 50 | — | — | nie | — | 12 | 45 |
| Mizerykordia | — | — | Pchnięcie | kłute | 8,0–12,0 | 28,9 | 30,1 | 460 ms | 190 ms | 41% | 52 | — | — | nie | — | 150 | 80 |
| Buzdygan | — | — | Uderzenie | obuchowe | 10,0–14,0 | 25,8 | 32,6 | 520 ms | 225 ms | 43% | 66 | — | — | nie | 3 | 140 | 120 |
| Nadziak | — | — | Zamach | kłute | 8,0–16,0 | 26,9 | 33,3 | 500 ms | 215 ms | 43% | 64 | — | — | nie | 4 | 230 | 110 |
| Cep bojowy | **2H** | **żelazo** | Zamach | obuchowe | 4,0–21,6 | 20,5 | 26,6 | 700 ms | 290 ms | 41% | 78 | — | 180 | nie | 3 | 45 | 70 |
| Topór brodaty | — | — | Rąbnięcie | cięte | 7,0–16,0 | 25,6 | 31,7 | 520 ms | 220 ms | 42% | 66 | — | — | nie | 2 | 115 | 105 |
| Berdysz | **2H** | — | Rąbnięcie | cięte | 12,0–21,0 | 27,3 | 36,0 | 700 ms | 290 ms | 41% | 84 | — | — | nie | 5 | 300 | 125 |
| Rohatyna | **2H** | — | Pchnięcie | kłute | 11,0–18,0 | 25,4 | 33,0 | 640 ms | 275 ms | 43% | 100 | — | 200 | nie | 4 | 190 | 105 |
| Maczuga | — | — | Uderzenie | obuchowe | 9,0–14,0 | 23,0 | 29,4 | 560 ms | 240 ms | 43% | 66 | — | 120 | nie | 3 | 45 | 75 |
| Młot bojowy 1H | — | — | Uderzenie | obuchowe | 9,0–15,0 | 25,8 | 32,0 | 520 ms | 225 ms | 43% | 68 | — | 240 | **tak** | 4 | 300 | 130 |
|  |  |  | Dziób | kłute | 8,1–13,5 | 23,3 | 28,8 | 520 ms | 225 ms | 43% | 65 | — | 240 | nie | 4 | 300 | 130 |
| Korbacz | — | — | Zamach | obuchowe | 6,0–16,0 | 24,6 | 31,0 | 500 ms | 215 ms | 43% | 62 | — | 200 | nie | 2 | 130 | 85 |
| Topór duński | **2H** | — | Rąbnięcie | cięte | 11,0–19,0 | 27,1 | 35,3 | 640 ms | 280 ms | 44% | 88 | — | — | nie | 4 | 280 | 110 |
| Labrys | **2H** | — | Rąbnięcie | cięte | 14,0–26,0 | 28,9 | 38,8 | 800 ms | 330 ms | 41% | 78 | — | — | nie | 6 | 400 | 135 |
| Widły | **1.5H** | **żelazo** | Pchnięcie | kłute | 7,2–12,8 | 18,1 | 23,1 | 620 ms | 265 ms | 43% | 102 | **20** | — | nie | 3 | 54 | 80 |
<!-- AUTO:end:bronie -->

### 1.1 Rodziny broni

**Rodzina = tożsamość archetypu.** Jedna oś mechaniki wspólna dla wszystkich
modeli rodziny, dziedziczona bez kopiowania czegokolwiek do przedmiotu.
Tabela osi: `WEAPON_FAMILY` w `GameConfig.ts`, składana w `Progression` —
i **tylko tam**, `GameScene`/`Player`/`Enemy` o rodzinach nie wiedzą.

```
RODZINA      = tożsamość archetypu
MODEL        = parametry/konstrukcja (damage, tempo, zasięg, root, hands, requires, warianty)
DAMAGE TYPE  = rodzaj obrażeń
HANDS        = własność konkretnego przedmiotu
QUALITY      = jakość wykonania
```

⚠ **Rodzina jest niezależna od typu obrażeń, od `hands` i od jakości.**
Najostrzejszy przykład stoi w tabeli wyżej: wariant **Obuch** siekiery zadaje
`obuchowe`, a siekiera należy do rodziny **topora** — więc **nie** dostaje
zachwiania. Inaczej wariant przyznawałby zdolność, czego zabrania reguła
zawężania.

<!-- AUTO:start:rodziny -->
| rodzina | oś | co realnie robi DZIŚ | przedmioty |
|---|---|---|---|
| **Miecz** (`sword`) | parry | **parowanie** — *znacznik bez wartości; liczba stoi w modelu broni* (`melee.parryBonus`) | Miecz, Krótki miecz, Kord, Tasak, Szabla, Rapier, Bastard, Miecz dwuręczny, Miecz długi, Wielki miecz |
| **Topór** (`axe`) | critical_strength | siła krytyka **+0,25** | Toporek, Siekiera, Topór bojowy, Topór brodaty, Berdysz, Topór duński, Labrys |
| **Obuchowe** (`blunt`) | stagger | zachwianie **50 ms** | Osiosany kij, Pałka, Młot, Młot bojowy 2H, Kiścień, Buzdygan, Nadziak, Cep bojowy, Maczuga, Młot bojowy 1H, Korbacz |
| **Sztylet** (`dagger`) | precision | siła krytyka **+0,20** | Sztylet, Nóż, Mizerykordia |
| **Drzewcowe** (`polearm`) | reach | **zasięg** — *znacznik bez wartości; liczba stoi w modelu broni* | Włócznia, Pika, Halabarda, Glewia, Rohatyna, Widły |

**Świadomie poza rodzinami:** *brak* — plus gołe ręce. Brak rodziny jest legalnym stanem, nie luką do zapełnienia.
<!-- AUTO:end:rodziny -->

### 1.2 Mnożniki wariantów

Wariant skaluje **własne liczby broni**, nigdy nie podaje wartości
bezwzględnych. Puste pole = ×1. Reguła zawężania: wariant może zdolność
**odebrać**, nigdy przyznać — stąd `interrupts` wyłącznie jako „wyłączone".

<!-- AUTO:start:warianty -->
| broń | wariant | `reachMul` | `damageMul` | `swingMul` | `thrustMul` | `sweepMul` | `knockbackMul` | `interrupts` |
|---|---|---|---|---|---|---|---|---|
| Osiosany kij | Uderzenie | — | — | — | — | — | — | — |
| Pałka | Uderzenie | — | — | — | — | — | — | — |
| Sztylet | Pchnięcie | — | — | — | — | — | — | — |
| Miecz | Cięcie | — | — | — | — | — | — | — |
| Miecz | Pchnięcie | ×1,08 | ×0,85 | ×0,95 | ×1,60 | ×0,45 | — | — |
| Krótki miecz | Cięcie | — | — | — | — | — | — | — |
| Krótki miecz | Pchnięcie | ×1,08 | ×0,85 | ×0,95 | ×1,60 | ×0,45 | — | — |
| Toporek | Rąbnięcie | — | — | — | — | — | — | — |
| Siekiera | Cięcie | — | — | — | — | — | — | — |
| Siekiera | Obuch | ×0,90 | ×0,85 | ×1,05 | ×1,30 | ×0,60 | — | — |
| Młot | Uderzenie | — | — | — | — | — | — | — |
| Włócznia | Pchnięcie | — | — | — | — | ×0,45 | — | — |
| Topór bojowy | Cięcie | — | — | — | — | — | — | — |
| Topór bojowy | Obuch | ×0,90 | ×0,85 | — | — | — | — | — |
| Młot bojowy 2H | Uderzenie | — | — | — | — | — | — | — |
| Młot bojowy 2H | Dziób | ×0,95 | ×0,90 | — | ×1,40 | ×0,45 | — | wyłączone |
| Kord | Cięcie | — | — | — | — | — | — | — |
| Tasak | Rąbnięcie | — | — | — | — | — | — | — |
| Szabla | Cięcie | — | — | — | — | — | — | — |
| Rapier | Pchnięcie | — | — | — | — | — | — | — |
| Bastard | Cięcie | — | — | — | — | — | — | — |
| Bastard | Pchnięcie | — | — | — | ×1,50 | ×0,40 | — | — |
| Miecz dwuręczny | Cięcie | — | — | — | — | — | — | — |
| Miecz dwuręczny | Pchnięcie | — | — | — | ×1,60 | ×0,35 | — | — |
| Pika | Pchnięcie | — | — | — | — | ×0,35 | — | — |
| Halabarda | Rąbnięcie | — | — | — | — | — | — | — |
| Halabarda | Pchnięcie | — | — | — | ×1,50 | ×0,35 | — | — |
| Glewia | Zamach | — | — | — | ×0,60 | ×1,35 | — | — |
| Kiścień | Zamach | — | — | — | — | — | — | — |
| Miecz długi | Cięcie | — | — | — | — | — | — | — |
| Wielki miecz | Zamach | — | — | — | — | — | — | — |
| Nóż | Pchnięcie | — | — | — | — | — | — | — |
| Mizerykordia | Pchnięcie | — | — | — | — | — | — | — |
| Buzdygan | Uderzenie | — | — | — | — | — | — | — |
| Nadziak | Zamach | — | — | — | — | — | — | — |
| Cep bojowy | Zamach | — | — | — | — | — | — | — |
| Topór brodaty | Rąbnięcie | — | — | — | — | — | — | — |
| Berdysz | Rąbnięcie | — | — | — | — | — | — | — |
| Rohatyna | Pchnięcie | — | — | — | — | — | — | — |
| Maczuga | Uderzenie | — | — | — | — | — | — | — |
| Młot bojowy 1H | Uderzenie | — | — | — | — | — | — | — |
| Młot bojowy 1H | Dziób | ×0,95 | ×0,90 | — | ×1,40 | ×0,45 | — | wyłączone |
| Korbacz | Zamach | — | — | — | — | — | — | — |
| Topór duński | Rąbnięcie | — | — | — | — | — | — | — |
| Labrys | Rąbnięcie | — | — | — | — | — | — | — |
| Widły | Pchnięcie | — | — | — | — | — | — | — |
<!-- AUTO:end:warianty -->

---

## 2. Pancerz

Punkty przechodzą przez `d / (d + 50)` z capem 75% (`EQUIPMENT.defenseK`,
`maxDefenseReduction`) — ta sama krzywa dla gracza i dla przeciwników.
Kolumna „sam" pokazuje, ile daje **jedna sztuka noszona samotnie**; przez
krzywą malejących przyrostów **suma kompletu jest większa niż suma jego części**,
więc tych liczb nie wolno dodawać.

<!-- AUTO:start:pancerz-sloty -->
**Głowa** (`head`) — 10 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **L1** | Czepiec | przeszywanica | — | 1 | 0.2 | 2,0% / 2,3% / 0,7% / 2,2% | — | 4 | — |
| **L1** | Czepiec pikowany | przeszywanica | — | 6 | 1 | 10,7% / 12,6% / 4,0% / 11,7% | — | 22 | — |
| **L2** | Skórzany kaptur | skóra | — | 5 | 1 | 9,1% / 9,1% / 4,3% / 7,4% | — | 15 | — |
| **L2** | Kaptur kolczy | kolczuga | stal | 8 | 2 | 13,8% / 22,4% / 10,1% / 5,3% | 1 | 35 | — |
| **L2** | Kaptur żelazny | kolczuga | żelazo | 6,4 | 2 | 11,3% / 18,7% / 8,2% / 4,3% | 1 | 21 | — |
| **L3** | Czepiec lamelkowy | metal | stal | 7 | 2 | 12,3% / 16,4% / 13,9% / 6,5% | 1 | 30 | — |
| **L3** | Stalowy hełm | metal | stal | 10 | 3 | 16,7% / 21,9% / 18,7% / 9,1% | 2 | 45 | — |
| **L3** | Żelazny hełm | metal | żelazo | 8 | 3 | 13,8% / 18,3% / 15,5% / 7,4% | 2 | 27 | — |
| **L3** | Hełm stożkowy | metal | stal | 9 | 2.5 | 15,3% / 20,1% / 17,1% / 8,3% | 1 | 38 | — |
| **L3** | Kapalin | metal | stal | 7 | 1.5 | 12,3% / 16,4% / 13,9% / 6,5% | 1 | 32 | — |

**Klata** (`chest`) — 15 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **L1** | Koszula | przeszywanica | — | 1 | 0.4 | 2,0% / 2,3% / 0,7% / 2,2% | — | 6 | — |
| **L1** | Przeszywanica | przeszywanica | — | 15 | 4 | 23,1% / 26,5% / 9,5% / 24,8% | — | 55 | — |
| **L1** | Kaftan pikowany | przeszywanica | — | 8 | 1.5 | 13,8% / 16,1% / 5,3% / 15,0% | — | 30 | — |
| **L2** | Skórzany kaftan | skóra | — | 10 | 3 | 16,7% / 16,7% / 8,3% / 13,8% | — | 30 | — |
| **L2** | Kolczuga | kolczuga | stal | 18 | 10 | 26,5% / 39,3% / 20,1% / 11,2% | 3 | 70 | — |
| **L2** | Kolczuga żelazna | kolczuga | żelazo | 14,4 | 10 | 22,4% / 34,1% / 16,8% / 9,2% | 3 | 42 | — |
| **L2** | Kolczuga krótka | kolczuga | stal | 12 | 6 | 19,4% / 30,2% / 14,4% / 7,7% | 2 | 50 | — |
| **L2** | Kaftan ćwiekowany | skóra | — | 14 | 5.5 | 21,9% / 21,9% / 11,2% / 18,3% | 1 | 62 | — |
| **L2** | Napierśnik skórzany | skóra | — | 13 | 6.5 | 20,6% / 20,6% / 10,5% / 17,2% | 1 | 39 | — |
| **L3** | Pancerz lamelkowy | metal | stal | 16 | 9 | 24,2% / 30,9% / 26,9% / 13,8% | 3 | 70 | — |
| **L3** | Pancerz łuskowy | metal | stal | 16 | 9 | 24,2% / 30,9% / 26,9% / 13,8% | 3 | 70 | — |
| **L3** | Stalowy napierśnik | metal | stal | 22 | 12 | 30,6% / 38,1% / 33,6% / 18,0% | 4 | 90 | — |
| **L3** | Żelazny napierśnik | metal | żelazo | 17,6 | 12 | 26,0% / 33,0% / 28,8% / 15,0% | 4 | 54 | — |
| **L3** | Brygantyna | metal | stal | 17 | 8 | 25,4% / 32,2% / 28,1% / 14,5% | 3 | 78 | — |
| **L3** | Kirys | metal | stal | 28 | 17 | 35,9% / 43,9% / 39,2% / 21,9% | 5 | 130 | — |

**Rękawice** (`gloves`) — 5 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **—** | Rękawice pikowane | przeszywanica | — | 4 | 0.5 | 7,4% / 8,8% / 2,7% / 8,1% | — | 18 | — |
| **—** | Stare owijki Patryczka | przeszywanica | — | 1 | 0.3 | 2,0% / 2,3% / 0,7% / 2,2% | — | — | — |
| **—** | Skórzane rękawice | skóra | — | 4 | 0.5 | 7,4% / 7,4% / 3,5% / 6,0% | — | 12 | — |
| **—** | Rękawice kolcze | kolczuga | stal | 5 | 1.5 | 9,1% / 15,3% / 6,5% / 3,4% | 1 | 22 | — |
| **—** | Stalowe rękawice | metal | stal | 6 | 2 | 10,7% / 14,4% / 12,1% / 5,7% | 2 | 30 | — |

**Ramiona** (`shoulders`) — 4 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **—** | Naramienniki skórzane | skóra | — | 4 | 1.2 | 7,4% / 7,4% / 3,5% / 6,0% | — | 18 | — |
| **—** | Naramienniki lamelkowe | metal | stal | 6 | 2.5 | 10,7% / 14,4% / 12,1% / 5,7% | 2 | 30 | — |
| **—** | Naramienniki łuskowe | metal | stal | 6 | 2.5 | 10,7% / 14,4% / 12,1% / 5,7% | 2 | 30 | — |
| **—** | Naramienniki płytowe | metal | stal | 8 | 3 | 13,8% / 18,3% / 15,5% / 7,4% | 2 | 44 | — |

**Nogi** (`legs`) — 12 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **L1** | Spodnie | przeszywanica | — | 1 | 0.5 | 2,0% / 2,3% / 0,7% / 2,2% | — | 6 | — |
| **L1** | Spodnie pikowane | przeszywanica | — | 8 | 2.5 | 13,8% / 16,1% / 5,3% / 15,0% | — | 30 | — |
| **L2** | Skórzane spodnie | skóra | — | 7 | 2 | 12,3% / 12,3% / 5,9% / 10,1% | — | 20 | — |
| **L2** | Spodnie kolcze | kolczuga | stal | 12 | 5 | 19,4% / 30,2% / 14,4% / 7,7% | 2 | 48 | — |
| **L2** | Żelazne spodnie kolcze | kolczuga | żelazo | 9,6 | 5 | 16,1% / 25,7% / 11,8% / 6,3% | 2 | 29 | — |
| **L2** | Spodenki kolcze | kolczuga | stal | 8 | 3 | 13,8% / 22,4% / 10,1% / 5,3% | 1 | 34 | — |
| **L3** | Spodnie lamelkowe | metal | stal | 11 | 5 | 18,0% / 23,5% / 20,2% / 9,9% | 2 | 45 | — |
| **L3** | Spodnie łuskowe | metal | stal | 11 | 5 | 18,0% / 23,5% / 20,2% / 9,9% | 2 | 45 | — |
| **L3** | Stalowe nagolenniki | metal | stal | 15 | 6 | 23,1% / 29,6% / 25,7% / 13,0% | 3 | 60 | — |
| **L3** | Żelazne nagolenniki | metal | żelazo | 12 | 6 | 19,4% / 25,1% / 21,6% / 10,7% | 3 | 36 | — |
| **L3** | Okute spodnie | metal | stal | 13 | 5 | 20,6% / 26,7% / 23,0% / 11,5% | 2 | 52 | — |
| **L3** | Pełne nagolenniki | metal | stal | 21 | 10 | 29,6% / 37,0% / 32,6% / 17,4% | 4 | 88 | — |

**Buty** (`boots`) — 9 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **L1** | Onuce | przeszywanica | — | 4 | 0.5 | 7,4% / 8,8% / 2,7% / 8,1% | — | 15 | — |
| **L2** | Łapcie | skóra | — | 1 | 0.3 | 2,0% / 2,0% / 0,9% / 1,6% | — | 4 | — |
| **L2** | Trzewiki | skóra | — | 2 | 0.8 | 3,8% / 3,8% / 1,8% / 3,1% | — | 9 | — |
| **L2** | Buty piechura | skóra | — | 6 | 1.6 | 10,7% / 10,7% / 5,1% / 8,8% | — | 24 | — |
| **L2** | Skórzane buty | skóra | — | 5 | 1.5 | 9,1% / 9,1% / 4,3% / 7,4% | — | 15 | — |
| **L2** | Buty kolcze | kolczuga | stal | 8 | 3 | 13,8% / 22,4% / 10,1% / 5,3% | 1 | 35 | — |
| **L3** | Stalowe buty | metal | stal | 10 | 3.5 | 16,7% / 21,9% / 18,7% / 9,1% | 2 | 45 | — |
| **L3** | Żelazne buty | metal | żelazo | 8 | 3.5 | 13,8% / 18,3% / 15,5% / 7,4% | 2 | 27 | — |
| **L3** | Półstalowe buty | metal | stal | 6 | 1.5 | 10,7% / 14,4% / 12,1% / 5,7% | 1 | 28 | — |

**Druga ręka** (`offhand`) — 30 szt.

| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |
|---|---|---|---|---|---|---|---|---|---|
| **—** | Puklerz | skóra | — | 4 | 1.5 | 7,4% / 7,4% / 3,5% / 6,0% | — | 50 | blok 30% / tempo ×1,08 |
| **—** | Ciężki drewniany puklerz | skóra | — | 5 | 2 | 9,1% / 9,1% / 4,3% / 7,4% | 1 | 50 | blok 33% / tempo ×1,11 |
| **—** | Drewniana tarcza okrągła | skóra | — | 7 | 4.5 | 12,3% / 12,3% / 5,9% / 10,1% | — | 90 | blok 45% / tempo ×1,18 |
| **—** | Ciężka drewniana tarcza okrągła | skóra | — | 8 | 6.1 | 13,8% / 13,8% / 6,7% / 11,3% | 1 | 90 | blok 50% / tempo ×1,24 |
| **—** | Drewniana tarcza rycerska | skóra | — | 9 | 5.5 | 15,3% / 15,3% / 7,5% / 12,6% | 3 | 120 | blok 55% / tempo ×1,26 |
| **—** | Ciężka drewniana tarcza rycerska | skóra | — | 11 | 7.4 | 18,0% / 18,0% / 9,0% / 15,0% | 4 | 120 | blok 61% / tempo ×1,35 |
| **—** | Drewniana tarcza migdałowa | skóra | — | 9 | 6.5 | 15,3% / 15,3% / 7,5% / 12,6% | 3 | 140 | blok 47% / tempo ×1,32 |
| **—** | Ciężka drewniana tarcza migdałowa | skóra | — | 11 | 8.8 | 18,0% / 18,0% / 9,0% / 15,0% | 4 | 140 | blok 52% / tempo ×1,43 |
| **—** | Lekka drewniana tarcza legionowa | skóra | — | 10 | 6.8 | 16,7% / 16,7% / 8,3% / 13,8% | 3 | 175 | blok 46% / tempo ×1,32 |
| **—** | Drewniana tarcza legionowa | skóra | — | 12 | 9 | 19,4% / 19,4% / 9,7% / 16,1% | 4 | 175 | blok 50% / tempo ×1,42 |
| **—** | Drewniana pawęż | skóra | — | 16 | 12 | 24,2% / 24,2% / 12,6% / 20,4% | 5 | 165 | blok 42% / tempo ×1,85 |
| **—** | Ciężka drewniana pawęż | skóra | — | 19 | 16.2 | 27,5% / 27,5% / 14,6% / 23,3% | 6 | 165 | blok 46% / tempo ×2,15 |
| **—** | Tarcza okuta | metal | stal | 8 | 5 | 13,8% / 18,3% / 15,5% / 7,4% | 3 | 220 | blok 45% / tempo ×1,20 |
| **—** | Żelazny puklerz | metal | żelazo | 4,8 | 2 | 8,8% / 11,8% / 9,9% / 4,6% | 1 | 78 | blok 33% / tempo ×1,10 |
| **—** | Ciężki żelazny puklerz | metal | żelazo | 5,6 | 2.7 | 10,1% / 13,6% / 11,4% / 5,3% | 2 | 78 | blok 36% / tempo ×1,14 |
| **—** | Stalowy puklerz | metal | stal | 6 | 2 | 10,7% / 14,4% / 12,1% / 5,7% | 1 | 130 | blok 33% / tempo ×1,10 |
| **—** | Ciężki stalowy puklerz | metal | stal | 7 | 2.7 | 12,3% / 16,4% / 13,9% / 6,5% | 2 | 130 | blok 36% / tempo ×1,14 |
| **—** | Żelazna tarcza okrągła | metal | żelazo | 6,4 | 5 | 11,3% / 15,2% / 12,8% / 6,0% | 3 | 132 | blok 45% / tempo ×1,20 |
| **—** | Ciężka żelazna tarcza okrągła | metal | żelazo | 8 | 6.8 | 13,8% / 18,3% / 15,5% / 7,4% | 4 | 132 | blok 50% / tempo ×1,27 |
| **—** | Ciężka stalowa tarcza okrągła | metal | stal | 10 | 6.8 | 16,7% / 21,9% / 18,7% / 9,1% | 4 | 220 | blok 50% / tempo ×1,27 |
| **—** | Żelazna tarcza rycerska | metal | żelazo | 8,8 | 6 | 15,0% / 19,8% / 16,8% / 8,1% | 3 | 180 | blok 58% / tempo ×1,28 |
| **—** | Ciężka żelazna tarcza rycerska | metal | żelazo | 10,4 | 8.1 | 17,2% / 22,6% / 19,3% / 9,4% | 4 | 180 | blok 64% / tempo ×1,38 |
| **—** | Stalowa tarcza rycerska | metal | stal | 11 | 6 | 18,0% / 23,5% / 20,2% / 9,9% | 3 | 300 | blok 58% / tempo ×1,28 |
| **—** | Ciężka stalowa tarcza rycerska | metal | stal | 13 | 8.1 | 20,6% / 26,7% / 23,0% / 11,5% | 4 | 300 | blok 64% / tempo ×1,38 |
| **—** | Żelazna tarcza migdałowa | metal | żelazo | 8,8 | 7 | 15,0% / 19,8% / 16,8% / 8,1% | 4 | 198 | blok 50% / tempo ×1,34 |
| **—** | Ciężka żelazna tarcza migdałowa | metal | żelazo | 10,4 | 9.5 | 17,2% / 22,6% / 19,3% / 9,4% | 5 | 198 | blok 55% / tempo ×1,46 |
| **—** | Lekka żelazna tarcza legionowa | metal | żelazo | 9,6 | 7.5 | 16,1% / 21,2% / 18,1% / 8,8% | 4 | 228 | blok 49% / tempo ×1,34 |
| **—** | Żelazna tarcza legionowa | metal | żelazo | 11,2 | 10 | 18,3% / 23,9% / 20,5% / 10,1% | 5 | 228 | blok 53% / tempo ×1,45 |
| **—** | Lekka stalowa tarcza legionowa | metal | stal | 12 | 7.5 | 19,4% / 25,1% / 21,6% / 10,7% | 4 | 380 | blok 49% / tempo ×1,34 |
| **—** | Stalowa tarcza legionowa | metal | stal | 14 | 10 | 21,9% / 28,2% / 24,4% / 12,3% | 5 | 380 | blok 53% / tempo ×1,45 |
<!-- AUTO:end:pancerz-sloty -->

### 2.0 Stos warstwowy

> **Co ta tabela pokazuje.** Cztery obszary z trzema warstwami (`L1` podkład →
> `L2` ochrona zasadnicza → `L3` wzmocnienie) i to, co dziś stoi na każdej.
> Pusta komórka jest informacją; dwie rodziny w jednej komórce bywają poprawne
> (skóra i kolczuga dzielą L2 celowo).
>
> ⚠ **`layer` jest dziś METADANĄ, nie mechaniką** — jeden slot trzyma jeden
> przedmiot. Tabela mówi, jak stos WYGLĄDA, nie jak się liczy.

<!-- AUTO:start:stos -->
| obszar | L1 · podkład | L2 · ochrona zasadnicza | L3 · wzmocnienie |
|---|---|---|---|
| **Głowa** | Czepiec · Czepiec pikowany | Skórzany kaptur · Kaptur kolczy · Kaptur żelazny | Czepiec lamelkowy · Stalowy hełm · Żelazny hełm · Hełm stożkowy · Kapalin |
| **Klata** | Koszula · Przeszywanica · Kaftan pikowany | Skórzany kaftan · Kolczuga · Kolczuga żelazna · Kolczuga krótka · Kaftan ćwiekowany · Napierśnik skórzany | Pancerz lamelkowy · Pancerz łuskowy · Stalowy napierśnik · Żelazny napierśnik · Brygantyna · Kirys |
| **Nogi** | Spodnie · Spodnie pikowane | Skórzane spodnie · Spodnie kolcze · Żelazne spodnie kolcze · Spodenki kolcze | Spodnie lamelkowe · Spodnie łuskowe · Stalowe nagolenniki · Żelazne nagolenniki · Okute spodnie · Pełne nagolenniki |
| **Buty** | Onuce | Łapcie · Trzewiki · Buty piechura · Skórzane buty · Buty kolcze | Stalowe buty · Żelazne buty · Półstalowe buty |

⚠ **Warstwa jest właściwością PRZEDMIOTU, nie sytuacji** — przeszywanica noszona sama jest dalej L1, z pustym L2 i L3. Taksonomia: `docs/decyzje/2026-09-12-taksonomia-pancerza.md`.
<!-- AUTO:end:stos -->

### 2.1 Komplety

<!-- AUTO:start:komplety -->
| komplet | pkt | bez typu | cięte | kłute | obuchowe | Siła | cena |
|---|---|---|---|---|---|---|---|
| brak | 0 | 0,0% | 0,0% | 0,0% | 0,0% | — | — |
| skóra (5 szt.) | 31 | 38,3% | 38,3% | 21,8% | 33,2% | — | 92 |
| przeszywanica (5 szt.) | 37 | 42,5% | 47,0% | 20,6% | 44,9% | — | 140 |
| kolczuga (5 szt.) | 51 | 50,5% | 64,7% | 41,7% | 26,3% | 3 | 210 |
| kolczuga + przeszywanica na klacie | 48 | 49,0% | 60,8% | 36,2% | 35,9% | 2 | 195 |
| stal (5 szt.) | 63 | 55,8% | 63,8% | 59,2% | 38,7% | 4 | 270 |
| stal + tarcza okuta | 71 | 58,7% | 66,5% | 62,0% | 41,5% | 4 | 490 |
<!-- AUTO:end:komplety -->

### 2.2 Zestawy przedmiotów (sety)

> **Czym to RÓŻNI SIĘ od „kompletów" wyżej.** Tamta tabela jest ANALIZĄ: liczy,
> ile ochrony daje noszenie pięciu sztuk jednego materiału, i jej wiersze są
> wypisane ręcznie, bo „komplet" jest tam pojęciem projektowym. Ta tabela jest
> MECHANIKĄ: zestaw to tag `set` na przedmiocie plus progi w `ITEM_SETS`, a
> premie naprawdę wchodzą do statystyk (`Equipment.sumBonus`, tym samym kanałem
> co pierścienie).
>
> ⚠ **Liczby premii są DO PLAYTESTU, nie zamrożone** — rząd wielkości wzięty
> z pierścieni, żeby komplet czytał się jak jeden dodatkowy pierścień, a nie
> jak druga postać. Otwarte jako kalibracja w `docs/zadania.md`.

<!-- AUTO:start:zestawy -->
| zestaw | członków | progi | premie | sloty |
|---|---|---|---|---|
| Trop Łowcy | 5 | 2 / 4 | premia nieustalona · premia nieustalona | Głowa, Klata, Rękawice, Nogi, Buty |
| Warstwy Lnu | 5 | 2 / 4 | premia nieustalona · premia nieustalona | Klata, Głowa, Nogi, Buty, Rękawice |
| Splot Pierścieni | 5 | 2 / 4 | premia nieustalona · premia nieustalona | Głowa, Klata, Rękawice, Nogi, Buty |
| Kuta Stal | 5 | 2 / 4 | premia nieustalona · premia nieustalona | Głowa, Klata, Nogi, Buty, Rękawice |

⚠ **Najwyższy próg nie sięga liczby członków** i to jest decyzja projektowa, nie brak: przy pięciu członkach i progach 2/4 zawsze zostaje wolne miejsce na sztukę z innego zestawu. Pełne uzasadnienie przy `ITEM_SETS` w `GameConfig.ts`.
<!-- AUTO:end:zestawy -->

⚠ Trzy rzeczy, które ta tabela pokazuje i które są **zaparkowane, nie
przeoczone** (`docs/odlozone.md`):
- ~~stal przeciw obuchowi jest bezwartościowa~~ — **naprawione 2026-08-17**:
  `metal.blunt` podniesione 0,40 → 0,50, czyli z **+1,2 pkt proc. ponad skórę
  na +6,1**. Sufit wyznacza przeszywanica (przeszywanica + skóra = 37,6% za
  85 g): stal ma zostać PONIŻEJ, inaczej kasuje przedmiot dodany po to, żeby
  obuch miał odpowiedź. Stroić w `ARMOR_PROFILE`, **nigdy** przez zmianę typu
  czyjegoś ataku;
- **cena pancerza rośnie z jakością tak samo jak broni**, mimo że przez krzywą
  ten sam nominalny procent daje mniejszy realny efekt;
- przeszywanica istnieje właśnie po to, żeby na obuchowe **istniała jakakolwiek
  poprawna odpowiedź** — nie po to, żeby naprawić stal.

### 2.2 Profile materiałów

Mnożnik na **punkty**, nie na wynik. `1,00` to zero definicyjne („pancerz liczy
się w całości"), poniżej — typ przechodzi, powyżej — grzęźnie.

<!-- AUTO:start:profile -->
| materiał | cięte | kłute | obuchowe | najlepsza odpowiedź |
|---|---|---|---|---|
| skóra (`leather`) | 1,00 | 0,45 | 0,80 | **kłute** |
| metal (`metal`) | 1,40 | 1,15 | 0,50 | **obuchowe** |
| przeszywanica (`padded`) | 1,20 | 0,35 | 1,10 | **kłute** |
| kolczuga (`mail`) | 1,80 | 0,70 | 0,35 | **obuchowe** |
<!-- AUTO:end:profile -->

⚠ **Trójkąt się nie domyka i to jest znany stan:** `pierce` jest najlepszą
odpowiedzią na dwa materiały z trzech, `blunt` na jeden, a `slash` na **żaden**.
Rekompensatą cięcia jest najwyższy surowy DPS w drabince. Domknięcie wymaga
materiału, który przegrywa z cięciem — czyli czwartego (zaparkowana chityna).

---

## 3. Jakość wykonania

Ten sam przedmiot w siedmiu wykonaniach. Poziomy powyżej `shopMaxLevel` istnieją
w modelu, ale świat ich nie rozdaje — rezerwa na nagrody zadaniowe.

<!-- AUTO:start:jakosc -->
| poziom | nazwa | obrażenia | obrona | tempo ataku | maks. trwałość | cena | wymóg Siły | w sklepie? |
|---|---|---|---|---|---|---|---|---|
| 1 | Podła | −15% | −15% | −8% | ×0,70 | ×0,55 | +1 | tak |
| 2 | Niska | −8% | −8% | −4% | ×0,85 | ×0,75 | +1 | tak |
| 3 | **Zwykła** | — | — | — | ×1,00 | ×1,00 | — | tak |
| 4 | Dobra | +5% | +5% | +3% | ×1,15 | ×1,35 | — | tak |
| 5 | Wysoka | +10% | +10% | +6% | ×1,35 | ×1,90 | — | **nie — rezerwa nagród** |
| 6 | Mistrzowska | +15% | +15% | +9% | ×1,60 | ×2,80 | -1 | **nie — rezerwa nagród** |
| 7 | Arcymistrzowska | +20% | +20% | +12% | ×2,00 | ×4,50 | -1 | **nie — rezerwa nagród** |
<!-- AUTO:end:jakosc -->

⚠ Jakość nie rusza `melee` (łuk, zasięg, odrzut, przerywanie) ani `attacks`.
**Wykonanie zmienia, jak dobrze rzecz jest zrobiona — nigdy czym ona jest.**
Mistrzowski młot to nadal młot.

---

## 4. Luki — czyli lista zakupów na nowe przedmioty

Ta sekcja jest jedynym powodem, dla którego generator liczy więcej, niż wypisuje
z danych. **Puste komórki są propozycjami zawartości**, nie błędami — ale każda
z nich jest miejscem, w którym nowy przedmiot na pewno czegoś nie powiela.

### 4.1 Pancerz: slot × materiał

<!-- AUTO:start:luki-pancerz -->
| slot | skóra | metal | przeszywanica | kolczuga |
|---|---|---|---|---|
| **Głowa** | Skórzany kaptur (5) | Czepiec lamelkowy (7)<br>Stalowy hełm (10)<br>Żelazny hełm (8)<br>Hełm stożkowy (9)<br>Kapalin (7) | Czepiec (1)<br>Czepiec pikowany (6) | Kaptur kolczy (8)<br>Kaptur żelazny (6,4) |
| **Klata** | Skórzany kaftan (10)<br>Kaftan ćwiekowany (14)<br>Napierśnik skórzany (13) | Pancerz lamelkowy (16)<br>Pancerz łuskowy (16)<br>Stalowy napierśnik (22)<br>Żelazny napierśnik (17,6)<br>Brygantyna (17)<br>Kirys (28) | Koszula (1)<br>Przeszywanica (15)<br>Kaftan pikowany (8) | Kolczuga (18)<br>Kolczuga żelazna (14,4)<br>Kolczuga krótka (12) |
| **Rękawice** | Skórzane rękawice (4) | Stalowe rękawice (6) | Rękawice pikowane (4)<br>Stare owijki Patryczka (1) | Rękawice kolcze (5) |
| **Ramiona** | Naramienniki skórzane (4) | Naramienniki lamelkowe (6)<br>Naramienniki łuskowe (6)<br>Naramienniki płytowe (8) | — **luka** | — **luka** |
| **Nogi** | Skórzane spodnie (7) | Spodnie lamelkowe (11)<br>Spodnie łuskowe (11)<br>Stalowe nagolenniki (15)<br>Żelazne nagolenniki (12)<br>Okute spodnie (13)<br>Pełne nagolenniki (21) | Spodnie (1)<br>Spodnie pikowane (8) | Spodnie kolcze (12)<br>Żelazne spodnie kolcze (9,6)<br>Spodenki kolcze (8) |
| **Buty** | Łapcie (1)<br>Trzewiki (2)<br>Buty piechura (6)<br>Skórzane buty (5) | Stalowe buty (10)<br>Żelazne buty (8)<br>Półstalowe buty (6) | Onuce (4) | Buty kolcze (8) |
| **Druga ręka** | Puklerz (4)<br>Ciężki drewniany puklerz (5)<br>Drewniana tarcza okrągła (7)<br>Ciężka drewniana tarcza okrągła (8)<br>Drewniana tarcza rycerska (9)<br>Ciężka drewniana tarcza rycerska (11)<br>Drewniana tarcza migdałowa (9)<br>Ciężka drewniana tarcza migdałowa (11)<br>Lekka drewniana tarcza legionowa (10)<br>Drewniana tarcza legionowa (12)<br>Drewniana pawęż (16)<br>Ciężka drewniana pawęż (19) | Tarcza okuta (8)<br>Żelazny puklerz (4,8)<br>Ciężki żelazny puklerz (5,6)<br>Stalowy puklerz (6)<br>Ciężki stalowy puklerz (7)<br>Żelazna tarcza okrągła (6,4)<br>Ciężka żelazna tarcza okrągła (8)<br>Ciężka stalowa tarcza okrągła (10)<br>Żelazna tarcza rycerska (8,8)<br>Ciężka żelazna tarcza rycerska (10,4)<br>Stalowa tarcza rycerska (11)<br>Ciężka stalowa tarcza rycerska (13)<br>Żelazna tarcza migdałowa (8,8)<br>Ciężka żelazna tarcza migdałowa (10,4)<br>Lekka żelazna tarcza legionowa (9,6)<br>Żelazna tarcza legionowa (11,2)<br>Lekka stalowa tarcza legionowa (12)<br>Stalowa tarcza legionowa (14) | — **luka** | — **luka** |
<!-- AUTO:end:luki-pancerz -->

⚠ Nie każdą lukę należy zapełnić. Reguła, którą trzeba znać, zanim się coś tu
wstawi: **skóra i przeszywanica nie mogą dostać wymagań Siły**, bo jedyną
ścieżką dla buildu bez Siły jest pełny komplet lekki, a respecu nie ma.

### 4.2 Broń: dystans × typ obrażeń

Kubełki dystansu są arbitralne (zasięg w px), ale granice biegną tam, gdzie
faktycznie leży roster.

<!-- AUTO:start:luki-bron -->
| dystans | cięte | kłute | obuchowe |
|---|---|---|---|
| zwarcie (<60) | — **luka** | Sztylet / Pchnięcie (56)<br>Nóż / Pchnięcie (50)<br>Mizerykordia / Pchnięcie (52) | — **luka** |
| średni (60–72) | Miecz / Cięcie (68)<br>Krótki miecz / Cięcie (62)<br>Toporek / Rąbnięcie (62)<br>Siekiera / Cięcie (70)<br>Kord / Cięcie (60)<br>Tasak / Rąbnięcie (64)<br>Szabla / Cięcie (70)<br>Topór brodaty / Rąbnięcie (66) | Krótki miecz / Pchnięcie (67)<br>Nadziak / Zamach (64)<br>Młot bojowy 1H / Dziób (65) | Pałka / Uderzenie (60)<br>Siekiera / Obuch (63)<br>Topór bojowy / Obuch (68)<br>Kiścień / Zamach (64)<br>Buzdygan / Uderzenie (66)<br>Maczuga / Uderzenie (66)<br>Młot bojowy 1H / Uderzenie (68)<br>Korbacz / Zamach (62) |
| daleki (≥72) | Topór bojowy / Cięcie (76)<br>Bastard / Cięcie (78)<br>Miecz dwuręczny / Cięcie (82)<br>Halabarda / Rąbnięcie (110)<br>Glewia / Zamach (104)<br>Miecz długi / Cięcie (74)<br>Wielki miecz / Zamach (92)<br>Berdysz / Rąbnięcie (84)<br>Topór duński / Rąbnięcie (88)<br>Labrys / Rąbnięcie (78) | Miecz / Pchnięcie (73)<br>Włócznia / Pchnięcie (98)<br>Młot bojowy 2H / Dziób (76)<br>Rapier / Pchnięcie (72)<br>Bastard / Pchnięcie (78)<br>Miecz dwuręczny / Pchnięcie (82)<br>Pika / Pchnięcie (128)<br>Halabarda / Pchnięcie (110)<br>Rohatyna / Pchnięcie (100)<br>Widły / Pchnięcie (102) | Osiosany kij / Uderzenie (74)<br>Młot / Uderzenie (78)<br>Młot bojowy 2H / Uderzenie (80)<br>Cep bojowy / Zamach (78) |
<!-- AUTO:end:luki-bron -->

⚠ **To jest tabela, która uzasadnia włócznię.** `pierce` jest najlepszą
odpowiedzią na dwa z trzech materiałów, a dostarcza go dziś wyłącznie broń,
która wymaga stania w przeciwniku. Argument w całości:
`docs/systemy/weapons.md`

---

## 5. Czego ta tabela NIE pokazuje

Świadomie, żeby nie sugerowała kompletności:

- **przeciwników** — `EnemyConfig.armor` i cztery kanały obrażeń wroga są w
  `docs/systemy/armor.md` Dziś opancerzony jest **jeden** stwór;
- **pierścieni** — niosą `bonus` (maxHp / krytyk / tempo / obrona), a nie punkty
  pancerza, więc nie mieszczą się w żadnej z tych tabel;
- **mikstur i jedzenia** — leczenie to osobna ścieżka (`heal`, `healOverTime`),
  nie modyfikacja postaci;
- **trwałości w praktyce** — tabela podaje maksimum; zużycie to rzut raz na
  zamach (`EQUIPMENT.durability.wearChance`), a broń zniszczona działa na
  `destroyedMultiplier` i **nigdy nie znika**.

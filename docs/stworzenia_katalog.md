---
typ: GENEROWANE
domena: creatures
tytul: Stworzenia — stan rosteru
stan: zywy
kotwice: [tools/katalog_stworzen.mjs]
generator: tools/katalog_stworzen.mjs
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Stworzenia — stan rosteru

> **Ten plik jest GENEROWANY** (`OI-47`, 2026-10-11). Tabele między znacznikami
> `<!-- AUTO:… -->` wylicza `tools/katalog_stworzen.mjs` z `GameConfig.ts`
> (esbuild, prawdziwe wartości); roster bierze z `ENEMY_SPECIES`
> w `src/entities/EnemyRegistry.ts`. Proza wokół jest ręczna.
>
> ```
> node tools/katalog_stworzen.mjs            # przymiar — tylko raport
> node tools/katalog_stworzen.mjs --zapisz   # odświeża tabele
> ```
>
> ⛔ **Nie poprawiaj liczby w tabeli ręką** — zmień `GameConfig.ts` i przepuść
> generator. Jak działają te liczby, mówi `docs/systemy/creatures.md`.

## Roster

`P` = biegłość stworzenia (strona wroga warstwy 2). „Obrażenia podstawowe" to
`touchDamageMin`–`Max` — także dla gatunków, które kontaktu nie zadają, bo ich
kęs liczy się z tych liczb (`src/entities/CLAUDE.md`, kanały obrażeń). „Ataki
z własnymi liczbami" to każdy pod-obiekt konfigu z `damageMin`/`damageMax`.
⚠ Łupu tu nie ma: tabela `LOOT` jest płaska, a przypisanie do gatunku żyje
w kodzie.

<!-- AUTO:start:roster -->
| gatunek | konfig | HP | pancerz | P | XP | patrol / pościg px/s | agro / zerwanie px | odrodzenie s | obrażenia podstawowe | ataki z własnymi liczbami |
|---|---|---:|---|---:|---:|---|---|---|---|---|
| rabbit | `RABBIT` | 30 | — | 20 | 25 | 30 / 70 | 140 / 260 | 8 ± 4 | 4–6 bez typu | — |
| boar | `BOAR` | 95 | leather 22 | 48 | 70 | 22 / 52 | 175 / 340 | 16 ± 6 | 8–12 blunt | charge 16–24 blunt |
| bear | `BEAR` | 130 | — | 60 | 100 | 24 / 60 | 190 / 360 | 20 ± 8 | 10–14 slash | — |
| fox | `FOX` | 36 | — | 25 | 30 | 28 / 100 | 150 / 300 | 25 ± 10 | 5–8 pierce | — |
| deer | `DEER` | 70 | — | 40 | 40 | 26 / 100 | 150 / 320 | 30 ± 10 | 8–12 pierce | — |
| wolf | `WOLF` | 55 | — | 68 | 45 | 42 / 115 | 165 / 320 | 12 ± 5 | 7–10 pierce | — |
| greywolf | `GREY_WOLF` | 190 | — | 82 | 260 | 38 / 132 | 210 / 420 | nie odradza się | 11–15 pierce | — |
| spider | `SPIDER` | 42 | — | 34 | 55 | 26 / 62 | 230 / 380 | 14 ± 6 | 3–5 bez typu | — |
| venomspider | `VENOM_SPIDER` | 46 | — | 54 | 40 | 34 / 96 | 150 / 300 | 15 ± 6 | 2–3 bez typu | bite 3–5 pierce |
| bandit_club | `BANDIT_CLUB` | 80 | leather 14 | 100 | 90 | 30 / 80 | 180 / 380 | 45 ± 15 | 10–16 blunt | — |
| bandit_axe | `BANDIT_AXE` | 95 | padded 16 | 120 | 110 | 30 / 95 | 190 / 380 | 45 ± 15 | 8–12 slash | — |
| bandit_chief | `BANDIT_CHIEF` | 260 | mail 30 | 160 | 350 | 30 / 90 | 210 / 380 | nie odradza się | 14–20 slash | — |
| training_dummy | `TRAINING_DUMMY` | 100 000 | — | 0 | 0 | 0 / 1 | 0 / 0 | nie odradza się | — | — |
<!-- AUTO:end:roster -->

## Siatka ról — biegłość wroga a sufity Mastery

Praktyka z walki uczy do sufitu rangi (`PROFICIENCY.masteryThresholds`).
Pasmo bez przeciwnika znaczy, że do tej rangi nie ma na kim ćwiczyć walką
(`OI-28`: trzy z czterech rang nieosiągalne przy dzisiejszym rosterze).

<!-- AUTO:start:siatka -->
| pasmo `P` wroga | sufit Mastery | gatunki | liczba |
|---|---|---|---:|
| 0–49 | M-I (50) | rabbit (20), boar (48), fox (25), deer (40), spider (34) | 5 |
| 50–99 | M-II (100) | bear (60), wolf (68), greywolf (82), venomspider (54) | 4 |
| 100–199 | M-III (200) | bandit_club (100), bandit_axe (120), bandit_chief (160) | 3 |
| 200–349 | M-IV (350) | **PUSTE** | 0 |
| 350–∞ | ponad M-IV | **PUSTE** | 0 |
<!-- AUTO:end:siatka -->

## Kanały obrażeń trafiających w gracza

Ile gatunków zadaje każdy typ (`OI-120`: kolczuga ma tożsamość na kanałach,
które mają po jednym dostawcy).

<!-- AUTO:start:kanaly -->
| typ obrażeń | gatunki, które go zadają | liczba |
|---|---|---:|
| pierce | fox, deer, wolf, greywolf, venomspider | 5 |
| bez typu | rabbit, spider, venomspider | 3 |
| slash | bear, bandit_axe, bandit_chief | 3 |
| blunt | boar, bandit_club | 2 |
<!-- AUTO:end:kanaly -->

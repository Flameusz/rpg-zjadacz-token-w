---
typ: GENEROWANE
domena: progression
tytul: Postęp i ekonomia — liczby
stan: zywy
kotwice: [tools/katalog_postepu.mjs]
generator: tools/katalog_postepu.mjs
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Postęp i ekonomia — liczby

> **Ten plik jest GENEROWANY** (`OI-45`, 2026-10-11) przez
> `tools/katalog_postepu.mjs` z `PROGRESSION`, rosteru (`ENEMY_SPECIES`),
> map `.tmj`, `QUESTS`, `SKILLS` i `PROFICIENCY.mastery`. Proza jest ręczna.
>
> ```
> node tools/katalog_postepu.mjs            # przymiar — tylko raport
> node tools/katalog_postepu.mjs --zapisz   # odświeża tabele
> ```
>
> ⛔ **To są liczby, nie decyzja.** Krzywa XP wobec zawartości jest otwartym
> pytaniem autora (`OI-43`, ⏸ czeka na rozbudowę rozgrywki) — ten plik daje
> dane do niego i niczego nie przesądza. Reguły → `docs/systemy/progression.md`.

## Krzywa poziomów

`xpToNext(L) = round(baseXp · growth^(L−1))`. Kolumna „≈ wróg" przelicza XP
łącznie na zabójstwa jednego gatunku — żeby było widać, ile to „walk".

<!-- AUTO:start:krzywa -->
| poziom | XP do następnego | XP łącznie do osiągnięcia | ≈ boar (70 XP) łącznie | odblokowuje |
|---:|---:|---:|---:|---|
| 1 | 40 | 0 | 0 | Szerokie cięcie |
| 2 | 45 | 40 | 1 | Ciężkie uderzenie |
| 3 | 51 | 85 | 1 | Wypad, Uderzenie tarczą, Unik |
| 4 | 58 | 136 | 2 | Szarża |
| 5 | 65 | 194 | 3 | Rozcięcie |
| 6 | 74 | 259 | 4 | Wir ostrzy |
| 7 | 83 | 333 | 5 |  |
| 8 | 94 | 416 | 6 |  |
| 9 | 106 | 510 | 7 |  |
| 10 | 120 | 616 | 9 | Okrzyk bojowy |
| 11 | 136 | 736 | 11 |  |
| 12 | 153 | 872 | 12 |  |
| 13 | 173 | 1025 | 15 |  |
| 14 | 196 | 1198 | 17 |  |
| 15 | 221 | 1394 | 20 |  |
| 16 | 250 | 1615 | 23 |  |
| 17 | 283 | 1865 | 27 |  |
| 18 | 319 | 2148 | 31 |  |
| 19 | 361 | 2467 | 35 |  |
| 20 | 408 | 2828 | 40 |  |
| 21 | 461 | 3236 | 46 |  |
| 22 | 521 | 3697 | 53 |  |
| 23 | 589 | 4218 | 60 |  |
| 24 | 665 | 4807 | 69 |  |
| 25 | 752 | 5472 | 78 |  |
| 26 | 849 | 6224 | 89 |  |
| 27 | 960 | 7073 | 101 |  |
| 28 | 1084 | 8033 | 115 |  |
| 29 | 1225 | 9117 | 130 |  |
| 30 | 1385 | 10 342 | 148 |  |
| 31 | 1565 | 11 727 | 168 |  |
| 32 | 1768 | 13 292 | 190 |  |
| 33 | 1998 | 15 060 | 215 |  |
| 34 | 2258 | 17 058 | 244 |  |
| 35 | 2551 | 19 316 | 276 |  |
| 36 | 2883 | 21 867 | 312 |  |
| 37 | 3257 | 24 750 | 354 |  |
| 38 | 3681 | 28 007 | 400 |  |
| 39 | 4159 | 31 688 | 453 |  |
| 40 | 4700 | 35 847 | 512 |  |
| 41 | 5311 | 40 547 | 579 |  |
| 42 | 6002 | 45 858 | 655 |  |
| 43 | 6782 | 51 860 | 741 |  |
| 44 | 7664 | 58 642 | 838 |  |
| 45 | 8660 | 66 306 | 947 |  |
| 46 | 9786 | 74 966 | 1071 |  |
| 47 | 11 058 | 84 752 | 1211 |  |
| 48 | 12 495 | 95 810 | 1369 |  |
| 49 | 14 120 | 108 305 | 1547 |  |
| 50 | — | 122 425 | 1749 |  |
<!-- AUTO:end:krzywa -->

## Pula XP z map

Ile XP daje jedno wyczyszczenie każdej mapy z rozstawionych przeciwników
(bez zadań i bez odrodzeń). ⚠ Liczy tylko obiekty nazwane id gatunku.

<!-- AUTO:start:pula -->
| mapa | gatunek | sztuk | XP | 
|---|---|---:|---:|
| las | rabbit | 10 | 250 |
| las | boar | 4 | 280 |
| las | spider | 5 | 275 |
| las | wolf | 4 | 180 |
| las | greywolf | 1 | 260 |
| las | venomspider | 4 | 160 |
| las | bear | 1 | 100 |
| las | deer | 5 | 200 |
| las | fox | 5 | 150 |
| las | bandit_club | 2 | 180 |
| las | bandit_axe | 2 | 220 |
| las | bandit_chief | 1 | 350 |
| **las — razem** | | | **2605** |
| wieś | training_dummy | 1 | 0 |
| **wieś — razem** | | | **0** |
| Gęstwina | spider | 2 | 110 |
| Gęstwina | venomspider | 3 | 120 |
| **Gęstwina — razem** | | | **230** |
| **wszystkie mapy** | | | **2835** |

Jedno wyczyszczenie wszystkich map (bez zadań, bez odrodzeń) = **poziom 20**.
<!-- AUTO:end:pula -->

## Nagrody zadań

<!-- AUTO:start:zadania -->
| zadanie | dawca | XP | złoto | przedmiot |
|---|---|---:|---:|---|
| Kij w garści | father | 15 | — | — |
| Prowiant na drogę | mother | 5 | — | — |
| Pierwszy odstrzał | hunter | 30 | 50 | stick |
| Skóra warta zachodu | hunter | 60 | 40 | — |
| Szary | hunter | 100 | — | grey_fang_necklace |
| Myśliwy z Zagajów | elder | 60 | 220 | — |
| Rachunek pasterza | gniewko | 70 | 80 | — |
| Wydeptane zagony | peasant | 55 | 45 | — |
| Droga na wschód | blacksmith | 90 | 60 | steel_helmet |
| Skóra na pasy | sobek | 70 | — | buckler |
| Sprawy Zagajów | elder | 40 | 25 | — |
| Zioła dla babki | patryczek | 40 | 20 | — |
| Zapasy zielarki | herbalist | 45 | 30 | — |
| Dziurawiec na zimę | herbalist | 80 | 60 | — |
| Rękawice od wnuka | patryczek | 90 | — | padded_gloves |
| Zrabowany wóz | ciechan | 150 | 150 | bearded_axe |
| Poszukaj Kirki | anna | 30 | — | cheese ×2 |
| **razem** | | **1030** | **780** | |
<!-- AUTO:end:zadania -->

## Ujścia złota i punktów rozwoju

<!-- AUTO:start:ujscia -->
| ujście | złoto | punkty rozwoju |
|---|---:|---:|
| nauka wszystkich umiejętności u trenerów (11 pozycji `SKILLS`) | 945 | 14 |
| ranga Mastery I (jedna rodzina broni) | 50 | 0 |
| ranga Mastery II (jedna rodzina broni) | 250 | 1 |
| ranga Mastery III (jedna rodzina broni) | 700 | 2 |
| ranga Mastery IV (jedna rodzina broni) | 1800 | 3 |
| wszystkie rangi jednej rodziny | 2800 | 6 |
| punkty rozwoju dostępne do poziomu 50 | — | 49 |
<!-- AUTO:end:ujscia -->

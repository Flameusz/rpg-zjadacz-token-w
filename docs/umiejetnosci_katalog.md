---
typ: GENEROWANE
domena: abilities
tytul: Umiejętności — stan rosteru
stan: zywy
kotwice: [tools/katalog_umiejetnosci.mjs]
generator: tools/katalog_umiejetnosci.mjs
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Umiejętności — stan rosteru

> **Ten plik jest GENEROWANY** (`OI-38`, 2026-10-11). Tabele między znacznikami
> `<!-- AUTO:… -->` wylicza `tools/katalog_umiejetnosci.mjs` z `ABILITIES`,
> `SKILLS` i `STAMINA` w `GameConfig.ts` (esbuild, prawdziwe wartości). Proza
> wokół jest ręczna.
>
> ```
> node tools/katalog_umiejetnosci.mjs            # przymiar — tylko raport
> node tools/katalog_umiejetnosci.mjs --zapisz   # odświeża tabele
> ```
>
> ⛔ **Nie poprawiaj liczby ręką** — zmień `GameConfig.ts` i przepuść generator.
> Jak działają kształty, celowanie i rozstrzygnięcie → `docs/systemy/abilities.md`.

## Parametry

„stamina / s cd" = koszt podzielony przez cooldown — jak drogo kosztuje
używanie umiejętności tak często, jak pozwala cooldown. Unik płaci
`STAMINA.costs.dodge` mnożone przez obciążenie, więc nie ma stałej liczby.
Role są wyprowadzone z pól danych (reguły w nagłówku generatora).

<!-- AUTO:start:parametry -->
| umiejętność | id | poziom | cooldown s | stamina | stamina / s cd | mnożnik obrażeń | role | podgląd | wymóg |
|---|---|---:|---:|---:|---:|---:|---|---|---|
| Szerokie cięcie | `cleave` | 1 | 5 | 10 | 2 | 0,9 | obszar | — | — |
| Ciężkie uderzenie | `heavyStrike` | 2 | 7 | 18 | 2,57 | 2 | pojedynczy cios | reachAndCone | — |
| Wypad | `lunge` | 3 | 14 | 10 | 0,71 | 1,3 | ruch | reach | — |
| Uderzenie tarczą | `shieldBash` | 3 | 10 | 12 | 1,2 | 0,5 | kontrola | pathOnly | tarcza |
| Unik | `dodge` | 3 | 6 | 15 × obc. | — | — | ruch | — | — |
| Szarża | `charge` | 4 | 14 | 12 | 0,86 | — | ruch | lane | — |
| Rozcięcie | `rend` | 5 | 8 | 12 | 1,5 | 1,1 | efekt | pathOnly | — |
| Wir ostrzy | `whirlwind` | 6 | 9 | 15 | 1,67 | 0,85 | obszar | — | — |
| Okrzyk bojowy | `warcry` | 10 | 24 | 12 | 0,5 | — | wzmocnienie | — | — |
<!-- AUTO:end:parametry -->

## Nauka u trenera

Każda umiejętność ma dwie bramki: poziom (`unlockLevel`) i naukę (`SKILLS`).

<!-- AUTO:start:nauka -->
| umiejętność | nauka (`SKILLS`) | trener | złoto | punkty |
|---|---|---|---:|---:|
| Szerokie cięcie | `wide_cut` | patryczek | 40 | 0 |
| Ciężkie uderzenie | `heavy_blow` | patryczek | 70 | 1 |
| Wypad | `lunge_step` | patryczek | 80 | 1 |
| Uderzenie tarczą | `shield_work` | patryczek | 90 | 1 |
| Unik | `footwork` | patryczek | 60 | 1 |
| Szarża | `charge_run` | patryczek | 90 | 1 |
| Rozcięcie | `deep_cut` | patryczek | 110 | 1 |
| Wir ostrzy | `blade_dance` | patryczek | 120 | 2 |
| Okrzyk bojowy | `battle_voice` | patryczek | 200 | 3 |
<!-- AUTO:end:nauka -->

## Poziomy odblokowania

<!-- AUTO:start:poziomy -->
| poziom | odblokowuje |
|---:|---|
| 1 | Szerokie cięcie |
| 2 | Ciężkie uderzenie |
| 3 | Wypad, Uderzenie tarczą, Unik |
| 4 | Szarża |
| 5 | Rozcięcie |
| 6 | Wir ostrzy |
| 7 | — |
| 8 | — |
| 9 | — |
| 10 | Okrzyk bojowy |
<!-- AUTO:end:poziomy -->

## Siatka ról

„LUKA" znaczy: żadna umiejętność nie pełni tej roli.

<!-- AUTO:start:role -->
| rola | umiejętności | liczba |
|---|---|---:|
| pojedynczy cios | Ciężkie uderzenie | 1 |
| obszar | Szerokie cięcie, Wir ostrzy | 2 |
| ruch | Wypad, Unik, Szarża | 3 |
| kontrola | Uderzenie tarczą | 1 |
| efekt | Rozcięcie | 1 |
| wzmocnienie | Okrzyk bojowy | 1 |
<!-- AUTO:end:role -->

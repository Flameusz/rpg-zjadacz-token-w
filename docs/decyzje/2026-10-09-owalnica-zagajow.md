---
typ: DECYZJA
domena: [world]
tytul: Zagaje jako owalnica — płoty zamiast palisady, podwórka, karczma, młynówka, błonia
stan: zamkniety
moc: ACTIVE
data: 2026-10-09
kotwice:
  - tools/houses3d.py
  - tools/props3d.py
  - src/world/WorldComposer.ts
otwarte: [OI-164]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-09
---

# Zagaje jako owalnica

## Decyzja

Wieś przebudowana od zera jako **owalnica 128×128 kafli** (2×2 kawałki 64).
Rozstrzygnięcia autora (2026-10-09), każde z wariantem zalecanym:

| pytanie | odpowiedź |
|---|---|
| rozmiar | **128×128** |
| karczma | **przy północnym wjeździe**, przy trakcie od strony miasta; chmielnik za nią |
| kuźnia | **poza zabudową**, przy południowym wjeździe (ogień z dala od strzech, blisko drogi i — kiedyś — węglarzy); chałupa kowala w owalnicy |
| palisada w lore | **przepisana na płoty** (temat Sołtysa: „palisada to robota dla grodu”) |

⭐ **Szczeble osady:** wieś → **płot**, gród → **palisada**, miasto → **mur**.
⛔ Nie stawiaj palisady we wsi — typy `palisada`/`brama` zostają
w `tools/houses3d.py` na pierwszy gród.

## Układ (współrzędne w kaflach mapy wsi)

- **Trakt** x 62–63, z północy (do miasta) na południe (do lasu); na
  y 41–91 rozwidla się w **owalną drogę** wokół **nawsia** (elipsa,
  środek 62,5/66, półosie 11–13 × 23–25). Na nawsiu: sadzawka (gęsi),
  studnia, ławka, koryto, lipa; staruszkowie przy studni.
- **Zagrody**: 4 po zachodniej stronie (Dobek, Zofia, **Marko — dom
  gracza**, Witek), 3 po wschodniej (Sobek — warsztat, **Sołtys**, Radzim
  Kowal). Każda: chałupa **szczytem do nawsia**, wrota w płocie obok niej,
  podwórko (udeptana ziemia), obora/warsztat od południa, **stodoła od
  zewnątrz** — rząd stodół domyka wieś od pól. Fronty chałup idą po owalu.
- **Karczma** x 66–77 / y 29–37 z wiechą, **chmielnik** 7×5 tyczek za nią.
- **Kuźnia**: wiata + otwarte palenisko (kafle wyposażenia ze starej mapy)
  przy trakcie, y 92–104.
- **Młyn** nad **młynówką**: potok z północy → staw młyński (jaz) → pod
  kołem na wschód → na południe przez błonia **i dalej przez las do rzeki**
  (`forrest.tmj`, koryto x 15–17, y 0–26). Chałupa młynarza przy stawie.
- **Pola** na północy w zagonach (ozimina na zachód od traktu, jarzyna
  i len na wschód), **ugór z owczarnią** Gniewka na północnym wschodzie.
- **Błonia** y 96–116 (bydło, plac ćwiczeń Patryczka), skraj lasu od y 116;
  **zielarka** na wschodnim skraju błoni z ulami. Dziurawiec rośnie tylko
  na zewnętrznych błoniach.

## Dlaczego

- Owalnica to historyczny kształt słowiańskiej wsi i daje **czytelne
  centrum** (nawsie) oraz **podwórko** każdemu gospodarstwu — o to autor
  pytał przy rozstawie zachodu.
- Pola przy lesie zastąpiły **błonia**: wypas zjada podrost i liście,
  wyrąb przechodzi w łąkę, a dopiero potem w pole.
- Kuźnia przy trakcie i karczma przy wjeździe od miasta stawiają rzeczy
  „dla przejezdnych” tam, gdzie się przejeżdża.

## Jak zbudowano (i czego to wymagało)

- Mapę zrobił **jednorazowy skrypt** (nie zostaje w `tools/`, reguła
  zmiany jednorazowej): stemple drzew i kafle kuźni wzięte ze starej mapy,
  ścieżki i woda blobem 47, budynki i płoty jako obiekty `budynki`.
  Od teraz **`.tmj` jest mapą** — edycja w Tiled.
- `terrain_forest_transitions.png` dostał **pełne komplety blob wody
  i ścieżki** (wcześniej tylko kafle używane przez las) — reguła arkusza bez
  zmian; solid wody dopisany w `forrest.tmj`.
- Nowe typy w `tools/houses3d.py`: `plot` (plecionka), `zerdzie`, `wrota`
  (bez kolizji), `karczma` (z wiechą). Nowy model `chmiel` w
  `tools/props3d.py` + dekoracja `chmiel`.
- `swiat.world`: wieś na x 0 (trakt 62–63 trafia w drogę lasu 60–63),
  las na y 4096. Portal lasu do wsi (tryb awaryjny bez świata) ląduje na
  trakcie przy skraju (2016, 3984).

## Konsekwencje

- Obiektom wsi zmieniły się id → modele `dom-zagaje-*` przebudowane.
- Zapis z pozycją we wsi sprzed zmiany ląduje w innym miejscu (inny układ);
  postęp nie przepada.
- `docs/wioska_plan.md` §4 (rozkład, strefy) opisuje **poprzedni** układ —
  obsada (§6), ekonomia (§3) i zasada częstotliwości zostają w mocy.

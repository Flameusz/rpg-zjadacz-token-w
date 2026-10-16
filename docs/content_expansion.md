---
typ: OPERACYJNE
domena: proces
tytul: Rozbudowa zawartości przed krzywą XP — wątek i wieczorny odbiór
stan: zywy
otwarte: [OI-175, OI-174, OI-171, OI-172]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-12
---

# Rozbudowa zawartości przed krzywą XP

> **Po co ten wątek (autor 2026-10-12).** Krzywa XP i rangi Mastery czekają
> **co najmniej do ~2026-10-26**, aż świat i przeciwnicy urosną. Do tego czasu
> agent prowadzi rozwój sam, w dzień, bez playtestu autora i bez Blendera
> (komputer firmowy). Wieczorem autor odbiera zmiany i robi rzeczy twórcze.
> Kierunek przyjęty wstępnie: **Gęstwina — pierwsza fala kolonii**,
> **rozbudowa bandytów** (warianty zwierząt odłożone tego samego dnia).
>
> ⛔ W tym wątku **nie stroi się** krzywej XP, rang Mastery ani ujść złota
> (`OI-43`, `OI-28`, `OI-46`). Mierzy się tylko, co dokłada każda nowa rzecz.

## 1. Punkt wyjścia (zmierzony 2026-10-12)

Z `node tools/katalog_postepu.mjs` i `katalog_stworzen.mjs`:

| miara | dziś |
|---|---|
| jedno wyczyszczenie wszystkich map | 2835 XP → **poziom 20** (las 2605, Gęstwina 230) |
| zadania razem | 1000 XP / 780 zł, 16 zadań |
| pasma `P` wroga pod Mastery | 0–49: 5 gat. · 50–99: 4 · 100–199: 3 (bandyci) · **200–349: PUSTE** · 350+: PUSTE |

Każdy krok niżej kończy się ponownym przebiegiem obu katalogów (`--zapisz`)
— za dwa tygodnie strojenie zaczyna od gotowych liczb, nie od pomiaru.

## 2. Tory i kolejność

| # | tor | bez Blendera? | stan |
|---|---|---|---|
| 1 | **Spójność postaci** (`OI-175`) | tak | ✅ przegląd — `docs/character_consistency.md`; karty B1–B7 czekają |
| 2 | **Kirka** (`OI-174`) — zadanie z pieczonym mięsem | tak | ✅ w grze, sprawdzone w silniku; nowy cel `reach` |
| 3 | ~~Warianty zwierząt~~ | — | ⏸ **odłożone przez autora 2026-10-12** — lepiej zajmować się tym, co da się zrobić i ocenić teraz |
| 4 | **Gęstwina — 1. fala** — przedpole kolonii: pajęczyny-granica, więcej sieciarzy i skoczków, cisza; rozstaw drzew jak w lesie (`OI-165`) | częściowo (rekwizyt pajęczyny → kolejka) | ⏳ |
| 5 | **Bandyci — rozbudowa** — patrole przy trakcie, nowy typ zbója (np. włócznia = kłute, `OI-120`) | klasa i liczby tak, model → kolejka | ⏳ |
| 7 | **Króliki przy polach** — spawny przy polach i krawędzi wsi, problem widoczny na polu (autor 10-15) | tak | 📋 zaplanowane — `docs/pomysly.md` |
| 8 | **Samouczek walki u Patryczka** — manekin, podświetlony cel, kroki w rozmowie (autor 10-15) | tak | ✅ 10-15 „Pierwsza lekcja” — teksty do odbioru, krok 6 do decyzji (`docs/pomysly.md`) |
| 9 | **Onboarding sterowania** — ruch z lewej części ekranu, wyjście z podwórka, podświetlony Ojciec, ikona nad głową = zadanie (autor 10-15) | tak | ⏭ najbliższa sesja — `docs/pomysly.md` „Na najbliższą sesję” A |
| 10 | **Pokrzywy dla babci kończone u Patryczka** + zaczepka turnieju (autor 10-15) | tak | ⏭ najbliższa sesja — B |
| 11 | **Druga lekcja walki** — zmiana celu, pierwsza umiejętność (autor 10-15) | tak | ⏭ najbliższa sesja — C (najpierw decyzja o zmianie celu) |
| 6 | Dopracowanie — `OI-66` ✅ (porozmawiaj = temat, autor 10-12); `OI-61` ✅ zamknięte (zioła = towar); ikony skór ⏸ odłożone (autor: drobnica) | tak | ✅ |

⚠ Leże kolonii **nie** powstaje w tym wątku — stoi za Gęstwiną (matecznik /
puszcza, autor 2026-10-12, `docs/spider_colony.md` §3).

## 3. Do odbioru (wieczorem, ~10 min)

Najnowsze na górze. Każdy punkt: co, gdzie w grze, jak tam dojść, czego szukać.
Po odbiorze autor skreśla albo pisze uwagę — agent przenosi ją do właściwego
dokumentu.

### 2026-10-12

000. **„Porozmawiaj” = rozmowa w temacie** (`OI-66`). Weź u Patryczka
   „Zioła dla babki” → idź do Zielarki → „Rozmowa” ma „!” i „temat do
   zadania”; pytania ze złotym „!” prowadzą do „Czego mam wypatrywać?”, które
   zalicza cel (samo otwarcie okna już nie). Pozostałe cele: Patryczek „Co masz
   z tą ręką?”, Gniewko „Wszystkie te owce są twoje?”, Młynarz „A jak zboża
   zabraknie?”, Sobek „Co się najczęściej psuje we wsi?” — oceń, czy tematy
   pasują do zadań.
00. **Czarna pustka przy wschodnim skraju wsi — naprawiona.** Idź do
   NE rogu wsi (`dev`: teleport gracza w okolice 3800, 300) i wzdłuż
   wschodniej granicy w dół, do lasu. Kadr ma się zatrzymywać przy skraju
   wsi, bez czarnego pasa; przy przejściu przez narożnik wieś↔las kamera
   ma przesuwać się płynnie, bez przeskoku.
0. **Kirka — zadanie „Poszukaj Kirki” u Anny** (`OI-174`). Rozmowa z Anną →
   Zadania. Pieczone mięso: Bogusz albo ognisko (`dev.Inventory.addItem("cooked_meat", 1)`).
   Idź na łąkę nad młynówką w **NW rogu wsi** (kafel 14,12 — na minimapie lewy
   górny róg, za polami). Kirka wbiega z góry kadru, je przy lewej nodze,
   ucieka; potem oddaj u Anny. Do oceny: **teksty** (Anna nie prosi o pomoc —
   „Jak już koniecznie chcesz się na coś przydać…”, `docs/swiat.md` „Anna”),
   **miejsce** (prawy górny róg z Twojego opisu pokazywał czarną pustkę świata
   po prawej — zgłoszone osobno), **nagroda** 30 XP + 2 sery. Przed
   zadaniem Kirki nie ma na mapie — Anna już w powitaniu jej szuka.
1. **Przeczytaj karty B1–B7** w `docs/character_consistency.md` — każda to
   jedno zdanie decyzji z gotowym tekstem zalecanym.
2. ✅ **Patryczek, temat o Zofii** — „jej teść, co ledwie widzi” zamiast „teść
   w łóżku” (Sulisław siedzi przy studni). Jedno zdanie, bez nowych tematów.
3. **Leże kolonii za Gęstwiną** — zapisane w `spider_colony.md`, `swiat.md`,
   `region_geography_proposal.md` i `current.md`. Sprawdź, czy dobrze
   oddałem „matecznik albo puszcza”.

## 4. Kolejka Blendera (na wieczór)

Pusta. Wpis = co, którym generatorem, jaka komenda, czego oczekuje kod
(ścieżka `.glb`, klipy, skala), jak to sprawdzić renderem.

## 5. Karty decyzji — indeks

| karta | gdzie | waga |
|---|---|---|
| B1–B7 — spójność postaci | `docs/character_consistency.md` §B | B2 (czyje pole, kto mówi „myśliwy”) najważniejsza |

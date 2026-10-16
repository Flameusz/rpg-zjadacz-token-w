---
typ: HISTORIA
domena: ui
tytul: Handoff — przebudowa ekranu umiejętności
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-26
---

# HANDOFF — przebudowa ekranu UMIEJĘTNOŚCI

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/ui.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status: ✅ ZATWIERDZONA SPECYFIKACJA IMPLEMENTACJI (2026-08-26).**
> Decyzje D-1…D-12 są rozstrzygnięte przez autora i **nie podlegają ponownej
> dyskusji przy implementacji**. Dokument jest samodzielny — nie zakłada
> dostępu do rozmowy, w której powstał.
>
> Zakres: **wyłącznie prezentacja i UX**. Zero zmian w mechanice umiejętności,
> zero nowych systemów, zero talentów/klas/buildów.

---

## 1. Zaakceptowane decyzje projektowe

| # | decyzja |
|---|---|
| **D-1** | **Ten ekran zarządza POSIADANYMI umiejętnościami.** Nie jest katalogiem gry. Źródło listy: `Abilities.unlocked()`. |
| **D-2** | **Nienauczone umiejętności znikają z listy.** Zdobywanie to osobny system — katalog żyje w `TrainerPanel` (nazwa, opis, koszt, `Poznane ✓`), a awans ogłasza otwarte poziomy przez `EVENT.abilitiesUnlocked`. Ekran nie dubluje żadnego z nich. |
| **D-3** | **Stan pusty zastępuje listę katalogową jako drogowskaz** — nowa postać ma 0 posiadanych umiejętności, więc pusta lista jest normalnym stanem gry, nie błędem. |
| **D-4** | **4 sloty paska zostają.** Zero zmian w mechanice, zero talentów/klas/specjalizacji. |
| **D-5** | **Jedyna droga przypisania prowadzi przez kartę.** Tap = zaznaczenie + karta. Przypisanie = świadomy wybór slotu z karty. ⚠ **Long press jako skrót przypisania jest USUNIĘTY świadomie** — przypadkowa zmiana wyposażenia jest kosztem rosnącym wraz z liczbą umiejętności i przyszłymi buildami. Nie przywracaj „dla wygody". |
| **D-6** | **Karta pokazuje wyłącznie pola, które istnieją.** Żadnych zer, żadnych wypełniaczy, żadnego „lepsza/gorsza", żadnego porównywania między umiejętnościami. |
| **D-7** | **Zero nowych pól w danych.** `role`/`useWhen` odrzucone na tym etapie — najpierw sprawdzamy, czy `description` wystarcza po poprawie UI. |
| **D-8** | **Wzorzec: plecak.** Kontener + `GeometryMask` + pasek przewijania + synchronizacja wejścia + karta w stałym miejscu + `CardActions` pod kartą. |
| **D-9** | **Priorytet:** stabilny layout → skalowanie → nic poza panelem → poprawna klikalność → dopiero kosmetyka. |
| **D-10** | **Jedna lista**, bez nagłówków sekcji. Przynależność do paska niesie znacznik `slot N` w wierszu — skaluje się do dziesiątek wpisów, nagłówek nie. |
| **D-11** | **Renderer karty:** `AbilityCard` produkuje `Line[]`, rysowanie zostaje jedno — `ItemTooltip` dostaje jedną publiczną metodę przyjmującą gotowe linie. Bez duplikatu układu, bez refaktoru. |
| **D-12** | **Zdanie stanu pustego:** „Nie znasz jeszcze żadnej umiejętności. Naucz się ich u trenera." ⚠ Tekst czytany przez gracza → sprawdź `docs/swiat.md` i użyj jej brzmienia, jeśli się różni. |

---

## 2. Zakres implementacji

### Co jest zepsute (zmierzone, nie oszacowane)

| usterka | przyczyna | dowód |
|---|---|---|
| **A** — dwa ostatnie wiersze poza panelem | lista bez kontenera i maski; `top = slotY + 86`, `rowH = 50`, 8 wpisów → ostatni na page-local **+299** przy dnie **+245** (54 px poza) | `PlayerPanel.buildSkillsSubPage` |
| **B** — podpisy slotów zlepione (`1 — Szerokie cięcie— Unik`) | tekst **zmiennej długości** centrowany na **stałym rastrze 72 j.** (`cell 58 + gap 14`) | j.w. |
| **C** — „Wróć do gry" leży na wierszu listy | brak zarezerwowanego pasa dolnego | `PanelBase.addCloseButton` |
| **D** — wiersze poza panelem **są klikalne** | maska przycina rysowanie, nie wejście | `src/ui/CLAUDE.md` |

### Docelowa geometria (page-local, `characterPage.y = +20`)

```
panel 816×530 · tabBarH 40 · characterPageH 490 · minTouch 68

-191   tytuł „PASEK — 4 SLOTY"
-166..-108   rząd 4 slotów (cell 58, gap 14) — wymiarowany z ABILITY_SLOTS
 -98   podpis slotu = SAM NUMER (nazwa idzie do karty)
 -81   linia rozdzielająca
 -70   ┐
       │  OKNO LISTY — 240 j., maskowane, przewijane
+170   ┘
+177..+245   pas zarezerwowany pod „Wróć do gry" (pole 120×68, prawy dolny róg)

kolumny: lista 480 + colGap 16 + karta 250 (cardColW) = 746 z dostępnych 776
```

### Nowe pola w `PlayerPanel` (nazewnictwo bliźniacze do plecaka)

```
skillList          Container   — wiersze;      wzorzec: bagGridList
skillMaskG         Graphics    — GeometryMask; wzorzec: gridMaskG
skillScrollTrack / skillScrollThumb           — wzorzec: gridScrollTrack/Thumb
skillScroll        number      — setSkillScroll() JEDYNYM miejscem piszącym skillList.y
syncSkillRowIO()               — wyłącza wejście wierszom poza oknem
selectedAbility    AbilityId | null
```

⚠ **Skutek D-5 dla gestów:** w tej liście zostają **dwa** gesty — tap
i ciągnięcie. Trzystanowa maszyna z plecaka (`LONG_PRESS_MS` / `HOLD_SLOP`)
**nie jest tu potrzebna**; wystarczy `TAP_SLOP` i flaga `dragged`. Nie buduj
przytrzymania „na zapas".

### Kolejność prac

| # | krok | zamyka |
|---|---|---|
| **1** | kontener + maska + scroll + `syncSkillRowIO()`; lista nadal z `all()` | **A, D** |
| **2** | podpis slotu → sam numer; rząd z `ABILITY_SLOTS` + ostrzeżenie w konsoli przy wyjściu poza panel | **B** |
| **3** | źródło listy `all()` → **`unlocked()`** + pula wierszy + stan pusty | D-1, D-2, D-3 |
| **4** | dwie kolumny; tap = zaznaczenie; karta szczegółów (wiersze warunkowe) | D-5, D-6, D-11 |
| **5** | `CardActions`: `[1][2][3][4]` + „Zdejmij z paska"; zajęty slot mówi, co wymieni; **każda odmowa nazywa powód** | D-5 |
| **6** | pas ~24 j. nad listą pod przyszły filtr; sortowanie w jednej funkcji; kosmetyka | fundament pod skalę |

Kroki 1–2 samodzielnie zamykają zgłoszony błąd wizualny. Przerwanie po dowolnym
kroku zostawia grę w stanie poprawnym.

---

## 3. Pliki do zmiany

| plik | zakres |
|---|---|
| `src/ui/PlayerPanel.ts` | `buildSkillsSubPage()` i `refreshSkills()` — wymiana; nowe pola scrolla i zaznaczenia |
| `src/ui/AbilityCard.ts` | **nowy** — treść karty jako `Line[]`, wiersze warunkowe |
| `src/ui/ItemTooltip.ts` | +~10 linii: publiczna metoda rysująca gotowe `Line[]` (D-11) |
| `src/core/Abilities.ts` | **wyłącznie komentarz** przy `unlocked()`: obiecuje „in the order they were earned", a zwraca kolejność konfiguracyjną (`all().filter`). Kolejność konfiguracyjna jest dla tego ekranu właściwa — poprawić opis, nie kod |

**Bez zmian, choć używane:** `src/ui/CardActions.ts` — API jest domenowo
obojętne (`label` / `onClick` / `disabled` / `color`), wystarczy je wywołać.

---

## 4. Czego NIE zmieniać

| nie ruszaj | dlaczego |
|---|---|
| **`ABILITIES` w `GameConfig.ts`** | D-7 — żadnych nowych pól dla GUI |
| **logiki `core/Abilities.ts`** | mechanika poza zakresem; dozwolony wyłącznie komentarz przy `unlocked()` |
| **wysokości/szerokości `PlayerPanel` (816×530)** | `UI_SCALE.designShortAxis` jest **wyprowadzone z wysokości `PlayerPanel`** — wyższy panel przeskaluje CAŁY interfejs; projekt dostał już raz zgłoszenie „tekst nieczytelny" (`docs/inventory_scroll_ux.md`) |
| **pozycji paska podzakładek `CECHY / UMIEJĘTNOŚCI`** | zaparkowany, zmierzony defekt: stoi na y = −207, widoczny obszar telefonu zaczyna się na −187,5 → brakuje 19,5 px. Należy do przebudowy wysokości panelu, nie do tej zmiany (`docs/odlozone.md`) |
| **plecaka, lalki, zadań, mapy, zapisu** | zmiana ma być odizolowana do podstrony umiejętności |
| **`AbilityBar` (pasek w HUD)** | osobny widżet, osobny cykl klatkowy |
| **`TrainerPanel`** | to jest powierzchnia „zdobywanie" — celowo rozdzielona |
| **przytrzymania jako skrótu przypisania** | D-5 — usunięte świadomie, nie przez przeoczenie |

### Niezmienniki katalogu, których nie wolno złamać

Wszystkie z `src/ui/CLAUDE.md` — najważniejsze tutaj:

- **Maska przycina RYSOWANIE, nie WEJŚCIE** — przewijana lista klikalnych
  wierszy **musi** wyłączać im wejście poza oknem.
- **Łapacz pod spodem nie wystarcza** — ciągnięcie musi startować także na
  wierszach, a kliknięcie odpalać się na **pointer UP za flagą `dragged`**.
- **Ruch i puszczenie łapane na poziomie SCENY**, nie obiektu.
- **Rząd liczony ze stałych przerasta panel po cichu** — wymiaruj
  z `ABILITY_SLOTS.length`, ostrzegaj w konsoli.
- **Nowy widżet idzie przez `textStyle`**, nigdy nie składa stylu ręcznie.
- **Kolor/tint/obrys w pętli klatkowej tylko przy zmianie stanu.**
- **Odmowa nigdy cicha** — przycisk niedostępny jest wyszarzony, widoczny
  i z powodem.
- **Pula wierszy zamiast przebudowy** — `unlocked()` rośnie w trakcie gry,
  a kasowanie obiektów wejściowych w trakcie obsługi ich zdarzenia jest tym,
  przed czym ostrzega komentarz przy dzisiejszej pętli.

---

## 5. Kryteria ukończenia

**Layout i skalowanie**

1. Przy **0, 1, 6 i sztucznie 30** posiadanych umiejętnościach żaden element
   podstrony nie wychodzi poza granice panelu — przemieść **wszystkie** dzieci
   strony, nie tylko wiersze.
2. Rząd slotów wymiarowany z `ABILITY_SLOTS`; podniesienie tej stałej o 1
   **nie** rozsypuje rzędu i **zapala ostrzeżenie w konsoli**, jeśli wynik
   wyjdzie poza panel.
3. Podpisy slotów nie zachodzą na siebie przy żadnej nazwie umiejętności.
4. „Wróć do gry" nie jest przykryty ani nie przykrywa żadnego wiersza.

**Wejście**

5. Wiersz przewinięty poza okno **nie jest klikalny**.
6. Przewijanie startuje także na wierszu; kliknięcie odpala się na pointer UP
   i **nie** odpala się po geście przewijania.
7. Każda odmowa (pasek pełny, brak zaznaczenia) ma widoczny powód.

**Zachowanie**

8. Lista zawiera **wyłącznie** `Abilities.unlocked()` — zero wpisów
   nienauczonych i zablokowanych poziomem.
9. Zero posiadanych umiejętności → widoczne zdanie stanu pustego, nie pusty
   prostokąt.
10. **Tap zaznacza i pokazuje kartę — nigdy nie przypisuje.** Jedyną drogą na
    pasek jest przycisk slotu z karty. Przytrzymanie wiersza **nie robi nic**
    poza ewentualnym rozpoczęciem przewijania.
11. Karta nie pokazuje ani jednego pola, którego dana umiejętność nie ma
    (sprawdzić wszystkie 8: `dodge` bez kosztu wysiłku, `warcry` bez
    `damageMultiplier`, `cleave` bez `windupMs`).
12. Nauczenie umiejętności u trenera przy otwartym panelu dokłada wiersz
    **bez** przebudowy listy.

**Techniczne**

13. `npx tsc --noEmit` oraz `npm run build` czyste.
14. `window.dev.missing` puste, `load.totalFailed` = 0.
15. Zrzut 1:1 przez `renderer.snapshotArea(...)` powiększony 3–4× przy
    `imageSmoothingEnabled = false` — **patrz na render, nie na raport**.
16. Stan postaci do testów ustawiaj przez `window.dev` (`docs/dev_console.md`).

**Dokumentacja**

17. Wpis w `docs/dziennik.md` (najnowsze na górze) z powodami decyzji.

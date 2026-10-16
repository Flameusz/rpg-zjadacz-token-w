---
typ: HISTORIA
domena: [proces, save, inventory, items, ui]
tytul: Checkpoint 2026-09-21 — punkt wejścia
stan: zastapiony
otwarte: [OI-1, OI-20, OI-43, OI-84, OI-94, OI-100, OI-105, OI-126, OI-128, OI-131, OI-132, OI-143, B1]
zastepuje: []
zastapione-przez: docs/current.md
aktualizacja: 2026-10-11
---

# CHECKPOINT 2026-09-21 — punkt wejścia

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. Jego zawartość przeszła do `docs/current.md` 2026-10-11.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **[w dniu zapisu] punkt wejścia projektu.**
>
> ⛔ **To jest ROUTER, nie opis projektu.** Nie powtarza mechaniki (mówi o niej
> `docs/systemy/<domena>.md`), nie powtarza historii (`docs/dziennik.md`) i
> **nie jest listą zadań** — kanoniczną listą `OI` jest i pozostaje
> **`docs/zadania.md`**. Wszystko, co tu stoi, ma prowadzić dalej w dwóch
> zdaniach albo nie stać tu wcale.
>
> ⚠ **Nie czytaj stąd stanu repozytorium — sprawdź go:**
> ```bash
> git log --oneline -3 && git status --short
> ```

---

## 1. Gdzie jest projekt

Grywalny prototyp z domkniętym rdzeniem wojownika. Ostatnie trzy tygodnie
poszły w **ekwipunek, pancerz, tarcze i broń**, a od 2026-09-20 w **fundament
postaci 3D**. Zawartość świata (wioska, druga mapa) celowo za tym nie nadąża —
to jest przyjęty koszt, nie dryf (`CLAUDE.md`, sekcja „Faza projektu").

⚠ **Autor gra w tę grę na bieżąco.** Brak zapisanej relacji z playtestu nie
znaczy, że coś nie było grane.

---

## 2. Etapy ZAMKNIĘTE — nie otwieraj ich bez błędu z uruchomionej gry

| etap | data | gdzie szukać |
|---|---|---|
| **Las: kolizja, nawigacja, GreyWolf, Bear** | 2026-08-31 | `docs/forest_rebuild_scope.md` |
| **Ekwipunek: fundament** (układ lalki jako DANE) | 2026-09-11 | `docs/decyzje/2026-09-11-ekwipunek-fundament.md` |
| **Warstwy pancerza jako mechanika** (model C, 19 adresów) | 2026-09-15 | `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` |
| **Obciążenie: Model D** (`OI-104`, dwie osie) | 2026-09-15 | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| **Pancerz i tarcze: ARMOR SYSTEM FREEZE** | 2026-09-18 | `docs/pancerz_checkpoint.md` |
| **Katalog broni + oś materiału + `minReach`** | 2026-09-17 | `docs/checkpoint_2026-09-17.md` |
| **Grafika tarcz + pierwszy gabaryt 1×2** | 2026-09-19 | `docs/tarcze_grafika_checkpoint.md` |
| **Ekran handlu: przebudowa** | 2026-09-19 | `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md` |
| **Cofnięcie sprzedaży = operacja ATOMOWA** (`OI-133`) | 2026-09-21 | `docs/systemy/inventory.md`, `tools/sklep_cofniecie.mjs` §5 |

⛔ **`coverage`, hit location i penetracja NIE POWSTANĄ** — ani teraz, ani jako
„mechanika na później".

---

## 3. Co jest otwarte — najważniejsze

⛔ **Pełna lista to `docs/zadania.md`.** Poniżej wyłącznie to, o co następna
sesja potknie się najszybciej.

**Czeka na jedno zdanie autora:**

| `OI` | pytanie |
|---|---|
| `OI-143` | czy trzy zestawy materiałowe wolno mieć **częściowo czynne naraz** — ⭐ **warunek wstępny `OI-94`** (treść premii zestawów) |
| `OI-20` | czym miał być sufit `maxDefenseReduction` |
| `OI-100` | czy domykamy trójkąt typów obrażeń piątym profilem (łuska) |
| `OI-43` | krzywa XP wobec obecnego rostera — pula 310 → 825+ XP. ⏸ **Czeka na rozbudowę rozgrywki** (autor 2026-10-11) |
| ~~`OI-51`~~ | ✅ **zamknięte 2026-10-11** — zapis się migruje, niewczytywalny idzie do kopii (`docs/systemy/save.md` §2) |

**Czeka na playtest, nie na kod:** biegłość (§33.4), stamina, `OI-105`.

**Czeka na robotę, bez decyzji:** ~~`OI-106`~~ (✅ zamknięte 2026-10-11 — dystrybucja ekwipunku),
`OI-126` (24 tarcze metalowe dzielą jeden kafel), ~~`OI-130`~~ (✅ 2026-10-11 — zakładki kategorii),
`OI-131` (panel handlu liczy rozmiar raz), `OI-132` (sprzedaż zestawu
schowanego), `OI-1` / `OI-84` (dokumentacja).

---

## 4. Świadomie ODŁOŻONE — ⛔ nie „naprawiaj" przy okazji

| rzecz | dlaczego |
|---|---|
| **`B1` — obciążenie `W4`: 59,7 kg wobec pasma 40–55 kg** | ⛔ **NIE JEST BLOKEREM.** Skutek rozrostu katalogu (broń 11 → 37, tarcze, warstwy) przy dwóch lokacjach. Finalny balans jest świadomie odłożony do późniejszego etapu; `obciazenie_przymiar` świeci na czerwono **celowo**. ⛔ Nie ruszaj mas, pasma, udźwigu ani testu |
| **Siła jako płaska premia do obrażeń** | poprawne rozwiązanie wymaga przestrojenia wszystkich broni i HP wrogów |
| **Grafika wioski** | znana, świadomie otwarta dziura — ⛔ nie zastępuj prowizorką |
| **Wspólny stub Phasera w `tools/`** | 10 RÓŻNYCH stubów w 19 narzędziach; minimalizm jest **czujnikiem** („gdyby `EventBus` sięgnął głębiej, bundlowanie padnie głośno"), a wspólny tłusty stub wygasiłby go wszędzie naraz |

Reszta barierek („czego celowo NIE budujemy") → `docs/odlozone.md` §5.

---

## 5. Stan przymiarów (2026-09-21)

```bash
npx tsc --noEmit && npm run build && node tools/doc_check.mjs
```

| bramka | stan |
|---|---|
| `tsc --noEmit` · `npm run build` | ✅ |
| `doc_check` | ✅ 0 błędów (43 ostrzeżenia o rozmiarze — nieblokujące, patrz `DOC_CONTRACT` §8) |
| **30 przymiarów** | ✅ **29 zielonych** |
| `obciazenie_przymiar` | ⛔ **CZERWONY CELOWO** — `W4`, patrz §4 |

⭐ **Przymiary, które powstały ostatnio i warto o nich wiedzieć:**

- **`tools/zapis_weryfikacja.mjs`** (2026-09-21, `OI-50`) — pierwszy przymiar
  zapisu: pełny obieg pole po polu, całkowitość odmowy przy obcej wersji,
  **strukturalne sprawdzenie, że każde pole `SaveData` jest i pisane, i
  czytane**, zapis bez pól opcjonalnych, sloty, wyciszenie autozapisu.
- **`tools/sklep_cofniecie.mjs` §5** (2026-09-21, `OI-133`) — kontrakt
  atomowości cofnięcia; `hasRoomFor` ⟷ `addItem` zamiatane po całym katalogu.

⚠ **Niezmiennik, który kosztował w tym projekcie najwięcej:** *asercja, która
nie potrafi zaświecić na czerwono, jest dekoracją.* Dokładając regułę, **zepsuj
kod celowo i sprawdź, że raport zgłasza BŁĄD**. W sesji 2026-09-21 wyszło tak,
że `occlusion_weryfikacja` §D robiło **zero obiegów** od zmiany `PLAYER.scale`,
a §5h w sklepie przechodziło mimo usuniętego komunikatu.

---

## 6. Granice zakresu

⛔ **Nie audytuj ponownie bez danych z uruchomionej gry:** pancerz i tarcze
(freeze 2026-09-18), las (2026-08-31), jakość wykonania, `combat`/`weapon`/
`armor`/`equipment` V1.

⛔ **Nie rozstrzygaj za autora.** Wszystko z §3 to jedno zdanie decyzji — agent
przygotowuje warianty i pomiar, nie wybiera.

⛔ **Nie twórz mechanik przy okazji.** Wariant użycia może zdolność **odebrać,
nigdy dodać**.

⚠ **Punkt wejścia wątku postaci 3D jest osobny** — `docs/postac3d_checkpoint.md`
(⚠ nieaktualne: od 2026-10-10 **prototyp ZAMKNIĘTY, baza V5 = MASTER**, `OI-134` zamknięte;
dawniej: V3 = wersja robocza, niezaakceptowana; `OI-137` — „martwe
klucze `PROPORCJE`" — zamknięte 2026-09-27, nieaktualne od A4). Ten checkpoint go nie streszcza i nie ocenia.

---

## 7. Dokąd dalej

| pytanie | dokument |
|---|---|
| jak działa konkretna mechanika | `docs/systemy/<domena>.md` (**jedyne** źródło prawdy) |
| co jest otwarte | ⭐⭐ `docs/zadania.md` (**kanoniczna lista `OI`**) |
| co się działo i dlaczego | `docs/dziennik.md` (najnowsze na górze) |
| kolejność dużych etapów | `docs/roadmap.md` |
| czego celowo nie budujemy | `docs/odlozone.md` §5 |
| gdzie czego szukać | `CLAUDE.md` |

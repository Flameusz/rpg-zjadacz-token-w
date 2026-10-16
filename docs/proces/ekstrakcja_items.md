---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena items (pilotaż)
stan: zamkniety
kotwice: [tools/doc_check.mjs]
otwarte: [OI-8, OI-9, OI-10, OI-11]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Canon Extraction — `items` (pilotaż procedury)

> **Po co ten plik.** Jest zapisem **procedury**, nie treści dziedziny — treść
> poszła do `docs/systemy/items.md`. Ma służyć jako szablon dla pozostałych
> 25 domen, więc opisuje też to, co nie zadziałało.

---

## 1. Procedura, która została wykonana

| krok | co zrobiono | narzędzie |
|---|---|---|
| **1. Odczyt z KODU** | 61 przedmiotów, 7 typów, 33 różne pola, pełne kształty `QUALITY` / `EQUIPMENT` / `EQUIPMENT_LOAD` / `ARMOR_PROFILE`, lista `EQUIP_SLOTS` i `BAG_SLOTS` | esbuild → node na `GameConfig.ts`, `grep` po `src/` |
| **2. Odczyt dokumentacji** | `ekwipunek_mechanika.md` (główny), `ekwipunek_przedmioty.md`, `jakosc_wykonania.md`, `bron_dwureczna_analiza.md`, `src/core/CLAUDE.md` | — |
| **3. Rozjazdy** | 9 sztuk, §2 | porównanie ręczne |
| **4. Zbiór obowiązujących decyzji** | 15 niezmienników `N-1…N-15`, z których **13 zostało przeniesionych, 1 oddany innej domenie, 1 poprawiony** | — |
| **5. Napisanie `STAN`** | `docs/systemy/items.md`, 14,9 KB | — |
| **6. Bramka** | `node tools/doc_check.mjs` — nowy dokument bez błędów `§S`/`§P`/`§K`/`§N`/`§R` | przymiar |

⚠ **Kolejność 1 → 2 jest istotna i nie jest formalnością.** Trzy z dziewięciu
rozjazdów (R-1, R-2, R-4) to rzeczy, których w dokumencie **nie ma wcale**.
Gdyby ekstrakcja zaczęła się od czytania dokumentu, nie byłoby czego z czym
porównać — brak nie rzuca się w oczy, w przeciwieństwie do sprzeczności.

---

## 2. Rozjazdy kod ↔ dokumentacja

Wszystkie względem `docs/ekwipunek_mechanika.md`, czyli **najlepiej
utrzymanego dokumentu mechanicznego w projekcie** (edytowanego tego samego dnia).

| # | dokument twierdzi | kod ma | waga |
|---|---|---|---|
| **R-1** | `type` ma cztery wartości: `weapon`/`armor`/`consumable`/`material` | **siedem** — dochodzą `ring`, `amulet`, `container` | ⛔ wysoka — model danych |
| **R-2** | `armorType`: `leather`/`metal`/`padded` | **cztery** — dochodzi `mail`, użyty przez pełny komplet 5 sztuk | ⛔ wysoka — cała macierz `ARMOR_PROFILE` ma czwarty wiersz, a niezmiennik N-7 rozumuje o trójkącie |
| **R-3** | `hands`: „jedyny użytkownik dziś: `ITEMS.spear`" | **trzy** bronie dwuręczne | ⚠ średnia |
| **R-4** | `weight` **nie występuje w modelu danych** | pole na 34 przedmiotach; nośnik całego obciążenia | ⛔ wysoka — brak, nie sprzeczność |
| **R-5** | tabela pól broni **nie wymienia `family`** | 10 z 11 broni je niesie; nośnik cechy rodziny | ⚠ średnia |
| **R-6** | `block: { reduction, swingMul }` | + `staminaCost` | ⚠ niska |
| **R-7** | N-13: „lalka rysuje 12 komórek, z których **8 działa**" | `EQUIP_SLOTS` ma **10** działających + 4 sloty toreb osobno | ⚠ średnia |
| **R-8** | §2.1 pomija `tintIcon`, `containerSlots`, `healOverTime`, `healAmount` | wszystkie cztery są w danych | ⚠ niska |
| **R-9** | mapa „gdzie co jest rozstrzygane" nie wymienia `core/DamageResolver.ts` | §4 tego samego pliku na niego wskazuje | ⚠ niska — spójność wewnętrzna |

**Wzorzec jest ten sam co w audycie 2026-09-03: wszystkie dziewięć idą w jedną
stronę — dokumentacja jest za kodem. Żaden nie jest błędem w kodzie.**

⚠ **R-2 i R-4 są klasą, której przymiar NIE ZŁAPIE.** Nie cytują nieistniejącego
symbolu — po prostu **milczą** o istniejącym. Wykrywalne wyłącznie przez
porównanie listy pól z kodu z listą pól w dokumencie, czyli przez ekstrakcję.
To jest granica `doc_check.mjs` i trzeba ją znać.

---

## 3. Decyzje zebrane z dokumentów historycznych

Ekstrakcja **nie wymyśliła ani jednej reguły** — wszystkie pochodzą
z istniejących dokumentów i zostały zweryfikowane przeciw kodowi.

| co | skąd | los |
|---|---|---|
| `N-1` pełna ścieżka bez wymagań | `ekwipunek_mechanika.md` §5 | ✅ przeniesione, **zweryfikowane**: żaden komplet skóry ani przeszywanicy nie ma `requires` |
| `N-2` bramkuje wyłącznie Siła | j.w. | ✅ przeniesione, **zweryfikowane**: wszystkie 18 wymagań to `strength` |
| `N-3` jakość nie rusza kategorii | j.w. | ✅ przeniesione |
| `N-4` wariant tylko zawęża | j.w. + `warianty_atakow.md` | ✅ przeniesione |
| `N-5` rozpiętość wariantów | j.w. | ✅ przeniesione |
| `N-6` `swingMul` w oba pola naraz | j.w. | ➡ **oddany domenie `combat`** — dotyczy pipeline'u, nie przedmiotu |
| `N-7` nowy materiał musi kogoś bić | j.w. | ⚠ przeniesione **z otwartym problemem OI-8** (pisany dla trzech materiałów) |
| `N-8` `armorType` to materiał | j.w. | ✅ przeniesione |
| `N-9` żadnej penetracji pancerza | j.w. | ✅ przeniesione |
| `N-10` bonusy wewnątrz sufitów | j.w. | ✅ przeniesione |
| `N-11` przedmiot nie znika | j.w. | ✅ przeniesione, **zweryfikowane** przeciw `EQUIPMENT.durability.destroyedMultiplier` |
| `N-12` sprawdź koszty przed pobraniem | j.w. | ✅ przeniesione |
| `N-13` slot dopiero z przedmiotem | j.w. | ⚠ przeniesione **z poprawioną liczbą** (R-7) |
| `N-14` pole opcjonalne w zapisie | j.w. + `src/core/CLAUDE.md` | ✅ przeniesione |
| `N-15` mechanika bez nowej grafiki | j.w. | ✅ przeniesione |
| „tarcza to pancerz, który blokuje" | `ekwipunek_mechanika.md` §2.4 | ✅ przeniesione |
| „pierścień z atrybutem odrzucony, bo `requires` sprawdza się raz" | j.w. §2.5 | ✅ przeniesione — **najcenniejsza pozycja**, bo to decyzja negatywna z powodem |
| „poziomy 5–7 to rezerwa, nie martwy kod" | `jakosc_wykonania.md` | ✅ przeniesione, **OI-10** |

---

## 4. Co ŚWIADOMIE zostało w historii i decyzjach

`STAN` nie przejmuje niczego z poniższych — wskazuje na nie.

| co zostaje | gdzie | dlaczego nie w `STAN` |
|---|---|---|
| pomiary, które doprowadziły do modelu jakości (tabele przed/po dla 6 broni) | `jakosc_wykonania.md` + `jakosc_wykonania_ocena.md` | to jest **dlaczego**, nie **jak jest** |
| historia dwóch kształtów ochrony (procenty vs punkty) i powód wyboru punktów | `typy_obrazen.md` | uzasadnienie decyzji |
| dziewięć poprawek review broni dwuręcznej, w tym wycofanie „przeklasyfikuj topór i młot" | `bron_dwureczna_analiza.md` | odrzucone warianty |
| pomiar „pchnięcie miecza z `arcMul` 0,6 byłoby węższe niż sztylet" | `ekwipunek_mechanika.md` N-5 | pomiar z datą — zostaje przy decyzji, w `STAN` jest sama reguła |
| relacja z wdrożenia jakości i naprawy | `dziennik.md` | narracja |
| pełne tabele rosteru | `ekwipunek_przedmioty.md` | typ `GENEROWANE` ma pierwszeństwo dla liczb |

⚠ **`ekwipunek_mechanika.md` NIE zostaje zarchiwizowany.** Jest dziś źródłem
dla **czterech–pięciu** domen (`items`, `armor`, `shields`, `combat`,
częściowo `inventory`) i wolno go zamknąć dopiero, gdy wszystkie mają swój
`STAN`. Dostał baner wskazujący, która jego część jest już przeniesiona.

---

## 5. Ocena procedury jako wzorca

**Nadaje się.** Cztery rzeczy, które warto powtórzyć bez zmian:

1. **Odczyt z kodu przez esbuild → node, nie przez `grep` po tekście.** Pełna
   lista pól z licznikiem („na ilu przedmiotach") wyprodukowała R-1, R-2, R-4
   i R-8 w jednym przebiegu — czyli **cztery z dziewięciu rozjazdów wyszły
   z jednego polecenia**.
2. **Tabela granic domeny na początku `STAN`** (§0). Bez niej pilotaż
   rozlałby się na `armor`, `shields` i `inventory`, bo źródłowy dokument je
   obejmuje.
3. **Weryfikacja każdego przenoszonego niezmiennika przeciw kodowi.** Trzy
   z piętnastu okazały się nieaktualne albo niepełne. Przeniesienie „na wiarę"
   przeniosłoby błąd do dokumentu, który ma być źródłem prawdy.
4. **Sekcja `## Pokrycie` wypełniana na końcu**, z kodu i z bramek — nie
   z pamięci.

**Dwie rzeczy do zmiany w kolejnych domenach:**

- ⚠ **Numeracja niezmienników `N-n` jest globalna, a domeny są rozłączne.**
  `N-6` poszło do `combat`, więc numeracja w `items` ma dziurę. Zachowałem ją
  świadomie (odwołania z innych dokumentów), ale przy trzeciej takiej domenie
  trzeba to rozstrzygnąć — **OI-11**.
- ⚠ **Budżet.** Ta domena była najłatwiejsza (jeden dobry dokument źródłowy,
  jasne granice) i zajęła jedną sesję. `combat` ma osiem dokumentów źródłowych
  i brak dokumentu-modelu — planuj dwie.

**Czego procedura NIE złapie i trzeba o tym wiedzieć:** rozjazdów typu
„dokument milczy o istniejącym polu" nie wykryje żaden skrypt. Jedynym
mechanizmem jest ekstrakcja, czyli ta procedura — co znaczy, że **przymiar
utrzymuje stan po ekstrakcji, ale nie zastępuje samej ekstrakcji.**

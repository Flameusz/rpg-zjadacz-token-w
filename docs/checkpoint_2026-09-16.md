---
typ: HISTORIA
domena: [shields, items, proces]
tytul: Checkpoint 2026-09-16 — punkt wejścia po sesji tarcz i pancerza
stan: zamkniety
otwarte: [P1, B2, B3, OI-24, OI-25, OI-26, OI-99, OI-100, OI-143, OI-105]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT 2026-09-16 — punkt wejścia

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. W swoim zakresie (30 tarcz, `T-1`, `OI-24`) wolno z niego brać pomiary i powody.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **[w dniu zapisu] punkt wejścia projektu.** Ten plik zastępuje
> `docs/checkpoint_2026-09-15.md` jako punkt wejścia. Tamten w swoim zakresie
> (model C, gatunek żelazo/stal, audyt obciążenia) jest nadal aktualny, ale
> **nie wie o niczym z 2026-09-16**.
>
> ⛔ **Nie czytaj stąd stanu repozytorium — SPRAWDŹ GO:**
> `git log --oneline -3 && git status --short`.

## Stan git

```
main == origin/main, drzewo czyste
d5bd27d  feat(tarcze+pancerz): katalog 30 tarcz, mechanizm T-1, pomiar OI-24, piec paczek pancerza
147894d  merge: feat/tarcze-ciezar-bloku (T-7) do main — osiem konfliktow
```

⭐ **Gałąź `feat/tarcze-ciezar-bloku` jest WMERGOWANA** (T-7: blok jako zdarzenie
o ciężarze, `ShieldSkill`, `ArmorTraining`, Model D, roadmapa). Druga gałąź
`feat/forrest-tree-atlas` była już w `main` wcześniej. ⛔ **Nic nie zalega.**

## Bramki — stan na koniec sesji

```
tsc --noEmit ✅   npm run build ✅
combat_regresja ✅ 121/121 ZERO RÓŻNIC
tarcze_przymiar ✅ 0 czerwonych   p1_instrument ✅   stamina ✅
attack_resolver ✅   viewport ✅   obciazenie: ❌ 1   doc_check: ❌ 1
```

⚠ **Dwa czerwone są ZNANE i oba leżą poza zakresem tarcz:**

| gate | co | dlaczego nie ruszone |
|---|---|---|
| `doc_check` | `docs/systemy/items.md` **20,5 KB > 20,0 KB** dla typu `STAN` | przyszło z merge'a; obie strony były POD limitem (20 414 i 20 367 B), przekroczył dopiero merge. Cięcie dokumentu `STAN` to decyzja treściowa |
| `obciazenie_przymiar` | **W4**: najcięższy osiągalny zestaw **58,7 kg** wobec pasma kalibracji **40–55 kg** | przesunęła go **ciężka pawęż (16,2 kg)**. Pasmo to kalibracja Modelu D (`OI-105`), trzymana osobno decyzją autora |

⚠ **`docs/systemy/shields.md` ma 6 bajtów zapasu** do twardego limitu (20 474 / 20 480). Następna zmiana tam wymaga wcześniejszego cięcia.

## Co zamknięto 2026-09-16

### Tarcze

- ✅ **Katalog 30 pozycji w `ITEMS`** — wyprowadzany z `SHIELD_BASE` × `SHIELD_VARIANT`, **zero ręcznie wpisanych liczb per pozycja**. Zakres zawężono **39 → 30**: wariant `light` został **wyłącznie przy Legionowej** (u puklerza i okrągłej oszczędność masy jest poniżej progu Modelu D; u rycerskiej lekka zbija `reduction`, czyli jej własną tożsamość).
- ✅ **`B1`** — wariant cięższy nazywa się **„ciężki"**; ⛔ „wzmocniony" odrzucone (sugeruje inną właściwość konstrukcyjną). ⛔ Wariant **nie dostaje własnej właściwości**.
- ✅ **`B4`** — cena wariantu **WYLICZANA**: `buyPrice × materialPriceMul × variantPriceMul × qualityPriceMul`. ⏳ Wartość `variantPriceMul` (0,80 / 1,25) jest **STARTOWA**.
- ✅ **Dystrybucja** — Sobek dostał pierwszą półkę (**12 drewnianych, jakość 3**), Radzim **19 metalowych** (jakość 1–2). Myśliwy bez tarcz.
- ✅ **`T-1` — mechanizm geometrii per konstrukcja.** Łańcuch `construction → SHIELD_GEOMETRY → BlockSpec.geometry → resolver`; `guardZone` bierze profil **parametrem**, brak profilu = fallback 60°/100°. ⛔ **Rejestr `SHIELD_GEOMETRY` jest CELOWO PUSTY** — wartości to `B3`, po `P1`.
- ✅ **`OI-24` — pomiar wykonany** (nie decyzja): kanał pancerza dobija **dokładnie do capu 0,75 już przy jakości 4** (161,7 pkt), a **łączna mitygacja to 91,8% ze sprzętu z półki** i 94,2% teoretycznie — bo tarcza mnoży się PO capie. ⚠ Cap zdejmuje tylko **0,5–0,9 pp**: na tym poziomie ogranicza KRZYWA, nie sufit.

### Pancerz — pięć paczek

- ✅ Nazwy: *Kaftan podzbrojny* → **Kaftan pikowany**; *Sabatony częściowe* → **Półpłytowe**.
- ✅ **Zwykły ubiór (6):** Czepiec, Koszula, Spodnie, Łapcie, Trzewiki, Buty piechura. ⚠ Otwiera ponownie wiersz *„koszula lniana jako L1"* z taksonomii — z **nową przesłanką**: wyposażenie jednostki nieopancerzonej, nie ochrona.
- ✅ **Skórzany ćwiekowany** (`studded_leather`) — L2, świadomy **KONIEC lżejszej ścieżki**, ⛔ bez odpowiednika L3.
- ✅ **Szyszak** (`spangenhelm`) — L3, osobna konstrukcja od kapalina i hełmów.
- ✅ **Slot `shoulders` OŻYWIONY** zgodnie z procedurą z `src/core/CLAUDE.md` (kafel stał jako `planned` od 2026-09-11). Naramienniki skórzane i płytowe. ⛔ `SAVE_VERSION` nietknięte — `shoulders?` weszło polem opcjonalnym.
- ✅ **Lamelka i łuska (7 sztuk)** jako osobne rodziny — **L3, decyzja zamknięta**. ⚠ `armorType: "metal"` jest wymuszony technicznie; `OI-100` (własna kolumna `ARMOR_PROFILE`) zostaje otwarte jako **inne** pytanie.

## ⛔ Decyzje ZAMKNIĘTE — nie otwierać bez sygnału

- ⛔ **`light` tylko dla Legionowej**; brak lekkiej Pawęży (zlałaby się ze zwykłą Legionową, a para przechodzi test niedominacji tylko dzięki `D-T2`).
- ⛔ **Lamelka i łuska = L3.** ⛔ Nie wracać do pytania, czy powinny być L2.
- ⛔ **Wariant nie dostaje własnej właściwości** — żadnej odporności na odrzut, przebicia bloku ani bonusu sytuacyjnego.
- ⛔ **`coverage` nie powstanie** — nigdy.
- ⛔ **Model D, `OI-103`/`OI-101`** — zamknięte, nie wracać do Modeli A/B/C.
- ⛔ **Cap `0,75`, `defenseK 50`, krzywa** — zamrożone.

## ⏳ Otwarte — kolejność

| # | rzecz | co odblokowuje | rodzaj |
|---|---|---|---|
| 1 | ⭐⭐ **`P1`** — pomiar rozkładu kątów ciosów | `B3` → wartości `sideArcDeg` → cały `T-1` | **wymaga GRANIA**, instrument gotowy i sprawdzony na żywo |
| 2 | **`B3`** | geometria per konstrukcja | decyzja po `P1` |
| 3 | **`B2`** | luka PP i łuku Legionowa ↔ Pawęż | decyzja autora |
| 4 | **`T-4` cz. 2** — profil bashu per konstrukcja | ⚠ **Legionowa jest w grze bez sztandarowej cechy** („mocny bash") | brak pola w `BlockSpec` |
| 5 | **`OI-24`** | czy łączna mitygacja ma wspólny sufit | **decyzja, nie pomiar** — pomiar zrobiony |
| 6 | **`OI-105`** | playtest parametrów startowych Modelu D | ⛔ nie w tej sesji |
| 7 | **`OI-99`** — Karwasze | ⛔ **ZABLOKOWANE**: brak slotu `arms`, siatka lalki **12/12 pełna** | decyzja o układzie UI |
| 8 | **`OI-143`** | ✅ **ROZSTRZYGNIĘTE 2026-09-21** — zderzenie numeru zamknięte: `OI-104` zostaje przy **Modelu D** (zamknięte decyzje zachowują numery), a kumulacja zestawów dostała `OI-143` | decyzja autora |
| 9 | wartość **`variantPriceMul`** | kalibracja ekonomii | decyzja |

## ⚠ Dług, który powstał w tej sesji

1. ⚠ **19 przedmiotów bez dystrybutora** — 6 × zwykły ubiór, `studded_leather`, `spangenhelm`, 2 × naramienniki, 7 × lamelka/łuska, `splinted_greaves` (planowany). Jedna decyzja o ekonomii załatwia wszystkie.
2. ⚠ **28 z 30 tarcz nie ma ikony ani modelu 3D** — dzielą dwa placeholdery; brak modelu = **pusta lewa dłoń + `console.warn`**. ⛔ Nie blokuje mechaniki.
3. ⚠ **Audyt warstw pancerza (2026-09-16) znalazł jeden realny błąd modelu:** `steel_boots`/`iron_boots` są opisane jako kompletny but, ale siedzą na `boots_L3`, więc legalny jest zestaw **„buty L2 + buty L3" = dwie pary butów**. Kontrast: `half_sabatons` są opisane poprawnie jako nakładka. ⚠ Naprawa to **nazwa i opis**, nie warstwa.
4. ⚠ **`hardened_leather_chest`** — sztywna skorupa na L2, więc siedzi POD każdym L3. Jedyne miejsce, gdzie macierz kompatybilności daje ❌ w całym wierszu.
5. ⚠ **`ironbound_shield`** nazywa się „Tarcza okuta", a jest **stalową okrągłą zwykłą** — nazwa nie pasuje do siatki katalogu.

## Gdzie co czytać

| pytanie | dokument |
|---|---|
| katalog 30 tarcz, siatka, `B1`/`B4` | `docs/tarcze_katalog.md` |
| decyzje o tarczach, `B2`/`B3`, `P1`, kroki | `docs/tarcze_checkpoint.md` |
| jak działa blok | `docs/systemy/shields.md` |
| protokół `P1` i komendy `dev.guard` | `docs/tarcze_checkpoint.md` §`P1` |
| taksonomia pancerza, warstwy, odrzucone | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |
| Model D / obciążenie | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| lista otwartych `OI` | `docs/zadania.md` |
| pomysły bez wyzwalacza (m.in. hełmy a ogłuszenie) | `docs/pomysly.md` |

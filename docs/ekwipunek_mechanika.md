---
typ: HISTORIA
domena: items
tytul: Ekwipunek — mechanika przedmiotów nakładanych
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Ekwipunek — mechanika przedmiotów nakładanych

> ## ⚠ CZĘŚĆ TEGO PLIKU ZOSTAŁA PRZENIESIONA (2026-09-05)
>
> **Domena `items` ma od 2026-09-05 własny dokument `STAN`:
> `docs/systemy/items.md`** — czym JEST przedmiot, jakie niesie pola, jak
> działa jakość, trwałość, waga i wymagania. **Przy sprzeczności wygrywa
> tamten plik**, bo jest kotwiczony w kodzie i pilnowany przez
> `tools/doc_check.mjs`.
>
> ⛔ **Ten plik NIE jest archiwizowany i nie wolno go usunąć.** Jest dziś
> źródłem dla **czterech–pięciu** domen; przeniesiona została jedna. Zostaje
> jako obowiązujące źródło dla:
>
> | co | domena, która to przejmie |
> |---|---|
> | §2.3 wariant ataku, §3 ścieżka ofensywna | `combat` |
> | §4 ścieżka defensywna, krzywa pancerza | `armor` |
> | §4 strefy osłony, `guardZone` | `shields` |
> | §5 niezmienniki dotyczące pipeline'u (N-6) | `combat` |
>
> ⚠ **Dziewięć rozjazdów z kodem znalezionych przy ekstrakcji** (m.in. cztery
> typy przedmiotu zamiast siedmiu, trzy materiały pancerza zamiast czterech,
> brak `weight` i `family` w modelu danych) jest wyliczonych w
> `docs/proces/ekstrakcja_items.md` §2. **Liczb w tym pliku świadomie NIE
> poprawiono** — poprawka należy do ekstrakcji domeny, która przejmie daną
> sekcję.

> **Co to jest:** jedno źródło wiedzy o tym, **jak przedmiot zakładany na postać
> wpływa na postać**. Każde pole, jakie może nieść, kto je czyta, i przez jakie
> kroki przechodzi cios — w obie strony.
>
> **Po co:** żeby dołożenie broni albo sztuki pancerza było wypełnieniem tabeli,
> a nie śledztwem po pięciu plikach. Do tego dochodzi lista **niezmienników** —
> reguł, których nowy przedmiot nie może złamać, każda z powodem i z blizną,
> która ją wymusiła.
>
> **Podział ról (ważny):**
>
> | plik | mówi | pisany |
> |---|---|---|
> | **`ekwipunek_mechanika.md`** (ten) | jak to **DZIAŁA** i czego **NIE WOLNO** | ręcznie, zmienia się rzadko |
> | `ekwipunek_przedmioty.md` | co **JEST** — wszystkie liczby rosteru | **generowany** z `GameConfig.ts` |
>
> Liczb w tym pliku jest celowo mało, i tylko takich, które są **progami albo
> pomiarami**, a nie zawartością tabeli.

---

## 1. Mapa: gdzie co jest rozstrzygane

| plik | rozstrzyga |
|---|---|
| `config/GameConfig.ts` → `ITEMS` | **wszystkie** dane przedmiotu. Jedyne miejsce, w którym stroi się balans |
| `config/GameConfig.ts` → `ARMOR_PROFILE` | mnożnik (materiał × typ obrażeń) |
| `config/GameConfig.ts` → `EQUIPMENT`, `QUALITY`, `SHIELD` | krzywa pancerza, jakość/trwałość, kąt bloku |
| `core/Equipment.ts` | sloty, zakładanie, wymagania, sumy pancerza, `blockSpec`, typy `MeleeShape`/`AttackVariant`/`DamageType`/`BlockSpec` |
| `core/Quality.ts` | egzemplarz: `instanceDamage`, `instanceDefense`, trwałość, naprawa, cena wg jakości |
| `core/Progression.ts` | **jedyne** miejsce, gdzie stosuje się wariant. Każdy getter kształtu ciosu |
| `core/Protection.ts` | **jedyne** miejsce, gdzie liczy się redukcję — dla obu stron walki. Plus `guardZone` (trzy strefy osłony) i `effectiveness`. ⚠ `blockFraction` USUNIĘTE 2026-09-05 — było martwe od wyciągnięcia `DamageResolver` |
| `entities/Player.ts` | rozstrzygnięcie ciosu OTRZYMANEGO (`takeDamage`) |
| `scenes/GameScene.ts` | rozstrzygnięcie ciosu ZADANEGO (`damageMatchingEnemies`) |

⚠ **Nie ma trzeciego resolvera i nie wolno go dodać.** Są dokładnie dwa
(`GameScene` gracz→wróg, `Player.takeDamage` wróg→gracz), oba kończące na
`core/Protection`. Nowy rodzaj przedmiotu ma trafić w istniejący krok, nie
dopisać własny.

---

## 2. Model danych przedmiotu

### 2.1 Pola wspólne

| pole | kto czyta | uwagi |
|---|---|---|
| `id`, `name`, `description` | UI | |
| `type` | `slotForItem`, `armorPieces` | `weapon` \| `armor` \| `consumable` \| `material` |
| `icon` / `iconTexture` / `color` | `Assets.ts` | wycinek z `items.png`, samodzielny PNG albo plamka |
| `buyPrice` / `sellPrice` | sklep | ⚠ **brak `buyPrice` = przedmiot nie do kupienia** — jedyny rodzaj nagrody, którego złoto nie obejdzie (`cooked_meat`, `padded_gloves`) |
| `requires: { strength }` | `Equipment.equip` | sprawdzane **tylko przy zakładaniu** |

### 2.2 Broń (`type: "weapon"`)

| pole | co robi |
|---|---|
| `damageMin` / `damageMax` | baza zakresu. Skalowane przez jakość, stan, wariant **i atrybuty** (`strScale`/`dexScale` niżej) |
| `strScale` / `dexScale` | **ile obrażeń oddaje ta broń za punkt Siły / Zręczności.** ⚠ Wymagane, bez wartości domyślnej. To jest oś, na której młot należy do siłacza, a sztylet do zręcznościowca — patrz komentarz nad `ATTRIBUTES` |
| `attackCooldown` (s) | odstęp między ciosami |
| `swingDurationMs` | czas pozy ataku. **Z niego wynikają dwie inne rzeczy** — root i moment trafienia |
| `swingThrustPx` | wizualne wysunięcie. ⚠ **Nie wolne pokrętło** — powyżej ~11 broń odrywa się od pięści w połowie zamachu (`public/assets/README.md`, sekcja o dwóch skalach ikony) |
| `durability` | maksimum przy Zwykłej |
| `melee: MeleeShape` | `arcDeg`, `reach`, `knockback`, opcjonalnie `interrupts`, `critChanceBonus`, `critMultiplierBonus` |
| `attacks: AttackVariant[]` | 1–3 sposoby użycia. **Tu mieszka typ obrażeń**, nie na broni |
| `hands?: 1 \| 2` | brak = 1. `2` → druga ręka zostaje pusta, i **nic poza tym**: żadnego bonusu do obrażeń, tempa, zasięgu ani kary do bloku. ⚠ Własność **konkretnego przedmiotu**, nie rodziny broni — młot 1H i młot 2H mogą istnieć obok siebie. Jedyny użytkownik dziś: `ITEMS.spear` |

### 2.3 Wariant ataku (`AttackVariant`)

Wszystko jest **mnożnikiem na własną liczbę broni**; brak pola = ×1.

`arcMul`, `reachMul`, `damageMul`, `swingMul`, `thrustMul`, `sweepMul`,
`knockbackMul`, `interrupts`, plus wymagane `id`, `name`, `damageType`.

⚠ **REGUŁA ZAWĘŻANIA** — wariant może zdolność **odebrać**, nigdy przyznać.
Wymuszona w typach: `interrupts` jest typu `false` (dosłownie nie `true`), a
`knockbackMul` jest klamrowany do ≤1 w `Progression`. Bez tego obuch siekiery
przyznałby sobie przerywanie młota.

⚠ `damageMul` mnoży **bazę broni po jakości**, a mnożnik atrybutów dochodzi
**po nim**: `baza(jakość) × damageMul × (1 + SIŁ×strScale + ZRĘ×dexScale)`.
Do 2026-08-20 Siła była tu DODAWANA i to właśnie **spłaszczało wybór wariantu**
— przewaga Cięcia nad Pchnięciem spadała z 11,8% (Siła 0) do 3,3% (Siła 10).
Przy mnożeniu zostaje 11,8% na całej krzywej (`docs/atrybuty.md` §10.4b).

⚠ `swingMul` musi trafiać w `attackCooldown` **i** `swingDurationMs` naraz.
Dlatego istnieje jeden prywatny getter `Progression.swingMul` — dwa wywołania
tego samego gettera nie potrafią się pomylić, dwa osobne wyrażenia potrafią.

### 2.4 Pancerz (`type: "armor"`)

| pole | co robi |
|---|---|
| `slot` | `head` \| `chest` \| `gloves` \| `legs` \| `boots` \| `offhand` |
| `armorType` | `leather` \| `metal` \| `padded` — wybiera kolumnę w `ARMOR_PROFILE` |
| `defense` | punkty. **Nie procenty** |
| `block?: BlockSpec` | `{ reduction, swingMul }` — czyni z pancerza tarczę |
| `size?` | ⚠ **etykieta bez żadnego efektu**. Jedyne przyjęte future-proofing, właśnie dlatego, że etykiety nie da się po cichu przestroić |

⚠ **Tarcza nie jest osobnym systemem — to pancerz, który dodatkowo blokuje.**
Dzięki temu za darmo działają: `slotForItem`, `accepts`, `instanceDefense`,
jakość, sklep, tooltip, przeciąganie na lalkę i `defenseAgainst`.

### 2.5 Pierścienie i przedmioty z `bonus`

`bonus: { maxHp?, critChance?, attackSpeed?, defense? }` — **statystyki
pochodne, nigdy atrybuty.**

⚠ Pierścień dający „+2 Siły" jest odrzucony i to nie jest kwestia gustu:
`requires` sprawdza się **tylko przy zakładaniu**, więc taki pierścień
przeniósłby gracza ponad bramkę młota, po czym dałoby się go zdjąć. Bez respecu
każde wyjście z tej sytuacji jest złe. Wrócić do tematu wyłącznie razem z
przeglądem „zweryfikuj ponownie założony sprzęt".

⚠ Bonusy wchodzą **do środka istniejących capów**, nie ponad nie:
`attackSpeedBonus = min(Zręczność × per + sprzęt, maxAttackSpeedBonus)`.

---

## 3. Ścieżka ofensywna: od przedmiotu do obrażeń

```
ITEMS[id]  +  ItemInstance{quality, durability}
   │
   ├─ Quality.instanceDamage      → zakres broni × jakość × stan   (bez zaokrąglania)
   ├─ Equipment.weaponMelee       → kształt bazowy (łuk/zasięg/odrzut/przerywanie)
   └─ Equipment.weaponAttacks[activeAttack] → wariant
   │
   ▼  Progression — JEDYNE miejsce, gdzie stosuje się wariant
   attackArcDeg = arcDeg × arcMul          attackReach = reach × reachMul
   knockback    = knockback × min(1,…)     interrupts  = broń && wariant !== false
   swingMul     = wariant.swingMul × Equipment.offhandSwingMul
   attackCooldown, swingDurationMs = baza × swingMul ÷ (1 + attackSpeedBonus)
   meleeDamageMin/Max = baza(jakość) × damageMul × (1 + SIŁ×strScale + ZRĘ×dexScale)
   root         = zamach×hitFraction + (zamach×(1−hitFraction) + 40) × (1 − redukcjaZRĘ)
   │
   ▼  NACIŚNIĘCIE — pendingSwing zamraża cel, kierunek i CAŁY profil ciosu
   cooldown · poza · root · rzut na trwałość · dźwięk zamachu
   │
   ▼  50% czasu zamachu (PLAYER.swingHitFraction) — rozstrzygnięcie
   świeży test zasięgu, BEZ zejścia do łuku
   │
   ├─ rzut FloatBetween(meleeDamageMin, meleeDamageMax)
   │     min/max = obr.broni(jakość) × damageMul × (1 + SIŁ×strScale + ZRĘ×dexScale)
   ├─ rzut na krytyka (per cel)
   ├─ Protection.armorPointsAgainst(pkt wroga, materiał, typ) → reductionFromPoints → mitigate
   └─ Protection.effectiveness(...) → kolor + glif przy liczbie
```

Cztery rzeczy, które łatwo przeoczyć:

- **Cios rozstrzyga się w DWÓCH momentach**, nie w jednym. Naciśnięcie
  zobowiązuje, trafienie następuje w połowie zamachu. Przecelowanie w trakcie
  przesuwa **następny** cios.
- **Zaokrąglenie jest jedno, na końcu.** `instanceDamage`/`instanceDefense`
  celowo nie zaokrąglają — na małych liczbach dwa sąsiednie poziomy jakości
  zlewały się w tę samą wartość (zmierzone: Zwykły i Dobry kij pokazywały oba
  „6-9").
- **Root wynika ze `swingDurationMs`**, więc szybszy wariant kosztuje krócej,
  bez ani jednego dodatkowego pola.
- **Trwałość zużywa się raz na ZAMACH**, nigdy raz na trafionego wroga —
  inaczej siekiera trafiająca pięciu zużywałaby się pięć razy szybciej niż młot
  na tej samej grupie.

---

## 4. Ścieżka defensywna: od ciosu wroga do HP

```
jeden z 4 kanałów wroga
   (kontakt · szarża dzika · ugryzienie Szarego · pocisk)
   │  każdy podaje amount, damageType|null, from|null
   ▼
Player.takeDamage(amount, damageType, from)
   │
   ├─ dead / i-frames?  → 0
   ├─ afterArmor = 1 − Equipment.reductionAgainst(typ)
   │      Σ instanceDefense(sztuka) × ARMOR_PROFILE[materiał][typ]  →  d/(d+50), cap 75%
   ├─ zone      = Protection.guardZone(guardDir, from)      ⚠ TRZY STREFY (2026-09-05)
   │      κ <  60° → "front" → blocked = reduction              (sektor 120°)
   │      κ < 100° → "side"  → blocked = reduction × blockSideMul (pas 2 × 40°)
   │      dalej    → "back"  → blocked = 0.          NEUTRALNE wobec typu
   │      ⇒ 200° łącznego sektora, w którym tarcza w ogóle reaguje
   ├─ blocked   = z tabelki wyżej — rozstrzyga `core/DamageResolver.ts`
   │      ⚠ `blockSideMul` wchodzi PRZEZ `DamageContext` (wołający podaje
   │        `SHIELD.sideZoneMul`), nigdy importem `SHIELD` do resolvera
   │      ⚠ `DamageResult` zwraca `zone` — wołający CZYTA werdykt zamiast
   │        odtwarzać redukcję z `outcome`
   └─ mitigated = max(1, round(amount × afterArmor × (1 − blocked)))
```

- ⚠ **`damageType` i `from` są parametrami WYMAGANYMI**, `null` znaczy
  „świadomie bez typu / świadomie bez kierunku". To jest lekcja odrobiona na
  własnej skórze: przez dwie wersje `damageType` był opcjonalny i **każdy**
  wywołujący go pomijał, więc kolumna `metal` w `ARMOR_PROFILE` nie robiła nic i
  nic w kodzie tego nie mówiło. Parametr opcjonalny sprawia, że „zdecydowaliśmy,
  że tego nie ma" i „ktoś zapomniał" wyglądają w źródle identycznie.
- ⚠ **Kolejność pancerz → tarcza jest numerycznie obojętna** (mnożenie ułamków),
  wybrana dla czytelności. Ale **jedno zaokrąglenie na końcu już obojętne nie
  jest** — ciosy mają 1–22 punkty, więc podwójne zaokrąglenie zjadłoby cały
  efekt tarczy na małych ciosach.
- ⚠ **`Math.max(1, …)`** — cios nigdy nie schodzi do zera. Bez tego jeden
  przedmiot czyniłby część rosteru całkowicie nieszkodliwą.
- ⚠ **Jad omija tę ścieżkę w całości** (`takeVenomTick`): bez pancerza, bez
  typu, bez dźwięku, bez trzęsienia kamerą, i **i-frames go nie zatrzymują**.
  Trucizna jest już w środku.

---

## 5. Niezmienniki — czego nowy przedmiot nie może złamać

Każdy z powodem. To jest właściwa lista kontrolna przy projektowaniu, nie
tabela liczb.

**N-1. Musi istnieć pełna ścieżka bez wymagań.** Sztylet, kij i **cały komplet
skóry oraz przeszywanica** nie mają `requires` i mieć nie mogą. Respecu nie ma,
więc build czysto Zręcznościowy albo Kondycyjny musi zawsze mieć broń i pełny
pancerz. Bramka, której gracz nigdy nie przejdzie, to nie balans — to koniec gry.

**N-2. Bramkuje wyłącznie Siła, wyłącznie na sprzęcie ciężkim.** Bramkowanie
Kondycją albo Zręcznością zamieniłoby błędną inwestycję w martwą postać.

**N-3. Jakość nigdy nie rusza `melee` ani `attacks`.** Wykonanie zmienia, jak
dobrze rzecz jest zrobiona, nigdy czym jest. Mistrzowski młot to nadal młot z
łukiem 45°.

**N-4. Wariant tylko zawęża** (§2.3). Wymuszone w typach, nie w dyscyplinie.

**N-5. Rozpiętość wariantów jednej broni musi być węższa niż odległość do
sąsiedniej kategorii.** Pierwsza wersja pchnięcia miecza miała `arcMul` 0,6,
czyli **węziej niż sztylet** — miecz zjadałby wtedy kategorię sztyletu. Stąd
0,7. ⚠ Przy broni stojącej na krańcu skali warianty muszą być skierowane
**do środka**.

**N-6. `swingMul` zawsze w oba pola naraz** (§2.3).

**N-7. Nowy materiał musi mieć kogoś, kogo BIJE.** `ARMOR_PROFILE` ma dziś
domkniętą tylko połowę trójkąta: `pierce` jest najlepszą odpowiedzią na dwa
materiały, `blunt` na jeden, `slash` na żaden. Dokładanie materiału, przeciw
któremu najlepsze jest znów kłute, pogłębia problem zamiast go rozwiązywać.

**N-8. `armorType` to MATERIAŁ, nie klasa abstrakcyjna.** Pająkowi nie wolno
wpisać `metal` dlatego, że chityna jest twarda — zmieszałoby to kategorię
mechaniczną z materiałem i trzeba by to potem odkręcać.

**N-9. Żadnej penetracji pancerza.** Broń omijająca materiał zamienia
`ARMOR_PROFILE` w kłamstwo. Jeśli coś ma być dobre przeciw pancerzowi, robi to
**typem obrażeń swojego wariantu**.

**N-10. Bonusy wchodzą do środka capów** (§2.5). `maxAttackSpeedBonus` to nie
tylko balans — `swingDurationMs` skaluje się tą samą liczbą, więc przebicie capu
rwie animację.

**N-11. Przedmiot, za który gracz zapłacił, nie znika.** Broń zniszczona działa
na `destroyedMultiplier`, nie kasuje się. Nagroda nie wpada do pełnego plecaka —
`Inventory.hasRoomFor` sprawdza się **przed** czymkolwiek innym.

**N-12. Sprawdź WSZYSTKIE koszty, zanim pobierzesz KTÓRYKOLWIEK.** `equip()`
sprawdza `requires` przed `removeItem`; `Skills.learn` obie waluty przed
pobraniem jednej. To samo obowiązuje każdą nową operację na ekwipunku.

**N-13. Nowy slot dopiero wtedy, gdy istnieje przedmiot, który go wypełni.**
Lalka rysuje 12 komórek, z których 8 działa — cztery pozostałe **nie są w modelu
danych**, bo slot, którego nic nie wypełni, i tak byłby iterowany przez
`sumBonus`, zapisywany w każdym zapisie i odpytywany przez `accepts`.

**N-14. Nowe pole opcjonalne w zapisie = bez podbicia `SAVE_VERSION`.**
Tą drogą weszły `quickSlot`, oba pierścienie i `offhand`. Podbicie kasuje
wszystkie postacie — to cena, której nie płaci się za nowy slot.

**N-15. Mechanika nie może wymagać nowej grafiki.** Jest **jedna klatka ataku na
kierunek**; para `sweepMul`/`thrustMul` to jedyny sposób odróżnienia cięcia od
pchnięcia na ekranie. Pomysł wymagający animacji jest pomysłem zablokowanym na
grafiku pikselowym.

---

## 6. Checklisty

### 6.1 Nowa broń

1. Nisza — sprawdź `ekwipunek_przedmioty.md` §4.2 (dystans × typ). Jeśli
   wchodzisz w zajętą komórkę, powiedz wprost, czym się różnisz.
2. `melee`: łuk, zasięg, odrzut, `interrupts`. ⚠ Przerywanie jest dziś
   **wyłączną tożsamością młota** — dając je drugiej broni, odbierasz mu powód
   istnienia.
3. `attacks`: 1–3 warianty. **Wariant ma wynikać z PRZEDMIOTU, nie z życzenia**
   (siekiera ma obuch, bo ma głowicę; młot nie ma, bo drugi koniec to trzonek).
4. Tempo: `attackCooldown` + `swingDurationMs`. Root policz z
   `Progression.rootDurationMs` (**nie** `swing + 40` — od 2026-08-20 odzyskanie
   skraca Zręczność), a najprościej: `node tools/macierz_walki.mjs`.
   ⚠ **Sprawdź przeciw telegrafom przeciwników** — młot ma przy Zręczności 0
   **33 ms** marginesu wobec skoczka jadowitego. Dłuższy root kasuje jego
   counterplay. Zręczność ten margines tylko powiększa, nigdy nie zmniejsza.
5. `strScale` / `dexScale` — **wymagane na każdej broni.** Mówią, który build ta
   broń nagradza; nie ma wartości domyślnej, bo „zapomniana" oznaczałaby broń
   niereagującą na rozwój postaci. ⚠ Po każdej zmianie: `node
   tools/atrybuty_kalibracja.mjs` (pilnuje m.in. tego, żeby droższa broń nie
   stała się słabsza od tańszej). Patrz komentarz nad `ATTRIBUTES`.
6. `requires` — tylko Siła, tylko jeśli broń jest ciężka (N-1, N-2).
7. Cena wobec drabinki. Sprzedaż = 40% zakupu.
8. `durability`.
9. Przepuść `node tools/katalog_ekwipunku.mjs` i przeczytaj DPS oraz root/cykl
   **w kontekście całej tabeli**, nie w oderwaniu.

### 6.2 Nowa sztuka pancerza

1. Nisza — `ekwipunek_przedmioty.md` §4.1 (slot × materiał).
2. `slot` + `armorType` + `defense`.
3. `requires` — ⚠ **skóra i przeszywanica nigdy** (N-1).
4. Cena. Sprawdź komplet, do którego należy: przez krzywą malejących przyrostów
   ostatnia sztuka kupuje **mniej** niż pierwsza.
5. Generator → sprawdź wiersz kompletu, nie samą sztukę.

### 6.3 Nowa tarcza / przedmiot do drugiej ręki

1. `type: "armor"`, `slot: "offhand"` — to wszystko, czego trzeba, żeby działał
   cały istniejący aparat.
2. `block: { reduction, swingMul }`, jeśli blokuje. Kąt **nie** należy do
   przedmiotu — jest jedną stałą `SHIELD.blockArcDeg`, żeby przyszłe „Raise
   Shield" było zmianą tej stałej, a nie przebudową każdej tarczy.
3. ⚠ Wycena wg twierdzenia o konwersji: **X% redukcji jest warte X% więcej
   DPS-u**. Tarcza okuta kosztuje 220 g, a nie 140, właśnie z tego rachunku.
4. ⚠ Feedback jest **wymaganiem, nie ozdobą** — gra nie pokazuje liczby
   otrzymanych obrażeń, więc cicha redukcja jest niewidzialna. Blok gra własny
   dźwięk i własny tint **zamiast** zwykłego trafienia, nigdy obok.
5. ⚠ **Każdy dobry przedmiot do drugiej ręki to ciche osłabienie broni
   dwuręcznej** (`bron_dwureczna_analiza.md` §F.5). Cena `hands: 2` jest
   wyrażona w slocie, którego wartość podnosisz właśnie teraz — a broń
   dwuręczna nie dostaje w zamian nic. To wymaga świadomego pilnowania przy
   **każdym** takim przedmiocie, nie jednorazowej poprawki.
6. Sprawdź nowy przedmiot **z bronią dwuręczną w ręku**: `accepts` musi go
   odmówić, a komunikat odmowy ma nazwać powód i podpowiedzieć wyjście.

### 6.4 Nowy typ obrażeń albo materiał

Nie zaczynaj od kodu. Przeczytaj `docs/typy_obrazen.md` i sprawdź N-7, N-8, N-9.
Materiał to jedna linijka w `ARMOR_PROFILE` i **cztery** decyzje, na kogo działa.

---

## 7. Czego świadomie NIE MA

Żeby nie wracało jako „przecież w innych grach…". Pełne uzasadnienia są w
analizach z §8; tutaj sam werdykt.

| pomysł | dlaczego nie |
|---|---|
| **Penetracja pancerza** | N-9 — unieważnia `ARMOR_PROFILE` |
| **Blok jako rzut kością** | gracz przyjmuje 1–4 ciosy w walce; 30% szansy na dwóch próbach to nie „30% redukcji", to rzut monetą raz na walkę |
| **Tarcza reagująca na typ obrażeń** | pancerz odpowiada „co mnie trafiło", tarcza „czy nadstawiłem". 4 z 9 kanałów wroga jest **nieotypowanych** — neutralna tarcza jako jedyna działa w tej dziurze |
| **Trwałość pancerza** | nie ma naturalnej akcji, która by go zużywała; zużycie od otrzymanych ciosów karze za przegrywanie |
| **Atrybuty na przedmiotach** | §2.5 — bramka sprawdzana tylko przy zakładaniu |
| **`weight` / obciążenie** | dotyka prędkości gracza, wokół której wystrojone są wszystkie zasięgi agro i ucieczki |
| **Stamina** | druga ekonomia do nauczenia na ekranie, na którym już jest joystick, atak i quick slot — ten sam argument wykluczył manę |
| **Statystyka tylko dla jednej kategorii** | N-13 zastosowane do statystyk: pole puste u większości przedmiotów i tak jest iterowane, zapisywane i po cichu obiecuje mechanikę |
| **Dual-wield** | to **nie** off-hand: drugi rzut obrażeń, druga trwałość, drugi typ i drugi wariant |
| **Sloty na worki (4 komórki pod lalką)** | `INVENTORY.slots` to stała 16; działający worek to typ przedmiotu + zmienny rozmiar plecaka + zapis, który przeżyje zdjęcie pełnego worka |

---

## 8. Gdzie szukać POWODÓW

Ten plik trzyma reguły. **Uzasadnienia, odrzucone warianty i pomiary** są tam:

| dokument | o czym |
|---|---|
| `warianty_atakow.md` | dlaczego wariant, a nie druga broń; reguła zawężania; reguła tożsamości; plan halabardy |
| `typy_obrazen.md` | dlaczego trzy typy; dlaczego mnożnik na punkty, a nie na wynik; cztery kanały wroga |
| `tarcze_analiza.md` | blok kierunkowy; twierdzenie o konwersji (§9.1); dlaczego bez kości; cztery miejsca, gdzie tarcza przegrywa |
| `bron_dwureczna_analiza.md` | model `hands`; oś czas/przestrzeń; sufit rootu; parry jako tarcza 2H |
| `jakosc_wykonania.md` + `_ocena.md` | siedem poziomów; dlaczego 5–7 w rezerwie; trwałość i naprawa |
| `feedback_obrony_analiza.md` | dlaczego sama liczba nie potrafi nauczyć typów (pomiar: 35% błędnych wniosków przy 5 zamachach) |
| `odlozone.md` | co jest zaparkowane, z powodem i warunkiem powrotu — **czytać przed proponowaniem czegokolwiek** |
| `CLAUDE.md` | stan kodu i checklist wdrożeń |

⚠ **Zaparkowane, a dotyczy wprost przedmiotów:** płaska Siła (rework na `+%`
przestroi całą drabinkę broni — nie stroić drobiazgowo przed nią), anomalia
`metal.blunt`, osobna krzywa cen dla pancerza, trzeci materiał ochrony,
liczby otrzymanych obrażeń.

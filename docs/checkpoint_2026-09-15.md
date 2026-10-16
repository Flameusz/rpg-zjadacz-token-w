---
typ: HISTORIA
domena: [shields, items, armor, save, stamina]
tytul: Checkpoint 2026-09-15 — pełny punkt wznowienia (warstwy · zestawy · materiały)
stan: zamkniety
otwarte: [P1, B3, T-1, T-4, OI-24, OI-94, OI-103, OI-143]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT 2026-09-15 — punkt wznowienia

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. W swoim zakresie (model C, żelazo/stal, audyt obciążenia) wolno z niego brać pomiary i powody.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **[2026-09-15] Od tego pliku się zaczynało.** Ma wystarczyć do wznowienia pracy **na innym
> komputerze**, bez odtwarzania kontekstu z historii rozmów. Zastępuje
> `docs/ekwipunek_checkpoint.md` i `docs/konfiguracje_broni_checkpoint.md` jako
> ówczesny punkt wejścia.
>
> ⛔⛔ **WSZYSTKO OZNACZONE JAKO ZAMROŻONE JEST ZAMROŻONE.** Nie otwieraj tego
> jako pytania. Ponowne otwarcie wymaga **konkretnego powodu z runtime albo
> nowego dowodu z audytu** — nie „warto by sprawdzić". Ta reguła istnieje, bo
> projekt stracił już czas na trzykrotne wracanie do tych samych rozstrzygnięć.

## 0. Wznowienie w 60 sekund

1. `git log --oneline -5` i `git status` — stan repo, nie pamięć.
2. Przeczytaj §1 (podział pracy) i §15 (co dalej).
3. Bramki: `npx tsc --noEmit` · `npm run build` · przymiary z §4.
4. **Pierwsza rzecz do zrobienia: `P1` — realny playtest** (§6). Nie kod.

---

## 1. Jak pracujemy

| rola | kto |
|---|---|
| analiza, audyt, review, projektowanie, **decyzje** | ChatGPT / Codex |
| implementacja **zaakceptowanych** zmian w repo | Claude Code |

⚠ **Najpierw decyzja, potem implementacja.** ⛔ Nie wdrażaj zmiany tylko
dlatego, że audyt pokazał ciekawą obserwację. Obserwacja → decyzja autora →
dopiero kod.

---

## 2. Stan git

**Ostatni commit sprzed tej sesji:** `8384cfb` *(docs: CHECKPOINT 2026-09-15 —
punkt wejscia do nastepnej sesji)*.

**Wcześniejsze commity tego dnia (kontekst):**

| commit | rola |
|---|---|
| `8d64252` | **model C warstwowania** — adres slotu niesie warstwę (18 adresów) |
| `79664f1` | DECYZJA: zapis warstw — płaska kotwica + opcjonalna `layers?` |
| `ac7215c` | DECYZJA: skala PP i cap ZAMROŻONE |
| `c8a373c` · `c824a9a` | instrument `P1` + metodologia (mianownik = ciosy klasyfikowalne) |
| `5baac34` · `5f9595a` · `0ece19e` | `§N` straż · `S10` wdrożone · werdykt `T-4` |

**Ta sesja:** warstwy jako decyzja, zestawy `(set, area)`, oś materiału
żelazo/stal, dwa nowe przymiary, przeliczony audyt obciążenia.

**Commit tej sesji:** `cab5bb4` *(feat(armor): gatunek materialu (zelazo/stal) +
zestawy po OBSZARACH; checkpoint sesji)* — 23 pliki, +2176 / −348.
Working tree po nim: **czysty**.

### ⚠⚠ REPO NIE JEST WYPCHNIĘTE

**Gałąź:** `main`. **Remote:** `origin` → `github.com/JarekTylerM/rpg-mobile-2026`.

```
origin/main  =  79664f1   (15.09, 14:24 — „zapis warstw pancerza")
HEAD         =  cab5bb4
```

⛔ **Dziewięć commitów poniżej plus ten, który dopisał tę sekcję, istnieją
WYŁĄCZNIE LOKALNIE** (źródłem prawdy jest `git log origin/main..HEAD`) — cały model C
warstwowania, decyzja o PP/capie, instrument i metodologia `P1`, `S10`, werdykt
`T-4`, poprzedni checkpoint oraz cała ta sesja:

```
cab5bb4  gatunek materialu + zestawy po obszarach + checkpoint
8384cfb  CHECKPOINT (poprzednia wersja)
0ece19e  T-4 OPEN + S10 w shields.md
5f9595a  S10 — zuzycie tarczy po trafieniu
5baac34  §N — straz nad zamknietymi decyzjami
c824a9a  metodologia P1
c8a373c  przymiar instrumentu P1
ac7215c  DECYZJA: skala PP i cap zamrozone
8d64252  model C — adres slotu niesie warstwe
```

⚠ **Na innym komputerze tej pracy NIE BĘDZIE, dopóki nie zrobisz `git push`.**
To jest pierwsza rzecz do wykonania przed przesiadką.

---

## 3. Mapa: gdzie czego szukać

| temat | plik |
|---|---|
| mechanika pancerza, materiały, profile | `docs/systemy/armor.md` |
| przedmioty, pola `layer`/`material`/`set` | `docs/systemy/items.md` |
| tarcze, `guardZone`, blok | `docs/systemy/shields.md` |
| obciążenie i stamina | `docs/systemy/stamina.md` |
| **lista otwartych spraw `OI`** | `docs/zadania.md` |
| decyzje (niezmienne) | `docs/decyzje/` |
| narracja sesji | `docs/dziennik.md` |
| katalog liczb (GENEROWANY) | `docs/ekwipunek_przedmioty.md` |

---

## 4. Bramki — stan na koniec sesji

| bramka | wynik |
|---|---|
| `npx tsc --noEmit` | ✅ czysty |
| `npm run build` | ✅ przechodzi (~8 s; ⚠ znane ostrzeżenie o rozmiarze chunku) |
| `node tools/combat_regresja.mjs` | ✅ **121/121, zero różnic** |
| `node tools/tarcze_przymiar.mjs` | ✅ **129 zamków** |
| `node tools/warstwy_przymiar.mjs` | ✅ **40 zamków** |
| `node tools/zestawy_przymiar.mjs` | ✅ **39 zamków** (nowy) |
| `node tools/materialy_przymiar.mjs` | ✅ **58 zamków** (nowy) |
| `node tools/p1_instrument.mjs` | ✅ **35 zamków** |
| `node tools/ekwipunek_uklad.mjs` · `ui_panele_weryfikacja.mjs` | ✅ |
| `node tools/katalog_ekwipunku.mjs` | ✅ 0 bloków do odświeżenia |
| `node tools/doc_check.mjs` | ✅ **ZERO błędów** |

⭐ `doc_check` zszedł do zera — znany błąd sprzed sesji (`ekwipunek_przedmioty.md`,
11 bloków) zniknął, bo generator katalogu został nauczony osi materiału
i przepuszczony z `--zapisz`.

---

## 5. TARCZE — stan

**Sześć konstrukcji:** Puklerz · Okrągła · Rycerska · Migdałowa · Legionowa ·
Pawęż. Model: `Construction → Material → Quality → Variant`.

| oś | co posiada |
|---|---|
| **Construction** | geometria · `swingMul` · profil bash · rola konstrukcji |
| **Material** | trwałość · cena · masa · PP/redukcja **jako efekt wtórny** |
| **Quality** | jakość wykonania — istniejące `ItemInstance.quality` i `QUALITY.modifiers`. ⛔ **Nie budować drugiego systemu jakości** |
| **Variant** | grubość/solidność — **jeszcze nie zaimplementowany** |

### ⛔ ZAMROŻONE

- `sideMul = 0,50` globalnie · `fullArcDeg ≤ 90°`
- `fullArcDeg` związany z `FRONT_ARC_DEG` / bramką powrotu ataku
- `sideArcDeg` należy do **Construction**
- ⛔ **Variant NIGDY nie zmienia `fullArcDeg` ani `sideArcDeg`**
- `guardZone`: **`full ⊆ side ⊆ blockable`**
- Parry zostaje `isFrontal` — **niezależne** od geometrii tarczy
- Kierunek gardy: w ataku `attackDir`, poza atakiem `moveDir`, ⛔ **zero
  auto-rotacji do celu**
- Blok jest **deterministyczny**; ⛔ `blockChance` nie istnieje

### ⛔ Trzy nierówności nietykalne

```
reduction(Migdałowa) < reduction(Rycerska)
reduction(Pawęż)     < reduction(Rycerska)
swingMul(Pawęż)      = wartość skrajna
```

⛔ **PP nie może być głównym nośnikiem tożsamości konstrukcji.**

### `S10` — wdrożone

Bash w powietrze **nie zużywa nic**; bash celny zużywa tarczę istniejącym
`Equipment.wearShield()`, jako piąty wariant `ActionOnHit`
(`{ kind: "wearShield" }`) pod `anyHit` — czyli **po faktycznym trafieniu**, nie
przy rozpoczęciu zamachu. ⛔ Osobnego `bashWear` nie ma i nie tworzymy.

### `T-4` — OTWARTE

⛔ **Brakuje MIEJSCA, nie pola.** Profil bashu nie ma jednego czytelnika:

| pole | gdzie dziś mieszka |
|---|---|
| `stunMs` · `windupMs` | statyczne `PLAYER_ACTIONS` |
| `damageMultiplier` | `AbilitySpec` |
| `knockbackPx` | `shieldStrike()` (= 0 świadomie) |
| `recoveryMs` · `cooldown` · `staminaCost` | osobne ścieżki |

⚠ **`swingMul` jest realnym kosztem ofensywnym autoataków tarczy, ale NIE
przechodzi do bashu.** ⛔ Nie twórz nowego parametru bez decyzji: **które pola**
należą do konstrukcji · **override czy mnożnik** · **który właściciel** staje się
świadomy sprzętu · co zostaje globalne.

---

## 6. `P1` — realny playtest (PIERWSZE ZADANIE)

⛔ **Metodologia ZAMROŻONA — zarejestrowana przed pomiarem.**

- **`n` = wyłącznie ciosy sklasyfikowane** jako FRONT / BOK / TYŁ.
- `dodge` i `immune` zostają w surowej próbce, ale ⛔ **nie wchodzą** do
  mianownika, histogramu, rozkładu skumulowanego, mediany ani tabeli sześciu
  progów. Zostają, żeby dało się przeliczyć inną regułą bez powtarzania gry.
- `dev.guard.start()` = **nowa próbka** · `dev.guard.wznow()` = **jawne**
  wznowienie po F5/crashu · ⛔ **zero automatycznego scalania**.
- Próbka: **min. 100**, preferowane **150–200** klasyfikowalnych ciosów.
- **Min. 3 zachowania:** szarża dzika od frontu · wilki krążące/oskrzydlające ·
  przeciwnik dystansowy (sieciarz, bez kontaktu).

⚠⚠ **NIE używać `DamageResult.zone` jako źródła prawdy dla `P1`** —
`DamageResolver.ts:131` i `:134` zwracają `zone: "back"` **na sztywno** dla
`immune` i `dodge`, więc uniki zawyżałyby udział TYŁU. (Ostrzeżenie stoi też
w nagłówku `src/core/GuardStats.ts`.)

**Interpretacja — udział ciosów `≥ 90°`:** `< 10%` → **NIE** · `10–25%` →
**POŁOWICZNIE** · `> 25%` → **TAK**.

⛔ **`P1` nie ustala `sideArcDeg`** — jest bramką. Dalej: `P1 → B3 → T-1`.

**Uruchomienie:** `npm run dev` → `dev.guard.start()` → graj → po F5
`dev.guard.wznow()` → `dev.guard.raport()`.

---

## 7. Pasywne PP tarczy — zamrożona semantyka

Tarcza daje **niewielkie pasywne PP nawet wtedy, gdy blok kierunkowy nie
zadziała** (masa na ramieniu):

```
poza guard zone :  PP pancerza + PP pasywne tarczy
side            :  PP pasywne + OSŁABIONA redukcja bloku
full            :  PP pasywne + PEŁNA redukcja bloku
```

Pasywne PP idzie **zwykłym kanałem pancerza**. Runtime już to realizuje.

---

## 8. Trwałość tarcz

`buckler` = **50**, `ironbound_shield` = **90**. `condition` jest **odrębne od
`quality`**; `Equipment.blockSpec` uwzględnia `conditionMul`. Jeden zablokowany
cios może wywołać istniejący rzut zużycia. ⛔ **Pancerz trwałości NIE MA** i nie
dodajemy jej teraz — to osobny projekt (30 sztuk).

---

## 9. WARSTWOWANIE — model C (wdrożony `8d64252`)

**12 adresów warstwowych:** `head_L1/L2/L3` · `chest_L1/L2/L3` ·
`legs_L1/L2/L3` · `boots_L1/L2/L3`. **Bez zmian:** `weapon`, `offhand`,
`gloves`, `amulet`, `ring1`, `ring2`, `stowed`. Razem **`EQUIP_SLOTS` = 18**.

**Zapis:** `SAVE_VERSION = 3` (nietknięty) · opcjonalne `layers?` · jeśli
`layers[obszar]` istnieje → **jest źródłem prawdy**; jeśli nie → płaskie pole
idzie przez `itemLayer()`. **Downgrade do starego builda bywa stratny i jest to
zaakceptowane.**

**Kotwica:** najbardziej **ZEWNĘTRZNA** warstwa, `L3 → L2 → L1`.
⛔ **Nie „najwyższe PP".** Mapa jest **nazwana**, nie tablicowa — inaczej `L1+L3`
bez `L2` byłoby nieodróżnialne po kolejności.

**UI:** ⛔ nie ma 12 kafli — jest **jeden kafel na obszar z trzema kropkami
warstw**; kropka = warstwa ZAJĘTA (mogą świecić trzy naraz).

**Warstwy są arytmetycznie RÓWNOWAŻNE** (decyzja tej sesji): PP nie zależy od
pozycji w stosie, suma zwykła. ⛔ Zero mnożników pozycyjnych, zero „premii L1
pod L3", zero mechaniki warstw w `Protection.ts`. Różnica między warstwami
pochodzi z **katalogu** (co się mieści, PP, masa, wymagania, cena) i docelowo
z modelu obciążenia.

### Zestawy: reguła `(set, area)` — ✅ ZAMKNIĘTE tej sesji

**Jeden obszar ciała wnosi do zestawu najwyżej JEDEN element.** Trzy warstwy
torsu = jedno miejsce; `ring1`/`ring2` zostają dwoma. `setSize` to liczba
możliwych **MIEJSC**, nie członków. ⛔ Liczenie **nie czyta `layer`** (`D4`).
⚠ Na dzisiejszym katalogu reguła jest **zerowa** — weszła bez zmiany balansu.
⛔ Poprzednie brzmienie („próg 4 elementów liczy trzy warstwy jako trzy
przedmioty") **jest już nieaktualne**.

---

## 10. Skala PP i cap — ⛔ ZAMROŻONE

```
reduction = defense / (defense + 50)      cap 0,75
```

- **Q1–Q4** to realnie dostępne jakości; ⛔ **Q5–Q7 poza bieżącym balansem**.
- **~30 PP** = górny zakres **POJEDYNCZEJ** warstwy; przyszłe masterwork ~35 PP.
- ⛔ Nie ruszać: `defenseK = 50` · krzywej · capu · tabeli jakości ·
  `loadMultiplier` · `EQUIPMENT_LOAD`.

---

## 11. MATERIAŁ — nowa oś (wdrożona tej sesji)

`armorType` = **profil** interakcji z obrażeniami · `material` = **gatunek**
i progresja. Osie są prostopadłe: **żelazo jest jednocześnie drutem (`mail`)
i blachą (`metal`)**.

| gatunek | `defenseMul` | `priceMul` | masa |
|---|---|---|---|
| **steel** — cały dotychczasowy katalog | 1,00 | 1,00 | — |
| **iron** — nowy szczebel poniżej | **0,80** | **0,60** | **bez zmian** |

**Siedem nowych `ItemId`:** `iron_helmet` · `iron_coif` · `iron_chest` ·
`iron_hauberk` · `iron_legs` · `iron_chausses` · `iron_boots`. Wszystkie
**na półce Radzima**. ⛔ Bez tagu `set`, bez żelaznych rękawic (korytarz pusty:
5/6 = 0,833 > sufit 0,810), tarcze poza tym przebiegiem.

⚠ Żelazna sztuka deklaruje **liczby konstrukcji bliźniaka 1:1** — różnicę robią
mnożniki. ⛔ Nie „poprawiaj" żelaza edycją jego surowych liczb.
⛔ **Gatunek nigdy nie będzie wierszem `ARMOR_PROFILE`** — `N-7` nietknięte.

---

## 12. Audyt obciążenia po żelazie (prawdziwe `Equipment`/`Progression`)

Założenia: DEX 10 · pula staminy 120 · unik 15 · sprint 10/s.

| konfiguracja | STR | masa | udźwig | ratio | klasa | mult | PP | red. | dodge | eHP |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 ×4 + miecz | 3 | 10,5 | 27,5 | 0,38 | lekka | 1,00 | 33 | 39,8% | 10,4% | ×1,85 |
| **L1+L2 ×8 stal** | **15** | 30,5 | 57,5 | 0,53 | **lekka** | **1,00** | 79 | 61,2% | 10,4% | **×2,88** |
| kolczuga stal + puklerz | 15 | 25,5 | 57,5 | 0,44 | lekka | 1,00 | 55 | 52,4% | 10,4% | ×2,34 |
| stal L3 + tarcza | 20 | 34,0 | 70,0 | 0,49 | lekka | 1,00 | 71 | 58,7% | 10,4% | ×2,70 |
| **PEŁNY stal + tarcza** | **20** | 62,0 | 70,0 | **0,89** | **średnia** | **1,25** | **150** | **75,0%** | 8,0% | **×4,35** |
| PEŁNY stal + tarcza | 10 | 62,0 | 45,0 | 1,38 | ciężka | 1,50 | 150 | 75,0% | 8,0% | ×4,35 |
| PEŁNY **żelazo** + tarcza | 10 | 62,0 | 45,0 | 1,38 | ciężka | 1,50 | 131 | 72,4% | 8,0% | ×3,93 |

⭐⭐ **Żelazo NIE ZMIENIŁO ANI JEDNEJ LICZBY OBCIĄŻENIA.** Dla porównywalnych
buildów identyczne są: masa, udźwig, ratio, klasa, mnożnik, koszt uniku, koszt
sprintu. Zmieniają się wyłącznie **PP, redukcja, eHP i cena**.
⛔ **Nie otwierać ponownie decyzji o masie materiału bez nowego dowodu.**

**Ekonomia kompletu** (z bronią i tarczą): L1+L2 stal 420 g → żelazo **359 g
(−15%)** · L3 stal 600 g → żelazo **504 g (−16%)** · pełny stal 910 g → żelazo
**753 g (−17%)**. ⚠ 40% zniżki na sztuce daje tylko ~16% na loadoucie, bo broń,
tarcza, przeszywanica i rękawice nie mają żelaznego odpowiednika.

### Trzy obserwacje do zapamiętania

- **A — CAP.** Pełny stalowy, legalny stos: **150 PP → dokładnie 75,0%**, zero
  zapasu. Żelazo: 131 PP → 72,4%. **Cap mocno spłaszcza różnicę materiału na
  szczycie stosu.** (To jest pierwszy pomiar capu na pełnym zestawie przez
  prawdziwe `Equipment` — czyli to, od czego `OI-24` kazał zacząć.)
- **B — STR 20.** Pełny stos: `62 / 70 = 0,89` → **wypada z klasy ciężkiej do
  średniej**. Próg `0,90` wypada przy **STR ≈ 19,6**.
- **C — L1+L2 przy STR 15.** 79 PP, 61,2% redukcji, eHP ×2,88, obciążenie
  ×1,00, dodge 10,4%. **Najsilniejszy dziś kompromis** między pełnym stosem
  a lekkim pancerzem — i powstaje z Siły, nie z rezygnacji z pancerza.

---

## 13. `W1` / `OI-103` — OTWARTE, bez `k`

Kierunek bez zmian: **ciągła dopłata powyżej progu, tymi samymi kanałami**
(koszt uniku i sprintu). ⛔ **`k` NIE jest wybrane** — `k = 0,6` z poprzedniej
propozycji **nie jest zatwierdzone**.

⏳ **Otwarte pytanie (nie rozstrzygać w checkpointcie):** czy próg `ratio 0,90`
ma zostać, skoro pełny stos przy STR 20 daje 0,89 i wychodzi spod dopłaty.

---

## 14. Otwarte prace — priorytet

### ① `P1` — realny playtest (§6)

⛔ **Bez ratunku post-hoc.** Jeżeli:
- **`P1` = NIE** → zatrzymać się **przed** `B3`, wrócić do `B2`, znaleźć inny
  nośnik tożsamości. ⛔ **Nie ratować tego przez PP.**
- **`P1` = POŁOWICZNIE** → ⛔ nie zakładać automatycznie wspólnego `sideArc`.
- **`P1` = TAK** → analiza rozkładu → progi → konkretny `sideArcDeg` per
  konstrukcja.

### ② Warstwy

Semantyka gameplayowa `L1/L2/L3` (⚠ arytmetycznie są równoważne — różnicę ma
nieść katalog i obciążenie) oraz **balans realnych stosów**.
⚠ `setProgressFor` jest **już zamknięte** (§9).

### ③ Materiały

Implementacja gotowa. ⛔ **Nie zmieniać mnożników bez nowego audytu i decyzji.**

### ④ `T-4` Bash

Otwarte (§5). ⛔ Nie implementować profilu bashu przed czterema
rozstrzygnięciami z tamtej sekcji.

### Otwarte `OI` (pełna lista: `docs/zadania.md`)

`OI-24` cap łącznej mitygacji · `OI-94` treść premii zestawów (zablokowana
przez `OI-143`) · `OI-100` łuska jako piąty profil · `OI-101`/`OI-103`
obciążenie · `OI-143` kumulacja trzech zestawów materiałowych.

---

## 15. ⛔ Czego NIE robić przy wznowieniu

- ⛔ **Nie zaczynać od ogólnego audytu całego systemu.**
- ⛔ Nie zmieniać bez powodu: krzywej pancerza · `defenseK = 50` · capu 75% ·
  systemu jakości · `loadMultiplier` · `EQUIPMENT_LOAD` · `sideMul` · parry ·
  kierunku gardy · deterministycznego bloku · modelu zapisu · mnożników
  materiału.
- ⛔ Nie wdrażać zmiany dlatego, że audyt wskazał ciekawą obserwację.
- ⛔ Nie zgłaszać jako nowych błędów rzeczy z §5, §9, §10 i §11 — są
  rozstrzygnięte.

### Znane, świadomie NIENAPRAWIONE (nie są regresją)

- **Kafel lalki ma adres zamrożony przy budowie panelu**
  (`setData("equipSlot")`), więc **przeciągnięcie** sztuki L1/L2 na kafel
  obszaru dostaje odmowę „To nie ten slot"; tapnięcie w plecaku działa
  poprawnie. Ta sama przyczyna powoduje ostrzeżenie w konsoli o adresach bez
  kafla. Naprawa = dynamiczne wyznaczanie adresu przy dropie; czeka na decyzję,
  czy kafel obszaru zostaje jeden.
- **Ikony żelaza reużywają kafla bliźniaka** z `tintIcon` (ciemniejszy odcień) —
  zgodnie z `N-15` (mechanika nie wymaga nowej grafiki).

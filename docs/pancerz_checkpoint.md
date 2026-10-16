---
typ: OPERACYJNE
domena: [armor, shields]
tytul: Checkpoint — ARMOR SYSTEM FREEZE (2026-09-18)
stan: zywy
otwarte: [OI-20, OI-21, OI-22, OI-100, OI-105, OI-120]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# CHECKPOINT — ARMOR SYSTEM FREEZE (2026-09-18)

> **Po co ten plik.** Punkt wejścia do wszystkiego, co dotyka pancerza i tarcz.
> **Wracając do tego wątku, zacznij od tego pliku — nie od ponownego audytu.**
>
> **Stan:** architektura zweryfikowana na uruchomionych modułach gry i
> **ZAMROŻONA**. Balans odroczony do playtestu. Decyzja zamykająca:
> `docs/decyzje/2026-09-18-zamkniecie-audytu-pancerza.md` (moc `ACTIVE`).
>
> ⛔ **Nie otwieraj audytu ponownie bez nowych danych** — z playtestu,
> telemetrii albo osobnej decyzji autora.

---

## VERIFIED

Wszystko niżej zostało sprawdzone **wykonaniem prawdziwych modułów `src/`**
(esbuild + Node), nie odczytem dokumentacji.

### Warstwy L1/L2/L3

| co | stan |
|---|---|
| trzy warstwy, cztery obszary warstwowane | ✅ `head` · `chest` · `legs` · `boots` |
| warstwa **wyprowadzana** z `armorType`, nie wybierana | ✅ `ArmorLayers.itemLayer` |
| `padded → L1` · `leather → L2` · `mail → L2` · `metal → L3` | ✅ jednoznacznie na całym katalogu |
| sloty **bez warstw** | ✅ `gloves` · `shoulders` · `offhand` |
| `EQUIP_SLOTS` | ✅ **19 adresów**, z tego **16 przyjmuje pancerz** |
| wszystkie 7 kombinacji legalnych, w tym `L1+L3` | ✅ |
| `accepts()` pilnuje **warstwy**, nie tylko obszaru | ✅ kirys odrzucony na `chest_L1` |

### Agregacja PP

| co | stan |
|---|---|
| suma **addytywna**, bez mnożników pozycyjnych | ✅ 28/28 konfiguracji zgodnych co do bitu |
| `Protection.ts` nie zna pojęcia warstwy | ✅ zero wystąpień |
| brak podwójnego liczenia / pominiętej warstwy / legacy fallbacku | ✅ |
| `bonus.defense` (biżuteria) — **poza** profilem materiału | ✅ |

### `ARMOR_PROFILE`

| co | stan |
|---|---|
| stosowany **PRZED** końcowym capem | ✅ |
| stosowany **PER SZTUKA**, nie po zsumowaniu | ✅ różnica do **8,38 pkt** vs naiwne uśrednienie |
| różnice typów przetrwają cap | ✅ na maksimum Q3 cięte i suma bez typu są cięte, kłute i obuchowe **nie** |

### Krzywa i cap

```
d / (d + 50)          EQUIPMENT.defenseK = 50
sufit 0,75            EQUIPMENT.maxDefenseReduction = 0,75
150 PP = 75%          K·c/(1−c)
```

⚠ **150 PP to nie limit punktów** — to punkt, od którego cap ogranicza
**końcową redukcję**. Punkty ponad to nadal pracują w kanałach typowanych.

**Osiągalność capu — zmierzona, nie oszacowana:**

| reżim | PP | redukcja | cap? |
|---|--:|--:|:--:|
| cały katalog Q3 | 181,0 | 0,750 | ✅ |
| cały katalog **Q1 (Podła)** | 153,85 | 0,750 | ✅ |
| **wyłącznie z półki sklepowej**, Q3 | 173,0 | 0,750 | ✅ |
| z półki, **bez tarczy**, Q3 | 154,0 | 0,750 | ✅ |
| z półki, Q1 | 147,05 | 0,746 | ❌ (o 3 pkt) |
| same warstwy (12 adresów), Q3 | 148,0 | 0,747 | ❌ (o 2 pkt) |
| bez żadnej bramki Siły | 75,0 | 0,600 | ❌ |

### Obciążenie (Model D)

`equippedWeight → loadCapacity → loadRatio → loadClass → loadMultiplier`

| co | stan |
|---|---|
| `loadClass` jest **etykietą HUD**, nie progiem kary | ✅ |
| `equippedWeight` liczy `EQUIP_SLOTS` **+ `STOW_SLOTS`** | ✅ `OI-96` |
| torby i plecak **nie ważą** | ✅ |
| Siła wykupuje **tylko** kanał wysiłku | ✅ `speed`/`regen` identyczne przy Sile 5 i 70 |
| ⚠ **czwarty konsument masy:** `Progression.dodgeChance` czyta `speedMultiplier` | ✅ premia uniku ×1,00 … ×1,30 |

**Koszt przekroczenia capu jest realny** (Siła 20):

| | 150 PP / 53,0 kg | 181 PP / 82,7 kg |
|---|--:|--:|
| wysiłek | 1,186 | **1,568** |
| ruch | 0,777 | **0,680** (podłoga) |
| wydolność | 0,699 | **0,579** |
| premia uniku | ×1,091 | **×1,000** |

### Tarcze

| co | stan |
|---|---|
| tarcza = `type: "armor"`, `slot: "offhand"` | ✅ wnosi PP **niezależnie od kierunku** |
| blok aktywny, kierunkowy, kosztuje staminę | ✅ `guardZone`, `block.*` |
| **tarcze mają trwałość** (30/30), pancerz nie (0/55) | ✅ |
| ⛔ **hipoteza „drewno dominuje żelazo" — OBALONA** | ✅ patrz niżej |

⚠⚠ Porównanie surowych PP drewna i żelaza było **błędem metodologicznym** —
drewno to profil `leather`, żelazo `metal`. Po profilu, przy tej samej
konstrukcji, **żelazo jest 2,3–2,5× skuteczniejsze przeciw kłutemu**, ma wyższy
`block.reduction` i 1,3–1,8× większą trwałość. ⛔ **Żadnej statystyki tarczy
nie zmieniono i nie ma powodu zmieniać.**

### Jakość i wymagania

| co | stan |
|---|---|
| 7 poziomów, domyślny **3**, sufit sklepu **4** | ✅ |
| jakość rusza PP, cenę i wymagania — **nie masę** | ✅ |
| przesunięcie wymagań tylko dla atrybutów już wymaganych | ✅ |
| `requires.strength` sprawdzane **per przedmiot**, nigdy sumowane | ✅ decyzja D1 |
| maksymalne wymaganie w katalogu | ✅ **STR 6** (`wood_pavise_heavy`) |
| cap osiągalny przy **STR 4–5** — bramką jest MASA, nie `requires` | ✅ |
| ⚠ `Save.load` omija bramkę `requires` (jedyne takie miejsce) | ✅ dziś nieosiągalne — Siła nie może spaść |

### Testy

| przymiar | wynik |
|---|---|
| `combat_regresja` | ✅ **121/121, zero różnic** |
| `warstwy_przymiar` | ✅ **0 zamków czerwonych** |
| `zestawy_przymiar` | ✅ **0 zamków czerwonych** |
| `materialy_przymiar` | ✅ 0 błędów |
| `tarcze_przymiar` | ✅ 0 błędów |
| `katalog_ekwipunku` | ✅ asercje OK · **0 bloków do odświeżenia** |
| `doc_check` | ✅ **0 BŁĘDÓW** |
| `obciazenie_przymiar` | ⚠ **1 błąd: `W4`** — najcięższy zestaw z półki 59,7 kg wobec pasma kalibracji 40–55 kg. **To jest kalibracja, nie usterka** — `OI-105` |
| `tsc --noEmit` · `vite build` | ✅ oba czysto |

---

## DEFERRED

| # | temat | stan | dokąd |
|---|---|---|---|
| D1 | **Trwałość pancerza od PRZYJĘTYCH obrażeń** | ⏳ kierunek zapisany, **zero implementacji** | decyzja §3.2 |
| D2 | **Lamelka vs łuska** — trzy pary **mechanicznie identyczne** (`lamellar_chest` ≡ `scale_chest` itd., zero różniących się pól) | ⏳ `DEFERRED CONTENT/DESIGN` | `OI-100` |
| D3 | **18 sztuk nieosiągalnych ŻADNĄ ścieżką** (ani stock, ani quest, ani loot) | ✅ **2026-10-11** — każda sztuka ma sklep (reguła etapu testów), bramka `tools/dystrybucja_przymiar.mjs` | `OI-106` |
| D4 | **`marching_boots`** — dominowane przez `leather_boots` na 5 osiach (PP, masa, cena, `sellPrice`, brak tagu `set`) | ✅ **2026-10-11** — PP 4 → 6 (decyzja autora) | `OI-121` |
| D5 | **`padded_gloves.sellPrice = 18`** — `sellPriceOf/PP` = **4,50** przy medianie **1,64**; sprzedają się drożej niż `steel_gauntlets` | ✅ **2026-10-11** — `buyPrice` 18, `sellPrice` 7 (decyzja autora) | `OI-121` |
| D6 | **Bestiariusz nie wykorzystuje wszystkich kanałów obrażeń** | ⏳ kierunek contentowy | `OI-120` |
| D7 | **Kalibracja pasma masy** — `W4` 59,7 kg wobec 40–55 kg | ⏳ playtest | `OI-105` |
| D8 | **Czy sufit 0,75 jest stropem, czy bezpiecznikiem** | ⏳ decyzja autora | `OI-20` |

⛔ **Żadna z tych pozycji nie została naprawiona i żadnej nie wolno naprawiać
„przy okazji".** Każda czeka na decyzję albo na dane.

---

## EXPLICITLY NOT IMPLEMENTED

Potwierdzone wyszukiwaniem po całym `src/` i `tools/` — **zero wystąpień**:

- ⛔ **`coverage`** — procentowe pokrycie ciała. **NIE POWSTANIE** (decyzja
  2026-09-12, moc `ACTIVE`). ⛔ Brak `coverage` **nie jest argumentem przeciwko
  wariantom konstrukcyjnym** — ta pomyłka wracała czterokrotnie.
- ⛔ **hit location** — trafienie w konkretny obszar ciała.
- ⛔ **obrażenia per część ciała.**
- ⛔ **penetracja pancerza** jako osobna mechanika — `N-9`; przewaga idzie
  **przez typ obrażeń wariantu**.
- ⛔ **jakakolwiek nowa mechanika trwałości** — łącznie z tą z `D1`.

⚠ Jedyna geometria w tym systemie należy do **TARCZY**, nie do pancerza.
Pancerz działa przy **100% ciosów, z każdego kierunku**.

---

## Current combat coverage — bestiariusz a `ARMOR_PROFILE`

Rozkład typów obrażeń, które **faktycznie** trafiają w gracza:

| typ | źródła | ile |
|---|---|--:|
| **kłute** | wilk, Szary (kontakt), Szary (pojedynek), skoczek (ukąszenie) | **4** |
| **bez typu** | królik, sieciarz, sieć (pocisk), skoczek (kontakt), manekin | **5** |
| **obuchowe** | dzik (kontakt), dzik (szarża) | **2** |
| **cięte** | niedźwiedź | **1** |

**Wniosek: mechanizm profili materiałowych istnieje i działa poprawnie, ale
bestiariusz nie wykorzystuje równomiernie wszystkich kanałów.**

⚠ Konsekwencja liczbowa: kolczuga ma tożsamość zbudowaną na `slash: 1,80`
i `blunt: 0,35` — a **cięte zadaje jeden przeciwnik, obuchowe też jeden.**
Metal z `pierce: 1,15` trafia w kanał o czterech źródłach.

⚠ W drugą stronę: **opancerzony jest dokładnie JEDEN stwór** — dzik
(`{ type: "leather", points: 22 }`). Z ciosu za 12 obrażeń wychodzi 8 / 10 / 9
(cięte / kłute / obuchowe).

⏳ **Kierunek contentowy, nie zadanie** (`OI-120`): przeciwnicy ludzcy z bronią
ciętą, kłutą i obuchową domykają rozkład sami, bez dotykania `Protection.ts`.
⛔ **Nie dodawać nowych typów obrażeń.** ⛔ **Nie zmieniać `ARMOR_PROFILE`.**

---

## Status OI

| OI | temat | status |
|---|---|---|
| **OI-20** | czym miał być sufit `maxDefenseReduction` | **OPEN** — wymaga decyzji autora; audyt dostarczył liczby, nie odpowiedź |
| **OI-21** | materiał bazowy zdominowany na trzech typach | **OPEN** — pytanie, czy test dominacji obowiązuje bazę |
| **OI-22** | „trzecia kategoria ochrony" — przesłanka obalona | **OPEN** |
| **OI-100** | piąty profil (łuska) domykający trójkąt typów | **OPEN** — warunek wstępny rozdzielenia lamelki i łuski |
| **OI-101** | oś wysiłku bez sufitu | **RESOLVED** — Model D wdrożony, `obciazenie_przymiar` E1 ✅ |
| **OI-102** | trzy pętle po `EQUIP_SLOTS` sumują warstwy | **RESOLVED** — zweryfikowane 28/28; ⚠ jego opis mówi „18 adresów", jest 19 |
| **OI-105** | playtest parametrów startowych Modelu D | **OPEN** — jedyna czerwona bramka (`W4`) należy tutaj |
| **OI-106** | pancerze bez dystrybutora | ✅ **ZAMKNIĘTE 2026-10-11** — 127/127 sztuk ekwipunku ma źródło (`docs/dystrybucja_ekwipunku.md`) |
| **OI-107** | przestarzałe asercje 18 adresów / 10 miejsc | **RESOLVED** — poprawione 2026-09-18, obie bramki zielone |
| **OI-108** | jednoręczna broń drzewcowa | **OPEN** — poza domeną pancerza, bez zmian |
| **OI-112** | bastard / włócznia z dwoma profilami chwytu | **OPEN** — poza domeną pancerza, bez zmian |
| **OI-120** | rozkład typów obrażeń w bestiariuszu | **DEFERRED** — nowy, kierunek contentowy |
| **OI-121** | dwie anomalie danych w katalogu pancerza | ✅ **ZAMKNIĘTE 2026-10-11** — obie poprawione decyzją autora |

⛔ **Żadnego OI nie zamknięto dlatego, że istnieje techniczne rozwiązanie.**
Zamknięte są wyłącznie te, w których **nie została już żadna decyzja**.

---

## ARMOR SYSTEM FREEZE

> **System pancerza i tarcz zostaje ZAMROŻONY na poziomie architektury
> i podstawowych mechanik.**
>
> Dalsze zmiany parametrów, balans oraz ewentualna implementacja trwałości
> pancerza mają być podejmowane **dopiero na podstawie rzeczywistych
> playtestów, telemetrii albo osobnej decyzji projektowej.**

**Freeze NIE oznacza** „system jest idealnie zbalansowany".

**Freeze oznacza** „fundament jest wystarczająco zweryfikowany, żeby przestać
go przebudowywać bez nowych danych".

---

## Gdzie szukać reszty

| pytanie | dokument |
|---|---|
| jak ochrona zamienia się w mniejsze obrażenia | `docs/systemy/armor.md` (`STAN`) |
| dlaczego model wygląda tak — i co zamknięto tym audytem | `docs/decyzje/2026-09-18-zamkniecie-audytu-pancerza.md` |
| taksonomia warstw, D1–D4, lista odrzuconych | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |
| model C, adres = slot + warstwa | `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` |
| gatunek materiału żelazo/stal | `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md` |
| Model D, trzy kanały obciążenia | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| blok kierunkowy, `T-1`, `T-7` | `docs/systemy/shields.md`, `docs/tarcze_checkpoint.md` |
| **liczby rosteru** (PP, masy, ceny, luki) | `docs/ekwipunek_przedmioty.md` (generowane) |
| lista otwartych spraw | `docs/zadania.md` |

---
typ: STAN
domena: armor
tytul: Pancerz — ochrona, materiały, typy obrażeń
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-18, przymiar:doc_check, przymiar:combat_regresja, przymiar:katalog_ekwipunku, przymiar:warstwy_przymiar, przymiar:materialy_przymiar]
kotwice:
  - src/core/Protection.ts
  - src/core/Equipment.ts
  - src/core/ArmorLayers.ts
  - src/core/ArmorMaterials.ts
  - src/core/DamageResolver.ts
  - GameConfig.ARMOR_PROFILE
  - GameConfig.EQUIPMENT.defenseK
  - GameConfig.EQUIPMENT.maxDefenseReduction
  - GameConfig.COMBAT_FEEDBACK.typeFeedback
  - GameConfig.QUALITY.modifiers.defense
otwarte: [OI-20, OI-21, OI-22, OI-100]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Pancerz — ochrona, materiały, typy obrażeń

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak ochrona zamienia się
> w mniejsze obrażenia**: skąd biorą się punkty, co z nimi robi materiał, jaka
> krzywa je przelicza i co świadomie tej ścieżki nie dotyka.
>
> **Czym NIE jest.** Nie jest katalogiem ani tabelą liczb — te są
> w `docs/ekwipunek_przedmioty.md` (generowanym) i mają pierwszeństwo we
> wszystkim, co jest liczbą rosteru. Nie opisuje tarczy, ciosu ani
> bestiariusza; granice w §0.

---

## 0. Granice domeny

| pytanie | domena | dokument |
|---|---|---|
| jak punkty ochrony stają się redukcją, co znaczy materiał | **`armor`** | ten plik |
| czym jest przedmiot, `armorType`/`defense`/`weight` jako POLA | `items` | `docs/systemy/items.md` |
| strefy osłony, blok kierunkowy, koszt bloku | `shields` | — |
| kolejność kroków ciosu, jedno zaokrąglenie, unik i parowanie | `combat` | — |
| kto nosi pancerz i kto zadaje jaki typ | `creatures` | — |
| który wariant broni niesie który typ obrażeń | `weapons` | — |
| kolor i glif przy liczbie obrażeń jako kanał UI | `presentation` | — |

### 0.1 Zależności — surowiec pod przyszłą mapę

⚠ **To jest zapis krawędzi, nie mapa.** Wyprowadzony z kodu; kolumna „przez co"
nazywa symbol, który tę krawędź realizuje.

| kierunek | domena | przez co |
|---|---|---|
| `armor` **czyta** | `items` | `armorType`, `defense`, `bonus.defense`, jakość egzemplarza |
| `armor` **czyta** | `weapons` | typ obrażeń wariantu ataku |
| `armor` **czyta** | `creatures` | pancerz stworzenia, typy kanałów obrażeń wroga |
| `armor` **daje** | `combat` | ułamek redukcji (`Equipment.reductionAgainst`) |
| `armor` **daje** | `presentation` | `Protection.effectiveness` — trzy stany |
| `armor` **daje** | `stamina` | obrażenia PO pancerzu wchodzą w `STAMINA.heavyHit` |
| `armor` **dzieli plik** z | `shields` | `src/core/Protection.ts` — patrz §1.4 |

---

## 1. Rdzeń: ochrona liczy się w PUNKTACH

### 1.1 Jedna ścieżka arytmetyczna

```
punkty ochrony
  → jakość egzemplarza        (tylko gracz — QUALITY.modifiers.defense)
  → mnożnik materiału         (ARMOR_PROFILE[materiał][typ])
  → krzywa d/(d + EQUIPMENT.defenseK), sufit EQUIPMENT.maxDefenseReduction
  → ułamek redukcji
```

⚠⚠ **Punkty, nie procenty — decyzja nośna, nie konwencja zapisu.** Wszystko, co
kiedykolwiek będzie modyfikować ochronę (jakość, ewentualna trwałość, buff),
naturalnie skaluje **sumę punktów**; skalowanie procentu nie ma jednej poprawnej
odpowiedzi („+20% do 60%" to albo 72%, albo 80 pkt proc.).

⚠ **Mnożnik materiału trafia na PUNKTY, nigdy na wynik.** Dzięki temu jakość
i materiał składają się przemiennie i żadne z nich nie musi wiedzieć o drugim.

⚠ **Redukcja jest procentowa, nie płaska — i zależy to od SKALI liczb.** Przy
dzisiejszych obrażeniach płaska redukcja byłaby wyłącznikiem, nie odcieniem,
i **odwracałaby drabinkę broni**. ⚠ Gdyby obrażenia urosły o rząd wielkości,
ten argument by osłabł — to jest warunek, nie gust.

### 1.2 Sumowanie: per SZTUKA, nigdy per komplet

Każda założona sztuka przechodzi przez **własny** materiał, dopiero potem sumują
się punkty. Reguły o „kompletach" nie ma i być nie ma: stalowy napierśnik na
skórzanej reszcie czyta się jako w-większości-metal sam z siebie.

⚠⚠ **Warstwa nie zmienia tu NICZEGO — i to jest decyzja, nie przeoczenie**
(2026-09-15, `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md`).
Sztuka wnosi te same punkty na L1, na L2 i na L3; stos sumuje się zwykłą sumą,
a `Protection.ts` o warstwach **nie wie i nie ma wiedzieć**. Konsekwencja tego
samego zdania, co wyżej: punkty sztuki nie mogą zależeć od tego, co jest
założone obok niej ani nad nią.

⛔ **Nie szukaj tu mnożników pozycyjnych ani „premii wyściółki pod płytą".**
Rozważone i odrzucone: pierwsze łamie regułę „per sztuka", drugie wchodzi
w zamrożone `D2` (krzywa i cap). Cena warstwowania należy do **obciążenia**
(`OI-103`), nie do ochrony.

### 1.3 Co NIE przechodzi przez profil

| kanał | dlaczego |
|---|---|
| `bonus.defense` (biżuteria) | **nie jest z niczego zrobiony**, więc nie ma materiału do zastosowania. Dokłada punkty **po** profilowaniu i chroni przed wszystkim równo |
| jad | pancerz zatrzymuje cios, nie toksynę, która jest już w środku |
| krwawienie | ta sama reguła: efekt ciągły nie jest ciosem |
| cios bez typu (`null`) | „świadomie bez typu" — punkty wchodzą w krzywą bez zmian |

⚠ **Brak pancerza = pełne obrażenia.** W tym modelu **nie istnieje** coś takiego
jak „odporność nieopancerzonego".

⚠ **Nigdy poniżej 1 punktu obrażeń.** Cel w ciężkim pancerzu byłby inaczej
nieśmiertelny, a pływające „0" czyta się jako zepsutą grę, nie jako pancerz.

### 1.4 Dwa miejsca STOSOWANIA, jeden rdzeń

⚠⚠ **To jest fakt strukturalny, o którym nie mówi dziś żaden inny dokument.**

```
gracz → wróg:   Enemy.damageAfterArmor → Protection.mitigate       (własne zaokrąglenie)
wróg  → gracz:  Equipment.reductionAgainst → ułamek → DamageResolver
                                                    (jedno zaokrąglenie, wspólne z tarczą)
```

Wspólny jest **rdzeń** (`armorPointsAgainst` + `reductionFromPoints`), nie
zastosowanie. Kierunek na wroga jest domknięty w tej domenie; kierunek na gracza
oddaje ułamek i kończy się w `combat`, bo tam czeka tarcza i tam pada **jedno**
zaokrąglenie.

⚠ **`src/core/Protection.ts` niesie DWA niezależne podsystemy** — arytmetykę
ochrony (ta domena) i geometrię osłony (`guardZone`/`isFrontal`, domeny `shields`
i `combat`). Nie stykają się: geometria nigdy nie czyta `ARMOR_PROFILE`,
arytmetyka nigdy nie czyta `SHIELD`. **Wspólny plik to sąsiedztwo, nie
zależność.**

---

## 2. Materiał: co znaczy mnożnik

`ARMOR_PROFILE` to tabela **materiał × typ obrażeń**. Wartości i pełna macierz:
`docs/ekwipunek_przedmioty.md` §2.2 (generowane).

⚠⚠ **Od 2026-09-15 „materiał" znaczy DWIE rzeczy i trzeba je rozróżniać** —
patrz §2.1. `armorType` to PROFIL (ten rozdział), `material` to GATUNEK.

### 2.1 Gatunek materiału — oś PIONOWA, prostopadła do profilu

```
armorType  PROFIL   jak konstrukcja reaguje na typy obrażeń    padded·leather·mail·metal
material   GATUNEK  z jakiego metalu ją zrobiono               iron → steel
```

⭐ **Dowód prostopadłości: kolczuga i płyta bywają z tego samego metalu.**
Żelazo jest jednocześnie drutem (`mail`) i blachą (`metal`), więc jednym
wierszem profilu zapisać się nie da. ⛔ **Gatunek nigdy nie zostanie wierszem
`ARMOR_PROFILE`** — `N-7` żądałby od żelaza typu obrażeń, w którym wygrywa,
a ono nie wygrywa ze stalą w niczym. **`N-7` jest tym nietknięte.**

| | `defenseMul` | `priceMul` |
|---|---|---|
| **stal** — cały dotychczasowy katalog | 1,00 | 1,00 |
| **żelazo** — szczebel poniżej | **0,80** | **0,60** |

- ⭐ **Poziom zerowy to STAL, drabinka rośnie W DÓŁ.** Ani jedna istniejąca
  liczba się nie zmieniła, kirys (28 PP) zostaje szczytem, scope PP pojedynczej
  warstwy (~30) nietknięty.
- ⚠ **`0,80` jest wyliczone.** SUFIT z czytelności: `iron Q4 < steel Q1`, czyli
  `m < 0,85/1,05 = 0,810`. PODŁOGA z katalogu: żelazne nagolenniki nie schodzą pod
  spodnie kolcze (12/15 = 0,800). Zostaje pasmo **0,800–0,810**.
- ⭐ **`priceMul` MUSI być niższy od `defenseMul`** (`c/m = 0,75`), inaczej
  żelazo jest słabsze **oraz** gorsze na złotówkę — czyli pułapką, nie wyborem.
- ⚠ **Mnożnik gatunku trafia na PUNKTY** (`N-16`), więc gatunek, jakość i profil
  składają się przemiennie: `PP × gatunek × jakość × stan`, dopiero potem profil.
- ⛔ **Gatunek NIE rusza masy ani `requires`** — różnica gęstości jest za mała na
  mechanikę, a masa jest osią rozmiaru konstrukcji. Żelazo obniża **cenę**, nie
  bramkę Siły.
- ⛔ **Ręce zostają jednogatunkowe** — rękawice kolcze 5 PP przy płytowych 6
  dają podłogę 0,833, powyżej sufitu 0,810. Korytarz jest pusty; to wynik
  arytmetyki, nie zakaz.
- ⏳ **Trwałość będzie kiedyś naturalnym domem gatunku** — pancerz jej dziś nie ma.

Bramka: `node tools/materialy_przymiar.mjs`. Decyzja z wyprowadzeniem
i odrzuconymi wariantami: `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`.

⚠ **`1,00` jest zerem DEFINICYJNYM, nie progiem do strojenia** — „pancerz liczy
się w całości". Poniżej: typ przechodzi. Powyżej: grzęźnie. Dzięki temu mnożnik
da się czytać bez porównywania go z czymkolwiek innym.

⚠ **`armorType` to MATERIAŁ, nie klasa abstrakcyjna.** Chityna nie jest metalem
dlatego, że jest twarda; wpisanie pająkom `metal` zmieszałoby kategorię
mechaniczną z materiałem i trzeba by to potem odkręcać.

⚠⚠ **Mnożnik może być WIĘKSZY od 1** — materiał odporny na dany typ liczy swoje
punkty **z premią**. O to potyka się każde nowe użycie profilu, więc reguła
brzmi: **kanał, który ma omijać pancerz, musi go omijać jawnie**. Puszczenie go
przez profil nie da „zera efektu", tylko efekt zależny od tego, w co cel jest
ubrany.

⚠ **Balans profilu stroi się WYŁĄCZNIE w `ARMOR_PROFILE`**, nigdy przez
odebranie komuś typu obrażeń. Typ opisuje mechanikę ataku, nie balans zbroi.

---

## 3. Kto ma pancerz

**Gracz** — pancerz wchodzi w **szesnaście adresów** z `EQUIP_SLOTS`: cztery
obszary warstwowane × trzy warstwy (`head_L1`…`boots_L3`), plus trzy sloty bez
warstw — `gloves`, `shoulders`, `offhand`. ⚠ **`slot` na przedmiocie deklaruje
OBSZAR** (`chest`), a adres w magazynie dokłada warstwę (`chest_L3`); wyprowadza
ją `ArmorLayers.itemLayer` z `armorType`. Tarcza jest pancerzem, który dodatkowo
blokuje. Punkty skalują się gatunkiem materiału i jakością egzemplarza.
⛔ `amulet` i pierścienie **nie przyjmują** `type: "armor"` — ich wkład idzie
wyłącznie kanałem `bonus.defense` (§1.3).

**Stworzenie** — pancerz jest zwykłym `{ type, points }` w configu stwora.
⚠ **Bez egzemplarza, więc bez jakości i bez zużycia.** Nie ma czegoś takiego jak
„jakość pancerza dzika" i nie jest to brak do uzupełnienia.

⚠⚠ **Opancerzony przeciwnik jest WYJĄTKIEM i to jest decyzja, nie niedokończony
rollout.** Gdyby każdy stwór miał tabelę odporności, wybór wariantu ataku
przestałby być decyzją, a stałby się podatkiem płaconym przed każdym ciosem.
⚠ Konsekwencja: **pętla działa dziś głównie w kierunku wróg → gracz** — po
stronie gracza pancerz różnicuje typy tylko na tym podzbiorze rosteru, który go
w ogóle ma. Ilu ich jest: konfig rosteru i `docs/ekwipunek_przedmioty.md`.

---

## 4. Skuteczność typu jako kanał informacji

`Protection.effectiveness` zwraca **trzy stany** (`przechodzi` / `neutralnie` /
`grzeznie`) — treść koloru i glifu przy liczbie obrażeń.

⚠ **Liczone z MNOŻNIKA, nigdy z wyniku.** Mnożnik ma zero absolutne w `1,00`,
więc nie ma problemu „odchylenie względem czego"; normalizacja względem
pozostałych typów dałaby graczowi **ranking**, czyli odpowiedź zamiast pytania;
a wynik jest losowy i krytyki zalewają różnicę między typami.

⚠ **Kanał działa też dla broni JEDNOWARIANTOWEJ** i to jest pożądane: kolor mówi
o świecie („ten pancerz jest na to odporny"), nie o trafności decyzji gracza.

Progi: `COMBAT_FEEDBACK.typeFeedback.slipsBelow` i `.minArmorPoints` — przy zbyt
cienkiej ochronie różnica nie sięga jednego punktu obrażeń i kanał milczy.

⚠ **Kierunek wróg → gracz tego kanału NIE MA.** Pancerz gracza działa przy **100%
ciosów**, więc sygnał nadawany zawsze nie niesie informacji — informacyjne byłoby
dopiero odstępstwo, a tego per cios pokazać się nie da. Wynik osobnej analizy,
nie przeoczenie.

---

## 5. Niezmienniki

Numeracja `N-*` zachowana z `docs/ekwipunek_mechanika.md`, żeby odwołania nie
zgniły. ⚠ `N-7`…`N-9` **należą do tej domeny**; `docs/systemy/items.md` §6 nosi je
dziś jako depozyt — patrz `docs/proces/ekstrakcja_armor.md` §6.

- **N-7 (poprawiony)** — **nowy materiał musi mieć typ obrażeń, który jest
  przeciw niemu NAJLEPSZY, i ten typ powinien być typem, który dziś nie wygrywa
  nigdzie indziej.** Pierwotne brzmienie („musi mieć kogoś, kogo bije") mieszało
  dwa kierunki. Wyprowadzenie i pomiar: `docs/proces/ekstrakcja_armor.md` §4.
- **N-8** — `armorType` to materiał, nie klasa abstrakcyjna (§2).
- **N-9** — **żadnej penetracji pancerza.** Broń omijająca materiał zamienia
  `ARMOR_PROFILE` w kłamstwo; przewaga idzie **przez typ obrażeń wariantu**.
- **N-16** — **mnożnik na punktach, nigdy na wyniku** (§1.1). Bez tego jakość
  i materiał przestają się składać przemiennie.
- **N-17** — **jeden rdzeń dla obu kierunków walki.** Drugi kształt ochrony
  w tej grze już był i został usunięty, zanim cokolwiek go użyło.
- **N-18** — **kanał omijający pancerz omija go JAWNIE** (§1.3, §2). „Typ, na
  który wszyscy mają 1,0" nie jest ominięciem.
- **N-19** — **profil stroi się w `ARMOR_PROFILE`**, nigdy przez zmianę typu
  czyjegoś ataku.
- **N-20** — **opancerzony przeciwnik jest wyjątkiem** (§3).

⚠ **`blunt` ≠ `interrupt`** — reguła oddana domenie `weapons`: typ obrażeń
odpowiada za interakcję z ochroną, przerywanie jest cechą konkretnej broni.
⚠ **Trwałość pancerza nie istnieje** — decyzja mieszka w domenie `items`.

---

## 6. Checklisty

### 6.1 Nowy materiał

1. **Sprawdź N-7 w poprawionym brzmieniu**: który typ ma być przeciw niemu
   najlepszy i czy ten typ już nie wygrywa gdzie indziej.
2. Jedna linia w `ARMOR_PROFILE` — i **cztery decyzje o tym, na kogo działa**.
3. Sprawdź N-8: czy to naprawdę materiał, czy tylko przymiotnik („twardy").
4. Przelicz **pełne komplety**, nie pojedynczą sztukę — przez krzywą malejących
   przyrostów ostatnia sztuka kupuje mniej niż pierwsza.
5. Zrób **test dominacji**: czy nowy materiał nie wypiera po cichu starego na
   wszystkich trzech typach naraz. Ten test już raz zmienił liczbę w tabeli.
6. Przepuść `node tools/katalog_ekwipunku.mjs` i **przeczytaj wiersz kompletu**.
   ⚠ Bez `--zapisz` do czasu rozstrzygnięcia OI-7.

### 6.2 Nowy kanał obrażeń (po którejkolwiek stronie)

1. Typ jest **wymagany**, `null` znaczy „świadomie bez typu". Pole opcjonalne
   sprawia, że „zdecydowaliśmy" i „ktoś zapomniał" wyglądają w źródle
   identycznie — ta lekcja kosztowała martwą kolumnę w profilu.
2. Jeśli kanał ma omijać pancerz — omiń go **jawnie** (N-18).
3. Sprawdź **rachunek kolumn**: materiał, który odpowiadał na dwa stworzenia,
   może przez tę zmianę zostać z jednym.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| punkty → profil → krzywa → sufit | ✅ | ✅ | `przymiar:combat_regresja` |
| mnożnik na punktach, nie na wyniku | ✅ | ✅ | `kod:2026-09-06` |
| sumowanie per sztuka, komplety mieszane | ✅ | ✅ | `kod:2026-09-06` |
| jakość składa się z materiałem przemiennie | ✅ | ✅ | `przymiar:katalog_ekwipunku` |
| pancerz stworzenia bez jakości i zużycia | ✅ | ✅ | `kod:2026-09-06` |
| dwa miejsca stosowania, jeden rdzeń | ✅ | ✅ | `kod:2026-09-06` |
| `bonus.defense` poza profilem | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| jad i krwawienie omijają pancerz | ✅ | ✅ | `kod:2026-09-06` |
| `effectiveness` — trzy stany z mnożnika | ✅ | ✅ | `przymiar:combat_regresja` |
| brak kanału informacji w kierunku wróg → gracz | ✅ *(świadomie)* | ✅ | — |
| N-7 w poprawionym brzmieniu | ✅ | ✅ | ❌ **brak asercji** — OI-22 |
| margines do sufitu redukcji | ✅ | ⚠ | ❌ **przeliczony, niezaakceptowany** — OI-20 |
| pozycja materiału bazowego w macierzy | ✅ | ⚠ | ❌ **test dominacji nieprzeprowadzony dla bazy** — OI-21 |
| czy wybór materiału CZUJE się jak decyzja | ✅ | — | ❌ `reka` — nigdy nie zmierzone |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-8** | ⚙ **Rozstrzygnięte jako pytanie o SFORMUŁOWANIE, nie o balans.** N-7 mieszał dwa kierunki („materiał ma odpowiedź" vs „typ ma cel"). Pomiar: pierwszy spełniają **wszystkie** materiały, drugiego nie spełnia jeden typ — stan zamierzony, opisany w czterech miejscach z nazwaną rekompensatą. Poprawione brzmienie: §5. **Co zostaje otwarte, przeszło do OI-21 i OI-22.** |
| **OI-20** | ⚠ **Margines do `EQUIPMENT.maxDefenseReduction` jest cieńszy, niż mówi dokumentacja** — zapisany zapas policzono na komplecie, który urósł o slot, i bez biżuterii. Przeliczenie: `docs/proces/ekstrakcja_armor.md` §5. **Nie wiadomo, czy ten sufit jest projektowym stropem, czy zabezpieczeniem, którego nikt nie miał dotknąć** — a to zmienia odpowiedź. Decyzja autora. |
| **OI-21** | ⚠⚠ **Materiał bazowy jest zdominowany na wszystkich trzech typach naraz.** Test dominacji, którym uzasadniono jedną z liczb w tabeli, wypada dla niego negatywnie. **Może to być poprawne**: baza nie ma bramki Siły, waży i kosztuje najmniej, więc jej tożsamością bywa dostępność, nie odporność. **Wymaga jednego zdania autora: czy test dominacji obowiązuje materiał bazowy.** |
| **OI-22** | ⚠⚠ **Uzasadnienie zaparkowanej „trzeciej kategorii ochrony" zostało obalone przez dane.** Twierdzono, że trójkąt nie domyka się, bo kategorii jest za mało; od tego czasu przybyły dwie i **nadal się nie domyka**. Domknięcie wymaga materiału o **konkretnej własności**, a nie kolejnego materiału. ⛔ Nie odparkowywać starej propozycji bez tej poprawki — zbudowana wg pierwotnego opisu **pogłębiłaby** przechył. |

---

## Czego ten dokument nie rozstrzyga

- **Balansu żadnej liczby.** Wartości profilu są jawnie „do playtestu", a nie
  zamrożonym balansem; ten plik opisuje kształt.
- **Ilu przeciwników ma mieć pancerz i którzy** — domena `creatures`.
- **Kolejności unik → parowanie → blok → pancerz i miejsca zaokrąglenia** —
  `combat`. **Stref osłony, kąta i kosztu bloku** — `shields`.
- **Czy pancerz powinien się zużywać** — decyzja zamknięta w domenie `items`.
- **Kanału informacji o obrażeniach OTRZYMANYCH** — zaprojektowany, niewdrożony,
  domena `presentation`.
- **Czy roster pancerza jest kompletny** — siatka luk jest w katalogu
  generowanym.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **23 decyzji z mocą**, 14 rozjazdów i przeliczenie sufitu redukcji | `docs/proces/ekstrakcja_armor.md` |
| dlaczego pająk nie dostaje istniejącego materiału; trzeci typ ochrony | `docs/odlozone.md` |

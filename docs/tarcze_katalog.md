---
typ: OPERACYJNE
domena: [shields, items]
tytul: Katalog tarcz — 30 definicji
stan: zywy
otwarte: [B2, B3, P1]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-16 (2)
---

# Katalog tarcz — 30 definicji

> **Po co ten plik.** Lista konkretnych definicji przedmiotów, wyprowadzona
> **mechanicznie** z zamkniętych decyzji (`docs/tarcze_checkpoint.md` §1.1–§1.4)
> i z trzech rozstrzygnięć autora z 2026-09-15. ⛔ **Nic tu nie jest wymyślone
> poza nazwami** — siatka wynika z macierzy materiałów × wariantów.
>
> ⛔ **ZERO liczb balansowych.** Ten dokument ustala, **JAKIE przedmioty
> istnieją**, a nie ile mają redukcji, masy czy punktów. Liczby przychodzą
> osobno: `sideArcDeg` w `B3`. ✅ **Nazwy (`B1`) i model ceny (`B4`) są już
> ZAMKNIĘTE** — §8; ⏳ otwarta zostaje wyłącznie **wartość** `variantPriceMul`.
>
> ⛔ **ZERO zmian w kodzie.** W `ITEMS` nadal stoją DWIE tarcze.
> Brak czegoś w `ITEMS` **nie jest dowodem**, że zostało odrzucone.
>
> Przymiar pilnujący niezmienników: `tools/tarcze_przymiar.mjs`
(⭐ **od 2026-09-16 także §V — 19 zamków na sam katalog**: wyprowadzenie z
`SHIELD_BASE` × `SHIELD_VARIANT`, trzy nierówności nietykalne, komplet 30 pozycji,
osiągalność u NPC, wyliczana cena wariantu i ⛔ zakaz własnych właściwości wariantu).

---

## 1. Trzy rozstrzygnięcia, które ten katalog domknęły (2026-09-15)

Do 2026-09-15 katalogu **nie dało się spisać**: §1.1 przypisywał dwa razy
„najwyższą trwałość" i dwa–trzy razy „najszerszy łuk", więc każde przypisanie
porządku wybierałoby zwycięzcę, czyli rozstrzygało decyzję projektową.

### D-T1 · Trwałość to DWIE osie, nie jedna drabina

> ⛔ **Nie tworzymy jednej kolejności „kto ma najlepszą trwałość".**

| konstrukcja | oś |
|---|---|
| **Pawęż** | ⭐ **największa BEZWZGLĘDNA pula `durability`** w katalogu |
| **Migdałowa** | ⭐ **trwałość WZGLĘDEM swojej klasy/masy** — i to nadal jest jej tożsamość |

⭐ **To jest ten sam kształt, który projekt przyjął dla pancerza 2026-09-12**
(*„wariant lżejszy ma LEPSZY stosunek i NIŻSZĄ wartość bezwzględną"*) i który
dzisiejsza para tarcz już spełnia (puklerz: 2,67 pkt/kg wobec 1,60). **Stosunek
i wartość bezwzględna to dwie różne osie — i dopiero to pozwala dwóm rzeczom
być „pierwszymi" bez dominacji.**

### D-T2 · Geometria to TRZY różne znaczenia, nie jedna drabina

> ⛔ **`sideArcDeg` nie jest drabiną „im więcej tym lepiej".**

| konstrukcja | znaczenie |
|---|---|
| **Okrągła** | ⭐ **najlepsza ochrona boczna** / największy praktyczny zakres zewnętrzny |
| **Rycerska** | ⭐ **największy pełny łuk frontalny** |
| **Pawęż** | ⭐ **największe fizyczne pokrycie / ochrona pozycyjna** — ⚠ **NIE musi mieć największego `sideArcDeg`** |

Pozostałe konstrukcje zachowują profile z §1.1 bez zmian.

### D-T3 · Kolejność: `P1 → B3 → T-1`

> Najpierw **pomiar** rzeczywistych kierunków ataków, potem **ustalenie**
> `sideArcDeg`, dopiero potem **parametryzacja** `guardZone`.

⚠ To rozstrzyga sprzeczność, która stała w checkpointcie: §4 stawiało `T-1`
jako krok 1 (przed `B3`), a „Pipeline końcowy" jako ostatni. **Wygrywa
pipeline.** §4 zostało poprawione.

---

## 2. Profil ordynalny — w czym każda konstrukcja jest PIERWSZA

⚠ Kolumny to **porządki**, nie liczby. Liczby nie należą do tego dokumentu.

| konstrukcja | PIERWSZA w | za co płaci |
|---|---|---|
| **Puklerz** | redukcja **na kilogram** · najniższa masa · najniższa kara tempa | ⛔ najniższa ochrona bezwzględna |
| **Okrągła** | ⭐ **ochrona boczna / praktyczny zakres zewnętrzny** | poza tym wszędzie środek stawki |
| **Rycerska** | ⭐ **`reduction` bezwzględna** · ⭐ **pełny łuk frontalny** | ⛔ najwęższy zakres zewnętrzny — oskrzydlenie |
| **Migdałowa** | ⭐ **trwałość względem klasy/masy** | ⛔ `reduction` **niższa** niż Rycerskiej |
| **Legionowa** | ⭐ **bash** · największy zakres **wśród zdolnych do walki** | wysoka masa i wymagania |
| **Pawęż** | ⭐ **bezwzględna pula `durability`** · ⭐ **fizyczne pokrycie / ochrona pozycyjna** | ⛔ **nie da się nią walczyć** · skrajny `swingMul` |

### ⛔ Trzy nierówności nietykalne (z §1.1, niezmienione)

```
reduction(Migdałowa)  <  reduction(Rycerska)
reduction(Pawęż)      <  reduction(Rycerska)
swingMul(Pawęż)       =  skrajny        ← jedyna realna cena Pawęży
```

---

## 3. Sprawdzenie dominacji — 15 par

⚠ **Kryterium:** w każdej parze **obie strony muszą wygrywać co najmniej jedną
oś**. Konstrukcja przegrywająca wszystko jest szczeblem, nie wariantem.

| para | wygrywa pierwsza | wygrywa druga |
|---|---|---|
| Puklerz ↔ Okrągła | red./kg, masa, tempo | ochrona boczna, red. bezwzgl. |
| Puklerz ↔ Rycerska | red./kg, masa, tempo | red. bezwzgl., pełny łuk |
| Puklerz ↔ Migdałowa | red./kg, masa, tempo | trwałość (obie osie) |
| Puklerz ↔ Legionowa | red./kg, masa, tempo | bash, zakres, red. bezwzgl. |
| Puklerz ↔ Pawęż | red./kg, masa, tempo, **walka** | `durability` bezwzgl., pokrycie |
| Okrągła ↔ Rycerska | **ochrona boczna** | red. bezwzgl., **pełny łuk** |
| Okrągła ↔ Migdałowa | ochrona boczna, masa | trwałość (obie osie) |
| Okrągła ↔ Legionowa | ochrona boczna, masa, tempo | bash, red. bezwzgl. |
| Okrągła ↔ Pawęż | **walka**, masa, tempo, zakres | `durability` bezwzgl., pokrycie |
| Rycerska ↔ Migdałowa | red. bezwzgl., pełny łuk | trwałość (obie osie) |
| Rycerska ↔ Legionowa | red. bezwzgl., pełny łuk | bash, **zakres zewnętrzny** |
| Rycerska ↔ Pawęż | red. bezwzgl., **walka**, masa, tempo | `durability` bezwzgl., pokrycie |
| **Migdałowa ↔ Pawęż** | **trwałość WZGLĘDNA**, walka, masa, tempo | **`durability` BEZWZGLĘDNA**, pokrycie |
| **Legionowa ↔ Pawęż** | **walka**, bash, zakres, masa, tempo | `durability` bezwzgl., pokrycie |
| Migdałowa ↔ Legionowa | trwałość względna | bash, zakres zewnętrzny |

✅ **15/15 bez dominacji.**

⭐⭐ **Dwie pary przechodzą WYŁĄCZNIE dzięki rozstrzygnięciom z §1:**
**Migdałowa ↔ Pawęż** żyje z `D-T1` (dwie osie trwałości — przed nim jedna
z nich musiała być zdominowana), a **Legionowa ↔ Pawęż** z `D-T2` (Pawęż nie
musi wygrywać `sideArcDeg`, więc największy praktyczny zakres wśród walczących
zostaje Legionowej).

---

## 4. Rozdział ról — dwie pary, o które autor pytał wprost

### Legionowa ↔ Pawęż — podział przebiega przez **zdolność do walki**

| | Legionowa | Pawęż |
|---|---|---|
| duży łuk | ✅ | ✅ |
| **da się nią walczyć** | ✅ **tak** | ⛔ **nie** |
| bash | ⭐ mocny | — |
| `durability` bezwzgl. | wysoka | ⭐ **najwyższa** |
| pokrycie / pozycyjność | — | ⭐ **najwyższe** |
| `swingMul` | umiarkowany | ⛔ **skrajny** |

⭐⭐ **Para jest chroniona DWUKROTNIE i obie ochrony są strukturalne, nie
liczbowe:** (1) granicą „czy nadal walczysz", (2) **brakiem wariantu** —
Legionowa nie ma ciężkiego, Pawęż nie ma lekkiego (§1.4). ⛔ Nie zbliżać ich
strojeniem liczb; to nie jest tam, gdzie leży ich rozdział.

### Migdałowa ↔ Rycerska — podział przebiega przez **horyzont czasowy**

| | Rycerska | Migdałowa |
|---|---|---|
| pytanie, na które odpowiada | „**zatrzymać TEN cios**" | „**znieść SERIĘ ciosów**" |
| `reduction` | ⭐ najwyższa | ⛔ niższa od Rycerskiej |
| pełny łuk frontalny | ⭐ największy | — |
| zakres zewnętrzny | ⛔ najwęższy | — |
| trwałość względem klasy | — | ⭐ **tożsamość** |

✅ **`T-5` ZROBIONE 2026-09-15** — pole `durability`, zużycie za zablokowany cios
i `destroyedMultiplier` w `blockSpec`. ⚠ **`T-5` był warunkiem koniecznym Migdałowej** — bez pola `durability` jej
tożsamość nie ma nośnika i byłaby cięższą Rycerską o niższej redukcji, czyli
konstrukcją zdominowaną.

---

## 5. Katalog — 30 definicji

**Siatka** (materiały z §1.3 × warianty z §1.4):

| konstrukcja | materiały | warianty | definicji |
|---|---|---|---|
| Puklerz | drewno · żelazo · stal | **zwykła** · ciężka | 6 |
| Okrągła | drewno · żelazo · stal | **zwykła** · ciężka | 6 |
| Rycerska | drewno · żelazo · stal | **zwykła** · ciężka | 6 |
| Migdałowa | drewno · żelazo | **zwykła** · ciężka | 4 |
| Legionowa | drewno · żelazo · stal | lekka · **zwykła** | 6 |
| Pawęż | **drewno** | **zwykła** · ciężka | 2 |
| | | **RAZEM** | **30** |

⚠⚠ **ZAKRES ZAWĘŻONY 39 → 30 (2026-09-16, decyzja autora).** Wariant `lekki`
przestał być domyślny i **został WYŁĄCZNIE przy Legionowej**. Powody per
konstrukcja stoją w `SHIELD_VARIANT` w `GameConfig.ts`; krótko:

| konstrukcja | co się stało z `lekką` |
|---|---|
| **Puklerz** | ⛔ usunięta — oszczędza **0,4 kg**, czyli **poniżej progu, który Model D w ogóle widzi** (`speedFreeKg`/`regenFreeKg` = 10 kg), a przy tym obniża `blockCapacity` i PODNOSI koszt wysiłku za punkt |
| **Okrągła** | ⛔ usunięta — wciska się między ciężki puklerz a zwykłą okrągłą i nie wygrywa z żadnym; geometria (jej tożsamość) nie zależy od wariantu |
| **Rycerska** | ⛔ usunięta — ⚠ wariant **anty-tożsamościowy**: zbija `reduction`, czyli dokładnie to, po co tę konstrukcję się bierze |
| **Legionowa** | ⭐ **ZOSTAJE** — 2,2 kg i `swingMul` 1,42 → 1,32; leży NA jej osi tożsamości (*duży łuk przy zachowanej zdolności walki*), a `heavy` ma zakazany, więc bez niej straciłaby oś wariantu w całości |

⛔ **Lekka paweż nadal NIE powstaje** — §1.4 checkpointu zamknęło to wcześniej
(*zbliża ją do legionowej*), a para legionowa ↔ paweż przechodzi test
niedominacji **tylko dzięki `D-T2`**.

⭐ Siatka poniżej jest odtwarzalna z macierzy materiałów × wariantów, nie przepisana.

✅⭐ **NAZWY SĄ FINALNE — `B1` ZAMKNIĘTE 2026-09-16.** Wariant cięższy nazywa się
**„ciężki”**, a wszystkie 30 nazw niżej obowiązują dokładnie w tej formie, w jakiej
stoją. Wariant zwykły **nie ma słowa w nazwie** (§1.4).

⛔ **„Wzmocniony” jest ODRZUCONE i nie wraca.** Sugerowałoby INNĄ WŁAŚCIWOŚĆ
KONSTRUKCYJNĄ — dodatkowe żebra, okucia, usztywnienie — a tego nie modelujemy.
**„Ciężki” znaczy fizycznie grubszą i cięższą wersję TEJ SAMEJ konstrukcji: więcej
tego samego materiału, nic poza tym.**

⛔⛔ **Konsekwencja ważniejsza niż sama nazwa:** skoro wariant to wyłącznie „więcej
materiału”, **wariantowi ciężkiemu NIE WOLNO dać własnej właściwości** — żadnej
odporności na odrzut, przebicia bloku ani bonusu sytuacyjnego. Jego efekt wychodzi
wyłącznie osiami, które już istnieją (masa, PP, `reduction`, trwałość, `swingMul`,
stamina, wymagania, cena — §1.6 checkpointu). Cecha konstrukcyjna to byłby
„wzmocniony” wprowadzony tylnymi drzwiami.

⚠ **Gatunek drewna NIE jest osią** (decyzja autora 2026-09-16). Materiał to
`drewno`; dąb, lipa i jesion **nie mnożą katalogu** i nie wchodzą do modelu.
Określenie „dębowa” jest opisem potocznym, nie parametrem.

### Puklerz (9)
**Drewniany puklerz** · Ciężki drewniany puklerz · **Żelazny puklerz** ·
Ciężki żelazny puklerz · **Stalowy puklerz** · Ciężki stalowy puklerz

### Tarcza okrągła (9)
**Drewniana tarcza okrągła** · Ciężka drewniana tarcza okrągła ·
**Żelazna tarcza okrągła** · Ciężka żelazna tarcza okrągła · **Stalowa tarcza
okrągła** · Ciężka stalowa tarcza okrągła

### Tarcza rycerska (9)
**Drewniana tarcza rycerska** · Ciężka drewniana tarcza rycerska ·
**Żelazna tarcza rycerska** · Ciężka żelazna tarcza rycerska ·
**Stalowa tarcza rycerska** · Ciężka stalowa tarcza rycerska

### Tarcza migdałowa (4)
**Drewniana tarcza migdałowa** · Ciężka drewniana tarcza migdałowa ·
**Żelazna tarcza migdałowa** · Ciężka żelazna tarcza migdałowa

### Tarcza legionowa (6)
Lekka drewniana tarcza legionowa · **Drewniana tarcza legionowa** ·
Lekka żelazna tarcza legionowa · **Żelazna tarcza legionowa** ·
Lekka stalowa tarcza legionowa · **Stalowa tarcza legionowa**

### Pawęż (2)
**Drewniana pawęż** · Ciężka drewniana pawęż

---

## 6. Jakość — oś EGZEMPLARZA, nie definicji

⛔ **Jakość NIE mnoży katalogu.** `ItemInstance.quality` już działa, a
„Etapy katalogu" mówi wprost: *„× 7 jakości — **jakość jest DARMOWA**"*. Wyliczanie jakości jako definicji byłoby **mieszaniem
odpowiedzialności** modelu `Construction → Material → Quality → Variant`.

```
30 definicji  ×  7 poziomów jakości  =  210 możliwych egzemplarzy
                                        (Q1–Q4 z półki, Q5–Q7 nigdy z półki)
```

Pilnuje tego zamek §J3 w `tools/tarcze_przymiar.mjs`: *definicje w `ITEMS` nie
niosą `quality`*.

---

## 7. Mapowanie materiału na `armorType`

⛔ **Żadnego materiału „wood"** — decyzja zamknięta, nowa kolumna
`ARMOR_PROFILE` to nowa decyzja balansowa.

| materiał katalogu | `armorType` | uzasadnienie |
|---|---|---|
| drewno | `leather` | korpus z klepek obciągnięty surową skórą — tak stoi dzisiejszy `buckler` i checkpoint nazywa to **poprawnym, nie zaszłością** |
| żelazo | `metal` | okucie / umbo / lite |
| stal | `metal` | ⚠ **ta sama gęstość co żelazo** (§1.3) — różnica idzie w `durability`, cenę i grubość wykonania, **nie w profil typów** |

Pilnuje zamek §T3: `ARMOR_PROFILE` nie ma kolumny „wood", a tarcze używają
wyłącznie istniejących kolumn.

---

## 8. Co pozostaje otwarte

| id | rzecz | blokuje |
|---|---|---|
| **`P1`** | pomiar rozkładu kątów — **narzędzie gotowe, próbka niezebrana** | `B3` |
| **`B3`** | wartości `sideArcDeg` per konstrukcja | `T-1`, krok 7 |
| **`B2`** | luka PP i łuku Legionowa ↔ Pawęż. ⚠ `D-T2` **zawęża** ją (Pawęż nie musi wygrywać `sideArcDeg`), ale **nie zamyka** — to decyzja autora | krok 7 |

### ✅ Zamknięte 2026-09-16 — decyzje OBOWIĄZUJĄCE

| id | decyzja | moc |
|---|---|---|
| **`B1`** | wariant cięższy nazywa się **„ciężki”**; ⛔ „wzmocniony” ODRZUCONE (sugeruje inną właściwość konstrukcyjną). Nazwy w §5 są FINALNE. ⛔ Wariant nie dostaje własnej właściwości. ⚠ Gatunek drewna nie jest osią | **ACTIVE** |
| **`B4`** | ✅ **TAK — wariant ciężki kosztuje więcej** (więcej materiału i/lub nakładu pracy). ⭐ Cena jest **WYLICZANA, nie wpisywana**: `buyPrice × materialPriceMul × variantPriceMul × qualityPriceMul` — czwarty czynnik w istniejącym iloczynie, analogicznie do gatunku i jakości. ⛔ **Zero ręcznych cen dla 30 pozycji.** ⭐ Punkty obrony wariantu wychodzą z tego samego modelu (materiał/konstrukcja + wariant), nie z ręcznego strojenia 30 wpisów. ⏳ **Wartość `variantPriceMul` POZOSTAJE OTWARTA** — to balans ekonomii, nie ta decyzja | **ACTIVE** |

---

⛔ **Żadna z nich nie blokuje `T-5`**, który jest jedynym krokiem
implementacyjnym niezależnym od `P1` — patrz `docs/tarcze_checkpoint.md` §4.

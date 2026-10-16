---
typ: DECYZJA
domena: [stamina, items]
tytul: Model D — dwie osie, parametry startowe do playtestu
stan: zamkniety
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/Equipment.ts
  - src/core/Stamina.ts
  - src/entities/Player.ts
  - GameConfig.EQUIPMENT_LOAD
otwarte: [OI-102, OI-104, OI-105]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Model D — dwie osie obciążenia

> **Rozstrzyga** `OI-103` (jaki ma być model obciążenia po wdrożeniu warstw)
> oraz `OI-101` (nasycenie kary).
>
> ⛔ **Nie rozstrzyga niczego w `src/` — kod jest nietknięty.** To decyzja
> projektowa plus **parametry startowe**, nie wdrożenie.
>
> **Pomiary i wrażliwość:** `docs/audyt_obciazenia_kalibracja_2026-09-15.md`.
> **Poprzednik:** `docs/audyt_obciazenia_i_warstw_2026-09-14.md`.

---

## 1. ZASADA NADRZĘDNA

> # ⭐⭐ Siła może kompensować względny WYSIŁEK, ale nie kompensuje bezwzględnej MASY.

Wszystko poniżej jest wyłącznie konsekwencją tego zdania. Jeżeli kiedykolwiek
któryś parametr zacznie mu przeczyć, **błędem jest parametr, nie zasada.**

Praktyczny test tej zasady — jedno pytanie do zadania każdej przyszłej zmianie:
**czy dostatecznie wysoka Siła sprawia, że 75,5 kg porusza się jak 12 kg?**
Odpowiedź musi brzmieć **nie**, przy każdej wartości Siły, na zawsze.

---

## 2. CO ROZSTRZYGNIĘTO — architektura trzech kanałów

| kanał | wisi na | Siła kasuje? | dlaczego tam |
|---|---|---|---|
| **prędkość ruchu** | `kg` (bezwzględna) | ⛔ **NIE** | masa to masa; płaci ją każdy, w każdej sekundzie gry |
| **regeneracja staminy** | `kg` (bezwzględna) | ⛔ **NIE** | to jest „szybciej się męczę" — i ⭐ **nie tyka burstu** |
| **koszt uniku i sprintu** | `ratio = kg / udźwig` | ✅ **TAK** | to jest „Siła pozwala to nosić" |

**Cztery konsekwencje, które są częścią decyzji, nie jej skutkiem ubocznym:**

1. ⭐ **Koszt zamachu (`STAMINA.costs.autoAttackPerSecond`) zostaje NIETKNIĘTY.**
   Ciężki wojownik uderza tak samo mocno i tak samo szybko od pierwszej
   sekundy — po prostu nie odrabia. To jest cała mechanika „kilku pierwszych
   ciosów": burst identyczny, wydolność gorsza.
2. **Kara jest CIĄGŁA na wszystkich trzech kanałach.** Etykiety
   `Lekkie / Średnie / Ciężkie` zostają wyłącznie jako **nazwy dla HUD** nad
   wartością ciągłą — ten sam wzorzec, co `STAMINA.states`.
3. **Oś wysiłku nie ma sufitu.** To zamyka `OI-101`: dziś `ratio` 0,91 i 1,82
   karzą identycznie (mnożnik 1,50); po zmianie rozróżnia je ×2,07.
4. **Udźwig dostaje malejący przyrost powyżej Siły 20.** Poniżej — bez zmian,
   więc całe dzisiejsze strojenie zostaje nietknięte.

---

## 3. PARAMETRY — ⚠ STARTOWE, NIE SYSTEMOWE

> ## ⚠⚠ To są wartości DO PIERWSZEGO PLAYTESTU, nie stałe systemu.
>
> ⛔ **`speedK` w szczególności NIE jest decyzją na zawsze.** Jest najlepszą
> wartością, jaką da się wyliczyć **bez ręki na gałce** — i tyle. Zmiana tej
> liczby po playteście **nie wymaga nowej decyzji**; zmiana architektury z §2
> wymaga.

```
OŚ WZGLĘDNA (ratio) — Siła kasuje
  effortFreeRatio = 0,55          (= dzisiejsze mediumAbove)
  effortPerRatio  = 0,9           ⛔ BEZ SUFITU
  udźwig = 20 + 2,5 × STR                    do STR 20
         = 70 + 1,0 × (STR − 20)             powyżej

OŚ BEZWZGLĘDNA (kg) — Siła NIE kasuje
  speedMul = max(0,68 ; 150 / (150 + max(0 ; kg − 10)))
  regenMul = max(0,55 ; 100 / (100 + max(0 ; kg − 10)))
```

⭐ **Kształt `K/(K+x)` jest ten sam, co `d/(d+K)` w `core/Protection.ts`** —
projekt tę krzywą już ma i rozumie. To nie jest nowa matematyka.

**Trening ciężkiego pancerza — trzy rangi, 1 + 2 + 3 = 6 pkt:**

| ranga | pkt | zdejmuje |
|---|---|---|
| I — Nawyk ciężaru | 1 | −30% kary **REGENERACJI** |
| II — Oddech | 2 | −35% osi **WYSIŁKU** |
| III — Chód w żelazie | 3 | −25% kary **RUCHU** |

⭐ Σ6 pkt = **dokładnie tyle, co pełne Mastery I–IV na jedną rodzinę broni.**
Ciężki pancerz jako specjalizacja ma kosztować tyle, co opanowanie jednej broni.

⛔ **Ceny złota rang są OTWARTE i świadomie NIE są częścią tej decyzji.**
Ekonomia złota należy do `OI-46`. Liczby, które padły w analizie
(400 / 1200 / 2500 g), są **szkicem bez kotwicy pomiarowej** — nie cytuj ich
jako rozstrzygnięcia.

---

## 4. CO ODRZUCONO — i dlaczego

### ⛔ 4.1 Model C z audytu 2026-09-14 (jego własna rekomendacja)

Model C wiesza **wszystkie trzy kanały na `ratio`**. Zmierzone: **60 kg przy
Sile 40 daje `ratio 0,50 < 0,55`, czyli `nad = 0`, czyli ruch ×1,00, unik
×1,00, atak ×1,00 — pełna płyta całkowicie za darmo.**

Model C powstał, zanim postawiono zasadę z §1, i **tej zasady nie spełnia**.
Model D zachowuje z niego wszystko, co dobre (rozdział kanałów, ciągłość, trzy
etykiety nad wartością ciągłą, podłoga chroniąca grywalność) i przenosi kanał
ruchu na oś bezwzględną. ⚠ To jest **jedna zmiana w Modelu C**, nie czwarty
model od zera.

⛔ **Nie wracaj do Modelu C ani do Modeli A/B z tamtego audytu.**

### ⛔ 4.2 Liniowa oś ruchu

Pierwsza wersja Modelu D proponowała `1 − 0,005 × kg`. **Nie przeszła
kalibracji:** prosta nie potrafi jednocześnie dać strzelcowi darmowego progu
i trafić obu przecięć z fauną — wymagała progu swobodnego ~1,4 kg, czyli
karania od pierwszego kilograma. ⛔ **Nie wracaj do osi liniowej.**

### ⛔ 4.3 Kanał prędkości ATAKU (proponowany przez Model C)

Kara do tempa ataku uderza dokładnie w burst, który ma zostać zachowany
(§2 pkt 1). Kanał regeneracji robi to samo zadanie od drugiej strony — bez
psucia pierwszych ciosów.

### ⛔ 4.4 Trening za ~15 punktów

**Budżet życiowy postaci to 49 punktów** (`skillPointsPerLevel: 1`,
`maxLevel: 50`) na cztery atrybuty, naukę umiejętności i rangi Mastery.
15 punktów = **31% budżetu życiowego i 107% ceny całego drzewa 11 umiejętności
(14 pkt)**. Najdroższa umiejętność w grze kosztuje 3 pkt.
⛔ **Nie wracaj do skali kilkunastu punktów.**

### ⛔ 4.5 Ratowanie ciężkiego zestawu przez podnoszenie Siły

Zmierzone: przy Sile 70 **107 kg mieści się dziś w klasie „Lekkie"**.
Dosypywanie Siły jest mechanizmem, który tę wadę wyprodukował.

---

## 5. CO PRZESĄDZIŁO — pomiar

`speedK = 150` **nie został wybrany, tylko wymuszony z dwóch stron** przez
prędkości stworzeń zapisane w `GameConfig`:

| speedK | przecięcie z Szarym (132) | z watahą (115) | ze skoczkiem (96) | werdykt |
|---|---|---|---|---|
| 100–120 | 24–26 kg | 40–47 kg | **66–78 kg** | ⛔ łamie niezmiennik „odejście zawsze działa"; 30–40 kg przestaje być używalne |
| **150** | **30,5 kg** | **55,7 kg** | **94,4 kg** | ✅ |
| 180–220 | 35–40 kg | **65–77 kg** | 111–134 kg | ⛔ 62 kg nadal odchodzi od watahy — ekstremum przestaje kosztować |

⭐ **Progi wypadają na prędkościach realnych stworzeń, nie na okrągłych
liczbach** — to jedyna kotwica tej kalibracji, która nie jest gustem.

---

## 6. CO ZOSTAJE OTWARTE

| # | rzecz | dokąd |
|---|---|---|
| **OI-105** | ⭐ **playtest parametrów startowych** — 62 kg · 75,5 kg · 75,5 kg + ranga III · relacja do watahy (115) i Szarego (132) | nowa pozycja |
| **OI-104** | wdrożenie Modelu D w kodzie | nowa pozycja |
| ~~OI-96~~ | ✅ **ZAMKNIĘTE 2026-09-15** — rekomendacja z §7 przyjęta: pełna masa | `docs/decyzje/2026-09-15-masa-schowanego-zestawu.md` |
| **OI-102** | trzy pętle zakładają jeden przedmiot na slot | `decyzje/2026-09-12-taksonomia-pancerza.md` D3 |
| **OI-46** | ceny złota rang treningu | `docs/systemy/economy.md` |

⚠ **Ta decyzja NIE zamyka pytania „czy warstwowanie jest OP".** `eHP ×4,00`
przy 62 kg pochodzi z punktów ochrony, nie z masy — żadna rozsądna kara
mobilności tego nie spłaca. To zostaje w `OI-98` i w `tarcze_checkpoint.md`
§1.10, gdzie sufit 75% już dziś wyrzuca nadwyżkę.

⚠ **Kara ruchu mnoży się z siecią sieciarza** (`slowFactor 0,55`): przy 75,5 kg
daje 57 px/s. Unik jako odpowiedź działa dalej (stały dystans w stałym czasie).
Pozycja na playtest, nie do przestrojenia z góry.

---

## 7. `weapon2` / `offhand2` — REKOMENDACJA, nie decyzja

⛔ **Nie implementować bez osobnej akceptacji autora.** `OI-96` zostaje otwarte.

**Stan faktyczny.** `STOW_SLOTS` są poza `EQUIP_SLOTS`, więc schowany zestaw
waży zero. Komentarz w `core/Equipment.ts` nazywa to wprost: *„To, że schowana
broń nie WAŻY, jest DŁUGIEM, a nie tezą"* — i podaje spłatę: *„jedna pętla po
`STOW_SLOTS` w `equippedWeight`"*. Powodem odroczenia było to, że **obciążenie
było niestrojone**; ten warunek znika razem z tą decyzją.

**Rekomendacja: PEŁNA MASA (×1,0).** Trzy powody:

1. **Zero nowych stałych.** Mnożnik `0,5` wymagałby uzasadnienia, którego nie ma.
2. **Linia w tym projekcie przebiega „na sobie ↔ w plecaku", nie „w rękach ↔
   nie w rękach".** Schowany zestaw ma własny kafel na lalce, bo jest na ciele.
3. **Koszt jest czytelny, nie zabójczy** — zmierzone 2–11 px/s zależnie od
   zestawu i bazy.

⚠ **Znana asymetria, którą ta rekomendacja ODSŁANIA, a nie tworzy:** przedmiot
w **plecaku waży zero** (świadoma decyzja, `docs/inventory_scroll_ux.md` §3).
Zapasowy młot w plecaku będzie więc tańszy od tego samego młota w `weapon2` —
to cena za wygodę sparowanej zamiany jednym kliknięciem. Musi zostać nazwana,
zanim ktoś odkryje ją jako „błąd". Zapisane przy `OI-96`.

⚠ **Zmierzony efekt uboczny do świadomego przyjęcia:** pełna masa potrafi
**przenieść build przez próg fauny** — 25 kg + młot i tarcza na plecach schodzi
ze 136 na 127 px/s, czyli przestaje odchodzić od Szarego.

**Wariant zapasowy**, jeżeli drugi zestaw przestanie być używany:
`stowedWeightFactor = 0,5` jako jedna stała w tym samym bloku, strojona jak
`speedK`.

---
typ: DECYZJA
domena: [save, armor, items]
tytul: Zapis warstw pancerza — płaska kotwica + opcjonalna mapa warstw
stan: zywy
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/Save.ts
  - src/core/ArmorLayers.ts
  - GameConfig.ITEMS
otwarte: [OI-98]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Zapis warstw pancerza

## Co zostało rozstrzygnięte

**Warstwy wchodzą do zapisu jako OPCJONALNA mapa `layers?` obok istniejących,
płaskich pól slotów. `SAVE_VERSION` NIE rusza się.**

```ts
layers?: Partial<Record<
  "head" | "chest" | "legs" | "boots",
  Partial<Record<"L1" | "L2" | "L3", StoredEquip>>
>>;
```

## Reguły

1. **`layers?` jest OPCJONALNE.** Zapis bez niego wczytuje się dokładnie jak dziś.
2. **Mapa ma WYŁĄCZNIE cztery klucze**: `head`, `chest`, `legs`, `boots`.
3. **Warstwy nazwane `L1` / `L2` / `L3`** — ⛔ **nie tablica**.
4. **`layers[area]` ma PIERWSZEŃSTWO przy odczycie.** Gdy jest obecne, pole
   płaskie jest ignorowane.
5. **Brak `layers[area]` → fallback do pola płaskiego**, a warstwa wyprowadzana
   przez `itemLayer()`.
6. **`offhand`, `weapon`, `stowed` (`weapon2`/`offhand2`) i ręce (`gloves`)
   zostają POZA mapą warstw.**
7. ⛔ **`SAVE_VERSION` bez zmian** — warunek `data.version !== SAVE_VERSION`
   nadal przepuszcza każdy istniejący zapis.
8. ⚠ **Downgrade do starego builda jest STRATNY** — §4.

## Kotwica płaska: NAJBARDZIEJ ZEWNĘTRZNA warstwa

**`equipment[slot]` = `L3` → `L2` → `L1`**, pierwsza obecna.

```
L1 = gambeson · L2 = mail_hauberk · L3 = steel_chest
⇒ equipment.chest = steel_chest
⇒ layers.chest = { L1: gambeson, L2: mail_hauberk, L3: steel_chest }
```

⚠ **Kotwica POWTARZA element z mapy — to nie jest nadmiarowość, tylko cena
kompatybilności.** Prawdą jest `layers[area]` (reguła 4); kotwica istnieje
wyłącznie dla builda, który mapy nie zna.

### ⛔ Dlaczego NIE „najwyższe PP"

- **PP nie może definiować semantyki zapisu** — zapis opisuje, co postać nosi,
  nie ranking ochrony.
- **Reguła nie może zależeć od balansu**: przestrojenie jednej liczby
  zmieniłoby znaczenie pola w zapisanych plikach.
- **Warstwa jest własnością KONSTRUKCJI**, nie wynikiem porównania.

## ⛔ Dlaczego NIE „slot = L2"

Pierwszy proponowany kierunek brzmiał *„slot → item L2, `layers?` → reszta"*.
**Odrzucony — skasowałby wyposażenie po cichu.**

⚠⚠ **Dzisiejszy slot NIE trzyma L2. Trzyma to, co gracz nosi**, a `itemLayer()`
wyprowadza warstwę z materiału: `padded`→L1, `leather`/`mail`→L2, `metal`→L3.
Postać w `steel_chest` ma dziś w slocie przedmiot **L3**. Przyjęcie „slot = L2"
przeklasyfikowałoby kirys na podkład i pozwoliło dołożyć drugi L3 — **bez
błędu i bez śladu**.

## Jak czyta się STARY zapis

```
chest: "steel_chest"
  → layers?.chest === undefined
  → readEquipped("steel_chest") → ItemInstance (Zwykła, pełna trwałość)
  → itemLayer("steel_chest") = L3
  ⇒ { L1: null, L2: null, L3: steel_chest }
```

⭐ **Dokładnie to, co gracz miał, w warstwie, do której ten przedmiot należy.**
Zero reinterpretacji, zero utraty.

## Downgrade — jawnie przyjęta strata

Stary build czytający NOWY zapis zobaczy **tylko kotwicę** (jedną sztukę na
obszar) i przy swoim następnym zapisie **utraci pozostałe warstwy**.

⛔ **Świadomie NIE budujemy mechanizmu zachowującego pola nieznane staremu
buildowi.** Koszt takiego mechanizmu (przepisywanie nietkniętych gałęzi JSON-a
przy każdym zapisie) jest nieproporcjonalny do scenariusza, który zdarza się
przy cofnięciu wersji gry.

## Piąta droga tą samą ścieżką

Zapis rósł addytywnie już: `endurance→vitality`, `stamina`, `quickSlot`,
`ring1`/`ring2`, `offhand`, `gloves`, `amulet`, `stowed`, `bags`.
**Ani razu nie kosztowało to postaci.** `layers?` idzie tą samą drogą.

## Czego ta decyzja NIE rozstrzyga

- ⛔ **Runtime `Equipment`** — jak warstwy są trzymane w pamięci (osobny audyt).
- ⛔ **`EquipmentSnapshot`** — kształt ładunku zdarzenia.
- ⛔ **`slotForItem` / `accepts` / `equipFromBag`** — adresowanie slot+warstwa.
- ⛔ **`setProgressFor`** — próg zestawu spełniany przez jeden obszar w trzech
  warstwach (luka `D4`, odłożona świadomie).
- ⛔ **Cap i krzywa redukcji** — `OI-24`, osobna decyzja.

## ⚠ Dług nazwany przy okazji

**`itemLayer("ironbound_shield")` zwraca dziś `L3`**, choć `offhand` nie jest
obszarem warstwowanym — warstwa wyprowadza się z materiału, a tarcza jest
`metal`. Reguła 6 wyklucza to strukturalnie w ZAPISIE; w runtime `itemLayer`
nadal odpowiada na pytanie, którego nie powinno się jej zadawać.

---
typ: DECYZJA
domena: [ui, economy, items]
tytul: Sklep — kupiec | gracz | karta, kafle po obu stronach, zakładki Kup·Odkup i Plecak·Na sobie
stan: zywy
moc: ACTIVE
data: 2026-10-13
kotwice:
  - src/ui/ShopLayout.ts
  - src/ui/ShopPanel.ts
  - src/ui/ShopDetails.ts
  - src/ui/ItemCard.ts
  - tools/sklep_uklad.mjs
  - tools/karta_przedmiotu.mjs
  - tools/phone_render_shop.json
  - GameConfig.SHOP.buybackMarkup
otwarte: []
zastepuje: [docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md]
zastapione-przez: null
aktualizacja: 2026-10-13
---

# Sklep — kupiec | gracz | karta (etap E)

## Co rozstrzygnięto

> **Ekran handlu ma TRZY kolumny: kupiec | gracz | karta.** Obie kolumny
> przedmiotów to TE SAME kafle (68 j., gabaryt `1×2`, cena na kaflu) i każda
> ma dwie zakładki: kupiec **Kup | Odkup**, gracz **Plecak | Na sobie**.
> Karta jest zadokowana po prawej, z przyciskiem i kwotą w prawym dolnym
> rogu. Naprawa należy do rzeczy gracza. Menu boczne rozmowy ma w Handlu same
> ikony.

Kolejne decyzje autora z 2026-10-13, każda po zrzucie 1:1 z telefonem
(`node tools/phone_render.mjs tools/phone_render_shop.json`):

| # | decyzja | odrzucone | dlaczego |
|---|---|---|---|
| 1 | towar kupca = **KAFLE** | lista wierszy (ikona, nazwa, cena) — rekomendacja researchu (`docs/research/ui_shop_research.md`, R4) | autor: „lista, kiedy ekwipunek jest w slotach, może być nieintuicyjna — te widoki odpowiadają przedmiotom"; zrzut A/B lista ↔ kafle → kafle |
| 2 | kupiec i plecak **NARAZ**, karta trzecią kolumną | zakładki Kup / Sprzedaj / Odkup / Naprawa nad jedną siatką | autor: „zmieścilibyśmy plecak, widok kupca i kartę w trzech kolumnach — byłoby o wiele łatwiej" |
| 3 | ten sam przełącznik po obu stronach: **Kup·Odkup** i **Plecak·Na sobie** | Naprawa jako zakładka kupca | autor: „po stronie gracza taki sam tabulator — ekwipunek i plecak"; naprawa przeszła do rzeczy gracza, liczba zakładek nie zależy od kupca (2 + 2) |
| 4 | ⛔ **bez „Sprzedaj surowce"** | przycisk sprzedaży zbiorczej surowców | autor: surowce posłużą kiedyś do wyrobu; zbiorcza sprzedaż czeka na typ „złom" (daleka przyszłość) |
| 5 | menu boczne w Handlu **same ikony**, w rozmowie podpisy | podpisy wszędzie | autor: „usunięcie etykiet miało dotyczyć tylko sklepu, żeby zyskać miejsce"; w rozmowie trzeba czytać |
| 6 | E3: **Cofnij do końca rozmowy (1:1) + Odkup z narzutem** | okna „Czy na pewno?" | decyzja z `docs/ui_mobile_research.md` §8; narzut `SHOP.buybackMarkup` = 10% (BDO), parametr do playtestu |

## Liczby (S21 FE, panel 1109×556 j.)

| element | cztery kolumny (09-19) | trzy kolumny (10-13) |
|---|---|---|
| kafel kupca / plecaka | 62 j. (< 68) | **68 j.** (norma dotyku) |
| skala ikony w kaflu | ×2 przy 70 j. | **×2** (margines 4 j. — jak panel gracza) |
| karta | 270 j. | **421 j.** (ciało obok podglądu) |
| tekst | 10–14 px | role `TYPE` (nazwa 21, tekst 18, drugi plan 15) |
| sylwetka | stały blok ZAŁOŻONE 62 j. | widok „Na sobie", kafel 68 j. |

## Co zostaje w mocy z 2026-09-19

Model karty (`ItemCard` — jeden model, dwa renderery), wiersz tożsamości
(„Tarcza · Druga ręka"), kody warstw poza ekranem, podgląd w kształcie
gabarytu, porównanie przypięte nad akcją i pisane strzałką `nowe → noszone`
z kolorem korzyści, gabaryt niesie POLE, okna o całkowitej liczbie wierszy,
pomoc pod ⓘ (osiem haseł autora). Zmieniło się: układ kolumn, sylwetka jako
widok, porównanie z OBOMA zestawami (D10), lista Odkupu.

## Koszty, o których trzeba wiedzieć

- **Wąska karta** (421 j. na S21 FE, 356 j. na telefonie 16:9): przy dwóch
  zestawach jeden blok porównania naraz + przełącznik „Zestaw I | Zestaw II".
- **Przeciągania między kolumnami nie ma** — sprzedaż i kupno to dotknięcie
  + przycisk na karcie. Do dołożenia, jeśli playtest pokaże potrzebę.
- **Odkup żyje w pamięci sceny UI** (nie w zapisie) — po wczytaniu gry lista
  jest pusta. Świadome: to siatka na pomyłkę, nie schowek.
- **Zestaw II nie ma kafla w „Na sobie"** (ręce = para w rękach); naprawia
  go „Napraw wszystko", sprzedaż wymaga przełożenia w panelu gracza.

## Gdzie to pilnowane

`tools/sklep_uklad.mjs` (ramki ekranu, kafel ≥ 68 j., sylwetka pokrywa
`EQUIP_SLOTS`, skala ikon `I3`/`I4`), `tools/karta_przedmiotu.mjs` (§P —
D10, rzecz noszona bez porównania), `tools/sklep_cofniecie.mjs` (atomowe
cofnięcie), `tools/panel_fit.mjs` (§L — sklep i karta na rolach tekstu).

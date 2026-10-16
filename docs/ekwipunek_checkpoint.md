---
typ: HISTORIA
domena: items
tytul: Checkpoint — ekwipunek, warstwy, katalog pancerza
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# CHECKPOINT — ekwipunek (2026-09-11 … 2026-09-12)

> ⛔ **HISTORIA — to NIE jest punkt wejścia** (przeklasyfikowane 2026-10-11).
> Migawka wątku z dnia w nazwie; punkt wejścia: `docs/current.md`. Stan wątku ekwipunku z 2026-09-15 — nie wie o modelu C ani o `S10`.
> Dawne zapowiedzi „punktu wejścia" niżej opisują tamten dzień.

> **Po co ten plik.** Punkt wejścia dla kolejnej sesji: **gdzie jesteśmy w wątku
> ekwipunku i co jest następne.** Nie opisuje mechanik — te mieszkają
> w `docs/systemy/` i w decyzjach, a ten plik tylko wskazuje.
>
> ⛔ **Nie czytaj stąd stanu repozytorium — SPRAWDŹ GO:**
> `git log --oneline -3 && git status --short`. Ten sam baner, co
> w `docs/dziennik.md`, i z tego samego powodu: proza o stanie drzewa
> zestarzała się w tym projekcie ósmy raz.
>
> ⚠ **Zasada bez zmian: nie commituj bez polecenia.**
>
> ⭐ **Wątek TARCZ ma od 2026-09-15 własny checkpoint:
> `docs/tarcze_checkpoint.md`** — sześć konstrukcji, materiały, jakość,
> warianty i kolejność implementacji. Ten plik zostaje przy ekwipunku
> i pancerzu.

---

## 1. Gdzie jesteśmy

Trzy etapy zamknięte, czwarty zaczęty.

| etap | stan | zapis |
|---|---|---|
| **Fundament UI ekwipunku** | ✅ zamknięty | `decyzje/2026-09-11-ekwipunek-fundament.md` |
| **Taksonomia pancerza** | ✅ zamknięta | `decyzje/2026-09-12-taksonomia-pancerza.md` |
| **Decyzje D1–D4** | ✅ zamknięte | tamże |
| **Katalog pancerza** | 🔄 **w toku — partia 1 z 2 wdrożona** | `dziennik.md` 2026-09-12 (2) |
| **Katalog testowy broni** | ⏳ zaproponowany, niezatwierdzony | `dziennik.md` 2026-09-12 (2) |

## 2. Co jest zamknięte i NIE wraca bez konkretnego powodu

⛔ **`coverage` NIE POWSTANIE.** Bez pokrycia ciała, bez hit location, bez stref
trafień. **Brak `coverage` przestał być argumentem przeciwko wariantom
konstrukcyjnym** — ta pomyłka wróciła w analizie trzy razy, zanim autor ją
unieważnił. Nie wracaj do niej.

⛔ **Nie otwieraj ponownie D1–D4** (moc `ACTIVE`):
- **D1** — `requires.strength` nie sumuje się między warstwami
- **D2** — `defenseK = 50`, `maxDefenseReduction = 0,75`, bez zmian
- **D3** — obciążenie ODŁOŻONE; progi `0,55 / 0,90` **nie są** finalnym balansem
- **D4** — `set` ⊥ `layer`, zero powiązania

⛔ **Premie zestawów są celowo PUSTE** (`bonus: {}`) — warstwowanie i zestawy to
dwie różne mechaniki i nie stroi się ich naraz.

⛔ **Trzy warstwy, nazwane pozycyjnie** (`L1`/`L2`/`L3`), kolczuga = L2. Model
czterowarstwowy z nazwami materiałowymi został usunięty 2026-09-12 i nie wraca.

## 3. Stan katalogu

```
pancerz           32 sztuki (było 23)
warstwy (4 obszary)   L1 5 · L2 11 · L3 9
broń              11 sztuk, 15 wariantów ataku  (bez zmian)
```

Docelowo taksonomia przewiduje **25 konstrukcji** w czterech obszarach
warstwowanych; wdrożone jest **19**. Tabela stosu jest generowana —
`docs/ekwipunek_przedmioty.md`, blok `AUTO:stos`.

## 4. Pierwsze kroki następnej sesji

**Wybór należy do autora — obie ścieżki są gotowe do startu.**

### A. Druga partia pancerza (6 konstrukcji)

Zostało z taksonomii: **nagolennice segmentowe** (nogi L3, rodzina „szyna";
⚠ nazwa zmieniona 2026-09-16 z *nagolenice szynowe* — wyłącznie etykieta),
oraz pięć pozycji wymagających wcześniejszej decyzji (§5).

### B. Katalog broni — ✅ ZREALIZOWANY INACZEJ (2026-09-16)

⛔ **Ten akapit wskazywał ŹRÓDŁO, którego nie ma, i był tak czytany przez
cztery dni.** Stało tu, że siedmiopozycyjny katalog testowy (maczuga bojowa ·
kord · dzida · kij bojowy · halabarda · szeroki nóż · tarcza okrągła) jest
„zaproponowany i policzony”, a pełne uzasadnienie każdej pozycji leży
w `docs/dziennik.md`, wpis 2026-09-12 (2). **Tamten wpis dotyczy generatora
warstw i dziewięciu PANCERZY — nie ma w nim ani jednej broni.** Liczby istniały
wyłącznie „w rozmowie sesji”, czyli nie istniały.

⭐ Zakres wykonano 2026-09-16 w innym kształcie: **dziesięć konstrukcji** (kord ·
tasak · szabla · rapier · bastard · miecz dwuręczny · pika · halabarda · glewia ·
kiścień) razem z osią **materiału broni** i parametrem **`minReach`**.
Uzasadnienie każdej liczby stoi przy niej w `GameConfig.ts`; bieżący roster
czyta się z `docs/ekwipunek_przedmioty.md` (generowanego).

⚠ **Nauka warta zapamiętania:** wskaźnik „pełne uzasadnienie jest tam” zestarzał
się szybciej niż treść, do której wskazywał. Propozycja bez zapisu nie jest
propozycją.

⚠ **Broń ma dziś trzy osie z JEDNYM punktem danych** (`interrupts` tylko przy
Sile 6, `knockback` idealnie skorelowany z `interrupts`, `critChanceBonus`
na jednym przedmiocie) — dopóki tak jest, żaden wniosek z playtestu walki nie
da się przypisać do przyczyny.

## 5. Decyzje czekające przed dalszą rozbudową

| # | decyzja | blokuje |
|---|---|---|
| **OI-100** | czy domykamy trójkąt typów obrażeń piątym PROFILEM (łuska) | ⚠ **już NIE blokuje istnienia łuski i lamelki** — obie rodziny weszły do katalogu 2026-09-16 jako **`L3` na istniejącym profilu `metal`** (7 sztuk). `OI-100` zostało zawężone do jednego pytania: czy łuska dostanie WŁASNĄ kolumnę `ARMOR_PROFILE` |
| — | czy hełm zamknięty dostanie koszt percepcji | drugą oś hełmów |
| — | czy powstanie pancerz kierunkowy (przód vs przód+tył) | parę napierśnik/kirys jako różnicę mechaniczną |
| **OI-98** | warstwowanie jako MECHANIKA (dziś `layer` to metadana) | cały stos jako grywalny system |
| ~~OI-103~~ | ✅ **ZAMKNIĘTE 2026-09-15 — Model D, dwie osie** (`kg` → ruch i regeneracja · `ratio` → wysiłek). ⛔ **Przestało blokować OI-98.** Wdrożone (`OI-104`, zamknięte 2026-09-15); zostaje **playtest parametrów startowych (`OI-105`)** | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| ~~OI-101~~ / **OI-102** | ✅ `OI-101` zamknięte (oś wysiłku bez sufitu) · ⏳ `OI-102` otwarte: trzy pętle po `EQUIP_SLOTS` | wdrożenie OI-98 |

⚠ **OI-100 nie jest decyzją o pancerzu, tylko o WALCE** — domknięcie trójkąta
odbiera cięciu rolę generalisty, a cięcie płaci za nią najwyższymi surowymi
obrażeniami w drabince broni.

## 6. Dług, który powstał w tych sesjach

- ⚠ **Kontrola wizualna nowych ikon NIEWYKONANA.** Browser pane nie renderował
  (okno w tle), więc dziewięć nowych pancerzy nie zostało obejrzanych w plecaku
  ani w sklepie. Wszystko poza renderem zweryfikowane.
- ⚠ **`padded_gloves` i `leather_gloves` mają identyczne punkty i masę** —
  rękawice są slotem bez warstw, więc ich sztuki konkurują jako alternatywy
  i muszą różnić się liczbami, nie tylko profilem. Stan sprzed tych sesji.
- ⚠ **Kirys (17 kg / Siła 5 / 130 g)** wchodzi w trzy miejsca bez precedensu:
  najcięższy przedmiot w grze, pierwsza bramka Siły 5 w pancerzu, cena powyżej
  krzywej materiału. Świadomy kandydat do strojenia.
- ⚠ **Filtr plecaka ma przyciski 40 j. wysokości** przy normie 68 (OI-95).

## 7. Gdzie czego szukać

| pytanie | dokument |
|---|---|
| ⭐ czy warstwowanie nie będzie OP, i co z obciążeniem | `audyt_obciazenia_i_warstw_2026-09-14.md` |
| jak działa przedmiot, warstwa, zestaw | `systemy/items.md` |
| jak ochrona zamienia się w mniejsze obrażenia | `systemy/armor.md` |
| gdzie przedmiot leży, pojemność, odmowy | `systemy/inventory.md` |
| drugi zestaw broni, dwuręczność | `systemy/weapons.md` |
| liczby rosteru (generowane) | `ekwipunek_przedmioty.md` |
| dlaczego układ panelu wygląda tak | `decyzje/2026-09-11-ekwipunek-fundament.md` |
| dlaczego pancerz ma trzy warstwy | `decyzje/2026-09-12-taksonomia-pancerza.md` |
| co jest otwarte | `zadania.md` |
| co się działo | `dziennik.md`, wpisy 2026-09-11 (3) i 2026-09-12 (1)(2) |

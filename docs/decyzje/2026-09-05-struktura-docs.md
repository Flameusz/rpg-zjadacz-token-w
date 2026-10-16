---
typ: DECYZJA
domena: proces
tytul: docs/ dostaje podkatalogi, płaski eksport robi narzędzie
stan: zamkniety
moc: ACTIVE
data: 2026-09-05
kotwice: [tools/doc_export.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Struktura `docs/` vs płaska paczka na zewnątrz

**Rozstrzyga `OI-4`** zgłoszone w `docs/DOC_CONTRACT.md`.

## Rozstrzygnięcie

> **`docs/` dostaje podkatalogi zaprojektowane pod użyteczność projektu.
> Płaski eksport rozwiązuje NARZĘDZIE, nie struktura katalogu.**

## Sytuacja, która to wymusiła

`docs/README.md` niesie sekcję „Jeżeli analizujesz tylko tę paczkę": katalog
bywa pakowany **płasko** (`docs/*.md` + `docs/*.json`, bez podkatalogów)
i wysyłany do oceny zewnętrznej. Ograniczenie transportowe zaczęło projektować
strukturę — argument „nie róbmy podkatalogów, bo paczka się zepsuje" jest
argumentem narzędzia przeciw czytelnikowi.

## Co odrzucono i dlaczego

**A. Płaskie `docs/` na stałe.** ⛔ Odrzucone: audyt 2026-09-05 pokazał, że
przy 78 dokumentach indeks przestał nadążać za samym sobą (twierdził „51
dokumentów"). Horyzont to 150–300 dokumentów.

**B. Kopiowanie drzewa „na płasko" przy eksporcie.** ⛔ Odrzucone z powodu
**kolizji nazw**: docelowa struktura ma `etapy/las/00_stan.md` i
`etapy/walka/00_stan.md`, które dają ten sam plik. Rozwiązaniem kolizji jest
przemianowanie, a przemianowanie zrywa łącza wewnątrz treści — czyli
naprawiamy transport, psując zawartość.

**C. Wysyłanie całego katalogu.** ⛔ Odrzucone: prawdziwe użycie to wysłanie
**dziedziny** („oceń nasz model staminy"), nie repozytorium. Cały katalog to
3,2 MB, czyli więcej, niż recenzent przeczyta.

## Co przyjęto

`tools/doc_export.mjs` skleja wybrany zakres w **jeden samodzielny plik**:
wygenerowany spis treści, kotwice zamiast ścieżek, doklejona kalibracja
z `README.md` i — najważniejsze — **jawna lista tego, czego w paczce NIE MA**.

Domyślnym zakresem jest jedna domena (`--domena items`).

## Dwie reguły, które to utrzymują

1. ⚠ **Żaden dokument nie może zależeć od swojego położenia w drzewie.**
   Łącza pisze się ścieżką od korzenia repo (`docs/systemy/items.md`), nigdy
   względną (`../decyzje/…`). Wtedy każde pakowanie jest bezpieczne, a
   przeniesienie pliku nie wymaga przepisywania cudzych łączy.
2. ⚠ **Eksport wymienia to, czego nie zawiera.** Dotychczasowa paczka milczała
   o `CLAUDE.md`, o regułach przy kodzie i o pięciu checkpointach z korzenia
   repo — recenzent dostawał odwołania do plików, których nie widział, i nie
   miał jak odróżnić „to jest poza paczką" od „to jest martwe łącze".

## Co zostaje otwarte

- Ostateczny układ podkatalogów projektuje **Etap 4**; ta decyzja mówi tylko,
  że wolno je mieć.
- Eksport nie obsługuje dziś `docs/*.json` ani grafik z `docs/img/` — jeśli
  paczka będzie ich potrzebować, to osobna zmiana w narzędziu.

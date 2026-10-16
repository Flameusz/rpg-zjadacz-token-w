---
typ: DECYZJA
domena: proces
tytul: SYSTEM jest dokumentem, CONTENT jest danymi
stan: zamkniety
moc: ACTIVE
data: 2026-09-05
kotwice: [tools/katalog_ekwipunku.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# SYSTEM jest dokumentem. CONTENT jest danymi.

## Rozstrzygnięcie

> **`STAN` opisuje SYSTEM. Konkretne elementy, które z tego systemu korzystają,
> są DANYMI — nie dostają własnych dokumentów `STAN`.**

**`STAN` opisuje:**

- reguły systemu,
- strukturę danych (jakie pola element może nieść i co każde robi),
- zależności i **granice domeny**,
- niezmienniki,
- **sposób, w jaki content korzysta z systemu**.

**Elementy CONTENT** — miecze, topory, włócznie, umiejętności, konkretne
przedmioty, stworzenia, NPC-e, przepisy, zioła — **nie otrzymują osobnego
dokumentu `STAN` tylko dlatego, że istnieją.** Ich parametry i rekordy
pozostają w danych i w zestawieniach `GENEROWANE`.

## Wyjątek — jeden, wąski

> Jeżeli dodanie konkretnego elementu **doprowadziło do powstania, zmiany albo
> odkrycia reguły SYSTEMU**, dokumentujemy **tę zmianę** jako `DECYZJA` albo
> `HISTORIA` — **nigdy jako osobny `STAN` tego elementu.** Parametry elementu
> i tak zostają w danych.

Trzy warstwy na jednym przykładzie:

| zdanie | warstwa |
|---|---|
| „Włócznia ma zasięg 98" | **CONTENT / dane** → `GENEROWANE` |
| „Włócznia ujawniła, że próg trafienia to zasięg + 35% rozmiaru celu" | **DECYZJA** |
| „Jak działa wyznaczanie zasięgu trafienia dla wszystkich broni" | **STAN** systemu |

⚠ **Zasada dotyczy ODPOWIEDZIALNOŚCI dokumentu, nie nazw katalogów.**
Nie wynika z niej żadna konkretna taksonomia domen ani układ drzewa.

## Dlaczego — dowód, nie hipoteza

Ten podział **już działa w tym repozytorium** i jest najzdrowszą częścią
dokumentacji: `ekwipunek_mechanika.md` (reguły, pisane ręcznie) obok
`ekwipunek_przedmioty.md` (**61 przedmiotów, zero dokumentów per przedmiot**,
generowane z konfigu). Ekstrakcja domeny `items` nie znalazła w tym podziale
ani jednej wady — wszystkie dziewięć rozjazdów dotyczyło warstwy reguł.

**Argument rozstrzygający — skalowanie.** Content rośnie bez ograniczeń,
systemy nie. Gdyby content stawał się dokumentami, **liczba dokumentów
śledziłaby liczbę elementów gry** i przy kilkuset elementach wróciłby dokładnie
ten problem, który ta reorganizacja naprawia — tylko w większej skali. Przy tym
podziale katalog systemów zostaje przy ~26 plikach **niezależnie od tego, ile
gra ma zawartości**.

Dodatkowo:

- **Koszt tokenów.** Projektując 81. umiejętność agent czyta jeden plik reguł
  i przeszukuje jedną tabelę — zamiast przeglądać 80 nagłówków, żeby znaleźć trzy istotne.
- **Projektowanie nowego.** Potrzebna jest **siatka luk** („gdzie nowy element
  czegoś nie zdubluje"), a ta jest **generowalna z tabeli** i niemożliwa do
  wyprodukowania z 80 osobnych dokumentów.
- **Zależności.** Graf ma wtedy ~26 węzłów-systemów zamiast setek liści. Mapa
  zależności między 80 umiejętnościami byłaby nieczytelna i nikt by jej nie otworzył.

## Co odrzucono

⛔ **Dokument `STAN` na element contentu** (np. plik na umiejętność, plik na
broń). Odrzucone z powodów powyżej. ⚠ Ta propozycja **padła w tej samej sesji
z mojej strony** — zaproponowałem katalog z plikiem na umiejętność, podczas gdy
dwie sekcje wyżej ta sama dziedzina traktowała 61 przedmiotów jako jedną
tabelę. Niespójność wychwycił autor. Zapisane, bo taka propozycja wróci.

## Znane ryzyko tej decyzji

⚠ **Ciężar utrzymania przenosi się z dokumentów na GENERATORY.** Jeśli nowa oś
mechaniki nie zostanie nauczona generatora, zestawienie zacznie **po cichu
zmyślać** — reguła zapisana już w `tools/CLAUDE.md`. Projekt ma dziś jedną
otwartą usterkę tej klasy: `OI-7` (niestabilny wynik przymiaru katalogu
ekwipunku). **To jest dobra wymiana, ale nie darmowa.**

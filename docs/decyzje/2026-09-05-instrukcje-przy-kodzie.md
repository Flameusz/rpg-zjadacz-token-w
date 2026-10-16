---
typ: DECYZJA
domena: [proces, architecture]
tytul: src/*/CLAUDE.md zostają poza kontraktem, ale wchodzą pod przymiar
stan: zamkniety
moc: ACTIVE
data: 2026-09-05
kotwice: [tools/doc_check.mjs, src/core/CLAUDE.md]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Status zagnieżdżonych `CLAUDE.md`

**Rozstrzyga `OI-6`** zgłoszone w `docs/DOC_CONTRACT.md`.

## Rozstrzygnięcie

> **`src/*/CLAUDE.md` i `tools/CLAUDE.md` (~93 KB) zostają instrukcjami przy
> kodzie — POZA kontraktem dokumentacji, bez nagłówka maszynowego.
> Ale WCHODZĄ pod `tools/doc_check.mjs` i obowiązuje je jedna reguła graniczna.**

Reguła graniczna (zapisana w `docs/DOC_CONTRACT.md` §2.7):

> Instrukcja przy kodzie może opisywać **regułę** i **niezmiennik**, ale nie
> może być jedynym miejscem, w którym opisana jest **mechanika**. Tam, gdzie
> dotyka mechaniki, wskazuje `STAN` swojej domeny zamiast go streszczać.

## Co odrzucono i dlaczego

**A. Wciągnięcie ich do kontraktu jako pełnoprawnych dokumentów.** ⛔ Odrzucone,
trzy powody:

1. **Inny mechanizm dostarczania.** Ładują się automatycznie przy `Read`/`Edit`
   pliku z danego katalogu. Odbiorcą jest agent piszący kod, nie ktoś pytający
   „jak działa gra". To inna czynność i inny format.
2. **Przeniesienie zerwałoby ładowanie**, a zostawienie na miejscu z nagłówkiem
   maszynowym dokłada metadane do **każdej** sesji kodowej — czyli koszt
   tokenowy tam, gdzie nie ma odbiorcy.
3. **Domena `architecture` dostanie własny `STAN`.** Reguły przy kodzie są
   wobec niego podrzędne, nie konkurencyjne. Dwa dokumenty opisujące tę samą
   architekturę rozjeżdżają się zawsze — projekt ma na to bliznę (`AGENTS.md`
   jako druga kopia `CLAUDE.md`, zamarzła po ośmiu dniach).

**B. Zostawienie ich całkowicie poza jakąkolwiek kontrolą.** ⛔ Odrzucone —
powód jest zmierzony, nie teoretyczny.

## Pomiar, który przesądził część „ale wchodzą pod przymiar"

`src/core/CLAUDE.md` (wiersze 113–116) twierdzi:

> „Obciążenie … dotyka dokładnie dwóch rzeczy: kosztu uniku i kosztu sprintu.
> Trzeci konsument wchodzi razem z uzasadnieniem, nie »bo pasuje«."

`src/core/Progression.ts:444` czyta **trzeciego** konsumenta:

```ts
const lightBonus = Equipment.loadMultiplier <= 1.0 ? DEFENSE.dodge.lightLoadBonus : 1;
```

Zgłoszone niezależnie jako `D-8` w `docs/systemy/combat.md`.

⚠ **To jest streszczenie mechaniki w pliku, który ładuje się automatycznie do
każdej sesji dotykającej `src/core/`** — czyli najgorsze możliwe miejsce na
nieaktualne zdanie. Instrukcja przy kodzie starzeje się tak samo jak dokument,
tylko czyta ją więcej sesji i nic jej dotąd nie sprawdzało.

## Znane ograniczenie tego rozstrzygnięcia

⚠ **Przymiar sprawdza ISTNIENIE symboli, nie prawdziwość zdań.** Powyższy
przykład („dokładnie dwóch rzeczy") **nie zapala się** w `doc_check.mjs`, bo
nie cytuje nieistniejącego symbolu — cytuje istniejące pola i wyciąga z nich
nieaktualny wniosek. Pierwszy przebieg po objęciu tych plików przymiarem dał
w nich **zero** znalezisk `§S`/`§P`.

Wniosek: objęcie ich przymiarem jest **konieczne, ale niewystarczające**.
Regułę graniczną z §2.7 egzekwuje się przy Canon Extraction domeny
`architecture`, nie skryptem.

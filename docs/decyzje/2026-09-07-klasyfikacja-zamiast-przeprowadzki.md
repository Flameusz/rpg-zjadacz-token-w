---
typ: DECYZJA
domena: proces
tytul: Migrację domykamy klasyfikacją w miejscu, nie przeprowadzką plików
stan: zamkniety
moc: ACTIVE
data: 2026-09-07
kotwice: [tools/doc_check.mjs, tools/doc_export.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---

# Migracja `docs/` domyka się klasyfikacją, nie przeprowadzką

**Rozstrzyga „Etap 4/5"** zapowiedziany w `docs/DOC_CONTRACT.md` §13 i w
`docs/decyzje/2026-09-05-struktura-docs.md` („ostateczny układ podkatalogów
projektuje Etap 4").

## Rozstrzygnięcie

> **Rolą dokumentu jest jego `typ`, nie katalog, w którym leży.** Zaległe
> dokumenty dostały nagłówki maszynowe **w miejscu**. Nowe podkatalogi
> powstają tylko tam, gdzie dokumenty i tak powstają seriami
> (`systemy/`, `proces/`, `decyzje/`). ⛔ Żaden istniejący plik nie został
> przeniesiony ani przemianowany.

Stan po zamknięciu: **136 dokumentów w `docs/`, każdy z `typ`/`domena`/`stan`**
— zero bez klasyfikacji: 25 `STAN`, 5 `KANON`, 6 `DECYZJA`, 59 `HISTORIA`,
2 `GENEROWANE`, 39 `OPERACYJNE`.

## Co odrzucono i dlaczego

**A. `docs/historia/` + przeprowadzka ~58 plików.** ⛔ Odrzucone **pomiarem**:
census odwołań pokazał, że **każdy** dokument w `docs/` jest cytowany przez co
najmniej dwa inne pliki, a czołówka po kilkadziesiąt (`odlozone.md` 61,
`dziennik.md` 41, `swiat.md` 40, `wioska_plan.md` 37). Przeprowadzka wymusiłaby
poprawienie łączy **wewnątrz dokumentów `HISTORIA` i `DECYZJA`** — a te są
z kontraktu **niezmienne i tylko dopisywane** (§2.3, §2.4). Czyli: żeby uzyskać
ładniejsze drzewo, trzeba by złamać najmocniejszą regułę tego systemu.
Zysk byłby kosmetyczny, koszt — utrata niezmienności.

**B. Kasowanie „starych" dokumentów.** ⛔ Odrzucone: żaden z 78 zaległych plików
nie okazał się pusty znaczeniowo. Nawet dokumenty w całości nieaktualne
(`architektura.md`, `assety.md`, `ZADANIE_drzewa.md`) niosą **pomiary
i odrzucone warianty**, których nie ma nigdzie indziej — a projekt ma to
zapisane jako regułę („nie usuwaj historii; dokumenty `_ocena` są jedynymi
nośnikami pomiarów, które obaliły wcześniejsze modele").
**Usunięto zero plików.**

**C. Nowy typ dokumentu na „materiał roboczy".** ⛔ Odrzucone — kontrakt §2
mówi wprost, że siódmy typ osłabia regułę utrzymującą cały system. Notatki
z `art-review/` to `HISTORIA` domeny `assets` i nic więcej.

## Co przy okazji wyszło i zostało naprawione

⚠⚠ **Przymiar dokumentacji był na maszynie autora ślepy od chwili powstania.**
`tools/doc_check.mjs` sprawdzał `tresc.startsWith("---\n")`, a autor pracuje na
Windowsie z `core.autocrlf=true` — **na dysku każdy plik ma CRLF**. Skutek:
raport drukował `z nagłówkiem maszynowym 0 / 147`, a reguły **§N, §K, §Z i §R
nie miały czego sprawdzać**. Awaria była całkowicie cicha: sekcja bez nagłówków
wygląda dokładnie tak samo jak sekcja bez uwag.

To jest ten sam błąd, przed którym ostrzega `tools/CLAUDE.md` — „asercja, która
nie potrafi zaświecić na czerwono, jest dekoracją" — tylko w wersji, w której
asercja **miała** zdolność świecenia i straciła ją przez środowisko. Dlatego
sabotaż dostał **próbę na nagłówek z CRLF**; bez niej ta awaria wróci przy
pierwszym `git clone` na Windowsie.

Przy okazji: **rozmiar dokumentu liczy się po normalizacji końców linii.**
Bajty `\r` dodawały ~2–3% i same potrafiły przewrócić plik przez limit z §8.

## Zmiana surowości reguły §R — świadoma i wąska

> **Przekroczenie limitu rozmiaru jest BŁĘDEM tylko dla `STAN`.**
> Dla `KANON`, `DECYZJA` i `OPERACYJNE` to OSTRZEŻENIE.

Podstawa: kontrakt czyni limit **warunkiem odbioru** wyłącznie w §7, a §7
dotyczy wyłącznie dokumentu `STAN`. Dla pozostałych typów §8 podaje liczbę, ale
nie robi z niej bramki.

⚠ **To nie jest wyciszenie.** Sześć dokumentów przekracza dziś swój limit
(`prompty_gemini.md` 127 KB, `wioska_plan.md` 71 KB, `swiat.md` 49 KB,
`mapy.md` 44 KB, `odlozone.md` 37 KB, `referencje_zewnetrzne.md` 32 KB,
`konfiguracje_broni_checkpoint.md` 22 KB) i
**każdy z nich jest wypisany w raporcie z nazwy przy każdym przebiegu**.
Cięcie ich to praca nad treścią — kolejność narzuca §8 — i **należy do autora**,
bo dotyczy tego, co w świecie gry zostaje, a co znika. ⛔ Nie tnij ich „przy
okazji" innej sesji.

## Co zostaje otwarte

- **`OI-1`** — indeks nadal utrzymywany ręcznie. Po tej sesji da się go
  wygenerować z nagłówków; nikt tego jeszcze nie zrobił.
- **Osiem dokumentów ponad limitem §8** (lista wyżej) — czeka na decyzję o cięciu.
- **`OI-3`** — pięć `PROJECT_CHECKPOINT_*.md` nadal leży w korzeniu repo.
- **`OI-7` i `OI-40`** — oba dokumenty `GENEROWANE` są nieodświeżone i przymiar
  świeci na nie czerwono. ⛔ Regeneracja **nie jest** poprawką dokumentacji:
  `macierz_walki.mjs` zapisałby jedną z trzech możliwych odpowiedzi na `OI-40`
  jako fakt, a `katalog_ekwipunku.mjs` ma niestabilny wynik przymiaru.

---
typ: DECYZJA
domena: proces
tytul: Decyzja ma MOC niezależną od stanu dokumentu
stan: zamkniety
moc: ACTIVE
data: 2026-09-05
kotwice: [tools/doc_check.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Moc decyzji — pięć stanów normatywnych

## Rozstrzygnięcie

> **Dokument ma `stan` (cykl życia PLIKU). Decyzja ma `moc` (czy nadal
> OBOWIĄZUJE). To dwie niezależne osie i mylenie ich jest głównym sposobem, w
> jaki dokumentacja tego projektu wprowadzała w błąd.**

| `moc` | znaczenie |
|---|---|
| `ACTIVE` | nadal obowiązuje |
| `SUPERSEDED` | obowiązywała, została **zastąpiona** — pole `zastapione-przez` mówi czym |
| `REJECTED` | rozważona i **odrzucona** |
| `HISTORICAL` | opisuje stan lub decyzję z przeszłości, **bez obecnego znaczenia normatywnego** |
| `OPEN` | postawiona, **nierozstrzygnięta** |

## Problem, który to rozwiązuje

Dokument `DECYZJA` jest z założenia **niezmienny po zamknięciu** (kontrakt §2.3),
więc jego `stan` na zawsze zostaje `zamkniety`. Ale świat idzie dalej: mechanika
bywa przebudowywana i **decyzja poprawna w chwili T przestaje obowiązywać**,
mimo że plik nadal wygląda na zamknięty, zatwierdzony i finalny.

Bez osobnej osi jedynym sygnałem „to już nie obowiązuje" jest proza w środku
pliku — czyli dokładnie ten mechanizm, który w tym projekcie zawiódł wielokrotnie.

⚠ **Nazwa pliku nie jest dowodem mocy.** Ten projekt ma `bron_design_v1.md`
z odrzuconymi rekomendacjami i `las_faza1b_final.md` opisujący etap zamknięty
inaczej, niż zapowiadał. Słowa „final", „approved", „canonical", „docelowy"
opisują **intencję z chwili pisania**, nie stan dzisiejszy.

## Reguły

1. **`moc` jest wymagana w każdym dokumencie `DECYZJA`.**
2. ⚠ **Moc ocenia się względem AKTUALNEGO kodu i późniejszych decyzji**, nigdy
   względem tego, jak stanowczo dokument jest napisany.
3. ⚠ **`SUPERSEDED` wymaga wskazania następcy.** „Już nie obowiązuje, nie wiem
   dlaczego" to nie jest `SUPERSEDED`, tylko `OPEN`.
4. ⚠ **Zmiana mocy na `SUPERSEDED` / `REJECTED` NIE jest edycją decyzji** —
   zmienia się metadana, treść zostaje nietknięta. To jedyny wyjątek od
   niezmienności z §2.3 i istnieje właśnie po to, żeby treści nie ruszać.
5. **Nie uśredniaj kilku historycznych decyzji w jedną aktualną zasadę.**
   Jeśli nie da się ustalić, która wygrała — `OPEN` i wpis w `## Otwarte`.

## Co zachować przy oznaczaniu decyzji jako `SUPERSEDED`

Cztery rzeczy, wszystkie w pliku decyzji, żadna w `STAN`:

1. samą decyzję historyczną,
2. jej uzasadnienie **z chwili podjęcia**,
3. informację, czym została zastąpiona,
4. moment i źródło zastąpienia, o ile da się ustalić.

⚠ **Historycznego uzasadnienia NIE WOLNO przepisać jako uzasadnienia
dzisiejszego rozwiązania.** Nowy model ma własne powody albo nie ma żadnych —
i w drugim przypadku to jest znalezisko, nie luka do zapełnienia cudzym tekstem.

## Wpływ na `STAN`

`STAN` opisuje **wyłącznie obecny model**. Wolno mu wskazać „wynika z decyzji
X"; nie wolno mu przepisywać historii tej decyzji.

## Co odrzucono

⛔ **Kodowanie mocy w polu `stan` dokumentu** (np. `stan: nieobowiazujacy`).
Odrzucone: `stan` opisuje, czy plik będzie jeszcze edytowany, a `moc` — czy
treść wiąże. Dokument `zamkniety` z mocą `ACTIVE` i dokument `zamkniety`
z mocą `SUPERSEDED` to dwie zupełnie różne rzeczy dla czytelnika, a jedno pole
nie potrafi ich rozróżnić.

---
typ: DECYZJA
domena: proces
tytul: Dokumentacja walki opisuje stan, nie przebieg powstawania
stan: zamkniety
moc: ACTIVE
data: 2026-09-07
kotwice: [tools/doc_check.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---

# Dokumentacja walki opisuje STAN, nie przebieg powstawania

## Rozstrzygnięcie

> **Ośmiu domenom walki** (`combat`, `weapons`, `armor`, `shields`,
> `abilities`, `effects`, `stamina`, `proficiency`) **wystarczy dokument
> `STAN` + rejestr decyzji z ekstrakcji.** Analizy, checkpointy, pakiety do
> oceny zewnętrznej i relacje z wykonania **zostały USUNIĘTE** — 27 plików,
> ok. **1,1 MB** prozy.

Nie zostały przeniesione, zarchiwizowane ani przemianowane. **Usunięte.**
Historia jest w gicie i to jest jedyne miejsce, w którym ma być.

## Dlaczego

Dokumentacja tej gry odpowiadała na pytanie **„jak do tego doszliśmy"** dziesięć
razy dokładniej niż na pytanie **„jak to działa teraz"**. Sam `combat_v2_audyt`
to 92 KB, `bieglosc_checkpoint` 254 KB, `tarcze_analiza` 89 KB — a stan tych
mechanik mieści się w 15–19 KB dokumentu `STAN`, kotwiczonego w kodzie
i pilnowanego przymiarem.

⚠ **Koszt nie był hipotetyczny.** Agent wchodzący w domenę `combat` miał do
wyboru osiem dokumentów, z których każdy zaczynał się banerem tłumaczącym,
które jego akapity są martwe. Pytanie „jak działa blok" wymagało przeczytania
trzech plików i wiedzy, w którym z nich obowiązuje która wersja.

## Zasada, która z tego zostaje

> **Dokument opisujący, jak system wyglądał kiedyś, nie jest w tym projekcie
> aktywem.** Zapisujemy WERDYKT i powód; przebieg dochodzenia do niego zostaje
> w gicie.

⚠ Wyjątek jest jeden i wąski: **wiedza „sprawdziliśmy X i wiemy, dlaczego nie
chcemy tam wracać"**. Ta zostaje — ale jako jedno–dwa zdania w rejestrze
decyzji albo w `DECYZJI`, nigdy jako cały dokument.

## Co ocalono i gdzie

| wiedza | dokąd trafiła |
|---|---|
| werdykty i odrzucone warianty, per domena, z `moc` | rejestry w `docs/proces/ekstrakcja_<domena>.md` |
| wróg nie ma obrony → dwie cechy 2H są nieosiągalne | `docs/decyzje/2026-09-07-obrona-wroga-nie-istnieje.md` |
| próg zasięgu wobec krążącego celu i zakaz pasa ±2 px | `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` |
| pięć pytań playtestowych warstwy 2 | `docs/odlozone.md` §2 |
| Szarża jako model dzika · udźwig jako oś rozwoju · pancerz wielowarstwowy | `docs/pomysly.md` |

## Co odrzucono

⛔ **Przeniesienie ich do `docs/archiwum/`.** Odrzucone: archiwum, do którego
nikt nie zagląda, kosztuje dokładnie tyle samo uwagi przy każdym przeglądzie
katalogu, a git robi to lepiej i za darmo.

⛔ **Zachowanie „na wszelki wypadek".** Odrzucone: to jest domyślna odpowiedź,
która wyprodukowała obecny stan. Kryterium brzmi „czy bez tego ktoś podejmie
złą decyzję", nie „czy to może się kiedyś przydać".

⛔ **Skasowanie rejestrów ekstrakcji razem ze źródłami.** Odrzucone: to
jedyne miejsce, w którym stoi **co odrzucono i dlaczego** w formie krótszej niż
dokument źródłowy. ⚠ Nazwy usuniętych plików zostają w nich jako **atrybucja
źródła decyzji** i to nie są martwe łącza — to przypisy.

## Co zostaje otwarte

- ⚠ **Dokumenty `HISTORIA` spoza ośmiu domen walki nie były ruszane** i nadal
  cytują usunięte pliki (`zaimplementowane.md`, `dziennik.md`, `atrybuty.md`,
  `ekwipunek_mechanika.md`). Ich odwołania są **cytatami historycznymi**, nie
  łączami do czytania. Ta sama operacja dla innych dziedzin nie została
  wykonana i jest osobną decyzją.

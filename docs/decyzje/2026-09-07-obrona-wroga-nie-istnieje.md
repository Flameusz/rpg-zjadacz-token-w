---
typ: DECYZJA
domena: [combat, weapons]
tytul: Wróg nie ma obrony — dwie cechy tożsamości 2H są strukturalnie nieosiągalne
stan: zamkniety
moc: ACTIVE
data: 2026-09-07
kotwice:
  - src/core/Protection.ts
  - src/core/DamageResolver.ts
  - GameConfig.WEAPON_FAMILY
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---

# Wróg nie ma obrony — i dwie cechy 2H nie mają jak zajść

## Rozstrzygnięcie

> **Ścieżka gracz → wróg zna wyłącznie pancerz i typ obrażeń.** Po stronie
> stworzeń nie ma bloku, parowania ani stanu gardy — `Protection.guardZone`
> i pełny łańcuch obrony obsługują **tylko ciosy przychodzące do gracza**.
>
> ⛔ **Dlatego cechy „trudniejsza do zablokowania" i „trudniejsza do
> sparowania" NIE SĄ dziś możliwe do zbudowania** — nie jako trudne, tylko
> jako **niewidoczne**: nie ma czego przebijać.

## Dlaczego to jest zapisane osobno

Kierunek tożsamości broni dwuręcznej brzmi **commitment / impact** i wymienia
pięć cech. Trzy są dowiezione liczbami broni (wolniejsza, duże obrażenia,
większy zasięg). **Dwie pozostałe wracają w każdej rozmowie o 2H** — i za
każdym razem kosztują sesję, zanim ktoś odkryje, że nie mają adresata.

To ta sama blokada, która zatrzymała `uninterruptible`. **Zbudowanie obrony po
stronie wroga to nowy podsystem, nie „minimalny mechanizm".**

## Co z tego wynika przy projektowaniu

1. ⛔ **Nie dopisuj broni ani wariantowi pola, którego przeciwnik nie umie
   przeczytać.** Pole bez konsumenta świeci na zielono w każdym przymiarze
   i kłamie — projekt ma już trzy takie zaczepy w warstwie efektów (`OI-36`).
2. ⚠ **Defensywna połowa „commitment" JUŻ ISTNIEJE i nikt jej nie
   zaprojektował.** `Progression.parryChance` zwraca zero dla rodzin bez
   `parryBonus`, a ma go wyłącznie `sword`; `hands: 2` odbiera slot na tarczę.
   **Gracz z bronią dwuręczną traci całą warstwę obrony kierunkowej** — to jest
   commitment wyrażony po stronie obrony, emergentny z architektury, **bez ani
   jednej linijki kodu napisanej w tym celu**. Kto będzie stroił 2H, ma to już
   po swojej stronie wagi.
3. ⚠ **Roster ma wyjątek, który łamie regułę od strony jednoręcznej:** `Młot`
   (`hands: 1`) nosi parametry broni dwuręcznej. Domknięcie reguły „każda 2H
   sięga i bije mocniej niż każda 1H" znaczy ruszenie tej broni, czyli
   **rebalans rosteru** — osobna decyzja, świadomie nieotwarta.

## Co odrzucono

⛔ **Zaimplementować cechy 4–5 „na zapas", żeby zadziałały, gdy obrona wroga
powstanie.** Odrzucone: mechanika, której nie widać w grze, jest nieodróżnialna
od zepsutej i **nie da się jej zweryfikować playtestem** — a projekt przyjmuje,
że odczucia nie mierzy skrypt.

⛔ **Zastąpić je czymś „podobnym" po stronie ataku** (np. premią do przerwania
dla każdej 2H). Odrzucone: przerwanie jest własnością **konkretnej broni**,
nie konfiguracji rąk — globalna premia za trzymanie czegoś w dwóch rękach jest
w tym projekcie zakazana wprost.

## Co zostaje otwarte

- **Czy obrona po stronie wroga w ogóle powstanie** — nie rozstrzygnięte.
  Dopóki nie, cechy 4–5 zostają opisane jako nieosiągalne, nie jako zaległe.

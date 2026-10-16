---
typ: DECYZJA
domena: [ui]
tytul: Rozmowa z NPC — usługi jako wypowiedzi gracza, szyna usługi tylko z powrotem i pożegnaniem
stan: zywy
moc: ACTIVE
data: 2026-10-14
kotwice:
  - src/ui/ConversationSheet.ts
  - src/ui/NpcDialog.ts
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-14
---

# Rozmowa z NPC — usługi jako wypowiedzi gracza

## Co rozstrzygnięto

> **Rozmowa ma wyglądać jak rozmowa, nie jak zakładki** (autor 2026-10-14).
> Usługi (Handel, Zadania, Szkolenie, Mistrzostwo) są wierszami w kolumnie
> odpowiedzi, sformułowanymi jak słowa gracza. W otwartej usłudze szyna ma
> tylko imię rozmówcy, „‹ Rozmowa” i „Do widzenia”.

| usługa | wypowiedź gracza |
|---|---|
| Handel | „Pokaż, co masz na sprzedaż.” |
| Zadania | „Wróćmy do twoich zleceń.” (bez znacznika — „!”/„?” mają własne wiersze, D4) |
| Szkolenie | „Czego możesz mnie nauczyć?” |
| Mistrzostwo | „Chcę dalej ćwiczyć władanie bronią.” |

Zatwierdzone na szkicu „dziś / propozycja” w rozmowie z autorem; zdania są
propozycją agenta, którą autor przyjął razem z kształtem — wspólne dla
wszystkich rozmówców.

## Dopisek tego samego dnia: zdania zamiast przycisków (wariant A)

Autor: „to nie monolog — wiersze nie mogą być jednakowymi elementami
listy”. Wybrany wariant A ze szkicu (A / B z przebiegiem rozmowy): wiersz
kolumny to tekst bez ramki, z ikoną rodzaju i kreską pod spodem, tło pod
palcem; pożegnanie „Bywaj.” (także w szynie usługi). Wariant B (przebieg
kilku wymian w pasie) — odłożony do oceny po zagraniu.

## Co to zmienia w etapie C (2026-10-13)

Rama zostaje: kolumna rozmowy zwęża się do szyny, widok usługi stoi na lewo.
**Odchodzi**: blok kafli z rzeczownikami w kolumnie i zakładki wszystkich
usług w szynie (`docs/ui_mobile_research.md` §8 R3). Ze sklepu do nauki idzie
się przez rozmowę — o jeden dotyk więcej, świadomie: tak działa rozmowa.

## Odrzucone

- „Wróć do rozmowy” na kaflu szyny — nie mieści się (156 j. przy 134 j.,
  ostrzeżenie `[Rail]`); „‹ Rozmowa” trzyma umowny znak powrotu tej rozmowy
  („‹ Zmień temat”, „‹ Jeszcze nie”).
- Znacznik „!” przy przeglądzie zleceń — dubel wiersza „!” zlecenia (render).

## Otwarte

- Zdania własne dla jednej postaci (karczmarz: „Nalej mi czegoś”) — przyszłe
  pole w `NpcDef`, treść autora.
- Odpowiedź NPC przy wejściu w usługę — linia z danych, treść autora.
- Zakładka Zadania zniknie, gdy zadania wejdą do tematów (rozmowa z autorem
  2026-10-14).

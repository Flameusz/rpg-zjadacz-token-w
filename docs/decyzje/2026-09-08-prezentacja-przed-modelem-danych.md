---
typ: DECYZJA
domena: ui
tytul: Przebudowa rozmowy zaczyna się od PREZENTACJI, nie od modelu danych
stan: zamkniety
moc: ACTIVE
data: 2026-09-08
kotwice:
  - src/ui/ConversationSheet.ts
  - src/ui/NpcDialog.ts
  - src/core/Dialogue.ts
  - src/core/Npcs.ts
otwarte: [OI-87]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-08
---

# Przebudowa rozmowy zaczyna się od PREZENTACJI, nie od modelu danych

## Co rozstrzygnięto

> ⛔ **Model danych rozmowy zostaje NIETKNIĘTY do czasu sprawdzenia, ile daje
> sama zmiana prezentacji.**

Zostaje w obecnym kształcie, bez zmian: **`q → a`** · **`after`** ·
**globalne `asked`** · **`requiresQuest`** · **`requiresHerb`** ·
**powitania stanowe z nadpisaniem per quest** · **cały napisany content —
73 tematy co do słowa**.

⛔ **Nie budujemy dużego systemu dialogowego, dopóki nie wiemy, ile można
osiągnąć bez niego.**

## Powód — pomiar, który to przesądził

⭐⭐ **Struktura rozmowy JUŻ ISTNIEJE w danych; interfejs ją spłaszcza w chwili
renderowania.** Zmierzone skryptem na żywym `GameConfig` (2026-09-08):

| miara | wartość |
|---|---|
| tematów / NPC-ów | 73 / 19 |
| tematów z bramką `after` | **45 z 73 (62 %)** |
| **najszerszy front rozmowy w CAŁEJ grze** | **3 pytania** |
| NPC-ów z jednym tematem na wejściu | **18 z 19** |
| najgłębszy łańcuch (Patryczek) | **6 poziomów**, 10 z 11 tematów z bramką |

*Front* = tematy jednocześnie odblokowane i jeszcze niezadane.

Wniosek: **ktoś to napisał jako rozmowę.** Autor sam pisze wąsko — nigdy
więcej niż trzy realne kierunki naraz.

⚠⚠ **A `TopicPanel` woła `Dialogue.available()`, czyli wszystko, co
odblokowane — ŁĄCZNIE z już zadanym.** Front nigdy nie przekroczył 3, a panel
po kilku wizytach rysuje u Patryczka jedenaście wierszy z paskiem przewijania.
**Nagrodą za rozmowę z człowiekiem jest to, że zaczyna wyglądać jak wiki.**

⭐ **Funkcja licząca właściwy front już istnieje w kodzie:** `Dialogue.newCount()`
robi dokładnie `available ∧ ¬asked` — i napędza dziś **plakietkę z liczbą**,
a nie widok.

## Co ODRZUCONO i dlaczego

⛔ **Odrzucono (na tym etapie) budowę rozszerzeń modelu danych zaproponowanych
w audycie:** wariantów warunkowych `a`, pola `next` (kontynuacje w miejscu),
pola `close` (kwestia kończąca) oraz `requiresTopic` po stronie questa.

⚠ **To NIE jest odrzucenie merytoryczne — to odrzucenie KOLEJNOŚCI.** Wszystkie
cztery zostają jako **PROPOZYCJE dalszego rozwoju** i mogą wrócić. Powód
odłożenia:

1. **Nie wiadomo jeszcze, ile z problemu znika po zmianie samego renderowania.**
   Budowanie pól pod problem, który może się okazać mniejszy, jest płaceniem
   za nieznane.
2. **Ryzyko jest asymetryczne.** Zmiana prezentacji nie dotyka ani jednego
   z 73 tematów i jest odwracalna. Nowe pola w modelu danych zaczynają
   generować content, który trzeba będzie utrzymywać.
3. **Skala projektu.** Solo development bez voice actingu — najtańszy ruch
   o największym efekcie idzie pierwszy.

⛔ **Odrzucono także przebudowę architektury** (`NpcDialog` jako hub
z podwidokami, własność pauzy, jeden kontrakt „wstecz" dla `E`/`Escape`/
Android Back, warunkowe wiersze). Ta maszyneria jest sprawna i nośna; sklep,
trener i Mastery naprawdę powinny być panelami.

## Czego ta decyzja NIE rozstrzyga

⚠ **Nie rozstrzyga, czy hub `Handel / Zadania / Rozmowa / Szkolenie /
Mistrzostwo` zostaje.** Audyt zarekomendował wariant, w którym hub zostaje
ekranem funkcji, ale rozmowa staje się wejściem — **to jest PROPOZYCJA, nie
decyzja.** Otwarte jako `OI-87`.

⚠ Nie rozstrzyga rozmiaru ani układu panelu rozmowy (kierunek
„duży / prawie pełnoekranowy" jest propozycją do następnej sesji).

⚠ Nie rozstrzyga docelowego rytmu rozmowy ani tego, kiedy quest ma z niej
wynikać.

⚠ Nie dotyczy TREŚCI wypowiedzi — regułę długości niesie osobna decyzja
z tego samego dnia (domena `quests`).

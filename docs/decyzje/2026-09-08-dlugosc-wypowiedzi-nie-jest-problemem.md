---
typ: DECYZJA
domena: quests
tytul: Długość wypowiedzi NPC nie jest problemem — jej zamknięcie jest
stan: zamkniety
moc: ACTIVE
data: 2026-09-08
kotwice:
  - src/config/GameConfig.ts
  - src/core/Npcs.ts
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-08
---

# Długość wypowiedzi NPC nie jest problemem — jej zamknięcie jest

## Co rozstrzygnięto

> ⭐ **Wypowiedź NPC ma być tak długa, jak wymaga tego jej znaczenie — ani
> krótsza, ani dłuższa. Wolno jej mieć kilka zdań. Nie wolno jej być
> ZAMKNIĘTĄ.**

Test do zastosowania przy pisaniu: **kiedy NPC skończy mówić, czy gracz ma co
zrobić z tym, co właśnie usłyszał?** Jeśli jedyną dostępną akcją jest wybór
niezwiązanego tematu z listy — to jest wykład, choćby miał dwa zdania.
Sześciozdaniowa opowieść zakończona zaczepką jest rozmową.

⛔ **Nie dzielimy istniejących dobrych wypowiedzi po to, żeby zwiększyć liczbę
tur.** Krótki dialog nie jest z definicji lepszy od długiego.

## Co ODRZUCONO i dlaczego

⛔ **Odrzucono rekomendację „rozbić monologi", postawioną w audycie tej samej
sesji na kryterium DŁUGOŚCI** (mediana odpowiedzi 298 znaków / 6 zdań uznana
za „za długą jak na rozmowę").

Powód odrzucenia — decyzja autora, poparta pomiarem, który wskazał **inną
przyczynę tego samego objawu**:

1. **Kryterium długości produkuje dialog-wydmuszkę.** Wymuszony rytm
   *„jedno zdanie → klik → jedno zdanie → klik"* zwiększa liczbę tur i
   **zmniejsza** treść. Sztucznie pocięty dobry tekst jest gorszy niż ten sam
   tekst w całości.
2. **Pomiar wskazał właściwą zmienną.** Zliczono zakończenia wszystkich 73
   wypowiedzi NPC w grze: **0 z 73 (0 %) kończy się pytaniem albo zaczepką
   skierowaną do gracza.** Znak „?" pada gdziekolwiek w 16 odpowiedziach —
   w żadnej na końcu. **Każda wypowiedź w grze jest terminalna.**
3. Wniosek: objawem był „monolog", ale przyczyną nie jest liczba zdań, tylko
   **brak wyjścia z wypowiedzi**. Po zdaniu ostatnim jedyną możliwą akcją jest
   powrót do indeksu tematów.

⛔ **Odrzucono też przeciwny skrajny wariant** — „skoro długość nie szkodzi, to
niech rosną". Filler, powtórzenia, rozwlekanie i informacje bez funkcji
usuwamy dalej; zakaz dotyczy **cięcia po długości**, nie redakcji.

## Pomiar, który to przesądził

Zmierzone skryptem na żywym `GameConfig` (2026-09-08), 73 tematy / 19 NPC-ów:

| miara | wartość |
|---|---|
| mediana odpowiedzi NPC | **298 znaków / 6 zdań** |
| najdłuższa odpowiedź | 699 znaków |
| mediana kwestii gracza | 33 znaki |
| stosunek objętości NPC : gracz | **≈ 9 : 1** |
| **odpowiedzi kończących się pytaniem do gracza** | **0 z 73 (0 %)** |

⚠ **Stosunek 9:1 zostaje odnotowany jako objaw, NIE jako cel do zbicia.**
Naprawą nie jest „niech NPC mówi mniej", tylko „niech gracz ma gdzie
powiedzieć". Proporcja 5:1 przy realnych kwestiach gracza jest lepsza niż 2:1
przy pustych.

## Co z tego zostaje otwarte

- **Czym konkretnie jest „otwarcie" wypowiedzi** — pytanie do gracza, zaczepka,
  zawieszenie, cisza? To jest rzemiosło pisarskie i rozstrzyga się je tekstem
  po tekście, nie regułą.
- **Ile wypowiedzi w ogóle powinno mieć otwarcie.** Zero procent jest
  ewidentnie za mało; sto procent byłoby manierą.
- **Czym technicznie realizuje się kontynuację** — patrz
  `docs/decyzje/2026-09-08-prezentacja-przed-modelem-danych.md`; ta decyzja
  mówi wyłącznie o TREŚCI i obowiązuje niezależnie od tego, jak zostanie
  wyświetlona.

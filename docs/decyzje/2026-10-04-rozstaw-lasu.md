---
typ: DECYZJA
domena: [world]
tytul: Rozstaw lasu — większa mapa, przejście między każdą parą pni, polana pod spawnem
stan: zamkniety
moc: ACTIVE
data: 2026-10-04
kotwice:
  - tools/forest_clearance.py
  - tools/portale.py
otwarte: [OI-165]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-04
---

# Rozstaw lasu — większa mapa, przejście między każdą parą pni, polana pod spawnem

> **Decyzja autora, 2026-10-04**, po grze: „chciałbym móc powalczyć zamiast
> przeciskać się między drzewami, żeby dostać się do wilków (…) możemy oddać
> przestrzenie, powiększając mapę, zwiększając odległość od drzew tak, by każda
> istota mogła na spokojnie przejść, ale ich liczba symulowała skalę obszaru".
>
> ⚠ **Otwiera ponownie etap „LAS — ART / WORLD DESIGN = CLOSED"**
> (`docs/forest_rebuild_scope.md`, 2026-08-31). Tamto zamknięcie dopuszczało
> powrót wyłącznie z konkretnym błędem z działającej gry — ten jest właśnie
> taki: walka w lesie jest dysfunkcyjna, a stworzenia blokują się na pniach.

## 1. Co było nie tak — zmierzone, nie odczute

`tools/forest_clearance.py` na mapie sprzed zmiany (160×60, 1595 drzew):

| miara | przed |
|---|---|
| prześwit pień–najbliższy pień (mediana) | **16 px** — 88% drzew ma sąsiada bliżej niż 30 px |
| wolne koło na chodliwym lądzie (mediana) | 32 px; r ≥ 100 px na **9%** lądu |
| spawny z polaną (pień ≥ 120/180 px) | **1 z 26** — wilk stał 8 px od pnia |
| pościg sfory: klatki „goni, ale stoi" | **28–40%** |

Niedźwiedź i Szary mają 48 px ciała, wilki krążą na 96 px
(`WOLF.pack.circleRadius`). W takim lesie ani jedno, ani drugie nie miało prawa
działać — to nie była kwestia strojenia AI.

## 2. Co postanowiono

1. **Mapa ×1,5 w obu osiach** (160×60 → **240×90**). Teren nie jest skalowany
   kaflami: maski wody, piasku i dróg są przepróbkowane gładko i ułożone od
   nowa kompletem blob 47. Piasek liczony jako **obwódka wody** (tak jest
   w źródle), drogi przy bramie mają 4 kafle — szerokość PARZYSTA, jak wymaga
   `tools/portale.py`.
2. **We wnętrzu żadne dwa pnie bliżej niż 84 px** (środek–środek, prześwit
   ~68 px). Odstęp **idzie za gęstością źródła**: gdzie las był gęsty, stoi
   gaj (84 px); gdzie rzadki, odstęp rośnie do 200 px. ⛔ Jeden odstęp na całą
   mapę dawał SAD — widać to było na pierwszym podglądzie.
3. **Pas 3 kafli przy krawędzi mapy to ściana lasu** (odstęp 50 px) — tam nikt
   nie przechodzi, a to on niesie wrażenie „las ciągnie się dalej".
4. **Polana pod każdym spawnem wroga**: brak pnia w promieniu 180 px od wilka
   i Szarego, 120 px od reszty. Woda i brzeg przy spawnie są projektem
   (niedźwiedź przy brodzie, lis nad rzeką) i się nie liczą.
5. **Skalę obszaru niosą krzewy, nie pnie.** Krzewy nie mają kolizji, więc
   dosiano ich pod drzewami (286 → **601**). Pnie: 1595 → **1017**
   (≈ 505 w pasie skraju, ≈ 512 we wnętrzu).
6. Grupy wrogów (sfora) i osada myśliwego przesunięte **sztywno** — odległości
   nośne (wycie, ognisko–kupiec) zostają jak były. Reszta obiektów ×1,5,
   rekwizyty lądowe zepchnięte z dróg i wody, flora wodna dosunięta do nowego
   brzegu.

## 3. Wynik

| miara | przed | po |
|---|---|---|
| mapa | 160×60 | **240×90** |
| prześwit we wnętrzu (minimum) | 1 px | **84 px** (asercja) |
| wolne koło (mediana) | 32 px | **57 px** |
| r ≥ 100 px | 9% | **16%** |
| spawny z polaną | 1/26 | **26/26** |
| pościg sfory „goni, ale stoi" | 28–40% | **0–4%** |

## 4. Jak tego pilnować

`python tools/forest_clearance.py` — kod wyjścia 1, gdy są
złamane reguły z §2 pkt 2 i 4. **Przebiegnij po każdej ręcznej zmianie drzew albo spawnów w Tiled.**
Na mapie sprzed zmiany zgłasza 1362 błędy, na obecnej 0 — asercja potrafi
zaświecić na czerwono.

## 5. Odrzucone

- **Samo przerzedzenie bez powiększenia mapy** — przy odstępie 84 px las
  160×60 zmieściłby ~700 pni i czytałby się jak łąka z drzewami.
- **×2** — dwa razy dłuższe przejścia przy tej samej liczbie spawnów i 40
  kawałków gruntu w widoku 3D (dziś 24).
- **Nieprzechodnie masywy zamiast odstępu** — autor chciał wprost, „by każda
  istota mogła przejść"; masyw zostaje tylko w pasie skraju.

## 5a. Dosiew zwierząt (tego samego dnia, prośba autora)

„Więcej przestrzeni daje lepsze poczucie przestrzeni, zwłaszcza przy walce" —
**26 → 39 wrogów**: zając 6→10, lis 3→5, jeleń 3→5 (wszystkie przed linią
ubytku, x < 142,5 kafla), dzik 2→4 i sieciarz 3→5 (wschód i południowy
wschód), skoczek 3→4 (Źródło). ⛔ Sfora, Szary i niedźwiedź bez zmian —
anomalia i elity zostają pojedyncze. Każdy nowy spawn: polana (pień ≥ 130 px),
≥ 380 px od innych spawnów (bez łańcuchów aggro), drapieżnik ≥ 520 px od
wejść. Wybór „najdalej od wszystkich" w strefie, ziarno stałe.

## 6. Co zostaje otwarte → `OI-165`

Pomiar na S21 FE (24 kawałki gruntu w 3D zamiast 10), ocena odbioru w grze,
gęstość spawnów na 2,25× większej powierzchni, przegląd Gęstwiny (ta sama
choroba, osobna mapa) i zapisy stojące w lesie (stara pozycja wypada w innym
miejscu — gra zsuwa gracza na najbliższe wolne pole).

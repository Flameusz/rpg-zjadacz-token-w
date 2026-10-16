---
typ: STAN
domena: gathering
tytul: Zbieractwo — stanowisko, odrost, zebranie
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:gathering_kompletnosc]
kotwice:
  - src/core/Gathering.ts
  - src/world/NodeSpawner.ts
  - src/entities/Gatherable.ts
  - GameConfig.GATHER.activeRatio
  - GameConfig.GATHER.tickMs
  - GameConfig.GATHER.interactRange
  - tools/gathering_kompletnosc.mjs
otwarte: [OI-63]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Zbieractwo — stanowisko, odrost, zebranie

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak w tej grze rośnie
> i znika zasób**: czym jest stanowisko, czym roślina, kiedy odrasta i co
> dokładnie dzieje się przy zebraniu.
>
> **Czym NIE jest.** ⛔ **Nie mówi, gdzie stoją stanowiska ani jakie gatunki
> istnieją** — to jest zawartość. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| czym jest stanowisko, kiedy rośnie i jak się je zbiera | **`gathering`** |
| odrost w sesji i poza mapą | **`gathering`** |
| **gdzie** stoją stanowiska, ile ich jest, na której mapie | `world` |
| **jakie** gatunki istnieją, ile są warte | `items`, `economy` |
| przyjęcie przedmiotu i pełny plecak | `inventory` |
| czym gracz wywołuje interakcję | `input` |
| cel „zbierz N sztuk" | `quests` |
| co gracz **wie** o roślinie i kto mu to mówi | `quests` *(rozmowa)* |
| bramki rozwoju | `progression` — ⛔ **brak, patrz §5** |
| skutki czasowe | `effects` — ⛔ **brak, patrz §5** |

⚠⚠ **Ta domena nie zna ani jednego gatunku.** Pyta o **dwie liczby** — czas
odrostu i pojemność listy stanowisk — i o nic więcej. ⭐ Ten sam mechanizm
obsłużyłby stos drewna albo grzybnię **bez jednej zmiany**.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `gathering` **bierze** | `world` | listę stanowisk z mapy |
| `gathering` **bierze** | `items` | czas odrostu gatunku |
| `gathering` **daje** | `inventory` | jedną sztukę, **polityką „przyjmij, ile wejdzie"** |
| `gathering` **daje** | `save` | zakładkę odrostu i listę odkrytych gatunków |
| `gathering` **daje** | `quests` | **odkrycie gatunku** jako warunek rozmowy |
| `gathering` **jest wołane przez** | `input` | jedną z trzech rodzin interakcji kontekstowej |

---

## 1. Stanowisko ≠ roślina

```
STANOWISKO   punkt na mapie: „TU WOLNO rosnąć temu gatunkowi"   — trwałe, dane
ROŚLINA      byt chwilowy stojący na stanowisku                 — powstaje i znika
```

⚠⚠ **Stanowisk jest WIĘCEJ niż roślin — i to jest cała treść tego systemu.**
Gdyby każde stanowisko zawsze miało swoją roślinę, po trzech sesjach gracz
przestaje szukać i biega wyuczoną pętlą, a każde „szukaj na słonecznych łąkach"
staje się zbędne. ⭐ **Ma pozostać użyteczną wiedzą SIEDLISKO, a nie
konkretny krzak.**

⚙ **Gęstość reguluje więc AUTOR MAPY**, stawiając kilkukrotnie więcej punktów,
niż chce widzieć roślin. Ta domena decyduje wyłącznie, **które** z nich są dziś
zajęte.

⚠ **Roślina jest najcieńszym bytem w grze**: duszek, kołysanie i możliwość
dotknięcia. ⛔ **Ani własnego zegara, ani ciała fizycznego, ani klatkowej
aktualizacji.** Brak ciała nie jest przeoczeniem — roślina, na którą można
wpaść, byłaby kamieniem w bucie przy każdym przejściu przez łąkę.

⚠ **Punkt odniesienia jest u STÓP rośliny**, nie w jej środku: dystans mierzy
się od ziemi, z której wyrasta, a nie od miejsca gdzieś na łodydze.

---

## 2. Odrost: dwa różne mechanizmy

| | **w sesji** | **poza mapą** |
|---|---|---|
| co to jest | jeden zegar na **gatunek** | **arytmetyka wykonana raz, przy wejściu** |
| tempo | próba co takt, z prawdopodobieństwem czasu odrostu | ile pełnych okresów minęło |
| ile naraz | ⚠ **najwyżej jedna roślina na takt** | do wysycenia pułapu |
| gdzie | na **losowym** wolnym stanowisku | j.w. |

⚠⚠ **Mapy, na której nikogo nie ma, NIE SYMULUJE SIĘ.** Gra trzyma naraz jedną
mapę; utrzymywanie zegarów dla wszystkich pozostałych kosztowałoby coraz
więcej z każdą nową lokacją. ⭐ **Gracz nie ma jak odróżnić symulacji od
arytmetyki, bo poza mapą i tak nic się nie działo.**

⚠ **Najwyżej jedna roślina na takt — celowo.** Mapa wyczyszczona z gatunku
zapełnia się **stopniowo**, a nie cała naraz za plecami gracza.

⚠ **Czas jest ZEGAREM ŚCIENNYM, nie czasem sceny** — cały sens polega na
przeżyciu zamknięcia gry. ⚙ Znany koszt: przestawienie zegara systemu przestawia
odrost. To jest oszustwo, przed którym nikt tu nikogo nie chroni.

---

## 3. Zakładka: tożsamość, nie liczba

⚠⚠ **Przy wyjściu z mapy zapisuje się, KTÓRE stanowiska stały — nie ile ich
było.** Sama liczba wystarcza, żeby rozstrzygnąć **ilu** roślin dosadzić, ale
nie **gdzie** — a wtedy każdy powrót przez portal **przerzucał roślinę, której
nikt nie tknął**, na inny krzew po drugiej stronie łąki.

⭐ **Reguła, z której to wynika: nietkniętej rośliny nie ma prawa nic ruszyć,
bo nic się z nią nie działo.** Losowy jest **wyłącznie NOWY odrost** — i tylko
on ma do tego prawo, bo nikt go jeszcze nie widział.

⚠⚠ **Brak zapisu znaczy PEŁNO, nigdy pusto.** Miejsce odwiedzane pierwszy raz
rosło nietknięte, zanim gra się zaczęła; ⛔ pusta łąka na pierwszej wizycie
czytałaby się jako zepsuta mechanika. ⚙ To jedyny moment, w którym **cały**
zestaw jest losowany.

⚠ **Nieznany wpis w zapisie zostaje, nie jest kasowany** — gatunek albo mapa
usunięte dziś mogą wrócić, a ciche zapomnienie zakładki dałoby graczowi
podejrzanie pełną łąkę.

⚠ **Zakładka powstaje przy opuszczeniu mapy ORAZ przy każdym zebraniu**
(`NodeSpawner.collect`, OI-62 zamknięte 2026-10-09).

---

## 4. Zebranie

**Kolejność jest wiążąca:**

```
1. spróbuj przyjąć przedmiot        ← inventory; pełny plecak = ODMOWA
2. zwolnij stanowisko i wyrejestruj  ← PRZED animacją znikania
3. animacja, dźwięk, napis
4. odnotuj odkrycie gatunku
```

⚠⚠ **Krok 1 przed 2, i to jest reguła, nie kolejność zapisu.** Pełny plecak
**odmawia i mówi dlaczego**; ⛔ stanowisko opróżnione za nic byłoby najgorszym
możliwym wynikiem nietrafionego tapnięcia.

⚠⚠ **Krok 2 przed 3 — inaczej roślinę w połowie zanikania da się zebrać drugi
raz.** Ta sama reguła, którą stosuje umierający przeciwnik: stan znika
natychmiast, animacja jest tylko obrazem.

⚠ **Zbierana jest ROŚLINA WSKAZANA, nigdy „najbliższa".** Stanowiska stawia się
tuzinami i dwa łatwo mieszczą się w zasięgu naraz — rozstrzyganie „najbliższej"
zebrałoby po cichu inną roślinę niż ta pod palcem.

⚠ **Odkrycie gatunku jest jednorazowym FAKTEM, nie licznikiem.** Pierwsze
zebranie otwiera to, co o roślinie da się powiedzieć w rozmowie *(`quests`)*.
⭐ **Wiedza przychodzi z pola, nie z menu** — o roślinie, której gracz nigdy nie
znalazł, nie ma z kim porozmawiać.

⚠ **Zasięg jest MNIEJSZY niż do rozmowy z człowiekiem** — do rośliny się
schyla, do człowieka podchodzi.

---

## 5. Czego zbieranie NIE wymaga i nie robi

⚠⚠ **Zbieranie nie ma ŻADNEJ bramki rozwoju.** Nie ma umiejętności zbierania,
progu poziomu ani wymagania atrybutu. Warunki są dwa i oba są sytuacyjne:
**stać dostatecznie blisko** i **mieć miejsce w plecaku**.

⛔ **Nie istnieje umiejętność „Zielarstwo".** Nazwa krąży w jednym komentarzu
w kodzie jako przykład podpisu, którego gra nigdy nie pokaże; ognisko wymaga
umiejętności **pieczenia**, a to jest osobna mechanika *(gotowanie, nie
zbieranie)*.

⛔ **Zbieranie nie wywołuje żadnego efektu czasowego.** Nie parzy, nie truje,
nie daje żadnego stanu — ⚙ mimo że wśród gatunków jest pokrzywa.

⛔ **Nie ma narzędzia, jakości zbioru, szansy na niepowodzenie ani wielokrotnego
plonu.** Jedno zebranie = **dokładnie jedna sztuka**.

⭐ **To wyliczenie jest treścią, nie pustym miejscem.** Brak mechaniki nie
zostawia w kodzie żadnego śladu, więc bez wypisania go wprost każda kolejna
sesja musi go odkrywać od nowa.

---

## 6. Kompletność gatunku

⚠⚠ **Gatunek działa dopiero wtedy, gdy ma KOMPLET czterech rzeczy** — i każda
mieszka gdzie indziej:

| co | gdzie | bez tego |
|---|---|---|
| definicja gatunku *(czas odrostu, siedlisko)* | ta domena | nie da się go zasiać |
| **wpis przedmiotu** | `items` | ⛔ **zebranie kończy się BŁĘDEM** |
| duszek | `assets` | zastępczy obrazek |
| stanowiska na mapie | `world` | gatunek nie istnieje w grze |

✅ **Wpis przedmiotu ma dziś wszystkie jedenaście** (2026-09-06 — dopisany
sześciu gatunkom, które go nie miały; to była CIĘŻSZA połowa `OI-61`, „zebranie
kończy się błędem", i jest zamknięta). ✅ **Druga połowa `OI-61` zamknięta
2026-10-12 decyzją autora:** sześć gatunków bez konsumenta odkrycia i celu
zadania zostaje **towarem na sprzedaż** — planowanie zastosowań na tym etapie
jest zbędne.

⚠ **Kompletność (te cztery rzeczy) sprawdza dziś `tools/
gathering_kompletnosc.mjs`** — połowa `OI-63`: każdy gatunek ma przedmiot,
duszek (i realny plik na dysku) oraz wpis w `HERB_OBJECT_NAMES`, a każdy wpis
w `HERB_OBJECT_NAMES` wskazuje na istniejący gatunek. ⛔ **Zgodności
stanowiska z siedliskiem dalej nic nie sprawdza** — to DRUGA połowa `OI-63`
i zostaje otwarta.

⚠ **Siedlisko jest opisem DLA AUTORA, nie danymi dla kodu.** Decyduje, gdzie
wolno postawić stanowisko — ⛔ i nic nie sprawdza, czy postawione punkty się do
niego stosują. ⚙ Mapa sprzeczna z opisem zamienia małą lekcję w małe kłamstwo.

---

## 7. Niezmienniki

- **N-186** — **stanowisko to uprawnienie, roślina to byt chwilowy**; roślina
  nie ma zegara, ciała ani aktualizacji (§1).
- **N-187** — **stanowisk jest więcej niż roślin**; użyteczną wiedzą ma być
  **siedlisko**, nie pojedynczy krzak (§1).
- **N-188** — ⛔ **mapy bez gracza się nie symuluje**; odrost poza mapą to
  arytmetyka wykonana **raz, przy wejściu** (§2).
- **N-189** — **zakładka zapamiętuje TOŻSAMOŚĆ stanowisk, nie liczbę** (§3).
- **N-190** — **losowy jest wyłącznie NOWY odrost** (§3).
- **N-191** — **brak zapisu znaczy PEŁNO, nigdy pusto** (§3).
- **N-192** — **czas odrostu mierzy zegar ścienny**, nie czas sceny (§2).
- **N-193** — **jeden zegar na gatunek, nigdy na roślinę**; najwyżej jedna
  roślina na takt (§2).
- **N-194** — **stanowisko zwalnia się PRZED animacją** (§4).
- **N-195** — **pełny plecak odmawia i mówi**; roślina zostaje (§4).
- **N-196** — **odkrycie gatunku jest jednorazowe i pochodzi z pola** (§4).
- **N-197** — ⛔ **zbieranie nie ma bramki rozwoju ani skutku czasowego** (§5).

---

## 8. Checklista

**Nowy gatunek:** ⚠ **komplet czterech rzeczy** (§6) — pilnuje tego `node
tools/gathering_kompletnosc.mjs` (połowa OI-63) · dobierz czas odrostu jako
**informację o roślinie**, nie jako balans · ⚠ postaw stanowiska **zgodnie z
siedliskiem** (§6) — ⛔ tego kawałka przymiar NIE sprawdza (druga połowa
OI-63) · ⛔ nie dawaj mu własnego zegara (N-193).

**Nowa mapa:** ⚠ postaw **kilkukrotnie więcej stanowisk niż roślin** (N-187) ·
⚙ mapa bez stanowisk po prostu nie ma zbieractwa — to legalny stan.

**Nowy rodzaj zasobu** *(drewno, grzyby)*: ⭐ ten mechanizm obsłuży go bez
zmian — ⚠ potrzebuje wyłącznie listy punktów i czasu odrostu (§0).

**Bramki:** `npx tsc --noEmit` · `npm run build` · `node tools/doc_check.mjs` ·
`node tools/gathering_kompletnosc.mjs` — sprawdza komplet czterech rzeczy per
gatunek w OBIE strony (gatunek→dane, `HERB_OBJECT_NAMES`→gatunek); ⛔ **nie
sprawdza zgodności stanowiska z siedliskiem** (druga połowa OI-63, wciąż bez
przymiaru).

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| stanowisko ≠ roślina; roślina bez zegara i ciała | ✅ | ✅ | `kod:2026-09-06` |
| więcej stanowisk niż roślin | ✅ | ✅ | `kod:2026-09-06` |
| jeden zegar na gatunek, jedna roślina na takt | ✅ | ✅ | `kod:2026-09-06` |
| brak symulacji map bez gracza | ✅ | ✅ | `kod:2026-09-06` |
| zakładka po tożsamości stanowisk | ✅ | ✅ | `reka:2026-08-30` |
| losowy tylko nowy odrost | ✅ | ✅ | `kod:2026-09-06` |
| brak zapisu = pełno | ✅ | ✅ | `kod:2026-09-06` |
| zakładka aktualizowana przy zebraniu | ✅ | ✅ | `runtime:2026-10-09` |
| zegar ścienny zamiast czasu sceny | ✅ | ✅ | `kod:2026-09-06` |
| kolejność zebrania (przyjmij → zwolnij → pokaż) | ✅ | ✅ | `kod:2026-09-06` |
| pełny plecak odmawia, roślina zostaje | ✅ | ✅ | `kod:2026-09-06` |
| zbierana roślina wskazana, nie najbliższa | ✅ | ✅ | `kod:2026-09-06` |
| odkrycie gatunku jako jednorazowy fakt | ✅ | ✅ | `kod:2026-09-06` |
| **konsument odkrycia** | ⚠ **istnieje dla 5 z 11 gatunków** | ✅ *(opisane po raz pierwszy)* | ✅ świadomie — sześć gatunków to towar na sprzedaż (autor 2026-10-12, `OI-61`) |
| brak bramki rozwoju i skutku czasowego | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| **komplet gatunku** | ✅ **11 z 11** *(2026-09-06, było 5 z 11 — OI-61 część pierwsza)* | ✅ | `przymiar:gathering_kompletnosc` |
| zgodność stanowiska z siedliskiem | ⚙ **ręcznie** | ✅ | ❌ **brak przymiaru** — OI-63 (część druga) |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-61** | ✅ **ZAMKNIĘTE 2026-10-12** — część pierwsza naprawiona 2026-09-06, druga rozstrzygnięta przez autora: zioła bez zastosowania zostają towarem na sprzedaż. Wpis: `docs/issues_archive.md` |
| **OI-62** | ✅ **ZAMKNIĘTE 2026-10-09** — zebranie woła `Gathering.record`; zegar odrostu startuje od zebrania. Zmierzone w silniku: przed zbiorem brak zakładki, po zbiorze 3 stojące bez zebranego stanowiska. |
| **OI-63** | ⚠ **CZĘŚCIOWO ROZWIĄZANE 2026-09-06.** Pierwotnie: nic nie sprawdzało ani kompletności gatunku, ani zgodności stanowiska z siedliskiem — dokładnie ta luka, przez którą przeszło `OI-61`. ✅ **Kompletność gatunku ma dziś przymiar**: `tools/gathering_kompletnosc.mjs` sprawdza wszystkie cztery miejsca *(gatunek, przedmiot, duszek + realny plik na dysku, stanowiska na mapie)* w obie strony — gatunek→dane ORAZ `HERB_OBJECT_NAMES`→gatunek (osierocony wpis mapujący na nieistniejący gatunek też świeci na czerwono). Świeci naprawdę: zweryfikowane celowym zepsuciem `ITEMS.zywokost` (przymiar złapał, `exit 1`). ⛔ **Zgodność stanowiska z siedliskiem dalej nie ma przymiaru** — to wymagałoby geograficznej klasyfikacji terenu wokół każdego punktu, czego dzisiejszy `.tmj` nie koduje wprost; zostaje otwarte. ⚠ Roster dalej nie ma **generatora** liczb stanowisk na mapę. |

---

## Czego ten dokument nie rozstrzyga

- **Gdzie stoją stanowiska i ile ich jest** — `world` i pliki map.
- **Jakie gatunki istnieją, jak wyglądają i ile są warte** — to jest content:
  `items`, `economy`, `assets`.
- **Czy udział zajętych stanowisk jest dobrze dobrany** — nigdy nie mierzone
  ręką; ⛔ nie balansuję.
- **Czy czasy odrostu są dobre** — są **informacją o roślinie**, nie strojeniem.
- **Co gracz wie o roślinie i kto mu to mówi** — rozmowa, `quests`.
- **Przyjęcia przedmiotu i polityki pojemności** — `inventory`.
- **Czym wywołuje się interakcję** — `input`.
- ⛔ **Żadnego zioła, stanowiska ani receptury z osobna** — to jest content.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego pula stanowisk, a nie roślina na punkcie | `src/world/NodeSpawner.ts` *(przy kodzie)* | ACTIVE |
| dlaczego tożsamość, a nie liczba; zegar ścienny | `src/core/Gathering.ts` *(przy kodzie)* | ACTIVE |
| po co udział zajętych stanowisk i co psuje 1,0 | `GameConfig.GATHER` *(przy kodzie)* | ACTIVE |
| siedliska gatunków i zasada „mapa nie może kłamać" | `GameConfig.HERBS`, `src/world/TiledMap.ts` | ACTIVE |
| duszki jedenastu gatunków | `docs/katalog_assetow.md` | ACTIVE — ⚠ **opisuje wszystkie 11; wpisy przedmiotu ma dziś też 11** (OI-61, część pierwsza zamknięta 2026-09-06) |
| kompletność gatunku, w obie strony | `tools/gathering_kompletnosc.mjs` *(przy kodzie)* | ACTIVE |
| polityka pełnego plecaka, której to jest klientem | `docs/systemy/inventory.md` §5 | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_gathering.md` | — *(stan sprzed naprawy OI-61/OI-63 z 2026-09-06)* |

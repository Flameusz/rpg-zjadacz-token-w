---
typ: STAN
domena: creatures
tytul: Stworzenia — kontrakt gatunku, zachowanie, odrodzenie
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:combat_regresja, przymiar:action_runner_weryfikacja]
kotwice:
  - src/entities/Enemy.ts
  - src/entities/EnemyRegistry.ts
  - src/entities/Fox.ts
  - src/entities/Deer.ts
  - src/core/CombatAction.ts
  - GameConfig.ENEMY_MOTION
  - GameConfig.LOOT
otwarte: [OI-33]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-04
---

# Stworzenia — kontrakt gatunku, zachowanie, odrodzenie

> **Czym jest ten dokument.** Odpowiedzią na pytanie **czym jest gatunek w tej
> grze**: co musi zadeklarować, jak się zachowuje, kiedy wraca i co po sobie
> zostawia.
>
> **Czym NIE jest.** ⛔ **Nie podaje statystyk ani zachowań żadnego
> konkretnego stworzenia** — to są dane. Nie opisuje rozstrzygania ciosu,
> ochrony ani ruchu; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| co gatunek musi zadeklarować, jak działa AI, odrodzenie, łup | **`creatures`** |
| jak rozstrzyga się cios i jakie są kształty trafienia | `combat` |
| jak dobrze stworzenie ląduje cios (`m(P)`, fuszerka) | `proficiency` |
| krzywa ochrony i profil materiału | `armor` |
| księgowość efektów czasowych | `effects` |
| krzywa XP i co robi punkt | `progression` |
| ceny i bilans złota | `economy` |
| solvery, ścieżki, prędkości jako system | `movement` |

⚠ **Kontrakt domeny obejmuje wszystkie ISTOTY ŻYWE**, nie tylko wrogów.
Fauna bez walki *(zwierzęta gospodarskie, ptaki)* to osobne
klasy bytów bez kontraktu bojowego — §6.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `creatures` **daje** | `combat` | kanały obrażeń, cele, akcje z fazami |
| `creatures` **daje** | `proficiency` | ⚠⚠ **`P` w PODWÓJNEJ roli** — §1.1 |
| `creatures` **daje** | `armor` | nosiciela ochrony; ⚠ **wyjątkowego** |
| `creatures` **daje** | `progression` | doświadczenie jako własność gatunku |
| `creatures` **daje** | `economy` | łup, czyli **jedyny odnawialny towar** |
| `creatures` **daje** | `effects` | dwa z pięciu rodzajów efektów w grze |
| `creatures` **bierze** | `movement` | solver prowadzący ciało |

---

## 1. Kontrakt gatunku

⚠⚠ **Nowe stworzenie to blok konfiguracji plus opcjonalne nadpisanie
zachowania — NIGDY skopiowana AI.** Baza jest w całości sterowana danymi.

⚠ **Jeden rejestr gatunków**: typ → (konfiguracja, konstruktor). ⛔ Dwie
równoległe listy tej samej unii **już raz się rozjechały** — jedna nie znała
manekina i po cichu zwracała konfigurację królika.

### 1.1 Pola WYMAGANE bez derywacji

⚠⚠ **Cztery pola są wymagane i celowo nie dają się wyprowadzić z niczego
innego.** Wartość domyślna sprawiłaby, że **decyzja i przeoczenie wyglądają
w źródle identycznie** — a ten projekt ma udokumentowaną blizną po dokładnie
tej klasie błędu.

| pole | dlaczego bez derywacji |
|---|---|
| **biegłość** | ⚠⚠ **NIE jest miarą groźności** — te są już cztery (wytrzymałość, obrażenia, tempo i zasięg, telegraf); zwinięcie ich tutaj liczyłoby to samo dwa razy. ⚠ **Ma DWIE role naraz**: jak czysto stworzenie ląduje własny cios **i** ile jest warte jako sparingpartner *(`proficiency`)* |
| **rola dydaktyczna** | ⛔ **NIE jest bramką na naukę** — ile ktoś uczy, rozstrzyga wyłącznie relacja biegłości obu stron. Flaga mówi tylko, **czy zobowiązujemy się trzymać dla niego margines przy kalibracji**. ⛔ Wykluczenie musi mieć powód w **roli w lokacji**, nigdy w wygodzie liczbowej |
| **typ obrażeń kontaktu** | „świadomie bez typu" musi dać się **napisać**, nie przemilczeć |
| **ślad stopy** | nowy gatunek ma dostać od kompilatora **pytanie o pomiar** |

### 1.2 Dwa ciała, nie jedno

⚠⚠ **Hurtbox (gdzie da się trafić) i ciało fizyczne (czym się rozpycha) to
osobne pola i nie muszą być równe.**

⚠ **Ciało fizyczne podaje się w pikselach KLATKI, a realny rozmiar to
`wartość × skala`** — silnik mnoży przez skalę duszka co klatkę. ⛔ Pomylenie
tych dwóch przestrzeni kosztowało już realny błąd nawigacji.

⭐ **Długość hurtboxa mierzy się z MODELU 3D** (od 2026-10-04): ~120–125 %
bryły bez ogona, jednakowo dla rosteru; powody per gatunek przy `hurt`
w konfigu. ⚠ Ciało fizyczne zostaje — po nim chodzi nawigacja lasu.
Zmiana przemroziła baseline `combat_regresja` (`--migracja`).

---

## 2. Zachowanie

**Dwa stany bazowe: patrol i pościg.** Podklasa dokłada własne zachowanie
przez hooki, **nie przez rozgałęzienie wspólnej AI**.

### 2.1 Wejście i wyjście z pościgu

| przejście | warunek |
|---|---|
| patrol → pościg | dystans do gracza w zasięgu agresji |
| pościg → patrol | dystans powyżej progu **albo** ⚠⚠ **BRAK DROGI do celu** |

⚠⚠ **Brak trasy kończy pościg tak samo jak zbyt duży dystans** — odpowiedź
pochodzi z warstwy ścieżek *(domena `movement`)*, którą i tak liczy każdy krok.
⛔ **To NIE jest timeout ani licznik prób**; to pytanie „czy w ogóle jest
którędy" — i tylko ono.

⚠ **Podklasa może ZAWETOWAĆ zerwanie pościgu**, żeby nie przerywać zobowiązanej
akcji. Weto obowiązuje **oba** warunki wyjścia.

### 2.2 Akcja bojowa jako dane

Zapowiedź → okno rozstrzygania → bezbronna pauza.

⚠ **Okno rozstrzygania bywa jednoklatkowe i to jest normalny przypadek** — cios
rozstrzygany w jednym momencie. Okno o niezerowej długości potrzebne jest
dopiero atakom, które **przelatują przez przestrzeń**.

⚠ **Cooldown liczy się od chwili ROZSTRZYGNIĘCIA**, nie od początku okna i nie
od końca pauzy.

⚠ **Zapowiedź może być zerowa** i wtedy atak nie ma telegrafu — ⛔ **to jest
decyzja projektowa gatunku**, nie brak danych.

⚠⚠ **Runner mówi, CO się stało; encja robi z tym wszystko, co dotyka silnika.**
Runner nie zna prędkości, tintu, dźwięku ani trafienia. ⛔ Sześć kopii tej
maszyny już w tym projekcie istniało — siódma była powodem, dla którego ją
wyciągnięto.

### 2.3 Trzy stany ciała, jawny priorytet

```
IMPULS  >  OGŁUSZENIE  >  AI
```

⚠⚠ **Kolejność nie jest kosmetyczna.** Odrzut chce, żeby ciało **jechało**;
ogłuszenie, żeby **stało**. Wróg ogłuszony w locie odrzutu musi najpierw
dolecieć — odwrotna kolejność kasowałaby odrzut, czyli tożsamość rodziny
obuchowej *(`weapons`)*.

⚠ **Ogłuszenie NIE jest efektem czasowym** — mieszka we własnym polu i mówi
CIAŁU, co ma robić *(otwarte: `OI-27`)*.

### 2.4 Zwierzyna, która się odgryza

Najpierw UCIEKA, walczy dopiero po **spuście zwrotu** — własności gatunku:
królik — **cios** (do końca życia egzemplarza); lis *(2026-10-04)* —
**bezskuteczność ucieczki** albo cios; jeleń *(2026-10-04)* — **wyłącznie
cios**, czyli istota NEUTRALNA (lis i jeleń: do zerwania pościgu).

⚠⚠ **Bezskuteczność jest MIERZONA, nie losowana**: zryw kończy się bilansem;
kilka nieudanych pod rząd odwraca zwierzę. ⛔ Nie timeout, nie rzut.
⚠ **Bilans ma DWA warunki** *(lis, 2026-10-05)*: zryw jest nieudany, gdy
zwierzę zyskało za mało dystansu **albo** gdy gracz w tym czasie przebiegł
w jego stronę ustalony udział jego drogi (pogoń nie odpuściła). ⛔ Sam próg
dystansu w pikselach zakłada konkretną prędkość gracza — a ta zależy od masy
ekwipunku i, na telefonie, od wychylenia drążka; przy takim progu gracz
w zbroi nie odwracał lisa nigdy.

⚠ **Ucieczka PRZERYWANA (zryw → postój)** — postój jest oknem trafienia.
⚠ **Kierunek zrywu ustalany na starcie, z wolną drogą** (wachlarz sprawdzany
siatką terenu, *`movement`*); ⛔ „wprost od gracza" kończyło się na pniu.
⚠ **Zwrot ma telegraf**, w trakcie którego zerwanie pościgu jest zawetowane.

### 2.5 Ludzie — bandyci (od 2026-10-11, `OI-171`)

Jedna klasa (`Bandit`), trzy konfiguracje (`BANDIT_CLUB`/`AXE`/`CHIEF`).
Zamach w kształcie zamachu niedźwiedzia (telegraf tintem → rozstrzygnięcie na
wejściu w `active`). ⚙ **Alarm obozu**: zbój wchodzący w pościg woła `aggro()`
kompanów w `alarmRadius` — wzór wycia wilka. Herszt jest elitą (nie odradza
się, ma napis nad paskiem). Model: `tools/npc3d.py` tryb wroga; śmierć bez
klipu = upadek korzenia w `Creature3D`. Liczby → `docs/stworzenia_katalog.md`.

---

## 3. Ochrona, obrażenia, efekty

⚠⚠ **Opancerzony przeciwnik jest WYJĄTKIEM, nie regułą** *(niezmiennik domeny
`armor`)*. Gdyby każdy gatunek miał tabelę odporności, wybór wariantu ataku
przestałby być decyzją, a stałby się podatkiem płaconym przed każdym ciosem.

⚠ **Ochrona stworzenia to zwykłe dane bez egzemplarza** — więc **bez jakości
i bez zużycia**. Nie ma czegoś takiego jak „jakość pancerza dzika".

⚠⚠ **Kontakt bywa GŁÓWNYM kanałem ataku, nie kanałem pobocznym** — u części
rosteru cios ląduje właśnie tędy, a udział kontaktu w wyjściu bywa dominujący.
**Zmierzone, nie założone.** ⛔ Nie traktuj kontaktu jako „obrażeń przy okazji".

⚠ **Stworzenie może nosić efekty czasowe** — jest pełnoprawnym nosicielem,
tak samo jak gracz *(`effects`)*.

⚠ **Stworzenie nie ma paska efektów** — ogłasza je paskiem zdrowia
i znacznikiem nad głową. ⛔ Trzeciego kanału nie ma i nie ma powstać.

⚠⚠ **Wrogowie nigdy nie krytykują** — wpisane wprost, nie wyprowadzone z braku
szansy *(asymetria zaakceptowana, `proficiency` `OI-30`)*.

---

## 4. Śmierć, nagroda, odrodzenie

⚠⚠ **Księgowość zabójstwa ma JEDNO miejsce** — doświadczenie, łup, postęp
zadań i zaplanowanie odrodzenia. ⛔ Sama śmierć nie przyznaje niczego:
pominięcie tej ścieżki daje wroga, który znika **bez nagrody i bez odrodzenia,
nie zgłaszając niczego**.

⚠ **Efekt czasowy potrafi dobić** — dlatego księgowość jest wołana także
z przewijania efektów, nie tylko z ciosu.

⚠ **Doświadczenie jest własnością gatunku, nie poziomu gracza** *(`progression`)*.

⚠ **Łup jest bramkowany szansą, a część także umiejętnością bierną gracza** —
i jest **jedynym odnawialnym towarem w grze** *(`economy`)*.
⚠ **Wyjątek dla przeciwnika, który nie wraca**: jego nagroda jest pewna
i niebramkowana — nieudany rzut przy jednorazowym starciu znaczyłby utratę
nagrody bez możliwości powtórzenia.
⚠ **Ekwipunek z wroga = to, co MIAŁ NA SOBIE, rzadko i zniszczone** (autor
2026-10-11; `LOOT.equipmentDrops` — dane, bo czyta je przymiar dystrybucji).
Egzemplarz nosi jakość i zużycie, więc nie jest farmą przedmiotów.

⚠⚠ **Zerowe opóźnienie odrodzenia znaczy „nigdy nie wraca"** i jest to
**pełnoprawna deklaracja gatunku**, nie brak wartości.

⚠ **Odrodzenie ma rozrzut czasu i bezpieczny promień** — replika nie pojawia się
w graczu ani co do sekundy tak samo.

---

## 5. Fauna bez walki

Zwierzęta gospodarskie i ptaki **nie mają kontraktu
bojowego**: zero wytrzymałości, zero agresji, zero obrażeń kontaktowych.

⚠ **Reakcja na gracza jest jedyną rzeczą, którą dzielą z wrogami** — i tylko
u tych gatunków, które potrafią uciekać. ⛔ To nie czyni ich przeciwnikami
i nie uprawnia do dopisania im kontraktu bojowego „dla spójności".

⚠ **Osobne klasy zamiast wspólnej** wynikają z różnic w arkuszach animacji,
nie z różnic mechanicznych *(domena `assets`)*.

⚠ **Z fauny do przeciwników — tylko DECYZJĄ autora i całym kontraktem**
(lis i jeleń 2026-10-04, §2.4 — leśnej zwierzyny bez walki już nie ma);
⛔ nie przez dopisanie dekoracji „trochę walki".

---

## 6. Niezmienniki

- **N-111** — **nowy gatunek to konfiguracja + opcjonalny hook**, nigdy
  skopiowana AI (§1).
- **N-112** — **jeden rejestr gatunków**; ⛔ dwie listy tej samej unii
  rozjeżdżają się (§1).
- **N-113** — **cztery pola wymagane bez derywacji** (§1.1); ⛔ wartość domyślna
  zaciera różnicę między decyzją a przeoczeniem.
- **N-114** — **biegłość nie jest miarą groźności** i ma **dwie role** (§1.1).
- **N-115** — ⛔ **rola dydaktyczna nie jest bramką na naukę** (§1.1).
- **N-116** — **hurtbox ≠ ciało fizyczne**; ciało podaje się w pikselach klatki
  (§1.2).
- **N-117** — **brak trasy kończy pościg**; ⛔ nie timeout (§2.1).
- **N-118** — **cooldown akcji od ROZSTRZYGNIĘCIA** (§2.2).
- **N-119** — **priorytet ciała: impuls > ogłuszenie > AI** (§2.3).
- **N-120** — **opancerzony przeciwnik jest wyjątkiem** *(depozyt z `armor`)*.
- **N-121** — **księgowość zabójstwa w jednym miejscu**, wołana także przez
  efekt (§4).
- **N-122** — **zerowe opóźnienie odrodzenia = nigdy**, jako deklaracja (§4).
- **N-123** — **fauna bez walki nie dostaje kontraktu bojowego** (§5).

---

## 7. Checklista: nowy gatunek

1. **Wpis w rejestrze** — typ, konfiguracja, konstruktor (N-112).
2. **Cztery pola bez derywacji** — rozstrzygnij każde świadomie (N-113).
   ⚠ Biegłość: policz, do jakiego poziomu gracza ten gatunek **przestanie
   uczyć** *(`proficiency`)* — to jego rola w progresji.
3. **Zmierz ślad stopy i ciało fizyczne osobno** (N-116).
4. **Kanały obrażeń** — ⚠ rozstrzygnij, czy kontakt jest kanałem **głównym**;
   typ obrażeń jawnie, `null` jest legalne (§3).
5. **Ochrona** — ⚠ domyślnie **żadna** (N-120). Dodanie wymaga powodu.
6. **Akcje** — zapowiedź, okno, pauza; ⚠ zerowa zapowiedź to decyzja (§2.2).
7. **Odrodzenie** — ⚠ zero znaczy „nigdy" (N-122); jeśli nie wraca, rozważ
   niebramkowaną nagrodę (§4).
8. **Nagroda i łup** — doświadczenie należy do gatunku; łup wchodzi do jedynego
   odnawialnego strumienia towaru.
9. Bramki: `npx tsc --noEmit` · `npm run build` ·
   `node tools/combat_regresja.mjs` · `node tools/action_runner_weryfikacja.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| baza sterowana konfiguracją + hooki | ✅ | ✅ | `kod:2026-09-06` |
| jeden rejestr gatunków | ✅ | ✅ | `kod:2026-09-06` |
| cztery pola wymagane bez derywacji | ✅ | ✅ | **kompilator** |
| hurtbox ≠ ciało fizyczne | ✅ | ✅ | `przymiar:movement_weryfikacja` |
| agresja i zerwanie pościgu (dystans + brak trasy) | ✅ | ✅ | `kod:2026-09-06` |
| weto zobowiązanej akcji | ✅ | ✅ | `przymiar:action_runner_weryfikacja` |
| akcja jako dane, cooldown od rozstrzygnięcia | ✅ | ✅ | `przymiar:action_runner_weryfikacja` |
| priorytet impuls > ogłuszenie > AI | ✅ | ✅ | `przymiar:combat_regresja` |
| stworzenie jako nosiciel efektów | ✅ | ✅ | `przymiar:effects_weryfikacja` |
| księgowość zabójstwa w jednym miejscu | ✅ | ✅ | `przymiar:combat_regresja` §V |
| odrodzenie: opóźnienie, rozrzut, bezpieczny promień | ✅ | ✅ | `kod:2026-09-06` |
| fauna bez walki bez kontraktu bojowego | ✅ | ✅ | `kod:2026-09-06` |
| zwierzyna: ucieczka → zwrot (spust gatunku) | ✅ | ✅ | `kod:2026-10-04` (pomiar: `docs/dziennik.md`) |
| **dwie ścieżki obrażeń na fizyce silnika** | ✅ *(dług)* | ✅ | — `OI-33` |
| **kęs testowany samym dystansem** | ✅ | ✅ | — `OI-35` |
| zestawienie rosteru | ❌ | ⚠ | ❌ **brak generatora** — `OI-47` |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-33** | ⚠ **Dwie ścieżki obrażeń wciąż rozstrzyga fizyka silnika**, nie geometria walki: kontakt dwóch ciał i pocisk. ⚠ **Wyłączenie kontaktu u gatunków, które go używają, jest realnym osłabieniem**, nie porządkami — u obu pająków to istotna część wyjścia. *(Własność wspólna z `combat`; tutaj wymieniona, bo dotyczy gatunków.)* |
| **OI-35** | ⛔⛔ **ODRZUCONE decyzją autora 2026-09-08 — NIE IMPLEMENTOWAĆ.** Kęs jednego z gatunków testowany jest samym dystansem, bez łuku wokół zablokowanego wektora, więc trafia praktycznie zawsze. ⚠ **To jest opis stanu, nie zgłoszenie do naprawy.** Narzędzie istnieje (ten sam wzorzec co u niedźwiedzia) i **to nie jest powód, żeby go użyć**. ⚙ Właściciel pozostaje ustalony na `creatures` — wybór predykatu jest decyzją zachowania gatunku, nie geometrii; gdyby autor kiedyś zmienił zdanie, zmiana należy tutaj. |
| **OI-47** | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/katalog_stworzen.mjs --zapisz` → `docs/stworzenia_katalog.md` (roster, siatka ról, kanały obrażeń; bez łupu). |

---

## Czego ten dokument nie rozstrzyga

- **Statystyk ani zachowań żadnego konkretnego gatunku** — to są dane.
- **Balansu**: ile ma być wytrzymałości, obrażeń, nagrody.
- **Ilu przeciwników ma nosić ochronę** — poza regułą „wyjątek" (N-120).
- **Czy ogłuszenie ma wejść do warstwy efektów** — `OI-27`.
- **Rozstrzygania ciosu i kształtów trafienia** — `combat`.
- **Solverów, ścieżek i prędkości** — `movement`.
- **Krzywej XP i cen** — `progression`, `economy`.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego runner powstał i co zastąpił | `docs/systemy/combat.md` | ACTIVE |
| stan po wdrożeniu i otwarte pytania o gatunki | `docs/systemy/combat.md`§7.4 | ACTIVE |
| biegłość per gatunek i jej uzasadnienia | `docs/systemy/proficiency.md`, §14b | ACTIVE |
| dlaczego jeden opancerzony i dlaczego pająk nie dostaje metalu | `docs/systemy/armor.md`, §11.3 | ACTIVE |
| jedyny zapisany playtest współpracy przeciwników | `docs/systemy/combat.md` | HISTORICAL |
| rozjazdy, rejestr decyzji i pomiary ekstrakcji | `docs/proces/ekstrakcja_creatures.md` | — |

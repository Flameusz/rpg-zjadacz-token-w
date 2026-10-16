---
typ: HISTORIA
domena: creatures
tytul: Pająki — pakiet dla recenzenta
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-13
---

# Pająki — pakiet dla recenzenta

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/creatures.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status (2026-08-13): Zadanie B jest ZAMKNIĘTE i wdrożone.** Odpowiedzią są
> trzy koncepcje w `docs/pajak_jadowity_koncepcje.md`; wybrana została „A —
> Skoczek jadowity" i stoi już na mapie (3 sztuki, **głębiej niż dziki**).
> **Zadanie A — ocena sieciarza (§7) — wciąż jest otwarte**: nikt na te sześć
> pytań nie odpowiedział, a §3.5 pkt 5 to znaleziony przy okazji realny defekt
> (martwy counterplay). Dokument zostaje jako opis stanu sieciarza i jako wzór
> pakietu dla recenzenta przy następnym stworze.

**Cel:** (A) ocena istniejącego przeciwnika — **Pająka sieciarza** — i (B) brief na
nowego stwora: **pająka walczącego w zwarciu**.

Recenzent nie ma dostępu do repozytorium, więc wszystkie liczby, kod i decyzje
projektowe potrzebne do odpowiedzi są przepisane niżej. Wszystko, co jest tu
podane jako liczba, pochodzi z `src/config/GameConfig.ts`, `.tmj` mapy albo z
kodu — nie z pamięci.

Konwencja projektu: **balans mieszka w `GameConfig.ts`, nigdy w kodzie entity**;
nowy stwór to blok configu + podklasa `Enemy` + punkty spawnu na mapie, a nie
własne AI od zera.

---

## 1. Kontekst — co to za gra

Top-down 2D action RPG (Phaser 3 + TypeScript), pixel art, sterowanie dotykowe
(wirtualny drążek + przycisk ataku), docelowo telefon w poziomie. Walka jest
w modelu Wild Rift, nie WoW:

- tapnięcie przeciwnika ustawia **cel**, przycisk ataku **uzbraja autoatak**;
- zamach **ukorzenia gracza** na czas swojego trwania (34–43% cyklu, zależnie od
  broni) i **nie da się go zacząć, gdy trwa ruch** — ucieczka działa, ale kosztuje
  zamachy;
- cios rozstrzyga się w **dwóch momentach**: naciśnięcie decyduje o zamachu,
  a trafienie liczy się w połowie jego trwania (`swingHitFraction = 0.5`);
  cel, kierunek i profil ciosu są **zamrożone w chwili startu zamachu**;
- bez wybranego celu atak to **łuk przed graczem** (wielocel), z celem — cios
  wyłącznie w ten cel.

Świat: las (mapa startowa `forrest.tmj`, 100×60 kafli) + wieś na północy.
**Na mapie lasu nie ma dziś ŻADNYCH kolizji kafelkowych** (zero static bodies —
świadoma decyzja: najpierw układ, potem kolizje). To ma znaczenie dla oceny
pająka, patrz §3.4.

### 1.1 Gracz — czym dysponuje

| | wartość |
|---|---|
| HP bazowe | 100 |
| Prędkość | **150 px/s** |
| Atak gołymi rękami | 3–5 obr., cooldown 0,5 s (≈8 dps) |
| Krytyk | 15% × 1,8 (rośnie ze Zręcznością, cap w konfiguracji) |
| Regeneracja | tylko **poza walką** (5 s od ostatniego otrzymanego ciosu) |

Drabinka broni (dps przy Sile 0, jakość Zwykła): pięści 8 → kij 15 → sztylet 20
→ miecz 23 → siekiera 24 → młot 26,2.

Kategorie broni różnią się realnie: łuk ciosu 38°–100°, zasięg 52–78 px,
sztylet ma 25%/×2,0 krytyka, **młot jako jedyny odrzuca i PRZERYWA**.

Warianty ataku (jedna broń = 1–3 sposoby użycia): miecz Cięcie/Pchnięcie,
siekiera Cięcie/Obuch. Wariant niesie **typ obrażeń**: `slash` / `pierce` /
`blunt`.

Umiejętności odblokowywane poziomem:

| | poziom | cooldown | działanie |
|---|---|---|---|
| **Unik** | 3 | 6 s | dash 140 px w 200 ms + **300 ms nietykalności** |
| **Wir ostrzy** | 6 | 9 s | AoE 76 px dookoła, ×0,85 obrażeń |
| **Okrzyk bojowy** | 10 | 24 s | +35% obrażeń na 10 s |

### 1.2 Model ochrony (obie strony walki liczone tym samym kodem)

Punkty ochrony przechodzą przez krzywą `d/(d+50)` z capem. Typ obrażeń
**mnoży punkty**, nie wynik:

```
ARMOR_PROFILE = {
  leather: { slash: 1.0,  pierce: 0.45, blunt: 0.8 },
  metal:   { slash: 1.4,  pierce: 1.15, blunt: 0.4 },
}
```

Brak pancerza = pełne obrażenia; nie ma czegoś takiego jak „odporność bez
pancerza". `slash` jest **świadomie generalistą** (nigdy najlepszy przeciw
pancerzowi, ale broniom tnącym dano najwyższe surowe dps).

**Dziś opancerzony jest DOKŁADNIE JEDEN przeciwnik** — dzik (`leather`, 22 pkt).
Królik, wilk, Szary i pająk są bez pancerza celowo: gdyby każdy stwór miał
tabelkę odporności, wybór wariantu przestałby być decyzją, a stał się podatkiem
płaconym przed każdym ciosem.

---

## 2. Bestiariusz — stan w chwili pisania pakietu (5 stworów)

⚠ Od 2026-08-13 jest ich **sześć** — doszedł **Skoczek jadowity** (46 HP, 40 XP,
zwarcie, telegrafowane ukąszenie 3–5 `pierce` + narastający jad, bez pancerza).
Tabela niżej jest celowo zostawiona w stanie sprzed jego dodania, bo to jest
wejście, z którego powstał jego projekt; aktualny opis jest w `CLAUDE.md`
i w `docs/pajak_jadowity_koncepcje.md`.

| | HP | XP | dotyk (obr./cd) | typ dotyku | patrol / pościg | aggro / de-aggro | pancerz | mechanika |
|---|---|---|---|---|---|---|---|---|
| **Zając** | 30 | 25 | 4–6 / 1,0 s | `null` | 30 / 70 | 140 / 260 | — | skacze (hop), **spłoch** raz poniżej 40% HP: sprint 230 px/s, potem ~1,3 s bezruchu |
| **Dzik** | 95 | 70 | 8–12 / 1,1 s | `blunt` | 22 / 52 | 175 / 340 | **leather 22** | telegrafowana **szarża**: 560 ms tellu → 300 px/s przez 420 ms, 16–24 obr., 750 ms podatności |
| **Wilk** | 55 | 45 | 7–10 / 0,9 s | `pierce` | 42 / 115 | 165 / 320 | — | **wataha**: orbituje 96 px, wypada (120 px, 320 px/s, 380 ms), **wycie** budzi wilki w 200 px |
| **Szary** (elita) | 190 | 260 | 11–15 / 0,85 s | `pierce` | 38 / 132 | 210 / 420 | — | pojedynek: ugryzienie 18–26 + **odskok 128 px**, **wściekłość** poniżej 40% HP (×1,22 tempo, ×1,25 obr.); `respawnDelay: 0` = nie wraca |
| **Pająk sieciarz** | 42 | 55 | **3–5 / 1,2 s** | `null` | 26 / 62 | 230 / 380 | — | **dystans + kiting**: patrz §3 |

Zajmowane nisze — nowy stwór nie powinien ich powielać:
**rój** (zając), **jeden wielki telegraf + pancerz** (dzik), **grupa i objętość
ataków** (wataha), **pojedynek z fazą** (Szary), **wsparcie z dystansu**
(pająk sieciarz).

---

## 3. Pająk sieciarz — pełna specyfikacja

### 3.1 Dane

```ts
export const SPIDER = {
  hp: 42,
  xpReward: 55,
  // Dotknięcie prawie nie boli — NIE ma się czytać jako zagrożenie w zwarciu,
  // bo wtedy gracz potraktuje go jak każdego innego wroga i zignoruje sieć.
  touchDamageMin: 3,
  touchDamageMax: 5,
  touchDamageCooldown: 1.2,
  touchDamageType: null,        // świadomie bez typu
  patrolSpeed: 26,
  chaseSpeed: 62,               // tylko do wracania w pas ognia; nigdy nie szarżuje
  aggroRange: 230,
  deAggroRange: 380,
  patrolRadius: 40,
  respawnDelay: 14, respawnJitter: 6, respawnSafeRadius: 120,
  scale: 1.7, bodyWidth: 18, bodyHeight: 12,
  ranged: {
    fireRange: 220,             // pluje z tego dystansu (tuż nad własnym aggro)
    retreatRange: 96,           // bliżej — cofa się zamiast strzelać
    retreatSpeed: 84,           // wolniej niż gracz (150) CELOWO: ma być łapalny, ale męczący
    windupMs: 420,              // tell, po którym da się zacząć strafe'ować
    cooldownMs: 2600,
    cooldownJitterMs: 900,      // żeby gniazdo nie strzelało salwą
    telegraphTint: 0xcfe8a0,
  },
} as const;

export const WEB_PROJECTILE = {
  speed: 210,
  damageMin: 4, damageMax: 7,
  damageType: null,             // świadomie bez typu
  slowFactor: 0.55,             // −45% prędkości ruchu
  slowMs: 2600,
  lifetimeMs: 1300,             // ≈273 px lotu
  bodyRadius: 6,
  buffId: "web-slow",
  name: "Pajęczyna",
} as const;
```

### 3.2 Maszyna stanów (cały kod decyzyjny)

Dwie fazy: `hold` i `windup`. Bazowa klasa `Enemy` daje patrol/aggro/kontakt/
śmierć/pasek HP; pająk nadpisuje wyłącznie `updateChase`, `canDeaggro`,
`onLoseAggro` i `interrupt`.

```ts
protected updateChase(player: Player, nowMs: number): void {
  const r = SPIDER.ranged;
  const dist = distance(this, player);
  this.setFlipX(player.x < this.x);

  if (this.phase === "windup") {           // stoi; zamach się nie cofa
    body.setVelocity(0, 0);
    if (nowMs >= this.phaseUntil) this.fire(player, nowMs);
    return;
  }
  if (dist < r.retreatRange) {             // za blisko — cofa się w linii od gracza
    body.setVelocity(awayFromPlayer * r.retreatSpeed);
    return;
  }
  if (dist > r.fireRange) {                // za daleko — dochodzi
    this.scene.physics.moveToObject(this, player, SPIDER.chaseSpeed);
    return;
  }
  body.setVelocity(0, 0);                  // w pasie ognia — staje i strzela
  if (nowMs >= this.nextFireAt && !player.isDead) this.enterWindup(nowMs);
}

// Zaangażowany, gdy podniesie odnóża: telegraf to obietnica dana graczowi.
protected canDeaggro(): boolean { return this.phase === "hold"; }

// Cios obuchowy kasuje plucie: sieć nie wylatuje, a cooldown i tak rusza,
// więc przerwanie realnie kupuje ten dystans, który obiecuje.
interrupt(): void {
  if (this.isDead || this.phase !== "windup") return;
  this.phase = "hold";
  this.setBaseTint(null);
  this.nextFireAt = this.scene.time.now + SPIDER.ranged.cooldownMs;
}
```

Strzał celuje **w środek ciała (physics body), nie sprite'a** — każdy byt ma
ciało zakotwiczone u stóp, więc strzał ze środka sprite'a w środek sprite'a
przechodzi 5 px POD hitboxem gracza i pudłuje zawsze (zmierzone).

Sieć jest **głupia celowo**: leci prosto, nie śledzi, trafia raz, ginie na
terenie/krawędzi świata albo po `lifetimeMs`. Nakłada spowolnienie przez
`Player.applySlow`, które **zastępuje**, a nie kumuluje — trzy sieci spowalniają
dokładnie tak samo jak jedna. Nietykalność (dash, łaska po wskrzeszeniu)
zdejmuje i obrażenia, i debuff.

### 3.3 Liczby wynikowe (policzone z powyższego)

| | wartość |
|---|---|
| Cykl strzału | 420 ms tellu + 2600–3500 ms przerwy → **jeden strzał na ~3,0–3,9 s** |
| Realne dps sieci | 5,5 obr. średnio / ~3,45 s ≈ **1,6 dps** |
| Realne dps dotyku | 4 obr. / 1,2 s ≈ **3,3 dps** |
| Czas zabicia (miecz, 23 dps) | 42 HP ≈ **1,8 s kontaktu** |
| Pościg z pasa ognia do zasięgu miecza | 220 → 68 px przy różnicy prędkości 66 px/s ≈ **2,3 s** |
| Lot sieci | 273 px maks. (`fireRange` 220 mieści się w tym) |
| Spowolniony gracz | 150 → **82,5 px/s** (wolniej niż uciekający pająk 84) |

**Uwaga do §3.3, wiersz 1:** pająk zadaje w dotyku ~2× więcej dps niż swoją
„bronią". To jest zamierzone (bronią jest slow, nie liczba), ale warto, żeby
recenzent to skomentował — patrz pytania w §7.

### 3.4 Rozstawienie na mapie (odczytane z `forrest.tmj`)

| obiekt | pozycja | uwaga |
|---|---|---|
| pająk A | (1752, 1428) | **134 px** od dzika (1872,1488) — wewnątrz jego aggro (175) |
| pająk B | (1812, 1598) | **125 px** od tego samego dzika — wewnątrz aggro |
| pająk C | (2256, 1680) | **429 px** od najbliższego dzika — stoi sam |
| gracz (spawn lasu) | (1232, 1616) | |

Zamysł: **samotny uczy, czym jest sieć; para przy dziku uczy, po co ona jest** —
spowolnienie zamienia unikalną szarżę dzika w nieunikalną. To pierwsza lekcja
„najpierw zabij tego z tyłu" w całym bestiariuszu.

### 3.5 Counterplay (świadomie wbudowany)

1. **Tell 420 ms** i sieć commituje się do miejsca, w którym stałeś → strafe wygrywa.
2. **Unik ignoruje spowolnienie** — dash pokonuje stały dystans w stałym czasie.
3. **Młot przerywa** plucie (jedyna broń z `interrupts`).
4. **Pościg jest wygrywalny**: 150 vs 84 px/s.
5. Teren pochłania pocisk… **ale nie dzisiaj** — kolider pocisków celuje w grupę
   `map.solids`, a mapa lasu nie ma ani jednego static body. Ten punkt
   counterplayu jest **na razie martwy** i zacznie działać dopiero z kolizjami
   kafelkowymi (zaparkowane, patrz §6).

### 3.6 Loot, nazwa, grafika

- **Pajęcza nić** (`spider_silk`), szansa 0,75, 1–2 szt., 7 g za sztukę.
  **Nie wymaga Skórowania** — obcinasz ją z sieci, nie z pająka.
- Nazwa dla gracza: „Pająk sieciarz" (`ENEMY_NAMES`).
- **Grafika: nie istnieje.** Pająk i sieć są zawsze generowane proceduralnie
  (`makeSpiderPlaceholder`, 28×22 px; `makeWebPlaceholder`, 14×14) — nie ma
  `spider.png`. Nie ma też animacji kierunkowej: tylko `setFlipX` i proceduralne
  FX ruchu (przechył/rozciągnięcie/oddech). Dla porównania: zając, dzik i wilki
  mają prawdziwe arkusze 4-kierunkowe.

### 3.7 Fabuła (`docs/swiat.md`)

Pająki to **pierwszy ślad tego, co siedzi głębiej w lesie** — coś wypchnęło
wilka pod wioskę. Nie polują jak zwierzę, tylko **oplątują i czekają**. Mają
sprawiać wrażenie, że wschodnia gęstwina należy już do kogoś innego, i
**świadomie niczego jeszcze nie tłumaczą** (żaden NPC nie umie odpowiedzieć,
co jest za mostem — to celowa dziura, nie brak treści).

---

## 4. Feedback z playtestu

Autor po zagraniu: walka jest bardziej dynamiczna, **pająki wyszły łatwiejsze**,
bo targetowanie + podejście do cofającego się pająka działa (84 px/s przeciw
150 px/s). Ten pościg został uznany za **zawartość, którą warto chronić** — to
jeden z powodów, dla których auto-follow jest odrzucony (§6).

---

## 5. Jak technicznie dodaje się nowego stwora

Bazowa klasa `Enemy` jest sterowana configiem i wystawia haki; nowy stwór to:

1. blok w `GameConfig.ts` (`EnemyConfig` + własna sekcja mechaniki),
2. podklasa `Enemy` nadpisująca **tylko** potrzebne haki,
3. `EnemyType` (unia stringów), `ENEMY_NAMES`, dwa `switch`e w `GameScene`
   (tworzenie + loot), nazwa obiektu w czytniku mapy,
4. placeholder tekstury w `Assets.ts` (gra **zawsze** się uruchamia bez PNG-ów),
5. punkty spawnu w Tiled — `.tmj` jest źródłem prawdy, generatory Pythona to
   tylko rusztowanie.

Dostępne haki (wszystkie domyślnie no-op):

| hak | kiedy | kto już używa |
|---|---|---|
| `updateChase(player, now)` | co klatkę w stanie pościgu | wszyscy poza zającem-bazą |
| `canDeaggro()` | czy wolno zerwać pościg | pająk (nie w `windup`), dzik, Szary |
| `onGainAggro` / `onLoseAggro` | wejście/wyjście z pościgu | wilk (wycie), pająk (reset fazy) |
| `postMove(now)` | tuż po zapisaniu prędkości — do jej **kształtowania** | zając (skoki) |
| `onHurt()` / `onDeathVisual()` | jednorazowe klipy | wilki |
| `updateAnimation(vx, vy)` | wybór animacji z prędkości | zając, dzik, wilki |
| `interrupt()` | trafienie bronią obuchową | dzik, wilk, Szary, pająk |

Twarde reguły przy stawianiu nowego stwora na mapie lasu:

- **Wataha i Szary**: trzy wilki są w promieniu 115–133 px od siebie (jedno
  wycie budzi całą trójkę), a Szary stoi **296 px** od najbliższego z nich —
  poza `callRadius` 200. To jedyne, co powstrzymuje wycie od wciągnięcia elity
  z 190 HP do walki z trójką. Margines jest celowo duży.
- **Zasięgi interakcji NPC/ognisko** muszą być rozłączne parami (klawisz `E`).
- Odległości spawnów są sprawdzane skryptem przy każdym uruchomieniu generatora
  mapy — nowe rozstawienie ma dostać taką samą regułę, jeśli od czegoś zależy.

Zapisu stanu przeciwników **nie ma** (poza licznikiem zabójstw, na którym jedzie
nieśmiertelność Szarego) — żywe stwory nie są persystowane.

---

## 6. Decyzje już podjęte — proszę NIE proponować ich od nowa

Wszystkie są zapisane w `docs/odlozone.md` razem z warunkiem powrotu:

| rzecz | status |
|---|---|
| **Trzeci typ ochrony (chityna)** | **zaparkowany**. Pająk aż prosi się o pancerz, ale `metal` to MATERIAŁ, nie abstrakcyjna klasa „sztywny". Osobno: przy dwóch kategoriach ochrony trójkąta trzech typów nie da się domknąć. Wraca po playteście, który pokaże, czy `slash` jest porzucany. |
| **Auto-follow / podchodzenie do celu** | **odrzucone**. Skasowałoby pościg za cofającym się pająkiem, wskazany po playteście jako fajny. |
| **Feedback otrzymywanych obrażeń** | zaparkowany. Gracz **nie widzi liczb obrażeń, które dostaje** — tylko pasek HP, flash i winieta. To ogranicza, co da się przekazać nowym stworem. |
| **Kolizje kafelkowe w lesie** | zaparkowane (układ najpierw). Stąd martwy punkt 5 w §3.5. |
| **Płaska Siła → `+% obrażeń`** | zaparkowane; wymaga przestrojenia całej drabinki naraz. |
| **Krzywa XP** | nieprzestrojona: pula mapy urosła 310→825 XP, jedno przejście daje lvl 11 zamiast 6. Nowy stwór **dokłada do tej puli** — proszę to uwzględnić w propozycji nagrody XP. |
| **Ciężar pancerza, `metal.blunt`, trwałość pancerza** | zaparkowane osobno. |

Reguła metodologiczna projektu: **nie stroi się dwóch rzeczy naraz** — inaczej
potem nie wiadomo, która zadziałała.

---

## 7. Zadanie A — ocena Pająka sieciarza

Pytania, na które prosimy o odpowiedź (z uzasadnieniem, nie samym werdyktem):

1. **Czy „wsparcie" faktycznie działa?** Sieć to ~1,6 dps, a sam dotyk ~3,3 dps.
   Czy przeciwnik, którego główna broń zadaje mniej niż jego przypadkowy dotyk,
   czyta się dla gracza jako wsparcie, czy jako słaby strzelec?
2. **Czy spowolnienie −45% na 2,6 s jest właściwą wielkością?** Zwłaszcza
   w zestawieniu z tym, że spowolniony gracz (82,5 px/s) jest **wolniejszy od
   uciekającego pająka (84 px/s)** — czyli po trafieniu sieć skutecznie zamyka
   pościg. Zamierzone czy przypadek?
3. **Czy `aggroRange` 230 > `fireRange` 220 jest dobrym ustawieniem?** Pająk
   zauważa gracza minimalnie wcześniej, niż zaczyna strzelać.
4. **Czy 42 HP i 55 XP są spójne z resztą tabeli z §2?** (wilk: 55 HP / 45 XP.)
5. **Co zrobić z martwym counterplayem** „teren pochłania pocisk" (§3.5 pkt 5)
   — czekać na kolizje, czy pająk potrzebuje w zamian czegoś innego?
6. **Czy pojedynczy pająk poza zasięgiem dzika ma rację bytu**, skoro w izolacji
   jest wyłącznie irytacją? (Zamysł: uczy, czym jest sieć.)

## 8. Zadanie B — brief: pająk walczący w zwarciu

Chcemy drugiego pająka, który **walczy w zwarciu**. Prosimy o projekt: rola,
mechanika, liczby (w formacie bloku configu z §3.1), rozstawienie i uzasadnienie.

**Ograniczenia, w których musi się zmieścić:**

- **Nie może powielić żadnej z nisz z §2.** „Szybciej biegnie i mocniej bije"
  to wilk. „Dużo HP i jeden telegraf" to dzik. Ma odpowiadać na **inne pytanie**
  niż stwory, które już są — tak jak sieciarz odpowiada na inne niż reszta.
- **Musi mieć czytelny counterplay** i musi go mieć gracz na **niskim poziomie**
  (Unik dopiero od 3, Wir ostrzy od 6, Okrzyk od 10 — nie wolno założyć, że
  gracz je ma).
- **Musi respektować ukorzenienie po zamachu**: gracz, który zaatakował, przez
  ~180–260 ms nie może się ruszyć. Przeciwnik, który karze za samo zaatakowanie
  bez wcześniejszego sygnału, jest podatkiem, nie zagrożeniem (dokładnie ten
  zarzut jest już otwarty wobec watahy wilków).
- **Pancerz: domyślnie NIE.** Chityna czeka na własny, trzeci typ ochrony
  (§6). Jeśli propozycja naprawdę wymaga pancerza, trzeba to uzasadnić i pokazać,
  co się dzieje, gdy przypnie mu się istniejące `leather`/`metal`.
- **Typ obrażeń trzeba świadomie wybrać** (`slash` / `pierce` / `blunt` /
  `null` = celowo bez typu) i uzasadnić. Dziś oba pająki są nieotypowane w obie
  strony — to stan czysty i otypowanie jednej połowy zrobiłoby z nich przypadek
  połowiczny.
- **Grafika: brak i długo nie będzie.** Wszystko musi czytać się przez
  sylwetkę 28×22 px, tint i proceduralne FX ruchu. Mechanika, której nie da się
  pokazać bez nowej animacji, jest nie do przyjęcia. Tell może być tintem
  (tak działa dzik, Szary i sieciarz).
- **Brak feedbacku liczbowego dla otrzymywanych obrażeń** (§6) — gracz nie
  zobaczy „ten cios zadał mniej".
- **Musi współgrać z sieciarzem, jeśli mają stać obok siebie**: dwa pająki, które
  robią to samo w innej skali, to nie jest para.

**Prosimy, żeby odpowiedź zawierała:**

1. Jedno zdanie: **na jakie pytanie ten przeciwnik każe graczowi odpowiedzieć**.
2. Blok configu w formacie z §3.1 (pełne liczby, komentarze przy tych, które są
   nieoczywiste).
3. Maszynę stanów w tych samych kategoriach co §3.2 (jakie fazy, co je zaczyna
   i kończy, co robi `canDeaggro`, na co reaguje `interrupt`).
4. **Rozstawienie**: ile sztuk, obok czego i dlaczego — z tą samą logiką co
   „jeden uczy, dwa przy dziku pokazują po co" (§3.4). Uwaga na regułę odległości
   od watahy i Szarego (§5).
5. **Counterplay wypisany punktowo**, osobno dla gracza bez umiejętności i z nimi.
6. Nagrodę XP i loot — z odniesieniem do nieprzestrojonej krzywej XP (§6).
7. **Co ta propozycja psuje** — jeden akapit uczciwego kosztu. Projekt ceni
   wskazanie kosztu wyżej niż entuzjazm.

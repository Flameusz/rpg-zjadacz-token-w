# `src/entities/` — stworzenia, gracz, pociski

Reguły dotyczące **wyłącznie** tego katalogu. Liczby i balans → `GameConfig.ts`.
Stan projektu, mapy, assety → `CLAUDE.md` w korzeniu. Pełne analizy i pomiary →
`docs/` (indeks: `docs/README.md`).

⚠ **Ten plik dochodzi automatycznie tylko przy `Read`/`Edit`.** Odczyt bashem
(`cat`/`sed`/`grep`) niczego nie wstrzykuje — jeśli czytasz ten katalog bashem,
otwórz go wprost.

---

## Zasada wspólna: nowy wróg to KONFIG + PODKLASA + SPAWN

`Enemy` jest bazą sterowaną danymi (`EnemyConfig`): patrol, pościg, obrażenia
kontaktowe, odrzut, śmierć, pasek HP. Nowe stworzenie **nie forkuje AI** —
dostaje blok w `GameConfig`, podklasę z nadpisanymi hookami i punkty na mapie.

**Hooki (wszystkie `protected`, domyślnie puste):**

| hook | kiedy | po co powstał |
|---|---|---|
| `updateChase` | co klatkę w pościgu | orbitowanie wilka, pojedynek Szarego |
| `canDeaggro` | przed zerwaniem pościgu | blokada w trakcie splochu królika |
| `onGainAggro` / `onLoseAggro` | wejście/wyjście z pościgu | dźwięk, reset stanu |
| `updateAnimation(vx, vy)` | po ruchu | prawdziwe arkusze klatek |
| `postMove(now)` | **po** zapisaniu prędkości klatki, żeby ją UKSZTAŁTOWAĆ | skok królika |
| `onHurt` / `onDeathVisual` | jednorazowo z `takeDamage`/`die` | klipy hurt/death |

⚠ **`postMove` siedzi WEWNĄTRZ bramki odrzutu i PRZED `updateMotionFx`.**
Impuls odrzutu jest właścicielem ciała — nie ma wtedy prędkości AI do
kształtowania. A przed FX, bo inaczej przechył i rozciągnięcie liczyłyby się z
tego ślizgu, który `postMove` właśnie zastępuje.

---

## ⚠ Zachowanie ZGŁASZA INTENCJĘ, nigdy nie pisze prędkości (od 2026-08-28)

Ruch przeszedł na warstwę `src/core/movement/`. **Podklasa nie woła już
`body.setVelocity` ani `physics.moveToObject` w gałęzi AI** — mówi, CZEGO chce,
a solver decyduje, JAK to osiągnąć:

| dawniej | dziś |
|---|---|
| `physics.moveToObject(this, player, speed)` | `this.move.seek(player.x, player.y, speed)` |
| `body.setVelocity(0, 0)` | `this.move.hold()` |
| `body.setVelocity(lungeVel.x, lungeVel.y)` | `this.move.impulse(lungeVel.x, lungeVel.y)` |
| ręczne liczenie punktu na orbicie | `this.move.ring(...)` |
| `normalize().scale()` od gracza | `this.move.flee(player.x, player.y, speed)` |

⚠ **Rodzaj intencji NIE jest kosmetyką — niesie politykę wobec przeszkody.**
`seek` wolno objechać przeszkodę, `flee` wolno się tylko ślizgnąć (ucieczka nie
ma punktu, do którego mogłaby zawrócić), `impulse` nie jest ruszany w ogóle.
Zmierzone: potraktowanie zrywu sarny jak dojścia do punktu ścięło pełne zrywy
z 83 % na 73 %. **Wybierając intencję, wybierasz zachowanie przy drzewie.**

⚠ **Kolejność w `updateAI` jest częścią kontraktu:** `beginFrame()` → zachowanie
zgłasza intencję → `move.resolve()` → `postMove`. Intencja żyje JEDNĄ klatkę;
`resolve()` **milczy**, gdy nikt nic nie zgłosił. To ostatnie jest celowe — na
tym stała migracja podklas po jednej, i na tym stoi każda przyszła.

⚠ **`postMove` zostaje hookiem KSZTAŁTUJĄCYM i nie wolno wsadzać tam omijania
przeszkód.** Solver PRODUKUJE wektor, `postMove` go modeluje (skok królika).
Zlanie tych ról to dokładnie ten hack — „`body.blocked` → obróć o 90°" — którego
ta warstwa miała nie być.

⚠ **Trzy miejsca dalej piszą prędkość wprost i to jest poprawne**, bo leżą POZA
gałęzią AI: ogłuszenie (`updateAI`, zeruje co klatkę), odrzut/impuls oraz
`interrupt()`/`onStunned()` wołane z walki. Priorytet **impuls > ogłuszenie >
AI** jest nietknięty.

⚠ **Nowy wróg dostaje `solver` w konfigu, domyślnie `"direct"`.** Omijanie
(`"steer"`) włącza się per gatunek — stworzenie, które obchodzi drzewa, czyta się
inaczej niż to, które w nie wchodzi. Bramka: `node tools/movement_weryfikacja.mjs`.

## ⚠ Ciało fizyczne: `applyBody`, i liczba w configu NIE jest w pikselach świata

Każde stworzenie z ciałem deklaruje je przez `applyBody`
(`src/core/movement/BodySpec.ts`). Powód jest zmierzony: `Critter` jako jedyny
nie deklarował ciała wcale i dostawał **klatkę arkusza** — sarna 79 × 57 px,
przez co po dodaniu kolizji terenu miała dostęp do 39,5 % mapy w **163 wyspach**
i nie mieściła się we własnym spawnie.

⚠⚠ **`bodyWidth`/`bodyHeight` są w pikselach KLATKI. Arcade mnoży je przez skalę
duszka co klatkę** (`Body.updateBounds`), więc realne ciało dzika to
**22 × 2,1 = 46 px**, a nie 22 px. Pytając „czy to się zmieści", pytaj
`dev.bodies()`, nigdy configu — na tym mnożniku przewróciła się już cała analiza
prześwitów w lesie z 2026-08-27.

⚠ **`aggro()` jest PUBLICZNE** — jedno stworzenie może obudzić drugie (wycie
wilka). Rekurencja się kończy, bo `aggro()` na goniącym już wilku jest no-opem.

---

## ⚠ Ataki prowadzi `ActionRunner`, nie własny `switch`

Od Fazy 2 Combat v2 **wszystkie sześć stworzeń** używa `core/CombatAction.ts`.
Nie dopisuj siódmej ręcznej maszyny `windup → active → recovery`.

**Podział, który trzeba trzymać:** runner mówi, CO się właśnie stało; encja robi
z tym cokolwiek Phaserowego. Runner **nie zna** prędkości, tintu, dźwięku ani
sceny — i nie może poznać, bo wtedy przestanie dać się uruchomić w Node, a to
jedyny sposób, żeby migrację dało się w ogóle sprawdzić.

- **Kiedy atakować** zostaje w `updateChase` — to zależy od dystansu i od
  gatunku. Runner odpowiada tylko „czy wolno" i prowadzi przebieg.
- **Moment rozstrzygnięcia jest własnością ENCJI, nie runnera.** Skoczek,
  królik, Szary i kieł dzika rozstrzygają na WEJŚCIU w `active` (stoją i biją).
  Wypad wilka i szarża dzika — na WYJŚCIU albo co klatkę w locie, bo lecą przez
  przestrzeń. Runner emituje jedno i drugie; podklasa wybiera.
- ⚠ **`activeMs` przy locie jest LIMITEM, nie długością.** Kończy go
  `endActive()` — po dystansie albo o teren.
- ⚠ **Cooldown per PRÓBĘ, nie w akcji**, gdy zależy od stanu: jitter sieciarza i
  wilka, mnożnik szału Szarego. Runner jest czysty i **nie ma prawa losować**.
- ⚠ **`reset()` kasuje fazę, ZOSTAWIA cooldowny.** Stworzenie, które właśnie
  ugryzło, nie ma prawa ugryźć ponownie tylko dlatego, że gracz wyszedł i wrócił.
- ⚠ **Cooldown kotwiczy się w WEJŚCIU W `active`**, nie na końcu bezbronności.
  Przerwanie obuchem ma kupować cały cios, nie odraczać go.

Bramka: `tools/action_runner_weryfikacja.mjs`.

---

## Tinty: `setBaseTint`, nigdy `setTint`/`clearTint`

⚠ **Każdy telegraf w tej grze jest tintem, a `flashHit` kończył się kiedyś
bezwarunkowym `clearTint()`** — czyli jeden cios kasował całą sygnalizację
dokładnie wtedy, gdy jest potrzebna (w wymianie ciosów). Podklasa zmieniająca
tint bezpośrednio działa do pierwszego trafienia, potem znika.

⚠ **`restoreTint` przekazuje się jako GETTER, nie wartość.** Rozwiązany na
starcie mignięcia przywraca telegraf **nieaktualny** — dzik trafiony pod koniec
zamachu wracał na pomarańczowo już po starcie szarży. Fałszywy telegraf jest
gorszy niż żaden, bo gracz na niego reaguje.

---

## `interrupt()` vs `stagger(ms)` vs `stun(ms)` — TRZY różne rzeczy

- `interrupt()` — **kasuje ZAMACH**, wyłącznie w fazie `windup` i tylko gdy
  akcja jest `interruptible`. Własność konkretnej broni (dziś tylko młot).
  Na bazie no-op, więc `GameScene` woła to na czymkolwiek bez sprawdzania typu.
- `stagger(ms)` — **rusza tylko RUCH**, przedłużając to samo
  `knockedBackUntil`, którym od dawna rządzi odrzut. **Zero nowego stanu.**
  Oś rodziny broni (`blunt`), nie pojedynczej broni.
- `stun(ms)` — **odbiera PRAWO DO AKCJI** (2026-08-26). Ani ruchu, ani
  rozpoczęcia czegokolwiek. Własne pole `stunnedUntil` + hook `onStunned()`.

⚠ Broń może mieć jedno, drugie, oba (młot) albo żadne — dlatego `Math.max` przy
przedłużaniu okna. **Nie zlewaj ich w jedno pole.**

⚠ **`stun` KASUJE akcję (`ActionRunner.cancel`), nie zawiesza jej — i to nie
jest wybór stylistyczny.** `updateAI` pomija `updateChase`, dopóki trwa
`knockedBackUntil`, a **każde `akcje.tick()` siedzi wewnątrz `updateChase`**.
Terminy runnera są **bezwzględne**, więc zawieszenie stworzenia nie pauzuje
jego akcji: mijają w tle, a pierwszy tik po oknie odpala **zaległe przejścia
naraz**. Zmierzone (`combat_regresja.mjs` §T5): akcja z telegrafem 560 ms,
zawieszona w t=0 i odpytana w t=1000, wchodzi w `active` w tej samej klatce,
w której zawieszenie mija — czyli dzik bodzie **bez telegrafu**. Przy
zachwianiu młota (50 ms) tego nie widać; przy ogłuszeniu widać natychmiast.

⚠ **`ActionRunner` NIE MOŻE dostać pauzy.** Uczyniłaby jego oś czasu warunkową
i unieważniła `tools/action_runner_weryfikacja.mjs`, czyli jedyne narzędzie,
którym da się cokolwiek o tej maszynie udowodnić.

⚠ **`stunnedUntil` jest OSOBNYM polem od `knockedBackUntil`**, mimo że obie
bramki wyglądają identycznie. Chcą od ciała czegoś przeciwnego: odrzut żeby
**jechało** impulsem, ogłuszenie żeby **stało**. Priorytet w `updateAI` jest
jawny — **impuls > ogłuszenie > AI** — i zlanie ich przez `Math.max` daje albo
dryfującego ogłuszonego, albo zjedzony odrzut.

⚠ **Zdejmując ogłuszenie, pytaj podklasę o tint (`restoreStateTint()`), nie
gaś go.** Szary w szale nosi własny tint; bezwarunkowe `setBaseTint(null)`
kasowało go na stałe. **Zapamiętanie tintu sprzed ogłuszenia NIE DZIAŁA** —
stan może się zmienić w trakcie (szał wchodzi od ciosów, które gracz zadaje
właśnie dlatego, że przeciwnik stoi), więc odtworzenie zapisanej wartości
przywraca sygnał już nieaktualny. To ta sama reguła, przez którą `restoreTint`
jest getterem, tylko od drugiej strony: **utrata prawdziwego telegrafu jest tym
samym błędem co pokazanie fałszywego.**

⚠ **DR i odporność wejdą WEWNĄTRZ `stun()`**, bo długość jest parametrem, a nie
polem akcji — bez zmiany ani jednego wołającego. Dlatego dziś świadomie **nie
ma** żadnej tabeli DR: byłaby martwym slotem.

⚠ **Odrzut wymaga stanu, inaczej nie działa wcale.** AI wpisuje prędkość co
klatkę, więc bez zawieszenia jej uchwytu przesunięcie 160 px/s dawało realne
31 px przy zasięgu 66 — kosmetykę, nie narzędzie do robienia dystansu.

---

## ⚠ `Enemy` NOSI EFEKTY CZASOWE (od 2026-09-04) — i to jest CZWARTE pojęcie

Do tej daty stworzenie mogło dostać wyłącznie `interrupt`/`stagger`/`stun`.
Razem z **Rozcięciem** (pierwszy skill z Krwawieniem) `Enemy` deklaruje
`EffectTarget` i `EffectHost` i trzyma własny `EffectSet` — **tę samą warstwę,
której używa gracz** (`src/core/combat/StatusEffects.ts`).

⛔ **To NIE jest czwarty licznik obok tamtych trzech i nie wolno ich zlewać.**
`stun`/`stagger`/odrzut mówią CIAŁU, co ma robić, mają jawny priorytet
w `updateAI` i chcą rzeczy przeciwnych. `EffectSet` prowadzi czas, stosy
i tiki — i nie wie, czym jest krwawienie.

| co | gdzie | uwaga |
|---|---|---|
| nałożenie | `applyEffect(spec, source)` | bierze GOTOWY `EffectSpec`; producent buduje go u siebie |
| przewijanie | `updateEffects(deltaMs)` — **woła SCENA**, nie `updateAI` | patrz niżej |
| co efekt robi | `onEffectTick` → `takeEffectTick` | cicha ścieżka, bliźniak `Player.takeVenomTick` |
| prezentacja | `onEffectsChanged()` → ikona w `statusMarks` | wróg dalej NIE ma paska efektów; `core/Buffs` jest listą GRACZA |

⚠ **`updateEffects` jest wołane ze sceny, PRZED `updateAI` i poza jego
bramkami** — bo `updateAI` pomija całą gałąź AI przy ogłuszeniu i odrzucie,
a **ogłuszony ma dalej krwawić**. Bierze `deltaMs`, nie `nowMs`.

⚠⚠ **`updateEffects` zwraca „tik ZABIŁ" i wołający MUSI to obsłużyć.**
Księgowość zabójstwa (XP, łup, respawn, `Quests.recordKill`, licznik) należy
do `GameScene.creditKill`, tak samo jak przy `takeDamage`. `Enemy.die()` sam
z siebie nie przyznaje niczego — pominięcie zwrotu daje wroga, który znika
**bez nagrody i bez odrodzenia, nie zgłaszając niczego**. Pilnuje §V
w `tools/combat_regresja.mjs`.

⚠ **Tik NIE liczy pancerza i nie ma typu obrażeń** — ta sama reguła co przy
jadzie gracza, plus jeden powód własny: `ARMOR_PROFILE.metal.slash = 1,4`
mnoży PUNKTY OCHRONY (`Protection.armorPointsAgainst`), więc puszczenie
Krwawienia przez profil jako `slash` sprawiłoby, że stal **zjadałaby ranę
mocniej niż cios**, który ją zadał — rana od środka liczona drugi raz przez
pancerz. ⚠ Do 2026-10-09 stało tu „stal ZWIĘKSZA obrażenia rany" —
odwrócony kierunek modelu (`OI-23`, A-9); sama reguła była słuszna.

⚠ **Nie woła `onHurt()`** (klip zranienia należy do CIOSU) ani nie agruje —
żeby krwawić, trzeba było oberwać, a to już wprowadziło stworzenie w pościg.

⚠ **Znacznik nad głową to JEDEN RZĄD (`statusMarks`), nie pole na stan**
(2026-09-04, druga runda Rozcięcia). Do tej daty było tam pojedyncze
`stunMarker`; drugi znacznik liczony z tego samego `offsetY` stanąłby
**dokładnie na pierwszym**, bo ogłuszenie i rana **występują naraz** (Uderzenie
tarczą i Rozcięcie niczym się nie wykluczają). Geometria rzędu mieszka
w `COMBAT_FEEDBACK.statusMarks`.
- **Ogłuszenie wchodzi glifem, efekt — ikoną ze swojego `spec.iconKey`.**
  `Enemy` **nie zna** `abilityIconKey` i nie ma prawa poznać: druga zdolność
  zadająca ranę pokaże SWOJĄ ikonę bez zmiany ani jednej linijki w encji.
- ⛔ **Rząd nie jest źródłem prawdy o stanie.** Ogłuszenie mieszka
  w `stunnedUntil`, rana w `EffectSet` — mapa jest wyłącznie tym, co WIDAĆ.
  Pytanie „czy krwawi" zadaje się `this.effects`, nigdy jej.
- ⚠ **Ikona gaśnie, bo ogłasza to warstwa** (`EffectSet` woła
  `onEffectsChanged` przy nałożeniu, odświeżeniu, wygaśnięciu i zdjęciu).
  Drugi licznik po stronie prezentacji rozjechałby się z pierwszym — to jest
  ta sama reguła co zakaz `bleedUntil`. Pilnuje §V15 w `combat_regresja.mjs`.

⚠⚠ **`Player.rollDamage` robi JEDEN rzut i DWA odwzorowania — nie ruszaj tego
bez przeczytania powodu.** `base` idzie do ciosu, `basePrzedKrytykiem` do
snapshotu efektu. Rozpisany `FloatBetween` jest tam celowo (jest **dosłownie**
`Math.random() * (b − a) + a`, więc `base` zostaje bit w bit, a rzut jest
nadal JEDEN). Powód: `critLowCut` podnosi przy krytyku podłogę losowania, więc
liczenie snapshotu z `base` sprawiało, że **krytyk podnosił Krwawienie
pośrednio** o +12,5%/+25% dla topora i sztyletu na M-II+. Pilnują tego §V11–V13
w `tools/combat_regresja.mjs`.

📄 Wzory, przepływ, zachowania brzegowe i zależności: `docs/systemy/effects.md`.

---

## Obrażenia BRANE przez gracza

⚠ **`Player.takeDamage(amount, damageType, from)` — trzeci i drugi parametr są
WYMAGANE**, `null` znaczy „świadomie bez typu / bez kierunku". Opcjonalny
parametr sprawia, że „zdecydowaliśmy, że to nie ma typu" i „ktoś zapomniał"
wyglądają w źródle identycznie — `damageType` był opcjonalny przez dwa wydania,
każdy wołający go pomijał, i cała kolumna `metal` w `ARMOR_PROFILE` nie robiła
nic, a nic tego nie zgłaszało.

⚠ **KANAŁÓW jest WIELE, nie „jeden na wroga", i JEDNO stworzenie potrafi
używać dwóch naraz.** Stan po Combat v2 (zweryfikowany w kodzie 2026-08-26):

| kanał | kto | test trafienia |
|---|---|---|
| `Enemy.tryTouchDamage` — kontakt | **tylko `Spider`, `VenomSpider`, `GreyWolf`** | nakładanie ciał (`physics.add.overlap`) |
| własne rozstrzygnięcie akcji | `Bandit.resolveSwing` (trzy odmiany zbója), `Bear.resolveSwipe`, `Boar` (szarża + gore), `Deer.resolveRam`, `Fox.resolveBite`, `GreyWolf.resolveBite`, `Wolf` (kęs watahy), `Rabbit`, `VenomSpider` | własny test zasięgu (`gapBetween`/`reach`), nie overlap |
| `Projectile.hitPlayer` | sieciarz | nakładanie ciał |
| jad (`takeVenomTick`) | skoczek | brak — tyka po nałożeniu |

⚠ **`Boar.tryTouchDamage` już NIE ISTNIEJE** — szarża jest akcją `ActionRunner`a
ze sprawdzaniem toru co klatkę. Nie szukaj tej metody i jej nie odtwarzaj.

**Otypowanie tylko „zaprojektowanego" ataku zostawia większość obrażeń poza
systemem** — pomiar sprzed Combat v2: zwykły kontakt to 54% wyjścia dzika i 29%
Szarego w zwarciu. **Reguła obowiązuje dalej**, mimo że dzik kontaktu już nie
ma: każdy nowy kanał musi nieść `damageType`.

⚠ **`hitVectorTo` mierzy między CIAŁAMI, nie duszkami.** Ciało każdego
stworzenia jest zakotwiczone u stóp, dużo niżej niż środek sprite'a. Kilka
stopni przekosu = trafienie przy granicy ćwiartki raz się blokuje, raz nie, i
nic na ekranie tego nie tłumaczy.

⚠ **Kierunek POCISKU to jego odwrócony wektor lotu, nigdy pozycja.** W momencie
trafienia pocisk nakłada się na gracza, więc różnica pozycji jest szumem.

**Jad (`applyVenom`/`updateVenom`/`takeVenomTick`) to CICHA ścieżka i każda
różnica wobec `takeDamage` jest zamierzona**: bez dźwięku, bez mignięcia, bez
trzęsienia kamerą (cztery tiki = cztery trzęsienia = czyta się jak usterka),
**bez pancerza i bez typu** (pancerz zatrzymuje cios, nie truciznę już w
środku), i **nietykalność go nie zatrzymuje**. Dzieli za to blokadę regeneracji
i kasowanie posiłku — stąd bierze się koszt czasowy, który zamyka dziurę
„odejście = darmowy reset".

---

## ⚠ Królik NIE jest melee-przez-kontakt i to jest DECYZJA (2026-08-22)

`Rabbit` to archetyp **`Prey`**: płochliwy domyślnie, **agresywny po
uderzeniu**. `tryTouchDamage` jest **jawnie nadpisane na no-op** — nie usunięte,
żeby baza nie zadawała obrażeń przy otarciu się o zwierzę.

- **Nie „przywracaj" mu obrażeń od kontaktu.** To był jego jedyny kanał ataku i
  jednocześnie powód, dla którego wchodził w sylwetkę gracza: overlap ciał
  zaskakuje dopiero po ~9 px zanurzenia.
- Kęs (`RABBIT.bite`) ma **własny test zasięgu** rozstrzygany w chwili
  uderzenia (`reach` > `range`), wzorem `GreyWolf`/`VenomSpider`.
- `provoked` jest jednokierunkowe — odejście nie kasuje konsekwencji ciosu.
- ⚠ **Ucieczka MUSI być przerywana (zryw → czujność), nigdy ciągła.** Atak
  wymaga zatrzymania się (`resolveAttack` wychodzi na `isMoving`), więc cel,
  który ucieka bez przerwy, **wychodzi spod każdego zamachu, zanim ten wystartuje**
  — pierwsza wersja była dokładnie taka i uciekającego królika nie dało się
  trafić w ogóle. `prey.watchMs` jest oknem, w którym cel STOI; poniżej ~400 ms
  błąd wraca. **Ta sama pułapka czeka na każdego przeciwnika trzymającego
  dystans: „czy dogoni" i „czy trafi" to dwa różne pytania.**
- Sploch (`RABBIT.panic`) został nietknięty i wchodzi PONAD walką: poniżej 40%
  HP zwierzę zrywa wymianę, bolt-uje i zamiera.

Pełny łuk i pomiary: `docs/systemy/combat.md`, Faza 4.

---

## ⚠ `contactDamageEnabled` — wyłączanie kontaktu przy DZIEDZICZENIU

Getter na `Enemy`, nie nadpisanie `tryTouchDamage`, i to jest wymuszone:
`GreyWolf extends Wolf`. Wilk zrezygnował z kontaktu (jego kęs ma własny test
zasięgu), ale u Szarego kontakt to **29% wyjścia w zwarciu** — nadpisanie metody
na no-op zabrałoby kanał także podklasie. Szary jawnie przywraca `true`.

⚠ **Wyłączać wolno TYLKO stworzeniu, które dostało własny test zasięgu.** Samo
zdjęcie kontaktu robi z wroga manekina.

⚠ **Niedźwiedź jest dziś PRZYKŁADEM tej reguły, nie wyjątkiem od niej** — to
zdanie mówiło do 2026-08-26 odwrotnie („dla niedźwiedzia to wciąż JEDYNY
kanał") i było nieaktualne od Fazy 3.3. `Bear.contactDamageEnabled` zwraca
`false`, bo *najpierw* dostał `resolveSwipe` z testem prześwitu i łuku. Kontakt
wymagał od niego zanurzenia **24 px w sylwetce gracza** — najwięcej w rosterze,
czyli dokładnie zgłoszony objaw w najgorszym wydaniu.

Dziś `false` mają: `Bandit`, `Bear`, `Boar`, `Deer`, `Fox`, `Rabbit`, `Wolf` (wszystkie
mają własny test) oraz `TrainingDummy`. `true`: `Spider`, `VenomSpider`, `GreyWolf`.

⚠ `GREY_WOLF.pack` **jest tym samym obiektem** co `WOLF.pack`, nie kopią. Nowe
pole ląduje u obu naraz.

⚠ Nazwy prywatnych pól i metod w `Wolf` muszą omijać te z `GreyWolf` —
`nextPackBiteAt`/`resolvePackBite` istnieją, bo podklasa ma własne `nextBiteAt`
i `resolveBite` dla zupełnie innego ataku.

---

## ⚠ Zwrot postaci należy do DRĄŻKA. Cel go nie przejmuje (cios na stojąco — tak, `OI-146`)

Od 2026-08-23 obowiązuje jeden model:

| kto | co ustala |
|---|---|
| joystick / WASD | **faktyczny zwrot postaci** (`zwrotRad`, kąt ciągły) |
| ⭐ **strefa obrotu drążka** (< `STICK.turnZoneFrac`) | ten sam `zwrotRad`, **bez ruszania ciałem** — 2026-09-11 |
| blokada celu | wybiera cel — i **nic więcej** |
| autoatak | startuje tylko, gdy cel jest w zasięgu **ORAZ** w przedniej półkuli |
| snap na cel (`aimAttackAt`) | **assist wewnątrz półkuli**, nigdy obrót |
| ⭐ lot Szarży/Wypadu (`driveLocked`, `faceAlongTravel`) | zwrot wzdłuż **kursu biegu** — jedzie za ciałem, nie za celem |
| ⭐ zamach **na stojąco** (`triggerAttack`, `OI-146`, 2026-10-09) | zwrot = `attackRad` — postać zostaje zwrócona tam, gdzie uderzyła; **w marszu nie** |

⚠ **Przejęcie zwrotu przez zamach (`OI-146`) NIE jest auto-obrotem do celu.**
Zamach w cel startuje dopiero po `canStrikeFacing`, więc zwrot przejmuje tylko
cios, który już legalnie padł w przedniej półkuli; wilk za plecami dalej nie
obrywa. Powód: bez tego po każdym ciosie pod kątem model, osłona i bramka
następnego ciosu wracały do kierunku ostatniego marszu („skakanie między
pozycjami" — autor). W marszu rozdział `attackRad` ↔ `zwrotRad` zostaje.

⚠ **Dwa dopiski z 2026-09-11 NIE rozmiękczają tej reguły — obydwa ją domykają.**
Strefa obrotu oddaje graczowi zmianę zwrotu **bez kroku** (dotąd jedynym
sposobem był krok, a `resolveAttack` odmawia startu zamachu w ruchu, więc
„Odwróć się" kazało wyjść z pozycji i wrócić). `faceAlongTravel` dopisuje
**jedną brakującą klatkę** tego, co `driveLocked` robił przez cały lot — bez
niej gracz trzymający drążek w innym kierunku dobiegał Szarżą i **nic się nie
działo, bez komunikatu**. ⛔ Ani jedno z nich nie obraca postaci do CELU; to
zostaje usunięte (2026-08-23).

Do tego dnia były trzy niezależne auto-obracania i żadne nie pytało gracza o
zdanie: `aimAttackAt` wołane bezwarunkowo przed zamachem, brak bramki kąta przy
trafieniu (bo pierwsze ją gwarantowało) i `faceTarget` obracające tarczę co
klatkę. Wilk okrążający wracał od pleców i po prostu obrywał — całe okrążanie
watahy nie miało konsekwencji.

- ⚠ **Bramka zwrotu sprawdza się PRZED snapem.** Odwrotna kolejność unieważnia
  sam warunek: `aimAttackAt` ustawia postać na cel, więc pytanie „czy patrzę na
  cel" odpowiadałoby zawsze „już tak".
- ⚠ **`guardKat` to WIDOK na to, co widać na postaci** — `attackRad` w pozie
  ataku, `zwrotRad` poza nią. Trzeciego źródła nie ma. `targetDir` był właśnie takim
  trzecim źródłem i dlatego zniknął: tarcza kryła cel, którego postać jawnie nie
  widziała.
- ⭐⭐ **GRACZ NIE MA JUŻ CZTERECH KIERUNKÓW (2026-09-27).** Stan to DWA kąty:
  `zwrotRad` (pisze wyłącznie `Player.ustawZwrot()`) i `attackRad` (pisze
  `aimAttackAt` / `aimAttackAlongMovement`). Pola `moveDir`/`attackDir`
  i gettery `facingDir`/`attackFacing`/`guardDir` są usunięte. Ćwiartkę liczy
  **wyłącznie `wierszArkusza(rad)` w warstwie rysowania arkusza 2D** (ścieżka
  awaryjna + pierwsze klatki sceny, zanim wczyta się model).
  ⛔ **Nie wołaj `wierszArkusza` z mechaniki** i nie przywracaj ćwiartki jako
  stanu — każda mechanika licząca w 4 kierunkach odjeżdżała od modelu 3D
  (`OI-140`, `OI-148`, `OI-149`, `OI-150`). ⛔ `Direction` zwierząt i wrogów
  (`Wolf`, `FarmAnimal`, `Rabbit`) to osobny świat — nie ruszany.
  Pełny zapis: `docs/postac3d_historia.md` §38.
  ⛔ **Model 3D NIE czyta już `body.velocity`.** Czytał do A5 i dawało to dwa
  zmierzone rozjazdy: obrót w miejscu (`STICK.turnZoneFrac` zeruje prędkość)
  był na modelu niewidoczny, a ślizg po przeszkodzie obracał postać w stronę
  ślizgu zamiast w stronę intencji. Nie przywracaj prędkości jako źródła.
  ⚙ **`OI-140` ZAMKNIĘTE 2026-09-21 (A6.3): osłona jest CIĄGŁA.**
  `Player.guardKat` niesie zwrot obrony jako kąt, `Protection.guardAngleDeg`
  przyjmuje od 2026-09-27 **wyłącznie liczbę** (`GuardFacing = number`;
  dane testowe w `tools/` podają kąty), a `canStrikeFacing` czyta `zwrotKat`.
  ⚙ **POZA ATAKU JEST CIĄGŁA OD 2026-09-22** (`Player.attackRad`). Kąt
  analogowy **był już na miejscu i był wyrzucany** — `aimAttackAt` dostaje
  celowanie w pełnych 360° i kwantował je, bo w epoce arkusza nie było komu
  podać czegoś więcej.
  ⚠ **`guardKat` w oknie zamachu poszło razem** i musiało — reguła „osłona
  kryje to, co widać" przestałaby obowiązywać, czyli wróciłoby `OI-140`
  wewnątrz zamachu.
  ⚠ **Wypad zamachu (`swingLunge`) też idzie za `attackRad`**, bo wzdłuż
  ćwiartki odjeżdżał do 45° od tego, w co postać jawnie patrzy (4,2 px w bok
  z 6 px wypadu).
  ✅ **`heading` w `triggerAttack` idzie za `attackRad` od 2026-09-27**
  (`OI-147`, wariant A) — **i to NIE jest hitbox**. Autoatak trafia po celu +
  zasięgu + bramce zwrotu; `offset`/`dirX`/`dirY` rysują wyłącznie pierścień
  efektu (`spawnSwingFx`), a wypad bierze ten sam wektor.
  `docs/postac3d_historia.md` §36.
  ⚠ **Zamach bez celu też musi CELOWAĆ przed `triggerAttack`** —
  `aimAttackAlongMovement()`. Bez tego poza czyta `attackRad` z poprzedniego
  ciosu, a `guardKat` w oknie pozy idzie za nim: Wir ostrzy kierował tak
  tarczę na plecy (`OI-150`).
  ⚠⚠ **Kierunek do celu liczy się w przestrzeni CIAŁ** — `GameScene.bodyVectorTo`
  (`combatOrigin` → `combatBody`), nie `target.x - player.x`. Wektor między
  duszkami odjeżdżał do **36,7°** (skoczek jadowity), bo ciało gracza leży
  21,7 px pod duszkiem, a ciała wrogów 2,3–15,7 px — i ciągnął za sobą model,
  wypad i osłonę w oknie zamachu. Wołając `aimAttackAt` z celem, bierz wektor
  z `bodyVectorTo`.
- ⚠ **Atak i obrona dzielą JEDEN predykat** (`Protection.isFrontal`) i jedną
  stałą (`FRONT_ARC_DEG`). Nie przepisuj sobie porównania kąta — konwencja
  granicy (`<` czy `<=`) jest tak samo nośna jak sama liczba. Pilnuje tego §L
  w `tools/combat_regresja.mjs`.
- ⚠ **Zawór zwarcia to `attackFacingBypassGapPx` (0 px), NIE `pointBlankRadius`
  (28 px).** Ten drugi odtworzyłby atak 360° w zwarciu — a zwarcie jest w tej
  walce stanem normalnym, nie awarią.

Cel za plecami **zostaje zaznaczony**; autoatak czeka i wystrzeli sam w klatce,
w której gracz się odwróci. Naciśnięcie ataku mówi wtedy „Odwróć się" — cisza
byłaby tu gorsza niż przy „Za daleko", bo wróg STOI W ZASIĘGU i wszystko
wygląda poprawnie.

---

## ⚠ Chybiony cios ZGŁASZA SIĘ, nigdy nie kończy cichym `return`

Od Fazy 5A każdy atak, który doszedł do rozstrzygnięcia, woła
`Enemy.reportAttack(actionId, outcome, player, mitigated)` — **także gdy
spudłował**.

Powód jest historyczny i wart zapamiętania: do 2026-08-23 chybienie kończyło się
cichym `return` w pięciu klasach naraz, więc **„uskoczyłem" i „on nie
zaatakował" wyglądały i brzmiały identycznie**. To była sytuacja stworzona przez
Combat v2 — wcześniej wrogowie nie mogli spudłować, bo `overlap` albo zachodził,
albo nie, i nie istniał „moment ataku". Cała kontrgra tej przebudowy była dla
gracza niewidoczna.

- ⚠ **Nie dokładaj efektu przed `return`.** To odtworzyłoby dług, którego
  pozbyła się Faza 2: pięć kopii jednej decyzji. Akcja produkuje semantyczne
  `ActionResolution`, a prezentacja jest jego konsumentem — jednym z kilku,
  bo ten sam obiekt ma zasilić log, AI i sieć.
- ⚠ **`ActionResolution` powstaje TYLKO dla ataku, który doszedł do
  rozstrzygnięcia.** „Atak nie nastąpił" to BRAK tego obiektu, nie osobny wynik.
- ⚠ **`Player.takeDamage` zwraca OBIEKT `{ outcome, mitigated, killed }`, nie
  `boolean`.** Czytaj po polach. `if (!wynik)` jest zawsze fałszywe i **`tsc`
  tego nie złapie** — tak omal nie przestał działać jad skoczka.

---

## Arkusze klatek: TRZY różne kształty, sprawdź który

1. **Kierunkowy z lustrem** (`rabbit.png`, `boar.png`) — 3 kierunki + `setFlipX`.
2. **Cztery kierunki NARYSOWANE osobno** (`wolf.png`, `greywolf.png`) — lewo to
   prawdziwa klatka, nie lustro.
3. **Jednokierunkowy pasek ×3 tekstury** (`bear_*`, `deer_*`, `fox_*`) — jeden
   profil, lustrowany; ⚠ te patrzą w **LEWO**, odwrotnie niż konwencja
   królika/dzika.

⚠ **Przy arkuszu 4-kierunkowym trzeba WYŁĄCZYĆ stare `setFlipX`.** Wołania
zostały z czasów, gdy każdy wilk był jedną teksturą patrzącą w prawo — zostawione
lustrują już poprawne klatki drugi raz, więc wilk idący w lewo pokazuje klatki
czytające się jako „w prawo".

⚠ **`animFn` przypisuje się w CIELE konstruktora, nie jako pole klasy.**
Inicjalizatory pól podklasy odpalają się PO powrocie z `super()`, a baza woła
już wtedy `this.play(...)` — czyli z domyślną wartością rodzica.

⚠ **Animacja królika idzie ze STANU skoku, nie z prędkości podanej przez bazę.**
Pauza między skokami zeruje prędkość; czytanie jej mruga sprite'em do klatki
idle dwa razy na sekundę.

---

## Pociski (`Projectile.ts`) — dwie pułapki, obie wyglądają jak „nic się nie dzieje"

⚠ **Dodanie ciała do grupy Arcade RESETUJE je do domyślnych grupy**, w tym
`setVelocityX/Y: 0`. Prędkość ustawiona w konstruktorze znika po `group.add()`.
Dlatego `launch()` woła się PO dodaniu. Objaw, gdy było źle: sieć powstawała,
rysowała się i wisiała nieruchomo 156 klatek.

⚠ **Celuj w przestrzeni CIAŁ, nie sprite'ów** — strzał ze środka duszka w środek
duszka przechodzi POD hitboksem celu (zmierzone 5 px zapasu, czyli pudło za
każdym razem, bez niczego na ekranie).

Encje strzelają przez interfejs `ProjectileHost`, który implementuje
`GameScene` — import sceny byłby cyklem.

---

## Granica: co jest `Enemy`, a co dekoracją

- `FarmAnimal` (7 gatunków, jedna klasa) — **zero HP, zero walki**, tylko
  wędrówka/postój. **Nie rób z nich podklas** — różnica między gatunkami
  mieszka WYŁĄCZNIE w konfigu (`FarmAnimalTuning`), nigdy w kodzie klasy.
- ⚠ **`Critter` (sarna, lis) NIE ISTNIEJE od 2026-10-04.** Oba gatunki
  wyszły z niego całym kontraktem — lis (`Fox.ts`) i jeleń (`Deer.ts`) są
  przeciwnikami; klasa bez gatunków została usunięta razem z `CritterTuning`
  i `critterSpawns`. Liczby zrywu jelenia z Fazy 1 fauny przeszły bez zmian
  do `DEER.flight`. ⛔ Nie odtwarzaj kryttera dla nowej zwierzyny „bez walki"
  bez decyzji autora — patrz `docs/systemy/creatures.md` §5.
- `Bird` — nie ma nawet `update()`, sam sobie planuje przeskoki tweenem.
- **Cokolwiek jest STATYCZNYM OBRAZKIEM, nie należy tutaj** — idzie do
  `DECOR_PROPS` w `GameConfig` (patrz `src/world/CLAUDE.md`). Rekwizyt, któremu
  urośnie zachowanie, wychodzi z tamtej tabeli; **nie dodawaj tam flagi**.

⚠ **Nowe stworzenie to CZTERY rzeczy, nie dwie.** Niedźwiedź pojechał z
konfigiem, encją i spawnem — **bez łupu i bez dźwięku**, czyli najtwardszy
odradzający się wróg w grze nie zostawiał nic i nigdy się nie odzywał. Do tego
stał poza raportem odległości spawnów w `tools/build_mapa.py`, czyli poza jedyną
siatką łapiącą ciche przesunięcie w Tiled.

⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.** Dodając
regułę odległości sprawdź, że po celowym przestawieniu spawnu raport faktycznie
zgłasza BŁĄD.

---

## Testowanie w silniku — dwie pułapki wyglądające jak błąd kodu

⚠ **Wrogowie zderzają się ze sobą** (jest collider `enemies × enemies`), więc
ustawienie kilku sztuk w rzędzie sprawia, że się rozpychają i **każdy pomiar
odległości jest skażony**. Wyłącz pozostałe ciała.

⚠ **Setki krokowanych klatek ze stworzeniem na graczu ZABIJAJĄ gracza**, po czym
nic już nie agruje i wszystko cicho spada do patrolu. Sprawdź `player.isDead`,
zanim uwierzysz w wynik agro.

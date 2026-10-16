/**
 * Central configuration for the whole prototype.
 *
 * Everything designers are likely to tweak lives here: player/enemy stats,
 * movement, combat timing, and — importantly — how each source PNG is sliced
 * into tiles / animation frames.
 *
 * ── About asset slicing ────────────────────────────────────────────────────
 * The real PNGs are dropped into /assets by the user. Because exact pixel
 * dimensions can vary, spritesheets are sliced by **grid layout** (columns ×
 * rows). At load time we read the real texture size and derive:
 *
 *     frameWidth  = textureWidth  / columns
 *     frameHeight = textureHeight / rows
 *
 * So if a sheet is 256×256 with 4 cols × 4 rows, frames become 64×64 — no
 * matter the absolute size. If your art differs, just change COLS/ROWS here.
 */

// Type only — erased at compile time, so this file keeps ZERO runtime imports
// and cannot form a cycle with Equipment, which imports it back. Same trick
// `core/Protection.ts` already uses for the same type, for the same reason.
import type { DamageType } from "../core/Equipment";
// Też wyłącznie typy — `GameConfig` ma ZERO importów wykonywanych w czasie
// działania i tak ma zostać (patrz komentarz wyżej).
import type { MoveBodySpec } from "../core/movement/BodySpec";
import type { SolverKind } from "../core/movement/Locomotion";

/**
 * ── Typy obrażeń po stronie PRZECIWNIKÓW (CR-3) ───────────────────────────
 *
 * Każdy kanał obrażeń wroga deklaruje swój typ **tutaj, w danych** — dokładnie
 * tak, jak po stronie gracza niesie go `AttackVariant` w `ITEMS[*].attacks`.
 * Cztery kanały, cztery pola: `EnemyConfig.touchDamageType`,
 * `BOAR.charge.damageType`, `GREY_WOLF.duel.biteDamageType`,
 * `WEB_PROJECTILE.damageType`.
 *
 * ⚠ **Pole jest WYMAGANE, a `null` znaczy „świadomie bez typu".** Nie jest
 * opcjonalne, bo cały CR-3 istnieje przez to, że przez dwa kroki nikt nie
 * zauważył, iż `Player.takeDamage` nigdy nie dostaje typu. Wymagane pole każe
 * kompilatorowi zapytać o decyzję przy KAŻDYM nowym stworze; `null` sprawia, że
 * „bez typu" jest napisane, a nie że ktoś zapomniał.
 *
 * ⚠ **Typ obrażeń NIE JEST nośnikiem żadnego innego efektu.** Odpowiada
 * wyłącznie za interakcję z ochroną (`ARMOR_PROFILE` → `d/(d+K)`). Nie odrzuca,
 * nie przerywa, nie ogłusza, nie nakłada stanów. Ta sama reguła, którą po
 * stronie gracza wymusza `interrupts?: false` w `AttackVariant`: przerywanie
 * jest cechą konkretnej broni, nie typu — patrz `docs/systemy/armor.md` R-5.
 *
 * ⚠ **Nie każdy tick musi mieć typ, i to jest decyzja projektowa.** Królik i
 * pająk dostają `null`: królik nie ma ataku (overlap + cooldown, bez fazy,
 * zasięgu i animacji ciosu), a bronią pająka jest spowolnienie, nie 4–7
 * obrażeń. Otypowanie ich zmieniłoby tylko tyle, że startowa skóra stałaby się
 * gorsza przeciw startowemu przeciwnikowi. Pełne uzasadnienie per stwór:
 * `docs/systemy/armor.md`
 *
 * Każde z tych pól jest jawnie anotowane `as DamageType | null`, choć `as
 * const` samo w sobie by wystarczyło. Powód jest praktyczny: bez anotacji
 * literówka (`"blunnt"`) nie zapala się tutaj, tylko dopiero w `Boar.ts` przy
 * przekazaniu configu do konstruktora — czyli błąd wskazywałby plik, w którym
 * nikt niczego nie zepsuł.
 */

export const WORLD = {
  /** Logical tile size used when authoring the map array. */
  tileSize: 32,
} as const;

/**
 * Jak blisko stoi kamera. **Wyprowadzane z okna, nie stałe** — patrz
 * `GameScene.applyZoom`.
 *
 * ⚠ Było `setZoom(2)` na sztywno i na telefonie to jest za blisko: przy 375 px
 * wysokości widać **niecałe 6 kafli w pionie**, czyli gracz nie widzi nawet
 * tego, co zaraz w niego wejdzie. Zgłoszone z prawdziwego urządzenia po
 * pierwszym buildzie APK.
 */
export const CAMERA = {
  /**
   * Ile kafli musi się zmieścić na KRÓTSZEJ osi ekranu.
   *
   * 9 nie jest okrągłe z przypadku — to jedyna wartość, która przy kaflu 32 px
   * daje jednocześnie **1 na telefonie** (375/288 → 1) i **2 na desktopie**
   * (595 i 800 → 2), czyli naprawia telefon, nie ruszając tego, jak gra
   * wygląda dziś na dużym ekranie.
   */
  minTilesShortAxis: 9,
  /**
   * ⚠ **Zoom musi być CAŁKOWITY.** Ułamkowy w parze z `roundPixels` powoduje
   * migotanie pixel-artu przy ruchu kamery — piksele źródłowe nie trafiają
   * wtedy równo w piksele ekranu.
   *
   * ⚠ **Obie granice są mnożone przez DPR w `GameScene.applyZoom`**, bo gra
   * liczy w pikselach urządzenia (patrz `core/Viewport.ts`). Bez tego telefon
   * z DPR 2,6 dostałby kafle o boku 32 pikseli urządzenia, czyli ~12 px CSS —
   * cztery razy mniejsze fizycznie niż na desktopie. Wartości tutaj są więc
   * „na jeden piksel CSS" i przy DPR 1 (desktop) nic nie zmieniają.
   */
  minZoom: 1,
  /**
   * Sufit celowo równy dotychczasowej stałej: na dużym ekranie ma być
   * dokładnie tak, jak było. Ta zmiana ma tylko ODDALAĆ kamerę na małych
   * ekranach, nigdy nie przybliżać jej bardziej niż dotąd.
   */
  maxZoom: 2,
  /**
   * Margines render cullingu (`core/RenderCuller.ts`), jako WIELOKROTNOŚĆ
   * bieżącego `camera.worldView.width/height` — nie stała liczba pikseli,
   * żeby margines skalował się z zoomem/urządzeniem tak samo jak sam
   * viewport. Dodawany z KAŻDEJ strony, więc `0.5` = obszar aktywny
   * dwukrotnie większy niż to, co faktycznie widać (`viewport × (1+2×0.5)`).
   *
   * ⚠ **To jest gałka do strojenia w silniku, nie ustalona stała.** Trzy
   * warianty do wypróbowania, żadnego nie zakładam z góry jako lepszego:
   *   - `0` — najtańszy render, ale obiekty (zwłaszcza wysokie korony)
   *     mogą pojawiać się/znikać DOKŁADNIE na krawędzi ekranu.
   *   - `0.5` (domyślny start) — bufor pół ekranu z każdej strony; przy
   *     płynnym podążaniu kamery (`startFollow(..., 0.12, 0.12)`, nie
   *     teleport) powinien wystarczyć, żeby nic nie wyskakiwało w polu
   *     widzenia, kosztem renderowania też tego, co tuż poza kadrem.
   *   - `1` — najbezpieczniejszy wizualnie, ale zjada większość zysku z
   *     cullingu (zmierzone na `forrest.tmj`, tura 6: 14% obiektów w
   *     obszarze przy 0,5 vs 28% przy 1 — grubo ponad dwukrotność).
   * Zmień tę jedną liczbę i porównaj `window.dev.worldStats()` +
   * subiektywne wrażenie migotania na krawędzi, zamiast zgadywać.
   */
  cullMarginFactor: 0.5,
} as const;

/**
 * Skala interfejsu. **Wszystkie liczby w `src/ui/` — rozmiary czcionek, szerokość
 * paska HP, wymiary paneli — były pisane pod okno desktopowe** i na telefonie
 * wychodzą ogromne: przy 1280×720 pasek HP zajmuje 16% szerokości, a przy
 * realnym oknie APK (zmierzone: **891×411 px CSS** na telefonie z DPR ≈ 2,6)
 * ten sam pasek to 22%, panel postaci (550×530) nie mieści się w wysokości,
 * a czcionka 40 px banera zajmuje jedną dziesiątą ekranu.
 *
 * ⚠ **To NIE jest to samo co `CAMERA`.** Tamto decyduje, jak blisko stoi kamera
 * świata (ile kafli widać); to decyduje, jak duży jest interfejs NAD światem.
 * Zgłoszone osobno i po naprawie zoomu — świat wyglądał już dobrze, HUD nie.
 *
 * Sposób zastosowania jest celowo jeden na całą scenę, a nie mnożnik wklejony
 * w każdą liczbę: `UIScene`/`TitleScene` ustawiają swojej kamerze
 * `setOrigin(0,0)` + `setZoom(uiScale())`, czyli **wirtualną rozdzielczość**.
 * Widżety dalej liczą w tej samej przestrzeni co dotąd; jedyne, co musiały
 * zmienić, to czytać wirtualny rozmiar ekranu (`uiW`/`uiH`) zamiast fizycznego.
 * Przepisywanie ~2000 współrzędnych w `PlayerPanel`/`ShopPanel` nie wchodziło
 * w grę, a mnożnik przy każdej z nich to gwarancja, że jedna zostanie pominięta.
 */
export const UI_SCALE = {
  /**
   * Krótsza oś okna **w pikselach CSS**, przy której interfejs jest w skali 1.
   *
   * ⚠ **580, a nie 720 (wysokość okna, pod które był pisany), i ta liczba jest
   * WYPROWADZONA, nie dobrana:** panel, którego nie widać w całości, jest
   * zepsuty, a najwyższy w grze to `PlayerPanel`. ⚠ Jego realny zasięg
   * pionowy to **542 px, nie deklarowane 530** — przycisk zamykania wystaje
   * poza ramkę o pół swojej średnicy z góry, co widać dopiero po zmierzeniu
   * `getBounds()` na żywym panelu. 542 plus po ~13 px marginesu z góry i z
   * dołu daje 580, czyli panel zajmuje 93% krótszej osi niezależnie od ekranu.
   *
   * ⚠ Wcześniej stało tu 720 i było to **za agresywne**: dawało 0,57 i tekst
   * schodził do ~7,4 px CSS. Zgłoszone jako nieczytelne — choć główną przyczyną
   * nieczytelności był odwrócony `resolution`, patrz `textStyle`.
   */
  designShortAxis: 580,
  /**
   * Podłoga. Bez niej bardzo niski ekran zszedłby do skali, przy której
   * przycisk ataku przestaje być celem dla kciuka.
   */
  min: 0.5,
  /**
   * ⚠ **Sufit dotyczy CZĘŚCI CSS, a nie całego współczynnika.** Ostateczna
   * skala to `DPR × clamp(krótsza oś CSS / designShortAxis, min, max)`:
   * mnożnik `DPR` utrzymuje FIZYCZNY rozmiar rzeczy (gra liczy w pikselach
   * urządzenia, patrz `core/Viewport.ts`), a `clamp` zmniejsza interfejs tam,
   * gdzie okno jest za małe. Gdyby sufit obejmował całość, ekran Retina
   * dostałby interfejs o połowę mniejszy fizycznie niż zwykły.
   */
  max: 1,
} as const;

/**
 * ── UKŁAD KONTROLEK BOJOWYCH (prawy kciuk) ─────────────────────────────────
 *
 * Wszystkie liczby są w JEDNOSTKACH WIRTUALNYCH interfejsu (patrz `UI_SCALE`),
 * czyli w tym, w czym liczą widżety z `src/ui/`. Na telefonie w poziomie
 * wysokość wirtualna to zawsze 580, a szerokość ≈ 1257 przy 19,5:9.
 *
 * ⚠ **Kontrolki leżą na PIERŚCIENIACH wokół przycisku ataku, nie w kolumnie —
 * i to jest wynik pomiaru, nie stylistyka.** Kciuk trzymający telefon poziomo
 * ma przegub przy prawym dolnym rogu i zasięg funkcjonalny ~55 mm. Dla piątego
 * przycisku wychodziło:
 *   • kolumna w górę (stan do 2026-08-21) — **60 mm, poza zasięgiem**, i przy
 *     pięciu slotach nachodziła na pasek buffów (y 84–112);
 *   • rząd poziomy — skrajny przycisk **57 mm**;
 *   • łuk o stałym promieniu — **wszystkie w paśmie 28–44 mm**.
 * Łuk jest jedynym kształtem, w którym wszystkie przyciski są RÓWNO oddalone
 * od kciuka; kolumna i rząd mają koniec dalej niż początek z definicji.
 *
 * ⚠ **O pierścieniu decyduje PILNOŚĆ × CZĘSTOTLIWOŚĆ, nie kategoria.** Typy
 * obrażeń stoją bliżej niż umiejętności, bo przy osi typ × odporność zmiana
 * typu jest częstsza i pilniejsza niż rzucenie zdolności z 14-sekundowym
 * cooldownem. Przenosząc cokolwiek między pierścieniami, przenosisz sąd o tym,
 * jak często gracz tego dotyka — a nie „gdzie jest ładniej".
 *
 * ⚠ **Kąty są STAŁE per slot, nie liczone z liczby elementów.** Umiejętność
 * w slocie 2 stoi w tym samym miejscu, gdy nosisz dwie i gdy nosisz cztery —
 * inaczej nauka trzeciej przestawiałaby dwie pierwsze pod kciukiem. Puste
 * sloty po prostu się nie rysują. To odwrotność reguły rzędu wariantów sprzed
 * przebudowy (wyrównanie do prawej) i różnica jest zamierzona: pasek
 * umiejętności jest LOADOUTEM o stabilnych indeksach — `Abilities.assign(i, …)`
 * i klawisze 1..N już dziś znaczą „slot", nie „kolejność nauki".
 *
 * ⭐ **Pasek nawigacji NIE stoi już na grze (2026-10-11, z telefonu autora).**
 * `MainActivity` chowa paski w trybie immersive z `SHOW_TRANSIENT_BARS_BY_SWIPE`:
 * nawigacja wysuwa się tylko na chwilę po przeciągnięciu od krawędzi i sama
 * znika. Do tej daty stała tu rezerwa pod pasek zmierzony na S21 FE
 * (jednostki 1217–1257, czyli 40 j.) — z czasów, gdy pasek był widoczny na
 * stałe. Rezerwa 80 → 24, klaster walki przesunięty o te same 56 j. w prawo
 * (`anchor.right` 127 → 71), bliżej kciuka.
 * ⚠ Insety `env(safe-area-inset-*)` nic tu nie dają — w trybie immersive
 * paski raportują zero. Wysunięty na chwilę pasek ZAKRYJE prawy skraj
 * klastra i to jest przyjęty koszt: gest wysuwania robi się świadomie.
 */
export const HUD_LAYOUT = {
  /**
   * Środek przycisku ataku, mierzony od PRAWEJ i DOLNEJ krawędzi ekranu.
   * Wszystko inne pozycjonuje się względem niego, więc przesunięcie całego
   * klastra pod inny chwyt to zmiana tych dwóch liczb i niczego więcej.
   */
  anchor: { right: 71, bottom: 110 },
  /**
   * Margines przy PRAWEJ krawędzi dla wszystkiego, co kotwiczy się do niej —
   * minimapy (wejścia do panelu), a przez nią paska buffów. 24 j. ≈ 2,8 mm:
   * zapas na chwyt i krawędź etui, nie na pasek nawigacji (patrz nagłówek).
   * Przycisk ataku trzyma ten sam odstęp przez `anchor.right − attackRadius`.
   */
  edgeRight: 24,
  /** Promień przycisku ataku. Największa kontrolka w grze — trzymana, nie
   *  stukana, więc jako jedyna jest ponad normą z dużym zapasem. */
  attackRadius: 48,
  /**
   * ⚠ **Minimalny bok/średnica czegokolwiek klikalnego.** 68 j. = 48 CSS px
   * przy krótszej osi 375 CSS, czyli próg Material Design (48 dp); Apple HIG
   * chce 44 pt. Przed przebudową pod progiem było **wszystko poza przyciskiem
   * ataku**: umiejętności 50 j. (5,9 mm), quick slot 52, warianty 44 (5,2 mm).
   * Asercja w buildzie deweloperskim pilnuje, żeby nie zjechało tam znowu.
   */
  minTouch: 68,
  /**
   * Ile z komórki zajmuje WIDOCZNE kółko, per RODZAJ kontrolki (nie per
   * pierścień — od 2026-10-12 na jednym pierścieniu stoją różne rodzaje).
   * Pole dotykowe zostaje pełną komórką zawsze — to jest wyłącznie waga wizualna.
   *
   * ⚠ **Cel dotykowy większy od grafiki to technika, nie oszustwo.** Kontrolka
   * rzadka (tryb ataku, zmiana zestawu, interakcja) ma nie ważyć tyle co
   * umiejętność, ale zejście jej POLA poniżej `minTouch` łamałoby regułę, którą
   * pilnuje `assertTouchTargets`. Rozdzielenie obu rzeczy załatwia jedno i drugie.
   *
   * ⚠ `context` 0,78 NIE przez przypadek — pierwsza wersja rysowała pełną
   * komórkę i wyglądała jak najgrubszy przycisk klastra dla najrzadziej
   * używanej kontrolki — odwrotność zamierzonej hierarchii pilności.
   *
   * ⚠ `mode` i `swap` mają RÓWNĄ wagę (0,8) od 2026-10-12 — to para broni
   * na wspólnej podkładce (`WeaponSwapButton`); dwa różne rozmiary obok
   * siebie czytały się jak dwie niezwiązane kontrolki.
   */
  visual: { ability: 1, quick: 1, mode: 0.8, swap: 0.8, context: 0.78 },
  /**
   * Pierścienie — sama GEOMETRIA, od najbliższego kciuka. Co na którym stoi,
   * mówi `place` niżej. `radius` liczony od środka przycisku ataku, `angles`
   * w stopniach w konwencji ekranu (0° = w prawo, 90° = w DÓŁ, bo oś Y rośnie
   * w dół; 180° = w lewo, 270° = w górę).
   *
   * ⚠ **Kąty są dobrane tak, żeby cięciwa między sąsiadami miała ZAPAS ponad
   * `cell + 11`, a nie równo tyle.** Pierwsza wersja trafiała w 87,0 j. przy
   * wymaganych 87,0 i `tools/hud_uklad.mjs` zaświecił na czerwono — bo o wynik
   * decydował szum zmiennoprzecinkowy. Ta sama klasa błędu, którą projekt
   * złapał przy `SHIELD.blockArcDeg`: **dwie liczby, które mają być równe, nie
   * nadają się na próg.**
   *
   * ⚠ Zmieniając którykolwiek kąt albo promień — **uruchom `node
   * tools/hud_uklad.mjs`**. Sprawdza nakładki, wyjście poza ekran, pas
   * nawigacji, próg dotykowy i zasięg kciuka na prawdziwym `ControlLayout.ts`.
   */
  rings: {
    /** Najbliżej kciuka (22–30 mm). Do 2026-10-12 trzy przyciski typu ataku. */
    inner: { radius: 110, cell: 76, angles: [163, 214.5, 266] },
    /** 33–41 mm. */
    middle: { radius: 205, cell: 76, angles: [179, 206, 233, 260] },
    /**
     * 41–49 mm, zewnętrzna granica wygody — świadomie, bo stoją tu kontrolki
     * najrzadziej wciskane. ⚠ Slot 0 jest NAJBLIŻSZY kciuka (mniejszy kąt =
     * niżej i bliżej rogu) i dlatego należy do mikstury, a nie do jedzenia.
     *
     * ⭐ Sloty 2–3 to PARA BRONI (2026-10-12, autor: „zmiana broni i zmiana
     * typu ataku powinny być bliżej siebie — jedna zmienia broń, druga typ
     * obrażeń dla niej"). Sąsiedzi na jednym łuku, ten sam promień: 99 j.
     * cięciwy przy wymaganych 87 (`tools/hud_uklad.mjs`).
     */
    outer: { radius: 300, cell: 76, angles: [170, 189, 208, 227] },
    /**
     * Kontekstowy przycisk interakcji (NPC/ognisko/zioło — `ContextAction`).
     * Jeden slot, prosto NAD przyciskiem ataku (kąt 270°, ten sam promień co
     * `outer`), a nie dalszy punkt tego samego łuku co pozostałe pierścienie.
     *
     * ⚠ **To jest jedyne wolne miejsce, nie wybór estetyczny.** Łuk
     * góra-lewo już jest ciasno upakowany (kąty dobrane pod minimalny
     * prześwit — patrz komentarz przy `rings` wyżej), więc każdy nowy punkt
     * w tym samym paśmie kątowym koliduje z `outer`/`middle` albo ucieka
     * poza 55 mm zasięgu kciuka. Prosto w górę od kotwicy jest jedynym
     * kierunkiem z zapasem po obu stronach: 104–190 j. do najbliższych
     * sąsiadów i w zasięgu kciuka (limit 55 mm; 52,2 mm po przesunięciu
     * klastra 2026-10-11) — policzone i zweryfikowane `tools/hud_uklad.mjs`.
     */
    context: { radius: 300, cell: 80, angles: [270] },
  },
  /**
   * ⭐ **CO STOI NA KTÓRYM SLOCIE** (przebudowa 2026-10-12, prośba autora).
   * Para `[pierścień, indeks]`. O miejscu decyduje PILNOŚĆ × CZĘSTOTLIWOŚĆ,
   * a nie kategoria — przenosząc wpis, przenosisz sąd o tym, jak często gracz
   * tego dotyka.
   *
   * ⚠ **Tryb ataku zszedł z najlepszego miejsca na zewnętrzny łuk.** Do tej
   * daty trzy przyciski typu obrażeń zajmowały cały wewnętrzny pierścień
   * (22–30 mm), a gracz zmienia typ raz na starcie walki, nie co kilka sekund
   * (autor: „gracz nie będzie go zmieniał co kilka sekund"). Dziś to JEDEN
   * przycisk, który rozwija kolumnę wyboru (`modeMenu`), a typ obrażeń widać
   * stale na przycisku ataku. Zwolnione miejsce dostały umiejętności 1–3.
   *
   * `ability` — indeks = slot paska (`Abilities.slotted()`), klawisze 1..N.
   * ⚠ Długość MUSI być ≥ `ABILITY_SLOTS` (ostrzeżenie w konsoli, jeśli nie).
   * `swap` — zmiana zestawu broni (`WeaponSwapButton`), rysowana tylko, gdy
   * drugi zestaw nie jest pusty. `quick` — przedmioty szybkiego dostępu.
   *
   * ⚠ **`swap` i `mode` to PARA i stoją obok siebie** (`outer` 3 i 2). Do
   * 2026-10-12 zamiana stała na `middle` 3, czyli NAD klastrem, a tryb po jego
   * lewej — dwie decyzje o tej samej broni w dwóch końcach rogu. Zwolnione
   * `middle` 3 jest rezerwą na siódmą umiejętność albo „ultimate", który
   * pojawia się dopiero, gdy jest gotowy (wzór Diablo Immortal).
   */
  place: {
    ability: [["inner", 0], ["inner", 1], ["inner", 2], ["middle", 0], ["middle", 1], ["middle", 2]],
    swap: ["outer", 3],
    quick: [["outer", 0], ["outer", 1]],
    mode: ["outer", 2],
    context: ["context", 0],
  },
  /**
   * **Kolumna wyboru trybu ataku** — rozwija się po tapnięciu przycisku `mode`
   * (szkic autora 2026-10-12: kolumna na lewo od klastra, opcje od dołu,
   * „✕" na końcu). Stoi na LEWO od najdalej wysuniętego slotu zewnętrznego
   * łuku, z prześwitem `gap`, i rośnie od `bottom` (od dołu ekranu) w górę.
   * Trwa tylko do wyboru — nie zajmuje miejsca w walce.
   */
  modeMenu: { gap: 14, bottom: 58, step: 88 },
  /**
   * ⭐ **MINIMAPA = WEJŚCIE DO MAPY** (od 2026-10-12, autor: „jak ją
   * klikniemy, bardziej nam zależy na mapie"). Od 2026-10-11 do tej daty
   * otwierała panel gracza na ostatniej zakładce — odwrotnie niż odruch
   * z każdej innej gry (Wild Rift, Diablo Immortal, Genshin: tapnięcie
   * w minimapę = duża mapa), więc wymagała znaczka ☰ w rogu, żeby w ogóle
   * zapowiedzieć, że otworzy plecak. Wejściem do panelu jest dziś
   * `menuButton` niżej.
   *
   * Kwadrat w prawym górnym rogu, odsunięty o `edgeRight`. `top`/`size` to
   * jednostki wirtualne, liczone od GÓRY ekranu.
   *
   * ⚠ **`size` 108 jest WYPROWADZONY, nie dobrany.** Prosto pod minimapą stoi
   * przycisk kontekstowy (`rings.context`: kotwica − 300 j., komórka 80), czyli
   * na S21 FE (`uiH` 580) jego górna krawędź wypada na y = 580 − 110 − 300 − 40
   * = 130. Przy `top` 10 i `size` 108 dół minimapy to 118 — 12 j. prześwitu
   * przy wymaganych 11. Większa minimapa wchodzi na przycisk `E`. Pilnuje tego
   * `node tools/hud_uklad.mjs` (prostokąt kontra koło, nie środek kontra środek).
   *
   * ⚠ **`zoom` musi być 1/4, 1/2 albo całkowity.** Obraz minimapy ma 4 px na
   * kafel (`tools/build_minimap.py`, `SKALA`), więc 0,5 daje równo 2 j. na
   * kafel bez ułamkowego próbkowania pod NEAREST. 0,5 przy boku 108 j. pokazuje
   * ~54 kafle w poprzek — wyraźnie więcej, niż widać na ekranie, czyli minimapa
   * mówi coś, czego świat nie mówi. Przy 1 pokazywałaby mniej więcej to samo,
   * co kamera.
   *
   * ⭐ **`frame` — kartka pergaminu** (2026-10-13, D15; `src/ui/MapParchment.ts`):
   * „piksel” kartki `cell` = 2 j. = kafel mapy przy zoomie 0,5, obrzeże
   * `band` 3 komórki (6 j.), cień `shadow` 2 j. ⚠ Kartka z cieniem rysuje się
   * W ŚRODKU kwadratu `size` — bok i prześwit do `E` się nie zmieniają, płaci
   * okno mapy: 108 → 92 j. (54 → 46 kafli w poprzek). Pilnuje
   * `tools/hud_uklad.mjs` §6c.
   */
  minimap: { size: 108, top: 10, zoom: 0.5, frame: { cell: 2, band: 3, shadow: 2 } },
  /**
   * ⭐ **PRZYCISK MENU = wejście do panelu gracza** (2026-10-12) — kwadrat
   * z plecakiem NA LEWO od minimapy, wyrównany do jej góry. Otwiera panel na
   * ostatniej zakładce innej niż MAPA (domyślnie PLECAK). Na telefonie to
   * JEDYNE wejście do ekwipunku i zapisu — rysuje się zawsze.
   *
   * `size` = `minTouch` (68 j. = 48 dp): rzadka kontrolka, więc bez zapasu
   * ponad normę. `gap` — odstęp od minimapy. Pasek buffów rośnie W LEWO od
   * tego przycisku, nie od minimapy.
   *
   * ⚠ To jest też miejsce na PRZYSZŁE ikony (sklep, poczta, wydarzenia —
   * `docs/ui_mobile_research.md` §5): dokładają się W LEWO od niego, tym
   * samym rzędem, a nie do klastra bojowego ani pod minimapę.
   */
  menuButton: { size: 68, gap: 12 },
  /**
   * ⭐ **Ramka postaci w lewym górnym rogu** (2026-10-12): odznaka poziomu
   * z pierścieniem doświadczenia + pasek życia + pasek wysiłku. Wzór MOBA
   * (Wild Rift: poziom w kółku, XP jako pierścień wokół). Liczby XP i złoto
   * zeszły z HUD-u — XP czyta się w panelu POSTAĆ, złoto w panelu i u kupca
   * (autor: „po co gold na widoku poza sklepem lub ekwipunkiem").
   *
   * `badge` — promień odznaki (pole dotykowe = 2·`badge` + pierścień ≥
   * `minTouch`; tapnięcie otwiera zakładkę POSTAĆ). `ring` — grubość
   * pierścienia XP. `barW`/`hpH`/`stamH` — paski na prawo od odznaki.
   */
  unitFrame: { pad: 14, badge: 27, ring: 5, barW: 230, hpH: 22, stamH: 10 },
} as const;

/**
 * ── DRĄŻEK RUCHU: gdzie kończy się marsz, a zaczyna bieg ───────────────────
 *
 * Wszystko w JEDNOSTKACH WIRTUALNYCH interfejsu. Przelicznik na S21 FE:
 * 1 j. ≈ 0,118 mm.
 *
 * ⚠ **Powód istnienia tego bloku: do 2026-08-21 gracz NIE MÓGŁ CHODZIĆ.**
 * Bieg włączał się przy wychyleniu ≥ 92% drążka o promieniu 60 j., czyli
 * **6,5 mm od punktu dotknięcia** — a zwykłe przeciągnięcie kciukiem przy
 * sterowaniu to 10–20 mm. Strefą marszu był krążek o promieniu 6,5 mm,
 * strefą biegu wszystko poza nim. Zgłoszone jako „zużywamy wytrzymałość
 * chodząc i nie wiemy dlaczego" — i to nie było zużycie przez chodzenie,
 * tylko bieg, którego nie dało się wyłączyć.
 *
 * ⚠ **Koszt biegu NIE jest tu winny i nie wolno go „naprawiać".**
 * `docs/systemy/stamina.md` wycenił go celowo tak, że przebiegnięcie mapy
 * (155 staminy przy puli 120) jest niewykonalne na jednej puli — bieg ma być
 * decyzją „spieszę się i zapłacę", a nie domyślnym sposobem poruszania.
 * Zepsute było WEJŚCIE: decyzję podejmowała szerokość kciuka.
 * ⭐ **Od 2026-10-11 ta wycena obowiązuje tylko W WALCE** — poza nią bieg jest
 * darmowy (`STAMINA.costs.sprintOutOfCombatPerSecond`), bo las po rozstawie
 * ×1,5 zrobił z podróży męczarnię (zgłoszone z gry). Strefy drążka bez zmian.
 *
 * ⚠ **Rozwiązaniem nie jest przełącznik ani gest, tylko FIZYCZNY ROZMIAR.**
 * Odwzorowanie „jak mocno wychylisz, tak szybko idziesz" gracz zna z każdego
 * pada i nie trzeba go uczyć — ono tu było od początku, tylko cały skok
 * drążka miał 7,1 mm, więc kciuk zawsze go wysycał. Dwie strefy z granicą
 * **narysowaną** na ekranie zamieniają przypadek w wybór, bez ani jednego
 * nowego przycisku i bez ukrytego gestu.
 */
export const STICK = {
  /**
   * Promień drążka: przy tym wychyleniu prędkość MARSZU jest maksymalna.
   * Poniżej skaluje się proporcjonalnie, co daje przy okazji precyzyjne
   * dostawianie się w walce.
   */
  radius: 60,
  /**
   * Wychylenie, przy którym **włącza się bieg**. 120 j. ≈ 14,2 mm — wyraźnie
   * poza zwykłym skokiem sterowania (8–12 mm), więc nie da się w to wejść
   * przypadkiem, a jednocześnie w zasięgu kciuka bez ruszania nadgarstka.
   */
  runEngage: 120,
  /**
   * Wychylenie, poniżej którego bieg **gaśnie**. ⚠ **Mniejsze od
   * `runEngage` i to jest histereza, nie niechlujstwo** — bez niej kciuk
   * drżący na granicy przełączałby bieg kilka razy na sekundę, a wraz z nim
   * licznik odpoczynku staminy.
   *
   * ⚠ Drugi, ważniejszy skutek: **wypchnięcie jest chwilowe, a bieg trwa.**
   * Żeby ruszyć biegiem trzeba sięgnąć na 14,2 mm, ale żeby biec dalej
   * wystarczy 9,4 mm — czyli podróż przez mapę nie wymaga trzymania kciuka
   * w wyproście przez kilkanaście sekund. To był jedyny realny zarzut wobec
   * „strefy zamiast przełącznika".
   */
  runRelease: 80,
  /**
   * ── OBRÓT W MIEJSCU: trzecia strefa drążka, od dołu (2026-09-11) ─────────
   *
   * Wychylenie **poniżej** tego progu zmienia ZWROT postaci i **nie rusza
   * ciałem**. Podane jako ułamek `radius`, bo `Player.handleMovement` dostaje
   * wektor już znormalizowany do promienia.
   *
   * ⚠⚠ **0,45 nie jest okrągłą liczbą z gustu — to PROMIEŃ RYSOWANEJ GAŁKI**
   * (`VirtualJoystick`: `thumb` ma `radius * 0.45`). Strefa jest więc dokładnie
   * tym, co gracz widzi: **dopóki gałka zakrywa środek bazy, obracasz się;
   * gdy z niego zjedzie — idziesz.** Zero nowej grafiki i zero ukrytego gestu
   * (`input.md` N-158), bo granica już jest narysowana.
   *
   * ⚠ **Pierwsza wersja miała 0,3 i była za mała.** 0,3 × 60 j. = 18 j. ≈
   * **2,1 mm** wychylenia kciuka — mniej niż świadome popchnięcie (3–5 mm), więc
   * gracz chcący się obrócić i tak wypadłby do marszu i **i tak zrobiłby krok**,
   * czyli poprawka nie leczyłaby niczego. 0,45 to 27 j. ≈ **3,2 mm**, przy
   * marszu od 3,2 mm i biegu od 14,2 mm (`runEngage`).
   *
   * ⚠⚠ **Po co: dotąd JEDYNYM sposobem zmiany zwrotu był KROK.** Zwrot
   * ustawia wyłącznie drążek, a `resolveAttack` odmawia startu zamachu w ruchu
   * — więc odmowa „Odwróć się" (`PLAYER.attackFrontArcDeg`) kazała graczowi
   * wyjść z pozycji, którą sam wybrał, i wrócić. Przy watasze okrążającej
   * postać powtarzało się to kilka razy na walkę.
   *
   * ⛔ **To NIE jest automatyczny obrót do celu i nie wolno tego tak czytać.**
   * Obrót wykonuje gracz, świadomie, własnym kciukiem; wróg za plecami nadal
   * ma swoje okno, bo obrót zajmuje czas reakcji człowieka. Auto-obrót
   * (usunięty 2026-08-23, patrz `PLAYER.attackFrontArcDeg`) odbierał tę
   * decyzję i dlatego kasował całe okrążanie — ta zmiana ją oddaje TANIEJ,
   * nie odbiera.
   *
   * ⚠⚠ **Świadomy koszt, do oceny ręką: marsz zaczyna się od 45% prędkości,
   * nie od zera.** Pasmo 0–45% wychylenia przestaje chodzić, czyli ginie
   * najwolniejsze skradanie (do **67 px/s** z 150). W tej grze pozycjonowanie
   * na granicy zasięgu bywa pikselowe (topór 93,6 px prześwitu przy orbicie
   * watahy 96 — `weapons` §7.B4a), więc **to jest pierwsza rzecz do sprawdzenia
   * po playteście.**
   *
   * ⚠ **Dwie drogi wyjścia, gdyby creep okazał się potrzebny, i różnią się
   * KOSZTEM, nie kierunkiem:** zejść tą liczbą (tanio, ale wraca problem
   * „obrót wymaga kroku") albo przeskalować pasmo marszu
   * (`(mag − próg) / (1 − próg)`) — to odzyskuje CAŁY zakres prędkości, ale
   * **przestraja odpowiedź drążka przy każdym wychyleniu**, więc jest zmianą
   * feelingu ruchu, a nie poprawką celowania. ⛔ Nie rób tego drugiego przy
   * okazji strojenia tej liczby.
   *
   * ⚠ **Klawiatury to nie dotyczy w ogóle** — tamta ścieżka normalizuje wektor
   * do 1, więc nigdy nie wpada w tę strefę. Ten sam fakt, który wymusił osobny
   * klawisz na bieg.
   */
  turnZoneFrac: 0.45,
} as const;

/**
 * Rendering depth bands. Everything that needs to sort against something else
 * picks its band here, so no two systems fight over raw numbers.
 *
 * Entities sort by their Y position *inside* the entity band, which is why the
 * band base is far above the terrain bands and far below the overhead ones.
 */
export const DEPTH = {
  /** Flat terrain tile layers (grass, water, paths) — never sorted. */
  ground: 0,
  /** Extra terrain painted on top of the ground (bridge decks, puddles). */
  overlay: 10,
  /** Entity band: a sprite at world y uses DEPTH.entities + y. */
  entities: 1000,
  /** Drawn above every entity (tree canopies, roofs) — walk-behind art. */
  overhead: 20000,
  /**
   * **Podgląd celowania umiejętności — NAD wszystkim, co rysuje świat.**
   *
   * ⚠⚠ **Do 2026-09-05 stał na `entities - 1` (999) z uzasadnieniem „wskaźnik
   * leży na ZIEMI, więc nie ma prawa przykryć gracza ani celów". Uzasadnienie
   * było ładne i BŁĘDNE w skutkach.** Cała warstwa Y-sortowana ma depth
   * `entities` (1000), więc pod 999 chowały się nie tylko korony drzew
   * (`overhead`), ale **pnie, gracz i wrogowie** — czyli podgląd znikał
   * dokładnie tam, gdzie jest potrzebny (las), a **żółty marker celu potrafił
   * zniknąć za własnym celem**.
   *
   * ⚠ **Nie ma tu sprzeczności z tamtą regułą — jest jej korekta.** Podgląd
   * ma nie DOMINOWAĆ obrazu i to załatwiają alfy (wypełnienie 0,09, krawędzie
   * 0,34, okręgi kreskowane), a nie kolejność rysowania. Informacja, której
   * nie widać, nie jest subtelna, tylko nieobecna.
   *
   * Ponad `overhead`, bo drzewo składa się z KORONY (tam) i PNIA (w warstwie
   * Y-sortowanej) — zejście między nie schowałoby podgląd pod koronami.
   */
  /**
   * **Obrys gracza zasłoniętego przez świat** (`core/PlayerSilhouette.ts`).
   *
   * ⚠ **Nowe piętro WSTAWIONE MIĘDZY istniejące, zero zmian w ich kolejności.**
   * Nad `overhead` (20000), bo zasłona, którą ma przebić, to właśnie korony
   * i dachy; pod `aimPreview` (25000), bo podgląd celowania jest odpowiedzią na
   * świadome działanie gracza i nie ma prawa chować się za pomocniczym obrysem.
   *
   * ⛔ Żaden inny obiekt nie ma tu wjeżdżać. To jest piętro JEDNEGO `Image`.
   */
  playerSilhouette: 24000,
  aimPreview: 25000,
} as const;

/**
 * **Obrys gracza zasłoniętego przez świat** — wygląd, nie zachowanie.
 *
 * ⚠ To są liczby PREZENTACYJNE: nie wchodzą do żadnego progu rozgrywki, walki
 * ani kolizji. Kryterium zapalenia obrysu jest czysto geometryczne
 * (`core/Occluders.ts`) i **nie ma tu żadnego pokrętła** — dołożenie progu
 * („zapal dopiero przy 40% zakrycia") zamieniłoby jednoznaczną odpowiedź
 * w strojenie i wróciłoby jako „czasem się nie pokazuje".
 */
export const PLAYER_SILHOUETTE = {
  /**
   * Jednolity tint sylwetki. Zimny błękit rodziny UI (`theme`), świadomie NIE
   * biały: biel na koronie drzewa czyta się jak przepalenie, a nie jak postać.
   */
  tint: 0x9fb4c8,
  /**
   * ⚠ **Ma być SUBTELNY, nie czytelny jak sam sprite.** Obrys mówi „jesteś
   * tutaj", a nie zastępuje postaci — przy pełnej alfie gracz przestaje mieć
   * powód, żeby wyjść zza drzewa.
   */
  alpha: 0.45,
} as const;

/** Tiled maps, exported as JSON with the tileset embedded. */
export const MAPS = {
  /** The starting location — a 240×90 forest with a river, ford and road spine
   *  (resized from 100×60 on 2026-08-28, east-only — see `PROJECT_CHECKPOINT_RESIZE160.md`;
   *  then spread ×1.5 on 2026-10-04 so creatures fit between trunks —
   *  `docs/decyzje/2026-10-04-rozstaw-lasu.md`, guarded by `tools/forest_clearance.py`). */
  forest: {
    key: "map-forest",
    path: "assets/maps/forrest.tmj",
    /** Simplified overview for the PlayerPanel "Mapa" tab — `tools/build_minimap.py`,
     *  read straight from this same .tmj, not hand-drawn. */
    minimapKey: "minimap-forest",
    /** Nazwa pokazywana w zakładce „Mapa". Bez niej panel mógł powiedzieć
     *  tylko „MAPA", czyli nie mówił najważniejszej rzeczy: gdzie jesteś. */
    label: "Las",
    /**
     * Which looping bed plays here (a key into `AUDIO.volume`).
     *
     * **A per-map property, not one global.** `Sfx.startAmbient()` used to read
     * a single `AUDIO.ambientKey`, so Zagaje played the forest — wind, leaves
     * and birds — and walking through the gate changed nothing in the ears.
     * Ambience is the cheapest "this is a different place" channel a game has,
     * and spending it on one bed for the whole world wastes it.
     */
    ambientKey: "forest-ambient",
  },
  /**
   * Zagaje, the village — a 100×100 hub reached by walking the forest's road
   * spine north through its gate (see `PORTALS`/`MAP_BY_ID` below). Placeholder
   * pass: existing modular buildings + the paddock rail fence, no palisade/mill/
   * well/NPCs yet (see the ⏳ note in CLAUDE.md's Village section).
   */
  village: {
    key: "map-village",
    path: "assets/maps/village-zagaje.tmj",
    minimapKey: "minimap-village",
    label: "Zagaje",
    /** Yard, not woodland: a lower, narrower air bed plus farm events — a
     *  distant anvil, hens, one dog. See `village_ambient` in
     *  `tools/gen_audio.py` for why each of those is an EVENT rather than a
     *  layer. */
    ambientKey: "village-ambient",
  },
  /**
   * Wschodnia Gestwina — 64×64, za wschodnim skrajem lasu (`tools/build_gestwina.py`).
   *
   * ⚠ **To nie jest „wschodnia gęstwina" z `docs/swiat.md` §4** — TAMTA jest
   * strefą istniejącej mapy lasu (dziki, sieciarze, za nimi skoczki) i stoi
   * tam od dawna. Ta mapa jest tym, co leży ZA nią. Rozróżnienie jest łatwe
   * do zgubienia przy czytaniu bible'a i prowadzi do wniosku, że coś już
   * istnieje albo że się duplikuje.
   *
   * Zbudowana z zerową ilością nowej grafiki — te same `Teren.png`/`Nature.png`
   * co las. Tożsamość niesie układ, nie kafle: **trakt wchodzi bramą i po
   * kilkunastu kaflach urywa się na dobre**, skład gatunkowy przechodzi
   * płynnie w świerk i grab (brzoza prawie znika), a zamiast rzeki stoją dwa
   * zamknięte rozlewiska. Rzeka mówi „doliną się idzie"; woda bez odpływu mówi
   * „tu się kończy".
   */
  thicket: {
    key: "map-thicket",
    path: "assets/maps/thicket-gestwina.tmj",
    minimapKey: "minimap-thicket",
    label: "Wschodnia Gęstwina",
    /**
     * ⚠ **Dzieli bed z lasem i to jest ŚWIADOMA dziura, nie przeoczenie.**
     * Ten plik mówi wyżej, że ambience to najtańszy kanał „to inne miejsce",
     * i tu jest on niewykorzystany — gęstwina brzmi dokładnie jak las, przez
     * który gracz właśnie szedł. Własny bed to wpis w `tools/gen_audio.py`
     * (dopisywany na KOŃCU `SOUNDS`, inaczej przesuwa się strumień rng i
     * zmieniają się wszystkie pliki poniżej), czyli dźwięk generowany, nie
     * rysowany — do zrobienia osobno.
     */
    ambientKey: "forest-ambient",
  },
  /**
   * The one tileset a map cannot be built without: it carries the terrain, and
   * a colour-placeholder texture would resolve every tile index to garbage.
   * Any OTHER tileset is optional — a map that references one we can't bind
   * still loads, minus those tiles. Which names we know how to bind lives in
   * TiledMap's TILESET_TEXTURES, next to the code that does the binding.
   *
   * This is "Teren", not "Nature", since the terrain/props split: a map
   * without its props is a bare field you can still walk around, a map without
   * its ground is nothing at all.
   */
  /**
   * ⚠ DEV/PROTOTYP — mała mapa testowa systemu instancji drzew (`window.dev.
   * treeProto.load()`, mapId "treeproto"). Sam grunt + warstwa obiektów `trees`
   * z nachodzącymi na siebie drzewami różnych rozmiarów. Ładowana tylko w
   * dev-buildzie (BootScene). Do skasowania po migracji lasu —
   * `docs/tree_instances.md`.
   */
  treeproto: {
    key: "map-treeproto",
    path: "assets/maps/tree_proto.tmj",
    minimapKey: "minimap-forest",
    label: "Prototyp drzew",
    ambientKey: "forest-ambient",
  },
  /**
   * ⚠ DEV/PROTOTYP — test 6 wariantów wierzby (`window.dev.treeProto.willows()`,
   * mapId "willowtest"). Rząd „obok siebie" + kępa z nakładaniem koron + para
   * wierzba×dąb (dwa tilesety TreeStamps/TreeStampsBig sortują się razem).
   * Generowana przez `tools/build_tree_stamps.py`. Nie dotyka `forrest.tmj`.
   */
  willowtest: {
    key: "map-willowtest",
    path: "assets/maps/willow_test.tmj",
    minimapKey: "minimap-forest",
    label: "Test wierzb",
    ambientKey: "forest-ambient",
  },
  requiredTilesetName: "Teren",
  /**
   * Zapas (w pikselach) doliczany do kadru kamery przy bramkowaniu warstw
   * kafli — patrz `TiledMap.gateLayersByCamera`.
   *
   * ⚠ **Nie jest kosmetyczny.** Test przecięcia biegnie na `POST_UPDATE`,
   * a kamera przelicza `worldView` dopiero w `preRender`, więc prostokąt,
   * który czytamy, jest o JEDNĄ klatkę spóźniony. Gracz robi przy 200 px/s
   * i klatce 10 ms około 2 px, więc dwa kafle zapasu to ponad dziesięciokrotny
   * margines — a błąd za mały objawiłby się jako warstwa wskakująca o klatkę
   * za późno przy samej krawędzi ekranu, czyli **migotanie, nie wyjątek**.
   */
  layerCullPadPx: 64,
  /**
   * Bok bloku (w kaflach) w siatce zajętości warstwy — patrz
   * `TiledMap.gateLayersByCamera`.
   *
   * ⚠ **Wartość jest ZMIERZONA, nie wybrana.** Średnia liczba warstw rysowanych
   * na klatkę w Zagajach (14 warstw, próbka 1845 pozycji kamery, 2026-08-23):
   *
   * | bramka | warstw/klatkę |
   * |---|---|
   * | brak | 14,00 |
   * | sam prostokąt otaczający | 9,25 |
   * | bloki 16×16 | 9,21 |
   * | bloki 8×8 | 8,12 |
   * | **bloki 4×4** | **7,36** |
   * | ideał (dokładny test kafli) | 6,91 |
   *
   * Czyli 4 zbiera ~80% tego, co w ogóle jest do zebrania, a 16 nie daje nic
   * ponad sam prostokąt. Schodzenie niżej niż 4 zamienia test bloków w test
   * kafli — czyli w to, przed czym ta bramka broni.
   */
  layerCullBlockTiles: 4,
} as const;

/**
 * Short map id (what a Tiled "portal" object's `target` property names, and
 * what GameScene passes as scene data across a transition) → the loadable
 * map entry. Kept separate from `MAPS` itself so a portal's `target` stays a
 * stable short word ("village") rather than the Phaser cache key ("map-
 * village"), which is an implementation detail of how the JSON was loaded.
 */
/**
 * ⭐⭐ **OTWARTY ŚWIAT** (2026-10-09, etap 2; decyzja autora): obszary leżą
 * obok siebie w pliku świata Tiled i są sklejane w JEDNĄ mapę przy starcie
 * (`src/world/WorldComposer.ts`) — przejście wieś ↔ las jest płynne, bez bramy.
 * `czlonkowie`: plik `.tmj` → id mapy (`MAP_BY_ID`). Stare id (`village`,
 * `forest`) z zapisów i portali przechodzą w świat z przesunięciem pozycji.
 * Gęstwina zostaje osobną mapą z portalem (poza plikiem świata).
 */
export const SWIAT = {
  id: "swiat",
  key: "map-swiat",
  jsonKey: "world-swiat",
  path: "assets/maps/swiat.world",
  czlonkowie: {
    "village-zagaje.tmj": { mapKey: "map-village", id: "village" },
    "forrest.tmj": { mapKey: "map-forest", id: "forest" },
  } as Record<string, { mapKey: string; id: string }>,
};

export const MAP_BY_ID: Record<
  string,
  { key: string; path: string; minimapKey: string; ambientKey: string; label: string }
> = {
  forest: MAPS.forest,
  village: MAPS.village,
  thicket: MAPS.thicket,
  // DEV/PROTOTYP — patrz MAPS.treeproto. `import.meta.env.DEV` nie zawęża tego
  // obiektu (to tylko rekord), ale BootScene ładuje `.tmj` wyłącznie w dev.
  treeproto: MAPS.treeproto,
  willowtest: MAPS.willowtest,
};

/**
 * Player-facing name of a map, for text that has to say where someone is —
 * today only the save-slot cards ("poz. 7 · 340 g · **Zagaje** · 1:12").
 *
 * Deliberately separate from `MAPS`/`MAP_BY_ID`, which are load descriptors
 * keyed by an internal short id: "village" is a cache key, "Zagaje" is a place
 * in the world, and the two should be free to diverge (a second village would
 * be `village2`, never "Zagaje 2"). An unknown id falls back in the caller
 * rather than resolving to a wrong name.
 */
export const MAP_LABEL: Record<string, string> = {
  forest: "Las",
  village: "Zagaje",
};

/**
 * ⭐ **ATLAS ŚWIATA** (2026-10-14) — gdzie każdy obszar leży na mapie CAŁEGO
 * świata, w px świata. Mapa w panelu (widok „Świat”) rysuje z niego wszystkie
 * obszary naraz, także te, które w grze są osobnymi mapami za portalem —
 * gracz ma widzieć, jak duży jest świat (autor 2026-10-14: „będąc na jednej
 * mapie nie wiemy, jakie lokacje są dalej”).
 *
 * - `village`, `forest`: pozycje z `maps/swiat.world` (ten sam układ, co
 *   `WorldComposer`; rozjazd zgłasza ostrzeżenie w dev — `Minimap`).
 * - `thicket`: osobna mapa za portalem, przyłożona tak, by brama stykała się
 *   z bramą: portal lasu (238,5; 69) ↔ przybycie Gęstwiny (2; 32), więc
 *   x = 240 kafli (wschodni skraj lasu), y = 128 + 69 − 32 = 165 kafli.
 *
 * ⚠ Rozmiaru obszaru tu NIE ma — bierze się z obrazu minimapy (4 px na kafel,
 * `tools/build_minimap.py`), żeby nie był drugą kopią rozmiaru mapy Tiled.
 * Kolejność = kolejność rysowania.
 */
export const MAP_ATLAS: readonly { id: string; x: number; y: number }[] = [
  { id: "village", x: 0, y: 0 },
  { id: "forest", x: 0, y: 4096 },
  { id: "thicket", x: 240 * 32, y: 165 * 32 },
];

/**
 * ⭐ **ODKRYWANIE TERENU — mgła na mapie i minimapie** (2026-10-14, autor:
 * „jak w Minecrafcie”). Nieodwiedzone = czysty pergamin, odwiedzone =
 * rysunek. Pamięć działa ZAWSZE, także przed nauką Kartografii (decyzja
 * autora) — nauka pokazuje od razu wszystko, co gracz już przeszedł.
 * Stan: `core/Exploration.ts`; rysunek: `ui/MapFog.ts`.
 */
export const MAP_FOG = {
  /** Bok komórki mgły w px świata. 64 = dwa kafle = 8 px obrazu minimapy,
   *  czyli 4 j. na minimapie HUD-u (zoom ½) — ziarno w rytmie kartki. */
  cellPx: 64,
  /** Promień odkrywania wokół gracza (px świata). 12 kafli ≈ to, co gracz
   *  widzi przed sobą na ekranie telefonu w poziomie, bez kątów kadru. */
  revealRadiusPx: 384,
  /**
   * Ile pergaminu przebija przez rysunek odkrytego terenu (0 = obraz minimapy
   * bez zmian). Odrobina „tuszu na papierze” — rysunek ma należeć do kartki,
   * nie wyglądać jak wklejone zdjęcie satelitarne.
   */
  paperTint: 0.18,
  /** Autozapis po odkryciu nowego terenu — najwyżej raz na tyle ms. Komórki
   *  odkrywają się kilka razy na sekundę marszu; zapis co komórkę pisałby
   *  `localStorage` bez przerwy. Utrata ≤ 15 s odkryć przy zabiciu aplikacji
   *  to przyjęty koszt. */
  saveEveryMs: 15000,
  /** Gęstość obrazów minimapy: 4 px na kafel 32 px (`tools/build_minimap.py`).
   *  Z niej atlas wyprowadza rozmiar obszaru, którego gracz jeszcze nie
   *  odwiedził (`MAP_ATLAS` nie trzyma rozmiarów). */
  minimapPxPerWorld: 4 / 32,
} as const;

/** Map-to-map transition tuning. */
export const PORTAL = {
  /**
   * How close the player must stand to a "portal" object to trigger the
   * transition. Deliberately small (under one tile) — a portal is a gate you
   * walk *through*, not a wide field that swallows you from a distance, and
   * the arrival point on the other side is placed just far enough outside
   * this radius that stepping through doesn't immediately trigger the return
   * trip (see tools/portale.py, the shared authoring contract for both ends).
   */
  triggerRadius: 34,
  /** Camera fade in/out either side of a transition, in ms. Long enough to
   *  hide the one-frame pop of the new map's first tiles, short enough that
   *  a hub map doesn't feel like a loading screen. */
  fadeMs: 150,
  /**
   * The **entrance marker** — a translucent glyph drawn on every portal.
   *
   * ⚠ **This is a VOCABULARY, not scenery, and that distinction decided its
   * whole shape.** A signpost marks a gate on a road and marks nothing at a
   * cottage door or a cave mouth; the player would have to learn a new sign
   * per kind of place. The marker is the opposite: one glyph, drawn the same
   * way on every transition there will ever be, learned once. Scenery (the
   * signpost, the posts either side of the road) still exists — it makes the
   * world look right — but it is not what teaches the player.
   *
   * **It costs nothing per new transition.** It is not painted: `GameScene`
   * draws one on every `portal` object, and a portal object has to exist for
   * the transition to work at all. A future door in a cottage is one point in
   * Tiled and the marker appears by itself.
   *
   * The register is already established here: the game draws a ring on the
   * selected target (`targetMarker`), so a translucent overlay affordance is
   * not a new idea in this project — which matters, because a glowing arcane
   * portal would be flatly wrong for "ciepły realizm".
   */
  marker: {
    /** Texture size (px). Two tiles wide, so it reads as a threshold on a
     *  64px road rather than as a dropped item. */
    size: 64,
    /** Resting alpha. Low enough that the ground still reads through it —
     *  it is a hint laid over the world, not a thing standing in it. */
    alpha: 0.42,
    /** Alpha at the top of the breath, and how long one breath takes. The
     *  pulse is what separates "an affordance" from "a stain on the grass". */
    pulseAlpha: 0.72,
    pulseMs: 1400,
    /** Chevron/arch colour — a warm off-white that sits on both the road's
     *  dirt and the village's grass without turning into UI chrome. */
    color: 0xf2e6c8,
  },
} as const;

/**
 * **Połowa kąta przedniej półkuli, w stopniach. JEDNA liczba dla ataku i dla
 * obrony.**
 *
 * 90 = pełne 180° przed postacią. Zwrot, o który się ją liczy, to zawsze
 * „kierunek, który RYSUJE sprite" (`Player.guardDir` / `facingDir`), nigdy
 * kierunek do celu — patrz `SHIELD.blockArcDeg`.
 *
 * ⚠ **Istnieje po to, żeby ta liczba nie stała w dwóch miejscach.** Projekt
 * złapał już raz dokładnie tę klasę błędu (komentarz przy `attackArcDeg`), a
 * tutaj byłaby gorsza niż zwykła literówka: atak i blok rozjechane o kilka
 * stopni dają regułę prawdziwą, powtarzalną i niemożliwą do wytłumaczenia
 * graczowi — „widzę go, mogę go trafić, ale nie mogę zablokować". Pilnuje
 * tego dodatkowo asercja §L w `tools/combat_regresja.mjs`, bo sama wspólna
 * stała nie przeszkodzi komuś wpisać z powrotem `90` literałem.
 *
 * ⚠ **Konsekwencja sprzężenia: strojąc tarczę, stroisz też bramkę ataku.**
 * To jest zamierzone — reguła ma brzmieć „trafiasz to, co mógłbyś zablokować".
 * Jeśli kiedyś ma się rozejść, rozdziel ją ŚWIADOMIE (dwie stałe + dwa
 * uzasadnienia), a nie przy okazji strojenia jednej z nich.
 */
export const FRONT_ARC_DEG = 90;

/** Player tuning. */
export const PLAYER = {
  hp: 100,
  /**
   * BARE-HANDED damage, rolled per hit before Strength/crit. This is punching,
   * and it is meant to be nearly useless.
   *
   * It used to be 8–12, which at the 0.5s base cooldown is 20 dps — **exactly
   * the same as the dagger** (avg 9 at 0.45s). The first weapon in the game
   * cost 20 gold and bought literally nothing, and the whole ladder from
   * nothing to the top weapon spanned +31%. Punching a 95 HP boar has to be a
   * bad idea; a sharpened branch has to be a real step up.
   *
   * At 3–5 (8 dps) the stick is nearly double, and the dagger 2.5×.
   */
  damageMin: 3,
  damageMax: 5,
  /** Skalowanie atrybutów dla GOŁYCH RĄK — najniższe w grze i tak ma być.
   *  Pięść nie jest sprzętem, więc nie nagradza żadnego buildu. Patrz
   *  `ATTRIBUTES` i `ITEMS.sword.strScale`. */
  strScale: 0.02,
  dexScale: 0.02,
  /** Movement speed in px/second. */
  speed: 150,
  /**
   * Base chance for a melee hit to crit, 0..1. Deliberately lower than the
   * old 25%: paired with the bigger multiplier below, a crit is now an event
   * you notice rather than background noise. Average damage is unchanged
   * (0.25×1.4 ≈ 0.15×1.8), but the *variance* — and the payoff for investing
   * in Zręczność — is much higher.
   */
  critChance: 0.15,
  /** Damage multiplier on a crit (1.8 = 180% of normal). */
  critMultiplier: 1.8,
  /** Seconds between allowed attacks. */
  attackCooldown: 0.5,
  /**
   * WHEN in the swing the hit actually resolves, as a fraction of that
   * weapon's own `swingDurationMs` (see docs/systemy/combat.md, C-01).
   *
   * 0.5 is the sword's maximum extension — `updateSword`'s thrust is
   * `sin(pi * t)`, which peaks exactly at t = 0.5 — so the damage lands on
   * the frame the blade is furthest forward rather than on the frame the
   * button was pressed.
   *
   * Deliberately a FRACTION, not a per-weapon millisecond field: the timing
   * then falls out of the swing each weapon already has (dagger ~70ms,
   * hammer ~120ms), so a dagger keeps feeling snappier than a hammer without
   * a second set of numbers to keep in sync. It also scales with attack speed
   * for free, since `Progression.swingDurationMs` already does.
   */
  swingHitFraction: 0.5,
  /**
   * Bufor doklejany do zamachu, zanim poza ataku się skończy (ms).
   *
   * ⚠ **Wyjęte z `Player.triggerAttack` 2026-08-20, bo czytają to DWA
   * miejsca**: długość pozy (`attackPoseUntil`) i część odzyskania
   * w `Progression.rootDurationMs`. Dopóki liczba stała w encji, była też
   * jedyną częścią ukorzenienia, która **nie skalowała się z niczym** — i to
   * ona sprawiała, że Zręczność zmniejszała wolny czas na sekundę zamiast go
   * zwiększać. Dwa wyrażenia z tą samą stałą potrafią się rozjechać, jeden
   * config nie.
   *
   * ⚠ Sama liczba jest bez zmian (40) — to jest przeprowadzka, nie strojenie.
   */
  swingPoseBufferMs: 40,
  /**
   * Jak daleko przed postacią zaczepiona jest OPRAWA zamachu (px).
   *
   * ⚠⚠ **To NIE jest zasięg ciosu i komentarz twierdził inaczej do 2026-09-07.**
   * Stało tu „how far the attack hitbox reaches" — nieprawda: o trafieniu
   * decyduje wyłącznie `Progression.attackReach` (56–98 px w zależności od
   * broni) przez `GameScene.targetInReach`. Ta liczba ma dziś dwóch
   * czytelników i obaj są PREZENTACJĄ: punkt, w którym `spawnSwingFx` rysuje
   * ślad świstu, oraz odsunięcie sprite'a broni w dłoni.
   *
   * ⛔ **Nie strój jej „żeby broń dosięgała dalej"** — nie dosięgnie. Zmiana
   * przesunie wyłącznie miejsce, w którym rysuje się błysk.
   */
  attackRange: 40,
  /**
   * Wypad ciała przy zamachu — krok w przód i z powrotem.
   *
   * ⚠ **Przeprowadzka z kodu, nie strojenie (5B).** Stało w `triggerAttack`
   * jako `attackRange * 0.15` i `duration: 70`, czyli dokładnie te liczby.
   * Wyszło stamtąd razem z przepisaniem na `nudge`, bo od 5B nie jest to już
   * jedyne przesunięcie ciała w oknie zamachu — recoil od trafienia ląduje
   * w jego połowie i oba muszą się sumować.
   *
   * ⚠ To NIE jest recoil i nie ma go tam szukać: wypad odpala się na KAŻDYM
   * zamachu, także chybionym, bo opisuje zamach, a nie trafienie.
   */
  swingLunge: { px: 6, ms: 70 },
  /** Half-size of the attack hitbox (px). */
  attackRadius: 26,
  /**
   * Frontal half-arc of the swing, in degrees. Together with the reach
   * (attackRange + attackRadius) this replaces what used to be a CIRCLE
   * floating `attackRange` px ahead of the player.
   *
   * That circle spanned 14..66px ahead, so it barely covered the player's own
   * feet: an enemy standing exactly on you sat 40px from the circle's centre
   * against a 40.35px threshold — a 0.35px margin, i.e. a coin flip. Rabbits
   * walk straight into you, so this showed up constantly as "it's on top of me
   * and I can't hit it; I have to back off first".
   */
  attackArcDeg: 55,
  /**
   * Anything within this radius is hit regardless of which way you face.
   *
   * A melee swing must never have a dead zone at contact range — in every
   * game of this lineage, something standing ON you is hittable. Beyond this
   * bubble the arc above still applies, so facing keeps mattering at reach.
   */
  pointBlankRadius: 28,
  /**
   * **Bramka zwrotu autoataku: cel musi być w przedniej półkuli, żeby zamach
   * w ogóle wystartował.**
   *
   * ⚠ Do 2026-08-23 tej bramki NIE BYŁO. `resolveAttack` wołało `aimAttackAt`
   * bezwarunkowo, więc blokada celu obracała postać o 180° do wroga, który
   * zaszedł ją od pleców — bez żadnego wejścia gracza, bo autoatak zostaje
   * uzbrojony do śmierci celu. Zgłoszone z rozgrywki: wilk okrąża, wraca od
   * tyłu i obrywa. Całe okrążanie watahy było wtedy bez konsekwencji.
   *
   * ⚠ **Snap na cel (`aimAttackAt`) zostaje i jest tu potrzebny** — ale jako
   * ASSIST, nie jako obrót. Koryguje niedokładność drążka wewnątrz półkuli
   * (przy zwrocie 4-kierunkowym to najwyżej jedna ćwiartka), a nie odwraca
   * postaci do kogoś za plecami. Bramka jest sprawdzana PRZED snapem — inaczej
   * assist unieważniłby sam warunek, który ma go ograniczać.
   */
  attackFrontArcDeg: FRONT_ARC_DEG,
  /**
   * Jedyne obejście bramki zwrotu, w PIKSELACH PRZERWY (`gapBetween`):
   * 0 = ciała stykają się lub na siebie nachodzą.
   *
   * ⚠ **To NIE jest `pointBlankRadius` i nie wolno go nim zastąpić.** Tamten
   * ma 28 px i służy łukowi Szerokiego cięcia; użyty tutaj odtworzyłby atak
   * 360° w zwarciu, czyli dokładnie to, co ta bramka usuwa — a zwarcie jest
   * stanem NORMALNYM w tej walce, nie awarią. Przy 0 zawór łapie wyłącznie
   * rzeczywiste nachodzenie hurtboxów (wróg dosłownie wszedł w gracza), gdzie
   * „skąd nadchodzi" przestaje mieć sens geometryczny.
   *
   * Zwykły przeciwnik stojący blisko za plecami MA wymagać obrotu.
   */
  attackFacingBypassGapPx: 0,
  /**
   * Bare-handed melee shape. Every weapon carries its own `melee` block (see
   * ITEMS); this is the fallback when you're punching.
   *
   * Short reach and no knockback — see the knockback note in COMBAT_FEEDBACK
   * for why "no knockback" is now the default rather than a small amount.
   */
  melee: {
    reach: 52,
    knockback: 0,
  },
  /**
   * Bare-handed attack variants — the fallback when nothing is equipped, same
   * role `melee` above plays for the hit shape.
   *
   * One variant, and that is the point: a weapon with a single entry behaves
   * EXACTLY as it did before variants existed (every multiplier absent = 1) and
   * shows no variant buttons at all. See `AttackVariant` in core/Equipment.ts.
   */
  attacks: [{ id: "strike", name: "Cios", damageType: "blunt" }],
  /**
   * Rendered scale for the character sprite. V3.5 (2026-09-20): 1 -> 1.15 -
   * the 60px `Character.png` frame height this was pinned to is no longer
   * the ceiling (player now renders as the 3D model via `Character3D`,
   * normalized to `displayHeight` regardless of it - see that class's
   * `zmierzWysokoscTresci()`). Bumped for two reasons at once: a few more
   * on-screen px for mobile readability, and to land closer to Kowal/Hunter
   * (~66px, their own `scale` targets ~1.1x the OLD 60px baseline) instead
   * of reading smaller than the NPCs standing next to him. Zgloszone wprost
   * po porownaniu z Kowalem ("wygladamy jak niedozywiony manekin obok
   * niego") - patrz docs/postac3d_checkpoint.md dopisek o V3.5.
   */
  scale: 1.15,
  /**
   * Extra scale (on top of `scale`) for the held-weapon prop, which is always
   * an item icon now (items.png's uniform 32×32 grid, see
   * public/assets/README.md) — sized down a bit so it doesn't dwarf the ~31×60
   * character sprite while held.
   */
  heldWeaponScale: 0.55,
  /**
   * How the sword moves during a swing. The blade pivots about the hilt, which
   * is pinned to the hand (see ASSETS.character.handOffsets).
   */
  swing: {
    /** Half-width of the arc, in degrees. Wide arcs read as a windmill. */
    arcDeg: 22,
    /** How far the hilt pushes forward at mid-swing, px. Pure rotation reads
     *  like a pendulum on a nail; the push sells an actual strike. */
    thrustPx: 7,
    durationMs: 180,
    /**
     * Tilt of the blade away from the facing axis, per direction (degrees).
     *
     * `down` needs a big one. The hand sits 11px below the sprite centre and
     * the blade reaches ~24px past the pivot, so pointing it straight down puts
     * the tip 8px *below* the feet — it looks like the character is sweeping the
     * floor. Clearing the feet line needs at least acos(16/24) ≈ 48°, so the
     * blade is tilted across the body and cuts in front of the legs instead.
     */
    tiltDeg: { down: -50, up: 0, left: -15, right: 15 },
    /**
     * Which way the held-weapon sprite points when its rotation is 0, in
     * degrees (0 = right, 90 = down).
     *
     * This used to be assumed to be +90 ("the icon rests pointing down"),
     * which was true of the thin blade sprite cut from Character.png that the
     * prop originally used. The prop is now the item's icon from items.png,
     * and every weapon there is drawn on the other diagonal — blade up-left,
     * grip down-right. Measured across all four: dagger -135.8, sword -135.0,
     * hammer -135.0 (the axe reads -155 only because its head is a wide blob
     * offset from the shaft; its shaft is on the same 45 degrees).
     *
     * Being 225 degrees out is what made the character grip the BLADE and lead
     * with the pommel.
     */
    iconRestDeg: -135,
    /**
     * Normalised origin of the held-weapon sprite: where the hand grips it.
     * Was 0.5 (dead centre), so the character held the middle of the blade
     * rather than the handle. Measured grip centroids run 0.63 (hammer) to
     * 0.84 (dagger) — 0.78 sits near the butt of the longer grips without
     * pushing the short ones off the hand.
     */
    gripOrigin: 0.78,
  },
  /**
   * Passive HP regenerated per second at 0 Kondycja. Scales with the attribute
   * (see ATTRIBUTES.hpRegenPerEndurance).
   *
   * Tuned so that healing HALF your max HP takes ~75 seconds at *every* build:
   * base 0.65/s on 100 HP and 2.61/s on a 394 HP full-Kondycja character both
   * land there. Investing in Kondycja therefore makes you tankier without
   * secretly making recovery feel slower, which a flat rate would have done.
   */
  hpRegenPerSecond: 0.65,
  /**
   * Regeneration only resumes this long after the last hit TAKEN — the classic
   * "five second rule". This is what keeps potions relevant: no amount of
   * regen ever competes with a potion mid-fight, because mid-fight it is
   * switched off entirely. Every enemy's contact-damage cooldown is well under
   * 5s, so standing next to anything hostile keeps regen suppressed.
   *
   * Note it keys off damage *taken*, not damage dealt: killing something
   * without being touched lets you recover immediately, which quietly rewards
   * clean play.
   */
  regenDelayMs: 5000,
  /** Collision body (px) — usually smaller than the sprite so movement feels good. */
  /**
   * **Ślad stopy gracza — zmierzony, i okazał się OKRĘGIEM.**
   *
   * 22 px z przodu × 21 px z boku (proporcja 1,05). ⚠ To jest korekta
   * istotnego błędu: progi zatrzymania wrogów były przez chwilę strojone przy
   * założeniu „gracz jest wysoki (60 px) i wąski (22 px), więc jedna okrągła
   * liczba nie może zadowolić obu kierunków". **60 px to WYSOKOŚĆ SPRITE'A,
   * czyli perspektywa — nie powierzchnia zajmowana w rzucie z góry.**
   */
  hurt: { length: 22, depth: 21 },

  bodyWidth: 18,
  bodyHeight: 16,
} as const;

/**
 * Levelling. XP needed to go from level L to L+1 grows geometrically:
 *
 *     xpToNext(L) = round(baseXp * growth^(L-1))
 *
 * ── Why `growth` is 1.13 and not something punchier ──────────────────────
 * A geometric curve over 50 levels is brutally sensitive to this exponent —
 * it is the single most important number in the file. The original 1.35 made
 * the level cap literally unreachable: L49→50 alone cost 72 MILLION XP (about
 * a million boars), and the full climb to 50 totalled ~278 million. The game
 * quietly ended around level 15 where the curve outran the content.
 *
 * At 1.13 the same 50 levels cost ~122k XP total (~2.7k kills): L10→11 is
 * 120 XP, L30→31 is 1,385, and the final level is a genuine ~200-boar push
 * instead of a wall. Raise this only alongside more XP sources — every +0.01
 * here compounds 49 times over.
 */
export const PROGRESSION = {
  baseXp: 40,
  growth: 1.13,
  /**
   * Skill points granted per level. One, not three: with flat per-point
   * bonuses a 147-point budget made every stat overshoot the content by an
   * order of magnitude. One point per level also gives a decision *every*
   * level-up (WoW talent cadence) rather than a lump to dump thoughtlessly.
   */
  skillPointsPerLevel: 1,
  /** Levelling stops here; XP past it is discarded. */
  maxLevel: 50,
} as const;

/**
 * Character attributes — CZTERY: Siła, Witalność, Kondycja, Zręczność.
 *
 * ⚠ **Rozdział Kondycji na WITALNOŚĆ i KONDYCJĘ (2026-08-21).** Do tej pory
 * jeden atrybut („Kondycja") odpowiadał za maks. HP i regenerację HP. Po
 * rozdziale:
 *
 *   • **Witalność (`vitality`)** — maks. HP i regeneracja HP. Nic więcej.
 *     ⚠ Świadomie NIE dostaje pancerza, odporności, uniku ani leczenia
 *     otrzymanego: ma odpowiadać na jedno pytanie — „ile obrażeń przeżyję".
 *   • **Kondycja (`conditioning`)** — cała STAMINA (`STAMINA` niżej).
 *
 * ⚠ **Stare pole `endurance` NIE ISTNIEJE JUŻ W KODZIE, ale istnieje
 * w zapisach.** `Save` czyta je jako Witalność (zachowuje HP postaci) i ustawia
 * Kondycję na 0 — czyli stary zapis nie traci ani punktu HP, a nowy atrybut
 * startuje pusty. Pole dokłada się OPCJONALNIE, bez podbijania
 * `SAVE_VERSION` (niezmiennik z `CLAUDE.md`).
 *
 * Derived stats are always computed from base + attributes (never accumulated
 * into a running total), so respeccing later is a matter of changing the
 * attribute and recomputing — no drift, no migration.
 *
 * ── SKALOWANIE PER BROŃ (2026-08-20) ───────────────────────────────────────
 * ⚠ **Siła i Zręczność NIE dodają obrażeń — MNOŻĄ obrażenia broni, każda
 * w tempie zapisanym NA TEJ BRONI** (`ITEMS[*].strScale` / `dexScale`):
 *
 *     obrażenia = baza(jakość) × wariant × (1 + SIŁ×strScale + ZRĘ×dexScale)
 *
 * Poprzedni model (`damagePerStrength: 1`, płasko) **erodował trzy systemy,
 * które ta gra już zbudowała**, i to jest jedyny powód tej zmiany:
 *  1. **drabinkę broni** — od Siły 5 najlepszą bronią jednocelową był sztylet
 *     za 40 g, a przy Sile 20 młot za 280 g przegrywał z kijem za 12 g;
 *     ⚠ bramka `requires: { strength: 6 }` prowadziła do broni GORSZEJ niż
 *     broń bez bramki;
 *  2. **jakość wykonania** — Siła była DODAWANA, więc rozcieńczała różnicę
 *     między Podłą a Arcymistrzowską tym mocniej, im więcej jej było;
 *  3. **warianty ataku** — przewaga Cięcia nad Pchnięciem spadała z 11,8%
 *     (Siła 0) do 3,3% (Siła 10). Po zmianie zostaje 11,8% na całej krzywej.
 *
 * ⚠ **Dlaczego PER BROŃ, a nie jedno wspólne `p`.** Jednolity procent
 * zachowuje drabinkę, ale ją ZAMRAŻA — mnoży wszystko tak samo, więc młot jest
 * najlepszy przy Sile 0 i przy Sile 15, dla postaci siłowej i zręcznościowej.
 * Wybór broni przestaje być wyborem buildu. Per broń: **SIŁ → młot, ZRĘ →
 * sztylet, i to na każdym poziomie inwestycji** (zmierzone).
 *
 * ⚠ **Powód, który przeważył, nie jest balansowy.** To jedyny model, do którego
 * wpina się BROŃ DYSTANSOWA I MAGIA bez wyjątku w kodzie: łuk dostaje wysoki
 * `dexScale`, kostur w swoim czasie dostanie swój. Przy „+X% obrażeń
 * fizycznych od Siły" łuk jest nierozwiązywalny.
 *
 * Kalibracja, asercje i wszystkie tabele: `docs/atrybuty.md` §10, liczone
 * przez `tools/atrybuty_kalibracja.mjs`. ⚠ **Ruszając którykolwiek
 * `strScale`/`dexScale` przepuść ten przymiar** — pilnuje m.in. tego, żeby
 * droższa broń nie stała się słabsza od tańszej.
 */
export const ATTRIBUTES = {
  /** Max HP added per point of Witalność. */
  hpPerVitality: 6,
  /**
   * Passive HP-per-second added per point of Witalność, on top of
   * PLAYER.hpRegenPerSecond. Chosen as hpPerVitality/150 so the regen rate
   * grows in step with the max HP the same point just bought — see the
   * "~75 seconds to heal half" note on PLAYER.hpRegenPerSecond. Change one of
   * these two and you must re-check the other, or high-Witalność builds start
   * healing relatively slower than fresh ones.
   */
  hpRegenPerVitality: 0.04,
  /**
   * Attack speed added per point of Agility, as a fraction (0.012 = +1.2%).
   * This is Agility's *primary* effect and the reason it stopped being a trap
   * stat — attack speed is the one bonus you feel under your thumb, and it
   * scales every weapon equally instead of favouring one.
   */
  attackSpeedPerAgility: 0.012,
  /**
   * Cap on the attack-speed bonus. Not just balance: the swing animation and
   * the melee-hitbox cooldown both scale off it, so an uncapped value would
   * eventually outrun the attack pose and read as the sprite stuttering.
   * At +60% the fastest weapon (dagger, 0.45s) lands at 0.28s — still comfortably
   * longer than its 140ms swing.
   */
  maxAttackSpeedBonus: 0.6,
  /**
   * O ile Zręczność skraca ODZYSKANIE po zamachu (ułamek na punkt).
   *
   * ⚠ **To jest tożsamość Zręczności i jedyna rzecz, której nie da się kupić
   * gdzie indziej.** Attack speed jest z definicji neutralny wobec buildu
   * (skaluje każdą broń identycznie — patrz `attackSpeedPerAgility`), więc sam
   * nie potrafi stworzyć stylu gry. Root potrafi: to on robi z pozycjonowania
   * treść, to jego kryje tarcza i to on jest sednem problemu z watahą wilków.
   *
   * ⚠ **Skraca wyłącznie część PO trafieniu.** Zamach dzieli się na
   * zobowiązanie (do `PLAYER.swingHitFraction` — to jest zapowiedź i
   * czytelność pozy, Zręczność jej nie tyka) i odzyskanie (reszta + bufor
   * 40 ms). Patrz `Progression.rootDurationMs`.
   *
   * ⚠ **Poprzedni stan był ODWROTNOŚCIĄ deklarowanej tożsamości i to jest
   * zmierzone:** `root = zamach + 40`, gdzie `+40` nie skalowało się wcale, więc
   * inwestowanie w Zręczność ZMNIEJSZAŁO wolny czas na sekundę (560 → 541 ms/s
   * przy ZRĘ 20). ⚠ Samo przeskalowanie tamtego `+40` dawało dokładnie ZERO
   * (560 ms/s przy każdej wartości), a nie poprawę — dlatego rozdział, a nie
   * poprawka stałej.
   *
   * **0,020 jest wymuszone pomiarem, nie gustem.** Przy ZRĘ 10 wolny czas
   * idzie 550 → 604 ms/s. Przy 0,030 wychodzi 631, ale wtedy Zręczność
   * dostawałaby tożsamość ORAZ przewagę liczbową naraz — a w `docs/atrybuty.md`
   * §10.4(d) ma już parytet w dps. Przy ZRĘ 0 root wynosi tyle co zawsze
   * (220 ms na mieczu), więc postać, która w to nie inwestuje, nie traci nic.
   */
  recoveryPerAgility: 0.02,
  /** Sufit skrócenia odzyskania. Wiąże dopiero od ZRĘ 25 — czyli poza
   *  realnym pasmem 0–15, ale zanim root zrobi się nieczytelny. */
  maxRecoveryReduction: 0.5,
  /**
   * ⚠ **Zręczność NIE daje już szansy na krytyka — i to nie jest nerf, tylko
   * usunięcie redundancji.** Krytyk ma w tej grze dwóch właścicieli, obu
   * lepszych: **broń** (sztylet, `melee.critChanceBonus`) i **rodzinę**
   * (topór, `WEAPON_FAMILY.axe.critMultiplierBonus`).
   *
   * Powód jest ten sam, którym ten projekt odrzucił już `blockChance`
   * (`docs/systemy/shields.md`) i losowe zachwianie (`WEAPON_FAMILY.blunt`):
   * **walka trwa 2–5 ciosów.** +0,6%/pkt to przy dziesięciu punktach jeden
   * krytyk więcej raz na ~3,3 walki — poniżej progu zauważalności. Ta sama
   * pomyłka, dwa razy odrzucona gdzie indziej, stała tu do 2026-08-20.
   *
   * Stała `maxCritChance` ZOSTAJE: szansa dalej rośnie od broni, pierścieni
   * i jakości, więc sufit ma czego pilnować.
   */
  maxCritChance: 0.6,
} as const;

/**
 * **STAMINA — zasób WYSIŁKU.** Kierunek projektowy i pomiary:
 * `docs/systemy/stamina.md`, przymiar `tools/stamina_model.mjs`.
 *
 * ⚠ **Czym stamina NIE JEST, i to jest ważniejsze niż same liczby:**
 * nie jest maną, nie jest cooldownem i **nie blokuje podstawowych działań**.
 * Przy zerze gracz dalej atakuje i dalej chodzi — pogarsza się tylko
 * sprawność. Zmęczony bokser nadal uderza, po prostu wolniej.
 *
 *   HP odpowiada na pytanie „jak blisko jestem śmierci".
 *   Stamina odpowiada na pytanie „jak bardzo jestem zmęczony".
 *
 * ⚠ **Wszystko tutaj jest KONFIGURACJĄ, nie stałą w kodzie.** System ma być
 * platformą pod przyszłe mechaniki (Drugi Oddech, adrenalina, przedmioty
 * zmieniające koszt/regenerację), więc żaden koszt ani próg nie ma prawa
 * zamieszkać w `if`-ie w encji.
 */
export const STAMINA = {
  /** Pula = `base + perConditioning × Kondycja`. */
  base: 120,
  perConditioning: 10,

  /**
   * Regeneracja na sekundę **PRZY WYSIŁKU** — czyli dopóki cokolwiek kosztuje
   * staminę. `docs/systemy/proficiency.md`: *3/s w walce · 4/s poza walką*.
   *
   * ⚠ **To jest świadome odejście od reguły pięciu sekund, którą stosuje HP.**
   * Tamta istnieje, żeby wykluczyć leczenie w walce; stamina ma cel odwrotny —
   * ma wracać, kiedy przestajesz się wysilać. Pomiar, który to rozstrzygnął:
   * odstęp między walkami na mapie lasu wynosi **3,1 s** (trasa przez 19
   * spawnów, 8318 px), więc opóźnienie 5 s oznaczało, że regeneracja **nie
   * startuje ani razu przez całe przejście**. Szczegóły: `docs/systemy/stamina.md`
   *
   * ⚠⚠ **4 → 3 (2026-09-02, wariant A po playteście).** Przy 4/s bicie mieczem
   * miało bilans **+0,04/s** — `11 × 0,180 / 0,5 = 3,96` wobec regenu 4,00 —
   * czyli ciągły autoatak był energetycznie neutralny i **trening na manekinie
   * nie męczył w ogóle**. §24a przewidziało to co do setnej i wskazało tę
   * liczbę, a nie wyższe `C`, jako właściwą dźwignię: **podniesienie `C`
   * psuje RELATYWNĄ cenę uniku** (1 unik spada z 7,6 na 6,4 zamachu przy
   * C = 13), a to pytanie „unik czy bić dalej" jest treścią walki.
   */
  regenPerSecond: 3,
  /** Po tylu ms BEZ INTENSYWNEGO WYSIŁKU regeneracja przyspiesza. ⚠ Liczy się
   *  brak wysiłku, a nie „koniec walki" — sprint też zeruje ten licznik. */
  restedAfterMs: 5000,
  /**
   * Regeneracja **PO ODPOCZYNKU** (`restedAfterMs` bez wydatku) — druga połowa
   * pary z §24a.
   *
   * ⚠ **Liczba bezwzględna, nie mnożnik (zmiana kształtu 2026-09-02).** Do tego
   * dnia stało tu `restedMultiplier: 1,5`, czyli „6/s po odpoczynku". Wariant A
   * wymaga pary **3/s → 4/s**; przez mnożnik dałoby się to zapisać wyłącznie
   * jako `1,3333…`, czyli liczbę, której nikt nie wybrał i która przy odczycie
   * niczego nie mówi. **Te dwie wartości są parą projektową i mają być czytelne
   * jako para.**
   *
   * ⚠ **`4 > 3` jest niezmiennikiem, nie preferencją** — odwrócenie znaczyłoby,
   * że odpoczynek szkodzi.
   */
  regenRestedPerSecond: 4,

  /**
   * ⚠ **Progi są BEZWZGLĘDNE, nie procentowe — i to nie jest gust.** Przy
   * progu procentowym (np. „Wyczerpany < 20% puli") próg rośnie razem z pulą,
   * więc inwestycja w Kondycję potrafi POGORSZYĆ sytuację: symulacja pokazała
   * CON 10 wyczerpującego się w 7. walce przy CON 0, który nie wyczerpywał się
   * wcale. Wartość bezwzględna daje to, czego gracz oczekuje: większa pula =
   * większy zapas NAD progiem.
   */
  tiredBelow: 45,
  exhaustedBelow: 25,

  /**
   * Kary stanów. Mnożnik tempa ataku (<1 = wolniej) i mnożnik ODZYSKANIA
   * (>1 = dłużej).
   *
   * ⚠ **Stan „Zmęczony" celowo NIE rusza tempa ataku.** Wolniejszy atak
   * wydłuża walkę → przeciwnik dostaje więcej okien → więcej wydatków
   * staminy: to jest pętla dodatniego sprzężenia i zmierzyliśmy ją
   * (17 bloków na przejściu przy wyczerpaniu wobec 8 bez niego). Zmęczony
   * płaci wyłącznie odzyskaniem, które nie skraca cyklu ataku, więc pętli nie
   * domyka. Dopiero Wyczerpany rusza tempo — tam kara MA być odczuwalna.
   *
   * ⚠ Niezmiennik do pilnowania przy strojeniu: `rootDurationMs` nie może
   * przekroczyć `attackCooldown`, bo poza ataku zacznie się rwać. Przy tych
   * wartościach zapas jest duży (miecz wyczerpany: root ~325 ms, cykl 625 ms).
   */
  states: {
    normal: { attackSpeedMul: 1.0, recoveryMul: 1.0, label: "" },
    tired: { attackSpeedMul: 1.0, recoveryMul: 1.15, label: "Zmęczony" },
    exhausted: { attackSpeedMul: 0.8, recoveryMul: 1.4, label: "Wyczerpany" },
  },

  /** Koszty. ⚠ Żaden z nich nie może ODMÓWIĆ akcji podstawowej — patrz
   *  `Stamina.spend`, które schodzi do zera i nigdy nie zwraca „nie stać cię". */
  costs: {
    /**
     * **EKONOMIA WYSIŁKU — `C` w punktach staminy na SEKUNDĘ ZAMACHU.**
     * `docs/systemy/proficiency.md`, zamknięte w sesji 2, wdrożone
     * 2026-09-02 razem z ładunkami Mastery.
     *
     * ```
     * koszt_zamachu = C × swingDurationMs/1000 × (1 − redukcja_Mastery)
     * ```
     *
     * ⚠ **Zastąpiło płaskie `autoAttack: 1`** — i to była rekalibracja
     * parametru, nie zmiana systemu (korekta autora, sesja 2: *„`staminaCost = 1`
     * to parametr do rekalibracji, nie ograniczenie projektowe"*). Skutek:
     * zamach kosztuje **1,44 (sztylet) … 2,98 (młot bojowy)**, miecz 1,85.
     * ⚠ **Lista kontrolna `stamina_model.md` §3.1–§5.2 (checkpoint §32.2) jest
     * przez to OTWARTA i czeka na playtest.**
     *
     * ⚠ **Źródłem czasu jest `swingDurationMs`, nie `attackCooldown` ani root**
     * — jako jedyny czyni `stamina/s` **niezmiennikiem Zręczności** (`zamach/cd`
     * jest stałe, `root/cd` maleje ze ZRĘ, co uczyniłoby ją statem
     * wytrzymałościowym wbrew `atrybuty.md` §10.5). Ten sam niezmiennik
     * obejmuje stan „Wyczerpany": `attackSpeedMultiplier` wydłuża zamach
     * i cooldown proporcjonalnie, więc `stamina/s` się nie zmienia i nie
     * powstaje pętla dodatnia.
     *
     * ⚠ **11, a nie więcej — i regeneracja, nie `C`, robi z bicia drenaż.**
     * Przy regeneracji 4/s bicie mieczem miało bilans `+0,04/s` (`11 × 0,360
     * = 3,96 ≈ 4`); podniesienie `C` do 13,9 zamiast obniżenia regenu psuło
     * RELATYWNĄ cenę uniku (1 unik = 6,4 zamachu zamiast 8,1).
     *
     * ⚠ **Dotyczy WYŁĄCZNIE autoataku.** Ekonomia wysiłku dla umiejętności
     * czynnych i bloku została świadomie odłożona (§25) — te mają własne
     * `staminaCost` i Mastery ich NIE dotyka.
     */
    autoAttackPerSecond: 11,
    /** Unik — mnożony przez obciążenie (`EQUIPMENT_LOAD`). */
    dodge: 15,
    /** Sprint W WALCE, na sekundę — też mnożony przez obciążenie. Poza walką
     *  patrz `sprintOutOfCombatPerSecond`. */
    sprintPerSecond: 10,
    /**
     * ⭐ **Sprint POZA WALKĄ: 0 = darmowy** (decyzja autora 2026-10-11, z gry).
     * Przy 10/s i odnowie 3/s pula 120 dawała ~17 s biegu (~128 kafli) i ~30 s
     * marszu na odnowę — a trasa las → plac wsi ma ~8600 px, więc bieg oszczędzał
     * 10 s z 57 i dowoził gracza wyczerpanego. Wycena z 2026-08-21 („przebiegnięcie
     * mapy = 155 staminy") liczyła las sprzed rozstawu ×1,5 (2026-10-04).
     *
     * ⚠ **Przy 0 bieg NIE woła `Stamina.spend` w ogóle**, więc nie zeruje też
     * licznika odpoczynku — inaczej darmowy bieg dalej blokowałby szybszą odnowę
     * (`docs/systemy/stamina.md`). Bieg W WALCE zostaje decyzją za 10/s.
     * Co jest „walką" — `STAMINA.sprintCombatWindowMs`.
     */
    sprintOutOfCombatPerSecond: 0,
    /** Blok, gdy tarcza NIE poda własnego kosztu (`blockStaminaCost`). */
    blockFallback: 4,
  },

  /**
   * Koszt PRZYJĘTEGO ciosu — krzywa, nie próg.
   *
   * ⚠ **Świadomie NIE jest to binarne „ciężki / nie ciężki".** Próg binarny
   * stoi na urwisku: kontakt Szarego po skórze zabiera 10,2 pkt przy progu
   * 10,0, więc zmiana pancerza o 2% przełączała pięć ciosów w jednej walce.
   * Krzywa liniowa kosztuje jedną linijkę i tego nie ma. Liczone PO pancerzu
   * i PO tarczy, czyli od tego, co gracz faktycznie dostał.
   *
   * ⚠ Próg jest BEZWZGLĘDNY, nie „% maks. HP": inaczej Witalność po cichu
   * obniżałaby wydatki staminy, a `VIT` ma zostać czystym HP.
   */
  heavyHit: {
    /** Poniżej tylu obrażeń cios nie kosztuje ani punktu staminy. */
    thresholdDamage: 9,
    /** Ile staminy za każdy punkt obrażeń ponad progiem. */
    costPerPointOver: 1.0,
    /** Sufit, żeby jeden cios nie wyzerował paska. */
    maxCost: 12,
  },

  /** Sprint: mnożnik prędkości ruchu. ⚠ Sprint wymaga staminy > 0, żeby
   *  ruszyć — bo bieg NIE jest działaniem podstawowym (chodzenie jest i ono
   *  nigdy nie jest blokowane). */
  sprintSpeedMultiplier: 1.6,
  /**
   * **Kiedy bieg kosztuje stawkę bojową** (2026-10-11). Walka = którykolwiek
   * z trzech sygnałów:
   *  1. wróg w pościgu za graczem (`Player.wWalce`, liczone w `GameScene`
   *     z `isChasing` — ta sama prawda, która steruje celowaniem);
   *  2. cios PRZYJĘTY w ostatnich `sprintCombatWindowMs`;
   *  3. wysiłek BOJOWY (autoatak, unik, umiejętność, blok) w tym samym oknie.
   *
   * ⚠ Samo (1) nie wystarcza: zwierzyna uciekająca po trafieniu (lis, jeleń,
   * królik w splochu) nie jest w pościgu, a dogonienie jej sprintem ma kosztować.
   * Samo (2) też nie: dawna reguła pięciu sekund z HP liczy tylko PRZYJĘTE ciosy.
   */
  sprintCombatWindowMs: 5000,
} as const;

/**
 * **OBCIĄŻENIE WYPOSAŻENIA — MODEL D, DWIE OSIE** (`OI-103`, wdrożone
 * 2026-09-15; decyzja: `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`).
 *
 * > ⭐⭐ **Siła może kompensować względny WYSIŁEK, ale nie kompensuje
 * > bezwzględnej MASY.**
 *
 * To jedno zdanie generuje cały ten blok. Jeżeli któraś liczba zacznie mu
 * przeczyć, **błędem jest liczba, nie zasada**.
 *
 * | kanał | wisi na | Siła kasuje? |
 * |---|---|---|
 * | prędkość ruchu (`speedK`) | `kg` — bezwzględna | ⛔ **NIE** |
 * | regeneracja staminy (`regenK`) | `kg` — bezwzględna | ⛔ **NIE** |
 * | koszt uniku i sprintu (`effortPerRatio`) | `ratio = kg / udźwig` | ✅ **TAK** |
 *
 * ⚠ **Liczy się wyłącznie to, co postać ma NA SOBIE** — czyli `EQUIP_SLOTS`
 * **oraz `STOW_SLOTS`** (`OI-96`, 2026-09-15: schowany zestaw broni waży
 * 100% swojej masy, bo leży na ciele). ⛔ **Plecak, dodatkowe torby i skrzynia
 * nadal nie ważą ani grama** — osobna, nietknięta decyzja
 * (`docs/inventory_scroll_ux.md` §3).
 *
 * ⚠ **Koszt zamachu (`STAMINA.costs.autoAttackPerSecond`) jest świadomie POZA
 * tym modelem.** Ciężki wojownik uderza tak samo szybko od pierwszej sekundy —
 * gorsza jest wyłącznie jego wydolność. To jest cała mechanika „kilku
 * pierwszych ciosów" i ⛔ **nie wolno dokładać tu kanału tempa ataku.**
 *
 * ⚠⚠ **`speedK` jest PARAMETREM STARTOWYM DO PLAYTESTU (`OI-105`), nie stałą
 * systemu.** Zmiana tej liczby po graniu **nie wymaga nowej decyzji**; zmiana
 * tego, który kanał wisi na której osi — wymaga.
 */
export const EQUIPMENT_LOAD = {
  /**
   * Udźwig: `base + perStrength × Siła` do `softCapStrength`, dalej
   * `perStrengthAbove` za punkt.
   *
   * ⚠ **Malejący przyrost powyżej Siły 20 nie jest kosmetyką.** Przy dawnym
   * wzorze liniowym bez sufitu **107 kg mieściło się w klasie „Lekkie" przy
   * Sile 70** — czyli każdą masę dało się znormalizować atrybutem. Poniżej
   * Siły 20 nic się nie zmienia i całe dotychczasowe strojenie zostaje.
   */
  base: 20,
  perStrength: 2.5,
  softCapStrength: 20,
  perStrengthAbove: 1.0,

  /**
   * Granice klas jako UŁAMEK udźwigu — dziś **wyłącznie ETYKIETY dla HUD**
   * nad wartością ciągłą, ten sam wzorzec co `STAMINA.states`.
   *
   * ⚠ **Nie są już progami kary.** Kara jest ciągła (`effortPerRatio`), bo
   * model progowy nie potrafił rozróżnić `ratio` 0,91 od 1,82 — obie kosztowały
   * 1,50 (`OI-101`).
   */
  mediumAbove: 0.55,
  heavyAbove: 0.9,
  label: { light: "Lekkie", medium: "Średnie", heavy: "Ciężkie" },

  // ── OŚ WZGLĘDNA (ratio) — Siła ją wykupuje ──────────────────────────────

  /** Poniżej tego `ratio` wysiłek nie drożeje. Celowo = `mediumAbove`, żeby
   *  nic poniżej dzisiejszej klasy „Średnie" nie zostało przestrojone. */
  effortFreeRatio: 0.55,
  /**
   * Przyrost mnożnika kosztu uniku i sprintu na jednostkę `ratio` ponad próg.
   *
   * ⛔ **BEZ SUFITU, i to jest sedno `OI-101`.** Funkcja kary z sufitem nie
   * potrafi wycenić postaci, która ten sufit przekracza — a warstwowanie
   * pancerza jest dokładnie mechaniką, która go przekracza.
   */
  effortPerRatio: 0.9,

  // ── OŚ BEZWZGLĘDNA (kg) — Siła jej NIE dotyka ───────────────────────────
  //
  // ⚠ Kształt `K / (K + x)` jest ten sam, co `d / (d + defenseK)`
  // w `core/Protection.ts`. To nie jest nowa matematyka w tym projekcie.

  /** Masa, od której zaczyna się kara. Poniżej — pełna prędkość i regeneracja. */
  speedFreeKg: 10,
  /**
   * Stała krzywej prędkości. ⚠ **Wymuszona z dwóch stron przez `chaseSpeed`
   * fauny, nie wybrana:** niżej (100–120) skoczek (96 px/s) wchodzi w zasięg
   * katalogu i łamie niezmiennik „odejście zawsze działa"; wyżej (180–220)
   * wataha (115 px/s) przestaje łapać 62 kg i ekstremum przestaje kosztować.
   *
   * Przy 150 przecięcia wypadają: **Szary (132) przy 30,5 kg**, **wataha (115)
   * przy 55,7 kg**, **skoczek (96) dopiero przy 94,4 kg** — poza katalogiem.
   */
  speedK: 150,
  /** Podłoga prędkości. Wiąże dopiero od ~80,6 kg, czyli **poza dzisiejszym
   *  katalogiem** (maks osiągalny zestaw: 47,5 kg) — backstop, nie strojenie.
   *  ⚠ 0,68 × 150 = 102 px/s, nadal powyżej skoczka (96). */
  speedFloor: 0.68,

  /** Masa, od której maleje regeneracja staminy. */
  regenFreeKg: 10,
  /** Stała krzywej regeneracji. To jest kanał „szybciej się męczę" — jedyny,
   *  który różnicuje wydolność, nie dotykając burstu. */
  regenK: 100,
  /** Podłoga regeneracji; wiąże dopiero ~91,8 kg, czyli poza katalogiem. */
  regenFloor: 0.55,
} as const;

/**
 * **TRENING CIĘŻKIEGO PANCERZA** — trzy rangi kupowane u trenera
 * (`OI-103`, decyzja `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` §3).
 *
 * ⚠ **Ranga ZDEJMUJE CZĘŚĆ KARY, nigdy jej nie kasuje.** Po wszystkich trzech
 * rangach 75,5 kg ma nadal 116 px/s wobec 148 px/s postaci w 12 kg i 2,17/s
 * regeneracji wobec 2,94/s. ⛔ **Sześć punktów nie robi z żelaza skóry** i nie
 * wolno tego zmienić strojeniem `relief`.
 *
 * ⭐ **Kolejność rang nie jest przypadkowa.** Najtańsza siedzi na kanale,
 * którego **Siła nie dotyka** (regeneracja), więc jest warta kupienia także
 * postaci silnej. Najdroższa dotyka osi ruchu, czyli tej świętej.
 *
 * ⚠ **Σ 6 punktów = dokładnie tyle, co pełne Mastery I–IV na jedną rodzinę
 * broni.** Specjalizacja w ciężkim pancerzu ma kosztować tyle, co opanowanie
 * jednej broni do końca. ⛔ Nie podnoś tego do skali kilkunastu punktów:
 * budżet życiowy postaci to **49 punktów** (`PROGRESSION.skillPointsPerLevel`
 * × `maxLevel`), a całe drzewo jedenastu umiejętności czynnych kosztuje 14.
 *
 * ⛔ **CENY ZŁOTA CELOWO NIE MA W TYM BLOKU.** Ekonomia złota jest otwarta
 * (`OI-46`) i decyzja o obciążeniu jawnie jej nie zamykała. Rangi kosztują
 * dziś **wyłącznie punkty** i uczy ich `ArmorTraining.learn`; wpięcie do
 * sklepu trenera wraz z ceną należy do `OI-46`, nie do `OI-104`.
 */
export const ARMOR_TRAINING = {
  ranks: [
    {
      id: "armor_habit",
      name: "Nawyk ciężaru",
      points: 1,
      /** Ile kary REGENERACJI zdejmuje (0..1). */
      regenRelief: 0.3,
      effortRelief: 0,
      speedRelief: 0,
      description: "Ciężar przestaje zabierać oddech tak szybko.",
    },
    {
      id: "armor_breath",
      name: "Oddech",
      points: 2,
      regenRelief: 0,
      /** Ile kary WYSIŁKU zdejmuje (0..1). */
      effortRelief: 0.35,
      speedRelief: 0,
      description: "Unik i bieg w zbroi kosztują mniej sił.",
    },
    {
      id: "armor_stride",
      name: "Chód w żelazie",
      points: 3,
      regenRelief: 0,
      effortRelief: 0,
      /** Ile kary RUCHU zdejmuje (0..1). ⚠ Najdroższa ranga, bo dotyka osi,
       *  której Siła nie rusza. */
      speedRelief: 0.25,
      description: "Żelazo przestaje ciążyć w każdym kroku.",
    },
  ],
} as const;

/**
 * Attack Resolver — Combat v1 (2026-08-21). Warstwa Dodge/Parry: pasywna,
 * bez inputu, rozstrzygana automatycznie w `Player.takeDamage`. Patrz
 * `core/Defense.ts` po mechanikę PRD, `Progression.dodgeChance`/`.parryChance`
 * po złożenie tych liczb z atrybutami i sprzętem.
 *
 * ⚠ **Baseline ma być RZADKI, świadomie** — decyzja projektowa: podstawowa
 * przeżywalność ma iść z HP/pancerza/Blocku, nie z avoidance. Nie podnosić
 * tych liczb "żeby było czuć", bez świadomej zmiany tej decyzji.
 */
export const DEFENSE = {
  dodge: {
    /** Bazowa szansa (wszechkierunkowa), zero gearu/atrybutów. */
    base: 0.04,
    /** Dodatek do szansy za punkt Zręczności — świadomie mały (patrz
     *  ATTRIBUTES.attackSpeedPerAgility, Zręczność ma już tempo/recovery;
     *  to jest bonus, nie nowy filar). DEX 15 -> +6pp, wciąż w "rzadkie". */
    perAgility: 0.004,
    /**
     * Mnożnik WYŁĄCZNIE dla klasy "light" (`EQUIPMENT_LOAD.multiplier` <= 1.0).
     * Medium/Heavy NIE dostają dodatkowej kary — już płacą przez mnożnik
     * kosztu Uniku/Sprintu. Dokładanie drugiej kary za to samo obciążenie
     * było świadomie odrzucone (przymiar kalibracyjny, 2026-08-24).
     */
    lightLoadBonus: 1.3,
    /** Twardy sufit, żeby żaden zestaw bonusów nie zrobił z Dodge'a filaru. */
    cap: 0.5,
  },
  parry: {
    /**
     * Mały rdzeń, pomnożony przez `WEAPON_FAMILY.<rodzina>.parryBonus`.
     * Dostępne WYŁĄCZNIE dla broni z tożsamością rodziny "parry" (dziś:
     * miecz) — reszta rodzin ma tu zero, strukturalnie, nie przez brak
     * configu (patrz `Progression.familyParryBonus`).
     */
    core: 0.05,
    cap: 0.5,
  },
} as const;

/**
 * **BIEGŁOŚĆ (Proficiency) — warstwa 2 rozstrzygania ataku.**
 *
 * Pełny projekt, pomiary i uzasadnienia: `docs/systemy/proficiency.md`.
 * Tu stoją wyłącznie liczby zamknięte w §27 tamtego dokumentu.
 *
 * ⚠ **Warstwa 2 leży MIĘDZY geometrią (`HitResolver`) a obroną
 * (`DamageResolver`)** i jest funkcją czystą działającą w OBU kierunkach walki.
 * Odpowiada na jedno pytanie: *jak dobrze wykonano atak, który już mógł
 * dosięgnąć celu*.
 *
 * ⚠ **`neutral = 100` jest własnością MATEMATYCZNĄ, nie nazwą rangi.** Przy
 * `P = 100` wszystkie trzy kanały są tożsamością (`pm = 0`, `ps = 0`, `m = 1`),
 * więc postać kompetentna wobec punktu neutralnego ma **dokładnie dzisiejszy
 * balans**. To jest test regresyjny nr 1 i musi świecić na zielono.
 */
export const PROFICIENCY = {
  /** Punkt neutralny. `x = P / neutral` w każdym wzorze niżej. */
  neutral: 100,
  /** Execution Miss przy `P = 0`; opada liniowo do zera w punkcie neutralnym. */
  pmMax: 0.12,
  /** Ześlizg przy `P = 0`; ten sam kształt co `pmMax`. */
  psMax: 0.17,
  /** Mnożnik obrażeń przy `P = 0` (dolny koniec krzywej jakości). */
  mMin: 0.6,
  /** Sufit mnożnika powyżej punktu neutralnego — jakość SIĘ NASYCA (§15). */
  mMax: 1.12,
  /** Kształt krzywej jakości poniżej neutralnej. */
  alpha: 0.9,
  /** Nasycenie powyżej neutralnej: `1 + (mMax − 1)(1 − e^(−beta·(x−1)))`. */
  beta: 1.2,
  /**
   * Ile zostaje z ciosu, który TRAFIŁ, ale nieczysto.
   *
   * ⚠ **Ześlizg świadomie NIE bierze `m(P)`** — to jest osobna gałąź paska
   * wykonania, nie gorsze trafienie. Mnożenie obu dałoby karę liczoną dwa razy.
   */
  slipMultiplier: 0.3,
  /**
   * **Progi rang Mastery** — §14, zamknięte w sesji 2, przepisane bez zmiany.
   * Indeks + 1 = ranga, czyli `[I, II, III, IV]`.
   *
   * ⚠ **`P = 0…49` to BRAK RANGI, a nie ranga zerowa** — pełnoprawny, grywalny
   * stan „nie umiem tym machać". Skala nie zaczyna się od Mastery.
   *
   * ⚠⚠ **PRÓG NIE NADAJE RANGI** (§34, sesja 8 — odwrócenie wariantu A z sesji 4).
   * Próg robi dwie rzeczy naraz i obie są o `P`, nie o randze:
   * ```
   * P dochodzi do progu  →  TWARDY SUFIT `P` (praktyka powyżej PRZEPADA)
   *                      →  UPRAWNIENIE do kupienia rangi u trenera
   * ```
   * Rangę kupuje się osobno (`mastery` niżej) i jest ona **osobnym, zapisanym
   * stanem** w `core/WeaponProficiency.ts`.
   *
   * ⚠ **Podział odczytów, §34.5 — jedyna rzecz, którą łatwo tu złamać po cichu:**
   * softzone, `P_start` i przyszłe `gate` technik czytają **PRÓG `P`**; sufit
   * `P` i (przyszłe) EFEKTY rang czytają **RANGĘ WYKUPIONĄ**.
   *
   * ⚙ **Ładunki rang SĄ wdrożone** (sesja 11, 2026-09-02) — ekonomia wysiłku
   * −12/−24/−35%, cecha rodziny ×1,5/×2,0, `φ` topora i sztyletu, minimum
   * proporcjonalne. Liczby stoją w `mastery.payload` niżej, a **wszystkie
   * czytają RANGĘ WYKUPIONĄ, nigdy `P` ani progu** (§34.5).
   */
  masteryThresholds: [50, 100, 200, 350],
  /**
   * **MASTERY JAKO STAN KUPOWANY** — §34, zamknięte w sesji 8; miejsce zakupu
   * (D5) w sesji 9.
   *
   * ⚠ **Sufit `P` NIE MA własnej tabeli** — wynika z `masteryThresholds`:
   * ```
   * bez rangi → 50 · M-I → 100 · M-II → 200 · M-III → 350 · M-IV → bez sufitu
   * ```
   * czyli `cap(ranga) = masteryThresholds[ranga] ?? ∞`. Druga tabela z tymi
   * samymi liczbami rozjechałaby się przy pierwszej zmianie progów.
   */
  mastery: {
    /**
     * **Cena rangi: złoto + punkty rozwoju.** Indeks 0 = M-I. Zamknięte w §34.2
     * i **wycenione na żywym configu**: pełna rodzina 2800 g + 6 pkt, pięć
     * rodzin 14 000 g + 30 pkt, przy sklepie za 1407 g i wszystkich
     * umiejętnościach za 835 g.
     *
     * ⚠ **M-I kosztuje 0 punktów świadomie** — jest twardą bramką progresji,
     * więc przesiadka na nową rodzinę ma zostać tania w OBU walutach (§14a).
     *
     * ⚠ **Punkty idą z ISTNIEJĄCEJ puli** (`Progression.skillPoints`,
     * 1/poziom) i konkurują ze `SKILLS`. ⛔ Żadnej nowej waluty ani osobnej puli
     * — to jest cena decyzji z sesji 8, przyjęta świadomie: ranga jest odtąd
     * **także wyborem buildu**.
     */
    cost: [
      { gold: 50, points: 0 },
      { gold: 250, points: 1 },
      { gold: 700, points: 2 },
      { gold: 1800, points: 3 },
    ],
    /**
     * **Jedyny NPC sprzedający rangi** (D5, §34.9).
     *
     * ⚠ **Jedna liczba, nie system.** Docelowo różni trenerzy mogą oferować
     * różne rangi i różne rodziny — ⛔ **tego świadomie NIE budujemy teraz**.
     * Patryczek jest pierwszym i testowym trenerem; rozszerzenie na wielu
     * trenerów jest osobną decyzją projektową, nie zmianą tej stałej.
     */
    trainer: "patryczek",
    /**
     * **OKNO PRZEDSPRZEDAŻY — ile `P` przed sufitem trener już sprzedaje
     * kolejną rangę** (decyzja autora, 2026-09-03).
     *
     * ```
     * masteryUnlockP = cap − unlockLead
     *
     * brak rangi (cap  50) → M-I   od P =  40
     * M-I        (cap 100) → M-II  od P =  90
     * M-II       (cap 200) → M-III od P = 190
     * M-III      (cap 350) → M-IV  od P = 340
     * ```
     *
     * ⚠ **To zmienia WYŁĄCZNIE moment zakupu — nie sufit.** `capFor` liczy się
     * dalej z `masteryThresholds` i praktyka dalej staje twardo na 50/100/200/
     * 350; okno daje graczowi szansę **zdążyć do trenera, zanim zacznie tracić
     * praktykę**, zamiast dowiadywać się o zakupie dopiero po zatrzymaniu.
     *
     * ⚠ **Progi zostają NIETKNIĘTE i nadal znaczą to samo co przedtem** —
     * `masteryThresholds` jest jednocześnie sufitem i punktem odniesienia dla
     * `thresholdRankFor` (`P_start` nowej rodziny, pasek postępu). ⛔ **Ta stała
     * nie ma prawa wejść do żadnego z tych odczytów**: gracz z `P = 40`
     * i wykupionym M-I **nie** jest weteranem w rozumieniu D3 (§34.8), bo tamto
     * pyta o PRÓG `P ≥ 50`, a nie o zapłatę.
     */
    unlockLead: 10,
    /**
     * **ŁADUNKI RANG — co ranga naprawdę daje** (§14, drabina zamknięta
     * w sesji 2; nośniki cech rodzin — D1/D2/D3, sesja 4).
     *
     * ```
     * M-I   ekonomia wysiłku −12%
     * M-II  cecha rodziny ×1,5
     * M-III minimum proporcjonalne + ekonomia −24%
     * M-IV  cecha rodziny ×2,0 + ekonomia −35%
     * ```
     *
     * ⚠ **Wszystkie tabele są indeksowane RANGĄ WYKUPIONĄ (0…4), nigdy `P`
     * ani progiem** (§34.5). Indeks 0 = brak rangi = zero efektu.
     *
     * ⚠ **Drabina jest KUMULATYWNA** — dlatego M-III niesie `traitMultiplier`
     * M-II (1,5) i `critLowCut` M-II (0,25): ranga III nie odbiera tego, co
     * kupiła ranga II, tylko dokłada własny ładunek.
     */
    payload: {
      /**
       * Redukcja kosztu zamachu, po randze. Sufit **−35% jest WYPROWADZONY**:
       * poprawia wysiłek na 100 obrażeń ×1,54, czyli 60% wkładu samego
       * Proficiency (×2,57). Przy −50% Mastery przebija Proficiency i drabina
       * przestaje mieć właściwego właściciela.
       */
      effortReduction: [0, 0.12, 0.12, 0.24, 0.35],
      /**
       * Mnożnik CECHY RODZINY, po randze — **stosowany do EFEKTU (wyniku
       * gettera `Progression.*`), nigdy do POLA w `WEAPON_FAMILY`** (D1).
       * Mierzone na mieczu: parada 5,75% → 8,63% → 11,50%, wobec 6,13% →
       * 6,50% przy mnożeniu pola; stosunek `(1+b)/b` = ×7,67.
       *
       * Dotyczy rodzin, których cecha ma bazę NIEZEROWą: `sword` (`parryBonus`)
       * i `blunt` (`staggerMs`). ⚠ Dla obucha FIELD ≡ EFFECT (getter zwraca
       * pole wprost) — **to pokrycie, nie wyjątek; nie dorabiać osobnej ścieżki.**
       */
      traitMultiplier: [1, 1, 1.5, 1.5, 2],
      /**
       * **`φ` — ułamek rozstrzału odcięty OD DOŁU przy losowaniu KRYTYKA**
       * (D2), po randze. Nośnik cechy rodzin `axe` i `dagger`.
       *
       * ⚠ **Wartości PER RANGA, nie mnożnik z `traitMultiplier`** — i to jest
       * reguła, nie wyjątek: cecha o bazie ZEROWEJ nie ma czego mnożyć
       * (`0 × 1,5 = 0`), a przyjęcie `φ₀ = 0,25` jako „bazy rodziny" dawałoby
       * toporowi górną ćwiartkę **już przy `P = 0`**, cicho zmieniając
       * dzisiejszy balans wbrew §10.
       *
       * ⛔ **Mastery NIE rusza `critChance`, `PLAYER.critMultiplier`,
       * `critMultiplierBonus` ani `maxCritChance`** — zakaz z §13 obowiązuje
       * bez zmian. Zysk idzie wyłącznie z PODŁOGI losowania (+3,2…+6,6% DPS
       * przy `φ = 0,50`), czyli tam, gdzie fikcja mistrzostwa chce niezawodności.
       */
      critLowCut: [0, 0, 0.25, 0.25, 0.5],
      /**
       * **MINIMUM PROPORCJONALNE (M-III)**: `min += round(rozstrzał × udział)`.
       *
       * ⚠ **Proporcjonalne, nigdy płaskie `+1`** — zmierzone: płaskie zerowało
       * rozstrzał pięści (3–5 → 5–5) i było regresywne ×4,3 (pięści +25%, młot
       * bojowy +5,4%). Proporcjonalne samo się ogranicza: przy rozstrzale
       * poniżej 3 daje zero.
       */
      minimumFromRank: 3,
      minimumShare: 1 / 6,
    },
  },
  /**
   * **Startowe `P` nowej rodziny broni** — §14a, zamknięte w sesji 2.
   *
   * `fresh` — żadna inna rodzina nie sięgnęła jeszcze Mastery I.
   * `veteran` — jakakolwiek inna sięgnęła; **25 to kotwica semantyczna skali
   * („trzymasz to poprawnie")**, czyli chwyt, postawa i dystans, które
   * doświadczony wojownik przenosi między rodzinami — nigdy technika.
   *
   * ⚠ **Wartość STAŁA.** Nie skaluje się z poziomem postaci ani z tym, jak
   * rozwinięta jest poprzednia broń — procent najlepszej innej rodziny został
   * zmierzony i odrzucony (czyni przesiadkę łagodniejszą dla zaawansowanego).
   */
  startNewFamily: { fresh: 0, veteran: 25 },
} as const;

/**
 * **PRAKTYKA — jak `Proficiency` ROŚNIE.** `docs/systemy/proficiency.md`
 * §19 (krzywa kosztu), §20 (praktyka w walce), §22 (softzone), §14b (manekin).
 *
 * ```
 * pula praktyki  →  koszt kolejnego +1  →  P += 1
 * ```
 *
 * ⚠ **`+1` jest ATOMEM** — zmienia się CENA punktu, nigdy jednostka. To wyklucza
 * modele z przyrostem ułamkowym (`ΔP = k(cap − P)`) i było rozstrzygnięte
 * w sesji 2. Pula między punktami jest buforem, nie ułamkiem `P`.
 *
 * ⚠ **Oba kanały są dziś W KODZIE:** manekin (`dummy*`, §14b) i **WALKA**
 * (`combat*`, §20–§21, wdrożone 2026-09-02 jako D7). Rozdział ról jest
 * projektowy, nie techniczny:
 * ```
 * MANEKIN  wejście w nową rodzinę — pierwsze 10 punktów od `P_start`, potem 0
 * WALKA    właściwa progresja — bez limitu punktów, ale z funkcją nauczyciela
 * ```
 * ⛔ **Gracz nie ma być zmuszony do farmienia kukły**, żeby rozwijać broń —
 * i dlatego kanał walki nie ma limitu, a kanał manekina ma.
 */
export const PRACTICE = {
  /**
   * Skala całości. **Odwrócone od celu `0 → 100 = 45 min`** ≈ 17 przejść lasu
   * (sesja 3), czyli punkt neutralny osiągalny w obrębie jednego przejścia gry.
   *
   * ⚠ **To jest JEDYNE pokrętło tempa.** `c` z §20 jest stałym mnożnikiem
   * dokładnie tak samo jak `base`, więc oba są jednym stopniem swobody i `c`
   * zostało zamrożone jako konwencja. Strojąc tempo, rusza się TĘ liczbę.
   */
  base: 6.7,
  /**
   * `koszt(P) = costA + costB × P` — cena kolejnego punktu.
   *
   * ⚠ **Zamknięty jest STOSUNEK `r = costA / costB = 262`** (sesja 3: udziały
   * pasm 9/11/27/53%, punkt drożeje ×2,33 na całej drodze). Sama para liczb
   * NIE jest w checkpointcie zapisana — `costB = 1` to **konwencja przyjęta
   * przy wdrożeniu (2026-09-02, decyzja autora)**, wybrana dlatego, że odtwarza
   * oba pomiary manekina z §14b z błędem +0,6% i +1,3%. Skalowanie `costA`,
   * `costB` i `base` wspólnym czynnikiem nic nie zmienia — więc dopóki `base`
   * stoi, ta para też musi stać.
   */
  costA: 262,
  costB: 1,
  /**
   * Wykładnik softzone (M2, per pasmo Mastery): `soft(P) = (1 − (P − od)/(do − od))^s`.
   *
   * ⚠ **Parametr o wpływie ×7,8 na czas całości** — jedyny taki w systemie.
   * Pomyłka nie objawi się jako „trochę za wolno", tylko jako „progresja nie
   * działa". 0,40 leży w paśmie taniej pomyłki `[0,35 … 0,60]`, między „cap
   * niewidzialny" a „widoczny postój": ściana przed M-IV to 23 min.
   */
  softzoneS: 0.4,
  /**
   * **Ile praktyki niesie cios wg wyniku warstwy 2** (decyzja autora,
   * 2026-09-02). Klucze odpowiadają `Execution` z `core/CombatCues`.
   *
   * ⚠ **`graze` NIE MA własnej liczby — bierze `PROFICIENCY.slipMultiplier`.**
   * To jest świadome: praktyka śledzi to, ile z ciosu naprawdę weszło, a system
   * nie dostaje kolejnego pokrętła. Zmiana `slipMultiplier` rusza więc dwie
   * rzeczy naraz (obrażenia ześlizgu i naukę z niego) — i tak ma być.
   *
   * ⚠ `fumble` i `whiff` to **dokładnie zero, nie „mało"**: cios, który nie
   * dosięgnął celu, niczego nie uczy.
   */
  executionWeight: { clean: 1, graze: 0.3, fumble: 0, whiff: 0 },
  /**
   * **MANEKIN — ograniczony kanał wejścia w nową rodzinę broni** (§14b).
   *
   * ```
   * praktyka = base × soft(P) × dummyEfficiency(lp)      lp = P − P_start
   * ```
   *
   * ⚠ **NIE korzysta z `teacher × √n`, i to nie jest uproszczenie.**
   * `TRAINING_DUMMY.hp = 100 000`, więc walka nigdy się nie kończy, `n` rośnie
   * bez ograniczeń i `c·√n` asymptotycznie zamiera — zmierzone: pierwsze 10
   * punktów zajęłoby 2 h 46 min / 6 h 20 min.
   *
   * ⭐ **Spadek efektywności JEST odpowiednikiem `√n`** — jeden mechanizm
   * malejących przyrostów, jeden właściciel. Drugiego nie wprowadzać.
   */
  dummy: {
    /** Efektywność na starcie pasma (`lp = 0`). ⚠ Pochłonęła dawne
     *  `0,8 × base` — dwie płaskie kary naraz były błędem. */
    efficiencyFrom: 0.7,
    /** Efektywność na końcu (`lp → limit`). Liniowo, bo kształt krzywej
     *  okazał się bez znaczenia ekonomicznego (4 jedn./min różnicy) — wybrany
     *  na oszczędność parametrów. */
    efficiencyTo: 0.3,
    /**
     * Ile punktów od `P_start` manekin w ogóle uczy. **`lp ≥ limit` → DOKŁADNIE
     * ZERO**, permanentnie i bez odnawiania.
     *
     * ⚠ Dlatego `P_start` musi być ZAPISANE, nie wyprowadzane w locie:
     * przeliczanie progu przy zdobyciu Mastery I inną bronią odblokowałoby
     * manekina po raz drugi (§14b).
     */
    limit: 10,
    /**
     * **Tempo manekina — mnożnik na sam kanał manekina** (decyzja autora
     * z playtestu, 2026-09-02).
     *
     * ⚠ **Dotyczy WYŁĄCZNIE manekina.** `PRACTICE.base` (tempo całości)
     * i przyszła praktyka z walki są nietknięte — mnożnik siedzi tu, a nie
     * w `base`, właśnie po to, żeby nie przyspieszył niczego poza treningiem
     * na kukle.
     *
     * ⚠ **Nie rusza ŻADNEGO ograniczenia manekina**: limit 10 punktów od
     * `P_start`, twardy stop, `dummyEfficiency` i `soft(P)` działają bez
     * zmian — mnożnik wchodzi na sam WYNIK, jako ostatni czynnik.
     *
     * ⚠ **Co to robi z kryterium „manekin nigdy nie optymalny" (§14b):**
     * ```
     * R1  WIĄŻĄCE (ekonomia)   ×2,12 → ×1,77   ✅ dalej powyżej progu ×1,5
     * R2  HIGIENA (czytelność) ×1,59 → ×1,33   ⚠ 11% PONIŻEJ progu
     * ```
     * Warunek wiążący trzyma; higieniczny schodzi pod próg przy najsłabszym
     * nauczycielu (skoczek wobec gracza z `P = 25`). **Przyjęte świadomie na
     * podstawie playtestu — 2 minuty bicia kukły bez ani jednego punktu to
     * zbyt wolno — i zgłaszane przez uprząż, nie ukryte.**
     *
     * ⚠ **Podniesione 1,10 → 1,20 po drugim playteście (2026-09-02).** Gdyby
     * miało rosnąć dalej, właściwą dźwignią przestaje być ten mnożnik:
     * przy ×1,42 pod próg schodzi też R1, czyli manekin staje się lepszym
     * treningiem niż walka z odradzającym się przeciwnikiem. **To jest granica
     * tego pokrętła**, nie zaproszenie do dalszego kręcenia.
     * ⚠ Oba marginesy są dziś liczbami PROJEKTOWYMI — praktyka z walki nie ma
     * kodu (D7), więc manekin jest jedynym działającym źródłem `P`.
     */
    rateMultiplier: 1.2,
  },
  /**
   * **PRAKTYKA Z WALKI** — §20 (`c·√n`) i §21 (funkcja nauczyciela).
   * Wdrożone 2026-09-02 jako D7.
   *
   * ```
   * praktyka = base × teacher(ρ) × soft(P) × c × (√k − √(k−1))
   * ρ = P_przeciwnika / P_gracza          k = który to trafienie w TEGO przeciwnika
   * ```
   */
  combat: {
    /**
     * **`c` — KONWENCJA NORMALIZACYJNA, nie pokrętło** (sesja 3).
     *
     * Dobrane tak, żeby walka 8-zamachowa dawała dokładnie 8 jednostek
     * (`c·√8 = 8`), czyli neutralnie wobec dawnego modelu liniowego.
     * ⚠ `c` i `base` są **jednym stopniem swobody** — oba są stałymi
     * mnożnikami. Strojąc tempo, rusza się `base`; `c` zostaje zamrożone,
     * inaczej dwa pokrętła kręcą tym samym.
     */
    c: 2.8284,
    /**
     * **Funkcja nauczyciela** (§21): ile wart jest przeciwnik jako sparing.
     *
     * ```
     * ρ ≤ 0,8   →  0     nic się już od niego nie nauczysz
     * ρ = 1,0   →  1     nominalnie
     * ρ ≥ 2,0   →  4     sufit
     * ```
     *
     * ⚠ **Stąd bierze się „sufit nauczyciela = P/0,8"** z §16: królik (`P = 20`)
     * przestaje uczyć **dokładnie** przy `P = 25`, czyli na podłodze weterana
     * z §14a. Ta zbieżność nie była projektowana — wypadła z dwóch niezależnych
     * liczb i jest powodem, dla którego `deadBelow` nie rusza się bez §14a.
     *
     * ⚠ **`max = 4` zweryfikowane pomiarem, nie ostrożnością** (sesja 3):
     * `K = 4/6/8` daje **identyczny rozstrzał ×1,25** między stworzeniami, bo
     * spłaszczenie pochodzi z rampy kończącej się przy `ρ = 2`, nie z sufitu.
     * Podnoszenie `max` skaluje wszystkich równo i niczego nie różnicuje.
     *
     * ⚠ **Odcinek `0,8 … 1,0` — interpolacja LINIOWA, i to jest domknięcie
     * pierwszego z trzech otwartych miejsc D7.** Checkpoint go nie
     * rozstrzygał, bo żaden zmierzony przypadek w nim nie leżał (§14b liczyło
     * `ρ` równe 0,80 · 1,36 · 1,92 · 2,16 · 2,40 · 2,72 · 3,28). Wybrano
     * jedyny wariant, który **niczego nie wymyśla**: ciągłe przedłużenie rampy
     * `1 → max`, czyli `0 → 1` na tym samym typie prostej. ⛔ Skok w tym
     * miejscu robiłby z `ρ = 0,8` urwisko, a projekt odrzucił już raz próg
     * binarny z dokładnie tego powodu (`STAMINA.heavyHit`).
     */
    teacher: { deadBelow: 0.8, nominalAt: 1, peakAt: 2, max: 4 },
  },
} as const;

/** Rabbit enemy tuning. */
export const RABBIT = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * Zwierzę, które NIE UMIE walczyć — gryzie z paniki i ucieka przy 40% HP.
   *  Kotwica dolna skali. ⚠ 20/25 = 0,8, czyli przestaje uczyć DOKŁADNIE
   *  na podłodze weterana (§14a) — rusza się tylko razem z tamtą podłogą.
   */
  proficiency: 20,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Zwierzę, które NIE UMIE walczyć — gryzie z paniki i ucieka. ⚠ To NIE
   *  jest bramka: przy `P = 0` uczy z pełnym mnożnikiem i doprowadza do 25
   *  (§16). `false` znaczy tylko: nie zobowiązujemy się trzymać dla niego
   *  marginesu manekina R1/R2. */
  teachingRole: false,
  hp: 30,
  /** XP awarded to the player for a kill. */
  xpReward: 25,
  /** Contact damage is rolled per tick between these bounds (inclusive). */
  touchDamageMin: 4,
  touchDamageMax: 6,
  /** Seconds between successive contact-damage ticks. */
  touchDamageCooldown: 1.0,
  /**
   * ⚠ **Bez typu, świadomie — królik nie ma ataku.** Ma overlap ciał i
   * cooldown: żadnej fazy, żadnego zasięgu, żadnej animacji ugryzienia, żadnego
   * commitu. To jest tick „stoisz w tym", a nie cios, więc nie ma czego opisać
   * przez slash/pierce/blunt.
   *
   * Drugi powód jest mierzalny: przy 4–6 obrażeń jedyną konsekwencją byłoby, że
   * pełna skóra (35,1% → 19,5% przy `pierce`) chroni **gorzej** przeciw
   * pierwszemu przeciwnikowi w grze. Efekt na rozgrywkę zerowy, kierunek zły.
   */
  touchDamageType: null as DamageType | null,
  /** Wander/patrol speed (px/s). */
  patrolSpeed: 30,
  /** Chase speed once it has aggro (px/s). */
  chaseSpeed: 70,
  /** Player must be within this distance (px) for the rabbit to start chasing. */
  aggroRange: 140,
  /** Rabbit gives up the chase beyond this distance (px). */
  deAggroRange: 260,
  /** Radius (px) of the random patrol area around the spawn point. */
  patrolRadius: 64,
  /** Seconds before a killed rabbit returns at its spawn point. */
  respawnDelay: 8,
  /** Extra random delay (s) on top, so respawns don't drift into synced waves. */
  respawnJitter: 4,
  /**
   * A respawn is postponed while the player stands within this many px of the
   * spawn point — a rabbit materialising on top of you reads as a bug, and with
   * contact damage it is also a free hit.
   */
  respawnSafeRadius: 80,
  /** Rendered scale for the rabbit sprite (each frame is 24×24 px). */
  scale: 1.6,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: zmierzone (`tools/combat_geometry.mjs`, sekcja A).

   */
  hurt: { length: 21, depth: 15 },

  bodyWidth: 13,
  bodyHeight: 12,
  /**
   * Hop locomotion — the rabbit does not GLIDE at a constant velocity, it moves
   * in bursts with a pause between them. `rabbit.png` has had a 4-frame hop
   * cycle from the start; until now the sprite hopped while the body slid
   * underneath it at a flat speed, which is exactly the mismatch ENEMY_MOTION
   * exists to paper over.
   *
   * One hop lasts exactly one pass of the sprite's own cycle (derived from
   * ASSETS.rabbit's frame count and fps in Rabbit.ts — the two cannot drift),
   * and the rabbit is propelled for `pushFraction` of it.
   */
  hop: {
    /**
     * Share of a hop the rabbit is actually being propelled for; the rest is
     * the pause between hops.
     *
     * ⚠ It is also the SPEED COMPENSATION: burst speed is `patrolSpeed` /
     * `chaseSpeed` divided by this, so the average over a whole hop is exactly
     * the speed those two fields already promised. That is what keeps every
     * number tuned around them — aggroRange, deAggroRange, how long a rabbit
     * takes to reach you — meaning what it meant before hops existed. Change
     * this and the rabbit stays as fast as it was; only its texture changes.
     */
    pushFraction: 0.65,
    /**
     * Sideways deviation per hop while chasing (degrees), alternating left and
     * right. Chase only — during patrol it would spiral around the wander
     * target instead of reaching it. This is the part that makes the frontal
     * attack arc a matter of timing rather than of walking up: a rabbit coming
     * at you in a straight line can be hit whenever, one that jinks cannot.
     */
    jinkDeg: 22,
  },
  /**
   * **Odgryzienie się (Faza 4 Combat v2, 2026-08-22).**
   *
   * Królik jest z natury płochliwy, ale **uderzony ATAKUJE** — i dopiero to
   * czyni z niego pełnoprawnego nauczyciela. Pierwszy przeciwnik w grze uczy
   * teraz podstawowej gramatyki walki, i to na własnych, tanich warunkach:
   *
   *     wróg przygotowuje cios → możesz odejść → jak nie odejdziesz, obrywasz
   *
   * ⚠ **To zamyka dziurę, którą audyt zgłosił jako koszt archetypu `Prey`**
   * (`docs/systemy/combat.md`, Faza 4): odbierając królikowi pościg,
   * odbieraliśmy graczowi jedyną wczesną lekcję przyjmowania ciosu. Odpowiedź
   * autora: zwierzę płochliwe, ale nie bezbronne. Lekcja zostaje, tylko teraz
   * **gracz sam ją wywołuje**, uderzając pierwszy.
   *
   * ⚠ **`reach` MUSI przekraczać `range`** — inaczej wynik byłby przesądzony w
   * chwili startu zamachu, a cofnięcie się byłoby teatrem. Ta sama reguła i ten
   * sam powód co przy skoczku (`VENOM_SPIDER.bite`) i Szarym.
   *
   * ⚠ **`range` liczy się dziś od ŚRODKA SPRITE'A, nie ciała** — a królika i
   * gracza dzieli 12,6 px fantomowego dystansu pionowego (zmierzone:
   * `tools/combat_geometry.mjs`). Przy `range: 34` realny prześwit między
   * sylwetkami to ~10 px, czyli zwierzę staje PRZED postacią, a nie na niej.
   * Po Fazie 1B ta liczba przejdzie na prześwit i będzie znaczyć wprost „10".
   */
  bite: {
    /**
     * ⚠ **Prędkość podejścia ROZJUSZONEGO królika — osobna od `chaseSpeed`.**
     *
     * Zgłoszone z rozgrywki (2026-08-23): „mało groźny, ale chyba za mało".
     * Przyczyną nie były obrażenia, tylko to, że sprowokowane zwierzę
     * podchodziło `chaseSpeed` = **70 px/s przy graczu 150** — czyli
     * **strukturalnie nie mogło gracza dosięgnąć**. Gryzło wyłącznie wtedy, gdy
     * gracz sam stanął, żeby się zamachnąć. To nie było strojenie, tylko
     * mechanika, która nie działała.
     *
     * 132 px/s: szybko, ale **wciąż poniżej gracza (150)**, więc odejście od
     * rozjuszonego królika jest możliwe — kosztuje tylko czas i pozwala mu
     * zajść z boku. To jest zresztą prawda o zwierzęciu: królik jest szybki.
     *
     * ⚠ Nie mylić z `prey.fleeSpeed` (92, ucieczka zrywami) ani z
     * `panic.boltSpeed` (230, jednorazowy sploch). Trzy różne prędkości dla
     * trzech różnych stanów tego samego zwierzęcia.
     */
    approachSpeed: 132,
    /** Podchodzi na tyle i staje. Patrz ostrzeżenie o fantomie wyżej. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    range: 4,
    /** Rozstrzygnięcie sprawdza dystans PONOWNIE — cofnij się, a chybi. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    reach: 13,
    /** Zamach. Krótszy niż 480 ms skoczka (królik jest szybki), ale wciąż
     *  dłuższy niż ukorzenienie po zamachu gracza — da się odejść. */
    windupMs: 380,
    /** Bezbronna pauza po ugryzieniu — okno na kontrę. */
    recoverMs: 260,
    cooldownMs: 900,
    /** Nastroszenie. Osobny kolor od 0xffd08a (Szary) i 0xa8d84f (skoczek):
     *  jeden kolor nie może znaczyć dwóch rzeczy. */
    windupTint: 0xffb4a2,
  },
  /**
   * **Archetyp `Prey` (Faza 4 Combat v2, 2026-08-22).** Królik przestał być
   * przeciwnikiem melee i został zwierzyną.
   *
   * ⚠ **To nie jest nerf, tylko uznanie stanu faktycznego.** `chaseSpeed: 70`
   * przy prędkości gracza **150** znaczy, że królik NIGDY nie mógł nikogo
   * dogonić. Jego 4–6 obrażeń padało wyłącznie wtedy, gdy gracz stał w
   * miejscu — i padało przez **nakładanie się CIAŁ**, czyli wymagało, żeby
   * zwierzę weszło ~9 px w sylwetkę postaci. Stąd zgłoszenie „królik wchodzi
   * na postać": to nie był błąd AI, tylko jedyny sposób, w jaki ten wróg mógł
   * cokolwiek zrobić. Analiza: `docs/systemy/combat.md` i Faza 4.
   *
   * ⚠ **`fleeSpeed` MUSI zostać poniżej `PLAYER.speed` (150).** Powyżej —
   * królik jest nie do złapania, a `rabbit_hunt` („Pierwszy odstrzał", pięć
   * sztuk) staje się niewykonalny. Zapas jest celowo duży, bo bramka `hop`
   * dzieli ruch na zryw i pauzę: średnia to `fleeSpeed`, ale w zrywie zwierzę
   * leci `fleeSpeed / hop.pushFraction` ≈ 166 px/s, czyli SZYBCIEJ niż gracz.
   * To jest cała treść pościgu — dogania się w pauzach, nie w zrywach.
   */
  prey: {
    /** Płoszy się od tego dystansu (px). Osobne od `aggroRange`, żeby dało się
     *  stroić płochliwość bez ruszania tego, kiedy zwierzę wie o graczu. */
    alertRange: 110,
    /** Prędkość ZRYWU (średnia; bramka `hop` robi z tego ~142 px/s w fazie
     *  napędu). Poniżej gracza — patrz ostrzeżenie wyżej. */
    fleeSpeed: 92,
    /**
     * ⚠ **Długość JEDNEGO zrywu (ms) — najważniejsza liczba w tym bloku.**
     *
     * Pierwsza wersja nie miała jej wcale: królik uciekał CIĄGLE, dopóki gracz
     * był w zasięgu. Zgłoszone z rozgrywki jako „gonienie go to porażka" i to
     * był **błąd projektu, nie strojenia**: atak wymaga zatrzymania się
     * (`resolveAttack` wychodzi przy `isMoving`), a zwierzę w tym czasie
     * odchodziło poza próg zasięgu — więc zamach **w ogóle nie ruszał**.
     * Uciekającego królika nie dało się trafić inaczej niż wpędzając go w
     * drzewo.
     *
     * Zryw ograniczony czasem daje graczowi okno, w którym cel STOI. To jest
     * jedyny powód, dla którego ta liczba istnieje.
     */
    boltMs: 420,
    /**
     * Ile stoi czujnie MIĘDZY zrywami (ms) — okno, w którym da się podejść i
     * uderzyć.
     *
     * ⚠ Musi z zapasem przekraczać czas rozstrzygnięcia zamachu
     * (`swingDurationMs` × `PLAYER.swingHitFraction`, dla miecza 170 × 0,5 =
     * 85 ms), inaczej cel ruszy w trakcie ciosu i znowu nie da się trafić.
     * Zapas jest ~10×, bo gracz musi jeszcze zdążyć DOJŚĆ i się zatrzymać.
     */
    watchMs: 820,
    /**
     * Przestaje się płoszyć po odsadzeniu się na tyle. Mniejsze niż
     * `deAggroRange` (260), więc królik odpuszcza SAM, zanim baza zerwie mu
     * agro — inaczej biegłby do granicy i stawał jak na ścianie.
     */
    calmGap: 150,
    /** Pierwsze nastroszenie, zanim padnie pierwszy zryw (ms). Bez tej pauzy
     *  ucieczka startuje w tej samej klatce, w której gracz wchodzi w
     *  `alertRange`, i czyta się jak teleport, a nie jak spłoszenie. */
    alertMs: 260,
  },
  /**
   * Sploch — bolt and freeze. Below `hpFraction` of its HP the rabbit breaks
   * off ONCE (a per-rabbit latch, never a loop), sprints flat out directly away
   * from the player, then stops dead and sits there.
   *
   * Two things keep this from becoming the tedious chase that flee mechanics
   * usually are, and both are load-bearing:
   * - **It is bounded by construction.** The bolt is a fixed distance
   *   (`boltSpeed` × `boltMs` = ~195px) and ends in a `freezeMs` window the
   *   player is faster than: at PLAYER.speed 150 a chasing player loses ~68px
   *   during the sprint and wins it all back — plus more — during the freeze.
   *   The freeze is the reward, not a second chase.
   * - **It fires once per rabbit.** Without the latch a rabbit below the
   *   threshold would bolt on every single hit, which is the version of this
   *   mechanic everyone has played and nobody likes.
   *
   * The bolt is deliberately NOT hop-gated: everything else this creature does
   * is a series of hops, and panic reading as one unbroken sprint is what
   * separates it from ordinary running.
   */
  panic: {
    /** Bolts when HP drops to or below this fraction of max (30 HP → 12). */
    hpFraction: 0.4,
    /** Flat-out sprint speed (px/s) — 3.3× chase, and above PLAYER.speed, so
     *  it genuinely opens a gap instead of being outrun on the spot. */
    boltSpeed: 230,
    /** How long the sprint lasts (ms) — a CAP, not the usual duration: whichever
     *  of this and `boltMaxGap` comes first ends it. */
    boltMs: 850,
    /**
     * The bolt also ends the moment the rabbit is this far from the player
     * (px), and that limit is the load-bearing half of the pair.
     *
     * ⚠ Time alone is not enough, because how far the bolt ENDS depends on how
     * far away it STARTED, and the frontal arc reaches anywhere from 0 to 80px
     * (PLAYER.attackRange + attackRadius). Measured on the time-only version: a
     * hit landed at 54px left the rabbit at 254px against a `deAggroRange` of
     * 260 — six pixels of margin. A hit landed at full reach would have pushed
     * it past 260, so the rabbit would flee itself straight out of the fight,
     * calm down, and wander home at 12 HP — turning the free window that is the
     * whole payoff into a walk across the meadow, and doing it or not depending
     * on exactly where the player happened to be standing.
     *
     * Kept a clear 60px inside `deAggroRange` so nudging either number does not
     * silently flip the behaviour.
     */
    boltMaxGap: 200,
    /** How long it then sits motionless (ms) — the free window. */
    freezeMs: 1300,
  },
} as const;

/**
 * Forest boar — the "graduation" enemy after rabbits. Tanky and heavy-hitting,
 * and instead of a plain chase it winds up and CHARGES: a telegraphed lunge
 * that commits to a direction (so it can be side-stepped), then a short
 * vulnerable recovery where it stands still and eats free hits. Placed deeper
 * in the eastern woods, farther out than the rabbit meadow (see the map's boar
 * spawns), so meeting one reads as a step up in danger.
 *
 * Shares RABBIT's stat shape (the Enemy base is config-driven) plus a `charge`
 * block the Boar subclass reads.
 */
/**
 * ⭐ **Modele 3D stworzeń** (2026-10-03, `OI-161`) — rodzaj wroga → plik `.glb`
 * i prędkość, z jaką klip lokomocji przesuwa racice po gruncie (j./s przy
 * tempie 1). Z tego `Creature3D` liczy tempo klipu do prędkości ciała, żeby
 * racice się nie ślizgały.
 * ⚠⚠ **Prędkość = krok / (udział podparcia × czas cyklu)** — łapa przesuwa się
 * po ziemi TYLKO w podporze. Do 2026-10-04 stało tu „krok / czas cyklu"
 * (zaniżone o 1/udział, czyli 1,6–3,3×), więc klipy grały za szybko i łapy
 * przebierały szybciej, niż jechało ciało.
 *
 * ⚠ Gatunek bez wpisu zostaje przy arkuszu 2D — tak samo, gdy plik się nie
 * wczyta (gra ZAWSZE się uruchamia).
 */
export type Model3DCfg = {
  sciezka: string;
  predkosciKlipow: Record<string, number>;
  /** Skala modelu w świecie (Szary „przerośnięty" = ten sam model ×1,3). */
  skala?: number;
  /** Bufor renderu [szer, wys] px — większy dla większego stworzenia. */
  bufor?: [number, number];
  /** Środek kadru nad gruntem (j.). */
  srodek?: number;
  /** Siła światła krawędziowego (rim) w widoku 3D — `Shared3D.dodajKrawedz`. */
  krawedz?: number;
  /** Stylizacja w widoku 3D: kontur (px gry), tony cieniowania, nasycenie
   *  — `Shared3D.stylizuj`. Brak = gładki materiał z pliku. */
  styl?: { kontur: number; tony: number; nasycenie?: number; kolorKonturu?: number; glebiaKonturu?: number };
  /** Model NIE przejmuje tintu hosta. ⚠ Mieszkaniec bez portretu 2D ma
   *  `tint` AWARYJNY na sprite'cie (np. Adrian 0x9a8f86) — przejęty przez
   *  model mnożył CAŁĄ postać ×~0,6 i Adrian w grze był prawie czarny
   *  (2026-10-10). Tint hosta jest dla telegrafów wrogów, nie dla NPC. */
  bezTintu?: boolean;
};
/**
 * ⭐ **DRZEWA 3D** (pilot 2026-10-05, `OI-164`) — w widoku 3D stempel drzewa
 * (`TreeLayer`) dostaje model z `tools/tree3d.py` zamiast billboardu.
 * Nazwa stempla `gatunek_rozmiar_…` → obiekt `gatunek_rozmiar` w `.glb`.
 * ⚠ Gatunek bez wpisu zostaje billboardem; plik, który się nie wczyta —
 * też (gra ZAWSZE się uruchamia). ⛔ Kolizja pnia się nie zmienia: pudełko
 * nadal idzie z manifestu stempli.
 */
export const DRZEWA_3D = {
  sciezka: "assets/trees/trees.glb",
  /** gatunek ze stempla → gatunek modelu (wszystkie siedem gatunków stempli lasu). */
  gatunki: {
    buk: "buk", swierk: "swierk", dab: "dab", grab: "grab",
    olcha: "olcha", brzoza: "brzoza", wierzba: "wierzba",
  } as Record<string, string>,
  /** `?drzewa3d=wszystkie`: liściaste BEZ modelu dostają ten (podgląd całego lasu w 3D). */
  zastepczyLisciasty: "buk",
  rozmiary: {
    duzy: "duzy", duza: "duzy", sredni: "sredni", srednia: "sredni",
    maly: "maly", mala: "maly", sadzonka: "maly",
  } as Record<string, string>,
  /** Mnożnik wysokości modelu (1 = jak w generatorze: duże 28 j. ≈ 2,2× gracza). */
  skala: 1.0,
  /** Rozrzut między egzemplarzami (±): skala, jasność, odcień (+ cieplej /
   *  − chłodniej), rozciągnięcie w szerz i w górę. ⚠ Przy 0,10 / 0,08 i samym
   *  obrocie las czytał się jak klony (autor 2026-10-05). */
  rozrzutSkali: 0.10,
  rozrzutJasnosci: 0.12,
  rozrzutOdcienia: 0.07,
  rozrzutSzerokosci: 0.12,
  rozrzutWysokosci: 0.08,
  /** Kołysanie: wychylenie szczytu (j.) i tempo (rad/s). */
  wiatr: { amplituda: 0.25, tempo: 1.2 },
  /** Cień-plamka: krycie, promień jako ułamek szerokości korony, przesunięcie
   *  od słońca (×promień; słońce stoi z zachodu, lekko z południa). */
  cien: { alfa: 0.34, promien: 0.46, przesuniecie: [0.22, -0.08] as [number, number] },
  /**
   * ⭐ Drzewa z KAFLI (Zagaje, Gęstwina — tileset `Nature`): lokalne id kafla
   * z DOLNEGO rzędu drzewa → wariant. Dolny rząd jednoznacznie wskazuje
   * gatunek i rozmiar; układ z `public/assets/README.md` („Katalog drzew",
   * „Katalog drzew owocowych"): duże w wierszu 4 (id 76–94), średnie 2×2
   * i małe 1×2 w wierszu 6 (114–128), owocowe od wiersza 9.
   * ⚠ Kafel spoza tabeli → drzewo zostaje billboardem.
   */
  kafleNature: {
    76: "dab_duzy", 77: "dab_duzy", 78: "dab_duzy",
    79: "dab_duzy", 80: "dab_duzy", 81: "dab_duzy",          // dąb rozwidlony
    82: "buk_duzy", 83: "buk_duzy", 84: "buk_duzy",
    85: "swierk_duzy", 86: "swierk_duzy", 87: "swierk_duzy", 88: "swierk_duzy",
    89: "brzoza_duzy", 90: "brzoza_duzy", 91: "brzoza_duzy", 92: "brzoza_duzy",
    93: "grab_duzy", 94: "grab_duzy",
    114: "dab_sredni", 115: "dab_sredni", 116: "swierk_sredni", 117: "swierk_sredni",
    118: "brzoza_sredni", 119: "brzoza_sredni", 120: "buk_sredni", 121: "buk_sredni",
    122: "grab_sredni", 123: "grab_sredni",
    124: "dab_maly", 125: "swierk_maly", 126: "brzoza_maly", 127: "buk_maly", 128: "grab_maly",
    171: "jablon_duzy", 172: "jablon_duzy",                  // jabłoń duża 2×3 (133)
    173: "sliwa_duzy", 174: "sliwa_duzy", 175: "sliwa_duzy", // śliwa duża 3×3 (135)
    195: "grusza_duzy", 196: "grusza_duzy", 197: "grusza_duzy", // grusza duża 3×4 (138)
    266: "jablon_duzy", 267: "jablon_duzy", 268: "jablon_duzy", 269: "jablon_duzy", // jabłoń duża(2) 4×4 (209)
    232: "jablon_sredni", 233: "jablon_sredni",              // 2×2 (213)
    235: "jablon_maly", 236: "jablon_maly",                  // 2×2 (216)
    219: "jablon_maly", 220: "jablon_maly",                  // młoda 2×1 (219)
    260: "sliwa_sredni", 261: "sliwa_sredni", 262: "sliwa_sredni", // 3×3 (222)
    244: "sliwa_maly", 245: "sliwa_maly",                    // 2×2 (225)
    323: "grusza_sredni", 324: "grusza_sredni",              // 2×3 (285)
    276: "grusza_maly", 277: "grusza_maly",                  // 2×2 (257)
  } as Record<number, string>,
};
/**
 * ⭐ **REKWIZYTY 3D** (2026-10-05, `OI-164`) — krzewy, kamienie i zioła
 * z `tools/props3d.py`. Rekwizyt `DECOR_PROPS` o nazwie z Tiled
 * `krzew_kopula_sredni` / `kamien_drobny_04` dostaje model `krzew_kopula_sredni`
 * / `kamien_drobny` (nazwa bez numeru); zioło `rumianek` → `ziolo_rumianek`.
 * ⚠ Rekwizyt bez modelu w pliku zostaje billboardem. Kolizje bez zmian.
 */
export const REKWIZYTY_3D = {
  sciezka: "assets/props/props3d.glb",
  /**
   * ⭐ Domy 3D (2026-10-09, `tools/houses3d.py`): jeden model na budynek, nazwany
   * obrysem zespołu kafli `dom-x0-y0-x1-y1` (y1 = wiersz kotwicy). Zespół bez
   * modelu pod swoją nazwą (mapa zmieniona w Tiled) zostaje billboardem.
   * Modele `dom-*` stoją bez rozrzutu, bez plamki cienia i NIE kołyszą się
   * na wietrze (osobny materiał).
   */
  sciezkaDomow: "assets/props/houses3d.glb",
  /** Mnożnik skali rekwizytów (1 = rozmiary z generatora, mierzone z atlasu). */
  skala: 1.0,
  /** Kwadrat grupowania instancji (px). ⚠ Przy 1024 jak drzewa: 37 kształtów
   *  po kilka sztuk na kwadrat = 675 grup (wywołań rysowania) na las. */
  kwadrat: 2048,
  /** Modele BEZ losowego obrotu (tylko drobny rozrzut): kłody leżą tak, jak je
   *  ułożono w Tiled, a ścięte końce stosów i stelaż skóry patrzą w kamerę. */
  bezObrotu: ["dluzyca_pozioma", "dluzyca_pionowa", "stos_maly", "stos_duzy", "suszona_skora",
    "strach", "ul_a", "ul_b", "ul_c", "chmiel", "lawka", "koryto", "plot", "plot_koniec",
    "piec", "kowadlo", "oselka", "miech", "stojak_narzedzi", "stojak_broni", "worek_wegla", "stol_imadlo",
    "studnia", "kolo_mlynskie", "mlynowka"],
  /** Bez ŻADNEGO rozrzutu (skala, rozciągnięcie, obrót): segment płotu = dokładnie
   *  kafel, inaczej sąsiednie segmenty rozjeżdżały się szparami. */
  dokladne: ["plot", "plot_koniec", "kolo_mlynskie", "mlynowka", "zboze_dojrzale", "zboze_zielone", "sciernisko", "len", "nac_gesta", "nac_niska",
    "nac_cebulowa", "kapusta_dojrzala", "kapusta_mloda", "kapusta_sadzonka"],
  /**
   * ⭐ Rekwizyty z kafli `Buildings` (wieś; płot także przy bramie lasu) →
   * [model, przesunięcie x w kaflach od lewej krawędzi, podniesienie podstawy
   * od dołu kafla w px]. Id z `docs/budynki.json`. Model `""` = kafel jest
   * częścią rekwizytu sąsiada (prawa połowa ławki) — znika razem z nim.
   */
  kafleBuildings: {
    136: ["beczka", 0.5, 4], 133: ["lawka", 1.0, 4], 134: ["", 0, 0], 104: ["koryto", 0.5, 4],
    88: ["plot", 0.5, 8], 89: ["plot", 0.5, 8], 90: ["plot_koniec", 0.5, 8],
  } as Record<number, [string, number, number]>,
  /**
   * ⭐ Sprzęt kuźni z kafli `Kuznia` (2026-10-09; Zagaje, warstwa `wyposazenie`)
   * — ten sam układ co `kafleBuildings`. Id z `docs/kuznia.json`. Piec 2×2:
   * model na lewym dolnym kaflu, przesunięty o kafel w prawo (środek pieca),
   * pozostałe trzy ćwiartki znikają razem z nim — dla każdego z trzech stanów.
   */
  kafleKuznia: {
    ...Object.fromEntries([0, 2, 4].flatMap((c) => [
      [19 + c, ["piec", 1.0, 4]], [20 + c, ["", 0, 0]], [c, ["", 0, 0]], [c + 1, ["", 0, 0]],
    ])),
    25: ["kowadlo", 0.5, 4], 26: ["kowadlo", 0.5, 4], 27: ["oselka", 0.5, 4], 28: ["oselka", 0.5, 4],
    29: ["miech", 0.5, 4], 30: ["stojak_narzedzi", 0.5, 4], 31: ["stojak_broni", 0.5, 4],
    32: ["worek_wegla", 0.5, 4], 39: ["stol_imadlo", 1.0, 4], 40: ["", 0, 0],
  } as Record<number, [string, number, number]>,
  /** Rekwizyty, które LEŻĄ na gruncie (namalowana łacha piasku) — obrazek kładziony
   *  płasko zamiast billboardu. ⚠ Stojący billboard brzegu stawu sterczał z wody. */
  plaskie: ["brzeg_stawu"],
  /**
   * ⭐ Kafle `Nature` z warstw `undergrowth` / `bushes` (las i wieś) → model
   * i skala. Wiersz 0 (id 0–18) to kępki trawy malejące w prawo, wiersz 1
   * (id 19–26) krzaczki w pięciu wielkościach (`public/assets/README.md`,
   * „Układ Nature.png"). Do 2026-10-06 leżały wypalone PŁASKO w gruncie obok
   * brył 3D — autor: „blend drzew 2d i 3d".
   */
  kafleNiskie: Object.fromEntries([
    ...Array.from({ length: 19 }, (_, id) => [id, ["kepka_trawy", id < 6 ? 1.0 : id < 13 ? 0.8 : 0.6]]),
    [19, ["krzew_kopula_maly", 0.32]], [20, ["krzew_kopula_maly", 0.42]], [21, ["krzew_kopula_maly", 0.48]],
    [22, ["krzew_kopula_maly", 0.58]], [23, ["krzew_kopula_maly", 0.68]], [24, ["krzew_kopula_maly", 0.45]],
    [25, ["krzew_kopula_maly", 0.55]], [26, ["krzew_kopula_maly", 0.62]],
  ]) as Record<number, [string, number]>,
  /**
   * ⭐ Uprawy z kafli `Pole` w warstwie `uprawy` (2026-10-09; Zagaje) → model
   * i skala, jak `kafleNiskie`. Jeden model = jeden kafel, środek w środku kafla,
   * bez rozrzutu (`dokladne`). Id z `docs/pole.json` (kategoria/podtyp); pod
   * każdym kaflem upraw leży ziemia z warstwy `pola`, więc po zgaszeniu płaskich
   * upraw zostaje zaorana niwa. Kiełki (`pedy`) i korzeniowe — bez modelu.
   */
  kafleUprawy: Object.fromEntries([
    ...[60, 61, 62, 63, 64, 78, 79, 80].map((id) => [id, ["zboze_dojrzale", 1]]),
    ...[67, 68, 69, 81, 82].map((id) => [id, ["zboze_zielone", 1]]),
    ...[71, 88].map((id) => [id, ["sciernisko", 1]]),
    ...[90, 91, 92, 93, 94].map((id) => [id, ["len", 1]]),
    ...[95, 96, 97, 101, 102, 104, 105, 106, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150]
      .map((id) => [id, ["nac_gesta", 1]]),
    ...[112, 113, 114, 115, 120].map((id) => [id, ["nac_cebulowa", 1]]),
    ...[116, 117, 118, 119].map((id) => [id, ["nac_niska", 1]]),
    ...[56, 57, 58, 59, 75, 76, 77].map((id) => [id, ["kapusta_dojrzala", 1]]),
    ...[73, 74].map((id) => [id, ["kapusta_mloda", 1]]),
    ...[54, 55, 72].map((id) => [id, ["kapusta_sadzonka", 1]]),
  ]) as Record<number, [string, number]>,
  /**
   * ⭐ Rekwizyty RUCHOME (2026-10-09; encje rejestrowane w `PropInstances`):
   * koło młyńskie obraca się wokół osi (model ma środek NA OSI; `uniesienie` —
   * oś nad punktem zaczepienia, j.; tempo z `WATERWHEEL.revolutionMs`). ⚠ Oś
   * biegnie wzdłuż X — w zachodnią ścianę młyna (2026-10-14); `uniesienie` to ta
   * sama liczba co `KOLO_OS_Z` w `tools/props3d.py` (rynna stoi pod nią). Płomień
   * ogniska migocze skalą (`migotanie` — amplituda wysokości).
   */
  animacje: {
    /** ⚠ `skretDeg` = `KOLO_SKRET` w `tools/props3d.py`: model koła i jego
     *  zabudowy jest skręcony o tyle wokół pionu (lico widać z kamery), więc
     *  oś obrotu też. */
    kolo_mlynskie: { uniesienie: 8.5, skretDeg: 25 },
    ogien: { migotanie: 0.16 },
  },
  /** Bez oświetlenia — kolor wprost (płomień). */
  swiecace: ["ogien"],
  /** Nieruchome konstrukcje bez kołysania na wietrze (jak domy): rynna
   *  i komora koła młyńskiego (`tools/props3d.py` „mlynowka”). */
  sztywne: ["mlynowka"],
  /** Modele bez okrągłego cienia pod spodem — kępki i uprawy (gęsto, setki sztuk). */
  bezCienia: ["kolo_mlynskie", "mlynowka", "ogien", "kepka_trawy", "zboze_dojrzale", "zboze_zielone", "sciernisko", "len", "nac_gesta", "nac_niska",
    "nac_cebulowa", "kapusta_dojrzala", "kapusta_mloda", "kapusta_sadzonka"],
  /** Zioła: mnożnik skali i poświata przy graczu (siła emisji, okres w ms). */
  skalaZiol: 1.25,
  poswiata: { min: 0.12, max: 0.42, okresMs: 900 },
};
/**
 * ⭐ **GRUNT 3D W OKNIE** (2026-10-09, etap 1 kawałków 64×64 — otwarty świat
 * z `.world`): płaty gruntu 1024 px pieczone wokół kadru i zwalniane za nim
 * (`WorldView3D.oknoGruntu`). `zapasPx` — ile poza kadrem płaty mają być już
 * gotowe (dochodzą po jednym na klatkę); `zwolnijPx` — od jakiej odległości
 * za kadrem są zwalniane (większa niż zapas: bez migotania na granicy).
 */
/**
 * ⭐ **ODLEGŁOŚĆ KAMERY W WIDOKU 3D** (decyzja autora 2026-10-09).
 *
 * Mnożnik przybliżenia nakładany na zoom z `GameScene.applyZoom`. Przy 1,0
 * postać zajmowała ~17% wysokości ekranu S21 FE (zrzut z gry) — bliżej niż
 * mobilne ARPG/MOBA, do których autor się odnosi (szacunek: Wild Rift
 * ~9–11%, Diablo Immortal / Metin ~12–15%), więc mało świata i mało pola
 * w walce ze sforą. **0,8 → ~13–14%.** Pod tę skalę stroimy detal postaci
 * 3D (pilot: Ojciec; `docs/postac3d_checkpoint.md`, `docs/kreator_postaci.md`).
 *
 * ⚠ Zoom ułamkowy jest tu dozwolony: w 3D świat to tekstury na płaszczyznach
 * i modele, reguła całkowitego zoomu (`CAMERA`) dotyczy pikseli 2D.
 * ⏳ Pomiar na telefonie (FPS przy szerszym kadrze, czytelność) — `OI-169`.
 * Dev: `dev.widok3d.zoom(m)` zmienia ten mnożnik na żywo.
 */
export const KAMERA_3D = {
  przyblizenie: 0.8,
} as const;

export const GRUNT_3D = {
  zapasPx: 640,
  zwolnijPx: 1600,
  /** Rozmiar kawałka świata w kaflach — jednostka doczytywania (RuneScape: 64). */
  kawalekKafli: 64,
};
/**
 * ⭐ **PROMIEŃ AKTYWNOŚCI STWORZEŃ** (2026-10-09, etap 1 kawałków): wróg dalej
 * niż `promienPx` od gracza i NIE goniący go śpi — bez AI, bez ruchu; model 3D
 * dalej niż tyle od środka kadru nie odgrywa animacji i nie jest rysowany.
 * ⚠ Musi być WIĘKSZY niż każdy `aggroRange`/`deAggroRange` i zasięg wołania
 * watahy (dziś max 230 / 420 / 200 px) — uśpiony wróg nie może przegapić gracza,
 * którego by zauważył. Efekty czasowe (krwawienie) tykają mimo snu.
 */
export const AKTYWNOSC_STWORZEN = {
  promienPx: 1200,
};
/**
 * ⭐ **ZASŁONY w widoku 3D** (2026-10-05) — co robi obiekt stojący MIĘDZY
 * kamerą a graczem. Blednie CAŁY i płynnie, ale tylko wtedy, gdy naprawdę
 * zasłania tułów gracza (liczone z wysokości bryły i kąta kamery).
 * ⚠ Do tej daty był to stały okrąg szachownicy 46 px wokół gracza na
 * wszystkim, co stało bliżej kamery — autor z gry: „ten blur wokół postaci
 * w kształcie stałego okręgu psuje imersję". Łapał też krzaki i zioła,
 * które nikogo nie zasłaniają.
 */
export const ZASLONY_3D = {
  /** Krycie zasłaniającego obiektu w pełnym zaniku (1 = bez zmian). */
  krycie: 0.38,
  /** Czas wejścia/wyjścia zaniku (ms). */
  czasMs: 150,
  /** Wysokość punktu, który ma być widać — tułów (× wzrost gracza). */
  tulow: 0.5,
  /** Obiekt niższy niż to (× wzrost gracza) nie blednie nigdy — krzak, kamień, zioło. */
  minWysokosc: 0.9,
  /** Zapas w poziomie (px świata) wokół sylwetki gracza. */
  marginesPx: 10,
  /** Jak głęboko (px) obiekt musi wejść na tułów, żeby się liczyć jako zasłona. */
  zapasPx: 14,
};
/**
 * ⭐ **WODA w widoku 3D** (2026-10-05, `OI-164` — „woda statyczna"): warstwy
 * `water*` dostają własną płaszczyznę z shaderem — falowanie (przesunięcie
 * próbki pixel-artu) i refleksy na grzbietach dwóch krzyżujących się fal.
 */
export const WODA_3D = {
  /** Amplituda falowania w pikselach tekstury. */
  falowaniePx: 1.2,
  /** Od jakiej wysokości fali (0…1) zaczyna się refleks — wyżej = rzadsze. */
  progRefleksu: 0.80,
  /** Jasność refleksu (dodawana do koloru, liniowo). */
  jasnoscRefleksu: 0.14,
};
/**
 * ⭐ STYL POSTACI 3D (2026-10-10) — kontur + 3 tony + mocniejsza barwa: to,
 * czym pixel-art wygrywał czytelność z kamery z góry (`Shared3D.stylizuj`).
 * JEDEN dla gracza i mieszkańców — gładki gracz obok obrysowanej wsi czytał
 * się jak dwie różne gry.
 */
// `glebiaKonturu` (px gry, od kamery): obrys warstwy pod ubraniem chowa się za nim
// ⚠ `kontur: 0` (2026-10-10, autor: „na co nam ten obrys? gubi się na dłoniach").
//   Odsunięty w głąb (żeby nie przebijał przez ubranie) znikał wszędzie, gdzie
//   coś leży przed tułowiem — niekonsekwentny obrys jest gorszy niż żaden.
export const STYL_POSTACI = { kontur: 0, tony: 3, nasycenie: 1.2, glebiaKonturu: 3 };
/**
 * ⭐ **MIESZKAŃCY 3D** (2026-10-09, pilot: Ojciec) — NPC jako preset bazy
 * postaci (`tools/npc3d.py`, `docs/kreator_postaci.md`). Model rysuje
 * `Creature3D`, logika rozmowy zostaje przy encji (`Merchant`). NPC bez wpisu
 * zostaje pixel-artem. Klip `Idle` (stanie z oddechem i postawą mieszkańca).
 */
export const NPC_3D = {
  /** Gracz bliżej niż tyle px — NPC odwraca się ku niemu (dalej: przodem do kamery). */
  zwrotPx: 140,
  /** Wzrost modelu w jednostkach PLIKU `.glb` — do napisów nad głową.
   *  ⚠ Nie 13,99 j. z Blendera: armatura ma skalę 1,6527 (nienaruszalna),
   *  w glTF figura ma ~8,5 j. (13,99 / 1,6527). Zmierzone na renderze z gry.
   *  ⚠ 8,5 → 7,8 (2026-10-09): mieszkańcy mają proporcje DOROSŁE — głowa nie
   *  jest już uniesiona (czubek na 1,0 wzrostu zamiast 1,09). */
  // 7,8 → 8,15 (2026-10-10): styl `czytelny` unosi głowę o 0,046 wzrostu
  wysokoscJ: 8.15,
  /** ⭐ Wszyscy mieszkańcy z presetów (2026-10-10, `char3d_variants`).
   *  `skala` = wzrost osobnika (Kowal niski, Zofia i Anna wysokie) — ta sama
   *  liczba co `skala` presetu w `tools/npc3d.py`; napisy idą za nią. */
  modele: Object.fromEntries(
    ([
      // wzrost z realnych wzorów (baza = 185 cm): Ojciec 188, Mama 170, Patryczek 180
      ["father", 1.016], ["mother", 0.92], ["elder", 1], ["peasant", 1], ["miller", 1],
      ["herbalist", 1], ["widow", 1.04], ["hanna", 1], ["witek", 1], ["kuba", 1],
      ["sulislaw", 1], ["agata", 1], ["dobrawa", 1], ["sobek", 1], ["gniewko", 1],
      ["anna", 1.04], ["patryczek", 0.973], ["hunter", 1], ["blacksmith", 0.95],
      ["adrian", 0.989], ["innkeeper", 1],
      // drwale (K5, 2026-10-10) — `skala` = ta sama liczba co w presecie `tools/npc3d.py`
      ["ciechan", 1], ["bolko", 1.01], ["zbych", 0.99],
    ] as const).map(([id, skala]): [string, Model3DCfg] => [id, {
      sciezka: `assets/characters/npc_${id}.glb`, predkosciKlipow: {}, krawedz: 0.18,
      styl: STYL_POSTACI, bezTintu: true,
      ...(skala !== 1 ? { skala } : {}),
    }]),
  ) as Record<string, Model3DCfg>,
};

export const MODELE_3D: Record<string, Model3DCfg> = {
  // ── zwierzęta wsi (`tools/farm3d.py`, 2026-10-09) — prędkość klipu Walk =
  //    krok / (podparcie × cykl): przeżuwacze z jelenia (krok 2,6 × skala nóg,
  //    0,62 · 1,0 s), świnia z dzika, kot z lisa, kura własny chód.
  cow: { sciezka: "assets/animals/cow.glb", predkosciKlipow: { Walk: 3.9 }, bufor: [192, 144], srodek: 5.0 },
  bull: { sciezka: "assets/animals/bull.glb", predkosciKlipow: { Walk: 4.0 }, bufor: [192, 144], srodek: 5.2 },
  sheep: { sciezka: "assets/animals/sheep.glb", predkosciKlipow: { Walk: 2.35 }, srodek: 3.0 },
  ram: { sciezka: "assets/animals/ram.glb", predkosciKlipow: { Walk: 2.35 }, srodek: 3.2 },
  pig: { sciezka: "assets/animals/pig.glb", predkosciKlipow: { Walk: 3.6 } },
  // Kot i kura w skali naturalnej (~0,26 / ~0,40 m) — powiększone jak lis,
  // inaczej mają kilkanaście pikseli.
  chicken: { sciezka: "assets/animals/chicken.glb", predkosciKlipow: { Walk: 1.4 }, skala: 1.5, srodek: 1.6 },
  cat_black: { sciezka: "assets/animals/cat_black.glb", predkosciKlipow: { Walk: 2.15 }, skala: 1.4, srodek: 1.4 },
  cat_brown: { sciezka: "assets/animals/cat_brown.glb", predkosciKlipow: { Walk: 2.15 }, skala: 1.4, srodek: 1.4 },
  cat_orange: { sciezka: "assets/animals/cat_orange.glb", predkosciKlipow: { Walk: 2.15 }, skala: 1.4, srodek: 1.4 },
  cat_white: { sciezka: "assets/animals/cat_white.glb", predkosciKlipow: { Walk: 2.15 }, skala: 1.4, srodek: 1.4 },
  // Psy (2026-10-11) — model wilka w innej maści. Prędkość klipu Walk jak u wilka × skala.
  // ⚠ Skala 0,7 (wierna: pies ~0,55 m wobec 0,80 m wilka) dawała psa wielkości kota —
  //   z kamery czytał się jak lis. Małe zwierzęta są tu świadomie powiększone (kot ×1,4).
  dog: { sciezka: "assets/animals/dog.glb", predkosciKlipow: { Walk: 3.0 }, skala: 0.9, srodek: 2.6 },
  sheepdog: { sciezka: "assets/animals/sheepdog.glb", predkosciKlipow: { Walk: 3.1 }, skala: 0.95, srodek: 2.8 },
  // ⭐ Manekin treningowy (2026-10-11, `tools/dummy3d.py`): klipy `Idle`
  // i `Hit` jako animacja OBIEKTU, bez szkieletu; wzrost 13,9 j. w świecie
  // (człowiek po skali armatury 1,6527 — patrz nagłówek generatora).
  // ⭐ Bandyci (2026-10-11, `OI-171`): `tools/npc3d.py` tryb wroga — preset
  //   mieszkańca + broń + klipy Idle/Walk/Run/Attack. Styl jak mieszkańcy
  //   (ludzie), ale BEZ `bezTintu`: telegraf zamachu jest tintem.
  ...Object.fromEntries((["bandit_club", "bandit_axe", "bandit_chief"] as const).map((id): [string, Model3DCfg] => [id, {
    sciezka: `assets/characters/enemy_${id}.glb`, predkosciKlipow: {}, krawedz: 0.18, styl: STYL_POSTACI,
    ...(id === "bandit_chief" ? { skala: 1.05 } : {}),
  }])),
  training_dummy: {
    sciezka: "assets/props/training_dummy.glb",
    predkosciKlipow: {},
    bufor: [128, 192],
    srodek: 7.0,
  },
  boar: {
    sciezka: "assets/animals/boar.glb",
    // `tools/boar3d.py`: stępa 2,3/(0,64·1,0 s), kłus 2,6/(0,45·0,67), galop 2,9/(0,38·0,5)
    predkosciKlipow: { Walk: 3.6, Trot: 8.7, Run: 15.3, Charge: 15.3 },
  },
  // `tools/spider3d.py`: chód 1,2/(0,55·0,67 s), bieg 1,6/(0,50·0,42).
  spider: {
    sciezka: "assets/animals/spider.glb",
    predkosciKlipow: { Walk: 3.3, Run: 7.7 },
    srodek: 2.2,
  },
  // Skoczek mniejszy od sieciarza — jak placeholder 2D (scale 1,5 wobec 1,7).
  venomspider: {
    sciezka: "assets/animals/venomspider.glb",
    predkosciKlipow: { Walk: 3.3, Run: 7.7 },
    skala: 0.85,
    srodek: 2.0,
  },
  // `tools/deer3d.py`: stępa 2,6/(0,62·1,0 s), kłus 3,0/(0,45·0,58 s), galop
  // 3,6/(0,32·0,42 s). Bufor WYSOKI: poroże sięga 13,6 j. (łeb 10,3 j.).
  deer: {
    sciezka: "assets/animals/deer.glb",
    predkosciKlipow: { Walk: 4.2, Trot: 11.4, Run: 27.0 },
    bufor: [176, 144],
    srodek: 6.6,
  },
  // `tools/fox3d.py`: stępa 1,3/(0,60·0,67 s), kłus 1,5/(0,45·0,42 s), galop
  // 1,5/(0,30·0,33 s). Model w skali naturalnej (0,40 m w kłębie) — `skala`
  // 1,25 jak przy króliku: inaczej lis ma kilkanaście pikseli wysokości.
  // Ucieczka 200 px/s daje tempo galopu ~2,1 (sufit 2,5).
  fox: {
    sciezka: "assets/animals/fox.glb",
    predkosciKlipow: { Walk: 3.25, Trot: 8.0, Run: 15.0 },
    skala: 1.25,
    srodek: 2.2,
  },
  // `tools/bear3d.py`: krok/(podparcie·cykl) — stępa 2,9/(0,62·1,0 s),
  // kłus 3,2/(0,45·0,67 s), galop 3,4/(0,40·0,58 s). Bufor większy: 12,4 j.
  // długości, a wspięcie podnosi łeb ponad 10 j.
  bear: {
    sciezka: "assets/animals/bear.glb",
    predkosciKlipow: { Walk: 4.7, Trot: 10.7, Run: 14.6 },
    bufor: [160, 128],
    srodek: 5.0,
  },
  // `tools/rabbit3d.py` — tempo skoku podaje `Rabbit.stan3d()` z cyklu skoku,
  // nie z prędkości (ciało stoi w przerwie między skokami).
  rabbit: {
    sciezka: "assets/animals/rabbit.glb",
    predkosciKlipow: {},
    srodek: 1.6,
  },
  // `tools/wolf3d.py`: stępa 2,0/(0,60·1,0 s), kłus 2,4/(0,45·0,58), bieg 2,8/(0,30·0,5).
  wolf: {
    sciezka: "assets/animals/wolf.glb",
    predkosciKlipow: { Walk: 3.3, Trot: 9.1, Run: 18.7 },
  },
  // ⚠ Szary w 2D ma WŁASNY arkusz (`greywolf.png`), w 3D jest tym samym
  // szkieletem — tożsamość robi bledsza rampa i rozmiar.
  greywolf: {
    sciezka: "assets/animals/greywolf.glb",
    predkosciKlipow: { Walk: 3.3, Trot: 9.1, Run: 18.7 },
    skala: 1.3,
    bufor: [160, 112],
    srodek: 3.9,
  },
};

export const BOAR = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * Jeden ruch ćwiczony całe życie, ale COMMIT BEZ KOREKTY: raz wypuszczonej
   *  szarży nie da się poprawić. Pusta szarża to whiff GEOMETRII (warstwa 1),
   *  nie fuszerka — dlatego szarża nie dostaje Execution Missa.
   */
  proficiency: 48,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Dzik — najlepszy nauczyciel wczesnej drogi `0 → 45`, i to dzięki DŁUGIEJ
   *  walce, nie dzięki `P` (§16). */
  teachingRole: true,
  /**
   * Omijanie przeszkód. Dzik jest dziś **jedynym** gatunkiem, który je ma —
   * reszta rosteru jedzie `"direct"`.
   *
   * ⚠ **Włączone i ZOSTAJE (decyzja autora 2026-08-28), mimo że NIE naprawiło
   * przypadku, dla którego je włączono.** To rozróżnienie jest całą treścią
   * tego komentarza: `Steer` jest docelowym solverem lokalnego omijania (także
   * dla przyszłych NPC-ów), a przypadek dzika okazał się problemem GEOMETRII
   * LASU, nie solvera. Skasowanie tej linii dlatego, że „test wyszedł na nie",
   * byłoby wnioskiem z niewłaściwej przesłanki.
   *
   * ⚠ **Czego się po niej NIE spodziewać w gęstym lesie.** Sonda pyta, czy
   * w punkcie wyprzedzenia zmieści się CAŁE ciało — u dzika **46 px realnych**.
   * Bramy między pniami mają 18 albo 33 px, więc cały wachlarz odchyleń wypada
   * zajęty, a `steer()` oddaje wtedy wektor pierwotny (patrz jego ostatnia
   * linia). **W ciasnym terenie `Steer` degraduje się do `Direct` z definicji.**
   * Zweryfikowane w grze 2026-08-28: dzik dalej klinuje się w tym samym
   * miejscu. Wyprzedzenie dokłada się do obrazu — `max(14 px, prędkość × 0,28 s)`
   * przy `chaseSpeed` daje ~15 px, czyli sonda patrzy bliżej, niż samo ciało
   * jest szerokie.
   *
   * ⚠ **Nie strojone pod ten przypadek** (decyzja autora): `MOVEMENT.steer` są
   * gałkami WSPÓLNYMI dla wszystkich, a `commitPx` 40 zostaje nietknięte.
   * Zmiana tych liczb pod jedno miejsce na mapie byłaby strojeniem solvera pod
   * usterkę geometrii.
   *
   * ⚠ Szarży i postojów to nie dotyczy: `impulse` i `hold` omijają solver
   * z definicji (`src/core/movement/MoveIntent.ts`). Zmienia się wyłącznie
   * pościg (`seek` w `updateChase`).
   */
  solver: "steer" as SolverKind,
  hp: 95,
  xpReward: 70,
  /** Ordinary contact damage — just walking into you, outside a charge. */
  touchDamageMin: 8,
  touchDamageMax: 12,
  touchDamageCooldown: 1.1,
  /**
   * `blunt`, tak samo jak szarża — jeden zwierz, jeden sposób ranienia.
   *
   * ⚠ **To nie jest kanał poboczny.** Zmierzone (T6, gracz stojący 150 px, 15 s):
   * zwykły kontakt zadał **130 obrażeń w 13 tickach**, szarża **111 w 6
   * trafieniach**. Kontakt to **54% surowych obrażeń dzika** — otypowanie samej
   * szarży zostawiłoby WIĘKSZOŚĆ jego wyjścia poza systemem, a gracz dostawałby
   * raz obuchowe, raz nieokreślone, zależnie od tego, którą gałęzią kodu
   * przyszło trafienie.
   */
  touchDamageType: "blunt" as DamageType | null,
  /** A lumbering amble and a deliberately slow non-charge chase — the charge is
   *  the real threat, so plain chasing must be escapable on foot. */
  patrolSpeed: 22,
  chaseSpeed: 52,
  aggroRange: 175,
  deAggroRange: 340,
  patrolRadius: 56,
  respawnDelay: 16,
  respawnJitter: 6,
  respawnSafeRadius: 110,
  /**
   * ⚠ **JEDYNY opancerzony przeciwnik w grze, i to jest decyzja projektowa, nie
   * etap prac.** Gruba skóra, sadło i szczecina: cięcie się ślizga, a włócznia
   * jest historyczną odpowiedzią na dzika — więc `pierce` przechodzi najlepiej
   * (83% obrażeń), `blunt` średnio (74%), `slash` najgorzej (69%).
   *
   * Nie dodawaj pancerza reszcie rosteru tylko dlatego, że system istnieje.
   * Królik, wilk i Szary zostają bez ochrony celowo: gdyby każdy mob miał
   * tabelkę odporności, wybór wariantu przestałby być decyzją, a stałby się
   * podatkiem płaconym przed każdym ciosem. Jeden opancerzony na pięciu.
   *
   * Szary nie dostaje pancerza mimo statusu elity — ma już 190 HP, a dokładanie
   * drugiej ściany zamieniłoby pojedynek w gąbkę.
   *
   * ⚠ Pająk też nie, choć chityna aż się prosi: `metal` jest MATERIAŁEM, a nie
   * abstrakcyjną klasą „sztywny pancerz". Wpisanie mu `metal` zmieszałoby
   * kategorię mechaniczną z materiałem i trzeba by to potem odkręcać. Chityna
   * czeka na własny, trzeci typ ochrony — `docs/odlozone.md`.
   */
  armor: { type: "leather", points: 22 },
  /** Rendered scale for the boar sprite (each frame is 28×28 px). */
  scale: 2.1,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: zmierzone (`tools/combat_geometry.mjs`, sekcja A).

   */
  hurt: { length: 25.5, depth: 19 },

  bodyWidth: 22,
  bodyHeight: 15,
  /** The charge attack. */
  charge: {
    /**
     * Zaczyna zamach, gdy gracz jest bliżej niż tyle (px, dystans środków).
     *
     * ⚠ **190 → 175 w Fazie 1B (2026-08-23), żeby domknąć niezmiennik:**
     *
     * > Atak rozpoczęty na MAKSYMALNYM legalnym dystansie wyzwolenia musi móc
     * > dosięgnąć NIERUCHOMEGO celu.
     *
     * Przy 190 nie mógł: szarża ma `300 px/s × 420 ms = 126 px` drogi, a do
     * trafienia (`hitReach` 20 prześwitu ≈ 58 px między środkami) trzeba było
     * przebyć 132. **Brakowało 6 px — zawsze, także przeciw graczowi stojącemu
     * bez ruchu.** Gracz widział wielki telegraf, słyszał pomruk, stał, i dzik
     * nie dolatywał. To nie jest balans, tylko **złamana obietnica mechaniki**.
     *
     * Wada była starsza niż Combat v2 — wcześniej maskowały ją obrażenia od
     * kontaktu (dzik dochodził i tykał). Po ich wyłączeniu została goła.
     *
     * ⚠ Maksimum wynosi dziś **184**; 175 zostawia 9 px zapasu. **Podniesienie
     * tej liczby albo skrócenie szarży ponownie złamie niezmiennik** — pilnuje
     * tego sekcja F w `tools/combat_geometry.mjs`, jako BŁĄD, nie uwaga.
     */
    triggerRange: 175,
    /** Wind-up hold before the lunge (ms) — the window to read it and dodge. */
    telegraphMs: 560,
    /** Lunge speed (px/s), much faster than the chase. */
    speed: 300,
    /** Max lunge duration (ms) if it never connects or hits terrain. */
    durationMs: 420,
    /**
     * ⚠ **Zasięg, na którym szarża TRAFIA i się kończy (px).**
     *
     * Do 2026-08-23 nie istniał: impakt padał przez **nakładanie CIAŁ**
     * (`Boar.tryTouchDamage`, gałąź `lunge`), więc dzik musiał wjechać ~7 px w
     * sylwetkę gracza. Teraz tor jest sprawdzany CO KLATKĘ — przy 300 px/s i
     * 60 fps to test co 5 px, czyli w praktyce kapsuła zamiatana wzdłuż toru.
     *
     * Nieco większy niż `gore.range` (56), żeby szarża rozstrzygała się PRZED
     * zatrzymaniem na dystansie ciosu — inaczej dzik hamowałby, a dopiero potem
     * uznawał trafienie.
     */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    hitReach: 20,
    /**
     * ⚠ **Był tu `minRange: 96` i został USUNIĘTY tego samego dnia, w którym
     * powstał.** Miał nie dopuszczać rozbiegu z 30 px, ale symulacja pokazała,
     * że robi coś znacznie gorszego: w zwarciu (gracz stoi i bije, dystans
     * 56–80 px) dzik przestawałby szarżować **w ogóle**, czyli tracił swoją
     * jedyną charakterystyczną mechanikę dokładnie wtedy, gdy walka trwa.
     *
     * Model, który został: **szarża jest podstawowa, kieł wypełnia jej
     * cooldown** — czyli dokładnie ta rola, którą wcześniej pełnił kontakt.
     */
    /** Cooldown between charges (ms). */
    cooldownMs: 2200,
    /** Vulnerable stand after a lunge (ms) — the punish window. */
    recoverMs: 750,
    /** Heavy impact damage when the lunge connects. */
    damageMin: 16,
    damageMax: 24,
    /**
     * `blunt` — **z mechaniki, nie z kła.** W kodzie nie ma żadnego hitboxu
     * kła: `enterLunge` ustawia velocity 300 px/s w jednym kierunku, obrażenia
     * padają w momencie nachodzenia ciał i **natychmiast kończą wypad**
     * (`enterRecover`). To jest zderzenie masy, czyli dokładnie to, co opisuje
     * obuch; `pierce` opisywałby atak, którego tu nie ma.
     *
     * ⚠ Typ dotyczy **momentu trafienia**, nie faz. `telegraph`/`lunge` nie
     * zadają obrażeń, więc nie mają czego nieść — i dlatego NIE kopiujemy tu
     * machinerii `pendingSwing` z broni gracza. Ona istnieje, bo gracz może
     * zmienić wariant w locie; dzik nie ma wariantów, nie ma czego zamrażać.
     *
     * ⚠ **Była tu opisana anomalia balansowa — NAPRAWIONA 2026-08-17.**
     * Przy starym `ARMOR_PROFILE.metal.blunt = 0,40` pełna stal dawała
     * przeciw dzikowi 31,3% redukcji, o 1,1 pkt proc. więcej niż pełna skóra
     * (30,2%) za czterokrotnie droższy komplet — błąd zaokrąglenia, nie
     * czytelna kontrgra. Po podniesieniu do 0,50 (patrz komentarz przy
     * `ARMOR_PROFILE.metal`) jest to **36,3% vs 30,2%**, różnica którą da się
     * odczuć. Nie zmieniać tu — strojenie zostaje w `metal`.
     */
    damageType: "blunt" as DamageType | null,
  },
  /**
   * **Cios kłem z bliska (2026-08-23).**
   *
   * ⚠ **Nie jest to nowa broń, tylko przeniesienie starej.** Do dziś dzik na
   * bliskim dystansie po prostu **wchodził w gracza** i tykał obrażeniami od
   * kontaktu — a config notuje, że to było **54% jego surowego wyjścia**, nie
   * kanał poboczny. Samo wyłączenie kontaktu (konieczne, bo wymagał zanurzenia
   * w sylwetce) obcięłoby dzikowi połowę obrażeń. `gore` te obrażenia oddaje,
   * tyle że z własnym testem zasięgu i z dystansem, na którym zwierzę STOI.
   *
   * Obrażenia biorą `touchDamageMin/Max/Type` — te same liczby co dotąd. Dla
   * dzika przestały opisywać kontakt i opisują teraz cios kłem.
   *
   * Rytm walki po zmianie: **daleko szarża, blisko kieł.**
   */
  gore: {
    /**
     * Podchodzi na tyle i staje.
     *
     * ⚠ 56 to najmniejsza wartość, przy której sylwetki nie nachodzą Z ŻADNEJ
     * strony — gracz jest wysoki (60 px) i wąski (22 px), więc jeden okrągły
     * próg daje różny prześwit zależnie od kierunku (poziomo 15,8 px, pionowo
     * 2,9 px). Ta sama anizotropia co u wilka i ta sama naprawa u źródła:
     * Faza 1B, prześwit między hurtboxami.
     */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    range: 18,
    /** Sprawdzany PONOWNIE w chwili rozstrzygnięcia — cofnij się, a chybi.
     *  Musi przekraczać `range`, inaczej wynik zapada w chwili zamachu. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    reach: 32,
    /**
     * Zamach. Krótszy niż 560 ms szarży **celowo**: szarża jest tym wielkim,
     * czytelnym zamachem do uskoczenia, a kieł drobnym do odejścia o krok.
     */
    windupMs: 420,
    /** Bezbronna pauza — okno na kontrę. */
    recoverMs: 400,
    /**
     * ⚠ **3400, nie 1400 — i to jest DŹWIGNIA CZĘSTOTLIWOŚCI kła.**
     *
     * Przy 1400 kieł wchodził w KAŻDYM oknie między szarżami (dzik w akcji 82%
     * czasu — zgłoszone jako „non stop używa skilla"). Przy 3400 nie zdąży
     * ostygnąć na następne okno i wchodzi **co drugi cykl**, dając rytm:
     *
     *     szarża → kieł → szarża → *pauza* → szarża → kieł → …
     *
     * ⚠ **Szukałem tego środka najpierw w `requiresChargeAwayMs` i tam go NIE
     * MA** — tamten próg jest binarny (okno ma 1450 ms, kieł 820 ms, więc albo
     * mieści się, albo nie). Częstotliwością steruje ten cooldown.
     */
    cooldownMs: 3400,
    /**
     * ⚠ **Kieł wchodzi TYLKO, gdy szarża jest dalej niż tyle od gotowości.**
     *
     * Zgłoszone z rozgrywki (2026-08-23): „dziwnie się walczy z dzikiem, który
     * non stop używa prawie skilla". Po naprawie osobnej regresji runnera
     * udział czasu spędzonego w akcji spadł z 88% na 79% — ale to wciąż dużo, a
     * źródło jest starsze niż migracja: **kieł (Faza 3.2) wypełnił luki, które
     * wcześniej dzik wypełniał chodzeniem** i obrażeniami od kontaktu.
     *
     * ⚠ **Ta liczba jest z natury BINARNA i to nie jest wada strojenia.** Okno
     * bezczynności między szarżami ma ~1450 ms, a kieł trwa 820 ms. Próg
     * poniżej 1450 nie zmienia nic (kieł i tak startuje na początku okna, gdy
     * szarża jest maksymalnie daleko); próg powyżej — wyprowadza kieł z
     * normalnego cyklu całkowicie. Wartości pośredniej nie ma.
     *
     * ⚠ **Stało tu 1500 i to była POMYŁKA — przy tej wartości kieł nie wchodził
     * NIGDY, w żadnym scenariuszu.** Zapisałem wtedy, że staje się „odpowiedzią
     * na szarżę odmówioną, np. wytrąconą obuchem". Nieprawda: po przerwaniu
     * cooldown startuje od nowa (2200 ms), ale bezbronność zjada z niego 750,
     * więc zostaje **1450 ms — tyle samo co w normalnym cyklu**. Maksimum, jakie
     * kiedykolwiek zostaje, to 1450, czyli zawsze poniżej 1500. To nie był
     * rzadki atak, tylko martwy kod.
     *
     * 1400 przepuszcza kieł, a jego CZĘSTOTLIWOŚCIĄ steruje `cooldownMs` (3400)
     * — patrz komentarz wyżej. Ten próg pilnuje już tylko jednego: **żeby kieł
     * nie zaczynał się tuż przed szarżą** i nie zlepiał obu w jeden ciąg.
     */
    requiresChargeAwayMs: 1400,
    /**
     * ⚠ Ciemniejszy wariant pomarańczu szarży (`0xff6a3a` w `Boar.ts`), nie
     * osobny kolor z innej rodziny. To ta sama bestia i ta sama zapowiedź bólu;
     * różnica jasności niesie różnicę WAGI: jasny = duży zamach, uskocz;
     * ciemny = drobny, odejdź o krok. **Do obejrzenia na renderze** — jeśli te
     * dwa czytają się jako jedno, kieł musi dostać własną rodzinę koloru.
     */
    windupTint: 0xc2452a,
  },
  /**
   * **Rozbieg** (2026-10-04, zgłoszenie z gry: „podchodzę do dzika, a on nic nie
   * robi, stoi jak debil").
   *
   * ⚠⚠ **Przyczyna była zakleszczeniem, nie strojeniem.** W zwarciu (prześwit
   * ≤ `gore.range`) dzik odmawiał kła, gdy szarża miała być gotowa w ciągu
   * `gore.requiresChargeAwayMs` — „czekaj na szarżę". A szarża WYMAGA prześwitu
   * > `gore.range`, którego w zwarciu nie ma. Gotowa szarża = czekanie bez końca;
   * po kle — dodatkowo 3,4 s stania (cooldown kła). Gracz stojący przy dzi­ku
   * nie dostawał nic.
   *
   * Dziś w zwarciu bez dostępnego kła dzik COFA SIĘ na `gap` (rozbieg), a gdy
   * szarża stygnie — czeka tam, łbem do gracza, zamiast wracać w zwarcie.
   * Cykl: szarża → kieł → cofnięcie → szarża. ⚠ `speed` poniżej chodu gracza
   * (150): cofający się dzik ma dać się dogonić i trafić, nie uciekać.
   */
  backoff: {
    /** Prześwit, do którego się cofa — szarża rusza stąd od razu, jeśli gotowa. */
    gap: 46,
    speed: 75,
    /** Przy stygnącej szarży czeka (nie podchodzi) do takiego prześwitu. */
    waitGap: 64,
  },
} as const;

/**
 * Forest bear — the toughest plain chaser in the roster, added 2026-08-14
 * from a real external sheet (see `ASSETS.bear`).
 *
 * ⚠ **DECYZJA ODWRÓCONA 2026-08-23 (Faza 3.3 Combat v2).** Stał tu zapis, że
 * niedźwiedź **świadomie nie dostaje własnej mechaniki**, bo improwizowanie jej
 * w jednym posiedzeniu jest dokładnie tym, przed czym ostrzegają dokumenty
 * projektu. To była dobra reguła i nie jest łamana lekko — zmieniły się
 * przesłanki:
 *
 *  1. **Wymuszenie.** Niedźwiedź ranił WYŁĄCZNIE przez nakładanie ciał, a to
 *     wymagało zanurzenia **24 px w sylwetce gracza** — najwięcej w całym
 *     rosterze. Combat v2 usunął ten kanał u wszystkich; zostawienie go
 *     niedźwiedziowi znaczyłoby zostawienie zgłoszonego objawu u najgorszego
 *     przypadku. Alternatywą było uczynienie go nieszkodliwym.
 *  2. **Nie jest to już improwizacja.** Powstały narzędzia, których wtedy nie
 *     było: `tools/combat_geometry.mjs` mierzy ślad stopy i progi,
 *     `tools/action_runner_weryfikacja.mjs` pilnuje przebiegu akcji, a
 *     `ActionRunner` daje kształt, którego nie trzeba wymyślać od nowa.
 *
 * ⚠ Liczby `swipe` są **pierwszym przymiarem policzonym z geometrii**, nie
 * playtestem — tak samo jak reszta bloku. Strojenie zostaje TUTAJ.
 */
/**
 * Training Dummy — a practice target by Patryczek's yard, not a monster.
 *
 * Gameplay Feel Audit (2026-08-24) found the combat mini-tutorial fully
 * optional and text-only (Patryczek's `nauka_teraz…ucieczka` topics). This is
 * the "learn by doing" half: a safe, always-available target for the exact
 * things that tutorial only describes — targeting, range, weapon variants,
 * abilities, hit feedback — reusing the SAME `damageMatchingEnemies` pipeline
 * every real fight goes through, not a second system.
 *
 * ⚠ **Two independent, deliberately redundant guarantees that it can never
 * die**, both riding on hooks `Enemy` already exposes for exactly this kind
 * of override — `takeDamage()`/`die()` themselves are NOT touched:
 *
 *  1. `hp` is absurdly large. No single hit in this game gets remotely close
 *     — even a maximal crit is two orders of magnitude short.
 *  2. `TrainingDummy.onHurt()` (below) resets `hp` to `maxHp` on every survived
 *     hit, so damage can never accumulate ACROSS multiple swings either.
 *
 * Guarantee 1 alone would be "extremely unlikely to die"; both together make
 * it "structurally cannot" — the same standard this project holds its own
 * regression gates to (`src/entities/CLAUDE.md`: "an assertion that can't go
 * red is decoration").
 *
 * Because `hp` can never reach 0, `takeDamage()`'s `if (hp<=0) { die(); return
 * true; }` branch is simply never taken — which means `damageMatchingEnemies`'s
 * own `if (killed) { ...XP, loot, quest kill, respawn... }` block in
 * `GameScene.ts` never runs either. **No changes were needed to any of that
 * shared code** — the existing "killed" gate already does all the suppression
 * for free. `xpReward: 0` and `respawnDelay: 0` are set anyway, for the reader,
 * even though the branch that would read them is unreachable.
 *
 * Zero-valued everywhere it would otherwise move or fight
 * (`patrolSpeed`/`chaseSpeed`/`aggroRange`/`deAggroRange`/`patrolRadius`): it
 * never leaves its spot and never enters the `chase` state. `Rabbit`-style
 * defence in depth on top of that: `TrainingDummy.contactDamageEnabled` is
 * overridden `false` (not just zeroed touch-damage numbers), so standing next
 * to it never fires a stray `player.takeDamage(0, …)`.
 *
 * ⚠ **Weapon durability still wears from swinging at it — accepted, not
 * fixed.** `wearWeapon()` fires in `resolveAttack()` on the decision to swing,
 * unconditional on the target; suppressing it here would mean branching that
 * shared swing-resolution path on "is this a training dummy", which is the
 * combat rebuild this feature was explicitly scoped to avoid. Realistic
 * side effect of an otherwise free feature, left as-is by design review
 * (2026-08-24).
 */
export const TRAINING_DUMMY = {
  /**
   * **Biegłość — NIEUŻYWANA, i to jest cała treść tego wpisu.**
   *
   * Manekin nie ma ŻADNEGO kanału ataku: `touchDamageMin/Max` to zera,
   * `contactDamageEnabled` zwraca `false`, nie ma akcji w `ActionRunner`.
   * Warstwa 2 nigdy go nie odpyta, bo warstwa 2 opisuje wykonanie ataku,
   * a manekin nie atakuje.
   *
   * ⚠ **Zero NIE znaczy tu „bardzo niezdarny"** — znaczy „to pole nie ma dla
   * mnie zastosowania". Pole jest wymagane przez `EnemyConfig` i tak ma
   * zostać: gdyby było opcjonalne, ten świadomy brak byłby nieodróżnialny od
   * przeoczenia u prawdziwego stworzenia.
   *
   * ⚠ **To NIE jest wartość, przez którą manekin uczy.** Kanał treningowy
   * manekina jest osobnym mechanizmem (`practice_base × soft(P) ×
   * dummyEfficiency`), nie funkcją nauczyciela `teacher(ρ)` —
   * `docs/systemy/proficiency.md`
   */
  proficiency: 0,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Manekin nie jest nauczycielem — ma WŁASNY kanał (`practiceOnDummy`,
   *  §14b). Przy `proficiency: 0` funkcja nauczyciela i tak dałaby zero. */
  teachingRole: false,
  /** Ile ms model 3D gra zachwianie `Hit` po trafieniu (klip ma ~0,58 s
   *  przy 24 fps, `tools/dummy3d.py`). Wyłącznie prezentacja. */
  hitWobbleMs: 600,
  hp: 100_000,
  xpReward: 0,
  touchDamageMin: 0,
  touchDamageMax: 0,
  touchDamageCooldown: 1,
  touchDamageType: null as DamageType | null,
  patrolSpeed: 0,
  /**
   * ⚠ **NOT 0 — found live, in-engine, not from reading the code.** `Enemy.
   * updateMotionFx()` (the shared idle "breathe" effect, run every frame for
   * every creature regardless of AI state) normalises against this as a
   * DIVISOR: `speed / this.cfg.chaseSpeed`. At rest, `speed` is also 0, so
   * `chaseSpeed: 0` produced `0/0 = NaN` on the very first frame, which
   * poisoned `setScale(NaN, NaN)` and cascaded into the physics body's
   * position — the dummy existed (right kind, right texture) but sat at
   * `NaN, NaN`, invisible everywhere. No other creature in the roster has
   * ever had `chaseSpeed: 0`, so this divisor never hit zero before.
   *
   * `aggroRange: 0` below is what actually keeps this creature from ever
   * chasing — `chaseSpeed` only needs to be a valid nonzero number for the
   * breathe maths; its value is otherwise inert.
   */
  chaseSpeed: 1,
  aggroRange: 0,
  deAggroRange: 0,
  patrolRadius: 0,
  /** Never reached (see header), kept correct for the reader anyway. */
  respawnDelay: 0,
  respawnJitter: 0,
  respawnSafeRadius: 0,
  scale: 1,
  /** Generous on purpose — this thing exists to be easy to hit, not to teach
   *  hurtbox precision. `training-dummy.png` is 55×82. */
  hurt: { length: 26, depth: 20 },
  bodyWidth: 20,
  bodyHeight: 16,
  // A carved post doesn't breathe — kills the idle pulse every other
  // creature gets from `Enemy.updateMotionFx`. Hit-pop (the little scale
  // bump on taking damage) is untouched, so it still reacts to a landed hit.
  breatheAmount: 0,
  // No `armor` — full, untyped damage every time, so the popup a player sees
  // here always matches their raw roll with no armour-mitigation surprise to
  // explain first.
  /**
   * v1.5 — visual combat affordance, not a new interaction system. Nothing
   * here touches targeting/attack/damage; it's purely what `TrainingDummy`
   * shows/hides based on distance to the player (see its own `updateAI`
   * override). Own ring, not reused from `COMBAT_FEEDBACK.targetMarker`, on
   * purpose: that ring means "this is your ACTIVE target" and is baked red
   * (`COMBAT_FEEDBACK.targetMarker.color`); this one has to mean something
   * else and never be confused with it, so it gets its own generated
   * texture (`makeTrainingDummyHintTexture`) rather than a tint on the same
   * one.
   *
   * ⚠ **Two zones, not one, and not one-shot** — third revision, on playtest
   * feedback each time (an emoji icon, then a permanent label, then a
   * "shown once ever" label were each tried and cut before this):
   *  - `labelRadius` (far): the name, same convention as an NPC's own
   *    overhead nameplate (`Merchant.ts`'s `worldTextStyle`/`UI.goldLight`)
   *    — visible every time at this range, not gated by a "seen it before"
   *    flag, exactly like a villager's name is.
   *  - `radius` (near, inside `labelRadius`): the ring takes over and the
   *    name label hides. The point is that mid-fight, this reads as a
   *    target, not a location — a floating name over an active fight is the
   *    same clutter this whole feature was built to avoid.
   */
  hint: {
    /** px — visible-from-a-distance nameplate radius, same role as an NPC
     *  spotted from across the yard. Bigger than `radius` on purpose. */
    labelRadius: 260,
    /** px — further out than melee reach, so the ring reads before the fight
     *  would even be possible, not at the moment it starts. */
    radius: 120,
    ring: {
      radius: 26,
      thickness: 2,
      /** Neutral blue-grey — deliberately nowhere near
       *  `COMBAT_FEEDBACK.targetMarker.color` (0xff5555). */
      color: 0xaab4c8,
      alpha: 0.35,
    },
    label: "Manekin treningowy",
  },
} as const;

export const BEAR = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * ⚠ Niska liczba NIE znaczy „technicznie nieudolny" — groza niedźwiedzia
   *  siedzi w całości na osi POWER (130 HP, 10–14 dmg, łuk 110°, zamrożony
   *  wektor), a §3 zabrania liczyć te same osie drugi raz w tym polu.
   */
  proficiency: 60,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Niedźwiedź — najlepszy odradzający się nauczyciel przy `P = 25` (×2,12). */
  teachingRole: true,
  hp: 130,
  xpReward: 100,
  touchDamageMin: 10,
  touchDamageMax: 14,
  touchDamageCooldown: 1.1,
  /**
   * `slash` — **zmienione z `blunt` 2026-08-17, decyzją autora, i to nie jest
   * strojenie liczby: to jedyny kanał cięcia w całej grze.**
   *
   * Uzasadnienie w świecie było zawsze po stronie cięcia i pierwsza wersja
   * po prostu poszła za `BOAR.touchDamageType` z rozpędu: dzik atakuje MASĄ
   * (taranuje i podbija ryjem), więc obuch jest u niego poprawny, ale
   * niedźwiedź bije **łapą z pazurami** — to jest rana szarpana, nie wstrząs.
   *
   * ⚠ **Co to zmienia poza samym niedźwiedziem, bo zmienia dwie rzeczy.**
   *  1. Kolumna `slash` w `ARMOR_PROFILE` przestaje być martwa. Do teraz nikt
   *     w grze nie zadawał cięcia, więc odporność kolczugi na nie (1,80 —
   *     najwyższa w tabeli) była zapasem bez zastosowania. Teraz kolczuga jest
   *     odpowiedzią na najtrudniejszego respawnującego się wroga w grze, a
   *     wybór pancerza po raz pierwszy ma trzy różne prawidłowe odpowiedzi
   *     zamiast dwóch.
   *  2. Obuch schodzi z trzech kanałów na dwa i zostaje **wyłącznie u dzika**
   *     (kontakt + szarża). Przeszywanica nadal jest jego jedyną dobrą
   *     odpowiedzią i nadal jest bez bramki Siły, więc nic nie traci racji
   *     bytu — ale odpowiada teraz na jednego przeciwnika, nie na dwóch.
   *     Gdyby to okazało się za wąskie, tańszą naprawą jest dodanie obucha
   *     nowemu stworzeniu niż cofanie tej zmiany.
   *
   * ⚠ Niedźwiedź **nie ma własnego pancerza** (`armor`), więc ta zmiana nie
   * dotyka kanału informacji zwrotnej o typie (`COMBAT_FEEDBACK.typeFeedback`
   * czyta ochronę CELU) — nie zmienia się nic w tym, co gracz widzi nad
   * niedźwiedziem, gdy w niego uderza. Zmienia się to, co niedźwiedź robi
   * pancerzowi GRACZA.
   */
  touchDamageType: "slash" as DamageType | null,
  patrolSpeed: 24,
  chaseSpeed: 60,
  aggroRange: 190,
  deAggroRange: 360,
  patrolRadius: 60,
  respawnDelay: 20,
  respawnJitter: 8,
  respawnSafeRadius: 120,
  /** Rendered scale — `bear_walk.png` frames are 64×33px with ~55×29px of
   *  real content; 1.6 puts it a clear step above the boar on screen
   *  without dwarfing the player. */
  scale: 1.6,
  /**
   * **Zamach łapą — jedyny atak niedźwiedzia (Faza 3.3 Combat v2).**
   *
   * Ciężki, szeroki, mocno telegrafowany: kontrą jest ODEJŚCIE ALBO OBEJŚCIE,
   * nie unik w ostatniej chwili.
   *
   * ⚠ **Kierunek zamachu ZAMRAŻA SIĘ na starcie zapowiedzi**, a rozstrzygnięcie
   * sprawdza ŁUK wokół tego wektora — nie sam dystans. To jest cała kontrgra i
   * jednocześnie pierwszy w projekcie atak wroga z prawdziwym stożkiem:
   * niedźwiedź zamachuje się tam, gdzie stałeś, więc **obejście go w bok w
   * trakcie 620 ms zapowiedzi kończy się pudłem**, mimo że dystans dalej się
   * zgadza. Ten sam model, który recenzja wskazała jako docelowy dla wypadu
   * wilka (`docs/systemy/combat.md`, runda 2).
   */
  swipe: {
    /** ⚠ PRZEŚWIT między hurtboxami, nie dystans środków. Podchodzi na tyle i
     *  staje — 10 px światła między łbem a graczem. */
    range: 10,
    /** Prześwit, przy którym cios jeszcze ląduje. Sprawdzany PONOWNIE w chwili
     *  rozstrzygnięcia; margines +14 px jak u reszty rosteru. */
    reach: 24,
    /**
     * PÓŁ-łuk zamachu w stopniach (jak `melee.arcDeg` gracza), czyli **110° w
     * sumie** — najszerszy atak w grze. Szeroki nie znaczy wszechstronny: **za
     * plecami niedźwiedzia jest bezpiecznie**.
     *
     * ⚠ **Zaczęło się od 70° i symulacja to obaliła.** Ucieczka wprost ratuje
     * przed każdym telegrafem w tej grze (gracz robi 93 px w 620 ms), więc łuk
     * ma znaczenie WYŁĄCZNIE dla gracza, który zamiast uciekać **okrąża** —
     * wtedy dystans stoi w miejscu i decyduje sam kąt. Przy promieniu 62,9 px:
     *
     * | pół-łuk | łuku do przebycia | czas | zapas z 620 ms |
     * |---|---|---|---|
     * | 70° | 77 px | 512 ms | **108 ms** — reakcja musi być bezbłędna |
     * | **55°** | **60 px** | **402 ms** | **218 ms** |
     * | 45° | 49 px | 329 ms | 291 ms |
     *
     * 70° formalnie dawało się obejść, ale zapas 108 ms przeczy obietnicy
     * czytelnego telegrafu — najdłuższa zapowiedź w grze ma być do odczytania,
     * a nie do trafienia w okno. 55° zostawia realny margines i wciąż czyni z
     * tego najszerszy atak w rosterze.
     */
    arcDeg: 55,
    /** Zapowiedź. Najdłuższa w grze — dłuższa nawet od szarży dzika (560 ms).
     *  Zwierzę tej masy ma się zamachiwać widocznie. */
    windupMs: 620,
    /** Bezbronna pauza. Też najdłuższa: cena za ciężki cios. */
    recoveryMs: 800,
    cooldownMs: 1800,
    /**
     * ⚠ **TEN SAM pomarańcz co szarża dzika (`0xff6a3a`), i to jest celowe.**
     * Reguła z rundy 2 recenzji: kolor koduje **globalną kategorię/ciężar**, nie
     * nazwę ataku. Oba są ciężkim, telegrafowanym zamachem, na który odpowiedzią
     * jest zejście z drogi — więc mają mówić to samo. Wymyślenie tu szóstego
     * odcienia powiększyłoby paletę bez dokładania znaczenia.
     */
    windupTint: 0xff6a3a,
  },

  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: INFERENCJA (`tools/combat_geometry.mjs`, sekcja A).
   *
   * ⚠ **`depth` NIE JEST ZMIERZONE — to INFERENCJA.** `bear_*.png` to trzy paski
   * JEDNOKIERUNKOWE (profil), więc widoku z przodu po prostu nie ma i głębokości
   * nie da się z arkusza odczytać w ogóle. 19,4 px tekstury (≈31 px świata)
   * pochodzi z proporcji L/głębokość pozostałych czworonogów, które mają oba
   * widoki: krępe (królik 1,40, dzik 1,34) kontra psowate (wilk 2,15, Szary
   * 1,88). Niedźwiedź jest krępy. Zamawianie nowego assetu tylko po to, żeby
   * zmierzyć hurtbox, byłoby złym użyciem czasu — ale ta liczba ma zostać
   * skorygowana, jeśli niedźwiedź kiedyś dostanie prawdziwe kierunki.
   */
  /**
   * ⭐ **Niedźwiedź: hurtbox z MODELU 3D (2026-10-04).** Zmierzone: długość bryły
   * bez ogona z `bear.glb` × 4,955 px/j. = 60 px. Cel jak u większości
   * rosteru (dzik, wilk, królik, pająki): **~120–125 % długości ciała** —
   * celowo hojny, ale jednakowo hojny dla wszystkich. Było 53 × 1,6 = 85 px (142 % —
   * szacunek z jednokierunkowego arkusza 2D, który był dłuższy od modelu; ten komentarz wyżej sam zapowiadał korektę). ⚠ To jest TYLKO hurtbox (walka); ciało fizyczne (`bodyWidth`)
   * nietknięte — po nim chodzi nawigacja lasu, zamknięta 2026-08-31.
   */
  hurt: { length: 46, depth: 19.4 },

  bodyWidth: 30,
  bodyHeight: 16,
} as const;

/**
 * ── BANDYCI — pierwsi humanoidalni wrogowie (2026-10-11, `OI-171`) ─────────
 * Plan i powody: `docs/bandyci_plan.md`. Jedna klasa (`entities/Bandit.ts`),
 * trzy konfiguracje. Model 3D: `tools/npc3d.py` tryb wroga →
 * `characters/enemy_<id>.glb` (`MODELE_3D`).
 *
 * ⚠ Liczby STARTOWE do playtestu. Wyprowadzenie:
 *  - `proficiency` 100–160 — pasmo M-III (100–199), dziś PUSTE
 *    (`docs/stworzenia_katalog.md`); bez tego ranga III jest nieosiągalna.
 *  - obrażenia: pałka OBUCHOWE, topór i miecz CIĘTE — kanały, które miały po
 *    jednym dostawcy (`OI-120`).
 *  - `chaseSpeed` < marsz gracza (150) — ta sama granica co cały roster
 *    (`OI-49`), żeby od zbója dało się odejść.
 *  - ciało i hurtbox jak `PLAYER` — to ludzie tej samej postury.
 *  - `alarmRadius`: zbój, który rusza w pościg, budzi kompanów w tym promieniu
 *    (wzór: wycie wilka) — obóz walczy razem.
 * Zamach: telegraf `windupTint` + ukorzenienie, rozstrzygnięcie na wejściu
 * w `active` — wzór `Bear.resolveSwipe`.
 */
const BANDIT_BAZA = {
  teachingRole: true,
  touchDamageCooldown: 1.2,
  patrolSpeed: 30,
  deAggroRange: 380,
  patrolRadius: 48,
  respawnSafeRadius: 160,
  scale: 1.15,
  hurt: { length: 22, depth: 21 },
  bodyWidth: 18,
  bodyHeight: 16,
  alarmRadius: 260,
} as const;

export const BANDIT_CLUB = {
  ...BANDIT_BAZA,
  proficiency: 100,
  hp: 80,
  xpReward: 90,
  touchDamageMin: 10,
  touchDamageMax: 16,
  touchDamageType: "blunt" as DamageType | null,
  chaseSpeed: 80,
  aggroRange: 180,
  respawnDelay: 45,
  respawnJitter: 15,
  armor: { type: "leather" as const, points: 14 },
  /** Wolny, ciężki zamach pałką — długi telegraf, długa bezbronność. */
  swing: { range: 12, reach: 26, arcDeg: 60, windupMs: 700, recoveryMs: 520, cooldownMs: 1500, windupTint: 0xffa040 },
};

export const BANDIT_AXE = {
  ...BANDIT_BAZA,
  proficiency: 120,
  hp: 95,
  xpReward: 110,
  touchDamageMin: 8,
  touchDamageMax: 12,
  touchDamageType: "slash" as DamageType | null,
  chaseSpeed: 95,
  aggroRange: 190,
  respawnDelay: 45,
  respawnJitter: 15,
  armor: { type: "padded" as const, points: 16 },
  /** Szybszy, krótszy zamach — agresywny, częsty. */
  swing: { range: 12, reach: 28, arcDeg: 55, windupMs: 460, recoveryMs: 380, cooldownMs: 1100, windupTint: 0xff7a3a },
};

export const BANDIT_CHIEF = {
  ...BANDIT_BAZA,
  displayName: "Herszt",
  elite: true,
  proficiency: 160,
  hp: 260,
  xpReward: 350,
  touchDamageMin: 14,
  touchDamageMax: 20,
  touchDamageType: "slash" as DamageType | null,
  chaseSpeed: 90,
  aggroRange: 210,
  /** 0 = nie odradza się — jak Szary. */
  respawnDelay: 0,
  respawnJitter: 0,
  scale: 1.2,
  armor: { type: "mail" as const, points: 30 },
  alarmRadius: 340,
  /** Telegrafowany silny cios miecza. */
  swing: { range: 12, reach: 30, arcDeg: 60, windupMs: 620, recoveryMs: 460, cooldownMs: 1300, windupTint: 0xff4a2a },
};

/**
 * **Lis — złodziej z kurnika** (2026-10-04, decyzja autora): zwierzyna, która
 * NAJPIERW UCIEKA, a staje do walki dopiero wtedy, gdy uznała, że ucieczka
 * nie przynosi skutku. Wcześniej był wyłącznie dekoracją (`Critter`).
 *
 * ⭐ **„Bezskuteczność" jest MIERZONA, nie losowana.** Każdy zryw kończy się
 * bilansem: o ile urósł dystans między ciałami od jego startu. Zryw, który nie
 * dał `flight.minGainPx`, jest NIEUDANY; `flight.strikesToTurn` nieudanych pod
 * rząd (udany cofa licznik o jeden) i lis się odwraca. Gracz, który przestaje
 * gonić, daje mu wygrać: przy staniu zryw przynosi ~120 px i po jednym-dwóch
 * lis jest poza `calmGap`.
 *
 * Wyprowadzenie liczb (chód gracza 150 px/s, sprint ×1,6):
 * - `fleeSpeed` 200 — SZYBCIEJ niż chód gracza, wolniej niż sprint (240). Za
 *   idącym graczem zryw zyskuje 50 px/s × 0,8 s = 40 px < `minGainPx` 45, więc
 *   każdy zryw jest nieudany; w postoju (`watchMs` 400) gracz nadrabia ~60 px,
 *   czyli netto ~20 px na cykl.
 * - Zmierzone w silniku na `forrest.tmj` (2026-10-04, trzy lisy z mapy ×
 *   cztery kierunki podejścia, wejście z 175 px): pościg stępa → zwrot po
 *   3,6–3,9 s (3 nieudane zrywy) w 11 z 12 prób, raz lis znalazł drogę
 *   i UCIEKŁ (5 s); sprint → zwrot po ~2 s; gracz stojący — lis zawsze uchodzi.
 *   Pierwsza wersja (175/700/550, bez `alertPanicGap`, zwrot od razu po
 *   dogonieniu) „poddawała się" po 1,2–1,6 s — zanim pościg był pościgiem.
 * - `cornerGap` 40 — dogoniony w postoju lis dolicza nieudany zryw i zrywa
 *   się od razu. ⚠ Pierwsza wersja odwracała go wtedy natychmiast — w lesie,
 *   gdzie wolny bywa tylko kierunek w bok, pościg kończył się po 1,2–1,6 s.
 *
 * ⚠ **Ucieczka jest PRZERYWANA (zryw → postój), nigdy ciągła** — reguła
 * królika (`src/entities/CLAUDE.md`): atak gracza wymaga zatrzymania, więc cel
 * uciekający bez przerwy wychodzi spod każdego zamachu. `watchMs` to okno, w
 * którym lis STOI i ogląda się na gonitwę.
 *
 * ⚠ **Uderzenie odwraca go natychmiast** (przez ten sam telegraf) — złapany
 * jest dowodem, że ucieczka nie działa, mocniejszym niż każdy licznik.
 * ⚠ **Zwrot nie jest jednokierunkowy jak `provoked` królika**: po zerwaniu
 * pościgu (`deAggroRange`) lis się uspokaja i przy następnym spotkaniu znów
 * zaczyna od ucieczki. To zwierzyna, nie drapieżnik na gracza.
 */
export const FOX = {
  proficiency: 25,
  teachingRole: false,
  hp: 36,
  xpReward: 30,
  /** Kęs — obrażenia akcji `AKCJE.foxBite`; kontaktu lis nie ma. */
  touchDamageMin: 5,
  touchDamageMax: 8,
  touchDamageCooldown: 1.0,
  touchDamageType: "pierce" as DamageType | null,
  patrolSpeed: 28,
  chaseSpeed: 100,
  aggroRange: 150,
  /** Powyżej `flight.calmGap`: lis, który się odsadził, chwilę stoi i patrzy,
   *  zanim baza zerwie pościg. */
  deAggroRange: 300,
  patrolRadius: 80,
  respawnDelay: 25,
  respawnJitter: 10,
  respawnSafeRadius: 100,
  /** Arkusz 2D (`fox_*.png`, ścieżka awaryjna) — ta sama skala co krytter. */
  scale: 0.85,
  /**
   * ⭐ **Lis: hurtbox z MODELU 3D (2026-10-04).** Zmierzone: długość bryły
   * bez ogona z `fox.glb` × 4,955 px/j. × skala 1,25 = 29 px. Cel jak u większości
   * rosteru (dzik, wilk, królik, pająki): **~120–125 % długości ciała** —
   * celowo hojny, ale jednakowo hojny dla wszystkich. Było 24 × 0,85 = 20 px (69 % —
   * odziedziczony po krytterze bez walki; żeby trafić, trzeba było wejść w zwierzę). ⚠ To jest TYLKO hurtbox (walka); ciało fizyczne (`bodyWidth`)
   * nietknięte — po nim chodzi nawigacja lasu, zamknięta 2026-08-31.
   */
  hurt: { length: 41, depth: 19 },
  /** ⚠ Piksele KLATKI: realne ciało 21 × 0,85 = 17,9 px — ten sam pomiar,
   *  który krytter-lis dostał 2026-08-28 (89,4 % mapy, jedna wyspa). */
  bodyWidth: 21,
  bodyHeight: 12,
  /** Lis zna las — obchodzi drzewa w podejściu. Zryw (`flee`) i tak tylko
   *  się ślizga (polityka intencji, `src/entities/CLAUDE.md`). */
  solver: "steer" as SolverKind,
  flight: {
    alertRange: 150,
    /** Nastroszenie przed pierwszym zrywem — zauważył cię. */
    alertMs: 350,
    /** Bliżej niż to w trakcie nastroszenia — zrywa się od razu. Bez tego gracz
     *  idący wprost na lisa zjadał ~50 px w alarmie i dopadał go w pierwszym
     *  postoju (zmierzone: zwrot po 1,5 s). */
    alertPanicGap: 90,
    fleeSpeed: 200,
    boltMs: 800,
    watchMs: 400,
    minGainPx: 45,
    /**
     * Wachlarz kierunków zrywu (° od „wprost od gracza"), sprawdzany po kolei:
     * najpierw pierwszy z WOLNĄ prostą na długość zrywu (`NavGrid.hasClearLine`),
     * potem pierwszy, w którym ciało w ogóle stanie (`passable` — `seek`
     * dojdzie tam trasą). ⚠ Bez tego zryw szedł wprost od gracza i w lesie
     * wbijał się w pień — zmierzone na `forrest.tmj`: zryw dał −5 px i lis
     * „poddał się" po 1,7 s. Nic = naprawdę osaczony; zryw ślizga się po
     * przeszkodzie i bilans sam go policzy jako nieudany.
     */
    escapeFanDeg: [0, 25, -25, 50, -50, 75, -75],
    /**
     * ⭐ **Drugi warunek nieudanego zrywu: pogoń NIE ODPUŚCIŁA** (2026-10-05,
     * wariant A — decyzja autora). Zryw jest nieudany, gdy lis zyskał mniej niż
     * `minGainPx` ALBO gdy gracz w jego trakcie przebiegł W STRONĘ LISA co
     * najmniej `pursuitShare` jego drogi.
     *
     * ⚠ Sam `minGainPx` (45) był skrojony pod gołego gracza na pełnym wychyleniu
     * (150 px/s, zysk zrywu 31–39 px — zapas 7–12 px). Zmierzone w silniku na
     * rozstawionym lesie: zestaw średni chodzi 133 px/s, ciężki 112 px/s, a na
     * telefonie chód skaluje się z wychyleniem drążka — poniżej ~143 px/s KAŻDY
     * zryw był „udany” i cofał licznik. Ciężki zestaw stępa: 11 zrywów
     * w 15 s, zero zwrotu („lis ucieka cały czas”). Udział gracza w drodze
     * lisa przy pościgu stępa: goły 0,75, ciężki 0,57–0,59 → próg 0,4 zostawia
     * zapas do ~80 px/s. Stojący gracz ma 0 — lis dalej uchodzi.
     */
    pursuitShare: 0.4,
    strikesToTurn: 3,
    cornerGap: 40,
    calmGap: 270,
  },
  /** Zwrot: stoi, jeży się i warczy — telegraf PRZED pierwszym kęsem. */
  snarl: {
    turnMs: 700,
    tint: 0xff8a50,
  },
  bite: {
    /** Szybciej niż chód gracza — odwrócony lis ma dogonić, nie gonić w nieskończoność. */
    approachSpeed: 165,
    range: 5,
    reach: 15,
    windupMs: 340,
    recoverMs: 300,
    cooldownMs: 950,
    windupTint: 0xffb080,
  },
} as const;

/**
 * **Jeleń — istota NEUTRALNA, która się broni** (2026-10-04, decyzja autora):
 * z natury nie atakuje; po UDERZENIU staje do walki porożem. Wcześniej był
 * dekoracją (`Critter`, Faza 1 fauny).
 *
 * ⚠ **`flight` to liczby Fazy 1 fauny, przeniesione bez zmian** — jedyne
 * w projekcie wyprowadzone z decyzji projektowej, nie z pomiaru zwierzęcia
 * (`docs/fauna_faza1.md` §3.3): `boltSpeed` 170 leży MIĘDZY chodem gracza
 * (150) a sprintem (240) — stępa jelenia nie dogonisz, sprintem tak, ale to
 * kosztuje staminę. `panicGap` 60 domyka lukę przy graczu idącym wprost na
 * cel. Zmiana `boltSpeed` wymaga przeliczenia `panicGap`/`watchMs`.
 *
 * ⚠ **Neutralny ≠ obojętny**: zauważony gracz płoszy go jak dotąd (czujność →
 * zryw → postój), ale nic więcej. Zwrot daje WYŁĄCZNIE cios — inaczej niż
 * u lisa, którego odwraca też bezskuteczna ucieczka.
 * ⚠ **Po zerwaniu pościgu uspokaja się** (jak lis) — rozjuszenie nie jest
 * jednokierunkowe jak u królika.
 */
export const DEER = {
  proficiency: 40,
  teachingRole: false,
  hp: 70,
  xpReward: 40,
  /** Cios porożem — obrażenia akcji `AKCJE.deerRam`; kontaktu jeleń nie ma. */
  touchDamageMin: 8,
  touchDamageMax: 12,
  touchDamageCooldown: 1.2,
  touchDamageType: "pierce" as DamageType | null,
  patrolSpeed: 26,
  chaseSpeed: 100,
  /** = `flight.alertRange`: zasięg agro to zasięg CZUJNOŚCI, nie ataku. */
  aggroRange: 150,
  deAggroRange: 320,
  patrolRadius: 110,
  respawnDelay: 30,
  respawnJitter: 10,
  respawnSafeRadius: 120,
  /** Arkusz 2D (`deer_*.png`, ścieżka awaryjna) — ta sama skala co krytter. */
  scale: 1.1,
  /**
   * ⭐ **Jeleń: hurtbox z MODELU 3D (2026-10-04).** Zmierzone: długość bryły
   * bez ogona z `deer.glb` × 4,955 px/j. = 61 px. Cel jak u większości
   * rosteru (dzik, wilk, królik, pająki): **~120–125 % długości ciała** —
   * celowo hojny, ale jednakowo hojny dla wszystkich. Było 34 × 1,1 = 37 px (61 % —
   * odziedziczony po krytterze bez walki; łeb i zad stały poza hurtboxem). ⚠ To jest TYLKO hurtbox (walka); ciało fizyczne (`bodyWidth`)
   * nietknięte — po nim chodzi nawigacja lasu, zamknięta 2026-08-31.
   */
  hurt: { length: 67, depth: 27 },
  /** ⚠ Piksele KLATKI: realne ciało 24 × 1,1 = 26,4 px — pomiar krytera
   *  z 2026-08-28 (84,8 % mapy, jedna wyspa; z klatką arkusza było 39,5 %). */
  bodyWidth: 24,
  bodyHeight: 13,
  solver: "steer" as SolverKind,
  flight: {
    alertRange: 150,
    alertMs: 550,
    boltSpeed: 170,
    boltMs: 450,
    watchMs: 900,
    panicGap: 60,
    calmGap: 260,
    /** Ten sam wachlarz kierunków zrywu co u lisa (`Enemy.escapePoint`).
     *  Krytter-jeleń zrywał się zamrożonym impulsem wprost od gracza. */
    escapeFanDeg: [0, 25, -25, 50, -50, 75, -75],
  },
  ram: {
    /** Szybciej niż chód gracza — rozjuszony byk dochodzi, nie goni bez końca. */
    approachSpeed: 155,
    range: 6,
    /** Poroże sięga dalej niż pysk lisa czy królika. */
    reach: 20,
    /** Zapowiedź: łeb w dół, poroże przed siebie, uderzenie racicą. */
    windupMs: 560,
    recoverMs: 480,
    cooldownMs: 1300,
    windupTint: 0xffa060,
  },
} as const;

/**
 * Forest wolf — the map's PACK enemy, in the south-western woods, mirroring
 * the boars' eastern placement as the other danger pocket.
 *
 * It used to be "a rabbit that runs fast": plain base AI, its whole identity
 * baked into chaseSpeed. That wasted the one thing the lore already promised
 * (docs/swiat.md calls it a pack-hunter) and left the roster speaking a single
 * verb — every enemy closed the distance and stood in your face. The wolf now
 * hunts the way a pack actually does, and that is a different *shape* of fight
 * rather than a bigger number:
 *
 *  • it CIRCLES at `pack.circleRadius` instead of gluing itself to you, so its
 *    damage arrives in bursts you can read rather than as a constant drain;
 *  • it darts in on its own cadence (`pack.lunge*`), then peels back off;
 *  • the first one to spot you HOWLS and pulls every wolf within
 *    `pack.callRadius` — you fight the pack, never one wolf at a time.
 *
 * Balance note: hit-and-run means a wolf is in contact only during its lunge,
 * so three of these do LESS sustained damage than three of the old gluing
 * version while reading as far more dangerous. That is why the trio on the map
 * did not need a stat cut — see the spawn placement note in CLAUDE.md.
 */
export const WOLF = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * Najwyżej z pospolitych: kieł jest narzędziem używanym najczęściej i
   *  KORYGOWANYM wobec ruchomego celu. ⚠ Szybkość, wycie i pozycjonowanie
   *  stada to AI i Power — NIE wchodzą w tę liczbę. Sufit nauki: 68/0,8 = 85.
   */
  proficiency: 68,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Wilk — najwyższy `P` wśród pospolitych i najczęstszy realny sparing. */
  teachingRole: true,
  hp: 55,
  xpReward: 45,
  touchDamageMin: 7,
  touchDamageMax: 10,
  touchDamageCooldown: 0.9,
  /**
   * ⚠ **To pole JEST ugryzieniem wilka, a nie „dotknięciem obok niego".**
   * Wypad nie zadaje własnych obrażeń — `Wolf.updateChase` mówi wprost, że kieł
   * ląduje przez zwykły overlap kontaktowy, więc innego miejsca nie ma. Wilk
   * orbituje na `pack.circleRadius` 96 px, czyli poza wypadem ciała się nie
   * stykają: zmierzone (T7, 15 s) **6 wypadów → dokładnie 6 ticków kontaktu**.
   *
   * `pierce` z mechaniki: jeden krótki, skierowany impuls przechodzący PRZEZ
   * gracza (117–118 px lotu w 383 ms, zmierzone), jedno trafienie, natychmiast
   * odskok. To profil ukłucia, nie ślizgu (`slash`) ani zderzenia (`blunt`).
   * Gdyby wilk był przyklejony i tickał stojąc w graczu, `pierce` byłby złym
   * opisem — ale on tak nie działa, i to jest cała treść przebudowy watahy.
   *
   * ⚠ Typ zmienia **wyłącznie** redukcję. Nie dotyka `lunge`, kadencji,
   * `howl`, AI ani rootu gracza — zweryfikowane pomiarem, nie założeniem.
   */
  touchDamageType: "pierce" as DamageType | null,
  patrolSpeed: 42,
  /** Used while closing the gap from outside the circle; the orbit itself runs
   *  at `pack.circleSpeed`. Still well above the rabbit (70) and the boar (52). */
  chaseSpeed: 115,
  aggroRange: 165,
  deAggroRange: 320,
  patrolRadius: 80,
  respawnDelay: 12,
  respawnJitter: 5,
  respawnSafeRadius: 100,
  scale: 1.8,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: zmierzone (`tools/combat_geometry.mjs`, sekcja A).

   */
  hurt: { length: 28, depth: 13 },

  bodyWidth: 16,
  bodyHeight: 13,
  /** Pack behaviour — read by the Wolf subclass (and inherited by GREY_WOLF). */
  pack: {
    /** Distance (px) the wolf tries to hold while circling, waiting for its turn. */
    circleRadius: 96,
    /** How fast it moves while orbiting — slower than a straight chase, which
     *  is what makes the circling read as stalking rather than a miss. */
    circleSpeed: 78,
    /**
     * How far AHEAD along the circle a wolf aims, in degrees.
     *
     * The orbit is produced by steering at a point `orbitLeadDeg` around the
     * ring from where the wolf currently stands, not by integrating an angle
     * over time — so it needs no delta-time and cannot drift or jitter when the
     * frame rate does. Each wolf keeps the bearing it arrived on, which is what
     * makes a pack fan out without anyone assigning slots.
     */
    orbitLeadDeg: 26,
    /** Beyond circleRadius × this, stop orbiting and just close the gap. */
    closeInFactor: 1.5,
    /**
     * Darts in from within this range (px).
     *
     * ⚠ **NIEAKTUALNE OD 2026-08-23.** Był tu niezmiennik „`lungeSpeed × lungeMs`
     * MUSI przekraczać `lungeRange`" — bo wypad musiał DOJECHAĆ do gracza, żeby
     * ugryzienie padło przez nakładanie ciał. Dziś wypad zatrzymuje się na
     * `lungeStopGap`, a kęs ma własny test zasięgu (`biteReach`), więc dojechanie
     * przestało być wymagane. Historyczny opis: Otherwise the dart stops short of the player and the pack
     * quietly does nothing — measured at the first tuning pass, where a 130px
     * trigger with 70px of travel produced 4 contact ticks in 12 seconds
     * against a stationary, non-retaliating player (2.8 dps, versus 28 for the
     * plain gluing chase it replaced). The lunge has to pass THROUGH where the
     * player stands, not arrive next to them.
     */
    lungeRange: 120,
    /** Lunge speed (px/s) and how long it commits for (ms) — 122px of travel,
     *  just over `lungeRange`. Unlike the boar's charge this is short and
     *  untelegraphed: the pack's threat is the *volume* of attacks, not one big
     *  readable hit. */
    lungeSpeed: 320,
    lungeMs: 380,
    /** Stand-off after a lunge (ms) before drifting back into the orbit. */
    recoverMs: 260,
    /** Minimum gap between one wolf's lunges (ms). */
    /**
     * ⚠ **Dystans, na którym wypad STAJE (px, między środkami sprite'ów).**
     *
     * Do 2026-08-23 nie istniał: wypad leciał, aż nie skończył mu się czas, a
     * ugryzienie padało przez **nakładanie CIAŁ** — czyli wilk musiał wejść
     * ~13 px w sylwetkę gracza, żeby cokolwiek zrobić. Stąd zgłoszenie
     * „przeciwnicy wchodzą w postać": to nie był błąd AI, tylko jedyny kanał,
     * jaki to stworzenie miało.
     *
     * ⚠ **Zatrzymanie jest po DYSTANSIE, nie po przebytej drodze.** Wilk rusza
     * z dowolnego miejsca poniżej `lungeRange` (zwykle z `circleRadius` = 96,
     * ale bywa i z 120), więc stała długość skoku raz kończyłaby się przed
     * graczem, a raz w środku niego.
     *
     * ⚠ **Liczba jest kompromisem między dwoma kierunkami i to jest usterka
     * DZISIEJSZEJ geometrii, nie tej wartości.** Gracz jest wysoki (60 px) i
     * wąski (22 px), więc jeden okrągły próg nie może zadowolić obu:
     *
     * | stop | prześwit z boku | prześwit z góry/dołu |
     * |---|---|---|
     * | 48 | 10,9 px | **−4,5 px — sylwetki nachodzą** |
     * | **54** | **17,0 px** | **1,5 px** |
     * | 58 | 21,1 px | 5,5 px |
     *
     * Wybrane 54: najmniejsza wartość, przy której wilk NIE nachodzi na gracza
     * z żadnej strony — a o to całe zamieszanie. Kosztem jest to, że z boku
     * stoi trochę dalej, niż musiałby.
     *
     * ⚠ **Faza 1B to naprawia u źródła**, zamieniając próg na prześwit między
     * hurtboxami (`gapBetween`) — wtedy jedna liczba znaczy „zostaw N px
     * światła" niezależnie od kierunku i od gatunku. Do tego czasu ta wartość
     * jest strojona OKIEM, nie wzorem.
     */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    lungeStopGap: 18,
    /**
     * Zasięg, na którym kęs faktycznie ląduje — sprawdzany PONOWNIE w chwili
     * rozstrzygnięcia.
     *
     * ⚠ **Musi przekraczać `lungeStopGap`**, inaczej wynik byłby przesądzony w
     * chwili startu wypadu i uskok w bok byłby teatrem. Ta sama reguła i ten
     * sam powód co przy Szarym (74 → 88) i skoczku (58 → 70).
     */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    biteReach: 32,
    /** Cooldown between darts (ms). */
    lungeCooldownMs: 1900,
    /** Random extra on top, so a trio never lunges in lockstep. */
    lungeJitterMs: 900,
    /** A howl pulls every wolf (and the Szary) within this radius (px).
     *  Sized against the map's actual spawn spacing: the three pack wolves sit
     *  115–143px apart so any one of them links the whole trio, while the Szary
     *  is placed 250px+ away and is therefore NEVER dragged in by a pack howl.
     *  Change this and re-check both distances (see CLAUDE.md). */
    callRadius: 200,
    /** A wolf will not howl again for this long (ms) — one call per engagement,
     *  not a siren every time it re-aggros. */
    howlCooldownMs: 9000,
  },
} as const;

/**
 * **Szary** — the named wolf from the prologue: the one that mauled the Hunter
 * and the first genuinely personal target the player has (see docs/swiat.md,
 * and the Hunter's closing line, "ten szary wciąż gdzieś tam jest").
 *
 * He exists because the story's antagonist previously WAS an ordinary wolf —
 * 55 HP, weaker than a boar, no mechanic — so a player could kill the villain
 * of their own prologue by accident and never know it happened. A named foe
 * has to be legible as one before it is balanced as one, hence `displayName`
 * and `elite` (the HP bar carries his name and stays up for the whole fight).
 *
 * Mechanically he is a DUELIST, deliberately distinct from the other two
 * special enemies we ship:
 *   • the boar asks "can you read a telegraph and side-step?" (Unik)
 *   • the pack asks "can you handle several at once?" (Wir ostrzy)
 *   • the Szary asks "can you land damage on something that refuses to stand
 *     still?" — he bites and immediately BACKSTEPS out of reach, so slow
 *     weapons whiff and hammering the attack button accomplishes nothing.
 *
 * Second act: under `enrage.hpFraction` he stops retreating, turns red and
 * comes straight at you. The fight has a shape — patience, then panic — which
 * is what makes it memorable rather than merely long.
 *
 * He inherits the pack block, so he answers a howl and howls himself; he is
 * simply placed far enough from the trio that neither pulls the other.
 */
export const GREY_WOLF = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * Najwyżej w faunie startowej. Brak pancerza mimo elity — groźny WYKONANIEM,
   *  nie masą. ⚠ Nadal wyraźnie poniżej punktu neutralnego — nie
   *  dowodzimy, że wilk bije się lepiej od wyszkolonego człowieka.
   */
  proficiency: 82,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Szary jest POZA ZBIOREM, nie wykluczony jako słaby: `respawnDelay = 0`,
   *  więc nie jest źródłem farmienia ani dla R1, ani dla R2 (§14b). Uczy
   *  normalnie — jednorazowo. */
  teachingRole: false,
  /** Shown over the HP bar. Presence of this is what marks a foe as named. */
  displayName: "Szary",
  /** Wider, always-visible-once-engaged HP bar with the name above it. */
  elite: true,
  /** Tanky enough to outlast the boar (95) by a clear margin — he is the
   *  gate at the end of the current content, not a step on the way. */
  hp: 190,
  xpReward: 260,
  touchDamageMin: 11,
  touchDamageMax: 15,
  touchDamageCooldown: 0.85,
  /**
   * ⚠ **Szary ma DWA niezależne kanały obrażeń i oba muszą być otypowane.**
   * Ten (odziedziczony kontakt) plus `duel.biteDamageType` niżej — nigdzie nie
   * wyłącza bazowego `tryTouchDamage`.
   *
   * Zmierzone (T5, 20 s pojedynku): gdy gracz stoi w dystansie, kontakt daje
   * **0 ticków** — ale gdy gracz jest w zwarciu, czyli robi to, co MUSI robić,
   * żeby w Szarego trafić, kontakt dokłada **79 obrażeń w 6 tickach obok 192 z
   * ugryzień**. To **29% jego surowego wyjścia**. Otypowanie samego ugryzienia
   * zostawiłoby prawie jedną trzecią poza systemem dokładnie w tej sytuacji,
   * w której gracz faktycznie walczy.
   */
  touchDamageType: "pierce" as DamageType | null,
  patrolSpeed: 38,
  chaseSpeed: 132,
  aggroRange: 210,
  deAggroRange: 420,
  patrolRadius: 70,
  /**
   * Zero means **he does not come back**. A named foe respawning on a timer
   * reads as scenery; killing the Szary has to stay an event.
   *
   * Honest limitation: nothing persists this, so he returns if GameScene is
   * rebuilt (a page reload, or going back to the title). Wiring a real kill
   * flag belongs with the revenge quest that doesn't exist yet — see the ⏳
   * entry in CLAUDE.md rather than bolting a save field on now.
   */
  respawnDelay: 0,
  respawnJitter: 0,
  respawnSafeRadius: 140,
  scale: 2.4,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: zmierzone (`tools/combat_geometry.mjs`, sekcja A).

   */
  /**
   * ⭐ **Szary: hurtbox z MODELU 3D (2026-10-04).** Zmierzone: długość bryły
   * bez ogona z `greywolf.glb` × 4,955 px/j. × skala 1,3 = 50 px. Cel jak u większości
   * rosteru (dzik, wilk, królik, pająki): **~120–125 % długości ciała** —
   * celowo hojny, ale jednakowo hojny dla wszystkich. Było 32 × 2,4 = 77 px (154 % —
   * arkusz 2D Szarego był dużo większy od modelu; dziś model = wilk × 1,3, więc i hurtbox ~1,3 × wilczego). ⚠ To jest TYLKO hurtbox (walka); ciało fizyczne (`bodyWidth`)
   * nietknięte — po nim chodzi nawigacja lasu, zamknięta 2026-08-31.
   */
  hurt: { length: 27, depth: 17 },

  bodyWidth: 20,
  bodyHeight: 15,
  /** Same pack block the wolves use — he calls them, they call him. */
  pack: WOLF.pack,
  /** The duel: bite, then get out before you can answer. */
  duel: {
    /** Closes and bites from within this range (px). */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    biteRange: 25,
    /** Wind-up before the bite (ms). Short — this is a tell, not the boar's
     *  half-second invitation to walk away. */
    windupMs: 260,
    /** Tint held during the wind-up. Deliberately NOT the enrage red: one
     *  colour must not mean two different things in the same fight. */
    windupTint: 0xffd08a,
    /** The bite only lands if you are still this close when it resolves — back
     *  off (or dash) during the wind-up and it whiffs. Slightly over biteRange
     *  so a step doesn't make it a coin flip. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    biteReach: 39,
    biteDamageMin: 18,
    biteDamageMax: 26,
    /**
     * `pierce`, tak samo jak wataha — ten sam gatunek, ten sam sposób ranienia,
     * a `resolveBite` to zwyczajne ugryzienie: jeden test `dist <= biteReach`
     * w jednym momencie, jeden rzut. Gdyby zwykły wilk gryzł `pierce`, a
     * wilk-elita nie miał typu, byłby to przypadek, a nie decyzja.
     *
     * ⚠ `enrage.damageMul` mnoży rzut PRZED `takeDamage`, więc kolejność
     * mnożenie → redukcja zostaje bez zmian. Nie zamieniać miejscami.
     */
    biteDamageType: "pierce" as DamageType | null,
    /** How far he springs back after biting (px) and how long that takes (ms). */
    backstepPx: 128,
    backstepMs: 260,
    /** Gap between bites (ms) — the window you actually get to hit him in. */
    cooldownMs: 1750,
  },
  /** Second act: below this fraction of max HP he stops retreating entirely. */
  enrage: {
    hpFraction: 0.4,
    /** Multipliers applied once enraged. */
    speedMul: 1.22,
    damageMul: 1.25,
    /** Bites come this much sooner (multiplier on `duel.cooldownMs`). */
    cooldownMul: 0.62,
    /** Tint while enraged — the same "read this and react" language the boar's
     *  telegraph uses, so the colour keeps meaning one thing. */
    tint: 0xff5533,
  },
} as const;

/**
 * **Pająk sieciarz** — the first enemy that does not fight by touching you.
 *
 * Every creature before this one closed the distance and dealt contact damage;
 * they differed in speed, HP and one telegraph. That made positioning a single
 * question ("am I in its face or not?") and left the whole roster speaking one
 * verb. The spider inverts it: it *keeps* its distance (`retreatRange` — the
 * first enemy that backs away from you) and spits web from `fireRange`.
 *
 * Its real job is not damage — the web's `damage` is deliberately small. It is
 * a SUPPORT enemy: the web slows the player, which is what turns the boar's
 * dodgeable charge into an undodgeable one and lets a wolf pack stay on top of
 * you. That is why two of the three sit inside a boar's aggro radius on the map
 * and one sits alone: the lone one teaches what the web does, the pair teaches
 * why it matters. This is also the roster's first "kill the caster first"
 * lesson, which no amount of extra HP on an existing enemy could have taught.
 *
 * Counterplay is built in and worth keeping: the web does not track (it commits
 * to where you stood when it was fired, so strafing beats it), it is destroyed
 * by terrain, and **Unik ignores the slow entirely** — the dash moves a fixed
 * distance over a fixed time, so it is the clean answer to being webbed.
 */
export const SPIDER = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * Nisko NIE dlatego, że słaby — dlatego, że jako JEDYNY unika wymiany
   *  (`ranged.retreatRange`). Stworzenie, które nie staje do ciosu, nie uczy
   *  ciosu. ⚠ Jego pocisk jest POZA warstwą 2; to pole rusza tylko kontakt.
   */
  proficiency: 34,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Sieciarz jako JEDYNY unika wymiany (`retreatRange`, sieć-pocisk).
   *  Stworzenie, które nie staje do ciosu, nie jest sparingpartnerem — ale
   *  praktyka i tak od niego płynie, dopóki `ρ > 0,8` (§14b). */
  teachingRole: false,
  hp: 42,
  xpReward: 55,
  /** Touching one barely hurts — it is not a melee threat and must not read as
   *  one, or players will treat it like every other enemy and ignore the web. */
  touchDamageMin: 3,
  touchDamageMax: 5,
  touchDamageCooldown: 1.2,
  /** Bez typu — dokładnie z tego samego powodu, dla którego te liczby są tak
   *  małe. Config mówi wyżej wprost, że dotyk pająka ma się NIE czytać jako
   *  zagrożenie; dokładanie precyzji tam, gdzie projekt jej celowo nie chce,
   *  nic nie kupuje. Patrz też `WEB_PROJECTILE.damageType`. */
  touchDamageType: null as DamageType | null,
  patrolSpeed: 26,
  /** Only used to shuffle back into firing position; it never charges you. */
  chaseSpeed: 62,
  aggroRange: 230,
  deAggroRange: 380,
  patrolRadius: 40,
  respawnDelay: 14,
  respawnJitter: 6,
  respawnSafeRadius: 120,
  scale: 1.7,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: z ASSETS.spider.face (`tools/combat_geometry.mjs`, sekcja A).

   */
  hurt: { length: 28, depth: 22 },

  bodyWidth: 18,
  bodyHeight: 12,
  ranged: {
    /** Spits from within this distance (px). Sits just above its own aggro
     *  gap so it opens fire about when it notices you. */
    fireRange: 220,
    /** Closer than this and it retreats instead of shooting — the kiting that
     *  makes it a positioning problem rather than a punching bag. */
    retreatRange: 96,
    /** Speed (px/s) while backing away. Slower than the player's 150 on
     *  purpose: it must be catchable, just annoying to catch. */
    retreatSpeed: 84,
    /** Wind-up before the spit (ms) — the tell that lets you start strafing. */
    windupMs: 420,
    /** Gap between spits (ms) + random extra, so a nest doesn't volley. */
    cooldownMs: 2600,
    cooldownJitterMs: 900,
    /** Tint held during the wind-up. */
    telegraphTint: 0xcfe8a0,
  },
} as const;

/** The spider's web projectile. Damage is almost incidental — the slow is the
 *  weapon (see the SPIDER note above). */
export const WEB_PROJECTILE = {
  speed: 210,
  damageMin: 4,
  damageMax: 7,
  /**
   * ⚠ **Bez typu, i to jest decyzja, a nie luka w rollout'cie.**
   *
   * Trzy powody, każdy osobny:
   *  1. **Sieć nie jest atakiem obrażeniowym.** Bronią jest `slowFactor`;
   *     4–7 obrażeń to reszta po zaokrągleniu. Różnica między pełną skórą bez
   *     typu (35,1%) a `pierce` (19,5%) to na tych liczbach **3 vs 5 HP** —
   *     poniżej progu, na którym cokolwiek widać, zwłaszcza że gracz nie ma
   *     dziś popupu z otrzymanymi obrażeniami.
   *  2. **`slash`/`pierce`/`blunt` nie opisuje oplątania.** Każdy wybór byłby
   *     arbitralny, a ten najbardziej kuszący (`pierce`, „lepki kolec") pchałby
   *     dyskusję ku czwartemu typowi — a ten jest świadomie zaparkowany.
   *  3. **Spójność z chityną.** Pająk jest dziś nieotypowany w OBIE strony
   *     (nie ma pancerza i nie zadaje typowanych obrażeń). To stan czysty;
   *     otypowanie jednej połowy zrobiłoby z niego przypadek połowiczny.
   */
  damageType: null as DamageType | null,
  /** Movement multiplier applied to the player on hit (0.55 = 45% slower). */
  slowFactor: 0.55,
  slowMs: 2600,
  /** Despawns after this long (ms) if it hits nothing — a stray web must not
   *  cross the whole map. At 210px/s this is roughly `fireRange` of travel. */
  lifetimeMs: 1300,
  /** Physics body radius (px); the visible sprite is a touch larger. */
  bodyRadius: 6,
  color: 0xe8f0d8,
  /** Buffs-snapshot id for the slow it applies, so re-webbing refreshes the
   *  same entry instead of stacking a second one. */
  buffId: "web-slow",
  name: "Pajęczyna",
} as const;

/**
 * **Skoczek jadowity** — pierwszy pająk walczący w zwarciu i pierwszy stwór,
 * którego zagrożenie NARASTA w trakcie walki zamiast być stałe.
 *
 * Pytanie, które zadaje graczowi: *„ile jeszcze ukąszeń zniesiesz, zanim
 * opłaci ci się przerwać własny atak?"*. To jedyny przeciwnik zbudowany wprost
 * pod trzy rzeczy, które combat już ma i które dotąd pracowały osobno:
 * targetowanie, uzbrojony autoatak i **ukorzenienie po zamachu**. Tell trwa
 * dłużej niż root, więc reakcja na telegraf jest naprawdę dostępna — ale
 * kosztuje zamach, i to jest cała decyzja.
 *
 * ⚠ **Liczby są policzone, nie wyczute — a policzone zostały, bo pierwsza
 * wersja ich nie przeszła.** Przy pierwotnej propozycji (46 → wtedy 34 HP,
 * `cooldownMs` 1800) ukąszenie padało co 2280 ms przy walce trwającej
 * 0,6–2,1 s, więc gracz **zawsze** widział dokładnie jeden stos: mechanika
 * trzech stosów nie była „słabo widoczna", tylko nie istniała. Pełny pomiar
 * (wszystkie sześć broni × Siła 0/2/4, gra zachłanna i poprawna, pojedynczo
 * i w parze) jest w `docs/pajak_jadowity_koncepcje.md`. Trzy wnioski, które
 * trzeba znać, zanim ruszy się którąkolwiek z tych liczb:
 *
 *  1. **Trzy stosy są stanem STARCIA, nie pojedynku.** Żeby pojedynczy skoczek
 *     dożył do trzeciego ukąszenia, musiałby mieć 68–96 HP zależnie od broni
 *     gracza — czyli tyle co dzik (95). To by go zamieniło w zupełnie innego
 *     przeciwnika. Dlatego: **samotny daje 1–2 stosy, para daje 3.** Ta sama
 *     struktura, którą ma sieciarz: jeden uczy, para pokazuje po co.
 *  2. **`cooldownMs` liczy się OD UKĄSZENIA, a pełny cykl to
 *     `cooldownMs + windupMs`** (700 + 480 = 1180 ms). Kolejne stosy lądują
 *     w 0,48 s / 1,66 s / 2,84 s od wejścia w zasięg. Zmiana samego tellu
 *     przesuwa więc cały rytm, nie tylko okno reakcji.
 *  3. **Para nie jest „szczelna" i nie wolno jej taką zrobić.** Uchylenie się
 *     mieści się prawie w całości w naturalnej przerwie między końcem roota
 *     a kolejnym dozwolonym zamachem (270–370 ms), więc kosztuje 43–63 ms
 *     tempa (młot: zero). Trudność pary jest **przestrzenna** — dwa kierunki
 *     zagrożenia naraz — a nie czasowa, i ma być testem focusowania i
 *     zarządzania pozycją, **nigdy testem posiadania młota albo Uniku**.
 *     Jeśli para okaże się za trudna, poprawia się ROZSTAWIENIE, a dopiero
 *     potem obrażenia.
 */
export const VENOM_SPIDER = {
  /**
   * **Biegłość (Proficiency) — warstwa 2 rozstrzygania ataku.** Zamknięte
   * w sesji 5, `docs/systemy/proficiency.md` Sufit nauczyciela = P/0,8.
   *
   * 2–3 obrażeń dotyku, a jest przerażający — groza siedzi w JADZIE i szybkości,
   *  nie w tej liczbie. Wysoko, bo wypad jest krótki i celowany, a jad musi
   *  wejść W KONTAKCIE: nośnik testu „mały cios, wielki strach" z §3.
   */
  proficiency: 54,
  /** Czy zobowiązujemy się utrzymywać go jako SPARING (§14b). Skoczek — najsłabszy z nauczycieli i przez to WIĄŻĄCY dla marginesu
   *  manekina R2 (×1,59 przy `P = 25`). */
  teachingRole: true,
  hp: 46,
  xpReward: 40,
  /**
   * ⚠ Dotyk celowo szczątkowy i **nie jest kanałem ataku** — skoczek zatrzymuje
   * się w `bite.range` (58 px) i nigdy nie wchodzi w gracza, więc overlap
   * odpala się tylko wtedy, gdy gracz sam na niego wejdzie. U dzika kontakt to
   * 54% surowego outputu i dlatego musiał dostać typ na obu kanałach; tutaj
   * odwrotnie — cała stawka ma siedzieć w telegrafowanym ukąszeniu, żeby
   * decyzja gracza dotyczyła tellu, a nie ocierania się o hitbox.
   */
  touchDamageMin: 2,
  touchDamageMax: 3,
  touchDamageCooldown: 1.4,
  touchDamageType: null as DamageType | null,
  patrolSpeed: 34,
  /** Wolniej niż wilk (115): to nie jest szybki wilk, tylko coś, co dochodzi
   *  i kąsa. Wolniej też niż gracz (150), więc odejście zawsze działa. */
  chaseSpeed: 96,
  aggroRange: 150,
  deAggroRange: 300,
  patrolRadius: 48,
  respawnDelay: 15,
  respawnJitter: 6,
  respawnSafeRadius: 110,
  /** Bez pancerza — chityna czeka na własny, TRZECI typ ochrony
   *  (`docs/odlozone.md`). `metal` jest materiałem, nie klasą „sztywny". */
  scale: 1.5,
  /**
   * **Ślad stopy w rzucie z góry (px TEKSTURY, ×`scale` daje świat).**
   *
   * ⚠ **To NIE jest `bodyWidth`/`bodyHeight`.** Tamto jest ciałem FIZYCZNYM
   * (czym stworzenie się rozpycha), to jest hurtboxem (gdzie da się je
   * trafić). Nie muszą być równe i u kilku gatunków celowo nie są — patrz
   * `docs/systemy/combat.md`, Faza 1B.
   *
   * `length` = widok z BOKU (od nosa do zadu), `depth` = widok z PRZODU.
   * Obie są POZIOME: wysokość sprite'a to perspektywa, nie zajmowana
   * powierzchnia, i pomylenie tych dwóch rzeczy raz już przestroiło progi.
   * Źródło: z ASSETS.venomSpider.face (`tools/combat_geometry.mjs`, sekcja A).

   */
  hurt: { length: 24, depth: 18 },

  bodyWidth: 16,
  bodyHeight: 11,
  bite: {
    /** Podchodzi na tyle blisko, żeby stać w zasięgu miecza (68) — inaczej
     *  nie dałoby się go bić bez wchodzenia pod ukąszenie. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    range: 27,
    /** ⚠ Musi być DŁUŻSZY niż ukorzenienie po zamachu (180–280 ms) plus
     *  przejście poza `reach` (~167 ms przy 150 px/s). Zmierzony margines:
     *  33 ms dla młota, 83–133 ms dla reszty. Skrócenie tellu poniżej ~450 ms
     *  zabiera graczowi z młotem możliwość reakcji w ogóle. */
    windupMs: 480,
    windupTint: 0xa8d84f,
    /** Zasięg sprawdzany PONOWNIE w chwili trafienia (wzorzec Szarego), więc
     *  odejście w trakcie tellu naprawdę kończy się pudłem. */
    /** ⚠ **PRZEŚWIT (px między powierzchniami hurtboxów), NIE dystans środków.** Jednostka zmieniona w Fazie 1B — ta sama nazwa niesie dziś inną wielkość niż przed 2026-08-23. Przelicznik i wszystkie stare wartości: `docs/systemy/combat.md`, Faza 1B-a. */
    reach: 40,
    /** ⚠ Ścięte z 4–6 po pomiarze: para przy 4–6 kosztowała 43–66 HP przy
     *  100 HP bazowych i blokadzie regeneracji na ~11 s, czyli była o krok od
     *  śmierci za wejście w zwykłego moba. */
    damageMin: 3,
    damageMax: 5,
    /** Kły to przebicie. Skóra przepuszcza `pierce` (0,45), stal nie — pierwszy
     *  powód, żeby na wschód iść w stali, a nie w skórze. */
    damageType: "pierce" as DamageType | null,
    /** Od UKĄSZENIA do początku kolejnego tellu — patrz punkt 2 wyżej. */
    cooldownMs: 700,
    /** Okno bezkarnego kontrataku zaraz po ukąszeniu. */
    recoverMs: 300,
  },
  venom: {
    buffId: "venom",
    name: "Jad",
    /** Obrażenia na tick = `damagePerStack × liczba stosów`. */
    damagePerStack: 2,
    tickMs: 1500,
    /** Odświeżany przy każdym ukąszeniu, NIE sumowany — inaczej para trzymałaby
     *  gracza w jadzie w nieskończoność. Odświeżenie nie przesuwa też zegara
     *  ticków, bo szybkie ukąszenia mogłyby odsuwać obrażenia bez końca. */
    durationMs: 6000,
    maxStacks: 3,
  },
} as const;

/**
 * Kęs skoczka jako AKCJA (Faza 2 Combat v2) — te same liczby co
 * `VENOM_SPIDER.bite`, tylko w kształcie, który rozumie `ActionRunner`.
 *
 * ⚠ **Świadomie NIE dubluje liczb**: wszystkie pola czytają z `VENOM_SPIDER.bite`.
 * Druga kopia `windupMs` rozjechałaby się z pierwszą przy pierwszym strojeniu,
 * a diff by tego nie pokazał — ta sama zasada, dla której `docs/` generuje się
 * z configu zamiast być przepisywane ręcznie.
 *
 * ⚠ `activeMs: 0` — kęs rozstrzyga się w JEDNYM momencie, jak u Szarego i
 * królika. Okno o niezerowej długości potrzebne będzie dopiero wypadowi wilka
 * i szarży dzika, które przelatują przez przestrzeń.
 */
export const VENOM_SPIDER_BITE_ACTION = {
  id: "venom_bite",
  // Kęs w miejscu — skoczek staje, żeby ugryźć.
  ownsBody: false,
  // Zwarcie: szczęki są tam, gdzie ciało — kopnięcie ma czym odbić.
  attackerRecoil: "onHit",
  // skoczek staje, żeby ugryźć — cios potrzebuje ciała
  attackerLunge: "onAttack",
  windupMs: VENOM_SPIDER.bite.windupMs,
  activeMs: 0,
  recoveryMs: VENOM_SPIDER.bite.recoverMs,
  cooldownMs: VENOM_SPIDER.bite.cooldownMs,
  interruptible: true,
  oncePerActive: true,
  damageMin: VENOM_SPIDER.bite.damageMin,
  damageMax: VENOM_SPIDER.bite.damageMax,
  damageType: VENOM_SPIDER.bite.damageType,
  telegraphTint: VENOM_SPIDER.bite.windupTint,
} as const;


/**
 * Item catalogue: display data + shop prices. `type` discriminates materials
 * (loot — sellable only), consumables (usable from the backpack), weapons
 * (equippable — replace the player's bare-hands damage range) and armor
 * (equippable — each piece adds Obrona/defense, see EQUIPMENT below).
 *
 * `icon` points at a tile in items.png (col, row — 32×32, no gap, see
 * public/assets/README.md for how each pick was chosen and the full sheet
 * layout). `color` is the placeholder-swatch fallback used if items.png is
 * ever missing — matches the project's "always boots" rule.
 *
 * ── About `requires` ───────────────────────────────────────────────────────
 * An optional attribute gate: heavy gear needs Siła to swing/carry. Enforced
 * once, in `Equipment.equip` (see there), and surfaced in the tooltip.
 *
 * The numbers are budgeted against the REAL point economy, which is tight:
 * attributes start at 0 and PROGRESSION.skillPointsPerLevel is 1, so a pure
 * build has Siła = level − 1 and a split build far less:
 *
 *   sword 2 · axe 4 · hammer 6 · steel 2–4 (chest is the real gate)
 *
 * ⚠ **These gates are no longer the binding constraint — gold is.** They were
 * originally set just under what a Strength-leaning character would have by the
 * time they could AFFORD the item, back when a hammer cost 80g (~18 rabbits).
 * The weapon prices were since raised roughly 2–3.5× (hammer 280g ≈ 64 rabbits
 * or 17 boars), so a pure-Siła build clears Siła 6 at level 7, long before the
 * purse does. That makes the ladder gold-paced rather than level-paced, which
 * is a legitimate design, but it is NOT what these numbers were tuned for.
 * Re-read both bullets below before touching either the gates or the prices.
 *
 * Two things these deliberately preserve:
 *   • **The dagger and all leather stay requirement-free.** There must always
 *     be a weapon and a full armour set a pure-Zręczność or pure-Kondycja
 *     character can use, because there is NO respec — a player who invested
 *     "wrong" would otherwise be permanently stuck in bare hands.
 *   • **Nothing needs Kondycja or Zręczność.** Gating the tanky armour behind
 *     Siła while Kondycja is the tank stat would be a trap; only Siła gates,
 *     and only gear whose fantasy is "heavy".
 * Raise these and re-check both bullets, not just the damage numbers.
 */
/**
 * ── TARCZE: KATALOG WYPROWADZANY Z CENTRALNYCH STAŁYCH ─────────────────────
 *
 * ⚠⚠ **39 definicji, ZERO ręcznie wpisanych liczb per pozycja.** Każda tarcza
 * bierze wartości z `SHIELD_BASE` (baza konstrukcji × materiału) przemnożonej
 * przez `SHIELD_VARIANT` (mnożniki wariantu). Strojenie jednej konstrukcji
 * przestraja wszystkie jej warianty i materiały naraz — i **nie da się ich
 * rozjechać**, bo nie istnieje miejsce, w którym stałyby osobno.
 *
 * To jest ten sam kształt, którym gatunek metalu (`ARMOR_MATERIAL`) obsługuje
 * żelazo: żelazna sztuka deklaruje TE SAME liczby co stalowa, a różnicę robi
 * mnożnik. Dlatego niżej **nie ma bloku żelaza** — jest `metal`, a żelazne
 * tarcze dokładają wyłącznie `material: "iron"`.
 *
 * ⛔ **Wariant NIE dostaje własnej właściwości** (`B1`, 2026-09-16). Ciężki
 * znaczy wyłącznie *więcej tego samego materiału*: masa, PP, redukcja,
 * trwałość, wysiłek, cena. Żadnej odporności na odrzut, przebicia bloku ani
 * bonusu sytuacyjnego — to byłby wariant wzmocniony, którego nie modelujemy.
 *
 * ⛔ **Wariant NIGDY nie rusza geometrii.** `fullArcDeg`/`sideArcDeg` należą do
 * KONSTRUKCJI i dziś nie stoją na przedmiocie w ogóle — `T-1` jest niezrobione,
 * a `B3` czeka na pomiar `P1`. Wszystkie tarcze działają na globalnych
 * `SHIELD.fullArcDeg`/`sideArcDeg`. ⚠ **To jest stan przejściowy, nie decyzja.**
 *
 * Pełny katalog i wyprowadzenie: `docs/tarcze_katalog.md`; parametry startowe
 * i ich uzasadnienie: `docs/tarcze_checkpoint.md` §1.1–§1.6.
 */
/**
 * ⚠⚠ **`light` NIE JEST dostępny dla każdej konstrukcji — i to jest DECYZJA,
 * nie luka** (autor, 2026-09-16). Dziś niesie go **wyłącznie Legionowa**.
 *
 * ⛔ Odrzucone i **nie wracają bez nowego argumentu**:
 *   • **puklerz** — oszczędza 0,4 kg, czyli mniej, niż Model D w ogóle widzi
 *     (`speedFreeKg`/`regenFreeKg` = 10 kg), a przy tym obniża `blockCapacity`
 *     i PODNOSI koszt wysiłku za punkt. Jednostronne pogorszenie za zero.
 *   • **okrągła** — wciska się między ciężki puklerz a zwykłą okrągłą i nie
 *     wygrywa z żadnym z nich; geometria (jej tożsamość) nie zależy od wariantu.
 *   • **rycerska** — ⚠ wariant ANTY-TOŻSAMOŚCIOWY: zbija `reduction`, czyli
 *     dokładnie to, po co tę konstrukcję się bierze. Ten sam argument, którym
 *     katalog odrzucił lekką migdałową.
 *   • **pawęż** — ⛔ zamknięte wcześniej (`docs/tarcze_checkpoint.md` §1.4):
 *     przy ~9 kg zlewa się ze zwykłą legionową, a para legionowa ↔ pawęż
 *     przechodzi test niedominacji TYLKO dzięki `D-T2`.
 *
 * ⭐ **Legionowa zostaje z trzech powodów naraz:** różnica to 2,2 kg i `swingMul`
 * 1,42 → 1,32 (dziesięć punktów tempa — najbardziej odczuwalna oś w walce),
 * lżejsza wersja leży NA jej osi tożsamości (*duży łuk przy zachowanej zdolności
 * walki*), a `heavy` ma zakazany — bez `light` straciłaby oś wariantu w całości.
 *
 * ⚠ Mnożniki `light` zostają w konfigu — są używane i nie ma powodu ich ruszać.
 */
export const SHIELD_VARIANT = {
  /**
   * ⚠⚠ **`swingExcess` mnoży NADWYŻKĘ ponad 1,0, nie samą wartość** — i to nie
   * jest kosmetyka. Przy mnożeniu wartości lekka tarcza okrągła dostałaby
   * `1,18 × 0,75 = 0,89`, czyli **przyspieszałaby zamach**, a ciężka pawęż
   * wyszłaby na 2,50. Na nadwyżce: lekka okrągła `1 + 0,18×0,75 = 1,14`,
   * ciężka pawęż `1 + 0,85×1,35 = 2,15`.
   */
  light: { weight: 0.75, defense: 0.85, reduction: 0.92, durability: 0.8,
           staminaCost: 0.85, swingExcess: 0.75, strength: -1, priceMul: 0.8 },
  regular: { weight: 1, defense: 1, reduction: 1, durability: 1,
             staminaCost: 1, swingExcess: 1, strength: 0, priceMul: 1 },
  heavy: { weight: 1.35, defense: 1.2, reduction: 1.1, durability: 1.3,
           staminaCost: 1.2, swingExcess: 1.35, strength: 1, priceMul: 1.25 },
} as const;

/**
 * **`B4` — cena wariantu jest WYLICZANA, nie wpisywana.** Czwarty czynnik
 * w istniejącym iloczynie `buyPriceOf`:
 *
 *   `buyPrice × materialPriceMul × variantPriceMul × qualityPriceMul`
 *
 * ⏳ **Wartości 0,80 / 1,25 są STARTOWE i świadomie tymczasowe** (decyzja
 * autora 2026-09-16: `B4` zamyka MODEL, nie liczbę). Kalibracja ekonomii
 * przyjdzie osobno — do tego czasu jest to jedno miejsce do zmiany.
 */
export function variantPriceMul(w: keyof typeof SHIELD_VARIANT | null): number {
  return w ? SHIELD_VARIANT[w].priceMul : 1;
}

/**
 * Baza konstrukcji × materiału. ⚠ **`metal` to poziom STALI** — tak jak cały
 * katalog pancerza. Żelazo nie ma tu wiersza: dokłada `material: "iron"`
 * i schodzi mnożnikami `ARMOR_MATERIAL.iron` (PP ×0,80, cena ×0,60).
 *
 * ⚠ `wood.buckler` i `metal.round` są DOKŁADNYMI kopiami liczb istniejących
 * `ITEMS.buckler` i `ITEMS.ironbound_shield` — te dwa przedmioty zostały
 * świadomie nietknięte (decyzja autora 2026-09-16), a baza musi się z nimi
 * zgadzać, żeby ich warianty lekki i ciężki wychodziły z tego samego pnia.
 * Pilnuje tego zamek §V w `tools/tarcze_przymiar.mjs`.
 *
 * ⛔ **Trzy nierówności nietykalne** (`docs/tarcze_katalog.md` §2):
 *   `reduction(almond) < reduction(heater)` · `reduction(pavise) < reduction(heater)`
 *   oraz `swingMul(pavise)` = skrajny.
 */
export const SHIELD_BASE = {
  wood: {
    buckler: { weight: 1.5, defense: 4, reduction: 0.3, swingMul: 1.08, staminaCost: 3, durability: 50, buyPrice: 50, sellPrice: 20, strength: 0 },
    round: { weight: 4.5, defense: 7, reduction: 0.45, swingMul: 1.18, staminaCost: 5, durability: 80, buyPrice: 90, sellPrice: 36, strength: 0 },
    heater: { weight: 5.5, defense: 9, reduction: 0.55, swingMul: 1.26, staminaCost: 6, durability: 110, buyPrice: 120, sellPrice: 48, strength: 3 },
    almond: { weight: 6.5, defense: 9, reduction: 0.47, swingMul: 1.32, staminaCost: 6, durability: 185, buyPrice: 140, sellPrice: 56, strength: 3 },
    scutum: { weight: 9, defense: 12, reduction: 0.5, swingMul: 1.42, staminaCost: 8, durability: 150, buyPrice: 175, sellPrice: 70, strength: 4 },
    pavise: { weight: 12, defense: 16, reduction: 0.42, swingMul: 1.85, staminaCost: 11, durability: 220, buyPrice: 165, sellPrice: 66, strength: 5 },
  },
  metal: {
    buckler: { weight: 2, defense: 6, reduction: 0.33, swingMul: 1.1, staminaCost: 3, durability: 110, buyPrice: 130, sellPrice: 52, strength: 1 },
    // ⚠ `strength: 3` nie jest wyczuciem — to jest liczba z istniejącego
    //   `ITEMS.ironbound_shield`, który JEST tą komórką katalogu. Przy 0 żelazna
    //   i stalowa okrągła (ta sama masa, ten sam kształt) nie wymagałyby NICZEGO,
    //   a leżący obok nich „tej samej” puklerz okuty — Siły 3. Złapane audytem
    //   2026-09-16; zamek §V1 tego nie widział, bo nie porównywał `requires`.
    round: { weight: 5, defense: 8, reduction: 0.45, swingMul: 1.2, staminaCost: 5, durability: 90, buyPrice: 220, sellPrice: 88, strength: 3 },
    heater: { weight: 6, defense: 11, reduction: 0.58, swingMul: 1.28, staminaCost: 6, durability: 200, buyPrice: 300, sellPrice: 120, strength: 3 },
    almond: { weight: 7, defense: 11, reduction: 0.5, swingMul: 1.34, staminaCost: 6, durability: 280, buyPrice: 330, sellPrice: 132, strength: 4 },
    scutum: { weight: 10, defense: 14, reduction: 0.53, swingMul: 1.45, staminaCost: 8, durability: 260, buyPrice: 380, sellPrice: 152, strength: 5 },
  },
} as const;

type BazaTarczy = keyof typeof SHIELD_BASE;
type KonstrukcjaTarczy = keyof (typeof SHIELD_BASE)["wood"];
type WariantTarczy = keyof typeof SHIELD_VARIANT;
/** ⚠ Kształt STRUKTURALNY, nie `typeof` konkretnego wiersza — `as const` robi
 *  z liczb typy literalne, więc `typeof SHIELD_BASE.wood.buckler` znaczyłoby
 *  „waga dokładnie 1,5” i żaden inny wiersz by się nim nie opisał. */
/**
 * **Geometria osłony per KONSTRUKCJA — mechanizm, nie kalibracja (`T-1`).**
 *
 * ⛔⛔ **TEN REJESTR JEST CELOWO PUSTY i to jest STAN, nie luka.** Wartości
 * `fullArcDeg` per konstrukcja rozstrzyga `B3`, a `B3` **czeka na pomiar `P1`**
 * (rozkład kątów ciosów w realnej rozgrywce). Wpisanie tu czegokolwiek przed
 * `P1` byłoby dobraniem liczby pod tezę — dokładnie tym, przed czym broni
 * reguła odczytu zarejestrowana PRZED danymi (`docs/tarcze_checkpoint.md`).
 *
 * ⭐ **Czego ten rejestr dowodzi już dziś:** że geometria JEST adresowalna per
 * konstrukcja i że cała ścieżka `konstrukcja → profil → BlockSpec → resolver`
 * działa. Po `P1` kalibracja `B3` to **dopisanie wierszy tutaj** — zero zmian
 * w `Protection`, `DamageResolver`, `Equipment` i w 30 definicjach tarcz.
 *
 * ⚠ Brak wiersza znaczy **fallback na globalne `SHIELD.fullArcDeg`/`sideArcDeg`**,
 * czyli dzisiejsze 60°/100° — zachowanie bit w bit takie jak przed `T-1`.
 * Pilnuje tego regresja `tools/combat_regresja.mjs` (121 przypadków).
 *
 * ⛔ **Wariant NIGDY tu nie wchodzi.** Łuk należy do konstrukcji; ciężka pawęż
 * kryje tyle samo stopni co zwykła. To jest niezmiennik z `§1.2` checkpointu
 * i pilnuje go zamek §G.
 */
export const SHIELD_GEOMETRY: Partial<
  Record<KonstrukcjaTarczy, { readonly fullArcDeg: number; readonly sideArcDeg: number }>
> = {
  // ⏳ `B3` — puste do czasu `P1`. Patrz komentarz wyżej.
};

type WierszBazy = {
  readonly weight: number; readonly defense: number; readonly reduction: number;
  readonly swingMul: number; readonly staminaCost: number; readonly durability: number;
  readonly buyPrice: number; readonly sellPrice: number; readonly strength: number;
};

/** Liczby jednej tarczy = baza × mnożniki wariantu. Jedyne miejsce, w którym
 *  ta arytmetyka istnieje — dlatego nie da się jej rozjechać między pozycjami. */
function statTarczy(baza: BazaTarczy, k: KonstrukcjaTarczy, w: WariantTarczy) {
  const b = (SHIELD_BASE[baza] as Record<string, WierszBazy>)[k];
  const v = SHIELD_VARIANT[w];
  const zaokr = (x: number, m: number) => Math.round(x * m) / m;
  return {
    weight: zaokr(b.weight * v.weight, 10),
    defense: Math.max(1, Math.round(b.defense * v.defense)),
    durability: Math.round(b.durability * v.durability),
    block: {
      reduction: zaokr(b.reduction * v.reduction, 100),
      // ⚠ NADWYŻKA, nie wartość — patrz komentarz przy `SHIELD_VARIANT`.
      swingMul: zaokr(1 + (b.swingMul - 1) * v.swingExcess, 100),
      staminaCost: Math.max(1, Math.round(b.staminaCost * v.staminaCost)),
    },
    // ⚠ Cena BAZOWA konstrukcji — `materialPriceMul` i `variantPriceMul`
    //   dokłada `buyPriceOf`, żeby oś była policzona w JEDNYM miejscu.
    buyPrice: b.buyPrice,
    sellPrice: b.sellPrice,
  };
}

/**
 * Bramka Siły: pochodna masy, więc wariant przesuwa ją o ±1.
 *
 * ⚠⚠ **OBECNOŚĆ pola `requires` na pozycji jest ZAPIEKANA, a nie liczona** — wpis
 * albo je ma, albo nie. Ta funkcja liczy tylko WARTOŚĆ. Skutek złapany audytem
 * 2026-09-16: podniesienie `SHIELD_BASE.metal.round.strength` z 0 na 3 **nie
 * dodało pola** dwóm pozycjom, które wygenerowały się bez niego, więc żelazna
 * i stalowa okrągła dalej nie wymagały niczego. ⛔ **Podnosząc `strength` w bazie
 * z zera, sprawdź, czy każda pozycja tej konstrukcji faktycznie NIESIE `requires`.**
 */
function wymogTarczy(baza: BazaTarczy, k: KonstrukcjaTarczy, w: WariantTarczy): number {
  const b = (SHIELD_BASE[baza] as Record<string, WierszBazy>)[k];
  return Math.max(0, b.strength + SHIELD_VARIANT[w].strength);
}

/**
 * ⚠ **PLACEHOLDERY ASSETÓW — świadome i oznaczone (2026-09-16).** Własną ikonę
 * i model 3D mają dziś WYŁĄCZNIE puklerz i tarcza okuta. Pozostałe cztery
 * konstrukcje pożyczają ikonę tarczy okutej, a w `tools/char3d_shields.py`
 * nie mają modelu w ogóle — `Character3D` zgłasza to przez `console.warn`
 * i zostawia **pustą lewą dłoń**. ⛔ To NIE jest błąd do naprawienia liczbami:
 * czeka na osobny pass artystyczny. Audyt: `docs/tarcze_katalog.md`.
 */
/**
 * ⚠ **`construction` jest KLASYFIKACJĄ, nie balansem.** Nie niesie żadnej
 * liczby — jest adresem do `SHIELD_GEOMETRY` (`T-1`) i jedynym miejscem,
 * w którym przedmiot mówi, czym JEST. Bez niego geometria per konstrukcja
 * musiałaby być zgadywana z `id`, a to jest rozjazd czekający na pierwszą
 * zmianę nazwy.
 */
/**
 * ⚠ **`construction` jest KLASYFIKACJĄ, nie balansem.** Nie niesie żadnej
 * liczby — jest adresem do `SHIELD_GEOMETRY` (`T-1`) i jedynym miejscem,
 * w którym przedmiot mówi, czym JEST. Bez niego geometria per konstrukcja
 * musiałaby być zgadywana z `id`, a to jest rozjazd czekający na pierwszą
 * zmianę nazwy.
 */
const SHIELD_ITEMS = {
  wood_buckler_heavy: {
    id: "wood_buckler_heavy",
    construction: "buckler",
    ...statTarczy("wood", "buckler", "heavy"),
    armorType: "leather",
    name: "Ciężki drewniany puklerz",
    type: "armor",
    slot: "offhand",
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-buckler",
    color: 0x8a5a2f,
    size: "maly",
    variant: "heavy",
    requires: { strength: wymogTarczy("wood", "buckler", "heavy") },
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  iron_buckler: {
    id: "iron_buckler",
    construction: "buckler",
    ...statTarczy("metal", "buckler", "regular"),
    armorType: "metal",
    material: "iron",
    name: "Żelazny puklerz",
    type: "armor",
    slot: "offhand",
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-iron-buckler", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "maly",
    requires: { strength: wymogTarczy("metal", "buckler", "regular") },
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  iron_buckler_heavy: {
    id: "iron_buckler_heavy",
    construction: "buckler",
    ...statTarczy("metal", "buckler", "heavy"),
    armorType: "metal",
    material: "iron",
    name: "Ciężki żelazny puklerz",
    type: "armor",
    slot: "offhand",
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-iron-buckler", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "maly",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "buckler", "heavy") },
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  steel_buckler: {
    id: "steel_buckler",
    construction: "buckler",
    ...statTarczy("metal", "buckler", "regular"),
    armorType: "metal",
    material: "steel",
    name: "Stalowy puklerz",
    type: "armor",
    slot: "offhand",
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-steel-buckler", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x9aa4b0,
    size: "maly",
    requires: { strength: wymogTarczy("metal", "buckler", "regular") },
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  steel_buckler_heavy: {
    id: "steel_buckler_heavy",
    construction: "buckler",
    ...statTarczy("metal", "buckler", "heavy"),
    armorType: "metal",
    material: "steel",
    name: "Ciężki stalowy puklerz",
    type: "armor",
    slot: "offhand",
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-steel-buckler", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x9aa4b0,
    size: "maly",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "buckler", "heavy") },
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  wood_round_shield: {
    id: "wood_round_shield",
    construction: "round",
    ...statTarczy("wood", "round", "regular"),
    armorType: "leather",
    name: "Drewniana tarcza okrągła",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-round",
    color: 0x8a5a2f,
    size: "duzy",
    description: "Okrągła deska z umbem. Możesz się obracać, a ona i tak zdąży stanąć między tobą a ciosem.",
  },
  wood_round_shield_heavy: {
    id: "wood_round_shield_heavy",
    construction: "round",
    ...statTarczy("wood", "round", "heavy"),
    armorType: "leather",
    name: "Ciężka drewniana tarcza okrągła",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-round",
    color: 0x8a5a2f,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("wood", "round", "heavy") },
    description: "Okrągła deska z umbem. Możesz się obracać, a ona i tak zdąży stanąć między tobą a ciosem.",
  },
  iron_round_shield: {
    id: "iron_round_shield",
    construction: "round",
    ...statTarczy("metal", "round", "regular"),
    armorType: "metal",
    material: "iron",
    name: "Żelazna tarcza okrągła",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-round", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "round", "regular") },
    description: "Okrągła deska z umbem. Możesz się obracać, a ona i tak zdąży stanąć między tobą a ciosem.",
  },
  iron_round_shield_heavy: {
    id: "iron_round_shield_heavy",
    construction: "round",
    ...statTarczy("metal", "round", "heavy"),
    armorType: "metal",
    material: "iron",
    name: "Ciężka żelazna tarcza okrągła",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-round", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "round", "heavy") },
    description: "Okrągła deska z umbem. Możesz się obracać, a ona i tak zdąży stanąć między tobą a ciosem.",
  },
  steel_round_shield_heavy: {
    id: "steel_round_shield_heavy",
    construction: "round",
    ...statTarczy("metal", "round", "heavy"),
    armorType: "metal",
    material: "steel",
    name: "Ciężka stalowa tarcza okrągła",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-steel-round", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x9aa4b0,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "round", "heavy") },
    description: "Okrągła deska z umbem. Możesz się obracać, a ona i tak zdąży stanąć między tobą a ciosem.",
  },
  wood_heater_shield: {
    id: "wood_heater_shield",
    construction: "heater",
    ...statTarczy("wood", "heater", "regular"),
    armorType: "leather",
    name: "Drewniana tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-heater",
    color: 0x8a5a2f,
    size: "duzy",
    requires: { strength: wymogTarczy("wood", "heater", "regular") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  wood_heater_shield_heavy: {
    id: "wood_heater_shield_heavy",
    construction: "heater",
    ...statTarczy("wood", "heater", "heavy"),
    armorType: "leather",
    name: "Ciężka drewniana tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-heater",
    color: 0x8a5a2f,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("wood", "heater", "heavy") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  iron_heater_shield: {
    id: "iron_heater_shield",
    construction: "heater",
    ...statTarczy("metal", "heater", "regular"),
    armorType: "metal",
    material: "iron",
    name: "Żelazna tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-heater", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "heater", "regular") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  iron_heater_shield_heavy: {
    id: "iron_heater_shield_heavy",
    construction: "heater",
    ...statTarczy("metal", "heater", "heavy"),
    armorType: "metal",
    material: "iron",
    name: "Ciężka żelazna tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-heater", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "heater", "heavy") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  steel_heater_shield: {
    id: "steel_heater_shield",
    construction: "heater",
    ...statTarczy("metal", "heater", "regular"),
    armorType: "metal",
    material: "steel",
    name: "Stalowa tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-steel-heater", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x9aa4b0,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "heater", "regular") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  steel_heater_shield_heavy: {
    id: "steel_heater_shield_heavy",
    construction: "heater",
    ...statTarczy("metal", "heater", "heavy"),
    armorType: "metal",
    material: "steel",
    name: "Ciężka stalowa tarcza rycerska",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-steel-heater", // `tools/build_metal_shield_icons.py` (2026-10-02)
    color: 0x9aa4b0,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "heater", "heavy") },
    description: "Okuty klin. Stoisz frontem i nic nie przechodzi — ale tylko z frontu.",
  },
  wood_almond_shield: {
    id: "wood_almond_shield",
    construction: "almond",
    ...statTarczy("wood", "almond", "regular"),
    armorType: "leather",
    name: "Drewniana tarcza migdałowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-almond",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    requires: { strength: wymogTarczy("wood", "almond", "regular") },
    description: "Długi migdał na rzemiennej ramie. Znosi serię tam, gdzie inna pęka po trzecim ciosie.",
  },
  wood_almond_shield_heavy: {
    id: "wood_almond_shield_heavy",
    construction: "almond",
    ...statTarczy("wood", "almond", "heavy"),
    armorType: "leather",
    name: "Ciężka drewniana tarcza migdałowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-almond",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("wood", "almond", "heavy") },
    description: "Długi migdał na rzemiennej ramie. Znosi serię tam, gdzie inna pęka po trzecim ciosie.",
  },
  iron_almond_shield: {
    id: "iron_almond_shield",
    construction: "almond",
    ...statTarczy("metal", "almond", "regular"),
    armorType: "metal",
    material: "iron",
    name: "Żelazna tarcza migdałowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-almond", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "almond", "regular") },
    description: "Długi migdał na rzemiennej ramie. Znosi serię tam, gdzie inna pęka po trzecim ciosie.",
  },
  iron_almond_shield_heavy: {
    id: "iron_almond_shield_heavy",
    construction: "almond",
    ...statTarczy("metal", "almond", "heavy"),
    armorType: "metal",
    material: "iron",
    name: "Ciężka żelazna tarcza migdałowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-almond", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("metal", "almond", "heavy") },
    description: "Długi migdał na rzemiennej ramie. Znosi serię tam, gdzie inna pęka po trzecim ciosie.",
  },
  wood_scutum_light: {
    id: "wood_scutum_light",
    construction: "scutum",
    ...statTarczy("wood", "scutum", "light"),
    armorType: "leather",
    name: "Lekka drewniana tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-scutum",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    variant: "light",
    requires: { strength: wymogTarczy("wood", "scutum", "light") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  wood_scutum: {
    id: "wood_scutum",
    construction: "scutum",
    ...statTarczy("wood", "scutum", "regular"),
    armorType: "leather",
    name: "Drewniana tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-scutum",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    requires: { strength: wymogTarczy("wood", "scutum", "regular") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  iron_scutum_light: {
    id: "iron_scutum_light",
    construction: "scutum",
    ...statTarczy("metal", "scutum", "light"),
    armorType: "metal",
    material: "iron",
    name: "Lekka żelazna tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-scutum", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    variant: "light",
    requires: { strength: wymogTarczy("metal", "scutum", "light") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  iron_scutum: {
    id: "iron_scutum",
    construction: "scutum",
    ...statTarczy("metal", "scutum", "regular"),
    armorType: "metal",
    material: "iron",
    name: "Żelazna tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-scutum", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x6f7480,
    tintIcon: true,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "scutum", "regular") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  steel_scutum_light: {
    id: "steel_scutum_light",
    construction: "scutum",
    ...statTarczy("metal", "scutum", "light"),
    armorType: "metal",
    material: "steel",
    name: "Lekka stalowa tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-steel-scutum", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x9aa4b0,
    size: "duzy",
    variant: "light",
    requires: { strength: wymogTarczy("metal", "scutum", "light") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  steel_scutum: {
    id: "steel_scutum",
    construction: "scutum",
    ...statTarczy("metal", "scutum", "regular"),
    armorType: "metal",
    material: "steel",
    name: "Stalowa tarcza legionowa",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-steel-scutum", // `tools/build_metal_shield_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x9aa4b0,
    size: "duzy",
    requires: { strength: wymogTarczy("metal", "scutum", "regular") },
    description: "Wygięta deska z umbem pośrodku. Duża osłona, a mimo to da się nią uderzyć.",
  },
  wood_pavise: {
    id: "wood_pavise",
    construction: "pavise",
    ...statTarczy("wood", "pavise", "regular"),
    armorType: "leather",
    name: "Drewniana pawęż",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-pavise",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    requires: { strength: wymogTarczy("wood", "pavise", "regular") },
    description: "Wysoka deskowa ściana. Nic cię nie obejdzie, ale jesteś wozem.",
  },
  wood_pavise_heavy: {
    id: "wood_pavise_heavy",
    construction: "pavise",
    ...statTarczy("wood", "pavise", "heavy"),
    armorType: "leather",
    name: "Ciężka drewniana pawęż",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-pavise",
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x8a5a2f,
    size: "duzy",
    variant: "heavy",
    requires: { strength: wymogTarczy("wood", "pavise", "heavy") },
    description: "Wysoka deskowa ściana. Nic cię nie obejdzie, ale jesteś wozem.",
  },
} as const;

export const ITEMS = {
  rabbit_meat: {
    id: "rabbit_meat",
    name: "Mięso królicze",
    type: "material",
    color: 0xc97b5f,
    sellPrice: 3,
    /**
     * ⚠ **Czwarty samodzielny PNG obok chleba/jajek/sera** — `items.png` nie
     * ma surowego mięsa, tak jak nie miał pieczywa. Źródło (`rabbit-meat.png`,
     * wygenerowane przez GPT image) przeszło ten sam pipeline co
     * `tools/build_ikony_jedzenia.py`: przycięcie, BOX-downscale do treści
     * 26 px, kwantyzacja 85 → 4 kolorów (mieści się w zmierzonym paśmie 3–6
     * z `items.png`), twardy czarny kontur. Bez tego kroku źródło leżałoby w
     * plecaku jako jedyna ikona bez obwódki, rozmyta pod NEAREST — dokładnie
     * błąd, który ten pipeline już raz naprawiał przy serze.
     *
     * ⚠ To jest STRING, nie `ASSETS.iconRabbitMeat.key` — `ITEMS` stoi w tym
     * pliku przed `ASSETS`, ten sam powód co przy `icon-bread`.
     */
    iconTexture: "icon-rabbit-meat",
    description: "Surowe mięso z upolowanego królika. Kupcy chętnie je skupują.",
  },
  boar_hide: {
    id: "boar_hide",
    name: "Skóra dzika",
    type: "material",
    color: 0x7a5230,
    sellPrice: 12,
    /**
     * ⚠ **Siódmy samodzielny PNG w tej rodzinie** — patrz komentarz nad
     * `ITEMS.rabbit_meat.iconTexture` po cały pipeline (przycięcie,
     * BOX-downscale do treści 26 px, kwantyzacja 96 → 3 kolorów, mieści się
     * w zmierzonym paśmie 3–6 z `items.png`, twardy czarny kontur). Źródło:
     * `boar-hide.png` — nazwa już po angielsku i zgodna z `id`, bez zmian.
     */
    iconTexture: "icon-boar-hide",
    description: "Gruba skóra zdarta z dzika. Cenny surowiec — pod warunkiem, że umiesz skórować.",
  },
  wolf_pelt: {
    id: "wolf_pelt",
    name: "Wilcze futro",
    type: "material",
    color: 0x6b6f76,
    sellPrice: 10,
    /**
     * ⚠ **Szósty samodzielny PNG w tej rodzinie** — patrz komentarz nad
     * `ITEMS.rabbit_meat.iconTexture` po cały pipeline (przycięcie,
     * BOX-downscale do treści 26 px, kwantyzacja 62 → 4 kolorów, mieści się
     * w zmierzonym paśmie 3–6 z `items.png`, twardy czarny kontur). Źródło:
     * `wolf-hide.png` — nazwa już po angielsku, bez zmian przy wpięciu.
     * ⚠ Plik źródłowy NIE musi nazywać się jak `id` przedmiotu — tu
     * `wolf-hide` wiąże się z `wolf_pelt`, tak jak filename to osobna
     * decyzja od klucza gry.
     */
    iconTexture: "icon-wolf-pelt",
    description: "Gęste futro zdarte z wilka. Cenne — pod warunkiem, że umiesz skórować.",
  },
  /**
   * Najcenniejszy łup ze zwykłego (respawnującego się) przeciwnika — 22g
   * przeciw 12g za skórę dzika. To celowo ODSTAJE od reszty drabinki, bo
   * niedźwiedź ma 130 HP przeciw 95 dzika i nie ma telegrafu, którym da się
   * go rozegrać „na czysto": jedyną odpowiedzią jest wytrzymać wymianę
   * ciosów. `grey_fang` (140g) zostaje niepodważalnym szczytem — to trofeum
   * z jednorazowego zabójstwa, nie źródło dochodu.
   */
  bear_hide: {
    id: "bear_hide",
    name: "Niedźwiedzia skóra",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją. */
    iconTexture: "icon-bear-hide",
    type: "material",
    color: 0x5c3a1e,
    sellPrice: 22,
    description:
      "Ciężka, kudłata skóra. Sama się nie zdejmie — trzeba umieć skórować, i mieć po czym.",
  },
  grey_fang: {
    id: "grey_fang",
    /** Ikona od 2026-10-05 (do tej daty plamka koloru) — `tools/build_misc_icons.py`. */
    iconTexture: "icon-grey-fang",
    name: "Kieł Szarego",
    type: "material",
    color: 0xe8e6df,
    /**
     * By far the most valuable thing in the game, and deliberately so: it drops
     * from exactly one creature that does not respawn (see GREY_WOLF), so this
     * is a trophy with a price tag, not an income source. It is also the only
     * skin-type drop NOT gated behind Skórowanie — you don't skin a trophy, you
     * take it, and the one player who beats the Szary without the skill would
     * otherwise walk away from the map's biggest fight with nothing.
     */
    sellPrice: 140,
    description:
      "Wyszczerbiony kieł wilka, który okaleczył Myśliwego. Dowód, że już go tam nie ma.",
  },
  spider_silk: {
    id: "spider_silk",
    name: "Pajęcza nić",
    type: "material",
    color: 0xdfe6d0,
    sellPrice: 7,
    /**
     * ⚠ **Dziewiąty samodzielny PNG w tej rodzinie** — patrz komentarz nad
     * `ITEMS.rabbit_meat.iconTexture` po cały pipeline. Standardowy wariant
     * (nie ten dzielony po odcieniu z `venom_gland`) wystarczył: źródło jest
     * jednorodne kolorystycznie (gradient jasności szaro-beżowej, bez
     * odrębnych klastrów odcieni), więc MEDIANCUT na całym obrazie od razu
     * dał czytelny wynik (117 → 4 kolory). Źródło: `spider-silk.png` — nazwa
     * już po angielsku i zgodna z `id`, bez zmian.
     */
    iconTexture: "icon-spider-silk",
    description: "Zaskakująco mocna, wciąż lepka. Ktoś na pewno znajdzie dla niej zastosowanie.",
  },
  venom_gland: {
    id: "venom_gland",
    name: "Gruczoł jadowy",
    type: "material",
    color: 0x8fbf3f,
    sellPrice: 18,
    /**
     * ⚠ **Ósmy samodzielny PNG w tej rodzinie — jedyny, który zwykły
     * MEDIANCUT na całym obrazie renderował ŹLE, nie tylko „nie w stylu".**
     * Oliwkowo-zielona bańka jest mniejsza powierzchniowo niż brązowa
     * łodyga (125 vs 144 px po przycięciu), więc kwantyzacja całego obrazu
     * naraz oddawała cały budżet kolorów łodydze i bańka wychodziła brązowa
     * — czyli traciła jedyną cechę, która odróżnia ten przedmiot od skóry
     * dzika czy futra wilka. Naprawione podziałem PO ODCIENIU przed
     * kwantyzacją (piksele z G≈R i niskim B osobno od pikseli z R>G>B), nie
     * przez podniesienie liczby kolorów — to samo próbowano przy 6 (górna
     * granica pasma) i bańka dalej ginęła. Skrypt w scratchpadzie.
     */
    iconTexture: "icon-venom-gland",
    /** ⚠ Opis celowo NIE obiecuje zastosowania — alchemii nie ma i nie wiadomo,
     *  czy będzie. Ta sama zasada, przez którą Sobek nie obiecuje napraw: NPC
     *  ani przedmiot nie może wysyłać gracza po mechanikę, której nie ma. */
    description: "Wciąż napięty, ciepły w dotyku. Lepiej go nie przekłuwać.",
  },
  leather_scraps: {
    id: "leather_scraps",
    name: "Strzępy skóry",
    type: "material",
    color: 0x9a8a6a,
    sellPrice: 1,
    /**
     * ⚠ **Piąty samodzielny PNG w tej rodzinie** — patrz komentarz nad
     * `ITEMS.rabbit_meat.iconTexture` po cały pipeline (przycięcie,
     * BOX-downscale do treści 26 px, kwantyzacja 45 → 3 kolorów, mieści się
     * w zmierzonym paśmie 3–6 z `items.png`, twardy czarny kontur). Źródło:
     * `leather-scraps.png` — nazwa przetłumaczona z `strzepy-skory.png` przy
     * wpięciu, zgodnie z regułą „nazwy plików po angielsku" (2026-08-14).
     */
    iconTexture: "icon-leather-scraps",
    description: "Postrzępione skrawki króliczej skóry. Niemal bezwartościowe — chyba że ktoś ich potrzebuje.",
  },
  /**
   * ── ZIOŁA ────────────────────────────────────────────────────────────────
   *
   * Jedenaście **prawdziwych gatunków**, nie wymyślonych, i to jest decyzja
   * projektowa („gra bawi, gra uczy"), a nie ozdobnik. Ma z niej wynikać
   * jedna konkretna rzecz: **gracz, który nauczy się w grze, gdzie rośnie
   * krwawnik, ma to rozpoznać na prawdziwym spacerze.**
   *
   * Konsekwencja dla kodu: **prawdziwe siedlisko jest tym, co decyduje, gdzie
   * na mapie wolno postawić stanowisko** (patrz `HERBS[*].siedlisko` niżej i
   * warstwa `rosliny` w Tiled). Rozmieszczenie ziół nie jest tabelą spawnów do
   * wyważenia — jest treścią, którą trzeba postawić zgodnie z ekologią, bo
   * inaczej wskazówka Doroty („szukaj przy drogach") staje się kłamstwem, a
   * cała ta sekcja traci powód istnienia.
   *
   * Opisy trzymają ramę **w-świecie** („tak się tego u nas używa"), nigdy
   * porady medycznej dla gracza. Wiedza prawdziwa, ton wiejski.
   */
  babka: {
    id: "babka",
    name: "Babka lancetowata",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją.
     *  Ta sama konwencja co przy `rabbit_meat` i reszcie ikon. */
    iconTexture: "icon-ribwort-plantain",
    type: "material",
    color: 0x6f9c4a,
    sellPrice: 2,
    description:
      "Wąskie, żyłkowane liście z przydrożnego klepiska. Przykłada się je na otarcia i skaleczenia — rośnie akurat tam, gdzie najłatwiej się otrzeć.",
  },
  krwawnik: {
    id: "krwawnik",
    name: "Krwawnik pospolity",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją. */
    iconTexture: "icon-yarrow",
    type: "material",
    color: 0xf2f0e6,
    sellPrice: 3,
    description:
      "Pierzaste liście, a na górze płaska kępa drobnych, białych kwiatów. Nazwę wzięło stąd, że przykładane tamuje krew.",
  },
  pokrzywa: {
    id: "pokrzywa",
    name: "Pokrzywa zwyczajna",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją.
     *  Ta sama konwencja co przy `rabbit_meat` i reszcie ikon. */
    iconTexture: "icon-nettle",
    type: "material",
    color: 0x3f6b32,
    sellPrice: 2,
    description:
      "Parzy, dopóki jej nie sparzysz. Po chorobie dają ją osłabionym do picia, a z łodyg, jak je wymoczysz, wyprzędziesz nić — trzyma się obejść i gnojowników, bo lubi tłustą ziemię.",
  },
  rumianek: {
    id: "rumianek",
    name: "Rumianek pospolity",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją.
     *  Ta sama konwencja co przy `rabbit_meat` i reszcie ikon. */
    iconTexture: "icon-chamomile",
    type: "material",
    color: 0xf7f4e4,
    sellPrice: 3,
    description:
      "Drobne białe kwiaty z żółtym środkiem, pachnące jabłkiem. Napar koi brzuch i przemywa się nim oczy.",
  },
  dziurawiec: {
    id: "dziurawiec",
    name: "Dziurawiec zwyczajny",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją.
     *  Ta sama konwencja co przy `rabbit_meat` i reszcie ikon. */
    iconTexture: "icon-st-johns-wort",
    type: "material",
    color: 0xf0c93c,
    /** Najdroższe z piątki, bo rośnie najdalej od bramy — na polanach, między
     *  dzikami i pająkami. Cena jest zapisem tej drogi, nie osobnym balansem. */
    sellPrice: 6,
    description:
      "Podnieś liść pod światło — jest cały w dziurkach. Kwiaty nastawione na oleju barwią się na czerwono, u nas smaruje się nimi skórę po oparzeniu, a napar dają tym, co posmutnieli na zimę.",
  },
  /**
   * ── Sześć gatunków dodanych 2026-08-30 razem z `HERBS[*]` — dopisane tu
   * dopiero 2026-09-06 ─────────────────────────────────────────────────────
   * Miały gatunek (`HERBS`), duszek (`ASSETS.herb*`) i stanowiska na mapie
   * lasu od samego początku, ale bez wpisu tutaj zbieranie któregokolwiek
   * kończyło się błędem wykonania — `GameScene.gatherFrom` rzutuje
   * `plant.herb` na `ItemId` (`const itemId = plant.herb as ItemId`), więc
   * kompilator nie miał jak tego złapać. Pełny zapis: `docs/dziennik.md`
   * 2026-09-06.
   *
   * Ikony od 2026-10-05 (`tools/build_herb_icons.py`, arkusze Gemini —
   * `docs/gemini_item_icons.md` §3), razem z odświeżeniem pierwotnej piątki.
   * Do tej daty sześć stało na kolorowej plamce z `color`; `color` zostaje,
   * bo jest dobrany z KWIATU na duszku (`public/assets/props/herb_*.png`)
   * i służy dalej tam, gdzie gra rysuje przedmiot kolorem, nie ikoną.
   * ⚠ Klucze jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi przed `ASSETS`.
   */
  lebiodka: {
    id: "lebiodka",
    iconTexture: "icon-wild-marjoram",
    name: "Lebiodka pospolita",
    type: "material",
    color: 0x881a9e,
    sellPrice: 3,
    description:
      "Drobne różowo-liliowe kwiatki w gęstych baldaszkach, liście pachną ostro i korzennie, gdy je rozetrzeć w palcach. Suszy się ją do przypraw i do herbaty na uspokojenie żołądka.",
  },
  wrotycz: {
    id: "wrotycz",
    iconTexture: "icon-tansy",
    name: "Wrotycz pospolity",
    type: "material",
    color: 0xea9c02,
    sellPrice: 2,
    description:
      "Żółte, guzikowate kwiatki w płaskich baldaszkach na sztywnej łodydze, ostry i gorzkawy zapach po roztarciu. Wiesza się go pęczkami w komorze na mole i muchy.",
  },
  mieta: {
    id: "mieta",
    iconTexture: "icon-corn-mint",
    name: "Mięta polna",
    type: "material",
    color: 0x4a9c3f,
    sellPrice: 3,
    description:
      "Ostry, chłodny zapach jak z ogrodowej mięty, ale drobniejsza i bardziej kudłata. Rośnie tam, gdzie ziemia zawsze wilgotna — nad rowem, przy brzegu. Do herbaty i do przetarcia rozpalonego czoła.",
  },
  nawloc: {
    id: "nawloc",
    iconTexture: "icon-goldenrod",
    name: "Nawłoć pospolita",
    type: "material",
    color: 0xc37502,
    sellPrice: 3,
    description:
      "Złociste, drobniutkie kwiatuszki w gęstych, wygiętych wiechach — cała miedza żółknie, gdy zakwitnie. Zbiera się ją na napar do przepłukania, zanim jesień ją spali.",
  },
  dziewanna: {
    id: "dziewanna",
    iconTexture: "icon-mullein",
    name: "Dziewanna",
    type: "material",
    color: 0xfbda07,
    /** Najwolniej odrastająca z szóstki (`HERBS.dziewanna.respawnSec` 130) —
     *  cena, jak przy dziurawcu, jest zapisem tej rzadkości, nie osobnym
     *  balansem. */
    sellPrice: 5,
    description:
      "Wysoka, prosta łodyga i grube, filcowate liście, jakby obszyte kożuszkiem. Żółte kwiatki zbiera się pojedynczo, dzień po dniu, i suszy na herbatę, gdy w piersiach zaczyna chrypieć.",
  },
  zywokost: {
    id: "zywokost",
    iconTexture: "icon-comfrey",
    name: "Żywokost lekarski",
    type: "material",
    color: 0x7a5ee0,
    sellPrice: 4,
    description:
      "Szorstkie, owłosione liście i zwisające, fioletowo-niebieskie dzwonki kwiatów. Korzeń tłucze się na okłady na stłuczenia i zwichnięcia — u nas nazywają go kościozrostem.",
  },
  /**
   * Chleb — jedyne KUPOWALNE jedzenie w grze (Anna, 2026-08-14). Dolna
   * półka środkowego poziomu leczenia (regeneracja → jedzenie → mikstura).
   *
   * ⚠ **Nie podkopuje Pieczenia mięsa i to jest policzone, nie założone.**
   * `cooked_meat` celowo NIE ma `buyPrice` — to jest dokładnie to, co
   * kupują 3 punkty umiejętności. Chleb nie jest jego tańszą wersją, tylko
   * gorszą i płatną za każdym razem:
   *   - leczy 22 HP w 6 s (3,7 HP/s) przeciw 50 HP w 10 s (5,0 HP/s),
   *   - kosztuje 6 g ZA SZTUKĘ, podczas gdy pieczenie zamienia darmowe
   *     mięso z królików w jedzenie już na zawsze.
   * Umiejętność (35 g + 3 pkt) zwraca się po ~6 bochenkach i od tego
   * miejsca jest za darmo. To jest zdrowa relacja „wygoda kontra
   * inwestycja", a nie konkurencja.
   *
   * ⚠ Dzieli z `cooked_meat` cały mechanizm `healOverTime`, czyli także
   * regułę pięciu sekund i kasowanie posiłku przy otrzymaniu ciosu. Nie ma
   * tu drugiej ścieżki leczenia — jest ten sam poziom, niżej.
   *
   * ⚠ Liczby to PIERWSZE PODEJŚCIE, nie wynik playtestu (inaczej niż
   * `VENOM_SPIDER`, gdzie symulacja poprzedziła implementację). Stroić tutaj.
   */
  bread: {
    id: "bread",
    name: "Bochen chleba",
    type: "consumable",
    color: 0xc8a05a,
    buyPrice: 6,
    sellPrice: 2,
    healOverTime: { amount: 22, durationMs: 6000 },
    /**
     * ⚠ **Trzeci sposób na ikonę przedmiotu** — obok wycinka z `items.png`
     * (`icon: {col,row}`) i kolorowej plamki (domyślnie). Tu jest samodzielny
     * PNG, bo ani chleba, ani jajek, ani sera nie ma na tamtym arkuszu.
     * Wypiekane przez `tools/build_ikony_jedzenia.py` — patrz `ASSETS.iconBread`
     * po powody, dla których źródła nie idą tu wprost.
     *
     * ⚠ To jest STRING, nie `ASSETS.iconBread.key`, i musi się z nim zgadzać
     * ręcznie: `ITEMS` jest zadeklarowane w tym pliku DUŻO wcześniej niż
     * `ASSETS`, więc nie da się go tu dosięgnąć (ten sam powód, dla którego
     * `TILESET_TEXTURES` mieszka w `TiledMap.ts`, a nie tutaj).
     */
    iconTexture: "icon-bread",
    description:
      "Z mąki z tutejszego młyna. Zjedzony poza walką powoli syci i przywraca siły.",
  },
  /**
   * Jajka i ser — reszta oferty Anny (2026-08-14). Razem z chlebem tworzą
   * jedyny sklep spożywczy w grze.
   *
   * ⚠ **Każde pochodzi od czegoś, co REALNIE stoi na mapie**, a nie od
   * wymyślonego zaplecza: mąka z młyna Miłosza, jajka z kurnika (3 kury
   * jako `FarmAnimal`), ser od krów przy oborze (2 krowy + byk). To jest
   * powód, dla którego te zwierzęta przestają być samą dekoracją — jej
   * towar to ich produkt.
   *
   * ⚠ **Trzy jedzenia to NIE drabinka „coraz lepsze" — każde ma inny
   * powód istnienia**, inaczej byłyby trzema nazwami jednego przedmiotu:
   *   - jajka  8 HP / 3 s  (2,67 HP/s), 2 g → 0,25 g/HP — najtańszy bilet
   *     wejścia, dla gracza, który ma dwie monety
   *   - chleb 22 HP / 6 s  (3,67 HP/s), 6 g → 0,27 g/HP — NAJSZYBSZY,
   *     płacisz za krótką przerwę
   *   - ser   45 HP / 18 s (2,50 HP/s), 11 g → 0,24 g/HP — NAJTAŃSZY za HP,
   *     ale musisz stać najdłużej; jedno kupno na cały spacer
   * Decyzja brzmi „ile mam czasu i ile monet", a nie „które jest lepsze".
   *
   * ⚠ **Wszystkie trzy są wolniejsze od `cooked_meat` (5,0 HP/s) i płatne
   * za każdym razem.** Pieczenie mięsa (35 g + 3 pkt) zamienia darmowy łup
   * w jedzenie na zawsze i pozostaje najlepszą opcją dla kogoś, kto poluje —
   * to jest ochrona niszy tej umiejętności, wprost wymagana w CLAUDE.md.
   *
   * ⚠ Liczby to PIERWSZE PODEJŚCIE, nie wynik playtestu. Stroić tutaj.
   *
   * Obie mają własne ikony (`ASSETS.iconEggs`/`.iconCheese`), tak jak chleb —
   * cała trójka wypiekana jednym generatorem, żeby czytała się jako komplet
   * jednego sprzedawcy.
   */
  eggs: {
    id: "eggs",
    name: "Jajka",
    type: "consumable",
    color: 0xf2e3c2,
    buyPrice: 2,
    sellPrice: 1,
    healOverTime: { amount: 8, durationMs: 3000 },
    iconTexture: "icon-eggs",
    description: "Z tutejszego kurnika, jeszcze ciepłe. Niewiele, ale zawsze coś.",
  },
  cheese: {
    id: "cheese",
    name: "Ser",
    type: "consumable",
    color: 0xe0c060,
    buyPrice: 11,
    sellPrice: 4,
    healOverTime: { amount: 45, durationMs: 18000 },
    iconTexture: "icon-cheese",
    description:
      "Krowi, dojrzewał w chłodzie. Syci najdłużej ze wszystkiego, co ma Anna — ale i najwolniej.",
  },
  health_potion: {
    id: "health_potion",
    name: "Mikstura zdrowia",
    /** ⚠ Klucz jako STRING, nie `ASSETS.x.key` — `ITEMS` stoi w tym pliku
     *  PRZED `ASSETS`, więc odwołanie byłoby użyciem przed deklaracją. */
    iconTexture: "icon-health-potion",
    type: "consumable",
    color: 0xdd4466,
    buyPrice: 15,
    sellPrice: 5,
    /** HP restored when used from the backpack. */
    healAmount: 40,
    description: "Wypita natychmiast leczy rany.",
  },
  cooked_meat: {
    id: "cooked_meat",
    name: "Pieczone mięso",
    type: "consumable",
    color: 0xb5651d,
    /**
     * No buyPrice on purpose: the Hunter doesn't stock this. The only way to
     * get it is to learn Pieczenie mięsa and roast raw meat at a campfire,
     * which is what makes the skill worth its 3 points.
     */
    sellPrice: 8,
    /**
     * ⚠ **Dziesiąty samodzielny PNG w tej rodzinie, drugi (po `venom_gland`)
     * dzielony po TONIE, nie kwantyzowany na całym obrazie naraz.** Koniec
     * kości to tylko ~11% opaque pikseli po BOX-downscale (23 z 215) —
     * zwykła kwantyzacja oddawała cały budżet kolorów ciemnemu mięsu i kość
     * znikała, drumstick wychodził jednolicie brązowy, nieodróżnialny od
     * surowego `rabbit_meat`. Sprawdzone empirycznie (obie wersje
     * porównane), nie założone z góry. Źródło: `roasted-meat.png` — nazwa
     * NIE zgadza się z `id` (jak `wolf-hide.png` → `wolf_pelt`), zostaje
     * bez zmiany, wiązanie idzie samym `iconTexture`.
     */
    iconTexture: "icon-cooked-meat",
    /**
     * Heal-over-time rather than an instant heal — this is the MIDDLE tier of
     * the three-way healing split (see the regeneration note in CLAUDE.md):
     * regen is free but slow, food is fast but out-of-combat only, potions are
     * instant and the only thing that works mid-fight.
     *
     * 50 HP over 10s ≈ 5 HP/s, roughly 8× passive regeneration. Its real value
     * is turning ~75 seconds of standing around into ~10, NOT out-healing a
     * potion — it is cancelled outright the moment you take a hit.
     */
    healOverTime: { amount: 50, durationMs: 10000 },
    description: "Sycące i pożywne. Zjedzone poza walką powoli przywraca zdrowie.",
  },
  stick: {
    id: "stick",
    weight: 1,
    name: "Osiosany kij",
    type: "weapon",
    /**
     * ⚙ **RODZINA `blunt` — od 2026-09-18, decyzja autora (F1).**
     *
     * ⚠⚠ **Do tej daty stało tu „ŚWIADOMIE BEZ `family`"** z dwoma powodami:
     * że rodzina nie wyprowadza się z typu obrażeń i że broń startowa nie
     * powinna dziedziczyć osi archetypu. **Pierwszy powód dalej obowiązuje**
     * (kij nie jest `blunt` dlatego, że zadaje `blunt`) — ale przesłanka
     * drugiego upadła: kij **jest** prostą konstrukcją obuchową, a nie osobną
     * kategorią, i jego prymitywność wyraża się masą, obrażeniami, tempem
     * i ceną, nie brakiem przynależności.
     *
     * ⛔ **Nie powstaje typ `improvised`.** Nie ma takiej rodziny i nie ma jej
     * być — to była właśnie ta pokusa, przed którą ostrzegał poprzedni zapis.
     *
     * ⚠ **Skutek mechaniczny jest realny i zamierzony:** kij dziedziczy
     * `staggerMs: 50` z `WEAPON_FAMILY.blunt` i **buduje biegłość obuchową**.
     * Pierwsza broń w grze przestała być ćwiczeniem donikąd.
     */
    family: "blunt",
    /**
     * A bare wooden shaft with no head at all (col 0, row 5 — the start of the
     * spear row, before any of them get a blade). Verified by cropping the
     * candidates rather than reading the thumbnail, as the README insists: row
     * 4's brown items are bulbous CLUBS and row 12's are ornamented magic
     * staves, neither of which is a branch someone cut and sharpened.
     */
    icon: { col: 0, row: 5 },
    iconTexture: "icon-weapon-stick", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8a6a3f,
    /**
     * The floor of the weapon ladder and what the player starts a run holding.
     *
     * Its whole design job is to make bare hands look like what they are. A
     * half-metre to metre of sharpened branch is a genuinely dangerous thing
     * and fists are not, so the gap between them is deliberately the biggest
     * proportional jump anywhere in the ladder: 8 dps → 15.
     *
     * Slower than the dagger despite being cruder — it is long and clumsy, and
     * the reach shows in the swing (thrustPx 9 vs the dagger's 5) rather than
     * in the numbers.
     */
    damageMin: 6,
    damageMax: 9,
    /** Starter: obie osie najniższe z prawdziwych broni i **kij MA odpadać** —
     *  to jest jego rola, ta sama co `PLAYER.damageMin` ma dla pięści.
     *  Płaski model robił odwrotnie: przy Sile 20 kij za 12 g bił mocniej niż
     *  młot za 280. Patrz `ITEMS.sword.strScale`. */
    strScale: 0.03,
    dexScale: 0.03,
    attackCooldown: 0.5,
    swingDurationMs: 170,
    swingThrustPx: 9,
    buyPrice: 12,
    sellPrice: 5,
    /** Base max durability at Zwykła — scaled per instance by QUALITY.modifiers.
     *  Comfortably the frailest thing in the game, which is characterisation
     *  rather than balance: it is a branch somebody cut this morning. */
    durability: 40,
    // No `requires`, like the dagger and all leather — see the note above.
    /** Długi i niezgrabny — jego jedyną zaletą jest zasięg, i to jest cała treść tej broni. */
    melee: {
      reach: 74,
      knockback: 0,
    },
    /** Jeden wariant: to gałąź, a opis mówi "BIJE mocniej niż goła pięść".
     *  Zaostrzenie jest fabułą — łuk 55° i zasięg 74 to profil zamachu. */
    attacks: [{ id: "strike", name: "Uderzenie", damageType: "blunt" }],
    description:
      "Gałąź obcięta na długość ramienia i zaostrzona nożem. Nie budzi respektu, ale bije znacznie mocniej niż goła pięść.",
  },
  /**
   * Pałka — pierwszy prawdziwy oręż po kiju, i pierwszy przedstawiciel rodziny
   * obuchowej poza młotem (Weapon System V1, dodane 2026-08-25 po audycie).
   *
   * ⚠ **Świadomie BEZ `knockback` i BEZ `interrupts`.** Te dwie własności są
   * modelowe (młota), nie rodzinne — `WEAPON_FAMILY.blunt` zapowiadał dokładnie
   * tę broń wprost: "Przyszła maczuga będzie `blunt` bez jednego i drugiego."
   * Pałka dziedziczy z rodziny wyłącznie `staggerMs: 50`.
   *
   * ⚠ **`strScale`/`dexScale` identyczne z kijem (0,03/0,03).** Pałka dzieli
   * z kijem tę samą filozofię płaskiej, nieopłacalnej inwestycji — różni je
   * floor mocy (DPS 17,7 vs 15,0 przy zerowych atrybutach) i cena (25 vs 12g),
   * nie krzywa skalowania. Ma odpadać przy poważnej inwestycji atrybutowej,
   * dokładnie jak kij — to jest zamierzone, nie luka.
   */
  club: {
    id: "club",
    weight: 2,
    name: "Pałka",
    type: "weapon",
    family: "blunt",
    icon: { col: 1, row: 4 },
    iconTexture: "icon-weapon-club", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8a6a3f,
    damageMin: 7,
    damageMax: 10,
    strScale: 0.03,
    dexScale: 0.03,
    attackCooldown: 0.48,
    swingDurationMs: 160,
    swingThrustPx: 8,
    buyPrice: 25,
    sellPrice: 10,
    durability: 60,
    // Brak `requires` — dostępna od pierwszej minuty, tak jak kij.
    melee: {
      reach: 60,
      knockback: 0,
    },
    /** Jeden wariant, tak jak kij i młot — pałka ma być mechanicznie prosta. */
    attacks: [{ id: "strike", name: "Uderzenie", damageType: "blunt" }],
    description:
      "Krótki, zwarty kołek nabity na trzonek. Nie budzi respektu jak młot, ale bije — i tyle wystarczy na początek.",
  },
  dagger: {
    id: "dagger",
    weight: 1,
    name: "Sztylet",
    type: "weapon",
    /** ⚠ Tożsamość rodziny podzielona 2026-08-24 (Weapon System V1, porządek
     *  architektoniczny): SIŁA krytyka (`critMultiplierBonus`) przeniesiona do
     *  `WEAPON_FAMILY.dagger` — przyszły drugi sztylet dziedziczy ją automatycznie,
     *  tak jak topór dziedziczy swoją. SZANSA (`critChanceBonus` niżej)
     *  ZOSTAJE na przedmiocie i celowo NIE trafia do rodziny — `Progression.
     *  critChance` ma niezmiennik „rodzina dokłada się do siły krytyka, nigdy
     *  do szansy" (2026-08-20), i ten sztylet go nie łamie. Reszta tożsamości
     *  (tempo 450 ms, zasięg 56) zostaje parametrem MODELU, tak jak zasięg
     *  włóczni — patrz `WEAPON_FAMILY.dagger`. */
    family: "dagger",
    icon: { col: 0, row: 1 },
    iconTexture: "icon-weapon-dagger",
    color: 0xb0b0b8,
    damageMin: 7,
    damageMax: 11,
    /** Skrajnie ZRĘCZNOŚCIOWA — najniższy `strScale` w rosterze. Siłacz ze
     *  sztyletem ma zadawać marne obrażenia, i **to jest bramka zastępująca
     *  `requires`**: miękka, bo zawsze zostawia drogę powrotu, czego twarda
     *  bramka przy braku respeca nie robi. Patrz `ITEMS.sword.strScale`. */
    strScale: 0.015,
    dexScale: 0.062,
    attackCooldown: 0.45,
    swingDurationMs: 140,
    swingThrustPx: 5,
    buyPrice: 40,
    sellPrice: 16,
    durability: 70,
    // No `requires` on purpose — the cheapest real BLADE, the one any build can
    // always pick up. See the `requires` note above.
    /** Wąsko i krótko: musisz stać w kimś. Za to premia do SZANSY na krytyka —
     *  siła krytyka mieszka teraz w `WEAPON_FAMILY.dagger.critMultiplierBonus`,
     *  ta zostaje tu (patrz komentarz przy `family` wyżej). */
    melee: {
      reach: 56,
      knockback: 0,
      critChanceBonus: 0.1,
    },
    /**
     * Jeden wariant, świadomie. Cała tożsamość sztyletu to 38° łuku, zasięg 56
     * i jedyna w grze premia do krytyków — "musisz stać w kimś". Wariant
     * cięcia wymagałby szerszego łuku, czyli zamiany sztyletu w mały miecz.
     */
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description: "Lekki i szybki. Pierwsze prawdziwe ostrze, jakie będziesz miał.",
  },
  sword: {
    id: "sword",
    weight: 2.5,
    name: "Miecz",
    type: "weapon",
    /** ⚠ Oś rodziny (Parry) jest dziś FUTURE HOOK i nic nie robi — miecz
     *  zachowuje się identycznie jak przed wprowadzeniem rodzin. Jego dzisiejsza
     *  tożsamość to wybór wariantu niżej. Patrz `WEAPON_FAMILY.sword`. */
    family: "sword",
    icon: { col: 5, row: 0 },
    iconTexture: "icon-weapon-sword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xc0c8d0,
    damageMin: 9,
    damageMax: 14,
    /**
     * ⚠ **MIECZ JEST CELOWO NEUTRALNY i to jest jego trzecia tożsamość.**
     * 0,050/0,045 to jedyna para w rosterze, w której obie osie są prawie
     * równe — miecz jest „punktem odniesienia" (patrz `melee` niżej) także
     * w skalowaniu: siłacz i zręcznościowiec dostają z niego prawie tyle samo.
     *
     * Reszta rosteru neutralna NIE jest i w tym jest cały sens modelu.
     * Zmierzony przyrost dps na punkt przy zerowej inwestycji:
     *
     * ```
     *   Młot     SIŁ 8,00  /  ZRĘ 1,71     ← skrajnie siłowa
     *   Miecz    SIŁ 5,00  /  ZRĘ 5,75     ← ta broń
     *   Sztylet  SIŁ 1,50  /  ZRĘ 7,47     ← skrajnie zręcznościowa
     * ```
     *
     * Dla porównania model płaski dawał na mieczu SIŁ 8,70 przeciw ZRĘ 1,63,
     * czyli **×5,3 na rzecz Siły niezależnie od tego, co trzymasz** — i to jest
     * dokładnie powód, dla którego Zręczność była statem-pułapką.
     *
     * ⚠ **Suma obu osi nie jest budżetem do wyrównania.** Miecz ma najwyższą
     * (0,095), bo generalista ma skalować się ze wszystkim po trochu; młot ma
     * 0,085 skupione w jednym miejscu. Wyrównywanie sum skasowałoby różnicę
     * między bronią uniwersalną a wyspecjalizowaną.
     */
    strScale: 0.05,
    dexScale: 0.045,
    attackCooldown: 0.5,
    swingDurationMs: 180,
    swingThrustPx: 7,
    buyPrice: 110,
    sellPrice: 44,
    durability: 110,
    requires: { strength: 2 },
    /** Punkt odniesienia. Wszystkiego po średnio — reszta kategorii czyta się względem tego. */
    melee: {
      reach: 68,
      knockback: 0,
      /** ⚠ **Przeniesione 2026-09-16 z `WEAPON_FAMILY.sword`, bez zmiany
       *  wartości.** Parowanie jest tożsamością TEJ konstrukcji, nie wszystkich
       *  broni dzielących z nią kategorię biegłości. */
      parryBonus: 0.15,
    },
    /**
     * PIERWSZA broń z wyborem — i to celowo miecz, bo jest "punktem
     * odniesienia": gracz zna już bazę, więc odczuje różnicę.
     *
     * ⚠ Wariant [0] jest NEUTRALNY (zero mnożników), więc miecz trzymany
     * domyślnie zachowuje się co do liczby tak jak przed wprowadzeniem
     * wariantów. To obowiązuje każdą broń w tym pliku.
     *
     * Pchnięcie: węziej, dalej, szybciej, słabiej.
     *   łuk 60° → 42°   (szerzej niż sztylet 38° — patrz reguła tożsamości niżej)
     *   zasięg 68 → 73  (bliżej młota 78, ale go nie dogania)
     *   obr. ×0,85, tempo ×0,95 → DPS 23,0 → 20,6 (−10,5%).
     *
     * ⚠ `swingMul` było 0,85 i to był BŁĄD, który ujawnił się dopiero z
     * typami obrażeń (CR-2). Przy 0,85 mnożniki znosiły się dokładnie: ten sam
     * DPS, większy zasięg, krótszy root — a po dołożeniu pancerza `pierce`
     * nigdy nie jest gorsze od `slash`, więc pchnięcie wygrywało lub remisowało
     * WSZĘDZIE (zmierzone: remis bez pancerza, +20% na skórze, +6% na metalu).
     * Wariant bez wady to nie wybór. Przy 0,95 trójkąt się domyka: cięcie jest
     * lepsze bez pancerza (+11,8%) i przeciw metalowi (+5,1%), pchnięcie
     * przeciw skórze (+7,5%).
     *
     * ⚠ REGUŁA TOŻSAMOŚCI: rozpiętość wariantów jednej broni musi być węższa
     * niż odległość do sąsiedniej kategorii. Pierwsza wersja miała arcMul 0,6
     * (→36°), czyli WĘŻEJ niż sztylet — wariant miecza zjadałby wtedy
     * kategorię sztyletu. Stąd 0,7.
     */
    attacks: [
      { id: "slash", name: "Cięcie", damageType: "slash" },
      {
        id: "thrust",
        name: "Pchnięcie",
        damageType: "pierce",
        reachMul: 1.08,
        damageMul: 0.85,
        swingMul: 0.95,
        // Wizualne: pchnięcie wysuwa mocno i prawie nie zamiata (patrz
        // Player.updateSword) — jedyny sposób odróżnienia wariantów przy
        // jednej klatce ataku na kierunek.
        thrustMul: 1.6,
        sweepMul: 0.45,
      },
    ],
    description: "Solidna, wyważona broń — dobry wybór na start.",
  },
  /**
   * Krótki miecz — trzeci punkt na osi skalowania między sztyletem a mieczem,
   * dodany 2026-08-25 po audycie Weapon System V1.
   *
   * ⚠ **Dostaje OBA warianty miecza (cięcie/pchnięcie), świadomie.** "Miecz
   * jako pierwsza broń z wyborem wariantu" nie jest regułą "tylko jeden miecz
   * ma wybór" — to jest opis, KIEDY ta mechanika weszła do gry pierwszy raz
   * (decyzja autora). Odbieranie krótkiemu mieczowi pchnięcia tylko po to,
   * żeby zachować unikalność pełnego miecza, zostało wprost odrzucone.
   *
   * ⚠ **`family: "sword"` wystarcza, żeby dostał Parry — zero dodatkowego
   * kodu.** `Progression.parryChance` czyta `WEAPON_FAMILY[*].parryBonus`
   * generycznie od Weapon System V1 (miecz), więc ta broń dziedziczy 5,75%
   * Parry automatycznie, tym samym mechanizmem co miecz.
   *
   * ⚠ **`arcMul` pchnięcia to 0,85×, NIE 0,7× jak u miecza.** Baza (48°) jest
   * już węższa niż miecza (60°) — powielenie mnożnika miecza dałoby 33,6°,
   * PONIŻEJ łuku sztyletu (38°), łamiąc regułę tożsamości, którą miecz sam
   * ustanowił: rozpiętość wariantów jednej broni musi być węższa niż odległość
   * do sąsiedniej kategorii. 0,85× daje 40,8° — margines nad sztyletem,
   * proporcjonalnie ten sam ostrożny odstęp, jaki miecz trzyma nad 38°.
   * Reszta mnożników wariantu przeniesiona z miecza bez zmian — to są te same
   * osie (wizualne `thrustMul`/`sweepMul`, redukcja `damageMul`/`swingMul`
   * za zasięg), żadna nie miała powodu się różnić.
   *
   * ⚠ **Sprawdzone pod QUALITY (2026-08-25):** stosunek DPS krótki-miecz/miecz
   * (0,926) jest niezmienny względem poziomu jakości — modyfikatory `QUALITY`
   * mnożą obie bronie identycznie, więc hierarchia Sztylet→Krótki miecz→Miecz
   * trzyma się na KAŻDYM pasującym poziomie jakości, nie tylko przy Zwykłej.
   */
  short_sword: {
    id: "short_sword",
    weight: 1.5,
    name: "Krótki miecz",
    type: "weapon",
    family: "sword",
    icon: { col: 3, row: 1 },
    iconTexture: "icon-weapon-short-sword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // 1×1 tylko do ~45 cm (decyzja autora 2026-10-02)
    color: 0xb8bcc4,
    damageMin: 8,
    damageMax: 12,
    strScale: 0.035,
    dexScale: 0.055,
    attackCooldown: 0.47,
    swingDurationMs: 160,
    swingThrustPx: 6,
    buyPrice: 75,
    sellPrice: 30,
    durability: 90,
    requires: { strength: 1 },
    melee: {
      reach: 62,
      knockback: 0,
      /** Jak przy mieczu — przeniesione z rodziny, wartość bez zmian. */
      parryBonus: 0.15,
    },
    attacks: [
      { id: "slash", name: "Cięcie", damageType: "slash" },
      {
        id: "thrust",
        name: "Pchnięcie",
        damageType: "pierce",
        reachMul: 1.08,
        damageMul: 0.85,
        swingMul: 0.95,
        thrustMul: 1.6,
        sweepMul: 0.45,
      },
    ],
    description:
      "Krótsze ostrze, szybsza ręka. Mniej powali jednym ciosem niż pełny miecz, ale nie musisz go dźwigać jak miecz.",
  },
  hatchet: {
    id: "hatchet",
    weight: 1.5,
    name: "Toporek",
    type: "weapon",
    /** Ta sama rodzina co siekiera — jedna rodzina, dwa modele. Dziedziczy
     *  mocniejszego krytyka bez ani jednej własnej linijki. */
    family: "axe",
    /** The small single-bit hatchet at the head of the axe row — visibly
     *  lighter than the broad axes beside it (verified by cropping, per the
     *  README's warning about reading the thumbnail). */
    icon: { col: 0, row: 2 },
    iconTexture: "icon-weapon-hatchet", // `tools/build_axe_icons.py` (2026-10-02)
    color: 0xa8a29a,
    /**
     * The blacksmith's entry weapon: the first piece of proper steel, and the
     * rung between the Hunter's dagger and his own sword.
     *
     * Requirement-free on purpose, same reasoning as the dagger and the leather
     * set (see the `requires` note above): a hatchet is a tool, not heavy gear,
     * and keeping one metal weapon ungated means a pure-Zręczność or
     * pure-Kondycja build is never locked out of the smith's shelf entirely.
     */
    damageMin: 8,
    damageMax: 13,
    /** Lekko ZRĘCZNOŚCIOWY — toporek to narzędzie, nie topór bojowy, więc stoi
     *  bliżej miecza niż siekiery. Obie osie poniżej miecza (110 g), żeby
     *  drabinka cen się trzymała. Patrz `ITEMS.sword.strScale`. */
    strScale: 0.045,
    dexScale: 0.038,
    attackCooldown: 0.48,
    swingDurationMs: 165,
    swingThrustPx: 7,
    buyPrice: 70,
    sellPrice: 28,
    durability: 90,
    /** Zapowiedź rąbnięcia siekiery, w mniejszej skali. */
    melee: {
      reach: 62,
      knockback: 0,
    },
    /**
     * Jeden wariant. ⚠ Toporek NIE dostaje obucha — wariant obuchowy należy do
     * siekiery, która ma na tyle ciężką głowicę, że jej odwrócenie w dłoni coś
     * znaczy. Dokładanie toporkowi analogicznego wariantu tylko po to, żeby
     * zwiększyć ich liczbę, jest dokładnie tym, czego ten model unika.
     */
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description: "Krótki trzonek, jedno ostrze. Do rąbania drewna i, w razie czego, nie tylko.",
  },
  axe: {
    id: "axe",
    weight: 3.5,
    name: "Siekiera",
    type: "weapon",
    /** ⚠ `axe`, mimo że jej wariant **Obuch** zadaje `blunt`. Rodzina opisuje,
     *  czym broń JEST; typ obrażeń — jak zadano cios. Siekiera nie dostaje
     *  więc osi obuchowej, bo wariant nie może przyznać zdolności. */
    family: "axe",
    icon: { col: 4, row: 2 },
    iconTexture: "icon-weapon-axe", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0x9aa0a8,
    damageMin: 6,
    damageMax: 18,
    /** SIŁOWA, tuż pod młotem. ⚠ Deficyt jednocelowy wobec młota (~10% przy
     *  Sile 10) jest ZAMIERZONY i opłacony gdzie indziej: łuk 100° trafia
     *  5 z 5 celów jednym cięciem, czego żadna tabela dps nie pokazuje
     *  (`docs/atrybuty.md` §1). Patrz `ITEMS.sword.strScale`. */
    strScale: 0.07,
    dexScale: 0.02,
    attackCooldown: 0.5,
    swingDurationMs: 190,
    swingThrustPx: 8,
    buyPrice: 180,
    sellPrice: 72,
    durability: 120,
    requires: { strength: 4 },
    /** Szeroki łuk to CAŁA kategoria toporów: jedno cięcie sięga kilku naraz. */
    melee: {
      reach: 70,
      knockback: 0,
    },
    /**
     * Druga broń z wyborem. Siekiera ma fizycznie głowicę, którą można użyć
     * ostrzem albo obuchem — to jedyny w rosterze przypadek, w którym dwa
     * warianty wynikają z PRZEDMIOTU, a nie z życzenia.
     *
     * ⚠ Obuch dostaje wyłącznie TYP OBRAŻEŃ. Nie ma odrzutu i nie przerywa —
     * i nie może ich dostać, bo reguła zawężania pozwala wariantowi tylko
     * odebrać zdolność broni, nigdy jej przyznać (siekiera ma knockback 0
     * i żadnego `interrupts`). Gdyby było inaczej, siekiera za 180 g robiłaby
     * to, co młot za 280 g.
     *
     * ⚠ Obuch jest z założenia SŁABSZY w surowym DPS (19,4 vs 24) — jego
     * wartością jest typ obrażeń, więc opłaca się wyłącznie tam, gdzie ktoś
     * źle znosi obuchowe. Dziś to jeden przeciwnik (patrz `EnemyConfig.armor`),
     * i tak ma zostać: pancerz ma być czytelnym wyjątkiem, nie tabelką do
     * sprawdzania przed każdym ciosem.
     */
    attacks: [
      { id: "slash", name: "Cięcie", damageType: "slash" },
      {
        id: "bash",
        name: "Obuch",
        damageType: "blunt",
        reachMul: 0.9,
        damageMul: 0.85,
        swingMul: 1.05,
        thrustMul: 1.3,
        sweepMul: 0.6,
      },
    ],
    description: "Duży rozrzut obrażeń — potrafi zabić jednym ciosem albo ledwie drasnąć.",
  },
  hammer: {
    id: "hammer",
    weight: 5,
    name: "Młot",
    type: "weapon",
    /** ⚠ Rodzina daje **zachwianie**; `knockback` i `interrupts` niżej zostają
     *  własnością TEGO modelu i rodziny nie dotyczą. Przyszła maczuga będzie
     *  `blunt` bez jednego i drugiego. */
    family: "blunt",
    icon: { col: 8, row: 4 },
    iconTexture: "icon-weapon-hammer", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8a8f96,
    // Was 12-16, which made the shop's most EXPENSIVE weapon (80g) a straight
    // downgrade from the 45g sword: 14avg/0.65s = 21.5 dps vs the sword's 23.
    // Buying the big-ticket item actively punished you. 14-20 puts it at
    // 26.2 dps, so the price ladder (20g→20, 45g→23, 60g→24, 80g→26) finally
    // tracks actual power.
    damageMin: 14,
    damageMax: 20,
    /**
     * Skrajnie SIŁOWA — najwyższy `strScale` i praktycznie zerowy `dexScale`.
     *
     * ⚠ **To młot jest bronią, którą ta zmiana naprawia.** Przy płaskim modelu
     * był najdroższy (280 g), najmocniej bramkowany (Siła 6), najwolniejszy
     * — i od Siły 5 **słabszy od sztyleta za 40 g**, a przy Sile 20 słabszy od
     * kija za 12. Teraz jest najlepszą bronią jednocelową buildu siłowego na
     * każdym poziomie inwestycji, czyli tym, za co gracz płaci.
     *
     * ⚠ Jednocześnie zostaje jedyną bronią z `interrupts` i z odrzutem, więc
     * jest teraz nagradzany podwójnie. Cena tego: 280 g, Siła 6, najwęższy
     * użyteczny łuk (45°) i najdłuższy root w grze. **Gdyby playtest pokazał,
     * że to za dużo — schodzić TĄ liczbą, nie przerwaniem.**
     */
    strScale: 0.08,
    dexScale: 0.005,
    attackCooldown: 0.65,
    swingDurationMs: 240,
    swingThrustPx: 11,
    buyPrice: 280,
    sellPrice: 112,
    durability: 140,
    requires: { strength: 6 },
    /** Wąsko, daleko, ciężko. Jedyna broń z odrzutem — i jedyna, która PRZERYWA zamach przeciwnika. */
    melee: {
      reach: 78,
      knockback: 380,
      interrupts: true,
    },
    /** Jeden wariant. Tożsamość młota to odrzut + przerywanie + zasięg 78;
     *  drugi wariant albo te trzy rzeczy traci (broń gorsza od siebie samej),
     *  albo je powiela (wybór bez treści). Neutralny, więc młot dziedziczy
     *  `knockback: 380` i `interrupts: true` bez zmian. */
    attacks: [{ id: "strike", name: "Uderzenie", damageType: "blunt" }],
    description: "Wolny, ale każde trafienie boli.",
  },
  spear: {
    id: "spear",
    weight: 3,
    name: "Włócznia",
    type: "weapon",
    /** ⚠ Rodzina bez pola mechanicznego — DELIBERATE WYJĄTEK od porządku
     *  2026-08-24 (patrz `WEAPON_FAMILY.polearm` — tam jest pełne uzasadnienie
     *  i tam jest teraz ADRES tej decyzji, nie tylko tutaj). Zasięg zostaje
     *  parametrem TEGO modelu (`melee.reach` 98): zmierzone konkretnie dla tej
     *  broni przeciw `WOLF.pack.circleRadius` (96) — trafialność orbitu skacze
     *  z 22,1% na 97,0% między 95 a 96 px. Rodzinny mnożnik przeniósłby ten
     *  próg losowo przy każdej zmianie innych liczb. */
    family: "polearm",
    /**
     * Najszerszy grot z wiersza 5 (rząd włóczni — kol. 0 to `stick`, drzewce
     * bez grotu).
     *
     * ⚠ **Kol. 5, bo o wyborze ikony BRONI decyduje widok w dłoni, a nie w
     * plecaku.** Pierwsza wersja brała kol. 3, wybraną z oglądania przy 64 px
     * (kafel plecaka) — i została zgłoszona jako „wygląda jak patyk". Powód
     * jest zmierzony: sprite w dłoni rysowany jest z `PLAYER.heldWeaponScale`
     * 0,55, czyli jako **17,6 px**, a przy tej wielkości grot z kol. 3 to
     * kilka pikseli i sylwetka staje się nieodróżnialna od kija (obie ikony
     * mają oś 45° i długość ~40 px — zmierzone). Tylko kol. 5 ma ostrze na
     * tyle szerokie, że czyta się przy 17,6 px.
     *
     * **Regułą jest: ikonę broni oglądaj przy 32 × `heldWeaponScale`, nie przy
     * kaflu ekwipunku.** Plecak wybacza, walka nie.
     */
    icon: { col: 5, row: 5 },
    iconTexture: "icon-weapon-spear", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0xb9a58a,
    /**
     * ── PIERWSZA BROŃ DWURĘCZNA W GRZE ────────────────────────────────────
     * Pełny przebieg pomiarowy przed wdrożeniem: `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`.
     * Fundament `hands`: `docs/systemy/weapons.md`.
     *
     * ⚠ **`hands: 2` NIE niesie żadnego bonusu.** Wszystko poniżej jest
     * własnością tego przedmiotu; „dwuręczność" znaczy wyłącznie „druga ręka
     * zostaje pusta". Włócznia jednoręczna obok tej byłaby całkowicie legalnym
     * osobnym przedmiotem.
     */
    damageMin: 10,
    damageMax: 15,
    /**
     * SIŁOWA. ⚠ **Wysokie `strScale` (równe młotowi) jest tu po to, żeby
     * drabinka CEN się zgadzała — i NIE jest naprawą dwuręczności.** Włócznia
     * kosztuje 150 g, a przy niższej wartości wypadała pod mieczem za 110 g;
     * przy tej wartości mieści się między mieczem a siekierą, gdzie stoi jej
     * cena. Sam problem `hands: 2` (który nie niesie żadnego bonusu, patrz
     * `hands` niżej) zostaje otwarty tam, gdzie był:
     * `docs/systemy/weapons.md`. Skalowanie go nie zamiata.
     */
    strScale: 0.08,
    dexScale: 0.035,
    attackCooldown: 0.6,
    /** root = 230 + 40 = 270 ms. ⚠ Sprawdzone wobec telegrafu skoczka
     *  (480 ms tell − ~167 ms na wyjście z zasięgu): margines **+43 ms**, czyli
     *  lepszy niż młota (+33). To jest ŻYWY SPRAWDZIAN dla tej broni, nie
     *  globalny limit — patrz `bron_dwureczna_analiza.md` R-2. Włócznia nie
     *  weźmie tarczy, więc jej root nie ma już od czego urosnąć. */
    swingDurationMs: 230,
    /**
     * ⚠ **9, nie 13 — i to jest naprawa zgłoszonego błędu „broń lewituje poza
     * dłonią podczas ataku".** Pierwsza wersja miała 13 („najdłuższe wysunięcie
     * w grze") wybrane dla tożsamości, bez obejrzenia. Wysunięcie liczy się
     * jako `sin(π·t) × swingThrustPx` wzdłuż kierunku ciosu, a sprite jest
     * kotwiczony `PLAYER.swing.gripOrigin` = 0,78 — czyli już ~6,6 px przed
     * prawdziwym końcem drzewca (zmierzone: koniec ikony wypada na 0,94 kafla).
     * Te dwa odstępy się sumują i przy 13 w połowie zamachu widać szczelinę
     * między pięścią a drzewcem.
     *
     * ⚠ To jest **ograniczenie rigu, nie gust**: „mocniejsze pchnięcie" nie da
     * się tu pokazać większym wysunięciem, dopóki origin nie jest prawdziwym
     * końcem drzewca. Odróżnienie pchnięcia od cięcia niesie za to `sweepMul`
     * na wariancie (patrz niżej).
     */
    swingThrustPx: 9,
    buyPrice: 150,
    sellPrice: 60,
    durability: 100,
    /**
     * ⚠ Siła 3, czyli **obok młota (6), nie powyżej**. Przy 1 punkcie cechy na
     * poziom młot jest już najwyższą bramką w grze i nowa broń nie ma jej
     * przebijać. Prawdziwą ceną włóczni jest slot drugiej ręki, nie atrybut —
     * zgodnie z regułą „Siła bramkuje dostęp, nigdy nie skaluje tożsamości",
     * odporną na przyszły redesign atrybutów.
     */
    requires: { strength: 3 },
    hands: 2,
    /**
     * ⭐⭐ **KATEGORIA 1.5H** — `hands: 2` wyżej zostaje i mówi, czym jest PEŁNY
     * profil tej broni; `grip: "either"` mówi, że istnieje profil MNIEJSZY.
     * Tryb wyprowadza się ze stanu drugiej ręki — pusta → oburęczny, zajęta →
     * jednoręczny. ⛔ Bez przełącznika, bez pola w zapisie, bez wyboru w walce.
     * Decyzja: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.
     */
    grip: "either",
    /**
     * ⏳⏳ **PLAYTEST BASELINE, NIE BALANS** — martwa strefa 0 → **45**.
     * ⭐⭐ **Zasięg 98 zostaje NIETKNIĘTY.** Włócznia z tarczą dalej decyduje
     * o tym, kto może stanąć blisko — płaci tym, że kto STANIE blisko, jest
     * poza jej zasięgiem dolnym. To jest druga połowa zdania z jej opisu.
     * ⛔ **Obcinanie `reach` zostało ODRZUCONE** (decyzja 2026-09-18):
     *   korytarz „jednoręczna drzewcowa ≤ 74 px" z `OI-108` jest pusty, bo
     *   szukano na złej osi. 45 mieści się w istniejącej skali `minReach`
     *   (glewia 28, halabarda 34, pika 62).
     * ⚠ Wartość świadomie NIŻSZA niż u wideł (60): włócznia jest bronią
     *   żołnierską i ma być lepiej prowadzona jedną ręką niż narzędzie.
     */
    oneHanded: { minReachAdd: 45 },
    /**
     * ⚠ **Zasięg 98 jest CAŁĄ tą bronią i nie jest pokrętłem.** Zmierzone na
     * pełnym cyklu wilka (orbita → wypad → recover): przy zasięgu 95 wilk jest
     * trafialny przez **22,1%** cyklu, przy 96 — przez **97,0%**. Jeden piksel,
     * bo `WOLF.pack.circleRadius` wynosi 96. Każdy zasięg z przedziału 79–95
     * daje wobec młota +2 pkt proc. i nic poza tym, czyli tożsamość włóczni
     * byłaby niemierzalna. Nie ma bezpiecznego środka — decyzja była binarna.
     *
     * ⚠ **98, a nie równo 96, i to nie jest wybredzanie.** Porównanie dwóch
     * identycznych liczb rozstrzyga szum zmiennoprzecinkowy — ta sama klasa
     * błędu, którą projekt złapał przy `SHIELD.blockArcDeg`. Orbita dodatkowo
     * się kołysze (`orbitLeadDeg` 26, `closeInFactor` 1,5).
     *
     * ⚠ **Jeśli włócznia okaże się za silna, pierwszym pokrętłem są
     * OBRAŻENIA, nie zasięg.** Zasięgu nie da się ruszyć „trochę".
     *
     * Łuk 40°: szerszy niż sztylet (38), żeby sztylet został najwęższą bronią
     * w grze, i węższy niż młot (45). Zero odrzutu i brak `interrupts` —
     * jedno i drugie to wyłączna tożsamość obucha i młota.
     */
    melee: {
      reach: 98,
      knockback: 0,
    },
    /**
     * ⚠ **Jeden wariant, i to jest decyzja, nie oszczędność.** Włócznia
     * fizycznie umie też przyłożyć drzewcem, więc drugi wariant (`blunt`)
     * obroniłby się regułą „wariant ma wynikać z przedmiotu". Nie dostaje go
     * przez **halabardę**: ta ma mieć trzy warianty (ostrze/kolec/hak) i już
     * dziś jest opisana jako główne ryzyko „broni na wszystko". Gdyby włócznia
     * miała pchnięcie ORAZ obuch, halabarda straciłaby dwa z trzech powodów
     * istnienia, zanim powstanie. Włócznia ma być specjalistą, od którego
     * halabarda jest gorsza w pojedynczym starciu.
     */
    attacks: [
      {
        id: "thrust",
        name: "Pchnięcie",
        damageType: "pierce",
        /**
         * ⚠ **Czysto WIZUALNE i konieczne** — bez tego włócznia zamiatała pełne
         * 22° `PLAYER.swing.arcDeg`, czyli rysowała się jak cięcie. Przy jednej
         * klatce ataku na kierunek para wysunięcie/zamiatanie jest jedynym, co
         * odróżnia pchnięcie od cięcia na ekranie, a wysunięcia nie da się tu
         * podnieść (patrz `swingThrustPx`) — więc cały ciężar tego rozróżnienia
         * spada na `sweepMul`. Ta sama wartość co pchnięcie miecza.
         *
         * `sweepMul` nie dotyka ani `attackArcDeg` (to `arcMul`), ani żadnej
         * liczby obrażeń — ta zmiana nie rusza balansu.
         */
        sweepMul: 0.45,
      },
    ],
    description:
      "Długie drzewce i wąski grot. Nie powala, nie rąbie — decyduje o tym, kto może stanąć blisko.",
  },
  /**
   * ── TOPÓR BOJOWY — pierwsza broń 2H o osi PRESJI ──────────────────────
   * Model docelowy rodziny dwuręcznej: `docs/systemy/weapons.md`
   * Fundament `hands`: `docs/systemy/weapons.md` (review zamknięty).
   *
   * ⚠ **`hands: 2` NIE niesie żadnego bonusu** — jak przy włóczni. Wszystko
   * poniżej jest wpisane wprost, a brak bloku wynika z modelu (pusty `offhand`
   * daje `blockSpec` null i `swingMul` 1 bez ani jednej linijki warunku).
   *
   * ⚠ **Tożsamość jedzie POLAMI, nigdy wyjątkiem po nazwie.** Oś „nagroda za
   * trafienie" to `family: "axe"` → istniejący `critMultiplierBonus` +0,25;
   * „ciężka wymiana" to długi `swingDurationMs`, z którego wyprowadza się
   * `rootDurationMs` (patrz `Progression.rootDurationMs`), czyli kara za pudło.
   * Zero nowych mechanik, zero `if (topór)` gdziekolwiek.
   */
  battle_axe: {
    id: "battle_axe",
    weight: 6,
    name: "Topór bojowy",
    type: "weapon",
    family: "axe",
    /** ⚠ Dwuręczny — blokuje slot `offhand`, czyli tarczę. To jest PRAWDZIWA
     *  cena tej broni, nie bramka atrybutu. Brak bloku wynika z modelu:
     *  pusty `offhand` daje `blockSpec` null i `swingMul` 1 bez ani jednego
     *  warunku (`docs/systemy/weapons.md` R-7). */
    hands: 2,
    /** ⚠ Komórka 2,2 arkusza — topór dwusieczny na długim drzewcu, największe
     *  pokrycie w rzędzie toporów (367 px). Nieużywana wcześniej; rząd 2
     *  `items.png` to topory, rząd 3 młoty dwuręczne. */
    icon: { col: 2, row: 2 },
    iconTexture: "icon-weapon-battle-axe", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0x9aa0a8,
    /**
     * ⚠ **Najwyższy sufit obrażeń w grze i najszersze pasmo (13).** To jest
     * cała oś „nagroda za trafienie": średnia 17,5 stoi ledwie nad młotem 1H
     * (17), ale rozrzut sprawia, że pojedynczy cios potrafi rozstrzygnąć
     * wymianę. Rodzina `axe` dokłada do tego mocniejszy krytyk.
     */
    damageMin: 11,
    damageMax: 24,
    strScale: 0.08,
    dexScale: 0.01,
    /**
     * Wolniejszy od młota 1H (0,65) — najwolniejszy topór w grze.
     *
     * ⚠ **0,68, a nie 0,70 — o tej liczbie zdecydowała BRAMKA.** Przy 0,70
     * pierwsze trafienie po Uderzeniu tarczą wypadało 48 ms od końca ogłuszenia
     * przy progu 50 ms (§T6 w `tools/combat_regresja.mjs`), czyli o „darmowy
     * cios" decydowałby szum, nie projekt. 0,68 przy zamachu 285 daje margines
     * 58 ms. ⚠ Sprzężone z `ABILITIES.shieldBash.stunMs` — strojąc jedno,
     * przepuść bramkę ponownie.
     */
    attackCooldown: 0.68,
    /**
     * ⚠ **To jest „większa kara za błąd", i dlatego nie ma tu osobnego pola.**
     * `Progression.rootDurationMs` wyprowadza ukorzenienie ze `swingDurationMs`,
     * więc dłuższy zamach = dłuższe okno, w którym przeciwnik może odpowiedzieć.
     * 285 ms — drugi najdłuższy zamach w rosterze (młot 1H: 240, młot bojowy:
     * 290). ⚠ Podniesione z 265 razem z tempem, przy okazji poprawki §T6:
     * dłuższy zamach WZMACNIA tożsamość „większa kara za błąd", więc bramka
     * wypchnęła tę broń w stronę, w którą i tak miała iść.
     */
    swingDurationMs: 285,
    swingThrustPx: 12,
    buyPrice: 320,
    sellPrice: 128,
    durability: 130,
    /** ⚠ Siła 5, czyli POD młotem (6). Młot pozostaje najwyższą bramką w grze
     *  — nowa broń jej nie przebija (ta sama reguła co przy włóczni). */
    requires: { strength: 5 },
    melee: {
      reach: 76,
      /** ⚠ Zero odrzutu i brak `interrupts` — to wyłączna tożsamość obucha
       *  i młota. Topór kupuje swoją przewagę obrażeniami, nie kontrolą. */
      knockback: 0,
    },
    /** Dwa warianty wzorem siekiery. ⚠ Reguła zawężania: obuch ODBIERA (mniejszy
     *  łuk, krótszy zasięg, słabsze obrażenia), nigdy nie dodaje. */
    attacks: [
      { id: "slash", name: "Cięcie", damageType: "slash" },
      {
        id: "bash",
        name: "Obuch",
        damageType: "blunt",
        reachMul: 0.9,
        damageMul: 0.85,
      },
    ],
    description: "Obie ręce na drzewcu. Wolny zamach, ale kto oberwie, ten to zapamięta.",
  },
  /**
   * ── MŁOT BOJOWY — pierwsza broń 2H o osi KONTROLI ─────────────────────
   * Kontrast wobec topora stoi na tym, co broń robi PO trafieniu, nie na
   * zasięgu: oba siedzą w tym samym paśmie 72–78 (`docs/systemy/weapons.md`
   * §7.B4a — zasięg jest wspólnym progiem wejścia dwuręczności, nie osią).
   *
   * ⚠ **Rodzina `blunt` daje zachwianie (50 ms); `knockback` i `interrupts`
   * niżej są własnością TEJ broni** — ta sama konwencja co przy młocie 1H.
   */
  war_hammer: {
    id: "war_hammer",
    weight: 7,
    /** ⚠ Nazwa doprecyzowana 2026-09-18: pula rozróżnia młot bojowy jedno-
     *  i dwuręczny (`war_hammer_1h`). ⛔ **`ItemId` NIETKNIĘTE** — zapis niesie
     *  identyfikator, nie nazwę, więc zmiana nazwy nie rusza save/load. */
    name: "Młot bojowy 2H",
    type: "weapon",
    family: "blunt",
    /** ⚠ Dwuręczny — patrz komentarz przy toporze bojowym. */
    hands: 2,
    /** ⚠ Komórka 2,3 — największy młot dwuręczny w arkuszu. Cały rząd 3
     *  `items.png` był nieużywany. */
    icon: { col: 2, row: 3 },
    iconTexture: "icon-weapon-war-hammer", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8a8f96,
    /**
     * ⚠ **Wyższe minimum niż topór, niższe maksimum.** Młot nie sprzedaje
     * pojedynczego szczęśliwego ciosu — sprzedaje to, że każdy cios wchodzi
     * i przerywa. Pasmo 7 wobec 13 u topora.
     */
    damageMin: 15,
    damageMax: 22,
    strScale: 0.09,
    dexScale: 0.005,
    /**
     * Najwolniejsza broń w grze. Cena za `interrupts` + odrzut + zachwianie.
     *
     * ⚠ **0,80, a nie 0,78 — i o tej liczbie zdecydowała BRAMKA, nie gust.**
     * Przy 0,78 pierwsze trafienie po Uderzeniu tarczą wypadało w t=925, czyli
     * **45 ms** od końca ogłuszenia (t=880) przy progu 50 ms — a poniżej progu
     * o tym, czy gracz dostaje darmowy cios, decyduje szum zmiennoprzecinkowy,
     * nie projekt (§T6 w `tools/combat_regresja.mjs`; ta sama pułapka co przy
     * `SHIELD.blockArcDeg`). 0,80 daje trafienie w t=945, margines **65 ms**.
     * ⚠ Strojąc tempo tej broni albo `ABILITIES.shieldBash.stunMs`, przepuść
     * bramkę ponownie — te dwie liczby są sprzężone.
     */
    attackCooldown: 0.8,
    /** Najdłuższy zamach w rosterze — patrz komentarz przy toporze: stąd
     *  bierze się ukorzenienie, czyli kara za pudło. */
    swingDurationMs: 290,
    swingThrustPx: 12,
    buyPrice: 360,
    sellPrice: 144,
    durability: 150,
    /** ⚠ Siła 6 — RÓWNO z młotem 1H, nie powyżej. Najwyższa bramka w grze
     *  zostaje tam, gdzie była. */
    requires: { strength: 6 },
    melee: {
      /**
       * ⚠ **74 — to samo pasmo co topór, PONIŻEJ progu orbity** (74 + 17,64 =
       * 91,64 przy progu 96). Krótszy od topora o dwie jednostki, bo jego
       * przewaga jest w kontroli, nie w dosięgnięciu; różnicowanie stylów 2H
       * zasięgiem jest w §7.B4a jawnie odrzucone.
       */
      // ⚠ **80, nie 74 (2026-09-05).** „Większy zasięg" jest jedną z pięciu cech
      // tożsamości 2H, a `reach` to jedyny kanał, którym ta cecha może zajść
      // (`Progression.attackReach = melee.reach × variantMul("reachMul")`).
      // Przy 74 `Młot bojowy` sięgał **dokładnie tyle co Osiosany kij**
      // (`stick`, reach 74) i **KRÓCEJ niż jednoręczny `Młot`** (78), czyli dla
      // tej broni cecha nie zachodziła w ogóle. 80 stawia go ponad każdą bronią
      // jednoręczną.
      // ⛔ To NIE jest strojenie mocy — `reach` nie wchodzi do obrażeń ani do
      //   dps, tylko do wyboru celu i podglądu celowania.
      // ⚠⚠ **Reguła „każda 2H sięga dalej niż każda 1H" NADAL NIE ZACHODZI
      //   globalnie** i świadomie jej tu nie domykam: `battle_axe` ma 76, a
      //   jednoręczny `hammer` 78. Przyczyną nie jest topór, tylko **`Młot`,
      //   który jest bronią `hands: 1` o parametrach 2H** (14–20 obr., cd 0,65,
      //   swing 240, reach 78). Domknięcie reguły znaczyłoby ruszenie `Młota`,
      //   czyli rebalans rosteru — osobna decyzja, patrz
      //   `docs/konfiguracje_broni_checkpoint.md` §2 pkt 4.
      reach: 80,
      /** Mocniejszy niż u młota 1H (380): dwie ręce na trzonku. */
      knockback: 460,
      interrupts: true,
    },
    /**
     * ⭐⭐ **Drugi wariant dopisany 2026-09-18 — TYLNY DZIÓB.**
     * ⚠ **Zero nowej mechaniki**: to jest ten sam wzorzec, którym siekiera
     * i topór bojowy niosą swój `Obuch` — drugi wpis w `attacks` z własnym
     * `damageType` i mnożnikami na własnych liczbach broni.
     * ⛔ **Dziób NIE przerywa.** Przerwanie bierze się z rozpędzonej masy
     * łba, nie z kolca; `interrupts: false` jest zamkiem, który pozwala
     * wariantowi zdolność **odebrać**, nigdy przyznać.
     * ⛔ Bez penetracji pancerza i bez mechaniki przeciw tarczom — system
     * tego nie ma, a `pierce` przeciw przeszywanicy (0,35) i skórze (0,45)
     * jest całą przewagą, jakiej ten wariant potrzebuje.
     */
    attacks: [
      { id: "strike", name: "Uderzenie", damageType: "blunt" },
      {
        id: "beak",
        name: "Dziób",
        damageType: "pierce",
        reachMul: 0.95,
        damageMul: 0.9,
        thrustMul: 1.4,
        sweepMul: 0.45,
        interrupts: false,
      },
    ],
    description: "Ciężki łeb na długim trzonku, z drugiej strony kolec. Nie tnie — przewraca i przerywa.",
  },
  /**
   * ══════════════════════════════════════════════════════════════════════
   * DZIESIĘĆ KONSTRUKCJI — pierwsza partia SZEROKOŚCI katalogu (2026-09-16)
   * ══════════════════════════════════════════════════════════════════════
   *
   * ⚠⚠ **To jest etap BREADTH FIRST, nie balans.** Celem było pokryć trzy
   * rodziny realnymi konstrukcjami, a nie dostroić arsenał — globalny balans
   * należy zrobić dopiero wtedy, gdy będzie też broń dystansowa i miotana.
   * Liczby niżej są **spójne z dzisiejszą drabinką** (sadzone między
   * istniejące kotwice: miecz 9–14, topór bojowy 11–24, młot bojowy 15–22,
   * włócznia 10–15), ale ⛔ **nie są wynikiem kalibracji całego rosteru**.
   *
   * ⚠ **Ani jedna z nich nie potrzebowała nowej gałęzi w kodzie walki.**
   * Wszystko poniżej to dane: rodzina, model, warianty, `hands`, `requires`
   * i — dla trzech drzewcowych — `melee.minReach`.
   *
   * ⭐ **Ikony są PRAWDZIWE, nie placeholderami.** Arkusz `items.png` niósł
   * gotowe sylwetki dla wszystkich dziesięciu (szabla 2,1 · tasak 6,0 ·
   * kiścień 6,4 · pika 4,5 · glewia 8,2 · halabarda 9,2). Sprawdzone pod
   * kątem reguły „ikonę broni ocenia się przy 17,6 px" — każda ma odrębną
   * sylwetkę przy tej wielkości.
   * ✅ **Modele 3D mają od 2026-10-03** — cały roster (37) liczony z jednego
   * źródła `tools/weapon_shapes.py`; do tej daty te dziesięć rysowało się jako
   * pusta dłoń + `console.warn` (`Character3D.ustawSlot`).
   */

  /* ── MIECZE (rodzina `sword`) ──────────────────────────────────────────
     ⚠ **Premia parowania NIE jest już dziedziczona po rodzinie** (2026-09-16).
     Z całej szóstki niżej deklaruje ją wyłącznie RAPIER — reszta ma tożsamość
     w modelu, tak jak włócznia ma ją w zasięgu. */
  messer: {
    id: "messer",
    weight: 1.8,
    name: "Kord",
    type: "weapon",
    family: "sword",
    icon: { col: 1, row: 1 },
    iconTexture: "icon-weapon-messer", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xb8bcc6,
    /** ⚠ Średnia 11,0 — **najniższa w rodzinie**, i to jest tożsamość, nie
     *  słabość: kord jest najtańszą bronią rodziny (60 g wobec 75 g krótkiego
     *  miecza) i jedyną, która nie płaci za nic poza ostrzem. Krótki miecz
     *  bije słabiej na cios, ale paruje i ma dwa warianty — to jest ta różnica,
     *  za którą się dopłaca. */
    damageMin: 8,
    damageMax: 14,
    strScale: 0.04,
    dexScale: 0.05,
    attackCooldown: 0.47,
    swingDurationMs: 165,
    swingThrustPx: 7,
    buyPrice: 60,
    sellPrice: 24,
    durability: 95,
    requires: { strength: 1 },
    melee: {
      reach: 60,
      knockback: 0,
    },
    attacks: [{ id: "cut", name: "Cięcie", damageType: "slash" }],
    description:
      "Jednosieczna głownia na prostej rękojeści. Broń tego, kto nosi broń codziennie, a nie od święta.",
  },
  cleaver_sword: {
    id: "cleaver_sword",
    weight: 2.8,
    name: "Tasak",
    type: "weapon",
    family: "sword",
    icon: { col: 6, row: 0 },
    iconTexture: "icon-weapon-cleaver-sword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xa8adb8,
    /** ⚠ Średnia 12,0 — **sufit z niezmiennika Y3**: najmocniejsza broń
     *  jednoręczna musi bić słabiej niż najsłabsza dwuręczna (włócznia, 12,5). */
    /** ⭐ **Rozstrzał 10 — najszerszy wśród mieczy** przy tej samej średniej
     *  (12,0), co szabla. `docs/systemy/weapons.md` §5: rozstrzał jest osią
     *  tożsamości, nie szumem. Tasak rąbie: raz przechodzi, raz się zatrzymuje
     *  na kości. Szabla przy tej samej średniej ma rozstrzał 4. */
    damageMin: 7,
    damageMax: 17,
    strScale: 0.06,
    dexScale: 0.03,
    attackCooldown: 0.55,
    swingDurationMs: 200,
    swingThrustPx: 8,
    buyPrice: 120,
    sellPrice: 48,
    durability: 110,
    requires: { strength: 3 },
    melee: {
      reach: 64,
      knockback: 0,
    },
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description:
      "Szeroka, ciężka głownia bez pretensji do elegancji. Rąbie to, co miecz by przeciął.",
  },
  sabre: {
    id: "sabre",
    weight: 2.2,
    name: "Szabla",
    type: "weapon",
    family: "sword",
    icon: { col: 2, row: 1 },
    iconTexture: "icon-weapon-sabre", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xc2c7d2,
    /** ⭐ **Rozstrzał 4 — najciaśniejszy w grze razem ze sztyletem**, przy tej
     *  samej średniej (12,0), co tasak. To jest druga połowa tej samej
     *  decyzji: szabla robi **to samo za każdym razem**. */
    damageMin: 10,
    damageMax: 14,
    strScale: 0.04,
    dexScale: 0.06,
    attackCooldown: 0.46,
    swingDurationMs: 170,
    swingThrustPx: 8,
    buyPrice: 165,
    sellPrice: 66,
    durability: 100,
    requires: { strength: 2 },
    melee: {
      reach: 70,
      /**
       * **Cecha KONSTRUKCJI, nie wypełniacz — i nie wymagała nowej mechaniki.**
       * `melee.critChanceBonus` istnieje w `MeleeShape` od Combat v1 i niesie ją
       * już sztylet (0,10); szabla bierze połowę tej wartości. ⚠ Gdyby to pole
       * nie istniało, szabla **nie dostałaby go po to, żeby się czymś różnić** —
       * różnicuje ją rozstrzał 4 przy średniej 12,0 (najciaśniejszy w grze razem
       * ze sztyletem) i najszybsza kadencja wśród mieczy.
       *
       * ⛔ **Nie `parryBonus`** — mimo że szabla historycznie paruje. Rodzina
       * `sword` przestała być skrótem dla cech poszczególnych mieczy (2026-09-16),
       * a rapier ma być JEDYNYM podniesionym parrierem; druga broń z tą cechą
       * odbiera mu tożsamość, zanim ktokolwiek zdąży jej użyć.
       * ⛔ **Nie mnożnik krytyka** — ten należy do rodziny toporów i do sztyletu.
       * Szabla mówi „trafiam CZĘŚCIEJ”, nie „biję MOCNIEJ”.
       */
      critChanceBonus: 0.05,
      knockback: 0,
    },
    attacks: [{ id: "slash", name: "Cięcie", damageType: "slash" }],
    description:
      "Krzywa głownia, lekka w nadgarstku. Nie przebije kolczugi, ale rzadko trafia tam, gdzie kolczuga jest.",
  },
  rapier: {
    id: "rapier",
    weight: 1.6,
    name: "Rapier",
    type: "weapon",
    family: "sword",
    icon: { col: 4, row: 0 },
    iconTexture: "icon-weapon-rapier", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xd0d5e0,
    damageMin: 7,
    damageMax: 12,
    strScale: 0.02,
    dexScale: 0.07,
    attackCooldown: 0.44,
    swingDurationMs: 155,
    swingThrustPx: 11,
    buyPrice: 210,
    sellPrice: 84,
    durability: 85,
    requires: { strength: 1 },
    melee: {
      /** ⚠ 72, nie 74 — **sufit wymuszony niezmiennikiem Y2**: najdłuższa
       *  broń jednoręczna musi sięgać KRÓCEJ niż najkrótsza dwuręczna
       *  (bastard, 74). Rapier zostaje i tak najdłuższym ostrzem w jednej
       *  ręce w całej grze. */
      reach: 72,
      knockback: 0,
      /**
       * ⭐⭐ **JEDYNA broń w grze z podniesioną premią parowania — i to jest
       * cała jej tożsamość.** Dwukrotność tego, co niosą miecz i krótki miecz
       * (0,15), przy najniższych obrażeniach w rodzinie i najwęższym łuku
       * w całym arsenale (30°).
       *
       * ⚠ **To jest powód, dla którego `parryBonus` przestał być cechą
       * RODZINY** (2026-09-16). Gdyby nadal nią był, rapier nie miałby jak być
       * lepszym parrierem od tasaka — a tasak i rapier nie mają ze sobą
       * wspólnego nic poza kategorią biegłości.
       *
       * ⚠ Ranga Mastery w rodzinie `sword` mnoży EFEKT, więc M-IV daje tu
       * realnie dwa razy więcej niż przy zwykłym mieczu. Zamierzone: ranga
       * nagradza broń, której oś podnosi.
       */
      parryBonus: 0.3,
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description:
      "Wąska, długa sztych. Nie rąbie i nie powala — pilnuje odległości i czeka na cudzy błąd.",
  },
  bastard_sword: {
    id: "bastard_sword",
    weight: 3.4,
    name: "Bastard",
    type: "weapon",
    family: "sword",
    icon: { col: 7, row: 0 },
    iconTexture: "icon-weapon-bastard-sword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xb4b9c4,
    damageMin: 12,
    damageMax: 19,
    strScale: 0.07,
    dexScale: 0.035,
    attackCooldown: 0.6,
    swingDurationMs: 225,
    swingThrustPx: 9,
    buyPrice: 260,
    sellPrice: 104,
    durability: 120,
    requires: { strength: 4 },
    /**
     * ⚠⚠ **`hands: 2`, i to jest DECYZJA, nie uproszczenie.** Półtorak jest
     * historycznie bronią o chwycie PRZEŁĄCZALNYM, a model zna dziś wyłącznie
     * „jedna ręka" i „druga ręka zostaje pusta". ⛔ Trzeci stan `hands` nie
     * powstaje: przełączalny chwyt to przyszła MECHANIKA, a nie wariant
     * zapisu, i nie ma blokować katalogu.
     */
    hands: 2,
    /**
     * ⭐⭐ **KATEGORIA 1.5H** — `hands: 2` wyżej zostaje i mówi, czym jest PEŁNY
     * profil tej broni; `grip: "either"` mówi, że istnieje profil MNIEJSZY.
     * Tryb wyprowadza się ze stanu drugiej ręki — pusta → oburęczny, zajęta →
     * jednoręczny. ⛔ Bez przełącznika, bez pola w zapisie, bez wyboru w walce.
     * Decyzja: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.
     */
    grip: "either",
    /**
     * ⏳⏳ **PLAYTEST BASELINE, NIE BALANS** — jednoręcznie ×0,85 siły ciosu.
     * ⭐ **Jedyna kara i to jest decyzja.** Zasięg, tempo, wymagania, masa
     * i skalowanie atrybutami zostają bez zmian: długość głowni nie zależy od
     * tego, ilu rękami ją trzymasz — napęd ciosu zależy.
     * ⛔ **Tempa NIE karzemy** — tarcza bierze już ×1,08…×2,15 przez
     *   `offhandSwingMul`, a przez zamach także staminę i ukorzenienie.
     *   Druga kara na tej samej osi byłaby podwójnym opodatkowaniem jednej
     *   decyzji gracza.
     * ⛔ **Warianty ataku zostają OBA** (Cięcie i Pchnięcie) — decyzja autora
     *   2026-09-18: różnica między konfiguracjami ma być płynna, a nie polegać
     *   na nagłym odebraniu podstawowej funkcji.
     */
    oneHanded: { damageMul: 0.85 },
    melee: {
      /** ⚠ 78, nie 74 — **podłoga z niezmiennika Y2**. Wiążącą bronią
       *  jednoręczną jest tu STARTOWY KIJ (74), nie rapier: drzewce jest
       *  długie, a kij nigdy nie miał być krótki. Bastard siada między
       *  toporem bojowym (76) a młotem bojowym (80). */
      reach: 78,
      knockback: 0,
    },
    attacks: [
      { id: "cut", name: "Cięcie", damageType: "slash" },
      /** Reguła zawężania: wariant ZABIERA łuk i dokłada wysunięcie, niczego
       *  nie przyznając. */
      { id: "thrust", name: "Pchnięcie", damageType: "pierce", sweepMul: 0.4, thrustMul: 1.5 },
    ],
    description:
      "Długa rękojeść pod dwie dłonie i głownia, która nadal daje się prowadzić czubkiem. Kompromis, który wygrywa w polu.",
  },
  greatsword: {
    id: "greatsword",
    weight: 4.6,
    name: "Miecz dwuręczny",
    type: "weapon",
    family: "sword",
    icon: { col: 8, row: 0 },
    iconTexture: "icon-weapon-greatsword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xaeb3bf,
    damageMin: 14,
    damageMax: 23,
    strScale: 0.085,
    dexScale: 0.02,
    /** ⚠ 0,80 — **wymuszone przez §T6**: przy 0,72 pierwszy autoatak po
     *  Uderzeniu tarczą lądował 22 ms od końca ogłuszenia, czyli o liczbie
     *  darmowych ciosów decydowałby szum, a nie projekt. ⛔ Nie schodź niżej
     *  bez przeliczenia tamtego okna. */
    attackCooldown: 0.8,
    swingDurationMs: 275,
    swingThrustPx: 8,
    buyPrice: 380,
    sellPrice: 152,
    durability: 130,
    requires: { strength: 6 },
    hands: 2,
    melee: {
      reach: 82,
      knockback: 0,
    },
    attacks: [
      { id: "cut", name: "Cięcie", damageType: "slash" },
      { id: "thrust", name: "Pchnięcie", damageType: "pierce", sweepMul: 0.35, thrustMul: 1.6 },
    ],
    description:
      "Tyle stali, ile jeden człowiek uniesie w biegu. Robi miejsce wokół siebie i to jest jej jedyny argument.",
  },

  /* ── DRZEWCOWE (rodzina `polearm`) ─────────────────────────────────────
     ⚠⚠ **Zasięg NIE MOŻE ich różnicować i to jest zmierzone.** Trafialność
     orbitującego wilka skacze z 22,1% na 97,0% między 95 a 96 px
     (`WOLF.pack.circleRadius` = 96), więc każda użyteczna broń drzewcowa musi
     stanąć powyżej tego progu — czyli wszystkie po tej samej stronie jedynej
     liczby, która naprawdę rozstrzyga.
     ⭐ Dlatego rozdziela je **`melee.minReach`** (martwa strefa w zwarciu),
     łuk, tempo i warianty. Pełne uzasadnienie progu:
     `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`.
     ⛔ **Włócznia zostaje BEZ `minReach`** — nie dostaje martwej strefy tylko
     dlatego, że parametr powstał. Jej tożsamością jest sam zasięg i tak ma
     zostać. */
  pike: {
    id: "pike",
    weight: 4.2,
    name: "Pika",
    type: "weapon",
    family: "polearm",
    icon: { col: 4, row: 5 },
    iconTexture: "icon-weapon-pike", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0xb9a58a,
    damageMin: 12,
    damageMax: 18,
    strScale: 0.085,
    dexScale: 0.03,
    /** ⚠ 0,82 — **najwolniejsza broń w grze**, i to nie jest wybór
     *  stylistyczny: przy 0,75 margines do końca ogłuszenia wynosił 2 ms
     *  (§T6). Pice wolno być najwolniejszą; nie wolno jej stać na klifie. */
    attackCooldown: 0.82,
    swingDurationMs: 265,
    swingThrustPx: 12,
    buyPrice: 200,
    sellPrice: 80,
    durability: 90,
    requires: { strength: 4 },
    hands: 2,
    melee: {
      reach: 128,
      /**
       * ⭐⭐ **Największa martwa strefa w grze — i to JEST ta broń.** Poniżej
       * 62 px prześwitu pika nie trafia w ogóle: kto przejdzie pod grot, jest
       * bezpieczny. Pasmo robocze (62–128) jest mimo to najszersze z całego
       * arsenału.
       *
       * ⚠ Wartość dobrana wobec jedynej twardej liczby, jaką mamy:
       * `WOLF.pack.circleRadius` (96). Wilk na orbicie jest w paśmie; wilk,
       * który zamknął dystans — nie jest.
       */
      minReach: 62,
      knockback: 0,
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce", sweepMul: 0.35 }],
    description:
      "Drzewce dłuższe od dwóch ludzi. Rozstrzyga, zanim przeciwnik zdąży podejść — i nie ma nic do powiedzenia, kiedy już podszedł.",
  },
  halberd: {
    id: "halberd",
    weight: 4.4,
    name: "Halabarda",
    type: "weapon",
    family: "polearm",
    icon: { col: 9, row: 2 },
    iconTexture: "icon-weapon-halberd", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0xa9a08c,
    damageMin: 13,
    damageMax: 22,
    strScale: 0.085,
    dexScale: 0.025,
    /** ⚠ 0,80 z tego samego powodu co przy mieczu dwuręcznym — §T6. */
    attackCooldown: 0.8,
    swingDurationMs: 270,
    swingThrustPx: 9,
    buyPrice: 340,
    sellPrice: 136,
    durability: 115,
    requires: { strength: 5 },
    hands: 2,
    melee: {
      reach: 110,
      /** Umiarkowana martwa strefa: głowica jest ciężka i blisko końca, więc
       *  w zwarciu zostaje drzewce — ale halabardnik ma czym zamachnąć się
       *  z bliżej niż pikinier. */
      minReach: 34,
      knockback: 0,
    },
    attacks: [
      { id: "chop", name: "Rąbnięcie", damageType: "slash" },
      { id: "thrust", name: "Pchnięcie", damageType: "pierce", sweepMul: 0.35, thrustMul: 1.5 },
    ],
    description:
      "Topór, szpic i hak na jednym drzewcu. Jedyna broń, przy której pytanie „czym go uderzyć” ma trzy odpowiedzi naraz.",
  },
  glaive: {
    id: "glaive",
    weight: 3.9,
    name: "Glewia",
    type: "weapon",
    family: "polearm",
    icon: { col: 8, row: 2 },
    iconTexture: "icon-weapon-glaive", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0xb0a894,
    damageMin: 11,
    damageMax: 19,
    strScale: 0.075,
    dexScale: 0.035,
    attackCooldown: 0.66,
    swingDurationMs: 250,
    swingThrustPx: 8,
    buyPrice: 290,
    sellPrice: 116,
    durability: 105,
    requires: { strength: 4 },
    hands: 2,
    melee: {
      reach: 104,
      /** Najmniejsza martwa strefa z trójki: głownia tnie całą długością,
       *  więc bliski przeciwnik wciąż jest na ostrzu. */
      minReach: 28,
      knockback: 0,
    },
    /** ⚠ **Jeden wariant i jawna sygnatura zamachu.** Para `sweepMul`/`thrustMul`
     *  jest jedyną rzeczą, która na jednej klatce ataku odróżnia cięcie od
     *  pchnięcia (`N-15`), więc glewia deklaruje ją wprost: duży zamiach, małe
     *  wysunięcie. ⛔ Drugiego wariantu NIE dostaje — pchnięcie drzewcem należy
     *  do piki i halabardy, a wariant „bo inne mają" jest wypełniaczem. */
    attacks: [{ id: "sweep", name: "Zamach", damageType: "slash", sweepMul: 1.35, thrustMul: 0.6 }],
    description:
      "Długa, lekko wygięta głownia na drzewcu. Nie zatrzymuje szarży jak pika, ale trzyma w szachu trzech naraz.",
  },

  /* ── OBUCHOWE (rodzina `blunt`) ────────────────────────────────────────
     ⚠ Rodzina niesie `staggerMs` 50 automatycznie — kiścień nie deklaruje go
     u siebie i nie powinien.

     ⛔⛔ **NIE DOSTAJE `interrupts` — i to jest rozstrzygnięcie, nie luka
     (2026-09-16).** Pytanie brzmiało: czy kiścień ma dość własnej tożsamości
     bez przerywania? Ma, i stoi ona na TRZECH istniejących osiach naraz:
       • **rozstrzał 14 (5–19) — najszerszy w całej grze**, szerszy nawet od
         siekiery (12). To jest oś tożsamości wprost z `weapons.md` §5;
       • **odrzut 300 przy JEDNEJ ręce** — jedyna broń jednoręczna z odrzutem
         poza młotem, a ten kosztuje 280 g i Siłę 6;
       • **zachwianie 50 ms z rodziny**, którego nie ma żadna broń spoza `blunt`.
     ⚠ Dodanie `interrupts` zrobiłoby z niego **tańszy młot** (190 g, Siła 3
     wobec 280 g, Siła 6) i odebrało tożsamość konstrukcji, która jest dziś
     najdroższa i najciężej bramkowana w swojej rodzinie.
     ⛔ Nie powstaje też dla niego osobna mechanika „omijania tarczy” — opis
     mówi o tym fikcją, a nowa mechanika dla jednej broni jest dokładnie tym,
     czego ten katalog unika. */
  flail: {
    id: "flail",
    weight: 3.1,
    name: "Kiścień",
    type: "weapon",
    family: "blunt",
    icon: { col: 6, row: 4 },
    iconTexture: "icon-weapon-flail", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x9aa0ac,
    /**
     * ⭐⭐ **Najszerszy rozstrzał obrażeń w grze (6–20) — i to jest tożsamość,
     * nie szum.** `docs/systemy/weapons.md` §5: rozstrzał jest osią. Kiścień
     * bywa gorszy od pałki i bywa lepszy od młota bojowego, a gracz nie ma
     * jak tego przewidzieć — bo i kiścieniem się nie da.
     */
    damageMin: 5,
    damageMax: 19,
    strScale: 0.07,
    dexScale: 0.015,
    attackCooldown: 0.58,
    swingDurationMs: 205,
    swingThrustPx: 6,
    buyPrice: 190,
    sellPrice: 76,
    durability: 95,
    requires: { strength: 3 },
    melee: {
      reach: 64,
      /** Niższy niż u młota (380) i młota bojowego (460): łańcuch oddaje część
       *  impetu, a kiścień jest bronią jednoręczną. */
      knockback: 300,
    },
    attacks: [{ id: "swing", name: "Zamach", damageType: "blunt" }],
    description:
      "Kula na łańcuchu. Omija tarczę, bo nie leci prosto — i z tego samego powodu bywa, że nie leci nigdzie.",
  },
  /**
   * ══════════════════════════════════════════════════════════════════════
   * DZIEWIĘĆ KONSTRUKCJI — druga partia SZEROKOŚCI katalogu (2026-09-17)
   * ══════════════════════════════════════════════════════════════════════
   *
   * ⚠⚠ **Ta partia jest odpowiedzią na pytanie „KTO tego używa", nie na
   * pytanie „czego brakuje w tabeli DPS".** Pierwsza partia (2026-09-16)
   * pokrywała RODZINY; ta pokrywa WARSTWY SPOŁECZNE, bo katalog broni ma
   * przedstawiać świat, zanim przedstawi wybór gracza:
   *
   * ```
   *   biedota i chłopi   Nóż · Cep bojowy · Kilof
   *   straż i zbrojni    Buzdygan · Berdysz
   *   osadnik/najemnik   Topór brodaty
   *   myśliwy            Rohatyna
   *   rycerstwo/obcy     Mizerykordia · Nadziak
   * ```
   *
   * ⛔ **Zero nowych rodzin, zero nowych pól, zero nowych gałęzi w kodzie
   * walki.** Wszystko niżej to dane na istniejących osiach: rodzina, model,
   * `hands`, `requires`, wariant, `material`. Jedyne, co partia dołożyła poza
   * `ITEMS`, to **dwie asercje** (`§ZB Z9`, `§ZB Z10`) i poprawka generatora,
   * który do dziś pokazywałby liczby STALOWE dla broni żelaznej.
   *
   * ⭐ **Gatunek materiału dostał PIERWSZYCH UŻYTKOWNIKÓW.** `WEAPON_MATERIAL`
   * powstał 2026-09-16 i nie korzystała z niego ani jedna broń. Żelazo biorą
   * dokładnie te dwie sztuki, w których jest faktem świata, a nie wyborem
   * projektanta: **cep** i **nóż** wychodzą z wiejskiej kuźni, a nie
   * z warsztatu płatnerza. ⚠⚠ Ich `damageMin/Max` i `buyPrice` są zapisane
   * jako RÓWNOWAŻNIK STALOWY — gracz zobaczy ×0,80 obrażeń i ×0,60 ceny
   * (`Quality.instanceDamage`, `Quality.buyPriceOf`).
   *
   * ⛔ **Rodzina `sword` nie dostała ani jednej pozycji i to jest WYNIK
   * AUDYTU, nie przeoczenie.** Osiem mieczy pokrywa już mieszczanina (kord),
   * straż (krótki miecz), żołnierza (miecz, bastard), rzeźnika i bandytę
   * (tasak), obcego kupca (szabla, rapier) i rycerza (dwuręczny). Każdy
   * kolejny kandydat — gladius, estok, katzbalger, „miecz szczerbaty" —
   * okazał się albo synonimem jednej z tych ośmiu, albo **osią JAKOŚCI
   * przebraną za konstrukcję** (zardzewiały miecz to miecz jakości 1, nie
   * nowy `ItemId`). Powody spisane w `docs/systemy/weapons.md`.
   *
   * ⛔⛔ **Dzida — jednoręczna drzewcowa — NIE POWSTAŁA i to jest decyzja
   * MECHANIKI, nie danych.** Świat jej chce (włócznia z tarczą to najczęstszy
   * zestaw piechoty, jaki istniał), ale `§Y Y2` mówi: *każda 2H sięga dalej
   * niż każda 1H*. Broń drzewcowa krótsza od 74 px przestaje być drzewcowa;
   * dłuższa od 76 px łamie Y2. Wyjście wymaga albo drugiego jawnego wyjątku
   * obok `hammer`, albo przestrojenia zasięgów 2H — jedno i drugie jest
   * rebalansem rosteru. ⏳ Zapisane jako `C4`, patrz checkpoint 2026-09-17.
   */

  /**
   * ══════════════════════════════════════════════════════════════════════
   * DRABINKA CZTERECH MIECZY — korekta zakresu (2026-09-17, etap III)
   * ══════════════════════════════════════════════════════════════════════
   *
   * ⚠⚠ **To jest KOREKTA, nie kolejna partia szerokości.** Etap II zamknął
   * audyt wnioskiem *„rodzina `sword` nie potrzebuje dokładania"* — i ten
   * wniosek dalej obowiązuje **dla konstrukcji szermierczych** (gladius,
   * estok, katzbalger zostają odrzucone). Decyzja autora zawęziła go: brakuje
   * nie kolejnego miecza, tylko **DRABINKI ROZMIARU**.
   *
   * ```
   *   Miecz długi      1H    duży, ale nadal jedna ręka       ← NOWE
   *   Bastard          2H    kompromis; docelowo 1H/2H        ← patrz C5
   *   Miecz dwuręczny  2H    pełnoprawny ciężki miecz 2H
   *   Wielki miecz     2H    ekstremum wszystkich osi         ← NOWE
   * ```
   *
   * ⛔ **To NIE jest drabinka mocy i nie wolno jej w nią zamienić.** Każdy
   * z czterech ma inny KOSZT: miecz długi płaci brakiem parowania i bramką
   * Siły wyższą niż jakikolwiek inny jednoręczny miecz; bastard płaci slotem
   * drugiej ręki; dwuręczny płaci tempem; wielki miecz płaci **wszystkim
   * naraz i jeszcze martwą strefą**.
   *
   * ⛔ **Zero nowych mechanik.** Wielki miecz jest ekstremum ISTNIEJĄCYCH osi
   * (obrażenia, zasięg, `minReach`, łuk, tempo, odrzut, Siła, masa) — ani
   * jedno pole nie powstało dla niego.
   */

  longsword: {
    id: "longsword",
    weight: 3.2,
    name: "Miecz długi",
    type: "weapon",
    family: "sword",
    /**
     * ⚠⚠ **JEDNORĘCZNY — i to jest cała decyzja, nie szczegół.** Historycznie
     * „miecz długi" bywa bronią oburęczną; **w tym świecie nazwa oznacza
     * największą głownię, jaką da się prowadzić jedną ręką**, bo to jest rola,
     * której w katalogu brakowało. ⛔ Nie dopisuj mu `hands: 2` „dla realizmu" —
     * miejsce ciężkiego miecza 2H zajmują `greatsword` i `zweihander`, a ta
     * konstrukcja istnieje po to, żeby **dało się nosić duży miecz z tarczą**.
     */
    /** Ikona (1,5) — **narysowana**, nie wzięta z wolnego kafla, i to nie jest
     *  fanaberia: oba wolne kafle rzędu mieczy są MNIEJSZE od zwykłego miecza
     *  ((0,2) 174 px, (0,3) 185 px wobec 239 px `sword`), więc ikona kłamałaby
     *  o jedynej cesze, którą ta broń ma. Generator: `tools/build_ikony_mieczy.py`. */
    icon: { col: 5, row: 1 },
    iconTexture: "icon-weapon-longsword", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xc0c5d0,
    /** ⚠ Średnia 12,0 — **sufit z `§Y Y3`**, ten sam, o który opiera się
     *  buzdygan, kilof i nadziak: najmocniejsza 1H musi bić słabiej niż
     *  najsłabsza 2H (włócznia, 12,5). ⛔ Miecz długi **nie jest mocniejszy
     *  od zwykłego miecza o tyle, o ile jest większy** — i tak ma zostać.
     *  Rozstrzał 6 odróżnia go od szabli (4) i tasaka (10) przy tej samej
     *  średniej. */
    damageMin: 9,
    damageMax: 15,
    strScale: 0.055,
    dexScale: 0.035,
    /** ⚠ 0,56 — wolniejszy od każdego innego miecza jednoręcznego (rapier 0,44,
     *  szabla 0,46, miecz 0,50). Sufit jest twardy: `§Y Y1` wymaga, żeby każda
     *  2H miała dłuższy cooldown niż każda 1H, a najszybsza 2H ma 0,60. */
    attackCooldown: 0.56,
    swingDurationMs: 200,
    swingThrustPx: 9,
    buyPrice: 195,
    sellPrice: 78,
    durability: 120,
    /** ⭐ **Siła 4 — najwyższa bramka wśród mieczy jednoręcznych** (miecz 2,
     *  tasak 3). To jest główna cena tej konstrukcji: duży miecz w jednej ręce
     *  wymaga ręki, która go utrzyma. */
    requires: { strength: 4 },
    melee: {
      /** ⭐ **74 — najdłuższy zasięg broni JEDNORĘCZNEJ w grze**, na równi
       *  z osiosanym kijem i dalej niż rapier (72) czy młot (78 — patrz
       *  udokumentowana anomalia `hammer` w `§Y Y4`).
       *  ⚠⚠ **Sufit jest twardy i wynosi 74**: `§Y Y2` wymaga, żeby każda 2H
       *  sięgała dalej niż każda 1H, a najkrótsza 2H (topór bojowy) ma 76.
       *  ⛔ Nie podnoś tej liczby ani o jeden piksel bez przestrojenia 2H. */
      reach: 74,
      knockback: 0,
      /** ⛔ **Bez `parryBonus` — i to jest wybór, nie przeoczenie.** Parowanie
       *  należy do mieczy, którymi się FECHTUJE: miecza (0,15), krótkiego
       *  miecza (0,15) i rapiera (0,30). Miecz długi jest ciężki i wolny;
       *  jego odpowiedzią na cios jest tarcza w drugiej ręce, nie własna
       *  głownia. To jest druga połowa ceny za zasięg 74 i łuk 72°. */
    },
    /** ⛔ **Jeden wariant.** Pchnięcie należy do mieczy o wąskim, sztywnym
     *  ostrzu (rapier, bastard, dwuręczny) i do tych, które i tak niosą dwa
     *  sposoby użycia. Szeroka, ciężka głownia na jednej ręce pcha źle —
     *  a wariant „bo inne mają" jest wypełniaczem. */
    attacks: [{ id: "cut", name: "Cięcie", damageType: "slash" }],
    description:
      "Głownia o dłoń dłuższa od zwykłej, a rękojeść nadal na jedną rękę. Nosi go ten, kto chce zasięgu i nie zamierza oddać tarczy.",
  },
  zweihander: {
    id: "zweihander",
    weight: 8,
    name: "Wielki miecz",
    type: "weapon",
    family: "sword",
    hands: 2,
    /** Ikona (1,4) — **narysowana**; na arkuszu nie było sylwetki większej od
     *  tasaka. ⭐ Odróżnia ją **ZBROCZE** — ciemna bruzda wzdłuż środka
     *  głowni, której nie ma żadna inna ikona tego arkusza. Generator:
     *  `tools/build_ikony_mieczy.py`. */
    icon: { col: 4, row: 1 },
    iconTexture: "icon-weapon-zweihander", // `tools/build_sword_icons.py`
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xb8bec9,
    /**
     * ⭐⭐ **27,0 średniej — najwyższa w grze, o 8,5 ponad młotem bojowym
     * (18,5).** To jest skok, nie szczebel, i tak ma być: wielki miecz jest
     * EKSTREMUM drabinki, a nie jej następnym elementem.
     * ⚠ Rozstrzał 14 dorównuje kiścieniowi — taką masą albo się trafia
     * w całości, albo wcale.
     */
    damageMin: 20,
    damageMax: 34,
    /** Najbardziej siłowa krzywa w grze i **zerowa nagroda za Zręczność**:
     *  zręcznościowiec z wielkim mieczem nie ma czym go przyspieszyć. */
    strScale: 0.09,
    dexScale: 0.005,
    /** ⭐ **0,95 — najwolniejsza broń w grze**, wolniejsza od piki (0,82).
     *  Razem z zamachem 340 ms daje najdłuższe ukorzenienie w rosterze. */
    attackCooldown: 0.95,
    swingDurationMs: 340,
    swingThrustPx: 14,
    /** ⭐ Najdroższa broń w katalogu — 600 g wobec 380 g miecza dwuręcznego. */
    buyPrice: 600,
    sellPrice: 240,
    durability: 160,
    /**
     * ⭐⭐ **Siła 8 — najwyższa bramka w grze** (dotąd 6: młot, młot bojowy,
     * miecz dwuręczny). ⚠ Nic w kodzie nie ogranicza tej liczby z góry;
     * ogranicza ją rozgrywka — 8 punktów Siły to inwestycja, po której
     * **nie ma respeca**, więc to jest deklaracja buildu, a nie zakup.
     */
    requires: { strength: 8 },
    melee: {
      /**
       * ⭐ **92 — najdalej sięgająca broń NIEDRZEWCOWA.**
       * ⚠⚠ **Sufit wyznacza `§ZB Z9`, nie gust**: obietnicą rodziny `polearm`
       * jest to, że każda drzewcowa sięga dalej niż wszystko inne, a najkrótsza
       * drzewcowa (włócznia) ma 98. ⛔ Nie podnoś 92 do 98 — rodzina drzewcowa
       * straciłaby jedyne, co ma.
       */
      reach: 92,
      /**
       * ⭐⭐ **PIERWSZA MARTWA STREFA POZA BRONIĄ DRZEWCOWĄ** — i to jest
       * najważniejsza rzecz w tym wpisie.
       *
       * ⚠ `minReach` był dotąd cechą wyłącznie pik, halabard i glewii, przez co
       * łatwo było wziąć go za własność rodziny `polearm`. **Nie jest** —
       * `§W W11d` mówi to od początku, a wielki miecz to teraz *pokazuje*:
       * dwumetrowej głowni nie da się użyć w zwarciu bez względu na to, do
       * jakiej rodziny należy.
       *
       * ⚠ **30, czyli mniej niż halabarda (34) i pika (62), a więcej niż
       * glewia (28).** Wielki miecz jest bezradny w zwarciu, ale nie tak
       * bezradny jak pika — można go skrócić chwytem za głownię, czego
       * z drzewcem zrobić się nie da. Pasmo robocze 30–92 zostaje najszersze
       * w grze.
       */
      minReach: 30,
      /** ⚠ 260 — mniej niż młot (380), bo to jest cięcie, a nie uderzenie
       *  obuchem; ale jedyne cięcie w grze, które w ogóle odrzuca.
       *  ⛔ Bez `interrupts` — przerwanie zamachu zostaje własnością młotów
       *  i reguła zawężania nie pozwala wariantowi go przyznać. */
      knockback: 260,
    },
    /** ⛔ **Jeden wariant.** Kusi, żeby dołożyć pchnięcie „bo dwuręczny
     *  i bastard je mają" — ale to one są bronią, którą da się prowadzić
     *  ostrzem naprzód. Wielki miecz ma jeden sposób użycia i jest nim
     *  zamach; drugi wariant osłabiłby to jedyne zdanie, które go opisuje. */
    attacks: [{ id: "swing", name: "Zamach", damageType: "slash" }],
    description:
      "Dwa metry stali z zbroczem przez całą głownię. Nie fechtuje się nim — nim się zamiata, a kto podejdzie bliżej niż na długość ramienia, ten jest bezpieczny.",
  },
  /* ── SZTYLETY (rodzina `dagger`) ───────────────────────────────────────
     ⚠ Rodzina miała JEDEN model przez cały czas istnienia projektu i była
     przez to najwęższa w katalogu — „precyzja" bez żadnego wyboru w środku.
     Dwie pozycje niżej rozciągają ją na całą drabinkę majątku: nóż kosztuje
     15 g i ma go każdy, mizerykordia kosztuje 150 g i nie ma jej tu nikt. */
  knife: {
    id: "knife",
    weight: 0.4,
    name: "Nóż",
    type: "weapon",
    family: "dagger",
    /**
     * ⚠ **Do 2026-09-17 „Nóż" NIE ISTNIAŁ w tej grze w żadnej postaci** —
     * sprawdzone przy poprzedniej partii i zapisane w checkpointcie
     * 2026-09-16 jako „nie wymuszono konstrukcji bojowej". Tamta decyzja
     * dotyczyła sytuacji, w której nóż nie miał ani ikony, ani sprzedawcy,
     * ani powodu; dziś ma wszystkie trzy. ⛔ To nie jest cofnięcie tamtego
     * rozstrzygnięcia, tylko domknięcie go od strony, która wtedy była pusta.
     */
    /** Ikona (8,0) — jedyna na arkuszu głownia BEZ jelca. Reszta wolnych
     *  kafli rzędu 0 to miecze z krzyżem rękojeści, a nóż z jelcem kłamie
     *  o tym, czym jest: narzędziem, nie orężem. */
    icon: { col: 0, row: 8 },
    iconTexture: "icon-weapon-knife",
    color: 0xa9aab2,
    /**
     * ⭐ **`material: "iron"` — PIERWSZY użytkownik osi gatunku po stronie
     * broni.** Nóż kuje wiejski kowal z tego, co ma; stal idzie na ostrza,
     * za które ktoś płaci. ⚠⚠ **Liczby niżej są RÓWNOWAŻNIKIEM STALOWYM** —
     * w grze to 5,6–8,0 obrażeń i 12 g, bo `WEAPON_MATERIAL.iron` mnoży
     * obrażenia ×0,80, a cenę ×0,60.
     */
    material: "iron",
    /**
     * ⚠⚠ **Kalibrowane PRZECIW OSIOSANEMU KIJOWI, nie przeciw sztyletowi** —
     * i pierwsza wersja (5–9) była przez to pułapką, nie wyborem: po
     * przemnożeniu przez żelazo dawała **14,6 dps za 15 g** wobec **16,8 dps
     * za 12 g** kija startowego. Gorzej i drożej niż rzecz, którą gracz już ma.
     *
     * ⭐ 7–10 (czyli 5,6–8,0 w żelazie) stawia nóż **dokładnie obok kija**:
     * 17,8 dps wobec 16,8 przy zerowych atrybutach i równo przy Sile 4.
     * Różnica nie jest w liczbach obrażeń, tylko w dwóch innych rzeczach:
     *  • **zasięg 50 wobec 74** — nożem trzeba WEJŚĆ w przeciwnika;
     *  • **nóż NALEŻY DO RODZINY** (`dagger`), a kij świadomie do żadnej.
     *    Bicie nożem buduje biegłość sztyletu i otwiera u niej Mastery;
     *    bicie kijem nie buduje niczego. To jest cały powód, dla którego
     *    ktoś miałby wydać te dwanaście sztuk złota.
     * ⛔ Nie podnosi się tego wyżej — sztylet za 40 g (20,0 dps) ma zostać
     * wyraźnym awansem, a nie kosmetyką.
     */
    damageMin: 7,
    damageMax: 10,
    /** Krzywa sztyletu, tylko płytsza — nóż nie ma czym nagrodzić inwestycji
     *  w Zręczność tak, jak sztylet. */
    strScale: 0.015,
    dexScale: 0.05,
    /** ⚠⚠ **0,44 — ta liczba jest WYMUSZONA przez `§T6`, nie dobrana.**
     *  Przy 0,42 trafienie nożem wypadało **25 ms** od końca okna ogłuszenia
     *  (próg to 50 ms), czyli o liczbie darmowych ciosów po Uderzeniu tarczą
     *  decydowałby szum. ⚠ Nóż dzieli dziś najkrótszy cooldown w grze
     *  z rapierem i **nie wolno go skracać** bez przeliczenia `§T6`. */
    attackCooldown: 0.44,
    swingDurationMs: 130,
    swingThrustPx: 4,
    /** ⚠ 20 × 0,60 (żelazo) = **12 g, czyli co do grosza tyle, co osiosany
     *  kij** — i to jest celowe, nie zbieg okoliczności. Nóż ma być tą samą
     *  decyzją co kij, podjętą inaczej, a nie szczeblem drabinki. */
    buyPrice: 20,
    sellPrice: 8,
    durability: 45,
    // Bez `requires` — to jest przedmiot, który ma mieć KAŻDY, łącznie
    // z postacią, która nie zainwestowała ani punktu w Siłę.
    melee: {
      reach: 50,
      knockback: 0,
      /**
       * ⛔ **Bez `critChanceBonus` — świadomie.** Premia do szansy na krytyka
       * jest tożsamością SZTYLETU (0,10) i mizerykordii (0,18); nóż dostałby
       * ją wyłącznie po to, żeby „też coś mieć". Jego tożsamością jest CENA
       * i to, że nie ma bramki — nic więcej i nic mniej.
       */
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description:
      "Kawałek żelaza z drewnianą rękojeścią. Kroi chleb, oprawia zająca, obcina sznur — a jak trzeba, robi to samo z człowiekiem.",
  },
  misericorde: {
    id: "misericorde",
    weight: 0.8,
    name: "Mizerykordia",
    type: "weapon",
    family: "dagger",
    /**
     * ⚠⚠ **Ikona wybrana PRZY 17,6 px, nie na pełnym kaflu** — regła
     * `public/assets/README.md` („ikonę broni ocenia się przy 17,6 px").
     * Pierwszym wyborem było (0,0), czyli najkrótsza głownia rzędu mieczy —
     * **i przy tej wielkości była prawie nie do odróżnienia od sztyletu (1,0)**,
     * a oba stoją obok siebie na tej samej półce.
     * ⭐ (0,1) jest **dłuższa** i to rozstrzyga w obie strony: mizerykordia
     * naprawdę była dłuższa od zwykłego sztyletu (30–40 cm sztywnego ostrza),
     * a długość jest jedyną cechą, która przy 17,6 px jeszcze się czyta.
     * ⚠ Nóż (8,0) trzyma się osobno trzecią cechą — **brakiem jelca**.
     */
    icon: { col: 1, row: 0 },
    iconTexture: "icon-weapon-misericorde",
    color: 0xc6cad4,
    /**
     * ⚠⚠ **Te liczby też przeszły kalibrację z pułapki na wybór.** Pierwsza
     * wersja (6–10) dawała **23,1 dps za 150 g** wobec **25,0 dps za 40 g**
     * sztyletu — słabiej i czterokrotnie drożej, przy czym premia do szansy
     * na krytyka (0,18) jest **już policzona w tej liczbie**, więc nie zostało
     * nic, co by tę cenę tłumaczyło.
     * ⭐ 8–12 stawia ją nad sztyletem w dps — a cenę tłumaczy to, czym za nią
     * płaci: **łuk 22° i zasięg 52** (sztylet: 38° i 56). Mizerykordia bije
     * mocniej od sztyletu i **dużo trudniej nią trafić** — to jest wymiana,
     * a nie podatek.
     */
    damageMin: 8,
    damageMax: 12,
    /** Skrajniej zręcznościowa niż sztylet: siłacz z mizerykordią nie zadaje
     *  nią obrażeń w ogóle, bo ta broń nie bije — ona TRAFIA. */
    strScale: 0.01,
    dexScale: 0.055,
    attackCooldown: 0.46,
    swingDurationMs: 150,
    swingThrustPx: 4,
    /** ⚠ 150 g — **najdroższy sztylet w grze i cztery razy droższy od
     *  zwykłego**. Kupuje się tu `critChanceBonus` 0,18, przewagę w dps
     *  i stan społeczny właściciela — płacąc łukiem 22° za każde z trojga. */
    buyPrice: 150,
    sellPrice: 60,
    durability: 80,
    melee: {
      reach: 52,
      knockback: 0,
      /** ⭐ **0,18 — najwyższa premia do SZANSY na krytyka w grze** (sztylet
       *  0,10, szabla 0,05). ⚠ Składa się z `WEAPON_FAMILY.dagger.
       *  critMultiplierBonus` (SIŁA krytyka, +0,20), bo to dwie różne osie —
       *  patrz niezmiennik przy `Progression.critChance`. */
      critChanceBonus: 0.18,
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description:
      "Wąskie, sztywne ostrze bez ostrzy bocznych. Nie tnie i nie ma tego robić — wchodzi tam, gdzie kończy się pancerz.",
  },

  /* ── OBUCHOWE (rodzina `blunt`) ────────────────────────────────────────
     ⚠ Rodzina obuchowa jest w tym świecie rodziną NARZĘDZI i BIEDOTY tak
     samo, jak rodziną wojny — i dlatego rośnie najszybciej. Cztery pozycje
     niżej to dosłownie: seryjny oręż straży, cep do młócenia, kilof i dziób
     na siodło.
     ⭐ **Dwie z nich zadają `pierce`** i to jest pierwszy raz, kiedy rodzina
     obuchowa niesie inny typ obrażeń niż `blunt`. ⛔ To NIE łamie reguły
     zawężania: typ obrażeń należy do WARIANTU, nie do rodziny, a precedens
     stoi od dawna po drugiej stronie — siekiera (`axe`) ma wariant `Obuch`. */
  mace: {
    id: "mace",
    weight: 3,
    name: "Buzdygan",
    type: "weapon",
    family: "blunt",
    icon: { col: 4, row: 4 },
    iconTexture: "icon-weapon-mace", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0xb4b8c2,
    /** ⚠ Średnia 12,0 — **sufit z `§Y Y3`**: najmocniejsza 1H musi bić
     *  słabiej niż najsłabsza 2H (włócznia, 12,5). Rozstrzał 4 przy tej
     *  średniej odróżnia go od kilofa (6), nadziaka (8) i kiścienia (14),
     *  które mają dokładnie tę samą średnią — `docs/systemy/weapons.md` §5. */
    damageMin: 10,
    damageMax: 14,
    strScale: 0.065,
    dexScale: 0.02,
    attackCooldown: 0.52,
    swingDurationMs: 185,
    swingThrustPx: 8,
    buyPrice: 140,
    sellPrice: 56,
    durability: 120,
    requires: { strength: 3 },
    melee: {
      reach: 66,
      /**
       * ⛔ **Bez `knockback` i bez `interrupts` — tak samo jak pałka.** To są
       * własności MŁOTA, nie rodziny; buzdygan bierze z rodziny wyłącznie
       * `staggerMs: 50`. ⭐ I dopiero na nim ta oś zaczyna cokolwiek robić:
       * młot ma odrzut 380 ms, który i tak zawiesza AI dłużej, więc
       * `Math.max` zjadał zachwianie w całości. Buzdygan jest pierwszą
       * bronią obuchową o realnym tempie i BEZ odrzutu — czyli pierwszą,
       * na której 50 ms jest jedynym, co trzyma przeciwnika. Zapowiadał ją
       * wprost komentarz przy `WEAPON_FAMILY.blunt`.
       */
      knockback: 0,
    },
    attacks: [{ id: "strike", name: "Uderzenie", damageType: "blunt" }],
    description:
      "Żelazny łeb na krótkim trzonku, kuty seryjnie i wszędzie taki sam. Nosi go straż, bo nie trzeba umieć nim fechtować.",
  },
  war_pick: {
    id: "war_pick",
    weight: 2.6,
    name: "Nadziak",
    type: "weapon",
    family: "blunt",
    icon: { col: 0, row: 3 },
    iconTexture: "icon-weapon-war-pick", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0xaeb3be,
    /** ⚠ **Nadziak i kilof to NIE jest ta sama broń w dwóch cenach** — i to
     *  jest dokładnie ten przypadek, dla którego istnieje oś konstrukcji.
     *  Kilof to narzędzie: ciężki (4,0 kg), wolny (0,56), tani (70 g).
     *  Nadziak jest zrobiony po to, żeby go NOSIĆ: lżejszy o 1,4 kg, szybszy
     *  o 60 ms, i kosztuje 230 g. Rozstrzał 8 przy średniej 12,0 odróżnia go
     *  od obu sąsiadów w rodzinie. */
    damageMin: 8,
    damageMax: 16,
    strScale: 0.06,
    dexScale: 0.03,
    attackCooldown: 0.5,
    swingDurationMs: 175,
    swingThrustPx: 9,
    buyPrice: 230,
    sellPrice: 92,
    durability: 110,
    requires: { strength: 4 },
    melee: {
      reach: 64,
      knockback: 0,
    },
    attacks: [{ id: "swing", name: "Zamach", damageType: "pierce" }],
    description:
      "Młotek z długim dziobem, kuty pod jedną rękę i siodło. Kto go nosi, ten nie spodziewa się chłopów z widłami.",
  },
  peasant_flail: {
    id: "peasant_flail",
    weight: 3.6,
    name: "Cep bojowy",
    type: "weapon",
    family: "blunt",
    hands: 2,
    icon: { col: 5, row: 4 },
    iconTexture: "icon-weapon-peasant-flail", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8f7040,
    /** ⭐ Drugi użytkownik osi gatunku. Cep bojowy to cep do młócenia
     *  z okutym bijakiem — kuje go ten sam kowal, co podkowy, i z tego
     *  samego żelaza. ⚠⚠ Liczby niżej są RÓWNOWAŻNIKIEM STALOWYM: w grze to
     *  4,0–21,6 obrażeń i **45 g**, czyli najtańsza dwuręczna w katalogu. */
    material: "iron",
    /** ⭐⭐ **Rozstrzał 22 — najszerszy w grze, szerszy nawet od kiścienia
     *  (14).** To ta sama tożsamość, tylko doprowadzona do końca: cep nie
     *  jest bronią, którą się CELUJE. Bywa, że przechodzi przez obojczyk,
     *  i bywa, że odbija się od ramienia i wraca w twarz właściciela. */
    damageMin: 5,
    damageMax: 27,
    strScale: 0.075,
    dexScale: 0.01,
    /** ⚠ 0,70, a nie 0,72 — **wymuszone przez `§T6`** dokładnie tak, jak 0,44
     *  u noża: przy 0,72 trafienie wypadało 35 ms od końca okna ogłuszenia. */
    attackCooldown: 0.7,
    swingDurationMs: 250,
    swingThrustPx: 7,
    buyPrice: 75,
    sellPrice: 30,
    /** Najniższa trwałość wśród dwuręcznych — rzemień i drewno, nie trzonek
     *  kuty pod broń. */
    durability: 70,
    requires: { strength: 3 },
    melee: {
      reach: 78,
      /** Niższy niż u kiścienia (300): bijak jest dłuższy, ale lżejszy
       *  i idzie na rzemieniu, nie na łańcuchu. */
      knockback: 180,
    },
    attacks: [{ id: "swing", name: "Zamach", damageType: "blunt" }],
    description:
      "Cep do młócenia z bijakiem nabitym żelazem. Nie trzeba go kupować ani umieć — wystarczy mieć dość.",
  },

  /* ── TOPORY (rodzina `axe`) ────────────────────────────────────────────
     ⚠ Rodzina miała trzy modele i wszystkie były o TYM SAMYM: ostrze na
     trzonku, coraz większe. Dwie pozycje niżej dokładają dwie inne rzeczy —
     topór, który jest jednocześnie narzędziem osadnika, i topór, który jest
     wyłącznie oporządzeniem szyku. */
  bearded_axe: {
    id: "bearded_axe",
    weight: 2.4,
    name: "Topór brodaty",
    type: "weapon",
    family: "axe",
    icon: { col: 1, row: 2 },
    iconTexture: "icon-weapon-bearded-axe", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xa8adb8,
    /** Średnia 11,5 i rozstrzał 9 — dokładnie między toporkiem (10,5/5)
     *  a siekierą (12,0/12). To jest jego miejsce także w cenie: 115 g
     *  między 70 a 180. */
    damageMin: 7,
    damageMax: 16,
    strScale: 0.06,
    dexScale: 0.03,
    attackCooldown: 0.52,
    swingDurationMs: 180,
    swingThrustPx: 8,
    buyPrice: 115,
    sellPrice: 46,
    durability: 105,
    requires: { strength: 2 },
    melee: {
      reach: 66,
      knockback: 0,
    },
    /** ⛔ **Jeden wariant.** „Obuch" należy do siekiery i topora bojowego,
     *  bo obie mają czym uderzyć na płask; topór brodaty ma cienki, długi
     *  blat i obuch wielkości pięści. Wariant „bo inne mają" jest
     *  wypełniaczem — ta sama decyzja, co przy glewii. */
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description:
      "Długa, cienka broda ostrza schodzi pod samą rękę. Rąbie drewno tak samo dobrze jak tarczę — i dlatego ma go każdy, kto stawia dom daleko od innych.",
  },
  bardiche: {
    id: "bardiche",
    weight: 5.4,
    name: "Berdysz",
    type: "weapon",
    family: "axe",
    hands: 2,
    icon: { col: 5, row: 2 },
    iconTexture: "icon-weapon-bardiche", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xa4a9b4,
    damageMin: 12,
    damageMax: 21,
    strScale: 0.08,
    dexScale: 0.012,
    /** ⚠ 0,70 — ta sama bramka `§T6`, co u cepu: 0,72 dawało 35 ms marginesu. */
    attackCooldown: 0.7,
    swingDurationMs: 250,
    swingThrustPx: 10,
    buyPrice: 300,
    sellPrice: 120,
    durability: 125,
    requires: { strength: 5 },
    melee: {
      /**
       * ⚠⚠ **84 — i ta liczba ma DWA sufity naraz, oba twarde.**
       *  • Od dołu: `§Y Y2` wymaga, żeby każda 2H sięgała dalej niż każda 1H
       *    (najdłuższa 1H to kij, 74).
       *  • Od góry: **`§ZB Z10` — obietnica rodziny drzewcowej.** Berdysz
       *    jest toporem na długim drzewcu i kusi, żeby dać mu 95; wtedy
       *    sięgałby dalej niż włócznia (98) i rodzina `polearm` przestałaby
       *    znaczyć „to, co sięga dalej niż reszta".
       *    ⛔ Nie podnoś tej liczby — najkrótsza drzewcowa ma 98.
       */
      reach: 84,
      knockback: 0,
    },
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description:
      "Wielki półksiężyc stali na drzewcu do pasa. Nie nadaje się do niczego poza staniem w szeregu i rąbaniem tego, co podejdzie.",
  },

  /* ── DRZEWCOWE (rodzina `polearm`) ─────────────────────────────────────
     ⛔ Zasięg ich NIE RÓŻNICUJE i nie może — wszystkie użyteczne stoją
     powyżej progu orbity wilka (96 px). Rohatyna różni się od włóczni tym,
     co strażnik `§ZB Z3` naprawdę mierzy: łukiem i dps. */
  boar_spear: {
    id: "boar_spear",
    weight: 3.4,
    name: "Rohatyna",
    type: "weapon",
    family: "polearm",
    hands: 2,
    icon: { col: 3, row: 5 },
    iconTexture: "icon-weapon-boar-spear", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x9c7c4e,
    damageMin: 11,
    damageMax: 18,
    strScale: 0.075,
    dexScale: 0.035,
    attackCooldown: 0.64,
    swingDurationMs: 235,
    swingThrustPx: 10,
    /** ⚠ 190 g wobec 150 g włóczni — i ta różnica MUSI zostać. Rohatyna jest
     *  od włóczni lepsza w każdym kanale mocy (dps, zasięg, łuk, odrzut);
     *  jedyne, co trzyma ją poza dominacją (`§ZB Z1`), to cena i bramka
     *  Siły 4 zamiast 3. ⛔ Nie zrównuj tych cen. */
    buyPrice: 190,
    sellPrice: 76,
    durability: 105,
    requires: { strength: 4 },
    melee: {
      reach: 100,
      /**
       * ⭐ **Jedyna drzewcowa z odrzutem — i to jest dosłownie jej
       * poprzeczka.** Rohatyna ma pod grotem poprzeczkę po to, żeby dzik
       * nadziany na grot nie wszedł po drzewcu do trzymającego. `knockback`
       * jest najbliższym istniejącym odpowiednikiem tego zachowania i
       * **nie wymagał nowej mechaniki**.
       * ⛔ Bez `interrupts` — przerwanie zamachu zostaje własnością młotów.
       */
      knockback: 200,
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description:
      "Szeroki grot z poprzeczką pod piórami. Poprzeczka nie jest ozdobą: bez niej dzik wchodzi po drzewcu aż do rąk.",
  },
  /**
   * ══════════════════════════════════════════════════════════════════════
   * SZEŚĆ KONSTRUKCJI — domknięcie finalnej puli (2026-09-18)
   * ══════════════════════════════════════════════════════════════════════
   *
   * ⚠ **To jest ZAMKNIĘCIE katalogu, nie kolejna partia szerokości.** Pula
   * została ustalona przez autora z nazwy; ⛔ **nie dopisuj do niej kolejnych
   * konstrukcji historycznych.** Poza pulą świadomie zostają: Buława (brak osi
   * prestiżu), Lewak (czeka na dual wield), Sierp, kosa bojowa, partyzana,
   * lucerniak, gizarma, oszczep, dziryt, czekan.
   *
   * ⛔ **Zero nowych mechanik i zero nowych pól.** Wszystko niżej to dane na
   * osiach, które istnieją: rodzina, obrażenia, tempo, zasięg, `minReach`,
   * masa, `requires`, odrzut, `material` i WARIANT z własnym `damageType`.
   */

  great_club: {
    id: "great_club",
    weight: 4,
    name: "Maczuga",
    type: "weapon",
    family: "blunt",
    icon: { col: 2, row: 4 },
    iconTexture: "icon-weapon-great-club", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x8a6a3f,
    /** ⚠ Średnia 11,5 — pod sufitem `§Y Y3` (12,0). Maczuga bije mocniej od
     *  pałki (8,5), ale **wolniej**: dps 20,5 wobec 17,7, czyli różnica jest
     *  mniejsza, niż sugeruje sama liczba obrażeń. */
    damageMin: 9,
    damageMax: 14,
    strScale: 0.07,
    dexScale: 0.015,
    /** ⚠ 0,56 — przy 0,60 najszybszej dwuręcznej to jest bezpieczny margines
     *  `§Y Y1`; ⛔ nie podnoś bez przeliczenia całej reguły. */
    attackCooldown: 0.56,
    swingDurationMs: 200,
    swingThrustPx: 9,
    buyPrice: 45,
    sellPrice: 18,
    durability: 75,
    requires: { strength: 3 },
    melee: {
      reach: 66,
      /**
       * ⭐ **120 — najmniejszy odrzut w grze i jedyny na broni DREWNIANEJ.**
       * ⚠ Nie łamie to zasady „odrzut jest własnością młota": ta zasada mówi,
       * że nie należy do RODZINY, a nie że wolno go dać wyłącznie młotom —
       * dziś niesie go też kiścień, cep, rohatyna i wielki miecz.
       * ⛔ Bez `interrupts`: maczuga przewraca, ale niczego nie kasuje.
       * To jest cała różnica wobec pałki, która nie robi ani jednego, ani
       * drugiego, i wobec młota, który robi oba.
       */
      knockback: 120,
    },
    attacks: [{ id: "strike", name: "Uderzenie", damageType: "blunt" }],
    description:
      "Gruby konar obrobiony w rękojeść. Nie ma w niej ani grama żelaza i nie musi być — liczy się masa na końcu ramienia.",
  },
  war_hammer_1h: {
    id: "war_hammer_1h",
    weight: 2.8,
    name: "Młot bojowy 1H",
    type: "weapon",
    family: "blunt",
    /** Ikona (3,1) — mniejszy pobijak z tego samego rzędu, co młot bojowy 2H
     *  (3,2). ⚠ Pierwsze przypisanie wskazywało (3,0) i **kolidowało**
     *  z nadziakiem; wyłapał to skan kolizji, nie oko. */
    icon: { col: 1, row: 3 },
    iconTexture: "icon-weapon-war-hammer-1h", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0xb0b5c0,
    /**
     * ⚠⚠ **To NIE jest lżejszy `hammer` i nie wolno tego tak przestroić.**
     * Młot (`hammer`, 14–20, 5 kg, Siła 6) jest MASĄ na trzonku. Młot bojowy
     * jest **narzędziem kutym pod jedną rękę i siodło**: o połowę lżejszy,
     * wyraźnie szybszy (0,52 wobec 0,65) i **bije słabiej** — 12,0 średniej
     * wobec 17,0.
     * ⛔ Zgodnie z decyzją autora (F3) `hammer` **nie został obniżony**, żeby
     * zrobić miejsce tej konstrukcji. Sufit 12,0 bierze się z `§Y Y3`, a nie
     * z porównania z młotem.
     */
    damageMin: 9,
    damageMax: 15,
    strScale: 0.06,
    dexScale: 0.025,
    attackCooldown: 0.52,
    swingDurationMs: 185,
    swingThrustPx: 9,
    buyPrice: 300,
    sellPrice: 120,
    durability: 130,
    requires: { strength: 4 },
    melee: {
      reach: 68,
      /** Niższy niż u `hammer` (380): lżejszy łeb, krótszy trzonek. */
      knockback: 240,
      /** ⭐ Przerwanie zostaje — to jest młot bojowy, a nie ozdoba.
       *  ⚠ Wariant „Dziób" niżej je WYŁĄCZA (`interrupts: false`). */
      interrupts: true,
    },
    /**
     * ⭐⭐ **DWA WARIANTY — i to jest pierwszy użytkownik `interrupts: false`
     * od chwili powstania tego zamka.**
     *
     * ⚠ **Zero nowej mechaniki.** Wzorzec jest dokładnie ten, którym siekiera
     * i topór bojowy niosą swój `Obuch`: drugi wpis w `attacks`, własny
     * `damageType`, mnożniki na własnych liczbach broni.
     *
     * ⛔ **Dziób NIE przerywa**, i to jest cała treść drugiego wariantu:
     * przerwanie bierze się z rozpędzonej masy łba, a nie z kolca. Reguła
     * zawężania pozwala wariantowi zdolność **odebrać**, nigdy przyznać —
     * dlatego `interrupts` jest typu literalnie `false`.
     * ⛔ **Nie dokładaj penetracji pancerza ani mechaniki przeciw tarczom** —
     * system tego nie ma, a `pierce` przeciw przeszywanicy (0,35) i skórze
     * (0,45) jest całą przewagą, jakiej ten wariant potrzebuje.
     */
    attacks: [
      { id: "strike", name: "Uderzenie", damageType: "blunt" },
      {
        id: "beak",
        name: "Dziób",
        damageType: "pierce",
        reachMul: 0.95,
        damageMul: 0.9,
        thrustMul: 1.4,
        sweepMul: 0.45,
        interrupts: false,
      },
    ],
    description:
      "Krótki trzonek, mały łeb i długi kolec z drugiej strony. Kuty dla kogoś, kto wie, że przeciwnik będzie w żelazie.",
  },
  chain_mace: {
    id: "chain_mace",
    weight: 2.2,
    name: "Korbacz",
    type: "weapon",
    family: "blunt",
    icon: { col: 7, row: 4 },
    iconTexture: "icon-weapon-chain-mace", // `tools/build_blunt_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń > 45 cm = 1×2 (decyzja autora 2026-10-02)
    color: 0x9aa0ac,
    /**
     * ⚠⚠ **Korbacz i kiścień to NIE jest ta sama broń w dwóch cenach** — i to
     * jest para, którą audyt wskazał jako najbliższą duplikatowi w całej puli,
     * więc różnica musi być policzalna, a nie opisowa:
     *
     * ```
     *              rozstrzał   cykl    odrzut   masa   Siła   cena
     *   Kiścień        14      580 ms    300    3,1 kg   3    190
     *   Korbacz        10      500 ms    200    2,2 kg   2    130
     * ```
     *
     * ⭐ Kiścień jest CIĘŻSZY i bardziej nieprzewidywalny; korbacz **krótszy,
     * szybszy i tańszy** — ciężarek na rzemieniu, nie kula na łańcuchu.
     * ⛔ Zgodnie z decyzją autora (F5) **nie dostał bramki biegłości** —
     * takiego pola nie ma w `ITEMS`, a tworzenie go dla jednej broni byłoby
     * nową mechaniką.
     */
    damageMin: 6,
    damageMax: 16,
    strScale: 0.065,
    dexScale: 0.025,
    attackCooldown: 0.5,
    swingDurationMs: 175,
    swingThrustPx: 6,
    buyPrice: 130,
    sellPrice: 52,
    durability: 85,
    requires: { strength: 2 },
    melee: {
      reach: 62,
      knockback: 200,
    },
    attacks: [{ id: "swing", name: "Zamach", damageType: "blunt" }],
    description:
      "Okuty ciężarek na krótkim łańcuchu. Lżejszy od kiścienia i szybszy — trafia częściej, przewraca rzadziej.",
  },
  dane_axe: {
    id: "dane_axe",
    weight: 4.2,
    name: "Topór duński",
    type: "weapon",
    family: "axe",
    hands: 2,
    /** Ikona (2,3) — pojedynczy, wąski blat na drzewcu. ⚠ Pierwsze
     *  przypisanie wskazywało (2,5) i **kolidowało z berdyszem**. */
    icon: { col: 3, row: 2 },
    iconTexture: "icon-weapon-dane-axe", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xa8adb8,
    /**
     * ⚠⚠ **Najsłabszy z czterech toporów dwuręcznych i to jest zamierzone.**
     * Cienki, szeroki blat na długim drzewcu waży mało — stąd 4,2 kg wobec
     * 5,4 berdysza i 6,0 topora bojowego — i **nie ma czym uderzyć z masy**.
     * Płaci za to zasięgiem: 88 to najdalej sięgający topór w grze.
     *
     * ⚠ 0,64 i średnia 15,0 dają dps **23,4 wobec 23,6 berdysza** — poniżej
     * o włos, i ten włos jest konieczny: bez niego topór duński dominowałby
     * berdysz (`§ZB Z1`), bo jest od niego lżejszy, tańszy i dłuższy.
     * ⛔ Nie „zaokrąglaj" tej liczby w górę.
     */
    damageMin: 11,
    damageMax: 19,
    strScale: 0.075,
    dexScale: 0.02,
    attackCooldown: 0.64,
    swingDurationMs: 240,
    swingThrustPx: 10,
    buyPrice: 280,
    sellPrice: 112,
    durability: 110,
    requires: { strength: 4 },
    melee: {
      /** ⚠ 88 — sufit stawia `§ZB Z9`: najkrótsza drzewcowa (włócznia) ma 98,
       *  a obietnicą rodziny `polearm` jest to, że sięga dalej niż wszystko
       *  inne. ⛔ Nie podnoś do 95+. */
      reach: 88,
      knockback: 0,
    },
    /** ⛔ Jeden wariant. Obuch należy do siekiery i topora bojowego — duński
     *  ma za cienki blat, żeby uderzyć nim na płask. */
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description:
      "Szeroki, cienki jak brzytwa blat na drzewcu do ramienia. Lekki w rękach i bezużyteczny wszędzie tam, gdzie trzeba czymś przywalić.",
  },
  labrys: {
    id: "labrys",
    weight: 7,
    name: "Labrys",
    type: "weapon",
    family: "axe",
    hands: 2,
    /** ⭐ Ikona (2,6) — **jedyny na arkuszu podwójny półksiężyc**, czyli
     *  dosłownie to, czym labrys jest. Najwięcej metalu w rzędzie toporów
     *  (347 px) — zgodne z tym, że jest najcięższy. */
    icon: { col: 6, row: 2 },
    iconTexture: "icon-weapon-labrys", // `tools/build_axe_icons.py` (2026-10-02)
    inventoryFootprint: { w: 1, h: 2 }, // broń średnia/duża = 1×2 (reguła autora 2026-10-01)
    color: 0xa4a9b4,
    /** ⭐ **Najwyższa średnia wśród toporów (20,0)** i najszerszy rozstrzał
     *  po toporze bojowym. Dwa blaty to dwa razy więcej stali na tym samym
     *  drzewcu — stąd 7 kg i Siła 6. */
    damageMin: 14,
    damageMax: 26,
    strScale: 0.085,
    dexScale: 0.008,
    /** ⚠ 0,80, a nie 0,78 — **wymuszone przez `§T6`**: przy 0,78 trafienie
     *  wypadało 45 ms od końca okna ogłuszenia przy progu 50 ms. Ta sama
     *  bramka przestroiła wcześniej nóż, cep i berdysz. */
    attackCooldown: 0.8,
    swingDurationMs: 290,
    swingThrustPx: 11,
    buyPrice: 400,
    sellPrice: 160,
    durability: 135,
    requires: { strength: 6 },
    melee: {
      /** ⚠ 78 — **najkrótszy z czterech toporów dwuręcznych**, i to jest
       *  jedyna rzecz trzymająca go poza dominacją topora bojowego
       *  (`§ZB Z1`): masa siedzi w głowicy, nie w długości drzewca. */
      reach: 78,
      knockback: 0,
    },
    attacks: [{ id: "chop", name: "Rąbnięcie", damageType: "slash" }],
    description:
      "Dwa blaty na wspólnym trzonku, symetryczne co do grama. Wygląda na rzecz z ołtarza i w rękach kogoś słabszego nią zostanie.",
  },
  pitchfork: {
    id: "pitchfork",
    weight: 3.2,
    name: "Widły",
    type: "weapon",
    family: "polearm",
    hands: 2,
    /**
     * ⭐⭐ **KATEGORIA 1.5H** — `hands: 2` wyżej zostaje i mówi, czym jest PEŁNY
     * profil tej broni; `grip: "either"` mówi, że istnieje profil MNIEJSZY.
     * Tryb wyprowadza się ze stanu drugiej ręki — pusta → oburęczny, zajęta →
     * jednoręczny. ⛔ Bez przełącznika, bez pola w zapisie, bez wyboru w walce.
     * Decyzja: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.
     */
    grip: "either",
    /**
     * ⏳⏳ **PLAYTEST BASELINE, NIE BALANS** — martwa strefa rośnie 20 → **60**.
     * ⭐ Widły są jedyną drzewcową z małą martwą strefą (20) i to nie jest
     * przypadek: dwa zęby na drzewcu dają się wbić z bliżej niż grot piki.
     * Jednoręcznie ten atut znika pierwszy — nie ma czym skrócić chwytu.
     * ⛔ **Zasięg 102 zostaje NIETKNIĘTY** i to jest cała idea 1.5H dla
     *   drzewcowych: płaci się kontrolą dystansu, nie długością drzewca.
     * ⛔ **Bez `damageMul`** — świadomie jedna kara naraz (`D-B`), żeby playtest
     *   miał co zmierzyć. Dokładanie drugiej przed pomiarem to zgadywanie.
     */
    oneHanded: { minReachAdd: 40 },
    /**
     * ⚠⚠ **IKONA PLACEHOLDEROWA (2,5)** — okuty drąg, nie widły.
     * Na `items.png` **nie ma sylwetki z zębami** i żadne przycięcie tego nie
     * da; przy 17,6 px czyta się jako „drąg z okuciem". ⛔ Pierwsze
     * przypisanie wskazywało (5,3) i **kolidowało z rohatyną** — dwa różne
     * przedmioty z jedną sylwetką to najgorszy przypadek w slocie, w którym
     * gracz porównuje towar w sklepie (`public/assets/README.md`).
     * ⏳ Docelowa ikona do narysowania — `OI-114`. ⛔ Brak ikony nie blokuje
     * katalogu, ale ten komentarz ma zostać, dopóki jej nie ma.
     */
    icon: { col: 2, row: 5 },
    iconTexture: "icon-weapon-pitchfork", // skos 1:2, `tools/build_polearm_icons.py` (2026-09-30)
    inventoryFootprint: { w: 1, h: 2 },
    color: 0x9c7c4e,
    /**
     * ⚠⚠ **PEŁNOPRAWNA KONSTRUKCJA DRZEWCOWA — nie „broń improwizowana".**
     * Widły mają długie drzewce i wąskie, sztywne zęby; **mechanicznie są
     * normalnym `polearm`** i tak są tu zapisane. Ich gospodarski charakter
     * wyraża się CENĄ, GATUNKIEM i DYSTRYBUCJĄ (półka Rolnika), a nie
     * kategorią mechaniczną. ⛔ Nie dopisuj im „improwizowana" ani nie rób
     * z nich gorszego zamiennika włóczni.
     */
    material: "iron",
    /** ⚠⚠ Liczby są RÓWNOWAŻNIKIEM STALOWYM — w grze to 7,2–12,8 obrażeń
     *  i **54 g**, bo `WEAPON_MATERIAL.iron` mnoży ×0,80 i ×0,60. */
    damageMin: 9,
    damageMax: 16,
    strScale: 0.07,
    dexScale: 0.03,
    attackCooldown: 0.62,
    swingDurationMs: 225,
    swingThrustPx: 11,
    buyPrice: 90,
    sellPrice: 36,
    durability: 80,
    requires: { strength: 3 },
    melee: {
      /** ⭐ 102 — dalej niż włócznia (98) i bezpiecznie ponad progiem orbity
       *  wilka (96). ⛔ Nie schodź do 96: tam leży pas ±2 px, którego zakazuje
       *  `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`. */
      reach: 102,
      /**
       * ⭐ **20 — najmniejsza martwa strefa w grze** (glewia 28, halabarda 34,
       * pika 62). Zęby siedzą na końcu długiego drzewca, więc w zwarciu widły
       * nie mają czym trafić — ale drzewce da się skrócić chwytem bliżej
       * zębów, czego z piką zrobić się nie da.
       * ⚠ To jest też oś, która odróżnia widły od WŁÓCZNI: obie są długie
       * i kłute, ale włócznia nie ma martwej strefy w ogóle (`§ZB Z3`).
       */
      minReach: 20,
      knockback: 0,
    },
    attacks: [{ id: "thrust", name: "Pchnięcie", damageType: "pierce" }],
    description:
      "Dwa długie zęby na drzewcu wyższym od człowieka. Kuje je ten sam kowal, co lemiesze, i trzyma je ten, kto nigdy nie planował nikogo nimi dźgać.",
  },
  /**
   * ── ZWYKŁY UBIÓR — pierwsza partia (2026-09-16) ────────────────────
   *
   * ⚠⚠ **Otwiera ponownie wiersz z taksonomii 2026-09-12.** Tamta decyzja
   * odrzuciła *„koszulę lnianą jako L1”* z uzasadnieniem *„nie chroni — slot do
   * zarządzania bez decyzji”*. ⭐ **Przesłanka się zmieniła** (decyzja autora
   * 2026-09-16): powodem nie jest ochrona, tylko to, że **jednostka
   * nieopancerzona ma mieć rzeczywiste wyposażenie zamiast pustych slotów**.
   * ⛔ Pozostałe wiersze tabeli „Odrzucone” zostają nietknięte.
   *
   * ⚠⚠ **`armorType: "padded"` jest KOMPROMISEM, nie opisem materiału.**
   * Warstwa wyprowadza się z profilu (`padded → L1`), a profilu `cloth` w
   * `ARMOR_PROFILE` NIE MA — dodanie go to nowa kolumna typów obrażeń, czyli
   * decyzja rangi `OI-100`. Przy 1 pkt ochrony różnica profilu jest poniżej
   * progu odczuwalności, więc ściągamy dziś najbliższą istniejącą rodzinę.
   *
   * ⏳⏳ **WSZYSTKIE LICZBY NIŻEJ SĄ TYMCZASOWE** (masa, PP, cena). Zostały
   * dobrane tak, żeby przedmiot działał, a nie żeby był zbalansowany — relacja
   * Łapcie → Trzewiki → Skórzane buty → Buty piechura → Buty kolcze jest
   * świadomie NIEROZSTRZYGNIĘTA i czeka na osobną ocenę.
   *
   * ⚠ **Ikony są POŻYCZONE** od istniejących sztuk tej samej rodziny — to jest
   * placeholder do passu artystycznego, nie docelowy asset.
   *
   * ⛔ **Żadnej z tych sztuk nie ma dziś na żadnej półce** — dystrybucja nie była
   * częścią tego pakietu.
   */
  cloth_coif: {
    id: "cloth_coif",
    weight: 0.2,                     // ⏳ TYMCZASOWE
    armorType: "padded",
    name: "Czepiec",
    type: "armor",
    slot: "head",
    icon: { col: 1, row: 21 },       // ⚠ PLACEHOLDER — ikona czepca pikowanego
    iconTexture: "icon-armor-cloth-coif", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xd8cbb0,
    defense: 1,                      // ⏳ TYMCZASOWE
    buyPrice: 4,                     // ⏳ TYMCZASOWE
    sellPrice: 1,
    description: "Płócienny czepiec wiązany pod brodą. Nosi go pół wsi — od kurzu, nie od miecza.",
  },
  linen_shirt: {
    id: "linen_shirt",
    weight: 0.4,                     // ⏳ TYMCZASOWE
    armorType: "padded",
    name: "Koszula",
    type: "armor",
    slot: "chest",
    icon: { col: 2, row: 22 },       // ⚠ PLACEHOLDER — ikona kaftana pikowanego
    iconTexture: "icon-armor-linen-shirt", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xe0d7c2,
    defense: 1,                      // ⏳ TYMCZASOWE
    buyPrice: 6,                     // ⏳ TYMCZASOWE
    sellPrice: 2,
    description: "Lniana, luzem w ramionach. Chroni przed słońcem i wiatrem; przed ostrzem nie udaje, że chroni.",
  },
  linen_trousers: {
    id: "linen_trousers",
    weight: 0.5,                     // ⏳ TYMCZASOWE
    armorType: "padded",
    name: "Spodnie",
    type: "armor",
    slot: "legs",
    icon: { col: 1, row: 23 },       // ⚠ PLACEHOLDER — ikona nogawic pikowanych
    iconTexture: "icon-armor-linen-trousers", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xc9b896,
    defense: 1,                      // ⏳ TYMCZASOWE
    buyPrice: 6,                     // ⏳ TYMCZASOWE
    sellPrice: 2,
    description: "Proste płócienne spodnie, ściągane sznurkiem. Codzienna rzecz, nie ekwipunek bojowy.",
  },
  bast_shoes: {
    id: "bast_shoes",
    weight: 0.3,                     // ⏳ TYMCZASOWE
    armorType: "leather",
    name: "Łapcie",
    type: "armor",
    slot: "boots",
    icon: { col: 0, row: 24 },       // ⚠ PLACEHOLDER — ikona butów skórzanych
    iconTexture: "icon-armor-bast-shoes", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xa8895c,
    defense: 1,                      // ⏳ TYMCZASOWE
    buyPrice: 4,                     // ⏳ TYMCZASOWE
    sellPrice: 1,
    description: "Plecione łykowe obuwie, wiązane do łydki. Tanie, lekkie i zdziera się w miesiąc — nosi się je na onuce.",
  },
  low_boots: {
    id: "low_boots",
    weight: 0.8,                     // ⏳ TYMCZASOWE
    armorType: "leather",
    name: "Trzewiki",
    type: "armor",
    slot: "boots",
    icon: { col: 0, row: 24 },       // ⚠ PLACEHOLDER — ikona butów skórzanych
    iconTexture: "icon-armor-low-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f6b42,
    defense: 2,                      // ⏳ TYMCZASOWE
    buyPrice: 9,                     // ⏳ TYMCZASOWE
    sellPrice: 3,
    description: "Niskie skórzane buty na twardej podeszwie, sznurowane na kostce. Mieszczańska codzienność.",
  },
  marching_boots: {
    id: "marching_boots",
    weight: 1.6,                     // ⏳ TYMCZASOWE
    armorType: "leather",
    name: "Buty piechura",
    type: "armor",
    slot: "boots",
    icon: { col: 0, row: 24 },       // ⚠ PLACEHOLDER — ikona butów skórzanych
    iconTexture: "icon-armor-marching-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f4f2c,
    defense: 6,                      // ⏳ TYMCZASOWE · OI-121 (2026-10-11): było 4 — zdominowane przez skórzane buty (5 PP, 15 g)
    buyPrice: 24,                    // ⏳ TYMCZASOWE
    sellPrice: 9,
    description: "Wysokie, grubo szyte, z podwójną podeszwą. ⚠ Nie są pancerzem — są obuwiem, które wytrzyma miesiąc marszu.",
  },
  leather_helmet: {
    id: "leather_helmet",
    weight: 1,
    armorType: "leather",
    name: "Skórzany kaptur",
    type: "armor",
    set: "trop_lowcy",
    slot: "head",
    icon: { col: 0, row: 21 },
    iconTexture: "icon-armor-leather-helmet", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 5,
    buyPrice: 15,
    sellPrice: 6,
    description: "Podstawowa ochrona głowy, nie krępuje ruchów.",
  },
  leather_chest: {
    id: "leather_chest",
    weight: 3,
    armorType: "leather",
    name: "Skórzany kaftan",
    type: "armor",
    set: "trop_lowcy",
    slot: "chest",
    icon: { col: 0, row: 22 },
    iconTexture: "icon-armor-leather-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 10,
    buyPrice: 30,
    sellPrice: 12,
    description: "Wyprawiona skóra chroniąca tors.",
  },
  /**
   * Przeszywanica — środkowy napierśnik i pierwszy pancerz z materiału
   * `padded` (patrz `ARMOR_PROFILE`, tam jest uzasadnienie liczb).
   *
   * ⚠ **Nie ma wymagania Siły i to jest jej TOŻSAMOŚĆ, nie przeoczenie.**
   * Stalowy napierśnik stoi za `strength: 4` — najwyższą bramką w grze — więc
   * postać czysto zręcznościowa albo kondycyjna nie miała dotąd ŻADNEGO
   * środkowego napierśnika: skakała z 10 obrony wprost na nic. Respecu nie
   * ma, więc taka luka jest ślepym zaułkiem, a nie wyborem. Przeszywanica
   * jest lekka z definicji — to warstwy lnu, nie blacha — i dlatego może tę
   * dziurę wypełnić bez psucia bramek stali.
   *
   * 15 obrony i 55 g plasuje ją dokładnie pomiędzy skórą (10 / 30 g) a stalą
   * (22 / 90 g). Cena sprzedaży to standardowe 40% ceny kupna.
   */
  gambeson: {
    id: "gambeson",
    weight: 4,
    armorType: "padded",
    name: "Przeszywanica",
    type: "armor",
    set: "warstwy_lnu",
    slot: "chest",
    /**
     * ⚠ **Zmienione z (0, 22) na (1, 22) w 2026-08-17, bo to była USTERKA, a
     * nie wybór: przeszywanica miała dokładnie ten sam kafel co `leather_chest`
     * i w plecaku oba przedmioty wyglądały identycznie.** Dwa różne pancerze
     * z jedną ikoną to najgorszy możliwy przypadek w slocie, w którym gracz
     * porównuje towar w sklepie.
     *
     * Kolumna 1 to pełny fakturowany komplet na arkuszu (czepiec / kaftan /
     * nogawice / buty) i całą przeszywanicę przeniesiono właśnie tam, żeby
     * materiał miał JEDNĄ kolumnę, tak jak skóra ma 0, stal 2, a kolczuga 6.
     * ⚠ Uczciwie: kropki na tym kaflu czytają się raczej jako ćwieki niż jako
     * pikowanie — to jest wybór „lepsze z tego, co jest na arkuszu", a nie
     * trafiona ikona. Prawdziwe rozwiązanie to własne kafle lnu; do tego czasu
     * odróżnialność jest ważniejsza niż dosłowność.
     */
    icon: { col: 1, row: 22 },
    iconTexture: "icon-armor-gambeson", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xb8a173,
    defense: 15,
    buyPrice: 55,
    sellPrice: 22,
    description:
      "Kilkanaście warstw lnu, przeszytych gęsto w pionowe wałki. Trzyma cios i obuch; przed grotem nie obroni.",
  },
  /**
   * Czepiec i nogawice pikowane (2026-08-17) — przeszywanica przestaje być
   * jednym przedmiotem, a zaczyna być materiałem z czterema slotami.
   *
   * ⚠ **Slot butów zamykają ONUCE, i warto wiedzieć, czemu nie „buty
   * pikowane".** Pikowanych butów nie było i nie należy ich dorabiać: obuwie
   * przyjmuje ziemię, a nie ciosy, i robiono je ze skóry. Ale onuca — pas
   * płótna owijany na stopę zamiast skarpety — jest bezsporna i akurat
   * słowiańska: chłopski ubiór nosił ją do XX wieku. Wielowarstwowość, czyli
   * to, co w tej tabeli reprezentuje `padded`, bierze się tu z **owijania, nie
   * ze szwu**, i dlatego przedmiot nazywa się „Onuce", a nie „Onuce pikowane".
   * Pikowanie zrobiłoby z niej sztywny placek, którego nie da się owinąć.
   *
   * To rozróżnienie jest tu zapisane, bo pierwsza wersja tego komentarza
   * zostawiała slot pusty „bo pikowanych butów nie było" — co było prawdą o
   * pikowanych butach i fałszywym wnioskiem o całym slocie.
   *
   * ⚠ Obie sztuki są bez wymagania Siły, jak cała przeszywanica i cała skóra.
   * To jest twarda reguła (`docs/ekwipunek_przedmioty.md` §4.1), a nie
   * uprzejmość: respecu nie ma, więc build bez Siły musi mieć pełną ścieżkę.
   *
   * Liczby wyprowadzone, nie dobrane: przy 6 i 8 obrony skóra utrzymuje swoją
   * jedyną przewagę nad przeszywanicą, czyli GROT (kaptur 2,25 vs 2,10;
   * nogawice 3,15 vs 2,80). Przy 7 i 9 pikowane wypierałyby skórzane
   * całkowicie i lekki szczebel skurczyłby się do jednego materiału.
   */
  padded_cap: {
    id: "padded_cap",
    weight: 1,
    armorType: "padded",
    name: "Czepiec pikowany",
    type: "armor",
    set: "warstwy_lnu",
    slot: "head",
    icon: { col: 1, row: 21 },
    iconTexture: "icon-armor-padded-cap", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xb8a173,
    defense: 6,
    buyPrice: 22,
    sellPrice: 9,
    description:
      "Pikowany czepiec wiązany pod brodą. Sam w sobie ochrona licha, ale to on sprawia, że hełm nie dzwoni.",
  },
  padded_chausses: {
    id: "padded_chausses",
    weight: 2.5,
    armorType: "padded",
    name: "Spodnie pikowane",
    type: "armor",
    set: "warstwy_lnu",
    slot: "legs",
    icon: { col: 1, row: 23 },
    iconTexture: "icon-armor-padded-chausses", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xb8a173,
    defense: 8,
    buyPrice: 30,
    sellPrice: 12,
    description: "Lniane spodnie przeszyte w wałki, wiązane w pasie. Ciepłe aż nadto.",
  },
  /**
   * ⚠ **4 obrony to JEDYNA wartość, która tu działa, i to jest zmierzone.**
   * Przy 3 skórzane buty wypierają onuce na wszystkich trzech typach naraz;
   * przy 5 onuce biją skórzany but na cięciu (6,0 vs 5,0), co przy owijce z
   * płótna jest wprost absurdalne. Przy 4 wygrywają **dokładnie jedną
   * kolumnę — obuch** (4,4 vs 4,0), a skóra zachowuje cięcie i grot. Czyli
   * liczba mówi to samo, co fikcja: onuce nie chronią przed ostrzem, tylko
   * amortyzują. Dokładnie po to `padded` istnieje.
   *
   * ⚠ Ikona to kafel BUTA (1, 24) z kolumny przeszywanicy, choć onuca butem
   * nie jest. Świadomy kompromis: przy 32 px owinięta stopa i but i tak są
   * nieodróżnialne, a spójność kolumn materiału (skóra 0, przeszywanica 1,
   * stal 2, kolczuga 6) jest tu warta więcej niż dosłowność sylwetki.
   */
  foot_wraps: {
    id: "foot_wraps",
    weight: 0.5,
    armorType: "padded",
    name: "Onuce",
    type: "armor",
    set: "warstwy_lnu",
    slot: "boots",
    icon: { col: 1, row: 24 },
    iconTexture: "icon-armor-foot-wraps", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xb8a173,
    defense: 4,
    buyPrice: 15,
    sellPrice: 6,
    description:
      "Pasy lnianego płótna owijane na stopę zamiast skarpet. Przed ostrzem nie obronią; biorą na siebie otarcie, chłód i wstrząs.",
  },
  /**
   * Rękawice pikowane — pierwszy przedmiot w slocie `gloves` i **domknięcie
   * łańcucha zbierackiego u Doroty** (`ziola_dla_babki` → jej dwa zadania →
   * `rekawice_od_wnuka`). Nagroda, nie towar.
   *
   * ⚠ **Nie mają ceny zakupu i nikt ich nie sprzedaje — to jest celowe.**
   * Ten sam zabieg co przy `cooked_meat`: przedmiot, którego nie da się
   * kupić, jest jedynym rodzajem nagrody, której nie da się obejść złotem.
   * Cena sprzedaży istnieje, bo sprzedać można wszystko.
   *
   * ⚠ **Materiał `padded`, więc bez wymagania Siły** — dokładnie ta sama
   * tożsamość, co przeszywanica: warstwy lnu, nie blacha. Reguła „lekki
   * materiał nie bramkuje" nie jest tu grzecznością, tylko konsekwencją braku
   * respecu.
   *
   * ⚠ **Dokładają w grze CAŁY NOWY SLOT pancerza**, więc podnoszą sufit obrony
   * każdej postaci, nie tylko tej w rękawicach. Zmierzone: pełna stal to 57
   * punktów (53,3% redukcji), z rękawicami 61 (54,9%) — +1,6 pkt proc.
   * Świadomie mało: slot ma być miejscem na przyszłe przedmioty, a nie skokiem
   * mocy przy jego otwarciu.
   */
  padded_gloves: {
    id: "padded_gloves",
    weight: 0.5,
    armorType: "padded",
    name: "Rękawice pikowane",
    type: "armor",
    set: "warstwy_lnu",
    slot: "gloves",
    // Zweryfikowane WYCIĘCIEM, nie miniaturą: para jasnych rękawic, 116 px
    // treści — jedyny taki kafel na całym arkuszu.
    icon: { col: 0, row: 20 },
    iconTexture: "icon-armor-padded-gloves", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xd8cfae,
    defense: 4,
    buyPrice: 18,                    // OI-121 (2026-10-11): 18 stało jako CENA SPRZEDAŻY — drożej niż stalowe
    sellPrice: 7,                    //   (12 g). Wyglądało na pomyloną cenę kupna; sprzedaż wg mediany katalogu.
    description:
      "Len przeszyty w drobną kratkę, na dłoń i na wierzch palców. Nie ochronią przed mieczem, ale pokrzywy się w nich nie czuje.",
  },
  /**
   * **Stare owijki Patryczka** — pierwszy przedmiot w slocie `gloves`, na
   * długo PRZED `padded_gloves` w rozgrywce (2026-08-20, `QUEST_01_WSTEP_DO_
   * MYSLIWEGO.md`, przeanalizowany i zaadaptowany do stanu kodu — dwukrotnie:
   * najpierw jako `grant` doczepiony do `ziola_dla_babki`, bo silnik nie miał
   * wtedy mid-quest grantów; po dobudowaniu `QuestStage` wróciły tam, gdzie
   * fabularnie powinny być od początku). Wręczane w `stick_in_hand`'s drugim
   * etapie (`visit_patryczek`, `onComplete.grant`) — w chwili, gdy gracz po
   * raz pierwszy zagaduje Patryczka, zanim ten w ogóle zdąży zaproponować
   * `ziola_dla_babki`. Patrz duży komentarz nad `QUESTS.stick_in_hand`.
   *
   * ⚠ **NIE zastępuje `padded_gloves`, i to jest cały sens.** Ta sama
   * relacja co osiosany kij → porządny kij z `rabbit_hunt`: darmowy,
   * prowizoryczny start, świadomie gorszy od pikowanych rękawic (1 obrony
   * przeciw 4), zastępowany PRZEZ pomoc temu samemu Patryczkowi i Dorocie —
   * łańcuch `ziola_dla_babki → zielarskie_zapasy → dziurawiec_na_zime →
   * rekawice_od_wnuka` kończy się nadal `padded_gloves`, bez zmian.
   *
   * Bez `buyPrice` — to prezent wynikający ze znajomości, nie towar; nikt
   * ich nie sprzedaje. Materiał `padded`, więc bez wymagania Siły, tak jak
   * cała reszta pikowanego kompletu. Ikona: ta sama płytka co `padded_gloves`
   * (0,20), ale `tintIcon` w innym, brudniejszym odcieniu — dwa różne
   * przedmioty w tym samym slocie NIE mogą wyglądać identycznie (ta sama
   * zasada, która kazała rozdzielić `gambeson` od `leather_chest`), a na
   * arkuszu nie ma drugiej pary rękawic z płótna.
   */
  worn_wraps: {
    id: "worn_wraps",
    weight: 0.3,
    armorType: "padded",
    name: "Stare owijki Patryczka",
    type: "armor",
    slot: "gloves",
    icon: { col: 0, row: 20 },
    iconTexture: "icon-armor-worn-wraps", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    tintIcon: true,
    color: 0x8a7a5c,
    defense: 1,
    sellPrice: 2,
    description:
      "Znoszone płócienne pasy, którymi Patryczek owijał sobie dłonie przed walką. Wielkiego ciosu nie zatrzymają, ale lepsze to niż goła skóra.",
  },
  /**
   * Domknięcie kompletu skórzanego do pięciu slotów (2026-08-17). Ikona z
   * `items.png` (7, 29) — wiersz rękawic, kolumny 7-8 to para skórzana, tak
   * jak 0-5 to płyta, a 6 kolczuga; zweryfikowane wycięciem, 260 px treści.
   *
   * ⚠ **4 obrony, czyli tyle samo co `padded_gloves`, i to nie jest lenistwo
   * przy liczbie.** Pikowane są NAGRODĄ za łańcuch u Doroty i mają wygrywać;
   * przy równych punktach wygrywają dwa typy z trzech (cięcie 4,8 vs 4,0,
   * obuch 4,4 vs 3,2), a skórzane biorą wyłącznie grot (1,8 vs 1,4). Podbicie
   * skórzanych do 5 odwróciłoby ten stosunek i zrobiłoby z nagrody za zadanie
   * gorszy zakup za 12 g.
   *
   * ⚠ **Konsekwencja, którą trzeba widzieć: slot rękawic przestaje być
   * wyłącznie za zadaniem.** Do tej pory `padded_gloves` były jedyną drogą do
   * tego slotu, co było celowe („przedmiot, którego nie da się kupić, jest
   * jedyną nagrodą, której złoto nie obejdzie"). Rękawice kolcze już to
   * nadgryzły (Siła 1, 22 g), a te domykają — więc łańcuch u Doroty nagradza
   * teraz NAJLEPSZYMI rękawicami przeciw obuchowi, a nie samym dostępem do
   * slotu. Świadoma zmiana charakteru nagrody, nie przeoczenie.
   */
  /**
   * ── NARAMIENNIKI — PIERWSZA RODZINA SLOTU `shoulders` (2026-09-16) ─────
   *
   * ⭐⭐ **To są przedmioty, które OŻYWIŁY kafel „Ramiona”.** Stał w układzie
   * lalki jako `planned` od 2026-09-11 — rysowany, przygaszony, z powodem
   * na dotknięcie — dokładnie po to, żeby ożyć w dniu, w którym powstanie
   * pierwszy przedmiot. ⚠ Reguła z `src/core/CLAUDE.md`: *nie okablowuj slotu
   * na zapas*; okablowanie razem z przedmiotem jest jej dopełnieniem, nie
   * złamaniem.
   *
   * ⚠⚠ **JEDNA warstwa, adres bez sufiksu** — tak jak ręce. ⛔ Ramiona NIE są
   * obszarem warstwowanym (`LAYERED_AREAS` to nadal głowa/tors/nogi/stopy)
   * i ⛔ żadna z tych sztuk nie deklaruje pola `layer`. `itemLayer()` odpowie
   * dla nich z reguły materiału, ale nikt o tę odpowiedź nie pyta.
   *
   * ⭐ **Płytowe są ALTERNATYWĄ konstrukcyjną wobec skórzanych**, nie ich
   * ulepszeniem — różni je profil obrażeń i masa. ⛔ Trzeciego rodzaju nie ma.
   *
   * ⏳⏳ LICZBY TYMCZASOWE. ⚠ Ikony POŻYCZONE od korpusów — placeholder.
   */
  /**
   * ── LAMELKA I ŁUSKA — DWIE NOWE RODZINY KONSTRUKCYJNE (2026-09-16) ─────
   *
   * ✅⭐ **OBIE RODZINY SĄ `L3` — DECYZJA AUTORA 2026-09-16, NIE TYMCZASOWA.**
   * Lamelka i łuska to **alternatywne konstrukcje warstwy zewnętrznej**, obok
   * brygantyny, napierśników, kirysu i nagolenników. ⛔ Nic z tego nie zostało
   * zastąpione ani usunięte.
   *
   * ⚠⚠ **`L3` znaczy ZEWNĘTRZNA WARSTWA OCHRONNA, nie „najlepszy pancerz”.**
   * ⛔ Nie wyciągaj stąd żadnego wniosku o PP, masie, cenie, trwałości, bramce
   * Siły ani o odporności na obuch, cięcie czy kłucie — to są osobne decyzje
   * późniejszego balansu.
   *
   * ⭐ **Warstwa wychodzi z `armorType: "metal"` przez `itemLayer()`** i to jest
   * całe wdrożenie tej decyzji — ⛔ **zero pola `layer` na przedmiocie**, ⛔ zero
   * nowych `armorType`, ⛔ zero nowych kolumn `ARMOR_PROFILE`, ⛔ `itemLayer()`
   * nietknięte. Klasyfikacja była już poprawna, gdy decyzja zapadała; zmienił się
   * jej STATUS, nie dane.
   *
   * ⚠ **`OI-100` zostaje OTWARTE i to jest INNE pytanie:** czy łuska dostanie
   * WŁASNĄ kolumnę `ARMOR_PROFILE` (anty-kłutą, słabą na cięte). Dziś obie
   * rodziny dzielą profil `metal` z płytą — ⛔ to NIE przesądza tamtej decyzji.
   *
   * ⏳⏳ **LICZBY TYMCZASOWE — i CELOWO IDENTYCZNE w obrębie slotu.** Pancerz
   * lamelkowy i łuskowy mają dziś tę samą masę, te same punkty i tę samą cenę.
   * ⛔ To NIE znaczy, że są równoważne — znaczy, że **żadna przewaga nie została
   * jeszcze ustalona** i katalog o tym nie kłamie.
   *
   * ⭐ To są OSOBNE rodziny, nie warianty kolczugi ani płyty. ⛔ Nic istniejącego
   * nie zostało usunięte ani zastąpione.
   *
   * ⚠ Ikony POŻYCZONE od sztuk stalowych — placeholder do passu artystycznego.
   */
  lamellar_coif: {
    id: "lamellar_coif",
    weight: 2,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Czepiec lamelkowy",
    type: "armor",
    slot: "head",
    icon: { col: 2, row: 25 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-lamellar-coif", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 7,                     // ⏳ TYMCZASOWE
    buyPrice: 30,                   // ⏳ TYMCZASOWE
    sellPrice: 12,
    requires: { strength: 1 },       // ⏳ TYMCZASOWE
    description: "Rzędy blaszek zszyte rzemieniem, opinające czaszkę. Sztywne, ale kładzie się po kształcie głowy.",
  },
  lamellar_chest: {
    id: "lamellar_chest",
    weight: 9,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Pancerz lamelkowy",
    type: "armor",
    slot: "chest",
    icon: { col: 2, row: 26 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-lamellar-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 16,                     // ⏳ TYMCZASOWE
    buyPrice: 70,                   // ⏳ TYMCZASOWE
    sellPrice: 28,
    requires: { strength: 3 },       // ⏳ TYMCZASOWE
    description: "Setki blaszek związanych rzemieniem w rzędy. Gnie się w pasie, stoi twardo pod ciosem.",
  },
  lamellar_legs: {
    id: "lamellar_legs",
    weight: 5,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Spodnie lamelkowe",
    type: "armor",
    slot: "legs",
    icon: { col: 2, row: 27 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-lamellar-legs", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 11,                     // ⏳ TYMCZASOWE
    buyPrice: 45,                   // ⏳ TYMCZASOWE
    sellPrice: 18,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Blaszki naszyte pasami wzdłuż uda i łydki. Chodzi się w nich, choć słychać z daleka.",
  },
  lamellar_pauldrons: {
    id: "lamellar_pauldrons",
    weight: 2.5,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Naramienniki lamelkowe",
    type: "armor",
    slot: "shoulders",
    icon: { col: 2, row: 26 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-lamellar-pauldrons", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 6,                     // ⏳ TYMCZASOWE
    buyPrice: 30,                   // ⏳ TYMCZASOWE
    sellPrice: 12,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Blaszki w rzędach na barkach, zachodzące w dół jak dachówka.",
  },
  scale_chest: {
    id: "scale_chest",
    weight: 9,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Pancerz łuskowy",
    type: "armor",
    slot: "chest",
    icon: { col: 2, row: 26 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-scale-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 16,                     // ⏳ TYMCZASOWE
    buyPrice: 70,                   // ⏳ TYMCZASOWE
    sellPrice: 28,
    requires: { strength: 3 },       // ⏳ TYMCZASOWE
    description: "Łuski naszyte na skórzanym podkładzie, każda zachodzi na sąsiednią. Cios ślizga się w dół.",
  },
  scale_legs: {
    id: "scale_legs",
    weight: 5,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Spodnie łuskowe",
    type: "armor",
    slot: "legs",
    icon: { col: 2, row: 27 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-scale-legs", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 11,                     // ⏳ TYMCZASOWE
    buyPrice: 45,                   // ⏳ TYMCZASOWE
    sellPrice: 18,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Łuska naszyta na spodnie od biodra po kostkę. Ciężka i głośna.",
  },
  scale_pauldrons: {
    id: "scale_pauldrons",
    weight: 2.5,                       // ⏳ TYMCZASOWE
    armorType: "metal",              // ✅ L3 — decyzja 2026-09-16, nie placeholder
    name: "Naramienniki łuskowe",
    type: "armor",
    slot: "shoulders",
    icon: { col: 2, row: 26 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-scale-pauldrons", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7d8189,
    defense: 6,                     // ⏳ TYMCZASOWE
    buyPrice: 30,                   // ⏳ TYMCZASOWE
    sellPrice: 12,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Łuski naszyte na barkach, zachodzące na siebie w dół ramienia.",
  },
  leather_pauldrons: {
    id: "leather_pauldrons",
    weight: 1.2,                     // ⏳ TYMCZASOWE
    armorType: "leather",
    name: "Naramienniki skórzane",
    type: "armor",
    slot: "shoulders",
    icon: { col: 0, row: 22 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-leather-pauldrons", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 4,                      // ⏳ TYMCZASOWE
    buyPrice: 18,                    // ⏳ TYMCZASOWE
    sellPrice: 7,
    description: "Grube skórzane naszywki na barki, wiązane pod pachą. Nie krępują zamachu.",
  },
  plate_pauldrons: {
    id: "plate_pauldrons",
    weight: 3,                       // ⏳ TYMCZASOWE
    armorType: "metal",
    name: "Naramienniki płytowe",
    type: "armor",
    slot: "shoulders",
    icon: { col: 2, row: 26 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-plate-pauldrons", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 8,                      // ⏳ TYMCZASOWE
    buyPrice: 44,                    // ⏳ TYMCZASOWE
    sellPrice: 17,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Kute tarczki na barkach, zachodzące na siebie jak rybia łuska. Cięższe i sztywniejsze od skóry.",
  },
  leather_gloves: {
    id: "leather_gloves",
    weight: 0.5,
    armorType: "leather",
    name: "Skórzane rękawice",
    type: "armor",
    set: "trop_lowcy",
    slot: "gloves",
    icon: { col: 7, row: 29 },
    iconTexture: "icon-armor-leather-gloves", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 4,
    buyPrice: 12,
    sellPrice: 5,
    description: "Zwykłe robocze rękawice z wyprawionej skóry. Chronią przed otarciem bardziej niż przed ostrzem.",
  },
  leather_legs: {
    id: "leather_legs",
    weight: 2,
    armorType: "leather",
    name: "Skórzane spodnie",
    type: "armor",
    set: "trop_lowcy",
    slot: "legs",
    icon: { col: 0, row: 23 },
    iconTexture: "icon-armor-leather-legs", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 7,
    buyPrice: 20,
    sellPrice: 8,
    description: "Wygodne spodnie do biegania i walki.",
  },
  leather_boots: {
    id: "leather_boots",
    weight: 1.5,
    armorType: "leather",
    name: "Skórzane buty",
    type: "armor",
    set: "trop_lowcy",
    slot: "boots",
    icon: { col: 0, row: 24 },
    iconTexture: "icon-armor-leather-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8a5a2f,
    defense: 5,
    buyPrice: 15,
    sellPrice: 6,
    description: "Mocne buty na długą drogę.",
  },
  // Steel tier — a straight upgrade over leather in every slot, so the shop
  // tooltip's comparison against worn leather shows a clear green Obrona gain.
  steel_helmet: {
    id: "steel_helmet",
    weight: 3,
    armorType: "metal",
    name: "Stalowy hełm",
    type: "armor",
    set: "kuta_stal",
    slot: "head",
    icon: { col: 2, row: 25 },
    iconTexture: "icon-armor-steel-helmet", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 10,
    buyPrice: 45,
    sellPrice: 18,
    requires: { strength: 2 },
    description: "Kuty hełm — cięższy, ale znacznie mocniejszy od skóry.",
  },
  steel_chest: {
    id: "steel_chest",
    weight: 12,
    armorType: "metal",
    name: "Stalowy napierśnik",
    type: "armor",
    set: "kuta_stal",
    slot: "chest",
    icon: { col: 2, row: 26 },
    iconTexture: "icon-armor-steel-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 22,
    buyPrice: 90,
    sellPrice: 36,
    /** The set's real gate — the other steel pieces sit below this on purpose,
     *  so "some steel" is reachable well before the full suit. */
    requires: { strength: 4 },
    description: "Płytowa osłona torsu dla prawdziwego wojownika.",
  },
  steel_legs: {
    id: "steel_legs",
    weight: 6,
    armorType: "metal",
    name: "Stalowe nagolenniki",
    type: "armor",
    set: "kuta_stal",
    slot: "legs",
    icon: { col: 2, row: 27 },
    iconTexture: "icon-armor-steel-legs", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 15,
    buyPrice: 60,
    sellPrice: 24,
    requires: { strength: 3 },
    description: "Płyty na udach i goleniach, przypięte do spodni.",
  },
  steel_boots: {
    id: "steel_boots",
    weight: 3.5,
    armorType: "metal",
    name: "Stalowe buty",
    type: "armor",
    set: "kuta_stal",
    slot: "boots",
    icon: { col: 2, row: 28 },
    iconTexture: "icon-armor-steel-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 10,
    buyPrice: 45,
    sellPrice: 18,
    requires: { strength: 2 },
    description: "Okute buty, które zniosą każdy cios.",
  },
  /**
   * Domknięcie kompletu stalowego do pięciu slotów (2026-08-17). Ikona (2, 29)
   * — kolumna 2 tak samo jak hełm/napierśnik/nagolenniki/buty, więc arkusz
   * sam trzyma tożsamość szczebla także w rzędzie rękawic.
   *
   * ⚠ **6 obrony, a nie 7, i ta jedna wartość jest WYMUSZONA pomiarem.** Przy
   * 7 rękawice płytowe wychodziły lepsze od kolczych na wszystkich trzech
   * typach naraz (9,8/8,05/2,8 przeciw 9,0/3,5/1,75), czyli powtórzyłby się
   * dokładnie ten błąd, który przy napierśniku wymusił podniesienie
   * `mail.slash` do 1,80. Przy 6 kolcze wygrywają kolumnę cięcia (9,0 vs 8,4)
   * i nikt nikogo nie wypiera. To jest ten sam test dominacji — uruchamiaj go
   * przy KAŻDYM nowym pancerzu, bo ani `tsc`, ani build tego nie widzą.
   *
   * Rękawice są najmniejszym slotem w grze i drabinka to potwierdza:
   * pikowane 4, skórzane 4, kolcze 5, płytowe 6.
   */
  steel_gauntlets: {
    id: "steel_gauntlets",
    weight: 2,
    armorType: "metal",
    name: "Stalowe rękawice",
    type: "armor",
    set: "kuta_stal",
    slot: "gloves",
    icon: { col: 2, row: 29 },
    iconTexture: "icon-armor-steel-gauntlets", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 6,
    buyPrice: 30,
    sellPrice: 12,
    requires: { strength: 2 },
    description: "Płytki naszyte na skórzaną podszewkę, osobno na każdy palec.",
  },

  // ── Komplet kolczy ───────────────────────────────────────────────────────
  //
  // Czwarty materiał pancerza — uzasadnienie liczb, i ostrzeżenie, że jego
  // siła przeciw cięciu nie ma dziś na kogo działać, stoją przy
  // `ARMOR_PROFILE.mail`. Tutaj tylko to, co dotyczy samych przedmiotów.
  //
  // **ZERO nowej grafiki.** Komplet leżał nietknięty w `items.png` w kolumnie
  // 6, wierszach **25-29** — zweryfikowane WYCIĘCIEM przy 9-10×, nie
  // oglądaniem miniatury (reguła z `public/assets/README.md`). Siatka kółek
  // jest jednoznaczna, sylwetki czytelne (kaptur z opadem na kark, koszulka,
  // nogawice, buty, łapawice), a obwódka i szara rampa są te same, co w
  // stalowym szczeblu obok. Kolumna 6 tych wierszy to konsekwentnie kolczuga,
  // 0-5 to płyta — arkusz sam trzyma ten podział, w rękawicach (wiersz 29)
  // również.
  //
  // **Miejsce w drabince: MIĘDZY skórą a stalą, i sufit obrony zostaje
  // nietknięty.** Rdzeń czterech slotów to 46 pkt (47,9% redukcji bez typu)
  // przeciw 27 pkt skóry (35,1%) i 57 pkt stali (53,3%); w pełnych piątkach
  // 51 pkt przeciw 63 pkt stali. Kolczuga nigdy nie jest najmocniejsza
  // punktowo — jest inaczej UKSZTAŁTOWANA, i to jest cały powód, dla którego
  // istnieje obok tamtych dwóch.
  //
  // ⚠ **Jest to pierwszy materiał z kompletem PIĘCIU slotów** — dotąd
  // rękawice miała wyłącznie przeszywanica, i to jako nagrodę, nie towar.
  // Patrz komentarz przy `mail_gloves`: to celowo nie jest ich zastąpienie.
  //
  // ⚠ **Bramki Siły to dokładnie stalowe minus jeden** (1/3/2/1 przeciw
  // 2/4/3/2), i napierśnik zostaje prawdziwą bramką kompletu, tak samo jak
  // przy stali. Kolczuga wisi na barkach i się zgina: jest ciężka, ale nie
  // krępuje jak płyta. **Skóra i przeszywanica zostają CAŁKOWICIE bez
  // bramki**, więc reguła „postać czysto zręcznościowa albo kondycyjna zawsze
  // ma opcję" — twarda, bo respecu nie ma — jest nienaruszona.
  //
  // Ceny: rdzeń 188 g (210 g z rękawicami) przeciw 80 g skóry i 240 g stali;
  // sprzedaż to standardowe 40% ceny kupna.
  mail_coif: {
    id: "mail_coif",
    weight: 2,
    armorType: "mail",
    name: "Kaptur kolczy",
    type: "armor",
    set: "splot_pierscieni",
    slot: "head",
    icon: { col: 6, row: 25 },
    iconTexture: "icon-armor-mail-coif", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f949a,
    defense: 8,
    buyPrice: 35,
    sellPrice: 14,
    requires: { strength: 1 },
    description:
      "Czepiec z drobnych kółek, z opadem na kark i barki. Cięcie po nim spływa; po uderzeniu obucha zostaje w głowie dzwon.",
  },
  mail_hauberk: {
    id: "mail_hauberk",
    weight: 10,
    armorType: "mail",
    name: "Kolczuga",
    type: "armor",
    set: "splot_pierscieni",
    slot: "chest",
    icon: { col: 6, row: 26 },
    iconTexture: "icon-armor-mail-hauberk", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f949a,
    defense: 18,
    buyPrice: 70,
    sellPrice: 28,
    /** Prawdziwa bramka kompletu — reszta stoi niżej celowo, żeby „trochę
     *  kolczugi" było w zasięgu długo przed całością. Ta sama konstrukcja, co
     *  przy `steel_chest`, tylko o jeden stopień niżej. */
    requires: { strength: 3 },
    description:
      "Kilkanaście tysięcy nitowanych kółek, ciężar cały na barkach. Ostrze się po niej ślizga, grot znajduje oczko.",
  },
  /**
   * ⚠ **Nie wypierają `padded_gloves` i to zostało sprawdzone, nie założone.**
   * Tamte są NAGRODĄ za łańcuch zbieracki u Doroty i celowo nie mają ceny
   * zakupu; gdyby kupne rękawice były od nich lepsze pod każdym względem,
   * domknięcie tamtego łańcucha traciłoby sens. Punkty skuteczne: cięcie 9,0
   * vs 4,8 i grot 3,5 vs 1,4 dla kolczych, ale **obuch 1,75 vs 4,4 dla
   * pikowanych** — czyli rękawice od wnuka zostają najlepszą odpowiedzią na
   * dzika, jedynego przeciwnika bijącego dziś obuchem. Żadne z dwóch nie
   * dominuje drugich.
   */
  mail_gloves: {
    id: "mail_gloves",
    weight: 1.5,
    armorType: "mail",
    name: "Rękawice kolcze",
    type: "armor",
    set: "splot_pierscieni",
    slot: "gloves",
    // Wiersz 29 to rząd rękawic (kolumny 0-5 płyta, 6 kolczuga, 7-8 skóra) —
    // zweryfikowane wycięciem przy 9×: para kolczych łapawic, 262 px treści,
    // ta sama siatka kółek co reszta kompletu. ⚠ Komentarz przy
    // `padded_gloves` nazywa swój kafel „jedynym takim na całym arkuszu" —
    // to prawda o rękawicach z JASNEGO PŁÓTNA, ale nie o rękawicach w ogóle.
    icon: { col: 6, row: 29 },
    iconTexture: "icon-armor-mail-gloves", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f949a,
    defense: 5,
    buyPrice: 22,
    sellPrice: 9,
    requires: { strength: 1 },
    description:
      "Łapawice z kolczej siatki, naszyte na skórę. Palce zostają razem, za to nic ich nie sięgnie.",
  },
  mail_chausses: {
    id: "mail_chausses",
    weight: 5,
    armorType: "mail",
    name: "Spodnie kolcze",
    type: "armor",
    set: "splot_pierscieni",
    slot: "legs",
    icon: { col: 6, row: 27 },
    iconTexture: "icon-armor-mail-chausses", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f949a,
    defense: 12,
    buyPrice: 48,
    sellPrice: 19,
    requires: { strength: 2 },
    description: "Spodnie z kolczej siatki, przywiązywane do pasa. Idzie się w nich wolniej, ale całe.",
  },
  mail_boots: {
    id: "mail_boots",
    weight: 3,
    armorType: "mail",
    name: "Buty kolcze",
    type: "armor",
    set: "splot_pierscieni",
    slot: "boots",
    icon: { col: 6, row: 28 },
    iconTexture: "icon-armor-mail-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8f949a,
    defense: 8,
    buyPrice: 35,
    sellPrice: 14,
    requires: { strength: 1 },
    description: "Skórzane buty obszyte kolczą siatką po kostkę.",
  },

  // ── ŻELAZO — drugi gatunek materiału (2026-09-15) ─────────────────────────
  //
  // ⭐⭐ **Te same KONSTRUKCJE, gorszy GATUNEK.** Każda pozycja niżej jest
  // bliźniakiem konkretnej sztuki stalowej i deklaruje **identyczne liczby
  // konstrukcji**: `defense`, `weight`, `buyPrice`, `sellPrice` i `requires`
  // są przepisane 1:1 ze stalowego bliźniaka. Różnicę robi WYŁĄCZNIE
  // `material: "iron"` — `instanceDefense` mnoży punkty przez
  // `ARMOR_MATERIAL.iron.defenseMul`, a `buyPriceOf`/`sellPriceOf` cenę przez
  // `priceMul`.
  //
  // ⚠ **To jest cała treść zdania „stalowy kirys jest lepszy JAKO TEN SAM
  // kirys".** Gdyby żelazo deklarowało własne, już obniżone liczby, gatunek
  // byłby konwencją nazewniczą utrzymywaną ręcznie i rozjechałby się przy
  // pierwszym strojeniu konstrukcji. Tak — przestraja się sam.
  //
  // ⛔ **Bez `set`.** Tag zestawu ma w tym katalogu wyłącznie PIĘĆ STANDARDÓW
  // danego materiału; wszystkie pozostałe sztuki (brygantyna, kirys, kapalin,
  // sabatony, kolczuga krótka, półnogawice) są bez zestawu i żelazo idzie tą
  // samą drogą. Żelazny komplet to osobna decyzja, zablokowana przez `OI-104`.
  //
  // ⛔ **Bez nowej grafiki (`N-15`).** Ikona jest bliźniaka, a odróżnia je
  // `tintIcon` — ten sam mechanizm, którym odróżniają się pierścienie z jednego
  // kafla `items.png`. Ciemniejszy, matowy odcień: żelazo się nie poleruje.
  //
  // ⛔ **Nie ma żelaznych rękawic** i to jest wynik liczb, nie zakaz: rękawice
  // kolcze mają 5 PP przy płytowych 6, więc podłoga korytarza wypada na
  // 5/6 = 0,833 — POWYŻEJ sufitu czytelności 0,810. Nie istnieje mnożnik,
  // przy którym żelazna rękawica płytowa jest jednocześnie czytelnie słabsza
  // od stalowej i nie gorsza od kolczej. Ręce mają JEDEN adres, więc wszystkie
  // materiały biją się tam wprost.
  iron_helmet: {
    id: "iron_helmet",
    weight: 3,
    armorType: "metal",
    material: "iron",
    name: "Żelazny hełm",
    type: "armor",
    slot: "head",
    icon: { col: 2, row: 25 },
    iconTexture: "icon-armor-iron-helmet", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 10,
    buyPrice: 45,
    sellPrice: 18,
    requires: { strength: 2 },
    description: "Ten sam garnek co stalowy, tylko z miękkiego żelaza — wgniata się tam, gdzie stal odbija.",
  },
  iron_chest: {
    id: "iron_chest",
    weight: 12,
    armorType: "metal",
    material: "iron",
    name: "Żelazny napierśnik",
    type: "armor",
    slot: "chest",
    icon: { col: 2, row: 26 },
    iconTexture: "icon-armor-iron-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 22,
    buyPrice: 90,
    sellPrice: 36,
    requires: { strength: 4 },
    description: "Kuty z tego, co przywieźli handlarze. Waży tyle samo co stalowy i trzyma gorzej — ale kosztuje tyle, ile masz.",
  },
  iron_legs: {
    id: "iron_legs",
    weight: 6,
    armorType: "metal",
    material: "iron",
    name: "Żelazne nagolenniki",
    type: "armor",
    slot: "legs",
    icon: { col: 2, row: 27 },
    iconTexture: "icon-armor-iron-legs", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 15,
    buyPrice: 60,
    sellPrice: 24,
    requires: { strength: 3 },
    description: "Płyty z odpadowego żelaza, przypięte do spodni. Tanie nogi dla kogoś, kto nie ma na stal.",
  },
  iron_boots: {
    id: "iron_boots",
    weight: 3.5,
    armorType: "metal",
    material: "iron",
    name: "Żelazne buty",
    type: "armor",
    slot: "boots",
    icon: { col: 2, row: 28 },
    iconTexture: "icon-armor-iron-boots", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 10,
    buyPrice: 45,
    sellPrice: 18,
    requires: { strength: 2 },
    description: "Ciężkie jak stalowe, bo tyle samo w nich metalu. Gorszego metalu.",
  },
  iron_coif: {
    id: "iron_coif",
    weight: 2,
    armorType: "mail",
    material: "iron",
    name: "Kaptur żelazny",
    type: "armor",
    slot: "head",
    icon: { col: 6, row: 25 },
    iconTexture: "icon-armor-iron-coif", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 8,
    buyPrice: 35,
    sellPrice: 14,
    requires: { strength: 1 },
    description: "Kółka z miękkiego drutu. Rozchodzą się łatwiej niż stalowe, ale i łatwiej je załatać.",
  },
  iron_hauberk: {
    id: "iron_hauberk",
    weight: 10,
    armorType: "mail",
    material: "iron",
    name: "Kolczuga żelazna",
    type: "armor",
    slot: "chest",
    icon: { col: 6, row: 26 },
    iconTexture: "icon-armor-iron-hauberk", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 18,
    buyPrice: 70,
    sellPrice: 28,
    requires: { strength: 3 },
    description: "Te same kilkanaście tysięcy kółek, tylko z gorszego drutu. Grot znajduje oczko szybciej.",
  },
  iron_chausses: {
    id: "iron_chausses",
    weight: 5,
    armorType: "mail",
    material: "iron",
    name: "Żelazne spodnie kolcze",
    type: "armor",
    slot: "legs",
    icon: { col: 6, row: 27 },
    iconTexture: "icon-armor-iron-chausses", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6f7480,
    tintIcon: true,
    defense: 12,
    buyPrice: 48,
    sellPrice: 19,
    requires: { strength: 2 },
    description: "Kolcze spodnie z drutu, który ktoś już raz przetopił.",
  },

  // ── Tarcze ───────────────────────────────────────────────────────────────
  //
  // ⚠ **Tarcza to ZBROJA, która dodatkowo blokuje — nie osobny system.**
  // `type: "armor"` + `slot: "offhand"` sprawia, że za darmo działają:
  // `slotForItem`, `accepts`, `instanceDefense`, jakość, sklep, tooltip,
  // przeciąganie na kafel lalki i `defenseAgainst`. Jedyne nowe pole w całym
  // systemie to `block`. Pełna analiza: `docs/systemy/shields.md`.
  //
  // Dwie rzeczy, które NIE są przeoczeniem:
  //  • **Żadnego nowego `armorType: "wood"`.** Nowy materiał to nowa kolumna w
  //    `ARMOR_PROFILE` i nowa decyzja balansowa; deska z okuciem jest
  //    mechanicznie skórą albo metalem i nic na tym nie tracimy.
  //  • **Punkty obrony działają z KAŻDEJ strony** (masa na ramieniu), sam blok
  //    tylko od przodu. Dlatego tarcza od tyłu nie jest zerem, a jednocześnie
  //    to blok, a nie punkty, niesie właściwą ochronę — stąd `metal` na okutej
  //    jest w porządku mimo `metal.blunt = 0,50`.
  //
  // Liczby są z §A.8 (podniesione względem pierwszej wersji po pomiarze
  // czytelności) i są PIERWSZYM PODEJŚCIEM bez pokrycia w rozegranych walkach —
  // dokładnie tak, jak `ARMOR_PROFILE` mówi o sobie samym. Jeśli tarcza okaże
  // się oczywistym wyborem dla każdego, **najpierw podnieść `swingMul`, dopiero
  // potem ruszać redukcję**: kara to jedno pole, redukcja to tożsamość rzeczy.
  buckler: {
    id: "buckler",
    construction: "buckler",
    weight: 1.5,
    armorType: "leather",
    name: "Puklerz",
    type: "armor",
    slot: "offhand",
    // Zweryfikowane WYCIĘCIEM, nie oglądaniem miniatury (reguła z
    // public/assets/README.md): mała okrągła tarcza z centralnym guzem,
    // 316 px treści. Duża okuta obok ma 616 px — różnica jest widoczna.
    icon: { col: 2, row: 9 },
    iconTexture: "icon-shield-buckler",
    color: 0x8a5a2f,
    defense: 4,
    /**
     * ⚠ **Niższa niż u tarczy okutej, i to nie jest wyczucie — to jest zdanie,
     * które stoi kilkadziesiąt linijek niżej przy półce Radzima:** *„drewniany
     * krążek z pasami zużywa się szybciej niż deski spięte żelazem"*. Relacja
     * wynika z materiału (`docs/tarcze_katalog.md` §7), nie z rozmiaru.
     */
    durability: 50,
    block: { reduction: 0.3, swingMul: 1.08, staminaCost: 3 },
    // Etykieta tożsamości, ZERO efektu — jedyny future-proofing, na jaki
    // zgodziła się analiza (§B.7), i tylko dlatego, że jest etykietą, a nie
    // liczbą: etykiety nie da się po cichu wystroić ani policzyć dwa razy.
    // Zacznie coś robić dopiero, gdy powstanie parry albo Raise Shield.
    size: "maly",
    buyPrice: 50,
    sellPrice: 20,
    // ⚠ Brak `requires` jest REGUŁĄ, nie zapomnieniem — ta sama, dla której
    // sztylet, kij i cała skóra są bez bramki: respecu nie ma, więc postać
    // czysto zręcznościowa albo kondycyjna musi mieć zawsze dostępną opcję.
    description: "Mała okrągła tarcza. Chroni to, na co patrzysz.",
  },
  ironbound_shield: {
    id: "ironbound_shield",
    construction: "round",
    weight: 5,
    armorType: "metal",
    name: "Tarcza okuta",
    type: "armor",
    slot: "offhand",
    icon: { col: 11, row: 9 },
    iconTexture: "icon-shield-iron-round", // `tools/build_metal_shield_icons.py` (2026-10-02) — „okuta” = żelazna okrągła
    color: 0x9aa4b0,
    defense: 8,
    /**
     * ⚠⚠ **Sama OBECNOŚĆ tego pola włącza cały łańcuch trwałości** — zużycie,
     * naprawę (także zbiorczą), skalowanie `QUALITY.maxDurability`, linię
     * w tooltipie i `destroyedMultiplier` na bloku. `hasDurability` czyta
     * obecność pola, nie typ przedmiotu, więc tarcze weszły do systemu **bez
     * ani jednej gałęzi `if (tarcza)`** (`T-5`, 2026-09-15).
     *
     * ⚠ **Liczba jest PIERWSZYM PODEJŚCIEM, a czas życia wychodzi DŁUGI** —
     * i zapisuję to, zamiast udawać, że jest skalibrowana. Przy
     * `wearChance 0,15` i `wearAmount 1` jeden punkt schodzi średnio co
     * 6,7 zablokowanych ciosów, czyli 90 punktów to ~600 bloków. Gracz
     * przyjmuje 1–4 ciosy na walkę, więc to rząd **~300 walk**. Jeśli
     * trwałość ma być odczuwalna, strojeniem jest `wearChance`/`wearAmount`
     * (wspólne z bronią) albo te liczby — **to jest osobna decyzja balansowa,
     * nie część `T-5`**, którego zakresem było działanie łańcucha.
     *
     * Skala odniesienia — broń: sztylet 40 … młot bojowy 150.
     */
    durability: 90,
    block: { reduction: 0.45, swingMul: 1.2, staminaCost: 5 },
    size: "duzy",
    /**
     * ⚠ **220, nie 140 — i tę cenę wylicza twierdzenie o konwersji z §9.1,
     * a nie wyczucie.** W czystym wyścigu obrażeń X% redukcji daje ten sam
     * wynik co X% więcej DPS-u, więc blok 45% od przodu jest wart tyle, co
     * +45% DPS-u, a `swingMul` 1,20 oddaje z tego zaledwie 17%. Przy 140 g
     * ta tarcza była najtańszym dużym wzmocnieniem w grze i kupowało się ją
     * bez zastanowienia.
     *
     * Punkty odniesienia na tej samej półce: młot (szczyt drabinki broni)
     * 280 g, komplet stali 240 g. Tarcza okuta ma stać tuż pod nimi — to jest
     * zakup zamiast innego zakupu, a nie dokupienie czegoś obok.
     *
     * ⚠ Gdyby po playteście okazała się mimo to oczywistym wyborem dla
     * każdego, **najpierw podnosić `swingMul`, potem dopiero cenę, a redukcję
     * na końcu**: kara jest jednym polem, cena jest tylko progiem wejścia,
     * a redukcja jest tożsamością tej rzeczy (`docs/systemy/shields.md`).
     */
    buyPrice: 220,
    sellPrice: 88,
    requires: { strength: 3 },
    description: "Deski spięte żelazem. Ciężka — zamach z nią jest wolniejszy.",
  },

  /* ── PARTIA WARSTWOWA (2026-09-12) ────────────────────────────────────────
   *
   * Dziewięć konstrukcji z zatwierdzonej taksonomii
   * (`docs/decyzje/2026-09-12-taksonomia-pancerza.md`). Każda obsadza
   * `obszar × warstwa`, w którym dotąd stał JEDEN przedmiot, i każda tworzy
   * wybór, a nie szczebel.
   *
   * ⚠ **Żaden nie deklaruje pola `layer` i to jest poprawne.** Warstwę
   * wyprowadza `core/ArmorLayers.ts` z materiału (`padded`→L1, `leather`
   * i `mail`→L2, `metal`→L3), a wszystkie dziewięć trafia tam, gdzie mają być.
   * Pole `layer` jest od WYJĄTKÓW (narzutka ze skóry na L3), nie od
   * potwierdzania reguły.
   *
   * ⚠ **Wspólna reguła wyceny tej partii — dwie osie naraz, nie jedna.**
   * Wariant LŻEJSZY ma LEPSZY stosunek obrony do masy i NIŻSZĄ obronę
   * bezwzględną; cięższy odwrotnie. Sam „więcej punktów za więcej kilogramów"
   * byłby szczeblem („+1"), a nie wariantem. Sprawdzone arytmetycznie: w tej
   * partii **nie ma ani jednego przypadku dominacji** (ten sam slot i warstwa,
   * porównanie po obronie, masie, Sile i cenie).
   *
   * ⚠ **Ceny trzymają pasmo `cena/obrona` swojego materiału**, zmierzone na
   * istniejących sztukach: skóra 2,86–3,00 · przeszywanica 3,67–3,75 ·
   * kolczuga 3,89–4,38 · metal 4,00–4,67.
   *
   * ⚠ **`sellPrice` = 40% `buyPrice`**, jak wszędzie w tym pliku.
   *
   * ⛔ **Żaden z tych przedmiotów nie należy do zestawu (`set`).** Zestawy
   * grupują dziś komplety materiałowe po pięć sztuk; dorzucenie do nich
   * wariantów zrobiłoby z „4/5" liczbę bez znaczenia. `set` i `layer` są
   * niezależne (D4) — to nie jest powiązanie, tylko decyzja o zawartości.
   *
   * ⏳ **Liczby są kandydatami do strojenia, nie zamrożonym balansem** —
   * w szczególności Kirys (17 kg / Siła 5 / 130 g) wchodzi w trzy miejsca,
   * w których nie ma precedensu: najcięższy przedmiot w grze, pierwsza bramka
   * Siły 5 w pancerzu i cena powyżej krzywej materiału. Ta ostatnia idzie za
   * wzorcem szczytu drabinki, który roster już stosuje (młot 9,6 g/DPS przy
   * siekierze 6,5; tarcza okuta 27,5 g/obronę przy puklerzu 12,5).
   */

  /** GŁOWA · L3 · hełm otwarty. Połowa masy stalowego hełmu za −3 obrony
   *  i o jedną Siłę niżej; stosunek 4,67 przeciw 3,33. Kapalin jest tym L3,
   *  które zmieści się na głowie już obłożonej czepcem i kapturem kolczym. */
  /**
   * ⭐ **Podstawowy metalowy hełm OTWARTY — osobna konstrukcja, nie wariant.**
   *
   * ⛔ Nie jest ani tańszym stalowym hełmem, ani kapalinem z innym rondem:
   * kapalin to szerokie rondo (osłona z góry, odkryta twarz i kark), stalowy
   * i żelazny hełm to ta sama konstrukcja w dwóch gatunkach metalu, a szyszak
   * to **dzwon na głowę bez ronda** — najprostsza rzecz, jaką kowal robi z blachy.
   *
   * ⭐ **Warstwa L3 wychodzi z reguly materiału** (`metal → L3`) — ⛔ zero zmian
   * w `itemLayer()`, zero nowych warstw, zero nowych profili. Legalny stos
   * `Czepiec / Czepiec pikowany → Kaptur kolczy → Szyszak` działa **sam z siebie**,
   * bo zasady łączenia warstw są nietknięte.
   *
   * ⏳⏳ **LICZBY TYMCZASOWE.** Ustawione tylko tak, żeby przedmiot istniał
   * i nie był zdominowany: lżejszy i tańszy od stalowego hełmu, cięższy
   * i mocniejszy od kapalina. ⛔ **Żadnej istniejącej sztuki nie ruszono.**
   *
   * ⚠ Ikona POŻYCZONA od stalowego hełmu — placeholder do passu artystycznego.
   *
   * ⏳ **Hełmy mogą kiedyś wpływać na podatność na ogłuszenie/oszołomienie**
   * — pomysł przyszłości, `docs/pomysly.md`. ⛔ Dziś żaden hełm, w tym ten,
   * nie niesie żadnego pola ani bonusu z tym związanego.
   */
  spangenhelm: {
    id: "spangenhelm",
    weight: 2.5,                     // ⏳ TYMCZASOWE
    armorType: "metal",
    name: "Hełm stożkowy",
    type: "armor",
    slot: "head",
    icon: { col: 2, row: 25 },       // ⚠ PLACEHOLDER — ikona stalowego hełmu
    iconTexture: "icon-armor-spangenhelm", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 9,                      // ⏳ TYMCZASOWE
    buyPrice: 38,                    // ⏳ TYMCZASOWE
    sellPrice: 15,
    requires: { strength: 1 },       // ⏳ TYMCZASOWE
    description: "Kuty dzwon z żelaznym ożebrowaniem, bez ronda i bez zasłony. Twarz zostaje odkryta — widzisz i słyszysz wszystko.",
  },
  kettle_hat: {
    id: "kettle_hat",
    weight: 1.5,
    armorType: "metal",
    name: "Kapalin",
    type: "armor",
    slot: "head",
    icon: { col: 0, row: 25 },
    iconTexture: "icon-armor-kettle-hat", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 7,
    buyPrice: 32,
    sellPrice: 13,
    requires: { strength: 1 },
    description: "Otwarty hełm z rondem. Widzisz i słyszysz wszystko — i to jest cała jego zaleta.",
  },

  /** TORS · L1 · przeszywanica cienka. Podszywana pod coś, nie noszona sama:
   *  8 obrony przy 1,5 kg (stosunek 5,33) przeciw grubej przeszywanicy 15 przy
   *  4 kg (3,75). Decyzja brzmi „gruba sama czy cienka plus kolczuga". */
  arming_doublet: {
    id: "arming_doublet",
    weight: 1.5,
    armorType: "padded",
    name: "Kaftan pikowany",
    type: "armor",
    slot: "chest",
    icon: { col: 2, row: 22 },
    iconTexture: "icon-armor-arming-doublet", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0xb8a173,
    defense: 8,
    buyPrice: 30,
    sellPrice: 12,
    // ⚠ Nazwa zmieniona 2026-09-16: „Kaftan podzbrojny” → „Kaftan pikowany”.
    //   Stara nazwa mówiła, że rzecz istnieje WYŁĄCZNIE jako podkład pod zbroję;
    //   ma być pełnoprawnym, samodzielnym elementem ubioru na L1. ⛔ Liczby bez zmian.
    description: "Cienki, ciasno pikowany. Nosi się go i sam, i pod kolczugą — nie uwiera i nie waży.",
  },

  /** TORS · L2 · kolczuga krótka. Cztery kilogramy lżejsza od pełnej, o jedną
   *  Siłę niżej, −6 obrony. To jest kolczuga, którą się nosi PLANUJĄC płytę. */
  short_hauberk: {
    id: "short_hauberk",
    weight: 6,
    armorType: "mail",
    name: "Kolczuga krótka",
    type: "armor",
    slot: "chest",
    /** ⚠ Ikona WYPROWADZONA z pełnej kolczugi (6,26) przez
     *  `tools/build_mail_variants.py` — arkusz nie miał wolnego kafla z fakturą
     *  siatki, a ikona płytowa na kolczudze kłamałaby o materiale. */
    icon: { col: 7, row: 26 },
    iconTexture: "icon-armor-short-hauberk", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8d949c,
    defense: 12,
    buyPrice: 50,
    sellPrice: 20,
    requires: { strength: 2 },
    description: "Kolczuga do pasa. Krótsza, lżejsza — i zostawia miejsce na to, co przyjdzie na wierzch.",
  },

  /** TORS · L2 · skóra utwardzana. Tożsamość jest w PROFILU, nie w punktach:
   *  przeciw obuchowi 10,4 pkt wobec 4,2 krótkiej kolczugi, przeciw ciętemu
   *  13,0 wobec 21,6. Tańsza i o jedną Siłę niżej, ale o pół kilograma cięższa
   *  — żadna z tych dwóch nie dominuje drugiej. */
  /**
   * ⭐⭐ **KONIEC ŚCIEŻKI, NIE SZCZEBEL DO L3** (decyzja autora 2026-09-16).
   *
   * ⛔ **Nie czytaj tego jako `skóra → skóra ćwiekowana → jeszcze mocniejsza
   * skóra → płyta`.** To jest ALTERNATYWNA ścieżka wobec ciężkiego pancerza
   * warstwowego: lżejsza, tańsza, bez bramki Siły rzędu płyty — i **świadomie
   * kończąca się na L2**. ⛔ Odpowiednika L3 nie będzie i jego brak NIE jest
   * dziurą w katalogu.
   *
   * ⭐ **Zasada, którą ta sztuka wprowadza do systemu:** nie każda ścieżka
   * rozwoju pancerza musi prowadzić do L3. Pełny stos L1+L2+L3 jest JEDNĄ
   * z opcji, nie obowiązkowym szczytem.
   *
   * ⚠ Ćwieki są metalowe, ale przedmiot zostaje `armorType: "leather"` — to
   * jest świadome: `ARMOR_PROFILE` nie dostaje nowej kolumny (`OI-100` nietknięte),
   * a ćwiekowanie jest wzmocnieniem skóry, nie osobnym profilem obrażeń.
   * Warstwa (`L2`) wychodzi z reguly materiału — **zero zmian w `itemLayer()`**.
   *
   * ⏳⏳ **LICZBY TYMCZASOWE.** Ustawione tak, żeby sztuka była sensownym
   * KOŃCEM ścieżki skórzanej (nad napierśnikiem skórzanym, 13 pkt), a nie
   * żeby była zbalansowana wobec kolczugi. Pełny balans — osobno.
   *
   * ⚠ Ikona POŻYCZONA od napierśnika skórzanego — placeholder do passu
   * artystycznego, nie docelowy asset.
   */
  studded_leather: {
    id: "studded_leather",
    weight: 5.5,                     // ⏳ TYMCZASOWE
    armorType: "leather",
    name: "Kaftan ćwiekowany",
    type: "armor",
    slot: "chest",
    icon: { col: 3, row: 22 },       // ⚠ PLACEHOLDER — ikona napierśnika skórzanego
    iconTexture: "icon-armor-studded-leather", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x6b4a2a,
    defense: 14,                     // ⏳ TYMCZASOWE
    buyPrice: 62,                    // ⏳ TYMCZASOWE
    sellPrice: 24,
    requires: { strength: 1 },       // ⏳ TYMCZASOWE — jak napierśnik skórzany
    description: "Gruba skóra gęsto nabijana żelaznymi ćwiekami. Dalej niż to skóra nie sięga — i nie musi.",
  },
  hardened_leather_chest: {
    id: "hardened_leather_chest",
    weight: 6.5,
    armorType: "leather",
    name: "Napierśnik skórzany",
    type: "armor",
    slot: "chest",
    icon: { col: 3, row: 22 },
    iconTexture: "icon-armor-hardened-leather-chest", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x7a5230,
    defense: 13,
    buyPrice: 39,
    sellPrice: 16,
    requires: { strength: 1 },
    description: "Skóra gotowana i formowana na twardo. Sztywna jak deska — i tak samo znosi obuch.",
  },

  /** TORS · L3 · brygantyna. Giętkie wzmocnienie przeciw sztywnemu: 4 kg
   *  lżejsza od napierśnika, o jedną Siłę niżej, stosunek 2,13 przeciw 1,83.
   *  ⚠ Na poziomie danych jest „lżejszą płytą" — ten sam materiał, ten sam
   *  profil. Jej odrębność jako rodziny jest opisowa, nie mechaniczna, i tak
   *  jest to zapisane w taksonomii. */
  brigandine: {
    id: "brigandine",
    weight: 8,
    armorType: "metal",
    name: "Brygantyna",
    type: "armor",
    slot: "chest",
    icon: { col: 1, row: 26 },
    iconTexture: "icon-armor-brigandine", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 17,
    buyPrice: 78,
    sellPrice: 31,
    requires: { strength: 3 },
    description: "Płytki nitowane od środka w płóciennym kaftanie. Gnie się tam, gdzie płyta nie chce.",
  },

  /** TORS · L3 · płyta pełna. Szczyt drabinki pancerza i jego cena: najcięższy
   *  przedmiot w grze, pierwsza bramka Siły 5, najgorszy stosunek obrony do
   *  masy (1,65). ⏳ Wszystkie trzy liczby są kandydatami do strojenia. */
  cuirass: {
    id: "cuirass",
    weight: 17,
    armorType: "metal",
    name: "Kirys",
    type: "armor",
    slot: "chest",
    icon: { col: 4, row: 26 },
    iconTexture: "icon-armor-cuirass", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 28,
    buyPrice: 130,
    sellPrice: 52,
    requires: { strength: 5 },
    description: "Napierśnik i naplecznik spięte na pasach. Nosi się to całe albo wcale.",
  },

  /** NOGI · L2 · kolczuga częściowa. Dwa kilogramy lżej za −4 obrony i o jedną
   *  Siłę niżej — to jest ta różnica, która decyduje, czy nogi uniosą jeszcze
   *  warstwę wyżej. */
  demi_chausses: {
    id: "demi_chausses",
    weight: 3,
    armorType: "mail",
    name: "Spodenki kolcze",
    type: "armor",
    slot: "legs",
    /** ⚠ Ikona wyprowadzona z pełnych nogawic (6,27) — patrz `short_hauberk`. */
    icon: { col: 7, row: 27 },
    iconTexture: "icon-armor-demi-chausses", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8d949c,
    defense: 8,
    buyPrice: 34,
    sellPrice: 14,
    requires: { strength: 1 },
    description: "Kolcze spodenki sznurowane nad kolanem. Reszta nogi zostaje twoja.",
  },

  /** NOGI · L3 · płyta pełna. +6 obrony i +4 kg ponad nagolenniki, bramka 4
   *  zamiast 3; stosunek 2,10 przeciw 2,50. */
  /**
   * ⭐ **ALTERNATYWNA konstrukcja L3 nóg, nie kolejny szczebel drabinki.**
   * Rodzina „szyna” z taksonomii: pasy blachy nitowane na skórze, giętkie
   * w kolanie tam, gdzie lita płyta jest sztywna. ⛔ Nie zastępuje stalowych
   * ani żelaznych nagolenników i ⛔ **nie dorabiamy do niej osobnych nabiodrek**.
   * ⏳⏳ LICZBY TYMCZASOWE — przewaga jednej konstrukcji nad drugą jest
   * świadomie NIEUSTALONA na tym etapie.
   * ⚠ Ikona POŻYCZONA od stalowych nagolenników — placeholder.
   */
  splinted_greaves: {
    id: "splinted_greaves",
    weight: 5,                       // ⏳ TYMCZASOWE
    armorType: "metal",
    name: "Okute spodnie",
    type: "armor",
    slot: "legs",
    icon: { col: 2, row: 27 },       // ⚠ PLACEHOLDER
    iconTexture: "icon-armor-splinted-greaves", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x8e9199,
    defense: 13,                     // ⏳ TYMCZASOWE
    buyPrice: 52,                    // ⏳ TYMCZASOWE
    sellPrice: 20,
    requires: { strength: 2 },       // ⏳ TYMCZASOWE
    description: "Pasy blachy nitowane wzdłuż skórzanych spodni. Gną się w kolanie tam, gdzie lita płyta stawia opór.",
  },
  cuisses: {
    id: "cuisses",
    weight: 10,
    armorType: "metal",
    name: "Pełne nagolenniki",
    type: "armor",
    slot: "legs",
    icon: { col: 4, row: 27 },
    iconTexture: "icon-armor-cuisses", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 21,
    buyPrice: 88,
    sellPrice: 35,
    requires: { strength: 4 },
    description: "Uda, kolana i golenie zakute od pasa w dół. Chodzi się w tym wolno i pewnie.",
  },

  /** STOPY · L3 · płyta miejscowa. Metal na stopie za 1,5 kg zamiast 3,5;
   *  stosunek 4,00 przeciw 2,86. */
  half_sabatons: {
    id: "half_sabatons",
    weight: 1.5,
    armorType: "metal",
    name: "Półstalowe buty",
    type: "armor",
    slot: "boots",
    icon: { col: 0, row: 28 },
    iconTexture: "icon-armor-half-sabatons", // PILOT ikon pancerza (build_armor_icons.py) — czeka na ocenę w grze
    color: 0x9aa4b0,
    defense: 6,
    buyPrice: 28,
    sellPrice: 11,
    requires: { strength: 1 },
    // ⚠ Nazwa zmieniona 2026-09-16: „Sabatony częściowe” → „Półpłytowe”.
    //   ⛔ To NIE jest „gorsza wersja” pełnego obuwia płytowego: płyta kryje palce,
    //   staw skokowy i piętę, a reszta stopy zostaje odkryta ŚWIADOMIE — za
    //   ruchliwość. ⛔ Liczby bez zmian (zmiana nazwy nie jest powodem do strojenia).
    description: "Buty z blachą na stopie i kostce. Tyle stali, ile nie przeszkadza w marszu.",
  },

  // ── Rings ────────────────────────────────────────────────────────────────
  // Two ring slots (Equipment.ring1/ring2), so these are the one place the
  // player picks a pair rather than a single best-in-slot.
  //
  // They grant DERIVED stats (crit, attack speed, max HP, defense) and
  // deliberately NOT attributes. A "+2 Siła" ring is the classic ARPG stat
  // stick, and it was rejected on purpose: attribute requirements
  // (ITEMS[...].requires) are checked on equip only, so a ring could lift you
  // over the hammer's Siła 6 and then be taken off, leaving you wielding gear
  // you no longer qualify for. With no respec in the game the fixes are all
  // bad — refuse the unequip (a dead end on touch) or silently strip the
  // weapon (worse). Keeping rings off the attribute axis sidesteps it
  // entirely; revisit only alongside a real "recheck equipped gear" pass.
  // ⭐ Od 2026-10-05 każdy ma WŁASNĄ ikonę (`iconTexture`, `tools/build_misc_icons.py`,
  // `docs/gemini_item_icons.md` §4): bursztyn na brązie, szkło, karneol na
  // żelazie, patynowany brąz — kolor, który gracz znał z tintu, niesie dziś
  // MATERIAŁ. `icon` + `tintIcon` zostają wyłącznie jako ŚCIEŻKA AWARYJNA
  // (jak przy tarczach), gdyby PNG się nie wczytał: wszystkie cztery dzielą
  // wtedy jedyny pierścień z items.png (0,14), barwiony `color`.
  ring_vigor: {
    id: "ring_vigor",
    iconTexture: "icon-ring-vigor",
    name: "Pierścień wigoru",
    type: "ring",
    icon: { col: 0, row: 14 },
    tintIcon: true,
    color: 0xd8564a,
    bonus: { maxHp: 25 },
    buyPrice: 70,
    sellPrice: 28,
    description: "Dodaje sił witalnych temu, kto go nosi.",
  },
  ring_precision: {
    id: "ring_precision",
    iconTexture: "icon-ring-precision",
    name: "Pierścień precyzji",
    type: "ring",
    icon: { col: 0, row: 14 },
    tintIcon: true,
    color: 0xf0c93a,
    bonus: { critChance: 0.06 },
    buyPrice: 80,
    sellPrice: 32,
    description: "Prowadzi dłoń tam, gdzie cios zaboli najbardziej.",
  },
  ring_swiftness: {
    id: "ring_swiftness",
    iconTexture: "icon-ring-swiftness",
    name: "Pierścień zwinności",
    type: "ring",
    icon: { col: 0, row: 14 },
    tintIcon: true,
    color: 0x5ec8f0,
    bonus: { attackSpeed: 0.08 },
    buyPrice: 80,
    sellPrice: 32,
    description: "Ręka z nim staje się szybsza, niż oko zdąży nadążyć.",
  },
  ring_warding: {
    id: "ring_warding",
    iconTexture: "icon-ring-warding",
    name: "Pierścień ochrony",
    type: "ring",
    icon: { col: 0, row: 14 },
    tintIcon: true,
    color: 0x8fe08a,
    bonus: { defense: 8 },
    buyPrice: 65,
    sellPrice: 26,
    description: "Zbiera na siebie ciosy, które miały trafić ciebie.",
  },
  /**
   * ── NASZYJNIK Z KŁA SZAREGO — pierwszy i jedyny amulet ────────────────────
   *
   * Otwiera slot `amulet`, czyli trzeci martwy kafel lalki ekwipunku (po
   * drugiej ręce i rękawicach). Ta sama zasada, którą ten projekt trzyma od
   * początku: **kafel ożywa dopiero z przedmiotem, który ma w nim stanąć**, a
   * nie „na zapas".
   *
   * ⚠ **Nie ma `buyPrice` i nigdy nie stanie na żadnej półce** — to ta sama
   * reguła co `padded_gloves` i `cooked_meat`: przedmiot, którego nie da się
   * kupić, jest jedynym rodzajem nagrody, którego nie da się obejść mieszkiem.
   * Tu waży to więcej niż zwykle, bo powstaje z kła Szarego, a Szary **nie
   * odradza się nigdy** — drugiego naszyjnika w tej grze nie będzie.
   *
   * ⚠ **`sellPrice` jest, i to jest świadome, a nie przeoczenie.** Kieł miał
   * 140 g i był „trofeum z ceną" (patrz `grey_fang`); naszyjnik tę własność
   * dziedziczy — wolno go sprzedać, jeśli ktoś naprawdę chce. Trzy rzeczy
   * pilnują, żeby nie stało się to przypadkiem: dopóki `mysliwy_z_zagajow`
   * trwa, sprzedaż jest odmawiana (`Quests.reservedCount`), sprzedaje się po
   * jednej sztuce za potwierdzeniem (`sellsOneAtATime` w ShopPanel), i nie
   * stakuje się (`Inventory.maxStack`).
   *
   * ⚠ **`critChance`, a nie atrybut** — obowiązuje reguła znad pierścieni:
   * sprzęt daje statystyki POCHODNE, nigdy atrybutów, bo `requires` sprawdza
   * się tylko przy zakładaniu i amulet dający Siłę pozwoliłby wejść w młot, a
   * potem go zdjąć. Krytyk wybrany zamiast HP/obrony, bo to jedyna z czterech
   * premii, która nie powtarza żadnego pierścienia w roli głównej i czyta się
   * z przedmiotu: kieł to ugryzienie, nie tarcza. 0,08 przeciw 0,06
   * Pierścienia precyzji — najtrudniejsza walka na mapie ma dawać więcej niż
   * towar z półki, a i tak wpada pod wspólny sufit `maxCritChance`, więc nic
   * nie może się przez to rozjechać.
   *
   * Ikona: od 2026-10-05 własna (`iconTexture`, kieł na pętli rzemienia —
   * `docs/gemini_item_icons.md` §4). `icon` niżej to ŚCIEŻKA AWARYJNA:
   * `items.png` (0,13) — **jedyny naszyjnik na całym arkuszu**,
   * sprawdzony WYCIĘCIEM, nie miniaturą (README: 144 px treści, 4 kolory,
   * brązowy rzemień z jasnym wisiorem). Bez `tintIcon`: mnożnikowy odcień
   * kością zabarwiłby też rzemień, a rzemień ma zostać skórzany.
   */
  grey_fang_necklace: {
    id: "grey_fang_necklace",
    iconTexture: "icon-grey-fang-necklace",
    name: "Naszyjnik z kła Szarego",
    type: "amulet",
    icon: { col: 0, row: 13 },
    color: 0xe8e6df,
    bonus: { critChance: 0.08 },
    sellPrice: 140,
    description:
      "Kieł na rzemieniu, oprawiony niezdarnie i jedną ręką. Nosi się go nie po to, żeby lepiej bić — tylko po to, żeby było widać, że się go ma.",
  },
  /**
   * Rodzina toreb — `type: "container"`, jedyny typ, który nie wchodzi do
   * `EQUIP_SLOTS` (patrz `BAG_SLOTS` w `core/Equipment.ts`) i **nie waży ani
   * grama**: `Equipment.equippedWeight` liczy `EQUIP_SLOTS` + `STOW_SLOTS`,
   * więc torba jest dziś **jedynym noszonym przedmiotem celowo poza tą sumą** —
   * decyzja opisana w `docs/inventory_scroll_ux.md` §3.
   *
   * ⚙ **Poprawka 2026-09-15:** do tej daty stało tu, że suma liczy „wyłącznie
   * `EQUIP_SLOTS`", i przestało to być prawdą razem z `OI-96` — schowany zestaw
   * broni (`STOW_SLOTS`) waży od tej daty 100% swojej masy. ⛔ **Torby zostają
   * przy zerze i to jest OSOBNA decyzja, której `OI-96` świadomie nie ruszyła.**
   *
   * ⚠ **Ceny są SZKICEM, nie zamrożonym balansem.** `buyPrice`/`sellPrice`
   * trzymają ten sam mnożnik ×2,5 co reszta rosteru (`dagger` 40/16,
   * `leather_helmet` 15/6) — nie osobno wymyślona ekonomia, tylko ta sama
   * krzywa zastosowana do nowego typu. U Wszebora **tymczasowo, jako test
   * mechaniki** (2026-08-26) — patrz `docs/odlozone.md` §1 „Sprzedawca
   * toreb". Hierarchia wizualna (sakiewka → torba → sakwa → plecak) jest
   * ustalona z poprzedniej sesji; przypisanie slotów 2/4/6/8 do niej —
   * decyzja autora.
   */
  small_leather_pouch: {
    id: "small_leather_pouch",
    name: "Mała sakiewka",
    type: "container",
    containerSlots: 2,
    iconTexture: "icon-bag-1",
    color: 0x8a5a34,
    buyPrice: 50,
    sellPrice: 20,
    description: "Zawiązana sznurkiem sakiewka na drobiazgi. Niewiele, ale zawsze coś.",
  },
  small_bag: {
    id: "small_bag",
    name: "Mała torba",
    type: "container",
    containerSlots: 4,
    iconTexture: "icon-bag-2",
    color: 0x7a4a2a,
    buyPrice: 110,
    sellPrice: 45,
    description: "Skórzana torba z klapką. Mieści więcej niż sakiewka, choć sama jest niska.",
  },
  travelers_satchel: {
    id: "travelers_satchel",
    name: "Sakwa podróżnika",
    type: "container",
    containerSlots: 6,
    iconTexture: "icon-bag-3",
    color: 0x6b3d22,
    buyPrice: 225,
    sellPrice: 90,
    description: "Sakwa ze sprzączką i paskiem na ramię — szyta do dłuższej drogi.",
  },
  leather_backpack: {
    id: "leather_backpack",
    name: "Plecak skórzany",
    type: "container",
    containerSlots: 8,
    iconTexture: "icon-bag-4",
    color: 0x5c3018,
    buyPrice: 400,
    sellPrice: 160,
    description: "Solidny plecak na dwóch paskach, z mosiężną sprzączką. Największy z toreb.",
  },
  // ⭐ 37 tarcz z `SHIELD_ITEMS` — katalog liczony z `SHIELD_BASE` × `SHIELD_VARIANT`.
  ...SHIELD_ITEMS,
} as const;

/**
 * ── ZESTAWY PRZEDMIOTÓW (sety) ────────────────────────────────────────────
 *
 * ⚠ **To jest SILNIK, a nie zawartość, i ta różnica jest tu najważniejsza.**
 * Zestawy NIE dokładają do gry ani jednego przedmiotu: wiążą po `set:` te,
 * które już istnieją. Rozwiązaniem problemu „gracz ma setki rzeczy" ma być
 * struktura (tag → próg → premia), a nie roster. Dopisanie zestawu to wpis
 * tutaj plus pole `set` na istniejących przedmiotach — zero nowych ikon, zero
 * nowych cen, zero nowego handlu.
 *
 * ⚠ **Progi są CZĘŚCIOWE z założenia (2 i 4 przy pięciu członkach), i to jest
 * decyzja projektowa, nie brak ambicji.** Sztywne „6/6 albo nic" zamyka
 * budowanie postaci: gracz nosi komplet albo go nie nosi. Przy 2/4 z pięciu
 * członków ZAWSZE zostaje wolne miejsce, więc naturalny stan w późnej grze to
 * „4 z jednego zestawu + 2 z drugiego + jedna rzecz sama z siebie" — dokładnie
 * ta kombinacja, o którą chodzi w buildcraftingu. Nowy zestaw z sześcioma
 * członkami może mieć progi 2/4/6; liczy się to, żeby najwyższy próg nie
 * wymagał WSZYSTKICH slotów statystykowych.
 *
 * ⚠ **Liczone są WYPOSAŻONE ELEMENTY, nie sloty** (`core/ItemSets.ts`). To
 * jedyna rzecz, którą trzeba było ustawić PRZED warstwowym pancerzem: gdy tors
 * zacznie mieścić przeszywanicę + kolczugę + napierśnik, każda z tych warstw
 * może należeć do innego zestawu i każda ma się liczyć osobno. Reguła
 * „1 slot = 1 element" trzymałaby się dziś i pękła dokładnie wtedy.
 *
 * ⚠ **Premie idą kanałem POCHODNYM** (`maxHp` / `critChance` / `attackSpeed` /
 * `defense`) — tym samym, co pierścienie, i z tego samego powodu: sprzęt nigdy
 * nie daje ATRYBUTU, bo `requires` sprawdza się tylko przy zakładaniu
 * (komentarz nad pierścieniami wyżej).
 *
 * ⛔ **PREMIE SĄ CELOWO PUSTE (decyzja autora, 2026-09-12).** `bonus: {}`
 * w każdym progu i `text: "premia nieustalona"` — silnik liczy komplety,
 * pokazuje postęp i progi, ale **nie daje ani jednej statystyki**.
 *
 * Powód jest projektowy, nie techniczny: **warstwowanie i zestawy to dwie
 * różne mechaniki** i nie wolno ich stroić naraz. Warstwy dzielą jeden slot na
 * L1/L2/L3 i zmieniają całą arytmetykę ochrony (pełny stos trzywarstwowy
 * z dzisiejszych przedmiotów daje 142 pkt, czyli 74% przy suficie 75%);
 * dokładanie do tego premii za komplet znaczyłoby strojenie dwóch niezależnych
 * źródeł obrony w jednym playteście.
 *
 * ⚠ **Puste premie NIE czynią systemu martwym** — tag, progi, liczenie po
 * elementach i cała prezentacja działają i są testowalne. Brakuje wyłącznie
 * liczby na końcu, a ta jest jedną wartością w tej tablicy.
 *
 * ⚠ **Wcześniejsze wartości (rząd wielkości pierścienia: +4% tempa, +25 HP,
 * +8 obrony) zostały USUNIĘTE, nie zakomentowane.** Zakomentowany balans wraca
 * do gry przez przypadek; historia jest w gicie.
 */
export const ITEM_SETS = {
  /** Skóra — zestaw RUCHU. Premie na tempie i krytyku, bo skóra jest w tej
   *  grze wyborem „nie chcę, żeby mnie spowalniało", nie wyborem obrony. */
  trop_lowcy: {
    id: "trop_lowcy",
    name: "Trop Łowcy",
    tiers: [
      { count: 2, bonus: {}, text: "premia nieustalona" },
      { count: 4, bonus: {}, text: "premia nieustalona" },
    ],
  },
  /** Przeszywanica — zestaw WYTRZYMAŁOŚCI. Jedyny materiał bez bramki Siły
   *  (patrz `gambeson`), więc jego zestaw ma być opłacalny dla postaci, która
   *  w stal nigdy nie wejdzie. */
  warstwy_lnu: {
    id: "warstwy_lnu",
    name: "Warstwy Lnu",
    tiers: [
      { count: 2, bonus: {}, text: "premia nieustalona" },
      { count: 4, bonus: {}, text: "premia nieustalona" },
    ],
  },
  /** Kolczuga — zestaw ŚRODKA. Po trochu z obu stron, bo tym właśnie jest
   *  kolczuga w drabince materiałów. */
  splot_pierscieni: {
    id: "splot_pierscieni",
    name: "Splot Pierścieni",
    tiers: [
      { count: 2, bonus: {}, text: "premia nieustalona" },
      { count: 4, bonus: {}, text: "premia nieustalona" },
    ],
  },
  /** Stal — zestaw TWIERDZY. Najwyższe premie w grze i najwyższa cena wejścia
   *  (komplet 240 g plus bramki Siły), więc to on wyznacza sufit skali. */
  kuta_stal: {
    id: "kuta_stal",
    name: "Kuta Stal",
    tiers: [
      { count: 2, bonus: {}, text: "premia nieustalona" },
      { count: 4, bonus: {}, text: "premia nieustalona" },
    ],
  },
} as const;


/**
 * How armor mitigates incoming damage. `reduction = defense / (defense + K)`
 * (diminishing returns — a common ARPG shape: cheap early stacking, harder to
 * push toward the cap), clamped to `maxDefenseReduction`.
 */
/**
 * Jak dany RODZAJ ochrony znosi dany TYP obrażeń — mnożnik na punktach obrony,
 * nie na obrażeniach.
 *
 * Mnożnik trafia na punkty, a nie na wynik, i to jest cała architektura tego
 * systemu: jakość egzemplarza też skaluje punkty (`instanceDefense`), przyszła
 * trwałość pancerza również by je skalowała, a krzywa `d/(d+K)` i wspólny cap
 * zostają jedne dla wszystkiego. Gdyby profil mnożył gotowy procent, „+20%
 * jakości" na „60% redukcji" nie miałoby jednej poprawnej odpowiedzi.
 *
 * Czytanie tabeli: `pierce` przebija skórę, `blunt` przechodzi przez stal,
 * `slash` jest GENERALISTĄ — przy pancerzu nigdy najlepszy, za to broń cięta ma
 * najwyższe surowe obrażenia w drabince (siekiera 24, miecz 23 DPS przeciw 20
 * sztyletu). To jest jego rekompensata i świadomy wybór, bo `slash` jest typem
 * domyślnym obu broni dwuwariantowych.
 *
 * ⚠ **Przy DWÓCH kategoriach ochrony trójkąta trzech typów nie da się domknąć**
 * — jeden typ musi być generalistą. Trzecia kategoria (chityna/pancerz
 * naturalny) domknęłaby to i jest świadomie odłożona; patrz `docs/odlozone.md`.
 *
 * ⚠ **To są liczby DO PLAYTESTU, nie zamrożony balans.** Model (punkty → profil
 * → krzywa) jest zatwierdzony; konkretne 0,45 czy 0,40 nie mają jeszcze pokrycia
 * w rozegranych walkach. Zmieniaj je swobodnie po testach — ale zmieniaj TU,
 * a nie w kodzie entity.
 */
/**
 * ── GATUNEK MATERIAŁU — oś PIONOWA, prostopadła do profilu ────────────────
 *
 * ⚠⚠ **To NIE jest `ARMOR_PROFILE` i nigdy nim nie będzie.** `armorType`
 * odpowiada na „jak ta konstrukcja reaguje na typy obrażeń" (oś pozioma,
 * trójkąt wymian, rządzi nią `N-7`). `material` odpowiada na „z jakiego
 * gatunku metalu to zrobiono" (oś pionowa, drabinka rozwoju). Dowód, że to
 * naprawdę dwie osie: **kolczuga i płyta są z tego samego metalu, a mają różne
 * profile** — żelazo jest jednocześnie drutem (`mail`) i blachą (`metal`).
 * ⛔ Gatunku nie wolno przemycić jako wiersza `ARMOR_PROFILE`: `N-7` żądałby
 * wtedy od żelaza typu obrażeń, w którym wygrywa, a żelazo z definicji nie
 * wygrywa ze stalą w niczym.
 *
 * ⭐ **Poziom zerowy to STAL: cały dzisiejszy katalog.** Drabinka rośnie
 * W DÓŁ — żelazo jest nowym, tańszym szczeblem PONIŻEJ. Dzięki temu ani jedna
 * istniejąca liczba się nie zmieniła, kirys (28 PP) zostaje szczytem, a scope
 * PP pojedynczej warstwy (~30) pozostaje nietknięty.
 *
 * ⚠ **`defenseMul` 0,80 jest wyliczone, nie wybrane na oko.** Korytarz domykają
 * z dwóch stron: SUFIT z czytelności — najlepsze żelazo w obiegu (Q4, ×1,05)
 * musi być słabsze od najgorszej stali w obiegu (Q1, ×0,85), czyli
 * `m < 0,85/1,05 = 0,810`; PODŁOGA z katalogu — żelazna szyna nie może zejść
 * pod nogawice kolcze (12/15 = 0,800), a żelazny napierśnik pod brygantynę
 * (17/22 = 0,773). Zostaje pasmo **0,80–0,81** i 0,80 jest jego dnem.
 * ⛔ Przy 0,833 (rękawice: 5/6) korytarz jest PUSTY — dlatego ręce zostają
 * jednogatunkowe, i to jest wynik arytmetyki, nie zakaz.
 *
 * ⚠ **`priceMul` 0,60 jest OSOBNĄ osią od `defenseMul` i musi być od niego
 * NIŻSZY.** Cena za punkt liczy się jako `c/m = 0,75`, więc żelazo jest
 * wyraźnie lepszym zakupem „na złotówkę" — gdyby `c ≥ m`, żelazo byłoby gorsze
 * pod każdym względem naraz i nikt by go nie kupił.
 *
 * ⛔ **Masa i `requires` NIE należą do gatunku** (decyzja autora 2026-09-15):
 * różnica gęstości żelaza i stali jest za mała, żeby uzasadnić mechanikę,
 * a masa jest już osią rozmiaru konstrukcji. `iron X` i `steel X` ważą tyle
 * samo i mają tę samą bramkę Siły.
 *
 * ⏳ **Trwałość będzie kiedyś naturalnym domem gatunku** („żelazo wykrusza się
 * szybciej") — ⛔ ale pancerz trwałości DZIŚ NIE MA i nie dodajemy jej tędy.
 */
export const ARMOR_MATERIAL = {
  iron: { name: "żelazo", defenseMul: 0.8, priceMul: 0.6 },
  steel: { name: "stal", defenseMul: 1.0, priceMul: 1.0 },
} as const;

/**
 * **GATUNEK MATERIAŁU BRONI** — trzecia oś modelu przedmiotu po stronie
 * uzbrojenia: `Construction → Material → Quality → Variant`.
 *
 * ⚠ **Osobna tabela od `ARMOR_MATERIAL`, choć nazwy gatunków się pokrywają.**
 * Powód jest mechaniczny: pancerz mnoży PUNKTY OCHRONY, broń mnoży ZAKRES
 * OBRAŻEŃ, a to dwie różne wielkości o różnych krzywych. Wspólna tabela
 * zmuszałaby jedną z nich do udawania drugiej.
 * ⚠ **Kiedy dojdzie TRZECI gatunek, te dwie drabinki będą chciały się zejść**
 * w jedną `MATERIAL_GRADE` z kolumną per konsument — zapisane jako dług,
 * świadomie nie robione teraz (jeden gatunek nie uzasadnia abstrakcji).
 *
 * ⭐ **Stal to poziom ZEROWY — cały dotychczasowy arsenał.** Broń bez pola
 * `material` dostaje `steel`, czyli ×1,00: ani jedna liczba obrażeń w grze
 * nie zmieniła się przy wprowadzeniu tej osi.
 *
 * ⚠ **`priceMul` MUSI zostać niższy od `damageMul`** (`0,60 / 0,80 = 0,75`,
 * ta sama proporcja co w pancerzu). Inaczej tańszy gatunek jest słabszy ORAZ
 * gorszy na złotówkę — czyli pułapką, nie wyborem. Pilnuje tego przymiar.
 *
 * ⛔ **Gatunek nie rusza masy, wymagań Siły, tempa ani zasięgu.** Ta sama
 * granica, co po stronie pancerza, i z tego samego powodu: masa jest osią
 * ROZMIARU konstrukcji, a nie jej tworzywa.
 *
 * ⚠ **Dziś korzysta z tego pola ZERO broni i to jest poprawny stan startowy.**
 * Oś ma pozwalać wystawić żelazny wariant konstrukcji, a nie zmuszać do
 * podwojenia katalogu w dniu jej powstania. Mechanika: `core/WeaponMaterials.ts`.
 */
export const WEAPON_MATERIAL = {
  iron: { name: "żelazo", damageMul: 0.8, priceMul: 0.6 },
  steel: { name: "stal", damageMul: 1.0, priceMul: 1.0 },
} as const;

export const ARMOR_PROFILE = {
  leather: { slash: 1.0, pierce: 0.45, blunt: 0.8 },
  /**
   * ⚠ **`blunt` podniesione 0,40 → 0,50 (2026-08-17). To była naprawa
   * ZMIERZONEGO objawu, nie strojenie „na czuja".**
   *
   * Przy 0,40 pełna stal zbijała się z 57 pkt do 22,8 — **poniżej
   * nieotypowanej skóry (27)** — więc przeciw obuchowi dzika i niedźwiedzia
   * dawała **31,3%** redukcji przy 30,2% skóry. **1,2 punktu procentowego za
   * komplet czteroktornie droższy**, czyli różnica poniżej progu zauważalności:
   * nie czytelny kompromis, tylko błąd zaokrąglenia. Dopóki kolumna `metal`
   * nic nie robiła (przeciwnicy nie mieli typów obrażeń do CR-3), było to
   * bezkosztowe; od CR-3 działa.
   *
   * Po zmianie: **36,3% przeciw 30,2% skóry — +6,1 pkt proc.**, różnica, którą
   * da się odczuć.
   *
   * ⚠ **SUFIT tej liczby wyznacza PRZESZYWANICA, i to jest jedyna rzecz, której
   * tu nie wolno przekroczyć.** Zestaw przeszywanica + skóra daje przeciw
   * obuchowi **37,6% za 85 g**; pełna stal kosztuje 240 g. Dopóki stal zostaje
   * PONIŻEJ tej liczby, przeszywanica zachowuje powód istnienia — jest tanią,
   * właściwą odpowiedzią na obuch, a stal drogą i niewłaściwą. Przy 0,55 stal
   * wychodzi na 38,5% i **kasuje przeszywanicę**, czyli przedmiot dodany
   * dokładnie po to, żeby obuch miał jakąkolwiek odpowiedź. 0,50 to najwyższa
   * wartość, która tego nie robi.
   *
   * Stal nadal ma tu swoją najgorszą kolumnę (36,3% przy 61,5% na cięcie), więc
   * „metal przenosi wstrząs" zostaje czytelne — przestało tylko być nieodróżnialne
   * od chodzenia w skórze.
   *
   * ⚠ Żaden przeciwnik nie nosi `metal` (jedyny opancerzony to dzik, `leather`),
   * więc ta zmiana dotyka **wyłącznie** kierunku wróg → gracz.
   *
   * ⚠ Nadal bez pokrycia w prawdziwych walkach: 0,45 skóry i 22 pkt dzika.
   * Patrz `docs/systemy/armor.md`
   */
  metal: { slash: 1.4, pierce: 1.15, blunt: 0.5 },
  /**
   * PRZESZYWANICA — trzeci materiał, dodany 2026-08-14 razem z `gambeson`.
   *
   * Liczby są historyczne, nie dobrane pod mechanikę, i każda ma powód:
   *  - `slash` **1,2** — kilkanaście warstw zszytego lnu naprawdę dobrze
   *    trzyma cięcie, lepiej niż skóra, gorzej niż płyta.
   *  - `pierce` **0,35** — klasyczna słabość i najniższa wartość w całej
   *    tabeli: wąski grot rozpycha włókna zamiast je przecinać. To jest
   *    dokładnie powód, dla którego kolczugę nosiło się NA przeszywanicy.
   *  - `blunt` **1,1** — przeszywanica to dosłownie amortyzacja i dlatego
   *    nosiło się ją POD płytą. Najlepsza ochrona przed obuchem w grze.
   *
   * ⚠ **Co to realnie zmienia: obuch po raz pierwszy ma odpowiedź.** Do
   * powstania przeszywanicy nie miał żadnej — stal jest przeciw niemu
   * najgorsza (0,40), a skóra przeciętna (0,8). Gracz nie mógł się przed tym
   * ubrać; teraz może.
   *
   * ⚠ **Zdanie „obuchem biją dzik i niedźwiedź" było tu prawdziwe do
   * 2026-08-17 i już nie jest.** Niedźwiedź został przełączony na `slash`
   * (patrz `BEAR.touchDamageType`), więc obuch został **wyłącznie u dzika** —
   * kontakt i szarża. Przeszywanica dalej jest jedyną dobrą odpowiedzią na ten
   * typ i dalej jest bez bramki Siły, ale odpowiada dziś na jedno stworzenie,
   * nie na dwa. Jeżeli to okaże się zbyt wąskie, właściwą naprawą jest dać
   * obuch nowemu stworzeniu, a nie cofać niedźwiedzia ani ruszać tych liczb.
   *
   * ⚠ **To NIE domyka trójkąta i nie udawajmy, że domyka.** Najlepszą
   * odpowiedzią na przeszywanicę jest `pierce` (0,35) — tak samo jak na
   * skórę (0,45). `slash` dalej nie jest najlepszy przeciw NICZEMU i wciąż
   * płaci za to najwyższymi surowymi obrażeniami. Domknięcie trójkąta
   * wymagałoby materiału, przeciw któremu najlepsze jest cięcie, a
   * przeszywanica nim historycznie nie jest.
   *
   * ⚠ **To NIE jest też zaparkowany „trzeci typ ochrony".** Tamten wpis w
   * `docs/odlozone.md` dotyczy CHITYNY po stronie przeciwników (pająki) i
   * zostaje zaparkowany. Tu chodzi o materiał noszony przez GRACZA.
   *
   * ⚠ **Nie naprawia SAMA anomalii `metal.blunt` — ale ta anomalia została
   * naprawiona osobno, tego samego dnia (2026-08-17), w `metal`.** Stal
   * przeciw obuchowi dawała ~1 pkt proc. więcej niż skóra za czterokrotną
   * cenę; po podniesieniu `metal.blunt` do 0,50 daje 36,3% vs 30,2% skóry —
   * a SUFITEM tej liczby zostaje właśnie ten komplet przeszywanica+skóra
   * (37,6% za 85 g, patrz komentarz przy `metal`). Przeszywanica więc nie
   * naprawiła anomalii, ale wyznaczyła jej granicę.
   */
  padded: { slash: 1.2, pierce: 0.35, blunt: 1.1 },
  /**
   * KOLCZUGA — czwarty materiał, dodany 2026-08-17 razem z kompletem kolczym.
   * Zero nowej grafiki: cztery sztuki leżały gotowe w `items.png`.
   *
   * Liczby są historyczne, nie dobrane pod mechanikę, i każda ma powód:
   *  - `slash` **1,80** — NAJWYŻSZA wartość w całej tabeli, wyraźnie wyżej niż
   *    płyta (1,4). Nitowana kolczuga jest praktycznie odporna na cięcie:
   *    ostrze nie przerywa pierścieni, tylko grzęźnie. To jedyna przewaga
   *    kolczugi nad płytą i powód, dla którego przetrwała tysiąc lat.
   *
   *    ⚠ **Ten margines nad stalą jest WYMUSZONY, nie ozdobny, i pierwsza
   *    wersja go nie miała.** Przy 1,55 stalowy napierśnik wychodził lepszy od
   *    kolczugi na WSZYSTKICH trzech typach naraz (pkt skuteczne: cięcie 30,8
   *    vs 27,9, grot 25,3 vs 12,6, obuch 8,8 vs 6,3) — bo ma 22 pkt przeciw 18.
   *    Kolczuga nie byłaby wtedy najlepsza przeciw NICZEMU, nawet gdyby
   *    cięcie w tej grze kiedyś zaistniało, czyli jej jedyna historyczna
   *    zaleta byłaby liczbą bez pokrycia. Zmierzone testem dominacji, nie
   *    wywnioskowane. Przy 1,80 kolczuga wygrywa kolumnę cięcia (napierśnik
   *    39,3% vs 38,1%) i przestaje być wypierana.
   *  - `pierce` **0,70** — klasyczna słabość, ale ŚRODEK tabeli, nie dół:
   *    wąski grot rozrywa pierścień, tyle że najpierw musi go rozerwać.
   *    Wyraźnie lepiej niż skóra (0,45) i przeszywanica (0,35).
   *  - `blunt` **0,35** — NAJGORSZA w grze, poniżej płyty (0,50). Kolczuga
   *    leży na ciele i przepuszcza cały wstrząs; dokładnie dlatego nosiło się
   *    ją NA przeszywanicy, która jest tu najlepsza (1,1). Ta para domyka się
   *    sama i nie trzeba jej nigdzie kodować.
   *
   * ⚠ **Ta kolumna działa na dokładnie JEDNEGO przeciwnika i trzeba wiedzieć
   * na którego: niedźwiedzia.** Wrogowie mają siedem czynnych kanałów
   * obrażeń: `pierce` ×4 (wilk, Szary kontakt + ukąszenie, skoczek jadowity),
   * `blunt` ×2 (dzik kontakt + szarża), **`slash` ×1 (niedźwiedź)** i cztery
   * świadomie bez typu (królik, sieciarz, sieć, kontakt skoczka).
   *
   * Przy dodawaniu kolczugi cięcia nie zadawał NIKT, więc ta kolumna była
   * czystym zapasem — dokładnie tak, jak poziomy jakości 5-7 istnieją w
   * modelu, a nie są w obiegu. Autor odblokował ją zaraz potem jednym polem
   * (`BEAR.touchDamageType`, patrz uzasadnienie tam: niedźwiedź bije łapą z
   * pazurami, nie taranuje jak dzik). Skutek jest taki, że **kolczuga jest
   * odpowiedzią na najtrudniejszego respawnującego się wroga w grze**, a wybór
   * pancerza ma po raz pierwszy trzy różne prawidłowe odpowiedzi zamiast dwóch.
   *
   * ⚠ Cena tej zmiany, zapisana tutaj, bo widać ją dopiero z tej tabeli:
   * **obuch zszedł na jednego przeciwnika (dzika)**, więc przeszywanica
   * odpowiada teraz na jedno stworzenie, nie na dwa. Nie straciła racji bytu
   * (nadal jedyna dobra odpowiedź na obuch, nadal bez bramki Siły), ale jeśli
   * okaże się zbyt wąska, tańszą naprawą jest **dać obuch nowemu stworzeniu**
   * niż cofać niedźwiedzia.
   *
   * ⚠ **Czym kolczuga jest DZIŚ: średnim szczeblem przeciw `pierce` dla
   * postaci, której nie stać na płytę.** Stalowy napierśnik stoi za Siłą 4 —
   * najwyższą bramką w grze — więc poniżej niej najlepszą odpowiedzią na wilki
   * i skoczki był kaftan (8,3%) albo przeszywanica (9,5%). Kolczuga daje 20,1%
   * przy Sile 3. To ta sama dziura i ta sama logika, dla której powstała
   * przeszywanica, tylko na drugiej osi.
   *
   * ⚠ **Te 20,1% przy Sile 3 dotyczą egzemplarza NOMINALNEGO (Zwykła), a nie
   * tego, co dziś leży na półce.** Jedyny sprzedawca kolczugi to Radzim ze
   * `stockQuality.armor` [1, 2], a `QUALITY.modifiers.requirement` dokłada +1
   * na tych poziomach — więc kupiona kolczuga wymaga Siły **4**, a stalowy
   * napierśnik obok niej **5**. Odstęp dwóch szczebli zostaje zachowany i
   * cała półka jest przesunięta tak samo, więc jest to spójne, a nie zepsute;
   * ale „średni szczebel poniżej Siły 4" realizuje się w pełni dopiero przy
   * lepszym źródle (nagroda za zadanie, inny kupiec). Gdyby ta nisza miała
   * gryźć od razu, zejść z bazowym `requires` kolczugi z 3 na 2 — to jedno
   * pole i decyzja autora, nie poprawka.
   *
   * ⚠ **NIE domyka trójkąta — pogłębia jego przechył.** `slash` nadal nie jest
   * najlepszy przeciw niczemu, a od teraz istnieje materiał, przeciw któremu
   * jest najgorszy. Rekompensata cięcia (najwyższe surowe obrażenia w
   * drabince) zostaje bez zmian.
   *
   * ⚠ **Skóra jest przeciw obuchowi LEPSZA od kolczugi** (pełne komplety:
   * 30,2% vs 24,4%) i to jest zamierzone. Nowy materiał nie wypiera po cichu
   * żadnego starego: przed grotem lepsza jest stal, przed obuchem
   * przeszywanica, a najtaniej i bez bramki dalej ubiera skóra.
   */
  mail: { slash: 1.8, pierce: 0.7, blunt: 0.35 },
} as const;

/**
 * ── TOŻSAMOŚĆ RODZINY BRONI ────────────────────────────────────────────────
 *
 * Jedna oś mechaniki wspólna dla WSZYSTKICH modeli rodziny. To jest jedyne
 * miejsce, w którym te osie mieszkają; składa je `Progression`, tą samą drogą,
 * którą składa warianty ataku i drugą rękę. **Nie ma drugiego resolvera** —
 * `GameScene`, `Player` i `Enemy` o rodzinach nie wiedzą.
 *
 * ```
 * RODZINA      = tożsamość archetypu   (ta tabela)
 * MODEL        = parametry/konstrukcja (ITEMS[*]: damage, tempo, zasięg, root, hands, requires, attacks)
 * DAMAGE TYPE  = rodzaj obrażeń        (AttackVariant.damageType)
 * HANDS        = własność przedmiotu   (ITEMS[*].hands)
 * QUALITY      = jakość wykonania      (ItemInstance.quality)
 * ```
 *
 * ⚠ **Po co to istnieje:** żeby dziesięć przyszłych mieczy dziedziczyło oś
 * miecza bez kopiowania mechaniki do każdego z nich. Model dalej różnicuje
 * wszystko inne — dwa miecze tej samej rodziny mogą mieć inny zasięg, tempo,
 * root, `hands`, wymagania i warianty.
 *
 * ⚠ **Rodzina nie jest wyprowadzana z `damageType` ani z `hands`** — patrz
 * `WeaponFamily` w `core/Equipment.ts`, gdzie stoją trzy rozdziały, których
 * nie wolno zlać. Najostrzejszy skutek: wariant **Obuch** siekiery jest
 * `blunt`, a siekiera należy do `axe` — więc NIE dostaje osi obuchowej.
 * Inaczej wariant przyznawałby zdolność, czego zabrania REGUŁA ZAWĘŻANIA.
 *
 * ⚠ **Pola są opcjonalne i to jest cała reguła bezpieczeństwa.** Rodzina bez
 * pola mechanicznego (dziś `dagger` i `polearm`) niczego nie zmienia —
 * jej tożsamość jest już dostarczona parametrami modelu. Rodzina to
 * klasyfikacja, nie obowiązek posiadania bonusu.
 */
export const WEAPON_FAMILY = {
  /**
   * MIECZ — oś: **Parry**. ⚠ **Nic tu jeszcze nie działa i tak ma być.**
   *
   * Parry nie istnieje jako system, więc `parryBonus` jest **zadeklarowanym
   * zaczepem, którego dziś NIKT NIE CZYTA** — świadomie, na wyraźną decyzję:
   * tożsamość rodziny ma być zapisana, zanim powstanie CR Parry, żeby nie
   * została wtedy wymyślona od zera.
   *
   * ⚠ **Nie wolno zastąpić tego efektem zastępczym** (best-of-2, krytyk,
   * tempo, obrażenia). Rodzina miecza ma dziś tożsamość dostarczaną modelem —
   * jest jedyną, która niesie wybór wariantu (`slash`/`pierce`) — i to
   * wystarcza do czasu Parry.
   *
   * ⚠ To NIE łamie niezmiennika N-13 („nowy slot dopiero, gdy jest czym go
   * wypełnić"): tamten mówi o slotach ekwipunku, które są iterowane przez
   * `sumBonus`, zapisywane w każdym save i odpytywane przez `accepts`. Stała
   * w tabeli konfiguracyjnej nie jest iterowana, zapisywana ani odpytywana.
   */
  sword: {
    label: "Miecz",
    identity: "parry",
    /**
     * ⚠⚠ **ZNACZNIK, nie liczba — zmiana 2026-09-16.** Do tej daty stało tu
     * `{ kind: "parryBonus", value: 0.15 }`, czyli **premia parowania należała
     * do RODZINY** i spływała na każdy przyszły miecz automatycznie. Przy
     * jednej konstrukcji było to niewidoczne; przy kordzie, tasaku, szabli,
     * rapierze, bastardzie i dwuręcznym oznaczałoby, że rapier nie ma jak być
     * lepszym parrierem od tasaka.
     *
     * ⭐ Liczba mieszka dziś w `ITEMS[*].melee.parryBonus` — dokładnie tak, jak
     * zasięg włóczni mieszka w jej modelu, a rodzina `polearm` niesie sam
     * znacznik `reach`. **Ani jedna liczba się nie zmieniła**: miecz i krótki
     * miecz deklarują 0,15 u siebie.
     *
     * ⚠ Znacznik jest nośny, nie ozdobny: czyta go `MasteryCard`, żeby
     * powiedzieć, że ranga w tej rodzinie podnosi **paradę**, a nie krytyk
     * ani zachwianie. `Progression.parryChance` dalej mnoży EFEKT przez
     * `traitMul` rangi.
     */
    traits: [{ kind: "parry" }],
  },
  /**
   * TOPÓR/SIEKIERA — oś: **mocniejszy krytyk**. Rodzina jedna, nie dwie:
   * toporek, siekiera i każdy przyszły topór bojowy dzielą tę oś.
   *
   * Rozdział, który to realizuje:
   *   **Szansa na krytyka → `Progression.critChance`** — `PLAYER.critChance`
   *     (0,15) + premie SPRZĘTU i BRONI, sufit `ATTRIBUTES.maxCritChance`
   *   **Rodzina Axe → JAK MOCNO boli krytyk** (to pole)
   *
   * ⚠ **Do 2026-09-05 pierwsza linijka brzmiała „Zręczność → jak często
   * krytykujesz (`ATTRIBUTES.critChancePerAgility`)". To pole NIE ISTNIEJE** —
   * krytyk został świadomie odpięty od atrybutu (decyzja autora, potwierdzona
   * 2026-09-05; zapis: `docs/atrybuty.md` §11.4). **Oś rodziny działa bez
   * zmian** — zmieniło się tylko to, skąd bierze się druga połowa rozdziału:
   * ze sprzętu i broni zamiast z rozwoju postaci. ⛔ Nie przywracaj tego pola.
   *
   * ⚠ **Dodaje się do `PLAYER.critMultiplier`, NIE do szansy.** Szansa ma
   * swój cap (`maxCritChance`), siła krytyka nie ma i mieć nie musi — to nie
   * ona rwie animację.
   *
   * ⚠ **Składa się z premią BRONI, nie zastępuje jej.** Sztylet ma własne
   * `critMultiplierBonus` na `melee` (premia konkretnej broni) i zostaje
   * nietknięty — rodzina dokłada się osobno, więc przyszły „sztylet z rodziny
   * dagger" i „topór z rodziny axe" liczą się tą samą ścieżką bez wyjątków.
   *
   * **0,25 jest WYMUSZONE pomiarem, nie dobrane do gustu.** Krytyk 1,80 →
   * 2,05, czyli **+3,3% obrażeń przy Zręczności 0** i **+10,1% przy capie
   * krytyka (60%, od Zręczności 75)**.
   *
   * ⚠ **Sufit wyznacza moment, w którym siekiera przeskakuje MŁOTA.** Młot
   * kosztuje 280 g i Siłę 6 — najdroższa i najciężej bramkowana broń w grze —
   * a projekt raz już naprawiał to, że najdroższy zakup był słabszy od
   * tańszego (patrz komentarz przy `hammer.damageMin`). Zmierzone progi:
   *
   * ```
   *   +0,20  →  siekiera NIGDY nie wyprzedza młota
   *   +0,25  →  wyprzedza od Zręczności 59      ← wybrane
   *   +0,30  →  od Zręczności 41
   *   +0,35  →  od Zręczności 29   ⚠ w zasięgu realnej gry (obserwowany lvl 27)
   *   +0,50  →  od Zręczności 10
   * ```
   *
   * 0,25 jest najwyższą wartością, przy której inwersja leży **poza realnym
   * zasięgiem rozgrywki**: 59 punktów w jednej cesze to ~59 poziom, przy
   * zaobserwowanym 27. Wyżej drabinka cen przestaje śledzić moc w grze, w
   * którą ktoś naprawdę gra.
   *
   * ⚠ Gdyby krzywa XP kiedyś została naprawiona (`docs/odlozone.md` §1) i
   * poziom 59 stał się osiągalny, **ten próg trzeba przeliczyć na nowo** —
   * jest wyprowadzony z zasięgu rozgrywki, a nie z samej mechaniki.
   */
  axe: {
    label: "Topór",
    identity: "critical_strength",
    traits: [{ kind: "critMultiplierBonus", value: 0.25 }],
  },
  /**
   * OBUCHOWE — oś: **mała naturalna skłonność do zachwiania**.
   *
   * ⚠ **To NIE jest proc i nie wolno go w proc zamienić.** Każde trafienie
   * bronią z tej rodziny zawiesza na chwilę uchwyt AI na ciele przeciwnika.
   * Efekt losowy odpadł z pomiaru: zwykła walka trwa **2–5 ciosów**, więc
   * szansa 10% nie zadziałałaby ani razu w 74–84% walk — dokładnie ten sam
   * rachunek, którym `docs/systemy/shields.md` odrzuciło `blockChance`.
   *
   * ⚠ **To NIE jest `interrupts` i nie zastępuje go.** Przerwanie kasuje
   * przeciwnikowi ZAMACH i zostaje własnością konkretnych broni (dziś tylko
   * młot). Zachwianie rusza wyłącznie ruch: `Enemy.stagger()` przedłuża to samo
   * okno, którym od dawna rządzi odrzut, i **niczego nie przerywa** — fazy
   * ataku (szarża dzika, ukąszenie Szarego) nadpisują je same, tak jak
   * nadpisują odrzut.
   *
   * **50 ms przeciw 180 ms odrzutu młota** (`COMBAT_FEEDBACK.knockbackDurationMs`)
   * — niecałe 8% cyklu młota. Zamierzenie jest takie, żeby pojedynczy cios był
   * ledwie wyczuwalny, a różnica narastała w długich walkach, gdzie ciosów jest
   * 10+ (Szary, niedźwiedź, dzik) — bez licznika i bez nowego stanu.
   *
   * ⚠ **Dziś nosi to JEDNA broń — młot — i widać to prawie wyłącznie na
   * papierze**, bo młot ma już odrzut, który zawiesza AI na 180 ms; `stagger`
   * bierze `Math.max`, więc na młocie nie zmienia praktycznie nic. Oś zaczyna
   * pracować dopiero przy obuchowej broni BEZ odrzutu (planowana maczuga).
   * To jest świadome: fundament wchodzi przed wariantami, nie po nich.
   */
  blunt: {
    label: "Obuchowe",
    identity: "stagger",
    traits: [{ kind: "staggerMs", value: 50 }],
  },
  /**
   * SZTYLET — oś: **precyzja, wyrażona jako SIŁA krytyka**.
   *
   * ⚠ **Przeniesione z przedmiotu 2026-08-24 (Weapon System V1, porządek
   * architektoniczny — audyt broni wykazał, że sztylet i włócznia były jedyną
   * parą rodzin, których tożsamość żyła wyłącznie na pojedynczym przedmiocie
   * i w komentarzu, nie w danych rodziny — dokładnie jak miecz/topór/obuch
   * już to robiły).** Zero zmiany liczby: `ITEMS.dagger.melee` miało
   * `critMultiplierBonus: 0.2` wpisane wprost, teraz to pole stoi TU, a
   * `Progression.critMultiplier` i tak już czytało rodzinę generycznie
   * (`"critMultiplierBonus" in f`) — dokładnie ten sam mechanizm, który już
   * obsługiwał topór. Przyszły drugi sztylet dziedziczy tę premię automatycznie.
   *
   * ⚠ **Szansa na krytyka (`critChanceBonus`) CELOWO zostaje na przedmiocie,
   * nie tutaj.** To nie jest przeoczenie tego porządkowania — to jest inny,
   * starszy niezmiennik (`Progression.critChance`, 2026-08-20): „rodzina
   * dokłada się do SIŁY krytyka, nigdy do szansy" — szansa ma wspólny sufit
   * z Zręcznością i sprzętem, siła jest osią archetypu. Przenosząc premię do
   * szansy tutaj, złamałoby się TEN niezmiennik zamiast naprawić poprzedni.
   *
   * Reszta tożsamości sztyletu (`pierce`, cykl 450 ms, zasięg 56) zostaje
   * parametrem MODELU, nie rodziny — z tego samego powodu co zasięg włóczni:
   * to są liczby jednego przedmiotu, nie mnożnik, który miałby czym skalować
   * drugi egzemplarz. Rodzina niesie też miejsce pod przyszłe systemy
   * precyzji: Dodge, Parry, ataki od tyłu.
   */
  dagger: {
    label: "Sztylet",
    identity: "precision",
    traits: [{ kind: "critMultiplierBonus", value: 0.2 }],
  },
  /**
   * DRZEWCOWE — oś: **zasięg**. Świadomie **bez pola mechanicznego** —
   * i to jest teraz jedyny UDOKUMENTOWANY WYJĄTEK od zasady „tożsamość rodziny
   * mieszka w `WEAPON_FAMILY`" (Weapon System V1, 2026-08-24 — audyt broni
   * kazał przenieść tożsamość sztyletu i włóczni z pojedynczego przedmiotu na
   * poziom rodziny; sztylet się przeniósł, patrz `WEAPON_FAMILY.dagger`,
   * włócznia — CELOWO NIE, z poniższego powodu, ważniejszego niż spójność).
   *
   * ⚠ **Zasięg jest i zostaje parametrem MODELU** (`melee.reach`), a nie
   * liczbą doklejaną przez rodzinę. Powód jest zmierzony: zasięg działa
   * progowo, nie stopniowo — trafialność orbity wilka skacze z 22,2% na 97,1%
   * cyklu między zasięgiem 78 a 79 px (`docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`; dla
   * konkretnie włóczni, przy jej realnym zasięgu 98 vs `WOLF.pack.
   * circleRadius` 96, próg leży między 95 a 96 — patrz `ITEMS.spear`).
   * Rodzinny MNOŻNIK do zasięgu przenosiłby modele przez ten próg przypadkiem
   * — to jest silniejszy powód niż „dla spójności z toporem/sztyletem", więc
   * przegrywa spójność, nie pomiar.
   *
   * Rodzina niesie więc wyłącznie obietnicę: **wszystko, co drzewcowe, sięga
   * dalej niż reszta** — każdy przyszły egzemplarz musi tę liczbę wybrać
   * SAMODZIELNIE i empirycznie (zmierzyć przeciw realnym wrogom), nie
   * odziedziczyć jej automatycznie — a różnicują się `hands`, tempem, rootem
   * i wariantami.
   *
   * ⚠ **Bez AoE.** Zamach po łuku należy do umiejętności (Szerokie cięcie),
   * nie do broni — patrz `ABILITIES.cleave`.
   */
  polearm: {
    label: "Drzewcowe",
    identity: "reach",
    /**
     * ⚠ **Znacznik BEZ wartości i to jest poprawna deklaracja, nie brak
     * danych.** Tożsamością włóczni jest zasięg, a liczba zasięgu mieszka
     * w MODELU broni (`ITEMS.spear.melee.reach`), nie w rodzinie. Do
     * 2026-09-03 rodzina nie miała jak tego powiedzieć i wyglądała na wpis
     * z brakującym polem — patrz `core/WeaponTraits.ts`.
     *
     * ⛔ **To NIE odblokowuje ładunków M-II/M-IV włóczni** (D3, §14
     * checkpointu): mnożnik rangi mnoży EFEKT cechy, a ta cecha nie niesie
     * efektu do pomnożenia. Decyzja bez zmian.
     */
    traits: [{ kind: "reach" }],
  },
} as const;

export const EQUIPMENT = {
  defenseK: 50,
  maxDefenseReduction: 0.75,
  /**
   * Durability — a property of a concrete ITEM INSTANCE, not of its type. See
   * QUALITY below for what sets the maximum, and `docs/jakosc_wykonania.md` for
   * the accepted scope of this system.
   */
  durability: {
    /**
     * Chance (0..1) that one swing costs durability, and how much it costs.
     *
     * ⚠ **Rolled once per SWING, never once per enemy hit.** The axe hits 5 of 5
     * targets with a single 100° cut (measured) and Wir ostrzy resolves against
     * everything in range within one frame, so a per-target roll would wear a
     * wide weapon five times faster than a narrow one on the same group — and,
     * because Zręczność reaches +60% attack speed, would wear out the build that
     * deals the LEAST damage per blow the fastest. Backwards from the fiction
     * and backwards from the balance. This is the same trap `AUDIO.
     * minRetriggerMs` and `COMBAT_FEEDBACK.critHitStop.minGapMs` already exist
     * to avoid; see `Player.attack`.
     */
    wearChance: 0.15,
    wearAmount: 1,
    /**
     * What a broken item still does, as a multiplier on its damage/defense.
     *
     * **"Zniszczona" is a STATE, not a quality level** — a Mistrzowski sword at
     * 0 durability is a broken Mistrzowski sword, keeps its quality, and is
     * repairable the day a repair mechanic exists. It is never destroyed and
     * never silently removed: this project does not take back things the player
     * paid for (quest items can't be sold out from under a quest, a full
     * backpack refuses a plant rather than wasting it, gear sales are confirmed).
     */
    destroyedMultiplier: 0.5,
    /**
     * Minimal repair stopgap (2026-08-12): wear was already live in combat
     * with no way to reverse it, which meant every weapon eventually settled
     * permanently at `destroyedMultiplier`. This is deliberately NOT a
     * crafting system — no materials, no per-smith skill check, just gold —
     * see `ShopPanel.repairEquipped`/`canRepairHere` and
     * `docs/jakosc_wykonania.md` §5.2 (still open: whether repair should ever
     * be gated by who's doing it).
     *
     * A full repair (from 0 durability) costs this fraction of the item's
     * CURRENT buy price (quality-scaled); a lightly worn weapon costs
     * proportionally less. Below 1 so repairing is always cheaper than buying
     * new outright — there would be no reason to ever repair otherwise.
     */
    repairPriceFraction: 0.5,
  },
} as const;

/**
 * **Blok kierunkowy** — mechanika tarczy. Pełna analiza, cztery gry
 * porównawcze i każdy pomiar: `docs/systemy/shields.md` (werdykt GO, §7 model,
 * §A.8 liczby, §B.14 zakres).
 *
 * > Tarcza chroni cię przed tym, na co patrzysz. Nie robi nic z tym, co jest
 * > za tobą.
 *
 * ⚠ **Kąt stoi TUTAJ, a nie na przedmiocie, i to jest decyzja projektowa.**
 * Warunek („czy zdążyłem podstawić") jest mechaniką, a nie własnością
 * egzemplarza — tarcze różnią się redukcją, karą tempa i wymaganiem, nigdy
 * kątem. Dwa skutki, oba zamierzone: nie dokładamy parametru, którego gracz
 * przy czterokierunkowym zwrocie i tak nie odczyta, a przyszłe „Raise Shield"
 * jest **chwilową zmianą tej jednej stałej** zamiast przebudowy przedmiotu
 * (§B.9 — zero nowych pól, zero migracji zapisu, zero retuningu tarcz).
 *
 * ⚠ **Żadnych kości.** Cała obrona w tej grze jest deterministyczna (pancerz
 * liczy się wzorem, i-frames Uniku dają 100%, telegrafy są stałe co do
 * milisekundy), a kości leżą po stronie ofensywy, gdzie wariancja bawi.
 * Powód jest jednak twardszy od estetyki i jest zmierzony: w tej grze gracz
 * przyjmuje **1–4 ciosy na walkę** (królik ~1, wilk ~2, niedźwiedź ~3,
 * dzik ~4; jedyny wyjątek to Szary ~10). Rzut 30% przy dwóch próbach to nie
 * jest „30% redukcji", tylko moneta rzucana raz na walkę — nie robi nic
 * w połowie starć z wilkiem (§A.2).
 */
export const SHIELD = {
  /**
   * Połowa kąta osłony, w stopniach, liczona od kierunku, w który zwrócony
   * jest SPRITE. 90 = przednia połowa.
   *
   * ⚠ „Kierunek, który widać na postaci" to kąt CIOSU w czasie pozy ataku
   * i ZWROT poza nią (`Player.guardKat`) — decyzja autora (2026-08-15), podjęta przed
   * implementacją, bo `docs/systemy/shields.md`/§A.9.1/§B.13.1 nazywa ją
   * jedynym ryzykiem, które kładzie cały model. Uzasadnienie: gracz sądzi po
   * tym, co widzi, a okno pozy pokrywa się z ukorzenieniem, więc postać
   * patrzy w cel i tarcza kryje dokładnie to okno, w którym gracz jest
   * najbardziej bezbronny — z powodu własnego zobowiązania. **Tarcza jest
   * odpowiedzią na twój własny root.**
   * ⚠ **Pokrywa się, nie RÓWNA** (`OI-32`, poprawione 2026-10-09; do tej daty
   * stało tu „`rootedUntil` ustawiane równo `attackPoseUntil`" — stan sprzed
   * 2026-08-20). Równość zachodzi tylko przy Zręczności 0 bez zmęczenia:
   * Zręczność skraca root względem pozy, zmęczenie go wydłuża
   * (`Progression.rootDurationMs`). ⚙ Od `OI-146` (2026-10-09) cios na
   * stojąco zostawia zwrot na celu, więc po końcu pozy osłona i tak nie
   * odjeżdża, dopóki gracz nie ruszy drążkiem.
   *
   * Znany koszt tej decyzji: biegnąc w prawo i bijąc w górę przerzucasz
   * osłonę kilka razy na sekundę. Jeśli playtest pokaże, że czyta się to jako
   * losowe — to jest pierwsza rzecz do zmiany, nie liczby tarcz.
   */
  blockArcDeg: FRONT_ARC_DEG,

  /* ── TRZY STREFY OSŁONY (2026-09-05) ───────────────────────────────────
     Do tej daty blok był binarny: `κ < blockArcDeg` dawało PEŁNĄ redukcję,
     wszystko dalej zero. Trzy strefy: 120° pełnego bloku + 40° osłabionego po
     każdej stronie = 200° łącznego sektora reakcji.

     ⚠⚠ **`blockArcDeg` PRZESTAŁO być zewnętrzną granicą bloku i to jest
     ŚWIADOMY rozdział, nie przeoczenie.** Komentarz przy `FRONT_ARC_DEG` żąda,
     żeby rozejście atak ↔ blok nastąpiło świadomie — dwie stałe i dwa
     uzasadnienia. Oto one:

       • `blockArcDeg` (90°) — **przednia półkula**. Współdzielona z bramką
         zwrotu ataku (`PLAYER.attackFrontArcDeg`) i z PAROWANIEM. Nietknięta.
         Reguła „trafiasz to, co mógłbyś zablokować" i Parowanie zostają
         dokładnie tam, gdzie były; §L nadal pilnuje ich równości.
       • `sideArcDeg` (100°) — **zewnętrzna granica TARCZY**. Wychodzi poza
         półkulę o 10°, bo blok boczny odpowiada na INNE pytanie niż atak: nie
         „czy mogę to trafić", tylko „czy zdążę tam podstawić tarczę".

     ⚠ To jest model GAMEPLAYOWY inspirowany szerokim polem widzenia człowieka,
     **nie odwzorowanie anatomii**. Gracz widzi atak z boku i zdąży zareagować,
     ale tarcza nie jest wtedy ustawiona optymalnie.

     ⚠ **Dług nazewniczy, świadomie niespłacony:** `blockArcDeg` nazywa dziś
     półkulę, a nie łuk bloku. Przemianowanie dotyka §L, `PLAYER`,
     `core/CLAUDE.md`, `ui/CLAUDE.md` i sześciu dokumentów — to osobna
     przeprowadzka, nie zmiana przy okazji. */

  /**
   * Półkąt strefy PEŁNEJ skuteczności bloku. 60 = 120° pełnego sektora.
   *
   * ⚠ **Świadomie NIE rośnie ponad 120°.** Pozycjonowanie ma zachować realną
   * wartość; tarcza chroniąca prawie całe otoczenie zrobiłaby z `1H + tarcza`
   * bezwarunkowo najlepszą konfigurację obronną i skasowała decyzję, o którą
   * w tej walce chodzi.
   */
  fullArcDeg: 60,

  /**
   * Półkąt ZEWNĘTRZNEJ granicy tarczy. 100 = 200° sektora reakcji, czyli 40°
   * pasa osłabionego po każdej stronie.
   *
   * ⚠ Niezmiennik `fullArcDeg ≤ sideArcDeg` (oraz `fullArcDeg ≤ blockArcDeg`)
   * pilnuje §L w `tools/combat_regresja.mjs`. Sama `guardZone` wymusza go
   * dodatkowo STRUKTURALNIE — pas boczny jest RÓŻNICĄ dwóch zagnieżdżonych
   * testów, więc nie potrafi być szerszy od zewnętrznego.
   */
  sideArcDeg: 100,

  /**
   * Mnożnik na `BlockSpec.reduction` w pasie bocznym (1 = brak kary).
   *
   * ⚠⚠ **WARTOŚĆ PLAYTESTOWA, nie balans** (2026-09-05). 0,4 / 0,5 / 0,6 nie
   * było porównywane i świadomie nie jest — 0,50 wchodzi po to, żeby dało się
   * w to ZAGRAĆ. Nie strój tej liczby, zanim ktoś w to nie zagra.
   *
   * ⚠ **Blok boczny nie potrzebuje ŻADNEJ dodatkowej kary za wysiłek** i to
   * wychodzi samo: `Stamina.hitCost` liczy się od `mitigated`, więc słabsza
   * mitygacja już kosztuje więcej staminy, a płaska stawka tarczy zostaje ta
   * sama. Dołożenie tu drugiej kary byłoby policzeniem tego samego dwa razy.
   */
  sideZoneMul: 0.5,

  /**
   * **CIĘŻAR BLOKU — `T-7`, 2026-09-15.** Ile kosztuje zasłonięcie się i jak
   * dobrze tarcza znosi KONKRETNY cios.
   *
   * > ⭐⭐ **Zasada, z której wynika cały ten blok: blok jest ZDARZENIEM
   * > O CIĘŻARZE, nie opłatą za stan „mam tarczę".**
   *
   * Do 2026-09-15 blok kosztował **stałą liczbę punktów per tarcza** (puklerz
   * 3, tarcza okuta 5) — identycznie za draśnięcie królika (1 pkt) i za szarżę
   * dzika (22 pkt). ⚠ To była jedyna wielkość w całym łańcuchu obrony, która
   * **nie zależała od tego, co się właśnie stało**: `Stamina.hitCost` liczy się
   * od `mitigated`, `impactTier` od `mitigated`, zużycie broni od zamachu —
   * a tarcza brała ryczałt.
   *
   * ⚠ **Nie ma tu ani jednego nowego pola na PRZEDMIOCIE.** Wszystko jest
   * wyprowadzone z tego, co katalog już niesie: **masa** (materiał × grubość),
   * `QUALITY.modifiers.defense` (jakość wykonania) i `conditionMul` (stan).
   * ⛔ To jest warunek, pod którym ten zakres nie otwiera `Variant` ani
   * `Construction` — patrz `docs/tarcze_checkpoint.md` §1.2.
   *
   * ⚠ **Masa działa tu w DWIE strony i to jest cała tożsamość konstrukcji:**
   * ciężka tarcza ma wysoki rdzeń (`BlockSpec.staminaCost`) i **niski koszt za
   * punkt** (cios idzie w ramę), lekka odwrotnie (cios idzie w rękę). Puklerz
   * jest więc tani na lekkie ciosy i drogi na ciężkie; tarcza okuta odwrotnie.
   * ⭐ **Wychodzi to z jednej liczby — masy — a nie z tabeli per konstrukcja.**
   */
  block: {
    /**
     * **Ile punktów ciosu tarcza znosi bez przeciążenia** (`udźwig bloku`):
     * `(capacityBase + capacityPerKg × kg) × jakość × stan`.
     *
     * Dziś: puklerz 1,5 kg → **6,5 pkt**, tarcza okuta 5 kg → **17,0 pkt**
     * (przy Q3, całe). ⚠ Skala celowo ustawiona tak, żeby puklerz był
     * przeciążany przez ciosy, które tarcza okuta przyjmuje czysto — inaczej
     * cała oś nic nie mówi na dzisiejszym rosterze (dzik bije 22).
     */
    capacityBase: 2,
    capacityPerKg: 3,

    /**
     * Ile z NADWYŻKI ponad udźwig tarcza nadal zatrzymuje (0..1).
     *
     * ⚠ **Miękkie kolano, nie próg** — ta sama rodzina co
     * `STAMINA.heavyHit.thresholdDamage` i `EQUIPMENT_LOAD.effortFreeRatio`.
     * Próg twardy stoi na urwisku: cios 17,0 i 17,1 różniłyby się skokowo,
     * a katalog tarcz ma dopiero powstać i przesunie każdą z tych liczb.
     *
     * ⛔ **Nie jest to „tarcza przestaje działać"** — redukcja procentowa
     * zostaje, zmniejsza się wyłącznie liczba punktów, które tarcza zdejmuje
     * ponad swój udźwig. `reduction` nadal wyznacza sufit.
     */
    overflowKeep: 0.35,

    /**
     * Koszt wysiłku: `(staminaCost + strainPerPoint/(kg + massSoftening) × przyjęte) × mnożnik stopnia`.
     *
     * Dziś (Q3, całe, bez umiejętności) — przyjęte punkty → koszt:
     * ```
     *            3 pkt   10 pkt   20 pkt
     * puklerz     4,1     6,6     10,2      (rdzeń 3, 0,36/pkt)
     * okuta       5,5     6,5      8,0      (rdzeń 5, 0,15/pkt)
     * ```
     * ⚠ `massSoftening` istnieje po to, żeby tarcza o masie bliskiej zeru nie
     * dawała nieskończonego kosztu za punkt — nie jest pokrętłem balansu.
     */
    strainPerPoint: 0.9,
    massSoftening: 1,

    /**
     * **Trzy stopnie bloku**, po stosunku `przyjęte / udźwig`.
     *
     * ⚠ **Deterministyczne, jak cały blok w tej grze** (`blockChance` zostało
     * odrzucone w `N-23` z pomiarem — `docs/systemy/shields.md`). Stopień nie
     * jest rzutem, tylko odczytem tego, co się właśnie stało.
     */
    grade: {
      /** Poniżej tego stosunku cios jest „zatrzymany" — tarcza pracuje w swoim paśmie. */
      lightBelow: 0.5,
      /** Powyżej tego stosunku cios PRZECIĄŻA tarczę (przebicie). */
      staggerAbove: 1,
    },

    /** Mnożnik kosztu wysiłku per stopień. ⚠ `stagger` jest karą za przyjęcie
     *  czegoś, czego tarcza nie miała jak znieść — nie za „gorsze ustawienie". */
    costMul: { light: 0.7, solid: 1, stagger: 1.8 },

    /**
     * **Mnożnik SZANSY zużycia per stopień** — wchodzi parametrem do
     * `Quality.applyWear`, ⛔ **nie jako drugi model zużycia.**
     *
     * ⚠ To jest świadome odstępstwo od komentarza, który stał przy
     * `Equipment.wearShield` do 2026-09-15 („`applyWear` bez zmian — ta sama
     * szansa i ten sam ubytek, co przy broni"). Powód tamtego zapisu brzmiał:
     * *osobny model zużycia dla tarcz byłby drugim systemem naprawy* — i ten
     * powód **zostaje uszanowany**: model jest JEDEN, naprawa JEDNA, config
     * JEDEN (`EQUIPMENT.durability`). Zmienia się wyłącznie to, że stawka
     * dostaje mnożnik zdarzenia, tak jak dostał go koszt wysiłku.
     * ⚠ Broń przechodzi przez `applyWear` z mnożnikiem **1**, czyli bez zmiany
     * zachowania — pilnuje tego zamek §K6 w `tools/tarcze_przymiar.mjs`.
     */
    wearStrain: { light: 0.5, solid: 1, stagger: 2.5 },
  },
} as const;

/**
 * **UMIEJĘTNOŚĆ WŁADANIA TARCZĄ** (`T-7`, 2026-09-15) — `core/ShieldSkill.ts`.
 *
 * ⚠ **To NIE jest rodzina broni i świadomie nie wchodzi do `WEAPON_FAMILY`.**
 * Tamta oś niesie tożsamość ATAKU (parowanie miecza, krytyk topora, typ
 * obrażeń) i wisi na `def.family` przedmiotów typu `weapon`; tarcza jest
 * `type: "armor"`. Wpuszczenie jej tam dołożyłoby piątej rodzinie pola, których
 * nigdy nie użyje, i kazałoby `Progression.familyParryBonus` odpowiadać na
 * pytanie o tarczę.
 *
 * ⚠ **Arytmetyka wzrostu jest POŻYCZONA, nie napisana od nowa** —
 * `Practice.addPractice`/`pointCost`, czyli dokładnie ta krzywa, po której
 * rośnie biegłość broni (`koszt(P) = a + b·P`, więc suma kwadratowa).
 * ⛔ Drugiej krzywej nauki w tym projekcie nie ma i nie ma powstać.
 *
 * ⚠ **Ulga ZDEJMUJE UŁAMEK KOSZTU, nigdy go nie kasuje** — ta sama zasada, co
 * przy `ARMOR_TRAINING` i z tego samego powodu: kanał, który da się wyzerować,
 * przestaje być kanałem. Kształt `K/(K+x)` jest wspólny z `d/(d+defenseK)`
 * i z Modelem D obciążenia.
 */
export const SHIELD_SKILL = {
  /**
   * Ile praktyki niesie JEDEN zablokowany punkt obrażeń.
   *
   * ⚠ **Praktyka idzie od PRZYJĘTYCH PUNKTÓW, nie od liczby bloków.** Inaczej
   * najszybszą drogą do mistrzostwa byłoby stanie przed królikiem — ta sama
   * pomyłka, którą biegłość broni rozwiązała przez `teacher(ρ)`
   * (`docs/systemy/proficiency.md` §20).
   */
  practicePerPoint: 22,

  /** Ile praktyki niesie stopień bloku. ⭐ Przebicie uczy najwięcej — uczysz
   *  się na tym, co prawie przeszło. */
  gradeWeight: { light: 0.5, solid: 1, stagger: 1.6 },

  /**
   * Ulga: `maxRelief × P / (P + k)`.
   *
   * ⚠ **Sufit 0,35 i `k` są WARTOŚCIAMI STARTOWYMI do playtestu**, nie stałymi
   * systemu — ta sama deklaracja, co przy `speedK`/`regenK` Modelu D.
   *
   * ⚠⚠ **`practicePerPoint = 22` NIE jest wyczuciem — jest policzone wstecz
   * z krzywej `PRACTICE.costA/costB`, tej samej, po której rośnie biegłość
   * broni.** Pierwsza wersja miała tu `0,6` i **zamek §K7 ją odrzucił**:
   * 60 zablokowanych ciosów po 20 punktów dawało `P = 2`, czyli ulgę 0,6% —
   * mechanikę niewidoczną dla gracza. Ramp przy założeniu ~3 bloków po ~10
   * przyjętych punktów na walkę:
   * ```
   *   5 walk → P 12 → ulga  8,1%
   *  10 walk → P 24 → ulga 13,1%
   *  25 walk → P 56 → ulga 20,4%
   *  50 walk → P105 → ulga 25,3%
   * 100 walk → P186 → ulga 28,8%
   * ```
   * ⭐ Pierwsze kroki widać szybko, a nasycenie jest wyraźne — to jest kształt,
   * o który chodziło. ⛔ Nie strój tego przed playtestem.
   */
  maxRelief: 0.35,
  k: 40,

  /**
   * Sufit `P`. ⚠ Istnieje, bo krzywa `K/(K+x)` sama z siebie nie ma końca,
   * a zapis musi mieć skończony zakres do sanityzacji. ⛔ Nie jest odpowiednikiem
   * Mastery broni — rang tarczy nie ma i nie są tym zakresem otwierane.
   */
  cap: 400,
} as const;

/**
 * **Jakość wykonania** — craftsmanship, a property of the concrete instance.
 * Full analysis and the accepted scope: `docs/jakosc_wykonania.md`.
 *
 * The same sword can exist at seven levels of workmanship. All seven live in
 * the data model from the start; which of them the world actually HANDS OUT is
 * a separate question (`shopMaxLevel` below), so 5–7 can be held back as quest
 * rewards without the model needing to change later.
 */
export const QUALITY = {
  /**
   * What every existing item is. ⚠ Load-bearing: the system must never make
   * gear the player already owns worse than it was yesterday — a mechanic whose
   * visible launch effect is "everything you have got downgraded" starts with a
   * debt of trust. Old saves normalise to this (see `Quality.normalizeInstance`).
   */
  defaultLevel: 3,
  /**
   * Highest level ordinary shops and drops may produce. Levels above it are
   * reserved for content (quests, finds, future high-end crafting).
   *
   * ⚠ Raising this past 4 is a BALANCE change, not a content one. Measured dps:
   * dagger 20 → hammer 26.2, i.e. the whole weapon ladder spans ×1.31. Levels
   * 1–4 span ×1.235 — narrower than the ladder, so weapon identity survives.
   * The full 1–7 range spans ×1.41, WIDER than the ladder, at which point
   * quality outweighs which weapon you chose and the categories stop being a
   * decision. Open 5–7 together with the `+% damage` rework, not before.
   */
  shopMaxLevel: 4,
  /** Display name (feminine — it agrees with "jakość", so it fits every item
   *  regardless of the item's own gender) and the colour that carries it at a
   *  glance in the backpack, which is how quality is actually read in play. */
  levels: {
    1: { name: "Podła", color: 0x8a7a6a },
    2: { name: "Niska", color: 0x9a9a9a },
    3: { name: "Zwykła", color: 0xd8d8d8 },
    4: { name: "Dobra", color: 0x5fbf5f },
    5: { name: "Wysoka", color: 0x4f9ae0 },
    6: { name: "Mistrzowska", color: 0xa96fd8 },
    7: { name: "Arcymistrzowska", color: 0xe8a33d },
  },
  /**
   * Per-STAT modifier tables, deliberately not one shared percentage.
   *
   * Quality may touch anything that plausibly follows from workmanship — a
   * badly forged blade is badly balanced, a well-fitted harness is less of a
   * burden — but it must never change what KIND of thing the item is. A
   * Mistrzowski hammer is still a hammer: `melee` (arc, reach, knockback,
   * interrupts) belongs to the CATEGORY and is not listed here on purpose,
   * because that is what carries weapon identity.
   */
  modifiers: {
    /** Weapon damage, as a fraction. The author's reference table. */
    damage: { 1: -0.15, 2: -0.08, 3: 0, 4: 0.05, 5: 0.1, 6: 0.15, 7: 0.2 },
    /** Armour protection, same shape as damage. */
    defense: { 1: -0.15, 2: -0.08, 3: 0, 4: 0.05, 5: 0.1, 6: 0.15, 7: 0.2 },
    /** Maximum durability. The author's reference table. */
    maxDurability: { 1: 0.7, 2: 0.85, 3: 1, 4: 1.15, 5: 1.35, 6: 1.6, 7: 2 },
    /**
     * Handling — balance in the hand, read as attack speed. FIRST PASS, ranges
     * still to be settled: deliberately narrower than damage, because cadence
     * compounds with damage and the two at full width would multiply.
     *
     * ⚠ This is fed through the SAME cap as gear bonuses
     * (`ATTRIBUTES.maxAttackSpeedBonus`), not added on top. The cap is not just
     * balance: `swingDurationMs` scales off the same number, so exceeding it
     * makes the attack pose stutter. See `Progression.attackSpeedBonus`.
     */
    attackSpeed: { 1: -0.08, 2: -0.04, 3: 0, 4: 0.03, 5: 0.06, 6: 0.09, 7: 0.12 },
    /**
     * Flat shift on the item's attribute minimums — a clumsy weapon takes more
     * muscle to wield, a well-made one less. FIRST PASS, ranges to be settled.
     *
     * ⚠ Applied ONLY to attributes the item already requires. Requirement-free
     * gear stays requirement-free at every quality, and that invariant is not
     * cosmetic: the dagger, the stick and the whole leather set are deliberately
     * ungated so a pure-Zręczność or pure-Kondycja build always has a usable
     * weapon, and there is no respec to escape with. Without this rule a Podła
     * stick would ask for Siła 1 — which a fresh character does not have — and
     * `stick_in_hand`, the first quest in the game, would be unfinishable.
     */
    requirement: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: -1, 7: -1 },
  },
  /**
   * What a copy of this quality is WORTH, as a multiplier on both buyPrice and
   * sellPrice.
   *
   * Applied to both ends on purpose: scaling only one would open an arbitrage
   * (buy the cheap grade, sell it back at the standard price). Deliberately
   * steeper than the stat curve: a Mistrzowski blade is worth far more than 15%
   * extra to the person selling it, and that gap is what will make quality a
   * meaningful reward rather than a rounding error, once levels 5-7 are handed
   * out by content.
   *
   * Current durability does NOT enter the price. It could (a worn sword is
   * worth less), but the buy/sell spread is already 60%, so there is no
   * exploit to close and one fewer moving part to explain.
   */
  priceMul: { 1: 0.55, 2: 0.75, 3: 1, 4: 1.35, 5: 1.9, 6: 2.8, 7: 4.5 },
} as const;

/** Loot dropped by defeated enemies. */
export const LOOT = {
  /**
   * ⭐ Bandyci (2026-10-11, `OI-171`): pierwsze ZŁOTO z wroga — trafia od razu
   * do sakiewki (`GameScene.dropKillLoot`), bo grosz nie jest przedmiotem.
   * Pancerz z łupu to sztuki, które dotąd NIE miały żadnej drogi zdobycia
   * (`OI-106`): zbóje rzadko, herszt na pewno.
   */
  banditGoldMin: 4,
  banditGoldMax: 12,
  chiefGoldMin: 60,
  chiefGoldMax: 90,
  /**
   * Ekwipunek z łupu — DANE, nie gałąź w `dropKillLoot`, bo czyta je też
   * `tools/dystrybucja_przymiar.mjs` (skąd gracz bierze każdą sztukę; `OI-106`).
   *
   * ⭐ **Zasada autora (2026-10-11): z wroga spada tylko to, co MIAŁ NA SOBIE,
   * rzadko i ZNISZCZONE** — „żeby bandyci nagle nie zrobili się farmą
   * przedmiotów, a jednocześnie urealnić zdobywanie tego, co nosili”. Listy
   * idą za strojem modeli (`tools/npc3d.py`, presety `bandit_*`): zmieniając
   * strój, zmień łup. Zniszczony egzemplarz trzeba naprawić (ujście złota),
   * a jakość 1–2 tnie cenę (`QUALITY.priceMul`).
   *
   * Wpis = jeden rzut `chance`; przy kilku `items` wypada JEDNA z nich, losowo.
   * `quality` / `durability` (ułamek pełnej) — przedziały, bez nich egzemplarz
   * jest nowy i Zwykły.
   * ⚠ **Pancerz nie ma dziś trwałości** (odroczona — `docs/pancerz_checkpoint.md`),
   * więc „zniszczony” wyraża u niego wyłącznie jakość 1–2; `durability` działa
   * na broni (zmierzone w silniku 2026-10-11: pałka 4–12 pkt, łup ~11%).
   */
  equipmentDrops: {
    // Kaptur, skórzany kaftan, koszula, spodnie, onuce + pałka.
    bandit_club: [{
      items: ["club", "leather_chest", "linen_shirt", "linen_trousers", "foot_wraps"],
      chance: 0.12, quality: [1, 1], durability: [0.1, 0.35],
    }],
    // Przeszywanica, skórzane nogawice, trzewiki, czapka pikowana + topór.
    bandit_axe: [{
      items: ["axe", "gambeson", "leather_legs", "low_boots", "padded_cap"],
      chance: 0.12, quality: [1, 1], durability: [0.1, 0.35],
    }],
    // Herszt nie odradza się — zostawia szyszak na pewno i jedną rzecz
    // z reszty stroju; lepiej utrzymane niż u zwykłych zbójów.
    bandit_chief: [
      { items: ["spangenhelm"], chance: 1, quality: [2, 2], durability: [0.3, 0.55] },
      { items: ["short_hauberk", "sword", "leather_gloves", "leather_boots"], chance: 1, quality: [1, 2], durability: [0.25, 0.5] },
    ],
  } as Readonly<Partial<Record<string, readonly {
    items: readonly (keyof typeof ITEMS)[];
    chance: number;
    quality?: readonly [number, number];
    durability?: readonly [number, number];
  }[]>>>,
  /** Chance (0..1) a kill drops rabbit meat. */
  rabbitMeatDropChance: 0.8,
  /** How many rabbit meat drop per kill (rolled between these, inclusive). */
  rabbitMeatMin: 1,
  rabbitMeatMax: 2,
  /** Boar hide — only drops if the player has learned Skinning (see SKILLS). */
  boarHideDropChance: 0.9,
  boarHideMin: 1,
  boarHideMax: 2,
  /** Rabbit leather scraps — trash loot, also gated behind Skinning. */
  rabbitScrapsDropChance: 0.5,
  rabbitScrapsMin: 1,
  rabbitScrapsMax: 2,
  /** Wolf pelt — only drops if the player has learned Skinning (see SKILLS). */
  wolfPeltDropChance: 0.85,
  wolfPeltMin: 1,
  wolfPeltMax: 2,
  /**
   * Bear hide — gated behind Skinning like the boar's and the wolf's, and
   * deliberately the same 0.9 chance as the boar rather than a guaranteed
   * drop: the only 1.0 in this table is the Szary's trophy, and that is
   * because he never comes back. A bear does.
   */
  bearHideDropChance: 0.9,
  bearHideMin: 1,
  bearHideMax: 2,
  /** Lis z kurnika ma przy sobie łup — jajka (bez Skórowania: nie zdejmuje
   *  się ich ze skóry). Skrawki skóry jak z zająca, pod Skórowaniem. */
  foxEggsDropChance: 0.45,
  foxEggsMin: 1,
  foxEggsMax: 2,
  foxScrapsDropChance: 0.6,
  foxScrapsMin: 1,
  foxScrapsMax: 2,
  /** Jeleń: skóra jako strzępy (własnej skóry ani dziczyzny jeszcze nie ma —
   *  wymagają ikon), więcej niż z lisa, bo i zwierzę większe. */
  deerScrapsDropChance: 0.9,
  deerScrapsMin: 2,
  deerScrapsMax: 3,
  /**
   * The Szary's trophy. Guaranteed (1.0) and NOT gated behind Skinning — he is
   * a one-off kill, so a failed roll or a missing skill would mean losing the
   * reward for the hardest fight on the map with no way to try again.
   */
  greyFangDropChance: 1,
  greyFangMin: 1,
  greyFangMax: 1,
  /** He also carries a pelt, for anyone who did learn to skin. */
  greyPeltDropChance: 1,
  greyPeltMin: 2,
  greyPeltMax: 3,
  /** Spider silk — no Skinning needed; you cut it off the web, not the spider. */
  spiderSilkDropChance: 0.75,
  spiderSilkMin: 1,
  spiderSilkMax: 2,
  /** Skoczek: nić rzadziej niż u sieciarza (nie zastawia sieci, tylko poluje
   *  w skoku), za to gruczoł jadowy — też bez Skórowania, z tego samego
   *  powodu co nić: to nie jest skóra, tylko rzecz wycięta z tuszy. */
  venomSilkDropChance: 0.5,
  venomGlandDropChance: 0.35,
  venomGlandMin: 1,
  venomGlandMax: 1,
  /** How long an uncollected drop lingers before it despawns (ms). */
  lifetimeMs: 20000,
} as const;

/**
 * Learnable abilities, taught by NPCs for skill points (the same "punkty
 * rozwoju" earned on level-up). Unlike attributes, a skill is a one-off unlock
 * that changes what the player can do — Skinning gates boar-hide loot, so the
 * point cost pays itself back in gold. Tracked by the Skills singleton.
 */
export const SKILLS = {
  skinning: {
    id: "skinning",
    name: "Skórowanie",
    /** Gold the trainer charges to teach it. */
    goldCost: 50,
    /**
     * Skill points charged on top of the gold. Zero here on purpose — Skinning
     * pays for itself in pelts, so gating it behind the (now scarce, 1-per-level)
     * point budget would just delay the loot loop it exists to open up.
     */
    skillPointCost: 0,
    /** Which NPC teaches it (matches the NPC's quest `giver` id). */
    trainer: "hunter",
    description: "Pozwala zdzierać skóry ze zwierząt — cenna z dzika, strzępy z królika.",
  },
  cooking: {
    id: "cooking",
    name: "Pieczenie mięsa",
    goldCost: 35,
    /**
     * Three points is a real cost now: with skillPointsPerLevel at 1, this is
     * three levels' worth of attributes given up. That's deliberate — it makes
     * "cheap sustain" an actual build decision rather than a free pickup.
     */
    skillPointCost: 3,
    trainer: "hunter",
    description: "Pozwala piec surowe mięso przy ognisku — pieczone leczy powoli poza walką.",
  },

  // ── Kartografia (2026-10-14, `docs/pomysly.md` „Kartografia”) ───────────
  //
  // ⭐ Pierwsza umiejętność UŻYTKOWA niezwiązana z walką. Poziom I odblokowuje
  // MAPĘ w panelu gracza, poziom II — MINIMAPĘ w rogu ekranu (decyzje autora
  // 2026-10-14). Bez poziomu II róg minimapy jest PUSTY. Odkrywanie terenu
  // (`MAP_FOG`) liczy się zawsze, więc nauka niczego nie każe powtarzać.
  // ⚠ Poziomy to dwa wpisy, a kolejność pilnuje `requiresSkill` — nie
  // osobny licznik poziomów: `Skills` już umie zapis, trenera i dwie waluty.
  cartography_1: {
    id: "cartography_1",
    name: "Kartografia I",
    /** Za darmo — element wprowadzenia (pierwsze minuty gry u Myśliwego). */
    goldCost: 0,
    skillPointCost: 0,
    trainer: "hunter",
    description: "Pozwala czytać i prowadzić mapę okolicy: zakładka Mapa w panelu gracza. Teren, który przeszedłeś, rysuje się na niej sam.",
  },
  cartography_2: {
    id: "cartography_2",
    name: "Kartografia II",
    /** Sołtys zna granice wsi i drogi — wiedzę „od wójta” przewiduje
     *  `docs/pomysly.md`. Złoto, nie punkty: to wygoda, nie moc w walce. */
    goldCost: 60,
    skillPointCost: 0,
    trainer: "elder",
    /** Poziom II dopiero po I — `Skills.isLocked`. */
    requiresSkill: "cartography_1",
    description: "Mapa zawsze pod ręką: minimapa w rogu ekranu pokazuje okolicę wokół ciebie.",
  },

  // ── Umiejętności bojowe — wszystkie u Patryczka ─────────────────────────
  //
  // ⚠ **Umiejętności czynnych NIE dostaje się już za sam poziom.** Decyzja
  // autora (2026-08-16): „gracz nagle nie może się sam z siebie nauczyć okrzyku
  // bojowego ani wiru ostrzy". Zostają DWIE bramki naraz, dokładnie jak w
  // klasycznym WoW-ie: **poziom mówi „jesteś gotowy", trener mówi „ktoś ci to
  // pokazał"**. Zdjęcie progu poziomu było rozważane i odrzucone — `ABILITIES.
  // *.unlockLevel` to dziś jedyna treść poziomów 3/6/10, a bez niej każdy
  // poziom to znów +1 punkt cechy i nic więcej (patrz zaparkowane „Nagrody za
  // poziomy 11+" w `docs/odlozone.md`).
  //
  // ⚠ Nauka jedzie przez `Skills`, a nie przez nowe pole w `Abilities`, i to
  // jest wybór techniczny: `Skills` jest **już zapisywane**, ma `forTrainer`,
  // panel trenera i pobieranie dwóch walut. `Abilities` celowo nie trzyma
  // niczego trwałego (cooldown po wczytaniu ma być wyzerowany), więc dokładanie
  // mu persystencji tylko po to zmieniłoby kształt zapisu bez potrzeby.
  //
  // Dlaczego wszystkie u Patryczka: jest najlepiej bijącym się człowiekiem we
  // wsi (karczemna bójka, `reka`), a `CLAUDE.md` od początku notuje, że
  // „docelowo ma zostać trenerem". ⚠ Ma rękę w łubkach i to jest powód, dla
  // którego dotąd nim nie był — uczy więc słowem, nie pokazem, i jego kwestie
  // muszą to mówić, inaczej gracz zauważy sprzeczność.
  wide_cut: {
    id: "wide_cut",
    name: "Szerokie cięcie",
    /** Tanio i za ZERO punktów, jak Skórowanie. Nie dlatego, że hojnie —
     *  dlatego, że ta umiejętność przywraca to, co broń obiecuje własnym
     *  opisem (łuk 100° siekiery), a nie dokłada nowej mocy. Kazanie graczowi
     *  płacić za to atrybutami byłoby podatkiem od przeczytania opisu. */
    goldCost: 40,
    skillPointCost: 0,
    trainer: "patryczek",
    unlocksAbility: "cleave",
    description: "Zamach na całą szerokość broni zamiast w jeden cel.",
  },
  footwork: {
    id: "footwork",
    name: "Praca nóg",
    goldCost: 60,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "dodge",
    description: "Przewrót, który wyprowadza z zasięgu. Odblokowuje Unik.",
  },
  blade_dance: {
    id: "blade_dance",
    name: "Taniec ostrzy",
    goldCost: 120,
    skillPointCost: 2,
    trainer: "patryczek",
    unlocksAbility: "whirlwind",
    description: "Obrót z bronią w pełnym kole. Odblokowuje Wir ostrzy.",
  },
  /** ⚠ Punkty, nie samo złoto: Szarża to jedyna umiejętność zmieniająca to,
   *  JAK gracz otwiera walkę, więc ma kosztować coś z budżetu, którego nie da
   *  się dorobić sprzedażą skór. Tańsza od Tańca ostrzy, bo nie zadaje
   *  obrażeń — kupuje dystans, nie moc. */
  charge_run: {
    id: "charge_run",
    name: "Rozbieg",
    goldCost: 90,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "charge",
    description: "Pęd na wybranego przeciwnika przez cały dystans. Odblokowuje Szarżę.",
  },
  /** ⚠ Tanio i wcześnie: to jest umiejętność WPROWADZAJĄCA pojęcie
   *  „zamach z commitmentem", a nie nagroda za postęp. Ma trafić do rąk
   *  gracza, zanim nauczy się grać wokół samego autoataku. */
  heavy_blow: {
    id: "heavy_blow",
    name: "Ciężki zamach",
    goldCost: 70,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "heavyStrike",
    description: "Wolniejszy cios o większej sile. Odblokowuje Ciężkie uderzenie.",
  },
  /** ⚠ Punkt, jak Rozbieg — mimo że Wypad jest tańszy w złocie. To jest
   *  umiejętność zmieniająca sposób poruszania się w wymianie ciosów, a nie
   *  kolejny sposób uderzenia; taniej niż Rozbieg tylko dlatego, że zamyka
   *  dużo krótszy dystans. */
  lunge_step: {
    id: "lunge_step",
    name: "Krok i pchnięcie",
    goldCost: 80,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "lunge",
    description: "Skok na odległość broni — w przeciwnika albo w bok. Odblokowuje Wypad.",
  },
  /**
   * ⚠ **Punkt, jak Rozbieg i Krok i pchnięcie** — bo to jest umiejętność
   * zmieniająca to, KTO decyduje o rytmie wymiany, a nie kolejny sposób
   * uderzenia. Cena w złocie jak Rozbieg (90): oba kupują nie moc, tylko
   * kontrolę nad dystansem albo nad czasem.
   *
   * ⚠ Patryczek uczy TECHNIKI, nie sprzedaje tarczy — bramka sprzętowa siedzi
   * w `ABILITIES.shieldBash.requiresShield` i działa niezależnie od tego, czy
   * gracz się nauczył. Można umieć i nie mieć czym.
   */
  shield_work: {
    id: "shield_work",
    name: "Praca tarczą",
    goldCost: 90,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "shieldBash",
    description: "Tarcza jako broń, nie tylko osłona. Odblokowuje Uderzenie tarczą.",
  },
  /**
   * ⚠ **PLACEHOLDER cenowy.** Między Ciężkim zamachem (70) a Pracą tarczą (90)
   * — Rozcięcie daje mniej natychmiastowej mocy niż pierwsze i mniej kontroli
   * niż drugie, ale jako jedyne zostawia po sobie ranę.
   */
  deep_cut: {
    id: "deep_cut",
    name: "Głębokie cięcie",
    goldCost: 110,
    skillPointCost: 1,
    trainer: "patryczek",
    unlocksAbility: "rend",
    description: "Cios, który tnie głębiej, niż zabija. Odblokowuje Rozcięcie.",
  },
  battle_voice: {
    id: "battle_voice",
    name: "Głos bojowy",
    goldCost: 200,
    skillPointCost: 3,
    trainer: "patryczek",
    unlocksAbility: "warcry",
    description: "Krzyk, który niesie i dodaje sił. Odblokowuje Okrzyk bojowy.",
  },
} as const;

/** The player's backpack. */
export const INVENTORY = {
  /**
   * ⭐⭐ **SZEROKOŚĆ SIATKI PLECAKA — GEOMETRIA MODELU, nie układ UI**
   * (decyzja 2026-09-18, `docs/decyzje/2026-09-18-gabaryt-w-plecaku.md`).
   *
   * ⚠⚠ **Do tej daty liczbę kolumn liczyło UI z szerokości okna**
   * (`computeInventoryLayout`, `clamp(..., 4, 8)`) i była ona ZMIENNA:
   * zmierzone w paśmie panelu 816–1280 j. wychodziło **4, 5 albo 6 kolumn**.
   * Dopóki każdy przedmiot zajmował jedno pole, nic z tego nie wynikało.
   * Od chwili, gdy przedmiot może zająć **dwa pola w pionie**, sąsiad pionowy
   * to `i + cols` — czyli przy zmiennej liczbie kolumn **ten sam zapis
   * układałby się inaczej na telefonie i na zwężonym oknie przeglądarki**.
   *
   * ⛔ **Nie wolno tego przenieść z powrotem do UI ani uzależnić od ekranu.**
   * UI ma się do tej liczby DOPASOWAĆ (skaluje kafel i liczbę widocznych
   * wierszy), nigdy odwrotnie.
   *
   * ⚠ **Dlaczego akurat 4.** Zmierzone przeciw normie dotyku 48 dp
   * (`HUD_LAYOUT.minTouch` = 68 j.): przy stałych 4 kolumnach kafel schodzi
   * najniżej do 70 j. w całym paśmie panelu, przy 5 kolumnach spada do **54 j.
   * poniżej 1088 j. szerokości**, czyli łamie normę na zwężonym oknie.
   * ⭐ Skutkiem ubocznym jest większy kafel (~100 j. na telefonie zamiast 70),
   * a przy `cell >= 100` ikona rysuje się w skali ×3 zamiast ×2.
   *
   * ⚠ **Pojemność NIE musi być wielokrotnością tej liczby** — torby dodają 2,
   * 4, 6 i 8 pól, więc ostatni wiersz bywa niepełny. Obsługuje to sprawdzenie
   * granic w `Inventory.cellsFor`, nie wyrównywanie pojemności.
   */
  cols: 4,
  /** Base capacity with no bags worn. `Inventory.capacity` grows from this as
   *  `container` items are worn in `BAG_SLOTS` — see `core/Equipment.ts`. */
  slots: 16,
  /**
   * Technical ceiling `Inventory.setCapacity` will never exceed: base 16 +
   * four bag slots at their biggest container (+8 each). **This is a v1
   * plumbing limit, not an economy decision** — see
   * `docs/inventory_scroll_ux.md` §3. Whatever capacity a player can actually
   * reach is a separate, later call (bag prices, drop rates).
   */
  maxSlots: 48,
  /** Max copies of one item per stack. */
  stackSize: 20,
  /**
   * What a fresh run begins with, granted by TitleScene when starting a new
   * game. **Empty on purpose.**
   *
   * The stick used to be here, granted AND worn, because bare hands are 8 dps
   * — deliberately hopeless — and a game that opens with you punching rabbits
   * reads as broken rather than as a curve. It is now handed over by the Ojciec
   * as part of `QUESTS.stick_in_hand` instead, which fixes the same problem
   * better *and* closes a hole the bag-start version had: a player who sold the
   * stick before equipping it could never finish the first quest in the game.
   * A quest grant can be replenished by its giver; a starting item cannot.
   */
  startingItems: [] as readonly string[],
  /**
   * ⭐ **Co nowa postać ma NA SOBIE** (decyzja autora 2026-10-03): prosty strój
   * chłopski, ZAŁOŻONY od pierwszej klatki, w jakości „Niska" (2). Model 3D
   * gracza jest bazą w bieliźnie, na którą zakłada się przedmioty jak w WoW —
   * bez tego start wyglądał jak bieganie po wsi w samych gaciach.
   *
   * ⚠ To są PRAWDZIWE przedmioty (wybór autora wobec „stroju jako samego
   * wyglądu"): ważą, chronią o 1 punkt i da się je zdjąć albo sprzedać.
   * ⛔ Broni tu NIE dopisuj — kij wręcza Ojciec w `QUESTS.stick_in_hand`
   * i zadanie `equip_stick` zaliczyłoby się samo (patrz `startingItems` wyżej).
   * Żadne zadanie „załóż" nie celuje dziś w te trzy sztuki — sprawdź to,
   * dopisując nową.
   */
  startingWorn: [
    { itemId: "linen_shirt", quality: 2 },
    { itemId: "linen_trousers", quality: 2 },
    { itemId: "bast_shoes", quality: 2 },
  ] as readonly { itemId: string; quality: number }[],
} as const;

/**
 * ⭐ **HANDEL — odkup i cofnięcie** (etap E, decyzja autora E3, 2026-10-13:
 * „Cofnij do końca rozmowy + Odkup z narzutem"; research
 * `docs/research/ui_shop_research.md` §4 — Eternium odkupuje po tej samej
 * cenie, BDO z narzutem ~10%).
 *
 * ⚠ **Cofnięcie ostatniej transakcji jest 1:1** (zwrot dokładnie tego, co
 * pobrano) i trwa do końca rozmowy. **Odkup** to lista rzeczy sprzedanych temu
 * kupcowi w tej sesji gry, odkupywanych drożej, niż się je sprzedało — siatka
 * bezpieczeństwa na pomyłkę sprzed kilku transakcji, nie sposób na zarobek.
 */
export const SHOP = {
  /**
   * Narzut odkupu nad ceną, za którą rzecz sprzedano: cena odkupu =
   * `ceil(sprzedaż × (1 + narzut))`, co najmniej +1 g. ⚠ PARAMETR DO PLAYTESTU,
   * nie stała systemu — wzięty z BDO. Odkup NIGDY nie może być tańszy od
   * sprzedaży (inaczej sprzedaż + odkup byłyby kranem złota).
   */
  buybackMarkup: 0.1,
  /**
   * Ile pozycji pamięta odkup u JEDNEGO kupca (najstarsze wypadają). Lista żyje
   * w pamięci sesji, ⚠ świadomie NIE w zapisie — to siatka na pomyłkę, nie
   * schowek (Eternium: „tylko w bieżącej sesji").
   */
  buybackSize: 12,
  /**
   * Od tej jakości sprzedaż SZTUKI sprzętu pyta o potwierdzenie (research:
   * „potwierdzenie tylko przy sprzedaży zbiorczej i przy przedmiotach jakości
   * ≥ X"). 5 = „Wysoka" — w obiegu są dziś 1–4, więc to próg na przyszłe łupy.
   * Amulet pyta zawsze (jedyny w grze, z walki, której się nie powtórzy).
   */
  confirmSellQuality: 5,
} as const;

/** Currency the player carries. */
export const CURRENCY = {
  /** Gold the player starts a run with. */
  startingGold: 20,
} as const;

/**
 * ⭐ **Grupy tematów rozmowy** (D14, 2026-10-13). Temat z polem `group`
 * (`core/Npcs.ts` `Topic.group`) nie stoi w korzeniu rozmowy, tylko liczy się
 * w jednym wierszu grupy; po wejściu do grupy kolumna pokazuje jej pytania,
 * a nad „Do widzenia" — „‹ Zmień temat".
 *
 * - `row` — wiersz grupy w korzeniu, mówiony przez GRACZA (autor: „powiedz
 *   mi więcej o ziołach"), nie etykieta menu.
 * - `short` — okruszek nad listą w grupie („Zioła · 3 nowe tematy").
 *
 * ⚠ Kolejność kluczy = kolejność wierszy grup w kolumnie (stała, nie wg
 * liczby nowych — odruch kciuka). ⚠ Grupa ma sens od DWÓCH tematów
 * równoległych; pilnuje `R7` w `tools/rozmowy_przymiar.mjs`.
 */
export const TOPIC_GROUPS: Record<string, { row: string; short: string }> = {
  ziola: { row: "Opowiedz mi o ziołach", short: "Zioła" },
};

/** The stationary hunter NPC — trades pelts, teaches Skinning, gives hunting
 *  quests. (Config/class are still called MERCHANT/Merchant internally.) */
export const MERCHANT = {
  /**
   * The NPC's identity for content that points *at* him: quests use it as
   * `giver`, skills as `trainer`, and the dialogue UI to ask "what do you have
   * for me?". Kept here rather than as a bare "hunter" string spread across
   * the quest/skill/UI code, which is how the config and the UI would quietly
   * drift apart the day a second NPC appears.
   */
  id: "hunter",
  name: "Myśliwy",
  /** What he says when the conversation opens (the dialogue window's body). */
  greeting:
    "Ramię mi jeszcze nie wróciło, więc las jest twój. Masz coś do sprzedania, czy przyszedłeś się czegoś nauczyć?",
  /**
   * Co mówi zależnie od stanu gry. `NpcDialog.pickGreeting` sprawdza je
   * w kolejności od najbardziej konkretnego i bierze pierwsze pasujące;
   * `greeting` powyżej zostaje jako awaryjne.
   *
   * Trzymane w konfiguracji, a nie w kodzie okna, bo to treść — ma leżeć
   * obok zadań i przedmiotów, nie w warstwie układu.
   */
  greetings: {
    /**
     * Przyszedłeś przed czasem: `stick_in_hand` jeszcze nie oddane, więc cała
     * jego lista stoi zamknięta (patrz `gatedOnly` w `NpcDialog.pickGreeting`).
     * Odsyła cię do domu — i przy okazji **zdradza, że zna twojego ojca**,
     * zanim jeszcze zapytasz o to kogokolwiek. To jedyne miejsce, gdzie łańcuch
     * o wojsku daje o sobie znać sam z siebie.
     */
    notYet:
      "Stój, stój. Do lasu z gołymi rękami się nie chodzi, a ja ci jedną ręką nic nie wystrugam. Idź do domu, niech ci stary da coś do ręki — on wie, co robi, uwierz mi na słowo. Wróć, jak będziesz miał czym machać.",
    /** Nic jeszcze nie wziąłeś — przekazuje ci urząd. Kluczowa fabularnie. */
    firstJob:
      "Nie gap się na ramię. Zające wchodzą w zboże, a ja przez miesiąc nie przejdę własnego podwórza. Robota jest do wzięcia — jak nie ty, to nikt.",
    /** Coś skończone i warte oddania. */
    turnIn: "Widzę, że nie poszedłeś się przespać pod drzewem. Dawaj to, z czym wróciłeś.",
    /** Jesteś w trakcie roboty w jego imieniu. */
    working: "I jak tam? Zające same się nie policzą. Wracaj, jak będziesz miał co pokazać.",
    /** Nowe zlecenie, ale to już nie pierwsze spotkanie. */
    newJob: "Jest jeszcze jedna rzecz, jak masz siłę. Siadaj, powiem ci.",
    /** Nic do wzięcia ani oddania, ale ma jeszcze czego uczyć. */
    moreToTeach:
      "Mięso to połowa zająca. Reszta to skóra, a tej marnować nie wolno — mogę cię nauczyć, jak zechcesz.",
    /**
     * Wszystko przekazane — i **ta gałąź jest osiągalna WYŁĄCZNIE po śmierci
     * Szarego**, co przez długi czas było tu przeoczone.
     *
     * Wyprowadzenie: `pickGreeting` schodzi do `allDone` dopiero, gdy żadne
     * odblokowane zadanie dawcy nie jest `available` ani `active`.
     * `grey_wolf_revenge` nie ma warunku, który mógłby je ukryć (wisi tylko na
     * `rabbit_hunt`, a `isUnlocked` przepuszcza wszystko, co już jest w
     * dzienniku), więc żeby `allDone` w ogóle padło, musi być `completed` —
     * czyli Szary musi leżeć. Poprzednia treść kończyła się słowami „ten szary
     * wciąż gdzieś tam jest" i **była fałszywa w jedynym stanie, w którym dało
     * się ją usłyszeć**. Zasiew wilka na później jest niepotrzebny: robi to
     * `firstJob`/`newJob` i cały łańcuch tematów.
     *
     * Odsyła do Sołtysa — ten sam wzorzec, co `topics.owce` → Gniewko:
     * człowiek, który nie ma czym zapłacić, kieruje cię do człowieka, który
     * ma. To jedyne miejsce, gdzie gracz dowiaduje się, że we wsi coś na niego
     * czeka; `mysliwy_z_zagajow` jest odsłonięte i tak, ale bez tego zdania
     * trzeba by na nie wpaść przypadkiem.
     */
    allDone:
      "Nauczyłem cię wszystkiego, co umiem. Reszty nauczy cię las. A ten kieł noś, nie chowaj — i idź z nim do sołtysa. Wieś zbierała na ciebie, jeszcze zanim poszedłeś; niech mają komu to oddać.",
  },
  /**
   * ── ŁAŃCUCH PYTAŃ — czytaj to, zanim dopiszesz temat komukolwiek ──────
   *
   * `docs/swiat.md` §1 opisuje kręgosłup fabuły jako łańcuch przyczynowy:
   *
   *   coś w głębi lasu → wypycha wilka → kaleczy Myśliwego
   *                    → zające bez kontroli → zagrażają zbiorom → TY
   *
   * ...i mówi wprost, że **gracz przechodzi ten łańcuch wstecz**. Tematy są
   * tym przejściem, dosłownie: zaczynasz na samym dole („czemu akurat ja bić
   * te zające?") i **wypytujesz się w górę**. Każde ogniwo odsłania następne
   * pytanie, zwykle **u kogoś innego** — dlatego zbiór zadanych tematów jest
   * globalny (`core/Dialogue`), a nie per-NPC.
   *
   *   urzad ─┐
   *   ramie ─┴→ szary ─→ czemu_zszedl ─→ gestwina ─→ most
   *   (Myśliwy)  (Myśliwy)   (Myśliwy)     (Zielarka)  (Myśliwy)
   *              ↘ szary_wies (Sołtys)     ↘ pajaki (Kowal)
   *
   * Łańcuch **kończy się ślepo i celowo**: na `most` nikt we wsi nie zna
   * odpowiedzi. `docs/swiat.md` §4 mówi to samo o pająkach — „nie tłumaczą
   * jeszcze niczego, mają tylko sprawiać wrażenie, że wschodnia gęstwina
   * należy już do kogoś innego". Nie dopisuj tam wyjaśnienia, dopóki nie ma
   * treści, która je udźwignie; niedopowiedzenie jest tu zawartością.
   *
   * Reszta tematów to **nie ozdobnik, tylko stawka**: młyn, płoty i pole
   * istnieją po to, żeby „zabij pięć zajęcy" znaczyło „wieś się nie rozejdzie
   * zimą". Ta sama zasada, którą kod stosuje już do przeciwników i broni —
   * rzecz ma coś znaczyć, nie tylko się nazywać.
   *
   * ── DRUGI ŁAŃCUCH: WOJSKO (Ojciec ↔ Myśliwy) ─────────────────────────
   *
   * Powyższy łańcuch jest o ŚWIECIE i biegnie wstecz do lasu. Ten jest o
   * BOHATERZE i biegnie wstecz do domu — dlatego jest osobny, a nie doszyty
   * do tamtego:
   *
   *   mysliwy_ojciec ─→ ojciec_wojsko ─┬→ wojna   (Ojciec)
   *   (Ojciec)          (Myśliwy)      ├→ alina   (Mama)
   *                                    └→ a_ty    (Myśliwy)
   *
   * Kolejność jest wymuszona przez samą grę, nie tylko przez `after`: Ojciec
   * wręcza kij (`QUESTS.stick_in_hand`), więc gracz rozmawia z nim **zanim**
   * dojdzie do Myśliwego. Ojciec zawiązuje wątek i odmawia mówienia,
   * Myśliwy go rozwija, a odpowiedź wraca do wsi — po nią trzeba przejść
   * portal z powrotem, co jest jedynym miejscem w grze, gdzie treść płynie
   * las → wieś zamiast odwrotnie.
   *
   * **Kończy się ślepo, tak samo jak `most`, i to jest ten sam chwyt.**
   * Myśliwy urywa („a ja... nieważne"), a `a_ty` daje na to odpowiedź, która
   * niczego nie wyjaśnia — mówi, DOKĄD poszedł, nie CZEGO nie miał. Nie
   * dopisuj tam wyjaśnienia. Gracz ma wyjść z tej rozmowy z jednym zdaniem,
   * którego nie dostał, dokładnie jak z pytania o most.
   *
   * Stawką jest tu opór Ojca z §2 `docs/swiat.md`: „ojciec się sprzeciwia,
   * matka pakuje zawiniątko". Ten łańcuch odpowiada, DLACZEGO się sprzeciwia
   * — nie ma cię za dziecko, tylko rozpoznaje w tobie siebie sprzed
   * trzydziestu lat i wie, dokąd go to zaniosło. Bez tego `strach` u Mamy
   * jest ładnym zdaniem bez pokrycia.
   */
  topics: [
    {
      id: "urzad",
      q: "Czemu akurat ja mam bić te zające?",
      a: "Bo to urząd, nie zabawa. We wsi jest jeden człowiek od odstrzału i tym człowiekiem byłem ja. Płacone, uczciwe i potrzebne — a że akurat nie mogę unieść łuku, to robota leży. Nie robię ci łaski. Przekazuję ci ją.",
    },
    {
      id: "ramie",
      q: "Co ci się stało w to ramię?",
      a: "Wilk. Dwa tygodnie temu, przy suszarniach, o świcie. Nie zdążyłem nawet krzyknąć. Zabrał mi kawał ramienia i odszedł — nie uciekł, odszedł. Jakbym nie był wart zachodu.",
    },
    {
      id: "szary",
      q: "Co to był za wilk?",
      a: "Szary. Tak go tu nazywają, bo tak wygląda i bo trzeba go było jakoś nazwać. Większy niż powinien być, jaśniejszy niż powinien być, i stary — pysk mu posiwiał. Nie zapuszczaj się w południowo-zachodni skraj, póki nie będziesz gotowy. Poznasz, że jesteś, kiedy przestaniesz się zastanawiać.",
      after: ["ramie"],
    },
    {
      id: "czemu_zszedl",
      q: "Czemu w ogóle zszedł pod wieś?",
      a: "I to jest właściwe pytanie. Wilki nie schodzą. Mają swój las, mają swoje zwierzę, ludzi omijają szerokim łukiem, bo ludzie się nie opłacają. Trzydzieści lat tu chodzę i takiego czegoś nie było. Ten nie przyszedł po żer. Ten się **cofał**.",
      after: ["szary"],
    },
    /**
     * **Odesłanie do trzeciego dawcy zadań.** Myśliwy nie daje tu roboty — daje
     * NAZWISKO, i to jest jedyny sposób, w jaki gracz dowiaduje się, że
     * Gniewko ma cokolwiek do zlecenia: pasterz stoi na ugorze za wsią, gdzie
     * nikt nie zachodzi bez powodu.
     *
     * Wisi za `czemu_zszedl`, a nie za `szary`, bo dopiero tamto pytanie
     * zamienia jednego wilka w problem, który się rozlewa. Myśliwy mówi też o
     * jednym więcej niż wie: *„pewnie ma"* — nie umawiał się z Gniewkiem,
     * tylko zna wieś. Dlatego `GNIEWKO.greetings.firstJob` odpowiada „Myśliwy
     * mówił, że kogoś przyśle", a nie „czekałem na ciebie".
     *
     * Odsyła przez bramę w drugą stronę: to jest pierwsza rzecz, po którą
     * trzeba wrócić do wsi z lasu — patrz `mysliwy_ojciec` po drugiej stronie
     * tego samego ruchu.
     */
    {
      id: "owce",
      q: "Poza tobą ktoś jeszcze przez nie ucierpiał?",
      a: "Pytasz nie tego człowieka. Mnie zabrał kawał ramienia i to widać, więc wszyscy gadają o mnie. A cicho traci pasterz. Gniewko, wypasa stado całej wsi na ugorze za chałupami — jak jemu ubędzie owca, to nie jego owca ubędzie, tylko czyjaś. Idź do niego i zapytaj wprost, ile mu zabrały. Pewnie ma dla ciebie zlecenie, bo ja mu nic nie pomogę z jedną ręką, a sołtysowi się z tym nie zgłosi — nie ten człowiek, żeby prosić.",
      after: ["czemu_zszedl"],
    },
    {
      id: "most",
      q: "Więc co siedzi za mostem?",
      a: "Nie wiem. I to nie jest wykręt — naprawdę nie wiem. Za most chodzi się po drewno i wraca się tego samego dnia. Ostatni raz byłem dalej jako chłopak. Zapytaj kogo chcesz w tej wsi, dostaniesz to samo zdanie: nikt stąd nie chodzi dalej niż most.",
      after: ["gestwina"],
    },
    {
      id: "ojciec_wojsko",
      q: "Ojciec mówi, że znacie się dłużej niż reszta wsi. Skąd?",
      a: "Z wojska, chłopcze. Twój stary i ja, jeden zaciąg, jeden tydzień. Mieliśmy wtedy tyle lat co ty i dokładnie tak samo nam ta krew buzowała — że świat jest gdzie indziej, a tu tylko pole i deszcz. Potem były trzy wojny. Nie jedna, trzy. Za dużo krwi jak na jedno życie, a to i tak za mało powiedziane. Ze cztery razy byliśmy o włos: raz on mnie wyciągnął, raz ja jego, a dwa razy nikt nikogo i po prostu się samo skończyło, i to są te dwa, o których się nie śpi. Obaj żeśmy w końcu odpuścili. On wcześniej, ja później. On poznał Alinę. A ja... nieważne. Ale teraz wiesz, czemu on się o ciebie boi. Nie dlatego, że cię ma za dziecko. Dlatego, że zna to buzowanie od środka i pamięta, dokąd go zaniosło.",
      after: ["mysliwy_ojciec"],
    },
    {
      id: "a_ty",
      q: "A ty? Powiedziałeś „nieważne”.",
      a: "Bo nieważne. ...Dobra. Tyle ci powiem i ani słowa więcej: on miał do czego wrócić, a ja nie miałem, więc wróciłem do lasu. Nie ma w tym nic pięknego i nie rób z tego opowieści. Las po prostu nie pyta, gdzie byłeś ani czego nie zrobiłeś — pyta tylko, czy umiesz cicho chodzić. Dwadzieścia lat mi to wystarczało. Bierz kij i idź do roboty.",
      after: ["ojciec_wojsko"],
    },
    {
      id: "co_teraz",
      q: "Zabiłem go. I co teraz?",
      a: "Teraz? Teraz zostaje pytanie, które zadałeś mi wcześniej, i na które dalej nie mam odpowiedzi. Zabiłeś tego, co mnie pogryzł. Nie zabiłeś tego, co go tu przygnało. Odpocznij, chłopcze. Potem pogadamy poważnie.",
      requiresQuest: "grey_wolf_revenge",
    },
  ],
  /** How close the player must stand to interact (px). */
  interactRange: 48,
  /**
   * Rendered scale for the NPC portrait sprite — tuned against
   * `hunter_portrait.png`'s own raw size (44×86) so he lands at ~1.1× the
   * player's on-screen height (Character.png's 60px frame at PLAYER.scale
   * 1), the same ratio the old shared NPC.png placeholder (31×60, nearly
   * Character.png's own pitch) rendered at for free. That ratio silently
   * broke the day his own bigger portrait replaced the placeholder without
   * a matching scale cut — he rendered at 1.58× the player, a giant next to
   * his own cabin. `scale` is per-NPC now (see BLACKSMITH below), not
   * shared, because each portrait's raw pixel size differs.
   */
  scale: 0.77,
  /**
   * What the Hunter sells: wood, leather and what comes out of a carcass.
   *
   * The metal moved to the Kowal (see BLACKSMITH) — a man who traps and skins
   * for a living has no forge, and a shop list is the cheapest characterisation
   * there is. What's left is exactly what his trade would actually produce or
   * carry: a cut branch, a skinning knife, and tanned hides.
   *
   * **`health_potion` moved OUT to HERBALIST** (see below) for the same
   * reason the metal left in the first place: a trapper has no business
   * brewing medicine, and `docs/wioska_plan.md` D-3 already decided Dorota
   * takes over that shelf. Don't put it back here "for redundancy" — one
   * seller per craft is the whole point of splitting the stock at all.
   */
  /**
   * Skóra to jego WŁASNE rzemiosło: sam ją garbuje, więc wychodzi mu lepiej
   * niż komukolwiek w okolicy. Żelazo ma z drugiej ręki i widać to po robocie.
   * Patrz `NpcDef.stockQuality`.
   */
  stockQuality: { weapon: [2, 3], armor: [3, 4] },
  stock: [
    "stick",
    "dagger",
    /**
     * ⭐ **Kord u Myśliwego, nie u Radzima (2026-09-16).** Jego półka to
     * „drewno, skóra i to, co zostaje z tuszy"; kord jest prostą, jednosieczną
     * głownią na zwykłej rękojeści — narzędziem człowieka, który nosi ostrze
     * codziennie, a nie kawałkiem wojskowego żelaza z pobojowiska. Stoi obok
     * sztyletu jako jego większy brat i domyka drabinkę „czym machać na
     * początku": kij → sztylet → kord.
     * ⚠ Zero nowych linii dialogu — `stick` i `dagger` już tu stoją bez
     * własnej kwestii.
     */
    "messer",
    /**
     * ⭐ **NÓŻ i ROHATYNA u Myśliwego (2026-09-17) — i obie prostują jedną
     * starą niezgodność tej półki, zamiast ją pogłębiać.**
     *
     * • **Nóż** jest dosłownie tym, co ta półka deklaruje: *„drewno, skóra
     *   i to, co zostaje z tuszy"*. Czymś trzeba oprawić zająca. Stoi obok
     *   kija i sztyletu i **dosuwa drabinkę od dołu**: kij → nóż → sztylet →
     *   kord.
     * • **Rohatyna** jest tu mimo tego, że włócznia stoi u Radzima — i to nie
     *   jest niekonsekwencja. Komentarz przy `spear` (2026-08) mówi wprost:
     *   *„oszczep na dziki byłby fabularnie ładniejszy"*, i odrzucił włócznię
     *   dlatego, że jest zwykłym wojskowym żelazem. Rohatyna nie jest: to
     *   **narzędzie jego zawodu**, z poprzeczką wymyśloną dokładnie po to,
     *   żeby dzik nie wszedł po drzewcu. ⛔ To nie otwiera decyzji o włóczni —
     *   ona zostaje u Radzima.
     *
     * ⚠ `stockQuality.weapon` to [2, 3], czyli **lepiej niż u Radzima [1, 2]**:
     *   to są rzeczy, których sam używa, a nie znaleziska z pobojowiska.
     * ⚠ Zero nowych linii dialogu — `stick`, `dagger` i `messer` też stoją
     *   tu bez własnej kwestii.
     */
    "knife",
    "boar_spear",
    /** ⭐ **Maczuga (2026-09-18)** — „drewno, skóra i to, co zostaje
     *  z tuszy". Gruby konar obrobiony w rękojeść nie ma w sobie ani grama
     *  żelaza, więc na półce kowala nie miałby czego szukać. ⚠ Zero nowych
     *  linii dialogu — `stick` stoi tu z tego samego powodu. */
    "great_club",
    "leather_helmet",
    "leather_chest",
    // Garbuje własne skóry, więc rękawice są u niego, a nie u Kowala.
    "leather_gloves",
    "leather_legs",
    "leather_boots",
    /**
     * ⚙ **Dopisane 2026-09-15 — było NIEOSIĄGALNE.** Utwardzana skóra weszła
     * z drugą partią pancerza (2026-09-12) bez żadnego dystrybutora.
     *
     * ⭐ Wszebor jest jedynym we wsi, kto **sam garbuje** — a utwardzanie skóry
     * (moczenie w wosku, formowanie, suszenie) jest krokiem TEGO fachu, nie
     * kowalskiego. Jego `stockQuality.armor` to [3, 4], więc wychodzi stąd
     * w dobrym albo wysokim wykonaniu: to jego własny wyrób, nie druga ręka.
     */
    "hardened_leather_chest",
    // ⚠ TYMCZASOWE — test mechaniki toreb (2026-08-26), nie ostateczna
    // decyzja sprzedawcy. Wszebor jest jedynym NPC ze skórzaną linią
    // (sam garbuje), więc na razie tu; ewentualna zmiana sprzedawcy —
    // `docs/odlozone.md` §1, wiersz „Sprzedawca toreb".
    "small_leather_pouch",
    "small_bag",
    "travelers_satchel",
    "leather_backpack",
    /**
     * ⭐ **ETAP TESTÓW (decyzja autora 2026-10-11): każda broń i każdy pancerz
     * stoi na jakiejś półce** — „łatwiej będzie testować wizualnie przedmioty na
     * tym etapie”. Poniższe sztuki nie miały dotąd sklepu (`OI-106`); rozdane
     * wg rzemiosła. Pilnuje `tools/dystrybucja_przymiar.mjs` (reguła etapu).
     * ⚠ Przed wydaniem do przeglądu (`docs/odlozone.md` §1).
     */
    "low_boots",
    "marching_boots",
    "leather_pauldrons",
    "studded_leather",
  ],
  /**
   * Placement search: candidate spots are tried at these radii (px) around the
   * player spawn, at 8 angles each, closest first. A spot is only accepted if
   * it clears every enemy spawn by at least `minDistanceFromEnemies` and isn't
   * inside solid terrain (water, trees, etc.) — so the shop never lands in the
   * middle of the rabbit den or on top of a pond.
   */
  spawnSearchRadii: [90, 130, 170, 220, 280],
  minDistanceFromEnemies: 150,
  /**
   * Quest ids this merchant gives out (turned in at the same NPC).
   *
   * **`stick_in_hand` moved to the Ojciec** — see the quest's own comment. It
   * means the Hunter has NOTHING to offer until that first quest is finished
   * (`rabbit_hunt` is gated behind it), which is deliberate: the stick is a
   * scene at home, not an errand in the forest. His `greetings.moreToTeach`
   * covers that window, so the conversation is never empty.
   */
  quests: ["rabbit_hunt", "scraps_bounty", "grey_wolf_revenge"],
  /**
   * His own art now (`ASSETS.hunter`, `portraitTexture` below) — a weathered
   * trapper with a bandaged left arm/shoulder (the wolf mauling that gives
   * him his `greeting`/`greetings.firstJob` lines their reason to exist —
   * see `docs/swiat.md`), drawn by `tools/build_hunter.py`. Generated with
   * the Kowal's own anchor as a STYLE/PROPORTION-only reference (not
   * identity) so the two NPCs read as the same low-fidelity sprite family
   * instead of drifting into two different fidelity levels — see
   * `docs/prompty_gemini.md` for the prompt and why the first attempt (no
   * reference image, adjectives only) came out too painterly/detailed.
   * `tint` stays wired as the fallback: if this texture ever fails to load,
   * `Merchant` falls back to the shared NPC.png portrait — no longer tinted
   * cool like the Kowal's fallback, since HE is NPC.png's reference look.
   */
  portraitTexture: "hunter-portrait",
  /** No tint — he's the reference look for NPC.png. */
  tint: null,
} as const;

/**
 * **Kowal** — the second shopkeeper, and the reason the Hunter's shelf could
 * shrink to things a trapper would plausibly own.
 *
 * A shop list is characterisation you get for free: splitting the stock along
 * "who could actually have made this" turns one catalogue into two crafts.
 * Wood, leather and carcasses at the Hunter; anything that came off an anvil
 * here — steel weapons, plate, and the rings, which are metalwork too.
 *
 * **Has his own portrait now** (`ASSETS.kowal`, `portraitTexture` below) —
 * a bald, bearded smith in a leather apron with his hammer, drawn by
 * `tools/build_kowal.py`. `tint` stays wired as the fallback: if that
 * texture ever fails to load, `Merchant` falls back to the shared NPC.png
 * portrait tinted cool, same as before real art existed.
 *
 * He stands in his own shed in the village (`village-zagaje.tmj`, west of
 * the plaza), not beside the Hunter's forest cabin — see "The village map"
 * in CLAUDE.md for why (a smoky forge next to the Hunter's hunting ground
 * would scare off what he hunts).
 */
export const BLACKSMITH = {
  id: "blacksmith",
  name: "Kowal",
  greeting:
    "Kuźnia stygnie, jak się nie kuje. Masz czym zapłacić, to mów, czego ci trzeba — żelazo swoje kosztuje.",
  /**
   * Dostał rolę 2026-08-14 (`droga_na_wschod`), więc doszły linijki zależne
   * od stanu zadania — `NpcDialog.pickGreeting` sięga po `firstJob`/`turnIn`/
   * `working`, a NPC z zadaniem i bez nich renderuje pustą ramkę powitania.
   */
  greetings: {
    broke: "Popatrz sobie. Popatrzeć nic nie kosztuje.",
    notYet:
      "Najpierw się we wsi rozejrzyj, chłopcze, potem przychodź do mnie po robotę. Nie wysyłam obcych na wschód.",
    firstJob:
      "Sobek u mnie był i gadał o kołach. Zawsze gada o kołach. Ale tym razem ma rację — siadaj, powiem ci, o co chodzi.",
    working: "Wschodnia gęstwina, przy samym trakcie. Trzy. I wracaj traktem, nie na skróty.",
    turnIn: "No? Przejedzie wóz czy nie przejedzie?",
    allDone:
      "Powiem wozakom, że można spróbować. Jeden pojedzie, reszta popatrzy, jak wróci. Tak się to zawsze odbywa.",
  },
  interactRange: MERCHANT.interactRange,
  /**
   * His own scale, not `MERCHANT.scale` — that field used to be shared back
   * when both NPCs rode the same 31×60 placeholder, but every NPC's actual
   * art is a different raw size now, so one shared multiplier over- or
   * under-sizes whichever NPC didn't set it. Tuned the same way as
   * MERCHANT.scale: lands at ~1.1× the player's on-screen height
   * (Character.png's 60px frame at PLAYER.scale 1).
   *
   * **Tuned against `ASSETS.kowalIdle`'s 87px frame height, NOT
   * `kowal_portrait.png`'s 67px** — he plays the idle-loop animation (see
   * `idleAnimKey` below) whenever it's loaded, which is the normal case, so
   * that's the texture actually on screen. Got this wrong on the first pass
   * of this fix (used the static portrait's height, landed at 87px = 1.45×
   * the player — caught only by reading `displayHeight` back from a live
   * Merchant instance in-engine, not by the arithmetic alone).
   */
  scale: 0.76,
  /**
   * Kowal WIEJSKI: kuje części do młyna, okucia i podkowy, co potwierdza
   * wprost już wydana kwestia Kowalowej (`rachunki`) i jego własna
   * (`z_czego_zyjesz`). **Broni, pancerza i pierścieni sam NIE kuje** — to
   * rozstrzygnięte wprost w jego temacie `bron_skad`: bierze je od wędrownych
   * kupców (płacących równie chętnie żelazem co monetą) i od ludzi
   * przynoszących znaleziska. Stąd `stockQuality` 1-2 dla obu kategorii —
   * towar z drugiej ręki, nie świeża robota. `docs/jakosc_wykonania.md` §3.2
   * opisuje sprzeczność, którą ten temat zamyka; nie usuwać stocku pod
   * pretekstem "to nie jego fach" — decyzja była: zostaje fabularnie
   * wyjaśniony, nie okrojony.
   */
  stockQuality: { weapon: [1, 2], armor: [1, 2] },
  /**
   * ⚠ **Puklerz na tej półce jest Podły, a nie Niski, i to jest decyzja
   * zakupowa, nie kosmetyka.** Hasz `vendorQuality` wystawiał obie tarcze
   * w tej samej jakości, przez co wybór między nimi był wyłącznie „taniej
   * czy mocniej" — czyli tym samym pytaniem, które zadaje już każda para
   * przedmiotów w sklepie. Rozsunięcie stanu na Podły i Niski dokłada drugą
   * oś: **za tarczą okutą stoi nie tylko cena, ale i to, w jakim stanie jest
   * ta tańsza rzecz.**
   *
   * Fabularnie to jest ta sama półka co zawsze: `bron_skad` mówi wprost, że
   * towar jest z drugiej ręki, a drewniany krążek z pasami zużywa się szybciej
   * niż deski spięte żelazem. Puklerz w dobrym stanie w ogóle nie trafia do
   * skupu — ten robi Sobek na zamówienie (`skora_na_pasy`).
   */
  stockQualityFor: { buckler: 1 },
  /** Everything that came off an anvil. */
  stock: [
    "hatchet",
    "sword",
    "axe",
    "hammer",
    /**
     * ⚠ **Dopisane 2026-08-26 — obie były NIEOSIĄGALNE.** Pałka i Krótki miecz
     * istniały w `ITEMS` od commita „Combat V1, Weapon identity refactor",
     * ale nie występowały w ŻADNYM sklepie, nagrodzie questowej ani loocie —
     * sprawdzone przemieceniem całego `src/`: poza własną definicją nie było
     * ani jednego wystąpienia. Martwa zawartość, której `tsc` nie widzi.
     *
     * ⚠ **Krótki miecz ma w `docs/systemy/weapons.md` D11 werdykt
     * ⛔ ODRZUCIĆ** („zasięg binarny, nie zmieniłby niczego wobec żadnego
     * przeciwnika"). Broń weszła do configu mimo tego werdyktu; udostępnienie
     * jej u Kowala jest **świadomą decyzją autora (2026-08-26)**, a nie
     * przeoczeniem — zapis rozstrzygnięcia w tamtym paragrafie.
     *
     * Jakość biorą z `stockQuality.weapon` [1, 2] jak reszta półki, czyli
     * trafiają tu GORSZE niż nominalne — żadnego wyjątku dla nich nie ma.
     */
    "short_sword",
    "club",
    /**
     * ⚠ **Obie dwuręczne u Radzima, tym samym uzasadnieniem co włócznia niżej:**
     * to jest kawał żelaza na drzewcu, a jego asortyment to towar z drugiej ręki
     * i odpadowe żelazo od wędrownych handlarzy. Zero nowych linii dialogu.
     * ⚠ `stockQuality.weapon` to [1, 2], więc oba trafiają na półkę GORSZE niż
     * nominalne — pierwsze wrażenie z nowej broni będzie zaniżone i to jest
     * własność sklepu, nie broni. Model: `docs/systemy/weapons.md`
     */
    "battle_axe",
    "war_hammer",
    /**
     * Włócznia u Radzima, a nie u Myśliwego — mimo że oszczep na dziki byłby
     * fabularnie ładniejszy. Asortyment Myśliwego to „drewno, skóra i to, co
     * zostaje z tuszy", a grot to kawałek żelaza; `bron_skad` mówi wprost, że
     * wędrowni handlarze płacą Radzimowi odpadowym żelazem i że ludzie
     * przynoszą mu znaleziska. Zero nowych linii dialogu.
     *
     * ⚠ Jego `stockQuality.weapon` to [1, 2], więc włócznia na półce jest
     * GORSZA niż nominalna — tak jak reszta jego towaru z drugiej ręki.
     */
    "spear",
    "steel_helmet",
    "steel_chest",
    "steel_legs",
    "steel_boots",
    "steel_gauntlets",
    /**
     * Komplet kolczy u Radzima — i jest to towar, który pasuje do jego półki
     * LEPIEJ niż stal obok, a nie gorzej.
     *
     * Zbroi nie kuje i mówi to wprost (`bron_skad`, `rachunki` Kowalowej), a
     * kolczugi nie wykułby zresztą żaden wiejski kowal: to kilkanaście tysięcy
     * kółek, miesiące roboty i osobny fach. Ale `bron_skad` mówi też, czym ta
     * półka NAPRAWDĘ jest — wędrowni handlarze płacą mu równie chętnie
     * odpadowym żelazem co monetą, a ludzie przynoszą znaleziska. Kolczuga
     * jest wręcz wzorcowym takim przedmiotem: przeżywa właściciela, nie zużywa
     * się jak drewno ani skóra i wraca do obiegu przez spadek albo pobojowisko.
     * A **łatanie** jej — wstawienie kółek w rozerwane oczko — to już robota
     * wiejskiego kowala, nawet jeśli uszycie całej nie jest.
     *
     * ⚠ Jego `stockQuality.armor` to [1, 2], więc komplet na półce jest
     * PODŁY albo NISKI: rdza, część oczek zaciągniętych zwykłym drutem. Cena i
     * obrona schodzą razem z jakością — dokładnie tak, jak reszta jego towaru
     * z drugiej ręki.
     */
    "mail_coif",
    "mail_hauberk",
    "mail_gloves",
    "mail_chausses",
    "mail_boots",
    /**
     * ⭐ **Siedem sztuk żelaznych — u Radzima i NIGDZIE INDZIEJ, bo to jest
     * dosłownie jego półka.** `bron_skad` mówi wprost, że wędrowni handlarze
     * płacą mu **odpadowym żelazem**, a ludzie przynoszą znaleziska. Tańszy
     * gatunek tego samego kształtu nie wymaga ani jednej nowej linii dialogu —
     * wymagałby jej raczej ten, kto sprzedaje wyłącznie stal.
     *
     * ⚠ **To jedyna decyzja CONTENTOWA w całym wdrożeniu gatunku**: mechanika
     * nie zmusza do wystawienia żelaza na żadnej półce, ale przedmiot, którego
     * nie da się kupić ani znaleźć, jest przedmiotem, którego nie ma.
     *
     * ⚠ Jego `stockQuality.armor` to [1, 2], więc żelazo na półce schodzi
     * jeszcze niżej — gatunek i jakość mnożą się **niezależnie** i dokładnie
     * tak ma być: „podłe żelazo" i „dobre żelazo" to dwie różne rzeczy.
     */
    "iron_helmet",
    "iron_chest",
    "iron_legs",
    "iron_boots",
    "iron_coif",
    "iron_hauberk",
    "iron_chausses",
    /**
     * ⚙ **Dopisane 2026-09-15 — obie były NIEOSIĄGALNE.** Krótka kolczuga
     * i półnogawice weszły do katalogu z drugą partią pancerza (2026-09-12)
     * i **nie miały żadnego dystrybutora**: ani sklepu, ani nagrody, ani łupu.
     * Ten sam rodzaj martwej zawartości, co pałka i krótki miecz wyżej.
     *
     * ⭐ Idą do Radzima z tego samego powodu, co pełna kolczuga: to towar
     * z drugiej ręki, który przeżywa właściciela i wraca do obiegu. Krótka
     * kolczuga jest wręcz bardziej „znaleziskowa" niż długa — tańsza, częstsza,
     * i to ją zwykle ma zwykły pieszy.
     */
    "short_hauberk",
    "demi_chausses",
    /**
     * ⚙ **Dopisane 2026-09-15 — pięć sztuk stali bez dystrybutora.**
     * Kapalin, brygantyna, kirys, nabiodrki i półtrzewiki leżały w `ITEMS` od
     * drugiej partii i **nie dało się ich zdobyć w grze w żaden sposób**.
     *
     * ⚠ **Kirys (17 kg, Siła 5, 130 g) to najcięższy przedmiot w grze** i jego
     * brak był jedynym powodem, dla którego najcięższy KUPOWALNY zestaw ważył
     * 36,5 kg zamiast 47,5 (`docs/playtest_protocol_oi105a.md` §1).
     *
     * ⚠ Wychodzą stąd w jakości 1–2 jak reszta półki — Radzim ich nie kuje
     * i nic tu tego nie zmienia. Płyta z drugiej ręki jest dokładnie tym, co
     * „ludzie przynoszą" z pobojowiska (`bron_skad`).
     */
    "kettle_hat",
    "brigandine",
    "cuirass",
    "cuisses",
    "half_sabatons",
    /**
     * ⭐ **DZIESIĘĆ KONSTRUKCJI z partii szerokości katalogu (2026-09-16).**
     * Wszystkie u Radzima i **zero nowych linii dialogu** — bo `bron_skad`
     * opisuje dokładnie taką półkę: wędrowni handlarze płacą mu odpadowym
     * żelazem, a ludzie przynoszą znaleziska. Kord, tasak, bastard i kiścień
     * to towar pospolity; szabla i rapier to rzeczy OBCE, czyli dokładnie to,
     * co zostawia po sobie wędrowny kupiec.
     *
     * ⚠ **Drzewcowe też tutaj, tym samym uzasadnieniem co włócznia** (patrz
     * wyżej): drzewce jest tanie, grot jest kawałkiem żelaza. Sobek robi
     * korpusy tarcz, ale piki nie sprzedaje żaden zapis.
     *
     * ⚠ Wychodzą stąd w jakości 1–2 (`stockQuality.weapon`), czyli GORSZE niż
     * nominalne — pierwsze wrażenie z nowej broni będzie zaniżone i to jest
     * własność sklepu, nie broni.
     *
     * ⚠⚠ **To podnosi jego półkę z 56 na 66 pozycji i JEST problemem**, tylko
     * nie tym, który da się naprawić wpisem w tablicy: dystrybucja stoi na
     * 21 ręcznych listach `stock`, a świat ma mieć regiony, gildie i kultury.
     * Zapisane jako dług dystrybucji — nie rozwiązuj go dosypywaniem kupców.
     */
    "cleaver_sword",
    "sabre",
    "rapier",
    "bastard_sword",
    "greatsword",
    "pike",
    "halberd",
    "glaive",
    "flail",
    /**
     * ⭐ **PIĘĆ KONSTRUKCJI z drugiej partii szerokości (2026-09-17).**
     * Ta sama półka, to samo uzasadnienie i **zero nowych linii dialogu** —
     * `bron_skad` opisuje ją dokładnie: wędrowni handlarze płacą odpadowym
     * żelazem, ludzie przynoszą znaleziska.
     *
     * • **Buzdygan** i **berdysz** to oporządzenie STRAŻY — kute seryjnie,
     *   więc wchodzą do obiegu partiami i wracają do obiegu tak samo.
     * • **Topór brodaty** jest jednocześnie narzędziem; takich rzeczy
     *   wiejski kowal dotyka co tydzień.
     * • **Nadziak** i **mizerykordia** to rzeczy OBCE — jazda i rycerstwo,
     *   czyli dokładnie ten towar, który zostawia po sobie wędrowny kupiec
     *   albo przynosi ktoś, kto wolał grosz od pytań.
     *
     * ⛔ **Cep bojowy i kilof NIE idą tutaj** — idą do Rolnika. Ich cała
     *   tożsamość stoi na tym, że **nie kupuje się ich u kowala**.
     * ⚠⚠ To podnosi półkę Radzima z 65 na 70 pozycji. Patrz dług `B2` —
     *   ⛔ nie rozwiązuj go dosypywaniem kupców.
     */
    /**
     * ⭐ **DRABINKA ROZMIARU — dwa miecze z korekty zakresu (2026-09-17).**
     *
     * • **Miecz długi** jest tu bez naciągania: to seryjne wojskowe żelazo,
     *   czyli dokładnie to, co wraca do obiegu po każdym pobojowisku.
     * • **Wielki miecz** jest ⚠ **NAJSŁABIEJ uzasadnioną pozycją na tej
     *   półce i to jest zapisane świadomie.** Dwumetrowa głownia za 600 g
     *   nie jest rzeczą, którą ktoś „przynosi wiejskiemu kowalowi" — należy
     *   do gildii albo do miasta. Stoi tu, bo **przedmiot bez dystrybutora
     *   jest przedmiotem, którego nie ma** (ta sama lekcja, co `OI-106`
     *   i co pałka z krótkim mieczem w 2026-08-26), a jedyną alternatywą
     *   byłoby dosypanie kupca — czego dług `B2` zabrania wprost.
     *   ⚠ Jego bramka Siły 8 i tak trzyma go poza zasięgiem gracza, który
     *   właśnie wszedł do kuźni.
     */
    /**
     * ⭐ **CZTERY KONSTRUKCJE z domknięcia puli (2026-09-18)** — ta sama
     * półka i to samo uzasadnienie (`bron_skad`), zero nowych linii dialogu.
     * • **Młot bojowy 1H** i **Korbacz** to seryjne żelazo zbrojnych;
     * • **Topór duński** i **Labrys** to rzeczy OBCE — pierwszy przychodzi
     *   z północy, drugi wygląda na zdjęty z ołtarza. Dokładnie ten towar,
     *   który zostawia po sobie wędrowny kupiec.
     * ⛔ **Maczuga i Widły NIE idą tutaj** — drewno należy do Myśliwego,
     *   a widy do Rolnika. Ich tożsamość stoi na tym, że nie są towarem
     *   z kowadła.
     */
    "war_hammer_1h",
    "chain_mace",
    "dane_axe",
    "labrys",
    "longsword",
    "zweihander",
    "mace",
    "war_pick",
    "bearded_axe",
    "bardiche",
    "misericorde",
    "ring_vigor",
    "ring_precision",
    "ring_swiftness",
    "ring_warding",
    /**
     * Obie tarcze — i to jest jedyny towar na tej półce, który NIE jest
     * sprzeczny z tym, co Radzim o sobie mówi. Zbroi nie kuje i przyznaje to
     * wprost (`bron_skad`, `rachunki` Kowalowej), ale tarcza to deski spięte
     * żelazem: korpus robi stolarz, okucie kowal. `docs/systemy/shields.md`
     * §12 notuje to jako miły efekt uboczny — tarcza częściowo **domyka**
     * sprzeczność z `docs/jakosc_wykonania.md` §3.2 zamiast ją pogłębiać.
     *
     * ⚠ Wychodzą stąd w jakości 1–2 (`stockQuality.armor`), czyli gorsze od
     * puklerza, którego robi Sobek na zamówienie (`skora_na_pasy`, jakość 3).
     * To jest zamierzone: kupujesz to, co ktoś przyniósł, albo zarabiasz na
     * rzecz zrobioną dla ciebie.
     */
    "buckler",
    "ironbound_shield",
    /**
     * ⭐ **Katalog tarcz metalowych — 23 sztuki (2026-09-16).** Ta sama półka,
     * ta sama logika: `bron_skad` mówi, że wędrowni handlarze płacą mu
     * odpadowym żelazem, a ludzie przynoszą znaleziska. Okucie i umbo bije
     * kowal, korpus robi Sobek — i to stoi wprost w jego temacie `kola`:
     * *„Obręcze bije mi Radzim — ja drewno, on żelazo".*
     *
     * ⚠ `stockQuality.armor` to [1, 2], więc **wszystko niżej wychodzi PODŁE
     * albo NISKIE** — drożej i gorzej niż drewno u Sobka (jakość 3). To jest
     * zamierzone: kupujesz to, co ktoś przyniósł, albo zamawiasz u stolarza.
     *
     * ⛔ **Drewniane tarcze poza puklerzem NIE idą tutaj** — korpus bez okucia
     * nie jest towarem z kowadła i miałby u niego zerowe uzasadnienie.
     */
    "iron_buckler",
    "iron_buckler_heavy",
    "steel_buckler",
    "steel_buckler_heavy",
    "iron_round_shield",
    "iron_round_shield_heavy",
    "steel_round_shield_heavy",
    "iron_heater_shield",
    "iron_heater_shield_heavy",
    "steel_heater_shield",
    "steel_heater_shield_heavy",
    "iron_almond_shield",
    "iron_almond_shield_heavy",
    "iron_scutum_light",
    "iron_scutum",
    "steel_scutum_light",
    "steel_scutum",
    /**
     * ⭐ **ETAP TESTÓW (decyzja autora 2026-10-11): każda broń i każdy pancerz
     * stoi na jakiejś półce** — „łatwiej będzie testować wizualnie przedmioty na
     * tym etapie”. Poniższe sztuki nie miały dotąd sklepu (`OI-106`); rozdane
     * wg rzemiosła. Pilnuje `tools/dystrybucja_przymiar.mjs` (reguła etapu).
     * ⚠ Przed wydaniem do przeglądu (`docs/odlozone.md` §1).
     */
    "spangenhelm",
    "splinted_greaves",
    "plate_pauldrons",
    "lamellar_coif",
    "lamellar_chest",
    "lamellar_legs",
    "lamellar_pauldrons",
    "scale_chest",
    "scale_legs",
    "scale_pauldrons",
  ],
  quests: ["droga_na_wschod"],
  /** Kowal niesie dwie rzeczy, których nie niesie nikt inny: **ekonomię**
   *  (dlaczego ta wieś w ogóle stoi — `docs/swiat.md` §3) i **drogę na
   *  północ**, czyli jedyne okno na świat poza Zagajami. Patrz komentarz
   *  „ŁAŃCUCH PYTAŃ" przy `MERCHANT.topics`. */
  topics: [
    {
      id: "z_czego_zyjesz",
      q: "Z czego żyje kowal w takiej dziurze?",
      a: "Myślisz, że z podków? Z młyna. Młyn to setka okuć, czopów i obręczy, a każda z nich pęka raz na parę lat. Do tego pługi i wozy, co tędy zajeżdżają po mąkę. Nie utrzymuje mnie wieś, chłopcze. Utrzymuje mnie to, że wieś ma co sprzedać.",
    },
    {
      // The direct answer to §3.2 in docs/jakosc_wykonania.md — the shop's
      // stock (weapons, steel armour, four rings) doesn't match a man who
      // just told you he lives off mill parts and horseshoes. Resolved as
      // backstory, not by trimming the stock: he doesn't forge any of it —
      // wandering traders pay him in odd iron as often as coin, and people
      // bring him finds. `stockQuality` (1-2 for both) already reads as
      // "second-hand", which is exactly what this confirms it is.
      id: "bron_skad",
      q: "Kujesz podkowy i części do młyna, a na półce masz miecze i zbroję?",
      a: "A niby kto by tu kuł miecz? Nikt go co dzień nie kupi. To, co widzisz na półce, biorę od wędrownych kupców — płacą różnie, czasem monetą, czasem żelazem, co już gdzieś było w robocie. Resztę ludzie przynoszą sami, znajdą coś, wolą grosz od pytań. Nie kułem tego. Sprzedaję, bo leży bezużyteczne, a komuś posłuży.",
      after: ["z_czego_zyjesz"],
    },
    {
      id: "miasto",
      q: "Wozy? To dokąd stąd jeździ droga?",
      a: "Na północ, przez most, i dalej — do miasta. Cztery dni wozem, jak nie pada. Byłem tam raz, na czeladnika. Widziałeś kiedyś tablicę zleceń? Nie tę naszą, przy karczmie. Prawdziwą. Człowiek zdejmuje z niej kartkę i wraca kimś innym.",
      after: ["z_czego_zyjesz"],
    },
    {
      id: "pajaki",
      q: "Skąd we wschodniej gęstwinie tyle pajęczyny?",
      a: "Nie pytaj mnie o pająki, pytaj o wozy. Trzy lata temu jeździło się na wschód po drewno na osie — twarde, proste, najlepsze jakie było. Teraz nikt tam nie jedzie. Nikt niczego nie widział, nikt nikomu nie zabronił. Po prostu przestali. Wozacy tak mają: wiedzą wcześniej niż wiedzą.",
      after: ["gestwina"],
    },
  ],
  /** His own art — see the doc comment above. Must match `ASSETS.kowal.key`
   *  (declared later in this file, so it can't be referenced directly here). */
  portraitTexture: "kowal-portrait",
  /** Cool steel tint, used only if `portraitTexture` fails to load. */
  tint: 0x8fa8c8,
  /**
   * A real 10-frame south-facing idle loop (`ASSETS.kowalIdle`,
   * `tools/build_kowal_idle.py`) — breathing, a hand sway, small cloth
   * settling. He's the first NPC with actual secondary motion instead of
   * one static portrait frame; must match the anim key registered in
   * `Animations.ts`. Falls back to `portraitTexture` (then further to the
   * shared NPC.png placeholder) if the spritesheet or the anim didn't load.
   */
  idleAnimKey: "kowal-idle",
} as const;

/**
 * Flavour villagers — first pass at "giving the village life"
 * (`docs/swiat.md`'s "Rodziny rolnicze" / "Rdzeń" cast: a peasant, the
 * miller, the village elder). Talk-only for now: empty `stock`/`quests`,
 * same "may be empty" shape `NpcDef` already documents. Handel/Zadania/
 * Szkolenie still show up in the dialogue hub (those three rows are
 * unconditional — see `NpcDialog.refreshOptions`) but render empty, same
 * as the Blacksmith did before he had stock. Real dialogue/quests (the
 * notice-board stand-in for the Sołtys, the miller's "not enough grain"
 * line) are future work once that content exists — this is presence, not
 * mechanics yet.
 *
 * All three share BLACKSMITH's `scale` — their portraits all crop to the
 * same 87px content height as `kowal_portrait.png`/`kowal-idle` did, so
 * the same ratio (~1.1× the player's on-screen height) applies unchanged.
 */
export const PEASANT = {
  id: "peasant",
  name: "Rolnik",
  greeting: "Zboże samo się nie zbierze. Jak coś złapiesz w lesie, u Myśliwego to sprzedasz.",
  /** Wymagane od chwili, gdy dostał zadanie: `NpcDialog.pickGreeting` sięga
   *  po `firstJob`/`turnIn`/`working`, a NPC z zadaniem i bez tych linijek
   *  renderuje pustą ramkę powitania (ta pułapka złapała już Gniewka). */
  greetings: {
    notYet:
      "Rośnie samo, młodziku. Jak będziesz miał ręce wolne i coś umiał, to pogadamy — teraz mam robotę.",
    firstJob:
      "Miłosz cię przysłał? To dobrze, bo ja bym nie poszedł prosić. Chodź na miedzę, pokażę ci, którędy chodzą.",
    working: "Od strony lasu, tam jest najgorzej. I nie depcz mi zagonów bardziej niż one.",
    turnIn: "No i jak? Mów liczbę, nie opowiadaj.",
    allDone:
      "Zagony stoją. Do żniw wystarczy, a potem i tak wszystko zacznie się od nowa. Tak to jest z polem.",
  },
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  /**
   * ⭐ **PIERWSZA PÓŁKA ROLNIKA (2026-09-17) — dwie pozycje i ani jednej
   * więcej.** Do tej pory miał `stock: []`.
   *
   * ⚠⚠ **To nie jest sklep — to jest ZDANIE O ŚWIECIE zapisane w danych.**
   * Cep i kilof są jedynymi dwiema broniami w katalogu, których tożsamość
   * brzmi *„nikt tego nie kupił jako broni"*. Postawienie ich u Radzima
   * skasowałoby dokładnie tę treść: kilof z półki kowala jest zwykłym
   * towarem, kilof od chłopa jest kilofem.
   *
   * ⚠ `stockQuality.weapon` [2, 3] — **lepiej niż u Radzima** i z tego
   * samego powodu, co u Myśliwego: to są rzeczy, których sam używał, a nie
   * znaleziska. Zużyte, ale nie rdzewiejące.
   *
   * ⛔ Zero nowych linii dialogu i ⛔ zero nowych pozycji „bo półka wygląda
   * pusto". Rolnik nie jest kupcem i ma nim nie zostać.
   */
  stockQuality: { weapon: [2, 3] },
  stock: ["peasant_flail", "pitchfork"],
  quests: ["zajace_w_zbozu"],
  topics: [
    {
      id: "ile_zjadaja",
      q: "Ile tego zboża te zające naprawdę zjadają?",
      a: "Nie liczy się, ile zjedzą. Liczy się, ile **stratują**. Zając wchodzi w łan, wyjada kłos u dołu i kładzie źdźbło. Jeden zając na noc kładzie tyle, co zje trzech. Chodź o świcie na moje pole i sam zobacz, którędy szły.",
    },
    {
      id: "dobek_o_tobie",
      q: "Nie masz nic przeciwko, że robi to chłopak z sąsiedztwa?",
      a: "Mam coś przeciwko temu, że nie robi tego nikt. Ty przynajmniej wracasz z czymś. Tylko jedno ci powiem: nie chodź tam głodny i nie chodź tam po ciemku. Reszty się nauczysz.",
      after: ["ile_zjadaja"],
    },
  ],
  portraitTexture: "peasant-portrait",
  tint: 0x8fbf8f,
} as const;

export const MILLER = {
  id: "miller",
  name: "Młynarz",
  greeting: "Mąka się sama nie zmiele. Jak zboża zabraknie, to nie tylko mój kłopot.",
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  stock: [],
  quests: [],
  /** Młynarz niesie **stawkę**: `docs/swiat.md` §3 mówi, że młyn jest powodem,
   *  dla którego ta osada w ogóle tu stoi — a więc jeśli zające zjedzą zboże,
   *  „będzie głodno" zamienia się w „osada się rozejdzie". Bez tej rozmowy
   *  pierwsze zadanie w grze to zabijanie królików dla dniówki. */
  topics: [
    {
      id: "mlyn",
      q: "Po co komu młyn w takiej małej wsi?",
      a: "Odwróć pytanie, to zrozumiesz. Nie wieś ma młyn. Młyn ma wieś. Najpierw stanęło koło nad rzeką, bo tu nurt akurat wystarcza. Potem ludzie zaczęli siać, bo było gdzie zemleć. Potem doszła droga, bo mąkę trzeba wywieźć. Zdejmij młyn i zostaje siedem chałup nad wodą bez powodu.",
    },
    {
      id: "bez_zboza",
      q: "A jak zboża zabraknie?",
      a: "To ja nie mam czego mleć, kowal nie ma czego kuć, a wozy przestają zajeżdżać. Rok bez żniw wieś przetrzyma na zapasach i na złości. Drugiego nie przetrzyma — ludzie po prostu wyjdą, po jednej rodzinie, i nikt nawet nie powie, że coś się stało. Widziałem to w Kętach za młodu.",
      after: ["mlyn"],
    },
    /**
     * ODESŁANIE do Dobka (`zajace_w_zbozu`) — ten sam wzorzec, którym
     * Myśliwy (`owce`) posyła gracza do Gniewka: zlecenia, na które nie da
     * się wpaść przypadkiem, bo zleceniodawca sam nie pójdzie prosić.
     *
     * Miłosz jest do tego właściwym człowiekiem, a nie pierwszym z brzegu:
     * `bez_zboza` (warunek `after`) mówi jego głosem, że mniej zboża to
     * mniej mielenia, a dwa lata bez żniw i wieś się rozchodzi. On jako
     * jedyny widzi stratę Dobka jako stratę WŁASNĄ — i dlatego to on
     * zauważa problem, którego rolnik nie zgłosi.
     */
    {
      id: "zajace_u_dobka",
      q: "Komu ubywa najwięcej?",
      a: "Dobkowi, i to nie dlatego, że ma pecha, tylko dlatego, że ma najwięcej. Połowa tego, co mi tu przywożą, jedzie z jego zagonów. On ci nie powie ani słowa, bo to człowiek, który woli stracić niż poprosić — ale ja liczę worki i widzę, że w zeszłym roku było ich mniej niż powinno. Idź do niego i zapytaj wprost o zające. Tylko nie mów mu, że ja cię posłałem, bo się obrazi na dziesięć lat.",
      after: ["bez_zboza"],
    },
  ],
  portraitTexture: "miller-portrait",
  tint: 0xd8cba0,
} as const;

export const ELDER = {
  id: "elder",
  /**
   * ⚠ **Dopisane 2026-08-22 — luka, nie spór.** `wioska_plan.md:685`,
   * `swiat.md:273` i komentarz w `allDone` niżej (odsyłający do
   * `swiat.md §7`) zawsze zakładały imię „Dobiesław" — pole po prostu nigdy
   * go nie dostało. Sprawdzone źródłowo po tym, jak wcześniejsza wersja tego
   * dokumentu błędnie twierdziła, że Sołtys jest celowo bezimienny.
   */
  name: "Dobiesław, Sołtys",
  greeting: "Odstrzał to urząd, nie zabawa. Myśliwy go pełni — jego pytaj, nie mnie.",
  /**
   * The second quest giver in the game, and the first outside the forest.
   *
   * `greetings` is not optional the moment an NPC has a quest: `pickGreeting`
   * reaches for `firstJob`/`turnIn`/`working` as soon as one exists, and an NPC
   * with quests but no lines would render an empty greeting box.
   */
  greetings: {
    firstJob:
      "Wiem, kto jesteś — Markowic. Wiem też, czyją robotę teraz robisz. Skoro tak, to mam do ciebie sprawę, nie zlecenie.",
    newJob: "Jest jeszcze jedna rzecz, jak masz chwilę.",
    working: "Nie spiesz się. Wieś nigdzie nie ucieknie, a ludzie i tak w polu do zmierzchu.",
    turnIn: "No i widzisz. Ludzie już wiedzą, kto chodzi po lesie. Dobrze.",
    /**
     * Odkąd Sołtys ma drugie zadanie (`mysliwy_z_zagajow`), ta kwestia pada
     * dopiero PO scenie nazwania — i dlatego dopiero teraz jest na swoim
     * miejscu. Wcześniej była pierwszym śladem sceny, której nie było;
     * `docs/swiat.md` §7 notował ją właśnie tak (🟡). Teraz jest echem, nie
     * zapowiedzią, i „tak, słyszałeś dobrze" odnosi się do czegoś, co gracz
     * naprawdę usłyszał zdanie wcześniej.
     */
    allDone: "Trzymaj się, myśliwy. Tak, słyszałeś dobrze.",
  },
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  stock: [],
  quests: ["know_the_village", "mysliwy_z_zagajow"],
  /** Sołtys niesie **urząd i płoty** — czyli odpowiedź na pytanie, którego
   *  większość gier RPG nigdy nie zadaje: dlaczego odstrzału nie da się
   *  zastąpić murem (`docs/swiat.md` §3). */
  topics: [
    /**
     * Bandyci (`OI-171`): przyczyna z NIŻSZEGO, już odsłoniętego szczebla
     * (Myśliwy nie chodzi na obchód) — ⛔ nic wyżej.
     */
    {
      id: "soltys_zboje",
      q: "Zbóje za rzeką — to coś nowego?",
      a: "Zawsze jacyś byli. Siedzieli cicho, póki Myśliwy chodził traktem — jak wiedzą, że ktoś patrzy, to i ręce trzymają przy sobie. Teraz nie chodzi, to wyszli z lasu. Ciechan ci powie więcej, to jego wóz.",
      after: ["zrabowany_woz_temat"],
    },
    {
      id: "palisada",
      // ⚠ id zostaje „palisada" (2026-10-09, owalnica): zbiór zadanych pytań jest
      //   w zapisie, a pytanie dalej jest o to samo — czemu wieś nie ma muru.
      q: "Czemu nie macie palisady? Płot dzik przeskoczy.",
      a: "Palisada to robota dla grodu — tam jest kasztelan, załoga i ludzie do pilnowania bramy. Wieś stawia płot: żeby bydło zostało w środku, a zwierz poszedł bokiem. Na dzika płot nie wystarczy, wiem. Ale zająca nie zatrzyma nawet palisada — podkopie, prześlizgnie się, wejdzie i tak. Dlatego odstrzału **nie da się zastąpić murem** i dlatego ten urząd w ogóle istnieje. Płot pilnuje obejścia. Myśliwy pilnuje pola.",
    },
    {
      id: "mysliwy_poza",
      q: "Czemu Myśliwy mieszka poza wsią?",
      a: "Bo tam ma robotę. Suszarnie, wędzarnia, ognisko — tego się w obejściu nie postawi, sąsiedzi by go zjedli żywcem za sam smród. Siedzi przy skraju od dwudziestu lat i nikomu to nie przeszkadzało. Aż raz przeszkodziło.",
      after: ["palisada"],
    },
    {
      id: "szary_wies",
      q: "Wieś wie o tym wilku? Nikt nic nie zrobił?",
      a: "Wie. Wieś wie o wszystkim i nie może nic. Pomyśl: kogo miałbym posłać? Kowala od kowadła? Młynarza od koła? Rolników w środku sianokosów, żeby poszli po lesie z widłami szukać czegoś, co widzi ich pierwsze? Nie posyła się ośmiu ludzi na jednego wilka. Posyła się jednego, który się na tym zna. A ten leży z rozerwanym ramieniem.",
      after: ["szary"],
    },
  ],
  portraitTexture: "elder-portrait",
  tint: 0xb8a8c8,
} as const;

/**
 * Ojciec and Mama — the prologue's own household, standing outside the
 * player's cottage (`"dom gracza"`, `tools/build_wioska.py`). No building
 * interiors exist yet (`docs/swiat.md`'s "Wnętrza" section is still
 * unbuilt), so — same as every other flavour villager — they stand
 * outside the door rather than literally inside the house.
 *
 * **They have names — Marko and Alina — but `name` deliberately stays
 * "Ojciec"/"Mama".** The label above a head is the PLAYER's point of
 * view, and the player is their son: he doesn't call his father "Marko".
 * The names exist for everyone ELSE to use — the relations layer in
 * `docs/swiat.md` ("matka bohatera wymienia jajka na mąkę") is written
 * from the village's perspective, not his. Put them in other villagers'
 * dialogue when that content exists; don't "fix" the labels here.
 */
export const FATHER = {
  id: "father",
  name: "Ojciec",
  greeting: "Zboże nie zejdzie samo. Idź, jak musisz — ale wracaj przed zmrokiem.",
  /**
   * The third quest giver, and the first one the player ever meets — he hands
   * over the stick (`QUESTS.stick_in_hand`, moved here from the Hunter).
   *
   * `greetings` stops being optional the moment an NPC has a quest:
   * `NpcDialog.pickGreeting` reaches for `firstJob`/`turnIn`/`working` as soon
   * as one exists, and every branch would otherwise fall back to the same
   * single line — a man who just stopped you at the gate and a man watching
   * you already holding the stick have no business saying the same thing.
   */
  greetings: {
    /** Nic jeszcze nie wziąłeś. On zatrzymuje cię w progu — to jest ta scena.
     *  ⚠ 2026-08-20: dopisana instrukcja o Patryczku — drugi cel zadania,
     *  patrz komentarz nad `QUESTS.stick_in_hand`. */
    firstJob:
      "Stój. Nie wypuszczę cię za wieś z pustymi rękami, choćbyś się na mnie boczył do wieczora. I nie łaź tam sam — zabierz Patryczka.",
    /** Kij w torbie i/albo jeszcze nie było rozmowy z Patryczkiem — jeden
     *  wspólny tekst na oba brakujące cele, tak jak u Sołtysa (`ELDER.
     *  greetings.working`) przy trzech celach `know_the_village`. */
    working: "Widzę, że wziąłeś. W torbie ci nikogo nie odgoni, synu. Do ręki — i pamiętaj, miałeś zabrać Patryczka.",
    /** Oba cele spełnione. Odpowiedź na Patryczka jest tu STAŁA, nie
     *  warunkowa — kanon jest jeden: on nigdy faktycznie nie idzie (złamana
     *  ręka), więc ojciec może o tym mówić bez rozgałęziania tekstu. */
    turnIn: "No, widzę, żeś zajrzał do Patryczka po drodze. Sam nie idzie? Ta ręka w łubkach... no trudno. Przynajmniej wiesz teraz, po co idziesz.",
    /** Wszystko przekazane — wraca do swojego zwykłego tonu. */
    allDone: "Kij masz, głowę masz. Z tych dwóch ważniejsza jest ta druga. Idź już.",
  },
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  stock: [],
  quests: ["stick_in_hand"],
  /** Ojciec i Mama niosą **konflikt domowy** z `docs/swiat.md` §2, i tylko
   *  jako parę da się go zagrać: ojciec się sprzeciwia, matka pakuje
   *  zawiniątko, więc wyjście z domu jest dwuznaczne zamiast jednostronnego.
   *  Dlatego `strach` u Ojca stoi ZA `ojciec` u Mamy — najpierw dowiadujesz
   *  się od niej, co to naprawdę jest, potem możesz go o to zapytać.
   *
   *  `mysliwy_ojciec` otwiera drugi łańcuch (wojsko) — patrz duży komentarz
   *  „ŁAŃCUCH PYTAŃ" przy `MERCHANT.topics`. Ojciec **odmawia** tu mówienia
   *  i to jest cała jego rola w tym ogniwie: gdyby opowiedział sam, nie
   *  byłoby powodu, żeby zapytać Myśliwego, a cały łańcuch istnieje po to,
   *  żeby wiedzę nosić między ludźmi. */
  topics: [
    {
      id: "pole",
      q: "Naprawdę nie dasz rady bez mnie na polu?",
      a: "Dam radę. Wolniej. Biodro mi siada od trzeciej godziny i wtedy zostawiam pług, siadam na miedzy i czekam, aż przestanie łupać. Trzydzieści lat i ani jednego roku, w którym się nie udało. Nie jestem kaleką, synu. Jestem stary. To co innego i wolałbym, żebyś to rozumiał.",
    },
    {
      id: "mysliwy_ojciec",
      q: "Ty i Myśliwy. Znacie się jakoś bliżej niż reszta wsi.",
      a: "Znam go dłużej, niż ty żyjesz. Wtedy obaj mieliśmy po dwie zdrowe ręce i ani grama rozumu. Tyle. Idziesz do niego i tak — jak zechce, to ci sam powie, ile uzna za stosowne. Ja się do tego wracał nie będę.",
    },
    {
      id: "wojna",
      q: "Myśliwy opowiedział mi o wojsku.",
      a: "Opowiedział? To albo miał bardzo dobry dzień, albo bardzo zły. ...Nie będę ci mówił, że tam było źle, bo mi nie uwierzysz, póki sam nie zobaczysz — a wolałbym, żebyś nie zobaczył. Powiem ci co innego. Żaden z nas nie odpuścił dlatego, że nam kazali. Odpuściliśmy, bo każdemu z nas został w końcu jeden powód, żeby wieczorem wracać do domu. Ja swój wtedy dopiero poznałem. On swojego nigdy nie znalazł, i to jest cała różnica między nami dwoma. Idź. Tylko wracaj.",
      after: ["ojciec_wojsko"],
    },
    {
      id: "strach",
      q: "Mama mówi, że ty się nie gniewasz, tylko boisz.",
      a: "...Powiedziała ci tak? Hm. No to nie będę z nią dyskutował, bo się zwykle nie myli. Idź. Tylko zapamiętaj jedno: pole zawsze tu będzie. To nie jest zaleta pola, tylko jego jedyna obietnica. Ty tak nie musisz.",
      after: ["ojciec"],
    },
  ],
  portraitTexture: "father-portrait",
  tint: 0x9fb0c8,
} as const;

export const MOTHER = {
  id: "mother",
  name: "Mama",
  greeting: "Uważaj na siebie w tym lesie. Ja tu upilnuję gospodarstwa.",
  /**
   * `prowiant_od_matki` — pierwsze zadanie Aliny (2026-08-20, `QUEST_01_
   * WSTEP_DO_MYSLIWEGO.md`, zaadaptowane). Zero objectives, więc `working`
   * poniżej praktycznie nigdy się nie pokaże (przyjęcie od razu spełnia cel)
   * — dopisany mimo to, bo `NpcDialog.pickGreeting` wymaga kompletu odkąd
   * NPC ma jakiekolwiek zadanie (patrz identyczna uwaga przy `FATHER`).
   */
  greetings: {
    firstJob:
      "Ojciec cię przysłał, prawda? Sam by cię wypuścił z kijem i pustym żołądkiem. Masz. I nie zjedz wszystkiego, zanim wyjdziesz za opłotki.",
    working: "Chleb już w torbie. Idź, zanim ojciec znowu zacznie się złościć, że cię zatrzymuję.",
    turnIn: "Chleb już w torbie. Idź, zanim ojciec znowu zacznie się złościć, że cię zatrzymuję.",
    allDone: "Uważaj na siebie w tym lesie. I nie zapomnij zjeść.",
  },
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  stock: [],
  quests: ["prowiant_od_matki"],
  topics: [
    {
      id: "ojciec",
      q: "Ojciec się na mnie gniewa?",
      a: "Nie gniewa się. Boi się. To brzmi u niego tak samo, bo nigdy nie nauczył się mówić drugiego inaczej niż pierwszym. Trzydzieści lat wie, że jak się rano wstanie i pójdzie w pole, to wieczorem coś z tego będzie. Ty właśnie robisz coś, gdzie tego nie wiadomo. Idź do niego i powiedz mu to, co ja ci teraz powiedziałam.",
    },
    {
      id: "alina",
      q: "Myśliwy mówi, że tata rzucił wojsko, kiedy cię poznał.",
      a: "Ładnie to ujął. Prawda jest brzydsza: rzucił dobre trzy miesiące później, a przez te trzy miesiące nie odezwał się do mnie ani jednym słowem — przychodził wieczorem, stał przy płocie jak słup i szedł. Myślałam, że go coś w głowie ruszyło. I nie stawiaj mnie w tej opowieści za powód, dzieciaku. Byłam tylko czymś, na co dało się patrzeć zamiast na to, co miał pod czaszką. Powód siedział w nim. U ciebie będzie tak samo, cokolwiek sobie po drodze znajdziesz.",
      after: ["ojciec_wojsko"],
    },
    {
      id: "puscilas",
      q: "A ty? Czemu mnie puszczasz?",
      a: "Bo cię nie da się nie puścić, a chcę wiedzieć, dokąd idziesz. Gospodarstwa upilnuję. Kur upilnuję. Ojca upilnuję, choć to najtrudniejsze z tej trójki. Ty tylko wracaj i mów mi prawdę, jak coś pójdzie nie tak. Resztę jakoś poukładam.",
      after: ["ojciec"],
    },
  ],
  portraitTexture: "mother-portrait",
  tint: 0xd8a8b8,
} as const;

/**
 * **Dorota Zielarka** — the fourth flavour villager, and the first one with
 * a real shop instead of just a greeting line. `docs/wioska_plan.md` D-3
 * decided she sells `health_potion` (moved OUT of MERCHANT.stock above),
 * not the Hunter — thematically closer (she brews the medicine, he skins
 * carcasses) and it's the same "a shop list is free characterisation"
 * principle that already split metal off to the Kowal.
 *
 * `docs/swiat.md` is explicit that she is **not** an alchemist or a witch —
 * herbs, bandages, midwifery, nothing mystical. Her greeting stays plain and
 * practical for that reason; no "brewing" or "potion" flavour language.
 *
 * Has her own portrait (`ASSETS.herbalist`, `tools/build_dorota.py`) — the
 * `tint` below is now only the fallback if that texture ever fails to load.
 */
export const HERBALIST = {
  id: "herbalist",
  name: "Zielarka",
  greeting: "Ziół nie brak, jeno trzeba wiedzieć, gdzie szukać. Mikstura gotowa, jak masz czym zapłacić.",
  interactRange: MERCHANT.interactRange,
  scale: BLACKSMITH.scale,
  stock: ["health_potion"],
  /** Druga dawczyni zadań poza lasem — i pierwsza, której zadania nie polegają
   *  na zabijaniu. Oba są zbierackie i **rozdzielone geograficznie**: pierwsze
   *  robi się w całości wewnątrz wsi, drugie wygania na leśne polany. */
  quests: ["zielarskie_zapasy", "dziurawiec_na_zime"],
  greetings: {
    firstJob:
      "Zbierasz coś przy okazji, czy tylko depczesz? Bo jak masz i tak łazić po miedzach, to mogę ci powiedzieć, po co się schylać.",
    newJob:
      "Skoro odróżniasz już liść od liścia, to mam coś trudniejszego. Siadaj.",
    working:
      "Jeszcze nie masz. Widzę po rękach — kto zbierał, ten ma zielone paznokcie.",
    turnIn: "Dawajże, obejrzę. Jak zerwane byle jak, to i tak powiem.",
    /**
     * ⚠ **Odsyła z powrotem do Patryczka** — to jest jedyne miejsce, w którym
     * gracz dowiaduje się, że łańcuch ma jeszcze jedno ogniwo. Ten sam wzorzec
     * co `MERCHANT.topics.owce` → Gniewko i `MILLER.topics.zajace_u_dobka` →
     * Dobek: zadanie, na które nie da się wpaść przypadkiem, musi mieć kogoś,
     * kto o nim powie. Bez tej linii `rekawice_od_wnuka` odblokowuje się po
     * cichu u postaci stojącej po drugiej stronie wsi.
     *
     * Mówi to jego babka i mówi po swojemu — nie „idź do niego", tylko
     * obserwacja, z której to wynika.
     */
    allDone:
      "Masz oko. Naprawdę. Połowa wsi chodzi po tym samym polu od trzydziestu lat i dalej nie wie, co po nim rośnie. A, i jeszcze jedno: wnuk czegoś od ciebie chce. Nie powiedział czego, bo on nigdy nie mówi — ale chodzi koło mnie od dwóch dni, więc idź i go z tego wyswobodź.",
  },
  /** Zielarka jest jedyną osobą we wsi, która **chodzi po lesie z wyboru** —
   *  dlatego to ona, a nie Myśliwy, domyka ogniwo „co wypchnęło wilka".
   *  `docs/swiat.md` jest kategoryczne, że **nie jest wiedźmą ani alchemiczką**:
   *  jej odpowiedzi mają być obserwacją zbieraczki, nie wróżbą. Nie dopisuj jej
   *  mistyki, bo to najtańszy sposób na zepsucie „ciepłego realizmu". */
  topics: [
    {
      id: "ziola",
      q: "Ludzie mówią o tobie różnie. Co ty właściwie robisz?",
      a: "Zbieram, suszę, mielę i wiążę. Na gorączkę wierzbowa kora, na ranę krwawnik i czysta szmata, na poród moje dwie ręce i cudza cierpliwość. Żadnych zaklęć, żadnego gadania z księżycem. Jak ktoś ci powie inaczej, to znaczy, że mu nie dałam na borg.",
    },
    {
      id: "gestwina",
      q: "Chodzisz po lesie. Co jest we wschodniej gęstwinie?",
      a: "Pajęczyna. Nie taka między dwiema gałęziami, tylko taka od drzewa do drzewa, na wysokość człowieka, gruba jak sznurek. Chodziłam tam po miodunkę od dziesięciu lat. Ostatnio zawróciłam po stu krokach i nie wstydzę się tego powiedzieć. Tam nic mnie nie goniło. Tam po prostu **coś czekało**, i to jest gorsze.",
      after: ["czemu_zszedl"],
    },
    /**
     * ── ZIOŁA: JEDEN TEMAT WSTĘPNY + PIĘĆ ODBLOKOWYWANYCH ZNALEZISKIEM ──────
     *
     * Układ jest celowy i wynika wprost z krytyki „katalogu": gdyby wszystkie
     * pięć roślin dało się od razu odpytać, byłaby to lista pięciu wierszy do
     * odklikania, o które gracz nie ma powodu pytać. Zamiast tego:
     *
     *   1. `gdzie_szukac` — dostępny od razu. Ona mówi, GDZIE patrzeć, zanim
     *      cokolwiek znajdziesz. To jest ta jedna rzecz, która realnie skraca
     *      graczowi drogę — pierwsza informacja w tej grze, która coś robi.
     *   2. gracz idzie i znajduje roślinę, zbiera ją (`Gathering.discover`,
     *      cicho — zbiór sam w sobie nie uczy niczego, jest zwykłym „+1").
     *   3. dopiero wtedy pojawia się `o_<roślina>` (`requiresHerb`) — ona,
     *      i tylko ona, uczy: dokładne siedlisko i do czego to służy.
     *
     * **Cała nauka siedzi w Zielarce, nie w akcie zbierania.** Wcześniejsza
     * wersja pokazywała ciekawostkę dymkiem nad rośliną w chwili zerwania —
     * zgłoszone wprost jako nielogiczne („informację o występowaniu ma dawać
     * roślina [czyli rozmowa o niej], a nie jej zebranie") i psujące tempo
     * gry dymkiem trzymanym 4 sekundy. „Gra bawi, gra uczy" oznacza: Zielarka
     * tłumaczy miejsce zbioru i prawdziwe zastosowanie — zbieranie tylko
     * odblokowuje, że wolno o to zapytać, bo trzeba było znaleźć roślinę w
     * polu, żeby mieć o co pytać.
     *
     * **Wszystkie pięć tematów ma DRUGĄ bramkę: `requiresQuest` na jedno z
     * `QUESTS.zielarskie_zapasy`/`dziurawiec_na_zime`.** Dorota wypowiada się
     * dopiero PO tym, jak faktycznie jej pomożesz — nie przy pierwszym
     * zerwaniu byle gdzie. Zasada wprost od użytkownika: „nie ma nic za darmo
     * w świecie, ty pomogłeś mi, ja pomogę tobie". Babka i pokrzywa nie są
     * celem żadnego jej zadania, ale to nie znaczy, że są za darmo — czekają
     * na ukończenie `zielarskie_zapasy`, dokładnie jak krwawnik i rumianek,
     * bo TO jest przysługa, która otwiera jej zaufanie w ogóle, nie tylko do
     * dwóch konkretnych roślin. Dziurawiec, jako jedyny spoza wsi (błonia przy lesie), czeka na
     * cięższe, drugie zadanie.
     *
     * ⚠ Rama jest **w-świecie, nie medyczna**: „tak się tego u nas używa", nie
     * „weź to na X". Dorota jest wiejską zielarką z 1050 roku, a nie ulotką;
     * przy dziurawcu ta różnica jest zresztą nie tylko stylistyczna.
     */
    {
      id: "gdzie_szukac",
      q: "Chodzę i tak po polach. Czego mam wypatrywać?",
      a: "Nie chodzi się „po zioła”. Chodzi się po babkę, po krwawnik, po rumianek — i każde stoi gdzie indziej. Babka trzyma się dróg i wydeptanych klepisk, bo znosi to, czego trawa nie zniesie. Pokrzywa siedzi przy oborach i płotach, gdzie ziemia tłusta. Krwawnik i rumianek chcą otwartego i suchego — miedze, ugory, skraje pól. A po dziurawiec musisz na słoneczną polanę albo skraj lasu — w cień za nim nie idź. Zapamiętaj to raz, a nie będziesz szukał, tylko szedł.",
      after: ["ziola"],
    },
    {
      id: "o_babka",
      q: "Zerwałem babkę. Co to właściwie jest?",
      a: "Babka lancetowata. Wąski liść w podłużne żyłki, a z niego jeden goły kłos. Rośnie tam, gdzie się chodzi — i to nie przypadek, ona po prostu znosi udeptanie. Liść przykłada się na otarcie albo skaleczenie; zerwiesz go dokładnie tam, gdzie najłatwiej się otrzeć, i to jest chyba jedyny żart, jaki natura zrobiła z sensem.",
      requiresHerb: "babka",
      group: "ziola",
      requiresQuest: "zielarskie_zapasy",
    },
    {
      id: "o_krwawnik",
      q: "A ten biały, z pierzastym liściem?",
      a: "Krwawnik. Weź jeden liść i policz, ile ma wcięć — nie policzysz, dlatego mówią na niego tysiąclistny. Kwiat płaski, biały, widać go z drugiego końca miedzy. Nazwa jest od tego, do czego służy: przykłada się na ranę, żeby przestała krwawić. Rośnie na suchym i słonecznym, w cieniu go nie znajdziesz.",
      requiresHerb: "krwawnik",
      group: "ziola",
      requiresQuest: "zielarskie_zapasy",
    },
    {
      id: "o_pokrzywa",
      q: "Pokrzywa to chwast. Po co ci?",
      a: "Chwast to roślina, na którą ktoś nie znalazł jeszcze użytku. Po chorobie dają pokrzywę osłabionym do picia, a z łodyg, jak je wymoczysz, wyprzędziesz niezłą nić. I zapamiętaj, gdzie stoi gęsty łan: to znaczy, że ziemia tam tłusta od obornika. Tam, gdzie widzisz pokrzywy, ktoś kiedyś trzymał bydło, nawet jak chałupy już nie ma.",
      requiresHerb: "pokrzywa",
      group: "ziola",
      requiresQuest: "zielarskie_zapasy",
    },
    {
      id: "o_rumianek",
      q: "Rumianek chyba każdy zna?",
      a: "Każdy zna, i połowa przynosi mi coś innego. Rozetrzyj kwiat w palcach — prawdziwy pachnie jabłkiem. A jak dalej nie jesteś pewien, przekrój sam środek: u rumianku jest pusty w środku. Napar koi brzuch i przemywa się nim oczy. Rośnie na ugorze, na miedzy, na ubitym w pełnym słońcu.",
      requiresHerb: "rumianek",
      group: "ziola",
      requiresQuest: "zielarskie_zapasy",
    },
    {
      id: "o_dziurawiec",
      q: "Znalazłem żółty, na polanie. Ten dziurawy.",
      a: "Podnieś liść pod światło. Widzisz te dziurki? To nie dziury, tylko zbiorniczki olejku — całą nazwę wzięło stąd. Kwiaty nastawiam na oleju, robi się czerwony jak krew — u nas tym smaruje się skórę po oparzeniu. Napar dają tym, co posmutnieli na zimę. Trzymaj się z nim słońca i nie dawaj go byle komu — to nie napitek do wieczerzy, to lek.",
      requiresHerb: "dziurawiec",
      group: "ziola",
      requiresQuest: "dziurawiec_na_zime",
    },
  ],
  portraitTexture: "herbalist-portrait",
  tint: 0x9cb87a,
} as const;

/**
 * **Wdowa Zofia** — talk-only presence for now, same as Sołtys/Rolnik/
 * Młynarz/Ojciec/Mama (empty `stock`/`quests`). Stands at her own obora
 * (`village-zagaje.tmj`, tile 16–23/70–74 — already assigned to her in
 * `docs/wioska_plan.md` 5.3/1.1, so unlike the other flavour NPCs she gets
 * her REAL eventual spot from the first day, not a placeholder position).
 *
 * She is the map's biggest deferred narrative beat, not a filler villager:
 * `docs/swiat.md`/`docs/wioska_plan.md` 5.3 both single her out as the one
 * who first calls the player "myśliwy" instead of "syn rolnika" — her field
 * sits at the exposed corner of the southern niwa, closest to the treeline,
 * and she has nobody able-bodied to guard it (dead husband, a
 * father-in-law too old, a son too young). That scene is a scripted
 * story-quest moment, not a repeatable greeting, and does NOT exist yet —
 * her `greeting` below is deliberately an ordinary, in-character line, not
 * the reveal. Wiring the real scene is separate future work (needs a
 * decision on what triggers it — probably tied to the Szary revenge quest,
 * since that is the other half of "you avenged the wolf that maimed the
 * Myśliwy").
 *
 * `scale` is NOT `BLACKSMITH.scale` — her portrait's measured content
 * height is 105px (`tools/build_zofia.py`), noticeably taller than the
 * ~87–91px the other flavour NPCs share, so reusing 0.76 would render her
 * about a fifth too big next to everyone else. Computed the same way the
 * Kowal's own scale was tuned (see `BLACKSMITH.scale`'s comment): target
 * ~1.1× the player's on-screen height (60px × 1.1 = 66px) ÷ 105px ≈ 0.63.
 */
export const ZOFIA = {
  id: "widow",
  name: "Wdowa",
  greeting: "Gęsi same się nie upilnują. Jak czegoś chcesz, mów krótko.",
  interactRange: MERCHANT.interactRange,
  scale: 0.63,
  stock: [],
  quests: [],
  /**
   * Jej tematy **zastawiają** scenę „ktoś nazywa cię myśliwym", ale jej nie
   * wydają. Doc na górze tego bloku jest w tej sprawie kategoryczny: to ma być
   * scenariuszowy moment fabularny, nie kwestia powitalna — więc mówi tu o
   * swoim położeniu (pole na odsłoniętym rogu, nikogo zdolnego do pilnowania),
   * a nie o tobie. Kiedy ta scena powstanie, dostanie własny wyzwalacz i to
   * ona ma być pierwszym razem, gdy to słowo pada z jej ust.
   */
  topics: [
    {
      id: "sama",
      q: "Sama pilnujesz tego wszystkiego?",
      a: "Sama. Mąż trzy lata temu, teść ma osiemdziesiąt jeden lat i połowę wzroku, chłopak jedenaście. Jak mi coś wejdzie w kapustę, to idę z kijem ja. Nie mów mi, że to nie w porządku — to wiem. Powiedz mi, kto miałby pójść zamiast mnie.",
    },
    {
      id: "moje_pole",
      q: "Twoje pole leży najbliżej lasu ze wszystkich.",
      a: "Najbliżej i na rogu, więc z dwóch stron. Wiesz, ile razy w zeszłym roku wychodziłam w nocy z łuczywem, bo coś chodziło po grządkach? Jedenaście. Nacinam sobie karby na kiju. Nie dlatego, że mi zależy na liczbie — dlatego, żeby móc komuś kiedyś pokazać ten kij, jak powie, że przesadzam.",
      after: ["sama"],
    },
  ],
  portraitTexture: "zofia-portrait",
  tint: 0xc9a8a0,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * ÓSEMKA Z `docs/wioska_plan.md` §6 — mieszkańcy z interakcją „rozmowa"
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Plan wymienia 30 dusz i dzieli je na „rozmowa" i „tło". To jest cała
 * pierwsza grupa, której jeszcze nie było: Hanna, Witek, Kuba, Agata,
 * Dobrawa, Sobek, Gniewko, Sulisław. Postaci tła (dzieci, parobcy,
 * czeladnik) świadomie nie dochodzą — NPC, który nie ma nic do powiedzenia,
 * jest droższy niż go nie ma: zajmuje miejsce w audycie zagęszczenia (patrz
 * niżej) i uczy gracza, że zagadywanie ludzi się nie opłaca.
 *
 * **Cała ósemka ma już `portraitTexture`** (2026-08-20: Kuba, Gniewko,
 * Hanna, Sulisław od 2026-08-18, Witek, Sobek, Agata i Dobrawa domykają
 * resztę tego samego dnia) — każdy portret powstał z obrazka wygenerowanego
 * w Gemini (`docs/prompty_gemini.md`), tym samym przepisem co Kowal:
 * wygeneruj → `tools/build_<imię>.py` (bounding-box + tabela przekolorowania)
 * → `portraitTexture` w bloku TUTAJ **→ i `load.image(...)` w
 * `queueImages()` (`src/core/Assets.ts`) — TRZY kroki, nie dwa.** Ten
 * trzeci był pominięty przy Witku/Sobku/Agacie/Dobrawie: wszystko inne było
 * gotowe (blok, `ASSETS`, `tsc` czysty), a mimo to wszyscy czworo dalej
 * renderowali się na wspólnym `NPC.png` — bo nic nigdy nie zażądało
 * wczytania ich plików. `BootScene` NIE ładuje `ASSETS` generycznie, każdy
 * wpis trzeba osobno zakolejkować. Zobacz ostrzeżenie przy `ASSETS.kuba`
 * niżej po pełny opis. `tint` zostaje na każdym z nich wyłącznie jako
 * awaryjny fallback (`Merchant` sięga po wspólne NPC.png, gdyby tekstura
 * portretu kiedyś nie wczytała się) — **dobrany tak, żeby rozróżniać
 * archetypy** (starcy chłodni i wyblakli, młodzi ciepli, rzemieślnicy
 * przyciemnieni), z czasów gdy osiem identycznych sylwetek w jednym
 * kolorze czytało się jako usterka.
 *
 * **Każdy wymienia z imienia jedną–dwie osoby** — siatka z `wioska_plan.md`
 * §6.2. To jest najtańsza treść w całym dokumencie i dlatego trzyma się jej
 * co do osoby: Hanna→Dobiesław, Witek→Dobiesław, Agata→Miłosz i Sobek,
 * Dobrawa→własny ojciec, Sulisław i Kuba→wszyscy.
 *
 * **Trzej z nich stoją prowizorycznie** (Witek, Sobek, Gniewko): ich obejścia
 * — chlew, warsztat stolarski, owczarnia — nie mają ani jednego kafla, a
 * `wioska_plan.md` §7.4 zabrania podstawiania zastępników. Stoją więc w
 * strefach, które plan im przewiduje (§5.4/§5.7/§5.9), i przeniosą się, gdy
 * budynki powstaną. Reszta stoi tam, gdzie naprawdę mieszka.
 */

/**
 * **Hanna** (38) — żona Dobka. Nosi liczbową stawkę całego prologu: to pole
 * jej męża jest tym, przez które „zabij pięć zajęcy" znaczy „młyn straci
 * połowę przemiału" (`wioska_plan.md` §5.2). Mówi to bez patosu, bo liczy
 * sery i wie, ile czego wychodzi.
 */
export const HANNA = {
  id: "hanna",
  name: "Hanna",
  greeting: "Jak do Dobka, to w polu od świtu. Jak do mnie, to mów przy robocie, bo mleko nie poczeka.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jej portretu
   *  (87px zmierzone przez `tools/build_hanna.py`), ta sama metoda co u
   *  Kuby/Gniewki: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/87 ≈ 0.76. */
  scale: 0.76,
  stock: [],
  quests: [],
  topics: [
    {
      id: "woly_rywalizacja",
      q: "Twój mąż i Sołtys ciągle o te woły.",
      a: "Bo Dobiesław ma i woły, i konia, a mój mąż nie ma żadnego z nich — orze na pożyczonych od niego, i tak zdążył przed nim w zeszłym roku, i gadał o tym do żniw. Dobiesław za to ma tego konia, czego Dobek nie przeboleje do śmierci. Dwóch dorosłych chłopów, a liczą sobie dni jak dzieci kamyki.",
    },
    {
      id: "ile_zboza",
      q: "Ile właściwie znaczy dla wsi wasze pole?",
      a: "Połowę tego, co idzie do młyna. Nie mówię tego dla dumy, tylko żebyś wiedział, co liczysz, jak liczysz zające. Jak nam wejdą w zboże na dobre, to Miłosz miele o połowę mniej, a jak Miłosz miele o połowę mniej, to zimą nie chodzi o to, że będzie chudo. Chodzi o to, że ludzie zaczną się rozchodzić do krewnych po innych wsiach. Widziałam to raz, jako dziecko. Wieś nie umiera z głodu, tylko się rozchodzi.",
      after: ["woly_rywalizacja"],
    },
  ],
  /** Ma własny portret (`ASSETS.hanna`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się. Ciepły, spłowiały
   *  róż — chustka gospodyni. */
  portraitTexture: "hanna-portrait",
  tint: 0xd9b0a6,
} as const;

/**
 * **Witek** (44) — len i świnie. Jego jedna linijka wiąże dwa obejścia:
 * oddał szesnastoletniego syna sołtysowi na parobka, czyli biedniejsi
 * wynajmują dzieci bogatszym (`wioska_plan.md` §5.4). To nie jest smutna
 * ciekawostka, tylko cała ekonomia wsi w jednym zdaniu.
 *
 * Stoi prowizorycznie w niwie wschodniej — chlewu ani jego chałupy nie ma
 * jeszcze w kaflach.
 */
export const WITEK = {
  id: "witek",
  name: "Witek",
  greeting: "Uważaj, gdzie stajesz, bo tu wszędzie len leży do moczenia. Czego trzeba?",
  /** Ma jedną pozycję na sprzedaż, więc `broke` jest jedyną linią zależną od
   *  stanu, jaka mu się odpali (zadań nie ma). Ten sam układ co u Anny. */
  greetings: {
    broke: "To se obejrzyj. Robota i tak stoi w miejscu, póki len moknie.",
  },
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jego portretu
   *  (87px zmierzone przez `tools/build_witek.py`), ta sama metoda co u
   *  Hanny/Kuby/Gniewki: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/87 ≈ 0.76. */
  scale: 0.76,
  /**
   * Jedyny sprzedawca przeszywanicy, i to nie jest przypadkowe przypisanie:
   * `WITEK.topics.len` jest w całości o przerobie lnu — „trzy tygodnie w
   * wodzie, potem suszyć, potem tłuc, potem czesać. Z tego dopiero jest nić,
   * z nici płótno, a z płótna koszula, którą masz na sobie". Przeszywanica to
   * kilkanaście warstw tego płótna, więc jego warsztat jest jedynym miejscem
   * we wsi, gdzie mogła powstać.
   *
   * ⚠ Świadomie NIE u Kowala i NIE u Myśliwego. Radzim sam mówi, że nie kuje
   * zbroi (`bron_skad`), a przeszywanica i tak nie jest kuta; Myśliwy wyprawia
   * SKÓRY i ma już od tego komplet skórzany. Materiał wskazuje rzemieślnika.
   *
   * Bez `stockQuality`, więc sprzedaje jakość Zwykłą (patrz `Quality.ts`) —
   * u wiejskiego lniarza to właściwy sufit.
   */
  /** Jedyny we wsi, kto obrabia len (temat `len` prowadzi cały proces od
   *  moczenia po tkanie), więc cała przeszywanica jest u niego — nie u
   *  Kowala, który wprost mówi, że zbroi nie kuje. */
  /**
   * ⚙ **`arming_doublet` dopisany 2026-09-15 — był NIEOSIĄGALNY.** Przeszywany
   * kaftan wszedł z drugą partią pancerza (2026-09-12) bez dystrybutora,
   * a jest to **len szyty warstwami**, czyli dokładnie fach Witka — ta sama
   * reguła, która trzyma u niego całą resztę przeszywanicy.
   *
   * ⛔ **`padded_gloves` i `worn_wraps` świadomie NIE dopisane** — obie sztuki
   * **nie mają pola `buyPrice`**, więc `buyPriceOf` zwraca dla nich `0`
   * i stanęłyby na półce jako wiersz bez ceny. Dopisanie ceny jest decyzją
   * balansową, nie uzupełnieniem dystrybutora — patrz raport `B-1`/dystrybutorzy.
   */
  stock: [
    "padded_cap", "gambeson", "padded_chausses", "foot_wraps", "arming_doublet",
    /**
     * ⭐ **ETAP TESTÓW (decyzja autora 2026-10-11): każda broń i każdy pancerz
     * stoi na jakiejś półce** — „łatwiej będzie testować wizualnie przedmioty na
     * tym etapie”. Poniższe sztuki nie miały dotąd sklepu (`OI-106`); rozdane
     * wg rzemiosła: płótno i len są
     * jego (`ile_zboza`), łapcie dochodzą jako wiejska plecionka. Pilnuje `tools/dystrybucja_przymiar.mjs` (reguła etapu).
     * ⚠ Przed wydaniem do przeglądu (`docs/odlozone.md` §1).
     */
    "cloth_coif", "linen_shirt", "linen_trousers", "bast_shoes", "padded_gloves",
  ],
  quests: [],
  topics: [
    {
      id: "len",
      q: "Po co moczysz to wszystko w sadzawce?",
      a: "Żeby zgniło. Nie śmiej się — łodyga ma zgnić dokoła włókna, wtedy włókno samo puszcza. Trzy tygodnie w wodzie, potem suszyć, potem tłuc, potem czesać. Z tego dopiero jest nić, z nici płótno, a z płótna koszula, którą masz na sobie. Nikt tego nie widzi, bo wszyscy patrzą na zboże. A koszula sama się nie urodzi.",
    },
    /**
     * Uzasadnia, skąd u lniarza pancerz — i robi to jego głosem: on nie jest
     * zbrojmistrzem, tylko człowiekiem, który umie zszyć bardzo dużo płótna.
     * ⚠ Mówi wprost o słabości przeszywanicy na grot, bo `ARMOR_PROFILE.padded
     * .pierce` to 0,35, najniższa wartość w tabeli — gracz ma szansę
     * dowiedzieć się tego od kogoś, zanim dowie się tego od dzika.
     */
    {
      id: "przeszywanica",
      q: "A to grube, przeszywane — to na zimę?",
      a: "To na cios. Szesnaście warstw, przeszyte w wałki co dwa palce, i zszywasz to tydzień, aż palce puchną. Ojciec robił takie dla ludzi, co szli na wojnę, i mówił tak: cięcie się o to rozłoży, obuch się w tym utopi, ale przed grotem cię nie obroni — grot rozpycha nitki i wchodzi. Kto miał czym, ten wkładał na to jeszcze kolczugę. Kto nie miał, ten się modlił.",
      after: ["len"],
    },
    {
      id: "staszek",
      q: "Podobno twój syn służy u Sołtysa.",
      a: "Służy. Szesnaście lat, silny jak wół, a ja go oddałem za odrobek, bo wołów nie mam i nie będę miał. Dobiesław go karmi, ja mam czym orać, chłopak wraca na niedzielę. Tak to działa i nikt nikogo nie krzywdzi. ...Tylko nie pytaj mnie, czy bym wolał inaczej, bo bym wolał inaczej.",
      after: ["len"],
    },
  ],
  /** Ma własny portret (`ASSETS.witek`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się. Przygaszony
   *  len — szarozielony. */
  portraitTexture: "witek-portrait",
  tint: 0x9aa88c,
} as const;

/**
 * **Kuba** (66) i **Sulisław** — dwaj starcy przy studni.
 *
 * `wioska_plan.md` §6.2 nazywa ich wprost **najtańszym systemem reakcji
 * świata, jaki ta gra może dostać**: jedno miejsce, dwie postacie, a mają
 * prawo komentować wszystko, co się właśnie wydarzyło. Dziś to jeszcze nie
 * jest zaimplementowane (żadne z nich nie ma `greetings` zależnych od
 * stanu — patrz K8 w planie); stoją przy studni i mówią to, co pamiętają.
 *
 * **Kuba domyka pytanie o Szarego, nie odpowiadając na nie.** Myśliwy mówi
 * „trzydzieści lat tu chodzę i takiego czegoś nie było" — Kuba, o pokolenie
 * starszy, potwierdza to samo z drugiej strony. To celowo **wzmacnia** lukę
 * zamiast ją zasypywać, ta sama zasada co przy moście (`swiat.md` §4).
 */
export const KUBA = {
  id: "kuba",
  name: "Kuba",
  greeting: "Siadaj albo idź, chłopcze, tylko nie stój mi w słońcu.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jego portretu
   *  (89px zmierzone przez `tools/build_kuba.py`), tą samą metodą co u Zofii:
   *  cel to ~1.1× wysokości gracza, czyli 66px, więc 66/89 ≈ 0.74. Wpisanie
   *  wspólnej 0.76 renderowałoby go o parę procent za dużego — u Zofii ten
   *  sam błąd dawał już piątą część różnicy. */
  scale: 0.74,
  stock: [],
  quests: [],
  topics: [
    {
      id: "studnia_starcy",
      q: "Siedzicie tu obaj cały dzień?",
      a: "A gdzieżby nam siedzieć? Ja mam sześćdziesiąt sześć lat i kolano, co mi gada pogodę na trzy dni naprzód. Sulisław ma jeszcze więcej i pół oka. Za to we dwóch widzimy wszystko, co przechodzi przez ten plac, i pamiętamy, kto komu co był winien od czasów, których nikt inny już nie pomni. To też jest jakaś robota.",
    },
    {
      id: "kuba_wilki",
      q: "Pamiętasz, żeby wilk kiedyś zszedł pod wieś?",
      a: "Nie. I to nie jest „nie pamiętam”, tylko „nie było”. Pamiętam suszę, w której piliśmy z kałuż. Pamiętam zarazę na bydło i dwa pożary. Pamiętam wilki wyjące za rzeką przez całą zimę — i ani jednego, który by przyszedł. Bo i po co miałby przychodzić. Człowiek jest chudy, hałaśliwy i ma widły. Jak taki jeden przyszedł, to znaczy, że tam było coś gorszego niż widły.",
      after: ["szary"],
    },
  ],
  /** Ma własny portret (`ASSETS.kuba`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się — dokładnie tak samo
   *  jak u Kowala i Myśliwego. */
  portraitTexture: "kuba-portrait",
  tint: 0xa8a8b0,
} as const;

/**
 * **Sulisław** — teść wdowy Zofii, drugi starzec przy studni. Mieszka u
 * synowej, bo jego syn nie żyje: `wioska_plan.md` §5.3 zauważa, że **cała
 * jego historia jest opowiedziana przez adres**, więc jego tematy nie
 * rozwlekają jej ponad to.
 *
 * Wieku celowo nie podaje. Plan mówi 68, ale `ZOFIA.topics.sama` — kwestia,
 * którą gracz może już usłyszeć — mówi „teść ma osiemdziesiąt jeden lat i
 * połowę wzroku". Dopóki ktoś tego nie rozstrzygnie, Sulisław mówi o swoim
 * wzroku (zgodnie z nią) i nie wymienia liczby lat (żeby jej nie zaprzeczyć).
 */
export const SULISLAW = {
  id: "sulislaw",
  name: "Sulisław",
  greeting: "Podejdźże bliżej, synku. Z tej dali jesteś mi jeno plamą w kolorze koszuli.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jego portretu
   *  (86px zmierzone przez `tools/build_sulislaw.py`), ta sama metoda co u
   *  reszty ósemki: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/86 ≈ 0.77. */
  scale: 0.77,
  stock: [],
  quests: [],
  topics: [
    {
      id: "u_synowej",
      q: "Mieszkasz u wdowy?",
      a: "U synowej. Mów, jak trzeba, synku, ja się tego słowa nie boję — mój syn nie żyje trzeci rok i od tego nie zaboli mnie bardziej, że ktoś to nazwie. Zofia mnie trzyma, choć jestem u niej gębą do wykarmienia, a nie parą rąk. Ktoś inny by mnie odesłał do brata do miasta. Ona nie odesłała. Zapamiętaj to sobie o niej, jak będziesz kiedyś o niej sądził.",
    },
    {
      id: "wzrok",
      q: "Dużo jeszcze widzisz?",
      a: "Kształty i ruch. Twarzy nie. Za to słyszę jak pies i to jest teraz moja robota przy tym obejściu: siedzę wieczorem na progu i słucham. Kura inaczej gada, gdy się boi, a inaczej, gdy jej jeno ciasno. W zeszłym miesiącu dwa razy wyszedłem z kijem, nim ktokolwiek cokolwiek zobaczył. Nikogo nie było. Ale wolę wyjść na darmo dziesięć razy niż raz nie wyjść.",
      after: ["u_synowej"],
    },
  ],
  /** Ma własny portret (`ASSETS.sulislaw`); `tint` zostaje wyłącznie jako
   *  awaryjny. Bardzo wyblakły, lekko ciepły siwy — starszy z dwóch starców. */
  portraitTexture: "sulislaw-portrait",
  tint: 0xb4aca0,
} as const;

/**
 * **Agata** (43) — kowalowa. Prowadzi rachunki kuźni, co czyni ją jedyną
 * osobą we wsi mówiącą o **pieniądzu, którego nie ma**: pół wsi płaci Radzimowi
 * w naturze, nie monetą. To domyka dwie relacje z §6.2 naraz (Radzim→Miłosz,
 * Radzim→Sobek) i tłumaczy, czemu sklep kowala w ogóle bierze złoto od gracza:
 * bo gracz jest jedynym klientem, który je ma.
 */
export const AGATA = {
  id: "agata",
  name: "Agata",
  greeting: "Jak do kucia, to do męża. Jak o zapłatę, to do mnie — i tu się nie targuj, bo ja liczę.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jej portretu
   *  (87px zmierzone przez `tools/build_agata.py`), ta sama metoda co u
   *  Sobka/Witka/Hanny: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/87 ≈ 0.76. */
  scale: 0.76,
  stock: [],
  quests: [],
  topics: [
    {
      id: "rachunki",
      q: "Ty prowadzisz rachunki kuźni?",
      a: "Ktoś musi, a mąż liczy do dziesięciu i to na dobry dzień. Tylko wiesz co? Tu prawie nikt nie płaci monetą. Miłosz płaci mąką za części do młyna, Sobek okucia bierze za drewno, Dobiesław za podkowy przysyła połeć. Ja to wszystko trzymam w głowie i na karbach, i wychodzi na swoje. Ty jesteś rzadki ptak — ty przychodzisz z workiem i chcesz zapłacić od razu.",
    },
    {
      id: "wegiel",
      q: "Skąd bierzecie tyle węgla?",
      a: "Wypalamy sami, za rzeką, dwa razy do roku. Tydzień pilnowania mielerza dniem i nocą, bo jak się przepali, to zostaje popiół zamiast węgla i cała robota idzie w komin. Adrian śpi wtedy w lesie i wraca czarny jak diabeł. Od kiedy zaczęło się to gadanie o wilku, chodzą tam we dwóch, choć jeden by wystarczył.",
      after: ["rachunki"],
    },
  ],
  /** Ma własny portret (`ASSETS.agata`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się. Przydymiony
   *  ochr — kuźnia i sadza. */
  portraitTexture: "agata-portrait",
  tint: 0xb9a17e,
} as const;

/**
 * **Bogusz Karczmarz** (2026-10-09, owalnica) — wdowiec; kuchnię i obsługę
 * gości dzieli z kuzynką Anną, która „nie jest służącą" (autor 2026-10-10,
 * `docs/swiat.md` — sekcja o Annie). Karczma przy północnym
 * wjeździe, przy trakcie do miasta. Jedyny we wsi, kto **żyje z przejezdnych**,
 * więc jedyny, który słyszy, co się dzieje POZA Zagajami (wozacy z miasta,
 * cichnący wschód). Warzy z własnego chmielu i słodu od Miłosza — ten sam
 * obieg „w naturze, nie monetą", który liczy Agata.
 *
 * Bez własnego portretu: wspólny `NPC.png` z tintem (klatka 60 px → skala 1,1,
 * jak cel ~1,1× wysokości gracza u reszty obsady).
 */
export const INNKEEPER = {
  id: "innkeeper",
  name: "Bogusz",
  greeting: "Siadaj, gdzie chcesz, byle nie na beczce. Piwo jest, polewka też — za grosz, nie na kreskę.",
  greetings: {
    broke: "Na kreskę to u sołtysa. U mnie za grosz.",
  },
  interactRange: MERCHANT.interactRange,
  scale: 1.1,
  stock: ["bread", "cheese", "cooked_meat"],
  quests: [],
  topics: [
    {
      id: "piwo",
      q: "Warzysz sam?",
      a: "Sam. Chmiel spod okna, słód od Miłosza, woda ze studni — i dlatego Miłosz pije u mnie za pół ceny, a ja za mąkę nie płacę wcale. Tak się tu rachuje. Ty płacisz groszem, bo z lasu groszem przynosisz.",
    },
    {
      id: "przejezdni",
      q: "Kto tu w ogóle zagląda?",
      a: "Wozacy z miasta, dwa razy w miesiącu, jak drogi suche. Piją, śpią w stodole, rano jadą dalej z mąką. I gadają — to jest moja prawdziwa zapłata. Ostatnio gadają mniej, a jadą prędzej. Mówią, że las na wschodzie zrobił się cichy. A cichy las to zły las.",
      after: ["piwo"],
    },
    {
      id: "tablica",
      q: "Kowal mówił o tablicy przy karczmie.",
      a: "Tablica to za dużo powiedziane — deska przy drzwiach. Kto czego potrzebuje, zostawia znak, a ja pamiętam, co znaczy. W mieście mają prawdziwą, z kartkami i pieczęciami. Tu wystarczy, że ja wiem, kto komu ile winien. A wiem wszystko — w karczmie nikt nie szepcze, tylko każdy myśli, że szepcze.",
      after: ["piwo"],
    },
  ],
  tint: 0xc89a6a,
} as const;

/**
 * **Adrian** (ok. 29; do 2026-10-10 opisany jako 18-latek) — czeladnik Radzima (2026-10-09, prośba autora; w
 * `wioska_plan.md` §6 ta rola nazywała się „Bolko"). Miech, węgiel,
 * szczypce. Domyka wątek mielerza z `AGATA.topics.wegiel` od strony tego,
 * kto naprawdę spędza tam noce — jego temat otwiera się dopiero PO tamtym.
 */
export const ADRIAN = {
  id: "adrian",
  name: "Adrian",
  greeting: "Nie stój przy miechu, bo cię osmali. Mistrz jest przy kowadle, ja tylko dmucham.",
  interactRange: MERCHANT.interactRange,
  scale: 1.1,
  stock: [],
  quests: [],
  topics: [
    {
      id: "terminowanie",
      q: "Długo już u Radzima?",
      a: "Trzeci rok. Pierwszy nosiłem węgiel, drugi dmuchałem w miech, trzeci — dalej dmucham, ale już mi wolno trzymać szczypce. Mistrz mówi, że kowal rodzi się przy miechu, nie przy młocie. Ja myślę, że przy młocie, ale mu tego nie mówię.",
    },
    {
      id: "mielerz",
      q: "Agata mówi, że pilnujesz mielerza.",
      a: "Za rzeką, tydzień bez spania. Teraz chodzimy we dwóch, przez tego wilka. Pierwszej nocy myślałem, że każdy trzask to on. Trzeciej pilnowałem już tylko, żeby się nie przepaliło — strach męczy się szybciej niż człowiek. Ale ty tam idź z czymś ostrzejszym niż mój pogrzebacz.",
      after: ["wegiel"],
    },
    {
      id: "do_miasta",
      q: "Chcesz kiedyś do miasta?",
      a: "Jak skończę termin. Mistrz był tam na czeladnika i wrócił — mówi, że w mieście kowali jest tylu, co tu kur, i każdy kuje jedno: ten gwoździe, ten podkowy, ten miecze. Ja chcę kuć miecze. Ale najpierw muszę umieć gwoździe, bo inaczej żaden mnie nie weźmie.",
      after: ["terminowanie"],
    },
  ],
  tint: 0x9a8f86,
} as const;

/**
 * **Drwale** (K5 Zagajów, 2026-10-10; autor: „ojciec z synami") — chałupa ojca
 * i chałupa synów na południowo-zachodnim skraju, wspólne podwórze z drewutnią
 * i kozłem, kładka na zachodni brzeg i do wyrębu. Imiona i charaktery wybrał
 * autor. Wątki spinają ich z resztą wsi: mielerz kowala (`AGATA.topics.wegiel`
 * → Adrian), budulec Sobka, Anna spod karczmy, coś, co idzie za drwalami
 * w lesie — ⚠ bez odsłaniania wyższego szczebla łańcucha (`swiat.md` §1).
 */
export const CIECHAN = {
  id: "ciechan",
  name: "Ciechan",
  greeting: "Drzewo nie ucieka, a ja się nie spieszę. Mów, czego chcesz.",
  /** ⭐ Dawca „Zrabowanego wozu" (`OI-171`) — `greetings` obowiązkowe
   *  (`src/ui/CLAUDE.md`: dawca bez nich ma pusty dymek; pilnuje Z6). */
  greetings: {
    notYet: "Las teraz niepewny. Niech się najpierw ktoś z wilkiem rozliczy, wtedy pogadamy o innych sprawach.",
    firstJob: "Ty Szarego położyłeś? To siadaj. Mam sprawę, z którą do sołtysa nie pójdę, bo sołtys pogada i tyle.",
    working: "Idź koleinami od traktu na północ, w gąszcz, aż nad rzekę. Staw obejdź — siedzą za nim, na samym brzegu. Z drogi ich nie zobaczysz — i o to im chodzi.",
    turnIn: "Wróciłeś na nogach. To już coś. Mów.",
    allDone: "Bolko znowu wozi. Ostrożniej niż przedtem — i dobrze.",
  },
  interactRange: MERCHANT.interactRange,
  scale: 1.1,
  stock: [],
  quests: ["zrabowany_woz"],
  topics: [
    {
      id: "zrabowany_woz_temat",
      q: "Co się stało z wozem na targ?",
      a: "Zabrali. Bolko jechał z drewnem, a ich było czterech. Chciał się bić — dobrze, że nie zdążył wyjąć siekiery, bo leżałby w rowie. Konie oddali. Myślisz, że z dobroci? Koni się nie sprzeda, każdy we wsi je pozna.",
      after: ["wyreb"],
    },
    {
      id: "po_zbojach",
      q: "Wóz wrócił?",
      a: "Wrócił. Dwa koła do roboty — Sobek je zrobi, a potem pokłócimy się o cenę, jak co roku. Ale wozi się znowu. Tego nie da się zapłacić drewnem, chłopcze.",
      requiresQuest: "zrabowany_woz",
    },
    {
      id: "wyreb",
      q: "Gdzie rąbiecie?",
      a: "Za kładką, na zachodnim skraju. Olcha i grab na opał, dąb tylko na zamówienie — dąb rośnie dłużej, niż ja żyję, to się go nie marnuje. Co ścięte, ciągniemy końmi sołtysa, bo własnych nie mamy. Płacimy mu w drewnie. Tu wszyscy komuś płacą w czymś.",
    },
    {
      id: "las_dawniej",
      q: "Las się zmienił?",
      a: "Trzydzieści lat chodzę tymi samymi ścieżkami. Kiedyś zwierz uciekał przed siekierą. Teraz bywa, że stoi i patrzy, a dzik chodzi tam, gdzie go nigdy nie było. Nie wiem, co to znaczy. Wiem, że synów już samych w głąb nie puszczam.",
      after: ["wyreb"],
    },
    {
      id: "synowie",
      q: "Dwóch synów przy jednym toporze?",
      a: "Przy trzech toporach. Jeden drwal to pół drwala — drzewo trzeba ściąć, okrzesać, pociąć i zwieźć. Bolko robi za dwóch i myśli, że już wszystko wie. Zbych robi za pół i myśli, że świat jest gdzie indziej. Obaj mają trochę racji. Matka mówi, że to po mnie.",
    },
  ],
  tint: 0x8a7a64,
} as const;

export const BOLKO = {
  id: "bolko",
  name: "Bolko",
  greeting: "Uważaj na kłodę. Piła chodzi, jak chce, nie jak ja.",
  interactRange: MERCHANT.interactRange,
  scale: 1.1,
  stock: [],
  quests: [],
  topics: [
    {
      id: "przejac",
      q: "Ojciec mówi, że robisz za dwóch.",
      a: "Bo ktoś musi. Ojciec ma krzyż jak stary pień — rano się nie zgina, wieczorem się nie prostuje. Za parę lat wyrąb będzie mój i chcę, żeby było co przejmować. Chałupę już postawiliśmy, naszą, naprzeciw jego. Jeszcze by się żona przydała, ale na to piły nie ma.",
    },
    {
      id: "mielerz_drewno",
      q: "Drewno na węgiel też od was?",
      a: "Od nas. Kowal bierze bukowe szczapy sągami, na mielerz za rzeką. Adrian przychodzi z wozem, ładuje, narzeka, że krzywo ułożone, i odjeżdża. Krzywo, prosto — węgiel z tego taki sam. Ale mu tego nie mówię, bo potem nie pomaga ładować.",
      after: ["wegiel"],
    },
    {
      id: "deski",
      q: "A deski na płoty i dachy?",
      a: "Deski to Sobek. My dajemy kłody, on je rżnie i suszy, i bierze za deskę dwa razy tyle, co my za kłodę. Ojciec mówi, że tak ma być, bo deska to robota. Ja mówię, że kłoda też. Kłócimy się o to co zimę i nic się nie zmienia.",
    },
  ],
  tint: 0x8a4630,
} as const;

export const ZBYCH = {
  id: "zbych",
  name: "Zbych",
  greeting: "Hej. Ojciec gada, Bolko piłuje, a ja pilnuję, żeby sągi nie uciekły. Ciężka robota.",
  interactRange: MERCHANT.interactRange,
  scale: 1.05,
  stock: [],
  quests: [],
  topics: [
    {
      id: "miasto_zbych",
      q: "Nie ciągnie cię do roboty w lesie?",
      a: "Ciągnie mnie gdzie indziej. Przejezdni w karczmie gadają o mieście, o wojsku, o ludziach, co z niczego doszli do konia i zbroi. Ojciec mówi, że z lasu się żyje. Żyje się, ale nic się nie widzi. Ty to chyba rozumiesz — też nie chcesz całe życie siedzieć w kapuście.",
    },
    {
      id: "cos_w_krzakach",
      q: "Boisz się chodzić do lasu?",
      a: "Nie boję. To znaczy… boję się, ale idę, bo Bolko by się śmiał. W zeszłym tygodniu coś szło za nami cały dzień, w krzakach, równo z nami. Ojciec kazał nie patrzeć i śpiewać. Śpiewaliśmy całą drogę do kładki. Głupio, wiem. Ale doszliśmy.",
    },
    {
      id: "anna_chleb",
      q: "Znasz Annę spod karczmy?",
      a: "Każdy zna. Raz kupiłem od niej chleb i zapytałem, czy pójdzie ze mną na jarmark. Popatrzyła na mnie jak ojciec na krzywe drzewo — że może coś z tego będzie, ale nie w tym roku. Wziąłem chleb i poszedłem. Chleb był dobry.",
    },
  ],
  tint: 0xc4b896,
} as const;

/**
 * **Dobrawa** (19) — córka sołtysa, **jedyna rówieśniczka bohatera, która
 * została we wsi**. `wioska_plan.md` §5.6 mówi wprost: nie robimy z tego
 * romansu na siłę, samo „została" wystarczy.
 *
 * Jej druga kwestia jest tym, czego Sołtys sam nigdy nie powie: jej ojciec
 * jest wierzycielem połowy wsi, łącznie z ojcem gracza — więc każda rozmowa
 * z nim jest lekko niewygodna, zanim padnie słowo. Powiedziane od środka, z
 * miejsca, w którym to jest po prostu wstyd.
 */
export const DOBRAWA = {
  id: "dobrawa",
  name: "Dobrawa",
  greeting: "O, wróciłeś. To znaczy, widzę, że wróciłeś. Nie wypytuję.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jej portretu
   *  (81px zmierzone przez `tools/build_dobrawa.py`, wyraźnie mniej niż
   *  reszta ósemki — sylwetka świadomie węższa/młodsza), ta sama metoda co
   *  u Agaty/Sobka/Witka: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/81 ≈ 0.81. */
  scale: 0.81,
  stock: [],
  quests: [],
  topics: [
    {
      id: "zostalas",
      q: "Wszyscy w naszym wieku poszli. Ty nie.",
      a: "Nie poszłam, bo miałam dokąd nie iść — to nie to samo co zostać. Ojciec ma urząd, sad i najładniejszą chałupę we wsi, więc wypada mi być zadowoloną i zwykle jestem. Ale w niedzielę nie mam z kim rozmawiać o niczym innym niż o sianie. Idź, gdzie idziesz. Tylko przychodź czasem powiedzieć, jak było, bo inaczej naprawdę zostanie mi tylko siano.",
    },
    {
      id: "dlug_ojca",
      q: "Twój ojciec pożycza woły pół wsi.",
      a: "Pożycza. I dlatego pół wsi mówi do niego per „panie sołtysie” trochę za grzecznie. Wiesz, kto mu odrabia? Twój ojciec, między innymi. Trzy dni w zeszłym roku, przy naszym owsie, w sierpniu, przy swoim biodrze. Nikt was nie skrzywdził i wszystko było umówione po dobroci — a ja i tak wolałabym stać wtedy gdzie indziej. Powiedziałam ci to, żebyś nie usłyszał tego od kogoś, kto powie to gorzej.",
      after: ["zostalas"],
    },
  ],
  /** Ma własny portret (`ASSETS.dobrawa`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się. Ciepła, jasna
   *  zieleń — jedyny młody kolor w tej ósemce. */
  portraitTexture: "dobrawa-portrait",
  tint: 0xa8c98a,
} as const;

/**
 * **Sobek Stolarz** (38) — wozy, koła, beczki.
 *
 * ⚠ **Nie obiecuje naprawy niczego.** `wioska_plan.md` D-4 rozstrzyga to
 * formalnie: trwałości sprzętu w grze nie ma i nie będzie w dającej się
 * przewidzieć przyszłości, więc stolarz jest klimatem, nie mechaniką. Gdyby
 * powiedział „przynieś, naprawię", gracz zacząłby szukać nieistniejącego
 * systemu — i to jest dokładnie ten sam błąd co postawienie NPC obok
 * budynku, którego nie ma.
 *
 * Stoi prowizorycznie — warsztatu i składu drewna nie ma jeszcze w kaflach.
 */
export const SOBEK = {
  id: "sobek",
  name: "Sobek",
  greeting: "Uwaga na wióry, bo się ślizga. Jak po koło, to za tydzień, wcześniej nie zdążę.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jego portretu
   *  (87px zmierzone przez `tools/build_sobek.py`), ta sama metoda co u
   *  Witka/Hanny/Kuby: cel to ~1.1× wysokości gracza, czyli 66px, więc
   *  66/87 ≈ 0.76. */
  scale: 0.76,
  /**
   * ⭐ **Pierwsza półka Sobka (2026-09-16) — 15 tarcz drewnianych.**
   *
   * Do tej pory miał `stock: []` i oddawał puklerz wyłącznie za `skora_na_pasy`.
   * Tarcze są jedynym towarem, który do niego pasuje bez naciągania: korpus
   * tarczy to klepki, a klepki to jego fach — mówi to sam w temacie `kola`:
   * *„ja drewno, on żelazo, i tak od dwudziestu lat"*. Beczka, koło i tarcza
   * wychodzą spod tego samego strugu.
   *
   * ⚠ **Bez `stockQuality`, więc wszystko schodzi w jakości Zwykłej (3)** —
   * i to jest cała różnica wobec Radzima. U kowala kupujesz znalezisko
   * w jakości 1–2; u Sobka **rzecz zrobioną dla ciebie**. Ta relacja stoi już
   * w komentarzu przy jego `stockQualityFor: { buckler: 1 }`: *„Puklerz
   * w dobrym stanie w ogóle nie trafia do skupu — ten robi Sobek"*.
   *
   * ⛔ **Żadnego metalu.** Żelazne i stalowe tarcze idą do Radzima; Sobek nie
   * ma kuźni i mówi to wprost.
   */
  stock: [
    // ⚠ `buckler` istnieje od dawna i stoi też u Radzima — tam jako znalezisko
    //   w jakości 1, tutaj jako rzecz zrobiona na zamówienie w jakości 3.
    "buckler",
    "wood_buckler_heavy",
    "wood_round_shield",
    "wood_round_shield_heavy",
    "wood_heater_shield",
    "wood_heater_shield_heavy",
    "wood_almond_shield",
    "wood_almond_shield_heavy",
    "wood_scutum_light",
    "wood_scutum",
    "wood_pavise",
    "wood_pavise_heavy",
  ],
  quests: ["skora_na_pasy"],
  /**
   * ⚠ **NPC z zadaniem MUSI mieć `greetings`.** `NpcDialog.pickGreeting`
   * sięga po `firstJob`/`turnIn`/`working` w chwili, gdy jakiekolwiek zadanie
   * istnieje, a postać z zadaniami i bez tych linii renderuje **puste okno**.
   * Każda gałąź ma dziś fallback na zwykłe `greeting`, ale to jest siatka
   * bezpieczeństwa, nie zwolnienie z pisania.
   */
  greetings: {
    firstJob: "Czekaj, nie właź w wióry. Skoro już stoisz — mam coś, co ci się przyda bardziej niż mnie.",
    working: "Skóry są? Bo klepki czekają struganie, a struganie to najnudniejsza część.",
    turnIn: "O, są. Grube, dobrze wygarbowane. Siadaj, to nie potrwa — obręcz nabita, pasy przynitowane.",
    allDone: "Trzymaj to od strony, w którą patrzysz, chłopcze. Z tyłu ci nie pomoże, choćbym ją zrobił z dębu.",
  },
  topics: [
    {
      id: "kola",
      q: "Co się najczęściej psuje we wsi?",
      a: "Koła. Zawsze koła. Wóz jedzie po korzeniu, szprycha pęka, i nagle całe żniwa stoją, bo nie ma czym zwieźć. Robię dwa zapasowe na wiosnę i do jesieni oba schodzą. Obręcze bije mi Radzim — ja drewno, on żelazo, i tak od dwudziestu lat. Beczki też robię, ale beczka to spokojna robota. Beczka nikomu nie pęka w połowie drogi.",
    },
    /**
     * ODESŁANIE do Radzima (`droga_na_wschod`) — drugi egzemplarz wzorca
     * „trzeba cię tam posłać" (patrz `MERCHANT.topics.owce` → Gniewko,
     * `MILLER.topics.zajace_u_dobka` → Dobek).
     *
     * Sobek jest tu właściwym człowiekiem z tego samego powodu co Miłosz
     * przy Dobku: `kola` (warunek `after`) już mówi jego głosem, że osie
     * i obręcze robią we dwóch z Radzimem od dwudziestu lat. Stolarz zna
     * skutek (nie ma z czego robić osi), kowal zna przyczynę (wozy przestały
     * jeździć na wschód) — i dopiero złożenie tych dwóch daje zlecenie.
     *
     * ⚠ Sobek NIE spekuluje, co siedzi w gęstwinie, i nie wolno mu na to
     * pozwolić przy żadnej przyszłej korekcie — `docs/swiat.md` trzyma tę
     * zagadkę zamkniętą (patrz komentarz nad `droga_na_wschod`).
     */
    {
      id: "drewno_na_osie",
      q: "Skąd bierzesz drewno na osie?",
      a: "Teraz? Skądkolwiek. Kiedyś ze wschodu i to była zupełnie inna robota — tam rosło twarde, proste, słojem równiutkie, oś z tego chodziła pięć lat. Od trzech lat biorę, co mi zostanie z wiatrołomów, i widać to po kołach. Radzim ci lepiej powie, bo on wozaków słucha, a ja tylko naprawiam to, z czym wracają. Zapytaj go o wschód. I zapytaj wprost, bo sam z siebie nie zacznie.",
      after: ["kola"],
    },
    {
      id: "skrzynia",
      q: "A ta skrzynia w kącie?",
      a: "...Ta stoi zawsze. Robi się ją wcześniej, nie na zamówienie — bo jak przychodzi zamówienie, to nikt nie ma tygodnia na czekanie. Trzy lata temu poszła jedna, do Zofii. Więcej ci o tym nie powiem, a ty nie pytaj o to jej.",
      after: ["kola"],
    },
  ],
  /** Ma własny portret (`ASSETS.sobek`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się. Świeże drewno —
   *  jasny, ciepły brąz. */
  portraitTexture: "sobek-portrait",
  tint: 0xc2a075,
} as const;

/**
 * **Gniewko Pasterz** (33) — pasie **stado całej wsi**, nie swoje: 34 własne
 * owce plus cudze na wypas (`wioska_plan.md` §5.9). To jest jego cała
 * charakterystyka: chodzi po ugorze z cudzym majątkiem.
 *
 * Jest też jedyną osobą we wsi, dla której wilk jest **kosztem, nie
 * opowieścią** — dlatego jego drugi temat wisi za `szary` i mówi liczbami.
 *
 * ⚙ Od 2026-10-11 (K6c/K6f, decyzja autora) zagroda Gniewka stoi W WSI, przy
 * trakcie nad kuźnią: chałupa frontem do traktu, owczarnia za nią, wrota na
 * pastwisko owiec. Stado wychodzi stamtąd na ugór na północnym wschodzie.
 */
/**
 * Anna (~25) — pierwsza mieszkanka spoza rozpiski `wioska_plan.md` §6,
 * dopisana wprost przez autora (2026-08-14). Portret: `tools/build_anna.py`
 * ze zdjęcia, prompt w `docs/prompty_gemini.md`.
 *
 * ⚠ **Nie ma jeszcze punktu na mapie** — świadomie. Autor nie zdecydował,
 * gdzie stoi, a `wioska_plan.md` nie rezerwuje jej żadnej strefy (nie ma jej
 * w rozpisce trzydziestu). Do czasu decyzji jest wpięta w kodzie i niewidoczna
 * w grze: brak obiektu w `village-zagaje.tmj` znaczy po prostu, że pętla po
 * `NPC_IDS` nic dla niej nie tworzy. To ten sam tryb „gotowe, czeka na
 * decyzję" co `pig.png`, tylko po stronie kodu zamiast grafiki.
 *
 * **Jej treść jest lżejsza od reszty wsi i to jest kontrast, nie pomyłka.**
 * Obok wdowy z trumną, wilków w owcach i „drugiego roku bez żniw wieś nie
 * przetrzyma" ktoś, kto chce wyprzytulać koty, czyta jako oddech — ale nadal
 * w konwencji `ciepłego realizmu`: ślimaki to prawdziwa hodowla (winniczek
 * naprawdę dochodzi ~2 lata), nie żart, i ona sama traktuje to poważnie.
 */
/**
 * Patryczek (~20) — kolega gracza, wnuk zielarki, docelowo TRENER WALKI.
 * Portret: `tools/build_patryczek.py`, prompt w `docs/prompty_gemini.md`.
 *
 * ⚠ **Dziś jest postacią rozmowną, NIE trenerem — i to nie jest niedoróbka.**
 * `SKILLS` ma dwie pozycje i obie są niebojowe (Skórowanie, Pieczenie), obie
 * od Myśliwego. Umiejętności walki w tej grze **nie istnieją**, więc
 * `trainer: "patryczek"` nie miałoby czego uczyć. Zaprojektowanie ich dotyka
 * najgłębszego systemu w grze i budżetu punktów (1 na poziom), więc jest
 * osobną decyzją — patrz `quests`/`stock` niżej, tak samo puste.
 *
 * ⚠ **Uraz jest odpowiedzią na „to czemu ty tego nie zrobisz".** Złamana
 * kostka śródręcza z bójki w karczmie — pełne uzasadnienie, łącznie z tym,
 * czemu NIE jest to ramię, w `docs/prompty_gemini.md` (sekcja „Uraz").
 * Skrót: ramię ma już Myśliwy i otwiera nim cały kręgosłup fabuły, więc
 * drugie ranne ramię czytałoby się jak chwyt. Ręka wyklucza WALKĘ, ale nie
 * NAUCZANIE — i dlatego on nadal może zostać trenerem, kiedy będzie czego
 * uczyć.
 */
export const PATRYCZEK = {
  id: "patryczek",
  name: "Patryczek",
  greeting:
    "O, jesteś. Nie, nie pomogę ci nieść, zanim spytasz — mam rękę w łubkach i babkę na karku. Ale pogadać mogę.",
  interactRange: MERCHANT.interactRange,
  /** Policzone z realnej wysokości portretu (89 px, `tools/build_patryczek.py`),
   *  tą samą metodą co u Zofii/Kuby/Anny: cel ~1.1× wysokości gracza = 66 px. */
  scale: 0.74,
  stock: [],
  quests: ["ziola_dla_babki", "rekawice_od_wnuka"],
  /**
   * ⚠ NPC z zadaniem MUSI mieć `greetings` — `NpcDialog.pickGreeting` sięga
   * po `firstJob`/`newJob`/`turnIn`/`working`, a postać z zadaniami i bez tych
   * linii renderuje puste okno.
   *
   * Ton jest tu nośny, nie ozdobny: Patryczek **nigdy nie prosi wprost**.
   * Pierwsze zlecenie podaje jako coś, co i tak zrobisz szybciej od niego, a
   * nie jako przysługę — prośba oznaczałaby przyznanie, że z tą ręką jest
   * bezużyteczny, a cała jego postać stoi na tym, że nie jest.
   */
  greetings: {
    /**
     * ⚠ **Zakłada, że owijki (`worn_wraps`) już trafiły do plecaka** —
     * bezpieczne w 99% przebiegów, bo `Quests.recordTalk` przemiata etapy
     * `stick_in_hand` PRZED wybraniem tej linii, więc pierwsza wizyta u
     * Patryczka z aktywnym `stick_in_hand` na etapie `visit_patryczek` zdąży
     * je wręczyć w tej samej rozmowie. **Jedyny przebieg, w którym to nie
     * jest prawdą**: gracz omija Ojca i trafia do Patryczka jako pierwszego
     * NPC w grze — `stick_in_hand` jest wtedy wciąż `available`, nie
     * `active`, więc `bumpActive`/`advanceStages` nic nie robi i owijek nie
     * ma. Mapa czyni to skrajnie mało prawdopodobnym (Ojciec stoi tuż przy
     * punkcie startowym), więc zaakceptowane jako drobna, znana nieścisłość
     * zamiast dorabiać warunek, który silnik i tak nie umie dziś wyrazić.
     */
    firstJob:
      "Nie, nadal nie pomogę ci nieść. Ale mam coś, co ty zrobisz szybciej niż ja z ręką w łubkach. Owijki, które ci dałem, na razie powinny wystarczyć — pomożesz mi, może znajdzie się dla ciebie coś lepszego.",
    working: "I jak, były? Bo babka pyta co wieczór, a ja nie mam czym się wykręcać.",
    turnIn: "Dawaj. I nie mów jej, że to przeze mnie — powiedz, że sam chciałeś.",
    newJob: "Zostań na chwilę. Tym razem to dla mnie, nie dla niej.",
    allDone:
      "Sześć tygodni i wracam. A jak wrócę, pokażę ci, jak stać, żeby cię nie przewrócili — tyle ci jestem winien.",
    /**
     * ⚠ Wymagane, odkąd Patryczek uczy umiejętności bojowych — bez tego
     * `pickGreeting` spada na zwykłe `greeting`, czyli na „pogadać mogę",
     * i gracz nie ma pojęcia, że stoi przed trenerem.
     *
     * Musi też rozbroić sprzeczność, którą sam ustawił: ma **rękę w łubkach**
     * i to jest udokumentowany powód, dla którego dotąd nie był trenerem
     * (`reka`, `allDone` obiecuje naukę dopiero za sześć tygodni). Rozwiązanie
     * jest w treści, nie w cofnięciu kontuzji: **uczy słowem, bo pokazać nie
     * może** — a to jest zresztą prawda o nauce walki i pasuje do postaci,
     * która nie znosi być bezużyteczna.
     */
    moreToTeach:
      "Ręką nie pokażę, ale gębą owszem. Siadaj. Połowa bicia to i tak wiedzieć, gdzie stanąć — reszta przyjdzie sama.",
  },
  topics: [
    /** Widoczna od pierwszego spojrzenia, więc bez bramki — to jest pytanie,
     *  które gracz zada natychmiast. ⚠ Puenta jest taka, że NIE złamał jej
     *  przegrywając: zero bohaterstwa, dokładne przeciwieństwo wilka
     *  Myśliwego. */
    {
      id: "reka",
      q: "Co masz z tą ręką?",
      a: "Złamana. Kostka, o tu. I zanim zapytasz — nie, nie w walce. Znaczy w walce, ale nie o człowieka: zamachnąłem się, chłop się schylił, a za nim był słup. Słup wygrał. Babka mi to złożyła, owiązała i powiedziała jedno zdanie, którego ci nie powtórzę. Sześć tygodni. Sześć tygodni i wracam.",
    },
    {
      id: "karczmy",
      q: "Często się tak bijesz?",
      a: "Biłem się. Po karczmach, za jedzenie albo za nic, i było mi z tym dobrze przez jakieś dwa lata. Potem policzyłem, ile z tego mam: krzywy nos, dwa zęby mniej i nikogo, kto by o mnie powiedział coś dobrego. Bić się umiem lepiej niż ktokolwiek tutaj. Tylko już nie po karczmach.",
      after: ["reka"],
    },
    /**
     * ⚠ **Pięć tematów niżej (nauka_teraz…ucieczka) to mini-tutorial walki z
     * `QUEST_01_WSTEP_DO_MYSLIWEGO.md` (2026-08-20), zaadaptowany.** Dokument
     * chciał to jako WYMUSZONĄ scenę przy pierwszym spotkaniu; tu są to
     * zwykłe, OPCJONALNE tematy — silnik nie ma mechanizmu wymuszonych
     * dialogów poza zwykłym systemem tematów, a wymuszanie czytania przed
     * pierwszą walką jest dokładnie tym, przed czym ostrzega samo §22.1 tego
     * dokumentu. Gracz, który chce iść prosto do Wszebora, po prostu nie
     * pyta.
     *
     * Świadomie NIE tłumaczą `family`/`AttackVariant`/jakości/materiałów
     * pancerza/krytyków — tylko trzy pojęcia, które gracz i tak zobaczy na
     * ekranie: obuch/cięcie/kłucie, zasięg, ucieczka. `nauka_teraz` otwiera
     * ten wątek i WPROST nazywa go zapowiedzią, nie substytutem — odsyła do
     * tego, co `moreToTeach` i tak już obiecuje, gdy ręka się zrośnie, więc
     * gra nigdy nie udaje, że formalny trening (`SKILLS`, `TrainerPanel`) nie
     * istnieje.
     */
    {
      id: "nauka_teraz",
      q: "Nauczysz mnie walczyć?",
      a: "Nie teraz i nie tą ręką. Ale mogę ci pokazać tyle, żebyś umiał się odgonić i uciec, jeśli coś wyskoczy z krzaków. Reszty nauczę cię, jak odzyskam rękę — to już inna rozmowa.",
      after: ["karczmy"],
    },
    {
      id: "dystans",
      q: "To co konkretnie mam wiedzieć?",
      a: "Po pierwsze: jak się już zamachujesz, to przez chwilę jesteś zajęty właśnie tym, nie niczym innym. Najpierw patrz, potem bij. Po drugie: masz kij, jest dłuższy od pięści czy pazurów — po coś ta długość jest. Nie właź przeciwnikowi pod nos.",
      after: ["nauka_teraz"],
    },
    {
      id: "obrazenia",
      q: "A różne bronie? Też się czymś różnią, poza tym, ile bolą?",
      a: "Tym kijem najwyżej komuś guza nabijesz — nie tnie, nie przebija, po prostu wali. To obuch. Miecz tnie, ale jak trzeba, można nim i pchnąć. Włócznia tylko kłuje, za to trzyma coś z zębami dalej od ciebie. Nie każda broń robi to samo, choćby miała tę samą liczbę wypisaną na rękojeści.",
      after: ["dystans"],
    },
    {
      id: "najlepsza_bron",
      q: "To która broń jest najlepsza?",
      a: "Nie ma najlepszej. Jest tylko lepsza do tego, co akurat stoi przed tobą.",
      after: ["obrazenia"],
    },
    {
      id: "ucieczka",
      q: "A jak coś mnie zaskoczy?",
      a: "Jak coś jest większe od ciebie albo przyjdzie ich kilku, nie musisz niczego udowadniać. Odganiasz się i uciekasz. Nikt cię tu nie osądzi za to, że wróciłeś cały — ja bym wolał, żebyś wracał cały, niż żebyś wygrywał.",
      after: ["dystans"],
    },
    /**
     * ⚠ Zahacza o `BLACKSMITH.topics.miasto` („na północ, przez most, cztery
     * dni wozem"), więc miasto zbiera trzeci głos: kowal wozi, Anna handluje,
     * Patryczek chce tam walczyć. **Nikt z nich go nie opisuje** — reguła z
     * `swiat.md` o łańcuchach kończących się bez odpowiedzi obowiązuje.
     */
    {
      id: "turniej",
      q: "To po co dalej trenujesz?",
      a: "W mieście raz do roku robią turniej na pięści. Bez broni, bez koni, bez nazwiska — stajesz i się bijesz. Wygrany bierze tyle srebra, że nie musi orać. Nie znam nikogo stąd, kto by tam był, i nikogo, kto by wiedział, jak to wygląda naprawdę. Ale wiem, że mnie tam nikt nie zapyta, czyim jestem wnukiem.",
      after: ["karczmy"],
    },
    {
      id: "babka_ziola",
      q: "A tymczasem mielesz zioła.",
      a: "Mielę zioła. Suszę, wiążę w pęczki, wynoszę na strych i przynoszę ze strychu. Babka mnie wychowała, więc się nie skarżę — głośno. Tylko wiesz, jak to jest robić dokładnie to, do czego się nie nadajesz, jedną ręką, przez sześć tygodni? Ona twierdzi, że mi to dobrze zrobi. Chyba nawet nie chodzi jej o zioła.",
      after: ["reka"],
    },
    /**
     * ⚠ **Temat, który ODMAWIA odpowiedzi** — o matce nie mówi i nie ma
     * powiedzieć. Ten świat ma już dwa takie miejsca (most, urwane „a ja...
     * nieważne" Myśliwego) i to jest jego sprawdzony chwyt.
     *
     * Osobno warte uwagi: ojciec gracza POSZEDŁ NA WOJNĘ I WRÓCIŁ (cały
     * łańcuch `ojciec_wojsko` → `wojna` → `a_ty`), a ojciec Patryczka po
     * prostu zniknął. Dwa różne rodzaje nieobecnego ojca, obok siebie.
     */
    {
      id: "rodzice",
      q: "A rodzice?",
      a: "Ojciec poszedł, jak miałem cztery lata. Nie umarł, nie zaginął — poszedł. Babka mówi, że na południe, i tyle o nim wiem. ...Matka nie żyje. Chorowała i umarła, i nie, nie będziemy o tym rozmawiać, teraz ani później. Pytaj mnie o cokolwiek innego, odpowiem.",
      after: ["babka_ziola"],
    },
    /**
     * Krzyżuje się z ZOFIĄ (`ZOFIA.topics.sama`) — druga bramka obok
     * `rodzice`, więc trzeba usłyszeć OBIE historie, u dwóch różnych osób,
     * zanim Patryczek to powie: że sam stracił matkę i wychowała go babka,
     * i że wdowa radzi sobie sama, z dwójką dzieci, bez pytania kogokolwiek
     * o pomoc. Ten sam mechanizm globalnego zbioru zadanych pytań co przy
     * `MERCHANT.topics.szary` → Sołtys — tu spina dwie osobne postaci, nie
     * jedną historię.
     *
     * ⚠ Świadomie NIE dotyka `docs/wioska_plan.md`'s „kluczowej sceny" Zofii
     * (moment, w którym ktoś pierwszy raz nazywa gracza „myśliwym") — to
     * osobna, poważniejsza fabularna nić i ten temat celowo stoi obok niej,
     * niżej w stawce.
     *
     * Wiek (35 vs ~20) i sytuacja (dwoje dzieci, teść) są nazwane wprost
     * jego własnymi ustami, nie przemilczane — to samo „ciepły realizm", co
     * przy `turniej`/`karczmy`: on wie, jak to wygląda, i mówi to pierwszy.
     */
    {
      id: "zofia",
      q: "A ty? Nikogo nie masz na oku?",
      a: "...Chyba mam. Zofia. Wiem, jak to brzmi — piętnaście lat różnicy, dwoje dzieci, jej teść, co ledwie widzi, a ja przychodzę do niej ze złamaną ręką i bez grosza przy duszy. Ale ona nikogo nie prosi o pomoc, nawet kiedy powinna, i to mnie w niej trzyma. Chyba zawsze mnie tak ciągnęło — do kobiet, które radzą sobie same. Do samotnych matek. Babka jest przecież taka sama, tylko że pilnowała mnie, nie własnych dzieci. Może to jedyny rodzaj kobiety, jaki w ogóle rozpoznaję.",
      after: ["rodzice", "sama"],
    },
  ],
  portraitTexture: "patryczek-portrait",
  /** Awaryjny tint, gdyby portret się nie wczytał — konwencja jak u reszty. */
  tint: 0xb8a07a,
} as const;

export const ANNA = {
  id: "anna",
  name: "Anna",
  greeting:
    "A, nowa twarz. Chleb jest świeży, wczorajszy tańszy, a jak szukasz chudej czarnej suki, to ja też.",
  /** Ma sklep, więc `broke` jest jedyną linią zależną od stanu, jaką
   *  `NpcDialog.pickGreeting` u niej odpali — nie ma zadań (patrz komentarz
   *  nad `quests` niżej), więc `firstJob`/`turnIn`/`working` nigdy by nie
   *  wystąpiły. Ten sam układ co u Kowala przed `droga_na_wschod`. */
  greetings: {
    broke: "To se popatrz. Patrzeć nie ubywa, chleba ubywa.",
  },
  interactRange: MERCHANT.interactRange,
  /** Policzone z REALNEJ wysokości jej portretu (108 px, `tools/build_anna.py`),
   *  tą samą metodą co u Zofii i Kuby: cel to ~1.1× wysokości gracza (66 px),
   *  więc 66/108 ≈ 0.61. Wspólna stała renderowałaby ją za dużą — jest
   *  najwyższym portretem w obsadzie. */
  scale: 0.61,
  /**
   * Jedyny sklep z jedzeniem w grze. Świadomie JEDNA pozycja: `bread` jest
   * dziś jedynym kupowalnym jedzeniem, a `cooked_meat` nie może tu trafić —
   * brak jego ceny kupna to jest to, co kupują 3 punkty za Pieczenie
   * (patrz komentarz przy obu przedmiotach). `health_potion` też nie:
   * `wioska_plan.md` D-3 przeniósł mikstury do Doroty i to ma zostać
   * jej domeną.
   */
  stock: ["bread", "eggs", "cheese"],
  /**
   * ⚠ **Zero zadań i to jest CHARAKTERYSTYKA, nie brak treści.** Autor
   * ustalił wprost: Anna jest samodzielna i „nie potrzebuje pomocy póki
   * co". W wiosce, gdzie Gniewko zrzuca się piątką domów na wilki, Dobek
   * woli stracić niż poprosić, a Zofia pyta „kto miałby pójść zamiast
   * mnie", osoba, która po prostu radzi sobie sama, jest kontrastem —
   * i dlatego jej brak zlecenia ma być widoczny w rozmowie (patrz temat
   * `sama_sobie`), a nie po cichu wyglądać jak niedokończony NPC.
   *
   * Docelowo dostanie zadania wokół cotygodniowego wyjazdu na targ
   * (patrz temat `targ`) — ale dopiero wtedy, gdy miasto będzie czymś
   * więcej niż kierunkiem, o którym mówi Kowal w `miasto`.
   *
   * ⚙ **Wyjątek 2026-10-12: Kirka** (`OI-174`, życzenie autora). Napisany
   * tak, żeby charakterystyki NIE złamać: Anna nie prosi — gracz się upiera
   * („Jak już koniecznie chcesz się na coś przydać…”).
   */
  quests: ["szukaj_kirki"],
  topics: [
    /**
     * Bandyci (`OI-171`): `swiat.md` — „miejscowi bandyci jej nie ruszają",
     * bo jeden z tych, którzy smalą do niej cholewki, poprosił. Anna WIE, kim
     * są niektórzy, i tego nie powie. Pytanie wychodzi dopiero po rozmowie
     * z Ciechanem (zbiór zadanych pytań jest globalny).
     */
    {
      id: "anna_zboje",
      q: "Sama wozisz na targ. Zbójów się nie boisz?",
      a: "Mnie? A czego by chcieli od baby z koszem pierogów. Znam tu i ówdzie ludzi, co znają ludzi — nie pytaj, kogo. Lepiej nie wiedzieć, to się potem nie trzeba przed nikim tłumaczyć. A Bolkowi powiedz, żeby następnym razem mnie zabrał. Ze mną by nie zaczepili.",
      after: ["zrabowany_woz_temat"],
    },
    /**
     * ⚠ Ta kwestia wymienia CZTERY kolory kotów i wszystkie cztery istnieją
     * w grze (`ASSETS.cat.colors`: black/brown/orange/white). To nie jest
     * ozdobnik — rudy kot jest pointą, więc musi być czym się rozczarować.
     * Patrz notatka o losowaniu koloru przy `pickCatVariant`.
     */
    /**
     * Jej właściwa rola: skupuje to, co wieś wytwarza, i raz w tygodniu
     * wiezie to do miasta. Kupowanie chleba od niej pod karczmą (autor
     * 2026-10-10: kuzynka Bogusza, mieszka przy karczmie) to końcówka
     * tego łańcucha, nie cała robota.
     *
     * ⚠ Zahacza o `BLACKSMITH.topics.miasto` („na północ, przez most,
     * i dalej — do miasta. Cztery dni wozem"), ale **nie odpowiada na nic,
     * czego tamten temat nie mówi**, i celowo nie opisuje miasta. Zasada
     * z `docs/swiat.md` jest ta sama co przy pająkach i moście: łańcuch
     * pytań ma kończyć się bez odpowiedzi. Ona po prostu tam jeździ.
     */
    {
      id: "targ",
      q: "Skąd bierzesz to, czym handlujesz?",
      a: "Stąd. Mąka od Miłosza, jajka z kurnika, ser jak krowy dają, len od Witka jak wybije sezon. Wieś tego nie sprzeda sama sobie — każdy ma tego trochę za dużo i wszystkiego innego za mało. Więc raz w tygodniu ładuję wóz i jadę na targ, a wracam z monetą i solą. Tu, pod karczmą, sprzedaję tylko to, co zostało albo się nie doczeka.",
    },
    /**
     * ⚠ To jest temat, który **czyni brak zadań widocznym**. Bez niego
     * gracz obszedłby wszystkich zleceniodawców i wyszedł z wrażeniem, że
     * Anna jest niedokończona. Z nim jej „nic od ciebie nie chcę" jest
     * odpowiedzią, a nie ciszą — i osadza ją naprzeciw reszty wsi, gdzie
     * każdy kogoś o coś prosi.
     */
    {
      id: "sama_sobie",
      q: "Nie potrzebujesz pomocy przy tym wozie?",
      a: "Nie. I wiem, jak to brzmi w wiosce, gdzie połowa ludzi czeka, aż ktoś inny pójdzie pierwszy. Jeżdżę cztery lata, znam drogę, znam wagę i znam ceny lepiej niż ci, co mi towar dają. Jak kiedyś będę czegoś potrzebowała, to powiem wprost i nie będę owijać. Póki co — kup chleb i tyle będzie z tej pomocy.",
      after: ["targ"],
    },
    {
      id: "koty",
      q: "Czemu te koty tak od ciebie uciekają?",
      a: "Nie wszystkie. Czarny daje się głaskać od razu, biały po dwóch dniach, bury jak ma humor. Ale rude? Rude ani razu. Trzy lata próbuję i mam z tego tyle, że rudego poznaję z drugiego końca placu, zanim on pozna mnie. Podobno kolor nic nie znaczy. Niech to ktoś powie tym kotom.",
    },
    {
      id: "slimaki",
      q: "I dlatego ślimaki?",
      a: "I dlatego ślimaki. Nie uciekają, nie drapią, nie trzeba ich wołać po zmroku. Winniczek dochodzi dwa lata, zanim się nadaje, więc jak zacznę tej wiosny, to pierwsze będę miała na przedostatnie żniwa — i wtedy zobaczymy, kto się śmiał. Matka mówi, że to nie zajęcie dla dorosłej kobiety. Matka mówiła też, że pszczoły to fanaberia, a miód je co niedzielę.",
      after: ["koty"],
    },
    /**
     * ⚠ „Szczeka raz, daleko" to NIE jest metafora — `tools/gen_audio.py`
     * (`village_ambient`) wpisuje dokładnie jedno szczeknięcie psa na pętlę,
     * z komentarzem „więcej brzmi jak psiarnia". Kira (Kirka) jest tym psem. Zero
     * nowej grafiki i zero nowego dźwięku: istniejące tło dostaje imię
     * wstecz. Jeśli ktoś kiedyś zmieni ten dźwięk, ta kwestia przestaje być
     * prawdziwa — dlatego to tu stoi.
     */
    {
      id: "kirci",
      q: "Znalazła się ta twoja Kirka?",
      a: "Kira? Znajdzie się. Zawsze się znajduje — wieczorem, brudna, z miną, jakby to ja gdzieś poszła. Posłuchaj chwilę. Słyszysz? Jedno szczeknięcie, daleko, i tyle. To znaczy: żyje i jeszcze nie wraca.",
      after: ["koty"],
    },
  ],
  portraitTexture: "anna-portrait",
  /** Awaryjny tint, gdyby `anna_portrait.png` się nie wczytał — ta sama
   *  konwencja co u Kowala, Myśliwego i Kuby. */
  tint: 0xe8d9a8,
} as const;

export const GNIEWKO = {
  id: "gniewko",
  name: "Pasterz",
  greeting: "Nie machaj rękami, bo mi się rozejdą. Gadaj spokojnie, one słuchają.",
  interactRange: MERCHANT.interactRange,
  /** Nie `BLACKSMITH.scale` — policzone z REALNEJ wysokości jego portretu
   *  (84px zmierzone przez `tools/build_gniewko.py`), ta sama metoda co u
   *  Kuby/Zofii: cel to ~1.1× wysokości gracza, czyli 66px, więc 66/84 ≈
   *  0.79. */
  scale: 0.79,
  stock: [],
  /**
   * **Trzeci dawca zadań w grze i pierwszy, którego się nie spotyka po drodze
   * — do niego trzeba zostać wysłanym** (`MERCHANT.topics.owce`). To jest cała
   * różnica między nim a Sołtysem: Sołtys stoi na rynku i zaczepia, Gniewko
   * stoi na ugorze za wsią i nikt by tam nie zaszedł bez powodu.
   *
   * Zadanie chodzi **przez portal w obie strony**: bierze się je we wsi,
   * robi w lesie i oddaje we wsi. Do tej pory każde zadanie dawało się
   * domknąć po jednej stronie bramy albo (jak `know_the_village`) w całości
   * po drugiej — to jest pierwsze, które wymaga wrócenia.
   */
  quests: ["wolf_pack_cull"],
  /**
   * Wymagane, bo ma zadanie — `NpcDialog.pickGreeting` sięga po `firstJob`/
   * `turnIn`/`working` w chwili, gdy NPC ma cokolwiek do dania, a brak linii
   * renderuje pustą ramkę.
   *
   * `notYet` obsługuje okno przed `rabbit_hunt`: gracz może tu zajść sam,
   * zanim ktokolwiek go tu wysłał, i wtedy pasterz nie oddaje cudzego stada w
   * ręce chłopaka, którego widzi pierwszy raz.
   */
  greetings: {
    /**
     * ⚠ **Przepisane 2026-08-22 — realny bloker złapany statycznym odczytem
     * tekstu (nie live playtest, pane nie renderuje w tym środowisku).**
     * `wolf_pack_cull` odblokowuje się dopiero PO oddaniu `know_the_village`,
     * więc podczas obchodu w jej ramach („Sprawy Zagajów" wysyła gracza tu
     * po informację o wilkach) Gniewko mechanicznie nie ma jeszcze żadnego
     * zadania i pada właśnie na ten tekst. Poprzednia wersja („nie płosz mi
     * ich") czytała się jak odprawienie — dokładnie odwrotnie niż to, po co
     * Sołtys tu wysłał. Nowa wersja NIE otwiera questa (to wciąż `notYet`,
     * mechanika się nie zmienia), ale oddaje informację, którą obchód miał
     * dostarczyć.
     */
    notYet:
      "Wilki? Podchodzą bliżej, niż podchodziły. Straciłem już kilka owiec i nie jestem jedyny. Jak wrócisz z czasem, pogadamy poważnie — teraz tylko pilnuję stada.",
    firstJob:
      "A, to ty. Myśliwy mówił, że kogoś przyśle. Chodź, policzymy razem, bo sam już nie chcę.",
    working: "Idź na południowy zachód, za bród. Tam gdzie las ciemnieje. I licz.",
    turnIn: "Wróciłeś. To znaczy, że albo skończone, albo cię popędzili. Mów.",
    allDone:
      "Stado chodzi spokojniej. Psy śpią całą noc, a ja z nimi. Jakby co, wiesz gdzie mnie szukać — stoję tu każdego dnia.",
  },
  topics: [
    {
      id: "czyje_owce",
      q: "Wszystkie te owce są twoje?",
      a: "Dziewięć moich, reszta cudza. Kowalowa ma jedną, sołtys trzy, Dobek dwie i tak dalej — wypasam je razem za wełnę z każdej dziesiątej. Dlatego całe stado chodzi jako jedno i dlatego, jak coś się z nim stanie, to nie jest moja strata. To jest strata pięciu domów naraz, a tłumaczyć się będę ja jeden.",
    },
    {
      id: "pasterz_wilk",
      q: "Boisz się tego wilka?",
      a: "Ja się nie boję, ja liczę. Owca to trzy lata karmienia. Wilk potrzebuje jednej nocy i nie zjada jednej — płoszy sześć, gryzie dwie, zjada pół. Od kiedy Myśliwy leży, zaganiam stado o godzinę wcześniej i śpię przy nim, a psy mam dwa zamiast jednego. To nie strach. To rachunek, który mi wychodzi coraz gorzej.",
      after: ["szary"],
    },
    /**
     * Domyka odesłanie od Myśliwego (`MERCHANT.topics.owce`) — i robi to
     * **liczbą, nie żalem**. Cała reszta wsi mówi o wilku jak o opowieści;
     * on jeden podaje straty, a straty są cudze.
     *
     * To także jedyne miejsce, gdzie pada, że wilków jest TRZY. Zadanie prosi
     * o trzy sztuki i nigdzie indziej nie tłumaczy skąd ta liczba.
     */
    {
      id: "ile_zabraly",
      q: "Myśliwy mówi, że straciłeś owce. Ile?",
      a: "Cztery. W ciągu dwóch tygodni. Jedna moja, trzy cudze — i to jest gorsza połowa tego zdania. Dwie nocy temu widziałem je na własne oczy, jak schodziły z grzbietu: trzy sztuki, jedna za drugą, spokojnie jak stado. Nie jeden zabłąkany. Sfora. Sfora nie odejdzie sama, bo znalazła miejsce, gdzie jedzenie stoi w zagrodzie i czeka.",
      after: ["owce"],
    },
  ],
  /** Ma własny portret (`ASSETS.gniewko`); `tint` zostaje wyłącznie jako
   *  awaryjny, gdyby ta tekstura kiedyś nie wczytała się — dokładnie tak samo
   *  jak u Kuby, Kowala i Myśliwego. Surowa wełna — kremowy szarobeż. */
  portraitTexture: "gniewko-portrait",
  tint: 0xcfc4ac,
} as const;

/**
 * Active combat abilities, on cooldowns, unlocked at fixed levels.
 *
 * ── Why level-gated and not bought from the trainer ──────────────────────
 * Levelling had become thin: one attribute point and nothing else. Handing out
 * an ability at a milestone level is what makes a level-up an event again, and
 * it costs the player nothing they'd rather spend elsewhere. Skills bought from
 * the Hunter stay what they are — passive unlocks (Skórowanie, Pieczenie).
 *
 * ── Why cooldowns and no mana ────────────────────────────────────────────
 * A resource bar is a second economy to teach, read and balance on a phone
 * screen that is already carrying a joystick, an attack button and a quick
 * slot. Cooldown length alone gives the same "when, not whether" decision.
 * Mana can come later if abilities ever need to compete with each other.
 *
 * The three below deliberately answer three DIFFERENT pressures rather than
 * being three flavours of damage — each maps onto an enemy we actually ship:
 *   • Unik      → the boar's telegraphed charge (a dodge you can aim)
 *   • Wir ostrzy→ the rabbit swarm (five of them, one at a time is tedious)
 *   • Okrzyk    → the boar's HP pool (a burst window worth saving)
 */
/**
 * Ile umiejętności mieści się na pasku naraz.
 *
 * ⚠ **To jest liczba wzięta z POMIARU EKRANU, nie z gustu** — i historia tego
 * pomiaru jest pouczająca, więc zostaje.
 *
 * **3 (do 2026-08-21):** kolumna nad quick slotem mieściła dwa przyciski;
 * trzeci stał na y −1. Pomiar był robiony przy `uiH` = 375, czyli **przed
 * wprowadzeniem skali UI** — po niej wysokość wirtualna to zawsze 580 i sama
 * kolumna zmieściłaby więcej. Zdanie „podniesienie wymaga przeniesienia paska
 * w poziom" było więc oparte na liczbie, która przestała obowiązywać, a nikt
 * tego nie zauważył przez pięć dni.
 *
 * **4 (od 2026-08-21):** pasek leży na łuku (`HUD_LAYOUT.rings.abilities`),
 * gdzie wszystkie cztery są 40–44 mm od kciuka. Piąty slot **mieści się
 * geometrycznie, ale nie ergonomicznie**: kolumna dawała mu 60 mm, a na łuku
 * musiałby zejść na pierścień przedmiotów (~52 mm) i tak byłby najwolniejszy
 * z pięciu. Decyzja autora (gracz WoW-a): pasek na cztery to nie oszczędność
 * miejsca, tylko sąd o tym, ile rzeczy gracz naprawdę śledzi.
 *
 * ⚠ Zmiana tej liczby jest bezpieczna dla ZAPISU w obie strony:
 * `Abilities.restoreSlots` iteruje po DZISIEJSZEJ długości tablicy i czyta
 * `saved[i]`, więc krótszy zapis daje `null`, a dłuższy jest przycinany.
 * Żadnego podbicia `SAVE_VERSION`.
 *
 * **6 (od 2026-10-12, prośba autora: „4 to chyba mało jak na grę, która
 * kiedyś będzie miała o wiele więcej umiejętności").** Miejsce nie przyszło
 * z dalszego łuku, tylko z WEWNĘTRZNEGO pierścienia (22–30 mm), który do tej
 * daty zajmowały trzy przyciski typu ataku — zmienianego raz na walkę. Typ
 * zszedł do jednego przycisku na zewnętrznym łuku (`HUD_LAYOUT.place`), więc
 * sześć umiejętności stoi w paśmie 22–41 mm, czyli BLIŻEJ kciuka niż cztery
 * dotychczasowe (33–41 mm).
 *
 * ⚠ Podnosząc dalej: **najpierw dopisz slot w `HUD_LAYOUT.place.ability`**,
 * inaczej nadmiarowy przycisk nie zostanie narysowany (ostrzeżenie w konsoli
 * z `warnIfOverflow`). Następny krok to raczej pasek PER ZESTAW BRONI niż
 * siódmy przycisk — `docs/ui_mobile_research.md`.
 */
export const ABILITY_SLOTS = 6;

/**
 * ── ZMIANA ZESTAWU BRONI Z HUD-u (2026-10-12, prośba autora) ───────────────
 *
 * Przygotowanie pod łucznika z mieczem i tarczą: zamiana `weapon`/`offhand`
 * z `weapon2`/`offhand2` jednym przyciskiem, bez otwierania panelu.
 * `Equipment.swapWeaponSet()` istniał wcześniej — zamiana żyła WYŁĄCZNIE
 * w panelu, który pauzuje grę, z zapisanym zastrzeżeniem, że „zamiana broni
 * w walce" to OSOBNA mechanika (czas przełożenia, okno bezbronności, koszt).
 *
 * ⚠⚠ **Liczby niżej są ROBOCZE i minimalne** — jedynie bariera przed
 * migotaniem zestawów, nie wycena zamiany w walce. Pełna mechanika (czas
 * przełożenia z animacją, koszt staminy, okno bezbronności) czeka na
 * decyzję autora i na łuk (etap 3 roadmapy).
 */
export const WEAPON_SWAP = {
  /** Najkrótszy odstęp między zamianami (ms). Zapobiega przełączaniu co klatkę.
   *  ⛔ Kosztu staminy i czasu przełożenia celowo tu NIE ma — patrz wyżej. */
  cooldownMs: 1000,
} as const;

/**
 * Celowanie kierunkowe umiejętności — prototyp `Szerokiego cięcia` (2026-08-23).
 *
 * ⚠ **Brak progu long-press i to jest decyzja.** `pointerdown` pokazuje podgląd
 * NATYCHMIAST; o tym, czy to był tap czy przeciągnięcie, rozstrzyga wyłącznie
 * DYSTANS palca, sprawdzany dopiero przy puszczeniu. Próg czasowy (typowe
 * 200–300 ms) kupowałby to samo rozróżnienie za cenę opóźnienia KAŻDEGO
 * szybkiego użycia — a szybkie użycie jest w tej grze przypadkiem częstszym.
 */
/**
 * **DUAL WIELD — PROTOTYP MECHANIKI (2026-09-05). NIE JEST TO BALANS.**
 *
 * Zakres tej rundy jest wąski i celowo taki: sprawdzić w działającej grze, czy
 * dwie bronie jako **dwa niezależne profile ciosu** współpracują z istniejącym
 * systemem walki. Ataki idą **naprzemiennie MH → OH → MH → OH** na jednym
 * `pendingSwing`; każda ręka niesie własną broń, własne Władanie, własne
 * Mastery, własne obrażenia, własny typ i własną cechę rodziny.
 *
 * ⛔ **CZEGO TU ŚWIADOMIE NIE MA — i to nie jest przeoczenie:**
 * mnożników kary main-hand i off-hand, bramek poziomów Dwuręczności (DW I–V),
 * efektów, proców, zasobów, movesetu, nowych zdolności ani wyrównania DPS do
 * 1H/2H/tarczy. Prototyp ma odpowiedzieć na pytanie **„czy to działa i jak się
 * czuje"**, a nie „ile ma zadawać". Kary i progresja są osobnym etapem
 * projektowym — kierunek zapisany w `docs/archetypy_walki.md`.
 *
 * ⚠ **Dlatego każda ręka zadaje PEŁNE obrażenia swojej broni.** Dołożenie tu
 * mnożnika kary byłoby balansowaniem prototypu, zanim wiadomo, czy mechanika
 * jest dobra — czyli dokładnie odwrotną kolejnością.
 */
export const DUAL_WIELD = {
  /**
   * Mnożnik tempa, wpuszczany istniejącym kanałem `Equipment.offhandSwingMul`
   * (tym samym, którym tarcza spowalnia zamach).
   *
   * ⚠⚠ **LICZBA PLACEHOLDEROWA, nie wynik strojenia.** Stoi tu wyłącznie po to,
   * żeby prototyp miał jakiekolwiek tempo do oceny ręką. Jest poniżej 1, bo
   * przy 1 model naprzemienny jest z konstrukcji stratą (połowa ciosów idzie
   * słabszą ręką przy niezmienionej kadencji) — czyli nie dałoby się ocenić
   * niczego poza tym, że jest gorzej.
   *
   * ⚠ **Nie dobierać jej „na oko" przy pierwszym playteście.** Kadencje
   * parytetu policzone na żywym configu leżą w analizie z 2026-09-05; strojenie
   * ma zacząć się od nich, a nie od zgadywania.
   */
  swingMul: 0.85,
} as const;

export const ABILITY_AIM = {
  /**
   * Ile palec musi przejechać (w jednostkach UI), żeby to było celowanie,
   * a nie tapnięcie. Poniżej — cios idzie w aktualny zwrot postaci.
   *
   * ⚠ Odniesienie: komórka przycisku umiejętności ma 76 j.
   * (`HUD_LAYOUT.rings.middle.cell`), więc 18 to niecała ćwiartka
   * przycisku — mniej niż naturalne drgnienie kciuka przy tapnięciu, a wyraźnie
   * mniej niż świadome przeciągnięcie.
   */
  deadzonePx: 18,
  /**
   * Promień STREFY ANULOWANIA wokół środka przycisku: przeciągnij palec
   * z powrotem na przycisk i puść, żeby wyjść z gestu — bez kosztu, bez
   * cooldownu.
   *
   * ── ⚠ Czemu strefą jest SAM PRZYCISK, a nie osobne pole w rogu ──────────
   * Osobne pole musiałoby gdzieś leżeć, a każde miejsce na ekranie leży
   * w jakimś KIERUNKU od przycisku — czyli **zabierałoby ten kierunek
   * celowaniu**. Pole przy kotwicy klastra (przycisk ataku) zjadłoby cel
   * w prawo-dół, czyli ćwiartkę, w którą gracz naturalnie celuje stojąc tyłem
   * do rogu. Środek nie jest kierunkiem: to punkt, z którego kierunki
   * wychodzą, więc „wróć do początku" nie koliduje z niczym.
   *
   * ⚠ **Większy niż `deadzonePx` i to jest zamierzone.** Rozpoczęcie celowania
   * ma być trudniejsze do przypadkowego wywołania niż jego przerwanie:
   * pomyłka w jedną stronę kosztuje cooldown, w drugą nie kosztuje nic.
   *
   * ⚠ Równy połowie komórki przycisku (76 j.), więc strefa pokrywa się z tym,
   * co gracz widzi jako przycisk — i dokładnie tam rysuje się znak ✕.
   */
  cancelRadiusPx: 38,
  /**
   * ⭐ **Tryb „dotknij, potem cel"** (`Settings.aimMode = "tap"`, 2026-10-14):
   * dotknięcie świata bliżej niż tyle pikseli ŚWIATA od ciała wroga celuje
   * w to ciało, nie w punkt pod palcem. Palec zasłania cel, a model 3D stoi
   * wyżej niż jego stopy — trafienie „w tułów" ląduje kilkanaście px od ciała.
   * Rząd wielkości: ciało dzika 46 px, pole trafienia tułowia × 1/sin θ.
   */
  tapSnapPx: 40,
  /**
   * ⚠ **O anulowaniu decyduje PUSZCZENIE, nie przejechanie.** Palec wędrujący
   * przez środek w drodze na drugą stronę niczego nie przerywa — inaczej
   * przeciągnięcie z lewej na prawą gasiłoby gest w połowie.
   *
   * ⚠ **Anulowanie działa DOPIERO po przekroczeniu deadzone.** Puszczenie bez
   * przeciągnięcia to nadal szybkie tapnięcie (cios w zwrot postaci), więc te
   * dwa odczyty tego samego miejsca rozróżnia flaga `dragged` — i dlatego
   * znak ✕ zapala się dopiero wtedy, gdy naprawdę coś znaczy.
   */
  /**
   * ⚠ **Po przekroczeniu deadzone kierunek ZOSTAJE analogowy**, nawet gdy palec
   * wróci do środka. Powrót do zwrotu postaci w połowie gestu czytałby się jak
   * zerwanie celowania, a gracz i tak trzyma palec.
   */
  preview: {
    /** Pełny obrys ZASIĘGU — informacja, nie obszar obrażeń. Subtelny. */
    reachColor: 0xffffff,
    reachAlpha: 0.16,
    reachWidth: 2,
    /** Wycinek łuku — RZECZYWISTY obszar obrażeń. Wyraźniejszy od obrysu. */
    arcColor: 0xc8d0e0,
    arcFillAlpha: 0.2,
    arcLineAlpha: 0.55,
    arcWidth: 2,
    /** Znaczniki celów, które NAPRAWDĘ oberwą — inaczej sufit `maxTargets`
     *  jest regułą niewidzialną. */
    primaryColor: 0xffd166,
    secondaryColor: 0xc8d0e0,
    markerAlpha: 0.9,
    markerWidth: 2,
    /** O ile marker jest większy od hurtboxa celu (px). */
    markerPadPx: 3,
    /**
     * Mnożnik alfy podglądu, gdy palec stoi nad ✕ (puszczenie = anuluj).
     *
     * ⚠ **Podgląd musi zgadzać się ze znakiem na przycisku.** Klin narysowany
     * pełną mocą nad zapalonym ✕ mówiłby dwie sprzeczne rzeczy naraz; celów
     * nie zaznaczamy wtedy wcale, bo żaden nie oberwie.
     */
    cancelAlphaMul: 0.35,
    /** Znak ✕ na przycisku: kolor spoczynkowy i „puścisz — anulujesz". */
    cancelColor: 0xd8dee9,
    cancelHotColor: 0xff6b6b,
    cancelWidth: 3,
    /** Długość ramienia ✕ jako ułamek średnicy przycisku. */
    cancelArmFrac: 0.24,
    /**
     * Podgląd wskazania celu (`directionTarget`, dziś Szarża).
     *
     * ⚠ **Inny język niż łuk i to jest wymaganie, nie gust.** Łuk mówi „tu
     * zadam obrażenia na obszarze"; to ma powiedzieć „TEN przeciwnik zostanie
     * celem i TĘDY do niego polecisz". Stąd zero wypełnień — każde pole
     * czytałoby się jako AoE.
     */
    target: {
      /** Cienki obrys zasięgu i granice sektora (`reachAndCone`). */
      reachColor: 0xffd166,
      reachAlpha: 0.3,
      reachWidth: 2,
      coneAlpha: 0.22,
      /**
       * Pasek lotu do wskazanego celu — **rdzeń tego podglądu**.
       *
       * ⚠ **Nie dokładaj tu pierścieni zasięgu ani sektora.** Próbowane
       * dwukrotnie i dwukrotnie odrzucone po playteście: pełne okręgi czytały
       * się jak AoE, a korytarz przycięty sektorem dalej czytał się jako
       * „zakres działania". Pasek mówi KTO i KTÓRĘDY, i nic ponadto.
       *
       * ⚠⚠ **Zakaz dotyczy TEGO wariantu (`pathOnly`), nie kształtu okręgu
       * w ogóle — sprostowanie 2026-09-04.** Szarża ma dziś pasmo MIN/MAX
       * w osobnym języku (`lane` niżej) i jest czytelne, bo okręgi są cienkie,
       * kreskowane i przezroczyste, a ciężar odpowiedzi „kto jest w zasięgu"
       * niosą znaczniki kandydatów. Wracając tu z pierścieniem, przeczytaj
       * `docs/systemy/abilities.md` — tam stoją trzy warunki, przy których
       * wolno było wrócić do odrzuconego pomysłu.
       */
      pathAlpha: 0.75,
      pathWidth: 3,
      /**
       * **Język „pasa" — podgląd Szarży (2026-09-04).**
       *
       * ⚠ **Jedna reguła spina cztery stany: WYPEŁNIENIE znaczy „to się
       * wydarzy".** Pas pusty (same krawędzie) = Szarża w tym kierunku nie
       * pobiegnie; pas wypełniony = pobiegnie. Stąd: brak kandydata → pusty na
       * całej długości, rozbieg przed `minRange` → pusty i czerwony, właściwy
       * tor → wypełniony, odcinek za przeszkodą → znów pusty, czerwony, z ✕.
       * Bez tej reguły każdy z tych stanów potrzebowałby własnego elementu.
       *
       * ⚠ **Czerwień ma tu DWA natężenia i to nie jest niedopatrzenie.**
       * Rozbieg (`runup*`) wisi na ekranie przez cały czas celowania i musi
       * być ledwo widoczny; blokada (`block*`) pojawia się rzadko i ma być
       * mocna. Element stale obecny wygrywa o uwagę z rzadkim, więc różnica
       * musi być duża — plus rozróżnia je FORMA: blokada ma ✕, rozbieg nie.
       *
       * ⚠ **Podczas celowania gasimy globalny znacznik celu**
       * (`COMBAT_FEEDBACK.targetMarker`, czerwony `0xff5555`), więc czerwień
       * znaczy tu wyłącznie ograniczenie. Bez tego wygaszenia dwa czerwone
       * pierścienie o przeciwnym znaczeniu stałyby na ekranie naraz.
       */
      lane: {
        /**
         * ⚠ **To jest WSPÓLNE SŁOWNICTWO podglądu w świecie, nie własność
         * Szarży** — mimo nazwy. Czytają stąd oba dzisiejsze języki: `lane`
         * (Szarża: pasmo, tor, rozbieg, przeszkoda) i `reach` (Wypad: okrąg
         * zasięgu, kandydaci, cel, krótki tor skoku). Wspólne liczby są
         * powodem, dla którego „TEN przeciwnik" wygląda identycznie w każdej
         * umiejętności; rozjazd zaczyna się od skopiowania tego bloku.
         */
        /**
         * Szerokość pasa (px).
         *
         * ⚠ **Równa `PLAYER.bodyWidth`, i to nie jest zbieg okoliczności** —
         * tą samą liczbą pytamy `NavGrid.firstBlockedOn` o przejezdność. Pas
         * na ekranie i zapytanie o przeszkodę opisują ten sam kształt, więc
         * nie mogą powiedzieć dwóch różnych rzeczy.
         */
        widthPx: 18,
        /** Krawędzie pasa — cienkie, bo to tor ciała, nie obszar działania. */
        edgeColor: 0xdfe6f2,
        edgeAlpha: 0.34,
        edgeWidth: 1,
        /** Wypełnienie = „tędy naprawdę pobiegnę". Subtelne: ma czytać się
         *  jako tor, nigdy jako powierzchnia obrażeń. */
        fillColor: 0xdfe6f2,
        fillAlpha: 0.09,
        /** Szewrony kierunku — GEOMETRIA, nigdy `Text` (napis w świecie
         *  przerysowywany co klatkę to udokumentowana pułapka, patrz
         *  `src/ui/CLAUDE.md`). Tylko w części wypełnionej. */
        chevronColor: 0xdfe6f2,
        chevronAlpha: 0.5,
        chevronSpacingPx: 26,
        chevronSizePx: 7,
        /** Rozbieg gracz → `minRange`: czerwony, PUSTY, bez szewronów.
         *  ⚠ Bez szewronów świadomie — szewron to język RUCHU, a ten odcinek
         *  mówi o dystansie do celu, nie o fazie biegu (`minRange` jest
         *  bramką sprawdzaną przy naciśnięciu, nie etapem lotu). */
        runupColor: 0xff6b6b,
        runupAlpha: 0.34,
        /** Odcinek za przeszkodą + znak ✕. */
        blockColor: 0xff6b6b,
        blockAlpha: 0.85,
        blockWidth: 2,
        blockMarkPx: 7,
        /** Okrąg `minRange` — czerwony, cienki, rzadko kreskowany. */
        minColor: 0xff6b6b,
        /**
         * ⚠ **0,22 było PONIŻEJ PROGU WIDOCZNOŚCI tej gry** — zgłoszone
         * z rozgrywki 2026-09-04 jako „nie widzę okręgów". Odniesienie:
         * najsłabszy element podglądu uznawany za widoczny to obrys zasięgu
         * łuku (0,16 przy grubości **2**), a krawędź korytarza ma 0,34 przy
         * grubości 1. Ten okrąg jest **kreskowany** (mniej tuszu na obwodzie)
         * i **czerwony na zielonym podłożu** (wysoki kontrast barwy, niski
         * jasności), więc przy równej alfie czyta się wyraźnie słabiej niż
         * jasna, ciągła linia. Stąd wartość powyżej krawędzi korytarza —
         * hierarchię trzyma tu KRESKOWANIE, nie sama liczba.
         *
         * ⚠⚠ **Druga runda (ta sama data): „na desktopie widać, na telefonie
         * znika" ma przyczynę w JEDNOSTKACH, nie w guście.** Gra rysuje
         * w pikselach URZĄDZENIA (`core/Viewport.ts`), więc linia grubości 1
         * ma na telefonie z DPR ≈ 2,6 około **0,38 piksela CSS** — jest
         * fizycznie ~3× cieńsza niż ta sama linia na desktopie z DPR 1.
         * Rasteryzator rozmywa jej pokrycie na sąsiednie piksele i zostaje
         * ślad, nie kreska.
         *
         * Grubość jest ustalona na 1 (decyzja autora), więc jedyne dostępne
         * dźwignie to **alfa** i **wypełnienie obwodu kreskami**. Stąd
         * `dash 14° / gap 5°` — 74 % obwodu pokryte tuszem zamiast 60 %.
         * Ciągłego okręgu robić nie wolno: kreskowanie jest jedyną rzeczą,
         * która trzyma oba pierścienie poniżej toru w hierarchii.
         */
        minAlpha: 0.6,
        minWidth: 1,
        minDashDeg: 14,
        minGapDeg: 5,
        /** Okrąg `maxRange` — najsubtelniejszy element całego podglądu.
         *  ⚠ Na telefonie (widok 710 × 328 px, róg kadru ≈ 391 px) leży poza
         *  ekranem i nie narysuje ani piksela; wchodzi w kadr na szerszym
         *  widoku i przy krawędzi mapy. Świadomie zaakceptowane. */
        maxColor: 0xffffff,
        /**
         * ⚠ Ta sama poprawka progu co przy `minAlpha`, w dwóch rundach:
         * 0,1 → 0,28 → 0,4. Zostaje wyraźnie słabszy od MIN i rzadziej
         * kreskowany (61 % obwodu wobec 74 %), zgodnie z hierarchią.
         *
         * ⚠ **Ile z tego okręgu widać, decyduje GEOMETRIA, nie styl.** Kamera
         * trzyma gracza w środku kadru, a przy widoku 710 × 328 px najdalszy
         * widoczny punkt to ≈ 391 px. Przy `maxRange` 420 cały pierścień leżał
         * poza ekranem — **zawsze**; po zejściu do 360 (2026-09-04) wchodzi
         * w kadr w kierunkach ku rogom, ale nadal nie w pionie (do góry widok
         * sięga ~164 px). Pełny okrąg pokazuje się dopiero na dużym oknie
         * desktopowym albo gdy kamera przestaje śledzić gracza przy krawędzi
         * mapy. Alfa działa wyłącznie tam, gdzie pierścień w ogóle jest.
         */
        maxAlpha: 0.4,
        maxWidth: 1,
        maxDashDeg: 11,
        maxGapDeg: 7,
        /** Kandydat — DWA ŁUKI, nie pierścień. ⚠ Kształt, nie odcień:
         *  manekin treningowy ma własny neutralny PIERŚCIEŃ (`0xaab4c8`)
         *  i te dwa znaczą co innego. */
        candidateColor: 0xc8d0e0,
        candidateAlpha: 0.45,
        candidateWidth: 2,
        candidateArcDeg: 70,
        candidatePadPx: 4,
        /** Wybrany cel — jasny, półprzezroczysty żółty. */
        selectedFillAlpha: 0.16,
        selectedLineAlpha: 0.9,
        selectedWidth: 2,
        selectedPadPx: 4,
      },
    },
  },
} as const;

export const ABILITIES = {
  /**
   * ⚠ **Zastępuje dawny zamach po łuku BEZ celu**, który do 2026-08-16 był
   * domyślnym zachowaniem przycisku ataku. Model idzie w stronę WoW-a: cel plus
   * autoatak jednocelowy, a AoE jest umiejętnością, nie darmową własnością
   * broni.
   *
   * ⚠⚠ **ŁUK NALEŻY DO TEJ UMIEJĘTNOŚCI, NIE DO BRONI — decyzja 2026-09-18.**
   * Do tej daty kształt klina brał się z `melee.arcDeg` konstrukcji, przez co
   * 32 bronie trzymały liczbę od 22 do 104, której **nie czytało nic poza tym
   * jednym miejscem**: `damageLockedTarget` trafia wyłącznie wybrany cel, więc
   * w zwykłej walce łuk był daną martwą.
   *
   * ⛔ **Powód przeniesienia jest projektowy, nie porządkowy:** szeroki zamach
   * da się wykonać mieczem, toporem i maczugą tak samo. **Kąt działania
   * UMIEJĘTNOŚCI nie jest cechą konstrukcji broni** — zasięg jest, bo bierze
   * się z długości oręża, ale rozmach ramienia nie.
   *
   * ⛔ **Nie odtwarzaj odpowiednika `arcDeg` zależnego od broni** pod żadną
   * nazwą. Zależność od oręża zostaje tam, gdzie ma sens fizyczny: `reachPx`
   * dalej bierze się z `melee.reach` (`AbilitySpec.resolveAbility`).
   *
   * `unlockLevel: 1`, bo przywraca zachowanie, które kiedyś było darmowe —
   * bramką jest trener i złoto, nie poziom.
   */
  cleave: {
    id: "cleave",
    /** Koszt staminy. Jeden zamach na szerokość — wysiłek zbliżony do zwykłego
     *  ciosu, tylko rozłożony na cały łuk. */
    staminaCost: 10,
    /**
     * ⭐⭐ **PÓŁ-łuk klina, w stopniach — własność UMIEJĘTNOŚCI od 2026-09-18.**
     * 90 znaczy **180° w sumie**, czyli całą przednią półkulę.
     *
     * ⚠⚠ **Ta liczba jest DECYZJĄ, a nie zachowaniem stanu sprzed migracji** —
     * i musi taką zostać nazwana, bo stanu sprzed migracji nie było: były
     * 32 różne liczby (22° mizerykordii … 104° wielkiego miecza, mediana ~58).
     * Nie da się „nie zmienić" czegoś, co nie miało jednej wartości.
     *
     * ⭐ **90 nie jest wzięte z powietrza — to `FRONT_ARC_DEG`**, czyli liczba,
     * którą ta gra już nazywa „przodem": tym samym kątem bramkowany jest atak
     * (`PLAYER.attackFrontArcDeg`) i blok tarczą (`SHIELD.blockArcDeg`).
     * Umiejętność o nazwie *„zamach na całą szerokość"* trafia dokładnie to,
     * co postać ma przed sobą — i to jest zdanie, które da się powiedzieć
     * graczowi.
     *
     * ⛔ **ŚWIADOMIE NIE czyta `FRONT_ARC_DEG` przez stałą, tylko powtarza
     * wartość.** Tamta stała ma w komentarzu jawne ostrzeżenie: *„strojąc
     * tarczę, stroisz też bramkę ataku"* — sprzężenie jest tam ZAMIERZONE
     * i pilnowane przez `§L`. Dopisanie trzeciego konsumenta rozciągnęłoby je
     * po cichu na umiejętność, czyli strojenie tarczy zmieniałoby zasięg
     * Szerokiego cięcia. ⚠ To jest ten sam rodzaj cichego sprzężenia, przed
     * którym ostrzega sam `FRONT_ARC_DEG`.
     *
     * ⏳ **Do potwierdzenia ręką na gałce.** 90 poszerza klin wobec 26 z 32
     * dotychczasowych broni i zawęża wobec sześciu; `maxTargets` poniżej i tak
     * ogranicza skutek. ⛔ Nie stroić tego z wyliczenia — patrz `OI-113`.
     */
    halfArcDeg: 90,
    name: "Szerokie cięcie",
    unlockLevel: 1,
    cooldown: 5,
    /** Poniżej 1, bo jednym zamachem bierze wszystko w łuku broni — dokładnie
     *  ten sam powód, dla którego ma go Wir ostrzy. */
    damageMultiplier: 0.9,
    /**
     * ⚠ **Trzy POKRĘTŁA PROTOTYPOWE (2026-08-23), nie liczby balansowe.**
     * Weszły razem z celowaniem kierunkowym i istnieją po to, żeby human
     * playtest miał czym kręcić. Nie stroimy ich z wyliczenia.
     *
     * Twardy sufit trafionych. ⚠ Po przeniesieniu łuku do umiejętności
     * (2026-09-18) jest **jedyną rzeczą ograniczającą zbiór celów** — przy
     * pół-łuku 90° klin obejmuje całą przednią półkulę, więc bez tego sufitu
     * jeden zamach brałby wszystko, co stoi z przodu w zasięgu broni.
     */
    maxTargets: 3,
    /**
     * ⚠ **MNOŻĄ SIĘ przez `damageMultiplier`, nie zastępują go** — składa to
     * `resolveAbility`. Złożenie daje 0,9 dla celu głównego, czyli DOKŁADNIE
     * tyle, ile cleave zadawał przed prototypem, i 0,675 dla reszty.
     * Zastąpienie podniosłoby cel główny do 1,0 — czyli byłby to pass balansu
     * przemycony w iteracji o celowaniu.
     */
    primaryMultiplier: 1.0,
    secondaryMultiplier: 0.75,
    color: 0xc8d0e0,
    description:
      "Zamach na całą szerokość — trafia wszystko przed tobą. Im dłuższa broń, tym dalej sięga.",
  },
  /**
   * Ciężkie uderzenie — **wolniej, drożej, ale mocniej. I nic poza tym.**
   *
   * ⚠ **Prototyp roli, nie balansu (2026-08-23).** Wszystkie liczby niżej są
   * pierwszym przybliżeniem do strojenia ręką.
   *
   * ⚠ **Świadomie BEZ dodatkowych efektów** — bez krwawienia, ogłuszenia,
   * przebicia pancerza, egzekucji, odrzutu i przerwania. Pytanie tej iteracji
   * brzmi „czy sama wymiana *czas + koszt → obrażenia* jest warta slotu";
   * dołożenie statusu zamazałoby odpowiedź, bo nie dałoby się rozdzielić, co
   * gracz docenił. Reguła zawężania mówi zresztą, że umiejętność może
   * zdolność odebrać, nigdy dodać — przerwanie zostaje własnością obucha.
   *
   * ⚠ **To NIE jest „Szerokie cięcie z jednym celem".** Tamto jest szybkie,
   * szerokie i o grupie; to jest wąskie, powolne i o jednym przeciwniku.
   * Gdyby kiedyś dostało łuk albo drugi cel, przestaje mieć rację bytu.
   */
  heavyStrike: {
    id: "heavy_strike",
    name: "Ciężkie uderzenie",
    unlockLevel: 2,
    /** PROTOTYPOWE. Krótki-średni cooldown: ma być decyzją w walce, nie
     *  otwarciem raz na minutę. */
    cooldown: 7,
    /** PROTOTYPOWE. Wyraźnie drożej niż autoatak i drożej niż Wir ostrzy —
     *  to jest cena za obrażenia, jedyna, jaką ta umiejętność ma. */
    staminaCost: 18,
    /** PROTOTYPOWE. Wyraźnie powyżej 1, bo cała jej treść to obrażenia. */
    damageMultiplier: 2.0,
    /**
     * PROTOTYPOWE. Zamach do trafienia (ms) — **zauważalnie wolniejszy niż
     * zwykły cios**, bo commitment jest tu połową mechaniki.
     *
     * ⚠ Animacja dostaje `windupMs * 2`, żeby pełne wyprostowanie ostrza
     * (`PLAYER.swingHitFraction` = 0,5, szczyt `sin(pi*t)`) wypadło DOKŁADNIE
     * w chwili trafienia. Ta sama reguła, którą zwykły zamach ma od C-01.
     */
    windupMs: 420,
    /** PROTOTYPOWE. Bezbronność PO trafieniu — ukorzenienie trwa
     *  `windupMs + recoveryMs`. */
    recoveryMs: 260,
    /** Pół-kąt sektora akwizycji przy ręcznym wskazaniu. PROTOTYPOWE;
     *  węższy niż u Szarży, bo w zwarciu cele stoją gęściej. */
    acquisitionHalfDeg: 24,
    /**
     * Język podglądu. **Prezentacja, dlatego tutaj, a nie w `AbilitySpec`** —
     * tamten plik trzyma rozstrzygnięte dane ROZGRYWKI i ma takim zostać.
     * Sąsiaduje z `color` i `description`, czyli z resztą prezentacji.
     *
     * ⚠ **`reachAndCone` niesie znane ryzyko.** Przy Szarży pierścienie zasięgu
     * zostały po playteście ODRZUCONE dwukrotnie: „wygląda jak AoE", bo każdy
     * zakrzywiony kształt wokół postaci czyta się jako zasięg działania.
     * Tutaj wchodzi na wyraźne życzenie i przy promieniu melee (~68 px zamiast
     * 420), więc skala jest inna — ale **to jest pierwsza rzecz do oceny ręką**.
     * Zdjęcie sprowadza się do zmiany tej wartości na `pathOnly`.
     */
    aimPreview: "reachAndCone",
    color: 0xff8a5c,
    description:
      "Powolny, ciężki cios w jednego przeciwnika. Więcej obrażeń, większy wysiłek.",
  },
  /**
   * Wypad — pchnięcie z krokiem. Wzorzec wskazany przez autora (2026-08-25):
   * **Fiora Q z LoL-a**.
   *
   * ⚠ **To jest umiejętność OBRAŻENIOWA z krokiem, nie krok z obrażeniami** —
   * i ta kolejność jest całą jej tożsamością. Gdyby kiedyś straciła własny
   * mnożnik i zaczęła tylko dowozić autoatak, staje się krótką Szarżą i
   * przestaje mieć rację bytu (ta sama reguła, którą ma przy sobie Ciężkie
   * uderzenie wobec Szerokiego cięcia).
   *
   * ⚠ **Typ obrażeń DZIEDZICZY po aktywnym wariancie broni** — nie ma tu
   * `damageType` i nie wolno go dopisać. Wypad młotem jest obuchem, wypad
   * mieczem trzymanym do pchnięcia kłuje. Dokładnie ta sama zasada, przez
   * którą Wir ostrzy nie tnie młotem; wpisanie `pierce` na sztywno złamałoby
   * tożsamość rodzin broni. Wynika stąd też, że **przerwanie i zachwianie
   * przychodzą z broni za darmo** — reguła zawężania jest zachowana, bo
   * umiejętność niczego nie przyznaje sama z siebie.
   *
   * ⚠ **`hitCooldownRefund` NIE jest ozdobnikiem balansowym** — to jest
   * odpowiedź na barierkę „auto-podchodzenie do celu" z `docs/odlozone.md` §5.
   * Wypad użyty jako narzędzie do GONIENIA (chybiony albo w cel, który zdąży
   * odejść) kosztuje pełne `cooldown`; wyprowadzony celnie w zwarciu wraca po
   * niecałej połowie tego czasu. Pościg za cofającym się sieciarzem zostaje
   * rozgrywką, pojedynek dostaje narzędzie do powtarzania — i **rozdziela je
   * jedna liczba, zamiast wyboru między jednym a drugim.**
   */
  lunge: {
    id: "lunge",
    name: "Wypad",
    /** ⚠ Ten sam poziom co Unik i to jest zamierzone: obie umiejętności uczą
     *  tego samego pojęcia — że pozycja jest ruchem, nie tylko stanem. */
    unlockLevel: 3,
    /** PROTOTYPOWE. Skok plus pchnięcie — drożej niż autoatak, taniej niż
     *  Ciężkie uderzenie, bo krótszy i bez ukorzenienia. */
    staminaCost: 10,
    /**
     * PROTOTYPOWE. Baza CELOWO wysoka — patrz `hitCooldownRefund` wyżej.
     * Sama ta liczba jest tym, co trzyma Wypad po właściwej stronie barierki,
     * więc **nie obniżaj jej „żeby lepiej się grało"**: obniżenie zwrotu jest
     * inną zmianą niż obniżenie bazy, a tylko baza pilnuje pościgu.
     */
    cooldown: 14,
    /** Ułamek cooldownu ZWRACANY przy trafieniu (0,6 = zostaje 40%). Wprost
     *  z Fiory. PROTOTYPOWE. */
    hitCooldownRefund: 0.6,
    /** PROTOTYPOWE. Powyżej 1, bo to jest cios — ale wyraźnie poniżej Ciężkiego
     *  uderzenia (2,0), które płaci za swoje obrażenia czasem i bezbronnością. */
    damageMultiplier: 1.3,
    /**
     * Zasięg = zasięg BRONI × ta liczba. PROTOTYPOWE.
     *
     * ⚠ **Wyprowadzany z broni, nie stały** — i to jest różnica wobec Szarży.
     * Wypad jest ruchem szermierczym: wychodzisz na odległość, z której
     * możesz dosięgnąć. Włócznik wypada dalej niż nożownik, bo dalej sięga.
     * Szarża takiego wiązania mieć NIE MOŻE (dystans rozpędzania to własność
     * nóg, nie oręża) — dlatego ta liczba mieszka tutaj, a nie w niej.
     *
     * ⚠ **DOLNĄ granicę tej liczby wyznacza `ABILITIES.charge.minRange`, nie
     * gust.** Wypad istnieje po to, żeby wypełnić martwą strefę Szarży
     * (0–100 px od 2026-09-04, wcześniej 0–130) — więc przy NAJKRÓTSZEJ broni
     * w grze jego zasięg musi tam dosięgnąć,
     * inaczej zostaje dziura, w której nie działa ani jedno, ani drugie.
     * Zmierzone przy pierwszej wersji (`×2`): sztylet 112, pałka 120, krótki
     * miecz i toporek po 124 — **cztery bronie z dziewięciu poniżej progu.**
     * Stąd 2,4: 56 × 2,4 = 134. Pilnuje tego §S2 w `tools/combat_regresja.mjs`,
     * które przejeżdża CAŁY roster broni — nowa krótka broń zaświeci na czerwono.
     */
    rangeReachMul: 2.4,
    /** PROTOTYPOWE. Szerzej niż Ciężkie uderzenie (24°), bo sięga dalej i cele
     *  na tym dystansie stoją rzadziej. */
    acquisitionHalfDeg: 30,
    /** Szybko — to ma być mgnienie, nie bieg. Przy zasięgu ~136 px daje ~150 ms. */
    speedPxPerSec: 900,
    /** Bezpiecznik lotu; krótki, bo krótki jest sam skok. */
    maxDurationMs: 320,
    /**
     * **Wymaga WOLNEJ LINII do celu** (2026-09-04, zgłoszenie z rozgrywki:
     * „Wypad przenika przez przeszkody").
     *
     * ⚠⚠ **Przyczyna była ILOŚCIOWA, nie logiczna.** Gracz ma collider ze
     * `solids`, więc pnie i teren zatrzymują go normalnie — ale Arcade nie ma
     * kolizji ciągłej (CCD), a ten skok leci **900 px/s, czyli 15 px na krok
     * fizyki 60 Hz**. Pudełko kolizji pnia jest głębokie na **13–15 px**
     * (`TreeStampManifest`), więc ciało startuje przed pniem i ląduje za nim,
     * **nie nakładając się na niego w żadnej klatce**. Nic nie było wyłączone;
     * po prostu nie było czego wykryć.
     *
     * ⚠ Szarża (620 px/s = 10,3 px/krok) mieści się poniżej głębokości pnia
     * i dlatego objaw wyszedł najpierw tutaj.
     *
     * ⚠ **Flaga jest DANĄ, a nie `if (id === "lunge")` w scenie** — ta sama
     * reguła, przez którą `aimPreview` jest polem configu. Druga umiejętność
     * przenosząca ciało do celu włącza to jedną wartością.
     */
    requiresClearPath: true,
    /**
     * **Język „reach"** — okrąg zasięgu + kandydaci + wybrany cel, a przy braku
     * celu krótki tor skoku (2026-09-04).
     *
     * ⚠ **Bierze z języka Szarży tylko to, czego wymaga JEGO mechanika.** Nie
     * ma MIN (`minRangePx: 0` z decyzji), rozbiegu ani znaku przecięcia toru.
     * Reguła doboru i pełna tabela: `docs/systemy/abilities.md`
     *
     * ⚠ Do 2026-09-04 stało tu `pathOnly` (sam pasek do celu) — czyli Wypad nie
     * pokazywał **własnego zasięgu**, mimo że ten zależy od broni
     * (`rangeReachMul`) i zmienia się przy każdej zmianie oręża.
     *
     * ⚠ Tamten wpis miał własny powód i wart jest zapamiętania: „nie dokładamy
     * drugiego kształtu, dopóki sam pasek nie zostanie oceniony na tej skali"
     * (2026-08-25, po zgłoszeniu, że celowanie Szarży jest nieczytelne).
     * Ocena zapadła — przy 134–235 px sam pasek **nie odpowiada na pytanie
     * „czy dosięgnę", bo zasięg jest niewidoczny.** Stąd okrąg; ale nadal
     * WYŁĄCZNIE te elementy, których wymaga mechanika Wypadu.
     */
    aimPreview: "reach",
    /** Zamach pchnięcia (ms). Krótki — cała różnica wobec Ciężkiego uderzenia
     *  polega na tym, że tu nie ma commitmentu do wykorzystania przez wroga. */
    windupMs: 150,
    color: 0x7ee0c0,
    description:
      "Skok w wybraną stronę. Trafiony przeciwnik obrywa pchnięciem, a odnowienie wraca szybciej.",
  },
  /**
   * **Uderzenie tarczą — pierwsza umiejętność KONTROLI w grze.**
   * Pełny projekt, pomiary i zamknięte decyzje: `docs/systemy/abilities.md`.
   *
   * ⚠ **WALUTĄ TEJ UMIEJĘTNOŚCI JEST CZAS PRZECIWNIKA, NIE OBRAŻENIA.** To
   * jest jej cała tożsamość i jedyna rzecz, której trzeba przy niej pilnować.
   * `damageMultiplier` stoi **poniżej autoataku** świadomie: gdyby kiedykolwiek
   * przekroczył 1,0, Shield Bash staje się „Ciężkim uderzeniem z bonusem"
   * i przestaje mieć rację bytu — dokładnie ta sama bariera, którą Ciężkie
   * uderzenie ma wobec Szerokiego cięcia. Pilnuje tego §T1.
   *
   * ⚠ **WYMAGA TARCZY — i to NIE jest smaczek fabularny.** Bramka jest jedyną
   * rzeczą utrzymującą REGUŁĘ ZAWĘŻANIA („wariant/umiejętność może zdolność
   * odebrać, nigdy dodać"). Przerwanie i ogłuszenie przychodzą tu z
   * **narzędzia**, którym uderzasz — tak samo, jak przerwanie przychodzi
   * z młota, a nie z tego, że gracz nacisnął przycisk. Umiejętność sama
   * z siebie nie przyznaje niczego; bez tarczy po prostu nie istnieje.
   * Gdyby kiedyś dało się jej użyć bez tarczy, reguła jest złamana i trzeba
   * wrócić do `docs/systemy/abilities.md` R8.
   *
   * ⚠ **Typ obrażeń WPISANY NA SZTYWNO (`blunt`) — świadome odstępstwo od
   * reguły Wypadu.** Tam typ dziedziczy po wariancie broni, bo Wypad bije
   * BRONIĄ. Tu bijemy tarczą: dziedziczenie typu po mieczu znaczyłoby, że guz
   * tarczy tnie.
   *
   * ⚠ **Zero odrzutu, i to są DWA niezależne powody.** (1) Odrzut wypchnąłby
   * cel z okna, które ogłuszenie właśnie kupiło — dwie mechaniki działające
   * przeciw sobie na jednym przycisku. (2) Odrzut jest tożsamością rodziny
   * obuchowej; rozdanie go tarczy rozmywa oś, którą projekt zbudował świadomie.
   *
   * ⚠ **Brak `staggerMs` jest DECYZJĄ, nie przeoczeniem.** Zachwianie
   * i ogłuszenie liczą to samo pojęcie; nakładanie ich to dwa mechanizmy na
   * jedno zjawisko — wzorzec błędu, który ten projekt zna z pary
   * `ownsBody`/`attackerRecoil`.
   */
  shieldBash: {
    id: "shield_bash",
    name: "Uderzenie tarczą",
    /** ⚠ Ten sam próg co Unik i Wypad: wszystkie trzy uczą tego samego
     *  pojęcia — że pozycja i czas są zasobem, tak samo jak HP. */
    unlockLevel: 3,
    /**
     * ⚠ **Bramka sprzętowa. Jedyne pole tego rodzaju w całym `ABILITIES`** —
     * i ma takim zostać, dopóki nie pojawi się druga umiejętność wymagająca
     * konkretnego oręża. Czyta je `GameScene`, nie `Abilities.isReady`:
     * odmowa ma MÓWIĆ, dlaczego, a `isReady` odpowiada tylko „tak/nie"
     * i wygasiłoby przycisk bez powodu.
     */
    requiresShield: true,
    /** PROTOTYPOWE. Między Ciężkim uderzeniem (7) a Wypadem/Szarżą (14).
     *  ⚠ Zmierzone: zwykła walka trwa 0,6–3,8 s, więc realną wagę ta liczba ma
     *  dopiero przy elitach — i tam ma być DECYZJĄ, nie rytmem. */
    cooldown: 10,
    /** PROTOTYPOWE. Między Wypadem (10) a Ciężkim uderzeniem (18): pchnięcie
     *  jest tańsze niż zamach młotem, ale wartość kontroli musi mieć cenę. */
    staminaCost: 12,
    /** ⚠ **PONIŻEJ autoataku i to jest bariera, nie pokrętło** — patrz
     *  nagłówek. Powyżej 1,0 umiejętność traci rację bytu. */
    damageMultiplier: 0.5,
    /**
     * PROTOTYPOWE. Zamach do trafienia (ms) — **najszybsza zobowiązująca akcja
     * w grze** (Wypad 150, Ciężkie uderzenie 420). To jest cała różnica ról:
     * Ciężkie uderzenie kupuje obrażenia czasem, Shield Bash kupuje czas
     * szybkością.
     *
     * ⚠ Animacja dostaje `windupMs * 2` — trafienie wypada w POŁOWIE
     * (`PLAYER.swingHitFraction`), tam gdzie ramię jest wyprostowane.
     */
    windupMs: 180,
    /** PROTOTYPOWE. Root = `windupMs + recoveryMs` = 400 ms. Zmierzone
     *  telegrafy: dzik 560, niedźwiedź 620, jadowity 480, królik 380 —
     *  cztery z pięciu mieszczą ten root z zapasem. */
    recoveryMs: 220,
    /**
     * ⚠ **PROTOTYPOWE, ale NIE dowolne — patrz `docs/systemy/abilities.md`**
     *
     * 700 daje **dokładnie jeden darmowy cios każdą z dziewięciu broni**,
     * z marginesem 90 ms. Zmierzone alternatywy: 900 dawało 1 albo 2 ciosy
     * ZALEŻNIE OD BRONI, rozstrzygane marginesem **5 ms** — czyli liczbą,
     * której playtest nie odróżni od szumu (ta sama pułapka co
     * `SHIELD.blockArcDeg`). Czyste wartości do A/B: **700 i 1000**.
     *
     * Pilnuje tego §T6 w `tools/combat_regresja.mjs`: nie mówi, ile ma trwać
     * ogłuszenie — mówi, że wybrana wartość jest MIERZALNA.
     */
    stunMs: 700,
    /**
     * ⚠ **`reachPx` USUNIĘTE 2026-08-26 — zasięg płynie z BRONI
     * (`Progression.attackReach`), i to nie jest pokrętło do przywrócenia.**
     *
     * Stało tu 48 px z uzasadnieniem „tarcza jest narzędziem zwarcia, więc
     * żeby ogłuszyć, musisz podejść bliżej". Rozgrywka to obaliła: to nie było
     * koszt, tylko **martwe pasmo** 8–50 px, w którym autoatak trafia,
     * a umiejętność odmawia — **51% zasięgu przy włóczni**, 38% przy młocie,
     * czyli przy dwóch legalnych buildach z tarczą. Do tego podgląd celowania
     * mierzy bronią, więc przy przeciągnięciu palcem podświetlał cel, którego
     * commit odrzucał **bez słowa**.
     *
     * **Reguła autora, którą to koduje:** *jeśli trafiasz kogoś autoatakiem,
     * trafiasz go też umiejętnością na tym celu.* Wpisanie tu z powrotem
     * jakiejkolwiek liczby ją łamie. Pilnuje §T1 w `combat_regresja.mjs`.
     */

    /** ⚠ Zero — patrz nagłówek. Pole istnieje, żeby decyzja była WIDOCZNA
     *  w configu, a nie domyślna przez nieobecność. */
    knockbackPx: 0,
    /** Pół-kąt sektora akwizycji. Jak Wypad (30), szerzej niż Ciężkie
     *  uderzenie (24): przy 48 px cele stoją kątowo rzadziej. */
    acquisitionHalfDeg: 30,
    /** ⚠ `pathOnly`. Przy promieniu 48 px stożek byłby plamą pod kciukiem,
     *  a celowanie Szarży zostało już zgłoszone jako nieczytelne (2026-08-25). */
    aimPreview: "pathOnly",
    color: 0x9fb8ff,
    description:
      "Pchnięcie tarczą. Przerywa zamach i ogłusza na moment — obrażenia są przy tym drugorzędne.",
  },
  dodge: {
    id: "dodge",
    /** ⚠ **Unik NIE ma tu własnego `staminaCost` i to jest zamierzone.** Jego
     *  koszt jest jedyny w grze mnożony przez OBCIĄŻENIE, więc mieszka razem
     *  z resztą tej mechaniki w `STAMINA.costs.dodge` + `EQUIPMENT_LOAD`.
     *  Druga kopia liczby tutaj rozjechałaby się przy pierwszym strojeniu. */
    name: "Unik",
    unlockLevel: 3,
    /** Seconds between uses. */
    cooldown: 6,
    /** How far the roll carries you (px) and how long it takes. */
    dashPx: 140,
    durationMs: 200,
    /**
     * Invulnerability window. Slightly LONGER than the dash itself on purpose:
     * a roll that ends exactly as the boar connects would feel like a cheat,
     * and the extra ~100ms is what makes the dodge forgiving enough to aim on
     * a touchscreen. Reuses the same i-frame field as respawn grace.
     */
    invulnerableMs: 300,
    color: 0x66ddff,
    description: "Przewrót w kierunku ruchu. Przez moment jesteś nietykalny.",
  },
  /**
   * Szarża — jedyna umiejętność, która WYMAGA wybranego celu.
   *
   * ⚠ **To nie jest auto-follow, i ta różnica jest tu jedyną rzeczą wartą
   * pilnowania.** `docs/odlozone.md` parkuje podchodzenie do celu z mocnym
   * powodem: pościg za cofającym się sieciarzem (84 px/s przeciw 150 px/s
   * gracza) jest wygrywalny, wymaga decyzji i autor po playteście wskazał go
   * jako fajną zawartość — automat zamieniłby go w „system robi to za mnie".
   * Szarża tego nie kasuje, bo jest **jednorazowa, na cooldownie i trzeba ją
   * wybrać**: raz na 14 s wolno pominąć dystans, przez resztę czasu pościg
   * zostaje pościgiem. Gdyby kiedyś zeszła do cooldownu rzędu sekund albo
   * odpalała się sama po naciśnięciu ataku — staje się dokładnie tym, co jest
   * zaparkowane, i wtedy trzeba wrócić do tamtego wiersza.
   *
   * ⚠ **Nie zadaje obrażeń i nie przerywa.** Obrażenia przychodzą z broni,
   * którą niesiesz — atak na końcu to zwykły autoatak, przez tę samą ścieżkę
   * co każdy inny (`autoAttackArmed`), więc krytyki, odrzut, XP, łup i zużycie
   * broni działają bez ani jednej nowej linijki. Przerwania świadomie NIE ma:
   * `interrupts` jest własnością broni obuchowej i REGUŁA ZAWĘŻANIA mówi, że
   * wariant/umiejętność może zdolność odebrać, nigdy dodać. Szarża dająca
   * przerwanie obeszłaby ten model bokiem.
   */
  charge: {
    id: "charge",
    /** Koszt staminy. Bieg z impetem plus cios na końcu. */
    staminaCost: 12,
    name: "Szarża",
    unlockLevel: 4,
    cooldown: 14,
    /**
     * ⚠ **Pasmo, nie zwykły zasięg — dolna granica jest tak samo ważna jak
     * górna.** Szarża z odległości dwóch kroków nie ma czego pominąć, a
     * spaliłaby 14 sekund cooldownu; odmowa z komunikatem uczy, do czego ta
     * umiejętność służy.
     *
     * ⚠ **Przestrojone z runtime'u 2026-09-04: 130 → 100 i 420 → 360.**
     * Powodem był ODBIÓR na ekranie, nie liczby — po dorysowaniu obu okręgów
     * autor zobaczył, że pasmo jest wizualnie za rozległe, a martwa strefa za
     * duża. To jest dokładnie ten rodzaj danych, których symulacja nie ma.
     *
     * ⚠⚠ **Skutek uboczny do OBSERWACJI, nie do naprawy w tej rundzie:**
     * dolna granica była dobrana powyżej najdłuższej broni w grze (włócznia,
     * `ITEMS.spear.melee.reach` = 98), żeby „za blisko" nigdy nie znaczyło
     * „stoisz dokładnie w zasięgu i nadal nie wolno". Margines spadł ze
     * **32 px do 2 px**. Nie jest to złamanie reguły, bo **te dwie liczby
     * mierzą co innego**: `minRange` to dystans MIĘDZY ŚRODKAMI DUSZKÓW
     * (konwencja `directionTarget`), a `reach` to PRZEŚWIT między krawędziami
     * ciał — przy dowolnym celu o niezerowym promieniu prześwit jest zawsze
     * mniejszy niż dystans środków, więc realny zapas jest większy niż te 2 px.
     * Ale pasmo bezpieczeństwa zniknęło i **włócznik jest miejscem, gdzie to
     * wyjdzie pierwsze** — jeśli kiedykolwiek.
     *
     * ⚠ Górna granica ma jeden dodatkowy skutek: przy 360 px okrąg `maxRange`
     * **zaczyna wchodzić w kadr telefonu** w kierunkach ku rogom (najdalszy
     * widoczny punkt ≈ 391 px). Przy 420 nie wchodził nigdy.
     */
    minRange: 100,
    maxRange: 360,
    /**
     * Pół-kąt SEKTORA AKWIZYCJI dla ręcznego wskazania celu (stopnie).
     *
     * ⚠ **WARTOŚĆ PROTOTYPOWA (2026-08-23), nie balansowa.** Weszła razem
     * z celowaniem kierunkowym i jest pierwszym pokrętłem do strojenia ręką.
     *
     * ⚠ Istnieje po to, żeby **celowanie w górę nie wybierało jedynego wroga
     * stojącego z prawej**. Bez sektora „wskaż cel" degeneruje się do „weź
     * kogokolwiek", a wtedy manualny aim nie daje nic ponad tapnięcie.
     * 30° w jedną stronę = 60° sektora: wystarczająco wybaczające na kciuk,
     * wystarczająco wąskie, żeby wskazanie było decyzją.
     */
    acquisitionHalfDeg: 30,
    /**
     * **Język „pasa"** — pełny podgląd Szarży: pasmo `min`/`max`, tor ciała,
     * kandydaci, wybrany cel i przeszkoda (2026-09-04, po review UX z autorem).
     *
     * ⚠ **Wartość WŁASNA, nie współdzielona z resztą `directionTarget`** —
     * Ciężkie uderzenie i Wypad zostają na swoich językach. Rozgałęzienie idzie
     * po tej DANEJ, nigdy po `id` umiejętności (`src/core/CLAUDE.md`).
     *
     * ⚠ Poprzednie brzmienie („pierścienie były próbowane dwa razy i dwa razy
     * odrzucone") opisywało wariant, w którym okrąg był mocny i czytał się jako
     * AoE. Ten wariant jest inny: cienki, rzadko kreskowany, mocno
     * przezroczysty, a znaczenie zasięgu niosą przede wszystkim znaczniki
     * kandydatów. Decyzja autora po pełnym review, 2026-09-04.
     */
    aimPreview: "lane",
    /**
     * **Wymaga WOLNEGO TORU do celu** (2026-09-05).
     *
     * ⚠⚠ **Dla Szarży znaczy to co innego niż dla Wypadu, mimo tej samej
     * flagi.** Wypad ma drugie, pełnoprawne użycie (skok kierunkowy), więc
     * zablokowany cel po prostu schodzi do niego. **Szarża jest ATOMOWA: albo
     * ma wolny cały tor i jedzie, albo nie odbywa się wcale** — nie zna trybu
     * kierunkowego (`kind: "chase"` jest jedyną gałęzią) i nie wolno jej
     * dobiec do drzewa i uznać tego za częściowe wykonanie.
     *
     * ⚠ Do 2026-09-05 nie było tu żadnego testu toru: Szarża ruszała do celu za
     * pniem, wjeżdżała w niego (albo tunelowała — 620 px/s to 10,3 px na krok
     * fizyki), a bezpiecznik czasowy uzbrajał na końcu autoatak. Kosztowało to
     * pełne 14 s cooldownu za bieg w drzewo.
     */
    requiresClearPath: true,
    /** Stała prędkość biegu (px/s) — czas trwania wynika z dystansu, nie
     *  odwrotnie, więc szarża z 400 px trwa dłużej niż ze 150 px. */
    speedPxPerSec: 620,
    /** Bezpiecznik: dłużej niż to szarża nie biegnie, choćby cel uciekał. */
    maxDurationMs: 900,
    color: 0xffd166,
    description:
      "Skok do wybranego celu przez cały dystans — kończy się zwykłym atakiem. Wymaga celu w oddali.",
  },
  /**
   * **ROZCIĘCIE — pierwszy skill z efektem czasowym NA WROGU (2026-09-04).**
   *
   * Głębokie cięcie: obrażenia bezpośrednie **plus Krwawienie**. Mechanicznie
   * jest to pierwsze użycie warstwy efektów po stronie przeciwnika — do tej
   * daty `EffectSet` miał jednego nosiciela (`Player`).
   *
   * ── ⚠ Czym RÓŻNI SIĘ od Ciężkiego uderzenia i dlaczego to jest warunek ───
   * `ability_aiming_prototyp.md` §9.3 zapisuje o Ciężkim uderzeniu: *„wolniej,
   * drożej, mocniej — i nic poza tym. Bez krwawienia…"*. To była decyzja o
   * TAMTEJ umiejętności (pytanie brzmiało „czy sama wymiana czas+koszt →
   * obrażenia jest warta slotu"), a nie zakaz krwawienia w projekcie — pilnuje
   * jej §R5, który czyta wyłącznie `ABILITIES.heavyStrike`.
   *
   * Rozcięcie ma być inną wymianą, nie słabszą wersją tamtej:
   * ```
   * Ciężkie uderzenie   ×2,0 NATYCHMIAST, długi zamach, 18 staminy
   * Rozcięcie           ×1,1 teraz + 5 × 10% AD przez 6 s, krótszy zamach
   * ```
   * Razem ~1,6× w pięć sekund zamiast 2,0× od razu — czyli premia dla walki,
   * która TRWA, i kara za dobicie celu jednym ciosem.
   *
   * ⚠ **LICZBY BALANSOWE SĄ PLACEHOLDEREM poza tymi z briefu.** Z briefu
   * (autor, 2026-09-04) pochodzą wyłącznie: `damageMultiplier: 1.1`,
   * `bleed.fractionOfDamage: 0.10`, `bleed.durationMs: 6000`,
   * `bleed.tickMs: 1000`, `bleed.maxStacks: 1`. `unlockLevel`, `cooldown`,
   * `staminaCost`, `windupMs` i `recoveryMs` są dobrane przez analogię do
   * `heavyStrike`/`shieldBash` i czekają na playtest.
   */
  rend: {
    id: "rend",
    name: "Rozcięcie",
    /** PLACEHOLDER. Poziom 5 był jedyną wolną szczeliną między Szarżą (4)
     *  a Wirem ostrzy (6). */
    unlockLevel: 5,
    /** PLACEHOLDER. Między Szerokim cięciem (5 s) a Ciężkim uderzeniem (7 s):
     *  DoT ma zdążyć wygasnąć, zanim wolno go nałożyć ponownie. */
    cooldown: 8,
    /** PLACEHOLDER. Poniżej Ciężkiego uderzenia (18) — zamach jest krótszy,
     *  a wyjście rozłożone w czasie zamiast skupione w jednym ciosie. */
    staminaCost: 12,
    /**
     * **110% obrażeń podstawowych — Z BRIEFU, nie do strojenia bez decyzji.**
     * Przy 100 AD daje 110 obrażeń bezpośrednich.
     */
    damageMultiplier: 1.1,
    /** PLACEHOLDER. Krótszy niż Ciężkie uderzenie (420 ms) — cięcie ma być
     *  szybsze od zamachu z commitmentem. Animacja dostaje `× 2`. */
    windupMs: 240,
    /** PLACEHOLDER. Root = `windupMs + recoveryMs` = 440 ms. */
    recoveryMs: 200,
    acquisitionHalfDeg: 24,
    /** ⚠ `pathOnly`, jak Wypad i Uderzenie tarczą. `reachAndCone` niesie znane
     *  ryzyko (patrz `heavyStrike.aimPreview`) i nie ma powodu je tu brać. */
    aimPreview: "pathOnly",
    /**
     * **KRWAWIENIE — efekt czasowy nakładany na TRAFIONY cel.**
     *
     * ⚠ **Liczby z briefu autora, wszystkie pięć.** Nie stroić bez decyzji.
     *
     * ⚠ **`durationMs: 6000` + `tickMs: 1000` daje PIĘĆ tików, nie sześć —
     * i to jest ŚWIADOMIE PRZYJĘTE (decyzja autora, 2026-09-04).**
     * `EffectSet.tick` odejmuje czas PRZED tikiem, więc tik lądujący równo
     * z wygaśnięciem **nie pada** — reguła przeniesiona z dawnego
     * `updateVenom` i pilnowana asercją §3 w `tools/effects_weryfikacja.mjs`.
     * Tiki wypadają w 1000/2000/3000/4000/5000 ms, w 6000 ms efekt wygasa.
     * ⛔ **Nie „naprawiać" tego przez zmianę kolejności w `EffectSet`** —
     * zmieniłoby to zachowanie jadu skoczka i złamało udokumentowany
     * niezmiennik. Pełny cykl przy 100 AD: **110 + 5 × 10 = 160**.
     */
    bleed: {
      /** Klucz TOŻSAMOŚCI efektu — dwa Rozcięcia w ten sam cel to jeden wpis. */
      buffId: "rend_bleed",
      name: "Krwawienie",
      /**
       * Ułamek obrażeń **PRZED KRYTYKIEM** na jeden tik (decyzja autora).
       *
       * ⚠ Krytyk podnosi wyłącznie cios BEZPOŚREDNI; Krwawienie liczy się od
       * wartości sprzed mnożnika krytycznego. Buffy zmieniające obrażenia
       * ataku (Okrzyk bojowy) wchodzą do snapshotu normalnie, bo wchodzą do
       * samego rzutu.
       */
      fractionOfDamage: 0.1,
      durationMs: 6000,
      tickMs: 1000,
      /** ⚠ Jeden stos i tak ma zostać na tym etapie: ponowne Rozcięcie
       *  ODŚWIEŻA istniejące Krwawienie, nie dokłada drugiego. */
      maxStacks: 1,
    },
    color: 0xd9475c,
    description:
      "Głębokie cięcie: obrażenia teraz i Krwawienie przez kilka sekund. Ponowne użycie odnawia ranę, nie mnoży jej.",
  },
  whirlwind: {
    id: "whirlwind",
    /** Koszt staminy. Pełny obrót z bronią — najdroższy ruch w dzisiejszym zestawie. */
    staminaCost: 15,
    name: "Wir ostrzy",
    unlockLevel: 6,
    cooldown: 9,
    /** Hits everything within this radius of the player. */
    radius: 76,
    /** Per-target damage as a fraction of a normal swing — below 1 because it
     *  can hit the whole rabbit den at once. */
    damageMultiplier: 0.85,
    color: 0xffaa33,
    description: "Zamach dookoła siebie — trafia wszystkich wrogów w zasięgu.",
  },
  warcry: {
    id: "warcry",
    /** Koszt staminy. Krzyk, nie zamach; kosztuje oddech, nie mięśnie. */
    staminaCost: 12,
    name: "Okrzyk bojowy",
    unlockLevel: 10,
    cooldown: 24,
    /** Buff length (ms) and the damage bonus it grants. */
    durationMs: 10000,
    damageBonus: 0.35,
    color: 0xff5566,
    description: "Ryk, który dodaje sił. Zwiększa obrażenia na krótko.",
  },
} as const;

/**
 * The campfire next to the Hunter: where raw meat becomes cooked meat, once
 * Pieczenie mięsa is learned. Placeholder art (generated, no PNG) — same
 * "always boots" rule as the boar and wolf.
 */
/**
 * The mill's water wheel. Purely presentational today — no interaction, no
 * collision, nothing to press E for; it exists to make the mill read as a
 * working mill rather than a shed by the water.
 *
 * **It turns by a looping tween on `angle`, not by frames**, and that follows
 * from the art: `kolo_mlynskie.png` is a single drawn frame, so a four-frame
 * loop could only be produced by rotating pixel art off the 90° axis, which
 * shreds the spokes — exactly the detail the drawn art was brought in for.
 * A tween also costs no per-frame code and stops on its own whenever a panel
 * pauses the scene.
 */
export const WATERWHEEL = {
  /** Milliseconds per full revolution. A mill wheel is heavy and slow. */
  revolutionMs: 7000,
} as const;

export const CAMPFIRE = {
  name: "Ognisko",
  /** How close the player must stand to interact (px). */
  interactRange: 44,
  /**
   * Radii tried when placing it around the merchant, closest first.
   *
   * The smallest is 110px for a reason that is easy to break: it MUST exceed
   * MERCHANT.interactRange + CAMPFIRE.interactRange (48 + 44 = 92). Two circles
   * further apart than the sum of their radii cannot overlap, which guarantees
   * the player is never inside both at once — and that is what lets the
   * campfire and the shop safely share the same E / interact key without one
   * press firing both. Lower this and the interaction becomes ambiguous.
   */
  spawnSearchRadii: [110, 140, 175, 215],
  scale: 1,
  /** Raw → cooked. One press of the interact key converts a single unit. */
  recipe: { from: "rabbit_meat", to: "cooked_meat" },
  /** Skill required to use it at all. */
  requiresSkill: "cooking",
} as const;

/**
 * Farm animals — pure ambient livestock (chicken/cow/pig/sheep), all driven
 * by one shared entity (`src/entities/FarmAnimal.ts`) and one shared
 * animation builder (`Animations.ts`'s `createFarmAnimalAnimations`). No HP,
 * no combat, no interaction: they exist to make the village's buildings
 * (and pastures) look inhabited rather than staged — see the CLAUDE.md
 * checklist entries, the kurnik/obora stood empty since the buildings went
 * up. Behaviour is a tiny two-state loop, not the patrol/chase machinery
 * `Enemy` gives every huntable creature: wander to a random spot near home,
 * or stop and eat (peck / graze) — forever, with zero species-specific
 * logic. Only the numbers below differ per species; the shape is identical
 * across all four, which is why they share one config field set.
 */
export interface FarmAnimalTuning {
  /**
   * Ciało FIZYCZNE, w pikselach KLATKI (realne = `× scale`).
   *
   * ⚠ **Pole POWSTAŁO Z TEGO SAMEGO BŁĘDU co `CritterTuning.body` i jest
   * WYMAGANE z tego samego powodu.** Do 2026-08-28 `FarmAnimal` wołał
   * `setScale` i nigdy `setSize`, więc dostawał domyślne ciało Arcade — całą
   * klatkę arkusza razy skalę: **krowa 112 × 112 px** (trzy i pół kafla), byk
   * 122 × 122, świnia 86 × 86, owca 87 × 87. Wymaganie pola sprawia, że
   * kompilator pyta o pomiar każdy nowy gatunek.
   *
   * ⚠ **Dziś nic z tym ciałem nie koliduje** — zwierzęta gospodarskie nie mają
   * ani jednego collidera (`GameScene`), a Zagaje nie mają kolizji kafli.
   * To jest **domknięcie reguły „każde ciało jest zadeklarowane"**, nie
   * naprawa objawu w rozgrywce; liczby nie są strojone pod żadną walkę.
   *
   * **Jak zmierzone** (skan kanału alfa arkuszy chodu, 2026-08-28):
   * `w` = szerokość nieprzezroczystego bbox-a w rzędzie PRZODEM (rząd 0/2),
   * czyli realna głębokość tułowia — jedyny rzut, który daje szerokość, a nie
   * długość zwierzęcia. `h` = 0,55 × `w`, proporcja odczytana z gotowych ciał
   * sarny (13/24) i lisa (12/21). `feetPadding` = odległość stopy od dołu
   * KLATKI w rzędzie z profilu (rząd 1/3), bo arkusze 128 px mają kilkadziesiąt
   * pikseli pustego marginesu pod zwierzęciem — `feetPadding: 2` jak u wrogów
   * zawiesiłoby krowę pół sylwetki nad własnym cieniem.
   */
  body: MoveBodySpec;
  /** Radius (px) around its spawn point it will wander. */
  wanderRadius: number;
  /** Walking speed (px/s). */
  walkSpeed: number;
  /** How long one walk leg runs before the next decision (ms), whether or
   *  not the target was reached — keeps it from beelining in a dead-straight
   *  line for the whole leg at this speed. */
  walkMsMin: number;
  walkMsMax: number;
  /** How long an eat (peck/graze) bout lasts (ms) once chosen. */
  eatMsMin: number;
  eatMsMax: number;
  /** Chance, at each decision point, of eating in place instead of picking a
   *  new walk target. */
  eatChance: number;
  /** Rendered scale, chosen per species against its own native frame size
   *  (see `ASSETS.<species>`) so it reads as the right size livestock next
   *  to the ~60px-tall player — not derived from any formula, since "reads
   *  right" is a judgement call, not a measurement. */
  scale: number;
}

/** Small on purpose — a hen stays near its own coop, it doesn't tour the
 *  village. Pecking is brief and frequent (real chickens peck constantly). */
export const CHICKEN: FarmAnimalTuning = {
  /** Realne ciało: 20 × 0,8 = **16 × 8,8 px**. Wcześniej 25,6 × 25,6 (klatka
   *  32 px razy skala). Klatka kury jest ciasna, więc stopa siedzi tuż nad jej
   *  dolną krawędzią — stąd `feetPadding` jak u wrogów. */
  body: { w: 20, h: 11, feetPadding: 2 },
  wanderRadius: 46,
  walkSpeed: 16,
  walkMsMin: 1000,
  walkMsMax: 2400,
  eatMsMin: 900,
  eatMsMax: 2000,
  eatChance: 0.45,
  scale: 0.8,
};

/** Slow and mostly grazing — a cow spends more of its time eating than
 *  walking, and doesn't wander far from the obora it's tied to. */
export const COW: FarmAnimalTuning = {
  /** ⚠ Realne ciało: 27 × 0,88 = **23,8 × 13,2 px**. Wcześniej **112 × 112 px**
   *  — największe ciało w całej grze, szersze niż trzy kafle, bo arkusz ma
   *  klatkę 128 px z ogromnym pustym marginesem. */
  body: { w: 27, h: 15, feetPadding: 39 },
  wanderRadius: 60,
  walkSpeed: 12,
  walkMsMin: 1200,
  walkMsMax: 2800,
  eatMsMin: 1500,
  eatMsMax: 3200,
  eatChance: 0.55,
  /** 0.88, not the original 0.55 — measured, not eyeballed. The walk sheet's
   *  own opaque content is only 58px tall inside a 128px frame (lots of
   *  transparent margin), so 0.55 rendered a cow at ~32px, barely over half
   *  the ~60px player. A cow's real shoulder height is close to a person's;
   *  0.88 puts it at ~51px, still shorter than the player (correct — cows
   *  aren't taller than people) but no longer reading as a large dog. */
  scale: 0.88,
};

/** Busier and more active than the grazers — a pig roots around rather than
 *  settling to graze for long. */
export const PIG: FarmAnimalTuning = {
  /** Realne ciało: 21 × 0,67 = **14,1 × 8 px**. Wcześniej 85,8 × 85,8. */
  body: { w: 21, h: 12, feetPadding: 44 },
  wanderRadius: 50,
  walkSpeed: 18,
  walkMsMin: 900,
  walkMsMax: 2200,
  eatMsMin: 800,
  eatMsMax: 1800,
  eatChance: 0.4,
  /** 0.67, not the original 0.35 — measured. The walk sheet's opaque content
   *  is 45px tall inside a 128px frame, so 0.35 rendered a pig at ~16px,
   *  noticeably smaller than the chicken next to it despite being the
   *  bigger animal. 0.67 puts it at ~30px — about half the player's height,
   *  matching a real pig's ~0.85m shoulder height against a ~1.7m person. */
  scale: 0.67,
};

/** Grazes about as readily as a cow, but covers more ground in the open
 *  pasture and moves a bit more briskly between bites. */
export const SHEEP: FarmAnimalTuning = {
  /** Realne ciało: 27 × 0,68 = **18,4 × 10,2 px**. Wcześniej 87 × 87. */
  body: { w: 27, h: 15, feetPadding: 45 },
  wanderRadius: 70,
  walkSpeed: 20,
  walkMsMin: 1100,
  walkMsMax: 2600,
  eatMsMin: 1400,
  eatMsMax: 3000,
  eatChance: 0.55,
  /** 0.68, not the original 0.38 — measured. Opaque content is 41px tall in
   *  a 128px frame, so 0.38 rendered a sheep at ~16px. 0.68 puts it at
   *  ~28px, in line with a real sheep's ~0.8m shoulder height against the
   *  player's ~1.7m — still the smallest of the pasture animals, per RAM's
   *  own comment ("slightly bigger" than this). */
  scale: 0.68,
};

/**
 * A village stray, not a farm animal — but it shares `FarmAnimal`'s exact
 * two-state shape (wander, or pause) closely enough that it rides the same
 * tuning interface. "Eat" here has no art behind it at all (see
 * `ASSETS.cat` — the source pack only exported a walk cycle, no second
 * texture), so `eatMsMin/Max`/`eatChance` govern how often and how long a
 * cat just STOPS and holds still rather than playing a second animation
 * (see `FarmAnimal.decide()`). Quicker and more willing to cover ground
 * than the grazers — a cat explores rather than staying tied to one patch.
 */
export const CAT: FarmAnimalTuning = {
  /** Realne ciało: 13 × 0,75 = **9,8 × 5,3 px**, najmniejsze w grze — kot
   *  z profilu ma 24 px, ale przodem tylko 13. Wcześniej 24 × 36. */
  body: { w: 13, h: 7, feetPadding: 5 },
  wanderRadius: 90,
  walkSpeed: 22,
  walkMsMin: 900,
  walkMsMax: 2200,
  eatMsMin: 1000,
  eatMsMax: 2200,
  eatChance: 0.3,
  scale: 0.75,
};

/**
 * ⭐ **PSY (2026-10-11).** Model 3D z wilka (`tools/farm3d.py`: `pies`,
 * `owczarek`), awaryjny arkusz 2D — chód z `wolf.png` (`ASSETS.dog`).
 * Ciało jak wilk ×0,8 klatki (pies ~0,55 m w kłębie wobec 0,80 m wilka).
 *
 * **Kira / Kirka** (szczupła czarna podpalana kundelka Anny — `docs/swiat.md`) chodzi szeroko — w kanonie „zawsze się
 * znajduje, wieczorem, brudna" (`ANNA` temat `kirci`), więc NIE siedzi
 * przy stołku pani. **Owczarki Gniewka** trzymają się stada: mały promień,
 * dużo postoju (węszenie / leżenie przy owcach).
 */
export const DOG: FarmAnimalTuning = {
  body: { w: 14, h: 8, feetPadding: 3 },
  wanderRadius: 160,
  walkSpeed: 34,
  walkMsMin: 1200,
  walkMsMax: 3200,
  eatMsMin: 1200,
  eatMsMax: 3000,
  eatChance: 0.35,
  scale: 0.9,
};
/**
 * ⭐ **Kirka zwabiona mięsem** (`QUESTS.szukaj_kirki`, `OI-174`, 2026-10-12).
 * Pies „z imieniem": obiekt `kirci` w Tiled nie jest zwykłym psem z puli
 * `farmAnimalSpawns`, tylko Kirką, której NIE MA na mapie, dopóki gracz jej
 * nie zwabi (Anna już w powitaniu jej szuka). Scena: `scenes/QuestSpots.ts`.
 */
export const KIRKA = {
  questId: "szukaj_kirki",
  spot: "kirka",
  /** Nazwa obiektu psa w Tiled (`TiledMap.namedAnimals`). */
  objectName: "kirci",
  /** Skąd wbiega: tyle px ZA górną krawędzią świata — kamera tego nie pokaże. */
  zaKrawedziaPx: 60,
  /** Bieg do gracza i z powrotem (px/s) — szybciej niż marsz gracza, to pies. */
  biegPxS: 150,
  /** Gdzie staje i je: tyle px na LEWO od gracza — przy nodze, nie za nim
   *  (stając nad graczem, chowała się za jego modelem — zrzut 2026-10-12). */
  bokPx: 30,
  /** Ile je, zanim pogna do domu (ms). */
  jedzenieMs: 1600,
} as const;

/** Cel `reach`: promień postoju wokół punktu `miejsce` (px) i rytm sprawdzania. */
export const QUEST_SPOTS = {
  promienPx: 110,
  sprawdzCoMs: 200,
} as const;

export const SHEEPDOG: FarmAnimalTuning = {
  ...DOG,
  wanderRadius: 80,
  walkSpeed: 30,
  eatChance: 0.5,
};

/** The obora's bull — same herd, same pasture as `COW`, just bigger and a
 *  touch slower/more territorial (a bull doesn't drift as readily as the
 *  cows around it). See `ASSETS.bull` for why this is ONE texture with two
 *  row-blocks rather than a walk/eat pair like the other four species. */
export const BULL: FarmAnimalTuning = {
  /** ⚠ Realne ciało: 27 × 0,95 = **25,7 × 14,3 px** — najszersze ze zwierząt
   *  gospodarskich i szersze od gracza (18 px), co jest zgodne z obrazkiem.
   *  Wcześniej 121,6 × 121,6. Arkusz byka dzieli proporcje z krowim, stąd ten
   *  sam bbox przodem i to samo `feetPadding`. */
  body: { w: 27, h: 15, feetPadding: 39 },
  wanderRadius: 50,
  walkSpeed: 10,
  walkMsMin: 1300,
  walkMsMax: 3000,
  eatMsMin: 1600,
  eatMsMax: 3400,
  eatChance: 0.5,
  /** 0.95, not the original 0.62 — measured. Opaque content is 58px tall in
   *  a 128px frame (same as COW's, the sheets share proportions), so 0.62
   *  rendered a bull at ~36px. 0.95 puts it at ~55px, biggest of the herd as
   *  the comment above already says, just under the player's ~60px. */
  scale: 0.95,
};

/** The flock's ram — same pasture as `SHEEP`, slightly bigger and a touch
 *  bolder (marginally faster, wanders a little wider) but otherwise the
 *  same grazer rhythm. Two separate textures (`ram_walk.png`/`ram_eat.png`)
 *  — same shape as `SHEEP`, not `BULL`. */
export const RAM: FarmAnimalTuning = {
  /** Realne ciało: 27 × 0,73 = **19,7 × 10,9 px**. Wcześniej 93,4 × 93,4.
   *  Arkusz barana dzieli proporcje z owczym — ten sam bbox, inna skala. */
  body: { w: 27, h: 15, feetPadding: 45 },
  wanderRadius: 75,
  walkSpeed: 21,
  walkMsMin: 1100,
  walkMsMax: 2600,
  eatMsMin: 1400,
  eatMsMax: 3000,
  eatChance: 0.5,
  /** 0.73, not the original 0.42 — measured. Opaque content is 41px tall in
   *  a 128px frame (same as SHEEP's), so 0.42 rendered a ram at ~17px. 0.73
   *  puts it at ~30px, a touch taller than SHEEP's ~28px per the comment
   *  above ("slightly bigger... but otherwise the same grazer rhythm"). */
  scale: 0.73,
};

/**
 * Forest birds — the smallest ambient decoration in the game, and a
 * genuinely different shape from `FarmAnimal`: `birds.png` is 4 DISTINCT
 * still sprites (not a walk cycle — see `ASSETS.birds`), so there is no
 * facing, no walk/eat state, nothing to animate at all. A bird just perches
 * at its spawn point and periodically hops to a nearby one via a short
 * position tween, self-scheduling through `scene.time`/`scene.tweens`
 * rather than needing a per-frame `update()` call — see `src/entities/
 * Bird.ts`, which is why it isn't `FarmAnimal` with a species added.
 */
export const BIRD = {
  /** Radius (px) around its spawn point it may hop to. */
  wanderRadius: 40,
  /** How long the game waits between hops (ms). */
  hopMsMin: 1500,
  hopMsMax: 4000,
  /** How long one hop's tween takes (ms) — short, so it reads as a flit
   *  rather than a walk. */
  hopDurationMs: 260,
  scale: 0.85,
} as const;

/**
 * Gathering — shared tuning. Per-species numbers live in `HERBS` below.
 */
export const GATHER = {
  /** How close the player has to stand. Smaller than an NPC's 48: a plant is a
   *  thing you bend down to, not a person you walk up to. */
  interactRange: 38,
  /**
   * **How many of a map's stanowiska stand grown at once.** THE anti-route
   * number, and the reason a node is picked from a pool instead of every node
   * simply regrowing in place.
   *
   * At 1.0 every stanowisko always has its plant, so after three sessions the
   * player stops looking and starts running a memorised lap — and every "szukaj
   * na słonecznych łąkach" Dorota says becomes redundant, because you know the
   * exact bush. Under ~0.5 the pool is big enough that WHICH nodes are up
   * changes between visits, so the *habitat* stays the useful knowledge and the
   * *individual plant* never becomes a substitute for it.
   *
   * 0.3 means "put down 3–4× as many stanowiska as you want plants". Density is
   * therefore controlled purely by how many points the map author places, which
   * is the right lever: the author guarantees the habitat, the game decides
   * which of the guaranteed spots are grown today.
   */
  activeRatio: 0.3,
  /** How often a species' spawner considers growing one more (ms). Nowhere near
   *  a per-frame cost: this is one timer per species per map, not one per node. */
  tickMs: 3000,
  /**
   * ── Proximity highlight (2026-08-30) ──────────────────────────────────────
   * The PNG itself stays a plain, natural-looking plant at all times — this is
   * a runtime-only effect (`Gatherable.setNearPlayer`, driven by
   * `GameScene.updateHerbGlow`), never baked into the sprite. Two tiers:
   *  1. Normal distance: no effect. The sprite reads as flora purely through
   *     its own silhouette/colour (a flower spike vs. a tuft of grass).
   *  2. Within `nearPlayerRadius`: a soft, SLOWLY PULSING outer glow — "this
   *     is a resource", not "look here now". Deliberately NOT the combat
   *     targeting colour (`COMBAT_FEEDBACK.targetMarker.primaryColor`,
   *     0xffd166) or a saturated quest-giver yellow — a muted yellow-green
   *     reads as "part of the plant", not as a UI marker glued on top.
   *  3. Inside `interactRange` (tighter, see above): the existing ContextAction
   *     prompt already fires — nothing new needed here.
   *
   * ⚠ Uses Phaser's WebGL-only FX pipeline (`GameObject.postFX`). Guarded by
   * a renderer-type check in `Gatherable.setNearPlayer` so a Canvas fallback
   * (should never happen with `Phaser.AUTO` on any target this ships to, but
   * cheap to guard) just skips the glow instead of throwing.
   */
  nearPlayerRadius: 90,
  nearGlow: {
    color: 0xc9d97a,
    /** Pulse bounds for the glow's `outerStrength` — subtle, not a beacon. */
    outerStrengthMin: 0.6,
    outerStrengthMax: 1.6,
    innerStrength: 0,
    pulseMs: 1400,
  },
} as const;

/**
 * ── STANOWISKA ZIÓŁ ────────────────────────────────────────────────────────
 *
 * One block per species. The item id and the species id are deliberately the
 * same string, so a Tiled object named `rumianek` needs no translation table.
 *
 * **`siedlisko` is documentation for whoever places the points, and it is the
 * load-bearing field even though no code reads it.** The whole "gra bawi, gra
 * uczy" idea rests on the map matching reality: Dorota tells you pokrzywa
 * grows by fences and middens, and if someone scatters pokrzywa through deep
 * forest because it looked empty there, she is now lying to the player and the
 * feature is worse than not having it. Place points against this line, not
 * against where the map has room.
 *
 * `respawnSec` characterises as well as balances — a weed comes back faster
 * than the one prize plant on the far side of the map.
 */
export const HERBS = {
  babka: {
    name: "Babka lancetowata",
    siedlisko: "pobocza dróg, wydeptane miejsca, murawy — także w samej wsi",
    respawnSec: 90,
    respawnJitter: 30,
  },
  krwawnik: {
    name: "Krwawnik pospolity",
    siedlisko: "suche łąki, miedze, przydroża, słoneczne polany",
    respawnSec: 100,
    respawnJitter: 30,
  },
  pokrzywa: {
    name: "Pokrzywa zwyczajna",
    siedlisko: "żyzna, azotowa ziemia: płoty, obejścia, gnojowniki, skraj lasu",
    /** Chwast — wraca najszybciej z całej jedenastki, i to jest o niej informacja. */
    respawnSec: 60,
    respawnJitter: 20,
  },
  rumianek: {
    name: "Rumianek pospolity",
    siedlisko: "ugory, miedze, skraje pól, ubita ziemia w pełnym słońcu",
    respawnSec: 95,
    respawnJitter: 30,
  },
  dziurawiec: {
    name: "Dziurawiec zwyczajny",
    siedlisko: "słoneczne polany i skraje lasu, suche zbocza — nigdy w gęstwinie",
    /** Najwolniejszy z pierwotnej piątki: to jedyne zioło, po które trzeba
     *  wejść między dziki i pająki, więc znalezienie go ma być zdarzeniem. */
    respawnSec: 150,
    respawnJitter: 45,
  },
  /**
   * ── Sześć gatunków dodanych 2026-08-30, zamknięcie rosteru na 11 ─────────
   * Siedliska niżej są opisane precyzyjnie na potrzeby PRZYSZŁEGO systemu:
   * generowania flory i zadań typu „znajdź zioło z wilgotnego, cienistego
   * miejsca" — który ma wymagać pójścia we właściwy rejon mapy, a nie
   * przeszukania losowych spawnów. Nie zmieniaj tych opisów bez dobrego
   * powodu — od nich zależy, gdzie WOLNO postawić stanowisko.
   */
  lebiodka: {
    name: "Lebiodka pospolita",
    siedlisko: "suche, ciepłe murawy, słoneczne polany, skraje lasów, suche zbocza",
    respawnSec: 105,
    respawnJitter: 30,
  },
  wrotycz: {
    name: "Wrotycz pospolity",
    siedlisko: "przydroża, miedze, ugory, nieużytki, skraje pól — słoneczne, często naruszane tereny",
    respawnSec: 85,
    respawnJitter: 25,
  },
  /** Mięta polna — gatunek wybrany celowo pod wilgotne stanowiska (nie mięta
   *  pieprzowa, uprawna). */
  mieta: {
    name: "Mięta polna",
    siedlisko: "wilgotne łąki, brzegi cieków, wilgotne rowy, okolice wody",
    respawnSec: 95,
    respawnJitter: 30,
  },
  nawloc: {
    name: "Nawłoć pospolita",
    siedlisko: "polany, skraje lasów, widne zarośla, łąki i nieużytki — miejsca umiarkowanie suche lub świeże",
    respawnSec: 90,
    respawnJitter: 30,
  },
  dziewanna: {
    name: "Dziewanna",
    /** Ubogie, przepuszczalne, suche stanowiska — zdecydowanie NIE mokradła. */
    siedlisko: "suche, mocno nasłonecznione miejsca, ugory, nieużytki, pobocza, suche zbocza",
    respawnSec: 130,
    respawnJitter: 40,
  },
  zywokost: {
    name: "Żywokost lekarski",
    siedlisko: "wilgotne, żyzne miejsca, brzegi cieków, wilgotne łąki, rowy, wilgotne skraje zarośli i lasów",
    respawnSec: 100,
    respawnJitter: 30,
  },
} as const;

/**
 * Creature names for player-facing text (quest objectives, and whatever needs
 * one next). Deliberately NOT the enemy configs' `displayName`, which only the
 * elites carry because that field drives the *nameplate* on the HP bar — giving
 * every creature one would put a name over every rabbit on the map.
 */
export const ENEMY_NAMES = {
  rabbit: "Zając",
  boar: "Dzik",
  bear: "Niedźwiedź",
  fox: "Lis",
  deer: "Jeleń",
  wolf: "Wilk",
  greywolf: GREY_WOLF.displayName,
  spider: "Pająk sieciarz",
  venomspider: "Skoczek jadowity",
  // ⚠ `displayName` (napis nad paskiem HP) ma wyłącznie herszt — elita, jak Szary.
  bandit_club: "Zbój z pałką",
  bandit_axe: "Zbój z toporem",
  bandit_chief: BANDIT_CHIEF.displayName,
  // Never actually read — no `kill` objective will ever target a training
  // dummy — but `EnemyType` is a closed union and this table must stay
  // exhaustive, so it gets a real value instead of an `as any` escape hatch.
  training_dummy: "Manekin treningowy",
} as const;

/**
 * Quest catalogue. `giver` is the NPC that both offers and accepts the quest.
 *
 * Each quest carries an **array of objectives**, each with a `kind`:
 * `collect` (N of an item), `kill` (N of a creature), `talk` (to an NPC) and
 * `equip` (wear an item). How each is tracked — read live vs. recorded as it
 * happens — is documented on `Objective` in `src/core/Quests.ts`; the short
 * version is that `collect`/`equip` are derived from the bag and the worn
 * slots, while `kill`/`talk` are counted only while the quest is active.
 *
 * Two optional prerequisites gate a quest into invisibility until met:
 * `requires` (a learned skill) and `requiresQuest` (an earlier quest, finished).
 * Hidden rather than greyed out, so a chain is never a spoiler.
 */
export const QUESTS = {
  /**
   * The tutorial, and the first thing anyone is asked to do. It teaches the
   * backpack in the one moment the backpack is the CONTENT rather than an
   * errand — see `docs/swiat.md` §5.4.
   *
   * **The giver hands the stick over himself** (`grant`), rather than it being
   * in the bag from the title screen. That was the first version and it had a
   * dead end in it: sell the stick before equipping it and the first quest in
   * the game becomes impossible, with no way to get another (nobody stocks it).
   * A granted item can be replenished by walking back to the giver — see
   * `Quests.replenishGrants` — so the quest can never strand anyone.
   *
   * **That giver is the Ojciec, not the Hunter.** It used to be the Hunter,
   * and the swap is worth more than it looks:
   * - It puts the first quest in the game at HOME, which is where
   *   `docs/swiat.md` §5's prologue actually starts — you wake in the village,
   *   you leave, and the last thing that happens before you leave is your
   *   father stopping you at the gate. A stick handed over in the forest by a
   *   man you have already walked past every enemy to reach is a formality;
   *   handed over on the way out it is the scene itself.
   * - It gives the Ojciec a mechanic. He was pure presence (empty
   *   `stock`/`quests`) while carrying half of §2's household conflict.
   * - It opens the `mysliwy_ojciec` → `ojciec_wojsko` chain by forcing the
   *   player to talk to him BEFORE the Hunter — see the "DRUGI ŁAŃCUCH"
   *   comment at `MERCHANT.topics`.
   *
   * **Consequence, and it is load-bearing: a fresh run must start in the
   * village**, not the forest (`GameScene.init`'s fallback `mapId`). The Hunter
   * has nothing to give until this is done (`rabbit_hunt` is gated behind it),
   * so a forest start would drop the player next to a man with no work and no
   * hint that the first quest is a map transition away.
   *
   * Bare fists are 8 dps against the stick's 15, so the upgrade is felt in the
   * first minute rather than read in a tooltip.
   */
  /**
   * **Przepisane na `stages` 2026-08-20** (`QUEST_01_WSTEP_DO_MYSLIWEGO.md` —
   * zewnętrzna analiza, dwukrotnie zaadaptowana do stanu kodu: najpierw jako
   * płaski drugi `objectives`, potem — po diagnostyce cyklu życia questa i
   * decyzji, żeby dorobić prawdziwe etapy zamiast dalej obchodzić brak
   * kolejności — jako referencyjne pierwsze użycie `QuestStage`). Oryginalny
   * dokument proponował rozbicie tego zadania na pół tuzina etapów przez
   * Marka/Alinę/Patryczka/Dorotę na wzór jednej, skryptowanej sceny. Trzy
   * rzeczy w nim kolidowały z tym, co już istniało, i zostały rozstrzygnięte
   * inaczej, niż dokument proponował:
   *
   * 1. **Zwięzłość tego zadania jest świadoma** (`docs/swiat.md` §4) — kij od
   *    razu w plecaku kiedyś się zepsuł (dało się go sprzedać przed
   *    założeniem i zasoftlockować `rabbit_hunt`), a nagroda jest CELOWO bez
   *    złota, żeby nie zamieniać ostatniej sceny w domu w transakcję (patrz
   *    komentarz przy `reward` niżej). Ten quest ma więc DWA etapy, nie sześć
   *    — jedzenie od Aliny zostaje osobnym, w pełni opcjonalnym drobnym
   *    zadaniem POZA tym łańcuchem (`prowiant_od_matki`), bo nie jest częścią
   *    drogi do Wszebora.
   * 2. **Patryczek już ma scenę „złamana ręka" i „uczę słowem, nie pokazem"**
   *    (`PATRYCZEK.topics.reka`, `PATRYCZEK.greetings.moreToTeach`) —
   *    dokument proponował je jako NOWE, ale to duplikat. Tematy dodane przy
   *    `PATRYCZEK.topics` (dystans/obrażenia/ucieczka) się do nich odwołują.
   * 3. **Patryczek jest już formalnym trenerem 5 umiejętności** (`SKILLS`,
   *    zbudowanych na `WeaponFamily`/`AttackVariant`/`DamageType`) — nowy
   *    temat `nauka_teraz` WPROST zapowiada, że rozmowa tutaj jest
   *    nieformalną zapowiedzią, a prawdziwy trening przyjdzie później.
   *
   * ⚠ **Ukryty efekt uboczny do zachowania**: rozmowa z Ojcem otwiera osobny
   * łańcuch `mysliwy_ojciec → ojciec_wojsko → wojna/alina` — nic tu tego nie
   * rusza, ale każda kolejna przebudowa tego zadania musi to pamiętać.
   *
   * ⚠ **Owijki Patryczka (`worn_wraps`) wracają tu, do drugiego etapu,
   * zamiast siedzieć w `ziola_dla_babki.grant` jak w pierwszej wersji tego
   * questa.** Ten pierwotny kompromis istniał wyłącznie dlatego, że silnik
   * NIE MIAŁ mid-quest grantów ani sposobu, żeby dwa różne zadania jednego
   * NPC nie dzieliły tekstu powitania — teraz ma oba (`QuestStage.onComplete`,
   * `Quests.QuestGreetings`), więc kompromis znika, a fikcja wraca do
   * pierwotnego zamysłu: owijki są prezentem PRZY spotkaniu, nie nagrodą za
   * przyjęcie osobnego zlecenia.
   */
  stick_in_hand: {
    id: "stick_in_hand",
    name: "Kij w garści",
    giver: "father",
    description:
      "Idziesz za wieś, to nie idź z gołymi rękami. Osiosałem go wczoraj przy oborze — broń to żadna, ale zająca odgonisz, a jak, nie daj Boże, wyjdzie na ciebie coś większego, to przynajmniej będziesz miał co trzymać. Weź do ręki, nie noś w torbie. W torbie jeszcze nikomu nic nie pomogło. I nie łaź tam sam — zabierz Patryczka. Niejednemu już podobno guza nabił, więc będzie wiedział, kiedy trzeba przyłożyć, a kiedy brać nogi za pas.",
    /** Handed over the moment the quest is accepted. Podła — a branch cut and
     *  sharpened the night before, not a shop weapon (see the note on
     *  Quests.grantsOf for why this is scoped to the grant, not the item). */
    grant: [{ itemId: "stick", count: 1, quality: 1 }],
    stages: [
      { id: "equip_stick", objectives: [{ kind: "equip", itemId: "stick" }] },
      /**
       * Kredytowana samym otwarciem rozmowy z Patryczkiem (`Quests.
       * recordTalk`, wołane z każdego otwarcia okna NPC), więc nie wymaga
       * zadawania konkretnych tematów — gracz, który zajrzy i od razu wyjdzie,
       * i tak domyka ten etap. `onComplete.grant` wręcza owijki W TEJ SAMEJ
       * rozmowie, w której cel się domyka — `Quests.recordTalk` uruchamia
       * przemiatanie etapów PRZED wybraniem tekstu powitania Patryczka, więc
       * jego `greetings.firstJob` (patrz PATRYCZEK niżej) może już zakładać,
       * że gracz je dostał.
       */
      {
        id: "visit_patryczek",
        objectives: [{ kind: "talk", npc: "patryczek", topic: "reka" }],
        onComplete: { grant: [{ itemId: "worn_wraps", count: 1, quality: 1 }] },
      },
    ],
    /**
     * **XP only — no gold, and the omission is the point.** Every other quest
     * in the game pays a wage because it is work done for someone: the Hunter's
     * cull is a paid office, the Sołtys's round is village business. This one is
     * a father handing his son a stick on the way out of the yard, and putting
     * ten gold on the other side of it would turn the last thing that happens at
     * home into a transaction.
     *
     * `rewardText` in `Quests.ts` assembles the line from whichever parts exist,
     * precisely so a reward can leave one out — don't reintroduce `gold: 0`.
     */
    greetings: { done: "No. Trzymasz go jak należy. Tylko pamiętaj, synu — kijem się odpędza, nie wojuje." },
    reward: { xp: 15 },
  },
  /**
   * Alina/Mama — całkowicie POZA strukturą `stick_in_hand` (`QUEST_01_WSTEP_
   * DO_MYSLIWEGO.md` §7/§21: opcjonalny etap, który dokument sam zaleca
   * zbudować bez nowej architektury „opcjonalnych celów"). Zero objectives —
   * `Quests.isObjectiveMet` jest pusto-prawdziwe, więc od razu po przyjęciu
   * da się oddać w tej samej rozmowie. Nigdy nie blokuje `stick_in_hand` ani
   * `rabbit_hunt` — nie jest ich wymaganiem, nie jest przez nie wymagana.
   */
  prowiant_od_matki: {
    id: "prowiant_od_matki",
    name: "Prowiant na drogę",
    giver: "mother",
    description:
      "Sam by cię ojciec wypuścił z kijem i pustym żołądkiem. Weź chleba na drogę — i nie zjedz wszystkiego, zanim wyjdziesz za opłotki.",
    grant: [{ itemId: "bread", count: 2 }],
    objectives: [],
    greetings: { done: "No, idź już. I wracaj przed zmrokiem, dzieciaku." },
    reward: { xp: 5 },
  },
  rabbit_hunt: {
    id: "rabbit_hunt",
    /**
     * ⚠ **Nazwa zmieniona 2026-08-22, `id` bez zmian.** „Plaga królików"
     * zdradzała za wcześnie, że problem jest liczebny — gracz miał wtedy
     * gotową odpowiedź, zanim Wszebor zdążył ją wypowiedzieć przy oddaniu
     * (patrz `greetings.turnIn` niżej). „Pierwszy odstrzał" nic nie zdradza
     * i buduje parę z `mysliwy_z_zagajow` — kariera zaczyna się „pierwszym",
     * kończy „myśliwym". `name` nie jest częścią klucza zapisu
     * (`Save.ts` trzyma questy po `id`), więc zmiana jest w pełni bezpieczna.
     */
    name: "Pierwszy odstrzał",
    giver: "hunter",
    requiresQuest: "stick_in_hand",
    description:
      "Zające wchodzą w zboże i wychodzą z niego tłuste. Póki nie mogę chodzić po lesie, robisz to za mnie — inaczej do żniw nie zostanie nic prócz łodyg. Przynieś mi 5 kawałków mięsa, dostaniesz dniówkę i porządny kij w dodatku — lepszy niż ta gałąź, którą ci ojciec ostrugał.",
    objectives: [{ kind: "collect", itemId: "rabbit_meat", count: 5 }],
    /**
     * ⚠ **Beat dopisany 2026-08-22 — pierwsze miejsce, w którym gracz
     * dowiaduje się, że nieobecność Wszebora ma konsekwencję, nie tylko
     * przynosi zlecenie.** Nadpisuje `MERCHANT.greetings.turnIn` WYŁĄCZNIE
     * dla tego questa (`questGreetingsOf` w `NpcDialog.pickGreeting` sprawdza
     * nadpisanie questa przed wspólnym kubłem NPC) — więc generyczne
     * powitanie Wszebora przy KOLEJNYCH jego zadaniach zostaje nietknięte,
     * bez kosztu powtórki, który wcześniej wydawał się nieunikniony.
     */
    /**
     * ⚠ **`turnIn` musi kierować dalej, nie tylko podsumowywać — poprawione
     * po tym, jak statyczny odczyt (nie live playtest, bo pane nie renderuje
     * w tym środowisku) złapał bloker: pierwsza wersja nigdzie nie mówiła
     * dokąd iść, a `know_the_village` nie ma żadnego innego mostu z tej
     * strony.**
     */
    greetings: {
      done: "Dniówka i kij. A do Dobiesława idź jeszcze dziś, chłopcze — nie odkładaj tego.",
      turnIn:
        "Pięć w tak krótki czas — niedobrze. Gdybym ja jeszcze chodził po lesie, jednego byś ledwie upolował. Bierz kij, zarobiłeś. I pomyśl, czemu ich tyle — a jak pomyślisz, idź do Dobiesława. Powinien wiedzieć, że teraz trochę za mnie chodzisz.",
    },
    /**
     * **First real use of the 5-7 reserve** (`docs/jakosc_wykonania.md` §4.1/
     * §6: those levels are "wyłącznie z zadań" by design — never sold, never
     * dropped). Wysoka rather than the top of the range on purpose: this is
     * only the second quest in the game, and "a proper stick, better than
     * that branch" should read as a modest first step up, not the ceiling.
     * Same item id as the starting grant — the upgrade is legible precisely
     * BECAUSE it's the same weapon, just better made this time.
     */
    reward: { gold: 50, xp: 30, item: { itemId: "stick", quality: 5 } },
  },
  scraps_bounty: {
    id: "scraps_bounty",
    name: "Skóra warta zachodu",
    giver: "hunter",
    /** Only offered once the player has learned this skill (see Quests.isUnlocked). */
    requires: "skinning",
    description:
      "Skoro umiesz już skórować, nie marnuj tego, co zostaje. Zbierz 8 strzępów — wyprawię z nich coś, za co ktoś w mieście zapłaci.",
    objectives: [{ kind: "collect", itemId: "leather_scraps", count: 8 }],
    greetings: { done: "Osiem, dobre. Wyprawię je przez zimę — a ty nie wyrzucaj więcej tego, co zostaje po nożu." },
    reward: { gold: 40, xp: 60 },
  },
  /**
   * The map's story payoff, and the reason `GameScene` refuses to spawn a
   * greywolf once `Quests.killCount("greywolf") > 0`: the Szary is a one-off,
   * and until this existed nothing recorded that you had beaten him.
   *
   * ⚠ **KIEŁ JEST TERAZ CELEM ZADANIA — to jest ODWRÓCENIE wcześniejszej
   * decyzji i warto wiedzieć, dlaczego.** Stało tu, że `grey_fang` celowo NIE
   * jest celem, bo skonsumowanie go przy oddaniu odebrałoby pamiątkę po walce
   * jako cenę za przyznanie, że się ją stoczyło. Argument był dobry przy
   * założeniu, że w zamian dostaje się złoto — pamiątkę wymieniałoby się wtedy
   * na monety, czyli na nic. Tu **pamiątka nie znika, tylko zmienia postać**:
   * kieł wchodzi, naszyjnik wychodzi, i to naszyjnik jest tym, co się nosi i
   * co widać. `docs/swiat.md` §2 („naturalny przedmiot do oddania, kiedy
   * zadanie o zemście wreszcie powstanie") opisywał dokładnie ten ruch.
   *
   * ⚠ **Złota tu nie ma i to nie jest przeoczenie.** Myśliwy jest jednoręki,
   * mieszka sam pod lasem i żyje ze skór — nie ma z czego zapłacić za coś
   * takiego, a gdyby zapłacił, byłaby to transakcja zamiast rewanżu. Płaci
   * wieś, u Sołtysa, osobnym zadaniem (`mysliwy_z_zagajow`). To także pierwsza
   * krawędź między kręgosłupem leśnym (ojciec → Myśliwy) a wiejskim (Sołtys →
   * Kowal → Sobek), które do tej pory nie stykały się nigdzie.
   *
   * ⚠ **Dwa cele, dwa różne sposoby liczenia, i to jest tu istotne**: `kill`
   * jest ZATRZASKIWANY (nic w świecie nie pamięta zamachu, więc liczy się
   * tylko przy aktywnym zadaniu), a `collect` czytany NA ŻYWO z plecaka.
   * Sprzedanie kła cofa więc drugi cel — dlatego `Quests.reservedCount`
   * odmawia jego sprzedaży, póki zadanie trwa. Bez tego byłby to jedyny ślepy
   * zaułek w grze, którego nie da się naprawić: Szary się nie odradza.
   */
  grey_wolf_revenge: {
    id: "grey_wolf_revenge",
    name: "Szary",
    giver: "hunter",
    /** ⚠ ZMIANA 2026-08-22: `rabbit_hunt` → `wolf_pack_cull`. Szary jest
     *  teraz kulminacją narastającego problemu (zające → obchód → wataha →
     *  Szary), nie równoległą opcją wiszącą na tym samym węźle co reszta.
     *  Bezpieczne dla aktywnych zapisów z tego samego powodu co wyżej. */
    requiresQuest: "wolf_pack_cull",
    description:
      "Ten, co mi rozerwał ramię, wciąż chodzi po zachodnim skraju. Nie proszę cię o to jako myśliwy — proszę jako ktoś, kto go nie dogoni. A jak go położysz, przynieś mi kieł. Nie na sprzedaż. Mam na to swój sposób i jedną rękę mi wystarczy. Tylko wróć, słyszysz?",
    objectives: [
      { kind: "kill", enemy: "greywolf", count: 1 },
      { kind: "collect", itemId: "grey_fang", count: 1 },
    ],
    /**
     * ⚠ **Przejście do `mysliwy_z_zagajow`, dopisane 2026-08-22.** Wszebor
     * przekazuje sprawę Sołtysowi — nie sam nazywa gracza myśliwym, bo to
     * prawo należy do urzędu (`swiat.md §7`, patrz komentarz przy
     * `ELDER.allDone`).
     */
    greetings: {
      done: "Trzymaj. Kieł na rzemieniu — noś go, nie chowaj.",
      turnIn:
        "Masz go — i kieł też, widzę. Resztą się zajmę. Idź teraz do Dobiesława, słyszysz? To już nie jest tylko sprawa między tobą a mną.",
    },
    reward: { xp: 100, item: { itemId: "grey_fang_necklace" } },
  },
  /**
   * ── MYŚLIWY Z ZAGAJÓW — scena, o którą prosi `docs/swiat.md` §1 ───────────
   *
   * „Najmocniejsza scena do napisania: moment, w którym ktoś we wsi pierwszy
   * raz nazywa go *myśliwym*, a nie *synem rolnika*. Powinien ważyć więcej niż
   * jakikolwiek awans na poziom." Sołtys nosi urząd, więc to on ma prawo tak
   * kogoś nazwać — i on jedyny. `ELDER.greetings.allDone` niósł pierwszy ślad
   * tej sceny od dawna; to jest jej pełna wersja.
   *
   * ⚠ **Jedyny cel to `equip`, i to jest wybór, a nie brak pomysłu na robotę.**
   * Sołtys ZEBRAŁ już składkę — nie ma po co nikogo obchodzić, praca została
   * wykonana w lesie. To, czego chce, to żeby ludzie zobaczyli, komu dali.
   * Przy okazji robi dokładnie to samo, co `stick_in_hand` zrobił dla plecaka:
   * uczy nowego slotu w jedynym momencie, w którym ten slot JEST treścią.
   * Amulet był martwym kaflem od powstania lalki ekwipunku.
   *
   * ⚠ **Złoto jest tu, a nie u Myśliwego, i suma jest wyprowadzona.** 220 g to
   * najwyższa wypłata w grze — powyżej `wolf_pack_cull` (80 g, pięć domów za
   * trzy wilki), bo tu składa się cała wieś za sprawę, która dotyczyła
   * wszystkich. Bilans dla gracza wychodzi mniej więcej na zero względem
   * poprzedniej wersji (było: 150 g za zadanie + 140 g za sprzedany kieł),
   * tylko zamiast 290 g rozchodzących się po sklepach zostaje 220 g i przedmiot
   * na stałe.
   *
   * ⚠ **Nie ma tu żadnego nowego rekwizytu ani sprite'a.** Sołtys stoi na
   * mapie od dawna, naszyjnik jest ikoną z `items.png`, a slot ma wygrawerowany
   * glif w `slots.png` od dnia, w którym powstała lalka.
   */
  mysliwy_z_zagajow: {
    id: "mysliwy_z_zagajow",
    name: "Myśliwy z Zagajów",
    giver: "elder",
    requiresQuest: "grey_wolf_revenge",
    description:
      "Siadaj. Nie, naprawdę siadaj. Wieś złożyła się na to jeszcze zanim poszedłeś — i powiem ci uczciwie, że składali się ludzie, którzy nie wierzyli, że będzie komu to oddać. Weź to. I załóż ten kieł tak, żeby było widać, bo jak przyjdziesz po niego z ręką w kieszeni, to połowa wsi dalej będzie mówiła o tobie „chłopak Marka”. Nie jesteś już chłopakiem Marka. Jesteś myśliwym z Zagajów.",
    objectives: [{ kind: "equip", itemId: "grey_fang_necklace" }],
    greetings: { done: "Niechaj ci się darzy, myśliwy." },
    reward: { gold: 220, xp: 60 },
  },
  /**
   * ── SFORA — pierwsze zadanie, które przechodzi przez bramę w obie strony ──
   *
   * Bierze się je **we wsi** (Gniewko stoi na ugorze), robi **w lesie**
   * (sfora żyje na południowo-zachodnim skraju `forrest.tmj`) i oddaje z
   * powrotem **we wsi**. Każde dotychczasowe zadanie domykało się po jednej
   * stronie portalu albo (`know_the_village`) w całości po tej drugiej — to
   * jest pierwsze, które WYMAGA wrócenia, i po to powstało.
   *
   * **Gracz nie trafia tu sam.** Gniewko nie stoi na trasie niczego; jedyne,
   * co go otwiera, to `MERCHANT.topics.owce` — Myśliwy podaje nazwisko i
   * mówi „pewnie ma dla ciebie zlecenie". Rozmowa jest więc po raz pierwszy
   * *dawcą zadania*, a nie tylko tłem: to ten sam mechanizm co globalny zbiór
   * zadanych pytań (patrz `Dialogue.ts`), użyty do czegoś, co ma stawkę.
   *
   * **Trzy sztuki, bo sfora liczy trzy** (`forrest.tmj`, `WOLF.pack`) — nie
   * jest to okrągła liczba wzięta z sufitu i `GNIEWKO.topics.ile_zabraly`
   * jest jedynym miejscem, gdzie pada wprost. Wilki respawnują się, więc
   * nieudana próba nie zamyka zadania na stałe.
   *
   * ⚠ **Na mapie stoją CZTERY wilki, nie trzy** — od 2026-08-13 na trasie
   * leży jeszcze samotnik (patrz `tools/build_mapa.py`, „SAMOTNY WILK").
   * `recordKill("wolf")` nie rozróżnia sfory od samotnika, więc zabicie go
   * daje 1/3 postępu — i dlatego opis mówi „trzy wilki mniej na zachodnim
   * skraju", a nie „wybij tę trójkę". Pierwsza wersja mówiła „wszystkimi
   * trzema, bo dwie to tylko rozzłoszczona reszta" i po dołożeniu samotnika
   * kłóciła się z własnym licznikiem. Jeżeli kiedyś ma liczyć się WYŁĄCZNIE
   * sfora, to jest zmiana w `Objective`, nie w tekście.
   *
   * **Wisi na `rabbit_hunt`, a NIE wstawia się przed `grey_wolf_revenge`.**
   * Kusi, żeby zrobić z tego szczebel drabiny (sfora → Szary): eskalacja jest
   * prawdziwa, 3 zwykłe wilki przed elitą na 190 HP. Ale `isUnlocked` liczy
   * się NA ŻYWO — dorzucenie `requiresQuest` do zadania, które w czyimś
   * zapisie jest już `active`, ukryłoby je u dawcy i nie dałoby go oddać.
   * Kolejność jest więc opowiedziana (Myśliwy odsyła), nie wymuszona.
   *
   * Nagroda siedzi między `rabbit_hunt` (50g/30 XP) a `grey_wolf_revenge`
   * (150g/100 XP) — i to nie są jego pieniądze, tylko złożone przez pięć
   * domów, co mówi wprost opis. Pasterz nie płaci za przysługę; rozlicza
   * rachunek, który sam prowadzi.
   */
  wolf_pack_cull: {
    id: "wolf_pack_cull",
    name: "Rachunek pasterza",
    giver: "gniewko",
    /** ⚠ ZMIANA 2026-08-22: `rabbit_hunt` → `know_the_village`. Zależność
     *  poprawna dla zapisów już aktywnych — `Quests.isUnlocked` ma wyjątek
     *  dla zadań już w dzienniku (patrz komentarz przy `zielarskie_zapasy`). */
    requiresQuest: "know_the_village",
    description:
      "Cztery owce w dwa tygodnie, a trzy z nich cudze. Nie proszę o pomstę, bo pomsty nie da się policzyć — proszę o trzy wilki mniej na zachodnim skraju. Jednego spotkasz po drodze, samego; reszta chodzi razem i tych nie zaczepiaj, póki nie będziesz pewny. Złożyliśmy się pięcioma domami. Nie moje to złoto, więc się nie targuj.",
    objectives: [{ kind: "kill", enemy: "wolf", count: 3 }],
    /**
     * ⚠ **Most do `grey_wolf_revenge`, dopisany 2026-08-22 — bez niego
     * przejście czyta się jako „zabij 3 wilki → zabij większego wilka",
     * nie jako eskalację.** Ten sam wzorzec referrala co Miłosz→Dobek i
     * Sobek→Radzim w `know_the_village`, zero nowego objective. Tańszy niż
     * beat w `rabbit_hunt`: `wolf_pack_cull` to JEDYNE zadanie Gniewki w
     * całej grze, więc to nadpisanie nigdy się nie powtórzy przy innym
     * queście.
     */
    greetings: {
      done: "Trzy wilki, trzy karby na kiju. Płacę, jak się umawialiśmy.",
      turnIn:
        "Wróciłeś. Trzy mniej, owiec mi to nie odda, ale dziękuję. Tylko wiesz co — te trzy nie chodziły same, ktoś je tu pchał. Powiedz o tym Wszeborowi, on te ślady zna lepiej ode mnie.",
    },
    reward: { gold: 80, xp: 70 },
  },
  /**
   * Dobek's rabbits — the second quest that costs no new art or map work at
   * all, and the first one whose hook was ALREADY WRITTEN and left unused.
   *
   * `PEASANT.topics.ile_zjadaja` has been in the game saying "nie liczy się,
   * ile zjedzą — liczy się, ile stratują… chodź o świcie na moje pole i sam
   * zobacz, którędy szły", and `HANNA.topics.ile_zboza` follows it with
   * "żebyś wiedział, co liczysz, jak liczysz zające". Two residents set up a
   * job nobody could take. This is that job.
   *
   * ⚠ **Deliberately `kill`, where the Hunter's `rabbit_hunt` is `collect`.**
   * They are the same animal and must not be the same errand: the Hunter
   * wants meat off the carcass (live inventory, sellable, losable), Dobek
   * wants them gone off his field (latched counter, nothing to carry). Same
   * creature, two different verbs, two different reasons — which is exactly
   * how the roster is supposed to be reused instead of grown.
   *
   * Gated on `rabbit_hunt` so the Hunter teaches the animal first; Miłosz's
   * `zajace_u_dobka` topic is what points the player here (see the referral
   * note there — same pattern as the Hunter → Gniewko hand-off).
   */
  zajace_w_zbozu: {
    id: "zajace_w_zbozu",
    name: "Wydeptane zagony",
    giver: "peasant",
    /** ⚠ ZMIANA 2026-08-22: `rabbit_hunt` → `know_the_village`. Odblokowuje
     *  się teraz razem z `wolf_pack_cull` i `droga_na_wschod`, przy oddaniu
     *  obchodu Sołtysowi — nie osobno, tuż po pierwszym polowaniu. Opis
     *  questa („Mówiłem ci już") już zakładał wcześniejszy kontakt z
     *  graczem i teraz pasuje LEPIEJ niż wcześniej, bo Miłosz w
     *  `know_the_village` naprawdę wysyła gracza do Dobka. */
    requiresQuest: "know_the_village",
    description:
      "Mówiłem ci już: nie liczy się, ile zjedzą. Zając wchodzi w łan, wyjada kłos u dołu i kładzie źdźbło — jeden na noc kładzie tyle, co zje trzech. Sześć sztuk z zagonów od strony lasu. Nie proszę cię o czyszczenie pola do gołego, bo się tego nie da i nie o to chodzi; proszę, żeby przez tydzień było ich mniej, niż się zdąży wylęgnąć. Zapłacę z tego, co zostało po zeszłych żniwach, więc nie licz na wiele — ale policzę uczciwie.",
    objectives: [{ kind: "kill", enemy: "rabbit", count: 6 }],
    /** Modest on purpose: `HANNA.topics.woly_rywalizacja` establishes that
     *  this household has no oxen and ploughs on the Sołtys's borrowed ones.
     *  A farmer who borrows his draught animals does not out-pay a shepherd
     *  who collected from five houses (wolf_pack_cull, 80 g). */
    greetings: { done: "Sześć mniej. Starczy na teraz — resztę zboże jakoś przetrzyma." },
    reward: { gold: 45, xp: 55 },
  },
  /**
   * Radzim's eastern road — and the first quest in the game that touches the
   * spiders at all. Two species, six spawns, a whole venom system, and until
   * now zero quest content pointed at any of it.
   *
   * The hook is `BLACKSMITH.topics.pajaki`, already written: "trzy lata temu
   * jeździło się na wschód po drewno na osie… teraz nikt tam nie jedzie.
   * Nikt niczego nie widział, nikt nikomu nie zabronił. Po prostu przestali."
   *
   * ⚠ **It must NOT explain the spiders, and that is a hard lore rule, not a
   * scope cut.** `docs/swiat.md` (§"Pająki — pierwszy ślad tego, co siedzi
   * głębiej") is explicit: the spiders "nie tłumaczą jeszcze niczego" and
   * exist only to make the eastern thicket feel like it "należy już do kogoś
   * innego"; the whole question chain deliberately ends unanswered. So this
   * quest is about the PRACTICAL consequence — wagons stopped going — and
   * Radzim's own voice already models the restraint: he refuses to speculate
   * and redirects to the wagons. Do not let a future rewrite have anyone
   * work out what is deeper.
   *
   * ⚠ Asks for `spider` (sieciarz) only, never `venomspider`. Same document:
   * the sieciarz is met by accident on the way to the boars, the skoczek only
   * once you have "poszedł dalej, niż trzeba było". Sending the player after
   * skoczki on a wagon-road errand would collapse that border.
   */
  droga_na_wschod: {
    id: "droga_na_wschod",
    name: "Droga na wschód",
    giver: "blacksmith",
    requiresQuest: "know_the_village",
    description:
      "Pytałeś mnie o pajęczynę, to teraz posłuchaj o wozach. Sobek robi dwa zapasowe koła na wiosnę i do jesieni oba schodzą, a na osie szło zawsze drewno ze wschodu — twarde, proste, najlepsze jakie było. Trzy lata i nikt tam nie zajechał. Nie chcę wiedzieć dlaczego, chłopcze, i tobie też nie radzę pytać. Chcę, żeby wóz przejechał raz. Trzy te sieciarze, co siedzą najbliżej traktu. Reszty nie ruszaj i nie idź głębiej, niż musisz.",
    objectives: [{ kind: "kill", enemy: "spider", count: 3 }],
    /**
     * Płaci z półki, nie z kiesy — `BLACKSMITH.topics.bron_skad` mówi wprost,
     * że stal na niej jest z drugiej ręki i "leży bezużyteczne". Celowo
     * pancerz, a nie broń: on tej broni nie kuje i sam to przyznaje.
     *
     * ⚠ **Jakość 2 (Niska), bo tyle wynosi SUFIT jego własnej półki** —
     * `BLACKSMITH.stockQuality.armor` to `[1, 2]`, i to jest charakterystyka,
     * nie zaniedbanie: wiejski kowal kuje podkowy i części do młyna, a nie
     * zbroje. Pierwsza wersja dawała tu jakość 4 (Dobra) i było to wprost
     * sprzeczne — gracz widzi etykietę jakości, więc od razu by zapytał,
     * czemu ten sam człowiek sprzedaje Podłe, a rozdaje Dobre. Nagroda ma
     * być darmowym hełmem z półki, nie lepszym sprzętem niż ten na sprzedaż.
     *
     * ⚠ NIE podnosić tego do 5–7. Ta rezerwa jest zaparkowana (`docs/
     * odlozone.md` — „Szeroki rollout Fazy 3"), z jednym zaszłym wyjątkiem
     * (`rabbit_hunt`), i wiejski kowal jest ostatnią osobą, która miałaby ją
     * otwierać.
     */
    greetings: { done: "Hełm twój, chłopcze. Głowę masz jedną, a do lasu chodzisz często." },
    reward: { gold: 60, xp: 90, item: { itemId: "steel_helmet", quality: 2 } },
  },
  /**
   * Puklerz od stolarza — pierwsze zadanie Sobka i jedyna droga do tarczy,
   * która nie jest zakupem.
   *
   * ⚠ **Sobek jest tu właściwym człowiekiem z jego własnej, już wypowiedzianej
   * kwestii.** `SOBEK.topics.kola` mówi: „ja drewno, on żelazo, i tak od
   * dwudziestu lat". Puklerz to krążek klepek z pasami — czyste drewno, czyli
   * dokładnie jego robota, a nie Radzima. To jest ten sam wzorzec, co przy
   * `zajace_w_zbozu` i `droga_na_wschod`: zadanie wyrasta z kwestii, która
   * stała w grze nieużywana, a nie z nowego pomysłu doklejonego do postaci.
   *
   * ⚠ **Płaci przedmiotem i XP, ZERO złota, i to jest treść, nie oszczędność.**
   * To nie jest zlecenie — to jest wymiana: przynosisz skóry na pasy, on daje
   * ci rzecz z nich zrobioną. Gdyby jeszcze dopłacał, przestałaby to być
   * wymiana, a stałaby się pensją. `Quests.rewardText` obsługuje brakujące
   * pola, więc pominięcie złota jest legalne — patrz `stick_in_hand`, który
   * z tego samego powodu nie płaci nic.
   *
   * ⚠ **Jakość 3 (Zwykła), przy Niskiej na półce u Kowala.** Sobek robi ten
   * puklerz sam, ze swojego drewna i dla konkretnego człowieka; kowal sprzedaje
   * to, co mu ktoś przyniósł. Reguła „nagroda nie może przebić własnej półki
   * dającego" (patrz `droga_na_wschod` wyżej) jest tu spełniona z zapasem:
   * Sobek nie ma półki, ale ma warsztat i dwadzieścia lat wprawy w drewnie.
   *
   * ⚠ **Bramka `requires: "skinning"` jest jawna, a nie ukryta.** Skóry
   * z dzika lecą wyłącznie ze Skórowania, więc bez tej bramki zadanie
   * wyglądałoby na wykonalne i po prostu nigdy nie ruszałoby licznika. Gracz
   * bez Skórowania ma drugą drogę: puklerz stoi też na półce u Kowala.
   *
   * ⚠ **`requiresQuest: "droga_na_wschod"` — i to NIE jest bramka dołożona dla
   * tempa, tylko domknięcie przysługi, która już stoi w grze.** Zadanie
   * Radzima jest wprost o drewnie na osie **dla Sobka** („Sobek robi dwa
   * zapasowe koła na wiosnę i do jesieni oba schodzą, a na osie szło zawsze
   * drewno ze wschodu"). Czyścisz trakt cudzymi rękami, o nic nie prosząc — a
   * potem stolarz oddaje. Cały łańcuch: `know_the_village` (Sołtys każe ci
   * poznać wieś) → `droga_na_wschod` (kowal posyła cię na trakt) →
   * `skora_na_pasy` (stolarz się rewanżuje). Trzech ludzi, jedna sprawa,
   * zero nowej treści poza tą jedną linijką warunku.
   */
  skora_na_pasy: {
    id: "skora_na_pasy",
    name: "Skóra na pasy",
    giver: "sobek",
    requires: "skinning",
    requiresQuest: "droga_na_wschod",
    description:
      "Radzim mówił, po co poszedłeś na wschód. Nie prosiłeś mnie o nic, a wóz po osie pojedzie — więc teraz ja mam u ciebie. Korpus zrobię z klepek w jeden wieczór, to nie sztuka, ale tarcza trzyma się na pasach, a pasa z drewna nie wystrugam. Przynieś dwie skóry z dzika, grube, nie te zajęcze łachy. Obręcz nabiję, pasy przynituję i będziesz miał czym zasłonić to, na co patrzysz. Tylko nie licz, że ci ją potem zbiję żelazem — żelazo jest Radzima.",
    objectives: [{ kind: "collect", itemId: "boar_hide", count: 2 }],
    greetings: { done: "Gotowe. Klepki trzymają, pasy trzymają — teraz ty trzymaj i nie zgub." },
    reward: { xp: 70, item: { itemId: "buckler", quality: 3 } },
  },
  /**
   * The village's own first quest, and the one that costs no art at all: five
   * residents already stand on `village-zagaje.tmj` doing nothing but greeting
   * you. This turns three of them into content by asking you to go and meet
   * them — which is also the first time the forest→village portal has a reason
   * to be walked in that direction.
   */
  know_the_village: {
    id: "know_the_village",
    /**
     * ⚠ **Redesign 2026-08-22, `id` bez zmian — zmiana `id` skasowałaby
     * postęp w istniejących zapisach, silnik nie migruje niezgodnych
     * zapisów.** Stara nazwa i opis („poznaj wieś, żeby cię znali z twarzy")
     * zakładały, że gracz nie zna mieszkańców, których zna od dziecka —
     * zgłoszone wprost. Nowa wersja: Sołtys deleguje TRZY konkretne sprawy
     * (bezpieczeństwo/żywność/infrastruktura), a nie obchód towarzyski, i
     * quest staje się zawiasem, z którego odblokowują się MQ4 + dwa side
     * questy naraz.
     */
    name: "Sprawy Zagajów",
    giver: "elder",
    /** Wszebor odsyła gracza do Sołtysa — pierwsze zadanie w grze poza jego
     *  własnym katalogiem, więc `rabbit_hunt` jest naturalną bramką. */
    requiresQuest: "rabbit_hunt",
    /**
     * ⚠ **Sformułowanie „zajrzyj / zobacz, czy czegoś nie potrzebują", NIE
     * „dowiedz się, co się stało" — wymuszone mechaniką, nie stylem.**
     * `Quests.recordTalk` zalicza `talk` na SAMYM OTWARCIU okna rozmowy
     * (`NpcDialog.openDialog`), zanim gracz przeczyta jakikolwiek tekst czy
     * temat — więc quest nie może obiecywać wiedzy, której mechanicznie nie
     * gwarantuje.
     *
     * ⚠ **Celowo NIE „jesteś teraz zastępcą Wszebora".** Awans społeczny ma
     * być rezultatem całego łuku (zające → obchód → wilki → Szary), nie jego
     * przesłanką — formuła to przysługa („trochę za niego chodzisz"), status
     * zmienia się dopiero w `mysliwy_z_zagajow`.
     */
    description:
      "Wszebor zwykle wiedział, co dzieje się przy lesie, zanim ludzie przyszli z tym do mnie. Skoro teraz trochę za niego chodzisz, zajrzyj do trzech osób: Gniewki, Miłosza i Sobka. Zobacz, czy czegoś nie potrzebują.",
    objectives: [
      { kind: "talk", npc: "gniewko", topic: "czyje_owce" },
      { kind: "talk", npc: "miller", topic: "bez_zboza" },
      { kind: "talk", npc: "sobek", topic: "kola" },
    ],
    /**
     * ⚠ **Scena hierarchizacji — pierwsza w grze, w której gracz dostaje
     * naraz MAIN + dwa SIDE i wie, co jest pilne.** Bez tego zdania trzy
     * jednocześnie odblokowane zadania (patrz `requiresQuest` w
     * `wolf_pack_cull`/`zajace_w_zbozu`, oba wskazujące na ten quest) nie
     * różnią się niczym poza kolejnością w dzienniku.
     */
    greetings: {
      done: "Dobrze, żeś obszedł wszystkich. Jeno tak się poznaje wieś — po ludziach, nie po płotach.",
      turnIn: "Zboże poczeka dzień. Wóz też. Wilk nie. Idź najpierw do Gniewki.",
    },
    reward: { gold: 25, xp: 40 },
  },
  /**
   * ── DWA ZADANIA ZIELARKI ────────────────────────────────────────────────
   *
   * Pierwsze zbierackie zadania w grze, i pierwsze, których nie da się zrobić
   * mieczem. Rozdzielone **geograficznie, nie liczbowo** — to jest cały ich
   * projekt:
   *
   *   • `zielarskie_zapasy` prosi o rumianek i krwawnik, czyli o dwa gatunki,
   *     które (patrz `tools/rozstaw_ziola.py`) rosną praktycznie tylko WE WSI.
   *     Da się je zrobić w całości we wsi i na błoniach, na poziomie 1, bez walki. To
   *     jest bezpieczne wejście w mechanikę i przy okazji pierwszy powód, żeby
   *     obejść własną wieś zamiast przez nią przebiec.
   *   • `dziurawiec_na_zime` prosi o gatunek, który rośnie WYŁĄCZNIE na leśnych
   *     polanach — między dzikami i pająkami. Ta sama czynność, inna stawka, i
   *     eskalacja zapisana w geografii, nie w liczbie sztuk.
   *
   * Zadania nie mówią, gdzie szukać. Od tego jest rozmowa (`gdzie_szukac`) —
   * gracz ma dostać wskazówkę, nie znacznik na mapie.
   */
  /**
   * ŁAŃCUCH ZBIERACKI — otwiera go wnuk, nie babka.
   *
   *   ziola_dla_babki (Patryczek)
   *     → zielarskie_zapasy (Dorota)
   *       → dziurawiec_na_zime (Dorota)
   *         → rekawice_od_wnuka (Patryczek) → rękawice pikowane
   *
   * ⚠ **Powód jest w kwestiach, które już stoją w grze, a nie w nowym
   * pomyśle.** Pierwsze zdanie Patryczka brzmi „mam rękę w łubkach i babkę na
   * karku", a `PATRYCZEK.topics.babka_ziola` mówi, że do lasu po zioła chodzi
   * z nią właśnie on. Z ręką w łubkach nie schyla się i nie niesie, a wilki
   * schodzą pod wieś (`wolf_pack_cull`, `GNIEWKO.topics.ile_zabraly`) — więc
   * nie puści tam babki samej i sam też nie pójdzie. To jest jedyny moment,
   * w którym prosi kogokolwiek o cokolwiek, i dlatego zamyka to sam.
   *
   * ⚠ **Dorota NIE oddaje przez to swoich zadań** — dalej ona uczy ziół i ona
   * je odbiera. Wnuk jest tylko drzwiami: bez niego jej lista się nie pokazuje.
   */
  ziola_dla_babki: {
    id: "ziola_dla_babki",
    name: "Zioła dla babki",
    giver: "patryczek",
    /** ⚠ Nie wspomina już owijek — te wręcza `stick_in_hand`'s stage
     *  `visit_patryczek` (`onComplete.grant`), zanim ta rozmowa w ogóle
     *  dochodzi do skutku. Patrz duży komentarz nad `QUESTS.stick_in_hand`. */
    description:
      "Babka chodzi po zioła sama, odkąd ja mam to w łubkach, a wilki zeszły pod samą wieś. Sam nie pójdę, bo jedną ręką nawet kosza nie uniosę. Przynieś jej babki i pokrzywy, tyle co na początek. Nie po to, żeby jej pomóc — po to, żeby nie musiała iść.",
    objectives: [
      { kind: "talk", npc: "herbalist", topic: "gdzie_szukac" },
      { kind: "collect", itemId: "babka", count: 3 },
      { kind: "collect", itemId: "pokrzywa", count: 3 },
    ],
    /**
     * ⚠ **Babka i pokrzywa, bo Dorota nie prosi o nie w ŻADNYM swoim
     * zadaniu** (chce rumianku, krwawnika i dziurawca). Dzięki temu otwarcie
     * łańcucha uczy zbierania na roślinach, których reszta łańcucha nie
     * zużywa — gracz nie odkłada niczego „na później" i nie zbiera dwa razy
     * tego samego.
     *
     * Obie rosną też w lesie (`rozstaw_ziola.py`: rumianek ma w lesie ZERO
     * stanowisk), więc zadanie da się zacząć po drodze, a nie dopiero po
     * powrocie do wsi.
     */
    greetings: { done: "Babka nic nie powie, ale ja widzę. Dzięki." },
    reward: { gold: 20, xp: 40 },
  },
  zielarskie_zapasy: {
    id: "zielarskie_zapasy",
    name: "Zapasy zielarki",
    giver: "herbalist",
    /**
     * ⚠ **Dopisane do ZADANIA, KTÓRE JUŻ BYŁO W GRZE**, co do tej pory było
     * niebezpieczne: `Quests.isUnlocked` patrzyło wyłącznie na warunki, więc
     * postać z tym zadaniem AKTYWNYM w zapisie przestałaby je widzieć u
     * Doroty i nie mogłaby go oddać. Naprawione u źródła — zadanie z dziennika
     * jest odblokowane zawsze (patrz `Quests.isUnlocked`) — i dopiero to
     * pozwoliło przełożyć kolejność bez psucia komukolwiek rozgrywki.
     */
    requiresQuest: "ziola_dla_babki",
    description:
      "Ręce mnie bolą przy schylaniu, a sezon nie czeka. Przynieś mi cztery rumianki i trzy krwawniki, zanim minie pora.",
    objectives: [
      { kind: "collect", itemId: "rumianek", count: 4 },
      { kind: "collect", itemId: "krwawnik", count: 3 },
    ],
    greetings: { done: "Dobrze zebrane, synku. Wysuszę, nim przyjdą deszcze." },
    reward: { gold: 30, xp: 45 },
  },
  dziurawiec_na_zime: {
    id: "dziurawiec_na_zime",
    name: "Dziurawiec na zimę",
    giver: "herbalist",
    requiresQuest: "zielarskie_zapasy",
    description:
      "Teraz trudniejsze. Dziurawca nie znajdziesz na miedzy — on chce polany, słońca i lasu dookoła. Przynieś trzy kwitnące. I nie idź tam z gołymi rękami, bo nie tylko my go szukamy.",
    objectives: [{ kind: "collect", itemId: "dziurawiec", count: 3 }],
    greetings: { done: "Kwitnący, wszystkie trzy. Teraz zima może przyjść." },
    reward: { gold: 60, xp: 80 },
  },
  /**
   * Domknięcie łańcucha — i jedyna rzecz, o którą Patryczek prosi dla siebie.
   *
   * ⚠ **Pokrzywa, a nie len, i to nie jest ozdobnik.** Pikowanie to warstwy
   * tkaniny, a włókno pokrzywowe jest historycznie prawdziwym materiałem na
   * płótno — więc rękawice da się w tej wsi zrobić bez wprowadzania nowego
   * surowca i bez wchodzenia w rolę Witka, który robi len. Przy okazji drugi
   * raz zużywa ziele, którego Dorota nie tyka.
   *
   * ⚠ **Nagrodą jest przedmiot, nie złoto, a przedmiotu nie da się kupić.**
   * `padded_gloves` nie mają ceny zakupu i nie stoją na żadnej półce — to
   * jedyny rodzaj nagrody, której nie można obejść mieszkiem.
   *
   * ⚠ **Jakość Zwykła (3)** — reguła „nagroda nie przebija półki dającego"
   * (patrz `droga_na_wschod`) jest tu spełniona inaczej niż zwykle: Patryczek
   * nie ma półki i niczego nie sprzedaje, a rękawice szyje babka. Zwykła to
   * robota domowa zrobiona porządnie, nie towar.
   */
  rekawice_od_wnuka: {
    id: "rekawice_od_wnuka",
    name: "Rękawice od wnuka",
    giver: "patryczek",
    requiresQuest: "dziurawiec_na_zime",
    description:
      "Babka mówi, że masz oko. Ona nikomu tego nie mówi, więc się nie rozklejaj. Słuchaj: chodzisz po pokrzywach gołymi łapami i widać to po nich. Przynieś mi sześć — nie do gara, na włókno. Babka to spikuje, a ja ci powiem, jak to trzymać, żeby nie zdarło się po tygodniu. Tyle mogę jedną ręką.",
    objectives: [{ kind: "collect", itemId: "pokrzywa", count: 6 }],
    greetings: { done: "Załóż. Pokrzywy cię już nie ruszą — reszta lasu to twoja sprawa." },
    reward: { xp: 90, item: { itemId: "padded_gloves", quality: 3 } },
  },
  /**
   * ⭐ Bandyci (2026-10-11, `OI-171`, `docs/bandyci_plan.md`). Ludzkie
   * zagrożenie — ⛔ nie dotyka łańcucha przyczynowego. Dopiero po Szarym:
   * kanoniczny „oddech" po kulminacji, zwyczajny problem przed drugą falą.
   * Dwa etapy: najpierw zbóje z obozu, potem herszt (elita, nie odradza się).
   */
  zrabowany_woz: {
    id: "zrabowany_woz",
    name: "Zrabowany wóz",
    giver: "ciechan",
    requiresQuest: "grey_wolf_revenge",
    description:
      "Bolko wiózł drewno na targ. Za rzeką, tam gdzie trakt skręca na wschód, wyszło na niego czterech z lasu. Konie oddali — koni się nie sprzeda, każdy je pozna. Drewno, uprząż i sakiewkę wzięli, a wóz pociągnęli ze sobą w las — koleiny schodzą z traktu na północ, w bór, aż nad rzekę. Siedzą między wodą a wodą: od północy rzeka bez brodu, od traktu staw, a dookoła gąszcz. Tam nikt nie chodzi, bo nie ma po co. Ja jestem drwal, nie wojak, a synów tam nie poślę. Ty Szarego położyłeś. Przegoń ich — a z tym, co nimi rządzi, nie gadaj.",
    stages: [
      {
        id: "zboje",
        objectives: [
          { kind: "kill", enemy: "bandit_club", count: 2 },
          { kind: "kill", enemy: "bandit_axe", count: 2 },
        ],
      },
      { id: "herszt", objectives: [{ kind: "kill", enemy: "bandit_chief", count: 1 }] },
    ],
    greetings: { done: "Zrobione. Topór twój. Ostry — dbaj o niego." },
    reward: { xp: 150, gold: 150, item: { itemId: "bearded_axe", quality: 3 } },
  },
  /**
   * ⭐ Kirka (`OI-174`, zamiar autora 2026-10-11, wpięte 2026-10-12). Pies Anny
   * nie wraca od trzech dni; z pieczonym mięsem w torbie trzeba stanąć
   * w północno-zachodnim rogu wsi (obiekt `miejsce`, `id = kirka`), a Kirka
   * sama przybiega zza krawędzi świata, zjada i gna do domu (`KIRKA`,
   * `scenes/QuestSpots.ts`). Bohater dokarmia ją po cichu za plecami Anny
   * (`docs/swiat.md`) — stąd ironia w `turnIn`.
   * ⚠ **Anna o pomoc NIE prosi** (`ANNA.quests` — „nie potrzebuje pomocy”):
   * zadanie bierze gracz, który się upiera, a ona tylko mówi, jak to zrobić.
   * ⚠ Teksty do odbioru przez autora (`docs/content_expansion.md` §3).
   */
  szukaj_kirki: {
    id: "szukaj_kirki",
    name: "Poszukaj Kirki",
    giver: "anna",
    description:
      "Nie potrzebuję pomocy i nie proszę o nią — Kirka zawsze wraca. Tylko że „zawsze” znaczy wieczorem, a nie po trzech dniach. Ostatnio szczekała od północy, za ostatnimi płotami. Na wołanie nie przyjdzie, nie ta suka. Na pieczone mięso przyleci z końca świata — ktoś ją we wsi dokarmia za moimi plecami, nie wiem kto, ale jak się dowiem… Jak już się upierasz: weź kawałek, stań w północno-zachodnim rogu wsi, na łące nad młynówką, i poczekaj. Do domu trafi sama.",
    greetings: {
      done: "Masz, za fatygę. Ser, nie pieczyste — pieczyste ona już zjadła.",
      firstJob: "Kirka? Znajdzie się. …No dobra, trzeci dzień. Jak już koniecznie chcesz się na coś przydać, to słuchaj.",
      working: "Pieczone mięso, północno-zachodni róg, łąka nad młynówką. Stań i czekaj — ona przyjdzie po zapachu, nie po wołaniu.",
      turnIn: "Wróciła przed tobą. Brudna, z miną, jakby to ja gdzieś poszła — i czuć od niej pieczystym. Ciekawe skąd.",
      allDone: "Kirka znowu łazi po wsi, jakby nigdy nic. Chleb świeży, wczorajszy tańszy.",
    },
    objectives: [
      { kind: "reach", spot: "kirka", verb: "Zwab pieczonym mięsem", subject: "Kirka", itemId: "cooked_meat" },
    ],
    reward: { xp: 30, item: { itemId: "cheese", count: 2 } },
  },
} as const;

/** Death → resurrection flow. */
export const RESPAWN = {
  /** How long the death animation plays before the respawn prompt appears (ms). */
  promptDelayMs: 900,
  /**
   * Fraction of max HP restored on resurrection.
   *
   * NOT 1, deliberately. A full heal on respawn made dying the cheapest heal in
   * the game and quietly invalidated everything built around managing HP:
   * regeneration (75s for half a bar), food, potions, and the whole point of
   * the boar's telegraphed charge. You get up hurt, so you have to actually use
   * what's in your bag.
   */
  hpRatio: 0.5,
  /**
   * Share of carried gold lost on death. Scales with wealth on its own — 2 gold
   * at the start, 50 when you're saving for steel — so it stings the same at
   * every stage without a table. Zero gold means zero penalty, which keeps a
   * broke player from being stuck.
   */
  goldLossFraction: 0.1,
  /** Grace period after respawning during which the player can't be damaged (ms). */
  invulnerableMs: 2000,
  /** Blink period of the invulnerability flicker (ms). */
  invulnerableBlinkMs: 120,
  /**
   * If true the player resurrects at the map spawn point; if false, on the spot
   * where they fell (spawn point is safer — rabbits keep their aggro otherwise).
   */
  atSpawnPoint: true,
} as const;

/**
 * Sound. Files live in `public/assets/audio/*.wav` and are **procedural
 * placeholders** generated by `tools/gen_audio.py` — same rule as the textures:
 * drop a real recording in under the same name and it just replaces it.
 *
 * A missing file is not fatal. `Sfx` logs it once and every later play() for
 * that key is a no-op, so the game still runs with the folder deleted.
 */
export const AUDIO = {
  /** Scales everything. One knob for a future settings screen. */
  masterVolume: 0.6,
  /**
   * Per-sound level. These are NOT all 1.0 for a reason: `swing` fires on every
   * attack (up to ~3/s with Zręczność) so it has to sit far back, while a hit
   * or a level-up happens rarely enough to be loud.
   */
  volume: {
    swing: 0.3,
    hit: 0.7,
    crit: 0.85,
    hurt: 0.8,
    "enemy-die": 0.55,
    loot: 0.5,
    "level-up": 0.7,
    ability: 0.6,
    drink: 0.55,
    "player-die": 0.8,
    "ui-click": 0.28,
    /** Loud and long — a howl is a warning that the fight just got bigger, and
     *  it is throttled by its own cooldown anyway (WOLF.pack.howlCooldownMs). */
    howl: 0.75,
    /** Quiet: three spiders in a nest fire often, and this must not compete
     *  with the sounds that mean you are taking damage. */
    spit: 0.4,
    /** Something has taken an interest in you. Modest — it fires on aggro, and
     *  aggro happens constantly. */
    growl: 0.45,
    /** The boar has committed. Loud, because it is a warning with a deadline. */
    charge: 0.7,
    /** A heavy blow LANDING on the player (boar charge, Szary bite). Sits above
     *  `hurt` so "that one really hurt" is audible without reading the bar. */
    impact: 0.85,
    /**
     * Cios przyjęty na tarczę. Pada ZAMIAST `hurt`, nie obok niego, i siedzi
     * tuż pod nim — blok ma być słyszalny jako inne zdarzenie, a nie jako
     * głośniejsze to samo.
     *
     * ⚠ **To jest dziś jedyny kanał, którym gracz dowiaduje się, że tarcza
     * zadziałała.** Gra nie pokazuje otrzymanych obrażeń liczbą (CR-3.1 jest
     * zaparkowane), więc cicha redukcja procentowa jest po prostu niewidzialna
     * — dokładnie tak, jak dziś niewidzialne jest to, że stal jest gorsza
     * przeciw obuchowi. Dźwięk i błysk nie są tu ozdobą, tylko wymaganiem
     * (`docs/systemy/shields.md`).
     */
    block: 0.7,
    /** Pełne uniknięcie ciosu (Attack Resolver, Dodge). Cichszy niż `block`
     *  — Dodge ma być rzadki, więc kiedy pada, ma brzmieć jak coś, a nie
     *  jak fanfara. */
    dodge: 0.55,
    /** Sparowany cios (Attack Resolver, Parry — dziś tylko miecz). */
    parry: 0.6,
    /**
     * Looping forest bed. Very quiet by design: ambience works by being missed
     * when it stops, not by being noticed while it plays. Started through
     * `Sfx.startAmbient`, never through `play()`.
     */
    "forest-ambient": 0.16,
    /**
     * Looping village bed — same rules, one notch quieter.
     *
     * It carries discrete events (an anvil, hens, a dog) rather than pure
     * texture, and an event is far more noticeable than noise at the same
     * level: matched to the forest's 0.16 the hammer starts asking to be
     * listened to, which is exactly what a bed must not do.
     */
    "village-ambient": 0.13,
  },
  /**
   * Set false to run the game without any background bed.
   *
   * A permanent loop is the one sound a player cannot escape, so it gets an
   * off switch rather than only a volume. The first version of this bed was
   * generated from white noise through a single-pole filter and left 24% of
   * its energy above 2 kHz — it read as CRT-television hiss, which is exactly
   * the failure mode a looping bed must never have. See the band note in
   * tools/gen_audio.py before retuning it.
   */
  ambientEnabled: true,
  /**
   * The same sound cannot retrigger faster than this (ms).
   *
   * Matters most for `hit`: Wir ostrzy resolves against every enemy in range in
   * one frame, so a five-rabbit swarm would fire five identical samples at the
   * same instant. Summed amplitude clips and it reads as a burst of static
   * rather than five hits.
   */
  minRetriggerMs: 40,
} as const;

/**
 * Procedural motion for enemies — the cheap stand-in for animation we do not
 * have.
 *
 * Every enemy is a single static portrait (rabbit.png is 3 faces; the boar,
 * wolf, Szary and spider are generated), so nothing turns to face where it is
 * going. That was tolerable while everything walked in a straight line at you.
 * The wolf pack broke it: a wolf orbiting at 90° still shows a front-facing
 * head, and the circling reads as *sliding across the grass* rather than
 * running.
 *
 * So motion is faked from the physics body's own velocity: lean into travel,
 * stretch along it, squash across it. It is the standard 2D trick and it costs
 * one assignment per enemy per frame.
 *
 * **This replaced the old infinite "breathe" tween on purpose.** Breathe, lean,
 * stretch and the hit-pop all write scaleX/scaleY, and four tweens fighting
 * over two properties is unfixable by tuning. They are now summed into ONE
 * assignment per frame — which is also why `flashHit` is called with
 * `pop: false` for enemies (its tween would just be overwritten).
 */
/**
 * WARSTWA RUCHU — strojenie omijania przeszkód (`src/core/movement/`).
 *
 * ⚠ **`steer` jest DOMYŚLNIE wyłączony; włącza się per gatunek**
 * (`EnemyConfig.solver`), bo omijanie jest zmianą
 * odczucia walki, a nie poprawką techniczną — stworzenie, które nagle obchodzi
 * drzewa, czyta się inaczej niż to, które w nie wchodzi.
 *
 * **Stan na 2026-08-28: ma go dokładnie JEDEN gatunek — dzik.** Reszta rosteru
 * i oba krytery jadą `"direct"`. To zdanie mówiło do tego dnia „wyłączony dla
 * wszystkich" i zestarzało się przy pierwszym włączeniu; jeżeli dokładasz
 * kolejny, popraw je tutaj, bo to jedyne miejsce z listą.
 *
 * ⚠ **Zmierzone ograniczenie, o którym trzeba wiedzieć, zanim się kogoś na to
 * przepnie: sonda pyta o CAŁE ciało.** Gdy żadne odchylenie z wachlarza nie
 * mieści ciała, `steer()` oddaje wektor pierwotny — czyli **w ciasnym terenie
 * degraduje się do `Direct`**. Potwierdzone w grze na dziku (46 px ciała vs
 * bramy 18/33 px w lesie): omijanie nie odpaliło się tam ani razu. To NIE jest
 * usterka solvera — to jest granica lokalnego omijania jako klasy. Trasę wokół
 * takiego miejsca umie znaleźć dopiero `PathSolver` czytający prześwit z
 * `NavGrid`, i **dlatego** ta siatka niesie prześwit, a nie „wolne/zajęte".
 *
 * ⚠ **Liczby poniżej są SZKICEM sprzed playtestu ręką.** Symulacja pokazała, że
 * ich wpływ nie jest monotoniczny: przy zobowiązaniu 24 px dzik radził sobie
 * gorzej w rzadkim lesie niż bez omijania w ogóle (11 % → 18 % nieosiągalnych
 * pozycji), a przy 48 px lepiej wszędzie. **Nie da się ich wybrać z tabeli** —
 * to jest strojenie na gałce, dlatego stoją w configu, nie w solverze.
 */
export const MOVEMENT = {
  steer: {
    /** Jak daleko w przód patrzy sonda, w sekundach lotu przy bieżącej prędkości. */
    lookaheadSec: 0.28,
    /** Podłoga sondy (px) — wolny stwór też musi coś zobaczyć. */
    minLookaheadPx: 14,
    /**
     * Kolejne odchylenia próbne (stopnie), od najmniejszego. ⚠ Zaczyna się od
     * małych świadomie: wachlarz, który od razu skręca o 90°, jest tym samym
     * hackiem, którego ta warstwa miała nie być.
     */
    fanDeg: [18, 36, 54, 72, 90, 115, 140] as readonly number[],
    /** Ile pikseli DROGI (nie czasu) trzyma się raz wybrana strona objazdu. */
    commitPx: 40,
  },
  /**
   * Sufit odchylenia per RODZAJ INTENCJI — własność intencji, nie stworzenia.
   *
   * ⚠ `flee` ma 90° i ani stopnia więcej: ucieczka, której wolno skręcić
   * ostrzej, zaczyna zawracać ku źródłu zagrożenia. Zmierzone na zrywie sarny
   * (2026-08-28): potraktowanie ucieczki jak dojścia do punktu ścięło pełne
   * zrywy z 83 % na 73 %.
   */
  maxDeflectDeg: {
    seek: 140,
    ring: 90,
    flee: 90,
  },
} as const;

export const ENEMY_MOTION = {
  /** Idle breathe amplitude (fraction of scale) and period (ms). Fades out as
   *  the creature speeds up — a sprinting wolf should not look like it is
   *  gently sighing. */
  breatheAmount: 0.05,
  breatheMs: 840,
  /** Max lean into horizontal travel, in degrees, at full drive. */
  leanDeg: 9,
  /**
   * Stretch along the direction of travel at full drive (fraction of scale).
   * The cross axis squashes by half of it, so the silhouette keeps roughly its
   * volume instead of ballooning.
   *
   * **This and `maxDrive` are the two numbers to taste-tune.** Together they
   * cap the deformation: at 0.14 × 1.9 a wolf's 320px/s lunge stretches ~27%
   * and an ordinary chase ~14%. Push them much higher and a committed lunge
   * stops reading as a smear and starts reading as rubber.
   */
  stretch: 0.14,
  /**
   * Drive is `speed / chaseSpeed`, clamped here. Normalising against each
   * creature's OWN chase speed is what keeps a lumbering boar reading as heavy
   * while a wolf reads as quick; the clamp is what lets a committed charge or
   * lunge (several times chase speed) blow past normal running and look like
   * an all-out sprint, without deforming into abstract art.
   */
  maxDrive: 1.9,
  /** Scale bump when hit, and how long it lasts (ms). Driven from here rather
   *  than by flashHit's tween — see the note above. */
  hitPop: 0.12,
  hitPopMs: 90,
} as const;

/** How hard-hit feedback looks/feels. */
export const COMBAT_FEEDBACK = {
  /** Tint applied on hit. */
  hitTint: 0xff3b3b,
  /**
   * Odstęp między kolejnymi napisami odmowy ataku — „Brak celu" **oraz**
   * „Za daleko" (ms).
   *
   * ⚠ Istnieje z tego samego powodu co `AUDIO.minRetriggerMs` i
   * `aoeStaggerMs`: **efekt musi być rzadszy niż zdarzenie, które go
   * wyzwala.** Komunikat leci na zboczu naciśnięcia ataku — najczęściej
   * naciskanego przycisku w grze — a naciska się go najgęściej dokładnie
   * wtedy, gdy nic nie trafia. Bez dławienia gracz w panice zasypałby sobie
   * ekran własnymi napisami.
   *
   * ⚠ **Obie odmowy dzielą JEDEN licznik, nie mają po własnym.** Wykluczają się
   * wzajemnie w obrębie jednego naciśnięcia (albo nie masz celu, albo masz go
   * za daleko), więc osobne liczniki nie kupiłyby nic, a pozwoliłyby na
   * podwojoną częstość napisów przy przeskakiwaniu między tymi stanami —
   * czyli obeszłyby dławienie dokładnie tam, gdzie jest potrzebne.
   */
  attackRefusalMsgMs: 900,
  /**
   * Błysk ciosu przyjętego na tarczę — chłodna stal zamiast czerwieni ciała.
   *
   * ⚠ Kolor jest tu CAŁYM komunikatem: `flashHit` to jedyny błysk, jaki gra
   * rysuje na graczu, więc „oberwałem" i „zasłoniłem się" muszą się różnić
   * właśnie nim. Wybrany chłodny i wyraźnie jaśniejszy od czerwieni, bo obie
   * wersje padają w tej samej sytuacji i przy tej samej długości
   * (`hitFlashMs`), więc rozróżnić je da się tylko barwą.
   */
  blockTint: 0x9fd4ff,
  /** Tint on a fully avoided hit (Attack Resolver: Dodge). Cooler/brighter
   *  than `blockTint` — Block still took SOMETHING, Dodge took nothing. */
  dodgeTint: 0xbfffd0,
  /** Tint on a parried hit (Attack Resolver: Parry, sword only). */
  parryTint: 0xffe6a0,
  /**
   * **Napis nad graczem przy wyniku, który zatrzymał cios.**
   *
   * ⚠ **Istnieje, bo „nie oberwałem" i „oberwałem za zero" wyglądały
   * identycznie.** Do 2026-08-26 unik, parada i blok były rozróżniane
   * **wyłącznie kolorem błysku** (`cuesFor` — „jego barwa jest całym
   * słownikiem tego kanału"), a kierunek wróg→gracz nie ma popupu z liczbą
   * w ogóle. Do tego `dodge` i `parry` **nie mają plików dźwiękowych**
   * (`docs/systemy/presentation.md`), więc dwa z trzech wyników nie miały ani
   * napisu, ani liczby, ani dźwięku — tylko odcień żółtego kontra zielonego,
   * przez 120 ms, pod palcem gracza.
   *
   * ⚠ **To jest WYŁĄCZNIE prezentacja.** Żaden z tych napisów nie zmienia
   * pozycji, czasu ani stanu — nie ma prawa, bo mieszka po klienckiej stronie
   * podziału §5.6 (`CombatCues` → `CombatFx`). Rozstrzygnięcie i jego liczby
   * są nietknięte.
   *
   * ⚠ **`immune` NIE MA tu wpisu i to jest decyzja, nie luka.** Nietykalność
   * jest w tej grze cicha we wszystkich kanałach: gracz właśnie dostał
   * informację „przewrót zadziałał", a drugi sygnał w tym samym miejscu tylko
   * ją rozmydla (`CombatCues.cuesFor`). Dopisanie klucza `immune` włącza napis
   * jedną linijką — ale odwraca zapisaną decyzję i wymaga jej zmiany, nie
   * dopisania pola.
   */
  outcomeLabel: {
    /** Podnosi się mniej i gaśnie szybciej niż liczba obrażeń: to potwierdzenie,
     *  nie odczyt — ma być zauważone, nie czytane. */
    rise: 18,
    duration: 560,
    fontSize: 11,
    /** Nad głową, wyżej niż popup obrażeń wroga (ten siada na `y − 16`). */
    offsetY: -28,
    /** Barwy zgodne z tintami wyżej — napis potwierdza błysk, nie wprowadza
     *  drugiego słownika kolorów. */
    text: {
      dodge: { text: "Unik", color: "#bfffd0" },
      parry: { text: "Sparowano", color: "#ffe6a0" },
      block: { text: "Blok", color: "#9fd4ff" },
    } as Record<string, { text: string; color: string }>,
  },
  /**
   * **Prezentacja WARSTWY 2 (Proficiency).** Patrz `core/Proficiency.ts`
   * i `docs/systemy/proficiency.md`
   *
   * ⚠ **ZERO nowych wpisów w `SOUNDS`, i to jest wymuszone.** Każdy nowy
   * dźwięk przesuwa strumień RNG generatora `tools/gen_audio.py` i po cichu
   * zmienia KAŻDY plik poniżej (`combat_feel_5b.md` §9) — czyli regeneracja
   * całego audio, nie doklejka. Oba wyniki jadą więc na istniejących próbkach
   * z przestrojeniem, dokładnie tak, jak świst już dziś odróżnia się od
   * zamachu tym samym mechanizmem.
   *
   * ⚠ **Napis przy ześlizgu NIE jest ozdobą.** Zmierzone: dla każdego ataku
   * o rzucie ≤ 5 punktów ześlizg i czyste trafienie dają po zaokrągleniu tę
   * samą liczbę (podłoga `Math.max(1, …)`), a `impactTier` schodzi u obu do
   * `light` na CAŁYM rosterze. Liczba i intensywność nie niosą tej kategorii —
   * niesie ją wyłącznie ten blok.
   */
  execution: {
    graze: {
      /** Barwa „musnęło": chłodna, wyraźnie inna od czerwieni `hitTint`. */
      tint: 0xc8b9a0,
      /** Cios doszedł, ale marnie — ta sama próbka, niżej i ciszej. */
      sfxDetuneShift: -420,
      sfxVolumeMul: 0.7,
      /** Krócej i płycej niż `tiers.light` — ześlizg nie jest ciężarem. */
      flashMs: 70,
      popScale: 1.03,
    },
    fumble: {
      /** Ślad świstu w barwie „potknięcia", odróżnialny od czystego pudła. */
      tint: 0xb9a37e,
      sfxDetuneShift: -220,
    },
    text: {
      graze: { text: "Ześlizg", color: "#c8b9a0" },
      fumble: { text: "Niezgrabnie", color: "#b9a37e" },
    } as Record<string, { text: string; color: string }>,
  },
  /**
   * Pierścień rysowany pod zaznaczonym wrogiem.
   *
   * ⚠ **Jest TEKSTURĄ, nie obiektem `Arc` — i to jest różnica wydajnościowa,
   * nie stylistyczna.** `Arc` z obrysem idzie przez `StrokePathWebGL`, czyli
   * **tesseluje okrąg na ~100 odcinków i wysyła ~100 quadów W KAŻDEJ KLATCE,
   * w której masz cel**. Trace z 2026-08-23: `ArcWebGLRenderer` 750 ms,
   * `StrokePathWebGL` 546 ms, `batchLine` 469 ms — 6,5% aktywnego CPU na
   * jedno kółko. Upieczony raz przy starcie kosztuje jeden quad.
   *
   * To ta sama pułapka, którą `src/ui/CLAUDE.md` opisuje przy
   * `Graphics.slice` w wycince cooldownu. Kształt rysowany co klatkę jest
   * płatny co klatkę, nawet gdy się nie zmienia.
   */
  targetMarker: {
    /**
     * ⭐ **PIERŚCIEŃ POD STOPAMI, nie wokół ciała** (2026-10-04, zgłoszenie
     * z gry: „okrąg wokół ciała dziwnie wygląda"). Elipsa na GRUNCIE w tym
     * samym miejscu co cień stworzenia 3D (`Creature3D`: dół ciała Arcade),
     * szeroka na jego ślad + `groundPad`, spłaszczona `groundRatio` jak cień,
     * w warstwie gruntu (pod istotami). Do tej daty: koło o promieniu 22 px
     * na ŚRODKU duszka, nad istotą — opasywało tułów niedźwiedzia i nogi
     * królika naraz, a z modelami 3D celowało w powietrze.
     * Tekstury piecze się per rozmiar (`Assets.targetMarkerKey`).
     */
    groundRatio: 0.38,
    /** O ile pierścień wystaje poza cień stworzenia (px, na stronę). */
    groundPad: 5,
    /** Najmniejsza połowa szerokości (px) — królik nie może dostać kropki. */
    groundMinHalf: 15,
    /** Promień pierwszej, domyślnej tekstury (bootowej). */
    radius: 22,
    /** Grubość obrysu (px). */
    thickness: 3,
    color: 0xff5555,
    /** Alfa ustawiana na obrazku, nie zapiekana w teksturę — żeby dało się ją
     *  stroić bez regeneracji. */
    alpha: 0.9,
    /**
     * ── TRZY STANY PIERŚCIENIA (2026-09-11) ────────────────────────────────
     *
     * ⚠⚠ **Powód: do tej daty pierścień miał JEDEN wygląd, a walka trzy różne
     * stany** — „dosięgam", „za daleko", „w zasięgu, ale za plecami". Gracz
     * dowiadywał się o dwóch ostatnich **wyłącznie tekstem, po naciśnięciu
     * przycisku i z dławikiem 900 ms** (`attackRefusalMsgMs`), czyli już po
     * podjęciu decyzji. Trzy komunikaty zastępowały jeden stan, którego nie było.
     *
     * ⚠ **Nośnikiem jest BARWA + ALFA istniejącego kółka, nie nowy kształt.**
     * Drugi kształt wokół postaci czyta się w tej grze jako obszar działania
     * (zmierzone dwukrotnie przy Szarży — `ABILITY_AIM.preview`), a każdy nowy
     * `Graphics` rysowany co klatkę jest płatny co klatkę (to jest cały powód,
     * dla którego ten pierścień jest upieczoną teksturą). Stan nie dokłada ani
     * jednego obiektu.
     *
     * ⚠ **Tekstura jest pieczona BIAŁA** (`Assets.makeTargetMarkerTexture`),
     * więc `tint` jest tu barwą dosłowną, nie przymnożeniem do czerwieni.
     *
     * ⚠ **`ready.tint` MUSI być równy `color`** — inaczej dzisiejszy wygląd
     * przestaje być dzisiejszym wyglądem. To jest ta sama barwa, na którą
     * powołuje się język podglądu (czerwień = „twój aktywny cel").
     */
    states: {
      /** Cios wyjdzie: w zasięgu broni i w przedniej półkuli. */
      ready: { tint: 0xff5555, alpha: 0.9 },
      /**
       * Za daleko. **Przygaszenie, nie druga barwa** — „nie dosięgam" jest
       * stanem ILOŚCIOWYM i zniknięcie siły pierścienia mówi to wprost, a przy
       * okazji nie konkuruje z czerwienią aktywnego celu.
       */
      outOfReach: { tint: 0xff5555, alpha: 0.34 },
      /**
       * ⭐ **Za BLISKO — martwa strefa broni** (`melee.minReach`, 2026-09-16).
       *
       * ⚠⚠ **Osobny stan, bo to jest INNA instrukcja dla gracza.** Do tej daty
       * cel w zwarciu z piką dostawał `outOfReach`, czyli komunikat „podejdź
       * bliżej” w sytuacji, w której trzeba **odejść**. Przygaszony pierścień
       * mówi „nie dosięgam” i przy broni z dolną granicą kłamał o kierunku.
       *
       * ⚠ **Bursztyn, nie błękit i nie czerwień.** Błękit należy do „za
       * plecami” (naprawiasz obrotem), czerwień do aktywnego celu. Bursztyn
       * jest w tej grze barwą „działa, ale coś jest nie tak” (obramowanie
       * zużytego sprzętu) — a cel w zwarciu jest dokładnie taki: masz go,
       * tylko nie tą bronią z tej odległości.
       *
       * ⚠ **Pełna alfa jak `behind`, nie przygaszona jak `outOfReach`** — bo
       * jak `behind` jest to stan ODWRACALNY jednym ruchem, więc ma wołać
       * o ten ruch, a nie wyglądać jak brak celu.
       *
       * ⚠ Dokłada się do długu `OI-72` (barwa jako jedyny nośnik) — czwarty
       * stan pierścienia i czwarta barwa. Świadomie, bo alternatywą jest
       * komunikat kłamiący o kierunku.
       */
      tooClose: { tint: 0xddaa33, alpha: 0.85 },
      /**
       * W zasięgu, ale za plecami. **Jedyny stan z INNĄ barwą i to jest
       * celowe**: jest odwracalny jednym ruchem kciuka, więc ma wołać o ten
       * ruch, a nie wyglądać jak brak celu. Błękit jest tą samą rodziną, którą
       * gra już używa na „nie może działać" (tint ogłuszenia `0x9fb8ff`).
       */
      behind: { tint: 0x9fb8ff, alpha: 0.85 },
    },
  },
  /** Duration of the red flash (ms). */
  hitFlashMs: 120,
  /**
   * How long a knocked-back enemy's velocity is left alone (ms).
   *
   * **Without this, knockback magnitude barely matters.** Enemy AI writes
   * velocity every frame (`moveToObject` and friends), so an impulse set in
   * `takeDamage` survives about one frame. Measured with the old global 160
   * px/s: an enemy was displaced **31px while chasing, 43px while passive** —
   * against a 66px melee reach, i.e. it never once pushed anything out of
   * range. It was a visual nudge dressed up as a spacing tool.
   *
   * So knockback now owns the body for a fixed window, exactly like the boar's
   * charge and the Szary's backstep own theirs. 380 px/s × 180ms ≈ 68px, which
   * is finally enough to matter — and it is why blunt weapons are the ONLY
   * ones with any: on a fast weapon, knockback works against its owner (you
   * spend the fight chasing what you just shoved), and every weapon having
   * "some" is how the categories ended up meaning nothing.
   */
  knockbackDurationMs: 180,
  /**
   * **Odczyt OGŁUSZENIA — dwa kanały, oba placeholderowe (2026-08-26).**
   *
   * ⚠ **To NIE jest system statusów i nie ma nim zostać w tym kroku.** Jeden
   * efekt kontroli, dwa nośniki: tint stanu (bo każdy telegraf w tej grze jest
   * tintem) i znacznik nad głową (bo tint sam w sobie nie mówi, CO się stało —
   * dzik telegrafujący szarżę też jest kolorowy).
   *
   * ⚠ **Dwa kanały, nie jeden, i to jest wymuszone przez roster**: cztery
   * stworzenia zapalają tint jako zapowiedź ataku, więc gracz musi umieć
   * odróżnić „zaraz uderzy" od „nie może uderzyć". Sam tint tego nie zrobi.
   *
   * ⚠ **Znacznik jest tekstem ŚWIATA**, więc jedzie przez `worldTextStyle` —
   * ma być klockowaty jak kafle, nie wygładzony jak HUD (`src/ui/CLAUDE.md`).
   *
   * Gdy powstanie prawdziwy system statusów, **to miejsce znika**, a ogłuszenie
   * dostaje wpis w tamtej tabeli. Do tego czasu jest tu, obok pozostałych
   * pokręteł feedbacku walki, a nie w osobnym pliku „na przyszłość".
   */
  stun: {
    /** Tint stanu. Zimny i wyraźnie inny od czerwieni telegrafów. */
    tint: 0x9fb8ff,
    /** Placeholder do czasu grafiki — glif, nie ikona. */
    glyph: "✷",
    color: "#cfe0ff",
  },
  /**
   * **Rząd znaczników stanu nad głową stworzenia** — geometria wspólna dla
   * wszystkiego, co się tam pokazuje.
   *
   * ⚠ **Powstało 2026-09-04, przy dokładaniu Krwawienia, i `offsetY` PRZYSZŁO
   * TUTAJ Z BLOKU `stun`.** Powodem jest jedna konkretna rzecz, nie porządki:
   * ogłuszenie i Krwawienie **występują naraz** (Uderzenie tarczą i Rozcięcie
   * nie wykluczają się niczym), a dwa znaczniki liczone z tego samego
   * `stun.offsetY` stałyby **dokładnie na sobie**. Odstęp między znacznikami
   * należy do RZĘDU, nie do żadnego pojedynczego stanu.
   *
   * ⚠ **`iconPx` istnieje, bo ikony umiejętności są 32 × 32** (`Assets.ts`,
   * `makeAbilityIcons`) — przycisk na pasku ma tyle mieć, a znacznik nad
   * królikiem o tej wielkości zasłania samego królika.
   */
  statusMarks: {
    /** Ile pikseli NAD paskiem HP stoi rząd. */
    offsetY: 12,
    /** Bok ikony teksturowej w rzędzie. */
    iconPx: 14,
    /** Odstęp między sąsiednimi znacznikami. */
    gapPx: 3,
  },
  /**
   * **Faza 5A — feedback trafienia w trzech ciężarach.**
   *
   * ⚠ **Tier bierze się z `Stamina.impactTier`, nie z osobnej skali.** Tamten
   * liczy się z `hitCost(mitigated)`, czyli z tego, co gracz NAPRAWDĘ dostał —
   * po pancerzu i tarczy — i **już dziś jest nośny**: `heavy` kasuje
   * `pendingSwing`. Druga skala „ciężkości" rozjechałaby się z pierwszą przy
   * pierwszym strojeniu staminy.
   *
   * ⚠ **`light` i `medium` NIE TRZĘSĄ KAMERĄ — to jest zmiana odczucia.**
   * Do 2026-08-23 trzęsło każde trafienie, więc seria draśnięć od królika dawała
   * ten sam sygnał co szarża dzika i kanał tracił znaczenie. Start jest
   * **celowo konserwatywny**: trzęsie wyłącznie `heavy`, czyli dokładnie te
   * ciosy, które i tak mają konsekwencję mechaniczną. `medium` może dostać
   * własne, słabsze trzęsienie w 5B — po playteście, nie przed.
   */
  tiers: {
    /**
     * ⚠ **`flashMs` i `popScale` były do 2026-08-23 MARTWE** — `flashHit`
     * czytał stały `hitFlashMs` i stały skok 1,12 dla wszystkiego. Skutek:
     * draśnięcie od królika i cios niedźwiedzia różniły się WYŁĄCZNIE
     * dźwiękiem, bo trzęsienie i tak ma tylko `heavy`. Teraz ciężar ciosu
     * mówią trzy kanały naraz (czas błysku, skok skali, dźwięk), a przy
     * `heavy` czwarty (kamera).
     *
     * ⚠ **`popScale` jest ROZCIĄGNIĘCIEM, nie przesunięciem.** Sprite puchnie
     * i wraca w miejscu; `CombatBody` nie drgnie. To jest granica tej rundy —
     * prawdziwy recoil to `GameplayEffect` na 5B.
     *
     * Tier bierze się z `Stamina.impactTier`, czyli z tego, co gracz NAPRAWDĘ
     * dostał (po pancerzu i tarczy). Drugiej skali ciężkości nie ma i nie ma
     * jej powstać.
     */
    light: { flashMs: 90, popScale: 1.05, sfx: "hurt" as const, sfxDetune: 60, shakeMs: 0, shakeIntensity: 0 },
    medium: { flashMs: 130, popScale: 1.12, sfx: "hurt" as const, sfxDetune: 0, shakeMs: 0, shakeIntensity: 0 },
    heavy: { flashMs: 190, popScale: 1.22, sfx: "impact" as const, sfxDetune: -80, shakeMs: 160, shakeIntensity: 0.008 },
  },
  /**
   * **Faza 5B — szarpnięcie ciała przy trafieniu.**
   *
   * ⚠ **To jest `GameplayEffect`, nie prezentacja, i to jest cała różnica
   * wobec `popScale`.** Skok skali rozciąga sprite'a w miejscu; recoil rusza
   * PRAWDZIWE CIAŁO — `Body.preUpdate` woła `updateFromGameObject()`, więc
   * hitbox jedzie razem z obrazkiem. To warunek postawiony wprost przez
   * autora: grafika ma potwierdzać mechanikę, a nie udawać ruch, którego
   * w symulacji nie ma. Przesunięcie samego sprite'a było odrzucone.
   *
   * ── ⚠ Dlaczego to NIE jest drugi `knockback` ──────────────────────────────
   * Komentarz przy `knockbackDurationMs` mówi wprost, dlaczego odrzut ma
   * WYŁĄCZNIE obuch: *„na szybkiej broni odrzut działa przeciw właścicielowi
   * (spędzasz walkę goniąc to, co przed chwilą odepchnąłeś), a to, że każda
   * broń miała »trochę«, jest powodem, dla którego kategorie przestały
   * cokolwiek znaczyć."* Powszechny recoil wprost łamałby tę decyzję —
   * gdyby był jednokierunkowy.
   *
   * **Nie jest.** Recoil **wychodzi i WRACA**, więc przesunięcie netto wynosi
   * dokładnie zero i nie tworzy dystansu. Odrzut jest narzędziem odstępu
   * (380 px/s × 180 ms ≈ 68 px, w jedną stronę); recoil jest sygnałem masy
   * (3–8 px, tam i z powrotem). Dwa różne pojęcia, dwa różne typy, i nie wolno
   * ich zlać.
   *
   * ⚠ **Gdy odrzut się odpala, recoil celu jest POMIJANY** — ciało należy wtedy
   * do odrzutu, a nakładanie obu dałoby powrót do punktu, z którego odrzut
   * właśnie zabrał cel.
   *
   * ⚠ **Tier bierze się z `Stamina.impactTier`** — jedna skala ciężaru w całej
   * grze, tak jak przy `tiers` wyżej. **Ma to znaną wadę i jest ona zapisana,
   * nie zamieciona:** progi (`STAMINA.heavyHit`) kalibrowano pod obrażenia
   * PRZYJMOWANE przez gracza, więc `light` to ≤9, `medium` 10–20, `heavy` ≥21.
   * Postać na 1. poziomie bije za 3–5, czyli **wszystkie jej ciosy w rosterze
   * są `light`**. Dlatego `light` nie może być „prawie zero" — to jest wartość,
   * którą nowy gracz zobaczy jako jedyną. Druga skala, liczona z ułamka HP
   * celu, jest ZAKAZANA (patrz `tiers`).
   */
  recoil: {
    /**
     * Szarpnięcie CELU wzdłuż ciosu. Wychodzi i wraca — netto zero.
     *
     * ⚠ **Test strojenia (2026-08-25): px podniesione ~50%, `ms` CELOWO
     * nietknięte.** Pytanie w tej iteracji brzmi wyłącznie „czy sama reakcja
     * na trafienie wystarczy, żeby walka czytała się bardziej fizycznie" —
     * zostawienie czasu bez zmian trzyma dotychczasowe proporcje między
     * tierami (każdy nadal ~1,5× poprzedniego) i nie dodaje drugiej
     * zmiennej do oceny w tym samym przebiegu. Jeśli to wejdzie na stałe,
     * `ms` zostaje następnym, osobnym pytaniem.
     */
    target: {
      light: { px: 6, ms: 55 },
      medium: { px: 9, ms: 65 },
      heavy: { px: 14, ms: 80 },
    },
    /**
     * Kopnięcie NAPASTNIKA w tył ciosu — „trafiłem w coś twardego".
     *
     * ⚠ Celowo mniejsze od szarpnięcia celu i celowo zerowe przy `light`:
     * przy gracza własnym ciele każdy piksel czyta się mocniej niż na
     * przeciwniku po drugiej stronie ekranu, a draśnięcie nie ma prawa ruszać
     * postacią, którą się steruje.
     */
    attacker: {
      light: { px: 0, ms: 0 },
      medium: { px: 2, ms: 55 },
      heavy: { px: 4, ms: 70 },
    },
  },
  /**
   * **Wypad — gest ataku, nie reakcja na trafienie** (`CombatAction.
   * attackerLunge`).
   *
   * ⚠ **Powstał, bo atak przeciwnika był NIEWIDOCZNY.** Żaden stwór w tej grze
   * nie ma klatek animacji ataku (nagłówek `Enemy.ts`), więc kęs królika to
   * dziś zmiana tintu przez 380 ms i liczba obrażeń — stworzenie nie robi
   * ŻADNEGO gestu. Wypad daje ciosowi ciało, nie dokładając grafiki.
   *
   * ⚠ **Bez tieru, i to jest decyzja.** Wypad gra także przy PUDLE, gdzie
   * obrażenia wynoszą zero — a tier liczy się właśnie z obrażeń
   * (`Stamina.impactTier`). Skalowanie go czyniłoby chybiony cios najsłabszym
   * gestem w grze, czyli odwrotnie do jego roli. Ta sama decyzja, co przy
   * błysku wroga w `cuesFor` (tam też tier świadomie odpada).
   *
   * ⚠ **Asymetryczny: szybko w przód, wolniej z powrotem.** Symetryczny czyta
   * się jak drgnięcie; ten czyta się jak cios i osiadanie po nim.
   *
   * Jedna wartość dla całego rosteru — jeśli okaże się, że niedźwiedź
   * potrzebuje więcej niż królik, to jest strojenie **per akcja**, a nie
   * mnożnik po skali sprite'a (ten byłby regułą ukrytą przed czytającym).
   */
  lunge: { px: 7, outMs: 70, backMs: 90 },
  /**
   * **Świst — sygnał, że atak ZOSTAŁ WYKONANY i CHYBIŁ.**
   *
   * ⚠ Powstaje, bo pudło przeciwnika **nie istniało wcale**: wszystkie pięć
   * atakujących gatunków kończyło chybiony cios cichym `return`. To sytuacja
   * stworzona przez Combat v2 — wcześniej wrogowie nie mogli spudłować, bo
   * overlap albo zachodził, albo nie. Bez tego sygnału „uskoczyłem" i „on nie
   * zaatakował" wyglądają i brzmią IDENTYCZNIE, czyli cała kontrgra zbudowana
   * w tej przebudowie jest dla gracza niewidoczna.
   *
   * ⚠ Dźwięk to **istniejący `swing`**, nie nowy plik. Znaczy dokładnie to samo
   * („coś się zamachnęło i nie trafiło”), a dokładanie wpisu do `SOUNDS` niesie
   * własne ryzyko: `rng` generatora jest wspólny i wstawka w środku po cichu
   * zmienia każdy plik poniżej. Osobny świst — kandydat na 5B.
   */
  whiff: {
    sfx: "swing" as const,
    /**
     * ⚠ **Rozstrojenie w dół — bo to ten sam plik, co WŁASNY zamach gracza.**
     * Bez tego „ja się zamachnąłem" i „on się zamachnął i chybił" brzmią
     * identycznie, a te dwa zdarzenia padają w walce sekundę po sobie. Trzy
     * półtony niżej i ciszej czyta się jako coś cudzego i cięższego, bez
     * dokładania pliku do `SOUNDS` (patrz komentarz wyżej o `rng`).
     */
    sfxDetune: -300,
    sfxVolumeMul: 0.78,
    /**
     * ⚠ Własny kubełek przepustnicy, inaczej cios wroga chybiony w ciągu 40 ms
     * od zamachu gracza przepada bez śladu — patrz `Sfx.PlayOptions`.
     */
    sfxThrottleKey: "whiff",
    ms: 150,
    /** Długość śladu (px) wzdłuż kierunku ciosu. */
    lengthPx: 26,
    color: 0xdfe6ee,
    alpha: 0.42,
  },
  /**
   * Small HP bar that appears over an enemy once you have actually hit it.
   *
   * Hidden until first blood on purpose: a field full of permanent bars reads
   * as a spreadsheet, and an untouched enemy is always at full health anyway.
   * Without it a boar (95 HP) is unreadable — you cannot tell whether it dies
   * to the next swing or the fifth, which is exactly the decision Unik and
   * Okrzyk bojowy exist to serve.
   */
  enemyHpBar: {
    width: 30,
    height: 4,
    /** Gap above the sprite's un-breathed top edge (px). */
    offsetY: 7,
    /** Fades out this long after the last hit taken (ms). */
    visibleMs: 2600,
    /**
     * Named foes (EnemyConfig.elite — currently only the Szary) get a wider bar
     * with their name over it, and it does NOT retire itself mid-fight: a boss
     * bar that fades out while you are still circling the boss reads as the
     * fight having ended. Ordinary creatures keep the fade, which is what stops
     * a field of enemies from looking like a spreadsheet.
     */
    eliteWidth: 54,
    eliteHeight: 6,
    eliteOffsetY: 11,
    /** Gap between the bar and the name above it (px). */
    eliteLabelGap: 7,
  },
  /**
   * Hit-stop: a few frames of frozen physics on a crit. The cheapest "meat" in
   * the genre — the pause is what makes a big hit feel like it had weight.
   *
   * **`minGapMs` is load-bearing, not polish.** Crit chance reaches 60% and a
   * dagger build swings ~3×/s, so an ungated hit-stop would freeze the game
   * something like 12% of the time and read as stuttering, not impact. Same
   * idea as AUDIO.minRetriggerMs: the effect has to be rarer than the event
   * that triggers it.
   *
   * Only physics is paused, deliberately — tweens keep running so the damage
   * numbers, swing arc and hit flash still animate through the freeze. Pausing
   * everything looks like a dropped frame instead of a punch.
   */
  critHitStop: {
    ms: 55,
    minGapMs: 420,
    shakeMs: 110,
    shakeIntensity: 0.006,
  },
  /**
   * Red edge vignette when HP gets low.
   *
   * The HP bar is 200px in the top-left corner of a phone screen while the
   * player is looking at their thumb and the enemy — dying arrives as a
   * surprise. That matters more here than in most games because death has a
   * real price (half HP on revive plus 10% of carried gold), and a penalty you
   * could not see coming reads as unfair rather than as tension.
   */
  lowHealth: {
    /** Appears at or below this fraction of max HP. Matches the HP bar turning
     *  red (0.25) closely enough that the two feel like one signal. */
    threshold: 0.3,
    /** Alpha at 0 HP; it scales down to nothing as HP climbs to the threshold. */
    maxAlpha: 0.5,
    /** Heartbeat period (ms). Slow — a fast strobe is nausea, not tension. */
    pulseMs: 820,
    /** How much of the alpha the pulse swings (fraction of current alpha). */
    pulseDepth: 0.35,
  },
  /**
   * **Język liczby obrażeń: ikona typu + kolor skuteczności + glif.**
   * Pełna analiza i pomiary: `docs/systemy/presentation.md`
   *
   * Model: `[ikona typu][glif] -13!` — ikona mówi CZYM uderzyłeś, kolor i glif
   * JAK ten typ radzi sobie z ochroną celu, liczba ILE weszło, `!` krytyk.
   *
   * ⚠ **Dlaczego to w ogóle powstało (pomiar, nie przeczucie).** Sama liczba
   * NIE JEST w stanie nauczyć gracza zależności typ↔pancerz. Zmierzone: miecz
   * przeciw dzikowi pokazuje **9–12 przy cięciu i 10–13 przy pchnięciu** —
   * zakresy nakładają się na trzech z czterech wartości, mimo że pchnięcie
   * jest realnie lepsze o 12,6%. Symulacja 20 000 powtórzeń: gracz
   * porównujący średnie z pięciu zamachów każdym wariantem wyciąga **wniosek
   * ODWROTNY do prawdy w 35% przypadków**, i nawet po pięćdziesięciu w 10,4%.
   * ⚠ Winowajcą są KRYTYKI: bez nich ten sam błąd przy n=20 wynosi 1,2%,
   * z nimi 22,3% — a szansa sięga sufitu `maxCritChance` (60%), więc kanał
   * psułby się tym bardziej, im lepszy sprzęt gracz nosi.
   * ⚠ **Pomiar nietknięty, przyczyna doprecyzowana 2026-09-05.** Zdanie
   * mówiło wcześniej „`critChancePerAgility` podnosi szansę do 60%, więc kanał
   * psułby się tym bardziej, im dalej gracz rozwija postać". Tego pola nie ma —
   * krytyk nie zależy dziś od żadnego atrybutu (`docs/atrybuty.md` §11.4),
   * a do sufitu dowozi sprzęt i broń. **Wniosek zostaje w mocy**, zmienił się
   * wyłącznie wektor narastania problemu.
   *
   * Stąd drugi kanał, który jest DETERMINISTYCZNY: skuteczność jest funkcją
   * pary (typ × materiał ochrony), więc nie zależy od rzutu ani od krytyka.
   */
  typeFeedback: {
    /**
     * Próg „ten typ się prześlizguje" na mnożniku z `ARMOR_PROFILE`.
     *
     * ⚠ To JEDYNY arbitralny próg w tym systemie i leży w **największej luce**
     * w danych: wszystkie wartości tabeli to 0,35 · 0,40 · 0,45 ‖ 0,80 · 1,00 ‖
     * 1,10 · 1,15 · 1,20 · 1,40. Między 0,45 a 0,80 nie ma nic, więc 0,7 nie
     * stoi na niczyjej wartości — ta sama dyscyplina, co przy progu `czysty` w
     * katalogu kafli pola. Dokładając materiał z mnożnikiem 0,65–0,75 trzeba
     * ten próg przejrzeć na nowo.
     *
     * Górnego progu NIE MA w tej stałej celowo: „grzęźnie" zaczyna się powyżej
     * **1,0**, a to jest zero definicyjne („pancerz liczy się w całości"), nie
     * liczba do strojenia.
     */
    slipsBelow: 0.7,
    /**
     * Minimum punktów obrony celu, żeby pokazać cokolwiek poza neutralnym.
     *
     * ⚠ Mnożnik mówi o RELACJI, ale przy 3 punktach pancerza nawet 0,45
     * przesuwa wynik o pół punktu — sygnał byłby prawdziwy i bezużyteczny.
     * Policzone: żeby różnica sięgnęła ≥1 punktu wyświetlanych obrażeń na
     * typowym ciosie 15, cel potrzebuje ≥8 punktów. 10 to ta liczba z zapasem
     * (dzik ma 22).
     */
    minArmorPoints: 10,
    /**
     * Odstęp między kolejnymi liczbami z JEDNEGO zamachu (ms).
     *
     * ⚠ Siekiera trafia 5 na 5 celów jednym cięciem, a jej łuk 100° przy
     * zasięgu 70 px zbiera je w skupisku ~140 px; Wir ostrzy rozstrzyga się
     * przeciw wszystkiemu w zasięgu w jednej klatce. Etykieta z ikoną ma ~50 px
     * na ekranie przy `setZoom(2)`, więc pięć naraz na 140 px to stos. Rozrzut
     * 45 ms × 5 celów = 180 ms, mieści się z zapasem w 620 ms życia popupu, a
     * oko czyta serię zamiast kupy.
     *
     * Ta sama zasada, co `AUDIO.minRetriggerMs` i `critHitStop.minGapMs`:
     * **efekt musi być rzadszy niż zdarzenie, które go wywołuje.**
     */
    aoeStaggerMs: 45,
    /**
     * Glify skuteczności — REDUNDANTNY zapis tego, co niesie kolor, nie osobna
     * informacja.
     *
     * ⚠ Nie usuwać jako duplikatu. Informacja zapisana wyłącznie w barwie jest
     * niedostępna dla ok. 8% mężczyzn (zaburzenia widzenia barw
     * czerwono-zielonych), a przy grze robionej jako produkt dla szerokiej
     * publiczności to jest ta jedna informacja, której część graczy nie
     * zobaczy i nie będzie wiedziała, że czegoś nie widzi. Redundancja, która
     * w analizie informacyjnej jest wadą, w dostępności jest wymogiem.
     *
     * Konsekwencja: kolor i glif MUSZĄ pochodzić z jednego wywołania
     * `effectiveness()` — nigdy z dwóch osobnych obliczeń, nigdy jedno bez
     * drugiego.
     */
    glyph: { przechodzi: "↑", neutralnie: "", grzeznie: "↓" },
  },
} as const;

/**
 * Asset-slicing configuration.
 *
 * `cols`/`rows` describe the grid layout of each spritesheet. Frame pixel size
 * is derived from the actual loaded texture (see file header).
 */
export const ASSETS = {
  /**
   * SURFACES — what you walk on: grass, dirt, sand, stone, water plus the
   * blob-47 transition sets. Always fully opaque.
   *
   * Split from Nature.png deliberately (see `public/assets/README.md`): one
   * blob-47 set is 47 tiles and the terrain will keep growing, so if it shared
   * a sheet with the props every terrain addition would renumber the trees and
   * silently break every map. Same 32px tiles on a 33px pitch, 19 columns.
   *
   * Used only through Tiled — never sliced by hand here, apart from
   * MapBuilder's fallback tiles.
   */
  teren: {
    key: "teren",
    path: "assets/Teren.png",
    tile: 32,
  },
  /** OBJECTS — what stands on the ground: trees, bushes, grass tufts. Always
   *  carries transparency. Same grid as Teren.png. */
  nature: {
    key: "nature",
    path: "assets/Nature.png",
    /** Tile size Nature.png is drawn on (best guess: 32×32). */
    tile: 32,
  },
  /**
   * FOREST TREES — the accepted hand-cut tree stamps, assembled by
   * `tools/build_forrest_atlas.py` (layout + old→new remap in
   * `docs/forrest_atlas.json`).
   *
   * ⚠ Unlike Teren/Nature this sheet has **no 1px gap**: tile 32, `spacing` 0,
   * `margin` 0, pitch 32 (author's call for this pass). The `.tmj` `<tileset>`
   * that binds it (name "Forrest", firstgid 530) must declare `spacing:0` to
   * match, or Phaser slices it one pixel off per column.
   */
  forrest: {
    key: "forrest",
    path: "assets/forrest.png",
    tile: 32,
  },
  /**
   * FOREST TREE STAMPS — editor-facing repack of `forrest.png` where each of the
   * 31 tree variants fills one 96×96 grid cell, bottom-aligned. Built losslessly
   * by `tools/build_tree_stamps.py` (pixels identical to `forrest.png`).
   *
   * In Tiled the designer adds this as a tileset and stamps a tree as a single
   * TILE OBJECT on the `trees` object layer — full image visible, free overlap,
   * drag to move. In-game `src/world/TreeLayer.ts` renders straight from this
   * sheet (one sprite pair per tree: trunk slice + canopy slice, each Y-sorted).
   * Bound by name "TreeStamps" in TiledMap's TILESET_TEXTURES. See
   * `docs/tree_instances.md`.
   */
  treeStamps: {
    key: "tree-stamps",
    path: "assets/tree_stamps.png",
    tile: 96,
  },
  /**
   * TREE STAMPS BIG — osobny arkusz stempli 160×160 dla wariantów, które nie
   * mieszczą się w komórce 96 (wierzba duża). Ładowany OBOK `treeStamps`;
   * `TreeLayer` obsługuje oba tilesety po nazwie. Istniejące 1633 drzewa go
   * nie dotykają — mają gid-y z zakresu `TreeStamps`. Generowany razem z
   * `tree_stamps.png` przez `tools/build_tree_stamps.py`.
   */
  treeStampsBig: {
    key: "tree-stamps-big",
    path: "assets/tree_stamps_big.png",
    tile: 160,
  },
  /**
   * FOREST GROUND — the 6 Teren grass variants (local 0–5) recoloured to sit
   * under the new tree stamps. Built by `tools/build_forest_ground.py --wariant
   * FINAL`: pure 5-colour value swap, kępka pixel layout byte-identical to
   * Teren. Strip of 6 tiles, `spacing` 0 / `margin` 0 / pitch 32 — the `.tmj`
   * `<tileset>` binding it (name "ForestGround", firstgid 720) must match.
   * Only the forest map's `ground` layer uses it; Teren dirt/stone stay on Teren.
   */
  forestGround: {
    key: "forest-ground",
    path: "assets/forest_ground_final.png",
    tile: 32,
  },
  /**
   * FOREST TRANSITIONS — water/sand/path edge tiles copied 1:1 from Teren.png
   * with the baked-in old grass punched to alpha 0, so the `ground` layer's
   * forest grass shows through the transition. Built by
   * `tools/build_terrain_forest_transitions.py`: pure per-pixel alpha (grass
   * ramp colour → 0), zero recolour. local ids match Teren; the `.tmj`
   * `<tileset>` binding it (name "ForestTransitions", firstgid 726) carries the
   * same `solid` property on the 18 water tiles. Only forrest.tmj uses it —
   * Teren.png and the other two maps are untouched.
   */
  forestTransitions: {
    key: "forest-transitions",
    path: "assets/terrain_forest_transitions.png",
    tile: 32,
  },
  character: {
    key: "character",
    path: "assets/characters/Character.png",
    /**
     * Character.png (256×256) verified layout. Frames are NOT a clean 32-grid:
     * measured content sits on a ~31×60 pitch (the sheet has small separators
     * between frames). We therefore slice by explicit pixel starts.
     *
     * 5 frames per row (perCol), 4 rows. Rows map to facing directions.
     * Per row: col 0 = idle/standing, cols 0–3 = walk cycle, col 4 = ATTACK
     * pose (arm/sword extended — NOT part of the walk).
     */
    perCol: 5,
    colStarts: [0, 31, 62, 93, 124],
    rowStarts: [2, 63, 124, 185],
    frameWidth: 31,
    frameHeight: 60,
    dirRows: { down: 0, up: 1, left: 2, right: 3 },
    idleCol: 0,
    /** Inclusive column range used for the walk animation (excludes attack). */
    walkFromCol: 0,
    walkToCol: 3,
    /** The attack pose column. */
    attackCol: 4,
    walkFps: 9,
    /** Empty px below the feet inside each 60px frame (feet sit ~y57). */
    feetPadding: 3,
    /**
     * The small standalone icon at col 5/row 0 is the player's sword (not a
     * frame overlay in the sheet itself). We extract it once and attach it as
     * a child sprite, shown + rotated to face the attack direction only while
     * the attack pose plays. Measured bbox in Character.png.
     */
    swordKey: "sword",
    sword: { x: 157, y: 33, w: 11, h: 27 },
    /**
     * Where the weapon hand actually is in each ATTACK frame, as an offset from
     * the sprite's centre in pixels. Measured off the sheet, not guessed — see
     * public/assets/README.md for the method and the per-frame numbers.
     *
     * All four are the character's RIGHT hand: screen-left when facing the
     * camera (down), screen-right when facing away (up). `up` is an overhead
     * pose — the hand is raised above the head, not at the hip.
     *
     * Getting this wrong is very visible: the sword first hung off the sprite's
     * centre (i.e. the character's crotch), and then, once anchored, off the
     * wrong hand entirely for `up`.
     */
    handOffsets: {
      down: { x: -8, y: 11 },
      up: { x: 8, y: -25 },
      left: { x: -11, y: -1 },
      right: { x: 11, y: -1 },
    },
  },
  rabbit: {
    key: "rabbit",
    path: "assets/animals/rabbit.png",
    /**
     * rabbit.png (96×72, generated by tools/build_rabbit.py — see
     * public/assets/README.md) is a real directional sheet: front/back idle
     * plus a 4-frame hop cycle in profile, reused mirrored (setFlipX) for
     * left vs right instead of drawing both sides. Frame index = row * cols +
     * col, same convention as ASSETS.character.
     *
     * Row 0: [idleDownFrame][idleUpFrame][unused][unused]
     * Row 1 (walkRow): 4-frame walk cycle, profile, facing right.
     * Row 2 (runRow):  4-frame run cycle, profile, facing right.
     */
    frameWidth: 24,
    frameHeight: 24,
    cols: 4,
    rows: 3,
    idleDownFrame: 0,
    idleUpFrame: 1,
    walkRow: 1,
    runRow: 2,
    /** Inclusive column range for both the walk and run cycles. */
    cycleFromCol: 0,
    cycleToCol: 3,
    walkFps: 6,
    runFps: 10,
  },
  boar: {
    key: "boar",
    path: "assets/animals/boar.png",
    /**
     * boar.png (112×84, generated by tools/build_rabbit.py's sibling
     * tools/build_dzik.py — see public/assets/README.md) — same grid shape as
     * ASSETS.rabbit (idle down/up + walk/run cycles in profile, mirrored via
     * setFlipX), just a bigger frame and a heavier gait. The boar is the
     * second enemy with a real directional sheet instead of a single
     * generated portrait.
     */
    frameWidth: 28,
    frameHeight: 28,
    cols: 4,
    rows: 3,
    idleDownFrame: 0,
    idleUpFrame: 1,
    walkRow: 1,
    runRow: 2,
    cycleFromCol: 0,
    cycleToCol: 3,
    walkFps: 5,
    runFps: 8,
  },
  wolf: {
    key: "wolf",
    path: "assets/animals/wolf.png",
    /**
     * wolf.png (112×672, generated by tools/build_wilk.py — see
     * public/assets/README.md) is the richest sheet in the game: 4
     * INDEPENDENTLY drawn directions (not 3+mirror like rabbit/boar — the
     * left/right pair is generated as a baked mirror image inside the
     * Python script instead, same as Character.png's own left/right rows)
     * × 6 states, so it doesn't fit the walkRow/runRow shape rabbit/boar
     * use. Frame index = row * cols + col; row = states[X].row + dirRow,
     * dirRow using the SAME 4-direction order as ASSETS.character.dirRows.
     *
     * Wired only into the base pack `Wolf` — the Szary (GreyWolf) keeps his
     * own separate procedural placeholder (`ASSETS.greyWolf`) on purpose:
     * he's deliberately NOT the wolf texture at a bigger scale (see the
     * comment on ASSETS.greyWolf), and has no directional sheet of his own
     * yet. `Wolf`'s animation hooks gate on `this.kind === "wolf"` so
     * GreyWolf (which inherits from Wolf) never tries to play a wolf-prefixed
     * anim against its own, incompatible single-frame texture.
     */
    frameWidth: 28,
    frameHeight: 28,
    cols: 4,
    rows: 24,
    dirRow: { down: 0, up: 1, left: 2, right: 3 },
    states: {
      idle: { row: 0, frames: 1, fps: 1, loop: true },
      walk: { row: 4, frames: 4, fps: 7, loop: true },
      growl: { row: 8, frames: 2, fps: 5, loop: false },
      bite: { row: 12, frames: 3, fps: 11, loop: false },
      hurt: { row: 16, frames: 1, fps: 1, loop: false },
      death: { row: 20, frames: 4, fps: 6, loop: false },
    },
  },
  greyWolf: {
    key: "greywolf",
    path: "assets/animals/greywolf.png",
    /**
     * The Szary. greywolf.png (128×768, generated by tools/build_szary.py —
     * the sibling of tools/build_wilk.py, see public/assets/README.md) is
     * his OWN sheet, not wolf.png reused at a bigger scale: paler fur, a
     * heavy dark brow bar, a scar across the muzzle, brighter eyes — drawn
     * from the same shape language as the ordinary wolf but a different
     * creature, because two scales of one sprite read as perspective, not as
     * two different animals. Same 6-state × 4-direction shape as
     * ASSETS.wolf, just a bigger frame (32px vs 28px) — at the SAME
     * GREY_WOLF.scale=2.4 that's ~77px on screen vs the pack wolf's ~50px.
     */
    frameWidth: 32,
    frameHeight: 32,
    cols: 4,
    rows: 24,
    dirRow: { down: 0, up: 1, left: 2, right: 3 },
    states: {
      idle: { row: 0, frames: 1, fps: 1, loop: true },
      walk: { row: 4, frames: 4, fps: 7, loop: true },
      growl: { row: 8, frames: 2, fps: 5, loop: false },
      bite: { row: 12, frames: 3, fps: 11, loop: false },
      hurt: { row: 16, frames: 1, fps: 1, loop: false },
      death: { row: 20, frames: 4, fps: 6, loop: false },
    },
  },
  /**
   * Forest bear (added 2026-08-14) — real external art, but a THIRD sheet
   * shape again: `bear_idle/walk/run.png` are three SEPARATE single-row
   * strips, one profile direction only (facing LEFT, mirrored via flipX for
   * right — the same trick `rabbit.png`/`boar.png` already use, just with
   * no separate idle-up/idle-down poses at all: this pack drew one facing
   * and nothing else). Not `ASSETS.chicken`'s shape (multiple real
   * directions via `dirRow`) and not `ASSETS.wolf`'s (states as row-offsets
   * on one texture) — three textures, one direction, `cols` frames each.
   *
   * Measured (alpha-scan): all three are a clean 64px-wide grid with real
   * content in every cell — `bear_idle.png` 768px → **12** frames,
   * `bear_walk.png` 512px → **8**, `bear_run.png` 320px → **5**. Frame
   * height 33px; real creature content inside each cell is ~55-57×29px, not
   * padded much.
   *
   * `Animations.ts`'s `createSingleDirAnimations` builds this shape (and
   * `ASSETS.deer`/`.fox`'s, below) — one function shared by all three
   * single-direction species, the same way `createFarmAnimalAnimations`
   * serves the four-direction ones.
   */
  bear: {
    idleKey: "bear-idle",
    idlePath: "assets/animals/bear_idle.png",
    idleFrames: 12,
    walkKey: "bear-walk",
    walkPath: "assets/animals/bear_walk.png",
    walkFrames: 8,
    runKey: "bear-run",
    runPath: "assets/animals/bear_run.png",
    runFrames: 5,
    frameWidth: 64,
    frameHeight: 33,
    idleFps: 6,
    walkFps: 8,
    runFps: 10,
  },
  /**
   * Forest deer — 2D fallback sheet of the `Deer` enemy (`DEER`; until
   * 2026-10-04 an ambient `Critter`). The 3D model is `MODELE_3D.deer`.
   * Same single-direction/three-texture shape as `ASSETS.bear`, measured
   * the same way: `deer_idle.png` 720px → **10** frames (its "idle" is
   * really a slow head-down/up graze, not a static stand), `deer_walk.png`
   * 576px → **8**, `deer_run.png` 432px → **6**, all on a clean 72px-wide
   * grid (bigger than the bear's — antlers need the headroom; frame height
   * 52px). `runKey` sat loaded and sliced but UNUSED from 2026-08-14 to
   * 2026-08-27 — `Critter` had no state that ever needed it. Faza 1 fauny
   * (`docs/fauna_faza1.md`) wires it into the flee bolt; see `DEER.flight`.
   */
  deer: {
    idleKey: "deer-idle",
    idlePath: "assets/animals/deer_idle.png",
    idleFrames: 10,
    walkKey: "deer-walk",
    walkPath: "assets/animals/deer_walk.png",
    walkFrames: 8,
    runKey: "deer-run",
    runPath: "assets/animals/deer_run.png",
    runFrames: 6,
    frameWidth: 72,
    frameHeight: 52,
    idleFps: 5,
    walkFps: 7,
    runFps: 10,
  },
  /** Forest fox — 2D fallback sheet of the `Fox` enemy (until 2026-10-04 an
   *  ambient `Critter`), same shape as `ASSETS.deer`. Measured:
   *  `fox_idle.png` 384px → **6** frames, `fox_walk.png` 512px → **8**,
   *  `fox_run.png` 384px → **6**, all on a clean 64px-wide grid (frame
   *  height 36px). `runKey` drives the fox's flight bolts (`Fox.ts`). */
  fox: {
    idleKey: "fox-idle",
    idlePath: "assets/animals/fox_idle.png",
    idleFrames: 6,
    walkKey: "fox-walk",
    walkPath: "assets/animals/fox_walk.png",
    walkFrames: 8,
    runKey: "fox-run",
    runPath: "assets/animals/fox_run.png",
    runFrames: 6,
    frameWidth: 64,
    frameHeight: 36,
    idleFps: 5,
    walkFps: 8,
    runFps: 10,
  },
  chicken: {
    /**
     * chicken_walk.png + chicken_eat.png (128×128 each, public/assets/) — real
     * external sprites, graduated out of public/assets/tem/ (see
     * docs/referencje_zewnetrzne.md) after the same rank of pixel measurement
     * rabbit.png/boar.png got, not "looks fine, so extract it": an alpha-channel
     * scan confirmed a clean 32×32 grid with ZERO gap (unlike Nature.png's 33px
     * pitch — items.png's convention, not Nature's) and that all 16 cells in
     * BOTH sheets carry real opaque content.
     *
     * 4 rows × 4 columns, frame index = row * cols + col (same convention as
     * every other sliced sheet). Row = facing, same order as
     * ASSETS.character.dirRows: down/left/up/right — confirmed by eye on an
     * upscaled render, not assumed from the wolf-sheet convention (chicken_walk
     * is DOWN, LEFT, UP, RIGHT top to bottom; both left AND right are drawn
     * independently, not a runtime mirror — a bonus this sheet didn't have to
     * offer). Column = the 4-frame walk cycle (chicken_walk.png) or the
     * 4-frame peck cycle (chicken_eat.png).
     *
     * Two separate files rather than two row-bands of one sheet (wolf.png's
     * shape) — a state is a texture key here, not a row offset, so Chicken.ts
     * plays `chicken-walk-<dir>` / `chicken-eat-<dir>` against two different
     * textures instead of one.
     */
    walkKey: "chicken-walk",
    walkPath: "assets/animals/chicken_walk.png",
    eatKey: "chicken-eat",
    eatPath: "assets/animals/chicken_eat.png",
    /**
     * `chicken_shadow.png` (32×128, added 2026-08-14) — a static drop shadow
     * per direction, ONE column × 4 rows on the exact same 32×32 cell size
     * as the walk/eat sheets. Measured per-row bbox is nearly identical
     * across all 4 rows (19×7px, only a few px of vertical drift) — a
     * chicken is small enough that its shadow barely changes shape with
     * facing, unlike the cow's (see `ASSETS.cow`). Composited over a walk
     * frame at the SAME frame-local coordinates: the shadow's bottom edge
     * lines up with the sprite's own feet, confirmed visually before wiring
     * (same check as `ASSETS.cow.shadowKey` below, which shows it clearly).
     * Optional — `FarmAnimal` skips drawing a shadow if this key never got
     * sliced (same "missing file just degrades" story as everywhere else).
     */
    shadowKey: "chicken-shadow",
    shadowPath: "assets/animals/chicken_shadow.png",
    frameWidth: 32,
    frameHeight: 32,
    cols: 4,
    rows: 4,
    dirRow: { down: 0, left: 1, up: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /**
   * Cow/pig/sheep (added 2026-08-14, same session as `ASSETS.chicken`
   * above) — three more real external walk/eat(=graze) sheets, same
   * two-texture-per-species shape, same measurement rigor: alpha-channel
   * scan confirmed a clean 128×128 grid with ZERO gap on all three pairs
   * (`cow_walk/eat.png`, `pig_walk/eat.png`, `sheep_walk/eat.png`, all
   * 512×512, all 16 cells of all 6 sheets real content).
   *
   * ⚠ **The row order is NOT the same as `ASSETS.chicken`'s, and that had
   * to be checked, not assumed.** Confirmed by eye on an upscaled render
   * (cropping row0 vs row2 side by side settled it — row0 shows the
   * animal's REAR with no face, row2 shows its FACE): these three sheets
   * are **UP, LEFT, DOWN, RIGHT** top to bottom, while `chicken_walk.png`
   * is DOWN, LEFT, UP, RIGHT. Different source pack, different convention —
   * `dirRow` exists precisely so a wrong assumption here costs one wrong
   * field, not a silently-swapped up/down facing in play.
   *
   * `Animations.ts`'s `createFarmAnimalAnimations`/`farmAnimalAnim` and
   * `src/entities/FarmAnimal.ts` are shared by all four species (chicken
   * included) — the four sheets are structurally identical (2 states × 4
   * real directions, two separate textures, no runtime mirroring), and the
   * behaviour (wander near spawn, or stop and graze/peck) has zero
   * species-specific logic. Only the numbers differ, in `CHICKEN`/`COW`/
   * `PIG`/`SHEEP` below.
   */
  cow: {
    walkKey: "cow-walk",
    walkPath: "assets/animals/cow_walk.png",
    eatKey: "cow-eat",
    eatPath: "assets/animals/cow_eat.png",
    /**
     * `cow_shadow.png` (128×512) — ONE column × 4 rows at the same 128×128
     * cell size as the walk/eat sheets, and here the per-row shape genuinely
     * changes with facing: measured bbox is a compact ~25×36px blob for
     * up/down (rows 0/2) vs a wide ~58×8px ellipse for left/right (rows
     * 1/3) — an actual oval shadow foreshortened by viewing angle, not a
     * generic blob copy-pasted 4×. Verified by compositing a walk frame
     * over its matching shadow frame at IDENTICAL frame-local coordinates
     * (no offset): the shadow's bottom edge lands exactly under the
     * sprite's feet for every direction, which is what lets `FarmAnimal`
     * draw both at the same (x, y) with no per-species fudge factor.
     */
    shadowKey: "cow-shadow",
    shadowPath: "assets/animals/cow_shadow.png",
    frameWidth: 128,
    frameHeight: 128,
    cols: 4,
    rows: 4,
    dirRow: { up: 0, left: 1, down: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /** No pig_shadow.png was provided — `FarmAnimal` simply draws no shadow
   *  under the pig (see the `shadowKey` note on `ASSETS.chicken`/`.cow`;
   *  shadows exist for exactly two of the four species, not by omission but
   *  because that's what was supplied). */
  pig: {
    walkKey: "pig-walk",
    walkPath: "assets/animals/pig_walk.png",
    eatKey: "pig-eat",
    eatPath: "assets/animals/pig_eat.png",
    frameWidth: 128,
    frameHeight: 128,
    cols: 4,
    rows: 4,
    dirRow: { up: 0, left: 1, down: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /** No sheep_shadow.png either — same as `ASSETS.pig` above. */
  sheep: {
    walkKey: "sheep-walk",
    walkPath: "assets/animals/sheep_walk.png",
    eatKey: "sheep-eat",
    eatPath: "assets/animals/sheep_eat.png",
    frameWidth: 128,
    frameHeight: 128,
    cols: 4,
    rows: 4,
    dirRow: { up: 0, left: 1, down: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /**
   * Village strays (added 2026-08-14) — 4 colour variants, each its OWN
   * walk-cycle sheet (`cat_black/brown/orange/white-32x48.png`, all
   * measured at a clean 3×4 grid, ZERO gap, all 12 cells of all 4 sheets
   * real content). One `FarmAnimal` spawn picks a random colour at
   * instantiation (see `FarmAnimal.pickCatVariant`), so two cats standing
   * near each other don't read as clones.
   *
   * ⚠ **A THIRD direction-row convention on top of chicken's and
   * cow/pig/sheep's, confirmed the same way (row0-vs-row2 crop, ear-tip
   * x-position on row1-vs-row3) rather than assumed from either.** row0 =
   * rear (no face), row2 = face — same UP/DOWN placement as the cow family
   * — but row1's ear-tips sit at the RIGHT of the frame (x20/24 of 32) and
   * row3's at the LEFT (x7/11): **row1 = RIGHT, row3 = LEFT**, the mirror
   * image of every other species here. `dirRow` exists precisely so this
   * kind of source-pack quirk costs one field, not a swapped facing.
   *
   * **No `eatKey` — this pack only exported a walk cycle**, unlike the
   * other three species (each of which HAS a matching `*_eat.png`). A
   * resting cat therefore just stops and holds a still frame rather than
   * playing a second animation; `FarmAnimalAssetCfg.eatKey` is optional
   * specifically for this case (see `FarmAnimal.decide()`).
   *
   * `cat.png` (512×256) is a multi-colour CONTACT SHEET bundling all four
   * colours side by side for preview, plus one "lying down" pose per colour
   * that the individual per-colour exports do NOT carry — reference only,
   * never loaded. `cat_white-32x32.png` (a smaller 32×32-frame white
   * variant) is likewise an unused duplicate: `cat_white-32x48.png` already
   * matches the other three colours' frame size, so the odd one out would
   * only buy a size mismatch.
   */
  cat: {
    colors: {
      black: { walkKey: "cat-black-walk", walkPath: "assets/animals/cat_black-32x48.png" },
      brown: { walkKey: "cat-brown-walk", walkPath: "assets/animals/cat_brown-32x48.png" },
      orange: { walkKey: "cat-orange-walk", walkPath: "assets/animals/cat_orange-32x48.png" },
      white: { walkKey: "cat-white-walk", walkPath: "assets/animals/cat_white-32x48.png" },
    },
    frameWidth: 32,
    frameHeight: 48,
    cols: 3,
    rows: 4,
    dirRow: { up: 0, right: 1, down: 2, left: 3 },
    walkFps: 5,
  },
  /**
   * ⭐ Psy (2026-10-11) — **WŁASNEGO ARKUSZA NIE MAJĄ.** Gra rysuje je modelem
   * 3D (`MODELE_3D.dog`/`.sheepdog`); 2D to ścieżka awaryjna (`?widok2d`,
   * model się nie wczytał) i bierze chód WILKA z `wolf.png`: pasmo `walk`
   * zaczyna się w wierszu 4, więc wiersz kierunku = 4 + `ASSETS.wolf.dirRow`.
   * Bez `eatKey` — postój trzyma klatkę, jak kot.
   */
  dog: {
    walkKey: "wolf",
    cols: 4,
    dirRow: { down: 4, up: 5, left: 6, right: 7 },
    walkFps: 7,
  },
  /**
   * The obora's bull (added 2026-08-14 alongside the ram — see `ASSETS.ram`
   * below). `bull.png` (512×1024) is a genuinely different bundling from
   * `ASSETS.cow`: ONE texture, 8 rows × 4 columns, not two 512×512 files.
   * Measured (alpha-scan, every one of 32 cells real content): rows 0-3 are
   * a walk cycle at the EXACT same per-row bbox shape as `cow_walk.png`
   * (confirming the same UP/LEFT/DOWN/RIGHT `dirRow`), rows 4-7 are a
   * grazing cycle — same head-lowers-then-rises progression as `cow_eat.png`
   * — stacked directly underneath. `Animations.ts`'s `createBullAnimations`
   * reads state as a ROW OFFSET (0 for walk, 4 for eat) the way
   * `createWolfLikeAnimations` already does for wolf.png/greywolf.png, not
   * as a second texture key the way the other four farm-animal species do —
   * this shape is closer to wolf's than to chicken's.
   */
  bull: {
    key: "bull",
    path: "assets/animals/bull.png",
    frameWidth: 128,
    frameHeight: 128,
    cols: 4,
    rows: 8,
    dirRow: { up: 0, left: 1, down: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /**
   * The flock's ram. `ram_walk.png`/`ram_eat.png` are exactly `ASSETS.sheep`'s
   * shape — two separate 512×512 files, same UP/LEFT/DOWN/RIGHT `dirRow`,
   * confirmed the same way (alpha-scan + row0-vs-row2 crop) rather than
   * assumed from the sheep it stands beside. Distinguished from a ewe by its
   * curled golden horns, drawn into the sprite itself (not a colour tint).
   */
  ram: {
    walkKey: "ram-walk",
    walkPath: "assets/animals/ram_walk.png",
    eatKey: "ram-eat",
    eatPath: "assets/animals/ram_eat.png",
    frameWidth: 128,
    frameHeight: 128,
    cols: 4,
    rows: 4,
    dirRow: { up: 0, left: 1, down: 2, right: 3 },
    walkFps: 6,
    eatFps: 4,
  },
  /**
   * Forest birds (added 2026-08-14, placed in the forest per the author's
   * own request — "noi birds do lasu"). `birds.png` (64×64) is a clean 2×2
   * grid of 32×32 cells, but unlike every other creature sheet here each
   * cell is a DISTINCT still bird (different species/colours, different
   * poses — measured bboxes don't line up the way a walk cycle's do), not
   * frames of one animation. See `BIRD` in GameConfig and `src/entities/
   * Bird.ts`: no walk/eat state, no `dirRow`, no animations built at all —
   * a bird just IS one of these 4 frames, chosen once at spawn.
   */
  birds: {
    key: "birds",
    path: "assets/animals/birds.png",
    frameWidth: 32,
    frameHeight: 32,
    cols: 2,
    rows: 2,
  },
  spider: {
    /** No spider.png either — generated (makeSpiderPlaceholder). */
    faceKey: "spider-face",
    face: { w: 28, h: 22 },
  },
  portalMarker: {
    /** Generated, never a file — see PORTAL.marker for why this is drawn
     *  rather than painted, and `makePortalMarkerTexture` for the shape. */
    textureKey: "portal-marker",
  },
  targetMarker: {
    /** Generated, never a file — see COMBAT_FEEDBACK.targetMarker for why the
     *  ring is baked instead of stroked live, and `makeTargetMarkerTexture`
     *  for the shape. */
    textureKey: "target-marker",
  },
  /** The training dummy's neutral "you're close" ring — same baked-not-stroked
   *  reasoning as `targetMarker` above, but its OWN texture so it can never be
   *  the same pixels as the active-target ring. See TRAINING_DUMMY.hint.ring. */
  trainingDummyHint: {
    textureKey: "training-dummy-hint-ring",
  },
  venomSpider: {
    /** Także generowany (makeVenomSpiderPlaceholder). Mniejszy i jaśniejszy od
     *  sieciarza, z jadowicie zielonym odwłokiem — dwa pająki muszą się różnić
     *  w sylwetce i w kolorze, bo przy 28 px nic innego nie zostaje. */
    faceKey: "venom-spider-face",
    face: { w: 24, h: 18 },
  },
  web: {
    /** The spit projectile, also generated. */
    textureKey: "web-shot",
    size: { w: 14, h: 14 },
  },
  /**
   * Ikonki typu obrażeń, stojące przy liczbie: miecz (cięte), włócznia (kłute),
   * młot (obuchowe).
   *
   * ⚠ **To MUSZĄ być generowane tekstury, a nie emoji w tekście, i to jest
   * jedyny powód, dla którego ten wpis istnieje.** `theme.ts` używa
   * `fontFamily: "monospace"` — czcionki systemowej — więc `🗡🔱🔨` renderują
   * się z fontu ZASTĘPCZEGO systemu. Skutki są trzy i każdy dyskwalifikujący:
   * pełnokolorowy, zaokrąglony glif (na Androidzie Noto Color Emoji) wklejony
   * w środek pixel-artu; **inny wygląd na każdej platformie**, więc nie da się
   * tego zaprojektować; i złamana szerokość znaku, a szerokość jest potrzebna
   * do policzenia układu przy AoE.
   *
   * Rysowane ciemnym obrysem najpierw, jasnym kształtem na wierzchu — kontur
   * jest tym, co utrzymuje czytelność takiej sylwetki na trawie i na ciemnym
   * sprite'cie wroga.
   *
   * ⚠ **14 px, a nie 12, i to jest wynik renderu, nie preferencja.** Przy 12 px
   * obrys (1 px z każdej strony) zostawia ~8×8 na rysunek, na czym trzy
   * sylwetki przestają być rozróżnialne: jelec miecza zlewał się z ostrzem,
   * grot włóczni czytał się jak ta sama plamka co czubek miecza, a głowica
   * młota wychodziła poza kadr i była ucięta. Przy 14 px z 2 px marginesu
   * wszystkie trzy mieszczą się w całości i czytają się osobno. Liczba obok ma
   * 11 px, więc ikona jest odrobinę wyższa — dla ikony to jest normalne.
   */
  damageTypeIcons: {
    /** Klucz tekstury to `${prefix}${damageType}` — patrz `damageIconKey`. */
    keyPrefix: "dmgtype-",
    size: 14,
    /** Stal ostrza/głowicy, drewno trzonka, kontur. Z palety świata. */
    metal: 0xd6dae2,
    wood: 0x8a6a3f,
    outline: 0x14161f,
  },
  vignette: {
    /**
     * Low-health screen vignette — a canvas radial gradient built at boot
     * (makeVignetteTexture), not an asset. Square, and stretched to whatever
     * the screen is: a vignette distorting with the aspect ratio is exactly
     * what a vignette should do.
     */
    textureKey: "vignette",
    size: 256,
    /** Where the gradient starts and ends, as fractions of half the size. The
     *  clear middle has to be generous or the effect covers the play area. */
    innerStop: 0.55,
    color: "255,40,40",
  },
  campfire: {
    /**
     * **Real art now** (33×33, spit frame + hanging pot + logs), palette-snapped
     * to `docs/paleta.json` by `tools/snap_paleta.py` — 370 source colours down
     * to 15, none of them off-palette.
     *
     * It is loaded as its own FILE, and that is the whole point of the history
     * here. It used to be cut from Nature.png at pixel (132,198), and the sheet
     * rebuild sprang the trap that comment was written about: the new Nature.png
     * carries only tufts, bushes and trees, so that coordinate became a slice of
     * a tree crown. The extraction kept working — the campfire just quietly
     * turned into a green smudge. **A tile pick into a regenerated sheet is a
     * coordinate with no owner**; a standalone PNG cannot drift like that.
     *
     * `makeCampfirePlaceholder` survives as the fallback for a missing file, so
     * the "always boots" guarantee is unchanged — delete the PNG and the fire is
     * a generated blob again rather than an error.
     */
    key: "campfire",
    path: "assets/props/ognisko_paleta.png",
    /** Only used by the placeholder generator now — the real file brings its
     *  own dimensions. */
    size: { w: 32, h: 32 },
  },
  /**
   * A small overhead "sells goods" pouch icon — generated, no source art.
   * Shown above any NPC whose `stock` is non-empty, alongside (not instead
   * of) the WoW-style quest/skill "!"/"?"/"+" marker (`core/NpcStatus.ts`) —
   * the two answer different questions ("can I buy here" vs "do I have
   * unfinished business here") and a merchant with a quest needs both at
   * once.
   */
  merchantBadge: {
    textureKey: "merchant-badge",
    size: { w: 14, h: 14 },
  },
  npc: {
    key: "npc",
    path: "assets/characters/NPC.png",
    /**
     * NPC.png (256×256) shares Character.png's exact pitch (confirmed by the
     * same alpha-scan method — identical row/col boundaries), but the merchant
     * stands still, so we only ever need ONE pose. We extract just the
     * idle-down frame (row 0, col 0) rather than slicing the whole sheet.
     */
    portraitKey: "npc-portrait",
    portrait: { x: 0, y: 2, w: 31, h: 60 },
  },
  /**
   * The Kowal's own portrait — `tools/build_kowal.py` crops the character
   * off `blacksmith.png` (a dedicated Gemini generation, already in a
   * low-fidelity game-sprite style — see `docs/prompty_gemini.md` for the
   * prompt) and recolors it to the project palette, the same crop+recolor
   * treatment already used for the equipment yard's furniture
   * (`tools/build_kuznia.py`), not a from-scratch redraw. Already cropped
   * with real alpha. Unlike `npc` above there is no sheet to slice: the
   * file IS the one idle-down pose, loaded and used directly.
   */
  kowal: {
    key: "kowal-portrait",
    path: "assets/characters/kowal_portrait.png",
  },
  /**
   * The Hunter's own portrait — same crop+recolor treatment as `kowal`
   * above, from `tools/build_hunter.py`. Already cropped with real alpha,
   * no sheet to slice.
   */
  hunter: {
    key: "hunter-portrait",
    path: "assets/characters/hunter_portrait.png",
  },
  /**
   * The Kowal's real idle loop — 10 south-facing frames (breathing, a hand
   * sway, small cloth settling), generated one Gemini call at a time and
   * assembled by `tools/build_kowal_idle.py` (see `docs/prompty_gemini.md`
   * for the per-frame prompt template and the drift/noise fights that came
   * with it). A plain horizontal strip, not a directional grid like
   * ASSETS.rabbit — he only ever faces south — but shares the same
   * `{frameWidth,frameHeight,cols,rows}` shape so `sliceCreatureSheet()`
   * needs no special case for it. Same "missing file just degrades" story
   * as `kowal` above: `Merchant` falls back to the static portrait, then to
   * the shared NPC.png placeholder, if this or its anim failed to load.
   */
  kowalIdle: {
    key: "kowal-idle",
    path: "assets/characters/kowal_idle.png",
    frameWidth: 46,
    frameHeight: 87,
    cols: 10,
    rows: 1,
  },
  /**
   * The village well — a static landmark prop for the plaza, not an NPC or
   * interactable. Composited (not hand-drawn) from the loose pieces cut by
   * `tools/build_studnia.py` out of the Gemini reference sheet
   * (`studnia.png`): the stone ring, the wooden gantry beam (its own two
   * legs baked in), and the bucket, stacked and glued in a one-off Python
   * pass — see `docs/prompty_gemini.md`. Deliberately no rope/winch (not
   * extracted yet) and no roof (dropped on request: "olejmy dach, belka
   * wystarczy"). Same "missing file just degrades" story as `kowal` above —
   * no placeholder generator, GameScene simply skips spawning it.
   */
  /**
   * **Two wells, and they are two different objects, not two versions of one.**
   *
   * `well` is the 64×64 landmark that stands at the plaza's centre —
   * two tiles across, which is what makes it read as a focal point.
   * `wellSmall` is a 32×32 one-tile prop, palette-snapped by
   * `tools/snap_paleta.py` (456 source colours → 11, all from
   * `docs/paleta.json`, deliberately the same kamień/drewno/neutralne ramps
   * measured off the big one so the two sit in the same tonal family).
   *
   * The village uses the big one. The small one is wired and loaded but no map
   * places it yet — that is a placement decision, not missing work: which map
   * gets a one-tile well is a layout question, and the art is ready for
   * whenever it's answered. Dropping one in is a `studnia_mala` point object
   * in Tiled and nothing else.
   *
   * **Neither is a scaled copy of the other, on purpose.** Rendering the 32px
   * art at 2× would put 2×2 pixel blocks in a world where every other sprite
   * sits on a 1px grid, and that reads as a mistake from the first glance —
   * a landmark well has to be *drawn* at 64, not blown up to it.
   *
   * ⚠ **`well` was replaced 2026-08-14** — `studnia_zlozona.png` (built by
   * `tools/build_studnia.py`, a bare stone ring with a crank) is superseded
   * by `studnia-gpt_paleta.png`: an AI-generated well WITH a thatched roof,
   * which fits "the whole village is thatched" (see the `Buildings.png`
   * notes above) better than the old roofless one ever did. Same
   * measure-first treatment as every other AI-sourced prop this session:
   * source `studnia-gpt.png` (62×66, 87 anti-aliased colours) went through
   * `tools/snap_paleta.py` first (→ `akcent_cieply` for the gold/orange
   * thatch, `drewno`+`kora` for the posts and beam, `kamien` for the stone
   * ring, `neutralne`'s dark/mid end for the shadow under the eave and the
   * contour — measured, not guessed: the shadow tones read as desaturated
   * grey-blue, not the saturated purple `akcent_chlodny` would have given
   * them). Kept at its native size — same "drawn at scale, not blown up to
   * it" rule as the paragraph above, so it was NOT resized to a clean 64×64.
   * `studnia_zlozona.png` stays on disk, unreferenced, same as `pig.png`.
   */
  well: {
    key: "well",
    path: "assets/props/studnia-gpt_paleta.png",
  },
  wellSmall: {
    key: "well-small",
    path: "assets/props/studnia_mala.png",
  },
  /**
   * The training dummy by Patryczek's yard — see `TRAINING_DUMMY` for the
   * gameplay side. A finished 55×82 prop, same "no generator, no placeholder,
   * missing file just means it doesn't get spawned" story as `well`/the
   * water wheel above — loaded as a plain image, no sheet to slice.
   */
  trainingDummy: {
    key: "training-dummy",
    path: "assets/props/training-dummy.png",
  },
  /**
   * The mill's water wheel — `kolo_mlynskie.png`, 192×96, TWO views packed
   * side by side and sliced into named frames (`tools/build_kolo_z_grafiki.py`
   * brings the source into `docs/paleta.json`; the drawing itself is untouched
   * art, not generated geometry — see `public/assets/README.md`):
   *
   *   "lico" — 128×96 at x=0,   the wheel face-on, what actually turns
   *   "bok"  — 64×96  at x=128, the same wheel edge-on with its axle stub,
   *            for a wheel mounted flat against the mill's side wall
   *
   * ⚠ **The face frame is 128 wide for a 99px wheel and that is deliberate.**
   * The art measures 99×96, i.e. three pixels wider than three tiles. Cropping
   * to 96 would clip the tips of two paddle boxes, and scaling pixel art is
   * forbidden outright (`docs/ART_DIRECTION.md` §4.1) — so it sits centred on
   * a 4×3 tile canvas with transparent margins instead. That also puts the hub
   * within half a pixel of the frame centre (63.5, 48), which is what lets the
   * sprite spin about its own origin without wobbling.
   */
  waterwheel: {
    key: "waterwheel",
    path: "assets/props/kolo_mlynskie.png",
    frames: {
      lico: { x: 0, y: 0, w: 128, h: 96 },
      bok: { x: 128, y: 0, w: 64, h: 96 },
    },
  },
  /**
   * Suszona skóra — a hide stretched to dry on a branch frame, standing by
   * the Hunter's cabin (he's the one skinning boars/wolves/rabbits — see
   * Skills.skinning). Pure decoration, same "finished composite, no sheet to
   * slice" story as `well`/`campfire`: a single 64×64 static image (2×2
   * tiles — the largest footprint asked for), not a spritesheet.
   *
   * Source art was AI-generated (ChatGPT) at 123×123 with 52 anti-aliased
   * colours — exactly the "doesn't sit next to the rest of the village"
   * problem `tools/snap_paleta.py`'s header describes. Run through it first
   * (`suszona-skora_paleta.png`, snapped to `akcent_cieply` for the
   * dark-red-to-warm-gold hide, `drewno`/`kora` for the branch frame, dark
   * `neutralne` for the contour — see the CELE entry for the measured
   * colours), THEN cropped to content and downscaled to 64×64
   * (`suszona_skora.png`, the file actually loaded here) — snapping before
   * resizing so the final pixels are exact palette colours, not a
   * downscale's blend of them.
   */
  driedHide: {
    key: "dried-hide",
    path: "assets/props/suszona_skora.png",
  },
  /**
   * The round haycock (added 2026-08-14) that REPLACES the old `stog_0..3`
   * modular-kit tiles (`Buildings.png`, `docs/budynki.json`) at Dobek's
   * yard — the only place that 2×2 prop was ever placed (`village-zagaje.tmj`,
   * tile 28-29/49-50). The old tiles stay IN `Buildings.png` (removing a
   * tile from a shared sheet risks renumbering everything after it, the
   * same danger CLAUDE.md already documents for adding one) — only the
   * PLACEMENT changed, from four wall-kit tiles to one standalone image, the
   * same "finished composite, no sheet to slice" story as `well`/`campfire`/
   * `driedHide`.
   *
   * `stog-siana.png` (the original round-haycock prop, already committed
   * from an earlier session) went through `tools/snap_paleta.py` first
   * (→ `stog_siana_paleta.png`, its own CELE entry) and was NOT, at the
   * time, meant to replace the kit's `stog_*` — its own header said so
   * explicitly. That decision changed: `stog_siana.png` (this key) is
   * `stog_siana_paleta.png` resized (aspect-preserved, `Image.NEAREST`) to
   * fit the 64×64 footprint the old 2×2 tile placement occupied — 64×56,
   * not a distorted 64×64 square.
   */
  haystack: {
    key: "haystack",
    path: "assets/props/stog_siana.png",
  },
  /**
   * The scarecrow (added 2026-08-14), standing in Zagaje's rye niwa
   * (`wioska_plan.md` §4.5's south field). Same "finished composite, no
   * sheet to slice" story as the drying rack/haystack above. Source
   * `strach.png` was AI-generated (ChatGPT, 57×67, 78 anti-aliased colours)
   * and went through `tools/snap_paleta.py` first: measured colours are
   * gold straw (`akcent_cieply`), tan burlap sack (`piasek`), the wooden
   * cross (`drewno`+`kora`), dark red-brown contour (`neutralne`). Kept at
   * its native size, same "drawn at scale" rule as `well` above.
   */
  scarecrow: {
    key: "scarecrow",
    path: "assets/props/strach_paleta.png",
  },
  /**
   * Kłody bartne (ule), trzy warianty (2026-08-18) — jak `driedHide`/
   * `haystack`/`scarecrow` powyżej: materiał od ChatGPT (`ul00.png`/
   * `ul01.png`/`ul02.png`, potwierdzone przez autora), przepuszczony przez
   * `tools/snap_paleta.py` (rampy `kora`+`drewno`+`ziemia`+`akcent_cieply`+
   * `akcent_zlocisty`+`neutralne` — sprawdzone przed zapisem, że żadna
   * rampa nie wyszła z zerem trafień) na `props/ul0N_paleta.png`. Trzy
   * osobne DECOR_PROPS (nie jedna z losowym wariantem jak `pickCatVariant`)
   * celowo — sadzenie w Tiled ma być deterministyczne, nie losowane przy
   * każdym starcie gry.
   */
  beehiveA: { key: "beehive-a", path: "assets/props/ul00_paleta.png" },
  beehiveB: { key: "beehive-b", path: "assets/props/ul01_paleta.png" },
  beehiveC: { key: "beehive-c", path: "assets/props/ul02_paleta.png" },
  /** Tyczka chmielu (chmielnik przy karczmie, 2026-10-09) — obrazek wyłącznie dla
   *  ścieżki awaryjnej 2D; w 3D stoi model `chmiel` z `tools/props3d.py`. */
  hopPole: { key: "hop-pole", path: "assets/props/hop_pole.png" },
  /**
   * Ramka lalki ekwipunku (paper doll) w zakładce "Plecak" — jedyny asset
   * czysto interfejsowy, stąd własny katalog `ui/`. Generowana przez
   * `tools/build_slots.py` z ręcznej referencji autora (`sloty.png`), która
   * miała 9 kafli ułożonych w krzyż; docelowy układ to pełny prostokąt 3×4.
   *
   * ⚠ **To JEDEN obrazek, nie arkusz do pocięcia**, i to jest decyzja, nie
   * skrót. Linie kraty są WSPÓLNE dla sąsiadujących kafli (jedna kolumna
   * pikseli rozdziela dwa kafle), więc pocięcie na 12 osobnych tekstur albo
   * zdublowałoby każdą linię, albo zostawiło szew. Panel kładzie ten obrazek
   * raz i nakłada na niego 12 własnych prostokątów — one niosą trafienia
   * wskaźnikiem, obramowanie jakości i podświetlenie celu.
   *
   * ⚠ **Alfa wynosi 217, nie 255** — arkusz jest z założenia półprzezroczysty
   * i ma leżeć na tle panelu (`UI.bg`). Nie "naprawiać" tego do pełnej
   * nieprzezroczystości: przezroczystość jest tym, co wtapia lalkę w panel
   * zamiast robić z niej naklejkę.
   *
   * Geometria zmierzona na pliku, nie zgadnięta (skan alfy + profil jasności):
   * podziałka 33 px, wnętrze kafla **32×32 — dokładnie tyle, ile ma ikona
   * przedmiotu z `items.png`**, więc ikona wchodzi w kafel 1:1 bez skalowania.
   */
  equipDoll: {
    key: "equip-doll",
    path: "assets/ui/slots.png",
    /** Rozmiar całego obrazka — zmierzony, nie wyliczany z podziałki: panel
     *  rezerwuje na lalkę miejsce także wtedy, gdy pliku NIE MA. */
    width: 107,
    height: 140,
    /** Odstęp między lewymi krawędziami sąsiednich kafli. */
    pitch: 33,
    /** Lewy górny piksel WNĘTRZA pierwszego kafla (za linią kraty). */
    origin: 4,
    /** Bok wnętrza kafla. */
    cell: 32,
    cols: 3,
    rows: 4,
  },
  /**
   * ── GLIFY SLOTÓW — arkusz 8×2 po 32 px (`tools/build_slot_glyphs.py`) ────
   *
   * ⚠ **To jest NASTĘPCA `equipDoll`, nie dodatek do niego.** Tamten obrazek
   * był całą lalką naraz: krata 3×4 z wygrawerowanymi glifami, czyli UKŁAD
   * zapieczony w piksele. Liczba slotów, ich rozmiar i kolejność były
   * własnością pliku PNG — więc każdy nowy slot wymagał przemalowania grafiki,
   * a żaden układ nie mógł się zmienić z rozmiarem okna.
   *
   * Tu jest odwrotnie: jeden glif = jedna klatka, tło rysuje panel, a układ
   * jest DANYMI w `src/ui/EquipLayout.ts`. Maska jest BIAŁA i tintowana
   * w silniku, żeby ten sam arkusz obsłużył kafel pusty (przygaszony),
   * zajęty i podświetlony.
   *
   * ⚠ **Indeks klatki jest ADRESEM czytanym przez `EQUIP_SLOT_DEF.glyph`**
   * (`src/core/Equipment.ts`). Kolejność stoi jawnie w `ORDER` w generatorze
   * i nie wolno jej przestawić bez przejrzenia tamtej tablicy — przesunięcie
   * o jeden nie wywala niczego, tylko po cichu daje pasowi glif nogawic.
   *
   * ⚠ `equipDoll` ZOSTAJE wczytywany i zostaje w repo: to jedyne źródło,
   * z którego te glify są wycinane, a `tools/build_slot_glyphs.py` czyta go
   * przy każdym przebiegu.
   */
  slotGlyphs: {
    key: "slot-glyphs",
    path: "assets/ui/slot_glyphs.png",
    cell: 32,
    cols: 8,
    rows: 2,
    /** Ile klatek arkusz naprawdę niesie — reszta kraty jest pusta. */
    count: 13,
  },
  /**
   * Prawdziwa ikona umiejętności `cleave` (Szerokie cięcie) — jedyna dziś
   * niebędąca proceduralnym rysunkiem z `makeAbilityIcons`. Gotowe 32×32,
   * ze źródła `public/assets/szerokie-ciecie.png` (zostaje w korzeniu jako
   * materiał wyższej rozdzielczości — ta sama konwencja co
   * `iconBag1..4`/`bag-1..4.png`).
   *
   * ⚠ **BEZ medalionu.** Źródło ma własny okrągły medalion (ciemna tarcza +
   * niebieska obwódka) — `AbilityBar` już rysuje okrągły przycisk, więc
   * wklejenie cudzego koła dawało „koło w kole". Przygotowanie deterministycznie
   * ODRZUCA tarczę i obwódkę (klasyfikacja koloru: piksele źródła, w których
   * `B - R > 15`, to wyłącznie odcienie granatu/niebieskiego medalionu —
   * zmierzone na pełnej palecie, próg nie łapie żadnego koloru miecza/ognia),
   * zostawia WYŁĄCZNIE miecz + łuk cięcia + iskry, kadruje ciasno do ich bboxa
   * (37×37, już kwadratowy) i skaluje nearest-neighbour do 28×28 wyśrodkowane
   * na przezroczystym 32×32 (2 px marginesu, żeby nic nie stykało się z
   * krawędzią tekstury). Zero dorysowywania — czysta selekcja istniejących
   * pikseli.
   *
   * ⚠ Ładowana jak każdy inny samodzielny PNG ikony (`iconBread` i spółka);
   * jeśli się nie wczyta, `makeAbilityIcons` cofa się do proceduralnego
   * rysunku `cleave` — patrz gałąź `isUsableTexture` tamże.
   */
  iconCleave: { key: "icon-cleave-art", path: "assets/ui/icon_cleave.png" },
  /**
   * Prawdziwa ikona umiejętności `charge` (Szarża) — druga po `cleave`
   * niebędąca proceduralnym rysunkiem. Ze źródła `public/assets/szarza.png`
   * (zostaje w korzeniu jako materiał wyższej rozdzielczości), które w
   * odróżnieniu od `szerokie-ciecie.png` **od razu jest transparentnym
   * symbolem** — pędzący jeździec z peleryną i smugami ruchu, bez
   * medalionu/obwódki/tła (i bez widocznej broni — w odróżnieniu od `lunge`).
   *
   * ⚠ **Kadr obcina smugę pyłu/prędkości z lewej krawędzi źródła (x < 16),
   * zweryfikowane kolor-po-kolorze** — do x=16 są tam wyłącznie brązy pyłu i
   * pomarańcze/czerwienie smugi, żaden piksel peleryny (ciemny bordowy zaczyna
   * się dopiero od x=16). Powód: `charge` i `lunge` czytały się jako niemal
   * ten sam przycisk (zgłoszenie 2026-09-06) — `lunge` ma jednoznaczny
   * płonący grot po swojej stronie kadru, `charge` nie ma żadnej broni w
   * źródle, więc jedyną bezpieczną (bez dorysowywania) dźwignią jest
   * POWIĘKSZENIE sylwetki jeźdźca+peleryny przez odcięcie smugi, która i tak
   * niczego nie odróżnia. Efekt: 44×41 zamiast 57×41 → skala 28×26 zamiast
   * 28×20, ta sama zasada co gdzie indziej (nearest-neighbour, RÓWNY
   * współczynnik obu osi, wyśrodkowane na przezroczystym 32×32).
   *
   * ⚠ To NIE rozwiązuje problemu do końca — obie ikony dalej dzielą paletę
   * (czerwień/czerń/kremowy) i ogólny motyw pędzącego rycerza w pelerynie.
   * Rozróżnienie wspiera dziś też PIERŚCIEŃ przycisku: `ABILITIES.lunge.color`
   * (miętowy 0x7ee0c0) vs `ABILITIES.charge.color` (złoty 0xffd166) — to jest
   * kolor obrysu z `AbilityBar`, nie coś, co ta ikona rysuje sama.
   *
   * ⚠ Ładowana jak `iconCleave`; brak pliku → `makeAbilityIcons` cofa się do
   * proceduralnego rysunku `charge`.
   */
  iconCharge: { key: "icon-charge-art", path: "assets/ui/icon_charge.png" },
  /**
   * Prawdziwa ikona umiejętności `lunge` (Wypad) — ta sama historia co
   * `iconCharge`: źródło `public/assets/wypad.png` (zostaje w korzeniu) jest
   * już transparentnym symbolem (pikujący rycerz z bronią wyciągniętą w
   * przód, peleryna, pył), bez medalionu/obwódki/tła. Przygotowanie: kadr do
   * treści (70×42), nearest-neighbour RÓWNYM współczynnikiem w obu osiach do
   * 28×17, wyśrodkowane na przezroczystym 32×32.
   *
   * ⚠ Ładowana jak `iconCleave`/`iconCharge`; brak pliku → powrót do
   * proceduralnego rysunku `lunge`.
   */
  iconLunge: { key: "icon-lunge-art", path: "assets/ui/icon_lunge.png" },
  /**
   * Prawdziwa ikona umiejętności `shieldBash` (Uderzenie tarczą) — źródło
   * `public/assets/uderzenie-tarcza.png` (zostaje w korzeniu). ⚠ **Plik
   * podmieniony 2026-09-06** na mniejszy, czystszy wariant (92×84 zamiast
   * pierwotnych 1332×1181) — ten sam autor dosłał go po ocenie pierwszej
   * wersji. Gotowy transparentny symbol, bez medalionu/obwódki/tła.
   * Przygotowanie: kadr do treści (83×68), nearest-neighbour RÓWNYM
   * współczynnikiem w obu osiach do 28×23, wyśrodkowane na przezroczystym
   * 32×32.
   *
   * ⚠ Ładowana jak pozostałe realne ikony; brak pliku → powrót do
   * proceduralnego rysunku `shield_bash`.
   */
  iconShieldBash: { key: "icon-shieldbash-art", path: "assets/ui/icon_shieldbash.png" },
  /**
   * Prawdziwa ikona umiejętności `rend` (Rozcięcie) — źródło
   * `public/assets/rozciecie.png` (zostaje w korzeniu jako materiał wyższej
   * rozdzielczości: 1254×1254). Gotowy transparentny symbol — zakrwawiony
   * sztylet po cięciu + krople krwi — bez medalionu/obwódki/tła.
   * Przygotowanie: kadr do treści (862×831, niemal kwadrat), nearest-
   * neighbour RÓWNYM współczynnikiem w obu osiach do 28×27, wyśrodkowane na
   * przezroczystym 32×32.
   *
   * ⚠ Ładowana jak pozostałe realne ikony; brak pliku → powrót do
   * proceduralnego rysunku `rend`.
   */
  iconRend: { key: "icon-rend-art", path: "assets/ui/icon_rend.png" },
  /**
   * Prawdziwa ikona umiejętności `heavyStrike` (Ciężkie uderzenie) — źródło
   * `public/assets/mocne-uderzenie.png` (zostaje w korzeniu). Gotowy
   * transparentny symbol — rycerz z mieczem uniesionym nad głową, w
   * przeciwieństwie do reszty rosteru (pędzące w bok sylwetki) stoi w miejscu,
   * co samo w sobie odróżnia go na pasku. Przygotowanie: kadr do treści
   * (67×90, portretowe), nearest-neighbour RÓWNYM współczynnikiem w obu
   * osiach do 21×28, wyśrodkowane na przezroczystym 32×32.
   *
   * ⚠ Ładowana jak pozostałe realne ikony; brak pliku → powrót do
   * proceduralnego rysunku `heavy_strike`.
   */
  iconHeavyStrike: { key: "icon-heavystrike-art", path: "assets/ui/icon_heavystrike.png" },
  /**
   * Prawdziwa ikona umiejętności `warcry` (Okrzyk bojowy) — źródło
   * `public/assets/bojowy-okrzyk.png` (zostaje w korzeniu). Jedyny w tym
   * roster'ze PORTRET (twarz krzycząca, z wybuchem energii z ust) zamiast
   * całej sylwetki w ruchu — pasuje do umiejętności bez ruchu ciała.
   * Przygotowanie: kadr do treści (69×61), nearest-neighbour RÓWNYM
   * współczynnikiem w obu osiach do 28×25, wyśrodkowane na przezroczystym
   * 32×32.
   *
   * ⚠ Ładowana jak pozostałe realne ikony; brak pliku → powrót do
   * proceduralnego rysunku `warcry` (domyślna gałąź `switch` w
   * `makeAbilityIcons`).
   *
   * ⚠ **`dodge` (Unik) i `whirlwind` (Wir ostrzy) ZOSTAJĄ proceduralne —
   * świadomie, decyzja autora 2026-09-06.** Te dwie umiejętności są kandydatem
   * do przeprojektowania, więc zamawianie/przycinanie realnej grafiki dla nich
   * teraz byłoby pracą do wyrzucenia. Nie generuj im ikon „przy okazji" — to
   * nie jest przeoczenie, tylko odłożone świadomie (patrz `docs/odlozone.md`).
   */
  iconWarcry: { key: "icon-warcry-art", path: "assets/ui/icon_warcry.png" },
  /**
   * Four small nature props (added 2026-08-14) cut out of
   * `public/assets/temp/nature_assets.png` — a reference pack that was
   * reviewed and then DELETED, so these four files are all that survives
   * of it. Chosen because each fills a gap nothing in the game covers:
   * everything else on that sheet (trees, bushes, flowers, bench,
   * signpost, firewood, small rocks) already had a real equivalent in
   * `Nature.png`/`lawka.png`/`znaki.png`/`drewno_porabane.png`/
   * `kamienie.png`. Its market-stall sibling sheet was skipped outright —
   * `wioska_plan.md` §5.5 says the smith's shop "is an event, not a
   * stragan", i.e. the village economy is deliberately household visits,
   * not a bazaar.
   *
   * Each was isolated from its neighbours by connected-component labelling
   * (a plain rectangular crop caught slivers of the next sprite — the
   * mushroom and the lily each came out with a stray 6-8px fragment), then
   * run through `tools/snap_paleta.py`. All four are pure decoration: one
   * static image per Tiled point, no collision, no interaction.
   *
   * ⚠ The lily's flower needed EXPLICIT palette exceptions — snapped to
   * `akcent_cieply` (the only reddish ramp) its coral pink came out
   * ORANGE, reading as a marigold rather than a water lily. Same fix and
   * same reason as `worek-z-ziarnem.png`'s grain: the world palette has no
   * pink ramp. See the CELE entry.
   */
  /**
   * Two atlases of mechanically-packed environment decor (2026-08-31) —
   * `tools/build_forest_atlases.py`, dry-run by default, `--zapisz` to
   * (re)write. Pure repacking of ALREADY-accepted PNGs: no recolour, no
   * resnap, no resample, byte-identical pixels (the generator verifies this
   * itself before ever writing a file). See `docs/katalog_assetow.md` for
   * the full frame list and `docs/dziennik.md` 2026-08-31 for the audit that
   * preceded this.
   *
   * ⚠ Regenerating either atlas means re-running the SAME script — do not
   * hand-edit the `.json` metadata, and do not add a frame here without also
   * adding its source filename to the script's `STONES`/`BUSHES`/`STUMPS`/
   * `WATER_FLORA_FILES` lists (mirrors the `TreeStampManifest`-generation
   * discipline in `tools/build_tree_stamps.py`).
   */
  forestDecorAtlas: {
    key: "forest-decor-atlas",
    path: "assets/props/forest_decor_atlas.png",
    jsonPath: "assets/props/forest_decor_atlas.json",
  },
  waterFloraAtlas: {
    key: "water-flora-atlas",
    path: "assets/props/water_flora_atlas.png",
    jsonPath: "assets/props/water_flora_atlas.json",
  },
  // `stump` (the axe-notched generic stump, `pniak_z_siekiera_paleta.png`) —
  // now a frame in `forestDecorAtlas`, same file, same pixels.
  stump: {
    key: "forest-decor-atlas",
    frame: "pniak_z_siekiera_paleta",
  },
  mushrooms: {
    key: "mushrooms",
    path: "assets/props/grzyby_paleta.png",
  },
  /**
   * Forest-economy wood decor (2026-09-07) — six crops out of
   * `stosy-i-klody.png`, isolated by connected-component per sprite, no
   * recolour (measured HSV already sits inside the `kora`/`drewno` world
   * ramps, unlike `items.png`). Each scaled by its OWN factor, not one
   * shared ratio: `dluzyca`/`log_vertical` are undressed trunk sections
   * (thicker) and the stacks are already-split firewood rounds (thinner) —
   * forcing one ratio across both would either bloat the logs or shrink the
   * stacks. Pure `DECOR_PROPS` set-dressing, same convention as stumps/
   * stones/bushes: no physics body, no interaction, no `StumpStamps`-style
   * split (single ground sprite, nothing to divide into trunk/canopy). Six
   * variants only, not the sheet's full 22 — kept modular per the brief
   * (small/large stack, loose/scattered pile, horizontal/vertical log)
   * instead of one sprawling "every pose" set. Standalone `load.image`
   * like `mushrooms` above: six single-instance-per-map-spot images don't
   * clear the atlasing bar that justified `forestDecorAtlas` (56 frames).
   */
  woodpileSmall: {
    key: "woodpile-small",
    path: "assets/props/woodpile_small.png",
  },
  woodpileLarge: {
    key: "woodpile-large",
    path: "assets/props/woodpile_large.png",
  },
  logsLoose: {
    key: "logs-loose",
    path: "assets/props/logs_loose.png",
  },
  logsScattered: {
    key: "logs-scattered",
    path: "assets/props/logs_scattered.png",
  },
  logHorizontal: {
    key: "log-horizontal",
    path: "assets/props/log_horizontal.png",
  },
  logVertical: {
    key: "log-vertical",
    path: "assets/props/log_vertical.png",
  },
  /** A boulder half-sunk at the water's edge. Its turquoise snapped to the
   *  world's `woda` ramp, which is an IMPROVEMENT rather than a loss — the
   *  source's teal didn't match the game's river, and now it does.
   *  Now a frame in `waterFloraAtlas`, same file, same pixels. */
  pondEdge: {
    key: "water-flora-atlas",
    frame: "brzeg_stawu_paleta",
  },
  lilyPad: {
    key: "water-flora-atlas",
    frame: "lilia_wodna_paleta",
  },
  /**
   * Oak stump family, three decay states — test batch (2026-08-30), cropped
   * unmodified from the accepted `docs/art-review/dab-pniaki-alt.png` (already
   * through Pixel Snapper). Pure crop only, one rectangle per state, no
   * recolour/resnap/resample — see that file's own QA notes for what it looks
   * like and why. Species/state variants beyond oak are not generated yet.
   * Now frames in `forestDecorAtlas`, same files, same pixels.
   */
  oakStumpFresh: {
    key: "forest-decor-atlas",
    frame: "oak_stump_fresh",
  },
  oakStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "oak_stump_weathered",
  },
  oakStumpOld: {
    key: "forest-decor-atlas",
    frame: "oak_stump_old",
  },
  /**
   * Birch stump family, three decay states — first test batch (2026-08-30),
   * derived from `docs/art-review/pniaki-brzozy.png` (a 2x2 sheet; the
   * SWIEZY/ZWIETRZALY cells are its top row, STARY is bottom-left — the
   * bottom-right cell is an unused 4th variant, left for later). Bark
   * recoloured to the `brzoza_duza_new` trunk ramp from `forrest.png` (own
   * ramp, NOT the oak's), cut-face disc left in its own warm tone on
   * SWIEZY/ZWIETRZALY. Originally scaled to ~40px (matching the oak family)
   * — corrected 2026-08-30 to **23px** after a trunk-base QA pass measured
   * birch's own real trunk at ~17px (green-excluded, ground-contact band on
   * `brzoza_duza_new`): 40px was ×2.35 the live trunk, past the "twice as
   * thick" ceiling. 23px (×1.35) reads as a plausibly thick cut specimen
   * without looking like a different tree. Rescaled from the same pre-scale
   * recoloured source, no re-recolour. See
   * `docs/art-review/pniaki-brzozy-TEST-*.png` for the intermediate steps.
   */
  birchStumpFresh: {
    key: "forest-decor-atlas",
    frame: "birch_stump_fresh",
  },
  birchStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "birch_stump_weathered",
  },
  birchStumpOld: {
    key: "forest-decor-atlas",
    frame: "birch_stump_old",
  },
  /**
   * Spruce stump family, three decay states — first test batch (2026-08-30),
   * derived from `docs/art-review/swierk-pniaki.png` (a 2x3 sheet; top row
   * used — SWIEZY/ZWIETRZALY/STARY left-to-right, bottom row is a near-
   * duplicate left unused). Bark recoloured to the three big spruces' trunk
   * ramp from `forrest.png` (own ramp, not oak's or birch's), cut-face kept
   * in its own warm tone on SWIEZY/ZWIETRZALY (ZWIETRZALY's face has a
   * split/groove in the source art — not something this pass introduced).
   * Went through two scale passes: ~40px (matching oak), then 34px (user
   * request — spruce reads as the most slender species). The 2026-08-30
   * trunk-base QA pass couldn't apply its usual ratio check here: spruce's
   * trunk is clipped by its own 96px canvas bottom edge with no visible
   * root flare, so the raw measurement (~10px) isn't a reliable "true" base.
   * Picked **20px** instead by rendering 16/20/24/28px candidates next to a
   * real `swierk_duzy` trunk on a shared baseline and keeping the one that
   * read as a plausibly thick cut trunk, not a different tree's stump.
   * NOT yet folded into `TreeStamps`/a future `StumpStamps` atlas — plain
   * standalone files for map-testing, same as the other species.
   */
  spruceStumpFresh: {
    key: "forest-decor-atlas",
    frame: "spruce_stump_fresh",
  },
  spruceStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "spruce_stump_weathered",
  },
  spruceStumpOld: {
    key: "forest-decor-atlas",
    frame: "spruce_stump_old",
  },
  /**
   * Beech stump family, three decay states — first test batch (2026-08-30),
   * derived from `docs/art-review/buki-v1.png` (2x2 trees + a 3-cell stump
   * row already showing the fresh/weathered/old split, unlike the older
   * `buk.png` which only had one freshness across five sizes). No recolour
   * — the source is already the intended beech palette, "gotowy asset" per
   * the brief. Scaled to the same ~40px-fresh-width family target, NEAREST.
   */
  beechStumpFresh: {
    key: "forest-decor-atlas",
    frame: "beech_stump_fresh",
  },
  beechStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "beech_stump_weathered",
  },
  beechStumpOld: {
    key: "forest-decor-atlas",
    frame: "beech_stump_old",
  },
  /**
   * Grab (hornbeam) stump test set (2026-08-30), from `graby-pien.png`
   * (3 clean states, connected-component isolated same as the beech fix).
   * Recoloured to grab's own light grey-brown bark ramp, sampled from all
   * six real `grab_*_new` tree crops in `docs/art-review/trees/` (trunk
   * band only, green/near-black excluded) — NOT oak/beech's ramp. Unlike
   * the oak/birch/spruce precedent, this one didn't target a shared width:
   * grab's "duży" canopy (64px, same cell as birch/spruce, narrower than
   * oak's 87px) sits between spruce and birch, so the fresh stump was
   * scaled to 36px on its own natural proportion. Still too wide, though:
   * the 2026-08-30 trunk-base QA pass measured grab's own trunk at ~21px
   * (green-excluded, ground contact), making 36px ×1.71 the live trunk —
   * corrected down to **28px** (×1.33), rescaled from the same pre-scale
   * recoloured source, no re-recolour.
   */
  grabStumpFresh: {
    key: "forest-decor-atlas",
    frame: "grab_stump_fresh",
  },
  grabStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "grab_stump_weathered",
  },
  grabStumpOld: {
    key: "forest-decor-atlas",
    frame: "grab_stump_old",
  },
  /**
   * Alder (olcha) stump test set (2026-08-30), from `olcha-pien.png` (3
   * clean connected-component states, same isolation technique as grab).
   * Recoloured to alder's own bark ramp, sampled from all six real
   * `olcha_*_new` tree crops (trunk band, green/near-black excluded) — a
   * warmer, more saturated brown than grab's cooler grey, NOT a shared ramp.
   * Alder's "duży" canopy (62-64px) sits in the same width class as grab
   * and birch. Fresh stump initially landed at 36px, then rescaled down to
   * ~33px per the author's final cross-species comparison pass (2026-08-30,
   * same pre-scale recoloured source, proportional NEAREST rescale only).
   */
  alderStumpFresh: {
    key: "forest-decor-atlas",
    frame: "alder_stump_fresh",
  },
  alderStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "alder_stump_weathered",
  },
  alderStumpOld: {
    key: "forest-decor-atlas",
    frame: "alder_stump_old",
  },
  /**
   * Willow (wierzba) stump test set (2026-08-30), from `wierzba-pnie.png`
   * (3 clean connected-component states). Recoloured to willow's own warm
   * bark ramp, sampled from all six real `wierzba_*_new` tree crops. Unlike
   * every other species, willow's "duży" tree is deliberately oversized
   * (147px canopy on `TreeStampsBig`'s 160-cell, vs 87px oak / ~64px
   * grab-birch-alder — see `TREE_STAMPS_BIG` in TreeStampManifest.ts) and
   * its trunk collision box is nearly double width (28px vs 14-16px
   * everywhere else). The fresh stump was sized to match: 58px, clearly
   * larger than beech's 48px (previously the largest), picked by rendering
   * 40/50/58px candidates next to a real `wierzba_duza` and the player and
   * keeping the one that actually reads as "remains of THIS tree".
   */
  willowStumpFresh: {
    key: "forest-decor-atlas",
    frame: "willow_stump_fresh",
  },
  willowStumpWeathered: {
    key: "forest-decor-atlas",
    frame: "willow_stump_weathered",
  },
  willowStumpOld: {
    key: "forest-decor-atlas",
    frame: "willow_stump_old",
  },
  /**
   * Real herb sprites (2026-08-30), replacing the procedural placeholders
   * `makeHerbPlaceholders` used to generate (removed — see git history for
   * that function if it's ever needed as a reference again). Source:
   * `docs/art-review/ziola.png`, 11 clean connected components, one per
   * species in the `HERBS` roster below — isolated with the same
   * component-labeling technique as the tree stumps (zero neighbour bleed),
   * no recolour (already Snapper-final), scaled per-species by HEIGHT
   * (not a shared size) to roughly match each plant's real relative habit —
   * a rosette (babka) or low daisy (rumianek) reads shorter than a spike
   * plant (dziewanna, wrotycz). Key MUST match `herbTextureKey(id)` in
   * `Assets.ts` (`herb-<species id>`) — `Gatherable` resolves its texture
   * from that function, not from this table directly.
   *
   * ⚠ **`lebiodka` vs `mieta` is a judgement call, not a labelled source.**
   * `ziola.png` has two purple-flowered plants with no captions: one with
   * narrow basal leaves and several slender flower spikes (assigned to
   * lebiodka — oregano's looser, wirier habit), one with broad, deeply
   * veined opposite leaves and a stouter build (assigned to mięta — mint's
   * characteristic leaf). If this turns out backwards, it's a straight swap
   * of the two `ASSETS.herb*` `path` values below, nothing else changes.
   */
  herbBabka: { key: "herb-babka", path: "assets/props/herb_babka.png" },
  herbKrwawnik: { key: "herb-krwawnik", path: "assets/props/herb_krwawnik.png" },
  herbPokrzywa: { key: "herb-pokrzywa", path: "assets/props/herb_pokrzywa.png" },
  herbRumianek: { key: "herb-rumianek", path: "assets/props/herb_rumianek.png" },
  herbDziurawiec: { key: "herb-dziurawiec", path: "assets/props/herb_dziurawiec.png" },
  herbLebiodka: { key: "herb-lebiodka", path: "assets/props/herb_lebiodka.png" },
  herbWrotycz: { key: "herb-wrotycz", path: "assets/props/herb_wrotycz.png" },
  herbMieta: { key: "herb-mieta", path: "assets/props/herb_mieta.png" },
  herbNawloc: { key: "herb-nawloc", path: "assets/props/herb_nawloc.png" },
  herbDziewanna: { key: "herb-dziewanna", path: "assets/props/herb_dziewanna.png" },
  herbZywokost: { key: "herb-zywokost", path: "assets/props/herb_zywokost.png" },
  /**
   * Decorative stones (2026-08-30), first proper roster — 23 of 41 isolated
   * from `docs/art-review/kamienie-snapped.png`, connected-component cropped
   * (see `docs/art-review/kamienie/`, where all 41 stay as reserve; the 18
   * not picked here are near-duplicates of a kept silhouette, not deleted).
   * Passed through the real `tools/snap_paleta.py` pipeline (`--tylko
   * stone_ --zapisz`) against the world's restrictive ramp set — see the
   * `_KAMIENIE_*` block near the bottom of that file for the measured
   * rationale (why `kamien` stays unused, why `mech` exists). Sizes are
   * native — NOT normalised to one scale, by design; `docs/dziennik.md` has
   * the bbox table. Five classes by real height (32px≈1m): drobny (4),
   * maly (6), sredni (6), duzy (4), glaz (3) — the key names carry the
   * class so a spawn table reads legibly.
   */
  stoneDrobny01: { key: "forest-decor-atlas", frame: "stone_drobny_01" },
  stoneDrobny02: { key: "forest-decor-atlas", frame: "stone_drobny_02" },
  stoneDrobny04: { key: "forest-decor-atlas", frame: "stone_drobny_04" },
  stoneDrobny06: { key: "forest-decor-atlas", frame: "stone_drobny_06" },
  stoneMaly02: { key: "forest-decor-atlas", frame: "stone_maly_02" },
  stoneMaly04: { key: "forest-decor-atlas", frame: "stone_maly_04" },
  stoneMaly05: { key: "forest-decor-atlas", frame: "stone_maly_05" },
  stoneMaly08: { key: "forest-decor-atlas", frame: "stone_maly_08" },
  stoneMaly12: { key: "forest-decor-atlas", frame: "stone_maly_12" },
  stoneMaly15: { key: "forest-decor-atlas", frame: "stone_maly_15" },
  stoneSredni01: { key: "forest-decor-atlas", frame: "stone_sredni_01" },
  stoneSredni02: { key: "forest-decor-atlas", frame: "stone_sredni_02" },
  stoneSredni06: { key: "forest-decor-atlas", frame: "stone_sredni_06" },
  stoneSredni07: { key: "forest-decor-atlas", frame: "stone_sredni_07" },
  stoneSredni09: { key: "forest-decor-atlas", frame: "stone_sredni_09" },
  stoneSredni11: { key: "forest-decor-atlas", frame: "stone_sredni_11" },
  stoneDuzy01: { key: "forest-decor-atlas", frame: "stone_duzy_01" },
  stoneDuzy02: { key: "forest-decor-atlas", frame: "stone_duzy_02" },
  stoneDuzy05: { key: "forest-decor-atlas", frame: "stone_duzy_05" },
  stoneDuzy06: { key: "forest-decor-atlas", frame: "stone_duzy_06" },
  stoneGlaz01: { key: "forest-decor-atlas", frame: "stone_glaz_01" },
  stoneGlaz02: { key: "forest-decor-atlas", frame: "stone_glaz_02" },
  stoneGlaz03: { key: "forest-decor-atlas", frame: "stone_glaz_03" },
  /**
   * Decorative bushes (2026-08-30) — 11 of 11 isolated from
   * `docs/art-review/krzewy.png` (connected-component, zero neighbour
   * bleed, same technique as trees/stumps/herbs). No recolour: measured
   * mean distance 23 (median 21, max 52, zero outliers past 60) from real
   * canopy greens in `forrest.png` — palette was already consistent.
   * Scaled by ONE shared factor (0.737, derived from the tallest native
   * variant → 42px) applied to all 11, preserving both their proportions
   * and the source's own size progression (dome_small < dome_medium <
   * dome_large) rather than normalising everyone to one height. Three
   * silhouette families: `dome*` (compact rounded mass — small/medium/
   * large plain, plus berry/flower/olive-tone variants), `twiggy*` (visible
   * woody branches, sparser — bare/leafy/berry), `low*` (wide, flattened —
   * plain and with crossed sticks). Treated as environmental variants, not
   * named botanical species — the source doesn't support picking real ones.
   * `dome_berry`/`twiggy_berry` are the only two with visible fruit — pure
   * decoration for now, explicitly not wired to any gathering mechanic.
   */
  bushDomeSmall: { key: "forest-decor-atlas", frame: "bush_dome_small" },
  bushDomeMedium: { key: "forest-decor-atlas", frame: "bush_dome_medium" },
  bushDomeLarge: { key: "forest-decor-atlas", frame: "bush_dome_large" },
  bushDomeBerry: { key: "forest-decor-atlas", frame: "bush_dome_berry" },
  bushDomeFlower: { key: "forest-decor-atlas", frame: "bush_dome_flower" },
  bushDomeOlive: { key: "forest-decor-atlas", frame: "bush_dome_olive" },
  bushTwiggyBareLeaf: { key: "forest-decor-atlas", frame: "bush_twiggy_bare_leaf" },
  bushTwiggyBerry: { key: "forest-decor-atlas", frame: "bush_twiggy_berry" },
  bushTwiggyBare: { key: "forest-decor-atlas", frame: "bush_twiggy_bare" },
  bushLowWide: { key: "forest-decor-atlas", frame: "bush_low_wide" },
  bushLowSticks: { key: "forest-decor-atlas", frame: "bush_low_sticks" },
  /**
   * Water/shore vegetation (2026-08-30), final package — 17 of 17 isolated
   * from `docs/art-review/rosliny-wodne.png` (connected-component, zero
   * neighbour bleed; union of all 17 files' colours == source's 63 colours
   * exactly, so nothing was lost or invented). Already Snapper-final, no
   * recolour. Four families, each its OWN shared scale factor (preserves
   * the size progression WITHIN a family without flattening it, same
   * technique as the beech/bush dome families):
   *  - `cattail*` (3): the big pałka wodna trio, factor 0.510 off the
   *    largest → 54px tallest.
   *  - `reedPlume*` (2): feathery-plume reed, factor 0.549 → 52px tallest.
   *  - `marshTuft*` (6): low neutral bog/marsh grass, factor 0.667 → 31px
   *    tallest — NOT `HERBS`, purely decorative, no gathering.
   *  - `shorePlant*` (6): lowest shoreline vegetation, factor 0.565 → 28px
   *    tallest. Deliberately no botanical species names (source is
   *    environmental, not scientific) — numbered variants instead.
   */
  cattailLarge: { key: "water-flora-atlas", frame: "cattail_large" },
  cattailMedium: { key: "water-flora-atlas", frame: "cattail_medium" },
  cattailSmall: { key: "water-flora-atlas", frame: "cattail_small" },
  reedPlumeLarge: { key: "water-flora-atlas", frame: "reed_plume_large" },
  reedPlumeSmall: { key: "water-flora-atlas", frame: "reed_plume_small" },
  marshTuft01: { key: "water-flora-atlas", frame: "marsh_tuft_01" },
  marshTuft02: { key: "water-flora-atlas", frame: "marsh_tuft_02" },
  marshTuft03: { key: "water-flora-atlas", frame: "marsh_tuft_03" },
  marshTuft04: { key: "water-flora-atlas", frame: "marsh_tuft_04" },
  marshTuft05: { key: "water-flora-atlas", frame: "marsh_tuft_05" },
  marshTuft06: { key: "water-flora-atlas", frame: "marsh_tuft_06" },
  shorePlant01: { key: "water-flora-atlas", frame: "shore_plant_01" },
  shorePlant02: { key: "water-flora-atlas", frame: "shore_plant_02" },
  shorePlant03: { key: "water-flora-atlas", frame: "shore_plant_03" },
  shorePlant04: { key: "water-flora-atlas", frame: "shore_plant_04" },
  shorePlant05: { key: "water-flora-atlas", frame: "shore_plant_05" },
  shorePlant06: { key: "water-flora-atlas", frame: "shore_plant_06" },
  // Nowy buk (buki-v1) — od ETAP4 (2026-08-31) w atlasie stempli drzew
  // (`TreeStamps` id 35–37 buk_sredni/sredni2/maly, `TreeStampsBig` id 2–3
  // buk_duzy/duzy2). Źródło standalone: `docs/art-review/trees/buk_v1_*.png`,
  // wpięte przez `docs/forrest_atlas.json` klucz `beeches`. Testowe wpisy
  // `beechTree*` w ASSETS/DECOR_PROPS oraz obiekty `buk_test_*` — USUNIĘTE.
  /**
   * The three flavour villagers (see PEASANT/MILLER/ELDER) — same
   * crop+recolor treatment as `kowal`/`hunter` above (`tools/build_peasant.py`
   * / `build_miller.py` / `build_elder.py`), already cropped with real
   * alpha, no sheet to slice. Same "missing file just degrades" story.
   */
  peasant: {
    key: "peasant-portrait",
    path: "assets/characters/peasant_portrait.png",
  },
  miller: {
    key: "miller-portrait",
    path: "assets/characters/miller_portrait.png",
  },
  elder: {
    key: "elder-portrait",
    path: "assets/characters/elder_portrait.png",
  },
  /**
   * Ojciec/Matka — same crop+recolor treatment (`tools/build_father.py` /
   * `build_mother.py`), generated from real reference photos rather than a
   * painterly sheet (see `docs/prompty_gemini.md`).
   */
  father: {
    key: "father-portrait",
    path: "assets/characters/father_portrait.png",
  },
  mother: {
    key: "mother-portrait",
    path: "assets/characters/mother_portrait.png",
  },
  /**
   * Dorota Zielarka — same crop+recolor treatment as the other flavour
   * villagers above (`tools/build_dorota.py`, from `dorota-pixel-snapper.png`
   * — see `docs/prompty_gemini.md`). Skin and hair are kept out of the
   * project palette on purpose: her hair is grey, and the only ramps her
   * prompt declared (ziemia/drewno/listowie) are all brown/green — nearest-
   * snapping grey hair into those would have turned it brown and erased the
   * "elderly" read entirely.
   */
  herbalist: {
    key: "herbalist-portrait",
    path: "assets/characters/herbalist_portrait.png",
  },
  /**
   * Wdowa Zofia — same crop+recolor treatment as the other flavour
   * villagers (`tools/build_zofia.py`, from `zofia.png` — see
   * `docs/prompty_gemini.md`).
   */
  zofia: {
    key: "zofia-portrait",
    path: "assets/characters/zofia_portrait.png",
  },
  /**
   * Ikony jedzenia od Anny — trzy samodzielne PNG, bo `items.png` nie ma ani
   * pieczywa, ani jajek, ani sera. Gotowe 32×32, wypiekane przez
   * `tools/build_ikony_jedzenia.py` ze źródeł autora (`bread.png`,
   * `egg.png`, `Cheese.png`).
   *
   * ⚠ Klucze MUSZĄ zgadzać się z `ITEMS.*.iconTexture` (tam wpisane jako
   * stringi, bo `ITEMS` stoi w tym pliku przed `ASSETS`).
   *
   * ⚠ **Nie podmieniaj tych plików surowymi źródłami.** Generator robi trzy
   * rzeczy, których źródła nie mają: sprowadza je do zmierzonego pasma 3-6
   * kolorów `items.png` (ser miał 337), wyrównuje wielkość treści do 26 px
   * (inaczej jajko renderowałoby się o jedną trzecią mniejsze od chleba) i
   * dokłada twardy czarny kontur, który ma KAŻDA z 16 ikon w grze, a nie
   * miała żadne z trzech źródeł.
   */
  /**
   * ⭐⭐ SZEŚĆ IKON TARCZ — pierwsze assety z generatora `tools/build_shield_icons.py`
   * i pierwsze w grze ikony **NIEKWADRATOWE**: migdałowa, legionowa i pawęż
   * mają 32×64 px, bo zajmują w plecaku dwa pola (`inventoryFootprint`).
   *
   * ⚠ Do 2026-09-19 DZIESIĘĆ z jedenastu drewnianych tarcz dzieliło jeden
   * kafel `(11,9)` z `items.png` — czyli cały katalog drewna wyglądał w sklepie
   * identycznie. To jest dokładnie usterka „dwa różne przedmioty z jedną
   * sylwetką", przed którą ostrzega `public/assets/README.md`.
   *
   * ⛔ Ikona idzie po KONSTRUKCJI, nie po przedmiocie: wariant ciężki i lekki
   * dzielą sylwetkę, bo różni je masa i liczby, nie kształt. Materiał (żelazo,
   * stal) dostanie własne pliki, gdy powstanie jego grafika.
   */
  iconShieldBuckler: { key: "icon-shield-buckler", path: "assets/items/icon_shield_wood_buckler.png" },
  iconShieldRound: { key: "icon-shield-round", path: "assets/items/icon_shield_wood_round.png" },
  iconShieldHeater: { key: "icon-shield-heater", path: "assets/items/icon_shield_wood_heater.png" },
  iconShieldAlmond: { key: "icon-shield-almond", path: "assets/items/icon_shield_wood_almond.png" },
  iconShieldScutum: { key: "icon-shield-scutum", path: "assets/items/icon_shield_wood_scutum.png" },
  iconShieldPavise: { key: "icon-shield-pavise", path: "assets/items/icon_shield_wood_pavise.png" },
  /** Tarcze metalowe (`tools/build_metal_shield_icons.py`, 2026-10-02): warstwa
   *  metalu na drewnianym masterze — okucie, umbo, lity puklerz. Jedna ikona na
   *  (konstrukcja, gatunek); warianty lekki/ciężki ją dzielą. */
  iconShieldMetal: [
    { key: "icon-shield-iron-buckler", path: "assets/items/icon_shield_iron_buckler.png" },
    { key: "icon-shield-steel-buckler", path: "assets/items/icon_shield_steel_buckler.png" },
    { key: "icon-shield-iron-round", path: "assets/items/icon_shield_iron_round.png" },
    { key: "icon-shield-steel-round", path: "assets/items/icon_shield_steel_round.png" },
    { key: "icon-shield-iron-heater", path: "assets/items/icon_shield_iron_heater.png" },
    { key: "icon-shield-steel-heater", path: "assets/items/icon_shield_steel_heater.png" },
    { key: "icon-shield-iron-almond", path: "assets/items/icon_shield_iron_almond.png" },
    { key: "icon-shield-iron-scutum", path: "assets/items/icon_shield_iron_scutum.png" },
    { key: "icon-shield-steel-scutum", path: "assets/items/icon_shield_steel_scutum.png" },
  ],
  /**
   * ⭐⭐ Rodzina SZTYLETÓW — generator `tools/build_ikony_sztyletow.py`
   * (rysowana proceduralnie; wsad Gemini posłużył tylko za projekt).
   * Zastępuje kafle `items.png` (8,0), (0,1), (1,0); `icon` przy przedmiocie
   * zostaje jako ścieżka awaryjna. Czwarty plik rodziny,
   * `icon_weapon_hunting_knife.png`, czeka bez wpięcia — przedmiotu nie ma.
   */
  iconWeaponKnife: { key: "icon-weapon-knife", path: "assets/items/icon_weapon_knife.png" },
  iconWeaponDagger: { key: "icon-weapon-dagger", path: "assets/items/icon_weapon_dagger.png" },
  iconWeaponMisericorde: {
    key: "icon-weapon-misericorde",
    path: "assets/items/icon_weapon_misericorde.png",
  },
  /**
   * PILOT ikon PANCERZA — głowa, klata (len, skóra, kolczuga, metal) i nogi: len, skóra, kolczuga (`tools/build_armor_icons.py`, 2026-09-28).
   * Źródło: arkusz Gemini zmniejszony do ~28 px, rampy per materiał,
   * szachownica kolczugi nakładana natywnie; żelazo = zamiana rampy stali.
   * `icon` przy przedmiotach zostaje jako ścieżka awaryjna.
   * Plan całej rodziny: `docs/gemini_armor_icons.md`.
   */
  iconArmor: [
    { key: "icon-armor-cloth-coif", path: "assets/items/icon_armor_cloth_coif.png" },
    { key: "icon-armor-padded-cap", path: "assets/items/icon_armor_padded_cap.png" },
    { key: "icon-armor-leather-helmet", path: "assets/items/icon_armor_leather_helmet.png" },
    { key: "icon-armor-mail-coif", path: "assets/items/icon_armor_mail_coif.png" },
    { key: "icon-armor-iron-coif", path: "assets/items/icon_armor_iron_coif.png" },
    { key: "icon-armor-lamellar-coif", path: "assets/items/icon_armor_lamellar_coif.png" },
    { key: "icon-armor-steel-helmet", path: "assets/items/icon_armor_steel_helmet.png" },
    { key: "icon-armor-iron-helmet", path: "assets/items/icon_armor_iron_helmet.png" },
    { key: "icon-armor-spangenhelm", path: "assets/items/icon_armor_spangenhelm.png" },
    { key: "icon-armor-kettle-hat", path: "assets/items/icon_armor_kettle_hat.png" },
    { key: "icon-armor-linen-shirt", path: "assets/items/icon_armor_linen_shirt.png" },
    { key: "icon-armor-gambeson", path: "assets/items/icon_armor_gambeson.png" },
    { key: "icon-armor-arming-doublet", path: "assets/items/icon_armor_arming_doublet.png" },
    { key: "icon-armor-leather-chest", path: "assets/items/icon_armor_leather_chest.png" },
    { key: "icon-armor-studded-leather", path: "assets/items/icon_armor_studded_leather.png" },
    { key: "icon-armor-hardened-leather-chest", path: "assets/items/icon_armor_hardened_leather_chest.png" },
    { key: "icon-armor-mail-hauberk", path: "assets/items/icon_armor_mail_hauberk.png" },
    { key: "icon-armor-iron-hauberk", path: "assets/items/icon_armor_iron_hauberk.png" },
    { key: "icon-armor-short-hauberk", path: "assets/items/icon_armor_short_hauberk.png" },
    { key: "icon-armor-lamellar-chest", path: "assets/items/icon_armor_lamellar_chest.png" },
    { key: "icon-armor-scale-chest", path: "assets/items/icon_armor_scale_chest.png" },
    { key: "icon-armor-steel-chest", path: "assets/items/icon_armor_steel_chest.png" },
    { key: "icon-armor-iron-chest", path: "assets/items/icon_armor_iron_chest.png" },
    { key: "icon-armor-brigandine", path: "assets/items/icon_armor_brigandine.png" },
    { key: "icon-armor-cuirass", path: "assets/items/icon_armor_cuirass.png" },
    { key: "icon-armor-linen-trousers", path: "assets/items/icon_armor_linen_trousers.png" },
    { key: "icon-armor-padded-chausses", path: "assets/items/icon_armor_padded_chausses.png" },
    { key: "icon-armor-leather-legs", path: "assets/items/icon_armor_leather_legs.png" },
    { key: "icon-armor-mail-chausses", path: "assets/items/icon_armor_mail_chausses.png" },
    { key: "icon-armor-iron-chausses", path: "assets/items/icon_armor_iron_chausses.png" },
    { key: "icon-armor-demi-chausses", path: "assets/items/icon_armor_demi_chausses.png" },
    { key: "icon-armor-lamellar-legs", path: "assets/items/icon_armor_lamellar_legs.png" },
    { key: "icon-armor-scale-legs", path: "assets/items/icon_armor_scale_legs.png" },
    { key: "icon-armor-steel-legs", path: "assets/items/icon_armor_steel_legs.png" },
    { key: "icon-armor-iron-legs", path: "assets/items/icon_armor_iron_legs.png" },
    { key: "icon-armor-splinted-greaves", path: "assets/items/icon_armor_splinted_greaves.png" },
    { key: "icon-armor-cuisses", path: "assets/items/icon_armor_cuisses.png" },
    { key: "icon-armor-foot-wraps", path: "assets/items/icon_armor_foot_wraps.png" },
    { key: "icon-armor-bast-shoes", path: "assets/items/icon_armor_bast_shoes.png" },
    { key: "icon-armor-low-boots", path: "assets/items/icon_armor_low_boots.png" },
    { key: "icon-armor-leather-boots", path: "assets/items/icon_armor_leather_boots.png" },
    { key: "icon-armor-marching-boots", path: "assets/items/icon_armor_marching_boots.png" },
    { key: "icon-armor-mail-boots", path: "assets/items/icon_armor_mail_boots.png" },
    { key: "icon-armor-steel-boots", path: "assets/items/icon_armor_steel_boots.png" },
    { key: "icon-armor-iron-boots", path: "assets/items/icon_armor_iron_boots.png" },
    { key: "icon-armor-half-sabatons", path: "assets/items/icon_armor_half_sabatons.png" },
    { key: "icon-armor-padded-gloves", path: "assets/items/icon_armor_padded_gloves.png" },
    { key: "icon-armor-worn-wraps", path: "assets/items/icon_armor_worn_wraps.png" },
    { key: "icon-armor-leather-gloves", path: "assets/items/icon_armor_leather_gloves.png" },
    { key: "icon-armor-mail-gloves", path: "assets/items/icon_armor_mail_gloves.png" },
    { key: "icon-armor-steel-gauntlets", path: "assets/items/icon_armor_steel_gauntlets.png" },
    { key: "icon-armor-leather-pauldrons", path: "assets/items/icon_armor_leather_pauldrons.png" },
    { key: "icon-armor-lamellar-pauldrons", path: "assets/items/icon_armor_lamellar_pauldrons.png" },
    { key: "icon-armor-scale-pauldrons", path: "assets/items/icon_armor_scale_pauldrons.png" },
    { key: "icon-armor-plate-pauldrons", path: "assets/items/icon_armor_plate_pauldrons.png" },
  ],
  /** Miecze (`tools/build_sword_icons.py`): krótki 32×32 na osi 45°, reszta 32×64
   *  pionowo i 1×2 w plecaku — broń średnia i duża leży na dwóch polach
   *  (reguła autora 2026-10-01, `docs/gemini_weapon_icons.md` §10.8). */
  iconWeaponSwords: [
    { key: "icon-weapon-short-sword", path: "assets/items/icon_weapon_short_sword.png" },
    { key: "icon-weapon-messer", path: "assets/items/icon_weapon_messer.png" },
    { key: "icon-weapon-cleaver-sword", path: "assets/items/icon_weapon_cleaver_sword.png" },
    { key: "icon-weapon-sword", path: "assets/items/icon_weapon_sword.png" },
    { key: "icon-weapon-sabre", path: "assets/items/icon_weapon_sabre.png" },
    { key: "icon-weapon-longsword", path: "assets/items/icon_weapon_longsword.png" },
    { key: "icon-weapon-rapier", path: "assets/items/icon_weapon_rapier.png" },
    { key: "icon-weapon-bastard-sword", path: "assets/items/icon_weapon_bastard_sword.png" },
    { key: "icon-weapon-greatsword", path: "assets/items/icon_weapon_greatsword.png" },
    { key: "icon-weapon-zweihander", path: "assets/items/icon_weapon_zweihander.png" },
  ],
  /** Obuchowe (`tools/build_blunt_icons.py`, 2026-10-02): wszystkie 32×64 po skosie
   *  1:2, wyśrodkowane; łańcuch kiścienia/korbacza i bijak cepa zwisają w dół
   *  ekranu. Gabaryt 1×2 przy przedmiotach wynika z tych ikon. */
  iconWeaponBlunt: [
    { key: "icon-weapon-club", path: "assets/items/icon_weapon_club.png" },
    { key: "icon-weapon-war-hammer-1h", path: "assets/items/icon_weapon_war_hammer_1h.png" },
    { key: "icon-weapon-chain-mace", path: "assets/items/icon_weapon_chain_mace.png" },
    { key: "icon-weapon-hammer", path: "assets/items/icon_weapon_hammer.png" },
    { key: "icon-weapon-mace", path: "assets/items/icon_weapon_mace.png" },
    { key: "icon-weapon-war-pick", path: "assets/items/icon_weapon_war_pick.png" },
    { key: "icon-weapon-stick", path: "assets/items/icon_weapon_stick.png" },
    { key: "icon-weapon-flail", path: "assets/items/icon_weapon_flail.png" },
    { key: "icon-weapon-great-club", path: "assets/items/icon_weapon_great_club.png" },
    { key: "icon-weapon-war-hammer", path: "assets/items/icon_weapon_war_hammer.png" },
    { key: "icon-weapon-peasant-flail", path: "assets/items/icon_weapon_peasant_flail.png" },
  ],
  /** Topory (`tools/build_axe_icons.py`, 2026-10-02): toporek 32×32 na 45°, reszta
   *  32×64 po skosie 1:2, ostrze po stronie światła. Gabaryt 1×2 przy przedmiotach
   *  wynika z tych ikon — idą razem (`gabaryt_przymiar` §A). */
  iconWeaponAxes: [
    { key: "icon-weapon-hatchet", path: "assets/items/icon_weapon_hatchet.png" },
    { key: "icon-weapon-axe", path: "assets/items/icon_weapon_axe.png" },
    { key: "icon-weapon-bearded-axe", path: "assets/items/icon_weapon_bearded_axe.png" },
    { key: "icon-weapon-battle-axe", path: "assets/items/icon_weapon_battle_axe.png" },
    { key: "icon-weapon-dane-axe", path: "assets/items/icon_weapon_dane_axe.png" },
    { key: "icon-weapon-bardiche", path: "assets/items/icon_weapon_bardiche.png" },
    { key: "icon-weapon-labrys", path: "assets/items/icon_weapon_labrys.png" },
  ],
  /** Drzewcowe, skos 1:2 w kaflu 32x64 (`tools/build_polearm_icons.py`, 2026-09-30).
   *  Gabaryt 1×2 przy przedmiotach wynika z tych ikon — idą razem. */
  iconWeaponPolearms: [
    { key: "icon-weapon-spear", path: "assets/items/icon_weapon_spear.png" },
    { key: "icon-weapon-pike", path: "assets/items/icon_weapon_pike.png" },
    { key: "icon-weapon-halberd", path: "assets/items/icon_weapon_halberd.png" },
    { key: "icon-weapon-glaive", path: "assets/items/icon_weapon_glaive.png" },
    { key: "icon-weapon-boar-spear", path: "assets/items/icon_weapon_boar_spear.png" },
    { key: "icon-weapon-pitchfork", path: "assets/items/icon_weapon_pitchfork.png" },
  ],
  iconBread: { key: "icon-bread", path: "assets/items/icon_bread.png" },
  iconEggs: { key: "icon-eggs", path: "assets/items/icon_egg.png" },
  iconCheese: { key: "icon-cheese", path: "assets/items/icon_cheese.png" },
  /** Czwarty samodzielny PNG w tej rodzinie — patrz komentarz nad
   *  `ITEMS.rabbit_meat.iconTexture` po cały pipeline normalizacji. */
  iconRabbitMeat: { key: "icon-rabbit-meat", path: "assets/items/icon_rabbit_meat.png" },
  /** Piąty — patrz komentarz nad `ITEMS.leather_scraps.iconTexture`. */
  iconLeatherScraps: {
    key: "icon-leather-scraps",
    path: "assets/items/icon_leather_scraps.png",
  },
  /** Szósty — patrz komentarz nad `ITEMS.wolf_pelt.iconTexture`. */
  iconWolfPelt: { key: "icon-wolf-pelt", path: "assets/items/icon_wolf_pelt.png" },
  /** Siódmy — patrz komentarz nad `ITEMS.boar_hide.iconTexture`. */
  iconBoarHide: { key: "icon-boar-hide", path: "assets/items/icon_boar_hide.png" },
  /** Ósmy — patrz komentarz nad `ITEMS.venom_gland.iconTexture`. */
  iconVenomGland: { key: "icon-venom-gland", path: "assets/items/icon_venom_gland.png" },
  /** Dziewiąty — patrz komentarz nad `ITEMS.spider_silk.iconTexture`. */
  iconSpiderSilk: { key: "icon-spider-silk", path: "assets/items/icon_spider_silk.png" },
  /** Dziesiąty — patrz komentarz nad `ITEMS.cooked_meat.iconTexture`. */
  iconCookedMeat: { key: "icon-cooked-meat", path: "assets/items/icon_cooked_meat.png" },
  /**
   * Cztery ikony toreb — 32×32 z 64×64 źródeł `bag-1..4.png` w korzeniu
   * `assets/` (zostają tam jako materiał wyższej rozdzielczości).
   * ⭐ **Od 2026-10-04 RYSOWANE w stylu SKÓRZANEGO EKWIPUNKU**
   * (`tools/build_bag_icons.py`, decyzja autora): kształty z geometrii,
   * rampa skóry `wood_palette.py`, kontur 4-sąsiedni, a każda torba ma swój
   * znak (sznurek, kołeczek, posłanie z dwiema żelaznymi sprzączkami, dwie
   * mosiężne). Przejście
   * źródeł przez ścieżkę kaftana dało dobry kolor, ale zjadło klapy i paski
   * — dlatego rysunek, nie zmniejszenie. Do tej daty były
   * Lanczosem (360–550 kolorów, miękkie cieniowanie, nasycona pomarańcz)
   * i obok skórzanego pancerza czytały się jak z innej gry — tu stał zapis
   * „dopisek do zrobienia, nie cichy dług”. ⛔ Nie przywracaj Lanczosa.
   */
  iconBag1: { key: "icon-bag-1", path: "assets/items/icon_bag_1.png" },
  iconBag2: { key: "icon-bag-2", path: "assets/items/icon_bag_2.png" },
  iconBag3: { key: "icon-bag-3", path: "assets/items/icon_bag_3.png" },
  iconBag4: { key: "icon-bag-4", path: "assets/items/icon_bag_4.png" },
  /** Anna — `tools/build_anna.py`. Trzy własne domeny koloru zamiast jednej
   *  (blond i skóra snapują do ramp wyciętych z jej własnego obrazka, oczy
   *  łapie rampa `woda`) — patrz nagłówek generatora. */
  anna: {
    key: "anna-portrait",
    path: "assets/characters/anna_portrait.png",
  },
  iconRibwort: { key: "icon-ribwort-plantain", path: "assets/items/icon_ribwort_plantain.png" },
  iconStJohnsWort: { key: "icon-st-johns-wort", path: "assets/items/icon_st_johns_wort.png" },
  iconNettle: { key: "icon-nettle", path: "assets/items/icon_nettle.png" },
  iconChamomile: { key: "icon-chamomile", path: "assets/items/icon_chamomile.png" },
  iconYarrow: { key: "icon-yarrow", path: "assets/items/icon_yarrow.png" },
  /** Szóstka zioł bez ikony do 2026-10-05 — `tools/build_herb_icons.py`. */
  iconMullein: { key: "icon-mullein", path: "assets/items/icon_mullein.png" },
  iconGoldenrod: { key: "icon-goldenrod", path: "assets/items/icon_goldenrod.png" },
  iconTansy: { key: "icon-tansy", path: "assets/items/icon_tansy.png" },
  iconCornMint: { key: "icon-corn-mint", path: "assets/items/icon_corn_mint.png" },
  iconWildMarjoram: { key: "icon-wild-marjoram", path: "assets/items/icon_wild_marjoram.png" },
  iconComfrey: { key: "icon-comfrey", path: "assets/items/icon_comfrey.png" },
  iconBearHide: { key: "icon-bear-hide", path: "assets/items/icon_bear_hide.png" },
  iconHealthPotion: { key: "icon-health-potion", path: "assets/items/icon_health_potion.png" },
  /** Biżuteria i kieł Szarego — `tools/build_misc_icons.py` (2026-10-05). Do tej
   *  daty pierścienie i naszyjnik szły z items.png, kieł był plamką koloru. */
  iconRingPrecision: { key: "icon-ring-precision", path: "assets/items/icon_ring_precision.png" },
  iconRingSwiftness: { key: "icon-ring-swiftness", path: "assets/items/icon_ring_swiftness.png" },
  iconRingVigor: { key: "icon-ring-vigor", path: "assets/items/icon_ring_vigor.png" },
  iconRingWarding: { key: "icon-ring-warding", path: "assets/items/icon_ring_warding.png" },
  iconGreyFang: { key: "icon-grey-fang", path: "assets/items/icon_grey_fang.png" },
  iconGreyFangNecklace: {
    key: "icon-grey-fang-necklace",
    path: "assets/items/icon_grey_fang_necklace.png",
  },
  /** Kuba — pierwszy z ósemki z `wioska_plan.md` §6, który dostał własną
   *  twarz (`tools/build_kuba.py`). ⚠ **Wpięcie kolejnej to NIE "jeden wpis
   *  tutaj + jedna linia `portraitTexture`" — to zdanie tu stało i było
   *  niepełne.** Brakuje TRZECIEGO kroku: `load.image(ASSETS.<klucz>.key,
   *  ASSETS.<klucz>.path)` w `queueImages()` (`src/core/Assets.ts`).
   *  Ten wpis tutaj tylko DEKLARUJE klucz/ścieżkę — nic go nie ładuje
   *  samo z siebie, `BootScene` NIE iteruje generycznie po `ASSETS`
   *  (ten fakt też był tu kiedyś błędnie założony). Bez wpisu w
   *  `queueImages` tekstura nigdy nie trafia do cache'u, `Merchant.ts`'s
   *  `scene.textures.exists(npc.portraitTexture)` zwraca `false` po cichu
   *  (bez błędu, bez ostrzeżenia w konsoli) i NPC nadal renderuje się na
   *  wspólnym `NPC.png` z `tint` — dokładnie tak, jakby nic nie zostało
   *  zrobione. Stało się to naprawdę: Witek/Sobek/Agata/Dobrawa (2026-08-20)
   *  miały ten wpis i `portraitTexture` gotowe, a mimo to były niewidoczne w
   *  grze, dopóki ten trzeci krok nie został dopisany. */
  kuba: {
    key: "kuba-portrait",
    path: "assets/characters/kuba_portrait.png",
  },
  /** Gniewko — drugi z ósemki, `tools/build_gniewko.py`. Włosy nie mają
   *  własnej domeny koloru (w odróżnieniu od Kuby) — brązy trafiają czysto
   *  w `ziemia`/`kora`/`piasek` bez kolizji z otoczeniem, patrz nagłówek
   *  generatora. Tylko skóra dostała własną, ciasną rampę. */
  gniewko: {
    key: "gniewko-portrait",
    path: "assets/characters/gniewko_portrait.png",
  },
  /** Hanna — trzecia z ósemki, `tools/build_hanna.py`. Kosmyki spod chustki
   *  dostały własną rampę (jak broda Kuby) — chustka i włosy leżą w tej
   *  samej brązowo-tan rodzinie, więc najbliższy sąsiad sam by je zlał. */
  hanna: {
    key: "hanna-portrait",
    path: "assets/characters/hanna_portrait.png",
  },
  /** Sulisław — czwarty z ósemki, `tools/build_sulislaw.py`. Jedyne źródło,
   *  które przyszło jako JPEG 14× za duży (720×1483 zamiast ~50×100) —
   *  skrypt najpierw sprowadza to `Image.BOX`-em do prawdziwej siatki,
   *  dopiero potem robi to, co reszta. Łysy i gładko ogolony (świadomie —
   *  rozdziela sylwetkę od Kuby, który ma kapelusz i pełną brodę). */
  sulislaw: {
    key: "sulislaw-portrait",
    path: "assets/characters/sulislaw_portrait.png",
  },
  /** Witek — piąty z ósemki, `tools/build_witek.py`. Włosy nie mają własnej
   *  domeny koloru (jak u Gniewki, nie jak u Kuby) — tunika jest chłodna
   *  (szaro-zielona -> `kamien`), więc brąz włosów trafia bez kolizji w
   *  `kora`. Tylko skóra dostała własną, ciasną rampę. */
  witek: {
    key: "witek-portrait",
    path: "assets/characters/witek_portrait.png",
  },
  /** Sobek — szósty z ósemki, `tools/build_sobek.py`. Fartuch skórzany i
   *  tunika pod spodem musiały dostać ODDZIELNE rampy (`drewno`/`piasek`)
   *  po ROLI (pozycji w kadrze), nie po czystym najbliższym-sąsiedzie po
   *  całej palecie — inaczej dominujący brąz fartucha wpadłby w `piasek` i
   *  skasował kontrast, który miał dać prompt. Włosy bez własnej domeny
   *  (jak u Gniewki/Witka), skóra własną, ciasną rampą. */
  sobek: {
    key: "sobek-portrait",
    path: "assets/characters/sobek_portrait.png",
  },
  /** Agata — siódma z ósemki, `tools/build_agata.py`. Chusta/fartuch
   *  (chłodna szarość) i suknia (ciepła ochra) mają na tyle różne odcienie,
   *  że najbliższy-sąsiad po całej palecie trafia poprawnie bez dzielenia
   *  po pozycji — w odróżnieniu od Sobka. Pojedynczy kosmyk włosów spod
   *  chusty dzieli rampę z suknią (`piasek`), bez kolizji. Skóra własną,
   *  ciasną rampą. */
  agata: {
    key: "agata-portrait",
    path: "assets/characters/agata_portrait.png",
  },
  /** Dobrawa — ósma i ostatnia z ósemki, `tools/build_dobrawa.py`. ⚠ Jej
   *  jasnozielony kirtel jest na tyle bliski chroma-key zieleni tła, że
   *  stara heurystyka „resztek po nasyceniu" (używana we wszystkich
   *  poprzednich generatorach) zjadała całą spódnicę jako tło — poprawka:
   *  ciasny próg odległości do koloru tła zamiast reguły po dominacji G.
   *  Zobacz nagłówek skryptu. Włosy/warkocz/buty dzielą jedną rampę
   *  (`drewno`) — ten sam materiał w dwóch miejscach kadru. */
  dobrawa: {
    key: "dobrawa-portrait",
    path: "assets/characters/dobrawa_portrait.png",
  },
  /** Patryczek — `tools/build_patryczek.py`, from `patryczek.png`
   *  (`docs/prompty_gemini.md`). Same crop+recolor treatment as Zofia/Kuba. */
  patryczek: {
    key: "patryczek-portrait",
    path: "assets/characters/patryczek_portrait.png",
  },
  /**
   * Simplified map overviews for the PlayerPanel "Mapa" tab —
   * `tools/build_minimap.py`, one flat-colour block per tile read straight
   * from the map's own `.tmj` (so a hand-edit in Tiled shows up here too,
   * once the script is re-run — same "the `.tmj` is the source of truth"
   * caveat as everywhere else maps are involved). Static images; the
   * player's live position is drawn on top by `PlayerPanel`, not baked in.
   */
  minimapForest: {
    key: "minimap-forest",
    path: "assets/maps/forest_minimap.png",
  },
  minimapVillage: {
    key: "minimap-village",
    path: "assets/maps/village_minimap.png",
  },
  minimapThicket: {
    key: "minimap-thicket",
    path: "assets/maps/thicket_minimap.png",
  },
  /**
   * items.png (640×960) — weapon/armor icons. Verified a true 32×32 grid, ZERO
   * gap between tiles (unlike Nature.png's 33px pitch) — confirmed by an
   * alpha-scan finding content right up to the 32px cell edge with nothing
   * bleeding past it. So each icon is a plain `col*32, row*32` block copy, no
   * separator math needed. Only a curated subset is wired up (see
   * `public/assets/README.md` for the full sheet layout notes and how the
   * (col,row) picks below were chosen).
   */
  items: {
    key: "items",
    path: "assets/items/items.png",
    tile: 32,
  },
  // Reserved for later maps — not used by the MVP.
  /**
   * Building parts (logs, roof, doors, windows). Measured from the Tiled
   * export rather than guessed: 640×640, **19 columns × 19 rows, 32px tiles on
   * a 33px pitch (1px spacing, 0 margin)** — exactly Nature.png's layout, so
   * anything written for that sheet's geometry applies here too.
   *
   * Unlike every other sheet we never slice this one by hand: it is used only
   * through Tiled, which resolves tile indices itself. We just have to LOAD it
   * and bind it to the tileset of the same name (see TiledMap).
   */
  buildings: { key: "buildings", path: "assets/Buildings.png", tile: 32 },
  /**
   * Forge/smithy equipment (piec, kowadło, koła szlifierskie, stojaki…) —
   * same deal as `buildings` above: 32px tiles on a 33px pitch, used only
   * through Tiled (bound to the "Kuznia" tileset by name), never sliced by
   * hand. See docs/kuznia.json and tools/build_kuznia.py.
   */
  kuznia: { key: "kuznia", path: "assets/Kuznia.png", tile: 32 },
  /**
   * Crops (`tools/build_pole.py`) — ploughed earth, cabbage, grain and root
   * vegetables in successive growth stages. Same convention as every other
   * Tiled sheet: **measured**, not assumed — 461×395, 14 columns × 12 rows,
   * 32px tiles on a 33px pitch, 163 of the 168 cells filled, gap columns
   * verified fully transparent (max alpha 0).
   *
   * **No map paints these yet**, and it is loaded anyway on purpose. A tileset
   * this file doesn't know is skipped with a warning and its tiles simply
   * don't draw (see TiledMap's TILESET_TEXTURES) — so the failure mode of
   * *not* registering it is somebody spending an evening painting fields in
   * Tiled and finding an empty map, which is exactly the silent-trap class
   * this codebase keeps paying for.
   *
   * ⚠ The `-over` half is NOT usable yet. `build_pole.py` writes the tall
   * plants' upper halves as 17 loose `pole_over_NN.png` files of natural size
   * (8–24px tall, and some 33–35px WIDE, i.e. wider than a tile), not as a
   * sheet — and Phaser's tileset model is one image per tileset, so a Tiled
   * "collection of images" cannot be bound here at all. Tall grain therefore
   * cannot be walked behind until those are packed into their own 33px-pitch
   * sheet *and* their ground-tile pairing (`pary` in the generator) is
   * exported as a catalog, the way `docs/budynki.json` does it. Low crops
   * (earth, cabbage, roots) need none of that and work today.
   */
  pole: { key: "pole", path: "assets/pole_tileset.png", tile: 32 },
  /**
   * Roadside furniture (`tools/build_znaki.py`) — signposts, notice boards,
   * wayside crosses, a scarecrow, a washing line. **128×128, a clean 4×4 grid
   * of 32px tiles with NO gap** (unlike Nature/Teren's 33px pitch), 27 colours,
   * all of them from `docs/paleta.json`.
   *
   * Wired in because the two map gates finally paint from it: the arrow
   * signpost (row 0, col 0) is the scenery half of marking a transition — the
   * half that makes the world look right, as opposed to `PORTAL.marker`, which
   * is the half that teaches the player. It sat generated-but-unloaded for a
   * while, exactly like `pole_tileset` did, and this closes that.
   */
  znaki: { key: "znaki", path: "assets/znaki.png", tile: 32 },
  indoor: { key: "indoor", path: "assets/Indoor.png", tile: 32 },
} as const;

/**
 * **Every "one static image per Tiled point" decoration, in ONE table.**
 *
 * Each of these used to be its own `<name>Spawns` field on
 * `TiledBuiltMap`, its own `else if` in `TiledMap.readSpawns`, its own
 * optional field on `GameScene.buildWorld`'s return type and its own
 * near-identical `for` loop in `GameScene.create()` — four edits in two
 * files per prop, none of which fails loudly when you forget one. Three
 * props were survivable; adding four more in one sitting made it exactly
 * the situation `NPC_OBJECT_NAMES` was created to end (see its comment in
 * `TiledMap.ts`). Now: add a row here, and both the map reader and the
 * scene pick it up with no other change.
 *
 * `names` are the Tiled object names that produce it (English + Polish,
 * same reason as `NPC_OBJECT_NAMES`), and every one is drawn the same way
 * — origin (0.5, 1) so the authored point is where the prop meets the
 * ground, depth `DEPTH.entities + y` so it Y-sorts with everything else.
 *
 * ⚠ This is for STATIC IMAGES ONLY. Anything with behaviour keeps its own
 * spawn path: `Bird` self-schedules hops, `FarmAnimal`/`Critter` need a
 * per-frame `update()`, `Well` carries a collider. A prop that later grows
 * any of those has to move OUT of this table, not gain a flag in it.
 */
/**
 * `renderLayer` — added 2026-08-31 (rendering architecture ETAP 1A), driven
 * by the measured per-variant height audit (real PNG heights vs the 31×60
 * player frame, cross-referenced with actual spawn counts in
 * `forrest.tmj`), NOT by category name — a `kamien_glaz_*` boulder measures
 * taller than most `krzew_*` bushes, which is exactly why this is tagged
 * per FILE, never per family.
 *
 * - `"ysorted"` — must compare depth against the player/enemies every frame
 *   (tall enough that a player walking behind it would visibly clip in
 *   front). Instantiated into the `Y_SORTED_WORLD` Layer — see
 *   `core/YSortedWorld.ts` and `GameScene`'s decor spawn loop.
 * - `"background"` — stays in the scene's own default display list, exactly
 *   like today: one `Image`, depth set once, never resorted. This is ALSO
 *   the tag for every variant the audit left "wymaga testu wizualnego"
 *   (`krzew_kopula_sredni`/`krzew_chrust`/`krzew_suchy`/`kamien_sredni_*`) —
 *   tagging them `"background"` changes NOTHING about their behaviour this
 *   step (no chunking/baking exists yet), so it costs nothing to wait for a
 *   real in-engine look before ever moving them to `"ysorted"`. Do not
 *   read `"background"` here as "confirmed safe" for those four — read the
 *   inline comment.
 */
export type DecorRenderLayer = "background" | "ysorted";

export const DECOR_PROPS = {
  driedHide: { names: ["suszona_skora", "dried_hide", "skora"], asset: ASSETS.driedHide, renderLayer: "background" },
  haystack: { names: ["stog_siana", "haystack", "stog"], asset: ASSETS.haystack, renderLayer: "background" },
  scarecrow: { names: ["strach", "scarecrow", "strach_na_wroble"], asset: ASSETS.scarecrow, renderLayer: "background" },
  stump: { names: ["pniak", "stump", "pniak_z_siekiera"], asset: ASSETS.stump, renderLayer: "background" },
  mushrooms: { names: ["grzyby", "mushrooms"], asset: ASSETS.mushrooms, renderLayer: "background" },
  // Forest-economy wood decor (2026-09-07) — see ASSETS.woodpileSmall above
  // for the sourcing/scale story. Heights measured against the 31x60 player
  // frame, same method as the stump/stone/bush audit: 34px/57% and 38px/63%
  // stay background (in the same band as beechStumpFresh/Weathered at
  // 58-60%, which also stayed background); 46px/77% and 40px/67% go
  // ysorted (past the ~75%/60px-threshold band that pushed beechStumpOld
  // and bushDomeLarge to ysorted). logHorizontal lies flat — its bbox height
  // is a branch stub, not a wall a player could walk behind — background.
  woodpileSmall: { names: ["stos_maly", "woodpile_small"], asset: ASSETS.woodpileSmall, renderLayer: "background" },
  woodpileLarge: { names: ["stos_duzy", "woodpile_large"], asset: ASSETS.woodpileLarge, renderLayer: "ysorted" },
  logsLoose: { names: ["kupka_klod", "logs_loose"], asset: ASSETS.logsLoose, renderLayer: "background" },
  logsScattered: { names: ["klody_rozsypane", "logs_scattered"], asset: ASSETS.logsScattered, renderLayer: "ysorted" },
  logHorizontal: { names: ["dluzyca_pozioma", "log_horizontal"], asset: ASSETS.logHorizontal, renderLayer: "background" },
  logVertical: { names: ["dluzyca_pionowa", "log_vertical"], asset: ASSETS.logVertical, renderLayer: "background" },
  pondEdge: { names: ["brzeg_stawu", "pond_edge"], asset: ASSETS.pondEdge, renderLayer: "background" },
  lilyPad: { names: ["lilia", "lilia_wodna", "lily_pad"], asset: ASSETS.lilyPad, renderLayer: "background" },
  beehiveA: { names: ["ul_a", "ul", "beehive_a"], asset: ASSETS.beehiveA, renderLayer: "background" },
  beehiveB: { names: ["ul_b", "beehive_b"], asset: ASSETS.beehiveB, renderLayer: "background" },
  beehiveC: { names: ["ul_c", "beehive_c"], asset: ASSETS.beehiveC, renderLayer: "background" },
  hopPole: { names: ["chmiel", "hop_pole"], asset: ASSETS.hopPole, renderLayer: "ysorted" },
  // Oak stump test batch (2026-08-30) — three decay states of the same
  // stump, see ASSETS.oakStumpFresh above. Distinct from the older generic
  // `stump` row: that one stays wired to `pniak`/`stump` so existing map
  // objects keep drawing the old art untouched.
  // Oak: 33–35px (55–58% of player) — below the audit's Y-SORTED band.
  oakStumpFresh: {
    names: ["dab_pniak_swiezy", "oak_stump_fresh"],
    asset: ASSETS.oakStumpFresh,
    renderLayer: "background",
  },
  oakStumpWeathered: {
    names: ["dab_pniak_zwietrzaly", "oak_stump_weathered"],
    asset: ASSETS.oakStumpWeathered,
    renderLayer: "background",
  },
  oakStumpOld: {
    names: ["dab_pniak_stary", "oak_stump_old"],
    asset: ASSETS.oakStumpOld,
    renderLayer: "background",
  },
  // Birch: 21px (35%) — clearly background.
  birchStumpFresh: {
    names: ["brzoza_pniak_swiezy", "birch_stump_fresh"],
    asset: ASSETS.birchStumpFresh,
    renderLayer: "background",
  },
  birchStumpWeathered: {
    names: ["brzoza_pniak_zwietrzaly", "birch_stump_weathered"],
    asset: ASSETS.birchStumpWeathered,
    renderLayer: "background",
  },
  birchStumpOld: {
    names: ["brzoza_pniak_stary", "birch_stump_old"],
    asset: ASSETS.birchStumpOld,
    renderLayer: "background",
  },
  // Spruce: 18–21px (30–35%) — clearly background.
  spruceStumpFresh: {
    names: ["swierk_pniak_swiezy", "spruce_stump_fresh"],
    asset: ASSETS.spruceStumpFresh,
    renderLayer: "background",
  },
  spruceStumpWeathered: {
    names: ["swierk_pniak_zwietrzaly", "spruce_stump_weathered"],
    asset: ASSETS.spruceStumpWeathered,
    renderLayer: "background",
  },
  spruceStumpOld: {
    names: ["swierk_pniak_stary", "spruce_stump_old"],
    asset: ASSETS.spruceStumpOld,
    renderLayer: "background",
  },
  // Beech: fresh/weathered 35–36px (58–60%) stay background; `_old` alone
  // is 45px (75%) — see `beechStumpOld` below, tagged `"ysorted"`.
  beechStumpFresh: {
    names: ["buk_pniak_swiezy", "beech_stump_fresh"],
    asset: ASSETS.beechStumpFresh,
    renderLayer: "background",
  },
  beechStumpWeathered: {
    names: ["buk_pniak_zwietrzaly", "beech_stump_weathered"],
    asset: ASSETS.beechStumpWeathered,
    renderLayer: "background",
  },
  beechStumpOld: {
    names: ["buk_pniak_stary", "beech_stump_old"],
    asset: ASSETS.beechStumpOld,
    renderLayer: "ysorted",
  },
  // Grab (hornbeam): 25–29px (42–48%) — background.
  grabStumpFresh: {
    names: ["grab_pniak_swiezy", "grab_stump_fresh"],
    asset: ASSETS.grabStumpFresh,
    renderLayer: "background",
  },
  grabStumpWeathered: {
    names: ["grab_pniak_zwietrzaly", "grab_stump_weathered"],
    asset: ASSETS.grabStumpWeathered,
    renderLayer: "background",
  },
  grabStumpOld: {
    names: ["grab_pniak_stary", "grab_stump_old"],
    asset: ASSETS.grabStumpOld,
    renderLayer: "background",
  },
  // Alder: 30–34px (50–57%) — background.
  alderStumpFresh: {
    names: ["olcha_pniak_swiezy", "alder_stump_fresh"],
    asset: ASSETS.alderStumpFresh,
    renderLayer: "background",
  },
  alderStumpWeathered: {
    names: ["olcha_pniak_zwietrzaly", "alder_stump_weathered"],
    asset: ASSETS.alderStumpWeathered,
    renderLayer: "background",
  },
  alderStumpOld: {
    names: ["olcha_pniak_stary", "alder_stump_old"],
    asset: ASSETS.alderStumpOld,
    renderLayer: "background",
  },
  // Willow: 44–52px (73–87%) — the tallest stumps in the game. ysorted.
  willowStumpFresh: {
    names: ["wierzba_pniak_swiezy", "willow_stump_fresh"],
    asset: ASSETS.willowStumpFresh,
    renderLayer: "ysorted",
  },
  willowStumpWeathered: {
    names: ["wierzba_pniak_zwietrzaly", "willow_stump_weathered"],
    asset: ASSETS.willowStumpWeathered,
    renderLayer: "ysorted",
  },
  willowStumpOld: {
    names: ["wierzba_pniak_stary", "willow_stump_old"],
    asset: ASSETS.willowStumpOld,
    renderLayer: "ysorted",
  },
  // Beech TREE test entries USUNIĘTE (ETAP4, 2026-08-31) — nowy buk jest teraz
  // w atlasie stempli (`TreeStamps`/`TreeStampsBig`), renderowany jak każde
  // inne drzewo (pień/korona, depth per-drzewo). Nie ma już buka w DECOR_PROPS.
  // Decorative stones — the forest's ONLY rock system since the ETAP 3
  // migration (2026-08-31) retired the old `kamienie.png`/`rockSpawns`/
  // `ROCK_OBJECT_NAMES` path. 23 variants (drobny/maly/sredni/duzy/glaz),
  // see ASSETS.stoneDrobny01 above. Plain `DECOR_PROPS` set-dressing: one
  // static image per Tiled point, no physics body, no interaction. Placed on
  // the `kamienie` object layer (name reused; it is the new system now).
  // See `docs/katalog_assetow.md` §1.5.
  // `drobny`/`maly`: 13–22px (22–37% of player) — background.
  stoneDrobny01: { names: ["kamien_drobny_01", "stone_drobny_01"], asset: ASSETS.stoneDrobny01, renderLayer: "background" },
  stoneDrobny02: { names: ["kamien_drobny_02", "stone_drobny_02"], asset: ASSETS.stoneDrobny02, renderLayer: "background" },
  stoneDrobny04: { names: ["kamien_drobny_04", "stone_drobny_04"], asset: ASSETS.stoneDrobny04, renderLayer: "background" },
  stoneDrobny06: { names: ["kamien_drobny_06", "stone_drobny_06"], asset: ASSETS.stoneDrobny06, renderLayer: "background" },
  stoneMaly02: { names: ["kamien_maly_02", "stone_maly_02"], asset: ASSETS.stoneMaly02, renderLayer: "background" },
  stoneMaly04: { names: ["kamien_maly_04", "stone_maly_04"], asset: ASSETS.stoneMaly04, renderLayer: "background" },
  stoneMaly05: { names: ["kamien_maly_05", "stone_maly_05"], asset: ASSETS.stoneMaly05, renderLayer: "background" },
  stoneMaly08: { names: ["kamien_maly_08", "stone_maly_08"], asset: ASSETS.stoneMaly08, renderLayer: "background" },
  stoneMaly12: { names: ["kamien_maly_12", "stone_maly_12"], asset: ASSETS.stoneMaly12, renderLayer: "background" },
  stoneMaly15: { names: ["kamien_maly_15", "stone_maly_15"], asset: ASSETS.stoneMaly15, renderLayer: "background" },
  // `sredni`: 25–35px (42–58%), spans the audit's threshold WITHIN the
  // family (sredni_01=25px vs sredni_07=35px) — left in the current
  // mechanism ("background" here, unchanged behaviour) pending a visual
  // test, exactly as instructed. Do not read this tag as "confirmed".
  stoneSredni01: { names: ["kamien_sredni_01", "stone_sredni_01"], asset: ASSETS.stoneSredni01, renderLayer: "background" },
  stoneSredni02: { names: ["kamien_sredni_02", "stone_sredni_02"], asset: ASSETS.stoneSredni02, renderLayer: "background" },
  stoneSredni06: { names: ["kamien_sredni_06", "stone_sredni_06"], asset: ASSETS.stoneSredni06, renderLayer: "background" },
  stoneSredni07: { names: ["kamien_sredni_07", "stone_sredni_07"], asset: ASSETS.stoneSredni07, renderLayer: "background" },
  stoneSredni09: { names: ["kamien_sredni_09", "stone_sredni_09"], asset: ASSETS.stoneSredni09, renderLayer: "background" },
  stoneSredni11: { names: ["kamien_sredni_11", "stone_sredni_11"], asset: ASSETS.stoneSredni11, renderLayer: "background" },
  // `duzy`: 36–42px (60–70%) — ysorted.
  stoneDuzy01: { names: ["kamien_duzy_01", "stone_duzy_01"], asset: ASSETS.stoneDuzy01, renderLayer: "ysorted" },
  stoneDuzy02: { names: ["kamien_duzy_02", "stone_duzy_02"], asset: ASSETS.stoneDuzy02, renderLayer: "ysorted" },
  stoneDuzy05: { names: ["kamien_duzy_05", "stone_duzy_05"], asset: ASSETS.stoneDuzy05, renderLayer: "ysorted" },
  stoneDuzy06: { names: ["kamien_duzy_06", "stone_duzy_06"], asset: ASSETS.stoneDuzy06, renderLayer: "ysorted" },
  // `glaz`: 46–48px (77–80%) — taller than any bush in the game. ysorted,
  // no exceptions ("kamień ≠ niski").
  stoneGlaz01: { names: ["kamien_glaz_01", "stone_glaz_01"], asset: ASSETS.stoneGlaz01, renderLayer: "ysorted" },
  stoneGlaz02: { names: ["kamien_glaz_02", "stone_glaz_02"], asset: ASSETS.stoneGlaz02, renderLayer: "ysorted" },
  stoneGlaz03: { names: ["kamien_glaz_03", "stone_glaz_03"], asset: ASSETS.stoneGlaz03, renderLayer: "ysorted" },
  // Decorative bushes (2026-08-30) — see ASSETS.bushDomeSmall above. Pure
  // set-dressing, no interaction, no physics body — same convention as the
  // stones and the earlier decor test props.
  bushDomeSmall: { names: ["krzew_kopula_maly", "bush_dome_small"], asset: ASSETS.bushDomeSmall, renderLayer: "background" },
  // 36px/60% — audit flagged "wymaga testu"; background (unchanged) until then.
  bushDomeMedium: { names: ["krzew_kopula_sredni", "bush_dome_medium"], asset: ASSETS.bushDomeMedium, renderLayer: "background" },
  bushDomeLarge: { names: ["krzew_kopula_duzy", "bush_dome_large"], asset: ASSETS.bushDomeLarge, renderLayer: "ysorted" },
  bushDomeBerry: { names: ["krzew_jagodowy", "bush_dome_berry"], asset: ASSETS.bushDomeBerry, renderLayer: "ysorted" },
  bushDomeFlower: { names: ["krzew_kwitnacy", "bush_dome_flower"], asset: ASSETS.bushDomeFlower, renderLayer: "ysorted" },
  bushDomeOlive: { names: ["krzew_kopula_oliwkowy", "bush_dome_olive"], asset: ASSETS.bushDomeOlive, renderLayer: "ysorted" },
  bushTwiggyBareLeaf: { names: ["krzew_galezisty", "bush_twiggy_bare_leaf"], asset: ASSETS.bushTwiggyBareLeaf, renderLayer: "ysorted" },
  bushTwiggyBerry: { names: ["krzew_galezisty_jagodowy", "bush_twiggy_berry"], asset: ASSETS.bushTwiggyBerry, renderLayer: "ysorted" },
  // 40px/67% — audit flagged "wymaga testu" (sparse twiggy silhouette may
  // occlude less than its bounding box suggests); background until tested.
  bushTwiggyBare: { names: ["krzew_suchy", "bush_twiggy_bare"], asset: ASSETS.bushTwiggyBare, renderLayer: "background" },
  bushLowWide: { names: ["krzew_niski", "bush_low_wide"], asset: ASSETS.bushLowWide, renderLayer: "background" },
  // 32px/53% — audit flagged "wymaga testu"; background until tested.
  bushLowSticks: { names: ["krzew_chrust", "bush_low_sticks"], asset: ASSETS.bushLowSticks, renderLayer: "background" },
  // Water/shore vegetation (2026-08-30) — see ASSETS.cattailLarge above.
  // Pure decoration, no gathering — deliberately NOT part of `HERBS`.
  // Tall reeds (46–54px / 77–90%) and the small pair (35–36px / 58–60%,
  // treated cautiously per the audit) — all ysorted.
  cattailLarge: { names: ["palka_duza", "cattail_large"], asset: ASSETS.cattailLarge, renderLayer: "ysorted" },
  cattailMedium: { names: ["palka_srednia", "cattail_medium"], asset: ASSETS.cattailMedium, renderLayer: "ysorted" },
  cattailSmall: { names: ["palka_mala", "cattail_small"], asset: ASSETS.cattailSmall, renderLayer: "ysorted" },
  reedPlumeLarge: { names: ["trzcina_duza", "reed_plume_large"], asset: ASSETS.reedPlumeLarge, renderLayer: "ysorted" },
  reedPlumeSmall: { names: ["trzcina_mala", "reed_plume_small"], asset: ASSETS.reedPlumeSmall, renderLayer: "ysorted" },
  // marsh_tuft_01 (31px/52%) is the tallest of its family, close enough to
  // the rest of the "background" band that it was flagged borderline —
  // kept ysorted per the explicit call to err toward Y-SORTED there.
  marshTuft01: { names: ["kepa_bagienna_01", "marsh_tuft_01"], asset: ASSETS.marshTuft01, renderLayer: "ysorted" },
  marshTuft02: { names: ["kepa_bagienna_02", "marsh_tuft_02"], asset: ASSETS.marshTuft02, renderLayer: "background" },
  marshTuft03: { names: ["kepa_bagienna_03", "marsh_tuft_03"], asset: ASSETS.marshTuft03, renderLayer: "background" },
  marshTuft04: { names: ["kepa_bagienna_04", "marsh_tuft_04"], asset: ASSETS.marshTuft04, renderLayer: "background" },
  marshTuft05: { names: ["kepa_bagienna_05", "marsh_tuft_05"], asset: ASSETS.marshTuft05, renderLayer: "background" },
  marshTuft06: { names: ["kepa_bagienna_06", "marsh_tuft_06"], asset: ASSETS.marshTuft06, renderLayer: "background" },
  shorePlant01: { names: ["roslina_brzegowa_01", "shore_plant_01"], asset: ASSETS.shorePlant01, renderLayer: "background" },
  shorePlant02: { names: ["roslina_brzegowa_02", "shore_plant_02"], asset: ASSETS.shorePlant02, renderLayer: "background" },
  shorePlant03: { names: ["roslina_brzegowa_03", "shore_plant_03"], asset: ASSETS.shorePlant03, renderLayer: "background" },
  shorePlant04: { names: ["roslina_brzegowa_04", "shore_plant_04"], asset: ASSETS.shorePlant04, renderLayer: "background" },
  shorePlant05: { names: ["roslina_brzegowa_05", "shore_plant_05"], asset: ASSETS.shorePlant05, renderLayer: "background" },
  shorePlant06: { names: ["roslina_brzegowa_06", "shore_plant_06"], asset: ASSETS.shorePlant06, renderLayer: "background" },
} satisfies Record<string, DecorPropDef>;

/**
 * Named separately from the inline `satisfies` shape so `GameScene`'s decor
 * loop can cast `Object.entries(DECOR_PROPS)` to THIS (wide, uniform) type
 * instead of `(typeof DECOR_PROPS)[DecorId]` (narrow, per-entry-literal —
 * `satisfies` proves conformance without widening the const's own inferred
 * type, so the union of 91 individual object-literal shapes is what code
 * elsewhere actually sees unless it opts into this one explicitly). Reading
 * `.asset.frame` needs the field to exist on every union member; this is
 * where that's true.
 */
export interface DecorPropDef {
  readonly names: readonly string[];
  // `frame` is optional so this one shape covers BOTH a standalone
  // `load.image` texture (`key` + `path`, no `frame`) and an atlas-packed
  // one (`key` = atlas key, `frame` = frame name inside it, `path` absent —
  // see `forestDecorAtlas`/`waterFloraAtlas` in ASSETS, 2026-08-31 atlasing).
  // `path` itself is never required here: DECOR_PROPS/GameScene never read
  // it, only `Assets.ts`'s loader does, on whichever ASSETS entries still
  // have it.
  readonly asset: { readonly key: string; readonly frame?: string };
  readonly renderLayer: DecorRenderLayer;
}

export type DecorId = keyof typeof DECOR_PROPS;

/**
 * Akcje bojowe jako DANE (Faza 2 Combat v2) — jedno miejsce, w którym każdy
 * atak w grze opisany jest tym samym kształtem.
 *
 * ⚠ **Żadna z tych liczb nie jest tu wpisana ponownie** — wszystkie czytają z
 * bloków gatunków wyżej. Druga kopia `windupMs` rozjechałaby się z pierwszą
 * przy pierwszym strojeniu, a diff by tego nie pokazał.
 *
 * ⚠ **`cooldownMs` bywa nadpisywany PER PRÓBĘ** przez wołającego: sieciarz
 * dorzuca losowy jitter, Szary w szale skraca przerwę mnożnikiem. To są
 * własności STANU stworzenia, nie akcji, więc nie mieszkają tutaj.
 *
 * ⚠ **`ownsBody` i `attackerRecoil` to DWIE NIEZALEŻNE decyzje** i wypełnia
 * się je osobno. Pierwsza mówi, czy ciałem steruje sama akcja; druga, czy
 * trafienie kopie napastnikiem. Wiąże je jeden kierunek: `ownsBody: true`
 * wymusza `attackerRecoil: "none"` (dwa systemy ruchu w jednej klatce), ale
 * `ownsBody: false` **niczego nie przesądza** — patrz `spiderWeb`, która
 * ciałem nie steruje i mimo to nie kopie. Pilnuje §M2 w
 * `tools/combat_regresja.mjs`.
 */
export const AKCJE = {
  /** Kęs rozjuszonego królika. Rozstrzyga się w jednym momencie. */
  rabbitBite: {
    id: "rabbit_bite",
    // ⚠ Kęs wymaga ZATRZYMANIA się (`resolveAttack` wychodzi na `isMoving`) —
    // patrz reguła o uciekającym królu w `src/entities/CLAUDE.md`.
    ownsBody: false,
    // Zwarcie: królik odbija się od tego, w co wgryzł.
    attackerRecoil: "onHit",
    // kęs w miejscu — wypad JEST tu całym gestem ataku
    attackerLunge: "onAttack",
    windupMs: RABBIT.bite.windupMs,
    activeMs: 0,
    recoveryMs: RABBIT.bite.recoverMs,
    cooldownMs: RABBIT.bite.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: RABBIT.touchDamageMin,
    damageMax: RABBIT.touchDamageMax,
    damageType: RABBIT.touchDamageType,
    telegraphTint: RABBIT.bite.windupTint,
  },
  /** Plunięcie siecią. ⚠ `recoveryMs: 0` — sieciarz wraca do trzymania pasa
   *  ognia natychmiast; jego bezbronnością jest sam cooldown, nie pauza. */
  spiderWeb: {
    id: "spider_web",
    // Sieciarz strzela stojąc — pocisk leci, ciało nie.
    ownsBody: false,
    // ⚠ **JEDYNA akcja bez `ownsBody`, która mimo to NIE kopie — i to jest
    // powód, dla którego `attackerRecoil` w ogóle istnieje jako osobne pole.**
    // Trafienie zachodzi tam, gdzie doleci pocisk, i wtedy, gdy doleci: kilka
    // kafli i kilkaset ms od pająka. Kopnięcie „od trafienia" szarpnęłoby jego
    // ciałem za zdarzenie, w którym to ciało nie brało udziału.
    //
    // ⚠ Odrzut od SAMEGO WYSTRZAŁU jest osobnym, dopuszczalnym pomysłem — ale
    // należy do chwili wypuszczenia pocisku, nie jego trafienia. Wchodziłby
    // jako nowa wartość (`"onRelease"`), nie przez zmianę tej.
    attackerRecoil: "none",
    // strzela z dystansu — ciało nie ma dokąd wypaść
    attackerLunge: "none",
    windupMs: SPIDER.ranged.windupMs,
    activeMs: 0,
    recoveryMs: 0,
    cooldownMs: SPIDER.ranged.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: WEB_PROJECTILE.damageMin,
    damageMax: WEB_PROJECTILE.damageMax,
    damageType: WEB_PROJECTILE.damageType,
    telegraphTint: SPIDER.ranged.telegraphTint,
  },
  /**
   * Kęs Szarego. ⚠ `recoveryMs` obejmuje ODSKOK **i** bezbronność — runner nie
   * zna ruchu, więc encja odgrywa odskok wewnątrz pierwszych `backstepMs`
   * odzyskiwania. W szale odskoku nie ma, ale czas zostaje ten sam: drugi akt
   * odbiera GRUNT, nie tempo.
   */
  greyBite: {
    id: "grey_bite",
    // ⚠ Ciałem steruje `GreyWolf.enterBackstep`, wołane NATYCHMIAST po
    // rozstrzygnięciu kęsa.
    ownsBody: true,
    // Wymuszone niezmiennikiem: generyczne kopnięcie nakładałoby się na odskok.
    attackerRecoil: "none",
    // ownsBody: odskok zaraz po rozstrzygnięciu prowadzi ciało
    attackerLunge: "none",
    windupMs: GREY_WOLF.duel.windupMs,
    activeMs: 0,
    recoveryMs: GREY_WOLF.duel.backstepMs + WOLF.pack.recoverMs,
    cooldownMs: GREY_WOLF.duel.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: GREY_WOLF.duel.biteDamageMin,
    damageMax: GREY_WOLF.duel.biteDamageMax,
    damageType: GREY_WOLF.duel.biteDamageType,
    telegraphTint: GREY_WOLF.duel.windupTint,
  },
  /**
   * Wypad wilka. ⚠ `windupMs: 0` — **bez telegrafu, celowo**: groźbą watahy
   * jest liczba ataków, nie jeden czytelny zamach. `activeMs` to LIMIT lotu, a
   * nie jego długość; kończy go `endActive`, gdy wilk dojedzie albo uderzy w
   * teren.
   */
  wolfLunge: {
    id: "wolf_lunge",
    // ⚠ Wypad pisze prędkość co klatkę przez cały `active` (`Wolf.ts`).
    ownsBody: true,
    // Wymuszone niezmiennikiem: ciało już jedzie, drugi system by je szarpał.
    attackerRecoil: "none",
    // ownsBody: wypad JEST ruchem przez przestrzeń
    attackerLunge: "none",
    windupMs: 0,
    activeMs: WOLF.pack.lungeMs,
    recoveryMs: WOLF.pack.recoverMs,
    cooldownMs: WOLF.pack.lungeCooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: WOLF.touchDamageMin,
    damageMax: WOLF.touchDamageMax,
    damageType: WOLF.touchDamageType,
  },
  /** Szarża dzika — jedyna akcja z DŁUGIM telegrafem i lotem przez przestrzeń. */
  boarCharge: {
    id: "boar_charge",
    // ⚠ Szarża pisze prędkość co klatkę przez cały `active` (`Boar.ts`).
    ownsBody: true,
    // Wymuszone niezmiennikiem: ciało już jedzie, drugi system by je szarpał.
    attackerRecoil: "none",
    // ownsBody: szarża pisze prędkość co klatkę
    attackerLunge: "none",
    windupMs: BOAR.charge.telegraphMs,
    activeMs: BOAR.charge.durationMs,
    recoveryMs: BOAR.charge.recoverMs,
    cooldownMs: BOAR.charge.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BOAR.charge.damageMin,
    damageMax: BOAR.charge.damageMax,
    damageType: BOAR.charge.damageType,
    telegraphTint: 0xff6a3a,
  },
  /**
   * Zamach łapą niedźwiedzia. ⚠ Jedyna akcja w grze rozstrzygana **w ŁUKU**, a
   * nie samym dystansem — patrz `BEAR.swipe`. Runner tego nie wie i nie musi:
   * kształt trafienia należy do encji, runner prowadzi tylko przebieg.
   */
  deerRam: {
    id: "deer_ram",
    ownsBody: false,
    attackerRecoil: "onHit",
    attackerLunge: "onAttack",
    windupMs: DEER.ram.windupMs,
    activeMs: 0,
    recoveryMs: DEER.ram.recoverMs,
    cooldownMs: DEER.ram.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: DEER.touchDamageMin,
    damageMax: DEER.touchDamageMax,
    damageType: DEER.touchDamageType,
    telegraphTint: DEER.ram.windupTint,
  },
  foxBite: {
    id: "fox_bite",
    ownsBody: false,
    attackerRecoil: "onHit",
    attackerLunge: "onAttack",
    windupMs: FOX.bite.windupMs,
    activeMs: 0,
    recoveryMs: FOX.bite.recoverMs,
    cooldownMs: FOX.bite.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: FOX.touchDamageMin,
    damageMax: FOX.touchDamageMax,
    damageType: FOX.touchDamageType,
    telegraphTint: FOX.bite.windupTint,
  },
  bearSwipe: {
    id: "bear_swipe",
    // Zamach w miejscu — niedźwiedź nie rusza się przez cios.
    ownsBody: false,
    // Zwarcie: łapa trafia tam, gdzie stoi bestia, więc kopnięcie jest jedynym
    // przesunięciem w tym oknie.
    attackerRecoil: "onHit",
    // zamach łapą w miejscu
    attackerLunge: "onAttack",
    windupMs: BEAR.swipe.windupMs,
    activeMs: 0,
    recoveryMs: BEAR.swipe.recoveryMs,
    cooldownMs: BEAR.swipe.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BEAR.touchDamageMin,
    damageMax: BEAR.touchDamageMax,
    damageType: BEAR.touchDamageType,
    telegraphTint: BEAR.swipe.windupTint,
  },

  /** Zamach zbója (`OI-171`) — ten sam kształt co `bearSwipe`: w miejscu, telegraf tintem. */
  banditClubSwing: {
    id: "bandit_club_swing",
    ownsBody: false,
    attackerRecoil: "onHit",
    attackerLunge: "onAttack",
    windupMs: BANDIT_CLUB.swing.windupMs,
    activeMs: 0,
    recoveryMs: BANDIT_CLUB.swing.recoveryMs,
    cooldownMs: BANDIT_CLUB.swing.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BANDIT_CLUB.touchDamageMin,
    damageMax: BANDIT_CLUB.touchDamageMax,
    damageType: BANDIT_CLUB.touchDamageType,
    telegraphTint: BANDIT_CLUB.swing.windupTint,
  },
  /** Zamach zbója (`OI-171`) — ten sam kształt co `bearSwipe`: w miejscu, telegraf tintem. */
  banditAxeSwing: {
    id: "bandit_axe_swing",
    ownsBody: false,
    attackerRecoil: "onHit",
    attackerLunge: "onAttack",
    windupMs: BANDIT_AXE.swing.windupMs,
    activeMs: 0,
    recoveryMs: BANDIT_AXE.swing.recoveryMs,
    cooldownMs: BANDIT_AXE.swing.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BANDIT_AXE.touchDamageMin,
    damageMax: BANDIT_AXE.touchDamageMax,
    damageType: BANDIT_AXE.touchDamageType,
    telegraphTint: BANDIT_AXE.swing.windupTint,
  },
  /** Zamach zbója (`OI-171`) — ten sam kształt co `bearSwipe`: w miejscu, telegraf tintem. */
  banditChiefSwing: {
    id: "bandit_chief_swing",
    ownsBody: false,
    attackerRecoil: "onHit",
    attackerLunge: "onAttack",
    windupMs: BANDIT_CHIEF.swing.windupMs,
    activeMs: 0,
    recoveryMs: BANDIT_CHIEF.swing.recoveryMs,
    cooldownMs: BANDIT_CHIEF.swing.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BANDIT_CHIEF.touchDamageMin,
    damageMax: BANDIT_CHIEF.touchDamageMax,
    damageType: BANDIT_CHIEF.touchDamageType,
    telegraphTint: BANDIT_CHIEF.swing.windupTint,
  },
  /** Cios kłem — wypełnia cooldown szarży. */
  boarGore: {
    id: "boar_gore",
    // Kieł w zwarciu, bez lotu — w odróżnieniu od szarży tej samej bestii.
    ownsBody: false,
    // Zwarcie: kieł odbija się od tego, co przebił.
    attackerRecoil: "onHit",
    // kieł w zwarciu, bez lotu
    attackerLunge: "onAttack",
    windupMs: BOAR.gore.windupMs,
    activeMs: 0,
    recoveryMs: BOAR.gore.recoverMs,
    cooldownMs: BOAR.gore.cooldownMs,
    interruptible: true,
    oncePerActive: true,
    damageMin: BOAR.touchDamageMin,
    damageMax: BOAR.touchDamageMax,
    damageType: BOAR.touchDamageType,
    telegraphTint: BOAR.gore.windupTint,
  },
} as const;

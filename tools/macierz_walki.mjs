/**
 * Macierz walki — przemiata KAŻDĄ trójkę `broń × druga ręka × przeciwnik` i
 * liczy dwie rzeczy, których nikt nigdy nie policzył dla całej macierzy:
 *
 *   1. **UKORZENIENIE vs TELEGRAF** — czy po zamachu zdążysz odczytać tell i
 *      wyjść, czy root zjada okno reakcji w całości.
 *   2. **ZASIĘG vs DYSTANS UTRZYMYWANY** — czy bronią w ogóle dosięgasz
 *      przeciwnika, który trzyma dystans (krążący wilk, cofający się sieciarz).
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Bo obie te rzeczy zostały wykryte **ubocznie, przy okazji czegoś innego**, i
 * obie okazały się zmierzonymi usterkami w kodzie już wdrożonym:
 *
 * - **2026-08-16, przy projektowaniu włóczni**: młot
 *   ma **0,36 px za mało**, żeby dosięgnąć orbity wilka.
 *   ⚠⚠ **TA LICZBA JEST NIEAKTUALNA i zostaje wyłącznie jako powód powstania
 *   pliku.** Policzył ją model `allowance = max(displayWidth, displayHeight)
 *   × 0,35`, usunięty z gry w Fazie 1B-b (2026-08-23) — **narzędzie liczyło
 *   nim jeszcze przez dwa tygodnie po tym, jak przestał istnieć**, a jego
 *   wynik zdążył trafić do decyzji projektowej. Dzisiejszą odpowiedź czytaj
 *   WYŁĄCZNIE z konsoli, z tabeli C.
 * - **ta sama sesja, R-2**: młot + tarcza okuta
 *   rootuje 328 ms przeciw 480 ms tellowi skoczka — margines **−15 ms**, czyli
 *   zaprojektowany counterplay skoczka nie istnieje.
 *
 * Oba wpisy trafiły do `docs/odlozone.md` z tym samym zastrzeżeniem: **z jednej
 * trójki nie wolno robić reguły.** Ten skrypt liczy pozostałe trójki, żeby dało
 * się w ogóle sprawdzić, czy to wyjątki, czy wzór. Nie stroi niczego — decyzja,
 * po której stronie progu ma stać młot, zostaje autorska.
 *
 * ── Dlaczego .mjs, a nie .py ───────────────────────────────────────────────
 * Ten sam powód co w `tools/katalog_ekwipunku.mjs`: źródłem jest TypeScript,
 * a parsowanie `GameConfig.ts` regexem dawałoby generator, który po cichu gubi
 * wpis przy zmianie formatowania. `GameConfig.ts` nie ma importów runtime, więc
 * esbuild robi z niego ESM i node go wykonuje. **Prawdziwe wartości.**
 *
 * ── Przymiar ───────────────────────────────────────────────────────────────
 *   node tools/macierz_walki.mjs            # raport, nic nie zapisuje
 *   node tools/macierz_walki.mjs --zapisz   # ⛔ NIE DZIAŁA — dokument usunięty 2026-09-07
 *
 * ⚠⚠ **`docs/macierz_walki.md` NIE ISTNIEJE od 2026-09-07** i nie ma wrócić.
 * To narzędzie jest od tej pory **wyłącznie przymiarem**: uruchamiasz je, kiedy
 * ruszasz zasięg, czas zamachu albo telegraf, i czytasz wynik z konsoli. Powód:
 * zapisany snapshot pomiaru zestarzał się dwa razy (10 wariantów wobec 16
 * w rosterze) i za każdym razem **kłamał ciszej, niż brak dokumentu**.
 * Rozstrzygnięcie: `docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`,
 * a próg zasięgu i jego reguła: `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`.
 */

import { build } from "esbuild";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "macierz_walki.md");
const ZAPISZ = process.argv.includes("--zapisz");

const tmp = join(KORZEN, "node_modules", ".macierz-walki.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

/**
 * ⚠⚠ **ŻYWA GEOMETRIA WALKI, nie jej transkrypcja (2026-09-07).**
 *
 * `src/core/CombatGeometry.ts` nie ma ANI JEDNEGO importu (jest czysty z tego
 * samego powodu, dla którego czysty jest `MoveIntent` — patrz
 * `src/core/CLAUDE.md`), więc esbuild robi z niego ESM i node go wykonuje.
 * **Ten skrypt woła więc dokładnie tę funkcję, którą woła gra**, zamiast
 * przepisywać jej wzór — a przepisany wzór jest w tym projekcie nazwany
 * wprost: „lustra rozjeżdżają się cicho".
 *
 * Ten plik zapłacił już tę cenę raz: modelował zasięg wzorem
 * `allowance = max(displayWidth, displayHeight) × 0,35`, usuniętym z kodu
 * w Fazie 1B-b (2026-08-23). Narzędzie świeciło na zielono jeszcze przez dwa
 * tygodnie, a jego liczby trafiły do decyzji projektowej.
 */
const tmpGeo = join(KORZEN, "node_modules", ".macierz-geo.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "CombatGeometry.ts")],
  outfile: tmpGeo,
  format: "esm",
  platform: "node",
  bundle: true,
  logLevel: "silent",
});
const GEO = await import(pathToFileURL(tmpGeo).href);
await unlink(tmpGeo).catch(() => {});

const { ITEMS, PLAYER, ATTRIBUTES, ASSETS, BOAR, WOLF, GREY_WOLF, SPIDER, VENOM_SPIDER, BEAR, RABBIT, WEB_PROJECTILE } =
  C;

// ── Model ───────────────────────────────────────────────────────────────────
//
// ⚠ Każda z tych formuł jest PRZEPISANA z kodu i musi za nim nadążać. Miejsca
// źródłowe podane przy każdej — to jedyna rzecz w tym pliku, która może się
// rozjechać po cichu.

/**
 * `Progression.swingDurationMs` + `Progression.rootDurationMs`.
 *
 * ⚠ **Do 2026-08-20 było tu `zamach + 40` i to już NIE jest prawda.** Root
 * dzieli się na zobowiązanie (do klatki trafienia — Zręczność go nie tyka) i
 * odzyskanie (Zręczność je skraca). Cały ten plik mierzy margines reakcji na
 * telegraf, więc stara formuła **zawyżałaby root każdej postaci zręcznej**,
 * czyli raportowała nieistniejące zagrożenie. Powód i pomiar:
 * `docs/atrybuty.md` §10.5.
 */
function rootMs(weapon, variant, offhandSwingMul, agility) {
  const base = weapon ? weapon.swingDurationMs : PLAYER.swing.durationMs;
  const swingMul = (variant?.swingMul ?? 1) * offhandSwingMul;
  const asb = Math.min(agility * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
  const swing = (base * swingMul) / (1 + asb);
  const redukcja = Math.min(
    agility * ATTRIBUTES.recoveryPerAgility,
    ATTRIBUTES.maxRecoveryReduction,
  );
  return (
    swing * PLAYER.swingHitFraction +
    (swing * (1 - PLAYER.swingHitFraction) + PLAYER.swingPoseBufferMs) * (1 - redukcja)
  );
}

/** `Progression.attackReach` — zasięg samej broni, bez ciała celu. */
function reachOf(weapon, variant) {
  const base = weapon ? weapon.melee.reach : PLAYER.melee.reach;
  return base * (variant?.reachMul ?? 1);
}

/**
 * **Hurtbox stworzenia jako `CombatBody`** — dokładnie to, co składa
 * `Enemy.combatBody`: promień z `hurt.depth`, długość z `hurt.length`, oba
 * przemnożone przez `scale`, a kapsuła powstaje **tylko wtedy, gdy zwierzę
 * jest realnie wydłużone** (`length > depth`).
 *
 * ⚠ `hurt` jest w px TEKSTURY, `scale` robi z tego px świata — ta sama
 * konwencja, co przy `bodyWidth` (`src/entities/CLAUDE.md`).
 */
function cialoBojowe(cfg, x, y, osRad) {
  const dl = cfg.hurt.length * cfg.scale;
  const gl = cfg.hurt.depth * cfg.scale;
  return { x, y, radius: gl / 2, length: dl > gl ? dl : undefined, axis: osRad };
}

/**
 * ⚠⚠ **JAK NAPRAWDĘ ROZSTRZYGA SIĘ ZASIĘG — i to jest sedno całej tabeli C.**
 *
 * `GameScene.targetInReach` → `HitResolver.withinReach`:
 *
 * ```
 * trafienie ⟺ gapBetween({ gracz, radius: 0 }, cel.combatBody) ≤ zasięg
 * ```
 *
 * Trzy rzeczy, których nie widać z samego wzoru:
 *
 * 1. **Gracz wchodzi jako PUNKT (`radius: 0`), nie jako swój hurtbox.** Mierzy
 *    się od `combatOrigin` gracza do KRAWĘDZI ciała celu — to jest zapisana
 *    konwencja zasięgu ataku (`CombatGeometry`, nagłówek), nie uproszczenie.
 * 2. **`gapBetween` to PRZEŚWIT między powierzchniami**, nie dystans środków:
 *    0 = stykają się, ujemne = nachodzą.
 * 3. ⚠ **Cel jest KAPSUŁĄ, więc odsunięcie powierzchni od środka ZALEŻY OD
 *    ORIENTACJI.** Stara `allowance` była jedną liczbą i właśnie to ukrywała.
 *
 * ── Dlaczego to jest MIERZONE, a nie policzone ────────────────────────────
 * Funkcja nie zna wzoru na kapsułę. Stawia punkt próbny w znanej odległości
 * i **pyta żywe `GEO.gapBetween`**, ile z tej odległości zjadło ciało celu.
 * Dzięki temu zmiana w `CombatGeometry` przenosi się tu sama; przepisany wzór
 * musiałby zostać zauważony przez człowieka.
 */
function odsunieciePowierzchni(cfg, osRad) {
  const D = 10_000; // daleko od wszystkich progów, więc bez przypadków brzegowych
  const gap = GEO.gapBetween({ x: 0, y: 0, radius: 0 }, cialoBojowe(cfg, D, 0, osRad));
  return D - gap;
}

/**
 * Dwie skrajne orientacje kapsuły wobec linii gracz↔cel. **Obie są prawdziwe**
 * — `Enemy.axisRad` idzie za wektorem ruchu, więc:
 *
 * | sytuacja | oś | które odsunięcie |
 * |---|---|---|
 * | zwierzę NACIERA / cofa się w linii | wzdłuż linii | `czolem` (większe) |
 * | zwierzę KRĄŻY (orbita watahy) | w poprzek linii | `bokiem` (mniejsze) |
 *
 * ⚠ **`bokiem` jest zawsze ≤ `czolem`**, więc bok jest przypadkiem TRUDNIEJSZYM
 * do dosięgnięcia. Broń, która sięga tylko czołem, trafia nacierającego wroga
 * i **nie trafia krążącego** — a to jest różnica ról, nie mocy.
 *
 * ⚠ Konwencja „oś na gracza" jest ta sama, którą przyjmuje
 * `tools/combat_regresja.mjs` przy budowaniu ciał celu.
 */
function odsuniecia(cfg) {
  return {
    czolem: odsunieciePowierzchni(cfg, 0), // oś wzdłuż linii do gracza
    bokiem: odsunieciePowierzchni(cfg, Math.PI / 2), // oś w poprzek
  };
}

/**
 * Rozmiar RYSOWANY (klatka × `scale`).
 *
 * ⚠ **Nie ma już nic wspólnego z zasięgiem** — po 2026-09-07 służy wyłącznie
 * `ucieczkaMs` do oszacowania, o ile w bok trzeba zejść z toru szarży/pocisku.
 * ⚠ **To jest przybliżenie i jest tu nazwane**: kształt, który naprawdę
 * decyduje o trafieniu szarżą, to kapsuła na `combatBody`, nie sylwetka
 * duszka. Rozjazd jest odnotowany, nie naprawiony — to osobne pytanie
 * o kolumnę „zejście", nie o zasięg.
 */
function displayMaxOf(asset, cfg) {
  const w = asset.frameWidth ?? asset.face?.w ?? 0;
  const h = asset.frameHeight ?? asset.face?.h ?? 0;
  return Math.max(w, h) * cfg.scale;
}

const WROGOWIE = {
  krolik: { cfg: RABBIT, asset: ASSETS.rabbit },
  dzik: { cfg: BOAR, asset: ASSETS.boar },
  wilk: { cfg: WOLF, asset: ASSETS.wolf },
  szary: { cfg: GREY_WOLF, asset: ASSETS.greyWolf },
  sieciarz: { cfg: SPIDER, asset: ASSETS.spider },
  skoczek: { cfg: VENOM_SPIDER, asset: ASSETS.venomSpider },
  niedzwiedz: { cfg: BEAR, asset: ASSETS.bear },
};
for (const w of Object.values(WROGOWIE)) {
  w.display = displayMaxOf(w.asset, w.cfg);
  // ⚠ Zmierzone przez ŻYWE `gapBetween`, nie policzone tutaj — patrz
  // `odsunieciePowierzchni`. Zastąpiło `allowance` (usunięte 2026-09-07).
  w.ods = odsuniecia(w.cfg);
}

/* ══════════════════════════════════════════════════════════════════════════
   AUTOTEST — „generator liczący równolegle do gry musi sprawdzać SAM SIEBIE"
   ══════════════════════════════════════════════════════════════════════════
   `tools/CLAUDE.md`. Ten plik przez dwa tygodnie liczył wzorem, którego gra
   już nie miała, i **nic tego nie zgłosiło** — bo nie było czego zgłosić.
   Trzy bramki, każda umiejąca zaświecić na czerwono:

     1. KONTROLA KRZYŻOWA — ręczna arytmetyka kapsuły przeciw żywemu
        `gapBetween`. Wyłapuje zmianę w `CombatGeometry`, o której nikt tu
        nie wiedział.
     2. NIEZMIENNIK KSZTAŁTU — okrąg ma odsunąć powierzchnię tak samo w obie
        strony, kapsuła dalej wzdłuż niż w poprzek.
     3. ZAKAZ POWROTU STAREGO WZORU — na treści TEGO pliku.

   ⚠ Kod wyjścia ≠ 0 przy każdej. Raport, który skłamał, jest gorszy niż brak
   raportu — ten plik jest tego dowodem.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const bledy = [];
  const rowne = (a, b) => Math.abs(a - b) < 1e-9;

  for (const [k, w] of Object.entries(WROGOWIE)) {
    const dl = w.cfg.hurt.length * w.cfg.scale;
    const gl = w.cfg.hurt.depth * w.cfg.scale;
    const promien = gl / 2;
    // ⚠ **Ręczna arytmetyka, świadomie napisana drugi raz** — to jest kontrola
    //   krzyżowa, nie ścieżka produkcyjna (ta woła `GEO.gapBetween`). Ten sam
    //   układ co `krzyz(...)` w `tools/combat_regresja.mjs`.
    //   `odcinek()` skraca rdzeń kapsuły o dwa promienie, więc pół-rdzeń to
    //   `length/2 − radius`; okrąg (`length ≤ depth`) ma pół-rdzeń zerowy.
    const polRdzenia = dl > gl ? Math.max(0, dl / 2 - promien) : 0;
    if (!rowne(w.ods.bokiem, promien)) {
      bledy.push(`${k}: odsunięcie BOKIEM ${w.ods.bokiem} ≠ promień ${promien}`);
    }
    if (!rowne(w.ods.czolem, promien + polRdzenia)) {
      bledy.push(`${k}: odsunięcie CZOŁEM ${w.ods.czolem} ≠ promień+półrdzeń ${promien + polRdzenia}`);
    }
    if (w.ods.bokiem > w.ods.czolem) {
      bledy.push(`${k}: bokiem (${w.ods.bokiem}) > czołem (${w.ods.czolem}) — kapsuła odwrócona?`);
    }
    if (dl <= gl && !rowne(w.ods.bokiem, w.ods.czolem)) {
      bledy.push(`${k}: kształt jest OKRĘGIEM, a odsunięcia się różnią`);
    }
  }

  // ⛔ Zakaz powrotu wzoru sprzed 1B-b. Sprawdzane na treści TEGO pliku, więc
  //    świadome przywrócenie `× 0.35` na rozmiarze rysowanym wywala przymiar.
  //    ⚠ Komentarze wycięte, żeby historyczny opis wyżej sam tego nie zapalał.
  const ja = (await readFile(fileURLToPath(import.meta.url), "utf8"))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"))
    .join("\n");
  if (/Math\.max\([^)]*\)\s*\*\s*0\.35|allowanceOf\s*\(/.test(ja)) {
    bledy.push("WRÓCIŁ wzór `max(displayWidth, displayHeight) × 0,35` — usunięty z gry 2026-08-23");
  }
  if (!/GEO\.gapBetween\(/.test(ja)) {
    bledy.push("przestano wołać ŻYWE `gapBetween` — narzędzie znów jest lustrem");
  }

  if (bledy.length) {
    console.error("AUTOTEST NIE PRZESZEDŁ — macierz liczy czymś innym niż gra:");
    for (const b of bledy) console.error("  ✗ " + b);
    process.exit(2);
  }
  console.log("autotest: odsunięcia zgodne z żywym `gapBetween` (7 stworzeń, 4 bramki każde)\n");
}

/**
 * Przeciwnicy, którzy TRZYMAJĄ dystans — jedyni, przy których zasięg broni jest
 * pytaniem. Reszta (dzik, niedźwiedź, królik, Szary) dobija do kontaktu, więc
 * dosięga ich wszystko.
 */
/**
 * ⚠ **`os` mówi, którą stroną kapsuły stworzenie stoi do gracza — i bez tego
 * pola tabela C nie umie odpowiedzieć na własne pytanie.**
 *
 * Nie jest to wybór tego skryptu: `Enemy.axisRad` idzie za WEKTOREM RUCHU
 * (`updateAI`: `axisRad = atan2(velocity.y, velocity.x)` powyżej progu 2 px/s),
 * a hurtbox jest wzdłuż tej osi. Czyli:
 *
 * - **wilk krąży** (`circleStep` → intencja `ring`, prędkość STYCZNA do okręgu)
 *   → oś w poprzek linii do gracza → rządzi odsunięcie **bokiem**;
 * - **sieciarz stoi w paśmie i pluje** (`move.hold()`), a ostatni ruch był
 *   wzdłuż linii — dobiegnięcie (`seek`) albo odwrót (`flee`) → oś wzdłuż
 *   linii → rządzi odsunięcie **czołem**.
 */
const DYSTANSOWI = [
  { klucz: "wilk", nazwa: "wilk (orbita watahy)", dystans: WOLF.pack.circleRadius, os: "bokiem", skad: "WOLF.pack.circleRadius" },
  { klucz: "sieciarz", nazwa: "sieciarz (pasmo)", dystans: SPIDER.ranged.retreatRange, os: "czolem", skad: "SPIDER.ranged.retreatRange" },
];

/**
 * Przeciwnicy z prawdziwym TELEGRAFEM — jedyni, przy których root jest pytaniem.
 *
 * ⚠ Wilka tu **nie ma i to nie jest przeoczenie**: jego wypad jest celowo
 * nieczytelny (`GameConfig.ts`: „the pack's threat is the volume of attacks"),
 * więc nie ma czego odczytywać. Ten przypadek jest osobno zaparkowany w
 * `docs/odlozone.md` („Ukorzenienie a wataha wilków") i tabela poniżej go NIE
 * rozstrzyga. Niedźwiedź i królik nie mają faz w ogóle.
 */
const TELEGRAFY = [
  {
    klucz: "skoczek",
    nazwa: "Skoczek — ukąszenie",
    tell: VENOM_SPIDER.bite.windupMs,
    ucieczka: "wyjscie",
    zasiegAtaku: VENOM_SPIDER.bite.reach,
    progAtaku: VENOM_SPIDER.bite.range,
    kontra: "cofnięcie się (12 px)",
    skad: "VENOM_SPIDER.bite.windupMs / .range / .reach",
  },
  {
    klucz: "szary",
    nazwa: "Szary — kęs",
    tell: GREY_WOLF.duel.windupMs,
    ucieczka: "wyjscie",
    zasiegAtaku: GREY_WOLF.duel.biteReach,
    progAtaku: GREY_WOLF.duel.biteRange,
    // ⚠ Jego zaprojektowaną kontrą NIE są nogi. `GreyWolf.interrupt`:
    // „A blunt hit cancels the bite. Denying the Szary his wind-up is the one
    // counter to a duellist who otherwise decides when every exchange happens."
    kontra: "PRZERWANIE obuchem (nie nogi!)",
    skad: "GREY_WOLF.duel.windupMs / .biteRange / .biteReach",
  },
  {
    klucz: "dzik",
    nazwa: "Dzik — szarża",
    tell: BOAR.charge.telegraphMs,
    ucieczka: "wbok",
    predkoscLotu: BOAR.charge.speed,
    kontra: "zejście w bok",
    skad: "BOAR.charge.telegraphMs / .speed",
  },
  {
    klucz: "sieciarz",
    nazwa: "Sieciarz — sieć",
    tell: SPIDER.ranged.windupMs,
    ucieczka: "wbok",
    predkoscLotu: WEB_PROJECTILE.speed,
    kontra: "strafe (pocisk leci tam, gdzie stałeś)",
    skad: "SPIDER.ranged.windupMs / WEB_PROJECTILE.speed",
  },
];

/** Pół szerokości ciała gracza — `PLAYER.bodyWidth` 18, czyli 9 px. */
const POL_GRACZA = PLAYER.bodyWidth / 2;

/**
 * Ile czasu zajmuje zejście z linii ciosu — DWA różne modele, bo to są dwa
 * różne rodzaje ataku, a wrzucenie ich do jednego wzoru dałoby liczbę
 * wyglądającą wiarygodnie i nieprawdziwą.
 *
 * **`wyjscie`** (skoczek, Szary): atak testuje promień w chwili trafienia
 * (`VenomSpider`: `if (dist > b.reach) return;` — „szczęki zamykają się na
 * niczym"; `GreyWolf`: `dist <= d.biteReach`), więc trzeba przejść poza ten
 * promień.
 *
 * ⚠ **Dystans do pokonania NIE zależy od broni gracza, tylko od dwóch pól
 * przeciwnika — i to była druga poprawka tego skryptu.** Kusi, żeby liczyć go
 * od miejsca, w którym gracz STOI (czyli od `zasięg + allowance`), ale to
 * odwraca przyczynowość: **to przeciwnik dobija do gracza**, nie odwrotnie.
 * Skoczek wchodzi w telegraf w klatce, w której `dist <= bite.range` (58), a
 * kąsa na `bite.reach` (70) — do pokonania jest 12 px, młotem tak samo jak
 * sztyletem. Szary: `biteRange` 74 → `biteReach` 88, czyli 14 px.
 *
 * ⚠ **I nie jest to wyścig na prędkość**: `enterWindup` obu stworów robi
 * `setVelocity(0, 0)`, więc przez cały telegraf stoją. Gdyby goniły, liczyłaby
 * się prędkość WZGLĘDNA (skoczek 96 vs gracz 150 → 12 px zajęłoby 222 ms
 * zamiast 80), i to jest jedyna zmiana w kodzie, która unieważniłaby tę
 * tabelę. Sprawdzone w `VenomSpider.enterWindup` i `GreyWolf` (case „windup").
 *
 * **`wbok`** (dzik, sieciarz): nic tu nie testuje promienia — dzik przejeżdża
 * przez gracza fizycznie, a sieć leci tam, gdzie stałeś. Schodzi się na BOK, o
 * pół szerokości obu ciał.
 *
 * ⚠ **Do `wbok` DOLICZA SIĘ czas lotu, i pierwsza wersja tego skryptu tego nie
 * robiła — przez co wychodziło, że sieci nie da się uniknąć NICZYM.** Cios,
 * który testuje promień, trafia w chwili końca telegrafu; cios, który leci,
 * potrzebuje jeszcze przebyć dystans, i ten czas jest dla gracza darmowy.
 * Pominięcie go nie dawało błędu ani ostrzeżenia, tylko 49 czerwonych wierszy
 * zamiast 12 — dokładnie ta klasa pomyłki, przed którą ten projekt ostrzega
 * przy każdym pomiarze.
 */
function ucieczkaMs(tele, standoff) {
  if (tele.ucieczka === "wyjscie") {
    return (Math.max(0, tele.zasiegAtaku - tele.progAtaku) / PLAYER.speed) * 1000;
  }
  const w = WROGOWIE[tele.klucz];
  const bok = tele.klucz === "sieciarz" ? WEB_PROJECTILE.bodyRadius + POL_GRACZA : w.display / 2 + POL_GRACZA;
  // ⚠ Sieciarz strzela z SWOJEGO dystansu, nie z twojego: cofa się do
  // `retreatRange` i dopiero stamtąd pluje, więc sztyletem lot jest równie
  // długi jak włócznią. Dzik takiego progu nie ma — rusza z miejsca, w którym
  // stoi, czyli z odległości wyznaczonej przez zasięg gracza.
  const dystansLotu = tele.klucz === "sieciarz" ? Math.max(standoff, SPIDER.ranged.retreatRange) : standoff;
  const lot = (dystansLotu / tele.predkoscLotu) * 1000;
  return Math.max(0, (bok / PLAYER.speed) * 1000 - lot);
}

const BRONIE = [
  { id: "—", def: null, wariant: null, nazwa: "pięści" },
  ...Object.entries(ITEMS)
    .filter(([, it]) => it.type === "weapon")
    .flatMap(([id, it]) =>
      (it.attacks ?? [{ id: "strike", name: "Atak" }]).map((v, i) => ({
        id,
        def: it,
        wariant: v,
        nazwa: it.attacks?.length > 1 ? `${it.name} — ${v.name}` : it.name,
      })),
    ),
];

const OFFHAND = [
  { nazwa: "bez", mul: 1 },
  { nazwa: "puklerz", mul: ITEMS.buckler.block.swingMul },
  { nazwa: "tarcza okuta", mul: ITEMS.ironbound_shield.block.swingMul },
];

// ── Tabela A: ukorzenienie ──────────────────────────────────────────────────

const f = (n, d = 1) => n.toFixed(d).replace(".", ",");

function tabelaRoot() {
  const l = [];
  l.push("| broń / wariant | bez tarczy | + puklerz | + tarcza okuta | przy Zręczności 50 (bez tarczy) |");
  l.push("|---|---|---|---|---|");
  for (const b of BRONIE) {
    const c = OFFHAND.map((o) => `${Math.round(rootMs(b.def, b.wariant, o.mul, 0))} ms`);
    const szybki = Math.round(rootMs(b.def, b.wariant, 1, 50));
    l.push(`| ${b.nazwa} | ${c[0]} | ${c[1]} | ${c[2]} | ${szybki} ms |`);
  }
  return l.join("\n");
}

// ── Tabela B: margines reakcji ──────────────────────────────────────────────

function marginesy() {
  const wiersze = [];
  for (const tele of TELEGRAFY) {
    for (const b of BRONIE) {
      for (const o of OFFHAND) {
        const root = rootMs(b.def, b.wariant, o.mul, 0);
        // ⚠ Dystans MIĘDZY ŚRODKAMI CIAŁ, przy którym powierzchnia celu stoi
        // dokładnie na zasięgu broni. Orientacja `czolem`, bo każde stworzenie
        // z tej tabeli w chwili ataku NACIERA na gracza albo w niego celuje —
        // ta sama konwencja co w `tools/combat_regresja.mjs`.
        const standoff = reachOf(b.def, b.wariant) + WROGOWIE[tele.klucz].ods.czolem;
        const uc = ucieczkaMs(tele, standoff);
        wiersze.push({
          tele: tele.nazwa,
          bron: b.nazwa,
          off: o.nazwa,
          root,
          uc,
          margines: tele.tell - root - uc,
          tell: tele.tell,
        });
      }
    }
  }
  return wiersze;
}

function tabelaMarginesow(wiersze) {
  const l = [];
  l.push("| telegraf | tell | broń / wariant | druga ręka | root | zejście | **margines** |");
  l.push("|---|---|---|---|---|---|---|");
  for (const w of wiersze) {
    const znak = w.margines < 0 ? "🔴" : w.margines < 60 ? "🟠" : "";
    l.push(
      `| ${w.tele} | ${w.tell} ms | ${w.bron} | ${w.off} | ${Math.round(w.root)} ms | ${Math.round(w.uc)} ms | **${Math.round(w.margines) > 0 ? "+" : ""}${Math.round(w.margines)} ms** ${znak} |`,
    );
  }
  return l.join("\n");
}

/**
 * Ile Zręczności trzeba, żeby root zmieścił się w budżecie danego telegrafu.
 *
 * ⚠ To jest kolumna, bez której cała analiza byłaby połowiczna: root maleje z
 * Zręcznością, więc „margines ujemny" bez podania, przy jakiej Zręczności,
 * niczego nie rozstrzyga. Sufit jest twardy (`ATTRIBUTES.maxAttackSpeedBonus`
 * = 0,6), więc odpowiedź **„nigdy" jest możliwa i jest najciekawsza** — mówi,
 * że dana broń nie odczyta tego telegrafu przy ŻADNEJ budowie postaci.
 */
function minZrecznosc(weapon, variant, offhandMul, budzet) {
  const maxA = Math.ceil(ATTRIBUTES.maxAttackSpeedBonus / ATTRIBUTES.attackSpeedPerAgility);
  for (let a = 0; a <= maxA; a++) if (rootMs(weapon, variant, offhandMul, a) <= budzet) return a;
  return null;
}

function tabelaProgow(tele) {
  const budzet = tele.tell - ucieczkaMs(tele, 0);
  const l = [];
  l.push(`Budżet na root: **${Math.round(budzet)} ms** (tell ${tele.tell} ms − zejście ${Math.round(ucieczkaMs(tele, 0))} ms)`);
  l.push("");
  l.push("| broń / wariant | bez tarczy | + puklerz | + tarcza okuta |");
  l.push("|---|---|---|---|");
  for (const b of BRONIE) {
    const k = OFFHAND.map((o) => {
      const a = minZrecznosc(b.def, b.wariant, o.mul, budzet);
      return a === null ? "**nigdy** 🔴" : a === 0 ? "zawsze ✅" : `Zręczność ${a}`;
    });
    l.push(`| ${b.nazwa} | ${k.join(" | ")} |`);
  }
  return l.join("\n");
}

// ── Tabela C: zasięg ────────────────────────────────────────────────────────

/**
 * ⚠ **`d.dystans` jest DYSTANSEM MIĘDZY ŚRODKAMI CIAŁ** — `circleRadius`
 * i `retreatRange` są tak mierzone od 2026-09-07 (ujednolicenie przestrzeni
 * ruchu; przedtem szły między duszkami i ta sama liczba znaczyła co innego
 * zależnie od azymutu). `eff` jest w tej samej jednostce: to dystans środków,
 * przy którym powierzchnia celu stoi dokładnie na zasięgu broni.
 *
 * ⚠ **Werdykt jest TRÓJSTANOWY i to jest treść tej tabeli, nie ozdoba.**
 * Kapsuła odsuwa powierzchnię inaczej wzdłuż ciała niż w poprzek, więc broń
 * potrafi dosięgnąć wroga NACIERAJĄCEGO i nie dosięgnąć KRĄŻĄCEGO na tym samym
 * dystansie. Jedna liczba (dawna `allowance`) tego nie umiała powiedzieć.
 */
function tabelaZasiegow() {
  const l = [];
  l.push(
    `| broń / wariant | zasięg | ${DYSTANSOWI.map((d) => `${d.nazwa} — próg ${d.dystans}, stoi **${d.os}**`).join(" | ")} |`,
  );
  l.push(`|---|---|${DYSTANSOWI.map(() => "---").join("|")}|`);
  for (const b of BRONIE) {
    const r = reachOf(b.def, b.wariant);
    const kom = DYSTANSOWI.map((d) => {
      const o = WROGOWIE[d.klucz].ods;
      const effCz = r + o.czolem;
      const effBo = r + o.bokiem;
      // ⚠ **Werdykt liczy się z osi, którą to stworzenie NAPRAWDĘ prezentuje**
      //   (`DYSTANSOWI.os`). Pasmo obok pokazuje drugą skrajność, żeby było
      //   widać, jak blisko progu leży broń, gdyby przeciwnik się obrócił.
      const eff = d.os === "bokiem" ? effBo : effCz;
      const m = eff - d.dystans;
      const znak = m < 0 ? "🔴 NIE" : Math.abs(m) < 12 ? "🟠 ledwo" : "✅";
      return `${f(eff, 2)} → ${m > 0 ? "+" : ""}${f(m, 2)} px ${znak}  _(druga oś: ${f(d.os === "bokiem" ? effCz : effBo, 2)})_`;
    });
    l.push(`| ${b.nazwa} | ${f(r, 0)} | ${kom.join(" | ")} |`);
  }
  return l.join("\n");
}

/**
 * Hurtboxy rosteru — **następca tabeli `allowance`**.
 *
 * ⚠ Kolumny `odsunięcie` są ZMIERZONE żywym `gapBetween`, nie policzone tutaj.
 * `rozmiar rysowany` zostaje wyłącznie jako wejście kolumny „zejście"
 * w tabeli marginesów i **nie uczestniczy już w żadnym progu zasięgu**.
 */
function tabelaHurtboxow() {
  const l = [];
  l.push("| przeciwnik | hurt (tekstura) | scale | ślad stopy (świat) | kształt | **odsunięcie bokiem** | **odsunięcie czołem** | rozmiar rysowany |");
  l.push("|---|---|---|---|---|---|---|---|");
  for (const [k, w] of Object.entries(WROGOWIE)) {
    const dl = w.cfg.hurt.length * w.cfg.scale;
    const gl = w.cfg.hurt.depth * w.cfg.scale;
    const ksztalt = dl > gl ? "kapsuła" : "okrąg";
    l.push(
      `| ${k} | ${w.cfg.hurt.length}×${w.cfg.hurt.depth} | ${w.cfg.scale} | ${f(dl, 1)}×${f(gl, 1)} px | ${ksztalt} | **${f(w.ods.bokiem, 2)} px** | **${f(w.ods.czolem, 2)} px** | ${f(w.display, 1)} px |`,
    );
  }
  return l.join("\n");
}

// ── Wyjście ─────────────────────────────────────────────────────────────────

const wiersze = marginesy();
const zle = wiersze.filter((w) => w.margines < 0);
const ciasne = wiersze.filter((w) => w.margines >= 0 && w.margines < 60);

const SEKCJE = {
  // ⚠ Klucz przemianowany razem z treścią (`allowance` → `hurtboxy`). Ścieżka
  // `--zapisz` i tak jest martwa — `docs/macierz_walki.md` nie istnieje od
  // 2026-09-07 i nie ma wrócić (patrz nagłówek pliku).
  hurtboxy: tabelaHurtboxow(),
  root: tabelaRoot(),
  marginesy: tabelaMarginesow(wiersze),
  zasiegi: tabelaZasiegow(),
  progi: TELEGRAFY.map((t) => [`#### ${t.nazwa} — kontra: ${t.kontra}`, "", tabelaProgow(t)].join("\n")).join("\n\n"),
};

console.log(`Trójek broń×offhand×telegraf: ${wiersze.length}`);
console.log(`🔴 margines UJEMNY: ${zle.length}`);
for (const w of zle) {
  console.log(`   ${w.tele} — ${w.bron} + ${w.off}: ${Math.round(w.margines)} ms`);
}
console.log(`🟠 margines < 60 ms: ${ciasne.length}`);
for (const w of ciasne) {
  console.log(`   ${w.tele} — ${w.bron} + ${w.off}: +${Math.round(w.margines)} ms`);
}
console.log("");
console.log(SEKCJE.progi);
console.log("");
console.log(SEKCJE.zasiegi);

if (!ZAPISZ) {
  console.log("\n(przymiar — nic nie zapisano; użyj --zapisz)");
} else {
  if (!existsSync(DOC)) {
    console.log(`BLAD: brak ${DOC} — utwórz plik ze znacznikami AUTO przed zapisem.`);
    process.exit(1);
  }
  let tekst = await readFile(DOC, "utf8");
  for (const [klucz, tresc] of Object.entries(SEKCJE)) {
    const re = new RegExp(`(<!-- AUTO:start:${klucz} -->)[\\s\\S]*?(<!-- AUTO:end:${klucz} -->)`);
    if (!re.test(tekst)) {
      console.log(`BLAD: brak znacznika AUTO:${klucz}`);
      process.exit(1);
    }
    tekst = tekst.replace(re, `$1\n${tresc}\n$2`);
  }
  await writeFile(DOC, tekst, "utf8");
  console.log(`Zapisano ${DOC}`);
}

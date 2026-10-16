/**
 * BIEGŁOŚĆ — uprząż praktyki i manekina treningowego.
 *
 * Sprawdza kanał nauki wdrożony 2026-09-02: `core/Practice.ts` (czysta
 * arytmetyka) i `core/WeaponProficiency.ts` (stan + zapis). Projekt i pomiary:
 * `docs/systemy/proficiency.md`, §14b, §19, §22.
 *
 * ⚠ **§11 pokrywa ŁADUNKI RANG** (§14, wdrożone 2026-09-02): ekonomia wysiłku
 * −12/−24/−35%, cecha rodziny ×1,5/×2,0 (miecz, obuch), `φ` topora i sztyletu,
 * minimum proporcjonalne M-III oraz pustka włóczni z D3. ⚠ **Sprawdza też
 * NIEOBECNOŚĆ efektu**: samo `P`, cudza rodzina i brak rangi mają nie dawać nic.
 *
 * ⚠ **Czego §11 NIE dosięga:** samego LOSOWANIA obrażeń (`Player.rollDamage`
 * ciągnie Phasera). Testowany jest `Progression.critLowCut`, czyli liczba,
 * którą to losowanie dostaje — jedno podstawienie dalej.
 *
 * ⚠ **Od §34 (Mastery jako stan kupowany) uprząż pokrywa też RANGĘ** — §10
 * niżej: twardy sufit `P`, przepadanie praktyki na suficie, zakup wszystkich
 * czterech rang za złoto i punkty rozwoju, zapis/odczyt rang oraz **to, że `P`
 * NIE nadaje rangi automatycznie**. Tamten model (wariant A) obowiązywał do
 * 2026-09-02 i został odwrócony.
 *
 * ── Co to uruchamia ───────────────────────────────────────────────────────
 * • **PRAWDZIWE moduły**, bundlowane esbuildem — nie transkrypcję. `Practice`
 *   jest czysty i wchodzi wprost; `WeaponProficiency` ciągnie `EventBus`, który
 *   importuje Phasera, więc Phaser jest **podmieniany na dziesięciolinijkowy
 *   stub emitera**. Podmiana dotyczy wyłącznie kanału zdarzeń: cała
 *   arytmetyka, stan, `snapshot`/`restore` i sanityzacja są tymi z gry.
 *
 * ⚠ **Ta uprząż UMIE zaświecić na czerwono — sprawdzone, nie założone.**
 * Trzy celowe zepsucia, każde przywrócone po pomiarze:
 *   • `dummy.limit` 10 → 12          → 12 błędów (limit, P_start, zapis)
 *   • `executionWeight.graze` 0,3 → 1 → 4 błędy (waga i iloraz dróg)
 *   • fallback `P_start` w `restore` → 1 błąd (stary zapis)
 *   • `masteryOf` liczące rangę z `P` (stary wariant A) → **23 błędy** w §10
 *     (sufit, przepadanie praktyki, cały zakup, migawka rang)
 *   • mnożnik rangi przełożony z EFEKTU na POLE (`core × (1 + bonus × mul)`)
 *     → **4 błędy** w §11, i to dokładnie te liczby, którymi D1 uzasadniono:
 *     parada 6,13% / 6,50% zamiast 8,63% / 11,50%
 * Asercja, która nie potrafi zgłosić błędu, jest dekoracją (`tools/CLAUDE.md`).
 *
 * ⚠ **Liczby ciosów NIE są celem z §14b (884 / 1346).** Tamte policzono
 * w sesji 3, **zanim istniała warstwa 2** — w świecie, w którym każdy zamach
 * uczył. Dziś Fumble daje 0, a Ześlizg 0,30, więc ten sam postęp wymaga więcej
 * zamachów. Wartości niżej są **zamrożonym stanem po wdrożeniu**, nie
 * odtworzeniem tamtego pomiaru; różnica jest wyjaśniona w raporcie sesji.
 */

import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "bieglosc-"));
let bledy = 0;
let sprawdzen = 0;

function ok(warunek, opis, detal = "") {
  sprawdzen++;
  if (warunek) {
    console.log(`  OK   ${opis}${detal ? "   " + detal : ""}`);
  } else {
    bledy++;
    console.log(`  ⛔   ${opis}${detal ? "   " + detal : ""}`);
  }
}
const blisko = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/* ── Stub Phasera: WYŁĄCZNIE emiter zdarzeń ─────────────────────────────────
   `EventBus` używa `Phaser.Events.EventEmitter` i nic więcej, więc to jest
   pełne pokrycie jego potrzeb. Gdyby `EventBus` kiedyś sięgnął głębiej,
   bundlowanie padnie tutaj — głośno, a nie po cichu. */
const stub = join(tmp, "phaser-stub.mjs");
writeFileSync(
  stub,
  `class EventEmitter {
     constructor() { this.l = new Map(); }
     on(k, fn, ctx) { (this.l.get(k) ?? this.l.set(k, []).get(k)).push([fn, ctx]); return this; }
     off(k, fn) { const a = this.l.get(k) ?? []; this.l.set(k, a.filter(([f]) => f !== fn)); return this; }
     emit(k, ...args) { for (const [fn, ctx] of (this.l.get(k) ?? []).slice()) fn.call(ctx, ...args); return true; }
   }
   export default { Events: { EventEmitter } };`,
);

async function zbuduj(wejscie, nazwa) {
  const out = join(tmp, `${nazwa}.mjs`);
  await build({
    entryPoints: [wejscie],
    bundle: true,
    format: "esm",
    outfile: out,
    logLevel: "silent",
    alias: { phaser: stub },
  });
  return import(pathToFileURL(out).href);
}

const P = await zbuduj("src/core/Practice.ts", "practice");
/**
 * ⚠ **Biegłość, portfel i punkty rozwoju MUSZĄ przyjechać z JEDNEGO bundla.**
 * `WeaponProficiency.unlockMastery` pobiera złoto z `Inventory` i punkty
 * z `Progression`; zbudowanie ich osobnymi wejściami dałoby **drugi graf
 * modułów**, czyli inne instancje singletonów — dokładnie ta sama pułapka, co
 * `import()` w konsoli przeglądarki zamiast `window.dev` (`src/core/CLAUDE.md`).
 * Test „złoto zeszło o 50" przechodziłby wtedy na kopii, której gra nie widzi.
 */
const wspolne = join(tmp, "wspolne.ts");
writeFileSync(
  wspolne,
  `export * from ${JSON.stringify(resolve("src/core/WeaponProficiency.ts"))};
   export { GameEvents, EVENT } from ${JSON.stringify(resolve("src/core/EventBus.ts"))};
   export { Inventory } from ${JSON.stringify(resolve("src/core/Inventory.ts"))};
   export { Progression } from ${JSON.stringify(resolve("src/core/Progression.ts"))};
   export { Equipment } from ${JSON.stringify(resolve("src/core/Equipment.ts"))};
   export { normalizeInstance } from ${JSON.stringify(resolve("src/core/Quality.ts"))};
   export { familyTraitValue } from ${JSON.stringify(resolve("src/core/WeaponTraits.ts"))};`,
);
const WP = await zbuduj(wspolne, "wp");
const CFG = await zbuduj("src/config/GameConfig.ts", "cfg");
const { WeaponProficiency, Inventory, Progression, Equipment, normalizeInstance, GameEvents, EVENT, familyTraitValue } = WP;
const { PRACTICE, PROFICIENCY } = CFG;

/** Zbij manekina, aż `P` przestanie rosnąć albo padnie sufit bezpieczeństwa. */
function trenuj(family, wykonanie = "clean", sufit = 200_000) {
  let ciosy = 0;
  let bezPostepu = 0;
  const startP = WeaponProficiency.get(family);
  while (ciosy < sufit) {
    const przed = WeaponProficiency.get(family);
    const zysk = WeaponProficiency.dummyGainFor(family, wykonanie);
    if (zysk <= 0) break;
    WeaponProficiency.practiceOnDummy(family, wykonanie);
    ciosy++;
    bezPostepu = WeaponProficiency.get(family) === przed ? bezPostepu + 1 : 0;
    if (bezPostepu > 100_000) break;
  }
  return { ciosy, od: startP, do: WeaponProficiency.get(family) };
}

console.log("\n§1  Stałe — przepisane z checkpointu bez zmian\n");
ok(PRACTICE.base === 6.7, "practice_base = 6,7 (§27)");
ok(PRACTICE.costA / PRACTICE.costB === 262, "r = a/b = 262 (§27)", `a=${PRACTICE.costA} b=${PRACTICE.costB}`);
ok(PRACTICE.softzoneS === 0.4, "softzone s = 0,40 (§27)");
ok(PRACTICE.dummy.efficiencyFrom === 0.7 && PRACTICE.dummy.efficiencyTo === 0.3, "dummyEfficiency 0,70 → 0,30 (§14b)");
ok(PRACTICE.dummy.limit === 10, "limit manekina = 10 punktów od P_start (§14b)");
ok(
  PRACTICE.dummy.rateMultiplier === 1.2,
  "tempo manekina ×1,20 — mnożnik TYLKO na kanale manekina (playtest 2026-09-02)",
);
ok(
  PRACTICE.base === 6.7,
  "…a `practice_base` zostaje 6,7 — przyspieszenie NIE weszło w tempo całości",
);
ok(
  PRACTICE.executionWeight.graze === PROFICIENCY.slipMultiplier,
  "waga Ześlizgu JEST `slipMultiplier` — bez nowego parametru",
  `${PRACTICE.executionWeight.graze}`,
);
ok(PRACTICE.executionWeight.fumble === 0 && PRACTICE.executionWeight.whiff === 0, "Fumble i Whiff dają DOKŁADNIE zero");
ok(PRACTICE.executionWeight.clean === 1, "Clean daje pełną praktykę");

console.log("\n§2  Arytmetyka czysta (`Practice.ts`)\n");
ok(P.pointCost(0) === 262 && P.pointCost(100) === 362, "koszt(P) = a + b·P rośnie liniowo");
ok(blisko(P.softzone(0), 1), "soft(P) na wejściu w pasmo = dokładnie 1,0 (M2, reset per pasmo)");
ok(blisko(P.softzone(50), 1), "soft(50) = 1,0 — nowe pasmo resetuje hamowanie");
ok(P.softzone(49) < 0.35, "soft tuż pod bramą mocno hamuje", `soft(49)=${P.softzone(49).toFixed(4)}`);
ok(P.masteryBand(350) === null, "powyżej Mastery IV pasma NIE MA (P_end nierozstrzygnięty)");
ok(blisko(P.dummyEfficiency(0), 0.7) && blisko(P.dummyEfficiency(5), 0.5), "dummyEfficiency liniowa 0,70 → 0,30");
ok(P.dummyEfficiency(10) === 0 && P.dummyEfficiency(11) === 0, "lp ≥ 10 → DOKŁADNIE 0, nie „mało”");
ok(P.dummyEfficiency(-1) === 0, "lp ujemne (P poniżej P_start) → 0");
{
  const s = P.addPractice({ proficiency: 0, pool: 0 }, 261);
  ok(s.proficiency === 0 && blisko(s.pool, 261), "praktyka poniżej ceny punktu ZOSTAJE w puli");
  const s2 = P.addPractice(s, 1);
  ok(s2.proficiency === 1 && blisko(s2.pool, 0), "pula pokrywająca cenę daje +1 i zeruje resztę");
  const s3 = P.addPractice({ proficiency: 0, pool: 0 }, 262 + 263 + 5);
  ok(s3.proficiency === 2 && blisko(s3.pool, 5), "jedno dolanie może dać WIĘCEJ niż jeden punkt (pętla, nie `if`)");
}

console.log("\n§2a  Tempo manekina ×1,20 — MNOŻNIK, nie zmiana modelu (playtest)\n");
{
  const bezMnoznika = PRACTICE.base * P.softzone(0) * P.dummyEfficiency(0);
  ok(
    blisko(P.dummyPractice(0, 0), bezMnoznika * PRACTICE.dummy.rateMultiplier, 1e-12),
    "cios w manekina = base × soft(P) × dummyEfficiency × 1,20 (mnożnik OSTATNI)",
    `${P.dummyPractice(0, 0).toFixed(4)} jedn.`,
  );
  ok(P.dummyPractice(10, 0) === 0, "poza limitem nadal DOKŁADNIE zero — mnożnik nie odblokowuje manekina");
  ok(P.dummyEfficiency(0) === 0.7 && P.dummyEfficiency(10) === 0, "krzywa `dummyEfficiency` NIETKNIĘTA");
  ok(blisko(P.softzone(0), 1) && P.softzone(49) < 0.35, "softzone NIETKNIĘTA");
  // ⚠ Cena tej zmiany, zgłaszana JAWNIE zamiast chowana: kryterium §14b liczy
  // margines manekina wobec nauczycieli. R1 (wiążący) trzyma, R2 (higiena)
  // schodzi minimalnie pod próg ×1,5. Praktyka z walki nie ma jeszcze kodu
  // (D7), więc obie liczby są dziś PROJEKTOWE — stąd raport, nie asercja.
  const r1 = 2.12 / PRACTICE.dummy.rateMultiplier;
  const r2 = 1.59 / PRACTICE.dummy.rateMultiplier;
  console.log(`  ⚠    R1 (wiążący, ekonomia): ×${r1.toFixed(2)} — próg ×1,5 ${r1 >= 1.5 ? "TRZYMA" : "NARUSZONY"}`);
  console.log(`  ⚠    R2 (higiena, czytelność): ×${r2.toFixed(2)} — próg ×1,5 ${r2 >= 1.5 ? "TRZYMA" : "NARUSZONY, przyjęte świadomie z playtestu"}`);
}

console.log("\n§3  Manekin: nowa postać 0 → 10\n");
WeaponProficiency.reset();
{
  const r = trenuj("sword");
  ok(r.od === 0, "nowa postać startuje od P = 0 (§14a: żadna rodzina nie ma jeszcze P ≥ 50)");
  ok(r.do === 10, "manekin dowozi DOKŁADNIE 10 punktów", `${r.od} → ${r.do}`);
  // ⚠ **To jest przebieg SAMYMI CZYSTYMI ciosami** — deterministyczny, więc
  // asercja jest na równość, nie na pasmo. W grze dochodzi rozkład wykonania
  // (przy P = 0: 12% fumbli, 17% ześlizgów), który wydłuża drogę o ~29% —
  // sprawdzane osobno w §6 przez iloraz ześlizg/czysty.
  ok(r.ciosy === 704, "liczba ciosów samymi czystymi (stan zamrożony, tempo ×1,20)", `${r.ciosy} ciosów`);
  ok(WeaponProficiency.startOf("sword") === 0, "P_start ZAPISANY jako 0");
  ok(WeaponProficiency.dummyGainFor("sword", "clean") === 0, "po limicie manekin daje ZERO praktyki");
  const przed = WeaponProficiency.get("sword");
  for (let i = 0; i < 5000; i++) WeaponProficiency.practiceOnDummy("sword", "clean");
  ok(WeaponProficiency.get("sword") === przed, "5000 dalszych ciosów NIE rusza P ani o punkt");
}

console.log("\n§4  Manekin: weteran 25 → 35\n");
WeaponProficiency.reset();
// ⚠ PRÓG `P ≥ 50` gdzie indziej, NIE wykupiona ranga (D3, §34.8) — dlatego
// niżej nie ma ani jednego `setMastery`, a podłoga weterana i tak wchodzi.
WeaponProficiency.set("sword", 50);
{
  const r = trenuj("axe");
  ok(r.od === 25, "weteran startuje nową rodzinę od P = 25 (§14a)", `${r.od}`);
  ok(r.do === 35, "manekin dowozi 10 punktów, do 35", `${r.od} → ${r.do}`);
  ok(r.ciosy === 1072, "liczba ciosów samymi czystymi (stan zamrożony, tempo ×1,20)", `${r.ciosy} ciosów`);
  ok(r.ciosy > 704, "te same 10 punktów kosztują weterana WIĘCEJ — asymetria zamierzona (§14b)", `${(r.ciosy / 704).toFixed(2)}× nowej postaci`);
  ok(WeaponProficiency.startOf("axe") === 25, "P_start ZAPISANY jako 25");
}

console.log("\n§5  P_start jest ZAPISANY, nie wyprowadzany (§14b)\n");
WeaponProficiency.reset();
{
  // Scenariusz wprost z checkpointu: topór zaczęty przy 0, manekin wyczerpany,
  // DOPIERO POTEM Mastery I mieczem. Próg topora nie ma prawa się przeliczyć.
  trenuj("axe");
  ok(WeaponProficiency.get("axe") === 10, "topór wyczerpał manekina na 10");
  WeaponProficiency.set("sword", 50);
  ok(WeaponProficiency.startOf("axe") === 0, "P_start topora NADAL 0, mimo progu 50 mieczem");
  ok(
    WeaponProficiency.dummyGainFor("axe", "clean") === 0,
    "manekin NIE odblokował się ponownie — to jest ten błąd, przed którym ostrzega §14b",
  );
}

console.log("\n§6  Waga wykonania: Clean 1,00 · Graze 0,30 · Fumble/Whiff 0\n");
{
  WeaponProficiency.reset();
  const czysty = WeaponProficiency.dummyGainFor("blunt", "clean");
  const zeslizg = WeaponProficiency.dummyGainFor("blunt", "graze");
  ok(blisko(zeslizg / czysty, PROFICIENCY.slipMultiplier, 1e-12), "ześlizg = 0,30 × czysty cios");
  ok(WeaponProficiency.dummyGainFor("blunt", "fumble") === 0, "fumble nie daje praktyki");
  ok(WeaponProficiency.dummyGainFor("blunt", "whiff") === 0, "pudło geometryczne nie daje praktyki");

  WeaponProficiency.reset();
  const przed = WeaponProficiency.get("blunt");
  for (let i = 0; i < 5000; i++) WeaponProficiency.practiceOnDummy("blunt", "fumble");
  ok(WeaponProficiency.get("blunt") === przed, "5000 fumbli nie rusza P");
  ok(!WeaponProficiency.has("blunt"), "fumble nie ZACZYNA rodziny — nie zapisuje P_start");

  WeaponProficiency.reset();
  const czyste = trenuj("dagger", "clean").ciosy;
  WeaponProficiency.reset();
  const zeslizgi = trenuj("dagger", "graze").ciosy;
  const iloraz = zeslizgi / czyste;
  ok(
    blisko(iloraz, 1 / PROFICIENCY.slipMultiplier, 0.02),
    "sama ześlizgami droga trwa ×1/0,30 dłużej",
    `×${iloraz.toFixed(3)}`,
  );
}

console.log("\n§7  Zapis i odczyt\n");
{
  WeaponProficiency.reset();
  WeaponProficiency.set("sword", 50);
  trenuj("axe");                       // topór: start 25, dojście do 35
  WeaponProficiency.practiceOnDummy("polearm", "clean"); // pula bez punktu
  const p = WeaponProficiency.snapshot();
  const s = WeaponProficiency.startSnapshot();
  const pool = WeaponProficiency.poolSnapshot();
  ok(p.axe === 35 && s.axe === 25, "migawka niesie P i P_start osobno", `P=${p.axe} start=${s.axe}`);
  ok(pool.polearm > 0, "pula poniżej punktu też jest zapisywana", `${pool.polearm.toFixed(2)}`);

  const przezJSON = (o) => JSON.parse(JSON.stringify(o));
  WeaponProficiency.reset();
  WeaponProficiency.restore(przezJSON(p), przezJSON(s), przezJSON(pool));
  ok(WeaponProficiency.get("axe") === 35, "P przeżywa zapis→odczyt");
  ok(WeaponProficiency.startOf("axe") === 25, "P_start przeżywa zapis→odczyt");
  ok(WeaponProficiency.dummyGainFor("axe", "clean") === 0, "wyczerpany manekin ZOSTAJE wyczerpany po wczytaniu");
  ok(WeaponProficiency.poolSnapshot().polearm > 0, "pula przeżywa zapis→odczyt");

  // Zapis SPRZED praktyki: samo `P`, bez P_start i bez puli.
  WeaponProficiency.reset();
  WeaponProficiency.restore({ sword: 5 });
  ok(WeaponProficiency.startOf("sword") === 5, "stary zapis: P_start uzupełniony wartością P, nie zerem");
  ok(
    WeaponProficiency.dummyGainFor("sword", "clean") > 0,
    "stary zapis dostaje manekina od miejsca, w którym go zastano (lp = 0)",
  );

  WeaponProficiency.reset();
  WeaponProficiency.restore({ sword: -5, kusza: 40, axe: Number.NaN });
  ok(!WeaponProficiency.has("sword") && !WeaponProficiency.has("axe"), "wartości bez sensu odsiane");
  ok(WeaponProficiency.known().length === 0, "nieznana rodzina odsiana");
}

console.log("\n§8  Narzędzie testowe (Patryczek) nie psuje limitu manekina\n");
{
  WeaponProficiency.reset();
  // ⚠ Najpierw RANGA, potem biegłość: `set` zaciska `P` do sufitu (§34.3),
  // więc `set(100)` bez rangi dałoby 50. To jest model, nie usterka narzędzia.
  WeaponProficiency.setMastery("sword", 2);
  WeaponProficiency.set("sword", 100);
  ok(WeaponProficiency.get("sword") === 100, "z M-II sufit wynosi 200, więc P = 100 wchodzi w całości");
  ok(WeaponProficiency.startOf("sword") === 100, "ustawienie wprost ZAPISUJE P_start");
  const przed = WeaponProficiency.get("sword");
  for (let i = 0; i < 2000; i++) WeaponProficiency.practiceOnDummy("sword", "clean");
  ok(
    WeaponProficiency.get("sword") === przed + 10,
    "manekin daje 10 punktów od USTAWIONEJ wartości i staje",
    `${przed} → ${WeaponProficiency.get("sword")}`,
  );
}

console.log("\n§9  Warstwa 2 (obrażenia) NIETKNIĘTA\n");
{
  const PROF = await zbuduj("src/core/Proficiency.ts", "prof");
  ok(PROF.qualityMultiplier(100) === 1, "m(100) = dokładnie 1 — punkt neutralny bez zmian");
  ok(PROF.missChance(100) === 0 && PROF.slipChance(100) === 0, "przy P = 100 zero fumbli i zero ześlizgów");
  let zgodne = true;
  for (let d = 1; d <= 60; d++) if (PROF.scaleDamage(d, 100, "clean") !== d) zgodne = false;
  ok(zgodne, "scaleDamage(d, 100, clean) === d dla d = 1..60");
}

console.log("\n§10  MASTERY jako stan KUPOWANY (§34) — ranga, sufit, zakup, zapis\n");
{
  const progi = PROFICIENCY.masteryThresholds;
  const cennik = PROFICIENCY.mastery.cost;

  ok(
    cennik.length === progi.length,
    "cennik ma tyle pozycji, ile progów — cztery rangi, cztery ceny",
    `${cennik.map((c) => `${c.gold}g/${c.points}pkt`).join(" · ")}`,
  );
  ok(
    cennik.reduce((s, c) => s + c.gold, 0) === 2800 && cennik.reduce((s, c) => s + c.points, 0) === 6,
    "pełna rodzina kosztuje 2800 g + 6 pkt rozwoju (§34.2)",
  );
  ok(cennik[0].points === 0, "M-I nie kosztuje punktów — przesiadka ma zostać tania (§14a)");
  ok(PROFICIENCY.mastery.trainer === "patryczek", "trener z configu, JEDEN (D5, §34.9)");

  // ── Sufit `P` wynika z rangi WYKUPIONEJ, nie z `P` ────────────────────
  WeaponProficiency.reset();
  ok(WeaponProficiency.capFor("sword") === progi[0], "bez rangi sufit = 50");
  for (let r = 1; r <= progi.length; r++) {
    WeaponProficiency.setMastery("sword", r);
    const oczekiwany = r < progi.length ? progi[r] : Infinity;
    ok(
      WeaponProficiency.capFor("sword") === oczekiwany,
      `M-${["", "I", "II", "III", "IV"][r]} → sufit ${oczekiwany === Infinity ? "brak" : oczekiwany}`,
    );
  }

  // ── `P` NIE nadaje rangi — sedno odwrócenia wariantu A ────────────────
  WeaponProficiency.reset();
  WeaponProficiency.set("axe", 45);
  const wynik = trenuj("axe");
  ok(wynik.do === progi[0], "praktyka STAJE dokładnie na suficie 50, nie na P_start+10", `${wynik.od} → ${wynik.do}`);
  ok(WeaponProficiency.poolSnapshot().axe === 0, "praktyka zdobyta na suficie PRZEPADA — pula wyzerowana (§34.3)");
  ok(WeaponProficiency.dummyGainFor("axe", "clean") === 0, "na suficie manekin pokazuje ZERO praktyki");
  ok(WeaponProficiency.atCap("axe"), "`atCap` mówi prawdę — UI ma czym ostrzec (§34.7)");
  ok(
    WeaponProficiency.masteryOf("axe") === 0,
    "⭐ P = 50 NIE nadaje Mastery I — ranga jest osobnym stanem (§34.1)",
  );
  ok(
    WeaponProficiency.thresholdRankFor(WeaponProficiency.get("axe")) === 1,
    "…ale PRÓG jest przekroczony: uprawnienie tak, ranga nie",
  );
  ok(
    WeaponProficiency.startValue() === PROFICIENCY.startNewFamily.veteran,
    "⭐ D3: podłoga weterana wchodzi od PROGU `P ≥ 50`, bez ani jednego zakupu (§34.8)",
  );

  // ── Zakup wszystkich czterech rang ────────────────────────────────────
  WeaponProficiency.reset();
  Inventory.gold = 5000;
  Progression.skillPoints = 10;
  WeaponProficiency.set("sword", 0);
  ok(WeaponProficiency.masteryOffer("sword").blocked === "proficiency", "za niskie `P` blokuje zakup i mówi CZYM");
  ok(WeaponProficiency.unlockMastery("sword") === false, "zakup poniżej progu ODRZUCONY");
  ok(Inventory.gold === 5000, "odrzucony zakup nie pobrał ani sztuki złota");

  const zloto0 = Inventory.gold;
  const punkty0 = Progression.skillPoints;
  let kupione = 0;
  for (let r = 0; r < progi.length; r++) {
    WeaponProficiency.set("sword", progi[r]);
    const oferta = WeaponProficiency.masteryOffer("sword");
    ok(oferta.ready && oferta.next === r + 1, `na progu ${progi[r]} oferta to M-${r + 1} i jest gotowa`);
    if (WeaponProficiency.unlockMastery("sword")) kupione++;
  }
  ok(kupione === progi.length, "wszystkie cztery rangi wykupione po kolei", `${kupione}/${progi.length}`);
  ok(WeaponProficiency.masteryOf("sword") === 4, "ranga wykupiona to M-IV");
  ok(zloto0 - Inventory.gold === 2800, "pobrane złoto = 2800", `${zloto0 - Inventory.gold}g`);
  ok(punkty0 - Progression.skillPoints === 6, "pobrane punkty rozwoju = 6", `${punkty0 - Progression.skillPoints}`);
  ok(WeaponProficiency.capFor("sword") === Infinity, "na M-IV sufit znika");
  ok(WeaponProficiency.masteryOffer("sword").blocked === "maxed", "po M-IV nie ma czego kupować");
  ok(WeaponProficiency.unlockMastery("sword") === false, "piąty zakup ODRZUCONY");

  // Brak waluty: obie odmowy nazwane, żadna nie pobiera połowy ceny.
  WeaponProficiency.reset();
  WeaponProficiency.set("dagger", progi[0]);
  Inventory.gold = 10;
  Progression.skillPoints = 0;
  ok(WeaponProficiency.masteryOffer("dagger").blocked === "gold", "brak złota nazwany wprost");
  ok(WeaponProficiency.unlockMastery("dagger") === false, "zakup bez złota ODRZUCONY");
  Inventory.gold = 5000;
  WeaponProficiency.unlockMastery("dagger"); // M-I: 0 pkt, przechodzi
  WeaponProficiency.set("dagger", progi[1]);
  ok(WeaponProficiency.masteryOffer("dagger").blocked === "points", "brak punktów rozwoju nazwany wprost");
  const zlotoPrzed = Inventory.gold;
  ok(WeaponProficiency.unlockMastery("dagger") === false, "zakup bez punktów ODRZUCONY");
  ok(Inventory.gold === zlotoPrzed, "⭐ odrzucony zakup NIE pobrał złota — oba koszty sprawdzane razem");

  // ── Zapis i odczyt rang ───────────────────────────────────────────────
  const przezJSON = (o) => JSON.parse(JSON.stringify(o));
  const p = WeaponProficiency.snapshot();
  const s = WeaponProficiency.startSnapshot();
  const pool = WeaponProficiency.poolSnapshot();
  const m = WeaponProficiency.masterySnapshot();
  ok(m.dagger === 1, "migawka niesie wykupioną rangę osobno od `P`", `${JSON.stringify(m)}`);
  WeaponProficiency.reset();
  WeaponProficiency.restore(przezJSON(p), przezJSON(s), przezJSON(pool), przezJSON(m));
  ok(WeaponProficiency.masteryOf("dagger") === 1, "ranga przeżywa zapis→odczyt");
  ok(WeaponProficiency.capFor("dagger") === progi[1], "sufit po wczytaniu wynika z wczytanej rangi");
  ok(WeaponProficiency.get("dagger") === progi[1], "`P` przeżywa zapis→odczyt razem z rangą");

  // Zapis SPRZED §34: samo `P`, żadnych rang. `P` zostaje, ranga zeruje się.
  WeaponProficiency.reset();
  WeaponProficiency.restore({ sword: 300 });
  ok(WeaponProficiency.get("sword") === 300, "stary zapis: `P` NIETKNIĘTE, nawet ponad dzisiejszym sufitem");
  ok(WeaponProficiency.masteryOf("sword") === 0, "stary zapis: zero rang — nie fabrykujemy zakupów");
  ok(WeaponProficiency.atCap("sword"), "taka postać stoi (praktyka nie płynie), dopóki nie kupi rangi");

  // Sanityzacja rang, ta sama co dla `P`.
  WeaponProficiency.reset();
  WeaponProficiency.restore({ sword: 10 }, undefined, undefined, { sword: 99, kusza: 2, axe: -1 });
  ok(WeaponProficiency.masteryOf("sword") === 4, "ranga ponad skalę przycięta do M-IV");
  ok(WeaponProficiency.masteryOf("axe") === 0, "ranga ujemna odsiana");

  // `reset` i `clear` zabierają też rangę — inaczej nowa gra zaczynałaby z M-IV.
  WeaponProficiency.reset();
  ok(WeaponProficiency.masteryOf("sword") === 0, "`reset` czyści rangi (nowa gra)");
  WeaponProficiency.setMastery("axe", 2);
  WeaponProficiency.set("axe", 100);
  WeaponProficiency.clear("axe");
  ok(WeaponProficiency.masteryOf("axe") === 0 && !WeaponProficiency.has("axe"), "`clear` czyści rangę razem z `P`");
}

/* ══════════════════════════════════════════════════════════════════════════
   §10a  OKNO PRZEDSPRZEDAŻY RANGI — `cap − unlockLead` (§34.2a, 2026-09-03)

   ⚠ **Zmienia się WYŁĄCZNIE moment zakupu.** Sufit, przepadanie praktyki,
   progi, cennik, efekty rang i `thresholdRankFor` mają zostać nietknięte —
   i to jest połowa asercji tej sekcji: nie „czy okno działa", tylko **czego
   okno NIE RUSZYŁO**.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§10a  OKNO PRZEDSPRZEDAŻY RANGI — `cap − unlockLead` (§34.2a)\n");
{
  const progi = PROFICIENCY.masteryThresholds;
  const cennik = PROFICIENCY.mastery.cost;
  const lead = PROFICIENCY.mastery.unlockLead;

  ok(lead === 10, "okno przedsprzedaży = 10 punktów `P`", `${lead}`);
  ok(
    progi[0] === 50 && progi[1] === 100 && progi[2] === 200 && progi[3] === 350,
    "⛔ progi Mastery NIETKNIĘTE: 50 / 100 / 200 / 350",
  );
  ok(
    cennik.reduce((s, c) => s + c.gold, 0) === 2800 && cennik.reduce((s, c) => s + c.points, 0) === 6,
    "⛔ cennik NIETKNIĘTY: 2800 g + 6 pkt za pełną rodzinę",
  );

  // ── Pełna drabina: cap−11 / cap−10 / zakup / nowy sufit ────────────────
  for (let r = 0; r < progi.length; r++) {
    WeaponProficiency.reset();
    Inventory.gold = 100_000;
    Progression.skillPoints = 100;
    if (r > 0) WeaponProficiency.setMastery("sword", r);
    const cap = WeaponProficiency.capFor("sword");
    const etykieta = ["brak rangi", "M-I", "M-II", "M-III"][r];
    ok(cap === progi[r], `${etykieta}: sufit ${progi[r]} (bez zmian)`, `${cap}`);

    // cap − 11: JESZCZE nie
    WeaponProficiency.set("sword", cap - lead - 1);
    let oferta = WeaponProficiency.masteryOffer("sword");
    ok(
      !oferta.ready && oferta.blocked === "proficiency",
      `${etykieta} · P = ${cap - lead - 1} (cap−11): zakup jeszcze ZAMKNIĘTY`,
    );
    ok(WeaponProficiency.unlockMastery("sword") === false, "…i realny zakup ODRZUCONY");

    // cap − 10: DOKŁADNIE tu się otwiera
    WeaponProficiency.set("sword", cap - lead);
    oferta = WeaponProficiency.masteryOffer("sword");
    ok(
      oferta.ready && oferta.blocked === null && oferta.next === r + 1,
      `${etykieta} · P = ${cap - lead} (cap−10): zakup OTWARTY`,
    );
    ok(
      oferta.requiredProficiency === cap - lead,
      "oferta podaje `cap − 10`, nie próg — UI ma czym nie skłamać",
      `${oferta.requiredProficiency}`,
    );
    // ⚠ Samo okno NIE JEST podniesieniem sufitu.
    ok(WeaponProficiency.capFor("sword") === cap, "⛔ okno NIE rusza sufitu");
    ok(!WeaponProficiency.atCap("sword"), "⛔ …i nie robi z gracza stojącego na suficie");
    // ⚠ Sparingpartner liczony z `P` GRACZA (`ρ = 1,5`), nie wpisany na
    // sztywno: nauczyciel jest KONTESTEM (§21), więc wilk `P = 68` przy graczu
    // `P = 90` milczy z projektu — i pierwsza wersja tej asercji świeciła na
    // czerwono właśnie dlatego, nie przez okno przedsprzedaży.
    ok(
      WeaponProficiency.combatGainFor("sword", "clean", (cap - lead) * 1.5, 1) > 0,
      "⛔ …a praktyka płynie normalnie — okno nic jej nie robi",
    );

    // Zakup PRZED sufitem
    const zlotoPrzed = Inventory.gold;
    const punktyPrzed = Progression.skillPoints;
    ok(WeaponProficiency.unlockMastery("sword") === true, `zakup M-${r + 1} PRZED sufitem PRZECHODZI`);
    ok(WeaponProficiency.masteryOf("sword") === r + 1, "…ranga zapisana jako osobny stan");
    ok(
      zlotoPrzed - Inventory.gold === cennik[r].gold &&
        punktyPrzed - Progression.skillPoints === cennik[r].points,
      "…po dokładnie tej samej cenie co przedtem",
      `${cennik[r].gold}g + ${cennik[r].points} pkt`,
    );
    ok(WeaponProficiency.get("sword") === cap - lead, "⛔ zakup NIE rusza `P`");
    const nowyCap = r + 1 < progi.length ? progi[r + 1] : Infinity;
    ok(
      WeaponProficiency.capFor("sword") === nowyCap,
      `…a sufit idzie w górę: ${cap} → ${nowyCap === Infinity ? "bez sufitu" : nowyCap}`,
    );
  }

  // ── Przykład autora: M-I + P = 90 → M-II → praktyka biegnie za 100 ─────
  WeaponProficiency.reset();
  Inventory.gold = 100_000;
  Progression.skillPoints = 100;
  WeaponProficiency.setMastery("sword", 1);
  WeaponProficiency.set("sword", 89);
  ok(!WeaponProficiency.masteryOffer("sword").ready, "⭐ M-I + P = 89 → M-II jeszcze niedostępne");
  WeaponProficiency.set("sword", 90);
  ok(WeaponProficiency.masteryOffer("sword").ready, "⭐ M-I + P = 90 → M-II dostępne");
  WeaponProficiency.unlockMastery("sword");
  ok(WeaponProficiency.capFor("sword") === 200, "…sufit 100 → 200");
  {
    // ⚠ Przeciwnik `P = 140`, czyli `ρ ≥ 1` wobec gracza na 90–110. Wilk
    // (`P = 68`) w tym miejscu NIE UCZY i to jest poprawne (§21) — mierzymy
    // sufit, nie funkcję nauczyciela.
    let ciosy = 0;
    while (WeaponProficiency.get("sword") <= 100 && ciosy < 100_000) {
      WeaponProficiency.practiceInCombat("sword", "clean", 140, () => 1);
      ciosy++;
    }
    ok(
      WeaponProficiency.get("sword") > 100,
      "⭐ …i praktyka NAPRAWDĘ biegnie za dawny sufit 100",
      `P = ${WeaponProficiency.get("sword")}`,
    );
  }

  // ── Osiągnięcie sufitu działa jak przedtem ────────────────────────────
  // ⚠ Okno miało dać CZAS, nie przesunąć limit: `P` dalej staje twardo na
  // progu i praktyka tam dalej przepada.
  WeaponProficiency.reset();
  WeaponProficiency.setMastery("sword", 1);
  WeaponProficiency.set("sword", 100);
  ok(WeaponProficiency.capFor("sword") === 100, "M-I bez zakupu M-II: sufit nadal 100");
  ok(WeaponProficiency.atCap("sword"), "…`P = 100` to nadal SUFIT");
  ok(
    WeaponProficiency.practiceInCombat("sword", "clean", 68, () => 1) === false &&
      WeaponProficiency.dummyGainFor("sword", "clean") === 0,
    "…i praktyka tam nadal PRZEPADA (§34.3 bez zmian)",
  );
  ok(WeaponProficiency.masteryOffer("sword").ready === true, "…a oferta M-II jest gotowa TYM BARDZIEJ");

  // ── ⛔ Okno NIE WCHODZI do odczytów o PROGU (§34.5, D3/§34.8) ──────────
  // Gracz z `P = 40` i wykupionym M-I **nie jest weteranem**: `P_start`
  // nowej rodziny pyta o PRÓG `P ≥ 50`, a nie o zapłatę.
  WeaponProficiency.reset();
  Inventory.gold = 100_000;
  Progression.skillPoints = 100;
  WeaponProficiency.set("sword", 40);
  ok(WeaponProficiency.masteryOffer("sword").ready, "P = 40 (cap−10) otwiera M-I");
  WeaponProficiency.unlockMastery("sword");
  ok(WeaponProficiency.masteryOf("sword") === 1, "…i M-I zostaje kupione przy `P` poniżej progu 50");
  ok(
    WeaponProficiency.thresholdRankFor(WeaponProficiency.get("sword")) === 0,
    "⛔ `thresholdRankFor` NIETKNIĘTE — próg 50 nadal nieprzekroczony",
  );
  ok(
    WeaponProficiency.startValue() === PROFICIENCY.startNewFamily.fresh,
    "⛔ D3 NIETKNIĘTE: wykupiona ranga NIE robi z gracza weterana (§34.8)",
  );
  WeaponProficiency.reset();
  Inventory.gold = 0;
  Progression.skillPoints = 0;
}

console.log("\n§11  ŁADUNKI RANG (§14) — efekty czytają RANGĘ WYKUPIONĄ, nie `P`\n");
{
  const { DEFENSE, WEAPON_FAMILY } = CFG;
  const platnosc = PROFICIENCY.mastery.payload;
  /** Załóż broń wprost — ta sama ścieżka, którą pisze `Save.load`. */
  const zaloz = (id) => {
    Equipment.weapon = normalizeInstance({ itemId: id, qty: 1 });
  };
  /** Ustaw rangę BEZ płacenia (to jest test efektów, nie ekonomii). */
  const ranga = (family, r) => {
    WeaponProficiency.setMastery(family, r);
  };
  const blisko2 = (a, b) => Math.abs(a - b) < 1e-9;

  // ── Bez rangi: ZERO efektu, choćby `P` było maksymalne ────────────────
  WeaponProficiency.reset();
  zaloz("sword");
  // ⚠ **Premia parowania jest od 2026-09-16 własnością KONSTRUKCJI**, nie rodziny
  //   (`WEAPON_FAMILY.sword` niesie już tylko znacznik `parry`). Czytamy ją z tej
  //   broni, którą trzyma postać — inaczej asercja mierzyłaby zero.
  const paradaBaza = DEFENSE.parry.core * (1 + (CFG.ITEMS.sword.melee?.parryBonus ?? 0));
  ok(blisko2(Progression.parryChance, paradaBaza), "bez rangi parada = baza rodziny", `${(Progression.parryChance * 100).toFixed(2)}%`);
  const kosztBaza = Progression.swingStaminaCost;
  ok(
    blisko2(kosztBaza, CFG.STAMINA.costs.autoAttackPerSecond * (Progression.swingDurationMs / 1000)),
    "bez rangi koszt zamachu = C × czas zamachu, bez redukcji",
    `${kosztBaza.toFixed(2)} pkt`,
  );
  const minBaza = Progression.meleeDamageMin;
  const maxBaza = Progression.meleeDamageMax;

  // ⚠ `P` z zapisu sprzed §34 — 350 punktów, ZERO wykupionych rang.
  WeaponProficiency.restore({ sword: 350 });
  ok(WeaponProficiency.masteryOf("sword") === 0, "kontrola: P = 350 przy zerze rang");
  ok(blisko2(Progression.parryChance, paradaBaza), "⭐ samo `P` NIE daje cechy rodziny");
  ok(blisko2(Progression.swingStaminaCost, kosztBaza), "⭐ samo `P` NIE obniża kosztu wysiłku");
  ok(blisko2(Progression.meleeDamageMin, minBaza), "⭐ samo `P` NIE podnosi minimum obrażeń");
  ok(Progression.critLowCut === 0, "⭐ samo `P` NIE daje `φ`");

  // ── M-I: wyłącznie ekonomia −12% ──────────────────────────────────────
  ranga("sword", 1);
  ok(blisko2(Progression.swingStaminaCost, kosztBaza * 0.88), "M-I: koszt zamachu −12% DOKŁADNIE", `${Progression.swingStaminaCost.toFixed(3)}`);
  ok(blisko2(Progression.parryChance, paradaBaza), "M-I: cecha rodziny jeszcze NIE działa");
  ok(blisko2(Progression.meleeDamageMin, minBaza), "M-I: minimum jeszcze NIE działa");

  // ── M-II: cecha rodziny ×1,5, ekonomia bez zmian ──────────────────────
  ranga("sword", 2);
  ok(blisko2(Progression.parryChance, paradaBaza * 1.5), "M-II: parada ×1,5 (D1 — mnożnik na EFEKCIE)", `${(Progression.parryChance * 100).toFixed(2)}%`);
  ok(blisko2(Progression.swingStaminaCost, kosztBaza * 0.88), "M-II: ekonomia zostaje na −12%");
  ok(blisko2(Progression.meleeDamageMin, minBaza), "M-II: minimum nadal NIE działa");

  // ── M-III: ekonomia −24% + minimum proporcjonalne ─────────────────────
  ranga("sword", 3);
  ok(blisko2(Progression.swingStaminaCost, kosztBaza * 0.76), "M-III: koszt zamachu −24% DOKŁADNIE");
  const oczekMin = minBaza + Math.round((maxBaza - minBaza) * platnosc.minimumShare);
  ok(blisko2(Progression.meleeDamageMin, oczekMin), "M-III: minimum += round(rozstrzał / 6)", `${minBaza.toFixed(1)} → ${Progression.meleeDamageMin.toFixed(1)} (max ${maxBaza.toFixed(1)})`);
  ok(blisko2(Progression.meleeDamageMax, maxBaza), "⭐ M-III NIE podnosi sufitu obrażeń — tylko podłogę");
  ok(blisko2(Progression.parryChance, paradaBaza * 1.5), "M-III: cecha rodziny zostaje ×1,5 (drabina kumulatywna)");

  // ── M-IV: cecha ×2,0 + ekonomia −35% ──────────────────────────────────
  ranga("sword", 4);
  ok(blisko2(Progression.parryChance, paradaBaza * 2), "M-IV: parada ×2,0", `${(Progression.parryChance * 100).toFixed(2)}%`);
  ok(blisko2(Progression.swingStaminaCost, kosztBaza * 0.65), "M-IV: koszt zamachu −35% DOKŁADNIE");
  ok(Progression.parryChance <= DEFENSE.parry.cap, "cap parady nietknięty i niewiążący", `${(Progression.parryChance * 100).toFixed(2)}% ≤ ${DEFENSE.parry.cap * 100}%`);

  // ── OBUCH: `staggerMs` 50 → 75 → 100 (FIELD ≡ EFFECT, D1 no-op) ───────
  WeaponProficiency.reset();
  zaloz("hammer");
  ok(Progression.staggerMs === familyTraitValue(WEAPON_FAMILY.blunt, "staggerMs"), "obuch bez rangi: zachwianie 50 ms");
  ranga("blunt", 2);
  ok(Progression.staggerMs === 75, "obuch M-II: 75 ms", `${Progression.staggerMs}`);
  ranga("blunt", 4);
  ok(Progression.staggerMs === 100, "obuch M-IV: 100 ms", `${Progression.staggerMs}`);
  ok(Progression.parryChance === 0, "obuch nie dostaje parady mieczowej");
  ok(Progression.critLowCut === 0, "obuch nie dostaje `φ`");

  // ── TOPÓR i SZTYLET: `φ` per ranga, i NIC poza tym ────────────────────
  for (const [id, family] of [["axe", "axe"], ["dagger", "dagger"]]) {
    WeaponProficiency.reset();
    zaloz(id);
    const oczekiwane = platnosc.critLowCut;
    let zgodne = true;
    for (let r = 0; r <= 4; r++) {
      ranga(family, r);
      if (!blisko2(Progression.critLowCut, oczekiwane[r])) zgodne = false;
    }
    ok(zgodne, `${id}: φ = ${oczekiwane.join(" / ")} po randze (D2)`);
    ranga(family, 4);
    ok(Progression.parryChance === 0 && Progression.staggerMs === 0, `${id}: żadnej cudzej cechy rodziny`);
    ok(
      blisko2(Progression.critMultiplier, CFG.PLAYER.critMultiplier + familyTraitValue(WEAPON_FAMILY[family], "critMultiplierBonus") + (CFG.ITEMS[id].melee?.critMultiplierBonus ?? 0)),
      `⛔ ${id}: Mastery NIE rusza mnożnika krytyka (§13)`,
      `${Progression.critMultiplier}`,
    );
    ok(
      Progression.critChance === Math.min(CFG.PLAYER.critChance + (CFG.ITEMS[id].melee?.critChanceBonus ?? 0), CFG.ATTRIBUTES.maxCritChance),
      `⛔ ${id}: Mastery NIE rusza szansy krytyka (§13)`,
    );
  }

  // ── WŁÓCZNIA: D3 — M-II i M-IV są PUSTE, i to jest decyzja ────────────
  WeaponProficiency.reset();
  zaloz("spear");
  ranga("polearm", 4);
  ok(
    Progression.parryChance === 0 && Progression.staggerMs === 0 && Progression.critLowCut === 0,
    "⭐ D3: włócznia na M-IV nie dostaje ŻADNEJ cechy rodziny — pusto z decyzji, nie z braku",
  );
  ok(blisko2(Progression.swingStaminaCost, CFG.STAMINA.costs.autoAttackPerSecond * (Progression.swingDurationMs / 1000) * 0.65),
     "…ale ekonomia wysiłku i minimum działają jej normalnie (ładunki rodzinowo neutralne)");

  // ── Ranga działa TYLKO w swojej rodzinie ──────────────────────────────
  WeaponProficiency.reset();
  ranga("axe", 4);
  zaloz("sword");
  ok(blisko2(Progression.parryChance, paradaBaza), "⭐ M-IV toporem nie robi nic dla miecza w ręku");
  ok(blisko2(Progression.swingStaminaCost, CFG.STAMINA.costs.autoAttackPerSecond * (Progression.swingDurationMs / 1000)),
     "…ani dla jego kosztu zamachu");

  // ── Efekty przeżywają zapis→odczyt ────────────────────────────────────
  WeaponProficiency.reset();
  zaloz("sword");
  ranga("sword", 4);
  const p = JSON.parse(JSON.stringify(WeaponProficiency.snapshot()));
  const s2 = JSON.parse(JSON.stringify(WeaponProficiency.startSnapshot()));
  const pool2 = JSON.parse(JSON.stringify(WeaponProficiency.poolSnapshot()));
  const m2 = JSON.parse(JSON.stringify(WeaponProficiency.masterySnapshot()));
  WeaponProficiency.reset();
  ok(blisko2(Progression.parryChance, paradaBaza), "kontrola: po `reset` efekt znika");
  WeaponProficiency.restore(p, s2, pool2, m2);
  ok(blisko2(Progression.parryChance, paradaBaza * 2), "⭐ po wczytaniu zapisu M-IV parada znów ×2,0");
  ok(blisko2(Progression.swingStaminaCost, kosztBaza * 0.65), "…a koszt zamachu znów −35%");

  Equipment.weapon = null;
}

console.log("\n§12  PRAKTYKA Z WALKI (D7, §20–§21) — nauczyciel, √n, wagi, sufit\n");
{
  const { RABBIT, SPIDER, BOAR, VENOM_SPIDER, BEAR, WOLF, GREY_WOLF, TRAINING_DUMMY } = CFG;
  const T = PRACTICE.combat.teacher;

  // ── Funkcja nauczyciela: kształt z §21 ────────────────────────────────
  ok(P.teacher(T.deadBelow) === 0, "ρ = 0,8 → nauczyciel MILCZY (dokładnie 0)");
  ok(P.teacher(0.5) === 0, "ρ poniżej 0,8 → 0");
  ok(blisko(P.teacher(T.nominalAt), 1), "ρ = 1,0 → nominalnie 1");
  ok(P.teacher(T.peakAt) === T.max && P.teacher(99) === T.max, "ρ ≥ 2,0 → sufit K = 4");
  ok(blisko(P.teacher(0.9), 0.5), "odcinek 0,8–1,0 interpolowany LINIOWO (D7: domknięcie bez urwiska)");
  ok(P.teacher(1.5) > P.teacher(1.2) && P.teacher(1.2) > P.teacher(1.0), "rampa 1 → 4 jest rosnąca");
  // ⭐ Kontrola wobec TABELI Z CHECKPOINTU (§14b, kolumna `K` przy P gracza 25).
  const K = (Pw) => P.teacher(Pw / 25);
  ok(blisko(K(RABBIT.proficiency), 0), "królik przy P=25: K = 0,00 (§14b)");
  ok(blisko(K(SPIDER.proficiency), 2.08, 1e-9), "sieciarz przy P=25: K = 2,08 (§14b)", `${K(34).toFixed(2)}`);
  ok(blisko(K(BOAR.proficiency), 3.76, 1e-9), "dzik przy P=25: K = 3,76 (§14b)", `${K(48).toFixed(2)}`);
  ok(K(VENOM_SPIDER.proficiency) === 4 && K(WOLF.proficiency) === 4 && K(BEAR.proficiency) === 4,
     "skoczek, wilk i niedźwiedź przy P=25: K = 4,00 (§14b)");
  ok(blisko(P.combatPractice(0, RABBIT.proficiency, 1), PRACTICE.base * T.max * PRACTICE.combat.c),
     "⭐ przy P = 0 uczy KAŻDY, także królik — pierwsze punkty da się wziąć z walki");
  ok(P.combatPractice(25, RABBIT.proficiency, 1) === 0,
     "…i dokładnie na P = 25 królik milknie — sufit P/0,8 z §16 wypada sam");

  // ── Malejący przyrost `c·√n` ──────────────────────────────────────────
  {
    const g = (k) => P.combatPractice(30, WOLF.proficiency, k);
    ok(g(1) > g(2) && g(2) > g(3) && g(3) > g(10), "k-te trafienie daje CORAZ MNIEJ (√k − √(k−1))");
    let suma = 0;
    for (let k = 1; k <= 9; k++) suma += g(k);
    ok(blisko(suma, g(1) * 3, 1e-9), "suma po 9 trafieniach = 3× pierwsze (czyli dokładnie c·√9)");
    ok(P.combatPractice(30, WOLF.proficiency, 0) === 0, "k = 0 nie istnieje — zwraca 0");
  }

  // ── Kanał stanu: wagi wykonania, sufit, licznik ───────────────────────
  const licznik = () => {
    let k = 0;
    return { next: () => ++k, get value() { return k; } };
  };
  WeaponProficiency.reset();
  {
    const czysty = WeaponProficiency.combatGainFor("sword", "clean", WOLF.proficiency, 1);
    const zeslizg = WeaponProficiency.combatGainFor("sword", "graze", WOLF.proficiency, 1);
    ok(czysty > 0, "clean daje praktykę z walki", `${czysty.toFixed(2)} jedn.`);
    ok(blisko(zeslizg / czysty, PROFICIENCY.slipMultiplier, 1e-12), "graze = 30% czystego ciosu");
    ok(WeaponProficiency.combatGainFor("sword", "fumble", WOLF.proficiency, 1) === 0, "fumble = 0");
    ok(WeaponProficiency.combatGainFor("sword", "whiff", WOLF.proficiency, 1) === 0, "whiff = 0");
  }

  // Nowa postać bijąca wilka — czy `P` w ogóle rośnie i po ilu ciosach.
  WeaponProficiency.reset();
  {
    const c = licznik();
    let ciosy = 0;
    while (WeaponProficiency.get("sword") === 0 && ciosy < 5000) {
      WeaponProficiency.practiceInCombat("sword", "clean", WOLF.proficiency, c.next);
      ciosy++;
    }
    ok(WeaponProficiency.get("sword") > 0, "⭐ nowa postać ZDOBYWA P w walce z wilkiem", `${ciosy} trafień`);
    ok(WeaponProficiency.startOf("sword") === 0, "kanał walki ZACZYNA rodzinę i zapisuje P_start");
    ok(c.value === ciosy, "licznik `k` rósł co trafienie niosące praktykę");
  }

  // Fumble i whiff nie zużywają licznika `k` ani nie zaczynają rodziny.
  WeaponProficiency.reset();
  {
    const c = licznik();
    for (let i = 0; i < 50; i++) WeaponProficiency.practiceInCombat("axe", "fumble", WOLF.proficiency, c.next);
    for (let i = 0; i < 50; i++) WeaponProficiency.practiceInCombat("axe", "whiff", WOLF.proficiency, c.next);
    ok(c.value === 0, "⭐ fuszerka i pudło NIE zużywają licznika malejącego przyrostu");
    ok(!WeaponProficiency.has("axe"), "…ani nie zaczynają rodziny");
  }

  // Milczący nauczyciel też nie zużywa `k`.
  WeaponProficiency.reset();
  WeaponProficiency.set("sword", 30); // królik: ρ = 20/30 = 0,67 → 0
  {
    const c = licznik();
    const przed = WeaponProficiency.get("sword");
    for (let i = 0; i < 200; i++) WeaponProficiency.practiceInCombat("sword", "clean", RABBIT.proficiency, c.next);
    ok(WeaponProficiency.get("sword") === przed, "przeciwnik poniżej ρ = 0,8 nie uczy ani punktu");
    ok(c.value === 0, "…i nie zużywa licznika `k`");
  }

  // Sufit `P` obowiązuje TAK SAMO jak na manekinie (§34.3).
  WeaponProficiency.reset();
  WeaponProficiency.set("sword", PROFICIENCY.masteryThresholds[0]); // 50, bez rangi
  {
    const c = licznik();
    const przed = WeaponProficiency.get("sword");
    for (let i = 0; i < 500; i++) WeaponProficiency.practiceInCombat("sword", "clean", GREY_WOLF.proficiency, c.next);
    ok(WeaponProficiency.get("sword") === przed, "⭐ na suficie `P` praktyka z WALKI też przepada (§34.3)");
    ok(WeaponProficiency.poolSnapshot().sword === 0, "…i nie bankuje się w puli");
    ok(WeaponProficiency.masteryOf("sword") === 0, "…a `P` nadal NIE nadaje rangi Mastery");
  }
  // Po wykupieniu rangi sufit rośnie i praktyka z walki znów płynie.
  WeaponProficiency.setMastery("sword", 1);
  {
    const c = licznik();
    const przed = WeaponProficiency.get("sword");
    for (let i = 0; i < 500 && WeaponProficiency.get("sword") === przed; i++) {
      WeaponProficiency.practiceInCombat("sword", "clean", GREY_WOLF.proficiency, c.next);
    }
    ok(WeaponProficiency.get("sword") > przed, "po wykupieniu M-I praktyka z walki rusza dalej", `${przed} → ${WeaponProficiency.get("sword")}`);
  }

  // ── `teachingRole` — pole projektowe, wartości z §16 ──────────────────
  ok(
    RABBIT.teachingRole === false && SPIDER.teachingRole === false &&
      BOAR.teachingRole === true && VENOM_SPIDER.teachingRole === true &&
      BEAR.teachingRole === true && WOLF.teachingRole === true,
    "teachingRole zgodne z §16: dzik/skoczek/niedźwiedź/wilk = true, królik/sieciarz = false",
  );
  ok(GREY_WOLF.teachingRole === false, "Szary POZA zbiorem (respawnDelay = 0) — §14b");
  ok(TRAINING_DUMMY.teachingRole === false && TRAINING_DUMMY.proficiency === 0,
     "manekin nie jest nauczycielem i ma własny kanał");
  ok(
    WeaponProficiency.combatGainFor("sword", "clean", TRAINING_DUMMY.proficiency, 1) === 0,
    "⭐ manekin przepuszczony kanałem WALKI dałby zero — `proficiency 0` milczy",
  );
  // ⚠ **`teachingRole = false` NIE jest bramką** i uprząż tego pilnuje: sieciarz
  // ma uczyć nowicjusza mimo flagi. Bramka odcięłaby pierwsze punkty z walki.
  WeaponProficiency.reset();
  ok(
    WeaponProficiency.combatGainFor("sword", "clean", SPIDER.proficiency, 1) > 0,
    "⭐ flaga `false` NIE odcina praktyki — decyduje wyłącznie funkcja nauczyciela",
  );

  /* ── Sanity TEMPA: ile realnych walk do `P = 50` (sufit bez rangi) ──────
     ⚠ **Liczone po WALKACH, nie po ciosach**, bo `k` żyje na egzemplarzu:
     każdy wilk to nowa instancja, więc licznik startuje od 1 w każdej walce.
     Bicie jednego, nieśmiertelnego wilka dałoby 139 872 trafień — i to jest
     dokładnie ta własność, dla której `√n` istnieje. */
  WeaponProficiency.reset();
  {
    const CIOSY_NA_WALKE = 4; // wilk ginie w 4 zamachach (§24)
    const SEK_NA_WALKE = 9.9; // walka + narzut dojścia (§24)
    let walki = 0;
    while (WeaponProficiency.get("sword") < 50 && walki < 100_000) {
      for (let k = 1; k <= CIOSY_NA_WALKE; k++) {
        WeaponProficiency.practiceInCombat("sword", "clean", WOLF.proficiency, () => k);
      }
      walki++;
    }
    const minuty = (walki * SEK_NA_WALKE) / 60;
    ok(walki < 1000, "droga `P 0 → 50` w walce jest skończona i sensowna", `${walki} walk z wilkiem`);
    console.log(
      `  ⚠    tempo orientacyjne: P 0 → 50 to ${walki} walk z wilkiem ≈ ${minuty.toFixed(0)} min ` +
        `aktywnej walki (§16 zapowiadało 22 min)`,
    );
  }
  WeaponProficiency.reset();
}

/* ══════════════════════════════════════════════════════════════════════════
   §13  POWIADOMIENIE O SUFICIE `P` — kontrakt §34.10 poz. 12

   ⚠ **To NIE jest test oprawy.** §34.3 mówi wprost: praktyka zdobyta na
   suficie **przepada i nie jest bankowana**, więc trening bez wizyty
   u trenera jest czasem straconym — i dlatego §34.7 nazywa powiadomienie
   OBOWIĄZKOWYM elementem, nie ozdobą. Bez zdarzenia jedynymi nośnikami tej
   informacji są trzy panele, które gracz musi otworzyć z własnej inicjatywy.

   Sprawdzane jest ZDARZENIE (`weaponCapReached`), bo tylko ono jest po tej
   stronie granicy Phasera; rysowanie napisu należy do `ui/PracticeToast`
   i dławienie mieszka TAM (ten singleton nie ma zegara).
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§13  POWIADOMIENIE O SUFICIE (§34.3/§34.7, kontrakt poz. 12)\n");
{
  const { WOLF } = CFG;
  const zdarzenia = [];
  const sluchacz = (p) => zdarzenia.push(p);
  GameEvents.on(EVENT.weaponCapReached, sluchacz);

  // ── Manekin: dojście do sufitu w kanale, który go NIE dosięga ───────────
  // Manekin uczy tylko 10 punktów od `P_start`, więc sufit 50 osiąga wyłącznie
  // walka. Tu sprawdzamy stan odwrotny: dopóki sufit jest daleko, CISZA.
  WeaponProficiency.reset();
  trenuj("sword");
  ok(zdarzenia.length === 0, "poniżej sufitu NIE MA powiadomienia — manekin milczy do końca limitu");

  // ── Walka: chwila dojścia do sufitu ─────────────────────────────────────
  WeaponProficiency.reset();
  zdarzenia.length = 0;
  {
    let walki = 0;
    while (WeaponProficiency.get("sword") < 50 && walki < 100_000) {
      for (let k = 1; k <= 4; k++) {
        WeaponProficiency.practiceInCombat("sword", "clean", WOLF.proficiency, () => k);
      }
      walki++;
    }
    const dojscia = zdarzenia.filter((z) => z.reached);
    ok(WeaponProficiency.get("sword") === 50, "walka dobija dokładnie do sufitu 50");
    ok(dojscia.length === 1, "chwila dojścia ogłoszona DOKŁADNIE RAZ", `${dojscia.length}`);
    ok(
      dojscia[0]?.family === "sword" && dojscia[0]?.cap === 50,
      "powiadomienie niesie RODZINĘ i SUFIT — panel nie musi ich zgadywać",
    );
  }

  // ── Zmarnowany cios na suficie — oba kanały ─────────────────────────────
  zdarzenia.length = 0;
  const dalejWalka = WeaponProficiency.practiceInCombat("sword", "clean", WOLF.proficiency, () => 1);
  ok(dalejWalka === false, "cios na suficie nie daje punktu (§34.3, bez zmian)");
  ok(
    zdarzenia.length === 1 && zdarzenia[0].reached === false,
    "…ale JEST ogłoszony jako strata — inaczej gracz bije w próżnię bez sygnału",
  );
  zdarzenia.length = 0;
  WeaponProficiency.practiceOnDummy("sword", "clean");
  ok(
    zdarzenia.length === 1 && zdarzenia[0].reached === false,
    "manekin na suficie ogłasza to SAMO — jedna reguła, dwa kanały",
  );

  // ⚠ Fuszerka i pudło nie są stratą praktyki „na suficie" — one nie niosły
  // praktyki w ogóle. Ogłoszenie ich mieszałoby dwie różne rzeczy.
  zdarzenia.length = 0;
  WeaponProficiency.practiceInCombat("sword", "fumble", WOLF.proficiency, () => 1);
  WeaponProficiency.practiceOnDummy("sword", "whiff");
  ok(zdarzenia.length === 0, "fuszerka i pudło MILCZĄ — nie było czego stracić");

  // ── Zakup rangi gasi powiadomienie ──────────────────────────────────────
  Inventory.gold = 5000;
  Progression.skillPoints = 10;
  ok(WeaponProficiency.unlockMastery("sword") === true, "zakup M-I przechodzi (P = 50 = próg)");
  zdarzenia.length = 0;
  WeaponProficiency.practiceInCombat("sword", "clean", WOLF.proficiency, () => 1);
  ok(zdarzenia.length === 0, "⭐ po zakupie rangi powiadomienie MILKNIE — sufit poszedł w górę");

  GameEvents.off(EVENT.weaponCapReached, sluchacz);
  WeaponProficiency.reset();
}

console.log(`\nSprawdzeń: ${sprawdzen}.`);
if (bledy > 0) {
  console.log(`⛔ BŁĘDÓW: ${bledy}`);
  process.exit(1);
}
console.log("OK — praktyka i manekin zachowują się zgodnie z §14a/§14b/§19/§22.");

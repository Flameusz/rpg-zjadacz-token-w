/**
 * WARSTWA EFEKTÓW — uprząż księgowości (`src/core/combat/StatusEffects.ts`).
 *
 * Powstała razem z warstwą (2026-09-03, D3), bo migracja przeniosła cztery
 * ręcznie pisane efekty gracza (jad, spowolnienie, buff obrażeń, posiłek) na
 * wspólny mechanizm — a **żaden istniejący test ich nie dotykał**: mieszkały
 * na `Player`, czyli za Phaserem i za zegarem sceny.
 *
 * ⚠ **Sprawdza KSIĘGOWOŚĆ, nie efekty.** „Ile obrażeń robi jad" należy do
 * `Player`; tutaj chodzi o czas trwania, stosy, odświeżenie, tiki, pauzę,
 * odporność i rozproszenie. Warstwa jest czysta, więc wchodzi wprost — bez
 * stuba Phasera, bez sceny.
 *
 * ⚠ **Ta uprząż UMIE zaświecić na czerwono — sprawdzone, nie założone:**
 * zerowanie `sinceTickMs` przy odświeżeniu → 1 błąd (§2); zamiana kolejności
 * „wygaśnięcie przed tikiem" na odwrotną → 1 błąd (§3).
 */

import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "effects-"));
let bledy = 0;
let sprawdzen = 0;

function ok(warunek, opis, detal = "") {
  sprawdzen++;
  if (warunek) console.log(`  OK   ${opis}${detal ? "   " + detal : ""}`);
  else {
    bledy++;
    console.log(`  ⛔   ${opis}${detal ? "   " + detal : ""}`);
  }
}

const out = join(tmp, "effects.mjs");
await build({
  entryPoints: [resolve("src/core/combat/StatusEffects.ts")],
  bundle: true,
  format: "esm",
  outfile: out,
  logLevel: "silent",
});
const { EffectSet } = await import(pathToFileURL(out).href);

/* ⚠ **Drugi i trzeci bundle — `EffectKinds` i `GameConfig` — doszły 2026-09-04
   razem z Krwawieniem.** Powód jest ten sam, dla którego `EffectKinds` w ogóle
   powstało: umowa producenta z konsumentem to `tag` + komplet kluczy payloadu,
   a uprząż testująca ją WŁASNYMI literałami („bleed", „damagePerTick")
   dowodziłaby wyłącznie samej siebie. §7 niżej używa PRAWDZIWEGO rodzaju
   i PRAWDZIWYCH liczb z `ABILITIES.rend.bleed`, więc przestrojenie configu
   przechodzi tu natychmiast, a literówka w kluczu świeci na czerwono. */
const outKinds = join(tmp, "kinds.mjs");
await build({
  entryPoints: [resolve("src/core/combat/EffectKinds.ts")],
  bundle: true,
  format: "esm",
  outfile: outKinds,
  logLevel: "silent",
});
const { BLEED } = await import(pathToFileURL(outKinds).href);

const outCfg = join(tmp, "cfg.mjs");
await build({
  entryPoints: [resolve("src/config/GameConfig.ts")],
  bundle: true,
  format: "esm",
  outfile: outCfg,
  logLevel: "silent",
});
const { ABILITIES } = await import(pathToFileURL(outCfg).href);

/** Host testowy — zlicza, o co warstwa pyta. */
function host(opcje = {}) {
  const h = {
    tiki: [],
    zmiany: 0,
    onEffectTick(e) {
      h.tiki.push({ id: e.spec.id, stacks: e.stacks });
    },
    onEffectsChanged() {
      h.zmiany++;
    },
  };
  if (opcje.immune) h.isImmuneTo = opcje.immune;
  if (opcje.paused) h.isEffectPaused = opcje.paused;
  return h;
}

const JAD = {
  id: "venom",
  name: "Jad",
  iconKey: "i",
  durationMs: 6000,
  tickMs: 1500,
  maxStacks: 3,
  debuff: true,
  tags: ["poison"],
  payload: { damagePerStack: 2 },
};

console.log("\n§1  Nałożenie i podstawowa księgowość\n");
{
  const h = host();
  const zbior = new EffectSet(h);
  const e = zbior.apply(JAD);
  ok(!!e, "nałożenie zwraca żywy efekt");
  ok(zbior.has("venom"), "efekt jest w zbiorze");
  ok(e.remainingMs === 6000, "czas trwania = `durationMs`", `${e.remainingMs}`);
  ok(e.stacks === 1, "pierwszy stos");
  ok(zbior.stacksOf("venom") === 1 && zbior.stacksOf("brak") === 0, "`stacksOf` zwraca 0 dla nieobecnego");
  ok(zbior.dataOf("venom", "damagePerStack") === 2, "`payload` skopiowany do żywych danych");
  ok(h.zmiany === 1, "nałożenie OGŁOSZONE dokładnie raz", `${h.zmiany}`);
  ok(zbior.apply({ ...JAD, durationMs: 0 }) === null, "efekt o zerowym czasie ODRZUCONY");
}

console.log("\n§2  Odświeżenie: czas wraca, stosy rosną, ZEGAR TIKÓW PRZEŻYWA\n");
{
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply(JAD);
  zbior.tick(1000); // 1000 ms do następnego tiku
  const przed = zbior.get("venom").sinceTickMs;
  zbior.apply(JAD);
  const e = zbior.get("venom");
  ok(e.remainingMs === 6000, "odświeżenie przywraca pełny czas");
  ok(e.stacks === 2, "drugi stos");
  ok(
    e.sinceTickMs === przed,
    "⭐ zegar tików PRZEŻYWA odświeżenie — inaczej szybsze trucie truje wolniej",
    `${e.sinceTickMs} ms`,
  );
  zbior.apply(JAD);
  zbior.apply(JAD);
  ok(zbior.get("venom").stacks === 3, "stosy przycięte do `maxStacks`", `${zbior.get("venom").stacks}`);
  const bezStosow = new EffectSet(host());
  bezStosow.apply({ id: "x", name: "x", iconKey: "i", durationMs: 100 });
  bezStosow.apply({ id: "x", name: "x", iconKey: "i", durationMs: 100 });
  ok(bezStosow.get("x").stacks === 1, "brak `maxStacks` = sufit 1");
}

console.log("\n§3  Tiki i wygaśnięcie\n");
{
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply(JAD);
  zbior.tick(1500);
  ok(h.tiki.length === 1, "tik po dokładnie `tickMs`", `${h.tiki.length}`);
  zbior.tick(100);
  ok(h.tiki.length === 1, "…i nie tika częściej");
  zbior.tick(1400);
  ok(h.tiki.length === 2, "drugi tik po kolejnym pełnym odstępie");
  zbior.tick(3200);
  ok(!zbior.has("venom"), "efekt wygasł po `durationMs`");
  ok(
    h.tiki.length === 2,
    "⚠ delta przekraczająca koniec efektu GUBI zaległe tiki — zachowanie dawnego `updateVenom`, gdzie wygaśnięcie wychodziło przed tikiem",
    `${h.tiki.length}`,
  );
}
{
  // ⭐ Nadrabianie tików sprawdzone OSOBNO, wewnątrz czasu trwania: zacięcie
  // klatki nie ma prawa zjeść obrażeń jadu.
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply({ id: "d", name: "d", iconKey: "i", durationMs: 10000, tickMs: 1000 });
  zbior.tick(3500);
  ok(h.tiki.length === 3, "⭐ jedna duża delta nadrabia WSZYSTKIE tiki mieszczące się w czasie", `${h.tiki.length}`);
  ok(zbior.get("d").sinceTickMs === 500, "…i zostawia resztę na poczet następnego", `${zbior.get("d").sinceTickMs}`);
}
{
  // ⭐ Test rozstrzygający kolejność: tik lądujący RÓWNO z końcem nie pada.
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply({ id: "t", name: "t", iconKey: "i", durationMs: 1000, tickMs: 1000 });
  zbior.tick(1000);
  ok(
    h.tiki.length === 0 && !zbior.has("t"),
    "⭐ wygaśnięcie PRZED tikiem — tik równo z końcem NIE pada (zachowanie dawnego `updateVenom`)",
  );
}
{
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply({ id: "m", name: "m", iconKey: "i", durationMs: 1000 });
  zbior.tick(500);
  ok(h.zmiany === 1, "sam upływ czasu NIE ogłasza zmiany", `${h.zmiany}`);
  zbior.tick(600);
  ok(h.zmiany === 2, "wygaśnięcie ogłoszone", `${h.zmiany}`);
}

console.log("\n§4  Pauza (posiłek czeka w walce)\n");
{
  let wWalce = true;
  const h = host({ paused: (e) => e.spec.id === "food" && wWalce });
  const zbior = new EffectSet(h);
  zbior.apply({ id: "food", name: "f", iconKey: "i", durationMs: 1000, tickMs: 200 });
  zbior.tick(5000);
  ok(zbior.has("food") && zbior.get("food").remainingMs === 1000, "wstrzymany efekt NIE odlicza");
  ok(h.tiki.length === 0, "…i NIE tika");
  wWalce = false;
  zbior.tick(400);
  ok(zbior.get("food").remainingMs === 600, "po zdjęciu pauzy odlicza normalnie", `${zbior.get("food").remainingMs}`);
  ok(h.tiki.length === 2, "…i nadrabia tiki dopiero od tej chwili", `${h.tiki.length}`);
}

console.log("\n§5  Odporność, rozproszenie, sprzątanie\n");
{
  const h = host({ immune: (spec) => spec.id === "venom" });
  const zbior = new EffectSet(h);
  ok(zbior.apply(JAD) === null, "odporność ODRZUCA nałożenie");
  ok(!zbior.has("venom") && h.zmiany === 0, "…i nie ogłasza niczego");
}
{
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply(JAD);
  zbior.apply({ id: "klatwa", name: "k", iconKey: "i", durationMs: 5000, dispellable: false });
  ok(zbior.dispel() === 1, "`dispel` zdejmuje TYLKO dyspelowalne", "1 z 2");
  ok(zbior.has("klatwa"), "…niedyspelowalny zostaje");
  ok(zbior.remove("klatwa") === true, "`remove` zdejmuje wszystko — to sprzątanie hosta, nie mechanika");
  ok(zbior.remove("klatwa") === false, "…i zwraca `false`, gdy nie było czego zdjąć");
}
{
  const h = host();
  const zbior = new EffectSet(h);
  zbior.apply(JAD);
  zbior.apply({ id: "web", name: "w", iconKey: "i", durationMs: 2600, tags: ["slow"], payload: { factor: 0.55 } });
  ok(zbior.firstWithTag("slow")?.spec.id === "web", "⭐ wyszukiwanie po KATEGORII — host nie musi znać `buffId`");
  ok(zbior.firstWithTag("brak") === undefined, "brak kategorii → `undefined`");
  ok(zbior.list().length === 2, "`list` zwraca komplet");
  const migawka = zbior.list();
  const drugi = new EffectSet(host());
  drugi.restore(migawka);
  ok(
    drugi.has("venom") && drugi.get("web").data.factor === 0.55,
    "⭐ `restore` przenosi żywe efekty (przejście portalem) razem z ich liczbami",
  );
  zbior.clear();
  ok(zbior.list().length === 0, "`clear` czyści wszystko");
}

console.log("\n§6  Żywe liczby są ZASTĘPOWANE przy odświeżeniu\n");
{
  const zbior = new EffectSet(host());
  const posilek = { id: "food", name: "f", iconKey: "i", durationMs: 10000, payload: { remaining: 50 } };
  zbior.apply(posilek);
  zbior.get("food").data.remaining -= 30;
  ok(zbior.dataOf("food", "remaining") === 20, "host zużywa pulę efektu");
  zbior.apply(posilek);
  ok(
    zbior.dataOf("food", "remaining") === 50,
    "⭐ drugi posiłek ZASTĘPUJE niedokończony, nie dokłada do niego (reguła przeniesiona)",
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   §7  KRWAWIENIE (Rozcięcie) — pierwszy efekt po stronie WROGA
   ══════════════════════════════════════════════════════════════════════════
   ⚠ **Testuje księgowość Krwawienia z PRAWDZIWYMI liczbami configu i
   PRAWDZIWYM rodzajem `BLEED`** — nie literałami. Dzięki temu:
     • przestrojenie `ABILITIES.rend.bleed` przechodzi tu natychmiast,
     • literówka w kluczu payloadu świeci na czerwono po obu stronach,
     • liczba tików jest ZMIERZONA, a nie założona.

   ⚠ **§7.1 jest asercją na ŚWIADOMIE PRZYJĘTĄ konsekwencję** (decyzja autora,
   2026-09-04): `EffectSet` odejmuje czas PRZED tikiem, więc przy 6000/1000
   tików jest PIĘĆ, nie sześć. To NIE jest błąd do naprawienia — to jest
   zamrożona liczba. Gdyby ktoś „naprawił" kolejność w `StatusEffects.tick`,
   ten test i §3 zaświecą razem.

   ⚠ Symulacja jedzie krokiem 100 ms, a nie jednym skokiem 1000 ms — bo tak
   jedzie gra (klatki ~16 ms), a `while` w `tick` istnieje właśnie po to, żeby
   podział delty nie zmieniał wyniku. Krok 100 ms sprawdza obie własności naraz.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§7  Krwawienie (Rozcięcie) — efekt na wrogu\n");

const B = ABILITIES.rend.bleed;

/** Buduje `EffectSpec` Krwawienia dokładnie tak, jak robi to wykonawca
 *  w `GameScene.damageMatchingEnemies` — przez `BLEED.payload`, nie literałem. */
function bleedSpec(naTik) {
  return {
    id: B.buffId,
    name: B.name,
    iconKey: "ability-icon-rend",
    durationMs: B.durationMs,
    tickMs: B.tickMs,
    maxStacks: B.maxStacks,
    debuff: true,
    tags: [BLEED.tag],
    payload: BLEED.payload({ damagePerTick: naTik }),
  };
}

/** Przewiń `ms` krokami po `krok`, zbierając obrażenia oddane przez tiki. */
function przewin(zbior, h, ms, krok = 100) {
  for (let t = 0; t < ms; t += krok) zbior.tick(krok);
  return h.tiki;
}

{
  // ── §7.1 Liczba tików i pełny cykl obrażeń ──────────────────────────────
  const h = host();
  // Host testowy musi umieć odczytać ładunek tak, jak robi to `Enemy`.
  h.onEffectTick = (e) => h.tiki.push(BLEED.get(e, "damagePerTick") * e.stacks);
  const zbior = new EffectSet(h);
  zbior.apply(bleedSpec(10));

  // Sondy w czasie — sprawdzamy KIEDY, nie tylko ILE.
  przewin(zbior, h, 1000);
  ok(h.tiki.length === 1, "tik po 1000 ms", `${h.tiki.length}`);
  przewin(zbior, h, 4000);
  ok(h.tiki.length === 5, "pięć tików po 5000 ms", `${h.tiki.length}`);
  przewin(zbior, h, 1000);
  ok(
    h.tiki.length === 5,
    "⭐ tik w 6000 ms NIE pada — efekt wygasa pierwszy (świadomie przyjęte)",
    `${h.tiki.length}`,
  );
  ok(!zbior.has(B.buffId), "Krwawienie wygasło po 6000 ms");
  const suma = h.tiki.reduce((a, b) => a + b, 0);
  ok(suma === 50, "pełny cykl przy 10/tik = 50 obrażeń (110 + 50 = 160 przy 100 AD)", `${suma}`);
}

{
  // ── §7.2 Obrażenia tiku pochodzą z ŁADUNKU, nie ze stałej ───────────────
  const h = host();
  h.onEffectTick = (e) => h.tiki.push(BLEED.get(e, "damagePerTick") * e.stacks);
  const zbior = new EffectSet(h);
  zbior.apply(bleedSpec(7));
  przewin(zbior, h, 1000);
  ok(h.tiki[0] === 7, "tik oddaje snapshot z payloadu (7), nie liczbę z configu", `${h.tiki[0]}`);
  ok(
    BLEED.get(zbior.get(B.buffId), "damagePerTick") === 7,
    "⭐ producent i konsument czytają TEN SAM klucz (`BLEED.payload` ↔ `BLEED.get`)",
  );
}

{
  // ── §7.3 Ponowne Rozcięcie: JEDNA rana, odświeżona ──────────────────────
  const h = host();
  h.onEffectTick = (e) => h.tiki.push(BLEED.get(e, "damagePerTick") * e.stacks);
  const zbior = new EffectSet(h);
  zbior.apply(bleedSpec(10));
  przewin(zbior, h, 3000);
  ok(h.tiki.length === 3, "trzy tiki przed odświeżeniem", `${h.tiki.length}`);

  zbior.apply(bleedSpec(12));
  ok(zbior.list().length === 1, "⭐ drugie Rozcięcie NIE tworzy drugiego efektu", `${zbior.list().length}`);
  ok(zbior.stacksOf(B.buffId) === 1, "stacking pozostaje na 1", `${zbior.stacksOf(B.buffId)}`);
  ok(
    zbior.get(B.buffId).remainingMs === B.durationMs,
    "⭐ czas wraca do pełnych 6000 ms",
    `${zbior.get(B.buffId).remainingMs}`,
  );
  ok(
    BLEED.get(zbior.get(B.buffId), "damagePerTick") === 12,
    "nowy snapshot ZASTĘPUJE stary (nie sumuje się)",
    `${BLEED.get(zbior.get(B.buffId), "damagePerTick")}`,
  );

  // Po odświeżeniu znów pełne pięć tików — rana liczy od nowa.
  const przed = h.tiki.length;
  przewin(zbior, h, 6000);
  ok(h.tiki.length - przed === 5, "po odświeżeniu znów pięć tików", `${h.tiki.length - przed}`);
  ok(!zbior.has(B.buffId), "i znów wygasa");
}

{
  // ── §7.4 `maxStacks: 1` jest EGZEKWOWANE, nie deklarowane ───────────────
  const zbior = new EffectSet(host());
  for (let i = 0; i < 5; i++) zbior.apply(bleedSpec(10));
  ok(zbior.stacksOf(B.buffId) === 1, "pięć nałożeń → wciąż 1 stos", `${zbior.stacksOf(B.buffId)}`);
  ok(zbior.list().length === 1, "…i wciąż jeden wpis");
}

{
  // ── §7.5 Krwawienie NIE jest jadem: dwa efekty żyją obok siebie ──────────
  // ⚠ Nośne, bo oba są „obrażeniami w czasie" i oba mają tag. Gdyby
  // `firstWithTag` albo `carries` myliły rodzaje, ta sekcja zaświeci.
  const zbior = new EffectSet(host());
  zbior.apply(JAD);
  zbior.apply(bleedSpec(10));
  ok(zbior.list().length === 2, "jad i Krwawienie to DWA osobne efekty", `${zbior.list().length}`);
  ok(BLEED.carries(zbior.get(B.buffId)), "`BLEED.carries` rozpoznaje Krwawienie");
  ok(!BLEED.carries(zbior.get("venom")), "⭐ `BLEED.carries` NIE rozpoznaje jadu");
  ok(BLEED.find(zbior).spec.id === B.buffId, "`BLEED.find` trafia w Krwawienie, nie w jad");
}

{
  // ── §7.6 Config trzyma liczby z briefu ──────────────────────────────────
  // ⚠ Zamrożenie stoi TUTAJ, a nie w deklaracji akcji — `PLAYER_ACTIONS.rend`
  // czyta z configu, więc config jest właścicielem (ta sama reguła co §R6a).
  ok(B.durationMs === 6000, "durationMs = 6000", `${B.durationMs}`);
  ok(B.tickMs === 1000, "tickMs = 1000", `${B.tickMs}`);
  ok(B.maxStacks === 1, "maxStacks = 1", `${B.maxStacks}`);
  ok(B.fractionOfDamage === 0.1, "fractionOfDamage = 0,10 (10% AD na tik)", `${B.fractionOfDamage}`);
  ok(ABILITIES.rend.damageMultiplier === 1.1, "Rozcięcie = 110% AD", `${ABILITIES.rend.damageMultiplier}`);
}

console.log(`\nSprawdzeń: ${sprawdzen}.`);
if (bledy > 0) {
  console.log(`⛔ BŁĘDÓW: ${bledy}`);
  process.exit(1);
}
console.log("OK — księgowość efektów zachowuje się zgodnie z kontraktem.");

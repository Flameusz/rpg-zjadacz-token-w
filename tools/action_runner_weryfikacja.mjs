/**
 * Faza 2 Combat v2 — czy `ActionRunner` odgrywa akcję IDENTYCZNIE jak ręczna
 * maszyna stanów, którą zastępuje.
 *
 * ⚠ **To jest bramka migracji, nie przymiar.** Runner ma zastąpić sześć kopii
 * `windup → active → recovery`. „Bez zmiany zachowania" jest twierdzeniem,
 * dopóki ktoś go nie sprawdzi — a przy maszynie stanów nie wystarczy porównać
 * liczb w configu: liczy się KOLEJNOŚĆ i MOMENT przejść.
 *
 * Metoda: obie maszyny dostają tę samą oś czasu (60 Hz) i ten sam scenariusz
 * dystansu, po czym porównuje się **listy zdarzeń** — kiedy ruszył zamach,
 * kiedy padło rozstrzygnięcie, czy trafiło, kiedy skończyła się bezbronność.
 *
 * ⚠ Wzorcem jest **skoczek** (`VENOM_SPIDER`), bo ma najczystszy kształt:
 * podejdź → zamach → kęs z własnym testem zasięgu → bezbronność, plus
 * przerwanie obuchem. Recenzja wymagała sprawdzenia runnera na ISTNIEJĄCYM
 * melee, zanim powstanie na nim niedźwiedź.
 *
 *   node tools/action_runner_weryfikacja.mjs
 *
 * Kod wyjścia ≠ 0 przy jakiejkolwiek rozbieżności.
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-runner.ts");
const tmpCfg = join(KORZEN, "node_modules", ".config-runner.mjs");
const tmpAct = join(KORZEN, "node_modules", ".action-runner.mjs");

await writeFile(stubPhaser, "const Phaser = {};\nexport default Phaser;\n");
const wspolne = { bundle: true, format: "esm", platform: "node", logLevel: "silent" };
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/config/GameConfig.ts")], outfile: tmpCfg, alias: { phaser: stubPhaser } });
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/CombatAction.ts")], outfile: tmpAct, alias: { phaser: stubPhaser } });
const { VENOM_SPIDER } = await import(pathToFileURL(tmpCfg).href);
const { ActionRunner } = await import(pathToFileURL(tmpAct).href);

const DT = 1000 / 60;

/* ══════════════════════════════════════════════════════════════════════════
   STARA maszyna — transkrypcja `VenomSpider.updateChase` sprzed migracji
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Transkrypcja, nie import: oryginał jest metodą sprite'a Phasera i nie da
   się go uruchomić pod Node. To samo ryzyko i to samo zabezpieczenie co w
   `tools/combat_regresja.mjs` — poniżej jest 1:1 przepisany kod, a rozbieżność
   z oryginałem byłaby widoczna jako różnica w liczbach configu, które obie
   strony czytają z tego samego miejsca. */
function stara(scenariusz) {
  const b = VENOM_SPIDER.bite;
  let phase = "approach";
  let phaseUntil = 0;
  let nextBiteAt = 0;
  const zdarzenia = [];

  for (const { t, gap, obuch } of scenariusz) {
    if (obuch && phase === "windup") {
      phase = "recover";
      phaseUntil = t + b.recoverMs;
      nextBiteAt = t + b.cooldownMs;
      zdarzenia.push(`${t.toFixed(0)} PRZERWANY`);
      continue;
    }
    if (phase === "windup") {
      if (t >= phaseUntil) {
        phase = "recover";
        phaseUntil = t + b.recoverMs;
        nextBiteAt = t + b.cooldownMs;
        zdarzenia.push(`${t.toFixed(0)} KES ${gap <= b.reach ? "TRAFIA" : "pudlo"}`);
      }
      continue;
    }
    if (phase === "recover") {
      if (t >= phaseUntil) {
        phase = "approach";
        zdarzenia.push(`${t.toFixed(0)} GOTOWY`);
      }
      continue;
    }
    if (gap > b.range) continue;
    if (t >= nextBiteAt) {
      phase = "windup";
      phaseUntil = t + b.windupMs;
      zdarzenia.push(`${t.toFixed(0)} ZAMACH`);
    }
  }
  return zdarzenia;
}

/* ══════════════════════════════════════════════════════════════════════════
   NOWA — ta sama akcja odegrana przez ActionRunner
   ══════════════════════════════════════════════════════════════════════════ */
const AKCJA = {
  id: "venom_bite",
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
};

function nowa(scenariusz) {
  const b = VENOM_SPIDER.bite;
  const r = new ActionRunner();
  const zdarzenia = [];

  for (const { t, gap, obuch } of scenariusz) {
    if (obuch) {
      const p = r.interrupt(t);
      if (p) { zdarzenia.push(`${t.toFixed(0)} PRZERWANY`); continue; }
    }
    for (const p of r.tick(t)) {
      // `active` to moment rozstrzygnięcia — encja robi tu swój test zasięgu.
      if (p.to === "active") zdarzenia.push(`${t.toFixed(0)} KES ${gap <= b.reach ? "TRAFIA" : "pudlo"}`);
      if (p.to === "idle") zdarzenia.push(`${t.toFixed(0)} GOTOWY`);
    }
    if (!r.busy && gap <= b.range) {
      if (r.request(AKCJA, t)) zdarzenia.push(`${t.toFixed(0)} ZAMACH`);
    }
  }
  return zdarzenia;
}

/* ══════════════════════════════════════════════════════════════════════════
   Scenariusze
   ══════════════════════════════════════════════════════════════════════════ */
function scen(nazwa, gapFn, obuchAt = -1) {
  const kroki = [];
  for (let i = 0; i < 300; i++) {
    const t = i * DT;
    kroki.push({ t, gap: gapFn(t), obuch: obuchAt >= 0 && Math.abs(t - obuchAt) < DT / 2 });
  }
  return { nazwa, kroki };
}

const R = VENOM_SPIDER.bite.range;
const SCENARIUSZE = [
  scen("stoi w zasięgu przez cały czas", () => R - 5),
  scen("poza zasięgiem — nic się nie dzieje", () => R + 40),
  scen("wchodzi w zasięg po 1 s", (t) => (t < 1000 ? R + 30 : R - 5)),
  scen("odchodzi w trakcie zamachu (pudło)", (t) => (t < 600 ? R - 5 : R + 60)),
  scen("wchodzi i wychodzi na przemian", (t) => (Math.floor(t / 700) % 2 ? R + 40 : R - 5)),
  scen("obuch w trakcie zamachu", () => R - 5, 5 * DT + VENOM_SPIDER.bite.windupMs / 2),
  scen("obuch poza zamachem (nic nie robi)", () => R - 5, 1200),
];

let bledy = 0;

/* ══════════════════════════════════════════════════════════════════════════
   Dwa rozszerzenia runnera, dodane pod migrację pozostałych pięciu klas
   ══════════════════════════════════════════════════════════════════════════
   Nie da się ich sprawdzić na skoczku, bo skoczek ich nie używa: stoi w
   miejscu i ma stały cooldown. Zamiast transkrybować kolejne cztery maszyny
   stanów, sprawdzane są WŁASNOŚCI, których te maszyny od runnera wymagają. */
function sprawdz(nazwa, warunek, detal = "") {
  if (!warunek) bledy++;
  console.log("  " + (warunek ? "OK  " : "BŁĄD") + " " + nazwa.padEnd(52) + " " + detal);
}

console.log("ROZSZERZENIA RUNNERA");
console.log("");
{
  // `endActive` — wypad wilka i szarża dzika kończą okno po DYSTANSIE, nie po
  // czasie. `activeMs` jest dla nich limitem, nie długością.
  const A = { ...AKCJA, id: "wypad", windupMs: 0, activeMs: 400, recoveryMs: 200, cooldownMs: 1000 };
  const r = new ActionRunner();
  r.request(A, 0);
  sprawdz("windupMs 0 wchodzi WPROST w active", r.phase === "active");
  const p = r.endActive(100);
  sprawdz("endActive kończy okno przed czasem", p !== null && p.to === "recovery");
  sprawdz("recovery liczy się od PRZERWANIA, nie od activeMs",
    r.tick(299).length === 0 && r.tick(300).length === 1, "300 = 100 + 200");
  sprawdz("endActive poza active nie robi nic", r.endActive(400) === null);
  sprawdz("cooldown kotwiczy się w WYJŚCIU z active (tu: endActive)",
    !r.isReady(A, 1099) && r.isReady(A, 1100), "100 + 1000");
}
{
  // Cooldown per próba — jitter sieciarza i szał Szarego.
  const A = { ...AKCJA, id: "test_cd", windupMs: 10, activeMs: 0, recoveryMs: 10, cooldownMs: 1000 };
  const r = new ActionRunner();
  r.request(A, 0, 300);
  r.tick(10);
  sprawdz("cooldown per próba: nadpisanie działa", !r.isReady(A, 309) && r.isReady(A, 310),
    "kotwicą jest ROZSTRZYGNIĘCIE (t=10), nie request (t=0): 10 + 300");
  const r2 = new ActionRunner();
  r2.request(A, 0);
  r2.tick(10);
  sprawdz("cooldown per próba: bez nadpisania bierze z akcji",
    !r2.isReady(A, 1009) && r2.isReady(A, 1010), "10 + 1000");
}
{
  // Dwie akcje jednego stworzenia (dzik: szarża i kieł) — NIEZALEŻNE cooldowny.
  const A = { ...AKCJA, id: "szarza", windupMs: 10, activeMs: 0, recoveryMs: 10, cooldownMs: 2000 };
  const B = { ...AKCJA, id: "kiel", windupMs: 10, activeMs: 0, recoveryMs: 10, cooldownMs: 500 };
  const r = new ActionRunner();
  r.request(A, 0); r.tick(10); r.tick(20);
  sprawdz("dwie akcje: cooldown jednej nie blokuje drugiej",
    r.isReady(B, 20) && !r.isReady(A, 20));
}
{
  // `reset` (zerwane agro) NIE kasuje cooldownów — stworzenie, które właśnie
  // ugryzło, nie ma prawa ugryźć ponownie tylko dlatego, że gracz wyszedł.
  const A = { ...AKCJA, id: "reset_test", windupMs: 10, activeMs: 0, recoveryMs: 10, cooldownMs: 1000 };
  const r = new ActionRunner();
  r.request(A, 0); r.tick(10);
  r.reset();
  sprawdz("reset kasuje fazę, ZOSTAWIA cooldown",
    r.phase === "idle" && !r.isReady(A, 500));
}
console.log("");

{
  /*
   * ⚠ REGRESJA ZGŁOSZONA Z ROZGRYWKI (2026-08-23): „dzik non stop używa skilla".
   *
   * Szarża dzika i wypad wilka liczyły przerwę od KOŃCA lotu (`enterRecover` w
   * obu starych klasach). Pierwsza wersja runnera kotwiczyła ją w POCZĄTKU
   * `active`, co skracało dzikowi przerwę o całą długość szarży — do 420 ms.
   *
   * Dla ciosu natychmiastowego (`activeMs: 0`) obie kotwice dają to samo i
   * dlatego skoczek niczego nie wykrył. Ten test porównuje oba przypadki.
   */
  const NATYCHMIAST = { ...AKCJA, id: "kes", windupMs: 100, activeMs: 0, recoveryMs: 200, cooldownMs: 1000 };
  const W_LOCIE = { ...AKCJA, id: "szarza", windupMs: 100, activeMs: 400, recoveryMs: 200, cooldownMs: 1000 };

  const r1 = new ActionRunner();
  r1.request(NATYCHMIAST, 0); r1.tick(100);
  sprawdz("cios natychmiastowy: kotwica = koniec zamachu",
    !r1.isReady(NATYCHMIAST, 1099) && r1.isReady(NATYCHMIAST, 1100), "100 + 1000");

  const r2 = new ActionRunner();
  r2.request(W_LOCIE, 0); r2.tick(100); r2.tick(500);
  sprawdz("atak W LOCIE: kotwica = koniec lotu, NIE jego początek",
    !r2.isReady(W_LOCIE, 1499) && r2.isReady(W_LOCIE, 1500),
    "500 + 1000, a nie 100 + 1000");

  const r3 = new ActionRunner();
  r3.request(W_LOCIE, 0); r3.tick(100); r3.endActive(300);
  sprawdz("lot przerwany trafieniem: kotwica = moment trafienia",
    !r3.isReady(W_LOCIE, 1299) && r3.isReady(W_LOCIE, 1300), "300 + 1000");
}
console.log("");

console.log("PORÓWNANIE: ręczna maszyna skoczka vs ActionRunner\n");
for (const s of SCENARIUSZE) {
  const a = stara(s.kroki);
  const b = nowa(s.kroki);
  const zgoda = JSON.stringify(a) === JSON.stringify(b);
  console.log(`  ${zgoda ? "OK  " : "BŁĄD"} ${s.nazwa.padEnd(38)} zdarzeń: ${a.length}`);
  if (!zgoda) {
    bledy++;
    console.error("        stara: " + JSON.stringify(a));
    console.error("        nowa : " + JSON.stringify(b));
  }
}

/* Kontrola siły testu: scenariusze, w których NIC się nie dzieje, niczego nie
   dowodzą. Ten sam wymóg co przy uprzęży regresyjnej. */
const razem = SCENARIUSZE.reduce((n, s) => n + stara(s.kroki).length, 0);
console.log(`\nZdarzeń łącznie: ${razem}`);
if (razem < 20) {
  console.error("BŁĄD: za mało zdarzeń — scenariusze niczego nie rozróżniają.");
  bledy++;
}

await Promise.all([stubPhaser, tmpCfg, tmpAct].map((p) => unlink(p).catch(() => {})));

if (bledy) {
  console.error(`\n${bledy} ROZBIEŻNOŚCI.`);
  process.exit(1);
}
console.log("OK — runner odgrywa akcję identycznie.");

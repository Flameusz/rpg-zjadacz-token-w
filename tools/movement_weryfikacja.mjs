/**
 * Warstwa ruchu (`src/core/movement/`) — bramka migracji.
 *
 * ⚠ **To jest dowód na twierdzenie „migracja nie zmienia rozgrywki", a nie
 * przymiar.** Siedem podklas wroga plus krytter przestały pisać prędkość
 * wprost i zaczęły zgłaszać INTENCJĘ. Pod `DirectSolver` wynik ma być
 * identyczny z tym, co robił Phaser — a „identyczny" w tym projekcie znaczy
 * **co do bitu**: `Math.hypot` i `Math.sqrt` różnią się w 38 % losowych par,
 * co potrafi przewrócić trafienie na granicy zasięgu.
 *
 * Sprawdza cztery rzeczy:
 *   §1  `seek`/`ring` liczą wektor DOKŁADNIE tak jak `physics.moveTo`
 *       (`atan2` + `setToPolar`), a `flee` — jak `Vector2.normalize().scale()`.
 *   §2  `ring` używa OSOBNEJ prędkości dobiegania (wilk: 115) i orbity (78).
 *   §3  `impulse` i `hold` przechodzą przez solver nietknięte.
 *   §4  `SteerSolver` w otwartym terenie **nie robi nic** — zmierzone
 *       2026-08-28: omijanie włączone tam, gdzie nie było potrzebne,
 *       POGARSZAŁO dojście dzika (11 % → 18 % pozycji nieosiągalnych).
 *
 *   node tools/movement_weryfikacja.mjs
 *
 * Kod wyjścia ≠ 0 przy jakiejkolwiek rozbieżności.
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-move.ts");
const tmpIntent = join(KORZEN, "node_modules", ".move-intent.mjs");
const tmpSteer = join(KORZEN, "node_modules", ".move-steer.mjs");
const tmpCfgMove = join(KORZEN, "node_modules", ".move-config.mjs");
const tmpSolver = join(KORZEN, "node_modules", ".move-solver.mjs");
const tmpNav = join(KORZEN, "node_modules", ".move-nav.mjs");
const tmpFollow = join(KORZEN, "node_modules", ".move-follow.mjs");

await writeFile(stubPhaser, "const Phaser = {};\nexport default Phaser;\n");
const wspolne = { bundle: true, format: "esm", platform: "node", logLevel: "silent" };
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/MoveIntent.ts")], outfile: tmpIntent, alias: { phaser: stubPhaser } });
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/Steering.ts")], outfile: tmpSteer, alias: { phaser: stubPhaser } });

const { desiredVelocity, seek, flee, ring, hold, impulse } = await import(pathToFileURL(tmpIntent).href);
const { steer, freshSteerState, consumeCommitment } = await import(pathToFileURL(tmpSteer).href);
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/config/GameConfig.ts")], outfile: tmpCfgMove, alias: { phaser: stubPhaser } });
const { MOVEMENT: MOVEMENT_CFG } = await import(pathToFileURL(tmpCfgMove).href);
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/solvers/SteerSolver.ts")], outfile: tmpSolver, alias: { phaser: stubPhaser } });
const { steerSolver } = await import(pathToFileURL(tmpSolver).href);
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/NavGrid.ts")], outfile: tmpNav, alias: { phaser: stubPhaser } });
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/PathFollower.ts")], outfile: tmpFollow, alias: { phaser: stubPhaser } });
const { NavGrid } = await import(pathToFileURL(tmpNav).href);
const { PathFollower } = await import(pathToFileURL(tmpFollow).href);

let bledy = 0;
let sprawdzen = 0;
const zle = (co, a, b) => {
  bledy++;
  console.error(`  BŁĄD ${co}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
};
/** Porównanie BITOWE, nie „z tolerancją" — o to w tym teście chodzi. */
const rowne = (a, b) => Object.is(a.x, b.x) && Object.is(a.y, b.y);

/* ── Wzorce: dokładnie to, co robi Phaser ────────────────────────────────── */

/** `Phaser.Physics.Arcade.moveTo`: atan2 + `Vector2.setToPolar`. */
function phaserMoveTo(sx, sy, tx, ty, speed) {
  const angle = Math.atan2(ty - sy, tx - sx);
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

/** `new Vector2(dx,dy).normalize().scale(speed)` — konwencja ucieczki. */
function phaserNormalizeScale(dx, dy, speed) {
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return { x: speed, y: 0 };
  const len = Math.sqrt(lenSq);
  return { x: (dx / len) * speed, y: (dy / len) * speed };
}

/* ── §1 — seek / flee liczą się jak w silniku ────────────────────────────── */

console.log("§1  seek i flee — zgodność bitowa z Phaserem");
let rng = 12345;
const los = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < 20000; i++) {
  const sx = los() * 3200, sy = los() * 1920;
  const tx = los() * 3200, ty = los() * 1920;
  const speed = 20 + los() * 300;

  const a = desiredVelocity(seek(tx, ty, speed), sx, sy);
  const b = phaserMoveTo(sx, sy, tx, ty, speed);
  sprawdzen++;
  if (!rowne(a, b)) { zle(`seek #${i}`, a, b); break; }

  const c = desiredVelocity(flee(tx, ty, speed), sx, sy);
  const d = phaserNormalizeScale(sx - tx, sy - ty, speed);
  sprawdzen++;
  if (!rowne(c, d)) { zle(`flee #${i}`, c, d); break; }
}
console.log(`    ${sprawdzen} porównań bitowych`);

/* ── §2 — ring: dwie prędkości, orbita jak u wilka ───────────────────────── */

console.log("§2  ring — orbita i dobieganie");
const WOLF = { circleRadius: 96, circleSpeed: 78, chaseSpeed: 115, orbitLeadDeg: 26, closeInFactor: 1.5 };
const lead = (WOLF.orbitLeadDeg * Math.PI) / 180;

/** Stary `Wolf.circleStep`, przepisany 1:1 jako wzorzec. */
function staryCircleStep(sx, sy, px, py, orbitSign) {
  const dx = sx - px, dy = sy - py;
  const dist = Math.hypot(dx, dy);
  if (dist > WOLF.circleRadius * WOLF.closeInFactor) {
    return phaserMoveTo(sx, sy, px, py, WOLF.chaseSpeed);
  }
  const bearing = (dist < 0.001 ? 0 : Math.atan2(dy, dx)) + orbitSign * lead;
  const tx = px + Math.cos(bearing) * WOLF.circleRadius;
  const ty = py + Math.sin(bearing) * WOLF.circleRadius;
  return phaserMoveTo(sx, sy, tx, ty, WOLF.circleSpeed);
}

let dobieganie = 0, orbita = 0;
for (let i = 0; i < 20000; i++) {
  const px = los() * 3200, py = los() * 1920;
  const kat = los() * Math.PI * 2;
  const r = los() * 400;
  const sx = px + Math.cos(kat) * r, sy = py + Math.sin(kat) * r;
  const sign = los() < 0.5 ? 1 : -1;

  const a = desiredVelocity(
    ring(px, py, WOLF.circleRadius, sign, lead, WOLF.circleSpeed, WOLF.circleRadius * WOLF.closeInFactor, WOLF.chaseSpeed),
    sx, sy,
  );
  const b = staryCircleStep(sx, sy, px, py, sign);
  sprawdzen++;
  if (!rowne(a, b)) { zle(`ring #${i}`, a, b); break; }
  if (r > WOLF.circleRadius * WOLF.closeInFactor) dobieganie++; else orbita++;
}
console.log(`    dobiegania: ${dobieganie}, orbity: ${orbita}`);
// Kontrola siły testu: scenariusz, który nie trafia w OBIE gałęzie, nie dowodzi
// niczego o rozdzieleniu prędkości.
if (dobieganie < 100 || orbita < 100) {
  console.error("  BŁĄD: scenariusz nie pokrywa obu gałęzi `ring` — test niczego nie rozróżnia.");
  bledy++;
}
// I wprost: dobieganie MUSI mieć długość `chaseSpeed`, nie `circleSpeed`.
{
  const v = desiredVelocity(
    ring(0, 0, WOLF.circleRadius, 1, lead, WOLF.circleSpeed, WOLF.circleRadius * WOLF.closeInFactor, WOLF.chaseSpeed),
    500, 0,
  );
  const dl = Math.hypot(v.x, v.y);
  sprawdzen++;
  if (Math.abs(dl - WOLF.chaseSpeed) > 1e-9) {
    zle("ring: dobieganie nie używa chaseSpeed", dl, WOLF.chaseSpeed);
  }
}

/* ── §3 — impulse i hold przechodzą nietknięte ───────────────────────────── */

console.log("§3  impulse i hold");
for (let i = 0; i < 1000; i++) {
  const vx = (los() - 0.5) * 640, vy = (los() - 0.5) * 640;
  const a = desiredVelocity(impulse(vx, vy), los() * 3200, los() * 1920);
  sprawdzen++;
  if (!rowne(a, { x: vx, y: vy })) { zle(`impulse #${i}`, a, { x: vx, y: vy }); break; }
}
{
  const a = desiredVelocity(hold(), 100, 100);
  sprawdzen++;
  if (!rowne(a, { x: 0, y: 0 })) zle("hold", a, { x: 0, y: 0 });
}

/* ── §4 — steer nie rusza niczego w otwartym terenie ─────────────────────── */

console.log("§4  steer — otwarty teren musi być no-opem");
const PARAMS = { lookaheadSec: 0.28, minLookaheadPx: 14, fanDeg: [18, 36, 54, 72, 90, 115, 140], commitPx: 40 };
const wolne = () => true;
const zajete = () => false;

for (let i = 0; i < 2000; i++) {
  const speed = 20 + los() * 300;
  const kat = los() * Math.PI * 2;
  const wej = {
    desiredX: Math.cos(kat) * speed, desiredY: Math.sin(kat) * speed,
    bodyX: los() * 3200, bodyY: los() * 1920, bodyW: 22, bodyH: 15,
    dt: 1 / 60, maxDeflectDeg: 140,
  };
  const st = freshSteerState();
  const v = steer(wej, PARAMS, st, wolne);
  sprawdzen++;
  if (!rowne(v, { x: wej.desiredX, y: wej.desiredY })) {
    zle(`steer w otwartym terenie #${i}`, v, { x: wej.desiredX, y: wej.desiredY });
    break;
  }
  if (st.sign !== 0 || st.leftPx !== 0) {
    console.error("  BŁĄD: steer zobowiązał się do objazdu mimo wolnej drogi");
    bledy++;
    break;
  }
}

// Teren zajęty ze wszystkich stron: wektor wraca NIEZMIENIONY (silnik i tak
// rozdzieli kolizję), a nie wyzerowany — stworzenie ma napierać, nie zamarzać.
{
  const wej = {
    desiredX: 100, desiredY: 0, bodyX: 500, bodyY: 500, bodyW: 22, bodyH: 15,
    dt: 1 / 60, maxDeflectDeg: 140,
  };
  const v = steer(wej, PARAMS, freshSteerState(), zajete);
  sprawdzen++;
  if (!rowne(v, { x: 100, y: 0 })) zle("steer w ślepym zaułku", v, { x: 100, y: 0 });
}

// Prędkość jest ZACHOWANA przy objeździe — omijanie ma zmieniać kierunek, nigdy
// tempo. Sonda: wolno wszędzie poza wąskim pasem wprost przed ciałem.
{
  const wej = {
    desiredX: 100, desiredY: 0, bodyX: 500, bodyY: 500, bodyW: 22, bodyH: 15,
    dt: 1 / 60, maxDeflectDeg: 140,
  };
  const tylkoWprostZajete = (x) => x < 500 + 20;
  const v = steer(wej, PARAMS, freshSteerState(), tylkoWprostZajete);
  const dl = Math.hypot(v.x, v.y);
  sprawdzen++;
  if (Math.abs(dl - 100) > 1e-9) zle("steer zmienił PRĘDKOŚĆ przy objeździe", dl, 100);
}

/* ══════════════════════════════════════════════════════════════════════════
   §OSC. OMIJANIE PRZESZKÓD NIE MOŻE OSCYLOWAĆ
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Powstało po błędzie z playtestu (2026-09-05):** dzik między drzewem
   a sadzawką „kręcił się w kółko", przerzucając stronę objazdu co kilka klatek.

   Przyczyna była w `steer()` i miała DWIE warstwy — obie zmierzone tym
   symulatorem, nie wywnioskowane:

     • wachlarz szedł KĄTAMI, a stronę zobowiązaną próbował tylko jako pierwszą
       PRZY DANYM KĄCIE. Gdy przy tym kącie strona zobowiązana była zajęta,
       a druga wolna — stworzenie natychmiast przepinało zobowiązanie na drugą
       stronę. To nie była pamięć objazdu, tylko preferencja na jedną próbę;
     • `probe(0)` (droga wprost wolna) **kasowało zobowiązanie**, więc chwilowy
       prześwit za rogiem pnia zerował decyzję i całość zaczynała się od nowa.

   ⚠ To NIE jest test pathfindingu. Sprawdza **stabilność decyzji**: ile razy
   zmienia się strona objazdu i czy stworzenie w ogóle dochodzi. Silnik kolizji
   zastąpiony jest tu ruchem po osiach z tym samym predykatem `isFree`, którego
   używa sonda — dzięki temu scenariusz jest w pełni deterministyczny.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§OSC  omijanie przeszkód — stabilność decyzji");
{
  // ⚠⚠ **PRAWDZIWE `MOVEMENT.steer` z configu, nie kopia.** Pierwsza wersja
  //   tego strażnika miała parametry przepisane na sztywno i **przeszła
  //   sabotaż `commitPx = 0`** — czyli nie zauważyłaby skasowania samego
  //   zobowiązania, którego pilnuje. Wzorzec z reszty `tools/`: pytaj kod.
  const PAR = MOVEMENT_CFG.steer;
  const BODY = 46; // realne ciało dzika (bodyWidth 22 × scale 2,1)
  const SPEED = 52; // BOAR.chaseSpeed
  const DT = 1 / 60;

  const przebieg = (boxy, start, cel, kroki = 700) => {
    const isFree = (x, y, w, h) =>
      !boxy.some((b) => Math.abs(x - b.x) < (w + b.w) / 2 && Math.abs(y - b.y) < (h + b.h) / 2);
    const st = freshSteerState();
    let px = start.x;
    let py = start.y;
    let zmiany = 0;
    let poprzedni = 0;
    for (let i = 0; i < kroki; i++) {
      const dx = cel.x - px;
      const dy = cel.y - py;
      const d = Math.hypot(dx, dy);
      if (d < 20) break;
      const v = steer(
        { desiredX: (dx / d) * SPEED, desiredY: (dy / d) * SPEED, bodyX: px, bodyY: py,
          bodyW: BODY, bodyH: BODY, dt: DT, maxDeflectDeg: 140 },
        PAR, st, isFree,
      );
      sprawdzen++;
      if (st.sign !== 0 && poprzedni !== 0 && st.sign !== poprzedni) zmiany++;
      if (st.sign !== 0) poprzedni = st.sign;
      // Ruch po osiach — zastępuje rozdzielanie kolizji przez silnik.
      const nx = px + v.x * DT;
      const ny = py + v.y * DT;
      if (isFree(nx, py, BODY, BODY)) px = nx;
      if (isFree(px, ny, BODY, BODY)) py = ny;
      // ⚠ `consumeCommitment` liczy się z FAKTYCZNEJ prędkości wektora.
      consumeCommitment(st, Math.hypot(v.x, v.y), DT);
    }
    return { zmiany, dotarl: Math.hypot(cel.x - px, cel.y - py) < 20 };
  };

  const PIEN = { x: 150, y: 0, w: 60, h: 60 };
  const przypadki = [
    ["przeszkoda WPROST", [PIEN], { x: 0, y: 0 }, { x: 300, y: 0 }, true],
    ["przeszkoda po LEWEJ", [{ x: 150, y: -30, w: 60, h: 80 }], { x: 0, y: 0 }, { x: 300, y: 0 }, true],
    ["przeszkoda po PRAWEJ", [{ x: 150, y: 30, w: 60, h: 80 }], { x: 0, y: 0 }, { x: 300, y: 0 }, true],
    ["między dwiema, przejście GÓRĄ",
      [{ x: 150, y: -145, w: 90, h: 90 }, { x: 150, y: 145, w: 260, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, true],
    ["między dwiema, przejście DOŁEM",
      [{ x: 150, y: -145, w: 260, h: 90 }, { x: 150, y: 145, w: 90, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, true],
    // ⚠ Przejścia NIE MA (luka 20 px przy ciele 46). Dojście jest niemożliwe
    //   i tego NIE wymagamy — wymagamy, żeby stworzenie się nie miotało.
    ["ślepy zaułek — bez przejścia",
      [{ x: 150, y: -95, w: 90, h: 90 }, { x: 150, y: 95, w: 200, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, false],
  ];

  const LIMIT_ZMIAN = 2;
  for (const [nazwa, boxy, start, cel, maDojsc] of przypadki) {
    const r = przebieg(boxy, start, cel);
    const stabilne = r.zmiany <= LIMIT_ZMIAN;
    if (!stabilne) zle(`§OSC ${nazwa}: strona objazdu zmieniona ${r.zmiany}× (limit ${LIMIT_ZMIAN})`, r.zmiany, LIMIT_ZMIAN);
    if (maDojsc && !r.dotarl) zle(`§OSC ${nazwa}: stworzenie NIE doszło do celu`, "nie doszło", "doszło");
    console.log(
      `  ${stabilne && (!maDojsc || r.dotarl) ? "OK  " : "BŁĄD"} ${nazwa.padEnd(32)} zmian strony: ${r.zmiany}   dotarł: ${r.dotarl ? "TAK" : "nie (oczekiwane)"}`,
    );
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   §OSC2. OBJAZD MUSI PRZEŻYĆ PAUZĘ W RUCHU
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Drugie zgłoszenie z playtestu (2026-09-05):** po naprawie szybkiego
   migotania dzik nadal „wracał w stronę sadzawki", tyle że rzadziej — kilka
   podejść, zanim dotarł.

   ⚠ Przyczyny NIE było w `steer()`. §OSC wyżej przechodzi wszystkie układy
   z zerem zmian strony — bo mierzy CIĄGŁY ruch. W grze dzik co chwilę **staje**:
   `Boar.updateAi` woła `move.hold()` przy każdej akcji (`if (this.akcje.busy)`)
   — telegraf szarży 560 ms, zamach kła 420 ms, każde odzyskanie. A
   `SteerSolver` przy `hold` **zerował `steerState`**, czyli wymazywał wybraną
   stronę objazdu. Po wznowieniu pościgu dzik wybierał ją od nowa — czasem
   przeciwną.

   ⚠ **Dlatego ten strażnik jeździ PRAWDZIWYM `steerSolver` z intencjami**, a nie
   samym `steer()`: różnica mieszkała dokładnie w warstwie, której tamten test
   nie dotykał.

   ⛔ Nie sprawdza obecności metody ani stałej — sprawdza ZACHOWANIE: ile razy
      zmienia się strona objazdu i czy stworzenie dochodzi, przy pauzach
      o kadencji akcji dzika.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§OSC2 objazd przeżywa pauzę w ruchu (prawdziwy `steerSolver`)");
{
  const BODY = 46;
  const SPEED = 52;
  const DT = 1 / 60;
  // Telegraf szarży (560 ms) co jej cooldown (2200 ms), przy 60 fps.
  const HOLD_CO = Math.round((2200 / 1000) * 60);
  const HOLD_DL = Math.round((560 / 1000) * 60);

  const przejazd = (boxy, start, cel, kroki = 1400) => {
    const isFree = (x, y, ww, hh) =>
      !boxy.some((b) => Math.abs(x - b.x) < (ww + b.w) / 2 && Math.abs(y - b.y) < (hh + b.h) / 2);
    const ctx = { isFree };
    const st = freshSteerState();
    let px = start.x;
    let py = start.y;
    let zmiany = 0;
    let poprz = 0;
    for (let i = 0; i < kroki; i++) {
      if (Math.hypot(cel.x - px, cel.y - py) < 20) return { zmiany, dotarl: true };
      // ⚠ Pauza = `hold`, dokładnie jak w `Boar.updateAi` przy trwającej akcji.
      const intent = i % HOLD_CO < HOLD_DL ? hold() : seek(cel.x, cel.y, SPEED);
      const self = { x: px, y: py, bodyX: px, bodyY: py, bodyW: BODY, bodyH: BODY, dt: DT, steerState: st };
      const v = steerSolver.solve(intent, self, ctx);
      sprawdzen++;
      if (st.sign !== 0 && poprz !== 0 && st.sign !== poprz) zmiany++;
      if (st.sign !== 0) poprz = st.sign;
      const nx = px + v.x * DT;
      const ny = py + v.y * DT;
      if (isFree(nx, py, BODY, BODY)) px = nx;
      if (isFree(px, ny, BODY, BODY)) py = ny;
    }
    return { zmiany, dotarl: false };
  };

  const PIEN = { x: 150, y: 0, w: 60, h: 60 };
  const przypadki = [
    ["drzewo + sadzawka, przejście GÓRĄ",
      [{ x: 150, y: -145, w: 90, h: 90 }, { x: 150, y: 145, w: 260, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, true],
    ["ten sam układ odbity, przejście DOŁEM",
      [{ x: 150, y: -145, w: 260, h: 90 }, { x: 150, y: 145, w: 90, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, true],
    ["DŁUGI odcinek przeszkody (260 px)",
      [{ x: 190, y: 0, w: 260, h: 90 }], { x: 0, y: 0 }, { x: 420, y: 0 }, true],
    ["sadzawka + drzewo (układ ze zgłoszenia)",
      [{ x: 190, y: 40, w: 260, h: 120 }, { x: 150, y: -80, w: 70, h: 70 }],
      { x: 0, y: 0 }, { x: 420, y: 0 }, true],
    // ⚠ Dziura POŚRODKU kusi, żeby zawrócić na wprost w połowie objazdu.
    ["przeszkoda z kuszącą dziurą",
      [{ x: 120, y: 0, w: 120, h: 90 }, { x: 300, y: 0, w: 120, h: 90 }],
      { x: 0, y: 0 }, { x: 460, y: 0 }, true],
    // ⚠ Przejścia NIE MA (luka 20 px przy ciele 46). Dojścia nie wymagamy —
    //   wymagamy braku miotania się.
    ["ślepy zaułek — bez przejścia",
      [{ x: 150, y: -95, w: 90, h: 90 }, { x: 150, y: 95, w: 200, h: 90 }, PIEN],
      { x: 0, y: 0 }, { x: 320, y: 0 }, false],
  ];

  /* ── Asymetria `hold` vs `impulse`, wprost ─────────────────────────────
     ⚠ Scenariusze wyżej nie używają `impulse`, więc nie złapałyby błędu
     odwrotnego: „impulse przestał kasować pamięć". A ta asymetria jest teraz
     decyzją nośną — `impulse` PRZESTAWIA ciało (odrzut, lot szarży), więc
     wybrana strona opisuje sytuację, której już nie ma; `hold` tylko
     zatrzymuje, więc pamięć ma przeżyć. Testujemy oba kierunki na stanie. */
  {
    // ⚠ Cienka bariera wzdłuż osi +x: sonda wprost i 18° zajęte, 36° wolne.
    //   Dzięki temu `steer` MUSI wybrać stronę i ustawić zobowiązanie.
    const ctx = { isFree: (x, y) => !(x > 5 && Math.abs(y) < 5) };
    const st = freshSteerState();
    const self = () => ({ x: 0, y: 0, bodyX: 0, bodyY: 0, bodyW: 46, bodyH: 46, dt: 1 / 60, steerState: st });
    // 1. Zwykły seek przy zablokowanej drodze wprost → powstaje zobowiązanie.
    steerSolver.solve(seek(300, 0, 52), self(), ctx);
    sprawdzen++;
    if (st.sign === 0 || st.leftPx <= 0) zle("§OSC2 seek nie utworzył zobowiązania — scenariusz stracił cel", st.sign, "≠0");
    const znak = st.sign;
    const zostalo = st.leftPx;

    // 2. `hold` MUSI zachować.
    steerSolver.solve(hold(), self(), ctx);
    sprawdzen++;
    const zachowane = st.sign === znak && st.leftPx === zostalo;
    if (!zachowane) zle("§OSC2 `hold` SKASOWAŁ pamięć objazdu (to był ten błąd)", `${st.sign}/${st.leftPx}`, `${znak}/${zostalo}`);
    console.log(`  ${zachowane ? "OK  " : "BŁĄD"} \`hold\` ZACHOWUJE stronę objazdu (${znak}, ${zostalo.toFixed(0)} px)`);

    // 3. `impulse` MUSI skasować.
    steerSolver.solve(impulse(10, 0), self(), ctx);
    sprawdzen++;
    const skasowane = st.sign === 0 && st.leftPx === 0;
    if (!skasowane) zle("§OSC2 `impulse` NIE skasował pamięci — odrzut przestawia ciało", `${st.sign}/${st.leftPx}`, "0/0");
    console.log(`  ${skasowane ? "OK  " : "BŁĄD"} \`impulse\` KASUJE stronę objazdu (ciało zostało przestawione)`);
  }

  const LIMIT = 2;
  for (const [nazwa, boxy, start, cel, maDojsc] of przypadki) {
    const r = przejazd(boxy, start, cel);
    const stabilne = r.zmiany <= LIMIT;
    if (!stabilne) zle(`§OSC2 ${nazwa}: strona objazdu zmieniona ${r.zmiany}× (limit ${LIMIT})`, r.zmiany, LIMIT);
    if (maDojsc && !r.dotarl) zle(`§OSC2 ${nazwa}: stworzenie NIE doszło do celu mimo istniejącego objazdu`, "nie doszło", "doszło");
    console.log(
      `  ${stabilne && (!maDojsc || r.dotarl) ? "OK  " : "BŁĄD"} ${nazwa.padEnd(40)} zmian strony: ${r.zmiany}   dotarł: ${r.dotarl ? "TAK" : "nie (oczekiwane)"}`,
    );
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   §REACH. OSIĄGALNOŚĆ CELU — „czy w ogóle jest którędy"
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Trzecie zgłoszenie z playtestu (2026-09-05):** gracz stanął za gęstwiną,
   a dzik zamiast odpuścić dobijał się do drzew bez końca.

   Instrumentacja pokazała, że **informacja o nieosiągalności była LICZONA
   I WYRZUCANA**: `findPath` (A* nad `NavGrid`) zwraca `null`, gdy trasy nie ma,
   ale `PathFollower.next()` zwracał `null` w DWÓCH różnych sytuacjach —
   „czysta linia, trasa niepotrzebna" i „trasy NIE MA" — a `Locomotion` w obu
   zostawiał surowy `seek` na gracza.

   ⛔ **To nie jest timeout ani licznik prób**, tylko odpowiedź nawigacji, którą
   projekt i tak liczył. Żadnego nowego pathfindingu: `findPath` istnieje od
   Fazy 1B i jest wołane dla każdego `seek`.

   Guard sprawdza ZACHOWANIE: czy `unreachable` zapala się tylko tam, gdzie
   trasy naprawdę nie ma, i czy stan bez trasy nie każe liczyć A* co klatkę.
   ⚠ `NavBox.x/y` to LEWY GÓRNY RÓG, nie środek (patrz `NavGrid.build`) —
     pierwsza wersja tych scenariuszy stawiała „zagrodę" obok celu i test
     świecił na zielono z niewłaściwego powodu.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§REACH osiągalność celu (`findPath` → `PathFollower.unreachable`)");
{
  const W = 480;
  const H = 480;
  const BODY = 46;
  const START = { x: 80, y: 240 };
  const CEL = { x: 360, y: 240 };
  const ZAGRODA = [
    { x: 260, y: 140, w: 200, h: 24 },
    { x: 260, y: 316, w: 200, h: 24 },
    { x: 260, y: 140, w: 24, h: 200 },
    { x: 436, y: 140, w: 24, h: 200 },
  ];

  const zbadaj = (boxy, klatek = 120) => {
    const nav = NavGrid.build(boxy, W, H);
    // ⚠ Proxy liczy WYWOŁANIA A*: `findPath` zaczyna od `nav.hasClearLine`.
    let aGwiazdka = 0;
    const navLicz = new Proxy(nav, {
      get(t, k) {
        const v = Reflect.get(t, k);
        if (k === "hasClearLine") return (...args) => { aGwiazdka++; return v.apply(t, args); };
        return typeof v === "function" ? v.bind(t) : v;
      },
    });
    const pf = new PathFollower();
    for (let i = 0; i < klatek; i++) {
      pf.next(navLicz, i * 16.7, START.x, START.y, CEL.x, CEL.y, BODY);
      sprawdzen++;
    }
    return { unreachable: pf.unreachable, aGwiazdka, trasa: findPathIstnieje(nav) };
  };
  const findPathIstnieje = (nav) => nav.hasClearLine(START.x, START.y, CEL.x, CEL.y, BODY);

  const przypadki = [
    ["1. czysta droga", [], false],
    ["2. pojedyncza przeszkoda + obejście", [{ x: 190, y: 170, w: 60, h: 60 }], false],
    ["3. dwa drzewa, przejście między nimi",
      [{ x: 190, y: 60, w: 60, h: 120 }, { x: 190, y: 300, w: 60, h: 120 }], false],
    ["4. cel CAŁKOWICIE zamknięty", ZAGRODA, true],
    // 5. Układ ze zgłoszenia: gęstwina z wąską, ale PRZECHODNIĄ luką.
    ["5. gęstwina z przejściem (układ ze zgłoszenia)",
      [{ x: 190, y: 40, w: 60, h: 150 }, { x: 190, y: 260, w: 60, h: 180 }], false],
    // 6. To samo lustrzanie (luka po drugiej stronie).
    ["6. ten sam układ lustrzanie",
      [{ x: 190, y: 0, w: 60, h: 180 }, { x: 190, y: 290, w: 60, h: 150 }], false],
  ];

  for (const [nazwa, boxy, oczekUnreach] of przypadki) {
    const r = zbadaj(boxy);
    const ok = r.unreachable === oczekUnreach;
    if (!ok) zle(`§REACH ${nazwa}: unreachable=${r.unreachable}`, r.unreachable, oczekUnreach);
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${nazwa.padEnd(46)} unreachable=${String(r.unreachable).padEnd(5)} A*/120 klatek: ${r.aGwiazdka}`);
  }

  /* ⚠⚠ Stan „nie ma trasy" NIE MOŻE liczyć A* co klatkę. Przy pustej liście
     `idx >= length` jest prawdą zawsze, więc przed poprawką `exhausted`
     wymuszał przeliczenie w KAŻDEJ klatce — zmierzone 120/120. */
  const zamkniete = zbadaj(ZAGRODA);
  const rzadko = zamkniete.aGwiazdka <= 10;
  if (!rzadko) zle("§REACH brak trasy liczy A* zbyt często", zamkniete.aGwiazdka, "≤10 / 120 klatek");
  console.log(`  ${rzadko ? "OK  " : "BŁĄD"} stan bez trasy nie przelicza A* co klatkę (${zamkniete.aGwiazdka}/120)`);
}

/* ── Kontrola siły całego testu ──────────────────────────────────────────── */

console.log(`\nSprawdzeń łącznie: ${sprawdzen}`);
if (sprawdzen < 40000) {
  console.error("BŁĄD: za mało sprawdzeń — test przestał cokolwiek pokrywać.");
  bledy++;
}

await Promise.all([stubPhaser, tmpIntent, tmpSteer, tmpCfgMove, tmpSolver, tmpNav, tmpFollow].map((p) => unlink(p).catch(() => {})));

if (bledy) {
  console.error(`\n${bledy} ROZBIEŻNOŚCI.`);
  process.exit(1);
}
console.log("OK — warstwa ruchu odtwarza dotychczasowy ruch co do bitu.");

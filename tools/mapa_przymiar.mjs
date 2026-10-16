/**
 * Przymiar MAPY ŚWIATA i MGŁY (2026-10-14) — `docs/systemy/world.md` §5.1.
 *
 * ── Po co ─────────────────────────────────────────────────────────────────
 * Widok „Świat” stawia obszary z `MAP_ATLAS`, a rozmiar każdego bierze
 * z obrazu minimapy. Żadna z tych liczb nie wywali gry, gdy się rozjedzie:
 * przesunięta wieś narysuje się obok lasu, Gęstwina odkleji się od bramy,
 * a obraz minimapy o innej gęstości da mgłę w złych miejscach — wszystko
 * „działa”, tylko kłamie. Do dziś pilnował tego wyłącznie render.
 *
 *   §A  atlas ↔ `swiat.world` (obszary otwartego świata)
 *   §B  Gęstwina brama do bramy z lasem (obiekty `portal` w obu `.tmj`)
 *   §C  obrazy minimapy: gęstość `MAP_FOG.minimapPxPerWorld`, rozmiar = mapa Tiled
 *   §D  `Exploration`: koło, zapis ↔ odczyt, obcy rozmiar, „*”
 *   §E  Kartografia: II po I; zapis sprzed mgły dostaje I+II i odkrytą wieś z lasem
 *
 * ⚠ Każda reguła ma KONTROLĘ: te same funkcje dostają celowo zepsute dane
 * i MUSZĄ zgłosić błąd („asercja, która nie potrafi zaświecić na czerwono,
 * jest dekoracją” — `CLAUDE.md`).
 *
 *   node tools/mapa_przymiar.mjs      # nic nie zapisuje na dysk
 */
import { build } from "esbuild";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAPY = join(KORZEN, "public", "assets", "maps");
const tmp = mkdtempSync(join(tmpdir(), "mapa-"));
let bledy = 0;
let sprawdzen = 0;

function ok(warunek, opis, detal = "") {
  sprawdzen++;
  console.log(`  ${warunek ? "OK  " : "⛔  "} ${opis}${detal ? "   " + detal : ""}`);
  if (!warunek) bledy++;
}
/** Kontrola: sprawdzian na zepsutych danych MUSI zwrócić błędy. */
function kontrola(bledyNaZepsutym, opis) {
  ok(bledyNaZepsutym.length > 0, `kontrola: ${opis} — świeci na czerwono`, bledyNaZepsutym[0] ?? "NIE ŚWIECI");
}

/* ── localStorage (Save wpina autozapis przy imporcie) i stub Phasera ──── */
const magazyn = new Map();
globalThis.localStorage = {
  getItem: (k) => (magazyn.has(k) ? magazyn.get(k) : null),
  setItem: (k, v) => magazyn.set(k, String(v)),
  removeItem: (k) => magazyn.delete(k),
};
const stub = join(tmp, "phaser-stub.mjs");
writeFileSync(
  stub,
  `class EventEmitter {
     constructor() { this.l = new Map(); }
     on(k, fn, ctx) { if (!this.l.has(k)) this.l.set(k, []); this.l.get(k).push([fn, ctx]); return this; }
     once(k, fn, ctx) { return this.on(k, fn, ctx); }
     off(k, fn) { const a = this.l.get(k) ?? []; this.l.set(k, a.filter(([f]) => f !== fn)); return this; }
     removeAllListeners(k) { if (k === undefined) this.l.clear(); else this.l.delete(k); return this; }
     emit(k, ...args) { for (const [fn, ctx] of (this.l.get(k) ?? []).slice()) fn.call(ctx, ...args); return true; }
   }
   export default { Events: { EventEmitter } };`,
);
// ⚠ JEDEN bundel — osobne wejścia dałyby drugie instancje singletonów
// (ta sama pułapka co `import()` w konsoli, `src/core/CLAUDE.md`).
const re = (p) => JSON.stringify(resolve(KORZEN, p));
const wejscie = join(tmp, "wejscie.ts");
writeFileSync(
  wejscie,
  `export { MAP_ATLAS, MAP_FOG, MAP_BY_ID, SWIAT, SKILLS, WORLD } from ${re("src/config/GameConfig.ts")};
   export { Exploration, REVEALED_ALL } from ${re("src/core/Exploration.ts")};
   export { Skills } from ${re("src/core/Skills.ts")};
   export { Inventory } from ${re("src/core/Inventory.ts")};
   export { Save } from ${re("src/core/Save.ts")};`,
);
const out = join(tmp, "bundle.mjs");
await build({ entryPoints: [wejscie], outfile: out, bundle: true, format: "esm", platform: "node", logLevel: "silent", alias: { phaser: stub } });
const M = await import(pathToFileURL(out).href);
const { MAP_ATLAS, MAP_FOG, MAP_BY_ID, SWIAT, Exploration, REVEALED_ALL, Skills, Inventory, Save } = M;

const czytajJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const TILE = 32;
/** Plik `.tmj` obszaru po id — z `MAP_BY_ID[id].path`. */
const tmjOf = (id) => czytajJson(join(KORZEN, "public", MAP_BY_ID[id].path));
/** Wymiary PNG z nagłówka IHDR — bez zależności od biblioteki obrazów. */
function pngSize(p) {
  const b = readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
/** Ścieżka obrazu minimapy: klucz `minimap-<x>` → `maps/<x>_minimap.png` (BootScene). */
const minimapPng = (id) => join(MAPY, `${MAP_BY_ID[id].minimapKey.replace(/^minimap-/, "")}_minimap.png`);

/* ── §A atlas ↔ swiat.world ─────────────────────────────────────────────── */
console.log("\n§A  atlas ↔ swiat.world");
function sprawdzAtlasSwiat(atlas, swiat, czlonkowie) {
  const b = [];
  for (const m of swiat.maps) {
    const id = czlonkowie[m.fileName]?.id;
    if (!id) continue;
    const a = atlas.find((x) => x.id === id);
    if (!a) b.push(`obszar „${id}” z swiat.world nie ma wpisu w MAP_ATLAS`);
    else if (a.x !== m.x || a.y !== m.y) b.push(`„${id}”: atlas (${a.x}, ${a.y}) ≠ swiat.world (${m.x}, ${m.y})`);
  }
  return b;
}
const swiat = czytajJson(join(KORZEN, "public", SWIAT.path));
{
  const b = sprawdzAtlasSwiat(MAP_ATLAS, swiat, SWIAT.czlonkowie);
  ok(b.length === 0, "obszary otwartego świata stoją w atlasie tam, gdzie w swiat.world", b.join("; "));
  kontrola(sprawdzAtlasSwiat(MAP_ATLAS.map((a) => (a.id === "forest" ? { ...a, y: a.y + 32 } : a)), swiat, SWIAT.czlonkowie), "las przesunięty o kafel");
  kontrola(sprawdzAtlasSwiat(MAP_ATLAS.filter((a) => a.id !== "village"), swiat, SWIAT.czlonkowie), "wieś bez wpisu");
}

/* ── §B Gęstwina brama do bramy ─────────────────────────────────────────── */
console.log("\n§B  obszary za portalem przyłożone brama do bramy");
/** Portale mapy → `{ target, x, y }` w px tej mapy. */
function portale(tmj) {
  const out = [];
  for (const l of tmj.layers) for (const o of l.objects ?? []) {
    const p = Object.fromEntries((o.properties ?? []).map((q) => [q.name, q.value]));
    if (o.type === "portal" || p.target) out.push({ target: p.target, x: o.x, y: o.y });
  }
  return out;
}
/**
 * Para portali A→B i B→A to jedno przejście: w atlasie oba punkty mają leżeć
 * najwyżej `tol` px od siebie (brama „po drugiej stronie” stoi tuż obok).
 */
function sprawdzBramy(atlas, tolPx) {
  const b = [];
  const at = Object.fromEntries(atlas.map((a) => [a.id, a]));
  let par = 0;
  for (const a of atlas) {
    for (const p of portale(tmjOf(a.id))) {
      const drugi = at[p.target];
      if (!drugi) {
        // Portal prowadzi do obszaru spoza atlasu — widok „Świat” go nie
        // narysuje, a gracz przez tę bramę przechodzi. (Bez tej gałęzi
        // kontrola „brak obszaru za portalem” nie świeciła — 2026-10-14.)
        if (MAP_BY_ID[p.target]) b.push(`brama ${a.id} → ${p.target}: obszaru „${p.target}” nie ma w MAP_ATLAS`);
        continue;
      }
      const zwrot = portale(tmjOf(p.target)).find((q) => q.target === a.id);
      if (!zwrot) continue;
      par++;
      const dx = a.x + p.x - (drugi.x + zwrot.x);
      const dy = a.y + p.y - (drugi.y + zwrot.y);
      const d = Math.hypot(dx, dy);
      if (d > tolPx) b.push(`brama ${a.id} → ${p.target}: w atlasie ${d.toFixed(0)} px od bramy powrotnej (dopuszczalne ${tolPx})`);
    }
  }
  if (par === 0) b.push("nie znaleziono ani jednej pary portali między obszarami atlasu");
  return b;
}
{
  const TOL = 4 * TILE; // brama leży na krawędzi, punkty po obu stronach progu
  const b = sprawdzBramy(MAP_ATLAS, TOL);
  ok(b.length === 0, "Gęstwina styka się bramą z bramą lasu", b.join("; "));
  kontrola(sprawdzBramy(MAP_ATLAS.map((a) => (a.id === "thicket" ? { ...a, y: a.y + 64 * TILE } : a)), TOL), "Gęstwina odsunięta o 64 kafle");
  kontrola(sprawdzBramy(MAP_ATLAS.filter((a) => a.id !== "thicket"), TOL), "brak obszaru za portalem");
}

/* ── §C obrazy minimapy ─────────────────────────────────────────────────── */
console.log("\n§C  obrazy minimapy: gęstość i rozmiar");
function sprawdzMinimapy(pomiary, gestosc) {
  const b = [];
  for (const m of pomiary) {
    const oczek = { w: m.tmj.w * TILE * gestosc, h: m.tmj.h * TILE * gestosc };
    if (m.png.w !== oczek.w || m.png.h !== oczek.h) b.push(`„${m.id}”: obraz ${m.png.w}×${m.png.h}, mapa ${m.tmj.w}×${m.tmj.h} kafli wymaga ${oczek.w}×${oczek.h}`);
    // Komórka mgły musi być całą liczbą pikseli obrazu, inaczej rysunek się rozjeżdża.
    const cell = MAP_FOG.cellPx * gestosc;
    if (!Number.isInteger(cell)) b.push(`komórka mgły to ${cell} px obrazu — nie całe piksele`);
  }
  return b;
}
const pomiary = MAP_ATLAS.map((a) => {
  const t = tmjOf(a.id);
  return { id: a.id, png: pngSize(minimapPng(a.id)), tmj: { w: t.width, h: t.height } };
});
{
  const b = sprawdzMinimapy(pomiary, MAP_FOG.minimapPxPerWorld);
  ok(b.length === 0, `obrazy ${pomiary.map((m) => `${m.id} ${m.png.w}×${m.png.h}`).join(", ")} zgadzają się z mapami`, b.join("; "));
  kontrola(sprawdzMinimapy(pomiary.map((m, i) => (i === 0 ? { ...m, png: { w: m.png.w / 2, h: m.png.h } } : m)), MAP_FOG.minimapPxPerWorld), "obraz o połowie szerokości");
  kontrola(sprawdzMinimapy(pomiary, MAP_FOG.minimapPxPerWorld * 2), "inna gęstość obrazów");
}

/* ── §D Exploration ─────────────────────────────────────────────────────── */
console.log("\n§D  Exploration: koło, zapis ↔ odczyt");
/** Komórki odkryte w siatce — spis do porównań. */
function odkryte(region) {
  const g = Exploration.gridSize(region);
  const out = [];
  if (!g) return out;
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) if (Exploration.isCellRevealed(region, i, j)) out.push(j * g.cols + i);
  return out;
}
/** Koło: odkryte = dokładnie komórki, których środek leży w promieniu. */
function sprawdzKolo(region, x, y, wPx, hPx, R) {
  const b = [];
  const P = MAP_FOG.cellPx;
  const g = Exploration.gridSize(region);
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) {
    const w = Math.hypot((i + 0.5) * P - x, (j + 0.5) * P - y) <= R;
    if (w !== Exploration.isCellRevealed(region, i, j)) b.push(`komórka (${i}, ${j}): ${w ? "w zasięgu, a we mgle" : "poza zasięgiem, a odkryta"}`);
  }
  return b;
}
{
  Exploration.reset();
  const W = 2048, H = 2048;
  Exploration.visit("test", 1000, 1000, W, H);
  const kolo = sprawdzKolo("test", 1000, 1000, W, H, MAP_FOG.revealRadiusPx);
  ok(kolo.length === 0 && odkryte("test").length > 0, `visit odkrywa koło ${MAP_FOG.revealRadiusPx} px (${odkryte("test").length} komórek)`, kolo[0] ?? "");
  kontrola(sprawdzKolo("test", 1000, 1000, W, H, MAP_FOG.revealRadiusPx / 2), "koło o połowie promienia");

  // Ruch w tej samej komórce nie liczy nic nowego — zdarzenie nie leci.
  Exploration.visit("test", 1010, 1010, W, H);
  ok(Math.abs(Exploration.fraction("test") * (32 * 32) - odkryte("test").length) < 1e-9, "fraction = odkryte / wszystkie komórki");

  // Brzeg obszaru: koło przy rogu nie wychodzi poza siatkę ani nie rzuca.
  let rzut = null;
  try { Exploration.visit("test", 5, 5, W, H); } catch (e) { rzut = e; }
  ok(rzut === null, "koło przy rogu obszaru nie wychodzi poza siatkę");

  // Zapis ↔ odczyt.
  const przed = odkryte("test");
  const zapis = Exploration.snapshot();
  Exploration.restore(zapis);
  const fracPrzed = przed.length / (32 * 32);
  ok(Math.abs(Exploration.fraction("test") - fracPrzed) < 1e-9, "fraction obszaru z zapisu (przed rozpakowaniem) = przed zapisem");
  Exploration.ensure("test", W, H);
  const po = odkryte("test");
  ok(po.length === przed.length && po.every((k, i) => k === przed[i]), `snapshot → restore odtwarza te same komórki (${po.length})`);
  kontrola(
    (() => {
      // Zepsuty bit w zapisie MUSI dać inne komórki — inaczej porównanie wyżej nic nie mierzy.
      const [dims, b64] = zapis.test.split(":");
      const raw = Buffer.from(b64, "base64");
      raw[0] ^= 0xff;
      Exploration.restore({ test: `${dims}:${raw.toString("base64")}` });
      Exploration.ensure("test", W, H);
      const zepsute = odkryte("test");
      return zepsute.length === przed.length && zepsute.every((k, i) => k === przed[i]) ? [] : ["inne komórki"];
    })(),
    "zapis z przestawionym bajtem",
  );

  // Obcy rozmiar siatki (przebudowana mapa) — NIE rozpakowuje się.
  Exploration.restore(zapis);
  Exploration.ensure("test", W + 128, H);
  ok(odkryte("test").length === 0, "zapis o innych wymiarach siatki zostaje we mgle (nie rysuje się w złych miejscach)");

  // „*” — cały obszar.
  Exploration.restore({ test: REVEALED_ALL });
  ok(Exploration.fraction("test") === 1, "„*” przed rozpakowaniem: fraction = 1");
  Exploration.ensure("test", W, H);
  ok(odkryte("test").length === 32 * 32, "„*” po rozpakowaniu: wszystkie komórki odkryte");

  // Reset czyści wszystko.
  Exploration.reset();
  ok(!Exploration.has("test") && Exploration.fraction("test") === 0, "reset: obszar znów nieznany");
}

/* ── §E Kartografia i zapis sprzed mgły ─────────────────────────────────── */
console.log("\n§E  Kartografia: wymogi i stare zapisy");
{
  Skills.reset();
  Inventory.reset();
  Inventory.addGold(1000);
  ok(Skills.missingPrereq("cartography_2") === "cartography_1", "Kartografia II wymaga I");
  ok(!Skills.canLearn("cartography_2") && !Skills.learn("cartography_2"), "II bez I: ani znacznik „+”, ani nauka");
  ok(Skills.learn("cartography_1") && Skills.learn("cartography_2"), "I, potem II — obie się uczą");

  // Zapis sprzed Kartografii: brak pola `explored`.
  Skills.reset();
  Exploration.reset();
  Save.save("auto");
  const klucz = [...magazyn.keys()].find((k) => magazyn.get(k).includes('"skills"'));
  const dane = JSON.parse(magazyn.get(klucz));
  delete dane.explored;
  dane.skills = [];
  magazyn.set(klucz, JSON.stringify(dane));
  Save.load("auto");
  const ma = Skills.snapshot();
  ok(ma.includes("cartography_1") && ma.includes("cartography_2"), "stary zapis dostaje Kartografię I i II", JSON.stringify(ma));
  ok(Exploration.fraction("village") === 1 && Exploration.fraction("forest") === 1 && Exploration.fraction("thicket") === 0, "stary zapis: wieś i las odkryte, Gęstwina we mgle");

  // Nowa gra zapisuje `{}`, nie brak pola — i NIE dostaje Kartografii za darmo.
  Skills.reset();
  Exploration.reset();
  Save.save("auto");
  const nowa = JSON.parse(magazyn.get(klucz));
  ok(nowa.explored !== undefined, "nowa gra zapisuje pole `explored` (brak pola znaczy „stary zapis”)");
  Save.load("auto");
  ok(!Skills.has("cartography_1") && !Skills.has("cartography_2"), "nowa gra po wczytaniu nie ma Kartografii");
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\nSprawdzeń: ${sprawdzen}.`);
if (bledy) {
  console.log(`⛔ BŁĘDÓW: ${bledy}`);
  process.exit(1);
}
console.log("OK — atlas zgadza się ze światem i bramami, obrazy z mapami, mgła z zapisem.");
console.log("Nic nie zapisano na dysk — ten przymiar pracuje na stubie `localStorage`.");

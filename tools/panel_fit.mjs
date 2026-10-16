/**
 * Przymiar MIESZCZENIA SIĘ PANELI, SZYNY i PROGU DOTYKU (`OI-68`, etap B,
 * 2026-10-13).
 *
 * ⚠ **Uruchamia PRAWDZIWE `FrameLayout.ts`, `ShopLayout.ts` i `theme.ts`,
 * nie kopię wzoru.** Ta sama reguła, co `tools/sklep_uklad.mjs`
 * i `tools/hud_uklad.mjs`: drugi rachunek tej samej geometrii rozjeżdża się
 * z grą po cichu.
 *
 * Do tej daty „czy panel się mieści" było wyłącznie ostrzeżeniem w konsoli
 * buildu deweloperskiego (`PanelBase.warnIfClipped`) — w wydaniu panel
 * przycinał się po cichu, a przy ramie rozmowy z szyną obszar usługi zrobił
 * się węższy od ekranu, więc pytanie przestało być teoretyczne.
 *
 * Sprawdza w SZEŚCIU realnych ramkach (te same, co `sklep_uklad`):
 *   §P  każdy panel mieści się w obszarze GOSPODARZA (ekran albo obszar usługi
 *       na lewo od szyny): skala 1 = OK, 0,5–1 = ostrzeżenie, < 0,5 = BŁĄD
 *   §S  szyna: zakładki nie wchodzą na wyjście, kafel ≥ próg dotyku, przerwa
 *       nad wyjściem ≥ 16 j., szyna w ekranie — dla 1…5 zakładek
 *   §G  panel usługi trzyma ≥ 16 j. od szyny (przycisk akcji karty a „Do widzenia")
 *   §K  kolumna rozmowy mieści się obok pasa wypowiedzi
 *   §F  „lista + karta" (zadania, szkolenie, Mistrzostwo — etap F): wiersz
 *       ≥ próg dotyku, lista i karta ≥ podłóg, przycisk w karcie, ciało karty
 *       ≥ 200 j., żaden prostokąt poza panelem
 *   §T  role tekstu (`theme.TYPE`) spełniają podłogi czytelności z researchu
 *   §L  pliki przeniesione na role nie mają literałów `fontSize: "12px"`
 *   §0  KONTROLE: celowo zepsute dane MUSZĄ dać błąd (asercja, która nie
 *       potrafi zaświecić na czerwono, jest dekoracją)
 *
 * Czego NIE potrafi: powiedzieć, czy to wygląda dobrze. Do tego jest render
 * 1:1 z telefonem (`tools/phone_render.mjs`).
 *
 *   node tools/panel_fit.mjs
 */

import { build } from "esbuild";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-panel-fit.ts");
const wejscie = join(KORZEN, "node_modules", ".panel-fit-entry.ts");
const tmp = join(KORZEN, "node_modules", ".panel-fit.mjs");

/** Krótsza oś, przy której skala UI wynosi 1 (`UI_SCALE.designShortAxis`). */
const DESIGN_SHORT = 580;

const EKRANY = [
  { nazwa: "S21 FE poziomo", cssW: 891, cssH: 411, telefon: true },
  { nazwa: "telefon 16:9 poziomo", cssW: 740, cssH: 360, telefon: true },
  { nazwa: "mały telefon 640×300", cssW: 640, cssH: 300, telefon: true },
  { nazwa: "laptop 1366×768", cssW: 1366, cssH: 768, telefon: false },
  { nazwa: "monitor 1920×1080", cssW: 1920, cssH: 1080, telefon: false },
  // ⚠ Okno przeglądarki w pionie — jedyna ramka, w której panele są
  //   zmniejszane, a szyna przechodzi w same ikony. Telefon ma orientację
  //   zablokowaną w manifeście.
  { nazwa: "okno pionowe 520×900", cssW: 520, cssH: 900, telefon: false },
];

await writeFile(
  stubPhaser,
  `class E { on() { return this; } once() { return this; } off() { return this; } emit() { return false; } }
   const Phaser = {
     Math: { Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) },
     Events: { EventEmitter: E },
     Input: { Events: {} },
     Scenes: { Events: {} },
     GameObjects: { Text: { prototype: {} } },
   };
   export default Phaser;\n`,
);
await writeFile(
  wejscie,
  `export * from "../src/ui/FrameLayout";
   export { shopPanelW, shopPanelH } from "../src/ui/ShopLayout";
   export { computeListDetailLayout, LIST_DETAIL } from "../src/ui/ListDetailLayout";
   export { TYPE } from "../src/core/theme";
   export { HUD_LAYOUT } from "../src/config/GameConfig";\n`,
);
await build({
  entryPoints: [wejscie],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [{ name: "stuby", setup(b) { b.onResolve({ filter: /^phaser$/ }, () => ({ path: stubPhaser })); } }],
});
const M = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});
await unlink(wejscie).catch(() => {});
await unlink(stubPhaser).catch(() => {});

const {
  FRAME, subviewSize, computeListDetailLayout, LIST_DETAIL, computeRailLayout, serviceArea, screenArea, talkColumn,
  panelFitScale, playerPanelSize, shopPanelW, shopPanelH, TYPE, HUD_LAYOUT,
} = M;

let bledy = 0;
let ostrzezenia = 0;
const ok = (id, opis, dowod) => console.log(`✅ ${id.padEnd(4)} ${opis.padEnd(66)} ${dowod}`);
const zle = (id, opis, dowod) => { bledy++; console.log(`⛔ ${id.padEnd(4)} ${opis.padEnd(66)} ${dowod}`); };
const uwaga = (id, opis, dowod) => { ostrzezenia++; console.log(`⚠  ${id.padEnd(4)} ${opis.padEnd(66)} ${dowod}`); };
const sprawdz = (w, id, opis, dowod) => (w ? ok : zle)(id, opis, dowod);

function wirtualne(e) {
  const fit = Math.min(Math.max(Math.min(e.cssW, e.cssH) / DESIGN_SHORT, 0.5), 1);
  return { W: e.cssW / fit, H: e.cssH / fit };
}

/**
 * Panele stojące w RAMIE rozmowy (obszar usługi na lewo od szyny), a nie na
 * całym ekranie. ⚠ Musi zgadzać się z `host` w konstruktorach — to lista
 * stanu kodu, nie życzenie.
 */
const W_RAMIE = new Map([
  // ⭐ Etap D (2026-10-13): panel gracza stoi w ramie obok szyny nawigacji.
  ["PlayerPanel", { dense: false }],
  // ⭐ Handel prosi o szynę SAMYCH IKON (`denseRail`, autor 2026-10-13).
  ["ShopPanel", { dense: true }],
  ["QuestPanel", { dense: false }],
  ["TrainerPanel", { dense: false }],
  ["MasteryPanel", { dense: false }],
]);

/** Panele: rozmiar przy danym oknie + obszar gospodarza. Jedyna lista paneli. */
function panele(W, H) {
  const obszar = (nazwa) => (W_RAMIE.has(nazwa) ? serviceArea(W, H, W_RAMIE.get(nazwa).dense) : screenArea(W, H));
  const ob = obszar("PlayerPanel");
  const gracz = playerPanelSize(ob.w, ob.h);
  const sklep = obszar("ShopPanel");
  // ⭐ Etap F (2026-10-13): zadania, szkolenie i Mistrzostwo biorą CAŁY obszar
  //   usługi (`subviewSize`) — do tej daty stałe 816×440–470.
  const usluga = obszar("QuestPanel");
  const lista = subviewSize(usluga.w, usluga.h);
  const p = (nazwa, w, h) => ({ nazwa, w, h, obszar: obszar(nazwa), rama: W_RAMIE.has(nazwa), dense: W_RAMIE.get(nazwa)?.dense ?? false });
  return [
    p("PlayerPanel", gracz.w, gracz.h),
    p("ShopPanel", shopPanelW(sklep.w), shopPanelH(sklep.h)),
    p("QuestPanel", lista.w, lista.h),
    p("TrainerPanel", lista.w, lista.h),
    p("MasteryPanel", lista.w, lista.h),
  ];
}

/** Ocena skali dopasowania — ta sama reguła dla kontroli i dla paneli. */
function ocenSkale(skala) {
  return skala >= 1 ? "ok" : skala >= 0.5 ? "uwaga" : "zle";
}

console.log("=== przymiar mieszczenia się paneli, szyny i progu dotyku (OI-68) ===\n");
console.log(`norma dotyku          ${HUD_LAYOUT.minTouch} j.`);
console.log(`szyna                 ${FRAME.rail.w} j. (wąska ${FRAME.rail.compactW} j. poniżej ${FRAME.rail.compactBelow} j. szerokości)\n`);

/* ══ §0: KONTROLE — zepsute dane MUSZĄ dać błąd ═════════════════════════ */
{
  const tel = wirtualne(EKRANY[0]);
  const zaDuzo = computeRailLayout(tel.W, tel.H, 9);
  sprawdz(zaDuzo.overflow !== null, "S0", "kontrola: 9 zakładek MUSI przepełnić szynę na telefonie", zaDuzo.overflow ?? "przepuszczone — asercja ślepa");
  const olbrzym = ocenSkale(panelFitScale(3000, 400, serviceArea(tel.W, tel.H)));
  sprawdz(olbrzym === "zle", "P0", "kontrola: panel 3000 j. w obszarze usługi MUSI dać błąd", `ocena: ${olbrzym}`);
}

/* ══ §P i §G: PANELE W SWOICH OBSZARACH ═════════════════════════════════ */
console.log("");
for (const e of EKRANY) {
  const { W, H } = wirtualne(e);
  for (const p of panele(W, H)) {
    const rail = computeRailLayout(W, H, FRAME.rail.maxTabs, p.dense);
    const skala = panelFitScale(p.w, p.h, p.obszar);
    const dowod = `${p.w}×${p.h} j. w ${Math.round(p.obszar.w)}×${Math.round(p.obszar.h)}, skala ${skala.toFixed(2)}`;
    const o = ocenSkale(skala);
    const opis = `„${e.nazwa}": ${p.nazwa} mieści się${p.rama ? " obok szyny" : ""}`;
    if (o === "ok") ok("P1", opis, dowod);
    // Okno pionowe zmniejsza całą rodzinę paneli — znany stan, nie błąd.
    else if (o === "uwaga") (e.telefon ? zle : uwaga)("P1", `${opis} (zmniejszany)`, dowod);
    else zle("P1", `${opis} — poniżej czytelności`, dowod);

    if (p.rama) {
      // Prawa krawędź panelu po skali kontra lewa krawędź kafli szyny.
      const prawa = p.obszar.x + p.obszar.w / 2 + (p.w * skala) / 2;
      const przerwa = rail.x - prawa;
      sprawdz(przerwa >= 16, "G1", `„${e.nazwa}": ${p.nazwa} trzyma ≥ 16 j. od szyny`, `${Math.round(przerwa)} j.`);
    }
  }
}

/* ══ §S: SZYNA ══════════════════════════════════════════════════════════ */
console.log("");
for (const e of EKRANY) {
  const { W, H } = wirtualne(e);
  for (const dense of [false, true]) for (let n = 1; n <= FRAME.rail.maxTabs; n++) {
    const L = computeRailLayout(W, H, n, dense);
    const id = `„${e.nazwa}", ${n} zak.${dense ? ", same ikony" : ""}`;
    if (L.overflow) { zle("S1", `${id}: zakładki nie wchodzą na wyjście`, L.overflow); continue; }
    if (n === FRAME.rail.maxTabs) {
      ok("S1", `${id}: zakładki nie wchodzą na wyjście`, `wyjście od ${Math.round(L.exit.y)} j.`);
      const kafle = [...L.tabs, L.exit];
      const najmniejszy = Math.min(...kafle.map((r) => Math.min(r.w, r.h)));
      sprawdz(najmniejszy >= HUD_LAYOUT.minTouch, "S2", `${id}: każdy kafel ≥ próg dotyku`, `${najmniejszy} j. ≥ ${HUD_LAYOUT.minTouch}`);
      const ost = L.tabs[L.tabs.length - 1];
      const przerwa = L.exit.y - (ost.y + ost.h);
      sprawdz(przerwa >= 16, "S3", `${id}: przerwa nad wyjściem ≥ 16 j.`, `${Math.round(przerwa)} j.`);
      sprawdz(L.x >= 0 && L.x + L.w <= W && L.exit.y + L.exit.h <= H, "S4", `${id}: szyna w ekranie`, `${Math.round(L.x)}..${Math.round(L.x + L.w)} × ..${Math.round(L.exit.y + L.exit.h)} w ${Math.round(W)}×${Math.round(H)}`);
      const nachodzi = !L.compact && L.identity.y + L.identity.h > L.tabs[0].y;
      sprawdz(!nachodzi, "S5", `${id}: tożsamość nie wchodzi na pierwszą zakładkę`, `${Math.round(L.identity.y + L.identity.h)} ≤ ${Math.round(L.tabs[0].y)}`);
      // Telefon MUSI mieć szynę z podpisami — same ikony to wyjście awaryjne okna.
      if (e.telefon && !dense) sprawdz(!L.compact, "S6", `${id}: telefon ma szynę z podpisami`, L.compact ? "same ikony" : `${L.w} j.`);
      // ⭐ S7: szyna gęsta (Handel) stawia kafle na TYCH SAMYCH wysokościach co
      //   szyna z podpisami — przejście Handel ↔ inna usługa nie może
      //   przestawiać zakładek pod kciukiem (złapane na renderze 2026-10-13).
      if (e.telefon && !dense) {
        const G = computeRailLayout(W, H, n, true);
        const roznica = Math.max(Math.abs(G.exit.y - L.exit.y), ...G.tabs.map((t, i) => Math.abs(t.y - L.tabs[i].y)));
        sprawdz(roznica < 0.5, "S7", `${id}: same ikony = te same wysokości kafli`, `różnica ${Math.round(roznica)} j.`);
      }
    }
  }
}

/* ══ §K: KOLUMNA ROZMOWY ════════════════════════════════════════════════ */
console.log("");
for (const e of EKRANY) {
  const { W, H } = wirtualne(e);
  const k = talkColumn(W, H);
  // Pas wypowiedzi stoi na lewo od kolumny (`ConversationSheet.geom`).
  const pas = k.bgX - 4 - 16;
  const opis = `„${e.nazwa}": pas wypowiedzi obok kolumny rozmowy`;
  if (pas >= 560) ok("K1", opis, `${Math.round(pas)} j.`);
  else (e.telefon ? zle : uwaga)("K1", `${opis} (wąski)`, `${Math.round(pas)} j. < 560`);
}

/* ══ §F: LISTA + KARTA (etap F) ═════════════════════════════════════════ */
console.log("");
function sprawdzListe(L, panelW, panelH) {
  const bledyF = [];
  const w = (r) => r.x >= -panelW / 2 - 0.5 && r.y >= -panelH / 2 - 0.5 && r.x + r.w <= panelW / 2 + 0.5 && r.y + r.h <= panelH / 2 + 0.5;
  for (const [nazwa, r] of [["lista", L.list], ["karta", L.detail], ["przycisk", L.action], ["ciało", L.body]]) if (!w(r)) bledyF.push(`${nazwa} poza panelem`);
  if (L.list.w < LIST_DETAIL.listMin - 0.5) bledyF.push(`lista ${Math.round(L.list.w)} < ${LIST_DETAIL.listMin}`);
  if (L.detail.w < LIST_DETAIL.detailMin - 0.5) bledyF.push(`karta ${Math.round(L.detail.w)} < ${LIST_DETAIL.detailMin}`);
  if (LIST_DETAIL.rowH < HUD_LAYOUT.minTouch || L.action.h < HUD_LAYOUT.minTouch - 4) bledyF.push("wiersz/przycisk pod progiem dotyku");
  if (L.action.x < L.detail.x || L.action.x + L.action.w > L.detail.x + L.detail.w + 0.5) bledyF.push("przycisk poza kartą");
  if (L.body.h < 200) bledyF.push(`ciało karty ${Math.round(L.body.h)} < 200 j.`);
  if (L.list.x + L.list.w > L.detail.x) bledyF.push("lista wchodzi na kartę");
  return bledyF;
}
{
  // KONTROLA: panel 500×300 nie mieści karty ani ciała — MUSI dać błąd.
  const k = sprawdzListe(computeListDetailLayout(500, 300), 500, 300);
  sprawdz(k.length > 0, "F0", "kontrola: panel 500×300 MUSI przepaść na liście + karcie", k.join("; ") || "przepuszczone — asercja ślepa");
}
for (const e of EKRANY) {
  const { W, H } = wirtualne(e);
  const ob = serviceArea(W, H, false);
  const { w, h } = subviewSize(ob.w, ob.h);
  const L = computeListDetailLayout(w, h);
  const b = sprawdzListe(L, w, h);
  sprawdz(b.length === 0, "F1", `„${e.nazwa}": lista + karta w panelu ${w}×${h}`, b.join("; ") || `lista ${Math.round(L.list.w)} · karta ${Math.round(L.detail.w)} · ${L.rowsVisible} wierszy · ciało ${Math.round(L.body.h)} j.`);
}

/* ══ §T: ROLE TEKSTU ════════════════════════════════════════════════════ */
console.log("");
const podlogi = [
  ["title", 22, 24, "tytuły 22–24 j."],
  ["name", 20, 23, "nazwy 20–23 j."],
  ["prose", 18, 99, "proza ≥ 18 j."],
  ["body", 18, 99, "tekst główny ≥ 18 j."],
  ["small", 15, 99, "drugi plan ≥ 15 j."],
];
for (const [rola, lo, hi, opis] of podlogi) {
  const v = TYPE[rola];
  sprawdz(typeof v === "number" && v >= lo && v <= hi, "T1", `rola „${rola}": ${opis}`, `${v} j.`);
}

/* ══ §L: PLIKI PRZENIESIONE NA ROLE — bez literałów rozmiaru ════════════ */
console.log("");
// ⚠ Lista rośnie z etapami D–F (ekwipunek, sklep, zadania). Plik dopisany tu
//   NIE może wrócić do `fontSize: "12px"` — rozmiar idzie z `fontPx(rola)`.
const NA_ROLACH = [
  "src/ui/Rail.ts",
  "src/ui/ConversationSheet.ts",
  // Etap E (2026-10-13): sklep, karta przedmiotu (wspólna z panelem gracza)
  // i okno potwierdzenia.
  "src/ui/ShopPanel.ts",
  "src/ui/ShopDetails.ts",
  "src/ui/ConfirmDialog.ts",
  // Etap F (2026-10-13): widoki „lista + karta" rozmowy.
  "src/ui/ListDetail.ts",
  "src/ui/QuestPanel.ts",
  "src/ui/TrainerPanel.ts",
  "src/ui/MasteryPanel.ts",
  "src/ui/PlayerPanel.ts",
];
// Każda wartość `fontSize`, która NIE jest `fontPx(rola)` — także szablon
// z lokalną stałą (`${OPTION_PX}px`), bo to ten sam literał przeniesiony
// o linijkę wyżej.
const literal = /fontSize:\s*(?!fontPx\()\S/;
for (const zKontrola of ['fontSize: "12px"', "fontSize: `${OPTION_PX}px`"]) {
  sprawdz(literal.test(zKontrola), "L0", "kontrola: wzorzec łapie literał rozmiaru", zKontrola);
}
sprawdz(!literal.test('fontSize: fontPx("body")'), "L0", "kontrola: wzorzec przepuszcza rolę", 'fontSize: fontPx("body")');
for (const plik of NA_ROLACH) {
  const tekst = await readFile(join(KORZEN, plik), "utf8");
  const trafienia = tekst.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => literal.test(l) && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
  sprawdz(trafienia.length === 0, "L1", `${plik}: rozmiary tekstu z ról (fontPx)`, trafienia.length ? trafienia.map(([n]) => `w. ${n}`).join(", ") : "0 literałów");
}

console.log("");
console.log(`${bledy ? "⛔" : "✅"} BŁĘDÓW: ${bledy} · OSTRZEŻEŃ: ${ostrzezenia}`);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(bledy ? 1 : 0);

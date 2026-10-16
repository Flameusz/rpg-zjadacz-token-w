/**
 * Przymiar układu PANELU HANDLU (`src/ui/ShopLayout.ts` + `ShopPanel`).
 *
 * ⚠ **Uruchamia PRAWDZIWY `ShopLayout.ts` i PRAWDZIWE półki z `GameConfig`,
 * nie kopię wzoru.** Ta sama reguła i ten sam powód, co w
 * `tools/ekwipunek_uklad.mjs` i `tools/hud_uklad.mjs`: drugi rachunek tej samej
 * geometrii rozjeżdża się z grą po cichu, a diff tego nie pokazuje.
 *
 * ⚠⚠ **PRZEPISANY 2026-10-13 (etap E) razem z panelem.** Sklep to od tej daty
 * KUPIEC | GRACZ | KARTA: dwie RÓWNE siatki kafli (przedmiot wygląda wszędzie
 * tak samo — decyzja autora po zrzucie A/B), każda z własnymi zakładkami
 * (Kup | Odkup · Plecak | Na sobie), i karta po prawej. Sylwetka to widok
 * „Na sobie" kolumny gracza — §Z pilnuje, że każdy adres `EQUIP_SLOTS` leży
 * pod dokładnie jednym jej kaflem.
 * Każda asercja przechodzi **w każdej realnej ramce**: telefon, mały telefon,
 * laptop, monitor i okno pionowe.
 *
 * ⚠ **Co ten plik POTRAFI:** obalić układ arytmetycznie — wyjście poza ramkę,
 * nachodzące kolumny, wiersz poniżej progu dotyku, okno z przeciętym wierszem,
 * półkę nieosiągalną przewijaniem, pasek pokazany bez potrzeby, kartę bez
 * miejsca na treść. **Czego NIE potrafi:** powiedzieć, czy to wygląda dobrze —
 * do tego jest render (`node tools/phone_render.mjs tools/phone_render_shop.json`).
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/sklep_uklad.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-shop.ts");
const wejscie = join(KORZEN, "node_modules", ".shop-layout-entry.ts");
const tmp = join(KORZEN, "node_modules", ".shop-layout.mjs");

/** Krótsza oś, przy której skala UI wynosi 1 (`UI_SCALE.designShortAxis`). */
const DESIGN_SHORT = 580;

/** Realne ramki — panel liczy rozmiar z obszaru usługi, więc każda daje INNY układ. */
const EKRANY = [
  { nazwa: "S21 FE poziomo", cssW: 891, cssH: 411, dpr: 2.625 },
  { nazwa: "telefon 16:9 poziomo", cssW: 740, cssH: 360, dpr: 3 },
  { nazwa: "mały telefon 640×300", cssW: 640, cssH: 300, dpr: 3 },
  { nazwa: "laptop 1366×768", cssW: 1366, cssH: 768, dpr: 1 },
  { nazwa: "monitor 1920×1080", cssW: 1920, cssH: 1080, dpr: 1 },
  // ⚠ Okno przeglądarki w pionie — jedyna ramka, w której panel jest naprawdę
  //   zmniejszany. Telefon ma orientację zablokowaną w manifeście.
  { nazwa: "okno pionowe 520×900", cssW: 520, cssH: 900, dpr: 1 },
];
/** Ramki TELEFONU — tu karta MA być szeroka, a wiersze w normie dotyku. */
const TELEFONY = new Set(["S21 FE poziomo", "telefon 16:9 poziomo", "mały telefon 640×300"]);

await writeFile(
  stubPhaser,
  // ⚠ `EventEmitter` jest tu NIEZBĘDNY: `Npcs` ciągnie `EventBus`, a ten
  //   tworzy emiter w chwili importu.
  `class E {
     on() { return this; } once() { return this; } off() { return this; }
     emit() { return false; } removeAllListeners() { return this; }
   }
   const Phaser = {
     Math: { Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) },
     Events: { EventEmitter: E },
     Input: { Events: {} },
     Scenes: { Events: {} },
   };
   export default Phaser;\n`,
);

await writeFile(
  wejscie,
  `export * from "../src/ui/ShopLayout";
   export { serviceArea, panelFitScale } from "../src/ui/FrameLayout";
   export { iconFitScale } from "../src/ui/IconFit";
   export { itemFootprint } from "../src/core/Items";
   export { NPCS } from "../src/core/Npcs";
   export { ITEMS, INVENTORY, HUD_LAYOUT, SHOP } from "../src/config/GameConfig";
   export { EQUIP_SLOTS, layeredSlot } from "../src/core/Equipment";
   export { ARMOR_LAYERS } from "../src/core/ArmorLayers";\n`,
);

await build({
  entryPoints: [wejscie],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [
    {
      name: "stuby",
      setup(b) {
        b.onResolve({ filter: /^phaser$/ }, () => ({ path: stubPhaser }));
      },
    },
  ],
});

const M = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});
await unlink(wejscie).catch(() => {});
await unlink(stubPhaser).catch(() => {});

const {
  SHOP_METRICS,
  computeShopLayout,
  tabRects,
  shopPanelW,
  shopPanelH,
  scrollWindow,
  fieldRect,
  packShelf,
  shelfSpan,
  iconFitScale,
  itemFootprint,
  NPCS,
  ITEMS,
  INVENTORY,
  HUD_LAYOUT,
  SHOP,
  serviceArea,
  panelFitScale,
  EQUIP_SLOTS,
  layeredSlot,
  ARMOR_LAYERS,
} = M;

let bledy = 0;
let ostrzezenia = 0;
const ok = (id, opis, dowod) => console.log(`✅ ${id.padEnd(4)} ${opis.padEnd(64)} ${dowod}`);
const zle = (id, opis, dowod) => {
  bledy++;
  console.log(`⛔ ${id.padEnd(4)} ${opis.padEnd(64)} ${dowod}`);
};
const uwaga = (id, opis, dowod) => {
  ostrzezenia++;
  console.log(`⚠  ${id.padEnd(4)} ${opis.padEnd(64)} ${dowod}`);
};
const sprawdz = (warunek, id, opis, dowod) => (warunek ? ok : zle)(id, opis, dowod);

/** Wymiary WIRTUALNE okna — `theme.ts`: factor = dpr × clamp(krótsza oś / 580, 0.5, 1). */
function wirtualne(e) {
  const fit = Math.min(Math.max(Math.min(e.cssW, e.cssH) / DESIGN_SHORT, 0.5), 1);
  return { uiW: e.cssW / fit, uiH: e.cssH / fit };
}

/** Kupcy — NPC z czymkolwiek, co ma cenę kupna (to, co robi `ShopPanel.show()`). */
const kupcy = Object.entries(NPCS)
  .map(([klucz, npc]) => ({
    klucz,
    nazwa: npc.name,
    towar: (npc.stock ?? []).filter((id) => "buyPrice" in ITEMS[id]),
    naprawia: (npc.stock ?? []).some((id) => ITEMS[id].type === "weapon"),
  }))
  .filter((k) => k.towar.length > 0);

const touch = HUD_LAYOUT.minTouch;
console.log("=== przymiar układu panelu handlu (lista + karta) ===\n");
console.log(`kupców z towarem      ${kupcy.length} (naprawia: ${kupcy.filter((k) => k.naprawia).length})`);
console.log(`bazowa pojemność      ${INVENTORY.slots} slotów`);
console.log(`norma dotyku          ${touch} j.\n`);

/* ══ §0: KONTROLA — przymiar umie zaświecić na czerwono ═════════════════ */
{
  // Panel za mały na kartę: `overflow` MUSI to zgłosić, inaczej `R1` niżej
  // byłoby zielone z definicji (reguła: asercja, która nie umie zaświecić,
  // jest dekoracją).
  const zly = computeShopLayout(560, 300);
  sprawdz(zly.overflow !== null, "§0", "kontrola: panel 560×300 ZGŁASZA, że się nie mieści", zly.overflow ?? "milczy!");
  console.log("");
}

/* ══ §R: KAŻDA RAMKA EKRANU ═════════════════════════════════════════════ */

const ukladyRamek = [];
for (const e of EKRANY) {
  const { uiW, uiH } = wirtualne(e);
  // ⭐ Handel stoi obok szyny SAMYCH IKON (`dense`, autor 2026-10-13) —
  //   dokładnie jak w `ShopPanel`.
  const obszar = serviceArea(uiW, uiH, true);
  const panelW = shopPanelW(obszar.w);
  const panelH = shopPanelH(obszar.h);
  const L = computeShopLayout(panelW, panelH);
  ukladyRamek.push({ e, uiW, uiH, L });

  sprawdz(
    L.overflow === null,
    "R1",
    `„${e.nazwa}": układ mieści się w panelu ${panelW}×${panelH} j.`,
    L.overflow ?? `kolumny ${L.merchant.width} + ${L.player.width} j. | karta ${Math.round(L.details.width)} j.`,
  );
  const skala = panelFitScale(panelW, panelH, obszar);
  const dowod = `wirtualnie ${Math.round(uiW)}×${Math.round(uiH)} j., skala ${skala.toFixed(2)}`;
  if (skala >= 1) ok("R2", `„${e.nazwa}" mieści panel bez zmniejszania`, dowod);
  else if (skala >= 0.5) uwaga("R2", `„${e.nazwa}" zmniejsza panel (stan całej rodziny paneli)`, dowod);
  else zle("R2", `„${e.nazwa}" zmniejsza panel poniżej czytelności`, dowod);

  // ⭐⭐ To była wada czterech kolumn (kafel 57–62 j.): na telefonie zakładka
  //   trybu i kafel siatki MUSZĄ mieć normę dotyku.
  const tab = tabRects(L.merchant.tabs, 2)[0];
  const cell = L.merchant.grid.cell;
  const dowodR3 = `zakładka ${Math.round(tab.h)} · kafel ${cell} j.`;
  if (TELEFONY.has(e.nazwa)) {
    sprawdz(tab.h >= touch && cell >= touch, "R3", `„${e.nazwa}": zakładka i kafel ≥ ${touch} j.`, dowodR3);
  } else if (Math.min(tab.h, cell) < touch) uwaga("R3", `„${e.nazwa}": coś poniżej progu dotyku`, dowodR3);
  else ok("R3", `„${e.nazwa}": zakładka i kafel ≥ ${touch} j.`, dowodR3);
}

/** Układ odniesienia dla sekcji liczonych raz: telefon docelowy (S21 FE). */
const REF = ukladyRamek[0].L;

/* ══ §K: KOLUMNY WZGLĘDEM SIEBIE I PANELU ══════════════════════════════ */

console.log("");
for (const { e, L } of ukladyRamek) {
  const lewa = -L.panelW / 2 + SHOP_METRICS.pad;
  const prawa = L.panelW / 2 - SHOP_METRICS.pad;
  const kol = [
    { n: "KUPIEC", l: L.merchant.left, r: L.merchant.left + L.merchant.width },
    { n: "GRACZ", l: L.player.left, r: L.player.left + L.player.width },
    { n: "KARTA", l: L.details.left, r: L.details.left + L.details.width },
  ];
  let kolizja = null;
  for (let i = 1; i < kol.length; i++) if (kol[i].l < kol[i - 1].r - 0.5) kolizja = `${kol[i - 1].n} × ${kol[i].n}`;
  sprawdz(
    !kolizja && kol[0].l >= lewa - 0.5 && kol[2].r <= prawa + 0.5,
    "K1",
    `„${e.nazwa}": trzy kolumny w panelu, bez nakładek`,
    kolizja ?? kol.map((k) => `${Math.round(k.l)}..${Math.round(k.r)}`).join(" | "),
  );
  // Siatka i jej pasek przewijania w SWOJEJ kolumnie.
  let poza = null;
  for (const [n, G] of [["KUPIEC", L.merchant], ["GRACZ", L.player]]) {
    if (G.centerX - G.gridW / 2 < G.left - 0.5 || G.scrollX + SHOP_METRICS.scrollW / 2 > G.left + G.width + 0.5) poza = n;
  }
  sprawdz(!poza, "K2", `„${e.nazwa}": siatki i paski przewijania w swoich kolumnach`, poza ?? `pasek ${Math.round(L.merchant.scrollX)} / ${Math.round(L.player.scrollX)}`);
  // ⭐ Handel ma dwie strony — RÓWNE siatki, kolumny modelu (`INVENTORY.cols`).
  sprawdz(
    L.merchant.grid.cell === L.player.grid.cell && L.merchant.grid.cols === INVENTORY.cols && L.player.grid.cols === INVENTORY.cols,
    "K3",
    `„${e.nazwa}": kupiec i gracz mają tę samą siatkę (${INVENTORY.cols} kol.)`,
    `${INVENTORY.cols} × ${L.merchant.grid.cell} j. po obu stronach`,
  );
}

/* ══ §H: NAGŁÓWEK — zakładki, Cofnij, złoto ═════════════════════════════ */

console.log("");
for (const { e, L } of ukladyRamek) {
  for (const [n, G] of [["kupca", L.merchant], ["gracza", L.player]]) {
    const t = tabRects(G.tabs, 2);
    const ok1 = t.every((r) => r.x >= G.tabs.x - 0.5 && r.x + r.w <= G.tabs.x + G.tabs.w + 0.5) && t[1].x >= t[0].x + t[0].w - 0.5;
    // „Na sobie" przy kroju 18 j. pogrubionym ≈ 80 j. + licznik.
    const opis = `„${e.nazwa}": 2 zakładki ${n} w pasie, każda ≥ 96 j.`;
    if (!ok1) zle("H1", opis, "zakładki poza pasem albo nachodzą");
    else if (t[0].w >= 96) ok("H1", opis, `${Math.round(t[0].w)} j.`);
    else if (TELEFONY.has(e.nazwa)) zle("H1", opis, `${Math.round(t[0].w)} j.`);
    else uwaga("H1", `„${e.nazwa}": zakładki ${n} węższe niż 96 j.`, `${Math.round(t[0].w)} j.`);
  }
  sprawdz(
    L.undo.x >= L.player.left + L.player.width - 0.5 && L.undo.x + L.undo.w <= L.goldRight - 150 && L.undo.w >= 90,
    "H2",
    `„${e.nazwa}": Cofnij nad kartą, przed złotem, ≥ 90 j.`,
    `cofnij ${Math.round(L.undo.x)}..${Math.round(L.undo.x + L.undo.w)} (${Math.round(L.undo.w)} j.), złoto do ${Math.round(L.goldRight)}`,
  );
  sprawdz(
    L.infoX + L.btnHit / 2 <= L.panelW / 2 + 0.5 && L.headerY - L.btnHit / 2 >= -L.panelH / 2 - 0.5,
    "H3",
    `„${e.nazwa}": pole trafienia ⓘ (${L.btnHit} j.) w panelu`,
    `prawa ${Math.round(L.infoX + L.btnHit / 2)} ≤ ${Math.round(L.panelW / 2)}`,
  );
}

/* ══ §W: OKNA PRZEWIJANIA ══════════════════════════════════════════════ */

console.log("");
for (const { e, L } of ukladyRamek) {
  const g = L.merchant.grid;
  const n = (L.merchant.windowH + g.gap) / (g.rowH + g.gap);
  sprawdz(Math.abs(n - Math.round(n)) < 0.001, "W1", `„${e.nazwa}": okno siatki to CAŁKOWITA liczba wierszy`, `${L.merchant.windowH} j. = ${Math.round(n)} wierszy`);
  const dol = L.contentTop + L.contentH;
  sprawdz(L.merchant.windowTop + L.merchant.windowH <= dol + 0.5, "W2", `„${e.nazwa}": okno kończy się nad dołem treści`, `${Math.round(L.merchant.windowTop + L.merchant.windowH)} ≤ ${Math.round(dol)}`);
  sprawdz(
    [L.merchant, L.player].every((G) => G.strip.y + G.strip.h <= G.windowTop + 0.5 && G.strip.y >= L.contentTop - 0.5),
    "W3",
    `„${e.nazwa}": paski kategorii nad oknami`,
    `${Math.round(L.merchant.strip.y)}..${Math.round(L.merchant.strip.y + L.merchant.strip.h)} ≤ ${Math.round(L.merchant.windowTop)}`,
  );
  // ⚠⚠ Zamek na regresję: bazowy plecak NIE dostaje paska przewijania.
  const okno = scrollWindow(L.player.windowTop, L.player.windowH, g.rowH, g.gap, Math.ceil(INVENTORY.slots / INVENTORY.cols));
  sprawdz(okno.maxScroll === 0, "W4", `„${e.nazwa}": bazowy plecak (${INVENTORY.slots}) mieści się BEZ paska`, `widać ${okno.visibleRows} wierszy po ${g.cell} j.`);
}

/* ══ §V: KAŻDA PÓŁKA W GRZE ════════════════════════════════════════════ */

console.log("");
for (const k of kupcy) {
  // ⚠⚠ WIERSZE kafli, nie liczba pozycji: towar `1×2` zajmuje dwa (`packShelf`).
  const g = REF.merchant.grid;
  const pack = packShelf(g.cols, k.towar.map((id) => itemFootprint(id)));
  const okno = scrollWindow(REF.merchant.windowTop, REF.merchant.windowH, g.rowH, g.gap, pack.rows);
  const etykieta = `${k.nazwa} (${k.towar.length} poz., ${pack.rows} wierszy)`;
  // Ostatni TOWAR, nie ostatni wiersz: tarcza `1×2` sięga wiersz niżej niż kotwica.
  let najnizszy = -Infinity;
  for (const m of pack.places) {
    const gora = REF.merchant.windowTop + m.row * (g.rowH + g.gap);
    najnizszy = Math.max(najnizszy, gora + shelfSpan(g, m.w, m.h).height);
  }
  sprawdz(
    najnizszy - okno.maxScroll <= okno.bottom + 0.5,
    "V1",
    `półka „${etykieta}": ostatni towar CAŁY w oknie po przewinięciu`,
    `dół ${Math.round(najnizszy - okno.maxScroll)} ≤ ${Math.round(okno.bottom)}`,
  );
  sprawdz(
    (okno.maxScroll > 0) === okno.contentH > okno.height,
    "V2",
    `„${k.nazwa}": pasek pokazuje się dokładnie wtedy, gdy potrzebny`,
    okno.contentH > okno.height ? "dłuższa niż okno → pasek" : "mieści się → BEZ paska",
  );
}
// Odkup ma sufit — lista nie rośnie bez końca.
sprawdz(SHOP.buybackSize >= 4 && SHOP.buybackSize <= 40, "V3", "Odkup pamięta rozsądną liczbę pozycji", `${SHOP.buybackSize}`);
// ⚠ Narzut odkupu: odkup NIGDY tańszy od sprzedaży (inaczej kran złota).
sprawdz(SHOP.buybackMarkup >= 0, "V4", "narzut odkupu nieujemny (odkup ≥ sprzedaż)", `${Math.round(SHOP.buybackMarkup * 100)}%`);

/* ══ §Z: SYLWETKA „NA SOBIE" ═══════════════════════════════════════════ */

console.log("");
{
  /** Adresy, które reprezentuje kafel sylwetki (obszar = trzy warstwy, ręka = para W RĘKACH). */
  const adresy = (c) => (c.area ? ARMOR_LAYERS.map((w) => layeredSlot(c.area, w)) : c.hand ? [c.hand === "main" ? "weapon" : "offhand"] : [c.slot]);
  const wszystkie = REF.doll.flatMap((d) => adresy(d.cell));
  const brak = EQUIP_SLOTS.filter((a) => !wszystkie.includes(a));
  /* ⭐⭐ Adres bez kafla jest w sklepie NIEOSIĄGALNY: nie da się go obejrzeć,
   * naprawić ani sprzedać z widoku „Na sobie", a nic w grze by tego nie
   * zgłosiło (ta sama asercja broniła sylwetki sklepu do 2026-10-13). */
  sprawdz(brak.length === 0, "Z1", "sylwetka pokrywa WSZYSTKIE adresy `EQUIP_SLOTS`", brak.length ? `brak: [${brak}]` : `${wszystkie.length} adresów`);
  sprawdz(new Set(wszystkie).size === wszystkie.length, "Z2", "żaden adres nie leży pod dwoma kaflami", `${new Set(wszystkie).size} unikalnych`);
  const rece = REF.doll.filter((d) => d.cell.hand);
  sprawdz(rece.length === 2 && rece.every((d) => d.height > d.size * 1.9), "Z3", "kafle rąk są wysokie na DWA pola (gabaryt 1×2)", rece.map((d) => `${d.size}×${Math.round(d.height)}`).join(", "));
  for (const { e, L } of ukladyRamek) {
    const G = L.player;
    let zle1 = null;
    for (const d of L.doll) {
      if (d.x - d.size / 2 < G.centerX - G.gridW / 2 - 0.5 || d.x + d.size / 2 > G.centerX + G.gridW / 2 + 0.5) zle1 = `${d.cell.label} w poziomie`;
      if (d.y - d.height / 2 < G.windowTop - 0.5 || d.y + d.height / 2 > G.windowTop + G.windowH + 0.5) zle1 = `${d.cell.label} w pionie`;
    }
    for (let i = 0; i < L.doll.length && !zle1; i++) {
      for (let j = i + 1; j < L.doll.length; j++) {
        const a = L.doll[i];
        const b = L.doll[j];
        if (Math.abs(a.x - b.x) < (a.size + b.size) / 2 - 0.5 && Math.abs(a.y - b.y) < (a.height + b.height) / 2 - 0.5) {
          zle1 = `${a.cell.label} × ${b.cell.label}`;
          break;
        }
      }
    }
    sprawdz(!zle1, "Z4", `„${e.nazwa}": sylwetka w oknie gracza, bez nakładek`, zle1 ?? `${L.doll.length} kafli po ${L.doll[0].size} j.`);
    const kafel = L.doll[0].size;
    if (kafel >= touch) ok("Z5", `„${e.nazwa}": kafel sylwetki ≥ ${touch} j.`, `${kafel} j.`);
    else if (TELEFONY.has(e.nazwa)) zle("Z5", `„${e.nazwa}": kafel sylwetki poniżej progu dotyku`, `${kafel} j.`);
    else uwaga("Z5", `„${e.nazwa}": kafel sylwetki poniżej progu dotyku`, `${kafel} j.`);
  }
}

/* ══ §D: KARTA ═════════════════════════════════════════════════════════ */

console.log("");
for (const { e, L } of ukladyRamek) {
  const D = L.details;
  sprawdz(D.body.h >= 80, "D1", `„${e.nazwa}": ciało karty ma miejsce na treść`, `${Math.round(D.body.h)} j.`);
  sprawdz(
    D.action.y + D.action.h <= L.panelH / 2 - SHOP_METRICS.pad + 0.5,
    "D2",
    `„${e.nazwa}": pas akcji mieści się w panelu`,
    `dół ${Math.round(D.action.y + D.action.h)} ≤ ${Math.round(L.panelH / 2 - SHOP_METRICS.pad)}`,
  );
  sprawdz(D.title.w >= 120, "D3", `„${e.nazwa}": nazwa ma miejsce obok podglądu`, `${Math.round(D.title.w)} j.`);
  /* ⭐⭐ **PODGLĄD MÓWI PRAWDĘ O GABARYCIE** — rzecz `1×1` i `1×2` w TEJ SAMEJ
   * skali, ramka `1×2` wyraźnie wyższa (inaczej hełm wychodził większy od tarczy). */
  const kwadrat = Math.min(D.preview.h, D.preview.w);
  const skala1 = iconFitScale(32, 32, D.preview.w - 12, kwadrat - 12, 4);
  const skala2 = iconFitScale(32, 64, D.preview.w - 12, D.preview.h - 12, 4);
  sprawdz(
    skala1 === skala2,
    "D4",
    `„${e.nazwa}": podgląd daje TĘ SAMĄ skalę rzeczy 1×1 i 1×2`,
    `1×1 ×${skala1} (${D.preview.w}×${Math.round(kwadrat)}), 1×2 ×${skala2} (${D.preview.w}×${Math.round(D.preview.h)})`,
  );
  sprawdz(D.preview.h >= kwadrat * 1.5, "D5", `„${e.nazwa}": ramka rzeczy 1×2 wyraźnie wyższa od kwadratu`, `${Math.round(D.preview.h)} ≥ 1,5 × ${Math.round(kwadrat)}`);
  // ⭐ Ciało OBOK podglądu, gdy jest miejsce — inaczej podgląd `1×2`
  //   (140 j.) spycha ciało, a porównanie ląduje w przewijaniu.
  if (e.nazwa === "S21 FE poziomo") {
    sprawdz(D.beside, "D6", `„${e.nazwa}": ciało karty obok podglądu`, `pas obok podglądu ${Math.round(D.title.w)} j.`);
  }
}

/* ══ §I: IKONA W WIERSZU I W POLU ══════════════════════════════════════ */

console.log("");
{
  /* ⭐⭐ **Powód gabarytu na półce.** Ikona 32×64 (tarcza migdałowa, pawęż,
   * broń drzewcowa) mieści się w polu `1×2` kafli; `I2` jest parą NEGATYWNĄ —
   * dowód, że reguła skali potrafi zejść poniżej 1:1. Kwota leży NA ikonie
   * (obrys), więc skala liczy się z całego pola — jak w `ShopPanel.buildTile`. */
  const dwa = shelfSpan(REF.merchant.grid, 1, 2);
  const jeden = shelfSpan(REF.merchant.grid, 1, 1);
  sprawdz(
    iconFitScale(32, 64, dwa.width - 4, dwa.height - 4, 2) >= 1,
    "I1",
    "ikona 32×64 mieści się w polu 1×2 co najmniej 1:1",
    `${dwa.width}×${dwa.height} j.`,
  );
  sprawdz(iconFitScale(32, 64, 40, 40, 1) < 1, "I2", "reguła skali potrafi zejść poniżej 1:1 (kontrola)", `pole 40×40 → ${iconFitScale(32, 64, 40, 40, 1)}`);
  // ⭐ Ta sama skala rzeczy 1×1 i 1×2 na kaflach — miecz dwa razy wyższy od sztyletu.
  const s1 = iconFitScale(32, 32, jeden.width - 4, jeden.height - 4, 2);
  const s2 = iconFitScale(32, 64, dwa.width - 4, dwa.height - 4, 2);
  sprawdz(s1 === s2, "I3", "rzecz 1×1 i 1×2 ma na kaflu TĘ SAMĄ skalę", `1×1 ×${s1}, 1×2 ×${s2}`);
  // ⭐ …i TĘ SAMĄ, co panel gracza (`EquipLayout.iconScale` = ×2 przy kaflu
  //   < 100 j.) — przedmiot wygląda tak samo wszędzie.
  sprawdz(s1 === 2, "I4", "kafel sklepu rysuje ikonę w ×2, jak panel gracza", `kafel ${REF.merchant.grid.cell} j. → ×${s1}`);
}

/* ══ §G: POLE PRZEDMIOTU W PLECAKU (gabaryt na ekranie) ════════════════ */

console.log("");
{
  const g = REF.merchant.grid;
  const jedno = fieldRect(g, 0, 0, 0, 0, 1, 1);
  const dwa = fieldRect(g, 0, 0, 0, 0, 1, 2);
  sprawdz(jedno.width === g.cell && jedno.height === g.cell, "G1", "pole `1×1` to dokładnie jeden kafel", `${jedno.width}×${jedno.height} j.`);
  sprawdz(
    dwa.height === 2 * g.cell + g.gap && dwa.width === g.cell,
    "G2",
    "pole `1×2` to dwa kafle Z ODSTĘPEM — jeden prostokąt, nie dwa",
    `${dwa.width}×${dwa.height} j. = 2×${g.cell} + ${g.gap}`,
  );
  const k1 = fieldRect(g, 0, 0, 0, 0, 1, 1).y;
  const k2 = fieldRect(g, 0, 0, 0, 1, 1, 1).y;
  sprawdz(Math.abs(dwa.y - (k1 + k2) / 2) < 0.001, "G3", "pole `1×2` jest wyśrodkowane na obu kaflach", `${dwa.y} = (${k1} + ${k2}) / 2`);
}

/* ══ §P: UKŁADANIE WIDOKU FILTROWANEGO (`packShelf`) ═══════════════════ */

console.log("");
{
  const cols = INVENTORY.cols;
  const tarcze = packShelf(cols, new Array(7).fill({ w: 1, h: 2 }));
  const zajete = new Set();
  let kolizja = false;
  let pozaSiatka = false;
  for (const m of tarcze.places) {
    if (m.col < 0 || m.col + m.w > cols) pozaSiatka = true;
    for (let dy = 0; dy < m.h; dy++) {
      for (let dx = 0; dx < m.w; dx++) {
        const pole = (m.row + dy) * cols + m.col + dx;
        if (zajete.has(pole)) kolizja = true;
        zajete.add(pole);
      }
    }
  }
  sprawdz(!kolizja, "P1", "ułożony widok nie nakłada rzeczy na rzecz", `${tarcze.places.length} pozycji, ${zajete.size} pól`);
  sprawdz(!pozaSiatka, "P2", "żadna rzecz nie wychodzi poza szerokość siatki", `${cols} kolumn`);
  sprawdz(tarcze.rows === Math.ceil(7 / cols) * 2, "P3", `siedem tarcz 1×2 na ${cols} kolumnach zajmuje ${Math.ceil(7 / cols) * 2} wiersze`, `wierszy: ${tarcze.rows}`);
  const mieszane = packShelf(cols, [{ w: 1, h: 2 }, { w: 1, h: 1 }]);
  sprawdz(
    mieszane.places[1].col === 1 && mieszane.places[1].row === 0,
    "P4",
    "drobiazg po tarczy 1×2 staje OBOK niej, nie pod nią",
    `tarcza (0,0), drobiazg (${mieszane.places[1].col},${mieszane.places[1].row})`,
  );
  // Gabaryt z MODELU: w katalogu są rzeczy `1×2` (inaczej §G/§P badałyby nic).
  const duze = Object.keys(ITEMS).filter((id) => itemFootprint(id).h === 2).length;
  sprawdz(duze > 0, "P5", "w katalogu SĄ rzeczy o gabarycie 1×2", `${duze}`);
}

console.log("");
console.log(`${bledy ? "⛔" : "✅"} BŁĘDÓW: ${bledy} · OSTRZEŻEŃ: ${ostrzezenia}`);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(bledy ? 1 : 0);

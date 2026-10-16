/**
 * Faza 0 przebudowy walki (`docs/systemy/combat.md`) — POMIAR GEOMETRII.
 *
 * Nie dotyka `src/`, nie zmienia ani jednej liczby w grze. Odpowiada na trzy
 * pytania, na które cały plan migracji czeka:
 *
 *   A. Jak DUŻE naprawdę są stworzenia? (alpha bbox każdej klatki każdego
 *      arkusza — widoczne piksele, nie wymiar klatki)
 *   B. O ile dzisiejszy `allowance` mija się z tym pomiarem?
 *   C. Jaką liczbę trzeba wpisać w Fazie 1B, żeby próg zachował dzisiejsze
 *      zachowanie po przejściu na prześwit między ciałami?
 *
 * ⚠ **Czyta PRAWDZIWY `GameConfig.ts` przez esbuild**, nie własną kopię liczb —
 * ta sama zasada i ten sam powód, co w `tools/hud_uklad.mjs`. Druga kopia
 * `bodyWidth`/`scale`/`frameHeight` rozjechałaby się z grą przy pierwszej
 * zmianie, a diff by tego nie pokazał.
 *
 * ⚠ **Geometria ciała odtworzona z ŹRÓDŁA Phasera, nie z intuicji.**
 * `Body.setSize` mnoży przez skalę (`Body.js:1501`), a `updateFromGameObject`
 * składa pozycję jako `transform.y + scaleY × (offset.y − displayOriginY)`
 * (`Body.js:1061`). Stąd wzór na przesunięcie środka ciała pod środek sprite'a:
 *
 *     Δ = scale × (frameH / 2 − bodyH / 2 − pad)
 *
 * To jest źródło „fantomowego dystansu pionowego" z §4.1 audytu. Wcześniejszy
 * szacunek „~12 px" był zgrubny — tutaj liczy się dokładnie, per gatunek.
 *
 * ⚠ **Pająki NIE MAJĄ arkusza.** `ASSETS.spider` / `ASSETS.venomSpider` to
 * generowane tekstury z zadeklarowanym `face: { w, h }` — dla nich rozmiar jest
 * podany wprost i nie ma czego mierzyć. Obsłużone jawnie, nie pominięte.
 *
 * ⚠ **`Character.png` NIE jest równą siatką** — ma `colStarts`/`rowStarts`.
 * Naiwne dzielenie 256×256 przez 31×60 daje inne klatki niż te, które rysuje
 * gra. Dokładnie po to ten plik czyta metadane arkusza zamiast je zakładać.
 *
 *   node tools/combat_geometry.mjs
 *   node tools/combat_geometry.mjs --zepsuj    (autotest asercji — MUSI paść)
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 */

import { build } from "esbuild";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const AKTYWA = join(KORZEN, "public", "assets");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-geom.ts");
const tmp = join(KORZEN, "node_modules", ".combat-geometry.mjs");

/** Autotest: celowo psuje jedną zmierzoną liczbę, żeby sprawdzić, czy raport
 *  potrafi zaświecić na czerwono. Reguła projektu: asercja, która nie potrafi,
 *  jest dekoracją. */
const ZEPSUJ = process.argv.includes("--zepsuj");

/** Próg alfy, powyżej którego piksel liczy się jako widoczny. Ten sam, którego
 *  używają skrypty ikon w `tools/` (`a[..., 3] > 10`). */
const ALFA = 10;

/* ══════════════════════════════════════════════════════════════════════════
   1. Minimalny dekoder PNG — inflate + unfilter, bez zależności
   ══════════════════════════════════════════════════════════════════════════
   Arkusze w projekcie to depth=8, color=6 (RGBA) albo color=3 (paleta+tRNS),
   zawsze non-interlaced — sprawdzone na wszystkich ośmiu plikach. Obsługiwane
   są dokładnie te przypadki; każdy inny ma polec głośno, a nie po cichu zwrócić
   złe piksele. */

function czytajPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("to nie jest PNG");
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const depth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  if (depth !== 8) throw new Error(`depth=${depth} nieobsługiwane (tylko 8)`);
  if (interlace !== 0) throw new Error("interlace nieobsługiwany");
  if (colorType !== 6 && colorType !== 3) {
    throw new Error(`colorType=${colorType} nieobsługiwany (tylko 6=RGBA, 3=paleta)`);
  }

  const idat = [];
  let plte = null;
  let trns = null;
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const typ = buf.toString("ascii", p + 4, p + 8);
    const dane = buf.subarray(p + 8, p + 8 + len);
    if (typ === "IDAT") idat.push(dane);
    else if (typ === "PLTE") plte = dane;
    else if (typ === "tRNS") trns = dane;
    else if (typ === "IEND") break;
    p += 12 + len;
  }

  const kanaly = colorType === 6 ? 4 : 1;
  const surowe = inflateSync(Buffer.concat(idat));
  const wiersz = w * kanaly;
  const px = Buffer.alloc(w * h * kanaly);

  // Odfiltrowanie (PNG filter types 0–4). Prosty, wierny przebieg po wierszach.
  let src = 0;
  for (let y = 0; y < h; y++) {
    const filtr = surowe[src++];
    const doc = y * wiersz;
    const gora = doc - wiersz;
    for (let x = 0; x < wiersz; x++) {
      const raw = surowe[src + x];
      const a = x >= kanaly ? px[doc + x - kanaly] : 0;
      const b = y > 0 ? px[gora + x] : 0;
      const c = x >= kanaly && y > 0 ? px[gora + x - kanaly] : 0;
      let v;
      switch (filtr) {
        case 0: v = raw; break;
        case 1: v = raw + a; break;
        case 2: v = raw + b; break;
        case 3: v = raw + ((a + b) >> 1); break;
        case 4: {
          const pp = a + b - c;
          const pa = Math.abs(pp - a);
          const pb = Math.abs(pp - b);
          const pc = Math.abs(pp - c);
          v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`nieznany filtr PNG ${filtr} w wierszu ${y}`);
      }
      px[doc + x] = v & 0xff;
    }
    src += wiersz;
  }

  // Kanał alfa — jedyne, co ten plik mierzy.
  const alfa = new Uint8Array(w * h);
  if (colorType === 6) {
    for (let i = 0; i < w * h; i++) alfa[i] = px[i * 4 + 3];
  } else {
    if (!plte) throw new Error("paleta bez PLTE");
    for (let i = 0; i < w * h; i++) {
      const idx = px[i];
      alfa[i] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
  return { w, h, alfa };
}

/** Prostokąt widocznych pikseli w wycinku (sx, sy, sw, sh), albo null. */
function bbox(img, sx, sy, sw, sh) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < sh; y++) {
    const gy = sy + y;
    if (gy < 0 || gy >= img.h) continue;
    for (let x = 0; x < sw; x++) {
      const gx = sx + x;
      if (gx < 0 || gx >= img.w) continue;
      if (img.alfa[gy * img.w + gx] <= ALFA) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const mediana = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/* ══════════════════════════════════════════════════════════════════════════
   2. Konfiguracja z prawdziwego GameConfig.ts
   ══════════════════════════════════════════════════════════════════════════ */

await writeFile(stubPhaser, "const Phaser = {};\nexport default Phaser;\n");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: tmp,
  logLevel: "silent",
  alias: { phaser: stubPhaser },
});
const CFG = await import(pathToFileURL(tmp).href);
const { ASSETS, PLAYER, RABBIT, WOLF, GREY_WOLF, BOAR, BEAR, SPIDER, VENOM_SPIDER, ITEMS } = CFG;

/**
 * Opis każdego stworzenia dla tego pomiaru.
 *
 * `kierunki` mapuje ROLĘ WIDOKU na klatki arkusza. Bok daje DŁUGOŚĆ ciała
 * (kapsuła), przód/tył daje GŁĘBOKOŚĆ (promień). Tam, gdzie arkusz nie niesie
 * tej informacji, pole jest puste i raport to mówi wprost — zamiast zgadywać.
 */
const STWORZENIA = [
  {
    id: "królik", cfg: RABBIT, arkusz: ASSETS.rabbit, pad: 2,
    // rabbit.png: rząd 0 to idle (kol. 0 = przód, kol. 1 = tył), rzędy 1–2 to
    // cykl chodu/biegu rysowany z BOKU (lewo powstaje przez setFlipX).
    kierunki: { przod: [[0, 0]], tyl: [[0, 1]], bok: "rzedy:1,2" },
  },
  {
    id: "dzik", cfg: BOAR, arkusz: ASSETS.boar, pad: 2,
    kierunki: { przod: [[0, 0]], tyl: [[0, 1]], bok: "rzedy:1,2" },
  },
  {
    id: "wilk", cfg: WOLF, arkusz: ASSETS.wolf, pad: 2,
    // 4 NIEZALEŻNIE narysowane kierunki × 6 stanów; rząd = stan × 4 + kierunek.
    kierunki: { dirRow: { przod: 0, tyl: 1, bokL: 2, bokP: 3 } },
  },
  {
    id: "Szary", cfg: GREY_WOLF, arkusz: ASSETS.greyWolf, pad: 2,
    kierunki: { dirRow: { przod: 0, tyl: 1, bokL: 2, bokP: 3 } },
  },
  {
    id: "niedźwiedź", cfg: BEAR, arkusz: ASSETS.bear, pad: 2,
    // Trzy osobne paski JEDNOKIERUNKOWE (profil, patrzą w lewo). Głębokości nie
    // da się z tego arkusza odczytać w ogóle — patrz asercja A4.
    kierunki: { paski: ["idle", "walk", "run"], bokTylko: true },
  },
  { id: "sieciarz", cfg: SPIDER, face: ASSETS.spider.face, pad: 2 },
  { id: "skoczek", cfg: VENOM_SPIDER, face: ASSETS.venomSpider.face, pad: 2 },
];

const bledy = [];
const uwagi = [];
const cache = new Map();
async function obraz(sciezka) {
  if (!cache.has(sciezka)) {
    cache.set(sciezka, czytajPng(await readFile(join(AKTYWA, sciezka.replace(/^assets\//, "")))));
  }
  return cache.get(sciezka);
}

/* ══════════════════════════════════════════════════════════════════════════
   3. Sekcja A — pomiar arkuszy
   ══════════════════════════════════════════════════════════════════════════ */

console.log("═".repeat(78));
console.log("A. WIDOCZNE PIKSELE — alpha bbox, mierzone z arkuszy");
console.log("═".repeat(78));
console.log("   (szer/gł w pikselach TEKSTURY; „świat\" = × skala encji)\n");

const pomiar = [];

for (const s of STWORZENIA) {
  const skala = s.cfg.scale;

  // ── Pająki: brak arkusza, rozmiar ZADEKLAROWANY ────────────────────────
  if (s.face) {
    pomiar.push({
      id: s.id, cfg: s.cfg, skala,
      dlugosc: s.face.w, glebokosc: s.face.h, zrodlo: "deklaracja ASSETS.face",
      klatek: 0,
    });
    console.log(
      `${s.id.padEnd(12)} BRAK ARKUSZA — generowana tekstura, ` +
      `face { w: ${s.face.w}, h: ${s.face.h} } podane wprost`,
    );
    console.log(
      `${" ".repeat(12)} świat: ${(s.face.w * skala).toFixed(1)} × ` +
      `${(s.face.h * skala).toFixed(1)} px (skala ${skala})\n`,
    );
    continue;
  }

  const a = s.arkusz;
  const fw = a.frameWidth;
  const fh = a.frameHeight;
  /** Zbiera bboksy z podanych klatek siatki. */
  const zbierz = async (sciezka, klatki) => {
    const img = await obraz(sciezka);
    const out = [];
    for (const [r, c] of klatki) {
      const b = bbox(img, c * fw, r * fh, fw, fh);
      if (b) out.push(b);
    }
    return out;
  };

  let bok = [];
  let przod = [];
  let ileKlatek = 0;

  if (s.kierunki.paski) {
    // Niedźwiedź: paski jednokierunkowe.
    for (const p of s.kierunki.paski) {
      const img = await obraz(a[`${p}Path`]);
      const n = a[`${p}Frames`];
      for (let i = 0; i < n; i++) {
        const b = bbox(img, i * fw, 0, fw, fh);
        if (b) { bok.push(b); ileKlatek++; }
      }
    }
  } else if (s.kierunki.dirRow) {
    // Wilk / Szary: rząd = stan × 4 + kierunek; przemiatamy WSZYSTKIE stany.
    const img = await obraz(a.path);
    const rzedow = Math.floor(img.h / fh);
    const kol = Math.floor(img.w / fw);
    for (let r = 0; r < rzedow; r++) {
      const kier = r % 4;
      for (let c = 0; c < kol; c++) {
        const b = bbox(img, c * fw, r * fh, fw, fh);
        if (!b) continue;
        ileKlatek++;
        if (kier === s.kierunki.dirRow.bokL || kier === s.kierunki.dirRow.bokP) bok.push(b);
        else przod.push(b);
      }
    }
  } else {
    // Królik / dzik: idle w rzędzie 0 (przód/tył), cykle w rzędach 1–2 (bok).
    przod = await zbierz(a.path, s.kierunki.przod.concat(s.kierunki.tyl));
    const img = await obraz(a.path);
    for (const r of [a.walkRow, a.runRow]) {
      for (let c = a.cycleFromCol; c <= a.cycleToCol; c++) {
        const b = bbox(img, c * fw, r * fh, fw, fh);
        if (b) bok.push(b);
      }
    }
    ileKlatek = przod.length + bok.length;
  }

  const dlugosc = mediana(bok.map((b) => b.w));
  const glebokosc = przod.length ? mediana(przod.map((b) => b.w)) : null;

  pomiar.push({
    id: s.id, cfg: s.cfg, skala, dlugosc, glebokosc,
    zrodlo: "pomiar arkusza", klatek: ileKlatek,
    bokTylko: !!s.kierunki.bokTylko,
  });

  const zakres = (arr, f) => arr.length
    ? `${Math.min(...arr.map(f))}–${Math.max(...arr.map(f))}`
    : "—";
  console.log(`${s.id.padEnd(12)} klatka ${fw}×${fh}, skala ${skala}, klatek z treścią: ${ileKlatek}`);
  console.log(
    `${" ".repeat(12)} BOK   szer ${zakres(bok, (b) => b.w).padEnd(7)} ` +
    `mediana ${String(dlugosc).padEnd(5)} → świat ${(dlugosc * skala).toFixed(1)} px  (= DŁUGOŚĆ ciała)`,
  );
  if (glebokosc !== null) {
    console.log(
      `${" ".repeat(12)} PRZÓD szer ${zakres(przod, (b) => b.w).padEnd(7)} ` +
      `mediana ${String(glebokosc).padEnd(5)} → świat ${(glebokosc * skala).toFixed(1)} px  (= GŁĘBOKOŚĆ ciała)`,
    );
  } else {
    console.log(`${" ".repeat(12)} PRZÓD — arkusz jednokierunkowy, GŁĘBOKOŚCI NIE DA SIĘ ODCZYTAĆ`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   4. Geometria ciał — odtworzona ze źródła Phasera
   ══════════════════════════════════════════════════════════════════════════ */

/** Przesunięcie środka CIAŁA pod środek SPRITE'A. Patrz nagłówek pliku. */
function deltaSrodka(frameH, bodyH, skala, pad) {
  return skala * (frameH / 2 - bodyH / 2 - pad);
}

const graczFH = ASSETS.character.frameHeight;
const DELTA_GRACZ = deltaSrodka(graczFH, PLAYER.bodyHeight, PLAYER.scale, ASSETS.character.feetPadding);
const R_GRACZ = (PLAYER.bodyWidth * PLAYER.scale) / 2;

for (const p of pomiar) {
  const s = STWORZENIA.find((x) => x.id === p.id);
  // Pająki: tekstura generowana o wymiarach `face`, więc frameH = face.h.
  const fh = s.face ? s.face.h : s.arkusz.frameHeight;
  p.delta = deltaSrodka(fh, p.cfg.bodyHeight, p.skala, s.pad);
  p.fantom = Math.abs(DELTA_GRACZ - p.delta);
  p.ciałoSzer = p.cfg.bodyWidth * p.skala;
  // Dzisiejszy `allowance` — dokładnie linijka z GameScene.ts:2382.
  const dispW = (s.face ? s.face.w : s.arkusz.frameWidth) * p.skala;
  const dispH = fh * p.skala;
  p.allowance = Math.max(dispW, dispH) * 0.35;
  // Propozycja: promień z WĘŻSZEJ osi (decyzja #2 z §8 audytu).
  p.rProp = p.glebokosc !== null ? (p.glebokosc * p.skala) / 2 : null;
  p.dlProp = p.dlugosc * p.skala;
  if (ZEPSUJ && p.id === "wilk") p.rProp = 0; // autotest asercji B2
}

console.log("═".repeat(78));
console.log("B. HURTBOX: dziś vs propozycja  (px świata)");
console.log("═".repeat(78));
console.log(
  "\n" +
  "gatunek      allowance   prop. R   prop. L   różnica    L/gł. — PODPOWIEDŹ\n" +
  "             (dziś)      (promień) (długość) R − allow. (NIE reguła, §5.2a)",
);
console.log("─".repeat(78));
for (const p of pomiar) {
  const r = p.rProp === null ? "  ?  " : p.rProp.toFixed(1);
  const roz = p.rProp === null ? "   ?  " : (p.rProp - p.allowance).toFixed(1);
  // ⚠ PODPOWIEDŹ, nie reguła. Dzik (1,34) i skoczek (1,33) leżą 0,02 od tego
  // progu — klasyfikacja automatyczna rozstrzygałaby ich zaokrągleniem, czyli
  // dokładnie tak, jak `cos(90°)` rozstrzygał kiedyś blok tarczą. Kształt
  // `CombatBody` ma być JAWNĄ deklaracją per gatunek (audyt §5.2a).
  const prop = p.rProp === null ? null : p.dlProp / (2 * p.rProp);
  const ksztalt = prop === null
    ? "kapsuła (R do decyzji)"
    : `${prop.toFixed(2)}  ${prop > 1.35 ? "→ kapsuła?" : "→ okrąg?"}` + (Math.abs(prop - 1.35) < 0.05 ? "  ⚠ NA PROGU" : "");
  console.log(
    `${p.id.padEnd(12)} ${p.allowance.toFixed(1).padStart(7)}   ` +
    `${r.padStart(7)}   ${p.dlProp.toFixed(1).padStart(7)}   ` +
    `${roz.padStart(7)}    ${ksztalt}`,
  );
}
console.log(`\ngracz        promień ciała ${R_GRACZ.toFixed(1)} px, klatka ${ASSETS.character.frameWidth}×${graczFH}, feetPadding ${ASSETS.character.feetPadding}`);

/* ── Niedźwiedź: głębokości NIE DA SIĘ zmierzyć (arkusz jednokierunkowy) ────
   Zamiast zgadywać — widełki z proporcji L/głębokość pozostałych czworonogów,
   które mają oba widoki. Rozkładają się na dwie grupy i to nie jest szum:
   psowate są smukłe, krępe są krępe. To nadal INFERENCJA, nie pomiar; zawęża
   decyzję w 1B, nie podejmuje jej. */
const CZWOR = ["wilk", "Szary", "królik", "dzik"];
const czworonogi = pomiar.filter((x) => x.rProp !== null && CZWOR.includes(x.id));
const niedzwiedz = pomiar.find((x) => x.id === "niedźwiedź");
if (niedzwiedz && czworonogi.length) {
  console.log("\n" + "─".repeat(78));
  console.log("Niedźwiedź — głębokość NIE ZMIERZONA. Widełki z proporcji czworonogów:\n");
  const prop = (c) => c.dlProp / (2 * c.rProp);
  for (const c of czworonogi) {
    const typ = ["wilk", "Szary"].includes(c.id) ? "psowaty — smukły" : "krępy";
    console.log(`  ${c.id.padEnd(9)} L/gł = ${prop(c).toFixed(2)}   (${typ})`);
  }
  const krepe = mediana(czworonogi.filter((c) => !["wilk", "Szary"].includes(c.id)).map(prop));
  const smukle = mediana(czworonogi.filter((c) => ["wilk", "Szary"].includes(c.id)).map(prop));
  const rKrepy = niedzwiedz.dlProp / (2 * krepe);
  const rSmukly = niedzwiedz.dlProp / (2 * smukle);
  console.log(`
  proporcja KRĘPA  (${krepe.toFixed(2)}) → R ≈ ${rKrepy.toFixed(1)} px`);
  console.log(`  proporcja SMUKŁA (${smukle.toFixed(2)}) → R ≈ ${rSmukly.toFixed(1)} px`);
  console.log(`  dzisiejsze ciało fizyczne        → R = ${(niedzwiedz.ciałoSzer / 2).toFixed(1)} px`);
  console.log(`
  ⚠ Niedźwiedź jest krępy, więc ~${rKrepy.toFixed(0)} px to najbliższe uczciwe`);
  console.log("     przybliżenie. To NIE jest pomiar — decyzja należy do 1B i playtestu,");
  console.log("     a nie do zamawiania nowego assetu tylko po to, żeby zmierzyć hurtbox.");
}


console.log("\n" + "═".repeat(78));
console.log("C. FANTOMOWY DYSTANS PIONOWY  (§4.1 audytu — dokładnie, nie szacunkowo)");
console.log("═".repeat(78));
console.log("\nΔ = skala × (frameH/2 − bodyH/2 − pad)   [Body.js:1061 + 1501]\n");
console.log(`gracz: Δ = ${DELTA_GRACZ.toFixed(2)} px pod środkiem sprite'a\n`);
console.log("gatunek       Δ wroga   fantom |Δg − Δw|");
console.log("─".repeat(46));
for (const p of pomiar) {
  console.log(`${p.id.padEnd(13)} ${p.delta.toFixed(2).padStart(7)}   ${p.fantom.toFixed(2).padStart(7)} px`);
}

/* ══════════════════════════════════════════════════════════════════════════
   4b. Sekcja C2 — fantom jest ANIZOTROPOWY
   ══════════════════════════════════════════════════════════════════════════
   Pierwsza wersja tego pliku liczyła tylko podejście POZIOME i przez to
   zaniżała problem: przy T=96 i fantomie 9,1 px różnica wynosi 0,4 px, bo
   fantom siedzi pod pierwiastkiem. Ale w pionie NIE siedzi pod pierwiastkiem.

   Niech Δg > Δw (środek ciała gracza leży NIŻEJ pod jego sprite'em niż środek
   ciała wroga pod jego). Wróg w odległości d od gracza, mierzonej między
   CIAŁAMI, daje odległość między środkami sprite'ów:

     z boku:  sqrt(d² + f²)        → próg zadziała przy d = sqrt(T² − f²)
     z dołu:  d + f                → próg zadziała przy d = T − f
     z góry:  |d − f|              → próg zadziała przy d = T + f

   Czyli ten sam wróg z tym samym progiem atakuje z GÓRY z odległości większej
   o 2f niż z DOŁU. Dla skoczka (f = 16,75) to 33,5 px rozjazdu na progu 58. */

const PROGI = [];
const dodaj = (gatunek, nazwa, wartosc, odejmijGracza, glowny = false) => {
  const p = pomiar.find((x) => x.id === gatunek);
  PROGI.push({ gatunek, nazwa, wartosc, p, odejmijGracza, glowny });
};

// ⚠ **Tylko progi POZYCJONOWANIA — te wciąż liczą dystans środków sprite'ów.**
// Progi ATAKU (`bite.range/reach`, `lungeStopGap`, `biteReach`, `gore.*`,
// `charge.hitReach`) przeszły w Fazie 1B-a na PRZEŚWIT i wypadły stąd: liczenie
// dla nich „kompensacji" nie ma już sensu, bo są już skompensowane. Weryfikuje
// je sekcja H. Zostawienie ich tutaj dawało FAŁSZYWE BŁĘDY („próg kompensuje się
// do −4,6 px") — klasyczny objaw narzędzia, którego nie nauczono nowej osi.
dodaj("wilk", "WOLF.pack.circleRadius", WOLF.pack.circleRadius, true, true);
dodaj("wilk", "WOLF.pack.lungeRange", WOLF.pack.lungeRange, true, true);
dodaj("dzik", "BOAR.charge.triggerRange", BOAR.charge.triggerRange, true, true);
for (const [g, c] of [["królik", RABBIT], ["wilk", WOLF], ["Szary", GREY_WOLF],
  ["dzik", BOAR], ["niedźwiedź", BEAR], ["sieciarz", SPIDER], ["skoczek", VENOM_SPIDER]]) {
  dodaj(g, `${g}.aggroRange`, c.aggroRange, true);
}
/** Progi ROZSTRZYGAJĄCE walkę — bez agro, które i tak nikogo nie trafia. */
const PROGI_GLOWNE = () => PROGI.filter((q) => q.glowny);

console.log("\n" + "═".repeat(78));
console.log("C2. FANTOM JEST ANIZOTROPOWY — ta sama liczba, trzy różne dystanse");
console.log("═".repeat(78));
console.log("\nOdległość między CIAŁAMI, przy której próg zadziała dziś, zależnie od");
console.log("strony podejścia. Kolumna „rozjazd\" = ile dzieli podejście z góry od");
console.log("podejścia z dołu, czyli ile gracz zyskuje albo traci wyłącznie za to,");
console.log("z której strony stoi.\n");
console.log("gatunek       próg   z boku   z dołu   z góry   rozjazd  % progu");
console.log("─".repeat(70));
const anizo = [];
for (const q of PROGI_GLOWNE()) {
  const f = q.p.fantom;
  const T = q.wartosc;
  const bok = T > f ? Math.sqrt(T * T - f * f) : NaN;
  const dol = T - f;
  const gora = T + f;
  const rozjazd = gora - dol; // = 2f
  const pct = (100 * rozjazd) / T;
  anizo.push({ ...q, rozjazd, pct });
  console.log(
    `${q.gatunek.padEnd(13)} ${String(T).padStart(5)}  ${bok.toFixed(1).padStart(7)}  ` +
    `${dol.toFixed(1).padStart(7)}  ${gora.toFixed(1).padStart(7)}  ` +
    `${rozjazd.toFixed(1).padStart(7)}  ${pct.toFixed(0).padStart(5)}%`,
  );
}
console.log("\n⚠ To jest ta sama klasa błędu co `allowance` z max(displayW, displayH):");
console.log("   reguła prawdziwa, powtarzalna i NIE DO WYTŁUMACZENIA Z EKRANU.");
console.log("   Po przejściu na `gapBetween` w przestrzeni ciał rozjazd znika w całości.");

/* Który próg cierpi najbardziej — to jest kandydat na pierwszy test w 1B. */
const najgorszy = anizo.reduce((a, b) => (b.pct > a.pct ? b : a));
console.log(
  `\nNajgorszy przypadek: ${najgorszy.nazwa} — ${najgorszy.rozjazd.toFixed(1)} px ` +
  `rozjazdu na progu ${najgorszy.wartosc} (${najgorszy.pct.toFixed(0)}%).`,
);

/* ══════════════════════════════════════════════════════════════════════════
   5. Sekcja D — kompensacja progów
   ══════════════════════════════════════════════════════════════════════════
   Dziś:   sqrt(dx² + fantom²) ≤ T           (środki sprite'ów)
   Jutro:  dx − (promienie)     ≤ T'          (prześwit między ciałami)
   Stąd:   dx = sqrt(T² − fantom²),  T' = dx − odejmowane. */

function kompensuj(T, fantom, odejmij) {
  if (T <= fantom) return { dx: null, T2: null };
  const dx = Math.sqrt(T * T - fantom * fantom);
  return { dx, T2: dx - odejmij };
}


console.log("\n" + "═".repeat(78));
console.log("D. PROGI WROGÓW: liczba do wpisania w Fazie 1B");
console.log("═".repeat(78));
console.log("\n„dx\" = rzeczywisty poziomy odstęp środków ciał w chwili zadziałania DZIŚ.");
console.log("„T′\" = ta sama chwila wyrażona jako PRZEŚWIT (odjęte oba promienie).\n");
console.log("próg                              dziś T    dx      T′ (1B)   Δ");
console.log("─".repeat(78));
for (const q of PROGI) {
  const rW = q.p.rProp ?? q.p.ciałoSzer / 2; // brak pomiaru → ciało jako zastępnik
  const odejmij = rW + (q.odejmijGracza ? R_GRACZ : 0);
  const { dx, T2 } = kompensuj(q.wartosc, q.p.fantom, odejmij);
  if (T2 === null) {
    bledy.push(`BŁĄD: próg ${q.nazwa} (${q.wartosc}) jest MNIEJSZY niż fantomowy dystans ${q.p.fantom.toFixed(1)} px — dziś rozstrzyga o nim artefakt geometrii, nie zamysł.`);
    console.log(`${q.nazwa.padEnd(33)} ${String(q.wartosc).padStart(6)}    ——  NIEOSIĄGALNY  ——`);
    continue;
  }
  q.T2 = T2;
  const flaga = T2 <= 0 ? "  ⚠ ≤0" : "";
  console.log(
    `${q.nazwa.padEnd(33)} ${String(q.wartosc).padStart(6)}  ${dx.toFixed(1).padStart(6)}  ` +
    `${T2.toFixed(1).padStart(7)}  ${(T2 - q.wartosc).toFixed(1).padStart(7)}${flaga}`,
  );
  if (T2 <= 0) {
    bledy.push(`BŁĄD: ${q.nazwa} kompensuje się do ${T2.toFixed(1)} px — cały dzisiejszy próg mieści się WEWNĄTRZ hurtboxów, więc w nowym układzie jest nieosiągalny.`);
  }
}

/* Zasięgi broni gracza — druga strona walki. Dziś: dist − allowance ≤ reach. */
const bronie = [];
for (const [id, it] of Object.entries(ITEMS)) {
  if (it?.melee?.reach) bronie.push({ id, reach: it.melee.reach, nazwa: it.name ?? id });
}
bronie.sort((a, b) => a.reach - b.reach);

console.log("\n" + "═".repeat(78));
console.log("E. ZASIĘG BRONI GRACZA: o ile zmienia się trafialność per gatunek");
console.log("═".repeat(78));
console.log("\nDziś próg to `reach + allowance` (GameScene.ts:2382) — a `allowance` jest");
console.log("liczone z max(displayW, displayH), czyli TAK SAMO w każdą stronę (§4.2).\n");
const wzor = bronie.find((b) => b.reach === 52) ?? bronie[Math.floor(bronie.length / 2)];
console.log(`Wzorzec: „${wzor.nazwa}" (reach ${wzor.reach}).\n`);
console.log("gatunek       próg dziś   próg 1B    zmiana    znaczenie");
console.log("─".repeat(72));
for (const p of pomiar) {
  const rW = p.rProp ?? p.ciałoSzer / 2;
  const dzis = wzor.reach + p.allowance;          // dystans środków sprite'ów
  const { dx } = kompensuj(dzis, p.fantom, 0);     // ten sam moment, poziomo
  const jutro = wzor.reach + rW;                   // combatOrigin → krawędź hurtboxa
  const zm = jutro - (dx ?? dzis);
  console.log(
    `${p.id.padEnd(13)} ${(dx ?? dzis).toFixed(1).padStart(8)}   ${jutro.toFixed(1).padStart(7)}   ` +
    `${(zm >= 0 ? "+" : "") + zm.toFixed(1)}`.padStart(9) +
    `    ${zm > 2 ? "łatwiej trafić" : zm < -2 ? "TRUDNIEJ trafić" : "bez zmian"}`,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. Asercje
   ══════════════════════════════════════════════════════════════════════════ */

for (const p of pomiar) {
  // A1 — coś w ogóle zmierzone.
  if (!p.dlProp || p.dlProp <= 0) {
    bledy.push(`BŁĄD: ${p.id} — nie zmierzono żadnych widocznych pikseli (arkusz pusty albo źle pocięty?).`);
  }
  // A2 — pomiar mieści się w klatce.
  const s = STWORZENIA.find((x) => x.id === p.id);
  const fw = (s.face ? s.face.w : s.arkusz.frameWidth) * p.skala;
  if (p.dlProp > fw + 0.01) {
    bledy.push(`BŁĄD: ${p.id} — zmierzona długość ${p.dlProp.toFixed(1)} px przekracza szerokość klatki ${fw.toFixed(1)} px.`);
  }
  // B2 — proponowany promień musi być dodatni tam, gdzie da się go policzyć.
  if (p.rProp !== null && p.rProp <= 0) {
    bledy.push(`BŁĄD: ${p.id} — proponowany promień hurtboxa wynosi ${p.rProp.toFixed(1)} px.`);
  }
  // A4 — brak głębokości to nie usterka, ale MUSI zostać zgłoszony jako dług.
  if (p.rProp === null) {
    uwagi.push(`${p.id}: arkusz jednokierunkowy — głębokości nie da się zmierzyć. Promień kapsuły wymaga DECYZJI, nie pomiaru.`);
  }
  // B3 — hurtbox nie może być węższy od fizycznego ciała, którym stworzenie
  //      i tak koliduje z innymi. Byłoby to trafienie „w powietrze obok ciała".
  if (p.rProp !== null && p.rProp * 2 < p.ciałoSzer - 0.01) {
    uwagi.push(`${p.id}: hurtbox (${(p.rProp * 2).toFixed(1)} px) jest WĘŻSZY niż ciało fizyczne (${p.ciałoSzer.toFixed(1)} px) — do rozstrzygnięcia w 1B, które z nich jest prawdą.`);
  }
}

// C1 — fantom nie może dominować najmniejszego progu, na który wpływa.
const najmniejszy = PROGI.reduce((a, b) => (b.wartosc < a.wartosc ? b : a));
if (najmniejszy.p.fantom > najmniejszy.wartosc * 0.25) {
  uwagi.push(
    `Najmniejszy próg (${najmniejszy.nazwa} = ${najmniejszy.wartosc}) niesie ` +
    `${najmniejszy.p.fantom.toFixed(1)} px fantomu, czyli ` +
    `${((100 * najmniejszy.p.fantom) / najmniejszy.wartosc).toFixed(0)}% swojej wartości.`,
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   F. NIEZMIENNIK ZASIĘGU ATAKU  (runda recenzji 2, 2026-08-23)
   ══════════════════════════════════════════════════════════════════════════
   „Atak rozpoczęty na MAKSYMALNYM legalnym dystansie wyzwolenia musi móc
   dosięgnąć NIERUCHOMEGO celu."

   To nie jest balans, tylko **złamana obietnica mechaniki**: gracz widzi wielki
   telegraf, słyszy pomruk, stoi w miejscu — i szarża nie dolatuje. Nie da się
   tego odczytać jako czegokolwiek poza usterką.

   ⚠ Zgłaszane jako UWAGA, nie BŁĄD, i to jest świadome: naruszenie jest DZIŚ
   znane i celowo niepoprawione (progi i tak przelicza Faza 1B, a strojenie
   przed nią byłoby robotą dwa razy). Asercja, która stoi na czerwono tygodniami,
   uczy ignorowania raportu — a ta ma przetrwać do 1B i wtedy zostać domknięta. */

console.log("\n" + "═".repeat(78));
console.log("F. NIEZMIENNIK: czy atak z maksymalnego dystansu w ogóle dosięga?");
console.log("═".repeat(78) + "\n");
console.log("atak                    trigger  zasięg  droga do  dostępna  werdykt");
console.log("                                 trafienia przebycia  droga");
console.log("─".repeat(78));
// ⚠ **`trigger` jest w dystansie ŚRODKÓW, `hit` w PRZEŚWICIE — od Fazy 1B-a to
// dwie różne jednostki i nie wolno ich odejmować wprost.** Pierwsza wersja tego
// bloku tak robiła i po migracji zgłaszała brak 44 px zamiast 6. Prześwit trzeba
// najpierw odtworzyć jako dystans środków, tą samą arytmetyką co sekcja H.
const naSrodki = (gap, gat) => {
  const p = pomiar.find((x) => x.id === gat);
  const srodkiCial = gap + p.dlProp / 2 + 10.5;
  return Math.sqrt(srodkiCial * srodkiCial + p.fantom * p.fantom);
};
for (const a of [
  { nazwa: "BOAR.charge", trigger: BOAR.charge.triggerRange, hit: naSrodki(BOAR.charge.hitReach, "dzik"),
    v: BOAR.charge.speed, ms: BOAR.charge.durationMs },
  { nazwa: "WOLF.pack lunge", trigger: WOLF.pack.lungeRange, hit: naSrodki(WOLF.pack.biteReach, "wilk"),
    v: WOLF.pack.lungeSpeed, ms: WOLF.pack.lungeMs },
]) {
  const potrzeba = a.trigger - a.hit;
  const dostepne = (a.v * a.ms) / 1000;
  const ok = dostepne >= potrzeba;
  console.log(
    `${a.nazwa.padEnd(23)} ${String(a.trigger).padStart(6)}  ${a.hit.toFixed(1).padStart(6)}  ` +
    `${potrzeba.toFixed(0).padStart(8)}  ${dostepne.toFixed(0).padStart(8)}  ` +
    `${ok ? "OK" : "NARUSZONY o " + (potrzeba - dostepne).toFixed(0) + " px"}`,
  );
  if (!ok) {
    // ⚠ **BŁĄD, nie uwaga — od Fazy 1B.** Dopóki naruszenie było znane i
    // celowo niepoprawione, stało jako uwaga (asercja tygodniami na czerwono
    // uczy ignorowania raportu). Zostało domknięte, więc od teraz każdy powrót
    // do tego stanu ma zatrzymać przebieg.
    bledy.push(
      `${a.nazwa}: atak z maksymalnego \`triggerRange\` (${a.trigger}) NIE DOSIĘGA ` +
      `nieruchomego celu — brakuje ${(potrzeba - dostepne).toFixed(0)} px. ` +
      `NIEZMIENNIK ZŁAMANY.`,
    );
  }
}


/* ══════════════════════════════════════════════════════════════════════════
   G. RAPORT MIGRACJI 1B — ślad stopy, kształty, kompensacja progów
   ══════════════════════════════════════════════════════════════════════════
   ⚠ **KOREKTA WOBEC WCZEŚNIEJSZYCH SEKCJI TEGO PLIKU.**

   Sekcje B–E porównywały „prześwit między sylwetkami" używając WYSOKOŚCI
   sprite'a jako rozmiaru w pionie. To jest błędna wielkość dla gry z rzutu z
   góry: 60 px wysokości gracza to PERSPEKTYWA, nie zajmowana powierzchnia.

   Ślad stopy mierzy się SZEROKOŚCIĄ bboksa w dwóch widokach:
     • widok z przodu/tyłu → SZEROKOŚĆ stworzenia
     • widok z boku       → GŁĘBOKOŚĆ stworzenia (od nosa do zadu)
   Obie są poziome. Faza 0 zmierzyła dokładnie to; zła była interpretacja.

   Skutek: gracz jest praktycznie OKRĘGIEM (22 × 21 px), a nie „wysoki i wąski".
   Anizotropia siedzi w WYDŁUŻONYCH ZWIERZĘTACH (wilk 50×23) i w fantomie,
   nie w graczu. */

console.log("\n" + "═".repeat(78));
console.log("G. RAPORT MIGRACJI 1B");
console.log("═".repeat(78));

const R_GRACZA_1B = 10.5; // ślad stopy 22×21 px → okrąg
console.log("\nŚLAD STOPY (rzut z góry, px świata) — propozycja `CombatBody`:\n");
console.log("gatunek       długość  głębok.  L/gł.  kształt      promień  pół-długość");
console.log("─".repeat(78));
const ciala = [];
for (const p of pomiar) {
  const L1 = p.dlProp;
  const G = p.rProp !== null ? p.rProp * 2 : null;
  if (G === null) {
    console.log(`${p.id.padEnd(13)} ${L1.toFixed(1).padStart(7)}       ?      ?   KAPSUŁA?         ?  ${(L1 / 2).toFixed(1).padStart(11)}`);
    ciala.push({ id: p.id, dl: L1, r: null, kap: true });
    continue;
  }
  const prop = L1 / G;
  const kap = prop > 1.35;
  console.log(
    `${p.id.padEnd(13)} ${L1.toFixed(1).padStart(7)}  ${G.toFixed(1).padStart(7)}  ${prop.toFixed(2).padStart(5)}  ` +
    `${(kap ? "kapsuła" : "okrąg").padEnd(11)}  ${(G / 2).toFixed(1).padStart(7)}  ${(L1 / 2).toFixed(1).padStart(11)}`,
  );
  ciala.push({ id: p.id, dl: L1, r: G / 2, kap });
}
console.log(`${"gracz".padEnd(13)} ${"22.0".padStart(7)}  ${"21.0".padStart(7)}  ${"1.05".padStart(5)}  ${"okrąg".padEnd(11)}  ${R_GRACZA_1B.toFixed(1).padStart(7)}`);

console.log("\n⚠ Kapsuła zwierzęcia jest zorientowana wzdłuż jego RUCHU. Przy ataku");
console.log("   wróg zawsze naciera NOSEM w gracza, więc w stronę gracza wystawia");
console.log("   POŁ-DŁUGOŚĆ. Anizotropia znika: wypad jest zawsze czołowy.\n");

console.log("═".repeat(78));
console.log("PROGI ATAKU WROGA: dzisiejsza liczba → prześwit (nos ↔ krawędź gracza)");
console.log("═".repeat(78) + "\n");
console.log("próg                          dziś   ciała   prześwit  komentarz");
console.log("─".repeat(78));
const mig = [
  ["wilk", "WOLF.pack.lungeStopGap", WOLF.pack.lungeStopGap],
  ["wilk", "WOLF.pack.biteReach", WOLF.pack.biteReach],
  ["wilk", "WOLF.pack.circleRadius", WOLF.pack.circleRadius],
  ["dzik", "BOAR.gore.range", BOAR.gore.range],
  ["dzik", "BOAR.gore.reach", BOAR.gore.reach],
  ["dzik", "BOAR.charge.hitReach", BOAR.charge.hitReach],
  ["królik", "RABBIT.bite.range", RABBIT.bite.range],
  ["królik", "RABBIT.bite.reach", RABBIT.bite.reach],
  ["skoczek", "VENOM_SPIDER.bite.range", VENOM_SPIDER.bite.range],
  ["skoczek", "VENOM_SPIDER.bite.reach", VENOM_SPIDER.bite.reach],
  ["Szary", "GREY_WOLF.duel.biteRange", GREY_WOLF.duel.biteRange],
  ["Szary", "GREY_WOLF.duel.biteReach", GREY_WOLF.duel.biteReach],
];
for (const [gat, nazwa, T] of mig) {
  const p = pomiar.find((x) => x.id === gat);
  const c = ciala.find((x) => x.id === gat);
  const polDl = c.dl / 2;
  const srodki = T > p.fantom ? Math.sqrt(T * T - p.fantom * p.fantom) : NaN;
  const przeswit = srodki - polDl - R_GRACZA_1B;
  const kom = przeswit < 0 ? "⚠ NACHODZI" : przeswit < 4 ? "ciasno" : "";
  console.log(
    `${nazwa.padEnd(28)} ${String(T).padStart(5)}  ${srodki.toFixed(1).padStart(6)}  ` +
    `${przeswit.toFixed(1).padStart(8)}  ${kom}`,
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   H. WERYFIKACJA TRANSLACJI 1B-a
   ══════════════════════════════════════════════════════════════════════════
   Faza 1B-a miała być CZYSTĄ TRANSLACJĄ: te same progi wyrażone w prześwicie
   zamiast w dystansie środków sprite'ów, bez zmiany odczucia. Ta sekcja to
   sprawdza — odtwarza dystans środków, przy którym NOWA liczba zadziała, i
   porównuje ze STARĄ, zapisaną niżej jako historyczna stała.

   ⚠ Tabela `PRZED_1B` jest zamrożona ręcznie i to jest jej jedyny sensowny
   kształt: te wartości już nie istnieją w configu, więc nie da się ich stamtąd
   odczytać. Gdyby kiedyś przestały się zgadzać, znaczy to, że ktoś przestroił
   próg — a wtedy ta asercja ma paść i zmusić do świadomej decyzji. */

const PRZED_1B = {
  "RABBIT.bite.range": 34, "RABBIT.bite.reach": 42,
  "WOLF.pack.lungeStopGap": 54, "WOLF.pack.biteReach": 68,
  "BOAR.gore.range": 56, "BOAR.gore.reach": 70, "BOAR.charge.hitReach": 58,
  "GREY_WOLF.duel.biteRange": 74, "GREY_WOLF.duel.biteReach": 88,
  "VENOM_SPIDER.bite.range": 58, "VENOM_SPIDER.bite.reach": 70,
};
const PO_1B = {
  "RABBIT.bite.range": [RABBIT.bite.range, "królik"],
  "RABBIT.bite.reach": [RABBIT.bite.reach, "królik"],
  "WOLF.pack.lungeStopGap": [WOLF.pack.lungeStopGap, "wilk"],
  "WOLF.pack.biteReach": [WOLF.pack.biteReach, "wilk"],
  "BOAR.gore.range": [BOAR.gore.range, "dzik"],
  "BOAR.gore.reach": [BOAR.gore.reach, "dzik"],
  "BOAR.charge.hitReach": [BOAR.charge.hitReach, "dzik"],
  "GREY_WOLF.duel.biteRange": [GREY_WOLF.duel.biteRange, "Szary"],
  "GREY_WOLF.duel.biteReach": [GREY_WOLF.duel.biteReach, "Szary"],
  "VENOM_SPIDER.bite.range": [VENOM_SPIDER.bite.range, "skoczek"],
  "VENOM_SPIDER.bite.reach": [VENOM_SPIDER.bite.reach, "skoczek"],
};
const TOL = 1.5;
console.log("");
console.log("═".repeat(78));
console.log("H. WERYFIKACJA TRANSLACJI 1B-a — czy zachowanie zostało zachowane?");
console.log("═".repeat(78));
console.log("");
console.log("próg                          przed   po   odtworzony  różnica  werdykt");
console.log("─".repeat(78));
for (const [nazwa, [nowa, gat]] of Object.entries(PO_1B)) {
  const stara = PRZED_1B[nazwa];
  const p = pomiar.find((x) => x.id === gat);
  const polDl = p.dlProp / 2;
  // Dystans ŚRODKÓW SPRITE'ÓW, przy którym nowy próg (prześwit) zadziała,
  // przy podejściu czołowym i poziomym.
  const srodkiCial = nowa + polDl + 10.5;
  const odtworzony = Math.sqrt(srodkiCial * srodkiCial + p.fantom * p.fantom);
  const roznica = odtworzony - stara;
  const ok = Math.abs(roznica) <= TOL;
  console.log(
    nazwa.padEnd(28) + String(stara).padStart(6) + String(nowa).padStart(5) +
    odtworzony.toFixed(1).padStart(12) + roznica.toFixed(1).padStart(9) + "  " +
    (ok ? "OK" : "ROZJAZD"),
  );
  if (!ok) {
    bledy.push(
      "translacja 1B-a: " + nazwa + " odtwarza " + odtworzony.toFixed(1) +
      " px zamiast " + stara + " px (różnica " + roznica.toFixed(1) + " px, tolerancja " + TOL + ").",
    );
  }
}


/* ══════════════════════════════════════════════════════════════════════════
   I. FAZA 1B-b — o ile zmienia się TRAFIALNOŚĆ GRACZA
   ══════════════════════════════════════════════════════════════════════════
   Dziś:   dist(środki SPRITE'ÓW) − allowance ≤ reach,
           gdzie allowance = max(displayWidth, displayHeight) × 0,35
   Po 1B-b: dist(combatOrigin gracza → środek ciała celu) − wystawanie ≤ reach,
           gdzie „wystawanie" zależy od ORIENTACJI celu (kapsuła).

   ⚠ Dwie orientacje trzeba pokazać osobno, bo to jest cała treść zmiany:
   stary okrąg dawał TĘ SAMĄ poprawkę z każdej strony, nowy kształt nie. */

{
  const bron = 68; // miecz — wzorzec
  console.log("");
  console.log("═".repeat(78));
  console.log("I. FAZA 1B-b: zmiana progu trafienia gracza (wzorzec: miecz, reach 68)");
  console.log("═".repeat(78));
  console.log("");
  console.log("gatunek       allowance  CZOŁOWO         Z BOKU          uwaga");
  console.log("              (dziś)     wyst.  zmiana   wyst.  zmiana");
  console.log("─".repeat(78));
  for (const p of pomiar) {
    // ⚠ **UWAGA NA KIERUNEK — pierwsza wersja miała to ODWROTNIE.**
    // Zwierzę zwrócone do gracza NOSEM wystawia w jego stronę pół-DŁUGOŚCI
    // (nos jest bliżej niż środek), więc jest ŁATWIEJSZE do trafienia.
    // Zwierzę przemykające BOKIEM wystawia pół-GŁĘBOKOŚCI i jest trudniejsze.
    // Błąd wyszedł dopiero, gdy uprząż regresyjna pokazała różnice odwrotne
    // do przewidzianych — dokładnie po to ona jest.
    const czolo = p.dlProp / 2;                       // nosem do gracza
    const bok = p.rProp !== null ? p.rProp : NaN;     // bokiem
    // Stary prog w dystansie SRODKOW SPRITE'OW:
    const stary = bron + p.allowance;
    // Nowy prog w dystansie SRODKOW CIAL; zeby porownac, odtwarzamy go jako
    // dystans srodkow sprite'ow przy podejsciu poziomym.
    const nowyC = Math.sqrt((bron + czolo) ** 2 + p.fantom ** 2);
    const nowyB = Math.sqrt((bron + bok) ** 2 + p.fantom ** 2);
    const dC = nowyC - stary;
    const dB = nowyB - stary;
    const uwaga = Number.isNaN(czolo) ? "głębokość = inferencja" : "";
    console.log(
      p.id.padEnd(13) +
      p.allowance.toFixed(1).padStart(8) +
      czolo.toFixed(1).padStart(7) +
      ((dC >= 0 ? "+" : "") + dC.toFixed(1)).padStart(8) +
      (Number.isNaN(bok) ? "     ?" : bok.toFixed(1).padStart(8)) +
      (Number.isNaN(dB) ? "       ?" : ((dB >= 0 ? "+" : "") + dB.toFixed(1)).padStart(8)) +
      "   " + uwaga,
    );
  }
  console.log("");
  console.log("⚠ CZOŁOWO to przypadek CZĘSTY: wróg naciera nosem, więc wystawia");
  console.log("   pół-DŁUGOŚCI i jest ŁATWIEJSZY do trafienia. Bokiem — trudniejszy.");
}


/* ══════════════════════════════════════════════════════════════════════════
   J. CZY KAŻDY ATAK MOŻE W OGÓLE WEJŚĆ
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Powstało po realnej pomyłce: `BOAR.gore.requiresChargeAwayMs` ustawiono na
   1500, a maksimum, jakie kiedykolwiek zostaje do gotowości szarży, to 1450 ms.
   Kieł nie wchodził w ŻADNYM scenariuszu — ani w normalnym cyklu, ani po
   wytrąceniu obuchem. **To nie był rzadki atak, tylko martwy kod**, a w configu
   wyglądał na działającą mechanikę.

   Reguła: bramka jednej akcji na stanie DRUGIEJ nie może być ciaśniejsza niż
   największe okno, jakie ta druga zostawia. Dla dzika: po szarży (albo po jej
   przerwaniu) do gotowości zostaje `cooldownMs − recoverMs`, bo bezbronność
   zjada część cooldownu. */

console.log("");
console.log("═".repeat(78));
console.log("J. CZY KAŻDY ATAK MOŻE W OGÓLE WEJŚĆ");
console.log("═".repeat(78));
console.log("");
{
  const oknoPoSzarzy = BOAR.charge.cooldownMs - BOAR.charge.recoverMs;
  const prog = BOAR.gore.requiresChargeAwayMs;
  const ok = prog <= oknoPoSzarzy;
  console.log("  BOAR.gore wymaga odstępu od szarży      " + String(prog).padStart(6) + " ms");
  console.log("  największe okno, jakie szarża zostawia  " + String(oknoPoSzarzy).padStart(6) + " ms   (cooldown − bezbronność)");
  console.log("  " + (ok ? "OK  " : "BŁĄD") + " kieł " + (ok ? "może wejść" : "NIE WEJDZIE NIGDY — martwy kod"));
  if (!ok) {
    bledy.push(
      "BOAR.gore.requiresChargeAwayMs (" + prog + ") przekracza największe okno, " +
      "jakie zostawia szarża (" + oknoPoSzarzy + " ms = cooldown − bezbronność). " +
      "Kieł nie wejdzie w żadnym scenariuszu.",
    );
  }
  // Druga strona: cooldown kła nie moze byc tak dlugi, zeby kiel nie wchodzil
  // nigdy. Okres szarzy to telegraf + lot + cooldown.
  const okresSzarzy = BOAR.charge.telegraphMs + BOAR.charge.durationMs + BOAR.charge.cooldownMs;
  const coIleCykli = Math.ceil(BOAR.gore.cooldownMs / okresSzarzy);
  console.log("  kieł wchodzi mniej więcej co " + coIleCykli + " cykl(e) szarży");
  if (BOAR.gore.cooldownMs > okresSzarzy * 4) {
    uwagi.push("BOAR.gore.cooldownMs (" + BOAR.gore.cooldownMs + ") daje kieł rzadziej niż co 4 szarże — czy to na pewno zamiar?");
  }
}

await Promise.all([unlink(stubPhaser), unlink(tmp)].map((p) => p.catch(() => {})));

console.log("\n" + "═".repeat(78));
if (uwagi.length) {
  console.log(`UWAGI (${uwagi.length}) — nie blokują, ale wymagają decyzji w 1B:`);
  for (const u of uwagi) console.log("  • " + u);
}
if (bledy.length) {
  console.error(`\n${bledy.length} BŁĘDÓW:`);
  for (const b of bledy) console.error("  " + b);
  process.exit(1);
}
console.log("\nOK — wszystkie asercje przeszły.");
if (ZEPSUJ) {
  console.error("\nBŁĄD AUTOTESTU: --zepsuj nie wywołał ani jednej asercji.");
  process.exit(2);
}

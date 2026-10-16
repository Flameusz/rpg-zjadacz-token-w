/**
 * Przymiar: kadr omija pustkę otwartego świata (`src/world/VoidFraming.ts`, 2026-10-12).
 *
 * Geometria świata jak w `public/assets/maps/swiat.world`: wieś 4096×4096 w (0,0),
 * las 7680×2880 w (0,4096), pustka 3584×4096 w (4096,0). Kadr jak w grze
 * (891×411 przy zoomie ~0,8 i ściśnięciu pionu kamery 40°): ~1114×785 px świata.
 *
 *   node tools/kadr_pustka_weryfikacja.mjs            — kod wyjścia 1 przy BŁĘDZIE
 *   SABOTAZ=1 node tools/kadr_pustka_weryfikacja.mjs  — zeruje przesunięcie; MUSI świecić na czerwono
 */
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".kadr-pustka.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "world", "VoidFraming.ts")],
  outfile: tmp, format: "esm", bundle: true, logLevel: "silent",
});
const { przesuniecieOdPustki: prawdziwa } = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }
const przesun = process.env.SABOTAZ ? () => ({ dx: 0, dy: 0 }) : prawdziwa;

const SWIAT = { x: 0, y: 0, w: 7680, h: 6976 };
const PUSTKI = [{ x: 4096, y: 0, w: 3584, h: 4096 }];
const HW = 557, HH = 392;

const zachodzi = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const kadr = (px, py) => {
  const cx = Math.min(Math.max(px, HW), SWIAT.w - HW), cy = Math.min(Math.max(py, HH), SWIAT.h - HH);
  return { x: cx - HW, y: cy - HH, w: HW * 2, h: HH * 2 };
};

let bledy = 0;
const sprawdz = (ok, opis) => { console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`); if (!ok) bledy++; };

const PRZYPADKI = [
  // [x, y, opis, czy przed korektą zachodzi na pustkę]
  [3792, 216, "NE róg wsi (miejsce zgłoszenia)", true],
  [4000, 2000, "wschodni skraj wsi, środek", true],
  [2000, 2000, "środek wsi", false],
  [1950, 4096, "szew na trakcie wieś↔las", false],
  [6000, 4200, "las przy północnej krawędzi, na wschodzie", true],
  [4060, 4120, "wewnętrzny narożnik", true],
  [7600, 6900, "SE róg lasu", false],
];
// Jak w scenie: kadr i świat powiększone o zapas na niedojazd kamery.
const ZAPAS = 12;
const naZapas = (v) => ({ x: v.x - ZAPAS, y: v.y - ZAPAS, w: v.w + 2 * ZAPAS, h: v.h + 2 * ZAPAS });
{
  const v = naZapas(kadr(7600, 4300));
  const { dx, dy } = przesun(v, PUSTKI, naZapas(SWIAT));
  const po = { ...v, x: v.x + dx, y: v.y + dy };
  sprawdz(!PUSTKI.some((p) => zachodzi(po, p)), `NE róg lasu z zapasem przy krawędzi świata: korekta działa (dx ${Math.round(dx)}, dy ${Math.round(dy)})`);
}
for (const [x, y, opis, przed] of PRZYPADKI) {
  const v = kadr(x, y);
  sprawdz(PUSTKI.some((p) => zachodzi(v, p)) === przed, `${opis}: przed korektą ${przed ? "zachodzi" : "nie zachodzi"} (samokontrola)`);
  const { dx, dy } = przesun(v, PUSTKI, SWIAT);
  const po = { ...v, x: v.x + dx, y: v.y + dy };
  sprawdz(!PUSTKI.some((p) => zachodzi(po, p)), `${opis}: po korekcie kadr poza pustką (dx ${Math.round(dx)}, dy ${Math.round(dy)})`);
  sprawdz(po.x >= 0 && po.y >= 0 && po.x + po.w <= SWIAT.w && po.y + po.h <= SWIAT.h, `${opis}: kadr w granicach świata`);
  if (!przed) sprawdz(dx === 0 && dy === 0, `${opis}: bez pustki w kadrze — zero przesunięcia`);
}
// Ciągłość: idąc na wschód wzdłuż wsi, przesunięcie rośnie płynnie (bez skoków > krok).
let poprzedni = null, maxSkok = 0;
for (let x = 3000; x <= 4090; x += 10) {
  const { dx } = przesun(kadr(x, 2000), PUSTKI, SWIAT);
  if (poprzedni !== null) maxSkok = Math.max(maxSkok, Math.abs(dx - poprzedni));
  poprzedni = dx;
}
sprawdz(maxSkok <= 10.001 && poprzedni < 0, `marsz na wschód wzdłuż wsi: kadr cofa się płynnie (max skok ${maxSkok.toFixed(1)} px na 10 px marszu)`);
// Wzdłuż wschodniego skraju wsi kadr cofa się w bok, ale NIE zjeżdża w dół.
sprawdz(przesun(kadr(3950, 2000), PUSTKI, SWIAT).dy === 0, "wschodni skraj wsi: korekta wyłącznie w bok (dy = 0)");
// Ciągłość przez wewnętrzny narożnik: ukośny marsz z rogu wsi do lasu na wschodzie.
// „Najkrótsza droga" przeskakiwała tu o ~600 px; reguła ciągła — o ułamek kroku.
{
  let prev = null, skok = 0;
  const krok = Math.hypot(8, 10);
  for (let i = 0; i <= 120; i++) {
    const v = kadr(3500 + i * 8, 3700 + i * 10);
    const { dx, dy } = przesun(v, PUSTKI, SWIAT);
    const c = [v.x + dx, v.y + dy];
    if (prev) skok = Math.max(skok, Math.hypot(c[0] - prev[0], c[1] - prev[1]));
    prev = c;
  }
  sprawdz(skok <= 3 * krok, `ukośny marsz przez narożnik: max ruch kadru ${skok.toFixed(1)} px na krok ${krok.toFixed(1)} px (próg ×3)`);
}

console.log(bledy ? `\n${bledy} BŁĘDÓW` : "\nOK — kadr nie pokazuje pustki świata.");
process.exit(bledy ? 1 : 0);

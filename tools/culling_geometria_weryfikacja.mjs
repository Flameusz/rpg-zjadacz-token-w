/**
 * Bramka geometrii render cullingu (`src/world/RenderCulling.ts`).
 *
 * ⚠ Testuje PRAWDZIWY, skompilowany kod źródłowy (przez esbuild), nie jego
 * powtórzenie w JS — ten sam wzorzec co `tools/movement_weryfikacja.mjs`.
 * Plik jest CZYSTY (zero importu Phasera), więc bundlowanie nie potrzebuje
 * żadnego stuba.
 *
 * Sprawdza dokładnie osiem przypadków z audytu cullingu:
 *   §1 obiekt całkowicie poza kamerą (bez marginesu)
 *   §2 obiekt dokładnie na krawędzi (styka się, nie nachodzi — konwencja: NIE widoczny)
 *   §3 duże drzewo: podstawa (pień) poza viewportem, korona nachodzi — WIDOCZNE
 *   §4 drzewo całkowicie poza viewportem (i pień, i korona) — NIEWIDOCZNE
 *   §5 krzew (realny wymiar 60×43, `bush_dome_large`) na granicy marginesu
 *   §6 kamień (realny wymiar 60×46, `stone_glaz_01`) na granicy marginesu
 *   §7 pniak (realny wymiar 59×52, `willow_stump_old`) na granicy marginesu
 *   §8 kilka obiektów naraz, różne odległości od granicy cullingu
 *
 * node tools/culling_geometria_weryfikacja.mjs
 * Kod wyjścia ≠ 0 przy jakiejkolwiek rozbieżności.
 */

import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmpOut = join(KORZEN, "node_modules", ".render-culling-test.mjs");

await build({
  entryPoints: [join(KORZEN, "src/world/RenderCulling.ts")],
  outfile: tmpOut,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});

const { boundsInView } = await import(pathToFileURL(tmpOut).href);
await unlink(tmpOut);

let failures = 0;
function check(label, actual, expected) {
  if (actual !== expected) {
    failures++;
    console.error(`✗ ${label}: oczekiwano ${expected}, otrzymano ${actual}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

// Kamera 772×356 (telefon, tura 6), wyśrodkowana na (0,0) świata dla czytelności:
// viewport = x∈[-386,386], y∈[-178,178].
const viewport = { x: -386, y: -178, w: 772, h: 356 };
const marginFactor = 0.5; // CAMERA.cullMarginFactor, domyślna wartość
const marginX = viewport.w * marginFactor; // 386
const marginY = viewport.h * marginFactor; // 178
// Obszar aktywny po marginesie: x∈[-772,772], y∈[-356,356].

// §1 — całkowicie poza kamerą, daleko poza marginesem.
check(
  "§1 obiekt całkowicie poza kamerą (1000px za prawą krawędzią)",
  boundsInView({ x: 2000, y: 0, w: 40, h: 40 }, viewport, marginX, marginY),
  false,
);

// §2 — dokładnie na krawędzi AKTYWNEGO obszaru (po marginesie): lewa krawędź
// obiektu styka się z prawą krawędzią obszaru, zero nachodzenia.
// Obszar aktywny kończy się na x=772. Obiekt zaczyna się DOKŁADNIE tam.
check(
  "§2 obiekt dokładnie na krawędzi (styka się, nie nachodzi)",
  boundsInView({ x: 772, y: 0, w: 40, h: 40 }, viewport, marginX, marginY),
  false,
);
check(
  "§2b jeden piksel WEWNĄTRZ granicy — już widoczny",
  boundsInView({ x: 771, y: 0, w: 40, h: 40 }, viewport, marginX, marginY),
  true,
);

// §3 — drzewo duże (TreeStampsBig, komórka C=160, TREE_STAMP_TRUNK_SLICE=32 —
// `src/world/TreeStampManifest.ts`). Geometria WPROST z `TreeLayer.ts`:
// canopy zajmuje y∈[anchorY-C, anchorY-32] = [anchorY-160, anchorY-32],
// trunk zajmuje y∈[anchorY-32, anchorY] — OBA tej samej szerokości 160 (ta sama
// kolumna X), różni je wyłącznie pasmo Y: pień przy samej ziemi (największe Y),
// korona nad nim. Gracz odszedł od drzewa w stronę kamery (na północ), więc
// `anchorY` drzewa wypadło POD dolną krawędzią obszaru aktywnego (356) — ale
// korona, sięgająca 128px w górę OD pnia, może wciąż nachodzić na obszar.
{
  const anchorY = 450; // linia gruntu drzewa, poza obszarem aktywnym (>356)
  const trunk = { x: 0, y: anchorY - 32, w: 160, h: 32 }; // y∈[418,450]
  const canopy = { x: 0, y: anchorY - 160, w: 160, h: 128 }; // y∈[290,418]
  check(
    "§3 pień dużego drzewa (przy ziemi, anchorY=450) POZA obszarem aktywnym",
    boundsInView(trunk, viewport, marginX, marginY),
    false,
  );
  check(
    "§3 korona TEGO SAMEGO drzewa (sięga 128px w górę od pnia) NACHODZI na obszar — musi zostać WIDOCZNA niezależnie od pnia",
    boundsInView(canopy, viewport, marginX, marginY),
    true,
  );
}

// §4 — całe drzewo (pień I korona) daleko poza obszarem aktywnym — nawet
// korona nie sięga wystarczająco wysoko, żeby nachodzić.
{
  const anchorY = 5000;
  const trunk = { x: 0, y: anchorY - 32, w: 160, h: 32 };
  const canopy = { x: 0, y: anchorY - 160, w: 160, h: 128 };
  check("§4 pień drzewa całkowicie poza viewportem", boundsInView(trunk, viewport, marginX, marginY), false);
  check("§4 korona drzewa całkowicie poza viewportem", boundsInView(canopy, viewport, marginX, marginY), false);
}

// §5 — krzew, realny wymiar `bush_dome_large.png` = 60×43 (tura 6).
// Origin (0.5,1) w grze — tu podajemy już przeliczony bounding box.
check(
  "§5 krzew (60×43) tuż za granicą aktywnego obszaru — niewidoczny",
  boundsInView({ x: 780, y: -200, w: 60, h: 43 }, viewport, marginX, marginY),
  false,
);
check(
  "§5b ten sam krzew 20px bliżej — nachodzi, widoczny",
  boundsInView({ x: 760, y: -200, w: 60, h: 43 }, viewport, marginX, marginY),
  true,
);

// §6 — kamień, realny wymiar `stone_glaz_01.png` = 54×46 (tura 6, zaokrąglone
// do najwyższego głazu z rodziny — 60×46 dla `stone_glaz_02`/`03`).
check(
  "§6 kamień (60×46) na granicy dolnej — poza (margines kończy się na y=356)",
  boundsInView({ x: 0, y: 356, w: 60, h: 46 }, viewport, marginX, marginY),
  false,
);
check(
  "§6b ten sam kamień 10px wyżej — nachodzi, widoczny",
  boundsInView({ x: 0, y: 346, w: 60, h: 46 }, viewport, marginX, marginY),
  true,
);

// §7 — pniak, realny wymiar `willow_stump_old.png` = 59×52 (najwyższy pniak
// w grze, tura 6).
check(
  "§7 pniak (59×52) daleko za górną granicą",
  boundsInView({ x: 0, y: -500, w: 59, h: 52 }, viewport, marginX, marginY),
  false,
);
check(
  "§7b ten sam pniak w obszarze aktywnym tuż nad viewportem (w marginesie)",
  boundsInView({ x: 0, y: -300, w: 59, h: 52 }, viewport, marginX, marginY),
  true,
);

// §8 — kilka obiektów naraz w różnej odległości od granicy, jeden przebieg —
// sprawdza, że wynik jednego obiektu nie zależy od kolejności/innych wywołań
// (funkcja jest czysta, bezstanowa — to jest właśnie to, co ta asercja dowodzi).
{
  const batch = [
    { label: "daleko w środku kadru", rect: { x: -20, y: -20, w: 40, h: 40 }, expected: true },
    { label: "w marginesie, blisko krawędzi obszaru", rect: { x: 700, y: 0, w: 40, h: 40 }, expected: true },
    { label: "tuż za granicą obszaru", rect: { x: 775, y: 0, w: 40, h: 40 }, expected: false },
    { label: "w rogu obszaru (x i y na granicy)", rect: { x: 740, y: 320, w: 40, h: 40 }, expected: true },
    { label: "poza rogiem obszaru (x i y za granicą)", rect: { x: 780, y: 360, w: 40, h: 40 }, expected: false },
  ];
  for (const { label, rect, expected } of batch) {
    check(`§8 ${label}`, boundsInView(rect, viewport, marginX, marginY), expected);
  }
}

console.log(`\n${failures === 0 ? "WSZYSTKO OK" : `${failures} BŁĘDÓW`}`);
process.exit(failures === 0 ? 0 : 1);

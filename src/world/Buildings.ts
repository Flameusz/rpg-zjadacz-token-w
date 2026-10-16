import type Phaser from "phaser";
import type { NavBox } from "../core/movement/NavGrid";

/**
 * ⭐ **BUDYNKI JAKO OBIEKTY TILED** (2026-10-09, `OI-164`; audyt
 * `docs/audyt_zagaje_swiat_2026-10-09.md` §B.4).
 *
 * Budynek to PROSTOKĄT w warstwie obiektów `budynki` (nazwa `budynek`), na
 * siatce kafli, z właściwościami opisanymi w `tools/houses3d.py` (typ, dach,
 * ściany, obrót, drzwi, okna, komin…). Ten moduł czyta z niego to, czego
 * potrzebuje GRA:
 * - **kolizję** — cały prostokąt jest lity (tak jak kafle `solid` K3: dach
 *   liczy się jako bryła domu),
 * - **model 3D** — `dom-<prefiks3d>-<id>` z `houses3d.glb`, postawiony
 *   środkiem krawędzi FRONTU, z obrotem (`WorldView3D`).
 * Detale (drzwi, okna…) czyta wyłącznie generator.
 *
 * ⚠ Do tej daty bryłę 3D wyprowadzano z PLAMY KAFLI elewacji — budynek nie
 * mógł się obrócić, a rozstaw wsi wynikał z rysunku 2D. Kafle budynków nadal
 * leżą na mapie (ścieżka `?widok2d`), ale w 3D gasną pod obiektem.
 */
export interface BuildingObject {
  /** Nazwa modelu w `houses3d.glb`. */
  model: string;
  /** Prostokąt na mapie (px świata). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Kierunek FRONTU w stopniach: 0 = południe (do kamery), 90 = wschód, 180 = północ, 270 = zachód. */
  obrot: 0 | 90 | 180 | 270;
  /** Właściwość `typ` z Tiled (chalupa, palisada, brama…) — do rysunku 2D. */
  typ: string;
  /** `kolizja: false` (brama nad drogą) — prostokąt nie blokuje. */
  lity: boolean;
}

export const WARSTWA_BUDYNKOW = "budynki";

const INSTANCES = new WeakMap<Phaser.Scene, BuildingObject[]>();

/** Właściwość MAPY `prefiks3d` — Phaser trzyma ją jako tablicę Tiled albo obiekt. */
function prefiksMapy(map: Phaser.Tilemaps.Tilemap): string | null {
  const p = map.properties as unknown;
  if (Array.isArray(p)) {
    const w = p.find((x: { name?: string }) => x?.name === "prefiks3d") as { value?: unknown } | undefined;
    return typeof w?.value === "string" ? w.value : null;
  }
  const v = (p as Record<string, unknown> | null)?.prefiks3d;
  return typeof v === "string" ? v : null;
}

/**
 * Obiekty warstwy `budynki` → budynki gry. Zapisuje je dla sceny (widok 3D)
 * i zwraca pudełka kolizji (jedno na budynek) do ciał statycznych i NavGridu.
 * ⚠ Obiekt z obrotem spoza 0/90/180/270 albo nie-prostokąt jest POMIJANY
 * z ostrzeżeniem — literówka w Tiled ma kosztować brak domu, nie mapę.
 */
export function readBuildings(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap): NavBox[] {
  const lista: BuildingObject[] = [];
  INSTANCES.set(scene, lista);
  const warstwa = map.objects.find((l) => l.name === WARSTWA_BUDYNKOW);
  if (!warstwa) return [];
  const prefiks = prefiksMapy(map);
  const zModelem = warstwa.objects.every((o) => ((o.properties ?? []) as { name: string }[]).some((p) => p.name === "model"));
  if (!prefiks && !zModelem && warstwa.objects.length) {
    console.warn(`[budynki] mapa ma warstwę „${WARSTWA_BUDYNKOW}”, ale nie ma właściwości „prefiks3d” — domy bez modeli 3D`);
  }
  const pudla: NavBox[] = [];
  for (const o of warstwa.objects) {
    const w = o.width ?? 0, h = o.height ?? 0;
    if (w <= 0 || h <= 0 || (o as { gid?: number }).gid) {
      console.warn(`[budynki] obiekt #${o.id} „${o.name}” nie jest prostokątem — pominięty`);
      continue;
    }
    const surowe = (o.properties ?? []) as { name: string; value: unknown }[];
    const props = Object.fromEntries(surowe.map((p) => [p.name, p.value]));
    const obrot = (((Number(props.obrot ?? 0) % 360) + 360) % 360) as BuildingObject["obrot"];
    if (![0, 90, 180, 270].includes(obrot)) {
      console.warn(`[budynki] obiekt #${o.id}: obrot ${props.obrot} (dozwolone 0/90/180/270) — pominięty`);
      continue;
    }
    // W sklejonym świecie obiekt niesie `model` (stare id z mapy członkowskiej).
    const model = typeof props.model === "string" ? props.model : `dom-${prefiks}-${o.id}`;
    const b: BuildingObject = { model, x: o.x ?? 0, y: o.y ?? 0, w, h, obrot,
      typ: String(props.typ ?? "chalupa"), lity: props.kolizja !== false };
    lista.push(b);
    if (b.lity) pudla.push({ x: b.x, y: b.y, w, h });
  }
  return pudla;
}

export const buildingsFor = (scene: Phaser.Scene): readonly BuildingObject[] => INSTANCES.get(scene) ?? [];

/** Środek krawędzi FRONTU (px) — punkt zaczepienia modelu. */
export function kotwicaFrontu(b: BuildingObject): { x: number; y: number } {
  switch (b.obrot) {
    case 90: return { x: b.x + b.w, y: b.y + b.h / 2 };
    case 180: return { x: b.x + b.w / 2, y: b.y };
    case 270: return { x: b.x, y: b.y + b.h / 2 };
    default: return { x: b.x + b.w / 2, y: b.y + b.h };
  }
}

/**
 * Ścieżka awaryjna `?widok2d`: obiekt BEZ kafli pod sobą (palisada, brama —
 * budynki z ery kafli mają tam swoją elewację) dostaje płaski zarys, żeby
 * kolizja nie była niewidzialną ścianą. W 3D nie rysuje się nic z tego.
 */
export function rysujBezKafli2D(scene: Phaser.Scene, kafle: Phaser.Tilemaps.TilemapLayer[], glebokosc: number): void {
  for (const b of buildingsFor(scene)) {
    const tx0 = b.x / 32, ty0 = b.y / 32, tx1 = (b.x + b.w) / 32, ty1 = (b.y + b.h) / 32;
    let ma = false;
    for (const l of kafle) {
      if (!/^buildings/.test(l.layer.name)) continue;
      for (let y = ty0; y < ty1 && !ma; y++) for (let x = tx0; x < tx1 && !ma; x++) ma = !!l.getTileAt(x, y);
    }
    if (ma) continue;
    const kolor = b.typ === "brama" ? 0x6b4a30 : 0x7a5634;
    scene.add.rectangle(b.x, b.y, b.w, b.h, kolor, b.lity ? 0.95 : 0.5).setOrigin(0, 0).setDepth(glebokosc + b.y + b.h);
  }
}

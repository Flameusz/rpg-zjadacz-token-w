import Phaser from "phaser";
import { SWIAT } from "../config/GameConfig";

/**
 * ⭐⭐ **OTWARTY ŚWIAT — sklejanie map z pliku świata Tiled** (2026-10-09, etap 2).
 *
 * Decyzja autora: świat to jedna przestrzeń, obszary (wieś, las…) leżą obok
 * siebie w pliku `.world` Tiled (ten sam, który edytor pokazuje jako jeden
 * ciągły teren), a przejście między nimi jest PŁYNNE — ekran ładowania tylko
 * dla wnętrz i lochów.
 *
 * Ten moduł skleja mapy członkowskie w JEDNĄ mapę Tiled w pamięci, zanim
 * Phaser ją zbuduje. Reszta silnika (kolizje, NavGrid, spawny, widok 3D,
 * budynki-obiekty) widzi jedną mapę — dokładnie tak jak przedtem.
 *
 * - **Tilesety DOKLEJANE kopiami** (każda mapa zachowuje swoje gidy i swoje
 *   właściwości kafli, gidy przesunięte o nowe `firstgid`). Powtórzoną nazwę
 *   `TiledMap` już dziś łączy (kształty kolizji scalane po nazwie).
 * - **Warstwy łączone po NAZWIE**, kolejność rysowania z obu map zachowana.
 * - **Obiekty** przesunięte o pozycję mapy, nowe `id`; budynek dostaje
 *   właściwość `model` (`dom-<prefiks3d>-<stare id>`), bo jego model w
 *   `houses3d.glb` jest nazwany starym id. Portale MIĘDZY mapami świata
 *   znikają (przejście jest płynne); punkt `player` zostaje tylko z PIERWSZEJ
 *   mapy pliku świata.
 * - **Pola świata poza mapami** → warstwa obiektów `pustka` (prostokąty), lita
 *   jak krawędź mapy (`TiledMap`).
 */

export interface WorldRegion {
  /** Id mapy członkowskiej (`MAP_BY_ID`), np. `village`. */
  id: string;
  /** Prostokąt w pikselach świata. */
  x: number; y: number; w: number; h: number;
}

type TiledJson = {
  width: number; height: number; tilewidth: number; tileheight: number;
  layers: TiledLayer[]; tilesets: { firstgid: number; tilecount?: number; name: string; [k: string]: unknown }[];
  properties?: { name: string; type: string; value: unknown }[];
  nextobjectid?: number; nextlayerid?: number;
  [k: string]: unknown;
};
type TiledObject = {
  id: number; name?: string; x: number; y: number; gid?: number;
  properties?: { name: string; type: string; value: unknown }[]; [k: string]: unknown;
};
type TiledLayer = {
  name: string; type: string; data?: number[]; objects?: TiledObject[]; width?: number; height?: number;
  [k: string]: unknown;
};

export const WARSTWA_PUSTKI = "pustka";
const FLAGI = 0xe0000000;

const REGIONY = new Map<string, WorldRegion[]>();
/** Obszary świata zbudowanego pod kluczem mapy (do dźwięku tła, minimapy, zapisu). */
export const regionsOf = (worldKey: string): readonly WorldRegion[] => REGIONY.get(worldKey) ?? [];
/** Prostokąty pustki świata (px) — pola bez mapy; kadr ich nie pokazuje (`VoidFraming`). */
const PUSTKI = new Map<string, { x: number; y: number; w: number; h: number }[]>();
export const voidsOf = (worldKey: string): readonly { x: number; y: number; w: number; h: number }[] => PUSTKI.get(worldKey) ?? [];

/**
 * Skleja świat i wkłada wynik do pamięci podręcznej map pod `worldKey`.
 * `members` — id mapy po nazwie pliku (`village-zagaje.tmj` → `village`).
 * Zwraca `false`, gdy plik świata albo któraś mapa się nie wczytała (gra
 * wtedy wraca do pojedynczych map — „gra zawsze się uruchamia").
 */
export function composeWorld(
  scene: Phaser.Scene, worldJsonKey: string, worldKey: string,
  members: Record<string, { mapKey: string; id: string }>,
): boolean {
  if (scene.cache.tilemap.has(worldKey)) return true;
  const world = scene.cache.json.get(worldJsonKey) as { maps?: { fileName: string; x: number; y: number }[] } | undefined;
  if (!world?.maps?.length) return false;
  const czesci: { id: string; dx: number; dy: number; m: TiledJson }[] = [];
  for (const e of world.maps) {
    const plik = e.fileName.split("/").pop()!;
    const mem = members[plik];
    const wpis = mem && scene.cache.tilemap.get(mem.mapKey) as { data?: TiledJson } | undefined;
    if (!mem || !wpis?.data) {
      console.warn(`[świat] „${plik}” nie jest wczytaną mapą członkowską — świat pominięty`);
      return false;
    }
    czesci.push({ id: mem.id, dx: e.x, dy: e.y, m: wpis.data });
  }
  const TW = czesci[0].m.tilewidth, TH = czesci[0].m.tileheight;
  for (const c of czesci) {
    if (c.m.tilewidth !== TW || c.m.tileheight !== TH || c.dx % TW || c.dy % TH) {
      console.warn(`[świat] „${c.id}”: inny kafel albo przesunięcie poza siatką — świat pominięty`);
      return false;
    }
  }
  const W = Math.max(...czesci.map((c) => c.dx / TW + c.m.width));
  const H = Math.max(...czesci.map((c) => c.dy / TH + c.m.height));
  const idsCzlonkow = new Set(czesci.map((c) => c.id));

  // ── tilesety: doklejone kopie, nowe firstgid ──
  const tilesets: TiledJson["tilesets"] = [];
  const remap: ((g: number) => number)[] = [];
  let nastepny = 1;
  for (const c of czesci) {
    const stare = [...c.m.tilesets].sort((a, b) => a.firstgid - b.firstgid);
    const przes: { od: number; delta: number }[] = [];
    for (const t of stare) {
      const ile = Number(t.tilecount ?? 0) || 1;
      przes.push({ od: t.firstgid, delta: nastepny - t.firstgid });
      tilesets.push({ ...t, firstgid: nastepny });
      nastepny += ile;
    }
    remap.push((g0: number) => {
      const g = g0 & ~FLAGI;
      if (!g) return 0;
      let d = 0;
      for (const p of przes) if (g >= p.od) d = p.delta;
      return ((g + d) | (g0 & FLAGI)) >>> 0;
    });
  }

  // ── warstwy: po nazwie, kolejność z obu map ──
  const kolejnosc: string[] = [];
  for (const c of czesci) {
    let po = -1;
    for (const l of c.m.layers) {
      const i = kolejnosc.indexOf(l.name);
      if (i >= 0) { po = i; continue; }
      kolejnosc.splice(po + 1, 0, l.name);
      po += 1;
    }
  }
  const warstwy = new Map<string, TiledLayer>();
  let nid = 1;
  let lid = 1;
  for (const nazwa of kolejnosc) {
    const wzor = czesci.map((c) => c.m.layers.find((l) => l.name === nazwa)).find(Boolean)!;
    const nowa: TiledLayer = { ...wzor, id: lid++, x: 0, y: 0 };
    if (wzor.type === "tilelayer") {
      nowa.width = W; nowa.height = H;
      nowa.data = new Array(W * H).fill(0);
    } else if (wzor.type === "objectgroup") {
      nowa.objects = [];
    }
    warstwy.set(nazwa, nowa);
  }
  czesci.forEach((c, ci) => {
    const ox = c.dx / TW, oy = c.dy / TH;
    const prefiks = c.m.properties?.find((p) => p.name === "prefiks3d")?.value;
    for (const l of c.m.layers) {
      const cel = warstwy.get(l.name)!;
      if (l.type === "tilelayer" && l.data && cel.data) {
        const w = c.m.width;
        for (let i = 0; i < l.data.length; i++) {
          if (!l.data[i]) continue;
          const x = (i % w) + ox, y = Math.floor(i / w) + oy;
          cel.data[y * W + x] = remap[ci](l.data[i]);
        }
      } else if (l.type === "objectgroup" && l.objects && cel.objects) {
        for (const o of l.objects) {
          const nazwa = (o.name ?? "").toLowerCase();
          if (nazwa === "player" && ci > 0) continue;
          if (nazwa === "portal" && idsCzlonkow.has(String(o.properties?.find((p) => p.name === "target")?.value))) continue;
          const n: TiledObject = { ...o, id: nid++, x: o.x + c.dx, y: o.y + c.dy };
          if (o.gid) n.gid = remap[ci](o.gid);
          if (l.name === "budynki" && prefiks) {
            n.properties = [...(o.properties ?? []), { name: "model", type: "string", value: `dom-${prefiks}-${o.id}` }];
          }
          cel.objects.push(n);
        }
      }
    }
  });

  // ── pustka: pola świata, których nie pokrywa żadna mapa ──
  const pokryte = new Uint8Array(W * H);
  for (const c of czesci) {
    for (let y = 0; y < c.m.height; y++) for (let x = 0; x < c.m.width; x++) pokryte[(y + c.dy / TH) * W + x + c.dx / TW] = 1;
  }
  const pustka: TiledObject[] = [];
  const zajete = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (pokryte[i] || zajete[i]) continue;
      let x1 = x;
      while (x1 + 1 < W && !pokryte[y * W + x1 + 1] && !zajete[y * W + x1 + 1]) x1++;
      let y1 = y;
      const wolnyRzad = (yy: number) => {
        for (let xx = x; xx <= x1; xx++) if (pokryte[yy * W + xx] || zajete[yy * W + xx]) return false;
        return true;
      };
      while (y1 + 1 < H && wolnyRzad(y1 + 1)) y1++;
      for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) zajete[yy * W + xx] = 1;
      pustka.push({ id: nid++, name: "pustka", x: x * TW, y: y * TH, width: (x1 - x + 1) * TW, height: (y1 - y + 1) * TH });
    }
  }
  const lista = [...warstwy.values()];
  if (pustka.length) lista.push({ name: WARSTWA_PUSTKI, type: "objectgroup", id: lid++, objects: pustka, visible: true, opacity: 1, x: 0, y: 0 });

  const wynik: TiledJson = {
    ...czesci[0].m, width: W, height: H, layers: lista, tilesets,
    properties: (czesci[0].m.properties ?? []).filter((p) => p.name !== "prefiks3d"),
    nextobjectid: nid, nextlayerid: lid,
  };
  scene.cache.tilemap.add(worldKey, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: wynik });
  REGIONY.set(worldKey, czesci.map((c) => ({ id: c.id, x: c.dx, y: c.dy, w: c.m.width * TW, h: c.m.height * TH })));
  PUSTKI.set(worldKey, pustka.map((o) => ({ x: Number(o.x ?? 0), y: Number(o.y ?? 0), w: Number(o.width ?? 0), h: Number(o.height ?? 0) })));
  return true;
}

/**
 * Przesunięcie (px) mapy członkowskiej `mapId` w świecie — prosto z pliku świata,
 * bez sklejania (scena potrzebuje go w `init`, przed budową mapy). `null`, gdy
 * mapa nie należy do świata albo plik świata się nie wczytał.
 */
export function przesuniecieWSwiecie(scene: Phaser.Scene, mapId: string): { x: number; y: number } | null {
  const world = scene.cache.json.get(SWIAT.jsonKey) as { maps?: { fileName: string; x: number; y: number }[] } | undefined;
  for (const e of world?.maps ?? []) {
    const mem = SWIAT.czlonkowie[e.fileName.split("/").pop()!];
    if (mem?.id === mapId) return { x: e.x, y: e.y };
  }
  return null;
}

/** Obszar świata pod punktem (px), albo `null`. */
export function regionAt(worldKey: string, x: number, y: number): WorldRegion | null {
  for (const r of regionsOf(worldKey)) if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r;
  return null;
}

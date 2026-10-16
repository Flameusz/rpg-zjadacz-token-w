import Phaser from "phaser";
import { NavGrid, type NavBox } from "../core/movement/NavGrid";
import { ASSETS, MAPS, DEPTH, WORLD, DECOR_PROPS, type DecorId } from "../config/GameConfig";
import { missingAssets } from "../core/Assets";
import { occludersFor } from "../core/Occluders";
import { buildTreeLayer } from "./TreeLayer";
import { readBuildings, WARSTWA_BUDYNKOW } from "./Buildings";
import { WARSTWA_PUSTKI, regionsOf } from "./WorldComposer";
import type { BuiltMap } from "./MapBuilder";
import type { EnemyType } from "../entities/Enemy";
import type { NpcId } from "../core/Npcs";
import type { HerbId } from "../entities/Gatherable";
import type { FarmAnimalSpecies } from "../entities/FarmAnimal";

/** Which well art a spawn point asks for — see `ASSETS.well`/`wellSmall`. */
export type WellVariant = "big" | "small";

/** A well the map placed, with the variant its object name asked for. */
export interface WellSpawn {
  pos: Phaser.Math.Vector2;
  variant: WellVariant;
}

/** A typed enemy spawn read from the map's object layer. */
export interface EnemySpawn {
  kind: EnemyType;
  pos: Phaser.Math.Vector2;
}

/**
 * Loads a map authored in Tiled (https://mapeditor.org) exported as JSON.
 *
 * ── Export settings the file must satisfy ─────────────────────────────────
 *   • JSON (.tmj/.json) — Phaser cannot read .tmx.
 *   • Tile Layer Format = CSV. Base64+zlib/gzip silently yields an empty map;
 *     Phaser ships no decompressor.
 *   • Infinite = off (chunked data is a different, unsupported shape here).
 *   • "Embed Tileset" — Phaser refuses external .tsx references outright.
 *   • Tileset named MAPS.natureTilesetName; that name is how the Tiled data is
 *     joined to our loaded PNG (the `image` path inside the file is ignored).
 *
 * Nature.png drops in as a tileset with zero re-slicing: its verified layout
 * (32px tiles on a 33px pitch) is exactly margin=0 / spacing=1.
 *
 * ── Why collision is computed here instead of setCollisionFromCollisionGroup ─
 * Phaser collides tile layers independently, so a walkable bridge painted over
 * solid water would still block — each layer answers for itself. Instead we
 * flatten the stack first: for every cell the TOPMOST non-empty tile decides
 * whether that cell is passable. Bridge over water then works with no special
 * cases, and the same rule covers a gap painted into a wall.
 *
 * Arcade physics has no per-shape tile collision (that's a Matter feature), so
 * shapes drawn in Tiled's Tile Collision Editor are reduced to their bounding
 * box and emitted as individual static bodies — which is what lets a tree
 * collide only on its trunk rather than its whole 32×32 cell.
 */

/** A rectangle body to create, in pixels relative to the tile's top-left. */
interface TileBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A point that hands the player off to another map. `target` is a short map
 * id (a key into `MAP_BY_ID` in GameConfig, e.g. "village"), not the Tiled
 * tileset/texture key — the object only knows where it wants to send the
 * player, not how that map's assets are loaded.
 *
 * `spawnX`/`spawnY` are in the TARGET map's own pixel space, authored a few
 * tiles past that map's own portal back the other way — walking through a
 * gate must not land the player standing inside the return trigger, or
 * arriving would immediately bounce back where they came from.
 */
export interface PortalSpawn {
  pos: Phaser.Math.Vector2;
  target: string;
  spawnX: number;
  spawnY: number;
  /**
   * Which way the entrance marker's chevron points — the direction the player
   * leaves through. Optional in Tiled (`dir` = up/down/left/right); when
   * absent it is DERIVED from which map edge the portal sits nearest.
   *
   * The derivation is right for every gate that exists today (both are on a
   * road running off the edge of the map) and will be wrong for the first
   * transition that isn't — a cottage door in the middle of the village has
   * no edge to point at. That is exactly why the property exists: the default
   * covers the common case for free, and the odd one out says so in the map
   * rather than needing a code change.
   */
  dir: "up" | "down" | "left" | "right";
}

export interface TiledBuiltMap extends BuiltMap {
  /** Typed enemy spawn points read from an object layer (may be empty). */
  enemySpawns: EnemySpawn[];
  /** Campfire spawn points (may be empty — GameScene falls back to placing
   *  one near the merchant when the map authors none). Any number allowed,
   *  so a map can scatter several cooking spots around. */
  campfireSpawns: Phaser.Math.Vector2[];
  /** Points named "kolo"/"kolo_mlynskie"/"waterwheel" — the mill's wheel. */
  waterwheelSpawns: Phaser.Math.Vector2[];
  /**
   * Where the map wants each talkable NPC to stand, keyed by `NpcId`. Absent
   * means "this map doesn't have that person", which is the normal case —
   * the forest authors only the Hunter, the village authors everyone else.
   *
   * **One table, not one field per villager.** Each NPC used to own a
   * `<name>Spawn` field here, an `else if` branch in `readSpawns` and an
   * `if (map.<name>Spawn)` line in `GameScene` — three edits per person, in
   * three files, none of which fails loudly when you forget one. Adding eight
   * residents at once is what made that untenable; `NPC_OBJECT_NAMES` below is
   * now the single place an object name becomes a villager, and `CLAUDE.md`'s
   * promise that "a new NPC is a config block plus a spawn point" is finally
   * literally true.
   *
   * Authored placement matters as soon as a map has buildings: a procedural
   * search knows only about map proportions and solid terrain, so it will
   * happily park a shopkeeper in a field 250px from his own cabin. The Hunter
   * is the one exception, keeping a procedural fallback in GameScene — see
   * `pickMerchantSpot`, which is also the campfire's anchor.
   */
  npcSpawns: Partial<Record<NpcId, Phaser.Math.Vector2>>;
  /**
   * Wells the map authored — static landmarks, not NPCs. Empty means the map
   * doesn't have one; unlike the merchant there is no procedural fallback,
   * since a well only makes sense at an authored plaza, never guessed from
   * open ground.
   *
   * A LIST with a `variant`, not one nullable point, because there are two
   * different wells (see `ASSETS.well`/`wellSmall`): a 64px landmark and a
   * 32px one-tile prop. A single slot would have forced a map to pick one and
   * only one, which is the wrong constraint for a prop — a village can
   * plausibly have a plaza well and a yard well.
   */
  wellSpawns: WellSpawn[];
  /**
   * Herb stanowiska, grouped by species — the pool `NodeSpawner` grows plants
   * out of. A species with no key here simply doesn't occur on this map, which
   * is the normal case and is itself content: pokrzywa belongs to yards and
   * forest edges, dziurawiec to sunny glades, and neither should turn up
   * everywhere just because the map had room.
   */
  herbNodes: Partial<Record<HerbId, Phaser.Math.Vector2[]>>;
  /**
   * Ambient farm-animal spawn points, grouped by species — pure set
   * dressing (chicken/cow/pig/sheep, see `FarmAnimal`): no gameplay state,
   * no persistence, GameScene just spawns
   * one wandering animal per point. Same "absent means content, not a bug"
   * rule as `herbNodes` — a map authoring no `pig` points simply has no
   * pigs, same as it having no `pokrzywa` points means no nettle there.
   */
  farmAnimalSpawns: Partial<Record<FarmAnimalSpecies, Phaser.Math.Vector2[]>>;
  /**
   * Every static decoration prop the map authored, grouped by kind — the
   * drying rack, haycock, scarecrow, stump, mushrooms, pond edge and lily
   * pad. See `DECOR_PROPS` in GameConfig for the single table that defines
   * both the accepted Tiled object names and the art each one draws, and
   * for why these are one field instead of seven parallel ones.
   */
  decorSpawns: Partial<Record<DecorId, Phaser.Math.Vector2[]>>;
  /**
   * "bird"/"ptak" points — forest ambient decoration (see `Bird`, `BIRD` in
   * GameConfig). NOT part of `decorSpawns` despite looking similar: a
   * `Bird` is an entity that self-schedules its own hops, not a static
   * image, and `DECOR_PROPS`'s comment is explicit that anything with
   * behaviour keeps its own spawn path.
   */
  birdSpawns: Phaser.Math.Vector2[];
  /** Map-to-map transition points (may be empty — most maps have none). */
  portals: PortalSpawn[];
  /** ⭐ Punkty celów `reach`: obiekt `miejsce`/`quest_spot` z właściwością `id`
   *  (2026-10-12, Kirka). Klucz = `id`, wartość = pozycja w świecie. */
  questSpots: Record<string, Phaser.Math.Vector2>;
  /** ⭐ Zwierzęta z imieniem (`NAMED_ANIMAL_OBJECTS`): nazwa obiektu → gatunek i dom. */
  namedAnimals: Record<string, { species: FarmAnimalSpecies; pos: Phaser.Math.Vector2 }>;
  /**
   * True when an object layer came through with at least one object in it.
   *
   * The only reason this exists: **an empty `enemySpawns` is ambiguous.** It
   * means either "this map deliberately has no enemies" or "this map's object
   * layer didn't survive the export" — and GameScene's three-rabbit fallback is
   * written for the second. Without this flag the two are indistinguishable, so
   * the safety net fired on a peaceful village and put wild animals on the
   * plaza. Any object at all settles it: the layer either exported or it didn't.
   */
  hasObjectLayer: boolean;
  /**
   * How many trees `buildTreeLayer` rendered from `trees` tile objects — 0 on
   * every map that still keeps its trees in the `trees-base`/`trees-over` tile
   * layers (all of them today except the `tree_proto` prototype). Exposed for
   * QA (`window.dev`) and the eventual forest migration — `docs/tree_instances.md`.
   */
  treeCount: number;
}

/**
 * Object name in Tiled (lower-cased) → the `NpcId` it spawns.
 *
 * **The single place a point object becomes a villager.** Each NPC used to be
 * its own `else if` here plus its own field plus its own line in GameScene;
 * adding eight residents in one go turned that into 24 edits nobody could
 * check, so it is a table now and the rest is a loop.
 *
 * Both an English and a Polish name are accepted for everyone, because the
 * maps are authored in Polish (`tools/build_wioska.py`) while the ids are
 * English — and a point named `zielarka` silently doing nothing is the exact
 * class of failure that keeps costing time here. Add a new resident by adding
 * a row; nothing else in this file needs to change.
 */
const NPC_OBJECT_NAMES: Record<string, NpcId> = {
  merchant: "hunter",
  hunter: "hunter",
  mysliwy: "hunter",
  blacksmith: "blacksmith",
  kowal: "blacksmith",
  peasant: "peasant",
  rolnik: "peasant",
  dobek: "peasant",
  miller: "miller",
  mlynarz: "miller",
  milosz: "miller",
  elder: "elder",
  soltys: "elder",
  dobieslaw: "elder",
  father: "father",
  ojciec: "father",
  marko: "father",
  mother: "mother",
  matka: "mother",
  alina: "mother",
  herbalist: "herbalist",
  zielarka: "herbalist",
  dorota: "herbalist",
  widow: "widow",
  wdowa: "widow",
  zofia: "widow",
  // docs/wioska_plan.md §6's "rozmowa" tier.
  hanna: "hanna",
  witek: "witek",
  kuba: "kuba",
  sulislaw: "sulislaw",
  agata: "agata",
  dobrawa: "dobrawa",
  sobek: "sobek",
  stolarz: "sobek",
  gniewko: "gniewko",
  pasterz: "gniewko",
  /** ⚠ `anna` i `hanna` różnią się jedną literą, a obie są tu prawdziwymi
   *  nazwami obiektów. Literówka w Tiled da po cichu NIE TĘ postać, a nie
   *  ostrzeżenie o nieznanej nazwie — jedyny taki przypadek w tej tabeli. */
  anna: "anna",
  patryczek: "patryczek",
  innkeeper: "innkeeper",
  karczmarz: "innkeeper",
  bogusz: "innkeeper",
  adrian: "adrian",
  czeladnik: "adrian",
  apprentice: "adrian",
  ciechan: "ciechan",
  drwal: "ciechan",
  woodcutter: "ciechan",
  bolko: "bolko",
  zbych: "zbych",
};

/**
 * Object name in Tiled → the herb species that may grow there.
 *
 * A point here is a **stanowisko**, not a plant: it says "this species is
 * allowed to grow at this spot", and `NodeSpawner` keeps only about a third of
 * them grown at once. So place generously — 3–4× as many as you want to see.
 *
 * **Place them against the real habitat**, which is written per species in
 * `HERBS[*].siedlisko`. That is the whole point of the feature: Dorota tells
 * the player where a plant grows in the real world, and a map that contradicts
 * her turns a small piece of teaching into a small lie.
 *
 * Recommended: their own object layer (`rosliny`). `readSpawns` walks EVERY
 * object layer, so it costs nothing in code and it keeps fifty herb points from
 * burying `player`, `portal` and the enemy spawns in Tiled's object list.
 */
/**
 * Which way a portal's entrance marker points: the map's own `dir` property if
 * it has one, otherwise the NEAREST EDGE.
 *
 * The fallback is not a guess dressed up as a rule — it is exactly true for a
 * gate standing on a road that runs off the map, which is what every portal is
 * today. It stops being true for the first door or cave mouth inland, and the
 * explicit property is how that one says so. An unrecognised value falls back
 * to the derivation rather than throwing: a typo in Tiled should cost a
 * slightly wrong arrow, not a map that won't load.
 */
function portalDir(
  raw: unknown,
  pos: Phaser.Math.Vector2,
  mapW: number,
  mapH: number,
): PortalSpawn["dir"] {
  const named = String(raw ?? "").toLowerCase();
  if (named === "up" || named === "down" || named === "left" || named === "right") return named;
  const toEdge = { up: pos.y, down: mapH - pos.y, left: pos.x, right: mapW - pos.x };
  return (Object.keys(toEdge) as PortalSpawn["dir"][]).reduce((a, b) =>
    toEdge[a] <= toEdge[b] ? a : b,
  );
}

const HERB_OBJECT_NAMES: Record<string, HerbId> = {
  babka: "babka",
  babka_lancetowata: "babka",
  krwawnik: "krwawnik",
  pokrzywa: "pokrzywa",
  rumianek: "rumianek",
  dziurawiec: "dziurawiec",
  lebiodka: "lebiodka",
  wrotycz: "wrotycz",
  mieta: "mieta",
  nawloc: "nawloc",
  dziewanna: "dziewanna",
  zywokost: "zywokost",
};

/**
 * Object name in Tiled → ambient farm-animal species (see `FarmAnimal`).
 * Both an English and a Polish spelling, same reason as `NPC_OBJECT_NAMES`.
 */
const FARM_ANIMAL_OBJECT_NAMES: Record<string, FarmAnimalSpecies> = {
  chicken: "chicken",
  kura: "chicken",
  cow: "cow",
  krowa: "cow",
  pig: "pig",
  swinia: "pig",
  sheep: "sheep",
  owca: "sheep",
  cat: "cat",
  kot: "cat",
  bull: "bull",
  byk: "bull",
  ram: "ram",
  baran: "ram",
  // Psy (2026-10-11); owczarki Gniewka przy stadzie. ⚠ `kirci` NIE stoi tu od
  // 2026-10-12 — Kirka jest zwierzęciem z imieniem (`NAMED_ANIMAL_OBJECTS`).
  dog: "dog",
  pies: "dog",
  sheepdog: "sheepdog",
  owczarek: "sheepdog",
};

/**
 * ⭐ Zwierzę „z imieniem" (2026-10-12): jeden konkretny osobnik, którego
 * obecność zależy od stanu gry — dziś Kirka (`KIRKA`), która znika, dopóki
 * gracz jej nie zwabi. Nie trafia do `farmAnimalSpawns`, bo scena musi wiedzieć,
 * KTÓRY to pies; stawia go `QuestSpots`.
 */
const NAMED_ANIMAL_OBJECTS: Record<string, FarmAnimalSpecies> = {
  kirci: "dog",
};

/**
 * Tiled object name → static decoration prop, DERIVED from `DECOR_PROPS`
 * rather than hand-written. That table already lists each prop's accepted
 * names next to its art; duplicating them here as a second literal is
 * exactly the drift `DECOR_PROPS`'s own comment exists to prevent.
 */
const DECOR_BY_OBJECT_NAME: Record<string, DecorId> = Object.fromEntries(
  (Object.entries(DECOR_PROPS) as [DecorId, (typeof DECOR_PROPS)[DecorId]][]).flatMap(
    ([id, def]) => def.names.map((n) => [n, id] as const),
  ),
);

/**
 * Tileset name *inside* the Tiled file → the texture key we loaded that sheet
 * under. **The name is the join, not the image path** — rename a tileset in
 * Tiled and its tiles stop drawing until this table is updated.
 *
 * Lives here rather than in GameConfig so it can reference ASSETS directly
 * (MAPS is declared long before ASSETS in that file, so it cannot).
 */
const TILESET_TEXTURES: Record<string, string> = {
  Teren: ASSETS.teren.key,
  Nature: ASSETS.nature.key,
  Buildings: ASSETS.buildings.key,
  Kuznia: ASSETS.kuznia.key,
  // Forest tree atlas — accepted hand-cut stamps (tools/build_forrest_atlas.py).
  // Two spellings, same reason as Pole/pole_tileset below: Tiled names a new
  // tileset after its image file ("forrest") unless renamed to "Forrest".
  Forrest: ASSETS.forrest.key,
  forrest: ASSETS.forrest.key,
  // Forest tree stamps — editor repack of forrest.png (tools/build_tree_stamps.py).
  // Only referenced by TILE OBJECTS on a `trees` object layer, never a tile
  // layer; `buildTreeLayer` turns each such object into a rendered tree. Both
  // spellings, same reason as Forrest above.
  TreeStamps: ASSETS.treeStamps.key,
  tree_stamps: ASSETS.treeStamps.key,
  // Wielkie stemple (wierzba duża) — osobny arkusz 160×160, patrz
  // ASSETS.treeStampsBig. `buildTreeLayer` renderuje z obu tilesetów.
  TreeStampsBig: ASSETS.treeStampsBig.key,
  tree_stamps_big: ASSETS.treeStampsBig.key,
  // Forest ground — recoloured Teren grass strip (tools/build_forest_ground.py).
  // Both spellings, same reason as Forrest: Tiled names a new tileset after its
  // image file ("forest_ground_final") unless renamed to "ForestGround".
  ForestGround: ASSETS.forestGround.key,
  forest_ground_final: ASSETS.forestGround.key,
  // Forest transitions — water/sand/path edge tiles with baked grass punched to
  // alpha (tools/build_terrain_forest_transitions.py). Both spellings, same
  // reason: Tiled would name it "terrain_forest_transitions" after the file.
  ForestTransitions: ASSETS.forestTransitions.key,
  terrain_forest_transitions: ASSETS.forestTransitions.key,
  // Crops. TWO names for one sheet, deliberately: Tiled names a new tileset
  // after its image file, so adding `pole_tileset.png` yields "pole_tileset"
  // unless whoever adds it remembers to rename it — and a tileset name that
  // doesn't match is the failure where the tiles just don't draw. Same reason
  // NPC_OBJECT_NAMES above accepts both an English and a Polish spelling.
  Pole: ASSETS.pole.key,
  pole_tileset: ASSETS.pole.key,
  // Roadside furniture — signposts at the map gates. Both spellings, same
  // reason as Pole above: Tiled would name it after the file.
  Znaki: ASSETS.znaki.key,
  znaki: ASSETS.znaki.key,
};

/**
 * ⭐ Ostrzeżenia ostatnio zbudowanej mapy — do odczytu w dev-buildzie przez
 * `window.dev.mapWarnings()` (2026-10-11, `OI-76`/`OI-78`). Silnik ostrzegał
 * o nieznanym tilesecie i nierozpoznanej nazwie obiektu już wcześniej, ale
 * tylko w konsoli — czyli w miejscu, którego po zmianie mapy nikt nie czyta.
 * Lista pozwala sprawdzić mapę jedną liczbą, obok `dev.missing()`.
 *
 * ⛔ Nie przymiar offline: tamten musiałby powtórzyć łańcuch rozpoznawania
 * nazw z `buildTiledMap`, czyli zbudować lustro, które rozjedzie się z grą
 * przy pierwszej nowej nazwie. Tu liczy dokładnie ten kod, który buduje mapę.
 */
export const mapWarnings: string[] = [];

function ostrzez(msg: string): void {
  console.warn(msg);
  mapWarnings.push(msg);
}

/** True if the map JSON loaded and we can actually build it. */
export function canBuildTiledMap(scene: Phaser.Scene, key: string): boolean {
  // The real tileset PNG is required: a colour placeholder has the wrong
  // dimensions, so every tile index would resolve to garbage. Only the terrain
  // sheet is checked — see MAPS.requiredTilesetName for why props are optional.
  if (missingAssets.has(ASSETS.teren.key)) return false;
  return scene.cache.tilemap.exists(key);
}

export function buildTiledMap(scene: Phaser.Scene, key: string): TiledBuiltMap | null {
  // Lista opisuje mapę budowaną TERAZ — świat skleja się w jedną mapę, a każde
  // przejście bramą buduje następną od zera.
  mapWarnings.length = 0;
  const map = scene.make.tilemap({ key });

  // ── Bind every tileset we recognise, by NAME ───────────────────────────
  //
  // A map may reference several sheets (terrain + buildings + …). Anything not
  // in TILESET_TEXTURES, or whose PNG didn't load, is skipped with a warning
  // rather than fatally: the map still builds, just without those tiles. Only
  // the terrain sheet is non-negotiable (see MAPS.requiredTilesetName).
  //
  // Tiled can also embed the SAME sheet several times (re-adding the image, or
  // embedding an already-embedded tileset). Every copy is the same sheet at a
  // different firstgid, so all copies get bound — and their collision shapes
  // are merged by name below, because Tiled saves a shape onto whichever copy
  // was open when it was drawn, which may not be the copy the painted tiles
  // actually reference.
  const tilesets: Phaser.Tilemaps.Tileset[] = [];
  const seen = new Map<string, number>();
  for (const ts of map.tilesets) {
    const textureKey = TILESET_TEXTURES[ts.name];
    if (!textureKey) {
      ostrzez(
        `[map] "${key}" uses tileset "${ts.name}", which this game doesn't know. ` +
          `Add it to TILESET_TEXTURES (and load its PNG) or those tiles won't draw.`,
      );
      continue;
    }
    if (missingAssets.has(textureKey)) {
      ostrzez(`[map] Tileset "${ts.name}" skipped — ${textureKey}.png didn't load.`);
      continue;
    }
    ts.setImage(scene.textures.get(textureKey));
    tilesets.push(ts);
    seen.set(ts.name, (seen.get(ts.name) ?? 0) + 1);
  }

  if (!tilesets.some((t) => t.name === MAPS.requiredTilesetName)) {
    ostrzez(
      `[map] Tileset "${MAPS.requiredTilesetName}" not found in "${key}". ` +
        `Rename it in Tiled, or update MAPS.requiredTilesetName to match.`,
    );
    return null;
  }
  // ⚠ Sklejony świat (`WorldComposer`) niesie po kopii tilesetu z KAŻDEJ mapy
  // członkowskiej — to budowa, nie bałagan w Tiled. Ostrzegamy dopiero ponad
  // liczbę członków (zmierzone 2026-10-11: sześć fałszywych alarmów na świecie).
  const dozwolone = Math.max(1, regionsOf(key).length);
  for (const [name, count] of seen) {
    if (count > dozwolone) {
      ostrzez(
        `[map] "${key}" embeds "${name}" ${count}×. Collision shapes were merged ` +
          `across the copies, but you should delete the duplicates in Tiled.`,
      );
    }
  }

  // ── Render every tile layer, bottom to top ─────────────────────────────
  const tileLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  map.layers.forEach((layerData, i) => {
    const layer = map.createLayer(i, tilesets, 0, 0);
    if (!layer) return;
    // A layer whose name ends in "-over" renders above entities so the player
    // can walk behind it (canopies, roofs). Everything else is flat terrain.
    const nadEncjami = /-over$/i.test(layerData.name);
    layer.setDepth(nadEncjami ? DEPTH.overhead : i === 0 ? DEPTH.ground : DEPTH.overlay + i);
    // ⚠ **Ta sama jedna reguła nazwy rządzi teraz DWIEMA rzeczami** — tym, co
    // rysuje się nad graczem, i tym, co może go schować (`core/Occluders.ts`).
    // Trzymane w jednym `if` celowo: drugi test nazwy w innym pliku rozjechałby
    // się przy pierwszej zmianie konwencji, a diff by tego nie pokazał.
    // ⛔ Rejestracja jest PREZENTACYJNA — nie rusza kolizji ani `NavGrid`.
    if (nadEncjami) occludersFor(scene)?.registerTileLayer(layer);
    tileLayers.push(layer);
  });

  const solids = scene.physics.add.staticGroup();
  const boxCache = new CollisionLookup(tilesets);

  // ── Flatten the layer stack into one collision pass ────────────────────
  //
  // ⚠ Ten sam przebieg karmi DWIE rzeczy: ciała statyczne dla silnika i siatkę
  // prześwitu dla przyszłego `PathSolver`. Osobne przejście po mapie znaczyłoby
  // dwa opisy tej samej przestrzeni, a ten projekt zmierzył już, że dwa
  // streszczenia jednego rozjeżdżają się zawsze i diff tego nie widzi.
  const navBoxes: NavBox[] = [];
  const kladki = komorkiKladek(map);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      // ⭐ Kładka (obiekt `kladka` w `budynki`) OTWIERA komórki pod sobą — woda pod
      //   nią zostaje wodą, także na obrazku (2026-10-11, zrzut autora: „dlaczego pod
      //   kładką nad rzeką jest ziemia"). Do tej daty przejście dawały kafle `path`
      //   położone na wodzie, a te rysowały pod mostkiem pas gołej ziemi.
      if (kladki.has(ty * map.width + tx)) continue;
      const top = topmostTileAt(tileLayers, tx, ty);
      if (top === null) continue;
      const boxes = boxCache.boxesFor(top);
      if (!boxes) continue; // topmost tile is passable → nothing blocks this cell
      for (const b of boxes) {
        const x = tx * map.tileWidth + b.x;
        const y = ty * map.tileHeight + b.y;
        addStaticBox(scene, solids, x, y, b.w, b.h);
        navBoxes.push({ x, y, w: b.w, h: b.h });
      }
    }
  }
  // ── Drzewa autorowane jako tile-objecty Tiled (src/world/TreeLayer.ts) ──
  // Renderowane od razu (scene jest dostępna), pień dokłada ciało do `solids`
  // i `NavBox` do siatki — tak samo jak kolizja kafli wyżej. Mapa bez tilesetu
  // `TreeStamps` / bez takich obiektów dostaje `count: 0` i nic się nie dzieje.
  const trees = buildTreeLayer(scene, map, solids);
  for (const b of trees.trunkBoxes) navBoxes.push(b);
  // ── Budynki jako obiekty Tiled (src/world/Buildings.ts) — cały prostokąt
  // lity, tak jak kafle `solid` budynków (które w 3D gasną pod obiektem).
  for (const b of readBuildings(scene, map)) {
    addStaticBox(scene, solids, b.x, b.y, b.w, b.h);
    navBoxes.push(b);
  }
  // ── Pustka świata (`WorldComposer`): pola poza mapami członkowskimi są lite
  // jak krawędź mapy — inaczej gracz wszedłby w czarną pustkę obok wsi.
  for (const o of map.objects.find((l) => l.name === WARSTWA_PUSTKI)?.objects ?? []) {
    const b = { x: o.x ?? 0, y: o.y ?? 0, w: o.width ?? 0, h: o.height ?? 0 };
    addStaticBox(scene, solids, b.x, b.y, b.w, b.h);
    navBoxes.push(b);
  }

  // ⚠ Budowana ZAWSZE, czytana jeszcze przez nikogo — decyzja autora
  // z 2026-08-28. Koszt: jedno przejście tutaj i ~150 KB przy mapie lasu
  // 160×60 (zmierzone po resize 2026-08-28, skaluje się liniowo z powierzchnią
  // — po rozstawie ×1,5 z 2026-10-04, 240×90, to ~340 KB).
  // Powód: wracanie do tego pliku po to, żeby dopiero przy bandytach
  // zaprojektować całą reprezentację przestrzeni, byłoby drugą przebudową.
  const nav = NavGrid.build(navBoxes, map.widthInPixels, map.heightInPixels);

  const {
    playerSpawn,
    enemySpawns,
    campfireSpawns,
    waterwheelSpawns,
    npcSpawns,
    wellSpawns,
    herbNodes,
    farmAnimalSpawns,
    decorSpawns,
    birdSpawns,
    portals,
    questSpots,
    namedAnimals,
    hasObjectLayer,
  } = readSpawns(map, tileLayers, boxCache);

  // Dopiero TERAZ, po odczycie spawnów: bramka chowa warstwy, a nic w budowie
  // mapy nie powinno oglądać połowy stosu schowanej.
  gateLayersByCamera(scene, map, tileLayers);

  return {
    widthPx: map.widthInPixels,
    heightPx: map.heightInPixels,
    solids,
    nav,
    playerSpawn,
    enemySpawns,
    campfireSpawns,
    waterwheelSpawns,
    npcSpawns,
    wellSpawns,
    herbNodes,
    farmAnimalSpawns,
    decorSpawns,
    birdSpawns,
    portals,
    questSpots,
    namedAnimals,
    hasObjectLayer,
    treeCount: trees.count,
  };
}

/**
 * Co bramka wie o jednej warstwie: gdzie w ogóle ma kafle i w których blokach.
 */
interface LayerOccupancy {
  layer: Phaser.Tilemaps.TilemapLayer;
  /** Prostokąt otaczający wszystkie pomalowane kafle, w pikselach świata. */
  box: Phaser.Geom.Rectangle;
  /** Siatka `cols × rows` bajtów: 1 = w tym bloku coś jest. */
  blocks: Uint8Array;
  cols: number;
  rows: number;
  /** Bok bloku w pikselach świata. */
  blockW: number;
  blockH: number;
}

/**
 * Zbuduj mapę zajętości warstwy: prostokąt otaczający + siatkę bloków.
 * Zwraca `null`, gdy warstwa nie ma ani jednego kafla.
 *
 * „Pomalowany" to `index > 0` — ta sama definicja, której używa
 * `topmostTileAt`, i celowo ta sama: gdyby te dwie funkcje inaczej rozumiały
 * pusty kafel, warstwa mogłaby się chować mimo że coś na niej blokuje.
 */
function readOccupancy(layer: Phaser.Tilemaps.TilemapLayer): LayerOccupancy | null {
  const data = layer.layer.data;
  const tw = layer.layer.tileWidth;
  const th = layer.layer.tileHeight;
  const b = MAPS.layerCullBlockTiles;
  const cols = Math.ceil(layer.layer.width / b);
  const rows = Math.ceil(layer.layer.height / b);
  const blocks = new Uint8Array(cols * rows);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let ty = 0; ty < data.length; ty++) {
    const row = data[ty];
    for (let tx = 0; tx < row.length; tx++) {
      if (row[tx].index <= 0) continue;
      if (tx < minX) minX = tx;
      if (tx > maxX) maxX = tx;
      if (ty < minY) minY = ty;
      if (ty > maxY) maxY = ty;
      blocks[((ty / b) | 0) * cols + ((tx / b) | 0)] = 1;
    }
  }
  if (minX === Infinity) return null;

  return {
    layer,
    box: new Phaser.Geom.Rectangle(
      minX * tw,
      minY * th,
      (maxX - minX + 1) * tw,
      (maxY - minY + 1) * th,
    ),
    blocks,
    cols,
    rows,
    blockW: b * tw,
    blockH: b * th,
  };
}

/**
 * Gasi warstwy kafli, które nie mają ani jednego kafla w kadrze.
 *
 * ── Po co ─────────────────────────────────────────────────────────────────
 * Phaser culluje i rysuje **każdą warstwę osobno, co klatkę, po całym
 * prostokącie kamery** — niezależnie od tego, ile kafli ta warstwa w ogóle
 * ma. Mapy tego projektu trzymają „jedną warstwę na rodzaj rzeczy" (patrz
 * `src/world/CLAUDE.md`), więc Zagaje mają ich **czternaście**, a kilka jest
 * niemal pustych: `znaki` to 1 kafel na 10 000, `buildings-detale` 78,
 * `wyposazenie` 15. Pomiar z trace'u 2026-08-23: `RunCull` miał **747 ms self
 * time — najdroższą pozycję całego profilu po bezczynności**, a rysowanie
 * kafli 12% aktywnego CPU.
 *
 * `setVisible(false)` wypada z `CameraManager.getVisibleChildren` **przed**
 * jakimkolwiek cullingiem i rysowaniem, więc schowana warstwa kosztuje kilka
 * odczytów z tablicy zamiast przemiatania całego kadru i własnego wsadu.
 *
 * ── Dlaczego siatka bloków, a nie sam prostokąt otaczający ────────────────
 * ⚠ **Bo prostokąt otaczający przegrywa z warstwą ROZPROSZONĄ.** `buildings-
 * detale` ma 78 kafli, ale rozrzuconych po całej wsi — jego prostokąt obejmuje
 * 2656×1792 px, czyli prawie wszystko, i bramka na samym prostokącie nie
 * schowałaby go nigdy. Zmierzone średnie (Zagaje, 1845 pozycji kamery):
 * bez bramki 14,00 warstw na klatkę, sam prostokąt 9,25, bloki 4×4 **7,36**,
 * dokładny test kafli 6,91. Tabela z innymi rozmiarami bloku i uzasadnienie
 * wyboru czwórki stoją przy `MAPS.layerCullBlockTiles`.
 *
 * Prostokąt został mimo to jako **szybkie odrzucenie**: cztery porównania
 * wywalają `water` i `znaki` bez dotykania siatki.
 *
 * ⚠ **Warstwa pokrywająca całą mapę NIE jest bramkowana.** Grunt nigdy nie
 * wyjdzie z kadru, więc test byłby czystym kosztem — a przy okazji ta gałąź
 * jest gwarancją, że najgorszy przypadek tej optymalizacji to zero zmian,
 * nie regres.
 *
 * ⚠ **To nie zmienia NIC w tym, co widać.** Jeśli kiedykolwiek zobaczysz
 * znikającą warstwę w kadrze, winny jest zapas `MAPS.layerCullPadPx`, nie
 * sama bramka — patrz komentarz przy tej stałej.
 */
function gateLayersByCamera(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  layers: Phaser.Tilemaps.TilemapLayer[],
): void {
  const gated: LayerOccupancy[] = [];
  for (const layer of layers) {
    const occ = readOccupancy(layer);
    if (!occ) {
      // Nie fatalne — po prostu warstwa, której nikt nie pomalował. Warto o
      // niej wiedzieć, bo w Tiled wygląda identycznie jak wypełniona.
      ostrzez(`[map] Warstwa "${layer.layer.name}" nie ma ani jednego kafla.`);
      layer.setVisible(false);
      continue;
    }
    if (occ.box.width >= map.widthInPixels && occ.box.height >= map.heightInPixels) continue;
    gated.push(occ);
  }
  if (gated.length === 0) return;

  const pad = MAPS.layerCullPadPx;
  const sync = (): void => {
    const view = scene.cameras.main.worldView;
    const left = view.x - pad;
    const right = view.right + pad;
    const top = view.y - pad;
    const bottom = view.bottom + pad;
    for (const g of gated) {
      g.layer.setVisible(inView(g, left, right, top, bottom));
    }
  };
  sync();

  // ⚠ Wypięcie na SHUTDOWN jest OBOWIĄZKOWE: `scene.events` przeżywa restart
  // sceny, a `GameScene` restartuje się przy każdym przejściu bramą — bez tego
  // po trzech mapach biegłyby trzy bramki, dwie na warstwach już zniszczonych.
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
  });
}

/** Czy warstwa ma choć jeden pomalowany blok w podanym prostokącie świata. */
function inView(
  g: LayerOccupancy,
  left: number,
  right: number,
  top: number,
  bottom: number,
): boolean {
  // Szybkie odrzucenie prostokątem otaczającym — dla warstwy skupionej
  // (woda, znak przy drodze) kończy się tutaj.
  if (g.box.right <= left || g.box.x >= right || g.box.bottom <= top || g.box.y >= bottom) {
    return false;
  }
  const bx0 = Math.max(0, Math.floor(left / g.blockW));
  const bx1 = Math.min(g.cols - 1, Math.floor((right - 1) / g.blockW));
  const by0 = Math.max(0, Math.floor(top / g.blockH));
  const by1 = Math.min(g.rows - 1, Math.floor((bottom - 1) / g.blockH));
  for (let by = by0; by <= by1; by++) {
    const base = by * g.cols;
    for (let bx = bx0; bx <= bx1; bx++) {
      if (g.blocks[base + bx]) return true;
    }
  }
  return false;
}

/**
 * Komórki przykryte obiektem `kladka` (warstwa `budynki`) — przechodnie bez
 * względu na kafel pod spodem. Klucz `ty * width + tx`. ⚠ Ten sam warunek
 * czyta przymiar `tools/wies_przechodniosc.py` — zmieniając jeden, zmień drugi.
 */
function komorkiKladek(map: Phaser.Tilemaps.Tilemap): Set<number> {
  const out = new Set<number>();
  const tw = map.tileWidth, th = map.tileHeight;
  for (const o of map.objects.find((l) => l.name === WARSTWA_BUDYNKOW)?.objects ?? []) {
    const typ = (o.properties as { name: string; value: unknown }[] | undefined)?.find((p) => p.name === "typ")?.value;
    if (typ !== "kladka") continue;
    const x0 = Math.floor((o.x ?? 0) / tw), y0 = Math.floor((o.y ?? 0) / th);
    const x1 = Math.ceil(((o.x ?? 0) + (o.width ?? 0)) / tw), y1 = Math.ceil(((o.y ?? 0) + (o.height ?? 0)) / th);
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) out.add(ty * map.width + tx);
  }
  return out;
}

/**
 * Index of the topmost non-empty tile at a cell, or null if every layer is
 * empty there. This is the rule that makes stacked terrain work.
 */
function topmostTileAt(
  layers: Phaser.Tilemaps.TilemapLayer[],
  tx: number,
  ty: number,
): number | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    const tile = layers[i].getTileAt(tx, ty);
    if (tile && tile.index > 0) return tile.index;
  }
  return null;
}

/**
 * Which tiles block, keyed by the tile's position *within the sheet* (local id)
 * rather than its map-wide gid — so collision drawn on one embedded copy of a
 * tileset applies to every copy.
 *
 * Two authoring routes are honoured:
 *   • shapes drawn in Tiled's Tile Collision Editor → their bounding boxes
 *     (rectangles pass through exactly; polygons/ellipses are reduced, since
 *     Arcade physics cannot represent them, and shape rotation is ignored);
 *   • a custom boolean tile property `solid` → the whole 32×32 cell.
 *
 * A tile with no entry is passable.
 */
class CollisionLookup {
  /**
   * Keyed by `tilesetName#localId`, NOT by local id alone.
   *
   * The name is what makes duplicate embeds of one sheet share their shapes
   * (the original reason this isn't keyed by gid). Once a map references a
   * SECOND sheet, though, plain local ids collide outright — Nature's tile 16
   * and Buildings' tile 16 are different pictures — and a tree's collision box
   * would silently start blocking a doorway.
   */
  private readonly byTile = new Map<string, TileBox[]>();

  constructor(private readonly tilesets: Phaser.Tilemaps.Tileset[]) {
    for (const tileset of tilesets) {
      const ts = tileset as unknown as {
        tileData: Record<string, { objectgroup?: { objects?: TiledShape[] } }>;
        tileProperties: Record<string, Record<string, unknown> | undefined>;
      };

      for (const [localId, data] of Object.entries(ts.tileData ?? {})) {
        const boxes = (data?.objectgroup?.objects ?? [])
          .map(shapeToBox)
          .filter((b): b is TileBox => b !== null);
        const k = key(tileset.name, Number(localId));
        if (boxes.length > 0 && !this.byTile.has(k)) this.byTile.set(k, boxes);
      }

      for (const [localId, props] of Object.entries(ts.tileProperties ?? {})) {
        const k = key(tileset.name, Number(localId));
        if (props?.solid === true && !this.byTile.has(k)) {
          this.byTile.set(k, [{ x: 0, y: 0, w: tileset.tileWidth, h: tileset.tileHeight }]);
        }
      }
    }
  }

  /** Collision boxes for a map gid, or undefined if that tile is passable. */
  boxesFor(gid: number): TileBox[] | undefined {
    const owner = this.tilesets.find((t) => t.containsTileIndex(gid));
    if (!owner) return undefined;
    return this.byTile.get(key(owner.name, gid - owner.firstgid));
  }
}

function key(tilesetName: string, localId: number): string {
  return `${tilesetName}#${localId}`;
}

interface TiledShape {
  x: number;
  y: number;
  width?: number;
  height?: number;
  polygon?: { x: number; y: number }[];
}

/** Reduce one Tiled collision shape to a bounding box in tile-local pixels. */
function shapeToBox(o: TiledShape): TileBox | null {
  if (o.polygon && o.polygon.length > 0) {
    const xs = o.polygon.map((p) => p.x);
    const ys = o.polygon.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: o.x + minX,
      y: o.y + minY,
      w: Math.max(1, Math.max(...xs) - minX),
      h: Math.max(1, Math.max(...ys) - minY),
    };
  }
  if ((o.width ?? 0) > 0 && (o.height ?? 0) > 0) {
    return { x: o.x, y: o.y, w: o.width as number, h: o.height as number };
  }
  return null;
}

/** An invisible static body — the collision shape has no art of its own. */
function addStaticBox(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const zone = scene.add.zone(x + w / 2, y + h / 2, w, h);
  scene.physics.add.existing(zone, true);
  group.add(zone);
}

/** Tiled's raw custom-properties array, flattened to a plain lookup. Tiled
 *  JSON keeps `properties` as `[{name, type, value}, …]` rather than an
 *  object — Phaser's parser copies that array through unchanged (see
 *  ParseObject.js), so this is the only place that shape gets decoded. */
function readProps(o: { properties?: { name: string; value: unknown }[] }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of o.properties ?? []) out[p.name] = p.value;
  return out;
}

/**
 * Spawn points. Preferred source is a Tiled object layer: an object named
 * "player" plus enemy objects named by kind — "rabbit", "boar",
 * "bear"/"niedzwiedz", "fox"/"lis", "deer"/"jelen", "wolf", "greywolf" (also accepted as "szary", the
 * name it goes by in the fiction), "spider", or a generic "enemy" (treated
 * as a rabbit) — plus any number of "campfire" objects, an optional
 * "merchant", an optional "studnia"/"well", optional "peasant"/"rolnik",
 * "miller"/"mlynarz", "elder"/"soltys", "father"/"ojciec", "mother"/"matka",
 * "herbalist"/"zielarka", "widow"/"wdowa", any number of "portal" objects
 * (map-to-map transitions — see `PortalSpawn`), any
 * number of the `FARM_ANIMAL_OBJECT_NAMES` ambient-livestock names
 * (chicken/kura, cow/krowa, pig/swinia, sheep/owca, cat/kot, bull/byk,
 * ram/baran — see `FarmAnimal`, pure decoration), any number of the
 * `DECOR_PROPS` static
 * decoration names (drying rack, haycock, scarecrow, stump, mushrooms,
 * pond edge, lily pad — that table in GameConfig is the single place both
 * the accepted names and the art live), and any number of "bird"/"ptak"
 * objects (forest ambient decoration — see `Bird`). All case-insensitive.
 *
 * Everything here is optional except in effect the player: without a "player"
 * object the spawn is found by scanning for open ground, so a freshly painted
 * map still runs. A missing "merchant" falls back to GameScene's procedural
 * placement, which is the right behaviour for a map with no buildings and the
 * wrong one for a map that has a cabin — hence authoring it.
 */
function readSpawns(
  map: Phaser.Tilemaps.Tilemap,
  layers: Phaser.Tilemaps.TilemapLayer[],
  boxCache: CollisionLookup,
): {
  playerSpawn: Phaser.Math.Vector2;
  enemySpawns: EnemySpawn[];
  campfireSpawns: Phaser.Math.Vector2[];
  /** Points named "kolo"/"kolo_mlynskie"/"waterwheel" — the mill's wheel. */
  waterwheelSpawns: Phaser.Math.Vector2[];
  npcSpawns: Partial<Record<NpcId, Phaser.Math.Vector2>>;
  wellSpawns: WellSpawn[];
  herbNodes: Partial<Record<HerbId, Phaser.Math.Vector2[]>>;
  farmAnimalSpawns: Partial<Record<FarmAnimalSpecies, Phaser.Math.Vector2[]>>;
  decorSpawns: Partial<Record<DecorId, Phaser.Math.Vector2[]>>;
  birdSpawns: Phaser.Math.Vector2[];
  portals: PortalSpawn[];
  questSpots: Record<string, Phaser.Math.Vector2>;
  namedAnimals: Record<string, { species: FarmAnimalSpecies; pos: Phaser.Math.Vector2 }>;
  /**
   * Did an object layer actually come through with something in it?
   *
   * This is how "this map has no enemies **on purpose**" is told apart from
   * "this map's object layer didn't survive the export", which are otherwise
   * the same thing: an empty `enemySpawns`. GameScene's three-rabbit fallback
   * exists only for the second case, and firing it for the first put wild
   * animals in the middle of a village.
   *
   * Any object at all is proof enough — the layer either exported or it didn't,
   * and a layer holding a `player` point plus eight NPCs is plainly there.
   */
  hasObjectLayer: boolean;
} {
  let playerSpawn: Phaser.Math.Vector2 | null = null;
  const wellSpawns: WellSpawn[] = [];
  const npcSpawns: Partial<Record<NpcId, Phaser.Math.Vector2>> = {};
  const enemySpawns: EnemySpawn[] = [];
  const campfireSpawns: Phaser.Math.Vector2[] = [];
  const waterwheelSpawns: Phaser.Math.Vector2[] = [];
  const herbNodes: Partial<Record<HerbId, Phaser.Math.Vector2[]>> = {};
  const farmAnimalSpawns: Partial<Record<FarmAnimalSpecies, Phaser.Math.Vector2[]>> = {};
  const decorSpawns: Partial<Record<DecorId, Phaser.Math.Vector2[]>> = {};
  const birdSpawns: Phaser.Math.Vector2[] = [];
  const portals: PortalSpawn[] = [];
  const questSpots: Record<string, Phaser.Math.Vector2> = {};
  const namedAnimals: Record<string, { species: FarmAnimalSpecies; pos: Phaser.Math.Vector2 }> = {};

  for (const objLayer of map.objects) {
    // Budynki to prostokąty z własnym czytnikiem (`Buildings.ts`), nie spawny.
    if (objLayer.name === WARSTWA_BUDYNKOW || objLayer.name === WARSTWA_PUSTKI) continue;
    for (const o of objLayer.objects) {
      // Tile objects (an object with a `gid`) are trees — handled by
      // `buildTreeLayer`, never a spawn point. Skip before the name chain so
      // they don't trip the "unrecognised object name" warning.
      if ((o as unknown as { gid?: number }).gid) continue;
      const name = (o.name || "").toLowerCase();
      const pos = new Phaser.Math.Vector2(o.x ?? 0, o.y ?? 0);
      if (name === "player") playerSpawn = pos;
      else if (name === "boar") enemySpawns.push({ kind: "boar", pos });
      else if (name === "bear" || name === "niedzwiedz") enemySpawns.push({ kind: "bear", pos });
      else if (name === "fox" || name === "lis") enemySpawns.push({ kind: "fox", pos });
      // `deer`/`jelen` od 2026-10-04 to PRZECIWNIK (neutralny), nie krytter.
      else if (name === "deer" || name === "jelen") enemySpawns.push({ kind: "deer", pos });
      else if (name === "wolf") enemySpawns.push({ kind: "wolf", pos });
      else if (name === "greywolf" || name === "szary") {
        enemySpawns.push({ kind: "greywolf", pos });
      } else if (name === "spider") enemySpawns.push({ kind: "spider", pos });
      else if (name === "venomspider" || name === "skoczek" || name === "pajak_jadowity") {
        enemySpawns.push({ kind: "venomspider", pos });
      }
      // Bandyci (`OI-171`) — obie pisownie, jak reszta tabeli.
      else if (name === "bandit_club" || name === "zboj_palka") enemySpawns.push({ kind: "bandit_club", pos });
      else if (name === "bandit_axe" || name === "zboj_topor") enemySpawns.push({ kind: "bandit_axe", pos });
      else if (name === "bandit_chief" || name === "herszt") enemySpawns.push({ kind: "bandit_chief", pos });
      else if (name === "rabbit" || name === "enemy") enemySpawns.push({ kind: "rabbit", pos });
      else if (name === "training_dummy" || name === "manekin") {
        enemySpawns.push({ kind: "training_dummy", pos });
      }
      else if (name === "campfire") campfireSpawns.push(pos);
      else if (name === "kolo" || name === "kolo_mlynskie" || name === "waterwheel")
        waterwheelSpawns.push(pos);
      else if (name === "studnia" || name === "well") {
        wellSpawns.push({ pos, variant: "big" });
      } else if (name === "studnia_mala" || name === "well_small") {
        wellSpawns.push({ pos, variant: "small" });
      }
      else if (NPC_OBJECT_NAMES[name]) npcSpawns[NPC_OBJECT_NAMES[name]] = pos;
      else if (HERB_OBJECT_NAMES[name]) {
        const herb = HERB_OBJECT_NAMES[name];
        (herbNodes[herb] ??= []).push(pos);
      } else if (NAMED_ANIMAL_OBJECTS[name]) {
        namedAnimals[name] = { species: NAMED_ANIMAL_OBJECTS[name], pos };
      } else if (name === "miejsce" || name === "quest_spot") {
        const id = String(readProps(o).id ?? "");
        if (id) questSpots[id] = pos;
        else ostrzez(`[map] "miejsce" na (${Math.round(pos.x)}, ${Math.round(pos.y)}) nie ma właściwości "id" — pominięte.`);
      } else if (FARM_ANIMAL_OBJECT_NAMES[name]) {
        const species = FARM_ANIMAL_OBJECT_NAMES[name];
        (farmAnimalSpawns[species] ??= []).push(pos);
      } else if (DECOR_BY_OBJECT_NAME[name]) {
        const decor = DECOR_BY_OBJECT_NAME[name];
        (decorSpawns[decor] ??= []).push(pos);
      } else if (name === "bird" || name === "ptak") {
        birdSpawns.push(pos);
      } else if (name === "portal") {
        const props = readProps(o);
        const target = String(props.target ?? "");
        // Missing coordinates fall back to the portal's OWN position rather
        // than (0,0) — a malformed portal then drops the player where they
        // already stood instead of in a corner of the map.
        const spawnX = Number(props.spawnX ?? pos.x);
        const spawnY = Number(props.spawnY ?? pos.y);
        const dir = portalDir(props.dir, pos, map.widthInPixels, map.heightInPixels);
        if (target) portals.push({ pos, target, spawnX, spawnY, dir });
        else ostrzez('[map] "portal" object has no "target" property — ignored.');
      } else {
        /**
         * **An unrecognised object name is now LOUD.**
         *
         * It used to fall off the end of this chain in silence: the object is
         * in the file, you can see it in Tiled, and the game simply has
         * nothing there — with no clue why. That is the same silent-trap class
         * as the dead `player` point and an unbound tileset, and it stops being
         * survivable the moment a map carries dozens of hand-typed Polish
         * names: one `krwawnk` costs an evening of "why is there no krwawnik
         * in this meadow".
         *
         * Named objects only. An unnamed object is a shape somebody drew in
         * Tiled for their own reference (a zone outline, a note) and is not
         * trying to be a spawn.
         */
        if (name) {
          ostrzez(
            `[map] Obiekt "${o.name}" na (${Math.round(pos.x)}, ${Math.round(pos.y)}) ` +
              `nie jest rozpoznawany — nic z niego nie powstanie. ` +
              `Sprawdź pisownię albo dodaj nazwę do TiledMap.ts.`,
          );
        }
      }
    }
  }

  return {
    playerSpawn: playerSpawn ?? findOpenSpot(map, layers, boxCache),
    enemySpawns,
    campfireSpawns,
    waterwheelSpawns,
    npcSpawns,
    wellSpawns,
    herbNodes,
    farmAnimalSpawns,
    decorSpawns,
    birdSpawns,
    portals,
    questSpots,
    namedAnimals,
    // Budynki nie są dowodem, że warstwa SPAWNÓW przeżyła eksport.
    hasObjectLayer: map.objects.some((l) => l.name !== WARSTWA_BUDYNKOW && l.name !== WARSTWA_PUSTKI && l.objects.length > 0),
  };
}

/** Nearest passable cell to the map centre, searched outwards in rings. */
function findOpenSpot(
  map: Phaser.Tilemaps.Tilemap,
  layers: Phaser.Tilemaps.TilemapLayer[],
  boxCache: CollisionLookup,
): Phaser.Math.Vector2 {
  const ts = WORLD.tileSize;
  const cx = Math.floor(map.width / 2);
  const cy = Math.floor(map.height / 2);
  const passable = (tx: number, ty: number) => {
    const top = topmostTileAt(layers, tx, ty);
    return top === null || !boxCache.boxesFor(top);
  };

  for (let r = 0; r < Math.max(map.width, map.height); r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        // Only the ring's edge — the interior was covered by smaller radii.
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
        if (passable(tx, ty)) {
          return new Phaser.Math.Vector2(tx * ts + ts / 2, ty * ts + ts / 2);
        }
      }
    }
  }
  return new Phaser.Math.Vector2(map.widthInPixels / 2, map.heightInPixels / 2);
}

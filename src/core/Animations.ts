import Phaser from "phaser";
import { ASSETS } from "../config/GameConfig";

/** Direction keys used across the game. */
export type Direction = "down" | "left" | "right" | "up";

/** Animation key helpers (kept in one place to avoid typo'd strings). */
export const anim = {
  walk: (dir: Direction) => `char-walk-${dir}`,
  idle: (dir: Direction) => `char-idle-${dir}`,
  attack: (dir: Direction) => `char-attack-${dir}`,
};

/**
 * Build walk + idle animations for each of the 4 directions from the sliced
 * Character.png grid.
 *
 * Frame index = row * cols + col. Rows map to directions per GameConfig.
 */
export function createCharacterAnimations(scene: Phaser.Scene): void {
  const cfg = ASSETS.character;
  const dirs: Direction[] = ["down", "up", "left", "right"];

  for (const dir of dirs) {
    const base = cfg.dirRows[dir] * cfg.perCol; // first frame index of this row

    // Walk cycle = columns walkFromCol..walkToCol of the row (excludes attack).
    const walkFrames = [];
    for (let c = cfg.walkFromCol; c <= cfg.walkToCol; c++) {
      walkFrames.push({ key: cfg.key, frame: base + c });
    }

    if (!scene.anims.exists(anim.walk(dir))) {
      scene.anims.create({
        key: anim.walk(dir),
        frames: walkFrames,
        frameRate: cfg.walkFps,
        repeat: -1,
      });
    }

    // Idle = single standing frame for that direction.
    if (!scene.anims.exists(anim.idle(dir))) {
      scene.anims.create({
        key: anim.idle(dir),
        frames: [{ key: cfg.key, frame: base + cfg.idleCol }],
        frameRate: 1,
        repeat: -1,
      });
    }

    // Attack = the dedicated attack-pose frame (column 4), played once.
    if (!scene.anims.exists(anim.attack(dir))) {
      scene.anims.create({
        key: anim.attack(dir),
        frames: [{ key: cfg.key, frame: base + cfg.attackCol }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }
}

/** Animation key set shared by every generated directional creature sheet
 *  (rabbit, boar, ...). Left/right are not separate animations: `walk`/`run`
 *  are drawn facing right and reused mirrored via setFlipX, same trick as
 *  Enemy's existing patrol/chase facing. */
interface CreatureAnimKeys {
  idleDown: string;
  idleUp: string;
  walk: string;
  run: string;
}

function creatureAnimKeys(prefix: string): CreatureAnimKeys {
  return {
    idleDown: `${prefix}-idle-down`,
    idleUp: `${prefix}-idle-up`,
    walk: `${prefix}-walk`,
    run: `${prefix}-run`,
  };
}

/** The frame-grid shape every generated creature sheet's ASSETS entry has —
 *  see Assets.ts's CreatureSheetCfg, which this mirrors. */
interface CreatureSheetCfg {
  key: string;
  cols: number;
  idleDownFrame: number;
  idleUpFrame: number;
  walkRow: number;
  runRow: number;
  cycleFromCol: number;
  cycleToCol: number;
  walkFps: number;
  runFps: number;
}

/** Build a creature's idle/walk/run animations from its sliced sheet. Shared
 *  by createRabbitAnimations/createBoarAnimations — same grid shape, just a
 *  different texture and frame rates. */
function createCreatureAnimations(scene: Phaser.Scene, cfg: CreatureSheetCfg, keys: CreatureAnimKeys): void {
  if (!scene.anims.exists(keys.idleDown)) {
    scene.anims.create({
      key: keys.idleDown,
      frames: [{ key: cfg.key, frame: cfg.idleDownFrame }],
      frameRate: 1,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(keys.idleUp)) {
    scene.anims.create({
      key: keys.idleUp,
      frames: [{ key: cfg.key, frame: cfg.idleUpFrame }],
      frameRate: 1,
      repeat: -1,
    });
  }

  const cycleFrames = (row: number) => {
    const base = row * cfg.cols;
    const frames = [];
    for (let c = cfg.cycleFromCol; c <= cfg.cycleToCol; c++) frames.push({ key: cfg.key, frame: base + c });
    return frames;
  };
  if (!scene.anims.exists(keys.walk)) {
    scene.anims.create({ key: keys.walk, frames: cycleFrames(cfg.walkRow), frameRate: cfg.walkFps, repeat: -1 });
  }
  if (!scene.anims.exists(keys.run)) {
    scene.anims.create({ key: keys.run, frames: cycleFrames(cfg.runRow), frameRate: cfg.runFps, repeat: -1 });
  }
}

/** Rabbit animation keys — see ASSETS.rabbit for the frame grid. */
export const rabbitAnim = creatureAnimKeys("rabbit");

export function createRabbitAnimations(scene: Phaser.Scene): void {
  createCreatureAnimations(scene, ASSETS.rabbit, rabbitAnim);
}

/** Boar animation keys — see ASSETS.boar for the frame grid. */
export const boarAnim = creatureAnimKeys("boar");

export function createBoarAnimations(scene: Phaser.Scene): void {
  createCreatureAnimations(scene, ASSETS.boar, boarAnim);
}

/** Must match `BLACKSMITH.idleAnimKey` in GameConfig.ts. */
export const KOWAL_IDLE_ANIM = "kowal-idle";

/**
 * The Kowal's idle loop — a single south-facing 10-frame strip
 * (`ASSETS.kowalIdle`), not the 4-direction walk/run shape the other
 * creature anims share, so it gets its own tiny builder instead of going
 * through `createCreatureAnimations`. Guarded (unlike the rabbit/boar/wolf
 * calls, which are unconditional because those always have a placeholder
 * texture) because there is no placeholder for a missing `kowal_idle.png`:
 * if the sheet didn't load, there is nothing to animate and `Merchant`
 * already falls back to the static portrait on its own.
 */
export function createKowalAnimations(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ASSETS.kowalIdle.key) || scene.anims.exists(KOWAL_IDLE_ANIM)) return;
  const frames = [];
  for (let i = 0; i < ASSETS.kowalIdle.cols; i++) frames.push({ key: ASSETS.kowalIdle.key, frame: i });
  scene.anims.create({ key: KOWAL_IDLE_ANIM, frames, frameRate: 3, repeat: -1 });
}

/** Every state wolf.png (and greywolf.png — same shape) carries. */
export type WolfAnimState = keyof typeof ASSETS.wolf.states;

/** The state/row-table shape wolf.png and greywolf.png's ASSETS entries
 *  share — see Assets.ts's CreatureSheetCfg, which the grid fields mirror. */
interface WolfLikeSheetCfg {
  key: string;
  cols: number;
  dirRow: Record<Direction, number>;
  states: Record<WolfAnimState, { row: number; frames: number; fps: number; loop: boolean }>;
}

/**
 * Build an anim-key function for a wolf-shaped sheet. Unlike rabbit/boar's
 * `rabbitAnim.walk` (one fixed name, mirrored via setFlipX), these sheets
 * have 4 REAL directions per state, so the key needs the direction baked in.
 * A function rather than a precomputed table for the same reason
 * `anim.walk(dir)` is: fewer places to typo a direction string.
 */
function wolfLikeAnimKey(prefix: string) {
  return (state: WolfAnimState, dir: Direction): string => `${prefix}-${state}-${dir}`;
}

/**
 * Build all 24 (state × direction) animations from a sliced wolf-shaped
 * grid. Row = `states[state].row + dirRow[dir]` — the exact formula
 * tools/build_wilk.py and tools/build_szary.py used to lay out their sheets
 * in the first place. Shared by createWolfAnimations/createGreyWolfAnimations.
 */
function createWolfLikeAnimations(
  scene: Phaser.Scene,
  cfg: WolfLikeSheetCfg,
  keyFn: (state: WolfAnimState, dir: Direction) => string,
): void {
  const dirs: Direction[] = ["down", "up", "left", "right"];

  for (const [stateName, def] of Object.entries(cfg.states) as [WolfAnimState, WolfLikeSheetCfg["states"][WolfAnimState]][]) {
    for (const dir of dirs) {
      const key = keyFn(stateName, dir);
      if (scene.anims.exists(key)) continue;
      const row = def.row + cfg.dirRow[dir];
      const base = row * cfg.cols;
      const frames = [];
      for (let c = 0; c < def.frames; c++) frames.push({ key: cfg.key, frame: base + c });
      scene.anims.create({ key, frames, frameRate: def.fps, repeat: def.loop ? -1 : 0 });
    }
  }
}

/** Wolf animation keys — see ASSETS.wolf for the frame grid. */
export const wolfAnim = wolfLikeAnimKey("wolf");

export function createWolfAnimations(scene: Phaser.Scene): void {
  createWolfLikeAnimations(scene, ASSETS.wolf, wolfAnim);
}

/** Szary animation keys — see ASSETS.greyWolf for the frame grid. His OWN
 *  sheet, not wolf.png reused — see the comment on ASSETS.greyWolf. */
export const greyWolfAnim = wolfLikeAnimKey("greywolf");

export function createGreyWolfAnimations(scene: Phaser.Scene): void {
  createWolfLikeAnimations(scene, ASSETS.greyWolf, greyWolfAnim);
}

/** The two things a farm-animal sheet can be doing. */
export type FarmAnimalAnimState = "walk" | "eat";

/** The frame-grid shape every farm-animal ASSETS entry shares (chicken, cow,
 *  pig, sheep, cat — see ASSETS.chicken's comment for how this differs from
 *  the wolf-shaped sheets: two SEPARATE textures instead of row-bands of
 *  one, and a `dirRow` that is NOT the same order across species). `eatKey`
 *  is optional: the cat pack shipped no second texture at all (see
 *  ASSETS.cat), so there is nothing to build a second state's anims from. */
interface FarmAnimalSheetCfg {
  walkKey: string;
  eatKey?: string;
  cols: number;
  dirRow: Record<Direction, number>;
  walkFps: number;
  eatFps?: number;
}

/** Build a farm-animal animation-key function — `chicken-walk-down`,
 *  `cow-eat-left`, etc. One function per species so a typo'd prefix can't
 *  cross-wire two animals' anim keys. */
function farmAnimalAnimKey(prefix: string) {
  return (state: FarmAnimalAnimState, dir: Direction): string => `${prefix}-${state}-${dir}`;
}

/**
 * Build all 8 (2 states × 4 directions) animations for one farm-animal
 * species from its two independently sliced 4×4 grids. Guarded per-texture:
 * a sheet that failed to load simply contributes no animations, which is
 * fine — `FarmAnimal` is never spawned unless both textures for its species
 * are usable (see GameScene), so nothing ever asks for a key that wasn't
 * created.
 *
 * Not built through `createWolfLikeAnimations`: that helper reads every
 * state off ONE texture at `states[state].row + dirRow[dir]`, which fits
 * wolf.png (6 states stacked as row-bands of a single sheet) but not these —
 * two SEPARATE files with the same 4×4 dir-row grid, so "state" here means
 * "which texture", not "which row band".
 */
function createFarmAnimalAnimations(
  scene: Phaser.Scene,
  cfg: FarmAnimalSheetCfg,
  keyFn: (state: FarmAnimalAnimState, dir: Direction) => string,
): void {
  const dirs: Direction[] = ["down", "up", "left", "right"];
  const sheets: { state: FarmAnimalAnimState; key: string; fps: number }[] = [
    { state: "walk", key: cfg.walkKey, fps: cfg.walkFps },
  ];
  if (cfg.eatKey) sheets.push({ state: "eat", key: cfg.eatKey, fps: cfg.eatFps ?? cfg.walkFps });
  for (const { state, key, fps } of sheets) {
    if (!scene.textures.exists(key)) continue;
    for (const dir of dirs) {
      const animKey = keyFn(state, dir);
      if (scene.anims.exists(animKey)) continue;
      const base = cfg.dirRow[dir] * cfg.cols;
      const frames = [];
      for (let c = 0; c < cfg.cols; c++) frames.push({ key, frame: base + c });
      scene.anims.create({ key: animKey, frames, frameRate: fps, repeat: -1 });
    }
  }
}

export const chickenAnim = farmAnimalAnimKey("chicken");
export function createChickenAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.chicken, chickenAnim);
}

export const cowAnim = farmAnimalAnimKey("cow");
export function createCowAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.cow, cowAnim);
}

export const pigAnim = farmAnimalAnimKey("pig");
export function createPigAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.pig, pigAnim);
}

export const sheepAnim = farmAnimalAnimKey("sheep");
export function createSheepAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.sheep, sheepAnim);
}

export const ramAnim = farmAnimalAnimKey("ram");
export function createRamAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.ram, ramAnim);
}

/**
 * Bull: ONE texture with two row-blocks (walk at rows 0-3, eat/graze at
 * rows 4-7 — see ASSETS.bull), not two separate textures like the other
 * five farm-animal species. Closer in shape to wolf.png's
 * `states[state].row + dirRow[dir]` than to `createFarmAnimalAnimations`'s
 * "which texture" split, but not worth generalizing `createWolfLikeAnimations`
 * for — that helper's state table is typed against wolf.png's specific
 * `WolfAnimState`, and bull is the only other sheet shaped this way today.
 * A small dedicated builder is clearer than bending either shared helper to
 * fit a shape it wasn't measured against.
 */
export const bullAnim = farmAnimalAnimKey("bull");
export function createBullAnimations(scene: Phaser.Scene): void {
  const cfg = ASSETS.bull;
  if (!scene.textures.exists(cfg.key)) return;
  const dirs: Direction[] = ["down", "up", "left", "right"];
  const blocks: { state: FarmAnimalAnimState; rowOffset: number; fps: number }[] = [
    { state: "walk", rowOffset: 0, fps: cfg.walkFps },
    { state: "eat", rowOffset: 4, fps: cfg.eatFps },
  ];
  for (const { state, rowOffset, fps } of blocks) {
    for (const dir of dirs) {
      const animKey = bullAnim(state, dir);
      if (scene.anims.exists(animKey)) continue;
      const base = (rowOffset + cfg.dirRow[dir]) * cfg.cols;
      const frames = [];
      for (let c = 0; c < cfg.cols; c++) frames.push({ key: cfg.key, frame: base + c });
      scene.anims.create({ key: animKey, frames, frameRate: fps, repeat: -1 });
    }
  }
}

/** Cat colour variants — see ASSETS.cat for why colour, not species, is the
 *  texture axis here. */
export type CatColor = keyof typeof ASSETS.cat.colors;

/** Cat animation-key function for one colour — `cat-orange-walk-down`, etc.
 *  Colour has to be baked into the prefix (unlike the other four species)
 *  because all four colours share one `dirRow`/grid but are four SEPARATE
 *  textures, not variants of one. */
export function catAnim(color: CatColor) {
  return farmAnimalAnimKey(`cat-${color}`);
}

/** Psy (Kira Anny i owczarki Gniewka) — awaryjny chód 2D z `wolf.png`
 *  (`ASSETS.dog`); oba gatunki dzielą ten sam zestaw kluczy. */
export const dogAnim = farmAnimalAnimKey("dog");
export function createDogAnimations(scene: Phaser.Scene): void {
  createFarmAnimalAnimations(scene, ASSETS.dog, dogAnim);
}

/** Build the walk-only animation set for every cat colour. No `eatKey` —
 *  see ASSETS.cat for why a resting cat has no second texture to play. */
export function createCatAnimations(scene: Phaser.Scene): void {
  const cfg = ASSETS.cat;
  for (const color of Object.keys(cfg.colors) as CatColor[]) {
    createFarmAnimalAnimations(
      scene,
      { walkKey: cfg.colors[color].walkKey, cols: cfg.cols, dirRow: cfg.dirRow, walkFps: cfg.walkFps },
      catAnim(color),
    );
  }
}

/**
 * The three things a single-direction creature sheet can be doing — see
 * ASSETS.bear/.deer/.fox. Unlike `FarmAnimalAnimState`, there is no
 * direction component to the key at all: these packs drew ONE facing
 * (left) and the entity mirrors it with `setFlipX` for the other side, so
 * "state" is the whole story.
 */
export type SingleDirAnimState = "idle" | "walk" | "run";

/** The frame-grid shape `ASSETS.bear`/`.deer`/`.fox` share: three SEPARATE
 *  single-row textures (one per state), no `dirRow` at all. */
interface SingleDirSheetCfg {
  idleKey: string;
  idleFrames: number;
  idleFps: number;
  walkKey: string;
  walkFrames: number;
  walkFps: number;
  runKey: string;
  runFrames: number;
  runFps: number;
}

/** Build a single-direction animation-key function — `bear-idle`,
 *  `deer-walk`, etc. (no direction suffix — see `SingleDirAnimState`). */
function singleDirAnimKey(prefix: string) {
  return (state: SingleDirAnimState): string => `${prefix}-${state}`;
}

/**
 * Build the 3 (states, no directions) animations for one single-direction
 * creature from its three independently sliced 1-row grids. Guarded
 * per-texture like `createFarmAnimalAnimations`: a sheet that failed to
 * load simply contributes no animation for that state.
 */
function createSingleDirAnimations(
  scene: Phaser.Scene,
  cfg: SingleDirSheetCfg,
  keyFn: (state: SingleDirAnimState) => string,
): void {
  const states: { state: SingleDirAnimState; key: string; frames: number; fps: number }[] = [
    { state: "idle", key: cfg.idleKey, frames: cfg.idleFrames, fps: cfg.idleFps },
    { state: "walk", key: cfg.walkKey, frames: cfg.walkFrames, fps: cfg.walkFps },
    { state: "run", key: cfg.runKey, frames: cfg.runFrames, fps: cfg.runFps },
  ];
  for (const { state, key, frames: frameCount, fps } of states) {
    if (!scene.textures.exists(key)) continue;
    const animKey = keyFn(state);
    if (scene.anims.exists(animKey)) continue;
    const frames = [];
    for (let c = 0; c < frameCount; c++) frames.push({ key, frame: c });
    scene.anims.create({ key: animKey, frames, frameRate: fps, repeat: -1 });
  }
}

export const bearAnim = singleDirAnimKey("bear");
export function createBearAnimations(scene: Phaser.Scene): void {
  createSingleDirAnimations(scene, ASSETS.bear, bearAnim);
}

export const deerAnim = singleDirAnimKey("deer");
export function createDeerAnimations(scene: Phaser.Scene): void {
  createSingleDirAnimations(scene, ASSETS.deer, deerAnim);
}

export const foxAnim = singleDirAnimKey("fox");
export function createFoxAnimations(scene: Phaser.Scene): void {
  createSingleDirAnimations(scene, ASSETS.fox, foxAnim);
}

import type Phaser from "phaser";
import {
  BANDIT_AXE,
  BANDIT_CHIEF,
  BANDIT_CLUB,
  BEAR,
  BOAR,
  DEER,
  FOX,
  GREY_WOLF,
  RABBIT,
  SPIDER,
  TRAINING_DUMMY,
  VENOM_SPIDER,
  WOLF,
} from "../config/GameConfig";
import { Bandit } from "./Bandit";
import { Bear } from "./Bear";
import { Boar } from "./Boar";
import { Deer } from "./Deer";
import { Fox } from "./Fox";
import type { Enemy, EnemyConfig, EnemyType } from "./Enemy";
import { GreyWolf } from "./GreyWolf";
import { Rabbit } from "./Rabbit";
import { Spider } from "./Spider";
import { TrainingDummy } from "./TrainingDummy";
import { VenomSpider } from "./VenomSpider";
import { Wolf } from "./Wolf";

/**
 * **Rejestr gatunków: `EnemyType` → (konfiguracja, konstruktor).**
 *
 * ⚠ **Zastąpił DWA równoległe `switch` w `GameScene`** (`createEnemy`
 * i `enemyCfg`, 2026-09-03, pozycja D7 audytu). Dwa switche na tej samej unii
 * to dwie listy, które muszą się zgadzać — i **nie zgadzały się**:
 * `enemyCfg` nie miał gałęzi `training_dummy` i po cichu zwracał `RABBIT`.
 * W praktyce nieszkodliwe (manekin ma 100 000 HP, więc nie ginie i nigdy nie
 * wchodzi do `scheduleRespawn`), ale to jest dokładnie ta klasa błędu, którą
 * rejestr czyni **niemożliwą**: `Record<EnemyType, …>` jest wyczerpujący, więc
 * nowy gatunek bez wpisu **nie skompiluje się**.
 *
 * ⛔ **To nie jest warstwa abstrakcji nad `Enemy`** — to tablica. Zachowanie
 * gatunku mieszka dalej w jego klasie, liczby dalej w `GameConfig`. Rejestr
 * odpowiada wyłącznie na pytanie „co odpowiada temu identyfikatorowi".
 */
export interface EnemySpecies {
  readonly cfg: EnemyConfig;
  readonly create: (scene: Phaser.Scene, x: number, y: number) => Enemy;
}

export const ENEMY_SPECIES: Readonly<Record<EnemyType, EnemySpecies>> = {
  rabbit: { cfg: RABBIT, create: (s, x, y) => new Rabbit(s, x, y) },
  boar: { cfg: BOAR, create: (s, x, y) => new Boar(s, x, y) },
  bear: { cfg: BEAR, create: (s, x, y) => new Bear(s, x, y) },
  fox: { cfg: FOX, create: (s, x, y) => new Fox(s, x, y) },
  deer: { cfg: DEER, create: (s, x, y) => new Deer(s, x, y) },
  wolf: { cfg: WOLF, create: (s, x, y) => new Wolf(s, x, y) },
  greywolf: { cfg: GREY_WOLF, create: (s, x, y) => new GreyWolf(s, x, y) },
  spider: { cfg: SPIDER, create: (s, x, y) => new Spider(s, x, y) },
  venomspider: { cfg: VENOM_SPIDER, create: (s, x, y) => new VenomSpider(s, x, y) },
  bandit_club: { cfg: BANDIT_CLUB, create: (s, x, y) => new Bandit(s, x, y, "bandit_club") },
  bandit_axe: { cfg: BANDIT_AXE, create: (s, x, y) => new Bandit(s, x, y, "bandit_axe") },
  bandit_chief: { cfg: BANDIT_CHIEF, create: (s, x, y) => new Bandit(s, x, y, "bandit_chief") },
  training_dummy: { cfg: TRAINING_DUMMY, create: (s, x, y) => new TrainingDummy(s, x, y) },
};

/** Konfiguracja gatunku — respawn, agro, ciało, `proficiency`. */
export function enemyConfigOf(kind: EnemyType): EnemyConfig {
  return ENEMY_SPECIES[kind].cfg;
}

/** Nowy egzemplarz gatunku. Scenę podaje wołający — encja jej nie szuka. */
export function createEnemyOf(kind: EnemyType, scene: Phaser.Scene, x: number, y: number): Enemy {
  return ENEMY_SPECIES[kind].create(scene, x, y);
}

import Phaser from "phaser";
import { ASSETS, MAPS, SWIAT } from "../config/GameConfig";
import { queueImages, finalizeTextures, missingAssets, recordBootFailures } from "../core/Assets";
import {
  createCharacterAnimations,
  createRabbitAnimations,
  createBoarAnimations,
  createWolfAnimations,
  createGreyWolfAnimations,
  createKowalAnimations,
  createChickenAnimations,
  createCowAnimations,
  createPigAnimations,
  createSheepAnimations,
  createCatAnimations,
  createDogAnimations,
  createRamAnimations,
  createBullAnimations,
  createBearAnimations,
  createDeerAnimations,
  createFoxAnimations,
} from "../core/Animations";
import { Sfx } from "../core/Sfx";
import { UI, textStyle } from "../core/theme";

/**
 * BootScene: loads images, generates placeholders for any missing files,
 * slices spritesheets, builds animations, then hands off to the game.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    // Simple loading readout in the corner.
    const text = this.add
      .text(16, 16, "Loading…", textStyle({ color: UI.white, fontSize: "14px" }))
      .setScrollFactor(0);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      text.setText(`Loading… ${Math.round(p * 100)}%`);
    });

    queueImages(this);
    Sfx.queue(this.load);
    // Tiled maps (JSON). If one 404s the game still boots — GameScene falls
    // back to the code-authored map for whichever map key failed to load.
    this.load.tilemapTiledJSON(MAPS.forest.key, MAPS.forest.path);
    this.load.tilemapTiledJSON(MAPS.village.key, MAPS.village.path);
    this.load.tilemapTiledJSON(MAPS.thicket.key, MAPS.thicket.path);
    // Otwarty świat: plik świata Tiled (wieś + las obok siebie) — `WorldComposer`.
    this.load.json(SWIAT.jsonKey, SWIAT.path);
    // DEV/PROTOTYP — mapa testowa instancji drzew (window.dev.treeProto.load()).
    // Tylko dev-build; produkcja jej nie widzi. Patrz docs/tree_instances.md.
    if (import.meta.env.DEV) {
      this.load.tilemapTiledJSON(MAPS.treeproto.key, MAPS.treeproto.path);
      this.load.tilemapTiledJSON(MAPS.willowtest.key, MAPS.willowtest.path);
    }
  }

  create(): void {
    // ⚠ **Tutaj, a nie później.** `create()` biegnie po zakończeniu ładowania,
    // a scena startowa jest zaraz potem zatrzymywana — patrz `bootFailures`
    // w `core/Assets.ts` po powód, dla którego liczba jest przepisywana, a nie
    // odczytywana na żądanie.
    recordBootFailures(this.load.totalFailed);
    finalizeTextures(this);
    createCharacterAnimations(this);
    createRabbitAnimations(this);
    createBoarAnimations(this);
    createWolfAnimations(this);
    createGreyWolfAnimations(this);
    createKowalAnimations(this);
    createChickenAnimations(this);
    createCowAnimations(this);
    createPigAnimations(this);
    createSheepAnimations(this);
    createCatAnimations(this);
    createDogAnimations(this);
    createRamAnimations(this);
    createBullAnimations(this);
    createBearAnimations(this);
    createDeerAnimations(this);
    createFoxAnimations(this);
    // Here rather than in GameScene: that one restarts, and re-subscribing on
    // every restart would stack duplicate listeners (and duplicate sounds).
    Sfx.init(this);

    if (missingAssets.size > 0) {
      // Not fatal — placeholders are in use. Log which real files to add.
      console.warn(
        "[assets] Using procedural placeholders for missing PNGs:",
        [...missingAssets].join(", "),
        "\nDrop the real files into /assets to see them:",
        // Only loadable entries have key/path (the boar is placeholder-only).
        (Object.values(ASSETS) as { key?: string; path?: string }[])
          .filter((a) => a.key !== undefined && missingAssets.has(a.key))
          .map((a) => a.path)
          .join(", "),
      );
    }

    this.scene.start("Title");
  }
}

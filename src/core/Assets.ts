import Phaser from "phaser";
import { ASSETS, ITEMS, ABILITIES, PORTAL, COMBAT_FEEDBACK, TRAINING_DUMMY } from "../config/GameConfig";
import { itemIconKey } from "./Items";
import { abilityIconKey, type AbilityId } from "./Abilities";
import type { DamageType } from "./Equipment";

/**
 * Asset loading helpers.
 *
 * Strategy: try to load the real PNGs from /assets. Whatever fails to load
 * (e.g. the user hasn't dropped the file in yet) is replaced by a procedurally
 * generated placeholder so the prototype ALWAYS runs and is testable. When the
 * real art is present, it is sliced into frames using a grid layout, deriving
 * frame pixel size from the actual texture dimensions.
 */

/** Keys of textures that failed to load and were replaced by placeholders. */
export const missingAssets = new Set<string>();

/**
 * Ile plików loader zgłosił jako NIEUDANE w fazie startowej (`load.totalFailed`).
 *
 * ⚠ **To NIE jest to samo pytanie co `missingAssets`, i dlatego są dwie liczby.**
 * `missingAssets` zna wyłącznie klucze wymienione w `finalizeTextures` — klucz
 * załadowany, ale na tej liście nieobecny, **zawsze raportuje się jako obecny**
 * (komentarz przy ognisku niżej opisuje tę pułapkę). `totalFailed` liczy każde
 * 404 loadera: dźwięki, mapy `.tmj`, ikony przedmiotów, portrety. Instrukcja
 * po przeprowadzce assetów w `CLAUDE.md` żąda sprawdzenia OBU.
 *
 * Zapisywane jawnie przez `BootScene`, a nie odczytywane później z
 * `scene.load.totalFailed`, bo scena startowa jest zatrzymywana zaraz po
 * starcie — a `LoaderPlugin.shutdown()` woła `reset()`. Dziś `reset()` akurat
 * tego pola nie rusza, ale opieranie diagnostyki na tym, czego jakaś metoda
 * NIE robi, jest umową, której nikt nie podpisał.
 */
let bootFailures = 0;

/** Woła `BootScene.create()` z `this.load.totalFailed`. */
export function recordBootFailures(count: number): void {
  bootFailures = count;
}

/** Patrz `bootFailures`. Czyta `window.dev.failed`. */
export function bootLoadFailures(): number {
  return bootFailures;
}

/**
 * Queue every source PNG for loading. We deliberately do NOT decide "missing"
 * from load-error events here — those can fire after create(). Instead
 * finalizeTextures() checks texture existence directly (timing-independent).
 */
export function queueImages(scene: Phaser.Scene): void {
  const load = scene.load;
  // Loaded as plain images first; we re-slice into spritesheets after load,
  // once we know the real texture dimensions.
  // Terrain and props are two sheets, not one (see ASSETS.teren). Both go
  // through Tiled; forgetting either one draws an empty map with no error.
  load.image(ASSETS.teren.key, ASSETS.teren.path);
  load.image(ASSETS.nature.key, ASSETS.nature.path);
  // Forest tree atlas (tools/build_forrest_atlas.py). Bound by name "Forrest"
  // in TiledMap's TILESET_TEXTURES; unused until a .tmj references it.
  load.image(ASSETS.forrest.key, ASSETS.forrest.path);
  // Forest tree stamps (tools/build_tree_stamps.py) — editor repack of forrest.png,
  // one 96×96 cell per tree. Bound by name "TreeStamps" in TILESET_TEXTURES and
  // rendered straight from here by src/world/TreeLayer.ts.
  load.image(ASSETS.treeStamps.key, ASSETS.treeStamps.path);
  // Osobny arkusz WIELKICH stempli (wierzba duża) — patrz ASSETS.treeStampsBig.
  // Ładowany bezwarunkowo; mapa bez tilesetu "TreeStampsBig" po prostu go nie
  // używa (TreeLayer wiąże po nazwie).
  load.image(ASSETS.treeStampsBig.key, ASSETS.treeStampsBig.path);
  // Forest ground — recoloured Teren grass (tools/build_forest_ground.py).
  // Bound by name "ForestGround" in TILESET_TEXTURES; only forrest.tmj uses it.
  load.image(ASSETS.forestGround.key, ASSETS.forestGround.path);
  // Forest transitions — Teren water/sand/path edges with baked grass punched
  // to alpha (tools/build_terrain_forest_transitions.py). Bound by name
  // "ForestTransitions" in TILESET_TEXTURES; only forrest.tmj uses it.
  load.image(ASSETS.forestTransitions.key, ASSETS.forestTransitions.path);
  load.image(ASSETS.character.key, ASSETS.character.path);
  load.image(ASSETS.rabbit.key, ASSETS.rabbit.path);
  load.image(ASSETS.boar.key, ASSETS.boar.path);
  load.image(ASSETS.wolf.key, ASSETS.wolf.path);
  load.image(ASSETS.greyWolf.key, ASSETS.greyWolf.path);
  load.image(ASSETS.npc.key, ASSETS.npc.path);
  // Already a finished, cropped portrait (no sheet to slice) — see
  // ASSETS.kowal's comment. No placeholder generator either: if this fails
  // to load, Merchant falls back to the shared npc portrait, tinted, same
  // as it did before this file existed.
  load.image(ASSETS.kowal.key, ASSETS.kowal.path);
  load.image(ASSETS.hunter.key, ASSETS.hunter.path);
  // Same "missing file just degrades" story: sliced into an idle-loop
  // spritesheet below only if it actually loaded.
  load.image(ASSETS.kowalIdle.key, ASSETS.kowalIdle.path);
  // The village well — already a finished composite (no sheet to slice), same
  // "missing file just degrades" story as ASSETS.kowal above.
  load.image(ASSETS.well.key, ASSETS.well.path);
  load.image(ASSETS.wellSmall.key, ASSETS.wellSmall.path);
  // The training dummy — same story again, no sheet to slice.
  load.image(ASSETS.trainingDummy.key, ASSETS.trainingDummy.path);
  // The flavour villagers — same story.
  load.image(ASSETS.peasant.key, ASSETS.peasant.path);
  load.image(ASSETS.miller.key, ASSETS.miller.path);
  load.image(ASSETS.elder.key, ASSETS.elder.path);
  load.image(ASSETS.father.key, ASSETS.father.path);
  load.image(ASSETS.mother.key, ASSETS.mother.path);
  load.image(ASSETS.herbalist.key, ASSETS.herbalist.path);
  load.image(ASSETS.zofia.key, ASSETS.zofia.path);
  load.image(ASSETS.kuba.key, ASSETS.kuba.path);
  load.image(ASSETS.gniewko.key, ASSETS.gniewko.path);
  load.image(ASSETS.hanna.key, ASSETS.hanna.path);
  load.image(ASSETS.sulislaw.key, ASSETS.sulislaw.path);
  load.image(ASSETS.witek.key, ASSETS.witek.path);
  load.image(ASSETS.sobek.key, ASSETS.sobek.path);
  load.image(ASSETS.agata.key, ASSETS.agata.path);
  load.image(ASSETS.dobrawa.key, ASSETS.dobrawa.path);
  load.image(ASSETS.anna.key, ASSETS.anna.path);
  load.image(ASSETS.patryczek.key, ASSETS.patryczek.path);
  /** Przedmioty z własnym PNG zamiast wycinka z `items.png` — bo `items.png`
   *  nie ma ani pieczywa, ani surowego mięsa. Już 32×32, więc `makeItemIcons`
   *  tylko je kopiuje. */
  for (const ic of [
    ASSETS.iconBread,
    ASSETS.iconEggs,
    ASSETS.iconCheese,
    ASSETS.iconRabbitMeat,
    ASSETS.iconLeatherScraps,
    ASSETS.iconWolfPelt,
    ASSETS.iconBoarHide,
    ASSETS.iconVenomGland,
    ASSETS.iconSpiderSilk,
    ASSETS.iconCookedMeat,
    ASSETS.iconRibwort,
    ASSETS.iconStJohnsWort,
    ASSETS.iconNettle,
    ASSETS.iconChamomile,
    ASSETS.iconYarrow,
    ASSETS.iconMullein,
    ASSETS.iconGoldenrod,
    ASSETS.iconTansy,
    ASSETS.iconCornMint,
    ASSETS.iconWildMarjoram,
    ASSETS.iconComfrey,
    ASSETS.iconBearHide,
    ASSETS.iconHealthPotion,
    ASSETS.iconRingPrecision,
    ASSETS.iconRingSwiftness,
    ASSETS.iconRingVigor,
    ASSETS.iconRingWarding,
    ASSETS.iconGreyFang,
    ASSETS.iconGreyFangNecklace,
    ASSETS.iconBag1,
    ASSETS.iconBag2,
    ASSETS.iconBag3,
    ASSETS.iconBag4,
    // ⚠ Ikony tarcz są jedynymi NIEKWADRATOWYMI w tej pętli (32×64 dla
    //   gabarytu 1×2) — `makeItemIcons` zachowuje ich rozmiar źródłowy.
    ASSETS.iconShieldBuckler,
    ASSETS.iconShieldRound,
    ASSETS.iconShieldHeater,
    ASSETS.iconShieldAlmond,
    ASSETS.iconShieldScutum,
    ASSETS.iconShieldPavise,
    ASSETS.iconWeaponKnife,
    ASSETS.iconWeaponDagger,
    ASSETS.iconWeaponMisericorde,
  ]) {
    load.image(ic.key, ic.path);
  }
  // PILOT ikon pancerza (głowa + klata: len i skóra), 2026-09-28.
  for (const ic of ASSETS.iconArmor) load.image(ic.key, ic.path);
  // Miecze (`tools/build_sword_icons.py`), 2026-09-28; docelowe od 2026-10-01.
  for (const ic of ASSETS.iconWeaponSwords) load.image(ic.key, ic.path);
  // Tarcze metalowe (warstwa metalu na masterze), 2026-10-02.
  for (const ic of ASSETS.iconShieldMetal) load.image(ic.key, ic.path);
  // Obuchowe (skos 1:2), 2026-10-02.
  for (const ic of ASSETS.iconWeaponBlunt) load.image(ic.key, ic.path);
  // Topory (45° / skos 1:2), 2026-10-02.
  for (const ic of ASSETS.iconWeaponAxes) load.image(ic.key, ic.path);
  // Drzewcowe (skos 1:2, 1×2), 2026-09-30.
  for (const ic of ASSETS.iconWeaponPolearms) load.image(ic.key, ic.path);
  // Static overview images for the "Mapa" tab — same "missing file just
  // means that bit of UI degrades" story as the Kowal portrait above.
  load.image(ASSETS.minimapForest.key, ASSETS.minimapForest.path);
  load.image(ASSETS.minimapVillage.key, ASSETS.minimapVillage.path);
  load.image(ASSETS.minimapThicket.key, ASSETS.minimapThicket.path);
  load.image(ASSETS.items.key, ASSETS.items.path);
  // Used only through Tiled (bound to the tileset of the same name), never
  // sliced by hand — but it still has to be loaded, or every building tile in
  // the map silently renders as nothing.
  load.image(ASSETS.buildings.key, ASSETS.buildings.path);
  load.image(ASSETS.kuznia.key, ASSETS.kuznia.path);
  // Crops. Loaded before any map paints them, on purpose — see ASSETS.pole:
  // an unregistered tileset draws nothing and says so only in the console,
  // which is a bad way to find out after an evening of painting fields.
  load.image(ASSETS.pole.key, ASSETS.pole.path);
  // Roadside furniture — signposts standing at both map gates.
  load.image(ASSETS.znaki.key, ASSETS.znaki.path);
  // The campfire — a finished 33x33 prop, palette-snapped. Same "missing file
  // just degrades" story as everything above, except here the degradation has
  // a real generator behind it (makeCampfirePlaceholder).
  load.image(ASSETS.campfire.key, ASSETS.campfire.path);
  // The mill's water wheel — two views in one image, sliced into named frames
  // in `sliceWaterwheel()` below.
  load.image(ASSETS.waterwheel.key, ASSETS.waterwheel.path);
  // The Hunter's drying rack — a finished 64×64 composite, same "missing
  // file just degrades" story as the well/campfire above (no placeholder
  // generator; a map with no "suszona_skora" object just shows none).
  load.image(ASSETS.driedHide.key, ASSETS.driedHide.path);
  // The round haycock replacing the old stog_0..3 tile prop at Dobek's
  // yard — same "finished composite" story as driedHide above.
  load.image(ASSETS.haystack.key, ASSETS.haystack.path);
  // The scarecrow standing in the rye field — same story again.
  load.image(ASSETS.scarecrow.key, ASSETS.scarecrow.path);
  // The equipment paper doll's frame (backpack tab). One finished composite,
  // never sliced — see ASSETS.equipDoll for why the grid lines make slicing
  // wrong. A missing file degrades to the old plain slot boxes; PlayerPanel
  // checks `textures.exists` for exactly that, which is only trustworthy
  // because the key is listed in finalizeTextures below.
  load.image(ASSETS.equipDoll.key, ASSETS.equipDoll.path);
  // Glify slotów — arkusz 8×2 po 32 px, rozcięty na klatki w `sliceSlotGlyphs`
  // niżej (`tools/build_slot_glyphs.py`). To jest NASTĘPCA `equipDoll` jako
  // grafiki lalki: tamten obrazek niósł CAŁY układ, ten niesie pojedyncze
  // ikony, a układ jest danymi w `src/ui/EquipLayout.ts`.
  //
  // ⚠ Brak pliku degraduje tak samo jak wszędzie tutaj: `PlayerPanel` rysuje
  // kafle ze swoich prostokątów niezależnie od tego arkusza, więc brakujący
  // PNG zabiera glify, a nie ekwipunek. Klucz MUSI stać na liście
  // w `finalizeTextures`, inaczej `textures.exists` odpowiada „jest" na
  // teksturę, która się nie wczytała.
  load.image(ASSETS.slotGlyphs.key, ASSETS.slotGlyphs.path);
  // Real art for the `cleave` ability icon — see ASSETS.iconCleave. Same
  // "missing file just degrades" story as everything else here: if it fails
  // to load, makeAbilityIcons falls back to the procedural glyph it always
  // drew before this file existed.
  load.image(ASSETS.iconCleave.key, ASSETS.iconCleave.path);
  // Real art for the `charge` ability icon — see ASSETS.iconCharge. Same
  // fallback story as iconCleave above.
  load.image(ASSETS.iconCharge.key, ASSETS.iconCharge.path);
  // Real art for `lunge` and `shieldBash` — see ASSETS.iconLunge /
  // ASSETS.iconShieldBash. Same fallback story as iconCleave above.
  load.image(ASSETS.iconLunge.key, ASSETS.iconLunge.path);
  load.image(ASSETS.iconShieldBash.key, ASSETS.iconShieldBash.path);
  // Real art for `rend` — see ASSETS.iconRend. Same fallback story as
  // iconCleave above.
  load.image(ASSETS.iconRend.key, ASSETS.iconRend.path);
  // Real art for `heavyStrike` — see ASSETS.iconHeavyStrike. Same fallback
  // story as iconCleave above.
  load.image(ASSETS.iconHeavyStrike.key, ASSETS.iconHeavyStrike.path);
  // Real art for `warcry` — see ASSETS.iconWarcry. Same fallback story as
  // iconCleave above. `dodge`/`whirlwind` deliberately have none — see
  // ASSETS.iconWarcry's comment.
  load.image(ASSETS.iconWarcry.key, ASSETS.iconWarcry.path);
  // Two atlases of mechanically-packed environment decor (2026-08-31) —
  // `tools/build_forest_atlases.py`. Replaces the individual `load.image()`
  // calls that used to be here for every stone/bush/stump/water-flora
  // variant (56 + 19 files) — see `ASSETS.forestDecorAtlas`/`waterFloraAtlas`
  // in GameConfig for the "why", and `docs/katalog_assetow.md` for the full
  // frame list. `stone_*`/`bush_*`/`*_stump_*`/`pniak_z_siekiera_paleta` now
  // live in `forestDecorAtlas`; `cattail_*`/`reed_plume_*`/`marsh_tuft_*`/
  // `shore_plant_*`/`brzeg_stawu_paleta`/`lilia_wodna_paleta` in
  // `waterFloraAtlas`. `ASSETS.mushrooms` is the one prop from the old mixed
  // loop that did NOT move — see the atlasing audit for why (single/zero
  // instances on the live map, no measurable batching benefit).
  load.atlas(ASSETS.forestDecorAtlas.key, ASSETS.forestDecorAtlas.path, ASSETS.forestDecorAtlas.jsonPath);
  load.atlas(ASSETS.waterFloraAtlas.key, ASSETS.waterFloraAtlas.path, ASSETS.waterFloraAtlas.jsonPath);
  load.image(ASSETS.mushrooms.key, ASSETS.mushrooms.path);
  // Forest-economy wood decor (2026-09-07) — see ASSETS.woodpileSmall in
  // GameConfig. Same "missing file just degrades" story as mushrooms above;
  // six single-instance images, not atlased for the same reason mushrooms
  // wasn't (no measurable batching benefit at this instance count).
  load.image(ASSETS.woodpileSmall.key, ASSETS.woodpileSmall.path);
  load.image(ASSETS.woodpileLarge.key, ASSETS.woodpileLarge.path);
  load.image(ASSETS.logsLoose.key, ASSETS.logsLoose.path);
  load.image(ASSETS.logsScattered.key, ASSETS.logsScattered.path);
  load.image(ASSETS.logHorizontal.key, ASSETS.logHorizontal.path);
  load.image(ASSETS.logVertical.key, ASSETS.logVertical.path);
  // Real herb sprites (2026-08-30) — see ASSETS.herbBabka in GameConfig. Keys
  // match `herbTextureKey(id)`, which is what `Gatherable` actually reads.
  for (const prop of [
    ASSETS.herbBabka,
    ASSETS.herbKrwawnik,
    ASSETS.herbPokrzywa,
    ASSETS.herbRumianek,
    ASSETS.herbDziurawiec,
    ASSETS.herbLebiodka,
    ASSETS.herbWrotycz,
    ASSETS.herbMieta,
    ASSETS.herbNawloc,
    ASSETS.herbDziewanna,
    ASSETS.herbZywokost,
  ]) {
    load.image(prop.key, prop.path);
  }
  // Beehives (kłody bartne), three variants — same "finished composite" story.
  for (const prop of [ASSETS.beehiveA, ASSETS.beehiveB, ASSETS.beehiveC, ASSETS.hopPole]) {
    load.image(prop.key, prop.path);
  }
  // Ambient farm-animal livestock (chicken/cow/pig/sheep/ram) — two real
  // external sheets each (walk + eat), same "missing file just degrades"
  // story as the water wheel/rocks above: no placeholder generator,
  // GameScene simply spawns none of a species if either of its sheets
  // failed to load. Shadows exist for exactly two of these species (see
  // ASSETS.chicken/.cow's `shadowKey` comments) — `shadowPath` is simply
  // absent on the rest, so the loop below naturally skips them.
  for (const animal of [ASSETS.chicken, ASSETS.cow, ASSETS.pig, ASSETS.sheep, ASSETS.ram]) {
    load.image(animal.walkKey, animal.walkPath);
    load.image(animal.eatKey, animal.eatPath);
    if ("shadowKey" in animal) load.image(animal.shadowKey, animal.shadowPath);
  }
  // The obora's bull — ONE texture (walk+eat stacked as row-blocks, see
  // ASSETS.bull), loaded and sliced through the same plain single-texture
  // path as rabbit/boar/wolf rather than the pair-of-textures loop above.
  load.image(ASSETS.bull.key, ASSETS.bull.path);
  // Forest birds — 4 distinct still sprites in one small sheet, no walk/eat
  // states at all (see ASSETS.birds/BIRD/Bird.ts).
  load.image(ASSETS.birds.key, ASSETS.birds.path);
  // Village strays — 4 colour variants, each its own walk-only sheet (no
  // "eat" texture, see ASSETS.cat). Shape genuinely differs from the loop
  // above (one texture per colour, not a walk/eat pair), so it gets its own
  // small loop rather than being forced through the same one.
  for (const color of Object.values(ASSETS.cat.colors)) {
    load.image(color.walkKey, color.walkPath);
  }
  // Single-direction creatures (bear/deer/fox) — three separate textures
  // each (idle/walk/run), one profile facing mirrored via flipX. See
  // ASSETS.bear's comment for why this is a third sheet shape.
  for (const critter of [ASSETS.bear, ASSETS.deer, ASSETS.fox]) {
    load.image(critter.idleKey, critter.idlePath);
    load.image(critter.walkKey, critter.walkPath);
    load.image(critter.runKey, critter.runPath);
  }
}

/**
 * Cuts `kolo_mlynskie.png` into its two named frames ("lico" / "bok").
 *
 * Deliberately NOT `load.spritesheet`: the two views are different sizes
 * (128x96 and 64x96), so there is no single frame size that describes them.
 * Adding frames to the loaded texture by hand is the same move the character
 * sheet already makes for its irregular pitch.
 *
 * A missing PNG is survivable exactly like everywhere else here: the texture
 * won't exist, the frames aren't added, and `GameScene` simply spawns no
 * wheel. Nothing else in the game asks for it.
 */
function sliceWaterwheel(scene: Phaser.Scene) {
  const cfg = ASSETS.waterwheel;
  if (!scene.textures.exists(cfg.key)) return;
  const tex = scene.textures.get(cfg.key);
  for (const [name, f] of Object.entries(cfg.frames)) {
    if (!tex.has(name)) tex.add(name, 0, f.x, f.y, f.w, f.h);
  }
}

/**
 * After the load phase: create placeholders for anything that didn't load, then
 * slice the character & rabbit sheets into frame-based spritesheet textures.
 *
 * "Missing" is determined by texture existence — robust regardless of when the
 * loader's error events fire.
 */
export function finalizeTextures(scene: Phaser.Scene): void {
  missingAssets.clear();
  for (const key of [
    // Like buildings below: no placeholder is generated for the terrain sheet
    // either. A colour swatch has the wrong dimensions, so every tile index
    // would resolve to garbage; TiledMap refuses to build the map instead and
    // MapBuilder's code-authored fallback takes over.
    ASSETS.teren.key,
    ASSETS.nature.key,
    ASSETS.character.key,
    ASSETS.rabbit.key,
    ASSETS.boar.key,
    ASSETS.wolf.key,
    ASSETS.greyWolf.key,
    ASSETS.npc.key,
    ASSETS.items.key,
    // No placeholder is generated for this one: a colour swatch would resolve
    // every building tile index to garbage, so TiledMap simply skips the
    // tileset when it's missing and the map loads without the buildings.
    ASSETS.buildings.key,
    ASSETS.kuznia.key,
    // The campfire has to be in THIS list, not just loaded above, and the
    // distinction is easy to miss: `missingAssets` is built only from the keys
    // named here, so a key that is loaded but unlisted always reports as
    // present. `makeCampfirePlaceholder` is gated on exactly that check — leave
    // the campfire out and a missing PNG would silently skip the generator and
    // leave the sprite pointing at a texture that doesn't exist.
    ASSETS.campfire.key,
    // Listed for the opposite reason to the campfire: there is NO generator
    // behind it and none is wanted. Being on this list is what makes a broken
    // entry get dropped, so `textures.exists(equip-doll)` in PlayerPanel means
    // "the frame really loaded" rather than "Phaser has a key by that name" —
    // and the panel falls back to plain slot boxes when it didn't.
    ASSETS.equipDoll.key,
    // Ten sam powód, co przy `equipDoll`: żadnego generatora placeholdera nie
    // ma i nie ma być, a obecność na tej liście jest tym, co sprawia, że
    // zepsuty wpis zostaje USUNIĘTY — dzięki temu `textures.exists` znaczy
    // „naprawdę się wczytało".
    ASSETS.slotGlyphs.key,
  ]) {
    if (!isUsableTexture(scene, key)) {
      // Drop any broken/empty entry so generateTexture can claim the key.
      if (scene.textures.exists(key)) scene.textures.remove(key);
      missingAssets.add(key);
    }
  }

  // 1) Placeholders for anything missing.
  if (missingAssets.has(ASSETS.nature.key)) makeNaturePlaceholder(scene);
  if (missingAssets.has(ASSETS.character.key)) makeCharacterPlaceholder(scene);

  // 2) Slice the character sheet using explicit per-frame pixel positions
  //    (frames sit on a ~31×60 pitch, not a clean 32-grid). Works for real art
  //    AND the placeholder, which is drawn at the same positions.
  sliceCharacter(scene);

  // 3) Rabbit, boar, wolf & the Szary: real directional spritesheets
  //    generated at a clean grid — see tools/build_rabbit.py and its
  //    siblings tools/build_dzik.py, tools/build_wilk.py and
  //    tools/build_szary.py. Slicing registers frame indices on that grid;
  //    works for real art AND the placeholder, which is drawn on the same
  //    grid — same two-step pattern as sliceCharacter() above.
  if (missingAssets.has(ASSETS.rabbit.key)) makeRabbitPlaceholder(scene);
  sliceCreatureSheet(scene, ASSETS.rabbit);
  if (missingAssets.has(ASSETS.boar.key)) makeBoarPlaceholder(scene);
  sliceCreatureSheet(scene, ASSETS.boar);
  if (missingAssets.has(ASSETS.wolf.key)) makeWolfPlaceholder(scene);
  sliceCreatureSheet(scene, ASSETS.wolf);
  if (missingAssets.has(ASSETS.greyWolf.key)) makeGreyWolfPlaceholder(scene);
  sliceCreatureSheet(scene, ASSETS.greyWolf);
  // No placeholder pair here on purpose: the water wheel is drawn art with no
  // generator behind it, and a map that authors no wheel spawns none anyway.
  sliceWaterwheel(scene);
  sliceSlotGlyphs(scene);
  // Farm animals (chicken/cow/pig/sheep): two separate real sheets each
  // (walk / eat), each its own clean 4×4 grid — same slicing as
  // rabbit/boar/wolf, just run per texture since each species' "states" are
  // two textures rather than two row-bands of one (see ASSETS.chicken's
  // comment). No placeholder generator: same "missing file just degrades"
  // story as the water wheel above — FarmAnimal's caller in GameScene checks
  // isUsableTexture before spawning anything. The shadow sheet (chicken/cow
  // only) is a plain 1-column × 4-row grid on the SAME frame size, so it
  // reuses this exact slicer — frame index (row*1+col) lands on the row
  // number directly, which is exactly the value `dirRow` already uses.
  for (const animal of [ASSETS.chicken, ASSETS.cow, ASSETS.pig, ASSETS.sheep, ASSETS.ram]) {
    const { frameWidth, frameHeight, cols, rows } = animal;
    for (const key of [animal.walkKey, animal.eatKey]) {
      if (isUsableTexture(scene, key)) sliceCreatureSheet(scene, { key, frameWidth, frameHeight, cols, rows });
    }
    if ("shadowKey" in animal && isUsableTexture(scene, animal.shadowKey)) {
      sliceCreatureSheet(scene, { key: animal.shadowKey, frameWidth, frameHeight, cols: 1, rows });
    }
  }
  // Cats: one walk-only sheet per colour, same clean-grid slicing.
  {
    const { frameWidth, frameHeight, cols, rows } = ASSETS.cat;
    for (const color of Object.values(ASSETS.cat.colors)) {
      if (isUsableTexture(scene, color.walkKey)) {
        sliceCreatureSheet(scene, { key: color.walkKey, frameWidth, frameHeight, cols, rows });
      }
    }
  }
  // The bull: one texture, 8 rows (walk 0-3, eat/graze 4-7) — a plain grid
  // slice exactly like rabbit/boar/wolf, just with more rows than any of
  // those (see ASSETS.bull).
  if (isUsableTexture(scene, ASSETS.bull.key)) sliceCreatureSheet(scene, ASSETS.bull);
  // Birds: same plain grid slice, giving 4 addressable still frames
  // (0-3) — no animations are ever built from them (see ASSETS.birds).
  if (isUsableTexture(scene, ASSETS.birds.key)) sliceCreatureSheet(scene, ASSETS.birds);
  // Single-direction creatures (bear/deer/fox): three separate single-row
  // textures each, sliced with rows:1 — frame index is just the column.
  for (const critter of [ASSETS.bear, ASSETS.deer, ASSETS.fox]) {
    const { frameWidth, frameHeight } = critter;
    const sheets: [string, number][] = [
      [critter.idleKey, critter.idleFrames],
      [critter.walkKey, critter.walkFrames],
      [critter.runKey, critter.runFrames],
    ];
    for (const [key, cols] of sheets) {
      if (isUsableTexture(scene, key)) sliceCreatureSheet(scene, { key, frameWidth, frameHeight, cols, rows: 1 });
    }
  }

  // 3b) Spiders (and the web shot): no source PNGs yet, so always generated.
  makeSpiderPlaceholder(scene);
  makeVenomSpiderPlaceholder(scene);
  makeWebPlaceholder(scene);
  // The entrance marker: generated for the same reason the spiders are, plus
  // one of its own — it must exist for EVERY future transition (a door, a cave
  // mouth), and a texture that has to be painted per place is a texture
  // somebody eventually forgets to paint.
  makePortalMarkerTexture(scene);
  // Pierścień celu: generowany z powodu wydajnościowego, nie artystycznego —
  // patrz COMBAT_FEEDBACK.targetMarker.
  makeTargetMarkerTexture(scene);
  makeTrainingDummyHintTexture(scene);
  makeVignetteTexture(scene);
  // Damage-type icons: generated for the same reason the herbs are, plus one of
  // its own — they must never be emoji in a system font (see ASSETS.damageTypeIcons).
  makeDamageTypeIcons(scene);

  // 3c) Campfire: real art now (`ognisko_paleta.png`), generated only if that
  //     file didn't load. It used to be cut out of Nature.png; the sheet
  //     rebuild moved every tile and turned that crop into part of a tree
  //     crown without anything failing — see ASSETS.campfire for why it is a
  //     standalone PNG and not a tile pick.
  if (missingAssets.has(ASSETS.campfire.key)) makeCampfirePlaceholder(scene);
  makeMerchantBadgeTexture(scene);

  // 4) Sword: a standalone icon on the character sheet (not a per-frame
  //    overlay) — extract once and attach it as a child sprite in Player.
  if (missingAssets.has(ASSETS.character.key)) {
    makeSwordPlaceholder(scene);
  } else {
    const s = ASSETS.character.sword;
    extractTile(scene, ASSETS.character.key, ASSETS.character.swordKey, s.x, s.y, s.w, s.h);
  }

  // 5) NPC: the merchant never moves, so we only need one static pose —
  //    extract the idle-down frame, or a placeholder under the same key.
  if (missingAssets.has(ASSETS.npc.key)) {
    makeNpcPlaceholder(scene);
  } else {
    const p = ASSETS.npc.portrait;
    extractTile(scene, ASSETS.npc.key, ASSETS.npc.portraitKey, p.x, p.y, p.w, p.h);
  }

  // 5b) Kowal's idle-loop spritesheet — no placeholder generator, same as
  //     ASSETS.kowal above: if the file didn't load, Merchant falls back to
  //     the static portrait (then further to the shared NPC placeholder), so
  //     there is nothing to slice and nothing to fail here.
  if (isUsableTexture(scene, ASSETS.kowalIdle.key)) {
    sliceCreatureSheet(scene, ASSETS.kowalIdle);
  }

  // 6) Item icons: weapons/armor with an `icon` pick get the real tile cut
  //    from items.png; everything else (and any item if items.png itself is
  //    missing) gets a generated colour swatch.
  makeItemIcons(scene, missingAssets.has(ASSETS.items.key));

  // 7) Ability icons — always generated, there is no source sheet for them.
  makeAbilityIcons(scene);
}

/** A texture is usable if it exists and its source image has real dimensions. */
function isUsableTexture(scene: Phaser.Scene, key: string): boolean {
  if (!scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  return !!src && src.width > 0 && src.height > 0;
}

/**
 * Register character frames on the texture at explicit pixel positions.
 * Frame index = row * perCol + col.
 */
function sliceCharacter(scene: Phaser.Scene): void {
  const cfg = ASSETS.character;
  const tex = scene.textures.get(cfg.key);
  for (let r = 0; r < cfg.rowStarts.length; r++) {
    for (let c = 0; c < cfg.perCol; c++) {
      const index = r * cfg.perCol + c;
      tex.add(index, 0, cfg.colStarts[c], cfg.rowStarts[r], cfg.frameWidth, cfg.frameHeight);
    }
  }
}

/**
 * The frame-grid shape shared by every generated directional creature sheet
 * (ASSETS.rabbit/boar/wolf — same 5 fields regardless of how each one's
 * frames are organized into animations). `rows` is explicit rather than
 * derived from e.g. `walkRow`/`runRow`, because ASSETS.wolf has no such
 * fields — it has a `states` table instead (6 states × 4 real directions is
 * too rich for the rabbit/boar walk-cycle shape).
 */
interface CreatureSheetCfg {
  key: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
}

/**
 * Register a creature's frames on the texture at a clean uniform grid (no
 * gap — these sheets are generated by us, not hand-authored, so there's no
 * filtering bleed to guard against the way Teren/Nature's 33px pitch does).
 * Frame index = row * cols + col, same convention as sliceCharacter().
 */
/**
 * Rozetnij arkusz glifów slotów na klatki o numerach.
 *
 * ⚠ **Numer klatki jest ADRESEM** czytanym przez `DOLL_CELLS[].glyph`
 * (`src/ui/PaperDoll.ts`), a ustala go `ORDER` w `tools/build_slot_glyphs.py`.
 * Przestawienie tamtej listy bez przejrzenia tej nie wywali niczego — po prostu
 * da pasowi glif nogawic.
 *
 * Rozcinane RĘCZNIE, nie przez `load.spritesheet`, z tego samego powodu, co
 * reszta arkuszy w tym pliku: ładujemy wszystko jako zwykłe obrazki i tniemy po
 * wczytaniu, gdy znamy prawdziwe wymiary.
 */
function sliceSlotGlyphs(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ASSETS.slotGlyphs.key)) return;
  const { key, cell, cols, count } = ASSETS.slotGlyphs;
  const tex = scene.textures.get(key);
  for (let i = 0; i < count; i++) {
    tex.add(i, 0, (i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
  }
}

function sliceCreatureSheet(scene: Phaser.Scene, cfg: CreatureSheetCfg): void {
  const tex = scene.textures.get(cfg.key);
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const index = r * cfg.cols + c;
      tex.add(index, 0, c * cfg.frameWidth, r * cfg.frameHeight, cfg.frameWidth, cfg.frameHeight);
    }
  }
}

/**
 * Extract a single sub-rectangle of a texture into its own texture key.
 * If `dw`/`dh` are given, the source rect is scaled (nearest-neighbour) into a
 * destination of that size — handy for turning a small clean tile into a full
 * 32×32 map tile.
 */
export function extractTile(
  scene: Phaser.Scene,
  sourceKey: string,
  destKey: string,
  x: number,
  y: number,
  w: number,
  h: number,
  dw: number = w,
  dh: number = h,
): void {
  if (scene.textures.exists(destKey)) return;
  const src = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const canvasTex = scene.textures.createCanvas(destKey, dw, dh);
  if (!canvasTex) return;
  const ctx = canvasTex.getContext();
  ctx.imageSmoothingEnabled = false;
  // Clamp source rect to the image so bad coords never throw.
  const sx = Phaser.Math.Clamp(x, 0, Math.max(0, src.width - 1));
  const sy = Phaser.Math.Clamp(y, 0, Math.max(0, src.height - 1));
  const sw = Phaser.Math.Clamp(w, 1, src.width - sx);
  const sh = Phaser.Math.Clamp(h, 1, src.height - sy);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, dw, dh);
  canvasTex.refresh();
}

/**
 * Extract a prop built from several tiles on Nature.png's confirmed tile grid
 * (every tile is exactly 32×32px on a 33px pitch — 1px transparent separator
 * before the next tile — verified across the whole sheet). Rather than trying
 * to detect separator lines by scanning for transparency (fragile: a single
 * stray opaque pixel from a decoration bleeding 1px into the gap, e.g. the
 * bridge's corner bracket shadow, can fool that heuristic and leave a visible
 * seam), this copies each known 32×32 tile block directly and stitches them
 * edge-to-edge with zero gap — deterministic, so it can never leak a seam.
 */
export function extractTileGrid(
  scene: Phaser.Scene,
  sourceKey: string,
  destKey: string,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  tileSize = 32,
  pitch = 33,
): void {
  if (scene.textures.exists(destKey)) return;
  const src = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const canvasTex = scene.textures.createCanvas(destKey, colSpan * tileSize, rowSpan * tileSize);
  if (!canvasTex) return;
  const ctx = canvasTex.getContext();
  ctx.imageSmoothingEnabled = false;

  for (let j = 0; j < rowSpan; j++) {
    for (let i = 0; i < colSpan; i++) {
      const sx = (col + i) * pitch;
      const sy = (row + j) * pitch;
      ctx.drawImage(src, sx, sy, tileSize, tileSize, i * tileSize, j * tileSize, tileSize, tileSize);
    }
  }
  canvasTex.refresh();
}

/* ────────────────────────────────────────────────────────────────────────
 * Procedural placeholders (only used when a real PNG is missing)
 * ──────────────────────────────────────────────────────────────────────── */

function makeNaturePlaceholder(scene: Phaser.Scene): void {
  // A small tileset-like canvas is not needed: the MapBuilder pulls named
  // tiles via extractTile, and those extractions will themselves fall back to
  // solid-colour placeholders (handled in MapBuilder). Here we just guarantee
  // the base key exists so extractTile doesn't crash.
  const g = scene.add.graphics();
  g.fillStyle(0x3f7d3a, 1);
  g.fillRect(0, 0, 96, 96);
  g.generateTexture(ASSETS.nature.key, 96, 96);
  g.destroy();
}

function makeCharacterPlaceholder(scene: Phaser.Scene): void {
  const cfg = ASSETS.character;
  const { frameWidth: fw, frameHeight: fh, colStarts, rowStarts } = cfg;
  const g = scene.add.graphics();
  // Per-direction body colours so you can see facing while testing.
  const dirColors = [0x4477dd, 0x33aa55, 0xdd8833, 0xcc4488]; // down,up,left,right
  for (let r = 0; r < rowStarts.length; r++) {
    for (let c = 0; c < cfg.perCol; c++) {
      const x = colStarts[c];
      const y = rowStarts[r];
      const feet = y + fh - 4;
      const attack = c === cfg.attackCol;
      g.fillStyle(dirColors[r % dirColors.length], 1);
      g.fillRoundedRect(x + 8, y + 20, fw - 16, fh - 30, 4); // torso/legs
      g.fillStyle(0xffe0bd, 1);
      g.fillCircle(x + fw / 2, y + 15, 7); // head
      // Attack pose: an extended "arm"; walk: shifting legs.
      g.fillStyle(0x222233, 1);
      if (attack) {
        g.fillRect(x + fw - 6, y + fh / 2, 8, 3);
      } else {
        g.fillRect(x + fw / 2 - 5 + (c - 1) * 2, feet - 8, 3, 8);
        g.fillRect(x + fw / 2 + 2 - (c - 1) * 2, feet - 8, 3, 8);
      }
    }
  }
  g.generateTexture(cfg.key, 256, 256);
  g.destroy();
}

/**
 * Placeholder rabbit sheet — drawn on the exact same grid sliceRabbit()
 * expects, so a missing rabbit.png still gets working idle/walk/run frames
 * (just a plainer bunny) instead of the game falling over.
 */
function makeRabbitPlaceholder(scene: Phaser.Scene): void {
  const cfg = ASSETS.rabbit;
  const { frameWidth: fw, frameHeight: fh, cols } = cfg;
  const rows = Math.max(cfg.walkRow, cfg.runRow) + 1;
  const g = scene.add.graphics();

  const bunny = (x: number, y: number, sideView: boolean, faded: boolean) => {
    const cx = x + fw / 2;
    const bodyY = sideView ? y + fh * 0.6 : y + fh * 0.62;
    g.fillStyle(faded ? 0xc9c9c9 : 0xffffff, 1);
    if (sideView) {
      g.fillEllipse(cx, bodyY, fw * 0.6, fh * 0.34); // body, in profile
      g.fillCircle(x + fw * 0.74, bodyY - fh * 0.16, fw * 0.16); // head, forward
      g.fillEllipse(x + fw * 0.7, bodyY - fh * 0.34, fw * 0.1, fh * 0.2); // ear
    } else {
      g.fillEllipse(cx, bodyY, fw * 0.62, fh * 0.5); // body
      g.fillEllipse(cx - fw * 0.18, y + fh * 0.22, fw * 0.16, fh * 0.32); // left ear
      g.fillEllipse(cx + fw * 0.18, y + fh * 0.22, fw * 0.16, fh * 0.32); // right ear
    }
    if (!faded) {
      g.fillStyle(0xcc2222, 1);
      if (sideView) g.fillCircle(x + fw * 0.82, bodyY - fh * 0.16, 1.4);
      else {
        g.fillCircle(cx - fw * 0.1, y + fh * 0.4, 1.4);
        g.fillCircle(cx + fw * 0.1, y + fh * 0.4, 1.4);
      }
    }
  };

  // Row 0: idle-down (facing camera) + idle-up (faded — back of the head).
  bunny(cfg.idleDownFrame * fw, 0, false, false);
  bunny(cfg.idleUpFrame * fw, 0, false, true);
  // Walk/run rows: same side silhouette in every column — a placeholder only
  // has to boot the game, not sell the illusion of a hop cycle.
  for (let c = 0; c < cols; c++) {
    bunny(c * fw, cfg.walkRow * fh, true, false);
    bunny(c * fw, cfg.runRow * fh, true, false);
  }

  g.generateTexture(cfg.key, fw * cols, fh * rows);
  g.destroy();
}

/**
 * Placeholder boar sheet — drawn on the exact same grid sliceCreatureSheet()
 * expects (see makeRabbitPlaceholder above for why: a missing boar.png still
 * gets working idle/walk/run frames, just a plainer beast).
 */
function makeBoarPlaceholder(scene: Phaser.Scene): void {
  const cfg = ASSETS.boar;
  const { frameWidth: fw, frameHeight: fh, cols } = cfg;
  const rows = Math.max(cfg.walkRow, cfg.runRow) + 1;
  const g = scene.add.graphics();

  const beast = (x: number, y: number, sideView: boolean, faded: boolean) => {
    const w = fw, h = fh;
    g.fillStyle(faded ? 0x8c7862 : 0x6b4a2f, 1);
    if (sideView) {
      g.fillEllipse(x + w * 0.45, y + h * 0.62, w * 0.86, h * 0.5); // body, in profile
      g.fillStyle(0x7d5836, 1);
      g.fillCircle(x + w * 0.78, y + h * 0.46, w * 0.18); // head, forward
      g.fillStyle(0x543a24, 1);
      g.fillTriangle(x + w * 0.72, y + h * 0.3, x + w * 0.84, y + h * 0.3, x + w * 0.78, y + h * 0.1); // ear
      if (!faded) {
        g.fillStyle(0xf0ead6, 1);
        g.fillTriangle(x + w * 0.86, y + h * 0.5, x + w * 0.94, y + h * 0.52, x + w * 0.88, y + h * 0.4); // tusk
        g.fillStyle(0x120d08, 1);
        g.fillCircle(x + w * 0.76, y + h * 0.42, 1.5); // eye
      }
    } else {
      g.fillEllipse(x + w * 0.5, y + h * 0.62, w * 0.72, h * 0.56); // body
      g.fillStyle(0x543a24, 1);
      g.fillTriangle(x + w * 0.34, y + h * 0.3, x + w * 0.5, y + h * 0.3, x + w * 0.42, y + h * 0.04); // left ear
      g.fillTriangle(x + w * 0.54, y + h * 0.3, x + w * 0.7, y + h * 0.3, x + w * 0.62, y + h * 0.04); // right ear
      if (!faded) {
        g.fillStyle(0x7d5836, 1);
        g.fillEllipse(x + w * 0.5, y + h * 0.58, w * 0.3, h * 0.24); // snout
        g.fillStyle(0x120d08, 1);
        g.fillCircle(x + w * 0.42, y + h * 0.4, 1.5);
        g.fillCircle(x + w * 0.58, y + h * 0.4, 1.5);
      }
    }
  };

  beast(cfg.idleDownFrame * fw, 0, false, false);
  beast(cfg.idleUpFrame * fw, 0, false, true);
  for (let c = 0; c < cols; c++) {
    beast(c * fw, cfg.walkRow * fh, true, false);
    beast(c * fw, cfg.runRow * fh, true, false);
  }

  g.generateTexture(cfg.key, fw * cols, fh * rows);
  g.destroy();
}

/**
 * Placeholder wolf sheet — drawn on the exact same 24-row (state×direction)
 * grid sliceCreatureSheet() expects, so a missing wolf.png still gets a
 * working idle/walk pose per direction (every other state falls back to the
 * idle pose — a placeholder only has to boot the game, not sell six states).
 */
function makeWolfPlaceholder(scene: Phaser.Scene): void {
  const cfg = ASSETS.wolf;
  const { frameWidth: fw, frameHeight: fh, cols, rows } = cfg;
  const g = scene.add.graphics();

  const beast = (x: number, y: number, sideView: boolean, faded: boolean) => {
    const w = fw, h = fh;
    g.fillStyle(0x5b5f66, 1);
    if (sideView) {
      g.fillEllipse(x + w * 0.46, y + h * 0.6, w * 0.62, h * 0.3); // body, in profile
      g.fillStyle(0x6f7379, 1);
      g.fillCircle(x + w * 0.78, y + h * 0.45, w * 0.15); // head, forward
      g.fillStyle(0x44474d, 1);
      g.fillTriangle(x + w * 0.72, y + h * 0.3, x + w * 0.84, y + h * 0.3, x + w * 0.78, y + h * 0.1); // ear
      if (!faded) {
        g.fillStyle(0xe8e6df, 1);
        g.fillTriangle(x + w * 0.86, y + h * 0.5, x + w * 0.95, y + h * 0.53, x + w * 0.88, y + h * 0.42); // fang
        g.fillStyle(0xd8c24a, 1);
        g.fillCircle(x + w * 0.76, y + h * 0.4, 1.5); // eye
      }
    } else {
      g.fillEllipse(x + w * 0.5, y + h * 0.6, w * 0.56, h * 0.44); // body
      g.fillStyle(0x44474d, 1);
      g.fillTriangle(x + w * 0.34, y + h * 0.3, x + w * 0.5, y + h * 0.3, x + w * 0.42, y + h * 0.04); // left ear
      g.fillTriangle(x + w * 0.54, y + h * 0.3, x + w * 0.7, y + h * 0.3, x + w * 0.62, y + h * 0.04); // right ear
      if (!faded) {
        g.fillStyle(0x6f7379, 1);
        g.fillEllipse(x + w * 0.5, y + h * 0.56, w * 0.24, h * 0.2); // snout
        g.fillStyle(0xd8c24a, 1);
        g.fillCircle(x + w * 0.42, y + h * 0.4, 1.5);
        g.fillCircle(x + w * 0.58, y + h * 0.4, 1.5);
      }
    }
  };

  // Row = states[X].row + dirRow[dir], same formula as GameConfig/tools/build_wilk.py.
  // The idle pose is repeated across every column of every state's rows —
  // frames exist so slicing/animation never errors, they just don't animate.
  for (const [, def] of Object.entries(cfg.states)) {
    for (let d = 0; d < 4; d++) {
      const row = def.row + d;
      const sideView = d >= 2; // dirRow: 0 down, 1 up, 2 left, 3 right
      const faded = d === 1; // "up" (back-facing) has no face detail
      for (let c = 0; c < cols; c++) beast(c * fw, row * fh, sideView, faded);
    }
  }

  g.generateTexture(cfg.key, fw * cols, fh * rows);
  g.destroy();
}

/**
 * The Szary. Same shape language as the ordinary wolf — he has to read as the
 * same animal — but paler, heavier-browed and scarred, so at a glance he is
 * "that one" rather than a wolf standing closer to the camera. The size
 * difference alone would not do it: the sprite is scaled per-config, so two
 * scales of one texture look like perspective, not like two creatures.
 */
/**
 * Placeholder Szary sheet — same grid sliceCreatureSheet() expects, same
 * shape language as makeWolfPlaceholder (paler, heavier-browed, scarred) so
 * a missing greywolf.png still reads as "that one", not as a wolf that
 * failed to load.
 */
function makeGreyWolfPlaceholder(scene: Phaser.Scene): void {
  const cfg = ASSETS.greyWolf;
  const { frameWidth: fw, frameHeight: fh, cols, rows } = cfg;
  const g = scene.add.graphics();

  const beast = (x: number, y: number, sideView: boolean, faded: boolean) => {
    const w = fw, h = fh;
    g.fillStyle(0x8b8f97, 1);
    if (sideView) {
      g.fillEllipse(x + w * 0.46, y + h * 0.6, w * 0.66, h * 0.32); // body, in profile
      g.fillStyle(0x9ea2aa, 1);
      g.fillCircle(x + w * 0.78, y + h * 0.45, w * 0.16); // head, forward
      g.fillStyle(0x6d717a, 1);
      g.fillTriangle(x + w * 0.72, y + h * 0.3, x + w * 0.84, y + h * 0.3, x + w * 0.78, y + h * 0.08); // ear
      g.fillStyle(0x2b2e33, 1);
      g.fillRect(x + w * 0.7, y + h * 0.35, w * 0.14, h * 0.045); // heavy brow — the "old" tell
      if (!faded) {
        g.fillStyle(0xf2f0e8, 1);
        g.fillTriangle(x + w * 0.86, y + h * 0.5, x + w * 0.95, y + h * 0.53, x + w * 0.88, y + h * 0.42); // fang
        g.fillStyle(0xc94b3a, 1);
        g.fillRect(x + w * 0.74, y + h * 0.42, w * 0.02, h * 0.14); // scar
        g.fillStyle(0xffd24a, 1);
        g.fillCircle(x + w * 0.76, y + h * 0.4, 1.8); // eye — brighter than the pack's
      }
    } else {
      g.fillEllipse(x + w * 0.5, y + h * 0.6, w * 0.58, h * 0.46); // body
      g.fillStyle(0x6d717a, 1);
      g.fillTriangle(x + w * 0.34, y + h * 0.3, x + w * 0.5, y + h * 0.3, x + w * 0.42, y + h * 0.02); // left ear
      g.fillTriangle(x + w * 0.54, y + h * 0.3, x + w * 0.7, y + h * 0.3, x + w * 0.62, y + h * 0.02); // right ear
      g.fillStyle(0x2b2e33, 1);
      g.fillRect(x + w * 0.38, y + h * 0.32, w * 0.24, h * 0.05); // brow bar
      if (!faded) {
        g.fillStyle(0x9ea2aa, 1);
        g.fillEllipse(x + w * 0.5, y + h * 0.56, w * 0.24, h * 0.2); // snout
        g.fillStyle(0xc94b3a, 1);
        g.fillRect(x + w * 0.46, y + h * 0.42, w * 0.02, h * 0.16); // scar
        g.fillStyle(0xffd24a, 1);
        g.fillCircle(x + w * 0.42, y + h * 0.4, 1.8);
        g.fillCircle(x + w * 0.58, y + h * 0.4, 1.8);
      }
    }
  };

  for (const [, def] of Object.entries(cfg.states)) {
    for (let d = 0; d < 4; d++) {
      const row = def.row + d;
      const sideView = d >= 2;
      const faded = d === 1;
      for (let c = 0; c < cols; c++) beast(c * fw, row * fh, sideView, faded);
    }
  }

  g.generateTexture(cfg.key, fw * cols, fh * rows);
  g.destroy();
}

/** Forest spider: dark bulb of a body with legs splayed either side. Legs are
 *  what make it read as a spider at 28px, so they get the width budget. */
function makeSpiderPlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.spider.face;
  const g = scene.add.graphics();
  g.lineStyle(2, 0x2e2a33, 1);
  for (let i = 0; i < 3; i++) {
    const y = h * (0.34 + i * 0.16);
    g.beginPath();
    g.moveTo(w * 0.34, y);
    g.lineTo(w * 0.06, y + h * (i === 0 ? -0.16 : 0.14));
    g.strokePath();
    g.beginPath();
    g.moveTo(w * 0.66, y);
    g.lineTo(w * 0.94, y + h * (i === 0 ? -0.16 : 0.14));
    g.strokePath();
  }
  g.fillStyle(0x3a3340, 1);
  g.fillEllipse(w * 0.5, h * 0.58, w * 0.52, h * 0.6); // abdomen
  g.fillStyle(0x4a4252, 1);
  g.fillEllipse(w * 0.5, h * 0.3, w * 0.36, h * 0.3); // cephalothorax
  g.fillStyle(0xcfe8a0, 1);
  g.fillCircle(w * 0.44, h * 0.26, 1.8); // eyes, in the venom colour so the
  g.fillCircle(w * 0.56, h * 0.26, 1.8); // creature and its web match
  g.generateTexture(ASSETS.spider.faceKey, w, h);
  g.destroy();
}

/**
 * Skoczek jadowity — the melee spider.
 *
 * Deliberately NOT the sieciarz's texture at a different scale: two scales of
 * one sprite read as perspective, not as two creatures (the same lesson the
 * Szary's own sheet exists for). So this one is smaller, paler, drawn with a
 * *compact* body and a wide, low leg stance, and it carries its venom colour on
 * the abdomen rather than only in the eyes — the sieciarz keeps venom green for
 * its web, this one wears it.
 */
function makeVenomSpiderPlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.venomSpider.face;
  const g = scene.add.graphics();
  // Legs: lower and wider than the sieciarz's, so the silhouette reads as
  // "crouched to jump" rather than "hanging in a web".
  g.lineStyle(2, 0x4a3b22, 1);
  for (let i = 0; i < 3; i++) {
    const y = h * (0.42 + i * 0.15);
    g.beginPath();
    g.moveTo(w * 0.36, y);
    g.lineTo(w * 0.02, y + h * (i === 0 ? -0.2 : 0.12));
    g.strokePath();
    g.beginPath();
    g.moveTo(w * 0.64, y);
    g.lineTo(w * 0.98, y + h * (i === 0 ? -0.2 : 0.12));
    g.strokePath();
  }
  g.fillStyle(0x7d9b33, 1);
  g.fillEllipse(w * 0.5, h * 0.62, w * 0.5, h * 0.52); // abdomen, venom green
  g.fillStyle(0x5c4a28, 1);
  g.fillEllipse(w * 0.5, h * 0.34, w * 0.4, h * 0.34); // cephalothorax, earthy
  g.fillStyle(0xe8f0c0, 1);
  g.fillCircle(w * 0.42, h * 0.3, 1.6); // pale eyes — the only bright pixels,
  g.fillCircle(w * 0.58, h * 0.3, 1.6); // so the tell's tint reads clearly
  g.generateTexture(ASSETS.venomSpider.faceKey, w, h);
  g.destroy();
}

/**
 * The entrance marker drawn on every map transition (see `PORTAL.marker`).
 *
 * Drawn pointing **up**; the sprite is rotated per portal, so one texture
 * serves every direction and there is nothing to keep in sync.
 *
 * Shape, and why it is this and not something prettier: a **flat arch on the
 * ground plus a chevron inside it**. The arch is what makes it read as a
 * threshold you pass through rather than a marker you stand on, and it is
 * drawn in perspective (an ellipse, squashed on Y) because everything else in
 * this game lies on the ground in the same top-down-ish projection. The
 * chevron says which way through. Nothing glows, nothing spins: this is the
 * same register as the target ring, not a fantasy portal.
 */
function makePortalMarkerTexture(scene: Phaser.Scene): void {
  const s = PORTAL.marker.size;
  const c = PORTAL.marker.color;
  const g = scene.add.graphics();

  // Threshold arch, open at the bottom — a doorway seen from above-behind.
  g.lineStyle(3, c, 0.9);
  g.beginPath();
  g.arc(s / 2, s * 0.62, s * 0.34, Math.PI * 1.08, Math.PI * 1.92);
  g.strokePath();
  // Squash it onto the ground plane: drawn round, scaled on Y when placed.
  g.lineStyle(2, c, 0.55);
  g.strokeEllipse(s / 2, s * 0.66, s * 0.66, s * 0.3);

  // Chevron: three strokes so it stays legible at 0.42 alpha over grass.
  g.lineStyle(4, c, 1);
  for (let i = 0; i < 2; i++) {
    const y = s * (0.34 + i * 0.16);
    g.beginPath();
    g.moveTo(s * 0.34, y + s * 0.1);
    g.lineTo(s * 0.5, y);
    g.lineTo(s * 0.66, y + s * 0.1);
    g.strokePath();
  }

  g.generateTexture(ASSETS.portalMarker.textureKey, s, s);
  g.destroy();
}

/**
 * Pierścień zaznaczenia celu, upieczony raz przy starcie.
 *
 * ⚠ **Obrys leży W ŚRODKU tekstury, nie na jej krawędzi.** `strokeCircle`
 * rysuje linię wyśrodkowaną na promieniu, więc połowa grubości wychodzi na
 * zewnątrz — płótno o boku `2 × promień` obcięłoby ją równo w pół dookoła.
 * Stąd `+ thickness` w rozmiarze i to jest jedyna arytmetyka, którą ta funkcja
 * musi mieć dobrze.
 */
/**
 * ⭐ **Klucz tekstury pierścienia celu dla danej połowy szerokości** (2026-10-04)
 * — elipsa NA GRUNCIE (`COMBAT_FEEDBACK.targetMarker.groundRatio`), pieczona raz
 * na rozmiar i trzymana w menedżerze tekstur. ⚠ Nie skalowanie jednej tekstury:
 * grubość obrysu rosłaby razem z niedźwiedziem (4–5 px) i malała przy króliku.
 */
export function targetMarkerKey(scene: Phaser.Scene, halfWidth: number): string {
  const rx = Math.max(COMBAT_FEEDBACK.targetMarker.groundMinHalf, Math.round(halfWidth / 2) * 2);
  const key = `${ASSETS.targetMarker.textureKey}-g${rx}`;
  if (scene.textures.exists(key)) return key;
  const { thickness, groundRatio } = COMBAT_FEEDBACK.targetMarker;
  const ry = Math.max(5, Math.round(rx * groundRatio));
  const w = (rx + thickness) * 2;
  const h = (ry + thickness) * 2;
  const g = scene.add.graphics();
  g.lineStyle(thickness, 0xffffff, 1);
  g.strokeEllipse(w / 2, h / 2, rx * 2, ry * 2);
  g.generateTexture(key, w, h);
  g.destroy();
  return key;
}

function makeTargetMarkerTexture(scene: Phaser.Scene): void {
  const { radius, thickness } = COMBAT_FEEDBACK.targetMarker;
  const size = (radius + thickness) * 2;
  const g = scene.add.graphics();
  /* ⚠ **Pieczony BIAŁY, kolorowany tintem u odbiorcy — zmiana 2026-09-11.**
     Wygląd jest bit w bit ten sam (tint mnoży, a biel jest jedynką
     multiplikatywną), ale dopiero biała tekstura potrafi przyjąć DRUGI kolor:
     pierścień celu ma od tej daty trzy stany („dosięgam", „za daleko", „za
     plecami" — `COMBAT_FEEDBACK.targetMarker.states`). Zapieczona czerwień
     pozwalała wyłącznie przygaszać, bo tint nie potrafi rozjaśnić kanału,
     którego w teksturze nie ma.
     ⛔ Nie wpisuj tu z powrotem `color`: barwę nadaje `GameScene.selectTarget`
     i to jest jedno miejsce, w którym stan pierścienia jest rozstrzygany. */
  g.lineStyle(thickness, 0xffffff, 1);
  g.strokeCircle(size / 2, size / 2, radius);
  g.generateTexture(ASSETS.targetMarker.textureKey, size, size);
  g.destroy();
}

/**
 * The training dummy's neutral "you're close" ring — same baked-texture
 * technique as `makeTargetMarkerTexture` above, deliberately a SEPARATE
 * texture rather than a tint on that one, so it can never visually collide
 * with "this is your active target" (see `TRAINING_DUMMY.hint` in
 * GameConfig.ts for why).
 */
function makeTrainingDummyHintTexture(scene: Phaser.Scene): void {
  const { radius, thickness, color } = TRAINING_DUMMY.hint.ring;
  const size = (radius + thickness) * 2;
  const g = scene.add.graphics();
  g.lineStyle(thickness, color, 1);
  g.strokeCircle(size / 2, size / 2, radius);
  g.generateTexture(ASSETS.trainingDummyHint.textureKey, size, size);
  g.destroy();
}

/** Texture key of the loaded sprite for a herb species (`ASSETS.herb*`). */
export function herbTextureKey(id: string): string {
  return `herb-${id}`;
}

/**
 * Low-health vignette: a radial gradient, transparent in the middle and red at
 * the edges. Built on a canvas texture because Phaser's shape objects can't do
 * gradients — same "generate it rather than ship a PNG" rule as everything else
 * here, and it means the colour and falloff are tunable from ASSETS.vignette.
 */
function makeVignetteTexture(scene: Phaser.Scene): void {
  const v = ASSETS.vignette;
  const tex = scene.textures.createCanvas(v.textureKey, v.size, v.size);
  if (!tex) return; // texture already exists (scene restart) — reuse it
  const ctx = tex.getContext();
  const half = v.size / 2;
  const grad = ctx.createRadialGradient(half, half, half * v.innerStop, half, half, half);
  grad.addColorStop(0, `rgba(${v.color},0)`);
  grad.addColorStop(1, `rgba(${v.color},1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, v.size, v.size);
  tex.refresh();
}

/** The web shot: a pale sticky blob with a couple of trailing strands. */
function makeWebPlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.web.size;
  const g = scene.add.graphics();
  g.fillStyle(0xe8f0d8, 0.9);
  g.fillCircle(w * 0.5, h * 0.5, w * 0.34);
  g.lineStyle(1, 0xffffff, 0.85);
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i + Math.PI / 4;
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.5);
    g.lineTo(w * 0.5 + Math.cos(a) * w * 0.48, h * 0.5 + Math.sin(a) * h * 0.48);
    g.strokePath();
  }
  g.generateTexture(ASSETS.web.textureKey, w, h);
  g.destroy();
}

/** Texture key for one damage type's icon. One place, so nothing spells it twice. */
export function damageIconKey(type: DamageType): string {
  return `${ASSETS.damageTypeIcons.keyPrefix}${type}`;
}

/**
 * Trzy 12-pikselowe ikonki typu obrażeń: **miecz** (cięte), **włócznia**
 * (kłute), **młot** (obuchowe). Stoją przy liczbie obrażeń i mówią, czym cios
 * został zadany.
 *
 * Dlaczego generowane, a nie emoji — patrz `ASSETS.damageTypeIcons`.
 *
 * ⚠ **Wszystkie trzy leżą na TEJ SAMEJ przekątnej** (trzonek w lewym dolnym
 * rogu, głowica w prawym górnym) i różnią się **wyłącznie kształtem głowicy**.
 * To jest celowe: przy 12 px sylwetka jest jedyną informacją, jaka przetrwa, a
 * trzy różne orientacje kazałyby graczowi rozpoznawać trzy rzeczy naraz
 * zamiast jednej. Ta sama zasada, dla której ikony umiejętności są odróżniane
 * kształtem, a nie kolorem.
 *
 * Kontur rysowany PIERWSZY i grubszy, kształt na wierzchu — bez tego
 * 12-pikselowa sylwetka ginie na trawie i na ciemnym sprite'cie wroga.
 */
function makeDamageTypeIcons(scene: Phaser.Scene): void {
  const cfg = ASSETS.damageTypeIcons;

  const draw = (type: DamageType, shape: (g: Phaser.GameObjects.Graphics, outline: boolean) => void) => {
    const key = damageIconKey(type);
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    // Dwa przebiegi tym samym kształtem: najpierw grubszy kontur, potem
    // wypełnienie na wierzchu. Kolejność jest nośna — odwrotnie kontur zjadłby
    // rysunek, który przy 14 px i tak ma tylko ~10 px na treść.
    shape(g, true);
    shape(g, false);
    g.generateTexture(key, cfg.size, cfg.size);
    g.destroy();
  };

  const stroke = (
    g: Phaser.GameObjects.Graphics,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    width: number,
    color: number,
  ) => {
    g.lineStyle(width, color, 1);
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.strokePath();
  };

  // ⚠ Współrzędne poniżej są ZWERYFIKOWANE RENDEREM (podgląd w skali 13×), nie
  // wyprowadzone na oko. Pierwsza wersja, wyliczona „logicznie", dawała trzy
  // nieczytelne plamy z uciętymi głowicami. Zmieniając je, obejrzyj wynik.
  const wood = (outline: boolean) => (outline ? cfg.outline : cfg.wood);
  const metal = (outline: boolean) => (outline ? cfg.outline : cfg.metal);
  const grow = (outline: boolean) => (outline ? 1 : 0);
  const w = (base: number, outline: boolean) => base + (outline ? 2 : 0);

  // MIECZ — ostrze wzdłuż przekątnej, rękojeść u dołu i **poprzeczny jelec**.
  // Jelec jest tym, co odróżnia miecz od zwykłej kreski, więc musi wychodzić
  // poza obrys ostrza po obu stronach — inaczej zlewa się z nim w plamę.
  draw("slash", (g, o) => {
    stroke(g, 3.5, 10.5, 5, 9, w(2, o), wood(o)); // rękojeść
    stroke(g, 3.5, 7.5, 6.5, 10.5, w(2, o), metal(o)); // jelec, prostopadle do ostrza
    stroke(g, 5, 9, 11, 3, w(2, o), metal(o)); // ostrze
  });

  // WŁÓCZNIA — najdłuższy i NAJCIEŃSZY trzonek z całej trójki plus mały, wąski
  // grot. „Wąski szpic" ma się czytać z samej sylwetki, bez patrzenia na detal.
  draw("pierce", (g, o) => {
    const gr = grow(o);
    stroke(g, 3.5, 10.5, 9, 5, w(1.5, o), wood(o));
    g.fillStyle(metal(o), 1);
    g.beginPath();
    g.moveTo(11.5 + gr * 0.7, 2.5 - gr * 0.7); // czubek
    g.lineTo(7.8 - gr, 4.6);
    g.lineTo(9.4, 6.2 + gr);
    g.closePath();
    g.fillPath();
  });

  // MŁOT — najgrubszy trzonek i zwarta, prostokątna głowica. Masa zamiast
  // ostrza; blok czyta się przy tej wielkości lepiej niż jakikolwiek profil.
  draw("blunt", (g, o) => {
    const gr = grow(o);
    stroke(g, 3.5, 10.5, 9, 5, w(2.5, o), wood(o));
    g.fillStyle(metal(o), 1);
    g.fillRect(7.8 - gr, 2.4 - gr, 3.8 + gr * 2, 3.2 + gr * 2);
  });
}

/**
 * Abilities with real art instead of a procedural glyph — see ASSETS.iconCleave
 * / ASSETS.iconCharge for how each PNG was prepared (medallion/border stripped,
 * transparent everywhere else, sword/rider kept at native style). Adding a
 * third entry here is the whole integration; no new icon system needed.
 */
const REAL_ABILITY_ART: Partial<Record<AbilityId, { key: string }>> = {
  cleave: ASSETS.iconCleave,
  charge: ASSETS.iconCharge,
  lunge: ASSETS.iconLunge,
  shieldBash: ASSETS.iconShieldBash,
  rend: ASSETS.iconRend,
  heavyStrike: ASSETS.iconHeavyStrike,
  warcry: ASSETS.iconWarcry,
  // `dodge` and `whirlwind` stay OUT on purpose — see ASSETS.iconWarcry's
  // comment. Don't add them "for completeness"; that's the mistake this
  // comment exists to head off.
};

/**
 * One generated icon per ability. Each is a distinct glyph, not just a colour
 * swatch: on a phone the action bar is read at a glance and in a hurry, so the
 * buttons have to be told apart by SHAPE first and colour second.
 */
function makeAbilityIcons(scene: Phaser.Scene): void {
  const size = 32;
  // ⚠ Iterate by OBJECT KEY, not `def.id` — `abilityIconKey` (and
  // `Abilities.slotted()`/`AbilityBar`) always identify an ability by its key
  // in `ABILITIES` (the `AbilityId` type). `def.id` is a separate string field
  // that happens to match the key for most abilities, but NOT for
  // `heavyStrike` (`id: "heavy_strike"`) or `shieldBash` (`id: "shield_bash"`).
  // Building the texture key from `def.id` for those two silently generated a
  // texture nobody ever requested (`ability-icon-heavy_strike` /
  // `ability-icon-shield_bash`), while AbilityBar asked for
  // `ability-icon-heavyStrike` / `ability-icon-shieldBash` — found missing
  // 2026-09-06 when `shieldBash`'s real art refused to show up at all.
  for (const abilityKey of Object.keys(ABILITIES) as AbilityId[]) {
    const def = ABILITIES[abilityKey];
    const key = abilityIconKey(abilityKey);
    if (scene.textures.exists(key)) continue;
    // Real art copied in place of the procedural glyph below, for whichever
    // abilities have it (REAL_ABILITY_ART). Everything else keeps its glyph.
    const art = REAL_ABILITY_ART[abilityKey];
    if (art && isUsableTexture(scene, art.key)) {
      extractTile(scene, art.key, key, 0, 0, size, size);
      continue;
    }
    const g = scene.add.graphics();
    g.fillStyle(0x14161f, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.lineStyle(2, def.color, 1);
    g.fillStyle(def.color, 1);

    const c = size / 2;
    switch (def.id) {
      case "dodge": // motion: a chevron trailing two speed lines
        g.fillTriangle(c + 7, c, c - 3, c - 9, c - 3, c + 9);
        g.fillRect(c - 12, c - 5, 6, 2);
        g.fillRect(c - 12, c + 3, 6, 2);
        break;
      case "whirlwind": // rotation: a broken ring with a leading blade
        g.strokeCircle(c, c, 9);
        g.fillStyle(0x14161f, 1);
        g.fillRect(c + 4, c - 12, 10, 10); // notch, so it reads as spinning
        g.fillStyle(def.color, 1);
        g.fillTriangle(c + 4, c - 11, c + 12, c - 7, c + 4, c - 3);
        break;
      case "cleave": // szeroki łuk cięcia + ostrze na jego końcu
        // ⚠ Miało wcześniej wpaść w `default`, czyli dzieliło ikonę z Okrzykiem
        // bojowym: dwa różne przyciski na pasku wyglądały identycznie. Zauważone
        // przy dokładaniu piątej umiejętności, bo ona wpadłaby tam trzecia.
        g.beginPath();
        g.arc(c - 6, c, 11, -0.9, 0.9, false);
        g.strokePath();
        g.fillTriangle(c + 4, c - 9, c + 11, c - 4, c + 3, c - 1);
        break;
      case "heavy_strike": // ciężar: gruby grot w dół + linia uderzenia
        // ⚠ Własna ikona, nie `default` — komentarz przy `cleave` wyżej opisuje,
        // co się dzieje bez tego: dwa różne przyciski na pasku wyglądają
        // identycznie i nikt tego nie zgłasza, bo „przecież działa".
        g.fillTriangle(c, c + 10, c - 8, c - 4, c + 8, c - 4);
        g.fillRect(c - 2, c - 12, 4, 8);
        g.fillRect(c - 11, c + 12, 22, 2); // linia uderzenia w ziemię
        break;
      case "lunge": // pchnięcie: cienkie ostrze wyprowadzone w przód + ślad kroku
        // ⚠ Musi się różnić od `charge` NA PIERWSZY RZUT OKA, bo obie
        // umiejętności są „ruch do wroga" i wylądują na sąsiednich slotach.
        // Rozróżnia je GRUBOŚĆ: szarża to szeroki klin, wypad to szpic.
        g.fillTriangle(c + 12, c, c + 2, c - 4, c + 2, c + 4); // grot
        g.fillRect(c - 8, c - 1, 10, 2); // klinga
        g.fillRect(c - 11, c - 5, 3, 10); // jelec
        g.fillRect(c - 13, c + 8, 9, 2); // ślad wysuniętej stopy
        break;
      case "rend": // rana: ukośne cięcie + trzy krople spływające z niego
        // ⚠ Własna ikona, nie `default` — patrz komentarze przy `cleave`,
        // `heavy_strike` i `shield_bash`: bez tego byłaby CZWARTYM przyciskiem
        // wyglądającym jak Okrzyk bojowy, a nikt tego nie zgłasza, bo
        // „przecież działa".
        //
        // ⚠ Sylwetka musi się różnić od `cleave` NA PIERWSZY RZUT OKA — obie
        // są „cięciem". Rozróżnia je KIERUNEK i to, co zostaje: Szerokie
        // cięcie to poziomy ŁUK, Rozcięcie to ukośna KRESKA z kroplami.
        g.lineStyle(3, def.color, 1);
        g.beginPath();
        g.moveTo(c - 9, c - 10);
        g.lineTo(c + 8, c + 6);
        g.strokePath();
        // Krople — czytają się jako to, co po cięciu ZOSTAJE, czyli jako DoT.
        g.fillStyle(def.color, 1);
        g.fillCircle(c - 7, c + 3, 1.8);
        g.fillCircle(c - 1, c + 8, 2.2);
        g.fillCircle(c + 6, c + 12, 1.8);
        break;
      case "charge": // pęd: grot z trzema liniami prędkości za nim
        g.fillTriangle(c + 10, c, c - 1, c - 8, c - 1, c + 8);
        g.fillRect(c - 12, c - 6, 8, 2);
        g.fillRect(c - 13, c - 1, 10, 2);
        g.fillRect(c - 12, c + 4, 8, 2);
        break;
      case "shield_bash": // tarcza pchnięta do przodu + trzy linie uderzenia
        // ⚠ Własna ikona, nie `default` — patrz komentarze przy `cleave`
        // i `heavy_strike`: bez tego byłaby TRZECIM przyciskiem wyglądającym
        // jak Okrzyk bojowy, a nikt tego nie zgłasza, bo „przecież działa".
        //
        // ⚠ Sylwetka musi się różnić od `charge` i `lunge` NA PIERWSZY RZUT
        // OKA — wszystkie trzy są „ruchem w stronę wroga". Rozróżnia je
        // KSZTAŁT PRZODU: szarża i wypad mają szpic, ten ma płaską ścianę.
        g.beginPath();
        g.moveTo(c - 4, c - 10);
        g.lineTo(c + 4, c - 10);
        g.lineTo(c + 4, c + 6);
        g.lineTo(c, c + 11); // spiczasty dół tarczy typu heater
        g.lineTo(c - 4, c + 6);
        g.closePath();
        g.fillPath();
        // Linie uderzenia PRZED tarczą — kierunek czyta się w prawo, jak
        // w pozostałych ikonach ruchu.
        g.fillRect(c + 8, c - 6, 6, 2);
        g.fillRect(c + 8, c - 1, 8, 2);
        g.fillRect(c + 8, c + 4, 6, 2);
        break;
      default: // warcry — an outward burst
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          g.fillRect(c + Math.cos(a) * 6 - 1.5, c + Math.sin(a) * 6 - 1.5, 3, 3);
        }
        g.fillCircle(c, c, 3.5);
        break;
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

function makeCampfirePlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.campfire.size;
  const g = scene.add.graphics();
  // Stone ring at the base, two crossed logs, a flame on top. Drawn bottom-up
  // so the later shapes overlap the earlier ones correctly.
  g.fillStyle(0x6e6a63, 1);
  g.fillEllipse(w / 2, h * 0.82, w * 0.92, h * 0.3); // stone ring
  g.fillStyle(0x4c4843, 1);
  g.fillEllipse(w / 2, h * 0.8, w * 0.66, h * 0.18); // ash inside the ring
  g.fillStyle(0x6b4a2f, 1);
  g.fillTriangle(w * 0.2, h * 0.8, w * 0.5, h * 0.5, w * 0.32, h * 0.82); // log
  g.fillTriangle(w * 0.8, h * 0.8, w * 0.5, h * 0.5, w * 0.68, h * 0.82); // log
  g.fillStyle(0xe2622a, 1);
  g.fillTriangle(w * 0.32, h * 0.62, w * 0.68, h * 0.62, w / 2, h * 0.12); // outer flame
  g.fillStyle(0xf5a623, 1);
  g.fillTriangle(w * 0.4, h * 0.64, w * 0.6, h * 0.64, w / 2, h * 0.3); // inner flame
  g.fillStyle(0xffe9a8, 1);
  g.fillTriangle(w * 0.46, h * 0.66, w * 0.54, h * 0.66, w / 2, h * 0.46); // core
  g.generateTexture(ASSETS.campfire.key, w, h);
  g.destroy();
}

/** The merchant pouch badge — see ASSETS.merchantBadge. */
function makeMerchantBadgeTexture(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.merchantBadge.size;
  const g = scene.add.graphics();
  g.fillStyle(0x8a5a2e, 1);
  g.fillRoundedRect(w * 0.1, h * 0.32, w * 0.8, h * 0.62, w * 0.22); // sack body
  g.fillStyle(0xc9924a, 1);
  g.fillRect(w * 0.36, h * 0.12, w * 0.28, h * 0.26); // tied neck
  g.lineStyle(1, 0x3a2312, 1);
  g.strokeRoundedRect(w * 0.1, h * 0.32, w * 0.8, h * 0.62, w * 0.22);
  g.fillStyle(0xffe680, 1);
  g.fillCircle(w * 0.5, h * 0.64, w * 0.1); // coin glint
  g.generateTexture(ASSETS.merchantBadge.textureKey, w, h);
  g.destroy();
}

function makeNpcPlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.npc.portrait;
  const g = scene.add.graphics();
  g.fillStyle(0x8855cc, 1);
  g.fillRoundedRect(4, 20, w - 8, h - 30, 4); // torso
  g.fillStyle(0xffe0bd, 1);
  g.fillCircle(w / 2, 15, 7); // head
  g.generateTexture(ASSETS.npc.portraitKey, w, h);
  g.destroy();
}

/**
 * One icon texture per item: the real 32×32 tile cut from items.png for
 * anything with an `icon` pick (weapons/armor), a generated colour swatch for
 * everything else — and for those same weapons/armor too if items.png didn't
 * load, so a missing sheet never breaks the shop/backpack UI.
 */
function makeItemIcons(scene: Phaser.Scene, itemsSheetMissing: boolean): void {
  const size = 32;
  for (const def of Object.values(ITEMS)) {
    const key = itemIconKey(def.id);
    if (scene.textures.exists(key)) continue;
    // Trzeci wariant ikony: samodzielny PNG na jeden przedmiot (dziś tylko
    // chleb — `items.png` nie ma pieczywa). Sprawdzany PRZED `icon`, bo jest
    // bardziej szczegółowy, i degraduje się jak wszystko inne tutaj: jeśli
    // tekstura się nie wczytała, przedmiot dostaje zwykłą kolorową plamkę.
    if ("iconTexture" in def && isUsableTexture(scene, def.iconTexture)) {
      const src = scene.textures.get(def.iconTexture).getSourceImage() as HTMLImageElement;
      // ⚠⚠ IKONA NIE JEST JUŻ Z DEFINICJI KWADRATEM. Do 2026-09-19 każdy
      //   samodzielny PNG był przeskalowywany do 32×32 — bo wszystkie były
      //   kwadratowe i nikt tego nie zauważał. Tarcza migdałowa, legionowa
      //   i pawęż mają 32×64 (gabaryt `1×2`), więc wymuszony kwadrat ZGNIÓTŁBY
      //   je o połowę wysokości. Źródło o kroku 32 px przechodzi bez zmiany
      //   rozmiaru; cokolwiek innego dalej wpada w 32×32, żeby przypadkowy
      //   plik nie wjechał do UI w swoich wymiarach.
      const naturalne = src.width % size === 0 && src.height % size === 0;
      const dw = naturalne ? src.width : size;
      const dh = naturalne ? src.height : size;
      extractTile(scene, def.iconTexture, key, 0, 0, src.width, src.height, dw, dh);
    } else if ("icon" in def && !itemsSheetMissing) {
      const { col, row } = def.icon;
      extractTile(scene, ASSETS.items.key, key, col * ASSETS.items.tile, row * ASSETS.items.tile, size, size);
      // items.png draws exactly ONE ring, so every ring would otherwise be the
      // same grey band and unreadable at a glance in the bag. `tintIcon` says
      // "recolour the tile you just cut" — see the ring block in GameConfig.
      if ("tintIcon" in def && def.tintIcon) tintTexture(scene, key, def.color);
    } else {
      makeItemSwatch(scene, key, def.color, size);
    }
  }
}

/**
 * Multiply an already-extracted canvas texture by `color`, preserving alpha.
 *
 * Done on the pixels rather than with a Phaser tint because a tint lives on the
 * *sprite*, and these icons are drawn by four different widgets (bag, shop,
 * equipped row, tooltip, buff bar) — one of them would inevitably be missed.
 * Baking it into the texture means every consumer gets it for free.
 */
function tintTexture(scene: Phaser.Scene, key: string, color: number): void {
  // extractTile builds these with createCanvas, so the texture is a
  // CanvasTexture and carries its own 2D context (and refresh()).
  const tex = scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  const canvas = tex?.canvas;
  const ctx = tex?.context;
  if (!canvas || !ctx) return;
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // leave fully transparent pixels alone
    d[i] = Math.round(d[i] * r);
    d[i + 1] = Math.round(d[i + 1] * g);
    d[i + 2] = Math.round(d[i + 2] * b);
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}

function makeItemSwatch(scene: Phaser.Scene, key: string, color: number, size: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0x14161f, 1);
  g.fillRoundedRect(0, 0, size, size, 6);
  g.fillStyle(color, 1);
  g.fillRoundedRect(3, 3, size - 6, size - 6, 4);
  g.generateTexture(key, size, size);
  g.destroy();
}

function makeSwordPlaceholder(scene: Phaser.Scene): void {
  const { w, h } = ASSETS.character.sword;
  const g = scene.add.graphics();
  // Simple blade (guard at top, point at bottom) matching the real icon's pose.
  g.fillStyle(0x333333, 1);
  g.fillRect(0, 0, w, 4); // crossguard
  g.fillStyle(0xcfd8dc, 1);
  g.fillRect(w / 2 - 1.5, 4, 3, h - 8); // blade
  g.fillStyle(0x333333, 1);
  g.fillTriangle(w / 2 - 1.5, h - 4, w / 2 + 1.5, h - 4, w / 2, h); // tip
  g.generateTexture(ASSETS.character.swordKey, w, h);
  g.destroy();
}

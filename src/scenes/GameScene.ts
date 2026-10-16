import Phaser from "phaser";
import { App } from "@capacitor/app";
import { MapBuilder, type BuiltMap } from "../world/MapBuilder";
import { registerPropInstance, resetPropInstances } from "../world/PropInstances";
import { rysujBezKafli2D } from "../world/Buildings";
import { setYSortedWorld } from "../core/YSortedWorld";
import { RenderCuller, setRenderCuller } from "../core/RenderCuller";
import { OccluderIndex, setOccluders } from "../core/Occluders";
import { PlayerSilhouette } from "../core/PlayerSilhouette";
import { Character3D } from "../render3d/Character3D";
import { Creature3D } from "../render3d/Creature3D";
import { Player, type PlayerCondition } from "../entities/Player";
import { Buffs } from "../core/Buffs";
import { withinCircle, withinReach } from "../core/HitResolver";
import {
  resolveAbility,
  selectTargets,
  coversTarget,
  multiplierFor,
  type AimableAbilityId,
  type AimCandidate,
  aimVectorTo,
  originFor,
  type AimFrame,
  type SelectedTarget,
  type ResolvedAbilitySpec,
} from "../core/AbilitySpec";
import { AimPreview, type AimExtras } from "../ui/AimPreview";
import { Enemy, type EnemyConfig, type EnemyType } from "../entities/Enemy";
import { createEnemyOf, enemyConfigOf } from "../entities/EnemyRegistry";
import { physicalDamage } from "../core/combat/DamagePacket";
import {
  Projectile,
  type EnemyProjectileOptions,
  type ProjectileHost,
} from "../entities/Projectile";
import { Merchant } from "../entities/Merchant";
import { NPC_IDS, NPCS, type NpcId } from "../core/Npcs";
import type { Interactable } from "../core/Interactables";
import { NodeSpawner, type GatherHost } from "../world/NodeSpawner";
import { Gatherable, type HerbId } from "../entities/Gatherable";
import { HERBS, GATHER, MODELE_3D, AKTYWNOSC_STWORZEN, SWIAT, NPC_3D, KIRKA } from "../config/GameConfig";
import { composeWorld, przesuniecieWSwiecie, regionAt, regionsOf, voidsOf } from "../world/WorldComposer";
import { przesuniecieOdPustki, type Prost } from "../world/VoidFraming";
import { pixelRatio } from "../core/Viewport";
import { Campfire } from "../entities/Campfire";
import { Well } from "../entities/Well";
import { WaterWheel } from "../entities/WaterWheel";
import {
  FarmAnimal,
  FARM_ANIMAL_KINDS,
  resolveFarmAnimalKind,
  type FarmAnimalSpecies,
} from "../entities/FarmAnimal";
import { Bird } from "../entities/Bird";
import { Loot } from "../entities/Loot";
import { DEFAULT_QUALITY, makeInstance, setDurabilityFraction, type QualityLevel } from "../core/Quality";
import { InputState, Controls, CONTROL } from "../core/InputState";
import { GameEvents, EVENT } from "../core/EventBus";
import {
  MovementContext,
  setMovementContext,
  movementContextFor,
} from "../core/movement/MovementContext";
import {
  buildTiledMap,
  canBuildTiledMap,
  type EnemySpawn,
  type PortalSpawn,
  type WellSpawn,
} from "../world/TiledMap";
import { CAMERA, WORLD, COMBAT_FEEDBACK, RESPAWN, MAPS, MAP_BY_ID, PORTAL, DEPTH, LOOT, MERCHANT, CAMPFIRE, ASSETS, DECOR_PROPS, type DecorId, type DecorPropDef } from "../config/GameConfig";
import { Progression } from "../core/Progression";
import { Stamina } from "../core/Stamina";
import { cuesFor } from "../core/CombatCues";
// Warstwa 2 po stronie GRACZA — wzory zostają w `Proficiency`, stan w
// `WeaponProficiency`; ta scena tylko zamraża `P` i wykonuje rzut.
import { rollExecution, scaleDamage, type ExecutionRolled } from "../core/Proficiency";
import { WeaponProficiency } from "../core/WeaponProficiency";
import { playCues } from "../core/CombatFx";
import { effectsFor } from "../core/GameplayEffects";
import { applyImpulse } from "../core/CombatImpulse";
import { Abilities, getAbility, abilityIconKey, type AbilityId } from "../core/Abilities";
import { PLAYER_ACTIONS, type ActionOnHit, type PlayerAction } from "../core/combat/PlayerAction";
import { BLEED } from "../core/combat/EffectKinds";
import { Sfx, type SfxKey } from "../core/Sfx";
import { ABILITIES, ABILITY_AIM, PLAYER, STAMINA, WEAPON_SWAP } from "../config/GameConfig";
import { Inventory } from "../core/Inventory";
import { Skills, getSkill } from "../core/Skills";
import { Quests } from "../core/Quests";
import { Gathering } from "../core/Gathering";
import { getItem, type ItemId } from "../core/Items";
import { Equipment, describeSwapRefusal, type DamageType, type WeaponFamily } from "../core/Equipment";
import { floatingText, expandingRing } from "../core/Fx";
import { QuestSpots } from "./QuestSpots";
import { damageIconKey, targetMarkerKey } from "../core/Assets";
import { WorldView3D } from "../render3d/WorldView3D";
import { pikseliNaJednostke } from "../render3d/Shared3D";
// ⚠ `isFrontal` jako WARTOŚĆ, nie typ: bramka zwrotu autoataku
// (`canStrikeFacing`) dzieli predykat z Blokiem i Parowaniem, żeby przód i
// plecy znaczyły w ataku dokładnie to samo co w obronie.
import { isFrontal, type Effectiveness } from "../core/Protection";
import { gapBetween, type CombatBody } from "../core/CombatGeometry";
import { UI } from "../core/theme";
import { Exploration } from "../core/Exploration";
import { WorldState } from "../core/WorldState";
import { Session } from "../core/Session";
import { Save, type SlotId } from "../core/Save";

/**
 * Everything about HOW a strike lands, resolved once and then carried around.
 *
 * Exists so a swing can be frozen: `damageEnemiesInArc` and
 * `damageMatchingEnemies` used to read `Progression` at the moment of impact,
 * which was fine while a weapon had exactly one way of being used. With
 * variants, a live read there would let the player change a blow's damage type,
 * arc and reach after committing to it.
 *
 * Not a class and not a system — a plain snapshot passed down the same three
 * functions that already resolved every hit.
 */
/**
 * Kolor liczby obrażeń wg tego, jak jej typ radzi sobie z ochroną celu.
 *
 * ⚠ **„Grzęźnie" jest PRZYGASZONE, nie czerwone.** Czerwień na własnej liczbie
 * obrażeń czyta się jako błąd albo zagrożenie — `#ff6b6b` znaczy już w tej grze
 * „przedmiot zniszczony" — a przygaszenie czyta się jako „ten cios nigdzie nie
 * doszedł", czyli dokładnie to, co się stało.
 *
 * ⚠ Obie barwy pochodzą z `UI`; **żadnej nowej barwy w projekcie**. Neutralne
 * zostaje dokładnie tym, czym było (biel), więc dla sześciu z siedmiu stworów —
 * tych bez pancerza — liczba wygląda jak przed zmianą.
 *
 * Słaby punkt, świadomie przyjęty: biel ma maksymalną jasność, więc
 * „przechodzi" nie może być od niej jaśniejsze i wyróżnia się odcieniem, nie
 * luminancją. Dlatego glif `↑` nie jest ozdobą — jest jedynym nośnikiem tej
 * informacji odpornym na zaburzenia widzenia barw.
 */
const EFFECT_STYLE: Record<Effectiveness, { color: string }> = {
  przechodzi: { color: UI.green },
  neutralnie: { color: UI.white },
  grzeznie: { color: UI.muted },
};

interface StrikeProfile {
  damageType: DamageType;
  /** Hit-arc reach (px) for this strike. */
  reach: number;
  /** Dolna granica zasięgu — `0` = brak martwej strefy (`MeleeShape.minReach`).
   *  Zamrożona razem z resztą profilu, jak `reach`. */
  minReach: number;
  // ⚠⚠ **`arcDeg` usunięty z profilu 2026-09-18.** Nieśliśmy przez całą
  //   ścieżkę ciosu kąt, którego **nie czytał żaden konsument tego profilu** —
  //   Szerokie cięcie bierze go dziś wprost z `ABILITIES.cleave.halfArcDeg`.
  //   Dwa z trzech miejsc, które go tu wpisywały, miały w komentarzu wprost
  //   „bez konsumenta" i „łuk nie rozstrzyga niczego". ⛔ Nie przywracaj.
  knockback: number;
  interrupts: boolean;
  /** Oś rodziny obuchowej: ile ms trafienie zawiesza AI celu. 0 = brak.
   *  Zamrożone razem z resztą profilu, bo jak wszystko tutaj jest odczytywane
   *  w momencie TRAFIENIA, a nie naciśnięcia. */
  staggerMs: number;
  /**
   * **Biegłość gracza w rodzinie broni, którą wyprowadzany jest ten cios**
   * (warstwa 2 — `core/Proficiency.ts`, `docs/systemy/proficiency.md`).
   *
   * ⚠ **Zamrożona tutaj z DOKŁADNIE tego samego powodu co typ obrażeń i zasięg**:
   * odczyt `WeaponProficiency` w chwili trafienia pozwalałby przezbroić się
   * w oknie zamachu i rozstrzygnąć cios biegłością innej broni niż ta, którą
   * się zamachnięto.
   *
   * ⚠ **Broń bez rodziny (gołe ręce, kij) dostaje `PROFICIENCY.neutral`**, czyli
   * tożsamość — patrz `WeaponProficiency.get`.
   */
  proficiency: number;
  /**
   * **Rodzina broni, którą ten cios został wyprowadzony** — adres, pod który
   * idzie PRAKTYKA. `null` = gołe ręce albo broń bez rodziny.
   *
   * ⚠ Zamrożona razem z `proficiency`, żeby nauka trafiła do tej samej rodziny,
   * którą rozstrzygnięto cios. Bez tego przezbrojenie w oknie zamachu zapisałoby
   * punkt nie tej broni.
   *
   * ⚠ **`null` nie dostaje praktyki i to nie jest przeoczenie.** Osiosany kij
   * jako jedyna z jedenastu broni nie ma pola `family` — a §28 trzyma to jako
   * ŚWIADOMIE NIEROZSTRZYGNIĘTE („nie ma rodziny, w której miałby rosnąć").
   * Dopóki tamta decyzja nie zapadnie, jedyną uczciwą odpowiedzią jest brak
   * adresu, a nie wymyślony adres.
   */
  family: WeaponFamily | null;
  /**
   * **Która ręka wyprowadza ten cios.** Adres zużycia broni i jedyne miejsce,
   * po którym scena rozpoznaje off-handa (Dual Wield, prototyp 2026-09-05).
   */
  hand: "weapon" | "offhand";
  /* ── LICZBY RZUTU — zamrożone razem z resztą profilu ───────────────────
     ⚠⚠ **To jest NAPRAWA istniejącej niespójności, nie tylko dodatek dla DW.**
     Do 2026-09-05 profil zamrażał zasięg, typ, biegłość i rodzinę — z jawnym
     uzasadnieniem, że odczyt w chwili TRAFIENIA pozwalałby przezbroić się
     w oknie zamachu. Ale `Player.rollDamage` czytał `Progression` **na żywo**,
     czyli obrażenia jako jedyne NIE były zamrożone: dało się zamachnąć jedną
     bronią, a rozstrzygnąć rzutem drugiej.

     Dla Dual Wieldu jest to blokujące — cios off-handa musi losować z zakresu
     SWOJEJ broni — ale niespójność istniała wcześniej i naprawia się przy
     okazji, w tym samym miejscu, w którym mieszka reszta zamrożonego profilu. */
  damageMin: number;
  damageMax: number;
  critMultiplier: number;
  /** `φ` — podniesienie podłogi losowania przy krytyku. Rodziny bez cechy
   *  krytyka mają 0. */
  critLowCut: number;
  /**
   * **Szansa na krytyka TEJ ręki** (2026-09-05).
   *
   * ⚠⚠ Do tej daty `Player.rollDamage` czytał `Progression.critChance` na żywo,
   * a ten składa się z `PLAYER.critChance` + premii postaci + **premii broni
   * z ręki GŁÓWNEJ** (`Equipment.weaponMelee.critChanceBonus`). W Dual Wieldzie
   * cios off-handem losował więc krytyka szansą CUDZEJ broni.
   *
   * ⚠ Dawny strażnik §W3 twierdził, że „`critChance` to własność postaci, nie
   * ręki" — i to było **nieprawdą o kodzie, który pilnował**: dwa z trzech
   * składników należą do postaci, trzeci do konkretnej broni. Zmierzone:
   * `Sztylet + Miecz` dawał **+24,1%** dps zamiast +19,5%, a `Miecz + Sztylet`
   * **+11,7%** zamiast +16,0% — system nagradzał trzymanie broni o wysokim
   * krytyku w ręce głównej i karał za włożenie jej do drugiej. Niewidoczna
   * zachęta, której nikt nie zaprojektował.
   */
  critChance: number;
  /** Koszt staminy TEGO zamachu — wyprowadzony z czasu zamachu TEJ ręki. */
  staminaCost: number;
  /** Czas zamachu tej ręki (ms) — steruje pozą, ukorzenieniem i chwilą
   *  rozstrzygnięcia. */
  swingDurationMs: number;
  /**
   * **Kadencja TEJ ręki (ms)** — po tylu ms wolno wyprowadzić następny cios.
   *
   * ⚠⚠ **Model „per-ręka" (2026-09-05).** Do tej daty bramka po KAŻDYM ciosie
   * brała `Progression.attackCooldown`, czyli tempo ręki GŁÓWNEJ — więc
   * w Dual Wieldzie broń off-handa nie uczestniczyła w wyznaczaniu tempa
   * w ogóle. Rozważone modele: średnia obu (= suma cyklu), najwolniejsza
   * z pary, per-ręka. Wybrany per-ręka, bo **zachowuje tempo OBU broni**
   * zamiast mieszać je w jedną liczbę, ma tę samą przepustowość co średnia,
   * i jest dokładnie tym samym wzorcem, którym do profilu weszły już czas
   * zamachu, koszt staminy i liczby rzutu.
   *
   * ⚠ **Nadal JEDEN timer i jedna sekwencja** — to nie są niezależne timery
   * obu rąk. Zmienia się wyłącznie to, czyim cooldownem ustawia się okno.
   */
  cooldownMs: number;
}

/**
 * The playable outdoor map. Owns the world, the player, and the rabbits, and
 * runs the per-frame gameplay loop (movement, AI, combat resolution).
 */
/**
 * **Deklaracja nagród → kształt, którego oczekuje `pendingSwing`.** (P3.2,
 * rozszerzone na LISTĘ w P3.5)
 *
 * ⚠ **To jest TŁUMACZENIE między dwiema reprezentacjami, nie mechanika.**
 * Nagrody wykonuje `resolvePendingSwing` pod `anyHit` — dokładnie tam, gdzie
 * robił to przed migracją i bez jednej zmienionej linii. Tutaj zapada wyłącznie
 * decyzja „którym polem to pojedzie".
 *
 * ⚠ **Bierze CAŁĄ akcję, nie samo `onHit`, i to jest istota zmiany z P3.5.**
 * `refundCooldown` w deklaracji nie niesie adresu (patrz `ActionOnHit`), więc
 * `id` dokłada się TUTAJ, z `action.id`. Do P3.5 gałąź Wypadu wpisywała
 * `id: "lunge"` ręcznie — drugie źródło prawdy o tym, czyj to cooldown.
 *
 * ⚠ **Pusta lista zwraca `undefined`, a nie `{}`** — `pendingSwing.onHit`
 * zostaje wtedy dosłownie tym, czym był dla Ciężkiego uderzenia przed P3.5,
 * więc bramka `if (swing.onHit && anyHit)` widzi identyczny stan.
 *
 * ⚠ **Nowy wariant `ActionOnHit` NIE skompiluje się bez gałęzi tutaj**
 * (strażnik `never`), i to jest cała wartość unii: kompilator pyta, zamiast po
 * cichu nic nie zrobić.
 */
/**
 * Deklaracja Krwawienia zamrożona na czas lotu zamachu.
 *
 * ⚠ **Wyprowadzona z unii, nie przepisana** — dopisanie pola do wariantu
 * `bleed` w `PlayerAction.ts` przechodzi tu samo, a usunięcie zapala `tsc`.
 *
 * ⚠ **`iconKey` DOKŁADA TŁUMACZ, tak jak dokłada `refund.id`** (poprawka
 * z finalnego audytu, 2026-09-04). `PlayerAction.ts` jest czysty i nie zna
 * `core/Abilities`, więc klucza ikony nie może nieść — ale wykonawca ciosu
 * (`damageMatchingEnemies`) **nie ma prawa go zgadywać**. Pierwsza wersja
 * wpisywała tam `abilityIconKey("rend")` na sztywno, czyli **tożsamość
 * umiejętności w warstwie ogólnej** — dokładnie to, czego zakazuje reguła
 * „archetyp opisuje `kind`, nigdy `if (id === …)` we wspólnej warstwie"
 * (`src/core/CLAUDE.md`). Druga umiejętność z Krwawieniem dostałaby cudzą
 * ikonę i nikt by tego nie zauważył.
 */
type SwingBleed = Extract<ActionOnHit, { kind: "bleed" }> & { readonly iconKey: string };

function onHitDlaSwingu(action: PlayerAction): NonNullable<GameScene["pendingSwing"]>["onHit"] {
  if (action.onHit.length === 0) return undefined;
  const skutki: NonNullable<NonNullable<GameScene["pendingSwing"]>["onHit"]> = {};
  for (const efekt of action.onHit) {
    switch (efekt.kind) {
      case "control":
        skutki.control = { stunMs: efekt.stunMs };
        break;
      case "refundCooldown":
        // ⚠ Adres z `action.id`, nie z deklaracji efektu — patrz nagłówek.
        skutki.refund = { id: action.id, fraction: efekt.fraction };
        break;
      case "armAutoAttack":
        skutki.armAutoAttack = true;
        break;
      // ⚠ Bez ładunku — stawka i rzut są w `EQUIPMENT.durability`, wspólne
      //   z każdym innym zużyciem. Tłumacz przenosi samą DEKLARACJĘ.
      case "wearShield":
        skutki.wearShield = true;
        break;
      // ⚠ Liczby jadą dalej BEZ TŁUMACZENIA, bo obrażeń tiku nie da się tu
      // policzyć: zależą od rzutu, biegłości i jakości wykonania TEGO ciosu,
      // a te są znane dopiero w `damageMatchingEnemies`.
      // ⚠ **Ikonę dokłada TŁUMACZ, z `action.id`** — ta sama reguła i to samo
      // miejsce co przy `refund` wyżej. Patrz `SwingBleed`.
      case "bleed":
        skutki.bleed = { ...efekt, iconKey: abilityIconKey(action.id) };
        break;
      default: {
        const nieznany: never = efekt;
        throw new Error(`nieobsłużony skutek trafienia: ${JSON.stringify(nieznany)}`);
      }
    }
  }
  return skutki;
}

/**
 * **Polityka ukorzenienia akcji → parametr `triggerAttack`.** (P3.5)
 *
 * ⚠ **`undefined` NIE jest brakiem odpowiedzi — jest odpowiedzią.**
 * `Player.triggerAttack` czyta `opts.rootMs ?? Progression.rootDurationMs`, więc
 * pominięcie tej liczby ZNACZY „root z tempa broni" i dokładnie tak działa
 * pchnięcie Wypadu od 2026-08-25. Tłumaczenie stoi tu, a nie w deklaracji, bo
 * `Progression` jest stanem sceny, a `PlayerAction` musi zostać czysty.
 *
 * ⚠ Obie drogi honoruje ten sam wykonawca-agnostyk: `commitPlayerAction`
 * (naciśnięcie) i `landRushStrike` (dobiegnięcie) wołają tę funkcję, więc
 * różnica polityk jest DANĄ, a nie skutkiem tego, który wykonawca akurat składa
 * cios.
 */
function rootMsDlaAkcji(action: PlayerAction): number | undefined {
  switch (action.root.kind) {
    case "windupPlusRecovery":
      return action.windupMs + action.root.recoveryMs;
    case "weaponTempo":
      return undefined;
    default: {
      const nieznany: never = action.root;
      throw new Error(`nieobsłużona polityka ukorzenienia: ${JSON.stringify(nieznany)}`);
    }
  }
}
export class GameScene extends Phaser.Scene implements ProjectileHost, GatherHost {
  /**
   * Rendering architecture ETAP 1B (2026-08-31) — the only Phaser display
   * list whose `depthSort()` runs every frame. Holds the player, every
   * enemy/NPC/projectile, every tree trunk, and every decor prop
   * tagged `renderLayer: "ysorted"` in `DECOR_PROPS`. Everything else (tile
   * layers, canopies, background decor) stays in this scene's OWN default
   * display list, where nothing calls `setDepth()` after construction —
   * so ITS `depthSort()` becomes a no-op once this Layer exists. See
   * `core/YSortedWorld.ts` for why entities reach it via a WeakMap instead
   * of a constructor parameter.
   *
   * ⚠ Created fresh at the top of every `create()` (including portal
   * restarts) — same "Phaser reuses the Scene instance" reset pattern as
   * `this.enemies` below.
   */
  private ySortedWorld!: Phaser.GameObjects.Layer;
  /**
   * Render culling — toggles `.visible` on static, non-interactive world
   * content (canopies, trunks, `DECOR_PROPS`) based on camera bounds. Never
   * touches depth, list membership, `active`, collision, or AI — see
   * `core/RenderCuller.ts`. Created fresh every `create()`, same reset
   * pattern as `ySortedWorld`.
   */
  private renderCuller!: RenderCuller;
  /**
   * Rejestr tego, co rysuje się NAD graczem (korony drzew, warstwy `-over`).
   * Wyłącznie prezentacyjny — jedynym czytelnikiem jest `playerSilhouette`.
   * Tworzony na nowo w każdym `create()`, ten sam wzorzec resetu co `renderCuller`.
   */
  private occluders!: OccluderIndex;
  /** Obrys postaci zapalany, gdy świat ją zasłoni — `core/PlayerSilhouette.ts`. */
  private playerSilhouette!: PlayerSilhouette;
  /**
   * Model 3D gracza — `render3d/Character3D.ts`. **Docelowa postać gracza.**
   *
   * ⚠ `null` jest STANEM POPRAWNYM, nie awarią do naprawienia: gdy `char.glb`
   * się nie wczyta, gra zostaje przy arkuszu 2D i działa dalej. To ten sam
   * niezmiennik, co przy brakującym PNG czy dźwięku — gra ZAWSZE się uruchamia.
   */
  private character3d: Character3D | null = null;

  /** Dla `dev.char3d` — uchwyt na żywą instancję, bez drugiego module graph. */
  get model3d(): Character3D | null {
    return this.character3d;
  }
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  /**
   * The player's selected enemy, or null — set by tapping/clicking an enemy
   * (see spawnEnemy's `setInteractive` wiring), dropped by re-tapping it, and
   * handed on automatically when it dies mid-fight.
   *
   * There is exactly ONE piece of automatic selection, and it is narrow: when
   * the target dies while the autoattack is armed, `clearTargetIfInvalid`
   * passes the fight to the nearest enemy ALREADY CHASING the player (see
   * `nextAttackerTarget`). Killing one wolf of a pack therefore keeps you
   * fighting the other two without a tap. It cannot start a fight — a
   * patrolling creature is never eligible, however close it stands — and
   * there is still no nearest-target selection, no priority list, no
   * tab-targeting and no auto-follow.
   *
   * ⚠ **Zapis o „fallbacku do łuku" USUNIĘTY 2026-08-23 — był nieprawdziwy.**
   * Opisywał pierwszy krok ewolucji: bez celu zamach miał lecieć po łuku
   * `damageEnemiesInArc`. Ten fallback zniknął, gdy łuk bez celu przeniósł się
   * do umiejętności „Szerokie cięcie" (2026-08-16) — `resolveAttack` wychodzi
   * dziś na `if (!targeted) return;`. Komentarz przeżył kod o siedem dni.
   *
   * Stan faktyczny: **bez celu podstawowy atak nie robi nic** (komunikat „Brak
   * celu"), a od 2026-08-23 nie robi nic także wtedy, gdy cel stoi za plecami
   * — patrz `canStrikeFacing`.
   */
  private currentTarget: Enemy | null = null;
  /** Ring drawn over `currentTarget`, repositioned every frame in update().
   *  Created lazily on the first target so a game that's never used targeting
   *  never pays for it.
   *
   *  ⚠ `Image` na upieczonej teksturze, NIE `Arc` — patrz
   *  `COMBAT_FEEDBACK.targetMarker`. Obrys `Arc`-a tesselował się od nowa
   *  w każdej klatce, w której cel był zaznaczony. */
  private targetMarker?: Phaser.GameObjects.Image;
  /**
   * Ostatnio NAMALOWANY stan pierścienia celu — patrz `paintTargetMarker`.
   *
   * ⚠ `null` znaczy „jeszcze nic nie namalowano", więc pierwsza klatka z celem
   * zawsze maluje. **Musi być zerowane razem z `targetMarker`** (nowa mapa
   * tworzy pierścień od zera, bez tintu): inaczej pamięć stanu opisuje obrazek,
   * który już nie istnieje, i stan „za plecami" zostałby na czerwono.
   */
  private targetMarkerState: "ready" | "outOfReach" | "tooClose" | "behind" | null = null;
  /**
   * True from the moment Attack is PRESSED (rising edge) while a target is
   * selected, until the target is cleared — release does not turn this off,
   * per the corrected combat brief: Attack "starts" an autoattack against
   * `currentTarget` rather than gating every individual swing. While armed,
   * `update()` calls `resolveAttack()` every frame regardless of
   * `InputState.attackHeld`; `resolveAttack`'s own cooldown + range gate is
   * what actually paces the swings and silently pauses them out of range.
   * Reset in `clearTarget()`, so a fresh target always needs a fresh press —
   * armed is never carried over from a target that's gone. Deliberately NOT
   * reset on switching to a different live target (see setTarget) — chasing
   * whatever `currentTarget` currently is, mid-autoattack, is normal WoW-style
   * behaviour and needed no extra code since `resolveAttack` already reads
   * `currentTarget` fresh every call.
   */
  private autoAttackArmed = false;
  /**
   * Trwający LOT DO CELU (Szarża albo Wypad), albo `null`. Pole sceny, a nie
   * `delayedCall`, z tego samego powodu co `pendingSwing`: musi dać się
   * sprawdzić i unieważnić co klatkę (cel zginął, gracz zginął, portal
   * przebudował świat), a timer odpaliłby się na obiektach, których już nie ma.
   *
   * ⚠ **Nazwa jest ogólna, bo lot dzielą DWIE umiejętności.** Pole nazwane
   * `pendingCharge`, w którym siedzi Wypad, jest dokładnie tym rodzajem cichego
   * kłamstwa, przed jakim ostrzega `src/core/CLAUDE.md` — a różnica między nimi
   * nie leży w samym locie, tylko w tym, ZA CZYM leci i co dzieje się na końcu.
   *
   * ⚠ **UNIA, nie jedna struktura z polami opcjonalnymi.** Wcześniejsza wersja
   * miała `target: Enemy | null` obok `arrival: … | "none"`, czyli **dwa
   * zapisy jednego faktu** — a `"none"` nie było przy tym czytane przez żaden
   * kod. To jest dokładnie ten martwy slot, przed którym ostrzega
   * `src/core/CLAUDE.md`: pole deklarujące mechanikę, której nie ma. Unia
   * sprawia, że stany niemożliwe (pościg bez celu, skok z parametrami ciosu)
   * **nie dają się zapisać**, zamiast być pilnowane komentarzem.
   *
   * ⚠ Zerowane w `create()` obok `pendingSwing`/`currentTarget` — przejście
   * portalem w trakcie lotu zostawiłoby tu wskaźnik na przeciwnika
   * z poprzedniej mapy.
   */
  private pendingRush:
    | {
        /** Lot ZA KIMŚ: kurs przeliczany co klatkę z pozycji celu. */
        kind: "chase";
        target: Enemy;
        endsAt: number;
        speed: number;
        /**
         * Co dzieje się po dobiegnięciu.
         *
         * - `"armAutoAttack"` — Szarża: uzbraja zwykły autoatak, więc obrażenia
         *   przychodzą wyłącznie z broni i umiejętność sama nie zadaje nic.
         * - `"strike"` — Wypad w cel: **własne** pchnięcie z mnożnikiem, przez
         *   tę samą ścieżkę `pendingSwing`, co daje typ obrażeń z aktywnego
         *   wariantu, krytyki, pancerz, XP, łup i zużycie bez nowej linijki.
         */
        arrival: "armAutoAttack" | "strike";
        /**
         * Deklaracja ciosu, który wyląduje po dobiegnięciu. Wymagana i dozwolona
         * WYŁĄCZNIE przy `arrival: "strike"`.
         *
         * ⚠ **Od P3.5 jest to `PlayerAction`, a nie doraźny plan
         * `{windupMs, damageMul, onHit}`.** Lot niesie więc ADRES akcji, a nie
         * przepisane liczby — mnożnik czyta na dobiegnięciu resolver, a nagrody
         * stoją w rejestrze. Mechanizm lotu jest przy tym NIETKNIĘTY: to
         * podmiana ładunku, nie zmiana `pendingRush`.
         */
        action?: PlayerAction;
      }
    | {
        /**
         * Lot W KIERUNKU, bez celu — **drugie pełnoprawne użycie Wypadu:
         * przemieszczenie** (unik, ucieczka, repozycja).
         *
         * ⚠ To nie jest „nieudany lot". Nic nie trafia, więc nie ma tu ani
         * zwrotu cooldownu, ani utrzymanego natarcia — kosztuje **pełne
         * `cooldown`**, i to jest cała wycena obu użyć: mobilność jest droga,
         * celna wymiana tania. Patrz `ABILITIES.lunge.hitCooldownRefund`.
         * Brak pola `arrival` jest tu treścią, nie brakiem: nic nie ląduje.
         */
        kind: "dash";
        dirX: number;
        dirY: number;
        endsAt: number;
        speed: number;
      }
    | null = null;
  /**
   * Trwające celowanie umiejętności kierunkowej, albo `null`.
   *
   * ⚠ **Sesja nie jest zobowiązaniem.** Nie kosztuje staminy, nie uruchamia
   * cooldownu i nie rusza ciałem — dopóki nie przyjdzie commit, gracz nie
   * zapłacił za nic. To jest cała różnica wobec dzisiejszych umiejętności,
   * które rozstrzygają się na naciśnięciu.
   *
   * ⚠ Kierunek jest **analogowy (360°)** — tak samo jak zwrot postaci
   * (`Player.facingVector`, ciągły od 2026-09-27).
   */
  private aim: {
    id: AimableAbilityId;
    dirX: number;
    dirY: number;
    overCancel: boolean;
    /**
     * **Czy gracz przejął celowanie ręcznie** (palec minął `deadzonePx`).
     *
     * ⚠ **Dopóki `false`, sesja opisuje INTENCJĘ DOMYŚLNĄ: „zrób to mojemu
     * celowi".** To jest cała treść poprawki z 2026-09-11 i naprawia rozjazd,
     * którego `AbilitySpec` sam nie mógł złapać: podgląd rozstrzygał kierunkiem
     * (sektor akwizycji od zwrotu postaci), a tapnięcie rozstrzyga BLOKADĄ CELU
     * — więc podgląd potrafił zaznaczyć wroga B, a puszczenie palca uderzało
     * w A. Jedno źródło KSZTAŁTU nie wystarcza, gdy obie strony pytają o innego
     * kandydata.
     *
     * ⚠ **Nie trzeba tego zdarzenia zgłaszać osobno z `AbilityBar`**:
     * `abilityAimMoved` leci wyłącznie PO przekroczeniu deadzone (patrz
     * `AbilityBar.onAimMove`), więc pierwszy taki przelot **jest** momentem
     * przejęcia. Drugi kanał na tę samą informację byłby drugim zapisem jednego
     * faktu.
     */
    manual: boolean;
    /**
     * Cel, który obsłuży TAPNIĘCIE, albo `null`. Liczony raz, na starcie sesji.
     *
     * ⚠ **`null` nie znaczy „brak celu", tylko „tapnięcie nie skorzysta z celu"**
     * — bo cel jest martwy, nie ma go wcale albo umiejętność jest bramkowana
     * zwrotem, a cel stoi za plecami. Wtedy podgląd ma pokazać PUSTKĘ, czyli
     * dokładnie to, co powie za chwilę odmowa.
     */
    intent: Enemy | null;
    /**
     * Kogo podgląd wskazał w OSTATNIEJ narysowanej klatce.
     *
     * ⚠ **To jest jedyne źródło prawdy dla commitu**, nie druga selekcja.
     * Bez tego „UI podświetliło B, commit poszukał od nowa i wybrał A" jest
     * kwestią czasu — a to dokładnie ta klasa rozjazdu, przed którą broni
     * wspólny `AbilitySpec`.
     */
    selected: SelectedTarget<Enemy>[];
  } | null = null;
  private aimPreview: AimPreview | null = null;
  /**
   * **Która ręka wyprowadzi NASTĘPNY autoatak** (Dual Wield, prototyp
   * 2026-09-05). `"weapon"` przy jednej broni — pole jest wtedy martwe.
   *
   * ⚠ **Przełącza się przy ZATWIERDZENIU zamachu, nie przy trafieniu** —
   * inaczej chybiony cios off-handa powtarzałby off-handa w nieskończoność,
   * a pudło nie jest powodem, żeby ręka nie doszła do głosu.
   *
   * ⚠ **Zerowane w `nextStrike`, gdy druga ręka przestaje być bronią** —
   * bez nasłuchu na zdarzenie ekwipunku. Świadomie: stan, który sam się
   * naprawia przy odczycie, nie potrafi się rozjechać z ekwipunkiem, a nowy
   * słuchacz w scenie to nowa rzecz do wyrejestrowania przy restarcie mapy.
   */
  private nextHand: "weapon" | "offhand" = "weapon";
  /** Previous frame's `InputState.attackHeld`, purely to detect the rising
   *  edge above — this is the only reason it's stored at all. */
  private prevAttackHeld = false;
  /**
   * The swing that has been STARTED but has not landed yet, or null.
   *
   * A basic attack is one intention resolved at two moments (C-01 in
   * docs/systemy/combat.md): pressing decides the swing — cooldown, pose,
   * durability, animation, sound — and `PLAYER.swingHitFraction` of the
   * weapon's swing later the hit is resolved, once. Everything that follows
   * from connecting (damage, crit, knockback, interrupt, XP, loot, hit-stop,
   * and the swing FX's hit/miss colour) happens at that second moment only.
   *
   * Target and direction are LOCKED here at swing start: retargeting mid-swing
   * moves the next swing, never this one, so a swing can never be redirected
   * into someone the player never committed to. The target is held as its own
   * reference rather than re-read from `currentTarget` for exactly that reason.
   *
   * Resolved against `this.time.now` (the scene Clock), never a frame count —
   * the crit hit-stop pauses the PHYSICS world, and the Clock is independent
   * of it (see critHitStop), so a freeze cannot shift when a blow lands.
   *
   * Only ever one at a time: the shortest cooldown (450ms) is far longer than
   * the longest hit delay (~120ms), so a swing always resolves before the next
   * can start.
   */
  private pendingSwing: {
    resolveAt: number;
    /** The enemy this swing was committed to, or null for the arc swing. */
    target: Enemy | null;
    /** Facing captured at swing start — the arc is recomputed from it at the
     *  hit, so the swing may catch a different group than it started over. */
    dirX: number;
    dirY: number;
    /**
     * Size of the swing flourish. Only the RADIUS is carried — its position is
     * recomputed from where the player actually stands at the hit, not frozen
     * here: the lunge tween shifts them by up to ~6px during the swing, and on
     * a dagger the hit lands exactly at the lunge's full extension, so a
     * position captured at the press would draw the flourish where the blade
     * no longer is.
     */
    fxRadius: number;
    /**
     * The attack VARIANT this swing was thrown with, frozen here for exactly
     * the reason the target and direction are (C-01, extended by one field):
     * tapping "Pchnięcie" while a cut is already in the air must move the NEXT
     * swing, never the one that has left the hand.
     *
     * Carries the resolved numbers, not the variant object — arc, reach,
     * knockback and interrupt are all read at the moment of impact, so a live
     * `Progression` read there would let a mid-swing stance change reshape a
     * committed blow.
     */
    strike: StrikeProfile;
    /**
     * **Czy ten cios może spudłować WYKONANIEM** (Execution Miss, warstwa 2).
     *
     * ⚠ **Wymagane, nie opcjonalne — ta sama decyzja co przy
     * `Proficiency.executionFor` i `EnemyConfig.touchDamageType`.** Wartość
     * domyślna sprawiłaby, że „ten cios świadomie nie może spudłować" i „ktoś
     * nie dopisał pola" wyglądają w źródle identycznie, a `tsc` nie zapyta.
     *
     * ⚠ **To jest własność AKCJI, nie broni** — dokładnie jak po stronie wroga,
     * gdzie `allowFumble` należy do `AKCJE.boarCharge`, a nie do dzika. Dlatego
     * pole stoi TU, a nie w `StrikeProfile`: Ciężkie uderzenie i Wypad wołają
     * dosłownie `currentStrike()`, więc ich profil jest bit w bit profilem
     * autoataku i nie dałoby się ich po nim rozróżnić.
     *
     * Dziś: autoatak `true`, wszystkie umiejętności `false` (uzasadnienie per
     * umiejętność stoi przy każdym z czterech miejsc tworzenia).
     */
    allowFumble: boolean;
    /**
     * Mnożnik obrażeń tego zamachu. Brak = 1 (zwykły autoatak).
     *
     * ⚠ **Dzięki tej JEDNEJ liczbie Ciężkie uderzenie nie potrzebuje własnej
     * maszyny stanów.** Cały wymagany rytm — kierunek i cel zamrożone na
     * commit, obrażenia rozstrzygane później, cel może w międzyczasie wyjść
     * z zasięgu i wtedy nic nie dostaje — **`pendingSwing` opisuje od C-01**.
     * Brakowało wyłącznie tego, żeby cios mógł być mocniejszy.
     */
    damageMul?: number;
    /**
     * Co dzieje się, **JEŚLI ten zamach trafi**. Dziś jeden właściciel: Wypad.
     *
     * ⚠ **Musi jechać razem z zamachem, a nie zostać w gałęzi umiejętności**,
     * bo o wszystkim tutaj decyduje TRAFIENIE, a to rozstrzyga się dopiero
     * w `resolvePendingSwing`. Cokolwiek z tego naliczone przy naciśnięciu
     * nagradzałoby samo użycie i skasowało różnicę między celnym
     * wyprowadzeniem a machnięciem w powietrze — czyli dokładnie to
     * rozróżnienie, które trzyma Wypad po właściwej stronie barierki
     * z `docs/odlozone.md` §5.
     *
     * ⚠ **Jeden blok, nie dwa luźne pola.** Nazywa POJĘCIE („co daje
     * trafienie"), więc następna umiejętność z efektem on-hit ma oczywiste
     * miejsce, zamiast dokładać trzecią flagę obok dwóch niepowiązanych z wyglądu.
     */
    onHit?: {
      /** Skróć cooldown tej umiejętności o ułamek — patrz `hitCooldownRefund`. */
      refund?: { id: AimableAbilityId; fraction: number };
      /**
       * Utrzymaj natarcie: uzbrój autoatak na zaznaczonym celu.
       *
       * ⚠ **Bezpieczne mimo trwającego zamachu** — `autoAttackArmed` jest flagą
       * TRWAŁĄ, a `resolveAttack` wychodzi wcześniej, dopóki `pendingSwing`
       * leci (bramka §R6). Autoatak przejmuje więc dopiero PO tym ciosie,
       * zamiast go nadpisać.
       */
      armAutoAttack?: boolean;
      /**
       * **Trafienie zużywa tarczę** (`S10`). Ten sam powód, co przy `control`
       * obok: rozstrzyga TRAFIENIE, a ono jest znane dopiero tutaj. Bash
       * w powietrze nie niszczy niczego.
       */
      wearShield?: boolean;
      /**
       * **Kontrola nałożona na trafiony cel.** Dziś jeden właściciel: Uderzenie
       * tarczą.
       *
       * ⚠ **Musi jechać TUTAJ, a nie w gałęzi umiejętności**, z tego samego
       * powodu co `refund`: o wszystkim decyduje TRAFIENIE, a ono rozstrzyga
       * się dopiero w `resolvePendingSwing`. Ogłuszenie nałożone przy
       * naciśnięciu nagradzałoby samo użycie i skasowało różnicę między celnym
       * wyprowadzeniem a machnięciem w powietrze — a przy hard CC ta różnica
       * jest całą treścią umiejętności.
       *
       * ⚠ **Ogłuszenie to nie `staggerMs` w `StrikeProfile`.** Tamto jest osią
       * rodziny BRONI, dokładaną każdemu trafieniu obucha; to jest efekt
       * konkretnego użycia konkretnej umiejętności. Wpisanie ogłuszenia do
       * profilu ciosu rozdałoby je każdemu zamachowi młotem.
       */
      control?: { stunMs: number };
      /**
       * **Krwawienie nakładane na trafiony cel.** Dziś jeden właściciel:
       * Rozcięcie (2026-09-04).
       *
       * ⚠ **Wiezie DEKLARACJĘ (ułamek, czas, tik), nie gotowe obrażenia** —
       * i to jest jedyny powód, dla którego nie da się go wykonać obok
       * `control` w `resolvePendingSwing`. Obrażenia tiku są snapshotem 10%
       * obrażeń TEGO ciosu przed krytykiem, a rzut, biegłość i jakość
       * wykonania żyją wyłącznie w `damageMatchingEnemies`. Dlatego blok
       * przechodzi tam jako parametr, a nie jest tu wykonywany.
       *
       * ⚠ **Musi jechać z zamachem, nie zostać w gałęzi umiejętności** — ten
       * sam powód co przy `refund` i `control`: rana wisi na TRAFIENIU.
       */
      bleed?: SwingBleed;
    };
  } | null = null;
  private loot!: Phaser.Physics.Arcade.Group;
  /** Enemy shots in flight (the spider's webs). */
  private projectiles!: Phaser.Physics.Arcade.Group;
  /** Every talkable NPC on the map, Hunter included. */
  private npcs: Merchant[] = [];
  /** One or more — a map can author several cooking spots (see readSpawns'
   *  "campfire" objects); falls back to a single one near the merchant. */
  private campfires: Campfire[] = [];
  /** Where the player resurrects (see RESPAWN.atSpawnPoint). */
  private playerSpawn!: Phaser.Math.Vector2;
  /**
   * Everything on this map the player can press `E` on — NPCs, campfires, and
   * (soon) herb nodes, in ONE list.
   *
   * There used to be a separate list and a separate proximity loop per kind,
   * with nothing but hand-measured map distances stopping two from being in
   * range at once. See `core/Interactables.ts` for why that had to stop.
   */
  private interactables: Interactable[] = [];
  /**
   * The nearest in-range one, or null. Kept as the OBJECT, not a flag, for the
   * same reason the old `nearbyNpc`/`nearbyCampfire` fields were: the event has
   * to say *which* one, and `onCampfireCook` needs the actual fire to put its
   * FX on.
   */
  private nearby: Interactable | null = null;
  /** One per herb species this map authored stanowiska for. Empty on a map
   *  that authored none, which is most of them until somebody paints points. */
  private gatherers: NodeSpawner[] = [];
  /** Ambient farm-animal livestock — one per chicken/cow/pig/sheep object the
   *  map authored (see TiledMap.readSpawns / FARM_ANIMAL_KINDS). No HP, no
   *  interaction, no combat; just needs its own update() call each frame
   *  (see FarmAnimal.ts). */
  private farmAnimals: FarmAnimal[] = [];
  /** Cele `reach` w świecie i scenka Kirki (`scenes/QuestSpots.ts`). */
  private questSpots: QuestSpots | null = null;
  /** Map-to-map transition points authored on the current map (may be
   *  empty — most maps have none). */
  private portals: PortalSpawn[] = [];
  /** True from the moment a portal fires until the new map's `create()` runs.
   *  update() keeps ticking during the fade-out, so without this guard
   *  standing on a portal for those ~150ms would queue the transition twice. */
  private transitioning = false;

  /** Which short map id to build (a key into `MAP_BY_ID`) — carried across a
   *  `scene.restart()` by `init()` when walking through a portal. TitleScene's
   *  "Nowa gra"/"Kontynuuj" pass no scene data, so `init()`'s fallback IS the
   *  fresh-run start; see the note there before changing it back to "forest". */
  private mapId = "village";
  /** Where to place the player this time, overriding the map's own authored
   *  spawn — set only when arriving via a portal (see `onPortalReached`). */
  private pendingSpawn: Phaser.Math.Vector2 | null = null;
  /** HP to restore after the new Player is constructed. Without this, every
   *  `new Player()` seeds full HP from Progression (see Player's
   *  constructor) — fine for a fresh run, but it would make every portal a
   *  free full heal, exactly the "mechanical hole" the respawn cost was
   *  written to close (see RESPAWN.hpRatio's note in CLAUDE.md). A portal
   *  must relocate the player, not treat them. */
  private pendingHp: number | null = null;
  /** Stan postaci przeniesiony przez portal; `null` = nowa gra albo wczytanie
   *  zapisu, czyli czysty start. Patrz POLITYKA GRANICY w `create()`. */
  private pendingCondition: PlayerCondition | null = null;

  constructor() {
    super("Game");
  }

  init(data?: {
    mapId?: string;
    spawn?: { x: number; y: number };
    hp?: number;
    /** Podawane WYLACZNIE przez przejscie portalem — patrz POLITYKA GRANICY. */
    condition?: PlayerCondition;
  }): void {
    // A fresh run starts in the VILLAGE, and that is content, not convenience:
    // the first quest in the game (`QUESTS.stick_in_hand`) is given by the
    // Ojciec, who lives here, and the Hunter has nothing to offer until it is
    // finished (`rabbit_hunt` is gated behind it). Starting in the forest would
    // put the player next to a man with no work and no hint that the opening
    // beat is a map transition away. It also matches `docs/swiat.md` §5's
    // prologue, which begins at home and ends with you walking out.
    this.mapId = data?.mapId ?? "village";
    // A spawn is carried in scene data ONLY when arriving through a portal or
    // loading a save. Everything else — a fresh run, a "Kontynuuj" from a save
    // written before positions were persisted — falls through to the map's own
    // authored `player` point in `create()`.
    //
    // That `?? null` is the fix for a real trap, not a tidy-up. This used to
    // fall back to a hard-coded `(1392, 1776)`, which made `create()`'s
    // `pendingSpawn ?? map.playerSpawn` unreachable on EVERY path: the `player`
    // object was dead data on both maps, and moving it in Tiled changed
    // nothing, silently. In a project whose first rule is "the .tmj is the
    // map", a start position that lives in TypeScript is the wrong shape.
    //
    // The village's point now sits where that constant used to point — the
    // player's OWN yard, a few tiles below the door of "dom gracza", with the
    // Ojciec and Mama between him and it (~110px from each, just outside their
    // 48px interact range, so the "Rozmawiaj" prompt isn't up on frame one).
    // Deliberately not the plaza, where it used to stand: the opening beat is a
    // father stopping his son in their own yard, and it has to be on screen at
    // frame one rather than a walk away. That reasoning is unchanged — it just
    // lives in the map now, where it can be seen and moved.
    this.pendingSpawn = data?.spawn
      ? new Phaser.Math.Vector2(data.spawn.x, data.spawn.y)
      : null;
    this.pendingHp = data?.hp ?? null;
    this.pendingCondition = data?.condition ?? null;
    this.transitioning = false;
    // ⭐ Otwarty świat (`SWIAT`): wieś i las to obszary JEDNEJ mapy. Id mapy
    //   członkowskiej (z zapisu, portalu Gęstwiny, nowej gry) przechodzi w świat,
    //   a pozycja — o przesunięcie obszaru. Brak pliku świata = stare mapy.
    const wSwiecie = przesuniecieWSwiecie(this, this.mapId);
    if (wSwiecie) {
      this.mapId = SWIAT.id;
      if (this.pendingSpawn) this.pendingSpawn.add(new Phaser.Math.Vector2(wSwiecie.x, wSwiecie.y));
    }
  }

  /**
   * **Wyzeruj wszystko, co należy do POPRZEDNIEJ mapy.**
   *
   * ⚠ **Phaser REUŻYWA instancji sceny przy `scene.restart()`, a inicjalizatory
   * pól odpalają się tylko w KONSTRUKTORZE — czyli raz na całą sesję.** Każde
   * pole tej klasy, które trzyma referencję do obiektu ze świata albo stan
   * zależny od mapy, przeżywa więc bramę, wczytanie zapisu i powrót z menu.
   *
   * ⚠ **Ta metoda istnieje po to, żeby ta dyscyplina była WIDOCZNA**
   * (2026-09-08). Do tej daty piętnaście przypisań stało rozsypanych po ~250
   * liniach `create()`, każde z własnym komentarzem — trzy z nich zaczynały się
   * od „ta sama pułapka, drugi/trzeci raz". Rozsypane działały poprawnie, ale
   * nie dawały odpowiedzi na jedyne pytanie, które przy dodawaniu pola trzeba
   * zadać: **„czy moje nowe pole też tu należy?"**. Nowe pole z referencją do
   * encji, kontenera albo mapy dopisuje się TUTAJ.
   *
   * ⛔ **Kolejność jest nieistotna wewnątrz tej metody, ale jej POZYCJA już
   * nie** — musi być pierwszą rzeczą w `create()`. Sprawdzone przed
   * wyprowadzeniem: żadne z tych pól nie jest czytane ani zapisywane wcześniej
   * niż w miejscu, z którego przypisanie tu przyszło, a wszyscy piszący
   * (`spawnEnemy`, `addNpc`, `addInteractable`, pętle rekwizytów i fauny)
   * biegną później. Podniesienie ich wyżej jest więc bez różnicy dla wyniku.
   *
   * ⚠ **`nextHand` NIE JEST tu resetowane i to jest świadome pominięcie, nie
   * przeoczenie.** Ręka cyklu dwubroni przechodzi dziś przez bramę, a zmiana
   * tego przestawiłaby, którym ostrzem pada pierwszy cios na nowej mapie —
   * czyli byłaby zmianą zachowania, a nie porządkami. `nextStrike()` i tak
   * sprowadza je na rękę główną, gdy druga przestaje być bronią.
   */
  private resetPerMapState(): void {
    // Licznik przeciwników — `spawnEnemy()` liczy w górę od tej wartości.
    this.remainingEnemies = 0;

    // ── Blokada celu ──────────────────────────────────────────────────────
    // Wrogowie i pierścień celu giną razem ze sceną, ale te pola dalej na nie
    // wskazują. `targetMarker` niezerowany (choć zniszczony) sprawiłby, że
    // `setTarget()` pominąłby jego ponowne utworzenie. Jawny reset, nie
    // czekanie na `clearTargetIfInvalid()`.
    this.currentTarget = null;
    this.targetMarker = undefined;
    // Razem z obrazkiem — patrz `targetMarkerState`.
    this.targetMarkerState = null;

    // ── Wejście ataku ─────────────────────────────────────────────────────
    // Przejście bramą w trakcie autoataku dawało nową mapę z uzbrojonym
    // atakiem: pierwszy dotknięty tam wróg obrywał, choć gracz nigdy nie
    // nacisnął ⚔. Zerowane wprost, nie przez `clearTarget()` — to jest twardy
    // reset reużytej instancji, a nie zwykłe odznaczenie celu.
    this.autoAttackArmed = false;
    this.prevAttackHeld = false;

    // ── Rzeczy w locie, każda z referencją do świata, który już nie istnieje ─
    // Szarża/Wypad trzymają przeciwnika, więc brama w ich trakcie sterowałaby
    // graczem ku obiektowi z poprzedniej mapy.
    this.pendingRush = null;
    // Podgląd celowania rysuje `Graphics` ginący ze sceną, a sesja trzymałaby
    // kierunek sprzed bramy.
    this.aim = null;
    this.aimPreview = null;
    // Cios rozpoczęty przed bramą, a lądujący po niej, rozstrzygnąłby się na
    // NOWEJ mapie przeciw zniszczonemu celowi ze starej. Porzucany w całości —
    // ten cios należy do świata, z którego gracz wyszedł.
    this.pendingSwing = null;

    // ── Rejestry zawartości mapy ──────────────────────────────────────────
    // Nieskasowany wpis to interaktywny obiekt z mapy, którą gracz właśnie
    // opuścił, wciąż odpowiadający na testy bliskości na nowej.
    this.npcs = [];
    this.interactables = [];
    this.nearby = null;
    this.campfires = [];
    this.gatherers = [];
    this.farmAnimals = [];
    this.questSpots = null;
  }

  create(): void {
    // ⚠ PIERWSZA linia `create()` — patrz `resetPerMapState`.
    this.resetPerMapState();
    // Must exist before `buildWorld()` — tree trunks register themselves into
    // it via `ySortedWorldFor(scene)` while the map is being built (see
    // `world/TreeLayer.ts`). Every other Y-sorted entity below registers
    // itself the same way, from its own constructor, the moment it's created.
    this.ySortedWorld = this.add.layer();
    // ⚠ ARCHITECTURAL CONTRACT, not cosmetic — TWO SEPARATE depths are in play:
    //   1. The Layer's OWN depth (set here) places the whole Layer among the
    //      scene's TOP-LEVEL children (ground tiles, overlay tiles, canopies,
    //      background decor). It must clear `DEPTH.ground`/`DEPTH.overlay`
    //      and stay under `DEPTH.overhead` — that's the only job of this line.
    //   2. Each CHILD's own depth (`DEPTH.entities + y`, set individually by
    //      the player/enemies/trunks/etc.) sorts children AGAINST EACH OTHER
    //      *inside* the Layer and is untouched by this line.
    // Skipping (1) is a silent, whole-map bug, not a visual glitch: this Layer
    // is created before `buildWorld()` adds the ground `TilemapLayer`, and
    // both default to depth 0. Phaser's depth-sort is stable, so equal-depth
    // objects keep insertion order — the Layer (inserted first) would paint
    // BELOW the ground tiles (inserted after), hiding the player, every
    // enemy/NPC, every tree trunk, and all "ysorted" decor underneath
    // the grass. Any future top-level addition to this scene needs the same
    // check: does its depth clear `DEPTH.ground`/`DEPTH.overlay`?
    this.ySortedWorld.setDepth(DEPTH.entities);
    setYSortedWorld(this, this.ySortedWorld);

    // Render culling (ETAP: camera culling) — same "must exist before
    // buildWorld()" reasoning as the Layer above: tree trunks/canopies
    // register themselves via `renderCullerFor(scene)` while the map is
    // being built. See `core/RenderCuller.ts`.
    this.renderCuller = new RenderCuller();
    setRenderCuller(this, this.renderCuller);

    // Rejestr zasłon — **ta sama reguła „musi istnieć przed `buildWorld()`"**,
    // co dwa bloki wyżej: korony drzew i warstwy `-over` meldują się same przez
    // `occludersFor(scene)` w trakcie budowania mapy. Czyta go wyłącznie
    // `PlayerSilhouette`; zero wpływu na kolizję, nawigację i walkę.
    this.occluders = new OccluderIndex();
    setOccluders(this, this.occluders);

    const map = this.buildWorld();
    // Warstwa ruchu dostaje jedno wejście do przestrzeni tej sceny: sondę
    // terenu (działa zawsze) i siatkę prześwitu (tylko mapy z Tiled).
    // ⚠ Ustawiane PRZED spawnem czegokolwiek, żeby pierwsza klatka AI miała
    // już gotowy kontekst.
    setMovementContext(this, new MovementContext(this, map.nav));
    this.portals = map.portals ?? [];
    this.addPortalMarkers();

    // Snapshot for the PlayerPanel "Mapa" tab — fixed for this scene's
    // lifetime, unlike playerX/playerY below which move every frame.
    WorldState.mapId = this.mapId;
    WorldState.widthPx = map.widthPx;
    WorldState.heightPx = map.heightPx;
    WorldState.regions = this.mapId === SWIAT.id
      ? regionsOf(SWIAT.key).map((r) => ({ id: r.id, x: r.x, y: r.y, w: r.w, h: r.h }))
      : [];

    // World & camera bounds.
    this.physics.world.setBounds(0, 0, map.widthPx, map.heightPx);
    this.cameras.main.setBounds(0, 0, map.widthPx, map.heightPx);
    // ⭐ Otwarty świat: pola bez mapy (pustka) nie mogą wejść w kadr —
    //   `trzymajKadrPozaPustka`, `world/VoidFraming.ts`.
    this.pustkiSwiata = this.mapId === SWIAT.id ? [...voidsOf(SWIAT.key)] : [];
    // Zoom liczony z okna, nie stała 2 — patrz `applyZoom`. Przeliczany też
    // przy zmianie rozmiaru, bo w trybie RESIZE obrót telefonu zmienia krótszą
    // oś, a wraz z nią właściwe przybliżenie.
    this.applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
    });
    this.cameras.main.fadeIn(PORTAL.fadeMs); // matches the fadeOut a portal starts with

    // Progression/Inventory/Equipment/Quests are already in the right starting
    // state by the time GameScene ever runs — TitleScene decided (load the
    // autosave, or wipe it for a new game) before starting this scene. This
    // also means re-entering create() for any other reason (portals restart
    // this same scene) never resets progression.

    // Player. A portal overrides the map's own spawn — arriving through a
    // gate has to land at THAT gate, not wherever the map would otherwise
    // put a fresh arrival.
    this.playerSpawn = this.pendingSpawn ?? new Phaser.Math.Vector2(map.playerSpawn.x, map.playerSpawn.y);
    // ⚠ Pozycja z zapisu albo z bramy to surowe współrzędne — po zmianie mapy
    //   (rozstaw lasu ×1,5, 2026-10-04) potrafią trafić w pień albo w wodę.
    //   Zsuwamy gracza na najbliższe miejsce, w którym jego ciało się mieści.
    if (this.pendingSpawn) {
      const wolne = map.nav?.nearestPassable(this.playerSpawn.x, this.playerSpawn.y, PLAYER.bodyWidth, 480);
      if (wolne) this.playerSpawn.set(wolne.x, wolne.y);
    }
    this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
    // Obrys „jestem tutaj" na wypadek wejścia pod koronę/dach. Powstaje PO
    // graczu, bo kopiuje jego klatkę; startuje niewidoczny i sam się gasi.
    this.playerSilhouette = new PlayerSilhouette(this);

    // Postać 3D. ⚠ Wczytuje się ASYNCHRONICZNIE, więc gracz przez pierwsze
    // klatki jest arkuszem 2D i dopiero potem przejmuje go model — świadomie,
    // bo alternatywą jest wstrzymywanie sceny na pobranie 6 pliku.
    // Sprite 2D gaśnie DOPIERO w `gdyGotowy`, nigdy „na zapas".
    this.character3d = new Character3D(
      this,
      this.player,
      (obraz) => {
        this.player.setVisualOverride(true);
        // Obrys „jestem tutaj" musi odtąd kopiować MODEL, nie sprite — sprite
        // jest już niewidoczny, a bez tego cała funkcja gaśnie po cichu.
        this.playerSilhouette.setSource(obraz);
      },
      () => {
        this.character3d = null;
        console.warn("[char3d] zostaję przy arkuszu 2D — model niedostępny");
      },
    );
    if (this.pendingHp !== null) {
      // Clamped for safety only — max HP doesn't change mid-session, so this
      // is normally a no-op restore of exactly what the player had.
      this.player.hp = Phaser.Math.Clamp(this.pendingHp, 0, this.player.maxHp);
    }
    // Seed the position snapshot NOW, not on the first update().
    //
    // `mapId` above is already the new map, while `playerX`/`playerY` would
    // still describe where the player stood on the OLD one until the first
    // frame ran — and the autosave at the end of create() reads both. Closing
    // the tab in that window would have written "Zagaje" with forest
    // coordinates, i.e. a save that puts you somewhere you have never been.
    WorldState.playerX = this.player.x;
    WorldState.playerY = this.player.y;

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.physics.add.collider(this.player, map.solids);

    // Enemies. The map may carry its own spawn points (Tiled object layer);
    // otherwise fall back to a few spots scattered around the player.
    this.enemies = this.physics.add.group();

    // ── POLITYKA GRANICY: co przechodzi przez bramę ───────────────────────
    //
    // **Przejście portalem jest CIĄGŁE dla postaci. Przebudowywany jest tylko
    // świat.** Kilka kroków przez bramę nie może leczyć, nie może kasować
    // cooldownów i nie może zdejmować jadu — tak samo jak nie zdejmuje ekwipunku.
    //
    // Sygnałem jest obecność `condition`: niesie ją WYŁĄCZNIE przejście
    // portalem. Wczytanie zapisu i nowa gra go nie mają, więc dostają czysty
    // start. Rozpoznawanie po tym, a nie po fladze, jest samoopisujące się —
    // scena dostaje stan do przeniesienia albo go nie dostaje.
    //
    // ⚠ **Poprzednia wersja bezwarunkowo wołała tu `Abilities.reset()` z
    // uzasadnieniem, że „cooldowny są związane z czasem sceny, który restartuje
    // się razem ze sceną". To nieprawda** — sprawdzone w źródle Phasera:
    // `Clock.boot` synchronizuje `now` z globalnym `game.loop.time`, a `start`
    // rusza tylko `startTime`. Czas jest monotoniczny, więc znaczniki pozostają
    // ważne, a reset był **darmowym zerowaniem wszystkich cooldownów za
    // przejście przez bramę** (Okrzyk bojowy ma 24 s). Dokładnie ta dziura,
    // którą dla HP zatkano `pendingHp` — tam ktoś ją zauważył, tu nie, bo obok
    // stało wiarygodnie brzmiące, fałszywe zdanie.
    if (this.pendingCondition) {
      // Ciągłość: jad tyka dalej, posiłek leczy dalej, cooldowny biegną dalej.
      this.player.restoreCondition(this.pendingCondition);
    } else {
      // Nowa gra albo wczytanie zapisu — czysty start dla postaci.
      // ⚠ `Buffs` jest modułowe i przeżywa restart sceny (czyszczone dopiero na
      // SHUTDOWN UIScene, której portal nie rusza), więc bez tego wczytanie
      // zapisu zostawiałoby ikony bufów po POPRZEDNIEJ postaci.
      Buffs.clear();
      Abilities.reset();
    }
    // An empty enemy list means one of two opposite things, and until now they
    // were indistinguishable: "this map deliberately has none" or "this map's
    // object layer didn't survive the export" — the second being the silent
    // failure the fallback below was written to catch (a map that loads and
    // renders while being completely empty of content).
    //
    // `hasObjectLayer` settles it. A map that authored objects at all clearly
    // exported its layer, so zero enemies is a decision and must be honoured.
    // Without this the safety net fired on Zagaje and scattered three rabbits
    // around the village's own player point — which, once that point was moved
    // to the plaza, put wild animals outside the Sołtys's door.
    const spawns = map.enemySpawns?.length
      ? map.enemySpawns
      : map.hasObjectLayer
        ? []
        : this.defaultEnemySpawns(map);
    for (const s of spawns) {
      // `respawnDelay: 0` already keeps the Szary gone for the rest of the
      // session, but a page reload used to put the map's one-off boss back on
      // the board — so the kill is now a persisted fact and it gates the spawn.
      // Deliberately keyed to the lifetime tally, not to the revenge quest:
      // beating him without ever taking the quest still has to count.
      if (s.kind === "greywolf" && Quests.killCount("greywolf") > 0) continue;
      this.spawnEnemy(s);
    }

    // Collisions: rabbits collide with terrain and with each other.
    this.physics.add.collider(this.enemies, map.solids);
    this.physics.add.collider(this.enemies, this.enemies);

    // Merchant/Blacksmith: EACH NPC LIVES ON EXACTLY ONE MAP, WHEREVER
    // AUTHORED — no more silent "spawn everywhere with a fallback position".
    // The old fallback (park the Blacksmith beside the Hunter when a map
    // didn't author him) is exactly what put a smoky, hammering forge next
    // to the Hunter's hunting ground on the forest map — reported directly:
    // a working forge there would scare off every animal he's meant to
    // hunt. The Kowal's real home is the village (`docs/swiat.md`); the
    // forest map now authors ONLY "merchant", the village authors ONLY
    // "blacksmith", and each NPC simply doesn't exist on the other map.
    // `merchantSpot` still gets a procedural fallback when unauthored (used
    // below as the campfire's placement anchor even on a map with no
    // Hunter), but that fallback no longer spawns a sprite by itself.
    // Every talkable NPC the map authored, in registry order so the roster is
    // deterministic across restarts. Authored-only, with no procedural
    // placement for anyone: a villager only makes sense where a map actually
    // put one. `pickMerchantSpot` survives purely as the campfire's anchor on
    // a map with no Hunter — it no longer spawns anybody by itself.
    const authored = map.npcSpawns ?? {};
    const merchantSpot = authored.hunter ?? this.pickMerchantSpot(map, spawns);
    for (const id of NPC_IDS) {
      const at = authored[id];
      if (at) this.addNpc(at, id);
    }
    // Snapshot for the "Mapa" tab's dot-per-NPC (see WorldState.npcs) — fixed
    // for this scene's lifetime, same reasoning as widthPx/heightPx above.
    WorldState.npcs = this.npcs.map((n) => ({ id: n.npcId, name: n.npc.name, x: n.x, y: n.y }));

    // ⚠ Tu, PRZED studnią/kołem/ogniskiem — one też rejestrują się jako
    //   rekwizyty widoku 3D (scena jest reużywana przy przejściu bramą).
    resetPropInstances(this);

    // Village well: a static landmark, authored-only (no procedural
    // fallback — a well only makes sense at an authored plaza). Missing
    // texture just means the map degrades quietly, same story as ASSETS.kowal.
    for (const w of map.wellSpawns ?? []) {
      const art = w.variant === "small" ? ASSETS.wellSmall : ASSETS.well;
      // Missing texture just means that one well doesn't appear — same quiet
      // degradation as ASSETS.kowal, not a crash.
      if (!this.textures.exists(art.key)) continue;
      const well = new Well(this, w.pos.x, w.pos.y, art.key);
      // Widok 3D: model `studnia` w podstawie cembrowiny (`Trees3D`).
      registerPropInstance(this, { name: "studnia", x: well.x, y: well.y + well.displayHeight * 0.42, image: well });
      this.physics.add.collider(this.player, well);
      this.physics.add.collider(this.enemies, well);
    }

    // The mill's water wheel: authored-only, exactly like the well and for a
    // sharper version of the same reason. There is no sensible procedural spot
    // for it — a wheel belongs in a millrace beside a specific building, and
    // guessing would repeat the campfire-in-an-empty-meadow mistake that the
    // `hasObjectLayer` rule exists to prevent.
    //
    // Zagaje authors exactly one, at (128, 2608) — the mill on the south-west
    // flank. ⚠ Its placement is constrained by DEPTH, not by taste: the roof
    // sits on `buildings-over` = DEPTH.overhead (20000), above every entity, so
    // a wheel tucked under a roof tile is invisible. That is why the mill is
    // the one village building with a RECTANGULAR ridge roof — a gable roof's
    // arms reach down to the wall's bottom row in the outer columns, leaving no
    // wall to mount a 4-tile wheel on.
    for (const pos of map.waterwheelSpawns ?? []) {
      if (!this.textures.exists(ASSETS.waterwheel.key)) continue;
      const kolo = new WaterWheel(this, pos.x, pos.y);
      // Widok 3D (2026-10-14): punkt z Tiled = miejsce, w którym OŚ wchodzi
      // w zachodnią ścianę młyna. Koło stoi na zachód od niego, w nurcie (oś
      // wzdłuż X — `tools/props3d.py` „KOŁO STOI PIONOWO”), a w tym samym
      // punkcie nieruchoma `mlynowka`: komora, kozioł, rynna, jaz, woda.
      // Do tej daty kotwica była zsunięta na południe, bo koło stało licem do
      // kamery i połową wchodziło w ścianę.
      registerPropInstance(this, { name: "kolo_mlynskie", x: pos.x, y: pos.y, image: kolo });
      registerPropInstance(this, { name: "mlynowka", x: pos.x, y: pos.y, image: kolo });
    }

    // Campfire(s): the map may author its own "campfire" spawn points (any
    // number — see TiledMap.readSpawns), letting a map scatter several
    // cooking spots.
    //
    // The fallback follows EXACTLY the same rule as the enemy list above, and
    // for the same reason: an empty `campfireSpawns` means either "this map
    // deliberately has none" or "this map has no object layer at all", and the
    // procedural placement is written only for the second.
    //
    // Without that distinction the net fired on Zagaje — which authors no
    // campfire — and `pickCampfireSpot` anchored itself on `pickMerchantSpot`,
    // whose "north bank of the river, across the bridge" heuristic describes
    // the FOREST's geography. The result was a lit cooking fire at tile
    // (68, 15) of the village: an empty meadow 1370px from the player's own
    // yard, reachable only by walking off the road into nothing. A cooking
    // spot has to be somewhere a person would build one, and a procedural
    // search knows only about map proportions — the same argument that
    // stopped NPCs being placed procedurally on a map with buildings.
    //
    // Zagaje therefore has NO campfire until one is authored, and that is the
    // right answer today: the fire belongs to the Hunter's foreground outside
    // the palisade (`docs/wioska_plan.md` §4.3/§5.11), and neither the
    // palisade nor the Hunter is there yet. Standing in a substitute is the
    // mistake rule O6 exists to prevent.
    const fireSpots = map.campfireSpawns?.length
      ? map.campfireSpawns
      : map.hasObjectLayer
        ? []
        : [this.pickCampfireSpot(map, merchantSpot)];
    for (const spot of fireSpots) {
      const fire = new Campfire(this, spot.x, spot.y);
      // Widok 3D: krąg kamieni z polanami + osobny, migoczący płomień.
      const podstawa = fire.y + fire.displayHeight * 0.4;
      registerPropInstance(this, { name: "ognisko", x: fire.x, y: podstawa, image: fire });
      registerPropInstance(this, { name: "ogien", x: fire.x, y: podstawa, image: fire });
      this.physics.add.collider(this.player, fire);
      this.campfires.push(fire);
      this.addInteractable(fire);
    }

    // Herb stanowiska. One spawner per species the map actually authored
    // points for — a species with none simply doesn't grow here, which is
    // content rather than an omission (pokrzywa belongs to yards and forest
    // edges, dziurawiec to sunny glades). See NodeSpawner for why regrowth is
    // one timer per species rather than one per point, and why maps nobody is
    // standing on are never simulated.
    for (const [herb, nodes] of Object.entries(map.herbNodes ?? {})) {
      if (!nodes?.length) continue;
      const spawner = new NodeSpawner(this, this, this.mapId, herb as HerbId, nodes);
      spawner.start();
      this.gatherers.push(spawner);
    }

    // Every static decoration prop, in ONE loop — drying rack, haycock,
    // scarecrow, stump, mushrooms, pond edge, lily pad, bushes, water/shore
    // plants, decorative stones. Each used to be its own near-identical block
    // here; see `DECOR_PROPS` in GameConfig for the single table that now
    // drives both this and the map reader.
    // Origin (0.5, 1) so the point authored in Tiled is where the prop
    // meets the ground, not its top-left corner.
    for (const [id, def] of Object.entries(DECOR_PROPS) as [DecorId, DecorPropDef][]) {
      if (!this.textures.exists(def.asset.key)) continue;
      for (const spot of map.decorSpawns?.[id] ?? []) {
        // `def.asset.frame` is `undefined` for the (shrinking) set of decor
        // still on its own standalone texture — Phaser's `add.image` treats
        // that exactly like omitting the argument (default/only frame), so
        // this one call covers both atlas-backed and standalone decor with
        // zero branching. Atlasing (2026-08-31) changed ONLY this 4th
        // argument — origin/depth/renderLayer below are unchanged.
        const image = this.add
          .image(spot.x, spot.y, def.asset.key, def.asset.frame)
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.entities + spot.y);
        // `"ysorted"` props need to compare depth against the moving player
        // every frame (see `DECOR_PROPS.renderLayer` in GameConfig); anything
        // else stays in this scene's own default list, exactly as before.
        if (def.renderLayer === "ysorted") this.ySortedWorld.add(image);
        // Widok 3D stawia w tym miejscu model (`Trees3D`); logika tego nie czyta.
        registerPropInstance(this, { name: def.names[0], x: spot.x, y: spot.y, image });
        // Render culling applies to BOTH layers equally — visibility is
        // orthogonal to which display list an object lives in.
        this.renderCuller.register(image);
      }
    }

    // Forest birds ("bird"/"ptak" objects) — spawn and forget: a `Bird`
    // self-schedules its own hops via scene-owned timers/tweens, so unlike
    // farmAnimals there's no per-frame update() to call and no array to
    // keep (Phaser tears its tweens/timers down with the scene on restart).
    if (this.textures.exists(ASSETS.birds.key)) {
      for (const spot of map.birdSpawns ?? []) new Bird(this, spot.x, spot.y);
    }

    // Ambient farm-animal livestock (chicken/cow/pig/sheep/cat objects),
    // gated PER INSTANCE on its walk animation actually existing rather
    // than on a texture-existence check: createFarmAnimalAnimations only
    // builds it once that texture was sliced (Assets.ts's isUsableTexture
    // gate), so a missing sheet just means that instance doesn't spawn —
    // same "missing file just means nothing spawns" story as the water
    // wheel. Resolved per instance rather than once per species because a
    // cat's "kind" is a random colour pick each time (see
    // `resolveFarmAnimalKind`) — hoisting it out of the inner loop would
    // give every cat from one spawn list the SAME colour.
    for (const species of Object.keys(FARM_ANIMAL_KINDS) as FarmAnimalSpecies[]) {
      const spots = map.farmAnimalSpawns?.[species];
      if (!spots?.length) continue;
      for (const spot of spots) this.spawnFarmAnimal(species, spot.x, spot.y);
    }

    // ⭐ Zwierzęta z imieniem i cele `reach` (2026-10-12, Kirka — `OI-174`).
    //   Kirka stoi w puli zwierząt jak każdy pies; o tym, czy ją WIDAĆ i kiedy
    //   przybiega, decyduje `QuestSpots`.
    const kirkaSpawn = map.namedAnimals?.[KIRKA.objectName];
    const kirkaPies = kirkaSpawn ? this.spawnFarmAnimal(kirkaSpawn.species, kirkaSpawn.pos.x, kirkaSpawn.pos.y) : null;
    this.questSpots = new QuestSpots(
      this,
      this.player,
      map.questSpots ?? {},
      kirkaPies && kirkaSpawn ? { pies: kirkaPies, dom: kirkaSpawn.pos } : null,
      (text) => this.sayAtPlayer(text),
    );


    // Contact damage: rabbit overlapping the player.
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => {
      (e as unknown as Enemy).tryTouchDamage(this.player, this.time.now);
    });

    // Enemy projectiles (spider webs). The scene owns the group and both
    // collisions so a projectile never has to know about the map or the player
    // — see the ProjectileHost note on fireEnemyProjectile().
    this.projectiles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.projectiles, (_p, shot) => {
      (shot as unknown as Projectile).hitPlayer(this.player);
    });
    this.physics.add.collider(this.projectiles, map.solids, (shot) => {
      (shot as unknown as Projectile).splat();
    });

    // Loot: ground drops from kills, auto-collected on overlap.
    this.loot = this.physics.add.group();
    this.physics.add.overlap(this.player, this.loot, (_p, l) => {
      this.collectLoot(l as unknown as Loot);
    });

    // Ambient bed for THIS map (see MAPS.*.ambientKey — the village used to
    // play the forest's wind and birds, so walking through the gate changed
    // nothing in the ears). Started here rather than in BootScene because it
    // belongs to being *in the world* — the title screen stays silent — and
    // stopped on shutdown so it doesn't play on underneath the title after a
    // restart. A portal crossing is a scene restart, so the swap is free.
    this.obszarId = null;
    this.sledzObszar(true);
    if (!WorldState.region) Sfx.startAmbient((MAP_BY_ID[this.mapId] ?? MAPS.forest).ambientKey as SfxKey);

    // Resurrection request from the death overlay.
    Controls.on(CONTROL.respawn, this.onRespawnRequested, this);

    GameEvents.on(EVENT.leveledUp, this.onLeveledUp, this);
    // Spending a point into Endurance raises max HP; hand the player the new
    // headroom. Fired from the (paused-scene) character panel, which is fine —
    // event handlers still run while a scene is paused.
    GameEvents.on(EVENT.maxHpGranted, this.onMaxHpGranted, this);
    // A potion (or similar) was used from the backpack.
    GameEvents.on(EVENT.healRequested, this.onHealRequested, this);
    GameEvents.on(EVENT.abilityRequested, this.onAbilityRequested, this);
    GameEvents.on(EVENT.weaponSwapRequested, this.onWeaponSwapRequested, this);
    // Celowanie kierunkowe (prototyp `Szerokiego cięcia`). Cztery zdarzenia,
    // jeden cykl życia pointera po stronie `AbilityBar`; stan sesji i podgląd
    // należą TUTAJ, bo obie rzeczy żyją w przestrzeni świata.
    GameEvents.on(EVENT.abilityAimStarted, this.onAbilityAimStarted, this);
    GameEvents.on(EVENT.abilityAimMoved, this.onAbilityAimMoved, this);
    GameEvents.on(EVENT.abilityAimCommitted, this.onAbilityAimCommitted, this);
    GameEvents.on(EVENT.abilityAimPointed, this.onAbilityAimPointed, this);
    GameEvents.on(EVENT.abilityAimCancelled, this.cancelAim, this);
    GameEvents.on(EVENT.playerDied, this.onPlayerDied, this);
    // Combat v1 Impact: a HEAVY hit taken mid-swing costs the swing — same
    // treatment as Unik/Szarża abandoning one, see onPlayerHeavyHit.
    GameEvents.on(EVENT.playerHeavyHit, this.onPlayerHeavyHit, this);
    // Food was eaten — a gradual, out-of-combat-only heal.
    GameEvents.on(EVENT.healOverTimeRequested, this.onHealOverTimeRequested, this);
    // The ContextAction button or `E` was pressed — activate whatever
    // `nearby` currently is. See requestInteraction.
    GameEvents.on(EVENT.contextActionRequested, this.onContextActionRequested, this);
    // Only campfire's label depends on state besides proximity (skill +
    // stock count), so it's the only kind that needs a live refresh while
    // standing still — see emitNearbyInteractable.
    GameEvents.on(EVENT.inventoryChanged, this.onCampfireContextRefresh, this);
    GameEvents.on(EVENT.skillsChanged, this.onCampfireContextRefresh, this);
    // The save tab asked to load a slot — see onLoadGameRequested.
    GameEvents.on(EVENT.loadGameRequested, this.onLoadGameRequested, this);
    // The save tab's "Zapisz i wyjdź do menu" / "…z gry" — see the two handlers.
    GameEvents.on(EVENT.returnToTitleRequested, this.onReturnToTitleRequested, this);
    GameEvents.on(EVENT.exitGameRequested, this.onExitGameRequested, this);

    // Checkpoint the autosave now that the world exists.
    //
    // Two jobs, both needed. First: `Save` skips the `world` block entirely
    // until a scene has run (Vitals/WorldState are zero before that), so
    // without this a brand-new character's autosave would carry no position at
    // all until the first time they picked something up. Second: this also
    // fires on every portal crossing, since a transition is a `create()` — and
    // "autosave when you change map" is exactly the checkpoint a player
    // expects, for free.
    Save.save();

    // Let the joystick ask whether a touch landed on something in the world.
    // Registered here, at the end of create(), so it can only ever answer once
    // a world actually exists — and re-registered on every restart, which is
    // what keeps it from hit-testing the PREVIOUS map's display list after a
    // portal. See InputState.worldHitTest for why the UI can't just ask us.
    InputState.worldHitTest = (p) => this.input.hitTestPointer(p).length > 0;

    // Cleanup on shutdown so listeners don't stack across restarts.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Sfx.stopAmbient();
      // ⚠ Modele 3D znikają razem ze sceną (obrazy, tekstury, nasłuchy).
      // Renderer three.js jest od 2026-10-03 WSPÓLNY i żyje do końca strony
      // (`Shared3D`) — jeden kontekst WebGL, którego portale nie wyczerpią.
      this.character3d?.destroy();
      this.character3d = null;
      for (const c of [...Creature3D.wszystkie]) c.destroy();
      // Drop the bridge before the scene tears down: a callback closing over a
      // dead scene would either throw or quietly veto every joystick placement
      // on the title screen, which reads as "the stick stopped working".
      InputState.worldHitTest = null;
      Controls.off(CONTROL.respawn, this.onRespawnRequested, this);
      GameEvents.off(EVENT.leveledUp, this.onLeveledUp, this);
      GameEvents.off(EVENT.maxHpGranted, this.onMaxHpGranted, this);
      GameEvents.off(EVENT.healRequested, this.onHealRequested, this);
      GameEvents.off(EVENT.abilityRequested, this.onAbilityRequested, this);
      GameEvents.off(EVENT.weaponSwapRequested, this.onWeaponSwapRequested, this);
      GameEvents.off(EVENT.abilityAimStarted, this.onAbilityAimStarted, this);
      GameEvents.off(EVENT.abilityAimMoved, this.onAbilityAimMoved, this);
      GameEvents.off(EVENT.abilityAimCommitted, this.onAbilityAimCommitted, this);
      GameEvents.off(EVENT.abilityAimPointed, this.onAbilityAimPointed, this);
      GameEvents.off(EVENT.abilityAimCancelled, this.cancelAim, this);
      GameEvents.off(EVENT.playerDied, this.onPlayerDied, this);
      // ⚠ **Brakowało tu do 2026-09-08, i to była jedyna nieodpięta subskrypcja
      // tej sceny** (16 `on`, 15 `off`). `GameEvents` przeżywa `scene.restart()`,
      // więc każde przejście bramą i każde wczytanie zapisu dokładało kolejny
      // handler związany z JUŻ ZASTĄPIONYM stanem sceny — po pięciu bramach
      // jeden ciężki cios kasował `pendingSwing` sześć razy, w tym pięć razy
      // na polach z poprzedniej mapy. Kolejność wpisu odpowiada kolejności
      // rejestracji wyżej, żeby obie listy dało się porównać wzrokiem.
      GameEvents.off(EVENT.playerHeavyHit, this.onPlayerHeavyHit, this);
      GameEvents.off(EVENT.healOverTimeRequested, this.onHealOverTimeRequested, this);
      GameEvents.off(EVENT.contextActionRequested, this.onContextActionRequested, this);
      GameEvents.off(EVENT.inventoryChanged, this.onCampfireContextRefresh, this);
      GameEvents.off(EVENT.skillsChanged, this.onCampfireContextRefresh, this);
      // Bookmark how far regrowth got, so the next visit to this map picks up
      // from here instead of finding it as full as a first-ever visit.
      for (const g of this.gatherers) g.stop();
      GameEvents.off(EVENT.loadGameRequested, this.onLoadGameRequested, this);
      GameEvents.off(EVENT.returnToTitleRequested, this.onReturnToTitleRequested, this);
      GameEvents.off(EVENT.exitGameRequested, this.onExitGameRequested, this);
    });

    // ⭐ Widok 3D (domyślny od 2026-10-06; 2D: `?widok2d`) — na samym końcu, gdy mapa, drzewa
    // i encje już stoją. Sprząta się sam przy SHUTDOWN.
    if (WorldView3D.wlaczony) new WorldView3D(this);
    else {
      // `?widok2d`: palisada/brama nie mają kafli — płaski zarys zamiast niewidzialnej ściany.
      const kafle = this.children.list.filter((o): o is Phaser.Tilemaps.TilemapLayer => o instanceof Phaser.Tilemaps.TilemapLayer);
      rysujBezKafli2D(this, kafle, DEPTH.entities);
    }
  }

  /**
   * Load a slot mid-game and restart into it.
   *
   * `Save.load` has already replaced every persisted singleton by the time the
   * restart runs, so all this has to carry is where the character stood — the
   * same three fields a portal carries, through the same door. A save with no
   * recorded position (anything written before slots existed) yields an empty
   * object, which lands on the map's own spawn point exactly as it used to.
   */
  private onLoadGameRequested(payload: { slot: SlotId }): void {
    const world = Save.load(payload.slot);
    if (!world) return; // Nothing there, or an incompatible version — say nothing, change nothing.
    this.transitioning = true;
    this.cameras.main.fadeOut(PORTAL.fadeMs, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ mapId: world.mapId, spawn: world.spawn, hp: world.hp });
    });
  }

  /**
   * Leave the active session for the title screen — the save tab's
   * "Zapisz i wyjdź do menu". A guaranteed checkpoint first (so nothing since the last
   * autosave-triggering event is lost — see `Save.ts`'s event wiring for why
   * that can otherwise lag behind pure movement/HP), then UIScene is stopped
   * EXPLICITLY before TitleScene starts.
   *
   * ⚠ That stop is not optional. `this.scene.start("Title")` only stops the
   * scene that calls it (this one) — UIScene was `launch()`ed independently by
   * TitleScene and nothing else ever tears it down. Left running, its ~15
   * widgets (HUD, PlayerPanel, NpcDialog, BuffBar…) would keep rendering over
   * the title screen, and `TitleScene`'s own later `scene.launch("UI")` would
   * be a no-op on an already-active scene — no fresh `create()`, so a later
   * "Kontynuuj" would resume into stale widget instances.
   */
  private onReturnToTitleRequested(): void {
    Save.save();
    this.cameras.main.fadeOut(PORTAL.fadeMs, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop("UI");
      this.scene.start("Title");
    });
  }

  /** „Zapisz i wyjdź z gry" — gwarantowany autozapis (pozycja i HP z tej klatki),
   *  potem zamknięcie aplikacji. Przycisk istnieje tylko na Androidzie. */
  private onExitGameRequested(): void {
    Save.save();
    void App.exitApp();
  }

  private remainingEnemies = 0;

  /**
   * Prefer the Tiled map for `this.mapId`; fall back to the code-authored one
   * if the JSON is missing, malformed, or the tileset PNG didn't load. The
   * game always boots — an unrecognised `mapId` (there isn't one today, but
   * a stale portal `target` from a half-edited map could produce one) also
   * falls through to this same generic map rather than throwing.
   */
  private buildWorld(): BuiltMap & {
    enemySpawns?: EnemySpawn[];
    campfireSpawns?: Phaser.Math.Vector2[];
    waterwheelSpawns?: Phaser.Math.Vector2[];
    npcSpawns?: Partial<Record<NpcId, Phaser.Math.Vector2>>;
    wellSpawns?: WellSpawn[];
    herbNodes?: Partial<Record<HerbId, Phaser.Math.Vector2[]>>;
    farmAnimalSpawns?: Partial<Record<FarmAnimalSpecies, Phaser.Math.Vector2[]>>;
    decorSpawns?: Partial<Record<DecorId, Phaser.Math.Vector2[]>>;
    birdSpawns?: Phaser.Math.Vector2[];
    portals?: PortalSpawn[];
    questSpots?: Record<string, Phaser.Math.Vector2>;
    namedAnimals?: Record<string, { species: FarmAnimalSpecies; pos: Phaser.Math.Vector2 }>;
    hasObjectLayer?: boolean;
  } {
    if (this.mapId === SWIAT.id) {
      if (composeWorld(this, SWIAT.jsonKey, SWIAT.key, SWIAT.czlonkowie) && canBuildTiledMap(this, SWIAT.key)) {
        const built = buildTiledMap(this, SWIAT.key);
        if (built) return built;
      }
      console.warn("[świat] nie udało się skleić świata — wieś jako osobna mapa");
      this.mapId = "village";
    }
    const entry = MAP_BY_ID[this.mapId] ?? MAPS.forest;
    if (canBuildTiledMap(this, entry.key)) {
      const built = buildTiledMap(this, entry.key);
      if (built) return built;
    }
    console.warn(`[map] Tiled map "${this.mapId}" unavailable — using the built-in code map.`);
    return new MapBuilder(this).build();
  }

  /** Spawn points used when the map doesn't define any: a few rabbits scattered
   *  around the player. Only a fallback — the forest map authors its own. */
  private defaultEnemySpawns(map: BuiltMap): EnemySpawn[] {
    const { x, y } = map.playerSpawn;
    const clamp = (vx: number, vy: number) =>
      new Phaser.Math.Vector2(
        Phaser.Math.Clamp(vx, 32, map.widthPx - 32),
        Phaser.Math.Clamp(vy, 32, map.heightPx - 32),
      );
    return [
      { kind: "rabbit", pos: clamp(map.widthPx - 64, map.heightPx - 64) },
      { kind: "rabbit", pos: clamp(x - 140, y + 120) },
      { kind: "rabbit", pos: clamp(x + 60, y + 180) },
    ];
  }

  /**
   * Place the merchant on the far (north) bank of the river, across the
   * bridge from the player's start — a deliberate landmark spot rather than
   * "nearest safe patch to spawn". Falls back to searching near the player
   * spawn if that side of the map is ever blocked (e.g. a redrawn map).
   */
  private pickMerchantSpot(
    map: BuiltMap,
    enemySpawns: EnemySpawn[],
  ): Phaser.Math.Vector2 {
    const northBank = new Phaser.Math.Vector2(map.widthPx * 0.62, map.heightPx * 0.15);
    return (
      this.findClearSpot(northBank, map, enemySpawns) ??
      this.findClearSpot(this.playerSpawn, map, enemySpawns) ??
      // Both searches failed (very cramped map) — better a possibly-close
      // merchant than none at all.
      new Phaser.Math.Vector2(
        Phaser.Math.Clamp(this.playerSpawn.x + 70, 32, map.widthPx - 32),
        Phaser.Math.Clamp(this.playerSpawn.y - 10, 32, map.heightPx - 32),
      )
    );
  }

  /**
   * Ring search around `anchor`: closest radius first, 8 angles per ring.
   * Accepts the first candidate that clears every enemy spawn by
   * MERCHANT.minDistanceFromEnemies and isn't inside solid terrain.
   */
  private findClearSpot(
    anchor: Phaser.Math.Vector2,
    map: BuiltMap,
    enemySpawns: EnemySpawn[],
  ): Phaser.Math.Vector2 | null {
    for (const radius of MERCHANT.spawnSearchRadii) {
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = Phaser.Math.DegToRad(deg);
        const x = Phaser.Math.Clamp(anchor.x + Math.cos(rad) * radius, 32, map.widthPx - 32);
        const y = Phaser.Math.Clamp(anchor.y + Math.sin(rad) * radius, 32, map.heightPx - 32);
        const clearOfEnemies = enemySpawns.every(
          (s) => Phaser.Math.Distance.Between(x, y, s.pos.x, s.pos.y) >= MERCHANT.minDistanceFromEnemies,
        );
        if (clearOfEnemies && !this.overlapsSolid(x, y)) {
          return new Phaser.Math.Vector2(x, y);
        }
      }
    }
    return null;
  }

  /**
   * Fallback used only when the map authors no "campfire" spawn points of its
   * own (see TiledMap.readSpawns). Places one around the merchant: closest
   * ring first, 8 angles each, skipping anything sitting in solid terrain
   * (water, trees) or on top of the merchant's own body.
   *
   * Every candidate radius is >= CAMPFIRE.spawnSearchRadii[0], which is itself
   * larger than the two interact ranges combined — so wherever this lands, the
   * player can never be inside the shop's range and the fire's range at once.
   */
  private pickCampfireSpot(map: BuiltMap, merchantSpot: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    for (const radius of CAMPFIRE.spawnSearchRadii) {
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = Phaser.Math.DegToRad(deg);
        const x = Phaser.Math.Clamp(merchantSpot.x + Math.cos(rad) * radius, 32, map.widthPx - 32);
        const y = Phaser.Math.Clamp(merchantSpot.y + Math.sin(rad) * radius, 32, map.heightPx - 32);
        // Clamping to the map edge can drag a candidate back toward the
        // merchant, so re-check the real distance rather than trusting `radius`.
        const far =
          Phaser.Math.Distance.Between(x, y, merchantSpot.x, merchantSpot.y) >
          MERCHANT.interactRange + CAMPFIRE.interactRange;
        if (far && !this.overlapsSolid(x, y)) return new Phaser.Math.Vector2(x, y);
      }
    }
    // Cramped map: put it straight below the merchant at a safe distance and
    // accept the overlap rather than shipping a campfire-less world.
    return new Phaser.Math.Vector2(
      Phaser.Math.Clamp(merchantSpot.x, 32, map.widthPx - 32),
      Phaser.Math.Clamp(merchantSpot.y + CAMPFIRE.spawnSearchRadii[0], 32, map.heightPx - 32),
    );
  }

  /** True if a small box around (x, y) overlaps any solid terrain body. */
  private overlapsSolid(x: number, y: number): boolean {
    return this.physics.overlapRect(x - 14, y - 14, 28, 28, false, true).length > 0;
  }

  /**
   * Charge the cost of dying. Done here rather than in Player because the
   * penalty is gold, and Player has no business knowing about the purse.
   *
   * Applied on death, not on resurrection, so the death screen can report it —
   * a number that quietly shrinks in the corner is worse than no penalty at all.
   */
  private onPlayerDied(): void {
    // Trup nie celuje. Bez tego podgląd zostawałby na ekranie po śmierci,
    // a commit z wciąż trzymanego palca odpaliłby zamach na zwłokach —
    // `onAbilityRequested` i tak by go odrzucił, ale klin wisiałby na mapie.
    this.cancelAim();
    const lost = Inventory.loseGoldFraction(RESPAWN.goldLossFraction);
    GameEvents.emit(EVENT.deathPenalty, { gold: lost });
  }

  /**
   * Combat v1 Impact: a heavy telegraphed hit taken mid-commitment abandons
   * the player's own swing — the blow never lands, exactly like a Unik or
   * Szarża rolling out of one (see those `pendingSwing = null` sites). The
   * cooldown and any durability roll already spent stand; only the hit itself
   * is lost. `Stamina.impactTier` decided this was "heavy" from the same
   * `hitCost` curve stamina already uses — no second poise stat.
   */
  private onPlayerHeavyHit(): void {
    this.pendingSwing = null;
  }

  /** Resurrect the player in place (or at the map spawn) after a death. */
  private onRespawnRequested(): void {
    if (!this.player?.isDead) return;

    const target = RESPAWN.atSpawnPoint
      ? this.playerSpawn
      : new Phaser.Math.Vector2(this.player.x, this.player.y);
    this.player.revive(target.x, target.y);

    // ⚠ **Błysk i aureola pod `playAccent`, ustawienie kamery POZA nim** — i ten
    // podział jest całą treścią tych trzech linii. Dziś monit odrodzenia sceny
    // NIE pauzuje (`RespawnPrompt` woła `Controls.emit`, nie `pauseGame`), więc
    // zachowanie się nie zmienia ani o klatkę; gdyby kiedyś zaczął pauzować,
    // zamrożony biały flash zalałby ekran dokładnie tak, jak robił to żółty po
    // awansie. `startFollow`/`centerOn` to nie akcent, tylko STAN kamery —
    // porzucone zostawiłyby widok wiszący nad miejscem śmierci.
    this.playAccent(() => {
      this.cameras.main.flash(220, 255, 255, 255);
      this.spawnRespawnFx(target.x, target.y);
    });
    // Snap the camera back onto the player instead of drifting across the map.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.centerOn(target.x, target.y);

    // Checkpoint, for the same reason as the one in create().
    //
    // Dying costs gold, which fires an autosave — and that autosave lands while
    // the player is a corpse: 1 HP (the floor `Save` clamps to) at the spot
    // they fell. Nothing in the respawn itself writes a save (HP changes aren't
    // among the autosave triggers), so without this the recorded state could
    // stay "dead where you died" until the next time something was picked up,
    // and a tab closed in between would resume the character at 1 HP in the
    // middle of whatever killed them.
    WorldState.playerX = target.x;
    WorldState.playerY = target.y;
    Save.save();
  }

  /** Place one talkable NPC and register it for the proximity check. */
  private addNpc(at: Phaser.Math.Vector2, id: NpcId): Merchant {
    const npc = new Merchant(this, at.x, at.y, id);
    // ⭐ Mieszkaniec 3D (`NPC_3D`, pilot 2026-10-09) — sprite zostaje dla
    //   rozmowy i trafienia palcem, rysuje model (`Creature3D`).
    const m3d = NPC_3D.modele[id];
    if (m3d) {
      new Creature3D(this, npc as unknown as ConstructorParameters<typeof Creature3D>[1], m3d);
      // Wzrost modelu = baza postaci (`NPC_3D.wysokoscJ` j.) × skala świata.
      // ⚠ NIE `player.displayHeight` — obrazek gracza niesie zapas bufora nad
      //   głową (na zamach), napisy wisiały ~40% za wysoko.
      // W widoku 3D pion na ekranie to wysokość × cos(kąta) przy kamerze
      // ściśniętej o sin(kąta).
      const kat = (WorldView3D.kat * Math.PI) / 180;
      const k = WorldView3D.wlaczony ? Math.cos(kat) / Math.sin(kat) : 1;
      npc.napisyNadModelem(NPC_3D.wysokoscJ * (m3d.skala ?? 1) * pikseliNaJednostke() * k);
    }
    this.physics.add.collider(this.player, npc);
    this.npcs.push(npc);
    this.addInteractable(npc);
    return npc;
  }

  /** Add one enemy of the spawn's kind and count it as alive. */
  private spawnEnemy(spawn: EnemySpawn): void {
    const enemy = this.createEnemy(spawn);
    this.enemies.add(enemy);
    // ⭐ Model 3D zamiast arkusza, jeśli gatunek go ma i umie podać `stan3d()`
    // (`OI-161`). Logika wroga zostaje nietknięta — patrz `Creature3D`.
    const m3d = MODELE_3D[spawn.kind];
    if (m3d && typeof (enemy as unknown as { stan3d?: unknown }).stan3d === "function") {
      new Creature3D(this, enemy as unknown as ConstructorParameters<typeof Creature3D>[1], m3d);
    }
    this.remainingEnemies++;
    // Wired here rather than inside Enemy itself: the enemy only knows it's
    // clickable (setInteractive, in its own constructor), GameScene owns what
    // clicking one actually means.
    enemy.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.setTarget(enemy));
  }

  /**
   * The ONE execution dispatch for npc/campfire/gather — pick that plant,
   * talk to that villager, cook at that fire. Every channel that can trigger
   * an interaction funnels through here with the specific `Interactable` it
   * means:
   *
   *  • A direct tap on the object itself (wired in `addInteractable`) passes
   *    THAT object.
   *  • The ContextAction button and the centralized `E` key both pass
   *    `nearby` (see `onContextActionRequested`) — the nearest-wins nearest
   *    proximity result.
   *
   * ⚠ Range is re-checked here against the GIVEN object's own `interactRange`
   * regardless of which channel called — cheap and always correct for the
   * `nearby` case (it was already in range when selected), and load-bearing
   * for a direct tap: `E` means "the thing I'm standing at", a tap means
   * "that thing there", and with dozens of hand-placed herb stanowiska two
   * are routinely in range at once. Reusing the nearest-wins result for a tap
   * would silently pick a different plant than the one under the finger — the
   * exact class of quiet wrongness `core/Interactables.ts` was written to
   * stop.
   *
   * Out of range does nothing at all: no auto-walk, no pathfinding, the same
   * rule the combat target already follows. The player closes the distance.
   *
   * ⚠ Presentational only above the switch: what LABEL to show for a given
   * kind lives in `describeInteractable`, kept deliberately separate from
   * what ACTIVATING it does. `ContextAction` reads only the label; nothing
   * about what a kind means lives outside this file.
   */
  private requestInteraction(it: Interactable): void {
    if (!this.player || this.player.isDead) return;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
    if (d > it.interactRange) return;

    switch (it.interactKind) {
      case "gather":
        this.gatherFrom(it as Gatherable);
        break;
      case "campfire":
        this.cookAt(it as Campfire);
        break;
      case "npc":
        // The conversation window lives in UIScene, so this is the one kind
        // that has to travel by event rather than a direct call. Range has
        // already been checked above, against this exact villager.
        GameEvents.emit(EVENT.npcTalkRequested, { id: (it as Merchant).npcId });
        break;
    }
  }

  /**
   * What tapping an enemy means (wired in spawnEnemy) — select it, or
   * DESELECT it if it was already the target.
   *
   * The re-tap toggle is the game's only "stop fighting" input (C-02 in
   * docs/systemy/combat.md). Until it existed, a selected living enemy
   * stayed selected forever and an armed autoattack ran until it died or left
   * reach — a player at low HP had no way to disengage except to outrun the
   * weapon's reach. Deliberately NOT "tap empty ground to deselect": the left
   * half of the screen belongs to the floating joystick, so that gesture would
   * conflate "move here" with "stop fighting".
   *
   * Tapping a DIFFERENT enemy still just switches target and leaves the
   * autoattack armed — switching is retargeting, not disengaging.
   */
  private setTarget(e: Enemy): void {
    if (e.isDead) return;
    // Re-tapping the current target drops it. Note this deliberately does NOT
    // touch `pendingSwing`: a swing already committed belongs to the enemy it
    // was locked onto and still lands exactly once (C-01). Deselecting stops
    // the NEXT swing, not the one in flight.
    if (this.currentTarget === e) {
      this.clearTarget();
      return;
    }
    this.selectTarget(e);
  }

  /**
   * Zaznacz cel **bez przełącznika**.
   *
   * ⚠ **Wydzielone z `setTarget`, bo przełącznik jest własnością TAPNIĘCIA,
   * nie zaznaczania.** Wołający, który chce po prostu „ten ma być celem"
   * (Szarża), nie może dostać odznaczenia w prezencie tylko dlatego, że
   * trafił na cel już wybrany — a `setTarget` zrobiłby dokładnie to.
   */
  private selectTarget(e: Enemy): void {
    if (e.isDead) return;
    this.currentTarget = e;
    if (!this.targetMarker) {
      // ⭐ Pierścień leży NA GRUNCIE (2026-10-04): warstwa cieni stworzeń
      // (`DEPTH.overlay`, jak cień `Creature3D`), POD istotami — więc nie idzie
      // do `ySortedWorld` i nie przesortowuje się co klatkę.
      this.targetMarker = this.add
        .image(e.x, e.y, ASSETS.targetMarker.textureKey)
        .setAlpha(COMBAT_FEEDBACK.targetMarker.alpha)
        .setDepth(DEPTH.overlay + 6);
    }
    this.targetMarker.setVisible(true);
    this.repositionTargetMarker();
  }

  private clearTarget(): void {
    this.currentTarget = null;
    this.targetMarker?.setVisible(false);
    // A fresh target always needs a fresh Attack press — see autoAttackArmed.
    this.autoAttackArmed = false;
  }

  /** Drop the target the instant it's no longer valid — dead, or gone from
   *  the scene entirely (a respawn is always a brand NEW Enemy instance, see
   *  spawnEnemy/tryRespawn, so a stale reference here can only ever be this
   *  same creature dying, never a different one appearing in its place). */
  private clearTargetIfInvalid(): void {
    const t = this.currentTarget;
    if (!t || (!t.isDead && t.active)) return;
    // The target is gone. If the player was mid-autoattack, hand the fight to
    // whoever is still in it rather than dropping them out of combat.
    const next = this.autoAttackArmed ? this.nextAttackerTarget(t) : null;
    if (!next) {
      this.clearTarget();
      return;
    }
    // Switch WITHOUT going through clearTarget(), which disarms — the whole
    // point here is that an unbroken fight keeps swinging. Marker follows.
    this.currentTarget = next;
    this.targetMarker?.setVisible(true);
    this.repositionTargetMarker();
  }

  /**
   * Who should inherit the fight when the current target dies: the nearest
   * enemy that is ACTIVELY CHASING the player, excluding the corpse.
   *
   * ⚠ "Chasing", not "nearest" — and the difference is the whole point. A
   * rabbit grazing two tiles away is usually nearer than the wolf that is
   * actually mauling you, so a plain nearest-enemy search would keep starting
   * fights the player never picked, in a forest whose whole design is that you
   * choose what to engage. Only creatures already committed to attacking are
   * eligible, so this can never widen a fight — it can only continue one.
   *
   * Returns null when nothing is attacking, which drops the target and disarms
   * as before: killing the last thing that wanted you dead should end the
   * fight, not leave the player swinging at scenery.
   *
   * Deliberately NOT auto-follow: the inherited target may well be out of
   * reach, and the player still has to close the distance themselves.
   */
  /**
   * Wybierz najbliższego żywego wroga, którego bieżąca broń **już dosięga**, i
   * uczyń go celem. Nic nie robi, gdy nikogo takiego nie ma.
   *
   * ⚠ Próg to `targetInReach`, ten sam, którego używa cios — a nie osobna
   * stała. Gdyby to były dwie liczby, istniałby stan „sfokusowany, ale poza
   * zasięgiem", w którym przycisk ataku wybiera cel i natychmiast odmawia
   * uderzenia, bez żadnego wyjaśnienia na ekranie.
   */
  /** Scene time before which ANY attack-refusal message („Brak celu",
   *  „Za daleko") must not appear again. Jeden licznik na obie — patrz
   *  `COMBAT_FEEDBACK.attackRefusalMsgMs`. */
  private attackRefusalMsgReadyAt = 0;

  /**
   * Jedna klatka trwającego lotu do celu (Szarża albo Wypad): skoryguj kurs,
   * sprawdź warunki końca.
   *
   * ⚠ **Koniec ma trzy powody i każdy musi zwalniać ciało**, inaczej gracz
   * zostaje z zablokowaną gałką: dobiegnięcie (zasięg broni), przerwanie
   * (cel zginął albo gracz zginął) i bezpiecznik czasowy. Ten ostatni nie jest
   * ozdobą — bez niego lot za czymś, co ucieka dokładnie z jego prędkością,
   * trwałby w nieskończoność.
   *
   * ⚠ **Żadna z gałęzi nie zadaje obrażeń sama.** Szarża uzbraja autoatak,
   * Wypad odkłada własne pchnięcie w `pendingSwing` — obie drogi kończą się
   * w tej samej ścieżce ciosu, więc krytyki, typ obrażeń z aktywnego wariantu,
   * pancerz, odrzut, przerwania, XP, łup i zużycie broni działają bez jednej
   * nowej linijki. Drugie miejsce liczące trafienie byłoby drugim miejscem,
   * które może zapomnieć przyznać doświadczenie.
   */
  private stepRush(): void {
    const c = this.pendingRush;
    if (!c) return;

    if (this.player.isDead) {
      this.pendingRush = null;
      this.player.releaseDrive();
      return;
    }

    // ── Lot KIERUNKOWY (Wypad bez celu): leci do końca czasu i tyle ───────
    // ⚠ Nie ma tu dobiegnięcia, bo nie ma do czego dobiec — kończy go zegar
    // albo teren (`collider(player, map.solids)` zatrzymuje ciało sam z siebie).
    // Nic nie ląduje, więc nic nie jest nagradzane: pełny cooldown, i to jest
    // dokładnie cena przemieszczenia.
    if (c.kind === "dash") {
      if (this.time.now >= c.endsAt) {
        this.pendingRush = null;
        this.player.releaseDrive();
        return;
      }
      this.player.driveLocked(c.dirX, c.dirY, c.speed, 40);
      return;
    }

    if (c.target.isDead || !c.target.active) {
      this.pendingRush = null;
      this.player.releaseDrive();
      return;
    }

    // ⚠ W przestrzeni CIAŁ (`bodyVectorTo`) — i to jest jeden wektor na trzy
    // rzeczy naraz: kurs lotu (`driveLocked`), zwrot w trakcie lotu (ten sam
    // `driveLocked`) i celowanie na dobiegnięciu. Wektor między duszkami
    // prowadził lot w punkt kilkanaście pikseli POD ciałem celu, a `faceAlongTravel`
    // niżej obiecuje „zwrot wzdłuż tego, co ciało faktycznie przejechało" —
    // obie połowy muszą więc czytać ten sam wektor.
    const { x: dx, y: dy } = this.bodyVectorTo(c.target);

    // Dobiegł: ta sama bramka zasięgu, której używa zwykły atak, więc lot
    // nigdy nie kończy się „tuż za blisko/za daleko" względem tego, co za
    // chwilę zdecyduje o trafieniu.
    if (this.targetInReach(c.target, this.currentStrike().reach, this.currentStrike().minReach)) {
      this.pendingRush = null;
      this.player.releaseDrive();
      this.player.aimAttackAt(dx, dy);
      /* ⚠⚠ **ZWROT wzdłuż lotu, nie tylko kierunek zamachu — poprawka
         2026-09-11 (cicha ścieżka „doleciałem i nic").**

         `aimAttackAt` ustawia wyłącznie `attackRad`, czyli kierunek CIOSU.
         Bramka zwrotu pyta o `zwrotRad` — a ten w klatce dobiegnięcia należy do
         drążka, bo `driveLocked` (jedyne miejsce, które go pisał w trakcie
         lotu) już się nie wykonał. Gracz przytrzymujący drążek w innym
         kierunku lądował więc przy celu z uzbrojonym autoatakiem, który
         odbijał się od `canStrikeFacing` **bez ani jednego komunikatu**: te
         padają na zboczu naciśnięcia, a tu żadnego zbocza nie ma.

         Dopisujemy brakującą klatkę tej samej reguły, którą lot stosował przez
         całą swoją długość — ciało jechało tam, więc postać jest zwrócona tam.
         ⛔ Nie jest to auto-obrót do celu: obraca KURS BIEGU, nie cel. */
      this.player.faceAlongTravel(dx, dy);
      if (c.arrival === "strike" && c.action) this.landRushStrike(c.target, c.action);
      else this.autoAttackArmed = true;
      this.cameras.main.shake(90, 0.004);
      return;
    }

    if (this.time.now >= c.endsAt) {
      // Bezpiecznik. Autoatak zostaje uzbrojony mimo wszystko: gracz wybrał
      // ten cel i ruszył na niego, więc gdy dogoni go o własnych nogach, ma
      // uderzyć bez ponownego naciskania.
      //
      // ⚠ **Także dla Wypadu — i to jest świadome.** Pchnięcie NIE odpala się
      // z bezpiecznika: cel, do którego nie dobiegliśmy, nie ma prawa oberwać,
      // a zwrot cooldownu wisi na trafieniu, więc nieudany Wypad kosztuje
      // pełne 14 s. Dokładnie po to ta liczba jest tak wysoka.
      this.pendingRush = null;
      this.player.releaseDrive();
      this.autoAttackArmed = true;
      return;
    }

    this.player.driveLocked(dx, dy, c.speed, 40);
  }

  /**
   * Pchnięcie na końcu Wypadu. Odkłada cios w `pendingSwing` — czyli w tę samą
   * ścieżkę, którą jedzie każdy zamach od C-01 — zamiast zadawać obrażenia tutaj.
   *
   * ⚠ **`pendingSwing` ma JEDEN slot**, a lot mógł zacząć się w trakcie
   * niedokończonego zamachu. Nadpisanie jest tu poprawne (zamach przerwał już
   * start Wypadu, patrz gałąź `case "lunge"`), ale gdyby kiedykolwiek doszła
   * druga rzecz pisząca do tego pola, obowiązuje ta sama bramka co przy
   * Ciężkim uderzeniu: sprawdź, czy nie zjadasz ciosu w locie.
   *
   * ⚠ **DRUGI wykonawca deklaracji `PlayerAction`, obok `commitPlayerAction`
   * (P3.5).** Różnica jest jedna i cała treść tego podziału siedzi w niej:
   * tamten składa cios **na naciśnięciu**, ten **na dobiegnięciu**. Dlatego tu
   * nie ma ani wyboru celu (wybrał go lot), ani celowania (`stepRush` już
   * ustawił zwrot), ani bramek wejścia — a jest ta sama deklaracja.
   *
   * ⚠ **Profil ciosu czytany TUTAJ, na dobiegnięciu** (`currentStrike()`), i tak
   * było przed P3.5 — nie zamrażamy go na starcie lotu.
   */
  private landRushStrike(target: Enemy, action: PlayerAction): void {
    const now = this.time.now;
    // ⚠ **Ręka GŁÓWNA, nie cykl naprzemienny.** Wypad jest umiejętnością,
    // a umiejętności zostają na broni głównej (prototyp DW, 2026-09-05) —
    // naprzemienność dotyczy wyłącznie autoataku.
    const strike = this.currentStrike();
    // ⚠ **Ukorzenienie z polityki akcji** — dla Wypadu `weaponTempo`, czyli
    // `rootMs === undefined` i root z tempa broni. Dokładnie to, co ta linia
    // robiła przed P3.5, tylko powód stoi teraz w danych.
    const zamach = this.player.triggerAttack(now, {
      durationMs: action.windupMs * 2,
      rootMs: rootMsDlaAkcji(action),
      poza: action.poza,
    });
    // ⚠ Zużycie broni jest DEKLARACJĄ akcji, nie regułą wykonawcy (P3.2) —
    // pchnięcie wyprowadza oręż, więc oręż się zużywa.
    if (action.wearsWeapon) this.wearWeapon();
    this.pendingSwing = {
      resolveAt: now + action.windupMs,
      target,
      dirX: zamach.dirX,
      dirY: zamach.dirY,
      fxRadius: zamach.radius,
      strike,
      // ⚠ **Wypad NIE fuszeruje** — powód (jeden rzut rozstrzyga o obu
      // nagrodach) stoi przy `PLAYER_ACTIONS.lunge`.
      allowFumble: action.allowFumble,
      // ⚠ Mnożnik z resolvera, jak w `commitPlayerAction` (P3.4). Dla Wypadu
      // `resolveAbility` zwraca `damageMultiplier` niezależnie od `strike`, więc
      // odczyt na dobiegnięciu daje tę samą liczbę co odczyt na naciśnięciu.
      damageMul: multiplierFor(resolveAbility(action.id, strike), "primary"),
      onHit: onHitDlaSwingu(action),
    };
  }

  /**
   * Odmowa ataku nad głową gracza. Dwa powody, jeden kanał:
   *
   *  • **„Brak celu"** — nie ma czego dotknąć;
   *  • **„Za daleko"** — cel jest, ale broń go nie sięga i nie ma na kogo
   *    przełączyć (C-06).
   *
   * ⚠ **Jeden licznik dławienia na oba**, patrz `COMBAT_FEEDBACK.
   * attackRefusalMsgMs` — wykluczają się w obrębie naciśnięcia, więc osobne
   * liczniki tylko pozwoliłyby obejść dławienie przeskakiwaniem między stanami.
   */
  private announceAttackRefusal(text: string): void {
    // Trup nie szuka celu. `update()` nie ma tu bramki na śmierć, a ekran
    // odrodzenia nie blokuje przycisku ataku — bez tego napis wyskakiwałby nad
    // własnymi zwłokami.
    if (this.player.isDead) return;
    if (this.time.now < this.attackRefusalMsgReadyAt) return;
    this.attackRefusalMsgReadyAt = this.time.now + COMBAT_FEEDBACK.attackRefusalMsgMs;
    this.sayAtPlayer(text);
  }

  /** Jedno zwierzę gospodarskie z modelem 3D — wspólne dla puli z mapy
   *  i dla zwierząt z imieniem. `null`, gdy nie ma jego animacji (brak arkusza). */
  private spawnFarmAnimal(species: FarmAnimalSpecies, x: number, y: number): FarmAnimal | null {
    const kind = resolveFarmAnimalKind(species);
    if (!this.anims.exists(kind.anim("walk", "down"))) return null;
    const zwierze = new FarmAnimal(this, x, y, kind.assets, kind.tuning, kind.anim);
    this.farmAnimals.push(zwierze);
    // ⭐ Model 3D (`tools/farm3d.py`) — kot ma plik na umaszczenie, wyczytane
    //   z klucza arkusza (`cat-orange-walk` → `cat_orange`).
    const klucz3d = species === "cat" ? `cat_${kind.assets.walkKey.split("-")[1]}` : species;
    const m3d = MODELE_3D[klucz3d];
    if (m3d) new Creature3D(this, zwierze as unknown as ConstructorParameters<typeof Creature3D>[1], m3d, () => zwierze.ukryjCien2D());
    return zwierze;
  }

  /** Kiedy ostatnio zamieniono zestaw broni z HUD-u (`WEAPON_SWAP.cooldownMs`). */
  private lastWeaponSwapAt = -Infinity;

  /**
   * Zamiana zestawu broni z przycisku HUD-u (2026-10-12, `WEAPON_SWAP`).
   *
   * ⚠ **Rozstrzyga scena, nie przycisk** — tylko ona wie, czy cios jest
   * w locie. Zamiana w trakcie zamachu podmieniłaby broń pod ciosem, który
   * zamroził już profil poprzedniej (`pendingSwing`), więc czekamy, aż cios
   * wyląduje. Odmowa jest NAZWANA nad postacią (reguła `src/ui/CLAUDE.md`).
   * ⛔ Bez kosztów i okna bezbronności — to decyzja autora, nie skrót.
   */
  private onWeaponSwapRequested(): void {
    if (!this.player || this.player.isDead) return;
    const now = this.time.now;
    if (this.pendingSwing) {
      this.sayAtPlayer("Najpierw dokończ cios");
      return;
    }
    if (now - this.lastWeaponSwapAt < WEAPON_SWAP.cooldownMs) return;
    const refusal = Equipment.swapWeaponSet();
    if (refusal) {
      this.sayAtPlayer(describeSwapRefusal(refusal));
      return;
    }
    this.lastWeaponSwapAt = now;
    Sfx.play("ui-click");
  }

  /** Krótki komunikat nad graczem — powód odmowy. Bez własnej przepustnicy:
   *  odmowy umiejętności są jednorazowe (naciśnięcie przycisku), w
   *  przeciwieństwie do „Brak celu", które leci z trzymanego ataku. */
  private sayAtPlayer(text: string): void {
    if (this.player.isDead) return;
    floatingText(this, {
      x: this.player.x,
      y: this.player.y - 30,
      text,
      color: "#9aa3b5",
      depth: DEPTH.entities + this.player.y + 20,
    });
  }

  private focusNearestInReach(): void {
    const reach = Progression.attackReach;
    let best: Enemy | null = null;
    let bestDist = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.isDead || !e.active) return;
      if (!this.targetInReach(e, reach)) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    });
    if (best) this.setTarget(best);
  }

  /**
   * Naciśnięto atak, a sfokusowany cel jest poza zasięgiem: przełącz na
   * najbliższego wroga, którego **broń już dosięga i który sam nas atakuje**.
   * Nic nie robi, gdy takiego nie ma — wtedy cel zostaje, a autoatak dalej
   * czeka uzbrojony na to, aż gracz podejdzie.
   *
   * ⚠ **`isChasing`, nie „najbliższy" — i to jest ta sama reguła, którą niesie
   * `nextAttackerTarget`, z tego samego powodu.** Królik skubiący trawę dwa
   * kafle dalej bywa bliżej niż wilk, który właśnie cię gryzie; bez tego filtru
   * naciśnięcie ataku w środku walki **rozpoczynałoby nową walkę**, której
   * gracz nie wybrał. Ten mechanizm ma walkę KONTYNUOWAĆ, nigdy jej nie
   * poszerzać.
   *
   * ⚠ **Wyłącznie gdy cel jest POZA zasięgiem — nigdy jako cyklowanie celów.**
   * Przełączanie przy celu, który jest w zasięgu, zabierałoby graczowi
   * ranionego wroga tuż przed dobiciem; a ponieważ orbita wilka leży blisko
   * progu zasięgu najdłuższych broni, cel przeskakiwałby wtedy kilka razy na
   * sekundę.
   *
   * ⚠ **Liczby „22,2% → 97,1% między 78 a 79 px" stały tu do 2026-09-07 i były
   * policzone modelem `allowance = max(displayWidth, displayHeight) × 0,35`,
   * usuniętym z gry w Fazie 1B-b.** Uzasadnienie tej gałęzi się nie zmienia
   * (przeskakiwanie celu przy progu jest niepożądane niezależnie od tego, gdzie
   * dokładnie próg leży), ale ⛔ **nie cytuj tych liczb dalej**. Dzisiejszy
   * pomiar wychodzi z `node tools/macierz_walki.mjs`, który od 2026-09-07 woła
   * żywe `gapBetween`.
   *
   * ⚠ **Dzieje się TYLKO na zboczu naciśnięcia**, nie przy trzymanym przycisku
   * — czyli wymaga świadomego tapnięcia. Trzymany autoatak nigdy nie zmieni
   * celu sam z siebie, i to jest cała gwarancja, że system nie kradnie celu.
   *
   * ⚠ **To NIE jest zaparkowane auto-podchodzenie** (`docs/odlozone.md` §5).
   * Tamto rusza CIAŁEM gracza w stronę celu i kasowałoby pościg za cofającym
   * się sieciarzem; to wybiera innego wroga, który już stoi obok, i nie
   * pokonuje ani jednego piksela dystansu. Przy uciekającym pająku samotnie
   * nie robi dosłownie nic — nie ma na kogo przełączyć.
   */
  private refocusReachableAttacker(): boolean {
    const reach = this.currentStrike().reach;
    const current = this.currentTarget;
    let best: Enemy | null = null;
    let bestDist = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e === current || e.isDead || !e.active || !e.isChasing) return;
      if (!this.targetInReach(e, reach)) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    });
    if (!best) return false;
    // ⚠ Przypisanie WPROST, nie przez `setTarget` — `setTarget` odznacza cel,
    // gdy dostanie ten sam obiekt, a poza tym `clearTarget` rozbraja autoatak.
    // Tu chodzi o coś odwrotnego: nieprzerwana walka ma dalej machać. Ta sama
    // ścieżka i ten sam powód, co w `clearTargetIfInvalid`.
    this.currentTarget = best;
    this.targetMarker?.setVisible(true);
    this.repositionTargetMarker();
    return true;
  }

  private nextAttackerTarget(exclude: Enemy): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e === exclude || e.isDead || !e.active || !e.isChasing) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    });
    return best;
  }

  /** Keep the ring pinned over whatever's currently targeted — the target
   *  moves (patrol/chase), so this has to run every frame, not just on select. */
  private repositionTargetMarker(): void {
    if (!this.currentTarget || !this.targetMarker) return;
    const t = this.currentTarget;
    // Pod stopami: dół ciała Arcade — ta sama kotwica co cień i obraz modelu 3D
    // (`Creature3D`); szerokość z tego samego śladu co cień (× 1,15) + zapas.
    const body = t.body as Phaser.Physics.Arcade.Body | null;
    const m = COMBAT_FEEDBACK.targetMarker;
    const pol = Math.max(28, (body?.width ?? 40) * 1.15) / 2 + m.groundPad;
    const klucz = targetMarkerKey(this, pol);
    if (this.targetMarker.texture.key !== klucz) this.targetMarker.setTexture(klucz);
    this.targetMarker.setPosition(body ? body.center.x : t.x, body ? body.bottom : t.y);
    this.paintTargetMarker(t);
  }

  /**
   * **Stan pierścienia celu: dosięgam / za daleko / za plecami** (2026-09-11).
   *
   * ⚠ **Odpowiada na to samo pytanie, na które odpowiadają trzy odmowy
   * autoataku, tylko CIĄGLE i przed naciśnięciem.** Te same dwa predykaty
   * (`targetInReach` z zasięgiem broni, `canStrikeFacing`) i ta sama kolejność
   * co w `update()` — dystans przed zwrotem. Inna kolejność pokazywałaby „za
   * plecami" wrogowi, który i tak jest za daleko.
   *
   * ⚠ **`Progression.attackReach`, nie `currentStrike()`** — potrzebna jest
   * jedna liczba, a `currentStrike()` składa cały profil ciosu (z biegłością
   * i rodziną broni) i alokowałby obiekt sześćdziesiąt razy na sekundę. Ta sama
   * droga, którą liczy `focusNearestInReach`.
   *
   * ⚠ **Pamięć stanu jest po to, żeby nie malować co klatkę** — dokładnie ten
   * sam powód, dla którego `AbilityBar` trzyma `drawnRatio`: przez większość
   * walki nic się tu nie zmienia, a `setTint` brudzi obiekt renderowania.
   */
  private paintTargetMarker(t: Enemy): void {
    const s = COMBAT_FEEDBACK.targetMarker.states;
    // ⚠ **Dwa powody, dla których cios nie wyjdzie, mają DWA stany** — i to
    //   jest cała treść tego rozgałęzienia. Do 2026-09-16 cel w martwej strefie
    //   piki dostawał `outOfReach`, czyli „podejdź bliżej” w sytuacji, w której
    //   trzeba odejść. Pytamy najpierw o zwarcie, bo `targetInReach` zwraca
    //   `false` w obu przypadkach naraz i sama odpowiedź nie niesie kierunku.
    const wZasiegu = this.targetInReach(t, Progression.attackReach, Progression.attackMinReach);
    const zaBlisko = !wZasiegu && this.targetInReach(t, Progression.attackReach, 0);
    const stan = zaBlisko
      ? "tooClose"
      : !wZasiegu
        ? "outOfReach"
        : !this.canStrikeFacing(t)
          ? "behind"
          : "ready";
    if (stan === this.targetMarkerState) return;
    this.targetMarkerState = stan;
    const wyglad = s[stan];
    this.targetMarker?.setTint(wyglad.tint);
    this.targetMarker?.setAlpha(wyglad.alpha);
  }

  /**
   * Kind → egzemplarz. ⚠ **Rejestr, nie `switch`** (2026-09-03): dawniej stały
   * tu DWIE równoległe listy gatunków (ta i `enemyCfg`), które musiały się
   * zgadzać ręcznie — i nie zgadzały się. Patrz `entities/EnemyRegistry.ts`.
   */
  private createEnemy(spawn: EnemySpawn): Enemy {
    return createEnemyOf(spawn.kind, this, spawn.pos.x, spawn.pos.y);
  }

  /**
   * Launch an enemy shot. This is the ProjectileHost implementation the spider
   * calls: entities can't reach into the scene's group directly (and importing
   * GameScene from an entity would close a cycle), so the scene exposes exactly
   * this one verb and keeps ownership of the group and its collisions.
   */
  fireEnemyProjectile(opts: EnemyProjectileOptions): void {
    if (!this.projectiles) return;
    const shot = new Projectile(this, opts);
    // Order matters: joining an Arcade group resets the body to the group's
    // defaults (velocity 0, no world-bounds collision), so the shot is launched
    // only once it is IN the group. See Projectile.launch().
    this.projectiles.add(shot);
    shot.launch();
  }

  /**
   * Bring a rabbit back at its spawn point after a delay, so clearing the map
   * doesn't leave it empty. The jitter keeps repeated clears from collapsing
   * into synchronised waves, and a respawn is deferred while the player is
   * standing on the point rather than dropping a rabbit into their lap.
   */
  /** Respawn/patrol tuning for a given kind — each enemy respawns at its own
   *  pace (a boar takes longer to return than a rabbit or wolf).
   *  ⚠ Czyta `EnemyRegistry`, więc gatunek bez wpisu **nie skompiluje się**. */
  private enemyCfg(kind: EnemyType): EnemyConfig {
    return enemyConfigOf(kind);
  }

  private scheduleRespawn(at: Phaser.Math.Vector2, kind: EnemyType): void {
    const cfg = this.enemyCfg(kind);
    // A respawnDelay of 0 means "this one does not come back" — see GREY_WOLF,
    // where a named foe returning on a timer would undo the whole point of him.
    if (cfg.respawnDelay <= 0) return;
    const delay = (cfg.respawnDelay + Math.random() * cfg.respawnJitter) * 1000;
    this.time.delayedCall(delay, () => this.tryRespawn(at, kind));
  }

  private tryRespawn(at: Phaser.Math.Vector2, kind: EnemyType): void {
    if (!this.player) return;
    const tooClose =
      Phaser.Math.Distance.Between(at.x, at.y, this.player.x, this.player.y) <
      this.enemyCfg(kind).respawnSafeRadius;
    if (tooClose) {
      // Check again shortly instead of dropping the respawn entirely.
      this.time.delayedCall(1000, () => this.tryRespawn(at, kind));
      return;
    }
    this.spawnEnemy({ kind, pos: at });
  }

  /**
   * Floating damage number. Without it a crit is invisible — the only tell
   * would be the rabbit dying a swing sooner — so this is what makes the crit
   * roll legible at all.
   */
  private spawnDamagePopup(
    x: number,
    y: number,
    amount: number,
    crit: boolean,
    strike: StrikeProfile,
    effect: Effectiveness,
    hitIndex: number,
  ): void {
    // ⚠ Kolor i glif pochodzą z JEDNEGO wywołania `effectiveness()` w
    // `damageMatchingEnemies` i są tu tylko odczytywane z jednej tabeli. To jest
    // techniczna gwarancja tego, co ustaliliśmy projektowo: glif jest
    // REDUNDANTNYM zapisem koloru (dla ~8% mężczyzn nierozróżniających barw
    // czerwono-zielonych), więc nie wolno im się rozjechać.
    const style = EFFECT_STYLE[effect];
    const glyph = COMBAT_FEEDBACK.typeFeedback.glyph[effect];
    const delay = hitIndex * COMBAT_FEEDBACK.typeFeedback.aoeStaggerMs;

    // Grupowanie: [ikona][glif] po lewej mówi CZYM i JAK DOBRZE (oba są
    // własnością dopasowania typ↔pancerz), liczba z `!` po prawej mówi ILE
    // (oba są własnością rzutu). Trzymanie `!` i glifu razem na ogonie liczby
    // zlewało je przy 11 px w jeden nieczytelny ogonek.
    const spawn = () =>
      floatingText(this, {
        x: x + Phaser.Math.Between(-4, 4),
        y: y - 16,
        iconKey: damageIconKey(strike.damageType),
        text: `${glyph}${amount}${crit ? "!" : ""}`,
        // ⚠ Krytyk STRACIŁ własny kolor — kolor niesie teraz skuteczność.
        // Zostaje mu sześć innych wyróżników (rozmiar, pogrubienie, puls,
        // wznoszenie, czas, `!`) plus hit-stop, więc jest to świadoma zamiana,
        // nie regresja.
        color: style.color,
        fontSize: crit ? 15 : 11,
        bold: crit,
        rise: crit ? 24 : 14,
        duration: crit ? 780 : 620,
        depth: DEPTH.entities + y + 200,
        pulse: crit,
      });

    // Jeden zamach siekierą trafia 5 celów w jednej klatce; pięć etykiet po
    // ~50 px na skupisku ~140 px to stos, nie informacja. Rozrzucenie w czasie
    // zamienia go w serię — ta sama zasada, co `AUDIO.minRetriggerMs`.
    if (delay > 0) this.time.delayedCall(delay, spawn);
    else spawn();
  }

  /** Floating "+25 XP" above the corpse, so the reward is legible at the kill. */
  private spawnXpPopup(x: number, y: number, amount: number): void {
    floatingText(this, {
      x,
      y: y - 12,
      text: `+${amount} XP`,
      color: "#ffe680",
      rise: 22,
      duration: 900,
      depth: DEPTH.entities + y + 200,
    });
  }

  private onMaxHpGranted(p: { delta: number }): void {
    this.player?.grantMaxHpIncrease(p.delta);
  }

  private onHealRequested(p: { amount: number }): void {
    this.player?.heal(p.amount);
  }

  private onHealOverTimeRequested(p: { amount: number; durationMs: number; itemId: ItemId }): void {
    this.player?.startHealOverTime(p.amount, p.durationMs, p.itemId);
  }

  /** Roll a chance-based drop of `itemId` and place it on the ground at the kill spot. */
  private rollLoot(
    x: number,
    y: number,
    itemId: ItemId,
    chance: number,
    min: number,
    max: number,
  ): void {
    if (Math.random() >= chance) return;
    this.loot.add(new Loot(this, x, y, itemId, Phaser.Math.Between(min, max)));
  }

  /** Drop the loot appropriate to the kind of enemy just killed. Skinning (learned
   *  from the hunter) unlocks the skin drops — hide from boars, pelt from wolves,
   *  scrap from rabbits. */
  private dropKillLoot(kind: EnemyType, x: number, y: number): void {
    const skinning = Skills.has("skinning");
    if (kind === "rabbit") {
      this.rollLoot(x, y, "rabbit_meat", LOOT.rabbitMeatDropChance, LOOT.rabbitMeatMin, LOOT.rabbitMeatMax);
      if (skinning) {
        // Offset so a meat + scraps double-drop doesn't stack on one spot.
        this.rollLoot(x + 12, y + 6, "leather_scraps", LOOT.rabbitScrapsDropChance, LOOT.rabbitScrapsMin, LOOT.rabbitScrapsMax);
      }
    } else if (kind === "boar" && skinning) {
      this.rollLoot(x, y, "boar_hide", LOOT.boarHideDropChance, LOOT.boarHideMin, LOOT.boarHideMax);
    } else if (kind === "wolf" && skinning) {
      this.rollLoot(x, y, "wolf_pelt", LOOT.wolfPeltDropChance, LOOT.wolfPeltMin, LOOT.wolfPeltMax);
    } else if (kind === "bear" && skinning) {
      this.rollLoot(x, y, "bear_hide", LOOT.bearHideDropChance, LOOT.bearHideMin, LOOT.bearHideMax);
    } else if (kind === "deer" && skinning) {
      this.rollLoot(x, y, "leather_scraps", LOOT.deerScrapsDropChance, LOOT.deerScrapsMin, LOOT.deerScrapsMax);
    } else if (kind === "fox") {
      // Jajka z kurnika — łup złodzieja, nie skóra, więc bez Skórowania.
      this.rollLoot(x, y, "eggs", LOOT.foxEggsDropChance, LOOT.foxEggsMin, LOOT.foxEggsMax);
      if (skinning) {
        this.rollLoot(x + 12, y + 6, "leather_scraps", LOOT.foxScrapsDropChance, LOOT.foxScrapsMin, LOOT.foxScrapsMax);
      }
    } else if (kind === "greywolf") {
      // The trophy is NOT gated on Skinning and never rolls: he is a one-off
      // kill, so a failed roll would mean losing the reward for the hardest
      // fight on the map with no second attempt. The pelt still is gated —
      // that part is ordinary butchery.
      this.rollLoot(x, y, "grey_fang", LOOT.greyFangDropChance, LOOT.greyFangMin, LOOT.greyFangMax);
      if (skinning) {
        this.rollLoot(x + 14, y + 6, "wolf_pelt", LOOT.greyPeltDropChance, LOOT.greyPeltMin, LOOT.greyPeltMax);
      }
    } else if (kind === "spider") {
      // Silk needs no Skinning — you cut it off the web, not off the spider.
      this.rollLoot(x, y, "spider_silk", LOOT.spiderSilkDropChance, LOOT.spiderSilkMin, LOOT.spiderSilkMax);
    } else if (kind === "venomspider") {
      // Same reasoning for both drops: neither is hide, so neither is gated on
      // Skinning. Silk is rarer here than on the sieciarz — a skoczek hunts by
      // jumping and spins far less of it.
      this.rollLoot(x, y, "spider_silk", LOOT.venomSilkDropChance, LOOT.spiderSilkMin, LOOT.spiderSilkMax);
      this.rollLoot(x + 12, y + 6, "venom_gland", LOOT.venomGlandDropChance, LOOT.venomGlandMin, LOOT.venomGlandMax);
    } else if (kind === "bandit_club" || kind === "bandit_axe" || kind === "bandit_chief") {
      // ⭐ Bandyci (`OI-171`): pierwsze ZŁOTO z wroga — prosto do sakiewki, bo
      //   grosz nie jest przedmiotem na ziemi. Pancerz to sztuki, które do tej
      //   pory NIE miały żadnej drogi zdobycia (`OI-106`).
      const herszt = kind === "bandit_chief";
      const zloto = herszt
        ? Phaser.Math.Between(LOOT.chiefGoldMin, LOOT.chiefGoldMax)
        : Phaser.Math.Between(LOOT.banditGoldMin, LOOT.banditGoldMax);
      Inventory.addGold(zloto);
      Sfx.play("loot");
      floatingText(this, { x, y: y - 28, text: `+${zloto} zł`, color: "#ffe680", rise: 22, duration: 900 });
    }
    // Ekwipunek z łupu — tabela w `LOOT.equipmentDrops`, przesunięcie co sztukę,
    // żeby dwie rzeczy nie leżały na jednym miejscu.
    // Egzemplarz z jakością i zużyciem z tabeli (strój zbója leży zniszczony).
    (LOOT.equipmentDrops[kind] ?? []).forEach((d, i) => {
      if (Math.random() >= d.chance) return;
      const itemId = d.items[Math.floor(Math.random() * d.items.length)] as ItemId;
      const q = (d.quality ? Phaser.Math.Between(d.quality[0], d.quality[1]) : DEFAULT_QUALITY) as QualityLevel;
      const inst = makeInstance(itemId, 1, q);
      if (d.durability) setDurabilityFraction(inst, Phaser.Math.FloatBetween(d.durability[0], d.durability[1]));
      this.loot.add(new Loot(this, x + 14 * i, y + 6 * i, itemId, 1, inst));
    });
  }

  /** Add a ground drop to the backpack, or leave it if there's no room. */
  private collectLoot(loot: Loot): void {
    if (loot.isGone) return;
    if (loot.instance) {
      // Konkretny egzemplarz (zużycie, jakość) — wchodzi w całości albo zostaje.
      if (!Inventory.addInstance({ ...loot.instance })) return;
      Sfx.play("loot");
      loot.take(loot.qty);
      this.spawnLootPopup(loot.x, loot.y, loot.itemId, 1);
      return;
    }
    const leftover = Inventory.addItem(loot.itemId, loot.qty);
    if (leftover >= loot.qty) return; // backpack has no room at all — leave it
    const collected = loot.qty - leftover;
    Sfx.play("loot");
    // ⚠ Częściowe podniesienie zostawia RESZTĘ na ziemi (`OI-58`) — dawniej
    // `collect()` kasował całe znalezisko, choć weszła tylko część.
    loot.take(collected);
    this.spawnLootPopup(loot.x, loot.y, loot.itemId, collected);
  }

  /** Floating "+2 Mięso królicze" above a picked-up drop. */
  private spawnLootPopup(x: number, y: number, itemId: ItemId, qty: number): void {
    floatingText(this, {
      x,
      y: y - 12,
      text: `+${qty} ${getItem(itemId).name}`,
      color: "#a8e8c0",
      rise: 18,
      duration: 700,
      depth: DEPTH.entities + y + 200,
    });
  }

  /** Burst at the player's feet when a level lands. */
  private onLeveledUp(p: { level: number; gained: number }): void {
    if (!this.player) return;

    // Announce anything this level just unlocked. `leveledUp` fires once per
    // level gained, so a multi-level XP dump still reports each ability rather
    // than only the last one.
    const granted = Abilities.unlockedBetween(p.level - 1, p.level);
    if (granted.length > 0) {
      GameEvents.emit(EVENT.abilitiesUnlocked, { ids: granted });
      GameEvents.emit(EVENT.abilitiesChanged);
    }

    // ⚠ **Oba efekty pod `playAccent`, bo awans przychodzi TAKŻE Z PAUZY** —
    // oddanie zadania u NPC-a. Ogłoszenia wyżej zostają poza bramką: to jest
    // stan, nie ozdoba, i musi dojść niezależnie od tego, co widać.
    const gracz = this.player;
    this.playAccent(() => {
      expandingRing(this, {
        x: gracz.x,
        y: gracz.y,
        radius: 10,
        color: 0xffe680,
        alpha: 0.55,
        scale: 4,
        duration: 600,
        depth: DEPTH.entities + gracz.y - 1,
      });
      this.cameras.main.flash(160, 255, 230, 128);
    });
  }

  /**
   * **Efekt AKCENTUJĄCY — odegraj teraz albo porzuć.** Jedyna droga, którą
   * wolno odpalić efekt czasowy tej sceny ze zdarzenia przychodzącego
   * Z ZEWNĄTRZ jej pętli (`GameEvents`, przycisk panelu, rozmowa z NPC).
   *
   * ── Dlaczego to musi istnieć ──────────────────────────────────────────
   * Panel UI pauzuje `GameScene` (`PanelBase.pauseGame`), a scena zapauzowana
   * w Phaserze **dalej się RYSUJE, tylko nie dostaje `UPDATE`**:
   *
   * ```
   * SceneManager.update():  step()   tylko dla status > START && <= RUNNING   → PAUSED wypada
   * SceneManager.render():  render() dla visible && status >= LOADING && < SLEEPING → PAUSED RYSUJE
   * CameraManager.update    jest podpięty pod SceneEvents.UPDATE               → nie leci
   * ```
   *
   * Skutek zmierzony w grze: `cameras.main.flash()` odpalony w czasie pauzy
   * zatrzymuje się na **pełnej alfie** i zalewa ekran, dopóki gracz nie zamknie
   * panelu (zgłoszone jako „żółte tło po awansie w oknie dialogowym"). Tak samo
   * zamarza każdy tween sceny — `expandingRing` zostaje wtedy w pierwszej
   * klatce. To NIE jest usterka koloru ani jednego efektu: to jest własność
   * pauzy, więc dotyczy każdego przyszłego efektu odpalonego tą drogą.
   *
   * ── Dlaczego PORZUCA, a nie odkłada do wznowienia ─────────────────────
   * ⚠ Akcent opisuje **chwilę**, a odłożony akcent opisuje chwilę, która już
   * minęła — błysk po zamknięciu dialogu czyta się jak nowe zdarzenie, którego
   * nic nie wywołało. Informacja i tak dochodzi w całości: dźwięk awansu,
   * baner HUD-u i baner nowych umiejętności żyją w `UIScene`, której **nikt nie
   * pauzuje**. Porzucany jest wyłącznie akcent świata, którego gracz w tej
   * chwili i tak nie ogląda.
   *
   * ⚠ **To NIE jest miejsce na efekt, który MUSI się wydarzyć.** Przejścia
   * portalem (`fadeOut` + `FADE_OUT_COMPLETE`) nigdy tu nie trafią i trafić nie
   * mogą — porzucone zostawiłyby gracza na czarnym ekranie albo w połowie
   * przejścia. Wolno im startować bez bramki, bo idą z `update()`, czyli
   * z pętli, która przy pauzie w ogóle nie biegnie.
   */
  private playAccent(run: () => void): void {
    if (!this.scene.isActive()) {
      // Cichy `return` z akcentu jest poprawny, ale niewidoczny — a to jest
      // dokładnie ta klasa błędu, którą ta metoda naprawia.
      if (import.meta.env.DEV) {
        console.debug("[GameScene] akcent pominięty — scena jest zapauzowana (panel UI).");
      }
      return;
    }
    run();
  }

  /** A quick expanding halo so the resurrection reads as an event. */
  private spawnRespawnFx(x: number, y: number): void {
    expandingRing(this, {
      x,
      y,
      radius: 14,
      color: 0xaaddff,
      alpha: 0.5,
      scale: 3,
      duration: 450,
      depth: DEPTH.entities + y + 100,
    });
  }

  update(_time: number, delta: number): void {
    if (!this.player) return;

    // Cheap per-frame write, same cost class as Vitals.hp — read by the
    // PlayerPanel "Mapa" tab, which opens long after any single frame.
    WorldState.playerX = this.player.x;
    WorldState.playerY = this.player.y;
    // `zwrotKat` ma 0 = w dół (wektor `(sin, cos)`), minimapa liczy w konwencji
    // ekranu — przeliczenie tu, żeby UI nie musiało znać konwencji gracza.
    const z = this.player.zwrotKat;
    WorldState.playerHeading = Math.atan2(Math.cos(z), Math.sin(z));
    if (++this.klatkaObszaru % 15 === 0) this.sledzObszar(false);
    // Odkrywanie terenu (mgła na mapie) — liczy coś dopiero przy zmianie
    // komórki, więc tani co klatkę. Pamięć działa także bez Kartografii.
    const reg = WorldState.region;
    if (reg) Exploration.visit(reg.id, this.player.x - reg.x, this.player.y - reg.y, reg.w, reg.h);
    else if (this.mapId !== SWIAT.id) Exploration.visit(this.mapId, this.player.x, this.player.y, WorldState.widthPx, WorldState.heightPx);
    this.trzymajKadrPozaPustka();

    // Playtime for the save-slot cards. Deliberately here and not in UIScene:
    // this scene is paused by every panel, so time spent in menus doesn't count.
    Session.tick(delta);

    // Movement from shared input state (joystick or keyboard).
    this.player.handleMovement(InputState.move, delta, InputState.sprintHeld);

    // Passive out-of-combat healing. Self-gating on the five-second rule, so
    // it costs nothing to call every frame.
    this.player.regenerate(delta);
    // ⚠ Stamina regeneruje się CIĄGLE, także w walce — świadomie inaczej niż
    // HP, które ma regułę pięciu sekund. Uzasadnienie i pomiar:
    // `docs/systemy/stamina.md` Sam `tick` dławi swoje zdarzenie, więc
    // wołanie co klatkę nie zasypuje HUD-u.
    // ⚠ Trzeci argument to **kanał WYDOLNOŚCI Modelu D** (`OI-103`): masa
    // bezwzględna spowalnia odrabianie sił. Podaje go scena, bo `Stamina`
    // świadomie nie importuje `Equipment` — ta sama droga, którą jedzie
    // `loadMultiplier` przy wydatkach.
    Stamina.tick(delta, this.time.now, Equipment.regenMultiplier);
    // ⚠ **JEDNO wywołanie na wszystkie efekty czasowe** (2026-09-03). Stały
    // tu trzy osobne `update*`, po jednym na efekt — czyli scena musiała
    // wiedzieć, ile efektów istnieje. Odliczanie, tiki i wygaszanie prowadzi
    // dziś `core/combat/StatusEffects.ts`; buff obrażeń, spowolnienie i jad dalej
    // biegną W TRAKCIE walki, bo nie przechodzą przez `regenerate()`.
    this.player.updateEffects(delta);

    // "W walce" visual stance (today: shield-carry pose in Character3D) —
    // reuses the SAME aggro/chase state that already drives targeting and
    // re-focus (`isChasing`, see `refocusReachableAttacker`), rather than a
    // second, independent timer approximating the same thing. One enemy
    // actively coming for the player is enough; a patrolling/fleeing one
    // does not count, same distinction `isChasing` already draws.
    this.player.wWalce = this.enemies.getChildren().some((obj) => {
      const e = obj as Enemy;
      return !e.isDead && e.active && e.isChasing;
    });

    // Drop the target before it's used below if it died/vanished since last
    // frame — resolveAttack() must never swing at a reference that's already
    // gone.
    this.clearTargetIfInvalid();
    this.repositionTargetMarker();

    // Szarża steruje ciałem PRZED bramkami ataku niżej, więc klatka, w której
    // gracz dobiegł, jest tą samą klatką, w której pada cios.
    this.stepRush();

    // ── Naciśnięcie ataku: NAJPIERW sfokusuj, dopiero potem uzbrój ─────────
    //
    // ⚠ Kolejność jest tu nośna i jej odwrócenie było realnym błędem. Fokus
    // siedział wcześniej w `resolveAttack`, czyli ZA sprawdzeniem `hasTarget`:
    // na klatce naciśnięcia celu jeszcze nie było, więc autoatak się nie
    // uzbrajał, a na następnej klatce nie było już zbocza narastającego.
    // Efekt: jeden zamach i cisza, dopóki gracz nie puścił i nie nacisnął
    // ponownie.
    //
    // Fokus dzieje się WYŁĄCZNIE na zboczu — „kliknięcie fokusuje", a nie
    // „trzymanie zasysa wszystko, co wejdzie w zasięg".
    const pressed = InputState.attackHeld && !this.prevAttackHeld;
    if (pressed) {
      if (!this.currentTarget || this.currentTarget.isDead) this.focusNearestInReach();
      // ⚠ **Cel poza zasięgiem → naciśnięcie ataku PRZEŁĄCZA na tego, kogo
      // dosięgasz.** Zgłoszone z rozgrywki (wataha wilków, kotlina królików):
      // gdy sfokusowany wróg odejdzie, przycisk ataku przestaje cokolwiek
      // robić, a jedynym wyjściem jest trafienie palcem w innego wroga —
      // w kilkuosobowej walce, na telefonie, w ruchu.
      //
      // To jest domknięcie reguły, którą `focusNearestInReach` już zapisuje:
      // próg fokusu i próg ciosu mają być JEDNĄ liczbą, żeby nie istniał stan
      // „sfokusowany, ale nie do trafienia, bez wyjaśnienia". Dotąd pilnowano
      // tego tylko przy WYBORZE celu; cel, który sam wyszedł z zasięgu,
      // wpadał w ten stan i zostawał w nim.
      else if (!this.targetInReach(this.currentTarget, this.currentStrike().reach, this.currentStrike().minReach)) {
        // ⚠ Nie ma na kogo przełączyć → powiedz DLACZEGO nic się nie stało.
        // Autoatak jest w tym momencie uzbrojony i wystrzeli sam, gdy gracz
        // podejdzie — ale to widać dopiero po podejściu, a naciśnięcie tu
        // i teraz nie robi nic widocznego. Ta sama reguła, dla której istnieje
        // „Brak celu": cisza po naciśnięciu jest na dotyku nieodróżnialna od
        // zepsutego przycisku.
        //
        // ⚠ **Milczy w trakcie Szarży, i to nie jest kosmetyka.** Szarża
        // właśnie NIESIE gracza do tego celu, więc „Za daleko" kazałoby mu
        // zrobić rzecz, którą gra robi za niego w tej samej sekundzie —
        // komunikat fałszywy, nie tylko zbędny.
        if (!this.refocusReachableAttacker() && !this.pendingRush) {
          this.announceAttackRefusal("Za daleko");
        }
      }
      // ⚠ **W zasięgu, ale za plecami — powiedz DLACZEGO.** Ta sama reguła, co
      // przy „Za daleko" i „Brak celu": cisza po naciśnięciu jest na dotyku
      // nieodróżnialna od zepsutego przycisku, a tutaj byłaby najgorsza z
      // trzech, bo wróg STOI W ZASIĘGU i wszystko wygląda poprawnie.
      //
      // ⚠ Celowo NIE przełącza celu (w przeciwieństwie do „Za daleko"). Cel za
      // plecami zostaje zaznaczony — decyzja rundy: gracz ma się OBRÓCIĆ, a
      // nie dostać podmieniony cel pod palcami.
      //
      // Wyłącznie na zboczu naciśnięcia. Uzbrojony autoatak próbuje co klatkę,
      // więc w pętli `update` ten komunikat byłby ciągłym paskiem tekstu.
      else if (!this.canStrikeFacing(this.currentTarget)) {
        this.announceAttackRefusal("Odwróć się");
      }
      /* ⚠⚠ **CZWARTA ODMOWA: „idziesz" — dopisana 2026-09-11, bo była JEDYNĄ
         cichą bramką ataku, jaka została.**

         `resolveAttack` wychodzi na `player.isMoving` (ruch wyklucza atak —
         model Wild Rift, `docs/systemy/combat.md` §1.1) i do tej daty robił to
         **bez słowa**. Trzy bramki obok mówią, o co chodzi; ta nie mówiła nic,
         choć wpada się w nią NAJCZĘŚCIEJ ze wszystkich: na telefonie kciuk leży
         na drążku przez większość walki, a naturalny odruch to „dogoń i tapnij".

         ⚠ **Po dodaniu stanów pierścienia celu cisza przestała być tylko
         brakiem — stała się SPRZECZNOŚCIĄ.** Pierścień świeci wtedy „gotowe"
         (cel w zasięgu, zwrot dobry), czyli interfejs obiecuje cios, którego
         nie ma. Z trzech możliwych powodów „nic się nie stało" dwa mają dziś
         ciągły sygnał na ekranie, a ten trzeci nie miał żadnego.

         ⚠ **To NIE rozmiękcza reguły** — zamach dalej nie startuje w marszu
         i nie ma tu żadnej zmiany rozstrzygania. Gracz, który puści drążek,
         uderzy sam z siebie w następnej klatce (autoatak zostaje uzbrojony
         wyżej), więc komunikat mówi dokładnie to, co trzeba zrobić.

         ⚠ **Milczy w trakcie Szarży/Wypadu** — z tego samego powodu, z którego
         milczy „Za daleko": lot NIESIE ciało gracza, więc „zatrzymaj się"
         kazałoby mu przerwać rzecz, którą gra właśnie dla niego robi.
         ⚠ **Milczy też, gdy cios JEST w locie** (`pendingSwing`): wtedy na
         ekranie dzieje się zamach, a prawdziwym powodem, dla którego następny
         nie startuje, jest jeden slot ciosu, nie ruch. Fałszywy powód jest
         gorszy niż brak powodu.

         ⚠ **Znany, świadomy zakres: to jest `else if` w łańcuchu**, więc
         naciśnięcie, które WŁAŚNIE zdobyło cel (pierwsza gałąź,
         `focusNearestInReach`), zostaje ciche. Tam feedbackiem jest pojawienie
         się pierścienia — coś się stało i widać to; kolejne naciśnięcie wpada
         już tutaj. Wyciąganie tego przed łańcuch wymagałoby powtórzenia testów
         zasięgu i zwrotu, czyli drugiego miejsca liczącego to samo. */
      else if (this.player.isMoving && !this.pendingRush && !this.pendingSwing) {
        this.announceAttackRefusal("Zatrzymaj się");
      }
    }
    const hasTarget = !!this.currentTarget && !this.currentTarget.isDead;
    if (pressed && hasTarget) this.autoAttackArmed = true;
    // ⚠ Nikogo w zasięgu — powiedz to. Podstawowy atak jest wyłącznie
    // jednocelowy, więc bez celu nie dzieje się DOSŁOWNIE nic: brak animacji,
    // brak dźwięku, brak cooldownu. Cisza jest tu na dotyku nieodróżnialna od
    // zepsutego przycisku — ta sama reguła, którą panel stosuje przy każdej
    // odmowie upuszczenia. Komunikat mówi też, co zrobić: podejść.
    if (pressed && !hasTarget) this.announceAttackRefusal("Brak celu");
    this.prevAttackHeld = InputState.attackHeld;

    // Land any swing whose moment has come, BEFORE a new one can be started
    // below — a swing must always finish resolving before its successor
    // commits, or two could briefly be in flight at once.
    this.resolvePendingSwing();

    // Podgląd celowania — co klatkę, bo gracz w jego trakcie CHODZI: klin
    // musi jechać za postacią, a lista trafionych zmieniać się na żywo.
    // No-op, gdy nikt nie celuje (jeden odczyt pola).
    this.updateAimPreview();

    // Uzbrojony: próbuj co klatkę, niezależnie od stanu przycisku. Własny
    // cooldown i bramka zasięgu w `resolveAttack` rozkładają zamachy w czasie
    // i po cichu je wstrzymują poza zasięgiem — patrz `targetInReach`.
    //
    // ⚠ Nie ma już drugiej gałęzi „bez celu, trzymany przycisk". Zamach po łuku
    // bez celu przeniósł się do umiejętności „Szerokie cięcie", więc bez celu
    // podstawowy atak nie ma czego robić.
    if (hasTarget && this.autoAttackArmed) this.resolveAttack();

    // Enemy AI.
    const now = this.time.now;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.isDead) return;
      // ── Efekty czasowe wroga (2026-09-04, Krwawienie) ───────────────────
      // ⚠ **PRZED `updateAI` i POZA jego bramkami** — patrz `Enemy.updateEffects`:
      // `updateAI` pomija całą gałąź AI przy ogłuszeniu i odrzucie, a ogłuszony
      // ma dalej krwawić. Ta sama para wywołań co po stronie gracza
      // (`player.updateEffects(delta)` wyżej + reszta pętli).
      //
      // ⚠ **`delta`, nie `now`** — warstwa efektów przyjmuje przyrost czasu,
      // jak `Stamina.tick`. `updateAI` dostaje `now`, bo odmierza terminy.
      //
      // ⚠ **Zwrot znaczy „tik ZABIŁ" i księgowość należy TUTAJ** — dokładnie
      // tak, jak przy `takeDamage` w `damageMatchingEnemies`. `Enemy.die()`
      // nie przyznaje XP, łupu ani odrodzenia; robi to `creditKill`.
      if (e.updateEffects(delta)) {
        this.creditKill(e);
        return;
      }
      // ⭐ Sen daleko od gracza (`AKTYWNOSC_STWORZEN`): bez AI i bez ruchu.
      //   Prędkość zerowana wprost — poza gałęzią AI, jak przy ogłuszeniu.
      if (!e.isChasing && Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) > AKTYWNOSC_STWORZEN.promienPx) {
        (e.body as Phaser.Physics.Arcade.Body | null)?.setVelocity(0, 0);
        return;
      }
      e.updateAI(this.player, now);
    });

    // Ambient livestock — no AI to speak of, just its own wander/peck timer.
    for (const animal of this.farmAnimals) animal.update(now);
    this.questSpots?.update(now);

    // Render culling — visibility only, every frame. See `core/RenderCuller.ts`
    // for why this never touches depth, collision, AI, or list membership.
    this.renderCuller.update(this.cameras.main, CAMERA.cullMarginFactor);

    // Obrys zasłoniętego gracza — czysta prezentacja, po ruchu i po cullingu.
    // ⚠ Bez pamięci stanu: zapala się i gaśnie wyłącznie z bieżącej klatki,
    // więc wyjście zza drzewa gasi go natychmiast. Patrz `core/PlayerSilhouette.ts`.
    this.playerSilhouette.update(this.player, this);

    this.updateNearbyInteractable();
    this.updateHerbGlow();

    // Portals: walk-through, not an interact prompt — a gate is geography,
    // not an NPC. Guarded on `transitioning` so the ~150ms fade-out (during
    // which the player is still standing in the trigger radius, update()
    // still ticking) can't queue a second restart.
    if (!this.transitioning && !this.player.isDead) {
      for (const portal of this.portals) {
        const d = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          portal.pos.x,
          portal.pos.y,
        );
        if (d <= PORTAL.triggerRadius) {
          this.onPortalReached(portal);
          break;
        }
      }
    }
  }

  /**
   * The single proximity pass: **the nearest in-range interactable wins**, and
   * the change is announced once rather than every frame.
   *
   * This replaced one loop per kind (NPCs, then campfires), each with its own
   * event and its own listener binding `keydown-E`. Two things follow, and both
   * are the point of the exercise:
   *
   *  • **Overlap is no longer a correctness problem.** It used to be prevented
   *    only by placing the campfire further from the Hunter than their two
   *    interact ranges combined — a pairwise guarantee that has to be re-checked
   *    for every new kind on every map, and whose failure is silent. Now two
   *    things standing too close is at worst cosmetic: one of them wins.
   *  • **Adding a kind is adding to a list.** Herb nodes register the same way
   *    an NPC does and need no new loop, no new event and no new key handler.
   *
   * Keeping the *object* rather than a flag is deliberate: `requestInteraction`
   * needs the actual NPC/fire/plant to act on, and `describeInteractable`
   * needs it to word the label (the NPC's name, the herb's species, the
   * fire's recipe count).
   */
  private updateNearbyInteractable(): void {
    let best: Interactable | null = null;
    let bestDist = Infinity;
    // A corpse interacts with nothing. Checked once here instead of in every
    // listener, which is where it used to live (and be forgotten).
    if (!this.player.isDead) {
      for (const it of this.interactables) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
        if (d <= it.interactRange && d < bestDist) {
          best = it;
          bestDist = d;
        }
      }
    }

    // Emit only when the *identity* changes — walking from the Kowal to Dorota
    // is a change, standing still is not. Comparing kind+key rather than the
    // object itself is what lets a herb node be swapped for an identical one
    // (see NodeSpawner) without flickering the button.
    const changed =
      best?.interactKind !== this.nearby?.interactKind ||
      best?.interactKey !== this.nearby?.interactKey;
    this.nearby = best;
    if (changed) this.emitNearbyInteractable();
  }

  /**
   * The broader-radius "resource glow" pass (`GATHER.nearPlayerRadius`) —
   * deliberately separate from `updateNearbyInteractable` above, which tracks
   * the SINGLE nearest interactable within its own tight `interactRange` for
   * the ContextAction prompt. This one can and does light up several herbs at
   * once (a cluster), and its radius has nothing to do with what `E` reaches.
   *
   * A corpse gets no glow either, same reasoning as the interact prompt.
   */
  private updateHerbGlow(): void {
    const dead = this.player.isDead;
    for (const it of this.interactables) {
      if (it.interactKind !== "gather") continue;
      const near = !dead && Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y) <= GATHER.nearPlayerRadius;
      (it as Gatherable).setNearPlayer(near);
    }
  }

  /**
   * Word and emit the ContextAction button's content for whatever `nearby`
   * currently is. Split from `updateNearbyInteractable` because IDENTITY
   * (kind+key) and DESCRIPTION (label+enabled) change on different triggers:
   * identity changes only by walking, but the campfire's label also depends
   * on skill/inventory state that can change while standing still (cooking
   * one unit, or learning the skill mid-conversation) — see
   * `onCampfireContextRefresh`.
   */
  private emitNearbyInteractable(): void {
    const desc = this.nearby ? this.describeInteractable(this.nearby) : null;
    GameEvents.emit(EVENT.interactableNearby, {
      kind: this.nearby?.interactKind ?? null,
      key: this.nearby?.interactKey ?? null,
      label: desc?.label ?? "",
      enabled: desc?.enabled ?? false,
    });
  }

  /**
   * What the ContextAction button should say for `it`, and whether pressing
   * it would actually do anything right now. The ONLY place that decides
   * this wording — `ContextAction` just displays it, per the rule that no UI
   * widget re-derives what a kind means (see `requestInteraction`).
   *
   * ⚠ The label names the OBJECT, never the verb — `ContextAction`'s icon
   * already carries the verb (💬/🔥/✋), so "Hanna" reads correctly next to a
   * speech-bubble glyph without also saying "Rozmawiaj". Naming both said the
   * same thing twice and only made the label longer.
   *
   * ⚠ A disabled campfire is still shown, greyed out, WITH THE REASON
   * ("wymaga: …", "brak: …") rather than hidden — a control that silently
   * does nothing on tap is indistinguishable from a bug (`src/ui/CLAUDE.md`).
   * That reason is state about the fire, not a verb, so it stays even though
   * the ready-state label is just its name. Gather and NPC have no failure
   * state worth telegraphing here: a full backpack is checked (and
   * explained) only at the moment of picking, and talking never fails.
   */
  private describeInteractable(it: Interactable): { label: string; enabled: boolean } {
    switch (it.interactKind) {
      case "npc":
        return { label: NPCS[it.interactKey as NpcId].name, enabled: true };
      case "gather":
        return { label: HERBS[it.interactKey as HerbId].name, enabled: true };
      case "campfire": {
        const raw = CAMPFIRE.recipe.from as ItemId;
        if (!Skills.has(CAMPFIRE.requiresSkill)) {
          return {
            label: `${CAMPFIRE.name} — wymaga: ${getSkill(CAMPFIRE.requiresSkill).name}`,
            enabled: false,
          };
        }
        if (Inventory.countItem(raw) === 0) {
          return { label: `${CAMPFIRE.name} — brak: ${getItem(raw).name}`, enabled: false };
        }
        return { label: CAMPFIRE.name, enabled: true };
      }
    }
  }

  /** ContextAction activated — the button, or the centralized `E` key (both
   *  fire the same event, see EventBus). Resolves against `nearby` rather
   *  than carrying a payload, so it can never activate anything other than
   *  what the button is currently showing. */
  private onContextActionRequested(): void {
    if (this.nearby) this.requestInteraction(this.nearby);
  }

  /** Re-word the button without moving — see emitNearbyInteractable. A no-op
   *  unless the player is standing at the one kind whose label can go stale
   *  on its own (the campfire's skill/stock line). */
  private onCampfireContextRefresh(): void {
    if (this.nearby?.interactKind === "campfire") this.emitNearbyInteractable();
  }

  /** Add something the player can press `E` on — or tap. Registration order
   *  breaks ties at exactly equal distance, which is the only case
   *  `updateNearbyInteractable` cannot decide on distance alone. */
  addInteractable(it: Interactable): void {
    this.interactables.push(it);
    // Tap-to-interact is wired HERE, in the one funnel every kind already goes
    // through, so "adding a kind is adding to a list" keeps holding — a new
    // interactable gets the tap for free, exactly as it gets the `E` prompt.
    // The cast is the entity's own responsibility: it must have called
    // setInteractive() to be tappable at all; one that hasn't simply never
    // emits, which is a no-op rather than a fault.
    const target = it;
    if (it instanceof Phaser.GameObjects.GameObject) {
      it.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.requestInteraction(target));
    }
  }

  /**
   * Take something off the list — a picked plant. Also clears `nearby` if it
   * was the winner, and re-runs the pass so the prompt updates in the SAME
   * frame rather than one later: picking a herb while standing on it must not
   * leave "E — Zbierz" on screen over bare grass, even for a frame.
   */
  removeInteractable(it: Interactable): void {
    const i = this.interactables.indexOf(it);
    if (i >= 0) this.interactables.splice(i, 1);
    // ⚠ Kill the tap the moment it leaves the list, not on destroy. A picked
    // plant is unregistered FIRST and only then fades out over ~300ms, so it is
    // still on screen and still hit-testable during that fade — a second tap
    // would run gatherFrom() again and hand out a second herb for one plant.
    // The `E` path never had this hole: it resolves through `nearby`, which
    // this same call has already taken the plant out of.
    if (it instanceof Phaser.GameObjects.GameObject && it.input) it.disableInteractive();
    if (this.nearby !== it) return;

    // Re-run the pass immediately so the prompt updates in the SAME frame:
    // picking a herb while standing on it must not leave "E — Zbierz" on
    // screen over bare grass.
    //
    // ⚠ Do NOT null `nearby` first, however tempting. `updateNearbyInteractable`
    // announces a change by comparing the new winner against `nearby`, so
    // clearing it beforehand makes "nothing here now" compare equal to
    // "nothing here before" — no event, and the prompt stays up **forever**,
    // until the player happens to walk into something else. Caught in-engine,
    // not by reading: gathering worked, the item arrived, and the bar just sat
    // there. Leaving the picked plant in place for one comparison is what makes
    // the transition visible; it is also what correctly keeps the prompt up
    // when another plant of the SAME species is still in range.
    this.updateNearbyInteractable();
  }

  /**
   * Draw the entrance marker on every portal this map authored.
   *
   * ⚠ **Derived from the portal objects, never painted into the map**, and
   * that is the whole design (see `PORTAL.marker`): a transition cannot exist
   * without its `portal` object, so a marker built from that object cannot be
   * forgotten. Painting a tile instead would mean every future door and cave
   * mouth is two jobs, one of which is silent when skipped.
   *
   * Depth sits ABOVE the terrain and BELOW everything alive, so the player
   * walks over the marker rather than behind it. `create()` re-runs on every
   * portal crossing, so these are made fresh each time and nothing has to be
   * torn down by hand — the scene's display list goes with the restart.
   */
  private addPortalMarkers(): void {
    const m = PORTAL.marker;
    for (const portal of this.portals) {
      const marker = this.add
        .image(portal.pos.x, portal.pos.y, ASSETS.portalMarker.textureKey)
        .setAlpha(m.alpha)
        .setDepth(DEPTH.overlay + 5)
        // Flattened on Y: it lies on the ground, in the same projection as
        // everything else here, rather than standing up facing the camera.
        .setScale(1, 0.72)
        .setAngle({ up: 0, right: 90, down: 180, left: 270 }[portal.dir]);
      // The breath is what separates an affordance from a stain on the grass —
      // the same reason loot bobs and the target ring exists at all.
      this.tweens.add({
        targets: marker,
        alpha: m.pulseAlpha,
        duration: m.pulseMs,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  /** Prostokąty pustki otwartego świata (px); pusta lista poza światem. */
  private pustkiSwiata: Prost[] = [];

  /**
   * ⭐ Kadr omija pustkę świata (2026-10-12). Liczy prostokąt widoku, w którym
   * kamera stanęłaby na graczu, i — jeśli zachodzi na pustkę — przesuwa cel
   * kamery najkrótszą drogą (`followOffset`, dojazd kamery wygładza zmianę).
   * Bez tego przy wschodnim skraju wsi prawa część kadru była czarna.
   * Woła się w `update`, czyli przed przeliczeniem kamery w tej klatce.
   */
  private trzymajKadrPozaPustka(): void {
    if (!this.pustkiSwiata.length) return;
    const cam = this.cameras.main;
    const b = this.physics.world.bounds;
    const hw = Math.min(cam.width / cam.zoomX / 2, b.width / 2);
    const hh = Math.min(cam.height / cam.zoomY / 2, b.height / 2);
    const cx = Phaser.Math.Clamp(this.player.x, b.x + hw, b.right - hw);
    const cy = Phaser.Math.Clamp(this.player.y, b.y + hh, b.bottom - hh);
    // ⚠ Zapas: dojazd kamery (lerp 0,12 + `roundPixels`) staje do ~8 px PRZED
    //   celem (krok < pół piksela ekranu zaokrągla się do zera; w pionie piksel
    //   ekranu to ~1,9 px świata), a w marszu wlecze się za graczem — przy
    //   ukośnym przejściu przez narożnik wieś↔las do ~19 px w stronę pustki
    //   (zmierzone 2026-10-12, ~160 px/s, ~30 kl./s). 40 px pokrywa oba.
    const zapas = 40;
    const { dx, dy } = przesuniecieOdPustki(
      { x: cx - hw - zapas, y: cy - hh - zapas, w: (hw + zapas) * 2, h: (hh + zapas) * 2 },
      this.pustkiSwiata,
      // Świat też o zapas szerszy — inaczej przy krawędzi świata powiększony
      // kadr już na starcie „wystaje" i żaden kierunek nie przechodzi filtra.
      { x: b.x - zapas, y: b.y - zapas, w: b.width + zapas * 2, h: b.height + zapas * 2 },
    );
    // `followOffset` jest ODEJMOWANY od celu — przesunięcie środka w prawo to offset ujemny.
    cam.setFollowOffset(-dx, -dy);
  }

  /** Otwarty świat: id obszaru pod graczem przy ostatnim sprawdzeniu. */
  private obszarId: string | null = null;
  private klatkaObszaru = 0;

  /**
   * ⭐ Obszar świata pod graczem (wieś / las): przy zmianie — dźwięk tła tego
   * obszaru i `WorldState.region` (minimapa). Na mapie pojedynczej nic nie robi.
   */
  private sledzObszar(start: boolean): void {
    if (this.mapId !== SWIAT.id) { WorldState.region = null; return; }
    const r = regionAt(SWIAT.key, this.player.x, this.player.y);
    if (!r || r.id === this.obszarId) return;
    this.obszarId = r.id;
    WorldState.region = { id: r.id, x: r.x, y: r.y, w: r.w, h: r.h };
    const amb = (MAP_BY_ID[r.id] ?? MAPS.forest).ambientKey as SfxKey;
    Sfx.startAmbient(amb);
    void start;
  }

  /** Fade out, then hand off to the target map at the authored arrival point.
   *  Carries current HP across so a portal relocates rather than heals (see
   *  `pendingHp`'s note) — Progression/Inventory/etc. need no such carrying,
   *  since they're persistent singletons `create()` never resets. */
  private onPortalReached(portal: PortalSpawn): void {
    this.transitioning = true;
    const hp = this.player.hp;
    this.cameras.main.fadeOut(PORTAL.fadeMs);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        mapId: portal.target,
        spawn: { x: portal.spawnX, y: portal.spawnY },
        hp,
        // Stan postaci przechodzi razem z nią — patrz POLITYKA GRANICY
        // w `create()`. To jedyne miejsce, ktore to pole podaje.
        condition: this.player.captureCondition(),
      });
    });
  }

  /**
   * Roast one unit of meat at THIS fire — reached through `requestInteraction`,
   * either via a direct tap on the fire or via `nearby` (ContextAction / `E`).
   * Guarded on all three preconditions rather than trusting the caller, which
   * can go stale (you can walk away, or sell your last meat from the shop,
   * between the button appearing and the tap landing).
   */
  private cookAt(fire: Campfire): void {
    if (!this.player || this.player.isDead) return;
    if (!Skills.has(CAMPFIRE.requiresSkill)) return;

    const from = CAMPFIRE.recipe.from as ItemId;
    const to = CAMPFIRE.recipe.to as ItemId;
    if (Inventory.countItem(from) < 1) return;
    // Check there's room BEFORE consuming, or a full backpack would eat the
    // raw meat and hand back nothing.
    if (!Inventory.removeItem(from, 1)) return;
    if (Inventory.addItem(to, 1) > 0) {
      Inventory.addItem(from, 1); // no room — put the raw meat back
      floatingText(this, {
        x: fire.x,
        y: fire.y - 18,
        text: "Plecak pełny",
        color: "#ff9d3b",
        depth: DEPTH.entities + fire.y + 200,
      });
      return;
    }

    floatingText(this, {
      x: fire.x,
      y: fire.y - 18,
      text: `+1 ${getItem(to).name}`,
      color: "#ffcc66",
      rise: 20,
      duration: 750,
      depth: DEPTH.entities + fire.y + 200,
    });
    expandingRing(this, {
      x: fire.x,
      y: fire.y + 4,
      radius: 10,
      color: 0xf5a623,
      alpha: 0.55,
      scale: 2,
      duration: 300,
      depth: DEPTH.entities + fire.y - 1,
    });
  }

  /**
   * Pick THIS plant — reached through `requestInteraction`, either via a
   * direct tap on the plant or via `nearby` (ContextAction / `E`).
   *
   * Taking the plant as an argument rather than reading `nearby` is what makes
   * tap-to-pick honest: stanowiska are hand-placed by the dozen and two can
   * easily be in range at once, so resolving "nearest" here would quietly pick
   * a different plant than the one under the finger.
   *
   * A full backpack **refuses and says so** rather than destroying the plant —
   * a stanowisko silently emptied for nothing would be the worst possible
   * outcome of a mistimed tap, and it is exactly the failure `cookAt` already
   * guards against with the raw meat.
   */
  private gatherFrom(plant: Gatherable): void {
    if (!this.player || this.player.isDead) return;

    const itemId = plant.herb as ItemId;
    if (Inventory.addItem(itemId, 1) > 0) {
      floatingText(this, {
        x: plant.x,
        y: plant.y - 24,
        text: "Plecak pełny",
        color: "#ff9d3b",
        depth: DEPTH.entities + plant.y + 200,
      });
      return;
    }

    // Frees the stanowisko and unregisters the interactable BEFORE the collect
    // tween runs, so a plant mid-fade can never be picked twice.
    const owner = this.gatherers.find((g) => g.herb === plant.herb);
    owner?.collect(plant);

    Sfx.play("loot");
    floatingText(this, {
      x: plant.x,
      y: plant.y - 24,
      text: `+1 ${HERBS[plant.herb].name}`,
      color: "#a8e8c0",
      rise: 20,
      duration: 800,
      depth: DEPTH.entities + plant.y + 200,
    });

    /**
     * First pick of this species unlocks Dorota's topic about it
     * (`Topic.requiresHerb`) — teaching lives entirely in her dialogue
     * (siedlisko + real-world use), not in the pickup itself. Gathering stays
     * a plain "+1 item"; you have to have found the plant in the field before
     * she'll talk about it, but she is the one who talks.
     */
    Gathering.discover(plant.herb);
  }

  /**
   * Spend one swing's worth of the equipped weapon's durability, and announce it
   * the one time it actually breaks.
   *
   * Breaking is called out loudly on purpose: the weapon does not disappear, it
   * quietly starts hitting for a fraction of its damage, and a silent halving of
   * the player's output would read as the game being broken rather than the
   * sword. "Zniszczona" is a state — the item keeps its workmanship and can be
   * repaired once there is anyone to repair it.
   */
  private wearWeapon(slot: "weapon" | "offhand" = "weapon"): void {
    if (!Equipment.wearWeapon(slot)) return;
    const id = slot === "offhand" ? Equipment.offhandWeapon?.itemId : Equipment.weaponId;
    const name = id ? getItem(id).name : "Broń";
    floatingText(this, {
      x: this.player.x,
      y: this.player.y - 28,
      text: `${name} — zniszczona!`,
      color: "#ff6b6b",
      depth: DEPTH.entities + this.player.y + 20,
    });
    this.cameras.main.shake(90, 0.004);
  }

  /**
   * **Zużycie tarczy po celnym Uderzeniu tarczą** (`S10`, 2026-09-15).
   *
   * ⚠ **Bliźniak `wearWeapon`, celowo osobna metoda, a nie jego parametr** —
   * ta sama decyzja, którą `Equipment.wearShield` podjęło po swojej stronie.
   * Rzut, stawka i próg są wspólne (`EQUIPMENT.durability`); różni się tylko
   * to, CO się zużywa i kiedy (trafienie, nie zamach).
   *
   * ⚠ Rozbicie ogłaszane głośno z tego samego powodu co przy broni: tarcza nie
   * znika, tylko **po cichu blokuje o połowę słabiej** (`destroyedMultiplier`
   * wszedł do `blockSpec` w `T-5`), a ciche o połowę gorsze blokowanie czyta
   * się jak zepsuta gra, nie jak zepsuta tarcza.
   */
  private wearShieldOnHit(): void {
    if (!Equipment.wearShield()) return;
    const id = Equipment.offhand?.itemId;
    const name = id ? getItem(id).name : "Tarcza";
    floatingText(this, {
      x: this.player.x,
      y: this.player.y - 28,
      text: `${name} — zniszczona!`,
      color: "#ff6b6b",
      depth: DEPTH.entities + this.player.y + 20,
    });
    this.cameras.main.shake(90, 0.004);
  }

  /**
   * Apply the player's melee hit — to the current target if one is selected
   * and alive, otherwise to everyone inside the attack hitbox (the original,
   * untargeted arc). See `currentTarget`'s comment for why the fallback
   * exists at all.
   */
  private resolveAttack(): void {
    // Moving means not attacking (the Wild Rift model): a swing roots the
    // player for its own duration, so allowing one to START mid-run would
    // stutter every retreat into a stop-go crawl — the exact complaint that
    // motivated this. Checked before canAttack() so a walking player burns
    // no cooldown; standing still resumes swinging on the next frame with no
    // button press, same as walking back into range does.
    //
    // Deliberately applies to the untargeted arc swing too, not just to
    // autoattack: half-applying it would leave a player who never taps a
    // target able to walk and swing, which is the case that tore the
    // animation in the first place.
    if (this.player.isMoving) return;
    // ⚠ **Zamach w locie nie może zostać NADPISANY.** `pendingSwing` to jeden
    // slot, a `resolvePendingSwing` biegnie wyżej w tej samej klatce, więc gdy
    // tu docieramy, wszystko wymagalne już wylądowało — zostaje wyłącznie cios
    // jeszcze NIEROZSTRZYGNIĘTY. Przy zwykłym autoataku to się nie zdarzało,
    // bo cooldown broni jest dłuższy niż pół zamachu; **Ciężkie uderzenie ma
    // celowo długi zamach i bez tej bramki autoatak zjadłby je po cichu** —
    // obrażenia nigdy by nie padły, a koszt i cooldown zostałyby zapłacone.
    if (this.pendingSwing) return;
    if (!this.player.canAttack(this.time.now)) return;

    const target = this.currentTarget;
    const targeted = !!target && !target.isDead;
    // Out-of-range gate for the targeted path, checked fresh on every
    // attempt (not just when the target was first selected) — so walking out
    // of reach mid-autoattack silently pauses it, and walking back in resumes
    // it on the very next call, with no need to press Attack again (see
    // autoAttackArmed in update()). This returns BEFORE triggerAttack(), so
    // an out-of-range attempt burns no cooldown, no animation, no weapon wear
    // — "nic się nie dzieje", not a whiff. Without this, canAttack()'s
    // cooldown gate alone would still let a distant target eat a full swing
    // every cooldown tick for zero effect.
    // Resolved BEFORE the range gate, so the gate uses the variant the player
    // is actually holding: a sword's Pchnięcie reaches 5px further than its
    // Cięcie, and the pre-swing test has to agree with the one at impact.
    // ⚠ **Naprzemienność jest JEDYNĄ zmianą w kadencji autoataku.** Model
    // pozostaje ten sam: jeden `pendingSwing`, jedna poza, jedno ukorzenienie.
    // Zmienia się wyłącznie to, CZYM ten jeden zamach jest wyprowadzony.
    const strike = this.nextStrike();
    // Nikogo w zasięgu — nie zaczynamy zamachu w ogóle. Ta sama zasada, którą
    // ten plik stosuje już do celu poza zasięgiem: **„nic się nie dzieje", a
    // nie pudło.** Bez celu nie ma czego trafić (łuk poszedł do „Szerokiego
    // cięcia"), więc animacja i rzut na zużycie byłyby kosztem za zero.
    if (!targeted) return;
    if (!this.targetInReach(target!, strike.reach, strike.minReach)) return;
    // ⚠ **Zwrot sprawdzany PRZED snapem, i to jest cała treść tej zmiany.**
    // Odwrotna kolejność unieważniłaby warunek, który assist ma ograniczać:
    // `aimAttackAt` sam ustawia postać na cel, więc puszczony pierwszy
    // odpowiadałby na pytanie „czy patrzę na cel" słowem „już tak".
    //
    // Cel poza półkulą **czeka** — zostaje zaznaczony, autoatak zostaje
    // uzbrojony i wystrzeli sam w klatce, w której gracz się odwróci. Ta sama
    // zasada, co przy celu poza zasięgiem: „nic się nie dzieje", nie pudło.
    if (!this.canStrikeFacing(target!)) return;
    // Aim BEFORE triggerAttack() reads attackRad for the swing pose, lunge
    // and FX ring. This sets the ATTACK direction only —
    // the player's walking direction is untouched, so a swing aimed north at
    // a target never turns someone who is running east.
    // Bez gałęzi „bez celu": powyżej wychodzimy, gdy celu nie ma, więc tu jest
    // zawsze. `aimAttackAlongMovement` obsługuje dziś wyłącznie Szerokie cięcie.
    // ⚠ W przestrzeni CIAŁ — patrz `bodyVectorTo`.
    const doCelu = this.bodyVectorTo(target!);
    this.player.aimAttackAt(doCelu.x, doCelu.y);

    const hit = this.player.triggerAttack(this.time.now, {
      // ⚠ Czas zamachu TEJ ręki — przy dwóch różnych broniach poza musi trwać
      // tyle, ile trwa cios, którym właśnie machamy.
      durationMs: strike.swingDurationMs,
      rootMs: Progression.rootDurationForSwing(strike.swingDurationMs),
      // ⚠ Bramka należy do ręki, która uderzyła — patrz `StrikeProfile.cooldownMs`.
      cooldownMs: strike.cooldownMs,
    });
    // ONE wear roll per swing, here — before we know or care how many enemies
    // it touched. The axe cuts 5 of 5 targets in a single 100° arc, so rolling
    // per victim would wear a wide weapon five times faster than a narrow one
    // on the same group. See EQUIPMENT.durability.wearChance.
    //
    // Stays at swing START, which means a swing cancelled by Unik still wears
    // the weapon and still burns the cooldown (C-01 decision 2): that is the
    // price of breaking your own commitment, and it matches the cost a swing
    // already paid for missing.
    this.wearWeapon(strike.hand);
    // ⚠ Koszt staminy stoi DOKŁADNIE tam, gdzie rzut na zużycie, i z tego
    // samego powodu: jeden zamach = jeden wydatek, niezależnie od tego, ilu
    // trafi i czy w ogóle trafi. Zamach przerwany Unikiem też jest kosztem —
    // wysiłek został poniesiony. ⚠ `spend` NIGDY nie odmawia: przy zerze
    // staminy autoatak dalej wychodzi, tylko postać jest wolniejsza.
    // ⚠ Koszt wyliczany, nie stały: `C × czas_zamachu × (1 − redukcja Mastery)`
    // (§24a + ładunek ekonomii wysiłku). Cała arytmetyka siedzi w
    // `Progression.swingStaminaCost` — scena nie wie ani o `C`, ani o randze.
    Stamina.spend(strike.staminaCost, "autoAttack", this.time.now);

    // Commit the swing; the hit itself is resolved later, in
    // resolvePendingSwing(). Nothing that follows from CONNECTING happens
    // here any more — not the damage, and not the FX's hit colour.
    this.pendingSwing = {
      resolveAt: this.time.now + strike.swingDurationMs * PLAYER.swingHitFraction,
      target: targeted ? target! : null,
      dirX: hit.dirX,
      dirY: hit.dirY,
      fxRadius: hit.radius,
      strike,
      // ⚠ **Autoatak jest JEDYNYM ciosem gracza z pełnym paskiem wykonania.**
      // Ma dyskretną chwilę rozstrzygnięcia (`resolvePendingSwing`), nie niesie
      // ani komponentu celowania w warstwie 1, ani nagrody on-hit — czyli
      // spełnia dokładnie te warunki, pod którymi §7 dopuszcza Execution Miss.
      allowFumble: true,
    };
    // Ręka oddaje głos drugiej — patrz `nextHand`.
    if (Equipment.dualWielding) this.nextHand = strike.hand === "weapon" ? "offhand" : "weapon";
  }

  /**
   * Profil ciosu dla ręki, która jest teraz na kolei.
   *
   * ⚠ **Zejście na rękę główną, gdy off-hand nie jest bronią, nie jest
   * bezpiecznikiem — jest normalną ścieżką.** Tarcza i pusta ręka nie mają
   * profilu ciosu, więc `offhandStrike()` zwraca wtedy `null`.
   */
  private nextStrike(): StrikeProfile {
    if (!Equipment.dualWielding) {
      // Druga ręka przestała być bronią — cykl wraca na rękę główną.
      this.nextHand = "weapon";
      return this.currentStrike();
    }
    if (this.nextHand === "offhand") {
      const oh = this.offhandStrike();
      if (oh) return oh;
    }
    return this.currentStrike();
  }

  /**
   * The strike the player would throw RIGHT NOW — the active attack variant
   * already folded into the weapon's numbers by Progression.
   *
   * `resolveAttack` freezes the result into `pendingSwing`; Wir ostrzy calls it
   * live, because an ability is decided and resolved in the same frame.
   */
  private currentStrike(): StrikeProfile {
    return {
      damageType: Progression.damageType,
      reach: Progression.attackReach,
      minReach: Progression.attackMinReach,
      knockback: Progression.knockback,
      interrupts: Progression.interrupts,
      staggerMs: Progression.staggerMs,
      // Warstwa 2: biegłość w rodzinie TEJ broni, zamrożona razem z resztą.
      proficiency: WeaponProficiency.get(Equipment.weaponFamily),
      family: Equipment.weaponFamily,
      hand: "weapon",
      // ⚠ Te same gettery, z których czytał wcześniej `rollDamage` — czyli
      // zachowanie ręki głównej jest co do bitu takie samo, tylko odczyt
      // przesunął się z chwili TRAFIENIA na chwilę ZAMACHU.
      damageMin: Progression.meleeDamageMin,
      damageMax: Progression.meleeDamageMax,
      critMultiplier: Progression.critMultiplier,
      critLowCut: Progression.critLowCut,
      critChance: Progression.critChance,
      staminaCost: Progression.swingStaminaCost,
      swingDurationMs: Progression.swingDurationMs,
      cooldownMs: Progression.attackCooldown * 1000,
    };
  }

  /**
   * **Cios wyprowadzony BRONIĄ Z DRUGIEJ RĘKI** (Dual Wield, prototyp).
   *
   * ⚠ **Trzeci profil ciosu w grze i zbudowany dokładnie jak drugi** —
   * `shieldStrike()` też nie bierze niczego z `Progression.melee`, tylko
   * z własnego narzędzia. Tutaj narzędziem jest druga broń.
   *
   * ⚠ **Liczby przychodzą z `Progression.offhandNumbers`, nie z `getItem`
   * tutaj.** Rozwiązywanie broni, atrybutów, rodziny i rangi Mastery ma jeden
   * dom; scena składa profil, ale go nie liczy.
   *
   * ⚠ **Zwraca `null`, gdy w drugiej ręce nie ma broni** — wołający ma wtedy
   * zejść na rękę główną, a nie dostać wymyślony profil.
   */
  private offhandStrike(): StrikeProfile | null {
    const n = Progression.offhandNumbers;
    const def = Equipment.offhandWeaponDef;
    if (!n || !def) return null;
    return {
      // ⚠ Typ obrażeń z WARIANTU broni off-handa nie istnieje — pasek
      // wariantów należy do ręki głównej (patrz `offhandNumbers`). Bierzemy
      // domyślny typ tej broni.
      damageType: Equipment.offhandDamageType ?? Progression.damageType,
      /**
       * ⚠⚠ **ZASIĘG NALEŻY DO POSTACI, NIE DO RĘKI (2026-09-07).**
       *
       * Do tej daty stało tu `def.melee?.reach`, czyli zasięg WŁASNY broni
       * z drugiej ręki — i to było jedno błędne założenie z dwoma skutkami,
       * oba ciche:
       *
       * 1. ⛔ **ZASTÓJ AUTOATAKU.** `resolveAttack` odrzuca cios przed
       *    zamachem, gdy cel jest poza `strike.reach`, a `nextHand` przełącza
       *    się **dopiero po zatwierdzeniu zamachu**. Przy mieczu (68)
       *    i sztylecie (56) gracz stojący w prześwicie 60 px zostawał więc
       *    z ręką off-hand na kolei, która nigdy nie mogła wystrzelić —
       *    i **cykl nie ruszał się już nigdy**. Zero zamachów, zero kosztu,
       *    zero komunikatu: bramka „Za daleko" pyta `currentStrike()`, czyli
       *    rękę główną, więc dla niej cel BYŁ w zasięgu.
       * 2. **Cichy pudłujący zamach.** Ten sam próg stoi drugi raz przy
       *    trafieniu (`damageLockedTarget`), więc nawet gdyby cios wyszedł,
       *    rozstrzygnąłby się w powietrze — po opłaceniu cooldownu, wysiłku
       *    i zużycia broni.
       *
       * ⚠ **Autoatak jest w tej grze ABSTRAKCJĄ, nie symulacją dwóch ramion.**
       * Kanon: *jeżeli postać jest w zasięgu swojego autoataku, ręka, która
       * jest na kolei, wykonuje swój normalny cios* — zakładamy, że przy
       * krótszym orężu postać po prostu bardziej się wychyla.
       *
       * ⚠ To domyka niezmiennik zapisany przy `refocusReachableAttacker`:
       * **próg fokusu i próg ciosu mają być JEDNĄ liczbą**, żeby nie istniał
       * stan „sfokusowany, ale nie do trafienia, bez wyjaśnienia". Fokus,
       * komunikaty odmowy i dobiegnięcie Szarży czytają `Progression.attackReach`
       * — teraz czyta ją też cios off-handa.
       *
       * ⛔ **To NIE jest osłabienie ani wzmocnienie drugiej ręki.** Off-hand
       * zostaje osłabiony dokładnie tak, jak był: własnymi obrażeniami,
       * własnym Władaniem, własną rangą, własnym kosztem wysiłku i wspólną
       * kadencją `DUAL_WIELD.swingMul`. Zmienia się wyłącznie to, że jego
       * WŁASNY zasięg przestaje być bramką wejścia do cyklu.
       */
      reach: Progression.attackReach,
      // ⚠⚠ **Dolna granica też należy do POSTACI, nie do ręki.** Wzięcie jej
      //   z `def.melee.minReach` odtworzyłoby co do joty zastój autoataku
      //   opisany wyżej: bramka odrzuca cios przed zamachem, a ręka oddaje głos
      //   dopiero po nim — tyle że od strony zwarcia zamiast od strony dystansu.
      minReach: Progression.attackMinReach,
      knockback: def.melee?.knockback ?? 0,
      interrupts: def.melee?.interrupts === true,
      // Zachwianie jest cechą RODZINY off-handa, skalowaną jego rangą.
      staggerMs: Progression.offhandStaggerMs,
      proficiency: n.proficiency,
      family: n.family,
      hand: "offhand",
      damageMin: n.damageMin,
      damageMax: n.damageMax,
      critMultiplier: n.critMultiplier,
      critLowCut: n.critLowCut,
      critChance: n.critChance,
      staminaCost: n.staminaCost,
      swingDurationMs: Progression.offhandSwingDurationMs,
      cooldownMs: Progression.offhandAttackCooldown * 1000,
    };
  }

  /**
   * **Cios wyprowadzony TARCZĄ, nie bronią.** Bliźniak `currentStrike()`
   * i jedyny inny profil ciosu w grze.
   *
   * ⚠ **Osobna funkcja, a nie literał w gałęzi `case "shieldBash"`** — ten
   * projekt ma zapisane, co robią dwa źródła prawdy o jednej rzeczy
   * (`combatOrigin`, „drugi stożek UI"). Profil ciosu musi mieć jeden dom
   * niezależnie od tego, ile jest narzędzi.
   *
   * ⚠ **Nic tu nie pochodzi z `Progression`** i to jest cała treść tej
   * funkcji: zasięg, typ i przerwanie są własnością TARCZY. Wzięcie
   * czegokolwiek z broni znaczyłoby, że uderzenie tarczą sięga jak włócznia
   * albo tnie jak miecz.
   *
   * ⚠ **`interrupts: true` NIE łamie reguły zawężania.** Umiejętność niczego
   * sobie nie przyznaje — przerwanie przychodzi z narzędzia, tak samo jak
   * przychodzi z młota, a bramka `requiresShield` gwarantuje, że narzędzie
   * jest w ręce. Pełne uzasadnienie: `docs/systemy/abilities.md` R8.
   *
   * ⚠ **`staggerMs: 0` i `knockback` z configu (dziś 0)** — patrz nagłówek
   * `ABILITIES.shieldBash`: zachwianie liczy to samo pojęcie co ogłuszenie,
   * a odrzut wypycha cel z okna, które ogłuszenie właśnie kupiło.
   */
  private shieldStrike(): StrikeProfile {
    const s = ABILITIES.shieldBash;
    return {
      damageType: "blunt",
      // ⚠ **Zasięg z BRONI, nie własny — zmienione 2026-08-26 po zgłoszeniu
      // z gry.** Pełne uzasadnienie i pomiar martwego pasma stoją przy
      // `maxRangePx` w `core/AbilitySpec.ts`; tutaj liczy się jedno: to musi
      // być DOKŁADNIE ta sama liczba, którą czyta `currentStrike()`, bo
      // podgląd celowania rozstrzyga przez `currentStrike()`. Dwie różne
      // liczby dawały podgląd podświetlający cel, którego commit odrzucał
      // cichym `return`.
      reach: Progression.attackReach,
      // ⚠ **Ta sama liczba, co w `currentStrike()`** — z dokładnie tego powodu,
      //   co zasięg górny linijkę wyżej. Dziś martwa strefa i tarcza wykluczają
      //   się i tak (broń z `minReach` jest dwuręczna), ale rozjazd między
      //   podglądem a commitem ma być niemożliwy, a nie nieosiągalny.
      minReach: Progression.attackMinReach,
      knockback: s.knockbackPx,
      interrupts: true,
      staggerMs: 0,
      hand: "weapon",
      // Uderzenie tarczą jest umiejętnością ręki GŁÓWNEJ — jej tempo bramkuje
      // następny cios, tak jak przed wprowadzeniem kadencji per-ręka.
      cooldownMs: Progression.attackCooldown * 1000,
      // ⚠ Obrażenia Uderzenia tarczą pochodzą z BRONI (mnożnik jest osobno),
      // więc liczby rzutu są tu te same co przy zwykłym ciosie.
      damageMin: Progression.meleeDamageMin,
      damageMax: Progression.meleeDamageMax,
      critMultiplier: Progression.critMultiplier,
      critLowCut: Progression.critLowCut,
      // ⚠ Tarcza bije ręką GŁÓWNĄ — profil bierze jej liczby, jak dotąd.
      critChance: Progression.critChance,
      staminaCost: Progression.swingStaminaCost,
      swingDurationMs: Progression.swingDurationMs,
      // ⚠ **Biegłość BRONI, mimo że cios wyprowadza tarcza** — i to jest
      // świadome, nie przeoczenie. Liczbę obrażeń tej umiejętności rolluje
      // `player.rollDamage()`, czyli **broń** (`damageMultiplier: 0.5` skaluje
      // jej rzut), więc `m(P)` skaluje tu dokładnie to, co sam wygenerował.
      // Osobne `P` dla tarczy byłoby nową osią systemu, a nie użyciem
      // istniejącej — biegłość jest zdefiniowana per RODZINA BRONI (§14).
      proficiency: WeaponProficiency.get(Equipment.weaponFamily),
      family: Equipment.weaponFamily,
    };
  }

  /**
   * Land the swing started `PLAYER.swingHitFraction` of a swing ago, once.
   *
   * This is where a basic attack actually connects, and it re-tests the world
   * as it is NOW rather than as it was when the button went down: an enemy
   * that darted out of reach in the meantime takes nothing, and the arc swing
   * recomputes its cone, so it can miss a group it started over or catch one
   * it didn't.
   *
   * Escaping is only realistically possible for the creatures that dart or
   * retreat — a wolf's lunge covers 22-38px inside this window, a rabbit's
   * panic bolt 16-28px, while an ordinary chase manages 5-16px against a 52px
   * reach. That asymmetry is the point: the enemies built around commitment
   * are the ones this rewards reading.
   */
  private resolvePendingSwing(): void {
    const swing = this.pendingSwing;
    if (!swing || this.time.now < swing.resolveAt) return;
    // Cleared BEFORE resolving, so a swing can never land twice even if
    // something below re-enters the loop.
    this.pendingSwing = null;
    // A corpse lands no blows. Not in the C-01 brief because it could not
    // happen before it: damage used to be applied on the same frame as the
    // press, so there was no window in which the player could die between
    // deciding a swing and it connecting. A boar's charge killing you ~90ms
    // into your own swing now opens exactly that window.
    if (this.player.isDead) return;

    // ⚠ **Podstawowy atak jest wyłącznie JEDNOCELOWY.** Do 2026-08-16 spadał tu
    // do `damageEnemiesInArc`, gdy nikt nie był wybrany — czyli wielotrafienie
    // było darmową własnością broni. Model idzie w stronę WoW-a: cel plus
    // autoatak, a AoE jest umiejętnością (`cleave`, „Szerokie cięcie"). Ta
    // gałąź nie może się już zdarzyć, bo `resolveAttack` nie rozpoczyna
    // zamachu bez celu — zostaje jako jawne zero, a nie cichy zamach po łuku.
    // ⚠ Mnożnik idzie do TEJ SAMEJ ścieżki co zwykły cios, więc krytyki,
    // pancerz, popup, XP, łup i reakcja trafienia (`cuesFor`, tier ciężkości)
    // działają bez ani jednej nowej linijki — patrz `damageMatchingEnemies`.
    const anyHit = swing.target
      ? this.damageLockedTarget(
          swing.target,
          swing.strike,
          swing.allowFumble,
          swing.damageMul ?? 1,
          // ⚠ **Krwawienie jedzie NIŻEJ, a nie do bloku `onHit` poniżej** —
          // patrz `pendingSwing.onHit.bleed`: jego obrażenia są snapshotem
          // z rzutu, który powstaje dopiero tam.
          swing.onHit?.bleed,
        )
      : false;

    // ⚠ **Nagroda za trafienie wisi na `anyHit`, czyli na tym samym
    // rozstrzygnięciu, które przyznaje obrażenia** — nie na tym, że
    // umiejętność została użyta. Cel, który zdążył wyjść z zasięgu, nie daje
    // nic; tak samo pudło.
    if (swing.onHit && anyHit) {
      const { refund, armAutoAttack, control, wearShield } = swing.onHit;
      if (refund) Abilities.refundCooldown(refund.id, refund.fraction, this.time.now);
      // ── Zużycie tarczy (`S10`) ──────────────────────────────────────────
      // ⚠ Stoi POD `anyHit` razem z resztą nagród, bo to jest ta sama reguła:
      // liczy się trafienie, nie użycie. ⛔ Świadomie NIE przy naciśnięciu,
      // gdzie stoi `wearsWeapon` zwykłego zamachu — tamten kosztuje też za
      // pudło i to jest jego osobna, wcześniejsza decyzja (C-01 punkt 2).
      if (wearShield) this.wearShieldOnHit();
      // ⚠ Natarcie ma TRWAĆ. Bez tego Wypad kończył się jednym pchnięciem
      // i postać stawała przy wrogu z zaznaczonym celem, czekając na kolejne
      // tapnięcie — czego Szarża akurat nie robi (uzbraja autoatak na
      // dobiegnięciu) i przez co obie umiejętności uczyły dwóch różnych nawyków.
      if (armAutoAttack) this.autoAttackArmed = true;
      // ── Kontrola (Uderzenie tarczą) ────────────────────────────────────
      // ⚠ **`isDead` sprawdzane tutaj, a nie w `stun()`** — ta sama reguła,
      // którą stosują `interrupts` i `staggerMs` w `damageMatchingEnemies`:
      // trupem się nie szarzy i nie ogłusza go. `anyHit` jest prawdziwe także
      // dla ciosu ZABIJAJĄCEGO, więc bez tego warunku ostatni bash zapalałby
      // znacznik ogłuszenia nad zapadającym się ciałem.
      //
      // ⚠ **Przerwanie PRZED ogłuszeniem, i ta kolejność jest nośna.**
      // `interrupt()` uzbraja cooldown akcji przez runner („obuch kupuje cały
      // cios, a nie odracza go"); `stun()` skasuje ją i tak, ale przez
      // `cancel()`, który robi to samo dla każdej fazy. Odwrotna kolejność
      // gubi rozróżnienie między „przerwałem zamach" a „skasowałem akcję",
      // czyli dokładnie to, po co te dwa pojęcia są rozdzielone.
      if (control && swing.target && !swing.target.isDead) {
        swing.target.interrupt();
        swing.target.stun(control.stunMs);
      }
    }

    // The flourish is drawn here rather than at swing start, because its
    // colour IS the hit/miss readout — showing it early would promise a
    // connection the swing hasn't made yet (C-01 decision 1). The swing the
    // player watches (pose, blade arc, sound) already started on the press,
    // inside triggerAttack().
    //
    // Its POSITION is recomputed here too, from where the player stands right
    // now plus the swing's locked direction — the same `player + heading *
    // attackRange` point triggerAttack returned, just evaluated at the moment
    // of impact instead of at the press. The lunge tween moves the player
    // during the swing, and on a fast weapon the hit lands at that lunge's
    // full extension, so a frozen point would draw the flourish behind the
    // blade (C-04).
    this.spawnSwingFx(
      this.player.x + swing.dirX * PLAYER.attackRange,
      this.player.y + swing.dirY * PLAYER.attackRange,
      swing.fxRadius,
      anyHit,
    );
  }

  /* ⚠ Stał tu OSIEROCONY docblock `targetInReach` — opis jednej metody
     przyklejony do zupełnie innej (`applyZoom` niżej), a do tego powołujący się
     na „same allowance formula", czyli na wzór usunięty z gry w Fazie 1B-b.
     Usunięty 2026-09-07: `targetInReach` ma własny, poprawny komentarz przy
     swojej definicji. Komentarz opisujący nie tę funkcję jest gorszy niż jego
     brak — czyta się go jako obowiązujący. */
  /**
   * Ustaw przybliżenie kamery tak, żeby na krótszej osi ekranu mieściło się co
   * najmniej `CAMERA.minTilesShortAxis` kafli.
   *
   * ⚠ **`Math.floor`, nie zaokrąglenie — zoom musi być całkowity.** Ułamkowy
   * w parze z `roundPixels` daje migotanie pixel-artu przy ruchu kamery.
   *
   * ⚠ Klamrowane od góry do `maxZoom`, czyli do dotychczasowej stałej: duży
   * ekran ma wyglądać dokładnie jak dotąd. Ta funkcja może kamerę wyłącznie
   * ODDALIĆ, i tylko tam, gdzie ekran jest za mały.
   */
  private applyZoom(): void {
    const short = Math.min(this.scale.width, this.scale.height);
    const fit = Math.floor(short / (CAMERA.minTilesShortAxis * WORLD.tileSize));
    // Granice są podane „na piksel CSS", a `short` jest w pikselach urządzenia
    // — patrz komentarz przy `CAMERA.minZoom`. Zaokrąglane, bo zoom musi być
    // całkowity, a DPR całkowity nie jest (mierzone 2,625 na telefonie autora).
    const dpr = pixelRatio();
    const lo = Math.max(1, Math.round(CAMERA.minZoom * dpr));
    const hi = Math.max(lo, Math.round(CAMERA.maxZoom * dpr));
    this.cameras.main.setZoom(Phaser.Math.Clamp(fit, lo, hi));
  }

  /**
   * **Czy gracz jest zwrócony tak, że może w ten cel uderzyć.**
   *
   * ⚠ Bramka dodana 2026-08-23. Do tego dnia `resolveAttack` wołało
   * `aimAttackAt` bezwarunkowo, więc blokada celu obracała postać o 180° do
   * wroga, który zaszedł ją od pleców — bez żadnego wejścia gracza, bo
   * autoatak zostaje uzbrojony aż do śmierci celu. Okrążanie watahy nie miało
   * przez to ŻADNEJ konsekwencji: wilk wracał od tyłu i po prostu obrywał.
   *
   * Liczone od ZWROTU postaci (`zwrotKat`) — **od tego, co widać**, nie od
   * kierunku do celu. Ta sama reguła, którą stosuje `guardKat`, i ten
   * sam predykat (`isFrontal`), więc przód i plecy znaczą w ataku dokładnie to
   * samo co w obronie.
   *
   * ⚠ Kąt bierze się ze ŚRODKÓW HURTBOXÓW (`combatOrigin` → `combatBody`), a
   * nie ze środków sprite'ów — te dzieli u gracza 19 px (Faza 1B-b). Przy
   * zwarciu, czyli dokładnie tam, gdzie ta bramka rozstrzyga, taka różnica
   * przewraca wynik.
   */
  private canStrikeFacing(target: Enemy): boolean {
    const origin = this.player.combatOrigin;
    const body = target.combatBody;
    // ⚠ Jedyne obejście: ciała FIZYCZNIE na sobie. Nie `pointBlankRadius` —
    // patrz `PLAYER.attackFacingBypassGapPx`. Przy nachodzących hurtboxach
    // „z której strony" przestaje mieć sens geometryczny, a gracz i tak nie ma
    // jak się odsunąć.
    const gap = gapBetween({ x: origin.x, y: origin.y, radius: 0 }, body);
    if (gap <= PLAYER.attackFacingBypassGapPx) return true;
    return isFrontal(
      // ⚠ `zwrotKat`, nie `facingDir`: bramka zwrotu ataku pyta o to samo,
      // w co patrzy MODEL, a ten obraca się ciągle od A5 (`OI-140`).
      // Czterokierunkowy `facingDir` odmawiał ciosu w cel oddalony o 45°
      // od ćwiartki, choć postać jawnie na niego patrzyła.
      this.player.zwrotKat,
      { x: body.x - origin.x, y: body.y - origin.y },
      PLAYER.attackFrontArcDeg,
    );
  }

  /**
   * **Kierunek do celu w przestrzeni CIAŁ** — od `combatOrigin` gracza do
   * środka hurtboxa celu. Jedyne źródło kierunku ciosu i lotu wymierzonego
   * w konkretnego wroga.
   *
   * ⚠⚠ **Do 2026-09-23 celowanie szło od środka SPRITE'A do środka SPRITE'A**
   * (`target.x - player.x`), podczas gdy zasięg i bramka zwrotu mierzą już
   * w przestrzeni ciał. Ciało gracza leży 21,7 px pod jego duszkiem, ciała
   * wrogów 2,3–15,7 px pod swoimi — więc wektor przekrzywiał się ku pionowi,
   * inaczej dla każdego gatunku. Zmierzone na żywo (odstęp 8 px): skoczek
   * jadowity pod 45° → poza ciosu **36,7°** obok ciała celu, królik 28,8°,
   * Szary 8,3°. Za `attackRad` szły model, wypad zamachu i — w oknie zamachu
   * — osłona (`guardKat`), a ciosy przychodzące liczą się w przestrzeni ciał
   * (`Enemy.hitVectorTo`). Ta sama pomyłka, którą wcześniej naprawiono
   * pociskowi sieciarza (`Spider.fire`).
   *
   * ⛔ Nie wracaj do `target.x - this.player.x` przy CELOWANIU. Duszek mówi,
   * gdzie istota jest narysowana; kierunek na ziemi mówi ciało.
   */
  private bodyVectorTo(target: Enemy): { x: number; y: number } {
    const o = this.player.combatOrigin;
    const b = target.combatBody;
    return { x: b.x - o.x, y: b.y - o.y };
  }

  private targetInReach(target: Enemy, reach: number, minReach = 0): boolean {
    // Faza 1B-b: mierzy się od `combatOrigin` GRACZA (środek jego ciała, nie
    // środek sprite'a — te dzieli 19 px) do KRAWĘDZI zmierzonego hurtboxa celu.
    // Ta metoda zostaje jako nazwa lokalna, bo woła ją i bramka przed zamachem,
    // i `damageLockedTarget`; liczy jedno wspólne miejsce.
    return withinReach(this.player.combatOrigin, target.combatBody, reach, minReach);
  }

  /**
   * The targeted basic attack: hits `currentTarget` and only that target, if
   * it's within the equipped weapon's reach right now.
   *
   * Deliberately no facing/arc check — the swing was just aimed AT the target
   * in resolveAttack(), so re-checking the cone would be redundant. Reuses
   * `damageMatchingEnemies` (the one place a hit is resolved — roll, popup,
   * knockback, XP, loot, respawn) with a shape predicate that matches only
   * this one enemy, so a targeted swing is credited through the EXACT same
   * path an arc swing is; nothing about resolution had to be duplicated.
   *
   * Takes the target as an argument rather than reading `currentTarget`: by
   * the time a swing lands, the player may well have tapped somebody else,
   * and this swing belongs to whoever it was aimed at (C-01 — the target is
   * locked at swing start).
   *
   * A target that died or left the scene between the press and the blow is
   * simply unhittable, and the swing does NOT fall back to the arc — nobody
   * standing nearby inherits a blow meant for a corpse (C-01 decision 3).
   *
   * No fallback, no partial credit on range either: the player committed to
   * this target and must close the distance themselves (no auto-follow, that
   * is explicitly a later step).
   */
  private damageLockedTarget(
    target: Enemy,
    strike: StrikeProfile,
    /** Warstwa 2 — patrz `pendingSwing.allowFumble`. **Wymagane i stoi PRZED
     *  `damageMul`**, żeby nie dało się go pominąć: tą samą metodą ląduje
     *  autoatak I trzy umiejętności, a każda z nich odpowiada inaczej. */
    allowFumble: boolean,
    damageMul = 1,
    /** Krwawienie do nałożenia na trafiony cel — patrz `pendingSwing.onHit.bleed`. */
    bleed?: SwingBleed,
  ): boolean {
    if (target.isDead || !target.active) return false;
    return this.damageMatchingEnemies(
      damageMul,
      (e) => e === target && this.targetInReach(target, strike.reach, strike.minReach),
      strike,
      allowFumble,
      bleed,
    );
  }

  /* ── `damageEnemiesInArc` USUNIĘTE (2026-08-23, prototyp celowania) ──────
     Było jedynym wołającym `withinArc` w grze i jedyną ścieżką `Szerokiego
     cięcia`. Zastąpił je `castCleave`, bo łuk przestał być predykatem
     „kto jest w stożku" — jest teraz KSZTAŁTEM z `ResolvedAbilitySpec`,
     z którego czyta także podgląd, i przechodzi przez deterministyczną
     selekcję z sufitem celów.

     Zostawienie starej metody „na wszelki wypadek" byłoby dokładnie tym, przed
     czym ostrzega `HitResolver` przy kształtach `legacy*`: martwy kod przy
     bramce regresyjnej jest gorszy niż brak kodu, bo uprząż świeci na zielono,
     testując funkcję, której gra nie używa. Dawny kształt jest w całości
     odtwarzalny z `resolveAbility` + `PLAYER.pointBlankRadius`.
     ───────────────────────────────────────────────────────────────────────── */

  /**
   * Roll the player's damage against every living enemy inside a circle, with
   * all the kill bookkeeping (XP, loot, respawn). Shared by the normal swing
   * and by Wir ostrzy, so an ability can never drift out of sync with how a
   * kill is credited. Returns true if anything was hit.
   */
  private damageEnemiesInCircle(
    x: number,
    y: number,
    radius: number,
    damageMul: number,
    strike: StrikeProfile,
  ): boolean {
    return this.damageMatchingEnemies(
      damageMul,
      (e) => withinCircle({ x, y }, e.combatBody, radius),
      strike,
      // ⚠ **Wir ostrzy NIE fuszeruje.** Warstwa 1 jest tu KSZTAŁTEM (okrąg
      // z `ResolvedAbilitySpec`), czyli pyta już o to, czy zamach objął cel —
      // drugi losowy rzut o to samo łamie zakaz podwójnego liczenia z §3.
      // To jest ten sam argument, którym `bearSwipe` dostał `allowFumble: false`
      // po stronie wroga. `m(P)` i Ześlizg działają normalnie.
      false,
    );
  }

  /**
   * The one place a player hit is resolved: rolls damage, shows the popup,
   * applies knockback and credits the kill (XP, loot, respawn). Callers supply
   * only the SHAPE of the strike via `inShape`, which receives the enemy and
   * nothing else — ⚠ do 2026-09-07 stało tu, że dostaje też „its size
   * allowance", i było to nieprawdą o kodzie tuż niżej: od Fazy 1B-b każdy
   * kształt bierze rozmiar celu sam, z `core/HitResolver.ts` (patrz komentarz
   * przy pętli zbierającej trafionych).
   *
   * Keeping the bookkeeping here is what stops a new ability from quietly
   * forgetting to award XP or schedule a respawn.
   */
  /**
   * ⚠ `damageMul` bywa FUNKCJĄ od celu (2026-08-23, prototyp celowania).
   * `Szerokie cięcie` daje inny mnożnik celowi głównemu niż reszcie, a
   * przepuszczenie tego przez ten sam pipeline jest jedynym sposobem, żeby
   * primary/secondary nie dorobiło się własnej, drugiej księgowości trafienia
   * (XP, łup, respawn, popup). Stała liczba działa jak dotąd.
   */
  private damageMatchingEnemies(
    damageMul: number | ((enemy: Enemy) => number),
    inShape: (enemy: Enemy) => boolean,
    strike: StrikeProfile,
    /**
     * ⚠ **WYMAGANE** — patrz `pendingSwing.allowFumble` i
     * `Proficiency.executionFor`. Wartość domyślna zlałaby „ten cios świadomie
     * nie może spudłować wykonaniem" z „ktoś nie dopisał argumentu", a `tsc`
     * nie miałby o co zapytać.
     */
    allowFumble: boolean,
    /**
     * **Krwawienie do nałożenia na każdy trafiony cel** (Rozcięcie, 2026-09-04).
     * Brak = ten zamach nie zostawia rany, czyli dziś każdy poza Rozcięciem.
     *
     * ⚠ **Opcjonalne, w odróżnieniu od `allowFumble` — i to nie jest
     * niekonsekwencja.** `allowFumble` opisuje własność, którą KAŻDY cios ma
     * (może pudłować albo nie), więc pominięcie argumentu byłoby przemilczeniem
     * decyzji. Krwawienie jest ŁADUNKIEM, którego zamach albo nie niesie —
     * i „nie niesie" jest tu jedynym sensownym domyślnym stanem, tak samo jak
     * przy `pendingSwing.onHit`.
     */
    bleed?: SwingBleed,
  ): boolean {
    // ── WARSTWA 1 rozstrzyga się PIERWSZA ─────────────────────────────────
    // ⚠ **Cele zbierane PRZED rzutem warstwy 2, i ta kolejność jest treścią,
    // nie optymalizacją.** Rzut przed testem kształtu zgłaszałby „Niezgrabnie"
    // na ciosach, które i tak leciały w powietrze — czyli mieszałby Execution
    // Miss z pudłem geometrycznym, a §7 checkpointu nazywa dokładnie to
    // rozróżnienie największym ryzykiem ODBIORCZYM całej warstwy. Ta sama
    // kolejność, którą stosuje strona wroga (`GreyWolf`: najpierw zasięg,
    // potem `rollExecution`).
    const trafione: Enemy[] = [];
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (e.isDead) continue;
      // ⚠ `allowance` nie jest już liczone TUTAJ i podawane kształtowi. Każdy
      // kształt bierze je sam z `core/HitResolver.ts` — jedno miejsce zamiast
      // dwóch, które mogłyby się rozjechać w definicji „rozmiaru celu".
      if (!inShape(e)) continue;
      trafione.push(e);
    }

    // ── WARSTWA 2: JEDEN rzut na ZAMACH, nie na cel ───────────────────────
    // ⚠ Execution opisuje, **jak wyprowadzono cios**, a nie kogo trafił. Rzut
    // per cel dałby broni o szerokim łuku pięć niezależnych losowań na jednym
    // machnięciu — ten sam rachunek, którym odrzucono zużycie broni liczone
    // per ofiara (patrz `wearWeapon` w `resolveAttack`).
    //
    // Pusty zamach nie rusza paska w ogóle: nie ma czego wykonać, więc `clean`
    // jest tu deklaracją „warstwa 2 się nie wypowiada", a nie wynikiem rzutu.
    const wykonanie: ExecutionRolled =
      trafione.length > 0 ? rollExecution(strike.proficiency, allowFumble) : "clean";

    // ── Execution Miss: cel był osiągalny, cios wyszedł źle ───────────────
    // ⚠ **Kończy się TUTAJ, przed `takeDamage`** — ta sama reguła co po stronie
    // wroga (tam pilnuje jej typ `ExecutionLanded`, bo tam w grę wchodzi
    // licznik PRD; tu żadnego łańcucha obronnego nie ma, ale kolejność zostaje
    // ta sama, bo jest poprawna niezależnie od PRD).
    //
    // ⚠ **Napis jest WYMAGANY, nie ozdobny.** Bez niego „odsunął się" i
    // „spudłowałem wykonaniem" wyglądają identycznie — a przy `P = 0` to jest
    // co ósmy zamach. Rysowany nad CELEM, nie przed postacią: mówi o tym, co
    // się nie stało temu stworzeniu.
    if (wykonanie === "fumble") {
      const cel = trafione[0];
      const skad = this.player.combatOrigin;
      const punkt = { x: cel.x, y: cel.y };
      const kierunek = { x: cel.x - skad.x, y: cel.y - skad.y };
      playCues(
        this,
        cuesFor({
          actionId: "player_swing",
          outcome: "miss",
          execution: wykonanie,
          mitigated: 0,
          tier: Stamina.impactTier(0),
          crit: false,
          againstPlayer: false,
          at: punkt,
          dir: kierunek,
          attackerRecoil: "onHit",
        }),
        punkt,
        kierunek,
        // ⚠ Bez `flashTarget` — nic nie oberwało. Błysk na stworzeniu, którego
        // cios nie dosięgnął, mówiłby dokładnie to, czemu ten napis przeczy.
      );
      return false;
    }

    let anyHit = false;
    // Which hit of THIS swing this is — only used to stagger the damage numbers
    // so an axe catching five targets reads as a series rather than a pile.
    let hitIndex = 0;
    // ⚠ **Kopnięcie napastnika liczy się RAZ NA ZAMACH, nie raz na cel
    // (5B).** `nudge` sumuje się przyrostowo, więc siekiera łapiąca pięciu
    // przeciwników odrzuciłaby gracza pięciokrotnie — z 4 px zrobiłoby się 20
    // i zamach po łuku zacząłby być narzędziem ucieczki. Zapamiętujemy
    // NAJCIĘŻSZE trafienie zamachu i kopiemy raz, po pętli.
    let najciezszy: { mitigated: number; x: number; y: number } | null = null;
    // ⚠ `for...of`, nie `forEach` (5B). Zamiana nie jest kosmetyczna:
    // TypeScript nie śledzi mutacji zmiennej przez granicę domknięcia, więc
    // `najciezszy` przypisywany w callbacku wychodził z pętli jako `never`
    // i odczyt po niej się nie kompilował. Przy okazji znika alokacja
    // domknięcia na każdy zamach.
    for (const e of trafione) {
      anyHit = true;
      // ── PRAKTYKA: manekin treningowy (§14b) ───────────────────────────────
      // ⚠ **Tutaj, bo tutaj jest CIOS, KTÓRY DOSZEDŁ.** Kanał nauki musi
      // widzieć dokładnie to samo zdarzenie, co kanał obrażeń: warstwa 1
      // odsiała pudła geometryczne (`trafione` jest puste → tu nie wchodzimy),
      // a Execution Miss wyszedł wcześniej własną gałęzią. Zostaje kontakt,
      // ważony `wykonanie` (clean 1,00 · graze 0,30 · reszta 0 — `Practice`).
      //
      // ⚠ **`strike.family`, nie `Equipment.weaponFamily`** — nauka idzie do tej
      // rodziny, którą cios był wyprowadzony, nawet jeśli gracz zdążył
      // przezbroić się w oknie zamachu.
      //
      // ⚠ **DWA KANAŁY, jeden punkt wywołania.** Manekin rozpoznawany po
      // `kind`, bo ma własną krzywą (§14b: pierwsze 10 punktów od `P_start`);
      // każdy inny przeciwnik idzie kanałem WALKI (§20–§21, D7), czyli przez
      // funkcję nauczyciela i malejący przyrost `c·√n`.
      //
      // ⚠ **`e.nextPracticeHit` przekazywane jako FUNKCJA, nie liczba** —
      // licznik `k` ma rosnąć wyłącznie wtedy, gdy praktyka naprawdę zostanie
      // przyznana. Zwiększanie go tutaj karałoby malejącym przyrostem za ciosy,
      // które niczego nie uczyły (sufit `P`, milczący nauczyciel).
      if (strike.family) {
        if (e.kind === "training_dummy") {
          WeaponProficiency.practiceOnDummy(strike.family, wykonanie);
        } else {
          WeaponProficiency.practiceInCombat(
            strike.family,
            wykonanie,
            e.proficiency,
            () => e.nextPracticeHit(),
          );
        }
      }
      const roll = this.player.rollDamage(strike);
      const mul = typeof damageMul === "function" ? damageMul(e) : damageMul;
      // ⚠ **Warstwa 2 wchodzi PRZED istniejącym zaokrągleniem i podłogą**, więc
      // liczba zaokrągla się dalej dokładnie raz, a ześlizg nie może zejść do
      // zera (`Math.max(1, …)` obejmuje go tak samo jak resztę). Ta sama
      // kolejność co po stronie wroga: `scaleDamage` liczy się na surowej
      // wartości, PRZED pancerzem.
      //
      // ⚠ Przy `P = 100` `m(P)` wynosi dokładnie 1, więc to wyrażenie jest
      // wtedy tożsamością — punkt neutralny jest własnością matematyczną, nie
      // przypadkiem strojenia.
      const raw = Math.max(1, Math.round(scaleDamage(roll.amount * mul, strike.proficiency, wykonanie)));
      // The creature's own armour against THIS damage type, asked before the
      // popup so the number the player reads is the number that was dealt.
      // `damageAfterArmor` is pure, so takeDamage applying it again to the
      // same raw amount lands on the same figure.
      const shown = e.damageAfterArmor(raw, strike.damageType);
      // ── Feedback trafienia wroga: JEDNO wywołanie (Faza 5B) ────────────
      // ⚠ Do 2026-08-23 dźwięk stał tutaj, a błysk w `Enemy.takeDamage` —
      // czyli **jedna decyzja w dwóch plikach**, i to w dwóch katalogach.
      // Zeszły się tu, bo tylko tutaj znany jest krytyk, od którego zależy
      // dźwięk. `restoreTint` przeżył przeprowadzkę jako getter (patrz
      // `Enemy.flashTarget`) — rozwiązany za wcześnie przywracałby telegraf,
      // który już nie obowiązuje.
      //
      // Dźwięk jest dalej dławiony wewnątrz `Sfx`, więc siekiera łapiąca pięć
      // królików brzmi jak jedno solidne trafienie, a nie pięć nakładających
      // się próbek.
      playCues(
        this,
        cuesFor({
          actionId: "player_swing",
          outcome: "hit",
          // Wynik warstwy 2 tego ZAMACHU — ten sam dla każdego celu, którego
          // objął (jeden rzut na cios, patrz wyżej).
          execution: wykonanie,
          mitigated: shown,
          tier: Stamina.impactTier(shown),
          crit: roll.crit,
          againstPlayer: false,
          at: { x: e.x, y: e.y },
          dir: null,
          // Deklaracja zamachu gracza, ta sama co wszędzie. `cuesFor` tego pola
          // nie czyta — wpisane, żeby jeden cios nie opisywał się dwojako.
          attackerRecoil: "onHit",
        }),
        { x: e.x, y: e.y },
        null,
        e.flashTarget,
      );
      if (roll.crit) this.critHitStop();
      // Liczone z MNOŻNIKA `ARMOR_PROFILE`, nie z wyniku — patrz `effectiveness`.
      this.spawnDamagePopup(e.x, e.y, shown, roll.crit, strike, e.effectivenessOf(strike.damageType), hitIndex);
      hitIndex++;
      if (!najciezszy || shown > najciezszy.mitigated) {
        najciezszy = { mitigated: shown, x: e.x, y: e.y };
      }
      // ⚠ **Pakiet budowany z TEJ SAMEJ liczby `raw`, którą policzył popup.**
      // Jeden komponent, typ z wariantu zamrożonego w `StrikeProfile` — czyli
      // dokładnie to, co przedtem jechało jako para argumentów.
      // ⚠ Źródło odrzutu w przestrzeni CIAŁ (2026-09-07) — patrz nagłówek
      // `Enemy.takeDamage`. Duszek gracza leży 19 px nad jego ciałem, więc
      // wektor „ode mnie" liczony z niego odchylał odrzut o kilka stopni.
      const odGracza = this.player.combatOrigin;
      const killed = e.takeDamage(
        physicalDamage(raw, strike.damageType),
        odGracza.x,
        odGracza.y,
        strike.knockback * (roll.crit ? 1.4 : 1),
      );
      // Blunt weapons cancel whatever the target was winding up. Applied only
      // on a hit that didn't kill — interrupting a corpse is meaningless, and
      // die() has already torn the state down.
      if (!killed && strike.interrupts) e.interrupt();
      // Oś rodziny obuchowej — zachwianie. Osobna linia od `interrupts` i
      // osobne pojęcie: tamto kasuje ZAMACH, to rusza wyłącznie ruch. Broń
      // może mieć jedno, drugie, oba (młot) albo żadne. Ten sam warunek
      // „tylko na trafieniu, które nie zabiło": chwianie trupem nic nie znaczy.
      if (!killed && strike.staggerMs > 0) e.stagger(strike.staggerMs);
      // ── Krwawienie (Rozcięcie, 2026-09-04) ─────────────────────────────
      // ⚠ **TUTAJ, bo tutaj — i tylko tutaj — żyje rzut.** Snapshot to 10%
      // obrażeń tego ciosu PRZED mnożnikiem krytycznym (decyzja autora):
      // krytyk podnosi wyłącznie cios bezpośredni, a rana krwawi tak samo.
      //
      // ⚠ **Przechodzi przez `scaleDamage`, czyli przez warstwę 2** — ten sam
      // `m(P)` i ten sam Ześlizg co cios, który ją zadał. Osobny rzut byłby
      // drugim pytaniem o to samo (zakaz podwójnego liczenia, §3 Biegłości),
      // a pominięcie warstwy 2 dałoby ranę niezależną od tego, jak dobrze
      // gracz włada bronią.
      //
      // ⚠ **`Math.max(1, …)` jak wszędzie** — tik zaokrąglony do zera czytałby
      // się jako zepsuty efekt, nie jako lekka rana.
      //
      // ⚠ **Ten sam warunek „nie na trupie" co `interrupt` i `stagger`.**
      if (!killed && bleed) {
        const naTik = Math.max(
          1,
          Math.round(scaleDamage(roll.preCrit * bleed.fractionOfDamage, strike.proficiency, wykonanie)),
        );
        e.applyEffect(
          {
            id: bleed.buffId,
            name: bleed.name,
            // ⚠ Z DEKLARACJI, nigdy z literału — patrz `SwingBleed`.
            iconKey: bleed.iconKey,
            durationMs: bleed.durationMs,
            tickMs: bleed.tickMs,
            maxStacks: bleed.maxStacks,
            debuff: true,
            tags: [BLEED.tag],
            payload: BLEED.payload({ damagePerTick: naTik }),
          },
          // ⚠ **Pierwsze `EffectSource` ustawione przez kogokolwiek w tej grze.**
          // Dziś NIKT tego nie czyta — księgowość zabójstwa przypisuje łup i XP
          // graczowi bezwarunkowo, bo innego sprawcy nie ma. Pole jest tu, bo
          // to jest właśnie ten SZEW: gdy pojawi się drugi możliwy sprawca
          // (sojusznik, przywołanie, pułapka), atrybucja DoT ma się o co oprzeć,
          // zamiast wymagać dopisania argumentu w każdym wywołaniu.
          { kind: "player" },
        );
      }
      if (killed) this.creditKill(e);
    }

    // ── Kopnięcie napastnika (Faza 5B) ────────────────────────────────────
    // ⚠ **Kierunek liczony DO CELU, nie z `swing.dirX`** — i to jest różnica,
    // nie skrót. `swing` niesie zwrot zamknięty w chwili naciśnięcia, a cios
    // rozstrzyga się w jego połowie, kiedy cel zdążył się przesunąć. Kopnięcie
    // ma czytać się jako „odbiłem się od TEGO", więc bierze linię do tego, co
    // faktycznie oberwało. Przy jednocelowym autoataku (czyli w praktyce
    // zawsze) obie liczby i tak są prawie tożsame; różnią się dopiero na
    // zamachu po łuku, gdzie ta wersja jest wprost poprawniejsza.
    if (najciezszy) {
      const skutki = effectsFor({
        actionId: "player_swing",
        outcome: "hit",
        // ⚠ **Ten sam wynik warstwy 2 co w cue wyżej — i to musi być ta sama
        // zmienna, nie drugi literał.** `effectsFor` czyta dziś wyłącznie
        // `attackerRecoil`, ale rozstrzygnięcie, które opisuje jeden cios
        // dwojako, jest dokładnie tym, przed czym ostrzega `Player.takeDamage`.
        execution: wykonanie,
        mitigated: najciezszy.mitigated,
        tier: Stamina.impactTier(najciezszy.mitigated),
        crit: false,
        againstPlayer: false,
        at: { x: najciezszy.x, y: najciezszy.y },
        // Kierunek ciosu: od gracza do tego, co faktycznie oberwało.
        dir: { x: najciezszy.x - this.player.x, y: najciezszy.y - this.player.y },
        // ⚠ **`"onHit"` świadomie, mimo że gracz MA wypad przy zamachu.**
        // Wypad nie jest ruchem JEDNOKIERUNKOWYM należącym do akcji przez cały
        // przebieg (jak szarża, wypad wilka, odskok Szarego) — jest impulsem
        // tego samego rodzaju co kopnięcie: wychodzi i wraca, netto zero. Oba
        // sumują się przyrostowo i wygaszają nawzajem, więc cios, który trafił
        // w coś twardego, skraca własny wypad. To jest efekt pożądany.
        //
        // ⚠ Zamach gracza nie przechodzi przez `CombatAction`, więc deklaracja
        // stoi tu wprost. Gdyby kiedyś dostał akcję, ma dostać `ownsBody: false`
        // (wypad wraca, nie zawłaszcza ciała) i `attackerRecoil: "onHit"` —
        // **oba osobno**, bo jedno z drugiego nie wynika.
        attackerRecoil: "onHit",
      });
      if (skutki.attackerImpulse) applyImpulse(this, this.player, skutki.attackerImpulse);
    }

    // ── Pudło GRACZA zgłasza się, tak samo jak pudło przeciwnika ───────────
    // ⚠ Do tej iteracji `cuesFor`/`playCues` znały pudło tylko z jednej strony:
    // `Enemy.reportAttack` woła je dla siebie od Fazy 5A (patrz komentarz tam
    // i `src/entities/CLAUDE.md` „Chybiony cios ZGŁASZA SIĘ"), ale zamach
    // gracza, który nie trafił nikogo, kończył się tu cichym `return anyHit`
    // — jedynym sygnałem był kolor pierścienia zamachu (`spawnSwingFx`), bez
    // dźwięku i bez śladu świstu. `cuesFor`'s case "miss" już liczy z OBIEMA
    // stronami („Świst gra po OBU stronach: chybienie gracza też jest
    // informacją") — brakowało tylko tego wywołania, nie nowej architektury.
    //
    // Miejsce: TU, nie w `resolvePendingSwing` ani przy każdym wołającym z
    // osobna — `damageMatchingEnemies` jest już dziś jedynym wspólnym miejscem
    // dla zwykłego zamachu I Wiru ostrzy (patrz doc-comment funkcji), więc
    // jedno dopisanie tutaj daje feedback obu, bez trzeciej kopii tej samej
    // decyzji.
    //
    // `at`/`dir` liczone z kierunku CIOSU (`attackKat`) — tego samego kąta,
    // za którym idą poza, wypad i pierścień efektu. ⚠ Do 2026-09-27 stał tu
    // `facingVector`, czyli ZWROT skwantowany do ćwiartki: ślad pudła potrafił
    // lecieć o 90° obok zamachu, bo bramka zwrotu dopuszcza cel na skraju
    // przedniej półkuli (`OI-148`).
    if (!anyHit) {
      const origin = this.player.combatOrigin;
      const kat = this.player.attackKat;
      const dir = { x: Math.sin(kat), y: Math.cos(kat) };
      const at = { x: origin.x + dir.x * PLAYER.attackRange, y: origin.y + dir.y * PLAYER.attackRange };
      playCues(
        this,
        cuesFor({
          actionId: "player_swing",
          outcome: "miss",
          // ⚠ **`"whiff"`, bo to jest PUDŁO GEOMETRYCZNE — nikt nie był
          // w kształcie.** Warstwa 2 nie ma tu czego oceniać i nie wolno jej
          // tego nazwać „czystym" ciosem: `whiff` należy wyłącznie do warstwy 1
          // (`core/Proficiency.ts`), a rozróżnienie tego od Execution Missa
          // wyżej jest całą treścią §7. Ta sama deklaracja, którą składają
          // `Bear`/`Boar`, gdy gracz odszedł.
          execution: "whiff",
          mitigated: 0,
          tier: Stamina.impactTier(0),
          crit: false,
          againstPlayer: false,
          at,
          dir,
          // Ta sama deklaracja co przy trafieniu (linia wyżej w tej funkcji) —
          // własność AKCJI, nie tego konkretnego rozstrzygnięcia. `cuesFor`
          // jej dla "miss" nie czyta, ale pole jest wymagane i nie wolno mu
          // kłamać o tym, czym ten zamach jest.
          attackerRecoil: "onHit",
        }),
        at,
        dir,
      );
    }
    return anyHit;
  }

  /**
   * **Księgowość zabójstwa: XP, łup, respawn, zadanie, licznik.**
   *
   * ⚠ **WYCIĄGNIĘTE z `damageMatchingEnemies` 2026-09-04, bit w bit, z jednego
   * powodu: Krwawienie potrafi dobić.** Do tej daty ten blok był jedyną
   * ścieżką śmierci wroga, bo jedyną ścieżką obrażeń był cios — więc mógł
   * mieszkać wewnątrz pętli trafień. Tik `EffectSet` uderza poza tą pętlą,
   * a `Enemy.die()` sam z siebie nie przyznaje ani XP, ani łupu, ani
   * odrodzenia. Bez tego wyciągnięcia wróg dobity raną **znikałby bez nagrody
   * i bez respawnu, nie zgłaszając niczego** — ta sama klasa cichej awarii, co
   * `Quests.recordKill` pominięte przy nowej umiejętności.
   *
   * ⛔ **Ani jednej zmiany zachowania.** Te same wywołania, ta sama kolejność,
   * te same argumenty. `Quests.recordKill` dalej stoi obok zdarzenia, a nie
   * w nim, bo dziennik potrzebuje GATUNKU, a `enemyKilled` niesie wyłącznie
   * licznik pozostałych.
   */
  private creditKill(e: Enemy): void {
    this.remainingEnemies = Math.max(0, this.remainingEnemies - 1);
    GameEvents.emit(EVENT.enemyKilled, { remaining: this.remainingEnemies });
    // Credited here rather than via the event above because the quest log
    // needs the KIND, and widening a payload that only ever carried a
    // remaining-count for one listener's benefit would be the worse trade.
    Quests.recordKill(e.kind);
    Progression.addXp(e.xpReward);
    this.spawnXpPopup(e.x, e.y, e.xpReward);
    this.dropKillLoot(e.kind, e.x, e.y);
    this.scheduleRespawn(e.home, e.kind);
  }

  /**
   * Perform an ability the UI asked for. Validation lives here rather than in
   * the bar so a stale or spammed tap can never fire something twice, and the
   * cooldown is armed only after the effect actually happened.
   */
  /**
   * ⚠ `aimDirX/aimDirY` niosą kierunek z zakończonej sesji celowania —
   * **opcjonalnie**, bo ta sama funkcja obsługuje klawiaturę (1..4) i tapnięcie
   * bez przeciągnięcia. Dopisane jako pola opcjonalne zamiast osobnej ścieżki,
   * żeby koszt, cooldown i wszystkie odmowy zostały w JEDNYM miejscu — ogon
   * na dole tej metody. Druga ścieżka rozjechałaby się z nim przy pierwszej
   * zmianie reguły kosztu.
   */
  /**
   * **Wykonawca akcji gracza: deklaracja + cel → `pendingSwing`.** (P3.1)
   *
   * ⚠ **Cienki z założenia i ma taki zostać.** Nie odmierza czasu, nie zna
   * faz i nie rozstrzyga trafienia — tylko zamraża commit i oddaje cios
   * ścieżce, którą od C-01 jedzie każdy zamach. Mechanizmem pozostaje
   * `pendingSwing`; P3.1 przenosi DEKLARACJĘ, nie mechanizm.
   *
   * ⚠ **`strike` przychodzi z zewnątrz, a nie jest tu liczony.** Ciężkie
   * uderzenie bierze profil z broni (`currentStrike()`), ale Uderzenie tarczą
   * — jako jedyne w grze — z drugiej ręki (`shieldStrike()`). Wyliczenie
   * profilu tutaj zabetonowałoby założenie „cios zawsze pochodzi z broni
   * i wywróciłoby się przy pierwszej migracji, która je łamie.
   *
   * ⚠ **Nie płaci ani staminy, ani cooldownu.** Oba zostają we wspólnym
   * ogonie `onAbilityRequested`, PO wszystkich odmowach — inaczej akcja
   * odrzucona w walidacji pobierałaby zasoby. `Abilities` zostaje jedynym
   * właścicielem cooldownu.
   */
  private commitPlayerAction(
    action: PlayerAction,
    target: Enemy,
    strike: StrikeProfile,
    now: number,
  ): void {
    // Zaznacz, żeby było widać, kto obrywa — i żeby autoatak po ciosie miał
    // w co uderzyć. `selectTarget`, nie `setTarget`: ten drugi PRZEŁĄCZA
    // i odznaczyłby już wybranego (patrz Szarża).
    this.selectTarget(target);
    // ⚠ W przestrzeni CIAŁ — patrz `bodyVectorTo`.
    const doCelu = this.bodyVectorTo(target);
    this.player.aimAttackAt(doCelu.x, doCelu.y);
    // ⚠ **Animacja dostaje `windupMs * 2`**, bo trafienie wypada w jej POŁOWIE
    // (`PLAYER.swingHitFraction`) — tam ostrze jest maksymalnie wyprostowane.
    // Ukorzenienie obejmuje zamach ORAZ bezbronność po nim, i to jest cały
    // „commitment" tej akcji.
    const zamach = this.player.triggerAttack(now, {
      durationMs: action.windupMs * 2,
      // ⚠ Od P3.5 przez politykę z deklaracji (`ActionRoot`). Dla obu akcji
      // składanych na naciśnięciu jest to `windupMs + recoveryMs` — ta sama
      // liczba, którą to miejsce liczyło wprost.
      rootMs: rootMsDlaAkcji(action),
      // Jak cios WYGLĄDA na modelu 3D (Uderzenie tarczą → klip tarczy).
      poza: action.poza,
    });
    // ⚠ **Zużycie broni jest DEKLARACJĄ akcji, nie regułą wykonawcy** (P3.2).
    // Uderzenie tarczą świadomie nie zużywa oręża — zużywa się to, czym się
    // uderza. Gdyby wykonawca zużywał zawsze, ta decyzja zniknęłaby po cichu.
    if (action.wearsWeapon) this.wearWeapon();
    // ⚠ **Obrażenia NIE padają tutaj.** Cios ląduje w `pendingSwing`:
    // rozstrzygnięcie po `windupMs`, z ponownym testem zasięgu w chwili
    // trafienia (`damageLockedTarget`). Cel, który zdąży odejść, nie dostaje
    // nic — a koszt i cooldown i tak zostały zapłacone.
    this.pendingSwing = {
      resolveAt: now + action.windupMs,
      target,
      dirX: zamach.dirX,
      dirY: zamach.dirY,
      fxRadius: zamach.radius,
      strike,
      allowFumble: action.allowFumble,
      // ⚠ **Mnożnik z RESOLVERA, nie z deklaracji** (P3.4). Jedynym
      // właścicielem tej liczby jest `AbilitySpec` — ta sama droga, którą
      // czyta podgląd celowania i którą od początku czytał drugi wykonawca
      // ciosu (`landRushStrike` przy Wypadzie). Deklaracja niosła wcześniej
      // KOPIĘ tego samego pola configu, pilnowaną asercją równości; kopia
      // pilnowana testem to nadal kopia.
      //
      // ⚠ `strike` jest tu WYMAGANY, a nie ozdobny: `resolveAbility` składa
      // kształt z zasięgu i łuku TEGO ciosu, więc Uderzenie tarczą musi pytać
      // przez `shieldStrike()`, a nie przez profil broni.
      damageMul: multiplierFor(resolveAbility(action.id, strike), "primary"),
      onHit: onHitDlaSwingu(action),
    };
  }
  /**
   * **Kto obrywa tym ciosem — dwie drogi, jedna odpowiedź.**
   *
   * ⚠ **Wyprowadzone 2026-09-08 z TRZECH ZNAKOWO IDENTYCZNYCH kopii**
   * (`heavyStrike`, `rend`, `shieldBash`). Kopie różniły się wyłącznie
   * identyfikatorem podanym do `resolveAbility` i komentarzem; sprawdzone
   * porównaniem tekstu bez komentarzy i białych znaków. Ich własne komentarze
   * mówiły to wprost („Dwie drogi do celu, jedna ścieżka ciosu — jak Ciężkie
   * uderzenie"), więc czwarta umiejętność celowana dopisałaby czwartą kopię,
   * a poprawka reguły odmowy musiałaby trafić we wszystkie — bez szansy, żeby
   * `tsc` zauważył pominięcie.
   *
   * ⛔ **Tylko dla umiejętności JEDNOCELOWYCH z tapnięciem-jak-autoatak.**
   * Typ `id` jest zawężony celowo: `charge` i `lunge` mają WŁASNE reguły i nie
   * wolno ich tu wciągać. Szarża mówi innym językiem odmów („Szarża potrzebuje
   * celu", „Za blisko na szarżę") i wymaga wolnego toru; Wypad przy
   * nielegalnym celu **nie odmawia**, tylko schodzi do skoku kierunkowego.
   * Wspólna funkcja z różnymi wejściami to dokładnie ten sam błąd, co dwa różne
   * stożki (patrz `src/core/CLAUDE.md`, §„JEDNO ŹRÓDŁO `strike`").
   *
   * @returns cel do uderzenia, albo `null` = **umiejętność się NIE ODBYWA**.
   *   ⚠ Wołający MUSI wtedy wyjść z `onAbilityRequested` przez `return`, a nie
   *   przez `break` — wyjście przed `Abilities.startCooldown`/`Stamina.spend`
   *   na końcu funkcji jest tym, co czyni odmowę darmową. Powód odmowy jest już
   *   wypowiedziany (albo świadomie przemilczany) tutaj.
   */
  private resolveCastTarget(
    id: Extract<AimableAbilityId, "heavyStrike" | "rend" | "shieldBash">,
    strike: StrikeProfile,
    p: { aimTarget?: Enemy; aimDirX?: number; aimDirY?: number },
  ): Enemy | null {
    if (p.aimTarget) {
      // ⚠ Ponowna WALIDACJA, nie ponowne szukanie — i nie podstawiamy nikogo
      // innego, gdy wskazany przestał być legalny. Cisza jest tu poprawna:
      // przy przeciągnięciu podgląd już odsiał tego wroga, więc to jest
      // bezpiecznik, a nie główny kanał komunikatu.
      const spec = resolveAbility(id, strike);
      const kandydat = this.aimCandidates().find((k) => k.ref === p.aimTarget);
      const legalny =
        !!kandydat &&
        coversTarget(spec.shape, this.aimFrame(), { x: p.aimDirX ?? 0, y: p.aimDirY ?? 0 }, kandydat);
      return legalny ? p.aimTarget : null;
    }

    // ── Szybkie tapnięcie: DOKŁADNIE reguły zwykłego ataku ──────────────────
    // ⚠ Te same trzy odmowy, te same słowa i ten sam dławik co autoatak
    // (`announceAttackRefusal`). Osobny zestaw komunikatów dla ciosu, który
    // sprawdza dokładnie te same warunki, uczyłby gracza dwóch języków na jedną
    // regułę.
    //
    // ⚠⚠ **TRZY, nie cztery: bramki RUCHU tu świadomie nie ma** (dopisane
    // 2026-09-11, gdy autoatak dostał czwartą odmowę „Zatrzymaj się").
    // Umiejętność **wolno** wyprowadzić w marszu — `commitPlayerAction`
    // ukorzenia ciało dopiero przy zamachu, więc zatrzymanie jest SKUTKIEM
    // akcji, nie jej warunkiem. Autoatak jest rytmem i musi go poprzedzić
    // decyzja o zatrzymaniu; umiejętność JEST decyzją, płaci cooldownem
    // i wysiłkiem, i to ona zatrzymuje gracza.
    // ⚠ **Tę asymetrię widać teraz z ekranu** (⚔ w marszu mówi „Zatrzymaj
    // się", Ciężkie uderzenie w marszu wychodzi) — czyli jest do OCENY RĘKĄ,
    // czy czyta się jako rola obu wejść, czy jako kaprys. ⛔ Nie „naprawiaj"
    // jej dokładając tu bramki ruchu: zabrałoby to umiejętnościom jedyną
    // rzecz, którą mają nad autoatakiem w biegu.
    //
    // ⚠ **`strike.reach` to zasięg BRONI** (od 2026-08-26), więc „Za daleko"
    // pada tu DOKŁADNIE wtedy, kiedy przy autoataku — ani sekundy wcześniej.
    // To jest cała treść zgłoszenia, które tę zmianę wywołało: umiejętność na
    // wybranym celu nie może odmawiać w stanie, w którym zwykły cios trafia.
    const cel = this.currentTarget;
    if (!cel || cel.isDead) {
      this.announceAttackRefusal("Brak celu");
      return null;
    }
    if (!this.targetInReach(cel, strike.reach, strike.minReach)) {
      this.announceAttackRefusal("Za daleko");
      return null;
    }
    if (!this.canStrikeFacing(cel)) {
      this.announceAttackRefusal("Odwróć się");
      return null;
    }
    return cel;
  }

  private onAbilityRequested(p: {
    id: AbilityId;
    aimDirX?: number;
    aimDirY?: number;
    /** Przeciwnik wskazany RĘCZNIE (kształt `directionTarget`). `undefined`
     *  znaczy „tapnięcie" i wtedy obowiązuje dzisiejsza blokada celu. */
    aimTarget?: Enemy;
  }): void {
    if (!this.player || this.player.isDead) return;
    const now = this.time.now;
    if (!Abilities.isReady(p.id, now)) return;

    const def = getAbility(p.id);
    // After the readiness check, so a tap on a cooling-down button stays silent.
    Sfx.play("ability");
    switch (p.id) {
      case "cleave": {
        // ⚠ **Kierunek jest ANALOGOWY i przychodzi z celowania**, a nie
        // z czterokierunkowego `moveDir` jak przed prototypem.
        //
        // ⚠ **Tapnięcie też niesie kierunek od 2026-09-11**: sesja startuje na
        // osi INTENCJI DOMYŚLNEJ, więc klin leci w zaznaczony cel, o ile ten
        // stoi w przedniej półkuli (`defaultAimIntent` + `facingGated`). Zwrot
        // postaci zostaje wariantem zapasowym — i tą drogą chodzi dziś już tylko
        // KLAWIATURA, która sesji celowania nie otwiera (`AbilityBar.request`).
        // ⛔ To nie jest obejście bramki zwrotu: cel za plecami nie przechodzi.
        const f = this.player.facingVector;
        this.castCleave(now, p.aimDirX ?? f.x, p.aimDirY ?? f.y);
        break;
      }
      case "dodge": {
        const d = def as typeof ABILITIES.dodge;
        // Aim with the stick if it's being held, otherwise roll where you face.
        if (!this.player.dash(InputState.move.clone(), d.dashPx, d.durationMs, d.invulnerableMs)) return;
        // ⚠ **Jedyny koszt w grze mnożony przez OBCIĄŻENIE** (razem ze
        // sprintem). Po `dash()`, więc odmówiony przewrót nic nie kosztuje —
        // ta sama reguła, co przy cooldownie.
        Stamina.spend(STAMINA.costs.dodge, "dodge", now, Equipment.loadMultiplier);
        // Rolling out of a swing abandons it (C-01 decision 2): the blow never
        // lands, while the cooldown and the durability roll it already spent
        // stand. Without this the dash would be a free hit — commit to a
        // swing, dodge the counter-attack, and still collect the damage from
        // the swing you ran away from. Deliberately after dash() succeeded, so
        // a refused dash doesn't silently eat the swing.
        this.pendingSwing = null;
        expandingRing(this, {
          x: this.player.x, y: this.player.y, radius: 12, color: d.color,
          alpha: 0.5, scale: 2.4, duration: 260, depth: DEPTH.entities + this.player.y - 1,
        });
        break;
      }
      case "heavyStrike": {
        // ⚠ **Czasy, koszt, mnożnik i `allowFumble` NIE stoją już w tej
        // gałęzi** — są deklaracją w `core/combat/PlayerAction.ts` (P3.1).
        // Tutaj zostaje wyłącznie to, czego nie da się opisać danymi: WYBÓR
        // CELU, bo zależy od stanu świata w tej klatce.
        const akcja = PLAYER_ACTIONS.heavyStrike;
        const strike = this.currentStrike();
        // ── Dwie drogi do celu, jak w Szarży; jedna ścieżka ciosu poniżej ──
        // ⚠ `return`, nie `break` — patrz `resolveCastTarget`: wyjście przed
        // kosztem i cooldownem na końcu tej funkcji jest tym, co czyni odmowę
        // darmową.
        const cel = this.resolveCastTarget("heavyStrike", strike, p);
        if (!cel) return;

        this.commitPlayerAction(akcja, cel, strike, now);
        break;
      }
      case "rend": {
        // ⚠ **Ta gałąź jest KRÓTSZA od Ciężkiego uderzenia o dokładnie zero
        // linijek i to jest dowód, że kontrakt P3 zniósł ten przypadek.**
        // Czasy, ukorzenienie, `allowFumble`, zużycie broni, mnożnik obrażeń
        // ORAZ całe Krwawienie stoją w `core/combat/PlayerAction.ts`; tutaj
        // zostaje wyłącznie to, czego nie da się opisać danymi: WYBÓR CELU,
        // bo zależy od stanu świata w tej klatce.
        //
        // ⛔ **Ani jednej liczby o Krwawieniu tutaj.** Nałożenie dzieje się
        // w `damageMatchingEnemies`, pod tą samą bramką trafienia co obrażenia
        // — nagroda wisi na CIOSIE, który doszedł, nie na naciśnięciu.
        const akcja = PLAYER_ACTIONS.rend;
        const strike = this.currentStrike();
        // ── Dwie drogi do celu, jedna ścieżka ciosu — jak Ciężkie uderzenie ─
        const cel = this.resolveCastTarget("rend", strike, p);
        if (!cel) return;

        this.commitPlayerAction(akcja, cel, strike, now);
        break;
      }
      case "shieldBash": {
        // ⚠ Czasy, koszt, mnożnik, `allowFumble`, zużycie broni i nagroda za
        // trafienie stoją w `core/combat/PlayerAction.ts` (P3.2). Tutaj zostaje
        // to, czego nie da się opisać danymi: BRAMKA SPRZĘTOWA i WYBÓR CELU.
        const akcja = PLAYER_ACTIONS.shieldBash;
        // ⚠ **Profil z DRUGIEJ RĘKI, nie z broni** — patrz `shieldStrike()`.
        // To jedyna umiejętność w grze, która nie woła `currentStrike()`,
        // i dlatego profil jest PARAMETREM wykonawcy, a nie polem deklaracji.
        const strike = this.shieldStrike();

        // ── Bramka sprzętowa: bez tarczy umiejętność NIE ISTNIEJE ─────────
        // ⚠ **Pierwsza odmowa, przed wszystkimi innymi**, bo odpowiada na
        // inne pytanie: tamte mówią „nie tak", ta mówi „nie masz czym".
        // Sprawdzamy `blockSpec`, a nie samą obecność czegokolwiek w slocie:
        // `offhand` może kiedyś nosić pochodnię albo kołczan, a tarczą jest
        // to, co potrafi blokować. Jedno źródło prawdy o tym, czym jest
        // tarcza, zamiast listy nazw przedmiotów.
        //
        // ⚠ Broń dwuręczna wypada stąd sama: `usesBothHands` blokuje slot
        // `offhand`, więc `blockSpec` jest wtedy `null`. Żadnej osobnej
        // gałęzi — i to jest właściwe, bo to nie jest osobna reguła.
        if (!Equipment.blockSpec) {
          this.announceAttackRefusal("Potrzebujesz tarczy");
          return;
        }

        // ── Dwie drogi do celu, jedna ścieżka ciosu — jak Ciężkie uderzenie ─
        // ⚠ **PO bramce sprzętowej, i ta kolejność jest nośna.** „Nie masz
        // czym" musi paść przed „Brak celu": inaczej gracz bez tarczy usłyszy
        // najpierw, że nie ma w co uderzyć, i pójdzie szukać wroga zamiast
        // tarczy. `strike` to profil z DRUGIEJ RĘKI — jedyne miejsce, w którym
        // ta funkcja dostaje coś innego niż `currentStrike()`.
        const cel = this.resolveCastTarget("shieldBash", strike, p);
        if (!cel) return;

        this.commitPlayerAction(akcja, cel, strike, now);
        break;
      }
      case "lunge": {
        const l = def as typeof ABILITIES.lunge;
        const strike = this.currentStrike();
        // ⚠ Zasięg WYPROWADZONY Z BRONI, liczony raz i użyty wszędzie niżej —
        // patrz `rangeReachMul`. Drugi rachunek tej liczby byłby drugim
        // miejscem do przestrojenia.
        const zasieg = strike.reach * l.rangeReachMul;
        // ── Kierunek lotu. Przy przeciągnięciu analogowy, przy tapnięciu
        //    zwrot postaci — tak samo jak `Szerokie cięcie`.
        const f = this.player.facingVector;
        const dirX = p.aimDirX ?? f.x;
        const dirY = p.aimDirY ?? f.y;

        // ── Kogo (jeśli kogokolwiek) ten skok ściga ───────────────────────
        let cel: Enemy | null = null;
        if (p.aimTarget) {
          // ⚠ Ponowna WALIDACJA, nie ponowne szukanie — i nie podstawiamy
          // nikogo innego, gdy wskazany przestał być legalny. Nielegalny
          // wskazany NIE odmawia całej akcji: schodzi do skoku kierunkowego,
          // czyli do drugiego, pełnoprawnego użycia tej umiejętności.
          const spec = resolveAbility("lunge", strike);
          const kandydat = this.aimCandidates().find((k) => k.ref === p.aimTarget);
          // ⚠ **Wolna linia jest częścią legalności, nie osobną odmową** —
          // dzięki temu cel za pniem po prostu schodzi do skoku kierunkowego,
          // czyli do drugiego, pełnoprawnego użycia tej umiejętności. Patrz
          // `pathClearTo`: fizyka tego nie złapie, bo skok tuneluje przez pień.
          const legalny =
            !!kandydat &&
            coversTarget(spec.shape, this.aimFrame(), { x: dirX, y: dirY }, kandydat) &&
            this.pathClearTo(p.aimTarget);
          if (legalny) cel = p.aimTarget;
        } else if (this.currentTarget && !this.currentTarget.isDead) {
          // ⚠ **Ta sama miara co w podglądzie i w trafieniu** — prześwit
          // (`surfaceGap`), bo `targetInReach` jest dokładnie tym, czym mierzy
          // `AbilitySpec`. Własny rachunek tutaj rozjechałby się z kształtem
          // przy pierwszej zmianie i nikt by tego nie zobaczył.
          // ⚠ Ten sam predykat toru co wyżej — inaczej tapnięcie obchodziłoby
          // blokadę, którą przeciągnięcie respektuje.
          if (this.targetInReach(this.currentTarget, zasieg) && this.pathClearTo(this.currentTarget)) {
            cel = this.currentTarget;
          }
        }

        // ⚠ **Brak celu NIE JEST odmową — to drugie użycie Wypadu.** Skok
        // w pustkę jest przemieszczeniem: unikiem, ucieczką, repozycją. Nic
        // nie trafia, więc nie dostaje ani zwrotu cooldownu, ani utrzymanego
        // natarcia — kosztuje **pełne `cooldown`**. To jest cała wycena obu
        // użyć i jedyna rzecz, która nadaje bazie 14 s sens; bramka „Wypad
        // potrzebuje celu" (usunięta 2026-08-25) zamykała tę drogę, przez co
        // zwrot był w praktyce bezwarunkowy.
        //
        // ⚠ **Nie ma też gałęzi „za blisko"** — Wypad wypełnia martwą strefę
        // Szarży, więc dolna granica odtworzyłaby dokładnie to, czego ma nie być.
        // Lot liczony z PEŁNEGO zasięgu, nie z faktycznego dystansu do celu:
        // dobiegnięcie i tak kończy pościg wcześniej, a jedna formuła mniej
        // zależna od pozycji to jedna rzecz mniej do przestrojenia.
        const lotMs = (zasieg / l.speedPxPerSec) * 1000;
        if (cel) {
          this.selectTarget(cel);
          this.pendingRush = {
            kind: "chase",
            target: cel,
            // Zapas 1,6× pokrywa cel, który się cofa; sufit stoi w configu.
            endsAt: now + Math.min(lotMs * 1.6, l.maxDurationMs),
            speed: l.speedPxPerSec,
            arrival: "strike",
            // ⚠ **Czasy, mnożnik, `allowFumble`, zużycie broni i OBIE nagrody
            // za trafienie NIE stoją już w tej gałęzi** — są deklaracją
            // w `core/combat/PlayerAction.ts` (P3.5). Tutaj zostaje wyłącznie
            // to, czego nie da się opisać danymi: kierunek, wybór celu, lot
            // i wycena dwóch użyć.
            action: PLAYER_ACTIONS.lunge,
          };
        } else {
          /* ⚠⚠ **SKOK KIERUNKOWY TEŻ MUSI SIĘ ZATRZYMAĆ NA TERENIE — poprawka
             2026-09-05, po zgłoszeniu „Krok i Cios przenika przez trzy drzewa".**

             Poprzednia runda zabezpieczyła wyłącznie POŚCIG (`pathClearTo` przy
             wyborze celu) i tym samym **pogorszyła objaw**: zablokowany cel
             schodzi tutaj, a ta gałąź nie pytała o teren w ogóle. Skok leci
             900 px/s, czyli **15 px na krok fizyki 60 Hz**, przy pudełkach pni
             głębokich na 13–15 px — więc Arcade nie miał czego wykryć i postać
             przelatywała przez kolejne pnie jak przez powietrze.

             Naprawa jest w czasie, nie w nowej mechanice: pytamy `NavGrid`
             (ta sama siatka, ten sam predykat co `pathClearTo`) o pierwszy
             punkt, w którym pas ciała przestaje być wolny, i **skracamy lot do
             tego dystansu**. Prędkość, kierunek, koszt i cooldown zostają
             nietknięte — skok po prostu kończy się przed pniem zamiast za nim.

             ⚠ Zatrzymanie liczy się od CIAŁA (`combatOrigin`), bo to ono
             przeciska się przez teren — tak samo jak w `pathClearTo`. */
          const nav = movementContextFor(this).nav;
          let dystans = zasieg;
          if (nav) {
            const o = this.player.combatOrigin;
            const blok = nav.firstBlockedOn(
              o.x,
              o.y,
              o.x + dirX * zasieg,
              o.y + dirY * zasieg,
              PLAYER.bodyWidth,
            );
            if (blok) dystans = Math.min(zasieg, Math.hypot(blok.x - o.x, blok.y - o.y));
          }
          const lotDoPrzeszkody = (dystans / l.speedPxPerSec) * 1000;
          // ⚠ **Bez zapasu 1,6×**: tu zegar jest JEDYNYM końcem lotu, więc
          // zapas przeniósłby postać dalej niż zasięg, którym ta umiejętność
          // się opisuje — a przy pościgu zapas istnieje tylko po to, żeby
          // dogonić cofający się cel.
          this.pendingRush = {
            kind: "dash",
            dirX,
            dirY,
            endsAt: now + Math.min(lotDoPrzeszkody, l.maxDurationMs),
            speed: l.speedPxPerSec,
          };
        }
        // Przerywa niedokończony zamach — jak Szarża i Unik. Bez tego można by
        // zacząć cios, odjechać z niego Wypadem i mimo to zainkasować obrażenia.
        // To jest zarazem powód, dla którego `landRushStrike` może pisać do
        // `pendingSwing` bez własnej bramki: slot został tu jawnie zwolniony.
        this.pendingSwing = null;
        break;
      }
      case "charge": {
        const c = def as typeof ABILITIES.charge;
        // ── Dwie drogi do celu, jedna mechanika ruchu poniżej ──────────────
        //
        // ⚠ **RĘCZNE WSKAZANIE BIJE BLOKADĘ CELU.** Gracz, który przeciągnął
        // palec w stronę drugiego wilka, wydał polecenie — blokada celu jest
        // wygodą, nie autorytetem, i nie ma prawa go nadpisać.
        // ⚠ **JEDNO wyrażenie mierzące dystans Szarży, użyte przez obie drogi
        // i przez czas trwania biegu.** Rozpisane dwa razy rozjechałoby się
        // przy pierwszej zmianie konwencji, a `tsc` by tego nie zobaczył.
        // Środek DUSZKA do środka DUSZKA — konwencja Szarży, nietknięta
        // (patrz `AimFrame` w `core/AbilitySpec.ts`).
        const dystansDo = (t: Enemy): number => Math.hypot(t.x - this.player.x, t.y - this.player.y);
        let target: Enemy | null;
        if (p.aimTarget) {
          // ⚠ **Ponowna walidacja, nie ponowne szukanie.** Cel mógł w tej
          // klatce umrzeć albo wyjść z pasma; wtedy Szarża się NIE odbywa
          // (zero kosztu, zero cooldownu) i **nie podstawiamy nikogo innego** —
          // podmiana celu pod palcem jest gorsza niż brak akcji.
          const spec = resolveAbility("charge", this.currentStrike());
          const kandydat = this.aimCandidates().find((k) => k.ref === p.aimTarget);
          // ⚠ **Wolny tor jest częścią legalności — Szarża jest ATOMOWA.**
          // Inaczej niż Wypad nie ma trybu kierunkowego, więc zablokowany cel
          // nie ma na co zejść: umiejętność po prostu się nie odbywa (zero
          // kosztu, zero cooldownu). Cisza jest tu poprawna i spójna
          // z sąsiednimi odmowami tej gałęzi — do tego przy przeciągnięciu
          // podgląd i tak odsiał już tego wroga (`aimCandidatesFor`), więc to
          // jest bezpiecznik, a nie główny kanał komunikatu.
          const legalny =
            !!kandydat &&
            coversTarget(spec.shape, this.aimFrame(), { x: p.aimDirX ?? 0, y: p.aimDirY ?? 0 }, kandydat) &&
            this.pathClearTo(p.aimTarget);
          if (!legalny) return;
          target = p.aimTarget;
        } else {
          // ── Szybkie tapnięcie: DOKŁADNIE dzisiejsze zachowanie ────────────
          // ⚠ Każda odmowa mówi, DLACZEGO, i żadna nie pali cooldownu —
          // `return` wychodzi przed `startCooldown` na końcu tej funkcji.
          // Cichy przycisk jest na dotyku nieodróżnialny od zepsutego.
          //
          // ⚠ **Nie wybieramy wtedy nikogo automatycznie.** Brak celu ma
          // zostać brakiem celu; podmiana zamieniłaby Szarżę w autocelownik.
          target = this.currentTarget;
          if (!target || target.isDead) {
            this.sayAtPlayer("Szarża potrzebuje celu");
            return;
          }
          // ⚠ Dystans MIĘDZY ŚRODKAMI DUSZKÓW — konwencja Szarży, nietknięta.
          // Przepięcie na `combatOrigin`/prześwit przestroiłoby jej pasmo przy
          // niezmienionych liczbach (patrz `AimFrame`).
          const dist = dystansDo(target);
          if (dist < c.minRange) {
            this.sayAtPlayer("Za blisko na szarżę");
            return;
          }
          if (dist > c.maxRange) {
            this.sayAtPlayer("Za daleko na szarżę");
            return;
          }
          // ⚠ **Tapnięcie omija podgląd, więc test toru musi być TUTAJ.**
          // Ta droga bierze cel z blokady celu i nigdy nie widziała ani
          // kandydatów, ani znaku ✕ — bez tej bramki Szarża wciąż ruszałaby
          // w drzewo. Komunikat idzie tym samym kanałem co trzy powyżej;
          // cisza po naciśnięciu jest na dotyku nieodróżnialna od zepsutego
          // przycisku.
          if (!this.pathClearTo(target)) {
            this.sayAtPlayer("Coś stoi na drodze");
            return;
          }
        }
        // ⚠ **Szarża ZAZNACZA swój cel — bez tego dobiega i staje.**
        // Zgłoszone z rozgrywki: po ręcznym wskazaniu postać przylatywała do
        // wroga i nic nie robiła. Powód: na końcu lotu szarża uzbraja autoatak
        // (`autoAttackArmed`), ale ten strzela do `currentTarget` — a przy
        // ręcznym wskazaniu blokada celu nigdy nie była ruszana, więc uzbrojony
        // atak nie miał w co uderzyć (albo, co gorsza, celował w kogoś innego,
        // kto został zaznaczony wcześniej).
        //
        // ⚠ `selectTarget`, nie `setTarget`: ten drugi PRZEŁĄCZA, więc szarża
        // na już zaznaczonego wroga (ścieżka tapnięcia) odznaczyłaby go
        // i zepsuła dokładnie ten przypadek, który dziś działa.
        //
        // Zaznaczenie na STARCIE lotu, nie na końcu: pierścień celu jest wtedy
        // widoczny przez cały przelot, więc widać, do kogo się leci.
        this.selectTarget(target);
        this.pendingRush = {
          // Szarża ZAWSZE ściga wybranego — nie zna trybu kierunkowego.
          kind: "chase",
          target,
          // Czas z DYSTANSU, nie odwrotnie — prędkość jest stała, więc szarża
          // przez pół ekranu trwa dłużej niż tuż-tuż. Zapas 1,6× pokrywa cel,
          // który się cofa; twardy sufit i tak stoi w `maxDurationMs`.
          endsAt: now + Math.min((dystansDo(target) / c.speedPxPerSec) * 1600, c.maxDurationMs),
          speed: c.speedPxPerSec,
          // Szarża sama nie zadaje obrażeń — patrz `ABILITIES.charge`.
          arrival: "armAutoAttack",
        };
        // Przerywa niedokończony zamach — dokładnie jak Unik. Bez tego można by
        // zacząć cios, odjechać z niego szarżą i mimo to zainkasować obrażenia.
        this.pendingSwing = null;
        // Ten sam dźwięk, którym dzik ogłasza, że się zdecydował. Reguła
        // „to jest bieg, który się zaczął i nie zatrzyma" jest ta sama,
        // a plik już istnieje — zero nowego audio.
        Sfx.play("charge");
        expandingRing(this, {
          x: this.player.x, y: this.player.y, radius: 14, color: c.color,
          alpha: 0.5, scale: 2.8, duration: 300, depth: DEPTH.entities + this.player.y - 1,
        });
        break;
      }
      case "whirlwind": {
        const w = def as typeof ABILITIES.whirlwind;
        // Reuse the swing pose + weapon arc, but explicitly WITHOUT the basic
        // attack's root: this ability's whole job is answering a swarm, and
        // pinning the player in the middle of one for the swing's length would
        // work against it. See Player.rootedUntil.
        //
        // ⚠⚠ **Celowanie PRZED `triggerAttack` — `OI-150`, 2026-09-27.** Wir
        // nie ma celu, więc do tej daty poza czytała `attackRad` z POPRZEDNIEGO
        // ciosu. Zmierzone na żywo: postać zwrócona na 270° po ciosie na 90°
        // obracała model na 90°, a `guardKat` (w oknie pozy = `attackRad`)
        // kierował osłonę razem z nim — **przez cały Wir tarcza kryła plecy**.
        // Odziedziczone po 2D, gdzie ten sam stary `attackDir` wybierał rząd
        // arkusza. Wir bije wokół siebie, więc jedynym uczciwym kierunkiem pozy
        // jest ZWROT postaci — ta sama reguła, którą ma łuk bez celu.
        this.player.aimAttackAlongMovement();
        this.player.triggerAttack(now, { roots: false, poza: "wir" });
        // One swing, one wear roll — however many it catches. This is exactly
        // the "multi-target attack" case the rule was written for.
        this.wearWeapon();
        // Takes the active variant's DAMAGE TYPE (whirling a sword held for a
        // thrust still cuts, and a hammer never cuts), but keeps its own
        // shape: the radius below is the ability's, deliberately not the
        // variant's arc — a narrow thrust must not turn the answer-a-swarm
        // ability into a single-target poke.
        this.damageEnemiesInCircle(
          this.player.x,
          this.player.y,
          w.radius,
          w.damageMultiplier,
          this.currentStrike(),
        );
        expandingRing(this, {
          x: this.player.x, y: this.player.y, radius: w.radius * 0.4, color: w.color,
          alpha: 0.55, scale: 2.6, duration: 320, depth: DEPTH.entities + this.player.y + 1,
        });
        this.cameras.main.shake(120, 0.005);
        break;
      }
      case "warcry": {
        const c = def as typeof ABILITIES.warcry;
        this.player.startDamageBuff(c.damageBonus, c.durationMs, c.name, abilityIconKey("warcry"));
        expandingRing(this, {
          x: this.player.x, y: this.player.y, radius: 16, color: c.color,
          alpha: 0.5, scale: 3.2, duration: 420, depth: DEPTH.entities + this.player.y - 1,
        });
        break;
      }
    }
    // ⚠ Koszt umiejętności obok `startCooldown`, czyli **po** wszystkich
    // odmowach (`return` wyżej) — nieudana Szarża nie pali ani cooldownu, ani
    // staminy. Unik ma własny wydatek wyżej, bo jako jedyny mnoży się przez
    // obciążenie; `staminaCost` nie ma go w configu właśnie po to, żeby nie
    // zapłacił dwa razy.
    const koszt = "staminaCost" in def ? def.staminaCost : 0;
    if (koszt > 0) Stamina.spend(koszt, "ability", now);
    Abilities.startCooldown(p.id, now);
  }

  /* ── Celowanie kierunkowe: sesja, podgląd, commit ──────────────────────
     Prototyp `Szerokiego cięcia` (2026-08-23). Cykl życia pointera należy do
     `AbilityBar`; TUTAJ mieszka stan sesji i wszystko, co dzieje się w
     przestrzeni świata. */

  /**
   * **Czy tę umiejętność obowiązuje bramka zwrotu.**
   *
   * ⚠ **To nie jest nowa reguła — to NAZWANIE reguły, którą kod ma od dawna.**
   * Bramkowane są akcje, które MACHAJĄ orężem: trzy chodzące przez
   * `resolveCastTarget` plus Szerokie cięcie, którego klin z konstrukcji
   * wychodzi przed postać. Niebramkowane są te, które PRZENOSZĄ CIAŁO — Szarża
   * i Wypad — bo obraca je sam bieg (`Player.driveLocked` pisze zwrot co
   * klatkę lotu), a nie automat celowania.
   *
   * ⚠ **Unia, nie tablica stringów**: skasowanie albo przemianowanie
   * umiejętności ma zapalić `tsc`, a nie po cichu wypaść z listy.
   */
  private facingGated(
    id: AimableAbilityId,
  ): id is Extract<AimableAbilityId, "heavyStrike" | "rend" | "shieldBash" | "cleave"> {
    return id === "heavyStrike" || id === "rend" || id === "shieldBash" || id === "cleave";
  }

  /**
   * **Intencja domyślna gestu: „zrób to mojemu celowi".**
   *
   * ⚠ **Odpowiada na pytanie, na które odpowie TAPNIĘCIE**, i tylko dlatego
   * wolno jej karmić podgląd. Nie wybiera nikogo sama z siebie, nie szuka
   * najbliższego i nie dotyka blokady celu — czyta wyłącznie `currentTarget`.
   *
   * ⚠ **Bramka zwrotu jest tu pytana TYM SAMYM predykatem, którym odmówi
   * commit** (`canStrikeFacing`, razem z jego furtką dla nachodzących ciał).
   * Drugi rachunek „czy przed sobą" byłby lustrem — a lustra rozjeżdżają się
   * cicho (`src/core/CLAUDE.md`).
   *
   * ⛔ **Nie obraca postaci i nie ma prawa tego robić.** Obraca się wyłącznie
   * OŚ CELOWANIA, czyli to, co gracz i tak wskazałby palcem. Automatyczny
   * obrót do celu został usunięty 2026-08-23 z powodem zmierzonym w rozgrywce
   * (wilk okrążający od pleców przestawał mieć konsekwencję) i tu nie wraca.
   */
  private defaultAimIntent(id: AimableAbilityId): { intent: Enemy | null; dirX: number; dirY: number } {
    const f = this.player.facingVector;
    const t = this.currentTarget;
    if (!t || t.isDead || !t.active) return { intent: null, dirX: f.x, dirY: f.y };
    // Cel za plecami: umiejętność bramkowana zwrotem po prostu go nie dostanie,
    // więc oś zostaje na zwrocie postaci, a podgląd pokaże pustkę — czyli to
    // samo, co powie „Odwróć się". Szarża i Wypad bramki nie mają i celują
    // w cel także za plecami (dziś też tak działają).
    if (this.facingGated(id) && !this.canStrikeFacing(t)) return { intent: null, dirX: f.x, dirY: f.y };
    const spec = resolveAbility(id, this.currentStrike());
    const kandydat = this.aimCandidates().find((k) => k.ref === t);
    const os = kandydat ? aimVectorTo(spec.shape, this.aimFrame(), kandydat) : null;
    // Brak osi = cel stoi dokładnie na napastniku. Zwrot postaci jest wtedy
    // jedyną sensowną odpowiedzią, a sam cel zostaje intencją.
    if (!os) return { intent: t, dirX: f.x, dirY: f.y };
    return { intent: t, dirX: os.x, dirY: os.y };
  }

  /**
   * Podgląd pojawia się NATYCHMIAST — bez progu czasowego, patrz `ABILITY_AIM`.
   *
   * ⚠ **Wycelowany w INTENCJĘ DOMYŚLNĄ, nie w zwrot postaci** (2026-09-11).
   * Do tej daty oś startowała zawsze na czterokierunkowym zwrocie, więc
   * tapnięcie Szerokiego cięcia z zaznaczonym wrogiem 40° od osi wyprowadzało
   * zamach, który tego wroga nie obejmował — przy poprawnym podglądzie. Zwrot
   * postaci zostaje wariantem zapasowym i **nadal ogranicza** to, co wolno
   * wskazać (patrz `facingGated`).
   */
  private onAbilityAimStarted(p: { id: AimableAbilityId }): void {
    if (!this.player || this.player.isDead) return;
    if (!Abilities.isReady(p.id, this.time.now)) return;
    const d = this.defaultAimIntent(p.id);
    this.aim = {
      id: p.id,
      dirX: d.dirX,
      dirY: d.dirY,
      overCancel: false,
      manual: false,
      intent: d.intent,
      selected: [],
    };
    if (!this.aimPreview) this.aimPreview = new AimPreview(this);
  }

  private onAbilityAimMoved(p: { dirX: number; dirY: number; overCancel: boolean }): void {
    if (!this.aim) return;
    // ⚠ **Pierwszy przelot TUTAJ jest momentem przejęcia celowania przez
    // gracza** — `AbilityBar` emituje to zdarzenie dopiero po przekroczeniu
    // deadzone. Od tej chwili intencja domyślna nie ma nic do powiedzenia:
    // ostatnia informacja od gracza wygrywa.
    if (!this.aim.manual) this.aim = { ...this.aim, manual: true, intent: null };
    // ⚠ Kierunek zerowy = palec dokładnie na środku przycisku; zostawiamy
    // ostatni znany, bo (0,0) nie ma osi i podgląd zniknąłby na jedną klatkę.
    const zero = p.dirX === 0 && p.dirY === 0;
    this.aim = {
      ...this.aim,
      dirX: zero ? this.aim.dirX : p.dirX,
      dirY: zero ? this.aim.dirY : p.dirY,
      overCancel: p.overCancel,
    };
  }

  /**
   * Puszczenie palca — **jedyny moment, w którym cokolwiek kosztuje**.
   *
   * ⚠ **Kierunek zamraża się TUTAJ.** Kopiowany do zmiennych lokalnych przed
   * zamknięciem sesji, więc nic, co stanie się później — ruch joysticka,
   * przesunięcie celu, kolejna klatka — nie obróci już zatwierdzonego zamachu.
   */
  private onAbilityAimCommitted(p: { dirX: number | null; dirY: number | null }): void {
    const a = this.aim;
    if (!a) return;
    // `null` = tapnięcie bez przeciągnięcia; kierunek został z chwili startu,
    // czyli jest osią INTENCJI DOMYŚLNEJ — kierunkiem do zaznaczonego celu,
    // a przy jego braku (albo gdy stoi za plecami przy umiejętności bramkowanej
    // zwrotem) zwrotem postaci. Patrz `defaultAimIntent`.
    const dirX = p.dirX ?? a.dirX;
    const dirY = p.dirY ?? a.dirY;
    // ⚠ **Ręcznie wskazany cel przechodzi TYLKO wtedy, gdy gracz naprawdę
    // przeciągnął palcem.** Samo tapnięcie ma zachować dzisiejszą wygodę WoW-a
    // (cel z blokady), więc nie wolno mu podstawić kogoś, kogo „podgląd
    // akurat podświetlił" w chwili naciśnięcia.
    const reczny = p.dirX !== null ? a.selected[0]?.ref : undefined;
    this.cancelAim();
    this.onAbilityRequested({ id: a.id, aimDirX: dirX, aimDirY: dirY, aimTarget: reczny });
  }

  /**
   * ⭐ **Tryb „dotknij, potem cel"** (`Settings.aimMode = "tap"`, autor
   * 2026-10-14): gracz wskazał PUNKT ekranu. Zatwierdza sesję tak samo jak
   * przeciągnięcie — z kierunkiem od ciała gracza do wskazanego punktu.
   *
   * ⚠ **Punkt przelicza kamera ŚWIATA** (`getWorldPoint`), bo tylko ona zna
   * zoom i ściśnięcie o sin θ pod widok 3D — punkt na gruncie trafia tam, gdzie
   * gracz go widzi. UI wysyła surowe piksele płótna.
   *
   * ⚠ **Dotknięcie przy wrogu celuje w jego CIAŁO**, nie w punkt obok: palec
   * zasłania cel, a tułów modelu stoi wyżej niż stopy (`render3d.md` §3).
   * Promień `ABILITY_AIM.tapSnapPx` — ten sam rachunek co `bodyVectorTo`.
   *
   * ⚠ `updateAimPreview()` PRZED zatwierdzeniem: commit bierze `selected[0]`
   * z ostatniego przeliczenia podglądu, a przy dotknięciu ostatnie
   * przeliczenie było jeszcze na intencji domyślnej.
   */
  private onAbilityAimPointed(p: { screenX: number; screenY: number }): void {
    const a = this.aim;
    if (!a || !this.player || this.player.isDead) return;
    const w = this.cameras.main.getWorldPoint(p.screenX, p.screenY);
    let najblizszy: Enemy | null = null;
    let najmniej: number = ABILITY_AIM.tapSnapPx;
    for (const k of this.aimCandidates()) {
      const d = Math.hypot(k.body.x - w.x, k.body.y - w.y);
      if (d <= najmniej) {
        najmniej = d;
        najblizszy = k.ref;
      }
    }
    const o = this.player.combatOrigin;
    const v = najblizszy ? this.bodyVectorTo(najblizszy) : { x: w.x - o.x, y: w.y - o.y };
    const len = Math.hypot(v.x, v.y);
    // Dotknięcie dokładnie na postaci nie ma kierunku — wtedy intencja domyślna,
    // jak przy tapnięciu przycisku w trybie przeciągania.
    if (len < 1) {
      this.onAbilityAimCommitted({ dirX: null, dirY: null });
      return;
    }
    const dirX = v.x / len;
    const dirY = v.y / len;
    this.aim = { ...a, manual: true, intent: null, dirX, dirY, overCancel: false };
    this.updateAimPreview();
    this.onAbilityAimCommitted({ dirX, dirY });
  }

  /** Zerwana sesja: podgląd znika, nic nie zostało pobrane. */
  private cancelAim(): void {
    this.aim = null;
    this.aimPreview?.hide();
    // Znacznik celu wraca taki, jaki był przed gestem — patrz wygaszenie
    // w `updateAimPreview`. Bez tego blokada celu znikałaby po każdym
    // celowaniu, choć nikt jej nie zdejmował.
    if (this.currentTarget && !this.currentTarget.isDead) this.targetMarker?.setVisible(true);
  }

  /** Kandydaci — żywi wrogowie sceny, jako czyste dane. */
  private aimCandidates(): AimCandidate<Enemy>[] {
    const out: AimCandidate<Enemy>[] = [];
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (e.isDead || !e.active) continue;
      // Oba punkty odniesienia naraz — kształt wybiera sobie ten, w którym
      // mierzy (patrz `AimFrame`). Łuk bierze ciało, Szarża duszka.
      out.push({ ref: e, body: e.combatBody, sprite: { x: e.x, y: e.y } });
    }
    return out;
  }

  /**
   * **Czy tor do tego celu jest wolny od TERENU.**
   *
   * ⚠⚠ **Egzekwowane w WYKONANIU, nie tylko w podglądzie — i to jest cały sens
   * tej metody.** Zgłoszenie z rozgrywki 2026-09-04: „Wypad przenika przez
   * przeszkody". Przyczyna nie była logiczna, tylko ilościowa: gracz MA collider
   * ze `solids`, ale Arcade nie zna kolizji ciągłej, a skok leci 900 px/s =
   * **15 px na krok fizyki**, przy pudełku pnia głębokim na **13–15 px**. Ciało
   * startowało przed pniem i lądowało za nim, nie nakładając się na niego
   * w żadnej klatce. Fizyka nie miała czego wykryć, więc warunek musi paść
   * WCZEŚNIEJ — przy wyborze celu.
   *
   * ⚠ **Pyta `NavGrid`, czyli tę samą siatkę, którą zbudowano z tego samego
   * przebiegu po mapie co ciała statyczne** (`TiledMap`). Drugiego systemu
   * kolizji nie ma i nie ma powstać (`src/world/CLAUDE.md`).
   *
   * ⚠ **Mierzy CIAŁAMI** (`combatOrigin` → `combatBody`), bo przez teren
   * przeciska się ciało. Nie rusza to semantyki zasięgu: `surfaceGap` dalej
   * rozstrzyga `coversTarget`, a to jest osobne pytanie — „czy da się tam
   * dobiec", nie „czy dosięgnę".
   *
   * ⚠ Mapa bez siatki (awaryjna z `MapBuilder`) nie ma kolizji kafli, więc
   * odpowiedź brzmi „wolne" — tak samo, jak zachowuje się tam fizyka.
   */
  private pathClearTo(target: Enemy): boolean {
    const nav = movementContextFor(this).nav;
    if (!nav) return true;
    const o = this.player.combatOrigin;
    const c = target.combatBody;
    return nav.hasClearLine(o.x, o.y, c.x, c.y, PLAYER.bodyWidth);
  }

  /**
   * Kandydaci widziani przez KONKRETNĄ umiejętność.
   *
   * ⚠ **Filtr jedzie z DANEJ (`requiresClearPath`), nie z nazwy umiejętności.**
   * Dzięki temu podgląd i wykonanie odsiewają dokładnie tak samo — a to jest
   * jedyny powód, dla którego wolno zaznaczać kandydatów na ekranie.
   */
  private aimCandidatesFor(id: AimableAbilityId): AimCandidate<Enemy>[] {
    const def = ABILITIES[id] as { requiresClearPath?: boolean };
    const wszyscy = this.aimCandidates();
    if (!def.requiresClearPath) return wszyscy;
    return wszyscy.filter((c) => this.pathClearTo(c.ref));
  }

  /** Punkty odniesienia GRACZA, w obu żywych konwencjach — patrz `AimFrame`. */
  private aimFrame(): AimFrame {
    return { body: this.player.combatOrigin, sprite: { x: this.player.x, y: this.player.y } };
  }

  /**
   * Przerysuj podgląd. Wołane co klatkę z `update()`, bo gracz w trakcie
   * celowania **chodzi** — wierzchołek klina musi jechać za nim, a lista
   * trafionych zmieniać się na żywo.
   *
   * ⚠ Selekcja liczona jest tą samą funkcją, co przy ciosie. To jest jedyny
   * powód, dla którego znaczniki celów mogą tu w ogóle być: gdyby podgląd
   * wybierał cele własnym kodem, pokazywałby kogo innego niż trafi.
   */
  private updateAimPreview(): void {
    const a = this.aim;
    if (!a || !this.aimPreview || !this.player || this.player.isDead) return;
    /**
     * ⚠⚠ **Intencja domyślna jest PRZELICZANA co klatkę, nie zamrażana na
     * starcie gestu** — i to nie jest ostrożność, tylko warunek, żeby podgląd
     * dalej mówił prawdę o tapnięciu. W trakcie gestu zmienia się wszystko, co
     * rozstrzygnie commit: cel chodzi (wychodzi z zasięgu i wraca), gracz
     * chodzi, a **od 2026-09-11 może się też OBRÓCIĆ drugim palcem** (strefa
     * obrotu drążka) — czyli bramka zwrotu potrafi się przełączyć w połowie
     * celowania w obie strony. Zamrożona intencja pokazywałaby wtedy cel,
     * którego commit odmówi („Odwróć się"), albo pustkę tam, gdzie cios już
     * wychodzi.
     *
     * ⚠ **Tylko dopóki gracz nie przejął celowania.** Po przeciągnięciu
     * ostatnia informacja od gracza wygrywa i nic nie ma prawa jej nadpisać.
     */
    if (!a.manual) {
      const d = this.defaultAimIntent(a.id);
      a.dirX = d.dirX;
      a.dirY = d.dirY;
      a.intent = d.intent;
    }
    const spec = resolveAbility(a.id, this.currentStrike());
    const frame = this.aimFrame();
    const dir = { x: a.dirX, y: a.dirY };
    const wszyscy = this.aimCandidatesFor(a.id);
    /**
     * ⚠⚠ **Dopóki gracz nie przejął celowania, wskazanie celu widzi WYŁĄCZNIE
     * intencję domyślną** (2026-09-11). To jest jedyne miejsce, w którym
     * podgląd przestaje pytać „kto stoi najbliżej mojej osi" i zaczyna pytać
     * „kogo uderzy tapnięcie" — czyli o to samo, co rozstrzygnie commit.
     *
     * ⚠ **Zawężamy KANDYDATÓW, nie omijamy `selectTargets`.** Legalność dalej
     * rozstrzyga `coversTarget` — ten sam predykat i ta sama miara pasma, więc
     * cel poza zasięgiem, za blisko (Szarża) albo za pniem
     * (`aimCandidatesFor`) wypada z podglądu dokładnie wtedy, kiedy odmówi mu
     * wykonanie. Pusty podgląd jest wtedy komunikatem, a nie brakiem.
     *
     * ⚠ **Łuku kierunkowego to NIE dotyczy i nie może dotyczyć.** Szerokie
     * cięcie trafia wszystko w klinie; zawężenie listy do jednego wroga
     * kazałoby podglądowi zataić resztę trafionych, czyli odwróciłoby tę samą
     * wadę, którą ta zmiana naprawia. Tam intencja domyślna zmienia wyłącznie
     * OŚ klina (patrz `defaultAimIntent`).
     */
    const kandydaci =
      !a.manual && spec.shape.kind === "directionTarget"
        ? wszyscy.filter((k) => k.ref === a.intent)
        : wszyscy;
    const selected = selectTargets(spec, frame, dir, kandydaci);
    // ⚠ Zapamiętane, bo commit ma użyć TEGO wyniku, a nie szukać od nowa.
    a.selected = selected;
    // ⚠ Język podglądu jest DANĄ umiejętności, nie gałęzią po jej nazwie
    // (`ABILITIES.*.aimPreview`). Łuk swojego nie potrzebuje i go nie czyta.
    const def = ABILITIES[a.id] as { aimPreview?: "pathOnly" | "reachAndCone" | "lane" | "reach" };
    const styl = def.aimPreview ?? "pathOnly";
    let extras: AimExtras | undefined;
    if (styl === "lane" || styl === "reach") {
      // ⚠ **PEŁNA lista, nie zawężona do intencji** — szare łuki mówią „tych
      // też możesz wskazać", czyli są jedynym miejscem, w którym gra uczy, że
      // przeciągnięcie zmienia cel. Zawężenie ich razem z `selected` zabrałoby
      // tę naukę dokładnie w chwili, w której jest potrzebna.
      extras = this.aimExtras(spec, frame, dir, selected, wszyscy);
      // ⚠ **Globalny znacznik celu GAŚNIE na czas celowania — i to nie jest
      // kosmetyka.** `COMBAT_FEEDBACK.targetMarker` jest CZERWONY i znaczy
      // „to jest twój aktywny cel"; w języku pasa czerwień znaczy dokładnie
      // odwrotność — ograniczenie („za blisko", „przeszkoda"). Do tego blokada
      // celu i wskazanie Szarży bywają na DWÓCH RÓŻNYCH stworzeniach, więc bez
      // wygaszenia „aktualny cel" byłby na ekranie wyrażony dwa razy, dwoma
      // kolorami. Wraca w `cancelAim`, dokładnie taki, jaki był.
      this.targetMarker?.setVisible(false);
    }
    this.aimPreview.draw(frame, dir, spec.shape, selected, (t) => t.ref.combatBody, a.overCancel, styl, extras);
  }

  /**
   * Dane pasa Szarży: kandydaci i przeszkoda. **Liczone TUTAJ, nie w podglądzie.**
   *
   * ⚠ **Kandydaci przechodzą przez `coversTarget`** — ten sam predykat, którym
   * rozstrzyga się użycie umiejętności. To jest jedyny powód, dla którego szare
   * łuki mogą w ogóle istnieć: gdyby podgląd wybierał ich własną regułą,
   * pokazywałby kogo innego, niż Szarża naprawdę weźmie.
   *
   * ⚠ **Przeszkodę pyta `NavGrid`** — tę samą siatkę prześwitu, po której
   * chodzą wrogowie, budowaną z TEGO SAMEGO przebiegu po mapie co ciała
   * statyczne (`TiledMap`). Drugie zapytanie o kolizję byłoby drugim opisem tej
   * samej przestrzeni.
   *
   * ⚠⚠ **Zapytanie idzie z CIAŁA gracza, a rysunek ze środka duszka.** To nie
   * jest niekonsekwencja: przez teren przeciska się CIAŁO (`combatOrigin`, 19 px
   * pod środkiem duszka), a pasmo Szarży mierzy się między DUSZKAMI (konwencja
   * `directionTarget`, świadomie nietknięta). Każda z tych dwóch liczb jest
   * zadana w swojej własnej przestrzeni; wspólny jest tylko DYSTANS wzdłuż osi.
   *
   * ⚠ **Zwrócony dystans znaczy „tor jest PRZECIĘTY", nie „tu się zatrzymasz"**
   * — Arcade rozsuwa i ślizga ciało po przeszkodzie, więc bieg potrafi obsunąć
   * się bokiem i mimo wszystko dojechać. Decyzja autora z 2026-09-04: `X`
   * niesie to słabsze, prawdziwe znaczenie, zamiast obiecywać fizykę.
   *
   * ⚠ **Siatka zna TEREN i PNIE, nie rekwizyty.** Studnia, ognisko i NPC mają
   * własne collidery i zatrzymają Szarżę bez `X`. Świadomie poza zakresem.
   */
  private aimExtras(
    spec: ResolvedAbilitySpec,
    frame: AimFrame,
    dir: { x: number; y: number },
    selected: readonly SelectedTarget<Enemy>[],
    /**
     * ⚠ Lista z `aimCandidatesFor` — **nigdy drugie wywołanie `aimCandidates()`**,
     * bo tamto mogłoby odsiać inaczej niż selekcja.
     *
     * ⚠ **W stanie domyślnym (`aim.manual === false`) jest SZERSZA niż lista,
     * z której policzono `selected`, i to jest zamierzone** (2026-09-11): wybrany
     * jest wtedy intencją domyślną, a szare łuki mają dalej pokazywać, kogo
     * gracz może wskazać przeciągnięciem. Sprzeczności z rysunkiem to nie
     * wprowadza — kandydat i tak musi przejść `coversTarget` niżej.
     */
    kandydaci: readonly AimCandidate<Enemy>[],
  ): AimExtras {
    const wybrany = selected[0]?.ref;
    const candidateBodies: CombatBody[] = [];
    for (const c of kandydaci) {
      if (c.ref === wybrany) continue;
      if (!coversTarget(spec.shape, frame, dir, c)) continue;
      candidateBodies.push(c.body);
    }

    /* ⚠⚠ **Liczone dla OBU języków — poprawka 2026-09-05.** Do tej daty stała
       tu bramka „tylko `lane`", bo tylko Szarża ma czym pokazać ✕. To był błąd
       w rozumowaniu: **przeszkoda ogranicza nie tylko ✕, ale przede wszystkim
       DŁUGOŚĆ PASA.** Wypad rysował biały tor do pełnego zasięgu prosto przez
       pnie — obiecywał krok, którego nie da się zrobić, i to mimo że wykonanie
       skok w tym miejscu skraca (§S9). Podgląd kłamał wobec własnej mechaniki. */
    let blockAtPx: number | null = null;
    const nav = movementContextFor(this).nav;
    const shape = spec.shape;
    if (nav && shape.kind === "directionTarget") {
      /* ⚠⚠ **PYTAMY O DOKŁADNIE TEN ODCINEK, KTÓRY RYSUJEMY — poprawka
         2026-09-05 po zgłoszeniu „biała ścieżka idzie przez pień".**

         Do tej daty zapytanie startowało z `frame.body`, a pas rysował się
         z `originFor(shape, frame)`, czyli dla Szarży ze ŚRODKA DUSZKA — 19 px
         wyżej. To były **dwie różne linie o różnym początku I różnym kącie**
         (obie kończą się na ciele celu, więc rozbieżność rośnie im bliżej
         gracza). Pudełko kolizji pnia jest wysokie na 13–15 px, czyli MNIEJ niż
         te 19 px — więc pień leżący pod narysowanym pasem potrafił w ogóle nie
         trafić w linię zapytania. Podgląd malował biel przez drzewo, bo pytał
         o coś innego, niż pokazywał.

         Naprawa: bierzemy oś i długość DOKŁADNIE tak, jak liczy je `drawLane`,
         a potem przesuwamy cały odcinek na płaszczyznę, po której jedzie CIAŁO
         (`frame.body − origin`). Odcinki są wtedy równoległe i tej samej
         długości, więc dystans blokady mapuje się na rysunek 1:1.

         ⚠ **Nie ma tu zamiatania trzema liniami i nie jest potrzebne.**
         `NavGrid.passable(x, y, bodyW)` porównuje PRZEŚWIT (odległość do
         najbliższej przeszkody × 2) z szerokością ciała — czyli pyta wprost
         o to, czy wolna jest **cała przestrzeń między krawędziami** pasa, a nie
         sama linia środkowa. Szerokość pasa na ekranie to ta sama liczba
         (`ABILITY_AIM.preview.target.lane.widthPx` = `PLAYER.bodyWidth`). */
      const rysOrigin = originFor(shape, frame);
      const cel = wybrany?.combatBody;
      let kx = dir.x;
      let ky = dir.y;
      let dlugosc = shape.maxRangePx;
      if (cel) {
        const dx = cel.x - rysOrigin.x;
        const dy = cel.y - rysOrigin.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001) {
          kx = dx / d;
          ky = dy / d;
          dlugosc = Math.max(0, d - cel.radius);
        }
      }
      // Przesunięcie rysowanego odcinka na płaszczyznę ruchu ciała.
      const px = frame.body.x - rysOrigin.x;
      const py = frame.body.y - rysOrigin.y;
      const ax = rysOrigin.x + px;
      const ay = rysOrigin.y + py;
      const blok = nav.firstBlockedOn(ax, ay, ax + kx * dlugosc, ay + ky * dlugosc, PLAYER.bodyWidth);
      if (blok) blockAtPx = Math.hypot(blok.x - ax, blok.y - ay);
    }

    // ⚠ Promień ciała gracza jedzie do podglądu, bo kształt mierzący PRZEŚWIT
    // (`metric: "surfaceGap"`, dziś Wypad) potrzebuje go do narysowania okręgu
    // zasięgu — patrz `AimPreview.drawReach`. Czytany z żywego ciała, nie
    // z configu: to ta sama liczba, którą mierzy trafienie.
    return { candidateBodies, blockAtPx, originRadiusPx: this.player.combatBody.radius };
  }

  /**
   * `Szerokie cięcie` — kierunkowe front-AoE z twardym sufitem celów.
   *
   * ⚠ **Zwrot WIZUALNY i kierunek CELOWANIA to dwie różne rzeczy.**
   * `aimAttackAt` snapuje sprite i broń do najbliższej z czterech stron (tam
   * mieszka cała animacja), a geometria dostaje **dokładny wektor analogowy**.
   * Nie zlewaj ich: przebudowa animacji na 360° to osobna, dużo większa praca,
   * a bez rozdzielenia celowanie kierunkowe byłoby kłamstwem zaokrąglonym do
   * 90°.
   *
   * ⚠ **Cel zaznaczony (`currentTarget`) nie ma tu żadnego znaczenia** i to
   * jest zamierzone: rolą tej umiejętności jest nagradzać USTAWIENIE grupy
   * w łuku, a nie powtarzać autoatak. Główny cel wybiera geometria, nie
   * blokada celu.
   */
  private castCleave(now: number, dirX: number, dirY: number): void {
    const strike = this.currentStrike();
    const spec = resolveAbility("cleave", strike);
    const selected = selectTargets(spec, this.aimFrame(), { x: dirX, y: dirY }, this.aimCandidates());

    // Sprite/broń: najbliższa z czterech stron. Geometria już wybrała cele
    // z wektora analogowego powyżej, więc snap nie ma na nie wpływu.
    this.player.aimAttackAt(dirX, dirY);
    // Poza zamachu bez ukorzenienia — ten sam powód co przy Wirze ostrzy:
    // umiejętność odpowiadająca na grupę nie może przyszpilać gracza w jej
    // środku. Patrz `Player.rootedUntil`.
    this.player.triggerAttack(now, { roots: false });
    // Jeden zamach, jeden rzut na zużycie — niezależnie od tego, ilu trafi.
    // Dokładnie przypadek, dla którego ta reguła powstała.
    this.wearWeapon();

    // ⚠ Mnożnik **per cel** (primary kontra secondary), ale przez DOKŁADNIE
    // ten sam pipeline obrażeń co dotąd: rzut, pancerz, popup, XP, łup,
    // respawn. Prototyp celowania nie rusza semantyki losowania obrażeń.
    const mnoznik = new Map<Enemy, number>();
    for (const t of selected) mnoznik.set(t.ref, multiplierFor(spec, t.role));
    this.damageMatchingEnemies(
      (e) => mnoznik.get(e) ?? 0,
      (e) => mnoznik.has(e),
      strike,
      // ⚠ **Szerokie cięcie NIE fuszeruje.** Warstwa 1 jest tu klinem
      // z `ResolvedAbilitySpec` — tym samym, z którego czyta podgląd celowania
      // — czyli pyta już „czy zamach poszedł tam, gdzie stoisz". Drugi losowy
      // rzut o to samo łamie zakaz podwójnego liczenia z §3; identyczny
      // argument, którym `bearSwipe` dostał `allowFumble: false`.
      false,
    );

    // ⚠ **`expandingRing` NIE opisuje już kształtu tego ciosu** — pełne koło
    // kłamałoby o klinie (patrz `AimPreview`). Zostaje jako błysk „coś się
    // stało" o promieniu świadomie małym, przy samej postaci.
    expandingRing(this, {
      x: this.player.x, y: this.player.y, radius: 12,
      color: ABILITIES.cleave.color, alpha: 0.45, scale: 2.0, duration: 260,
      depth: DEPTH.entities + this.player.y + 1,
    });
  }

  /** Scene time before which no further hit-stop may fire. */
  private hitStopReadyAt = 0;

  /**
   * Freeze the physics world for a few frames on a crit, plus a short shake.
   *
   * Only PHYSICS is paused: tweens keep running, so the damage number, the
   * swing arc and the hit flash all animate through the freeze. Pausing
   * everything would read as a dropped frame instead of an impact.
   *
   * The `minGapMs` gate is the load-bearing part — see COMBAT_FEEDBACK. A
   * fast-weapon, high-Zręczność build crits often enough that an ungated
   * hit-stop turns the whole game into a stutter. The gate is also why a
   * whirlwind catching five enemies freezes once, not five times.
   */
  private critHitStop(): void {
    const cfg = COMBAT_FEEDBACK.critHitStop;
    if (this.time.now < this.hitStopReadyAt) return;
    this.hitStopReadyAt = this.time.now + cfg.minGapMs;

    this.physics.world.pause();
    this.cameras.main.shake(cfg.shakeMs, cfg.shakeIntensity);
    // The scene Clock is independent of the physics world, so this still fires
    // while physics is frozen. (If a panel pauses the scene mid-freeze the
    // callback simply waits for the unpause, which is the behaviour we want.)
    this.time.delayedCall(cfg.ms, () => this.physics.world.resume());
  }

  private spawnSwingFx(x: number, y: number, radius: number, hit: boolean): void {
    expandingRing(this, {
      x,
      y,
      radius,
      color: hit ? 0xffff88 : 0xffffff,
      alpha: hit ? 0.35 : 0.15,
      scale: 1.5,
      duration: 160,
      depth: DEPTH.entities + y + 100,
    });
  }
}

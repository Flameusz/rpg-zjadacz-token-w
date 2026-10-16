import Phaser from "phaser";
import { PLAYER, ASSETS, COMBAT_FEEDBACK, RESPAWN, DEPTH, SHIELD, STAMINA, STICK } from "../config/GameConfig";
import { anim, Direction } from "../core/Animations";
import { GameEvents, EVENT } from "../core/EventBus";
import { Progression } from "../core/Progression";
import { Stamina } from "../core/Stamina";
import { Vitals } from "../core/Vitals";
import { Equipment } from "../core/Equipment";
// ⚠ `T-7`: stopień bloku jest CZYSTĄ funkcją (`Protection`), a nauka noszenia
// tarczy — singletonem, który nie zna `Equipment`.
import { blockGradeFor, type BlockGrade } from "../core/Protection";
import { ShieldSkill } from "../core/ShieldSkill";
import { resolveIncoming } from "../core/DamageResolver";
// ⚠ Sonda `P1` — wyłącznie pomiar, zero wpływu na rozstrzygnięcie. Wołanie
// niżej stoi pod `import.meta.env.DEV`, więc znika z buildu produkcyjnego tą
// samą drogą co `Perf`.
import { GuardStats } from "../core/GuardStats";
import { rollWeaponDamage } from "../core/combat/DamageRoll";
import type { DamageRollInput, DamageRollResult } from "../core/combat/DamageRoll";
import type { AttackTarget, DamageReceipt, EffectTarget } from "../core/combat/Contracts";
import { primaryType, totalAmount, type DamagePacket } from "../core/combat/DamagePacket";
import { cuesFor, type ActionResolution, type ActionOutcome, type Execution } from "../core/CombatCues";
import { playCues } from "../core/CombatFx";
import { effectsFor } from "../core/GameplayEffects";
import { applyImpulse } from "../core/CombatImpulse";
import { applyBody } from "../core/movement/BodySpec";
import { ySortedWorldFor } from "../core/YSortedWorld";
import type { CombatBody } from "../core/CombatGeometry";
import { Defense } from "../core/Defense";
import { getItem, itemIconKey, type ItemId } from "../core/Items";
import { Buffs } from "../core/Buffs";
import {
  EffectSet,
  type ActiveEffect,
  type EffectHost,
  type EffectSource,
  type EffectSpec,
} from "../core/combat/StatusEffects";
import { DAMAGE_BUFF, FOOD_HEAL, POISON, SLOW } from "../core/combat/EffectKinds";
import { Sfx } from "../core/Sfx";

/** Buffs key for the food heal-over-time — one meal at a time, never stacked. */
const FOOD_BUFF_ID = "food";
/** Buffs key for the Okrzyk bojowy damage buff. */
const DAMAGE_BUFF_ID = "warcry";

/* ── Kategorie efektów ─────────────────────────────────────────────────────
   ⚠ Host szuka efektu po KATEGORII, nie po identyfikatorze, bo część z nich
   przychodzi z configu wołającego (spowolnienie niesie `buffId` pocisku).
   ⚠ **Tagi i klucze payloadu mieszkają w `core/combat/EffectKinds.ts`**, bo
   producent efektu (skoczek, pocisk) jest w INNYM module niż ten konsument —
   prywatna stała po tej stronie nie miała jak się z tamtą zgodzić. */

/**
 * The player character: joystick-driven 8-directional movement, directional
 * walk/idle animation, a short-range directional melee attack, and HP.
 */
export class Player extends Phaser.Physics.Arcade.Sprite implements AttackTarget, EffectTarget, EffectHost {
  private _hp: number = Progression.maxHp;

  /** Writing HP also refreshes the shared Vitals snapshot the UI paints from. */
  get hp(): number {
    return this._hp;
  }

  set hp(value: number) {
    this._hp = value;
    Vitals.hp = value;
    Vitals.maxHp = this.maxHp;
  }

  /**
   * Max HP and melee damage are *derived* from the attributes rather than
   * stored, so spending a skill point takes effect immediately and there is no
   * second copy of the number to fall out of sync.
   */
  get maxHp(): number {
    return Progression.maxHp;
  }

  get damage(): number {
    return Progression.meleeDamage;
  }

  /**
   * **ZWROT postaci — jedyne źródło prawdy o tym, dokąd patrzy.** CIĄGŁY kąt
   * w radianach, `atan2(x, y)` w osiach ekranu (0 = w dół, rośnie ku prawej).
   * Napędzany drążkiem/WASD (i lotem Szarży/Wypadu); zamach przepisuje go
   * WYŁĄCZNIE na stojąco (`triggerAttack`, `OI-146`) — w marszu nie, patrz
   * `attackRad`.
   *
   * ⚠⚠ **Czterokierunkowy `moveDir` USUNIĘTY 2026-09-27.** Był tym samym kątem
   * skwantowanym do ćwiartki, zapisywanym obok w `ustawZwrot`. Do dziś czytały
   * go tylko arkusz 2D i mechanika, która przez to odjeżdżała od modelu 3D
   * (`OI-148`, `OI-149`). Rząd arkusza liczy dziś `wierszArkusza(zwrotRad)`
   * wyłącznie w warstwie rysowania — ⛔ nie przywracaj ćwiartki jako STANU.
   *
   * ⚠ **Istnieje, bo model 3D brał zwrot z `body.velocity`, a nie z intencji
   * gracza** (A5, 2026-09-20). Zmierzone skutki tamtego źródła:
   * 1. **obrót w miejscu był na modelu NIEWIDOCZNY** — strefa `STICK.turnZoneFrac`
   *    pisze zwrot, ale zeruje prędkość, więc model stał jak stał;
   * 2. **ślizg po przeszkodzie obracał postać w stronę ślizgu**, bo kolizja
   *    odchyla prędkość, a intencja zostaje ta sama.
   *
   * ⛔ Nie kwantować go do 8 kierunków „dla porządku". Drążek dotykowy daje
   * kierunek analogowy (`VirtualJoystick`: `cos(a)*mag, sin(a)*mag`), model
   * odtwarza go co do 0,0° i to jest zachowanie docelowe.
   */
  private zwrotRad = 0;
  /**
   * Where the current swing is AIMED — set by the attack logic (at a selected
   * target via `aimAttackAt`, or along movement via `aimAttackAlongMovement`
   * for the untargeted arc). Owns the attack animation, the sword sprite's
   * orientation, the lunge, and the arc's heading vector.
   *
   * These used to be one `facing` field, which meant aiming a swing at a
   * target to the north while running east also turned the RUN north. Worse,
   * `handleMovement` runs before `resolveAttack` each frame and would
   * overwrite the aim on the very next frame, so the attack animation played
   * in the movement direction — measured at 52 of 120 frames swinging "left"
   * at an enemy standing to the right.
   *
   * CIĄGŁY kąt (radiany, 0 = w dół) — model 3D, wypad, pierścień efektu,
   * osłona w oknie zamachu.
   *
   * ⚠⚠ **Kąt analogowy BYŁ JUŻ NA MIEJSCU i był wyrzucany.** `aimAttackAt`
   * dostaje wektor celowania w pełnych 360° i kwantował go do czterech stron,
   * bo w epoce arkusza nie było komu podać czegoś więcej. Model 3D obraca się
   * ciągle od A5, więc jedyne, co zostawało czterokierunkowe, to **moment
   * ciosu** — czyli ten ułamek sekundy, na który gracz patrzy najuważniej.
   *
   * ⚠ **Czterokierunkowy `attackDir` USUNIĘTY 2026-09-27** — tak jak
   * `moveDir`. Arkusz 2D (cztery fizyczne rzędy, ścieżka awaryjna) bierze rząd
   * z `wierszArkusza(attackRad)` w chwili rysowania.
   */
  private attackRad = 0;
  private attackReadyAt = 0;
  /** While now < this, the attack pose is shown instead of walk/idle. Purely
   *  an ANIMATION window — it does not hold the body still. */
  private attackPoseUntil = 0;
  /**
   * Start i długość BIEŻĄCEGO zamachu — dla `Character3D` (2026-10-03).
   * ⚠ Prezentacja: model odgrywa cios RAZ na zamach (zbocze `od`, `OI-151`)
   * w tempie dopasowanym do `ms` (`OI-118`). Trafienie tego nie czyta.
   */
  private zamachOd = -1;
  private zamachMs = 0;
  /** Jak bieżący zamach WYGLĄDA na modelu 3D — patrz `triggerAttack` `poza`. */
  private zamachPoza: "wir" | "tarcza" | undefined = undefined;
  /**
   * While now < this, the body is rooted: the swing's commitment cost (the
   * Wild Rift model). Damage lands mid-swing, so being unable to walk out of
   * it is what makes a swing a decision rather than a freebie, and it is also
   * what removes the walk/attack animation conflict — while it holds, there is
   * no movement to animate, so one animation plays at a time and no layering
   * system is needed. Unik (dash) deliberately overrides it, see handleMovement.
   *
   * ⚠ Deliberately SEPARATE from `attackPoseUntil`, and they are not the same
   * thing even though a basic attack sets both. Wir ostrzy borrows the swing
   * POSE (it calls triggerAttack purely for the animation and weapon arc) — and
   * when the root rode on the pose, using it silently pinned the player for
   * ~220ms. Measured: 13 frozen frames while holding a direction. That ability
   * exists to answer a swarm, so being immobilised inside it is the opposite of
   * its job. An ability that wants the pose must not inherit the commitment.
   */
  private rootedUntil = 0;
  /**
   * Whether the last `handleMovement` call was given a real movement vector.
   * Read by GameScene to refuse STARTING a swing while the player is walking
   * — moving means not attacking, which is what makes fleeing work instantly
   * instead of being interrupted by roots every cooldown tick.
   *
   * ⚠ **Od 2026-09-11 znaczy „drążek jest w strefie MARSZU", a nie „wektor jest
   * niezerowy".** Wychylenie poniżej `STICK.turnZoneFrac` obraca postać
   * w miejscu i **świadomie zostawia to pole fałszem**: obrót nie jest ruchem,
   * więc nie ma prawa wstrzymywać zamachu. Bez tego rozdziału obrót w miejscu
   * nie rozwiązywałby niczego — dalej trzeba by puścić drążek, żeby uderzyć.
   */
  private movingInput = false;
  private dead = false;
  /** Scene time of the last hit TAKEN — gates out-of-combat regeneration. */
  private lastDamagedAt = 0;
  /** While now < this, the dash owns the body's velocity and input is ignored. */
  private dashUntil = 0;
  /**
   * **Wszystkie efekty czasowe gracza — jeden zbiór, jedna księgowość.**
   *
   * ⚠ Do 2026-09-03 stały tu **cztery osobne pola** (`damageBuff`, `slow`,
   * `venom`, `foodHeal`), każde z własnym `until`, własnym sprzątaniem i własną
   * kopią tej samej arytmetyki czasu. Komentarz przy `venom` mówił wprost:
   * *„dwa to wzorzec, jeszcze nie framework"* — przy czwartym przestało to być
   * prawdą, a wróg nadal nie mógł nosić niczego. Patrz `core/combat/StatusEffects.ts`.
   *
   * ⛔ **Zachowanie wszystkich czterech jest nietknięte**: te same czasy, te
   * same stosy, ta sama kolejność „wygaśnięcie przed tikiem", to samo
   * zastępowanie zamiast sumowania.
   */
  private readonly effects = new EffectSet(this);
  /**
   * Wszystko, co przy przejściu portalem ma przejść razem z postacią.
   *
   * ⚠ **Od 2026-09-03 czas efektów jest WZGLĘDNY** (`remainingMs`, przewijany
   * deltą — `core/combat/StatusEffects.ts`), więc przeniesienie przez bramę nie
   * zależy już od monotoniczności zegara Phasera. Poprzednia wersja tego
   * akapitu ostrzegała, że znaczniki `until`/`nextTickAt` przeżywają portal
   * **tylko dlatego**, że `Clock.boot` nie zeruje `now`; ta zależność zniknęła
   * razem z bezwzględnymi znacznikami.
   *
   * Wpisów w `Buffs` tu nie ma celowo: ta migawka jest modułowa i portal jej
   * nie rusza, więc ikony są po drugiej stronie już poprawne. Przenieść trzeba
   * wyłącznie DZIAŁANIE, które ginie razem ze starym obiektem `Player`.
   */
  captureCondition() {
    return { effects: this.effects.list() };
  }

  /** Druga połowa `captureCondition` — patrz tam po uzasadnienie. */
  restoreCondition(c: PlayerCondition): void {
    this.effects.restore(c.effects);
  }

  /** While now < this, incoming damage is ignored (post-resurrection grace). */
  private invulnerableUntil = 0;
  private blinkTween?: Phaser.Tweens.Tween;

  /** Sword icon, attached as a child sprite and only shown during the attack pose. */
  private sword: Phaser.GameObjects.Image;
  /** 0→1 progress through the current swing; drives blade angle *and* position. */
  private swing = { t: 1 };
  /** Thrust distance (px) for the swing in progress — varies per equipped weapon. */
  private swingThrustPx: number = PLAYER.swing.thrustPx;
  /** Blade sweep (degrees each way) for the swing in progress. Captured at
   *  swing start next to the thrust, because the two together are what makes a
   *  cut look different from a stab (see Progression.swingSweepDeg). */
  private swingSweepDeg: number = PLAYER.swing.arcDeg;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.character.key, ASSETS.character.dirRows.down * ASSETS.character.perCol);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Rendering architecture ETAP 1B: the player's own depth changes every
    // frame (see `update()` below), so it has to live in the scene's
    // dedicated Y_SORTED_WORLD Layer, not the default display list — see
    // `core/YSortedWorld.ts`. A no-op on a scene that never set one up.
    ySortedWorldFor(scene)?.add(this);

    this.hp = Progression.maxHp; // also seeds the shared Vitals snapshot

    this.setScale(PLAYER.scale);
    this.setCollideWorldBounds(true);
    this.setDepth(DEPTH.entities + y);

    // Anchor the collision body around the feet. Feet sit ~feetPadding px above
    // the bottom of the 64px-tall frame.
    // ⚠ Jedna droga do ciała fizycznego w całej grze — patrz
    // `src/core/movement/BodySpec.ts` (i powód, dla którego ta reguła istnieje).
    applyBody(this, {
      w: PLAYER.bodyWidth,
      h: PLAYER.bodyHeight,
      feetPadding: ASSETS.character.feetPadding,
    });

    this.play(anim.idle("down"));

    // Held-weapon prop, rendered as a child sprite: shown and rotated to face
    // the swing direction only while the attack pose plays. Always the
    // equipped weapon's inventory icon (items.png is a uniform 32×32 grid, see
    // public/assets/README.md) — centred origin and a sub-1 scale suit that
    // square icon shape, unlike the thin blade sprite this used to fall back
    // to. Bare-handed has nothing to show (you're punching), so
    // refreshWeaponVisual() just keeps it hidden in that case.
    this.sword = scene.add
      .image(x, y, ASSETS.character.swordKey)
      .setOrigin(PLAYER.swing.gripOrigin, PLAYER.swing.gripOrigin)
      .setScale(PLAYER.scale * PLAYER.heldWeaponScale)
      .setVisible(false);
    // Same reason as the player itself: `updateSword` sets this relative to
    // `this.depth` every swing, so it has to share the SAME sorted scope as
    // the player and every tree trunk/enemy it needs to draw in front of or
    // behind — left in the default list it would (a) desync its draw order
    // from the player's during a swing near a trunk/bush, and (b) keep
    // dirtying the wrong list's sort flag on every attack.
    ySortedWorldFor(scene)?.add(this.sword);
    this.refreshWeaponVisual();

    GameEvents.on(EVENT.equipmentChanged, this.onEquipmentChanged, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.equipmentChanged, this.onEquipmentChanged, this);
    });
  }

  /**
   * Gear changed: swap the held-weapon texture, and re-seat HP against the new
   * ceiling.
   *
   * The re-seat matters because gear can now *lower* max HP — take off a
   * vigour ring and the cap drops under your current HP. It also runs when
   * nothing is out of range, on purpose: `Vitals.maxHp` is only ever written by
   * the `hp` setter, so without assigning through it here the shared snapshot
   * the HUD and `Inventory.wouldWasteHeal` read would keep the stale maximum.
   */
  private onEquipmentChanged(): void {
    this.refreshWeaponVisual();
    if (this.dead) return;
    this.hp = Math.min(this.hp, this.maxHp);
    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
  }

  /** Point the held-weapon sprite at whatever's currently equipped — bare
   *  hands have no prop to show, so just keep it hidden (triggerAttack() also
   *  guards against showing it again on the next swing). */
  private refreshWeaponVisual(): void {
    const weaponId = Equipment.weaponId;
    if (!weaponId || this.rysujeModel3d) {
      this.sword.setVisible(false);
      return;
    }
    this.sword.setTexture(itemIconKey(weaponId));
  }

  /**
   * **Postać rysuje co innego niż ten sprite** (model 3D — `render3d/Character3D.ts`).
   *
   * ⚠ Sprite NIE znika z gry, tylko przestaje być RYSOWANY: dalej jest ciałem
   * fizycznym, źródłem pozycji, celem kamery i nośnikiem `setDepth`, więc cała
   * mechanika działa bez zmian. Gaśnie też miecz 2D — inaczej obok broni
   * trzymanej przez model wisiałaby druga, płaska.
   *
   * ⚠ Ustawiane DOPIERO gdy model naprawdę stanie w świecie. Gra ma zawsze
   * kogoś rysować, więc nieudane wczytanie modelu zostawia arkusz 2D.
   */
  private rysujeModel3d = false;

  setVisualOverride(wlaczone: boolean): void {
    this.rysujeModel3d = wlaczone;
    this.setVisible(!wlaczone);
    if (wlaczone) this.sword.setVisible(false);
    else this.refreshWeaponVisual();
  }

  get visualOverridden(): boolean {
    return this.rysujeModel3d;
  }

  /**
   * Zwrot postaci jako CIĄGŁY kąt (radiany, 0 = w dół) — jedyne źródło prawdy
   * o tym, dokąd postać patrzy. Czyta go model 3D (`Character3D.krok`), bramka
   * zwrotu ataku, osłona i oś zapasowa celowania. Patrz `zwrotRad`.
   *
   * ⚠ Przy bezruchu **trzyma ostatnią wartość**, bo `ustawZwrot` odrzuca
   * wektor zerowy. Na tym stoi kryterium A5 „zatrzymanie zachowuje facing".
   */
  get zwrotKat(): number {
    return this.zwrotRad;
  }

  /**
   * Kierunek bieżącego ciosu jako CIĄGŁY kąt (radiany) — model 3D, wypad,
   * pierścień efektu i osłona w oknie zamachu. Patrz `attackRad`.
   */
  get attackKat(): number {
    return this.attackRad;
  }

  /**
   * **Dokąd skierowana jest osłona** (radiany, 0 = w dół) — czyta ją
   * `Protection.guardAngleDeg`, a przez nie blok, strefy i parowanie.
   *
   * ⭐ **Reguła: osłona kryje DOKŁADNIE to, co widać.** W pozie ataku zwrot
   * należy do ciosu, poza nią do ruchu — nie ma drugiej, ukrytej prawdy.
   * Rozstrzygnięte przez autora 2026-08-15 (`docs/systemy/shields.md` §11.1,
   * wówczas jedyne ryzyko zdolne zabić model kierunkowy). Opłaca się to tak:
   * ukorzenienie pokrywa okno zobowiązania, więc przez cały czas, w którym
   * gracz NIE może uciec, postać stoi do celu — **tarcza odpowiada własnemu
   * rootowi gracza**. Koszt na piśmie: bieg w prawo z ciosem w górę przełącza
   * osłonę kilka razy na sekundę; jeśli playtest odczyta to jako losowość,
   * zmienia się TĘ regułę, nie liczby tarcz.
   *
   * ⛔ **Auto-obracanie tarczy na cel (`targetDir`) USUNIĘTE 2026-08-23.**
   * Łamało tę regułę: postać stała plecami do wilka, a tarcza go blokowała.
   * Zniknęło razem z auto-obracaniem ataku — oba były objawem jednej decyzji
   * („blokada celu obraca postać"). Chcesz kryć wilka — ustaw się do niego.
   *
   * ⚠ **Historia 4 kierunków** (usunięte 2026-09-27, patrz
   * `docs/postac3d_checkpoint.md` §38). Do A6.3 osłona pytała o ćwiartkę
   * (`guardDir`), a model obracał się ciągle — idąc na NE postać patrzyła na
   * NE, osłona mówiła „right" (`OI-140`). Czterokierunkowy getter został potem
   * jako martwy widok bez konsumenta w grze i został usunięty razem z polami
   * `moveDir`/`attackDir`.
   */
  get guardKat(): number {
    // ⚠⚠ **MUSI iść za ciosem CIĄGLE, odkąd poza ciosu jest ciągła.** Reguła
    // tej własności brzmi „osłona kryje to, co widać" — dopóki zamach skakał
    // do ćwiartki, ćwiartka BYŁA tym, co widać. Zostawienie tu
    // `dirToAngle(attackDir)` po uciągleniu ciosu odtworzyłoby `OI-140`
    // wewnątrz okna zamachu: tarcza kryłaby ćwiartkę, a postać jawnie
    // patrzyłaby pod innym kątem. ⛔ Nie cofaj do `dirToAngle`.
    if (this.scene.time.now < this.attackPoseUntil) return this.attackRad;
    return this.zwrotRad;
  }

  /** True while the drążek stoi w strefie MARSZU — ⚠ obrót w miejscu daje tu
   *  `false`, patrz `movingInput`. */
  get isMoving(): boolean {
    return this.movingInput;
  }

  /**
   * Zwrot postaci jako WEKTOR jednostkowy — punkt wyjścia celowania, zanim
   * gracz przeciągnie palcem, i oś zapasowa umiejętności bez celu.
   *
   * ⚠⚠ **Z CIĄGŁEGO `zwrotRad`, nie z ćwiartki (`OI-148`, 2026-09-27).** Do tej
   * daty był to `dirToOffset(facingDir)` — jedna z czterech wartości — pod
   * założeniem „zwrot wizualny jest czterokierunkowy". Od A5 model obraca się
   * ciągle, więc Szerokie cięcie bez celu, Wypad bez celu i intencja domyślna
   * celowania odjeżdżały do 45° od tego, w co postać jawnie patrzy (zmierzone:
   * model 30°/45°/60° → oś 0°/0°/90°). ⛔ Nie wracaj do ćwiartki.
   */
  get facingVector(): { x: number; y: number } {
    return { x: Math.sin(this.zwrotRad), y: Math.cos(this.zwrotRad) };
  }

  /** Bieżący zamach: chwila startu i długość (ms) — patrz `zamachOd`. */
  get zamach(): { od: number; ms: number; poza?: "wir" | "tarcza" } {
    return { od: this.zamachOd, ms: this.zamachMs, poza: this.zamachPoza };
  }

  /** True while a swing still owns the body (attack pose + root). */
  get isSwinging(): boolean {
    return this.scene.time.now < this.attackPoseUntil;
  }

  /**
   * "W walce" (in-combat) visual stance, read by `Character3D` to pick a
   * guarding shield-carry pose over the relaxed one during ordinary walking.
   *
   * ⚠ Deliberately NOT a timer on `lastDamagedAt`/attack time — `GameScene`
   * already knows, precisely, whether any enemy `isChasing` the player (the
   * same aggro/chase state that drives targeting and re-focus), so it sets
   * this field directly each frame instead of Player re-deriving a fuzzy
   * approximation from its own damage/attack timestamps. Player owns the
   * field because `Character3D` already reads player-owned combat state
   * (`isSwinging`, `attackFacing`) the same way; it does NOT own the
   * decision of what counts as "in combat" — that stays in GameScene, which
   * is the only place with a view of every enemy's aggro state.
   */
  wWalce = false;

  /**
   * Aim the next swing at a point — used for a selected target, so the swing
   * and its animation face an enemy the player is not necessarily walking
   * toward.
   *
   * Sets ONLY `attackRad`. It must never touch `zwrotRad`, or aiming north at
   * a target would turn a player running east; that coupling is exactly what
   * this split exists to remove.
   */
  aimAttackAt(dx: number, dy: number): void {
    if (this.dead) return;
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() < 0.0001) return;
    // ⚠ `atan2(x, y)`, nie `(y, x)`: osie EKRANU (0 = w dół, +Y w dół) — ten
    // sam wzór co w `ustawZwrot`, żeby model nie potrzebował przelicznika.
    this.attackRad = Math.atan2(v.x, v.y);
  }

  /**
   * **Ustaw ZWROT postaci wzdłuż ruchu, który się właśnie odbył** — bez
   * ruszania ciałem i bez wejścia gracza.
   *
   * ⚠ **Istnieje dla JEDNEGO przypadku: klatki dobiegnięcia lotu** (Szarża,
   * Wypad). `driveLocked` pisze zwrot w każdej klatce lotu, ale klatka,
   * w której lot się kończy, go nie woła — a `handleMovement` mogło w tej samej
   * klatce wpisać tam wychylenie drążka. Skutek był cichy i zgłaszalny jako
   * „doleciałem i nic": uzbrojony autoatak odbijał się od bramki zwrotu
   * (`GameScene.canStrikeFacing`), a komunikat nie padał, bo nie było zbocza
   * naciśnięcia.
   *
   * ⛔ **To NIE jest auto-obrót do celu.** Obraca w kierunek, w którym CIAŁO
   * faktycznie jechało przez cały lot — czyli dopisuje brakującą klatkę tej
   * samej reguły, którą `driveLocked` stosuje od pierwszej. Wołanie tego
   * z czegokolwiek, co nie przeniosło ciała, łamie decyzję z 2026-08-23.
   */
  faceAlongTravel(dx: number, dy: number): void {
    if (this.dead) return;
    this.ustawZwrot(new Phaser.Math.Vector2(dx, dy));
  }

  /**
   * **Jedyne miejsce, które zapisuje zwrot postaci** — `zwrotRad`, ciągły
   * kąt. ⚠ Do 2026-09-27 pisało obok skwantowany `moveDir`; usunięty, patrz
   * `zwrotRad`.
   *
   * ⚠ Wektor zerowy jest odrzucany, więc puszczenie drążka **zachowuje**
   * ostatni zwrot zamiast go kasować.
   */
  private ustawZwrot(v: Phaser.Math.Vector2): void {
    if (v.lengthSq() < 0.0001) return;
    // ⚠ `atan2(x, y)`, nie `(y, x)`: osie EKRANU (0 = w dół, +Y w dół). Ten
    // sam wzór, którego `Character3D` używał na prędkości, więc model nie
    // potrzebuje żadnego przelicznika — sprawdzone na 8 kierunkach, błąd 0,0°.
    this.zwrotRad = Math.atan2(v.x, v.y);
  }

  /**
   * Aim the next swing wherever the player is walking/standing — the
   * untargeted arc swing, which has always aimed along facing and must keep
   * doing so now that facing has been split in two.
   */
  aimAttackAlongMovement(): void {
    if (this.dead) return;
    // ⚠ Łuk bez celu bije wzdłuż ZWROTU — ciągłego, nie skwantowanego.
    this.attackRad = this.zwrotRad;
  }

  get isDead(): boolean {
    return this.dead;
  }

  /**
   * Drive movement from a normalized input vector (from the joystick).
   * Vector length in [0..1]; direction gives the 8-way heading.
   */
  handleMovement(input: Phaser.Math.Vector2, deltaMs = 0, sprintHeld = false): void {
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // A dash owns the body until it expires. Without this the joystick would
    // overwrite the dash velocity on the very next frame and the roll would
    // never travel — the input is read every frame, the dash is set once.
    const dashing = this.scene.time.now < this.dashUntil;
    /**
     * ── TRZY progi jednego wektora (obrót w miejscu, 2026-09-11) ───────────
     *
     * `wychylenie` → `martwe` (nic) / `obrot` (tylko zwrot) / `moving` (marsz).
     *
     * ⚠ **`movingInput` zostaje FAŁSZEM w strefie obrotu, i to jest cała
     * treść tej zmiany.** Na tym polu wisi bramka „ruch = brak ataku"
     * (`GameScene.resolveAttack`), więc obrót w miejscu **nie wstrzymuje
     * zamachu**: gracz obraca się kciukiem i cios wychodzi w tej samej klatce,
     * w której zwrot wpuścił cel. Gdyby obrót zapalał `movingInput`, poprawka
     * nie dałaby nic — dalej trzeba by puścić drążek.
     *
     * ⚠ Dolny próg to dawne `0,02` i zostaje nietknięty: to jest „palec leży,
     * ale nie prowadzi".
     */
    const wychylenie = input.length();
    const martwe = wychylenie <= 0.02;
    const moving = wychylenie >= STICK.turnZoneFrac;
    const obrot = !martwe && !moving;
    this.movingInput = moving;
    // The movement direction tracks the stick even while the body can't act on
    // it (rooted mid-swing, below), so the walk resumes the right way the
    // instant the root lifts rather than snapping a frame later.
    // ⚠ Strefa obrotu pisze tu DOKŁADNIE to samo, co marsz — zwrot jest jeden
    // i nie ma drugiego kanału na „patrzenie" (`zwrotRad`/`attackRad` to już
    // dwa pola i trzeciego mieć nie mają).
    if (moving || obrot) this.ustawZwrot(input);

    if (dashing) {
      // Unik owns the body outright, and deliberately outranks the swing root
      // below — the dash is the game's escape button and must never be eaten
      // by having just swung.
      // Speed is locked; steering mid-roll stays allowed via the zwrot above.
    } else if (this.scene.time.now < this.rootedUntil) {
      // Rooted for the length of the swing — see rootedUntil. GameScene
      // already refuses to START a swing while walking, so this only ever
      // catches someone who began moving after committing to one.
      body.setVelocity(0, 0);
    } else if (moving) {
      // The slow multiplies walking speed only. A dash covers a fixed distance
      // in a fixed time and is set above, outside this branch — which is what
      // makes Unik the clean answer to being webbed. That is deliberate; don't
      // "fix" it by folding the multiplier into dash().
      //
      // ⚠ **Sprint wymaga staminy > 0 i to jest JEDYNA twarda bramka w całym
      // systemie wysiłku.** Nie łamie reguły „zero nie blokuje działań
      // podstawowych", bo działaniem podstawowym jest CHODZENIE — i ono nie
      // jest blokowane nigdy. Bieg jest dopłatą do chodzenia, więc kończy się
      // razem z siłami.
      //
      // ⭐ Poza walką bieg jest darmowy (2026-10-11) i wtedy bramka > 0 nie
      // obowiązuje: odnowa i tak płynie, a podróż nie ma się urywać na zerze.
      const walka = this.inCombatForSprint;
      const kosztPoza = STAMINA.costs.sprintOutOfCombatPerSecond;
      const sprinting = sprintHeld && (Stamina.current > 0 || (!walka && kosztPoza <= 0));
      const speed = PLAYER.speed * this.speedMultiplier * (sprinting ? STAMINA.sprintSpeedMultiplier : 1);
      body.setVelocity(input.x * speed, input.y * speed);
      // ⚠ Poza walką przy stawce 0 NIE wołamy `spend` wcale — wywołanie
      // zerowałoby licznik odpoczynku i darmowy bieg dalej dławiłby odnowę.
      if (sprinting && (walka || kosztPoza > 0)) {
        // ⚠ Koszt na SEKUNDĘ, naliczany klatkami, mnożony przez obciążenie —
        // druga (i ostatnia) mechanika, której obciążenie dotyka.
        //
        // ⚠ Skutkiem ubocznym, o którym trzeba wiedzieć: każda klatka sprintu
        // zeruje licznik odpoczynku, więc bieg **wstrzymuje przyspieszoną
        // regenerację**. Zmierzone jako ważniejsze od samej stawki kosztu —
        // przy „sprint = wysiłek" nawet stawka zero zostawia gracza zmęczonym
        // (`docs/systemy/stamina.md`).
        Stamina.spend(
          ((walka ? STAMINA.costs.sprintPerSecond : kosztPoza) * deltaMs) / 1000,
          "sprint",
          this.scene.time.now,
          Equipment.loadMultiplier,
        );
      }
    } else {
      body.setVelocity(0, 0);
    }

    // Exactly one animation plays at a time, and which one is decided here:
    // the swing owns the sprite while it lasts (aimed by `attackRad`, NOT by
    // where the player is walking), then walk/idle takes over (`zwrotRad`).
    // ⚠ GRANICA LEGACY 2D: rząd arkusza liczy `wierszArkusza` z kąta, tutaj
    // i tylko tutaj — patrz ta funkcja.
    const wierszRuchu = wierszArkusza(this.zwrotRad);
    if (this.scene.time.now < this.attackPoseUntil) {
      const key = anim.attack(wierszArkusza(this.attackRad));
      if (this.anims.currentAnim?.key !== key) this.play(key, true);
      // Both the sword's position and its rotation are derived from `swing.t`,
      // so re-deriving them every frame keeps the blade attached to the hand.
      this.updateSword();
    } else if (this.sword.visible) {
      const key = moving ? anim.walk(wierszRuchu) : anim.idle(wierszRuchu);
      if (this.anims.currentAnim?.key !== key) this.play(key, true);
      this.scene.tweens.killTweensOf(this.swing);
      this.sword.setVisible(false);
    } else {
      const key = moving ? anim.walk(wierszRuchu) : anim.idle(wierszRuchu);
      if (this.anims.currentAnim?.key !== key) this.play(key, true);
    }

    this.setDepth(DEPTH.entities + this.y);
  }

  /**
   * Place and orient the sword for the current point in the swing.
   *
   * The hilt rides the weapon hand of the attack frame and pushes forward
   * through the middle of the swing; the blade sweeps a narrow arc around the
   * facing direction, tilted per PLAYER.swing.tiltDeg.
   *
   * Facing up draws the sword *behind* the player so the hilt tucks behind the
   * hair rather than sitting on top of it.
   */
  private updateSword(): void {
    const s = PLAYER.swing;
    // Kąt CIOSU, nie zwrotu: ostrze należy do zamachu. ⚠ Miecz 2D rysuje się
    // wyłącznie przy arkuszu (ścieżka awaryjna) i ma offsety dłoni per RZĄD,
    // więc bierze rząd z tej samej granicy legacy co animacja.
    const aim = wierszArkusza(this.attackRad);
    const hand = ASSETS.character.handOffsets[aim];
    const dir = dirToOffset(aim);

    // Rotate from wherever the icon happens to rest to where the blade should
    // point. Subtracting the measured rest angle (see PLAYER.swing.iconRestDeg)
    // rather than a hard-coded -90 is what keeps the grip in the hand.
    // Sweep width belongs to the SWING, not to PLAYER.swing: a thrust barely
    // rotates the blade while a cut carves the full arc. Captured at swing
    // start (like the thrust) so switching stance mid-swing cannot reshape a
    // blow already in flight.
    const half = this.swingSweepDeg;
    const sweepDeg = -half + 2 * half * this.swing.t;
    this.sword.setRotation(
      Phaser.Math.DegToRad(dirToAngleDeg(aim) + s.tiltDeg[aim] + sweepDeg - s.iconRestDeg),
    );

    const push = Math.sin(Math.PI * this.swing.t) * this.swingThrustPx;
    this.sword.setPosition(
      this.x + (hand.x + dir.x * push) * PLAYER.scale,
      this.y + (hand.y + dir.y * push) * PLAYER.scale,
    );
    this.sword.setDepth(this.depth + (aim === "up" ? -1 : 1));
  }

  /**
   * Roll one melee hit. Rolled per target rather than per swing, so a swing
   * that catches two rabbits can crit one and not the other.
   */
  /**
   * Środek CIAŁA gracza — patrz `Enemy.combatOrigin`, ten sam powód i ta sama
   * reguła: `body.center` z silnika, nigdy wzór liczony obok niego.
   *
   * ⚠ Leży **19 px pod środkiem sprite'a** (klatka 31×60, ciało 16 wysokości
   * przy stopach, `feetPadding` 3). To jest źródło „fantomowego dystansu" z
   * `docs/systemy/combat.md`: te same 19 px nie mają odpowiednika u
   * skoczka (2,25 px).
   *
   * ⚠⚠ **Do 2026-09-07 stało tu „Faza 1B przepina progi na ten punkt i rozjazd
   * znika". Faza 1B przepięła POŁOWĘ i rozjazd NIE zniknął.** Progi TRAFIENIA
   * przeszły na ten punkt w 1B-b, ale pozycjonowanie AI (`ring`, `seek`,
   * bramki dystansu) zostało w przestrzeni duszków — więc te same 19 px wróciły
   * po drugiej stronie: prześwit do wilka orbitującego na `circleRadius` 96
   * wahał się **75,2–93,4 px** zależnie od azymutu.
   *
   * ✅ **Domknięte 2026-09-07**: cała warstwa ruchu liczy dziś od `body.center`
   * (`core/movement/MoveSolver.ts`), więc rozjazd naprawdę zniknął — po obu
   * stronach. ⛔ Nie przywracaj dawnego zdania: to ono kazało uwierzyć, że
   * problem jest zamknięty.
   */
  get combatOrigin(): { x: number; y: number } {
    const b = this.body as Phaser.Physics.Arcade.Body;
    return { x: b.center.x, y: b.center.y };
  }

  /**
   * Hurtbox gracza — **OKRĄG**, bo ślad stopy jest praktycznie kołowy
   * (22 × 21 px, proporcja 1,05). Żadnej kapsuły i żadnej osi: postać ludzka
   * zajmuje z góry mniej więcej tyle samo w każdą stronę, niezależnie od tego,
   * dokąd patrzy.
   */
  get combatBody(): CombatBody {
    const o = this.combatOrigin;
    return { x: o.x, y: o.y, radius: (PLAYER.hurt.depth * PLAYER.scale) / 2 };
  }

  /**
   * ⚠ **`preCrit` doszło 2026-09-04 razem z Rozcięciem i jest ADDYTYWNE** —
   * `amount` i `crit` liczą się co do bitu tak, jak przedtem.
   *
   * Krwawienie snapshotuje 10% obrażeń **przed mnożnikiem krytycznym**
   * (decyzja autora): krytyk podnosi wyłącznie cios bezpośredni. Bez tego pola
   * wołający musiałby dzielić `amount` przez `Progression.critMultiplier`,
   * czyli **odtwarzać u siebie wiedzę o tym, jak ta funkcja składa liczbę** —
   * a lustra w tym projekcie rozjeżdżają się cicho.
   */
  /**
   * Rzut obrażeń tego ciosu.
   *
   * ⚠⚠ **Liczby przychodzą ZAMROŻONE w `StrikeProfile`, nie z żywego
   * `Progression` (2026-09-05)** — razem z `critChance`, bo ta czyta
   * `Equipment.weaponMelee`, czyli broń z ręki GŁÓWNEJ, i w Dual Wieldzie cios
   * off-handem losował krytyka szansą cudzej broni.
   *
   * ⚠ **Sama arytmetyka mieszka od 2026-09-05 w `core/combat/DamageRoll.ts`**
   * i nie zmieniła się o bit. Powód przeprowadzki jest dokładnie ten sam, co
   * przy `DamageResolver`: `Player` jest sprite'em Phasera, więc jedyna funkcja
   * licząca obrażenia ciosu była **nieosiągalna dla narzędzi** —
   * a `tools/combat_benchmark.mjs` ma mierzyć to, co gra naprawdę robi.
   * Tutaj zostaje wyłącznie to, czego tamta warstwa znać nie może: mnożnik
   * z efektów czasowych (Okrzyk bojowy).
   */
  rollDamage(liczby: DamageRollInput): DamageRollResult {
    return rollWeaponDamage(liczby, this.damageMultiplier);
  }

  /** Multiplier from timed effects (Okrzyk bojowy). 1 when nothing is active. */
  private get damageMultiplier(): number {
    const buff = this.effects.get(DAMAGE_BUFF_ID);
    return 1 + (buff ? DAMAGE_BUFF.get(buff, "bonus") : 0);
  }

  /**
   * Mnożnik prędkości chodu: **efekty czasowe (sieć) × obciążenie**.
   *
   * ⚠ **Obciążenie weszło tu 2026-09-15 (Model D, `OI-103`)** i jest to
   * pierwszy w tej grze kanał, w którym masa dotyka ruchu.
   * `Equipment.speedMultiplier` liczy się z **kilogramów bezwzględnych** —
   * ⛔ **Siła go nie zmniejsza i nie wolno jej tam dopisać**, bo na tym stoi
   * cała zasada modelu („Siła kompensuje wysiłek, nie masę").
   *
   * ⚠ **Mnożą się, nie wybierają większego.** Ciężki wojownik w sieci jest
   * wolniejszy niż lekki w sieci — to zamierzone. Unik zostaje odpowiedzią
   * na sieć w obu przypadkach, bo pokonuje **stały dystans w stałym czasie**
   * i tego mnożnika nie czyta (patrz `dash()`).
   *
   * ⚠ Sprint dziedziczy tę karę automatycznie, bo jest krotnością chodu
   * (`STAMINA.sprintSpeedMultiplier`) — i tak ma zostać.
   */
  private get speedMultiplier(): number {
    const slow = SLOW.find(this.effects);
    const spowolnienie = slow ? SLOW.get(slow, "factor") : 1;
    return spowolnienie * Equipment.speedMultiplier;
  }

  /**
   * **Przewiń wszystkie efekty czasowe.** Jedno wywołanie ze sceny na wszystko,
   * co trwa: buff obrażeń, spowolnienie, jad, posiłek.
   *
   * ⚠ **Osobne od `regenerate()` i tak ma zostać** — tamto jest zbramkowane na
   * „poza walką", a te efekty istnieją właśnie po to, żeby działać W TRAKCIE.
   */
  updateEffects(deltaMs: number): void {
    this.effects.tick(deltaMs);
    this.syncBuffBar();
  }

  /* ── EffectHost: co warstwa efektów może zapytać tej encji ─────────────
     ⚠ Warstwa nie zna `Player` — to `Player` deklaruje, że umie odpowiedzieć
     na cztery pytania. Patrz `core/combat/StatusEffects.ts`. */

  /** Tik efektu. Dziś jedyny tikający efekt to jad. */
  onEffectTick(effect: ActiveEffect): void {
    if (POISON.carries(effect)) {
      this.takeVenomTick(POISON.get(effect, "damagePerStack") * effect.stacks);
    }
  }

  /** Efekt doszedł, odszedł albo zmienił stosy — przebuduj pasek i ogłoś. */
  onEffectsChanged(): void {
    this.syncBuffBar();
    GameEvents.emit(EVENT.buffsChanged);
  }

  /**
   * Posiłek **czeka** w walce, zamiast się marnować — reguła przeniesiona
   * z dawnego `regenerate()` (*„the duration only burns while the food is
   * actually working"*). ⚠ Ta sama wartość steruje prezentacją, więc pasek
   * i odliczanie nie mogą się rozjechać.
   */
  isEffectPaused(effect: ActiveEffect): boolean {
    return effect.spec.id === FOOD_BUFF_ID && this.inCombatForRegen;
  }

  /**
   * Czy bieg kosztuje teraz stawkę BOJOWĄ (`STAMINA.sprintCombatWindowMs`):
   * wróg w pościgu (`wWalce`, liczone w `GameScene`), cios przyjęty albo
   * wysiłek bojowy w oknie. ⚠ Osobno od `inCombatForRegen` — tamto zna tylko
   * PRZYJĘTE ciosy, a pogoń za trafionym, uciekającym lisem ma kosztować.
   */
  private get inCombatForSprint(): boolean {
    const now = this.scene.time.now;
    const okno = STAMINA.sprintCombatWindowMs;
    return this.wWalce || now - this.lastDamagedAt < okno || now - Stamina.combatEffortAt < okno;
  }

  /** Blokada regeneracji z reguły pięciu sekund (`PLAYER.regenDelayMs`). */
  private get inCombatForRegen(): boolean {
    return this.scene.time.now - this.lastDamagedAt < PLAYER.regenDelayMs;
  }

  /**
   * **Rzutuj żywe efekty na pasek** (`core/Buffs` — lista dla UI).
   *
   * ⚠ `Buffs` jest PREZENTACJĄ, nie mechaniką, i po tej zmianie widać to
   * wprost: mechanika mieszka w `EffectSet`, a to jest jej jednokierunkowe
   * odwzorowanie. Zdarzenie leci wyłącznie z `onEffectsChanged`, więc licznik
   * odświeżany co klatkę nie zasypuje HUD-u — dokładnie jak przedtem.
   */
  private syncBuffBar(): void {
    const zywe = this.effects.list();
    const id = new Set(zywe.map((e) => e.spec.id));
    for (const wpis of [...Buffs.active]) {
      if (!id.has(wpis.id)) Buffs.remove(wpis.id);
    }
    for (const e of zywe) {
      Buffs.set({
        id: e.spec.id,
        name: e.spec.name,
        iconKey: e.spec.iconKey,
        remainingMs: e.remainingMs,
        durationMs: e.spec.durationMs,
        debuff: e.spec.debuff,
        stacks: (e.spec.maxStacks ?? 1) > 1 ? e.stacks : undefined,
        detail: e.spec.detail?.(e),
        remainingHp: e.spec.id === FOOD_BUFF_ID ? FOOD_HEAL.get(e, "remaining") : undefined,
        paused: this.isEffectPaused(e) || undefined,
      });
    }
  }

  private clearSlow(): void {
    const slow = SLOW.find(this.effects);
    if (slow) this.effects.remove(slow.spec.id);
  }

  /**
   * **Nałóż efekt czasowy** — jedyna droga, którą coś z zewnątrz zakłada
   * graczowi jad, spowolnienie albo buff (`core/combat/Contracts.EffectTarget`).
   *
   * ⚠ **Bierze GOTOWĄ specyfikację i nie wie, czym ona jest.** Do 2026-09-03
   * stały tu `applyVenom(cfg)` i `applySlow(...)`, czyli mechanika skoczka
   * i sieciarza **mieszkająca w graczu** — każdy nowy efekt dokładał tu kolejną
   * metodę o cudzej nazwie. Dziś właściciel efektu buduje go u siebie
   * (`VenomSpider.venomSpec`, `Projectile`), a gracz jest tylko nosicielem.
   */
  applyEffect(spec: EffectSpec, source?: EffectSource): void {
    if (this.dead) return;
    this.effects.apply(spec, source);
  }

  private clearVenom(): void {
    const venom = POISON.find(this.effects);
    if (venom) this.effects.remove(venom.spec.id);
  }

  /**
   * One venom tick — the QUIET damage path, and every difference from
   * `takeDamage` below is deliberate.
   *
   * ⚠ **No sound, no hit flash, no camera shake.** `takeDamage` fires all
   * three, which is right for a blow and unbearable for a damage-over-time:
   * four ticks over six seconds would be four screen shakes and four grunts,
   * and that reads as the game malfunctioning rather than as poison. The venom
   * announces itself through the buff icon, its stack counter and the HP bar —
   * the same channels the web's slow already uses.
   *
   * ⚠ **Not reduced by armour, and not typed.** Armour stops a blow from
   * landing; it does nothing about a toxin already inside. Passing this through
   * the usual mitigation would also collapse it numerically: at 2–6 raw damage,
   * `Math.round(amount × (1 − reduction))` moves a tick by at most one point,
   * so "steel resists poison" would be a claim the numbers can't carry anyway.
   *
   * ⚠ **Invulnerability does NOT stop a tick** — for the same reason a dash
   * doesn't clear the venom. I-frames are about avoiding contact.
   *
   * What it DOES share with `takeDamage`, on purpose: it restarts the
   * five-second regeneration lockout and destroys any meal in progress. That is
   * the whole cost model of this enemy — six seconds of venom plus five of
   * lockout is ~11 seconds in which walking away heals nothing.
   */
  private takeVenomTick(amount: number): void {
    if (this.dead || amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.lastDamagedAt = this.scene.time.now;
    this.clearFoodHeal();
    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
    if (this.hp <= 0) this.die();
  }

  /**
   * Roll `distancePx` along `dir` over `durationMs`, briefly invulnerable.
   *
   * Driven by body velocity rather than a position tween on purpose: velocity
   * still collides, so a roll into a tree or the map edge stops there instead
   * of teleporting through it. Returns false if the dash can't start.
   */
  dash(
    dir: Phaser.Math.Vector2,
    distancePx: number,
    durationMs: number,
    invulnerableMs: number,
  ): boolean {
    if (this.dead) return false;
    // Zwrot, nie cios: przewrót bez drążka leci tam, gdzie postać PATRZY, a nie
    // tam, gdzie ostatnio uderzyła. ⚠ Z CIĄGŁEGO `zwrotRad` (`OI-149`,
    // 2026-09-27) — ćwiartka `moveDir` puszczała go do 45° obok zwrotu modelu.
    const heading = dir.lengthSq() > 0.0001
      ? dir.clone().normalize()
      : new Phaser.Math.Vector2(Math.sin(this.zwrotRad), Math.cos(this.zwrotRad));
    const speed = distancePx / (durationMs / 1000);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(heading.x * speed, heading.y * speed);
    this.dashUntil = this.scene.time.now + durationMs;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.scene.time.now + invulnerableMs);

    // Ghost trail: reads as speed and doubles as the i-frame tell.
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(0.55);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: invulnerableMs,
      ease: "Quad.easeIn",
    });
    return true;
  }

  /**
   * Pchnij ciało z prędkością `speed` w kierunku (dx, dy) na JEDNĄ klatkę,
   * blokując na ten czas gałkę.
   *
   * ⚠ **Osobne od `dash()`, bo odpowiada na inne pytanie.** `dash` jest
   * jednorazowym impulsem: ustawia prędkość RAZ i oddaje ciało po zadanym
   * czasie — dokładnie to, czym jest przewrót w wybraną stronę. Szarża musi
   * co klatkę korygować kurs, bo cel się rusza: wilk krąży 200 px/s, więc
   * przy locie 400 px sztywny wektor rozminąłby się z nim o ponad sto pikseli
   * i „podbiegnięcie do celu" kończyłoby się obok celu.
   *
   * `holdMs` jest celowo krótkie (jedna–dwie klatki): to jest DZIERŻAWA, nie
   * rezerwacja. Gdy wołający przestanie ją odnawiać, ciało wraca do gałki samo
   * — więc przerwana szarża nie zostawia gracza sparaliżowanego, choćby
   * przerwał ją portal, śmierć albo zniknięcie celu.
   */
  driveLocked(dx: number, dy: number, speed: number, holdMs: number): void {
    if (this.dead) return;
    const len = Math.hypot(dx, dy);
    if (len < 0.0001) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity((dx / len) * speed, (dy / len) * speed);
    this.dashUntil = Math.max(this.dashUntil, this.scene.time.now + holdMs);
    // Kierunek patrzenia jedzie z biegiem, żeby postać nie sunęła bokiem.
    this.ustawZwrot(new Phaser.Math.Vector2(dx, dy));
  }

  /** Zwolnij ciało natychmiast — koniec szarży nie ma się ślizgać. */
  releaseDrive(): void {
    this.dashUntil = 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  /** Apply a timed damage buff and mirror it into the shared Buffs snapshot. */
  startDamageBuff(bonus: number, durationMs: number, name: string, iconKey: string): void {
    if (this.dead) return;
    this.effects.apply({
      id: DAMAGE_BUFF_ID,
      name,
      iconKey,
      durationMs,
      tags: [DAMAGE_BUFF.tag],
      payload: DAMAGE_BUFF.payload({ bonus }),
    });
  }

  /**
   * Tick the damage buff's countdown for the buff bar. Separate from
   * regenerate() because that one is gated on being OUT of combat, and this
   * buff exists precisely to be used mid-fight.
   */
  private clearDamageBuff(): void {
    this.effects.remove(DAMAGE_BUFF_ID);
  }

  /** True if the attack is off cooldown right now. */
  canAttack(nowMs: number): boolean {
    return !this.dead && nowMs >= this.attackReadyAt;
  }

  /**
   * Arm the cooldown, play the swing, and describe the strike for the caller.
   *
   * Returns both the forward point (where the swing FX is drawn) and the unit
   * facing vector, because the hit test is an ARC anchored at the player, not
   * a circle around that forward point — see PLAYER.attackArcDeg.
   *
   * `roots` is what separates a committed basic attack from an ability that
   * merely borrows the swing animation. Default true (the basic attack);
   * Wir ostrzy passes false, because an AoE meant to answer a swarm must not
   * pin the player inside that swarm — see `rootedUntil`.
   */
  triggerAttack(
    nowMs: number,
    opts: {
      roots?: boolean;
      /**
       * Nadpisanie DŁUGOŚCI ZAMACHU (ms) — pozy, tweena ostrza i bufora.
       *
       * ⚠ **Istnieje dla ciosów z własnym rytmem** (Ciężkie uderzenie), a nie
       * dla strojenia broni: tempo broni należy do `Progression`. Wołający
       * musi pamiętać, że **trafienie wypada w POŁOWIE** tej liczby
       * (`PLAYER.swingHitFraction`), bo tam ostrze jest maksymalnie
       * wyprostowane — więc zamach mający trafić po `X` ms podaje `2X`.
       */
      durationMs?: number;
      /** Nadpisanie długości UKORZENIENIA (ms). Bez tego root bierze się
       *  z `Progression.rootDurationMs`, czyli z tempa broni. */
      rootMs?: number;
      /**
       * Nadpisanie KADENCJI (ms) — po tylu ms wolno uderzyć ponownie.
       *
       * ⚠ **Istnieje dla Dual Wieldu (2026-09-05): bramka należy do ręki,
       * która właśnie uderzyła.** Bez tego każdy cios — także off-handem —
       * ustawiał okno tempem broni GŁÓWNEJ, więc druga broń nie uczestniczyła
       * w kadencji w ogóle.
       *
       * ⚠ **Brak parametru = tempo broni głównej**, czyli dokładnie dzisiejsze
       * zachowanie. Umiejętności i finisher Wypadu go nie podają i mają nie
       * podawać — zostają na ręce głównej.
       */
      cooldownMs?: number;
      /**
       * Jak zamach WYGLĄDA na modelu 3D (2026-10-11) — wyłącznie prezentacja:
       * `"wir"` = obrót o pełne koło (Wir ostrzy), `"tarcza"` = klip uderzenia
       * tarczą. Brak = zwykły cios bronią.
       */
      poza?: "wir" | "tarcza";
    } = {},
  ): {
    x: number;
    y: number;
    radius: number;
    dirX: number;
    dirY: number;
  } {
    // Both the cooldown gate and the swing's own feel (duration, thrust) come
    // from the equipped weapon — a dagger snaps through a quick swing, a
    // hammer commits to a slow, heavy one. Bare hands fall back to PLAYER's
    // baseline (see Progression.attackCooldown/swingDurationMs/swingThrustPx).
    const swingDurationMs = opts.durationMs ?? Progression.swingDurationMs;
    this.attackReadyAt = nowMs + (opts.cooldownMs ?? Progression.attackCooldown * 1000);
    this.swingThrustPx = Progression.swingThrustPx;
    this.swingSweepDeg = Progression.swingSweepDeg;
    // Hold the attack pose for exactly as long as the swing takes (plus a
    // small buffer) — a fixed hold would cut a slow weapon's swing short or
    // linger awkwardly after a fast one.
    this.attackPoseUntil = nowMs + swingDurationMs + PLAYER.swingPoseBufferMs;
    this.zamachOd = nowMs;
    this.zamachMs = swingDurationMs;
    this.zamachPoza = opts.poza;
    // ⚠ Root NIE jest już równy pozie (zmiana 2026-08-20). Poza to animacja
    // i kierunek osłony; root to zobowiązanie ciała, a Zręczność skraca jego
    // drugą połowę — patrz `Progression.rootDurationMs`, gdzie stoi cały
    // powód i pomiar. Przy Zręczności 0 obie liczby dalej są identyczne, więc
    // dla postaci bez tej inwestycji nic się nie zmienia.
    //
    // Nadal pomijany w całości dla umiejętności, która chciała tylko animacji
    // (Wir ostrzy) — `roots: false`.
    if (opts.roots !== false) this.rootedUntil = nowMs + (opts.rootMs ?? Progression.rootDurationMs);
    // ⚠ **Cios NA STOJĄCO zostawia postać zwróconą tam, gdzie uderzyła
    // (`OI-146`, decyzja autora 2026-10-09).** Do tej daty po zamachu w cel
    // pod kątem `guardKat` wracał z `attackRad` na `zwrotRad`, czyli do
    // kierunku ostatniego marszu: model skakał cios → stary zwrot → cios,
    // tarcza między ciosami kryła drogę, którą gracz przyszedł, a bramka
    // następnego ciosu liczyła kąt od tamtego kierunku.
    // Rozdział `attackRad` ↔ `zwrotRad` chroni BIEG (52 ze 120 klatek zamachu
    // w złą stronę), więc przejęcie zachodzi wyłącznie bez marszu. Strefa
    // obrotu drążka nadal pisze zwrot w następnej klatce — palec wygrywa.
    // ⛔ To NIE jest auto-obrót do celu (usunięty 2026-08-23): zamach w cel
    // wychodzi dopiero przez `canStrikeFacing`, więc obrót zostawia po sobie
    // tylko cios, który już legalnie padł w przedniej półkuli.
    if (!this.movingInput) {
      this.ustawZwrot(new Phaser.Math.Vector2(Math.sin(this.attackRad), Math.cos(this.attackRad)));
    }
    // Everything below reads attackRad — the caller (GameScene.resolveAttack)
    // has already aimed it, either at the selected target or along movement.
    this.play(anim.attack(wierszArkusza(this.attackRad)), true);
    Sfx.play("swing");
    // ⚠ **Kierunek z `attackRad`, nie z ćwiartki (`OI-147`, wariant A,
    // 2026-09-27).** Ta wartość NIE decyduje o trafieniu — autoatak trafia po
    // celu, zasięgu i bramce zwrotu (`GameScene.damageLockedTarget`,
    // `canStrikeFacing`), a `x/y` niżej nie czyta nikt. Jedzie wyłącznie do
    // pierścienia efektu (`pendingSwing.dirX/dirY` → `spawnSwingFx`), który na
    // ćwiartce odjeżdżał do 43,7 px w bok od linii ciosu, choć model, wypad
    // i osłona szły już za prawdziwym kątem. Pomiar i warianty:
    // `docs/postac3d_checkpoint.md` §36.1.
    const heading = new Phaser.Math.Vector2(Math.sin(this.attackRad), Math.cos(this.attackRad));
    const offset = heading.clone().scale(PLAYER.attackRange);

    // Run the swing from a single 0→1 progress value: updateSword() derives both
    // the blade angle and the hilt position from it, so the two can never drift
    // out of sync the way two independent tweens could.
    this.scene.tweens.killTweensOf(this.swing);
    this.swing.t = 0;
    // Bare hands means fists, not an invisible sword — nothing to show.
    // Przy modelu 3D broń trzyma model, więc płaski miecz zostaje zgaszony.
    this.sword.setVisible(!this.rysujeModel3d && !!Equipment.weapon);
    this.updateSword();
    this.scene.tweens.add({
      targets: this.swing,
      t: 1,
      duration: swingDurationMs,
      ease: "Quad.easeOut",
    });

    // Wypad przy zamachu — „feel", ale ruszający PRAWDZIWYM ciałem.
    //
    // ⚠ **Przepisany na `nudge` w 5B i to nie jest kosmetyka.** Poprzednia
    // wersja tweenowała `x`/`y` na wartości BEZWZGLĘDNE policzone w chwili
    // startu, więc każde inne przesunięcie w tym samym oknie (recoil od
    // trafienia, które ląduje w POŁOWIE zamachu) było przez nią kasowane —
    // wypad wpisywał co klatkę pozycję, która o recoilu nic nie wiedziała.
    // Przyrostowo oba się sumują. Liczby bez zmian: 40 × 0,15 = 6 px / 70 ms.
    // ⚠⚠ **WYPAD IDZIE ZA POZĄ, NIE ZA ĆWIARTKĄ** (2026-09-22). Do tej daty
    // `heading` był skwantowany (`dirToOffset(attackDir)`), a model obracał się
    // już pod prawdziwy kąt celowania (`attackRad`) — wypad wzdłuż ćwiartki
    // odjeżdżał nawet **45° od tego, w co postać jawnie patrzy**: przy celu pod
    // 45° składowa BOCZNA to 4,2 px z 6 px wypadu. Czytało się to jako „postać
    // mimowolnie zjeżdża w bok i wraca". Od 2026-09-27 `heading` też idzie za
    // `attackRad` (`OI-147`, wariant A), więc wypad i pierścień efektu mają
    // jeden kierunek.
    applyImpulse(this.scene, this, {
      dirX: heading.x,
      dirY: heading.y,
      distancePx: PLAYER.swingLunge.px,
      outMs: PLAYER.swingLunge.ms,
      backMs: PLAYER.swingLunge.ms,
      curve: "quadOut",
    });

    return {
      x: this.x + offset.x,
      y: this.y + offset.y,
      radius: PLAYER.attackRadius,
      dirX: heading.x,
      dirY: heading.y,
    };
  }

  /**
   * Called after Endurance goes up: hand the player the HP they just unlocked,
   * so the bar keeps its fill instead of appearing to drop.
   */
  grantMaxHpIncrease(delta: number): void {
    if (delta <= 0 || this.dead) return;
    this.hp = Math.min(this.maxHp, this.hp + delta);
    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
  }

  /** Restore HP (e.g. a potion), clamped to max. */
  heal(amount: number): void {
    if (amount <= 0 || this.dead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
  }

  /**
   * Passive out-of-combat regeneration, driven from GameScene's update loop.
   * No-ops while dead, at full HP, or within PLAYER.regenDelayMs of the last
   * hit taken (the "five second rule" that keeps potions the only answer to
   * damage *during* a fight).
   *
   * Two details worth keeping:
   *  • HP is deliberately carried as a float here. The trickle is well under
   *    1 HP per second at low Kondycja, so rounding each frame would floor it
   *    to zero and the whole mechanic would silently do nothing.
   *  • The change event fires only when the whole-number HP actually moves
   *    (or the bar tops out), not every frame — otherwise this would emit ~60
   *    events a second and drag the HUD and character panel along with it.
   *
   * Because it is called from GameScene.update, regeneration also stops while
   * a panel has the scene paused — opening the backpack is not a free heal.
   */
  regenerate(deltaMs: number): void {
    if (this.dead) return;
    if (this.hp >= this.maxHp) {
      this.clearFoodHeal(); // nothing left to top up; don't bank it for later
      return;
    }

    // ⚠ Liczone PRZED wyjściem, żeby pasek pokazał czekający posiłek jako
    // wstrzymany, a nie po cichu zamrożony. Ta sama wartość steruje pauzą
    // efektu (`isEffectPaused`), więc odliczanie i prezentacja nie mogą się
    // rozjechać.
    if (this.inCombatForRegen) return;

    const seconds = deltaMs / 1000;
    let amount = Progression.hpRegenPerSecond * seconds;

    // Food stacks on top of passive regen — both are "out of combat healing"
    // and gated by the same rule, so there's no reason for them to exclude
    // each other.
    // ⚠ `remainingMs` posiłku odlicza `EffectSet` (i wstrzymuje w walce);
    // tutaj zostaje wyłącznie ZUŻYCIE puli HP, bo tylko host wie, ile z niej
    // realnie poszło w tej klatce.
    const food = this.effects.get(FOOD_BUFF_ID);
    if (food) {
      const zostalo = FOOD_HEAL.get(food, "remaining");
      const tick = Math.min(FOOD_HEAL.get(food, "perSecond") * seconds, zostalo);
      amount += tick;
      FOOD_HEAL.set(food, "remaining", zostalo - tick);
      if (FOOD_HEAL.get(food, "remaining") <= 0) this.clearFoodHeal();
    }

    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (Math.floor(this.hp) !== Math.floor(before) || this.hp >= this.maxHp) {
      GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
    }
  }

  /** Mirror the live food state into the shared Buffs snapshot the buff bar
   *  reads. Only emits when the buff appears/disappears — the per-frame
   *  countdown is read straight off the snapshot instead. */
  private clearFoodHeal(): void {
    this.effects.remove(FOOD_BUFF_ID);
  }

  /**
   * Begin a food heal-over-time (see ITEMS.cooked_meat). Ticks inside
   * regenerate(), so it inherits the five-second rule for free — food never
   * heals mid-fight, which is exactly what keeps potions worth carrying.
   *
   * Eating again replaces the pending heal rather than stacking two of them:
   * stacking would let a stack of meat out-heal any potion, collapsing the
   * tier split it was designed around.
   */
  startHealOverTime(amount: number, durationMs: number, itemId: ItemId): void {
    if (this.dead || amount <= 0 || durationMs <= 0) return;
    const def = getItem(itemId);
    // `apply` ogłasza od razu (`onEffectsChanged`), więc ikona pojawia się
    // w tej samej klatce, w której gracz zjadł — także wtedy, gdy posiłek
    // czeka na koniec blokady regeneracji.
    this.effects.apply({
      id: FOOD_BUFF_ID,
      name: def.name,
      iconKey: itemIconKey(itemId),
      durationMs,
      tags: [FOOD_HEAL.tag],
      payload: FOOD_HEAL.payload({ remaining: amount, perSecond: amount / (durationMs / 1000) }),
    });
  }

  /** True while the post-resurrection grace period is running. */
  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  /**
   * Apply incoming damage (mitigated by equipped armor); returns true if lethal.
   *
   * ⚠ **`damageType` is REQUIRED and `null` means "no type involved".** It was
   * optional for two whole steps, and in that time every single caller omitted
   * it — so `ARMOR_PROFILE`'s `metal` column did nothing at all, the steel↔
   * leather choice was decoration, and nothing in the codebase said so. An
   * optional parameter turns "we decided this hit has no type" and "somebody
   * forgot" into the same source text; a required one cannot. Writing `null`
   * costs four characters and is a decision on the record.
   *
   * The type itself comes from DATA (`EnemyConfig.touchDamageType`,
   * `BOAR.charge.damageType`, `GREY_WOLF.duel.biteDamageType`,
   * `WEB_PROJECTILE.damageType`), never from a literal at the call site — the
   * mirror of the player's own side, where it rides on the attack variant in
   * `ITEMS` rather than on the code that swings the weapon.
   *
   * ⚠ **The type decides mitigation and NOTHING else.** No knockback, no
   * stagger, no interrupt, no status. `blunt` from a boar hurts a steel-clad
   * player more; it does not shove them. Same rule `AttackVariant.interrupts?:
   * false` enforces in the other direction — see `docs/systemy/armor.md` R-5.
   *
   * `null` is converted to `undefined` at this one boundary because
   * `core/Protection` speaks the optional dialect (it serves BOTH directions of
   * combat and its contract is documented there). This is the only place the
   * two meet, and it is deliberately the only place.
   *
   * ── `from` — WEKTOR DO NAPASTNIKA (SHIELD-02) ──────────────────────────────
   * ⚠ **Trzeci parametr jest WYMAGANY z dokładnie tego samego powodu, co
   * `damageType`**, i to nie jest ostrożność — to jest wniosek z błędu, który
   * ta gra już popełniła. `damageType` był opcjonalny przez dwa kroki, w tym
   * czasie każdy bez wyjątku wywołujący go pomijał, więc kolumna `metal`
   * w `ARMOR_PROFILE` nie robiła nic, a nic w kodzie tego nie mówiło. Parametr
   * opcjonalny sprawia, że „zdecydowaliśmy, że ten cios nie ma kierunku"
   * i „ktoś zapomniał" wyglądają w źródle identycznie.
   *
   * `null` = cios bez kierunku, świadomie nie do zablokowania. Dziś nie ma
   * takiego kanału — wszystkie pięć ma pozycję napastnika pod ręką — ale
   * pułapka, wybuch magiczny czy trucizna z podłoża będą go miały.
   *
   * ⚠ **Jad NIE przechodzi tędy i tak ma zostać.** `takeVenomTick` jest
   * osobną, cichą ścieżką; tarcza nie zatrzymuje toksyny, która jest już
   * w środku. Zero pracy — działa samo z siebie.
   */
  /**
   * Ogłoś, co stało się z ciosem PRZYJĘTYM przez gracza — dźwięk, błysk,
   * trzęsienie kamery i szarpnięcie ciała.
   *
   * ── ⚠ Faza 5B: cztery gałęzie zeszły do jednego wywołania ────────────────
   * Do 2026-08-23 `takeDamage` decydowało lokalnie w czterech miejscach:
   * `Sfx.play("dodge") + flashHit(dodgeTint)`, `…("parry") + parryTint`,
   * `…("block") + blockTint`, `…("hurt") + domyślny`. To jest dokładnie ten
   * kształt, który Faza 2 usunęła gdzie indziej — jedna decyzja rozpisana po
   * gałęziach, gdzie nikt jej nie znajdzie i gdzie piąta gałąź zawsze zapomni
   * o jednym kanale.
   *
   * ⚠ **Przy przenosinach wyszła realna usterka, nie tylko brzydota:**
   * `Sfx.play("hurt")` stało tu obok `playCues`, a `cuesFor` dla `hit`
   * **też** zwracało `hurt` (`COMBAT_FEEDBACK.tiers.medium.sfx`). Ten sam
   * dźwięk leciał więc DWA razy na każde trafienie — raz surowo, raz
   * rozstrojony — a trzeci raz z `Enemy.reportAttack`. Nie było tego słychać
   * wyłącznie dlatego, że `Sfx.minRetriggerMs` po cichu zjadał duplikaty.
   * Przepustnica maskowała błąd, zamiast go pokazać.
   *
   * ⚠ **`from` to wektor DO NAPASTNIKA**, więc kierunek ciosu jest jego
   * odwrotnością. Ta zamiana znaku ma zostać w JEDNYM miejscu — pomylona,
   * szarpnęłaby graczem w stronę tego, kto go właśnie uderzył.
   */
  private ogloszCios(
    outcome: ActionOutcome,
    mitigated: number,
    from: Phaser.Math.Vector2 | null,
    execution: Execution,
  ): void {
    // ⚠ Jedno rozstrzygnięcie, dwóch konsumentów: `cuesFor` (klient)
    // i `effectsFor` (autorytet). Dwa literały opisujące ten sam cios
    // rozjechałyby się przy pierwszej zmianie pola, a **nic by tego nie
    // złapało** — prezentacja i skutki mechaniczne nie mają jak się nawzajem
    // sprawdzić.
    const rozstrzygniecie: ActionResolution = {
      actionId: "incoming",
      outcome,
      execution,
      mitigated,
      tier: Stamina.impactTier(mitigated),
      crit: false,
      againstPlayer: true,
      at: { x: this.x, y: this.y },
      dir: from ? { x: -from.x, y: -from.y } : null,
      // ⚠ **`"none"`, bo to rozstrzygnięcie patrzy od strony CELU.** Ten sam
      // cios opisują dwa obiekty: ten (kanał gracza: dźwięk, błysk, szarpnięcie
      // przyjmującego) i ten z `Enemy.reportAttack`, który JAKO JEDYNY zna
      // akcję i jej `attackerRecoil`, więc to on kopie napastnikiem. Wpisanie
      // tu `"onHit"` dołożyłoby drugie kopnięcie do tego samego ciosu.
      attackerRecoil: "none",
    };
    playCues(
      this.scene,
      cuesFor(rozstrzygniecie),
      { x: this.x, y: this.y },
      null,
      { sprite: this },
    );
    // ⚠ **Skutki mechaniczne osobnym wywołaniem, nie wewnątrz `playCues`.**
    // Kuszące byłoby jedno „zastosuj wszystko" — i byłoby błędem: to są dwa
    // różne zbiory odbiorców (klient kontra autorytet), a cały podział §5.6
    // audytu istnieje po to, żeby dało się je rozdzielić bez szukania. O tym,
    // że blok i unik NIE szarpią ciałem, decyduje `effectsFor`, nie warunek
    // tutaj.
    const skutki = effectsFor(rozstrzygniecie);
    if (skutki.targetImpulse) applyImpulse(this.scene, this, skutki.targetImpulse);
  }

  /**
   * ⚠ **Przyjmuje PAKIET, nie parę `(amount, damageType)`** — zmiana kontraktu
   * z 2026-09-03 (`core/combat/DamagePacket.ts`). Zachowanie jest identyczne:
   * każdy dzisiejszy cios ma dokładnie jeden komponent, a warstwa 3 pracuje
   * dalej na jego sumie i jego typie.
   *
   * ⚠ Sygnatura **nie została zrównana z `Enemy.takeDamage`** i nie ma zostać:
   * po tej stronie stoi cały łańcuch obrony (unik, parowanie, blok, pancerz),
   * więc zwracane jest pełne rozstrzygnięcie; wróg przyjmuje odrzut i zwraca
   * „czy zabity". Patrz `core/combat/Contracts.ts` — sztuczna identyczność
   * była tam świadomie odrzucona.
   */
  takeDamage(
    packet: DamagePacket,
    from: Phaser.Math.Vector2 | null,
    /**
     * Wynik WARSTWY 2 po stronie napastnika — decyduje, które cue zagra przy
     * `hit` (czyste trafienie czy ześlizg).
     *
     * ⚠ **Domyślne `"clean"` jest tu DECYZJĄ, nie wyjątkiem od reguły
     * o parametrach opcjonalnych.** Kanały bez `ActionResolution` — kontakt
     * przez `overlap` i pocisk sieciarza — z kontraktu **nie mają** kategorii
     * warstwy 2, tylko skalar `m(P)` naniesiony wcześniej na `amount`. Dla nich
     * `"clean"` jest jedyną poprawną odpowiedzią, a nie brakiem odpowiedzi.
     *
     * ⚠ Po stronie NAPASTNIKA jest odwrotnie: `Enemy.reportAttack` żąda tego
     * pola wprost, bo tam każdy pominięty argument byłby przeoczeniem.
     */
    execution: Execution = "clean",
  ): DamageReceipt {
    // Spłaszczenie pakietu do pary, na której pracuje warstwa 3. ⚠ To jest
    // JEDYNY szew między nowym kontraktem a dzisiejszą arytmetyką — patrz
    // nagłówek `DamagePacket` po powód, dla którego mitygacja per komponent
    // jest świadomie NIEROZSTRZYGNIĘTA.
    const amount = totalAmount(packet);
    const damageType = primaryType(packet);
    // ⚠ **Zwraca WYNIK, nie tylko „czy zabił" (Faza 5A).** Napastnik musi
    // wiedzieć, co się stało z jego ciosem — inaczej nie da się zbudować
    // `ActionResolution`, a bez niego prezentacja znów rozsypałaby się na
    // lokalne efekty w pięciu klasach. To rozszerzenie ODCZYTU, nie zmiana
    // łańcucha decyzyjnego: kolejność Dodge → Parry → Block → Pancerz i
    // wszystkie liczby Combat v1 zostają nietknięte.
    if (this.dead || this.isInvulnerable) {
      return { outcome: "immune", mitigated: 0, killed: false };
    }

    // ── Attack Resolver (Combat v1): Dodge -> Parry -> Block -> Armor ──────
    // Geometria/zasięg już zdecydowały że ten cios FIZYCZNIE dosięga — od tego
    // miejsca w dół rozstrzyga się, co się z nim dzieje. Dodge i Parry to
    // pasywne, bez inputu, PRD-owe (`core/Defense.ts`) — żadne z nich nie jest
    // przyciskiem ani ruchem ciała. Pełne uzasadnienie kolejności i liczb:
    // `docs/dziennik.md`, wpis Combat v1 (2026-08-24).
    //
    // ⚠ Dodge jest WSZECHKIERUNKOWY — próbowany zawsze, niezależnie od tego,
    // skąd nadchodzi cios. Parry jest FRONTALNY jak Block, więc dzieli z nim
    // ten sam warunek `isFrontal`.
    // ⚠ Faza 1A.5: samo ROZSTRZYGNIĘCIE mieszka w `core/DamageResolver.ts`.
    // Tutaj zostaje wyłącznie to, co rozstrzygnięciem nie jest: dźwięk, tint,
    // trzęsienie kamerą, stamina, zdarzenia. Kolejność Dodge → Parry → Block →
    // Pancerz i jedno zaokrąglenie są własnością tamtej funkcji.
    const wynik = resolveIncoming({
      amount,
      damageType,
      from,
      guardDir: this.guardKat,
      invulnerable: false, // sprawdzone wyżej, razem z `dead`
      dodgeChance: Progression.dodgeChance,
      parryChance: Progression.parryChance,
      armorReduction: Equipment.reductionAgainst(damageType ?? undefined),
      blockReduction: Equipment.blockSpec?.reduction ?? 0,
      // ⚠ Strojenie kary bocznej wchodzi PARAMETREM — resolver nie czyta
      // `SHIELD` sam, patrz `DamageContext.blockSideMul`.
      blockSideMul: SHIELD.sideZoneMul,
      // ⚠ `T-1`: geometria WCHODZI PARAMETREM, tak samo jak kara boczna wyżej.
      //   `undefined` (brak tarczy) znaczy fallback na globalne 60°/100°.
      blockGeometry: Equipment.blockSpec?.geometry,
      // ⚠ `T-7`: udźwig tej KONKRETNEJ tarczy (masa × jakość × stan) i miękkie
      // kolano powyżej niego. Oba parametrem, z tego samego powodu co wyżej.
      blockCapacity: Equipment.blockCapacity,
      blockOverflowKeep: SHIELD.block.overflowKeep,
    });

    // ── `P1`: pomiar rozkładu kątów (dev-build) ────────────────────────────
    // ⚠ **PRZED gałęziami werdyktu, żeby złapać KAŻDY cios** — także uniknięty
    // i odbity. `wynik.zone` do tego NIE służy: `immune` i `dodge` wpisują tam
    // `"back"` na sztywno, więc liczenie po werdykcie zawyżałoby „tył" o całe
    // 5,2% uników. Kąt liczy się niezależnie, w `GuardStats`.
    // ⚠ Sonda niczego nie rozstrzyga i nie wolno jej niczego rozstrzygać —
    // `guardAngleDeg` jest czyste, więc to wywołanie jest bez skutków ubocznych.
    if (import.meta.env.DEV) {
      GuardStats.record(
        this.guardKat,
        from,
        wynik.outcome,
        this.scene.time.now < this.attackPoseUntil,
        this.movingInput,
      );
    }

    if (wynik.outcome === "dodge") {
      this.ogloszCios("dodge", 0, from, execution);
      return { outcome: "dodge", mitigated: 0, killed: false };
    }
    if (wynik.outcome === "parry") {
      this.ogloszCios("parry", 0, from, execution);
      return { outcome: "parry", mitigated: 0, killed: false };
    }

    // ── Pancerz, potem tarcza, JEDNO zaokrąglenie ──────────────────────────
    // ⚠ Obie redukcje liczone jako ułamki i zaokrąglane raz, na końcu. To jest
    // ta sama lekcja, którą projekt odrobił przy jakości wykonania
    // (`instanceDamage`/`instanceDefense` przestały zaokrąglać, bo na małych
    // liczbach sąsiednie poziomy jakości zlewały się w tę samą wartość). Ciosy
    // w tej grze mają 1–22 punktów; podwójne zaokrąglenie zjadłoby cały efekt
    // tarczy na małych ciosach. Kolejność jest numerycznie obojętna przy
    // mnożeniu ułamków — wybrana dla czytelności: krok zależny od TYPU zostaje
    // przy pancerzu, krok neutralny (blok) idzie po nim.
    //
    // ⚠ Blok NIE jest rollem — deterministyczny jak zawsze, `frontal` już
    // rozstrzygnięte wyżej (ten sam warunek, którego użyło Parry).
    const mitigated = wynik.mitigated;
    // ⚠⚠ **Czytamy WERDYKT, nie odtwarzamy redukcji** (2026-09-05). Do tej daty
    // stało tu `wynik.outcome === "block" ? Equipment.blockSpec.reduction : 0`
    // — drugie policzenie tej samej liczby. Przy jednej strefie wychodziło to
    // samo; od stref blok BOCZNY zdejmuje `reduction × SHIELD.sideZoneMul`,
    // więc odtworzenie byłoby po prostu nieprawdą. Wartość i tak służy tu
    // wyłącznie za predykat („czy tarcza zadziałała"), co jest drugim powodem,
    // dla którego nie ma jej po co odtwarzać.
    const zablokowano = wynik.outcome === "block";
    this.hp = Math.max(0, this.hp - mitigated);
    this.lastDamagedAt = this.scene.time.now; // restarts the regen lockout
    // Getting hit doesn't just pause the meal, it ruins it. Harsher than a
    // pause on purpose: it stops "eat, then dive in" from turning food into a
    // cheap in-combat heal, which is the potion's whole reason to exist.
    this.clearFoodHeal();
    // ⚠ Blok ogłasza się ZAMIAST zwykłego trafienia, nie obok niego. Dwa
    // dźwięki naraz zlałyby się w jeden i gracz usłyszałby wyłącznie to, że
    // oberwał — czyli dokładnie tę informację, której tarcza ma zaprzeczyć.
    // Ten sam powód stoi za osobnym tintem: `flashHit` jest jedynym błyskiem,
    // jaki ta gra rysuje na graczu, więc jego KOLOR jest całym słownikiem.
    // ── Wysiłek: blok i przyjęty cios ─────────────────────────────────────
    // ⚠ **Blok kosztuje za FAKTYCZNIE ZABLOKOWANY CIOS, nigdy za trzymanie
    // tarczy.** Bierny podatek za posiadanie sprzętu jest dokładnie tą
    // mechaniką, której ten system unika — koszt ma się pojawiać w momencie
    // zdarzenia bojowego. Stawka należy do konkretnej tarczy
    // (`BlockSpec.staminaCost`).
    //
    // ⚠ **Koszt przyjętego ciosu liczy się od `mitigated`, czyli od tego, co
    // gracz naprawdę dostał** — po pancerzu i po tarczy. Krzywa (nie próg)
    // sprawia, że draśnięcia nie kosztują nic, a ciężki cios kosztuje
    // proporcjonalnie; patrz `Stamina.hitCost`. Blok obniża obrażenia, więc
    // **obniża też koszt przyjęcia** — i to jest zamierzone: zasłonięcie się
    // jest tańsze niż inkasowanie.
    const now = this.scene.time.now;
    // ⚠ Stawka jest ta sama w OBU strefach bloku i to jest decyzja: koszt
    // należy do ciosu przyjętego na tarczę, nie do jakości ustawienia. Kara za
    // gorszą strefę i tak przychodzi sama — `Stamina.hitCost` liczy się od
    // `mitigated`, więc słabszy blok kosztuje więcej. Druga kara tutaj byłaby
    // policzeniem tego samego dwa razy.
    // ⚠⚠ **STOPIEŃ BLOKU (`T-7`, 2026-09-15) — jedno rozstrzygnięcie, trzech
    // konsumentów: wysiłek, zużycie i nauka.** Liczony RAZ, z `absorbed`
    // zwróconego przez resolver, i podawany dalej. Trzy osobne wyliczenia tego
    // samego stosunku rozjechałyby się przy pierwszej zmianie progów, a nic by
    // tego nie złapało — ta sama lekcja, co przy `ActionResolution`.
    const stopien: BlockGrade = zablokowano
      ? blockGradeFor(wynik.absorbed, Equipment.blockCapacity)
      : "none";
    if (stopien !== "none") {
      Stamina.spend(Equipment.blockStaminaCostFor(wynik.absorbed, stopien), "block", now);
    }
    // ⚠ **Zużycie tarczy stoi TUTAJ, obok kosztu wysiłku, i to jest treść —
    // nie sąsiedztwo (`T-5`, 2026-09-15).** Oba odpowiadają na to samo pytanie:
    // „co kosztowało zasłonięcie się". Oba płaci się za **faktycznie
    // zablokowany cios**, nigdy za noszenie tarczy (N-27), i oba mają tę samą
    // stawkę w obu strefach bloku.
    // ⚠ Tarcza zużywa się od ciosu PRZYJĘTEGO, broń od ciosu WYPROWADZONEGO —
    // dlatego to osobne wywołanie, a nie parametr `wearWeapon`.
    // ⚠ `T-7`: stawka zużycia zależy od STOPNIA — przebicie niszczy tarczę
    // szybciej niż odbicie draśnięcia. ⛔ To nadal `Quality.applyWear`, czyli
    // JEDEN model zużycia i jedna naprawa; zmienia się mnożnik szansy, nie
    // mechanizm (patrz `Equipment.wearShield`).
    if (stopien !== "none") {
      Equipment.wearShield(SHIELD.block.wearStrain[stopien]);
      // ⚠ **Nauka idzie z PRZYJĘTYCH PUNKTÓW, nie z liczby bloków** — inaczej
      // najtańszą drogą do mistrzostwa byłoby stanie przed królikiem.
      ShieldSkill.practice(wynik.absorbed, stopien);
    }
    Stamina.spend(Stamina.hitCost(mitigated), "hitTaken", now);

    // ⚠ Tier liczony TUTAJ, przed błyskiem — bo od 2026-08-23 steruje jego
    // czasem i skokiem skali, a nie tylko trzęsieniem kamery. Ta sama jedna
    // skala (`Stamina.impactTier`) dla wszystkich kanałów ciężaru; drugiej nie
    // ma i nie ma jej powstać.
    const tier = Stamina.impactTier(mitigated);
    // ⚠ **Trzęsienie zależy teraz od CIĘŻARU ciosu (Faza 5A), a nie leci przy
    // każdym trafieniu.** Wcześniej seria draśnięć od królika dawała ten sam
    // sygnał co szarża dzika, przez co kanał nic nie znaczył. Start celowo
    // konserwatywny: trzęsie wyłącznie `heavy` — czyli dokładnie te ciosy,
    // które i tak kasują `pendingSwing` niżej. Tier bierze się z
    // `Stamina.impactTier`, nie z osobnej skali.
    this.ogloszCios(zablokowano ? "block" : "hit", mitigated, from, execution);
    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });

    // ── Impact: czy ten cios kasuje WŁASNY zamach gracza ────────────────────
    // Reużywa krzywą `Stamina.hitCost` zamiast osobnego statu poise — patrz
    // `Stamina.impactTier`. Tylko "heavy" (sufit krzywej — ciosy telegrafowane)
    // przerywa; "light"/"medium" nie ruszają `pendingSwing` w ogóle.
    if (tier === "heavy") {
      GameEvents.emit(EVENT.playerHeavyHit);
    }

    if (this.hp <= 0) {
      this.die();
      return { outcome: zablokowano ? "block" : "hit", mitigated, killed: true };
    }
    return { outcome: zablokowano ? "block" : "hit", mitigated, killed: false };
  }

  private die(): void {
    this.dead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.setTint(COMBAT_FEEDBACK.hitTint);
    // Drop any in-flight flash/blink tween so it can't fight the death fall.
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.swing);
    this.sword.setVisible(false);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      angle: 90,
      duration: 400,
      ease: "Quad.easeIn",
    });
    GameEvents.emit(EVENT.playerDied);
  }

  /**
   * Resurrect the player at (x, y): full state reset (pose, tint, physics body,
   * HP) plus a short invulnerability window so the rabbit that killed you can't
   * immediately kill you again while you get your bearings.
   */
  revive(x: number, y: number): void {
    if (!this.dead) return;
    this.dead = false;

    // Undo everything die() (and any in-flight hit flash) did to the sprite.
    this.scene.tweens.killTweensOf(this);
    this.setPosition(x, y);
    this.setAlpha(1);
    this.setAngle(0);
    this.setScale(PLAYER.scale); // a killed hit-flash pop can leave scale off
    this.clearTint();
    this.setDepth(DEPTH.entities + y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);

    this.hp = Math.max(1, Math.round(this.maxHp * RESPAWN.hpRatio));
    this.attackReadyAt = 0;
    this.attackPoseUntil = 0;
    this.rootedUntil = 0;
    // Matters only if RESPAWN.hpRatio is ever lowered below 1: without this a
    // revive would inherit the pre-death timer and could regen instantly.
    this.lastDamagedAt = this.scene.time.now;
    this.clearFoodHeal(); // a meal doesn't survive dying
    this.clearDamageBuff();
    // ⚠ Pełna stamina po odrodzeniu, mimo że HP wraca tylko częściowe
    // (`RESPAWN.hpRatio`). To NIE jest niekonsekwencja: HP jest raną i ma
    // boleć po śmierci, stamina jest zmęczeniem, a śmierć nie jest sposobem
    // na zmęczenie — obudzić się „wciąż wyczerpanym" znaczyłoby wracać do gry
    // z karą do tempa ataku i bez możliwości uniku.
    Stamina.refill();
    Defense.reset(); // same reasoning: waking up "still due for bad luck" is a bad first frame
    this.clearSlow(); // nor does a web — you get up clean
    // Venom least of all: respawning at half HP with a tick still running could
    // kill the player again before they have taken a step.
    this.clearVenom();
    this.dashUntil = 0;
    this.movingInput = false;
    this.play(anim.idle(wierszArkusza(this.zwrotRad)), true);

    // Grace period + a flicker so the player can see they're briefly immune.
    this.invulnerableUntil = this.scene.time.now + RESPAWN.invulnerableMs;
    this.blinkTween?.remove();
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: RESPAWN.invulnerableBlinkMs,
      yoyo: true,
      repeat: Math.ceil(RESPAWN.invulnerableMs / (RESPAWN.invulnerableBlinkMs * 2)) - 1,
      onComplete: () => this.setAlpha(1),
    });

    GameEvents.emit(EVENT.playerHpChanged, { hp: this.hp, maxHp: this.maxHp });
    GameEvents.emit(EVENT.playerRespawned);
  }
}

/** Facing direction expressed as an angle in degrees (0=right, 90=down, ...). */
function dirToAngleDeg(dir: Direction): number {
  switch (dir) {
    case "right":
      return 0;
    case "down":
      return 90;
    case "left":
      return 180;
    case "up":
      return -90;
  }
}

/* ⚠ `dirToAngle` (ćwiartka → radiany) usunięte 2026-09-22 razem z ostatnim
 * czytelnikiem. Był nim `guardKat` na czas zamachu — odkąd cios ma własny
 * ciągły kąt (`attackRad`), nie ma już czego kwantować i z powrotem
 * odkwantowywać. ⛔ Nie przywracaj go „na wszelki wypadek": jego istnienie
 * kusiło, żeby osłona wracała do ćwiartki, a to jest dokładnie `OI-140`. */

/**
 * ⚠⚠ **GRANICA LEGACY 2D — jedyne miejsce, w którym gracz ma „cztery
 * kierunki".** Rząd arkusza `Character.png` (cztery fizyczne rzędy) dla kąta
 * w konwencji gracza (radiany, `atan2(x, y)`, 0 = w dół). Wygrywa dominująca
 * oś — ta sama reguła, którą do 2026-09-27 stosował `vectorToDirection` przy
 * zapisie stanu, więc arkusz rysuje dokładnie to co wcześniej.
 *
 * ⛔ **Wolno to wołać WYŁĄCZNIE z warstwy rysowania arkusza** (animacja,
 * miecz 2D). Mechanika pyta o `zwrotRad`/`attackRad`. Wynik tej funkcji
 * użyty w walce albo celowaniu odtworzy `OI-148`/`OI-149`: postać 3D patrzy
 * pod 30°, a gra liczy jak dla 0°. Arkusz żyje dziś jako ścieżka awaryjna
 * i obraz pierwszych klatek sceny, zanim wczyta się model.
 *
 * Bez histerezy i bez pamięci — kąt nigdy nie jest „zerowy", a dawny
 * `fallback` działał tylko dla wektora zerowego.
 */
function wierszArkusza(rad: number): Direction {
  const x = Math.sin(rad);
  const y = Math.cos(rad);
  if (Math.abs(x) >= Math.abs(y)) return x >= 0 ? "right" : "left";
  return y >= 0 ? "down" : "up";
}

/** Legacy 2D: jednostkowy wektor RZĘDU arkusza — wyłącznie dla miecza 2D. */
function dirToOffset(dir: Direction): Phaser.Math.Vector2 {
  switch (dir) {
    case "up":
      return new Phaser.Math.Vector2(0, -1);
    case "down":
      return new Phaser.Math.Vector2(0, 1);
    case "left":
      return new Phaser.Math.Vector2(-1, 0);
    case "right":
      return new Phaser.Math.Vector2(1, 0);
  }
}

/** Stan postaci przenoszony przez portal — patrz . */
export type PlayerCondition = ReturnType<Player["captureCondition"]>;

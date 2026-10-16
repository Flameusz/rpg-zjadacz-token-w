import Phaser from "phaser";
import { ASSETS, DEPTH, NPC_3D } from "../config/GameConfig";
import { WorldState } from "../core/WorldState";
import type { Stan3D } from "../render3d/Creature3D";
import { UI, worldTextStyle } from "../core/theme";
import { NPCS, type NpcDef, type NpcId } from "../core/Npcs";
import type { Interactable } from "../core/Interactables";
import { GameEvents, EVENT } from "../core/EventBus";
import { npcQuestMarker, npcTrainerBadge, npcTeachesAnything, type NpcGlyph } from "../core/NpcStatus";
import { npcMarkerSize, npcMarkerTexture } from "./NpcMarkerIcons";
import { ySortedWorldFor } from "../core/YSortedWorld";

/**
 * A stationary talkable NPC — the Hunter, the Blacksmith, and whoever comes
 * next. Renders a single static idle-down portrait, UNLESS the NpcDef names a
 * real idle-loop animation (currently only the Kowal — see
 * `BLACKSMITH.idleAnimKey` / `ASSETS.kowalIdle`), in which case it plays that
 * instead. Either way none of them walk, so there's no movement animation —
 * just idle. A solid (immovable) body so the player can't walk through them.
 *
 * The class keeps its old name because `MERCHANT`/`Merchant` is what the rest
 * of the codebase and the docs already call this role; what changed is that it
 * is now driven by an NpcDef instead of one hard-coded config.
 */
export class Merchant extends Phaser.Physics.Arcade.Sprite implements Interactable {
  readonly npc: NpcDef;

  /** See `core/Interactables.ts`. The key is the npc id, because that is what
   *  the conversation window needs in order to know whose shop, quests and
   *  topics to show — it is why the old `merchantNearby` event carried one. */
  readonly interactKind = "npc" as const;
  /**
   * NPC z modelem 3D (`NPC_3D`): napisy idą nad GŁOWĘ modelu, nie nad portret 2D.
   * Stopy modelu stoją na dole ciała (`Creature3D`: `body.bottom`), a `wysokoscPx`
   * to wysokość postaci w pikselach świata po stronie ekranu (wołający
   * uwzględnia ściśnięcie kamery widoku 3D).
   */
  napisyNadModelem(wysokoscPx: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const noweImie = body.bottom - wysokoscPx - 6;
    const dy = noweImie - this.etykiety[0].y;
    for (const e of this.etykiety) e.y += dy;
  }

  /** Dla `Creature3D` — NPC nie umiera. */
  readonly isDead = false;

  /**
   * ⭐ Stan modelu 3D (`NPC_3D`): stanie (`Idle`); gracz blisko → zwrot ku
   * niemu, dalej → przodem do kamery. Tylko PREZENTACJA — rozmowa, zasięg
   * i ciało zostają przy tym sprite'cie.
   */
  stan3d(): Stan3D {
    const dx = WorldState.playerX - this.x;
    const dy = WorldState.playerY - this.y;
    const blisko = dx * dx + dy * dy < NPC_3D.zwrotPx * NPC_3D.zwrotPx;
    return { klip: "Idle", kat: blisko ? Math.atan2(dx, dy) : 0 };
  }

  get interactKey(): string {
    return this.npc.id;
  }
  get interactRange(): number {
    return this.npc.interactRange;
  }
  /** Znacznik ZADANIOWY — `?` / dymek rozmowy / `!`, jeden na raz
   *  (`core/NpcStatus.ts`). ⭐ Od 2026-10-14 IKONA (`NpcMarkerIcons`), nie
   *  napis. Tekstura i widoczność odświeżane na żywo; obiekt powstaje raz. */
  private questMarker!: Phaser.GameObjects.Image;
  /** Znacznik USŁUGI trenera — `+`. Osobny obiekt, bo niesie osobną obietnicę
   *  i stoi w osobnym rzędzie; patrz `npcTrainerBadge`. */
  private trainerBadge?: Phaser.GameObjects.Image;
  /** Imię, odznaki usług i znacznik zadania — przesuwane razem (`napisyNadModelem`). */
  private readonly etykiety: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /**
   * Ostatnio ZASTOSOWANY wygląd obu znaczników — `null` znaczy „jeszcze nie
   * malowano", więc pierwsze wywołanie zawsze przechodzi.
   *
   * ⚠ Historia: do 2026-10-14 znaczniki były NAPISAMI, a `Text.setColor`
   * przerysowuje płótno i wysyła teksturę na GPU ZAWSZE (`src/ui/CLAUDE.md`,
   * „Koszt klatki"). `refreshMarker` leci z PIĘCIU zdarzeń, w tym
   * `inventoryChanged` i `xpChanged`, na kilkunastu mieszkańcach naraz. Ikona
   * kosztuje mniej (`setTexture`), ale reguła „maluj tylko zmianę" zostaje.
   *
   * ⚠ **Klucz opisuje WSZYSTKO, co ta metoda maluje — z widocznością włącznie.**
   * Reguła z `src/ui/CLAUDE.md`: klucz, który pomija choćby jedną malowaną
   * własność, zamraża stan końcowy (zmierzony przypadek `AbilityBar`, gdzie
   * przycisk zostawał z napisem „1" będąc już gotowym). Tu pominięcie
   * `widoczny` zostawiłoby `?` nad mieszkańcem, u którego nie ma już czego
   * oddać.
   */
  private paintedQuest: { klucz: string; widoczny: boolean } | null = null;
  private paintedTrainer: { klucz: string; widoczny: boolean } | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, npcId: NpcId = "hunter") {
    const npc = NPCS[npcId];
    // An idle anim wins if present and loaded; its texture key is read off
    // the anim itself (frame 0's textureKey) rather than a hardcoded asset
    // reference, so this class stays generic — no per-NPC art lives here.
    const hasIdleAnim = npc.idleAnimKey !== undefined && scene.anims.exists(npc.idleAnimKey);
    const idleTextureKey = hasIdleAnim ? scene.anims.get(npc.idleAnimKey!).frames[0].textureKey : undefined;
    // Otherwise an NPC with its own static art (e.g. the Kowal's
    // kowal_portrait.png) uses that texture directly; everyone else falls
    // back to the shared NPC.png portrait — same fallback if a bespoke
    // texture is declared but failed to load, so a missing file never blocks
    // the game from booting.
    const hasOwnArt = npc.portraitTexture !== undefined && scene.textures.exists(npc.portraitTexture);
    super(scene, x, y, idleTextureKey ?? (hasOwnArt ? npc.portraitTexture! : ASSETS.npc.portraitKey));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Rendering architecture ETAP 1B — NPCs are static, but still need to
    // compare depth against the moving player (walk-behind), so they share
    // the same sorted scope. See `core/YSortedWorld.ts`.
    const ySorted = ySortedWorldFor(scene);
    ySorted?.add(this);

    this.npc = npc;

    this.setScale(this.npc.scale);
    this.setDepth(DEPTH.entities + y);
    // Tint only applies to the shared placeholder portrait — real per-NPC art
    // (static or animated) must never get tinted on top of it.
    if (!idleTextureKey && !hasOwnArt && this.npc.tint !== null) this.setTint(this.npc.tint);
    if (hasIdleAnim) this.play(npc.idleAnimKey!);
    // Tap-to-talk. Same split as Enemy/Gatherable: this class knows only that
    // it is clickable; GameScene decides what that means and range-checks it.
    this.setInteractive({ useHandCursor: true });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.moves = false;
    body.setImmovable(true);
    body.setSize(this.width * 0.6, this.height * 0.35);
    body.setOffset(this.width * 0.2, this.height * 0.6);

    // Sprite origin is centre (0.5, 0.5), so the top edge is only half the
    // display height above `y` — a full displayHeight offset floated the
    // label way above the actual head.
    const nameY = y - this.displayHeight / 2 - 6;
    const nameplate = scene.add
      .text(
        x,
        nameY,
        this.npc.name,
        worldTextStyle({ fontSize: "11px", color: UI.goldLight, stroke: "#000000", strokeThickness: 3 }),
      )
      .setOrigin(0.5)
      .setDepth(DEPTH.entities + y + 1);
    ySorted?.add(nameplate);
    this.etykiety.push(nameplate);

    /**
     * Nad imieniem stoją DWA rzędy, i ten podział jest całą treścią zmiany
     * z 2026-08-23:
     *
     *     [ ? ◆ ! ]   ← rząd ZADAŃ    (co mam u tego człowieka do zrobienia)
     *     [ 👜 + ]     ← rząd USŁUG    (co ten człowiek oferuje)
     *        Imię
     *
     * ⚠ **Osobne rzędy, nie jeden wspólny — bo to osobne PYTANIA.** Wcześniej
     * `+` trenera dzielił jedno miejsce i jeden łańcuch priorytetów z `!`/`?`,
     * więc mieszkaniec z zadaniem do oddania i lekcją w ofercie pokazywał
     * wyłącznie `?`. Dwa rzędy znaczą też, że pojawienie się znacznika zadania
     * NIGDY nie przesuwa sakiewki w bok.
     */
    const serviceY = nameY - 14;
    const questY = serviceY - 16;
    const hasStock = this.npc.stock.length > 0;
    /**
     * ⚠ **Slot przyznaje `npcTeachesAnything` (stałe dla NPC), a nie
     * `npcTrainerBadge` (zależne od kieszeni gracza).** Gdyby układ rzędu
     * liczył się z widoczności, sakiewka przeskakiwałaby w bok dokładnie
     * w chwili, w której gracz uzbiera na lekcję. To ta sama zasada, co
     * „kąt należy do SLOTU, nie do kolejności" w `HUD_LAYOUT.rings`.
     */
    const teaches = npcTeachesAnything(this.npc.id);
    const bothServices = hasStock && teaches;
    if (hasStock) {
      const badge = scene.add
        .image(bothServices ? x - 8 : x, serviceY, ASSETS.merchantBadge.textureKey)
        .setDepth(DEPTH.entities + y + 1);
      ySorted?.add(badge);
      this.etykiety.push(badge);
    }
    if (teaches) {
      this.trainerBadge = scene.add
        .image(bothServices ? x + 8 : x, serviceY, npcMarkerTexture(scene, "trainer", UI.green))
        .setOrigin(0.5)
        .setDepth(DEPTH.entities + y + 1)
        .setVisible(false);
      ySorted?.add(this.trainerBadge);
      this.etykiety.push(this.trainerBadge);
    }

    // ⚠ Zakotwiczony DOŁEM nad rzędem usług — ikony różnej wysokości (`!`,
    //   dymek) rosną W GÓRĘ, nie wchodzą na sakiewkę i imię.
    this.questMarker = scene.add
      .image(x, questY + 8, npcMarkerTexture(scene, "available", UI.gold))
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.entities + y + 1)
      .setVisible(false);
    ySorted?.add(this.questMarker);
    this.etykiety.push(this.questMarker);
    this.refreshMarker();

    // `GameEvents` is a module-level singleton that outlives a scene
    // restart, so listeners MUST be torn down on shutdown or a portal
    // crossing leaves stale Merchants reacting to events for sprites that
    // no longer exist — same pattern as NpcDialog.
    const onStatusChanged = () => this.refreshMarker();
    GameEvents.on(EVENT.questsChanged, onStatusChanged);
    GameEvents.on(EVENT.skillsChanged, onStatusChanged);
    GameEvents.on(EVENT.inventoryChanged, onStatusChanged);
    /**
     * ⚠ **`trackedQuestChanged` — bez tego `◆` zostaje nad poprzednim NPC.**
     * Przestawienie śledzonego zadania w dzienniku nie rusza żadnego stanu
     * zadań, więc `questsChanged` wtedy NIE leci — a to właśnie ta zmiana ma
     * natychmiast przenieść znacznik z jednego mieszkańca na drugiego.
     */
    GameEvents.on(EVENT.trackedQuestChanged, onStatusChanged);
    /**
     * ⚠ **`xpChanged` — naprawa nieaktualnego `+`** (znaleziona w audycie).
     * `Skills.canAfford` czyta złoto ORAZ `Progression.skillPoints`, a punkty
     * ruszają się wyłącznie przez `Progression`: awans na poziom kończy
     * `addXp` wywołaniem `emitXp()`, a wydanie punktu woła `emitXp()` obok
     * `emitAttributes()`. Jedno zdarzenie pokrywa więc OBA kierunki — stąd
     * `xpChanged`, a nie `attributesChanged`. Do tej pory awans dokładał punkt,
     * ale `+` nad trenerem nie zapalał się aż do jakiegoś niezwiązanego
     * zdarzenia. Zasady `canAfford` nietknięte.
     */
    GameEvents.on(EVENT.xpChanged, onStatusChanged);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.questsChanged, onStatusChanged);
      GameEvents.off(EVENT.skillsChanged, onStatusChanged);
      GameEvents.off(EVENT.inventoryChanged, onStatusChanged);
      GameEvents.off(EVENT.trackedQuestChanged, onStatusChanged);
      GameEvents.off(EVENT.xpChanged, onStatusChanged);
    });
  }

  /**
   * Zastosuj wygląd znacznika **tylko wtedy, gdy naprawdę się zmienił** —
   * patrz `paintedQuest`. Zwraca nowy stan do zapamiętania.
   *
   * Wspólna dla obu rzędów, bo oba malują dokładnie te same trzy własności;
   * dwie kopie tego porównania rozjechałyby się przy pierwszej zmianie i
   * `tsc` by tego nie zobaczył.
   */
  private paintMark(
    mark: Phaser.GameObjects.Image,
    glif: NpcGlyph | null,
    poprzedni: { klucz: string; widoczny: boolean } | null,
  ): { klucz: string; widoczny: boolean } {
    // Niewidoczny znacznik zachowuje OSTATNI klucz — powrót tego samego glifu
    // (`?` → nic → `?`) nie może liczyć się jako zmiana tekstury.
    const nastepny = glif
      ? { klucz: npcMarkerTexture(this.scene, glif.kind, glif.color), widoczny: true }
      : { klucz: poprzedni?.klucz ?? "", widoczny: false };
    if (poprzedni && poprzedni.klucz === nastepny.klucz && poprzedni.widoczny === nastepny.widoczny) {
      return poprzedni;
    }
    if (glif) {
      const { w, h } = npcMarkerSize(glif.kind);
      mark.setTexture(nastepny.klucz).setDisplaySize(w, h).setVisible(true);
    } else {
      mark.setVisible(false);
    }
    return nastepny;
  }

  private refreshMarker(): void {
    this.paintedQuest = this.paintMark(
      this.questMarker,
      npcQuestMarker(this.npc.id),
      this.paintedQuest,
    );

    if (this.trainerBadge) {
      this.paintedTrainer = this.paintMark(
        this.trainerBadge,
        npcTrainerBadge(this.npc.id),
        this.paintedTrainer,
      );
    }
  }

  get npcId(): NpcId {
    return this.npc.id;
  }
}

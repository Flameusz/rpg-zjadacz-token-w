import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { HUD_LAYOUT, PLAYER, STAMINA } from "../config/GameConfig";
import { Progression } from "../core/Progression";
import { Stamina, type StaminaState } from "../core/Stamina";
import { InputState } from "../core/InputState";
import { UI, textStyle, uiW, uiH } from "../core/theme";

/** Kolor paska wysiłku per stan — patrz komentarz przy jego budowie. */
const STAM_COLOR: Record<StaminaState, number> = {
  normal: 0x44bb99,
  tired: 0xddaa33,
  exhausted: 0xcc4444,
};

/**
 * **Ramka postaci** — lewy górny róg (przebudowa 2026-10-12, wzór MOBA):
 *
 *   ( 44 )  [██████████ 100 / 100 ██]
 *    XP     [▬▬▬▬▬ wysiłek ▬▬▬▬]  BIEG · 34
 *
 * - **Odznaka poziomu** z PIERŚCIENIEM doświadczenia (Wild Rift: poziom
 *   w kółku, postęp jako pierścień wokół). Liczby XP zeszły z HUD-u — przy
 *   „1358 / 7664" pomarańczowym krojem 11 j. na trawie nikt ich nie czytał
 *   (≈7 dp na S21 FE). Tapnięcie odznaki otwiera zakładkę POSTAĆ, a kropka na
 *   niej mówi „masz punkty do wydania" (zastąpiła napis „Punkty rozwoju: 41
 *   (C)" — klawisz C nie istnieje na telefonie).
 * - **Złota na HUD-zie nie ma** (autor 2026-10-12: „po co gold na widoku
 *   poza sklepem lub ekwipunkiem"). Wpływ złota ogłasza świat (`+N zł` nad
 *   łupem), stan sakiewki — panel i kupiec.
 *
 * Listens to GameEvents so it never reaches into entity code directly.
 */
export class HUD {
  private barFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private centerText: Phaser.GameObjects.Text;
  private xpRing: Phaser.GameObjects.Graphics;
  private stamFill: Phaser.GameObjects.Rectangle;
  private stamText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private badge: Phaser.GameObjects.Container;
  private pointsDot: Phaser.GameObjects.Arc;

  private readonly cfg = HUD_LAYOUT.unitFrame;
  private readonly barWidth = HUD_LAYOUT.unitFrame.barW;
  private hideCenterTimer?: Phaser.Time.TimerEvent;
  /** Ułamek XP, który pierścień POKAZUJE w tej chwili (animowany). */
  private xpShown = 0;
  private xpTween?: Phaser.Tweens.Tween;
  /**
   * Ostatnia migawka wysiłku — przechowywana, bo napis obok paska zależy nie
   * tylko od niej, ale i od tego, czy gracz w tej chwili biegnie, a to drugie
   * zmienia się bez żadnego zdarzenia.
   */
  private lastStam = { stamina: 0, maxStamina: 1, state: "normal" as StaminaState };
  private wasRunning = false;

  constructor(private scene: Phaser.Scene) {
    const depth = 900;
    const { pad, badge: r, ring, hpH, stamH } = this.cfg;
    // Środek odznaki — pierścień XP leży NA ZEWNĄTRZ koła odznaki.
    const cx = pad + r + ring;
    const cy = pad + r + ring;
    const barX = cx + r + ring + 10;

    // ── Odznaka poziomu + pierścień XP ────────────────────────────────────
    this.badge = scene.add.container(cx, cy).setScrollFactor(0).setDepth(depth + 2);
    const disc = scene.add.circle(0, 0, r, UI.bg, 0.9).setStrokeStyle(2, UI.goldNum, 0.85);
    const track = scene.add.circle(0, 0, r + ring / 2 + 1, 0x000000, 0).setStrokeStyle(ring, 0x000000, 0.45);
    this.xpRing = scene.add.graphics();
    this.levelText = scene.add
      .text(0, 1, "1", textStyle({ fontSize: "22px", color: UI.white, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }))
      .setOrigin(0.5);
    // Kropka w PRAWYM DOLNYM skosie, za pierścieniem: u góry zasłaniała
    // początek łuku XP, czyli dokładnie miejsce, w które patrzy się po
    // awansie.
    this.pointsDot = scene.add
      .circle((r + ring + 3) * 0.72, (r + ring + 3) * 0.72, 7, 0x66ddff, 1)
      .setStrokeStyle(1.5, 0x000000, 0.85)
      .setVisible(false);
    // Pole dotykowe ≥ `minTouch`: koło odznaki z pierścieniem ma 64 j., więc
    // trafienie dostaje pełne 68 — technika „cel większy od rysunku".
    const hit = scene.add
      .circle(0, 0, Math.max(HUD_LAYOUT.minTouch, (r + ring) * 2) / 2, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation(); // drążek nie może przejąć tego dotknięcia
      GameEvents.emit(EVENT.playerPanelRequested, { tab: "character" });
    });
    this.badge.add([track, this.xpRing, disc, this.levelText, this.pointsDot, hit]);

    // ── Pasek życia ───────────────────────────────────────────────────────
    const hpY = cy - hpH + 2;
    scene.add
      .rectangle(barX, hpY, this.barWidth, hpH, 0x000000, 0.55)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setScrollFactor(0)
      .setDepth(depth);
    this.barFill = scene.add
      .rectangle(barX + 2, hpY + 2, this.barWidth - 4, hpH - 4, 0x33dd55, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.hpText = scene.add
      .text(
        barX + this.barWidth / 2,
        hpY + hpH / 2,
        `${PLAYER.hp} / ${PLAYER.hp}`,
        textStyle({ fontSize: "15px", color: UI.white, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2);

    // ── Pasek wysiłku, pod paskiem życia ──────────────────────────────────
    //
    // ⚠ Kolor zmienia się ze stanem (`STAMINA.states`), bo sama długość paska
    // nie mówi, gdzie leżą progi — a progi są BEZWZGLĘDNE, więc przy dużej
    // Kondycji „połowa paska" i „zmęczony" to zupełnie różne miejsca.
    const stamY = hpY + hpH + 5;
    scene.add
      .rectangle(barX, stamY, this.barWidth, stamH, 0x000000, 0.55)
      .setOrigin(0)
      .setStrokeStyle(1, 0xffffff, 0.45)
      .setScrollFactor(0)
      .setDepth(depth);
    this.stamFill = scene.add
      .rectangle(barX + 1, stamY + 1, this.barWidth - 2, stamH - 2, STAM_COLOR.normal, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.stamText = scene.add
      .text(
        barX + this.barWidth + 8,
        stamY + stamH / 2,
        "",
        textStyle({ fontSize: "13px", color: "#88ccbb", stroke: "#000000", strokeThickness: 3 }),
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth);

    this.centerText = scene.add
      .text(
        uiW(scene) / 2,
        uiH(scene) / 2,
        "",
        textStyle({ fontSize: "40px", color: "#ff5555", fontStyle: "bold" }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      // Above the death overlay veil (RespawnPrompt, depth 1200) so "YOU DIED"
      // stays crisp instead of being dimmed by it.
      .setDepth(1300)
      .setVisible(false);

    GameEvents.on(EVENT.playerHpChanged, this.onHp, this);
    GameEvents.on(EVENT.xpChanged, this.onXp, this);
    GameEvents.on(EVENT.leveledUp, this.onLevelUp, this);
    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.onRespawned, this);
    GameEvents.on(EVENT.staminaChanged, this.onStamina, this);

    // GameScene.create() runs before UIScene.create(), so the reset that starts
    // a run has already fired by now. Ask for a fresh snapshot rather than
    // rendering stale defaults until the first kill.
    Progression.emitXp();
    // Ten sam powód, co wyżej: bez tego pasek wysiłku stałby pusty do
    // pierwszego wydatku, bo `Stamina` ogłasza się tylko przy ZMIANIE.
    this.onStamina({ stamina: Stamina.current, maxStamina: Stamina.max, state: Stamina.state });

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    // Clean up listeners if the scene shuts down.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.playerHpChanged, this.onHp, this);
      GameEvents.off(EVENT.xpChanged, this.onXp, this);
      GameEvents.off(EVENT.leveledUp, this.onLevelUp, this);
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.onRespawned, this);
      GameEvents.off(EVENT.staminaChanged, this.onStamina, this);
      // ⚠ **`scene.scale` przeżywa scenę — to `ScaleManager` gry, nie wtyczka
      // sceny.** Brakowało tu do 2026-09-08, więc każdy cykl Menu → Nowa gra
      // zostawiał handler wołający `onResize()` na zniszczonym `centerText`.
      // `GameEvents` wyżej ma ten sam powód i tę samą kurację.
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.xpTween?.stop();
    });
  }

  /**
   * Narysuj pierścień XP dla ułamka `f`. Woła się to WYŁĄCZNIE z animacji
   * przyrostu (≈220 ms po zdobyciu doświadczenia) — nigdy z `update()`;
   * `Graphics.arc` tesseluje łuk od nowa przy każdym wywołaniu
   * (`src/ui/CLAUDE.md`, „Koszt klatki").
   */
  private paintXpRing(f: number): void {
    const { badge: r, ring } = this.cfg;
    const g = this.xpRing;
    g.clear();
    if (f <= 0.001) return;
    const start = -Math.PI / 2;
    g.lineStyle(ring, 0xffcc33, 1);
    g.beginPath();
    g.arc(0, 0, r + ring / 2 + 1, start, start + Math.PI * 2 * Math.min(1, f), false);
    g.strokePath();
  }

  private onStamina(p: { stamina: number; maxStamina: number; state: StaminaState }): void {
    this.lastStam = p;
    this.paintStamina();
  }

  /**
   * ⚠ **Znacznik „BIEG" siedzi TU, przy pasku wysiłku, a nie tylko na gałce.**
   * Pierścień biegu na drążku jest pod kciukiem, a reguła tego katalogu mówi,
   * że palec zasłania to, czego dotyka. Stan, za który płaci się staminą, musi
   * być widoczny obok paska, który się od tego opróżnia — bez tego wraca
   * dokładnie to zgłoszenie, od którego cała zmiana się zaczęła: „zużywamy
   * wytrzymałość i nie wiemy dlaczego".
   */
  /**
   * Ostatnio ZASTOSOWANY kolor napisu wysiłku (złoty = bieg).
   *
   * ⚠ **`Text.setColor` przerysowuje płótno napisu i wysyła teksturę na GPU
   * ZAWSZE**, także gdy kolor jest ten sam — w przeciwieństwie do `setText`,
   * które Phaser odsiewa po równości ciągu. Wołane bezwarunkowo przy każdym
   * zdarzeniu staminy dokładało ten koszt kilkanaście razy na sekundę przez
   * całą regenerację. Ten katalog zna ten mechanizm z drugiej strony:
   * `installTextFiltering()` istnieje dlatego, że każde przerysowanie napisu
   * przywraca filtrowanie NEAREST.
   */
  private paintedGold: boolean | null = null;

  private paintStamina(): void {
    const p = this.lastStam;
    const frac = p.maxStamina > 0 ? Math.max(0, Math.min(1, p.stamina / p.maxStamina)) : 0;
    this.stamFill.width = (this.barWidth - 2) * frac;
    this.stamFill.fillColor = STAM_COLOR[p.state];

    // ⚠ Liczba tylko wtedy, gdy pasek NIE jest pełny, plus nazwa stanu.
    // Pełny pasek wysiłku nie niesie żadnej informacji, a stały napis obok
    // niego uczy gracza go nie czytać. Bieg jest wyjątkiem: wtedy napis stoi
    // ZAWSZE, bo mówi o czymś, co gracz właśnie robi, a nie o zapasie.
    const label = STAMINA.states[p.state].label;
    const liczba = frac >= 0.999 ? "" : `${Math.round(p.stamina)}${label ? ` — ${label}` : ""}`;
    // Kolor tylko przy ZMIANIE — patrz `paintedGold`.
    const zloty = this.wasRunning;
    if (this.paintedGold !== zloty) {
      this.paintedGold = zloty;
      this.stamText.setColor(zloty ? UI.gold : "#88ccbb");
    }
    // `setText` Phaser sam odsiewa po równości napisu; `setColor` NIE, i to jest
    // cała różnica. Regeneracja rusza liczbę kilkanaście razy na sekundę, więc
    // przerysowanie płótna zostaje, ale przestaje dochodzić drugie — za sam kolor.
    this.stamText.setText(this.wasRunning ? (liczba ? `BIEG · ${liczba}` : "BIEG") : liczba);
  }

  /**
   * Odczyt stanu biegu, prosto z `InputState` — tak samo jak pasek buffów
   * czyta migawkę `Buffs`. Bieg nie ogłasza się zdarzeniem i nie powinien:
   * zmienia się przy każdym drgnięciu kciuka na granicy stref, a to byłyby
   * dziesiątki zdarzeń na sekundę po to, żeby przestawić jeden napis.
   */
  update(): void {
    if (InputState.sprintHeld === this.wasRunning) return;
    this.wasRunning = InputState.sprintHeld;
    this.paintStamina();
  }

  private onHp(p: { hp: number; maxHp: number }): void {
    const ratio = Phaser.Math.Clamp(p.hp / p.maxHp, 0, 1);
    this.barFill.width = (this.barWidth - 4) * ratio;
    // Green → yellow → red as HP drops.
    const color = ratio > 0.5 ? 0x33dd55 : ratio > 0.25 ? 0xddcc33 : 0xdd3333;
    this.barFill.setFillStyle(color, 1);
    this.hpText.setText(`${Math.ceil(p.hp)} / ${p.maxHp}`);
  }

  private onXp(p: {
    level: number;
    xp: number;
    xpToNext: number;
    skillPoints: number;
  }): void {
    const maxed = !Number.isFinite(p.xpToNext);
    const target = maxed ? 1 : Phaser.Math.Clamp(p.xp / p.xpToNext, 0, 1);
    // Przyrost czyta się jako RUCH, nie skok — ale przy awansie pierścień
    // zaczyna od zera, zamiast cofać się przez cały obwód.
    if (target < this.xpShown) this.xpShown = 0;
    this.xpTween?.stop();
    const from = { f: this.xpShown };
    this.xpTween = this.scene.tweens.add({
      targets: from,
      f: target,
      duration: 220,
      ease: "Quad.easeOut",
      onUpdate: () => {
        this.xpShown = from.f;
        this.paintXpRing(from.f);
      },
    });
    this.levelText.setText(`${p.level}`);
    // Trzy cyfry nie mieszczą się w kole krojem 22 — schodzi rozmiar, nie
    // średnica odznaki.
    this.levelText.setFontSize(p.level >= 100 ? "16px" : "22px");
    this.pointsDot.setVisible(p.skillPoints > 0);
  }

  private onLevelUp(p: { level: number }): void {
    this.showCenter(`LEVEL ${p.level}`, "#ffcc33", 1200);
    this.scene.tweens.add({
      targets: this.badge,
      scale: 1.25,
      duration: 180,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private onDied(): void {
    this.showCenter("YOU DIED", "#ff5555");
  }

  private onRespawned(): void {
    this.scene.tweens.killTweensOf(this.centerText);
    this.hideCenterTimer?.remove();
    this.centerText.setVisible(false);
  }

  /**
   * Show the big centre banner. `autoHideMs` is for beats that pass (a level, a
   * cleared field); state that persists ("YOU DIED") omits it and is cleared by
   * whatever ends that state.
   */
  private showCenter(msg: string, color: string, autoHideMs?: number): void {
    this.centerText.setText(msg).setColor(color).setVisible(true).setScale(0.6);
    this.scene.tweens.add({
      targets: this.centerText,
      scale: 1,
      duration: 350,
      ease: "Back.easeOut",
    });
    this.hideCenterTimer?.remove();
    if (autoHideMs !== undefined) {
      this.hideCenterTimer = this.scene.time.delayedCall(autoHideMs, () => {
        // Only retract our own message — a death in the meantime outranks it.
        if (this.centerText.text === msg) this.centerText.setVisible(false);
      });
    }
  }

  private onResize(): void {
    this.centerText.setPosition(uiW(this.scene) / 2, uiH(this.scene) / 2);
  }
}

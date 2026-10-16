import Phaser from "phaser";
import { AUDIO } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Settings } from "./Settings";

export type SfxKey = keyof typeof AUDIO.volume;

/**
 * Sound effects. Module-level singleton like the other core systems, because
 * the sound manager is game-wide and has to survive GameScene restarting.
 *
 * Two rules it exists to enforce:
 *
 *  • **A missing file is never fatal.** Same "always boots" guarantee as the
 *    textures: delete `public/assets/audio/` and the game runs silently instead
 *    of throwing on the first swing.
 *  • **The same sample cannot stack on itself.** See AUDIO.minRetriggerMs —
 *    an AoE resolving against five enemies in one frame would otherwise fire
 *    five identical hits at the same instant and clip.
 *
 * Wiring is split on purpose. Events that already exist are hooked here in one
 * place; the rest are direct `Sfx.play()` calls at the exact moment the thing
 * happens, because "the attack swung" and "the blow landed" have no events and
 * inventing them just to carry a sound would be worse.
 */
/**
 * Odchylenia od surowego pliku — **dla przypadków, w których ten sam dźwięk
 * znaczy dwie różne rzeczy.**
 *
 * ⚠ Powstało dla świstu pudła. Osobny plik byłby czystszy, ale dokładanie
 * wpisu do `SOUNDS` przesuwa wspólny strumień `rng` generatora audio i po
 * cichu zmienia KAŻDY plik poniżej — koszt nieproporcjonalny do zysku, dopóki
 * rozstrojenie wystarcza. To jest świadomy dług, kandydat na 5B.
 */
export interface PlayOptions {
  /** Rozstrojenie w centach (100 = półton). Ujemne = niżej, czyli „ciężej". */
  detune?: number;
  /** Mnożnik głośności na wierzchu tabeli `AUDIO.volume`. */
  volumeMul?: number;
  /**
   * Własny kubełek przepustnicy. Bez tego dwa ZNACZENIA dzielące jeden plik
   * dzielą też okno 40 ms i wzajemnie się zjadają.
   */
  throttleKey?: string;
}

class SfxManager {
  private sound?: Phaser.Sound.BaseSoundManager;
  private lastPlayedAt = new Map<string, number>();
  /** Keys whose file didn't load. Warned about once, then silently skipped. */
  private missing = new Set<string>();
  private warned = false;
  /** The looping ambience, while it's running. */
  private ambient?: Phaser.Sound.BaseSound;
  /** Which bed `ambient` is, so a map change can tell "already playing the
   *  right one" from "playing the WRONG one and must be swapped". */
  private ambientKey?: SfxKey;
  /** Which bed we want once the browser allows audio — see startAmbient. */
  private pendingAmbient?: SfxKey;
  /** Whether an UNLOCKED listener is already armed. */
  private unlockHooked = false;
  /** Pętla tła, której chce BIEŻĄCA mapa — także gdy gracz ją wyłączył
   *  w ustawieniach. Kasuje ją dopiero `stopAmbient` (rozbiórka sceny). */
  private mapAmbient?: SfxKey;

  /** Every sound key, derived from the volume table so the two can't drift. */
  keys(): SfxKey[] {
    return Object.keys(AUDIO.volume) as SfxKey[];
  }

  /** Queue the files. Called from BootScene.preload. */
  queue(load: Phaser.Loader.LoaderPlugin): void {
    for (const key of this.keys()) load.audio(`sfx-${key}`, `assets/audio/${key}.wav`);
  }

  /**
   * Bind to the game's sound manager and hook the events that already exist.
   * Called once from BootScene.create — deliberately not from GameScene, which
   * restarts and would subscribe again on every respawn-to-title round trip.
   */
  init(scene: Phaser.Scene): void {
    this.sound = scene.sound;

    for (const key of this.keys()) {
      if (!scene.cache.audio.exists(`sfx-${key}`)) this.missing.add(key);
    }
    if (this.missing.size > 0) {
      console.warn(
        "[audio] Brak plików, te dźwięki będą pominięte:",
        [...this.missing].join(", "),
        "\nWygeneruj je: python tools/gen_audio.py",
      );
    }

    // Ustawienia gracza (`OI-56`). Wyciszenie idzie przez MENEDŻERA, nie przez
    // `play()`: `sound.mute` gasi też pętlę tła i dźwięki już grające, a po
    // włączeniu nic nie trzeba odtwarzać od nowa.
    this.applySettings();
    GameEvents.on(EVENT.settingsChanged, this.applySettings, this);

    GameEvents.on(EVENT.leveledUp, () => this.play("level-up"));
    GameEvents.on(EVENT.playerDied, () => this.play("player-die"));
    GameEvents.on(EVENT.enemyKilled, () => this.play("enemy-die"));
    GameEvents.on(EVENT.healRequested, () => this.play("drink"));
    GameEvents.on(EVENT.healOverTimeRequested, () => this.play("drink"));
  }

  /**
   * Start (or restart) the looping background bed.
   *
   * Separate from `play()` on purpose: this needs a handle to stop later, must
   * not go through the retrigger throttle, and must survive being blocked by
   * the browser. Browsers refuse audio until the first real user gesture, so a
   * bed started in `GameScene.create` would simply never be heard — hence the
   * one-shot UNLOCKED hook, which is the difference between "there is ambience"
   * and "there is ambience only if you happened to tap something first".
   *
   * Safe to call repeatedly; the SAME bed already playing is left alone rather
   * than restarted, so re-entering the scene doesn't stack two copies.
   *
   * `key` is per-map (`MAPS.*.ambientKey`) rather than one global constant —
   * see the note there. Asking for a DIFFERENT bed than the one playing swaps
   * it: today a map change always tears the scene down first (shutdown →
   * `stopAmbient`), so this never fires, but "start the village bed" quietly
   * leaving the forest running would be an unpleasant way to find that out.
   */
  startAmbient(key: SfxKey): void {
    // Zapamiętane ZANIM cokolwiek odmówi — wyłączone tło włączone w ustawieniach
    // musi wiedzieć, którą pętlę ta mapa chciała (`applySettings`).
    this.mapAmbient = key;
    if (!AUDIO.ambientEnabled || !Settings.ambient) return;
    if (!this.sound || this.missing.has(key)) return;
    if (this.ambient?.isPlaying) {
      if (this.ambientKey === key) return;
      this.stopAmbient();
    }

    // Which bed we WANT is a field, not a closure variable, and that matters
    // once there is more than one of them. The unlock hook can outlive the
    // call that registered it (audio stays locked until the first real user
    // gesture, and a player can reach the gate before ever tapping), so a
    // captured `key` would let the map you have already left decide what
    // starts playing when the browser finally allows sound.
    this.pendingAmbient = key;

    if (this.sound.locked) {
      // One hook, not one per call — `once` fires them all, and the extra
      // copies would each be a second attempt to start a bed that is by then
      // already running.
      if (!this.unlockHooked) {
        this.unlockHooked = true;
        this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.unlockHooked = false;
          this.beginAmbient();
        });
      }
      return;
    }
    this.beginAmbient();
  }

  private beginAmbient(): void {
    const key = this.pendingAmbient;
    if (!this.sound || !key || this.ambient?.isPlaying) return;
    this.ambient = this.sound.add(`sfx-${key}`, {
      loop: true,
      volume: AUDIO.volume[key] * AUDIO.masterVolume,
    });
    this.ambientKey = key;
    this.ambient.play();
  }

  /** Stop the bed and release it (GameScene shutdown). Also drops any bed that
   *  was merely *waiting* for the audio unlock, or leaving a map would still
   *  arm its ambience for whenever the browser lets sound through. */
  stopAmbient(): void {
    this.mapAmbient = undefined;
    this.silenceAmbient();
  }

  /**
   * Zastosuj `Settings`: wyciszenie całości i tło włącz/wyłącz NA ŻYWO.
   * ⚠ Wyłączenie tła nie zapomina, którą pętlę ma mapa — inaczej włączenie
   * go z powrotem dałoby ciszę aż do następnego przejścia bramą.
   */
  private applySettings(): void {
    if (this.sound) this.sound.mute = !Settings.sound;
    if (!Settings.ambient) this.silenceAmbient();
    else if (this.mapAmbient && !this.ambient?.isPlaying) this.startAmbient(this.mapAmbient);
  }

  /** Zatrzymaj pętlę tła, ale NIE zapominaj, którą mapa chce (`mapAmbient`). */
  private silenceAmbient(): void {
    this.ambient?.stop();
    this.ambient?.destroy();
    this.ambient = undefined;
    this.ambientKey = undefined;
    this.pendingAmbient = undefined;
  }

  play(key: SfxKey, opts: PlayOptions = {}): void {
    if (!this.sound || this.missing.has(key)) return;

    // Phaser's own clock isn't handy here (no scene), and Date.now is plenty
    // precise for a 40ms gate.
    const now = Date.now();
    // ⚠ **Przepustnica jest per KUBEŁEK, nie per plik** (2026-08-23). Świst
    // pudła przeciwnika używa tego samego pliku `swing`, co zamach gracza —
    // przy wspólnym kubełku cios wroga chybiony w ciągu 40 ms od własnego
    // zamachu przepadał BEZ ŚLADU, czyli dokładnie w najgęstszym momencie
    // walki, dla którego ten sygnał w ogóle powstał.
    const bucket = opts.throttleKey ?? key;
    const last = this.lastPlayedAt.get(bucket) ?? 0;
    if (now - last < AUDIO.minRetriggerMs) return;
    this.lastPlayedAt.set(bucket, now);

    try {
      this.sound.play(`sfx-${key}`, {
        volume: AUDIO.volume[key] * AUDIO.masterVolume * (opts.volumeMul ?? 1),
        // Rozstrojenie w centach. Zero = plik bez zmian, więc każde istniejące
        // wywołanie brzmi jak dotąd.
        detune: opts.detune ?? 0,
      });
    } catch {
      // Browsers refuse audio until the first real user gesture. Nothing to fix
      // here — the next press works — but a throw would take the frame with it.
      if (!this.warned) {
        console.warn("[audio] Odtwarzanie zablokowane do pierwszej interakcji użytkownika.");
        this.warned = true;
      }
    }
  }
}

export const Sfx = new SfxManager();

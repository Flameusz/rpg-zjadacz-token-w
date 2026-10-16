import { GameEvents, EVENT } from "./EventBus";

/**
 * **Ustawienia gracza** (`OI-56`, 2026-10-09) — dźwięk i (od 2026-10-14)
 * sposób celowania umiejętnościami.
 *
 * ⚠⚠ **Należą do URZĄDZENIA, nie do POSTACI.** Dlatego mają własny klucz
 * w `localStorage` i NIE wchodzą do slotów `Save`: wyciszony telefon ma zostać
 * wyciszony po „Nowej grze”, po wczytaniu innego slotu i po powrocie do menu.
 * Z tego samego powodu `TitleScene.startFresh` ich nie resetuje.
 *
 * ⚠ Odczyt i zapis są w `try/catch` — tryb prywatny albo zablokowana pamięć
 * kończą się wartościami domyślnymi, nigdy błędem. Gra ZAWSZE się uruchamia.
 *
 * Konsumentem jest `Sfx` (słucha `settingsChanged`); interfejs tylko woła
 * settery. ⛔ Nie czytaj stąd w pętli klatkowej — odczyt jest tani, ale
 * zmiana i tak przychodzi zdarzeniem.
 */
export interface SettingsState {
  /** Cały dźwięk gry: efekty i tło. */
  sound: boolean;
  /** Odgłosy tła mapy (las, wieś) — niezależnie od efektów. */
  ambient: boolean;
  /**
   * ⭐ **Sposób celowania umiejętności z podglądem** (autor 2026-10-14,
   * D12 z `docs/ui_mobile_research.md`; wzór: ustawienia LoL / Wild Rift):
   * - `"drag"` — przytrzymaj przycisk, przeciągnij, puść (domyślne, od zawsze);
   * - `"tap"` — dotknij przycisku, potem dotknij celu albo miejsca w świecie.
   * ⚠ Dotyczy WYŁĄCZNIE umiejętności z podglądem (`isAimable`) — unik
   * i umiejętności natychmiastowe odpalają się na naciśnięciu w obu trybach
   * (`OI-93`: przycisk paniki nie czeka na drugi gest).
   */
  aimMode: AimMode;
}

export type AimMode = "drag" | "tap";

/** Napis przełącznika i jedno zdanie, jak działa wybrany tryb — wspólne dla
 *  menu głównego i Opcji w grze (dwie kopie napisu rozjechałyby się). */
export const AIM_MODE_TEXT: Record<AimMode, { label: string; hint: string }> = {
  drag: { label: "Celowanie: przeciągnij", hint: "Przytrzymaj umiejętność, przeciągnij w stronę celu, puść." },
  tap: { label: "Celowanie: dotknij celu", hint: "Dotknij umiejętności, potem wroga albo miejsca. Ten sam przycisk anuluje." },
};

const KEY = "rpg-settings";
const DEFAULTS: SettingsState = { sound: true, ambient: true, aimMode: "drag" };

class SettingsStore {
  private state: SettingsState = { ...DEFAULTS };

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        // Pole po polu, z typem — nieznane albo uszkodzone wartości wracają do
        // domyślnych zamiast wpuścić `"false"` jako prawdę.
        if (typeof parsed.sound === "boolean") this.state.sound = parsed.sound;
        if (typeof parsed.ambient === "boolean") this.state.ambient = parsed.ambient;
        if (parsed.aimMode === "drag" || parsed.aimMode === "tap") this.state.aimMode = parsed.aimMode;
      }
    } catch {
      // Brak dostępu do pamięci — zostają domyślne.
    }
  }

  get sound(): boolean {
    return this.state.sound;
  }

  get ambient(): boolean {
    return this.state.ambient;
  }

  get aimMode(): AimMode {
    return this.state.aimMode;
  }

  setAimMode(mode: AimMode): void {
    this.set({ aimMode: mode });
  }

  setSound(on: boolean): void {
    this.set({ sound: on });
  }

  setAmbient(on: boolean): void {
    this.set({ ambient: on });
  }

  private set(patch: Partial<SettingsState>): void {
    this.state = { ...this.state, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Nie zapisze się na później, ale działa do końca sesji.
    }
    GameEvents.emit(EVENT.settingsChanged);
  }
}

export const Settings = new SettingsStore();

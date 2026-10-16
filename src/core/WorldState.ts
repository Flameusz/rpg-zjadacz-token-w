/**
 * The current map's identity/size and the player's live world position —
 * same pattern as `Vitals`: UI (the "Mapa" tab) can open long after the last
 * change, so a snapshot to read from beats an event only listeners catch.
 *
 * GameScene is the single writer: `mapId`/`widthPx`/`heightPx` once per
 * `create()` (fixed for the scene's lifetime), `playerX`/`playerY` every
 * frame in `update()` — cheap, same cost class as `Vitals.hp`.
 */
export const WorldState = {
  mapId: "forest",
  widthPx: 0,
  heightPx: 0,
  playerX: 0,
  playerY: 0,
  /** Snapshot of every NPC's world position on the current map, written once
   *  per `create()` alongside widthPx/heightPx — NPCs are stationary, so
   *  unlike playerX/playerY this never needs a per-frame update. Read by the
   *  "Mapa" tab to place a dot per NPC (not the overhead "!"/"?"/sack
   *  markers — those stay in-world only, see `Merchant.ts`). */
  npcs: [] as { id: string; name: string; x: number; y: number }[],
  /**
   * ⭐ Obszar świata, w którym stoi gracz (otwarty świat, 2026-10-09) —
   * prostokąt w px świata. Na mapie pojedynczej `null`. Minimapa, dźwięk
   * tła i podpis mapy idą za obszarem; zapis — za `mapId` i pozycją w świecie.
   */
  region: null as null | { id: string; x: number; y: number; w: number; h: number },
  /**
   * WSZYSTKIE obszary świata (wieś, las) w px świata — dla minimapy HUD-u,
   * która skleja ich obrazy w jeden, żeby na szwie nic nie przeskakiwało.
   * Pisane raz na `create()`; na mapie pojedynczej puste.
   */
  regions: [] as { id: string; x: number; y: number; w: number; h: number }[],
  /** Zwrot postaci w konwencji ekranu (radiany, 0 = w prawo, π/2 = w dół),
   *  pisany co klatkę razem z pozycją — strzałka gracza na minimapie. */
  playerHeading: Math.PI / 2,
  /** Ostatnio ogłoszony krok samouczka walki (`EVENT.tutorialStep`) —
   *  migawka dla widżetów, które powstają PO ogłoszeniu (restart `UIScene`). */
  tutorial: { step: null as string | null, text: "" },
};

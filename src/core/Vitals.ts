/**
 * The player's current HP, readable by UI that opens *after* the last
 * `playerHpChanged` event fired.
 *
 * Events alone aren't enough: GameScene.create() runs before UIScene.create(),
 * and the character panel can be opened at any time — long after the last
 * change. Listeners still drive live updates; this is only the snapshot to
 * paint from on first render.
 *
 * Player is the single writer (via its `hp` setter). Nothing else assigns here.
 */
export const Vitals = {
  hp: 0,
  maxHp: 0,
};

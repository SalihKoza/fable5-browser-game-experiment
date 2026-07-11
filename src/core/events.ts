/**
 * The complete catalogue of game events (ARCHITECTURE.md §4).
 * Systems communicate ONLY through these — never by calling each other.
 * Every event and its payload is declared here, so a reader can see the
 * game's entire "nervous system" in one file.
 *
 * The catalogue grows with the roadmap; Phase 0 declares the initial shape.
 */

export const GameEvent = {
  PlayerDamaged: 'player-damaged',
  EnemyDied: 'enemy-died',
  ItemPickedUp: 'item-picked-up',
  UiUseItem: 'ui-use-item',
} as const;
export type GameEvent = (typeof GameEvent)[keyof typeof GameEvent];

/** Payload contract per event — the typed emitter wrapper enforces these. */
export interface GameEventPayloads {
  [GameEvent.PlayerDamaged]: { amount: number; sourceId: string };
  [GameEvent.EnemyDied]: { entityId: string; enemyType: string };
  [GameEvent.ItemPickedUp]: { itemId: string; quantity: number };
  [GameEvent.UiUseItem]: { itemId: string };
}

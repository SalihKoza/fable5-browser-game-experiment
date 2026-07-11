/**
 * The complete catalogue of game events (ARCHITECTURE.md §4).
 * Systems communicate ONLY through these — never by calling each other.
 * Every event and its payload is declared here, so a reader can see the
 * game's entire "nervous system" in one file.
 */
import type { EventBus } from './EventBus';

export const GameEvent = {
  /** Damage REQUEST: emitted by CombatSystem (player swings) and enemy
   *  brains (strikes). Only HealthSystem consumes it — one health writer. */
  EntityDamaged: 'entity-damaged',
  /** Damage actually landed on the player (post i-frame check). */
  PlayerDamaged: 'player-damaged',
  EnemyDied: 'enemy-died',
  PlayerDied: 'player-died',
  ItemPickedUp: 'item-picked-up',
  UiUseItem: 'ui-use-item',
} as const;
export type GameEvent = (typeof GameEvent)[keyof typeof GameEvent];

/** Payload contract per event — EventBus enforces these at compile time. */
export interface GameEventPayloads extends Record<string, unknown> {
  [GameEvent.EntityDamaged]: {
    targetId: string;
    amount: number;
    /** Damage origin — knockback pushes away from here. */
    sourceX: number;
    sourceY: number;
    knockbackForce: number;
  };
  [GameEvent.PlayerDamaged]: { amount: number; sourceId: string };
  [GameEvent.EnemyDied]: { entityId: string; enemyType: string };
  [GameEvent.PlayerDied]: { playTimeMs: number };
  [GameEvent.ItemPickedUp]: { itemId: string; quantity: number };
  [GameEvent.UiUseItem]: { itemId: string };
}

/** The one bus type every system speaks. */
export type GameBus = EventBus<GameEventPayloads>;

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
  /** Player swung (hit or miss) — audio/FX hook. */
  PlayerAttacked: 'player-attacked',
  EnemyDied: 'enemy-died',
  PlayerDied: 'player-died',
  ChestOpened: 'chest-opened',
  ItemPickedUp: 'item-picked-up',
  /** Inventory contents changed (pickup/use) — UI re-renders on this. */
  InventoryChanged: 'inventory-changed',
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
  [GameEvent.PlayerAttacked]: Record<string, never>;
  /** x/y = death position, captured before the sprite fades — loot spawns there. */
  [GameEvent.EnemyDied]: { entityId: string; enemyType: string; x: number; y: number };
  [GameEvent.PlayerDied]: { playTimeMs: number };
  [GameEvent.ChestOpened]: { chestId: string; x: number; y: number };
  [GameEvent.ItemPickedUp]: { itemId: string; quantity: number };
  [GameEvent.InventoryChanged]: Record<string, never>;
  [GameEvent.UiUseItem]: { itemId: string };
}

/** The one bus type every system speaks. */
export type GameBus = EventBus<GameEventPayloads>;

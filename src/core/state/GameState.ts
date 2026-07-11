/**
 * GameState — the single serializable source of truth for a run.
 *
 * Rules (ARCHITECTURE.md §6):
 *  - 100% JSON-serializable: this object IS the save file. No Phaser objects,
 *    no functions, no DOM refs — runtime data lives outside, linked by id.
 *  - Owned by PlayScene, passed to systems as a parameter. No globals.
 *  - This module is framework-free (`core/`): importing Phaser here is a lint error.
 */

export interface Vec2Like {
  x: number;
  y: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  position: Vec2Like;
  inventory: InventorySlot[];
}

export interface GameState {
  /** Save-file schema version — bump + write a migration when the shape changes (§8). */
  schemaVersion: 1;
  /** Seed for the run's RNG so loot rolls are reproducible after load. */
  rngSeed: number;
  player: PlayerState;
  /** World facts that must survive save/load: opened chests, permanent kills, etc. */
  worldFlags: Record<string, boolean>;
  playTimeMs: number;
}

export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Starting values for a fresh run — tuning lives here, in one place. */
export function createNewGameState(rngSeed: number): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    rngSeed,
    player: {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      position: { x: 0, y: 0 },
      inventory: [],
    },
    worldFlags: {},
    playTimeMs: 0,
  };
}

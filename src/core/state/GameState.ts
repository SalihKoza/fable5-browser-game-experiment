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

export interface RunStats {
  kills: number;
}

export interface GameState {
  /** Save-file schema version — bump + write a migration (core/save/migrations)
   *  whenever this SHAPE changes after v1.0. `stats` was added before the
   *  first save ever shipped, so v1 remains the first public schema. */
  schemaVersion: 1;
  /** Seed for the run's RNG so loot rolls are reproducible after load. */
  rngSeed: number;
  player: PlayerState;
  /** World facts that must survive save/load: opened chests, permanent kills, etc. */
  worldFlags: Record<string, boolean>;
  stats: RunStats;
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
    stats: { kills: 0 },
    playTimeMs: 0,
  };
}

import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  createNewGameState,
} from '../../../src/core/state/GameState';

/**
 * core/ is the only unit-tested layer (ARCHITECTURE.md §1): pure logic,
 * headless, no Phaser. This first test also acts as a tripwire for the
 * save contract — GameState must always survive a JSON round-trip.
 */
describe('createNewGameState', () => {
  it('creates a fresh run at current schema version with full health/stamina', () => {
    const s = createNewGameState(42);
    expect(s.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(s.rngSeed).toBe(42);
    expect(s.player.health).toBe(s.player.maxHealth);
    expect(s.player.stamina).toBe(s.player.maxStamina);
    expect(s.player.inventory).toEqual([]);
    expect(s.stats.kills).toBe(0);
    expect(s.playTimeMs).toBe(0);
  });

  it('is 100% JSON-serializable (the save-file contract)', () => {
    const s = createNewGameState(7);
    const roundTripped = JSON.parse(JSON.stringify(s));
    expect(roundTripped).toEqual(s);
  });
});

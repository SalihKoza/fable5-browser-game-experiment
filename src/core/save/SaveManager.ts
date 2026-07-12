/**
 * SaveManager — the ONE choke point between GameState and storage (§8).
 * Nothing else reads or writes the save key. Storage is injected so tests
 * run against an in-memory stub and the class never touches globals itself.
 *
 * Every failure path returns a value (false / null) instead of throwing:
 * storage quota, disabled localStorage, corrupt JSON, wrong shape, and
 * unreachable versions all degrade to "no save".
 */
import { CURRENT_SCHEMA_VERSION, type GameState } from '../state/GameState';
import { migrateState } from './migrations';
import { createSaveFile, isSaveFileShaped, validateGameState } from './saveFile';

const SAVE_KEY = 'hollowmere.save';

export class SaveManager {
  constructor(
    private readonly storage: Storage,
    /** Injectable clock — tests pin it; production uses Date.now. */
    private readonly now: () => number = Date.now,
  ) {}

  /** @returns false when the write failed (quota, private mode, …). */
  save(state: GameState): boolean {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(createSaveFile(state, this.now())));
      return true;
    } catch {
      return false;
    }
  }

  /** @returns a fully validated GameState, or null (= behave as "no save"). */
  load(): GameState | null {
    let raw: string | null;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch {
      return null;
    }
    if (raw === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!isSaveFileShaped(parsed)) return null;

    const migrated = migrateState(
      parsed.state as Record<string, unknown>,
      parsed.schemaVersion,
      CURRENT_SCHEMA_VERSION,
    );
    if (migrated === null) return null;

    return validateGameState(migrated);
  }

  hasSave(): boolean {
    return this.load() !== null; // full validation: never offer a broken Continue
  }

  clear(): void {
    try {
      this.storage.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }
}

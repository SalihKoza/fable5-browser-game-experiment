/**
 * Save-schema migrations (ARCHITECTURE.md §8): database-migration discipline
 * applied to save files. When GameState's shape changes, bump
 * CURRENT_SCHEMA_VERSION and add ONE pure function here that lifts version
 * N to N+1. Loading runs the chain; a version we can't reach degrades to
 * "no save" (never a crash).
 *
 * The map is empty today — v1 is the first shipped shape — but the machinery
 * is tested with synthetic versions so the first real migration lands on
 * proven rails instead of being written in a hotfix panic.
 */

/** Lifts a raw save's `state` from version N to N+1. Must be pure. */
export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** Key = the version this migration upgrades FROM. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/**
 * Runs the chain from `fromVersion` up to `currentVersion`.
 * Returns the migrated state, or null when the chain can't reach current
 * (unknown future version, or a gap in the chain).
 */
export function migrateState(
  state: Record<string, unknown>,
  fromVersion: number,
  currentVersion: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): Record<string, unknown> | null {
  if (fromVersion > currentVersion) return null; // save from the future
  let current = state;
  for (let v = fromVersion; v < currentVersion; v++) {
    const step = migrations[v];
    if (!step) return null; // gap in the chain — cannot lift safely
    current = { ...step(current), schemaVersion: v + 1 };
  }
  return current;
}

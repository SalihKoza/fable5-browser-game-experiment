/**
 * Save-file format + structural validation (ARCHITECTURE.md §8).
 * Framework-free and pure: what a save IS lives here; how it's stored lives
 * in SaveManager; how versions evolve lives in migrations.ts.
 */
import type { GameState, InventorySlot } from '../state/GameState';

export interface SaveFile {
  /** Duplicated from state so migrations can read it before trusting state. */
  schemaVersion: number;
  /** Wall-clock ms — display only ("last played"), never used by simulation. */
  savedAt: number;
  state: GameState;
}

export function createSaveFile(state: GameState, savedAt: number): SaveFile {
  return { schemaVersion: state.schemaVersion, savedAt, state };
}

/** Shallow shape check before migration — is this even a save file? */
export function isSaveFileShaped(
  raw: unknown,
): raw is { schemaVersion: number; savedAt: number; state: unknown } {
  if (typeof raw !== 'object' || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return typeof o.schemaVersion === 'number' && typeof o.state === 'object' && o.state !== null;
}

/**
 * Structural validation of a (post-migration) GameState. Returns null on ANY
 * problem: a corrupt save must degrade to "no save", never to a crash or —
 * worse — a half-loaded run (§8: a corrupted save is worse than no save).
 */
export function validateGameState(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;

  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

  if (!num(s.schemaVersion) || !num(s.rngSeed) || !num(s.playTimeMs)) return null;
  if (typeof s.worldFlags !== 'object' || s.worldFlags === null) return null;

  const stats = s.stats as Record<string, unknown> | undefined;
  if (typeof stats !== 'object' || stats === null || !num(stats.kills)) return null;

  const p = s.player as Record<string, unknown> | undefined;
  if (typeof p !== 'object' || p === null) return null;
  if (!num(p.health) || !num(p.maxHealth) || !num(p.stamina) || !num(p.maxStamina))
    return null;
  const pos = p.position as Record<string, unknown> | undefined;
  if (typeof pos !== 'object' || pos === null || !num(pos.x) || !num(pos.y)) return null;
  if (!Array.isArray(p.inventory)) return null;
  for (const slot of p.inventory as unknown[]) {
    const sl = slot as Partial<InventorySlot>;
    if (typeof sl?.itemId !== 'string' || !num(sl.quantity) || sl.quantity < 1) return null;
  }

  return raw as GameState;
}

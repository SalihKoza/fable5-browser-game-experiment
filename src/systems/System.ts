import type { InputSnapshot } from '../core/input';
import type { GameState } from '../core/state/GameState';

/**
 * Per-tick scratch data passed between systems (ARCHITECTURE.md §5).
 * Systems never call each other: earlier systems write facts here, later ones
 * read them. Reset every tick — nothing in it survives the frame.
 */
export interface FrameScratch {
  /** Decided by StaminaSystem, consumed by MovementSystem. */
  sprinting: boolean;
}

export interface SystemContext {
  state: GameState;
  input: InputSnapshot;
  dtMs: number;
  frame: FrameScratch;
}

/**
 * A gameplay system. PlayScene holds systems in ONE ordered array and runs
 * them each update — the order is an explicit architectural artifact, not an
 * accident of call sites.
 */
export interface GameSystem {
  readonly name: string;
  update(ctx: SystemContext): void;
}

export function createFrameScratch(): FrameScratch {
  return { sprinting: false };
}

import type { GameBus } from '../core/events';
import type { InputSnapshot } from '../core/input';
import type { GameState } from '../core/state/GameState';
import type { Actor, ActorRegistry } from '../entities/Actor';

/**
 * Per-tick scratch data passed between systems (ARCHITECTURE.md §5).
 * Systems never call each other: earlier systems write facts here, later ones
 * read them. Reset every tick — nothing in it survives the frame.
 */
export interface FrameScratch {
  /** Decided by StaminaSystem, consumed by MovementSystem. */
  sprinting: boolean;
  /** Requested by CombatSystem (attack cost), applied by StaminaSystem. */
  staminaSpend: number;
}

export interface SystemContext {
  state: GameState;
  input: InputSnapshot;
  dtMs: number;
  frame: FrameScratch;
  /** Typed event bus — the only inter-system channel besides frame (§4). */
  bus: GameBus;
  actors: ActorRegistry;
  player: Actor;
  /** The run's seeded RNG stream (§6): loot rolls & AI draw from here so a
   *  run is reproducible from GameState.rngSeed alone. */
  rng: () => number;
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
  return { sprinting: false, staminaSpend: 0 };
}

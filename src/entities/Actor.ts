import type Phaser from 'phaser';
import type { HealthData, HurtData } from '../core/combat';
import type { GameBus } from '../core/events';
import type { Vec2Like } from '../core/state/GameState';

/**
 * Composition-based entities (ARCHITECTURE.md §4): an Actor is a plain record
 * of components around a Phaser sprite — no class hierarchies. Behavior lives
 * in systems; enemies additionally carry a Brain (their FSM).
 *
 * Runtime-only by design: Actors hold sprites, so they are NOT serializable.
 * Whatever must survive a save mirrors into GameState (player health/position).
 */
export type ActorKind = 'player' | 'ghoul';

export interface BrainContext {
  self: Actor;
  player: Actor;
  dtMs: number;
  bus: GameBus;
  /** The run's seeded RNG stream (§6) — brains never touch Math.random. */
  rng: () => number;
}

export interface Brain {
  readonly state: string;
  update(ctx: BrainContext): void;
}

/** Plain-data scratch used by brains (timers, patrol targets). */
export interface AiData {
  home: Vec2Like;
  stateTimerMs: number;
  patrolTarget: Vec2Like | null;
}

export interface Actor {
  id: string;
  kind: ActorKind;
  sprite: Phaser.Physics.Arcade.Sprite;
  health: HealthData;
  hurt: HurtData;
  /** Unit vector of the last movement direction — attacks aim along it. */
  facing: Vec2Like;
  ai?: AiData;
  brain?: Brain;
}

/** The scene's roster of living actors. Removal here does NOT destroy the
 *  sprite — the system that removes an actor owns its death presentation. */
export class ActorRegistry {
  private readonly actors = new Map<string, Actor>();

  add(actor: Actor): void {
    if (this.actors.has(actor.id))
      throw new Error(`ActorRegistry: duplicate id "${actor.id}"`);
    this.actors.set(actor.id, actor);
  }

  remove(id: string): void {
    this.actors.delete(id);
  }

  byId(id: string): Actor | undefined {
    return this.actors.get(id);
  }

  all(): IterableIterator<Actor> {
    return this.actors.values();
  }

  enemies(): Actor[] {
    return [...this.actors.values()].filter((a) => a.kind !== 'player');
  }
}

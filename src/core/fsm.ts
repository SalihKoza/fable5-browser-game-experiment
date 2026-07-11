/**
 * Generic finite state machine (framework-free, unit-tested). Used by enemy
 * AI (ARCHITECTURE.md §5): "what should this ghoul do right now?" must have
 * exactly one answer — boolean-flag soup is how AI code rots.
 *
 * A state's update() returns the key of the next state, or undefined to stay.
 * Transitions run onEnter exactly once — timers get armed there, not in update.
 */
export interface FsmStateDef<C> {
  onEnter?: (ctx: C) => void;
  update: (ctx: C) => string | undefined;
}

export class Fsm<C> {
  private currentKey: string;

  constructor(
    private readonly states: Record<string, FsmStateDef<C>>,
    initial: string,
  ) {
    if (!states[initial]) throw new Error(`Fsm: unknown initial state "${initial}"`);
    this.currentKey = initial;
  }

  get current(): string {
    return this.currentKey;
  }

  update(ctx: C): void {
    const next = this.states[this.currentKey]?.update(ctx);
    if (next !== undefined && next !== this.currentKey) this.transitionTo(next, ctx);
  }

  transitionTo(key: string, ctx: C): void {
    const state = this.states[key];
    if (!state) throw new Error(`Fsm: unknown state "${key}"`); // fail loud, not silent
    this.currentKey = key;
    state.onEnter?.(ctx);
  }
}

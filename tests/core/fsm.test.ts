import { describe, expect, it } from 'vitest';
import { Fsm, type FsmStateDef } from '../../src/core/fsm';

interface Ctx {
  aggro: boolean;
  log: string[];
}

function makeFsm() {
  const idle: FsmStateDef<Ctx> = {
    onEnter: (c) => c.log.push('enter:idle'),
    update: (c) => (c.aggro ? 'chase' : undefined),
  };
  const chase: FsmStateDef<Ctx> = {
    onEnter: (c) => c.log.push('enter:chase'),
    update: (c) => (c.aggro ? undefined : 'idle'),
  };
  return new Fsm<Ctx>({ idle, chase }, 'idle');
}

describe('Fsm', () => {
  it('stays in the current state when update returns undefined', () => {
    const fsm = makeFsm();
    const ctx: Ctx = { aggro: false, log: [] };
    fsm.update(ctx);
    expect(fsm.current).toBe('idle');
    expect(ctx.log).toEqual([]); // onEnter NOT re-fired while staying
  });

  it('transitions when update returns a state key, firing onEnter once', () => {
    const fsm = makeFsm();
    const ctx: Ctx = { aggro: true, log: [] };
    fsm.update(ctx);
    expect(fsm.current).toBe('chase');
    fsm.update(ctx);
    expect(ctx.log).toEqual(['enter:chase']); // exactly once
  });

  it('transitions back when conditions change', () => {
    const fsm = makeFsm();
    const ctx: Ctx = { aggro: true, log: [] };
    fsm.update(ctx); // → chase
    ctx.aggro = false;
    fsm.update(ctx); // → idle
    expect(fsm.current).toBe('idle');
    expect(ctx.log).toEqual(['enter:chase', 'enter:idle']);
  });

  it('fails loudly on unknown states', () => {
    expect(() => new Fsm<Ctx>({}, 'nope')).toThrow(/unknown initial state/);
    const fsm = makeFsm();
    expect(() => fsm.transitionTo('flee', { aggro: false, log: [] })).toThrow(
      /unknown state "flee"/,
    );
  });
});

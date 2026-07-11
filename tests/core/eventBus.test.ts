import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

interface TestEvents extends Record<string, unknown> {
  hit: { amount: number };
  died: { id: string };
}

describe('EventBus', () => {
  it('delivers payloads to subscribers of that event only', () => {
    const bus = new EventBus<TestEvents>();
    const onHit = vi.fn();
    const onDied = vi.fn();
    bus.on('hit', onHit);
    bus.on('died', onDied);

    bus.emit('hit', { amount: 10 });
    expect(onHit).toHaveBeenCalledWith({ amount: 10 });
    expect(onDied).not.toHaveBeenCalled();
  });

  it('supports multiple handlers and unsubscribe', () => {
    const bus = new EventBus<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.on('hit', a);
    bus.on('hit', b);

    offA();
    bus.emit('hit', { amount: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('survives a handler unsubscribing itself mid-emit', () => {
    const bus = new EventBus<TestEvents>();
    const calls: string[] = [];
    const offSelf = bus.on('hit', () => {
      calls.push('self');
      offSelf();
    });
    bus.on('hit', () => calls.push('other'));

    bus.emit('hit', { amount: 1 });
    bus.emit('hit', { amount: 2 });
    expect(calls).toEqual(['self', 'other', 'other']);
  });

  it('clear() drops every subscription (scene-restart safety)', () => {
    const bus = new EventBus<TestEvents>();
    const fn = vi.fn();
    bus.on('died', fn);
    bus.clear();
    bus.emit('died', { id: 'x' });
    expect(fn).not.toHaveBeenCalled();
  });
});

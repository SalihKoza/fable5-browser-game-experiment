import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  createHurtData,
  isInvulnerable,
  knockbackVelocity,
  stepHurt,
} from '../../src/core/combat';

describe('applyDamage', () => {
  it('reduces health and clamps at zero', () => {
    const { health } = applyDamage({ current: 30, max: 100 }, 50);
    expect(health.current).toBe(0);
  });

  it('reports died only on the killing blow — a corpse cannot die twice', () => {
    const first = applyDamage({ current: 10, max: 100 }, 25);
    expect(first.died).toBe(true);
    const second = applyDamage(first.health, 25);
    expect(second.died).toBe(false);
  });
});

describe('knockbackVelocity', () => {
  it('pushes the target directly away from the source at the given force', () => {
    const v = knockbackVelocity({ x: 0, y: 0 }, { x: 10, y: 0 }, 150);
    expect(v).toEqual({ vx: 150, vy: 0 });
  });

  it('normalizes diagonal push to the same magnitude', () => {
    const v = knockbackVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 100);
    expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(100);
  });

  it('degenerate zero-distance case pushes downward instead of NaN', () => {
    const v = knockbackVelocity({ x: 5, y: 5 }, { x: 5, y: 5 }, 100);
    expect(v).toEqual({ vx: 0, vy: 100 });
  });
});

describe('hurt timers', () => {
  it('counts down and clamps at zero', () => {
    let hurt = { invulnerableRemainingMs: 100, knockbackRemainingMs: 50 };
    hurt = stepHurt(hurt, 60);
    expect(hurt).toEqual({ invulnerableRemainingMs: 40, knockbackRemainingMs: 0 });
  });

  it('isInvulnerable reflects the i-frame window', () => {
    expect(isInvulnerable({ ...createHurtData(), invulnerableRemainingMs: 1 })).toBe(true);
    expect(isInvulnerable(createHurtData())).toBe(false);
  });
});

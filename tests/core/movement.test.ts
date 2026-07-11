import { describe, expect, it } from 'vitest';
import { computeVelocity } from '../../src/core/movement';

const cfg = { walkSpeed: 100, sprintMultiplier: 1.6 };

describe('computeVelocity', () => {
  it('is zero with no input', () => {
    expect(computeVelocity(0, 0, false, cfg)).toEqual({ vx: 0, vy: 0 });
  });

  it('moves at walkSpeed on a cardinal axis', () => {
    expect(computeVelocity(1, 0, false, cfg)).toEqual({ vx: 100, vy: 0 });
  });

  it('normalizes diagonals — never faster than walkSpeed (the √2 bug)', () => {
    const { vx, vy } = computeVelocity(1, 1, false, cfg);
    expect(Math.hypot(vx, vy)).toBeCloseTo(100);
  });

  it('applies the sprint multiplier', () => {
    const { vx } = computeVelocity(1, 0, true, cfg);
    expect(vx).toBeCloseTo(160);
  });
});

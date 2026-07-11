import { describe, expect, it } from 'vitest';
import { createRng, rollInt } from '../../src/core/rng';

describe('createRng (mulberry32)', () => {
  it('is deterministic: same seed → same sequence', () => {
    const a = createRng(1105);
    const b = createRng(1105);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('different seeds diverge', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 5 }, a);
    const seqB = Array.from({ length: 5 }, b);
    expect(seqA).not.toEqual(seqB);
  });

  it('stays in [0, 1)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('rollInt', () => {
  it('covers the inclusive range and nothing else', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = rollInt(rng, 1, 3);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3]));
  });
});

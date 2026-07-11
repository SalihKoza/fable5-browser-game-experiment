import { describe, expect, it } from 'vitest';
import { rollLoot, type LootTable } from '../../src/core/loot';
import { createRng } from '../../src/core/rng';

describe('rollLoot', () => {
  it('a chance of 1 always drops; a chance of 0 never does', () => {
    const table: LootTable = [
      { itemId: 'always', chance: 1, min: 2, max: 2 },
      { itemId: 'never', chance: 0, min: 1, max: 1 },
    ];
    const rng = createRng(99);
    for (let i = 0; i < 50; i++) {
      expect(rollLoot(table, rng)).toEqual([{ itemId: 'always', quantity: 2 }]);
    }
  });

  it('quantities stay within [min, max]', () => {
    const table: LootTable = [{ itemId: 'herb', chance: 1, min: 1, max: 3 }];
    const rng = createRng(5);
    for (let i = 0; i < 200; i++) {
      const [drop] = rollLoot(table, rng);
      expect(drop!.quantity).toBeGreaterThanOrEqual(1);
      expect(drop!.quantity).toBeLessThanOrEqual(3);
    }
  });

  it('is reproducible for a given seed (the point of seeding)', () => {
    const table: LootTable = [
      { itemId: 'herb', chance: 0.5, min: 1, max: 2 },
      { itemId: 'charm', chance: 0.35, min: 1, max: 2 },
    ];
    const rngA = createRng(1105);
    const rngB = createRng(1105);
    const seqA = Array.from({ length: 10 }, () => rollLoot(table, rngA));
    const seqB = Array.from({ length: 10 }, () => rollLoot(table, rngB));
    expect(seqA).toEqual(seqB);
  });
});

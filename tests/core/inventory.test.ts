import { describe, expect, it } from 'vitest';
import { addItem, countItem, removeItem } from '../../src/core/inventory';

const OPTS = { maxStack: 5, maxSlots: 3 };

describe('addItem', () => {
  it('fills existing stacks before opening new slots', () => {
    const { slots } = addItem([{ itemId: 'herb', quantity: 3 }], 'herb', 4, OPTS);
    expect(slots).toEqual([
      { itemId: 'herb', quantity: 5 },
      { itemId: 'herb', quantity: 2 },
    ]);
  });

  it('reports overflow when slots run out', () => {
    const full = [
      { itemId: 'herb', quantity: 5 },
      { itemId: 'charm', quantity: 5 },
      { itemId: 'iron', quantity: 5 },
    ];
    const { slots, overflow } = addItem(full, 'herb', 3, OPTS);
    expect(overflow).toBe(3);
    expect(slots).toEqual(full);
  });

  it('does not mutate the input array', () => {
    const original = [{ itemId: 'herb', quantity: 1 }];
    addItem(original, 'herb', 1, OPTS);
    expect(original).toEqual([{ itemId: 'herb', quantity: 1 }]);
  });
});

describe('removeItem', () => {
  it('removes across stacks and drops emptied slots', () => {
    const { slots, removed } = removeItem(
      [
        { itemId: 'herb', quantity: 2 },
        { itemId: 'charm', quantity: 1 },
        { itemId: 'herb', quantity: 4 },
      ],
      'herb',
      5,
    );
    expect(removed).toBe(5);
    expect(slots).toEqual([
      { itemId: 'charm', quantity: 1 },
      { itemId: 'herb', quantity: 1 },
    ]);
  });

  it('removes at most what exists', () => {
    const { slots, removed } = removeItem([{ itemId: 'herb', quantity: 2 }], 'herb', 10);
    expect(removed).toBe(2);
    expect(slots).toEqual([]);
  });
});

describe('countItem', () => {
  it('sums quantities across stacks', () => {
    const slots = [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'charm', quantity: 1 },
      { itemId: 'herb', quantity: 3 },
    ];
    expect(countItem(slots, 'herb')).toBe(5);
    expect(countItem(slots, 'iron')).toBe(0);
  });
});

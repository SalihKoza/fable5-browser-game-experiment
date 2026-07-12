import { describe, expect, it } from 'vitest';
import { hasLineOfSight, type SolidFn } from '../../src/core/grid';

/** Fixture: string rows, '#' = solid. */
function gridOf(rows: string[]): SolidFn {
  return (x, y) => rows[y]?.[x] === '#';
}

describe('hasLineOfSight', () => {
  it('open field: always visible', () => {
    const solid = gridOf(['.....', '.....', '.....']);
    expect(hasLineOfSight(solid, 0, 0, 4, 2)).toBe(true);
    expect(hasLineOfSight(solid, 4, 2, 0, 0)).toBe(true);
  });

  it('a wall between blocks horizontal, vertical and diagonal lines', () => {
    const solid = gridOf([
      '.....',
      '..#..',
      '.....',
    ]);
    expect(hasLineOfSight(solid, 0, 1, 4, 1)).toBe(false); // through the wall
    expect(hasLineOfSight(solid, 2, 0, 2, 2)).toBe(false);
    expect(hasLineOfSight(solid, 0, 0, 4, 2)).toBe(false);
  });

  it('lines that route around the wall cell stay visible', () => {
    const solid = gridOf([
      '.....',
      '..#..',
      '.....',
    ]);
    expect(hasLineOfSight(solid, 0, 0, 4, 0)).toBe(true); // above it
    expect(hasLineOfSight(solid, 0, 2, 4, 2)).toBe(true); // below it
  });

  it('endpoints are never tested — wall-huggers stay visible', () => {
    // Both endpoints are solid, but only the cells BETWEEN count; the middle
    // cell is open, so the line is clear.
    const solid = gridOf(['#.#']);
    expect(hasLineOfSight(solid, 0, 0, 2, 0)).toBe(true);
  });

  it('adjacent and identical tiles are trivially visible', () => {
    const solid = gridOf(['##', '##']); // everything solid — endpoints untested
    expect(hasLineOfSight(solid, 0, 0, 0, 0)).toBe(true);
    expect(hasLineOfSight(solid, 0, 0, 1, 0)).toBe(true);
  });
});

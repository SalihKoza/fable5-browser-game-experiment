import { describe, expect, it } from 'vitest';
import { isZoneId, zoneAt, type Zone } from '../../src/core/zones';

const zones: Zone[] = [
  { id: 'ruins', x: 0, y: 0, width: 100, height: 200 },
  { id: 'forest', x: 100, y: 0, width: 100, height: 200 },
];

describe('zoneAt', () => {
  it('finds the containing zone', () => {
    expect(zoneAt(zones, 50, 50)).toBe('ruins');
    expect(zoneAt(zones, 150, 50)).toBe('forest');
  });

  it('treats boundaries as [inclusive, exclusive) — no double-membership', () => {
    expect(zoneAt(zones, 100, 0)).toBe('forest');
    expect(zoneAt(zones, 99.9, 0)).toBe('ruins');
  });

  it('returns undefined outside all zones', () => {
    expect(zoneAt(zones, 500, 500)).toBeUndefined();
  });
});

describe('isZoneId', () => {
  it('accepts known ids and rejects junk from map data', () => {
    expect(isZoneId('ruins')).toBe(true);
    expect(isZoneId('hollow')).toBe(true);
    expect(isZoneId('swamp')).toBe(false);
  });
});

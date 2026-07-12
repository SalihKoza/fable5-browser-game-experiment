/**
 * Zones — rectangular regions of the map that change how the world behaves
 * (ambient darkness, enemy sight, fog). Zones are MAP DATA (a Tiled object
 * layer); this module is the pure, framework-free lookup (unit-tested).
 */

export const ZoneId = {
  Ruins: 'ruins',
  Forest: 'forest',
  Hollow: 'hollow',
} as const;
export type ZoneId = (typeof ZoneId)[keyof typeof ZoneId];

export const ALL_ZONE_IDS: readonly ZoneId[] = Object.values(ZoneId);

export interface Zone {
  id: ZoneId;
  /** Pixel-space rect, as authored in the Tiled zones layer. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** First zone containing the point wins; undefined = outside all zones. */
export function zoneAt(zones: readonly Zone[], x: number, y: number): ZoneId | undefined {
  for (const z of zones) {
    if (x >= z.x && x < z.x + z.width && y >= z.y && y < z.y + z.height) return z.id;
  }
  return undefined;
}

export function isZoneId(value: string): value is ZoneId {
  return (ALL_ZONE_IDS as readonly string[]).includes(value);
}

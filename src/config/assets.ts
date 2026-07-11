/**
 * Asset keys as constants — no stringly-typed lookups. Keys must match
 * public/assets/manifest.json entries (loaded by PreloadScene).
 */
export const AssetKey = {
  WorldTiles: 'world-tiles',
  MapHollowmere: 'map-hollowmere',
  /** Generated at runtime by the Player factory (placeholder pipeline, §10). */
  PlayerTexture: 'player-placeholder',
} as const;
export type AssetKey = (typeof AssetKey)[keyof typeof AssetKey];

/** Layer/object names inside the Tiled map — the contract with the map file. */
export const MapLayer = {
  Ground: 'ground',
  Walls: 'walls',
  Spawns: 'spawns',
} as const;

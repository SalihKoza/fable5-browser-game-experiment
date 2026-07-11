/**
 * Asset keys as constants — no stringly-typed lookups. Keys must match
 * public/assets/manifest.json entries (loaded by PreloadScene).
 */
export const AssetKey = {
  WorldTiles: 'world-tiles',
  MapHollowmere: 'map-hollowmere',
  /** items.json — the item catalog (validated in data/itemCatalog.ts). */
  ItemsData: 'items',
  /** Generated at runtime by entity factories (placeholder pipeline, §10). */
  PlayerTexture: 'player-placeholder',
  GhoulTexture: 'ghoul-placeholder',
  ChestTexture: 'chest-placeholder',
  ChestOpenTexture: 'chest-open-placeholder',
  PickupTexture: 'pickup-placeholder',
} as const;
export type AssetKey = (typeof AssetKey)[keyof typeof AssetKey];

/** Layer/object names inside the Tiled map — the contract with the map file. */
export const MapLayer = {
  Ground: 'ground',
  Walls: 'walls',
  Spawns: 'spawns',
} as const;

/** Object names on the spawns layer. */
export const SpawnName = {
  Player: 'player',
  Ghoul: 'ghoul',
  Chest: 'chest',
} as const;

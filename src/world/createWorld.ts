import Phaser from 'phaser';
import { AssetKey, MapLayer } from '../config/assets';

export interface World {
  map: Phaser.Tilemaps.Tilemap;
  ground: Phaser.Tilemaps.TilemapLayer;
  walls: Phaser.Tilemaps.TilemapLayer;
  /** Player spawn point read from the Tiled object layer. */
  spawn: { x: number; y: number };
  /** Pixel size of the whole map — used for camera & physics bounds. */
  widthPx: number;
  heightPx: number;
}

/**
 * Builds the world from the Tiled map (ARCHITECTURE.md §10). The map file is
 * DATA: layer names and the spawn object are the contract (config/assets.ts);
 * level design changes never touch code. Fails loudly if the contract is
 * broken — a silent fallback spawn would hide a broken map for weeks.
 */
export function createWorld(scene: Phaser.Scene): World {
  const map = scene.make.tilemap({ key: AssetKey.MapHollowmere });
  const tileset = map.addTilesetImage('tiles', AssetKey.WorldTiles);
  if (!tileset) throw new Error('World: tileset "tiles" missing from map/manifest');

  // Phaser 4 can return GPU-accelerated layers; we require classic CPU layers
  // because collision + per-tile access assume them. The instanceof check
  // narrows the union type AND guards the assumption at runtime.
  const ground = map.createLayer(MapLayer.Ground, tileset, 0, 0);
  const walls = map.createLayer(MapLayer.Walls, tileset, 0, 0);
  if (
    !(ground instanceof Phaser.Tilemaps.TilemapLayer) ||
    !(walls instanceof Phaser.Tilemaps.TilemapLayer)
  ) {
    throw new Error('World: expected CPU tilemap layers ground/walls');
  }

  // Tiles 3 & 4 (stone / cracked stone) are solid — declared once, here.
  walls.setCollision([3, 4]);

  const spawnObj = map
    .getObjectLayer(MapLayer.Spawns)
    ?.objects.find((o) => o.name === 'player');
  if (spawnObj?.x == null || spawnObj?.y == null)
    throw new Error('World: spawn object "player" missing from map');

  return {
    map,
    ground,
    walls,
    spawn: { x: spawnObj.x, y: spawnObj.y },
    widthPx: map.widthInPixels,
    heightPx: map.heightInPixels,
  };
}

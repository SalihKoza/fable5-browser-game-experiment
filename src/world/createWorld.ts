import Phaser from 'phaser';
import { AssetKey, MapLayer, SpawnName } from '../config/assets';
import type { SolidFn } from '../core/grid';
import type { Vec2Like } from '../core/state/GameState';
import { isZoneId, type Zone } from '../core/zones';

export interface World {
  map: Phaser.Tilemaps.Tilemap;
  ground: Phaser.Tilemaps.TilemapLayer;
  walls: Phaser.Tilemaps.TilemapLayer;
  /** Player spawn point read from the Tiled object layer. */
  spawn: Vec2Like;
  ghoulSpawns: Vec2Like[];
  wraithSpawns: Vec2Like[];
  /** Chest placements; id = Tiled object id (stable across runs → worldFlags). */
  chestSpawns: { id: string; x: number; y: number }[];
  /** Static light sources (braziers) for the darkness pass. */
  lights: Vec2Like[];
  /** Atmosphere/perception regions from the zones layer. */
  zones: Zone[];
  /** Perception query for AI line-of-sight (tile coordinates). */
  solidAt: SolidFn;
  tileSize: number;
  /** Pixel size of the whole map — used for camera & physics bounds. */
  widthPx: number;
  heightPx: number;
}

/** Solid (collision) tile ids in the tileset: wall, mossy wall, tree. */
const SOLID_TILES = [3, 4, 7];

/**
 * Builds the world from the Tiled map (ARCHITECTURE.md §10). The map file is
 * DATA: layer names and spawn objects are the contract (config/assets.ts);
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
  walls.setCollision(SOLID_TILES);

  // -- spawns -------------------------------------------------------------
  const objects = map.getObjectLayer(MapLayer.Spawns)?.objects ?? [];
  const playerObj = objects.find((o) => o.name === SpawnName.Player);
  if (playerObj?.x == null || playerObj?.y == null)
    throw new Error('World: spawn object "player" missing from map');

  const pointsNamed = (name: string): Vec2Like[] =>
    objects
      .filter((o) => o.name === name && o.x != null && o.y != null)
      .map((o) => ({ x: o.x as number, y: o.y as number }));

  const chestSpawns = objects
    .filter((o) => o.name === SpawnName.Chest && o.x != null && o.y != null)
    .map((o) => ({ id: String(o.id), x: o.x as number, y: o.y as number }));

  // -- zones (fail loud on unknown ids — the map/code contract) ------------
  const zones: Zone[] = (map.getObjectLayer(MapLayer.Zones)?.objects ?? []).map((o) => {
    if (!o.name || !isZoneId(o.name))
      throw new Error(`World: unknown zone id "${o.name}" in zones layer`);
    return {
      id: o.name,
      x: o.x ?? 0,
      y: o.y ?? 0,
      width: o.width ?? 0,
      height: o.height ?? 0,
    };
  });
  if (zones.length === 0) throw new Error('World: zones layer is empty');

  return {
    map,
    ground,
    walls,
    spawn: { x: playerObj.x, y: playerObj.y },
    ghoulSpawns: pointsNamed(SpawnName.Ghoul),
    wraithSpawns: pointsNamed(SpawnName.Wraith),
    chestSpawns,
    lights: pointsNamed(SpawnName.Light),
    zones,
    solidAt: (tx, ty) => walls.hasTileAt(tx, ty),
    tileSize: map.tileWidth,
    widthPx: map.widthInPixels,
    heightPx: map.heightInPixels,
  };
}

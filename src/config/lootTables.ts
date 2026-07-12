/**
 * Loot tables — design data in typed config. Item ids must exist in
 * items.json (ItemCatalog fails loudly at first lookup if they don't).
 *
 * Deliberately TS (not JSON) for now: tables are small and benefit from type
 * checking against LootTable. Promoting them into enemies.json/chests.json is
 * planned future work, not accidental debt (see phase-03 report).
 */
import type { LootTable } from '../core/loot';

export const GHOUL_LOOT: LootTable = [
  { itemId: 'healing_herb', chance: 0.5, min: 1, max: 1 },
  { itemId: 'bone_charm', chance: 0.35, min: 1, max: 2 },
];

/** Wraiths carry the hollow's cold metal, rarely anything living. */
export const WRAITH_LOOT: LootTable = [
  { itemId: 'grave_iron', chance: 0.8, min: 1, max: 2 },
  { itemId: 'healing_herb', chance: 0.2, min: 1, max: 1 },
];

/** EnemyDied.enemyType → table. New enemy = one entry here (data, not code). */
export const LOOT_BY_ENEMY: Readonly<Record<string, LootTable>> = {
  ghoul: GHOUL_LOOT,
  wraith: WRAITH_LOOT,
};

/** Chests are guarded rewards — strictly better than a ghoul's pockets. */
export const CHEST_LOOT: LootTable = [
  { itemId: 'healing_herb', chance: 1.0, min: 1, max: 2 },
  { itemId: 'grave_iron', chance: 0.6, min: 1, max: 3 },
  { itemId: 'bone_charm', chance: 0.5, min: 1, max: 2 },
];

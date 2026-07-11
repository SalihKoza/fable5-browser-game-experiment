/**
 * Loot table rolls — pure and framework-free (unit-tested). Tables are DATA
 * (config/lootTables.ts): entries roll independently, so a table reads
 * exactly like the design intent ("50% chance of 1 herb, 35% of 1-2 charms").
 */
import { rollInt, type Rng } from './rng';

export interface LootTableEntry {
  itemId: string;
  /** Independent probability [0..1] that this entry drops at all. */
  chance: number;
  min: number;
  max: number;
}

export type LootTable = readonly LootTableEntry[];

export interface LootDrop {
  itemId: string;
  quantity: number;
}

export function rollLoot(table: LootTable, rng: Rng): LootDrop[] {
  const drops: LootDrop[] = [];
  for (const entry of table) {
    if (rng() >= entry.chance) continue;
    drops.push({ itemId: entry.itemId, quantity: rollInt(rng, entry.min, entry.max) });
  }
  return drops;
}

/**
 * Inventory operations — pure and framework-free (unit-tested). The inventory
 * itself is just InventorySlot[] inside GameState; these functions are the
 * ONLY way it changes. All operations return new arrays — no mutation, so
 * callers can't corrupt state and tests read naturally.
 */
import type { InventorySlot } from './state/GameState';

export interface AddOptions {
  /** Max quantity per stack for this item (from the item catalog). */
  maxStack: number;
  /** Total slot capacity of the inventory. */
  maxSlots: number;
}

export interface AddResult {
  slots: InventorySlot[];
  /** Quantity that did NOT fit — caller decides (leave on ground, etc.). */
  overflow: number;
}

/** Fill existing stacks first, then open new slots while capacity allows. */
export function addItem(
  slots: InventorySlot[],
  itemId: string,
  quantity: number,
  opts: AddOptions,
): AddResult {
  let remaining = quantity;
  const next = slots.map((slot) => {
    if (remaining === 0 || slot.itemId !== itemId || slot.quantity >= opts.maxStack)
      return slot;
    const take = Math.min(remaining, opts.maxStack - slot.quantity);
    remaining -= take;
    return { ...slot, quantity: slot.quantity + take };
  });

  while (remaining > 0 && next.length < opts.maxSlots) {
    const take = Math.min(remaining, opts.maxStack);
    next.push({ itemId, quantity: take });
    remaining -= take;
  }

  return { slots: next, overflow: remaining };
}

export interface RemoveResult {
  slots: InventorySlot[];
  /** Quantity actually removed (≤ requested). */
  removed: number;
}

/** Remove from the first stacks; empty slots disappear (no null holes). */
export function removeItem(
  slots: InventorySlot[],
  itemId: string,
  quantity: number,
): RemoveResult {
  let remaining = quantity;
  const next: InventorySlot[] = [];
  for (const slot of slots) {
    if (remaining === 0 || slot.itemId !== itemId) {
      next.push(slot);
      continue;
    }
    const take = Math.min(remaining, slot.quantity);
    remaining -= take;
    if (slot.quantity > take) next.push({ ...slot, quantity: slot.quantity - take });
  }
  return { slots: next, removed: quantity - remaining };
}

export function countItem(slots: InventorySlot[], itemId: string): number {
  return slots.reduce((n, s) => (s.itemId === itemId ? n + s.quantity : n), 0);
}

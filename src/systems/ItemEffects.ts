import { applyHeal } from '../core/combat';
import { GameEvent } from '../core/events';
import type { GameBus } from '../core/events';
import { removeItem } from '../core/inventory';
import type { GameState } from '../core/state/GameState';
import type { Actor } from '../entities/Actor';
import type { ItemCatalog } from '../data/itemCatalog';

/**
 * Event-driven use-item handler — deliberately NOT a ticked system: using a
 * potion from the inventory must work while the simulation is PAUSED (menu
 * open), so it can't wait for the next system tick.
 *
 * Documented deviation from "HealthSystem is the only health writer": that
 * rule guards DAMAGE resolution (ordering, i-frames, death). Healing has none
 * of those concerns; its math still lives in core/combat and this class is
 * the single place menu-time effects happen.
 */
export class ItemEffects {
  private readonly unsubscribe: () => void;

  constructor(
    catalog: ItemCatalog,
    bus: GameBus,
    state: GameState,
    player: Actor,
  ) {
    this.unsubscribe = bus.on(GameEvent.UiUseItem, ({ itemId }) => {
      const def = catalog.get(itemId);
      if (!def.use) return; // not a usable item; UI shouldn't offer it anyway

      // Don't waste a herb at full health — a click is not consent to waste.
      if (def.use.heal > 0 && player.health.current >= player.health.max) return;

      const result = removeItem(state.player.inventory, itemId, 1);
      if (result.removed === 0) return; // nothing left (stale UI click)

      state.player.inventory = result.slots;
      player.health = applyHeal(player.health, def.use.heal);
      state.player.health = player.health.current; // mirror (§6)
      bus.emit(GameEvent.InventoryChanged, {});
    });
  }

  destroy(): void {
    this.unsubscribe();
  }
}

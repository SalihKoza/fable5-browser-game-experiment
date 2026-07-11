import { GameEvent } from '../core/events';
import type { GameBus } from '../core/events';
import type { GameState } from '../core/state/GameState';
import type { ItemCatalog } from '../data/itemCatalog';
import { LOOT_TUNING } from '../config/tuning';

/**
 * DOM inventory panel (ARCHITECTURE.md §1). Reads GameState; NEVER mutates it
 * (§6) — clicking "use" emits UiUseItem on the bus and ItemEffects does the
 * work, after which InventoryChanged triggers a re-render here.
 */
export class InventoryPanel {
  private readonly root: HTMLDivElement;
  private readonly grid: HTMLDivElement;
  private visible = false;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly state: GameState,
    private readonly catalog: ItemCatalog,
    private readonly bus: GameBus,
  ) {
    this.root = document.createElement('div');
    this.root.style.cssText = [
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);',
      'width:340px;padding:14px 16px;display:none;',
      'background:rgba(10,10,15,0.94);border:1px solid #2a2a35;border-radius:4px;',
      'pointer-events:auto;', // the #ui layer disables events; panels re-enable
    ].join('');

    const title = document.createElement('div');
    title.textContent = 'inventory';
    title.style.cssText =
      'font:12px monospace;color:#d8d2c4;letter-spacing:2px;margin-bottom:10px;';

    this.grid = document.createElement('div');
    this.grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;';

    const hint = document.createElement('div');
    hint.textContent = 'I / Tab to close';
    hint.style.cssText = 'font:9px monospace;color:#6b6558;margin-top:10px;';

    this.root.append(title, this.grid, hint);
    document.getElementById('ui')?.appendChild(this.root);

    this.unsubscribe = this.bus.on(GameEvent.InventoryChanged, () => {
      if (this.visible) this.render();
    });
  }

  get isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    this.visible = true;
    this.render();
    this.root.style.display = 'block';
  }

  hide(): void {
    this.visible = false;
    this.root.style.display = 'none';
  }

  destroy(): void {
    this.unsubscribe();
    this.root.remove();
  }

  private render(): void {
    this.grid.replaceChildren();
    const slots = this.state.player.inventory;

    for (let i = 0; i < LOOT_TUNING.inventorySlots; i++) {
      const cell = document.createElement('div');
      cell.style.cssText =
        'min-height:34px;padding:5px 7px;background:#12121a;border:1px solid #22222d;border-radius:3px;';
      const slot = slots[i];

      if (slot) {
        const def = this.catalog.get(slot.itemId);
        const name = document.createElement('div');
        name.textContent = `${def.name} ×${slot.quantity}`;
        name.title = def.description;
        name.style.cssText = 'font:10px monospace;color:#d8d2c4;';
        cell.appendChild(name);

        if (def.use) {
          const useBtn = document.createElement('button');
          useBtn.textContent = 'use';
          useBtn.style.cssText = [
            'margin-top:3px;font:9px monospace;color:#d8d2c4;cursor:pointer;',
            'background:#2a2a35;border:1px solid #3a3a48;border-radius:2px;padding:1px 8px;',
          ].join('');
          useBtn.addEventListener('click', () =>
            this.bus.emit(GameEvent.UiUseItem, { itemId: slot.itemId }),
          );
          cell.appendChild(useBtn);
        }
      }
      this.grid.appendChild(cell);
    }
  }
}

import { LOOT_TUNING } from '../config/tuning';
import { GameEvent } from '../core/events';
import type { Chest } from '../entities/Chest';
import type { GameSystem, SystemContext } from './System';

/**
 * The E key (§5): finds the nearest interactable in range and triggers it.
 * Phase 3 knows one interactable kind (chests); doors/levers later join the
 * same proximity scan rather than inventing new input paths.
 *
 * Opening a chest: flips the sprite, records `worldFlags["chest:<id>"]`
 * (which the Phase 5 save system will persist for free), and emits
 * ChestOpened — LootSystem does the actual rewarding. This system never
 * touches loot.
 */
export class InteractionSystem implements GameSystem {
  readonly name = 'interaction';

  constructor(private readonly chests: Chest[]) {}

  update(ctx: SystemContext): void {
    const px = ctx.player.sprite.x;
    const py = ctx.player.sprite.y;

    let nearest: Chest | undefined;
    // Widen: LOOT_TUNING is `as const`, so the raw literal type can't shrink.
    let nearestDist: number = LOOT_TUNING.interactRadius;
    for (const chest of this.chests) {
      const d = Math.hypot(chest.x - px, chest.y - py);
      chest.setPromptVisible(false);
      if (!chest.opened && d <= nearestDist) {
        nearest = chest;
        nearestDist = d;
      }
    }
    if (!nearest) return;

    nearest.setPromptVisible(true);
    if (!ctx.input.interactPressed) return;

    nearest.open();
    ctx.state.worldFlags[`chest:${nearest.id}`] = true;
    ctx.bus.emit(GameEvent.ChestOpened, {
      chestId: nearest.id,
      x: nearest.x,
      y: nearest.y,
    });
  }
}

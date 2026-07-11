import type { GameSystem, SystemContext } from './System';

/**
 * Runs every enemy brain once per tick (§5). The system is deliberately dumb:
 * all ghoul-specific behavior lives in the brain — a second enemy type is a
 * new brain factory, not a change here.
 */
export class AISystem implements GameSystem {
  readonly name = 'ai';

  update(ctx: SystemContext): void {
    for (const enemy of ctx.actors.enemies()) {
      if (!enemy.brain) continue;
      // While knocked back, physics owns the body — the brain doesn't fight it.
      if (enemy.hurt.knockbackRemainingMs > 0) continue;
      enemy.brain.update({
        self: enemy,
        player: ctx.player,
        dtMs: ctx.dtMs,
        bus: ctx.bus,
        rng: ctx.rng,
      });
    }
  }
}

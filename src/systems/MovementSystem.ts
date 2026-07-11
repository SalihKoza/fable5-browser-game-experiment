import { computeVelocity, type MovementConfig } from '../core/movement';
import type { GameSystem, SystemContext } from './System';

/**
 * Applies intent → velocity on the player's arcade body. The math lives in
 * core/movement (pure, tested); this class is the thin adapter. Collision
 * response itself is Arcade Physics' job (§5).
 */
export class MovementSystem implements GameSystem {
  readonly name = 'movement';

  constructor(private readonly cfg: MovementConfig) {}

  update(ctx: SystemContext): void {
    const player = ctx.player;

    // During knockback the body belongs to physics — input doesn't fight it.
    if (player.hurt.knockbackRemainingMs > 0) return;

    const { vx, vy } = computeVelocity(
      ctx.input.axisX,
      ctx.input.axisY,
      ctx.frame.sprinting,
      this.cfg,
    );
    player.sprite.setVelocity(vx, vy);

    // Facing = last non-zero movement direction; attacks aim along it.
    const len = Math.hypot(ctx.input.axisX, ctx.input.axisY);
    if (len > 0) {
      player.facing = { x: ctx.input.axisX / len, y: ctx.input.axisY / len };
    }

    // Mirror the body's position into serializable state (one sync point, §6).
    ctx.state.player.position = { x: player.sprite.x, y: player.sprite.y };
  }
}

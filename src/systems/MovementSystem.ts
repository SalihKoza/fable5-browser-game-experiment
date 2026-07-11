import type Phaser from 'phaser';
import { computeVelocity, type MovementConfig } from '../core/movement';
import type { GameSystem, SystemContext } from './System';

/**
 * Applies intent → velocity on the player's arcade body. The math lives in
 * core/movement (pure, tested); this class is the thin Phaser adapter.
 * Collision response itself is Arcade Physics' job (§5) — we set velocities,
 * the collider set up in PlayScene stops us at walls.
 */
export class MovementSystem implements GameSystem {
  readonly name = 'movement';

  constructor(
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly cfg: MovementConfig,
  ) {}

  update(ctx: SystemContext): void {
    const { vx, vy } = computeVelocity(
      ctx.input.axisX,
      ctx.input.axisY,
      ctx.frame.sprinting,
      this.cfg,
    );
    this.player.setVelocity(vx, vy);

    // Mirror the body's position into serializable state (runtime → state
    // sync happens in exactly one place).
    ctx.state.player.position = { x: this.player.x, y: this.player.y };
  }
}

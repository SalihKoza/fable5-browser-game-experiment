import Phaser from 'phaser';
import type { PLAYER_COMBAT_TUNING } from '../config/tuning';
import { GameEvent } from '../core/events';
import type { GameSystem, SystemContext } from './System';

type CombatTuning = typeof PLAYER_COMBAT_TUNING;

/**
 * Player melee (§5). A swing spawns a short-lived HITBOX — deliberately NOT a
 * physics body: attack rects need overlap queries, not collision response, so
 * they stay plain geometry checked against enemy bounds. The per-swing
 * hitIds set gives one-hit-per-target for free.
 *
 * Runs BEFORE StaminaSystem: the stamina cost is requested via
 * frame.staminaSpend and applied there (one stamina writer, §5).
 */
interface Hitbox {
  rect: Phaser.Geom.Rectangle;
  lifeMs: number;
  hitIds: Set<string>;
}

export class CombatSystem implements GameSystem {
  readonly name = 'combat';

  private cooldownMs = 0;
  private bufferMs = 0;
  private hitboxes: Hitbox[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cfg: CombatTuning,
  ) {}

  update(ctx: SystemContext): void {
    this.cooldownMs = Math.max(0, this.cooldownMs - ctx.dtMs);
    this.bufferMs = Math.max(0, this.bufferMs - ctx.dtMs);

    // Input buffering (§9): remember the press briefly instead of dropping it.
    if (ctx.input.attackPressed) this.bufferMs = this.cfg.bufferMs;

    const canSwing =
      this.bufferMs > 0 &&
      this.cooldownMs === 0 &&
      ctx.state.player.stamina >= this.cfg.staminaCost;
    if (canSwing) this.swing(ctx);

    this.stepHitboxes(ctx);
  }

  private swing(ctx: SystemContext): void {
    this.bufferMs = 0;
    this.cooldownMs = this.cfg.cooldownMs;
    ctx.frame.staminaSpend += this.cfg.staminaCost;

    const { facing, sprite } = ctx.player;
    const cx = sprite.x + facing.x * this.cfg.reach;
    const cy = sprite.y + facing.y * this.cfg.reach;
    this.hitboxes.push({
      rect: new Phaser.Geom.Rectangle(
        cx - this.cfg.hitboxWidth / 2,
        cy - this.cfg.hitboxHeight / 2,
        this.cfg.hitboxWidth,
        this.cfg.hitboxHeight,
      ),
      lifeMs: this.cfg.hitboxLifeMs,
      hitIds: new Set(),
    });

    // Slash feedback: a fading rectangle where the hitbox is. Placeholder for
    // a real slash animation — the FEEL ships before the art (§10).
    const fx = this.scene.add
      .rectangle(cx, cy, this.cfg.hitboxWidth, this.cfg.hitboxHeight, 0xd8d2c4, 0.45)
      .setDepth(1000);
    this.scene.tweens.add({
      targets: fx,
      alpha: 0,
      duration: this.cfg.hitboxLifeMs + 40,
      onComplete: () => fx.destroy(),
    });
  }

  private stepHitboxes(ctx: SystemContext): void {
    for (const hb of this.hitboxes) {
      hb.lifeMs -= ctx.dtMs;
      for (const enemy of ctx.actors.enemies()) {
        if (hb.hitIds.has(enemy.id)) continue;
        if (!Phaser.Geom.Intersects.RectangleToRectangle(hb.rect, enemy.sprite.getBounds()))
          continue;
        hb.hitIds.add(enemy.id);
        ctx.bus.emit(GameEvent.EntityDamaged, {
          targetId: enemy.id,
          amount: this.cfg.damage,
          sourceX: ctx.player.sprite.x,
          sourceY: ctx.player.sprite.y,
          knockbackForce: this.cfg.knockbackForce,
        });
      }
    }
    this.hitboxes = this.hitboxes.filter((hb) => hb.lifeMs > 0);
  }
}

import Phaser from 'phaser';
import { HURT_TUNING } from '../config/tuning';
import {
  applyDamage,
  isInvulnerable,
  knockbackVelocity,
  stepHurt,
} from '../core/combat';
import { GameEvent, type GameEventPayloads } from '../core/events';
import type { GameBus } from '../core/events';
import type { Actor } from '../entities/Actor';
import type { GameSystem, SystemContext } from './System';

type DamageEvent = GameEventPayloads[typeof GameEvent.EntityDamaged];

/**
 * The ONLY writer of health (§4/§5). Damage requests arrive as EntityDamaged
 * events, are queued, and are resolved here once per tick in deterministic
 * order — no mid-tick health mutations from three different call sites.
 *
 * Also owns hurt presentation (flash, knockback, death fade) and mirrors the
 * player's health into serializable GameState.
 */
export class HealthSystem implements GameSystem {
  readonly name = 'health';

  private readonly queue: DamageEvent[] = [];
  private readonly unsubscribe: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    bus: GameBus,
  ) {
    this.unsubscribe = bus.on(GameEvent.EntityDamaged, (e) => this.queue.push(e));
  }

  destroy(): void {
    this.unsubscribe();
  }

  update(ctx: SystemContext): void {
    // 1. Tick hurt timers for everyone (i-frames, knockback ownership).
    for (const actor of ctx.actors.all()) actor.hurt = stepHurt(actor.hurt, ctx.dtMs);

    // 2. Resolve this tick's damage queue.
    for (const e of this.queue.splice(0)) this.resolve(ctx, e);

    // 3. Mirror the player's health into the serializable state (§6).
    ctx.state.player.health = ctx.player.health.current;
  }

  private resolve(ctx: SystemContext, e: DamageEvent): void {
    const target = ctx.actors.byId(e.targetId);
    if (!target || target.health.current <= 0) return; // died earlier this tick
    if (target.kind === 'player' && isInvulnerable(target.hurt)) return;

    const { health, died } = applyDamage(target.health, e.amount);
    target.health = health;

    // Knockback: physics owns the body until the timer runs out.
    const kb = knockbackVelocity(
      { x: e.sourceX, y: e.sourceY },
      { x: target.sprite.x, y: target.sprite.y },
      e.knockbackForce,
    );
    target.sprite.setVelocity(kb.vx, kb.vy);
    target.hurt.knockbackRemainingMs = HURT_TUNING.knockbackMs;
    this.flash(target);

    if (target.kind === 'player') {
      target.hurt.invulnerableRemainingMs = HURT_TUNING.playerInvulnMs;
      ctx.bus.emit(GameEvent.PlayerDamaged, { amount: e.amount, sourceId: 'enemy' });
      if (died) {
        ctx.state.player.health = 0;
        ctx.bus.emit(GameEvent.PlayerDied, { playTimeMs: ctx.state.playTimeMs });
      }
      return;
    }

    if (died) this.killEnemy(ctx, target);
  }

  private killEnemy(ctx: SystemContext, enemy: Actor): void {
    // Remove from simulation immediately; the corpse fade is pure presentation.
    ctx.actors.remove(enemy.id);
    ctx.bus.emit(GameEvent.EnemyDied, { entityId: enemy.id, enemyType: enemy.kind });

    const sprite = enemy.sprite;
    (sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    sprite.setTint(0x333333);
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 450,
      onComplete: () => sprite.destroy(),
    });
  }

  /** White hit-flash — cheap, universal "I got hit" feedback.
   *  Phaser 4 note: fill-tinting is `setTint(color)` + `setTintMode(FILL)`
   *  (the old setTintFill(color) is gone), and the mode must be reset. */
  private flash(actor: Actor): void {
    actor.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(HURT_TUNING.flashMs, () => {
      if (!actor.sprite.active) return;
      actor.sprite.clearTint();
      actor.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
    });
  }
}

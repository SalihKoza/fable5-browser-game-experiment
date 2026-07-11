import {
  canSprint,
  createStaminaState,
  stepStamina,
  type StaminaConfig,
  type StaminaState,
} from '../core/stamina';
import type { GameSystem, SystemContext } from './System';

/**
 * Owns the stamina resource and the sprint decision. Runs AFTER CombatSystem
 * (which requests attack costs via frame.staminaSpend) and BEFORE
 * MovementSystem (which consumes frame.sprinting) — see PlayScene's order.
 * One stamina writer; other systems only request (§5).
 *
 * The regen-delay timer is transient runtime state (kept here, not in
 * GameState): losing it across save/load is harmless by design (§8).
 */
export class StaminaSystem implements GameSystem {
  readonly name = 'stamina';
  private stamina: StaminaState;
  private wasSprinting = false;

  constructor(private readonly cfg: StaminaConfig) {
    this.stamina = createStaminaState(cfg);
  }

  update(ctx: SystemContext): void {
    // 1. Apply requested spends (attack costs). Spending arms the regen delay.
    if (ctx.frame.staminaSpend > 0) {
      this.stamina = {
        current: Math.max(0, this.stamina.current - ctx.frame.staminaSpend),
        regenDelayRemainingMs: this.cfg.regenDelayMs,
      };
    }

    // 2. Sprint decision + drain/regen step.
    const moving = ctx.input.axisX !== 0 || ctx.input.axisY !== 0;
    const sprinting =
      ctx.input.sprintHeld &&
      moving &&
      canSprint(this.stamina.current, this.wasSprinting, this.cfg);

    this.stamina = stepStamina(this.stamina, sprinting, ctx.dtMs, this.cfg);
    this.wasSprinting = sprinting;

    // 3. Publish for later systems + mirror into serializable state for UI/save.
    ctx.frame.sprinting = sprinting;
    ctx.state.player.stamina = this.stamina.current;
  }
}

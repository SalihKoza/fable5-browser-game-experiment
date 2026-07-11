import {
  canSprint,
  createStaminaState,
  stepStamina,
  type StaminaConfig,
  type StaminaState,
} from '../core/stamina';
import type { GameSystem, SystemContext } from './System';

/**
 * Owns the sprint decision and the stamina resource. Runs BEFORE
 * MovementSystem (see PlayScene's system order) and publishes the decision on
 * ctx.frame.sprinting — this ordering resolves the stamina⇄movement circular
 * dependency without systems calling each other.
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
    const moving = ctx.input.axisX !== 0 || ctx.input.axisY !== 0;
    const sprinting =
      ctx.input.sprintHeld &&
      moving &&
      canSprint(this.stamina.current, this.wasSprinting, this.cfg);

    this.stamina = stepStamina(this.stamina, sprinting, ctx.dtMs, this.cfg);
    this.wasSprinting = sprinting;

    // Publish for later systems + mirror into serializable state for UI/save.
    ctx.frame.sprinting = sprinting;
    ctx.state.player.stamina = this.stamina.current;
  }
}

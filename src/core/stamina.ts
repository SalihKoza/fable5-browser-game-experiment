/**
 * Stamina rules — pure and framework-free (unit-tested):
 *  - Sprinting while moving drains stamina.
 *  - Regen starts only after a short delay following the last drain
 *    (stamina shouldn't refill between two sprint taps).
 *  - Hysteresis: an ongoing sprint may continue down to 0, but a NEW sprint
 *    cannot start below `restartThreshold` — prevents sprint flicker at empty.
 */

export interface StaminaConfig {
  max: number;
  drainPerSecond: number;
  regenPerSecond: number;
  /** Pause (ms) after draining before regen kicks in. */
  regenDelayMs: number;
  /** Minimum stamina required to START (not continue) a sprint. */
  restartThreshold: number;
}

export interface StaminaState {
  current: number;
  /** Remaining ms until regen resumes. Transient — not part of the save file. */
  regenDelayRemainingMs: number;
}

export function createStaminaState(cfg: StaminaConfig): StaminaState {
  return { current: cfg.max, regenDelayRemainingMs: 0 };
}

/** Hysteresis gate: may the player sprint this tick? */
export function canSprint(
  current: number,
  wasSprinting: boolean,
  cfg: StaminaConfig,
): boolean {
  if (current <= 0) return false;
  return wasSprinting || current >= cfg.restartThreshold;
}

/** Advance stamina by one tick. Returns a new state — no mutation. */
export function stepStamina(
  state: StaminaState,
  sprintingThisTick: boolean,
  dtMs: number,
  cfg: StaminaConfig,
): StaminaState {
  const dt = dtMs / 1000;

  if (sprintingThisTick) {
    return {
      current: Math.max(0, state.current - cfg.drainPerSecond * dt),
      regenDelayRemainingMs: cfg.regenDelayMs,
    };
  }

  // Regen only on ticks that BEGIN with the delay fully elapsed: the tick
  // that consumes the last of the delay does not regen yet. Unambiguous and
  // frame-rate independent (a big dtMs can't smuggle in extra regen).
  const wasDelayed = state.regenDelayRemainingMs > 0;
  return {
    current: wasDelayed
      ? state.current
      : Math.min(cfg.max, state.current + cfg.regenPerSecond * dt),
    regenDelayRemainingMs: Math.max(0, state.regenDelayRemainingMs - dtMs),
  };
}

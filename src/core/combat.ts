/**
 * Combat math — pure and framework-free (unit-tested). Systems apply these
 * results to sprites; the RULES live here where they can be tested headlessly.
 */
import type { Vec2Like } from './state/GameState';

export interface HealthData {
  current: number;
  max: number;
}

export function applyDamage(
  health: HealthData,
  amount: number,
): { health: HealthData; died: boolean } {
  const next = Math.max(0, health.current - amount);
  return {
    health: { ...health, current: next },
    // died fires only on the crossing tick — a corpse can't die twice.
    died: health.current > 0 && next === 0,
  };
}

/** Hurt-reaction timers. Transient runtime data — never saved (§8). */
export interface HurtData {
  /** i-frames: while > 0, new damage is ignored (player only, by policy). */
  invulnerableRemainingMs: number;
  /** While > 0, knockback velocity owns the body — movement input is ignored. */
  knockbackRemainingMs: number;
}

export function createHurtData(): HurtData {
  return { invulnerableRemainingMs: 0, knockbackRemainingMs: 0 };
}

export function stepHurt(hurt: HurtData, dtMs: number): HurtData {
  return {
    invulnerableRemainingMs: Math.max(0, hurt.invulnerableRemainingMs - dtMs),
    knockbackRemainingMs: Math.max(0, hurt.knockbackRemainingMs - dtMs),
  };
}

export function isInvulnerable(hurt: HurtData): boolean {
  return hurt.invulnerableRemainingMs > 0;
}

/**
 * Impulse pushing `target` directly away from `source`. Degenerate case
 * (identical positions) pushes downward instead of dividing by zero.
 */
export function knockbackVelocity(
  source: Vec2Like,
  target: Vec2Like,
  force: number,
): { vx: number; vy: number } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { vx: 0, vy: force };
  return { vx: (dx / len) * force, vy: (dy / len) * force };
}

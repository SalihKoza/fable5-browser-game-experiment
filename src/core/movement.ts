/**
 * Movement math — pure and framework-free, so the "feel" rules are unit-tested:
 * diagonal movement must not be faster (the classic 41% speed bug), and sprint
 * is a plain multiplier.
 */

export interface MovementConfig {
  /** Base speed in px/s. */
  walkSpeed: number;
  /** Sprint speed = walkSpeed * sprintMultiplier. */
  sprintMultiplier: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export function computeVelocity(
  axisX: number,
  axisY: number,
  sprinting: boolean,
  cfg: MovementConfig,
): Velocity {
  const len = Math.hypot(axisX, axisY);
  if (len === 0) return { vx: 0, vy: 0 };

  const speed = cfg.walkSpeed * (sprinting ? cfg.sprintMultiplier : 1);
  // Normalize so diagonals aren't √2 faster than cardinal movement.
  return { vx: (axisX / len) * speed, vy: (axisY / len) * speed };
}

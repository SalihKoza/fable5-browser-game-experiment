/**
 * Input PORT (framework-free). Gameplay code consumes this shape and never
 * sees key codes — the Phaser ADAPTER lives in src/input/ActionMap.ts
 * (ARCHITECTURE.md §9). Only actions Phase 1 uses are declared; the catalogue
 * grows with the roadmap.
 */

export const Action = {
  MoveUp: 'move-up',
  MoveDown: 'move-down',
  MoveLeft: 'move-left',
  MoveRight: 'move-right',
  Sprint: 'sprint',
} as const;
export type Action = (typeof Action)[keyof typeof Action];

/**
 * Immutable per-tick snapshot (§9): input is sampled ONCE per update so every
 * system sees identical input — no mid-tick device reads.
 */
export interface InputSnapshot {
  /** Raw movement axes, each -1 | 0 | 1. Normalization is movement math's job. */
  axisX: number;
  axisY: number;
  sprintHeld: boolean;
}

export const NULL_INPUT: InputSnapshot = Object.freeze({
  axisX: 0,
  axisY: 0,
  sprintHeld: false,
});

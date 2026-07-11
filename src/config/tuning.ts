/**
 * Gameplay tuning — every "feel" number in one file so a balance pass never
 * hunts through systems. Values are px/s and ms.
 */
import type { MovementConfig } from '../core/movement';
import type { StaminaConfig } from '../core/stamina';

export const MOVEMENT_TUNING: MovementConfig = {
  walkSpeed: 70,
  sprintMultiplier: 1.6,
};

export const STAMINA_TUNING: StaminaConfig = {
  max: 100,
  drainPerSecond: 30,
  regenPerSecond: 22,
  regenDelayMs: 700,
  restartThreshold: 15,
};

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

export const PLAYER_COMBAT_TUNING = {
  damage: 25,
  cooldownMs: 420,
  /** Press slightly early and the swing still fires when ready (§9). */
  bufferMs: 150,
  staminaCost: 15,
  /** Hitbox center = player position + facing * reach. */
  reach: 14,
  hitboxWidth: 18,
  hitboxHeight: 18,
  hitboxLifeMs: 110,
  knockbackForce: 170,
} as const;

export const HURT_TUNING = {
  /** Player i-frames after a hit — readable, fair melee (§5). */
  playerInvulnMs: 600,
  /** While knocked back, the body belongs to physics, not to input/AI. */
  knockbackMs: 150,
  /** White hit-flash duration. */
  flashMs: 90,
} as const;

export const LOOT_TUNING = {
  /** Walk-over collection distance (px). */
  pickupRadius: 12,
  /** Chest interaction distance (px). */
  interactRadius: 20,
  /** Inventory capacity (slots, not items). */
  inventorySlots: 12,
} as const;

export interface GhoulTuning {
  maxHealth: number;
  patrolSpeed: number;
  chaseSpeed: number;
  aggroRadius: number;
  /** Beyond this the ghoul loses interest and drifts home (anti-kiting). */
  leashRadius: number;
  /** Close enough to begin a strike. */
  attackRange: number;
  /** The strike still lands slightly outside attackRange (backpedal-proof). */
  strikeRange: number;
  windupMs: number;
  recoverMs: number;
  damage: number;
  knockbackForce: number;
  idlePauseMs: number;
  patrolRadius: number;
}

export const GHOUL_TUNING: GhoulTuning = {
  maxHealth: 50,
  patrolSpeed: 35,
  chaseSpeed: 55,
  aggroRadius: 90,
  leashRadius: 150,
  attackRange: 18,
  strikeRange: 26,
  windupMs: 350,
  recoverMs: 550,
  damage: 15,
  knockbackForce: 150,
  idlePauseMs: 1100,
  patrolRadius: 48,
};
